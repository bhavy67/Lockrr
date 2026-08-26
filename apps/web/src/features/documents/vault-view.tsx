"use client";

import { FolderOpen, LayoutGrid, List, Search, Star, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { DocumentFilters, DocumentSort, DocumentView } from "@lockerr/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useUploadDialog } from "@/features/upload/upload-dialog-store";
import { useTags } from "@/features/tags/hooks";
import { useDebounced } from "@/lib/hooks/use-debounced";
import { useCategories, useDocuments } from "./hooks";
import { DocumentCard } from "./document-card";
import { DocumentRow } from "./document-row";
import {
  VaultFilters,
  VaultSortDropdown,
  type FilterState,
} from "./vault-filters";

interface VaultViewProps {
  initialFilters?: DocumentFilters;
  emptyTitle?: string;
  emptyDescription?: string;
  hideControls?: boolean;
}

export function VaultView({
  initialFilters,
  emptyTitle = "Your vault is empty.",
  emptyDescription = "Upload your first important document.",
  hideControls,
}: VaultViewProps) {
  const [view, setView] = useState<DocumentView>("grid");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 200);
  const [favoritesOnly, setFavoritesOnly] = useState(
    initialFilters?.favoritesOnly ?? false,
  );
  const [sort, setSort] = useState<DocumentSort>(initialFilters?.sort ?? "recent");
  const [filters, setFilters] = useState<FilterState>({
    categoryId: initialFilters?.categoryId ?? null,
    tagIds: initialFilters?.tagIds ?? [],
    fileKinds: initialFilters?.fileKinds ?? [],
    archived: initialFilters?.archived ?? false,
  });

  const composedFilters: DocumentFilters = useMemo(
    () => ({
      ...initialFilters,
      query: debouncedQuery.trim() || undefined,
      favoritesOnly,
      sort,
      categoryId: filters.categoryId ?? initialFilters?.categoryId ?? null,
      tagIds: filters.tagIds.length ? filters.tagIds : undefined,
      fileKinds: filters.fileKinds.length ? filters.fileKinds : undefined,
      archived: filters.archived
        ? true
        : initialFilters?.archived ?? undefined,
    }),
    [initialFilters, debouncedQuery, favoritesOnly, sort, filters],
  );

  const { data: documents, isLoading } = useDocuments(composedFilters);
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const openUpload = useUploadDialog((s) => s.open);
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const hasQuery = Boolean(debouncedQuery.trim() || favoritesOnly);
  const hasStructuredFilters =
    !!filters.categoryId ||
    filters.tagIds.length > 0 ||
    filters.fileKinds.length > 0 ||
    filters.archived;
  const hasAnyFilter = hasQuery || hasStructuredFilters;

  const clearAll = () => {
    setQuery("");
    setFavoritesOnly(false);
    setFilters({ categoryId: null, tagIds: [], fileKinds: [], archived: false });
  };

  return (
    <div className="space-y-4">
      {!hideControls && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search title, description, filename…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-vault-search
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="focus-ring absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={favoritesOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setFavoritesOnly((v) => !v)}
              aria-pressed={favoritesOnly}
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5",
                  favoritesOnly && "fill-primary-foreground",
                )}
              />
              <span className="hidden sm:inline">Favorites</span>
            </Button>
            <VaultFilters
              value={filters}
              onChange={setFilters}
              sort={sort}
              onSortChange={setSort}
            />
            <VaultSortDropdown sort={sort} onChange={setSort} />
            <div className="hidden items-center rounded-md border border-border sm:flex">
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-pressed={view === "grid"}
                aria-label="Grid view"
                className={cn(
                  "focus-ring flex h-8 w-8 items-center justify-center rounded-l-md text-muted-foreground",
                  view === "grid" && "bg-secondary text-foreground",
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                aria-label="List view"
                className={cn(
                  "focus-ring flex h-8 w-8 items-center justify-center rounded-r-md text-muted-foreground",
                  view === "list" && "bg-secondary text-foreground",
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <VaultSkeleton view={view} />
      ) : !documents || documents.length === 0 ? (
        hasAnyFilter ? (
          <EmptyState
            icon={Search}
            title="No documents found."
            description="Try a different search or remove some filters."
            action={
              <Button variant="outline" onClick={clearAll}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={FolderOpen}
            title={emptyTitle}
            description={emptyDescription}
            action={<Button onClick={() => openUpload()}>Upload document</Button>}
          />
        )
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {documents.map((d) => (
            <DocumentCard
              key={d.id}
              document={d}
              category={d.categoryId ? categoryMap.get(d.categoryId) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1 rounded-lg border border-border bg-card p-1">
          {documents.map((d) => (
            <DocumentRow
              key={d.id}
              document={d}
              category={d.categoryId ? categoryMap.get(d.categoryId) : undefined}
              tags={tags}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VaultSkeleton({ view }: { view: DocumentView }) {
  if (view === "list") {
    return (
      <div className="space-y-1 rounded-lg border border-border bg-card p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2">
            <Skeleton className="h-10 w-10" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-border">
          <Skeleton className="aspect-[4/5] w-full" />
          <div className="space-y-1.5 p-3">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
