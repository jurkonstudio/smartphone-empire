// FILE: src/ui/campus/CampusOfficeBridge.js  (BARU — v2027.63)
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
import { renderCampusLoading } from './CampusFallback.js';
import { getBridgeStrings } from './CampusInfo.js';
import { bus } from '../../core/EventBus.js';

var STYLE_ID = 'campus-office-bridge-style';
var FADE_MS = 240;
var CSS = [
    '.cof-fade{opacity:0;transition:opacity .22s ease;}',
    '.cof-fade canvas{transform:scale(1.14);transition:transform .26s ease;}',
    '.cof-in{animation:cofIn .3s ease both;}',
    '@keyframes cofIn{from{opacity:0;transform:scale(.97);}to{opacity:1;transform:none;}}',
    '.cof-back{position:absolute;left:8px;top:52px;z-index:5;display:inline-flex;align-items:center;gap:6px;',
    'min-height:34px;padding:0 12px 0 10px;border-radius:999px;cursor:pointer;font:inherit;font-size:12px;font-weight:700;',
    'color:var(--text-primary);background:var(--bg-2);border:1px solid var(--border-strong);',
    'box-shadow:0 2px 8px rgba(0,0,0,.18);-webkit-tap-highlight-color:transparent;}',
    '.cof-back:active{transform:scale(.96);}',
    '@media (prefers-reduced-motion:reduce){.cof-fade,.cof-fade canvas,.cof-in{transition:none;animation:none;}}',
    'html[data-perf="lite"] .cof-fade,html[data-perf="lite"] .cof-fade canvas,html[data-perf="lite"] .cof-in{transition:none;animation:none;}'
].join('');

var _inOffice = false;      // true = Home menampilkan Office, bukan peta kampus
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

function addBackButton(el) {
    if (!el || !el.isConnected || el.querySelector('.cof-back')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'cof-back';
    b.textContent = '← ' + getBridgeStrings().backCampus;
    b.setAttribute('aria-label', b.textContent);
    // sentuhan di tombol tidak boleh menggeser peta office di belakangnya
    b.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); exitOffice(el); });
    el.appendChild(b);
}

async function mountOfficeInto(el, data) {
    var tok = _tok;
    el.classList.add('office-map');             // menonaktifkan vinyet kampus (.home-map:not(.office-map)::after)
    el.innerHTML = renderOfficeLoading();
    await mountOfficeMap(el, data);
    if (tok !== _tok || !_inOffice || !el.isConnected) return;
    addBackButton(el);
}

// ---------------- API publik ----------------

export function registerCampusHooks(h) { _hooks = h; }

export function isOfficeMode() { return _inOffice; }

// Dipakai CampusMap saat Home dirender ulang sementara pemain masih di dalam kantor.
export function resumeOffice(containerEl, gameState) {
    ensureStyle();
    mountOfficeInto(containerEl, gameState || gameData());
}

export function enterOffice(containerEl) {
    if (!containerEl || _inOffice || !_hooks) return;
    ensureStyle();
    _inOffice = true;
    var tok = ++_tok;
    clearTimers();
    fadeOut(containerEl, function () {
        if (tok !== _tok || !containerEl.isConnected) return;
        _hooks.unmount();                         // buang scene kampus (WebGL context dilepas)
        fadeIn(containerEl);
        mountOfficeInto(containerEl, gameData());
    });
}

export function exitOffice(containerEl) {
    if (!_inOffice) return;
    ensureStyle();
    _inOffice = false;
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
    // Pindah ke tab lain => kembali ke mode kampus (kantor ditutup oleh renderView di main.js).
    bus.on('view:changed', function (p) {
        if (p && p.id !== 'dashboard' && _inOffice) { _inOffice = false; _tok++; clearTimers(); }
    });
}

export { isOfficeMounted };
