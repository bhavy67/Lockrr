// LockKaro service worker.
//
// Strategy in one sentence: cache the app shell so the app opens fast (and
// falls back gracefully when offline), but never serve stale data from
// Supabase or /api routes.
//
//   - HTML pages  → network-first, fall back to /offline.html if offline
//   - Static JS/CSS/fonts/icons → cache-first, updated in the background
//   - Supabase and /api/* → network-only (never cached)
//
// Bump CACHE_VERSION when the service worker itself changes shape. The old
// caches will be dropped in `activate`.

const CACHE_VERSION = "lockkaro-v2";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const APP_SHELL = ["/offline.html", "/manifest.webmanifest"];

// -------- install --------

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      await cache.addAll(APP_SHELL);
      // Activate this worker as soon as it's installed — no need to wait for
      // the user to close every tab first.
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

/**
 * Should this request bypass the cache entirely?
 *
 * Supabase calls, /api/*, POST/PUT/DELETE requests, and anything with an
 * Authorization header must always hit the network — the cache would leak
 * one user's data to another, or serve stale writes.
 */
function bypassCache(request) {
  if (request.method !== "GET") return true;
  const url = new URL(request.url);
  if (url.hostname.endsWith(".supabase.co")) return true;
  if (url.pathname.startsWith("/api/")) return true;
  if (url.pathname.startsWith("/auth/")) return true;
  return false;
}

/** Is this an HTML navigation? */
function isNavigation(request) {
  return (
    request.mode === "navigate" ||
    (request.method === "GET" &&
      request.headers.get("accept")?.includes("text/html"))
  );
}

/** Is this a static asset we can safely serve from cache? */
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
  // Ignore cross-origin requests we don't own — let the browser handle them.
  if (url.origin !== self.location.origin) return;

  if (isNavigation(request)) {
    event.respondWith(
      (async () => {
        try {
          const network = await fetch(request);
          return network;
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

  // Everything else: just let the network handle it.
});
