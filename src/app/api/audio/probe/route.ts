import { readFile, writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"
import { probeAudioTracks } from "@/lib/audio-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    const dir = join(tmpdir(), "phoenixtools-audio", `probe-${randomUUID()}`)
    await mkdir(dir, { recursive: true })
    const ext = file.name.lastIndexOf(".") >= 0 ? file.name.substring(file.name.lastIndexOf(".")) : ".mp4"
    const inputPath = join(dir, `input${ext}`)
    const buf = await file.arrayBuffer()
    await writeFile(inputPath, new Uint8Array(buf))

    const tracks = await probeAudioTracks(inputPath)

    // Clean up probe file
    const { rm } = await import("fs/promises")
    await rm(dir, { recursive: true, force: true }).catch(() => {})

    return Response.json({
      trackCount: tracks.length,
      tracks: tracks.map(t => ({
        index: t.index,
        codec: t.codec,
        language: t.language,
        channels: t.channels,
        sampleRate: t.sampleRate,
        bitrate: t.bitrate,
        title: t.title,
        isDefault: t.isDefault,
      })),
    })
  } catch (err: any) {
    return Response.json({ error: err.message || "Probe failed" }, { status: 500 })
  }
}
