"use client"

import { useEffect, useRef, useState } from "react"
import { useSubscription } from "@/contexts/subscription-context"

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

interface GoogleAdsenseProps {
  adSlot: string
  adFormat?: string
  className?: string
  style?: React.CSSProperties
}

let adsenseReady = false
let adsensePromise: Promise<void> | null = null

function ensureAdsense(): Promise<void> {
  if (adsenseReady && window.adsbygoogle) return Promise.resolve()
  if (adsensePromise) return adsensePromise

  adsensePromise = new Promise<void>((resolve) => {
    const check = () => {
      if (window.adsbygoogle) {
        adsenseReady = true
        resolve()
        return
      }
      setTimeout(check, 200)
    }
    check()

    setTimeout(() => {
      adsenseReady = true
      resolve()
    }, 8000)
  })

  return adsensePromise
}

export function GoogleAdsense({
  adSlot,
  adFormat = "auto",
  className = "",
  style,
}: GoogleAdsenseProps) {
  const { isPremium } = useSubscription()
  const adRef = useRef<HTMLDivElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (isPremium || pushed.current) return

    ensureAdsense().then(() => {
      if (adRef.current && !pushed.current) {
        try {
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
          pushed.current = true
        } catch {
          // adSense not ready
        }
      }
    })
  }, [isPremium])

  if (isPremium) return null

  const publisherId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || ""

  return (
    <div className={`w-full ${className}`} style={style}>
      <div ref={adRef} className="w-full overflow-hidden">
        <ins
          className="adsbygoogle block"
          style={{
            display: "block",
            overflow: "hidden",
          }}
          data-ad-client={publisherId}
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive="true"
        />
      </div>
      <p className="text-center text-[9px] text-[#BEB7AC]/25 uppercase tracking-wider mt-1">Ad</p>
    </div>
  )
}
