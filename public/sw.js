/* Only public immutable assets and the dedicated offline document are persisted. */
const VERSION = 'rubi-pwa-v1';
const STATIC_CACHE = `${VERSION}-static`;
const SHELL_CACHE = `${VERSION}-shell`;
const PUBLIC_ASSETS = new Set([
  '/logo_rubi.png', '/icons/icon-192x192.png', '/icons/icon-512x512.png',
  '/rubiramos.png', '/fondo_inicio.png',
]);
const CORE_ASSETS = ['/offline', '/logo_rubi.png', '/icons/icon-192x192.png', '/icons/icon-512x512.png'];

self.addEventListener('install', event => {
  // Do not skip waiting automatically: an open form must not reload during a deployment.
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(CORE_ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('rubi-pwa-') && key !== STATIC_CACHE && key !== SHELL_CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting();
});

function isPublicAsset(url) {
  if (url.search) return false;
  return PUBLIC_ASSETS.has(url.pathname) ||
    /^\/_next\/static\/.+\.(?:js|css|woff2?)$/.test(url.pathname);
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === 'basic' && !response.redirected &&
      !/private|no-store/i.test(response.headers.get('Cache-Control') || '')) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
    const keys = await cache.keys();
    // Bound storage on devices with limited space; document data is never in this cache.
    for (const key of keys.slice(0, Math.max(0, keys.length - 120))) await cache.delete(key);
  }
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // All writes, authenticated APIs, RSC requests, optimized images and external resources
  // use the browser network directly. There is no queue or data cache.
  if (request.method !== 'GET' || url.origin !== self.location.origin ||
      request.headers.has('Authorization') || request.headers.has('RSC') ||
      request.headers.has('Next-Action') || request.headers.has('Next-Router-Prefetch')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () =>
      (await caches.match('/offline')) || new Response('Sin conexión. Revisa tu conexión e inténtalo nuevamente.', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })));
    return;
  }
  if (isPublicAsset(url)) event.respondWith(cacheFirst(request));
});
