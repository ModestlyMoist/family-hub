const C = 'family-hub-v117a';

self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(C).then(cache =>
      cache.addAll([
        './',
        './index.html',
        './styles.css?v=114b',
        './navfix.css?v=115a',
        './search.css?v=117a',
        './app.js?v=116a',
        './search.js?v=117a',
        './navfix.js?v=115a',
        './manifest.webmanifest'
      ])
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== C)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();

        caches.open(C).then(cache => {
          cache.put(event.request, copy);
        });

        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
