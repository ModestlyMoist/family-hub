const C = 'family-hub-v106a';

self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(C).then(cache =>
      cache.addAll([
        './',
        './index.html',
        './styles.css?v=106a',
        './app.js?v=106a',
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
