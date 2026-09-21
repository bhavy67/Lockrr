"use client";

import { differenceInCalendarDays } from "date-fns";
import {
  CalendarClock,
  Clock,
  FileText,
  FolderOpen,
  Grid2X2,
  LayoutDashboard,
  Library,
  Settings,
  Star,
  UploadCloud,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useCollections } from "@/features/collections/hooks";
import { documentKind } from "@/features/documents/document-icon";
import { useDocuments } from "@/features/documents/hooks";
import { useUploadDialog } from "@/features/upload/upload-dialog-store";
import { useDebounced } from "@/lib/hooks/use-debounced";
import { useCommandPalette } from "./command-palette-store";

export function CommandPalette() {
  const open = useCommandPalette((s) => s.open);
  const setOpen = useCommandPalette((s) => s.setOpen);
  const router = useRouter();
  const openUpload = useUploadDialog((s) => s.open);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 100);
  const { data: allDocs = [] } = useDocuments();
  const { data: collections = [] } = useCollections();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const matchingDocs = useMemo(() => {
    if (!debouncedQuery.trim()) return allDocs.slice(0, 6);
    const q = debouncedQuery.trim().toLowerCase();
    return allDocs
      .filter((d) =>
        [d.title, d.description ?? "", d.fileName]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 8);
  }, [allDocs, debouncedQuery]);

  const expiringCount = useMemo(
    () =>
      allDocs.filter(
        (d) =>
          d.expiryDate &&
          differenceInCalendarDays(new Date(d.expiryDate), Date.now()) <= 30 &&
          differenceInCalendarDays(new Date(d.expiryDate), Date.now()) >= 0,
      ).length,
    [allDocs],
  );

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search or run a command…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem
            value="upload document"
            onSelect={() => run(() => openUpload())}
          >
            <UploadCloud />
            Upload document
            <CommandShortcut>U</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="favorites"
            onSelect={() => run(() => router.push("/vault?favorites=1"))}
          >
            <Star />
            View favorites
          </CommandItem>
          <CommandItem
            value="expiring soon"
            onSelect={() => run(() => router.push("/reminders"))}
          >
            <CalendarClock />
            Expiring soon
            {expiringCount > 0 && (
              <span className="ml-auto rounded-sm bg-warning/15 px-1.5 text-[10px] font-medium text-warning">
                {expiringCount}
              </span>
            )}
          </CommandItem>
          <CommandItem
            value="settings backup"
            onSelect={() => run(() => router.push("/settings"))}
          >
            <Settings />
            Settings
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Go to">
          <CommandItem
            value="go dashboard"
            onSelect={() => run(() => router.push("/dashboard"))}
          >
            <LayoutDashboard />
            Dashboard
            <CommandShortcut>G D</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="go vault"
            onSelect={() => run(() => router.push("/vault"))}
          >
            <FolderOpen />
            Vault
            <CommandShortcut>G V</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="go categories"
            onSelect={() => run(() => router.push("/categories"))}
          >
            <Grid2X2 />
            Categories
            <CommandShortcut>G C</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="go collections"
            onSelect={() => run(() => router.push("/collections"))}
          >
            <Library />
            Collections
            <CommandShortcut>G L</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="go timeline"
            onSelect={() => run(() => router.push("/timeline"))}
          >
            <Clock />
            Timeline
            <CommandShortcut>G T</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        {matchingDocs.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup
              heading={debouncedQuery ? "Matching documents" : "Recent documents"}
            >
              {matchingDocs.map((d) => {
                const kind = documentKind(d.mimeType);
                return (
                  <CommandItem
                    key={d.id}
                    value={`doc-${d.id}-${d.title}-${d.fileName}`}
                    onSelect={() => run(() => router.push(`/vault/${d.id}`))}
                  >
                    <FileText
                      className={
                        kind === "image"
                          ? "text-amber-500"
                          : kind === "pdf"
                            ? "text-orange-500"
                            : "text-muted-foreground"
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{d.title}</p>
                    </div>
                    {d.isFavorite && (
                      <Star className="h-3 w-3 fill-warning text-warning" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {collections.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Collections">
              {collections.slice(0, 6).map((c) => (
                <CommandItem
                  key={c.id}
                  value={`col-${c.id}-${c.name}`}
                  onSelect={() =>
                    run(() => router.push(`/collections/${c.id}`))
                  }
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: c.color }}
                    aria-hidden
                  />
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
