"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body className="bg-[#0F0E0A] text-[#F6F3EE] min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
          <p className="text-[#F6F3EE]/60 mb-8">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#D97757] text-white rounded-xl font-medium hover:bg-[#D97757]/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
