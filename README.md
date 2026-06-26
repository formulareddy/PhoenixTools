<div align="center">

<img src="public/phoenix-logo.png" alt="PhoenixTools Logo" width="120" />

# PhoenixTools AI

### The All-in-One Premium Utility Platform

**146 production-ready tools** — PDF, Image, Video, Audio, AI, Text, Developer, SEO, Marketing & Business — in one beautiful, blazing-fast Next.js application.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-green?logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[**Live Demo**](https://phoenixtools.ai) · [**Report Bug**](https://github.com/formulareddy/PhoenixTools/issues) · [**Request Feature**](https://github.com/formulareddy/PhoenixTools/issues)

</div>

---

## Why PhoenixTools?

Most utility websites look like they're from 2010. PhoenixTools is different — it combines the functionality of **iLovePDF, Canva, 123Apps, ChatGPT**, and dozens of SaaS products into one seamless, premium experience with a warm, editorial design system.

### Key Differentiators

| Feature | PhoenixTools | Typical Tools |
|---------|:---:|:---:|
| All-in-one (146 tools) | ✅ | ❌ |
| Premium dark UI design | ✅ | ❌ |
| AI-powered tools (free) | ✅ | ❌ |
| Client-side processing | ✅ | ❌ |
| Server-side FFmpeg pipeline | ✅ | ❌ |
| Razorpay multi-currency payments | ✅ | ❌ |
| Google AdSense monetization | ✅ | ❌ |
| Auth (Email + Google + GitHub) | ✅ | ❌ |
| GDPR cookie consent | ✅ | ❌ |
| Responsive (320px–1920px) | ✅ | ❌ |

---

## Tools Included

<table>
<tr>
<td>

**PDF Tools** (20)
- Compress, Merge, Split
- PDF ↔ Word, JPG, PNG
- OCR, Watermark, Sign
- Redact, Compare, Repair
- Extract Pages, Crop, Metadata

</td>
<td>

**Image Tools** (15)
- Resize, Compress, Convert
- Background Removal (AI)
- Upscale, Enhance, Crop
- Watermark, Blur, Rotate
- AI Image Generator

</td>
<td>

**Video Tools** (13)
- Trim, Compress, Convert
- Video ↔ GIF
- Merge, Resize, Crop
- Add Audio, Change Speed
- Watermark, Rotate, Mute

</td>
</tr>
<tr>
<td>

**Audio Tools** (13)
- Convert, Compress, Trim
- Merge, Noise Removal
- Speed Control, Volume
- Recorder, Cutter, Metadata
- Voice Changer, Track Separation

</td>
<td>

**AI Tools** (15)
- AI Writer, Summarizer
- AI Chat Assistant
- OCR, Resume Builder
- Translator, Grammar Checker
- Email Writer, Blog Generator
- Code Generator, Paraphraser

</td>
<td>

**Text Tools** (23)
- Word/Character Counter
- Case Converter, Text Diff
- JSON/JS/CSS/SQL Formatter
- Base64, URL Encoder
- Regex Tester, Hash Generator
- Lorem Ipsum, Slug Generator

</td>
</tr>
<tr>
<td>

**Developer Tools** (13)
- JSON/HTML/CSS Formatters
- JS/CSS/JSON Minifiers
- JWT Decoder, Regex Tester
- Hash Generator, Base64
- URL Encoder, SQL Formatter

</td>
<td>

**SEO Tools** (12)
- SEO Analyzer
- Keyword Research
- Meta Tag Generator
- SERP Preview, Sitemap Generator
- Robots.txt Generator
- Backlink & Index Checker

</td>
<td>

**Marketing & Business** (22)
- UTM Builder, Hashtag Generator
- Social Media Captions
- Email Subject Lines, Ad Copy
- Invoice, Receipt, Quotation
- Profit Margin, GST/VAT Calc
- QR Code, Business Name Gen

</td>
</tr>
</table>

---

## Tech Stack

```
Frontend:        Next.js 16, React 19, TypeScript 5, Tailwind CSS 4
Animations:      Framer Motion, GSAP, Three.js (3D effects)
Auth:            Supabase Auth (Email, Google OAuth, GitHub OAuth)
Database:        Supabase (PostgreSQL)
Payments:        Razorpay (40+ currencies, INR/USD/EUR/GBP)
Ads:             Google AdSense (free user monetization)
Email:           Web3Forms (250/month free)
Processing:      FFmpeg (server-side), Canvas/ImageMagick (client-side)
AI:              OpenRouter API (free tier models)
Build:           Turbopack, ESLint
Deployment:      Cloudflare Pages (or Vercel)
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Supabase project ([create free](https://supabase.com))
- Razorpay account ([create](https://razorpay.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/formulareddy/PhoenixTools.git
cd PhoenixTools

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Fill in your API keys (see .env.example for all required vars)
# At minimum, set: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

See [`.env.example`](.env.example) for all required variables. Key ones:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server) | ✅ |
| `RAZORPAY_KEY_ID` | Razorpay API key | For payments |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret | For payments |
| `OPENROUTER_API_KEY` | OpenRouter API key (free) | For AI chat |

---

## Project Structure

```
PhoenixTools/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # 30+ API routes (auth, payments, tools)
│   │   ├── ai/                # AI tools pages
│   │   ├── blog/              # Blog (SSG)
│   │   ├── pricing/           # Pricing page with Razorpay
│   │   ├── tools/             # All 146 tool pages
│   │   └── ...
│   ├── components/
│   │   ├── home/              # Landing page components
│   │   ├── layout/            # Header, Footer, Navigation
│   │   ├── tools/             # Tool wrappers with ad banners
│   │   ├── blog/              # Blog components
│   │   └── ui/                # Shared UI components
│   ├── contexts/              # Auth & Subscription providers
│   └── lib/                   # Utilities, processing engines
│       ├── pdf-server.ts      # PDF processing (FFmpeg/pdf-lib)
│       ├── image-server.ts    # Image processing (Sharp)
│       ├── video-server.ts    # Video processing (FFmpeg)
│       ├── audio-server.ts    # Audio processing (FFmpeg)
│       ├── ai-server.ts       # AI processing
│       ├── free-ai.ts         # Free AI chat (OpenRouter)
│       ├── text-tools.ts      # Client-side text tools
│       ├── seo-tools.ts       # Client-side SEO tools
│       ├── api-security.ts    # Rate limiting, SSRF protection
│       └── ...
├── supabase-schema.sql        # Database schema
├── supabase-subscription.sql  # Subscription tables
└── .env.example               # Environment template
```

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser    │────▶│  Next.js API  │────▶│  Supabase   │
│  (React 19)  │◀────│  Routes (30+) │◀────│  (Auth+DB)  │
└─────────────┘     └──────────────┘     └─────────────┘
       │                   │                    │
       │  Client-side      │  Server-side       │
       │  text/dev/SEO     │  PDF/image/video   │
       │  tools (Canvas)   │  tools (FFmpeg)    │
       │                   │                    │
       ▼                   ▼                    ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  localStorage│     │  /tmp/ jobs  │     │  Razorpay   │
│  (usage data)│     │  (temp files)│     │  (payments)  │
└─────────────┘     └──────────────┘     └─────────────┘
```

- **Client-side tools** (text, dev, SEO, marketing, business): Run entirely in the browser. Zero server load.
- **Server-side tools** (PDF, image, video, audio): Processed with FFmpeg/Sharp on the server. Temp files auto-deleted.
- **AI tools**: Powered by OpenRouter free models with web search fallback.

---

## Security Features

- 🔒 Rate limiting (10–30 req/min on all routes)
- 🛡️ SSRF protection (blocks localhost, private IPs)
- 🔐 Zod input validation on all API routes
- 🚫 Account lockout after 5 failed attempts
- 🍪 GDPR cookie consent
- 🔑 Service role key never exposed to client
- 📝 Generic error messages (no info leakage)
- ✅ Path traversal prevention on file downloads
- 🎫 Content-Disposition header sanitization

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## Author

**Formula Reddy** — [GitHub](https://github.com/formulareddy)

---

<div align="center">

**If you find PhoenixTools useful, please give it a ⭐ on GitHub!**

Built with Next.js 16 · React 19 · Supabase · Tailwind CSS

</div>
