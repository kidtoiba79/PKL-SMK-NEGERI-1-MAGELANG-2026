// Minimal Service Worker untuk memenuhi syarat PWA Installability
self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
    // Abaikan request non-GET (POST, PUT, DELETE) - biarkan langsung ke network
    if (e.request.method !== 'GET') return;

    // Abaikan request ke Supabase API - tidak boleh di-cache
    if (e.request.url.includes('supabase.co')) return;

    // Untuk semua GET request: coba network, jika gagal abaikan (jangan error)
    e.respondWith(
        fetch(e.request).catch(() => {
            // Jika network gagal (offline), kembalikan response kosong
            // agar app tidak crash
            return new Response('', { status: 503, statusText: 'Offline' });
        })
    );
});
