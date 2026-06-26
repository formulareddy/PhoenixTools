import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import BlogContent from "@/components/blog/blog-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog — PhoenixTools",
  description: "Insights, guides, and resources on PDF processing, image optimization, developer tools, SEO, and online privacy.",
  openGraph: {
    title: "Blog — PhoenixTools",
    description: "Insights, guides, and resources on PDF processing, image optimization, developer tools, SEO, and online privacy.",
    type: "website",
  },
}

export default function BlogPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0F0E0A]">
        <BlogContent />
      </main>
      <Footer />
    </>
  )
}
