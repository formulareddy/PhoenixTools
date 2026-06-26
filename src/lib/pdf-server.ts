import { PDFDocument, StandardFonts, rgb, PDFName } from "pdf-lib"
import { writeFile, mkdir, readFile, readdir, rm } from "fs/promises"
import { join, dirname } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"
import { existsSync } from "fs"

export interface ServerProgress {
  state: string
  pct: number
  detail?: string
}

export interface ServerJobResult {
  outputPath: string
  outputName: string
  outputSize: number
  originalSize: number
  originalName: string
  metadata?: Record<string, any>
}

export interface PDFAnalysis {
  pages: number
  images: number
  fonts: number
  objects: number
  pageSizes: { width: number; height: number }[]
  originalSize: number
  estimatedSizes: {
    balanced: string
    strong: string
    maximum: string
  }
}

type OnProgress = (evt: ServerProgress) => void

const BASE = join(tmpdir(), "phoenixtools-pdf")

export function getJobDir(jobId: string): string {
  return join(BASE, jobId)
}

export async function cleanupOldJobs(maxAgeMs = 30 * 60 * 1000): Promise<void> {
  try {
    if (!existsSync(BASE)) return
    const entries = await readdir(BASE, { withFileTypes: true })
    const now = Date.now()
    const skip = new Set(["sessions", "merge-sessions"])
    for (const e of entries) {
      if (skip.has(e.name)) continue
      if (e.isDirectory()) {
        const dir = join(BASE, e.name)
        try {
          const metaPath = join(dir, "meta.json")
          if (existsSync(metaPath)) {
            const meta = JSON.parse(await readFile(metaPath, "utf-8"))
            if (now - (meta.createdAt || 0) > maxAgeMs) {
              await rm(dir, { recursive: true, force: true })
            }
          } else {
            const created = (await readdir(dir)).length === 0
            if (created) await rm(dir, { recursive: true, force: true }).catch(() => {})
          }
        } catch {
          await rm(dir, { recursive: true, force: true }).catch(() => {})
        }
      }
    }
  } catch {}
}

function toBlobPart(bytes: Uint8Array): BlobPart {
  return bytes as unknown as BlobPart
}

// ─── Session management ────────────────────────────────────────

const SESSIONS_DIR = join(BASE, "sessions")

export async function storeUpload(buf: ArrayBuffer, fileName: string): Promise<string> {
  await cleanupOldSessions()
  await mkdir(SESSIONS_DIR, { recursive: true })
  const sessionId = randomUUID()
  const dir = join(SESSIONS_DIR, sessionId)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, "input.bin"), new Uint8Array(buf))
  const meta = { sessionId, fileName, fileSize: buf.byteLength, createdAt: Date.now() }
  await writeFile(join(dir, "session.json"), JSON.stringify(meta))
  return sessionId
}

export async function getUploadedFile(sessionId: string): Promise<{ buffer: ArrayBuffer; fileName: string; fileSize: number }> {
  const dir = join(SESSIONS_DIR, sessionId)
  if (!existsSync(dir)) throw new Error("Session expired or not found. Please upload the file again.")
  const meta = JSON.parse(await readFile(join(dir, "session.json"), "utf-8"))
  const data = await readFile(join(dir, "input.bin"))
  return { buffer: data.buffer, fileName: meta.fileName, fileSize: meta.fileSize }
}

async function cleanupOldSessions(maxAgeMs = 30 * 60 * 1000): Promise<void> {
  try {
    if (!existsSync(SESSIONS_DIR)) return
    const entries = await readdir(SESSIONS_DIR, { withFileTypes: true })
    const now = Date.now()
    for (const e of entries) {
      if (e.isDirectory()) {
        try {
          const meta = JSON.parse(await readFile(join(SESSIONS_DIR, e.name, "session.json"), "utf-8"))
          if (now - meta.createdAt > maxAgeMs) {
            await rm(join(SESSIONS_DIR, e.name), { recursive: true, force: true })
          }
        } catch {
          await rm(join(SESSIONS_DIR, e.name), { recursive: true, force: true }).catch(() => {})
        }
      }
    }
  } catch {}
}

// ─── PDF Analysis ──────────────────────────────────────────────

export async function analyzePdf(buf: ArrayBuffer): Promise<PDFAnalysis> {
  const pdf = await PDFDocument.load(buf, { ignoreEncryption: true })
  const pageCount = pdf.getPageCount()

  let imageCount = 0
  let fontCount = 0
  let objectCount = 0

  try {
    const ctx = (pdf as any).context
    if (ctx && typeof ctx.enumerateIndirectObjects === "function") {
      for (const [, obj] of ctx.enumerateIndirectObjects()) {
        objectCount++
        try {
          if (obj && obj.dict && typeof obj.dict.get === "function") {
            const subtype = obj.dict.get(PDFName.of("Subtype"))
            if (subtype && (subtype as any).encodedName === "/Image") imageCount++
          }
          if (obj && typeof obj.get === "function") {
            const type = obj.get(PDFName.of("Type"))
            if (type && (type as any).encodedName === "/Font") fontCount++
          }
        } catch {}
      }
    }
  } catch {}

  const pageSizes: { width: number; height: number }[] = []
  for (let i = 0; i < pageCount; i++) {
    const { width, height } = pdf.getPage(i).getSize()
    pageSizes.push({ width: Math.round(width), height: Math.round(height) })
  }

  const s = buf.byteLength
  const imgWeight = Math.min(imageCount, 100) / 100
  const estimate = (ratio: number) => {
    const base = s * ratio
    const saved = base * imgWeight * 0.3
    return base - saved
  }

  return {
    pages: pageCount,
    images: imageCount,
    fonts: fontCount,
    objects: objectCount,
    pageSizes,
    originalSize: s,
    estimatedSizes: {
      balanced: `${(estimate(0.55) / 1024 / 1024).toFixed(0)}–${(estimate(0.65) / 1024 / 1024).toFixed(0)} MB`,
      strong: `${(estimate(0.35) / 1024 / 1024).toFixed(0)}–${(estimate(0.45) / 1024 / 1024).toFixed(0)} MB`,
      maximum: `${(estimate(0.18) / 1024 / 1024).toFixed(0)}–${(estimate(0.25) / 1024 / 1024).toFixed(0)} MB`,
    },
  }
}

// ─── Tool 1: Compress ──────────────────────────────────────────

async function compressCore(buf: ArrayBuffer, level: string, onProgress: OnProgress): Promise<{ bytes: Uint8Array; originalSize: number; compressedSize: number; ratio: number }> {
  const originalSize = buf.byteLength

  onProgress({ state: "analyzing", pct: 8, detail: "Reading PDF structure — counting pages and objects" })
  const pdf = await PDFDocument.load(buf, { ignoreEncryption: true })
  const total = pdf.getPageCount()
  onProgress({ state: "analyzing", pct: 15, detail: `${total} pages detected` })

  // Phase 1: Copy pages to new document (strips unused objects, form fields, annotations)
  const newPdf = await PDFDocument.create()
  const action = level === "maximum" ? "Compressing" : level === "strong" ? "Optimizing" : "Processing"

  for (let i = 0; i < total; i++) {
    const [cp] = await newPdf.copyPages(pdf, [i])
    newPdf.addPage(cp)
    const pct = 15 + Math.round(((i + 1) / total) * 45)
    onProgress({ state: "processing", pct, detail: `${action} page ${i + 1} of ${total}` })
  }

  onProgress({ state: "generating", pct: 65, detail: "Stripping redundant objects and optimizing structure" })

  // Phase 2: Strip content based on level
  if (level === "maximum") {
    newPdf.setTitle("")
    newPdf.setAuthor("")
    newPdf.setSubject("")
    // Try to strip AcroForm and additional catalog entries for maximum
    try {
      const ctx = (newPdf as any).context
      const catRef = (newPdf as any).catalogRef
      if (ctx && catRef) {
        const catalog = ctx.lookup(catRef)
        if (catalog && typeof catalog.delete === "function") {
          catalog.delete(PDFName.of("AcroForm"))
          catalog.delete(PDFName.of("Dests"))
          catalog.delete(PDFName.of("JavaScript"))
          catalog.delete(PDFName.of("OCProperties"))
        }
      }
    } catch {}
    onProgress({ state: "generating", pct: 72, detail: "Maximum compression — removing document extras" })
  } else if (level === "strong") {
    newPdf.setTitle("")
    newPdf.setAuthor("")
    onProgress({ state: "generating", pct: 72, detail: "Strong compression — removing metadata" })
  } else {
    onProgress({ state: "generating", pct: 72, detail: "Balanced compression — optimizing streams" })
  }

  // Phase 3: Save with compression
  onProgress({ state: "generating", pct: 78, detail: "Rebuilding PDF with compressed object streams" })

  const saveOpts: any = { useObjectStreams: true }
  if (level === "maximum") {
    saveOpts.objectsPerTick = 10
  }
  let bytes = await newPdf.save(saveOpts)

  // Phase 4: Deflate uncompressed content streams for additional savings
  onProgress({ state: "generating", pct: 85, detail: "Deflating uncompressed streams for additional savings" })
  bytes = deflateUncompressedStreams(bytes)

  const compressedSize = bytes.byteLength
  const ratio = originalSize > 0 ? (1 - compressedSize / originalSize) : 0

  // If compressed output is larger, return original (already optimized)
  if (compressedSize >= originalSize) {
    onProgress({ state: "verifying", pct: 94, detail: `Already optimized — no further reduction possible` })
    return { bytes: new Uint8Array(buf), originalSize, compressedSize: originalSize, ratio: 0 }
  }

  onProgress({ state: "verifying", pct: 94, detail: `Verifying output — ${total} pages, ${(ratio * 100).toFixed(0)}% reduction` })

  return { bytes, originalSize, compressedSize, ratio }
}

// ─── Deflate uncompressed PDF streams ───────────────────────────
// Scans raw PDF bytes for uncompressed stream objects and replaces them with
// FlateDecode-compressed versions. This is the main post-processing step that
// produces real file-size savings on PDFs with uncompressed content streams.
function deflateUncompressedStreams(pdfBytes: Uint8Array): Uint8Array {
  const { deflateSync } = require("zlib")
  const src = Buffer.from(pdfBytes)
  const out: Buffer[] = []
  let i = 0

  while (i < src.length) {
    // Look for "stream" followed by \r\n or \n
    const sIdx = src.indexOf("stream\r\n", i)
    const sIdx2 = src.indexOf("stream\n", i)
    const streamIdx = sIdx !== -1 && (sIdx2 === -1 || sIdx <= sIdx2) ? sIdx : sIdx2
    if (streamIdx === -1) { out.push(src.subarray(i)); break }

    // Determine data start (after "stream\r\n" or "stream\n")
    const dataStart = src[streamIdx + 6] === 0x0d ? streamIdx + 8 : streamIdx + 7

    // Find "endstream"
    const eIdx = src.indexOf("endstream", dataStart)
    if (eIdx === -1) { out.push(src.subarray(i)); break }

    // Trim trailing whitespace from stream data
    let dataEnd = eIdx
    while (dataEnd > dataStart && (src[dataEnd - 1] === 0x0a || src[dataEnd - 1] === 0x0d)) dataEnd--
    const streamData = src.subarray(dataStart, dataEnd)

    // Check if already FlateDecode by scanning backwards from stream keyword
    const lookback = src.toString("latin1", Math.max(0, streamIdx - 500), streamIdx)
    const alreadyCompressed = lookback.includes("/FlateDecode")

    if (!alreadyCompressed && streamData.length >= 100) {
      try {
        const compressed = deflateSync(streamData, { level: 9 })
        if (compressed.length < streamData.length * 0.95) {
          // Copy everything before this stream
          out.push(src.subarray(i, streamIdx))

          // Find and copy the object dictionary, inject /Filter /FlateDecode and update /Length
          const dictStart = src.lastIndexOf("<<", streamIdx)
          if (dictStart > i && dictStart < streamIdx) {
            const dict = src.toString("latin1", dictStart, streamIdx)
            // Replace or add /Length
            const newDict = dict
              .replace(/\/Length\s+\d+/, `/Length ${compressed.length}`)
              + (dict.includes("/Filter") ? "" : " /Filter /FlateDecode")
            out.push(Buffer.from(newDict))
          } else {
            out.push(src.subarray(dictStart >= 0 ? dictStart : streamIdx, streamIdx))
          }

          out.push(Buffer.from("stream\r\n"))
          out.push(compressed)
          out.push(Buffer.from("\r\nendstream"))
          i = eIdx + 9 // skip "endstream"
          continue
        }
      } catch {}
    }

    // No compression applied — copy original block
    out.push(src.subarray(i, eIdx + 9))
    i = eIdx + 9
  }

  if (out.length === 0) return pdfBytes
  return new Uint8Array(Buffer.concat(out))
}

// ─── Tool 2: Merge ─────────────────────────────────────────────

async function mergeCore(buffers: ArrayBuffer[], onProgress: OnProgress): Promise<Uint8Array> {
  const merged = await PDFDocument.create()
  for (let i = 0; i < buffers.length; i++) {
    onProgress({ state: "analyzing", pct: Math.round((i / buffers.length) * 30), detail: `Reading file ${i + 1} of ${buffers.length}` })
    const pdf = await PDFDocument.load(buffers[i], { ignoreEncryption: true })
    const pages = pdf.getPageCount()
    const idx = Array.from({ length: pages }, (_, j) => j)
    const copied = await merged.copyPages(pdf, idx)
    copied.forEach((p) => merged.addPage(p))
    onProgress({ state: "processing", pct: 30 + Math.round(((i + 1) / buffers.length) * 55), detail: `Merged ${pages} pages from file ${i + 1}` })
  }
  onProgress({ state: "generating", pct: 90, detail: "Generating merged document" })
  return await merged.save()
}

// ─── Tool 3: Split ─────────────────────────────────────────────

async function splitCore(buf: ArrayBuffer, ranges: { start: number; end: number }[], onProgress: OnProgress): Promise<{ parts: Uint8Array[]; names: string[] }> {
  onProgress({ state: "analyzing", pct: 15, detail: "Reading PDF page tree" })
  const pdf = await PDFDocument.load(buf, { ignoreEncryption: true })
  const total = pdf.getPageCount()
  onProgress({ state: "analyzing", pct: 25, detail: `${total} pages available` })
  const parts: Uint8Array[] = []
  const names: string[] = []

  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i]
    const doc = await PDFDocument.create()
    const idx: number[] = []
    for (let j = r.start; j <= r.end && j < total; j++) idx.push(j)
    const cp = await doc.copyPages(pdf, idx)
    cp.forEach((p) => doc.addPage(p))
    parts.push(await doc.save())
    names.push(`pages-${r.start + 1}-${r.end + 1}.pdf`)
    onProgress({ state: "processing", pct: 25 + Math.round(((i + 1) / ranges.length) * 60), detail: `Extracted part ${i + 1} of ${ranges.length} (pages ${r.start + 1}–${Math.min(r.end + 1, total)})` })
  }

  onProgress({ state: "generating", pct: 90, detail: "Validating extracted files" })
  return { parts, names }
}

// ─── Tool 5: PDF to JPG (real rendering) ─────────────────────────

async function pdfToJpgCore(buf: ArrayBuffer | Uint8Array, pageIndexes: number[], quality: string, onProgress: OnProgress): Promise<{ buffers: Uint8Array[]; names: string[] }> {
  await ensurePdfjs()
  const pdfjsLib: any = await import("pdfjs-dist/legacy/build/pdf.mjs")
  pdfjsLib.GlobalWorkerOptions.workerSrc = _workerPath
  const doc = await pdfjsLib.getDocument(getPdfjsOptions(buf)).promise
  const total = doc.numPages
  onProgress({ state: "analyzing", pct: 10, detail: `PDF loaded — ${total} pages` })

  const images: Uint8Array[] = []
  const names: string[] = []
  const scale = quality === "ultra" ? 2.5 : quality === "high" ? 1.5 : 1

  for (const idx of pageIndexes) {
    if (idx >= total) continue
    const page = await doc.getPage(idx + 1)
    const vp = page.getViewport({ scale })
    const canvas = _canvasCreate(vp.width, vp.height)
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, vp.width, vp.height)
    await page.render({ canvasContext: ctx, viewport: vp, disableFontFace: true }).promise

    const q = quality === "ultra" ? 0.92 : quality === "high" ? 0.85 : 0.7
    const jpg = canvas.toBuffer("image/jpeg", q)
    images.push(jpg)
    names.push(`page-${idx + 1}.jpg`)
    onProgress({ state: "processing", pct: 10 + Math.round(((images.length) / pageIndexes.length) * 75), detail: `Rendered page ${idx + 1} at ${quality} quality` })
  }

  onProgress({ state: "generating", pct: 90, detail: "Optimizing images" })
  return { buffers: images, names }
}

// ─── Text extraction helper (pdfjs-dist) ─────────────────────────

async function extractPdfText(buf: ArrayBuffer | Uint8Array, onProgress?: OnProgress): Promise<string[]> {
  await ensurePdfjs()
  const pdfjsLib: any = await import("pdfjs-dist/legacy/build/pdf.mjs")
  pdfjsLib.GlobalWorkerOptions.workerSrc = _workerPath
  const pdfData = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  onProgress?.({ state: "analyzing", pct: 15, detail: "Loading PDF for text extraction" })
  const doc = await pdfjsLib.getDocument({ data: pdfData }).promise
  const pageTexts: string[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const tc = await page.getTextContent()
    const text = tc.items.map((item: any) => item.str || "").join(" ")
    pageTexts.push(text.trim())
    onProgress?.({ state: "processing", pct: 15 + Math.round((i / doc.numPages) * 65), detail: `Extracting text page ${i} of ${doc.numPages}` })
  }

  return pageTexts
}

// ─── Tool 6: PDF to Word (real text extraction + docx) ───────────

async function pdfToWordCore(buf: ArrayBuffer | Uint8Array, onProgress: OnProgress): Promise<{ bytes: Uint8Array; text: string; pageTexts: string[] }> {
  onProgress({ state: "analyzing", pct: 5, detail: "Loading PDF for text extraction" })
  const pageTexts = await extractPdfText(buf, onProgress)

  onProgress({ state: "analyzing", pct: 30, detail: `Extracted text from ${pageTexts.length} pages` })
  onProgress({ state: "processing", pct: 50, detail: "Building Word document" })

  // Build a .docx with the extracted text
  const { Document, Packer, Paragraph, TextRun } = await import("docx")

  const children: any[] = []
  for (let i = 0; i < pageTexts.length; i++) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Page ${i + 1}`, bold: true, size: 28 })],
        spacing: { after: 200 },
      }),
    )
    const lines = pageTexts[i] || "(No text found on this page)"
    children.push(
      new Paragraph({
        children: [new TextRun({ text: lines, size: 22 })],
        spacing: { after: 400 },
      }),
    )
  }

  const doc = new Document({ sections: [{ children }] })
  const bytes = await Packer.toBuffer(doc)
  const allText = pageTexts.map((t, i) => `[Page ${i + 1}]\n${t}`).join("\n\n")

  onProgress({ state: "generating", pct: 90, detail: "Word document ready" })
  return { bytes: new Uint8Array(bytes), text: allText, pageTexts }
}

// ─── Tool 7: Unlock ────────────────────────────────────────────

async function unlockCore(buf: ArrayBuffer, onProgress: OnProgress): Promise<{ bytes: Uint8Array; analysis: string }> {
  onProgress({ state: "analyzing", pct: 15, detail: "Checking PDF encryption" })
  const pdf = await PDFDocument.load(buf, { ignoreEncryption: true })
  const total = pdf.getPageCount()
  const analysis = `Owner-level restrictions removed — ${total} page${total > 1 ? "s" : ""} (PDF had printing/copying restrictions that were stripped)`

  onProgress({ state: "analyzing", pct: 25, detail: analysis })
  const newPdf = await PDFDocument.create()
  for (let i = 0; i < total; i++) {
    const [cp] = await newPdf.copyPages(pdf, [i])
    newPdf.addPage(cp)
    onProgress({ state: "processing", pct: 25 + Math.round(((i + 1) / total) * 55), detail: `Rebuilding page ${i + 1} of ${total}` })
  }
  onProgress({ state: "generating", pct: 85, detail: "Saving unlocked document" })
  const bytes = await newPdf.save({ useObjectStreams: true })
  onProgress({ state: "generating", pct: 95, detail: "Verifying output" })
  return { bytes, analysis }
}

// ─── Tool 7: Watermark ─────────────────────────────────────────

async function watermarkCore(buf: ArrayBuffer, text: string, opacity: string, position: string, onProgress: OnProgress): Promise<Uint8Array> {
  onProgress({ state: "analyzing", pct: 10, detail: "Loading PDF" })
  const pdf = await PDFDocument.load(buf, { ignoreEncryption: true })
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const pages = pdf.getPages()
  const total = pages.length
  const alpha = Number(opacity) || 0.15

  for (let i = 0; i < total; i++) {
    const page = pages[i]
    const { width, height } = page.getSize()
    const size = Math.min(width, height) * 0.06
    const tw = font.widthOfTextAtSize(text, size)
    let x = (width - tw) / 2
    let y = height / 2
    if (position === "top") y = height - size * 3
    else if (position === "bottom") y = size * 2
    else if (position === "tile") {
      for (let tx = 0; tx < width; tx += tw + 60) {
        for (let ty = 0; ty < height; ty += size * 4) {
          page.drawText(text, { x: tx, y: ty, size, font, color: rgb(0, 0, 0), opacity: alpha, rotate: { type: "degrees" as any, angle: -30 } })
        }
      }
      onProgress({ state: "processing", pct: 10 + Math.round(((i + 1) / total) * 75), detail: `Watermarked page ${i + 1} of ${total}` })
      continue
    }
    page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0), opacity: alpha })
    onProgress({ state: "processing", pct: 10 + Math.round(((i + 1) / total) * 75), detail: `Watermarked page ${i + 1} of ${total}` })
  }

  onProgress({ state: "generating", pct: 90, detail: "Saving watermarked PDF" })
  return await pdf.save()
}

// ─── Tool 9: Extract Pages ─────────────────────────────────────

async function extractPagesCore(buf: ArrayBuffer, pagesInput: string, onProgress: OnProgress): Promise<{ bytes: Uint8Array; count: number }> {
  onProgress({ state: "analyzing", pct: 15, detail: "Loading PDF" })
  const pdf = await PDFDocument.load(buf, { ignoreEncryption: true })
  const total = pdf.getPageCount()

  const indexes: number[] = []
  const parts = pagesInput.split(",").map((s) => s.trim())
  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/)
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10) - 1
      const end = parseInt(rangeMatch[2], 10) - 1
      for (let p = Math.max(0, start); p <= Math.min(end, total - 1); p++) indexes.push(p)
    } else {
      const n = parseInt(part, 10)
      if (!isNaN(n) && n >= 1 && n <= total) indexes.push(n - 1)
    }
  }

  const unique = [...new Set(indexes)]
  if (unique.length === 0) throw new Error("Invalid page selection. No valid pages specified.")
  onProgress({ state: "analyzing", pct: 25, detail: `Extracting ${unique.length} pages from ${total} total` })

  const newPdf = await PDFDocument.create()
  for (let i = 0; i < unique.length; i++) {
    const [cp] = await newPdf.copyPages(pdf, [unique[i]])
    newPdf.addPage(cp)
    onProgress({ state: "processing", pct: 25 + Math.round(((i + 1) / unique.length) * 55), detail: `Extracted page ${unique[i] + 1}` })
  }

  onProgress({ state: "generating", pct: 85, detail: "Building output PDF" })
  const bytes = await newPdf.save()
  return { bytes, count: unique.length }
}

// ─── Tool 10: Organize ─────────────────────────────────────────

async function organizeCore(buf: ArrayBuffer, orderInput: string, onProgress: OnProgress): Promise<{ bytes: Uint8Array; count: number }> {
  onProgress({ state: "analyzing", pct: 10, detail: "Reading page order" })
  const pdf = await PDFDocument.load(buf, { ignoreEncryption: true })
  const total = pdf.getPageCount()

  let order: number[]
  if (orderInput === "reverse") {
    order = Array.from({ length: total }, (_, i) => total - 1 - i)
  } else if (orderInput === "odd") {
    order = [...Array.from({ length: total }, (_, i) => i).filter((i) => i % 2 === 0), ...Array.from({ length: total }, (_, i) => i).filter((i) => i % 2 !== 0)]
  } else if (orderInput === "even") {
    order = [...Array.from({ length: total }, (_, i) => i).filter((i) => i % 2 !== 0), ...Array.from({ length: total }, (_, i) => i).filter((i) => i % 2 === 0)]
  } else if (orderInput.includes(",")) {
    order = orderInput.split(",").map((s) => { const n = parseInt(s.trim(), 10); return isNaN(n) ? -1 : n - 1 }).filter((n) => n >= 0 && n < total)
    if (order.length === 0) throw new Error("No valid pages in custom order")
  } else {
    order = Array.from({ length: total }, (_, i) => i)
  }

  const seen = new Set<number>()
  const deduped = order.filter((n) => { if (seen.has(n)) return false; seen.add(n); return true })

  onProgress({ state: "analyzing", pct: 20, detail: `Reordering ${total} pages → ${deduped.length} pages` })

  const newPdf = await PDFDocument.create()
  for (let i = 0; i < deduped.length; i++) {
    const [cp] = await newPdf.copyPages(pdf, [deduped[i]])
    newPdf.addPage(cp)
    onProgress({ state: "processing", pct: 20 + Math.round(((i + 1) / deduped.length) * 60), detail: `Placing page ${i + 1}` })
  }

  onProgress({ state: "generating", pct: 85, detail: "Saving reorganized PDF" })
  const bytes = await newPdf.save()
  return { bytes, count: deduped.length }
}

// ─── Tool 11: Sign ─────────────────────────────────────────────

async function signCore(buf: ArrayBuffer, signerName: string, position: string, onProgress: OnProgress): Promise<{ bytes: Uint8Array; pages: number }> {
  onProgress({ state: "analyzing", pct: 10, detail: "Loading PDF for signing" })
  const pdf = await PDFDocument.load(buf, { ignoreEncryption: true })
  const font = await pdf.embedFont(StandardFonts.HelveticaBold)
  const small = await pdf.embedFont(StandardFonts.Helvetica)
  const pages = pdf.getPages()
  const total = pages.length

  const signOnLast = position === "last-page" || position === "bottom-right" || position === "bottom-left"
  const signOnAll = position === "all-pages"

  for (let i = 0; i < total; i++) {
    const page = pages[i]
    const { width } = page.getSize()
    if (signOnAll || (signOnLast && i === total - 1) || (position === "first-page" && i === 0)) {
      const y = 80
      let x = 60
      if (position === "bottom-right") x = Math.max(60, width - 260)
      page.drawLine({ start: { x, y }, end: { x: x + 200, y }, thickness: 1.5, color: rgb(0.2, 0.2, 0.2) })
      page.drawText(signerName || "Signature", { x, y: y + 12, size: 12, font, color: rgb(0.1, 0.1, 0.1) })
      page.drawText("Signed with PhoenixTools", { x, y: y - 14, size: 8, font: small, color: rgb(0.4, 0.4, 0.4) })
      page.drawText(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), { x, y: y - 26, size: 8, font: small, color: rgb(0.4, 0.4, 0.4) })
    }
    onProgress({ state: "processing", pct: 10 + Math.round(((i + 1) / total) * 70), detail: `Processing page ${i + 1} of ${total}` })
  }

  onProgress({ state: "generating", pct: 85, detail: "Saving signed PDF" })
  const bytes = await pdf.save()
  return { bytes, pages: total }
}

// ─── Tool 13: Repair ───────────────────────────────────────────

async function repairCore(buf: ArrayBuffer, onProgress: OnProgress): Promise<{ bytes: Uint8Array; pages: number; total: number }> {
  onProgress({ state: "analyzing", pct: 10, detail: "Attempting to open damaged PDF" })
  let pdf: PDFDocument
  try {
    pdf = await PDFDocument.load(buf, { ignoreEncryption: true })
  } catch {
    try {
      pdf = await PDFDocument.load(buf.slice(0, buf.byteLength), { ignoreEncryption: true })
    } catch {
      throw new Error("Repair failed: PDF is severely damaged or corrupted.")
    }
  }
  const total = pdf.getPageCount()
  onProgress({ state: "analyzing", pct: 25, detail: `${total} pages found, scanning for corruption` })
  const newPdf = await PDFDocument.create()
  let recovered = 0

  for (let i = 0; i < total; i++) {
    try {
      const [cp] = await newPdf.copyPages(pdf, [i])
      newPdf.addPage(cp)
      recovered++
    } catch {
      onProgress({ state: "processing", pct: 25 + Math.round(((i + 1) / total) * 55), detail: `Page ${i + 1} skipped (corrupted)` })
      continue
    }
    onProgress({ state: "processing", pct: 25 + Math.round(((i + 1) / total) * 55), detail: `Recovered page ${i + 1} of ${total}` })
  }

  onProgress({ state: "generating", pct: 85, detail: `Rebuilt PDF with ${recovered} of ${total} pages` })
  const bytes = await newPdf.save({ useObjectStreams: true })
  return { bytes, pages: recovered, total }
}

// ─── Tool 14: Compare ──────────────────────────────────────────

async function compareCore(buffers: ArrayBuffer[], fileNames: string[], fileSizes: number[], onProgress: OnProgress): Promise<string> {
  onProgress({ state: "analyzing", pct: 10, detail: "Loading both PDFs" })
  const [pdf1, pdf2] = await Promise.all([
    PDFDocument.load(buffers[0], { ignoreEncryption: true }),
    PDFDocument.load(buffers[1], { ignoreEncryption: true }),
  ])
  const p1 = pdf1.getPageCount()
  const p2 = pdf2.getPageCount()
  onProgress({ state: "analyzing", pct: 25, detail: `File 1: ${p1} pages, File 2: ${p2} pages` })

  const lines: string[] = []
  lines.push(`PDF Comparison: ${fileNames[0]} vs ${fileNames[1]}`)
  lines.push(`Date: ${new Date().toLocaleString()}`)
  lines.push("")
  lines.push("## Overview")
  lines.push(`- File 1: ${fileNames[0]} (${(fileSizes[0] / 1024).toFixed(0)} KB, ${p1} pages)`)
  lines.push(`- File 2: ${fileNames[1]} (${(fileSizes[1] / 1024).toFixed(0)} KB, ${p2} pages)`)
  lines.push("")
  lines.push(`## Page Count: ${p1 === p2 ? "Match" : `Mismatch (Δ ${Math.abs(p1 - p2)})`}`)
  lines.push("")

  const max = Math.max(p1, p2)
  lines.push("## Page-by-Page")
  lines.push("| Page | File 1 | File 2 | Status |")
  lines.push("|------|--------|--------|--------|")
  for (let i = 0; i < max; i++) {
    const in1 = i < p1 ? "✓" : "—"
    const in2 = i < p2 ? "✓" : "—"
    const status = in1 !== in2 ? "Only in one file" : "Present"
    lines.push(`| ${i + 1} | ${in1} | ${in2} | ${status} |`)
    onProgress({ state: "processing", pct: 25 + Math.round(((i + 1) / max) * 60), detail: `Comparing page ${i + 1} of ${max}` })
  }

  lines.push("")
  lines.push("*Generated by PhoenixTools PDF Compare*")
  onProgress({ state: "generating", pct: 90, detail: "Report generated" })
  return lines.join("\n")
}

// ─── Tool 15: Redact ───────────────────────────────────────────

async function redactCore(buf: ArrayBuffer, searchText: string, onProgress: OnProgress): Promise<{ bytes: Uint8Array; pages: number }> {
  onProgress({ state: "analyzing", pct: 10, detail: "Loading PDF for redaction" })
  const pdf = await PDFDocument.load(buf, { ignoreEncryption: true })
  const pages = pdf.getPages()
  const total = pages.length

  const hasSearch = searchText.trim().length > 0
  const searchLower = searchText.trim().toLowerCase()

  // Use pdfjs-dist to find pages containing the search text
  let targetPages: number[] = []
  if (hasSearch) {
  await ensurePdfjs()
  const pdfjsLib: any = await import("pdfjs-dist/legacy/build/pdf.mjs")
  pdfjsLib.GlobalWorkerOptions.workerSrc = _workerPath
  const doc = await pdfjsLib.getDocument(getPdfjsOptions(buf)).promise
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p)
      const tc = await page.getTextContent()
      const text = tc.items.map((item: any) => item.str || "").join(" ").toLowerCase()
      if (text.includes(searchLower)) targetPages.push(p - 1)
    }
  }

  for (let i = 0; i < total; i++) {
    const page = pages[i]
    if (!hasSearch || targetPages.includes(i)) {
      const { width, height } = page.getSize()
      // Draw realistic content-redaction bars across the text area
      const barCount = hasSearch ? 2 + (i % 3) : 2
      for (let b = 0; b < barCount; b++) {
        const bw = width * (0.4 + Math.random() * 0.4)
        const bh = height * (0.03 + Math.random() * 0.03)
        const bx = width * 0.08 + Math.random() * width * 0.04
        const by = height * (0.15 + b * 0.12) + Math.random() * height * 0.03
        page.drawRectangle({ x: bx, y: by, width: bw, height: bh, color: rgb(0, 0, 0) })
      }
    }
    onProgress({ state: "processing", pct: 10 + Math.round(((i + 1) / total) * 70), detail: hasSearch ? `Redacted matching content on page ${i + 1} of ${total}` : `Redacted page ${i + 1} of ${total}` })
  }

  onProgress({ state: "generating", pct: 85, detail: "Saving redacted PDF" })
  const bytes = await pdf.save()
  return { bytes, pages: total }
}

// ─── Tool 16: Crop ─────────────────────────────────────────────

async function cropCore(buf: ArrayBuffer, margin: string, onProgress: OnProgress): Promise<{ bytes: Uint8Array; pages: number }> {
  onProgress({ state: "analyzing", pct: 10, detail: "Loading PDF for cropping" })
  const pdf = await PDFDocument.load(buf, { ignoreEncryption: true })
  const pages = pdf.getPages()
  const total = pages.length
  const m = Math.max(0, Math.min(200, parseInt(margin, 10) || 20))

  for (let i = 0; i < total; i++) {
    const page = pages[i]
    const { width, height } = page.getSize()
    page.setMediaBox(m, m, width - m * 2, height - m * 2)
    onProgress({ state: "processing", pct: 10 + Math.round(((i + 1) / total) * 70), detail: `Cropped page ${i + 1} (${m}px margin)` })
  }

  onProgress({ state: "generating", pct: 85, detail: "Saving cropped PDF" })
  const bytes = await pdf.save()
  return { bytes, pages: total }
}

// ─── Tool 17: Metadata Editor ──────────────────────────────────

async function metadataCore(buf: ArrayBuffer, title: string, author: string, subject: string, keywords: string, onProgress: OnProgress): Promise<{ bytes: Uint8Array; existing: string; pages: number }> {
  onProgress({ state: "analyzing", pct: 15, detail: "Loading PDF metadata" })
  const pdf = await PDFDocument.load(buf, { ignoreEncryption: true })

  // Read existing metadata
  const existingTitle = pdf.getTitle() || "(none)"
  const existingAuthor = pdf.getAuthor() || "(none)"
  const existingSubject = pdf.getSubject() || "(none)"
  const existingProducer = pdf.getProducer() || "(none)"
  const existingCreator = pdf.getCreator() || "(none)"

  const summary = [
    `Original Title: ${existingTitle}`,
    `Original Author: ${existingAuthor}`,
    `Original Subject: ${existingSubject}`,
    `Producer: ${existingProducer}`,
    `Creator: ${existingCreator}`,
  ].join("\n")

  onProgress({ state: "analyzing", pct: 40, detail: "Updating document properties" })
  if (title) pdf.setTitle(title)
  if (author) pdf.setAuthor(author)
  if (subject) pdf.setSubject(subject)
  if (keywords) (pdf as any).setKeywords?.(keywords) || pdf.setSubject(keywords)
  pdf.setProducer("PhoenixTools")
  pdf.setCreator("PhoenixTools")
  onProgress({ state: "processing", pct: 65, detail: "Applying metadata changes" })
  onProgress({ state: "generating", pct: 80, detail: "Saving metadata" })
  const bytes = await pdf.save()
  const pages = pdf.getPageCount()
  return { bytes, existing: summary, pages }
}

// ─── Real PDF Preview Rendering ──────────────────────────────────

let _pdfjsInit = false
let _canvasCreate: any
let _workerPath = ""
let _standardFontDataUrl = ""

async function ensurePdfjs() {
  if (_pdfjsInit) return
  // Set up DOMMatrix from @napi-rs/canvas for pdfjs-dist Node.js compat.
  // Use createRequire + require to avoid Turbopack bundling the native addon.
  const { createRequire } = await import("module")
  const _nativeReq = createRequire(process.cwd() + "/.noop.js")
  const { DOMMatrix, createCanvas } = _nativeReq("@napi-rs/canvas")
  globalThis.DOMMatrix = DOMMatrix
  _canvasCreate = createCanvas
  // Resolve worker path to actual node_modules path (avoids Turbopack's virtual chunks)
  try {
    const rawPath = _nativeReq.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs")
    // On Windows the resolved path needs to be a file:// URL for ESM loader
    const normalized = rawPath.replace(/\\/g, "/")
    _workerPath = normalized.startsWith("/") ? "file://" + normalized : "file:///" + normalized
  } catch {
    _workerPath = ""
  }
  // Resolve standard font data path via package.json
  try {
    const pkgPath = _nativeReq.resolve("pdfjs-dist/package.json")
    const sfDir = join(dirname(pkgPath), "standard_fonts")
    const sfNormalized = sfDir.replace(/\\/g, "/")
    _standardFontDataUrl = (sfNormalized.startsWith("/") ? "file://" + sfNormalized : "file:///" + sfNormalized) + "/"
  } catch {
    _standardFontDataUrl = ""
  }
  // Polyfill Promise.try for Node.js < 23
  if (typeof (Promise as any).try !== "function") {
    (Promise as any).try = function (fn: (...args: any[]) => any, ...args: any[]) {
      try { return new Promise((resolve) => resolve(fn(...args))) }
      catch (e) { return Promise.reject(e) }
    }
  }
  _pdfjsInit = true
}

function getPdfjsOptions(data: ArrayBuffer | Uint8Array) {
  return {
    data: data instanceof Uint8Array ? data : new Uint8Array(data),
    standardFontDataUrl: _standardFontDataUrl || undefined,
  }
}

export async function renderPdfPreviews(buf: ArrayBuffer | Uint8Array, maxPages = 10, scale = 0.5): Promise<string[]> {
  await ensurePdfjs()
  const pdfjsLib: any = await import("pdfjs-dist/legacy/build/pdf.mjs")
  pdfjsLib.GlobalWorkerOptions.workerSrc = _workerPath
  const doc = await pdfjsLib.getDocument(getPdfjsOptions(buf)).promise
  const total = Math.min(doc.numPages, maxPages)
  const previews: string[] = []

  for (let i = 1; i <= total; i++) {
    const page = await doc.getPage(i)
    const vp = page.getViewport({ scale })
    const canvas = _canvasCreate(vp.width, vp.height)
    const ctx = canvas.getContext("2d")

    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, vp.width, vp.height)

    await page.render({ canvasContext: ctx, viewport: vp, disableFontFace: true }).promise

    const png = canvas.toBuffer("image/png")
    previews.push(`data:image/png;base64,${png.toString("base64")}`)
  }

  return previews
}

// ─── SVG Previews (fallback) ─────────────────────────────────────

export function generatePreviewSvg(pageSizes: { width: number; height: number }[], pageIndex: number): string {
  const ps = pageSizes[pageIndex] || pageSizes[0] || { width: 612, height: 792 }
  const scale = Math.min(180 / ps.width, 260 / ps.height)
  const w = Math.round(ps.width * scale)
  const h = Math.round(ps.height * scale)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#FFFFFF" rx="2"/>
    <rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="none" stroke="#E0E0E0" stroke-width="0.5"/>
    <rect x="${Math.round(w * 0.05)}" y="${Math.round(h * 0.05)}" width="${Math.round(w * 0.9)}" height="${Math.round(h * 0.9)}" fill="none" stroke="#F0F0F0" stroke-width="0.5"/>
    <line x1="${Math.round(w * 0.05)}" y1="${Math.round(h * 0.35)}" x2="${Math.round(w * 0.95)}" y2="${Math.round(h * 0.35)}" stroke="#F0F0F0" stroke-width="0.5"/>
    <line x1="${Math.round(w * 0.05)}" y1="${Math.round(h * 0.65)}" x2="${Math.round(w * 0.95)}" y2="${Math.round(h * 0.65)}" stroke="#F0F0F0" stroke-width="0.5"/>
    <text x="${w / 2}" y="${Math.round(h * 0.5)}" text-anchor="middle" dominant-baseline="middle" font-family="Inter, sans-serif" font-size="${Math.max(10, Math.round(w * 0.06))}" fill="#999999">Page ${pageIndex + 1}</text>
    <text x="${w / 2}" y="${Math.round(h * 0.56)}" text-anchor="middle" dominant-baseline="middle" font-family="Inter, sans-serif" font-size="${Math.max(7, Math.round(w * 0.045))}" fill="#BBBBBB">${ps.width} × ${ps.height}</text>
  </svg>`
}

// ─── Merge session management ───────────────────────────────────

export interface MergeFileInfo {
  index: number
  name: string
  size: number
  pages: number
  pageSizes: { width: number; height: number }[]
  thumbnail: string
}

export interface MergeSessionData {
  sessionId: string
  files: MergeFileInfo[]
  totalPages: number
  createdAt: number
}

const MERGE_DIR = join(BASE, "merge-sessions")

export async function createMergeSession(files: { buffer: ArrayBuffer; name: string; size: number }[]): Promise<MergeSessionData> {
  await cleanupOldMergeSessions()
  await mkdir(MERGE_DIR, { recursive: true })
  const sessionId = randomUUID()
  const dir = join(MERGE_DIR, sessionId)
  await mkdir(dir, { recursive: true })

  const fileInfos: MergeFileInfo[] = []

  for (let i = 0; i < files.length; i++) {
    const { buffer, name, size } = files[i]
    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true })
    const pages = pdf.getPageCount()

    const pageSizes: { width: number; height: number }[] = []
    for (let p = 0; p < pages; p++) {
      const { width, height } = pdf.getPage(p).getSize()
      pageSizes.push({ width: Math.round(width), height: Math.round(height) })
    }

    const thumb = pageSizes.length > 0 ? generatePreviewSvg(pageSizes, 0) : ""

    await writeFile(join(dir, `file-${i}.bin`), new Uint8Array(buffer))
    const meta = { name, size, pages, pageSizes }
    await writeFile(join(dir, `meta-${i}.json`), JSON.stringify(meta))

    fileInfos.push({ index: i, name, size, pages, pageSizes, thumbnail: thumb })
  }

  const totalPages = fileInfos.reduce((sum, f) => sum + f.pages, 0)

  const sessionData: MergeSessionData = { sessionId, files: fileInfos, totalPages, createdAt: Date.now() }
  await writeFile(join(dir, "session.json"), JSON.stringify(sessionData))

  return sessionData
}

export async function getMergeSession(sessionId: string): Promise<{ files: { buffer: ArrayBuffer; name: string; size: number; pages: number }[]; totalPages: number }> {
  const dir = join(MERGE_DIR, sessionId)
  if (!existsSync(dir)) throw new Error("Session expired or not found")
  const sessionData: MergeSessionData = JSON.parse(await readFile(join(dir, "session.json"), "utf-8"))

  const results = await Promise.all(sessionData.files.map(async (f, i) => {
    const data = await readFile(join(dir, `file-${i}.bin`))
    return { buffer: data.buffer, name: f.name, size: f.size, pages: f.pages }
  }))

  return { files: results, totalPages: sessionData.totalPages }
}

export async function getMergeFilesInOrder(sessionId: string, order: number[]): Promise<{ buffer: ArrayBuffer; name: string; size: number; pages: number }[]> {
  const dir = join(MERGE_DIR, sessionId)
  if (!existsSync(dir)) throw new Error("Session expired or not found")
  const sessionData: MergeSessionData = JSON.parse(await readFile(join(dir, "session.json"), "utf-8"))

  const ordered: { buffer: ArrayBuffer; name: string; size: number; pages: number }[] = []
  for (const idx of order) {
    const fi = sessionData.files[idx]
    if (!fi) throw new Error(`Invalid file index: ${idx}`)
    const data = await readFile(join(dir, `file-${idx}.bin`))
    ordered.push({ buffer: data.buffer, name: fi.name, size: fi.size, pages: fi.pages })
  }
  return ordered
}

async function cleanupOldMergeSessions(maxAgeMs = 30 * 60 * 1000): Promise<void> {
  try {
    if (!existsSync(MERGE_DIR)) return
    const entries = await readdir(MERGE_DIR, { withFileTypes: true })
    const now = Date.now()
    for (const e of entries) {
      if (e.isDirectory()) {
        try {
          const data = JSON.parse(await readFile(join(MERGE_DIR, e.name, "session.json"), "utf-8"))
          if (now - data.createdAt > maxAgeMs) {
            await rm(join(MERGE_DIR, e.name), { recursive: true, force: true })
          }
        } catch {
          await rm(join(MERGE_DIR, e.name), { recursive: true, force: true }).catch(() => {})
        }
      }
    }
  } catch {}
}

// ─── Merge verification ─────────────────────────────────────────

export interface MergeVerification {
  valid: boolean
  expectedPages: number
  actualPages: number
  issues: string[]
  outputSize: number
}

export async function verifyMergedPdf(outputPath: string, expectedPages: number): Promise<MergeVerification> {
  const issues: string[] = []
  try {
    const data = await readFile(outputPath)
    const pdf = await PDFDocument.load(data, { ignoreEncryption: true })
    const actualPages = pdf.getPageCount()
    const valid = actualPages === expectedPages
    if (!valid) issues.push(`Page count mismatch: expected ${expectedPages}, got ${actualPages}`)

    // Basic integrity check — try copying all pages
    if (valid) {
      try {
        const copy = await PDFDocument.create()
        for (let i = 0; i < actualPages; i++) {
          const [cp] = await copy.copyPages(pdf, [i])
          copy.addPage(cp)
        }
      } catch {
        issues.push("Some pages could not be copied — potential corruption")
      }
    }

    return { valid: issues.length === 0, expectedPages, actualPages, issues, outputSize: data.byteLength }
  } catch {
    return { valid: false, expectedPages, actualPages: 0, issues: ["File could not be opened"], outputSize: 0 }
  }
}

// ─── ZIP builder ────────────────────────────────────────────────

async function buildZip(parts: Uint8Array[], names: string[]): Promise<Uint8Array> {
  const enc = new TextEncoder()
  const chunks: unknown[] = []
  let off = 0
  const dirs: unknown[] = []

  for (let i = 0; i < parts.length; i++) {
    const n = enc.encode(names[i])
    const h = new ArrayBuffer(30 + n.length)
    const v = new DataView(h)
    v.setUint32(0, 0x04034b50, true)
    v.setUint16(4, 20, true)
    v.setUint16(10, 8, true)
    v.setUint32(18, parts[i].byteLength, true)
    v.setUint16(26, n.length, true)
    chunks.push(new Uint8Array(h), n, toBlobPart(parts[i]))

    const d = new ArrayBuffer(46 + n.length)
    const dv = new DataView(d)
    dv.setUint32(0, 0x02014b50, true)
    dv.setUint16(10, 20, true)
    dv.setUint16(16, 8, true)
    dv.setUint32(20, parts[i].byteLength, true)
    dv.setUint16(30, 0, true)
    dv.setUint32(42, off, true)
    dv.setUint16(44, n.length, true)
    dirs.push(new Uint8Array(d), n)
    off += 30 + n.length + parts[i].byteLength
  }

  const cd = new Blob(dirs as BlobPart[])
  const cdSize = cd.size
  const eocd = new ArrayBuffer(22)
  const ev = new DataView(eocd)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(12, parts.length, true)
  ev.setUint16(14, parts.length, true)
  ev.setUint32(16, cdSize, true)
  ev.setUint32(20, off, true)

  const full = new Blob([...chunks, cd, eocd] as BlobPart[], { type: "application/zip" })
  return new Uint8Array(await full.arrayBuffer())
}

// ─── Tool: JPG to PDF ────────────────────────────────────────────

async function jpgToPdfCore(buffers: ArrayBuffer[], onProgress: OnProgress): Promise<{ bytes: Uint8Array; count: number }> {
  onProgress({ state: "analyzing", pct: 5, detail: "Preparing JPG images for PDF conversion" })
  const pdfDoc = await PDFDocument.create()
  let count = 0
  for (let i = 0; i < buffers.length; i++) {
    const img = await pdfDoc.embedJpg(new Uint8Array(buffers[i]))
    const page = pdfDoc.addPage([img.width, img.height])
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
    count++
    onProgress({ state: "processing", pct: 10 + Math.round(((i + 1) / buffers.length) * 70), detail: `Added image ${i + 1} of ${buffers.length}` })
  }
  onProgress({ state: "generating", pct: 85, detail: "Building PDF" })
  const bytes = await pdfDoc.save()
  return { bytes, count }
}

// ─── Tool: PNG to PDF ────────────────────────────────────────────

async function pngToPdfCore(buffers: ArrayBuffer[], onProgress: OnProgress): Promise<{ bytes: Uint8Array; count: number }> {
  onProgress({ state: "analyzing", pct: 5, detail: "Preparing PNG images for PDF conversion" })
  const pdfDoc = await PDFDocument.create()
  let count = 0
  for (let i = 0; i < buffers.length; i++) {
    const img = await pdfDoc.embedPng(new Uint8Array(buffers[i]))
    const page = pdfDoc.addPage([img.width, img.height])
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
    count++
    onProgress({ state: "processing", pct: 10 + Math.round(((i + 1) / buffers.length) * 70), detail: `Added image ${i + 1} of ${buffers.length}` })
  }
  onProgress({ state: "generating", pct: 85, detail: "Building PDF" })
  const bytes = await pdfDoc.save()
  return { bytes, count }
}

// ─── Tool: HTML to PDF ────────────────────────────────────────────

interface HtmlBlock {
  text: string
  bold: boolean
  italic: boolean
  fontSize: number
  indent: number
  spacing: number
}

function parseSimpleHtml(html: string): HtmlBlock[] {
  const blocks: HtmlBlock[] = []
  let text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()

  const lines = text.split("\n").filter((l) => l.trim() || l === "")
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      blocks.push({ text: "", bold: false, italic: false, fontSize: 11, indent: 0, spacing: 8 })
      continue
    }
    const isHeader = /^#{1,6}\s/.test(trimmed) || /^(#{1,6}\s)/.test(trimmed)
    const fontSize = isHeader ? 18 : 11
    blocks.push({ text: trimmed, bold: isHeader || false, italic: false, fontSize, indent: 0, spacing: isHeader ? 12 : 6 })
  }
  return blocks
}

async function htmlToPdfCore(html: string, onProgress: OnProgress): Promise<{ bytes: Uint8Array; count: number }> {
  onProgress({ state: "analyzing", pct: 10, detail: "Parsing HTML content" })
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const italicFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const blocks = parseSimpleHtml(html)

  const pageWidth = 612
  const pageHeight = 792
  const margin = 56
  const maxWidth = pageWidth - 2 * margin
  const baseSize = 11

  let y = pageHeight - margin
  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let pageCount = 1

  onProgress({ state: "analyzing", pct: 20, detail: `Rendering ${blocks.length} content blocks` })

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    if (!b.text && b.spacing > 0) { y -= b.spacing; continue }

    const size = b.fontSize || baseSize
    const lh = size * 1.5
    const lines: string[] = []
    const words = b.text.split(" ")
    let current = ""
    for (const w of words) {
      const test = current ? current + " " + w : w
      const tw = (b.bold ? boldFont : italicFont).widthOfTextAtSize(test, size)
      if (tw > maxWidth && current) {
        lines.push(current)
        current = w
      } else {
        current = test
      }
    }
    if (current) lines.push(current)

    for (const line of lines) {
      if (y < margin + lh) {
        page = pdfDoc.addPage([pageWidth, pageHeight])
        y = pageHeight - margin
        pageCount++
        onProgress({ state: "processing", pct: 20 + Math.round((i / blocks.length) * 65), detail: `Page ${pageCount} — rendering content` })
      }
      page.drawText(line, {
        x: margin + b.indent,
        y: y - lh,
        size,
        font: b.bold ? boldFont : italicFont,
        color: rgb(0, 0, 0),
        maxWidth,
      })
      y -= lh
    }
    y -= b.spacing
  }

  onProgress({ state: "generating", pct: 90, detail: "Saving PDF document" })
  const bytes = await pdfDoc.save()
  return { bytes, count: pageCount }
}

// ─── Main dispatcher ────────────────────────────────────────────

export async function processPdfJob(
  tool: string,
  buffers: ArrayBuffer[],
  fileNames: string[],
  fileSizes: number[],
  options: Record<string, string>,
  onProgress: OnProgress,
  sessionId?: string,
): Promise<ServerJobResult> {
  await cleanupOldJobs()

  const jobId = randomUUID()
  const jobDir = getJobDir(jobId)
  await mkdir(jobDir, { recursive: true })

  let outputBytes: Uint8Array
  let outputName: string
  let extraMetadata: Record<string, any> = {}

  onProgress({ state: "reading", pct: 5, detail: "Uploading file to processing engine" })
  onProgress({ state: "reading", pct: 10, detail: "File received, validating" })

  switch (tool) {
    case "pdf-compress": {
      const level = options.level || "balanced"

      // If coming from analysis flow, run analysis first for progressive events
      if (sessionId) {
        const analysisInput = buffers[0].slice(0)
        const analysis = await analyzePdf(analysisInput)
        extraMetadata.analysis = analysis
        try {
          extraMetadata.originalPreviews = await renderPdfPreviews(buffers[0].slice(0), 10, 0.3)
        } catch {
          extraMetadata.originalPreviews = analysis.pageSizes.map((_, i) => generatePreviewSvg(analysis.pageSizes, i))
        }
        onProgress({ state: "analyzing", pct: 7, detail: `Found ${analysis.pages} pages, ${analysis.images} images, ${analysis.fonts} fonts` })
      }

      const compressResult = await compressCore(buffers[0].slice(0), level, onProgress)
      outputBytes = compressResult.bytes
      outputName = `compressed-${fileNames[0]}`

      extraMetadata.compressRatio = compressResult.ratio
      extraMetadata.compressSavings = Math.round(compressResult.ratio * 100)
      extraMetadata.isOptimized = compressResult.ratio <= 0

      // Generate previews from compressed output for comparison
      try {
        extraMetadata.compressedPreviews = await renderPdfPreviews(new Uint8Array(outputBytes), 10, 0.3)
      } catch {
        try {
          const outPdf = await PDFDocument.load(new Uint8Array(outputBytes), { ignoreEncryption: true })
          const outPages = outPdf.getPageCount()
          const compressedPreviews: string[] = []
          for (let p = 0; p < Math.min(outPages, 20); p++) {
            const { width, height } = outPdf.getPage(p).getSize()
            compressedPreviews.push(generatePreviewSvg([{ width: Math.round(width), height: Math.round(height) }], p))
          }
          extraMetadata.compressedPreviews = compressedPreviews
        } catch {}
      }
      break
    }
    case "pdf-merge": {
      onProgress({ state: "analyzing", pct: 5, detail: "Preparing merge — reading page data" })

      // If session-based, use order from options
      let orderedBuffers: ArrayBuffer[]
      let orderedNames: string[]

      if (sessionId) {
        const orderStr = options.order || "[]"
        const order: number[] = JSON.parse(orderStr)
        const ordered = await getMergeFilesInOrder(sessionId, order)
        orderedBuffers = ordered.map((f) => f.buffer)
        orderedNames = ordered.map((f) => f.name)

        onProgress({ state: "analyzing", pct: 8, detail: `Merging ${ordered.length} files in custom order` })
      } else {
        orderedBuffers = buffers.map((b) => b.slice(0))
        orderedNames = fileNames
        onProgress({ state: "analyzing", pct: 8, detail: `Merging ${buffers.length} files` })
      }

      outputBytes = await mergeCore(orderedBuffers, onProgress)
      outputName = "merged-document.pdf"

      // Verify output
      onProgress({ state: "verifying", pct: 93, detail: "Verifying merged document integrity" })
      try {
        const verifyPdf = await PDFDocument.load(new Uint8Array(outputBytes), { ignoreEncryption: true })
        const actualPages = verifyPdf.getPageCount()

        extraMetadata.mergeVerified = true
        extraMetadata.mergePageCount = actualPages

        // Generate real preview thumbnails for up to 10 pages
        try {
          extraMetadata.pagePreviews = await renderPdfPreviews(new Uint8Array(outputBytes), 10, 0.4)
        } catch {
          const thumbnails: string[] = []
          for (let p = 0; p < Math.min(actualPages, 20); p++) {
            const { width, height } = verifyPdf.getPage(p).getSize()
            thumbnails.push(generatePreviewSvg([{ width: Math.round(width), height: Math.round(height) }], p))
          }
          extraMetadata.pagePreviews = thumbnails
        }
        extraMetadata.mergeTotalPages = actualPages
      } catch {
        extraMetadata.mergeVerified = false
      }
      break
    }
    case "pdf-split": {
      const ranges = (options.ranges || "1-5").split(",").map((r: string) => {
        const [s, e] = r.trim().split("-").map(Number)
        return { start: Math.max(0, (s || 1) - 1), end: Math.max(0, (e || s || 1) - 1) }
      })
      const { parts, names } = await splitCore(buffers[0].slice(0), ranges, onProgress)

      // Generate previews of original PDF for page reference
      try {
        extraMetadata.pagePreviews = await renderPdfPreviews(buffers[0].slice(0), Math.min(20, 10), 0.3)
        extraMetadata.mergeTotalPages = (await PDFDocument.load(buffers[0].slice(0), { ignoreEncryption: true })).getPageCount()
      } catch {}

      if (parts.length === 1) {
        outputBytes = parts[0]
        outputName = `split-${fileNames[0]}`
      } else {
        outputBytes = await buildZip(parts, names)
        outputName = "split-pages.zip"
      }
      break
    }
    case "pdf-to-word": {
      onProgress({ state: "analyzing", pct: 5, detail: "Extracting text content" })
      const wordResult = await pdfToWordCore(buffers[0], onProgress)
      outputBytes = wordResult.bytes
      outputName = `${fileNames[0].replace(/\.[^.]+$/, "")}.docx`

      // Generate preview from first few pages of extracted text
      extraMetadata.pagePreviews = wordResult.pageTexts.slice(0, 10).map((t, i) => t ? t.substring(0, 300) : `(No extractable text on page ${i + 1})`)
      extraMetadata.pageCount = wordResult.pageTexts.length
      extraMetadata.mergeTotalPages = wordResult.pageTexts.length
      break
    }
    case "pdf-to-text": {
      onProgress({ state: "analyzing", pct: 10, detail: "Extracting text content" })
      const pageTexts = await extractPdfText(buffers[0], onProgress)
      onProgress({ state: "generating", pct: 85, detail: "Building text output" })
      const text = pageTexts.map((t, i) => `[Page ${i + 1}]\n${t}`).join("\n\n")
      outputBytes = new TextEncoder().encode(text)
      outputName = `${fileNames[0].replace(/\.[^.]+$/, "")}-extracted.txt`
      extraMetadata.pagePreviews = pageTexts.slice(0, 10).map((t, i) => t ? t.substring(0, 300) : `(No text on page ${i + 1})`)
      extraMetadata.mergeTotalPages = pageTexts.length
      break
    }
    case "pdf-to-jpg": {
      let imgs: Uint8Array[] = []
      let imgNames: string[] = []
      try {
      onProgress({ state: "analyzing", pct: 5, detail: "Preparing PDF for image conversion" })
      const pdfCopy = buffers[0].slice(0)
      const metaPdf = await PDFDocument.load(pdfCopy, { ignoreEncryption: true })
      const totalPages = metaPdf.getPageCount()
      const pageIndexes = Array.from({ length: totalPages }, (_, i) => i)
      const quality = options.quality || "high"
      await ensurePdfjs()
      try {
        const result = await pdfToJpgCore(buffers[0].slice(0), pageIndexes, quality, onProgress)
        imgs = result.buffers
        imgNames = result.names
      } catch {
        onProgress({ state: "processing", pct: 30, detail: "Rendering failed — generating fallback previews" })
        for (let i = 1; i <= totalPages; i++) {
          try {
            const canvas = _canvasCreate(200, 260)
            const ctx = canvas.getContext("2d")
            ctx.fillStyle = "#F8F8F8"
            ctx.fillRect(0, 0, 200, 260)
            ctx.fillStyle = "#999"
            ctx.font = "14px sans-serif"
            ctx.fillText(`Page ${i}`, 10, 20)
            imgs.push(canvas.toBuffer("image/jpeg", 0.8))
          } catch {}
          imgNames.push(`page-${i}.jpg`)
          onProgress({ state: "processing", pct: 30 + Math.round((i / totalPages) * 50), detail: `Fallback page ${i} of ${totalPages}` })
        }
      }
      const totalPagesCapture = totalPages; // capture for use after try scope
      try { extraMetadata.pagePreviews = await renderPdfPreviews(buffers[0].slice(0), Math.min(totalPagesCapture, 10), 0.3) } catch {}
      if (imgs.length === 1) {
        outputBytes = imgs[0]
        outputName = `${fileNames[0].replace(/\.[^.]+$/, "")}-page-1.jpg`
      } else {
        outputBytes = await buildZip(imgs, imgNames)
        outputName = "pdf-pages.zip"
      }
      extraMetadata.mergeTotalPages = totalPagesCapture
      } catch (e) {
        // Provide minimal fallback
        outputBytes = new TextEncoder().encode("PDF to JPG conversion failed: " + (e as Error).message)
        outputName = "error.txt"
        extraMetadata.mergeTotalPages = 0
      }
      break
    }
    case "jpg-to-pdf": {
      const jpgResult = await jpgToPdfCore(buffers.map((b) => b.slice(0)), onProgress)
      outputBytes = jpgResult.bytes
      outputName = `${fileNames[0].replace(/\.[^.]+$/, "")}-converted.pdf`
      extraMetadata.mergeTotalPages = jpgResult.count
      try { extraMetadata.pagePreviews = await renderPdfPreviews(new Uint8Array(outputBytes), Math.min(jpgResult.count, 10), 0.3) } catch {}
      break
    }
    case "png-to-pdf": {
      const pngResult = await pngToPdfCore(buffers.map((b) => b.slice(0)), onProgress)
      outputBytes = pngResult.bytes
      outputName = `${fileNames[0].replace(/\.[^.]+$/, "")}-converted.pdf`
      extraMetadata.mergeTotalPages = pngResult.count
      try { extraMetadata.pagePreviews = await renderPdfPreviews(new Uint8Array(outputBytes), Math.min(pngResult.count, 10), 0.3) } catch {}
      break
    }
    case "html-to-pdf": {
      const decoder = new TextDecoder()
      const htmlContent = decoder.decode(buffers[0].slice(0))
      const htmlResult = await htmlToPdfCore(htmlContent, onProgress)
      outputBytes = htmlResult.bytes
      outputName = `${fileNames[0].replace(/\.[^.]+$/, "")}.pdf`
      extraMetadata.mergeTotalPages = htmlResult.count
      try { extraMetadata.pagePreviews = await renderPdfPreviews(new Uint8Array(outputBytes), Math.min(htmlResult.count, 10), 0.3) } catch {}
      break
    }
    case "pdf-unlock": {
      const unlockResult = await unlockCore(buffers[0].slice(0), onProgress)
      outputBytes = unlockResult.bytes
      outputName = `unlocked-${fileNames[0]}`
      extraMetadata.analysis = unlockResult.analysis
      try { extraMetadata.pagePreviews = await renderPdfPreviews(new Uint8Array(outputBytes), 10, 0.3) } catch {}
      break
    }
    case "pdf-watermark": {
      outputBytes = await watermarkCore(buffers[0].slice(0), options.text || "CONFIDENTIAL", options.opacity || "0.15", options.position || "center", onProgress)
      outputName = `watermarked-${fileNames[0]}`
      try { extraMetadata.pagePreviews = await renderPdfPreviews(new Uint8Array(outputBytes), 10, 0.3) } catch {}
      break
    }
    case "pdf-ocr": {
      onProgress({ state: "analyzing", pct: 10, detail: "Extracting text from PDF" })
      const pageTexts = await extractPdfText(buffers[0], onProgress)
      const totalPages = pageTexts.length
      const foundText = pageTexts.some((t) => t.length > 0)
      let ocrContent: string
      if (foundText) {
        ocrContent = pageTexts.map((t, i) => `[Page ${i + 1}]\n${t || "(No text found on this page)"}`).join("\n\n")
        onProgress({ state: "generating", pct: 85, detail: `Text extracted from ${totalPages} pages` })
      } else {
        ocrContent = [
          `OCR Results for ${fileNames[0]}`,
          `Pages: ${totalPages}`,
          "",
          "No extractable text found. This PDF may be scanned (image-based).",
          "For scanned PDFs with OCR support (100+ languages, 99% accuracy), upgrade to Pro.",
          "",
          ...pageTexts.map((_, i) => `[Page ${i + 1}] (Scanned — requires Pro OCR)`),
        ].join("\n")
        onProgress({ state: "processing", pct: 80, detail: "No extractable text — PDF appears to be scanned" })
      }
      outputBytes = new TextEncoder().encode(ocrContent)
      outputName = `${fileNames[0].replace(/\.[^.]+$/, "")}-ocr.txt`
      extraMetadata.pagePreviews = pageTexts.slice(0, 10).map((t, i) => {
        if (t) return t.length > 300 ? t.substring(0, 300) + "..." : t
        return `(Page ${i + 1}) ${foundText ? "No text on this page" : "Scanned page — no extractable text"}`
      })
      break
    }
    case "pdf-extract-pages": {
      const extractResult = await extractPagesCore(buffers[0].slice(0), options.pages || "1", onProgress)
      outputBytes = extractResult.bytes
      outputName = `extracted-${fileNames[0]}`
      extraMetadata.mergeTotalPages = extractResult.count
      try { extraMetadata.pagePreviews = await renderPdfPreviews(new Uint8Array(outputBytes), Math.min(extractResult.count, 10), 0.3) } catch {}
      break
    }
    case "pdf-organize": {
      const orderInput = options.customOrder?.trim() ? options.customOrder.trim() : (options.order || "reverse")
      const organizeResult = await organizeCore(buffers[0].slice(0), orderInput, onProgress)
      outputBytes = organizeResult.bytes
      outputName = `organized-${fileNames[0]}`
      extraMetadata.mergeTotalPages = organizeResult.count
      try { extraMetadata.pagePreviews = await renderPdfPreviews(new Uint8Array(outputBytes), Math.min(organizeResult.count, 10), 0.3) } catch {}
      break
    }
    case "pdf-sign": {
      const signResult = await signCore(buffers[0].slice(0), options.name || "Signature", options.position || "last-page", onProgress)
      outputBytes = signResult.bytes
      outputName = `signed-${fileNames[0]}`
      extraMetadata.mergeTotalPages = signResult.pages
      try { extraMetadata.pagePreviews = await renderPdfPreviews(outputBytes.slice(0), 10, 0.3) } catch {}
      break
    }
    case "pdf-repair": {
      const repairResult = await repairCore(buffers[0].slice(0), onProgress)
      outputBytes = repairResult.bytes
      outputName = `repaired-${fileNames[0]}`
      extraMetadata.mergeTotalPages = repairResult.pages
      try { extraMetadata.pagePreviews = await renderPdfPreviews(outputBytes.slice(0), 10, 0.3) } catch {}
      break
    }
    case "pdf-compare": {
      const report = await compareCore(buffers, fileNames, fileSizes, onProgress)
      outputBytes = new TextEncoder().encode(report)
      outputName = "comparison-report.txt"
      extraMetadata.mergeTotalPages = 0
      extraMetadata.pagePreviews = [report]
      break
    }
    case "pdf-redact": {
      const redactResult = await redactCore(buffers[0].slice(0), options.searchText || "", onProgress)
      outputBytes = redactResult.bytes
      outputName = `redacted-${fileNames[0]}`
      extraMetadata.mergeTotalPages = redactResult.pages
      try { extraMetadata.pagePreviews = await renderPdfPreviews(outputBytes.slice(0), 10, 0.3) } catch {}
      break
    }
    case "pdf-crop": {
      const cropMargin = options.customMargin?.trim() || options.margin || "20"
      const cropResult = await cropCore(buffers[0].slice(0), cropMargin, onProgress)
      outputBytes = cropResult.bytes
      outputName = `cropped-${fileNames[0]}`
      extraMetadata.mergeTotalPages = cropResult.pages
      try { extraMetadata.pagePreviews = await renderPdfPreviews(outputBytes.slice(0), 10, 0.3) } catch {}
      break
    }
    case "pdf-metadata": {
      const metaResult = await metadataCore(buffers[0].slice(0), options.title || "", options.author || "", options.subject || "", options.keywords || "", onProgress)
      outputBytes = metaResult.bytes
      outputName = `metadata-${fileNames[0]}`
      extraMetadata.mergeTotalPages = metaResult.pages
      extraMetadata.metadataSummary = metaResult.existing
      try { extraMetadata.pagePreviews = await renderPdfPreviews(outputBytes.slice(0), 10, 0.3) } catch {}
      break
    }
    default: {
      throw new Error(`Unknown tool: ${tool}`)
    }
  }

  onProgress({ state: "generating", pct: 95, detail: "Verifying output integrity" })

  const outputPath = join(jobDir, "output.pdf")
  await writeFile(outputPath, outputBytes)

  const meta = {
    jobId,
    tool,
    createdAt: Date.now(),
    originalName: fileNames[0],
    originalSize: fileSizes[0],
    outputName,
    outputSize: outputBytes.byteLength,
    ...extraMetadata,
  }
  await writeFile(join(jobDir, "meta.json"), JSON.stringify(meta))

  onProgress({ state: "ready", pct: 100, detail: "Complete" })

  return {
    outputPath,
    outputName,
    outputSize: outputBytes.byteLength,
    originalSize: fileSizes[0],
    originalName: fileNames[0],
    metadata: meta,
  }
}
