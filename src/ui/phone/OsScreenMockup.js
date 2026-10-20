import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/phone/OsScreenMockup.js
// ============================================================
// OsScreenMockup — Settings view realistis 8 era 2000-2026.
// Meniru tampilan asli OS tiap era: Symbian, Windows Mobile,
// iOS awal, skeuomorphic iOS 6, flat, Material, Material You, AI.
// Nilai di setiap row berubah sesuai fitur OS pemain.
// ============================================================
import { state } from '../../core/GameState.js';
import { getDesignEraForYear } from '../../data/era-design.data.js';
import { resolveSpec } from '../../data/phone-specs.data.js';
import { t as _tr, LanguageService } from '../../core/LanguageService.js';


// [i18n] Teks SVG diterjemahkan saat render (bukan saat import) dan di-escape untuk SVG/HTML.
function T(key) { return escapeHtml(_tr(key)); }

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
    if (year <= 2002) return 'mono';           // Nokia S30, Symbian awal
    if (year <= 2004) return 'symbian_grid';   // Symbian S60 v1-2
    if (year <= 2006) return 'windows_mobile'; // Windows Mobile 2003/5
    if (year <= 2009) return 'early_ios';      // iPhone OS 1-3, Android 1
    if (year <= 2012) return 'skeuomorphic';   // iOS 4-6, Android 2-4
    if (year <= 2014) return 'flat_material';  // iOS 7-8, Material Design
    if (year <= 2018) return 'grouped_modern'; // iOS 10-12, Android 8-9
    if (year <= 2022) return 'material_you';   // iOS 15-16, Android 12-13
    return 'ai_modern';                         // iOS 17+, Android 14+
}

// Mode tampilan berbasis sentuh (UI kapasitif/iOS/Material).
const TOUCH_MODES = ['early_ios', 'skeuomorphic', 'flat_material', 'grouped_modern', 'material_you', 'ai_modern'];

// Mode layar mengikuti tahun, tetapi UI sentuh hanya tampil jika layar sentuh sudah diriset.
// Tanpa riset sentuh, ponsel masih berupa keypad: pakai tampilan Symbian grid.
function resolveOsMode(year, completed) {
    const mode = getOsMode(year);
    const hasTouch = (completed || []).indexOf('layar_touch_res') !== -1 ||
        (completed || []).indexOf('layar_touch_cap') !== -1;
    if (!hasTouch && TOUCH_MODES.indexOf(mode) !== -1) return 'symbian_grid';
    return mode;
}

// Riset jaringan (net_*) adalah perangkat keras, tapi baris pengaturan OS membacanya dari daftar fitur.
// Gabungkan di sini supaya 5G/4G/3G tampil sesuai riset yang sudah selesai.
function withNetworkResearch(featureIds, completed) {
    const nets = (completed || []).filter(function (id) { return id.indexOf('net_') === 0; });
    return featureIds.concat(nets);
}

// Riset yang sudah selesai pada render terakhir (dipakai buildMenuData; render bersifat sinkron).
let _osCompleted = [];

// Baris pengaturan yang butuh riset tertentu: bila belum ada satu pun riset itu, baris
// tampil "Terkunci" (tidak hilang). Teks dipilih sesuai bahasa aktif.
function lockText() {
    var en = false;
    try { en = LanguageService.getLang() === 'en'; } catch (e) {}
    return en ? 'Locked' : 'Terkunci';
}

// Nilai baris: tampilkan `value` bila salah satu riset di `researchIds` sudah selesai, selain itu "Terkunci".
function rv(researchIds, value) {
    const done = researchIds.some(function (id) { return _osCompleted.indexOf(id) !== -1; });
    return done ? value : lockText();
}

// ============================================================
// MENU DATA — diperkaya, dikelompokkan
// ============================================================
function buildMenuData(featureIds, osState) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const isDark = has('fw_dark_mode');
    const netGen = has('net_5g') ? '5G' : has('net_4g') ? 'LTE' : has('net_3g') ? '3G' : has('net_gsm') ? 'GSM' : '—';
    const secValue = has('fw_biometric') ? 'Face ID' : has('fw_fingerprint') ? T('osm.fingerprint') : has('fw_privacy') ? 'PIN' : '—';
    const storageValue = has('fw_cloud_sync') ? '128 GB' : '64 GB';
    const ver = getCurrentVersionString(osState) || '—';

    return {
        has: has,
        isDark: isDark,
        netGen: netGen,
        secValue: secValue,
        storageValue: storageValue,
        ver: ver,
        groups: [
            { title: T('osm.sec.connections'), items: [
                { icon: 'wifi',   label: 'Wi-Fi',           value: has('fw_browser_mobile') || has('fw_wap_browser') ? T('osm.active') : '—', detail: null },
                { icon: 'signal', label: T('osm.cellular_network'), value: netGen, detail: null },
                { icon: 'cloud',  label: 'Bluetooth',        value: has('fw_bt_basic') ? T('osm.active') : T('osm.inactive'), detail: null },
                { icon: 'globe',  label: T('osm.cellular_data'),     value: has('net_gprs') ? T('osm.active') : '—', detail: null }
            ]},
            { title: T('osm.sec.display_sound'), items: [
                { icon: 'display', label: T('osm.display'),        value: isDark ? T('osm.dark') : T('osm.light'), detail: null },
                { icon: 'sun',     label: T('osm.brightness'),       value: '72%', detail: null },
                { icon: 'volume',  label: T('osm.sound_vibrate'),   value: T('osm.standard'), detail: null },
                { icon: 'music',   label: T('osm.ringtone'),     value: 'Default', detail: null }
            ]},
            { title: T('osm.sec.notif_focus'), items: [
                { icon: 'bell',    label: T('osm.notifications'),      value: null, toggle: has('fw_smart_notif') || has('fw_notifications') },
                { icon: 'moon',    label: T('osm.dnd'),   value: null, toggle: has('fw_focus_mode') },
                { icon: 'target',  label: T('osm.focus_mode'),      value: has('fw_focus_mode') ? T('osm.active') : '—', detail: null }
            ]},
            { title: T('osm.sec.security'), items: [
                { icon: 'lock',    label: T('osm.screen_lock'),     value: secValue, detail: null },
                { icon: 'shield',  label: T('osm.privacy'),         value: has('fw_privacy') ? T('osm.protected') : T('osm.standard'), detail: null },
                { icon: 'fingerprint', label: T('osm.biometrics'),   value: has('fw_biometric') || has('fw_fingerprint') ? T('osm.enrolled') : '—', detail: null },
                { icon: 'key',     label: T('osm.passwords_accounts'),    value: has('fw_sign_in') ? T('osm.synced') : T('osm.local'), detail: null }
            ]},
            { title: T('osm.sec.battery_storage'), items: [
                { icon: 'battery', label: T('osm.battery'),         value: '87%', detail: T('osm.power_saver') + ' ' + (has('fw_low_power') ? T('osm.on') : T('osm.off')) },
                { icon: 'database',label: T('osm.storage'),     value: storageValue, detail: T('osm.used') + ' ' + (has('fw_cloud_sync') ? '82 GB' : '41 GB') }
            ]},
            { title: T('osm.sec.system_updates'), items: [
                { icon: 'download',label: T('osm.os_update'),    value: ver, detail: null },
                { icon: 'sparkles',label: T('osm.assistant_ai'),    value: has('fw_siri') || has('fw_ai_on_device') ? T('osm.active') : T('osm.inactive'), detail: null },
                { icon: 'info',    label: T('osm.about_device'), value: null, detail: null }
            ]}
        ]
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
        music:       '<circle cx="5" cy="10" r="2" ' + s + '/><line x1="7" y1="10" x2="7" y2="3" ' + s + '/><line x1="7" y1="3" x2="12" y2="2" ' + s + '/>'
    };
    return map[name] || '';
}

// ============================================================
// MODE 1 — MONO (2000-2002) — Nokia S30 / Symbian awal
// ============================================================
function renderMono(featureIds, osState, w, h, size) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const bg = '#6a8a4a';
    const dark = '#1a2a0a';
    const mid = '#3a4a2a';
    const light = '#c8d0b8';

    let svg = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="' + bg + '"/>';
    // Pixel-grid
    svg += '<g opacity="0.12">';
    for (let i = 0; i < 40; i++) {
        svg += '<line x1="0" y1="' + (i * h / 40) + '" x2="' + w + '" y2="' + (i * h / 40) + '" stroke="#000" stroke-width="0.15"/>';
    }
    svg += '</g>';

    // Status bar
    svg += '<rect x="0" y="0" width="' + w + '" height="14" fill="' + dark + '"/>';
    svg += '<text x="4" y="10" font-size="6.5" font-family="monospace" fill="' + light + '" font-weight="700">' + (has('net_gsm') ? 'D' : 'N') + '</text>';
    // Signal bars
    if (has('net_gsm')) {
        for (let i = 0; i < 4; i++) svg += '<rect x="' + (w - 42 + i * 4) + '" y="' + (10 - i * 1.6) + '" width="2.5" height="' + (3 + i * 1.6) + '" fill="' + light + '"/>';
    } else {
        svg += '<text x="' + (w - 30) + '" y="10" font-size="5" font-family="monospace" fill="' + light + '">NO SIG</text>';
    }
    // Battery (bar)
    svg += '<rect x="' + (w - 22) + '" y="4" width="14" height="7" fill="none" stroke="' + light + '" stroke-width="0.7"/>';
    svg += '<rect x="' + (w - 21) + '" y="5" width="10" height="5" fill="' + light + '"/>';
    svg += '<rect x="' + (w - 7) + '" y="6" width="1.5" height="3" fill="' + light + '"/>';
    // Clock
    svg += '<text x="' + (w/2) + '" y="10" text-anchor="middle" font-size="6" font-family="monospace" fill="' + light + '">08:15</text>';

    // Title
    svg += '<rect x="0" y="14" width="' + w + '" height="11" fill="' + mid + '"/>';
    svg += '<text x="4" y="22" font-size="7" font-family="monospace" font-weight="700" fill="' + light + '">' + T('osm.sec.settings') + '</text>';

    // Menu list — real items
    const items = [
        T('osm.profile'),
        T('osm.tones_sounds'),
        T('osm.display'),
        T('osm.date_time'),
        T('osm.connectivity'),
        T('osm.calls'),
        T('osm.feature_phone'),
        T('osm.security'),
        T('osm.recovery')
    ];
    const sel = 4;
    const startY = 28;
    const rowH = 13;
    items.forEach(function (it, i) {
        const y = startY + i * rowH;
        const isSel = i === sel;
        if (isSel) {
            svg += '<rect x="2" y="' + (y) + '" width="' + (w - 4) + '" height="' + (rowH - 1) + '" fill="' + dark + '"/>';
        }
        svg += '<text x="6" y="' + (y + 8) + '" font-size="6.5" font-family="monospace" font-weight="700" fill="' + (isSel ? light : dark) + '">' + (isSel ? '▶ ' : '  ') + it + '</text>';
    });

    // Scrollbar indicator
    svg += '<rect x="' + (w - 3) + '" y="28" width="2" height="' + (h - 60) + '" fill="' + mid + '" opacity="0.5"/>';
    svg += '<rect x="' + (w - 3) + '" y="' + (28 + (h - 60) * 0.4) + '" width="2" height="' + ((h - 60) * 0.35) + '" fill="' + light + '"/>';

    // Soft keys
    svg += '<rect x="0" y="' + (h - 22) + '" width="' + w + '" height="22" fill="' + mid + '"/>';
    svg += '<text x="6" y="' + (h - 12) + '" font-size="5.5" font-family="monospace" fill="' + light + '">' + T('osm.back') + '</text>';
    svg += '<line x1="' + (w/2) + '" y1="' + (h - 22) + '" x2="' + (w/2) + '" y2="' + h + '" stroke="' + dark + '" stroke-width="0.6"/>';
    svg += '<text x="' + (w - 6) + '" y="' + (h - 12) + '" text-anchor="end" font-size="5.5" font-family="monospace" fill="' + light + '">' + T('osm.select') + '</text>';
    // Navigation hints
    svg += '<text x="' + (w/2 - 2) + '" y="' + (h - 6) + '" text-anchor="middle" font-size="4.5" font-family="monospace" fill="' + light + '" opacity="0.75">▲▼ ' + T('osm.navigate') + '</text>';

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + size + '" height="' + Math.round(size * 2) + '" preserveAspectRatio="xMidYMid meet">' + svg + '</svg>';
}

// ============================================================
// MODE 2 — SYMBIAN GRID (2003-2004) — Symbian S60
// ============================================================
function renderSymbianGrid(featureIds, osState, w, h, size) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const bg = '#101820';
    const header = '#1e5a8a';
    const headerDark = '#0e3a6a';
    const text = '#ffffff';
    const dim = '#88b8d8';
    const select = '#ffd040';

    const items = [
        { icon: 'signal', label: T('osm.network'),  color: '#88c8ff' },
        { icon: 'message', label: T('osm.messages'),    color: '#88d868' },
        { icon: 'contacts',label: T('osm.contacts'),   color: '#f0a850' },
        { icon: 'clock',   label: T('osm.calendar'), color: '#d078c0' },
        { icon: 'camera',  label: T('osm.camera'),   color: '#70b8e0' },
        { icon: 'music',   label: T('osm.music'),    color: '#a898d8' },
        { icon: 'folder',  label: 'File',     color: '#e0c050' },
        { icon: 'display', label: T('osm.settings'),  color: '#78d0a8' },
        { icon: 'info',    label: 'Info',     color: '#c8c8c8' }
    ];

    let svg = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="' + bg + '"/>';

    // Status bar
    svg += '<rect x="0" y="0" width="' + w + '" height="11" fill="' + headerDark + '"/>';
    svg += '<text x="4" y="7.5" font-size="5" font-family="sans-serif" font-weight="700" fill="' + dim + '">' + (has('net_gsm') ? 'GSM' : '—') + '</text>';
    svg += '<text x="' + (w/2) + '" y="7.5" text-anchor="middle" font-size="5" font-family="sans-serif" fill="' + dim + '">08:15</text>';
    svg += '<text x="' + (w - 4) + '" y="7.5" text-anchor="end" font-size="5" font-family="sans-serif" fill="' + dim + '">◼◼◼</text>';

    // Header
    svg += '<rect x="0" y="11" width="' + w + '" height="13" fill="' + header + '"/>';
    svg += '<text x="6" y="20" font-size="7" font-family="sans-serif" font-weight="700" fill="' + text + '">' + T('osm.settings') + '</text>';
    svg += '<text x="' + (w - 6) + '" y="20" text-anchor="end" font-size="5" font-family="sans-serif" fill="' + dim + '">' + T('osm.exit') + '</text>';

    // Grid 3x3
    const gridTop = 30;
    const cellW = (w - 16) / 3;
    const cellH = 34;
    items.forEach(function (it, i) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cx = 8 + col * cellW + cellW / 2;
        const cy = gridTop + row * cellH + 12;
        // Icon box
        svg += '<rect x="' + (cx - 11) + '" y="' + (cy - 11) + '" width="22" height="22" rx="2" fill="#1a2a3a" stroke="' + it.color + '" stroke-width="0.5"/>';
        svg += '<g transform="translate(' + (cx - 7) + ',' + (cy - 7) + ')">' + glyph(it.icon, it.color, 1.1) + '</g>';
        svg += '<text x="' + cx + '" y="' + (cy + 17) + '" text-anchor="middle" font-size="5" font-family="sans-serif" fill="' + text + '">' + it.label + '</text>';
    });

    // Selected highlight
    const selIdx = 7;
    const selCol = selIdx % 3;
    const selRow = Math.floor(selIdx / 3);
    const selCx = 8 + selCol * cellW + cellW / 2;
    const selCy = gridTop + selRow * cellH + 12;
    svg += '<rect x="' + (selCx - 12) + '" y="' + (selCy - 12) + '" width="24" height="24" rx="2" fill="none" stroke="' + select + '" stroke-width="1"/>';
    svg += '<rect x="' + (selCx - 12) + '" y="' + (selCy - 12) + '" width="24" height="24" rx="2" fill="' + select + '" opacity="0.15"/>';

    // Soft keys
    svg += '<rect x="0" y="' + (h - 16) + '" width="' + w + '" height="16" fill="' + header + '"/>';
    svg += '<text x="6" y="' + (h - 6) + '" font-size="5.5" font-family="sans-serif" font-weight="700" fill="' + text + '">' + T('osm.select') + '</text>';
    svg += '<text x="' + (w - 6) + '" y="' + (h - 6) + '" text-anchor="end" font-size="5.5" font-family="sans-serif" font-weight="700" fill="' + text + '">' + T('osm.back') + '</text>';

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + size + '" height="' + Math.round(size * 2) + '" preserveAspectRatio="xMidYMid meet">' + svg + '</svg>';
}

// ============================================================
// MODE 3 — WINDOWS MOBILE (2005-2006)
// ============================================================
function renderWindowsMobile(featureIds, osState, w, h, size) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const bg = '#ffffff';
    const bar = '#1a5a9a';
    const barDark = '#0e3a6a';
    const text = '#000000';
    const sub = '#5a5a5a';
    const line = '#b0b0b0';

    let svg = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="' + bg + '"/>';

    // Status bar
    svg += '<rect x="0" y="0" width="' + w + '" height="10" fill="#e8e8e8"/>';
    svg += '<text x="4" y="7" font-size="5" font-family="Tahoma, sans-serif" font-weight="700" fill="' + text + '">' + (has('net_gsm') ? 'GSM' : '—') + '</text>';
    svg += '<text x="' + (w/2) + '" y="7" text-anchor="middle" font-size="5" font-family="Tahoma, sans-serif" fill="' + text + '">08:15</text>';
    svg += '<text x="' + (w - 4) + '" y="7" text-anchor="end" font-size="4.5" font-family="Tahoma, sans-serif" fill="' + text + '">' + T('osm.battery') + ' 87%</text>';

    // Title bar (blue)
    svg += '<rect x="0" y="10" width="' + w + '" height="12" fill="' + bar + '"/>';
    svg += '<text x="4" y="18" font-size="6.5" font-family="Tahoma, sans-serif" font-weight="700" fill="#ffffff">' + T('osm.settings_title') + '</text>';
    svg += '<text x="' + (w - 4) + '" y="18" text-anchor="end" font-size="5.5" font-family="Tahoma, sans-serif" fill="#ffffff">ok</text>';

    // Left softkey menu / right clock
    svg += '<rect x="0" y="22" width="' + w + '" height="8" fill="#f0f0f0"/>';
    svg += '<text x="4" y="28" font-size="5" font-family="Tahoma, sans-serif" font-weight="700" fill="' + bar + '">' + T('osm.start') + '</text>';
    svg += '<text x="' + (w - 4) + '" y="28" text-anchor="end" font-size="5" font-family="Tahoma, sans-serif" fill="' + sub + '">Menu</text>';

    // List items (Windows Mobile list)
    const items = [
        { label: T('osm.phone'),            value: '—' },
        { label: 'Bluetooth',          value: rv(['audio_bt'], has('fw_bt_basic') ? T('osm.active') : T('osm.inactive')) },
        { label: T('osm.connection'),          value: has('net_gprs') ? 'GPRS' : '—' },
        { label: T('osm.messages'),              value: has('fw_sms') ? T('osm.active') : '—' },
        { label: T('osm.camera'),             value: has('cam_vga') ? 'VGA' : '—' },
        { label: T('osm.clock_alarm'),        value: T('osm.active') },
        { label: T('osm.keyboard'),        value: 'Default' },
        { label: T('osm.sound'),              value: T('osm.standard') },
        { label: T('osm.display'),           value: T('osm.classic') },
        { label: T('osm.memory'),             value: T('osm.free_mb') },
        { label: T('osm.system_settings'),     value: '—' }
    ];

    const startY = 34;
    const rowH = 15;
    items.forEach(function (it, i) {
        const y = startY + i * rowH;
        svg += '<rect x="0" y="' + y + '" width="' + w + '" height="' + rowH + '" fill="' + (i % 2 === 0 ? '#ffffff' : '#f4f4f4') + '"/>';
        svg += '<text x="6" y="' + (y + 10) + '" font-size="6" font-family="Tahoma, sans-serif" fill="' + text + '">' + it.label + '</text>';
        svg += '<text x="' + (w - 6) + '" y="' + (y + 10) + '" text-anchor="end" font-size="5.5" font-family="Tahoma, sans-serif" fill="' + sub + '">' + it.value + '</text>';
        svg += '<line x1="0" y1="' + (y + rowH) + '" x2="' + w + '" y2="' + (y + rowH) + '" stroke="' + line + '" stroke-width="0.3"/>';
    });

    // Taskbar
    svg += '<rect x="0" y="' + (h - 18) + '" width="' + w + '" height="18" fill="' + barDark + '"/>';
    // Windows flag
    svg += '<rect x="6" y="' + (h - 14) + '" width="6" height="6" fill="#f25022"/>';
    svg += '<rect x="13" y="' + (h - 14) + '" width="6" height="6" fill="#7fba00"/>';
    svg += '<rect x="6" y="' + (h - 7) + '" width="6" height="6" fill="#00a4ef"/>';
    svg += '<rect x="13" y="' + (h - 7) + '" width="6" height="6" fill="#ffb900"/>';
    svg += '<text x="24" y="' + (h - 5) + '" font-size="5.5" font-family="Tahoma, sans-serif" fill="#ffffff">' + T('osm.start') + '</text>';
    svg += '<text x="' + (w - 6) + '" y="' + (h - 5) + '" text-anchor="end" font-size="5" font-family="Tahoma, sans-serif" fill="#ffffff">08:15</text>';

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + size + '" height="' + Math.round(size * 2) + '" preserveAspectRatio="xMidYMid meet">' + svg + '</svg>';
}

// ============================================================
// MODE 4 — EARLY iOS / ANDROID (2007-2009)
// ============================================================
function renderEarlyIos(featureIds, osState, w, h, size) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const bg = '#000000';

    let svg = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="' + bg + '"/>';

    // Status bar (iPhone OS style)
    svg += '<text x="6" y="8" font-size="5.5" font-family="-apple-system, sans-serif" font-weight="700" fill="#ffffff">9:41</text>';
    svg += '<text x="' + (w - 6) + '" y="8" text-anchor="end" font-size="5.5" font-family="-apple-system, sans-serif" fill="#ffffff">▮▮▮ ▬▬ 87%</text>';

    // Nav bar (glossy blue gradient)
    svg += '<defs>' +
        '<linearGradient id="ios_nav" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '<stop offset="0%" stop-color="#6a9ac8"/>' +
            '<stop offset="50%" stop-color="#3a7ab8"/>' +
            '<stop offset="100%" stop-color="#1a5a9a"/>' +
        '</linearGradient>' +
    '</defs>';
    svg += '<rect x="0" y="11" width="' + w + '" height="16" fill="url(#ios_nav)"/>';
    // Highlight atas
    svg += '<rect x="0" y="11" width="' + w + '" height="0.8" fill="#ffffff" opacity="0.6"/>';
    svg += '<text x="6" y="22" font-size="7" font-family="-apple-system, sans-serif" font-weight="700" fill="#ffffff" style="text-shadow:0 1px 0 rgba(0,0,0,0.5);">‹ ' + T('osm.settings') + '</text>';
    svg += '<text x="' + (w/2) + '" y="22" text-anchor="middle" font-size="7" font-family="-apple-system, sans-serif" font-weight="700" fill="#ffffff" style="text-shadow:0 1px 0 rgba(0,0,0,0.5);">' + T('osm.general') + '</text>';

    // Grouped list (dark gray with glossy)
    const startY = 34;
    const rowH = 22;
    const items = [
        { label: 'Info',             value: '>' },
        { label: T('osm.about'),          value: 'v' + (getCurrentVersionString(osState) || '—') },
        { label: T('osm.updates'),        value: '>' },
        { label: T('osm.usage'),       value: has('fw_cloud_sync') ? '128 GB' : '64 GB' },
        { label: T('osm.date_time'), value: '>' },
        { label: T('osm.keyboard'),      value: '>' },
        { label: T('osm.language'),           value: T('osm.language_value') }
    ];

    svg += '<rect x="6" y="' + startY + '" width="' + (w - 12) + '" height="' + (items.length * rowH + 2) + '" rx="8" fill="#2a2a2a" stroke="#3a3a3a" stroke-width="0.4"/>';

    items.forEach(function (it, i) {
        const y = startY + 1 + i * rowH;
        // Glossy highlight
        svg += '<rect x="7" y="' + y + '" width="' + (w - 14) + '" height="0.5" fill="#ffffff" opacity="0.15"/>';
        // Icon kecil di kiri
        svg += '<rect x="12" y="' + (y + 5) + '" width="12" height="12" rx="2.5" fill="#4a4a4a" stroke="#5a5a5a" stroke-width="0.4"/>';
        // Label
        svg += '<text x="30" y="' + (y + 14) + '" font-size="6.5" font-family="-apple-system, sans-serif" font-weight="600" fill="#ffffff">' + it.label + '</text>';
        // Right side
        if (it.value === '>' || it.value === 'v') {
            if (it.value === '>') {
                svg += '<path d="M ' + (w - 18) + ' ' + (y + 8) + ' L ' + (w - 15) + ' ' + (y + 11) + ' L ' + (w - 18) + ' ' + (y + 14) + '" fill="none" stroke="#8a8a8a" stroke-width="1"/>';
            }
        } else {
            svg += '<text x="' + (w - 14) + '" y="' + (y + 14) + '" text-anchor="end" font-size="5.5" font-family="-apple-system, sans-serif" fill="#8a8a8a">' + it.value + '</text>';
            svg += '<path d="M ' + (w - 12) + ' ' + (y + 8) + ' L ' + (w - 9) + ' ' + (y + 11) + ' L ' + (w - 12) + ' ' + (y + 14) + '" fill="none" stroke="#8a8a8a" stroke-width="0.9"/>';
        }
        // Separator
        if (i < items.length - 1) {
            svg += '<line x1="30" y1="' + (y + rowH) + '" x2="' + (w - 8) + '" y2="' + (y + rowH) + '" stroke="#3a3a3a" stroke-width="0.3"/>';
        }
    });

    // Bottom nav (iOS 1-3 tab bar)
    const tabY = h - 22;
    svg += '<rect x="0" y="' + tabY + '" width="' + w + '" height="22" fill="#1a1a1a"/>';
    svg += '<rect x="0" y="' + tabY + '" width="' + w + '" height="0.6" fill="#ffffff" opacity="0.2"/>';
    const tabs = [T('osm.favorites'), T('osm.recents'), T('osm.contacts'), T('osm.general')];
    tabs.forEach(function (t, i) {
        const tx = (w / tabs.length) * (i + 0.5);
        const isActive = i === 3;
        svg += '<text x="' + tx + '" y="' + (tabY + 14) + '" text-anchor="middle" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + (isActive ? '#ffffff' : '#6a6a6a') + '" font-weight="600">' + t + '</text>';
    });

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + size + '" height="' + Math.round(size * 2) + '" preserveAspectRatio="xMidYMid meet">' + svg + '</svg>';
}

// ============================================================
// MODE 5 — SKEUOMORPHIC (2010-2012) — iOS 4-6, Android 2-4
// ============================================================
function renderSkeuomorphic(featureIds, osState, w, h, size) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const bg = '#c8c8c8';

    let svg = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="' + bg + '"/>';
    // Felt/leather texture hint
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

    // Status bar (dark translucent)
    svg += '<rect x="0" y="0" width="' + w + '" height="10" fill="#333333"/>';
    svg += '<text x="6" y="7" font-size="5.5" font-family="-apple-system, sans-serif" font-weight="700" fill="#ffffff">9:41</text>';
    svg += '<text x="' + (w - 6) + '" y="7" text-anchor="end" font-size="5.5" font-family="-apple-system, sans-serif" fill="#ffffff">▮▮▮ ▬▬ 87%</text>';

    // Nav bar with linen texture
    svg += '<rect x="0" y="10" width="' + w + '" height="16" fill="url(#sk_nav)"/>';
    svg += '<rect x="0" y="10" width="' + w + '" height="1" fill="#ffffff" opacity="0.5"/>';
    svg += '<rect x="0" y="25" width="' + w + '" height="1" fill="#000000" opacity="0.3"/>';
    svg += '<text x="6" y="21" font-size="7" font-family="-apple-system, sans-serif" font-weight="700" fill="#ffffff" style="text-shadow:0 -1px 0 rgba(0,0,0,0.5);">‹ ' + T('osm.general') + '</text>';
    svg += '<text x="' + (w/2) + '" y="21" text-anchor="middle" font-size="7" font-family="-apple-system, sans-serif" font-weight="700" fill="#ffffff" style="text-shadow:0 -1px 0 rgba(0,0,0,0.5);">' + T('osm.settings_title') + '</text>';

    // Group 1 — Koneksi (leather button style)
    const startY = 32;
    const rowH = 24;
    const groups = [
        { title: T('osm.sec.connections'), rows: [
            { label: 'Wi-Fi', value: has('fw_browser_mobile') ? 'Home-Net' : T('osm.inactive') },
            { label: 'Bluetooth', value: rv(['audio_bt'], has('fw_bt_basic') ? T('osm.active') : T('osm.inactive')) },
            { label: T('osm.cellular_data'), value: rv(['net_gprs', 'net_3g'], has('net_3g') ? T('osm.net_3g_on') : has('net_gprs') ? 'GPRS' : T('osm.inactive')) }
        ]},
        { title: T('osm.sec.system'), rows: [
            { label: T('osm.general'), value: '›' },
            { label: T('osm.display_brightness'), value: '›' },
            { label: T('osm.sound'), value: '›' },
            { label: 'Safari', value: has('fw_browser_mobile') ? T('osm.active') : '—' }
        ]}
    ];

    let curY = startY;
    groups.forEach(function (g) {
        // Section title (dark gray)
        svg += '<rect x="0" y="' + curY + '" width="' + w + '" height="9" fill="#a8a8a8"/>';
        svg += '<rect x="0" y="' + curY + '" width="' + w + '" height="1" fill="#000000" opacity="0.2"/>';
        svg += '<text x="8" y="' + (curY + 6.5) + '" font-size="5" font-family="-apple-system, sans-serif" font-weight="700" fill="#3a3a3a">' + g.title + '</text>';
        curY += 9;

        // Group box
        g.rows.forEach(function (row, i) {
            const ry = curY + i * rowH;
            svg += '<rect x="0" y="' + ry + '" width="' + w + '" height="' + rowH + '" fill="url(#sk_cell)"/>';
            svg += '<rect x="0" y="' + ry + '" width="' + w + '" height="0.5" fill="#ffffff"/>';
            // Chevron + separator
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

    // Toggle style (older iOS)
    svg += '<text x="8" y="' + (curY + 8) + '" font-size="5" font-family="-apple-system, sans-serif" font-weight="700" fill="#3a3a3a">' + T('osm.sec.notifications') + '</text>';
    curY += 10;
    svg += '<rect x="0" y="' + curY + '" width="' + w + '" height="' + rowH + '" fill="url(#sk_cell)"/>';
    svg += '<text x="8" y="' + (curY + 14) + '" font-size="6.5" font-family="-apple-system, sans-serif" font-weight="600" fill="#1a1a1a" style="text-shadow:0 1px 0 rgba(255,255,255,0.5);">' + T('osm.notif_center') + '</text>';
    // Toggle iOS 4-6 style
    const toggleOn = has('fw_smart_notif') || has('fw_notifications');
    svg += '<rect x="' + (w - 32) + '" y="' + (curY + 6) + '" width="24" height="13" rx="6.5" fill="' + (toggleOn ? '#4a9a4a' : '#8a8a8a') + '" stroke="#5a5a5a" stroke-width="0.4"/>';
    svg += '<circle cx="' + (toggleOn ? (w - 14) : (w - 26)) + '" cy="' + (curY + 12.5) + '" r="5" fill="#ffffff" stroke="#5a5a5a" stroke-width="0.3"/>';

    // Bottom tab bar (iOS 6 style)
    const tabY = h - 26;
    svg += '<rect x="0" y="' + tabY + '" width="' + w + '" height="26" fill="#2a2a2a"/>';
    svg += '<rect x="0" y="' + tabY + '" width="' + w + '" height="0.8" fill="#5a5a5a"/>';
    const tabs = [T('osm.favorites'), T('osm.recents'), T('osm.contacts'), T('osm.general')];
    tabs.forEach(function (t, i) {
        const tx = (w / tabs.length) * (i + 0.5);
        const isActive = i === 3;
        // Icon (simple shape)
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

    // Status bar (iOS 7 style with dark text)
    svg += '<text x="6" y="8" font-size="5.5" font-family="-apple-system, sans-serif" font-weight="600" fill="' + text + '">9:41</text>';
    svg += '<text x="' + (w - 6) + '" y="8" text-anchor="end" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + text + '">▮▮▮ ▬▬ 87%</text>';

    // Nav bar (transparent with title)
    svg += '<text x="6" y="22" font-size="7" font-family="-apple-system, sans-serif" font-weight="400" fill="' + accent + '">‹ ' + T('osm.general') + '</text>';
    svg += '<text x="' + (w/2) + '" y="22" text-anchor="middle" font-size="7.5" font-family="-apple-system, sans-serif" font-weight="600" fill="' + text + '">' + T('osm.settings_title') + '</text>';

    // Search bar (iOS 7)
    svg += '<rect x="8" y="28" width="' + (w - 16) + '" height="12" rx="6" fill="#e0e0e5"/>';
    svg += '<circle cx="16" cy="34" r="2.2" fill="none" stroke="' + sub + '" stroke-width="0.7"/>';
    svg += '<line x1="17.5" y1="35.5" x2="19" y2="37" stroke="' + sub + '" stroke-width="0.7" stroke-linecap="round"/>';
    svg += '<text x="22" y="36" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + sub + '">' + T('osm.search') + '</text>';

    // Section 1
    let curY = 46;
    svg += '<text x="14" y="' + curY + '" font-size="4.5" font-family="-apple-system, sans-serif" font-weight="600" fill="' + sub + '" letter-spacing="0.4">' + T('osm.sec.connections') + '</text>';
    curY += 3;

    const group1 = [
        { icon: 'wifi',   label: 'Wi-Fi',           value: has('fw_browser_mobile') ? 'Home-Net' : T('osm.inactive') },
        { icon: 'signal', label: T('osm.cellular_data'),    value: rv(['net_gprs', 'net_3g'], has('net_3g') ? T('osm.net_3g_on') : T('osm.inactive')) },
        { icon: 'cloud',  label: 'Bluetooth',       value: rv(['audio_bt'], has('fw_bt_basic') ? T('osm.active') : T('osm.inactive')) }
    ];

    svg += '<rect x="8" y="' + curY + '" width="' + (w - 16) + '" height="' + (group1.length * 18 + 2) + '" rx="4" fill="' + surface + '"/>';
    group1.forEach(function (it, i) {
        const ry = curY + 1 + i * 18;
        // Icon bulat
        svg += '<rect x="13" y="' + (ry + 4) + '" width="11" height="11" rx="3" fill="' + accent + '"/>';
        svg += '<g transform="translate(' + 15 + ',' + (ry + 6) + ')">' + glyph(it.icon, '#ffffff', 0.9) + '</g>';
        svg += '<text x="29" y="' + (ry + 12) + '" font-size="6.5" font-family="-apple-system, sans-serif" font-weight="500" fill="' + text + '">' + it.label + '</text>';
        if (it.value) svg += '<text x="' + (w - 14) + '" y="' + (ry + 12) + '" text-anchor="end" font-size="6" font-family="-apple-system, sans-serif" fill="' + sub + '">' + it.value + '</text>';
        svg += '<path d="M ' + (w - 12) + ' ' + (ry + 7) + ' L ' + (w - 9.5) + ' ' + (ry + 9.5) + ' L ' + (w - 12) + ' ' + (ry + 12) + '" fill="none" stroke="' + sub + '" stroke-width="0.7"/>';
        if (i < group1.length - 1) svg += '<line x1="29" y1="' + (ry + 18) + '" x2="' + (w - 10) + '" y2="' + (ry + 18) + '" stroke="' + line + '" stroke-width="0.3"/>';
    });
    curY += group1.length * 18 + 8;

    // Section 2
    svg += '<text x="14" y="' + curY + '" font-size="4.5" font-family="-apple-system, sans-serif" font-weight="600" fill="' + sub + '" letter-spacing="0.4">' + T('osm.sec.system') + '</text>';
    curY += 3;

    const group2 = [
        { icon: 'display', label: T('osm.display_brightness'), value: null },
        { icon: 'volume',  label: T('osm.sound'),                 value: null },
        { icon: 'bell',    label: T('osm.notifications'),            value: null, toggle: has('fw_smart_notif') || has('fw_notifications') },
        { icon: 'lock',    label: T('osm.general'),                  value: null }
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

    // Section 3 — Tentang
    svg += '<text x="14" y="' + curY + '" font-size="4.5" font-family="-apple-system, sans-serif" font-weight="600" fill="' + sub + '" letter-spacing="0.4">' + T('osm.sec.about') + '</text>';
    curY += 3;
    svg += '<rect x="8" y="' + curY + '" width="' + (w - 16) + '" height="20" rx="4" fill="' + surface + '"/>';
    svg += '<text x="29" y="' + (curY + 12) + '" font-size="6.5" font-family="-apple-system, sans-serif" font-weight="500" fill="' + text + '">' + T('osm.about') + '</text>';
    svg += '<text x="' + (w - 14) + '" y="' + (curY + 12) + '" text-anchor="end" font-size="6" font-family="-apple-system, sans-serif" fill="' + sub + '">' + (getCurrentVersionString(osState) || '—') + '</text>';
    svg += '<path d="M ' + (w - 12) + ' ' + (curY + 7) + ' L ' + (w - 9.5) + ' ' + (curY + 10) + ' L ' + (w - 12) + ' ' + (curY + 13) + '" fill="none" stroke="' + sub + '" stroke-width="0.7"/>';

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + size + '" height="' + Math.round(size * 2) + '" preserveAspectRatio="xMidYMid meet">' + svg + '</svg>';
}

// ============================================================
// MODE 7 — GROUPED MODERN (2015-2018) — iOS 10-12 style
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

    // Status bar
    svg += '<text x="6" y="8" font-size="5.5" font-family="-apple-system, sans-serif" font-weight="600" fill="' + text + '">9:41</text>';
    svg += '<text x="' + (w - 6) + '" y="8" text-anchor="end" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + text + '">▮▮▮ ▬▬ 87%</text>';

    // Big header
    svg += '<text x="14" y="24" font-size="11" font-family="-apple-system, sans-serif" font-weight="700" fill="' + text + '">' + T('osm.settings_title') + '</text>';

    // Profile row
    const profY = 30;
    svg += '<rect x="8" y="' + profY + '" width="' + (w - 16) + '" height="28" rx="6" fill="' + surface + '"/>';
    const initial = ((osState && osState.name) || 'M').charAt(0).toUpperCase();
    svg += '<circle cx="22" cy="' + (profY + 14) + '" r="8" fill="' + accent + '"/>';
    svg += '<text x="22" y="' + (profY + 17) + '" text-anchor="middle" font-size="9" font-family="-apple-system, sans-serif" font-weight="700" fill="#ffffff">' + escapeHtml(initial) + '</text>';
    svg += '<text x="36" y="' + (profY + 12) + '" font-size="7" font-family="-apple-system, sans-serif" font-weight="600" fill="' + text + '">' + escapeHtml((osState && osState.name) || 'MyOS') + '</text>';
    svg += '<text x="36" y="' + (profY + 21) + '" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + sub + '">' + T('osm.apple_id_etc') + '</text>';
    svg += '<path d="M ' + (w - 18) + ' ' + (profY + 11) + ' L ' + (w - 15) + ' ' + (profY + 14) + ' L ' + (w - 18) + ' ' + (profY + 17) + '" fill="none" stroke="' + sub + '" stroke-width="0.8"/>';

    // Section groups
    let curY = profY + 36;
    const rowH = 18;

    const sections = [
        { items: [
            { icon: 'wifi',   label: 'Wi-Fi',           value: has('fw_browser_mobile') ? 'Home-Net' : T('osm.inactive'),    bg: '#007aff' },
            { icon: 'cloud',  label: 'Bluetooth',       value: rv(['audio_bt'], has('fw_bt_basic') ? T('osm.active') : T('osm.inactive')),            bg: '#007aff' },
            { icon: 'signal', label: T('osm.cellular_data'),    value: rv(['net_4g', 'net_3g'], has('net_4g') ? '4G' : has('net_3g') ? '3G' : T('osm.inactive')), bg: '#34c759' },
            { icon: 'globe',  label: T('osm.hotspot'), value: T('osm.inactive'),                                             bg: '#34c759' }
        ]},
        { items: [
            { icon: 'bell',    label: T('osm.notifications'),            value: null, toggle: has('fw_smart_notif') || has('fw_notifications'), bg: '#ff3b30' },
            { icon: 'volume',  label: T('osm.sound_haptics'),       value: null, bg: '#ff3b30' },
            { icon: 'moon',    label: T('osm.dnd'),         value: null, toggle: has('fw_focus_mode'), bg: '#5856d6' },
            { icon: 'display', label: T('osm.screen_time'),           value: has('fw_digital_wellbeing') ? T('osm.active') : '—', bg: '#5856d6' }
        ]},
        { items: [
            { icon: 'lock',   label: T('osm.faceid_passcode'), value: rv(['sensor_fp_rear', 'sensor_face3d', 'sensor_indisplay'], has('fw_biometric') ? T('osm.active') : '—'), bg: '#34c759' },
            { icon: 'shield', label: T('osm.privacy'),              value: null, toggle: has('fw_privacy'), bg: '#007aff' },
            { icon: 'battery',label: T('osm.battery'),              value: '87%', bg: '#34c759' },
            { icon: 'info',   label: T('osm.general'),                 value: getCurrentVersionString(osState) || '—', bg: '#8e8e93' }
        ]}
    ];

    sections.forEach(function (sec) {
        const groupH = sec.items.length * rowH + 2;
        svg += '<rect x="8" y="' + curY + '" width="' + (w - 16) + '" height="' + groupH + '" rx="6" fill="' + surface + '"/>';
        sec.items.forEach(function (it, i) {
            const ry = curY + 1 + i * rowH;
            // Icon bg
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
// MODE 8 — MATERIAL YOU / MODERN (2019-2022)
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

    // Status bar
    svg += '<text x="6" y="8" font-size="5.5" font-family="-apple-system, sans-serif" font-weight="700" fill="' + pal.text + '">9:41</text>';
    svg += '<text x="' + (w - 6) + '" y="8" text-anchor="end" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + pal.text + '">5G ▮▮ 87%</text>';

    // Big header
    svg += '<text x="14" y="24" font-size="12" font-family="-apple-system, sans-serif" font-weight="700" fill="' + pal.text + '">' + T('osm.settings_title') + '</text>';

    // Search bar
    svg += '<rect x="14" y="30" width="' + (w - 28) + '" height="12" rx="6" fill="' + (isDark ? '#1c1c1e' : '#e5e5ea') + '"/>';
    svg += '<circle cx="22" cy="36" r="2.2" fill="none" stroke="' + pal.sub + '" stroke-width="0.7"/>';
    svg += '<line x1="23.5" y1="37.5" x2="25" y2="39" stroke="' + pal.sub + '" stroke-width="0.7" stroke-linecap="round"/>';
    svg += '<text x="29" y="38" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + pal.sub + '">' + T('osm.search') + '</text>';

    // Profile row
    const profY = 48;
    svg += '<rect x="8" y="' + profY + '" width="' + (w - 16) + '" height="34" rx="10" fill="' + pal.surface + '"/>';
    const initial = ((osState && osState.name) || 'M').charAt(0).toUpperCase();
    svg += '<circle cx="24" cy="' + (profY + 17) + '" r="11" fill="' + pal.accent + '"/>';
    svg += '<text x="24" y="' + (profY + 20.5) + '" text-anchor="middle" font-size="11" font-family="-apple-system, sans-serif" font-weight="700" fill="#ffffff">' + escapeHtml(initial) + '</text>';
    svg += '<text x="42" y="' + (profY + 14) + '" font-size="7.5" font-family="-apple-system, sans-serif" font-weight="700" fill="' + pal.text + '">' + escapeHtml((osState && osState.name) || 'MyOS') + '</text>';
    svg += '<text x="42" y="' + (profY + 24) + '" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + pal.sub + '">' + T('osm.account_eco') + '</text>';
    svg += '<path d="M ' + (w - 18) + ' ' + (profY + 14) + ' L ' + (w - 15) + ' ' + (profY + 17) + ' L ' + (w - 18) + ' ' + (profY + 20) + '" fill="none" stroke="' + pal.sub + '" stroke-width="0.8"/>';

    // Groups
    let curY = profY + 42;
    const rowH = 20;

    const sections = [
        [
            { icon: 'wifi',   label: 'Wi-Fi',              value: has('fw_browser_mobile') ? 'Home-Net' : T('osm.inactive'),   bg: '#007aff' },
            { icon: 'cloud',  label: 'Bluetooth',          value: rv(['audio_bt'], has('fw_bt_basic') ? T('osm.active') : T('osm.inactive')),           bg: '#007aff' },
            { icon: 'signal', label: T('osm.cellular_network'),   value: has('net_5g') ? '5G' : has('net_4g') ? 'LTE' : '—', bg: '#34c759' }
        ],
        [
            { icon: 'bell',    label: T('osm.notifications'),         value: null, toggle: has('fw_smart_notif') || has('fw_notifications'), bg: '#ff3b30' },
            { icon: 'moon',    label: T('osm.focus_mode'),         value: null, toggle: has('fw_focus_mode'), bg: '#5856d6' },
            { icon: 'display', label: T('osm.display_brightness'), value: isDark ? T('osm.dark') : T('osm.light'), bg: '#5856d6' }
        ],
        [
            { icon: 'lock',    label: T('osm.faceid_passcode'), value: rv(['sensor_fp_rear', 'sensor_face3d', 'sensor_indisplay'], has('fw_biometric') ? T('osm.active') : '—'), bg: '#34c759' },
            { icon: 'shield',  label: T('osm.privacy_security'), value: has('fw_privacy') ? T('osm.protected') : T('osm.standard'), bg: '#007aff' },
            { icon: 'battery', label: T('osm.battery'),             value: '87%', bg: '#34c759' },
            { icon: 'info',    label: T('osm.general'),                value: getCurrentVersionString(osState) || '—', bg: '#8e8e93' }
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
// MODE 9 — AI MODERN (2023-2026)
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

    // Aurora gradient background
    if (isDark) {
        svg += '<defs><radialGradient id="ai_glow1" cx="30%" cy="20%"><stop offset="0%" stop-color="#a855f7" stop-opacity="0.25"/><stop offset="100%" stop-color="#04040a" stop-opacity="0"/></radialGradient>' +
            '<radialGradient id="ai_glow2" cx="70%" cy="60%"><stop offset="0%" stop-color="#06b6d4" stop-opacity="0.18"/><stop offset="100%" stop-color="#04040a" stop-opacity="0"/></radialGradient></defs>' +
            '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="url(#ai_glow1)"/>' +
            '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="url(#ai_glow2)"/>';
    }

    // Status bar
    svg += '<text x="6" y="8" font-size="5.5" font-family="-apple-system, sans-serif" font-weight="700" fill="' + pal.text + '">9:41</text>';
    svg += '<text x="' + (w - 6) + '" y="8" text-anchor="end" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + pal.text + '">6G ▮▮ 87%</text>';

    // Big header
    svg += '<text x="14" y="24" font-size="12" font-family="-apple-system, sans-serif" font-weight="800" fill="' + pal.text + '">' + T('osm.settings_title') + '</text>';
    svg += '<text x="14" y="32" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + pal.sub + '">' + T('osm.ai_powered') + '</text>';

    // AI Card — sorotan
    if (hasAI) {
        const aiY = 40;
        svg += '<rect x="8" y="' + aiY + '" width="' + (w - 16) + '" height="34" rx="12" fill="' + pal.surface + '" stroke="' + pal.accent + '" stroke-width="0.5"/>';
        svg += '<circle cx="22" cy="' + (aiY + 17) + '" r="9" fill="' + pal.accent + '" opacity="0.9"/>';
        svg += '<g transform="translate(' + 17 + ',' + (aiY + 12) + ')">' + glyph('sparkles', '#ffffff', 1.1) + '</g>';
        svg += '<text x="38" y="' + (aiY + 14) + '" font-size="7.5" font-family="-apple-system, sans-serif" font-weight="700" fill="' + pal.text + '">' + T('osm.ai_assistant') + '</text>';
        svg += '<text x="38" y="' + (aiY + 24) + '" font-size="5.5" font-family="-apple-system, sans-serif" fill="' + pal.accent + '">' + T('osm.ai_active_local') + '</text>';
        svg += '<path d="M ' + (w - 18) + ' ' + (aiY + 14) + ' L ' + (w - 15) + ' ' + (aiY + 17) + ' L ' + (w - 18) + ' ' + (aiY + 20) + '" fill="none" stroke="' + pal.sub + '" stroke-width="0.8"/>';
    }

    // Groups
    let curY = hasAI ? 82 : 44;
    const rowH = 20;

    const sections = [
        [
            { icon: 'signal', label: T('osm.net_6g'),        value: has('net_5g') ? T('osm.active') : 'LTE', bg: pal.accent2 },
            { icon: 'wifi',   label: 'Wi-Fi 7',            value: 'Home-Mesh',                     bg: pal.accent2 },
            { icon: 'cloud',  label: 'Nearby Share',       value: T('osm.active'),                          bg: pal.accent2 }
        ],
        [
            { icon: 'bell',    label: T('osm.smart_notif'), value: null, toggle: has('fw_smart_notif') || has('fw_notifications'), bg: '#ff3b30' },
            { icon: 'moon',    label: T('osm.ai_focus'),     value: null, toggle: has('fw_focus_mode'), bg: pal.accent },
            { icon: 'display', label: T('osm.display'),          value: isDark ? T('osm.dark') : T('osm.light'), bg: pal.accent }
        ],
        [
            { icon: 'lock',    label: T('osm.biometrics'),         value: rv(['sensor_fp_rear', 'sensor_face3d', 'sensor_indisplay'], has('fw_biometric') ? T('osm.active') : '—'), bg: '#34c759' },
            { icon: 'shield',  label: T('osm.local_privacy'),     value: has('fw_privacy') ? T('osm.protected') : T('osm.standard'), bg: '#34c759' },
            { icon: 'battery', label: T('osm.adaptive_battery'),   value: '87%', bg: '#34c759' },
            { icon: 'sparkles',label: 'AI On-Device',      value: has('fw_ai_on_device') ? T('osm.active') : '—', bg: pal.accent },
            { icon: 'info',    label: T('osm.general'),              value: getCurrentVersionString(osState) || '—', bg: '#8e8e93' }
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
    _osCompleted = completed;
    const featureIds = withNetworkResearch(getCurrentFeatures(osState), completed);

    const size = opts.size || 120;
    const w = 200;
    const h = 400;
    const mode = resolveOsMode(year, completed);

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
    const featureIds = withNetworkResearch(getCurrentFeatures(st.os || {}), completed);
    return {
        year: year,
        mode: resolveOsMode(year, completed),
        specId: resolveSpec(year, completed).id,
        featureCount: featureIds.length
    };
        }
