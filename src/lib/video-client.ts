import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export interface ClientProcessResult {
  blob: Blob;
  filename: string;
  pagePreviews?: string[];
}

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoaded = false;

async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegLoaded) return ffmpegInstance;

  ffmpegInstance = new FFmpeg();

  ffmpegInstance.on("progress", ({ progress }: { progress: number }) => {
    // Could emit progress events here if needed
  });

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ffmpegInstance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegLoaded = true;
  return ffmpegInstance;
}

export async function processVideoTool(
  toolId: string,
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const ffmpeg = await loadFFmpeg();

  switch (toolId) {
    case "video-trim":
      return trimVideo(ffmpeg, files, options);
    case "video-compress":
      return compressVideo(ffmpeg, files, options);
    case "video-convert":
      return convertVideo(ffmpeg, files, options);
    case "video-to-gif":
      return videoToGif(ffmpeg, files, options);
    case "video-extract-audio":
      return extractAudio(ffmpeg, files);
    case "video-merge":
      return mergeVideos(ffmpeg, files);
    case "video-resize":
      return resizeVideo(ffmpeg, files, options);
    case "video-crop":
      return cropVideo(ffmpeg, files, options);
    case "video-add-audio":
      return addAudioToVideo(ffmpeg, files);
    case "video-change-speed":
      return changeSpeed(ffmpeg, files, options);
    case "video-mute":
      return muteVideo(ffmpeg, files);
    case "video-rotate-flip":
      return rotateFlipVideo(ffmpeg, files, options);
    default:
      return processGenericVideo(ffmpeg, files);
  }
}

async function trimVideo(
  ffmpeg: FFmpeg,
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const start = (options.start as string) || "00:00:00";
  const duration = (options.duration as string) || "00:00:10";
  const inputName = `input_${Date.now()}${getExtension(file.name)}`;
  const outputName = `output_${Date.now()}.mp4`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-ss", start,
    "-t", duration,
    "-i", inputName,
    "-c", "copy",
    outputName,
  ]);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  const blob = new Blob([toBlobPart(data)], { type: "video/mp4" });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_trimmed.mp4` };
}

async function compressVideo(
  ffmpeg: FFmpeg,
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const quality = (options.quality as number) || 28;
  const inputName = `input_${Date.now()}${getExtension(file.name)}`;
  const outputName = `output_${Date.now()}.mp4`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    "-c:v", "libx264",
    "-crf", String(quality),
    "-preset", "fast",
    outputName,
  ]);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  const blob = new Blob([toBlobPart(data)], { type: "video/mp4" });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_compressed.mp4` };
}

async function convertVideo(
  ffmpeg: FFmpeg,
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const format = (options.format as string) || "mp4";
  const inputName = `input_${Date.now()}${getExtension(file.name)}`;
  const outputName = `output_${Date.now()}.${format}`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    "-c:v", "libx264",
    "-c:a", "aac",
    outputName,
  ]);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  const blob = new Blob([toBlobPart(data)], { type: `video/${format}` });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}.${format}` };
}

async function videoToGif(
  ffmpeg: FFmpeg,
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const fps = (options.fps as number) || 10;
  const width = (options.width as number) || 320;
  const inputName = `input_${Date.now()}${getExtension(file.name)}`;
  const outputName = `output_${Date.now()}.gif`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    "-vf", `fps=${fps},scale=${width}:-1:flags=lanczos`,
    outputName,
  ]);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  const blob = new Blob([toBlobPart(data)], { type: "image/gif" });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}.gif` };
}

async function extractAudio(
  ffmpeg: FFmpeg,
  files: File[]
): Promise<ClientProcessResult> {
  const file = files[0];
  const inputName = `input_${Date.now()}${getExtension(file.name)}`;
  const outputName = `output_${Date.now()}.mp3`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    "-vn",
    "-c:a", "libmp3lame",
    outputName,
  ]);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  const blob = new Blob([toBlobPart(data)], { type: "audio/mpeg" });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_audio.mp3` };
}

async function mergeVideos(
  ffmpeg: FFmpeg,
  files: File[]
): Promise<ClientProcessResult> {
  const inputNames: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const name = `input${i}_${Date.now()}${getExtension(files[i].name)}`;
    await ffmpeg.writeFile(name, await fetchFile(files[i]));
    inputNames.push(name);
  }
  const listContent = inputNames.map((n) => `file '${n}'`).join("\n");
  await ffmpeg.writeFile("list.txt", new TextEncoder().encode(listContent));
  const outputName = `output_${Date.now()}.mp4`;
  await ffmpeg.exec([
    "-f", "concat",
    "-safe", "0",
    "-i", "list.txt",
    "-c", "copy",
    outputName,
  ]);
  const data = await ffmpeg.readFile(outputName);
  for (const name of inputNames) await ffmpeg.deleteFile(name);
  await ffmpeg.deleteFile("list.txt");
  await ffmpeg.deleteFile(outputName);
  const blob = new Blob([toBlobPart(data)], { type: "video/mp4" });
  return { blob, filename: "merged.mp4" };
}

async function resizeVideo(
  ffmpeg: FFmpeg,
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const width = (options.width as number) || 640;
  const height = (options.height as number) || 480;
  const inputName = `input_${Date.now()}${getExtension(file.name)}`;
  const outputName = `output_${Date.now()}.mp4`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    "-vf", `scale=${width}:${height}`,
    outputName,
  ]);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  const blob = new Blob([toBlobPart(data)], { type: "video/mp4" });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_${width}x${height}.mp4` };
}

async function cropVideo(
  ffmpeg: FFmpeg,
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const width = (options.width as number) || 320;
  const height = (options.height as number) || 240;
  const x = (options.x as number) || 0;
  const y = (options.y as number) || 0;
  const inputName = `input_${Date.now()}${getExtension(file.name)}`;
  const outputName = `output_${Date.now()}.mp4`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    "-vf", `crop=${width}:${height}:${x}:${y}`,
    outputName,
  ]);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  const blob = new Blob([toBlobPart(data)], { type: "video/mp4" });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_cropped.mp4` };
}

async function addAudioToVideo(
  ffmpeg: FFmpeg,
  files: File[]
): Promise<ClientProcessResult> {
  const videoFile = files[0];
  const audioFile = files[1] || files[0];
  const videoName = `video_${Date.now()}${getExtension(videoFile.name)}`;
  const audioName = `audio_${Date.now()}${getExtension(audioFile.name)}`;
  const outputName = `output_${Date.now()}.mp4`;
  await ffmpeg.writeFile(videoName, await fetchFile(videoFile));
  await ffmpeg.writeFile(audioName, await fetchFile(audioFile));
  await ffmpeg.exec([
    "-i", videoName,
    "-i", audioName,
    "-c:v", "copy",
    "-map", "0:v:0",
    "-map", "1:a:0",
    outputName,
  ]);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(videoName);
  await ffmpeg.deleteFile(audioName);
  await ffmpeg.deleteFile(outputName);
  const blob = new Blob([toBlobPart(data)], { type: "video/mp4" });
  const baseName = videoFile.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_with_audio.mp4` };
}

async function changeSpeed(
  ffmpeg: FFmpeg,
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const speed = (options.speed as number) || 1.5;
  const inputName = `input_${Date.now()}${getExtension(file.name)}`;
  const outputName = `output_${Date.now()}.mp4`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    "-filter_complex",
    `[0:v]setpts=${1/speed}*PTS[v];[0:a]atempo=${speed}[a]`,
    "-map", "[v]",
    "-map", "[a]",
    outputName,
  ]);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  const blob = new Blob([toBlobPart(data)], { type: "video/mp4" });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_speed_${speed}x.mp4` };
}

async function muteVideo(
  ffmpeg: FFmpeg,
  files: File[]
): Promise<ClientProcessResult> {
  const file = files[0];
  const inputName = `input_${Date.now()}${getExtension(file.name)}`;
  const outputName = `output_${Date.now()}.mp4`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    "-an",
    outputName,
  ]);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  const blob = new Blob([toBlobPart(data)], { type: "video/mp4" });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_muted.mp4` };
}

async function rotateFlipVideo(
  ffmpeg: FFmpeg,
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const direction = (options.direction as string) || "rotate-90";
  let filter = "";
  switch (direction) {
    case "rotate-90": filter = "transpose=1"; break;
    case "rotate-180": filter = "transpose=1,transpose=1"; break;
    case "rotate-270": filter = "transpose=2"; break;
    case "flip-h": filter = "hflip"; break;
    case "flip-v": filter = "vflip"; break;
    default: filter = "transpose=1";
  }
  const inputName = `input_${Date.now()}${getExtension(file.name)}`;
  const outputName = `output_${Date.now()}.mp4`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    "-vf", filter,
    outputName,
  ]);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  const blob = new Blob([toBlobPart(data)], { type: "video/mp4" });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_${direction}.mp4` };
}

async function processGenericVideo(
  ffmpeg: FFmpeg,
  files: File[]
): Promise<ClientProcessResult> {
  const file = files[0];
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  return { blob, filename: file.name };
}

function getExtension(filename: string): string {
  const match = filename.match(/\.[^.]+$/);
  return match ? match[0] : ".mp4";
}

function toBlobPart(data: string | Uint8Array | ArrayBuffer): ArrayBuffer | string {
  if (typeof data === "string") return data;
  if (data instanceof Uint8Array) return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  return data as ArrayBuffer;
}
