"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import Link from "next/link"
import { PremiumButton } from "@/components/ui/premium-button"
import { useSubscription } from "@/contexts/subscription-context"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { getCurrencyForCountry } from "@/lib/currencies"

const toolCategories = [
  { name: "Video Tools", filesPerDay: 5 },
  { name: "PDF Tools", filesPerDay: 20 },
  { name: "Image Tools", filesPerDay: 20 },
  { name: "Audio Tools", filesPerDay: 25 },
  { name: "AI Tools", filesPerDay: 15 },
  { name: "Text Tools", filesPerDay: 30 },
  { name: "Developer Tools", filesPerDay: 17 },
  { name: "SEO Tools", filesPerDay: 10 },
  { name: "Marketing Tools", filesPerDay: 5 },
  { name: "Business Tools", filesPerDay: 10 },
]

function TooltipIcon({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex ml-1.5">
      <span
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-medium cursor-help transition-colors"
        style={{
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#9E9E9E",
        }}
      >
        ?
      </span>
      <span
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-[12px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50"
        style={{
          background: "#1D1C17",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#F6F3EE",
        }}
      >
        {text}
      </span>
    </span>
  )
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function PricingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { plan, isPremium, createOrder, verifyPayment } = useSubscription()
  const [yearly, setYearly] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("Video Tools")
  const [showDropdown, setShowDropdown] = useState(false)
  const [paying, setPaying] = useState(false)
  const [currencyCode, setCurrencyCode] = useState("IN")

  // Razorpay test mode only supports INR — detect test key
  const isTestMode = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").startsWith("rzp_test_")

  const currency = isTestMode ? getCurrencyForCountry("IN") : getCurrencyForCountry(currencyCode)
  const monthlyPrice = currency.monthlyDisplay
  const yearlyPrice = currency.yearlyDisplay / 12
  const yearlyTotal = currency.yearlyDisplay
  const symbol = currency.symbol

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)
  }, [])

  // Detect user country on mount (only used in live mode)
  useEffect(() => {
    if (isTestMode) return
    fetch("/api/geo")
      .then((r) => r.json())
      .then((data) => {
        if (data.country) setCurrencyCode(data.country)
      })
      .catch(() => {})
  }, [isTestMode])

  const handlePurchase = async () => {
    if (!user) {
      router.push("/signin")
      return
    }

    if (isPremium) return

    if (typeof window === "undefined" || !window.Razorpay) {
      alert("Payment system is loading. Please try again in a moment.")
      return
    }

    setPaying(true)
    const selectedPlan = yearly ? "yearly" : "monthly"
    const result = await createOrder(selectedPlan, currencyCode)

    if ("error" in result) {
      setPaying(false)
      alert(result.error)
      return
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""

    const options = {
      key: keyId,
      amount: result.amount,
      currency: result.currency || "INR",
      name: "PhoenixTools",
      description: `Premium ${selectedPlan === "monthly" ? "Monthly" : "Yearly"} Plan`,
      order_id: result.orderId,
      handler: async (response: any) => {
        setPaying(true)
        const verifyResult = await verifyPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        )
        setPaying(false)
        if (verifyResult.success) {
          router.push("/dashboard?upgraded=true")
        } else {
          alert(verifyResult.error || "Payment verification failed")
        }
      },
      prefill: {
        email: user?.email || "",
      },
      theme: {
        color: "#D97757",
      },
      modal: {
        ondismiss: () => { setPaying(false) },
      },
    }

    try {
      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", (response: any) => {
        setPaying(false)
        alert(response.error?.description || "Payment failed. Please try again.")
      })
      rzp.open()
    } catch {
      setPaying(false)
      alert("Failed to open payment. Please try again.")
    }
  }

  const currentCategory = toolCategories.find((c) => c.name === selectedCategory)
  const filesPerDay = currentCategory?.filesPerDay ?? 5

  const features = [
    { name: "Tools included", tooltip: "Access to our full suite of 146 utility tools", free: "146", pro: "146" },
    { name: "Files per day", tooltip: `Number of ${selectedCategory} files you can process daily`, free: `${filesPerDay}`, pro: "Unlimited" },
    { name: "Maximum file size", free: "500 MB", pro: "4 GB" },
    { name: "Speed", tooltip: "Processing speed for your files", free: "Fast", pro: "Faster" },
    { name: "Ads", free: "Yes", pro: "No" },
  ]

  return (
    <>
      <Header />
      <div className="pt-24 pb-16 sm:pb-24" style={{ background: "#090909" }}>
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="font-serif text-[clamp(48px,7vw,80px)] text-[#F6F3EE] leading-[0.92] tracking-[-0.04em]"
              style={{ fontWeight: 400 }}
            >
              Pricing
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-[15px] sm:text-[16px] text-[#9E9E9E] mt-4 max-w-lg mx-auto leading-relaxed"
            >
              All apps are free to use, but there are limits on file size and
              <br className="hidden sm:block" /> operations per day.
            </motion.p>
          </div>

          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex items-center justify-center mb-8 sm:mb-10"
          >
            <div
              className="inline-flex rounded-full p-1"
              style={{
                background: "#111111",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <button
                type="button"
                onClick={() => setYearly(false)}
                className="px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300"
                style={{
                  background: !yearly ? "#1D1C17" : "transparent",
                  color: !yearly ? "#F6F3EE" : "#9E9E9E",
                }}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setYearly(true)}
                className="px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300"
                style={{
                  background: yearly ? "#1D1C17" : "transparent",
                  color: yearly ? "#F6F3EE" : "#9E9E9E",
                }}
              >
                Yearly{" "}
                <span className="text-[#D97757] text-[11px] font-medium ml-0.5">-20%</span>
              </button>
            </div>
          </motion.div>

          {/* Pricing Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-2xl mb-10 sm:mb-14 relative"
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Column Headers */}
            <div className="grid grid-cols-3 rounded-t-2xl overflow-hidden">
              {/* Left - Premium Icon */}
              <div className="px-4 sm:px-8 py-6 sm:py-8 flex items-start">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.6 }}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(217,119,87,0.08)" }}
                >
                  <svg viewBox="0 0 48 48" className="w-10 h-10 sm:w-12 sm:h-12" fill="none">
                    <path d="M24 4L4 18L24 44L44 18L24 4Z" stroke="#D97757" strokeWidth="2" fill="rgba(217,119,87,0.1)" strokeLinejoin="round" />
                    <path d="M4 18L24 28L44 18" stroke="#D97757" strokeWidth="2" strokeLinejoin="round" />
                    <path d="M24 28V44" stroke="#D97757" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="24" cy="18" r="4" stroke="#D97757" strokeWidth="1.5" fill="rgba(217,119,87,0.15)" />
                    <path d="M22 18L23.5 19.5L26.5 16.5" stroke="#D97757" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              </div>

              {/* Free Column */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="px-4 sm:px-6 py-6 sm:py-8 text-center border-l"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <div className="text-[14px] font-medium text-[#9E9E9E] mb-2">Free</div>
                <div className="flex items-baseline justify-center gap-0.5">
                  <span className="text-[14px] text-[#9E9E9E]">{symbol}</span>
                  <span className="text-[clamp(32px,5vw,48px)] font-bold text-[#F6F3EE] tracking-tight">0</span>
                </div>
              </motion.div>

              {/* Premium Column */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="px-4 sm:px-6 py-6 sm:py-8 text-center border-l"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <div className="text-[14px] font-medium text-[#D97757] mb-2">Premium</div>
                <div className="flex items-baseline justify-center gap-0.5">
                  <span className="text-[14px] text-[#9E9E9E]">{symbol}</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={yearly ? "yearly" : "monthly"}
                      initial={{ opacity: 0, y: -10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      transition={{ duration: 0.25 }}
                      className="text-[clamp(32px,5vw,48px)] font-bold text-[#F6F3EE] tracking-tight"
                    >
                      {yearly ? Math.round(yearlyPrice) : monthlyPrice}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="text-[12px] text-[#9E9E9E] mt-1">per month</div>
                <AnimatePresence>
                  {yearly && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-[11px] text-[#9E9E9E] mt-0.5 overflow-hidden"
                    >
                      {symbol}{yearlyTotal.toLocaleString()} once a year
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Feature Rows */}
            <div>
              {features.map((row, i) => (
                <motion.div
                  key={row.name}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.5 + i * 0.08 }}
                  className="grid grid-cols-3"
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {/* Feature name */}
                  <div className="px-4 sm:px-8 py-4 flex items-center">
                    <span className="text-[13px] sm:text-[14px] text-[#BEB7AC]">
                      {row.name}
                    </span>
                    {row.tooltip && <TooltipIcon text={row.tooltip} />}
                  </div>

                  {/* Free value */}
                  <div
                    className="px-4 sm:px-6 py-4 text-center border-l flex items-center justify-center"
                    style={{ borderColor: "rgba(255,255,255,0.06)" }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={row.free}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        className="text-[13px] sm:text-[14px] text-[#9E9E9E]"
                      >
                        {row.free}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  {/* Pro value */}
                  <div
                    className="px-4 sm:px-6 py-4 text-center border-l flex items-center justify-center"
                    style={{ borderColor: "rgba(255,255,255,0.06)" }}
                  >
                    <span className="text-[13px] sm:text-[14px] text-[#F6F3EE] font-medium">{row.pro}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom Row - Limits Dropdown + CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.9 }}
              className="grid grid-cols-3 rounded-b-2xl relative"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Limits Dropdown */}
              <div className="px-4 sm:px-8 py-5 flex items-center">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-1.5 text-[13px] sm:text-[14px] text-[#BEB7AC] hover:text-[#F6F3EE] transition-colors"
                  >
                    Limits for{" "}
                    <span className="font-medium text-[#D97757]">{selectedCategory}</span>
                    <motion.svg
                      animate={{ rotate: showDropdown ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </motion.svg>
                  </button>

                  <AnimatePresence>
                    {showDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute top-full left-0 mt-2 w-56 rounded-xl py-2 z-50 max-h-72 overflow-y-auto"
                          style={{
                            background: "#1D1C17",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          {toolCategories.map((cat, ci) => (
                            <motion.button
                              key={cat.name}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.15, delay: ci * 0.03 }}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(cat.name)
                                setShowDropdown(false)
                              }}
                              className="w-full text-left px-4 py-2.5 text-[13px] transition-colors hover:bg-[rgba(255,255,255,0.05)]"
                              style={{
                                color: selectedCategory === cat.name ? "#D97757" : "#BEB7AC",
                              }}
                            >
                              {cat.name}
                            </motion.button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Free CTA */}
              <div
                className="px-4 sm:px-6 py-5 text-center border-l flex items-center justify-center"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <PremiumButton href="/tools" variant="outline">
                  Get Started
                </PremiumButton>
              </div>

              {/* Premium CTA */}
              <div
                className="px-4 sm:px-6 py-5 text-center border-l flex items-center justify-center"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                {isPremium ? (
                  <span className="text-[13px] text-[#10B981] font-medium flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Active
                  </span>
                ) : (
                  <button
                    onClick={handlePurchase}
                    disabled={paying}
                    className="relative inline-flex items-center justify-center h-11 px-7 rounded-xl text-[13px] font-semibold overflow-hidden transition-all duration-300 group active:scale-[0.97] cursor-pointer disabled:opacity-50"
                    style={{ background: "#D97757", color: "#000000" }}
                  >
                    {paying ? (
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      "Get Started"
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="text-center text-[11px] font-medium text-[#9E9E9E] uppercase tracking-[0.2em] mb-6"
            >
              Frequently asked questions
            </motion.h2>
            <div className="space-y-2">
              {[
                { q: "Can I upgrade from Free to Premium anytime?", a: "Yes. Upgrade instantly — no contracts, no commitments." },
                { q: "Is there a free trial for Premium?", a: "Yes. 14-day free trial with full Premium access. Cancel anytime." },
                { q: "What payment methods do you accept?", a: "All major credit cards, PayPal, and bank transfers." },
                { q: "Can I switch plans mid-month?", a: "Yes. Changes apply immediately and we prorate the difference." },
              ].map((faq, i) => (
                <motion.details
                  key={faq.q}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.08 }}
                  className="group rounded-xl transition-all"
                  style={{
                    background: "#111111",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-[14px] text-[#F6F3EE] font-medium list-none">
                    {faq.q}
                    <span className="text-[#9E9E9E] text-lg group-open:rotate-45 transition-transform duration-200">+</span>
                  </summary>
                  <div className="px-5 pb-4 text-[13px] text-[#9E9E9E] leading-relaxed">
                    {faq.a}
                  </div>
                </motion.details>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-12 sm:mt-16 pt-12" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="font-serif text-[clamp(24px,4vw,36px)] text-[#F6F3EE] leading-[1.08] tracking-[-0.02em]"
            >
              Still have questions?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-[15px] text-[#9E9E9E] mt-3 mb-6"
            >
              We&apos;re here to help you find the right plan.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <PremiumButton href="/ai" variant="solid">
                Contact sales
              </PremiumButton>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
