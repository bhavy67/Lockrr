"use client";

import Link from "next/link";
import { useMemo } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { FolderOpen } from "lucide-react";
import type { Category, DocumentRecord } from "@lockkaro/types";
import { cn } from "@/lib/utils";

interface Props {
  categories: Category[];
  documents: DocumentRecord[];
}

export function CategoryBreakdown({ categories, documents }: Props) {
  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    let uncategorized = 0;
    for (const d of documents) {
      if (d.categoryId) counts.set(d.categoryId, (counts.get(d.categoryId) ?? 0) + 1);
      else uncategorized++;
    }
    const total = documents.length || 1;
    const rows = categories
      .map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        count: counts.get(c.id) ?? 0,
        pct: Math.round(((counts.get(c.id) ?? 0) / total) * 100),
      }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    if (uncategorized > 0) {
      rows.push({
        id: "uncategorized",
        name: "Uncategorized",
        color: "#71717A",
        count: uncategorized,
        pct: Math.round((uncategorized / total) * 100),
      });
    }
    return rows;
  }, [categories, documents]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Category mix appears here."
        description="Categorize a few documents to see the breakdown."
      />
    );
  }

  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.id}>
          <BreakdownRow row={r} />
        </li>
      ))}
    </ul>
  );
}

function BreakdownRow({
  row,
}: {
  row: { id: string; name: string; color: string; count: number; pct: number };
}) {
  const isReal = row.id !== "uncategorized";
  const inner = (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: row.color }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-medium text-foreground">
            {row.name}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            {row.count} · {row.pct}%
          </span>
        </div>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(2, row.pct)}%`, background: row.color }}
          />
        </div>
      </div>
    </div>
  );

  return isReal ? (
    <Link
      href={`/vault?category=${row.id}`}
      className={cn(
        "focus-ring block rounded-md px-1 py-0.5 transition-colors hover:bg-surface",
      )}
    >
      {inner}
    </Link>
  ) : (
    <div className="px-1 py-0.5">{inner}</div>
  );
}
