import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync, readdirSync } from "fs"
import { getJobDir } from "@/lib/video-server"
import { isValidJobId, sanitizeFilename } from "@/lib/api-security"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params

  if (!isValidJobId(jobId)) {
    return new Response("Invalid job", { status: 404 })
  }

  const jobDir = getJobDir(jobId)
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
      const baseName = meta.originalName ? meta.originalName.replace(/\.[^.]+$/, "") : "video"
      const prefix = meta.toolPrefix || ""
      downloadName = `${prefix}${baseName}${outputExt}`
    }
    downloadName = sanitizeFilename(downloadName)

    const outputPath = join(jobDir, outputFile)
    const fileBuffer = await readFile(outputPath)

    const contentType = outputExt === ".mp4" ? "video/mp4"
      : outputExt === ".webm" ? "video/webm"
      : outputExt === ".avi" ? "video/avi"
      : outputExt === ".mov" ? "video/quicktime"
      : outputExt === ".mkv" ? "video/x-matroska"
      : outputExt === ".gif" ? "image/gif"
      : outputExt === ".mp3" ? "audio/mpeg"
      : outputExt === ".wav" ? "audio/wav"
      : "application/octet-stream"

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
