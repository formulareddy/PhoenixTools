import { createMergeSession } from "@/lib/pdf-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const fileEntries = Array.from(formData.entries()).filter(([k]) => k.startsWith("file"))

    if (fileEntries.length === 0) {
      return Response.json({ error: "No files provided" }, { status: 400 })
    }

    if (fileEntries.length > 20) {
      return Response.json({ error: "Maximum 20 files allowed" }, { status: 400 })
    }

    const files: { buffer: ArrayBuffer; name: string; size: number }[] = []

    for (const [, v] of fileEntries) {
      const f = v as File
      if (!f.name.toLowerCase().endsWith(".pdf")) {
        return Response.json({ error: `"${f.name}" is not a PDF file` }, { status: 400 })
      }
      if (f.size < 1024) {
        return Response.json({ error: `"${f.name}" is too small (min 1 KB)` }, { status: 400 })
      }
      const buffer = await f.arrayBuffer()
      files.push({ buffer, name: f.name, size: f.size })
    }

    const session = await createMergeSession(files)

    return Response.json({
      success: true,
      sessionId: session.sessionId,
      files: session.files,
      totalPages: session.totalPages,
    })
  } catch (err: any) {
    const msg = err.message || "Analysis failed"
    if (msg.includes("encrypted") || msg.includes("password")) {
      return Response.json({ error: "One or more files are password protected." }, { status: 400 })
    }
    return Response.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({ error: "Use POST" }, { status: 405 })
}
