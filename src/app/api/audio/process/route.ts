import { processAudioJob } from "@/lib/audio-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const formData = await req.formData()
  const tool = formData.get("tool") as string
  const optionsRaw = formData.get("options") as string

  if (!tool) {
    return new Response(JSON.stringify({ error: "Missing tool parameter" }), { status: 400, headers: { "Content-Type": "application/json" } })
  }

  const options: Record<string, string> = optionsRaw ? JSON.parse(optionsRaw) : {}

  const fileEntries = Array.from(formData.entries()).filter(([k]) => k.startsWith("file"))

  if (fileEntries.length === 0) {
    return new Response(JSON.stringify({ error: "No files provided" }), { status: 400, headers: { "Content-Type": "application/json" } })
  }

  const files: { buf: ArrayBuffer; name: string }[] = []
  for (const [, val] of fileEntries) {
    const file = val as File
    const buf = await file.arrayBuffer()
    files.push({ buf, name: file.name })
  }

  const firstFile = files[0]

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        try {
          controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      try {
        const result = await processAudioJob(tool, firstFile.buf, firstFile.name, options, (evt) => {
          send("progress", evt)
        }, files.length > 1 ? files : undefined)

        send("complete", {
          downloadUrl: `/api/audio/download/${result.metadata?.jobId}`,
          fileName: result.outputName,
          size: result.outputSize,
          originalSize: result.originalSize,
          originalName: result.originalName,
          jobId: result.metadata?.jobId,
          metadata: result.metadata || {},
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
