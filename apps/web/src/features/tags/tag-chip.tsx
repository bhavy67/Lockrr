import { X } from "lucide-react";
import type { Tag } from "@lockkaro/types";
import { cn } from "@/lib/utils";

interface Props {
  tag: Tag;
  onRemove?: () => void;
  className?: string;
}

export function TagChip({ tag, onRemove, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-xs font-medium text-foreground",
        className,
      )}
      style={{ borderColor: `${tag.color}40` }}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: tag.color }}
      />
      {tag.name}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove tag ${tag.name}`}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove();
          }}
          className="focus-ring -mr-0.5 rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );
}
