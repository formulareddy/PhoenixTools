import { NextRequest } from "next/server"
import Razorpay from "razorpay"
import { createClient } from "@supabase/supabase-js"
import { CURRENCIES, COUNTRY_TO_CURRENCY } from "@/lib/currencies"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

// Check if running in test mode
const isTestMode = (process.env.RAZORPAY_KEY_ID || "").startsWith("rzp_test_")

export async function POST(req: NextRequest) {
  try {
    const { plan, userId, currencyCode } = await req.json()

    if (!plan || !userId) {
      return Response.json({ error: "Missing plan or userId" }, { status: 400 })
    }

    // Razorpay test mode only supports INR — force INR for test keys
    // Live mode supports all currencies (USD, EUR, GBP, etc.)
    let currency
    if (isTestMode) {
      currency = CURRENCIES.INR
    } else {
      const currencyKey = COUNTRY_TO_CURRENCY[currencyCode] || currencyCode || "INR"
      currency = CURRENCIES[currencyKey] || CURRENCIES.INR
    }

    const isYearly = plan === "yearly"
    const amount = isYearly ? currency.yearly : currency.monthly

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: user } = await supabase.auth.admin.getUserById(userId)
    if (!user?.user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    // Create REAL Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: currency.code,
      receipt: `receipt_${userId.slice(0, 8)}_${Date.now()}`,
      notes: {
        plan: isYearly ? "yearly" : "monthly",
        userId,
        country: currencyCode || "IN",
      },
    })

    // Store in Supabase
    await supabase.from("orders").insert({
      id: razorpayOrder.id,
      user_id: userId,
      plan_type: isYearly ? "yearly" : "monthly",
      amount,
      currency: currency.code,
      status: "created",
    })

    return Response.json({
      orderId: razorpayOrder.id,
      amount,
      currency: currency.code,
    })
  } catch (err: any) {
    console.error("Create order error:", err.message || err)
    return Response.json(
      { error: err.message || "Failed to create order" },
      { status: 500 }
    )
  }
}
