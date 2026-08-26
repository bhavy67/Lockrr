"use client";

import { FolderOpen } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCategories,
  useDocuments,
} from "@/features/documents/hooks";

export function CategoriesView() {
  const { data: categories, isLoading } = useCategories();
  const { data: docs = [] } = useDocuments({ archived: false });

  const countByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of docs) {
      if (d.categoryId) {
        map.set(d.categoryId, (map.get(d.categoryId) ?? 0) + 1);
      }
    }
    return map;
  }, [docs]);

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No categories yet."
        description="Default categories are seeded when you sign up."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c) => {
        const count = countByCategory.get(c.id) ?? 0;
        return (
          <Link
            key={c.id}
            href={`/vault?category=${c.id}`}
            className="focus-ring group flex items-center gap-4 rounded-lg border border-border bg-card p-4 shadow-subtle transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-white"
              style={{ background: c.color }}
              aria-hidden
            >
              <FolderOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-foreground">
                {c.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {count === 0
                  ? "Nothing here yet"
                  : count === 1
                    ? "1 document"
                    : `${count} documents`}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
