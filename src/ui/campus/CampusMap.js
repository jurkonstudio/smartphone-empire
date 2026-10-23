// FILE: src/ui/campus/CampusMap.js  (REPLACE — v2027.64: ikut membuang Peta Manufaktur)
// v2027.64 — unmountCampusMap() juga membuang Peta Manufaktur 3D. main.js memanggil unmountCampusMap() tiap renderView,
//   sehingga scene manufaktur tidak tertinggal saat pindah tab (satu konteks WebGL aktif pada satu waktu).
// v2027.63 — bila pemain sedang "di dalam kantor" (zoom masuk dari gedung HQ), render ulang Home memasang
// Office 3D di kotak yang sama, bukan peta kampus. Selain itu perilaku TIDAK berubah.
// v2027.44 — + dengarkan lang:changed supaya kartu info ganti bahasa.
// Mount/unmount peta kampus 3D. Three.js dimuat lazy dari CDN (versi dipin).
import { createCampusScene } from './CampusScene.js';
import { renderCampusFallback } from './CampusFallback.js';
import { bus } from '../../core/EventBus.js';
import { unmountManufactureMap } from '../manufacture/ManufactureMap.js';
import { isOfficeMode, isManufactureMode, resumeOffice, resumeManufacture, registerCampusHooks } from './CampusOfficeBridge.js';

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

export async function mountCampusMap(containerEl, gameState) {
    unmountCampusMap();
    // Sedang di dalam kantor (mis. Home dirender ulang): lanjutkan Office 3D, jangan buat peta kampus.
    if (isManufactureMode()) { resumeManufacture(containerEl); return; }
    if (isOfficeMode()) { resumeOffice(containerEl, gameState); return; }
    var token = ++_token;
    try {
        var THREE = await loadThree();
        // Batal kalau sudah pindah tab / container sudah dibuang saat menunggu.
        if (token !== _token || !containerEl.isConnected) return;
        var scene = createCampusScene(THREE, containerEl, gameState);
        // Data terkini: state bisa diganti (hydrate/reset), jadi baca ulang saat dibutuhkan.
        function currentData() {
            var g = window.__game;
            return (g && g.state && g.state.get()) || gameState;
        }
        var unsubs = [
            bus.on('theme:changed', function () { scene.refreshTheme(); }),
            bus.on('lang:changed', function () { scene.refreshLang(); }),
            bus.on('state:changed', function (data) { scene.update(data); }),
            // Pergantian tahun bisa mengganti era desain walau state:changed tidak terpicu.
            bus.on('time:year-changed', function () { scene.update(currentData()); })
        ];
        _active = { scene: scene, unsubs: unsubs };
    } catch (err) {
        console.warn('[CampusMap] gagal, pakai fallback:', err);
        if (token === _token && containerEl.isConnected) containerEl.innerHTML = renderCampusFallback();
    }
}

export function unmountCampusMap() {
    _token++; // batalkan mount yang masih menunggu
    unmountManufactureMap();
    if (!_active) return;
    _active.unsubs.forEach(function (u) { if (typeof u === 'function') u(); });
    _active.scene.dispose();
    _active = null;
}

// Dipanggil manual kalau perlu memaksa sinkron dengan state game.
export function updateCampus(data) {
    if (_active) _active.scene.update(data);
}

// Daftarkan pasangan mount/unmount ke jembatan (dipanggil saat pemain keluar dari kantor kembali ke kampus).
registerCampusHooks({ mount: mountCampusMap, unmount: unmountCampusMap });
