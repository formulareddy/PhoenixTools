"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

const responses: Record<string, { tool: string; reduction: string; time: string; href: string }> = {
  "compress my pdf": { tool: "Compress PDF", reduction: "up to 70%", time: "~3 seconds", href: "/tools/pdf-compress" },
  "remove background": { tool: "Background Remover", reduction: "pixel-perfect", time: "~1.2 seconds", href: "/tools/remove-background" },
  "build a resume": { tool: "AI Resume Builder", reduction: "ATS-optimized", time: "~30 seconds", href: "/tools/ai-resume" },
  "resize image": { tool: "Resize Image", reduction: "lossless", time: "~0.8 seconds", href: "/tools/image-resize" },
  "convert video": { tool: "Convert Video", reduction: "up to 87% smaller", time: "~8 seconds", href: "/tools/video-convert" },
}

const defaultResponse = { tool: "Tool Finder", reduction: "smart match", time: "instant", href: "/tools" }

export function AIWorkspace() {
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [result, setResult] = useState<{ tool: string; reduction: string; time: string; href: string } | null>(null)
  const [demoIndex, setDemoIndex] = useState(0)
  const [demoText, setDemoText] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const demos = ["compress my pdf", "remove background", "build a resume", "convert video"]

  useEffect(() => {
    let charIndex = 0; let isDeleting = false
    const type = () => {
      const current = demos[demoIndex]
      if (!isDeleting) {
        setDemoText(current.slice(0, charIndex + 1))
        charIndex++
        if (charIndex === current.length) { setTimeout(() => { isDeleting = true }, 2000); return }
      } else {
        setDemoText(current.slice(0, charIndex - 1))
        charIndex--
        if (charIndex === 0) {
          isDeleting = false; setDemoIndex((prev) => (prev + 1) % demos.length)
        }
      }
    }
    const interval = setInterval(type, 60)
    return () => clearInterval(interval)
  }, [demoIndex])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setIsThinking(true)
    setResult(null)
    setTimeout(() => {
      const key = input.trim().toLowerCase()
      const match = Object.keys(responses).find((k) => key.includes(k))
      setResult(match ? responses[match] : defaultResponse)
      setIsThinking(false)
    }, 1200)
  }

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div className="sticky top-24">
            <motion.span
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-[11px] font-medium text-[#BEB7AC] uppercase tracking-[0.2em]"
            >
              AI Workspace
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="font-serif text-[clamp(32px,5vw,56px)] text-[#F6F3EE] leading-[1.08] tracking-[-0.02em] mt-4 mb-4"
            >
              Ask. Get. Go.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              className="text-[15px] text-[#BEB7AC] leading-relaxed max-w-sm"
            >
              Describe what you need in plain English. Our AI routes you to the right tool, pre-configured and ready.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            >
              <Link
                href="/ai"
                className="inline-flex items-center gap-1.5 text-[14px] text-[#F6F3EE] mt-6 hover:text-[#D97757] transition-colors group"
              >
                Try the AI workspace
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 24, y: 12 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative"
          >
            {/* Ambient glow */}
            <div className="absolute -inset-4 rounded-3xl bg-[#D97757]/[0.04] blur-2xl pointer-events-none" />

            <div className="relative rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-5 sm:p-6 overflow-hidden">
              {/* Shimmer sweep */}
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute inset-0 opacity-[0.015]"
                  style={{
                    background: "linear-gradient(105deg, transparent 40%, rgba(217,119,87,0.3) 50%, transparent 60%)",
                    animation: "shimmer 4s ease-in-out infinite",
                  }}
                />
              </div>

              <form onSubmit={handleSubmit} className="relative flex items-center gap-3 h-14 px-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1D1C17] focus-within:border-[#D97757]/25 transition-all duration-300 group">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="w-4 h-4 text-[#D97757] flex-shrink-0" />
                </motion.div>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={demoText || "What would you like to do?"}
                  className="flex-1 bg-transparent text-[14px] text-[#F6F3EE] placeholder:text-[#BEB7AC]/50 outline-none min-w-0"
                />
                <button type="submit" className="relative text-[12px] text-[#D97757] font-medium hover:text-[#D97757]/80 transition-colors flex-shrink-0">
                  Ask AI
                </button>
              </form>

              <div className="mt-4 min-h-[180px]">
                <AnimatePresence mode="wait">
                  {isThinking && (
                    <motion.div
                      key="thinking"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-3 py-8 justify-center"
                    >
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          className="w-2 h-2 rounded-full bg-[#D97757]"
                        />
                        <motion.div
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                          className="w-2 h-2 rounded-full bg-[#D97757]"
                        />
                        <motion.div
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                          className="w-2 h-2 rounded-full bg-[#D97757]"
                        />
                      </div>
                      <motion.span
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-[14px] text-[#BEB7AC]"
                      >
                        AI is finding the right tool...
                      </motion.span>
                    </motion.div>
                  )}

                  {result && !isThinking && (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 12, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="flex items-center gap-2 mb-3"
                      >
                        <span className="text-[11px] text-[#10B981] bg-[#10B981]/10 rounded-full px-2.5 py-0.5 font-medium">
                          AI Recommendation
                        </span>
                      </motion.div>
                      <Link
                        href={result.href}
                        className="group block rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1D1C17] p-4 hover:border-[#D97757]/20 transition-all duration-300"
                      >
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-[16px] font-medium text-[#F6F3EE] group-hover:text-[#D97757] transition-colors"
                        >
                          {result.tool}
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="flex items-center gap-4 mt-2"
                        >
                          <div>
                            <span className="text-[11px] text-[#BEB7AC]/50">Reduction</span>
                            <div className="text-[13px] text-[#10B981]">{result.reduction}</div>
                          </div>
                          <div>
                            <span className="text-[11px] text-[#BEB7AC]/50">Time</span>
                            <div className="text-[13px] text-[#F6F3EE]">{result.time}</div>
                          </div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                          className="flex items-center gap-1 text-[12px] text-[#D97757] mt-3 group-hover:translate-x-1 transition-transform"
                        >
                          Open tool <ArrowRight className="w-3 h-3" />
                        </motion.div>
                      </Link>
                    </motion.div>
                  )}

                  {!isThinking && !result && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="py-6 text-center"
                    >
                      <p className="text-[13px] text-[#BEB7AC]/50">
                        Try: &ldquo;compress my pdf&rdquo; or &ldquo;remove background&rdquo;
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  )
}