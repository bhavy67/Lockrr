"use client";

import { format } from "date-fns";
import {
  Copy,
  FileWarning,
  Loader2,
  Sparkles,
  Type,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { DocumentRecord } from "@lockkaro/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDocumentText,
  useExtractionProgress,
  useIsExtracting,
} from "@/features/extraction/hooks";
import { useExtractionQueue } from "@/features/extraction/queue";
import { data } from "@/lib/data";
import { cn } from "@/lib/utils";

interface Props {
  document: DocumentRecord;
}

export function DocumentContentTab({ document: doc }: Props) {
  const { data: text, isLoading } = useDocumentText(doc.id);
  const processing = useIsExtracting(doc.id);
  const progress = useExtractionProgress(doc.id);
  const enqueue = useExtractionQueue((s) => s.enqueue);
  const [fetchingBlob, setFetchingBlob] = useState(false);

  const runExtraction = async () => {
    setFetchingBlob(true);
    try {
      // Existing documents don't have the original File in memory — pull it
      // from the storage URL. In the mock this is a blob URL from IndexedDB;
      // in Supabase it's a short-lived signed URL.
      const url = await data.getDocumentUrl(doc.id);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      const blob = await res.blob();
      const file = new File([blob], doc.fileName, {
        type: doc.mimeType,
      });
      enqueue({ documentId: doc.id, file, title: doc.title });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Couldn't start extraction.";
      toast.error(message);
    } finally {
      setFetchingBlob(false);
    }
  };

  const copyText = async () => {
    if (!text?.content) return;
    try {
      await navigator.clipboard.writeText(text.content);
      toast.success("Copied.");
    } catch {
      toast.error("Couldn't copy. Try selecting the text.");
    }
  };

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  const status = processing ? "processing" : (text?.status ?? "not_extracted");

  if (status === "processing") {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-surface/60 p-6 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
        <p className="text-sm font-medium">
          {progress?.label ?? "Extracting text"}
        </p>
        {progress?.ratio !== undefined && (
          <Progress
            value={Math.round(progress.ratio * 100)}
            className="mx-auto max-w-xs"
          />
        )}
        <p className="text-xs text-muted-foreground">
          This runs in your browser — nothing is sent to a server.
        </p>
      </div>
    );
  }

  if (status === "not_extracted") {
    return (
      <EmptyState
        icon={Sparkles}
        title="No text extracted yet."
        description="Run extraction to make this document's contents searchable and previewable here."
        action={
          <Button onClick={runExtraction} disabled={fetchingBlob}>
            {fetchingBlob ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Extract text
              </>
            )}
          </Button>
        }
      />
    );
  }

  if (status === "empty") {
    return (
      <EmptyState
        icon={Type}
        title="No readable text was found."
        description={
          doc.mimeType.startsWith("image/")
            ? "The image doesn't appear to contain text, or the text was too small to read."
            : "This PDF has no embedded text. Scanned PDFs will be supported in a future update."
        }
        action={
          <Button
            variant="outline"
            onClick={runExtraction}
            disabled={fetchingBlob}
          >
            Try again
          </Button>
        }
      />
    );
  }

  if (status === "failed") {
    return (
      <EmptyState
        icon={FileWarning}
        title="Extraction failed."
        description="Something went wrong reading this document. You can try again."
        action={
          <Button
            variant="outline"
            onClick={runExtraction}
            disabled={fetchingBlob}
          >
            Retry
          </Button>
        }
      />
    );
  }

  // done
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            {text?.characterCount.toLocaleString()}{" "}
            {text?.characterCount === 1 ? "character" : "characters"}
          </span>
          {text?.extractedAt && (
            <>
              <span className="text-border">·</span>
              <span>
                Extracted {format(new Date(text.extractedAt), "MMM d, yyyy")}
              </span>
            </>
          )}
          {text?.extractionMethod && (
            <>
              <span className="text-border">·</span>
              <span className="font-mono">{methodLabel(text.extractionMethod)}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={copyText}>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={runExtraction}
            disabled={fetchingBlob}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Re-extract
          </Button>
        </div>
      </div>

      <pre
        className={cn(
          "max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-surface/60 p-4",
          "font-mono text-xs leading-relaxed text-foreground",
        )}
      >
        {text?.content}
      </pre>
    </div>
  );
}

function methodLabel(m: string): string {
  switch (m) {
    case "pdf-embedded":
      return "PDF text layer";
    case "ocr-image":
      return "OCR (image)";
    case "ocr-pdf":
      return "OCR (scanned PDF)";
    default:
      return m;
  }
}
