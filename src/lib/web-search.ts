export interface WebSearchResult {
  title: string
  url: string
  snippet: string
}

export interface WebSearchResponse {
  results: WebSearchResult[]
  query: string
  error?: string
}

export async function searchWeb(query: string): Promise<WebSearchResponse> {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(12000),
    })

    if (!res.ok) {
      return { results: [], query, error: `Search failed (${res.status})` }
    }

    return await res.json()
  } catch (error) {
    return { results: [], query, error: "Search unavailable" }
  }
}

export async function fetchPageContent(url: string): Promise<string> {
  try {
    const res = await fetch(`/api/search/content?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return ""

    const data = await res.json()
    return data.content || ""
  } catch {
    return ""
  }
}

function cleanAnswer(text: string, query: string): string {
  let cleaned = text
    .replace(/\[\d+\]/g, "")
    .replace(/\[edit\]/gi, "")
    .replace(/\[citation needed\]/gi, "")
    .replace(/\[dubious – discuss\]/gi, "")
    .replace(/\[clarification needed\]/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  const sentences = cleaned.split(/(?<=[.!?])\s+/)
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  const relevant: string[] = []
  const seen = new Set<string>()

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase()
    const isRelevant = queryWords.some((w) => lower.includes(w))
    const isDuplicate = seen.has(sentence.trim().slice(0, 50))

    if ((isRelevant || relevant.length < 8) && !isDuplicate && sentence.trim().length > 20) {
      relevant.push(sentence.trim())
      seen.add(sentence.trim().slice(0, 50))
    }

    if (relevant.length >= 12) break
  }

  if (relevant.length === 0 && sentences.length > 0) {
    for (let i = 0; i < Math.min(10, sentences.length); i++) {
      if (sentences[i].trim().length > 20) {
        relevant.push(sentences[i].trim())
      }
    }
  }

  return relevant.join(" ")
}

export async function buildDetailedAnswer(query: string, searchResults: WebSearchResult[]): Promise<string> {
  if (!searchResults || searchResults.length === 0) {
    return `I searched for "${query}" but couldn't find specific results right now. Could you try rephrasing your question?`
  }

  const sorted = [...searchResults].sort((a, b) => {
    const aDomain = a.url ? new URL(a.url).hostname : ""
    const bDomain = b.url ? new URL(b.url).hostname : ""
    const goodSites = ["wikipedia.org", "britannica.com", "imdb.com", "rottentomatoes.com", "marvel.com", "dc.com", "fandom.com"]
    const aGood = goodSites.some((s) => aDomain.includes(s))
    const bGood = goodSites.some((s) => bDomain.includes(s))
    if (aGood && !bGood) return -1
    if (!aGood && bGood) return 1
    return 0
  })

  const urlsToFetch = sorted.slice(0, 3).map((r) => r.url).filter(Boolean)
  const contents: string[] = []

  const fetches = urlsToFetch.map((url) => fetchPageContent(url))
  const results = await Promise.allSettled(fetches)

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      contents.push(result.value)
    }
  }

  if (contents.length === 0) {
    const wikiResult = searchResults.find((r) => r.url.includes("wikipedia.org"))
    const best = wikiResult || searchResults[0]
    const title = best.title.replace(/ - .+$/, "").replace(/ \| .+$/, "").replace(/ — .+$/, "").trim()
    let answer = `**${title}**\n\n`

    if (best.snippet) {
      answer += best.snippet + "\n\n"
    }

    if (best.url) {
      const wikiContent = await fetchPageContent(best.url)
      if (wikiContent && wikiContent.length > 200) {
        const cleaned = cleanAnswer(wikiContent, query)
        if (cleaned.length > 100) {
          return cleaned.slice(0, 2500)
        }
      }
    }

    const otherResults = searchResults.slice(1, 4).filter((r) => r.title !== best.title)
    if (otherResults.length > 0) {
      answer += "**More information:**\n"
      for (const r of otherResults) {
        const t = r.title.replace(/ - .+$/, "").replace(/ \| .+$/, "").replace(/ — .+$/, "").trim()
        if (r.snippet) {
          answer += `• ${t}: ${r.snippet}\n`
        } else {
          answer += `• ${t}\n`
        }
      }
    }

    return answer.trim()
  }

  const combined = contents.join("\n\n")
  const answer = cleanAnswer(combined, query)

  if (answer.length > 100) {
    const firstPart = answer.slice(0, 2500)
    return firstPart
  }

  const best = searchResults[0]
  const title = best.title.replace(/ - .+$/, "").replace(/ \| .+$/, "").replace(/ — .+$/, "").trim()
  let fallback = `**${title}**\n\n`
  if (best.snippet) fallback += best.snippet + "\n\n"
  fallback += answer
  return fallback.trim()
}

export function shouldSearchWeb(query: string): boolean {
  const lower = query.toLowerCase().trim()

  if (lower.length < 3) return false

  const greetings = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"]
  if (greetings.some((g) => lower === g || lower.startsWith(g + " ") || lower.startsWith(g + "!"))) return false

  const closings = ["bye", "goodbye", "see you", "thank", "thanks"]
  if (closings.some((c) => lower.startsWith(c))) return false

  const meta = ["who are you", "what are you", "your name", "what can you do"]
  if (meta.some((m) => lower === m)) return false

  return true
}
