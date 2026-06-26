import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { loginSchema, validateRequest } from "@/lib/auth-validation"
import { checkRateLimit, checkLockout, recordFailedAttempt, clearFailedAttempts } from "@/lib/rate-limiter"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const GENERIC_ERROR = "Incorrect email or password"

export async function POST(req: NextRequest) {
  try {
    const rateCheck = await checkRateLimit(req)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: GENERIC_ERROR },
        { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter) } }
      )
    }

    const body = await req.json()
    const validation = validateRequest(loginSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 })
    }

    const { email, password } = validation.data

    const lockout = await checkLockout(email)
    if (lockout.locked) {
      console.error(`[AUTH_LOGIN] Login blocked for locked account`)
      return NextResponse.json(
        { error: GENERIC_ERROR },
        { status: 429, headers: { "Retry-After": String(lockout.retryAfter) } }
      )
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
      const result = await recordFailedAttempt(email)
      if (result.locked) {
        console.error(`[AUTH_LOGIN] Account locked after ${result.attempts} failed attempts`)
      }
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
    }

    await clearFailedAttempts(email)

    return NextResponse.json({
      success: true,
      access_token: signInData.access_token,
      refresh_token: signInData.refresh_token,
    })
  } catch (error) {
    console.error("[AUTH_LOGIN] Unexpected error:", error)
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 })
  }
}
