// Mini ERP Service Worker
// Note: Bump CACHE_NAME to force replacement of old cached service workers
const CACHE_NAME = 'minierp-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/minierp-logo.webp',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.log('Cache install failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first with selective caching
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never cache JS files — prevents stale bundle conflicts with HMR
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.mjs')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Skip API requests
  if (url.pathname.startsWith('/api/')) return;

  // Skip Vite HMR WebSocket and hot-update files
  if (url.pathname.includes('hot-update')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Return cached version or fetch from network
      return cached || fetch(event.request).then((response) => {
        // Only cache successful responses for static assets
        if (response.status === 200 && !url.pathname.endsWith('.js') && !url.pathname.endsWith('.mjs')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    }).catch(() => {
      // Return offline fallback if available
      if (event.request.destination === 'document') {
        return caches.match('/index.html');
      }
    })
  );
});
