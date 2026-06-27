"use client"

import Link from "next/link"
import { tools } from "@/lib/constants"
import { lazy, Suspense } from "react"
import { getToolConfigs } from "@/components/tools/tool-configs"

const ToolWrapper = lazy(() => import("@/components/tools/tool-wrapper").then(m => ({ default: m.ToolWrapper })))
const MergeWrapper = lazy(() => import("@/components/tools/merge-wrapper").then(m => ({ default: m.MergeWrapper })))

const loadingFallback = (
  <div className="pt-32 text-center px-5">
    <div className="animate-spin w-6 h-6 border-2 border-[#D97757] border-t-transparent rounded-full mx-auto" />
  </div>
)

export default function ToolPageClient({ slug }: { slug: string }) {
  const tool = tools.find((t) => t.id === slug)
  const configs = getToolConfigs()
  const config = configs[slug] || null

  if (!tool) {
    return (
      <div className="pt-32 text-center px-5">
        <p className="text-[14px] text-[#BEB7AC]">Tool not found</p>
        <Link href="/tools" className="text-[14px] text-[#F6F3EE] mt-2 inline-block hover:text-[#D97757]">Back to tools</Link>
      </div>
    )
  }

  if (slug === "pdf-merge") {
    return <Suspense fallback={loadingFallback}><MergeWrapper /></Suspense>
  }

  if (config) {
    return <Suspense fallback={loadingFallback}><ToolWrapper config={config} /></Suspense>
  }

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
