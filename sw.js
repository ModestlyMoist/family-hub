const C = 'family-hub-v132a';

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
        './today-mobile.css?v=118a',
        './nav-mobile.css?v=119a',
        './wellness.css?v=121a',
        './tracker-collapse.css?v=122a',
        './tasks-cleanup.css?v=126a',
        './today2.css?v=128a',
        './recurring-tasks.css?v=130a',
        './wellness-history.css?v=131a',
        './app.js?v=126a',
        './search.js?v=117a',
        './wellness.js?v=121a',
        './today2.js?v=129a',
        './recurring-tasks.js?v=130a',
        './wellness-history.js?v=132a',
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
