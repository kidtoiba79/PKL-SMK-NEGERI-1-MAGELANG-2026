// Minimal Service Worker untuk memenuhi syarat PWA Installability
self.addEventListener('install', (e) => {
    // Memaksa SW aktif segera setelah di-install
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    // Mengambil kontrol halaman secara langsung
    e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
    // Pass-through: Jangan meng-cache request API atau dynamic routing SvelteKit
    // Untuk app yang lebih kompleks, Anda bisa meng-cache aset statis di sini.
    e.respondWith(fetch(e.request));
});
