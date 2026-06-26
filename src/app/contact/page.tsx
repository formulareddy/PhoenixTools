"use client"

import { useState, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import {
  Mail,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Zap,
} from "lucide-react"

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
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const WEB3FORMS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || ""

export default function ContactPage() {
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" })
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState("loading")
    setErrorMsg("")

    if (!WEB3FORMS_KEY || WEB3FORMS_KEY === "YOUR_ACCESS_KEY_HERE") {
      setFormState("error")
      setErrorMsg("Contact form is not configured yet. Please set up the Web3Forms access key.")
      return
    }

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          name: formData.name,
          email: formData.email,
          subject: `[PhoenixTools] ${formData.subject}`,
          message: `Name: ${formData.name}\nEmail: ${formData.email}\nSubject: ${formData.subject}\n\nMessage:\n${formData.message}`,
          from_name: "PhoenixTools Contact Form",
          botcheck: false,
        }),
      })

      const result = await res.json()

      if (result.success) {
        setFormState("success")
        setFormData({ name: "", email: "", subject: "", message: "" })
        setTimeout(() => setFormState("idle"), 6000)
      } else {
        throw new Error(result.message || "Submission failed")
      }
    } catch (err: any) {
      setFormState("error")
      setErrorMsg(err.message || "Something went wrong. Please try again.")
      setTimeout(() => setFormState("idle"), 5000)
    }
  }

  const contactMethods = [
    {
      icon: Mail,
      label: "Email",
      value: "support.hittools@gmail.com",
      description: "For general inquiries and support",
    },
    {
      icon: MessageSquare,
      label: "Live Chat",
      value: "Available on our website",
      description: "Mon-Fri, 9am-6pm IST",
    },
    {
      icon: MapPin,
      label: "Location",
      value: "India, Andhra Pradesh",
      description: "Serving users worldwide",
    },
    {
      icon: Clock,
      label: "Response Time",
      value: "Within 24 hours",
      description: "Usually much faster",
    },
  ]

  const faqs = [
    {
      q: "Is PhoenixTools free to use?",
      a: "Yes! PhoenixTools offers a generous free tier with access to all 146+ tools. Free users can process files up to 500MB with daily limits. Premium removes all restrictions.",
    },
    {
      q: "Are my files safe and private?",
      a: "Absolutely. Files are processed locally in your browser whenever possible. When server processing is required, files are automatically deleted after processing. We never store or share your files.",
    },
    {
      q: "How do I upgrade to premium?",
      a: "Visit our pricing page and click 'Get Started' on the plan that works for you. Payment is processed securely through Razorpay. You can upgrade or cancel anytime.",
    },
    {
      q: "Do you offer an API?",
      a: "Yes! Our API is available for premium users. It provides programmatic access to all our tools. Documentation is available in the tools section.",
    },
  ]

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0F0E0A]">
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
                <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Contact
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="font-serif text-[clamp(30px,6vw,72px)] text-[#F6F3EE] leading-[1.05] sm:leading-[1.02] tracking-[-0.02em] sm:tracking-[-0.03em] mt-3 sm:mt-4"
              >
                Get in touch.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="text-[14px] sm:text-[15px] md:text-[17px] text-[#BEB7AC] leading-relaxed mt-4 sm:mt-6 max-w-lg"
              >
                Have a question, feature request, or partnership inquiry? We&apos;d love to hear from you.
                Our team typically responds within 24 hours.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="pb-14 sm:pb-20 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-16">
              {/* Contact Methods */}
              <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                <AnimatedSection>
                  <h2 className="text-[16px] sm:text-[18px] font-serif text-[#F6F3EE] mb-4 sm:mb-6">Contact methods</h2>
                </AnimatedSection>

                <div className="space-y-3 sm:space-y-4">
                  {contactMethods.map((method, i) => (
                    <AnimatedSection key={method.label} delay={0.1 + i * 0.08}>
                      <motion.div
                        whileHover={{ x: 4, borderColor: "rgba(217,119,87,0.2)" }}
                        transition={{ duration: 0.2 }}
                        className="group p-3 sm:p-4 rounded-xl border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.08)] transition-colors duration-300 cursor-default"
                      >
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#D97757]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#D97757]/20 transition-colors"
                          >
                            <method.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D97757]" />
                          </motion.div>
                          <div className="min-w-0">
                            <p className="text-[11px] sm:text-[13px] text-[#BEB7AC]/50 mb-0.5">{method.label}</p>
                            <p className="text-[13px] sm:text-[14px] text-[#F6F3EE] break-all sm:break-normal">{method.value}</p>
                            <p className="text-[11px] sm:text-[12px] text-[#BEB7AC]/40 mt-0.5">{method.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatedSection>
                  ))}
                </div>

                <AnimatedSection delay={0.5}>
                  <motion.div
                    whileHover={{ borderColor: "rgba(217,119,87,0.15)" }}
                    className="p-4 sm:p-5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.08)] transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D97757]" />
                      <h3 className="text-[13px] sm:text-[14px] font-medium text-[#F6F3EE]">Looking for support?</h3>
                    </div>
                    <p className="text-[12px] sm:text-[13px] text-[#BEB7AC]/60 leading-relaxed">
                      Check our{" "}
                      <a
                        href="/ai"
                        className="text-[#D97757] hover:text-[#e08a6a] transition-colors underline underline-offset-2"
                      >
                        AI assistant
                      </a>{" "}
                      for instant answers about any of our 146+ tools. It&apos;s available 24/7 and can help with
                      step-by-step guidance.
                    </p>
                  </motion.div>
                </AnimatedSection>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-3">
                <AnimatedSection delay={0.2}>
                  <motion.div
                    whileHover={{ borderColor: "rgba(217,119,87,0.12)" }}
                    className="p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.01)] hover:border-[rgba(255,255,255,0.1)] transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D97757]" />
                      <h2 className="text-[16px] sm:text-[18px] font-serif text-[#F6F3EE]">Send us a message</h2>
                    </div>
                    <p className="text-[12px] sm:text-[13px] text-[#BEB7AC]/50 mb-5 sm:mb-8">All fields are required</p>

                    {formState === "success" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4 sm:mb-6"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                        >
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
                        </motion.div>
                        <div>
                          <p className="text-[13px] sm:text-[14px] text-emerald-400 font-medium">Message sent!</p>
                          <p className="text-[11px] sm:text-[12px] text-emerald-400/70 mt-0.5">
                            We&apos;ll get back to you within 24 hours.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {formState === "error" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-red-500/10 border border-red-500/20 mb-4 sm:mb-6"
                      >
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
                        <p className="text-[13px] sm:text-[14px] text-red-400">{errorMsg || "Something went wrong. Please try again."}</p>
                      </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                      <input type="hidden" name="botcheck" value="" style={{ display: "none" }} />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4, duration: 0.5 }}
                        >
                          <label className="block text-[12px] sm:text-[13px] text-[#BEB7AC] mb-1.5">Name</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Your name"
                            required
                            className="w-full px-3 sm:px-4 py-2.5 rounded-lg sm:rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[13px] sm:text-[14px] text-[#F6F3EE] placeholder:text-[#BEB7AC]/25 focus:outline-none focus:border-[#D97757]/50 focus:ring-1 focus:ring-[#D97757]/20 transition-all duration-300"
                          />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.45, duration: 0.5 }}
                        >
                          <label className="block text-[12px] sm:text-[13px] text-[#BEB7AC] mb-1.5">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="you@example.com"
                            required
                            className="w-full px-3 sm:px-4 py-2.5 rounded-lg sm:rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[13px] sm:text-[14px] text-[#F6F3EE] placeholder:text-[#BEB7AC]/25 focus:outline-none focus:border-[#D97757]/50 focus:ring-1 focus:ring-[#D97757]/20 transition-all duration-300"
                          />
                        </motion.div>
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      >
                        <label className="block text-[12px] sm:text-[13px] text-[#BEB7AC] mb-1.5">Subject</label>
                        <select
                          name="subject"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          required
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[13px] sm:text-[14px] text-[#F6F3EE] focus:outline-none focus:border-[#D97757]/50 focus:ring-1 focus:ring-[#D97757]/20 transition-all duration-300 appearance-none"
                        >
                          <option value="" disabled className="bg-[#171612]">
                            Select a topic
                          </option>
                          <option value="general" className="bg-[#171612]">
                            General inquiry
                          </option>
                          <option value="support" className="bg-[#171612]">
                            Technical support
                          </option>
                          <option value="feature" className="bg-[#171612]">
                            Feature request
                          </option>
                          <option value="billing" className="bg-[#171612]">
                            Billing question
                          </option>
                          <option value="partnership" className="bg-[#171612]">
                            Partnership
                          </option>
                          <option value="other" className="bg-[#171612]">
                            Other
                          </option>
                        </select>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55, duration: 0.5 }}
                      >
                        <label className="block text-[12px] sm:text-[13px] text-[#BEB7AC] mb-1.5">Message</label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Tell us how we can help..."
                          required
                          rows={4}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[13px] sm:text-[14px] text-[#F6F3EE] placeholder:text-[#BEB7AC]/25 focus:outline-none focus:border-[#D97757]/50 focus:ring-1 focus:ring-[#D97757]/20 transition-all duration-300 resize-none min-h-[100px] sm:min-h-[120px]"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                      >
                        <motion.button
                          type="submit"
                          disabled={formState === "loading"}
                          whileHover={{ scale: formState === "loading" ? 1 : 1.01 }}
                          whileTap={{ scale: formState === "loading" ? 1 : 0.98 }}
                          className="w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-[#D97757] hover:bg-[#c66a4c] text-white text-[13px] sm:text-[14px] font-medium transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(217,119,87,0.15)] hover:shadow-[0_0_30px_rgba(217,119,87,0.25)]"
                        >
                          {formState === "loading" ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Sending...
                            </>
                          ) : formState === "success" ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Sent!
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Send message
                            </>
                          )}
                        </motion.button>
                      </motion.div>
                    </form>
                  </motion.div>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="pb-14 sm:pb-20 md:pb-24 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] md:w-[600px] md:h-[600px] bg-[#D97757]/[0.02] rounded-full blur-[80px] sm:blur-[100px] md:blur-[120px] pointer-events-none" />

          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <AnimatedSection>
              <div className="text-center mb-7 sm:mb-10">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-medium text-[#D97757] uppercase tracking-[0.2em] mb-3 sm:mb-4">
                  <HelpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  FAQ
                </div>
                <h2 className="font-serif text-[clamp(22px,3vw,32px)] text-[#F6F3EE]">
                  Frequently asked questions
                </h2>
              </div>
            </AnimatedSection>

            <div className="space-y-3 sm:space-y-4">
              {faqs.map((faq, i) => (
                <AnimatedSection key={i} delay={0.1 + i * 0.08}>
                  <motion.div
                    whileHover={{ x: 4, borderColor: "rgba(217,119,87,0.2)" }}
                    transition={{ duration: 0.2 }}
                    className="p-4 sm:p-5 md:p-6 rounded-xl border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.08)] transition-colors group"
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#D97757]/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#D97757]/20 transition-colors">
                        <span className="text-[10px] sm:text-[11px] font-bold text-[#D97757]">{i + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[13px] sm:text-[14px] md:text-[15px] font-medium text-[#F6F3EE] mb-1.5 sm:mb-2">{faq.q}</h3>
                        <p className="text-[12px] sm:text-[13px] md:text-[14px] text-[#BEB7AC]/70 leading-relaxed">{faq.a}</p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection delay={0.5}>
              <div className="text-center mt-8 sm:mt-10">
                <a
                  href="/ai"
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-[rgba(255,255,255,0.08)] text-[13px] sm:text-[14px] text-[#F6F3EE] hover:border-[#D97757]/40 hover:text-[#D97757] transition-all duration-300 group"
                >
                  Still have questions?
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
