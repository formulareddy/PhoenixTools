"use client"

import {
  wordCounter, textDiff, unitConverter, caseConverter, textCleaner,
  findReplace, loremIpsum, textToSlug, duplicateRemover, textSorter,
  charCounter, base64EncodeDecode, urlEncodeDecode, jsonFormatter,
  jsFormatter, jsMinifier, jwtDecoder, regexTester, hashGenerator,
  sqlFormatter, cssFormatter, htmlFormatter
} from "@/lib/text-tools"

import { processSEOTool } from "@/lib/seo-tools"
import { processMarketingTool } from "@/lib/marketing-tools"
import { processBusinessTool } from "@/lib/business-tools"

const seoToolIds = [
  "seo-analyzer", "keyword-research", "meta-tag-generator", "serp-preview",
  "sitemap-generator", "robots-txt-generator", "keyword-density", "seo-title-generator",
  "seo-meta-desc", "redirect-checker", "google-index-checker", "backlink-checker"
]

const marketingToolIds = [
  "qr-generator", "utm-builder", "hashtag-generator", "social-caption",
  "email-subject", "cta-generator", "landing-page-headline", "ad-copy",
  "marketing-calendar", "youtube-title", "youtube-desc"
]

const businessToolIds = [
  "invoice-generator", "receipt-generator", "quotation-generator", "purchase-order-generator",
  "business-proposal", "contract-generator", "profit-margin", "gst-vat-calculator",
  "salary-calculator", "business-name-generator", "qr-code-generator"
]

export function processTextTool(
  toolId: string,
  options: Record<string, string>
): { content: string; filename: string; mimeType: string } {
  let content = ""
  let filename = `${toolId}-${Date.now()}.txt`
  let mimeType = "text/plain"

  switch (toolId) {
    case "word-counter":
      content = wordCounter(options.text || "")
      filename = `word-count-${Date.now()}.txt`
      mimeType = "text/plain"
      break
    case "text-diff":
      content = textDiff(options.text1 || "", options.text2 || "")
      filename = `diff-${Date.now()}.txt`
      mimeType = "text/plain"
      break
    case "unit-converter":
      content = unitConverter(options.value || "1", options.from || "m", options.to || "ft", options.category || "length")
      filename = `conversion-${Date.now()}.txt`
      mimeType = "text/plain"
      break
    case "case-converter":
      content = caseConverter(options.text || "", options.case || "upper")
      filename = `case-${Date.now()}.txt`
      mimeType = "text/plain"
      break
    case "text-cleaner":
      content = textCleaner(options.text || "", options.options || "all")
      filename = `cleaned-${Date.now()}.txt`
      mimeType = "text/plain"
      break
    case "find-replace":
      content = findReplace(options.text || "", options.find || "", options.replace || "")
      filename = `replaced-${Date.now()}.txt`
      mimeType = "text/plain"
      break
    case "lorem-ipsum":
      content = loremIpsum(options.paragraphs || "3")
      filename = `lorem-ipsum-${Date.now()}.txt`
      mimeType = "text/plain"
      break
    case "text-to-slug":
      content = textToSlug(options.text || "", options.separator || "hyphen")
      filename = `slug-${Date.now()}.txt`
      mimeType = "text/plain"
      break
    case "duplicate-remover":
      content = duplicateRemover(options.text || "", options.sort || "keep")
      filename = `unique-${Date.now()}.txt`
      mimeType = "text/plain"
      break
    case "text-sorter":
      content = textSorter(options.text || "", options.order || "asc")
      filename = `sorted-${Date.now()}.txt`
      mimeType = "text/plain"
      break
    case "char-counter":
      content = charCounter(options.text || "")
      filename = `char-count-${Date.now()}.txt`
      mimeType = "text/plain"
      break
    case "base64":
    case "text-base64":
    case "dev-base64":
      content = base64EncodeDecode(options.text || "", options.action || "encode")
      filename = `base64-${Date.now()}.txt`
      mimeType = "text/plain"
      break
    case "url-encoder":
      content = urlEncodeDecode(options.text || "", options.action || "encode")
      filename = `encoded-${Date.now()}.txt`
      mimeType = "text/plain"
      break
    case "dev-url-encoder":
      content = urlEncodeDecode(options.text || "", options.action || "encode")
      filename = `encoded-${Date.now()}.txt`
      mimeType = "text/plain"
      break
    case "json-formatter":
      content = jsonFormatter(options.text || "", options.indent || "2")
      filename = `formatted-${Date.now()}.json`
      mimeType = "application/json"
      break
    case "text-json-formatter":
      content = jsonFormatter(options.text || "", options.indent || "2")
      filename = `formatted-${Date.now()}.json`
      mimeType = "application/json"
      break
    case "dev-json-minifier":
    case "text-json-minifier":
      content = jsonFormatter(options.text || "", "0")
      filename = `minified-${Date.now()}.json`
      mimeType = "application/json"
      break
    case "text-js-formatter":
    case "dev-js-formatter":
      content = jsFormatter(options.text || "")
      filename = `formatted-${Date.now()}.js`
      mimeType = "text/javascript"
      break
    case "text-js-minifier":
    case "dev-js-minifier":
      content = jsMinifier(options.text || "")
      filename = `minified-${Date.now()}.js`
      mimeType = "text/javascript"
      break
    case "jwt-decoder":
    case "dev-jwt-decoder":
      content = jwtDecoder(options.text || "")
      filename = `jwt-${Date.now()}.txt`
      mimeType = "text/plain"
      break
    case "regex-tester":
    case "dev-regex-tester":
      content = regexTester(options.pattern || "", options.flags || "g", options.text || "")
      filename = `regex-${Date.now()}.txt`
      mimeType = "text/plain"
      break
    case "hash-generator":
    case "dev-hash-generator":
      content = hashGenerator(options.text || "", options.algo || "sha256")
      filename = `hash-${Date.now()}.txt`
      mimeType = "text/plain"
      break
    case "dev-sql-formatter":
    case "sql-formatter":
      content = sqlFormatter(options.text || "")
      filename = `formatted-${Date.now()}.sql`
      mimeType = "text/plain"
      break
    case "dev-css-formatter":
    case "text-css-formatter":
    case "css-minifier":
      content = cssFormatter(options.text || "")
      filename = `formatted-${Date.now()}.css`
      mimeType = "text/css"
      break
    case "html-formatter":
      content = htmlFormatter(options.text || "")
      filename = `formatted-${Date.now()}.html`
      mimeType = "text/html"
      break
    default:
      if (seoToolIds.includes(toolId)) {
        return processSEOTool(toolId, options)
      }
      if (marketingToolIds.includes(toolId)) {
        return processMarketingTool(toolId, options)
      }
      if (businessToolIds.includes(toolId)) {
        return processBusinessTool(toolId, options)
      }
      content = `Tool "${toolId}" is not yet implemented.`
      filename = `output-${Date.now()}.txt`
  }

  return { content, filename, mimeType }
}

export function downloadText(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
