/* ================================================
   PIVOT PILOT v3.0 — Service Worker
   Strategi: Offline-first untuk Standalone HTML
   ================================================ */

const CACHE_NAME = 'pivot-pilot-v3-cache-v1';

// Senarai aset untuk disimpan dalam cache
const ASSETS_TO_CACHE = [
  './',
  './index.html', // Pastikan nama fail ini tepat dengan fail anda
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap',
  'https://fonts.gstatic.com/s/syne/v22/8ua47o3vM7S_nz99_S8.woff2', // Contoh penstoran font statik
];

// --- Fasa Install ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Memulakan caching aset statik');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// --- Fasa Activate (Pembersihan Cache Lama) ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Memadam cache lama:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// --- Fasa Fetch (Strategi Cache First) ---
self.addEventListener('fetch', (event) => {
  // Hanya proses permintaan GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Pulangkan dari cache jika ada, jika tidak, ambil dari rangkaian
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Simpan salinan baru ke cache jika ia adalah permintaan yang sah
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Jika offline dan fail tidak ada dalam cache
        if (event.request.mode === 'navigate') {
          return caches.match('./pivot-pilot-v3.html');
        }
      });
    })
  );
});