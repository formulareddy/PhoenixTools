"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
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

export function AICommandSearch() {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [placeholder, setPlaceholder] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let index = 0
    let charIndex = 0
    let isDeleting = false

    const type = () => {
      const current = examples[index]
      if (!isDeleting) {
        setPlaceholder(current.slice(0, charIndex + 1))
        charIndex++
        if (charIndex === current.length) {
          setTimeout(() => { isDeleting = true }, 2500)
          return
        }
      } else {
        setPlaceholder(current.slice(0, charIndex - 1))
        charIndex--
        if (charIndex === 0) {
          isDeleting = false
          index = (index + 1) % examples.length
        }
      }
    }

    const interval = setInterval(type, 70)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false)
      }
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
          t.description.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5)
  }, [query])

  return (
    <section className="py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-[11px] font-medium text-[#BEB7AC] uppercase tracking-[0.2em]"
          >
            AI Command Search
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-serif text-[clamp(28px,5vw,48px)] text-[#F6F3EE] leading-[1.08] tracking-[-0.02em] mt-4 mb-3"
          >
            What would you like to do?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-[15px] text-[#BEB7AC] mb-10"
          >
            Describe what you need. We&apos;ll find the right tool.
          </motion.p>

          <div ref={containerRef} className="relative max-w-lg mx-auto">
            <div
              className={cn(
                "relative flex items-center h-14 px-5 rounded-2xl border transition-all duration-300",
                isFocused
                  ? "border-[#D97757]/25 bg-[#171612]"
                  : "border-[rgba(255,255,255,0.08)] bg-[#171612] hover:border-[rgba(255,255,255,0.12)]"
              )}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                placeholder={placeholder || "What would you like to do?"}
                className="flex-1 bg-transparent text-[#F6F3EE] placeholder:text-[#BEB7AC]/50 outline-none text-[15px] min-w-0"
              />
            </div>

            {isFocused && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#1D1C17] shadow-2xl shadow-black/50 overflow-hidden z-50">
                {results.map((tool) => (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-[rgba(255,255,255,0.03)] transition-colors group text-left"
                    onClick={() => { setIsFocused(false); setQuery("") }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] text-[#F6F3EE] group-hover:text-[#D97757] transition-colors">
                        {tool.name}
                      </div>
                      <div className="text-[13px] text-[#BEB7AC]">{tool.description}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#BEB7AC] opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}

            {!query && !isFocused && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                {examples.slice(0, 4).map((ex) => (
                  <button
                    key={ex}
                    onClick={() => { setQuery(ex.toLowerCase()); setIsFocused(true) }}
                    className="text-[13px] text-[#BEB7AC] px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] hover:text-[#F6F3EE] transition-all"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
