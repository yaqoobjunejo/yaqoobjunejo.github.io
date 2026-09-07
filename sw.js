const CACHE = 'portfolio-v9';

// Relative paths — resolved against this file's own location (the SW
// scope), so this works whether the site is hosted at a domain root
// (yaqoobjunejo.github.io/) or a GitHub Pages project subpath
// (username.github.io/reponame/). Absolute "/paths" would silently 404
// under a project subpath and break the whole precache step.
const PRECACHE = [
  './',
  'index.html',
  'style.css',
  'script.js',
  '404.html',
  'manifest.json',
  'icon.svg',
  'icon-light.svg',
  'icon-dark-1.png',
  'icon-dark-2.png',
  'icon-dark-3.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      // Precache best-effort, one file at a time — a single missing file
      // (e.g. resume.pdf not yet uploaded) must never abort caching of
      // everything else the way cache.addAll()'s all-or-nothing behavior would.
      Promise.all(PRECACHE.map(url => cache.add(url).catch(() => {})))
    )
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

// Network-first, cache as fallback only. This is the important fix:
// the previous version served CSS/JS cache-first, which meant that after
// deploying a redesign, anyone who had visited before would keep getting
// the OLD stylesheet/script served instantly from cache — a fresh HTML
// structure paired with a stale, incompatible CSS file looks exactly like
// "the site is broken, no styling, just text." Network-first means a
// deploy is visible on the very next load for anyone online; the cache
// only kicks in when the network request actually fails (offline).
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;
  if (url.origin !== location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then(r => r || caches.match('404.html'))
        )
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
