// FILE: src/ui/phone/OsScreenMockup.js
// ============================================================
// OsScreenMockup — Settings view realistis 8 era 2000-2026.
// Era 2000-2006: ponsel dengan layar kecil + keypad fisik.
// Era 2007+: layar sentuh full-screen.
// ============================================================
import { state } from '../../core/GameState.js';
import { getDesignEraForYear } from '../../data/era-design.data.js';
import { resolveSpec } from '../../data/phone-specs.data.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function safeGetState() {
    try { return state.get(); }
    catch (e) { return { time: { currentYear: 2000 }, research: { completed: [] }, os: { versions: [] } }; }
}

function getCurrentFeatures(osState) {
    if (!osState || !osState.versions || !osState.versions.length) return [];
    const id = osState.currentVersionId || osState.versions[osState.versions.length - 1].id;
    const v = osState.versions.find(function (x) { return x.id === id; });
    if (!v || !Array.isArray(v.features)) return [];
    return v.features;
}

function getCurrentVersionString(osState) {
    if (!osState || !osState.versions || !osState.versions.length) return '';
    const id = osState.currentVersionId || osState.versions[osState.versions.length - 1].id;
    const v = osState.versions.find(function (x) { return x.id === id; });
    return v ? v.versionString : '';
}

// ============================================================
// MODE MAP — 8 mode realistis
// ============================================================
function getOsMode(year) {
    if (year <= 2002) return 'mono';
    if (year <= 2004) return 'symbian_grid';
    if (year <= 2006) return 'windows_mobile';
    if (year <= 2009) return 'early_ios';
    if (year <= 2012) return 'skeuomorphic';
    if (year <= 2014) return 'flat_material';
    if (year <= 2018) return 'grouped_modern';
    if (year <= 2022) return 'material_you';
    return 'ai_modern';
}

// ============================================================
// HELPERS — Phone body + Physical keypad (era 2000-2006)
// ============================================================
function renderPhoneBody(w, h) {
    let svg = '';
    svg += '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="#3a3a38"/>';
    svg += '<rect x="0" y="0" width="' + w + '" height="1.5" fill="#5a5a58" opacity="0.5"/>';
    svg += '<rect x="0" y="' + (h - 2) + '" width="' + w + '" height="2" fill="#0a0a0a" opacity="0.8"/>';
    // Earpiece speaker
    svg += '<rect x="' + (w/2 - 22) + '" y="10" width="44" height="5" rx="2.5" fill="#1a1a1a"/>';
    for (let i = 0; i < 5; i++) {
        svg += '<rect x="' + (w/2 - 18 + i * 8) + '" y="11.5" width="5" height="2" rx="0.5" fill="#000"/>';
    }
    // Brand hint
    svg += '<text x="' + (w/2) + '" y="28" text-anchor="middle" font-size="5" font-family="sans-serif" font-weight="700" fill="#7a7a78" letter-spacing="1.5">MOBILE</text>';
    return svg;
}

function renderPhysicalKeypad(w, h, startY) {
    let svg = '';
    const keyBg = '#4a4a48';
    const keyStroke = '#1a1a1a';
    const keyText = '#d0d0d0';
    const keyHi = '#6a6a68';

    // Soft keys
    const skY = startY;
    svg += '<rect x="30" y="' + skY + '" width="44" height="13" rx="5" fill="' + keyBg + '" stroke="' + keyStroke + '" stroke-width="0.5"/>';
    svg += '<rect x="31" y="' + (skY + 1) + '" width="42" height="5" rx="3" fill="' + keyHi + '" opacity="0.3"/>';
    svg += '<text x="52" y="' + (skY + 9) + '" text-anchor="middle" font-size="5" font-family="sans-serif" font-weight="700" fill="' + keyText + '">Menu</text>';

    svg += '<rect x="126" y="' + skY + '" width="44" height="13" rx="5" fill="' + keyBg + '" stroke="' + keyStroke + '" stroke-width="0.5"/>';
    svg += '<rect x="127" y="' + (skY + 1) + '" width="42" height="5" rx="3" fill="' + keyHi + '" opacity="0.3"/>';
    svg += '<text x="148" y="' + (skY + 9) + '" text-anchor="middle" font-size="5" font-family="sans-serif" font-weight="700" fill="' + keyText + '">Pilih</text>';

    // D-pad cluster
    const navX = 78, navW = 44, navH = 12;
    const navY = skY + 18;

    // Up
    svg += '<rect x="' + navX + '" y="' + navY + '" width="' + navW + '" height="' + navH + '" rx="4" fill="' + keyBg + '" stroke="' + keyStroke + '" stroke-width="0.5"/>';
    svg += '<path d="M ' + (navX + navW/2) + ' ' + (navY + 3) + ' L ' + (navX + navW/2 - 4) + ' ' + (navY + 9) + ' L ' + (navX + navW/2 + 4) + ' ' + (navY + 9) + ' Z" fill="' + keyText + '"/>';
    // OK
    svg += '<rect x="' + navX + '" y="' + (navY + navH + 2) + '" width="' + navW + '" height="' + navH + '" rx="4" fill="' + keyBg + '" stroke="' + keyStroke + '" stroke-width="0.5"/>';
    svg += '<text x="' + (navX + navW/2) + '" y="' + (navY + navH + 2 + 8.5) + '" text-anchor="middle" font-size="5.5" font-family="sans-serif" font-weight="700" fill="' + keyText + '">OK</text>';
    // Down
    svg += '<rect x="' + navX + '" y="' + (navY + navH*2 + 4) + '" width="' + navW + '" height="' + navH + '" rx="4" fill="' + keyBg + '" stroke="' + keyStroke + '" stroke-width="0.5"/>';
    svg += '<path d="M ' + (navX + navW/2) + ' ' + (navY + navH*2 + 13) + ' L ' + (navX + navW/2 - 4) + ' ' + (navY + navH*2 + 7) + ' L ' + (navX + navW/2 + 4) + ' ' + (navY + navH*2 + 7) + ' Z" fill="' + keyText + '"/>';

    // Numeric keypad
    const padTop = navY + navH * 3 + 14;
    const rows = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['*', '0', '#']
    ];
    const keyW = 46, keyH = 28, gapX = 8, gapY = 5;
    const totalW = 3 * keyW + 2 * gapX;
    const padX = (w - totalW) / 2;

    rows.forEach(function (row, ri) {
        row.forEach(function (label, ci) {
            const kx = padX + ci * (keyW + gapX);
            const ky = padTop + ri * (keyH + gapY);
            svg += '<rect x="' + kx + '" y="' + ky + '" width="' + keyW + '" height="' + keyH + '" rx="5" fill="' + keyBg + '" stroke="' + keyStroke + '" stroke-width="0.5"/>';
            svg += '<rect x="' + (kx + 1) + '" y="' + (ky + 1) + '" width="' + (keyW - 2) + '" height="13" rx="4" fill="' + keyHi + '" opacity="0.2"/>';
            svg += '<text x="' + (kx + keyW/2) + '" y="' + (ky + 20) + '" text-anchor="middle" font-size="10" font-family="sans-serif" font-weight="700" fill="' + keyText + '">' + label + '</text>';
        });
    });

    return svg;
}

// ============================================================
// MENU DATA — diperkaya, dikelompokkan
// ============================================================
function buildMenuData(featureIds, osState) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const isDark = has('fw_dark_mode');
    const netGen = has('net_5g') ? '5G' : has('net_4g') ? 'LTE' : has('net_3g') ? '3G' : has('net_gsm') ? 'GSM' : '—';
    const secValue = has('fw_biometric') ? 'Face ID' : has('fw_fingerprint') ? 'Sidik Jari' : has('fw_privacy') ? 'PIN' : '—';
    const storageValue = has('fw_cloud_sync') ? '128 GB' : '64 GB';
    const ver = getCurrentVersionString(osState) || '—';

    return {
        has: has,
        isDark: isDark,
        netGen: netGen,
        secValue: secValue,
        storageValue: storageValue,
        ver: ver
    };
}

// ============================================================
// NOTCH
// ============================================================
function renderNotch(spec, w) {
    if (!spec || !spec.notch || spec.notch === 'none') return '';
    const cx = w / 2;
    if (spec.notch === 'notch') {
        const nw = w * 0.42;
        return '<path d="M ' + (cx - nw/2) + ' 0 L ' + (cx - nw/2 + 3) + ' 12 L ' + (cx + nw/2 - 3) + ' 12 L ' + (cx + nw/2) + ' 0 Z" fill="#000"/>' +
            '<circle cx="' + (cx + nw/2 - 8) + '" cy="7" r="1.6" fill="#0a0a14"/>';
    }
    if (spec.notch === 'teardrop') {
        return '<path d="M ' + (cx - 10) + ' 0 Q ' + (cx - 10) + ' 12 ' + cx + ' 12 Q ' + (cx + 10) + ' 12 ' + (cx + 10) + ' 0 Z" fill="#000"/>';
    }
    if (spec.notch === 'punch_hole_center') {
        return '<circle cx="' + cx + '" cy="7" r="4" fill="#000"/><circle cx="' + cx + '" cy="7" r="2" fill="#1a1a1f"/>';
    }
    if (spec.notch === 'punch_hole_left') {
        return '<circle cx="20" cy="7" r="4" fill="#000"/><circle cx="20" cy="7" r="2" fill="#1a1a1f"/>';
    }
    if (spec.notch === 'dynamic_island') {
        return '<rect x="' + (cx - 24) + '" y="4" width="48" height="15" rx="7.5" fill="#000"/>' +
            '<circle cx="' + (cx + 14) + '" cy="11.5" r="2.6" fill="#0a0a14"/>' +
            '<circle cx="' + (cx + 14) + '" cy="11.5" r="1.3" fill="#1a2a3a" opacity="0.6"/>';
    }
    return '';
}

// ============================================================
// ICONS (14x14 grid, origin 0,0)
// ============================================================
function glyph(name, color, thick) {
    const sw = thick || 1.1;
    const s = 'fill="none" stroke="' + color + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round"';
    const map = {
        wifi:        '<path d="M3 7 a8 8 0 0 1 8 0" ' + s + '/><path d="M0.5 4.5 a12 12 0 0 1 13 0" ' + s + '/><circle cx="7" cy="10" r="0.7" fill="' + color + '"/>',
        signal:      '<line x1="1" y1="12" x2="1" y2="10" ' + s + '/><line x1="4" y1="12" x2="4" y2="8" ' + s + '/><line x1="7" y1="12" x2="7" y2="6" ' + s + '/><line x1="10" y1="12" x2="10" y2="4" ' + s + '/>',
        display:     '<rect x="1" y="2" width="12" height="9" rx="1.2" ' + s + '/><line x1="5" y1="14" x2="9" y2="14" ' + s + '/><line x1="7" y1="11" x2="7" y2="14" ' + s + '/>',
        sun:         '<circle cx="7" cy="7" r="3" ' + s + '/><path d="M7 1 v1.5 M7 11.5 v1.5 M1 7 h1.5 M11.5 7 h1.5 M2.5 2.5 l1 1 M10.5 10.5 l1 1 M2.5 11.5 l1 -1 M10.5 3.5 l1 -1" ' + s + '/>',
        volume:      '<path d="M1 5 L4 5 L7 2 L7 12 L4 9 L1 9 Z" ' + s + '/><path d="M9 4.5 a4 4 0 0 1 0 5" ' + s + '/>',
        bell:        '<path d="M3 9 c0 -3 0.5 -5 4 -5 c3.5 0 4 2 4 5 l1 1.5 h-10 z" ' + s + '/><path d="M5.5 11.5 a1.5 1.5 0 0 0 3 0" ' + s + '/>',
        lock:        '<rect x="2.5" y="6" width="9" height="7" rx="1.4" ' + s + '/><path d="M4.5 6 V4.5 a2.5 2.5 0 0 1 5 0 V6" ' + s + '/>',
        shield:      '<path d="M7 1 L2.5 3 V7 c0 3 4.5 6 4.5 6 s4.5 -3 4.5 -6 V3 Z" ' + s + '/>',
        fingerprint: '<path d="M3.5 10 a3.5 3.5 0 0 1 7 0 a3 3 0 0 1 -0.5 1.5" ' + s + '/><path d="M5 10 a2 2 0 0 1 4 0" ' + s + '/><path d="M2.5 8 a5 5 0 0 1 9 -1" ' + s + '/>',
        key:         '<circle cx="5" cy="7" r="2.2" ' + s + '/><path d="M6.5 8.5 L12 3" ' + s + '/><path d="M10.5 4.5 L12 6" ' + s + '/>',
        battery:     '<rect x="1" y="4" width="11" height="6" rx="1.2" ' + s + '/><rect x="12.5" y="6" width="1" height="2" fill="' + color + '"/><rect x="2" y="5" width="7" height="4" fill="' + color + '"/>',
        database:    '<ellipse cx="7" cy="3.5" rx="4.5" ry="1.5" ' + s + '/><path d="M2.5 3.5 v7 c0 0.8 2 1.5 4.5 1.5 s4.5 -0.7 4.5 -1.5 v-7" ' + s + '/><path d="M2.5 7 c0 0.8 2 1.5 4.5 1.5 s4.5 -0.7 4.5 -1.5" ' + s + '/>',
        download:    '<path d="M7 1 v8 M3.5 6 L7 9.5 L10.5 6" ' + s + '/><path d="M2 12 h10" ' + s + '/>',
        sparkles:    '<path d="M5 2 L5.8 4.5 L8.5 5 L5.8 5.5 L5 8 L4.2 5.5 L1.5 5 L4.2 4.5 Z" ' + s + '/><path d="M10 6 L10.5 7.5 L12 8 L10.5 8.5 L10 10 L9.5 8.5 L8 8 L9.5 7.5 Z" ' + s + '/>',
        info:        '<circle cx="7" cy="7" r="6" ' + s + '/><line x1="7" y1="6" x2="7" y2="10" ' + s + '/><circle cx="7" cy="4.5" r="0.6" fill="' + color + '"/>',
        cloud:       '<path d="M3 11 h7 a2.5 2.5 0 0 0 0.5 -4.5 a3.5 3.5 0 0 0 -6.5 -1 a2.5 2.5 0 0 0 -1 5.5 z" ' + s + '/>',
        globe:       '<circle cx="7" cy="7" r="6" ' + s + '/><line x1="1" y1="7" x2="13" y2="7" ' + s + '/><path d="M7 1 c3 2 3 10 0 12 M7 1 c-3 2 -3 10 0 12" ' + s + '/>',
        moon:        '<path d="M7 1 a6 6 0 1 0 6 6 a4 4 0 0 1 -6 -6 z" ' + s + '/>',
        target:      '<circle cx="7" cy="7" r="6" ' + s + '/><circle cx="7" cy="7" r="3" ' + s + '/><circle cx="7" cy="7" r="0.7" fill="' + color + '"/>',
        music:       '<circle cx="5" cy="10" r="2" ' + s + '/><line x1="7" y1="10" x2="7" y2="3" ' + s + '/><line x1="7" y1="3" x2="12" y2="2" ' + s + '/>',
        camera:      '<rect x="1" y="4" width="12" height="9" rx="1.2" ' + s + '/><circle cx="7" cy="8.5" r="2.2" ' + s + '/>',
        folder:      '<path d="M1 3 h5 l1.5 1.5 h5.5 v8 h-12 z" ' + s + '/>',
        contacts:    '<circle cx="7" cy="4.5" r="2.2" ' + s + '/><path d="M2.5 13 a4.5 4.5 0 0 1 9 0" ' + s + '/>',
        message:     '<rect x="1" y="2" width="12" height="8" rx="1.2" ' + s + '/><path d="M3 10 L3 13 L6 10" ' + s + '/>',
        clock:       '<circle cx="7" cy="7" r="6" ' + s + '/><path d="M7 3.5 V7 L9.5 8.5" ' + s + '/>'
    };
    return map[name] || '';
}

// ============================================================
// MODE 1 — MONO (2000-2002) — Nokia S30
// ============================================================
function renderMono(featureIds, osState, w, h, size) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const scrX = 28, scrY = 36, scrW = 144, scrH = 100;
    const screenBg = '#6a8a4a';
    const screenDark = '#1a2a0a';
    const screenLight = '#c8d0b8';

    let svg = renderPhoneBody(w, h);
    svg += '<rect x="' + (scrX - 4) + '" y="' + (scrY - 4) + '" width="' + (scrW + 8) + '" height="' + (scrH + 8) + '" rx="3" fill="#1a1a1a"/>';
    svg += '<rect x="' + scrX + '" y="' + scrY + '" width="' + scrW + '" height="' + scrH + '" fill="' + screenBg + '"/>';

    svg += '<g opacity="0.12">';
    for (let i = 0; i < 12; i++) {
        svg += '<line x1="' + scrX + '" y1="' + (scrY + i * (scrH/12)) + '" x2="' + (scrX + scrW) + '" y2="' + (scrY + i * (scrH/12)) + '" stroke="#000" stroke-width="0.15"/>';
    }
    svg += '</g>';

    // Signal bars
    for (let i = 0; i < 4; i++) {
        svg += '<rect x="' + (scrX + 4 + i * 3) + '" y="' + (scrY + 8 - i * 1.5) + '" width="2" height="' + (3 + i * 1.5) + '" fill="' + screenDark + '"/>';
    }
    svg += '<text x="' + (scrX + scrW/2) + '" y="' + (scrY + 7) + '" text-anchor="middle" font-size="5" font-family="monospace" fill="' + screenDark + '">08:15</text>';
    svg += '<rect x="' + (scrX + scrW - 20) + '" y="' + (scrY + 3) + '" width="14" height="6" fill="none" stroke="' + screenDark + '" stroke-width="0.6"/>';
    svg += '<rect x="' + (scrX + scrW - 19) + '" y="' + (scrY + 4) + '" width="9" height="4" fill="' + screenDark + '"/>';
    svg += '<rect x="' + (scrX + scrW - 5) + '" y="' + (scrY + 4.5) + '" width="1" height="3" fill="' + screenDark + '"/>';

    svg += '<text x="' + (scrX + 5) + '" y="' + (scrY + 19) + '" font-size="6.5" font-family="monospace" font-weight="700" fill="' + screenDark + '">PENGATURAN</text>';

    const items = ['Profil', 'Nada', 'Tampilan', 'Waktu', 'Konektivitas', 'Panggilan'];
    const sel = 4;
    items.forEach(function (it, i) {
        const iy = scrY + 26 + i * 11;
        if (iy + 9 > scrY + scrH - 10) return;
        const isSel = i === sel;
        if (isSel) svg += '<rect x="' + (scrX + 3) + '" y="' + (iy - 1) + '" width="' + (scrW - 6) + '" height="10" fill="' + screenDark + '"/>';
        svg += '<text x="' + (scrX + 5) + '" y="' + (iy + 6.5) + '" font-size="6" font-family="monospace" font-weight="700" fill="' + (isSel ? screenLight : screenDark) + '">' + (isSel ? '▶ ' : '  ') + it + '</text>';
    });

    svg += '<text x="' + (scrX + 4) + '" y="' + (scrY + scrH - 3) + '" font-size="5" font-family="monospace" fill="' + screenLight + '">Kembali</text>';
    svg += '<text x="' + (scrX + scrW - 4) + '" y="' + (scrY + scrH - 3) + '" text-anchor="end" font-size="5" font-family="monospace" fill="' + screenLight + '">Pilih</text>';

    svg += renderPhysicalKeypad(w, h, scrY + scrH + 12);

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + size + '" height="' + Math.round(size * 2) + '" preserveAspectRatio="xMidYMid meet">' + svg + '</svg>';
}

// ============================================================
// MODE 2 — SYMBIAN GRID (2003-2004) — Symbian S60
// ============================================================
function renderSymbianGrid(featureIds, osState, w, h, size) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const scrX = 28, scrY = 36, scrW = 144, scrH = 108;
    const bg = '#0a1a2a';
    const header = '#1e5a8a';
    const headerDark = '#0e3a6a';
    const text = '#ffffff';
    const dim = '#88b8d8';

    let svg = renderPhoneBody(w, h);
    svg += '<rect x="' + (scrX - 4) + '" y="' + (scrY - 4) + '" width="' + (scrW + 8) + '" height="' + (scrH + 8) + '" rx="3" fill="#1a1a1a"/>';
    svg += '<rect x="' + scrX + '" y="' + scrY + '" width="' + scrW + '" height="' + scrH + '" fill="' + bg + '"/>';

    svg += '<rect x="' + scrX + '" y="' + scrY + '" width="' + scrW + '" height="10" fill="' + headerDark + '"/>';
    svg += '<text x="' + (scrX + 3) + '" y="' + (scrY + 7) + '" font-size="4.5" font-family="sans-serif" font-weight="700" fill="' + dim + '">' + (has('net_gsm') ? 'GSM' : '—') + '</text>';
    svg += '<text x="' + (scrX + scrW/2) + '" y="' + (scrY + 7) + '" text-anchor="middle" font-size="4.5" font-family="sans-serif" fill="' + dim + '">08:15</text>';
    svg += '<text x="' + (scrX + scrW - 3) + '" y="' + (scrY + 7) + '" text-anchor="end" font-size="4.5" font-family="sans-serif" fill="' + dim + '">▮▮▮</text>';

    svg += '<rect x="' + scrX + '" y="' + (scrY + 10) + '" width="' + scrW + '" height="12" fill="' + header + '"/>';
    svg += '<text x="' + (scrX + 4) + '" y="' + (scrY + 19) + '" font-size="6.5" font-family="sans-serif" font-weight="700" fill="' + text + '">Setelan</text>';
    svg += '<text x="' + (scrX + scrW - 4) + '" y="' + (scrY + 19) + '" text-anchor="end" font-size="5" font-family="sans-serif" fill="' + dim + '">Keluar</text>';

    const gridItems = [
        { icon: 'signal', label: 'Jaringan',  color: '#88c8ff' },
        { icon: 'message', label: 'Pesan',    color: '#88d868' },
        { icon: 'contacts',label: 'Kontak',   color: '#f0a850' },
        { icon: 'clock',   label: 'Kalender', color: '#d078c0' },
        { icon: 'camera',  label: 'Kamera',   color: '#70b8e0' },
        { icon: 'music',   label: 'Musik',    color: '#a898d8' },
        { icon: 'folder',  label: 'File',     color: '#e0c050' },
        { icon: 'display', label: 'Setelan',  color: '#78d0a8' },
        { icon: 'info',    label: 'Info',     color: '#c8c8c8' }
    ];

    const gridTop = scrY + 24;
    const cellW = (scrW - 8) / 3;
    const cellH = (scrH - 26) / 3;
    gridItems.forEach(function (item, i) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cx = scrX + 4 + col * cellW + cellW / 2;
        const cy = gridTop + row * cellH + cellH / 2 - 4;
        svg += '<rect x="' + (cx - 9) + '" y="' + (cy - 9) + '" width="18" height="18" rx="2" fill="' + bg + '" stroke="' + item.color + '" stroke-width="0.5"/>';
        svg += '<g transform="translate(' + (cx - 5.5) + ',' + (cy - 5.5) + ')">' + glyph(item.icon, item.color, 1) + '</g>';
        svg += '<text x="' + cx + '" y="' + (cy + 15) + '" text-anchor="middle" font-size="4.5" font-family="sans-serif" fill="' + text + '">' + item.label + '</text>';
    });

    svg += '<text x="' + (scrX + 4) + '" y="' + (scrY + scrH - 3) + '" font-size="4.5" font-family="sans-serif" fill="' + dim + '">Pilih</text>';
    svg += '<text x="' + (scrX + scrW - 4) + '" y="' + (scrY + scrH - 3) + '" text-anchor="end" font-size="4.5" font-family="sans-serif" fill="' + dim + '">Kembali</text>';

    svg += renderPhysicalKeypad(w, h, scrY + scrH + 12);

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + size + '" height="' + Math.round(size * 2) + '" preserveAspectRatio="xMidYMid meet">' + svg + '</svg>';
}

// ============================================================
// MODE 3 — WINDOWS MOBILE (2005-2006)
// ============================================================
function renderWindowsMobile(featureIds, osState, w, h, size) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const scrX = 28, scrY = 36, scrW = 144, scrH = 118;
    const bg = '#ffffff';
    const bar = '#1a5a9a';
    const barDark = '#0e3a6a';
    const text = '#000000';
    const sub = '#5a5a5a';
    const line = '#c0c0c0';

    let svg = renderPhoneBody(w, h);
    svg += '<rect x="' + (scrX - 4) + '" y="' + (scrY - 4) + '" width="' + (scrW + 8) + '" height="' + (scrH + 8) + '" rx="3" fill="#1a1a1a"/>';
    svg += '<rect x="' + scrX + '" y="' + scrY + '" width="' + scrW + '" height="' + scrH + '" fill="' + bg + '"/>';

    svg += '<rect x="' + scrX + '" y="' + scrY + '" width="' + scrW + '" height="8" fill="#e8e8e8"/>';
    svg += '<text x="' + (scrX + 3) + '" y="' + (scrY + 5.5) + '" font-size="4.5" font-family="Tahoma, sans-serif" font-weight="700" fill="' + text + '">' + (has('net_gsm') ? 'GSM' : '—') + '</text>';
    svg += '<text x="' + (scrX + scrW/2) + '" y="' + (scrY + 5.5) + '" text-anchor="middle" font-size="4.5" font-family="Tahoma, sans-serif" fill="' + text + '">08:15</text>';
    svg += '<text x="' + (scrX + scrW - 3) + '" y="' + (scrY + 5.5) + '" text-anchor="end" font-size="4.5" font-family="Tahoma, sans-serif" fill="' + text + '">87%</text>';

    svg += '<rect x="' + scrX + '" y="' + (scrY + 8) + '" width="' + scrW + '" height="10" fill="' + bar + '"/>';
    svg += '<text x="' + (scrX + 3) + '" y="' + (scrY + 15) + '" font-size="6" font-family="Tahoma, sans-serif" font-weight="700" fill="#ffffff">Pengaturan</text>';
    svg += '<text x="' + (scrX + scrW - 3) + '" y="' + (scrY + 15) + '" text-anchor="end" font-size="5" font-family="Tahoma, sans-serif" fill="#ffffff">ok</text>';

    const items = [
        { label: 'Telepon',  value: '—' },
        { label: 'Bluetooth',value: has('fw_ecosystem') ? 'Aktif' : 'Mati' },
        { label: 'Sambungan',value: has('net_gprs') ? 'GPRS' : '—' },
        { label: 'Pesan',    value: has('fw_sms') ? 'Aktif' : '—' },
        { label: 'Kamera',   value: has('cam_vga') ? 'VGA' : '—' },
        { label: 'Jam',      value: 'Aktif' },
        { label: 'Memori',   value: '41 MB' }
    ];
    const startY = scrY + 20;
    const rowH = 12;
    items.forEach(function (it, i) {
        const ry = startY + i * rowH;
        if (ry + rowH > scrY + scrH - 10) return;
        svg += '<rect x="' + scrX + '" y="' + ry + '" width="' + scrW + '" height="' + rowH + '" fill="' + (i % 2 === 0 ? '#ffffff' : '#f4f4f4') + '"/>';
        svg += '<text x="' + (scrX + 4) + '" y="' + (ry + 8) + '" font-size="5" font-family="Tahoma, sans-serif" fill="' + text + '">' + it.label + '</text>';
        svg += '<text x="' + (scrX + scrW - 4) + '" y="' + (ry + 8) + '" text-anchor="end" font-size="4.5" font-family="Tahoma, sans-serif" fill="' + sub + '">' + it.value + '</text>';
        svg += '<line x1="' + scrX + '" y1="' + (ry + rowH) + '" x2="' + (scrX + scrW) + '" y2="' + (ry + rowH) + '" stroke="' + line + '" stroke-width="0.3"/>';
    });

    svg += '<rect x="' + scrX + '" y="' + (scrY + scrH - 10) + '" width="' + scrW + '" height="10" fill="' + barDark + '"/>';
    svg += '<rect x="' + (scrX + 3) + '" y="' + (scrY + scrH - 8) + '" width="3" height="3" fill="#f25022"/>';
    svg += '<rect x="' + (scrX + 7) + '" y="' + (scrY + scrH - 8) + '" width="3" height="3" fill="#7fba00"/>';
    svg += '<rect x="' + (scrX + 3) + '" y="' + (scrY + scrH - 4) + '" width="3" height="3" fill="#00a4ef"/>';
    svg += '<rect x="' + (scrX + 7) + '" y="' + (scrY + scrH - 4) + '" width="3" height="3" fill="#ffb900"/>';
    svg += '<text x="' + (scrX + 14) + '" y="' + (scrY + scrH - 3) + '" font-size="4.5" font-family="Tahoma, sans-serif" fill="#ffffff">Start</text>';
    svg += '<text x="' + (scrX + scrW - 3) + '" y="' + (scrY + scrH - 3) + '" text-anchor="end" font-size="4" font-family="Tahoma, sans-serif" fill="#ffffff">08:15</text>';

    svg += renderPhysicalKeypad(w, h, scrY + scrH + 12);

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + size + '" height="' + Math.round(size * 2) + '" preserveAspectRatio="xMidYMid meet">' + svg + '</svg>';
}

// ============================================================
// MODE 4 — EARLY iOS / ANDROID (2007-2009)
// ============================================================
function renderEarlyIos(featureIds, osState, w, h, size) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const bg = '#000000';

    let svg = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="' + bg + '"/>';

    svg += '<text x="6" y="8" font-size="5.5" font-family="-apple-system, sans-serif" font-weight="700" fill="#ffffff">9:41</text>';
    svg += '<text x="' + (w - 6) + '" y="8" text-anchor="end" font-size="5.5" font-family="-apple-system, sans-serif" fill="#ffffff">▮▮▮ ▬▬ 87%</text>';

    svg += '<defs>' +
        '<linearGradient id="ios_nav" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '<stop offset="0%" stop-color="#6a9ac8"/>' +
            '<stop offset="50%" stop-color="#3a7ab8"/>' +
            '<stop offset="100%" stop-color="#1a5a9a"/>' +
        '</linearGradient>' +
    '</defs>';
    svg += '<rect x="0" y="11" width="' + w + '" height="16" fill="url(#ios_nav)"/>';
    svg += '<rect x="0" y="11" width="' + w + '" height="0.8" fill="#ffffff" opacity="0.6"/>';
    svg += '<text x="6" y="22" font-size="7" font-family="-apple-system, sans-serif" font-weight="700" fill="#ffffff" style="text-shadow:0 1px 0 rgba(0,0,0,0.5);">‹ Setelan</text>';
    svg += '<text x="' + (w/2) + '" y="22" text-anchor="middle" font-size="7" font-family="-apple-system, sans-serif" font-weight="700" fill="#ffffff" style="text-shadow:0 1px 0 rgba(0,0,0,0.5);">Umum</text>';

    const startY = 34;
    const rowH = 22;
    const items = [
        { label: 'Info',             value: '>' },
        { label: 'Tentang',          value: getCurrentVersionString(osState) || '—' },
        { label: 'Pembaruan',        value: '>' },
        { label: 'Penggunaan',       value: has('fw_cloud_sync') ? '128 GB' : '64 GB' },
        { label: 'Tanggal & Waktu',  value: '>' },
        { label: 'Papan Ketik',      value: '>' },
        { label: 'Bahasa',           value: 'Indonesia' }
    ];

    svg += '<rect x="6" y="' + startY + '" width="' + (w - 12) + '" height="' + (items.length * rowH + 2) + '" rx="8" fill="#2a2a2a" stroke="#3a3a3a" stroke-width="0.4"/>';

    items.forEach(function (it, i) {
        const y = startY + 1 + i * rowH;
        svg += '<rect x="7" y="' + y + '" width="' + (w - 14) + '" height="0.5" fill="#ffffff" opacity="0.15"/>';
        svg += '<rect x="12" y="' + (y + 5) + '" width="12" height="12" rx="2.5" fill="#4a4a4a" stroke="#5a5a5a" stroke-width="0.4"/>';
        svg += '<text x="30" y="' + (y + 14) + '" font-size="6.5" font-family="-apple-system, sans-serif" font-weight="600" fill="#ffffff">' + it.label + '</text>';
        if (it.value === '>') {
            svg += '<path d="M ' + (w - 18) + ' ' + (y + 8) + ' L ' + (w - 15) + ' ' + (y + 11) + ' L ' + (w - 18) + ' ' + (y + 14) + '" fill="none" stroke="#8a8a8a" stroke-width="1"/>';
        } else {
            svg += '<text x="' + (w - 14) + '" y="' + (y + 14) + '" text-anchor="end" font-size="5.5" font-family="-apple-system, sans-serif" fill="#8a8a8a">' + it.value + '</text>';
            svg += '<path d="M ' + (w - 12) + ' ' + (y + 8) + ' L ' + (w - 9) + ' ' + (y + 11) + ' L ' + (w - 12) + ' ' + (y + 14) + '" fill="none" stroke="#8a8a8a" stroke-width="0.9"/>';
        }
        if (i < items.length - 1) {
            svg += '<line x1="30" y1="' + (y + rowH) + '" x2="' + (w - 8) + '" y2="' + (y + rowH) + '" stroke="#3a3a3a" stroke-width="0.3"/>';
        }
    });

    const tabY = h - 22;
    svg += '<rect x="0" y="' + tabY + '" width="' + w + '" height="22" fill="#1a1a1a"/>';
    svg += '<rect x="0" y="' + tabY + '" width="' + w + '" height="0.6" fill="#ffffff" opacity="0.2"/>';
    const tabs = ['Favorit', 'Terbaru', 'Kontak', 'Umum'];
    tabs.forEach(function (t, i) {
        const tx = (w / tabs.length) * (i + 0.5);
        const isActive = i === 3;
        svg += '<text x="' + tx + '" y="' + (tabY + 14) + '" text-anchor="middle" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + (isActive ? '#ffffff' : '#6a6a6a') + '" font-weight="600">' + t + '</text>';
    });

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + size + '" height="' + Math.round(size * 2) + '" preserveAspectRatio="xMidYMid meet">' + svg + '</svg>';
}

// ============================================================
// MODE 5 — SKEUOMORPHIC (2010-2012) — iOS 4-6
// ============================================================
function renderSkeuomorphic(featureIds, osState, w, h, size) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const bg = '#c8c8c8';

    let svg = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="' + bg + '"/>';
    svg += '<defs>' +
        '<linearGradient id="sk_nav" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '<stop offset="0%" stop-color="#5a8ac0"/>' +
            '<stop offset="50%" stop-color="#3a6aa8"/>' +
            '<stop offset="100%" stop-color="#2a5a98"/>' +
        '</linearGradient>' +
        '<linearGradient id="sk_cell" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '<stop offset="0%" stop-color="#ffffff"/>' +
            '<stop offset="100%" stop-color="#e0e0e0"/>' +
        '</linearGradient>' +
    '</defs>';

    svg += '<rect x="0" y="0" width="' + w + '" height="10" fill="#333333"/>';
    svg += '<text x="6" y="7" font-size="5.5" font-family="-apple-system, sans-serif" font-weight="700" fill="#ffffff">9:41</text>';
    svg += '<text x="' + (w - 6) + '" y="7" text-anchor="end" font-size="5.5" font-family="-apple-system, sans-serif" fill="#ffffff">▮▮▮ ▬▬ 87%</text>';

    svg += '<rect x="0" y="10" width="' + w + '" height="16" fill="url(#sk_nav)"/>';
    svg += '<rect x="0" y="10" width="' + w + '" height="1" fill="#ffffff" opacity="0.5"/>';
    svg += '<rect x="0" y="25" width="' + w + '" height="1" fill="#000000" opacity="0.3"/>';
    svg += '<text x="6" y="21" font-size="7" font-family="-apple-system, sans-serif" font-weight="700" fill="#ffffff" style="text-shadow:0 -1px 0 rgba(0,0,0,0.5);">‹ Umum</text>';
    svg += '<text x="' + (w/2) + '" y="21" text-anchor="middle" font-size="7" font-family="-apple-system, sans-serif" font-weight="700" fill="#ffffff" style="text-shadow:0 -1px 0 rgba(0,0,0,0.5);">Pengaturan</text>';

    const startY = 32;
    const rowH = 24;
    const groups = [
        { title: 'KONEKSI', rows: [
            { label: 'Wi-Fi', value: has('fw_browser_mobile') ? 'Home-Net' : 'Mati' },
            { label: 'Bluetooth', value: has('fw_ecosystem') ? 'Aktif' : 'Mati' },
            { label: 'Data Seluler', value: has('net_3g') ? '3G Aktif' : has('net_gprs') ? 'GPRS' : 'Mati' }
        ]},
        { title: 'SISTEM', rows: [
            { label: 'Umum', value: '›' },
            { label: 'Tampilan & Kecerahan', value: '›' },
            { label: 'Suara', value: '›' },
            { label: 'Safari', value: has('fw_browser_mobile') ? 'Aktif' : '—' }
        ]}
    ];

    let curY = startY;
    groups.forEach(function (g) {
        svg += '<rect x="0" y="' + curY + '" width="' + w + '" height="9" fill="#a8a8a8"/>';
        svg += '<rect x="0" y="' + curY + '" width="' + w + '" height="1" fill="#000000" opacity="0.2"/>';
        svg += '<text x="8" y="' + (curY + 6.5) + '" font-size="5" font-family="-apple-system, sans-serif" font-weight="700" fill="#3a3a3a">' + g.title + '</text>';
        curY += 9;

        g.rows.forEach(function (row, i) {
            const ry = curY + i * rowH;
            svg += '<rect x="0" y="' + ry + '" width="' + w + '" height="' + rowH + '" fill="url(#sk_cell)"/>';
            svg += '<rect x="0" y="' + ry + '" width="' + w + '" height="0.5" fill="#ffffff"/>';
            if (row.value === '›') {
                svg += '<path d="M ' + (w - 12) + ' ' + (ry + 9) + ' L ' + (w - 9) + ' ' + (ry + 12) + ' L ' + (w - 12) + ' ' + (ry + 15) + '" fill="none" stroke="#8a8a8a" stroke-width="1.2"/>';
            } else {
                svg += '<text x="' + (w - 8) + '" y="' + (ry + 14) + '" text-anchor="end" font-size="5.5" font-family="-apple-system, sans-serif" fill="#5a5a5a">' + row.value + '</text>';
            }
            svg += '<text x="8" y="' + (ry + 14) + '" font-size="6.5" font-family="-apple-system, sans-serif" font-weight="600" fill="#1a1a1a" style="text-shadow:0 1px 0 rgba(255,255,255,0.5);">' + row.label + '</text>';
            svg += '<line x1="0" y1="' + (ry + rowH) + '" x2="' + w + '" y2="' + (ry + rowH) + '" stroke="#8a8a8a" stroke-width="0.3"/>';
        });
        curY += g.rows.length * rowH + 8;
    });

    svg += '<text x="8" y="' + (curY + 8) + '" font-size="5" font-family="-apple-system, sans-serif" font-weight="700" fill="#3a3a3a">NOTIFIKASI</text>';
    curY += 10;
    svg += '<rect x="0" y="' + curY + '" width="' + w + '" height="' + rowH + '" fill="url(#sk_cell)"/>';
    svg += '<text x="8" y="' + (curY + 14) + '" font-size="6.5" font-family="-apple-system, sans-serif" font-weight="600" fill="#1a1a1a" style="text-shadow:0 1px 0 rgba(255,255,255,0.5);">Pusat Notifikasi</text>';
    const toggleOn = has('fw_smart_notif') || has('fw_notifications');
    svg += '<rect x="' + (w - 32) + '" y="' + (curY + 6) + '" width="24" height="13" rx="6.5" fill="' + (toggleOn ? '#4a9a4a' : '#8a8a8a') + '" stroke="#5a5a5a" stroke-width="0.4"/>';
    svg += '<circle cx="' + (toggleOn ? (w - 14) : (w - 26)) + '" cy="' + (curY + 12.5) + '" r="5" fill="#ffffff" stroke="#5a5a5a" stroke-width="0.3"/>';

    const tabY = h - 26;
    svg += '<rect x="0" y="' + tabY + '" width="' + w + '" height="26" fill="#2a2a2a"/>';
    svg += '<rect x="0" y="' + tabY + '" width="' + w + '" height="0.8" fill="#5a5a5a"/>';
    const tabs = ['Favorit', 'Terbaru', 'Kontak', 'Umum'];
    tabs.forEach(function (t, i) {
        const tx = (w / tabs.length) * (i + 0.5);
        const isActive = i === 3;
        svg += '<circle cx="' + tx + '" cy="' + (tabY + 8) + '" r="3" fill="none" stroke="' + (isActive ? '#ffffff' : '#6a6a6a') + '" stroke-width="0.8"/>';
        svg += '<text x="' + tx + '" y="' + (tabY + 19) + '" text-anchor="middle" font-size="5" font-family="-apple-system, sans-serif" fill="' + (isActive ? '#ffffff' : '#6a6a6a') + '" font-weight="600">' + t + '</text>';
    });

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + size + '" height="' + Math.round(size * 2) + '" preserveAspectRatio="xMidYMid meet">' + svg + '</svg>';
}

// ============================================================
// MODE 6 — FLAT / MATERIAL (2013-2014)
// ============================================================
function renderFlatMaterial(featureIds, osState, w, h, size) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const bg = '#f2f2f2';
    const surface = '#ffffff';
    const accent = '#007aff';
    const text = '#1a1a1a';
    const sub = '#8a8a8e';
    const line = 'rgba(0,0,0,0.10)';

    let svg = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="' + bg + '"/>';

    svg += '<text x="6" y="8" font-size="5.5" font-family="-apple-system, sans-serif" font-weight="600" fill="' + text + '">9:41</text>';
    svg += '<text x="' + (w - 6) + '" y="8" text-anchor="end" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + text + '">▮▮▮ ▬▬ 87%</text>';

    svg += '<text x="6" y="22" font-size="7" font-family="-apple-system, sans-serif" font-weight="400" fill="' + accent + '">‹ Umum</text>';
    svg += '<text x="' + (w/2) + '" y="22" text-anchor="middle" font-size="7.5" font-family="-apple-system, sans-serif" font-weight="600" fill="' + text + '">Pengaturan</text>';

    svg += '<rect x="8" y="28" width="' + (w - 16) + '" height="12" rx="6" fill="#e0e0e5"/>';
    svg += '<circle cx="16" cy="34" r="2.2" fill="none" stroke="' + sub + '" stroke-width="0.7"/>';
    svg += '<line x1="17.5" y1="35.5" x2="19" y2="37" stroke="' + sub + '" stroke-width="0.7" stroke-linecap="round"/>';
    svg += '<text x="22" y="36" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + sub + '">Cari</text>';

    let curY = 46;
    svg += '<text x="14" y="' + curY + '" font-size="4.5" font-family="-apple-system, sans-serif" font-weight="600" fill="' + sub + '" letter-spacing="0.4">KONEKSI</text>';
    curY += 3;

    const group1 = [
        { icon: 'wifi',   label: 'Wi-Fi',           value: has('fw_browser_mobile') ? 'Home-Net' : 'Mati' },
        { icon: 'signal', label: 'Data Seluler',    value: has('net_3g') ? '3G Aktif' : 'Mati' },
        { icon: 'cloud',  label: 'Bluetooth',       value: has('fw_ecosystem') ? 'Aktif' : 'Mati' }
    ];

    svg += '<rect x="8" y="' + curY + '" width="' + (w - 16) + '" height="' + (group1.length * 18 + 2) + '" rx="4" fill="' + surface + '"/>';
    group1.forEach(function (it, i) {
        const ry = curY + 1 + i * 18;
        svg += '<rect x="13" y="' + (ry + 4) + '" width="11" height="11" rx="3" fill="' + accent + '"/>';
        svg += '<g transform="translate(' + 15 + ',' + (ry + 6) + ')">' + glyph(it.icon, '#ffffff', 0.9) + '</g>';
        svg += '<text x="29" y="' + (ry + 12) + '" font-size="6.5" font-family="-apple-system, sans-serif" font-weight="500" fill="' + text + '">' + it.label + '</text>';
        if (it.value) svg += '<text x="' + (w - 14) + '" y="' + (ry + 12) + '" text-anchor="end" font-size="6" font-family="-apple-system, sans-serif" fill="' + sub + '">' + it.value + '</text>';
        svg += '<path d="M ' + (w - 12) + ' ' + (ry + 7) + ' L ' + (w - 9.5) + ' ' + (ry + 9.5) + ' L ' + (w - 12) + ' ' + (ry + 12) + '" fill="none" stroke="' + sub + '" stroke-width="0.7"/>';
        if (i < group1.length - 1) svg += '<line x1="29" y1="' + (ry + 18) + '" x2="' + (w - 10) + '" y2="' + (ry + 18) + '" stroke="' + line + '" stroke-width="0.3"/>';
    });
    curY += group1.length * 18 + 8;

    svg += '<text x="14" y="' + curY + '" font-size="4.5" font-family="-apple-system, sans-serif" font-weight="600" fill="' + sub + '" letter-spacing="0.4">SISTEM</text>';
    curY += 3;

    const group2 = [
        { icon: 'display', label: 'Tampilan & Kecerahan', value: null },
        { icon: 'volume',  label: 'Suara',                 value: null },
        { icon: 'bell',    label: 'Notifikasi',            value: null, toggle: has('fw_smart_notif') || has('fw_notifications') },
        { icon: 'lock',    label: 'Umum',                  value: null }
    ];

    svg += '<rect x="8" y="' + curY + '" width="' + (w - 16) + '" height="' + (group2.length * 18 + 2) + '" rx="4" fill="' + surface + '"/>';
    group2.forEach(function (it, i) {
        const ry = curY + 1 + i * 18;
        svg += '<rect x="13" y="' + (ry + 4) + '" width="11" height="11" rx="3" fill="' + accent + '"/>';
        svg += '<g transform="translate(' + 15 + ',' + (ry + 6) + ')">' + glyph(it.icon, '#ffffff', 0.9) + '</g>';
        svg += '<text x="29" y="' + (ry + 12) + '" font-size="6.5" font-family="-apple-system, sans-serif" font-weight="500" fill="' + text + '">' + it.label + '</text>';
        if (it.toggle === true) {
            svg += '<rect x="' + (w - 26) + '" y="' + (ry + 5) + '" width="16" height="9" rx="4.5" fill="' + accent + '"/>';
            svg += '<circle cx="' + (w - 14) + '" cy="' + (ry + 9.5) + '" r="3.5" fill="#ffffff"/>';
        } else if (it.toggle === false) {
            svg += '<rect x="' + (w - 26) + '" y="' + (ry + 5) + '" width="16" height="9" rx="4.5" fill="#e0e0e5"/>';
            svg += '<circle cx="' + (w - 23) + '" cy="' + (ry + 9.5) + '" r="3.5" fill="#ffffff"/>';
        } else {
            svg += '<path d="M ' + (w - 12) + ' ' + (ry + 7) + ' L ' + (w - 9.5) + ' ' + (ry + 9.5) + ' L ' + (w - 12) + ' ' + (ry + 12) + '" fill="none" stroke="' + sub + '" stroke-width="0.7"/>';
        }
        if (i < group2.length - 1) svg += '<line x1="29" y1="' + (ry + 18) + '" x2="' + (w - 10) + '" y2="' + (ry + 18) + '" stroke="' + line + '" stroke-width="0.3"/>';
    });
    curY += group2.length * 18 + 8;

    svg += '<text x="14" y="' + curY + '" font-size="4.5" font-family="-apple-system, sans-serif" font-weight="600" fill="' + sub + '" letter-spacing="0.4">TENTANG</text>';
    curY += 3;
    svg += '<rect x="8" y="' + curY + '" width="' + (w - 16) + '" height="20" rx="4" fill="' + surface + '"/>';
    svg += '<text x="29" y="' + (curY + 12) + '" font-size="6.5" font-family="-apple-system, sans-serif" font-weight="500" fill="' + text + '">Tentang</text>';
    svg += '<text x="' + (w - 14) + '" y="' + (curY + 12) + '" text-anchor="end" font-size="6" font-family="-apple-system, sans-serif" fill="' + sub + '">' + (getCurrentVersionString(osState) || '—') + '</text>';
    svg += '<path d="M ' + (w - 12) + ' ' + (curY + 7) + ' L ' + (w - 9.5) + ' ' + (curY + 10) + ' L ' + (w - 12) + ' ' + (curY + 13) + '" fill="none" stroke="' + sub + '" stroke-width="0.7"/>';

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + size + '" height="' + Math.round(size * 2) + '" preserveAspectRatio="xMidYMid meet">' + svg + '</svg>';
}

// ============================================================
// MODE 7 — GROUPED MODERN (2015-2018)
// ============================================================
function renderGroupedModern(featureIds, osState, w, h, size) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const bg = '#f2f2f7';
    const surface = '#ffffff';
    const accent = '#007aff';
    const text = '#000000';
    const sub = '#8a8a8e';
    const line = 'rgba(0,0,0,0.10)';

    let svg = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="' + bg + '"/>';

    svg += '<text x="6" y="8" font-size="5.5" font-family="-apple-system, sans-serif" font-weight="600" fill="' + text + '">9:41</text>';
    svg += '<text x="' + (w - 6) + '" y="8" text-anchor="end" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + text + '">▮▮▮ ▬▬ 87%</text>';

    svg += '<text x="14" y="24" font-size="11" font-family="-apple-system, sans-serif" font-weight="700" fill="' + text + '">Pengaturan</text>';

    const profY = 30;
    svg += '<rect x="8" y="' + profY + '" width="' + (w - 16) + '" height="28" rx="6" fill="' + surface + '"/>';
    const initial = ((osState && osState.name) || 'M').charAt(0).toUpperCase();
    svg += '<circle cx="22" cy="' + (profY + 14) + '" r="8" fill="' + accent + '"/>';
    svg += '<text x="22" y="' + (profY + 17) + '" text-anchor="middle" font-size="9" font-family="-apple-system, sans-serif" font-weight="700" fill="#ffffff">' + escapeHtml(initial) + '</text>';
    svg += '<text x="36" y="' + (profY + 12) + '" font-size="7" font-family="-apple-system, sans-serif" font-weight="600" fill="' + text + '">' + escapeHtml((osState && osState.name) || 'MyOS') + '</text>';
    svg += '<text x="36" y="' + (profY + 21) + '" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + sub + '">ID Apple, iCloud, dll.</text>';
    svg += '<path d="M ' + (w - 18) + ' ' + (profY + 11) + ' L ' + (w - 15) + ' ' + (profY + 14) + ' L ' + (w - 18) + ' ' + (profY + 17) + '" fill="none" stroke="' + sub + '" stroke-width="0.8"/>';

    let curY = profY + 36;
    const rowH = 18;

    const sections = [
        { items: [
            { icon: 'wifi',   label: 'Wi-Fi',           value: has('fw_browser_mobile') ? 'Home-Net' : 'Mati', bg: '#007aff' },
            { icon: 'cloud',  label: 'Bluetooth',       value: has('fw_ecosystem') ? 'Aktif' : 'Mati', bg: '#007aff' },
            { icon: 'signal', label: 'Data Seluler',    value: has('net_4g') ? '4G' : has('net_3g') ? '3G' : 'Mati', bg: '#34c759' },
            { icon: 'globe',  label: 'Hotspot Pribadi', value: 'Mati', bg: '#34c759' }
        ]},
        { items: [
            { icon: 'bell',    label: 'Notifikasi',      value: null, toggle: has('fw_smart_notif') || has('fw_notifications'), bg: '#ff3b30' },
            { icon: 'volume',  label: 'Suara & Getaran', value: null, bg: '#ff3b30' },
            { icon: 'moon',    label: 'Jangan Ganggu',   value: null, toggle: has('fw_focus_mode'), bg: '#5856d6' },
            { icon: 'display', label: 'Waktu Layar',     value: has('fw_digital_wellbeing') ? 'Aktif' : '—', bg: '#5856d6' }
        ]},
        { items: [
            { icon: 'lock',    label: 'Face ID & Kode Sandi', value: has('fw_biometric') ? 'Aktif' : '—', bg: '#34c759' },
            { icon: 'shield',  label: 'Privasi',              value: null, toggle: has('fw_privacy'), bg: '#007aff' },
            { icon: 'battery', label: 'Baterai',              value: '87%', bg: '#34c759' },
            { icon: 'info',    label: 'Umum',                 value: getCurrentVersionString(osState) || '—', bg: '#8e8e93' }
        ]}
    ];

    sections.forEach(function (sec) {
        const groupH = sec.items.length * rowH + 2;
        svg += '<rect x="8" y="' + curY + '" width="' + (w - 16) + '" height="' + groupH + '" rx="6" fill="' + surface + '"/>';
        sec.items.forEach(function (it, i) {
            const ry = curY + 1 + i * rowH;
            svg += '<rect x="13" y="' + (ry + 3) + '" width="12" height="12" rx="3" fill="' + it.bg + '"/>';
            svg += '<g transform="translate(' + 15.5 + ',' + (ry + 5.5) + ')">' + glyph(it.icon, '#ffffff', 0.9) + '</g>';
            svg += '<text x="30" y="' + (ry + 12) + '" font-size="6.5" font-family="-apple-system, sans-serif" font-weight="500" fill="' + text + '">' + it.label + '</text>';
            if (it.toggle === true) {
                svg += '<rect x="' + (w - 26) + '" y="' + (ry + 4.5) + '" width="16" height="9" rx="4.5" fill="#34c759"/>';
                svg += '<circle cx="' + (w - 14) + '" cy="' + (ry + 9) + '" r="3.5" fill="#ffffff"/>';
            } else if (it.toggle === false) {
                svg += '<rect x="' + (w - 26) + '" y="' + (ry + 4.5) + '" width="16" height="9" rx="4.5" fill="#e0e0e5"/>';
                svg += '<circle cx="' + (w - 23) + '" cy="' + (ry + 9) + '" r="3.5" fill="#ffffff"/>';
            } else {
                if (it.value) svg += '<text x="' + (w - 14) + '" y="' + (ry + 12) + '" text-anchor="end" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + sub + '">' + it.value + '</text>';
                svg += '<path d="M ' + (w - 12) + ' ' + (ry + 7) + ' L ' + (w - 9.5) + ' ' + (ry + 9.5) + ' L ' + (w - 12) + ' ' + (ry + 12) + '" fill="none" stroke="' + sub + '" stroke-width="0.7" opacity="0.7"/>';
            }
            if (i < sec.items.length - 1) svg += '<line x1="30" y1="' + (ry + rowH) + '" x2="' + (w - 10) + '" y2="' + (ry + rowH) + '" stroke="' + line + '" stroke-width="0.3"/>';
        });
        curY += groupH + 8;
    });

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + size + '" height="' + Math.round(size * 2) + '" preserveAspectRatio="xMidYMid meet">' + svg + '</svg>';
}

// ============================================================
// MODE 8 — MATERIAL YOU (2019-2022)
// ============================================================
function renderMaterialYou(featureIds, osState, w, h, size) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const isDark = has('fw_dark_mode');

    const pal = isDark ? {
        bg: '#000000', surface: '#1c1c1e', surfaceAlt: '#2c2c2e',
        text: '#ffffff', sub: 'rgba(255,255,255,0.55)', accent: '#0a84ff', line: 'rgba(255,255,255,0.08)'
    } : {
        bg: '#f2f2f7', surface: '#ffffff', surfaceAlt: '#e5e5ea',
        text: '#000000', sub: '#8a8a8e', accent: '#007aff', line: 'rgba(0,0,0,0.10)'
    };

    let svg = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="' + pal.bg + '"/>';

    svg += '<text x="6" y="8" font-size="5.5" font-family="-apple-system, sans-serif" font-weight="700" fill="' + pal.text + '">9:41</text>';
    svg += '<text x="' + (w - 6) + '" y="8" text-anchor="end" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + pal.text + '">5G ▮▮ 87%</text>';

    svg += '<text x="14" y="24" font-size="12" font-family="-apple-system, sans-serif" font-weight="700" fill="' + pal.text + '">Pengaturan</text>';

    svg += '<rect x="14" y="30" width="' + (w - 28) + '" height="12" rx="6" fill="' + (isDark ? '#1c1c1e' : '#e5e5ea') + '"/>';
    svg += '<circle cx="22" cy="36" r="2.2" fill="none" stroke="' + pal.sub + '" stroke-width="0.7"/>';
    svg += '<line x1="23.5" y1="37.5" x2="25" y2="39" stroke="' + pal.sub + '" stroke-width="0.7" stroke-linecap="round"/>';
    svg += '<text x="29" y="38" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + pal.sub + '">Cari</text>';

    const profY = 48;
    svg += '<rect x="8" y="' + profY + '" width="' + (w - 16) + '" height="34" rx="10" fill="' + pal.surface + '"/>';
    const initial = ((osState && osState.name) || 'M').charAt(0).toUpperCase();
    svg += '<circle cx="24" cy="' + (profY + 17) + '" r="11" fill="' + pal.accent + '"/>';
    svg += '<text x="24" y="' + (profY + 20.5) + '" text-anchor="middle" font-size="11" font-family="-apple-system, sans-serif" font-weight="700" fill="#ffffff">' + escapeHtml(initial) + '</text>';
    svg += '<text x="42" y="' + (profY + 14) + '" font-size="7.5" font-family="-apple-system, sans-serif" font-weight="700" fill="' + pal.text + '">' + escapeHtml((osState && osState.name) || 'MyOS') + '</text>';
    svg += '<text x="42" y="' + (profY + 24) + '" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + pal.sub + '">Akun &amp; Ekosistem</text>';
    svg += '<path d="M ' + (w - 18) + ' ' + (profY + 14) + ' L ' + (w - 15) + ' ' + (profY + 17) + ' L ' + (w - 18) + ' ' + (profY + 20) + '" fill="none" stroke="' + pal.sub + '" stroke-width="0.8"/>';

    let curY = profY + 42;
    const rowH = 20;

    const sections = [
        [
            { icon: 'wifi',   label: 'Wi-Fi',              value: has('fw_browser_mobile') ? 'Home-Net' : 'Mati',   bg: '#007aff' },
            { icon: 'cloud',  label: 'Bluetooth',          value: has('fw_ecosystem') ? 'Aktif' : 'Mati',           bg: '#007aff' },
            { icon: 'signal', label: 'Jaringan Seluler',   value: has('net_5g') ? '5G' : has('net_4g') ? 'LTE' : '—', bg: '#34c759' }
        ],
        [
            { icon: 'bell',    label: 'Notifikasi',           value: null, toggle: has('fw_smart_notif') || has('fw_notifications'), bg: '#ff3b30' },
            { icon: 'moon',    label: 'Mode Fokus',           value: null, toggle: has('fw_focus_mode'), bg: '#5856d6' },
            { icon: 'display', label: 'Tampilan & Kecerahan', value: isDark ? 'Gelap' : 'Terang', bg: '#5856d6' }
        ],
        [
            { icon: 'lock',    label: 'Face ID & Kode Sandi', value: has('fw_biometric') ? 'Aktif' : '—', bg: '#34c759' },
            { icon: 'shield',  label: 'Privasi & Keamanan',   value: has('fw_privacy') ? 'Terlindungi' : 'Standar', bg: '#007aff' },
            { icon: 'battery', label: 'Baterai',              value: '87%', bg: '#34c759' },
            { icon: 'info',    label: 'Umum',                 value: getCurrentVersionString(osState) || '—', bg: '#8e8e93' }
        ]
    ];

    sections.forEach(function (sec) {
        const groupH = sec.length * rowH + 2;
        svg += '<rect x="8" y="' + curY + '" width="' + (w - 16) + '" height="' + groupH + '" rx="10" fill="' + pal.surface + '"/>';
        sec.forEach(function (it, i) {
            const ry = curY + 1 + i * rowH;
            svg += '<rect x="13" y="' + (ry + 4) + '" width="12" height="12" rx="3.5" fill="' + it.bg + '"/>';
            svg += '<g transform="translate(' + 15.5 + ',' + (ry + 6.5) + ')">' + glyph(it.icon, '#ffffff', 0.9) + '</g>';
            svg += '<text x="30" y="' + (ry + 13.5) + '" font-size="6.5" font-family="-apple-system, sans-serif" font-weight="500" fill="' + pal.text + '">' + it.label + '</text>';
            if (it.toggle === true) {
                svg += '<rect x="' + (w - 26) + '" y="' + (ry + 5.5) + '" width="16" height="9" rx="4.5" fill="#34c759"/>';
                svg += '<circle cx="' + (w - 14) + '" cy="' + (ry + 10) + '" r="3.5" fill="#ffffff"/>';
            } else if (it.toggle === false) {
                svg += '<rect x="' + (w - 26) + '" y="' + (ry + 5.5) + '" width="16" height="9" rx="4.5" fill="' + pal.surfaceAlt + '"/>';
                svg += '<circle cx="' + (w - 23) + '" cy="' + (ry + 10) + '" r="3.5" fill="#ffffff"/>';
            } else {
                if (it.value) svg += '<text x="' + (w - 14) + '" y="' + (ry + 13.5) + '" text-anchor="end" font-size="6" font-family="-apple-system, sans-serif" fill="' + pal.sub + '">' + it.value + '</text>';
                svg += '<path d="M ' + (w - 12) + ' ' + (ry + 8) + ' L ' + (w - 9.5) + ' ' + (ry + 10.5) + ' L ' + (w - 12) + ' ' + (ry + 13) + '" fill="none" stroke="' + pal.sub + '" stroke-width="0.7" opacity="0.7"/>';
            }
            if (i < sec.length - 1) svg += '<line x1="30" y1="' + (ry + rowH) + '" x2="' + (w - 10) + '" y2="' + (ry + rowH) + '" stroke="' + pal.line + '" stroke-width="0.3"/>';
        });
        curY += groupH + 8;
    });

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + size + '" height="' + Math.round(size * 2) + '" preserveAspectRatio="xMidYMid meet">' + svg + '</svg>';
}

// ============================================================
// MODE 9 — AI MODERN (2023+)
// ============================================================
function renderAiModern(featureIds, osState, w, h, size) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const isDark = has('fw_dark_mode');
    const hasAI = has('fw_siri') || has('fw_ai_on_device') || has('fw_ondevice_llm');

    const pal = isDark ? {
        bg: '#04040a', surface: '#12121a', surfaceAlt: '#1c1c26',
        text: '#ffffff', sub: 'rgba(255,255,255,0.5)', accent: '#a855f7',
        accent2: '#06b6d4', line: 'rgba(168,85,247,0.15)'
    } : {
        bg: '#f5f3ff', surface: '#ffffff', surfaceAlt: '#ece9ff',
        text: '#1a0a2a', sub: '#6a5575', accent: '#8b5cf6',
        accent2: '#06b6d4', line: 'rgba(139,92,246,0.15)'
    };

    let svg = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="' + pal.bg + '"/>';

    if (isDark) {
        svg += '<defs><radialGradient id="ai_glow1" cx="30%" cy="20%"><stop offset="0%" stop-color="#a855f7" stop-opacity="0.25"/><stop offset="100%" stop-color="#04040a" stop-opacity="0"/></radialGradient>' +
            '<radialGradient id="ai_glow2" cx="70%" cy="60%"><stop offset="0%" stop-color="#06b6d4" stop-opacity="0.18"/><stop offset="100%" stop-color="#04040a" stop-opacity="0"/></radialGradient></defs>' +
            '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="url(#ai_glow1)"/>' +
            '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="url(#ai_glow2)"/>';
    }

    svg += '<text x="6" y="8" font-size="5.5" font-family="-apple-system, sans-serif" font-weight="700" fill="' + pal.text + '">9:41</text>';
    svg += '<text x="' + (w - 6) + '" y="8" text-anchor="end" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + pal.text + '">6G ▮▮ 87%</text>';

    svg += '<text x="14" y="24" font-size="12" font-family="-apple-system, sans-serif" font-weight="800" fill="' + pal.text + '">Pengaturan</text>';
    svg += '<text x="14" y="32" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + pal.sub + '">Didukung AI On-Device</text>';

    if (hasAI) {
        const aiY = 40;
        svg += '<rect x="8" y="' + aiY + '" width="' + (w - 16) + '" height="34" rx="12" fill="' + pal.surface + '" stroke="' + pal.accent + '" stroke-width="0.5"/>';
        svg += '<circle cx="22" cy="' + (aiY + 17) + '" r="9" fill="' + pal.accent + '" opacity="0.9"/>';
        svg += '<g transform="translate(' + 17 + ',' + (aiY + 12) + ')">' + glyph('sparkles', '#ffffff', 1.1) + '</g>';
        svg += '<text x="38" y="' + (aiY + 14) + '" font-size="7.5" font-family="-apple-system, sans-serif" font-weight="700" fill="' + pal.text + '">Asisten AI</text>';
        svg += '<text x="38" y="' + (aiY + 24) + '" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + pal.accent + '">Aktif · Pemrosesan lokal</text>';
        svg += '<path d="M ' + (w - 18) + ' ' + (aiY + 14) + ' L ' + (w - 15) + ' ' + (aiY + 17) + ' L ' + (w - 18) + ' ' + (aiY + 20) + '" fill="none" stroke="' + pal.sub + '" stroke-width="0.8"/>';
    }

    let curY = hasAI ? 82 : 44;
    const rowH = 20;

    const sections = [
        [
            { icon: 'signal', label: 'Jaringan 6G',   value: has('net_5g') ? 'Aktif' : 'LTE', bg: pal.accent2 },
            { icon: 'wifi',   label: 'Wi-Fi 7',       value: 'Home-Mesh',                     bg: pal.accent2 },
            { icon: 'cloud',  label: 'Nearby Share',  value: 'Aktif',                         bg: pal.accent2 }
        ],
        [
            { icon: 'bell',    label: 'Notifikasi Cerdas', value: null, toggle: has('fw_smart_notif') || has('fw_notifications'), bg: '#ff3b30' },
            { icon: 'moon',    label: 'Mode Fokus AI',     value: null, toggle: has('fw_focus_mode'), bg: pal.accent },
            { icon: 'display', label: 'Tampilan',          value: isDark ? 'Gelap' : 'Terang', bg: pal.accent }
        ],
        [
            { icon: 'lock',    label: 'Biometrik',         value: has('fw_biometric') ? 'Aktif' : '—', bg: '#34c759' },
            { icon: 'shield',  label: 'Privasi Lokal',     value: has('fw_privacy') ? 'Terlindungi' : 'Standar', bg: '#34c759' },
            { icon: 'battery', label: 'Baterai Adaptif',   value: '87%', bg: '#34c759' },
            { icon: 'sparkles',label: 'AI On-Device',      value: has('fw_ai_on_device') ? 'Aktif' : '—', bg: pal.accent },
            { icon: 'info',    label: 'Umum',              value: getCurrentVersionString(osState) || '—', bg: '#8e8e93' }
        ]
    ];

    sections.forEach(function (sec) {
        const groupH = sec.length * rowH + 2;
        svg += '<rect x="8" y="' + curY + '" width="' + (w - 16) + '" height="' + groupH + '" rx="12" fill="' + pal.surface + '"/>';
        sec.forEach(function (it, i) {
            const ry = curY + 1 + i * rowH;
            svg += '<rect x="13" y="' + (ry + 4) + '" width="12" height="12" rx="3.5" fill="' + it.bg + '"/>';
            svg += '<g transform="translate(' + 15.5 + ',' + (ry + 6.5) + ')">' + glyph(it.icon, '#ffffff', 0.9) + '</g>';
            svg += '<text x="30" y="' + (ry + 13.5) + '" font-size="6.5" font-family="-apple-system, sans-serif" font-weight="500" fill="' + pal.text + '">' + it.label + '</text>';
            if (it.toggle === true) {
                svg += '<rect x="' + (w - 26) + '" y="' + (ry + 5.5) + '" width="16" height="9" rx="4.5" fill="' + pal.accent + '"/>';
                svg += '<circle cx="' + (w - 14) + '" cy="' + (ry + 10) + '" r="3.5" fill="#ffffff"/>';
            } else if (it.toggle === false) {
                svg += '<rect x="' + (w - 26) + '" y="' + (ry + 5.5) + '" width="16" height="9" rx="4.5" fill="' + pal.surfaceAlt + '"/>';
                svg += '<circle cx="' + (w - 23) + '" cy="' + (ry + 10) + '" r="3.5" fill="#ffffff"/>';
            } else {
                if (it.value) svg += '<text x="' + (w - 14) + '" y="' + (ry + 13.5) + '" text-anchor="end" font-size="6" font-family="-apple-system, sans-serif" fill="' + pal.sub + '">' + it.value + '</text>';
                svg += '<path d="M ' + (w - 12) + ' ' + (ry + 8) + ' L ' + (w - 9.5) + ' ' + (ry + 10.5) + ' L ' + (w - 12) + ' ' + (ry + 13) + '" fill="none" stroke="' + pal.sub + '" stroke-width="0.7" opacity="0.7"/>';
            }
            if (i < sec.length - 1) svg += '<line x1="30" y1="' + (ry + rowH) + '" x2="' + (w - 10) + '" y2="' + (ry + rowH) + '" stroke="' + pal.line + '" stroke-width="0.3"/>';
        });
        curY += groupH + 8;
    });

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + size + '" height="' + Math.round(size * 2) + '" preserveAspectRatio="xMidYMid meet">' + svg + '</svg>';
}

// ============================================================
// MAIN
// ============================================================
export function renderOsScreenMockup(opts) {
    opts = opts || {};
    const st = opts.osState ? {
        os: opts.osState,
        time: opts.time || { currentYear: 2000 },
        research: opts.research || { completed: [] }
    } : safeGetState();

    const year = (st.time && st.time.currentYear) || 2000;
    const completed = (st.research && st.research.completed) || [];
    const spec = resolveSpec(year, completed);

    const osState = st.os || {};
    const featureIds = getCurrentFeatures(osState);

    const size = opts.size || 120;
    const w = 200;
    const h = 400;
    const mode = getOsMode(year);

    let svgInner = '';
    if (mode === 'mono')              svgInner = renderMono(featureIds, osState, w, h, size);
    else if (mode === 'symbian_grid') svgInner = renderSymbianGrid(featureIds, osState, w, h, size);
    else if (mode === 'windows_mobile') svgInner = renderWindowsMobile(featureIds, osState, w, h, size);
    else if (mode === 'early_ios')    svgInner = renderEarlyIos(featureIds, osState, w, h, size);
    else if (mode === 'skeuomorphic') svgInner = renderSkeuomorphic(featureIds, osState, w, h, size);
    else if (mode === 'flat_material') svgInner = renderFlatMaterial(featureIds, osState, w, h, size);
    else if (mode === 'grouped_modern') svgInner = renderGroupedModern(featureIds, osState, w, h, size);
    else if (mode === 'material_you') svgInner = renderMaterialYou(featureIds, osState, w, h, size);
    else                              svgInner = renderAiModern(featureIds, osState, w, h, size);

    return '<div class="os-screen-wrap">' + svgInner + '</div>';
}

export function renderOsScreenThumbnail(osState, size) {
    return renderOsScreenMockup({ osState: osState, size: size || 100 });
}

export function getOsMockupInfo() {
    const st = safeGetState();
    const year = (st.time && st.time.currentYear) || 2000;
    const completed = (st.research && st.research.completed) || [];
    const featureIds = getCurrentFeatures(st.os || {});
    return {
        year: year,
        mode: getOsMode(year),
        specId: resolveSpec(year, completed).id,
        featureCount: featureIds.length
    };
        }
