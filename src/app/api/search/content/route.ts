import { isPrivateUrl, checkSimpleRateLimit, getClientIp } from "@/lib/api-security"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function extractContent(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")

  text = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, " — ")
    .replace(/<[^>]+>/g, " ")

  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "...")

  text = text
    .replace(/\t/g, " ")
    .replace(/ {3,}/g, "  ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  const lines = text.split("\n").filter((line) => {
    const trimmed = line.trim()
    if (trimmed.length < 10) return false
    if (/^[{}\[\]();:,.<>=+\-*/\\|&%$#@!~`'"?]+$/.test(trimmed)) return false
    if (/^\d+\s*$/.test(trimmed)) return false
    return true
  })

  return lines.join("\n").trim()
}

export async function GET(req: Request) {
  const ip = getClientIp(req)
  const rateLimit = checkSimpleRateLimit(`search:${ip}`, 15, 60_000)
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Too many requests", content: "" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
    )
  }

  try {
    const { searchParams } = new URL(req.url)
    const url = searchParams.get("url")

    if (!url || !url.startsWith("http")) {
      return Response.json({ error: "Invalid URL", content: "" }, { status: 400 })
    }

    if (isPrivateUrl(url)) {
      return Response.json({ error: "URL not allowed", content: "" }, { status: 403 })
    }

    const parsedUrl = new URL(url)
    if (parsedUrl.pathname.length > 2048) {
      return Response.json({ error: "URL too long", content: "" }, { status: 400 })
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    })

    if (!res.ok) {
      return Response.json({ error: "Failed to fetch", content: "" }, { status: 502 })
    }

    const contentType = res.headers.get("content-type") || ""
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return Response.json({ error: "Not HTML", content: "" }, { status: 400 })
    }

    const html = await res.text()
    const content = extractContent(html)
    const truncated = content.slice(0, 4000)

    return Response.json({ content: truncated, url })
  } catch {
    return Response.json({ error: "Failed to fetch content", content: "" }, { status: 500 })
  }
}
