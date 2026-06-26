import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync, readdirSync } from "fs"
import { safeJobDir, sanitizeFilename } from "@/lib/api-security"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params

  const jobDir = safeJobDir("phoenixtools-ai", jobId)
  if (!jobDir) {
    return new Response("Invalid job", { status: 404 })
  }

  const metaPath = join(jobDir, "meta.json")

  if (!existsSync(metaPath)) {
    return new Response("Job not found or expired", { status: 404 })
  }

  try {
    const meta = JSON.parse(await readFile(metaPath, "utf-8"))

    const files = readdirSync(jobDir)
    const outputFile = files.find((f) => f.startsWith("output."))

    if (!outputFile) {
      return new Response("Output file not found", { status: 404 })
    }

    const outputExt = "." + outputFile.split(".").pop()

    let downloadName = meta.outputName
    if (!downloadName || downloadName === "undefined") {
      const prefix = meta.toolId ? meta.toolId.replace("ai-", "") : "ai"
      downloadName = `${prefix}-result${outputExt}`
    }
    downloadName = sanitizeFilename(downloadName)

    const outputPath = join(jobDir, outputFile)
    const fileBuffer = await readFile(outputPath)

    const contentType = outputExt === ".md" ? "text/markdown"
      : outputExt === ".txt" ? "text/plain"
      : outputExt === ".html" ? "text/html"
      : outputExt === ".json" ? "application/json"
      : outputExt === ".pdf" ? "application/pdf"
      : outputExt === ".docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "text/plain"

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${downloadName}"`,
        "Content-Length": String(fileBuffer.byteLength),
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return new Response("Download failed", { status: 500 })
  }
}
