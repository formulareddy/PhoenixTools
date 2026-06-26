"use client"

import {
  siGoogle, siApple, siNetflix, siSpotify, siAirbnb, siUber, siShopify,
  siStripe, siFigma, siNotion, siDiscord, siDropbox,
} from "simple-icons"

type BrandData = { title: string; hex: string; path: string }

const logos: { name: string; svg: React.ReactNode }[] = [
  {
    name: "Microsoft",
    svg: (
      <svg viewBox="0 0 24 24" className="h-full w-auto">
        <rect x="1" y="1" width="10" height="10" rx="1.5" fill="#F25022" />
        <rect x="13" y="1" width="10" height="10" rx="1.5" fill="#7FBA00" />
        <rect x="1" y="13" width="10" height="10" rx="1.5" fill="#00A4EF" />
        <rect x="13" y="13" width="10" height="10" rx="1.5" fill="#FFB900" />
      </svg>
    ),
  },
  {
    name: "Google",
    svg: (
      <svg viewBox="0 0 24 24" className="h-full w-auto">
        <path d={(siGoogle as BrandData).path} fill="#BEB7AC" />
      </svg>
    ),
  },
  {
    name: "Apple",
    svg: (
      <svg viewBox="0 0 24 24" className="h-full w-auto">
        <path d={(siApple as BrandData).path} fill="#BEB7AC" />
      </svg>
    ),
  },
  {
    name: "Amazon",
    svg: (
      <svg viewBox="0 0 24 24" className="h-full w-auto">
        <path d="M3 12 Q12 18 21 12" stroke="#BEB7AC" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M21 12 L15 8 M21 12 L15 16" stroke="#BEB7AC" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    name: "Netflix",
    svg: (
      <svg viewBox="0 0 24 24" className="h-full w-auto">
        <path d={(siNetflix as BrandData).path} fill="#BEB7AC" />
      </svg>
    ),
  },
  {
    name: "Spotify",
    svg: (
      <svg viewBox="0 0 24 24" className="h-full w-auto">
        <path d={(siSpotify as BrandData).path} fill="#BEB7AC" />
      </svg>
    ),
  },
  {
    name: "Airbnb",
    svg: (
      <svg viewBox="0 0 24 24" className="h-full w-auto">
        <path d={(siAirbnb as BrandData).path} fill="#BEB7AC" />
      </svg>
    ),
  },
  {
    name: "Uber",
    svg: (
      <svg viewBox="0 0 24 24" className="h-full w-auto">
        <path d={(siUber as BrandData).path} fill="#BEB7AC" />
      </svg>
    ),
  },
  {
    name: "Slack",
    svg: (
      <svg viewBox="0 0 24 24" className="h-full w-auto">
        <rect x="2" y="2" width="20" height="5" rx="2.5" fill="#BEB7AC" />
        <rect x="17" y="2" width="5" height="20" rx="2.5" fill="#BEB7AC" />
        <rect x="2" y="17" width="20" height="5" rx="2.5" fill="#BEB7AC" />
        <rect x="2" y="2" width="5" height="20" rx="2.5" fill="#BEB7AC" />
        <rect x="7" y="7" width="10" height="10" rx="1" fill="#0F0E0A" />
      </svg>
    ),
  },
  {
    name: "Shopify",
    svg: (
      <svg viewBox="0 0 24 24" className="h-full w-auto">
        <path d={(siShopify as BrandData).path} fill="#BEB7AC" />
      </svg>
    ),
  },
  {
    name: "Stripe",
    svg: (
      <svg viewBox="0 0 24 24" className="h-full w-auto">
        <path d={(siStripe as BrandData).path} fill="#BEB7AC" />
      </svg>
    ),
  },
  {
    name: "Figma",
    svg: (
      <svg viewBox="0 0 24 24" className="h-full w-auto">
        <path d={(siFigma as BrandData).path} fill="#BEB7AC" />
      </svg>
    ),
  },
  {
    name: "Notion",
    svg: (
      <svg viewBox="0 0 24 24" className="h-full w-auto">
        <path d={(siNotion as BrandData).path} fill="#BEB7AC" />
      </svg>
    ),
  },
  {
    name: "Discord",
    svg: (
      <svg viewBox="0 0 24 24" className="h-full w-auto">
        <path d={(siDiscord as BrandData).path} fill="#BEB7AC" />
      </svg>
    ),
  },
  {
    name: "Dropbox",
    svg: (
      <svg viewBox="0 0 24 24" className="h-full w-auto">
        <path d={(siDropbox as BrandData).path} fill="#BEB7AC" />
      </svg>
    ),
  },
]

export function LogoMarquee() {
  return (
    <div className="max-w-5xl mx-auto mb-16 text-center">
      <span className="text-[11px] font-medium text-[#BEB7AC] uppercase tracking-[0.2em]">
        Trusted by teams worldwide
      </span>
      <div className="relative mt-8 overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-12 sm:w-24 bg-gradient-to-r from-[#0F0E0A] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-12 sm:w-24 bg-gradient-to-l from-[#0F0E0A] to-transparent z-10 pointer-events-none" />
        <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex animate-scroll gap-10 sm:gap-14 items-center min-w-max pr-10 sm:pr-14 hover:[animation-play-state:paused]">
            {[...logos, ...logos].map((logo, i) => (
              <div
                key={`${logo.name}-${i}`}
                className="group relative flex items-center justify-center h-10 sm:h-12 flex-shrink-0"
                title={logo.name}
              >
                <div className="h-full w-auto opacity-60 group-hover:opacity-100 transition-all duration-300">
                  {logo.svg}
                </div>
                <span className="absolute -bottom-5 sm:-bottom-6 left-1/2 -translate-x-1/2 text-[10px] sm:text-[11px] text-[#BEB7AC] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  {logo.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
