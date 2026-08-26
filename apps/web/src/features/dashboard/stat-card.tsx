import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tint?: "primary" | "warning" | "success" | "destructive";
}

const tintMap = {
  primary: "text-primary bg-primary/10",
  warning: "text-warning bg-warning/10",
  success: "text-success bg-success/10",
  destructive: "text-destructive bg-destructive/10",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tint = "primary",
}: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-subtle sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md",
            tintMap[tint],
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </div>
      {hint && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
