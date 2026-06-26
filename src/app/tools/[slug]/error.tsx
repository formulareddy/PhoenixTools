"use client"

export default function ToolPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="pt-32 text-center px-5">
      <p className="text-[14px] text-[#BEB7AC]">Something went wrong loading this tool.</p>
      <p className="text-[12px] text-[#BEB7AC]/60 mt-2">{error.message}</p>
      <button onClick={reset} className="mt-4 px-4 py-2 bg-[#D97757] text-white rounded-lg text-[13px]">Try Again</button>
    </div>
  )
}
