import { PDFDocument } from "pdf-lib";

function toBlob(data: Uint8Array | string, type: string): Blob {
  if (typeof data === "string") return new Blob([data], { type });
  const copy = new Uint8Array(new ArrayBuffer(data.byteLength));
  copy.set(data);
  return new Blob([copy], { type });
}

export interface ClientProcessResult {
  blob: Blob;
  filename: string;
  pagePreviews?: string[];
}

export async function processPdfTool(
  toolId: string,
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  switch (toolId) {
    case "pdf-merge":
      return mergePdfs(files);
    case "pdf-split":
      return splitPdf(files, options);
    case "pdf-compress":
      return compressPdf(files, options);
    case "pdf-to-word":
      return pdfToWord(files);
    case "pdf-unlock":
      return unlockPdf(files);
    case "pdf-watermark":
      return watermarkPdf(files, options);
    case "pdf-extract-pages":
      return extractPages(files, options);
    case "pdf-organize":
      return organizePages(files, options);
    case "pdf-repair":
      return repairPdf(files);
    case "pdf-compare":
      return comparePdfs(files);
    case "pdf-redact":
      return redactPdf(files, options);
    case "pdf-crop":
      return cropPdf(files, options);
    case "pdf-metadata":
      return editPdfMetadata(files, options);
    case "jpg-to-pdf":
      return imagesToPdf(files, "jpg");
    case "png-to-pdf":
      return imagesToPdf(files, "png");
    default:
      return processGenericPdf(files, options);
  }
}

async function mergePdfs(files: File[]): Promise<ClientProcessResult> {
  const mergedPdf = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }
  const merged = await mergedPdf.save();
  return { blob: toBlob(merged, "application/pdf"), filename: "merged.pdf" };
}

async function splitPdf(
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const start = (options.start as number) || 1;
  const end = (options.end as number) || pdf.getPageCount();
  const newPdf = await PDFDocument.create();
  const indices = [];
  for (let i = start - 1; i < Math.min(end, pdf.getPageCount()); i++) {
    indices.push(i);
  }
  const pages = await newPdf.copyPages(pdf, indices);
  pages.forEach((page) => newPdf.addPage(page));
  const split = await newPdf.save();
  const baseName = file.name.replace(/\.pdf$/i, "");
  return { blob: toBlob(split, "application/pdf"), filename: `${baseName}_pages_${start}-${end}.pdf` };
}

async function compressPdf(
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const compressed = await pdf.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });
  const baseName = file.name.replace(/\.pdf$/i, "");
  return { blob: toBlob(compressed, "application/pdf"), filename: `${baseName}_compressed.pdf` };
}

async function pdfToWord(files: File[]): Promise<ClientProcessResult> {
  const file = files[0];
  const bytes = await file.arrayBuffer();
  const { default: pdfjsLib } = await import("pdfjs-dist");
  const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => ("str" in item ? item.str : ""));
    text += strings.join(" ") + "\n\n";
  }
  const { Document, Packer, Paragraph, TextRun } = await import("docx");
  const docx = new Document({
    sections: [{ children: [new Paragraph({ children: [new TextRun(text)] })] }],
  });
  const buffer = await Packer.toBuffer(docx);
  const baseName = file.name.replace(/\.pdf$/i, "");
  return {
    blob: toBlob(new Uint8Array(buffer), "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    filename: `${baseName}.docx`,
  };
}

async function unlockPdf(files: File[]): Promise<ClientProcessResult> {
  const file = files[0];
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const unlocked = await pdf.save();
  const baseName = file.name.replace(/\.pdf$/i, "");
  return { blob: toBlob(unlocked, "application/pdf"), filename: `${baseName}_unlocked.pdf` };
}

async function watermarkPdf(
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const watermarkText = (options.text as string) || "WATERMARK";
  const pages = pdf.getPages();
  const { rgb } = await import("pdf-lib");
  for (const page of pages) {
    const { width, height } = page.getSize();
    page.drawText(watermarkText, {
      x: width / 2 - 50,
      y: height / 2,
      size: 50,
      opacity: 0.3,
      color: rgb(0.8, 0.8, 0.8),
    });
  }
  const watermarked = await pdf.save();
  const baseName = file.name.replace(/\.pdf$/i, "");
  return { blob: toBlob(watermarked, "application/pdf"), filename: `${baseName}_watermarked.pdf` };
}

async function extractPages(
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const pageNumbers = (options.pages as string) || "1";
  const indices = pageNumbers
    .split(",")
    .map((p) => parseInt(p.trim(), 10) - 1)
    .filter((i) => i >= 0 && i < pdf.getPageCount());
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(pdf, indices);
  pages.forEach((page) => newPdf.addPage(page));
  const extracted = await newPdf.save();
  const baseName = file.name.replace(/\.pdf$/i, "");
  return { blob: toBlob(extracted, "application/pdf"), filename: `${baseName}_extracted.pdf` };
}

async function organizePages(
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const order = (options.order as string) || "";
  const indices = order
    .split(",")
    .map((p) => parseInt(p.trim(), 10) - 1)
    .filter((i) => i >= 0 && i < pdf.getPageCount());
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(pdf, indices);
  pages.forEach((page) => newPdf.addPage(page));
  const organized = await newPdf.save();
  const baseName = file.name.replace(/\.pdf$/i, "");
  return { blob: toBlob(organized, "application/pdf"), filename: `${baseName}_organized.pdf` };
}

async function repairPdf(files: File[]): Promise<ClientProcessResult> {
  const file = files[0];
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const repaired = await pdf.save();
  const baseName = file.name.replace(/\.pdf$/i, "");
  return { blob: toBlob(repaired, "application/pdf"), filename: `${baseName}_repaired.pdf` };
}

async function comparePdfs(files: File[]): Promise<ClientProcessResult> {
  const file1 = files[0];
  const file2 = files[1] || files[0];
  const bytes1 = await file1.arrayBuffer();
  const bytes2 = await file2.arrayBuffer();
  const { default: pdfjsLib } = await import("pdfjs-dist");
  const doc1 = await pdfjsLib.getDocument({ data: bytes1 }).promise;
  const doc2 = await pdfjsLib.getDocument({ data: bytes2 }).promise;
  let text1 = "";
  let text2 = "";
  for (let i = 1; i <= doc1.numPages; i++) {
    const page = await doc1.getPage(i);
    const content = await page.getTextContent();
    text1 += content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
  }
  for (let i = 1; i <= doc2.numPages; i++) {
    const page = await doc2.getPage(i);
    const content = await page.getTextContent();
    text2 += content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
  }
  const identical = text1 === text2;
  const report = identical
    ? "PDFs are identical."
    : `PDFs differ. File 1: ${doc1.numPages} pages, File 2: ${doc2.numPages} pages.`;
  return { blob: toBlob(report, "text/plain"), filename: "comparison_report.txt" };
}

async function redactPdf(
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const pageNum = ((options.page as number) || 1) - 1;
  const page = pdf.getPage(pageNum);
  const { width, height } = page.getSize();
  const { rgb } = await import("pdf-lib");
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0, 0, 0),
  });
  const redacted = await pdf.save();
  const baseName = file.name.replace(/\.pdf$/i, "");
  return { blob: toBlob(redacted, "application/pdf"), filename: `${baseName}_redacted.pdf` };
}

async function cropPdf(
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const page = pdf.getPage(0);
  const { width, height } = page.getSize();
  const margin = (options.margin as number) || 50;
  page.setMediaBox(margin, margin, width - margin * 2, height - margin * 2);
  const cropped = await pdf.save();
  const baseName = file.name.replace(/\.pdf$/i, "");
  return { blob: toBlob(cropped, "application/pdf"), filename: `${baseName}_cropped.pdf` };
}

async function editPdfMetadata(
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  if (options.title) pdf.setTitle(options.title as string);
  if (options.author) pdf.setAuthor(options.author as string);
  if (options.subject) pdf.setSubject(options.subject as string);
  if (options.creator) pdf.setCreator(options.creator as string);
  const updated = await pdf.save();
  const baseName = file.name.replace(/\.pdf$/i, "");
  return { blob: toBlob(updated, "application/pdf"), filename: `${baseName}_metadata.pdf` };
}

async function imagesToPdf(
  files: File[],
  type: "jpg" | "png"
): Promise<ClientProcessResult> {
  const pdf = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    let image;
    if (type === "jpg") {
      image = await pdf.embedJpg(bytes);
    } else {
      image = await pdf.embedPng(bytes);
    }
    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  const result = await pdf.save();
  return { blob: toBlob(result, "application/pdf"), filename: "images.pdf" };
}

async function processGenericPdf(
  files: File[],
  options: Record<string, unknown>
): Promise<ClientProcessResult> {
  const file = files[0];
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const result = await pdf.save();
  const baseName = file.name.replace(/\.pdf$/i, "");
  return { blob: toBlob(result, "application/pdf"), filename: `${baseName}_processed.pdf` };
}
