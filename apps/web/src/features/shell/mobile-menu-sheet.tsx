"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSession, useSignOut } from "@/features/auth/use-session";
import { useDocuments } from "@/features/documents/hooks";
import { attentionCount } from "@/features/documents/expiry";
import { cn, initials } from "@/lib/utils";
import { primaryNav } from "./nav-items";

export function MobileMenuSheet() {
  const [open, setOpen] = useState(false);
  const { data: user } = useSession();
  const { theme, setTheme } = useTheme();
  const signOut = useSignOut();
  const router = useRouter();
  const pathname = usePathname();
  const { data: docs = [] } = useDocuments({ archived: false });
  const attention = attentionCount(docs);

  const themes: Array<{ id: "light" | "dark" | "system"; label: string; Icon: typeof Sun }> = [
    { id: "light", label: "Light", Icon: Sun },
    { id: "dark", label: "Dark", Icon: Moon },
    { id: "system", label: "System", Icon: Monitor },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-80 flex-col p-0">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        {user && (
          <div className="mx-6 flex items-center gap-3 rounded-md border border-border bg-surface p-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {user.displayName}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {user.email}
              </div>
            </div>
          </div>
        )}

        <nav className="mt-6 space-y-0.5 px-3">
          {primaryNav.map((item) => {
            const active = item.match
              ? item.match(pathname)
              : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-ring flex items-center gap-3 rounded-md px-3 py-2.5 text-sm",
                  active
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {item.href === "/reminders" && attention > 0 && (
                  <span className="rounded-full bg-warning/15 px-1.5 text-[10px] font-medium text-warning">
                    {attention}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <Separator className="my-4" />

        <div className="px-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Appearance
          </p>
          <div className="grid grid-cols-3 gap-2">
            {themes.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                className={cn(
                  "focus-ring flex flex-col items-center gap-1.5 rounded-md border border-border p-3 text-xs",
                  theme === id
                    ? "border-primary/50 bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <Separator className="mt-auto" />
        <div className="p-6">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={async () => {
              await signOut.mutateAsync();
              setOpen(false);
              router.replace("/");
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
