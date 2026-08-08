/*
 * Canto service worker. The precache manifest and cache version placeholders below
 * are injected at build time by the Vite plugin in `vite.config.ts`.
 *
 * Strategy: precache everything the free-practice mode needs, then serve
 * cache-first. No network request is made during an exercise (item_001 AC2, AC4),
 * and nothing from the microphone is ever cached because nothing is ever fetched.
 */

const CACHE_NAME = __CACHE_VERSION__;
const PRECACHE = __PRECACHE_MANIFEST__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Individual failures must not abort the whole install.
      await Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations fall back to the app shell so a deep link works offline too.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = (await cache.match(request)) || (await cache.match('/'));
        if (cached) {
          revalidate(request, cache);
          return cached;
        }
        return fetch(request);
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok && response.type === 'basic') cache.put(request, response.clone());
        return response;
      } catch (error) {
        const shell = await cache.match('/');
        if (shell && request.destination === 'document') return shell;
        throw error;
      }
    })(),
  );
});

/** Refreshes the shell in the background without delaying the offline response. */
function revalidate(request, cache) {
  fetch(request)
    .then((response) => {
      if (response.ok && response.type === 'basic') cache.put(request, response.clone());
    })
    .catch(() => {
      /* Offline: the cached shell is already the answer. */
    });
}
