"use client";

import { create } from "zustand";
import { toast } from "sonner";
import { data } from "@/lib/data";
import { extract } from "./extract";
import type { ExtractionProgress } from "./types";

interface QueueJob {
  documentId: string;
  file: File;
  title: string;
}

interface QueueState {
  /** documentIds currently in flight or waiting. */
  activeIds: Set<string>;
  /** Progress for the job currently running. */
  progress: Record<string, ExtractionProgress>;
  enqueue: (job: QueueJob) => void;
}

/** Runtime store — plain JS state, not persisted. */
const jobs: QueueJob[] = [];
let running = false;

// The invalidator is set by ExtractionQueueMount once TanStack Query is
// available. Keeping it out of the store avoids importing React libraries here.
let invalidateDocumentText: ((documentId: string) => void) | null = null;
export function bindQueryInvalidator(
  fn: (documentId: string) => void,
): () => void {
  invalidateDocumentText = fn;
  return () => {
    if (invalidateDocumentText === fn) invalidateDocumentText = null;
  };
}

export const useExtractionQueue = create<QueueState>((set, get) => ({
  activeIds: new Set(),
  progress: {},
  enqueue: (job) => {
    if (get().activeIds.has(job.documentId)) return;
    jobs.push(job);
    set((s) => {
      const next = new Set(s.activeIds);
      next.add(job.documentId);
      return { activeIds: next };
    });
    void tick();
  },
}));

async function tick(): Promise<void> {
  if (running) return;
  const job = jobs.shift();
  if (!job) return;
  running = true;

  try {
    // Signal processing so the UI shows a spinner immediately.
    await data
      .saveDocumentText({
        documentId: job.documentId,
        status: "processing",
        content: null,
        extractionMethod: null,
      })
      .catch(() => {
        // If the write fails (offline, RLS, whatever) we still try to extract.
      });
    invalidateDocumentText?.(job.documentId);

    const result = await extract(job.file, (progress) => {
      useExtractionQueue.setState((s) => ({
        progress: { ...s.progress, [job.documentId]: progress },
      }));
    });

    await data.saveDocumentText({
      documentId: job.documentId,
      status: result.status,
      content: result.content,
      extractionMethod: result.method,
    });
    invalidateDocumentText?.(job.documentId);

    if (result.status === "done") {
      toast.success(`Text extracted from ${job.title}.`);
    } else if (result.status === "empty") {
      toast(`No readable text found in ${job.title}.`, { duration: 3000 });
    } else if (result.status === "failed") {
      toast.error(
        result.error ?? `Couldn't extract text from ${job.title}.`,
      );
    }
  } catch (err) {
    // Last-ditch: mark as failed so the UI doesn't sit on "processing" forever.
    const message =
      err instanceof Error ? err.message : "Extraction failed.";
    await data
      .saveDocumentText({
        documentId: job.documentId,
        status: "failed",
        content: null,
        extractionMethod: null,
      })
      .catch(() => undefined);
    invalidateDocumentText?.(job.documentId);
    toast.error(`${job.title}: ${message}`);
  } finally {
    useExtractionQueue.setState((s) => {
      const next = new Set(s.activeIds);
      next.delete(job.documentId);
      const nextProgress = { ...s.progress };
      delete nextProgress[job.documentId];
      return { activeIds: next, progress: nextProgress };
    });
    running = false;
    if (jobs.length > 0) void tick();
  }
}
