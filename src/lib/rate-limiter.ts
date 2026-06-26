import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 10
const LOCKOUT_DURATION = 15 * 60 * 1000
const MAX_FAILED_ATTEMPTS = 5
const PROGRESSIVE_DELAY_BASE = 1000

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  const realIp = req.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }
  return "unknown"
}

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function checkRateLimit(req: Request): Promise<{ allowed: boolean; retryAfter?: number }> {
  const ip = getClientIp(req)
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW

  try {
    const admin = getAdminClient()
    const { data, error } = await admin
      .from("rate_limits" as any)
      .select("id")
      .eq("key", `rl:${ip}`)
      .gte("created_at", new Date(windowStart).toISOString())

    if (error) {
      console.error("[RATE_LIMIT] DB query failed, allowing request:", error.message)
      return { allowed: true }
    }

    const count = data?.length || 0

    if (count >= RATE_LIMIT_MAX) {
      const retryAfter = Math.ceil(RATE_LIMIT_WINDOW / 1000)
      console.error(`[RATE_LIMIT] IP ${ip} exceeded rate limit: ${count} requests`)
      return { allowed: false, retryAfter }
    }

    await admin.from("rate_limits" as any).insert({
      key: `rl:${ip}`,
      created_at: new Date(now).toISOString(),
    })

    return { allowed: true }
  } catch (err) {
    console.error("[RATE_LIMIT] Error, allowing request:", err)
    return { allowed: true }
  }
}

export async function checkLockout(email: string): Promise<{ locked: boolean; retryAfter?: number; attempts?: number }> {
  const key = email.toLowerCase()

  try {
    const admin = getAdminClient()
    const { data, error } = await admin
      .from("account_lockouts" as any)
      .select("locked_at, attempts")
      .eq("email", key)
      .single()

    if (error || !data) {
      return { locked: false }
    }

    const lockedAt = new Date(data.locked_at).getTime()
    const now = Date.now()

    if (now - lockedAt < LOCKOUT_DURATION) {
      const retryAfter = Math.ceil((LOCKOUT_DURATION - (now - lockedAt)) / 1000)
      return { locked: true, retryAfter, attempts: data.attempts }
    }

    await admin.from("account_lockouts" as any).delete().eq("email", key)
    return { locked: false }
  } catch (err) {
    console.error("[LOCKOUT] Error checking lockout, allowing:", err)
    return { locked: false }
  }
}

export async function recordFailedAttempt(email: string): Promise<{ locked: boolean; attempts: number; delay: number }> {
  const key = email.toLowerCase()

  try {
    const admin = getAdminClient()
    const { data: existing } = await admin
      .from("account_lockouts" as any)
      .select("attempts, locked_at")
      .eq("email", key)
      .single()

    const now = Date.now()
    const newAttempts = (existing?.attempts || 0) + 1

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      await admin.from("account_lockouts" as any).upsert({
        email: key,
        attempts: newAttempts,
        locked_at: new Date(now).toISOString(),
      }, { onConflict: "email" })
      console.error(`[LOCKOUT] Account locked after ${newAttempts} failed attempts`)
      return { locked: true, attempts: newAttempts, delay: LOCKOUT_DURATION }
    }

    await admin.from("account_lockouts" as any).upsert({
      email: key,
      attempts: newAttempts,
      locked_at: existing?.locked_at || new Date(now).toISOString(),
    }, { onConflict: "email" })

    const delay = Math.min(PROGRESSIVE_DELAY_BASE * Math.pow(2, newAttempts - 1), 30000)
    return { locked: false, attempts: newAttempts, delay }
  } catch (err) {
    console.error("[LOCKOUT] Error recording attempt:", err)
    return { locked: false, attempts: 1, delay: 0 }
  }
}

export async function clearFailedAttempts(email: string): Promise<void> {
  try {
    const admin = getAdminClient()
    await admin.from("account_lockouts" as any).delete().eq("email", email.toLowerCase())
  } catch (err) {
    console.error("[LOCKOUT] Error clearing attempts:", err)
  }
}

export function logValidationFailure(endpoint: string, reason: string, ip?: string): void {
  console.error(`[AUTH_SECURITY] Validation failure at ${endpoint}: ${reason}${ip ? ` from IP ${ip}` : ""}`)
}
