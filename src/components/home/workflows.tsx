"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const workflows = [
  {
    title: "From scan to share",
    steps: ["AI OCR", "AI Summarizer", "AI Translator", "Export PDF"],
    description: "Scan a document → extract text → summarize → translate → share with your team.",
    href: "/ai",
  },
  {
    title: "Perfect profile photo",
    steps: ["Remove Background", "Resize Image", "Enhance Image", "Export"],
    description: "Remove background → resize for LinkedIn → enhance quality → download.",
    href: "/tools?category=image",
  },
  {
    title: "Video for social media",
    steps: ["Trim Video", "Compress Video", "Convert to MP4", "Generate QR"],
    description: "Trim your clip → compress → convert → share instantly via QR code.",
    href: "/tools?category=video",
  },
  {
    title: "Professional document",
    steps: ["AI Writer", "AI Rewriter", "PDF Export", "Compress PDF"],
    description: "Write with AI → polish your draft → export to PDF → compress for email.",
    href: "/tools?category=ai",
  },
]

export function Workflows() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="max-w-lg mb-12">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-[11px] font-medium text-[#BEB7AC] uppercase tracking-[0.2em]"
          >
            Connected workflows
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-serif text-[clamp(32px,5vw,56px)] text-[#F6F3EE] leading-[1.08] tracking-[-0.02em] mt-4"
          >
            Tools that work together.
          </motion.h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {workflows.map((w, i) => (
            <motion.div
              key={w.title}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Link
                href={w.href}
                className="group block rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-5 sm:p-6 hover:border-[#D97757]/15 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(217,119,87,0.04),transparent_60%)]" />

                <motion.h3
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 + 0.15 }}
                  className="relative text-[16px] font-medium text-[#F6F3EE] mb-4 group-hover:text-[#D97757] transition-colors"
                >
                  {w.title}
                </motion.h3>

                {/* Visual pipeline */}
                <div className="relative flex flex-col gap-0">
                  {w.steps.map((step, si) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: i * 0.08 + 0.2 + si * 0.07 }}
                    >
                      <div className="flex items-center gap-3 py-2">
                        <motion.span
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: i * 0.08 + 0.25 + si * 0.07, type: "spring", stiffness: 300, damping: 15 }}
                          className="relative flex items-center justify-center w-7 h-7 rounded-full bg-[#D97757]/10 text-[11px] font-medium text-[#D97757] flex-shrink-0"
                        >
                          {/* Pulse ring on step number */}
                          <motion.span
                            initial={{ scale: 1, opacity: 0.4 }}
                            whileInView={{ scale: 1.6, opacity: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: i * 0.08 + 0.4 + si * 0.07 }}
                            className="absolute inset-0 rounded-full border border-[#D97757]/30"
                          />
                          {si + 1}
                        </motion.span>
                        <span className="text-[13px] text-[#F6F3EE] group-hover:text-[#D97757]/80 transition-colors">
                          {step}
                        </span>
                      </div>
                      {si < w.steps.length - 1 && (
                        <motion.div
                          initial={{ scaleY: 0 }}
                          whileInView={{ scaleY: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: i * 0.08 + 0.3 + si * 0.07 }}
                          className="ml-3.5 pl-3.5 pb-1 border-l border-[rgba(255,255,255,0.06)] origin-top"
                        >
                          <motion.div
                            initial={{ y: -2, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.2, delay: i * 0.08 + 0.35 + si * 0.07 }}
                            className="text-[#BEB7AC]/30 text-[10px] leading-none"
                          >
                            ↓
                          </motion.div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 + 0.5 }}
                  className="relative text-[13px] text-[#BEB7AC] leading-relaxed mt-4 pt-3 border-t border-[rgba(255,255,255,0.04)]"
                >
                  {w.description}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  whileInView={{ opacity: 0 }}
                  viewport={{ once: true }}
                  className="relative flex items-center gap-1 text-[13px] text-[#D97757] mt-3 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300"
                >
                  Start this workflow
                  <ArrowRight className="w-3 h-3" />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}