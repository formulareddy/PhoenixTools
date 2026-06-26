import Link from "next/link"
import { Logo } from "@/components/ui/logo"

const productLinks = [
  { label: "Compress PDF", href: "/tools/pdf-compress" },
  { label: "Merge PDF", href: "/tools/pdf-merge" },
  { label: "Convert PDF", href: "/tools/pdf-to-word" },
  { label: "Resume Builder", href: "/tools/ai-resume" },
  { label: "Remove Background", href: "/tools/remove-background" },
]

const categoryLinks = [
  { label: "PDF", href: "/tools?category=pdf" },
  { label: "Image", href: "/tools?category=image" },
  { label: "Video", href: "/tools?category=video" },
  { label: "Audio", href: "/tools?category=audio" },
  { label: "AI", href: "/tools?category=ai" },
  { label: "Text", href: "/tools?category=text" },
  { label: "Developer", href: "/tools?category=dev" },
  { label: "Business", href: "/tools?category=business" },
]

const companyLinks = [
  { label: "About", href: "/ai" },
  { label: "Blog", href: "/blog" },
  { label: "Pricing", href: "/pricing" },
  { label: "Dashboard", href: "/dashboard" },
]

const resourceLinks = [
  { label: "Help Center", href: "/ai" },
  { label: "API Docs", href: "/tools" },
  { label: "Status", href: "/dashboard" },
  { label: "Contact", href: "/contact" },
]

const popularSearches = [
  { label: "compress pdf", href: "/tools/pdf-compress" },
  { label: "pdf to word", href: "/tools/pdf-to-word" },
  { label: "remove background", href: "/tools/remove-background" },
  { label: "resize image", href: "/tools/image-resize" },
  { label: "convert mp4", href: "/tools/video-convert" },
  { label: "ai ocr", href: "/tools/ai-ocr" },
  { label: "qr code generator", href: "/tools/qr-generator" },
  { label: "invoice generator", href: "/tools/invoice-generator" },
]

export function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.04)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        {/* Main grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-10 sm:gap-12 mb-14 sm:mb-16">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 text-[18px] font-serif text-[#F6F3EE] tracking-tight">
              <Logo className="w-7 h-7 sm:w-8 sm:h-8" />
              PhoenixTools
            </Link>
            <p className="text-[13px] text-[#BEB7AC] leading-relaxed mt-3 max-w-xs">
              500+ tools. One workspace. Everything you need to get work done.
            </p>
          </div>
          <div>
            <h4 className="text-[11px] font-medium text-[#BEB7AC] uppercase tracking-widest mb-4 sm:mb-5">Popular tools</h4>
            <ul className="space-y-2.5 sm:space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[13px] text-[#BEB7AC]/70 hover:text-[#F6F3EE] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-medium text-[#BEB7AC] uppercase tracking-widest mb-4 sm:mb-5">Categories</h4>
            <ul className="space-y-2.5 sm:space-y-3">
              {categoryLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[13px] text-[#BEB7AC]/70 hover:text-[#F6F3EE] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-medium text-[#BEB7AC] uppercase tracking-widest mb-4 sm:mb-5">Company</h4>
            <ul className="space-y-2.5 sm:space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[13px] text-[#BEB7AC]/70 hover:text-[#F6F3EE] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-medium text-[#BEB7AC] uppercase tracking-widest mb-4 sm:mb-5">Resources</h4>
            <ul className="space-y-2.5 sm:space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[13px] text-[#BEB7AC]/70 hover:text-[#F6F3EE] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Popular searches */}
        <div className="border-t border-[rgba(255,255,255,0.04)] pt-7 sm:pt-8 mb-7 sm:mb-8">
          <h4 className="text-[11px] font-medium text-[#BEB7AC] uppercase tracking-widest mb-3">Trending searches</h4>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="text-[12px] sm:text-[13px] text-[#BEB7AC]/50 hover:text-[#F6F3EE] px-2.5 sm:px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.08)] transition-all"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-[rgba(255,255,255,0.04)] pt-5 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-[12px] sm:text-[13px] text-[#BEB7AC]/50">&copy; {new Date().getFullYear()} PhoenixTools. All rights reserved.</p>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/privacy" className="text-[12px] sm:text-[13px] text-[#BEB7AC]/40 hover:text-[#F6F3EE] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-[12px] sm:text-[13px] text-[#BEB7AC]/40 hover:text-[#F6F3EE] transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
