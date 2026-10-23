// FILE: src/ui/manufacture/ManufactureMap.js  (BARU — Peta Manufaktur 3D)
// Mount/unmount Peta Manufaktur di kotak #campus-map pada Home (sakelar Kampus | Manufaktur).
// Three.js dimuat lazy dari CDN dengan URL yang SAMA dengan Peta Kampus & Kantor, jadi tidak diunduh dua kali.
// Hanya satu scene WebGL aktif pada satu waktu (dijaga CampusOfficeBridge + CampusMap.unmountCampusMap).
import { createManufactureScene } from './ManufactureScene.js';
import { FX_EVENTS, ms } from './ManufactureLogic.js';
import { bus } from '../../core/EventBus.js';

var THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
var _threePromise = null;
var _active = null;
var _token = 0;

function loadThree() {
    if (!_threePromise) {
        _threePromise = import(THREE_URL).catch(function (e) { _threePromise = null; throw e; });
    }
    return _threePromise;
}

export function renderManufactureLoading() {
    return '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
        'font-size:13px;font-weight:600;letter-spacing:.02em;color:var(--text-tertiary);">' + ms('loading') + '</div>';
}

export function renderManufactureFallback() {
    return '<div style="text-align:center;padding:60px 20px;background:radial-gradient(ellipse at 50% 20%,rgba(148,163,184,.16),transparent 70%);border-radius:18px;">' +
        '<div style="font-size:56px;line-height:1;margin-bottom:14px;">🏭</div>' +
        '<div style="font-size:16px;font-weight:700;margin-bottom:8px;">' + ms('fbTitle') + '</div>' +
        '<div style="font-size:12.5px;color:var(--text-tertiary);line-height:1.6;max-width:300px;margin:0 auto;">' + ms('fbBody') + '</div></div>';
}

export function isManufactureMounted() { return !!_active; }

// Pilih pabrik dari luar (mis. dari peringatan). Bila peta belum tampil, ditunda sampai siap.
var _pendingSelect = null;
export function selectManufacturePlot(id) {
    if (_active) return _active.scene.select(id);
    _pendingSelect = id;
    return false;
}

export async function mountManufactureMap(containerEl, gameState) {
    unmountManufactureMap();
    var token = ++_token;
    try {
        var THREE = await loadThree();
        // Batal kalau sudah pindah tab / container sudah dibuang saat menunggu.
        if (token !== _token || !containerEl.isConnected) return;
        var scene = createManufactureScene(THREE, containerEl, gameState);
        if (_pendingSelect) { var ps = _pendingSelect; _pendingSelect = null; scene.select(ps); }
        function currentData() {
            var g = window.__game;
            return (g && g.state && g.state.get()) || gameState;
        }
        // Wadah dibuang (Home dirender ulang / pindah tab): scene ikut dibuang agar konteks WebGL tidak bocor.
        function alive() {
            if (!_active || _active.scene !== scene) return false;
            if (!containerEl.isConnected) { unmountManufactureMap(); return false; }
            return true;
        }
        // state:changed bisa sangat sering — gabungkan jadi satu update per frame.
        var queued = 0;
        function queue() {
            if (queued) return;
            queued = requestAnimationFrame(function () {
                queued = 0;
                if (alive()) scene.update(currentData());
            });
        }
        var lastFx = {};
        var fxUnsubs = Object.keys(FX_EVENTS).map(function (evName) {
            return bus.on(evName, function (payload) {
                if (!alive()) return;
                var spec = FX_EVENTS[evName](payload || {});
                if (!spec) return;
                var k = evName + ':' + spec.plot, now = Date.now();
                if (lastFx[k] && now - lastFx[k] < 1500) return;
                lastFx[k] = now;
                scene.update(currentData());
                scene.celebrate(spec.plot, spec.kind, ms(spec.key));
            });
        });
        var unsubs = [
            bus.on('theme:changed', function () { if (alive()) scene.refreshTheme(); }),
            bus.on('lang:changed', function () { if (alive()) scene.relabel(); }),
            bus.on('state:changed', queue),
            bus.on('time:year-changed', queue),
            bus.on('time:day-changed', queue),
            bus.on('economy:month-processed', queue),
            bus.on('fab:progress', queue),
            bus.on('fab:build-started', queue),
            bus.on('fab:upgrade-started', queue),
            bus.on('fab:built', queue),
            bus.on('fab:upgraded', queue),
            bus.on('fab:production-progress', queue),
            bus.on('plant:progress', queue),
            bus.on('plant:build-started', queue),
            bus.on('plant:upgrade-started', queue),
            bus.on('plant:built', queue),
            bus.on('plant:upgraded', queue),
            bus.on('plant:production-started', queue),
            bus.on('plant:production-progress', queue),
            bus.on('plant:external-sale', queue),
            bus.on('plant:idle', queue),
            function () { if (queued) { cancelAnimationFrame(queued); queued = 0; } }
        ].concat(fxUnsubs);
        _active = { scene: scene, unsubs: unsubs };
    } catch (err) {
        console.warn('[ManufactureMap] gagal, pakai fallback:', err);
        if (token === _token && containerEl.isConnected) containerEl.innerHTML = renderManufactureFallback();
    }
}

export function unmountManufactureMap() {
    _token++; // batalkan mount yang masih menunggu
    if (!_active) return;
    var a = _active;
    _active = null;
    a.unsubs.forEach(function (u) { if (typeof u === 'function') u(); });
    a.scene.dispose();
}

export function updateManufacture(data) {
    if (_active) _active.scene.update(data);
}
