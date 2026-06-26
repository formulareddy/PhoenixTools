"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const collections = [
  {
    title: "For Students",
    description: "PDF tools, resume builder, citation generator, and more.",
    tools: ["Compress PDF", "AI Summarizer", "Resume Builder", "Word Counter"],
  },
  {
    title: "For Designers",
    description: "Image editing, background removal, format conversion.",
    tools: ["Resize Image", "Remove Background", "Image Converter", "Enhance Image"],
  },
  {
    title: "For Businesses",
    description: "Invoices, contracts, document generation, and analytics.",
    tools: ["Invoice Generator", "PDF Merger", "Document Analyzer", "QR Generator"],
  },
  {
    title: "For Developers",
    description: "Code formatters, validators, and conversion tools.",
    tools: ["JSON Formatter", "HTML Formatter", "CSS Minifier", "Unit Converter"],
  },
]

export function ToolCollections() {
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
            Collections
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-serif text-[clamp(28px,5vw,48px)] text-[#F6F3EE] leading-[1.08] tracking-[-0.02em] mt-4"
          >
            Curated for your role.
          </motion.h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {collections.map((col, i) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="group rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-5 sm:p-6 hover:border-[#D97757]/15 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(217,119,87,0.04),transparent_60%)]" />

              <motion.h3
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 + 0.15 }}
                className="relative text-[16px] font-medium text-[#F6F3EE] mb-2 group-hover:text-[#D97757] transition-colors"
              >
                {col.title}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 + 0.2 }}
                className="relative text-[13px] text-[#BEB7AC] leading-relaxed mb-5"
              >
                {col.description}
              </motion.p>
              <ul className="relative space-y-1.5 mb-5 sm:mb-6">
                {col.tools.map((tool, ti) => (
                  <motion.li
                    key={tool}
                    initial={{ opacity: 0, x: -6 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.08 + 0.25 + ti * 0.05 }}
                    className="text-[13px] text-[#BEB7AC] group-hover:text-[#BEB7AC]/80 transition-colors"
                  >
                    {tool}
                  </motion.li>
                ))}
              </ul>
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 + 0.4 }}
                className="relative"
              >
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-1 text-[13px] text-[#F6F3EE] hover:text-[#D97757] transition-colors group/link"
                >
                  Browse all
                  <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}