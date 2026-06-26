"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, TrendingUp } from "lucide-react"

const trending = [
  { rank: 1, label: "Compress PDF", description: "Reduce file size without losing quality", href: "/tools/pdf-compress", count: "12,438", trend: "today" },
  { rank: 2, label: "Remove Background", description: "AI-powered background removal", href: "/tools/remove-background", count: "8,329", trend: "today" },
  { rank: 3, label: "AI Resume Builder", description: "AI generates your perfect resume", href: "/tools/ai-resume", count: "6,103", trend: "today" },
  { rank: 4, label: "AI OCR", description: "Extract text from images and PDFs", href: "/tools/ai-ocr", count: "5,847", trend: "today" },
  { rank: 5, label: "Convert Video", description: "Convert between any video format", href: "/tools/video-convert", count: "4,211", trend: "today" },
]

export function TrendingTools() {
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
            Trending right now
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-serif text-[clamp(32px,5vw,56px)] text-[#F6F3EE] leading-[1.08] tracking-[-0.02em] mt-4"
          >
            What everyone&apos;s using.
          </motion.h2>
        </div>

        <div className="max-w-xl mx-auto">
          <div className="space-y-2">
            {trending.map((t, i) => (
              <motion.div
                key={t.rank}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link
                  href={t.href}
                  className="group flex items-center gap-4 sm:gap-5 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#171612] px-5 py-4 hover:border-[rgba(255,255,255,0.1)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <span className={`text-[clamp(20px,3vw,28px)] font-serif font-medium min-w-[40px] ${i < 3 ? "text-[#D97757]" : "text-[#BEB7AC]"}`}>
                    #{t.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-medium text-[#F6F3EE] group-hover:text-[#D97757] transition-colors">
                        {t.label}
                      </span>
                      {i === 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-[#10B981]">
                          <TrendingUp className="w-3 h-3" />
                          Live
                        </span>
                      )}
                    </div>
                    <span className="text-[13px] text-[#BEB7AC] block">{t.description}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[13px] text-[#F6F3EE] font-medium">{t.count}</div>
                    <div className="text-[11px] text-[#BEB7AC]/50">
                      used {t.trend}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#BEB7AC] group-hover:text-[#D97757] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
