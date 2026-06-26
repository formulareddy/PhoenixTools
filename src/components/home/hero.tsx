"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import Link from "next/link"
import { ArrowRight, Search, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { tools } from "@/lib/constants"

const examples = [
  "Compress my PDF",
  "Resize images for web",
  "Convert video to MP4",
  "Generate an invoice",
  "Create a resume",
  "Remove background from photo",
]

const toolEffects: Record<string, { reduction: string; time: string }> = {
  "Compress PDF": { reduction: "up to 70%", time: "~3 seconds" },
  "Remove Background": { reduction: "1-click", time: "~1.2 seconds" },
  "Resize Image": { reduction: "instant", time: "~0.8 seconds" },
  "Convert Video": { reduction: "up to 87%", time: "~8 seconds" },
  "AI Resume Builder": { reduction: "tailored", time: "~30 seconds" },
  "Generate Invoice": { reduction: "auto-filled", time: "~5 seconds" },
  "Compress Image": { reduction: "up to 80%", time: "~2 seconds" },
  "AI OCR": { reduction: "99% accuracy", time: "~3 seconds" },
}

export function Hero() {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [placeholder, setPlaceholder] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let index = 0; let charIndex = 0; let isDeleting = false
    const type = () => {
      const current = examples[index]
      if (!isDeleting) {
        setPlaceholder(current.slice(0, charIndex + 1))
        charIndex++
        if (charIndex === current.length) { setTimeout(() => { isDeleting = true }, 2500); return }
      } else {
        setPlaceholder(current.slice(0, charIndex - 1))
        charIndex--
        if (charIndex === 0) { isDeleting = false; index = (index + 1) % examples.length }
      }
    }
    const interval = setInterval(type, 70)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsFocused(false)
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  const results = useMemo(() => {
    if (query.length === 0) return []
    return tools
      .filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.description.toLowerCase().includes(query.toLowerCase()),
      )
      .slice(0, 5)
  }, [query])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-5 sm:px-8 pt-24 pb-20">
      <div className="absolute inset-0 bg-gradient-to-b from-[#D97757]/[0.02] via-transparent to-transparent pointer-events-none" />

      {/* Floating dots */}
      <div className="absolute top-[18%] left-[10%] w-1.5 h-1.5 rounded-full bg-[#D97757]/15 animate-[float-up_4s_ease-in-out_infinite]" />
      <div className="absolute top-[30%] right-[15%] w-1 h-1 rounded-full bg-[#D97757]/10 animate-[float-up_5s_ease-in-out_infinite_0.5s]" />
      <div className="absolute bottom-[25%] left-[20%] w-2 h-2 rounded-full bg-[#D97757]/12 animate-[float-up_3.5s_ease-in-out_infinite_1s]" />
      <div className="absolute bottom-[15%] right-[10%] w-1.5 h-1.5 rounded-full bg-[#D97757]/10 animate-[float-up_4.5s_ease-in-out_infinite_0.3s]" />

      <div className="relative z-10 w-full max-w-[700px] mx-auto text-center">
        <h1
          className="font-serif text-[clamp(36px,8vw,96px)] text-[#F6F3EE] leading-[0.92] tracking-[-0.03em] text-balance animate-[slide-in_0.7s_ease-out]"
          style={{ animationDelay: "0.1s", animationFillMode: "both" }}
        >
          Everything you need
          <br />
          to get work done.
        </h1>

        <div
          ref={containerRef}
          className="relative max-w-2xl sm:max-w-3xl mx-auto mt-12 sm:mt-16 animate-[float-up_0.7s_ease-out]"
          style={{ animationDelay: "0.35s", animationFillMode: "both" }}
        >
          <div
            className={cn(
              "relative flex items-center h-16 sm:h-[72px] px-5 sm:px-7 rounded-2xl border-2 transition-all duration-300",
              isFocused
                ? "border-[#D97757] bg-[#171612] shadow-lg shadow-[#D97757]/5"
                : "border-[rgba(255,255,255,0.08)] bg-[#171612] hover:border-[rgba(255,255,255,0.12)]",
            )}
          >
            <Search
              className={cn(
                "w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 transition-colors duration-300",
                isFocused ? "text-[#D97757]" : "text-[#BEB7AC]",
              )}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder={placeholder || "What would you like to do?"}
              className="flex-1 bg-transparent text-[#F6F3EE] placeholder:text-[#BEB7AC]/50 outline-none text-[clamp(15px,2vw,20px)] min-w-0 px-4"
            />
            <kbd className="hidden sm:flex items-center gap-1 text-[11px] text-[#BEB7AC]/40 border border-[rgba(255,255,255,0.08)] rounded-lg px-2.5 py-1.5 flex-shrink-0">
              ⌘K
            </kbd>
          </div>

          {isFocused && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#1D1C17] shadow-2xl shadow-black/50 overflow-hidden z-50">
              {results.map((tool, i) => {
                const effect = toolEffects[tool.name]
                return (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    className="flex items-center gap-3 px-5 sm:px-7 py-4 hover:bg-[rgba(255,255,255,0.03)] transition-colors group text-left"
                    onClick={() => { setIsFocused(false); setQuery("") }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {i === 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-[#D97757] bg-[#D97757]/10 rounded-full px-2 py-0.5">
                            <Zap className="w-2.5 h-2.5" />
                            Best match
                          </span>
                        )}
                        <span className="text-[14px] text-[#F6F3EE] group-hover:text-[#D97757] transition-colors">
                          {tool.name}
                        </span>
                      </div>
                      <div className="text-[13px] text-[#BEB7AC]">{tool.description}</div>
                      {effect && (
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] text-[#10B981]">{effect.reduction}</span>
                          <span className="text-[11px] text-[#BEB7AC]/50">{effect.time}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-[#BEB7AC] flex-shrink-0">
                      <span className="hidden sm:inline group-hover:text-[#D97757] transition-colors">Open</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#BEB7AC] group-hover:text-[#D97757] transition-all" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {!query && !isFocused && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6 animate-[float-up_0.5s_ease-out]" style={{ animationDelay: "0.55s", animationFillMode: "both" }}>
              {examples.slice(0, 6).map((ex, i) => (
                <button
                  key={ex}
                  onClick={() => { setQuery(ex.toLowerCase()); setIsFocused(true) }}
                  className="text-[13px] text-[#BEB7AC] px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.06)] hover:border-[#D97757]/30 hover:text-[#F6F3EE] hover:bg-[#D97757]/5 transition-all animate-[slide-in_0.4s_ease-out]"
                  style={{ animationDelay: `${0.6 + i * 0.05}s`, animationFillMode: "both" }}
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 mt-10 animate-[float-up_0.5s_ease-out]" style={{ animationDelay: "0.7s", animationFillMode: "both" }}>
          <Link
            href="/tools"
            className="h-11 px-6 rounded-xl bg-[#D97757] text-[#0F0E0A] text-sm font-medium hover:bg-[#D97757]/90 active:scale-[0.98] transition-all inline-flex items-center gap-1.5"
          >
            Browse all tools
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/ai"
            className="h-11 px-6 rounded-xl border border-[rgba(255,255,255,0.08)] text-sm text-[#BEB7AC] hover:text-[#F6F3EE] hover:border-[rgba(255,255,255,0.12)] active:scale-[0.98] transition-all inline-flex items-center gap-1.5"
          >
            AI features
          </Link>
        </div>
      </div>
    </section>
  )
}
