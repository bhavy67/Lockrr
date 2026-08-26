"use client";

import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Star } from "lucide-react";
import Link from "next/link";
import type { Category, DocumentRecord } from "@lockerr/types";
import { Badge } from "@/components/ui/badge";
import { cn, formatBytes } from "@/lib/utils";
import { DocumentActionsMenu } from "./document-actions";
import { DocumentThumbnail } from "./document-thumbnail";
import { ExpiryBadge } from "./expiry-badge";

interface Props {
  document: DocumentRecord;
  category?: Category;
}

export function DocumentCard({ document: doc, category }: Props) {
  return (
    <Link
      href={`/vault/${doc.id}`}
      className={cn(
        "focus-ring group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated",
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <DocumentThumbnail document={doc} />

        <AnimatePresence>
          {doc.isFavorite && (
            <motion.div
              key="fav"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 shadow-subtle"
            >
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            </motion.div>
          )}
        </AnimatePresence>

        {category && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="outline" className="bg-background/90 backdrop-blur">
              <span
                className="mr-1.5 h-2 w-2 rounded-full"
                style={{ background: category.color }}
                aria-hidden
              />
              {category.name}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-foreground">
            {doc.title}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatBytes(doc.sizeBytes)} ·{" "}
            {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
          </p>
          {doc.expiryDate && (
            <div className="mt-2">
              <ExpiryBadge document={doc} compact />
            </div>
          )}
        </div>
        <div className="opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <DocumentActionsMenu document={doc} />
        </div>
      </div>
    </Link>
  );
}
