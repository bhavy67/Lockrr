"use client";

import { ArrowUpDown, Filter, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import type { DocumentFilters, DocumentSort } from "@lockerr/types";
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

export function VaultFilters(props: FiltersProps) {
  const activeCount = countActive(props.value);
  return (
    <>
      {/* Mobile: sheet */}
      <div className="md:hidden">
        <MobileFilterSheet {...props} activeCount={activeCount} />
      </div>
      {/* Desktop: popover */}
      <div className="hidden md:block">
        <DesktopFilterPopover {...props} activeCount={activeCount} />
      </div>
    </>
  );
}

function countActive(v: FilterState): number {
  let n = 0;
  if (v.categoryId) n++;
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
          variant="outline"
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
      <PopoverContent className="w-80 p-0" align="end">
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
          variant="outline"
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
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();

  const clearAll = () =>
    onChange({ categoryId: null, tagIds: [], fileKinds: [], archived: false });

  return (
    <div>
      <div className="max-h-[60vh] space-y-5 overflow-y-auto p-4 md:max-h-none">
        <FilterSection title="Category">
          <div className="flex flex-wrap gap-1.5">
            <Chip
              label="Any"
              active={!value.categoryId}
              onClick={() => onChange({ ...value, categoryId: null })}
            />
            {categories.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                dot={c.color}
                active={value.categoryId === c.id}
                onClick={() =>
                  onChange({
                    ...value,
                    categoryId: value.categoryId === c.id ? null : c.id,
                  })
                }
              />
            ))}
          </div>
        </FilterSection>

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
