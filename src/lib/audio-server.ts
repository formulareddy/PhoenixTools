import { execFile, exec } from "child_process"
import { readFile, writeFile, mkdir, readdir } from "fs/promises"
import { existsSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"
import { promisify } from "util"

const execFileAsync = promisify(execFile)
const execAsync = promisify(exec)

function parseTimeString(time: string | undefined): number {
  if (!time) return 0
  const parts = time.split(":").map(Number)
  if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0)
  if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0)
  return parts[0] || 0
}

export interface AudioProgress {
  state: string
  pct: number
  detail?: string
}

export interface AudioJobResult {
  outputPath: string
  outputName: string
  outputSize: number
  originalSize: number
  originalName: string
  metadata?: Record<string, any>
}

type OnProgress = (evt: AudioProgress) => void

const BASE = join(tmpdir(), "phoenixtools-audio")

export function getJobDir(jobId: string): string {
  return join(BASE, jobId)
}

async function createJobDir(jobId: string): Promise<string> {
  const dir = getJobDir(jobId)
  await mkdir(dir, { recursive: true })
  return dir
}

async function ffprobeAudio(filePath: string): Promise<{
  duration: number
  bitrate: number
  sampleRate: number
  channels: number
  codec: string
  format: string
  hasAudio: boolean
}> {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "quiet", "-print_format", "json",
      "-show_format", "-show_streams",
      filePath,
    ], { timeout: 15000 })
    const info = JSON.parse(stdout)
    const audioStream = (info.streams || []).find((s: any) => s.codec_type === "audio")
    return {
      duration: parseFloat(info.format?.duration || "0"),
      bitrate: parseInt(info.format?.bit_rate || "0"),
      sampleRate: parseInt(audioStream?.sample_rate || "44100"),
      channels: parseInt(audioStream?.channels || "2"),
      codec: audioStream?.codec_name || "unknown",
      format: info.format?.format_name || "unknown",
      hasAudio: !!audioStream,
    }
  } catch {
    return { duration: 0, bitrate: 0, sampleRate: 44100, channels: 2, codec: "unknown", format: "unknown", hasAudio: false }
  }
}

function extFromName(name: string): string {
  const ext = name.lastIndexOf(".") >= 0 ? name.substring(name.lastIndexOf(".")).toLowerCase() : ".mp3"
  return ext
}

function outputExtForFormat(format: string): string {
  const map: Record<string, string> = { mp3: ".mp3", wav: ".wav", aac: ".aac", ogg: ".ogg", flac: ".flac", wma: ".wma", m4a: ".m4a", opus: ".opus" }
  return map[format] || ".mp3"
}

function mimeForExt(ext: string): string {
  const map: Record<string, string> = { ".mp3": "audio/mpeg", ".wav": "audio/wav", ".aac": "audio/aac", ".ogg": "audio/ogg", ".flac": "audio/flac", ".wma": "audio/x-ms-wma", ".m4a": "audio/mp4", ".opus": "audio/opus" }
  return map[ext] || "audio/mpeg"
}

function parseFfmpegProgress(line: string, duration: number): number {
  const match = line.match(/time=(\d+):(\d+):(\d+\.\d+)/)
  if (!match) return 0
  const h = parseInt(match[1]) * 3600
  const m = parseInt(match[2]) * 60
  const s = parseFloat(match[3])
  const elapsed = h + m + s
  return duration > 0 ? Math.min((elapsed / duration) * 100, 100) : 0
}

async function runFfmpeg(args: string[], onProgress: OnProgress, duration: number, state: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = execFile("ffmpeg", args, { timeout: 600000, maxBuffer: 50 * 1024 * 1024 }, (err) => {
      if (err) reject(err)
      else resolve()
    })
    let lastPct = 0
    proc.stderr?.on("data", (chunk: Buffer) => {
      const lines = chunk.toString().split("\n")
      for (const line of lines) {
        const pct = parseFfmpegProgress(line, duration)
        if (pct > lastPct + 1) {
          lastPct = pct
          onProgress({ state, pct, detail: `${Math.round(pct)}%` })
        }
      }
    })
  })
}

// ─── 1. Audio Convert ──────────────────────────────────────────

export async function convertAudioCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<AudioJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobeAudio(inputPath)
  const format = options.format || "mp3"
  const bitrate = options.bitrate || "192k"
  const outExt = outputExtForFormat(format)
  const outName = `${fileName.replace(/\.[^.]+$/, "")}${outExt}`
  const outputPath = join(dir, `output${outExt}`)

  onProgress({ state: "converting", pct: 10, detail: `Converting to ${format.toUpperCase()}...` })

  const args = ["-y", "-i", inputPath]
  if (format === "wav") args.push("-c:a", "pcm_s16le")
  else if (format === "flac") args.push("-c:a", "flac")
  else if (format === "aac" || format === "m4a") args.push("-c:a", "aac", "-b:a", bitrate)
  else if (format === "ogg" || format === "opus") args.push("-c:a", "libvorbis", "-b:a", bitrate)
  else args.push("-c:a", "libmp3lame", "-b:a", bitrate)
  args.push("-ar", "44100", "-ac", "2", outputPath)

  await runFfmpeg(args, onProgress, probe.duration, "converting", outputPath)

  onProgress({ state: "done", pct: 100, detail: "Conversion complete" })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "converted-", format, bitrate, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── 2. Audio Compress ─────────────────────────────────────────

export async function compressAudioCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<AudioJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobeAudio(inputPath)
  const level = options.level || "balanced"
  const ext = extFromName(fileName)
  const outName = `compressed-${fileName}`
  const outputPath = join(dir, `output${ext}`)

  const bitrateMap: Record<string, string> = { balanced: "128k", strong: "96k", maximum: "64k" }
  const targetBitrate = bitrateMap[level] || "128k"

  onProgress({ state: "compressing", pct: 10, detail: `Compressing at ${targetBitrate}...` })

  const args = ["-y", "-i", inputPath, "-c:a", "libmp3lame", "-b:a", targetBitrate, "-ar", "44100", "-ac", "2", outputPath]
  await runFfmpeg(args, onProgress, probe.duration, "compressing", outputPath)

  onProgress({ state: "done", pct: 100, detail: "Compression complete" })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "compressed-", level, targetBitrate, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── 3. Extract Audio from Video ───────────────────────────────

export async function extractAudioFromVideoCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<AudioJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobeAudio(inputPath)
  const format = options.format || "mp3"
  const bitrate = options.bitrate || "192k"
  const outExt = outputExtForFormat(format)
  const outName = `${fileName.replace(/\.[^.]+$/, "")}${outExt}`
  const outputPath = join(dir, `output${outExt}`)

  onProgress({ state: "extracting", pct: 10, detail: `Extracting audio as ${format.toUpperCase()}...` })

  const args = ["-y", "-i", inputPath, "-vn"]
  if (format === "wav") args.push("-c:a", "pcm_s16le")
  else if (format === "flac") args.push("-c:a", "flac")
  else if (format === "aac" || format === "m4a") args.push("-c:a", "aac", "-b:a", bitrate)
  else if (format === "ogg" || format === "opus") args.push("-c:a", "libvorbis", "-b:a", bitrate)
  else args.push("-c:a", "libmp3lame", "-b:a", bitrate)
  args.push("-ar", "44100", "-ac", "2", outputPath)

  await runFfmpeg(args, onProgress, probe.duration, "extracting", outputPath)

  onProgress({ state: "done", pct: 100, detail: "Audio extracted" })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "extracted-", format, bitrate, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── 4. Trim Audio ─────────────────────────────────────────────

export async function trimAudioCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<AudioJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobeAudio(inputPath)
  const start = parseTimeString(options.start)
  const end = options.end ? parseTimeString(options.end) : probe.duration
  const duration = end - start
  const ext = extFromName(fileName)
  const outName = `trimmed-${fileName}`
  const outputPath = join(dir, `output${ext}`)

  onProgress({ state: "trimming", pct: 10, detail: `Trimming ${start}s to ${end}s...` })

  const args = ["-y", "-i", inputPath, "-ss", String(start), "-to", String(end), "-c", "copy", "-avoid_negative_ts", "make_zero", outputPath]
  await runFfmpeg(args, onProgress, duration, "trimming", outputPath)

  onProgress({ state: "done", pct: 100, detail: "Trim complete" })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "trimmed-", start, end, duration, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── 5. Merge Audio ────────────────────────────────────────────

export async function mergeAudioCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress, allFiles?: { buf: ArrayBuffer; name: string }[]
): Promise<AudioJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)

  const files = allFiles || [{ buf, name: fileName }]
  const inputPaths: string[] = []

  for (let i = 0; i < files.length; i++) {
    const p = join(dir, `input_${i}${extFromName(files[i].name)}`)
    await writeFile(p, new Uint8Array(files[i].buf))
    inputPaths.push(p)
  }

  onProgress({ state: "merging", pct: 10, detail: `Merging ${files.length} files...` })

  let totalDuration = 0
  for (const p of inputPaths) {
    const pr = await ffprobeAudio(p)
    totalDuration += pr.duration
  }

  const concatFile = join(dir, "concat.txt")
  const content = inputPaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join("\n")
  await writeFile(concatFile, content)

  const ext = extFromName(files[0].name)
  const outName = `merged${ext}`
  const outputPath = join(dir, `output${ext}`)

  const args = ["-y", "-f", "concat", "-safe", "0", "-i", concatFile, "-c", "copy", outputPath]
  await runFfmpeg(args, onProgress, totalDuration, "merging", outputPath)

  onProgress({ state: "done", pct: 100, detail: "Merge complete" })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "merged-", fileCount: files.length, totalDuration, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── 6. Remove Noise ───────────────────────────────────────────

export async function removeNoiseCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<AudioJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobeAudio(inputPath)
  const sensitivity = options.sensitivity || "medium"
  const ext = extFromName(fileName)
  const outName = `denoised-${fileName}`
  const outputPath = join(dir, `output${ext}`)

  const noiseMap: Record<string, string> = { light: "0.01", medium: "0.03", strong: "0.06" }
  const noiseLevel = noiseMap[sensitivity] || "0.03"

  onProgress({ state: "denoising", pct: 10, detail: `Applying ${sensitivity} noise reduction...` })

  const args = ["-y", "-i", inputPath, "-af", `afftdn=nf=-25:nr=${parseFloat(noiseLevel) * 1000}:nt=w`, outputPath]
  await runFfmpeg(args, onProgress, probe.duration, "denoising", outputPath)

  onProgress({ state: "done", pct: 100, detail: "Noise removal complete" })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "denoised-", sensitivity, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── 7. Change Audio Speed ─────────────────────────────────────

export async function changeAudioSpeedCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<AudioJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobeAudio(inputPath)
  const speed = parseFloat(options.speed || "1.0")
  const ext = extFromName(fileName)
  const outName = `speed-${speed}x-${fileName}`
  const outputPath = join(dir, `output${ext}`)

  onProgress({ state: "adjusting", pct: 10, detail: `Setting speed to ${speed}x...` })

  const atempoParts: string[] = []
  let remaining = speed
  while (remaining > 2.0) { atempoParts.push("atempo=2.0"); remaining /= 2.0 }
  while (remaining < 0.5) { atempoParts.push("atempo=0.5"); remaining /= 0.5 }
  atempoParts.push(`atempo=${remaining.toFixed(2)}`)
  const atempoFilter = atempoParts.join(",")

  const newDuration = probe.duration / speed
  const args = ["-y", "-i", inputPath, "-af", atempoFilter, "-c:a", "libmp3lame", "-b:a", "192k", outputPath]
  await runFfmpeg(args, onProgress, probe.duration, "adjusting", outputPath)

  onProgress({ state: "done", pct: 100, detail: `Speed set to ${speed}x` })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "speed-", speed, newDuration, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── 8. Audio Volume Booster ───────────────────────────────────

export async function boostVolumeCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<AudioJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobeAudio(inputPath)
  const gainDb = parseFloat(options.gain || "3")
  const normalize = options.normalize === "true"
  const ext = extFromName(fileName)
  const outName = `volume-${fileName}`
  const outputPath = join(dir, `output${ext}`)

  onProgress({ state: "boosting", pct: 10, detail: `${gainDb > 0 ? "Boosting" : "Reducing"} volume by ${Math.abs(gainDb)}dB...` })

  let filter = `volume=${gainDb}dB`
  if (normalize) filter += ",loudnorm=I=-16:TP=-1.5:LRA=11"

  const args = ["-y", "-i", inputPath, "-af", filter, "-c:a", "libmp3lame", "-b:a", "192k", outputPath]
  await runFfmpeg(args, onProgress, probe.duration, "boosting", outputPath)

  onProgress({ state: "done", pct: 100, detail: "Volume adjusted" })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "volume-", gainDb, normalize, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── 9. Audio Cutter & Splitter ────────────────────────────────

export async function cutAudioCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<AudioJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobeAudio(inputPath)
  const segmentsRaw = options.segments || ""
  const segments = segmentsRaw.split(";").filter(Boolean).map(s => {
    const [startStr, endStr] = s.split("-")
    return { start: parseTimeString(startStr), end: parseTimeString(endStr) }
  })

  if (segments.length === 0) {
    segments.push({ start: 0, end: probe.duration / 2 })
    segments.push({ start: probe.duration / 2, end: probe.duration })
  }

  onProgress({ state: "cutting", pct: 10, detail: `Splitting into ${segments.length} segments...` })

  const ext = extFromName(fileName)
  const outName = `split-${fileName}`
  const outputPath = join(dir, `output${ext}`)

  if (segments.length === 2) {
    const [seg1, seg2] = segments
    const args = ["-y", "-i", inputPath,
      "-filter_complex", `[0:a]atrim=start=${seg1.start}:end=${seg1.end},asetpts=PTS-STARTPTS[a1];[0:a]atrim=start=${seg2.start}:end=${seg2.end},asetpts=PTS-STARTPTS[a2];[a1][a2]concat=n=2:v=0:a=1[out]`,
      "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "192k", outputPath]
    await runFfmpeg(args, onProgress, probe.duration, "cutting", outputPath)
  } else {
    const filterParts = segments.map((seg, i) => `[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}]`)
    const concatInputs = segments.map((_, i) => `[a${i}]`).join("")
    const filter = `${filterParts.join(";")};${concatInputs}concat=n=${segments.length}:v=0:a=1[out]`
    const args = ["-y", "-i", inputPath, "-filter_complex", filter, "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "192k", outputPath]
    await runFfmpeg(args, onProgress, probe.duration, "cutting", outputPath)
  }

  onProgress({ state: "done", pct: 100, detail: `Split into ${segments.length} segments` })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "split-", segmentCount: segments.length, segments, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── 10. Voice Changer ─────────────────────────────────────────

export async function changeVoiceCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<AudioJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobeAudio(inputPath)
  const effect = options.effect || "pitch-up"
  const ext = extFromName(fileName)
  const outName = `voice-${effect}-${fileName}`
  const outputPath = join(dir, `output${ext}`)

  onProgress({ state: "transforming", pct: 10, detail: `Applying ${effect} effect...` })

  const effectFilters: Record<string, string> = {
    "pitch-up": "asetrate=44100*1.2,atempo=0.833",
    "pitch-down": "asetrate=44100*0.8,atempo=1.25",
    "robot": "vibrato=f=50:d=0.5,asetrate=44100*0.9,atempo=1.11",
    "echo": "aecho=0.8:0.88:60:0.4",
    "deep": "asetrate=44100*0.7,atempo=1.43",
    "helium": "asetrate=44100*1.5,atempo=0.667",
  }
  const filter = effectFilters[effect] || effectFilters["pitch-up"]

  const args = ["-y", "-i", inputPath, "-af", filter, "-c:a", "libmp3lame", "-b:a", "192k", outputPath]
  await runFfmpeg(args, onProgress, probe.duration, "transforming", outputPath)

  onProgress({ state: "done", pct: 100, detail: `Voice effect applied: ${effect}` })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "voice-", effect, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── 11. Audio Metadata Editor ─────────────────────────────────

export async function editMetadataCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<AudioJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobeAudio(inputPath)
  const ext = extFromName(fileName)
  const outName = `meta-${fileName}`
  const outputPath = join(dir, `output${ext}`)

  onProgress({ state: "processing", pct: 10, detail: "Updating metadata tags..." })

  const args = ["-y", "-i", inputPath]
  if (options.title) args.push("-metadata", `title=${options.title}`)
  if (options.artist) args.push("-metadata", `artist=${options.artist}`)
  if (options.album) args.push("-metadata", `album=${options.album}`)
  if (options.year) args.push("-metadata", `date=${options.year}`)
  if (options.genre) args.push("-metadata", `genre=${options.genre}`)
  if (options.comment) args.push("-metadata", `comment=${options.comment}`)
  args.push("-c", "copy", outputPath)

  await runFfmpeg(args, onProgress, probe.duration, "processing", outputPath)

  onProgress({ state: "done", pct: 100, detail: "Metadata updated" })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "meta-", tags: { title: options.title, artist: options.artist, album: options.album, year: options.year, genre: options.genre }, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── 12. Audio Tracks (Multi-language Extraction) ──────────────

export interface AudioTrack {
  index: number
  codec: string
  language: string
  channels: number
  sampleRate: number
  bitrate: number
  title: string
  isDefault: boolean
}

export async function probeAudioTracks(filePath: string): Promise<AudioTrack[]> {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "quiet", "-print_format", "json",
      "-show_streams", "-select_streams", "a",
      filePath,
    ], { timeout: 15000 })
    const info = JSON.parse(stdout)
    return (info.streams || []).map((s: any) => ({
      index: s.index,
      codec: s.codec_name || "unknown",
      language: s.tags?.language || s.tags?.LANGUAGE || "und",
      channels: parseInt(s.channels || "2"),
      sampleRate: parseInt(s.sample_rate || "44100"),
      bitrate: parseInt(s.bit_rate || "0"),
      title: s.tags?.title || s.tags?.TITLE || "",
      isDefault: (s.disposition?.default === 1),
    }))
  } catch {
    return []
  }
}

export async function extractAudioTracksCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<AudioJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const tracks = await probeAudioTracks(inputPath)
  const selectedIndices = (options.tracks || "").split(",").filter(Boolean).map(Number)

  if (selectedIndices.length === 0) {
    for (let i = 0; i < tracks.length; i++) selectedIndices.push(i)
  }

  const probe = await ffprobeAudio(inputPath)
  const outName = `tracks-${fileName.replace(/\.[^.]+$/, "")}.zip`
  const zipPath = join(dir, "output.zip")
  const extractedFiles: string[] = []

  onProgress({ state: "extracting", pct: 5, detail: `Extracting ${selectedIndices.length} audio track${selectedIndices.length > 1 ? "s" : ""}...` })

  for (let i = 0; i < selectedIndices.length; i++) {
    const idx = selectedIndices[i]
    const track = tracks[idx]
    if (!track) continue

    const pct = 5 + ((i + 1) / selectedIndices.length) * 85
    const lang = track.language !== "und" ? track.language : `track${idx}`
    const trackExt = ".mp3"
    const trackName = `${lang}-track${idx + 1}${trackExt}`
    const trackPath = join(dir, trackName)

    onProgress({ state: "extracting", pct, detail: `Extracting track ${i + 1}/${selectedIndices.length}: ${lang} (${track.codec})...` })

    const args = ["-y", "-i", inputPath, "-map", `0:a:${idx}`, "-codec:a", "libmp3lame", "-qscale:a", "2", trackPath]
    try {
      await runFfmpeg(args, onProgress, probe.duration, "extracting", trackPath)
      extractedFiles.push(trackPath)
    } catch (err: any) {
      console.error(`Failed to extract track ${idx}:`, err.message)
    }
  }

  if (extractedFiles.length === 1) {
    const singleFile = extractedFiles[0]
    const ext = extFromName(singleFile)
    const outNameSingle = `extracted${ext}`
    const { rename } = await import("fs/promises")
    await rename(singleFile, zipPath)

    onProgress({ state: "done", pct: 100, detail: "Track extracted" })

    const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(zipPath)).byteLength, outputName: outNameSingle, toolPrefix: "extracted-", trackCount: 1, tracks: selectedIndices.map(i => tracks[i]), createdAt: Date.now() }
    await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

    return { outputPath: zipPath, outputName: outNameSingle, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
  }

  onProgress({ state: "saving", pct: 90, detail: "Packaging tracks into ZIP..." })

  if (extractedFiles.length > 1) {
    try {
      const psFiles = extractedFiles.map(f => `"${f}"`).join(",")
      await execAsync(`powershell -Command "Compress-Archive -Path ${psFiles} -DestinationPath '${zipPath}' -Force"`, { timeout: 30000 })
    } catch {
      // Fallback: just return the first file
      const singleFile = extractedFiles[0]
      const ext = extFromName(singleFile)
      const outNameSingle = `extracted${ext}`
      const { rename } = await import("fs/promises")
      await rename(singleFile, zipPath)
      const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(zipPath)).byteLength, outputName: outNameSingle, toolPrefix: "extracted-", trackCount: 1, tracks: selectedIndices.map(i => tracks[i]), createdAt: Date.now() }
      await writeFile(join(dir, "meta.json"), JSON.stringify(meta))
      return { outputPath: zipPath, outputName: outNameSingle, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
    }
  }

  onProgress({ state: "done", pct: 100, detail: `${extractedFiles.length} tracks extracted` })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(zipPath)).byteLength, outputName: outName, toolPrefix: "tracks-", trackCount: extractedFiles.length, tracks: selectedIndices.map(i => tracks[i]), createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath: zipPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Dispatcher ────────────────────────────────────────────────

export async function processAudioJob(
  toolId: string, buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress, allFiles?: { buf: ArrayBuffer; name: string }[]
): Promise<AudioJobResult> {
  switch (toolId) {
    case "audio-convert": return convertAudioCore(buf, fileName, options, onProgress)
    case "audio-compress": return compressAudioCore(buf, fileName, options, onProgress)
    case "extract-audio-from-video": return extractAudioFromVideoCore(buf, fileName, options, onProgress)
    case "trim-audio": return trimAudioCore(buf, fileName, options, onProgress)
    case "merge-audio": return mergeAudioCore(buf, fileName, options, onProgress, allFiles)
    case "remove-noise": return removeNoiseCore(buf, fileName, options, onProgress)
    case "change-audio-speed": return changeAudioSpeedCore(buf, fileName, options, onProgress)
    case "audio-volume": return boostVolumeCore(buf, fileName, options, onProgress)
    case "audio-cutter": return cutAudioCore(buf, fileName, options, onProgress)
    case "voice-changer": return changeVoiceCore(buf, fileName, options, onProgress)
    case "audio-metadata": return editMetadataCore(buf, fileName, options, onProgress)
    case "audio-tracks": return extractAudioTracksCore(buf, fileName, options, onProgress)
    default: throw new Error(`Unknown audio tool: ${toolId}`)
  }
}
