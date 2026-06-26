"use client"

import Link from "next/link"
import { tools } from "@/lib/constants"
import { ToolWrapper } from "@/components/tools/tool-wrapper"
import { MergeWrapper } from "@/components/tools/merge-wrapper"
import { useState, useEffect } from "react"

export default function ToolPageClient({ slug }: { slug: string }) {
  const [config, setConfig] = useState<any>(undefined)

  useEffect(() => {
    import("@/components/tools/tool-configs").then((mod) => {
      const configs = mod.getToolConfigs()
      setConfig(configs[slug] || null)
    })
  }, [slug])

  const tool = tools.find((t) => t.id === slug)

  if (!tool) {
    return (
      <div className="pt-32 text-center px-5">
        <p className="text-[14px] text-[#BEB7AC]">Tool not found</p>
        <Link href="/tools" className="text-[14px] text-[#F6F3EE] mt-2 inline-block hover:text-[#D97757]">Back to tools</Link>
      </div>
    )
  }

  if (config === undefined) {
    return (
      <div className="pt-32 text-center px-5">
        <div className="animate-spin w-6 h-6 border-2 border-[#D97757] border-t-transparent rounded-full mx-auto" />
        <p className="text-[13px] text-[#BEB7AC] mt-4">Loading tool...</p>
      </div>
    )
  }

  if (slug === "pdf-merge") return <MergeWrapper />

  if (config) return <ToolWrapper config={config} />

  return (
    <div className="pt-20 sm:pt-24 pb-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <Link href="/tools" className="inline-flex items-center gap-1.5 text-[13px] text-[#BEB7AC] hover:text-[#F6F3EE] transition-colors mb-8 sm:mb-10">
        ← All tools
      </Link>
      <h1 className="font-serif text-[clamp(28px,5vw,48px)] text-[#F6F3EE] leading-[1.04] tracking-[-0.02em] mb-4">{tool.name}</h1>
      <p className="text-[14px] sm:text-[15px] text-[#BEB7AC] mb-6">{tool.description}</p>
      <p className="text-[13px] text-[#BEB7AC]/60">This tool is coming soon.</p>
    </div>
  )
}
