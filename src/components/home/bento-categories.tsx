"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, FileText, Image, Video, Music, Sparkles, Type, Code, Search, Megaphone, Briefcase } from "lucide-react"
import { categories, tools } from "@/lib/constants"

const iconMap: Record<string, React.ElementType> = {
  FileText, Image, Video, Music, Sparkles, Type, Code, Search, Megaphone, Briefcase,
}

const featured = categories.slice(0, 4)
const rest = categories.slice(4)

function getToolsForCategory(catId: string) {
  return tools.filter((t) => t.category === catId).slice(0, 3)
}

export function BentoCategories() {
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
            Categories
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-serif text-[clamp(32px,5vw,56px)] text-[#F6F3EE] leading-[1.08] tracking-[-0.02em] mt-4"
          >
            Explore our platform.
          </motion.h2>
        </div>

        {/* Featured — 2x2 giant cards */}
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          {featured.map((cat, i) => {
            const Icon = iconMap[cat.icon] || FileText
            const catTools = getToolsForCategory(cat.id)
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group relative rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#171612] overflow-hidden hover:border-[rgba(255,255,255,0.1)] hover:-translate-y-0.5 transition-all duration-300 min-h-[200px] sm:min-h-[260px]"
              >
                <Link
                  href={`/tools?category=${cat.id}`}
                  className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between"
                >
                  <Icon className="w-7 h-7 text-[#D97757]" />
                  <div>
                    <span className="font-serif text-[clamp(26px,4vw,40px)] text-[#F6F3EE] tracking-tight leading-tight block">
                      {cat.name.replace(" Tools", "")}
                    </span>
                    <p className="text-[13px] text-[#BEB7AC] mt-1 mb-3">{cat.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {catTools.map((t) => (
                        <span key={t.id} className="text-[11px] text-[#BEB7AC]/60 bg-[rgba(255,255,255,0.03)] rounded-full px-2.5 py-0.5">
                          {t.name}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-[13px] text-[#D97757] mt-3 group-hover:translate-x-1 transition-transform">
                      <span>Explore {cat.toolCount} tools</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Rest — smaller compact grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {rest.map((cat, i) => {
            const Icon = iconMap[cat.icon] || FileText
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i + 4) * 0.03 }}
                className="group relative rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#171612] overflow-hidden hover:border-[rgba(255,255,255,0.1)] hover:-translate-y-0.5 transition-all duration-300 min-h-[140px] sm:min-h-[170px]"
              >
                <Link
                  href={`/tools?category=${cat.id}`}
                  className="absolute inset-0 p-5 flex flex-col justify-between"
                >
                  <Icon className="w-5 h-5 text-[#BEB7AC] group-hover:text-[#D97757] transition-colors" />
                  <div>
                    <span className="text-[15px] font-medium text-[#F6F3EE] block leading-tight">
                      {cat.name.replace(" Tools", "")}
                    </span>
                    <span className="text-[12px] text-[#BEB7AC]">{cat.toolCount} tools</span>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
