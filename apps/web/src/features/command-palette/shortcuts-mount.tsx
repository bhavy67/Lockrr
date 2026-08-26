"use client";

import { useKeyboardShortcuts } from "./use-shortcuts";

export function ShortcutsMount() {
  useKeyboardShortcuts();
  return null;
}
