"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { useCommandPalette } from "@/features/command-palette/command-palette-store";
import { InstallButton } from "@/features/pwa/install-button";
import { cn } from "@/lib/utils";
import { primaryNav } from "./nav-items";
import { useUploadDialog } from "@/features/upload/upload-dialog-store";
import { MobileMenuSheet } from "./mobile-menu-sheet";

export function MobileTopBar() {
  const openPalette = useCommandPalette((s) => s.setOpen);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
      <Link href="/dashboard" className="focus-ring rounded-md">
        <Wordmark />
      </Link>
      <div className="flex items-center gap-1">
        {/* Install button auto-hides when the app is already installed or on
            unsupported browsers, so it's safe to render unconditionally. */}
        <InstallButton />
        <button
          type="button"
          onClick={() => openPalette(true)}
          aria-label="Open command palette"
          className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Search className="h-4 w-4" />
        </button>
        <MobileMenuSheet />
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const openUpload = useUploadDialog((s) => s.open);

  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-background/95 px-2 pt-1.5 backdrop-blur md:hidden"
    >
      {primaryNav.slice(0, 2).map((item) => (
        <NavButton
          key={item.href}
          href={item.href}
          label={item.label}
          Icon={item.icon}
          active={item.match ? item.match(pathname) : pathname === item.href}
        />
      ))}
      <button
        type="button"
        onClick={() => openUpload()}
        aria-label="Upload document"
        className="focus-ring -mt-6 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated"
      >
        <Plus className="h-5 w-5" />
      </button>
      {primaryNav.slice(2, 4).map((item) => (
        <NavButton
          key={item.href}
          href={item.href}
          label={item.label}
          Icon={item.icon}
          active={item.match ? item.match(pathname) : pathname === item.href}
        />
      ))}
    </nav>
  );
}

function NavButton({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-md py-1 text-[10px]",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}
