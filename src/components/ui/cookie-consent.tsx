"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cookie, X } from "lucide-react"
import Link from "next/link"

const CONSENT_KEY = "phoenixtools-cookie-consent"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY)
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted")
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "declined")
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-3 sm:p-4 md:p-5"
        >
          <div className="max-w-4xl mx-auto bg-[#171612] border border-[rgba(255,255,255,0.08)] rounded-xl sm:rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
            <div className="p-4 sm:p-5 md:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#D97757]/10 flex items-center justify-center flex-shrink-0">
                  <Cookie className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#D97757]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] sm:text-[15px] font-medium text-[#F6F3EE] mb-1">
                    We value your privacy
                  </h3>
                  <p className="text-[12px] sm:text-[13px] text-[#BEB7AC]/70 leading-relaxed">
                    We use essential cookies to maintain your session and preferences. We do not use tracking or
                    advertising cookies. Third-party services (Razorpay) may set their own cookies. By clicking
                    &quot;Accept,&quot; you consent to the use of essential cookies.{" "}
                    <Link href="/privacy" className="text-[#D97757] hover:text-[#e08a6a] underline underline-offset-2 transition-colors">
                      Privacy Policy
                    </Link>
                  </p>

                  <div className="flex items-center gap-2.5 sm:gap-3 mt-3.5 sm:mt-4">
                    <button
                      onClick={accept}
                      className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#D97757] hover:bg-[#c66a4c] text-white text-[12px] sm:text-[13px] font-medium transition-all duration-200 cursor-pointer shadow-[0_0_12px_rgba(217,119,87,0.2)]"
                    >
                      Accept
                    </button>
                    <button
                      onClick={decline}
                      className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-[rgba(255,255,255,0.08)] text-[#BEB7AC]/70 hover:text-[#F6F3EE] hover:border-[rgba(255,255,255,0.15)] text-[12px] sm:text-[13px] transition-all duration-200 cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>

                <button
                  onClick={decline}
                  className="flex-shrink-0 p-1.5 rounded-lg text-[#BEB7AC]/30 hover:text-[#F6F3EE] hover:bg-[rgba(255,255,255,0.04)] transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
