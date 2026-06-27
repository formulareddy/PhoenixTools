"use client"

import { useEffect } from "react"

export default function ToolPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isChunkError =
    error.message?.includes("Loading chunk") ||
    error.message?.includes("ChunkLoadError") ||
    error.message?.includes("missing:") ||
    error.digest?.includes("ChunkLoadError")

  useEffect(() => {
    if (isChunkError) {
      const timer = setTimeout(() => {
        window.location.reload()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isChunkError])

  if (isChunkError) {
    return (
      <div className="pt-32 text-center px-5">
        <div className="animate-spin w-6 h-6 border-2 border-[#D97757] border-t-transparent rounded-full mx-auto" />
        <p className="text-[14px] text-[#BEB7AC] mt-4">Reloading with fresh assets...</p>
        <p className="text-[12px] text-[#BEB7AC]/60 mt-2">If this persists, try hard refresh (Ctrl+Shift+R)</p>
      </div>
    )
  }

  return (
    <div className="pt-32 text-center px-5">
      <p className="text-[14px] text-[#BEB7AC]">Something went wrong loading this tool.</p>
      <p className="text-[12px] text-[#BEB7AC]/60 mt-2">{error.message}</p>
      <button onClick={reset} className="mt-4 px-4 py-2 bg-[#D97757] text-white rounded-lg text-[13px]">Try Again</button>
    </div>
  )
}
