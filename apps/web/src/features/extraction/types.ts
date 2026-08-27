import type { ExtractionMethod } from "@lockkaro/types";

/**
 * What an extractor returns. The queue turns this into a saveDocumentText call.
 * `status` maps 1-to-1 to `ExtractionStatus` on the domain type, minus
 * `not_extracted` / `processing` which are lifecycle states the queue owns.
 */
export interface ExtractionResult {
  status: "done" | "empty" | "failed";
  content: string | null;
  method: ExtractionMethod | null;
  error?: string;
}

export interface ExtractionProgress {
  /** 0..1, may be omitted for extractors that can't report progress. */
  ratio?: number;
  /** Short label the UI shows next to the spinner. */
  label?: string;
}

export type ProgressCallback = (progress: ExtractionProgress) => void;

/** Threshold below which we say "no meaningful text was found." */
export const MIN_MEANINGFUL_CHARS = 20;
