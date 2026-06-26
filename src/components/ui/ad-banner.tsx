"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Crown, X } from "lucide-react"
import { useState } from "react"

interface AdBannerProps {
  variant?: "sidebar" | "inline" | "bottom"
}

export function AdBanner({ variant = "inline" }: AdBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  if (variant === "sidebar") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-5 overflow-hidden"
      >
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-[#BEB7AC]/40 hover:text-[#BEB7AC] hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer z-10"
        >
          <X className="w-3 h-3" />
        </button>

        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[#D97757]/10 flex items-center justify-center mx-auto mb-3">
            <Crown className="w-6 h-6 text-[#D97757]" />
          </div>
          <p className="text-[13px] font-medium text-[#F6F3EE] mb-1">Upgrade to Premium</p>
          <p className="text-[11px] text-[#BEB7AC]/60 mb-3">Remove ads & get unlimited access</p>
          <Link
            href="/pricing"
            className="inline-flex h-8 px-4 rounded-lg bg-[#D97757] hover:bg-[#c66a4c] text-white text-[12px] font-medium transition-colors"
          >
            Upgrade
          </Link>
        </div>

        <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.04)]">
          <p className="text-[10px] text-[#BEB7AC]/30 text-center uppercase tracking-wider">Ad</p>
        </div>
      </motion.div>
    )
  }

  if (variant === "bottom") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="relative rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-4 overflow-hidden mt-4"
      >
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-[#BEB7AC]/40 hover:text-[#BEB7AC] hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer z-10"
        >
          <X className="w-3 h-3" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#D97757]/10 flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-[#D97757]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-[#F6F3EE]">Go Premium — Remove Ads</p>
            <p className="text-[11px] text-[#BEB7AC]/60">₹152/month. Cancel anytime.</p>
          </div>
          <Link
            href="/pricing"
            className="h-8 px-4 rounded-lg bg-[#D97757] hover:bg-[#c66a4c] text-white text-[12px] font-medium transition-colors flex items-center flex-shrink-0"
          >
            Upgrade
          </Link>
        </div>

        <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
          <p className="text-[9px] text-[#BEB7AC]/20 uppercase tracking-wider">Sponsored</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-4 overflow-hidden"
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-[#BEB7AC]/40 hover:text-[#BEB7AC] hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer z-10"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#D97757]/10 flex items-center justify-center flex-shrink-0">
          <Crown className="w-4 h-4 text-[#D97757]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-[#F6F3EE]">Ad-free with Premium</p>
          <p className="text-[10px] text-[#BEB7AC]/50">From ₹152/month</p>
        </div>
        <Link
          href="/pricing"
          className="h-7 px-3 rounded-md bg-[#D97757] hover:bg-[#c66a4c] text-white text-[11px] font-medium transition-colors flex items-center flex-shrink-0"
        >
          Try Pro
        </Link>
      </div>
    </motion.div>
  )
}
