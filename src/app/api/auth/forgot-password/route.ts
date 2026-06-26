import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limiter"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: Request) {
  const rateLimit = await checkRateLimit(req)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: rateLimit.retryAfter ? { "Retry-After": String(rateLimit.retryAfter) } : {} }
    )
  }

  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase()

    const usersRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(normalizedEmail)}`,
      { headers: { Authorization: `Bearer ${supabaseServiceKey}`, apikey: supabaseServiceKey } }
    )
    const { users: foundUsers } = await usersRes.json()
    const existingUser = foundUsers?.[0]

    if (existingUser) {
      const magicLinkRes = await fetch(`${supabaseUrl}/auth/v1/magiclink`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          email: normalizedEmail,
          data: { action: "password_reset" },
        }),
      })

      if (!magicLinkRes.ok) {
        const err = await magicLinkRes.json()
        console.error("[ForgotPassword] Magic link failed:", err)
      }
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, a reset link has been sent.",
    })
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
