"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Search, ArrowRight, Clock, Star } from "lucide-react"
import { tools } from "@/lib/constants"
import { cn } from "@/lib/utils"

const recentTools = ["Compress PDF", "Remove Background", "AI Resume Builder"]
const favoriteTools = ["Remove Background", "Invoice Generator", "AI OCR"]

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === "Escape") setIsOpen(false)
    }
    const onCustom = () => setIsOpen(true)
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("open-palette", onCustom)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("open-palette", onCustom)
    }
  }, [])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
    else setQuery("")
  }, [isOpen])

  const results = query
    ? tools.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.description.toLowerCase().includes(query.toLowerCase()),
      ).slice(0, 6)
    : []

  useEffect(() => { setSelectedIndex(0) }, [query])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const total = results.length > 0 ? results.length : favoriteTools.length
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((prev) => (prev + 1) % total) }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((prev) => (prev - 1 + total) % total) }
      if (e.key === "Enter" && results.length > 0) {
        window.location.href = results[selectedIndex].href
        setIsOpen(false)
      }
    },
    [results, selectedIndex],
  )

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-[640px] rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#1D1C17] shadow-2xl shadow-black/40 overflow-hidden">
        <div className="flex items-center gap-3 px-5 h-14 border-b border-[rgba(255,255,255,0.06)]">
          <Search className="w-4 h-4 text-[#BEB7AC] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search tools..."
            className="flex-1 bg-transparent text-[15px] text-[#F6F3EE] placeholder:text-[#BEB7AC]/50 outline-none"
          />
          <kbd className="text-[11px] text-[#BEB7AC]/40 border border-[rgba(255,255,255,0.06)] rounded-md px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {query && results.length > 0 && (
            <div>
              <div className="px-3 py-2 text-[11px] text-[#BEB7AC]/50 uppercase tracking-wider font-medium">Tools</div>
              {results.map((tool, i) => (
                <Link
                  key={tool.id}
                  href={tool.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors",
                    i === selectedIndex ? "bg-[rgba(255,255,255,0.05)]" : "hover:bg-[rgba(255,255,255,0.03)]",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-[#F6F3EE]">{tool.name}</div>
                    <div className="text-[12px] text-[#BEB7AC]">{tool.description}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#BEB7AC]/40" />
                </Link>
              ))}
            </div>
          )}

          {!query && (
            <>
              {recentTools.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-[#BEB7AC]/50 uppercase tracking-wider font-medium">
                    <Clock className="w-3 h-3" />
                    Recent
                  </div>
                  {recentTools.map((name) => (
                    <div
                      key={name}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.03)] transition-colors cursor-pointer text-[14px] text-[#BEB7AC]"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              )}
              {favoriteTools.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-[#BEB7AC]/50 uppercase tracking-wider font-medium">
                    <Star className="w-3 h-3" />
                    Favorites
                  </div>
                  {favoriteTools.map((name) => (
                    <div
                      key={name}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.03)] transition-colors cursor-pointer text-[14px] text-[#BEB7AC]"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {query && results.length === 0 && (
            <div className="py-8 text-center text-[14px] text-[#BEB7AC]/50">
              No tools found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
