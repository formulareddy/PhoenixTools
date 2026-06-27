"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Upload, FileText, Check, AlertTriangle, RefreshCw, Download, RotateCcw, Loader2, X, Search, BarChart3, Image as ImageIcon, Type, Layers, ChevronDown, Copy } from "lucide-react"
import { tools } from "@/lib/constants"
import type { ToolConfig, ProgressState, PDFAnalysis } from "./types"
import type { SSEProgress, SSEComplete } from "./job-client"
import { startJob } from "./job-client"
import { processTextTool, downloadText } from "./text-tools-handler"
import { stateLabel } from "./types"
import { useSubscription } from "@/contexts/subscription-context"
import { useAuth } from "@/contexts/auth-context"
import { validateAllFiles, getMaxFileSizeMB, formatFileSize } from "@/lib/file-limits"
import { useToolUsage } from "@/lib/tool-usage"
import { AdBanner } from "@/components/ui/ad-banner"
import { ToolAdBanner } from "@/components/ui/tool-ad-banner"

interface ToolWrapperProps {
  config: ToolConfig
}

const MAX_FILES: Record<string, number> = { "pdf-compare": 2, "pdf-merge": 20 }

export function ToolWrapper({ config }: ToolWrapperProps) {
  const { isPremium } = useSubscription()
  const { user } = useAuth()
  const { trackUsage, canUseTool, getCategoryUsage, validateWithServer } = useToolUsage()
  const [files, setFiles] = useState<File[]>([])
  const [options, setOptions] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    config.options.forEach((o) => { init[o.key] = o.defaultValue })
    return init
  })
  const [state, setState] = useState<ProgressState>("idle")
  const [progress, setProgress] = useState(0)
  const [detail, setDetail] = useState("")
  const [result, setResult] = useState<SSEComplete | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [usageWarning, setUsageWarning] = useState<string | null>(null)

  const [analysis, setAnalysis] = useState<PDFAnalysis | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [previewPage, setPreviewPage] = useState(0)
  const [videoMeta, setVideoMeta] = useState<{ duration: number; width: number; height: number; thumbnail: string } | null>(null)
  const [audioTracks, setAudioTracks] = useState<{ index: number; codec: string; language: string; channels: number; sampleRate: number; bitrate: number; title: string; isDefault: boolean }[]>([])
  const [selectedTracks, setSelectedTracks] = useState<number[]>([])
  const [probingTracks, setProbingTracks] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const isCompress = config.id === "pdf-compress"
  const isImageTool = config.id.startsWith("image-") || config.id === "remove-bg" || config.id === "image-watermark" || config.id === "image-blur" || config.id === "image-rotate" || config.id === "image-crop" || config.id === "image-upscale" || config.id === "remove-objects" || config.id === "colorize-photo" || config.id === "restore-photo"
  const isVideoTool = config.id.startsWith("video-") || config.id === "extract-audio" || config.id === "merge-video" || config.id === "resize-video" || config.id === "crop-video" || config.id === "add-audio-to-video" || config.id === "change-video-speed" || config.id === "mute-video" || config.id === "rotate-flip-video"
  const isAITool = config.id.startsWith("ai-")
  const isTextTool = ["word-counter", "text-diff", "unit-converter", "case-converter", "text-cleaner", "find-replace", "lorem-ipsum", "text-to-slug", "duplicate-remover", "text-sorter", "char-counter", "base64", "text-base64", "url-encoder", "dev-url-encoder", "json-formatter", "text-json-formatter", "dev-json-minifier", "text-json-minifier", "text-js-formatter", "dev-js-formatter", "text-js-minifier", "dev-js-minifier", "jwt-decoder", "dev-jwt-decoder", "regex-tester", "dev-regex-tester", "hash-generator", "dev-hash-generator", "dev-sql-formatter", "sql-formatter", "dev-css-formatter", "text-css-formatter", "css-minifier", "html-formatter", "seo-analyzer", "keyword-research", "meta-tag-generator", "serp-preview", "sitemap-generator", "robots-txt-generator", "keyword-density", "seo-title-generator", "seo-meta-desc", "redirect-checker", "google-index-checker", "backlink-checker", "invoice-generator", "receipt-generator", "quotation-generator", "purchase-order-generator", "business-proposal", "contract-generator", "profit-margin", "gst-vat-calculator", "salary-calculator", "business-name-generator", "qr-code-generator", "qr-generator", "utm-builder", "hashtag-generator", "social-caption", "email-subject", "cta-generator", "landing-page-headline", "ad-copy", "marketing-calendar", "youtube-title", "youtube-desc"].includes(config.id)
  const aiToolsNoFile = ["ai-writer", "ai-resume", "ai-chat", "ai-email", "ai-cover-letter", "ai-blog", "ai-social", "ai-code", "ai-translate", "ai-rewrite", "ai-paraphrase", "ai-image-gen"]
  const needsFileUpload = !aiToolsNoFile.includes(config.id) && !isTextTool
  const acceptLabel = config.accept.replace(/\./g, "").toUpperCase().replace(/,/g, ", ")
  const related = tools.filter((t) => t.category === (isImageTool ? "image" : isVideoTool ? "video" : isAITool ? "ai" : "text") && t.id !== config.id).slice(0, 4)

  const acceptedExts = config.accept.split(",").map((e) => e.trim().toLowerCase())

  useEffect(() => {
    if (!isVideoTool || files.length === 0) { setVideoMeta(null); return }
    const file = files[0]
    const video = document.createElement("video")
    video.preload = "metadata"
    video.onloadedmetadata = () => {
      const canvas = document.createElement("canvas")
      const maxW = 320
      canvas.width = Math.min(video.videoWidth, maxW)
      canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth))
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        setVideoMeta({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          thumbnail: canvas.toDataURL("image/jpeg", 0.7),
        })
      }
      URL.revokeObjectURL(video.src)
    }
    video.onerror = () => { URL.revokeObjectURL(video.src); setVideoMeta(null) }
    video.src = URL.createObjectURL(file)
    return () => { URL.revokeObjectURL(video.src) }
  }, [files, isVideoTool])

  useEffect(() => {
    if (config.id !== "audio-tracks" || files.length === 0) { setAudioTracks([]); setSelectedTracks([]); return }
    const file = files[0]
    setProbingTracks(true)
    const form = new FormData()
    form.append("file", file)
    fetch("/api/audio/probe", { method: "POST", body: form })
      .then(r => r.json())
      .then(data => {
        if (data.tracks) {
          setAudioTracks(data.tracks)
          setSelectedTracks(data.tracks.map((t: any) => t.index))
        }
      })
      .catch(() => { setAudioTracks([]); setSelectedTracks([]) })
      .finally(() => setProbingTracks(false))
  }, [files, config.id])

  const validateFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming)
    const maxF = MAX_FILES[config.id] || (config.multiple ? 20 : 1)
    if (arr.length > maxF) throw new Error(`Maximum ${maxF} files allowed`)

    // Premium-based file size limits: Free = 500 MB, Premium = 4 GB
    const effectiveMaxMB = isPremium ? 4096 : 500

    for (const f of arr) {
      const ext = "." + f.name.split(".").pop()?.toLowerCase()
      if (!acceptedExts.some((a) => ext === a || f.name.toLowerCase().endsWith(a))) {
        throw new Error(`"${f.name}" is not a supported file type (${config.accept})`)
      }
      if (f.size < 1024) throw new Error(`"${f.name}" is too small (min 1 KB)`)
      if (f.size > effectiveMaxMB * 1024 * 1024) {
        throw new Error(
          `"${f.name}" is ${formatFileSize(f.size)}. Maximum allowed is ${effectiveMaxMB} MB${isPremium ? "" : ". Upgrade to Premium for 4 GB limit"}.`
        )
      }
    }

    return arr
  }, [config, acceptedExts, isPremium])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const imageFiles = items
      .filter((item) => item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null)
    if (imageFiles.length > 0) {
      try { setFiles(validateFiles(imageFiles)) } catch (err: any) { setError(err.message) }
    }
  }, [validateFiles])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    try { setFiles(validateFiles(e.dataTransfer.files)) } catch (err: any) { setError(err.message) }
  }, [validateFiles])

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      try { setFiles(validateFiles(e.target.files)) } catch (err: any) { setError(err.message) }
    }
  }, [validateFiles])

  const removeFile = useCallback((i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i))
    setResult(null)
    setError(null)
    setState("idle")
    setAnalysis(null)
    setSessionId(null)
  }, [])

  const handleReset = useCallback(() => {
    setFiles([])
    setResult(null)
    setError(null)
    setState("idle")
    setProgress(0)
    setDetail("")
    setAnalysis(null)
    setSessionId(null)
    setPreviewPage(0)
    setOptions(() => {
      const init: Record<string, string> = {}
      config.options.forEach((o) => { init[o.key] = o.defaultValue })
      return init
    })
  }, [config])

  const doAnalyze = useCallback(async () => {
    if (!files.length) return
    setAnalyzing(true)
    setError(null)
    setDetail("Uploading for analysis")
    setProgress(10)

    try {
      const formData = new FormData()
      formData.set("file", files[0])

      const resp = await fetch("/api/pdf/analyze", { method: "POST", body: formData })

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({ error: "Analysis failed" }))
        throw new Error(body.error || "Analysis failed")
      }

      setProgress(60)
      setDetail("Reading PDF structure")

      const data = await resp.json()
      setAnalysis(data.analysis)
      setSessionId(data.sessionId)
      setProgress(100)
      setDetail("")
      setAnalyzing(false)
    } catch (err: any) {
      setError(err.message || "Analysis failed")
      setAnalyzing(false)
    }
  }, [files])

  const toolCategory = tools.find((t) => t.id === config.id)?.category || "pdf"

  const doProcess = useCallback(async () => {
    if (!isAITool && !isTextTool && !files.length) return

    // Track usage for free users — client-side + server-side validation
    if (!isPremium) {
      if (!canUseTool(toolCategory)) {
        const usage = getCategoryUsage(toolCategory)
        setError(`Daily limit reached for ${toolCategory} tools (${usage.limit}/${usage.limit}). Upgrade to Premium for unlimited access.`)
        return
      }

      // Server-side validation (tamper-resistant)
      if (user?.id) {
        const serverCheck = await validateWithServer(toolCategory, user.id)
        if (!serverCheck.allowed) {
          setError(serverCheck.error || "Daily limit reached. Upgrade to Premium for unlimited access.")
          return
        }
      }

      trackUsage(toolCategory)
    }

    // Handle text tools client-side
    if (isTextTool) {
      setState("processing")
      setProgress(50)
      setDetail("Processing locally in your browser...")
      setError(null)
      setResult(null)

      try {
        await new Promise(r => setTimeout(r, 300))
        const { content, filename, mimeType } = processTextTool(config.id, options)
        setProgress(100)
        setDetail("Complete!")

        let blob: Blob
        if (mimeType.startsWith("image/") && content.startsWith("data:")) {
          const response = await fetch(content)
          blob = await response.blob()
        } else {
          blob = new Blob([content], { type: mimeType })
        }
        const url = URL.createObjectURL(blob)

        setResult({
          downloadUrl: url,
          fileName: filename,
          size: blob.size,
          originalSize: 0,
          originalName: "",
          jobId: "local",
          pagePreviews: [content],
        })
        setState("ready")
      } catch (err: any) {
        setError(err.message || "Processing failed")
        setState("error")
      }
      return
    }

    setState("uploading")
    setProgress(0)
    setDetail(isAITool ? "Connecting to AI model..." : "Uploading to processing server")
    setError(null)
    setResult(null)

    try {
      abortRef.current = new AbortController()

      const processOptions = { ...options }
      if (config.id === "audio-tracks" && selectedTracks.length > 0) {
        processOptions.tracks = selectedTracks.join(",")
      }

      await startJob(config.id, files, processOptions, (evt) => {
        if (evt.type === "progress") {
          const p = evt.data as SSEProgress
          if (p.state === "ready") {
            setProgress(100)
            setDetail("")
          } else {
            setState(p.state as ProgressState)
            setProgress(p.pct)
            if (p.detail) setDetail(p.detail)
          }
        } else if (evt.type === "complete") {
          const c = evt.data as SSEComplete
          if (c.outputBase64) {
            try {
              const binary = atob(c.outputBase64)
              const bytes = new Uint8Array(binary.length)
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
              const ext = c.fileName.split(".").pop()?.toLowerCase() || ""
              const mimeMap: Record<string, string> = {
                pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
                webp: "image/webp", gif: "image/gif", bmp: "image/bmp",
                mp4: "video/mp4", webm: "video/webm", avi: "video/x-msvideo", mov: "video/quicktime",
                mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", flac: "audio/flac",
                docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                zip: "application/zip", txt: "text/plain", html: "text/html", json: "application/json",
              }
              const mime = mimeMap[ext] || "application/octet-stream"
              const blob = new Blob([bytes], { type: mime })
              c.downloadUrl = URL.createObjectURL(blob)
            } catch {}
          }
          setResult(c)
          setState("ready")
          setProgress(100)
          setDetail("")
        } else if (evt.type === "error") {
          setError(evt.data.error || "Processing failed")
          setState("error")
        }
      }, abortRef.current.signal, isCompress && sessionId ? sessionId : undefined)

    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Processing failed")
        setState("error")
      }
    }
  }, [files, options, config.id, isCompress, sessionId, isAITool, isTextTool, isPremium, canUseTool, trackUsage, getCategoryUsage, toolCategory, user?.id, validateWithServer])

  const handleRetry = useCallback(() => { doProcess() }, [doProcess])

  const isProcessing = [
    "uploading", "reading", "validating", "analyzing", "processing", "generating", "verifying",
    "trimming", "compressing", "converting", "extracting", "merging", "resizing", "cropping",
    "mixing", "adjusting", "muting", "transforming", "watermarking", "saving", "done",
    "denoising", "boosting", "cutting", "recording"
  ].includes(state)

  const showUpload = state === "idle" && !files.length && !analyzing && needsFileUpload
  const showFileInfo = isCompress && files.length > 0 && !analysis && !analyzing && state === "idle" && !result
  const showAnalyzing = analyzing
  const showAnalysis = !!analysis && state === "idle" && !result
  const showOptions = state === "idle" && !result && ((files.length > 0 && !analysis) || (!needsFileUpload && files.length === 0))
  const showProgress = isProcessing
  const showResult = state === "ready" && result
  const showError = state === "error"

  const savings = result && result.originalSize > 0 ? Math.round((1 - result.size / result.originalSize) * 100) : 0

  return (
    <div className="pt-20 sm:pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/tools" className="inline-flex items-center gap-1.5 text-[13px] text-[#BEB7AC] hover:text-[#F6F3EE] transition-colors mb-8 sm:mb-10">
          <ArrowLeft className="w-3 h-3" />
          All tools
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-serif text-[clamp(28px,5vw,48px)] text-[#F6F3EE] leading-[1.04] tracking-[-0.02em] mb-2">{config.name}</h1>
          <p className="text-[14px] sm:text-[15px] text-[#BEB7AC] max-w-xl">{config.description}</p>
          <div className="flex flex-wrap gap-3 mt-4 text-[12px] text-[#BEB7AC]">
            <span className="px-2.5 py-1 rounded-lg border border-[rgba(255,255,255,0.06)]">{isAITool ? "AI-Powered" : isTextTool ? "Client-Side" : isVideoTool ? "Video files" : isImageTool ? "Image files" : "PDF only"}</span>
            <span className="px-2.5 py-1 rounded-lg border border-[rgba(255,255,255,0.06)]">{isAITool ? "Free AI Models" : isTextTool ? "Instant Results" : `Max ${isPremium ? "4 GB" : "500 MB"}`}</span>
            <span className="px-2.5 py-1 rounded-lg border border-[rgba(255,255,255,0.06)]">{isAITool ? "Streaming Response" : isTextTool ? "No Upload Needed" : isVideoTool ? "FFmpeg server processing" : isImageTool ? "Fast server processing" : "Server Processing"}</span>
          </div>
        </motion.div>

        {/* TOP AD — free users see ad right after tool description */}
        <ToolAdBanner variant="top" />

        {config.howItWorks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-8 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-5 sm:p-6">
            <h2 className="text-[13px] font-medium text-[#BEB7AC] uppercase tracking-[0.15em] mb-3">How it works</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {config.howItWorks.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[#D97757]/10 flex items-center justify-center text-[11px] text-[#D97757] font-medium">{i + 1}</span>
                  <p className="text-[13px] text-[#BEB7AC] leading-snug">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {showUpload && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div
              onDragEnter={() => setDragOver(true)}
              onDragLeave={() => setDragOver(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onPaste={handlePaste}
              onClick={() => inputRef.current?.click()}
              className={`border border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all ${
                dragOver ? "border-[#D97757]/40 bg-[#D97757]/[0.03]" : "border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)]"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center mx-auto mb-4">
                <Upload className="w-5 h-5 text-[#BEB7AC]" />
              </div>
              <h3 className="text-[15px] font-medium text-[#F6F3EE] mb-2">
                {isAITool ? "Drop your file here" : config.multiple ? `Drop ${acceptLabel} files here` : `Drop your ${acceptLabel} here`}
              </h3>
              <p className="text-[13px] text-[#BEB7AC] mb-2">or <span className="text-[#D97757]">browse files</span>{isImageTool ? " or paste from clipboard" : ""}</p>
              <p className="text-[11px] text-[#BEB7AC]/50">{isAITool ? "Text files only" : acceptLabel} only &middot; Max {config.maxFileSize} MB{config.multiple ? ` · Up to ${MAX_FILES[config.id] || 20} files` : ""}</p>
              <input ref={inputRef} type="file" accept={config.accept} multiple={config.multiple} onChange={handleSelect} className="hidden" />
            </div>
          </motion.div>
        )}

        {showFileInfo && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
            {files.map((f, i) => (
              <div key={i} className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {isImageTool ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-[rgba(255,255,255,0.02)] shrink-0">
                      <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                    </div>
                  ) : isVideoTool && videoMeta?.thumbnail ? (
                    <div className="w-16 h-10 rounded-lg overflow-hidden bg-[rgba(255,255,255,0.02)] shrink-0 relative">
                      <img src={videoMeta.thumbnail} alt={f.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <FileText className="w-4 h-4 text-[#D97757] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[14px] text-[#F6F3EE] truncate">{f.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[12px] text-[#BEB7AC]">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                      {isVideoTool && videoMeta && (
                        <>
                          <span className="text-[10px] text-[#BEB7AC]/30">·</span>
                          <p className="text-[12px] text-[#BEB7AC]">{videoMeta.width}×{videoMeta.height}</p>
                          <span className="text-[10px] text-[#BEB7AC]/30">·</span>
                          <p className="text-[12px] text-[#BEB7AC]">{Math.floor(videoMeta.duration / 60)}:{String(Math.floor(videoMeta.duration % 60)).padStart(2, "0")}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => removeFile(i)} className="p-1 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors">
                  <X className="w-3.5 h-3.5 text-[#BEB7AC]" />
                </button>
              </div>
            ))}

            {isCompress && (
              <button onClick={doAnalyze} disabled={analyzing}
                className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[#D97757] text-[#0F0E0A] text-[13px] font-medium hover:bg-[#D97757]/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 justify-center">
                <Search className="w-4 h-4" /> Analyze PDF
              </button>
            )}
          </motion.div>
        )}

        {showAnalyzing && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-4 h-4 text-[#D97757] animate-spin" />
                <div>
                  <span className="text-[14px] font-medium text-[#F6F3EE]">Analyzing PDF</span>
                  {detail && <p className="text-[12px] text-[#BEB7AC] mt-0.5">{detail}</p>}
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%`, background: "linear-gradient(90deg, #D97757, #F59E0B)" }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* MIDDLE AD — free users see ad between analysis and process button */}
        <ToolAdBanner variant="middle" />

        {showAnalysis && analysis && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-4 h-4 text-[#10B981]" />
                <span className="text-[14px] font-medium text-[#F6F3EE]">Ready to compress</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-3 text-center">
                  <Layers className="w-4 h-4 text-[#D97757] mx-auto mb-1" />
                  <p className="text-[11px] text-[#BEB7AC]">Pages</p>
                  <p className="text-[18px] text-[#F6F3EE] font-medium">{analysis.pages}</p>
                </div>
                <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-3 text-center">
                  <ImageIcon className="w-4 h-4 text-[#D97757] mx-auto mb-1" />
                  <p className="text-[11px] text-[#BEB7AC]">Images</p>
                  <p className="text-[18px] text-[#F6F3EE] font-medium">{analysis.images}</p>
                </div>
                <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-3 text-center">
                  <Type className="w-4 h-4 text-[#D97757] mx-auto mb-1" />
                  <p className="text-[11px] text-[#BEB7AC]">Fonts</p>
                  <p className="text-[18px] text-[#F6F3EE] font-medium">{analysis.fonts}</p>
                </div>
                <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-3 text-center">
                  <BarChart3 className="w-4 h-4 text-[#D97757] mx-auto mb-1" />
                  <p className="text-[11px] text-[#BEB7AC]">Objects</p>
                  <p className="text-[18px] text-[#F6F3EE] font-medium">{analysis.objects}</p>
                </div>
              </div>

              <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-4 mb-4">
                <p className="text-[11px] text-[#BEB7AC] mb-2">Estimated output size</p>
                <div className="space-y-2">
                  {[
                    { label: "Balanced", value: "balanced", desc: "Good quality, medium reduction", est: analysis.estimatedSizes.balanced },
                    { label: "Strong", value: "strong", desc: "High reduction, slight quality loss", est: analysis.estimatedSizes.strong },
                    { label: "Maximum", value: "maximum", desc: "Aggressive reduction", est: analysis.estimatedSizes.maximum },
                  ].map((lvl) => (
                    <button key={lvl.value} onClick={() => setOptions((o) => ({ ...o, level: lvl.value }))}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                        options.level === lvl.value
                          ? "bg-[#D97757]/10 border border-[#D97757]/30"
                          : "bg-[rgba(255,255,255,0.02)] border border-transparent hover:bg-[rgba(255,255,255,0.04)]"
                      }`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                            options.level === lvl.value ? "border-[#D97757] bg-[#D97757]" : "border-[#BEB7AC]/30"
                          }`}>
                            {options.level === lvl.value && <span className="w-1.5 h-1.5 rounded-full bg-[#0F0E0A]" />}
                          </span>
                          <span className="text-[13px] text-[#F6F3EE] font-medium">{lvl.label}</span>
                        </div>
                        <p className="text-[11px] text-[#BEB7AC] mt-0.5 ml-5">{lvl.desc}</p>
                      </div>
                      <span className="text-[12px] text-[#10B981] font-mono">{lvl.est}</span>
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-[#BEB7AC]/50 mb-4">Original size: {(analysis.originalSize / 1024 / 1024).toFixed(1)} MB</p>

              <button onClick={doProcess} disabled={isProcessing}
                className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[#D97757] text-[#0F0E0A] text-[13px] font-medium hover:bg-[#D97757]/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                Compress PDF
              </button>
            </div>
          </motion.div>
        )}

        {showOptions && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
            {files.map((f, i) => (
              <div key={i} className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {isImageTool ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-[rgba(255,255,255,0.02)] shrink-0">
                      <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <FileText className="w-4 h-4 text-[#D97757] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[14px] text-[#F6F3EE] truncate">{f.name}</p>
                    <p className="text-[12px] text-[#BEB7AC]">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </div>
                <button onClick={() => removeFile(i)} className="p-1 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors">
                  <X className="w-3.5 h-3.5 text-[#BEB7AC]" />
                </button>
              </div>
            ))}

            {config.id === "audio-tracks" && (
              <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-[#D97757]" />
                  <span className="text-[13px] font-medium text-[#F6F3EE]">Detected Audio Tracks</span>
                </div>
                {probingTracks ? (
                  <div className="flex items-center gap-3 py-4">
                    <Loader2 className="w-4 h-4 text-[#D97757] animate-spin" />
                    <span className="text-[12px] text-[#BEB7AC]">Scanning audio streams...</span>
                  </div>
                ) : audioTracks.length === 0 ? (
                  <p className="text-[12px] text-[#BEB7AC]/60 py-2">No audio tracks detected in this file.</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-[#BEB7AC]/50 mb-2">{audioTracks.length} audio track{audioTracks.length > 1 ? "s" : ""} found — select which to extract:</p>
                    {audioTracks.map((track) => {
                      const langLabel = track.language !== "und" ? track.language.toUpperCase() : `Track ${track.index + 1}`
                      const isSelected = selectedTracks.includes(track.index)
                      return (
                        <button key={track.index} onClick={() => {
                          setSelectedTracks(prev => isSelected ? prev.filter(i => i !== track.index) : [...prev, track.index])
                        }}
                          className={`w-full px-3 py-2.5 rounded-lg text-left transition-all flex items-center gap-3 ${
                            isSelected
                              ? "bg-[#D97757]/10 border border-[#D97757]/30"
                              : "border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"
                          }`}>
                          <div className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            isSelected ? "border-[#D97757] bg-[#D97757]" : "border-[#BEB7AC]/30"
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-[#0F0E0A]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-medium text-[#F6F3EE]">{langLabel}</span>
                              {track.isDefault && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#D97757]/15 text-[#D97757]">DEFAULT</span>}
                            </div>
                            <p className="text-[11px] text-[#BEB7AC]">
                              {track.codec.toUpperCase()} &middot; {track.channels}ch &middot; {track.sampleRate >= 44100 ? `${(track.sampleRate / 1000).toFixed(1)}kHz` : track.sampleRate + "Hz"}
                              {track.bitrate > 0 ? ` &middot; ${Math.round(track.bitrate / 1000)}kbps` : ""}
                              {track.title ? ` &middot; ${track.title}` : ""}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {config.options.map((opt) => (
              <div key={opt.key} className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-4">
                <label className="text-[12px] text-[#BEB7AC] mb-2 block">{opt.label}</label>
                {opt.type === "radio" && opt.choices && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {opt.choices.map((c) => (
                      <button key={c.value} onClick={() => setOptions((o) => ({ ...o, [opt.key]: c.value }))}
                        className={`px-4 py-3 rounded-xl text-left transition-all ${
                          options[opt.key] === c.value
                            ? "bg-[#D97757]/15 border border-[#D97757]/40 shadow-[0_0_12px_rgba(217,119,87,0.1)]"
                            : "border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.02)]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                            options[opt.key] === c.value ? "border-[#D97757] bg-[#D97757]" : "border-[#BEB7AC]/30"
                          }`}>
                            {options[opt.key] === c.value && <span className="w-1.5 h-1.5 rounded-full bg-[#0F0E0A]" />}
                          </span>
                          <span className={`text-[13px] font-medium ${options[opt.key] === c.value ? "text-[#F6F3EE]" : "text-[#BEB7AC]"}`}>{c.label}</span>
                        </div>
                        {c.description && (
                          <p className={`text-[11px] mt-1 ml-6.5 leading-relaxed ${options[opt.key] === c.value ? "text-[#BEB7AC]" : "text-[#BEB7AC]/60"}`}>
                            {c.description}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {(opt.type === "text" || opt.type === "password") && (
                  <input type={opt.type} value={options[opt.key] || ""} onChange={(e) => setOptions((o) => ({ ...o, [opt.key]: e.target.value }))}
                    placeholder={opt.placeholder}
                    className="w-full h-10 px-3 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-[13px] text-[#F6F3EE] outline-none focus:border-[rgba(255,255,255,0.12)] placeholder:text-[#BEB7AC]/30"
                  />
                )}
                {opt.type === "textarea" && (
                  <textarea value={options[opt.key] || ""} onChange={(e) => setOptions((o) => ({ ...o, [opt.key]: e.target.value }))}
                    placeholder={opt.placeholder}
                    rows={6}
                    className="w-full px-3 py-2.5 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-[13px] text-[#F6F3EE] outline-none focus:border-[rgba(255,255,255,0.12)] placeholder:text-[#BEB7AC]/30 resize-y font-mono"
                  />
                )}
                {opt.type === "time" && (() => {
                  const val = options[opt.key] || "0:0:0"
                  const parts = val.split(":").map(Number)
                  const h = parts[0] || 0
                  const m = parts[1] || 0
                  const s = parts[2] || 0
                  const update = (nh: number, nm: number, ns: number) => setOptions((o) => ({ ...o, [opt.key]: `${nh}:${nm}:${ns}` }))
                  return (
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <input type="number" min={0} max={23} value={h} onChange={(e) => update(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)), m, s)}
                          className="w-full h-10 px-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-[13px] text-center text-[#F6F3EE] outline-none focus:border-[rgba(255,255,255,0.12)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                        <p className="text-[10px] text-[#BEB7AC]/50 text-center mt-1">Hours</p>
                      </div>
                      <span className="text-[16px] text-[#BEB7AC]/40 font-mono mt-[-14px]">:</span>
                      <div className="flex-1">
                        <input type="number" min={0} max={59} value={m} onChange={(e) => update(h, Math.min(59, Math.max(0, parseInt(e.target.value) || 0)), s)}
                          className="w-full h-10 px-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-[13px] text-center text-[#F6F3EE] outline-none focus:border-[rgba(255,255,255,0.12)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                        <p className="text-[10px] text-[#BEB7AC]/50 text-center mt-1">Minutes</p>
                      </div>
                      <span className="text-[16px] text-[#BEB7AC]/40 font-mono mt-[-14px]">:</span>
                      <div className="flex-1">
                        <input type="number" min={0} max={59} value={s} onChange={(e) => update(h, m, Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-full h-10 px-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-[13px] text-center text-[#F6F3EE] outline-none focus:border-[rgba(255,255,255,0.12)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                        <p className="text-[10px] text-[#BEB7AC]/50 text-center mt-1">Seconds</p>
                      </div>
                    </div>
                  )
                })()}
                {opt.type === "select" && opt.choices && (
                  <div className="relative">
                    <select value={options[opt.key] || ""} onChange={(e) => setOptions((o) => ({ ...o, [opt.key]: e.target.value }))}
                      className="w-full h-10 px-3 pr-8 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-[13px] text-[#F6F3EE] outline-none focus:border-[rgba(255,255,255,0.12)] appearance-none cursor-pointer"
                      style={{ color: "#F6F3EE", backgroundColor: "rgba(255,255,255,0.02)" }}
                    >
                      {opt.choices.map((c) => (
                        <option key={c.value} value={c.value} style={{ backgroundColor: "#1D1C17", color: "#F6F3EE" }}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-[#BEB7AC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                )}
                {opt.hint && <p className="text-[11px] text-[#BEB7AC]/50 mt-1.5">{opt.hint}</p>}
              </div>
            ))}

            <button onClick={doProcess} disabled={isProcessing || (["pdf-merge", "pdf-compare"].includes(config.id) && files.length < 2)}
              className={`w-full sm:w-auto h-11 px-6 rounded-xl text-[13px] font-medium active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                isAITool 
                  ? "bg-[#6366F1] text-white hover:bg-[#6366F1]/90 shadow-[0_0_20px_rgba(99,102,241,0.3)]" 
                  : isTextTool
                    ? "bg-[#10B981] text-white hover:bg-[#10B981]/90 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    : "bg-[#D97757] text-[#0F0E0A] hover:bg-[#D97757]/90"
              }`}>
              {config.id === "pdf-compare" ? "Compare" : config.id === "pdf-merge" ? "Merge" : isAITool ? "✨ Generate" : isTextTool ? "⚡ Process" : "Process"}
            </button>
          </motion.div>
        )}

        {showProgress && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Loader2 className={`w-4 h-4 ${isAITool ? "text-[#6366F1]" : "text-[#D97757]"} animate-spin`} />
                  <div>
                    <span className="text-[14px] font-medium text-[#F6F3EE]">{stateLabel(state)}</span>
                    {detail && <p className="text-[12px] text-[#BEB7AC] mt-0.5">{detail}</p>}
                  </div>
                </div>
                <span className="text-[12px] text-[#BEB7AC]/50">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%`, background: isAITool ? "linear-gradient(90deg, #6366F1, #8B5CF6)" : isTextTool ? "linear-gradient(90deg, #10B981, #34D399)" : "linear-gradient(90deg, #D97757, #F59E0B)" }} />
              </div>

              {isTextTool ? (
                <div className="flex items-center justify-between mt-3">
                  {[
                    { key: "processing", label: "Process" },
                    { key: "generating", label: "Generate" },
                    { key: "ready", label: "Done" },
                  ].map((step, i, arr) => {
                    const stateOrder = ["processing", "generating", "ready"]
                    const currentIdx = stateOrder.indexOf(state)
                    const stepIdx = stateOrder.indexOf(step.key)
                    const isActive = currentIdx >= stepIdx
                    const isCurrent = state === step.key
                    return (
                      <div key={step.key} className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium transition-all ${
                          isActive ? "bg-[#10B981] text-white" : "bg-[rgba(255,255,255,0.04)] text-[#BEB7AC]/40"
                        }`}>
                          {isActive && !isCurrent ? <Check className="w-3 h-3" /> : i + 1}
                        </div>
                        <span className={`text-[11px] hidden sm:inline ${isActive ? "text-[#F6F3EE]" : "text-[#BEB7AC]/40"}`}>{step.label}</span>
                        {i < arr.length - 1 && <div className={`w-6 h-px mx-1 ${isActive ? "bg-[#10B981]/30" : "bg-[rgba(255,255,255,0.04)]"}`} />}
                      </div>
                    )
                  })}
                </div>
              ) : isVideoTool ? (
                <div className="flex items-center justify-between mt-3">
                  {[
                    { key: "uploading", label: "Upload" },
                    { key: "analyzing", label: "Analyze" },
                    { key: "processing", label: "Encode" },
                    { key: "saving", label: "Save" },
                    { key: "done", label: "Done" },
                  ].map((step, i, arr) => {
                    const stateOrder = ["uploading", "analyzing", "trimming", "compressing", "converting", "generating", "extracting", "merging", "resizing", "cropping", "mixing", "adjusting", "muting", "transforming", "watermarking", "processing", "saving", "done"]
                    const currentIdx = stateOrder.indexOf(state)
                    const stepIdx = stateOrder.indexOf(step.key)
                    const isActive = currentIdx >= stepIdx
                    const isCurrent = state === step.key
                    return (
                      <div key={step.key} className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium transition-all ${
                          isActive ? "bg-[#D97757] text-[#0F0E0A]" : "bg-[rgba(255,255,255,0.04)] text-[#BEB7AC]/40"
                        }`}>
                          {isActive && !isCurrent ? <Check className="w-3 h-3" /> : i + 1}
                        </div>
                        <span className={`text-[11px] hidden sm:inline ${isActive ? "text-[#F6F3EE]" : "text-[#BEB7AC]/40"}`}>{step.label}</span>
                        {i < arr.length - 1 && <div className={`w-6 h-px mx-1 ${isActive ? "bg-[#D97757]/30" : "bg-[rgba(255,255,255,0.04)]"}`} />}
                      </div>
                    )
                  })}
                </div>
              ) : isAITool ? (
                <div className="flex items-center justify-between mt-3">
                  {[
                    { key: "uploading", label: "Connect" },
                    { key: "analyzing", label: "Analyze" },
                    { key: "generating", label: "Generate" },
                    { key: "saving", label: "Save" },
                    { key: "done", label: "Done" },
                  ].map((step, i, arr) => {
                    const stateOrder = ["uploading", "analyzing", "generating", "saving", "done"]
                    const currentIdx = stateOrder.indexOf(state)
                    const stepIdx = stateOrder.indexOf(step.key)
                    const isActive = currentIdx >= stepIdx
                    const isCurrent = state === step.key
                    return (
                      <div key={step.key} className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium transition-all ${
                          isActive ? "bg-[#6366F1] text-white" : "bg-[rgba(255,255,255,0.04)] text-[#BEB7AC]/40"
                        }`}>
                          {isActive && !isCurrent ? <Check className="w-3 h-3" /> : i + 1}
                        </div>
                        <span className={`text-[11px] hidden sm:inline ${isActive ? "text-[#F6F3EE]" : "text-[#BEB7AC]/40"}`}>{step.label}</span>
                        {i < arr.length - 1 && <div className={`w-6 h-px mx-1 ${isActive ? "bg-[#6366F1]/30" : "bg-[rgba(255,255,255,0.04)]"}`} />}
                      </div>
                    )
                  })}
                </div>
              ) : isImageTool ? (
                <div className="flex items-center justify-between mt-3">
                  {[
                    { key: "uploading", label: "Upload" },
                    { key: "processing", label: "Process" },
                    { key: "generating", label: "Optimize" },
                    { key: "ready", label: "Done" },
                  ].map((step, i, arr) => {
                    const stateOrder = ["uploading", "reading", "validating", "analyzing", "processing", "generating", "verifying", "ready"]
                    const currentIdx = stateOrder.indexOf(state)
                    const stepIdx = stateOrder.indexOf(step.key)
                    const isActive = currentIdx >= stepIdx
                    const isCurrent = state === step.key
                    return (
                      <div key={step.key} className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium transition-all ${
                          isActive ? "bg-[#D97757] text-[#0F0E0A]" : "bg-[rgba(255,255,255,0.04)] text-[#BEB7AC]/40"
                        }`}>
                          {isActive && !isCurrent ? <Check className="w-3 h-3" /> : i + 1}
                        </div>
                        <span className={`text-[11px] hidden sm:inline ${isActive ? "text-[#F6F3EE]" : "text-[#BEB7AC]/40"}`}>{step.label}</span>
                        {i < arr.length - 1 && <div className={`w-6 h-px mx-1 ${isActive ? "bg-[#D97757]/30" : "bg-[rgba(255,255,255,0.04)]"}`} />}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex justify-between mt-2 text-[10px] text-[#BEB7AC]/40">
                  {["reading", "analyzing", "processing", "generating", "verifying"].map((s) => (
                    <span key={s} className={state === s ? "text-[#D97757]/80" : ""}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {showResult && result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[rgba(255,255,255,0.04)]">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isAITool ? "bg-[#6366F1]/10" : "bg-[#10B981]/10"
                }`}>
                  <Check className={`w-4 h-4 ${isAITool ? "text-[#6366F1]" : "text-[#10B981]"}`} />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-[#F6F3EE]">
                    {isAITool
                      ? "AI Generation Complete"
                      : isVideoTool
                        ? `${config.name.replace("Video", "").replace("& Flip Video", "").trim()} Complete`
                        : isImageTool
                          ? `${config.name.replace("Image", "").trim()} Complete`
                          : isCompress && result.isOptimized ? "No compression possible" : isCompress ? "Compression Complete" : config.id === "pdf-extract-pages" ? "Pages Extracted" : config.id === "pdf-organize" ? "Pages Reorganized" : config.id === "pdf-to-text" ? "Text Extracted" : config.id === "pdf-sign" ? "Document Signed" : config.id === "pdf-repair" ? "PDF Repaired" : config.id === "pdf-redact" ? "Content Redacted" : config.id === "pdf-crop" ? "Pages Cropped" : config.id === "pdf-metadata" ? "Metadata Updated" : config.id === "pdf-compare" ? "Comparison Complete" : "Ready"}
                  </p>
                  <p className="text-[12px] text-[#BEB7AC]">
                    {isAITool
                      ? `Generated with AI — ${(result.size / 1024).toFixed(0)} KB ready to download`
                      : isVideoTool
                        ? `Real FFmpeg processing — ${(result.size / 1024 / 1024).toFixed(1)} MB ready to download`
                        : isImageTool
                          ? `Processed and verified — ${(result.size / 1024).toFixed(0)} KB ready to download`
                          : isCompress && result.isOptimized
                            ? "This file is already using efficient compression"
                            : isCompress
                              ? `Reduced by ${result.compressSavings || savings}% — verified and ready to download`
                              : config.id === "pdf-extract-pages"
                                ? `${result.mergeTotalPages || 0} pages extracted — ready to download`
                                : config.id === "pdf-organize"
                                  ? `${result.mergeTotalPages || 0} pages reorganized — ready to download`
                                  : config.id === "pdf-to-text"
                                    ? `Text extracted from ${result.mergeTotalPages || 0} pages — UTF-8 plain text`
                                    : config.id === "pdf-sign"
                                      ? `Signature "${options.name || "Signature"}" placed — ${result.mergeTotalPages || 0} pages`
                                      : config.id === "pdf-repair"
                                        ? `PDF rebuilt — ${result.mergeTotalPages || 0} pages recovered`
                                        : config.id === "pdf-redact"
                                          ? `Content redacted — ${result.mergeTotalPages || 0} pages`
                                          : config.id === "pdf-crop"
                                            ? `Pages cropped by ${options.margin || "20"}pt — ${result.mergeTotalPages || 0} pages`
                                            : config.id === "pdf-metadata"
                                              ? (result.metadataSummary ? "Existing metadata: " + result.metadataSummary.split("\n")[0].replace("Original Title: ", "") : "Metadata updated")
                                              : config.id === "pdf-compare"
                                                ? "Comparison report generated — download to view full details"
                                                : "File processed on server — verified and ready to download"
                    }
                  </p>
                </div>
              </div>

              {isVideoTool && result.originalSize > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-3 text-center">
                    <p className="text-[11px] text-[#BEB7AC]">Original</p>
                    <p className="text-[15px] text-[#F6F3EE] font-medium">{(result.originalSize / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-3 text-center">
                    <p className="text-[11px] text-[#BEB7AC]">Processed</p>
                    <p className="text-[15px] text-[#10B981] font-medium">{(result.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-3 text-center">
                    <p className="text-[11px] text-[#BEB7AC]">{savings > 0 ? "Saved" : "Larger"}</p>
                    <p className={`text-[15px] font-medium ${savings > 0 ? "text-[#10B981]" : "text-[#F59E0B]"}`}>
                      {savings > 0 ? `${savings}%` : `+${Math.abs(savings)}%`}
                    </p>
                  </div>
                </div>
              )}

              {isImageTool && result.originalSize > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-3 text-center">
                    <p className="text-[11px] text-[#BEB7AC]">Original</p>
                    <p className="text-[15px] text-[#F6F3EE] font-medium">{(result.originalSize / 1024).toFixed(0)} KB</p>
                  </div>
                  <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-3 text-center">
                    <p className="text-[11px] text-[#BEB7AC]">Output</p>
                    <p className="text-[15px] text-[#10B981] font-medium">{(result.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-3 text-center">
                    <p className="text-[11px] text-[#BEB7AC]">Saved</p>
                    <p className="text-[15px] text-[#F59E0B] font-medium">{savings}%</p>
                  </div>
                </div>
              )}

              {(isCompress || isImageTool) && result.originalSize > 0 && (
                <>
                  {result.isOptimized ? (
                    <div className="rounded-xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.15)] p-4 mb-4 text-center">
                      <p className="text-[14px] text-[#F59E0B] font-medium">This PDF is already optimized</p>
                      <p className="text-[12px] text-[#BEB7AC] mt-1">Estimated reduction: 0–3%. File is already using efficient compression.</p>
                      <div className="mt-3 flex items-center justify-center gap-4 text-[12px] text-[#BEB7AC]">
                        <span>Original: <span className="text-[#F6F3EE]">{(result.originalSize / 1024 / 1024).toFixed(1)} MB</span></span>
                        <span className="text-[#BEB7AC]/30">|</span>
                        <span>Output: <span className="text-[#BEB7AC]">{(result.size / 1024 / 1024).toFixed(1)} MB</span></span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-3 text-center">
                        <p className="text-[11px] text-[#BEB7AC]">Original</p>
                        <p className="text-[15px] text-[#F6F3EE] font-medium">{(result.originalSize / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                      <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-3 text-center">
                        <p className="text-[11px] text-[#BEB7AC]">{isImageTool ? "Output" : "Compressed"}</p>
                        <p className="text-[15px] text-[#10B981] font-medium">{(result.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                      <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-3 text-center">
                        <p className="text-[11px] text-[#BEB7AC]">{isImageTool ? "Change" : "Saved"}</p>
                        <p className={`text-[15px] font-medium ${savings > 0 ? "text-[#10B981]" : "text-[#F59E0B]"}`}>
                          {isImageTool ? `${savings > 0 ? "-" : "+"}${Math.abs(savings)}%` : `${result.compressSavings || savings}%`}
                        </p>
                      </div>
                    </div>
                  )}

                  {!result.isOptimized && (
                    <div className="rounded-xl bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.1)] p-3 mb-4 text-center">
                      <p className="text-[12px] text-[#BEB7AC]">
                        {result.compressRatio && result.compressRatio > 0.15
                          ? "No visible quality loss — images were recompressed at optimal quality"
                          : "Slight image reduction for greater file savings"
                        }
                      </p>
                    </div>
                  )}
                </>
              )}

              {((isCompress || isImageTool) && result.originalSize > 0 && ((result.originalPreviews?.length || 0) > 0 || (result.compressedPreviews?.length || 0) > 0) && !result.isOptimized) && (
                <div className="mb-4">
                  <p className="text-[11px] text-[#BEB7AC] mb-3">Preview</p>
                  <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-4">
                    <div className="flex items-start justify-center gap-4 sm:gap-8">
                      <div className="text-center flex-1 max-w-[180px]">
                        <p className="text-[10px] text-[#BEB7AC] mb-2">Original</p>
                        {((result.originalPreviews || [])[previewPage] || "").startsWith("data:image/") ? (
                          <img src={(result.originalPreviews || [])[previewPage]} alt="Original" className="w-full h-auto rounded overflow-hidden shadow-sm mx-auto" />
                        ) : (
                          <div className="flex items-center justify-center w-full aspect-[3/4] bg-white rounded overflow-hidden shadow-sm mx-auto"
                            dangerouslySetInnerHTML={{ __html: (result.originalPreviews || [])[previewPage] || "" }} />
                        )}
                        <p className="text-[11px] text-[#F6F3EE] mt-1.5 font-medium">{(result.originalSize / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                      <div className="text-center flex-1 max-w-[180px]">
                        <p className="text-[10px] text-[#BEB7AC] mb-2">Compressed</p>
                        {((result.compressedPreviews || [])[previewPage] || "").startsWith("data:image/") ? (
                          <img src={(result.compressedPreviews || [])[previewPage]} alt="Compressed" className="w-full h-auto rounded overflow-hidden shadow-sm mx-auto" />
                        ) : (
                          <div className="flex items-center justify-center w-full aspect-[3/4] bg-white rounded overflow-hidden shadow-sm mx-auto"
                            dangerouslySetInnerHTML={{ __html: (result.compressedPreviews || [])[previewPage] || "" }} />
                        )}
                        <p className="text-[11px] text-[#10B981] mt-1.5 font-medium">{(result.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    </div>
                    {result.analysis && result.analysis.pages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                        {Array.from({ length: Math.min(result.analysis.pages, 20) }, (_, i) => (
                          <button key={i} onClick={() => setPreviewPage(i)}
                            className={`w-7 h-7 rounded text-[11px] font-medium transition-all ${
                              previewPage === i ? "bg-[#D97757] text-[#0F0E0A]" : "bg-[rgba(255,255,255,0.04)] text-[#BEB7AC] hover:text-[#F6F3EE]"
                            }`}>
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(config.id === "pdf-split" || config.id === "pdf-to-word" || config.id === "pdf-to-jpg" || config.id === "pdf-to-text" || config.id === "pdf-extract-pages" || config.id === "pdf-organize" || config.id === "jpg-to-pdf" || config.id === "png-to-pdf" || config.id === "html-to-pdf" || config.id === "pdf-sign" || config.id === "pdf-repair" || config.id === "pdf-redact" || config.id === "pdf-crop" || config.id === "pdf-metadata" || config.id === "pdf-compare") && result.pagePreviews && result.pagePreviews.length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] text-[#BEB7AC] mb-3">
                    {config.id === "pdf-to-word" || config.id === "pdf-to-text" ? "Extracted text" : config.id === "pdf-compare" ? "Comparison report" : "Page previews"}
                  </p>
                  <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-4">
                    <div className="flex items-center justify-center">
                      {config.id === "pdf-to-word" || config.id === "pdf-to-text" || config.id === "pdf-compare" ? (
                        <div className="w-full max-h-[260px] overflow-y-auto">
                          <pre className="text-[12px] text-[#F6F3EE] whitespace-pre-wrap font-sans leading-relaxed">
                            {result.pagePreviews[previewPage]}
                          </pre>
                        </div>
                      ) : (result.pagePreviews[previewPage] || "").startsWith("data:image/") ? (
                        <img src={result.pagePreviews[previewPage]} alt={`Page ${previewPage + 1}`}
                          className="w-[140px] h-auto sm:w-[170px] rounded overflow-hidden shadow-sm mx-auto" />
                      ) : (
                        <div className="flex items-center justify-center w-[140px] h-[190px] sm:w-[170px] sm:h-[230px] bg-white rounded overflow-hidden shadow-sm mx-auto"
                          dangerouslySetInnerHTML={{ __html: result.pagePreviews[previewPage] }} />
                      )}
                    </div>
                    {(result.mergeTotalPages || 0) > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                        {Array.from({ length: Math.min(result.mergeTotalPages || 0, 20) }, (_, i) => (
                          <button key={i} onClick={() => setPreviewPage(i)}
                            className={`w-7 h-7 rounded text-[11px] font-medium transition-all ${
                              previewPage === i ? "bg-[#D97757] text-[#0F0E0A]" : "bg-[rgba(255,255,255,0.04)] text-[#BEB7AC] hover:text-[#F6F3EE]"
                            }`}>
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isTextTool && result.pagePreviews && result.pagePreviews.length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] text-[#BEB7AC] mb-3">Result</p>
                  <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-4">
                    <div className="w-full max-h-[300px] overflow-y-auto">
                      {result.pagePreviews[0].startsWith("data:image/") ? (
                        <img src={result.pagePreviews[0]} alt="QR Code" className="max-w-full h-auto mx-auto" style={{ maxHeight: "280px" }} />
                      ) : (
                        <pre className="text-[12px] text-[#F6F3EE] whitespace-pre-wrap font-sans leading-relaxed">
                          {result.pagePreviews[0]}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.02)] mb-4">
                <FileText className={`w-4 h-4 shrink-0 ${isAITool ? "text-[#6366F1]" : isTextTool ? "text-[#10B981]" : "text-[#D97757]"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[#F6F3EE] truncate">{result.fileName}</p>
                  <p className="text-[12px] text-[#BEB7AC]">{isTextTool ? `${(result.size / 1024).toFixed(1)} KB · Processed locally` : isVideoTool || isImageTool ? `${(result.size / 1024 / 1024).toFixed(1)} MB` : `${(result.size / 1024 / 1024).toFixed(1)} MB`} &middot; {isTextTool ? "Instant download" : isVideoTool ? "Real FFmpeg processing" : isImageTool ? "Server processed" : isAITool ? "AI generated" : "Verified on server"}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {isTextTool && (
                  <button onClick={async () => {
                    try {
                      if (result.pagePreviews && result.pagePreviews[0]) {
                        await navigator.clipboard.writeText(result.pagePreviews[0])
                      }
                    } catch {}
                  }}
                    className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-[13px] font-medium bg-[rgba(255,255,255,0.06)] text-[#F6F3EE] hover:bg-[rgba(255,255,255,0.1)] active:scale-[0.98] transition-all">
                    <Copy className="w-4 h-4" /> Copy Text
                  </button>
                )}
                <a href={result.downloadUrl} target="_blank" rel="noopener noreferrer" download={result.fileName}
                  className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-[13px] font-medium active:scale-[0.98] transition-all ${
                    isAITool 
                      ? "bg-[#6366F1] text-white hover:bg-[#6366F1]/90 shadow-[0_0_20px_rgba(99,102,241,0.3)]" 
                      : isTextTool
                        ? "bg-[#10B981] text-white hover:bg-[#10B981]/90 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        : "bg-[#D97757] text-[#0F0E0A] hover:bg-[#D97757]/90"
                  }`}>
                  <Download className="w-4 h-4" /> Download {isAITool ? "Result" : isTextTool ? "File" : ""}
                </a>
                {isAITool && (
                  <button onClick={async () => {
                    try {
                      const resp = await fetch(result.downloadUrl)
                      const text = await resp.text()
                      await navigator.clipboard.writeText(text)
                    } catch {}
                  }}
                    className="flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-[#6366F1]/30 text-[13px] text-[#6366F1] hover:bg-[#6366F1]/10 active:scale-[0.98] transition-all">
                    <Type className="w-3.5 h-3.5" /> Copy Text
                  </button>
                )}
                <button onClick={handleReset}
                  className="flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-[rgba(255,255,255,0.08)] text-[13px] text-[#BEB7AC] hover:text-[#F6F3EE] active:scale-[0.98] transition-all">
                  <RotateCcw className="w-3.5 h-3.5" /> Process Another
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {showError && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="rounded-2xl border border-red-500/15 bg-red-500/5 p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <p className="text-[14px] font-medium text-red-400">Processing failed</p>
              </div>
              <p className="text-[13px] text-[#BEB7AC] mb-4 whitespace-pre-wrap">{error || "An unexpected error occurred. Please try again."}</p>
              <div className="flex gap-2">
                <button onClick={handleRetry}
                  className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[#D97757] text-[#0F0E0A] text-[13px] font-medium hover:bg-[#D97757]/90 active:scale-[0.98] transition-all">
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
                <button onClick={handleReset}
                  className="flex items-center gap-2 h-10 px-5 rounded-xl border border-[rgba(255,255,255,0.08)] text-[13px] text-[#BEB7AC] hover:text-[#F6F3EE] active:scale-[0.98] transition-all">
                  <Upload className="w-3.5 h-3.5" /> Different file
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {error && !showError && (
          <div className="mt-4 rounded-xl border border-red-500/15 bg-red-500/5 px-4 py-3 flex items-center justify-between">
            <p className="text-[13px] text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400/70 hover:text-red-400 p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="mt-12 sm:mt-16">
          <h2 className="text-[11px] font-medium text-[#BEB7AC] uppercase tracking-[0.2em] mb-4">FAQ</h2>
          <div className="space-y-2">
            {config.faq.map((item, i) => (
              <details key={i} className="group rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#171612] overflow-hidden">
                <summary className="px-4 py-3.5 text-[14px] text-[#F6F3EE] cursor-pointer list-none flex items-center justify-between group-open:border-b group-open:border-[rgba(255,255,255,0.04)] transition-all">
                  {item.q}
                  <span className="text-[#BEB7AC] text-[11px] transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="px-4 py-3.5">
                  <p className="text-[13px] text-[#BEB7AC] leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-12 sm:mt-16">
            <h3 className="text-[11px] font-medium text-[#BEB7AC] uppercase tracking-[0.2em] mb-4">Related tools</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {related.map((rt) => (
                <Link key={rt.id} href={rt.href}
                  className="group rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#171612] px-4 py-3 hover:border-[rgba(255,255,255,0.1)] hover:-translate-y-0.5 transition-all duration-300">
                  <span className="text-[14px] text-[#F6F3EE] group-hover:text-[#D97757] transition-colors">{rt.name}</span>
                  <p className="text-[12px] text-[#BEB7AC] mt-0.5">{rt.description}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Usage limit banner for free users — ALL tool types */}
        {!isPremium && (
          <div className="mt-6">
            {(() => {
              const usage = getCategoryUsage(toolCategory)
              const pct = Math.round((usage.used / usage.limit) * 100)
              return (
                <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] text-[#BEB7AC]">
                      Daily usage: <span className="text-[#F6F3EE] font-medium">{usage.used}</span> / {usage.limit} {toolCategory} tools
                    </span>
                    <span className={`text-[12px] font-medium ${usage.remaining <= 2 ? "text-red-400" : "text-[#10B981]"}`}>
                      {usage.remaining} remaining
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: pct > 80 ? "#EF4444" : pct > 50 ? "#F59E0B" : "#10B981",
                      }}
                    />
                  </div>
                  {usage.remaining <= 3 && (
                    <Link href="/pricing" className="mt-2 inline-flex items-center gap-1 text-[12px] text-[#D97757] hover:text-[#e08a6a] transition-colors">
                      Upgrade for unlimited access →
                    </Link>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* Google Ads for free users — ALL tool types */}
        {!isPremium && (
          <div className="mt-4">
            <ToolAdBanner variant="bottom" />
          </div>
        )}
      </div>
    </div>
  )
}
