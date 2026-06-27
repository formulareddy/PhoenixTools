import { readFile } from "fs/promises"
import { processVideoJob } from "@/lib/video-server"

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

  const file = fileEntries[0][1] as File
  const buf = await file.arrayBuffer()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        try {
          controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      try {
        const result = await processVideoJob(tool, buf, file.name, options, (evt) => {
          send("progress", evt)
        })

        let outputBase64 = ""
        try {
          const fileBuf = await readFile(result.outputPath)
          outputBase64 = fileBuf.toString("base64")
        } catch {}

        send("complete", {
          downloadUrl: `/api/video/download/${result.metadata?.jobId}`,
          outputBase64,
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
