"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Mail, Lock, LogOut, Trash2, AlertTriangle, Crown, ChevronRight,
  FileText, Image, Video, Music, Sparkles, Type, Code, Search,
  Megaphone, Briefcase, ArrowRight, Shield, Zap, Globe,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/layout/header"
import { PremiumButton } from "@/components/ui/premium-button"
import { SetPasswordModal } from "@/components/ui/set-password-modal"

const categoryIcons: Record<string, React.ElementType> = {
  pdf: FileText, image: Image, video: Video, audio: Music,
  ai: Sparkles, text: Type, dev: Code, seo: Search,
  marketing: Megaphone, business: Briefcase,
}

const categoryColors: Record<string, string> = {
  pdf: "#EF4444", image: "#8B5CF6", video: "#06B6D4", audio: "#F59E0B",
  ai: "#6366F1", text: "#10B981", dev: "#22D3EE", seo: "#F59E0B",
  marketing: "#EC4899", business: "#D97757",
}

const categories = [
  { id: "pdf", name: "PDF", count: 20 },
  { id: "image", name: "Image", count: 15 },
  { id: "video", name: "Video", count: 13 },
  { id: "audio", name: "Audio", count: 13 },
  { id: "ai", name: "AI", count: 15 },
  { id: "text", name: "Text", count: 23 },
  { id: "dev", name: "Dev", count: 13 },
  { id: "seo", name: "SEO", count: 12 },
  { id: "marketing", name: "Marketing", count: 11 },
  { id: "business", name: "Business", count: 11 },
]

const premiumFeatures = [
  { text: "Access to all 146 tools", icon: Zap, tip: "Full access to every tool across all categories" },
  { text: "Files up to 10 GB", icon: Globe, tip: "Process large files without size restrictions" },
  { text: "AI-powered processing", icon: Sparkles, tip: "Advanced AI features for smarter results" },
  { text: "Unlimited daily files", icon: Shield, tip: "No daily limits on file processing" },
  { text: "Ad-free experience", icon: Crown, tip: "Clean, distraction-free workspace" },
  { text: "Cancel anytime", icon: ChevronRight, tip: "No long-term commitments required" },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin")
    }
  }, [user, authLoading, router])

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setTimeout(() => {
      signOut()
      router.push("/")
    }, 1500)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0E0A]">
        <div className="w-8 h-8 border-2 border-[#D97757]/30 border-t-[#D97757] rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const email = user.email || "No email"
  const username = user.user_metadata?.username || email.split("@")[0]
  const initials = username.slice(0, 2).toUpperCase()
  const createdAt = user.created_at ? new Date(user.created_at) : new Date()
  const memberSince = createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })

  // Detect if user has a password (email/password signup) vs OAuth-only
  const hasPassword = user.identities?.some((id) => id.provider === "email") ?? false

  return (
    <>
      <Header />
      <div className="pt-24 pb-20 min-h-screen">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">

          {/* Welcome Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-10"
          >
            <div className="flex items-center gap-5 mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D97757] to-[#D97757]/60 flex items-center justify-center text-[22px] font-semibold text-white tracking-tight">
                  {initials}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#10B981] border-2 border-[#0F0E0A] flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="font-serif text-[clamp(28px,4vw,42px)] text-[#F6F3EE] leading-[1.1] tracking-[-0.02em]">
                  Welcome back, {username}
                </h1>
                <p className="text-[14px] text-[#BEB7AC] mt-1">
                  Member since {memberSince} &middot; {email}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Tools Available", value: "146", color: "#D97757" },
                { label: "Categories", value: "10", color: "#6366F1" },
                { label: "Free Tier", value: "Active", color: "#10B981" },
                { label: "Plan", value: "Free", color: "#BEB7AC" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
                  className="rounded-xl bg-[#171612] border border-[rgba(255,255,255,0.04)] p-4"
                >
                  <p className="text-[12px] text-[#BEB7AC]/60 uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-[20px] font-semibold" style={{ color: stat.color }}>{stat.value}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* Left Column — Quick Access */}
            <div className="lg:col-span-3 space-y-5">

              {/* Quick Access Tools */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="rounded-2xl bg-[#171612] border border-[rgba(255,255,255,0.04)] p-6"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[18px] font-serif text-[#F6F3EE]">Quick Access</h2>
                  <Link href="/tools" className="text-[13px] text-[#D97757] hover:text-[#e08a6a] transition-colors flex items-center gap-1">
                    View all <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {categories.map((cat, i) => {
                    const Icon = categoryIcons[cat.id] || FileText
                    const color = categoryColors[cat.id] || "#D97757"
                    return (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: 0.3 + i * 0.04 }}
                      >
                        <Link
                          href={`/tools?category=${cat.id}`}
                          className="group flex flex-col items-center gap-2.5 p-4 rounded-xl bg-[#1D1C17] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-all duration-300 hover:bg-[#222222]"
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                            style={{ background: `${color}15` }}
                          >
                            <Icon className="w-5 h-5" style={{ color }} />
                          </div>
                          <div className="text-center">
                            <p className="text-[13px] font-medium text-[#F6F3EE] group-hover:text-white transition-colors">{cat.name}</p>
                            <p className="text-[11px] text-[#BEB7AC]/50 mt-0.5">{cat.count} tools</p>
                          </div>
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Popular Tools */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="rounded-2xl bg-[#171612] border border-[rgba(255,255,255,0.04)] p-6"
              >
                <h2 className="text-[18px] font-serif text-[#F6F3EE] mb-5">Popular Tools</h2>
                <div className="space-y-2">
                  {[
                    { name: "Compress PDF", desc: "Reduce PDF file size", href: "/tools/pdf-compress", icon: FileText, color: "#EF4444" },
                    { name: "Remove Background", desc: "AI background removal", href: "/tools/remove-bg", icon: Image, color: "#8B5CF6" },
                    { name: "AI Writer", desc: "Generate content with AI", href: "/tools/ai-writer", icon: Sparkles, color: "#6366F1" },
                    { name: "JSON Formatter", desc: "Format JSON code", href: "/tools/json-formatter", icon: Code, color: "#22D3EE" },
                    { name: "SEO Analyzer", desc: "Analyze page SEO", href: "/tools/seo-analyzer", icon: Search, color: "#F59E0B" },
                  ].map((tool, i) => {
                    const Icon = tool.icon
                    return (
                      <motion.div
                        key={tool.name}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: 0.4 + i * 0.06 }}
                      >
                        <Link
                          href={tool.href}
                          className="group flex items-center gap-4 p-3 rounded-xl hover:bg-[#1D1C17] transition-all duration-200"
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                            style={{ background: `${tool.color}15` }}
                          >
                            <Icon className="w-5 h-5" style={{ color: tool.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium text-[#F6F3EE] group-hover:text-white transition-colors">{tool.name}</p>
                            <p className="text-[12px] text-[#BEB7AC]/60 truncate">{tool.desc}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#BEB7AC]/30 group-hover:text-[#BEB7AC]/60 transition-colors flex-shrink-0" />
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Profile Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="rounded-2xl bg-[#171612] border border-[rgba(255,255,255,0.04)] p-6"
              >
                <h2 className="text-[18px] font-serif text-[#F6F3EE] mb-5">Account</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1D1C17]">
                    <Mail className="w-5 h-5 text-[#BEB7AC] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[#BEB7AC]/60 uppercase tracking-wider">Email</p>
                      <p className="text-[14px] text-[#F6F3EE] truncate">{email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1D1C17]">
                    <Lock className="w-5 h-5 text-[#BEB7AC] flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[12px] text-[#BEB7AC]/60 uppercase tracking-wider">Password</p>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="text-[14px] text-[#D97757] hover:text-[#e08a6a] transition-colors cursor-pointer"
                      >
                        {hasPassword ? "Change password" : "Set password"}
                      </button>
                    </div>
                    <span className="text-[11px] text-[#BEB7AC]/30 px-2 py-1 rounded-md bg-[rgba(255,255,255,0.03)]">
                      {hasPassword ? "Email" : "OAuth"}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column — Premium + Settings */}
            <div className="lg:col-span-2 space-y-5">

              {/* Premium Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="rounded-2xl overflow-hidden"
              >
                <div className="relative p-[1px]">
                  {/* Animated gradient border */}
                  <div
                    className="absolute inset-0 opacity-50"
                    style={{
                      background: "conic-gradient(from 0deg, transparent, #D97757, transparent, #D97757, transparent)",
                      animation: "spin-border 4s linear infinite",
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-15 blur-md"
                    style={{
                      background: "conic-gradient(from 0deg, transparent, #D97757, transparent, #D97757, transparent)",
                      animation: "spin-border 4s linear infinite",
                    }}
                  />

                  <div className="relative rounded-2xl bg-[#171612] p-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D97757] to-[#D97757]/60 flex items-center justify-center">
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-[18px] font-serif text-[#F6F3EE]">Upgrade to Pro</h2>
                        <p className="text-[12px] text-[#BEB7AC]/60">Unlock everything</p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-6">
                      {premiumFeatures.map((feature, i) => {
                        const Icon = feature.icon
                        return (
                          <div
                            key={i}
                            className="relative flex items-center gap-3"
                            onMouseEnter={() => setActiveTooltip(i)}
                            onMouseLeave={() => setActiveTooltip(null)}
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-4 h-4 text-[#10B981]" />
                            </div>
                            <span className="text-[13px] text-[#BEB7AC] flex-1">{feature.text}</span>
                            <button className="cursor-pointer text-[#BEB7AC]/30 hover:text-[#BEB7AC]/60 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4M12 8h.01" />
                              </svg>
                            </button>
                            {activeTooltip === i && (
                              <div className="absolute bottom-full right-0 mb-2 w-52 p-2.5 rounded-lg bg-[#2a2926] border border-[rgba(255,255,255,0.08)] text-[12px] text-[#BEB7AC] shadow-xl z-10">
                                {feature.tip}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Pricing */}
                    <div className="mb-5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[14px] text-[#BEB7AC]">Starting at</span>
                        <span className="text-[32px] font-serif text-[#F6F3EE] leading-none">₹152</span>
                        <span className="text-[14px] text-[#BEB7AC]">/month</span>
                      </div>
                      <p className="text-[12px] text-[#BEB7AC]/50 mt-1">Billed yearly. Save 20%.</p>
                    </div>

                    <PremiumButton href="/pricing" className="w-full">
                      Upgrade Now
                    </PremiumButton>
                  </div>

                  <style>{`
                    @keyframes spin-border {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              </motion.div>

              {/* Quick Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="rounded-2xl bg-[#171612] border border-[rgba(255,255,255,0.04)] p-6"
              >
                <h2 className="text-[18px] font-serif text-[#F6F3EE] mb-4">Quick Links</h2>
                <div className="space-y-2">
                  {[
                    { label: "Browse All Tools", href: "/tools", icon: Zap },
                    { label: "AI Chat Assistant", href: "/ai/chat", icon: Sparkles },
                    { label: "View Pricing", href: "/pricing", icon: Crown },
                    { label: "Home", href: "/", icon: Globe },
                  ].map((link, i) => {
                    const Icon = link.icon
                    return (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="group flex items-center gap-3 p-3 rounded-xl hover:bg-[#1D1C17] transition-all duration-200"
                      >
                        <Icon className="w-4 h-4 text-[#BEB7AC]/60 group-hover:text-[#D97757] transition-colors" />
                        <span className="text-[14px] text-[#BEB7AC] group-hover:text-[#F6F3EE] transition-colors flex-1">{link.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#BEB7AC]/30 group-hover:text-[#BEB7AC]/60 transition-colors" />
                      </Link>
                    )
                  })}
                </div>
              </motion.div>

              {/* Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="rounded-2xl bg-[#171612] border border-[rgba(255,255,255,0.04)] p-6"
              >
                <h2 className="text-[18px] font-serif text-[#F6F3EE] mb-4">Settings</h2>

                {/* Sign Out */}
                <button
                  onClick={async () => {
                    await signOut()
                    router.push("/")
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#1D1C17] transition-all duration-200 cursor-pointer group"
                >
                  <LogOut className="w-4 h-4 text-[#BEB7AC]/60 group-hover:text-[#D97757] transition-colors" />
                  <span className="text-[14px] text-[#BEB7AC] group-hover:text-[#F6F3EE] transition-colors text-left">Sign out</span>
                </button>

                {/* Delete Account */}
                <div className="mt-2 pt-3 border-t border-[rgba(255,255,255,0.04)]">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/5 transition-all duration-200 cursor-pointer group"
                  >
                    <Trash2 className="w-4 h-4 text-[#BEB7AC]/40 group-hover:text-red-400 transition-colors" />
                    <span className="text-[14px] text-[#BEB7AC]/60 group-hover:text-red-400 transition-colors text-left">Delete account</span>
                  </button>

                  {showDeleteConfirm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                      className="mt-2 p-4 rounded-xl bg-red-500/5 border border-red-500/20"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-[13px] text-red-400 font-medium">Are you sure?</span>
                      </div>
                      <p className="text-[13px] text-[#BEB7AC] mb-4">
                        This action cannot be undone. All your data will be permanently deleted.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleting}
                          className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center"
                        >
                          {deleting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            "Yes, delete"
                          )}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] text-[#BEB7AC] text-[13px] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      <SetPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        userEmail={email}
        hasPassword={hasPassword}
      />
    </>
  )
}
