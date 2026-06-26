"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Image, Video, Music, Sparkles, Type } from "lucide-react"

const dockItems = [
  { label: "PDF", icon: FileText, href: "/tools?category=pdf" },
  { label: "Image", icon: Image, href: "/tools?category=image" },
  { label: "Video", icon: Video, href: "/tools?category=video" },
  { label: "Audio", icon: Music, href: "/tools?category=audio" },
  { label: "AI", icon: Sparkles, href: "/tools?category=ai" },
  { label: "Text", icon: Type, href: "/tools?category=text" },
]

const hideOnPaths = ["/signin", "/signup"]

export function StickyDock() {
  const pathname = usePathname()
  if (hideOnPaths.includes(pathname)) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center pb-4 sm:pb-6 pointer-events-none">
      <nav className="pointer-events-auto flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#1D1C17]/90 backdrop-blur-xl shadow-2xl shadow-black/30">
        {dockItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-0.5 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-xl hover:bg-[rgba(255,255,255,0.05)] active:scale-[0.95] transition-all group"
          >
            <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#BEB7AC] group-hover:text-[#D97757] transition-colors" />
            <span className="text-[9px] sm:text-[10px] text-[#BEB7AC]/60 group-hover:text-[#BEB7AC] transition-colors">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
