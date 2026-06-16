// Minimal service worker — enables "Add to Home Screen" / PWA install prompt
const CACHE_NAME = "clippio-v1";
const PRECACHE = ["/", "/logo.svg", "/icon-192.png", "/icon-512.png", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

// Network-first for API calls, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api") || url.port === "8000") {
    return; // never cache API calls
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
