"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Search } from "lucide-react"
import { tools, categories } from "@/lib/constants"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

function ToolsPageContent() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category")

  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>(categoryParam || "all")

  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam)
    }
  }, [categoryParam])

  const filteredTools = useMemo(() => {
    let result = tools
    if (activeCategory !== "all") {
      result = result.filter((t) => t.category === activeCategory)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      )
    }
    return result
  }, [activeCategory, searchQuery])

  const grouped = useMemo(() => {
    if (activeCategory !== "all") return null
    const groups: Record<string, typeof tools> = {}
    filteredTools.forEach((t) => {
      if (!groups[t.category]) groups[t.category] = []
      groups[t.category].push(t)
    })
    return groups
  }, [filteredTools, activeCategory])

  return (
    <>
      <Header />
      <div className="pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg mb-8 sm:mb-12">
            <span className="text-[11px] font-medium text-[#BEB7AC] uppercase tracking-[0.2em]">Tools</span>
            <h1 className="font-serif text-[clamp(28px,6vw,64px)] text-[#F6F3EE] leading-[1.04] tracking-[-0.02em] mt-4">
              All <span className="text-[#D97757]">500+</span> tools.
            </h1>
          </div>

          <div className="max-w-md mb-6 sm:mb-10">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BEB7AC]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] text-sm text-[#F6F3EE] placeholder:text-[#BEB7AC]/50 outline-none focus:border-[rgba(255,255,255,0.1)] transition-all"
              />
            </div>
          </div>

          <div className="flex overflow-x-auto gap-2 mb-8 sm:mb-12 pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            {[{ id: "all", name: "All" }, ...categories].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                  activeCategory === cat.id
                    ? "bg-[#F6F3EE] text-[#0F0E0A]"
                    : "text-[#BEB7AC] border border-[rgba(255,255,255,0.06)] hover:text-[#F6F3EE] hover:border-[rgba(255,255,255,0.1)]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {grouped && !searchQuery ? (
            Object.entries(grouped).map(([category, catTools]) => (
              <div key={category} className="mb-10 sm:mb-14">
                <h2 className="text-[14px] font-medium text-[#F6F3EE] mb-3 sm:mb-4">
                  {categories.find((c) => c.id === category)?.name || category}
                  <span className="text-[#BEB7AC] ml-2">({catTools.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {catTools.map((tool, i) => (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.015 }}
                    >
                      <Link
                        href={tool.href}
                        className="group flex items-center justify-between gap-2 sm:gap-3 rounded-xl border border-[rgba(255,255,255,0.04)] bg-[#171612] px-3 sm:px-4 py-3 hover:border-[rgba(255,255,255,0.08)] hover:-translate-y-0.5 transition-all duration-300"
                      >
                        <span className="text-[13px] sm:text-[14px] text-[#F6F3EE] group-hover:text-[#D97757] transition-colors min-w-0">
                          {tool.name}
                        </span>
                        <span className="text-[11px] sm:text-[12px] text-[#BEB7AC] text-right truncate min-w-0 hidden sm:block">{tool.description}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredTools.map((tool, i) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.015 }}
                >
                  <Link
                    href={tool.href}
                    className="group flex items-center justify-between gap-2 sm:gap-3 rounded-xl border border-[rgba(255,255,255,0.04)] bg-[#171612] px-3 sm:px-4 py-3 hover:border-[rgba(255,255,255,0.08)] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <span className="text-[13px] sm:text-[14px] text-[#F6F3EE] group-hover:text-[#D97757] transition-colors min-w-0">
                      {tool.name}
                    </span>
                    <span className="text-[11px] sm:text-[12px] text-[#BEB7AC] text-right truncate min-w-0 hidden sm:block">{tool.description}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default function ToolsPage() {
  return (
    <Suspense fallback={null}>
      <ToolsPageContent />
    </Suspense>
  )
}
