import type { MetadataRoute } from "next"
import { tools } from "@/lib/constants"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://phoenixtools.ai"
  const now = new Date().toISOString()

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/ai`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ]

  const toolPages: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: `${base}${tool.href}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  const blogPosts: MetadataRoute.Sitemap = [
    { url: `${base}/blog/phoenixtools-goes-live`, lastModified: "2026-06-24T00:00:00Z", changeFrequency: "never", priority: 0.7 },
    { url: `${base}/blog/10-hidden-features-pdf-tools`, lastModified: "2026-06-24T00:00:00Z", changeFrequency: "never", priority: 0.7 },
    { url: `${base}/blog/ai-tools-small-business-2026`, lastModified: "2026-06-24T00:00:00Z", changeFrequency: "never", priority: 0.7 },
    { url: `${base}/blog/why-online-file-conversion-beats-desktop`, lastModified: "2026-06-24T00:00:00Z", changeFrequency: "never", priority: 0.7 },
  ]

  return [...staticPages, ...toolPages, ...blogPosts]
}
