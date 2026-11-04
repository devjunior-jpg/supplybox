const CACHE_NAME = 'supplybox-v2';
const assetsToCache = [
  'index.html',
  'marchand.html',
  'admin.html',
  'ap.js',
  'manifest.json',
  'favicon.png',
  'logo-supplybox.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(assetsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});