// My Week — High-Performance Offline Service Worker
const CACHE_NAME = 'my-week-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon.svg',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;0,900;1,600;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
];

// Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return Promise.allSettled(
          STATIC_ASSETS.map((url) =>
            fetch(url)
              .then((response) => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch((err) => {
                console.warn('[SW] Precache skipped for:', url, err);
              })
          )
        );
      })
  );
});

// Activate Event: Clean up stale caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event: Cache-First / Stale-While-Revalidate with SPA & API Offline Fallbacks
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Never intercept or cache dev/Vite assets, HMR, or hashed dynamic module bundles
  const isDevOrDynamic =
    url.pathname.includes('/node_modules/') ||
    url.pathname.includes('/@vite/') ||
    url.pathname.includes('/@fs/') ||
    url.pathname.includes('/@id/') ||
    url.pathname.includes('/src/') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.map') ||
    url.searchParams.has('v') ||
    url.searchParams.has('t');

  if (isDevOrDynamic) {
    event.respondWith(fetch(request));
    return;
  }

  // 1. Handle API Calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        if (url.pathname === '/api/ai-coach/chat') {
          return new Response(
            JSON.stringify({
              reply:
                '⚡ **Offline Advisory Active**: You are currently operating offline. Your entire schedule, daily tasks, habit matrix, streak records, and study logs are saved directly on your device. Live AI coaching will seamlessly reconnect as soon as internet connectivity returns.',
              suggestedActions: [
                { label: 'Check Habit Streaks', prompt: 'Review my weekly habit streak progress' },
                { label: 'Review Today', prompt: 'Show my tasks for today' },
              ],
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        if (url.pathname === '/api/health') {
          return new Response(
            JSON.stringify({ status: 'offline-cached', offline: true, time: new Date().toISOString() }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(JSON.stringify({ error: 'Offline', message: 'You are currently offline.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // 2. Handle HTML Navigation requests (SPA Routing)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // If offline, return cached index.html or root
          const cachedResponse = (await caches.match(request)) || (await caches.match('/index.html')) || (await caches.match('/'));
          if (cachedResponse) {
            return cachedResponse;
          }
          // Ultimate fallback
          return new Response(
            '<!DOCTYPE html><html><head><title>My Week - Offline</title></head><body><h1>My Week is Offline</h1><p>Please connect to the internet once to cache the full application.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 3. Static Assets, JS, CSS, Fonts, Images: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
