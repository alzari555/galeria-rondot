// Service Worker de Galería Rondot: caché "cache-first" para imágenes y assets estáticos.
// Los archivos de /assets/ tienen hash en el nombre y los de /artworks/ usan UUID,
// por lo que su contenido nunca cambia bajo la misma URL.
const CACHE_NAME = "rondot-static-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

const isCacheable = (url) =>
  url.origin === self.location.origin && (url.pathname.includes("/artworks/") || url.pathname.includes("/assets/"));

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (!isCacheable(url)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })()
  );
});
