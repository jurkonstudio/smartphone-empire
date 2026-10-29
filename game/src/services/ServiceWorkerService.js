// FILE: src/services/ServiceWorkerService.js  (Tahap 3A)
// Mendaftarkan sw.js SETELAH game selesai boot. Semua langkah dibungkus try/catch:
// bila service worker tidak didukung atau gagal, game tetap jalan normal tanpa error.
// Opt-out untuk pengembangan: buka dengan ?nosw=1 (mencabut SW yang terpasang).
import { APP_CONFIG } from '../config/app.config.js';
import { ToastService } from '../core/ToastService.js';
import { t } from '../core/LanguageService.js';

var _notified = false;
var _reg = null;

function _tf(key, fb) {
    try { var v = t(key); return (v && v !== key) ? v : fb; } catch (e) { return fb; }
}

function _postAndWait(worker, msg, ms) {
    return new Promise(function (resolve) {
        var done = false;
        function fin() { if (!done) { done = true; resolve(); } }
        try {
            var ch = new MessageChannel();
            ch.port1.onmessage = fin;
            worker.postMessage(msg, [ch.port2]);
        } catch (e) { fin(); }
        setTimeout(fin, ms);
    });
}

// Dipanggil saat pemain menekan "Muat ulang": kosongkan cache lalu muat ulang,
// supaya muat ulang itu benar-benar mengambil berkas terbaru (tidak campur lama/baru).
function _applyUpdate() {
    var reloaded = false;
    function reload() { if (!reloaded) { reloaded = true; location.reload(); } }
    try {
        var active = (_reg && _reg.active) || navigator.serviceWorker.controller;
        var p = active ? _postAndWait(active, { type: 'CLEAR_CACHE' }, 1500) : Promise.resolve();
        p.then(function () {
            if (_reg && _reg.waiting) {
                navigator.serviceWorker.addEventListener('controllerchange', reload);
                _reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                setTimeout(reload, 1500);
            } else reload();
        });
    } catch (e) { reload(); }
}

function _notify() {
    if (_notified) return;
    _notified = true;
    try {
        ToastService.show(
            _tf('sw.update.available', 'A new version is available.'),
            'info', 20000,
            { force: true, action: { label: _tf('sw.update.reload', 'Reload'), onClick: _applyUpdate } }
        );
    } catch (e) { /* abaikan */ }
}

// Deteksi versi baru tanpa bergantung pada byte sw.js: baca app.config.js terbaru (melewati SW lewat ?sw-check).
function _checkRemoteVersion() {
    try {
        fetch('./src/config/app.config.js?sw-check=' + Date.now(), { cache: 'no-store' })
            .then(function (r) { return r.ok ? r.text() : ''; })
            .then(function (txt) {
                var m = /version:\s*['"]([^'"]+)['"]/.exec(txt || '');
                if (m && m[1] !== APP_CONFIG.version) _notify();
            })
            .catch(function () { });
    } catch (e) { /* abaikan */ }
}

function _precacheLoaded(reg) {
    try {
        var worker = reg.active;
        if (!worker || !window.performance || !performance.getEntriesByType) return;
        var urls = performance.getEntriesByType('resource').map(function (r) { return r.name; });
        urls.push(location.origin + location.pathname.replace(/[^/]*$/, ''));
        worker.postMessage({ type: 'CACHE_URLS', urls: urls });
    } catch (e) { /* abaikan */ }
}

export function registerServiceWorker() {
    try {
        if (!('serviceWorker' in navigator)) return;
        if (!/^https?:$/.test(location.protocol)) return;
        if (/[?&]nosw=1/.test(location.search)) {
            navigator.serviceWorker.getRegistrations().then(function (list) {
                list.forEach(function (r) { r.unregister(); });
            }).catch(function () { });
            return;
        }
        var start = function () {
            navigator.serviceWorker.register('./sw.js?v=' + encodeURIComponent(APP_CONFIG.version), { scope: './' })
                .then(function (reg) {
                    _reg = reg;
                    if (reg.waiting && navigator.serviceWorker.controller) _notify();
                    reg.addEventListener('updatefound', function () {
                        var w = reg.installing;
                        if (!w) return;
                        w.addEventListener('statechange', function () {
                            if (w.state === 'installed' && navigator.serviceWorker.controller) _notify();
                        });
                    });
                    return navigator.serviceWorker.ready.then(function (r) { _precacheLoaded(r); });
                })
                .then(_checkRemoteVersion)
                .catch(function () { /* gagal daftar: game tetap jalan */ });
        };
        if (typeof requestIdleCallback === 'function') requestIdleCallback(start, { timeout: 4000 });
        else setTimeout(start, 1500);
    } catch (e) { /* abaikan */ }
}
