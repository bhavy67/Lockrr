"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/features/documents/hooks";
import { data } from "@/lib/data";
import { cn, formatBytes } from "@/lib/utils";
import { useUploadDialog } from "./upload-dialog-store";

interface QueueItem {
  id: string;
  file: File;
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
}

export function UploadDialog() {
  const { isOpen, close, initialFiles } = useUploadDialog();
  const { data: categories = [] } = useCategories();
  const qc = useQueryClient();

  const [items, setItems] = useState<QueueItem[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen && initialFiles?.length) {
      addFiles(initialFiles);
    }
    if (!isOpen) {
      setItems([]);
      setCategoryId(null);
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

  const startUpload = async () => {
    if (!items.length) return;
    setUploading(true);

    for (const item of items) {
      if (item.status === "done") continue;
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "uploading", progress: 0 } : i,
        ),
      );
      try {
        await data.uploadDocument({
          file: item.file,
          categoryId,
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

  const acceptSummary = useMemo(() => {
    return ACCEPTED_MIME_TYPES.map((t) => t.split("/")[1]?.toUpperCase())
      .filter(Boolean)
      .join(" · ");
  }, []);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v && !uploading) close();
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload documents</DialogTitle>
          <DialogDescription>
            Drop files here or pick from your device. {acceptSummary} up to {formatBytes(MAX_FILE_SIZE_BYTES)}.
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
          <div className="space-y-3">
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {items.map((item) => (
                <QueueRow
                  key={item.id}
                  item={item}
                  onRemove={() => removeItem(item.id)}
                  removable={!uploading}
                />
              ))}
            </div>

            <div className="rounded-md border border-border bg-surface/60 p-3">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Category (applies to all)
              </label>
              <Select
                value={categoryId ?? "none"}
                onValueChange={(v) => setCategoryId(v === "none" ? null : v)}
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
          <Button
            variant="ghost"
            onClick={close}
            disabled={uploading}
          >
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
              `Upload ${items.length} file${items.length === 1 ? "" : "s"}`
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
  removable,
}: {
  item: QueueItem;
  onRemove: () => void;
  removable: boolean;
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
          <p className="truncate text-sm font-medium text-foreground">
            {item.file.name}
          </p>
          <span className="text-[11px] text-muted-foreground">
            {formatBytes(item.file.size)}
          </span>
        </div>
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
