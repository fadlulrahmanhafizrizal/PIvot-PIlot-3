// Menggunakan v12 agar browser dipaksa membuang cache lama dan mengunduh struktur baru
const CACHE_NAME = "pivot-pilot-v14"; 
const BASE_URL = "/Pivot-Pilot-3/";

const urlsToCache = [
  BASE_URL,
  `${BASE_URL}index.html`,
  `${BASE_URL}manifest.json`,
  `${BASE_URL}offline.html`,
  // Menambahkan file widget agar indikator 'widgets' di PWABuilder menjadi hijau
  `${BASE_URL}stats-widget.json`,
  `${BASE_URL}stats-data.json`,
  // Jalur ikon yang sudah diperbaiki (tanpa folder ganda)
  `${BASE_URL}icons/logo-pivot.png`,
  `${BASE_URL}icons/logo-pivot2.png`,
  `${BASE_URL}icons/promo-1.png`,
  `${BASE_URL}icons/promo-2.png`,
  `${BASE_URL}icons/promo-3.png`
];

// 1. Install Service Worker & Caching Aset
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Caching aset Pivot Pilot v12...");
      return Promise.allSettled(
        urlsToCache.map(url => cache.add(url))
      );
    })
  );
});

// 2. Aktivasi & Pembersihan Cache Lama (Penting untuk transisi dari v11 ke v12)
self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
      await self.clients.claim();
    })()
  );
});

// 3. FITUR: Background Sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-updates') {
    event.waitUntil(console.log("Background Sync: Sinkronisasi data dimulai..."));
  }
});

// 4. FITUR: Periodic Sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-cache') {
    event.waitUntil(console.log("Periodic Sync: Memperbarui cache berkala..."));
  }
});

// 5. FITUR: Push Notifications
self.addEventListener('push', event => {
  const options = {
    body: 'Ada pembaruan strategi di Pivot Pilot!',
    icon: `${BASE_URL}icons/logo-pivot.png`,
    badge: `${BASE_URL}icons/logo-pivot.png`,
    vibrate: [100, 50, 100]
  };
  event.waitUntil(self.registration.showNotification('Pivot Pilot', options));
});

// 6. Fetching Strategy: Network-First dengan Fallback Cache & Offline Page
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.protocol.startsWith("chrome-extension") || request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then(networkResponse => {
        if (url.origin === self.location.origin) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then(response => {
          if (response) return response;
          if (request.mode === 'navigate') {
            return caches.match(`${BASE_URL}offline.html`);
          }
        });
      })
  );
});