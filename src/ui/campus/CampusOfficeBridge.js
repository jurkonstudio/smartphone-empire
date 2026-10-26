// FILE: src/ui/campus/CampusOfficeBridge.js  (REPLACE — v2027.67: tab Manufaktur memuat Peta Manufaktur 3D)
// v2027.73 — Peta Server 3D (dasar laut, src/ui/server/*) dibuka lewat tombol "Server" di samping sakelar.
//   Sakelar Home tetap DUA tab (Kampus | Manufaktur); Server bukan tab baru. Aturan satu WebGL tetap.
// v2027.67 — tab Manufaktur di Home kini menampilkan Peta Manufaktur 3D (src/ui/manufacture/*), menggantikan placeholder
//   "Segera hadir". Aturan tetap: hanya satu scene WebGL aktif; pindah Kampus/Kantor/Manufaktur membuang scene sebelumnya.
// v2027.66 — sakelar Home kini "Kampus | Manufaktur" (Manufaktur = placeholder, belum ada isinya). Tab "Kantor" dihapus:
//   Office 3D hanya dibuka lewat gedung HQ di peta kampus (tombol "Masuk Kantor"), dan tab Kampus tetap aktif
//   selama di dalam kantor; ketuk "Kampus" untuk kembali ke peta kampus.
// v2027.65 — Home punya sakelar "Kampus | Kantor" tepat di atas peta (markup dari HomePanel.js, gaya & logika di sini).
//   Satu bagian Home, dua tampilan: ketuk sakelar atau gedung HQ untuk berpindah. Tombol "← Kampus" di dalam peta dihapus.
// Jembatan Kampus <-> Kantor: ketuk gedung HQ di peta kampus -> "Masuk Kantor" -> peta kampus memudar,
// Office 3D tampil di kotak yang SAMA (#campus-map di Home); tombol "← Kampus" membawa kembali.
//
// Prinsip:
//  - Dua scene tetap terpisah (OfficeScene.js & CampusScene.js tidak diubah, tidak digabung).
//  - Hanya SATU scene WebGL aktif pada satu waktu (hemat memori / aman untuk HP low-chipset).
//  - Tidak butuh perubahan main.js: CampusMap.mountCampusMap() memanggil isOfficeMode()/resumeOffice()
//    sehingga render ulang Home tetap berada di kantor. Pindah ke tab lain mengembalikan mode ke kampus.
//  - Tab HQ > Kantor tetap berfungsi seperti biasa.
import { mountOfficeMap, unmountOfficeMap, isOfficeMounted, renderOfficeLoading } from '../office/OfficeMap.js';
import { mountManufactureMap, unmountManufactureMap, renderManufactureLoading } from '../manufacture/ManufactureMap.js';
import { mountServerMap, unmountServerMap, renderServerLoading } from '../server/ServerMap.js';
import { renderCampusLoading } from './CampusFallback.js';
import { bus } from '../../core/EventBus.js';

var STYLE_ID = 'campus-office-bridge-style';
var FADE_MS = 240;
var CSS = [
    '.cof-fade{opacity:0;transition:opacity .22s ease;}',
    '.cof-fade canvas{transform:scale(1.14);transition:transform .26s ease;}',
    '.cof-in{animation:cofIn .3s ease both;}',
    '@keyframes cofIn{from{opacity:0;transform:scale(.97);}to{opacity:1;transform:none;}}',
    '@media (prefers-reduced-motion:reduce){.cof-fade,.cof-fade canvas,.cof-in{transition:none;animation:none;}}',
    'html[data-perf="lite"] .cof-fade,html[data-perf="lite"] .cof-fade canvas,html[data-perf="lite"] .cof-in{transition:none;animation:none;}',
    /* sakelar Kampus | Kantor */
    '.home-switch{flex:0 0 auto;display:flex;gap:4px;padding:3px;background:var(--bg-2);border:1px solid var(--border);border-radius:14px;}',
    '.home-switch-btn{flex:1 1 0;min-width:0;min-height:36px;display:inline-flex;align-items:center;justify-content:center;gap:7px;',
    'border:0;border-radius:11px;background:transparent;color:var(--text-tertiary);font:inherit;font-size:12.5px;font-weight:700;',
    'cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .18s ease,color .18s ease,transform .12s ease;}',
    '.home-switch-btn svg{flex:0 0 auto;width:17px;height:17px;display:block;}',
    '.home-switch-btn.active{background:var(--accent-soft);color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent-soft);}',
    '.home-switch-btn:active{transform:scale(.96);}',
    '.home-switch-btn:focus-visible{outline:2px solid var(--accent);outline-offset:1px;}',
    /* baris sakelar (Home) */
    '.home-topbar{display:flex;gap:8px;align-items:stretch;}',
    '.home-topbar .home-switch{flex:1 1 auto;min-width:0;}'
].join('');

var _inOffice = false;      // true = Home menampilkan Office (dibuka dari gedung HQ), bukan peta kampus
var _inManu = false;        // true = Home menampilkan placeholder Manufaktur
var _inServer = false;      // true = Home menampilkan Peta Server 3D (dasar laut)
var _tok = 0;               // membatalkan transisi yang tertunda
var _hooks = null;          // { mount, unmount } milik CampusMap.js
var _timers = [];

function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
}

function later(fn, ms) {
    var id = setTimeout(function () {
        var i = _timers.indexOf(id);
        if (i >= 0) _timers.splice(i, 1);
        fn();
    }, ms);
    _timers.push(id);
}
function clearTimers() { _timers.forEach(clearTimeout); _timers = []; }

function noMotion() {
    try {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
        if (document.documentElement.getAttribute('data-perf') === 'lite') return true;
    } catch (e) {}
    return false;
}

function gameData() {
    var g = window.__game;
    return (g && g.state && g.state.get()) || {};
}

function fadeOut(el, done) {
    if (noMotion()) { done(); return; }
    el.classList.add('cof-fade');
    later(done, FADE_MS);
}
function fadeIn(el) {
    el.classList.remove('cof-fade');
    if (noMotion()) return;
    el.classList.add('cof-in');
    later(function () { el.classList.remove('cof-in'); }, 360);
}

// Sinkronkan status aktif sakelar Kampus | Manufaktur di Home dengan mode saat ini.
// Office adalah bagian dari Kampus, jadi tab Kampus tetap aktif selama di dalam kantor.
// Saat Peta Server tampil, tidak ada tab yang aktif (Server dibuka lewat tombol tersendiri).
function syncSwitch() {
    var btns = document.querySelectorAll('.home-switch-btn');
    for (var i = 0; i < btns.length; i++) {
        var isManuBtn = btns[i].getAttribute('data-home-switch') === 'manufacture';
        var on = isManuBtn ? _inManu : (!_inManu && !_inServer);
        btns[i].classList.toggle('active', on);
        btns[i].setAttribute('aria-selected', on ? 'true' : 'false');
    }
}

async function mountServerInto(el, data) {
    el.classList.add('office-map', 'srv-map');  // menonaktifkan vinyet kampus (seperti Manufaktur)
    el.innerHTML = renderServerLoading();
    await mountServerMap(el, data);
}

async function mountManufactureInto(el, data) {
    el.classList.add('office-map', 'manu-map');   // menonaktifkan vinyet kampus
    el.innerHTML = renderManufactureLoading();
    await mountManufactureMap(el, data);
}

async function mountOfficeInto(el, data) {
    var tok = _tok;
    el.classList.add('office-map');             // menonaktifkan vinyet kampus (.home-map:not(.office-map)::after)
    el.innerHTML = renderOfficeLoading();
    await mountOfficeMap(el, data);
}

// ---------------- API publik ----------------

export function registerCampusHooks(h) { _hooks = h; }

export function isOfficeMode() { return _inOffice; }
export function isManufactureMode() { return _inManu; }
export function isServerMode() { return _inServer; }

// CSS sakelar dipasang sekali; HomePanel memanggilnya sebelum menggambar markup sakelar.
export function ensureBridgeStyle() { ensureStyle(); }

// Dipakai CampusMap saat Home dirender ulang sementara pemain masih di dalam kantor.
export function resumeOffice(containerEl, gameState) {
    ensureStyle();
    mountOfficeInto(containerEl, gameState || gameData());
}

export function enterOffice(containerEl) {
    if (!containerEl || _inOffice || !_hooks) return;
    ensureStyle();
    _inManu = false;                          // keluar dari Manufaktur bila sedang di sana
    _inServer = false;                        // keluar dari Server bila sedang di sana
    containerEl.classList.remove('manu-map', 'srv-map');
    _inOffice = true;
    syncSwitch();
    var tok = ++_tok;
    clearTimers();
    fadeOut(containerEl, function () {
        if (tok !== _tok || !containerEl.isConnected) return;
        _hooks.unmount();                         // buang scene kampus (WebGL context dilepas)
        unmountManufactureMap();                  // dan scene manufaktur bila sebelumnya di sana
        unmountServerMap();                       // dan scene server bila sebelumnya di sana
        fadeIn(containerEl);
        mountOfficeInto(containerEl, gameData());
    });
}

export function exitOffice(containerEl) {
    if (!_inOffice) return;
    ensureStyle();
    _inOffice = false;
    syncSwitch();
    var tok = ++_tok;
    clearTimers();
    fadeOut(containerEl, function () {
        if (tok !== _tok || !containerEl.isConnected) return;
        unmountOfficeMap();                       // buang scene office
        containerEl.classList.remove('office-map');
        containerEl.innerHTML = renderCampusLoading();
        fadeIn(containerEl);
        if (_hooks) _hooks.mount(containerEl, gameData());
    });
}

// Dipakai CampusMap saat Home dirender ulang sementara pemain masih di tab Manufaktur.
export function resumeManufacture(containerEl) {
    ensureStyle();
    mountManufactureInto(containerEl, gameData());
}

export function enterManufacture(containerEl) {
    if (!containerEl || _inManu || !_hooks) return;
    ensureStyle();
    var fromOffice = _inOffice;
    _inOffice = false;
    _inServer = false;                        // dari Server: tutup Server lalu buka Manufaktur
    _inManu = true;
    syncSwitch();
    var tok = ++_tok;
    clearTimers();
    fadeOut(containerEl, function () {
        if (tok !== _tok || !containerEl.isConnected) return;
        _hooks.unmount();                         // buang scene kampus
        if (fromOffice) unmountOfficeMap();       // buang scene office bila dibuka dari dalam kantor
        unmountServerMap();                       // buang scene server bila sebelumnya di sana
        containerEl.classList.remove('srv-map');
        fadeIn(containerEl);
        mountManufactureInto(containerEl, gameData());
    });
}

// Dipakai CampusMap saat Home dirender ulang sementara pemain masih di Peta Server.
export function resumeServer(containerEl) {
    ensureStyle();
    mountServerInto(containerEl, gameData());
}

// Tombol "Server" di samping sakelar: buka peta dasar laut (bukan tab; sakelar tetap dua).
export function enterServer(containerEl) {
    if (!containerEl || _inServer || !_hooks) return;
    ensureStyle();
    var fromOffice = _inOffice;
    _inOffice = false;
    _inManu = false;
    _inServer = true;
    syncSwitch();
    var tok = ++_tok;
    clearTimers();
    fadeOut(containerEl, function () {
        if (tok !== _tok || !containerEl.isConnected) return;
        _hooks.unmount();                         // buang scene kampus
        if (fromOffice) unmountOfficeMap();
        unmountManufactureMap();
        fadeIn(containerEl);
        mountServerInto(containerEl, gameData());
    });
}

export function exitServer(containerEl) {
    if (!_inServer) return;
    ensureStyle();
    _inServer = false;
    syncSwitch();
    var tok = ++_tok;
    clearTimers();
    fadeOut(containerEl, function () {
        if (tok !== _tok || !containerEl.isConnected) return;
        unmountServerMap();                       // buang scene server (WebGL context dilepas)
        containerEl.classList.remove('office-map', 'manu-map', 'srv-map');
        containerEl.innerHTML = renderCampusLoading();
        fadeIn(containerEl);
        if (_hooks) _hooks.mount(containerEl, gameData());
    });
}

export function exitManufacture(containerEl) {
    if (!_inManu) return;
    ensureStyle();
    _inManu = false;
    syncSwitch();
    var tok = ++_tok;
    clearTimers();
    fadeOut(containerEl, function () {
        if (tok !== _tok || !containerEl.isConnected) return;
        unmountManufactureMap();                  // buang scene manufaktur (WebGL context dilepas)
        containerEl.classList.remove('office-map', 'manu-map');
        containerEl.innerHTML = renderCampusLoading();
        fadeIn(containerEl);
        if (_hooks) _hooks.mount(containerEl, gameData());
    });
}

// ---------------- pengait global (dipasang sekali saat modul dimuat) ----------------
if (typeof document !== 'undefined') {
    // Tombol "Masuk Kantor" pada kartu info gedung HQ.
    document.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest && e.target.closest('[data-campus-office]');
        if (!btn) return;
        var box = btn.closest('#campus-map');
        if (!box) return;
        e.preventDefault();
        enterOffice(box);
    });
    // Sakelar Kampus | Manufaktur di atas peta Home.
    // Tab Kampus: dari Manufaktur kembali ke kampus; dari dalam kantor keluar ke peta kampus; dari Server kembali ke kampus.
    document.addEventListener('click', function (e) {
        var sw = e.target && e.target.closest && e.target.closest('.home-switch-btn');
        if (!sw) return;
        var box = document.getElementById('campus-map');
        if (!box) return;
        e.preventDefault();
        if (sw.getAttribute('data-home-switch') === 'manufacture') { enterManufacture(box); return; }
        if (_inManu) exitManufacture(box);
        else if (_inServer) exitServer(box);
        else if (_inOffice) exitOffice(box);
    });
    // Ruang Server di Office 3D: ketuk ruangan -> "Masuk Server" membuka Peta Server (tanpa tombol di Home).
    bus.on('office:enter', function (p) {
        if (!p || p.to !== 'server') return;
        var box = document.getElementById('campus-map');
        if (box) enterServer(box);
    });
    // Pindah ke tab lain => kembali ke mode kampus (kantor ditutup oleh renderView di main.js).
    bus.on('view:changed', function (p) {
        if (p && p.id !== 'dashboard' && (_inOffice || _inManu || _inServer)) { _inOffice = false; _inManu = false; _inServer = false; _tok++; clearTimers(); syncSwitch(); }
    });
}

export { isOfficeMounted };
