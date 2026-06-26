"use client"

import Link from "next/link"
import { useRef, useState } from "react"

interface PremiumButtonProps {
  href: string
  children: React.ReactNode
  variant?: "outline" | "solid"
  className?: string
}

export function PremiumButton({ href, children, variant = "solid", className = "" }: PremiumButtonProps) {
  const btnRef = useRef<HTMLAnchorElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  if (variant === "outline") {
    return (
      <Link
        href={href}
        ref={btnRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative inline-flex items-center justify-center h-11 px-7 rounded-xl text-[13px] font-semibold overflow-hidden transition-all duration-300 group active:scale-[0.97] ${className}`}
        style={{
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#F6F3EE",
        }}
      >
        {/* Spotlight follow cursor */}
        {isHovered && (
          <span
            className="absolute w-32 h-32 rounded-full pointer-events-none transition-opacity duration-300 opacity-100"
            style={{
              left: mousePos.x - 64,
              top: mousePos.y - 64,
              background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
            }}
          />
        )}
        {/* Shine sweep on hover */}
        <span className="absolute inset-0 overflow-hidden rounded-xl">
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </span>
        <span className="relative z-10">{children}</span>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative inline-flex items-center justify-center h-11 px-7 rounded-xl text-[13px] font-semibold overflow-hidden transition-all duration-300 group active:scale-[0.97] ${className}`}
      style={{
        background: "#D97757",
        color: "#000000",
      }}
    >
      {/* Animated gradient border glow */}
      <span className="absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <span
          className="absolute inset-0 rounded-xl"
          style={{
            background: "conic-gradient(from 0deg, transparent, #D97757, transparent, #D97757, transparent)",
            animation: "spin 3s linear infinite",
          }}
        />
      </span>

      {/* Inner solid background to cover the border */}
      <span className="absolute inset-[1px] rounded-[11px] bg-[#D97757] pointer-events-none" />

      {/* Ambient glow pulse */}
      <span className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-xl" style={{ background: "rgba(217,119,87,0.3)" }} />

      {/* Spotlight follow cursor */}
      {isHovered && (
        <span
          className="absolute w-40 h-40 rounded-full pointer-events-none transition-opacity duration-300 opacity-100"
          style={{
            left: mousePos.x - 80,
            top: mousePos.y - 80,
            background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
          }}
        />
      )}

      {/* Shine sweep on hover */}
      <span className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </span>

      <span className="relative z-10">{children}</span>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Link>
  )
}
