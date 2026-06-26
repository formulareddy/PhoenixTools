import { buildSystemPrompt, filterSensitiveContent, isSensitiveQuery } from "./chat-security"

interface AIConfig {
  provider: "auto" | "groq" | "openrouter" | "openai" | "local"
  apiKey: string
  model: string
}

const AI_CONFIG_KEY = "phoenixtools-ai-config"

function getConfig(): AIConfig {
  try {
    const saved = localStorage.getItem(AI_CONFIG_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return { provider: "auto", apiKey: "", model: "auto" }
}

export function setConfig(config: AIConfig) {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config))
  } catch {}
}

export function getConfigured(): AIConfig {
  return getConfig()
}

const PROVIDERS = {
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    defaultModel: "llama-3.3-70b-versatile",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    models: ["meta-llama/llama-3.3-70b-instruct:free", "mistralai/mistral-7b-instruct:free", "google/gemma-2-9b-it:free"],
    defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    models: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gpt-4o"],
    defaultModel: "gpt-3.5-turbo",
  },
}

async function tryProvider(provider: string, apiKey: string, model: string, query: string): Promise<string | null> {
  const config = PROVIDERS[provider as keyof typeof PROVIDERS]
  if (!config || !apiKey) return null

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }

    if (provider === "openrouter") {
      headers["HTTP-Referer"] = "https://phoenixtools.ai"
      headers["X-Title"] = "PhoenixTools"
    }

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: model || config.defaultModel,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: query },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (response.ok) {
      const data = await response.json()
      return data.choices?.[0]?.message?.content || null
    }
  } catch {}
  return null
}

async function callServerAI(message: string, context?: string): Promise<string | null> {
  try {
    const body: Record<string, string> = { message }
    if (context) body.context = context

    const res = await fetch("/api/chat/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })

    if (res.ok) {
      const data = await res.json()
      return data.answer || null
    }
  } catch {}
  return null
}

export async function callFreeAI(query: string, searchContext?: string): Promise<{ text: string; provider: string } | null> {
  if (isSensitiveQuery(query)) {
    return { text: "I cannot help with that request for security reasons.", provider: "blocked" }
  }

  const config = getConfig()

  if (config.provider !== "local" && config.apiKey) {
    if (config.provider === "auto") {
      const autoProviders: Array<{ id: string; model: string }> = [
        { id: "groq", model: PROVIDERS.groq.defaultModel },
        { id: "openrouter", model: PROVIDERS.openrouter.defaultModel },
        { id: "openai", model: PROVIDERS.openai.defaultModel },
      ]

      for (const p of autoProviders) {
        const result = await tryProvider(p.id, config.apiKey, p.model, query)
        if (result) {
          return { text: filterSensitiveContent(result), provider: p.id }
        }
      }
    } else {
      const model = config.model === "auto" ? PROVIDERS[config.provider as keyof typeof PROVIDERS]?.defaultModel || "" : config.model
      const result = await tryProvider(config.provider, config.apiKey, model, query)
      if (result) {
        return { text: filterSensitiveContent(result), provider: config.provider }
      }
    }
  }

  const serverAnswer = await callServerAI(query, searchContext)
  if (serverAnswer) {
    return { text: filterSensitiveContent(serverAnswer), provider: "ai" }
  }

  return null
}

export function isAIConfigured(): boolean {
  const config = getConfig()
  return config.provider !== "local" && config.apiKey.length > 0
}

export function getProviderInfo() {
  return {
    providers: [
      { id: "groq", name: "Groq", url: "https://console.groq.com", models: PROVIDERS.groq.models },
      { id: "openrouter", name: "OpenRouter", url: "https://openrouter.ai", models: PROVIDERS.openrouter.models },
      { id: "openai", name: "OpenAI", url: "https://platform.openai.com", models: PROVIDERS.openai.models },
    ],
  }
}
