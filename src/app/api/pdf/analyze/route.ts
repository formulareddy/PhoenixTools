import { analyzePdf, storeUpload } from "@/lib/pdf-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return Response.json({ error: "Unsupported file type. Only PDF files are supported." }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()

    if (buffer.byteLength < 1024) {
      return Response.json({ error: "File is too small (min 1 KB)" }, { status: 400 })
    }

    const analysis = await analyzePdf(buffer)
    const sessionId = await storeUpload(buffer, file.name)

    return Response.json({
      success: true,
      sessionId,
      analysis,
    })
  } catch (err: any) {
    const msg = err.message || "Analysis failed"
    if (msg.includes("encrypted") || msg.includes("password")) {
      return Response.json({ error: "Password protected PDF. Please unlock the file first." }, { status: 400 })
    }
    return Response.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({ error: "Use POST" }, { status: 405 })
}
