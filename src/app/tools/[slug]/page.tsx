import { Suspense } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import ToolPageClient from "./client"

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="pt-32 text-center px-5">
          <div className="animate-spin w-6 h-6 border-2 border-[#D97757] border-t-transparent rounded-full mx-auto" />
          <p className="text-[13px] text-[#BEB7AC] mt-4">Loading tool...</p>
        </div>
      }>
        <ToolPageClient slug={slug} />
      </Suspense>
      <Footer />
    </>
  )
}
