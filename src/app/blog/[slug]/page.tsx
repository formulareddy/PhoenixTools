import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import Link from "next/link"
import { ArrowLeft, Clock, Calendar, Tag } from "lucide-react"
import { blogPosts, getBlogPost, getAllSlugs } from "@/lib/blog-data"
import type { Metadata } from "next"

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return { title: "Post Not Found — PhoenixTools" }

  return {
    title: `${post.title} — PhoenixTools`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#0F0E0A] flex items-center justify-center">
          <div className="text-center px-5">
            <p className="text-[15px] text-[#BEB7AC]">Post not found</p>
            <Link href="/blog" className="text-[14px] text-[#D97757] mt-3 inline-block hover:text-[#e08a6a] transition-colors">
              Back to blog
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const currentIndex = blogPosts.findIndex((p) => p.slug === slug)
  const nextPost = blogPosts[currentIndex + 1] || blogPosts[0]

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0F0E0A]">
        {/* Article Header */}
        <section className="pt-28 sm:pt-32 pb-10 sm:pb-14">
          <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-[13px] text-[#BEB7AC]/60 hover:text-[#F6F3EE] transition-colors mb-8 sm:mb-10"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All posts
            </Link>

            <div className="flex items-center gap-3 mb-5">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium"
                style={{ backgroundColor: post.categoryColor + "15", color: post.categoryColor }}
              >
                <Tag className="w-3 h-3" />
                {post.category}
              </span>
            </div>

            <h1 className="font-serif text-[clamp(28px,5vw,48px)] text-[#F6F3EE] leading-[1.08] tracking-[-0.02em]">
              {post.title}
            </h1>

            <p className="text-[15px] sm:text-[17px] text-[#BEB7AC] leading-relaxed mt-5 max-w-2xl">
              {post.excerpt}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-8 pt-6 border-t border-[rgba(255,255,255,0.04)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#D97757]/10 flex items-center justify-center text-[13px] font-medium text-[#D97757]">
                  {post.author.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[13px] text-[#F6F3EE]">{post.author.name}</p>
                  <p className="text-[11px] text-[#BEB7AC]/50">{post.author.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[12px] text-[#BEB7AC]/50 ml-auto">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {post.readTime}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="pb-16 sm:pb-20">
          <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
            <article className="space-y-6">
              {post.content.map((paragraph, i) => (
                <p key={i} className="text-[15px] sm:text-[16px] text-[#BEB7AC] leading-[1.85]">
                  {paragraph}
                </p>
              ))}
            </article>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-[rgba(255,255,255,0.04)]">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-lg text-[12px] text-[#BEB7AC]/60 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.04)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Next Post */}
        <section className="pb-20 sm:pb-24">
          <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
            <p className="text-[11px] font-medium text-[#BEB7AC]/40 uppercase tracking-widest mb-4">Next up</p>
            <Link
              href={`/blog/${nextPost.slug}`}
              className="group block p-6 sm:p-8 rounded-2xl border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] transition-all duration-300"
            >
              <span
                className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium mb-3"
                style={{ backgroundColor: nextPost.categoryColor + "15", color: nextPost.categoryColor }}
              >
                {nextPost.category}
              </span>
              <h3 className="font-serif text-[clamp(18px,3vw,24px)] text-[#F6F3EE] leading-snug group-hover:text-[#D97757] transition-colors">
                {nextPost.title}
              </h3>
              <p className="text-[13px] text-[#BEB7AC]/60 mt-2">{nextPost.readTime}</p>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
