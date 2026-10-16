// FILE: src/ui/phone/PhoneMockup.js
// ============================================================
// PhoneMockup V3 — SVG ponsel realistis 2000-2026.
// - Proporsi & skala bodi mengikuti tahun (ponsel lama kecil/pendek,
//   ponsel modern tinggi/tipis). Semua berdiri di "garis lantai" sama.
// - Era keypad (2000-2006): keypad fisik, antena, pelat wajah.
// - QWERTY, slider, flip (klasik & lipat modern), fold, tri-fold.
// - Material: plastik, aluminium, kaca, titanium (rim logam).
// - Tampak depan & belakang (kamera mengikuti pilihan + era).
// API publik tetap: renderPhoneMockup, renderPhoneThumbnail,
// getMockupEra, getMockupSpec. Opsi baru: view ('front'|'back'),
// isStatic, label.
// ============================================================
import { getComponentById, getBodyColorById } from '../../data/components.data.js';
import { getDesignEraForYear } from '../../data/era-design.data.js';
import { state } from '../../core/GameState.js';
import { resolveSpec } from '../../data/phone-specs.data.js';

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
    const rx = yr < 2013 ? 9 : (yr < 2017 ? 8 : (mat === 'titanium' ? 7 : 10));

    if (formFactor === 'ff_qwerty') {
        const qh = Math.min(h, 128), qw = Math.round(qh * 0.56);
        return mk('qwerty', (100 - qw) / 2, GROUND - qh, qw, qh, 7, yr, mat);
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
            return g;
        }
        const g = mk('flip', 23, GROUND - 132, 54, 64, 9, yr, mat);
        g.low = { y: g.y + 68, h: 64 };
        g.th = 132;
        return g;
    }
    if (formFactor === 'ff_fold' || formFactor === 'ff_foldable') {
        return mk('fold', 6, GROUND - 110, 88, 110, 7, yr, mat);
    }
    if (formFactor === 'ff_tri_fold') {
        return mk('trifold', 3, GROUND - 96, 94, 96, 6, yr, mat);
    }
    return mk('bar', (100 - w) / 2, GROUND - h, w, h, rx, yr, mat);
}

function getScreenRect(spec, g) {
    const s = spec.screen || { insetTop: 20, insetBottom: 20, insetSide: 8, cornerRadius: 6 };
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
        <text x="${cx}" y="${cy + fs * 0.15}" text-anchor="middle" font-size="${fs}" font-family="monospace" font-weight="700" fill="${ink}">12:30</text>
        <text x="${cx}" y="${cy + fs * 0.15 + 3.6}" text-anchor="middle" font-size="2.3" font-family="monospace" font-weight="700" fill="${ink}" letter-spacing="0.3">${brand}</text>
        <rect x="${x0}" y="${y0 + h - 4.4}" width="${w}" height="4.4" fill="${ink}" opacity="0.88"/>
        <text x="${x0 + 1.6}" y="${y0 + h - 1.3}" font-size="2.2" font-family="monospace" font-weight="700" fill="#b9cf92">Menu</text>
        <text x="${x0 + w - 1.6}" y="${y0 + h - 1.3}" text-anchor="end" font-size="2.2" font-family="monospace" font-weight="700" fill="#b9cf92">Nama</text>
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
        <text x="${cx}" y="${y0 + h * 0.34}" text-anchor="middle" font-size="${Math.min(w * 0.2, 8)}" font-family="sans-serif" font-weight="700" fill="#fff">12:30</text>
        <text x="${cx}" y="${y0 + h * 0.34 + 3.2}" text-anchor="middle" font-size="2" font-family="sans-serif" fill="#bcd8ff">${brand}</text>
        ${icons}
        <rect x="${x0}" y="${y0 + h - 4.4}" width="${w}" height="4.4" fill="#06132a"/>
        <text x="${x0 + 1.6}" y="${y0 + h - 1.3}" font-size="2.1" font-family="sans-serif" font-weight="700" fill="#9ec5ff">Menu</text>
        <text x="${x0 + w - 1.6}" y="${y0 + h - 1.3}" text-anchor="end" font-size="2.1" font-family="sans-serif" font-weight="700" fill="#9ec5ff">Nama</text>
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
        <text x="${cx}" y="${y0 + 2.7}" text-anchor="middle" font-size="1.8" font-family="sans-serif" fill="#fff" font-weight="700">9:41</text>
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
    let dock = '';
    for (let c = 0; c < 4; c++) dock += appIcon(x0 + 1.5 + c * cell + 1.3, y0 + h - 8.6, s, ICON_COLORS[(c + 7) % ICON_COLORS.length], false);
    return `
        <defs>
            <linearGradient id="fl_${uid}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#3a2a7e"/><stop offset="0.55" stop-color="#1f62a8"/><stop offset="1" stop-color="#0bb3b3"/>
            </linearGradient>
        </defs>
        <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="url(#fl_${uid})"/>
        <rect x="${x0}" y="${y0}" width="${w}" height="3.6" fill="#000" opacity="0.3"/>
        <text x="${x0 + 1.5}" y="${y0 + 2.6}" font-size="1.7" font-family="sans-serif" fill="#fff" font-weight="500">10:09</text>
        <path d="M${x0 + w - 11} ${y0 + 2.8} l1.8 -2.2 l1.8 2.2 z" fill="#fff" opacity="0.9"/>
        ${sigBars(x0 + w - 8.4, y0 + 0.4, '#fff')}
        ${batt(x0 + w - 1.2, y0 + 0.9, '#fff')}
        <text x="${cx}" y="${y0 + h * 0.2}" text-anchor="middle" font-size="${Math.min(w * 0.26, 10)}" font-family="sans-serif" font-weight="200" fill="#fff">10:09</text>
        <text x="${cx}" y="${y0 + h * 0.2 + 3.4}" text-anchor="middle" font-size="1.9" font-family="sans-serif" fill="#fff" opacity="0.85">Senin, 12 Oktober  24°C</text>
        ${grid}
        ${dock}
        <circle cx="${cx - 1.6}" cy="${y0 + h - 10.6}" r="0.5" fill="#fff"/>
        <circle cx="${cx}" cy="${y0 + h - 10.6}" r="0.45" fill="#fff" opacity="0.45"/>
        <circle cx="${cx + 1.6}" cy="${y0 + h - 10.6}" r="0.45" fill="#fff" opacity="0.45"/>
    `;
}

// 2015+ : AMOLED / HDR / Flexible (dipertahankan dari versi sebelumnya)
function screenModern(screenStyle, rect) {
    const x0 = rect.x, y0 = rect.y, w = rect.w, h = rect.h;
    const cx = x0 + w / 2;
    const cy = y0 + h / 2;
    // ============================================================
    // ERA 2015-2018: AMOLED Premium — Always-On Display
    // ============================================================
    if (screenStyle === 'amoled') {
        const widgetY = cy + 6;
        const widgetW = (w - 10) / 3;
        return `
            <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#000000"/>
            <text x="${x0 + 2}" y="${y0 + 3.2}" font-size="1.5" font-family="sans-serif" fill="#c9a961" font-weight="600">11:11</text>
            <text x="${x0 + w - 2}" y="${y0 + 3.2}" text-anchor="end" font-size="1.5" font-family="sans-serif" fill="#c9a961">4G ▮▮</text>

            <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="11" font-family="sans-serif" fill="#f0ede8" font-weight="200" letter-spacing="-0.5">11:11</text>
            <text x="${cx}" y="${cy + 1}" text-anchor="middle" font-size="1.8" font-family="sans-serif" fill="#c9a961" letter-spacing="0.4">Senin, 12 Oktober</text>

            <rect x="${x0 + 5}" y="${widgetY}" width="${widgetW}" height="5" rx="1.2" fill="#1a1a1a" stroke="#c9a961" stroke-width="0.1" opacity="0.7"/>
            <text x="${x0 + 5 + widgetW/2}" y="${widgetY + 3.2}" text-anchor="middle" font-size="1.5" font-family="sans-serif" fill="#c9a961" opacity="0.9">24°</text>

            <rect x="${x0 + 5 + widgetW + 2.5}" y="${widgetY}" width="${widgetW}" height="5" rx="1.2" fill="#1a1a1a" stroke="#c9a961" stroke-width="0.1" opacity="0.7"/>
            <text x="${x0 + 5 + widgetW + 2.5 + widgetW/2}" y="${widgetY + 3.2}" text-anchor="middle" font-size="1.5" font-family="sans-serif" fill="#c9a961" opacity="0.9">3 Baru</text>

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
        const gradId = 'hdrMesh_' + Math.random().toString(36).slice(2, 6);
        const notifY = cy + 2;
        const dockY = y0 + h - 12;
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

            <text x="${x0 + 2}" y="${y0 + 3.2}" font-size="1.5" font-family="sans-serif" fill="#00d4ff" font-weight="600">12:30</text>
            <text x="${x0 + w - 2}" y="${y0 + 3.2}" text-anchor="end" font-size="1.5" font-family="sans-serif" fill="#00d4ff">5G ▮▮</text>

            <text x="${cx}" y="${cy - 5}" text-anchor="middle" font-size="10" font-family="sans-serif" fill="#ffffff" font-weight="200" letter-spacing="-0.5">12:30</text>
            <text x="${cx}" y="${cy - 0.5}" text-anchor="middle" font-size="1.7" font-family="sans-serif" fill="#00d4ff" opacity="0.9" letter-spacing="0.3">Sen, 12 Okt 2021</text>

            <rect x="${x0 + 4}" y="${notifY + 3}" width="${w - 8}" height="4.5" rx="1.8" fill="#0f1420" stroke="#00d4ff" stroke-width="0.1" opacity="0.85"/>
            <circle cx="${x0 + 6.5}" cy="${notifY + 5.25}" r="1" fill="#00d4ff" opacity="0.9"/>
            <rect x="${x0 + 8.5}" y="${notifY + 4.5}" width="${w * 0.55}" height="0.6" rx="0.3" fill="#ffffff" opacity="0.75"/>
            <rect x="${x0 + 8.5}" y="${notifY + 6}" width="${w * 0.38}" height="0.5" rx="0.25" fill="#00d4ff" opacity="0.55"/>

            <g opacity="0.92">
                ${Array.from({length: 4}, (_, i) => {
                    const ix = x0 + 4 + i * ((w - 8) / 4);
                    const sz = (w - 8) / 4 - 2;
                    return `
                        <rect x="${ix}" y="${dockY}" width="${sz}" height="${sz}" rx="2" fill="${dockColors[i]}" opacity="0.85"/>
                        <rect x="${ix + 1}" y="${dockY + 1}" width="${sz - 2}" height="${sz - 2}" rx="1.5" fill="#0f1420" opacity="0.35"/>
                    `;
                }).join('')}
            </g>

            <circle cx="${cx - 3}" cy="${y0 + h - 2.8}" r="0.6" fill="#ffffff" opacity="0.9"/>
            <circle cx="${cx}" cy="${y0 + h - 2.8}" r="0.5" fill="#ffffff" opacity="0.5"/>
            <circle cx="${cx + 3}" cy="${y0 + h - 2.8}" r="0.5" fill="#ffffff" opacity="0.5"/>
        `;
    }

    // ============================================================
    // ERA 2023+: FLEXIBLE / FUTURE — Aurora + App Grid + Dock
    // ============================================================
    if (screenStyle === 'flexible') {
        const gradId = 'auroraGrad_' + Math.random().toString(36).slice(2, 6);
        const blurId = 'auroraBlur_' + Math.random().toString(36).slice(2, 6);
        const appColors = ['#a855f7', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#14b8a6'];
        const dockColors = ['#ffffff', '#a855f7', '#06b6d4', '#ec4899'];
        const cols = 4, rows = 2;
        const gridTop = cy + 5;
        const gridH = h - (gridTop - y0) - 18;
        const cellW = (w - 8) / cols;
        const cellH = gridH / rows;
        const iconSize = Math.min(cellW, cellH) - 2.5;
        const dockY = y0 + h - 12;

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

            <text x="${x0 + 2}" y="${y0 + 3.2}" font-size="1.5" font-family="sans-serif" fill="#ffffff" font-weight="600">12:30</text>
            <text x="${x0 + w - 2}" y="${y0 + 3.2}" text-anchor="end" font-size="1.5" font-family="sans-serif" fill="#a855f7">6G ▮▮</text>

            <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="11" font-family="sans-serif" fill="#ffffff" font-weight="200" letter-spacing="-0.5">12:30</text>
            <text x="${cx}" y="${cy - 1}" text-anchor="middle" font-size="1.7" font-family="sans-serif" fill="#ffffff" opacity="0.75" letter-spacing="0.4">12 Oktober</text>

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

            <g opacity="0.85">
                ${Array.from({length: 4}, (_, i) => {
                    const ix = x0 + 4 + i * ((w - 8) / 4);
                    const sz = (w - 8) / 4 - 2;
                    return `
                        <rect x="${ix}" y="${dockY}" width="${sz}" height="${sz}" rx="${sz * 0.28}" fill="${dockColors[i]}" opacity="0.9"/>
                    `;
                }).join('')}
            </g>

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
    return screenModern(screenStyle, rect);
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
    return `
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="url(#${ids.body})"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="none" stroke="url(#${ids.rim})" stroke-width="${sw}"/>
        <rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="${Math.max(1, rx - 1)}" fill="none" stroke="#000" stroke-opacity="0.28" stroke-width="0.25"/>
    `;
}

function renderBodyLayer(g, ids, hex) {
    const mat = g.material;
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
    const k = keyColors(hex);
    const x = g.x + 4.5, w = g.w - 9;
    const top = scr.y + scr.h + 3;
    const bottom = g.y + g.h - 5;
    const cx = g.x + g.w / 2;
    let out = '';
    const navY = top + 4.5;
    out += `<circle cx="${cx}" cy="${navY}" r="3.4" fill="${k.fill}" stroke="#000" stroke-opacity="0.45" stroke-width="0.35"/>
        <circle cx="${cx - 0.9}" cy="${navY - 0.9}" r="1" fill="#fff" opacity="0.25"/>`;
    [[x, '#2e9d4f'], [x + 10, k.fill], [x + w - 20, k.fill], [x + w - 10, '#c0392b']].forEach(function (p) {
        out += `<rect x="${p[0]}" y="${navY - 2.2}" width="9" height="4.4" rx="2" fill="${p[1]}" stroke="#000" stroke-opacity="0.35" stroke-width="0.3"/>`;
    });
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    const kt = navY + 5;
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

function renderNotchLayer(spec, scr) {
    const notch = spec.notch || 'none';
    if (notch === 'none') return '';
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
    const a = yr < 2007 ? 0.07 : 0.15;
    return `
        <defs>
            <linearGradient id="refl_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fff" stop-opacity="${a}"/>
                <stop offset="38%" stop-color="#fff" stop-opacity="0.02"/>
                <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
            </linearGradient>
        </defs>
        <rect x="${scr.x}" y="${scr.y}" width="${scr.w}" height="${scr.h * 0.6}" rx="${scr.cornerRadius}" fill="url(#refl_${uid})" pointer-events="none"/>
    `;
}

function renderCrease(g, scr) {
    if (!g.crease) return '';
    const cy = scr.y + scr.h / 2;
    return `<rect x="${scr.x}" y="${cy - 0.5}" width="${scr.w}" height="1" fill="#000" opacity="0.28"/>
        <rect x="${scr.x}" y="${cy + 0.5}" width="${scr.w}" height="0.4" fill="#fff" opacity="0.08"/>`;
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
    const scale = { 1: 0.30, 2: 0.36, 3: 0.42, 4: 0.44 }[n] * (yr >= 2023 ? 1.05 : 1);
    const size = T.w * scale;
    const light = lum(hex) > 140;
    const plate = light ? shadeHex(hex, -9) : shadeHex(hex, 14);
    const pos = n === 1 ? [[0.5, 0.5]] :
        n === 2 ? [[0.33, 0.32], [0.67, 0.68]] :
        n === 3 ? [[0.32, 0.30], [0.32, 0.70], [0.70, 0.5]] :
                  [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]];
    const r = size * (n === 1 ? 0.28 : n === 4 ? 0.17 : 0.2);
    return `<rect x="${L}" y="${Tp}" width="${size}" height="${size}" rx="${size * 0.24}" fill="${plate}" stroke="${shadeHex(plate, 25)}" stroke-width="0.4"/>` +
        pos.map(function (p) { return lensSvg(L + size * p[0], Tp + size * p[1], r); }).join('') +
        (flash ? flashSvg(L + size + 3.4, Tp + 3.4, 1.3) + `<circle cx="${L + size + 3.4}" cy="${Tp + 8}" r="0.7" fill="#111"/>` : '');
}

function renderBackView(g, spec, ids, hex, brand, n) {
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
    if (g.kind === 'flip' || g.kind === 'slider') {
        out += `<rect x="${T.x + 2}" y="${T.y + T.h * 0.5 - 0.5}" width="${T.w - 4}" height="1" fill="#000" opacity="0.3"/>`;
    }
    out += renderRearCamera(T, n, yr, hex, spec);
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
export function renderPhoneMockup(config, opts) {
    opts = opts || {};
    const size = opts.size || 220;
    const width = Math.round(size * 0.55);
    const height = size;

    const st = safeGetState();
    const year = opts.year || (st.time && st.time.currentYear) || 2000;
    const completed = (st.research && st.research.completed) || [];
    const companyName = (st.companyName || '').trim();
    const brand = escapeHtml(companyName ? companyName.toUpperCase().slice(0, 10) : 'SMARTEL');

    const era = getDesignEraForYear(year);
    const spec = resolveSpec(year, completed);

    const formFactor = (config && config.formFactorId) || 'ff_candybar';
    const bodyColorId = (config && config.bodyColorId) || 'color_black';
    const cameraId = (config && config.cameraId) || 'cam_vga';
    const displayId = (config && config.displayId) || '';
    const view = opts.view === 'back' ? 'back' : 'front';

    const bodyColor = getBodyColorById(bodyColorId);
    const bodyHex = bodyColor ? bodyColor.hex : '#1a1a1a';

    const g = getGeom(formFactor, spec);
    const scr = getScreenRect(spec, g);
    const uid = Math.random().toString(36).slice(2, 8);
    const ids = { body: 'bodygrad_' + uid, rim: 'rim_' + uid };
    const rs = rimStops(g.material, bodyHex);
    const n = resolveLensCount(cameraId, spec);

    let layers;
    if (view === 'back') {
        layers = renderBackView(g, spec, ids, bodyHex, brand, n);
    } else {
        layers = `
            ${renderAntenna(g, bodyHex)}
            ${renderSideButtons(g)}
            ${renderBodyLayer(g, ids, bodyHex)}
            ${renderFace(g, scr, spec, bodyHex, brand)}
            ${renderKeysForKind(g, scr, bodyHex, spec)}
            <rect x="${scr.x}" y="${scr.y}" width="${scr.w}" height="${scr.h}" rx="${scr.cornerRadius}" fill="#050505"/>
            <clipPath id="screenclip_${uid}">
                <rect x="${scr.x}" y="${scr.y}" width="${scr.w}" height="${scr.h}" rx="${scr.cornerRadius}"/>
            </clipPath>
            <g clip-path="url(#screenclip_${uid})">
                ${screenContent(era.screenStyle, scr, uid, brand, displayId)}
                ${renderCrease(g, scr)}
            </g>
            ${renderReflectionLayer(scr, uid, g.yr)}
            ${renderNotchLayer(spec, scr)}
            ${renderHomeLayer(spec, g, scr)}
        `;
    }

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 180" width="${width}" height="${height}">
            <defs>
                <linearGradient id="${ids.body}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${shadeHex(bodyHex, 15)}"/>
                    <stop offset="45%" stop-color="${bodyHex}"/>
                    <stop offset="100%" stop-color="${shadeHex(bodyHex, -35)}"/>
                </linearGradient>
                <linearGradient id="${ids.rim}" x1="0%" y1="0%" x2="100%" y2="0%">
                    ${rs.map(function (c, i) { return '<stop offset="' + Math.round(i / (rs.length - 1) * 100) + '%" stop-color="' + c + '"/>'; }).join('')}
                </linearGradient>
                <radialGradient id="sh_${uid}">
                    <stop offset="0%" stop-color="#000" stop-opacity="0.5"/>
                    <stop offset="100%" stop-color="#000" stop-opacity="0"/>
                </radialGradient>
            </defs>
            <ellipse cx="50" cy="${GROUND + 5}" rx="${Math.min(46, g.w * 0.62)}" ry="3.2" fill="url(#sh_${uid})"/>
            ${layers}
        </svg>
    `;

    const brandHtml = (opts.showBrand === false || view === 'back') ? '' :
        (companyName ? `<div class="phone-brand">${escapeHtml(companyName)}</div>` : '');
    const capHtml = opts.label ? `<div class="phone-cap">${escapeHtml(opts.label)}</div>` : '';
    const cls = 'phone-mockup-wrap phone-era-' + era.id + ' phone-spec-' + spec.id + (opts.isStatic ? ' phone-static' : '');

    return `<div class="${cls}" style="width:${width}px;height:${height + (brandHtml ? 18 : 0)}px;">${svg}${brandHtml}</div>${capHtml}`;
}

export function renderPhoneThumbnail(config, size) {
    return renderPhoneMockup(config, { size: size || 60, showBrand: false, isStatic: true });
}

export function getMockupEra() {
    return getDesignEraForYear(safeGetYear());
}

export function getMockupSpec() {
    const st = safeGetState();
    const completed = (st.research && st.research.completed) || [];
    return resolveSpec(st.time.currentYear || 2000, completed);
}

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
