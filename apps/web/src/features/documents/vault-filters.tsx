"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpDown, Filter, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import type { Category, DocumentSort, Tag } from "@lockkaro/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCategories } from "@/features/documents/hooks";
import { useTags } from "@/features/tags/hooks";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: Array<{ id: DocumentSort; label: string }> = [
  { id: "recent", label: "Recently added" },
  { id: "modified", label: "Recently modified" },
  { id: "name", label: "Name (A → Z)" },
  { id: "document_date", label: "Document date" },
  { id: "expiry_date", label: "Expiry date" },
];

interface FilterState {
  categoryId: string | null;
  tagIds: string[];
  fileKinds: Array<"pdf" | "image">;
  archived: boolean;
}

interface FiltersProps {
  value: FilterState;
  onChange: (next: FilterState) => void;
  sort: DocumentSort;
  onSortChange: (s: DocumentSort) => void;
}

// ─── Sort dropdown ────────────────────────────────────────────────────────────

export function VaultSortDropdown({
  sort,
  onChange,
}: {
  sort: DocumentSort;
  onChange: (s: DocumentSort) => void;
}) {
  const current = SORT_OPTIONS.find((o) => o.id === sort)?.label ?? "Sort";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowUpDown className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{current}</span>
          <span className="sm:hidden">Sort</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={sort}
          onValueChange={(v) => onChange(v as DocumentSort)}
        >
          {SORT_OPTIONS.map((o) => (
            <DropdownMenuRadioItem key={o.id} value={o.id}>
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Filter trigger (popover / sheet) ─────────────────────────────────────────
// Category is handled externally via the quick-strip; this popover covers
// tags, file type, and archived.

export function VaultFilters(props: FiltersProps) {
  const activeCount = countActive(props.value);
  return (
    <>
      <div className="md:hidden">
        <MobileFilterSheet {...props} activeCount={activeCount} />
      </div>
      <div className="hidden md:block">
        <DesktopFilterPopover {...props} activeCount={activeCount} />
      </div>
    </>
  );
}

function countActive(v: FilterState): number {
  let n = 0;
  if (v.tagIds.length) n++;
  if (v.fileKinds.length) n++;
  if (v.archived) n++;
  return n;
}

function DesktopFilterPopover({
  value,
  onChange,
  activeCount,
}: FiltersProps & { activeCount: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={activeCount > 0 ? "secondary" : "outline"}
          size="sm"
          aria-label={
            activeCount ? `${activeCount} filters active` : "Open filters"
          }
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 rounded-sm bg-primary/15 px-1.5 text-[10px] font-medium text-primary">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <FilterBody value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}

function MobileFilterSheet({
  value,
  onChange,
  activeCount,
}: FiltersProps & { activeCount: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant={activeCount > 0 ? "secondary" : "outline"}
          size="sm"
          aria-label={
            activeCount ? `${activeCount} filters active` : "Open filters"
          }
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {activeCount > 0 && (
            <span className="ml-1 rounded-sm bg-primary/15 px-1.5 text-[10px] font-medium text-primary">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="px-6 pb-8 pt-4">
          <FilterBody value={value} onChange={onChange} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FilterBody({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (v: FilterState) => void;
}) {
  const { data: tags = [] } = useTags();

  const clearAll = () =>
    onChange({ ...value, tagIds: [], fileKinds: [], archived: false });

  return (
    <div>
      <div className="max-h-[60vh] space-y-5 overflow-y-auto p-4 md:max-h-none">
        {tags.length > 0 && (
          <FilterSection title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Chip
                  key={t.id}
                  label={t.name}
                  dot={t.color}
                  active={value.tagIds.includes(t.id)}
                  onClick={() =>
                    onChange({
                      ...value,
                      tagIds: value.tagIds.includes(t.id)
                        ? value.tagIds.filter((v) => v !== t.id)
                        : [...value.tagIds, t.id],
                    })
                  }
                />
              ))}
            </div>
          </FilterSection>
        )}

        <FilterSection title="File type">
          <div className="flex flex-wrap gap-1.5">
            {(["pdf", "image"] as const).map((k) => (
              <Chip
                key={k}
                label={k === "pdf" ? "PDF" : "Images"}
                active={value.fileKinds.includes(k)}
                onClick={() =>
                  onChange({
                    ...value,
                    fileKinds: value.fileKinds.includes(k)
                      ? value.fileKinds.filter((v) => v !== k)
                      : [...value.fileKinds, k],
                  })
                }
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Other">
          <label className="flex cursor-pointer select-none items-center gap-2 rounded-md p-1 text-sm">
            <Checkbox
              checked={value.archived}
              onCheckedChange={(v) =>
                onChange({ ...value, archived: Boolean(v) })
              }
            />
            Show archived only
          </label>
        </FilterSection>
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          disabled={countActive(value) === 0}
        >
          <X className="h-3.5 w-3.5" />
          Clear all
        </Button>
      </div>
    </div>
  );
}

// ─── Category quick-strip ────────────────────────────────────────────────────

export function CategoryStrip({
  selectedId,
  onChange,
}: {
  selectedId: string | null;
  onChange: (id: string | null) => void;
}) {
  const { data: categories = [] } = useCategories();
  if (categories.length === 0) return null;

  return (
    <div className="-mx-0.5 flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
      <CategoryChip
        label="All"
        active={!selectedId}
        onClick={() => onChange(null)}
      />
      {categories.map((c) => (
        <CategoryChip
          key={c.id}
          label={c.name}
          dot={c.color}
          active={selectedId === c.id}
          onClick={() => onChange(selectedId === c.id ? null : c.id)}
        />
      ))}
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
  dot,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "border-border bg-background text-muted-foreground hover:border-border hover:text-foreground",
      )}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: dot }}
          aria-hidden
        />
      )}
      {label}
    </button>
  );
}

// ─── Active filter chip bar ──────────────────────────────────────────────────

interface ActiveFilterBarProps {
  filters: FilterState;
  favoritesOnly: boolean;
  query: string;
  categories: Category[];
  tags: Tag[];
  docCount: number | null;
  onChangeFilters: (f: FilterState) => void;
  onChangeFavoritesOnly: (v: boolean) => void;
  onChangeQuery: (q: string) => void;
  onClearAll: () => void;
}

export function ActiveFilterBar({
  filters,
  favoritesOnly,
  query,
  categories,
  tags,
  docCount,
  onChangeFilters,
  onChangeFavoritesOnly,
  onChangeQuery,
  onClearAll,
}: ActiveFilterBarProps) {
  const chips: Array<{ key: string; label: string; dot?: string; onRemove: () => void }> = [];

  if (query.trim()) {
    chips.push({
      key: "query",
      label: `"${query.trim()}"`,
      onRemove: () => onChangeQuery(""),
    });
  }
  if (favoritesOnly) {
    chips.push({
      key: "favorites",
      label: "Favorites",
      onRemove: () => onChangeFavoritesOnly(false),
    });
  }
  if (filters.categoryId) {
    const cat = categories.find((c) => c.id === filters.categoryId);
    chips.push({
      key: "category",
      label: cat?.name ?? "Category",
      dot: cat?.color,
      onRemove: () => onChangeFilters({ ...filters, categoryId: null }),
    });
  }
  for (const tagId of filters.tagIds) {
    const tag = tags.find((t) => t.id === tagId);
    if (tag) {
      chips.push({
        key: `tag-${tagId}`,
        label: tag.name,
        dot: tag.color,
        onRemove: () =>
          onChangeFilters({
            ...filters,
            tagIds: filters.tagIds.filter((id) => id !== tagId),
          }),
      });
    }
  }
  for (const kind of filters.fileKinds) {
    chips.push({
      key: `kind-${kind}`,
      label: kind === "pdf" ? "PDF" : "Images",
      onRemove: () =>
        onChangeFilters({
          ...filters,
          fileKinds: filters.fileKinds.filter((k) => k !== kind),
        }),
    });
  }
  if (filters.archived) {
    chips.push({
      key: "archived",
      label: "Archived",
      onRemove: () => onChangeFilters({ ...filters, archived: false }),
    });
  }

  const hasChips = chips.length > 0;
  const showBar = hasChips || docCount !== null;

  if (!showBar) return null;

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key="filter-bar"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.15 }}
        className="flex flex-wrap items-center gap-x-3 gap-y-1.5 overflow-hidden"
      >
        {hasChips && (
          <div className="flex flex-wrap items-center gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 py-0.5 pl-2 pr-1 text-xs text-foreground"
              >
                {chip.dot && (
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: chip.dot }}
                    aria-hidden
                  />
                )}
                {chip.label}
                <button
                  type="button"
                  onClick={chip.onRemove}
                  aria-label={`Remove ${chip.label} filter`}
                  className="focus-ring ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-border hover:text-foreground"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={onClearAll}
              className="focus-ring rounded px-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          </div>
        )}

        {docCount !== null && (
          <p className="ml-auto text-xs text-muted-foreground">
            {docCount} {docCount === 1 ? "document" : "documents"}
            {hasChips ? " found" : ""}
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Shared internals ────────────────────────────────────────────────────────

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
  dot,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "border-border bg-background text-muted-foreground hover:text-foreground",
      )}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: dot }}
          aria-hidden
        />
      )}
      {label}
    </button>
  );
}

export type { FilterState };
