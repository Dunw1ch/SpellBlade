// SpellBlade service worker.
//
// Bump CACHE_VERSION any time you push a real update to index.html/manifest.json/icons — this is
// what actually invalidates the old cached copies on players' devices. Forgetting to bump it means
// they keep the old app shell until they happen to clear it themselves.
const CACHE_VERSION = 'spellblade-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((err) => console.warn('SpellBlade SW: app shell pre-cache failed', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // never intercept anything that isn't a plain GET

  const url = new URL(req.url);
  const isRuleset = url.pathname.endsWith('ruleset.json');

  if (isRuleset) {
    // Network-first: always prefer a fresh ruleset when there's a connection (so a mid-session
    // Admin update actually reaches players), and only fall back to whatever's cached if the
    // network request fails — e.g. no signal at the table. Also covers the raw-GitHub fallback URL,
    // since it matches the same "ends with ruleset.json" check.
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return resp;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  if (req.mode === 'navigate') {
    // A direct page load/navigation — try the network first (to pick up a genuinely updated
    // index.html), but always have the cached shell ready as an offline fallback.
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return resp;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Everything else (CSS/JS/icons bundled in the single HTML file, plus the icon PNGs) — cache
  // first for speed and offline reliability, since none of this changes often.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
