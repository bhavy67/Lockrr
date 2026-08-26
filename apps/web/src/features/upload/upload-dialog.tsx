"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  isAcceptedMimeType,
} from "@lockerr/validation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/features/documents/hooks";
import { useExtractionQueue } from "@/features/extraction/queue";
import { TagPicker } from "@/features/tags/tag-picker";
import { data } from "@/lib/data";
import { cn, formatBytes, stripExtension } from "@/lib/utils";
import { useUploadDialog } from "./upload-dialog-store";

interface QueueItem {
  id: string;
  file: File;
  title: string;
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
}

function toIsoOrNull(dateInput: string): string | null {
  return dateInput ? new Date(dateInput).toISOString() : null;
}

export function UploadDialog() {
  const { isOpen, close, initialFiles } = useUploadDialog();
  const { data: categories = [] } = useCategories();
  const qc = useQueryClient();
  const enqueueExtraction = useExtractionQueue((s) => s.enqueue);

  const [items, setItems] = useState<QueueItem[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [documentDate, setDocumentDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showSharedMeta, setShowSharedMeta] = useState(false);

  useEffect(() => {
    if (isOpen && initialFiles?.length) {
      addFiles(initialFiles);
    }
    if (!isOpen) {
      setItems([]);
      setCategoryId(null);
      setTagIds([]);
      setDocumentDate("");
      setExpiryDate("");
      setShowSharedMeta(false);
      setUploading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialFiles]);

  const addFiles = useCallback((files: File[]) => {
    const next: QueueItem[] = [];
    for (const f of files) {
      if (!isAcceptedMimeType(f.type)) {
        toast.error(`${f.name}: file type not supported.`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE_BYTES) {
        toast.error(
          `${f.name}: file is too large (${formatBytes(f.size)}). Max ${formatBytes(MAX_FILE_SIZE_BYTES)}.`,
        );
        continue;
      }
      next.push({
        id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2)}`,
        file: f,
        title: stripExtension(f.name),
        progress: 0,
        status: "queued",
      });
    }
    setItems((prev) => [...prev, ...next]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: addFiles,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: MAX_FILE_SIZE_BYTES,
    noClick: false,
  });

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItemTitle = (id: string, title: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, title } : i)),
    );
  };

  const startUpload = async () => {
    const untitled = items.find((i) => !i.title.trim());
    if (untitled) {
      toast.error("Give every document a title.");
      return;
    }

    setUploading(true);

    for (const item of items) {
      if (item.status === "done") continue;
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "uploading", progress: 0 } : i,
        ),
      );
      try {
        const uploaded = await data.uploadDocument({
          file: item.file,
          title: item.title.trim(),
          categoryId,
          tagIds: tagIds.length ? tagIds : undefined,
          documentDate: toIsoOrNull(documentDate),
          expiryDate: toIsoOrNull(expiryDate),
          onProgress: (pct) => {
            setItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, progress: pct } : i)),
            );
          },
        });
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: "done", progress: 100 } : i,
          ),
        );
        // Kick off extraction with the original File object — no re-download.
        // Fire-and-forget: the queue owns retries, status writes, and toasts.
        enqueueExtraction({
          documentId: uploaded.id,
          file: item.file,
          title: uploaded.title,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Couldn't upload this document.";
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: "error", error: message } : i,
          ),
        );
      }
    }

    setUploading(false);
    qc.invalidateQueries({ queryKey: ["documents"] });
    qc.invalidateQueries({ queryKey: ["activity"] });

    const successCount = items.filter((i) => i.status !== "error").length;
    if (successCount > 0) {
      toast.success(
        successCount === 1
          ? "1 document added to your vault."
          : `${successCount} documents added.`,
      );
    }
  };

  const allDone = items.length > 0 && items.every((i) => i.status === "done");
  const isSingle = items.length === 1;

  const liveStatus = useMemo(() => {
    if (allDone) return `All ${items.length} documents uploaded.`;
    if (uploading) {
      const done = items.filter((i) => i.status === "done").length;
      return `Uploading document ${done + 1} of ${items.length}.`;
    }
    return "";
  }, [uploading, allDone, items]);

  const acceptSummary = useMemo(
    () =>
      ACCEPTED_MIME_TYPES.map((t) => t.split("/")[1]?.toUpperCase())
        .filter(Boolean)
        .join(" · "),
    [],
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v && !uploading) close();
      }}
    >
      <DialogContent className="max-w-xl">
        <div className="sr-only" role="status" aria-live="polite">
          {liveStatus}
        </div>
        <DialogHeader>
          <DialogTitle>
            {items.length === 0
              ? "Upload documents"
              : isSingle
                ? "Add document details"
                : `Add ${items.length} documents`}
          </DialogTitle>
          <DialogDescription>
            {items.length === 0
              ? `Drop files here or pick from your device. ${acceptSummary} up to ${formatBytes(MAX_FILE_SIZE_BYTES)}.`
              : "Details are optional — you can always edit them later."}
          </DialogDescription>
        </DialogHeader>

        {items.length === 0 ? (
          <div
            {...getRootProps()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface/50 px-6 py-12 text-center transition-colors",
              isDragActive && "border-primary/60 bg-primary/5",
            )}
          >
            <input {...getInputProps()} aria-label="Choose files to upload" />
            <UploadCloud className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {isDragActive ? "Drop to add" : "Drop files or click to browse"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Multiple files supported.
            </p>
          </div>
        ) : (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            {/* Queue */}
            <div className="space-y-2">
              {items.map((item) => (
                <QueueRow
                  key={item.id}
                  item={item}
                  onRemove={() => removeItem(item.id)}
                  onTitleChange={(v) => updateItemTitle(item.id, v)}
                  removable={!uploading}
                  disabled={uploading}
                />
              ))}
            </div>

            {/* Metadata */}
            <div className="rounded-md border border-border bg-surface/40 p-3">
              {!isSingle && (
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Apply to all files
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSharedMeta((v) => !v)}
                    className="focus-ring flex items-center gap-1 rounded p-0.5 text-xs text-muted-foreground hover:text-foreground"
                    aria-expanded={showSharedMeta}
                  >
                    {showSharedMeta ? "Hide dates & tags" : "Add dates & tags"}
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 transition-transform",
                        showSharedMeta && "rotate-180",
                      )}
                    />
                  </button>
                </div>
              )}

              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={categoryId ?? "none"}
                    onValueChange={(v) =>
                      setCategoryId(v === "none" ? null : v)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Uncategorized" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Uncategorized</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <AnimatePresence initial={false}>
                  {(isSingle || showSharedMeta) && (
                    <motion.div
                      key="meta"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-3 pt-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="upload-doc-date" className="text-xs">
                            Document date
                            <span className="ml-1 font-normal text-muted-foreground">
                              (optional)
                            </span>
                          </Label>
                          <Input
                            id="upload-doc-date"
                            type="date"
                            value={documentDate}
                            onChange={(e) => setDocumentDate(e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="upload-expiry" className="text-xs">
                            Expires on
                            <span className="ml-1 font-normal text-muted-foreground">
                              (optional)
                            </span>
                          </Label>
                          <Input
                            id="upload-expiry"
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <Label className="text-xs">Tags</Label>
                        <TagPicker
                          value={tagIds}
                          onChange={setTagIds}
                          triggerLabel="Add tag"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Add more */}
            <div
              {...getRootProps()}
              className="flex cursor-pointer items-center justify-center rounded-md border border-dashed border-border py-3 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              <input {...getInputProps()} aria-label="Add more files" />
              + Add more files
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={close} disabled={uploading}>
            {allDone ? "Done" : "Cancel"}
          </Button>
          <Button
            onClick={startUpload}
            disabled={items.length === 0 || uploading || allDone}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading
              </>
            ) : allDone ? (
              "Uploaded"
            ) : (
              `Save & upload ${items.length} file${items.length === 1 ? "" : "s"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QueueRow({
  item,
  onRemove,
  onTitleChange,
  removable,
  disabled,
}: {
  item: QueueItem;
  onRemove: () => void;
  onTitleChange: (v: string) => void;
  removable: boolean;
  disabled: boolean;
}) {
  const isImage = item.file.type.startsWith("image/");
  const Icon = isImage ? ImageIcon : FileText;
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-card p-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={item.title}
            onChange={(e) => onTitleChange(e.target.value)}
            disabled={disabled}
            aria-label="Document title"
            placeholder="Give this document a title"
            className="focus-ring min-w-0 flex-1 truncate rounded-sm border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-foreground hover:border-border focus:border-input focus:bg-background"
          />
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {formatBytes(item.file.size)}
          </span>
        </div>
        <p
          className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground"
          title={item.file.name}
        >
          {item.file.name}
        </p>
        {item.status === "uploading" && (
          <Progress value={item.progress} className="mt-1.5" />
        )}
        {item.status === "error" && (
          <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            {item.error}
          </p>
        )}
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center">
        {item.status === "done" ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : item.status === "uploading" ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : removable ? (
          <button
            type="button"
            onClick={onRemove}
            className="focus-ring rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={`Remove ${item.file.name}`}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
