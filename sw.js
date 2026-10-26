// FILE: sw.js  (Tahap 3A — service worker)
// Versi cache diambil dari query registrasi: sw.js?v=<APP_CONFIG.version>
// (satu sumber versi, tidak perlu disalin manual).
//
// Strategi:
//   assets/ + gambar/audio/font + three.js (CDN, versi dipin) -> cache-first
//   .js .css .html .webmanifest .json milik game              -> stale-while-revalidate
//   patches.json                                              -> network-first (catatan patch harus segar)
//   supabase.co, domain lain, non-GET, version.json, ?sw-check -> TIDAK disentuh (langsung ke jaringan)
//   031411/ (admin), web.html, Welcome.html                   -> TIDAK disentuh
// Hanya respons 200 (basic/cors) yang disimpan.
'use strict';

const VERSION = (function () {
    try { return new URL(self.location.href).searchParams.get('v') || 'dev'; } catch (e) { return 'dev'; }
})();
const CACHE_PREFIX = 'se-v';
const CACHE = CACHE_PREFIX + VERSION;
const SCOPE = self.registration.scope;                 // mis. https://host/ atau https://host/repo/
const SCOPE_PATH = new URL(SCOPE).pathname;
const THREE_RE = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@\d+\.\d+\.\d+\//;
const STATIC_EXT = /\.(png|jpe?g|webp|gif|svg|ico|mp3|ogg|wav|m4a|woff2?)$/i;
const CODE_EXT = /\.(js|mjs|css|html|json|webmanifest)$/i;
const NEVER_PATHS = ['031411/', 'web.html', 'Welcome.html', 'version.json', 'supabase/'];

function route(request) {
    if (request.method !== 'GET') return 'bypass';
    let url;
    try { url = new URL(request.url); } catch (e) { return 'bypass'; }
    if (url.origin !== self.location.origin) return THREE_RE.test(request.url) ? 'cache-first' : 'bypass';
    if (url.searchParams.has('sw-check')) return 'bypass';
    if (!url.pathname.startsWith(SCOPE_PATH)) return 'bypass';
    const rel = url.pathname.slice(SCOPE_PATH.length);
    for (let i = 0; i < NEVER_PATHS.length; i++) {
        if (rel === NEVER_PATHS[i] || (NEVER_PATHS[i].slice(-1) === '/' && rel.indexOf(NEVER_PATHS[i]) === 0)) return 'bypass';
    }
    // Sub-resource yang diminta halaman admin tidak ikut di-cache.
    try {
        if (request.referrer && new URL(request.referrer).pathname.indexOf(SCOPE_PATH + '031411/') === 0) return 'bypass';
    } catch (e) { /* abaikan */ }
    if (request.mode === 'navigate') return (rel === '' || rel === 'index.html') ? 'swr' : 'bypass';
    if (rel === 'patches.json') return 'network-first';
    if (rel.indexOf('assets/') === 0 || STATIC_EXT.test(rel)) return 'cache-first';
    if (CODE_EXT.test(rel)) return 'swr';
    return 'bypass';
}

// Navigasi (index.html?_v=... dsb.) memakai satu kunci: akar scope.
function keyFor(request) { return request.mode === 'navigate' ? SCOPE : request.url; }

function cacheable(res) {
    return !!res && res.status === 200 && (res.type === 'basic' || res.type === 'cors');
}

async function fetchAndStore(cache, key, url, init) {
    const res = await fetch(url, init);
    if (cacheable(res)) { try { await cache.put(key, res.clone()); } catch (e) { /* kuota penuh dsb. */ } }
    return res;
}

async function cacheFirst(request) {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(request.url);
    if (hit) return hit;
    return fetchAndStore(cache, request.url, request.url);
}

async function networkFirst(request) {
    const cache = await caches.open(CACHE);
    try { return await fetchAndStore(cache, request.url, request.url, { cache: 'no-cache' }); }
    catch (e) {
        const hit = await cache.match(request.url);
        if (hit) return hit;
        throw e;
    }
}

async function staleWhileRevalidate(event, request) {
    const cache = await caches.open(CACHE);
    const nav = request.mode === 'navigate';
    const key = keyFor(request);
    const hit = await cache.match(key, nav ? { ignoreSearch: true } : undefined);
    // Revalidasi selalu melewati cache HTTP browser (no-cache) supaya benar-benar segar.
    const refresh = fetchAndStore(cache, key, request.url, { cache: 'no-cache' }).catch(function () { return null; });
    if (hit) { event.waitUntil(refresh); return hit; }
    const fresh = await refresh;
    if (fresh) return fresh;
    if (nav) { const shell = await cache.match(SCOPE, { ignoreSearch: true }); if (shell) return shell; }
    return Response.error();
}

self.addEventListener('install', function () {
    // Sengaja TIDAK skipWaiting: versi baru menunggu sampai pemain menekan "Muat ulang".
});

self.addEventListener('activate', function (event) {
    event.waitUntil((async function () {
        const names = await caches.keys();
        await Promise.all(names.filter(function (n) { return n.indexOf(CACHE_PREFIX) === 0 && n !== CACHE; })
            .map(function (n) { return caches.delete(n); }));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', function (event) {
    const request = event.request;
    const mode = route(request);
    if (mode === 'bypass') return;                       // biarkan browser menangani
    if (mode === 'cache-first') event.respondWith(cacheFirst(request));
    else if (mode === 'network-first') event.respondWith(networkFirst(request));
    else event.respondWith(staleWhileRevalidate(event, request));
});

self.addEventListener('message', function (event) {
    const d = event.data || {};
    const port = event.ports && event.ports[0];
    if (d.type === 'SKIP_WAITING') { self.skipWaiting(); return; }
    if (d.type === 'CLEAR_CACHE') {
        event.waitUntil(caches.delete(CACHE).then(function () { if (port) port.postMessage({ ok: true }); }));
        return;
    }
    if (d.type === 'CACHE_URLS' && Array.isArray(d.urls)) {
        // Halaman mengirim daftar berkas yang SUDAH dimuat, supaya kunjungan pertama bisa dimuat ulang offline.
        event.waitUntil((async function () {
            const cache = await caches.open(CACHE);
            const todo = d.urls.filter(function (u) {
                return typeof u === 'string' && route({ url: u, method: 'GET', mode: 'cors', referrer: '' }) !== 'bypass';
            });
            for (let i = 0; i < todo.length; i += 8) {
                await Promise.all(todo.slice(i, i + 8).map(async function (u) {
                    try { if (!(await cache.match(u))) await fetchAndStore(cache, u, u); } catch (e) { /* lewati */ }
                }));
            }
        })());
    }
});
