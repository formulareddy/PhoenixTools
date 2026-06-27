import { readFile } from "fs/promises"
import { processAIJob } from "@/lib/ai-server"

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

  let fileBuffer: ArrayBuffer | undefined
  let fileName: string | undefined
  const file = formData.get("file") as File | null
  if (file) {
    fileBuffer = await file.arrayBuffer()
    fileName = file.name
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        try {
          controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      try {
        const result = await processAIJob(tool, options, (evt) => {
          send("progress", evt)
        }, fileBuffer, fileName)

        let outputBase64 = ""
        try {
          const fileBuf = await readFile(result.outputPath)
          outputBase64 = fileBuf.toString("base64")
        } catch {}

        send("complete", {
          downloadUrl: `/api/ai/download/${result.metadata?.jobId}`,
          outputBase64,
          fileName: result.outputName,
          size: result.outputSize,
          originalSize: result.originalSize,
          originalName: result.originalName || fileName || "",
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
