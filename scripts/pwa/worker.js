// Generated at build time. Do not serve this template directly.
const ASSETS = __PRECACHE__;
const VERSION = __VERSION__;
const BASE = __BASE__;
const PREFIX = `noobtips:${BASE}:`;
const CACHE = PREFIX + VERSION;
const absolute = value => new URL(value, self.location.origin).href;
const assetUrls = new Set(ASSETS.map(absolute));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    // addAll rejects the installation if even one core asset is unavailable.
    const cache = await caches.open(CACHE);
    try { await cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' }))); }
    catch (error) { await caches.delete(CACHE); throw error; }
    // Deliberately no skipWaiting here: gameplay decides when it is safe.
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await Promise.all((await caches.keys()).filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'ACTIVATE_WHEN_ALONE') return;
  event.waitUntil((async () => {
    // Do not replace caches under another open game tab / standalone window.
    const windows = (await self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .filter(client => client.url.startsWith(new URL(BASE, self.location.origin).href));
    if (windows.length === 1 && windows[0].id === event.source?.id) await self.skipWaiting();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  // Always serve a consistent version of HTML and its precached assets.
  if (event.request.mode === 'navigate' && (url.pathname === BASE || url.pathname === BASE + 'index.html')) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(BASE + 'index.html')).then(response => response || fetch(event.request)));
  } else if (assetUrls.has(url.href)) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request)).then(response => response || fetch(event.request)));
  }
});
