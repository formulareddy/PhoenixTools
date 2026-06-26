"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight,
  Search,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Volume2,
  Code,
  Loader2,
  Check,
  Zap,
  Brain,
  Wand2,
  Layers,
  ArrowDown,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

const suggestions = [
  "compress my pdf",
  "remove background",
  "create invoice",
  "translate document",
  "summarize audio",
  "generate qr code",
]

const conversationSteps = [
  {
    type: "user" as const,
    text: "Make this PDF smaller",
  },
  {
    type: "thinking" as const,
    text: "Analyzing file…",
  },
  {
    type: "tool" as const,
    text: "Compress PDF",
    icon: FileText,
  },
  {
    type: "result" as const,
    text: "24MB → 7.2MB",
    detail: "Reduced by 70%",
  },
  {
    type: "done" as const,
    text: "Complete",
  },
]

const conversationSteps2 = [
  {
    type: "user" as const,
    text: "Remove the background from this photo",
  },
  {
    type: "thinking" as const,
    text: "Detecting subject…",
  },
  {
    type: "tool" as const,
    text: "Background Remover",
    icon: ImageIcon,
  },
  {
    type: "result" as const,
    text: "Transparent PNG",
    detail: "Processed in 1.2s",
  },
  {
    type: "done" as const,
    text: "Complete",
  },
]

const conversationSteps3 = [
  {
    type: "user" as const,
    text: "Convert this recording to MP3",
  },
  {
    type: "thinking" as const,
    text: "Detecting format…",
  },
  {
    type: "tool" as const,
    text: "Audio Converter",
    icon: Volume2,
  },
  {
    type: "result" as const,
    text: "WAV → MP3 320kbps",
    detail: "Converted in 4 seconds",
  },
  {
    type: "done" as const,
    text: "Complete",
  },
]

const bentoTools = [
  {
    name: "AI Assistant",
    description: "Describe any task. AI picks the right tool and executes it.",
    icon: Brain,
    large: true,
    color: "#D97757",
    id: "ai-chat",
    href: "/tools/ai-chat",
  },
  {
    name: "AI OCR",
    description: "Extract text from images, receipts, documents.",
    icon: FileText,
    large: false,
    color: "#22D3EE",
    id: "ai-ocr",
    href: "/tools/ai-ocr",
  },
  {
    name: "AI Resume Builder",
    description: "Generate tailored, ATS-optimized resumes.",
    icon: FileText,
    large: false,
    color: "#10B981",
    id: "ai-resume",
    href: "/tools/ai-resume",
  },
  {
    name: "AI Translator",
    description: "Translate between 100+ languages instantly.",
    icon: Layers,
    large: false,
    color: "#F59E0B",
    id: "ai-translate",
    href: "/tools/ai-translate",
  },
  {
    name: "AI Background Removal",
    description: "Remove image backgrounds with pixel precision.",
    icon: ImageIcon,
    large: false,
    color: "#EC4899",
    id: "remove-bg",
    href: "/tools/remove-bg",
  },
  {
    name: "AI Image Enhancement",
    description: "Upscale, denoise, and enhance images.",
    icon: Wand2,
    large: false,
    color: "#8B5CF6",
    id: "image-enhance",
    href: "/tools/image-enhance",
  },
  {
    name: "AI Code Generator",
    description: "Generate code from natural language descriptions.",
    icon: Code,
    large: false,
    color: "#06B6D4",
    id: "ai-code",
    href: "/tools/ai-code",
  },
]

const workflows = [
  {
    title: "Content Creation",
    icon: FileText,
    steps: [
      { name: "AI Writer", action: "Generate draft" },
      { name: "Image Enhancer", action: "Add visuals" },
      { name: "PDF Export", action: "Publish" },
    ],
    result: "Blog post with visuals in 5 minutes",
  },
  {
    title: "Document Processing",
    icon: Layers,
    steps: [
      { name: "AI OCR", action: "Extract text" },
      { name: "AI Summarizer", action: "Summarize" },
      { name: "AI Translator", action: "Translate" },
    ],
    result: "Scanned document translated in 30 seconds",
  },
  {
    title: "Media Optimization",
    icon: Zap,
    steps: [
      { name: "Compress Video", action: "Reduce size" },
      { name: "Convert Audio", action: "Extract audio" },
      { name: "QR Generator", action: "Share" },
    ],
    result: "Shareable media package in minutes",
  },
]

function ConversationTimeline({ steps, delay = 0 }: { steps: typeof conversationSteps; delay?: number }) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      let count = 0
      const interval = setInterval(() => {
        count++
        setVisibleCount(count)
        if (count >= steps.length) {
          clearInterval(interval)
        }
      }, 800)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(startTimeout)
  }, [steps.length, delay])

  useEffect(() => {
    if (visibleCount >= steps.length) {
      const resetTimeout = setTimeout(() => {
        setVisibleCount(0)
        const restartInterval = setInterval(() => {
          setVisibleCount((prev) => {
            if (prev >= steps.length) {
              clearInterval(restartInterval)
              return prev
            }
            return prev + 1
          })
        }, 800)
        return () => clearInterval(restartInterval)
      }, 3000)
      return () => clearTimeout(resetTimeout)
    }
  }, [visibleCount, steps.length])

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {steps.slice(0, visibleCount).map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className={`flex items-start gap-2.5 sm:gap-3 ${i === visibleCount - 1 ? "" : "opacity-60"}`}
        >
          {step.type === "user" && (
            <>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#D97757]/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] sm:text-[11px] font-medium text-[#D97757]">U</span>
              </div>
              <div className="bg-[#D97757]/10 border border-[#D97757]/20 rounded-xl rounded-tl-sm px-3 sm:px-4 py-2 sm:py-2.5 max-w-[200px] sm:max-w-[260px]">
                <p className="text-[12px] sm:text-[13px] text-[#F6F3EE] leading-relaxed">{step.text}</p>
              </div>
            </>
          )}
          {step.type === "thinking" && (
            <>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[rgba(255,255,255,0.04)] flex items-center justify-center shrink-0 mt-0.5">
                <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#BEB7AC] animate-spin" />
              </div>
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5">
                <span className="text-[12px] sm:text-[13px] text-[#BEB7AC]">{step.text}</span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BEB7AC] animate-dot-pulse" style={{ animationDelay: "0s" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BEB7AC] animate-dot-pulse" style={{ animationDelay: "0.2s" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BEB7AC] animate-dot-pulse" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            </>
          )}
          {step.type === "tool" && (
            <>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#D97757]/10 flex items-center justify-center shrink-0 mt-0.5">
                {step.icon && <step.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D97757]" />}
              </div>
              <div className="bg-[#1D1C17] border border-[rgba(255,255,255,0.06)] rounded-xl px-3 sm:px-4 py-2 sm:py-2.5">
                <p className="text-[11px] sm:text-[12px] text-[#BEB7AC] mb-0.5">Selected tool</p>
                <p className="text-[13px] sm:text-[14px] text-[#F6F3EE] font-medium">{step.text}</p>
              </div>
            </>
          )}
          {step.type === "result" && (
            <>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#10B981]/10 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#10B981]" />
              </div>
              <div className="bg-[#10B981]/5 border border-[#10B981]/15 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5">
                <p className="text-[13px] sm:text-[14px] text-[#F6F3EE] font-medium">{step.text}</p>
                <p className="text-[11px] sm:text-[12px] text-[#10B981] mt-0.5">{step.detail}</p>
              </div>
            </>
          )}
          {step.type === "done" && (
            <>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#10B981]/10 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#10B981]" />
              </div>
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5">
                <span className="text-[12px] sm:text-[13px] text-[#10B981] font-medium">{step.text}</span>
              </div>
            </>
          )}
        </motion.div>
      ))}
      {visibleCount === 0 && (
        <div className="flex items-center gap-3 opacity-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7" />
          <div className="h-4" />
        </div>
      )}
    </div>
  )
}

function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [suggestionIndex, setSuggestionIndex] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const currentSuggestion = suggestions[suggestionIndex]
    let timeout: ReturnType<typeof setTimeout>

    if (!isDeleting && displayText.length < currentSuggestion.length) {
      timeout = setTimeout(() => {
        setDisplayText(currentSuggestion.slice(0, displayText.length + 1))
      }, 60)
    } else if (!isDeleting && displayText.length === currentSuggestion.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2000)
    } else if (isDeleting && displayText.length > 0) {
      timeout = setTimeout(() => {
        setDisplayText(displayText.slice(0, -1))
      }, 30)
    } else if (isDeleting && displayText.length === 0) {
      setIsDeleting(false)
      setSuggestionIndex((prev) => (prev + 1) % suggestions.length)
    }

    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, suggestionIndex])

  const handleSubmit = useCallback(() => {
    if (query.trim()) {
      router.push(`/ai/chat?q=${encodeURIComponent(query.trim())}`)
    }
  }, [query, router])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  return (
    <div className="w-full max-w-[900px] mx-auto relative group">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#D97757]/10 via-transparent to-[#D97757]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none" />
      <div className="relative flex items-center h-14 sm:h-[72px] rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] backdrop-blur-xl px-4 sm:px-6 hover:border-[rgba(255,255,255,0.1)] focus-within:border-[rgba(217,119,87,0.3)] focus-within:bg-[rgba(255,255,255,0.03)] transition-all duration-300">
        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#BEB7AC] shrink-0" />
        <div className="ml-2.5 sm:ml-3 flex-1 relative min-w-0">
          {query.length === 0 && (
            <div className="absolute inset-0 flex items-center pointer-events-none overflow-hidden">
              <span className="text-[14px] sm:text-[15px] md:text-[16px] text-[#BEB7AC]/50 whitespace-nowrap">
                {displayText}
                <span className="inline-block w-[2px] h-[16px] sm:h-[18px] bg-[#D97757] ml-0.5 animate-blink align-middle" />
              </span>
            </div>
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder=""
            className="w-full h-full bg-transparent text-[14px] sm:text-[15px] md:text-[16px] text-[#F6F3EE] placeholder:text-transparent outline-none"
          />
        </div>
        <button
          onClick={handleSubmit}
          className="shrink-0 p-2 rounded-lg hover:bg-[rgba(217,119,87,0.1)] transition-colors"
          aria-label="Search"
        >
          <Sparkles className="w-4 h-4 text-[#D97757] opacity-60 hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </div>
  )
}

export default function AIPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative pt-24 sm:pt-32 lg:pt-36 pb-12 sm:pb-20 lg:pb-24 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] lg:w-[600px] h-[200px] sm:h-[350px] lg:h-[400px] bg-[#D97757]/[0.04] rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-8 sm:mb-12 lg:mb-14">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-[11px] font-medium text-[#BEB7AC] uppercase tracking-[0.2em]">AI Features</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-serif text-[clamp(36px,7vw,80px)] text-[#F6F3EE] leading-[0.92] tracking-[-0.04em] mt-4 sm:mt-5 max-w-4xl mx-auto"
              >
                Intelligence that
                <br />
                <span className="text-[#D97757]">amplifies</span> you.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-[14px] sm:text-[15px] md:text-[16px] text-[#BEB7AC] leading-relaxed mt-4 sm:mt-5 max-w-lg mx-auto px-2"
              >
                Describe what you need. AI finds the tool, configures it, and delivers the result.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <SearchBar />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-5"
            >
              {suggestions.map((s) => (
                <Link
                  key={s}
                  href={`/ai/chat?q=${encodeURIComponent(s)}`}
                  className="text-[11px] sm:text-[12px] text-[#BEB7AC]/50 border border-[rgba(255,255,255,0.04)] rounded-full px-2.5 sm:px-3 py-1 hover:border-[rgba(217,119,87,0.3)] hover:text-[#D97757] transition-all duration-200 cursor-pointer"
                >
                  Try: {s}
                </Link>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Conversation Timeline Demo */}
        <section className="py-12 sm:py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-14">
              <span className="text-[11px] font-medium text-[#BEB7AC] uppercase tracking-[0.2em]">See it in action</span>
              <h2 className="font-serif text-[clamp(24px,5vw,48px)] text-[#F6F3EE] leading-[0.96] tracking-[-0.03em] mt-3 sm:mt-4">
                AI chooses the tool.
                <br />
                <span className="text-[#BEB7AC]">You get the result.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 max-w-5xl mx-auto">
              {[
                { steps: conversationSteps, delay: 0 },
                { steps: conversationSteps2, delay: 1500 },
                { steps: conversationSteps3, delay: 3000 },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[#171612] p-4 sm:p-5 lg:p-6 min-h-[260px] sm:min-h-[280px] lg:min-h-[320px] overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-[rgba(255,255,255,0.04)]">
                    <div className="w-2 h-2 rounded-full bg-[#D97757]" />
                    <span className="text-[10px] sm:text-[11px] text-[#BEB7AC] font-medium uppercase tracking-wider">Live demo</span>
                  </div>
                  <ConversationTimeline steps={item.steps} delay={item.delay} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Bento Tool Grid */}
        <section className="py-12 sm:py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-14">
              <span className="text-[11px] font-medium text-[#BEB7AC] uppercase tracking-[0.2em]">AI Tools</span>
              <h2 className="font-serif text-[clamp(24px,5vw,48px)] text-[#F6F3EE] leading-[0.96] tracking-[-0.03em] mt-3 sm:mt-4">
                Built for intelligence.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-5xl mx-auto">
              {bentoTools.map((tool, i) => (
                <motion.div
                  key={tool.name}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <Link
                    href={tool.href}
                    className={`group block rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[#171612] p-4 sm:p-5 lg:p-6 hover:border-[rgba(255,255,255,0.1)] hover:-translate-y-1 transition-all duration-300 ${
                      tool.large ? "sm:col-span-2 lg:col-span-2" : ""
                    }`}
                  >
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-3 sm:mb-4"
                      style={{ backgroundColor: `${tool.color}15` }}
                    >
                      <tool.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: tool.color }} />
                    </div>
                    <h3 className="text-[14px] sm:text-[15px] lg:text-[16px] font-medium text-[#F6F3EE] mb-1 sm:mb-1.5 group-hover:text-[#D97757] transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-[12px] sm:text-[13px] lg:text-[14px] text-[#BEB7AC] leading-relaxed">
                      {tool.description}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-6 sm:mt-8">
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 text-[13px] sm:text-[14px] text-[#BEB7AC] hover:text-[#D97757] transition-colors group"
              >
                View all AI tools
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* AI Command Center */}
        <section className="py-12 sm:py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[#171612] p-5 sm:p-6 md:p-8 lg:p-10 overflow-hidden"
              >
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6"
                >
                  <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#D97757]/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#D97757]" />
                    <div className="absolute inset-0 rounded-xl bg-[#D97757]/20 animate-ping" style={{ animationDuration: "2s" }} />
                  </div>
                  <div>
                    <h3 className="text-[14px] sm:text-[15px] lg:text-[16px] font-medium text-[#F6F3EE]">AI Command Center</h3>
                    <p className="text-[12px] sm:text-[13px] text-[#BEB7AC]">Natural language → tool execution</p>
                  </div>
                </motion.div>

                <div className="space-y-3 sm:space-y-4">
                  {/* Step 1: Input */}
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="rounded-xl border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.02)] p-3 sm:p-4"
                  >
                    <p className="text-[12px] sm:text-[13px] text-[#BEB7AC] mb-1">What do you want to do?</p>
                    <p className="text-[14px] sm:text-[15px] text-[#F6F3EE] font-medium">
                      <motion.span
                        initial={{ width: 0 }}
                        whileInView={{ width: "100%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                        className="inline-block overflow-hidden whitespace-nowrap border-r-2 border-[#D97757] pr-0.5"
                      >
                        compress my pdf
                      </motion.span>
                    </p>
                  </motion.div>

                  {/* Arrow 1 */}
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 1.8 }}
                    className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4"
                  >
                    <motion.div
                      animate={{ y: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D97757] shrink-0" />
                    </motion.div>
                    <motion.span
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 2.0 }}
                      className="text-[12px] sm:text-[13px] text-[#BEB7AC]"
                    >
                      AI understands →
                    </motion.span>
                  </motion.div>

                  {/* Step 2: Tool */}
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 2.2 }}
                    className="rounded-xl border border-[#D97757]/15 bg-[#D97757]/5 p-3 sm:p-4 relative overflow-hidden"
                  >
                    <motion.div
                      initial={{ x: "-100%" }}
                      whileInView={{ x: "100%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 2.4, ease: "easeInOut" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D97757]/10 to-transparent pointer-events-none"
                    />
                    <p className="text-[11px] sm:text-[12px] text-[#BEB7AC] mb-1">Recommended Tool</p>
                    <p className="text-[14px] sm:text-[15px] text-[#F6F3EE] font-medium">Compress PDF</p>
                  </motion.div>

                  {/* Arrow 2 */}
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 2.8 }}
                    className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4"
                  >
                    <motion.div
                      animate={{ y: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    >
                      <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#10B981] shrink-0" />
                    </motion.div>
                    <motion.span
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 3.0 }}
                      className="text-[12px] sm:text-[13px] text-[#BEB7AC]"
                    >
                      Estimated result →
                    </motion.span>
                  </motion.div>

                  {/* Step 3: Result */}
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 3.2 }}
                    className="rounded-xl border border-[#10B981]/15 bg-[#10B981]/5 p-3 sm:p-4 flex items-center justify-between relative overflow-hidden"
                  >
                    <motion.div
                      initial={{ x: "-100%" }}
                      whileInView={{ x: "100%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 3.4, ease: "easeInOut" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-[#10B981]/10 to-transparent pointer-events-none"
                    />
                    <div>
                      <p className="text-[11px] sm:text-[12px] text-[#BEB7AC] mb-0.5">Result</p>
                      <p className="text-[14px] sm:text-[15px] text-[#F6F3EE] font-medium">24MB → 7.2MB</p>
                    </div>
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 200, damping: 12, delay: 3.6 }}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#10B981]/10 flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#10B981]" />
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Workflows */}
        <section className="py-12 sm:py-20 lg:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center mb-10 sm:mb-14 lg:mb-16"
            >
              <motion.span
                initial={{ opacity: 0, letterSpacing: "0.1em" }}
                whileInView={{ opacity: 1, letterSpacing: "0.2em" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-[11px] font-medium text-[#D97757] uppercase tracking-[0.2em] inline-block"
              >
                AI Workflows
              </motion.span>
              <h2 className="font-serif text-[clamp(24px,5vw,48px)] text-[#F6F3EE] leading-[0.96] tracking-[-0.03em] mt-3 sm:mt-4">
                Multi-step{" "}
                <span className="relative inline-block">
                  intelligence.
                  <motion.span
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-[#D97757] to-[#10B981] origin-left"
                  />
                </span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 max-w-5xl mx-auto">
              {workflows.map((w, i) => (
                <motion.div
                  key={w.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                  whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
                  className="relative rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[#171612] p-5 sm:p-6 lg:p-7 group hover:border-[rgba(255,255,255,0.1)] transition-colors duration-300 overflow-hidden"
                >
                  {/* Shimmer overlay on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.02)] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>

                  {/* Header */}
                  <div className="flex items-center gap-3 sm:gap-3.5 mb-5 sm:mb-6">
                    <motion.div
                      whileHover={{ rotate: 15, scale: 1.15 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#D97757]/10 flex items-center justify-center shrink-0"
                    >
                      <w.icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#D97757]" />
                      <div className="absolute inset-0 rounded-xl bg-[#D97757]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.div>
                    <h3 className="text-[15px] sm:text-[16px] font-medium text-[#F6F3EE] group-hover:text-[#D97757] transition-colors duration-300">{w.title}</h3>
                  </div>

                  {/* Steps with animated connectors */}
                  <div className="relative space-y-0">
                    {w.steps.map((step, j) => (
                      <motion.div
                        key={j}
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.3 + j * 0.15 + i * 0.15, ease: "easeOut" }}
                        className="relative"
                      >
                        <div className="flex items-center gap-3 sm:gap-3.5 py-2.5 sm:py-3">
                          {/* Step number with pulse */}
                          <div className="relative shrink-0">
                            <motion.div
                              whileInView={{ scale: [0.8, 1.1, 1] }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: 0.5 + j * 0.15 + i * 0.15 }}
                              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#1D1C17] flex items-center justify-center relative z-10 group-hover:border-[#D97757]/40 transition-colors duration-300"
                            >
                              <span className="text-[10px] sm:text-[11px] text-[#BEB7AC] font-medium group-hover:text-[#D97757] transition-colors duration-300">{j + 1}</span>
                            </motion.div>
                            {/* Pulse ring */}
                            <motion.div
                              initial={{ scale: 1, opacity: 0 }}
                              whileInView={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8, delay: 0.6 + j * 0.15 + i * 0.15 }}
                              className="absolute inset-0 rounded-full border border-[#D97757]/30"
                            />
                          </div>

                          {/* Step content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] sm:text-[14px] text-[#F6F3EE] font-medium">{step.name}</p>
                            <p className="text-[11px] sm:text-[12px] text-[#BEB7AC]/70">{step.action}</p>
                          </div>

                          {/* Animated arrow */}
                          <motion.div
                            initial={{ opacity: 0, x: -4 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: 0.7 + j * 0.15 + i * 0.15 }}
                            className="shrink-0"
                          >
                            <motion.div
                              whileHover={{ x: 4 }}
                              transition={{ type: "spring", stiffness: 400 }}
                            >
                              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#BEB7AC]/30 group-hover:text-[#D97757]/50 transition-colors duration-300" />
                            </motion.div>
                          </motion.div>
                        </div>

                        {/* Animated connector line */}
                        {j < w.steps.length - 1 && (
                          <div className="ml-3 sm:ml-3.5 relative">
                            <div className="w-px h-3 sm:h-3.5 bg-[rgba(255,255,255,0.06)]" />
                            <motion.div
                              initial={{ scaleY: 0 }}
                              whileInView={{ scaleY: 1 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.3, delay: 0.8 + j * 0.15 + i * 0.15 }}
                              className="absolute top-0 left-0 w-px h-3 sm:h-3.5 bg-gradient-to-b from-[#D97757]/40 to-transparent origin-top"
                            />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Result bar */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.9 + i * 0.15 }}
                    className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-[rgba(255,255,255,0.04)] flex items-center gap-2"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 300, damping: 12, delay: 1.0 + i * 0.15 }}
                    >
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#10B981]" />
                    </motion.div>
                    <p className="text-[12px] sm:text-[13px] text-[#10B981] font-medium">{w.result}</p>
                  </motion.div>

                  {/* Bottom glow on hover */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#D97757]/0 to-transparent group-hover:via-[#D97757]/20 transition-all duration-500" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 sm:py-28 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6 }}
                className="font-serif text-[clamp(28px,5vw,56px)] text-[#F6F3EE] leading-[0.94] tracking-[-0.03em]"
              >
                <motion.span
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  Describe what
                </motion.span>
                <br />
                <motion.span
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                >
                  you need.
                </motion.span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="text-[14px] sm:text-[15px] md:text-[16px] text-[#BEB7AC] mt-4 sm:mt-5 max-w-md mx-auto leading-relaxed px-2"
              >
                AI will choose the tools. You get the result.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.55 }}
              >
                <Link
                  href="/ai/chat"
                  className="inline-flex items-center gap-2 h-11 sm:h-12 px-6 sm:px-8 mt-6 sm:mt-8 rounded-xl bg-[#D97757] text-[#0F0E0A] text-[14px] sm:text-[15px] font-medium hover:bg-[#D97757]/90 active:scale-[0.98] transition-all duration-200 group"
                >
                  Start with AI
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </motion.div>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  )
}
