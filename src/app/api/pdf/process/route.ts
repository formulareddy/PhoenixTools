import { processPdfJob } from "@/lib/pdf-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const formData = await req.formData()
  const tool = formData.get("tool") as string
  const optionsRaw = formData.get("options") as string
  const sessionId = formData.get("sessionId") as string | null

  if (!tool) {
    return new Response(JSON.stringify({ error: "Missing tool parameter" }), { status: 400, headers: { "Content-Type": "application/json" } })
  }

  const options: Record<string, string> = optionsRaw ? JSON.parse(optionsRaw) : {}

  let buffers: ArrayBuffer[]
  let fileNames: string[]
  let fileSizes: number[]

  if (sessionId) {
    if (tool === "pdf-merge") {
      // Merge handles its own session loading via getMergeFilesInOrder
      buffers = []
      fileNames = []
      fileSizes = []
    } else {
      const { getUploadedFile } = await import("@/lib/pdf-server")
      const uploaded = await getUploadedFile(sessionId)
      buffers = [uploaded.buffer]
      fileNames = [uploaded.fileName]
      fileSizes = [uploaded.fileSize]
    }
  } else {
    const fileEntries = Array.from(formData.entries()).filter(([k]) => k.startsWith("file"))

    // HTML-to-PDF allows pasting HTML directly (no file upload required)
    if (fileEntries.length === 0 && tool === "html-to-pdf" && options.html?.trim()) {
      const encoder = new TextEncoder()
      buffers = [encoder.encode(options.html.trim()).buffer]
      fileNames = ["content.html"]
      fileSizes = [buffers[0].byteLength]
    } else if (fileEntries.length === 0) {
      return new Response(JSON.stringify({ error: "No files provided" }), { status: 400, headers: { "Content-Type": "application/json" } })
    } else {
      const files = fileEntries.map(([, v]) => v as File)
      buffers = await Promise.all(files.map((f) => f.arrayBuffer()))
      fileNames = files.map((f) => f.name)
      fileSizes = files.map((f) => f.size)
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        try {
          controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      try {
        const result = await processPdfJob(tool, buffers, fileNames, fileSizes, options, (evt) => {
          send("progress", evt)
        }, sessionId || undefined)

        send("complete", {
          downloadUrl: `/api/pdf/download/${result.metadata?.jobId}`,
          fileName: result.outputName,
          size: result.outputSize,
          originalSize: result.originalSize,
          originalName: result.originalName,
          jobId: result.metadata?.jobId,
          pagePreviews: result.metadata?.pagePreviews || [],
          analysis: result.metadata?.analysis || null,
          mergeVerified: result.metadata?.mergeVerified || false,
          mergePageCount: result.metadata?.mergePageCount || 0,
          mergeTotalPages: result.metadata?.mergeTotalPages || 0,
          compressRatio: result.metadata?.compressRatio || 0,
          compressSavings: result.metadata?.compressSavings || 0,
          isOptimized: result.metadata?.isOptimized || false,
          originalPreviews: result.metadata?.originalPreviews || [],
          compressedPreviews: result.metadata?.compressedPreviews || [],
          metadataSummary: result.metadata?.metadataSummary || "",
        })
      } catch (err: any) {
        const trace = (err.stack || "").split("\n").slice(0, 6).join(" | ")
        send("error", { error: err.message || "Processing failed", trace })
        console.error(`[${tool}] Error:`, err.message, trace)
      } finally {
        try { controller.close() } catch {}
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}

export async function GET() {
  return new Response(JSON.stringify({ error: "Use POST" }), { status: 405, headers: { "Content-Type": "application/json" } })
}
