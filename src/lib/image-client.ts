import imageCompression from "browser-image-compression";

export interface ClientProcessResult {
  blob: Blob;
  filename: string;
  pagePreviews?: string[];
}

export async function processImageTool(
  toolId: string,
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  switch (toolId) {
    case "image-resize":
      return resizeImage(files, options);
    case "image-compress":
      return compressImage(files, options);
    case "image-convert":
      return convertImage(files, options);
    case "image-crop":
      return cropImage(files, options);
    case "image-watermark":
      return watermarkImage(files, options);
    case "image-blur":
      return blurImage(files, options);
    case "image-rotate":
      return rotateImage(files, options);
    case "image-enhance":
      return enhanceImage(files, options);
    default:
      return processGenericImage(files, options);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob"));
      },
      type,
      quality
    );
  });
}

async function resizeImage(
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const width = (options.width as number) || 800;
  const height = (options.height as number) || 600;
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(url);
  const blob = await canvasToBlob(canvas, "image/png");
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_${width}x${height}.png` };
}

async function compressImage(
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const quality = (options.quality as number) || 80;
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: quality / 100,
  });
  const blob = new Blob([compressed], { type: file.type });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const ext = file.type.includes("png") ? "png" : "jpg";
  return { blob, filename: `${baseName}_compressed.${ext}` };
}

async function convertImage(
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const format = (options.format as string) || "png";
  const mimeType = `image/${format === "jpg" ? "jpeg" : format}`;
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  const blob = await canvasToBlob(canvas, mimeType);
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}.${format}` };
}

async function cropImage(
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const x = (options.x as number) || 0;
  const y = (options.y as number) || 0;
  const cropWidth = (options.width as number) || 200;
  const cropHeight = (options.height as number) || 200;
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = cropWidth;
  canvas.height = cropHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, x, y, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  URL.revokeObjectURL(url);
  const blob = await canvasToBlob(canvas, "image/png");
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_cropped.png` };
}

async function watermarkImage(
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const text = (options.text as string) || "WATERMARK";
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  ctx.font = "bold 48px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  URL.revokeObjectURL(url);
  const blob = await canvasToBlob(canvas, "image/png");
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_watermarked.png` };
}

async function blurImage(
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const radius = (options.radius as number) || 5;
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.filter = `blur(${radius}px)`;
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  const blob = await canvasToBlob(canvas, "image/png");
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_blurred.png` };
}

async function rotateImage(
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const degrees = (options.degrees as number) || 90;
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  const radians = (degrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * cos + img.naturalHeight * sin);
  canvas.height = Math.round(img.naturalWidth * sin + img.naturalHeight * cos);
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(radians);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  URL.revokeObjectURL(url);
  const blob = await canvasToBlob(canvas, "image/png");
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_rotated.png` };
}

async function enhanceImage(
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const brightness = (options.brightness as number) || 100;
  const contrast = (options.contrast as number) || 100;
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  const blob = await canvasToBlob(canvas, "image/png");
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${baseName}_enhanced.png` };
}

async function processGenericImage(
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  return { blob, filename: file.name };
}
