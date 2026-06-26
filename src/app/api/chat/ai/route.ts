import { checkSimpleRateLimit, getClientIp } from "@/lib/api-security"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || ""

const SYSTEM_PROMPT = `You are PhoenixTools AI, a helpful, knowledgeable, and friendly assistant. You answer questions in detail, clearly, and naturally — like a knowledgeable friend. You provide comprehensive, accurate, and well-structured answers. You use markdown formatting for readability. You don't mention that you're searching the web or where your data comes from — you just give the answer directly and confidently.`

async function callOpenRouter(messages: Array<{ role: string; content: string }>): Promise<string | null> {
  if (!OPENROUTER_KEY) return null

  const models = [
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "meta-llama/llama-3.3-70b-versatile:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "qwen/qwen-2.5-72b-instruct:free",
  ]

  for (const model of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          "HTTP-Referer": "https://phoenixtools.ai",
          "X-Title": "PhoenixTools",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          max_tokens: 2048,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (res.ok) {
        const data = await res.json()
        const content = data.choices?.[0]?.message?.content
        if (content && content.length > 10) return content
      }
    } catch {
      continue
    }
  }
  return null
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rateLimit = checkSimpleRateLimit(`chat:${ip}`, 20, 60_000)
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Too many requests. Please wait.", answer: null },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
    )
  }

  try {
    const body = await req.json()
    const { message, context } = body

    if (!message || typeof message !== "string") {
      return Response.json({ error: "Missing message", answer: null }, { status: 400 })
    }

    if (message.length > 10000) {
      return Response.json({ error: "Message too long (max 10,000 characters)", answer: null }, { status: 400 })
    }

    if (context && typeof context === "string" && context.length > 20000) {
      return Response.json({ error: "Context too long", answer: null }, { status: 400 })
    }

    const messages: Array<{ role: string; content: string }> = []

    if (context && typeof context === "string") {
      messages.push({
        role: "user",
        content: `Answer this question clearly and in detail. Give a comprehensive response like a knowledgeable assistant would. Do not mention search results or sources — just give the answer directly.\n\nQuestion: ${message}\n\nContext from web search:\n${context.slice(0, 15000)}`,
      })
    } else {
      messages.push({ role: "user", content: message })
    }

    let answer = await callOpenRouter(messages)

    if (!answer) {
      return Response.json({ error: "AI unavailable", answer: null }, { status: 503 })
    }

    return Response.json({ answer })
  } catch {
    return Response.json({ error: "Failed", answer: null }, { status: 500 })
  }
}
