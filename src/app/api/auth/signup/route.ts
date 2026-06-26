import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { signupSchema, validateRequest, sanitizeInput } from "@/lib/auth-validation"
import { checkRateLimit } from "@/lib/rate-limiter"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(req: NextRequest) {
  try {
    const rateCheck = await checkRateLimit(req)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter) } }
      )
    }

    const body = await req.json()
    const validation = validateRequest(signupSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { email, password, username, displayName } = validation.data
    const sanitizedUsername = sanitizeInput(username)
    const sanitizedDisplayName = displayName ? sanitizeInput(displayName) : sanitizedUsername

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const { data: newUserData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username: sanitizedUsername,
        full_name: sanitizedDisplayName,
        has_password: true,
      },
    })

    if (createError) {
      const msg = createError.message?.toLowerCase() || ""
      if (msg.includes("already") || msg.includes("duplicate") || msg.includes("exists")) {
        return NextResponse.json(
          { error: "If that email is registered, you can sign in with your existing account." },
          { status: 409 }
        )
      }
      console.error("[AUTH_SIGNUP] Failed to create user:", createError.message)
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
    }

    if (!newUserData?.user) {
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
    }

    const signInRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ email, password }),
    })

    const signInData = await signInRes.json()

    if (!signInData.access_token || !signInData.refresh_token) {
      return NextResponse.json({
        success: true,
        message: "Account created. Please sign in.",
      })
    }

    return NextResponse.json({
      success: true,
      access_token: signInData.access_token,
      refresh_token: signInData.refresh_token,
    })
  } catch (error) {
    console.error("[AUTH_SIGNUP] Unexpected error:", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
