"use client"

import { motion } from "framer-motion"
import {
  Check, X as XIcon, Crown, Zap, HardDrive, MessageSquare,
  FileText, Image, Video, Music, Sparkles, Type, Code, Search,
  Megaphone, Briefcase, Globe, Shield, Infinity,
} from "lucide-react"
import Link from "next/link"

const comparisonFeatures = [
  { name: "Tools included", free: "146", premium: "146", icon: Zap },
  { name: "Ads", free: "Yes (on every tool)", premium: "None", icon: Shield, freeBad: true, premiumGood: true },
  { name: "Maximum file size", free: "500 MB", premium: "4 GB", icon: HardDrive },
  { name: "Upload speed", free: "Standard", premium: "Priority (3x faster)", icon: Zap, freeBad: true, premiumGood: true },
  { name: "AI Chat daily messages", free: "20 per day", premium: "Unlimited", icon: MessageSquare },
]

const categoryLimits = [
  { name: "PDF Tools", icon: FileText, free: "20/day", premium: "Unlimited", color: "#EF4444" },
  { name: "Image Tools", icon: Image, free: "20/day", premium: "Unlimited", color: "#8B5CF6" },
  { name: "Video Tools", icon: Video, free: "5/day", premium: "Unlimited", color: "#06B6D4" },
  { name: "Audio Tools", icon: Music, free: "25/day", premium: "Unlimited", color: "#F59E0B" },
  { name: "AI Tools", icon: Sparkles, free: "15/day", premium: "Unlimited", color: "#6366F1" },
  { name: "Text Tools", icon: Type, free: "30/day", premium: "Unlimited", color: "#10B981" },
  { name: "Developer Tools", icon: Code, free: "17/day", premium: "Unlimited", color: "#22D3EE" },
  { name: "SEO Tools", icon: Search, free: "10/day", premium: "Unlimited", color: "#F59E0B" },
  { name: "Marketing Tools", icon: Megaphone, free: "5/day", premium: "Unlimited", color: "#EC4899" },
  { name: "Business Tools", icon: Briefcase, free: "10/day", premium: "Unlimited", color: "#D97757" },
]

export function ComparisonTable() {
  return (
    <div className="space-y-10">
      {/* Main Features */}
      <div>
        <h3 className="text-[24px] font-serif text-[#F6F3EE] mb-6 text-center">Free vs Premium</h3>
        <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#171612] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 border-b border-[rgba(255,255,255,0.06)]">
            <div className="px-6 py-4" />
            <div className="px-6 py-4 text-center border-l border-[rgba(255,255,255,0.06)]">
              <span className="text-[14px] font-medium text-[#9E9E9E]">Free</span>
            </div>
            <div className="px-6 py-4 text-center border-l border-[rgba(255,255,255,0.06)]">
              <span className="text-[14px] font-medium text-[#D97757]">Premium</span>
            </div>
          </div>

          {/* Rows */}
          {comparisonFeatures.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={`grid grid-cols-3 ${i < comparisonFeatures.length - 1 ? "border-b border-[rgba(255,255,255,0.04)]" : ""}`}
              >
                <div className="px-6 py-4 flex items-center gap-3">
                  <Icon className="w-4 h-4 text-[#BEB7AC]/60 flex-shrink-0" />
                  <span className="text-[13px] text-[#F6F3EE]">{feature.name}</span>
                </div>
                <div className="px-6 py-4 flex items-center justify-center border-l border-[rgba(255,255,255,0.06)]">
                  <span className={`text-[13px] ${feature.freeBad ? "text-red-400" : "text-[#BEB7AC]"}`}>
                    {feature.free}
                  </span>
                </div>
                <div className="px-6 py-4 flex items-center justify-center border-l border-[rgba(255,255,255,0.06)]">
                  {feature.premiumGood ? (
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                      <span className="text-[13px] text-[#10B981]">{feature.premium}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Infinity className="w-3.5 h-3.5 text-[#10B981]" />
                      <span className="text-[13px] text-[#10B981]">{feature.premium}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Category Limits */}
      <div>
        <h3 className="text-[24px] font-serif text-[#F6F3EE] mb-6 text-center">Daily Tool Limits by Category</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categoryLimits.map((cat, i) => {
            const Icon = cat.icon
            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${cat.color}15` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: cat.color }} />
                  </div>
                  <span className="text-[14px] font-medium text-[#F6F3EE]">{cat.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 rounded-lg bg-[#1D1C17]">
                    <p className="text-[10px] text-[#BEB7AC]/50 uppercase tracking-wider mb-1">Free</p>
                    <p className="text-[13px] text-[#BEB7AC] font-medium">{cat.free}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-[#10B981]/5 border border-[#10B981]/10">
                    <p className="text-[10px] text-[#10B981]/60 uppercase tracking-wider mb-1">Premium</p>
                    <p className="text-[13px] text-[#10B981] font-medium">{cat.premium}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-[#D97757] hover:bg-[#c66a4c] text-white text-[15px] font-medium transition-colors"
        >
          <Crown className="w-4 h-4" />
          Upgrade to Premium
        </Link>
      </motion.div>
    </div>
  )
}
