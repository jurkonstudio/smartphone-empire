// FILE: src/ui/phone/AccessoryMockup.js  (PATCH 0.2.10 — mockup aksesori; jam pintar ikut jam nyata)
// ============================================================
// AccessoryMockup — SVG mockup aksesori ekosistem: earbuds nirkabel, jam pintar, charger & daya.
// Tanpa aset gambar. Animasi memakai CSS (disuntikkan sekali lewat ensureAccessoryStyle, pola sama
// dengan RegionalStyle.js) dan hanya berjalan saat lini terbuka. Lini tertutup tampil statis, abu-abu.
//
// Jam pintar memakai SUMBER WAKTU yang sama dengan panel lain (jam perangkat, sama seperti layar
// ponsel dan status bar): createDayClock() dari DayCycle.js. Jadi ?hour= untuk uji ikut berlaku, dan
// layar jam ikut meredup pada malam hari sesuai siklus peta dan tema UI.
// Jarum diperbarui tiap detik lewat satu timer bersama, dan timer berhenti sendiri bila tidak ada jam
// yang terpasang di halaman. Dengan "kurangi gerakan" aktif, jarum tetap pada jam saat render.
//
// API tidak berubah, supaya kategori desain (DesignTracksPanel) tetap bekerja:
//   renderAccessoryMockup(lineId, tier, { size, open, closedLabel, caption, now })
//   renderAccessoryThumbnail(lineId, tier, size, open)
// opts.now (ms, opsional) hanya untuk uji; biasanya dibaca dari jam dunia nyata.
// Teks di dalam SVG hanya label "belum dibuka" dan dilewatkan lewat opts.closedLabel (sudah
// diterjemahkan pemanggil), jadi modul ini tidak punya teks UI sendiri.
// Angka dan status tetap diambil dari EcosystemSystem.getLinePreview(); modul ini hanya tampilan.
// ============================================================
import { createDayClock, nightAmount } from '../campus/DayCycle.js';

// Palet per tier. body = bodi utama, shade = sisi gelap, accent = aksen, hi = sorotan.
var TIER_PALETTE = {
    basic:   { body: '#e6e8ec', shade: '#bfc3cc', accent: '#8a909c', hi: '#ffffff', strap: '#6b7280', glass: '#1c2230', metal: false },
    mid:     { body: '#cdd3dc', shade: '#9aa3b2', accent: '#0a84ff', hi: '#f4f7fb', strap: '#2b3a55', glass: '#0d1524', metal: true },
    premium: { body: '#23262d', shade: '#0f1115', accent: '#d4af37', hi: '#5a5f6b', strap: '#171a20', glass: '#05070b', metal: true }
};
var CLOSED_PALETTE = { body: '#c7c9ce', shade: '#a3a6ad', accent: '#8d9099', hi: '#dcdee2', strap: '#9a9da4', glass: '#6e7178', metal: false };
var NIGHT_GLASS = '#02040a';

// Campur dua warna string '#rrggbb' (t 0..1). Helper pewarnaan DayCycle memakai angka, jadi tidak dipakai.
function _mixHex(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    var ai = parseInt(String(a).slice(1), 16), bi = parseInt(String(b).slice(1), 16);
    var out = [16, 8, 0].map(function (sh) {
        var x = (ai >> sh) & 255, y = (bi >> sh) & 255;
        return Math.round(x + (y - x) * t);
    });
    return '#' + out.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('');
}

var STYLE_ID = 'acc-mockup-style';
var CSS = [
    // indikator LED berkedip (earbuds kotak, charger)
    '.acc-led{animation:acc-led 1.8s ease-in-out infinite}',
    '@keyframes acc-led{0%,100%{opacity:.3}50%{opacity:1}}',
    // gelombang suara dari earbuds
    '.acc-wave{fill:none;stroke-linecap:round;transform-box:view-box;transform-origin:66px 58px;opacity:0;animation:acc-wave 2.2s ease-out infinite}',
    '.acc-wave.w2{animation-delay:.73s}.acc-wave.w3{animation-delay:1.46s}',
    '@keyframes acc-wave{0%{opacity:0;transform:scale(.7)}25%{opacity:.85}100%{opacity:0;transform:scale(1.3)}}',
    // aliran daya di kabel charger
    '.acc-flow{stroke-dasharray:3 9;animation:acc-flow 1.1s linear infinite}',
    '@keyframes acc-flow{to{stroke-dashoffset:-24}}',
    // kilat (premium)
    '.acc-bolt{transform-box:fill-box;transform-origin:center;animation:acc-bolt 1.2s ease-in-out infinite}',
    '@keyframes acc-bolt{0%,100%{opacity:.25;transform:scale(.92)}50%{opacity:1;transform:scale(1.06)}}',
    // cincin emas berkilau (premium)
    '.acc-ring{animation:acc-ring 2.4s ease-in-out infinite}',
    '@keyframes acc-ring{0%,100%{stroke-opacity:.35}50%{stroke-opacity:1}}',
    // halo di belakang produk
    '.acc-halo{transform-box:fill-box;transform-origin:center;animation:acc-halo 3.4s ease-in-out infinite}',
    '@keyframes acc-halo{0%,100%{opacity:.35;transform:scale(.96)}50%{opacity:.8;transform:scale(1.04)}}',
    // kilau menyapu bodi jam
    '.acc-shine{animation:acc-shine 3.6s ease-in-out infinite}',
    '@keyframes acc-shine{0%{transform:translateX(-46px);opacity:0}15%{opacity:.55}55%,100%{transform:translateX(46px);opacity:0}}',
    // jam melayang pelan
    '.acc-float{animation:acc-float 3.2s ease-in-out infinite}',
    '@keyframes acc-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}',
    // kurangi gerak: semua berhenti, tampilan tetap utuh
    '@media (prefers-reduced-motion:reduce){',
    '.acc-led,.acc-wave,.acc-flow,.acc-bolt,.acc-ring,.acc-halo,.acc-shine,.acc-float{animation:none}',
    '.acc-wave{opacity:0}',
    '}'
].join('');

// Sisipkan CSS sekali. Aman dipanggil berulang dan di lingkungan tanpa document.
export function ensureAccessoryStyle() {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
    var el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
}

function _esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function _pal(tier, open) {
    if (!open) return CLOSED_PALETTE;
    return TIER_PALETTE[tier] || TIER_PALETTE.mid;
}

// Atribut class hanya saat terbuka: lini tertutup tidak bergerak.
function _c(open, name, extra) {
    if (!open) return extra || '';
    return ' class="' + name + '"' + (extra || '');
}

// Gradien linear sederhana. ID deterministik: definisi identik, jadi duplikat di DOM tidak masalah.
function _grad(id, c1, c2) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>';
}

// ---------- JAM NYATA: sudut jarum dari waktu perangkat ----------
// Jarum jam ikut menit (bergerak halus), jarum menit ikut detik, jarum detik melompat per detik.
export function watchHandAngles(ms) {
    var d = new Date(ms);
    var s = d.getSeconds();
    var m = d.getMinutes();
    var h = d.getHours() % 12;
    return { hr: (h + m / 60) * 30, min: m * 6 + s * 0.1, sec: s * 6 };
}

var _clk = null;
function _clock() {
    if (!_clk) _clk = createDayClock();
    return _clk;
}
// Tingkat malam 0..1 untuk waktu ms tertentu, mengikuti aturan siklus peta (atau tema bila siklus mati).
function _nightAt(ms) {
    var clk = _clock();
    if (!clk.enabled) return _isDark() ? 1 : 0;
    var d = new Date(ms);
    return nightAmount(d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600);
}
function _isDark() {
    return typeof document !== 'undefined' && !!document.documentElement &&
        document.documentElement.getAttribute('data-theme') === 'dark';
}

// Satu timer bersama untuk semua jam yang terpasang. Berhenti sendiri bila tidak ada jam di halaman.
var _timer = null;
function _paintWatch(el, ms, night) {
    var a = watchHandAngles(ms);
    var hands = el.querySelectorAll('[data-hand]');
    for (var i = 0; i < hands.length; i++) {
        var key = hands[i].getAttribute('data-hand');
        hands[i].setAttribute('transform', 'rotate(' + a[key].toFixed(2) + ' 50 50)');
    }
    var glass = el.querySelector('[data-acc-glass]');
    if (glass) {
        glass.setAttribute('fill', _mixHex(glass.getAttribute('data-base'), NIGHT_GLASS, 0.55 * night));
    }
}
function _tick() {
    try {
        if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return;
        var ws = document.querySelectorAll('[data-acc-watch]');
        if (!ws.length) { _stop(); return; }
        var clk = _clock();
        var ms = clk.now();
        var night = _nightAt(ms);
        for (var i = 0; i < ws.length; i++) _paintWatch(ws[i], ms, night);
    } catch (e) { /* jam tidak boleh menggagalkan halaman */ }
}
function _start() {
    if (_timer !== null || typeof setInterval !== 'function') return;
    if (typeof window !== 'undefined' && window.matchMedia) {
        try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) { /* abaikan */ }
    }
    _timer = setInterval(_tick, 1000);
    if (_timer && typeof _timer === 'object' && _timer.unref) _timer.unref();
}
function _stop() {
    if (_timer !== null) { clearInterval(_timer); _timer = null; }
}

// ---------- EARBUDS: kotak pengisi + dua earbud + gelombang suara ----------
function _earbuds(p, g, tier, open) {
    var s = '';
    // halo premium/menengah di belakang kotak
    if (open && tier !== 'basic') {
        s += '<ellipse cx="50" cy="56" rx="44" ry="38" fill="' + p.accent + '" opacity=".14"' + _c(open, 'acc-halo') + '/>';
    }
    // kotak pengisi
    s += '<rect x="18" y="38" width="64" height="38" rx="14" fill="url(#' + g + ')"/>';
    s += '<path d="M18 56 H82" stroke="' + p.shade + '" stroke-width="1.2"/>';
    s += '<rect x="45" y="52" width="10" height="3" rx="1.5" fill="' + p.accent + '"' + _c(open, 'acc-led') + '/>';
    if (open && tier === 'premium') {
        s += '<rect x="18" y="38" width="64" height="38" rx="14" fill="none" stroke="' + p.accent + '" stroke-width="0.9"' + _c(open, 'acc-ring') + '/>';
    }
    if (open && tier === 'mid') {
        s += '<circle cx="50" cy="66" r="2.2" fill="none" stroke="' + p.accent + '" stroke-width="1"' + _c(open, 'acc-led') + '/>';
    }
    // gelombang suara dari earbud kanan
    if (open) {
        s += '<path class="acc-wave" d="M70 52 q6 8 0 16" stroke="' + p.accent + '" stroke-width="1.2"/>';
        s += '<path class="acc-wave w2" d="M74 49 q9 11 0 22" stroke="' + p.accent + '" stroke-width="1.1"/>';
        s += '<path class="acc-wave w3" d="M78 46 q12 14 0 28" stroke="' + p.accent + '" stroke-width="1"/>';
    }
    // dua earbud di depan
    var xs = [[34, -1], [66, 1]];
    for (var i = 0; i < xs.length; i++) {
        var x = xs[i][0], dir = xs[i][1];
        s += '<rect x="' + (x - 2.2 + dir * 3) + '" y="62" width="4.4" height="22" rx="2.2" fill="' + p.shade + '"/>';
        s += '<ellipse cx="' + x + '" cy="62" rx="8" ry="9" fill="url(#' + g + ')" stroke="' + p.shade + '" stroke-width="0.8"/>';
        s += '<circle cx="' + (x - dir * 1.5) + '" cy="62" r="2.4" fill="' + p.accent + '" opacity=".85"/>';
    }
    return s;
}

// ---------- JAM PINTAR: layar, jarum (jam nyata), kilau, tali ----------
// ctx = { ang: sudut jarum dari watchHandAngles, night: 0..1 dari siklus siang-malam }
function _watch(p, g, tier, open, ctx) {
    var s = '';
    // tali atas & bawah
    s += '<rect x="36" y="6" width="28" height="30" rx="8" fill="' + p.strap + '"/>';
    s += '<rect x="36" y="64" width="28" height="30" rx="8" fill="' + p.strap + '"/>';
    if (open && tier === 'mid') {
        s += '<path d="M42 14 H58 M42 20 H58 M42 80 H58 M42 86 H58" stroke="' + p.accent + '" stroke-width="0.8" opacity=".7"/>';
    }
    if (open && tier === 'premium') {
        s += '<path d="M40 12 H60 M40 18 H60 M40 82 H60 M40 88 H60" stroke="' + p.accent + '" stroke-width="0.8" opacity=".8"/>';
    }
    // bodi + bezel
    s += '<circle cx="50" cy="50" r="23" fill="url(#' + g + ')"/>';
    s += '<circle cx="50" cy="50" r="23" fill="none" stroke="' + (tier === 'premium' && open ? p.accent : p.shade) +
        '" stroke-width="' + (tier === 'basic' || !open ? 1 : 2) + '"' + (tier === 'premium' ? _c(open, 'acc-ring') : '') + '/>';
    s += '<rect x="72" y="44" width="4" height="12" rx="2" fill="' + p.shade + '"/>'; // mahkota
    // layar: warnanya meredup pada malam (data-base menyimpan warna siang untuk pembaruan live)
    var night = ctx && ctx.night ? ctx.night : 0;
    var glass = open && night > 0 ? _mixHex(p.glass, NIGHT_GLASS, 0.55 * night) : p.glass;
    s += '<circle cx="50" cy="50" r="18" fill="' + glass + '" data-acc-glass="1" data-base="' + p.glass + '"/>';
    if (open) {
        // penanda jam
        for (var i = 0; i < 12; i++) {
            var a = i * Math.PI / 6, r1 = 15, r2 = i % 3 === 0 ? 12.5 : 13.7;
            s += '<line x1="' + (50 + Math.sin(a) * r1).toFixed(1) + '" y1="' + (50 - Math.cos(a) * r1).toFixed(1) +
                '" x2="' + (50 + Math.sin(a) * r2).toFixed(1) + '" y2="' + (50 - Math.cos(a) * r2).toFixed(1) +
                '" stroke="#ffffff" stroke-width="0.6" opacity=".7"/>';
        }
        var hc = tier === 'basic' ? '#ffffff' : p.accent;
        var ang = (ctx && ctx.ang) || watchHandAngles(Date.now());
        // jarum: sudut dihitung dari jam nyata; diperbarui tiap detik oleh timer bersama
        s += '<g data-hand="hr" transform="rotate(' + ang.hr.toFixed(2) + ' 50 50)"><path d="M50 50 V38" stroke="' + hc + '" stroke-width="2.2" stroke-linecap="round"/></g>';
        s += '<g data-hand="min" transform="rotate(' + ang.min.toFixed(2) + ' 50 50)"><path d="M50 50 V33" stroke="' + hc + '" stroke-width="1.5" stroke-linecap="round"/></g>';
        s += '<g data-hand="sec" transform="rotate(' + ang.sec.toFixed(2) + ' 50 50)"><path d="M50 56 V30" stroke="' + (tier === 'premium' ? p.accent : '#ff453a') + '" stroke-width="0.7" stroke-linecap="round"/></g>';
        s += '<circle cx="50" cy="50" r="1.8" fill="#ffffff"/>';
        // kilau menyapu layar (dipotong lingkaran layar)
        s += '<clipPath id="acc-clip-watch"><circle cx="50" cy="50" r="18"/></clipPath>';
        s += '<g clip-path="url(#acc-clip-watch)"><rect x="32" y="30" width="5" height="40" fill="#ffffff" opacity=".12"' + _c(open, 'acc-shine') + '/></g>';
    }
    return s;
}

// ---------- CHARGER: bata + steker + kabel + aliran daya ----------
function _charger(p, g, tier, open) {
    var s = '';
    // kabel dan aliran daya
    s += '<path d="M50 84 C50 94 70 94 78 86" fill="none" stroke="' + p.strap + '" stroke-width="2.4" stroke-linecap="round"/>';
    if (open) {
        s += '<path class="acc-flow" d="M50 84 C50 94 70 94 78 86" fill="none" stroke="' + (tier === 'basic' ? '#ffffff' : p.accent) +
            '" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>';
    }
    s += '<rect x="76" y="82" width="9" height="6" rx="1.6" fill="' + p.shade + '" transform="rotate(-25 80 85)"/>';
    // steker (dua pin)
    s += '<rect x="40" y="10" width="3.2" height="12" rx="1" fill="' + p.accent + '" opacity=".9"/>';
    s += '<rect x="56.8" y="10" width="3.2" height="12" rx="1" fill="' + p.accent + '" opacity=".9"/>';
    // bata
    s += '<rect x="28" y="20" width="44" height="62" rx="9" fill="url(#' + g + ')"/>';
    s += '<rect x="28" y="20" width="44" height="62" rx="9" fill="none" stroke="' + p.shade + '" stroke-width="0.8"/>';
    // port
    s += '<rect x="42" y="68" width="16" height="6" rx="3" fill="' + p.glass + '"/>';
    if (open && tier !== 'basic') s += '<rect x="42" y="58" width="16" height="6" rx="3" fill="' + p.glass + '"/>';
    if (open && tier === 'premium') {
        s += '<rect x="34" y="28" width="32" height="3" rx="1.5" fill="' + p.accent + '"' + _c(open, 'acc-led') + '/>';
        s += '<rect x="34" y="34" width="20" height="2" rx="1" fill="' + p.accent + '" opacity=".5"' + _c(open, 'acc-led', ' style="animation-delay:.4s"') + '/>';
        s += '<path d="M48 44 L43 52 H50 L45 62" fill="none" stroke="' + p.accent + '" stroke-width="1.6" stroke-linejoin="round"' + _c(open, 'acc-bolt') + '/>';
    } else if (open && tier === 'mid') {
        s += '<circle cx="50" cy="34" r="3" fill="' + p.accent + '"' + _c(open, 'acc-led') + '/>';
    } else if (open) {
        s += '<circle cx="50" cy="34" r="2" fill="#30d158"' + _c(open, 'acc-led') + '/>';
    }
    return s;
}

var SHAPES = { earbuds: _earbuds, watch: _watch, charger: _charger };

// renderAccessoryMockup(lineId, tier, opts)
//   opts.size        : sisi persegi dalam px (default 160)
//   opts.open        : true = berwarna sesuai tier dan animasi aktif, false = abu-abu statis
//   opts.closedLabel : teks label saat tertutup (sudah diterjemahkan pemanggil)
//   opts.caption     : false untuk menyembunyikan label (dipakai thumbnail)
//   opts.now         : ms epoch (opsional, untuk uji); default jam perangkat / ?hour=
export function renderAccessoryMockup(lineId, tier, opts) {
    opts = opts || {};
    var size = Number(opts.size);
    if (!isFinite(size) || size < 24) size = 160;
    var open = opts.open !== false;
    var draw = SHAPES[lineId];
    if (!draw) return '';
    if (!TIER_PALETTE[tier]) tier = 'mid';

    ensureAccessoryStyle();

    var p = _pal(tier, open);
    var gid = 'acc_' + lineId + '_' + tier + '_' + (open ? 'o' : 'c');
    var showLabel = !open && opts.caption !== false && opts.closedLabel && size >= 96;
    var live = open && lineId === 'watch';

    var ctx = null;
    if (live) {
        var clk = _clock();
        var ms = opts.now != null && isFinite(Number(opts.now)) ? Number(opts.now) : clk.now();
        ctx = { ang: watchHandAngles(ms), night: _nightAt(ms) };
    }

    var s = '<svg class="acc-mockup" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + size + '" height="' + size + '" ' +
        'role="img" aria-hidden="true"' + (live ? ' data-acc-watch="1"' : '') +
        ' style="display:block;margin:0 auto;max-width:100%;height:auto">';
    s += '<defs>' + _grad(gid, p.hi, p.body) + '</defs>';
    s += '<ellipse cx="50" cy="94" rx="30" ry="3" fill="#000000" opacity="0.12"/>';   // bayangan alas
    s += '<g' + (open ? '' : ' opacity="0.75"') + '>' + draw(p, gid, tier, open, ctx) + '</g>';
    if (showLabel) {
        s += '<rect x="22" y="44" width="56" height="12" rx="6" fill="#000000" opacity="0.55"/>';
        s += '<text x="50" y="52.6" text-anchor="middle" font-size="6" font-family="sans-serif" fill="#ffffff">' + _esc(opts.closedLabel) + '</text>';
    }
    s += '</svg>';
    if (live) _start();
    return s;
}

export function renderAccessoryThumbnail(lineId, tier, size, open) {
    return renderAccessoryMockup(lineId, tier, { size: size || 56, open: open !== false, caption: false });
}
