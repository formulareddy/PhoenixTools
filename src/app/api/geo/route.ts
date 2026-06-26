import { NextRequest } from "next/server"
import { checkSimpleRateLimit, getClientIp } from "@/lib/api-security"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const ip = getClientIp(req)
  const rateLimit = checkSimpleRateLimit(`geo:${ip}`, 30, 60_000)
  if (!rateLimit.allowed) {
    return Response.json(
      { country: "IN", countryName: "India", currency: "INR" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
    )
  }

  try {
    // Try multiple IP detection methods
    const forwarded = req.headers.get("x-forwarded-for")
    const realIp = req.headers.get("x-real-ip")
    const cfIp = req.headers.get("cf-connecting-ip")
    const ip = cfIp || forwarded?.split(",")[0]?.trim() || realIp || "127.0.0.1"

    // Use free ip-api.com (no key needed, 45 req/min)
    try {
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode,country,currency`, {
        next: { revalidate: 86400 },
      })
      const data = await res.json()

      if (data.countryCode) {
        return Response.json({
          country: data.countryCode,
          countryName: data.country,
          currency: data.currency || "USD",
        })
      }
    } catch {
      // ip-api failed, try fallback
    }

    // Fallback: use Vercel/Cloudflare headers
    const countryHeader = req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry")
    if (countryHeader) {
      return Response.json({
        country: countryHeader,
        countryName: "",
        currency: "USD",
      })
    }

    // Default to India
    return Response.json({
      country: "IN",
      countryName: "India",
      currency: "INR",
    })
  } catch {
    return Response.json({
      country: "IN",
      countryName: "India",
      currency: "INR",
    })
  }
}
