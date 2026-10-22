// FILE: src/ui/office/OfficeMap.js  (REPLACE — v2027.53a: event game -> efek 3D di ruangan)
// Mount/unmount Office 3D Map (tab HQ → Kantor). Three.js dimuat lazy dari CDN (versi dipin,
// sama dengan peta kampus, jadi modul di-cache browser & tidak diunduh dua kali).
import { createOfficeScene } from './OfficeScene.js';
import { bus } from '../../core/EventBus.js';
import { t } from '../../core/LanguageService.js';
import { FX_EVENTS, createThrottle } from './OfficeFx.js';

var THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
var _threePromise = null;
var _active = null;
var _token = 0;
var _pendingFocus = null;   // staf yang diminta difokuskan sebelum scene siap

function loadThree() {
    if (!_threePromise) {
        _threePromise = import(THREE_URL).catch(function (e) { _threePromise = null; throw e; });
    }
    return _threePromise;
}

export function renderOfficeLoading() {
    return '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
        'font-size:13px;font-weight:600;letter-spacing:.02em;color:var(--text-tertiary);">' + t('office.loading') + '</div>';
}

export function renderOfficeFallback() {
    return '<div style="text-align:center;padding:60px 20px;background:radial-gradient(ellipse at 50% 20%,rgba(148,163,184,.16),transparent 70%);border-radius:18px;">' +
        '<div style="font-size:56px;line-height:1;margin-bottom:14px;">🏢</div>' +
        '<div style="font-size:16px;font-weight:700;margin-bottom:8px;">' + t('office.fallback.title') + '</div>' +
        '<div style="font-size:12.5px;color:var(--text-tertiary);line-height:1.6;max-width:300px;margin:0 auto;">' +
            t('office.fallback.body') + '</div></div>';
}

export function isOfficeMounted() { return !!_active; }

// Fokuskan kamera & kartu ke satu staf (dipanggil dari panel Team). Jika peta belum tampil, ditunda.
export function focusOfficeStaff(staffId) {
    if (!staffId) return false;
    if (_active) return _active.scene.selectStaff(staffId);
    _pendingFocus = staffId;
    return false;
}

export async function mountOfficeMap(containerEl, gameState) {
    unmountOfficeMap();
    var token = ++_token;
    try {
        var THREE = await loadThree();
        // Batal kalau sudah pindah tab / container sudah dibuang saat menunggu.
        if (token !== _token || !containerEl.isConnected) return;
        var scene = createOfficeScene(THREE, containerEl, gameState);
        if (_pendingFocus) { var pf = _pendingFocus; _pendingFocus = null; scene.selectStaff(pf); }
        function currentData() {
            var g = window.__game;
            return (g && g.state && g.state.get()) || gameState;
        }
        // state:changed bisa sangat sering — gabungkan jadi satu update per frame.
        var queued = 0;
        function queue() {
            if (queued) return;
            queued = requestAnimationFrame(function () {
                queued = 0;
                if (_active && _active.scene === scene) scene.update(currentData());
            });
        }
        // event game -> efek di ruangan terkait (riset selesai, produk rilis, OS dirilis, Fab berdiri, ...).
        // Hanya berjalan selama peta ini aktif; jeda per event dijaga oleh throttle.
        var fxGate = createThrottle();
        var fxUnsubs = Object.keys(FX_EVENTS).map(function (evName) {
            return bus.on(evName, function (payload) {
                if (!_active || _active.scene !== scene) return;
                var spec = FX_EVENTS[evName](payload || {});
                if (!spec) return;
                if (!fxGate(evName + ':' + spec.room, Date.now(), spec.gap)) return;
                scene.celebrate(spec.room, spec.kind, spec.key ? t(spec.key, spec.params) : '');
            });
        });
        // jam dinding mengikuti waktu game; 'time:tick' sering -> dibatasi ~2x/detik
        var lastClock = 0;
        var unsubs = [
            bus.on('theme:changed', function () { scene.refreshTheme(); }),
            bus.on('lang:changed', function () { scene.relabel(); }),
            bus.on('time:tick', function () {
                var nowMs = Date.now();
                if (nowMs - lastClock < 500) return;
                lastClock = nowMs;
                if (_active && _active.scene === scene) scene.updateClock(currentData());
            }),
            bus.on('state:changed', queue),
            bus.on('team:changed', queue),
            bus.on('team:recruited', queue),
            bus.on('team:fired', queue),
            bus.on('time:year-changed', queue),
            bus.on('economy:month-processed', queue),
            bus.on('bank:changed', queue),
            bus.on('stocks:updated', queue),
            // tahap 3: progres konstruksi Fab & aksi dari peta harus langsung tampak di kartu / adegan
            bus.on('fab:progress', queue),
            bus.on('fab:build-started', queue),
            bus.on('fab:upgrade-started', queue),
            bus.on('fab:built', queue),
            bus.on('fab:upgraded', queue),
            bus.on('fab:production-progress', queue),
            bus.on('time:day-changed', queue),
            function () { if (queued) { cancelAnimationFrame(queued); queued = 0; } }
        ].concat(fxUnsubs);
        _active = { scene: scene, unsubs: unsubs };
    } catch (err) {
        console.warn('[OfficeMap] gagal, pakai fallback:', err);
        if (token === _token && containerEl.isConnected) containerEl.innerHTML = renderOfficeFallback();
    }
}

export function unmountOfficeMap() {
    _token++; // batalkan mount yang masih menunggu
    if (!_active) return;
    _active.unsubs.forEach(function (u) { if (typeof u === 'function') u(); });
    _active.scene.dispose();
    _active = null;
}

export function updateOffice(data) {
    if (_active) _active.scene.update(data);
}
