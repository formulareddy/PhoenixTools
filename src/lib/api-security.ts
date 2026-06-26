import { join } from "path"
import { tmpdir } from "os"

// ── Job ID Validation (prevents path traversal) ──────────────────────────────
const UUID_RE = /^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/
const SAFE_JOB_RE = /^[a-zA-Z0-9_-]+$/

export function isValidJobId(jobId: string): boolean {
  if (!jobId || jobId.length < 8 || jobId.length > 128) return false
  return UUID_RE.test(jobId) || SAFE_JOB_RE.test(jobId)
}

export function safeJobDir(prefix: string, jobId: string): string | null {
  if (!isValidJobId(jobId)) return null
  const dir = join(tmpdir(), prefix, jobId)
  const resolved = join(tmpdir(), prefix)
  if (!dir.startsWith(resolved)) return null
  return dir
}

// ── Filename Sanitization (prevents header injection) ────────────────────────
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^\w\s.\-()]/g, "")
    .replace(/\n/g, "")
    .replace(/\r/g, "")
    .replace(/"/g, "'")
    .slice(0, 200)
    .trim() || "download"
}

// ── SSRF Protection (blocks private/internal IPs) ────────────────────────────
export function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()

    if (parsed.protocol === "file:") return true
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return true
    if (hostname.endsWith(".local") || hostname.endsWith(".internal")) return true

    const ipMatch = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
    if (ipMatch) {
      const [, a, b] = ipMatch.map(Number)
      if (a === 10) return true
      if (a === 172 && b >= 16 && b <= 31) return true
      if (a === 192 && b === 168) return true
      if (a === 169 && b === 254) return true
      if (a === 0) return true
      if (a === 100 && b >= 64 && b <= 127) return true
    }

    return false
  } catch {
    return true
  }
}

// ── Simple In-Memory Rate Limiter (per IP) ───────────────────────────────────
const hits = new Map<string, number[]>()
const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

export function checkSimpleRateLimit(
  ip: string,
  maxRequests: number = 30,
  windowMs: number = 60_000
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()

  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [key, timestamps] of hits) {
      const valid = timestamps.filter((t) => now - t < windowMs)
      if (valid.length === 0) hits.delete(key)
      else hits.set(key, valid)
    }
    lastCleanup = now
  }

  const timestamps = hits.get(ip) || []
  const recent = timestamps.filter((t) => now - t < windowMs)

  if (recent.length >= maxRequests) {
    const oldest = recent[0]
    const retryAfter = Math.ceil((windowMs - (now - oldest)) / 1000)
    return { allowed: false, retryAfter }
  }

  recent.push(now)
  hits.set(ip, recent)
  return { allowed: true }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp
  return "unknown"
}
