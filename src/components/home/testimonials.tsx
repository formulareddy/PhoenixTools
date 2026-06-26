"use client"

import { useState } from "react"
import { motion } from "framer-motion"

const testimonials = [
  {
    name: "Alex Chen",
    role: "Product Designer at Figma",
    content:
      "The AI tools alone save me hours every day. I use the image background remover and PDF compressor constantly. It's become an essential part of my workflow.",
    rating: 5,
    initials: "AC",
    avatarImg: 1,
  },
  {
    name: "Sarah Johnson",
    role: "Marketing Director at Linear",
    content:
      "Finally, a utility platform that doesn't look like it's from 2010. The design and speed are unmatched. We use it across our entire creative team.",
    rating: 5,
    initials: "SJ",
    avatarImg: 25,
  },
  {
    name: "Marcus Williams",
    role: "Full-Stack Developer at Vercel",
    content:
      "The developer tools are incredibly polished. JSON formatter, CSS minifier, image optimizer — everything just works. I reach for it multiple times a day.",
    rating: 5,
    initials: "MW",
    avatarImg: 42,
  },
  {
    name: "Emily Liu",
    role: "Content Creator",
    content:
      "I process dozens of files daily for my content workflow. This platform handles everything from video compression to AI-powered editing. Absolute game changer.",
    rating: 5,
    initials: "EL",
    avatarImg: 33,
  },
  {
    name: "James Park",
    role: "Engineering Lead at Stripe",
    content:
      "We evaluated several utility platforms before choosing this one. The reliability, speed, and clean API made it an easy decision. Our team productivity went up noticeably.",
    rating: 5,
    initials: "JP",
    avatarImg: 17,
  },
  {
    name: "Priya Patel",
    role: "Design Operations at Notion",
    content:
      "The batch processing capability is incredible. I can resize, convert, and optimize hundreds of images in minutes. The interface is intuitive and beautiful.",
    rating: 5,
    initials: "PP",
    avatarImg: 59,
  },
]

function Avatar({ img, name, initials }: { img: number; name: string; initials: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="w-9 h-9 rounded-full bg-[rgba(217,119,87,0.15)] flex items-center justify-center text-[13px] font-medium text-[#D97757] flex-shrink-0">
        {initials}
      </div>
    )
  }

  return (
    <img
      src={`https://i.pravatar.cc/96?img=${img}`}
      alt={name}
      className="w-9 h-9 rounded-full flex-shrink-0 object-cover bg-[#171612]"
      onError={() => setFailed(true)}
      loading="lazy"
    />
  )
}

function StarRating({ rating, delay }: { rating: number; delay: number }) {
  return (
    <div className="flex items-center gap-1 mb-4">
      {Array.from({ length: rating }).map((_, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 20 20"
          className="w-4 h-4 fill-[#D97757]"
          initial={{ scale: 0, rotate: -30 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: delay + i * 0.05, type: "spring", stiffness: 300, damping: 15 }}
          aria-hidden="true"
        >
          <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.51.91-5.32L2.27 6.62l5.34-.78L10 1z" />
        </motion.svg>
      ))}
    </div>
  )
}

export function Testimonials() {
  return (
    <div className="max-w-6xl mx-auto mb-24">
      <div className="text-center mb-12">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-[11px] font-medium text-[#BEB7AC] uppercase tracking-[0.2em]"
        >
          What people say
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-serif text-[clamp(28px,4vw,44px)] text-[#F6F3EE] mt-3 leading-tight"
        >
          Trusted by creators everywhere
        </motion.h2>
      </div>

      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="group break-inside-avoid rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-6 hover:border-[#D97757]/15 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
          >
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,rgba(217,119,87,0.04),transparent_60%)]" />

            <div className="relative">
              <StarRating rating={t.rating} delay={i * 0.07 + 0.2} />

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 + 0.3 }}
                className="text-[14px] sm:text-[15px] text-[#BEB7AC] leading-[1.7] mb-5 font-[350]"
              >
                {t.content}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 + 0.4 }}
                className="flex items-center gap-3 pt-3 border-t border-[rgba(255,255,255,0.04)]"
              >
                <Avatar img={t.avatarImg} name={t.name} initials={t.initials} />
                <div>
                  <div className="text-[13px] text-[#F6F3EE] font-medium leading-tight">{t.name}</div>
                  <div className="text-[12px] text-[#BEB7AC]/70 leading-tight mt-0.5">{t.role}</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}