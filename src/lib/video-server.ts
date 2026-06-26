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

export interface VideoProgress {
  state: string
  pct: number
  detail?: string
}

export interface VideoJobResult {
  outputPath: string
  outputName: string
  outputSize: number
  originalSize: number
  originalName: string
  metadata?: Record<string, any>
}

type OnProgress = (evt: VideoProgress) => void

const BASE = join(tmpdir(), "phoenixtools-video")

export function getJobDir(jobId: string): string {
  return join(BASE, jobId)
}

async function createJobDir(jobId: string): Promise<string> {
  const dir = getJobDir(jobId)
  await mkdir(dir, { recursive: true })
  return dir
}

async function ffprobe(filePath: string): Promise<{
  duration: number
  width: number
  height: number
  codec: string
  fps: number
  bitrate: number
  size: number
  hasAudio: boolean
  hasVideo: boolean
  format: string
}> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "quiet",
    "-print_format", "json",
    "-show_format",
    "-show_streams",
    filePath,
  ], { maxBuffer: 10 * 1024 * 1024 })

  const info = JSON.parse(stdout)
  const videoStream = info.streams?.find((s: any) => s.codec_type === "video")
  const audioStream = info.streams?.find((s: any) => s.codec_type === "audio")
  const fmt = info.format || {}

  return {
    duration: parseFloat(fmt.duration || "0"),
    width: videoStream?.width || 0,
    height: videoStream?.height || 0,
    codec: videoStream?.codec_name || "unknown",
    fps: parseFrameRate(videoStream?.r_frame_rate || "30"),
    bitrate: parseInt(fmt.bit_rate || "0"),
    size: parseInt(fmt.size || "0"),
    hasAudio: !!audioStream,
    hasVideo: !!videoStream,
    format: fmt.format_name || "unknown",
  }
}

function parseFrameRate(rate: string): number {
  if (!rate) return 30
  if (rate.includes("/")) {
    const [num, den] = rate.split("/").map(Number)
    if (den && den > 0) return Math.round((num / den) * 100) / 100
  }
  const parsed = parseFloat(rate)
  return isNaN(parsed) ? 30 : parsed
}

function parseFfmpegProgress(stderr: string): number | null {
  const timeMatch = stderr.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/)
  if (timeMatch) {
    const hours = parseInt(timeMatch[1])
    const minutes = parseInt(timeMatch[2])
    const seconds = parseInt(timeMatch[3])
    return hours * 3600 + minutes * 60 + seconds
  }
  return null
}

async function runFfmpeg(args: string[], onProgress: OnProgress, totalDuration: number, stage: string, outputPath?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = execFile("ffmpeg", args, { maxBuffer: 50 * 1024 * 1024 }, async (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`FFmpeg error: ${err.message}\n${stderr}`))
        return
      }
      try {
        const outPath = outputPath || args[args.length - 1]
        const buf = await readFile(outPath)
        resolve(buf)
      } catch (e: any) {
        reject(new Error(`Failed to read output: ${e.message}`))
      }
    })

    let lastProgress = 0
    proc.stderr?.on("data", (data: Buffer) => {
      const text = data.toString()
      const currentTime = parseFfmpegProgress(text)
      if (currentTime !== null && totalDuration > 0) {
        const pct = Math.min(95, Math.round((currentTime / totalDuration) * 100))
        if (pct > lastProgress) {
          lastProgress = pct
          onProgress({ state: stage, pct, detail: `${Math.round(currentTime)}s / ${Math.round(totalDuration)}s` })
        }
      }
    })
  })
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "video/mp4": ".mp4", "video/webm": ".webm", "video/avi": ".avi",
    "video/quicktime": ".mov", "video/x-msvideo": ".avi",
    "video/x-matroska": ".mkv", "video/ogg": ".ogv",
  }
  return map[mime] || ".mp4"
}

function extFromName(fileName: string): string {
  return "." + fileName.split(".").pop()?.toLowerCase()
}

function mimeFromExt(ext: string): string {
  const map: Record<string, string> = {
    ".mp4": "video/mp4", ".webm": "video/webm", ".avi": "video/avi",
    ".mov": "video/quicktime", ".mkv": "video/x-matroska", ".ogv": "video/ogg",
    ".mp3": "audio/mpeg", ".wav": "audio/wav", ".aac": "audio/aac",
    ".ogg": "audio/ogg", ".flac": "audio/flac",
  }
  return map[ext] || "video/mp4"
}

// ─── Video Trim ─────────────────────────────────────────────────

export async function trimVideoCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<VideoJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobe(inputPath)
  const start = parseTimeString(options.start)
  const end = options.end ? parseTimeString(options.end) : probe.duration
  const duration = end - start

  onProgress({ state: "trimming", pct: 10, detail: `Trimming ${start}s to ${end}s...` })

  const outName = `trimmed-${fileName.replace(/\.[^.]+$/, "")}.mp4`
  const outputPath = join(dir, "output.mp4")

  await runFfmpeg([
    "-y", "-i", inputPath,
    "-ss", String(start), "-to", String(end),
    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    outputPath,
  ], onProgress, duration, "trimming", outputPath)

  onProgress({ state: "done", pct: 100, detail: "Trim complete" })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "trimmed-", duration, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Video Compress ─────────────────────────────────────────────

export async function compressVideoCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<VideoJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobe(inputPath)
  const level = options.level || "balanced"

  onProgress({ state: "analyzing", pct: 10, detail: `Analyzing ${probe.width}×${probe.height} video...` })

  const crfMap: Record<string, string> = { balanced: "28", strong: "32", maximum: "36" }
  const presetMap: Record<string, string> = { balanced: "fast", strong: "medium", maximum: "slow" }
  const crf = crfMap[level] || "28"
  const preset = presetMap[level] || "fast"

  let scaleFilter = ""
  if (level === "maximum" && probe.height > 720) {
    scaleFilter = `-vf "scale=-2:720"`
  } else if (level === "strong" && probe.height > 1080) {
    scaleFilter = `-vf "scale=-2:1080"`
  }

  const outName = `compressed-${fileName.replace(/\.[^.]+$/, "")}.mp4`
  const outputPath = join(dir, "output.mp4")

  const args = [
    "-y", "-i", inputPath,
    "-c:v", "libx264", "-crf", crf, "-preset", preset,
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
  ]
  if (scaleFilter) args.push(...scaleFilter.split(" "))
  args.push(outputPath)

  await runFfmpeg(args, onProgress, probe.duration, "compressing", outputPath)

  const outputMeta = await ffprobe(outputPath)
  const savings = Math.round((1 - outputMeta.size / probe.size) * 100)

  onProgress({ state: "done", pct: 100, detail: `Compressed ${savings}% — ${Math.round(probe.size / 1024 / 1024)}MB → ${Math.round(outputMeta.size / 1024 / 1024)}MB` })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: outputMeta.size, outputName: outName, toolPrefix: "compressed-", savings, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: outputMeta.size, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Video Convert ──────────────────────────────────────────────

export async function convertVideoCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<VideoJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobe(inputPath)
  const format = options.format || "mp4"

  onProgress({ state: "converting", pct: 10, detail: `Converting to ${format.toUpperCase()}...` })

  const extMap: Record<string, string> = { mp4: ".mp4", webm: ".webm", avi: ".avi", mov: ".mov", mkv: ".mkv" }
  const codecMap: Record<string, string[]> = {
    mp4: ["-c:v", "libx264", "-crf", "23", "-preset", "fast", "-c:a", "aac", "-b:a", "128k"],
    webm: ["-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-c:a", "libopus", "-b:a", "128k"],
    avi: ["-c:v", "libx264", "-crf", "23", "-c:a", "mp3", "-b:a", "128k"],
    mov: ["-c:v", "libx264", "-crf", "23", "-preset", "fast", "-c:a", "aac", "-b:a", "128k"],
    mkv: ["-c:v", "libx264", "-crf", "23", "-preset", "fast", "-c:a", "aac", "-b:a", "128k"],
  }

  const outName = `converted-${fileName.replace(/\.[^.]+$/, "")}${extMap[format] || ".mp4"}`
  const outputPath = join(dir, `output${extMap[format] || ".mp4"}`)

  await runFfmpeg([
    "-y", "-i", inputPath,
    ...(codecMap[format] || codecMap.mp4),
    "-movflags", "+faststart",
    outputPath,
  ], onProgress, probe.duration, "converting", outputPath)

  onProgress({ state: "done", pct: 100, detail: `Converted to ${format.toUpperCase()}` })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "converted-", targetFormat: format, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Video to GIF ───────────────────────────────────────────────

export async function videoToGifCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<VideoJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobe(inputPath)
  const start = parseTimeString(options.start)
  const duration = parseTimeString(options.duration) || 5
  const fps = parseInt(options.fps || "15")
  const width = parseInt(options.width || "480")

  onProgress({ state: "generating", pct: 10, detail: `Generating ${duration}s GIF at ${width}px...` })

  const outName = `animation-${fileName.replace(/\.[^.]+$/, "")}.gif`
  const outputPath = join(dir, "output.gif")
  const palettePath = join(dir, "palette.png")

  await runFfmpeg([
    "-y", "-ss", String(start), "-t", String(duration),
    "-i", inputPath,
    "-vf", `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen=stats_mode=diff`,
    palettePath,
  ], onProgress, duration * 0.5, "generating palette", palettePath)

  await runFfmpeg([
    "-y", "-ss", String(start), "-t", String(duration),
    "-i", inputPath,
    "-i", palettePath,
    "-lavfi", `fps=${fps},scale=${width}:-1:flags=lanczos [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5`,
    outputPath,
  ], onProgress, duration, "generating gif", outputPath)

  onProgress({ state: "done", pct: 100, detail: `GIF: ${width}px, ${fps}fps, ${duration}s` })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "animation-", gifFps: fps, gifWidth: width, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Extract Audio ──────────────────────────────────────────────

export async function extractAudioCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<VideoJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobe(inputPath)
  const format = options.format || "mp3"
  const bitrate = options.bitrate || "192k"

  onProgress({ state: "extracting", pct: 10, detail: `Extracting audio as ${format.toUpperCase()}...` })

  const extMap: Record<string, string> = { mp3: ".mp3", wav: ".wav", aac: ".aac", ogg: ".ogg", flac: ".flac" }
  const codecMap: Record<string, string[]> = {
    mp3: ["-c:a", "libmp3lame", "-b:a", bitrate],
    wav: ["-c:a", "pcm_s16le"],
    aac: ["-c:a", "aac", "-b:a", bitrate],
    ogg: ["-c:a", "libvorbis", "-b:a", bitrate],
    flac: ["-c:a", "flac"],
  }

  const outName = `audio-${fileName.replace(/\.[^.]+$/, "")}${extMap[format] || ".mp3"}`
  const outputPath = join(dir, `output${extMap[format] || ".mp3"}`)

  await runFfmpeg([
    "-y", "-i", inputPath,
    "-vn",
    ...(codecMap[format] || codecMap.mp3),
    outputPath,
  ], onProgress, probe.duration, "extracting", outputPath)

  onProgress({ state: "done", pct: 100, detail: `Audio extracted: ${format.toUpperCase()} ${bitrate}` })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "audio-", audioFormat: format, bitrate, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Merge Video ────────────────────────────────────────────────

export async function mergeVideoCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<VideoJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const extraFiles: string[] = options.extraFiles ? JSON.parse(options.extraFiles) : []
  const inputPaths = [inputPath]
  for (let i = 0; i < extraFiles.length; i++) {
    const extraPath = join(dir, `extra_${i}${extFromName(extraFiles[i] || ".mp4")}`)
    inputPaths.push(extraPath)
  }

  onProgress({ state: "merging", pct: 10, detail: `Merging ${inputPaths.length} videos...` })

  const outName = `merged-${fileName.replace(/\.[^.]+$/, "")}.mp4`
  const outputPath = join(dir, "output.mp4")
  const concatList = join(dir, "concat.txt")
  const listContent = inputPaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join("\n")
  await writeFile(concatList, listContent)

  const probe = await ffprobe(inputPath)

  await runFfmpeg([
    "-y", "-f", "concat", "-safe", "0", "-i", concatList,
    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    outputPath,
  ], onProgress, probe.duration * inputPaths.length, "merging", outputPath)

  onProgress({ state: "done", pct: 100, detail: `Merged ${inputPaths.length} videos` })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "merged-", clipCount: inputPaths.length, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Resize Video ───────────────────────────────────────────────

export async function resizeVideoCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<VideoJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobe(inputPath)
  const width = parseInt(options.width || "1280")
  const height = parseInt(options.height || "720")

  onProgress({ state: "resizing", pct: 10, detail: `Resizing ${probe.width}×${probe.height} → ${width}×${height}...` })

  const outName = `resized-${fileName.replace(/\.[^.]+$/, "")}.mp4`
  const outputPath = join(dir, "output.mp4")

  await runFfmpeg([
    "-y", "-i", inputPath,
    "-vf", `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`,
    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    outputPath,
  ], onProgress, probe.duration, "resizing", outputPath)

  onProgress({ state: "done", pct: 100, detail: `Resized to ${width}×${height}` })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "resized-", targetWidth: width, targetHeight: height, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Crop Video ─────────────────────────────────────────────────

export async function cropVideoCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<VideoJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobe(inputPath)
  const aspect = options.aspect || "16:9"

  onProgress({ state: "cropping", pct: 10, detail: `Cropping to ${aspect}...` })

  const [aw, ah] = aspect.split(":").map(Number)
  let cropW: number, cropH: number
  if (probe.width / probe.height > aw / ah) {
    cropH = probe.height
    cropW = Math.round(cropH * (aw / ah) / 2) * 2
  } else {
    cropW = probe.width
    cropH = Math.round(cropW * (ah / aw) / 2) * 2
  }
  const x = Math.round((probe.width - cropW) / 2 / 2) * 2
  const y = Math.round((probe.height - cropH) / 2 / 2) * 2

  const outName = `cropped-${fileName.replace(/\.[^.]+$/, "")}.mp4`
  const outputPath = join(dir, "output.mp4")

  await runFfmpeg([
    "-y", "-i", inputPath,
    "-vf", `crop=${cropW}:${cropH}:${x}:${y}`,
    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    outputPath,
  ], onProgress, probe.duration, "cropping", outputPath)

  onProgress({ state: "done", pct: 100, detail: `Cropped to ${cropW}×${cropH} (${aspect})` })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "cropped-", aspect, cropWidth: cropW, cropHeight: cropH, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Add Audio to Video ─────────────────────────────────────────

export async function addAudioVideoCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<VideoJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobe(inputPath)
  const audioFile = options.audioFile || ""
  const audioPath = audioFile ? join(dir, `audio${extFromName(audioFile)}`) : ""
  const volume = options.volume || "1.0"
  const mode = options.mode || "replace"

  onProgress({ state: "mixing", pct: 10, detail: "Adding audio track..." })

  const outName = `with-audio-${fileName.replace(/\.[^.]+$/, "")}.mp4`
  const outputPath = join(dir, "output.mp4")

  const args = ["-y", "-i", inputPath]
  if (audioPath && existsSync(audioPath)) {
    args.push("-i", audioPath)
  }

  if (mode === "mix" && audioPath && existsSync(audioPath)) {
    args.push(
      "-filter_complex", `[1:a]volume=${volume}[a1];[0:a][a1]amix=inputs=2:duration=first[aout]`,
      "-map", "0:v", "-map", "[aout]",
    )
  } else if (audioPath && existsSync(audioPath)) {
    args.push(
      "-i", audioPath,
      "-map", "0:v", "-map", "1:a",
      "-filter_complex", `[1:a]volume=${volume}[aout]`,
      "-map", "[aout]",
    )
  } else {
    args.push("-an")
  }

  args.push(
    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
    "-c:a", "aac", "-b:a", "192k",
    "-shortest",
    "-movflags", "+faststart",
    outputPath,
  )

  await runFfmpeg(args, onProgress, probe.duration, "mixing", outputPath)

  onProgress({ state: "done", pct: 100, detail: "Audio added to video" })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "with-audio-", audioMode: mode, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Change Video Speed ─────────────────────────────────────────

export async function changeSpeedVideoCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<VideoJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobe(inputPath)
  const speed = parseFloat(options.speed || "1.0")

  onProgress({ state: "adjusting", pct: 10, detail: `Setting speed to ${speed}×...` })

  const outName = `speed-${speed}x-${fileName.replace(/\.[^.]+$/, "")}.mp4`
  const outputPath = join(dir, "output.mp4")

  const videoFilter = `setpts=${1/speed}*PTS`
  const audioFilter = `atempo=${Math.min(2.0, Math.max(0.5, speed))}`

  const extraFilters = speed > 2 ? [`atempo=${Math.min(2.0, speed / 2)}`] : []

  await runFfmpeg([
    "-y", "-i", inputPath,
    "-filter_complex", `[0:v]${videoFilter}[v];[0:a]${audioFilter}${extraFilters.length ? "," + extraFilters.join(",") : ""}[a]`,
    "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    outputPath,
  ], onProgress, probe.duration / speed, "adjusting speed", outputPath)

  onProgress({ state: "done", pct: 100, detail: `Speed set to ${speed}×` })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "speed-", speed, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Mute Video ─────────────────────────────────────────────────

export async function muteVideoCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<VideoJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobe(inputPath)

  onProgress({ state: "muting", pct: 10, detail: "Removing audio track..." })

  const outName = `muted-${fileName.replace(/\.[^.]+$/, "")}.mp4`
  const outputPath = join(dir, "output.mp4")

  await runFfmpeg([
    "-y", "-i", inputPath,
    "-an",
    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
    "-movflags", "+faststart",
    outputPath,
  ], onProgress, probe.duration, "muting", outputPath)

  onProgress({ state: "done", pct: 100, detail: "Audio removed" })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "muted-", createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Rotate & Flip Video ────────────────────────────────────────

export async function rotateVideoCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<VideoJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobe(inputPath)
  const action = options.action || "rotate-90"

  onProgress({ state: "transforming", pct: 10, detail: `Applying ${action}...` })

  const outName = `rotated-${fileName.replace(/\.[^.]+$/, "")}.mp4`
  const outputPath = join(dir, "output.mp4")

  const filterMap: Record<string, string> = {
    "rotate-90": "transpose=1",
    "rotate-270": "transpose=2",
    "rotate-180": "transpose=1,transpose=1",
    "flip-h": "hflip",
    "flip-v": "vflip",
    "rotate-90+flip-h": "transpose=1,hflip",
  }

  await runFfmpeg([
    "-y", "-i", inputPath,
    "-vf", filterMap[action] || "transpose=1",
    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    outputPath,
  ], onProgress, probe.duration, "transforming", outputPath)

  onProgress({ state: "done", pct: 100, detail: `Applied ${action}` })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "rotated-", action, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Video Watermark ────────────────────────────────────────────

export async function watermarkVideoCore(
  buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<VideoJobResult> {
  const jobId = randomUUID()
  const dir = await createJobDir(jobId)
  const inputPath = join(dir, `input${extFromName(fileName)}`)
  await writeFile(inputPath, new Uint8Array(buf))

  const probe = await ffprobe(inputPath)
  const text = options.text || "WATERMARK"
  const position = options.position || "bottom-right"
  const fontSize = options.fontSize || "24"
  const opacity = options.opacity || "0.5"

  onProgress({ state: "watermarking", pct: 10, detail: `Adding "${text}" watermark...` })

  const outName = `watermarked-${fileName.replace(/\.[^.]+$/, "")}.mp4`
  const outputPath = join(dir, "output.mp4")

  const posMap: Record<string, { x: string; y: string }> = {
    "center": { x: "(w-tw)/2", y: "(h-th)/2" },
    "top-left": { x: "20", y: "20" },
    "top-right": { x: "w-tw-20", y: "20" },
    "bottom-left": { x: "20", y: "h-th-20" },
    "bottom-right": { x: "w-tw-20", y: "h-th-20" },
  }

  const escapedText = text.replace(/'/g, "'\\''")
  const pos = posMap[position] || posMap["bottom-right"]

  const audioArgs = probe.hasAudio ? `-c:a aac -b:a 128k` : `-an`
  const cmd = `ffmpeg -y -i "${inputPath}" -vf "drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=white:x=${pos.x}:y=${pos.y}" -c:v libx264 -preset fast -crf 23 ${audioArgs} -movflags +faststart "${outputPath}"`

  onProgress({ state: "watermarking", pct: 30, detail: `Adding "${text}" watermark...` })

  try {
    await execAsync(cmd, { maxBuffer: 50 * 1024 * 1024 })
  } catch (err: any) {
    throw new Error(`FFmpeg error: ${err.message}`)
  }

  onProgress({ state: "done", pct: 100, detail: `Watermark "${text}" added` })

  const meta = { jobId, originalName: fileName, originalSize: buf.byteLength, outputSize: (await readFile(outputPath)).byteLength, outputName: outName, toolPrefix: "watermarked-", watermarkText: text, position, createdAt: Date.now() }
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta))

  return { outputPath, outputName: outName, outputSize: meta.outputSize, originalSize: buf.byteLength, originalName: fileName, metadata: meta }
}

// ─── Dispatcher ─────────────────────────────────────────────────

export async function processVideoJob(
  toolId: string, buf: ArrayBuffer, fileName: string, options: Record<string, string>, onProgress: OnProgress
): Promise<VideoJobResult> {
  switch (toolId) {
    case "video-trim": return trimVideoCore(buf, fileName, options, onProgress)
    case "video-compress": return compressVideoCore(buf, fileName, options, onProgress)
    case "video-convert": return convertVideoCore(buf, fileName, options, onProgress)
    case "video-to-gif": return videoToGifCore(buf, fileName, options, onProgress)
    case "extract-audio": return extractAudioCore(buf, fileName, options, onProgress)
    case "merge-video": return mergeVideoCore(buf, fileName, options, onProgress)
    case "resize-video": return resizeVideoCore(buf, fileName, options, onProgress)
    case "crop-video": return cropVideoCore(buf, fileName, options, onProgress)
    case "add-audio-to-video": return addAudioVideoCore(buf, fileName, options, onProgress)
    case "change-video-speed": return changeSpeedVideoCore(buf, fileName, options, onProgress)
    case "mute-video": return muteVideoCore(buf, fileName, options, onProgress)
    case "rotate-flip-video": return rotateVideoCore(buf, fileName, options, onProgress)
    case "video-watermark": return watermarkVideoCore(buf, fileName, options, onProgress)
    default: throw new Error(`Unknown video tool: ${toolId}`)
  }
}

export async function cleanupOldJobs(maxAgeMs = 30 * 60 * 1000) {
  try {
    if (!existsSync(BASE)) return
    const entries = await readdir(BASE, { withFileTypes: true })
    const now = Date.now()
    for (const e of entries) {
      if (e.isDirectory()) {
        const dir = join(BASE, e.name)
        try {
          const metaPath = join(dir, "meta.json")
          if (existsSync(metaPath)) {
            const meta = JSON.parse(await readFile(metaPath, "utf-8"))
            if (now - (meta.createdAt || 0) > maxAgeMs) {
              const { rm } = await import("fs/promises")
              await rm(dir, { recursive: true, force: true })
            }
          }
        } catch {}
      }
    }
  } catch {}
}
