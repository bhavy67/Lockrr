import type { MetadataRoute } from "next";

/**
 * Web app manifest.
 *
 * Served at /manifest.webmanifest. Combined with the service worker and the
 * app icons, this is what lets browsers offer "Install app" for LockKaro.
 *
 * Icons are dynamically-rendered PNGs via next/og — see the `pwa-icon-*.png`
 * route handlers next to this file.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LockKaro — Lock it. Clock it.",
    short_name: "LockKaro",
    description:
      "A calm, private vault for the paperwork of your life. All in one place.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Match the app's actual background so the splash screen doesn't flash white.
    background_color: "#0a0a0b",
    theme_color: "#4F46E5",
    categories: ["productivity", "utilities", "business"],
    icons: [
      {
        src: "/pwa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        // "maskable" gets the safe-area padding Android uses for adaptive icons.
        purpose: "maskable",
      },
    ],
  };
}
