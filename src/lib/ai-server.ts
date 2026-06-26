import { readFile, writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"

export interface AIProgress {
  state: string
  pct: number
  detail?: string
}

export interface AIJobResult {
  outputPath: string
  outputName: string
  outputSize: number
  originalSize: number
  originalName: string
  metadata?: Record<string, any>
}

type OnProgress = (evt: AIProgress) => void

const BASE = join(tmpdir(), "phoenixtools-ai")

async function createJobDir(jobId: string): Promise<string> {
  const dir = join(BASE, jobId)
  await mkdir(dir, { recursive: true })
  return dir
}

// ─── Smart Model Router (Auto-selects best free model per task) ──

// Free models on OpenCode Zen:
// - deepseek-v4-flash-free: Best for writing, content, chat (fast + creative)
// - mimo-v2.5-free: Best for summarization, grammar, understanding (accurate)
// - nemotron-3-ultra-free: Best for translation, rewriting (multilingual)
// - north-mini-code-free: Best for code generation (code-focused)
// - big-pickle: Stealth model, general purpose

interface ProviderConfig {
  name: string
  baseUrl: string
  apiKey: string
  models: Record<string, string>
}

// Auto-select the best free model based on task type
function selectBestModel(toolId: string): string {
  const modelMap: Record<string, string> = {
    // Writing tasks → DeepSeek V4 Flash Free (creative + fast)
    "ai-writer": "deepseek-v4-flash-free",
    "ai-blog": "deepseek-v4-flash-free",
    "ai-email": "deepseek-v4-flash-free",
    "ai-cover-letter": "deepseek-v4-flash-free",
    "ai-resume": "deepseek-v4-flash-free",
    "ai-chat": "deepseek-v4-flash-free",

    // Understanding tasks → MiMo V2.5 Free (accurate comprehension)
    "ai-summarize": "mimo-v2.5-free",
    "ai-grammar": "mimo-v2.5-free",
    "ai-social": "mimo-v2.5-free",

    // Multilingual tasks → Nemotron 3 Ultra Free (best translation)
    "ai-translate": "nemotron-3-ultra-free",
    "ai-rewrite": "nemotron-3-ultra-free",
    "ai-paraphrase": "nemotron-3-ultra-free",

    // Code tasks → North Mini Code Free (code specialist)
    "ai-code": "north-mini-code-free",
  }
  return modelMap[toolId] || "deepseek-v4-flash-free"
}

function getProviders(): ProviderConfig[] {
  const providers: ProviderConfig[] = []

  // OpenCode Zen (primary - free models)
  if (process.env.OPENCODE_API_KEY || process.env.ZEN_API_KEY) {
    providers.push({
      name: "opencode-zen",
      baseUrl: "https://opencode.ai/zen/v1/chat/completions",
      apiKey: process.env.OPENCODE_API_KEY || process.env.ZEN_API_KEY || "",
      models: {
        "ai-writer": "deepseek-v4-flash-free",
        "ai-summarize": "mimo-v2.5-free",
        "ai-rewrite": "nemotron-3-ultra-free",
        "ai-resume": "deepseek-v4-flash-free",
        "ai-chat": "deepseek-v4-flash-free",
        "ai-translate": "nemotron-3-ultra-free",
        "ai-grammar": "mimo-v2.5-free",
        "ai-email": "deepseek-v4-flash-free",
        "ai-cover-letter": "deepseek-v4-flash-free",
        "ai-blog": "deepseek-v4-flash-free",
        "ai-social": "mimo-v2.5-free",
        "ai-paraphrase": "nemotron-3-ultra-free",
        "ai-code": "north-mini-code-free",
      },
    })
  }

  // OpenRouter (fallback with free models)
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      name: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: process.env.OPENROUTER_API_KEY || "",
      models: {
        "ai-writer": "deepseek/deepseek-v4-flash:free",
        "ai-summarize": "deepseek/deepseek-v4-flash:free",
        "ai-rewrite": "nvidia/nemotron-3-ultra-550b-a55b:free",
        "ai-resume": "deepseek/deepseek-v4-flash:free",
        "ai-chat": "deepseek/deepseek-v4-flash:free",
        "ai-translate": "nvidia/nemotron-3-ultra-550b-a55b:free",
        "ai-grammar": "deepseek/deepseek-v4-flash:free",
        "ai-email": "deepseek/deepseek-v4-flash:free",
        "ai-cover-letter": "deepseek/deepseek-v4-flash:free",
        "ai-blog": "deepseek/deepseek-v4-flash:free",
        "ai-social": "deepseek/deepseek-v4-flash:free",
        "ai-paraphrase": "nvidia/nemotron-3-ultra-550b-a55b:free",
        "ai-code": "deepseek/deepseek-v4-flash:free",
      },
    })
  }

  return providers
}

function selectProvider(toolId: string): { provider: ProviderConfig; model: string } | null {
  const providers = getProviders()
  if (providers.length === 0) return null

  // Try primary provider (OpenCode Zen) first
  const primary = providers[0]
  if (primary) {
    const model = primary.models[toolId] || selectBestModel(toolId)
    return { provider: primary, model }
  }

  // Fallback to secondary (OpenRouter)
  if (providers[1]) {
    const model = providers[1].models[toolId] || "deepseek/deepseek-v4-flash:free"
    return { provider: providers[1], model }
  }

  return null
}

// ─── Streaming AI Call ─────────────────────────────────────────

export async function streamAIResponse(
  toolId: string,
  messages: { role: string; content: string }[],
  onChunk: (chunk: string) => void,
  onDone: (fullText: string) => void,
  onError: (err: string) => void
): Promise<void> {
  const route = selectProvider(toolId)
  if (!route) {
    onError("No AI provider configured. Set OPENCODE_API_KEY or OPENROUTER_API_KEY in .env.local")
    return
  }

  const { provider, model } = route

  try {
    const resp = await fetch(provider.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${provider.apiKey}`,
        "HTTP-Referer": "https://phoenixtools.ai",
        "X-Title": "PhoenixTools AI",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        max_tokens: 4096,
        temperature: 0.7,
      }),
    })

    if (!resp.ok) {
      const errBody = await resp.text()
      // Try fallback provider
      const fallbackProviders = getProviders()
      const fallback = fallbackProviders.find(p => p.name !== provider.name)
      if (fallback) {
        const fallbackModel = fallback.models[toolId] || model
        const retryResp = await fetch(fallback.baseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${fallback.apiKey}`,
            "HTTP-Referer": "https://phoenixtools.ai",
            "X-Title": "PhoenixTools AI",
          },
          body: JSON.stringify({
            model: fallbackModel,
            messages,
            stream: true,
            max_tokens: 4096,
            temperature: 0.7,
          }),
        })
        if (!retryResp.ok) {
          onError(`AI provider error: ${retryResp.status}`)
          return
        }
        return processStreamResponse(retryResp, onChunk, onDone, onError)
      }
      onError(`AI provider error: ${resp.status} - ${errBody.slice(0, 200)}`)
      return
    }

    return processStreamResponse(resp, onChunk, onDone, onError)
  } catch (err: any) {
    onError(err.message || "AI request failed")
  }
}

function processStreamResponse(
  resp: Response,
  onChunk: (chunk: string) => void,
  onDone: (fullText: string) => void,
  onError: (err: string) => void
): void {
  const reader = resp.body?.getReader()
  if (!reader) { onError("No response stream"); return }

  const decoder = new TextDecoder()
  let buffer = ""
  let fullText = ""

  const processChunk = async () => {
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith("data: ")) continue
          const data = trimmed.slice(6)
          if (data === "[DONE]") { onDone(fullText); return }
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              fullText += content
              onChunk(content)
            }
          } catch {}
        }
      }
      onDone(fullText)
    } catch (err: any) {
      onError(err.message || "Stream read error")
    }
  }

  processChunk()
}

// ─── Non-streaming AI Call (for shorter responses) ─────────────

export async function callAI(
  toolId: string,
  messages: { role: string; content: string }[],
  maxTokens: number = 4096
): Promise<string> {
  const route = selectProvider(toolId)
  if (!route) throw new Error("No AI provider configured")

  const { provider, model } = route

  const resp = await fetch(provider.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${provider.apiKey}`,
      "HTTP-Referer": "https://phoenixtools.ai",
      "X-Title": "PhoenixTools AI",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  })

  if (!resp.ok) {
    const errBody = await resp.text()
    // Try fallback
    const fallbackProviders = getProviders()
    const fallback = fallbackProviders.find(p => p.name !== provider.name)
    if (fallback) {
      const fallbackModel = fallback.models[toolId] || model
      const retryResp = await fetch(fallback.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${fallback.apiKey}`,
          "HTTP-Referer": "https://phoenixtools.ai",
          "X-Title": "PhoenixTools AI",
        },
        body: JSON.stringify({
          model: fallbackModel,
          messages,
          stream: false,
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      })
      if (!retryResp.ok) throw new Error(`AI error: ${retryResp.status}`)
      const data = await retryResp.json()
      return data.choices?.[0]?.message?.content || ""
    }
    throw new Error(`AI error: ${resp.status} - ${errBody.slice(0, 200)}`)
  }

  const data = await resp.json()
  return data.choices?.[0]?.message?.content || ""
}

// ─── Tool-Specific Prompt Builders ─────────────────────────────

const PROMPTS: Record<string, (options: Record<string, string>) => { system: string; user: string }> = {
  "ai-writer": (o) => ({
    system: "You are a professional content writer. Write high-quality, engaging content. Use proper formatting with headings, paragraphs, and bullet points where appropriate. Be concise and impactful.",
    user: `Write about: ${o.topic || "the given topic"}\n\nStyle: ${o.style || "professional"}\nTone: ${o.tone || "informative"}\nLength: ${o.length || "medium"}\n${o.additional ? `Additional instructions: ${o.additional}` : ""}`,
  }),
  "ai-summarize": (o) => ({
    system: "You are an expert summarizer. Create clear, concise summaries that capture the key points. Use bullet points for main ideas.",
    user: `Summarize the following text in ${o.length || "3-5 sentences"}:\n\n${o.text || o.content || ""}`,
  }),
  "ai-rewrite": (o) => ({
    system: "You are a professional rewriter. Rewrite text while preserving the original meaning but changing the style, tone, or structure as requested.",
    user: `Rewrite the following text in ${o.style || "a more professional style"}:\n\n${o.text || o.content || ""}`,
  }),
  "ai-ocr": (o) => ({
    system: "You are an expert OCR assistant. Extract all visible text from the provided image or document. Maintain the original structure, formatting, and hierarchy. Output clean, accurate text.",
    user: `Extract all text from this ${o.originalFileName || "document"}. Output format: ${o.format || "text"}${o.language && o.language !== "auto" ? `. Primary language: ${o.language}` : ""}.\n\nFile: ${o.originalFileName || "Unknown"}\n\nExtract the text accurately:`,
  }),
  "ai-resume": (o) => ({
    system: "You are a professional resume writer. Create compelling, ATS-friendly resume content. Use action verbs, quantify achievements, and highlight relevant skills.",
    user: `Create resume content for:\nName: ${o.name || "Candidate"}\nPosition: ${o.position || "Target role"}\nExperience: ${o.experience || "Provide details"}\nSkills: ${o.skills || "Provide skills"}\nEducation: ${o.education || "Provide education"}`,
  }),
  "ai-chat": (o) => ({
    system: o.systemPrompt || "You are a helpful, knowledgeable AI assistant. Provide clear, accurate, and helpful responses. Be concise but thorough.",
    user: o.message || o.question || "",
  }),
  "ai-translate": (o) => ({
    system: `You are a professional translator. Translate text accurately into ${o.targetLanguage || "English"}. Preserve the original tone and meaning. Do not add explanations unless requested.`,
    user: `Translate the following text into ${o.targetLanguage || "English"}:\n\n${o.text || o.content || ""}`,
  }),
  "ai-grammar": (o) => ({
    system: "You are an expert grammar and spelling checker. Fix all grammar, spelling, punctuation, and style errors. Return the corrected text with improvements. List the changes you made.",
    user: `Fix grammar, spelling, and style in the following text:\n\n${o.text || o.content || ""}`,
  }),
  "ai-email": (o) => ({
    system: "You are a professional email writer. Craft clear, compelling emails with appropriate tone and structure. Include subject line, greeting, body, and sign-off.",
    user: `Write a ${o.type || "professional"} email:\nSubject: ${o.subject || "Topic"}\nTo: ${o.to || "Recipient"}\nPurpose: ${o.purpose || "Describe the purpose"}\nTone: ${o.tone || "professional"}`,
  }),
  "ai-cover-letter": (o) => ({
    system: "You are a professional cover letter writer. Create compelling, personalized cover letters that highlight relevant experience and enthusiasm for the role.",
    user: `Write a cover letter for:\nPosition: ${o.position || "Target role"}\nCompany: ${o.company || "Company name"}\nYour experience: ${o.experience || "Provide details"}\nWhy this role: ${o.motivation || "Your motivation"}`,
  }),
  "ai-blog": (o) => ({
    system: "You are an expert blog writer. Create engaging, SEO-friendly blog posts with compelling introductions, well-structured sections, and strong conclusions. Use headings and subheadings.",
    user: `Write a blog post about: ${o.topic || "the given topic"}\nTarget audience: ${o.audience || "general readers"}\nLength: ${o.length || "1000-1500 words"}\nTone: ${o.tone || "engaging and informative"}\n${o.keywords ? `Include keywords: ${o.keywords}` : ""}`,
  }),
  "ai-social": (o) => ({
    system: "You are a social media content expert. Create engaging, platform-optimized posts with appropriate hashtags, emojis, and calls to action.",
    user: `Create ${o.platform || "social media"} content about: ${o.topic || "the given topic"}\nStyle: ${o.style || "engaging and shareable"}\n${o.audience ? `Target audience: ${o.audience}` : ""}`,
  }),
  "ai-paraphrase": (o) => ({
    system: "You are an expert paraphraser. Rewrite text to convey the same meaning using different words and sentence structures. Maintain the original tone.",
    user: `Paraphrase the following in ${o.style || "a clear, professional style"}:\n\n${o.text || o.content || ""}`,
  }),
  "ai-code": (o) => ({
    system: "You are an expert programmer. Generate clean, efficient, well-documented code. Include comments explaining key parts. Follow best practices for the language.",
    user: `Generate ${o.language || "Python"} code for:\n${o.description || o.prompt || ""}\n${o.requirements ? `Requirements: ${o.requirements}` : ""}`,
  }),
  "ai-image-gen": (o) => ({
    system: "You are an AI image generation assistant. Describe in detail what the image should look like based on the user's prompt. Be specific about composition, colors, lighting, style, and mood.",
    user: `Generate an image: ${o.prompt || o.description || ""}\nStyle: ${o.style || "realistic"}\nAspect Ratio: ${o.aspectRatio || "1:1"}\n\nProvide a detailed description of what this image would look like:`,
  }),
}

// ─── Job Processors ────────────────────────────────────────────

export async function processAIText(
  toolId: string,
  options: Record<string, string>,
  onProgress: OnProgress,
  outputExt: string = ".txt"
): Promise<AIJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)

  const promptBuilder = PROMPTS[toolId]
  if (!promptBuilder) throw new Error(`Unknown AI tool: ${toolId}`)

  const { system, user } = promptBuilder(options)
  const messages = [
    { role: "system", content: system },
    { role: "user", content: user },
  ]

  onProgress({ state: "processing", pct: 10, detail: "Generating with AI..." })

  let fullText = ""
  let chunkCount = 0

  await new Promise<void>((resolve, reject) => {
    streamAIResponse(
      toolId,
      messages,
      (chunk) => {
        chunkCount++
        fullText += chunk
        const pct = Math.min(10 + (chunkCount * 2), 95)
        onProgress({ state: "generating", pct, detail: `Generating... ${fullText.length} characters` })
      },
      (text) => { fullText = text; resolve() },
      (err) => { reject(new Error(err)) }
    )
  })

  onProgress({ state: "saving", pct: 95, detail: "Saving result..." })

  const outName = `${toolId.replace("ai-", "")}-${Date.now()}${outputExt}`
  const outputPath = join(dir, `output${outputExt}`)
  await writeFile(outputPath, fullText, "utf-8")

  const meta = { jobId, toolId, originalSize: 0, outputSize: Buffer.byteLength(fullText, "utf-8"), outputName: outName, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  onProgress({ state: "done", pct: 100, detail: "Complete" })

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: 0, originalName: "", metadata: meta }
}

export async function processAIWithInput(
  toolId: string,
  inputText: string,
  options: Record<string, string>,
  onProgress: OnProgress,
  outputExt: string = ".txt"
): Promise<AIJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)

  const promptBuilder = PROMPTS[toolId]
  if (!promptBuilder) throw new Error(`Unknown AI tool: ${toolId}`)

  const mergedOptions = { ...options, text: inputText, content: inputText }
  const { system, user } = promptBuilder(mergedOptions)
  const messages = [
    { role: "system", content: system },
    { role: "user", content: user },
  ]

  onProgress({ state: "processing", pct: 10, detail: "Analyzing input..." })

  let fullText = ""
  let chunkCount = 0

  await new Promise<void>((resolve, reject) => {
    streamAIResponse(
      toolId,
      messages,
      (chunk) => {
        chunkCount++
        fullText += chunk
        const pct = Math.min(10 + (chunkCount * 2), 95)
        onProgress({ state: "generating", pct, detail: `Generating... ${fullText.length} characters` })
      },
      (text) => { fullText = text; resolve() },
      (err) => { reject(new Error(err)) }
    )
  })

  onProgress({ state: "saving", pct: 95, detail: "Saving result..." })

  const outName = `${toolId.replace("ai-", "")}-${Date.now()}${outputExt}`
  const outputPath = join(dir, `output${outputExt}`)
  await writeFile(outputPath, fullText, "utf-8")

  const meta = { jobId, toolId, originalSize: Buffer.byteLength(inputText, "utf-8"), outputSize: Buffer.byteLength(fullText, "utf-8"), outputName: outName, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  onProgress({ state: "done", pct: 100, detail: "Complete" })

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: meta.originalSize, originalName: "", metadata: meta }
}

// ─── File-based AI Processing (for OCR, Image input tools) ────

export async function processAIFromFile(
  toolId: string,
  fileBuffer: ArrayBuffer,
  fileName: string,
  options: Record<string, string>,
  onProgress: OnProgress
): Promise<AIJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const ext = fileName.lastIndexOf(".") >= 0 ? fileName.substring(fileName.lastIndexOf(".")) : ".txt"
  const inputPath = join(dir, `input${ext}`)
  await writeFile(inputPath, new Uint8Array(fileBuffer))

  let inputText = ""
  if (ext === ".txt" || ext === ".md") {
    inputText = await readFile(inputPath, "utf-8")
  } else if (ext === ".pdf") {
    inputText = `[PDF file uploaded: ${fileName}. Content extraction required.]`
  } else if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"].includes(ext)) {
    inputText = `[Image file uploaded: ${fileName}. Visual analysis required.]`
  }

  return processAIWithInput(toolId, inputText, { ...options, originalFileName: fileName }, onProgress)
}

// ─── Dispatcher ────────────────────────────────────────────────

export async function processAIJob(
  toolId: string,
  options: Record<string, string>,
  onProgress: OnProgress,
  fileBuffer?: ArrayBuffer,
  fileName?: string
): Promise<AIJobResult> {
  const needsFile = ["ai-ocr", "ai-summarize", "ai-grammar"].includes(toolId)

  if (needsFile && fileBuffer && fileName) {
    return processAIFromFile(toolId, fileBuffer, fileName, options, onProgress)
  }

  return processAIText(toolId, options, onProgress)
}
