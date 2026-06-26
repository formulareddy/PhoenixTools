"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState("loading")
    setErrorMsg("")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset email")
      }

      setState("success")
    } catch (err: any) {
      setState("error")
      setErrorMsg(err.message || "Something went wrong. Please try again.")
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0F0E0A] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#D97757]/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-[#D97757]" />
            </div>
            <h1 className="font-serif text-[28px] sm:text-[32px] text-[#F6F3EE] tracking-[-0.02em]">
              Reset password
            </h1>
            <p className="text-[14px] text-[#BEB7AC]/60 mt-2">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.01)]">
            {state === "success" ? (
              <div className="text-center py-4">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <h2 className="text-[16px] font-medium text-[#F6F3EE] mb-1">Check your email</h2>
                <p className="text-[13px] text-[#BEB7AC]/60">
                  If an account exists with <span className="text-[#F6F3EE]">{email}</span>, you&apos;ll receive a
                  password reset link shortly.
                </p>
                <Link
                  href="/signin"
                  className="inline-flex items-center gap-2 mt-6 text-[13px] text-[#D97757] hover:text-[#e08a6a] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {state === "error" && (
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-[13px] text-red-400">{errorMsg}</p>
                  </div>
                )}

                <div>
                  <label className="block text-[13px] text-[#BEB7AC] mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[14px] text-[#F6F3EE] placeholder:text-[#BEB7AC]/25 focus:outline-none focus:border-[#D97757]/50 focus:ring-1 focus:ring-[#D97757]/20 transition-all duration-300"
                  />
                </div>

                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="w-full py-2.5 rounded-xl bg-[#D97757] hover:bg-[#c66a4c] text-white text-[14px] font-medium transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {state === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </button>

                <Link
                  href="/signin"
                  className="flex items-center justify-center gap-2 text-[13px] text-[#BEB7AC]/50 hover:text-[#F6F3EE] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to sign in
                </Link>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
