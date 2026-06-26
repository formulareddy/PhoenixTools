"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const actions = [
  { label: "Compress PDF", description: "Reduce file size without losing quality", href: "/tools/pdf-compress" },
  { label: "Remove Background", description: "AI-powered background removal", href: "/tools/remove-background" },
  { label: "Convert Video", description: "Convert between any video format", href: "/tools/video-convert" },
  { label: "Build Resume", description: "AI generates your perfect resume", href: "/tools/ai-resume" },
  { label: "Generate Invoice", description: "Professional invoices in seconds", href: "/tools/invoice-generator" },
  { label: "Create QR Code", description: "QR codes for any link or text", href: "/tools/qr-generator" },
]

export function PopularActions() {
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
            Popular Actions
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-serif text-[clamp(32px,5vw,56px)] text-[#F6F3EE] leading-[1.08] tracking-[-0.02em] mt-4"
          >
            What people do most.
          </motion.h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
            >
              <Link
                href={action.href}
                className="group flex items-start justify-between rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-6 hover:border-[rgba(255,255,255,0.1)] hover:bg-[#1D1C17] hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="min-w-0">
                  <h3 className="text-[15px] font-medium text-[#F6F3EE] group-hover:text-[#D97757] transition-colors">
                    {action.label}
                  </h3>
                  <p className="text-[13px] text-[#BEB7AC] mt-1.5 leading-relaxed">{action.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#BEB7AC] group-hover:text-[#D97757] group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5 ml-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
