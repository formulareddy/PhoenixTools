import { NextResponse } from "next/server"
import { checkSimpleRateLimit, getClientIp } from "@/lib/api-security"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rateLimit = checkSimpleRateLimit(`contact:${ip}`, 5, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
    )
  }

  try {
    const { name, email, subject, message } = await request.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (typeof name !== "string" || typeof email !== "string" || typeof subject !== "string" || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid input types" }, { status: 400 })
    }

    if (name.length > 200 || email.length > 254 || subject.length > 200 || message.length > 5000) {
      return NextResponse.json({ error: "Input too long" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    if (message.trim().length < 10) {
      return NextResponse.json({ error: "Message must be at least 10 characters" }, { status: 400 })
    }

    const accessKey = process.env.WEB3FORMS_ACCESS_KEY
    if (!accessKey) {
      return NextResponse.json({ error: "Email service is not configured." }, { status: 500 })
    }

    const web3Response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        name,
        email,
        subject: `[PhoenixTools] ${subject}`,
        message: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
        from_name: "PhoenixTools Contact Form",
        to: "support.hittools@gmail.com",
      }),
    })

    const result = await web3Response.json()

    if (!web3Response.ok || !result.success) {
      return NextResponse.json(
        { error: "Failed to send message. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: "Your message has been sent successfully!" })
  } catch {
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    )
  }
}
