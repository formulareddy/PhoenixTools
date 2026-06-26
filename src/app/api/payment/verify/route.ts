import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET!

export async function POST(req: NextRequest) {
  try {
    const { orderId, paymentId, signature } = await req.json()

    if (!orderId || !paymentId || !signature) {
      return Response.json({ error: "Missing payment details" }, { status: 400 })
    }

    const body = orderId + "|" + paymentId
    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(body)
      .digest("hex")

    if (expectedSignature !== signature) {
      return Response.json({ error: "Invalid signature" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single()

    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 })
    }

    const now = new Date()
    let expiresAt: Date
    if (order.plan_type === "monthly") {
      expiresAt = new Date(now)
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    } else {
      expiresAt = new Date(now)
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    }

    await supabase
      .from("orders")
      .update({
        payment_id: paymentId,
        signature,
        status: "paid",
      })
      .eq("id", orderId)

    await supabase
      .from("profiles")
      .update({
        plan_type: order.plan_type,
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq("id", order.user_id)

    return Response.json({ success: true })
  } catch (err) {
    console.error("Payment verification error:", err)
    return Response.json({ error: "Verification failed" }, { status: 500 })
  }
}
