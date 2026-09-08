const CACHE_NAME = 'calc-impresion-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Solo interceptar peticiones GET en el mismo origen o CDN seguras
  if (e.request.method !== 'GET') return;

  // Ignorar peticiones de desarrollo Vite o HMR
  const url = e.request.url;
  if (url.includes('/@vite/') || url.includes('/@fs/') || url.includes('/src/') || url.includes('hot-update')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            e.request.url.startsWith(self.location.origin)
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback silencioso si falla la red y no hay caché
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
