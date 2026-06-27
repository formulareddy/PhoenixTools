import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export interface ClientProcessResult {
  blob: Blob;
  filename: string;
}

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoaded = false;

async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegLoaded) return ffmpegInstance;

  ffmpegInstance = new FFmpeg();
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ffmpegInstance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegLoaded = true;
  return ffmpegInstance;
}

export async function processAudioTool(
  toolId: string,
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const ffmpeg = await loadFFmpeg();

  switch (toolId) {
    case "audio-convert":
      return convertAudio(ffmpeg, files, options);
    case "audio-compress":
      return compressAudio(ffmpeg, files, options);
    case "audio-trim":
      return trimAudio(ffmpeg, files, options);
    case "audio-merge":
      return mergeAudio(ffmpeg, files);
    case "audio-extract-from-video":
      return extractFromVideo(ffmpeg, files);
    case "audio-remove-noise":
      return removeNoise(ffmpeg, files);
    case "audio-change-speed":
      return changeSpeed(ffmpeg, files, options);
    case "audio-volume-boost":
      return volumeBoost(ffmpeg, files, options);
    case "audio-cutter":
      return cutterAudio(ffmpeg, files, options);
    case "audio-metadata":
      return editMetadata(ffmpeg, files, options);
    default:
      return processGenericAudio(ffmpeg, files);
  }
}

async function convertAudio(
  ffmpeg: FFmpeg,
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const format = (options.format as string) || "mp3";
  const inputName = `input_${Date.now()}${getExtension(file.name)}`;
  const outputName = `output_${Date.now()}.${format}`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec(["-i", inputName, outputName]);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  const blob = new Blob([toBlobPart(data)], { type: `audio/${format}` });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}.${format}` };
}

async function compressAudio(
  ffmpeg: FFmpeg,
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const bitrate = (options.bitrate as string) || "128k";
  const inputName = `input_${Date.now()}${getExtension(file.name)}`;
  const outputName = `output_${Date.now()}.mp3`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    "-b:a", bitrate,
    outputName,
  ]);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  const blob = new Blob([toBlobPart(data)], { type: "audio/mpeg" });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_compressed.mp3` };
}

async function trimAudio(
  ffmpeg: FFmpeg,
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const start = (options.start as string) || "00:00:00";
  const duration = (options.duration as string) || "00:00:10";
  const inputName = `input_${Date.now()}${getExtension(file.name)}`;
  const outputName = `output_${Date.now()}.mp3`;
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
  const blob = new Blob([toBlobPart(data)], { type: "audio/mpeg" });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_trimmed.mp3` };
}

async function mergeAudio(
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
  const outputName = `output_${Date.now()}.mp3`;
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
  const blob = new Blob([toBlobPart(data)], { type: "audio/mpeg" });
  return { blob, filename: "merged.mp3" };
}

async function extractFromVideo(
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

async function removeNoise(
  ffmpeg: FFmpeg,
  files: File[]
): Promise<ClientProcessResult> {
  const file = files[0];
  const inputName = `input_${Date.now()}${getExtension(file.name)}`;
  const outputName = `output_${Date.now()}.mp3`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    "-af", "afftdn=nf=-25",
    outputName,
  ]);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  const blob = new Blob([toBlobPart(data)], { type: "audio/mpeg" });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_denoised.mp3` };
}

async function changeSpeed(
  ffmpeg: FFmpeg,
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const speed = (options.speed as number) || 1.5;
  const inputName = `input_${Date.now()}${getExtension(file.name)}`;
  const outputName = `output_${Date.now()}.mp3`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    "-af", `atempo=${speed}`,
    outputName,
  ]);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  const blob = new Blob([toBlobPart(data)], { type: "audio/mpeg" });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_speed_${speed}x.mp3` };
}

async function volumeBoost(
  ffmpeg: FFmpeg,
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const volume = (options.volume as number) || 2.0;
  const inputName = `input_${Date.now()}${getExtension(file.name)}`;
  const outputName = `output_${Date.now()}.mp3`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    "-af", `volume=${volume}`,
    outputName,
  ]);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  const blob = new Blob([toBlobPart(data)], { type: "audio/mpeg" });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_boosted.mp3` };
}

async function cutterAudio(
  ffmpeg: FFmpeg,
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const startTime = (options.startTime as string) || "00:00:00";
  const endTime = (options.endTime as string) || "00:00:10";
  const inputName = `input_${Date.now()}${getExtension(file.name)}`;
  const outputName = `output_${Date.now()}.mp3`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    "-ss", startTime,
    "-to", endTime,
    "-c", "copy",
    outputName,
  ]);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  const blob = new Blob([toBlobPart(data)], { type: "audio/mpeg" });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_cut.mp3` };
}

async function editMetadata(
  ffmpeg: FFmpeg,
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const title = (options.title as string) || "";
  const artist = (options.artist as string) || "";
  const inputName = `input_${Date.now()}${getExtension(file.name)}`;
  const outputName = `output_${Date.now()}.mp3`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  const args = ["-i", inputName];
  if (title) args.push("-metadata", `title=${title}`);
  if (artist) args.push("-metadata", `artist=${artist}`);
  args.push(outputName);
  await ffmpeg.exec(args);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  const blob = new Blob([toBlobPart(data)], { type: "audio/mpeg" });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_metadata.mp3` };
}

async function processGenericAudio(
  ffmpeg: FFmpeg,
  files: File[]
): Promise<ClientProcessResult> {
  const file = files[0];
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  return { blob, filename: file.name };
}

function getExtension(filename: string): string {
  const match = filename.match(/\.[^.]+$/);
  return match ? match[0] : ".mp3";
}

function toBlobPart(data: string | Uint8Array | ArrayBuffer): ArrayBuffer | string {
  if (typeof data === "string") return data;
  if (data instanceof Uint8Array) return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  return data as ArrayBuffer;
}
