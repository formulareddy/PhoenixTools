import { checkSimpleRateLimit, getClientIp } from "@/lib/api-security"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface SearchResult {
  title: string
  url: string
  snippet: string
}

function decodeDDGUrl(url: string): string {
  try {
    const uddgMatch = url.match(/uddg=([^&]+)/)
    if (uddgMatch) {
      return decodeURIComponent(uddgMatch[1])
    }
  } catch {}
  return url
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) throw new Error(`DuckDuckGo returned ${res.status}`)

  const html = await res.text()
  const results: SearchResult[] = []
  const seen = new Set<string>()

  // Match result-link with either single or double quotes
  const linkRegex = /<a[^>]+class=['"]?result-link['"]?[^>]*href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/gi
  let match

  while ((match = linkRegex.exec(html)) !== null) {
    const rawUrl = match[1].trim()
    const title = cleanText(match[2])

    if (!title || title.length < 3) continue

    const decodedUrl = decodeDDGUrl(rawUrl)
    if (seen.has(decodedUrl)) continue
    if (decodedUrl.includes("duckduckgo.com")) continue

    seen.add(decodedUrl)
    results.push({ title, url: decodedUrl, snippet: "" })
  }

  // Extract snippets - they appear in <td class='result-snippet'> blocks
  const snippetRegex = /class=['"]?result-snippet['"]?[^>]*>([\s\S]*?)<\/td>/gi
  const snippets: string[] = []
  while ((match = snippetRegex.exec(html)) !== null) {
    snippets.push(cleanText(match[1]))
  }

  // Assign snippets to results
  for (let i = 0; i < results.length && i < snippets.length; i++) {
    if (snippets[i]) {
      results[i].snippet = snippets[i]
    }
  }

  // Fallback: extract any external links with titles
  if (results.length === 0) {
    const fallbackRegex = /<a[^>]+href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/gi
    while ((match = fallbackRegex.exec(html)) !== null) {
      const rawUrl = match[1]
      const title = cleanText(match[2])

      if (!title || title.length < 5) continue

      const decodedUrl = decodeDDGUrl(rawUrl)
      if (seen.has(decodedUrl)) continue
      if (decodedUrl.includes("duckduckgo.com")) continue
      if (!decodedUrl.startsWith("http")) continue

      seen.add(decodedUrl)
      results.push({ title, url: decodedUrl, snippet: "" })
      if (results.length >= 5) break
    }
  }

  return results
}

async function searchSearXNG(query: string): Promise<SearchResult[]> {
  // Use a public SearXNG instance as fallback
  const instances = [
    "https://search.bus-hit.me",
    "https://searx.tiekoetter.com",
    "https://search.ononoki.org",
  ]

  for (const instance of instances) {
    try {
      const url = `${instance}/search?q=${encodeURIComponent(query)}&format=json&categories=general`
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) continue

      const data = await res.json()
      if (data.results && Array.isArray(data.results)) {
        return data.results.slice(0, 8).map((r: any) => ({
          title: r.title || "",
          url: r.url || "",
          snippet: r.content || "",
        }))
      }
    } catch {
      continue
    }
  }

  throw new Error("All SearXNG instances failed")
}

export async function GET(req: Request) {
  const ip = getClientIp(req)
  const rateLimit = checkSimpleRateLimit(`search:${ip}`, 15, 60_000)
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Too many requests", results: [] },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
    )
  }

  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")

    if (!query || query.trim().length === 0) {
      return Response.json({ error: "Missing query parameter ?q=", results: [] }, { status: 400 })
    }

    if (query.length > 500) {
      return Response.json({ error: "Query too long", results: [] }, { status: 400 })
    }

    let results: SearchResult[] = []

    try {
      results = await searchDuckDuckGo(query)
    } catch {}

    if (results.length === 0) {
      try {
        results = await searchSearXNG(query)
      } catch {}
    }

    return Response.json({ results, query })
  } catch (error) {
    return Response.json({ error: "Search failed", results: [] }, { status: 500 })
  }
}
