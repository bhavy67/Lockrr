"use client";

import { Download, Plus, Share } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { usePwaInstall } from "./use-pwa-install";

interface Props {
  /**
   * Tone of the trigger button. "solid" matches primary CTAs;
   * "ghost" (default) fits a compact header icon.
   */
  variant?: "ghost" | "solid";
  className?: string;
}

/**
 * "Install app" button. Renders nothing if the app is already installed or
 * install isn't possible on this platform. On Chrome-like browsers it triggers
 * the native prompt; on iOS Safari it opens a small explanation dialog
 * because iOS never exposes a programmatic install path.
 *
 * Positioned by the caller — this component only renders itself, not the
 * surrounding layout.
 */
export function InstallButton({ variant = "ghost", className }: Props) {
  const { status, promptInstall } = usePwaInstall();
  const [iosOpen, setIosOpen] = useState(false);

  // Nothing to show if the app is already installed or the browser has no
  // path at all — no visual noise for users who can't act on it.
  if (status === "installed" || status === "unsupported") {
    return null;
  }

  const handleClick = async () => {
    if (status === "ios") {
      setIosOpen(true);
      return;
    }
    // Chrome-like: `beforeinstallprompt` has fired, we saved it, now prompt.
    await promptInstall();
  };

  return (
    <>
      {variant === "solid" ? (
        <Button
          size="sm"
          onClick={handleClick}
          aria-label="Install LockKaro as an app"
          className={className}
        >
          <Download className="h-4 w-4" />
          Install app
        </Button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          aria-label="Install LockKaro as an app"
          className={cn(
            "focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground",
            className,
          )}
        >
          <Download className="h-4 w-4" />
        </button>
      )}

      <Dialog open={iosOpen} onOpenChange={setIosOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add LockKaro to your Home Screen</DialogTitle>
            <DialogDescription>
              iOS doesn&rsquo;t offer a one-tap install &mdash; but it takes
              three quick steps in Safari.
            </DialogDescription>
          </DialogHeader>

          <ol className="mt-2 space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                1
              </span>
              <span className="flex-1 leading-relaxed text-foreground">
                Tap the{" "}
                <Share
                  className="inline h-4 w-4 -translate-y-0.5 text-primary"
                  aria-label="Share"
                />{" "}
                Share button in Safari&rsquo;s toolbar.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                2
              </span>
              <span className="flex-1 leading-relaxed text-foreground">
                Scroll and choose{" "}
                <span className="whitespace-nowrap rounded border border-border bg-surface px-1.5 py-0.5 text-xs">
                  <Plus className="inline h-3 w-3 -translate-y-px" /> Add to
                  Home Screen
                </span>
                .
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                3
              </span>
              <span className="flex-1 leading-relaxed text-foreground">
                Tap <span className="font-medium">Add</span> in the top-right.
                LockKaro is now on your home screen.
              </span>
            </li>
          </ol>

          <p className="mt-2 text-xs text-muted-foreground">
            Works only in Safari &mdash; Chrome and Firefox on iOS can&rsquo;t
            add to the home screen.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
