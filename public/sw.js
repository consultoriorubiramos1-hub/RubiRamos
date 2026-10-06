/* Public documents are generated at build time, never from a session response. */
const VERSION = 'rubi-pwa-v2';
const SHELL_CACHE = `${VERSION}-shell`;
const STATIC_CACHE = `${VERSION}-runtime`;
const PUBLIC_PREFIX = 'rubi-pwa-public-';
const INDEX = '/offline-public/index.json';
const PUBLIC_ROUTES = ['/', '/servicios', '/quienessomos', '/politicas', '/terminos'];
const CORE_ASSETS = ['/offline', '/manifest.json', '/offline-status.js', '/logo_rubi.png', '/icons/icon-192x192.png', '/icons/icon-512x512.png'];
let refreshPromise;

function safeResponse(response) {
  return response.ok && response.type === 'basic' && !response.redirected &&
    !/private|no-store/i.test(response.headers.get('Cache-Control') || '');
}
function isPublicAsset(url) {
  return !url.search && (CORE_ASSETS.includes(url.pathname) ||
    /^\/_next\/static\/[\w./-]+\.(?:js|css|woff2?)$/.test(url.pathname));
}
function validIndex(index) {
  if (!index || !/^[\w-]{1,100}$/.test(index.release) || !Array.isArray(index.assets) ||
      index.assets.length > 100 || !index.routes || Object.keys(index.routes).length !== PUBLIC_ROUTES.length) return false;
  const prefix = `/offline-public/${index.release}/`;
  return PUBLIC_ROUTES.every(route => Object.hasOwn(index.routes, route) &&
    index.routes[route] === `${prefix}${route === '/' ? 'index' : route.slice(1)}.html` &&
    index.assets.includes(index.routes[route])) && index.assets.every(asset =>
    typeof asset === 'string' && !asset.includes('..') && !/[?#]/.test(asset) &&
    !/^\/(?:api|admin|login|catalog)(?:\/|$)/.test(asset) &&
    (Object.values(index.routes).includes(asset) || asset === '/offline-status.js' ||
     /^\/_next\/static\/[\w./-]+\.(?:css|woff2?)$/.test(asset) ||
     /^\/[\w./-]+\.(?:png|jpe?g|webp|avif|gif)$/.test(asset)));
}
async function readIndex() {
  const shell = await caches.open(SHELL_CACHE);
  const response = await shell.match(INDEX);
  if (!response) return null;
  const index = await response.json();
  return validIndex(index) ? index : null;
}
function refreshPublicContent() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const response = await fetch(INDEX, { credentials: 'omit', cache: 'no-store' });
    if (!safeResponse(response)) throw Error('Public offline index unavailable');
    const index = await response.json();
    if (!validIndex(index)) throw Error('Invalid public offline index');
    const previous = await readIndex();
    const cache = await caches.open(`${PUBLIC_PREFIX}${index.release}`);
    // Pin documents and dependencies together, outside the bounded runtime cache.
    await Promise.all(index.assets.map(async asset => {
      if (await cache.match(asset)) return;
      const assetResponse = await fetch(asset, { credentials: 'omit', cache: 'reload' });
      if (!safeResponse(assetResponse)) throw Error(`Public offline asset unavailable: ${asset}`);
      await cache.put(asset, assetResponse);
    }));
    const shell = await caches.open(SHELL_CACHE);
    if (previous?.release !== index.release) {
      const core = await Promise.all(CORE_ASSETS.map(async asset => {
        const response = await fetch(asset, { credentials: 'omit', cache: 'reload' });
        if (!safeResponse(response)) throw Error('Updated public shell unavailable');
        return [asset, response];
      }));
      await Promise.all(core.map(([asset, response]) => shell.put(asset, response)));
    }
    // Atomic switch: an interrupted update leaves the previous complete release active.
    await shell.put(INDEX, new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json' } }));
    const keep = new Set([`${PUBLIC_PREFIX}${index.release}`]);
    if (previous) keep.add(`${PUBLIC_PREFIX}${previous.release}`);
    for (const key of await caches.keys()) {
      if (key.startsWith(PUBLIC_PREFIX) && !keep.has(key)) await caches.delete(key);
    }
  })().finally(() => { refreshPromise = undefined; });
  return refreshPromise;
}
self.addEventListener('install', event => {
  // No automatic skipWaiting: a deployment must not reload an open appointment form.
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL_CACHE);
    await Promise.all(CORE_ASSETS.map(async asset => {
      const response = await fetch(asset, { credentials: 'omit', cache: 'reload' });
      if (!safeResponse(response)) throw Error('Offline shell unavailable');
      await shell.put(asset, response);
    }));
    // The small fallback survives an interrupted public snapshot download.
    await refreshPublicContent().catch(() => {});
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('rubi-pwa-') && !key.startsWith(PUBLIC_PREFIX) && key !== STATIC_CACHE && key !== SHELL_CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting();
  if (event.data?.type === 'REFRESH_PUBLIC_CONTENT') event.waitUntil(refreshPublicContent().catch(() => {}));
});
async function publicFallback(url) {
  if (!url.search && PUBLIC_ROUTES.includes(url.pathname)) {
    const index = await readIndex();
    if (index) {
      const cache = await caches.open(`${PUBLIC_PREFIX}${index.release}`);
      const document = await cache.match(index.routes[url.pathname]);
      if (document) return document;
    }
  }
  const shell = await caches.open(SHELL_CACHE);
  return (await shell.match('/offline')) || new Response('Sin conexión. Revisa tu conexión e inténtalo nuevamente.', {
    status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
async function networkNavigation(request, url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    // No live HTML response is persisted, including HTML from public URLs.
    return await fetch(request, { signal: controller.signal });
  } catch {
    return await publicFallback(url);
  } finally {
    clearTimeout(timeout);
  }
}
async function cacheFirst(request) {
  const index = await readIndex();
  const active = index && await (await caches.open(`${PUBLIC_PREFIX}${index.release}`)).match(request);
  const cached = active || await (await caches.open(SHELL_CACHE)).match(request) || await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (safeResponse(response)) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
    const keys = await cache.keys();
    for (const key of keys.slice(0, Math.max(0, keys.length - 120))) await cache.delete(key);
  }
  return response;
}
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // Writes, APIs, authentication, RSC, private images and external resources use only network.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') ||
      request.headers.has('Authorization') || request.headers.has('RSC') ||
      request.headers.has('Next-Action') || request.headers.has('Next-Router-Prefetch')) return;
  if (request.mode === 'navigate') {
    event.respondWith(networkNavigation(request, url));
    return;
  }
  if (isPublicAsset(url) || (!url.search && /^\/[\w./-]+\.(?:png|jpe?g|webp|avif|gif)$/.test(url.pathname))) {
    event.respondWith((async () => {
      const index = await readIndex();
      // Images outside the build inventory are neither stored nor served from cache.
      if (!isPublicAsset(url) && !index?.assets.includes(url.pathname)) return fetch(request);
      return cacheFirst(request);
    })());
  }
});
