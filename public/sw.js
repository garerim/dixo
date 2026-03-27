// =============================================================================
// Service Worker — Dixo PWA
// =============================================================================
// Strategy: Network-first for all requests.
// Falls back to a cached offline page when the network is unavailable.
// =============================================================================

const CACHE_NAME = "dixo-v1";
const OFFLINE_URL = "/offline";

// Pre-cache the offline page shell on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([OFFLINE_URL, "/icon-192.png", "/icon-512.png"])
    )
  );
  self.skipWaiting();
});

// Clean up old caches on activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Network-first strategy with offline fallback
self.addEventListener("fetch", (event) => {
  // Only handle navigation requests (HTML pages)
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE_URL).then((cached) => cached || new Response("Offline", { status: 503 }))
    )
  );
});
