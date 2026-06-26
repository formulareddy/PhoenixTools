"use client"

import { useSubscription } from "@/contexts/subscription-context"
import { GoogleAdsense } from "./google-adsense"

interface ToolAdBannerProps {
  variant?: "top" | "middle" | "bottom"
}

const AD_SLOTS = {
  top: process.env.NEXT_PUBLIC_AD_SLOT_TOP || "1234567890",
  middle: process.env.NEXT_PUBLIC_AD_SLOT_MIDDLE || "1234567891",
  bottom: process.env.NEXT_PUBLIC_AD_SLOT_BOTTOM || "1234567892",
}

export function ToolAdBanner({ variant = "bottom" }: ToolAdBannerProps) {
  const { isPremium, loading } = useSubscription()

  if (isPremium) return null

  const slot = AD_SLOTS[variant]

  return (
    <div
      className={`
        w-full mx-auto
        max-w-[728px]
        px-4 sm:px-0
        ${variant === "top" ? "mb-6" : variant === "middle" ? "my-6" : "mt-6"}
      `}
    >
      <GoogleAdsense
        adSlot={slot}
        adFormat="auto"
        className="
          rounded-xl
          border border-[rgba(255,255,255,0.06)]
          bg-[#171612]
          p-3 sm:p-4
        "
      />
    </div>
  )
}
