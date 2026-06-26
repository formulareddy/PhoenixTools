"use client"

import { useState, useCallback } from "react"

interface UsageInfo {
  used: number
  limit: number
  remaining: number
}

export function useToolUsage() {
  const getTodayKey = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }

  const getCategoryKey = (category: string) => `tool_usage_${getTodayKey()}_${category}`

  const getCategoryUsage = useCallback((category: string): UsageInfo => {
    const limits: Record<string, number> = {
      pdf: 20,
      image: 20,
      video: 5,
      audio: 25,
      ai: 15,
      text: 30,
      dev: 17,
      seo: 10,
      marketing: 5,
      business: 10,
    }

    const key = getCategoryKey(category)
    const stored = localStorage.getItem(key)
    const used = stored ? parseInt(stored, 10) : 0
    const limit = limits[category] || 10

    return { used, limit, remaining: Math.max(0, limit - used) }
  }, [])

  const trackUsage = useCallback((category: string): UsageInfo => {
    const limits: Record<string, number> = {
      pdf: 20, image: 20, video: 5, audio: 25, ai: 15,
      text: 30, dev: 17, seo: 10, marketing: 5, business: 10,
    }

    const key = getCategoryKey(category)
    const stored = localStorage.getItem(key)
    const used = stored ? parseInt(stored, 10) : 0
    const newUsed = used + 1
    localStorage.setItem(key, String(newUsed))

    const limit = limits[category] || 10
    return { used: newUsed, limit, remaining: Math.max(0, limit - newUsed) }
  }, [])

  const canUseTool = useCallback((category: string): boolean => {
    const usage = getCategoryUsage(category)
    return usage.remaining > 0
  }, [getCategoryUsage])

  // Server-side validation (tamper-resistant)
  const validateWithServer = useCallback(async (category: string, userId: string): Promise<{ allowed: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/usage/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, userId }),
      })
      const data = await res.json()
      if (!res.ok || !data.allowed) {
        return { allowed: false, error: data.error || "Daily limit reached" }
      }
      return { allowed: true }
    } catch {
      // If server check fails, allow (fail open for UX)
      return { allowed: true }
    }
  }, [])

  return { getCategoryUsage, trackUsage, canUseTool, validateWithServer, getTodayKey }
}
