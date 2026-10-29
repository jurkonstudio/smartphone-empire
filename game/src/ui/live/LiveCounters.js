// FILE: src/ui/live/LiveCounters.js  (BARU)
// Penggerak "live count": memperbarui angka stok & pengguna aktif OS langsung di DOM
// dengan tween halus per frame (tanpa render ulang panel).
//   [data-live-stock="<productId>"]                       teks stok
//   [data-live-bar="<productId>"][data-live-cap="<cap>"]  lebar bar stok
//   [data-live-os-users]                                  teks total pengguna aktif OS
//   [data-live-revenue="<productId>"]                     teks pendapatan produk (angka saja, tanpa $)
//   [data-live-revenue-total]                             teks total pendapatan katalog (angka saja, tanpa $)
import { bus } from '../../core/EventBus.js';
import { state } from '../../core/GameState.js';
import { projectedStock, projectedOsAdoption, projectedRevenue, projectedTotalRevenue, easeTowards } from '../../systems/LiveProjection.js';

var _values = new Map();
var _raf = null;
var _last = 0;
var _inited = false;

export function formatLive(n) { return Math.round(n || 0).toLocaleString('en-US'); }

export function initLiveCounters() {
    if (_inited || typeof document === 'undefined') return;
    _inited = true;
    _ensureStyles();
    bus.on('time:tick', _kick);
}

function _kick() {
    if (_raf !== null || typeof requestAnimationFrame !== 'function') return;
    _last = 0;
    _raf = requestAnimationFrame(_frame);
}

function _frame(ts) {
    _raf = null;
    const stockEls = document.querySelectorAll('[data-live-stock],[data-live-bar]');
    const osEls = document.querySelectorAll('[data-live-os-users]');
    const revEls = document.querySelectorAll('[data-live-revenue]');
    const revTotEls = document.querySelectorAll('[data-live-revenue-total]');
    if (!stockEls.length && !osEls.length && !revEls.length && !revTotEls.length) { _last = 0; return; }
    const dt = _last ? Math.min(100, Math.max(0, ts - _last)) : 16;
    _last = ts;
    const data = state.get();
    if (!data) return;

    // 1) target per key (sekali per frame, agar elemen berbagi key tidak ganda-tween)
    const targets = new Map();
    const byId = new Map();
    ((data.products && data.products.catalog) || []).forEach(function (p) { byId.set(String(p.id), p); });
    stockEls.forEach(function (el) {
        const id = el.getAttribute('data-live-stock') || el.getAttribute('data-live-bar');
        const p = byId.get(id);
        if (p) targets.set('stock:' + id, projectedStock(p, data.time));
    });
    if (osEls.length) targets.set('os', projectedOsAdoption(data).activeUsers);
    if (revEls.length) {
        revEls.forEach(function (el) {
            const id = el.getAttribute('data-live-revenue');
            const p = byId.get(id);
            if (p) targets.set('rev:' + id, projectedRevenue(p, data.time));
        });
    }
    if (revTotEls.length) targets.set('revtotal', projectedTotalRevenue(data));

    // 2) tween
    let moving = false;
    const vals = new Map();
    targets.forEach(function (target, key) {
        const cur = _values.has(key) ? _values.get(key) : target;
        const next = easeTowards(cur, target, dt);
        _values.set(key, next);
        vals.set(key, next);
        if (next !== target) moving = true;
    });

    // 3) tulis DOM
    stockEls.forEach(function (el) {
        const id = el.getAttribute('data-live-stock') || el.getAttribute('data-live-bar');
        const v = vals.get('stock:' + id);
        if (v === undefined) return;
        if (el.hasAttribute('data-live-stock')) {
            const s = formatLive(v);
            if (el.textContent !== s) el.textContent = s;
        } else {
            const cap = Number(el.getAttribute('data-live-cap')) || 0;
            const pct = cap > 0 ? Math.max(0, Math.min(100, (v / cap) * 100)) : (v > 0 ? 100 : 0);
            el.style.width = pct.toFixed(2) + '%';
            const out = Math.round(v) <= 0;
            el.classList.toggle('out', out);
            el.classList.toggle('low', !out && pct < 20);
        }
    });
    if (osEls.length && vals.has('os')) {
        const s = formatLive(vals.get('os'));
        osEls.forEach(function (el) { if (el.textContent !== s) el.textContent = s; });
    }
    revEls.forEach(function (el) {
        const id = el.getAttribute('data-live-revenue');
        const v = vals.get('rev:' + id);
        if (v === undefined) return;
        const s = formatLive(v);
        if (el.textContent !== s) el.textContent = s;
    });
    if (revTotEls.length && vals.has('revtotal')) {
        const s = formatLive(vals.get('revtotal'));
        revTotEls.forEach(function (el) { if (el.textContent !== s) el.textContent = s; });
    }

    if (moving) _raf = requestAnimationFrame(_frame);
    else _last = 0;
}

function _ensureStyles() {
    if (document.getElementById('live-counters-style')) return;
    const st = document.createElement('style');
    st.id = 'live-counters-style';
    st.textContent = '.cat-bar-fill[data-live-bar]{transition:none;}' +
        '[data-live-stock],[data-live-os-users],[data-live-revenue],[data-live-revenue-total]{font-variant-numeric:tabular-nums;}';
    document.head.appendChild(st);
}
