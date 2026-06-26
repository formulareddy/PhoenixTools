import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { getJobDir } from "@/lib/pdf-server"
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
  const outputPath = join(jobDir, "output.pdf")

  if (!existsSync(metaPath) || !existsSync(outputPath)) {
    return new Response("Job not found or expired", { status: 404 })
  }

  const meta = JSON.parse(await readFile(metaPath, "utf-8"))
  const fileBuffer = await readFile(outputPath)

  const ext = meta.outputName.endsWith(".zip") ? "application/zip"
    : meta.outputName.endsWith(".txt") ? "text/plain; charset=utf-8"
    : "application/pdf"

  return new Response(fileBuffer, {
    headers: {
      "Content-Type": ext,
      "Content-Disposition": `attachment; filename="${sanitizeFilename(meta.outputName)}"`,
      "Content-Length": String(fileBuffer.byteLength),
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
