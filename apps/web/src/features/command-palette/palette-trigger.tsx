"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useCommandPalette } from "./command-palette-store";

interface Props {
  className?: string;
}

export function PaletteTrigger({ className }: Props) {
  const setOpen = useCommandPalette((s) => s.setOpen);
  const [mac, setMac] = useState(false);

  useEffect(() => {
    setMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "focus-ring group inline-flex w-full items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground",
        className,
      )}
      aria-label="Open command palette (Cmd + K)"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="flex-1 truncate">Search or run a command…</span>
      <kbd className="hidden shrink-0 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-block">
        {mac ? "⌘K" : "Ctrl K"}
      </kbd>
    </button>
  );
}
