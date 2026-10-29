// Root sw.js: PEMBERSIH sementara.
// Game dulu hidup di root (scope '/'), sekarang pindah ke /game/ (lihat game/sw.js).
// Pemain lama masih punya service worker lama di scope '/', yang akan terus menyajikan
// game lama dari cache. File ini menggantikannya: hapus cache lama, lepas dirinya, lalu muat ulang tab.
// Boleh dihapus setelah beberapa minggu/bulan.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) {
    event.waitUntil((async function () {
        try {
            var names = await caches.keys();
            await Promise.all(names.filter(function (n) { return n.indexOf('se-v') === 0; })
                .map(function (n) { return caches.delete(n); }));
        } catch (e) { /* lewati */ }
        try { await self.registration.unregister(); } catch (e) { /* lewati */ }
        try {
            var list = await self.clients.matchAll({ type: 'window' });
            list.forEach(function (c) { try { c.navigate(c.url); } catch (e) { /* lewati */ } });
        } catch (e) { /* lewati */ }
    })());
});
