// Име на кеша
const CACHE_NAME = 'multiplication-trainer-v1';

// Ресурси за кеширане при инсталация
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Инсталация на service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кеширане на статични ресурси');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()) // Позволява на новия service worker да поеме контрола веднага
  );
});

// Активиране на service worker и изчистване на стари кешове
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim()) // Позволява на service worker да контролира всички клиенти
  );
});

// Стратегия за кеширане на заявки: Network First, fallback на Cache
self.addEventListener('fetch', event => {
  // Заявки към Supabase или други API пропускаме кеширането
  if (event.request.url.includes('supabase.co') || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Ако има успешен отговор, кешираме го
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Ако има грешка при мрежата, опитваме от кеша
        return caches.match(event.request);
      })
  );
});
