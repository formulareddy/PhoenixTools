"use client"

import { useState, useCallback } from "react"

interface ChatUsageInfo {
  used: number
  limit: number
  remaining: number
}

const FREE_DAILY_LIMIT = 20

export function useChatUsage() {
  const getTodayKey = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }

  const getKey = () => `chat_usage_${getTodayKey()}`

  const getUsage = useCallback((): ChatUsageInfo => {
    const key = getKey()
    const stored = localStorage.getItem(key)
    const used = stored ? parseInt(stored, 10) : 0
    return { used, limit: FREE_DAILY_LIMIT, remaining: Math.max(0, FREE_DAILY_LIMIT - used) }
  }, [])

  const trackUsage = useCallback((): ChatUsageInfo => {
    const key = getKey()
    const stored = localStorage.getItem(key)
    const used = stored ? parseInt(stored, 10) : 0
    const newUsed = used + 1
    localStorage.setItem(key, String(newUsed))
    return { used: newUsed, limit: FREE_DAILY_LIMIT, remaining: Math.max(0, FREE_DAILY_LIMIT - newUsed) }
  }, [])

  const canUseChat = useCallback((): boolean => {
    return getUsage().remaining > 0
  }, [getUsage])

  return { getUsage, trackUsage, canUseChat, FREE_DAILY_LIMIT }
}
