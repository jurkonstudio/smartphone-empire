// FILE: src/ui/server/ServerMap.js  (BARU — v2027.73: Peta Server 3D bawah laut)
// Mount/unmount Peta Server di kotak #campus-map pada Home. Pola sama dengan ManufactureMap.js:
// Three.js dimuat lazy dari CDN dengan URL yang SAMA (tidak diunduh dua kali), hanya satu scene WebGL aktif
// (dijaga CampusOfficeBridge + CampusMap.unmountCampusMap + ManufactureMap/OfficeMap).
import { createServerScene } from './ServerScene.js';
import { bus } from '../../core/EventBus.js';
import { LanguageService } from '../../core/LanguageService.js';

var THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
var _threePromise = null;
var _active = null;
var _token = 0;

// Teks khusus peta Server (sementara; kunci resmi akan masuk ke server.i18n.js di Sesi 3).
var TX = {
    id: {
        loading: 'Memuat peta server…', title: 'Pusat Data Bawah Laut', subtitle: 'Kedalaman 180 m · 2 pod tekanan',
        pods: ['Pod A', 'Pod B'], aria: 'Peta 3D pusat data bawah laut',
        fbTitle: 'Peta server belum bisa ditampilkan',
        fbBody: 'Perangkat ini tidak bisa menampilkan 3D atau modul Three.js gagal dimuat. Data permainan tetap aman; coba lagi nanti.',
        chipOpen: 'Server', chipBack: 'Kampus'
    },
    en: {
        loading: 'Loading server map…', title: 'Undersea Data Center', subtitle: 'Depth 180 m · 2 pressure pods',
        pods: ['Pod A', 'Pod B'], aria: '3D map of the undersea data center',
        fbTitle: 'Server map cannot be shown',
        fbBody: 'This device cannot render 3D or the Three.js module failed to load. Your game data is safe; try again later.',
        chipOpen: 'Server', chipBack: 'Campus'
    }
};

function dict() {
    var l = 'id';
    try { l = LanguageService.getLang(); } catch (e) {}
    return l === 'id' ? TX.id : TX.en;
}

function loadThree() {
    if (!_threePromise) {
        _threePromise = import(THREE_URL).catch(function (e) { _threePromise = null; throw e; });
    }
    return _threePromise;
}

// Label tombol di sakelar Home (dipakai HomePanel.js).
export function serverChipLabels() {
    var d = dict();
    return { open: d.chipOpen, back: d.chipBack };
}

export function renderServerLoading() {
    return '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
        'font-size:13px;font-weight:600;letter-spacing:.02em;color:var(--text-tertiary);">' + dict().loading + '</div>';
}

export function renderServerFallback() {
    var d = dict();
    return '<div style="text-align:center;padding:60px 20px;background:radial-gradient(ellipse at 50% 20%,rgba(14,116,144,.35),transparent 70%);border-radius:18px;">' +
        '<div style="font-size:56px;line-height:1;margin-bottom:14px;">🌊</div>' +
        '<div style="font-size:16px;font-weight:700;margin-bottom:8px;">' + d.fbTitle + '</div>' +
        '<div style="font-size:12.5px;color:var(--text-tertiary);line-height:1.6;max-width:300px;margin:0 auto;">' + d.fbBody + '</div></div>';
}

export function isServerMounted() { return !!_active; }

export async function mountServerMap(containerEl, gameState) {
    unmountServerMap();
    var token = ++_token;
    try {
        var THREE = await loadThree();
        // Batal kalau sudah pindah tab / container sudah dibuang saat menunggu.
        if (token !== _token || !containerEl.isConnected) return;
        var d = dict();
        var scene = createServerScene(THREE, containerEl, {
            title: d.title, subtitle: d.subtitle, podNames: d.pods, aria: d.aria
        });
        function currentData() {
            var g = window.__game;
            return (g && g.state && g.state.get()) || gameState;
        }
        // Wadah dibuang (Home dirender ulang / pindah tab): scene ikut dibuang agar konteks WebGL tidak bocor.
        function alive() {
            if (!_active || _active.scene !== scene) return false;
            if (!containerEl.isConnected) { unmountServerMap(); return false; }
            return true;
        }
        var queued = 0;
        function queue() {
            if (queued) return;
            queued = requestAnimationFrame(function () {
                queued = 0;
                if (alive()) scene.update(currentData());
            });
        }
        var unsubs = [
            bus.on('state:changed', queue),
            bus.on('time:day-changed', queue),
            bus.on('economy:month-processed', queue),
            function () { if (queued) { cancelAnimationFrame(queued); queued = 0; } }
        ];
        scene.update(currentData());
        _active = { scene: scene, unsubs: unsubs };
    } catch (err) {
        console.warn('[ServerMap] gagal, pakai fallback:', err);
        if (token === _token && containerEl.isConnected) containerEl.innerHTML = renderServerFallback();
    }
}

export function unmountServerMap() {
    _token++; // batalkan mount yang masih menunggu
    if (!_active) return;
    var a = _active;
    _active = null;
    a.unsubs.forEach(function (u) { if (typeof u === 'function') u(); });
    a.scene.dispose();
}
