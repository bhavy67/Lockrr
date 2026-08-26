"use client";

import { extractImage } from "./extract-image";
import { extractPdf } from "./extract-pdf";
import type { ExtractionResult, ProgressCallback } from "./types";

/**
 * Orchestrator: pick the right extractor for the file's MIME type.
 * The extractor runs in the browser — no server involvement.
 */
export async function extract(
  file: File,
  onProgress?: ProgressCallback,
): Promise<ExtractionResult> {
  if (file.type === "application/pdf") {
    return extractPdf(file, onProgress);
  }
  if (file.type.startsWith("image/")) {
    return extractImage(file, onProgress);
  }
  return {
    status: "empty",
    content: null,
    method: null,
  };
}

export { MIN_MEANINGFUL_CHARS } from "./types";
export type {
  ExtractionResult,
  ExtractionProgress,
  ProgressCallback,
} from "./types";
