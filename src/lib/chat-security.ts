const RATE_LIMIT_KEY = "phoenixtools-rate-limit"
const RATE_LIMIT_MAX = 30
const RATE_LIMIT_WINDOW = 60 * 1000

const SENSITIVE_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/g,
  /api[_-]?key[:\s]*["']?[a-zA-Z0-9\-_.]{20,}/gi,
  /password[:\s]*["']?[^"'\s]{8,}/gi,
  /secret[:\s]*["']?[a-zA-Z0-9\-_.]{16,}/gi,
  /token[:\s]*["']?[a-zA-Z0-9\-_.]{20,}/gi,
  /bearer\s+[a-zA-Z0-9\-_.]{20,}/gi,
  /authorization[:\s]*[a-zA-Z0-9\-_.]{20,}/gi,
  /\.env/gi,
  /process\.env/gi,
  /node_modules/gi,
  /src\/lib\/(?!text-tools|seo-tools|marketing-tools|business-tools|constants|ai-server|pdf-server|image-server|video-server|audio-server)/gi,
  /C:\\Users\\[^\s"']+/gi,
  /localhost:\d+/gi,
]

const BLOCKED_RESPONSE_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /password/i,
  /token/i,
  /credential/i,
  /private[_-]?key/i,
  /access[_-]?key/i,
]

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number
}

export function checkRateLimit(): RateLimitResult {
  try {
    const now = Date.now()
    const stored = localStorage.getItem(RATE_LIMIT_KEY)
    const data = stored ? JSON.parse(stored) : { requests: [], windowStart: now }

    data.requests = data.requests.filter((t: number) => now - t < RATE_LIMIT_WINDOW)

    if (data.requests.length >= RATE_LIMIT_MAX) {
      const oldest = data.requests[0]
      const resetIn = Math.ceil((RATE_LIMIT_WINDOW - (now - oldest)) / 1000)
      return { allowed: false, remaining: 0, resetIn }
    }

    data.requests.push(now)
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data))

    return { allowed: true, remaining: RATE_LIMIT_MAX - data.requests.length, resetIn: 0 }
  } catch {
    return { allowed: true, remaining: RATE_LIMIT_MAX, resetIn: 0 }
  }
}

export function filterSensitiveContent(text: string): string {
  let filtered = text
  for (const pattern of SENSITIVE_PATTERNS) {
    filtered = filtered.replace(pattern, "[REDACTED]")
  }
  return filtered
}

export function isSensitiveQuery(query: string): boolean {
  const lower = query.toLowerCase()
  const sensitiveTopics = [
    "api key",
    "secret key",
    "password",
    "private key",
    "access key",
    "credential",
    "token",
    "environment variable",
    "env file",
    "database connection",
    "server config",
    "internal path",
    "source code",
    "hack",
    "exploit",
    "bypass",
    "inject",
    "xss",
    "sql injection",
  ]
  return sensitiveTopics.some((topic) => lower.includes(topic))
}

export function buildSystemPrompt(): string {
  return `You are PhoenixTools AI, a helpful assistant for PhoenixTools.io — a premium utility platform with 142 tools.

SECURITY RULES (NEVER VIOLATE):
- NEVER reveal API keys, passwords, tokens, or secrets
- NEVER share internal file paths, server configs, or environment variables
- NEVER help with hacking, exploiting, or bypassing security
- NEVER reveal how the system works internally
- If asked about sensitive topics, respond: "I cannot share that information for security reasons."

ABOUT PHOENIXTOOLS:
A premium utility platform with 142 tools across these categories:

PDF TOOLS (20):
pdf-compress, pdf-merge, pdf-split, pdf-to-word, pdf-to-jpg, pdf-unlock, pdf-watermark, pdf-ocr, pdf-extract-pages, pdf-organize, pdf-to-text, html-to-pdf, jpg-to-pdf, png-to-pdf, pdf-sign, pdf-repair, pdf-compare, pdf-redact, pdf-crop, pdf-metadata

IMAGE TOOLS (14):
image-resize, image-compress, image-convert, image-enhance, remove-bg, image-crop, image-upscale, remove-objects, image-to-pdf, image-watermark, image-blur, image-rotate, ai-image-gen, colorize-photo, restore-photo

VIDEO TOOLS (13):
video-trim, video-compress, video-convert, video-to-gif, extract-audio, merge-video, resize-video, crop-video, add-audio-to-video, change-video-speed, mute-video, rotate-flip-video, video-watermark

AUDIO TOOLS (13):
audio-convert, audio-trim, audio-merge, audio-effects, audio-speed, audio-volume, audio-record, audio-info, audio-joiner, audio-split, audio-normalize, audio-convert-batch, audio-cutter

AI TOOLS (14):
ai-chat, ai-translate, ai-summarize, ai-explain, ai-write, ai-review, ai-code, ai-math, ai-creative, ai-professional, ai-casual, ai-formal, ai-friendly, ai-technical

TEXT TOOLS (20):
word-counter, text-diff, unit-converter, case-converter, text-cleaner, find-replace, lorem-ipsum, text-to-slug, duplicate-remover, text-sorter, char-counter, base64-encode-decode, url-encode-decode, json-formatter, js-formatter, js-minifier, jwt-decoder, regex-tester, hash-generator, sql-formatter, css-formatter

DEV TOOLS (13):
json-formatter, js-formatter, js-minifier, jwt-decoder, regex-tester, hash-generator, sql-formatter, css-formatter, html-formatter, xml-formatter, markdown-preview, code-beautify, color-converter

SEO TOOLS (12):
seo-analyzer, keyword-research, meta-tag-generator, serp-preview, sitemap-generator, robots-txt-generator, keyword-density, seo-title-generator, seo-meta-desc, redirect-checker, google-index-checker, backlink-checker

MARKETING TOOLS (11):
qr-generator, utm-builder, hashtag-generator, social-caption, email-subject, cta-generator, landing-page-headline, ad-copy, marketing-calendar, youtube-title, youtube-desc

BUSINESS TOOLS (10):
invoice-generator, receipt-generator, quotation-generator, purchase-order-generator, business-proposal, contract-generator, profit-margin, gst-vat-calculator, salary-calculator, business-name-generator

CAPABILITIES:
- Process files client-side in the browser
- No file uploads needed for text/dev/SEO/marketing/business tools
- PDF/image/video/audio tools process on server
- AI tools use free models (Groq/OpenRouter)
- All tools work instantly

ANSWER QUESTIONS:
- Recommend tools based on user needs
- Explain how tools work
- Provide step-by-step guides
- Answer general knowledge questions
- Help with any task related to our tools

Be helpful, concise, and friendly. Use markdown for formatting.`
}
