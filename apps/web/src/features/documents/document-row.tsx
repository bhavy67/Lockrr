"use client";

import { formatDistanceToNow } from "date-fns";
import { Star } from "lucide-react";
import Link from "next/link";
import type { Category, DocumentRecord, Tag } from "@lockkaro/types";
import { TagChip } from "@/features/tags/tag-chip";
import { cn, formatBytes } from "@/lib/utils";
import { DocumentActionsMenu } from "./document-actions";
import { DocumentIcon } from "./document-icon";
import { ExpiryBadge } from "./expiry-badge";

interface Props {
  document: DocumentRecord;
  category?: Category;
  tags?: Tag[];
}

export function DocumentRow({ document: doc, category, tags }: Props) {
  const shownTags = tags?.filter((t) => doc.tagIds.includes(t.id)).slice(0, 2) ?? [];
  return (
    <Link
      href={`/vault/${doc.id}`}
      className={cn(
        "focus-ring group flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 transition-colors",
        "hover:border-border hover:bg-surface",
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
        <DocumentIcon mimeType={doc.mimeType} className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-medium text-foreground">
            {doc.title}
          </h3>
          {doc.isFavorite && (
            <Star className="h-3.5 w-3.5 shrink-0 fill-warning text-warning" />
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {category ? (
            <>
              <span
                className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
                style={{ background: category.color }}
                aria-hidden
              />
              {category.name} ·{" "}
            </>
          ) : null}
          {formatBytes(doc.sizeBytes)} ·{" "}
          {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
        </p>
      </div>

      {shownTags.length > 0 && (
        <div className="hidden shrink-0 items-center gap-1 md:flex">
          {shownTags.map((t) => (
            <TagChip key={t.id} tag={t} />
          ))}
        </div>
      )}

      <div className="hidden shrink-0 sm:block">
        <ExpiryBadge document={doc} compact />
      </div>

      <div className="shrink-0">
        <DocumentActionsMenu document={doc} align="end" />
      </div>
    </Link>
  );
}
