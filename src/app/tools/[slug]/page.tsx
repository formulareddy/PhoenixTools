import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import ToolPageClient from "./client"

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <>
      <Header />
      <ToolPageClient slug={slug} />
      <Footer />
    </>
  )
}
