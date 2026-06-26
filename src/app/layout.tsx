import type { Metadata } from "next"
import { Inter, DM_Serif_Display } from "next/font/google"
import { StickyDock } from "@/components/layout/sticky-dock"
import { CommandPalette } from "@/components/layout/command-palette"
import { Providers } from "@/components/layout/providers"
import { CookieConsent } from "@/components/ui/cookie-consent"
import Script from "next/script"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const dmSerif = DM_Serif_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
})

export const metadata: Metadata = {
  title: "PhoenixTools — Everything you need to get work done.",
  description:
    "500+ tools. One workspace. Compress, convert, edit, generate and automate everything in seconds.",
  openGraph: {
    title: "PhoenixTools — Everything you need to get work done.",
    description: "500+ tools. One workspace.",
    type: "website",
  },
}

const GOOGLE_ADSENSE_ID = process.env.GOOGLE_ADSENSE_ID || ""
const ADSENSE_VALID = GOOGLE_ADSENSE_ID && GOOGLE_ADSENSE_ID.startsWith("ca-pub-") && !GOOGLE_ADSENSE_ID.includes("XXX")

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerif.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#0F0E0A] text-[#F6F3EE] font-sans pb-20 sm:pb-24" suppressHydrationWarning>
        <Providers>
          {children}
          <StickyDock />
          <CommandPalette />
          <CookieConsent />
        </Providers>
        {ADSENSE_VALID && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${GOOGLE_ADSENSE_ID}`}
            strategy="lazyOnload"
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  )
}
