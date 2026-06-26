"use client"

import { motion } from "framer-motion"

export function AnimatedCardBorder({
  children,
  className = "",
  delay = 0.35,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative rounded-2xl p-[2px] overflow-hidden"
    >
      {/* Rotating conic gradient border */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: "conic-gradient(from 0deg, transparent 0%, #D97757 12%, transparent 24%, transparent 50%, #D97757 62%, transparent 74%)",
          animation: "spin-border 4s linear infinite",
        }}
      />

      {/* Soft glow layer */}
      <div
        className="absolute inset-0 opacity-20 blur-md"
        style={{
          background: "conic-gradient(from 0deg, transparent 0%, #D97757 12%, transparent 24%, transparent 50%, #D97757 62%, transparent 74%)",
          animation: "spin-border 4s linear infinite",
        }}
      />

      {/* Inner card */}
      <div className={`relative rounded-2xl bg-[#222222] ${className}`}>
        {children}
      </div>

      <style>{`
        @keyframes spin-border {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  )
}