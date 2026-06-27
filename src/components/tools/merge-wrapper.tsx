"use client"

import { useState, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Upload, FileText, Check, AlertTriangle, RefreshCw, Download, RotateCcw, Loader2, X, ArrowUp, ArrowDown, Layers, GripVertical, FileUp } from "lucide-react"
import { tools } from "@/lib/constants"
import { stateLabel } from "./types"
import type { ProgressState } from "./types"
import { ToolAdBanner } from "@/components/ui/tool-ad-banner"

interface MergeFileInfo {
  index: number
  name: string
  size: number
  pages: number
  pageSizes: { width: number; height: number }[]
  thumbnail: string
}

interface MergeResult {
  downloadUrl: string
  fileName: string
  size: number
  originalSize: number
  jobId: string
  pagePreviews?: string[]
  mergeVerified?: boolean
  mergePageCount?: number
  mergeTotalPages?: number
}

export function MergeWrapper() {
  const [rawFiles, setRawFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<{
    sessionId: string
    files: MergeFileInfo[]
    totalPages: number
  } | null>(null)
  const [order, setOrder] = useState<number[]>([])

  const [state, setState] = useState<ProgressState>("idle")
  const [progress, setProgress] = useState(0)
  const [detail, setDetail] = useState("")
  const [result, setResult] = useState<MergeResult | null>(null)
  const [previewPage, setPreviewPage] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const related = tools.filter((t) => t.category === "pdf" && t.id !== "pdf-merge").slice(0, 4)

  const validateFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming)
    if (arr.length > 20) throw new Error("Maximum 20 files allowed")
    for (const f of arr) {
      if (!f.name.toLowerCase().endsWith(".pdf")) throw new Error(`"${f.name}" is not a PDF file`)
      if (f.size < 1024) throw new Error(`"${f.name}" is too small (min 1 KB)`)
      if (f.size > 500 * 1024 * 1024) throw new Error(`"${f.name}" exceeds 500 MB limit`)
    }
    return arr
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    try { setRawFiles(validateFiles(e.dataTransfer.files)) } catch (err: any) { setError(err.message) }
  }, [validateFiles])

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      try { setRawFiles(validateFiles(e.target.files)) } catch (err: any) { setError(err.message) }
    }
  }, [validateFiles])

  const removeRawFile = useCallback((i: number) => {
    setRawFiles((prev) => prev.filter((_, idx) => idx !== i))
    setAnalysis(null)
    setResult(null)
    setError(null)
    setState("idle")
  }, [])

  const doAnalyze = useCallback(async () => {
    if (!rawFiles.length) return
    setAnalyzing(true)
    setError(null)
    setDetail(`Uploading ${rawFiles.length} files for analysis`)
    setProgress(10)

    try {
      const formData = new FormData()
      rawFiles.forEach((f, i) => formData.append(`file`, f))

      const resp = await fetch("/api/pdf/analyze-merge", { method: "POST", body: formData })

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({ error: "Analysis failed" }))
        throw new Error(body.error || "Analysis failed")
      }

      setProgress(60)
      setDetail("Reading PDF structure")

      const data = await resp.json()
      setAnalysis({
        sessionId: data.sessionId,
        files: data.files,
        totalPages: data.totalPages,
      })
      setOrder(data.files.map((_: any, i: number) => i))
      setProgress(100)
      setDetail("")
      setAnalyzing(false)
    } catch (err: any) {
      setError(err.message || "Analysis failed")
      setAnalyzing(false)
    }
  }, [rawFiles])

  const moveUp = useCallback((idx: number) => {
    if (idx <= 0) return
    setOrder((prev) => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }, [])

  const moveDown = useCallback((idx: number) => {
    setOrder((prev) => {
      if (idx >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }, [])

  const removeFromMerge = useCallback((orderIdx: number) => {
    setOrder((prev) => prev.filter((_, i) => i !== orderIdx))
  }, [])

  const orderedFiles = order.map((fileIdx) => analysis?.files[fileIdx]).filter(Boolean) as MergeFileInfo[]
  const totalPages = orderedFiles.reduce((sum, f) => sum + f.pages, 0)

  const doMerge = useCallback(async () => {
    if (!analysis || order.length < 2) return
    setState("uploading")
    setProgress(0)
    setDetail("Starting merge")
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.set("tool", "pdf-merge")
      formData.set("options", JSON.stringify({ order: JSON.stringify(order) }))
      formData.set("sessionId", analysis.sessionId)

      const resp = await fetch("/api/pdf/process", {
        method: "POST",
        body: formData,
      })

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({ error: `Server error (${resp.status})` }))
        throw new Error(body.error || `Server error (${resp.status})`)
      }

      const reader = resp.body?.getReader()
      if (!reader) throw new Error("Stream not available")

      const decoder = new TextDecoder()
      let buffer = ""
      let eventType = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim()
          } else if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (eventType === "progress") {
                if (data.state === "ready") {
                  setState("ready")
                  setProgress(100)
                  setDetail("")
                } else {
                  setState(data.state as ProgressState)
                  setProgress(data.pct)
                  if (data.detail) setDetail(data.detail)
                }
              } else if (eventType === "complete") {
                const completeData = data as any
                if (completeData.outputBase64) {
                  try {
                    const binary = atob(completeData.outputBase64)
                    const bytes = new Uint8Array(binary.length)
                    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
                    const blob = new Blob([bytes], { type: "application/pdf" })
                    completeData.downloadUrl = URL.createObjectURL(blob)
                  } catch {}
                }
                setResult({
                  downloadUrl: completeData.downloadUrl,
                  fileName: completeData.fileName,
                  size: completeData.size,
                  originalSize: completeData.originalSize,
                  jobId: completeData.jobId,
                  pagePreviews: completeData.pagePreviews || [],
                  mergeVerified: completeData.mergeVerified,
                  mergePageCount: completeData.mergePageCount,
                  mergeTotalPages: completeData.mergeTotalPages,
                })
                setState("ready")
                setProgress(100)
                setDetail("")
              } else if (eventType === "error") {
                setError(data.error || "Merge failed")
                setState("error")
              }
            } catch {}
          } else if (line.trim() === "") {
            eventType = ""
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Merge failed")
      setState("error")
    }
  }, [analysis, order])

  const handleReset = useCallback(() => {
    setRawFiles([])
    setAnalysis(null)
    setOrder([])
    setResult(null)
    setError(null)
    setState("idle")
    setProgress(0)
    setDetail("")
    setPreviewPage(0)
  }, [])

  const isProcessing = ["uploading", "reading", "validating", "analyzing", "processing", "generating", "verifying"].includes(state)

  const showUpload = state === "idle" && !rawFiles.length && !analyzing && !analysis
  const showRawFiles = rawFiles.length > 0 && !analysis && !analyzing && state === "idle" && !result
  const showAnalysis = !!analysis && state === "idle" && !result
  const showProgress = isProcessing
  const showResult = state === "ready" && result
  const showError = state === "error"

  return (
    <div className="pt-20 sm:pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/tools" className="inline-flex items-center gap-1.5 text-[13px] text-[#BEB7AC] hover:text-[#F6F3EE] transition-colors mb-8 sm:mb-10">
          <ArrowLeft className="w-3 h-3" />
          All tools
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-serif text-[clamp(28px,5vw,48px)] text-[#F6F3EE] leading-[1.04] tracking-[-0.02em] mb-2">Merge PDF</h1>
          <p className="text-[14px] sm:text-[15px] text-[#BEB7AC] max-w-xl">Combine multiple PDF files into one document.</p>
          <p className="text-[13px] text-[#BEB7AC]/60 mt-1">Preserve quality, order, bookmarks and layout.</p>
          <div className="flex flex-wrap gap-3 mt-4 text-[12px] text-[#BEB7AC]">
            <span className="px-2.5 py-1 rounded-lg border border-[rgba(255,255,255,0.06)]">Multiple PDFs</span>
            <span className="px-2.5 py-1 rounded-lg border border-[rgba(255,255,255,0.06)]">Max 500 MB each</span>
            <span className="px-2.5 py-1 rounded-lg border border-[rgba(255,255,255,0.06)]">Up to 20 files</span>
          </div>
        </motion.div>

        {/* TOP AD */}
        <ToolAdBanner variant="top" />

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-8 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-5 sm:p-6">
          <h2 className="text-[13px] font-medium text-[#BEB7AC] uppercase tracking-[0.15em] mb-3">How it works</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {["Upload your PDF files using the secure upload zone below", "Files are analyzed — pages, fonts, and layout detected", "Drag to reorder files and remove unwanted ones", "Merge — real progress streamed from server, then preview and download"].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#D97757]/10 flex items-center justify-center text-[11px] text-[#D97757] font-medium">{i + 1}</span>
                <p className="text-[13px] text-[#BEB7AC] leading-snug">{step}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {showUpload && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div
              onDragEnter={() => setDragOver(true)}
              onDragLeave={() => setDragOver(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`border border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all ${
                dragOver ? "border-[#D97757]/40 bg-[#D97757]/[0.03]" : "border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)]"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center mx-auto mb-4">
                <FileUp className="w-5 h-5 text-[#BEB7AC]" />
              </div>
              <h3 className="text-[15px] font-medium text-[#F6F3EE] mb-2">Drop PDFs here</h3>
              <p className="text-[13px] text-[#BEB7AC] mb-2">or <span className="text-[#D97757]">browse files</span></p>
              <p className="text-[11px] text-[#BEB7AC]/50">PDF only &middot; Max 500 MB each &middot; Up to 20 files</p>
              <input ref={inputRef} type="file" accept=".pdf" multiple onChange={handleSelect} className="hidden" />
            </div>
          </motion.div>
        )}

        {showRawFiles && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
            <p className="text-[12px] text-[#BEB7AC] mb-1">{rawFiles.length} file{rawFiles.length > 1 ? "s" : ""} selected</p>
            {rawFiles.map((f, i) => (
              <div key={i} className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-[#D97757] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[14px] text-[#F6F3EE] truncate">{f.name}</p>
                    <p className="text-[12px] text-[#BEB7AC]">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </div>
                <button onClick={() => removeRawFile(i)} className="p-1 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors">
                  <X className="w-3.5 h-3.5 text-[#BEB7AC]" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={doAnalyze} disabled={analyzing || rawFiles.length < 2}
                className="flex-1 sm:flex-none h-11 px-6 rounded-xl bg-[#D97757] text-[#0F0E0A] text-[13px] font-medium hover:bg-[#D97757]/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 justify-center">
                <Layers className="w-4 h-4" /> Analyze PDFs
              </button>
              <button onClick={handleReset}
                className="h-11 px-4 rounded-xl border border-[rgba(255,255,255,0.08)] text-[13px] text-[#BEB7AC] hover:text-[#F6F3EE] active:scale-[0.98] transition-all">
                Clear
              </button>
            </div>
          </motion.div>
        )}

        {analyzing && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-4 h-4 text-[#D97757] animate-spin" />
                <div>
                  <span className="text-[14px] font-medium text-[#F6F3EE]">Analyzing PDFs</span>
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

        {/* MIDDLE AD */}
        <ToolAdBanner variant="middle" />

        {showAnalysis && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-[#BEB7AC]">
                {orderedFiles.length} file{orderedFiles.length > 1 ? "s" : ""} &middot; <span className="text-[#F6F3EE] font-medium">{totalPages} total pages</span>
              </p>
            </div>

            {orderedFiles.map((f, i) => (
              <motion.div key={`${f.index}-${i}`} layout
                className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#171612] overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <GripVertical className="w-3.5 h-3.5 text-[#BEB7AC]/30 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[14px] text-[#F6F3EE] truncate">{f.name}</p>
                        <p className="text-[12px] text-[#BEB7AC]">{f.pages} page{f.pages > 1 ? "s" : ""} &middot; {(f.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveUp(i)} disabled={i === 0}
                        className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                        <ArrowUp className="w-3.5 h-3.5 text-[#BEB7AC]" />
                      </button>
                      <button onClick={() => moveDown(i)} disabled={i === orderedFiles.length - 1}
                        className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                        <ArrowDown className="w-3.5 h-3.5 text-[#BEB7AC]" />
                      </button>
                      <button onClick={() => removeFromMerge(i)}
                        className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors ml-1">
                        <X className="w-3.5 h-3.5 text-[#BEB7AC] hover:text-red-400" />
                      </button>
                    </div>
                  </div>

                  {f.thumbnail && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      <div className="shrink-0 w-[60px] h-[80px] bg-white rounded overflow-hidden shadow-sm border border-[rgba(255,255,255,0.06)] flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: f.thumbnail.replace(/width="\d+"/, 'width="60"').replace(/height="\d+"/, 'height="80"') }} />
                      {f.pages > 1 && (
                        <span className="text-[11px] text-[#BEB7AC]/50 shrink-0">+{f.pages - 1} more</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            <div className="flex gap-2">
              <button onClick={doMerge} disabled={isProcessing || orderedFiles.length < 2}
                className="flex-1 sm:flex-none h-11 px-6 rounded-xl bg-[#D97757] text-[#0F0E0A] text-[13px] font-medium hover:bg-[#D97757]/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 justify-center">
                <Layers className="w-4 h-4" /> Merge PDFs
              </button>
              <button onClick={handleReset}
                className="h-11 px-4 rounded-xl border border-[rgba(255,255,255,0.08)] text-[13px] text-[#BEB7AC] hover:text-[#F6F3EE] active:scale-[0.98] transition-all">
                Start over
              </button>
            </div>
          </motion.div>
        )}

        {showProgress && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-[#D97757] animate-spin" />
                  <div>
                    <span className="text-[14px] font-medium text-[#F6F3EE]">{stateLabel(state)}</span>
                    {detail && <p className="text-[12px] text-[#BEB7AC] mt-0.5">{detail}</p>}
                  </div>
                </div>
                <span className="text-[12px] text-[#BEB7AC]/50">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%`, background: "linear-gradient(90deg, #D97757, #F59E0B)" }} />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-[#BEB7AC]/40">
                {["reading", "analyzing", "processing", "generating", "verifying"].map((s) => (
                  <span key={s} className={state === s ? "text-[#D97757]/80" : ""}>{s}</span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {showResult && result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#171612] p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[rgba(255,255,255,0.04)]">
                <div className="w-9 h-9 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-[#F6F3EE]">Merge complete</p>
                  <p className="text-[12px] text-[#BEB7AC]">
                    {result.mergeVerified !== false
                      ? `${result.mergePageCount || "?"} pages merged and verified`
                      : "Merge completed with warnings"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-3 text-center">
                  <p className="text-[11px] text-[#BEB7AC]">File Size</p>
                  <p className="text-[15px] text-[#F6F3EE] font-medium">{(result.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-3 text-center">
                  <p className="text-[11px] text-[#BEB7AC]">Page Count</p>
                  <p className="text-[15px] text-[#F6F3EE] font-medium">{result.mergePageCount || "?"} pages</p>
                </div>
              </div>

                  {result.pagePreviews && result.pagePreviews.length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] text-[#BEB7AC] mb-3">Preview</p>
                  <div className="rounded-xl bg-[rgba(255,255,255,0.02)] p-4">
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        {result.pagePreviews[previewPage].startsWith("data:image/") ? (
                          <img src={result.pagePreviews[previewPage]} alt={`Page ${previewPage + 1}`}
                            className="w-[140px] h-auto sm:w-[170px] rounded overflow-hidden shadow-sm mx-auto" />
                        ) : (
                          <div className="flex items-center justify-center w-[140px] h-[190px] sm:w-[170px] sm:h-[230px] bg-white rounded overflow-hidden shadow-sm mx-auto"
                            dangerouslySetInnerHTML={{ __html: result.pagePreviews[previewPage] }} />
                        )}
                        <p className="text-[11px] text-[#BEB7AC] mt-1.5">Page {previewPage + 1}</p>
                      </div>
                    </div>
                    {(result.mergePageCount || 0) > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                        {Array.from({ length: Math.min(result.mergePageCount || 0, 20) }, (_, i) => (
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

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.02)] mb-4">
                <FileText className="w-4 h-4 text-[#D97757] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[#F6F3EE] truncate">{result.fileName}</p>
                  <p className="text-[12px] text-[#BEB7AC]">{(result.size / 1024 / 1024).toFixed(1)} MB &middot; Verified</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <a href={result.downloadUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-[#D97757] text-[#0F0E0A] text-[13px] font-medium hover:bg-[#D97757]/90 active:scale-[0.98] transition-all">
                  <Download className="w-4 h-4" /> Download
                </a>
                <button onClick={handleReset}
                  className="flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-[rgba(255,255,255,0.08)] text-[13px] text-[#BEB7AC] hover:text-[#F6F3EE] active:scale-[0.98] transition-all">
                  <RotateCcw className="w-3.5 h-3.5" /> Merge Again
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
                <p className="text-[14px] font-medium text-red-400">Merge failed</p>
              </div>
              <p className="text-[13px] text-[#BEB7AC] mb-4 whitespace-pre-wrap">{error || "An unexpected error occurred. Please try again."}</p>
              <div className="flex gap-2">
                <button onClick={doMerge}
                  className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[#D97757] text-[#0F0E0A] text-[13px] font-medium hover:bg-[#D97757]/90 active:scale-[0.98] transition-all">
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
                <button onClick={handleReset}
                  className="flex items-center gap-2 h-10 px-5 rounded-xl border border-[rgba(255,255,255,0.08)] text-[13px] text-[#BEB7AC] hover:text-[#F6F3EE] active:scale-[0.98] transition-all">
                  <Upload className="w-3.5 h-3.5" /> Different files
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

        {/* BOTTOM AD */}
        <ToolAdBanner variant="bottom" />
      </div>
    </div>
  )
}
