"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

export type PlanType = "free" | "monthly" | "yearly"

interface SubscriptionContextType {
  plan: PlanType
  isPremium: boolean
  loading: boolean
  razorpayOrderId: string | null
  createOrder: (plan: "monthly" | "yearly", currencyCode?: string) => Promise<{ orderId: string; amount: number; currency: string } | { error: string }>
  verifyPayment: (orderId: string, paymentId: string, signature: string) => Promise<{ success: boolean; error?: string }>
  refreshPlan: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  plan: "free",
  isPremium: false,
  loading: true,
  razorpayOrderId: null,
  createOrder: async () => ({ error: "not initialized" }),
  verifyPayment: async () => ({ success: false, error: "not initialized" }),
  refreshPlan: async () => {},
})

export function useSubscription() {
  return useContext(SubscriptionContext)
}

function isPlanActive(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) > new Date()
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [plan, setPlan] = useState<PlanType>("free")
  const [loading, setLoading] = useState(true)
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null)

  const fetchPlan = useCallback(async () => {
    if (!user) {
      setPlan("free")
      setLoading(false)
      return
    }

    try {
      const { data } = await supabase
        .from("profiles")
        .select("plan_type, subscription_expires_at")
        .eq("id", user.id)
        .single()

      if (data && data.plan_type && data.plan_type !== "free" && isPlanActive(data.subscription_expires_at)) {
        setPlan(data.plan_type as PlanType)
      } else {
        setPlan("free")
        if (data && data.plan_type !== "free") {
          await supabase
            .from("profiles")
            .update({ plan_type: "free" })
            .eq("id", user.id)
        }
      }
    } catch {
      setPlan("free")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchPlan()
  }, [fetchPlan])

  const createOrder = async (selectedPlan: "monthly" | "yearly", currencyCode?: string) => {
    try {
      if (!user) return { error: "Please sign in to upgrade" }

      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, userId: user.id, currencyCode }),
      })
      const data = await res.json()
      if (data.error) return { error: data.error }
      setRazorpayOrderId(data.orderId)
      return { orderId: data.orderId, amount: data.amount, currency: data.currency || "INR" }
    } catch (err: any) {
      console.error("createOrder error:", err)
      return { error: "Failed to create order. Please try again." }
    }
  }

  const verifyPayment = async (orderId: string, paymentId: string, signature: string) => {
    try {
      const res = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paymentId, signature }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchPlan()
      }
      return data
    } catch {
      return { success: false, error: "Verification failed" }
    }
  }

  return (
    <SubscriptionContext.Provider value={{
      plan,
      isPremium: plan !== "free",
      loading,
      razorpayOrderId,
      createOrder,
      verifyPayment,
      refreshPlan: fetchPlan,
    }}>
      {children}
    </SubscriptionContext.Provider>
  )
}
