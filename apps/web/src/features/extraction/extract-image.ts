"use client";

import {
  MIN_MEANINGFUL_CHARS,
  type ExtractionResult,
  type ProgressCallback,
} from "./types";

/**
 * OCR an image with Tesseract.js.
 *
 * Tesseract creates its own worker and downloads the English language model
 * from a CDN on first use (~4 MB, cached in IndexedDB by tesseract.js itself).
 * The whole thing runs off the main thread, so the UI doesn't freeze.
 */
export async function extractImage(
  file: File,
  onProgress?: ProgressCallback,
): Promise<ExtractionResult> {
  const { createWorker } = await import("tesseract.js");
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;

  try {
    worker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          onProgress?.({ ratio: m.progress, label: "Reading image" });
        } else if (m.status === "loading language traineddata") {
          onProgress?.({ ratio: m.progress * 0.1, label: "Loading language" });
        }
      },
    });

    const { data } = await worker.recognize(file);
    const trimmed = (data.text ?? "").replace(/[ \t]+/g, " ").trim();

    if (trimmed.length < MIN_MEANINGFUL_CHARS) {
      return { status: "empty", content: null, method: "ocr-image" };
    }

    return { status: "done", content: trimmed, method: "ocr-image" };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Couldn't read the image.";
    return {
      status: "failed",
      content: null,
      method: "ocr-image",
      error: message,
    };
  } finally {
    await worker?.terminate();
  }
}
