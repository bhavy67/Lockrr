"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useSignOut } from "@/features/auth/use-session";
import { useUploadDialog } from "@/features/upload/upload-dialog-store";
import { useCommandPalette } from "./command-palette-store";

const GO_TIMEOUT_MS = 1200;

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

/**
 * Global keyboard shortcuts.
 * - ⌘K / Ctrl+K: open command palette
 * - U: open upload dialog
 * - /: focus vault search
 * - G then D/V/C/L/R: navigate
 * Shortcuts other than ⌘K are ignored while typing in an input.
 */
export function useKeyboardShortcuts() {
  const router = useRouter();
  const togglePalette = useCommandPalette((s) => s.toggle);
  const openUpload = useUploadDialog((s) => s.open);
  const signOut = useSignOut();
  const goModeRef = useRef<{ armed: boolean; timer: number | null }>({
    armed: false,
    timer: null,
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // ⌘K / Ctrl+K always available
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePalette();
        return;
      }

      if (isTypingTarget(e.target)) return;
      if (mod || e.altKey) return;

      const key = e.key.toLowerCase();

      // Two-key "G, X" navigation, Linear-style
      if (goModeRef.current.armed) {
        goModeRef.current.armed = false;
        if (goModeRef.current.timer) {
          window.clearTimeout(goModeRef.current.timer);
          goModeRef.current.timer = null;
        }
        switch (key) {
          case "d":
            e.preventDefault();
            router.push("/dashboard");
            return;
          case "v":
            e.preventDefault();
            router.push("/vault");
            return;
          case "c":
            e.preventDefault();
            router.push("/categories");
            return;
          case "l":
            e.preventDefault();
            router.push("/collections");
            return;
          case "r":
            e.preventDefault();
            router.push("/reminders");
            return;
          default:
            return;
        }
      }

      switch (key) {
        case "g":
          e.preventDefault();
          goModeRef.current.armed = true;
          if (goModeRef.current.timer)
            window.clearTimeout(goModeRef.current.timer);
          goModeRef.current.timer = window.setTimeout(() => {
            goModeRef.current.armed = false;
          }, GO_TIMEOUT_MS);
          return;
        case "u":
          e.preventDefault();
          openUpload();
          return;
        case "/":
          e.preventDefault();
          {
            const input = document.querySelector<HTMLInputElement>(
              "input[data-vault-search]",
            );
            if (input) input.focus();
            else router.push("/vault");
          }
          return;
        case "?":
          e.preventDefault();
          togglePalette();
          return;
        case "q":
          if (e.shiftKey) {
            e.preventDefault();
            void signOut.mutateAsync().then(() => router.replace("/"));
          }
          return;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [router, togglePalette, openUpload, signOut]);
}
