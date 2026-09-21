// LockKaro service worker.
//
// Strategy:
//   - HTML pages       → network-first, fall back to /offline.html if offline
//   - Static JS/CSS/fonts/icons → cache-first, updated in background
//   - /api/* and POST/PUT/DELETE → network-only (never cached)
//
// Bump CACHE_VERSION when the service worker itself changes shape.

const CACHE_VERSION = "lockkaro-v4";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const APP_SHELL = ["/offline.html", "/manifest.webmanifest"];

// -------- install --------

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      await cache.addAll(APP_SHELL);
      await self.skipWaiting();
    })(),
  );
});

// -------- activate: purge old caches --------

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// -------- fetch --------

function bypassCache(request) {
  if (request.method !== "GET") return true;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return true;
  return false;
}

function isNavigation(request) {
  return (
    request.mode === "navigate" ||
    (request.method === "GET" &&
      request.headers.get("accept")?.includes("text/html"))
  );
}

function isStatic(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/icon.svg" ||
    url.pathname === "/apple-icon.svg" ||
    /\.(?:js|css|woff2?|png|jpg|jpeg|webp|gif|svg|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (bypassCache(request)) return;
  if (url.origin !== self.location.origin) return;

  if (isNavigation(request)) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(APP_SHELL_CACHE);
          const offline = await cache.match("/offline.html");
          return (
            offline ??
            new Response("Offline", {
              status: 503,
              headers: { "content-type": "text/plain" },
            })
          );
        }
      })(),
    );
    return;
  }

  if (isStatic(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        const network = await fetch(request);
        if (network.ok) cache.put(request, network.clone());
        return network;
      })(),
    );
    return;
  }
});
