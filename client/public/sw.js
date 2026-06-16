const CACHE = 'glitch-rift-v1';

// Assets to pre-cache on install
const PRECACHE = ['/'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate for game assets, network-first for HTML
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  if (request.destination === 'document') {
    // Network-first for HTML so updates are picked up
    event.respondWith(
      fetch(request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(request, clone));
        return res;
      }).catch(() => caches.match(request))
    );
  } else {
    // Stale-while-revalidate for JS/CSS/images
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(request).then(cached => {
          const network = fetch(request).then(res => {
            cache.put(request, res.clone());
            return res;
          });
          return cached || network;
        })
      )
    );
  }
});
