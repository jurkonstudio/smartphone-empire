import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/phone/PhoneMockup.js
// ============================================================
// PhoneMockup V3 — SVG ponsel realistis 2000-2026.
// - Proporsi & skala bodi mengikuti tahun (ponsel lama kecil/pendek,
//   ponsel modern tinggi/tipis). Semua berdiri di "garis lantai" sama.
// - Era keypad (2000-2006): keypad fisik, antena, pelat wajah.
// - QWERTY, slider, flip (klasik & lipat modern), fold, tri-fold.
// - v2028.31: bentuk baru — communicator (clamshell landscape), PDA stylus, swivel,
//   slider touch+QWERTY, edge melengkung, kamera pop-up, dual screen, flip lipat vertikal.
//   Opsi baru renderPhoneMockup: fit {w,h} = crop viewBox ke bodi (untuk kartu pilihan bentuk).
// - Material: plastik, aluminium, kaca, titanium (rim logam).
// - Tampak depan & belakang (kamera mengikuti pilihan + era).
// API publik tetap: renderPhoneMockup, renderPhoneThumbnail,
// getMockupEra, getMockupSpec. Opsi baru: view ('front'|'back'),
// isStatic, label.
// v2028.40 — view 'box' (kemasan retail): kotak era-aware + isi kotak (kabel/charger/earphone).
//   Kabel USB Tipe-C baru muncul di kotak setelah riset 'bat_usbc' selesai (era 2015+).
// v2027.13d — i18n (Fase 2): teks dekoratif di layar ponsel (Menu, Nama, tanggal,
// "Baru") lewat _tf(). Render murni fungsi — ikut berganti bahasa saat UI di-render ulang
// oleh handler 'lang:changed' di main.js.
// ============================================================
import { getComponentById, getBodyColorById } from '../../data/components.data.js';
import { getPlantTypeForCategory } from '../../data/material-plants.data.js';
import { getDesignEraForYear, getDesignEraById } from '../../data/era-design.data.js';
import { state } from '../../core/GameState.js';
import { resolveSpec } from '../../data/phone-specs.data.js';
import { t, LanguageService } from '../../core/LanguageService.js';
import { resolveConfigForResearch, resolveSensorVisuals, resolveNetworkLabel } from './research-gating.js';

// _tf(key, fallbackId, fallbackEn): terjemahan jika key ada, kalau belum pakai fallback sesuai bahasa aktif.
function _tf(key, fbId, fbEn) {
    var v = t(key);
    if (v && v !== key) return v;
    var en = false;
    try { en = LanguageService.getLang() === 'en'; } catch (e) {}
    return (en && fbEn !== undefined) ? fbEn : fbId;
}

// Teks dekoratif layar (di-escape karena disisipkan ke SVG sebagai markup).
function _scr(key, fbId, fbEn) {
    return _esc(_tf(key, fbId, fbEn));
}
function _esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Jam sekarang (HH:MM, 24 jam) untuk status bar dan jam besar di layar ponsel.
// Dibaca dari jam perangkat saat render, bukan teks tetap seperti "9:41".
export function phoneClockText(date) {
    const d = date instanceof Date ? date : new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

// Era yang dipakai layar: eraId dari spesifikasi yang terbuka; fallback ke era tahun.
function eraForSpec(spec, year) {
    const byId = spec && spec.eraId ? getDesignEraById(spec.eraId) : null;
    return byId || getDesignEraForYear(year);
}

function safeGetState() {
    try { return state.get(); }
    catch (e) { return { time: { currentYear: 2000 }, research: { completed: [] }, companyName: '' }; }
}

function safeGetYear() {
    try { return state.get().time.currentYear; }
    catch (e) { return 2000; }
}

function shadeHex(hex, percent) {
    if (!hex || typeof hex !== 'string') return '#000';
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    const amt = Math.round(2.55 * percent);
    r = Math.max(0, Math.min(255, r + amt));
    g = Math.max(0, Math.min(255, g + amt));
    b = Math.max(0, Math.min(255, b + amt));
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function lum(hex) {
    let h = (hex || '#000').replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const r = parseInt(h.substring(0, 2), 16) || 0;
    const g = parseInt(h.substring(2, 4), 16) || 0;
    const b = parseInt(h.substring(4, 6), 16) || 0;
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

// ============================================================
// GEOMETRI — skala dunia nyata (1 unit ~ 1 mm), lantai di y=166
// [tahun mulai, tinggi, rasio lebar/tinggi]
// ============================================================
const SIZES = [
    [2000, 118, 0.42], [2003, 120, 0.43], [2005, 122, 0.44],
    [2007, 124, 0.52], [2009, 128, 0.52], [2011, 136, 0.51],
    [2013, 142, 0.50], [2015, 146, 0.50], [2017, 150, 0.48],
    [2019, 154, 0.47], [2022, 156, 0.46]
];
const GROUND = 166;

function mk(kind, x, y, w, h, rx, yr, material) {
    return { kind: kind, x: x, y: y, w: w, h: h, rx: rx, yr: yr, material: material, ty: y, th: h };
}

function getGeom(formFactor, spec) {
    const yr = spec.fromYear;
    const mat = spec.material || 'plastic';
    let row = SIZES[0];
    for (let i = 0; i < SIZES.length; i++) if (yr >= SIZES[i][0]) row = SIZES[i];
    const h = row[1];
    const w = Math.round(h * row[2]);
    // Radius sudut per era: kaca membulat (2019-21), titanium bingkai datar (2022-23), ultra-lembut (2024+).
    const rx = yr < 2013 ? 9 : (yr < 2017 ? 8 : (yr >= 2024 ? 12 : (yr >= 2022 ? 9 : (yr >= 2019 ? 12 : 10))));

    if (formFactor === 'ff_qwerty') {
        const qh = Math.min(h, 128), qw = Math.round(qh * 0.56);
        return mk('qwerty', (100 - qw) / 2, GROUND - qh, qw, qh, 7, yr, mat);
    }
    if (formFactor === 'ff_communicator') {
        const g = mk('communicator', 3, GROUND - 56, 94, 30, 6, yr, mat);
        g.low = { y: g.y + 31, h: 25 };
        g.th = 56;
        return g;
    }
    if (formFactor === 'ff_pda') {
        const ph = Math.min(h + 8, 132), pw = Math.round(ph * 0.46);
        return mk('pda', (100 - pw) / 2, GROUND - ph, pw, ph, Math.min(rx, 8), yr, mat);
    }
    if (formFactor === 'ff_swivel') {
        const g = mk('swivel', 26, GROUND - 126, 48, 58, 8, yr, mat);
        g.low = { y: g.y + 64, h: 62 };
        g.th = 126;
        g.rot = -20;
        g.pivot = [g.x + g.w * 0.8, g.y + g.h];
        return g;
    }
    if (formFactor === 'ff_touch_slider') {
        const g = mk('slider', 22, GROUND - 146, 56, 100, 9, yr, mat);
        g.low = { y: g.y + 92, h: 54 };
        g.th = 146;
        g.keys = 'qwerty';
        g.touch = true;
        return g;
    }
    if (formFactor === 'ff_edge') {
        const g = mk('bar', (100 - w) / 2, GROUND - h, w, h, 11, yr, mat);
        g.edge = true;
        return g;
    }
    if (formFactor === 'ff_popup') {
        const g = mk('bar', (100 - w) / 2, GROUND - h, w, h, rx, yr, mat);
        g.popup = true;
        return g;
    }
    if (formFactor === 'ff_dual') {
        return mk('dual', 5, GROUND - 102, 90, 102, 7, yr, mat);
    }
    if (formFactor === 'ff_flip_fold') {
        const fh = Math.min(h + 4, 152), fw = Math.round(fh * 0.43);
        const g = mk('bar', (100 - fw) / 2, GROUND - fh, fw, fh, rx, yr, mat);
        g.crease = true;
        g.hinge = true;
        return g;
    }
    if (formFactor === 'ff_slider') {
        const g = mk('slider', 23, GROUND - 138, 54, 84, 8, yr, mat);
        g.low = { y: g.y + 78, h: 60 };
        g.th = 138;
        return g;
    }
    if (formFactor === 'ff_flip') {
        if (yr >= 2019) {
            const g = mk('bar', (100 - w) / 2, GROUND - h, w, h, rx, yr, mat);
            g.crease = true;
            g.hinge = true;
            return g;
        }
        const g = mk('flip', 23, GROUND - 132, 54, 64, 9, yr, mat);
        g.low = { y: g.y + 68, h: 64 };
        g.th = 132;
        return g;
    }
    if (formFactor === 'ff_fold' || formFactor === 'ff_foldable') {
        // Gaya buku (mis. iPhone Duo 2026): saat tertutup tampak seperti ponsel tinggi
        // dengan layar sampul; engsel vertikal di sisi tengah.
        const fh = Math.min(h + 12, 156), fw = Math.round(fh * 0.45);
        const g = mk('bar', (100 - fw) / 2, GROUND - fh, fw, fh, rx, yr, mat);
        g.crease = true;
        g.hinge = true;
        g.book = true; // buku: engsel vertikal di sisi kiri, layar sampul solid

        return g;
    }
    if (formFactor === 'ff_tri_fold') {
        return mk('trifold', 3, GROUND - 96, 94, 96, 6, yr, mat);
    }
    return mk('bar', (100 - w) / 2, GROUND - h, w, h, rx, yr, mat);
}

// Bezel modern (satuan viewBox): makin tahun makin tipis & seragam.
// 2017-18 masih berdagu (notch), 2019-21 punch-hole, 2022-23 bingkai datar, 2024+ nyaris tanpa bezel.
function modernBezel(yr) {
    if (yr >= 2025) return { s: 1.3, t: 1.5, b: 1.5 };
    if (yr >= 2024) return { s: 1.4, t: 1.6, b: 1.7 };
    if (yr >= 2022) return { s: 1.6, t: 1.9, b: 1.9 };
    if (yr >= 2019) return { s: 1.9, t: 2.4, b: 2.8 };
    if (yr >= 2017) return { s: 2.4, t: 5.5, b: 6.5 };
    return null;
}

function getScreenRect(spec, g) {
    const r = _baseScreenRect(spec, g);
    if (g.edge) { r.x = g.x + 1.5; r.w = g.w - 3; r.cornerRadius = Math.max(r.cornerRadius, 8); }
    if (g.popup) { const d = r.y - (g.y + 2.2); r.y -= d; r.h += d; }
    return r;
}

function _baseScreenRect(spec, g) {
    const s = spec.screen || { insetTop: 20, insetBottom: 20, insetSide: 8, cornerRadius: 6 };
    if (g.kind === 'communicator') return { x: g.x + 7, y: g.y + 3.5, w: g.w - 14, h: g.h - 7, cornerRadius: 2 };
    if (g.kind === 'pda') return { x: g.x + 4.5, y: g.y + 12, w: g.w - 9, h: g.h * 0.56, cornerRadius: 2 };
    if (g.kind === 'swivel') return { x: g.x + 5, y: g.y + 9, w: g.w - 10, h: g.h - 18, cornerRadius: 2 };
    if (g.kind === 'dual') return { x: g.x + 3, y: g.y + 3, w: g.w - 6, h: g.h - 6, cornerRadius: 4 };
    if (g.kind === 'slider' && g.touch) return { x: g.x + 5, y: g.y + 8, w: g.w - 10, h: g.h - 20, cornerRadius: 3.5 };
    if (g.kind === 'qwerty') {
        return { x: g.x + 5, y: g.y + 11, w: g.w - 10, h: g.h * (g.yr >= 2007 ? 0.40 : 0.35), cornerRadius: 2.5 };
    }
    if (g.kind === 'slider') return { x: g.x + 6, y: g.y + 13, w: g.w - 12, h: g.h - 27, cornerRadius: 2 };
    if (g.kind === 'flip') return { x: g.x + 6, y: g.y + 9, w: g.w - 12, h: g.h - 18, cornerRadius: 2 };
    if (g.kind === 'fold' || g.kind === 'trifold') {
        return { x: g.x + 3, y: g.y + 3, w: g.w - 6, h: g.h - 6, cornerRadius: 5 };
    }
    if (g.yr < 2007) {
        const w = g.w * 0.78;
        const hh = Math.min(w * (g.yr < 2003 ? 0.80 : g.yr < 2005 ? 0.98 : 1.08), g.h * 0.36);
        return {
            x: g.x + (g.w - w) / 2,
            y: g.y + g.h * (g.yr < 2003 ? 0.17 : 0.15),
            w: w, h: hh, cornerRadius: g.yr < 2003 ? 1.2 : 2.2
        };
    }
    const mb = modernBezel(g.yr);
    if (mb) {
        return {
            x: g.x + mb.s, y: g.y + mb.t,
            w: g.w - mb.s * 2, h: g.h - mb.t - mb.b,
            cornerRadius: Math.max(3, g.rx - mb.s + 0.4)
        };
    }
    const top = (s.insetTop / 100) * g.h;
    const bottom = (s.insetBottom / 100) * g.h;
    const side = (s.insetSide / 100) * g.w;
    return {
        x: g.x + side, y: g.y + top,
        w: g.w - side * 2, h: g.h - top - bottom,
        cornerRadius: Math.max(2, s.cornerRadius || 6)
    };
}

// ============================================================
// SCREEN HELPERS
// ============================================================
function sigBars(x, y, fill) {
    return [1, 1.7, 2.4, 3.1].map(function (hh, i) {
        return '<rect x="' + (x + i * 1.2) + '" y="' + (y + 3.1 - hh) + '" width="0.8" height="' + hh + '" fill="' + fill + '"/>';
    }).join('');
}

function batt(xr, y, fill) {
    return '<rect x="' + (xr - 4.6) + '" y="' + y + '" width="4" height="2" rx="0.4" fill="none" stroke="' + fill + '" stroke-width="0.3"/>' +
        '<rect x="' + (xr - 4.3) + '" y="' + (y + 0.3) + '" width="2.8" height="1.4" fill="' + fill + '"/>' +
        '<rect x="' + (xr - 0.5) + '" y="' + (y + 0.6) + '" width="0.4" height="0.8" fill="' + fill + '"/>';
}

function appIcon(x, y, s, color, gloss) {
    return '<rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" rx="' + (s * 0.22) + '" fill="' + color + '"/>' +
        (gloss ? '<rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + (s * 0.5) + '" rx="' + (s * 0.22) + '" fill="#fff" opacity="0.24"/>' : '') +
        '<circle cx="' + (x + s / 2) + '" cy="' + (y + s / 2) + '" r="' + (s * 0.2) + '" fill="#fff" opacity="0.55"/>';
}

const ICON_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#e11d48'];

// 2000-2002: LCD monokrom hijau ala Nokia
function screenMono(r, uid, brand) {
    const x0 = r.x, y0 = r.y, w = r.w, h = r.h, cx = x0 + w / 2, cy = y0 + h / 2;
    const ink = '#1c2a10';
    const fs = Math.min(w * 0.30, h * 0.34);
    return `
        <defs>
            <pattern id="px_${uid}" width="0.7" height="0.7" patternUnits="userSpaceOnUse">
                <path d="M0.7 0H0V0.7" fill="none" stroke="#000" stroke-opacity="0.14" stroke-width="0.12"/>
            </pattern>
            <linearGradient id="lcd_${uid}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#a8bf80"/><stop offset="1" stop-color="#8ca768"/>
            </linearGradient>
        </defs>
        <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="url(#lcd_${uid})"/>
        ${sigBars(x0 + 1.5, y0 + 1.2, ink)}
        ${batt(x0 + w - 1.5, y0 + 1.6, ink)}
        <text x="${cx}" y="${cy + fs * 0.15}" text-anchor="middle" font-size="${fs}" font-family="monospace" font-weight="700" fill="${ink}">${phoneClockText()}</text>
        <text x="${cx}" y="${cy + fs * 0.15 + 3.6}" text-anchor="middle" font-size="2.3" font-family="monospace" font-weight="700" fill="${ink}" letter-spacing="0.3">${brand}</text>
        <rect x="${x0}" y="${y0 + h - 4.4}" width="${w}" height="4.4" fill="${ink}" opacity="0.88"/>
        <text x="${x0 + 1.6}" y="${y0 + h - 1.3}" font-size="2.2" font-family="monospace" font-weight="700" fill="#b9cf92">${_scr('phone.mock.menu', 'Menu', 'Menu')}</text>
        <text x="${x0 + w - 1.6}" y="${y0 + h - 1.3}" text-anchor="end" font-size="2.2" font-family="monospace" font-weight="700" fill="#b9cf92">${_scr('phone.mock.names', 'Nama', 'Names')}</text>
        <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="url(#px_${uid})"/>
    `;
}

// 2003-2006: TFT warna, menu ikon ala Series 40
function screenTft(r, uid, brand) {
    const x0 = r.x, y0 = r.y, w = r.w, h = r.h, cx = x0 + w / 2;
    const big = h > 36;
    const cols = 3, rows = big ? 2 : 1;
    const cell = (w - 6) / cols;
    const isz = Math.min(cell - 1.6, 7.5);
    const iy0 = y0 + h * (big ? 0.5 : 0.6);
    let icons = '';
    for (let rr = 0; rr < rows; rr++) for (let c = 0; c < cols; c++) {
        icons += appIcon(x0 + 3 + c * cell + (cell - isz) / 2, iy0 + rr * (isz + 1.6), isz, ICON_COLORS[(rr * cols + c) % ICON_COLORS.length], true);
    }
    return `
        <defs>
            <linearGradient id="tft_${uid}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#2b6cb8"/><stop offset="1" stop-color="#0b1f3d"/>
            </linearGradient>
        </defs>
        <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="url(#tft_${uid})"/>
        <circle cx="${cx}" cy="${y0 + h * 0.3}" r="${w * 0.42}" fill="#7bb6ff" opacity="0.22"/>
        <rect x="${x0}" y="${y0}" width="${w}" height="4.4" fill="#000" opacity="0.35"/>
        ${sigBars(x0 + 1.5, y0 + 0.8, '#bcd8ff')}
        ${batt(x0 + w - 1.5, y0 + 1.2, '#bcd8ff')}
        <text x="${cx}" y="${y0 + h * 0.34}" text-anchor="middle" font-size="${Math.min(w * 0.2, 8)}" font-family="sans-serif" font-weight="700" fill="#fff">${phoneClockText()}</text>
        <text x="${cx}" y="${y0 + h * 0.34 + 3.2}" text-anchor="middle" font-size="2" font-family="sans-serif" fill="#bcd8ff">${brand}</text>
        ${icons}
        <rect x="${x0}" y="${y0 + h - 4.4}" width="${w}" height="4.4" fill="#06132a"/>
        <text x="${x0 + 1.6}" y="${y0 + h - 1.3}" font-size="2.1" font-family="sans-serif" font-weight="700" fill="#9ec5ff">${_scr('phone.mock.menu', 'Menu', 'Menu')}</text>
        <text x="${x0 + w - 1.6}" y="${y0 + h - 1.3}" text-anchor="end" font-size="2.1" font-family="sans-serif" font-weight="700" fill="#9ec5ff">${_scr('phone.mock.names', 'Nama', 'Names')}</text>
    `;
}

// 2007-2010: layar sentuh glossy (grid ikon 4 kolom + dock)
function screenGlossy(r, uid, brand) {
    const x0 = r.x, y0 = r.y, w = r.w, h = r.h, cx = x0 + w / 2;
    const cell = (w - 3) / 4;
    const s = cell - 2.2;
    const rows = Math.max(2, Math.min(4, Math.floor((h - 26) / cell)));
    let grid = '';
    for (let rr = 0; rr < rows; rr++) for (let c = 0; c < 4; c++) {
        grid += appIcon(x0 + 1.5 + c * cell + 1.1, y0 + 6.2 + rr * cell, s, ICON_COLORS[(rr * 4 + c) % ICON_COLORS.length], true);
    }
    let dock = '';
    for (let c = 0; c < 4; c++) dock += appIcon(x0 + 1.5 + c * cell + 1.1, y0 + h - 10.2, s, ICON_COLORS[(c + 5) % ICON_COLORS.length], true);
    return `
        <defs>
            <linearGradient id="gl_${uid}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#27508f"/><stop offset="1" stop-color="#0a1530"/>
            </linearGradient>
        </defs>
        <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="url(#gl_${uid})"/>
        <rect x="${x0}" y="${y0}" width="${w}" height="3.8" fill="#000" opacity="0.85"/>
        <text x="${x0 + 1.5}" y="${y0 + 2.7}" font-size="1.7" font-family="sans-serif" fill="#e8f0ff" font-weight="600">${brand.slice(0, 8)}</text>
        <text x="${cx}" y="${y0 + 2.7}" text-anchor="middle" font-size="1.8" font-family="sans-serif" fill="#fff" font-weight="700">${phoneClockText()}</text>
        ${batt(x0 + w - 1.2, y0 + 0.9, '#e8f0ff')}
        ${grid}
        <circle cx="${cx - 1.6}" cy="${y0 + h - 12.2}" r="0.55" fill="#fff"/>
        <circle cx="${cx}" cy="${y0 + h - 12.2}" r="0.5" fill="#fff" opacity="0.45"/>
        <circle cx="${cx + 1.6}" cy="${y0 + h - 12.2}" r="0.5" fill="#fff" opacity="0.45"/>
        <rect x="${x0}" y="${y0 + h - 11.4}" width="${w}" height="11.4" fill="#fff" opacity="0.16"/>
        ${dock}
    `;
}

// 2011-2014: flat (Android 4 / iOS 7) — wallpaper gradien + widget jam
function screenFlat(r, uid, brand) {
    const x0 = r.x, y0 = r.y, w = r.w, h = r.h, cx = x0 + w / 2;
    const cell = (w - 3) / 4;
    const s = cell - 2.6;
    const rows = Math.max(2, Math.min(3, Math.floor((h - 36) / cell)));
    let grid = '';
    for (let rr = 0; rr < rows; rr++) for (let c = 0; c < 4; c++) {
        grid += appIcon(x0 + 1.5 + c * cell + 1.3, y0 + h * 0.36 + rr * cell, s, ICON_COLORS[(rr * 4 + c + 2) % ICON_COLORS.length], false);
    }
    const dockColors = [0, 1, 2, 3].map(function (c) { return ICON_COLORS[(c + 7) % ICON_COLORS.length]; });
    const dock = renderDock(x0, y0, w, h, dockColors);
    const dotsY = y0 + dockPillTop(w, h, dockColors.length).y - 2.4;
    return `
        <defs>
            <linearGradient id="fl_${uid}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#3a2a7e"/><stop offset="0.55" stop-color="#1f62a8"/><stop offset="1" stop-color="#0bb3b3"/>
            </linearGradient>
        </defs>
        <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="url(#fl_${uid})"/>
        <rect x="${x0}" y="${y0}" width="${w}" height="3.6" fill="#000" opacity="0.3"/>
        <text x="${x0 + 1.5}" y="${y0 + 2.6}" font-size="1.7" font-family="sans-serif" fill="#fff" font-weight="500">${phoneClockText()}</text>
        <path d="M${x0 + w - 11} ${y0 + 2.8} l1.8 -2.2 l1.8 2.2 z" fill="#fff" opacity="0.9"/>
        ${sigBars(x0 + w - 8.4, y0 + 0.4, '#fff')}
        ${batt(x0 + w - 1.2, y0 + 0.9, '#fff')}
        <text x="${cx}" y="${y0 + h * 0.2}" text-anchor="middle" font-size="${Math.min(w * 0.26, 10)}" font-family="sans-serif" font-weight="200" fill="#fff">${phoneClockText()}</text>
        <text x="${cx}" y="${y0 + h * 0.2 + 3.4}" text-anchor="middle" font-size="1.9" font-family="sans-serif" fill="#fff" opacity="0.85">${_scr('phone.mock.date_weather', 'Senin, 12 Oktober', 'Monday, October 12')}  24°C</text>
        ${grid}
        ${dock}
        <circle cx="${cx - 1.6}" cy="${dotsY}" r="0.5" fill="#fff"/>
        <circle cx="${cx}" cy="${dotsY}" r="0.45" fill="#fff" opacity="0.45"/>
        <circle cx="${cx + 1.6}" cy="${dotsY}" r="0.45" fill="#fff" opacity="0.45"/>
    `;
}

// Geometri dok: pill semi-transparan yang diangkat di atas indikator home.
// Sebelumnya ikon menempel di dasar layar sehingga terpotong oleh sudut layar lengkung.
function dockPillTop(w, h, n) {
    const slot = (w * 0.8) / n;
    const pillH = slot * 0.7 + 3;
    return { y: h - 7 - pillH, h: pillH };
}

function renderDock(x0, y0, w, h, colors) {
    const pad = w * 0.1;
    const slot = (w - pad * 2) / colors.length;
    const sz = slot * 0.7;
    const pos = dockPillTop(w, h, colors.length);
    const pillY = y0 + pos.y, pillH = pos.h;
    let icons = '';
    colors.forEach(function (c, i) {
        const ix = x0 + pad + slot * i + (slot - sz) / 2;
        const iy = pillY + (pillH - sz) / 2;
        icons += '<rect x="' + ix + '" y="' + iy + '" width="' + sz + '" height="' + sz + '" rx="' + (sz * 0.28) + '" fill="' + c + '" opacity="0.92"/>';
    });
    return '<rect x="' + (x0 + pad * 0.6) + '" y="' + pillY + '" width="' + (w - pad * 1.2) + '" height="' + pillH +
        '" rx="' + (pillH / 2) + '" fill="#ffffff" opacity="0.12"/>' + icons;
}

// 2015+ : AMOLED / HDR / Flexible (dipertahankan dari versi sebelumnya)
function screenModern(screenStyle, rect, uid) {
    const x0 = rect.x, y0 = rect.y, w = rect.w, h = rect.h;
    const cx = x0 + w / 2;
    const cy = y0 + h / 2;
    const idSuffix = uid || 'm'; // ID gradient/filter diturunkan dari uid render utama
    // ============================================================
    // ERA 2015-2018: AMOLED Premium — Always-On Display
    // ============================================================
    if (screenStyle === 'amoled') {
        const widgetY = cy + 6;
        const widgetW = (w - 10) / 3;
        return `
            <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#000000"/>
            <text x="${x0 + 2}" y="${y0 + 3.2}" font-size="1.5" font-family="sans-serif" fill="#c9a961" font-weight="600">${phoneClockText()}</text>
            <text x="${x0 + w - 2}" y="${y0 + 3.2}" text-anchor="end" font-size="1.5" font-family="sans-serif" fill="#c9a961">4G ▮▮</text>

            <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="11" font-family="sans-serif" fill="#f0ede8" font-weight="200" letter-spacing="-0.5">${phoneClockText()}</text>
            <text x="${cx}" y="${cy + 1}" text-anchor="middle" font-size="1.8" font-family="sans-serif" fill="#c9a961" letter-spacing="0.4">${_scr('phone.mock.date_full', 'Senin, 12 Oktober', 'Monday, October 12')}</text>

            <rect x="${x0 + 5}" y="${widgetY}" width="${widgetW}" height="5" rx="1.2" fill="#1a1a1a" stroke="#c9a961" stroke-width="0.1" opacity="0.7"/>
            <text x="${x0 + 5 + widgetW/2}" y="${widgetY + 3.2}" text-anchor="middle" font-size="1.5" font-family="sans-serif" fill="#c9a961" opacity="0.9">24°</text>

            <rect x="${x0 + 5 + widgetW + 2.5}" y="${widgetY}" width="${widgetW}" height="5" rx="1.2" fill="#1a1a1a" stroke="#c9a961" stroke-width="0.1" opacity="0.7"/>
            <text x="${x0 + 5 + widgetW + 2.5 + widgetW/2}" y="${widgetY + 3.2}" text-anchor="middle" font-size="1.5" font-family="sans-serif" fill="#c9a961" opacity="0.9">${_scr('phone.mock.new_count', '3 Baru', '3 New')}</text>

            <rect x="${x0 + 5 + (widgetW + 2.5)*2}" y="${widgetY}" width="${widgetW}" height="5" rx="1.2" fill="#1a1a1a" stroke="#c9a961" stroke-width="0.1" opacity="0.7"/>
            <text x="${x0 + 5 + (widgetW + 2.5)*2 + widgetW/2}" y="${widgetY + 3.2}" text-anchor="middle" font-size="1.5" font-family="sans-serif" fill="#c9a961" opacity="0.9">78%</text>

            <rect x="${cx - 6}" y="${y0 + h - 4}" width="12" height="1.6" rx="0.8" fill="#1a1a1a" stroke="#c9a961" stroke-width="0.1" opacity="0.6"/>
            <rect x="${cx - 4}" y="${y0 + h - 3.7}" width="8" height="1" rx="0.5" fill="#c9a961" opacity="0.55"/>
        `;
    }

    // ============================================================
    // ERA 2019-2022: HDR / AI — Jam Besar + Notif + Dock
    // ============================================================
    if (screenStyle === 'hdr') {
        const gradId = 'hdrMesh_' + idSuffix;
        const notifY = cy + 2;
        const dockColors = ['#00d4ff', '#a855f7', '#ec4899', '#10b981'];
        return `
            <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#080c14"/>
            <defs>
                <radialGradient id="${gradId}" cx="30%" cy="40%">
                    <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.40"/>
                    <stop offset="55%" stop-color="#a855f7" stop-opacity="0.10"/>
                    <stop offset="100%" stop-color="#080c14" stop-opacity="0"/>
                </radialGradient>
            </defs>
            <rect x="${x0}" y="${y0 + 4}" width="${w}" height="${h - 4}" fill="url(#${gradId})"/>

            <text x="${x0 + 2}" y="${y0 + 3.2}" font-size="1.5" font-family="sans-serif" fill="#00d4ff" font-weight="600">${phoneClockText()}</text>
            <text x="${x0 + w - 2}" y="${y0 + 3.2}" text-anchor="end" font-size="1.5" font-family="sans-serif" fill="#00d4ff">5G ▮▮</text>

            <text x="${cx}" y="${cy - 5}" text-anchor="middle" font-size="10" font-family="sans-serif" fill="#ffffff" font-weight="200" letter-spacing="-0.5">${phoneClockText()}</text>
            <text x="${cx}" y="${cy - 0.5}" text-anchor="middle" font-size="1.7" font-family="sans-serif" fill="#00d4ff" opacity="0.9" letter-spacing="0.3">${_scr('phone.mock.date_short', 'Sen, 12 Okt 2021', 'Mon, Oct 12, 2021')}</text>

            <rect x="${x0 + 4}" y="${notifY + 3}" width="${w - 8}" height="4.5" rx="1.8" fill="#0f1420" stroke="#00d4ff" stroke-width="0.1" opacity="0.85"/>
            <circle cx="${x0 + 6.5}" cy="${notifY + 5.25}" r="1" fill="#00d4ff" opacity="0.9"/>
            <rect x="${x0 + 8.5}" y="${notifY + 4.5}" width="${w * 0.55}" height="0.6" rx="0.3" fill="#ffffff" opacity="0.75"/>
            <rect x="${x0 + 8.5}" y="${notifY + 6}" width="${w * 0.38}" height="0.5" rx="0.25" fill="#00d4ff" opacity="0.55"/>

            ${renderDock(x0, y0, w, h, dockColors)}

            <circle cx="${cx - 3}" cy="${y0 + h - 2.8}" r="0.6" fill="#ffffff" opacity="0.9"/>
            <circle cx="${cx}" cy="${y0 + h - 2.8}" r="0.5" fill="#ffffff" opacity="0.5"/>
            <circle cx="${cx + 3}" cy="${y0 + h - 2.8}" r="0.5" fill="#ffffff" opacity="0.5"/>
        `;
    }

    // ============================================================
    // ERA 2023+: FLEXIBLE / FUTURE — Aurora + App Grid + Dock
    // ============================================================
    if (screenStyle === 'flexible') {
        const gradId = 'auroraGrad_' + idSuffix;
        const blurId = 'auroraBlur_' + idSuffix;
        const appColors = ['#a855f7', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#14b8a6'];
        const dockColors = ['#ffffff', '#a855f7', '#06b6d4', '#ec4899'];
        const cols = 4, rows = 2;
        const gridTop = cy + 5;
        const gridH = h - (gridTop - y0) - 22;
        const cellW = (w - 8) / cols;
        const cellH = gridH / rows;
        const iconSize = Math.min(cellW, cellH) - 2.5;

        return `
            <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#04040a"/>
            <defs>
                <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#a855f7" stop-opacity="0.55"/>
                    <stop offset="50%" stop-color="#06b6d4" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="#ec4899" stop-opacity="0.45"/>
                </linearGradient>
                <filter id="${blurId}">
                    <feGaussianBlur stdDeviation="2.5"/>
                </filter>
            </defs>
            <ellipse cx="${cx}" cy="${y0 + 30}" rx="${w * 0.55}" ry="${h * 0.28}" fill="url(#${gradId})" filter="url(#${blurId})" opacity="0.7"/>
            <ellipse cx="${cx}" cy="${y0 + h - 20}" rx="${w * 0.5}" ry="${h * 0.22}" fill="url(#${gradId})" filter="url(#${blurId})" opacity="0.5"/>

            <text x="${x0 + 2}" y="${y0 + 3.2}" font-size="1.5" font-family="sans-serif" fill="#ffffff" font-weight="600">${phoneClockText()}</text>
            <text x="${x0 + w - 2}" y="${y0 + 3.2}" text-anchor="end" font-size="1.5" font-family="sans-serif" fill="#a855f7">6G ▮▮</text>

            <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="11" font-family="sans-serif" fill="#ffffff" font-weight="200" letter-spacing="-0.5">${phoneClockText()}</text>
            <text x="${cx}" y="${cy - 1}" text-anchor="middle" font-size="1.7" font-family="sans-serif" fill="#ffffff" opacity="0.75" letter-spacing="0.4">${_scr('phone.mock.date_day', '12 Oktober', 'October 12')}</text>

            <g opacity="0.95">
                ${Array.from({length: cols * rows}, (_, i) => {
                    const col = i % cols, row = Math.floor(i / cols);
                    const ix = x0 + 4 + col * cellW + (cellW - iconSize) / 2;
                    const iy = gridTop + row * cellH + (cellH - iconSize) / 2;
                    return `
                        <rect x="${ix}" y="${iy}" width="${iconSize}" height="${iconSize}" rx="${iconSize * 0.25}" fill="${appColors[i % appColors.length]}" opacity="0.92"/>
                        <rect x="${ix + 0.5}" y="${iy + 0.5}" width="${iconSize - 1}" height="${iconSize - 1}" rx="${iconSize * 0.22}" fill="none" stroke="#ffffff" stroke-opacity="0.15" stroke-width="0.1"/>
                    `;
                }).join('')}
            </g>

            ${renderDock(x0, y0, w, h, dockColors)}

            <circle cx="${cx - 3}" cy="${y0 + h - 2.8}" r="0.6" fill="#ffffff" opacity="0.95"/>
            <circle cx="${cx}" cy="${y0 + h - 2.8}" r="0.5" fill="#ffffff" opacity="0.5"/>
            <circle cx="${cx + 3}" cy="${y0 + h - 2.8}" r="0.5" fill="#ffffff" opacity="0.5"/>
        `;
    }

    return `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#1a1a1a"/>`;
}

function screenContent(screenStyle, rect, uid, brand, displayId) {
    const b = brand || 'SMARTEL';
    if (displayId && displayId.indexOf('scr_mono') === 0 && screenStyle !== 'monochrome') {
        return screenMono(rect, uid, b);
    }
    if (screenStyle === 'monochrome') return screenMono(rect, uid, b);
    if (screenStyle === 'color_tft') return screenTft(rect, uid, b);
    if (screenStyle === 'glossy') return screenGlossy(rect, uid, b);
    if (screenStyle === 'flat') return screenFlat(rect, uid, b);
    return screenModern(screenStyle, rect, uid);
}

// ============================================================
// BODY — material-aware (plastik / aluminium / kaca / titanium)
// ============================================================
function rimStops(mat, hex) {
    if (mat === 'aluminum') return ['#f4f4f4', '#9a9a9a', '#ececec', '#777'];
    if (mat === 'glass') return ['#e2e5e9', '#868c94', '#cdd2d8', '#6d737b'];
    if (mat === 'titanium') return ['#d6d6d0', '#8a8a86', '#c3c3bd', '#6c6c68'];
    return [shadeHex(hex, 14), hex, shadeHex(hex, -12), shadeHex(hex, -28)];
}

function bodyShape(x, y, w, h, rx, ids, mat) {
    const sw = mat === 'plastic' ? 0.5 : 1.1;
    // Titanium: bingkai datar ber-bevel ganda (garis terang tipis di dalam rim).
    const flatFrame = mat === 'titanium'
        ? `<rect x="${x + 0.38}" y="${y + 0.38}" width="${w - 0.76}" height="${h - 0.76}" rx="${Math.max(1, rx - 0.38)}" fill="none" stroke="url(#${ids.rim})" stroke-width="0.5"/>
        <rect x="${x + 0.9}" y="${y + 0.9}" width="${w - 1.8}" height="${h - 1.8}" rx="${Math.max(1, rx - 0.9)}" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="0.3"/>`
        : '';
    return `
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="url(#${ids.body})"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="none" stroke="url(#${ids.rim})" stroke-width="${sw}"/>
        <rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="${Math.max(1, rx - 1)}" fill="none" stroke="#000" stroke-opacity="0.28" stroke-width="0.25"/>
        <rect x="${x + 0.6}" y="${y + 0.6}" width="${w - 1.2}" height="${h - 1.2}" rx="${Math.max(1, rx - 0.6)}" fill="none" stroke="#fff" stroke-opacity="${mat === 'plastic' ? 0.16 : 0.38}" stroke-width="0.35"/>
        <rect x="${x + 2}" y="${y + 1.5}" width="${Math.max(1, w - 4)}" height="${Math.max(1, h * 0.22)}" rx="${Math.max(1, rx - 2)}" fill="url(#sheen_${ids.body})" pointer-events="none"/>
        ${flatFrame}
    `;
}

function renderBodyLayer(g, ids, hex) {
    const mat = g.material;
    if (g.kind === 'communicator') {
        const hingeY = g.y + g.h;
        return bodyShape(g.x, g.low.y, g.w, g.low.h, g.rx, ids, mat) +
            bodyShape(g.x, g.y, g.w, g.h, g.rx, ids, mat) +
            `<rect x="${g.x + 10}" y="${hingeY - 1.2}" width="${g.w - 20}" height="3.4" rx="1.4" fill="url(#${ids.rim})" stroke="#000" stroke-opacity="0.4" stroke-width="0.3"/>`;
    }
    if (g.kind === 'swivel') return bodyShape(g.x, g.low.y, g.w, g.low.h, g.rx, ids, mat);
    if (g.kind === 'slider') {
        const lowX = g.x + 3, lowW = g.w - 6;
        return bodyShape(lowX, g.low.y, lowW, g.low.h, 7, ids, mat) + bodyShape(g.x, g.y, g.w, g.h, g.rx, ids, mat);
    }
    if (g.kind === 'flip') {
        return bodyShape(g.x, g.low.y, g.w, g.low.h, g.rx, ids, mat) +
            bodyShape(g.x, g.y, g.w, g.h, g.rx, ids, mat) +
            `<rect x="${g.x + 5}" y="${g.y + g.h - 2}" width="${g.w - 10}" height="8" rx="3" fill="url(#${ids.rim})" stroke="#000" stroke-opacity="0.4" stroke-width="0.3"/>`;
    }
    let out = bodyShape(g.x, g.y, g.w, g.h, g.rx, ids, mat);
    if (g.kind === 'fold') {
        const cx = g.x + g.w / 2;
        out += `<rect x="${cx - 1.4}" y="${g.y + 2}" width="2.8" height="${g.h - 4}" fill="#000" opacity="0.22"/>`;
    }
    if (g.kind === 'dual') {
        const cx = g.x + g.w / 2;
        out += `<rect x="${cx - 2.6}" y="${g.y + 1}" width="5.2" height="${g.h - 2}" fill="url(#${ids.rim})" stroke="#000" stroke-opacity="0.45" stroke-width="0.3"/>
            ${[0.22, 0.5, 0.78].map(function (f) { return `<rect x="${cx - 3.4}" y="${g.y + g.h * f - 3}" width="6.8" height="6" rx="1.6" fill="${shadeHex('#808080', 10)}" stroke="#000" stroke-opacity="0.45" stroke-width="0.3"/>`; }).join('')}`;
    }
    if (g.hinge && g.book) {
        // Tulang engsel vertikal (gaya buku): strip logam di sisi kiri dengan sendi atas-bawah.
        const sy = g.y + g.h * 0.08, sh = g.h * 0.84;
        out += `<rect x="${g.x - 1.4}" y="${sy}" width="3.2" height="${sh}" rx="1.5" fill="url(#${ids.rim})" stroke="#000" stroke-opacity="0.4" stroke-width="0.25"/>
            <rect x="${g.x - 0.5}" y="${sy + 1.5}" width="0.8" height="${sh - 3}" rx="0.4" fill="#000" opacity="0.35"/>
            <rect x="${g.x - 1.7}" y="${g.y + g.h * 0.25 - 1.6}" width="3.8" height="3.2" rx="1" fill="url(#${ids.rim})" stroke="#000" stroke-opacity="0.45" stroke-width="0.25"/>
            <rect x="${g.x - 1.7}" y="${g.y + g.h * 0.75 - 1.6}" width="3.8" height="3.2" rx="1" fill="url(#${ids.rim})" stroke="#000" stroke-opacity="0.45" stroke-width="0.25"/>`;
    } else if (g.hinge) {
        const cy = g.y + g.h / 2;
        out += `<rect x="${g.x - 0.9}" y="${cy - 3.2}" width="2.2" height="6.4" rx="0.9" fill="url(#${ids.rim})" stroke="#000" stroke-opacity="0.4" stroke-width="0.25"/>
            <rect x="${g.x + g.w - 1.3}" y="${cy - 3.2}" width="2.2" height="6.4" rx="0.9" fill="url(#${ids.rim})" stroke="#000" stroke-opacity="0.4" stroke-width="0.25"/>`;
    }
    if (g.kind === 'trifold') {
        [1, 2].forEach(function (i) {
            const cx = g.x + (g.w / 3) * i;
            out += `<rect x="${cx - 1.2}" y="${g.y + 2}" width="2.4" height="${g.h - 4}" fill="#000" opacity="0.22"/>`;
        });
    }
    return out;
}

function renderSideButtons(g) {
    if (g.yr < 2007 || (g.kind !== 'bar' && g.kind !== 'qwerty' && g.kind !== 'fold')) return '';
    const col = g.material === 'plastic' ? '#555' : '#8a8a8a';
    const yv = g.y + g.h * 0.20;
    const left = g.kind === 'fold' ? '' : `
        <rect x="${g.x - 1.2}" y="${yv}" width="1.6" height="7" rx="0.6" fill="${col}"/>
        <rect x="${g.x - 1.2}" y="${yv + 10}" width="1.6" height="7" rx="0.6" fill="${col}"/>`;
    return left + `<rect x="${g.x + g.w - 0.4}" y="${g.y + g.h * 0.28}" width="1.6" height="11" rx="0.6" fill="${col}"/>`;
}

function renderAntenna(g, hex) {
    if (g.kind === 'pda') {
        return `<rect x="${g.x + g.w - 11}" y="${g.y - 4.5}" width="3.4" height="7" rx="1.4" fill="${shadeHex(hex, -18)}" stroke="#000" stroke-opacity="0.4" stroke-width="0.3"/>`;
    }
    if (g.popup) {
        const cx = g.x + g.w / 2;
        return `<rect x="${cx - 7}" y="${g.y - 3.6}" width="14" height="7" rx="2" fill="${shadeHex(hex, -10)}" stroke="#000" stroke-opacity="0.45" stroke-width="0.35"/>
            <circle cx="${cx - 2.4}" cy="${g.y - 1}" r="1.5" fill="#0a0d14" stroke="#555" stroke-width="0.3"/>
            <circle cx="${cx - 2.7}" cy="${g.y - 1.3}" r="0.4" fill="#fff" opacity="0.7"/>
            <circle cx="${cx + 3.2}" cy="${g.y - 1}" r="0.8" fill="#fff4d1" opacity="0.9"/>`;
    }
    if (g.kind !== 'bar' || g.yr >= 2003) return '';
    return `<rect x="${g.x + g.w - 13}" y="${g.y - 6}" width="5" height="8" rx="2.2" fill="${shadeHex(hex, -12)}" stroke="#000" stroke-opacity="0.35" stroke-width="0.3"/>`;
}

// ============================================================
// KEYPAD & KEYBOARD (era keypad / qwerty / slider / flip)
// ============================================================
function keyColors(hex) {
    const light = lum(hex) > 140;
    return {
        fill: light ? shadeHex(hex, -14) : shadeHex(hex, 20),
        hi: light ? shadeHex(hex, 6) : shadeHex(hex, 38),
        txt: light ? '#222' : '#e6e6e6'
    };
}

function renderKeypad(x, top, w, bottom, hex, style, withNav) {
    const k = keyColors(hex);
    const cx = x + w / 2;
    let out = '';
    let navH = 0;
    if (withNav) {
        navH = style === 'mono' ? 15 : (style === 'multi' ? 22 : 20);
        const ny = top + navH / 2;
        if (style === 'mono') {
            out += `<rect x="${cx - 9}" y="${ny - 3.4}" width="18" height="6.8" rx="3.4" fill="${k.fill}" stroke="#000" stroke-opacity="0.35" stroke-width="0.3"/>
                <rect x="${cx - 8}" y="${ny - 2.4}" width="16" height="2.2" rx="1.1" fill="${k.hi}" opacity="0.5"/>
                <rect x="${cx - 19}" y="${ny - 2.6}" width="7" height="5.2" rx="2.6" fill="${k.fill}" stroke="#000" stroke-opacity="0.35" stroke-width="0.3"/>
                <rect x="${cx + 12}" y="${ny - 2.6}" width="7" height="5.2" rx="2.6" fill="${k.fill}" stroke="#000" stroke-opacity="0.35" stroke-width="0.3"/>
                <text x="${cx + 15.5}" y="${ny + 1}" text-anchor="middle" font-size="2.6" font-family="sans-serif" font-weight="700" fill="${k.txt}">C</text>`;
        } else {
            const r = style === 'multi' ? 8 : 7;
            out += `<circle cx="${cx}" cy="${ny}" r="${r}" fill="${k.fill}" stroke="#000" stroke-opacity="0.4" stroke-width="0.35"/>
                <circle cx="${cx}" cy="${ny}" r="${r * 0.42}" fill="${k.hi}" stroke="#000" stroke-opacity="0.3" stroke-width="0.25"/>
                <path d="M${cx - 1.2} ${ny - r * 0.78} l1.2 -1.1 l1.2 1.1 z M${cx - 1.2} ${ny + r * 0.78} l1.2 1.1 l1.2 -1.1 z" fill="${k.txt}" opacity="0.6"/>
                <rect x="${cx - r - 11}" y="${ny - 6.6}" width="9" height="4" rx="1.6" fill="${k.fill}" stroke="#000" stroke-opacity="0.35" stroke-width="0.3"/>
                <rect x="${cx + r + 2}" y="${ny - 6.6}" width="9" height="4" rx="1.6" fill="${k.fill}" stroke="#000" stroke-opacity="0.35" stroke-width="0.3"/>
                <rect x="${cx - r - 11}" y="${ny + 2.6}" width="9" height="4" rx="1.6" fill="#2e9d4f" stroke="#000" stroke-opacity="0.35" stroke-width="0.3"/>
                <rect x="${cx + r + 2}" y="${ny + 2.6}" width="9" height="4" rx="1.6" fill="#c0392b" stroke="#000" stroke-opacity="0.35" stroke-width="0.3"/>`;
        }
    }
    const kt = top + navH + (withNav ? 2 : 0);
    const gap = style === 'multi' ? 0.9 : 1.4;
    const kw = (w - gap * 2) / 3;
    const kh = (bottom - kt - gap * 3) / 4;
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
    const rx = style === 'mono' ? kh * 0.45 : (style === 'multi' ? 1.2 : 1.8);
    digits.forEach(function (d, i) {
        const c = i % 3, r = Math.floor(i / 3);
        const kx = x + c * (kw + gap), ky = kt + r * (kh + gap);
        out += `<rect x="${kx}" y="${ky}" width="${kw}" height="${kh}" rx="${rx}" fill="${k.fill}" stroke="#000" stroke-opacity="0.35" stroke-width="0.3"/>
            <rect x="${kx + 0.6}" y="${ky + 0.5}" width="${kw - 1.2}" height="${kh * 0.38}" rx="${rx * 0.7}" fill="${k.hi}" opacity="0.45"/>
            <text x="${kx + kw / 2}" y="${ky + kh * 0.7}" text-anchor="middle" font-size="${Math.min(kh * 0.62, 3.4)}" font-family="sans-serif" font-weight="700" fill="${k.txt}">${d}</text>`;
    });
    return out;
}

function renderQwerty(g, scr, hex) {
    return qwertyKeys(g.x + 4.5, scr.y + scr.h + 3, g.w - 9, g.y + g.h - 5, hex, true);
}

// Blok keyboard QWERTY generik (bar QWERTY, slider touch, communicator).
function qwertyKeys(x, top, w, bottom, hex, withNav) {
    const k = keyColors(hex);
    const cx = x + w / 2;
    let out = '';
    const navY = withNav ? top + 4.5 : top - 2;
    if (withNav) out += `<circle cx="${cx}" cy="${navY}" r="3.4" fill="${k.fill}" stroke="#000" stroke-opacity="0.45" stroke-width="0.35"/>
        <circle cx="${cx - 0.9}" cy="${navY - 0.9}" r="1" fill="#fff" opacity="0.25"/>`;
    if (withNav) [[x, '#2e9d4f'], [x + 10, k.fill], [x + w - 20, k.fill], [x + w - 10, '#c0392b']].forEach(function (p) {
        out += `<rect x="${p[0]}" y="${navY - 2.2}" width="9" height="4.4" rx="2" fill="${p[1]}" stroke="#000" stroke-opacity="0.35" stroke-width="0.3"/>`;
    });
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    const kt = withNav ? navY + 5 : top;
    const gap = 0.7;
    const kh = (bottom - kt - gap * 2) / 3;
    const kw = (w - gap * 9) / 10;
    rows.forEach(function (row, ri) {
        const off = (10 - row.length) * (kw + gap) / 2;
        row.split('').forEach(function (ch, ci) {
            const kx = x + off + ci * (kw + gap), ky = kt + ri * (kh + gap);
            out += `<rect x="${kx}" y="${ky}" width="${kw}" height="${kh}" rx="${kh * 0.38}" fill="${k.fill}" stroke="#000" stroke-opacity="0.3" stroke-width="0.25"/>
                <text x="${kx + kw / 2}" y="${ky + kh * 0.68}" text-anchor="middle" font-size="${Math.min(kh * 0.55, 2.5)}" font-family="sans-serif" font-weight="700" fill="${k.txt}">${ch}</text>`;
        });
    });
    return out;
}

function renderKeysForKind(g, scr, hex, spec) {
    if (g.kind === 'qwerty') return renderQwerty(g, scr, hex);
    if (g.kind === 'communicator') {
        return qwertyKeys(g.x + 5, g.low.y + 2.5, g.w - 10, g.low.y + g.low.h - 2.5, hex, false);
    }
    if (g.kind === 'swivel') {
        return renderKeypad(g.x + 7, g.low.y + 5, g.w - 14, g.low.y + g.low.h - 5, hex, g.yr < 2007 ? 'color' : 'multi', true);
    }
    if (g.kind === 'pda') {
        const cx = g.x + g.w / 2, y0 = scr.y + scr.h + 5, k = keyColors(hex);
        let out = `<circle cx="${cx}" cy="${y0 + 7}" r="5.4" fill="${k.fill}" stroke="#000" stroke-opacity="0.4" stroke-width="0.35"/>
            <circle cx="${cx}" cy="${y0 + 7}" r="2.2" fill="${k.hi}" stroke="#000" stroke-opacity="0.3" stroke-width="0.25"/>
            <rect x="${g.x + 5}" y="${y0 + 2}" width="9" height="4.4" rx="2" fill="#2e9d4f" stroke="#000" stroke-opacity="0.35" stroke-width="0.3"/>
            <rect x="${g.x + g.w - 14}" y="${y0 + 2}" width="9" height="4.4" rx="2" fill="#c0392b" stroke="#000" stroke-opacity="0.35" stroke-width="0.3"/>`;
        [0, 1, 2, 3].forEach(function (i) {
            const bx = g.x + 6 + i * ((g.w - 12 - 6) / 3);
            out += `<rect x="${bx}" y="${y0 + 13.5}" width="6" height="4" rx="1.6" fill="${k.fill}" stroke="#000" stroke-opacity="0.35" stroke-width="0.3"/>`;
        });
        return out;
    }
    if (g.kind === 'slider' && g.keys === 'qwerty') {
        return qwertyKeys(g.x + 4, g.y + g.h + 3.5, g.w - 8, g.low.y + g.low.h - 4, hex, false);
    }
    if (g.kind === 'slider') {
        return renderKeypad(g.x + 8, g.low.y + 6, g.w - 22, g.low.y + g.low.h - 6, hex, 'color', false);
    }
    if (g.kind === 'flip') {
        return renderKeypad(g.x + 6, g.low.y + 5, g.w - 12, g.low.y + g.low.h - 5, hex, g.yr < 2003 ? 'mono' : 'color', true);
    }
    if (g.kind === 'bar' && g.yr < 2007) {
        const style = g.yr < 2003 ? 'mono' : (g.yr < 2005 ? 'color' : 'multi');
        const pad = g.w * 0.13;
        return renderKeypad(g.x + pad, scr.y + scr.h + 4.5, g.w - pad * 2, g.y + g.h - 7, hex, style, true);
    }
    return '';
}

// ============================================================
// FACE: pelat wajah (keypad) / kaca depan (touch), speaker, kamera depan
// ============================================================
function bezelPx(spec) {
    const b = spec.bezel;
    return b === 'thick' ? 3 : b === 'medium' ? 2.2 : b === 'thin' ? 1.6 : b === 'minimal' ? 1.2 : 0.9;
}

function renderFace(g, scr, spec, hex, brand) {
    const retro = g.yr < 2007 && g.kind !== 'fold' && g.kind !== 'trifold';
    if (retro) {
        const pad = 1.6;
        let out = '';
        const faceRect = function (x, y, w, h, rx) {
            return `<rect x="${x + pad}" y="${y + pad}" width="${w - pad * 2}" height="${h - pad * 2}" rx="${Math.max(1, rx - pad)}" fill="${shadeHex(hex, 7)}" opacity="0.55" stroke="#000" stroke-opacity="0.12" stroke-width="0.25"/>`;
        };
        if (g.kind === 'slider') out += faceRect(g.x + 3, g.low.y, g.w - 6, g.low.h, 7) + faceRect(g.x, g.y, g.w, g.h, g.rx);
        else if (g.kind === 'flip') out += faceRect(g.x, g.low.y, g.w, g.low.h, g.rx) + faceRect(g.x, g.y, g.w, g.h, g.rx);
        else out += faceRect(g.x, g.y, g.w, g.h, g.rx);
        const cx = g.x + g.w / 2;
        out += `<rect x="${cx - 5}" y="${g.y + 5}" width="10" height="1.2" rx="0.6" fill="#1a1a1a" opacity="0.7"/>`;
        if (g.kind === 'bar') {
            out += `<text x="${cx}" y="${scr.y - 3}" text-anchor="middle" font-size="2.4" font-family="sans-serif" font-weight="700" letter-spacing="0.5" fill="${lum(hex) > 140 ? '#333' : '#ddd'}" opacity="0.8">${brand}</text>`;
        }
        // bingkai layar
        out += `<rect x="${scr.x - 1.3}" y="${scr.y - 1.3}" width="${scr.w + 2.6}" height="${scr.h + 2.6}" rx="${scr.cornerRadius + 1.3}" fill="#0b0b0b" stroke="#000" stroke-opacity="0.5" stroke-width="0.3"/>`;
        return out;
    }
    // era sentuh: kaca depan hitam
    const bz = bezelPx(spec);
    let out = '';
    const glass = function (x, y, w, h, rx) {
        return `<rect x="${x + bz}" y="${y + bz}" width="${w - bz * 2}" height="${h - bz * 2}" rx="${Math.max(1.5, rx - bz)}" fill="#050505"/>`;
    };
    if (g.kind === 'slider') out += glass(g.x, g.y, g.w, g.h, g.rx);
    else if (g.kind === 'flip') out += glass(g.x, g.y, g.w, g.h, g.rx) + glass(g.x, g.low.y, g.w, g.low.h, g.rx);
    else out += glass(g.x, g.y, g.w, g.h, g.rx);

    const cx = g.x + g.w / 2;
    const topGap = scr.y - g.y;
    const hasCutout = spec.notch && spec.notch !== 'none';
    if (g.kind === 'bar' && !hasCutout && topGap > 5) {
        const sy = g.y + Math.min(4.2, topGap * 0.45);
        out += `<rect x="${cx - 4.5}" y="${sy}" width="9" height="1.1" rx="0.55" fill="#222"/>`;
        if (g.yr >= 2010 && g.yr < 2017) out += `<circle cx="${cx + 8}" cy="${sy + 0.55}" r="0.9" fill="#10151f" stroke="#2a2f3a" stroke-width="0.2"/>`;
    }
    return out;
}

function renderNotchLayer(spec, scr, g) {
    const notch = spec.notch || 'none';
    if (notch === 'none') return '';
    if (g && (g.popup || g.kind === 'dual' || g.kind === 'communicator')) return '';
    const cx = scr.x + scr.w / 2;
    const top = scr.y;
    if (notch === 'notch') {
        const w = scr.w * 0.5, hh = 3.8, r = 1.9;
        return `<path d="M ${cx - w / 2} ${top} h ${w} v ${hh - r} q 0 ${r} -${r} ${r} h -${w - 2 * r} q -${r} 0 -${r} -${r} z" fill="#000"/>
            <rect x="${cx - 2.6}" y="${top + 1}" width="5.2" height="0.7" rx="0.35" fill="#262626"/>
            <circle cx="${cx + 4.4}" cy="${top + 1.5}" r="0.7" fill="#15202c"/>`;
    }
    if (notch === 'teardrop') {
        return `<path d="M ${cx - 3.6} ${top} Q ${cx - 3.2} ${top + 3.4} ${cx} ${top + 3.4} Q ${cx + 3.2} ${top + 3.4} ${cx + 3.6} ${top} Z" fill="#000"/>
            <circle cx="${cx}" cy="${top + 1.6}" r="0.7" fill="#15202c"/>`;
    }
    if (notch === 'punch_hole_center') {
        return `<circle cx="${cx}" cy="${top + 2.2}" r="1.3" fill="#000" stroke="#222" stroke-width="0.25"/><circle cx="${cx}" cy="${top + 2.2}" r="0.5" fill="#142033"/>`;
    }
    if (notch === 'punch_hole_left') {
        return `<circle cx="${scr.x + 4}" cy="${top + 2.2}" r="1.3" fill="#000" stroke="#222" stroke-width="0.25"/><circle cx="${scr.x + 4}" cy="${top + 2.2}" r="0.5" fill="#142033"/>`;
    }
    if (notch === 'dynamic_island') {
        const w = Math.min(15, scr.w * 0.3), hh = 3.4;
        return `<rect x="${cx - w / 2}" y="${top + 1.6}" width="${w}" height="${hh}" rx="${hh / 2}" fill="#000"/>
            <circle cx="${cx + w / 2 - 2}" cy="${top + 1.6 + hh / 2}" r="0.7" fill="#13202e"/>`;
    }
    if (notch === 'under_display') {
        return `<circle cx="${cx}" cy="${top + 2.4}" r="1.1" fill="#000" opacity="0.22"/>`;
    }
    return '';
}

function renderHomeLayer(spec, g, scr) {
    if (g.kind !== 'bar' || g.yr < 2007) return '';
    const hb = spec.homeButton;
    const cx = g.x + g.w / 2;
    const bb = g.y + g.h - (scr.y + scr.h);
    const cy = scr.y + scr.h + bb / 2;
    if (hb === 'circle') {
        const r = Math.min(4.2, bb * 0.34);
        return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0c0c0c" stroke="#3a3a3a" stroke-width="0.4"/>
            <rect x="${cx - r * 0.38}" y="${cy - r * 0.38}" width="${r * 0.76}" height="${r * 0.76}" rx="${r * 0.18}" fill="none" stroke="#555" stroke-width="0.3"/>`;
    }
    if (hb === 'fingerprint') {
        const r = Math.min(4, bb * 0.34);
        return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0a0a0a" stroke="#b8a77a" stroke-width="0.5"/>
            <circle cx="${cx}" cy="${cy}" r="${r * 0.6}" fill="none" stroke="#2c2c2c" stroke-width="0.25"/>`;
    }
    if (hb === 'touch_bar') {
        return `<rect x="${cx - 5}" y="${cy - 1.8}" width="10" height="3.6" rx="1.8" fill="#0c0c0c" stroke="#444" stroke-width="0.35"/>
            <circle cx="${cx - 14}" cy="${cy}" r="0.8" fill="#fff" opacity="0.35"/>
            <circle cx="${cx + 14}" cy="${cy}" r="0.8" fill="#fff" opacity="0.35"/>`;
    }
    if (hb === 'gesture_bar') {
        return `<rect x="${cx - 6}" y="${scr.y + scr.h - 2.6}" width="12" height="0.8" rx="0.4" fill="#fff" opacity="0.7"/>`;
    }
    return '';
}

function renderReflectionLayer(scr, uid, yr) {
    const a = yr < 2007 ? 0.07 : (yr >= 2017 ? 0.05 : 0.15);
    return `
        <defs>
            <linearGradient id="refl_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fff" stop-opacity="${a}"/>
                <stop offset="38%" stop-color="#fff" stop-opacity="0.02"/>
                <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
            </linearGradient>
        </defs>
        <rect x="${scr.x}" y="${scr.y}" width="${scr.w}" height="${scr.h * 0.6}" rx="${scr.cornerRadius}" fill="url(#refl_${uid})" pointer-events="none"/>
        <path d="M${scr.x + scr.w * 0.12} ${scr.y} L${scr.x + scr.w * 0.34} ${scr.y} L${scr.x + scr.w * 0.12} ${scr.y + scr.h * 0.5} L${scr.x} ${scr.y + scr.h * 0.5} Z" fill="#fff" opacity="${yr < 2007 ? 0.04 : (yr >= 2017 ? 0.025 : 0.07)}" pointer-events="none"/>
    `;
}

function renderCrease(g, scr) {
    if (!g.crease || g.book) return '';
    const cy = scr.y + scr.h / 2;
    return `<rect x="${scr.x}" y="${cy - 0.5}" width="${scr.w}" height="1" fill="#000" opacity="0.28"/>
        <rect x="${scr.x}" y="${cy + 0.5}" width="${scr.w}" height="0.4" fill="#fff" opacity="0.08"/>`;
}

// Highlight kaca melengkung di sisi kiri-kanan layar (bentuk Edge).
function renderEdgeLayer(g, scr, uid) {
    if (!g.edge) return '';
    const y = scr.y + 4, h = scr.h - 8;
    return `<defs>
            <linearGradient id="edgeL_${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0.75"/><stop offset="0.35" stop-color="#7fb4ff" stop-opacity="0.22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
            <linearGradient id="edgeR_${uid}" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0.6"/><stop offset="0.35" stop-color="#7fb4ff" stop-opacity="0.18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        </defs>
        <rect x="${scr.x}" y="${y}" width="4.2" height="${h}" rx="2" fill="url(#edgeL_${uid})"/>
        <rect x="${scr.x + scr.w - 4.2}" y="${y}" width="4.2" height="${h}" rx="2" fill="url(#edgeR_${uid})"/>`;
}

// Layar landscape lebar (communicator): bar judul + daftar + panel ikon.
function screenWide(r, uid, brand, style) {
    const x0 = r.x, y0 = r.y, w = r.w, h = r.h;
    const mono = style === 'monochrome';
    const tft = style === 'color_tft';
    const bg = mono ? ['#a8bf80', '#8ca768'] : tft ? ['#2b6cb8', '#0b1f3d'] : ['#1b2a44', '#0a1220'];
    const ink = mono ? '#1c2a10' : '#e8f1ff';
    const bar = mono ? '#1c2a10' : (tft ? '#06132a' : '#050a14');
    let icons = '';
    if (!mono) {
        for (let i = 0; i < 5; i++) icons += appIcon(x0 + w * 0.46 + i * 8.6, y0 + h * 0.42, 6.4, ICON_COLORS[i], true);
    }
    let lines = '';
    for (let i = 0; i < 4; i++) {
        lines += `<rect x="${x0 + 3}" y="${y0 + 6.4 + i * 3.8}" width="${w * (mono ? 0.78 : 0.34) - (i % 2) * 6}" height="1.5" rx="0.6" fill="${ink}" opacity="${mono ? 0.8 : 0.55}"/>`;
    }
    return `
        <defs><linearGradient id="wide_${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient>
            <pattern id="px_${uid}w" width="0.7" height="0.7" patternUnits="userSpaceOnUse"><path d="M0.7 0H0V0.7" fill="none" stroke="#000" stroke-opacity="0.14" stroke-width="0.12"/></pattern></defs>
        <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="url(#wide_${uid})"/>
        <rect x="${x0}" y="${y0}" width="${w}" height="3.6" fill="${bar}" opacity="0.85"/>
        ${sigBars(x0 + 1.5, y0 + 0.3, mono ? '#b9cf92' : '#bcd8ff')}
        <text x="${x0 + w / 2}" y="${y0 + 2.8}" text-anchor="middle" font-size="2.3" font-family="sans-serif" font-weight="700" fill="${mono ? '#b9cf92' : '#bcd8ff'}">${brand}</text>
        ${batt(x0 + w - 1.5, y0 + 0.8, mono ? '#b9cf92' : '#bcd8ff')}
        ${lines}${icons}
        <rect x="${x0}" y="${y0 + h - 3.4}" width="${w}" height="3.4" fill="${bar}" opacity="0.9"/>
        <text x="${x0 + 1.6}" y="${y0 + h - 1}" font-size="2" font-family="sans-serif" font-weight="700" fill="${mono ? '#b9cf92' : '#9ec5ff'}">${_scr('phone.mock.menu', 'Menu', 'Menu')}</text>
        <text x="${x0 + w - 1.6}" y="${y0 + h - 1}" text-anchor="end" font-size="2" font-family="sans-serif" font-weight="700" fill="${mono ? '#b9cf92' : '#9ec5ff'}">${_scr('phone.mock.names', 'Nama', 'Names')}</text>
        ${mono ? `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="url(#px_${uid}w)" opacity="1"/>` : ''}`;
}

// ============================================================
// BACK VIEW
// ============================================================
function lensSvg(cx, cy, r) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#2a2c32" stroke="#9097a0" stroke-width="${r * 0.14}"/>
        <circle cx="${cx}" cy="${cy}" r="${r * 0.62}" fill="#090c14"/>
        <circle cx="${cx}" cy="${cy}" r="${r * 0.38}" fill="#1d3557"/>
        <circle cx="${cx - r * 0.22}" cy="${cy - r * 0.22}" r="${r * 0.14}" fill="#fff" opacity="0.75"/>`;
}

// Lensa premium: cincin logam di luar lensa biasa.
function lensRing(cx, cy, r) {
    return `<circle cx="${cx}" cy="${cy}" r="${r * 1.2}" fill="#0a0b0f" stroke="#c9ced6" stroke-opacity="0.85" stroke-width="${r * 0.16}"/>` +
        lensSvg(cx, cy, r) +
        `<circle cx="${cx}" cy="${cy}" r="${r * 0.82}" fill="none" stroke="#6ea8ff" stroke-opacity="0.35" stroke-width="${r * 0.08}"/>`;
}

// Kotak modul kamera belakang per era (dipakai kamera & sensor LiDAR).
function cameraBox(T, n, yr) {
    const k = Math.max(1, Math.min(4, n));
    if (yr >= 2025) return { x: T.x + 3, y: T.y + 6, w: T.w - 6, h: 13 };
    if (yr >= 2022) {
        const s = T.w * ({ 1: 0.42, 2: 0.48, 3: 0.56, 4: 0.6 })[k];
        return { x: T.x + 5, y: T.y + 5, w: s, h: s };
    }
    const s = T.w * ({ 1: 0.30, 2: 0.36, 3: 0.42, 4: 0.44 })[k];
    return { x: T.x + 7, y: T.y + 7, w: s, h: s };
}

function flashSvg(cx, cy, r) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff4d1" stroke="#aaa" stroke-width="0.25"/>`;
}

function resolveLensCount(cameraId, spec) {
    if (!cameraId || cameraId === 'none') return 0;
    const comp = getComponentById(cameraId);
    const tier = (comp && comp.tier) || 1;
    const base = (spec.cameras && spec.cameras.rear) || 1;
    let n = tier >= 4 ? base : (tier === 3 ? Math.min(base, 2) : 1);
    if (cameraId === 'cam_dual') n = Math.max(n, 2);
    if (cameraId === 'cam_triple') n = Math.max(n, 3);
    if (cameraId === 'cam_200mp') n = Math.max(n, 4);
    return Math.max(1, Math.min(4, n));
}

function renderRearCamera(T, n, yr, hex, spec) {
    if (n <= 0) return '';
    const L = T.x + 7, Tp = T.y + 7;
    const flash = spec.cameras && spec.cameras.flash;
    if (yr < 2007) {
        const cx = T.x + T.w / 2, cy = T.y + 15, r = yr < 2005 ? 2.2 : 3.2;
        return lensSvg(cx, cy, r) + (yr >= 2005 ? flashSvg(cx + r + 3.6, cy, 1.2) : '');
    }
    if (yr < 2015) {
        const center = spec.cameras && spec.cameras.position === 'top_center';
        const cx = center ? T.x + T.w / 2 - 3 : L + 3.4, cy = Tp + 3.6;
        return lensSvg(cx, cy, 3.2) + (n >= 2 ? lensSvg(cx + 8, cy, 3.2) : '') + (flash ? flashSvg(cx + (n >= 2 ? 15 : 7.2), cy, 1.2) : '');
    }
    if (yr < 2017) {
        const w = n >= 2 ? 25 : 12;
        return `<rect x="${L}" y="${Tp}" width="${w}" height="9.4" rx="4.7" fill="#0c0c10" stroke="#555" stroke-width="0.3"/>` +
            lensSvg(L + 4.7, Tp + 4.7, 3.1) + (n >= 2 ? lensSvg(L + w - 4.7, Tp + 4.7, 3.1) : '') +
            (flash ? flashSvg(L + w + 3.2, Tp + 4.7, 1.2) : '');
    }
    if (yr < 2019) {
        const hh = n >= 2 ? 20 : 10;
        return `<rect x="${L}" y="${Tp}" width="9.6" height="${hh}" rx="4.8" fill="#0c0c10" stroke="#555" stroke-width="0.3"/>` +
            lensSvg(L + 4.8, Tp + 4.8, 3.1) + (n >= 2 ? lensSvg(L + 4.8, Tp + 15.2, 3.1) : '') +
            (flash ? flashSvg(L + 13.2, Tp + 4.8, 1.2) : '');
    }
    // 2022-2023: pelat kaca frosted besar, lensa bercincin logam.
    if (yr >= 2022 && yr < 2025) {
        const bx = cameraBox(T, n, yr);
        const lightB = lum(hex) > 140;
        const glassC = lightB ? shadeHex(hex, -16) : shadeHex(hex, 20);
        const inner = lightB ? shadeHex(hex, -6) : shadeHex(hex, 8);
        const k = Math.max(1, Math.min(4, n));
        const posS = k === 1 ? [[0.5, 0.5]] : k === 2 ? [[0.5, 0.3], [0.5, 0.7]] :
            k === 3 ? [[0.3, 0.3], [0.3, 0.7], [0.7, 0.5]] : [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]];
        const rr = bx.w * (k === 1 ? 0.24 : k >= 4 ? 0.15 : 0.18);
        return `<rect x="${bx.x}" y="${bx.y}" width="${bx.w}" height="${bx.h}" rx="${bx.w * 0.26}" fill="${glassC}" stroke="${shadeHex(glassC, 30)}" stroke-width="0.45"/>` +
            `<rect x="${bx.x + 1}" y="${bx.y + 1}" width="${bx.w - 2}" height="${bx.h - 2}" rx="${bx.w * 0.22}" fill="${inner}" opacity="0.9"/>` +
            `<path d="M ${bx.x + bx.w * 0.26} ${bx.y} H ${bx.x + bx.w * 0.74} Q ${bx.x + bx.w} ${bx.y} ${bx.x + bx.w} ${bx.y + bx.w * 0.26} V ${bx.y + bx.h * 0.42} H ${bx.x} V ${bx.y + bx.w * 0.26} Q ${bx.x} ${bx.y} ${bx.x + bx.w * 0.26} ${bx.y} Z" fill="#fff" opacity="${lightB ? 0.2 : 0.09}"/>` +
            posS.map(function (p) { return lensRing(bx.x + bx.w * p[0], bx.y + bx.h * p[1], rr); }).join('') +
            (flash ? flashSvg(bx.x + bx.w - 3.2, bx.y + bx.h + 3.2, 1.3) : '');
    }
    // 2025+: "visor" kamera selebar bodi, lensa berjajar rapi.
    if (yr >= 2025) {
        const bx = cameraBox(T, n, yr);
        const k = Math.max(1, Math.min(4, n));
        const lightB = lum(hex) > 140;
        const bar = lightB ? '#15161b' : shadeHex(hex, -26);
        const rr = k === 1 ? 4.6 : 3.5;
        const step = 11.4;
        let o = `<rect x="${bx.x}" y="${bx.y}" width="${bx.w}" height="${bx.h}" rx="${bx.h / 2}" fill="${bar}" stroke="${shadeHex(bar, 40)}" stroke-width="0.4"/>` +
            `<rect x="${bx.x + 1.2}" y="${bx.y + 0.9}" width="${bx.w - 2.4}" height="${bx.h * 0.38}" rx="${bx.h * 0.19}" fill="#fff" opacity="0.1"/>`;
        for (let i = 0; i < k; i++) {
            o += lensRing(bx.x + bx.w / 2 + (i - (k - 1) / 2) * step, bx.y + bx.h / 2, rr);
        }
        o += `<circle cx="${bx.x + 5.2}" cy="${bx.y + bx.h / 2}" r="0.8" fill="#000" opacity="0.7"/>`;
        if (flash) o += flashSvg(bx.x + bx.w - 6, bx.y + bx.h / 2, 1.5);
        return o;
    }
    const scale = { 1: 0.30, 2: 0.36, 3: 0.42, 4: 0.44 }[n] * (yr >= 2023 ? 1.05 : 1);
    const size = T.w * scale;
    const light = lum(hex) > 140;
    const plate = light ? shadeHex(hex, -9) : shadeHex(hex, 14);
    const pos = n === 1 ? [[0.5, 0.5]] :
        n === 2 ? [[0.33, 0.32], [0.67, 0.68]] :
        n === 3 ? [[0.32, 0.30], [0.32, 0.70], [0.70, 0.5]] :
                  [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]];
    const r = size * (n === 1 ? 0.28 : n === 4 ? 0.17 : 0.2);
    // Modul kaca modern: plat dengan kilau atas (glass sheen) dan tepi halus.
    return `<rect x="${L}" y="${Tp}" width="${size}" height="${size}" rx="${size * 0.24}" fill="${plate}" stroke="${shadeHex(plate, 25)}" stroke-width="0.4"/>` +
        `<path d="M ${L + size * 0.24} ${Tp} H ${L + size * 0.76} Q ${L + size} ${Tp} ${L + size} ${Tp + size * 0.24} V ${Tp + size * 0.5} H ${L} V ${Tp + size * 0.24} Q ${L} ${Tp} ${L + size * 0.24} ${Tp} Z" fill="#fff" opacity="${light ? 0.22 : 0.10}"/>` +
        pos.map(function (p) { return lensSvg(L + size * p[0], Tp + size * p[1], r); }).join('') +
        (flash ? flashSvg(L + size + 3.4, Tp + 3.4, 1.3) + `<circle cx="${L + size + 3.4}" cy="${Tp + 8}" r="0.7" fill="#111"/>` : '');
}

// Sensor belakang (sidik jari di bawah modul kamera, LiDAR di modul).
// Hanya digambar bila riset sensornya sudah selesai (lihat resolveSensorVisuals).
function renderRearSensors(T, yr, n, sensors) {
    if (!sensors) return '';
    let out = '';
    if (sensors.fpRear) {
        const cx = T.x + T.w / 2, cy = T.y + T.h * 0.74, r = T.w * 0.1;
        out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#000" fill-opacity="0.16" stroke="#000" stroke-opacity="0.35" stroke-width="0.4"/>
            <circle cx="${cx}" cy="${cy}" r="${r * 0.62}" fill="none" stroke="#000" stroke-opacity="0.22" stroke-width="0.3"/>`;
    }
    if (sensors.lidar) {
        let cx, cy;
        if (yr >= 2019) {
            // modul kamera modern: LiDAR di bawah modul, sejajar sisi kiri
            const bx = cameraBox(T, n, yr);
            cx = bx.x + (yr >= 2025 ? 5 : bx.w * 0.5);
            cy = bx.y + bx.h + 5.5;
        } else {
            cx = T.x + T.w / 2;
            cy = T.y + 22;
        }
        out += `<circle cx="${cx}" cy="${cy}" r="2" fill="#0b0b0f" stroke="#666" stroke-width="0.35"/>
            <circle cx="${cx}" cy="${cy}" r="0.8" fill="#1d2a44"/>`;
    }
    return out;
}

// Sidik jari dalam layar: cincin samar di bawah tengah layar (tampak depan).
function renderInDisplayFingerprint(scr, sensors) {
    if (!sensors || !sensors.fpInDisplay) return '';
    const cx = scr.x + scr.w / 2, cy = scr.y + scr.h * 0.955, r = scr.w * 0.07;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" fill-opacity="0.06" stroke="#ffffff" stroke-opacity="0.35" stroke-width="0.35"/>`;
}

function renderBackView(g, spec, ids, hex, brand, n, sensors) {
    const T = { x: g.x, y: g.ty, w: g.w, h: g.th, rx: g.rx };
    const mat = g.material, yr = g.yr;
    const light = lum(hex) > 140;
    const ink = light ? '#000' : '#fff';
    let out = bodyShape(T.x, T.y, T.w, T.h, T.rx, ids, mat);

    if (yr < 2007) {
        // tutup baterai + grille speaker
        out += `<rect x="${T.x + 3}" y="${T.y + 3}" width="${T.w - 6}" height="${T.h - 6}" rx="${T.rx - 2}" fill="none" stroke="#000" stroke-opacity="0.22" stroke-width="0.4"/>
            <rect x="${T.x + T.w / 2 - 9}" y="${T.y + T.h - 14}" width="18" height="6" rx="1.2" fill="#fff" opacity="0.5" stroke="#000" stroke-opacity="0.2" stroke-width="0.25"/>
            ${[0, 1, 2, 3, 4].map(function (i) { return `<circle cx="${T.x + T.w / 2 - 6 + i * 3}" cy="${T.y + T.h - 22}" r="0.6" fill="#000" opacity="0.5"/>`; }).join('')}`;
    } else if (mat === 'aluminum' && yr >= 2011) {
        out += `<rect x="${T.x + 1}" y="${T.y + 12}" width="${T.w - 2}" height="0.7" fill="#000" opacity="0.35"/>
            <rect x="${T.x + 1}" y="${T.y + T.h - 12}" width="${T.w - 2}" height="0.7" fill="#000" opacity="0.35"/>`;
    }
    if (mat === 'glass' || mat === 'titanium') {
        out += `<path d="M ${T.x + 4} ${T.y + 2} L ${T.x + T.w * 0.62} ${T.y + 2} L ${T.x + 3} ${T.y + T.h * 0.5} Z" fill="#fff" opacity="${mat === 'glass' ? 0.1 : 0.05}"/>`;
    }
    if (g.book) {
        out += `<rect x="${T.x + 4}" y="${T.y + 3}" width="1" height="${T.h - 6}" fill="#000" opacity="0.3"/>`;
    } else if (g.kind === 'flip' || g.kind === 'slider' || g.hinge) {
        out += `<rect x="${T.x + 2}" y="${T.y + T.h * 0.5 - 0.5}" width="${T.w - 4}" height="1" fill="#000" opacity="0.3"/>`;
    }
    if (g.kind === 'dual' || g.kind === 'fold' || g.kind === 'trifold') {
        out += `<rect x="${T.x + T.w / 2 - 0.6}" y="${T.y + 2}" width="1.2" height="${T.h - 4}" fill="#000" opacity="0.3"/>`;
    }
    if (g.kind === 'communicator') {
        out += `<rect x="${T.x + 2}" y="${T.y + 30.5}" width="${T.w - 4}" height="1" fill="#000" opacity="0.3"/>`;
    }
    if (g.hinge && !g.book) {
        // layar cover mungil di sisi luar (flip lipat vertikal); 2025+ di bawah visor kamera
        const cvY = yr >= 2025 ? T.y + 22 : T.y + 5;
        out += `<rect x="${T.x + T.w - 17}" y="${cvY}" width="12" height="14" rx="3.2" fill="#07090f" stroke="#555" stroke-width="0.3"/>
            <text x="${T.x + T.w - 11}" y="${cvY + 8}" text-anchor="middle" font-size="3.4" font-family="sans-serif" font-weight="700" fill="#cfe3ff">${phoneClockText()}</text>`;
    }
    out += renderRearCamera(T, n, yr, hex, spec);
    out += renderRearSensors(T, yr, n, sensors);
    if (brand) {
        const fs = yr < 2007 ? 2.6 : 4.2;
        const by = yr < 2007 ? T.y + T.h * 0.42 : T.y + T.h * 0.58;
        out += `<text x="${T.x + T.w / 2}" y="${by}" text-anchor="middle" font-size="${fs}" font-family="sans-serif" font-weight="700" letter-spacing="0.6" fill="${ink}" opacity="0.42">${brand}</text>`;
    }
    return out;
}

// ============================================================
// MAIN RENDER
// opts: size, year, showBrand, view ('front'|'back'),
//       isStatic, label (teks kecil di bawah ponsel)
// ============================================================
// Kotak batas bodi (unit viewBox) — dipakai opsi `fit` untuk meng-crop viewBox.
function getBounds(g) {
    if (g.kind === 'swivel') {
        const a = g.rot * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a);
        const px = g.pivot[0], py = g.pivot[1];
        let x0 = g.x, x1 = g.x + g.w, y0 = g.low.y + g.low.h, y1 = y0;
        [[g.x, g.y], [g.x + g.w, g.y], [g.x, g.y + g.h], [g.x + g.w, g.y + g.h]].forEach(function (pt) {
            const dx = pt[0] - px, dy = pt[1] - py;
            const rx = px + dx * c - dy * sn, ry = py + dx * sn + dy * c;
            x0 = Math.min(x0, rx); x1 = Math.max(x1, rx); y0 = Math.min(y0, ry);
        });
        return [x0 - 3, y0 - 4, x1 + 3, GROUND + 9];
    }
    const top = (typeof g.ty === 'number' ? g.ty : g.y) - (g.popup || g.kind === 'pda' ? 9 : 5);
    return [g.x - 3.5, top, g.x + g.w + 3.5, GROUND + 9];
}

// Layar depan: satu layar, dua layar (dual), atau layar lebar (communicator).
// Label generasi jaringan di status bar (mis. 4G, 5G), tepat di kanan ikon sinyal.
// Hanya digambar bila riset jaringan sudah selesai (lihat resolveNetworkLabel).
function renderNetworkLabel(scr, label) {
    if (!label) return '';
    return `<text x="${scr.x + 10.5}" y="${scr.y + 4.6}" font-size="3" font-family="sans-serif" font-weight="700" fill="#ffffff" fill-opacity="0.85">${_esc(label)}</text>`;
}

function renderScreens(g, scr, era, uid, brand, displayId, netLabel) {
    if (g.kind === 'dual') {
        const gap = 6.2, hw = (scr.w - gap) / 2;
        return [0, 1].map(function (i) {
            const r = { x: scr.x + i * (hw + gap), y: scr.y, w: hw, h: scr.h, cornerRadius: scr.cornerRadius };
            const id = uid + 'd' + i;
            return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${r.cornerRadius}" fill="#050505"/>
                <clipPath id="screenclip_${id}"><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${r.cornerRadius}"/></clipPath>
                <g clip-path="url(#screenclip_${id})">${screenContent(era.screenStyle, r, id, brand, displayId)}</g>
                ${renderReflectionLayer(r, id, g.yr)}`;
        }).join('');
    }
    const content = g.kind === 'communicator'
        ? screenWide(scr, uid, brand, era.screenStyle)
        : screenContent(era.screenStyle, scr, uid, brand, displayId);
    return `<rect x="${scr.x}" y="${scr.y}" width="${scr.w}" height="${scr.h}" rx="${scr.cornerRadius}" fill="#050505"/>
        <clipPath id="screenclip_${uid}">
            <rect x="${scr.x}" y="${scr.y}" width="${scr.w}" height="${scr.h}" rx="${scr.cornerRadius}"/>
        </clipPath>
        <g clip-path="url(#screenclip_${uid})">
            ${content}
            ${renderCrease(g, scr)}
        </g>
        ${renderNetworkLabel(scr, netLabel)}
        ${renderReflectionLayer(scr, uid, g.yr)}`;
}

// Swivel: keypad di bawah, badan layar berputar (tampak depan, pose setengah putar).
function renderSwivelFront(g, scr, spec, hex, brand, ids, era, uid, displayId) {
    const lower = renderBodyLayer(g, ids, hex) + renderKeysForKind(g, scr, hex, spec);
    const upper = bodyShape(g.x, g.y, g.w, g.h, g.rx, ids, g.material) +
        renderFace(g, scr, spec, hex, brand) +
        renderScreens(g, scr, era, uid, brand, displayId);
    const pivot = `<circle cx="${g.pivot[0]}" cy="${g.pivot[1]}" r="2.6" fill="url(#${ids.rim})" stroke="#000" stroke-opacity="0.5" stroke-width="0.3"/>`;
    return lower + `<g transform="rotate(${g.rot} ${g.pivot[0]} ${g.pivot[1]})">${upper}</g>` + pivot;
}

// ============================================================
// MAIN RENDER
// opts: size, year, showBrand, view ('front'|'back'),
//       isStatic, label (teks kecil di bawah ponsel),
//       fit {w,h} — crop viewBox ke bodi & muat ke kotak (kartu pilihan bentuk)
// ============================================================
// ============================================================
// KEMASAN (view 'box') — kotak retail + isi kotak
// ============================================================
// Jenis kabel mengikuti port milestone; USB Tipe-C hanya tampil bila riset 'bat_usbc' selesai
// (kalau belum, kotak masih memakai kabel Micro-USB).
function packContents(spec, year, completed, config) {
    var ports = (spec && spec.ports) || [];
    var ch = '';
    for (var i = 0; i < ports.length; i++) { if (/^charging_/.test(ports[i])) { ch = ports[i]; break; } }
    var wantsUsbC = /^charging_usb_c/.test(ch);
    var hasUsbC = completed.indexOf('bat_usbc') !== -1;
    var cable = 'micro';
    if (ch === 'charging_barrel') cable = 'barrel';
    else if (ch === 'charging_dock') cable = 'dock';
    else if (wantsUsbC && hasUsbC) cable = 'usbc';
    var watt = 0;
    try {
        var bat = config && config.batteryId ? getComponentById(config.batteryId) : null;
        if (bat && bat.specs && bat.specs.chargingW) watt = bat.specs.chargingW;
    } catch (e) {}
    return {
        cable: cable,
        wireless: /wireless/.test(ch),
        jack: ports.some(function (x) { return /^audio_jack/.test(x); }),
        adapter: year < 2020 && cable !== 'dock',
        noAdapter: year >= 2020,
        watt: watt,
        needsResearchHint: wantsUsbC && !hasUsbC
    };
}

function packStyle(year, hex) {
    var accent = lum(hex) < 55 ? '#9aa0ab' : hex;
    if (year <= 2004) return { kind: 'kraft', front: '#c8a46a', side: '#a9884f', top: '#d8b97f', ink: '#3b2a12', accent: accent, gloss: false };
    if (year <= 2013) return { kind: 'gloss', front: '#f3f3f1', side: '#d5d5d2', top: '#ffffff', ink: '#1d1d1f', accent: accent, gloss: true };
    if (year <= 2019) return { kind: 'dark', front: '#17181c', side: '#0d0e11', top: '#26282e', ink: '#e8e9ec', accent: accent, gloss: true };
    return { kind: 'eco', front: '#e8e3d6', side: '#cfc9ba', top: '#f1ede2', ink: '#2a2a26', accent: accent, gloss: false };
}

function packPhoneArt(year, hex, uid, cx) {
    var edge = shadeHex(hex, -35);
    if (year < 2007) {
        var x = cx - 10;
        var keys = '';
        for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
            keys += '<rect x="' + (x + 3.2 + c * 5.2) + '" y="' + (106 + r * 5) + '" width="4" height="3" rx="1" fill="' + shadeHex(hex, 22) + '" stroke="' + edge + '" stroke-width="0.25"/>';
        }
        return '<rect x="' + x + '" y="76" width="20" height="50" rx="4.5" fill="' + hex + '" stroke="' + edge + '" stroke-width="0.5"/>' +
            '<rect x="' + (x + 3) + '" y="80" width="14" height="12" rx="1.2" fill="' + (year <= 2001 ? '#a7bfa0' : '#1d2a3a') + '" stroke="#000" stroke-opacity=".35" stroke-width="0.3"/>' +
            '<rect x="' + (x + 7) + '" y="94" width="6" height="2" rx="1" fill="' + edge + '"/>' + keys;
    }
    var xs = cx - 11;
    var hole = year >= 2018 ? '<circle cx="' + cx + '" cy="79.5" r="0.9" fill="#000"/>' : '';
    var dots = '';
    for (var i = 0; i < 8; i++) {
        dots += '<rect x="' + (xs + 3.4 + (i % 4) * 4.4) + '" y="' + (92 + Math.floor(i / 4) * 5.4) + '" width="3" height="3" rx="0.9" fill="' + ICON_COLORS[i] + '" opacity="0.85"/>';
    }
    return '<rect x="' + xs + '" y="74" width="22" height="54" rx="4.6" fill="' + hex + '" stroke="' + edge + '" stroke-width="0.5"/>' +
        '<rect x="' + (xs + 1.4) + '" y="75.6" width="19.2" height="50.8" rx="3.4" fill="url(#pkscr_' + uid + ')"/>' +
        hole + dots;
}

function packCableEnd(type, x, y) {
    // x,y = ujung bawah konektor (tempat kabel masuk), konektor menghadap ke atas
    var housing = '<rect x="' + (x - 2.5) + '" y="' + (y - 5) + '" width="5" height="5.2" rx="1.1" fill="#2b2f36"/>';
    if (type === 'usbc') {
        return housing +
            '<rect x="' + (x - 1.9) + '" y="' + (y - 10.4) + '" width="3.8" height="5.6" rx="1.9" fill="#cfd4dc" stroke="#7d8490" stroke-width="0.25"/>' +
            '<rect x="' + (x - 0.9) + '" y="' + (y - 8.3) + '" width="1.8" height="1.3" rx="0.6" fill="#4a4f58"/>';
    }
    if (type === 'barrel') {
        return '<circle cx="' + x + '" cy="' + (y - 2.4) + '" r="2.5" fill="#2b2f36"/>' +
            '<rect x="' + (x - 0.8) + '" y="' + (y - 9) + '" width="1.6" height="5" rx="0.6" fill="#cfd4dc" stroke="#7d8490" stroke-width="0.2"/>';
    }
    return housing +
        '<polygon points="' + (x - 1.9) + ',' + (y - 5) + ' ' + (x + 1.9) + ',' + (y - 5) + ' ' + (x + 1.9) + ',' + (y - 7.6) + ' ' + (x + 0.9) + ',' + (y - 9.6) + ' ' + (x - 0.9) + ',' + (y - 9.6) + ' ' + (x - 1.9) + ',' + (y - 7.6) + '" fill="#cfd4dc" stroke="#7d8490" stroke-width="0.25"/>';
}

function renderPackagingLayers(o) {
    var st = packStyle(o.year, o.hex);
    var pc = o.contents;
    var ink = st.ink;
    var font = 'font-family="system-ui,-apple-system,Segoe UI,Arial,sans-serif"';
    var cx = 31;
    var svg = '';

    svg += '<defs>' +
        '<linearGradient id="pkscr_' + o.uid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0d1626"/><stop offset="100%" stop-color="#26406b"/></linearGradient>' +
        '<linearGradient id="pkgl_' + o.uid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff" stop-opacity="0.35"/><stop offset="45%" stop-color="#fff" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.12"/></linearGradient>' +
        '</defs>';

    // Kotak: atas, samping, depan
    svg += '<polygon points="6,50 17,44 67,44 56,50" fill="' + st.top + '" stroke="#000" stroke-opacity=".18" stroke-width="0.3"/>';
    svg += '<polygon points="56,50 67,44 67,158 56,164" fill="' + st.side + '" stroke="#000" stroke-opacity=".18" stroke-width="0.3"/>';
    svg += '<rect x="6" y="50" width="50" height="114" fill="' + st.front + '" stroke="#000" stroke-opacity=".18" stroke-width="0.3"/>';
    if (st.gloss) svg += '<rect x="6" y="50" width="50" height="114" fill="url(#pkgl_' + o.uid + ')"/>';

    // Tutup/pita pembuka
    svg += '<rect x="6" y="50" width="50" height="1.2" fill="#000" opacity="0.12"/>';
    if (st.kind === 'kraft') svg += '<rect x="26" y="50" width="10" height="114" fill="#000" opacity="0.05"/>';

    // Merek + garis aksen
    svg += '<text x="' + cx + '" y="61" text-anchor="middle" font-size="6" font-weight="800" letter-spacing="0.7" fill="' + ink + '" ' + font + '>' + o.brand + '</text>';
    svg += '<rect x="6" y="65" width="50" height="1.4" fill="' + st.accent + '"/>';

    // Ilustrasi ponsel
    svg += packPhoneArt(o.year, o.hex, o.uid, cx);

    // Stiker
    svg += '<circle cx="49" cy="76" r="5" fill="' + st.accent + '"/>' +
        '<text x="49" y="77.1" text-anchor="middle" font-size="2.8" font-weight="800" fill="' + (lum(st.accent) > 150 ? '#111' : '#fff') + '" ' + font + '>' + _scr('mock.pack.new', 'BARU', 'NEW') + '</text>';

    // Label model
    var label = String(o.label || '').slice(0, 24);
    svg += '<text x="' + cx + '" y="141" text-anchor="middle" font-size="3.6" font-weight="600" fill="' + ink + '" opacity="0.85" ' + font + '>' + _esc(label) + '</text>';
    svg += '<text x="' + cx + '" y="151" text-anchor="middle" font-size="6.5" font-weight="800" fill="' + (st.kind === 'kraft' ? ink : st.accent) + '" ' + font + '>' + o.year + '</text>';
    svg += '<rect x="6" y="157" width="50" height="7" fill="' + st.accent + '" opacity="0.9"/>';
    if (st.kind === 'eco') svg += '<text x="' + cx + '" y="161.9" text-anchor="middle" font-size="2.8" font-weight="700" fill="#fff" ' + font + '>' + _scr('mock.pack.eco', 'KEMASAN DAUR ULANG', 'RECYCLED PACKAGING') + '</text>';

    // ---------- Isi kotak ----------
    // Earphone berkabel (jika masih ada jack audio)
    if (pc.jack) {
        svg += '<path d="M83 96 L78 112 M83 96 L88 112" stroke="#f0f0f0" stroke-width="0.9" fill="none" stroke-linecap="round"/>' +
            '<circle cx="78" cy="113.6" r="2.1" fill="#f4f4f4" stroke="#aaa" stroke-width="0.3"/>' +
            '<circle cx="88" cy="113.6" r="2.1" fill="#f4f4f4" stroke="#aaa" stroke-width="0.3"/>' +
            '<rect x="82.3" y="90" width="1.4" height="6" rx="0.5" fill="#cfd4dc" stroke="#7d8490" stroke-width="0.2"/>';
    }

    // Sumber daya: dok / pad Qi / charger
    if (pc.cable === 'dock') {
        svg += '<polygon points="70,164 98,164 95,156 73,156" fill="#2b2f36"/>' +
            '<rect x="80" y="141" width="10" height="16" rx="2" fill="#3a3f48"/>' +
            '<rect x="82" y="144" width="6" height="2" rx="1" fill="#4f5560"/>';
    } else {
        if (pc.wireless) {
            svg += '<ellipse cx="80" cy="161" rx="11" ry="3.3" fill="#2b2f36"/>' +
                '<ellipse cx="80" cy="160.6" rx="7.5" ry="1.8" fill="none" stroke="' + st.accent + '" stroke-width="0.4"/>';
        } else if (pc.adapter) {
            svg += '<rect x="71" y="154" width="14" height="9" rx="1.6" fill="#f2f2f2" stroke="#c4c4c4" stroke-width="0.3"/>' +
                '<rect x="68.8" y="156" width="2.2" height="1.4" fill="#b9bcc2"/>' +
                '<rect x="68.8" y="159.6" width="2.2" height="1.4" fill="#b9bcc2"/>';
        }
        var sx = (pc.wireless || pc.adapter) ? 85 : 76;
        svg += '<path d="M' + sx + ' 158 C 95 158, 97 150, 92 144 S 84 137, 90 131" stroke="#000" stroke-opacity=".25" stroke-width="1.9" fill="none" stroke-linecap="round"/>' +
            '<path d="M' + sx + ' 158 C 95 158, 97 150, 92 144 S 84 137, 90 131" stroke="#f0f0f0" stroke-width="1.2" fill="none" stroke-linecap="round"/>';
        svg += packCableEnd(pc.cable, 90, 131);
    }
    return svg;
}

function packCaption(pc, width) {
    var cableName = {
        usbc: _tf('mock.pack.cable_usbc', 'Kabel USB Tipe-C', 'USB Type-C cable'),
        micro: _tf('mock.pack.cable_micro', 'Kabel Micro-USB', 'Micro-USB cable'),
        barrel: _tf('mock.pack.cable_barrel', 'Kabel colokan bulat', 'Barrel-plug cable'),
        dock: _tf('mock.pack.cable_dock', 'Dok pengisi daya', 'Charging dock')
    }[pc.cable];
    var parts = [_tf('mock.pack.phone', 'Ponsel', 'Phone'), cableName];
    if (pc.wireless) parts.push(_tf('mock.pack.qi', 'Pad Qi', 'Qi pad'));
    if (pc.adapter && !pc.wireless) {
        parts.push(pc.watt ? _tf('mock.pack.charger_w', 'Charger {w}W', 'Charger {w}W').replace('{w}', pc.watt) : _tf('mock.pack.charger', 'Charger', 'Charger'));
    }
    if (pc.noAdapter) parts.push(_tf('mock.pack.no_charger', 'Tanpa charger', 'No charger'));
    if (pc.jack) parts.push(_tf('mock.pack.earphone', 'Earphone berkabel', 'Wired earphones'));
    var hint = pc.needsResearchHint
        ? '<div style="margin-top:2px;color:var(--accent);">' + _esc(_tf('mock.pack.hint_usbc', 'Riset USB Tipe-C untuk kabel modern.', 'Research USB Type-C for the modern cable.')) + '</div>'
        : '';
    return '<div class="phone-pack-cap" style="font-size:10.5px;line-height:1.45;text-align:center;color:var(--text-tertiary);margin-top:6px;max-width:' + Math.max(width, 150) + 'px;">' +
        '<div style="font-weight:600;">' + _esc(_tf('mock.pack.contents', 'Isi kotak', 'In the box')) + '</div>' +
        '<div>' + _esc(parts.join(' · ')) + '</div>' + hint + '</div>';
}

export function renderPhoneMockup(config, opts) {
    opts = opts || {};
    const size = opts.size || 220;
    let width = Math.round(size * 0.55);
    let height = size;

    const st = safeGetState();
    const year = opts.year || (st.time && st.time.currentYear) || 2000;
    const completed = (st.research && st.research.completed) || [];
    const companyName = (st.companyName || '').trim();
    const brand = escapeHtml(companyName ? companyName.toUpperCase().slice(0, 10) : 'SMARTEL');

    // Komponen yang belum diriset turun ke alternatif yang sudah terbuka.
    config = resolveConfigForResearch(config, completed);
    const sensors = resolveSensorVisuals(completed);
    const netLabel = resolveNetworkLabel(completed);

    const spec = resolveSpec(year, completed);
    const era = eraForSpec(spec, year);

    const formFactor = (config && config.formFactorId) || 'ff_candybar';
    const bodyColorId = (config && config.bodyColorId) || 'color_black';
    const cameraId = (config && config.cameraId) || 'cam_vga';
    const displayId = (config && config.displayId) || '';
    const view = opts.view === 'back' ? 'back' : (opts.view === 'box' ? 'box' : 'front');

    const bodyColor = getBodyColorById(bodyColorId);
    const bodyHex = bodyColor ? bodyColor.hex : '#1a1a1a';

    const g = getGeom(formFactor, spec);
    const scr = getScreenRect(spec, g);
    const uid = Math.random().toString(36).slice(2, 8);
    const ids = { body: 'bodygrad_' + uid, rim: 'rim_' + uid };
    const rs = rimStops(g.material, bodyHex);
    const n = resolveLensCount(cameraId, spec);

    let layers;
    const pack = view === 'box' ? packContents(spec, year, completed, config) : null;
    if (view === 'box') {
        layers = renderPackagingLayers({ year: year, hex: bodyHex, brand: brand, uid: uid, label: spec.label, contents: pack });
    } else if (view === 'back') {
        layers = renderBackView(g, spec, ids, bodyHex, brand, n, sensors);
    } else if (g.kind === 'swivel') {
        layers = renderSwivelFront(g, scr, spec, bodyHex, brand, ids, era, uid, displayId);
    } else {
        layers = `
            ${renderAntenna(g, bodyHex)}
            ${renderSideButtons(g)}
            ${renderBodyLayer(g, ids, bodyHex)}
            ${renderFace(g, scr, spec, bodyHex, brand)}
            ${renderKeysForKind(g, scr, bodyHex, spec)}
            ${renderScreens(g, scr, era, uid, brand, displayId, netLabel)}
            ${renderInDisplayFingerprint(scr, sensors)}
            ${renderEdgeLayer(g, scr, uid)}
            ${renderNotchLayer(spec, scr, g)}
            ${renderHomeLayer(spec, g, scr)}
        `;
    }

    let viewBox = '0 0 100 180';
    if (view !== 'box' && opts.fit && opts.fit.w && opts.fit.h) {
        const bb = getBounds(g);
        const bw = bb[2] - bb[0], bh = bb[3] - bb[1];
        const sc = Math.min(opts.fit.w / bw, opts.fit.h / bh);
        viewBox = bb[0] + ' ' + bb[1] + ' ' + bw + ' ' + bh;
        width = Math.round(bw * sc);
        height = Math.round(bh * sc);
    }

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">
            <defs>
                <linearGradient id="${ids.body}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${shadeHex(bodyHex, 22)}"/>
                    <stop offset="30%" stop-color="${shadeHex(bodyHex, 6)}"/>
                    <stop offset="62%" stop-color="${bodyHex}"/>
                    <stop offset="100%" stop-color="${shadeHex(bodyHex, -38)}"/>
                </linearGradient>
                <linearGradient id="sheen_${ids.body}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#fff" stop-opacity="0.22"/>
                    <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
                </linearGradient>
                <linearGradient id="${ids.rim}" x1="0%" y1="0%" x2="100%" y2="0%">
                    ${rs.map(function (c, i) { return '<stop offset="' + Math.round(i / (rs.length - 1) * 100) + '%" stop-color="' + c + '"/>'; }).join('')}
                </linearGradient>
                <radialGradient id="sh_${uid}">
                    <stop offset="0%" stop-color="#000" stop-opacity="0.5"/>
                    <stop offset="100%" stop-color="#000" stop-opacity="0"/>
                </radialGradient>
            </defs>
            <ellipse cx="50" cy="${GROUND + 6}" rx="${Math.min(50, g.w * 0.8)}" ry="6" fill="url(#sh_${uid})" opacity="0.45"/>
            <ellipse cx="50" cy="${GROUND + 1.2}" rx="${Math.min(40, g.w * 0.56)}" ry="2.2" fill="url(#sh_${uid})"/>
            ${layers}
        </svg>
    `;

    const brandHtml = (opts.showBrand === false || view !== 'front' || opts.fit) ? '' :
        (companyName ? `<div class="phone-brand">${escapeHtml(companyName)}</div>` : '');
    const capHtml = (opts.label ? `<div class="phone-cap">${escapeHtml(opts.label)}</div>` : '') +
        ((view === 'back' && opts.inHouse !== false && !opts.fit) ? inHouseBadge(config) : '') +
        ((view === 'box' && opts.packCaption !== false && !opts.fit) ? packCaption(pack, width) : '');
    const cls = 'phone-mockup-wrap phone-era-' + era.id + ' phone-spec-' + spec.id + (opts.isStatic ? ' phone-static' : '');

    return `<div class="${cls}" style="width:${width}px;height:${height + (brandHtml ? 18 : 0)}px;">${svg}${brandHtml}</div>${capHtml}`;
}

// Komponen dari pabrik sendiri yang sedang berdiri (untuk lencana "Internal").
// Mengembalikan daftar { label, id } mis. [{ label: 'SoC', id: 'soc' }].
const _PLANT_SHORT = {
    battery: ['Baterai', 'Battery'], display: ['Layar', 'Display'], soc: ['SoC', 'SoC'],
    camera: ['Kamera', 'Camera'], ram: ['RAM', 'RAM']
};
export function listInHouseParts(config) {
    const st = safeGetState();
    const out = [];
    if (!config || !st || !st.componentPlants) return out;
    const ids = [config.displayId, config.cameraId, config.batteryId, config.chipId, config.ramId];
    const seen = {};
    ids.forEach(function (cid) {
        if (!cid || cid === 'none') return;
        const comp = getComponentById(cid);
        const pt = comp && getPlantTypeForCategory(comp.category);
        if (!pt || seen[pt.id]) return;
        const ps = st.componentPlants.plants && st.componentPlants.plants[pt.id];
        if (!ps || !ps.built || !ps.level) return;
        seen[pt.id] = true;
        const names = _PLANT_SHORT[pt.id] || [pt.id, pt.id];
        out.push({ id: pt.id, label: LanguageService.getLang() === 'en' ? names[1] : names[0], level: ps.level });
    });
    return out;
}

function inHouseBadge(config) {
    const parts = listInHouseParts(config);
    if (!parts.length) return '';
    const title = _tf('mock.inhouse', 'Komponen buatan sendiri', 'In-house components');
    return '<div class="phone-inhouse" title="' + escapeHtml(title) + '">' +
        '<span class="phone-inhouse-lbl">' + escapeHtml(_tf('mock.inhouse_short', 'Internal', 'In-house')) + '</span>' +
        parts.map(function (p) { return '<span class="phone-inhouse-chip">' + escapeHtml(p.label) + ' L' + p.level + '</span>'; }).join('') +
        '</div>';
}

// Teks "Isi kotak" terpisah dari SVG (dipakai wizard di kolom samping, karena kolom ponsel sempit).
export function renderPackagingCaption(config, opts) {
    opts = opts || {};
    const st = safeGetState();
    const year = opts.year || (st.time && st.time.currentYear) || 2000;
    const completed = (st.research && st.research.completed) || [];
    const spec = resolveSpec(year, completed);
    const gated = resolveConfigForResearch(config, completed);
    return packCaption(packContents(spec, year, completed, gated), opts.width || 240);
}

export function renderPhoneThumbnail(config, size) {
    return renderPhoneMockup(config, { size: size || 60, showBrand: false, isStatic: true });
}

// Era layar mengikuti spesifikasi yang benar-benar terbuka (riset), bukan tahun mentah.
// Contoh: 2007 tanpa riset touchscreen tetap tampil layar TFT, bukan glossy.
export function getMockupEra() {
    const st = safeGetState();
    const year = safeGetYear();
    const completed = (st.research && st.research.completed) || [];
    return eraForSpec(resolveSpec(year, completed), year);
}

export function getMockupSpec() {
    const st = safeGetState();
    const completed = (st.research && st.research.completed) || [];
    return resolveSpec(st.time.currentYear || 2000, completed);
}

