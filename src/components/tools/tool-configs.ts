import type { ToolConfig } from "./types"

const faqCommon = [
  { q: "Are my files secure?", a: "Yes. All processing happens on our secure servers. Files are automatically deleted after 30 minutes. We never store or share your data." },
  { q: "How large can my PDF be?", a: "Files up to 500 MB are supported. Larger files may be processed in chunks or require the Pro plan." },
  { q: "What happens if processing fails?", a: "You'll see a specific error message describing the issue. Use Retry to try again or upload a different file." },
]

const howItWorks = [
  "Upload your PDF file using the secure upload zone below",
  "Configure any options or settings for your specific task",
  "Click Process — your file is sent to our processing engine with real-time server progress",
  "Preview the output and download with a single click — file verified on the server before download",
]

export function getToolConfigs(): Record<string, ToolConfig> {
  return {
    "pdf-compress": {
      id: "pdf-compress", name: "Compress PDF", description: "Reduce PDF file size without sacrificing readability.",
      maxFileSize: 500, accept: ".pdf", multiple: false,
      options: [
        { type: "radio", label: "Compression level", key: "level", defaultValue: "balanced",
          choices: [
            { label: "Balanced", value: "balanced", description: "Small reduction, best quality" },
            { label: "Strong", value: "strong", description: "Large reduction, slight quality reduction" },
            { label: "Maximum", value: "maximum", description: "Aggressive compression, may affect quality" },
          ],
        },
      ],
      getDownloadName: (name) => `compressed-${name}`,
      faq: [
        ...faqCommon,
        { q: "How much can I compress my PDF?", a: "Balanced reduces ~30-50%, Strong ~50-70%, Maximum ~70-90% depending on file content (images, fonts, embedded objects)." },
        { q: "Does compression affect quality?", a: "Balanced preserves full quality. Strong and Maximum may slightly reduce image quality for greater compression." },
        { q: "Does compression preserve text and links?", a: "Yes. Text, hyperlinks, bookmarks, and form fields are fully preserved at all compression levels." },
      ],
      howItWorks,
    },
    "pdf-merge": {
      id: "pdf-merge", name: "Merge PDF", description: "Combine multiple PDFs into one document.",
      maxFileSize: 500, accept: ".pdf", multiple: true,
      options: [],
      getDownloadName: () => "merged-document.pdf",
      faq: [
        ...faqCommon,
        { q: "How many files can I merge?", a: "You can merge up to 20 PDF files at once. Each file must be under 500 MB." },
        { q: "Is the original order preserved?", a: "Yes, files are merged in the order you upload them. Rearrange is coming soon." },
        { q: "Are bookmarks preserved?", a: "Page content is preserved. Bookmarks from individual files are not merged into a combined outline." },
      ],
      howItWorks,
    },
    "pdf-split": {
      id: "pdf-split", name: "Split PDF", description: "Split PDF into multiple documents by page ranges.",
      maxFileSize: 500, accept: ".pdf", multiple: false,
      options: [
        { type: "text", label: "Page ranges", key: "ranges", defaultValue: "1-5,6-10", placeholder: "e.g. 1-3,5,7-9", hint: "Comma-separated page ranges. Use hyphens for ranges, single numbers for individual pages." },
      ],
      getDownloadName: (name) => `split-${name}`,
      faq: [
        ...faqCommon,
        { q: "Can I split every page individually?", a: "Yes, just specify each page number separated by commas (1,2,3,4,5). Each becomes a single-page PDF." },
        { q: "How do I download multiple files?", a: "If the split produces multiple parts, they are bundled in a ZIP archive for easy download." },
      ],
      howItWorks,
    },
    "pdf-to-word": {
      id: "pdf-to-word", name: "PDF to Word", description: "Convert PDF to editable Word documents.",
      maxFileSize: 500, accept: ".pdf", multiple: false,
      options: [],
      getDownloadName: (name) => `${name.replace(/\.[^.]+$/, "")}.docx`,
      faq: [
        ...faqCommon,
        { q: "Is formatting preserved?", a: "Basic text is extracted. Complex layouts (tables, columns) may need manual adjustment." },
        { q: "What about scanned PDFs?", a: "Scanned PDFs require OCR. Use the OCR tool or AI OCR (Pro) for scanned documents." },
      ],
      howItWorks,
    },
    "pdf-to-jpg": {
      id: "pdf-to-jpg", name: "PDF to JPG", description: "Convert PDF pages to high-quality images.",
      maxFileSize: 500, accept: ".pdf", multiple: false,
      options: [
        { type: "radio", label: "Image quality", key: "quality", defaultValue: "high",
          choices: [
            { label: "Standard", value: "normal", description: "Smaller files, faster conversion" },
            { label: "High", value: "high", description: "Good quality, balanced size" },
            { label: "Ultra", value: "ultra", description: "Maximum quality, larger files" },
          ],
        },
      ],
      getDownloadName: () => "pdf-pages.zip",
      faq: [
        ...faqCommon,
        { q: "What resolution are the images?", a: "Standard = 72 DPI, High = 108 DPI, Ultra = 180 DPI. For print-quality, use Ultra." },
        { q: "How are multiple pages handled?", a: "Multiple pages are bundled in a ZIP archive. Single pages download directly as JPG." },
      ],
      howItWorks,
    },
    "pdf-unlock": {
      id: "pdf-unlock", name: "Unlock PDF", description: "Remove password protection from PDF files.",
      maxFileSize: 500, accept: ".pdf", multiple: false,
      options: [],
      getDownloadName: (name) => `unlocked-${name}`,
      faq: [
        ...faqCommon,
        { q: "Can you remove any PDF password?", a: "We can remove restrictions from PDFs that use standard encryption. Some enterprise-grade DRM may not be supported." },
        { q: "Is my password stored?", a: "No password is needed — we handle encryption removal server-side when possible." },
      ],
      howItWorks,
    },
    "pdf-watermark": {
      id: "pdf-watermark", name: "Watermark PDF", description: "Add text watermarks to every page.",
      maxFileSize: 500, accept: ".pdf", multiple: false,
      options: [
        { type: "text", label: "Watermark text", key: "text", defaultValue: "CONFIDENTIAL", placeholder: "e.g. DRAFT, CONFIDENTIAL, SAMPLE" },
        { type: "radio", label: "Position", key: "position", defaultValue: "center",
          choices: [
            { label: "Center", value: "center", description: "Centered diagonally" },
            { label: "Top", value: "top", description: "Top of page" },
            { label: "Bottom", value: "bottom", description: "Bottom of page" },
            { label: "Tile", value: "tile", description: "Repeated across page" },
          ],
        },
        { type: "select", label: "Opacity", key: "opacity", defaultValue: "0.15",
          choices: [
            { label: "Light (10%)", value: "0.10", description: "Subtle watermark" },
            { label: "Medium (15%)", value: "0.15", description: "Standard watermark" },
            { label: "Strong (25%)", value: "0.25", description: "Bold watermark" },
          ],
        },
      ],
      getDownloadName: (name) => `watermarked-${name}`,
      faq: [...faqCommon, { q: "Can I add image watermarks?", a: "Currently text watermarks are supported. Image watermark support is coming soon." }],
      howItWorks,
    },
    "pdf-ocr": {
      id: "pdf-ocr", name: "PDF OCR", description: "Extract text from scanned PDF documents.",
      maxFileSize: 500, accept: ".pdf", multiple: false,
      options: [],
      getDownloadName: (name) => `${name.replace(/\.[^.]+$/, "")}-ocr.txt`,
      faq: [
        ...faqCommon,
        { q: "Why is OCR limited?", a: "Full OCR requires Tesseract.js which is a large dependency. For production OCR with 100+ languages, upgrade to Pro." },
        { q: "Is this a real OCR engine?", a: "Server-side Pro OCR achieves 99% accuracy with layout preservation. The free plan provides basic text extraction." },
      ],
      howItWorks,
    },
    "pdf-extract-pages": {
      id: "pdf-extract-pages", name: "Extract Pages", description: "Extract specific pages from a PDF.",
      maxFileSize: 500, accept: ".pdf", multiple: false,
      options: [
        { type: "text", label: "Page numbers", key: "pages", defaultValue: "1,3,5", placeholder: "e.g. 1,3,5-7", hint: "Comma-separated page numbers. 1-indexed." },
      ],
      getDownloadName: (name) => `extracted-${name}`,
      faq: [
        ...faqCommon,
        { q: "Can I extract non-consecutive pages?", a: "Yes! Specify any combination like 1,3,5 or 2,4,6-8." },
      ],
      howItWorks,
    },
    "pdf-organize": {
      id: "pdf-organize", name: "Organize PDF", description: "Reorder and arrange PDF pages.",
      maxFileSize: 500, accept: ".pdf", multiple: false,
      options: [
        { type: "radio", label: "Page order", key: "order", defaultValue: "reverse",
          choices: [
            { label: "Reverse order", value: "reverse", description: "Last page becomes first" },
            { label: "Odd pages first", value: "odd", description: "1,3,5,7… then 2,4,6,8…" },
            { label: "Even pages first", value: "even", description: "2,4,6,8… then 1,3,5,7…" },
          ],
        },
        { type: "text", label: "Custom order (optional)", key: "customOrder", defaultValue: "", placeholder: "e.g. 1,3,5,7,2,4,6,8", hint: "Comma-separated 1-indexed page numbers" },
      ],
      getDownloadName: (name) => `organized-${name}`,
      faq: [...faqCommon, { q: "Can I define custom page order?", a: "Enter comma-separated page numbers in the custom order field. Example: 1,3,5,7,2,4,6,8" }],
      howItWorks,
    },
    "pdf-to-text": {
      id: "pdf-to-text", name: "PDF to Text", description: "Convert PDF documents to plain text.",
      maxFileSize: 500, accept: ".pdf", multiple: false,
      options: [],
      getDownloadName: (name) => `${name.replace(/\.[^.]+$/, "")}-extracted.txt`,
      faq: [...faqCommon, { q: "What text encoding is used?", a: "UTF-8 plain text. Suitable for import into any text editor." }],
      howItWorks,
    },
    "jpg-to-pdf": {
      id: "jpg-to-pdf", name: "JPG to PDF", description: "Convert JPEG images to PDF documents — each image becomes a page.",
      maxFileSize: 100, accept: ".jpg,.jpeg", multiple: true,
      options: [
        { type: "select", label: "Page size", key: "pageSize", defaultValue: "auto",
          choices: [
            { label: "Match image size", value: "auto", description: "Each page matches its image dimensions" },
            { label: "A4 (210×297mm)", value: "a4", description: "Standard A4 portrait layout" },
            { label: "Letter (8.5×11in)", value: "letter", description: "US Letter size" },
          ],
        },
      ],
      getDownloadName: (name) => `${name.replace(/\.[^.]+$/, "")}-converted.pdf`,
      faq: [...faqCommon, { q: "Can I combine multiple JPGs into one PDF?", a: "Yes! Upload multiple images and each becomes a page in the same PDF." }],
      howItWorks,
    },
    "png-to-pdf": {
      id: "png-to-pdf", name: "PNG to PDF", description: "Convert PNG images to PDF documents — each image becomes a page.",
      maxFileSize: 100, accept: ".png", multiple: true,
      options: [
        { type: "select", label: "Page size", key: "pageSize", defaultValue: "auto",
          choices: [
            { label: "Match image size", value: "auto", description: "Each page matches its image dimensions" },
            { label: "A4 (210×297mm)", value: "a4", description: "Standard A4 portrait layout" },
            { label: "Letter (8.5×11in)", value: "letter", description: "US Letter size" },
          ],
        },
      ],
      getDownloadName: (name) => `${name.replace(/\.[^.]+$/, "")}-converted.pdf`,
      faq: [...faqCommon, { q: "Can I combine multiple PNGs into one PDF?", a: "Yes! Upload multiple images and each becomes a page in the same PDF." }],
      howItWorks,
    },
    "html-to-pdf": {
      id: "html-to-pdf", name: "HTML to PDF", description: "Convert HTML content to a well-formatted PDF document.",
      maxFileSize: 5, accept: ".html,.htm,.txt", multiple: false,
      options: [
        { type: "textarea", label: "HTML content", key: "html", defaultValue: "", placeholder: "Paste your HTML here…", hint: "Leave empty if uploading an HTML file" },
      ],
      getDownloadName: (name) => `${name.replace(/\.[^.]+$/, "")}.pdf`,
      faq: [...faqCommon, { q: "What HTML tags are supported?", a: "Basic formatting: headings, paragraphs, bold, italic, lists, line breaks. Full CSS rendering requires a headless browser (Pro)." }],
      howItWorks,
    },
    "pdf-sign": {
      id: "pdf-sign", name: "Sign PDF", description: "Add a signature placeholder to your PDF.",
      maxFileSize: 500, accept: ".pdf", multiple: false,
      options: [
        { type: "text", label: "Signer name", key: "name", defaultValue: "", placeholder: "e.g. John Doe" },
        { type: "radio", label: "Signature position", key: "position", defaultValue: "last-page",
          choices: [
            { label: "Last page only", value: "last-page", description: "Sign on the final page" },
            { label: "All pages", value: "all-pages", description: "Sign on every page" },
            { label: "First page only", value: "first-page", description: "Sign on the first page" },
            { label: "Bottom right", value: "bottom-right", description: "Signature aligned to the right" },
          ],
        },
      ],
      getDownloadName: (name) => `signed-${name}`,
      faq: [
        ...faqCommon,
        { q: "Is this a legally binding signature?", a: "This adds a signature placeholder. For digital certificates and PKI signatures, use dedicated signing software." },
        { q: "Can I sign multiple pages?", a: "Yes! Select 'All pages' to add your signature to every page of the document." },
      ],
      howItWorks,
    },
    "pdf-repair": {
      id: "pdf-repair", name: "Repair PDF", description: "Fix corrupted or damaged PDF files.",
      maxFileSize: 500, accept: ".pdf", multiple: false,
      options: [],
      getDownloadName: (name) => `repaired-${name}`,
      faq: [
        ...faqCommon,
        { q: "What types of corruption can be fixed?", a: "Minor corruption, truncated header data, and malformed objects. Severely damaged files may not be recoverable." },
        { q: "Will I lose content?", a: "Unrecoverable pages are skipped. The tool prioritizes recovering what it can." },
        { q: "What causes PDF corruption?", a: "Incomplete downloads, disk errors, conversion failures, and network interruptions are common causes." },
      ],
      howItWorks,
    },
    "pdf-compare": {
      id: "pdf-compare", name: "Compare PDF", description: "Compare two PDF documents side by side.",
      maxFileSize: 500, accept: ".pdf", multiple: true,
      options: [],
      getDownloadName: () => "comparison-report.txt",
      faq: [
        ...faqCommon,
        { q: "What gets compared?", a: "Page counts, dimensions, and page-level presence. Full text diff comparison is coming soon." },
        { q: "How is the report formatted?", a: "A plain-text report with page-level diff markers is generated server-side." },
      ],
      howItWorks,
    },
    "pdf-redact": {
      id: "pdf-redact", name: "Redact PDF", description: "Black out sensitive information in PDFs.",
      maxFileSize: 500, accept: ".pdf", multiple: false,
      options: [
        { type: "text", label: "Search text (optional)", key: "searchText", defaultValue: "", placeholder: "e.g. Confidential, Secret", hint: "Only redact pages containing this text. Leave empty to redact all pages." },
      ],
      getDownloadName: (name) => `redacted-${name}`,
      faq: [
        ...faqCommon,
        { q: "Is redaction permanent?", a: "Yes, the black rectangles are drawn directly in the PDF content stream and cannot be removed." },
        { q: "Can I redact specific text?", a: "Enter search text to only redact pages containing that text. Leave blank to redact all pages." },
      ],
      howItWorks,
    },
    "pdf-crop": {
      id: "pdf-crop", name: "Crop PDF", description: "Crop and resize PDF page margins.",
      maxFileSize: 500, accept: ".pdf", multiple: false,
      options: [
        { type: "radio", label: "Margin crop", key: "margin", defaultValue: "20",
          choices: [
            { label: "Small", value: "10", description: "10 pts from each edge" },
            { label: "Medium", value: "20", description: "20 pts from each edge" },
            { label: "Large", value: "40", description: "40 pts from each edge" },
          ],
        },
        { type: "text", label: "Custom margin (optional)", key: "customMargin", defaultValue: "", placeholder: "e.g. 15, 25, 50", hint: "Overrides preset. Single number applied to all edges." },
      ],
      getDownloadName: (name) => `cropped-${name}`,
      faq: [
        ...faqCommon,
        { q: "What unit is the margin?", a: "Margin is in points (1 pt = 1/72 inch). 20 pts ≈ 7 mm." },
        { q: "Can I set a custom margin?", a: "Yes! Enter any value in the custom margin field to override presets." },
      ],
      howItWorks,
    },
    "pdf-metadata": {
      id: "pdf-metadata", name: "PDF Metadata Editor", description: "Edit PDF title, author, and properties.",
      maxFileSize: 500, accept: ".pdf", multiple: false,
      options: [
        { type: "text", label: "Title", key: "title", defaultValue: "", placeholder: "Document title" },
        { type: "text", label: "Author", key: "author", defaultValue: "", placeholder: "Author name" },
        { type: "text", label: "Subject", key: "subject", defaultValue: "", placeholder: "Document subject" },
        { type: "text", label: "Keywords", key: "keywords", defaultValue: "", placeholder: "Optional keywords" },
      ],
      getDownloadName: (name) => `metadata-${name}`,
      faq: [
        ...faqCommon,
        { q: "What metadata fields are supported?", a: "Title, Author, Subject, Keywords, Producer, and Creator tags are written." },
        { q: "Can I read existing metadata?", a: "Yes! The tool reads and displays existing metadata before applying changes. The original title is shown in the result summary." },
      ],
      howItWorks,
    },
    "image-resize": {
      id: "image-resize", name: "Resize Image", description: "Resize images to exact dimensions with platform presets.",
      maxFileSize: 50, accept: ".jpg,.jpeg,.png,.webp", multiple: false,
      options: [
        { type: "radio", label: "Quick presets", key: "preset", defaultValue: "",
          choices: [
            { label: "Instagram Post", value: "1080x1080", description: "1080 × 1080 px" },
            { label: "Instagram Story", value: "1080x1920", description: "1080 × 1920 px" },
            { label: "YouTube Thumbnail", value: "1280x720", description: "1280 × 720 px" },
            { label: "Facebook Cover", value: "820x312", description: "820 × 312 px" },
            { label: "Twitter Post", value: "1200x675", description: "1200 × 675 px" },
            { label: "LinkedIn Post", value: "1200x627", description: "1200 × 627 px" },
            { label: "Pinterest Pin", value: "1000x1500", description: "1000 × 1500 px" },
            { label: "Custom", value: "custom", description: "Enter your own dimensions" },
          ],
        },
        { type: "text", label: "Width (px)", key: "width", defaultValue: "1200", placeholder: "e.g. 1200" },
        { type: "text", label: "Height (px)", key: "height", defaultValue: "800", placeholder: "e.g. 800" },
        { type: "radio", label: "Aspect ratio", key: "lockRatio", defaultValue: "lock",
          choices: [
            { label: "Lock ratio", value: "lock", description: "Maintain original proportions" },
            { label: "Stretch", value: "stretch", description: "Allow distortion" },
          ],
        },
      ],
      getDownloadName: (name) => `resized-${name}`,
      faq: [
        { q: "Will resizing reduce quality?", a: "Downscaling preserves quality. Upscaling may introduce slight blurring as the algorithm invents pixel data." },
        { q: "What's the best size for social media?", a: "Instagram: 1080×1080. YouTube: 1280×720. Facebook: 820×312. Twitter: 1200×675." },
        { q: "Can I resize multiple images at once?", a: "Upload one image at a time. For batch processing, use our Compress tool which handles multiple files." },
      ],
      howItWorks: [
        "Upload your image — JPG, PNG, or WebP up to 50 MB",
        "Choose a platform preset or enter custom dimensions",
        "Lock aspect ratio to prevent distortion, or stretch to fill",
        "Download your resized image — processed on our servers in seconds",
      ],
    },
    "image-compress": {
      id: "image-compress", name: "Compress Image", description: "Optimize images for web with real-time size savings.",
      maxFileSize: 50, accept: ".jpg,.jpeg,.png,.webp", multiple: true,
      options: [
        { type: "radio", label: "Compression level", key: "level", defaultValue: "balanced",
          choices: [
            { label: "Balanced", value: "balanced", description: "Visually lossless, 40-60% smaller" },
            { label: "Aggressive", value: "aggressive", description: "Slight quality loss, 60-80% smaller" },
            { label: "Maximum", value: "maximum", description: "Smallest file, visible artifacts" },
          ],
        },
        { type: "select", label: "Output format", key: "format", defaultValue: "webp",
          choices: [
            { label: "WebP (Best compression)", value: "webp", description: "30-50% smaller than JPEG, recommended" },
            { label: "JPG (Maximum compatibility)", value: "jpg", description: "Works everywhere, lossy" },
            { label: "PNG (Lossless)", value: "png", description: "No quality loss, larger files" },
          ],
        },
        { type: "text", label: "Quality (1-100)", key: "quality", defaultValue: "", placeholder: "e.g. 85", hint: "Override compression level. Higher = better quality, larger file." },
      ],
      getDownloadName: (name) => `compressed-${name}`,
      faq: [
        { q: "Why WebP recommended?", a: "WebP is 30-50% smaller than JPEG at the same quality. It supports transparency and is supported by all modern browsers (97%+)." },
        { q: "How much can I save?", a: "Balanced: 40-60%. Aggressive: 60-80%. Maximum: 70-90%. Results depend on image content." },
        { q: "Is quality preserved?", a: "Balanced is visually lossless — you cannot tell the difference. Aggressive may show slight artifacts." },
        { q: "What about PNG images?", a: "PNG is lossless. We convert to WebP which is 30-50% smaller with similar quality. Choose PNG output if you need lossless." },
      ],
      howItWorks: [
        "Drop your images — supports JPG, PNG, and WebP up to 50 MB each",
        "Choose compression level and output format (WebP recommended for web)",
        "Server re-encodes with optimal quantization and format-specific optimization",
        "Compare before/after and download — real savings shown instantly",
      ],
    },
    "image-convert": {
      id: "image-convert", name: "Convert Image", description: "Convert between JPG, PNG, and WebP formats.",
      maxFileSize: 50, accept: ".jpg,.jpeg,.png,.webp", multiple: true,
      options: [
        { type: "select", label: "Output format", key: "format", defaultValue: "webp",
          choices: [
            { label: "WebP — Best for web", value: "webp", description: "25-35% smaller than JPG, supports transparency" },
            { label: "PNG — Lossless quality", value: "png", description: "No quality loss, supports transparency" },
            { label: "JPG — Universal", value: "jpg", description: "Works everywhere, lossy compression" },
          ],
        },
        { type: "text", label: "Quality (1-100)", key: "quality", defaultValue: "90", placeholder: "e.g. 90", hint: "Applies to JPG and WebP output. PNG is always lossless." },
      ],
      getDownloadName: (name) => {
        const base = name.replace(/\.[^.]+$/, "")
        return `converted-${base}`
      },
      faq: [
        { q: "Which format should I choose?", a: "WebP for web (smallest files). PNG for logos/screenshots (lossless). JPG for maximum compatibility." },
        { q: "Will converting reduce quality?", a: "PNG to JPG: slight loss. JPG to PNG: no loss but bigger. Any to WebP: minimal loss at much smaller size." },
        { q: "Does WebP support transparency?", a: "Yes — WebP supports both lossy and lossless transparency, just like PNG but with much smaller files." },
      ],
      howItWorks: [
        "Upload your images — JPG, PNG, or WebP up to 50 MB each",
        "Choose output format and quality level",
        "Server converts using optimized encoders for each format",
        "Download converted files — verified for correct format and integrity",
      ],
    },
    "image-crop": {
      id: "image-crop", name: "Crop Image", description: "Crop to any aspect ratio with platform presets.",
      maxFileSize: 50, accept: ".jpg,.jpeg,.png,.webp", multiple: false,
      options: [
        { type: "radio", label: "Aspect ratio", key: "ratio", defaultValue: "1:1",
          choices: [
            { label: "1:1 Square", value: "1:1", description: "Instagram posts, profile photos" },
            { label: "4:3 Standard", value: "4:3", description: "Classic photo ratio" },
            { label: "16:9 Widescreen", value: "16:9", description: "YouTube, presentations" },
            { label: "3:2 Classic", value: "3:2", description: "DSLR photography" },
            { label: "9:16 Vertical", value: "9:16", description: "Stories, Reels, TikTok" },
            { label: "2:3 Portrait", value: "2:3", description: "Poster, print" },
          ],
        },
      ],
      getDownloadName: (name) => `cropped-${name}`,
      faq: [
        { q: "Which ratio for which platform?", a: "1:1 Instagram, 16:9 YouTube, 9:16 Stories/TikTok, 4:3 Facebook, 2:3 Pinterest." },
        { q: "Does cropping reduce quality?", a: "No — cropping removes pixels. Remaining pixels are at full original quality." },
        { q: "Where is the crop applied?", a: "The crop is centered on your image. The most important content stays in frame." },
      ],
      howItWorks: [
        "Upload your image — JPG, PNG, or WebP up to 50 MB",
        "Choose an aspect ratio preset for your target platform",
        "The image is center-cropped to the selected ratio",
        "Download your cropped image — original quality preserved",
      ],
    },
    "image-watermark": {
      id: "image-watermark", name: "Watermark Image", description: "Add text watermarks to protect your photos.",
      maxFileSize: 50, accept: ".jpg,.jpeg,.png,.webp", multiple: false,
      options: [
        { type: "text", label: "Watermark text", key: "text", defaultValue: "WATERMARK", placeholder: "e.g. © 2026 My Brand" },
        { type: "radio", label: "Position", key: "position", defaultValue: "center",
          choices: [
            { label: "Center", value: "center", description: "Centered on the image" },
            { label: "Top Left", value: "top-left", description: "Upper left corner" },
            { label: "Top Right", value: "top-right", description: "Upper right corner" },
            { label: "Bottom Left", value: "bottom-left", description: "Lower left corner" },
            { label: "Bottom Right", value: "bottom-right", description: "Lower right corner" },
            { label: "Tile", value: "tile", description: "Repeated diagonal pattern" },
          ],
        },
        { type: "radio", label: "Opacity", key: "opacity", defaultValue: "0.3",
          choices: [
            { label: "Subtle (15%)", value: "0.15", description: "Barely visible, elegant" },
            { label: "Light (25%)", value: "0.25", description: "Visible but not distracting" },
            { label: "Medium (40%)", value: "0.4", description: "Clearly visible" },
            { label: "Strong (60%)", value: "0.6", description: "Maximum protection" },
          ],
        },
        { type: "radio", label: "Font size", key: "fontSize", defaultValue: "medium",
          choices: [
            { label: "Small", value: "small", description: "Subtle, unobtrusive" },
            { label: "Medium", value: "medium", description: "Balanced visibility" },
            { label: "Large", value: "large", description: "Bold, impossible to miss" },
          ],
        },
      ],
      getDownloadName: (name) => `watermarked-${name}`,
      faq: [
        { q: "What text should I use?", a: "© Your Name, your brand, website URL, or 'SAMPLE' / 'PREVIEW' for proof images." },
        { q: "Can the watermark be removed?", a: "Text watermarks can be removed by advanced editing. For stronger protection, use Tile mode with high opacity." },
        { q: "Does it affect print quality?", a: "No — the watermark is applied at your image's original resolution." },
      ],
      howItWorks: [
        "Upload your image — JPG, PNG, or WebP up to 50 MB",
        "Enter your watermark text and choose position (6 options including corners)",
        "Adjust opacity and font size for the right level of protection",
        "Download your watermarked image — ready to share or publish",
      ],
    },
    "image-blur": {
      id: "image-blur", name: "Blur Image", description: "Apply blur effects for privacy or aesthetics.",
      maxFileSize: 50, accept: ".jpg,.jpeg,.png,.webp", multiple: false,
      options: [
        { type: "radio", label: "Blur intensity", key: "blur", defaultValue: "5",
          choices: [
            { label: "Light (2)", value: "2", description: "Slight softening, details visible" },
            { label: "Medium (5)", value: "5", description: "Noticeable blur, shapes visible" },
            { label: "Heavy (10)", value: "10", description: "Strong blur, details hidden" },
            { label: "Extreme (20)", value: "20", description: "Maximum blur, unrecognizable" },
          ],
        },
      ],
      getDownloadName: (name) => `blurred-${name}`,
      faq: [
        { q: "Can I blur just part of the image?", a: "Currently the entire image is blurred. Selective area blurring is coming soon." },
        { q: "Is this good enough for privacy?", a: "Light/Medium can be reversed with AI. Use Heavy or Extreme to truly hide details." },
        { q: "What's the algorithm?", a: "We use a downscale-upscale technique that produces smooth Gaussian-like blur at any intensity." },
      ],
      howItWorks: [
        "Upload your image — JPG, PNG, or WebP up to 50 MB",
        "Choose blur intensity from Light to Extreme",
        "Server applies Gaussian-style blur using our optimized algorithm",
        "Download your blurred image — useful for privacy, backgrounds, or effects",
      ],
    },
    "image-rotate": {
      id: "image-rotate", name: "Rotate & Flip Image", description: "Rotate and flip images in any direction.",
      maxFileSize: 50, accept: ".jpg,.jpeg,.png,.webp", multiple: false,
      options: [
        { type: "radio", label: "Transform", key: "action", defaultValue: "rotate-90",
          choices: [
            { label: "↻ 90° Right", value: "rotate-90", description: "Clockwise quarter turn" },
            { label: "↺ 90° Left", value: "rotate-270", description: "Counter-clockwise quarter turn" },
            { label: "↻ 180°", value: "rotate-180", description: "Turn upside down" },
            { label: "↔ Flip Horizontal", value: "flip-h", description: "Mirror left to right" },
            { label: "↕ Flip Vertical", value: "flip-v", description: "Mirror top to bottom" },
            { label: "Rotate + Flip", value: "rotate-90+flip-h", description: "90° right then flip horizontal" },
          ],
        },
      ],
      getDownloadName: (name) => `rotated-${name}`,
      faq: [
        { q: "Does rotating reduce quality?", a: "No — 90°/180°/270° rotations are lossless geometric transformations." },
        { q: "When would I flip an image?", a: "Correcting mirrored webcam shots, fixing backwards text, or creating symmetrical designs." },
        { q: "Can I combine rotate + flip?", a: "Yes — select 'Rotate + Flip' for a 90° rotation followed by a horizontal mirror." },
      ],
      howItWorks: [
        "Upload your image — JPG, PNG, or WebP up to 50 MB",
        "Choose a transform: rotate 90°/180°, flip horizontal/vertical, or combine",
        "Server transforms with zero quality loss for standard rotations",
        "Download your transformed image — dimensions adjusted automatically",
      ],
    },
    "image-enhance": {
      id: "image-enhance", name: "Enhance Image", description: "AI-powered image enhancement for sharper, clearer photos.",
      maxFileSize: 50, accept: ".jpg,.jpeg,.png,.webp", multiple: false,
      options: [
        { type: "radio", label: "Enhancement level", key: "level", defaultValue: "balanced",
          choices: [
            { label: "Balanced", value: "balanced", description: "Optimal mix of sharpness, noise reduction, and color" },
            { label: "Sharpen", value: "sharpen", description: "Maximum sharpness for blurry photos" },
            { label: "Denoise", value: "denoise", description: "Remove grain and noise from low-light photos" },
            { label: "Vivid", value: "vivid", description: "Boost colors and contrast for vibrant look" },
          ],
        },
      ],
      getDownloadName: (name) => `enhanced-${name}`,
      faq: [
        ...faqCommon,
        { q: "What does 'enhance' actually do?", a: "We apply adaptive sharpening, noise reduction, and color correction using our AI processing pipeline." },
        { q: "Will it fix very blurry photos?", a: "Sharpen mode can significantly improve slight to moderate blur. Very blurry photos may have limited improvement." },
        { q: "Does it change the resolution?", a: "No — the output keeps the same dimensions. Use Upscale to increase resolution." },
      ],
      howItWorks: [
        "Upload your image — JPG, PNG, or WebP up to 50 MB",
        "Choose enhancement: Balanced, Sharpen, Denoise, or Vivid",
        "AI analyzes and enhances your image with adaptive processing",
        "Download your enhanced photo — sharper, clearer, and more vibrant",
      ],
    },
    "image-upscale": {
      id: "image-upscale", name: "Upscale Image", description: "Increase image resolution up to 4x with AI.",
      maxFileSize: 50, accept: ".jpg,.jpeg,.png,.webp", multiple: false,
      options: [
        { type: "radio", label: "Scale factor", key: "scale", defaultValue: "2",
          choices: [
            { label: "2× (Double)", value: "2", description: "Double resolution — good balance of quality and size" },
            { label: "3× (Triple)", value: "3", description: "Triple resolution — for print or large displays" },
            { label: "4× (Quad)", value: "4", description: "Maximum upscale — best for very small images" },
          ],
        },
      ],
      getDownloadName: (name) => `upscaled-${name}`,
      faq: [
        ...faqCommon,
        { q: "How does AI upscaling work?", a: "We use smart interpolation that adds detail based on surrounding pixels, producing cleaner results than basic scaling." },
        { q: "Will it make pixelated images look perfect?", a: "AI upscaling reduces pixelation significantly but cannot fully reconstruct lost detail from very low-resolution sources." },
        { q: "What's the maximum output size?", a: "Depends on input. A 1000×1000 image at 4× becomes 4000×4000 (16 megapixels)." },
      ],
      howItWorks: [
        "Upload your image — JPG, PNG, or WebP up to 50 MB",
        "Choose scale: 2×, 3×, or 4× the original resolution",
        "AI intelligently adds pixels using advanced interpolation",
        "Download your upscaled image — sharper and larger than basic scaling",
      ],
    },
    "remove-bg": {
      id: "remove-bg", name: "Remove Background", description: "AI-powered background removal in one click.",
      maxFileSize: 50, accept: ".jpg,.jpeg,.png,.webp", multiple: false,
      options: [
        { type: "radio", label: "Output format", key: "format", defaultValue: "png",
          choices: [
            { label: "PNG (Transparent)", value: "png", description: "Transparent background — PNG with alpha channel" },
            { label: "White Background", value: "white", description: "Clean white background — ready for documents" },
            { label: "Blur Background", value: "blur", description: "Blurred original background — portrait style" },
          ],
        },
      ],
      getDownloadName: (name) => `no-bg-${name}`,
      faq: [
        ...faqCommon,
        { q: "How accurate is the background removal?", a: "Our AI achieves 95%+ accuracy on clean subjects. Hair, fur, and transparent objects may need minor touch-ups." },
        { q: "What happens with complex edges?", a: "We use alpha matting for soft edges like hair and fur, producing natural-looking results." },
        { q: "Can I replace the background?", a: "Currently we offer transparent, white, or blurred backgrounds. Custom background replacement is coming soon." },
      ],
      howItWorks: [
        "Upload your image — JPG, PNG, or WebP up to 50 MB",
        "Choose output: transparent, white, or blurred background",
        "AI detects and separates the subject from the background",
        "Download your image with the background removed — ready for any use",
      ],
    },
    "remove-objects": {
      id: "remove-objects", name: "Remove Objects", description: "Remove unwanted objects or people from photos.",
      maxFileSize: 50, accept: ".jpg,.jpeg,.png,.webp", multiple: false,
      options: [
        { type: "radio", label: "Removal mode", key: "mode", defaultValue: "auto",
          choices: [
            { label: "Auto Detect", value: "auto", description: "AI automatically detects and removes distracting elements" },
            { label: "Center Focus", value: "center", description: "Keep center subject, remove peripheral distractions" },
            { label: "Clean Frame", value: "clean", description: "Remove all people/objects except main subject" },
          ],
        },
      ],
      getDownloadName: (name) => `cleaned-${name}`,
      faq: [
        ...faqCommon,
        { q: "How does object removal work?", a: "Our AI uses inpainting to fill removed areas with contextually appropriate content from surrounding pixels." },
        { q: "What can be removed?", a: "People, text, watermarks, power lines, trash cans, and other distracting elements." },
        { q: "Will it look natural?", a: "For most cases, yes. The AI fills in gaps using surrounding textures and patterns for seamless results." },
      ],
      howItWorks: [
        "Upload your image — JPG, PNG, or WebP up to 50 MB",
        "Choose removal mode: Auto, Center Focus, or Clean Frame",
        "AI identifies and removes unwanted elements using inpainting",
        "Download your cleaned image — distractions removed naturally",
      ],
    },
    "colorize-photo": {
      id: "colorize-photo", name: "Colorize Photo", description: "Add realistic color to black and white photos.",
      maxFileSize: 50, accept: ".jpg,.jpeg,.png,.webp", multiple: false,
      options: [
        { type: "radio", label: "Color style", key: "style", defaultValue: "natural",
          choices: [
            { label: "Natural", value: "natural", description: "Realistic, true-to-life colors" },
            { label: "Vibrant", value: "vibrant", description: "Enhanced saturation for modern look" },
            { label: "Vintage", value: "vintage", description: "Warm, sepia-toned vintage aesthetic" },
          ],
        },
      ],
      getDownloadName: (name) => `colorized-${name}`,
      faq: [
        ...faqCommon,
        { q: "How accurate are the colors?", a: "Our AI predicts colors based on millions of training examples. Most results are remarkably accurate, especially for portraits and landscapes." },
        { q: "Does it work on any B&W photo?", a: "Works best on clear, well-exposed photos. Heavily damaged or very low-contrast images may have reduced quality." },
        { q: "Can I adjust specific colors?", a: "Currently the AI determines colors automatically. Manual color adjustment is coming soon." },
      ],
      howItWorks: [
        "Upload your black and white image — JPG, PNG, or WebP up to 50 MB",
        "Choose color style: Natural, Vibrant, or Vintage",
        "AI analyzes the image and applies realistic colors using deep learning",
        "Download your colorized photo — as if it was taken in color originally",
      ],
    },
    "restore-photo": {
      id: "restore-photo", name: "Restore Old Photos", description: "Restore and enhance old, damaged, or faded photos.",
      maxFileSize: 50, accept: ".jpg,.jpeg,.png,.webp", multiple: false,
      options: [
        { type: "radio", label: "Restore level", key: "level", defaultValue: "balanced",
          choices: [
            { label: "Light", value: "light", description: "Fix minor scratches and improve contrast" },
            { label: "Balanced", value: "balanced", description: "Full restoration — scratches, tears, fading, and noise" },
            { label: "Maximum", value: "maximum", description: "Aggressive restoration for severely damaged photos" },
          ],
        },
      ],
      getDownloadName: (name) => `restored-${name}`,
      faq: [
        ...faqCommon,
        { q: "What kind of damage can it fix?", a: "Scratches, tears, water stains, fading, yellowing, noise, and blur. Works best on common types of photo damage." },
        { q: "Will it fix missing parts?", a: "AI can infer and fill small missing areas. Large missing sections may show artifacts or incomplete restoration." },
        { q: "Should I scan at high resolution?", a: "Yes — higher resolution scans give the AI more data to work with, producing better restoration results." },
      ],
      howItWorks: [
        "Upload your damaged photo — JPG, PNG, or WebP up to 50 MB",
        "Choose restoration level: Light, Balanced, or Maximum",
        "AI repairs damage, removes artifacts, and enhances overall quality",
        "Download your restored photo — brought back to life with AI",
      ],
    },
    "ai-image-gen": {
      id: "ai-image-gen", name: "AI Image Generator", description: "Generate stunning images from text descriptions.",
      maxFileSize: 10, accept: ".jpg,.jpeg,.png,.webp", multiple: false,
      options: [
        { type: "textarea", label: "Describe your image", key: "prompt", placeholder: "A serene mountain landscape at sunset with golden clouds...", defaultValue: "" },
        { type: "radio", label: "Style", key: "style", defaultValue: "photorealistic",
          choices: [
            { label: "Photorealistic", value: "photorealistic", description: "Lifelike photos and renders" },
            { label: "Digital Art", value: "digital-art", description: "Modern digital illustration style" },
            { label: "Oil Painting", value: "oil-painting", description: "Classic oil painting aesthetic" },
            { label: "Watercolor", value: "watercolor", description: "Soft watercolor painting style" },
          ],
        },
      ],
      getDownloadName: () => "ai-generated.png",
      faq: [
        ...faqCommon,
        { q: "How long does generation take?", a: "Typically 10-30 seconds depending on complexity and server load." },
        { q: "What's the output resolution?", a: "Images are generated at 1024×1024 pixels by default, with option to upscale afterward." },
        { q: "Are there content restrictions?", a: "We don't allow generation of explicit, violent, or harmful content. All prompts are screened." },
      ],
      howItWorks: [
        "Enter a detailed text description of the image you want",
        "Choose a style: Photorealistic, Digital Art, Oil Painting, or Watercolor",
        "AI generates your image based on the prompt and style",
        "Download your AI-generated image — ready to use or edit further",
      ],
    },

    // ─── Video Tools ──────────────────────────────────────────

    "video-trim": {
      id: "video-trim", name: "Trim Video", description: "Cut and trim video clips to exact timestamps.",
      maxFileSize: 2000, accept: ".mp4,.webm,.avi,.mov,.mkv,.ogv", multiple: false,
      options: [
        { type: "time", label: "Start time", key: "start", defaultValue: "0:0:0", placeholder: "0:0:0" },
        { type: "time", label: "End time", key: "end", defaultValue: "0:0:0", placeholder: "Leave at 0:0:0 for full duration" },
      ],
      getDownloadName: (name) => `trimmed-${name}`,
      faq: [
        { q: "How precise is the trim?", a: "Trimming is frame-accurate. The cut happens at the exact timestamp you specify." },
        { q: "Does trimming affect quality?", a: "No — trimming is a lossless cut. The video is simply split at your chosen timestamps." },
        { q: "What if I leave end time at 0:0:0?", a: "The video will be trimmed from your start time to the very end of the original clip." },
      ],
      howItWorks: [
        "Upload your video — MP4, WebM, AVI, MOV, or MKV up to 2GB",
        "Set start and end time using hours, minutes, and seconds",
        "FFmpeg cuts the video at frame boundaries with zero re-encoding",
        "Download your trimmed clip — exact timestamps, no quality loss",
      ],
    },
    "video-compress": {
      id: "video-compress", name: "Compress Video", description: "Reduce video file size while preserving quality.",
      maxFileSize: 2000, accept: ".mp4,.webm,.avi,.mov,.mkv,.ogv", multiple: false,
      options: [
        { type: "radio", label: "Compression level", key: "level", defaultValue: "balanced",
          choices: [
            { label: "Balanced", value: "balanced", description: "Best quality-size ratio — 40-60% smaller" },
            { label: "Strong", value: "strong", description: "60-75% smaller — slight quality reduction" },
            { label: "Maximum", value: "maximum", description: "75-90% smaller — may reduce resolution" },
          ],
        },
      ],
      getDownloadName: (name) => `compressed-${name}`,
      faq: [
        { q: "How much smaller will my video be?", a: "Balanced reduces 40-60%, Strong 60-75%, Maximum 75-90% depending on original encoding and content." },
        { q: "Will compression affect playback quality?", a: "Balanced preserves near-identical quality. Strong may show minor artifacts in fast-motion scenes. Maximum may scale down resolution." },
        { q: "Does it change the video format?", a: "No — the output stays in the same format (MP4, WebM, etc.) with optimized encoding." },
      ],
      howItWorks: [
        "Upload your video — up to 2GB in any format",
        "Choose compression: Balanced, Strong, or Maximum",
        "FFmpeg re-encodes with optimal CRF preset for your chosen level",
        "Download your compressed video — smaller file, same format, preserved quality",
      ],
    },
    "video-convert": {
      id: "video-convert", name: "Convert Video", description: "Convert between video formats with optimal encoding.",
      maxFileSize: 2000, accept: ".mp4,.webm,.avi,.mov,.mkv,.ogv", multiple: false,
      options: [
        { type: "radio", label: "Output format", key: "format", defaultValue: "mp4",
          choices: [
            { label: "MP4", value: "mp4", description: "Most compatible — works everywhere (H.264 + AAC)" },
            { label: "WebM", value: "webm", description: "Smaller files — modern web standard (VP9 + Opus)" },
            { label: "AVI", value: "avi", description: "Legacy format — wide compatibility with older software" },
            { label: "MOV", value: "mov", description: "Apple ecosystem — optimized for QuickTime and Final Cut" },
            { label: "MKV", value: "mkv", description: "Open container — supports multiple audio/subtitle tracks" },
          ],
        },
      ],
      getDownloadName: (name) => `converted-${name}`,
      faq: [
        { q: "Which format should I choose?", a: "MP4 for universal compatibility, WebM for web use, MOV for Apple, MKV for maximum flexibility." },
        { q: "Does conversion change quality?", a: "Quality is preserved using high-bitrate encoding. File sizes may vary between formats." },
        { q: "Will subtitles be preserved?", a: "Subtitles embedded in the video stream are preserved. External subtitle files need to be burned in separately." },
      ],
      howItWorks: [
        "Upload your video — any format up to 2GB",
        "Choose output: MP4, WebM, AVI, MOV, or MKV",
        "FFmpeg transcodes using the optimal codec for your chosen format",
        "Download your converted video — ready for your target platform",
      ],
    },
    "video-to-gif": {
      id: "video-to-gif", name: "Video to GIF", description: "Convert video clips to high-quality animated GIFs.",
      maxFileSize: 500, accept: ".mp4,.webm,.avi,.mov,.mkv,.ogv", multiple: false,
      options: [
        { type: "time", label: "Start time", key: "start", defaultValue: "0:0:0", placeholder: "0:0:0" },
        { type: "time", label: "Duration", key: "duration", defaultValue: "0:0:5", placeholder: "0:0:5" },
        { type: "radio", label: "Frame rate", key: "fps", defaultValue: "15",
          choices: [
            { label: "10 fps", value: "10", description: "Smallest file — choppy but functional" },
            { label: "15 fps", value: "15", description: "Balanced — smooth enough for most uses" },
            { label: "24 fps", value: "24", description: "Smooth — cinematic feel, larger file" },
            { label: "30 fps", value: "30", description: "Maximum smoothness — largest file size" },
          ],
        },
        { type: "radio", label: "Width (pixels)", key: "width", defaultValue: "480",
          choices: [
            { label: "320px", value: "320", description: "Small — fast loading, social media" },
            { label: "480px", value: "480", description: "Standard — good balance of size and quality" },
            { label: "640px", value: "640", description: "Large — crisp detail, bigger file" },
          ],
        },
      ],
      getDownloadName: (name) => `animation-${name.replace(/\.[^.]+$/, "")}.gif`,
      faq: [
        { q: "Why is my GIF file so large?", a: "GIF format is inefficient. Shorter clips (3-5s) and lower frame rates (10-15fps) produce smaller files." },
        { q: "Can I make a GIF from any part of the video?", a: "Yes — set the start time and duration to capture any segment of your video." },
        { q: "Will the GIF have audio?", a: "No — GIF format does not support audio. Use the extracted audio tool separately if needed." },
      ],
      howItWorks: [
        "Upload your video — MP4, WebM, or MOV up to 500MB",
        "Choose start time and duration using hours:minutes:seconds",
        "Two-pass encoding: first generates optimized color palette, then renders the GIF",
        "Download your animated GIF — optimized with diff-based dithering for best quality",
      ],
    },
    "extract-audio": {
      id: "extract-audio", name: "Extract Audio", description: "Extract audio tracks from video files.",
      maxFileSize: 2000, accept: ".mp4,.webm,.avi,.mov,.mkv,.ogv", multiple: false,
      options: [
        { type: "radio", label: "Audio format", key: "format", defaultValue: "mp3",
          choices: [
            { label: "MP3", value: "mp3", description: "Universal — works on every device and player" },
            { label: "WAV", value: "wav", description: "Lossless — maximum quality, large file size" },
            { label: "AAC", value: "aac", description: "Modern — better quality than MP3 at same bitrate" },
            { label: "OGG", value: "ogg", description: "Open source — great quality, smaller than MP3" },
            { label: "FLAC", value: "flac", description: "Lossless compressed — studio quality, half the size of WAV" },
          ],
        },
        { type: "radio", label: "Bitrate", key: "bitrate", defaultValue: "192k",
          choices: [
            { label: "128 kbps", value: "128k", description: "Standard — acceptable for voice and podcasts" },
            { label: "192 kbps", value: "192k", description: "High — great for music and general use" },
            { label: "256 kbps", value: "256k", description: "Very high — near-lossless for most listeners" },
            { label: "320 kbps", value: "320k", description: "Maximum — indistinguishable from lossless" },
          ],
        },
      ],
      getDownloadName: (name) => `audio-${name.replace(/\.[^.]+$/, "")}`,
      faq: [
        { q: "Which audio format is best?", a: "MP3 for universal compatibility, AAC for best quality-to-size, FLAC for archival, WAV for editing." },
        { q: "Will the audio quality match the original?", a: "At 320kbps MP3 or FLAC, the extracted audio is perceptually identical to the source." },
        { q: "Can I extract just a portion?", a: "Currently extracts the full audio track. Use the trim tool first to cut the video segment you want." },
      ],
      howItWorks: [
        "Upload your video — MP4, WebM, AVI, MOV, or MKV up to 2GB",
        "Choose audio format (MP3, WAV, AAC, OGG, FLAC) and bitrate",
        "FFmpeg demuxes the audio stream without re-encoding the video",
        "Download your audio file — ready for playback, editing, or sharing",
      ],
    },
    "merge-video": {
      id: "merge-video", name: "Merge Video", description: "Combine multiple video clips into one.",
      maxFileSize: 2000, accept: ".mp4,.webm,.avi,.mov,.mkv,.ogv", multiple: true,
      options: [],
      getDownloadName: () => "merged-video.mp4",
      faq: [
        { q: "How many videos can I merge?", a: "Up to 20 videos. All videos should have the same resolution for best results." },
        { q: "What if videos have different resolutions?", a: "The first video's resolution is used as the reference. Other videos are padded or scaled to match." },
        { q: "Are the videos re-encoded?", a: "Yes — all clips are re-encoded to ensure seamless concatenation and consistent quality." },
      ],
      howItWorks: [
        "Upload 2-20 video clips — drag to reorder if needed",
        "All clips are normalized to the first video's resolution and framerate",
        "FFmpeg concatenates the clips into a single seamless video",
        "Download your merged video — one continuous file with smooth transitions",
      ],
    },
    "resize-video": {
      id: "resize-video", name: "Resize Video", description: "Resize videos to any dimensions with padding.",
      maxFileSize: 2000, accept: ".mp4,.webm,.avi,.mov,.mkv,.ogv", multiple: false,
      options: [
        { type: "radio", label: "Target size", key: "resolution", defaultValue: "1280x720",
          choices: [
            { label: "640×360", value: "640x360", description: "SD — small files, mobile-friendly" },
            { label: "1280×720", value: "1280x720", description: "HD — standard quality, web-optimized" },
            { label: "1920×1080", value: "1920x1080", description: "Full HD — high quality, social media ready" },
            { label: "3840×2160", value: "3840x2160", description: "4K — maximum quality, large files" },
          ],
        },
      ],
      getDownloadName: (name) => `resized-${name}`,
      faq: [
        { q: "Will resizing change the aspect ratio?", a: "The video is scaled to fit within the target dimensions and padded with black bars to maintain the original aspect ratio." },
        { q: "Does resizing reduce quality?", a: "Minimal quality loss due to re-encoding. Using a larger target than the source preserves maximum detail." },
        { q: "Can I set custom dimensions?", a: "Currently offers standard presets. Custom dimensions will be available soon." },
      ],
      howItWorks: [
        "Upload your video — any format up to 2GB",
        "Choose target: SD (640×360), HD (1280×720), Full HD (1920×1080), or 4K (3840×2160)",
        "FFmpeg scales the video with aspect-ratio-preserving padding",
        "Download your resized video — optimized for your target screen size",
      ],
    },
    "crop-video": {
      id: "crop-video", name: "Crop Video", description: "Crop video to focus on key areas.",
      maxFileSize: 2000, accept: ".mp4,.webm,.avi,.mov,.mkv,.ogv", multiple: false,
      options: [
        { type: "radio", label: "Aspect ratio", key: "aspect", defaultValue: "16:9",
          choices: [
            { label: "16:9", value: "16:9", description: "Widescreen — YouTube, TV, presentations" },
            { label: "9:16", value: "9:16", description: "Vertical — TikTok, Instagram Reels, Stories" },
            { label: "1:1", value: "1:1", description: "Square — Instagram feed, profile pictures" },
            { label: "4:3", value: "4:3", description: "Classic — older displays, presentations" },
            { label: "21:9", value: "21:9", description: "Ultrawide — cinematic, movie trailers" },
            { label: "4:5", value: "4:5", description: "Portrait — Instagram feed, Facebook posts" },
          ],
        },
      ],
      getDownloadName: (name) => `cropped-${name}`,
      faq: [
        { q: "Does cropping cut off parts of the video?", a: "Yes — the video is cropped to the selected aspect ratio. The center of the frame is preserved by default." },
        { q: "Will the quality change?", a: "Quality is maintained through re-encoding. Cropped videos may appear sharper due to less scaling." },
        { q: "Can I choose which part to keep?", a: "The center is kept by default. Custom positioning will be available in a future update." },
      ],
      howItWorks: [
        "Upload your video — any format up to 2GB",
        "Choose aspect ratio: 16:9, 9:16, 1:1, 4:3, 21:9, or 4:5",
        "FFmpeg calculates center-crop coordinates and removes excess pixels",
        "Download your cropped video — perfectly framed for your target platform",
      ],
    },
    "add-audio-to-video": {
      id: "add-audio-to-video", name: "Add Audio to Video", description: "Add music or voiceover to your video.",
      maxFileSize: 2000, accept: ".mp4,.webm,.avi,.mov,.mkv,.ogv", multiple: false,
      options: [
        { type: "radio", label: "Audio mode", key: "mode", defaultValue: "replace",
          choices: [
            { label: "Replace audio", value: "replace", description: "Remove original audio, add your new track" },
            { label: "Mix with original", value: "mix", description: "Blend your audio with the original soundtrack" },
          ],
        },
        { type: "radio", label: "Volume", key: "volume", defaultValue: "1.0",
          choices: [
            { label: "50%", value: "0.5", description: "Background music level — doesn't overpower video" },
            { label: "75%", value: "0.75", description: "Balanced — clearly audible alongside video" },
            { label: "100%", value: "1.0", description: "Full volume — your audio takes center stage" },
            { label: "150%", value: "1.5", description: "Boosted — louder than original for emphasis" },
          ],
        },
      ],
      getDownloadName: (name) => `with-audio-${name}`,
      faq: [
        { q: "What audio formats are supported?", a: "MP3, WAV, AAC, OGG, and FLAC audio files can be added to any video format." },
        { q: "Will the video length change?", a: "No — the audio is trimmed or padded to match the video duration automatically." },
        { q: "Can I add audio to a muted video?", a: "Yes — use 'Replace audio' mode to completely swap the original audio with your track." },
      ],
      howItWorks: [
        "Upload your video — MP4, WebM, AVI, MOV, or MKV up to 2GB",
        "Upload your audio file — MP3, WAV, AAC, OGG, or FLAC",
        "Choose mode: Replace original or Mix with original, plus volume level",
        "FFmpeg mixes or replaces the audio stream and syncs to video length",
        "Download your video with the new audio track — perfectly synced",
      ],
    },
    "change-video-speed": {
      id: "change-video-speed", name: "Change Video Speed", description: "Speed up or slow down video playback.",
      maxFileSize: 2000, accept: ".mp4,.webm,.avi,.mov,.mkv,.ogv", multiple: false,
      options: [
        { type: "radio", label: "Speed", key: "speed", defaultValue: "1.0",
          choices: [
            { label: "0.25× (Slow)", value: "0.25", description: "Dramatic slow motion — 4× slower" },
            { label: "0.5× (Half)", value: "0.5", description: "Slow motion — half speed, detail reveal" },
            { label: "1.5× (Fast)", value: "1.5", description: "Slightly faster — 50% quicker" },
            { label: "2× (Double)", value: "2.0", description: "Double speed — time-lapse feel" },
            { label: "4× (Quick)", value: "4.0", description: "Very fast — quick previews, 4× faster" },
          ],
        },
      ],
      getDownloadName: (name) => `speed-${name}`,
      faq: [
        { q: "Does speed change affect audio?", a: "Yes — audio pitch is adjusted to match the new speed. Slow motion deepens audio, fast motion raises it." },
        { q: "What happens to video length?", a: "2× speed halves the duration, 0.5× doubles it. The output length = original / speed." },
        { q: "Can I combine speed with other effects?", a: "Use the trim tool first to select your segment, then change speed on the trimmed clip." },
      ],
      howItWorks: [
        "Upload your video — any format up to 2GB",
        "Choose speed: 0.25× slow motion to 4× fast forward",
        "FFmpeg adjusts PTS (presentation timestamps) for video and atempo for audio",
        "Download your speed-adjusted video — perfectly synced audio at the new pace",
      ],
    },
    "mute-video": {
      id: "mute-video", name: "Mute Video", description: "Remove audio from video files.",
      maxFileSize: 2000, accept: ".mp4,.webm,.avi,.mov,.mkv,.ogv", multiple: false,
      options: [],
      getDownloadName: (name) => `muted-${name}`,
      faq: [
        { q: "Does muting affect video quality?", a: "No — only the audio stream is removed. Video quality and duration remain unchanged." },
        { q: "Can I unmute later?", a: "Once audio is removed, it cannot be recovered. Use the 'Add Audio to Video' tool to add new audio." },
        { q: "Will the file size decrease?", a: "Yes — removing the audio stream reduces file size by 5-15% depending on the original audio bitrate." },
      ],
      howItWorks: [
        "Upload your video — any format up to 2GB",
        "FFmpeg strips the audio stream with -an flag (no re-encoding of video)",
        "Video codec and quality are preserved exactly as original",
        "Download your muted video — silent, same quality, slightly smaller file",
      ],
    },
    "rotate-flip-video": {
      id: "rotate-flip-video", name: "Rotate & Flip Video", description: "Rotate and flip videos in any direction.",
      maxFileSize: 2000, accept: ".mp4,.webm,.avi,.mov,.mkv,.ogv", multiple: false,
      options: [
        { type: "radio", label: "Transform", key: "action", defaultValue: "rotate-90",
          choices: [
            { label: "↻ 90° Right", value: "rotate-90", description: "Clockwise quarter turn" },
            { label: "↺ 90° Left", value: "rotate-270", description: "Counter-clockwise quarter turn" },
            { label: "↻ 180°", value: "rotate-180", description: "Turn upside down" },
            { label: "↔ Flip Horizontal", value: "flip-h", description: "Mirror left to right" },
            { label: "↕ Flip Vertical", value: "flip-v", description: "Mirror top to bottom" },
            { label: "Rotate + Flip", value: "rotate-90+flip-h", description: "90° right then flip horizontal" },
          ],
        },
      ],
      getDownloadName: (name) => `rotated-${name}`,
      faq: [
        { q: "Does rotating reduce quality?", a: "90° and 180° rotations are geometric transformations that don't affect video quality." },
        { q: "When would I flip a video?", a: "Correcting mirrored webcam shots, fixing backwards text, or creating symmetrical designs." },
        { q: "Can I combine rotate + flip?", a: "Yes — 'Rotate + Flip' applies 90° clockwise rotation followed by horizontal mirror." },
      ],
      howItWorks: [
        "Upload your video — any format up to 2GB",
        "Choose transform: rotate 90°/180°/270°, flip horizontal/vertical, or combine",
        "FFmpeg applies the geometric transformation with zero quality loss for standard angles",
        "Download your transformed video — dimensions adjusted automatically",
      ],
    },
    "video-watermark": {
      id: "video-watermark", name: "Video Watermark", description: "Add text watermarks to protect your videos.",
      maxFileSize: 2000, accept: ".mp4,.webm,.avi,.mov,.mkv,.ogv", multiple: false,
      options: [
        { type: "text", label: "Watermark text", key: "text", defaultValue: "SAMPLE", placeholder: "SAMPLE" },
        { type: "radio", label: "Position", key: "position", defaultValue: "bottom-right",
          choices: [
            { label: "Center", value: "center", description: "Maximum visibility — covers content" },
            { label: "Top Left", value: "top-left", description: "Subtle — unobtrusive corner" },
            { label: "Top Right", value: "top-right", description: "Subtle — unobtrusive corner" },
            { label: "Bottom Left", value: "bottom-left", description: "Subtle — unobtrusive corner" },
            { label: "Bottom Right", value: "bottom-right", description: "Default — professional placement" },
          ],
        },
        { type: "radio", label: "Font size", key: "fontSize", defaultValue: "24",
          choices: [
            { label: "Small (16px)", value: "16", description: "Barely visible — subtle protection" },
            { label: "Medium (24px)", value: "24", description: "Clear but not distracting" },
            { label: "Large (36px)", value: "36", description: "Prominent — strong ownership claim" },
          ],
        },
        { type: "radio", label: "Opacity", key: "opacity", defaultValue: "0.5",
          choices: [
            { label: "30%", value: "0.3", description: "Very subtle — almost invisible" },
            { label: "50%", value: "0.5", description: "Balanced — visible but doesn't block content" },
            { label: "70%", value: "0.7", description: "Prominent — clear ownership marking" },
          ],
        },
      ],
      getDownloadName: (name) => `watermarked-${name}`,
      faq: [
        { q: "Can the watermark be removed?", a: "Text watermarks can be removed by determined users. For stronger protection, use a transparent overlay watermark." },
        { q: "Will the watermark affect video quality?", a: "The video is re-encoded with the text overlay. Quality loss is minimal with the CRF 23 preset." },
        { q: "Can I use special characters?", a: "Most Unicode characters are supported. Avoid special shell characters like quotes or backslashes." },
      ],
      howItWorks: [
        "Upload your video — any format up to 2GB",
        "Enter watermark text, choose position, font size, and opacity",
        "FFmpeg overlays text using the drawtext filter with shadow for visibility",
        "Download your watermarked video — text burned into every frame for protection",
      ],
    },

    // ─── Audio Tools ──────────────────────────────────────────────

    "audio-convert": {
      id: "audio-convert", name: "Convert Audio", description: "Convert between audio formats with optimal encoding.",
      maxFileSize: 200, accept: ".mp3,.wav,.aac,.ogg,.flac,.wma,.m4a,.opus", multiple: false,
      options: [
        { type: "select", label: "Output format", key: "format", defaultValue: "mp3",
          choices: [
            { label: "MP3", value: "mp3", description: "Universal — works on every device and player" },
            { label: "WAV", value: "wav", description: "Lossless — studio quality, large file size" },
            { label: "AAC", value: "aac", description: "High quality — optimized for Apple devices" },
            { label: "OGG", value: "ogg", description: "Open format — great quality, smaller files" },
            { label: "FLAC", value: "flac", description: "Lossless compression — archival quality" },
            { label: "M4A", value: "m4a", description: "Apple format — excellent quality-to-size ratio" },
          ],
        },
        { type: "radio", label: "Bitrate quality", key: "bitrate", defaultValue: "192k",
          choices: [
            { label: "128 kbps", value: "128k", description: "Smaller files — speech and podcasts" },
            { label: "192 kbps", value: "192k", description: "Balanced — music and general use" },
            { label: "256 kbps", value: "256k", description: "High quality — near-transparent for most listeners" },
            { label: "320 kbps", value: "320k", description: "Maximum — indistinguishable from source" },
          ],
        },
      ],
      getDownloadName: (name) => `converted-${name}`,
      faq: [
        { q: "Which format should I choose?", a: "MP3 for universal compatibility. AAC for best quality at same bitrate. FLAC for lossless archival. WAV for editing workflows." },
        { q: "Does conversion lose quality?", a: "Converting between lossy formats (MP3, AAC, OGG) re-encodes the audio. Lossless formats (WAV, FLAC) preserve every sample." },
        { q: "What bitrate is best for music?", a: "192 kbps is transparent for most listeners. 256 kbps for audiophiles. 320 kbps if you want maximum headroom." },
      ],
      howItWorks: [
        "Upload your audio file — MP3, WAV, AAC, OGG, FLAC, or M4A up to 200MB",
        "Choose your target format and bitrate quality level",
        "FFmpeg decodes the source and re-encodes with the optimal codec for your format",
        "Download your converted file — correct headers, metadata preserved, ready to play",
      ],
    },
    "audio-compress": {
      id: "audio-compress", name: "Compress Audio", description: "Reduce audio file size while preserving listening quality.",
      maxFileSize: 200, accept: ".mp3,.wav,.aac,.ogg,.flac,.wma,.m4a,.opus", multiple: false,
      options: [
        { type: "radio", label: "Compression level", key: "level", defaultValue: "balanced",
          choices: [
            { label: "Balanced", value: "balanced", description: "128 kbps — 40-50% smaller, transparent quality" },
            { label: "Strong", value: "strong", description: "96 kbps — 50-65% smaller, slight quality trade" },
            { label: "Maximum", value: "maximum", description: "64 kbps — 65-80% smaller, speech-optimized" },
          ],
        },
      ],
      getDownloadName: (name) => `compressed-${name}`,
      faq: [
        { q: "How much smaller will my file be?", a: "Balanced reduces 40-50%, Strong 50-65%, Maximum 65-80% depending on original encoding and content type." },
        { q: "Will compression affect audio quality?", a: "Balanced preserves near-identical quality for most listeners. Strong may introduce subtle artifacts in complex passages." },
        { q: "What format does the output use?", a: "The output stays in MP3 format with optimized encoding for maximum compatibility across devices." },
      ],
      howItWorks: [
        "Upload your audio file — any format up to 200MB",
        "Choose compression level: Balanced, Strong, or Maximum",
        "FFmpeg re-encodes with the optimal bitrate using the LAME MP3 encoder",
        "Download your compressed file — smaller size, same listening experience",
      ],
    },
    "extract-audio-from-video": {
      id: "extract-audio-from-video", name: "Extract Audio from Video", description: "Extract audio tracks from video files in your preferred format.",
      maxFileSize: 2000, accept: ".mp4,.webm,.avi,.mov,.mkv,.ogv,.flv", multiple: false,
      options: [
        { type: "select", label: "Audio format", key: "format", defaultValue: "mp3",
          choices: [
            { label: "MP3", value: "mp3", description: "Universal — play anywhere" },
            { label: "WAV", value: "wav", description: "Lossless — for editing and production" },
            { label: "AAC", value: "aac", description: "High efficiency — Apple ecosystem" },
            { label: "OGG", value: "ogg", description: "Open source — great quality" },
            { label: "FLAC", value: "flac", description: "Lossless compressed — archival" },
          ],
        },
        { type: "radio", label: "Audio quality", key: "bitrate", defaultValue: "192k",
          choices: [
            { label: "128 kbps", value: "128k", description: "Compact — podcasts and speech" },
            { label: "192 kbps", value: "192k", description: "Balanced — music and general use" },
            { label: "256 kbps", value: "256k", description: "High fidelity — near-transparent" },
            { label: "320 kbps", value: "320k", description: "Maximum quality — audiophile grade" },
          ],
        },
      ],
      getDownloadName: (name) => `extracted-${name.replace(/\.[^.]+$/, "")}.mp3`,
      faq: [
        { q: "Can I extract audio from any video?", a: "Yes — MP4, WebM, AVI, MOV, MKV, and most video formats are supported. The video codec doesn't matter." },
        { q: "Will the audio quality match the original?", a: "The extracted audio preserves the source quality up to your chosen bitrate. Lossless formats like WAV and FLAC capture everything." },
        { q: "Can I extract specific portions?", a: "Use the Trim Audio tool first to cut your video, then extract audio from the trimmed clip." },
      ],
      howItWorks: [
        "Upload your video file — MP4, WebM, AVI, MOV, or MKV up to 2GB",
        "Select your preferred audio format and quality level",
        "FFmpeg strips the video stream and encodes the audio with your chosen codec",
        "Download your extracted audio — clean, high-quality sound track ready to use",
      ],
    },
    "trim-audio": {
      id: "trim-audio", name: "Trim Audio", description: "Cut and trim audio clips to exact timestamps with zero quality loss.",
      maxFileSize: 200, accept: ".mp3,.wav,.aac,.ogg,.flac,.wma,.m4a,.opus", multiple: false,
      options: [
        { type: "time", label: "Start time", key: "start", defaultValue: "0:0:0", placeholder: "0:0:0" },
        { type: "time", label: "End time", key: "end", defaultValue: "0:0:0", placeholder: "Leave at 0:0:0 for full duration" },
      ],
      getDownloadName: (name) => `trimmed-${name}`,
      faq: [
        { q: "How precise is the trim?", a: "Trimming operates at frame-accurate precision. The cut happens at the exact timestamp you specify." },
        { q: "Does trimming affect audio quality?", a: "No — trimming is a lossless stream copy. The audio data is split without re-encoding." },
        { q: "What if I leave end time at 0:0:0?", a: "The audio will be trimmed from your start time to the very end of the original file." },
      ],
      howItWorks: [
        "Upload your audio file — MP3, WAV, AAC, OGG, FLAC up to 200MB",
        "Set start and end time using hours, minutes, and seconds",
        "FFmpeg cuts the audio stream at byte boundaries with zero re-encoding",
        "Download your trimmed clip — exact timestamps, no quality loss",
      ],
    },
    "merge-audio": {
      id: "merge-audio", name: "Merge Audio", description: "Combine multiple audio files into a single continuous track.",
      maxFileSize: 200, accept: ".mp3,.wav,.aac,.ogg,.flac,.wma,.m4a,.opus", multiple: true,
      options: [],
      getDownloadName: (name) => `merged-${name}`,
      faq: [
        { q: "Can I merge different formats?", a: "Yes — all uploaded files are decoded and re-encoded to a consistent format. MP3 is used for maximum compatibility." },
        { q: "Is there a limit to how many files?", a: "Upload as many files as you need. Each file is appended in the order you upload them." },
        { q: "Will there be gaps between tracks?", a: "No — the files are concatenated seamlessly with no silence or gaps between them." },
      ],
      howItWorks: [
        "Upload two or more audio files — any format, any length",
        "Files are decoded and re-encoded to a consistent format automatically",
        "FFmpeg concatenates the streams using the concat demuxer for seamless joins",
        "Download your merged audio — one continuous track from multiple sources",
      ],
    },
    "remove-noise": {
      id: "remove-noise", name: "Remove Audio Noise", description: "Remove background noise, hiss, and hum from audio recordings.",
      maxFileSize: 200, accept: ".mp3,.wav,.aac,.ogg,.flac,.wma,.m4a,.opus", multiple: false,
      options: [
        { type: "radio", label: "Noise reduction strength", key: "sensitivity", defaultValue: "medium",
          choices: [
            { label: "Light", value: "light", description: "Gentle — removes faint background hiss only" },
            { label: "Medium", value: "medium", description: "Balanced — removes hiss, hum, and fan noise" },
            { label: "Strong", value: "strong", description: "Aggressive — removes heavy noise, may affect voice clarity" },
          ],
        },
      ],
      getDownloadName: (name) => `denoised-${name}`,
      faq: [
        { q: "What types of noise can be removed?", a: "Background hiss, electrical hum (50/60Hz), fan noise, air conditioning, and general ambient noise." },
        { q: "Will it affect speech quality?", a: "Light and Medium settings preserve speech perfectly. Strong may slightly affect vocal clarity in very noisy recordings." },
        { q: "Can it remove music from speech?", a: "No — this tool removes broadband noise. For music removal, you would need source separation AI." },
      ],
      howItWorks: [
        "Upload your audio recording — MP3, WAV, AAC, FLAC up to 200MB",
        "Choose noise reduction strength: Light, Medium, or Strong",
        "FFmpeg applies the FFT-based noise reduction filter to analyze and suppress noise",
        "Download your cleaned audio — noise removed, voice and music preserved",
      ],
    },
    "change-audio-speed": {
      id: "change-audio-speed", name: "Change Audio Speed", description: "Speed up or slow down audio playback without pitch distortion.",
      maxFileSize: 200, accept: ".mp3,.wav,.aac,.ogg,.flac,.wma,.m4a,.opus", multiple: false,
      options: [
        { type: "radio", label: "Playback speed", key: "speed", defaultValue: "1.0",
          choices: [
            { label: "0.5x", value: "0.5", description: "Half speed — slow motion, detailed listening" },
            { label: "0.75x", value: "0.75", description: "3/4 speed — gentle slowdown" },
            { label: "1.0x", value: "1.0", description: "Normal speed — no change" },
            { label: "1.25x", value: "1.25", description: "1.25x — slightly faster" },
            { label: "1.5x", value: "1.5", description: "1.5x — podcast speed" },
            { label: "2.0x", value: "2.0", description: "Double speed — 2x faster playback" },
          ],
        },
      ],
      getDownloadName: (name) => `speed-${name}`,
      faq: [
        { q: "Does speed change affect pitch?", a: "No — the atempo filter preserves pitch while changing speed. Your voice stays natural at any speed." },
        { q: "What speed do podcast listeners use?", a: "1.5x to 2x is common for podcasts and audiobooks. 1.25x for a gentle speedup." },
        { q: "Can I use non-standard speeds?", a: "Yes — the radio options cover common speeds. For custom values, contact support." },
      ],
      howItWorks: [
        "Upload your audio file — MP3, WAV, AAC, FLAC up to 200MB",
        "Select your desired playback speed from the presets",
        "FFmpeg applies the atempo filter chain to adjust speed while preserving pitch",
        "Download your speed-adjusted audio — same pitch, new tempo, clean result",
      ],
    },
    "audio-volume": {
      id: "audio-volume", name: "Audio Volume Booster", description: "Increase or decrease audio volume with intelligent normalization.",
      maxFileSize: 200, accept: ".mp3,.wav,.aac,.ogg,.flac,.wma,.m4a,.opus", multiple: false,
      options: [
        { type: "radio", label: "Volume adjustment", key: "gain", defaultValue: "3",
          choices: [
            { label: "-10 dB", value: "-10", description: "Significant reduction — quiet loud recordings" },
            { label: "-6 dB", value: "-6", description: "Moderate reduction — halve the volume" },
            { label: "-3 dB", value: "-3", description: "Slight reduction — subtle decrease" },
            { label: "+3 dB", value: "3", description: "Slight boost — gentle increase" },
            { label: "+6 dB", value: "6", description: "Moderate boost — double the volume" },
            { label: "+10 dB", value: "10", description: "Significant boost — loud increase" },
          ],
        },
        { type: "radio", label: "Normalize output", key: "normalize", defaultValue: "false",
          choices: [
            { label: "No normalization", value: "false", description: "Apply gain only — no peak limiting" },
            { label: "LUFS normalize", value: "true", description: "Normalize to -16 LUFS — broadcast standard" },
          ],
        },
      ],
      getDownloadName: (name) => `volume-${name}`,
      faq: [
        { q: "What does normalization do?", a: "LUFS normalization adjusts the overall level to a broadcast standard (-16 LUFS), preventing clipping while maximizing loudness." },
        { q: "Will boosting volume cause distortion?", a: "Without normalization, yes — boosting too much clips peaks. LUFS normalization prevents this automatically." },
        { q: "What is LUFS?", a: "Loudness Units Full Scale — the industry standard for measuring perceived loudness. -16 LUFS is the podcast/streaming standard." },
      ],
      howItWorks: [
        "Upload your audio file — MP3, WAV, AAC, FLAC up to 200MB",
        "Choose volume adjustment (dB) and whether to normalize the output",
        "FFmpeg applies the volume filter and optional LUFS normalization for broadcast-standard loudness",
        "Download your adjusted audio — proper levels, no clipping, ready to publish",
      ],
    },
    "audio-cutter": {
      id: "audio-cutter", name: "Audio Cutter & Splitter", description: "Split audio into multiple segments at precise timestamps.",
      maxFileSize: 200, accept: ".mp3,.wav,.aac,.ogg,.flac,.wma,.m4a,.opus", multiple: false,
      options: [
        { type: "time", label: "Segment 1 start", key: "seg1_start", defaultValue: "0:0:0", placeholder: "0:0:0" },
        { type: "time", label: "Segment 1 end", key: "seg1_end", defaultValue: "0:0:0", placeholder: "0:0:0" },
        { type: "time", label: "Segment 2 start", key: "seg2_start", defaultValue: "0:0:0", placeholder: "0:0:0" },
        { type: "time", label: "Segment 2 end", key: "seg2_end", defaultValue: "0:0:0", placeholder: "0:0:0" },
      ],
      getDownloadName: (name) => `split-${name}`,
      faq: [
        { q: "How many segments can I create?", a: "Set two segments to split the audio into two parts. For more complex splitting, use the tool multiple times." },
        { q: "Will there be silence between segments?", a: "No — segments are extracted independently and concatenated seamlessly with no gaps." },
        { q: "Can I extract just one segment?", a: "Set the start and end for Segment 1, and leave Segment 2 times at 0:0:0. Only the first segment will be extracted." },
      ],
      howItWorks: [
        "Upload your audio file — MP3, WAV, AAC, FLAC up to 200MB",
        "Set start and end timestamps for each segment using hours:minutes:seconds",
        "FFmpeg extracts each segment using the atrim filter and concatenates them",
        "Download your split audio — segments joined seamlessly into one file",
      ],
    },
    "voice-changer": {
      id: "voice-changer", name: "Voice Changer", description: "Transform voices with pitch shifting and audio effects.",
      maxFileSize: 200, accept: ".mp3,.wav,.aac,.ogg,.flac,.wma,.m4a,.opus", multiple: false,
      options: [
        { type: "radio", label: "Voice effect", key: "effect", defaultValue: "pitch-up",
          choices: [
            { label: "Pitch Up", value: "pitch-up", description: "Higher pitch — lighter, younger-sounding voice" },
            { label: "Pitch Down", value: "pitch-down", description: "Lower pitch — deeper, more authoritative voice" },
            { label: "Deep Voice", value: "deep", description: "Extra deep — dramatic bass-heavy effect" },
            { label: "Helium", value: "helium", description: "Extreme high pitch — cartoon character effect" },
            { label: "Robot", value: "robot", description: "Metallic vibrato — synthetic robotic voice" },
            { label: "Echo", value: "echo", description: "Repeating echo — cavernous spatial effect" },
          ],
        },
      ],
      getDownloadName: (name) => `voice-${name}`,
      faq: [
        { q: "Can I change my voice to sound like someone else?", a: "These are basic pitch and effect transformations. For realistic voice cloning, dedicated AI voice tools are needed." },
        { q: "Will the changed voice sound natural?", a: "Pitch Up/Down preserve natural cadence. Robot and Helium are intentionally artificial effects." },
        { q: "Can I apply multiple effects?", a: "Apply one effect at a time. For complex transformations, process the file through multiple effects sequentially." },
      ],
      howItWorks: [
        "Upload your voice recording — MP3, WAV, AAC, FLAC up to 200MB",
        "Choose your voice effect: pitch shift, echo, or synthetic transformations",
        "FFmpeg applies the effect chain using asetrate, vibrato, aecho, and atempo filters",
        "Download your transformed voice — the effect is baked into the audio permanently",
      ],
    },
    "audio-metadata": {
      id: "audio-metadata", name: "Audio Metadata Editor", description: "Edit audio tags, titles, artist info, and file properties.",
      maxFileSize: 200, accept: ".mp3,.wav,.aac,.ogg,.flac,.wma,.m4a,.opus", multiple: false,
      options: [
        { type: "text", label: "Title", key: "title", defaultValue: "", placeholder: "Song title" },
        { type: "text", label: "Artist", key: "artist", defaultValue: "", placeholder: "Artist name" },
        { type: "text", label: "Album", key: "album", defaultValue: "", placeholder: "Album name" },
        { type: "text", label: "Year", key: "year", defaultValue: "", placeholder: "2026" },
        { type: "text", label: "Genre", key: "genre", defaultValue: "", placeholder: "Pop, Rock, etc." },
        { type: "text", label: "Comment", key: "comment", defaultValue: "", placeholder: "Additional notes" },
      ],
      getDownloadName: (name) => `meta-${name}`,
      faq: [
        { q: "What metadata tags are supported?", a: "Title, Artist, Album, Year, Genre, and Comment — the standard ID3 tags used by all music players." },
        { q: "Will this change the audio quality?", a: "No — metadata is written to the file headers without re-encoding the audio stream." },
        { q: "Can I see the existing metadata?", a: "The audio probe shows current metadata before processing. You can edit any field or leave it unchanged." },
      ],
      howItWorks: [
        "Upload your audio file — MP3, WAV, AAC, FLAC up to 200MB",
        "Fill in the metadata fields: title, artist, album, year, genre, and notes",
        "FFmpeg writes the tags to the file container using -metadata flags without re-encoding",
        "Download your updated audio — proper metadata that shows correctly in all players",
      ],
    },

    "audio-tracks": {
      id: "audio-tracks", name: "Separate Audio Tracks", description: "Detect and extract individual audio tracks as MP3 from multi-language video files.",
      maxFileSize: 4000, accept: ".mkv,.mp4,.avi,.mov,.webm,.flv,.ogm,.m4v", multiple: false,
      options: [],
      getDownloadName: (name) => `tracks-${name.replace(/\.[^.]+$/, "")}.zip`,
      faq: [
        { q: "What video formats support multiple audio tracks?", a: "MKV (Matroska) has the best support. MP4 supports multiple tracks but with some player limitations. AVI and MOV can also contain multiple audio streams." },
        { q: "How do I know if my video has multiple audio tracks?", a: "Upload the file — the tool automatically probes and shows all detected audio tracks with their language, codec, and channel count." },
        { q: "What format are the extracted tracks?", a: "All tracks are extracted as MP3 files (320kbps quality) for maximum compatibility with all players and devices." },
        { q: "Can I extract just one track or all tracks?", a: "The probe shows all tracks with checkboxes. Select the ones you want and click Extract — you can pick one, several, or all of them." },
      ],
      howItWorks: [
        "Upload your video — MKV, MP4, AVI, MOV, WebM up to 4GB",
        "FFprobe scans all audio streams and displays track details: language, codec, channels, and bitrate",
        "Select the audio tracks you want — each track gets its own checkbox",
        "FFmpeg extracts and converts each track to high-quality MP3 (320kbps) using libmp3lame encoder",
        "Download your audio tracks as individual MP3 files — one per language or stream",
      ],
    },

    // ─── AI Tools ───────────────────────────────────────────────

    "ai-writer": {
      id: "ai-writer", name: "AI Writer", description: "Generate high-quality content with AI on any topic.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Topic", key: "topic", defaultValue: "", placeholder: "What to write about" },
        { type: "select", label: "Writing style", key: "style", defaultValue: "professional",
          choices: [
            { label: "Professional", value: "professional", description: "Business and formal writing" },
            { label: "Casual", value: "casual", description: "Friendly and conversational" },
            { label: "Academic", value: "academic", description: "Research and scholarly tone" },
            { label: "Creative", value: "creative", description: "Storytelling and narrative" },
          ],
        },
        { type: "select", label: "Tone", key: "tone", defaultValue: "informative",
          choices: [
            { label: "Informative", value: "informative", description: "Facts and knowledge" },
            { label: "Persuasive", value: "persuasive", description: "Convincing and compelling" },
            { label: "Neutral", value: "neutral", description: "Balanced and objective" },
            { label: "Enthusiastic", value: "enthusiastic", description: "Excited and energetic" },
          ],
        },
        { type: "radio", label: "Content length", key: "length", defaultValue: "medium",
          choices: [
            { label: "Short", value: "short", description: "200-400 words — quick summary" },
            { label: "Medium", value: "medium", description: "500-1000 words — detailed article" },
            { label: "Long", value: "long", description: "1500-3000 words — comprehensive piece" },
          ],
        },
        { type: "textarea", label: "Additional instructions", key: "additional", defaultValue: "", placeholder: "Any specific requirements or context" },
      ],
      getDownloadName: (name) => `ai-writer-${Date.now()}.md`,
      faq: [
        { q: "What AI model powers the writer?", a: "We use DeepSeek V4 Flash Free via OpenCode Zen, with OpenRouter as automatic fallback. Real-time streaming output." },
        { q: "Can I use the generated content commercially?", a: "Yes — AI-generated content is yours to use however you like." },
        { q: "How long does generation take?", a: "Typically 5-15 seconds depending on content length. Output streams in real-time." },
      ],
      howItWorks: [
        "Enter your topic and choose writing style, tone, and length",
        "AI analyzes your requirements and generates a structured outline",
        "Content streams in real-time — you see words appear as they're generated",
        "Download your finished piece as Markdown — ready to publish or edit further",
      ],
    },

    "ai-ocr": {
      id: "ai-ocr", name: "AI OCR", description: "Extract text from images and PDFs with AI-powered optical character recognition.",
      maxFileSize: 10, accept: ".jpg,.jpeg,.png,.pdf,.bmp,.tiff", multiple: false,
      options: [
        { type: "radio", label: "Output format", key: "format", defaultValue: "text",
          choices: [
            { label: "Plain Text", value: "text", description: "Extracted text only" },
            { label: "Markdown", value: "markdown", description: "Formatted with headings and structure" },
          ],
        },
        { type: "select", label: "Language", key: "language", defaultValue: "auto",
          choices: [
            { label: "Auto-detect", value: "auto", description: "Automatically detect document language" },
            { label: "English", value: "en", description: "English documents" },
            { label: "Spanish", value: "es", description: "Spanish documents" },
            { label: "French", value: "fr", description: "French documents" },
            { label: "German", value: "de", description: "German documents" },
            { label: "Chinese", value: "zh", description: "Chinese documents" },
            { label: "Japanese", value: "ja", description: "Japanese documents" },
          ],
        },
      ],
      getDownloadName: (name) => `ocr-${Date.now()}.txt`,
      faq: [
        { q: "What types of files can I OCR?", a: "JPG, PNG, BMP, TIFF images and PDF files. Handwritten text support varies." },
        { q: "How accurate is the OCR?", a: "AI-powered OCR achieves 95-99% accuracy on printed text. Results vary with image quality and handwriting." },
        { q: "Does it support multiple languages?", a: "Yes — auto-detects or you can specify the document language for better accuracy." },
      ],
      howItWorks: [
        "Upload an image or PDF containing text you want to extract",
        "AI analyzes the document layout and identifies text regions",
        "Optical character recognition converts visual text to editable digital text",
        "Download extracted text as plain text or formatted Markdown",
      ],
    },

    "ai-summarize": {
      id: "ai-summarize", name: "AI Summarizer", description: "Summarize any text, document, or article instantly.",
      maxFileSize: 10, accept: ".txt,.md,.pdf", multiple: false,
      options: [
        { type: "radio", label: "Summary length", key: "length", defaultValue: "3-5 sentences",
          choices: [
            { label: "1-2 sentences", value: "1-2 sentences", description: "Quick overview — one paragraph" },
            { label: "3-5 sentences", value: "3-5 sentences", description: "Standard summary — key points" },
            { label: "Bullet points", value: "bullet points", description: "Structured list of main ideas" },
            { label: "Detailed", value: "detailed paragraph", description: "Comprehensive summary" },
          ],
        },
      ],
      getDownloadName: (name) => `summary-${Date.now()}.md`,
      faq: [
        { q: "What types of text can I summarize?", a: "Any text — articles, essays, reports, research papers, meeting notes, and more." },
        { q: "How accurate is the summarization?", a: "The AI captures key points and main ideas with high accuracy. Always review for your specific needs." },
        { q: "Can I summarize PDFs?", a: "Upload a text file or paste content. For PDFs, extract text first using our PDF to Text tool." },
      ],
      howItWorks: [
        "Upload your text file or paste content directly into the input",
        "Choose your preferred summary length and format",
        "AI reads and analyzes the full text to identify key themes and ideas",
        "Download your summary — concise, accurate, and ready to use",
      ],
    },
    "ai-rewrite": {
      id: "ai-rewrite", name: "AI Rewriter", description: "Rewrite content in any style while preserving meaning.",
      maxFileSize: 10, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Text to rewrite", key: "text", defaultValue: "", placeholder: "Paste your text here" },
        { type: "radio", label: "Rewrite style", key: "style", defaultValue: "more professional",
          choices: [
            { label: "More professional", value: "more professional", description: "Formal, business-appropriate tone" },
            { label: "More casual", value: "more casual", description: "Friendly, conversational tone" },
            { label: "More concise", value: "more concise", description: "Shorter, to the point" },
            { label: "More detailed", value: "more detailed", description: "Expanded with examples" },
            { label: "Simpler language", value: "simpler language", description: "Easier to understand" },
          ],
        },
      ],
      getDownloadName: (name) => `rewritten-${Date.now()}.md`,
      faq: [
        { q: "Does rewriting change the meaning?", a: "No — the AI preserves the original meaning while changing words, sentence structure, and tone." },
        { q: "Can I rewrite multiple paragraphs?", a: "Yes — paste as much text as you need. The AI processes the entire input." },
        { q: "Is the output plagiarism-free?", a: "Yes — the AI rewrites from scratch using different words and structures." },
      ],
      howItWorks: [
        "Paste the text you want to rewrite into the input area",
        "Choose your target style: professional, casual, concise, detailed, or simpler",
        "AI restructures sentences, replaces words, and adjusts tone while keeping the meaning",
        "Download your rewritten text — fresh wording, same message, new style",
      ],
    },
    "ai-resume": {
      id: "ai-resume", name: "AI Resume Builder", description: "Build professional resume content with AI.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Full name", key: "name", defaultValue: "", placeholder: "Your name" },
        { type: "text", label: "Target position", key: "position", defaultValue: "", placeholder: "e.g. Senior Software Engineer" },
        { type: "textarea", label: "Work experience", key: "experience", defaultValue: "", placeholder: "Describe your roles, companies, and key achievements" },
        { type: "textarea", label: "Skills", key: "skills", defaultValue: "", placeholder: "List your technical and soft skills" },
        { type: "text", label: "Education", key: "education", defaultValue: "", placeholder: "Degree, university, year" },
      ],
      getDownloadName: (name) => `resume-${Date.now()}.md`,
      faq: [
        { q: "Will this create a formatted PDF?", a: "It generates professional resume content in Markdown. Use our PDF tools to convert the final result." },
        { q: "Is the resume ATS-friendly?", a: "Yes — the AI uses standard resume formatting with action verbs and quantified achievements." },
        { q: "Can I customize the output?", a: "Edit the generated content. The AI provides a strong starting point you can refine." },
      ],
      howItWorks: [
        "Enter your name, target position, and career details",
        "AI analyzes your experience and identifies key achievements and skills",
        "Content is structured with action verbs, metrics, and ATS-optimized formatting",
        "Download your resume content as Markdown — convert to PDF with our tools",
      ],
    },
    "ai-chat": {
      id: "ai-chat", name: "AI Chat Assistant", description: "Chat with AI for instant answers and guidance.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "textarea", label: "Your message", key: "message", defaultValue: "", placeholder: "Ask anything..." },
        { type: "select", label: "Assistant type", key: "systemPrompt", defaultValue: "",
          choices: [
            { label: "General Assistant", value: "", description: "Helpful answers to any question" },
            { label: "Coding Expert", value: "You are an expert programmer. Help with coding questions, debug code, explain concepts, and provide clean solutions.", description: "Programming and tech help" },
            { label: "Writing Coach", value: "You are a writing coach. Help improve writing, suggest edits, and provide feedback on structure and clarity.", description: "Writing improvement" },
            { label: "Business Advisor", value: "You are a business advisor. Provide strategic advice,分析 market trends, and suggest actionable steps.", description: "Business strategy" },
          ],
        },
      ],
      getDownloadName: (name) => `chat-${Date.now()}.md`,
      faq: [
        { q: "What AI model is used?", a: "DeepSeek V4 Flash Free via OpenCode Zen, with automatic fallback to OpenRouter free models." },
        { q: "Is the conversation private?", a: "We don't store conversations. Each request is independent and not linked to your account." },
        { q: "Can I ask follow-up questions?", a: "Each generation is independent. For multi-turn conversations, include context in your message." },
      ],
      howItWorks: [
        "Type your question or request in the chat input",
        "Choose an assistant type for specialized responses",
        "AI processes your query and generates a detailed response in real-time",
        "Copy or download the response for your use",
      ],
    },
    "ai-translate": {
      id: "ai-translate", name: "AI Translator", description: "Translate text into 100+ languages with AI accuracy.",
      maxFileSize: 10, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Text to translate", key: "text", defaultValue: "", placeholder: "Enter text to translate" },
        { type: "select", label: "Target language", key: "targetLanguage", defaultValue: "Spanish",
          choices: [
            { label: "Spanish", value: "Spanish" },
            { label: "French", value: "French" },
            { label: "German", value: "German" },
            { label: "Chinese (Simplified)", value: "Chinese (Simplified)" },
            { label: "Japanese", value: "Japanese" },
            { label: "Korean", value: "Korean" },
            { label: "Portuguese", value: "Portuguese" },
            { label: "Arabic", value: "Arabic" },
            { label: "Hindi", value: "Hindi" },
            { label: "Italian", value: "Italian" },
            { label: "Russian", value: "Russian" },
            { label: "Dutch", value: "Dutch" },
            { label: "Turkish", value: "Turkish" },
            { label: "Vietnamese", value: "Vietnamese" },
            { label: "Thai", value: "Thai" },
          ],
        },
      ],
      getDownloadName: (name) => `translated-${Date.now()}.md`,
      faq: [
        { q: "How many languages are supported?", a: "Over 100 languages including all major world languages, regional dialects, and minority languages." },
        { q: "How accurate is the translation?", a: "AI translation achieves near-human accuracy for most language pairs. Context and nuance are preserved." },
        { q: "Can I translate documents?", a: "Upload a text file for translation. For PDFs, extract text first with our PDF to Text tool." },
      ],
      howItWorks: [
        "Paste your text or upload a text file",
        "Select your target language from 100+ options",
        "AI translates while preserving context, idioms, and cultural nuances",
        "Download your translated text — accurate, natural-sounding, ready to use",
      ],
    },
    "ai-grammar": {
      id: "ai-grammar", name: "AI Grammar Checker", description: "Fix grammar, spelling, and style errors instantly.",
      maxFileSize: 10, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Text to check", key: "text", defaultValue: "", placeholder: "Paste your text here" },
      ],
      getDownloadName: (name) => `grammar-fixed-${Date.now()}.md`,
      faq: [
        { q: "What types of errors are fixed?", a: "Grammar, spelling, punctuation, word choice, sentence structure, and style improvements." },
        { q: "Does it explain the corrections?", a: "Yes — the AI provides the corrected text along with explanations of changes made." },
        { q: "Can it check academic writing?", a: "Yes — the AI adapts to formal, academic, casual, and business writing styles." },
      ],
      howItWorks: [
        "Paste your text into the input area",
        "AI scans for grammar, spelling, punctuation, and style issues",
        "Corrections are applied with explanations for each change",
        "Download your corrected text — polished, professional, error-free",
      ],
    },
    "ai-email": {
      id: "ai-email", name: "AI Email Writer", description: "Generate professional emails for any occasion instantly.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "select", label: "Email type", key: "type", defaultValue: "professional",
          choices: [
            { label: "Professional", value: "professional", description: "Business and formal correspondence" },
            { label: "Cold outreach", value: "cold outreach", description: "First contact with prospects" },
            { label: "Follow-up", value: "follow-up", description: "After meetings or conversations" },
            { label: "Thank you", value: "thank you", description: "Gratitude and appreciation" },
            { label: "Apology", value: "apology", description: "Sincere apologies and resolution" },
          ],
        },
        { type: "text", label: "Subject", key: "subject", defaultValue: "", placeholder: "Email subject line" },
        { type: "text", label: "To", key: "to", defaultValue: "", placeholder: "Recipient name or role" },
        { type: "textarea", label: "Purpose", key: "purpose", defaultValue: "", placeholder: "What is this email about?" },
        { type: "radio", label: "Tone", key: "tone", defaultValue: "professional",
          choices: [
            { label: "Professional", value: "professional", description: "Formal and business-like" },
            { label: "Friendly", value: "friendly", description: "Warm and approachable" },
            { label: "Urgent", value: "urgent", description: "Direct and time-sensitive" },
          ],
        },
      ],
      getDownloadName: (name) => `email-${Date.now()}.md`,
      faq: [
        { q: "Can I customize the generated email?", a: "Yes — edit the output to add personal touches or adjust the tone." },
        { q: "Does it include subject lines?", a: "Yes — the AI generates an appropriate subject line based on the email purpose." },
        { q: "What email formats are supported?", a: "All professional formats: cold outreach, follow-up, thank you, apology, announcement, and more." },
      ],
      howItWorks: [
        "Select your email type and enter the subject, recipient, and purpose",
        "Choose your tone: professional, friendly, or urgent",
        "AI generates a complete email with subject line, greeting, body, and sign-off",
        "Download your email — copy-paste ready for any email client",
      ],
    },
    "ai-cover-letter": {
      id: "ai-cover-letter", name: "AI Cover Letter Generator", description: "Create tailored cover letters that stand out.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Target position", key: "position", defaultValue: "", placeholder: "Job title you're applying for" },
        { type: "text", label: "Company name", key: "company", defaultValue: "", placeholder: "Company you're applying to" },
        { type: "textarea", label: "Your experience", key: "experience", defaultValue: "", placeholder: "Relevant skills and achievements" },
        { type: "textarea", label: "Why this role?", key: "motivation", defaultValue: "", placeholder: "What attracts you to this position" },
      ],
      getDownloadName: (name) => `cover-letter-${Date.now()}.md`,
      faq: [
        { q: "How personalized is the cover letter?", a: "Very — the AI tailors content to the specific role, company, and your stated experience." },
        { q: "Can I use this for any industry?", a: "Yes — the AI adapts to tech, healthcare, finance, creative, and all other industries." },
        { q: "Should I customize it further?", a: "Always review and add specific company details or personal anecdotes for maximum impact." },
      ],
      howItWorks: [
        "Enter the job title, company name, and your relevant experience",
        "Describe what attracts you to this role and company",
        "AI crafts a personalized cover letter with compelling narrative and specific examples",
        "Download your cover letter — professional, tailored, ready to send",
      ],
    },
    "ai-blog": {
      id: "ai-blog", name: "AI Blog Generator", description: "Generate SEO-optimized blog posts with AI.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Blog topic", key: "topic", defaultValue: "", placeholder: "What to write about" },
        { type: "text", label: "Target audience", key: "audience", defaultValue: "", placeholder: "Who is this for?" },
        { type: "radio", label: "Post length", key: "length", defaultValue: "1000-1500 words",
          choices: [
            { label: "500-800 words", value: "500-800 words", description: "Quick read — social media friendly" },
            { label: "1000-1500 words", value: "1000-1500 words", description: "Standard — comprehensive coverage" },
            { label: "2000-3000 words", value: "2000-3000 words", description: "Long-form — deep dive" },
          ],
        },
        { type: "radio", label: "Tone", key: "tone", defaultValue: "engaging and informative",
          choices: [
            { label: "Engaging and informative", value: "engaging and informative", description: "Balanced education and entertainment" },
            { label: "Authoritative", value: "authoritative", description: "Expert-level depth" },
            { label: "Conversational", value: "conversational", description: "Friendly and approachable" },
          ],
        },
        { type: "text", label: "Keywords (optional)", key: "keywords", defaultValue: "", placeholder: "SEO keywords to include" },
      ],
      getDownloadName: (name) => `blog-${Date.now()}.md`,
      faq: [
        { q: "Is the blog SEO-optimized?", a: "Yes — the AI structures content with headings, keywords, and meta-friendly formatting." },
        { q: "Can I add images?", a: "The output is text. Add images manually or use our AI Image Generator for visuals." },
        { q: "What format is the output?", a: "Markdown with headings, paragraphs, and formatting ready for any blogging platform." },
      ],
      howItWorks: [
        "Enter your blog topic and target audience",
        "Choose post length and tone for your content strategy",
        "AI generates a complete blog post with introduction, sections, and conclusion",
        "Download your blog post — SEO-optimized, formatted, ready to publish",
      ],
    },
    "ai-social": {
      id: "ai-social", name: "AI Social Media Generator", description: "Create engaging social media content instantly.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Topic", key: "topic", defaultValue: "", placeholder: "What to post about" },
        { type: "select", label: "Platform", key: "platform", defaultValue: "Twitter/X",
          choices: [
            { label: "Twitter/X", value: "Twitter/X", description: "280 characters, hashtags" },
            { label: "LinkedIn", value: "LinkedIn", description: "Professional network post" },
            { label: "Instagram", value: "Instagram", description: "Caption with emojis" },
            { label: "Facebook", value: "Facebook", description: "Longer form social post" },
            { label: "TikTok", value: "TikTok", description: "Short, catchy caption" },
          ],
        },
        { type: "radio", label: "Content style", key: "style", defaultValue: "engaging and shareable",
          choices: [
            { label: "Engaging and shareable", value: "engaging and shareable", description: "Maximize reach and interaction" },
            { label: "Educational", value: "educational", description: "Teach something valuable" },
            { label: "Promotional", value: "promotional", description: "Drive action and sales" },
          ],
        },
      ],
      getDownloadName: (name) => `social-${Date.now()}.md`,
      faq: [
        { q: "Does it include hashtags?", a: "Yes — relevant hashtags are included for platforms that use them (Twitter, Instagram, LinkedIn)." },
        { q: "Can I generate multiple posts at once?", a: "Each generation creates one post. Run the tool multiple times for a content calendar." },
        { q: "Is the content platform-optimized?", a: "Yes — character limits, formatting, and conventions are tailored to each platform." },
      ],
      howItWorks: [
        "Enter your topic and select the target platform",
        "Choose your content style: engaging, educational, or promotional",
        "AI generates platform-optimized content with hashtags, emojis, and calls to action",
        "Download your social post — copy-paste ready for immediate publishing",
      ],
    },
    "ai-paraphrase": {
      id: "ai-paraphrase", name: "AI Paraphrasing Tool", description: "Rewrite text in different styles while keeping the meaning.",
      maxFileSize: 10, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Text to paraphrase", key: "text", defaultValue: "", placeholder: "Paste your text here" },
        { type: "radio", label: "Paraphrase style", key: "style", defaultValue: "clear and professional",
          choices: [
            { label: "Clear and professional", value: "clear and professional", description: "Standard formal rewrite" },
            { label: "Academic", value: "academic", description: "Scholarly tone and vocabulary" },
            { label: "Simple", value: "simple", description: "Easy to understand" },
            { label: "Creative", value: "creative", description: "Expressive and varied" },
          ],
        },
      ],
      getDownloadName: (name) => `paraphrased-${Date.now()}.md`,
      faq: [
        { q: "How is this different from rewriting?", a: "Paraphrasing focuses on conveying the same meaning with different words, while rewriting may change structure and approach." },
        { q: "Will it maintain the original meaning?", a: "Yes — the AI preserves the core meaning while using different vocabulary and sentence structures." },
        { q: "Can I paraphrase academic papers?", a: "Yes — select the Academic style for scholarly tone and vocabulary." },
      ],
      howItWorks: [
        "Paste the text you want to paraphrase",
        "Choose your target style: professional, academic, simple, or creative",
        "AI rewrites each sentence with new vocabulary while preserving exact meaning",
        "Download your paraphrased text — original meaning, fresh expression",
      ],
    },
    "ai-code": {
      id: "ai-code", name: "AI Code Generator", description: "Generate code from natural language descriptions.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "textarea", label: "Code description", key: "description", defaultValue: "", placeholder: "Describe what you want the code to do" },
        { type: "select", label: "Programming language", key: "language", defaultValue: "Python",
          choices: [
            { label: "Python", value: "Python" },
            { label: "JavaScript", value: "JavaScript" },
            { label: "TypeScript", value: "TypeScript" },
            { label: "Java", value: "Java" },
            { label: "C++", value: "C++" },
            { label: "Go", value: "Go" },
            { label: "Rust", value: "Rust" },
            { label: "SQL", value: "SQL" },
            { label: "HTML/CSS", value: "HTML/CSS" },
            { label: "Bash", value: "Bash" },
          ],
        },
        { type: "text", label: "Requirements (optional)", key: "requirements", defaultValue: "", placeholder: "Specific libraries, constraints, or style" },
      ],
      getDownloadName: (name) => `code-${Date.now()}.md`,
      faq: [
        { q: "How accurate is the generated code?", a: "The AI generates clean, working code following best practices. Always test before production use." },
        { q: "Can it generate complex algorithms?", a: "Yes — from simple functions to complex data structures, APIs, and full modules." },
        { q: "Does it include comments?", a: "Yes — the AI adds explanatory comments for key logic and complex parts." },
      ],
      howItWorks: [
        "Describe what you want the code to do in plain English",
        "Select your programming language and any specific requirements",
        "AI generates clean, documented code with best practices and error handling",
        "Download your code file — ready to integrate into your project",
      ],
    },

    // ─── Text Tools ───────────────────────────────────────────────

    "word-counter": {
      id: "word-counter", name: "Word Counter", description: "Count words, characters, sentences, and paragraphs instantly.",
      maxFileSize: 5, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Paste your text", key: "text", defaultValue: "", placeholder: "Paste or type text here to count words, characters, and more..." },
      ],
      getDownloadName: (name) => `word-count-${Date.now()}.txt`,
      faq: [{ q: "Does it count spaces?", a: "Yes — provides counts with and without spaces." }],
      howItWorks: ["Paste or type your text", "See real-time word, character, sentence, and paragraph counts", "Copy results or download as text file"],
    },

    "text-diff": {
      id: "text-diff", name: "Text Diff", description: "Compare two texts side by side and highlight differences.",
      maxFileSize: 5, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Original text", key: "text1", defaultValue: "", placeholder: "Paste original text here..." },
        { type: "textarea", label: "Changed text", key: "text2", defaultValue: "", placeholder: "Paste changed text here..." },
      ],
      getDownloadName: (name) => `diff-${Date.now()}.txt`,
      faq: [{ q: "How are differences shown?", a: "Additions are highlighted in green, deletions in red, and changes in yellow." }],
      howItWorks: ["Paste original text in the first box", "Paste modified text in the second box", "Click Compare to see highlighted differences"],
    },

    "unit-converter": {
      id: "unit-converter", name: "Unit Converter", description: "Convert between units of length, weight, temperature, and more.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "select", label: "Category", key: "category", defaultValue: "length",
          choices: [
            { label: "Length", value: "length" },
            { label: "Weight", value: "weight" },
            { label: "Temperature", value: "temperature" },
            { label: "Volume", value: "volume" },
            { label: "Speed", value: "speed" },
          ],
        },
        { type: "text", label: "Value", key: "value", defaultValue: "1", placeholder: "Enter value" },
        { type: "text", label: "From unit", key: "from", defaultValue: "m", placeholder: "e.g. m, kg, °C" },
        { type: "text", label: "To unit", key: "to", defaultValue: "ft", placeholder: "e.g. ft, lb, °F" },
      ],
      getDownloadName: (name) => `conversion-${Date.now()}.txt`,
      faq: [{ q: "What units are supported?", a: "Length, weight, temperature, volume, speed, area, data storage, and time." }],
      howItWorks: ["Select a unit category", "Enter the value and source/target units", "Get instant conversion result"],
    },

    "case-converter": {
      id: "case-converter", name: "Case Converter", description: "Convert text between UPPER, lower, Title, and other cases.",
      maxFileSize: 5, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Your text", key: "text", defaultValue: "", placeholder: "Paste text to convert case..." },
        { type: "radio", label: "Convert to", key: "case", defaultValue: "upper",
          choices: [
            { label: "UPPER CASE", value: "upper" },
            { label: "lower case", value: "lower" },
            { label: "Title Case", value: "title" },
            { label: "Sentence case", value: "sentence" },
            { label: "camelCase", value: "camel" },
            { label: "snake_case", value: "snake" },
          ],
        },
      ],
      getDownloadName: (name) => `converted-${Date.now()}.txt`,
      faq: [{ q: "Can I convert code variable names?", a: "Yes — camelCase, snake_case, and PascalCase are supported." }],
      howItWorks: ["Paste your text", "Select the target case style", "Copy or download the converted text"],
    },

    "text-cleaner": {
      id: "text-cleaner", name: "Text Cleaner", description: "Remove extra spaces, line breaks, and formatting issues.",
      maxFileSize: 5, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Your text", key: "text", defaultValue: "", placeholder: "Paste messy text here..." },
        { type: "radio", label: "Cleaning options", key: "options", defaultValue: "all",
          choices: [
            { label: "Remove extra spaces", value: "spaces" },
            { label: "Remove line breaks", value: "lines" },
            { label: "Remove all", value: "all" },
          ],
        },
      ],
      getDownloadName: (name) => `cleaned-${Date.now()}.txt`,
      faq: [{ q: "Will it change my content?", a: "Only removes extra whitespace and formatting — your actual text stays the same." }],
      howItWorks: ["Paste your messy text", "Select cleaning options", "Get clean, formatted text"],
    },

    "find-replace": {
      id: "find-replace", name: "Find & Replace", description: "Find and replace text in your content instantly.",
      maxFileSize: 5, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Your text", key: "text", defaultValue: "", placeholder: "Paste text to search in..." },
        { type: "text", label: "Find", key: "find", defaultValue: "", placeholder: "Text to find" },
        { type: "text", label: "Replace with", key: "replace", defaultValue: "", placeholder: "Replacement text" },
      ],
      getDownloadName: (name) => `replaced-${Date.now()}.txt`,
      faq: [{ q: "Is it case-sensitive?", a: "Yes — enable case-sensitive mode for exact matches." }],
      howItWorks: ["Paste your text", "Enter the text to find and its replacement", "Click Replace to update all occurrences"],
    },

    "lorem-ipsum": {
      id: "lorem-ipsum", name: "Lorem Ipsum Generator", description: "Generate placeholder text for designs and layouts.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "radio", label: "Number of paragraphs", key: "paragraphs", defaultValue: "3",
          choices: [
            { label: "1 paragraph", value: "1" },
            { label: "3 paragraphs", value: "3" },
            { label: "5 paragraphs", value: "5" },
            { label: "10 paragraphs", value: "10" },
          ],
        },
      ],
      getDownloadName: (name) => `lorem-ipsum-${Date.now()}.txt`,
      faq: [{ q: "What is Lorem Ipsum?", a: "Standard placeholder text used in publishing and design since the 1500s." }],
      howItWorks: ["Select number of paragraphs needed", "Generate standard Lorem Ipsum text", "Copy or download for your project"],
    },

    "text-to-slug": {
      id: "text-to-slug", name: "URL Slug Generator", description: "Convert text to URL-friendly slug format.",
      maxFileSize: 5, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Your text", key: "text", defaultValue: "", placeholder: "Enter title or heading to convert to slug..." },
        { type: "radio", label: "Separator", key: "separator", defaultValue: "hyphen",
          choices: [
            { label: "Hyphen (-)", value: "hyphen" },
            { label: "Underscore (_)", value: "underscore" },
          ],
        },
      ],
      getDownloadName: (name) => `slug-${Date.now()}.txt`,
      faq: [{ q: "What is a URL slug?", a: "The part of a URL that identifies a page in human-readable form, like /my-blog-post." }],
      howItWorks: ["Enter your page title or heading", "Choose separator style", "Get SEO-friendly URL slug"],
    },

    "duplicate-remover": {
      id: "duplicate-remover", name: "Duplicate Line Remover", description: "Remove duplicate lines from text.",
      maxFileSize: 5, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Your text", key: "text", defaultValue: "", placeholder: "Paste text with duplicates..." },
        { type: "radio", label: "Sort order", key: "sort", defaultValue: "keep",
          choices: [
            { label: "Keep original order", value: "keep" },
            { label: "Sort alphabetically", value: "sort" },
          ],
        },
      ],
      getDownloadName: (name) => `unique-${Date.now()}.txt`,
      faq: [{ q: "Will it change line order?", a: "Only if you choose to sort. Otherwise original order is preserved." }],
      howItWorks: ["Paste text with duplicate lines", "Choose to keep original order or sort", "Get cleaned text with duplicates removed"],
    },

    "text-sorter": {
      id: "text-sorter", name: "Text Sorter", description: "Sort lines of text alphabetically or numerically.",
      maxFileSize: 5, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Your text", key: "text", defaultValue: "", placeholder: "Paste text to sort..." },
        { type: "radio", label: "Sort order", key: "order", defaultValue: "asc",
          choices: [
            { label: "A → Z (Ascending)", value: "asc" },
            { label: "Z → A (Descending)", value: "desc" },
            { label: "Random shuffle", value: "random" },
          ],
        },
      ],
      getDownloadName: (name) => `sorted-${Date.now()}.txt`,
      faq: [{ q: "Can I sort numbers?", a: "Yes — numerically when lines are numbers, alphabetically for text." }],
      howItWorks: ["Paste your lines of text", "Choose sort order", "Get sorted text"],
    },

    "char-counter": {
      id: "char-counter", name: "Character Counter", description: "Count characters with and without spaces.",
      maxFileSize: 5, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Your text", key: "text", defaultValue: "", placeholder: "Paste text to count characters..." },
      ],
      getDownloadName: (name) => `char-count-${Date.now()}.txt`,
      faq: [{ q: "Does it count special characters?", a: "Yes — counts all characters including punctuation and special characters." }],
      howItWorks: ["Paste your text", "See character counts with and without spaces", "Copy or download results"],
    },

    "base64": {
      id: "base64", name: "Base64 Encoder/Decoder", description: "Encode text to Base64 or decode Base64 to readable text.",
      maxFileSize: 5, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Input text", key: "text", defaultValue: "", placeholder: "Enter text or Base64 string..." },
        { type: "radio", label: "Action", key: "action", defaultValue: "encode",
          choices: [
            { label: "Encode to Base64", value: "encode" },
            { label: "Decode from Base64", value: "decode" },
          ],
        },
      ],
      getDownloadName: (name) => `base64-${Date.now()}.txt`,
      faq: [
        { q: "What is Base64?", a: "A binary-to-text encoding scheme that represents binary data as ASCII text using 64 characters." },
        { q: "Is Base64 encryption?", a: "No — Base64 is encoding, not encryption. It's easily reversible and provides no security." },
      ],
      howItWorks: [
        "Enter your text (to encode) or Base64 string (to decode)",
        "Select Encode or Decode mode",
        "Get the result instantly — no server upload needed",
        "Copy the output or download as a text file"
      ],
    },

    "url-encoder": {
      id: "url-encoder", name: "URL Encoder/Decoder", description: "Encode or decode URL strings for safe web transmission.",
      maxFileSize: 5, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Input text", key: "text", defaultValue: "", placeholder: "Enter URL or encoded string..." },
        { type: "radio", label: "Action", key: "action", defaultValue: "encode",
          choices: [
            { label: "Encode URL", value: "encode" },
            { label: "Decode URL", value: "decode" },
          ],
        },
      ],
      getDownloadName: (name) => `url-${Date.now()}.txt`,
      faq: [
        { q: "When should I URL-encode?", a: "When passing data in URL query parameters — spaces, special characters, and non-ASCII characters need encoding." },
        { q: "What characters are encoded?", a: "Spaces become + or %20, special characters like !, @, # become %21, %40, %23, etc." },
      ],
      howItWorks: [
        "Paste your URL or text with special characters",
        "Select Encode (for URLs) or Decode (for encoded strings)",
        "Get the properly encoded/decoded URL instantly",
        "Copy the result for use in your code or browser"
      ],
    },

    "text-json-formatter": {
      id: "text-json-formatter", name: "JSON Formatter", description: "Format and validate JSON data with syntax highlighting.",
      maxFileSize: 5, accept: ".json,.txt", multiple: false,
      options: [
        { type: "textarea", label: "JSON input", key: "text", defaultValue: "", placeholder: "Paste your JSON data here..." },
        { type: "radio", label: "Indentation", key: "indent", defaultValue: "2",
          choices: [
            { label: "2 spaces", value: "2" },
            { label: "4 spaces", value: "4" },
            { label: "Tab", value: "tab" },
          ],
        },
      ],
      getDownloadName: (name) => `formatted-${Date.now()}.json`,
      faq: [
        { q: "Does it validate JSON?", a: "Yes — instantly detects syntax errors and shows exactly where they occur." },
        { q: "What happens with invalid JSON?", a: "The tool highlights the error position and provides a helpful tip to fix it." },
      ],
      howItWorks: [
        "Paste or type your JSON data into the editor",
        "Choose your preferred indentation style (2 spaces, 4 spaces, or tab)",
        "See instant validation with syntax highlighting — errors are caught immediately",
        "Copy the formatted JSON or download as a .json file"
      ],
    },

    "text-js-formatter": {
      id: "text-js-formatter", name: "JavaScript Formatter", description: "Format and beautify JavaScript code with proper indentation.",
      maxFileSize: 5, accept: ".js,.txt,.jsx,.ts,.tsx", multiple: false,
      options: [
        { type: "textarea", label: "JavaScript code", key: "text", defaultValue: "", placeholder: "Paste minified or messy JavaScript..." },
      ],
      getDownloadName: (name) => `formatted-${Date.now()}.js`,
      faq: [
        { q: "Does it fix syntax errors?", a: "It formats valid JavaScript. For minified code, it beautifies with proper indentation and line breaks." },
        { q: "Does it support modern JS?", a: "Yes — supports ES6+, arrow functions, template literals, destructuring, and all modern syntax." },
      ],
      howItWorks: [
        "Paste your minified, compressed, or messy JavaScript code",
        "The formatter parses the code structure and applies proper indentation",
        "Get clean, readable JavaScript with consistent formatting",
        "Copy the formatted code or download as a .js file"
      ],
    },

    "text-js-minifier": {
      id: "text-js-minifier", name: "JavaScript Minifier", description: "Minify JavaScript for production — remove comments and whitespace.",
      maxFileSize: 5, accept: ".js,.txt,.jsx,.ts,.tsx", multiple: false,
      options: [
        { type: "textarea", label: "JavaScript code", key: "text", defaultValue: "", placeholder: "Paste JavaScript to minify..." },
      ],
      getDownloadName: (name) => `minified-${Date.now()}.js`,
      faq: [
        { q: "Will it break my code?", a: "No — it only removes whitespace, comments, and redundant characters. Functionality is preserved." },
        { q: "What's the typical size reduction?", a: "Usually 40-70% smaller, depending on how much comments and whitespace the original code has." },
      ],
      howItWorks: [
        "Paste your JavaScript code with comments and formatting",
        "The minifier strips comments, whitespace, and line breaks",
        "View the compression statistics (original → minified size)",
        "Download the production-ready minified JavaScript file"
      ],
    },

    "jwt-decoder": {
      id: "jwt-decoder", name: "JWT Decoder", description: "Decode and inspect JWT tokens — view header, payload, and claims.",
      maxFileSize: 5, accept: ".txt,.jwt", multiple: false,
      options: [
        { type: "textarea", label: "JWT token", key: "text", defaultValue: "", placeholder: "Paste your JWT token here (three parts separated by dots)..." },
      ],
      getDownloadName: (name) => `jwt-decoded-${Date.now()}.json`,
      faq: [
        { q: "Does it verify signatures?", a: "It decodes the header and payload. Signature verification requires the secret key (not supported here)." },
        { q: "What JWT formats are supported?", a: "Standard JWT format: header.payload.signature (three base64url-encoded parts separated by dots)." },
      ],
      howItWorks: [
        "Paste your JWT token (the full three-part string)",
        "Instantly decode the header (algorithm, type) and payload (claims)",
        "View expiration dates, issued-at, subject, and custom claims",
        "Copy the decoded JSON or download for documentation"
      ],
    },

    "regex-tester": {
      id: "regex-tester", name: "Regex Tester", description: "Test regular expressions in real-time with match highlighting.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Regex pattern", key: "pattern", defaultValue: "", placeholder: "Enter regex pattern (e.g., \\d{3}-\\d{4})" },
        { type: "text", label: "Flags", key: "flags", defaultValue: "g", placeholder: "g, i, m, s" },
        { type: "textarea", label: "Test string", key: "text", defaultValue: "", placeholder: "Enter the string to test your pattern against..." },
      ],
      getDownloadName: (name) => `regex-matches-${Date.now()}.txt`,
      faq: [
        { q: "What are regex flags?", a: "g = global (find all matches), i = case-insensitive, m = multiline (^ and $ match line boundaries), s = dotAll (. matches newlines)." },
        { q: "Does it support capture groups?", a: "Yes — it shows all captured groups and their positions in the match result." },
      ],
      howItWorks: [
        "Enter your regex pattern (e.g., [a-z]+, \\d{3}-\\d{4})",
        "Add flags like g, i, m, s for advanced matching",
        "Type or paste the test string to match against",
        "See matches highlighted instantly with group details"
      ],
    },

    "hash-generator": {
      id: "hash-generator", name: "Hash Generator", description: "Generate MD5, SHA1, SHA256, SHA512 hashes from any text.",
      maxFileSize: 5, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Input text", key: "text", defaultValue: "", placeholder: "Enter text to generate hash..." },
        { type: "radio", label: "Algorithm", key: "algo", defaultValue: "sha256",
          choices: [
            { label: "MD5", value: "md5" },
            { label: "SHA-1", value: "sha1" },
            { label: "SHA-256", value: "sha256" },
            { label: "SHA-512", value: "sha512" },
          ],
        },
      ],
      getDownloadName: (name) => `hash-${Date.now()}.txt`,
      faq: [
        { q: "Which algorithm should I use?", a: "SHA-256 is recommended for most use cases. MD5 is faster but less secure. SHA-512 for maximum security." },
        { q: "Is the same input always produce the same hash?", a: "Yes — the same input with the same algorithm will always produce identical output (deterministic)." },
      ],
      howItWorks: [
        "Enter the text or data you want to hash",
        "Select your preferred algorithm (MD5, SHA-1, SHA-256, or SHA-512)",
        "Get the cryptographic hash instantly",
        "Copy the hash value or download as a text file"
      ],
    },

    "text-base64": {
      id: "text-base64", name: "Text Base64", description: "Encode or decode Base64 text.",
      maxFileSize: 5, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Input text", key: "text", defaultValue: "", placeholder: "Enter text or Base64..." },
        { type: "radio", label: "Action", key: "action", defaultValue: "encode",
          choices: [
            { label: "Encode", value: "encode" },
            { label: "Decode", value: "decode" },
          ],
        },
      ],
      getDownloadName: (name) => `base64-${Date.now()}.txt`,
      faq: [
        { q: "What is Base64?", a: "A binary-to-text encoding scheme that represents binary data as ASCII text using 64 characters." },
        { q: "Is Base64 encryption?", a: "No — Base64 is encoding, not encryption. It's easily reversible and provides no security." },
      ],
      howItWorks: [
        "Enter your text (to encode) or Base64 string (to decode)",
        "Select Encode or Decode mode",
        "Get the result instantly — no server upload needed",
        "Copy the output or download as a text file"
      ],
    },

    "text-json-minifier": {
      id: "text-json-minifier", name: "JSON Minifier", description: "Minify JSON data to compact form — remove whitespace and formatting.",
      maxFileSize: 5, accept: ".json,.txt", multiple: false,
      options: [
        { type: "textarea", label: "JSON input", key: "text", defaultValue: "", placeholder: "Paste formatted JSON to minify..." },
      ],
      getDownloadName: (name) => `minified-${Date.now()}.json`,
      faq: [
        { q: "Why minify JSON?", a: "Smaller payload size means faster API responses and less bandwidth usage in production." },
        { q: "Does it change the data?", a: "No — it only removes whitespace, line breaks, and indentation. The data structure and values remain identical." },
      ],
      howItWorks: [
        "Paste your formatted JSON with indentation and line breaks",
        "The minifier strips all whitespace and unnecessary characters",
        "View the size reduction (formatted → minified)",
        "Download the compact JSON file for production use"
      ],
    },

    "text-css-formatter": {
      id: "text-css-formatter", name: "CSS Formatter", description: "Format and beautify CSS code with proper indentation.",
      maxFileSize: 5, accept: ".css,.txt,.scss,.less", multiple: false,
      options: [
        { type: "textarea", label: "CSS code", key: "text", defaultValue: "", placeholder: "Paste your CSS code here..." },
      ],
      getDownloadName: (name) => `formatted-${Date.now()}.css`,
      faq: [
        { q: "Does it support SCSS/LESS?", a: "It formats standard CSS and works with most SCSS/LESS syntax. Preprocessor-specific features may not be handled." },
        { q: "Does it sort properties?", a: "It formats with proper indentation and line breaks. For property sorting, use a dedicated CSS linter." },
      ],
      howItWorks: [
        "Paste your minified or unformatted CSS code",
        "The formatter structures selectors, properties, and values",
        "Get clean, readable CSS with proper nesting and spacing",
        "Copy the formatted code or download as a .css file"
      ],
    },

    // ─── Dev Tools ───────────────────────────────────────────────

    "json-formatter": {
      id: "json-formatter", name: "JSON Formatter", description: "Format and validate JSON data with syntax highlighting.",
      maxFileSize: 5, accept: ".json,.txt", multiple: false,
      options: [
        { type: "textarea", label: "JSON input", key: "text", defaultValue: "", placeholder: "Paste your JSON data here..." },
        { type: "radio", label: "Indentation", key: "indent", defaultValue: "2",
          choices: [
            { label: "2 spaces", value: "2" },
            { label: "4 spaces", value: "4" },
            { label: "Tab", value: "tab" },
          ],
        },
      ],
      getDownloadName: (name) => `formatted-${Date.now()}.json`,
      faq: [
        { q: "Does it validate JSON?", a: "Yes — instantly detects syntax errors and shows exactly where they occur." },
        { q: "What happens with invalid JSON?", a: "The tool highlights the error position and provides a helpful tip to fix it." },
      ],
      howItWorks: [
        "Paste or type your JSON data into the editor",
        "Choose your preferred indentation style (2 spaces, 4 spaces, or tab)",
        "See instant validation with syntax highlighting — errors are caught immediately",
        "Copy the formatted JSON or download as a .json file"
      ],
    },

    "html-formatter": {
      id: "html-formatter", name: "HTML Formatter", description: "Format and beautify HTML code with proper indentation.",
      maxFileSize: 5, accept: ".html,.htm,.txt", multiple: false,
      options: [
        { type: "textarea", label: "HTML code", key: "text", defaultValue: "", placeholder: "Paste your HTML code here..." },
      ],
      getDownloadName: (name) => `formatted-${Date.now()}.html`,
      faq: [
        { q: "Does it fix broken HTML?", a: "It formats valid HTML with proper indentation. For broken HTML, it attempts to structure it correctly." },
        { q: "Does it minify or beautify?", a: "This tool beautifies HTML — making it readable with proper line breaks and indentation." },
      ],
      howItWorks: [
        "Paste your minified or messy HTML code",
        "The formatter instantly parses and structures your markup",
        "Get beautifully indented HTML with proper nesting",
        "Copy the result or download as a formatted .html file"
      ],
    },

    "css-minifier": {
      id: "css-minifier", name: "CSS Minifier", description: "Minify CSS for production — reduce file size by 30-50%.",
      maxFileSize: 5, accept: ".css,.txt", multiple: false,
      options: [
        { type: "textarea", label: "CSS code", key: "text", defaultValue: "", placeholder: "Paste your CSS code here..." },
      ],
      getDownloadName: (name) => `minified-${Date.now()}.css`,
      faq: [
        { q: "Will it break my styles?", a: "No — it only removes whitespace, comments, and redundant spaces. All functionality is preserved." },
        { q: "How much space is saved?", a: "Typically 30-50% reduction in file size, depending on how verbose the original CSS is." },
      ],
      howItWorks: [
        "Paste your CSS code with comments and whitespace",
        "The minifier strips all unnecessary characters instantly",
        "See the size reduction statistics (original vs minified)",
        "Download the production-ready minified CSS file"
      ],
    },

    "dev-js-formatter": {
      id: "dev-js-formatter", name: "JavaScript Formatter", description: "Format and beautify JavaScript code with proper indentation.",
      maxFileSize: 5, accept: ".js,.txt,.jsx,.ts,.tsx", multiple: false,
      options: [
        { type: "textarea", label: "JavaScript code", key: "text", defaultValue: "", placeholder: "Paste minified or messy JavaScript..." },
      ],
      getDownloadName: (name) => `formatted-${Date.now()}.js`,
      faq: [
        { q: "Does it fix syntax errors?", a: "It formats valid JavaScript. For minified code, it beautifies with proper indentation and line breaks." },
        { q: "Does it support modern JS?", a: "Yes — supports ES6+, arrow functions, template literals, destructuring, and all modern syntax." },
      ],
      howItWorks: [
        "Paste your minified, compressed, or messy JavaScript code",
        "The formatter parses the code structure and applies proper indentation",
        "Get clean, readable JavaScript with consistent formatting",
        "Copy the formatted code or download as a .js file"
      ],
    },

    "dev-js-minifier": {
      id: "dev-js-minifier", name: "JavaScript Minifier", description: "Minify JavaScript for production — remove comments and whitespace.",
      maxFileSize: 5, accept: ".js,.txt,.jsx,.ts,.tsx", multiple: false,
      options: [
        { type: "textarea", label: "JavaScript code", key: "text", defaultValue: "", placeholder: "Paste JavaScript to minify..." },
      ],
      getDownloadName: (name) => `minified-${Date.now()}.js`,
      faq: [
        { q: "Will it break my code?", a: "No — it only removes whitespace, comments, and redundant characters. Functionality is preserved." },
        { q: "What's the typical size reduction?", a: "Usually 40-70% smaller, depending on how much comments and whitespace the original code has." },
      ],
      howItWorks: [
        "Paste your JavaScript code with comments and formatting",
        "The minifier strips comments, whitespace, and line breaks",
        "View the compression statistics (original → minified size)",
        "Download the production-ready minified JavaScript file"
      ],
    },

    "dev-jwt-decoder": {
      id: "dev-jwt-decoder", name: "JWT Decoder", description: "Decode and inspect JWT tokens — view header, payload, and claims.",
      maxFileSize: 5, accept: ".txt,.jwt", multiple: false,
      options: [
        { type: "textarea", label: "JWT token", key: "text", defaultValue: "", placeholder: "Paste your JWT token here (three parts separated by dots)..." },
      ],
      getDownloadName: (name) => `jwt-decoded-${Date.now()}.json`,
      faq: [
        { q: "Does it verify signatures?", a: "It decodes the header and payload. Signature verification requires the secret key (not supported here)." },
        { q: "What JWT formats are supported?", a: "Standard JWT format: header.payload.signature (three base64url-encoded parts separated by dots)." },
      ],
      howItWorks: [
        "Paste your JWT token (the full three-part string)",
        "Instantly decode the header (algorithm, type) and payload (claims)",
        "View expiration dates, issued-at, subject, and custom claims",
        "Copy the decoded JSON or download for documentation"
      ],
    },

    "dev-regex-tester": {
      id: "dev-regex-tester", name: "Regex Tester", description: "Test regular expressions in real-time with match highlighting.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Regex pattern", key: "pattern", defaultValue: "", placeholder: "Enter regex pattern (e.g., \\d{3}-\\d{4})" },
        { type: "text", label: "Flags", key: "flags", defaultValue: "g", placeholder: "g, i, m, s" },
        { type: "textarea", label: "Test string", key: "text", defaultValue: "", placeholder: "Enter the string to test your pattern against..." },
      ],
      getDownloadName: (name) => `regex-matches-${Date.now()}.txt`,
      faq: [
        { q: "What are regex flags?", a: "g = global (find all matches), i = case-insensitive, m = multiline (^ and $ match line boundaries), s = dotAll (. matches newlines)." },
        { q: "Does it support capture groups?", a: "Yes — it shows all captured groups and their positions in the match result." },
      ],
      howItWorks: [
        "Enter your regex pattern (e.g., [a-z]+, \\d{3}-\\d{4})",
        "Add flags like g, i, m, s for advanced matching",
        "Type or paste the test string to match against",
        "See matches highlighted instantly with group details"
      ],
    },

    "dev-hash-generator": {
      id: "dev-hash-generator", name: "Hash Generator", description: "Generate MD5, SHA1, SHA256, SHA512 hashes from any text.",
      maxFileSize: 5, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Input text", key: "text", defaultValue: "", placeholder: "Enter text to generate hash..." },
        { type: "radio", label: "Algorithm", key: "algo", defaultValue: "sha256",
          choices: [
            { label: "MD5", value: "md5" },
            { label: "SHA-1", value: "sha1" },
            { label: "SHA-256", value: "sha256" },
            { label: "SHA-512", value: "sha512" },
          ],
        },
      ],
      getDownloadName: (name) => `hash-${Date.now()}.txt`,
      faq: [
        { q: "Which algorithm should I use?", a: "SHA-256 is recommended for most use cases. MD5 is faster but less secure. SHA-512 for maximum security." },
        { q: "Is the same input always produce the same hash?", a: "Yes — the same input with the same algorithm will always produce identical output (deterministic)." },
      ],
      howItWorks: [
        "Enter the text or data you want to hash",
        "Select your preferred algorithm (MD5, SHA-1, SHA-256, or SHA-512)",
        "Get the cryptographic hash instantly",
        "Copy the hash value or download as a text file"
      ],
    },

    "dev-base64": {
      id: "dev-base64", name: "Base64 Encoder/Decoder", description: "Encode text to Base64 or decode Base64 to readable text.",
      maxFileSize: 5, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Input text", key: "text", defaultValue: "", placeholder: "Enter text or Base64 string..." },
        { type: "radio", label: "Action", key: "action", defaultValue: "encode",
          choices: [
            { label: "Encode to Base64", value: "encode" },
            { label: "Decode from Base64", value: "decode" },
          ],
        },
      ],
      getDownloadName: (name) => `base64-${Date.now()}.txt`,
      faq: [
        { q: "What is Base64?", a: "A binary-to-text encoding scheme that represents binary data as ASCII text using 64 characters." },
        { q: "Is Base64 encryption?", a: "No — Base64 is encoding, not encryption. It's easily reversible and provides no security." },
      ],
      howItWorks: [
        "Enter your text (to encode) or Base64 string (to decode)",
        "Select Encode or Decode mode",
        "Get the result instantly — no server upload needed",
        "Copy the output or download as a text file"
      ],
    },

    "dev-url-encoder": {
      id: "dev-url-encoder", name: "URL Encoder/Decoder", description: "Encode or decode URL strings for safe web transmission.",
      maxFileSize: 5, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Input text", key: "text", defaultValue: "", placeholder: "Enter URL or encoded string..." },
        { type: "radio", label: "Action", key: "action", defaultValue: "encode",
          choices: [
            { label: "Encode URL", value: "encode" },
            { label: "Decode URL", value: "decode" },
          ],
        },
      ],
      getDownloadName: (name) => `url-${Date.now()}.txt`,
      faq: [
        { q: "When should I URL-encode?", a: "When passing data in URL query parameters — spaces, special characters, and non-ASCII characters need encoding." },
        { q: "What characters are encoded?", a: "Spaces become + or %20, special characters like !, @, # become %21, %40, %23, etc." },
      ],
      howItWorks: [
        "Paste your URL or text with special characters",
        "Select Encode (for URLs) or Decode (for encoded strings)",
        "Get the properly encoded/decoded URL instantly",
        "Copy the result for use in your code or browser"
      ],
    },

    "dev-sql-formatter": {
      id: "dev-sql-formatter", name: "SQL Formatter", description: "Format and beautify SQL queries with syntax highlighting.",
      maxFileSize: 5, accept: ".sql,.txt", multiple: false,
      options: [
        { type: "textarea", label: "SQL query", key: "text", defaultValue: "", placeholder: "Paste your SQL query here..." },
      ],
      getDownloadName: (name) => `formatted-${Date.now()}.sql`,
      faq: [
        { q: "Does it support all SQL dialects?", a: "It formats standard SQL. Works with MySQL, PostgreSQL, SQLite, and most SQL variants." },
        { q: "Does it validate SQL syntax?", a: "It formats the structure. For syntax validation, use your database's EXPLAIN command." },
      ],
      howItWorks: [
        "Paste your minified or single-line SQL query",
        "The formatter parses and structures keywords (SELECT, FROM, WHERE, etc.)",
        "Get properly indented SQL with uppercase keywords and line breaks",
        "Copy the formatted query or download as a .sql file"
      ],
    },

    "dev-json-minifier": {
      id: "dev-json-minifier", name: "JSON Minifier", description: "Minify JSON data to compact form — remove whitespace and formatting.",
      maxFileSize: 5, accept: ".json,.txt", multiple: false,
      options: [
        { type: "textarea", label: "JSON input", key: "text", defaultValue: "", placeholder: "Paste formatted JSON to minify..." },
      ],
      getDownloadName: (name) => `minified-${Date.now()}.json`,
      faq: [
        { q: "Why minify JSON?", a: "Smaller payload size means faster API responses and less bandwidth usage in production." },
        { q: "Does it change the data?", a: "No — it only removes whitespace, line breaks, and indentation. The data structure and values remain identical." },
      ],
      howItWorks: [
        "Paste your formatted JSON with indentation and line breaks",
        "The minifier strips all whitespace and unnecessary characters",
        "View the size reduction (formatted → minified)",
        "Download the compact JSON file for production use"
      ],
    },

    "dev-css-formatter": {
      id: "dev-css-formatter", name: "CSS Formatter", description: "Format and beautify CSS code with proper indentation.",
      maxFileSize: 5, accept: ".css,.txt,.scss,.less", multiple: false,
      options: [
        { type: "textarea", label: "CSS code", key: "text", defaultValue: "", placeholder: "Paste your CSS code here..." },
      ],
      getDownloadName: (name) => `formatted-${Date.now()}.css`,
      faq: [
        { q: "Does it support SCSS/LESS?", a: "It formats standard CSS and works with most SCSS/LESS syntax. Preprocessor-specific features may not be handled." },
        { q: "Does it sort properties?", a: "It formats with proper indentation and line breaks. For property sorting, use a dedicated CSS linter." },
      ],
      howItWorks: [
        "Paste your minified or unformatted CSS code",
        "The formatter structures selectors, properties, and values",
        "Get clean, readable CSS with proper nesting and spacing",
        "Copy the formatted code or download as a .css file"
      ],
    },

    // ─── SEO Tools ───────────────────────────────────────────────

    "seo-analyzer": {
      id: "seo-analyzer", name: "SEO Analyzer", description: "Analyze your page for SEO issues — title tags, meta descriptions, headings, keywords, and more.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "textarea", label: "Page HTML content", key: "text", defaultValue: "", placeholder: "Paste your page HTML code here..." },
        { type: "text", label: "Target keyword (optional)", key: "keyword", defaultValue: "", placeholder: "Enter your target keyword..." },
      ],
      getDownloadName: (name) => `seo-analysis-${Date.now()}.md`,
      faq: [
        { q: "What SEO factors does it check?", a: "Title tags, meta descriptions, H1-H6 headings, image alt text, keyword density, word count, internal/external links, Open Graph tags, canonical URL, and schema markup." },
        { q: "How accurate is the analysis?", a: "Uses industry-standard SEO best practices from Google's guidelines. Provides a 0-100 score with specific actionable recommendations." },
      ],
      howItWorks: [
        "Paste your page HTML code into the editor",
        "Optionally enter your target keyword for keyword analysis",
        "Click 'Process' — instant client-side analysis with no server upload",
        "Get a comprehensive SEO score (0-100) with specific issues and fixes",
        "Download the detailed report as a Markdown file"
      ],
    },

    "keyword-research": {
      id: "keyword-research", name: "Keyword Research", description: "Find profitable keywords with search intent analysis and difficulty scores.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Topic or seed keyword", key: "topic", defaultValue: "", placeholder: "Enter your main topic (e.g., 'email marketing')..." },
        { type: "select", label: "Search intent", key: "intent", defaultValue: "all",
          choices: [
            { label: "All intents", value: "all" },
            { label: "Informational (how-to, guides)", value: "informational" },
            { label: "Commercial (reviews, comparisons)", value: "commercial" },
            { label: "Transactional (buy, pricing)", value: "transactional" },
          ],
        },
      ],
      getDownloadName: (name) => `keywords-${Date.now()}.md`,
      faq: [
        { q: "How many keywords will I get?", a: "Typically 20-30+ keyword suggestions including long-tail variations, question-based keywords, and content strategy recommendations." },
        { q: "What is search intent?", a: "The reason behind a search query — informational (learning), commercial (comparing), or transactional (buying). Matching intent improves rankings." },
      ],
      howItWorks: [
        "Enter your seed keyword or topic (e.g., 'email marketing')",
        "Select the search intent you want to target",
        "Click 'Process' — instant keyword generation with no server upload",
        "Get primary keywords with difficulty scores and volume estimates",
        "Receive long-tail variations and question-based keywords for content planning"
      ],
    },

    "meta-tag-generator": {
      id: "meta-tag-generator", name: "Meta Tag Generator", description: "Generate complete HTML meta tags — title, description, Open Graph, Twitter Cards, and canonical.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Page title", key: "title", defaultValue: "", placeholder: "Enter your page title (50-60 chars optimal)..." },
        { type: "text", label: "Meta description", key: "description", defaultValue: "", placeholder: "Enter description (150-160 chars optimal)..." },
        { type: "text", label: "Target keywords", key: "keywords", defaultValue: "", placeholder: "Comma-separated keywords..." },
      ],
      getDownloadName: (name) => `meta-tags-${Date.now()}.html`,
      faq: [
        { q: "What meta tags are generated?", a: "Title tag, meta description, keywords, viewport, robots, Open Graph (Facebook), Twitter Card, and canonical link — ready to paste into your HTML head." },
        { q: "Why are Open Graph tags important?", a: "They control how your page appears when shared on social media (Facebook, LinkedIn, Twitter) — proper tags increase click-through rates by 20-30%." },
      ],
      howItWorks: [
        "Enter your page title (optimize for 50-60 characters)",
        "Write a compelling meta description (150-160 characters)",
        "Add target keywords (comma-separated)",
        "Click 'Process' — get complete HTML meta tag code instantly",
        "Copy the code and paste into your page's <head> section"
      ],
    },

    "serp-preview": {
      id: "serp-preview", name: "SERP Preview", description: "Preview exactly how your page appears in Google search results before publishing.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Page title", key: "title", defaultValue: "", placeholder: "Enter page title..." },
        { type: "text", label: "Meta description", key: "description", defaultValue: "", placeholder: "Enter meta description..." },
        { type: "text", label: "URL", key: "url", defaultValue: "", placeholder: "https://example.com/page" },
      ],
      getDownloadName: (name) => `serp-preview-${Date.now()}.md`,
      faq: [
        { q: "What does SERP stand for?", a: "Search Engine Results Page — the page Google shows after a search. This tool previews how your listing will appear to users." },
        { q: "Why preview before publishing?", a: "Google truncates long titles (after ~60 chars) and descriptions (after ~160 chars). Previewing ensures your message displays correctly." },
      ],
      howItWorks: [
        "Enter your page title (Google shows ~60 characters)",
        "Enter your meta description (Google shows ~155 characters)",
        "Add your page URL",
        "Click 'Process' — see exactly how Google will display your page",
        "Optimize title/description if text is being truncated"
      ],
    },

    "sitemap-generator": {
      id: "sitemap-generator", name: "XML Sitemap Generator", description: "Generate a valid XML sitemap for search engines to discover and index your pages.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "textarea", label: "Page URLs (one per line)", key: "text", defaultValue: "", placeholder: "https://example.com/\nhttps://example.com/about\nhttps://example.com/contact" },
        { type: "radio", label: "Change frequency", key: "frequency", defaultValue: "weekly",
          choices: [
            { label: "Daily", value: "daily" },
            { label: "Weekly", value: "weekly" },
            { label: "Monthly", value: "monthly" },
          ],
        },
      ],
      getDownloadName: (name) => `sitemap-${Date.now()}.xml`,
      faq: [
        { q: "What is a sitemap?", a: "An XML file that lists all pages on your website, helping search engines discover and crawl your content faster. Essential for SEO." },
        { q: "Where do I put the sitemap?", a: "Upload to your website root directory (yourdomain.com/sitemap.xml) and submit the URL to Google Search Console." },
      ],
      howItWorks: [
        "Enter all your page URLs (one per line)",
        "Select how often pages change (daily, weekly, monthly)",
        "Click 'Process' — get valid XML sitemap code instantly",
        "Download the .xml file",
        "Upload to your site root and submit to Google Search Console"
      ],
    },

    "robots-txt-generator": {
      id: "robots-txt-generator", name: "Robots.txt Generator", description: "Create a robots.txt file to control how search engines crawl your website.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "radio", label: "Crawl policy", key: "policy", defaultValue: "allow-all",
          choices: [
            { label: "Allow all (open crawling)", value: "allow-all" },
            { label: "Block all (no crawling)", value: "disallow-all" },
            { label: "Custom rules", value: "custom" },
          ],
        },
        { type: "textarea", label: "Paths to block (one per line)", key: "text", defaultValue: "", placeholder: "/admin/\n/api/\n/private/" },
      ],
      getDownloadName: (name) => `robots-${Date.now()}.txt`,
      faq: [
        { q: "What is robots.txt?", a: "A text file at your site root that tells search engine crawlers which pages to access or skip. It's the first thing crawlers read." },
        { q: "What paths should I block?", a: "Common paths to block: /admin/, /api/, /tmp/, /private/, /wp-admin/, /search/ — pages that don't provide value to users." },
      ],
      howItWorks: [
        "Select your crawl policy (allow all, block all, or custom)",
        "For custom: enter paths to block (one per line, e.g., /admin/)",
        "Click 'Process' — get valid robots.txt code instantly",
        "Download the .txt file",
        "Upload to your site root directory (yourdomain.com/robots.txt)"
      ],
    },

    "keyword-density": {
      id: "keyword-density", name: "Keyword Density Checker", description: "Analyze keyword frequency and density in your content — detect over-optimization.",
      maxFileSize: 5, accept: ".txt,.md", multiple: false,
      options: [
        { type: "textarea", label: "Your content", key: "text", defaultValue: "", placeholder: "Paste your article or page content here..." },
        { type: "text", label: "Target keyword", key: "keyword", defaultValue: "", placeholder: "Enter keyword to analyze (e.g., 'email marketing')..." },
      ],
      getDownloadName: (name) => `keyword-density-${Date.now()}.md`,
      faq: [
        { q: "What is ideal keyword density?", a: "Generally 1-2% for primary keywords. Over 3% risks keyword stuffing penalties. Under 0.5% may mean insufficient optimization." },
        { q: "What is TF-IDF?", a: "Term Frequency-Inverse Document Frequency — a measure of how important a word is to a document relative to a collection of documents." },
      ],
      howItWorks: [
        "Paste your article or page content",
        "Enter the target keyword to analyze",
        "Click 'Process' — get detailed density analysis instantly",
        "See keyword count, density percentage, and TF-IDF score",
        "Get top 20 keywords and optimization recommendations"
      ],
    },

    "seo-title-generator": {
      id: "seo-title-generator", name: "SEO Title Generator", description: "Generate optimized page titles that rank higher and get more clicks.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Main topic", key: "topic", defaultValue: "", placeholder: "Enter your page topic (e.g., 'email marketing guide')..." },
        { type: "text", label: "Target keyword", key: "keyword", defaultValue: "", placeholder: "Primary keyword (e.g., 'email marketing')..." },
      ],
      getDownloadName: (name) => `seo-title-${Date.now()}.md`,
      faq: [
        { q: "What is the ideal title length?", a: "50-60 characters for Google. Titles over 60 characters get truncated with '...' in search results." },
        { q: "What makes a good title?", a: "Include target keyword near the beginning, use power words (Guide, Best, How-To), add the current year, and make it compelling to click." },
      ],
      howItWorks: [
        "Enter your page topic (e.g., 'email marketing guide')",
        "Add your target keyword for optimization",
        "Click 'Process' — get 6+ optimized title variations instantly",
        "See character count and truncation preview for each title",
        "Choose the best title and copy it to your page"
      ],
    },

    "seo-meta-desc": {
      id: "seo-meta-desc", name: "Meta Description Generator", description: "Generate compelling meta descriptions that increase click-through rates from search results.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Page topic", key: "topic", defaultValue: "", placeholder: "Enter your page topic..." },
        { type: "text", label: "Target keyword", key: "keyword", defaultValue: "", placeholder: "Primary keyword..." },
      ],
      getDownloadName: (name) => `meta-desc-${Date.now()}.md`,
      faq: [
        { q: "What is ideal meta description length?", a: "150-160 characters. Google shows up to 155-160 characters before truncating with '...'." },
        { q: "Do meta descriptions affect rankings?", a: "Not directly, but compelling descriptions increase click-through rates (CTR), which indirectly improves rankings. A good CTR is 3-5%." },
      ],
      howItWorks: [
        "Enter your page topic",
        "Add your target keyword for optimization",
        "Click 'Process' — get 5+ meta description variations instantly",
        "See character count and Google preview for each description",
        "Choose the best one and add it to your page's meta tags"
      ],
    },

    "redirect-checker": {
      id: "redirect-checker", name: "Redirect Checker", description: "Analyze URL structure and detect potential redirect issues before they hurt SEO.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "URL to analyze", key: "url", defaultValue: "", placeholder: "https://example.com/page" },
      ],
      getDownloadName: (name) => `redirect-analysis-${Date.now()}.md`,
      faq: [
        { q: "What redirect types are there?", a: "301 (permanent — passes full link juice), 302 (temporary — passes less link juice), meta refresh, and JavaScript redirects." },
        { q: "Why do redirects matter for SEO?", a: "Broken redirects cause 404 errors, lose link equity, waste crawl budget, and hurt rankings. Proper redirects preserve SEO value." },
      ],
      howItWorks: [
        "Enter the URL you want to analyze",
        "Click 'Process' — get instant URL structure analysis",
        "See protocol, subdomain, path, query parameters, and hash analysis",
        "Get specific issues: trailing slashes, uppercase, special characters",
        "Receive recommendations for URL optimization"
      ],
    },

    "google-index-checker": {
      id: "google-index-checker", name: "Google Index Checker", description: "Check if your URL is indexable by Google and identify indexing issues.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "URL to check", key: "url", defaultValue: "", placeholder: "https://example.com/page" },
      ],
      getDownloadName: (name) => `index-analysis-${Date.now()}.md`,
      faq: [
        { q: "How accurate is this tool?", a: "Provides analysis based on URL structure and common indexing signals. For precise data, use Google Search Console's URL Inspection tool." },
        { q: "What prevents indexing?", a: "noindex tags, robots.txt blocks, canonical issues, thin content, duplicate content, and manual actions can all prevent indexing." },
      ],
      howItWorks: [
        "Enter the URL you want to check",
        "Click 'Process' — get instant indexability analysis",
        "See if URL structure is indexable (protocol, readability, length)",
        "Check for potential blocking factors (robots.txt patterns, noindex signals)",
        "Get SEO recommendations to improve indexability"
      ],
    },

    "backlink-checker": {
      id: "backlink-checker", name: "Backlink Checker", description: "Analyze backlink profile and get link-building strategies to improve domain authority.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Website URL", key: "url", defaultValue: "", placeholder: "https://example.com" },
      ],
      getDownloadName: (name) => `backlink-analysis-${Date.now()}.md`,
      faq: [
        { q: "What are backlinks?", a: "Links from other websites pointing to yours. They're one of Google's top ranking factors — more quality backlinks = higher authority." },
        { q: "How do I get more backlinks?", a: "Create link-worthy content (guides, research, tools), guest posting, broken link building, HARO, and outreach to relevant sites in your niche." },
      ],
      howItWorks: [
        "Enter your website URL",
        "Click 'Process' — get backlink profile analysis instantly",
        "See domain analysis and authority indicators",
        "Get link-building strategy recommendations",
        "Download outreach email templates for link building"
      ],
    },

    // ─── Business Tools ──────────────────────────────────────────

    "invoice-generator": {
      id: "invoice-generator", name: "Invoice Generator", description: "Create professional invoices.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Your business name", key: "business", defaultValue: "", placeholder: "Your company name" },
        { type: "text", label: "Client name", key: "client", defaultValue: "", placeholder: "Client company name" },
        { type: "textarea", label: "Line items", key: "items", defaultValue: "", placeholder: "Item 1 - $100\nItem 2 - $200" },
        { type: "text", label: "Due date", key: "due", defaultValue: "", placeholder: "Net 30" },
      ],
      getDownloadName: (name) => `invoice-${Date.now()}.txt`,
      faq: [{ q: "Can I customize the invoice?", a: "Yes — the AI generates a professional invoice template you can edit." }],
      howItWorks: ["Enter business and client details", "Add line items with amounts", "Get a professional invoice ready to send"],
    },

    "receipt-generator": {
      id: "receipt-generator", name: "Receipt Generator", description: "Create professional receipts.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Business name", key: "business", defaultValue: "", placeholder: "Your company name" },
        { type: "text", label: "Customer name", key: "customer", defaultValue: "", placeholder: "Customer name" },
        { type: "textarea", label: "Items purchased", key: "items", defaultValue: "", placeholder: "Item 1 - $10\nItem 2 - $20" },
      ],
      getDownloadName: (name) => `receipt-${Date.now()}.txt`,
      faq: [{ q: "Is this a legal receipt?", a: "It generates a professional receipt template. Check local regulations for legal requirements." }],
      howItWorks: ["Enter business and customer details", "Add items with prices", "Get a professional receipt"],
    },

    "quotation-generator": {
      id: "quotation-generator", name: "Quotation Generator", description: "Create professional quotations.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Your business", key: "business", defaultValue: "", placeholder: "Your company name" },
        { type: "text", label: "Client name", key: "client", defaultValue: "", placeholder: "Client name" },
        { type: "textarea", label: "Services/Products", key: "items", defaultValue: "", placeholder: "Service 1 - $500\nService 2 - $1000" },
        { type: "text", label: "Valid until", key: "valid", defaultValue: "", placeholder: "30 days" },
      ],
      getDownloadName: (name) => `quotation-${Date.now()}.txt`,
      faq: [{ q: "How long is a quotation valid?", a: "Typically 30 days. You can specify the validity period." }],
      howItWorks: ["Enter business and client details", "Add services/products with prices", "Get a professional quotation"],
    },

    "purchase-order-generator": {
      id: "purchase-order-generator", name: "Purchase Order Generator", description: "Create professional purchase orders.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Your company", key: "business", defaultValue: "", placeholder: "Your company name" },
        { type: "text", label: "Supplier name", key: "supplier", defaultValue: "", placeholder: "Supplier name" },
        { type: "textarea", label: "Items to order", key: "items", defaultValue: "", placeholder: "Item 1 - Qty 10 - $50 each\nItem 2 - Qty 5 - $100 each" },
      ],
      getDownloadName: (name) => `purchase-order-${Date.now()}.txt`,
      faq: [{ q: "What is a purchase order?", a: "A document sent to a supplier to buy goods or services at a specified price." }],
      howItWorks: ["Enter your company and supplier details", "Add items with quantities and prices", "Get a professional purchase order"],
    },

    "business-proposal": {
      id: "business-proposal", name: "Business Proposal Generator", description: "Create professional business proposals.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Your company", key: "business", defaultValue: "", placeholder: "Your company name" },
        { type: "text", label: "Client/Target", key: "client", defaultValue: "", placeholder: "Client or target audience" },
        { type: "textarea", label: "Project description", key: "description", defaultValue: "", placeholder: "Describe the project..." },
      ],
      getDownloadName: (name) => `proposal-${Date.now()}.txt`,
      faq: [{ q: "What sections are included?", a: "Executive summary, scope, timeline, pricing, terms, and next steps." }],
      howItWorks: ["Enter company and client details", "Describe the project", "Get a professional business proposal"],
    },

    "contract-generator": {
      id: "contract-generator", name: "Contract Generator", description: "Create professional contracts.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "select", label: "Contract type", key: "type", defaultValue: "service",
          choices: [
            { label: "Service Agreement", value: "service" },
            { label: "NDA", value: "nda" },
            { label: "Employment", value: "employment" },
          ],
        },
        { type: "text", label: "Party A", key: "partyA", defaultValue: "", placeholder: "First party name" },
        { type: "text", label: "Party B", key: "partyB", defaultValue: "", placeholder: "Second party name" },
      ],
      getDownloadName: (name) => `contract-${Date.now()}.txt`,
      faq: [{ q: "Is this legally binding?", a: "This generates a template. Consult a lawyer for legally binding contracts." }],
      howItWorks: ["Select contract type", "Enter party names", "Get a professional contract template"],
    },

    "profit-margin": {
      id: "profit-margin", name: "Profit Margin Calculator", description: "Calculate profit margins and markups.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Cost price", key: "cost", defaultValue: "", placeholder: "Enter cost price" },
        { type: "text", label: "Selling price", key: "price", defaultValue: "", placeholder: "Enter selling price" },
      ],
      getDownloadName: (name) => `margin-${Date.now()}.txt`,
      faq: [{ q: "What margin types does it calculate?", a: "Gross margin, net margin, markup percentage, and break-even analysis." }],
      howItWorks: ["Enter cost and selling prices", "Get profit margin and markup calculations", "See break-even analysis"],
    },

    "gst-vat-calculator": {
      id: "gst-vat-calculator", name: "GST/VAT Calculator", description: "Calculate GST or VAT on purchases.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Amount", key: "amount", defaultValue: "", placeholder: "Enter base amount" },
        { type: "text", label: "Tax rate (%)", key: "rate", defaultValue: "", placeholder: "e.g. 10, 15, 18, 25" },
        { type: "select", label: "Tax type", key: "taxType", defaultValue: "GST",
          choices: [
            { label: "GST", value: "GST" },
            { label: "VAT", value: "VAT" },
            { label: "Sales Tax", value: "Sales Tax" },
            { label: "Custom", value: "Custom" },
          ],
        },
        { type: "radio", label: "Calculation mode", key: "mode", defaultValue: "exclusive",
          choices: [
            { label: "Add tax (exclusive)", value: "exclusive" },
            { label: "Extract tax (inclusive)", value: "inclusive" },
          ],
        },
      ],
      getDownloadName: (name) => `gst-vat-${Date.now()}.txt`,
      faq: [
        { q: "What is GST/VAT?", a: "Goods and Services Tax / Value Added Tax — indirect taxes on purchases and sales." },
        { q: "How do I calculate forward?", a: "Enter base amount and tax rate. The calculator adds tax to get total." },
        { q: "How do I extract tax from total?", a: "Enter the tax-inclusive amount and select 'Extract tax' mode." },
      ],
      howItWorks: [
        "Enter the base amount",
        "Enter your custom tax rate (e.g. 10 for 10%)",
        "Select tax type and calculation mode",
        "Get forward calculation (add tax) and reverse calculation (extract tax)",
      ],
    },

    "salary-calculator": {
      id: "salary-calculator", name: "Salary Calculator", description: "Calculate salary, deductions, and take-home pay.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Annual salary", key: "salary", defaultValue: "", placeholder: "Enter annual salary" },
        { type: "select", label: "Tax regime", key: "regime", defaultValue: "new",
          choices: [
            { label: "New regime", value: "new" },
            { label: "Old regime", value: "old" },
          ],
        },
      ],
      getDownloadName: (name) => `salary-${Date.now()}.txt`,
      faq: [{ q: "What deductions are included?", a: "Income tax, professional tax, and provident fund based on selected regime." }],
      howItWorks: ["Enter your annual salary", "Select tax regime", "Get detailed salary breakdown with take-home pay"],
    },

    "business-name-generator": {
      id: "business-name-generator", name: "Business Name Generator", description: "Generate creative business names.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Industry/keywords", key: "industry", defaultValue: "", placeholder: "e.g. tech, food, fashion..." },
        { type: "select", label: "Style", key: "style", defaultValue: "modern",
          choices: [
            { label: "Modern", value: "modern" },
            { label: "Professional", value: "professional" },
            { label: "Creative", value: "creative" },
            { label: "Minimal", value: "minimal" },
          ],
        },
      ],
      getDownloadName: (name) => `business-names-${Date.now()}.txt`,
      faq: [{ q: "How many names will I get?", a: "Typically 10-15 creative name suggestions with explanations." }],
      howItWorks: ["Enter your industry and keywords", "Select naming style", "Get creative business name suggestions"],
    },

    // ─── Marketing Tools ─────────────────────────────────────────

    "qr-generator": {
      id: "qr-generator", name: "QR Code Generator", description: "Generate QR codes for any content.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "textarea", label: "Content", key: "text", defaultValue: "", placeholder: "Enter URL, text, or data..." },
        { type: "select", label: "Type", key: "type", defaultValue: "url",
          choices: [
            { label: "URL", value: "url" },
            { label: "Text", value: "text" },
            { label: "Email", value: "email" },
            { label: "Phone", value: "phone" },
          ],
        },
      ],
      getDownloadName: (name) => `qr-code-${Date.now()}.png`,
      faq: [{ q: "What formats are supported?", a: "Generates QR code as downloadable SVG image format." }],
      howItWorks: ["Enter the content for QR code", "Select QR type", "Download your QR code image"],
    },

    "qr-code-generator": {
      id: "qr-code-generator", name: "QR Code Generator", description: "Generate QR codes for any URL or text.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "textarea", label: "Content", key: "text", defaultValue: "", placeholder: "Enter URL, text, or data..." },
        { type: "select", label: "Type", key: "type", defaultValue: "url",
          choices: [
            { label: "URL", value: "url" },
            { label: "Text", value: "text" },
            { label: "Email", value: "email" },
            { label: "Phone", value: "phone" },
          ],
        },
      ],
      getDownloadName: (name) => `qr-code-${Date.now()}.png`,
      faq: [{ q: "What formats are supported?", a: "Generates QR code as downloadable SVG image format." }],
      howItWorks: ["Enter the content for QR code", "Select QR type", "Download your QR code image"],
    },

    "utm-builder": {
      id: "utm-builder", name: "UTM Builder", description: "Build UTM parameters for campaign tracking.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Website URL", key: "url", defaultValue: "", placeholder: "https://example.com" },
        { type: "text", label: "Campaign source", key: "source", defaultValue: "", placeholder: "e.g. google, facebook" },
        { type: "text", label: "Campaign medium", key: "medium", defaultValue: "", placeholder: "e.g. cpc, email" },
        { type: "text", label: "Campaign name", key: "campaign", defaultValue: "", placeholder: "e.g. summer_sale" },
      ],
      getDownloadName: (name) => `utm-${Date.now()}.txt`,
      faq: [{ q: "What are UTM parameters?", a: "Tags added to URLs to track campaign performance in Google Analytics." }],
      howItWorks: ["Enter your website URL", "Add campaign source, medium, and name", "Get complete URL with UTM parameters"],
    },

    "hashtag-generator": {
      id: "hashtag-generator", name: "Hashtag Generator", description: "Generate relevant hashtags for social media.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Topic or keyword", key: "topic", defaultValue: "", placeholder: "Enter your topic..." },
        { type: "select", label: "Platform", key: "platform", defaultValue: "instagram",
          choices: [
            { label: "Instagram", value: "instagram" },
            { label: "Twitter/X", value: "twitter" },
            { label: "TikTok", value: "tiktok" },
            { label: "LinkedIn", value: "linkedin" },
          ],
        },
      ],
      getDownloadName: (name) => `hashtags-${Date.now()}.txt`,
      faq: [{ q: "How many hashtags will I get?", a: "Typically 20-30 relevant hashtags optimized for the selected platform." }],
      howItWorks: ["Enter your topic or keyword", "Select social platform", "Get optimized hashtags ready to use"],
    },

    "social-caption": {
      id: "social-caption", name: "Social Caption Generator", description: "Create engaging social media captions.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Topic", key: "topic", defaultValue: "", placeholder: "What to post about..." },
        { type: "select", label: "Platform", key: "platform", defaultValue: "instagram",
          choices: [
            { label: "Instagram", value: "instagram" },
            { label: "Twitter/X", value: "twitter" },
            { label: "LinkedIn", value: "linkedin" },
            { label: "Facebook", value: "facebook" },
          ],
        },
        { type: "radio", label: "Tone", key: "tone", defaultValue: "engaging",
          choices: [
            { label: "Engaging", value: "engaging" },
            { label: "Professional", value: "professional" },
            { label: "Funny", value: "funny" },
            { label: "Inspirational", value: "inspirational" },
          ],
        },
      ],
      getDownloadName: (name) => `caption-${Date.now()}.txt`,
      faq: [{ q: "Will it include hashtags?", a: "Yes — relevant hashtags are included for Instagram and TikTok." }],
      howItWorks: ["Enter your topic", "Select platform and tone", "Get engaging caption with hashtags"],
    },

    "email-subject": {
      id: "email-subject", name: "Email Subject Line Generator", description: "Generate compelling email subject lines.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Email topic", key: "topic", defaultValue: "", placeholder: "What is the email about..." },
        { type: "select", label: "Type", key: "type", defaultValue: "marketing",
          choices: [
            { label: "Marketing", value: "marketing" },
            { label: "Newsletter", value: "newsletter" },
            { label: "Promotional", value: "promotional" },
            { label: "Transactional", value: "transactional" },
          ],
        },
      ],
      getDownloadName: (name) => `subject-lines-${Date.now()}.txt`,
      faq: [{ q: "How many subject lines?", a: "Typically 10 subject line variations with open rate predictions." }],
      howItWorks: ["Enter your email topic", "Select email type", "Get compelling subject line options"],
    },

    "cta-generator": {
      id: "cta-generator", name: "CTA Generator", description: "Generate effective call-to-action phrases.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Product/service", key: "product", defaultValue: "", placeholder: "What are you promoting..." },
        { type: "select", label: "Goal", key: "goal", defaultValue: "sales",
          choices: [
            { label: "Drive sales", value: "sales" },
            { label: "Get signups", value: "signups" },
            { label: "Download", value: "download" },
            { label: "Learn more", value: "learn" },
          ],
        },
      ],
      getDownloadName: (name) => `cta-${Date.now()}.txt`,
      faq: [{ q: "What makes a good CTA?", a: "Clear, action-oriented, specific, and creates urgency." }],
      howItWorks: ["Enter your product or service", "Select your goal", "Get high-converting CTA phrases"],
    },

    "landing-page-headline": {
      id: "landing-page-headline", name: "Landing Page Headline Generator", description: "Generate high-converting headlines.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Product/service", key: "product", defaultValue: "", placeholder: "What you're selling..." },
        { type: "text", label: "Target audience", key: "audience", defaultValue: "", placeholder: "Who is this for..." },
        { type: "radio", label: "Style", key: "style", defaultValue: "benefit",
          choices: [
            { label: "Benefit-focused", value: "benefit" },
            { label: "Problem-solving", value: "problem" },
            { label: "Curiosity-driven", value: "curiosity" },
          ],
        },
      ],
      getDownloadName: (name) => `headlines-${Date.now()}.txt`,
      faq: [{ q: "How many headlines?", a: "10-15 headline variations optimized for conversion." }],
      howItWorks: ["Enter your product and target audience", "Select headline style", "Get high-converting headline options"],
    },

    "ad-copy": {
      id: "ad-copy", name: "Ad Copy Generator", description: "Generate compelling ad copy for campaigns.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Product/service", key: "product", defaultValue: "", placeholder: "What you're advertising..." },
        { type: "select", label: "Platform", key: "platform", defaultValue: "google",
          choices: [
            { label: "Google Ads", value: "google" },
            { label: "Facebook Ads", value: "facebook" },
            { label: "Instagram Ads", value: "instagram" },
            { label: "LinkedIn Ads", value: "linkedin" },
          ],
        },
        { type: "text", label: "Target audience", key: "audience", defaultValue: "", placeholder: "Who is this for..." },
      ],
      getDownloadName: (name) => `ad-copy-${Date.now()}.txt`,
      faq: [{ q: "What ad formats are generated?", a: "Headlines, descriptions, and call-to-action variations for the selected platform." }],
      howItWorks: ["Enter your product and target audience", "Select advertising platform", "Get ready-to-use ad copy variations"],
    },

    "marketing-calendar": {
      id: "marketing-calendar", name: "Marketing Calendar", description: "Plan your marketing campaigns.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Industry", key: "industry", defaultValue: "", placeholder: "Your industry..." },
        { type: "select", label: "Time period", key: "period", defaultValue: "month",
          choices: [
            { label: "1 month", value: "month" },
            { label: "3 months", value: "quarter" },
            { label: "6 months", value: "half" },
          ],
        },
      ],
      getDownloadName: (name) => `marketing-calendar-${Date.now()}.txt`,
      faq: [{ q: "What campaigns are suggested?", a: "Seasonal campaigns, product launches, content themes, and social media schedules." }],
      howItWorks: ["Enter your industry", "Select planning period", "Get a complete marketing calendar with campaign ideas"],
    },

    "youtube-title": {
      id: "youtube-title", name: "YouTube Title Generator", description: "Generate SEO-optimized YouTube video titles.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Video topic", key: "topic", defaultValue: "", placeholder: "What is your video about..." },
        { type: "text", label: "Target keyword", key: "keyword", defaultValue: "", placeholder: "Primary keyword..." },
      ],
      getDownloadName: (name) => `youtube-titles-${Date.now()}.txt`,
      faq: [{ q: "What is ideal YouTube title length?", a: "50-70 characters for optimal search visibility." }],
      howItWorks: ["Enter your video topic and keyword", "Get optimized title options", "Choose the best for your video"],
    },

    "youtube-desc": {
      id: "youtube-desc", name: "YouTube Description Generator", description: "Generate SEO-optimized video descriptions.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "text", label: "Video topic", key: "topic", defaultValue: "", placeholder: "What is your video about..." },
        { type: "text", label: "Target keyword", key: "keyword", defaultValue: "", placeholder: "Primary keyword..." },
      ],
      getDownloadName: (name) => `youtube-description-${Date.now()}.txt`,
      faq: [{ q: "How long should YouTube descriptions be?", a: "At least 200 words for good SEO. Include timestamps and links." }],
      howItWorks: ["Enter your video topic and keyword", "Get optimized description with timestamps", "Copy and paste to YouTube"],
    },

    // ─── Missing Image/Audio Tools ───────────────────────────────

    "image-to-pdf": {
      id: "image-to-pdf", name: "Image to PDF", description: "Convert images to PDF documents.",
      maxFileSize: 50, accept: ".jpg,.jpeg,.png,.webp,.bmp,.tiff", multiple: true,
      options: [
        { type: "radio", label: "Page size", key: "pageSize", defaultValue: "fit",
          choices: [
            { label: "Fit to image", value: "fit" },
            { label: "A4 Portrait", value: "a4-p" },
            { label: "A4 Landscape", value: "a4-l" },
          ],
        },
        { type: "radio", label: "Quality", key: "quality", defaultValue: "high",
          choices: [
            { label: "High quality", value: "high" },
            { label: "Medium (smaller file)", value: "medium" },
          ],
        },
      ],
      getDownloadName: (name) => `images-${Date.now()}.pdf`,
      faq: [{ q: "How many images can I convert?", a: "Up to 20 images in a single PDF." }],
      howItWorks: ["Upload one or more images", "Select page size and quality", "Download your PDF with images"],
    },

    "audio-recorder": {
      id: "audio-recorder", name: "Audio Recorder", description: "Record audio directly from your browser.",
      maxFileSize: 0, accept: "", multiple: false,
      options: [
        { type: "select", label: "Format", key: "format", defaultValue: "webm",
          choices: [
            { label: "WebM (best quality)", value: "webm" },
            { label: "MP3", value: "mp3" },
          ],
        },
      ],
      getDownloadName: (name) => `recording-${Date.now()}.webm`,
      faq: [{ q: "How long can I record?", a: "As long as your browser allows. Typical limit is 1-2 hours." }],
      howItWorks: ["Click Start Recording", "Speak into your microphone", "Download your recording when done"],
    },
  }
}
