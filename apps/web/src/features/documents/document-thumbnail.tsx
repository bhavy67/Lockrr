"use client";

import { useEffect, useState } from "react";
import type { DocumentRecord } from "@lockkaro/types";
import { DocumentIcon, documentKind } from "./document-icon";
import { data } from "@/lib/data";
import { cn } from "@/lib/utils";

interface Props {
  document: DocumentRecord;
  className?: string;
}

export function DocumentThumbnail({ document, className }: Props) {
  const kind = documentKind(document.mimeType);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let created: string | null = null;
    if (kind !== "image") return;
    void data
      .getDocumentUrl(document.id)
      .then((u) => {
        if (cancelled) URL.revokeObjectURL(u);
        else {
          created = u;
          setUrl(u);
        }
      })
      .catch(() => setUrl(null));
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [document.id, kind]);

  if (kind === "image" && url) {
    return (
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center overflow-hidden bg-muted",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-surface to-muted",
        className,
      )}
    >
      <DocumentIcon mimeType={document.mimeType} className="h-10 w-10" />
    </div>
  );
}
