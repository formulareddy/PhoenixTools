"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { LottiePlayer } from "@/components/ui/lottie-player"
import { AnimatedCardBorder } from "@/components/ui/animated-card-border"
import { useAuth } from "@/contexts/auth-context"

export default function SignInPage() {
  const router = useRouter()
  const { user, loading: authLoading, signIn, signInWithGoogle, signInWithGitHub } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Check for OAuth error params in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get("error")
    if (errorParam) {
      setError("Authentication failed. Please try again.")
      window.history.replaceState({}, "", window.location.pathname)
    }
    const hash = window.location.hash
    if (hash && hash.includes("error")) {
      setError("Authentication failed. Please try again.")
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard")
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error: authError } = await signIn(email, password)

    if (authError) {
      setError("Incorrect email or password")
      setLoading(false)
      return
    }

    window.location.href = "/dashboard"
  }

  // Don't render form while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
        <div className="w-8 h-8 border-2 border-[#D97757]/30 border-t-[#D97757] rounded-full animate-spin" />
      </div>
    )
  }

  // Don't render if already logged in (will redirect)
  if (user) return null

  return (
    <div className="min-h-screen flex bg-[#1a1a1a] relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute top-[15%] left-[8%] w-2 h-2 rounded-full bg-[#D97757]/20 animate-[float-up_4s_ease-in-out_infinite]" />
      <div className="absolute top-[25%] right-[12%] w-1.5 h-1.5 rounded-full bg-[#D97757]/15 animate-[float-up_5s_ease-in-out_infinite_0.5s]" />
      <div className="absolute bottom-[20%] left-[15%] w-1 h-1 rounded-full bg-[#D97757]/10 animate-[float-up_3.5s_ease-in-out_infinite_1s]" />
      <div className="absolute bottom-[30%] right-[8%] w-2.5 h-2.5 rounded-full bg-[#D97757]/15 animate-[float-up_4.5s_ease-in-out_infinite_0.3s]" />
      <div className="absolute top-[60%] left-[5%] w-1.5 h-1.5 rounded-full bg-[#D97757]/10 animate-[float-up_5.5s_ease-in-out_infinite_0.8s]" />

      {/* Left: Illustration + Heading */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative px-8">
        <h1
          className="text-[clamp(32px,4vw,48px)] font-serif text-[#F6F3EE] leading-[1.1] tracking-[-0.02em] text-center mb-6 animate-[slide-in_0.6s_ease-out]"
          style={{ animationDelay: "0.1s", animationFillMode: "both" }}
        >
          Stay Focused<br />
          with{" "}
          <Link href="/" className="text-[#D97757] hover:text-[#e08a6a] transition-colors">
            PhoenixTools
          </Link>
        </h1>
        <div
          className="w-full max-w-[380px] flex items-center justify-center animate-[float-up_0.7s_ease-out]"
          style={{ animationDelay: "0.3s", animationFillMode: "both" }}
        >
          <LottiePlayer
            src="/lottie/login.json"
            className="w-full h-[350px]"
            loop={true}
            autoplay={true}
          />
        </div>
      </div>

      {/* Right: Form Card */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-10 py-10">
        <div className="w-full max-w-[400px]">
          <h1
            className="lg:hidden text-[clamp(28px,4vw,36px)] font-serif text-[#F6F3EE] leading-[1.1] tracking-[-0.02em] mb-6 animate-[slide-in_0.5s_ease-out]"
            style={{ animationDelay: "0.1s", animationFillMode: "both" }}
          >
            Stay Focused<br />
            with{" "}
            <Link href="/" className="text-[#D97757] hover:text-[#e08a6a] transition-colors">
              PhoenixTools
            </Link>
          </h1>

          {/* Mobile Lottie */}
          <div
            className="lg:hidden flex justify-center mb-6 animate-[float-up_0.6s_ease-out]"
            style={{ animationDelay: "0.2s", animationFillMode: "both" }}
          >
            <LottiePlayer
              src="/lottie/login.json"
              className="w-[250px] h-[200px]"
              loop={true}
              autoplay={true}
            />
          </div>

          <AnimatedCardBorder delay={0.35} className="p-7 sm:p-8">
            <h2 className="text-[clamp(22px,3vw,28px)] font-serif text-[#F6F3EE] text-center mb-6">
              Sign In
            </h2>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4 animate-[slide-in_0.3s_ease-out]">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-[13px] text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="animate-[slide-in_0.4s_ease-out]" style={{ animationDelay: "0.45s", animationFillMode: "both" }}>
                <label className="block text-[13px] text-[#BEB7AC] mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="Username@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#e8e4dc] text-[14px] text-[#1a1a1a] placeholder-[#888] outline-none focus:ring-2 focus:ring-[#D97757]/40 transition-all"
                />
              </div>

              <div className="animate-[slide-in_0.4s_ease-out]" style={{ animationDelay: "0.5s", animationFillMode: "both" }}>
                <label className="block text-[13px] text-[#BEB7AC] mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 pr-10 py-2.5 rounded-xl bg-[#e8e4dc] text-[14px] text-[#1a1a1a] placeholder-[#888] outline-none focus:ring-2 focus:ring-[#D97757]/40 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#555] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end animate-[slide-in_0.4s_ease-out]" style={{ animationDelay: "0.55s", animationFillMode: "both" }}>
                <Link href="/forgot-password" className="text-[13px] text-[#D97757] hover:text-[#e08a6a] transition-colors">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full py-2.5 rounded-xl text-[14px] font-medium transition-all duration-300 flex items-center justify-center cursor-pointer animate-[slide-in_0.4s_ease-out]",
                  "bg-[#D97757] hover:bg-[#e08a6a] text-white",
                  loading && "opacity-70 cursor-not-allowed"
                )}
                style={{ animationDelay: "0.6s", animationFillMode: "both", fontFamily: '"Claude-Text", ui-sans-serif, system-ui, -apple-system, sans-serif' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div className="mt-5 animate-[float-up_0.5s_ease-out]" style={{ animationDelay: "0.65s", animationFillMode: "both" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-[rgba(255,255,255,0.1)]" />
                <span className="text-[12px] text-[#BEB7AC]/60">or continue with</span>
                <div className="flex-1 h-px bg-[rgba(255,255,255,0.1)]" />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    const { error } = await signInWithGoogle()
                    if (error) setError(error.message)
                  }}
                  className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-[#e8e4dc] hover:bg-[#ddd9d0] transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const { error } = await signInWithGitHub()
                    if (error) setError(error.message)
                  }}
                  className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-[#e8e4dc] hover:bg-[#ddd9d0] transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1a1a1a">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </button>
              </div>
            </div>

            <p className="mt-5 text-center text-[13px] text-[#BEB7AC] animate-[float-up_0.5s_ease-out]" style={{ animationDelay: "0.7s", animationFillMode: "both" }}>
              Don&apos;t have an account yet?{" "}
              <Link href="/signup" className="text-[#F6F3EE] font-semibold hover:underline">
                Register Now
              </Link>
            </p>
          </AnimatedCardBorder>
        </div>
      </div>
    </div>
  )
}