"use client";

import {
  MIN_MEANINGFUL_CHARS,
  type ExtractionResult,
  type ProgressCallback,
} from "./types";

/**
 * Extract embedded text from a PDF using pdf.js.
 *
 * The worker (~1 MB) is emitted by webpack as its own static file and only
 * fetched the first time a PDF is read — so it works offline and inside the
 * native app, and always matches the library version.
 *
 * Scanned PDFs (no embedded text) return `status: "empty"`. OCR-of-PDF-pages
 * ships in Phase 7.5, when we render each page to a canvas and run Tesseract.
 */
let workerConfigured = false;

export async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    workerConfigured = true;
  }
  return pdfjs;
}

export async function extractPdf(
  file: File,
  onProgress?: ProgressCallback,
): Promise<ExtractionResult> {
  try {
    onProgress?.({ ratio: 0, label: "Reading PDF" });
    const pdfjs = await loadPdfjs();

    const buffer = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buffer }).promise;

    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        // `.str` exists on TextItem, not on TextMarkedContent — filter defensively.
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      text += pageText + "\n\n";
      onProgress?.({
        ratio: i / doc.numPages,
        label: `Reading page ${i} of ${doc.numPages}`,
      });
    }

    const trimmed = text.replace(/[ \t]+/g, " ").trim();

    if (trimmed.length < MIN_MEANINGFUL_CHARS) {
      return { status: "empty", content: null, method: "pdf-embedded" };
    }

    return {
      status: "done",
      content: trimmed,
      method: "pdf-embedded",
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Couldn't read the PDF.";
    return {
      status: "failed",
      content: null,
      method: "pdf-embedded",
      error: message,
    };
  }
}
