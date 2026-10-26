// Tes logika sw.js dengan self/caches/fetch tiruan. Jalankan dari akar repo: node tools/sw.test.mjs
import fs from 'node:fs';
const H = 'https://game.test', SCOPE = H + '/';
const L = {}, store = {};               // listener SW, isi cache: nama -> Map(url -> Response)
let net = {}, netCalls = [], offline = false, claimed = false, skipped = false;
const mk = (body, status = 200, type = 'basic') => { const r = new Response(body, { status }); Object.defineProperty(r, 'type', { value: type }); return r; };
const urlOf = k => (typeof k === 'string' ? k : k.url);
function fakeCache(name) {
    const m = store[name] = store[name] || new Map();
    return {
        async match(k, o) { const u = urlOf(k); for (const [kk, v] of m) { if (kk === u || (o && o.ignoreSearch && kk.split('?')[0] === u.split('?')[0])) return v.clone(); } },
        async put(k, v) { m.set(urlOf(k), v); }
    };
}
globalThis.self = {
    location: { href: H + '/sw.js?v=9.9.9', origin: H }, registration: { scope: SCOPE },
    addEventListener: (t, f) => { L[t] = f; },
    skipWaiting() { skipped = true; }, clients: { claim: async () => { claimed = true; } }
};
globalThis.caches = {
    open: async n => fakeCache(n), keys: async () => Object.keys(store),
    delete: async n => { const had = n in store; delete store[n]; return had; }
};
globalThis.fetch = async (u, init) => {
    netCalls.push({ u, init });
    if (offline) throw new TypeError('offline');
    const body = net[u]; if (body === undefined) return mk('nf', 404);
    return typeof body === 'string' ? mk(body) : body;
};
await import('../sw.js');

let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.error('GAGAL:', m); } else console.log('ok   ', m); };
const req = (path, extra = {}) => ({ url: path.startsWith('http') ? path : H + path, method: 'GET', mode: 'cors', referrer: H + '/', ...extra });
async function doFetch(r) {
    let p = null; const waits = [];
    L.fetch({ request: r, respondWith: x => { p = x; }, waitUntil: x => waits.push(x) });
    const res = p ? await p : undefined;
    await Promise.all(waits);
    return p ? res : 'BYPASS';
}

// --- bypass
ok(await doFetch(req('/src/main.js', { method: 'POST' })) === 'BYPASS', 'non-GET dilewati');
ok(await doFetch(req('https://abc.supabase.co/auth/v1/token')) === 'BYPASS', 'supabase.co tidak disentuh');
ok(await doFetch(req('https://example.org/x.js')) === 'BYPASS', 'domain lain tidak disentuh');
ok(await doFetch(req('/031411/index.html', { mode: 'navigate' })) === 'BYPASS', 'halaman admin 031411/ tidak disentuh');
ok(await doFetch(req('/src/core/a.js', { referrer: H + '/031411/' })) === 'BYPASS', 'sub-resource dari halaman admin tidak disentuh');
ok(await doFetch(req('/web.html', { mode: 'navigate' })) === 'BYPASS' && await doFetch(req('/Welcome.html', { mode: 'navigate' })) === 'BYPASS', 'web.html dan Welcome.html tidak disentuh');
ok(await doFetch(req('/version.json')) === 'BYPASS' && await doFetch(req('/src/config/app.config.js?sw-check=1')) === 'BYPASS', 'version.json dan ?sw-check tidak disentuh');
ok(await doFetch(req('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm')) === 'BYPASS', 'supabase-js (CDN) tidak di-cache');

// --- stale-while-revalidate
net[H + '/src/main.js'] = 'v1';
let r = await doFetch(req('/src/main.js'));
ok(await r.text() === 'v1', 'SWR: miss -> ambil dari jaringan');
ok([...store['se-v9.9.9'].keys()].includes(H + '/src/main.js'), 'SWR: disimpan di cache bernama dengan versi dari ?v=');
net[H + '/src/main.js'] = 'v2'; netCalls = [];
r = await doFetch(req('/src/main.js'));
ok(await r.text() === 'v1', 'SWR: hit -> langsung versi tersimpan');
ok(netCalls.length === 1 && netCalls[0].init.cache === 'no-cache', 'SWR: revalidasi lewat jaringan dengan cache:no-cache');
r = await doFetch(req('/src/main.js'));
ok(await r.text() === 'v2', 'SWR: muat berikutnya mendapat versi baru');

// --- non-200 tidak disimpan
net[H + '/src/x.js'] = mk('oops', 500);
await doFetch(req('/src/x.js'));
ok(![...store['se-v9.9.9'].keys()].includes(H + '/src/x.js'), 'respons non-200 tidak disimpan');
net[H + '/src/o.js'] = mk('opaque', 200, 'opaqueredirect');
await doFetch(req('/src/o.js'));
ok(![...store['se-v9.9.9'].keys()].includes(H + '/src/o.js'), 'respons bukan basic/cors tidak disimpan');

// --- cache-first
net[H + '/assets/img/a.webp'] = 'img1';
await doFetch(req('/assets/img/a.webp')); netCalls = [];
r = await doFetch(req('/assets/img/a.webp'));
ok(await r.text() === 'img1' && netCalls.length === 0, 'assets/: cache-first, tidak ke jaringan saat sudah ada');
const T = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
net[T] = mk('three', 200, 'cors'); await doFetch(req(T)); netCalls = [];
r = await doFetch(req(T));
ok(await r.text() === 'three' && netCalls.length === 0, 'three.js (versi dipin): cache-first');
ok(await doFetch(req('https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js')) === 'BYPASS', 'three.js tanpa versi dipin tidak di-cache');

// --- navigasi + offline
net[SCOPE] = '<html>v1'; net[H + '/index.html'] = '<html>v1';
await doFetch(req('/', { mode: 'navigate' }));
offline = true;
r = await doFetch(req('/?_v=abc', { mode: 'navigate' }));
ok(await r.text() === '<html>v1', 'navigasi offline (dengan ?_v=) dilayani dari cache');
r = await doFetch(req('/src/main.js'));
ok(await r.text() === 'v2', 'modul tersimpan tetap dilayani saat offline');
offline = false;

// --- network-first patches.json
net[H + '/patches.json'] = '[1]'; await doFetch(req('/patches.json'));
net[H + '/patches.json'] = '[2]';
ok(await (await doFetch(req('/patches.json'))).text() === '[2]', 'patches.json: jaringan didahulukan');
offline = true;
ok(await (await doFetch(req('/patches.json'))).text() === '[2]', 'patches.json: offline memakai cache');
offline = false;

// --- pesan: CACHE_URLS, CLEAR_CACHE, SKIP_WAITING
net[H + '/src/lazy.js'] = 'lazy';
await new Promise(res => L.message({ data: { type: 'CACHE_URLS', urls: [H + '/src/lazy.js', 'https://abc.supabase.co/x', H + '/031411/a.js'] }, waitUntil: p => p.then(res) }));
const keys = [...store['se-v9.9.9'].keys()];
ok(keys.includes(H + '/src/lazy.js') && !keys.includes('https://abc.supabase.co/x') && !keys.includes(H + '/031411/a.js'), 'CACHE_URLS menyimpan hanya yang boleh di-cache');
L.message({ data: { type: 'SKIP_WAITING' } }); ok(skipped, 'SKIP_WAITING memanggil skipWaiting');
let acked = false;
await new Promise(res => L.message({ data: { type: 'CLEAR_CACHE' }, ports: [{ postMessage: () => { acked = true; } }], waitUntil: p => p.then(res) }));
ok(acked && !('se-v9.9.9' in store), 'CLEAR_CACHE menghapus cache versi ini dan membalas');

// --- activate: hapus cache versi lama
store['se-v0.0.1'] = new Map(); store['lain'] = new Map(); store['se-v9.9.9'] = new Map();
await new Promise(res => L.activate({ waitUntil: p => p.then(res) }));
ok(!('se-v0.0.1' in store) && ('se-v9.9.9' in store) && ('lain' in store) && claimed, 'activate: cache versi lama dihapus, cache lain & versi aktif aman, clients.claim');

console.log(fails ? ('\n' + fails + ' GAGAL') : '\nSEMUA LULUS'); process.exit(fails ? 1 : 0);
