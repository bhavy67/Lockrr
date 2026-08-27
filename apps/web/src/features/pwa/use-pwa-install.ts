"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Tracks whether the app is installable on this platform, and exposes a
 * `promptInstall` function the UI can call from a click handler.
 *
 * The `beforeinstallprompt` browser event is the only way to trigger the
 * native install dialog. iOS Safari does not fire it — there, install
 * happens exclusively through the Share sheet, so we surface instructions
 * instead.
 *
 * States:
 *   "ready"       — Chrome / Edge / Android WebView, prompt is ready
 *   "ios"         — iOS Safari, no prompt exists; show instructions
 *   "installed"   — already running standalone
 *   "unsupported" — no path to install (e.g. desktop Firefox)
 */

// Chrome's synthetic event that carries the install prompt. Not in lib.dom yet.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallStatus = "ready" | "ios" | "installed" | "unsupported";

export interface UsePwaInstall {
  status: InstallStatus;
  /**
   * Trigger the native install prompt (Chrome-like) or return "ios" so the
   * caller can show instructions. Resolves once the user has decided.
   */
  promptInstall: () => Promise<"accepted" | "dismissed" | "ios">;
}

export function usePwaInstall(): UsePwaInstall {
  const [status, setStatus] = useState<InstallStatus>("unsupported");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already installed → hide the button.
    if (isStandalone()) {
      setStatus("installed");
      return;
    }

    // iOS Safari path — no beforeinstallprompt will ever fire.
    if (isIOSSafari()) {
      setStatus("ios");
      return;
    }

    const onBeforeInstall = (event: Event) => {
      // Stop Chrome from surfacing its own mini-infobar; we'll drive the UI.
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setStatus("ready");
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      setStatus("installed");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<
    "accepted" | "dismissed" | "ios"
  > => {
    if (status === "ios") return "ios";
    if (!deferredPrompt) return "dismissed";

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    // Chrome specifies the same event can't be fired twice.
    setDeferredPrompt(null);
    if (outcome === "accepted") setStatus("installed");
    return outcome;
  }, [deferredPrompt, status]);

  return { status, promptInstall };
}

// -----------------------------------------------------------------------------

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari before iOS 17 exposes a non-standard boolean flag.
  const navWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };
  return navWithStandalone.standalone === true;
}

function isIOSSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  // iPadOS 13+ reports MacIntel — check touch capability as a tie-breaker.
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Mac") && "ontouchend" in document);
  if (!isIOS) return false;
  // Chrome iOS and Firefox iOS use WebKit under the hood but their UA
  // contains "CriOS" / "FxiOS". Show install instructions in real Safari only
  // — the other browsers can't add to home screen either, but the flow's the
  // same "Share → Add" and they still have a Share button.
  return !/CriOS|FxiOS|EdgiOS/.test(ua);
}
