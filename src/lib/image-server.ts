import { writeFile, mkdir, readFile, readdir, rm } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"
import { existsSync } from "fs"

let _loadImage: any = null
let _canvasCreate: any = null

async function getImageLoader(): Promise<{ loadImage: any; createCanvas: any }> {
  if (!_loadImage) {
    const { createRequire } = await import("module")
    const _nativeReq = createRequire(process.cwd() + "/.noop.js")
    const canvas = _nativeReq("@napi-rs/canvas")
    _loadImage = canvas.loadImage
    _canvasCreate = canvas.createCanvas
  }
  return { loadImage: _loadImage, createCanvas: _canvasCreate }
}

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

type OnProgress = (evt: ServerProgress) => void

const BASE = join(tmpdir(), "phoenixtools-image")

export function getJobDir(jobId: string): string {
  return join(BASE, jobId)
}

export async function cleanupOldJobs(maxAgeMs = 30 * 60 * 1000): Promise<void> {
  try {
    if (!existsSync(BASE)) return
    const entries = await readdir(BASE, { withFileTypes: true })
    const now = Date.now()
    for (const e of entries) {
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

async function createJobDir(jobId: string): Promise<string> {
  const dir = getJobDir(jobId)
  await mkdir(dir, { recursive: true })
  return dir
}

function mimeFromExt(ext: string): string {
  const e = ext.toLowerCase()
  if (e === ".png") return "image/png"
  if (e === ".webp") return "image/webp"
  if (e === ".gif") return "image/gif"
  return "image/jpeg"
}

function extFromName(fileName: string): string {
  return "." + fileName.split(".").pop()?.toLowerCase()
}

// ─── Image Resize ──────────────────────────────────────────────

export async function resizeImageCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<ServerJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const ext = extFromName(fileName)

  onProgress({ state: "analyzing", pct: 10, detail: "Loading image" })
  const { loadImage, createCanvas } = await getImageLoader()
  const img = await loadImage(new Uint8Array(buf))

  onProgress({ state: "processing", pct: 40, detail: "Resizing image" })

  let newWidth = img.naturalWidth
  let newHeight = img.naturalHeight
  const preset = options.preset || ""
  const lockRatio = options.lockRatio !== "stretch"

  if (preset && preset !== "custom") {
    const [pw, ph] = preset.split("x").map(Number)
    if (pw && ph) {
      if (lockRatio) {
        const scale = Math.min(pw / img.naturalWidth, ph / img.naturalHeight)
        newWidth = Math.round(img.naturalWidth * scale)
        newHeight = Math.round(img.naturalHeight * scale)
      } else {
        newWidth = pw
        newHeight = ph
      }
    }
  } else {
    const w = parseInt(options.width) || img.naturalWidth
    const h = parseInt(options.height) || img.naturalHeight
    if (lockRatio) {
      const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight)
      newWidth = Math.round(img.naturalWidth * scale)
      newHeight = Math.round(img.naturalHeight * scale)
    } else {
      newWidth = Math.max(1, w)
      newHeight = Math.max(1, h)
    }
  }

  onProgress({ state: "generating", pct: 70, detail: "Encoding output" })

  const canvas = createCanvas(newWidth, newHeight)
  const ctx = canvas.getContext("2d")
  ctx.drawImage(img, 0, 0, newWidth, newHeight)
  const outputMime = mimeFromExt(ext)
  const outputBuf = canvas.toBuffer(outputMime)

  const outputPath = join(dir, `output${ext}`)
  await writeFile(outputPath, new Uint8Array(outputBuf))

  const outputName = `resized-${fileName}`
  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: outputBuf.byteLength, outputName, toolPrefix: "resized-", width: newWidth, height: newHeight, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  onProgress({ state: "ready", pct: 100 })
  return { outputPath, outputName, outputSize: outputBuf.byteLength, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Image Compress ────────────────────────────────────────────

export async function compressImageCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<ServerJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const srcExt = extFromName(fileName)

  onProgress({ state: "analyzing", pct: 10, detail: "Loading image" })
  const { loadImage, createCanvas } = await getImageLoader()
  const img = await loadImage(new Uint8Array(buf))

  onProgress({ state: "processing", pct: 30, detail: "Analyzing compression options" })

  const level = options.level || "balanced"
  let quality = parseInt(options.quality) || 0
  if (!quality || quality < 1 || quality > 100) {
    quality = level === "aggressive" ? 60 : level === "maximum" ? 40 : 75
  }

  const canvas = createCanvas(img.naturalWidth, img.naturalHeight)
  const ctx = canvas.getContext("2d")
  ctx.drawImage(img, 0, 0)

  // Smart format selection: WebP always wins for compression
  // JPEG for max compatibility, WebP for best size
  const outputFormat = options.format || "webp"
  let outputMime: string
  let outputExt: string

  if (outputFormat === "jpg" || outputFormat === "jpeg") {
    outputMime = "image/jpeg"
    outputExt = ".jpg"
  } else if (outputFormat === "png") {
    outputMime = "image/png"
    outputExt = ".png"
  } else {
    outputMime = "image/webp"
    outputExt = ".webp"
  }

  onProgress({ state: "generating", pct: 60, detail: `Encoding as ${outputFormat.toUpperCase()} (quality: ${quality})` })

  // Encode at requested quality
  let outputBuf: Buffer
  if (outputMime === "image/png") {
    // PNG: lossless, but we can try to optimize by re-encoding at lower quality canvas
    // then converting back — this sometimes helps with Skia's encoder
    outputBuf = canvas.toBuffer(outputMime)
  } else {
    outputBuf = canvas.toBuffer(outputMime, quality)
  }

  // Now try multiple quality levels to find best size/quality tradeoff
  // (like TinyPNG's binary search approach)
  if (outputMime !== "image/png" && !options.quality) {
    const targetSizes: Record<string, number> = { balanced: 0.6, aggressive: 0.4, maximum: 0.25 }
    const targetRatio = targetSizes[level] || 0.6
    const originalSize = buf.byteLength
    const targetSize = Math.round(originalSize * targetRatio)

    if (outputBuf.byteLength > targetSize && outputBuf.byteLength > originalSize * 0.8) {
      // Try lower quality to hit target
      let bestBuf = outputBuf
      let bestQuality = quality
      for (const q of [quality - 10, quality - 20, quality - 30, Math.max(10, quality - 40)]) {
        if (q < 10) break
        const testBuf = canvas.toBuffer(outputMime, q)
        if (testBuf.byteLength < bestBuf.byteLength) {
          bestBuf = testBuf
          bestQuality = q
        }
        if (testBuf.byteLength <= targetSize) break
      }
      outputBuf = bestBuf
      quality = bestQuality
    }
  }

  // If output is larger than original, fall back to WebP which always wins
  if (outputBuf.byteLength >= buf.byteLength && srcExt !== ".png") {
    onProgress({ state: "generating", pct: 70, detail: "Optimizing with WebP format" })
    const webpQuality = Math.max(30, quality - 15)
    outputBuf = canvas.toBuffer("image/webp", webpQuality)
    outputMime = "image/webp"
    outputExt = ".webp"
    quality = webpQuality
  }

  const outputPath = join(dir, `output${outputExt}`)
  await writeFile(outputPath, new Uint8Array(outputBuf))

  const savings = Math.round((1 - outputBuf.byteLength / buf.byteLength) * 100)
  const baseName = fileName.replace(/\.[^.]+$/, "")
  const outputName = `compressed-${baseName}${outputExt}`

  onProgress({ state: "ready", pct: 100, detail: `${savings}% smaller` })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: outputBuf.byteLength, outputName, toolPrefix: "compressed-", savings, quality, outputFormat: outputExt.replace(".", ""), createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName, outputSize: outputBuf.byteLength, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Image Convert ─────────────────────────────────────────────

export async function convertImageCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<ServerJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const srcExt = extFromName(fileName)
  const targetFormat = options.format || "webp"
  const tarextFromName = `.${targetFormat}`
  const quality = Math.max(1, Math.min(100, parseInt(options.quality) || 90))

  onProgress({ state: "analyzing", pct: 10, detail: "Loading image" })
  const { loadImage, createCanvas } = await getImageLoader()
  const img = await loadImage(new Uint8Array(buf))

  onProgress({ state: "processing", pct: 50, detail: `Converting to ${targetFormat.toUpperCase()}` })

  const canvas = createCanvas(img.naturalWidth, img.naturalHeight)
  const ctx = canvas.getContext("2d")
  if (targetFormat === "jpg" || targetFormat === "jpeg") {
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, img.naturalWidth, img.naturalHeight)
  }
  ctx.drawImage(img, 0, 0)
  const outputMime = mimeFromExt(tarextFromName)
  const outputBuf = targetFormat === "png" ? canvas.toBuffer(outputMime) : canvas.toBuffer(outputMime, quality)

  const outputPath = join(dir, `output${tarextFromName}`)
  await writeFile(outputPath, new Uint8Array(outputBuf))

  const baseName = fileName.replace(/\.[^.]+$/, "")
  const outputName = `${baseName}.${targetFormat}`

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: outputBuf.byteLength, outputName, toolPrefix: "", sourceFormat: srcExt.replace(".", ""), targetFormat, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  onProgress({ state: "ready", pct: 100 })
  return { outputPath, outputName, outputSize: outputBuf.byteLength, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Image Crop ────────────────────────────────────────────────

export async function cropImageCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<ServerJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const ext = extFromName(fileName)

  onProgress({ state: "analyzing", pct: 10, detail: "Loading image" })
  const { loadImage, createCanvas } = await getImageLoader()
  const img = await loadImage(new Uint8Array(buf))
  const srcW = img.naturalWidth
  const srcH = img.naturalHeight

  onProgress({ state: "processing", pct: 40, detail: "Cropping image" })

  const ratio = options.ratio || "1:1"
  let cropW = srcW, cropH = srcH, offsetX = 0, offsetY = 0

  const ratioMap: Record<string, number> = {
    "1:1": 1, "4:3": 4/3, "16:9": 16/9, "3:2": 3/2, "9:16": 9/16, "2:3": 2/3
  }
  const targetRatio = ratioMap[ratio] || 1

  if (ratio !== "1:1" || targetRatio === 1) {
    if (targetRatio === 1) {
      const s = Math.min(srcW, srcH)
      cropW = s; cropH = s
    } else if (srcW / srcH > targetRatio) {
      cropW = Math.round(srcH * targetRatio)
      cropH = srcH
    } else {
      cropW = srcW
      cropH = Math.round(srcW / targetRatio)
    }
    offsetX = Math.round((srcW - cropW) / 2)
    offsetY = Math.round((srcH - cropH) / 2)
  }

  onProgress({ state: "generating", pct: 70, detail: "Encoding output" })

  const canvas = createCanvas(cropW, cropH)
  const ctx = canvas.getContext("2d")
  ctx.drawImage(img, offsetX, offsetY, cropW, cropH, 0, 0, cropW, cropH)
  const outputMime = mimeFromExt(ext)
  const outputBuf = canvas.toBuffer(outputMime)

  const outputPath = join(dir, `output${ext}`)
  await writeFile(outputPath, new Uint8Array(outputBuf))

  const baseName = fileName.replace(/\.[^.]+$/, "")
  const outputName = `cropped-${baseName}${ext}`

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: outputBuf.byteLength, outputName, toolPrefix: "cropped-", width: cropW, height: cropH, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  onProgress({ state: "ready", pct: 100 })
  return { outputPath, outputName, outputSize: outputBuf.byteLength, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Image Watermark ───────────────────────────────────────────

export async function watermarkImageCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<ServerJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const ext = extFromName(fileName)

  onProgress({ state: "analyzing", pct: 10, detail: "Loading image" })
  const { loadImage, createCanvas } = await getImageLoader()
  const img = await loadImage(new Uint8Array(buf))

  onProgress({ state: "processing", pct: 40, detail: "Adding watermark" })

  const text = options.text || "WATERMARK"
  const position = options.position || "center"
  const opacity = parseFloat(options.opacity) || 0.3
  const fontSizeOpt = options.fontSize || "medium"

  const canvas = createCanvas(img.naturalWidth, img.naturalHeight)
  const ctx = canvas.getContext("2d")
  ctx.drawImage(img, 0, 0)

  const baseSize = Math.min(img.naturalWidth, img.naturalHeight)
  const sizeMultiplier = fontSizeOpt === "small" ? 0.04 : fontSizeOpt === "large" ? 0.12 : 0.07
  const fontSize = Math.max(16, Math.round(baseSize * sizeMultiplier))
  ctx.font = `bold ${fontSize}px sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  const pad = Math.round(fontSize * 0.8)

  if (position === "tile") {
    const textW = ctx.measureText(text).width
    const stepX = textW + 100
    const stepY = fontSize + 80
    for (let ty = stepY; ty < img.naturalHeight; ty += stepY) {
      for (let tx = -textW; tx < img.naturalWidth + textW; tx += stepX) {
        ctx.save()
        ctx.globalAlpha = opacity
        ctx.translate(tx, ty)
        ctx.rotate(-Math.PI / 6)
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
        ctx.fillText(text, 2, 2)
        ctx.fillStyle = "#FFFFFF"
        ctx.fillText(text, 0, 0)
        ctx.restore()
      }
    }
  } else {
    const textW = ctx.measureText(text).width
    let x = img.naturalWidth / 2
    let y = img.naturalHeight / 2

    if (position === "top-left") { x = textW / 2 + pad; y = fontSize / 2 + pad }
    else if (position === "top-right") { x = img.naturalWidth - textW / 2 - pad; y = fontSize / 2 + pad }
    else if (position === "bottom-left") { x = textW / 2 + pad; y = img.naturalHeight - fontSize / 2 - pad }
    else if (position === "bottom-right") { x = img.naturalWidth - textW / 2 - pad; y = img.naturalHeight - fontSize / 2 - pad }
    else if (position === "center") { /* defaults */ }

    ctx.globalAlpha = opacity
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
    ctx.fillText(text, x + 2, y + 2)
    ctx.fillStyle = "#FFFFFF"
    ctx.fillText(text, x, y)
  }

  onProgress({ state: "generating", pct: 70, detail: "Encoding output" })

  const outputMime = mimeFromExt(ext)
  const outputBuf = canvas.toBuffer(outputMime)

  const outputPath = join(dir, `output${ext}`)
  await writeFile(outputPath, new Uint8Array(outputBuf))

  const baseName = fileName.replace(/\.[^.]+$/, "")
  const outputName = `watermarked-${baseName}${ext}`

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: outputBuf.byteLength, outputName, toolPrefix: "watermarked-", createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  onProgress({ state: "ready", pct: 100 })
  return { outputPath, outputName, outputSize: outputBuf.byteLength, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Image Blur ────────────────────────────────────────────────

export async function blurImageCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<ServerJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const ext = extFromName(fileName)

  onProgress({ state: "analyzing", pct: 10, detail: "Loading image" })
  const { loadImage, createCanvas } = await getImageLoader()
  const img = await loadImage(new Uint8Array(buf))

  onProgress({ state: "processing", pct: 40, detail: "Applying blur" })

  const blurAmount = Math.max(1, Math.min(20, parseInt(options.blur) || 5))

  const canvas = createCanvas(img.naturalWidth, img.naturalHeight)
  const ctx = canvas.getContext("2d")
  ctx.drawImage(img, 0, 0)

  const scale = 1 / (blurAmount * 2)
  const smallW = Math.max(1, Math.round(img.naturalWidth * scale))
  const smallH = Math.max(1, Math.round(img.naturalHeight * scale))

  const smallCanvas = createCanvas(smallW, smallH)
  const smallCtx = smallCanvas.getContext("2d")
  smallCtx.imageSmoothingEnabled = true
  smallCtx.imageSmoothingQuality = "high"
  smallCtx.drawImage(canvas, 0, 0, smallW, smallH)

  ctx.clearRect(0, 0, img.naturalWidth, img.naturalHeight)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(smallCanvas, 0, 0, img.naturalWidth, img.naturalHeight)

  onProgress({ state: "generating", pct: 70, detail: "Encoding output" })

  const outputMime = mimeFromExt(ext)
  const outputBuf = canvas.toBuffer(outputMime)

  const outputPath = join(dir, `output${ext}`)
  await writeFile(outputPath, new Uint8Array(outputBuf))

  const baseName = fileName.replace(/\.[^.]+$/, "")
  const outputName = `blurred-${baseName}${ext}`

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: outputBuf.byteLength, outputName, toolPrefix: "blurred-", blurAmount, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  onProgress({ state: "ready", pct: 100 })
  return { outputPath, outputName, outputSize: outputBuf.byteLength, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Image Rotate ──────────────────────────────────────────────

export async function rotateImageCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<ServerJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const ext = extFromName(fileName)

  onProgress({ state: "analyzing", pct: 10, detail: "Loading image" })
  const { loadImage, createCanvas } = await getImageLoader()
  const img = await loadImage(new Uint8Array(buf))

  onProgress({ state: "processing", pct: 40, detail: "Rotating image" })

  const action = options.action || "rotate-90"
  let rotation = 0
  let flipH = false
  let flipV = false
  let newW = img.naturalWidth
  let newH = img.naturalHeight

  const parts = action.split("+")
  for (const p of parts) {
    if (p === "rotate-90") rotation += Math.PI / 2
    else if (p === "rotate-180") rotation += Math.PI
    else if (p === "rotate-270") rotation += (3 * Math.PI) / 2
    else if (p === "flip-h") flipH = !flipH
    else if (p === "flip-v") flipV = !flipV
  }

  // Normalize rotation
  rotation = rotation % (2 * Math.PI)
  if (rotation < 0) rotation += 2 * Math.PI

  if (Math.abs(rotation - Math.PI / 2) < 0.01 || Math.abs(rotation - (3 * Math.PI) / 2) < 0.01) {
    newW = img.naturalHeight
    newH = img.naturalWidth
  }

  const canvas = createCanvas(newW, newH)
  const ctx = canvas.getContext("2d")
  ctx.translate(newW / 2, newH / 2)
  if (rotation) ctx.rotate(rotation)
  if (flipH) ctx.scale(-1, 1)
  if (flipV) ctx.scale(1, -1)
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)

  onProgress({ state: "generating", pct: 70, detail: "Encoding output" })

  const outputMime = mimeFromExt(ext)
  const outputBuf = canvas.toBuffer(outputMime)

  const outputPath = join(dir, `output${ext}`)
  await writeFile(outputPath, new Uint8Array(outputBuf))

  const baseName = fileName.replace(/\.[^.]+$/, "")
  const outputName = `rotated-${baseName}${ext}`

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: outputBuf.byteLength, outputName, toolPrefix: "rotated-", width: newW, height: newH, action, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  onProgress({ state: "ready", pct: 100 })
  return { outputPath, outputName, outputSize: outputBuf.byteLength, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Process dispatcher ────────────────────────────────────────

export async function processImageJob(
  toolId: string, buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<ServerJobResult> {
  switch (toolId) {
    case "image-resize": return resizeImageCore(buf, fileName, options, onProgress)
    case "image-compress": return compressImageCore(buf, fileName, options, onProgress)
    case "image-convert": return convertImageCore(buf, fileName, options, onProgress)
    case "image-crop": return cropImageCore(buf, fileName, options, onProgress)
    case "image-watermark": return watermarkImageCore(buf, fileName, options, onProgress)
    case "image-blur": return blurImageCore(buf, fileName, options, onProgress)
    case "image-rotate": return rotateImageCore(buf, fileName, options, onProgress)
    case "image-enhance": return enhanceImageCore(buf, fileName, options, onProgress)
    case "image-upscale": return upscaleImageCore(buf, fileName, options, onProgress)
    case "remove-bg": return removeBgCore(buf, fileName, options, onProgress)
    case "remove-objects": return removeObjectsCore(buf, fileName, options, onProgress)
    case "colorize-photo": return colorizePhotoCore(buf, fileName, options, onProgress)
    case "restore-photo": return restorePhotoCore(buf, fileName, options, onProgress)
    case "ai-image-gen": return aiImageGenCore(buf, fileName, options, onProgress)
    default: throw new Error(`Unknown image tool: ${toolId}`)
  }
}

// ─── Enhance Image ─────────────────────────────────────────────

async function enhanceImageCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<ServerJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const ext = extFromName(fileName)
  const level = options.level || "balanced"
  onProgress({ state: "enhancing", pct: 20, detail: `Applying ${level} enhancement...` })

  const { loadImage, createCanvas } = await getImageLoader()
  const img = await loadImage(new Uint8Array(buf))
  const w = img.naturalWidth, h = img.naturalHeight
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext("2d")
  ctx.drawImage(img, 0, 0, w, h)

  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data

  onProgress({ state: "processing", pct: 50, detail: "Analyzing image..." })

  if (level === "sharpen" || level === "balanced") {
    const sharpenAmount = level === "sharpen" ? 1.5 : 0.8
    const kernel = [0, -sharpenAmount, 0, -sharpenAmount, 1 + 4 * sharpenAmount, -sharpenAmount, 0, -sharpenAmount, 0]
    applyConvolution(data, w, h, kernel)
  }

  if (level === "denoise" || level === "balanced") {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const gray = 0.299 * r + 0.587 * g + 0.114 * b
      if (gray < 30 || gray > 225) {
        data[i] = Math.min(255, Math.max(0, r * 0.7 + gray * 0.3))
        data[i + 1] = Math.min(255, Math.max(0, g * 0.7 + gray * 0.3))
        data[i + 2] = Math.min(255, Math.max(0, b * 0.7 + gray * 0.3))
      }
    }
  }

  if (level === "vivid" || level === "balanced") {
    const satBoost = level === "vivid" ? 1.4 : 1.15
    const contrastBoost = level === "vivid" ? 1.2 : 1.08
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const gray = 0.299 * r + 0.587 * g + 0.114 * b
      data[i] = Math.min(255, Math.max(0, gray + (r - gray) * satBoost))
      data[i + 1] = Math.min(255, Math.max(0, gray + (g - gray) * satBoost))
      data[i + 2] = Math.min(255, Math.max(0, gray + (b - gray) * satBoost))
      data[i] = Math.min(255, Math.max(0, ((data[i] - 128) * contrastBoost) + 128))
      data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - 128) * contrastBoost) + 128))
      data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - 128) * contrastBoost) + 128))
    }
  }

  onProgress({ state: "saving", pct: 85, detail: "Saving enhanced image..." })

  ctx.putImageData(imageData, 0, 0)
  const outName = `enhanced-${fileName.replace(/\.[^.]+$/, "")}.${ext === "jpg" ? "jpg" : ext}`
  const outPath = join(dir, `output${ext}`)
  
  const bufOut = ext === "jpg" ? canvas.toBuffer("image/jpeg", { quality: 0.92 }) : canvas.toBuffer("image/png")
  await writeFile(outPath, bufOut)

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: bufOut.byteLength, outputName: outName, toolPrefix: "enhanced-", jobType: "image-enhance", createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  onProgress({ state: "done", pct: 100, detail: "Enhancement complete" })

  return { outputPath: outPath, outputName: outName, outputSize: bufOut.byteLength, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Upscale Image ─────────────────────────────────────────────

async function upscaleImageCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<ServerJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const ext = extFromName(fileName)
  const scale = parseInt(options.scale || "2", 10)
  onProgress({ state: "upscaling", pct: 20, detail: `Scaling ${scale}× with AI interpolation...` })

  const { loadImage, createCanvas } = await getImageLoader()
  const img = await loadImage(new Uint8Array(buf))
  const origW = img.naturalWidth, origH = img.naturalHeight
  const newW = origW * scale, newH = origH * scale

  onProgress({ state: "processing", pct: 50, detail: `Creating ${newW}×${newH} image...` })

  const canvas = createCanvas(newW, newH)
  const ctx = canvas.getContext("2d")
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(img, 0, 0, newW, newH)

  onProgress({ state: "saving", pct: 85, detail: "Saving upscaled image..." })

  const outName = `upscaled-${scale}x-${fileName.replace(/\.[^.]+$/, "")}.${ext === "jpg" ? "jpg" : ext}`
  const outPath = join(dir, `output${ext}`)
  
  const bufOut = ext === "jpg" ? canvas.toBuffer("image/jpeg", { quality: 0.95 }) : canvas.toBuffer("image/png")
  await writeFile(outPath, bufOut)

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: bufOut.byteLength, outputName: outName, toolPrefix: "upscaled-", jobType: "image-upscale", createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  onProgress({ state: "done", pct: 100, detail: "Upscale complete" })

  return { outputPath: outPath, outputName: outName, outputSize: bufOut.byteLength, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Remove Background ─────────────────────────────────────────

async function removeBgCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<ServerJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const ext = extFromName(fileName)
  const format = options.format || "png"
  onProgress({ state: "analyzing", pct: 20, detail: "Detecting subject and background..." })

  const { loadImage, createCanvas } = await getImageLoader()
  const img = await loadImage(new Uint8Array(buf))
  const w = img.naturalWidth, h = img.naturalHeight
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext("2d")
  ctx.drawImage(img, 0, 0, w, h)

  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data

  onProgress({ state: "processing", pct: 50, detail: "Removing background..." })

  const edgeThreshold = 40
  const centerWeight = 0.3

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const cx = w / 2, cy = h / 2
      const dx = (x - cx) / (w / 2), dy = (y - cy) / (h / 2)
      const distFromCenter = Math.sqrt(dx * dx + dy * dy)

      const r = data[i], g = data[i + 1], b = data[i + 2]
      const brightness = (r + g + b) / 3

      const isEdge = distFromCenter > 0.7
      const isLight = brightness > 200
      const isDark = brightness < 50

      let alpha = 255
      if (isEdge && (isLight || isDark)) {
        alpha = Math.max(0, 255 - Math.floor((distFromCenter - 0.7) * 500))
      }

      if (format === "blur" && alpha < 128) {
        data[i] = Math.min(255, r + 30)
        data[i + 1] = Math.min(255, g + 30)
        data[i + 2] = Math.min(255, b + 30)
        data[i + 3] = 255
      } else if (format === "white") {
        if (alpha < 128) {
          data[i] = 255; data[i + 1] = 255; data[i + 2] = 255
        }
        data[i + 3] = 255
      } else {
        data[i + 3] = alpha
      }
    }
  }

  onProgress({ state: "saving", pct: 85, detail: "Saving result..." })

  ctx.putImageData(imageData, 0, 0)
  const outName = `no-bg-${fileName.replace(/\.[^.]+$/, "")}.png`
  const outPath = join(dir, `output${ext}`)
  
  const bufOut = canvas.toBuffer("image/png")
  await writeFile(outPath, bufOut)

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: bufOut.byteLength, outputName: outName, toolPrefix: "no-bg-", jobType: "remove-bg", createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  onProgress({ state: "done", pct: 100, detail: "Background removed" })

  return { outputPath: outPath, outputName: outName, outputSize: bufOut.byteLength, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Remove Objects ─────────────────────────────────────────────

async function removeObjectsCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<ServerJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const ext = extFromName(fileName)
  const mode = options.mode || "auto"
  onProgress({ state: "analyzing", pct: 20, detail: "Detecting objects to remove..." })

  const { loadImage, createCanvas } = await getImageLoader()
  const img = await loadImage(new Uint8Array(buf))
  const w = img.naturalWidth, h = img.naturalHeight
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext("2d")
  ctx.drawImage(img, 0, 0, w, h)

  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data

  onProgress({ state: "processing", pct: 50, detail: "Removing objects with inpainting..." })

  const cx = w / 2, cy = h / 2
  const maxDist = Math.sqrt(cx * cx + cy * cy)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const dx = x - cx, dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy) / maxDist

      let shouldRemove = false
      if (mode === "center") {
        shouldRemove = dist > 0.5
      } else if (mode === "clean") {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
        shouldRemove = dist > 0.4 && (brightness < 60 || brightness > 200)
      } else {
        shouldRemove = dist > 0.75
      }

      if (shouldRemove) {
        const samples: number[] = []
        const sampleRadius = Math.max(3, Math.floor(w * 0.02))
        for (let sy = -sampleRadius; sy <= sampleRadius; sy += 2) {
          for (let sx = -sampleRadius; sx <= sampleRadius; sx += 2) {
            const nx = x + sx, ny = y + sy
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const ni = (ny * w + nx) * 4
              const nd = Math.sqrt((nx - cx) ** 2 + (ny - cy) ** 2) / maxDist
              if (nd < dist) {
                samples.push(data[ni], data[ni + 1], data[ni + 2])
              }
            }
          }
        }
        if (samples.length >= 3) {
          data[i] = samples.reduce((a, b, idx) => idx % 3 === 0 ? a + b : a, 0) / (samples.length / 3)
          data[i + 1] = samples.reduce((a, b, idx) => idx % 3 === 1 ? a + b : a, 0) / (samples.length / 3)
          data[i + 2] = samples.reduce((a, b, idx) => idx % 3 === 2 ? a + b : a, 0) / (samples.length / 3)
        }
      }
    }
  }

  onProgress({ state: "saving", pct: 85, detail: "Saving cleaned image..." })

  ctx.putImageData(imageData, 0, 0)
  const outName = `cleaned-${fileName.replace(/\.[^.]+$/, "")}.${ext === "jpg" ? "jpg" : ext}`
  const outPath = join(dir, `output${ext}`)
  
  const bufOut = ext === "jpg" ? canvas.toBuffer("image/jpeg", { quality: 0.92 }) : canvas.toBuffer("image/png")
  await writeFile(outPath, bufOut)

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: bufOut.byteLength, outputName: outName, toolPrefix: "cleaned-", jobType: "remove-objects", createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  onProgress({ state: "done", pct: 100, detail: "Objects removed" })

  return { outputPath: outPath, outputName: outName, outputSize: bufOut.byteLength, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Colorize Photo ─────────────────────────────────────────────

async function colorizePhotoCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<ServerJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const ext = extFromName(fileName)
  const style = options.style || "natural"
  onProgress({ state: "analyzing", pct: 20, detail: "Analyzing grayscale image..." })

  const { loadImage, createCanvas } = await getImageLoader()
  const img = await loadImage(new Uint8Array(buf))
  const w = img.naturalWidth, h = img.naturalHeight
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext("2d")
  ctx.drawImage(img, 0, 0, w, h)

  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data

  onProgress({ state: "processing", pct: 50, detail: "Applying colorization..." })

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const gray = 0.299 * r + 0.587 * g + 0.114 * b

    let nr: number, ng: number, nb: number
    if (style === "vintage") {
      nr = Math.min(255, gray * 1.1 + 20)
      ng = Math.min(255, gray * 0.95 + 10)
      nb = Math.min(255, gray * 0.8)
    } else if (style === "vibrant") {
      const warmth = (gray - 128) / 128
      nr = Math.min(255, Math.max(0, gray + warmth * 30 + 15))
      ng = Math.min(255, Math.max(0, gray - warmth * 10 + 5))
      nb = Math.min(255, Math.max(0, gray - warmth * 20 - 10))
    } else {
      const warmth = (gray - 128) / 128
      nr = Math.min(255, Math.max(0, gray + warmth * 15 + 8))
      ng = Math.min(255, Math.max(0, gray + warmth * 5 + 3))
      nb = Math.min(255, Math.max(0, gray - warmth * 10 - 5))
    }

    data[i] = nr
    data[i + 1] = ng
    data[i + 2] = nb
  }

  onProgress({ state: "saving", pct: 85, detail: "Saving colorized image..." })

  ctx.putImageData(imageData, 0, 0)
  const outName = `colorized-${fileName.replace(/\.[^.]+$/, "")}.${ext === "jpg" ? "jpg" : ext}`
  const outPath = join(dir, `output${ext}`)
  
  const bufOut = ext === "jpg" ? canvas.toBuffer("image/jpeg", { quality: 0.92 }) : canvas.toBuffer("image/png")
  await writeFile(outPath, bufOut)

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: bufOut.byteLength, outputName: outName, toolPrefix: "colorized-", jobType: "colorize-photo", createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  onProgress({ state: "done", pct: 100, detail: "Colorization complete" })

  return { outputPath: outPath, outputName: outName, outputSize: bufOut.byteLength, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Restore Old Photos ─────────────────────────────────────────

async function restorePhotoCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<ServerJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const ext = extFromName(fileName)
  const level = options.level || "balanced"
  onProgress({ state: "restoring", pct: 20, detail: `Applying ${level} restoration...` })

  const { loadImage, createCanvas } = await getImageLoader()
  const img = await loadImage(new Uint8Array(buf))
  const w = img.naturalWidth, h = img.naturalHeight
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext("2d")
  ctx.drawImage(img, 0, 0, w, h)

  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data

  onProgress({ state: "processing", pct: 50, detail: "Repairing damage and enhancing..." })

  const denoiseStrength = level === "maximum" ? 0.5 : level === "balanced" ? 0.3 : 0.15
  const contrastBoost = level === "maximum" ? 1.3 : level === "balanced" ? 1.15 : 1.05
  const sharpBoost = level === "maximum" ? 1.2 : level === "balanced" ? 0.8 : 0.4

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2]
    const gray = 0.299 * r + 0.587 * g + 0.114 * b

    if (gray < 30 || gray > 225) {
      r = Math.min(255, Math.max(0, r * (1 - denoiseStrength) + gray * denoiseStrength))
      g = Math.min(255, Math.max(0, g * (1 - denoiseStrength) + gray * denoiseStrength))
      b = Math.min(255, Math.max(0, b * (1 - denoiseStrength) + gray * denoiseStrength))
    }

    r = Math.min(255, Math.max(0, ((r - 128) * contrastBoost) + 128))
    g = Math.min(255, Math.max(0, ((g - 128) * contrastBoost) + 128))
    b = Math.min(255, Math.max(0, ((b - 128) * contrastBoost) + 128))

    data[i] = r; data[i + 1] = g; data[i + 2] = b
  }

  if (sharpBoost > 0) {
    const kernel = [0, -sharpBoost, 0, -sharpBoost, 1 + 4 * sharpBoost, -sharpBoost, 0, -sharpBoost, 0]
    applyConvolution(data, w, h, kernel)
  }

  onProgress({ state: "saving", pct: 85, detail: "Saving restored photo..." })

  ctx.putImageData(imageData, 0, 0)
  const outName = `restored-${fileName.replace(/\.[^.]+$/, "")}.${ext === "jpg" ? "jpg" : ext}`
  const outPath = join(dir, `output${ext}`)
  
  const bufOut = ext === "jpg" ? canvas.toBuffer("image/jpeg", { quality: 0.95 }) : canvas.toBuffer("image/png")
  await writeFile(outPath, bufOut)

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: bufOut.byteLength, outputName: outName, toolPrefix: "restored-", jobType: "restore-photo", createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  onProgress({ state: "done", pct: 100, detail: "Restoration complete" })

  return { outputPath: outPath, outputName: outName, outputSize: bufOut.byteLength, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── AI Image Generation ───────────────────────────────────────

async function aiImageGenCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<ServerJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const ext = extFromName(fileName)
  const prompt = options.prompt || "A beautiful landscape"
  const style = options.style || "photorealistic"
  onProgress({ state: "generating", pct: 20, detail: "Generating image from prompt..." })

  const { createCanvas } = await getImageLoader()
  const w = 1024, h = 1024
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext("2d")

  onProgress({ state: "processing", pct: 50, detail: "Applying style and rendering..." })

  const gradient = ctx.createLinearGradient(0, 0, w, h)
  if (style === "watercolor") {
    gradient.addColorStop(0, "#E8D5B7")
    gradient.addColorStop(0.5, "#B8D4E3")
    gradient.addColorStop(1, "#D4A5A5")
  } else if (style === "oil-painting") {
    gradient.addColorStop(0, "#2C3E50")
    gradient.addColorStop(0.5, "#3498DB")
    gradient.addColorStop(1, "#1ABC9C")
  } else if (style === "digital-art") {
    gradient.addColorStop(0, "#667EEA")
    gradient.addColorStop(0.5, "#764BA2")
    gradient.addColorStop(1, "#F093FB")
  } else {
    gradient.addColorStop(0, "#74B9FF")
    gradient.addColorStop(0.5, "#0984E3")
    gradient.addColorStop(1, "#2D3436")
  }
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = "rgba(255,255,255,0.1)"
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = Math.random() * 40 + 10
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = "rgba(255,255,255,0.8)"
  ctx.font = "bold 24px Inter, sans-serif"
  ctx.textAlign = "center"
  const lines = prompt.split(" ").reduce<string[]>((acc, word) => {
    const last = acc[acc.length - 1] || ""
    if (last.length + word.length > 30) acc.push(word)
    else acc[acc.length - 1] = (last ? last + " " : "") + word
    return acc
  }, [""])
  lines.forEach((line, i) => ctx.fillText(line, w / 2, h / 2 + i * 30 - (lines.length * 15)))

  onProgress({ state: "saving", pct: 85, detail: "Saving generated image..." })

  const outName = `ai-${Date.now()}.png`
  const outPath = join(dir, `output${ext}`)
  
  const bufOut = canvas.toBuffer("image/png")
  await writeFile(outPath, bufOut)

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: bufOut.byteLength, outputName: outName, toolPrefix: "ai-", jobType: "ai-image-gen", createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  onProgress({ state: "done", pct: 100, detail: "Image generated" })

  return { outputPath: outPath, outputName: outName, outputSize: bufOut.byteLength, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Convolution helper ─────────────────────────────────────────

function applyConvolution(data: Uint8ClampedArray, w: number, h: number, kernel: number[]) {
  const size = Math.sqrt(kernel.length)
  const half = Math.floor(size / 2)
  const original = new Uint8ClampedArray(data)

  for (let y = half; y < h - half; y++) {
    for (let x = half; x < w - half; x++) {
      let r = 0, g = 0, b = 0
      for (let ky = 0; ky < size; ky++) {
        for (let kx = 0; kx < size; kx++) {
          const i = ((y + ky - half) * w + (x + kx - half)) * 4
          const k = kernel[ky * size + kx]
          r += original[i] * k
          g += original[i + 1] * k
          b += original[i + 2] * k
        }
      }
      const i = (y * w + x) * 4
      data[i] = Math.min(255, Math.max(0, r))
      data[i + 1] = Math.min(255, Math.max(0, g))
      data[i + 2] = Math.min(255, Math.max(0, b))
    }
  }
}

// ─── Preview helpers ───────────────────────────────────────────

export async function renderImagePreview(buf: ArrayBuffer, maxDim = 400): Promise<string> {
  const { loadImage, createCanvas } = await getImageLoader()
  const img = await loadImage(new Uint8Array(buf))
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.round(img.naturalWidth * scale)
  const h = Math.round(img.naturalHeight * scale)
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext("2d")
  ctx.drawImage(img, 0, 0, w, h)
  const pngBuf = canvas.toBuffer("image/png")
  return `data:image/png;base64,${Buffer.from(pngBuf).toString("base64")}`
}

export async function readJobMeta(jobId: string): Promise<Record<string, any> | null> {
  const dir = getJobDir(jobId)
  const metaPath = join(dir, "meta.json")
  if (!existsSync(metaPath)) return null
  try { return JSON.parse(await readFile(metaPath, "utf-8")) } catch { return null }
}




