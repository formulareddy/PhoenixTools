"use client"

export type ProgressState = "idle" | "uploading" | "reading" | "validating" | "analyzing" | "processing" | "generating" | "verifying" | "ready" | "error" | "trimming" | "compressing" | "converting" | "extracting" | "merging" | "resizing" | "cropping" | "mixing" | "adjusting" | "muting" | "transforming" | "watermarking" | "saving" | "done" | "denoising" | "boosting" | "cutting" | "recording"

export type ProgressFn = (state: ProgressState, pct: number, detail?: string) => void

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

export interface ToolResult {
  file: Blob
  name: string
  size: number
}

export interface ServerResult {
  downloadUrl: string
  fileName: string
  size: number
  originalSize: number
  originalName: string
  jobId: string
  pagePreviews?: string[]
  analysis?: PDFAnalysis | null
}

export interface OptionChoice {
  label: string
  value: string
  description?: string
}

export interface ToolOption {
  type: "radio" | "select" | "text" | "password" | "textarea" | "time"
  label: string
  key: string
  defaultValue: string
  choices?: OptionChoice[]
  placeholder?: string
  hint?: string
}

export interface ToolConfig {
  id: string
  name: string
  description: string
  maxFileSize: number
  accept: string
  multiple: boolean
  options: ToolOption[]
  getDownloadName: (original: string) => string
  faq: { q: string; a: string }[]
  howItWorks: string[]
}

export function stateLabel(s: ProgressState): string {
  const labels: Record<ProgressState, string> = {
    idle: "Waiting",
    uploading: "Uploading to server",
    reading: "Reading file",
    validating: "Validating",
    analyzing: "Analyzing audio",
    processing: "Processing",
    generating: "Generating output",
    verifying: "Verifying output",
    ready: "Ready",
    error: "Error",
    trimming: "Trimming audio",
    compressing: "Compressing audio",
    converting: "Converting format",
    extracting: "Extracting audio",
    merging: "Merging files",
    resizing: "Resizing",
    cropping: "Cropping",
    mixing: "Mixing audio",
    adjusting: "Adjusting speed",
    muting: "Muting audio",
    transforming: "Applying effects",
    watermarking: "Adding watermark",
    saving: "Saving output",
    done: "Done",
    denoising: "Removing noise",
    boosting: "Adjusting volume",
    cutting: "Splitting audio",
    recording: "Recording audio",
  }
  return labels[s]
}
