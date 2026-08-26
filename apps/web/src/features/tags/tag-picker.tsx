"use client";

import { Check, Plus, Tag as TagIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { Tag } from "@lockerr/types";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCreateTag, useTags } from "./hooks";
import { TagChip } from "./tag-chip";

const TAG_COLORS = [
  "#6366F1",
  "#059669",
  "#0EA5E9",
  "#DC2626",
  "#F59E0B",
  "#7C3AED",
  "#EA580C",
  "#0F766E",
];

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
  triggerLabel?: string;
}

export function TagPicker({ value, onChange, triggerLabel = "Tags" }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: tags = [] } = useTags();
  const createTag = useCreateTag();

  const selected = useMemo(
    () => tags.filter((t) => value.includes(t.id)),
    [tags, value],
  );

  const canCreate =
    search.trim().length > 0 &&
    !tags.some((t) => t.name.toLowerCase() === search.trim().toLowerCase());

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );
  };

  const createAndSelect = async () => {
    const name = search.trim();
    if (!name) return;
    const color = TAG_COLORS[tags.length % TAG_COLORS.length]!;
    const created = await createTag.mutateAsync({ name, color });
    onChange([...value, created.id]);
    setSearch("");
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 justify-start gap-1.5 border-dashed"
          >
            <TagIcon className="h-3.5 w-3.5" />
            {triggerLabel}
            {selected.length > 0 && (
              <span className="ml-1 rounded-sm bg-secondary px-1.5 text-[10px] text-secondary-foreground">
                {selected.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search or create tag…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {canCreate ? (
                  <button
                    type="button"
                    onClick={createAndSelect}
                    className="inline-flex items-center gap-1 text-sm text-foreground hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    Create <span className="font-medium">{search}</span>
                  </button>
                ) : (
                  <span>No tags yet.</span>
                )}
              </CommandEmpty>
              <CommandGroup>
                {tags.map((t) => (
                  <CommandItem
                    key={t.id}
                    value={t.name}
                    onSelect={() => toggle(t.id)}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: t.color }}
                      aria-hidden
                    />
                    <span className="flex-1">{t.name}</span>
                    {value.includes(t.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              {canCreate && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      value={`__create__${search}`}
                      onSelect={createAndSelect}
                    >
                      <Plus className="h-4 w-4" />
                      Create <span className="font-medium">{search}</span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((t) => (
            <TagChip key={t.id} tag={t} onRemove={() => toggle(t.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

export type { Tag };
