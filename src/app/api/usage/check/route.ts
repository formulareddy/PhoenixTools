import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CATEGORY_LIMITS: Record<string, number> = {
  pdf: 20, image: 20, video: 5, audio: 25, ai: 15,
  text: 30, dev: 17, seo: 10, marketing: 5, business: 10,
}

function getTodayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export async function POST(req: NextRequest) {
  try {
    const { category, userId } = await req.json()

    if (!category || !userId) {
      return NextResponse.json({ error: "Missing category or userId" }, { status: 400 })
    }

    const limit = CATEGORY_LIMITS[category] || 10
    const today = getTodayKey()

    // Check user's plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_type, subscription_expires_at")
      .eq("id", userId)
      .single()

    const isPremium = profile?.plan_type === "premium" &&
      new Date(profile.subscription_expires_at) > new Date()

    // Premium users have unlimited usage
    if (isPremium) {
      return NextResponse.json({
        allowed: true,
        used: 0,
        limit: -1,
        remaining: -1,
        isPremium: true,
      })
    }

    // Check server-side usage in usage_logs table
    const { data: log, error: logError } = await supabase
      .from("usage_logs")
      .select("count")
      .eq("user_id", userId)
      .eq("category", category)
      .eq("date", today)
      .single()

    let used = log?.count || 0

    // If limit reached, block
    if (used >= limit) {
      return NextResponse.json({
        allowed: false,
        used,
        limit,
        remaining: 0,
        isPremium: false,
        error: `Daily limit reached for ${category} tools (${limit}/day). Upgrade to Premium for unlimited.`,
      })
    }

    // Increment usage
    if (logError || !log) {
      // Insert new log
      await supabase.from("usage_logs").insert({
        user_id: userId,
        category,
        date: today,
        count: 1,
      })
      used = 1
    } else {
      // Update existing log
      await supabase
        .from("usage_logs")
        .update({ count: used + 1 })
        .eq("user_id", userId)
        .eq("category", category)
        .eq("date", today)
      used = used + 1
    }

    return NextResponse.json({
      allowed: true,
      used,
      limit,
      remaining: Math.max(0, limit - used),
      isPremium: false,
    })
  } catch (error) {
    console.error("Usage check error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
