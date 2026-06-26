import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="text-2xl font-bold mb-3">Page not found</h1>
        <p className="text-[#F6F3EE]/60 mb-8">
          The page you&apos;re looking for doesn&apos; exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#D97757] text-white rounded-xl font-medium hover:bg-[#D97757]/90 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
