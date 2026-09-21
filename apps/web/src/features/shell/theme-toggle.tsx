"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const themes = [
  { id: "light" as const, Icon: Sun, label: "Light" },
  { id: "dark" as const, Icon: Moon, label: "Dark" },
  { id: "system" as const, Icon: Monitor, label: "System" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center gap-1 rounded-md bg-muted/60 p-1">
      {themes.map(({ id, Icon, label }) => (
        <button
          key={id}
          type="button"
          aria-label={`${label} theme`}
          onClick={() => setTheme(id)}
          className={cn(
            "focus-ring flex flex-1 items-center justify-center rounded py-1 text-xs transition-colors",
            theme === id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
