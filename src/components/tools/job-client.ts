"use client"

export interface SSEProgress {
  state: string
  pct: number
  detail?: string
}

export interface SSEComplete {
  downloadUrl: string
  outputBase64?: string
  fileName: string
  size: number
  originalSize: number
  originalName: string
  jobId: string
  pagePreviews?: string[]
  analysis?: {
    pages: number
    images: number
    fonts: number
    objects: number
    pageSizes: { width: number; height: number }[]
    originalSize: number
    estimatedSizes: { balanced: string; strong: string; maximum: string }
  } | null
  mergeVerified?: boolean
  mergePageCount?: number
  mergeTotalPages?: number
  compressRatio?: number
  compressSavings?: number
  isOptimized?: boolean
  originalPreviews?: string[]
  compressedPreviews?: string[]
  metadataSummary?: string
}

export interface SSEError {
  error: string
}

export type JobEvent =
  | { type: "progress"; data: SSEProgress }
  | { type: "complete"; data: SSEComplete }
  | { type: "error"; data: SSEError }

export type JobCallback = (evt: JobEvent) => void

export async function startJob(
  tool: string,
  files: File[],
  options: Record<string, string>,
  onEvent: JobCallback,
  signal?: AbortSignal,
  sessionId?: string,
): Promise<void> {
  const isImageTool = tool.startsWith("image-") || tool === "remove-bg" || tool === "image-watermark" || tool === "image-blur" || tool === "image-rotate" || tool === "image-crop" || tool === "image-upscale" || tool === "remove-objects" || tool === "colorize-photo" || tool === "restore-photo"
  const isVideoTool = tool.startsWith("video-") || tool === "extract-audio" || tool === "merge-video" || tool === "resize-video" || tool === "crop-video" || tool === "add-audio-to-video" || tool === "change-video-speed" || tool === "mute-video" || tool === "rotate-flip-video"
  const isAudioTool = tool.startsWith("audio-") || tool === "trim-audio" || tool === "merge-audio" || tool === "remove-noise" || tool === "extract-audio-from-video" || tool === "voice-changer" || tool === "audio-cutter" || tool === "audio-metadata" || tool === "audio-recorder"
  const isAITool = tool.startsWith("ai-")
  const apiEndpoint = isAITool ? "/api/ai/process" : isAudioTool ? "/api/audio/process" : isVideoTool ? "/api/video/process" : isImageTool ? "/api/image/process" : "/api/pdf/process"

  const formData = new FormData()
  formData.set("tool", tool)
  formData.set("options", JSON.stringify(options))
  if (sessionId) {
    formData.set("sessionId", sessionId)
  } else {
    files.forEach((f, i) => formData.append("file", f))
  }

  const resp = await fetch(apiEndpoint, {
    method: "POST",
    body: formData,
    signal,
  })

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({ error: `Server error (${resp.status})` }))
    onEvent({ type: "error", data: { error: body.error || `Server error (${resp.status})` } })
    return
  }

  const reader = resp.body?.getReader()
  if (!reader) {
    onEvent({ type: "error", data: { error: "Stream not available" } })
    return
  }

  const decoder = new TextDecoder()
  let buffer = ""
  let eventType = ""

  try {
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
          const dataStr = line.slice(6)
          try {
            const data = JSON.parse(dataStr)
            if (eventType === "progress") {
              onEvent({ type: "progress", data: data as SSEProgress })
            } else if (eventType === "complete") {
              onEvent({ type: "complete", data: data as SSEComplete })
            } else if (eventType === "error") {
              onEvent({ type: "error", data: data as SSEError })
            }
          } catch {}
        } else if (line.trim() === "") {
          eventType = ""
        }
      }
    }

    if (buffer.trim()) {
      const remaining = (buffer + "\n").split("\n")
      for (const line of remaining) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7).trim()
        } else if (line.startsWith("data: ")) {
          const dataStr = line.slice(6)
          try {
            const data = JSON.parse(dataStr)
            if (eventType === "progress") {
              onEvent({ type: "progress", data: data as SSEProgress })
            } else if (eventType === "complete") {
              onEvent({ type: "complete", data: data as SSEComplete })
            } else if (eventType === "error") {
              onEvent({ type: "error", data: data as SSEError })
            }
          } catch {}
        }
      }
    }
  } catch (err: any) {
    if (err.name !== "AbortError") {
      onEvent({ type: "error", data: { error: err.message || "Connection lost" } })
    }
  }
}
