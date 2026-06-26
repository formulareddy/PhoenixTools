"use client"

import { useState, useRef } from "react"
import { motion, useInView } from "framer-motion"
import Link from "next/link"
import {
  ArrowRight,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  TrendingUp,
  Clock,
  User,
} from "lucide-react"
import { blogPosts } from "@/lib/blog-data"

const WEB3FORMS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || ""

function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-40px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function BlogContent() {
  const featured = blogPosts[0]
  const rest = blogPosts.slice(1)

  const [email, setEmail] = useState("")
  const [subState, setSubState] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [subMsg, setSubMsg] = useState("")

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    if (!WEB3FORMS_KEY || WEB3FORMS_KEY === "YOUR_ACCESS_KEY_HERE") {
      setSubState("error")
      setSubMsg("Newsletter is not configured yet.")
      setTimeout(() => setSubState("idle"), 4000)
      return
    }

    setSubState("loading")

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          email: email,
          subject: "[PhoenixTools] New Newsletter Subscription",
          message: `New subscriber: ${email}\nSource: Blog newsletter CTA\nPage: /blog`,
          from_name: "PhoenixTools Newsletter",
        }),
      })

      const result = await res.json()

      if (result.success) {
        setSubState("success")
        setSubMsg("You're subscribed! Check your inbox.")
        setEmail("")
        setTimeout(() => setSubState("idle"), 5000)
      } else {
        throw new Error(result.message || "Subscription failed")
      }
    } catch (err: any) {
      setSubState("error")
      setSubMsg(err.message || "Something went wrong. Please try again.")
      setTimeout(() => setSubState("idle"), 4000)
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="relative pt-24 pb-10 sm:pt-28 sm:pb-14 md:pt-32 md:pb-16 lg:pt-32 lg:pb-20 overflow-hidden">
        <div className="hidden sm:block absolute top-0 left-1/4 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-[#D97757]/[0.04] rounded-full blur-[100px] md:blur-[120px] pointer-events-none" />
        <div className="hidden sm:block absolute bottom-0 right-1/4 w-[250px] h-[250px] md:w-[400px] md:h-[400px] bg-[#D97757]/[0.03] rounded-full blur-[80px] md:blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-2xl">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-medium text-[#D97757] uppercase tracking-[0.2em]"
            >
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Blog
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif text-[clamp(30px,6vw,72px)] text-[#F6F3EE] leading-[1.05] sm:leading-[1.02] tracking-[-0.02em] sm:tracking-[-0.03em] mt-3 sm:mt-4"
            >
              Insights &<br />resources.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="text-[14px] sm:text-[15px] md:text-[17px] text-[#BEB7AC] leading-relaxed mt-4 sm:mt-6 max-w-lg"
            >
              Guides, deep dives, and updates from the PhoenixTools team. Learn about
              PDF processing, image optimization, developer workflows, and online privacy.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="pb-10 sm:pb-14 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <Link
              href={`/blog/${featured.slug}`}
              className="group block relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#D97757]/5 via-transparent to-[#6366F1]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-5 sm:p-8 md:p-12 lg:p-16">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <span
                    className="inline-block px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-medium"
                    style={{ backgroundColor: featured.categoryColor + "20", color: featured.categoryColor }}
                  >
                    {featured.category}
                  </span>
                  <span className="text-[11px] sm:text-[12px] text-[#BEB7AC]/50">Featured</span>
                </div>
                <h2 className="font-serif text-[clamp(22px,4vw,40px)] text-[#F6F3EE] leading-[1.1] tracking-[-0.02em] max-w-2xl group-hover:text-[#D97757] transition-colors duration-300">
                  {featured.title}
                </h2>
                <p className="text-[13px] sm:text-[14px] md:text-[15px] text-[#BEB7AC] leading-relaxed mt-3 sm:mt-4 max-w-xl">
                  {featured.excerpt}
                </p>
                <div className="flex items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#D97757]/10 flex items-center justify-center text-[11px] sm:text-[12px] font-medium text-[#D97757]">
                      {featured.author.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[12px] sm:text-[13px] text-[#F6F3EE]">{featured.author.name}</p>
                      <p className="text-[10px] sm:text-[11px] text-[#BEB7AC]/50">{featured.date} · {featured.readTime}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#BEB7AC]/40 group-hover:text-[#D97757] group-hover:translate-x-1 transition-all duration-300 ml-auto" />
                </div>
              </div>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="pb-14 sm:pb-20 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {rest.map((post, i) => (
              <AnimatedSection key={post.slug} delay={0.08 + i * 0.06}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block relative overflow-hidden rounded-xl sm:rounded-2xl border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] p-5 sm:p-6 md:p-7 transition-all duration-500 hover:-translate-y-0.5 h-full"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[rgba(255,255,255,0.02)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <span
                      className="inline-block px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-medium mb-3 sm:mb-4"
                      style={{ backgroundColor: post.categoryColor + "15", color: post.categoryColor }}
                    >
                      {post.category}
                    </span>
                    <h3 className="text-[15px] sm:text-[16px] md:text-[17px] font-medium text-[#F6F3EE] leading-snug group-hover:text-[#D97757] transition-colors duration-300">
                      {post.title}
                    </h3>
                    <p className="text-[12px] sm:text-[13px] text-[#BEB7AC]/70 leading-relaxed mt-2.5 sm:mt-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-2.5 sm:gap-3 mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-[rgba(255,255,255,0.04)]">
                      <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full bg-[rgba(255,255,255,0.04)] flex items-center justify-center text-[9px] sm:text-[10px] text-[#BEB7AC]/60">
                        {post.author.name.charAt(0)}
                      </div>
                      <span className="text-[11px] sm:text-[12px] text-[#BEB7AC]/50">{post.date}</span>
                      <span className="text-[11px] sm:text-[12px] text-[#BEB7AC]/30">·</span>
                      <span className="text-[11px] sm:text-[12px] text-[#BEB7AC]/50">{post.readTime}</span>
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA — Working with Web3Forms */}
      <section className="pb-14 sm:pb-20 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl border border-[rgba(255,255,255,0.06)] p-6 sm:p-10 md:p-12 lg:p-16 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[#D97757]/5 via-transparent to-[#6366F1]/5" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#D97757]/[0.04] rounded-full blur-[100px] pointer-events-none" />

              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-medium text-[#D97757] uppercase tracking-[0.2em] mb-3 sm:mb-4"
                >
                  <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  Newsletter
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="font-serif text-[clamp(22px,3vw,36px)] text-[#F6F3EE] leading-tight"
                >
                  Stay updated
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-[13px] sm:text-[14px] md:text-[15px] text-[#BEB7AC] mt-2.5 sm:mt-3 max-w-md mx-auto"
                >
                  Get the latest insights on tools, productivity, and online privacy delivered to your inbox.
                </motion.p>

                {/* Success message */}
                {subState === "success" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 mt-5 sm:mt-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 max-w-md mx-auto"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <p className="text-[13px] text-emerald-400">{subMsg}</p>
                  </motion.div>
                )}

                {/* Error message */}
                {subState === "error" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 mt-5 sm:mt-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 max-w-md mx-auto"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-[13px] text-red-400">{subMsg}</p>
                  </motion.div>
                )}

                {/* Form */}
                {subState !== "success" && (
                  <motion.form
                    onSubmit={handleSubscribe}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 mt-5 sm:mt-6 md:mt-8 max-w-md mx-auto"
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full sm:flex-1 px-3.5 sm:px-4 py-2.5 rounded-lg sm:rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[13px] sm:text-[14px] text-[#F6F3EE] placeholder:text-[#BEB7AC]/30 focus:outline-none focus:border-[#D97757]/50 focus:ring-1 focus:ring-[#D97757]/20 transition-all duration-300"
                    />
                    <motion.button
                      type="submit"
                      disabled={subState === "loading"}
                      whileHover={{ scale: subState === "loading" ? 1 : 1.02 }}
                      whileTap={{ scale: subState === "loading" ? 1 : 0.98 }}
                      className="w-full sm:w-auto px-5 sm:px-6 py-2.5 rounded-lg sm:rounded-xl bg-[#D97757] hover:bg-[#c66a4c] text-white text-[13px] sm:text-[14px] font-medium transition-all duration-300 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_16px_rgba(217,119,87,0.15)] hover:shadow-[0_0_24px_rgba(217,119,87,0.25)]"
                    >
                      {subState === "loading" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Subscribing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Subscribe
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}

                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="text-[10px] sm:text-[11px] text-[#BEB7AC]/30 mt-2.5 sm:mt-3"
                >
                  No spam. Unsubscribe anytime.
                </motion.p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
