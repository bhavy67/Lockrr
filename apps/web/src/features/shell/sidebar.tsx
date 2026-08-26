"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { PaletteTrigger } from "@/features/command-palette/palette-trigger";
import { cn } from "@/lib/utils";
import { primaryNav } from "./nav-items";
import { UserMenu } from "./user-menu";
import { useUploadDialog } from "@/features/upload/upload-dialog-store";

export function Sidebar() {
  const pathname = usePathname();
  const openUpload = useUploadDialog((s) => s.open);

  return (
    <aside className="hidden h-svh w-60 shrink-0 flex-col border-r border-border bg-surface/40 md:flex">
      <div className="flex h-14 items-center px-4">
        <Link href="/dashboard" className="focus-ring rounded-md">
          <Wordmark />
        </Link>
      </div>

      <div className="space-y-2 px-3">
        <PaletteTrigger />
        <Button
          className="w-full justify-start"
          size="sm"
          onClick={() => openUpload()}
        >
          <Plus className="h-4 w-4" />
          Upload document
          <span className="ml-auto font-mono text-[10px] text-primary-foreground/70">
            U
          </span>
        </Button>
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 px-3">
        {primaryNav.map((item) => {
          const active = item.match ? item.match(pathname) : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors",
                active
                  ? "bg-primary/10 text-foreground"
                  : "hover:bg-accent hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon
                className={cn(
                  "h-4 w-4",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 p-3">
        <UserMenu />
      </div>
    </aside>
  );
}
