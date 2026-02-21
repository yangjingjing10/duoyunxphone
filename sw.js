// Service Worker - 网络优先策略
const CACHE_NAME = 'myphone-v' + Date.now(); // 每次构建自动更新版本
const BASE_PATH = '/dxyphone/';

self.addEventListener('install', event => {
  console.log('[SW] Installing new version:', CACHE_NAME);
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        BASE_PATH,
        BASE_PATH + 'index.html',
        BASE_PATH + 'manifest.json',
        BASE_PATH + 'favicon.svg'
      ]).catch(err => {
        console.log('[SW] Cache addAll failed:', err);
      });
    })
  );
});

self.addEventListener('fetch', event => {
  // 网络优先策略：先尝试网络，失败才用缓存
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 如果网络请求成功，更新缓存
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // 网络失败时使用缓存
        return caches.match(event.request).then(response => {
          if (response) {
            return response;
          }
          return new Response('离线状态', { 
            status: 503, 
            statusText: 'Service Unavailable' 
          });
        });
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating new version:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});










