"use client"

import { useEffect, useRef, useState } from "react"
import { LogoMarquee } from "./logo-marquee"
import { Testimonials } from "./testimonials"

const liveStats = [
  { label: "Files processed monthly", raw: 1200000, display: "1.2M+" },
  { label: "Available tools", raw: 500, display: "500+" },
  { label: "Countries served", raw: 180, display: "180+" },
  { label: "Success rate", raw: 99.98, display: "99.98%", isPercent: true },
]

function LiveCounter({ raw, display, label, isPercent }: { raw: number; display: string; label: string; isPercent?: boolean }) {
  const [current, setCurrent] = useState("0")
  const ref = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          if (isPercent) {
            let count = 0; const increment = raw / 30
            const interval = setInterval(() => {
              count += increment
              if (count >= raw) { count = raw; clearInterval(interval); setCurrent(display); return }
              setCurrent(`${count.toFixed(1)}%`)
            }, 30)
          } else {
            let count = 0; const increment = Math.ceil(raw / 30)
            const interval = setInterval(() => {
              count += increment
              if (count >= raw) { count = raw; clearInterval(interval); setCurrent(display); return }
              setCurrent(count.toLocaleString())
            }, 30)
          }
        }
      },
      { threshold: 0.5 },
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [raw, display, isPercent])

  return (
    <div ref={ref} className="text-center">
      <div className="text-[clamp(36px,5vw,64px)] font-medium text-[#F6F3EE] tracking-tight">{current}</div>
      <div className="text-[14px] text-[#BEB7AC] mt-1">{label}</div>
    </div>
  )
}

const trustGroups = [
  "Startups", "Agencies", "Creators", "Developers", "Enterprise",
]

export function TrustLayer() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Stats */}
        <div className="max-w-3xl mx-auto mb-16">
          <span className="text-[11px] font-medium text-[#BEB7AC] uppercase tracking-[0.2em] block text-center mb-8">
            Platform metrics
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
            {liveStats.map((s) => (
              <LiveCounter key={s.label} raw={s.raw} display={s.display} label={s.label} isPercent={s.isPercent} />
            ))}
          </div>
        </div>

        <LogoMarquee />

        <Testimonials />

        {/* Role badges */}
        <div className="text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {trustGroups.map((g) => (
              <span key={g} className="text-[13px] text-[#BEB7AC] px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.06)] hover:border-[#D97757]/30 transition-all">
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
