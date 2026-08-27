"use client";

import { useEffect } from "react";

/**
 * Registers the service worker once, after hydration.
 *
 * - Skipped entirely in development (`next dev`) so hot-reload isn't fighting
 *   a stale cached shell every save.
 * - Skipped when the browser doesn't ship service workers (older Safari, some
 *   embedded webviews). The app still works, it just isn't installable.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (err) {
        // Not fatal — the app runs fine without a SW, users just don't get
        // offline / install support. Log for anyone poking at devtools.
        console.warn("[LockKaro] SW registration failed:", err);
      }
    };

    // Registration doesn't have to block hydration.
    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
