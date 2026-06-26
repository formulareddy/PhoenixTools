import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { confirmEmailSchema, validateRequest } from "@/lib/auth-validation"
import { checkRateLimit } from "@/lib/rate-limiter"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function findUserByEmail(email: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const res = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    headers: { Authorization: `Bearer ${key}`, apikey: key },
  })
  if (!res.ok) return null
  const { users } = await res.json()
  return users?.[0] || null
}

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
    const validation = validateRequest(confirmEmailSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input. Please check your details and try again." }, { status: 400 })
    }

    const { email } = validation.data

    const authHeader = req.headers.get("authorization")
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

    const user = await findUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 404 })
    }

    if (bearerToken) {
      const userClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${bearerToken}` } },
      })
      const { data: { user: authUser } } = await userClient.auth.getUser()
      if (authUser && authUser.id !== user.id) {
        console.error("[AUTH_CONFIRM_EMAIL] User ID mismatch")
        return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 403 })
      }
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    const confirmRes = await adminClient.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    })

    if (confirmRes.error) {
      console.error("[AUTH_CONFIRM_EMAIL] Failed to confirm email")
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[AUTH_CONFIRM_EMAIL] Unexpected error:", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
