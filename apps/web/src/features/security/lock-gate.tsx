"use client";

import { App } from "@capacitor/app";
import { Lock } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { isNative, restored } from "@/lib/data/native";
import { lockEnabled, PrivacyScreen, verifyOwner } from "./app-lock";

/** Away longer than this → locked again. Short trips (share sheet, the prompt itself) don't count. */
const GRACE_MS = 30_000;

export function LockGate({ children }: { children: ReactNode }) {
  const [locked, setLocked] = useState(false);
  const prompting = useRef(false);

  const unlock = useCallback(async () => {
    if (prompting.current) return;
    prompting.current = true;
    if (await verifyOwner()) setLocked(false);
    prompting.current = false;
  }, []);

  // Layout effect: decided before the first paint, so the vault never flashes.
  useLayoutEffect(() => {
    if (!isNative) return;
    const check = () => {
      if (!lockEnabled()) return;
      setLocked(true);
      void PrivacyScreen.enable();
    };
    check();
    void restored.then(check); // the flag may only come back after a storage restore
  }, []);

  useEffect(() => {
    if (!isNative) return;
    let leftAt = 0;
    const handle = App.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) {
        leftAt = Date.now();
        return;
      }
      const away = leftAt ? Date.now() - leftAt : 0;
      leftAt = 0; // each trip is measured once
      if (lockEnabled() && away > GRACE_MS) setLocked(true);
    });
    return () => void handle.then((h) => h.remove());
  }, []);

  // Prompt straight away whenever the lock engages.
  useEffect(() => {
    if (locked) void unlock();
  }, [locked, unlock]);

  return (
    <>
      <div className="contents" inert={locked} aria-hidden={locked || undefined}>
        {children}
      </div>
      {locked && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lock-title"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-background p-6 text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Lock className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h1 id="lock-title" className="text-lg font-semibold">
              Your vault is locked.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Unlock to see your documents.</p>
          </div>
          <Button onClick={() => void unlock()} autoFocus>
            Unlock
          </Button>
        </div>
      )}
    </>
  );
}
