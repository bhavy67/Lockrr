import { FileImage, FileText, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function documentKind(mimeType: string): "image" | "pdf" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return "other";
}

export function DocumentIcon({
  mimeType,
  className,
}: {
  mimeType: string;
  className?: string;
}) {
  const kind = documentKind(mimeType);
  if (kind === "image")
    return <FileImage className={cn("text-sky-500", className)} />;
  if (kind === "pdf")
    return <FileText className={cn("text-rose-500", className)} />;
  return <FileIcon className={cn("text-muted-foreground", className)} />;
}
