"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"

function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="relative w-5 h-5 flex flex-col items-center justify-center">
      <span
        className={cn(
          "absolute w-5 h-[1.5px] bg-current rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isOpen ? "translate-y-0 rotate-45" : "-translate-y-[5px]"
        )}
      />
      <span
        className={cn(
          "absolute w-5 h-[1.5px] bg-current rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isOpen ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
        )}
      />
      <span
        className={cn(
          "absolute w-5 h-[1.5px] bg-current rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isOpen ? "translate-y-0 -rotate-45" : "translate-y-[5px]"
        )}
      />
    </div>
  )
}

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isMobileOpen])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled ? "bg-[#0F0E0A]/80 backdrop-blur-xl border-b border-[rgba(255,255,255,0.04)]" : "bg-transparent",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-2.5 text-[18px] font-serif text-[#F6F3EE] tracking-tight">
            <Logo className="w-7 h-7 sm:w-8 sm:h-8" />
            PhoenixTools
          </Link>

          <nav className="hidden sm:flex items-center gap-6 lg:gap-8">
            <Link href="/tools" className="font-serif text-[15px] lg:text-[16px] text-[#BEB7AC] hover:text-[#F6F3EE] transition-colors">
              Tools
            </Link>
            <Link href="/ai" className="font-serif text-[15px] lg:text-[16px] text-[#BEB7AC] hover:text-[#F6F3EE] transition-colors">
              AI
            </Link>
            <Link href="/pricing" className="font-serif text-[15px] lg:text-[16px] text-[#BEB7AC] hover:text-[#F6F3EE] transition-colors">
              Pricing
            </Link>
            <Link href="/contact" className="font-serif text-[15px] lg:text-[16px] text-[#BEB7AC] hover:text-[#F6F3EE] transition-colors">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-palette"))}
              className="hidden sm:flex items-center gap-1.5 text-[12px] lg:text-[13px] text-[#BEB7AC]/60 border border-[rgba(255,255,255,0.08)] rounded-lg px-2.5 py-1.5 hover:text-[#F6F3EE] hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer"
            >
              <Search className="w-3 h-3" />
              <span>Ctrl</span>
              <span className="text-[#BEB7AC]/40">K</span>
            </button>

            <Link
              href="/signin"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-300 hover:bg-[rgba(255,255,255,0.06)] active:scale-[0.97]"
              style={{
                fontFamily: '"Claude-Text", ui-sans-serif, system-ui, -apple-system, sans-serif',
                color: "#F6F3EE",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <User className="w-4 h-4 text-[#BEB7AC]" />
              Sign In
            </Link>

            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className={cn(
                "sm:hidden flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300",
                isMobileOpen
                  ? "bg-[rgba(255,255,255,0.06)] text-[#F6F3EE]"
                  : "text-[#BEB7AC] hover:text-[#F6F3EE] hover:bg-[rgba(255,255,255,0.04)]"
              )}
              aria-label="Menu"
            >
              <HamburgerIcon isOpen={isMobileOpen} />
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 top-14 sm:top-16 bg-[#0F0E0A]/98 backdrop-blur-2xl sm:hidden transition-all duration-400",
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      >
        <nav className="flex flex-col px-5 pt-6 sm:pt-8 gap-0.5">
          {[
            { href: "/tools", label: "Tools" },
            { href: "/ai", label: "AI" },
            { href: "/pricing", label: "Pricing" },
            { href: "/contact", label: "Contact" },
          ].map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "text-[16px] sm:text-[17px] text-[#F6F3EE] py-3 sm:py-3.5 px-4 rounded-xl hover:bg-[rgba(255,255,255,0.04)] active:bg-[rgba(255,255,255,0.06)] transition-all",
                isMobileOpen ? "animate-slide-in" : "opacity-0"
              )}
              style={{ animationDelay: isMobileOpen ? `${i * 60}ms` : "0ms" }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/signin"
            onClick={() => setIsMobileOpen(false)}
            className={cn(
              "flex items-center gap-2.5 text-[16px] sm:text-[17px] text-[#F6F3EE] py-3 sm:py-3.5 px-4 rounded-xl hover:bg-[rgba(255,255,255,0.04)] active:bg-[rgba(255,255,255,0.06)] transition-all",
              isMobileOpen ? "animate-slide-in" : "opacity-0"
            )}
            style={{
              animationDelay: isMobileOpen ? "180ms" : "0ms",
              fontFamily: '"Claude-Text", ui-sans-serif, system-ui, -apple-system, sans-serif',
            }}
          >
            <User className="w-4 h-4 text-[#BEB7AC]" />
            Sign In
          </Link>
          <button
            onClick={() => { setIsMobileOpen(false); window.dispatchEvent(new CustomEvent("open-palette")) }}
            className={cn(
              "mt-4 sm:mt-6 border-t border-[rgba(255,255,255,0.06)] pt-5 sm:pt-6 px-4 flex items-center gap-2.5 text-[13px] sm:text-[14px] text-[#BEB7AC]/60 w-full text-left rounded-xl",
              isMobileOpen ? "animate-slide-in" : "opacity-0"
            )}
            style={{ animationDelay: isMobileOpen ? "180ms" : "0ms" }}
          >
            <Search className="w-4 h-4" />
            <span>Press Ctrl+K to search</span>
          </button>
        </nav>
      </div>
    </header>
  )
}
