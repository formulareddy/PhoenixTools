"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileDown, Scan, Video, ArrowDown } from "lucide-react"
import Link from "next/link"

const demos = [
  {
    icon: FileDown,
    label: "PDF Compression",
    before: "24 MB",
    after: "7.2 MB",
    unit: "70% smaller",
    color: "#EF4444",
    href: "/tools/pdf-compress",
  },
  {
    icon: Scan,
    label: "Background Removal",
    before: "With background",
    after: "Removed",
    unit: "1.2s processing",
    color: "#8B5CF6",
    href: "/tools/remove-background",
  },
  {
    icon: Video,
    label: "Video Conversion",
    before: "480 MB (MOV)",
    after: "64 MB (MP4)",
    unit: "87% smaller",
    color: "#06B6D4",
    href: "/tools/video-convert",
  },
]

export function LiveDemo() {
  const [current, setCurrent] = useState(0)
  const [phase, setPhase] = useState<"before" | "processing" | "after">("before")

  useEffect(() => {
    const sequence = async () => {
      setPhase("before")
      await new Promise((r) => setTimeout(r, 2000))
      setPhase("processing")
      await new Promise((r) => setTimeout(r, 1200))
      setPhase("after")
      await new Promise((r) => setTimeout(r, 2500))
      setCurrent((prev) => (prev + 1) % demos.length)
    }
    sequence()
  }, [current])

  const demo = demos[current]

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="max-w-lg mx-auto text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-[11px] font-medium text-[#BEB7AC] uppercase tracking-[0.2em]"
          >
            See it in action
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-serif text-[clamp(28px,5vw,48px)] text-[#F6F3EE] leading-[1.08] tracking-[-0.02em] mt-4"
          >
            Real results. Real fast.
          </motion.h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <Link
            href={demo.href}
            className="group block rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-6 sm:p-8 hover:border-[rgba(255,255,255,0.1)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.04)] flex items-center justify-center">
                <demo.icon className="w-4 h-4" style={{ color: demo.color }} />
              </div>
              <div>
                <span className="text-[15px] font-medium text-[#F6F3EE]">{demo.label}</span>
                <span className="block text-[12px] text-[#BEB7AC]">Click to try it</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {phase === "before" && (
                <motion.div
                  key="before"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-8 sm:gap-12"
                >
                  <div className="text-center">
                    <div className="text-[clamp(28px,4vw,42px)] font-medium text-[#F6F3EE]">
                      {demo.before}
                    </div>
                    <div className="text-[13px] text-[#BEB7AC] mt-1">Before</div>
                  </div>
                  <div className="text-[#BEB7AC]/30">
                    <ArrowDown className="w-5 h-5" />
                  </div>
                  <div className="text-center opacity-40">
                    <div className="text-[clamp(28px,4vw,42px)] font-medium text-[#F6F3EE]">
                      {demo.after}
                    </div>
                    <div className="text-[13px] text-[#BEB7AC] mt-1">After</div>
                  </div>
                </motion.div>
              )}

              {phase === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border border-[#D97757]/30 border-t-[#D97757] animate-spin" />
                    <span className="text-[14px] text-[#BEB7AC]">Processing with AI...</span>
                  </div>
                </motion.div>
              )}

              {phase === "after" && (
                <motion.div
                  key="after"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-8 sm:gap-12"
                >
                  <div className="text-center opacity-40">
                    <div className="text-[clamp(28px,4vw,42px)] font-medium text-[#F6F3EE]">
                      {demo.before}
                    </div>
                    <div className="text-[13px] text-[#BEB7AC] mt-1">Before</div>
                  </div>
                  <div className="text-[#10B981]">
                    <ArrowDown className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <div className="text-[clamp(28px,4vw,42px)] font-medium text-[#10B981]">
                      {demo.after}
                    </div>
                    <div className="text-[13px] text-[#10B981] mt-1">{demo.unit}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-center gap-1.5 mt-6 sm:mt-8">
              {demos.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current ? "bg-[#D97757] w-6" : "bg-[rgba(255,255,255,0.08)] w-1.5"
                  }`}
                />
              ))}
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}
