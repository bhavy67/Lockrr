"use client";

import { Library, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocuments } from "@/features/documents/hooks";
import { CollectionFormDialog } from "./collection-form-dialog";
import { useCollections } from "./hooks";

export function CollectionsView() {
  const { data: collections, isLoading } = useCollections();
  const { data: docs = [] } = useDocuments({ archived: false });
  const [dialogOpen, setDialogOpen] = useState(false);

  const countByCollection = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of docs) {
      for (const cid of d.collectionIds) {
        map.set(cid, (map.get(cid) ?? 0) + 1);
      }
    }
    return map;
  }, [docs]);

  return (
    <>
      <div className="mb-6 flex items-end justify-between sm:mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Collections
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Group documents that belong together.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} aria-label="New collection">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New collection</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : !collections || collections.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No collections yet."
          description="Group documents into meaningful sets: a job application, a trip, a tax year."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Create your first collection
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => {
            const count = countByCollection.get(c.id) ?? 0;
            return (
              <Link
                key={c.id}
                href={`/collections/${c.id}`}
                className="focus-ring group flex min-w-0 flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-subtle transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-md text-white"
                    style={{ background: c.color }}
                    aria-hidden
                  >
                    <Library className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold text-foreground">
                      {c.name}
                    </h2>
                    {c.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {c.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  {count === 0 ? "Empty" : `${count} document${count === 1 ? "" : "s"}`}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <CollectionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
