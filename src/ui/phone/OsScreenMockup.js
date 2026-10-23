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
import { phoneClockText } from './PhoneMockup.js';


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
    svg += '<text x="' + (w/2) + '" y="10" text-anchor="middle" font-size="6" font-family="monospace" fill="' + light + '">' + phoneClockText() + '</text>';

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
    svg += '<text x="' + (w/2) + '" y="7.5" text-anchor="middle" font-size="5" font-family="sans-serif" fill="' + dim + '">' + phoneClockText() + '</text>';
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
    svg += '<text x="' + (w/2) + '" y="7" text-anchor="middle" font-size="5" font-family="Tahoma, sans-serif" fill="' + text + '">' + phoneClockText() + '</text>';
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
    svg += '<text x="' + (w - 6) + '" y="' + (h - 5) + '" text-anchor="end" font-size="5" font-family="Tahoma, sans-serif" fill="#ffffff">' + phoneClockText() + '</text>';

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
    svg += '<text x="6" y="8" font-size="5.5" font-family="-apple-system, sans-serif" font-weight="700" fill="#ffffff">' + phoneClockText() + '</text>';
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
    svg += '<text x="6" y="7" font-size="5.5" font-family="-apple-system, sans-serif" font-weight="700" fill="#ffffff">' + phoneClockText() + '</text>';
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
    svg += '<text x="6" y="8" font-size="5.5" font-family="-apple-system, sans-serif" font-weight="600" fill="' + text + '">' + phoneClockText() + '</text>';
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
    svg += '<text x="6" y="8" font-size="5.5" font-family="-apple-system, sans-serif" font-weight="600" fill="' + text + '">' + phoneClockText() + '</text>';
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
    svg += '<text x="6" y="8" font-size="5.5" font-family="-apple-system, sans-serif" font-weight="700" fill="' + pal.text + '">' + phoneClockText() + '</text>';
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
    svg += '<text x="6" y="8" font-size="5.5" font-family="-apple-system, sans-serif" font-weight="700" fill="' + pal.text + '">' + phoneClockText() + '</text>';
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
// LAYAR PROGRES OS — tampil saat memperbaiki bug (patch) atau memperbarui versi (update).
// Satu renderer berbasis tema; tiap era memakai bahasa visual OS-nya sendiri (orisinal).
// ============================================================
function Lx(idText, enText) {
    let en = false;
    try { en = LanguageService.getLang() === 'en'; } catch (e) {}
    return escapeHtml(en ? enText : idText);
}

const PROG_THEMES = {
    mono:           { bg: ['#9db17c', '#8ca66a'], ink: '#1c2a10', sub: '#3d5226', accent: '#1c2a10', track: '#7d9660', font: 'Courier New, monospace', ind: 'lcd', card: 'none', icon: 'lcd', touch: false },
    symbian_grid:   { bg: ['#2a6cb8', '#0a2a52'], ink: '#ffffff', sub: '#c3dcf7', accent: '#ffd54a', track: 'rgba(0,0,0,0.38)', font: 'Arial, sans-serif', ind: 'bar_gloss', card: 'solid', cardFill: 'rgba(255,255,255,0.10)', icon: 'square', touch: false, softkeys: true },
    windows_mobile: { bg: ['#0c2d63', '#0c2d63'], ink: '#ffffff', sub: '#a9c2ea', accent: '#62d35f', track: 'rgba(255,255,255,0.15)', font: 'Tahoma, Arial, sans-serif', ind: 'segments', card: 'outline', icon: 'square', touch: false, titlebar: '#2a62c4', softkeys: true },
    early_ios:      { bg: ['#4a5262', '#1b202a'], ink: '#ffffff', sub: '#aab3c2', accent: '#4aa3ff', track: 'rgba(0,0,0,0.5)', font: 'Helvetica, Arial, sans-serif', ind: 'bar_gloss', card: 'solid', cardFill: 'rgba(255,255,255,0.08)', icon: 'gloss', touch: true },
    skeuomorphic:   { bg: ['#d9dbdf', '#b9bec6'], ink: '#2b2f36', sub: '#5b6270', accent: '#2f7de1', track: '#8d949f', font: 'Helvetica, Arial, sans-serif', ind: 'bar_stripe', card: 'emboss', cardFill: '#eef0f3', icon: 'gloss', touch: true },
    flat_material:  { bg: ['#fafafa', '#fafafa'], ink: '#212121', sub: '#757575', accent: '#2196f3', track: '#e0e0e0', font: 'Roboto, Arial, sans-serif', ind: 'bar_thin', card: 'line', cardFill: '#ffffff', icon: 'circle', touch: true },
    grouped_modern: { bg: ['#f2f2f7', '#f2f2f7'], ink: '#111111', sub: '#8e8e93', accent: '#0a84ff', track: '#d8d8de', font: '-apple-system, Helvetica, sans-serif', ind: 'bar_round', card: 'solid', cardFill: '#ffffff', icon: 'squircle', touch: true },
    material_you:   { bg: ['#fdf7ff', '#f3eaff'], ink: '#1d1b20', sub: '#49454f', accent: '#6750a4', accent2: '#d0bcff', track: '#e8def8', font: 'Roboto, Arial, sans-serif', ind: 'ring', card: 'solid', cardFill: '#f3edf7', icon: 'ring', touch: true },
    ai_modern:      { bg: ['#07070f', '#0b0b18'], ink: '#ffffff', sub: 'rgba(255,255,255,0.55)', accent: '#a855f7', accent2: '#06b6d4', track: 'rgba(255,255,255,0.10)', font: '-apple-system, Helvetica, sans-serif', ind: 'ring_glow', card: 'glass', cardFill: 'rgba(255,255,255,0.06)', icon: 'ring', touch: true, aurora: true }
};

function progGlyph(kind, color, sc, tx, ty) {
    // kind: 'update' (panah unduh) | 'patch' (kunci pas). Grid 14x14, diskalakan.
    const s = 'fill="none" stroke="' + color + '" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"';
    const body = kind === 'patch'
        ? '<path d="M9.6 1.4 a3.1 3.1 0 0 0 -2.9 4.1 L1.6 10.6 a1.35 1.35 0 0 0 1.9 1.9 L8.6 7.4 a3.1 3.1 0 0 0 4.1 -2.9 l-1.9 1.9 -1.8 -0.5 -0.5 -1.8 z" ' + s + '/>'
        : '<path d="M7 1.2 v7.6 M3.8 5.8 L7 9 L10.2 5.8" ' + s + '/><path d="M2 12.4 h10" ' + s + '/>';
    return '<g transform="translate(' + tx + ',' + ty + ') scale(' + sc + ')">' + body + '</g>';
}

function progSteps(kind, pct) {
    const names = kind === 'patch'
        ? [Lx('Analisis penyebab', 'Analyzing cause'), Lx('Terapkan perbaikan', 'Applying fix'), Lx('Uji stabilitas', 'Testing stability')]
        : [Lx('Mengunduh paket', 'Downloading package'), Lx('Verifikasi keamanan', 'Verifying security'), Lx('Memasang & optimasi', 'Installing & optimizing')];
    return names.map(function (n, i) {
        const lo = i * 33.4, hi = (i + 1) * 33.4;
        return { name: n, state: pct >= 100 || pct >= hi ? 'done' : (pct >= lo ? 'active' : 'todo') };
    });
}

function renderOsProgress(mode, spec, w, h, size, info) {
    const th = PROG_THEMES[mode] || PROG_THEMES.ai_modern;
    const kind = info.kind === 'patch' ? 'patch' : 'update';
    const pct = Math.max(0, Math.min(100, Math.round(info.pct || 0)));
    const u = 'pg' + Math.random().toString(36).slice(2, 7);
    const cx = w / 2;
    const F = th.font;
    const steps = progSteps(kind, pct);
    let svg = '<defs>' +
        '<linearGradient id="' + u + 'bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + th.bg[0] + '"/><stop offset="1" stop-color="' + th.bg[1] + '"/></linearGradient>' +
        '<linearGradient id="' + u + 'ac" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + th.accent + '"/><stop offset="1" stop-color="' + (th.accent2 || th.accent) + '"/></linearGradient>' +
        '<linearGradient id="' + u + 'gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.08"/><stop offset="0.51" stop-color="#000" stop-opacity="0.06"/><stop offset="1" stop-color="#000" stop-opacity="0.12"/></linearGradient>' +
        '<filter id="' + u + 'bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>' +
        '<clipPath id="' + u + 'bc"><rect x="20" y="0" width="' + (w - 40) + '" height="' + h + '"/></clipPath>' +
        '</defs>';
    svg += '<rect width="' + w + '" height="' + h + '" fill="url(#' + u + 'bg)"/>';

    // Latar khusus
    if (th.aurora) {
        svg += '<circle cx="40" cy="70" r="90" fill="' + th.accent + '" opacity="0.22" filter="url(#' + u + 'bl)"/>' +
            '<circle cx="170" cy="250" r="90" fill="' + th.accent2 + '" opacity="0.16" filter="url(#' + u + 'bl)"/>';
    } else if (mode === 'skeuomorphic') {
        for (let i = 0; i < h; i += 3) svg += '<rect x="0" y="' + i + '" width="' + w + '" height="1" fill="#000" opacity="0.025"/>';
    } else if (mode === 'material_you') {
        svg += '<circle cx="190" cy="40" r="70" fill="' + th.accent2 + '" opacity="0.35"/><circle cx="8" cy="330" r="80" fill="#efb8c8" opacity="0.25"/>';
    }

    // Status bar
    const sbCol = th.ink;
    svg += '<text x="8" y="9" font-size="6" font-family="' + F + '" font-weight="700" fill="' + sbCol + '">' + phoneClockText() + '</text>' +
        '<text x="' + (w - 8) + '" y="9" text-anchor="end" font-size="5.5" font-family="' + F + '" fill="' + sbCol + '">▮▮▮ 87%</text>';
    if (th.touch) svg += renderNotch(spec, w);
    if (th.titlebar) svg += '<rect x="0" y="0" width="' + w + '" height="13" fill="' + th.titlebar + '"/><text x="8" y="9.4" font-size="6" font-family="' + F + '" font-weight="700" fill="#fff">' + phoneClockText() + '</text>';

    const title = kind === 'patch' ? Lx('Memperbaiki bug', 'Fixing bug') : Lx('Memperbarui sistem', 'Updating system');
    let sub = '';
    if (kind === 'patch') sub = escapeHtml(String(info.bugName || '').slice(0, 28));
    else sub = escapeHtml((info.fromVersion ? info.fromVersion + ' → ' : '') + (info.toVersion || ''));
    const hint = kind === 'patch' ? Lx('Berjalan di latar belakang', 'Running in the background') : Lx('Jangan matikan perangkat', 'Do not power off');

    let y = 40;
    // ---------- Indikator ----------
    if (th.ind === 'lcd') {
        svg += '<text x="' + cx + '" y="52" text-anchor="middle" font-size="9" font-family="' + F + '" font-weight="700" fill="' + th.ink + '">' + title.toUpperCase() + '</text>' +
            '<text x="' + cx + '" y="66" text-anchor="middle" font-size="6.5" font-family="' + F + '" fill="' + th.sub + '">' + sub + '</text>';
        const bx = 24, bw = w - 48, n = 16, sw = bw / n;
        svg += '<rect x="' + (bx - 2) + '" y="86" width="' + (bw + 4) + '" height="16" fill="none" stroke="' + th.ink + '" stroke-width="1"/>';
        for (let i = 0; i < n; i++) if ((i + 1) / n * 100 <= pct + 3) svg += '<rect x="' + (bx + i * sw + 0.8) + '" y="88.5" width="' + (sw - 1.6) + '" height="11" fill="' + th.ink + '"/>';
        svg += '<text x="' + cx + '" y="122" text-anchor="middle" font-size="12" font-family="' + F + '" font-weight="700" fill="' + th.ink + '">' + pct + '%</text>';
        y = 142;
        steps.forEach(function (s, i) {
            const mark = s.state === 'done' ? '[X]' : (s.state === 'active' ? '[>]' : '[ ]');
            svg += '<text x="24" y="' + (y + i * 14) + '" font-size="6.8" font-family="' + F + '" fill="' + th.ink + '" opacity="' + (s.state === 'todo' ? 0.45 : 1) + '">' + mark + ' ' + s.name + '</text>';
        });
        svg += '<text x="' + cx + '" y="' + (h - 16) + '" text-anchor="middle" font-size="6" font-family="' + F + '" fill="' + th.sub + '">' + hint + '<animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite"/></text>';
        return svg;
    }

    const isRing = th.ind === 'ring' || th.ind === 'ring_glow';
    if (isRing) {
        const ry = 128, r = 38, C = 2 * Math.PI * r, sw = th.ind === 'ring_glow' ? 5 : 7;
        svg += '<circle cx="' + cx + '" cy="' + ry + '" r="' + r + '" fill="none" stroke="' + th.track + '" stroke-width="' + sw + '"/>';
        if (th.ind === 'ring_glow') svg += '<circle cx="' + cx + '" cy="' + ry + '" r="' + r + '" fill="none" stroke="url(#' + u + 'ac)" stroke-width="' + (sw + 5) + '" stroke-linecap="round" stroke-dasharray="' + (C * pct / 100) + ' ' + C + '" transform="rotate(-90 ' + cx + ' ' + ry + ')" opacity="0.45" filter="url(#' + u + 'bl)"/>';
        svg += '<circle cx="' + cx + '" cy="' + ry + '" r="' + r + '" fill="none" stroke="url(#' + u + 'ac)" stroke-width="' + sw + '" stroke-linecap="round" stroke-dasharray="' + (C * pct / 100) + ' ' + C + '" transform="rotate(-90 ' + cx + ' ' + ry + ')"/>';
        // titik orbit berputar (dekorasi)
        svg += '<circle cx="' + cx + '" cy="' + (ry - r - 9) + '" r="1.6" fill="' + th.accent2 + '"><animateTransform attributeName="transform" type="rotate" from="0 ' + cx + ' ' + ry + '" to="360 ' + cx + ' ' + ry + '" dur="6s" repeatCount="indefinite"/></circle>';
        svg += progGlyph(kind, th.ink, 1.25, cx - 8.75, ry - 26) +
            '<text x="' + cx + '" y="' + (ry + 17) + '" text-anchor="middle" font-size="17" font-family="' + F + '" font-weight="800" fill="' + th.ink + '">' + pct + '<tspan font-size="8" font-weight="600" fill="' + th.sub + '">%</tspan></text>';
        y = ry + r + 26;
    } else {
        const iy = 96, is = 44;
        const ix = cx - is / 2;
        if (th.icon === 'gloss') {
            svg += '<rect x="' + ix + '" y="' + (iy - is / 2) + '" width="' + is + '" height="' + is + '" rx="10" fill="url(#' + u + 'ac)"/><rect x="' + ix + '" y="' + (iy - is / 2) + '" width="' + is + '" height="' + is + '" rx="10" fill="url(#' + u + 'gl)"/>';
        } else if (th.icon === 'circle') {
            svg += '<circle cx="' + cx + '" cy="' + iy + '" r="' + is / 2 + '" fill="' + th.accent + '"/>';
        } else if (th.icon === 'squircle') {
            svg += '<rect x="' + ix + '" y="' + (iy - is / 2) + '" width="' + is + '" height="' + is + '" rx="13" fill="url(#' + u + 'ac)"/>';
        } else {
            svg += '<rect x="' + ix + '" y="' + (iy - is / 2) + '" width="' + is + '" height="' + is + '" rx="3" fill="' + th.accent + '" stroke="rgba(0,0,0,0.35)" stroke-width="0.8"/>';
        }
        const gcol = (th.icon === 'square' && mode !== 'windows_mobile') ? '#1a2a44' : '#ffffff';
        svg += progGlyph(kind, gcol, 1.9, cx - 13.3, iy - 13.3);
        y = iy + is / 2 + 4;
    }

    svg += '<text x="' + cx + '" y="' + (y + 12) + '" text-anchor="middle" font-size="10.5" font-family="' + F + '" font-weight="700" fill="' + th.ink + '">' + title + '</text>' +
        '<text x="' + cx + '" y="' + (y + 24) + '" text-anchor="middle" font-size="6.5" font-family="' + F + '" fill="' + th.sub + '">' + sub + '</text>';
    y += 40;

    // ---------- Bar progres ----------
    if (!isRing) {
        const bx = 20, bw = w - 40, fill = bw * pct / 100;
        if (th.ind === 'segments') {
            const n = 22, sw = bw / n;
            for (let i = 0; i < n; i++) svg += '<rect x="' + (bx + i * sw + 0.7) + '" y="' + y + '" width="' + (sw - 1.4) + '" height="9" fill="' + ((i + 1) / n * 100 <= pct + 2 ? th.accent : th.track) + '"/>';
            svg += '<text x="' + cx + '" y="' + (y + 21) + '" text-anchor="middle" font-size="7" font-family="' + F + '" fill="' + th.ink + '">' + pct + '%</text>';
        } else {
            const bh = th.ind === 'bar_thin' ? 3 : (th.ind === 'bar_round' ? 5 : 9), rr = th.ind === 'bar_thin' ? 1.5 : bh / 2;
            svg += '<rect x="' + bx + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="' + rr + '" fill="' + th.track + '"/>';
            if (fill > 0) {
                svg += '<rect x="' + bx + '" y="' + y + '" width="' + fill + '" height="' + bh + '" rx="' + rr + '" fill="' + th.accent + '"/>';
                if (th.ind === 'bar_gloss' || th.ind === 'bar_stripe') svg += '<rect x="' + bx + '" y="' + y + '" width="' + fill + '" height="' + bh + '" rx="' + rr + '" fill="url(#' + u + 'gl)"/>';
                if (th.ind === 'bar_stripe') { for (let sx = bx - 10; sx < bx + fill; sx += 8) svg += '<path d="M' + Math.max(bx, sx) + ' ' + (y + bh) + ' L' + Math.max(bx, sx + 5) + ' ' + y + ' L' + Math.min(bx + fill, sx + 9) + ' ' + y + ' L' + Math.min(bx + fill, sx + 4) + ' ' + (y + bh) + ' Z" fill="#fff" opacity="0.22"/>'; }
                // kilau bergerak
                svg += '<g clip-path="url(#' + u + 'bc)"><rect x="' + bx + '" y="' + y + '" width="14" height="' + bh + '" rx="' + rr + '" fill="#fff" opacity="0.28"><animate attributeName="x" from="' + bx + '" to="' + (bx + Math.max(0, fill - 14)) + '" dur="1.8s" repeatCount="indefinite"/></rect></g>';
            }
            svg += '<text x="' + bx + '" y="' + (y + bh + 11) + '" font-size="6.5" font-family="' + F + '" fill="' + th.sub + '">' + hint + '</text>' +
                '<text x="' + (bx + bw) + '" y="' + (y + bh + 11) + '" text-anchor="end" font-size="7" font-family="' + F + '" font-weight="700" fill="' + th.ink + '">' + pct + '%</text>';
        }
        y += 34;
    } else {
        svg += '<text x="' + cx + '" y="' + (y - 6) + '" text-anchor="middle" font-size="6.2" font-family="' + F + '" fill="' + th.sub + '">' + hint + '</text>';
        y += 6;
    }

    // ---------- Kartu langkah ----------
    const rowH = 19, ch = steps.length * rowH + 8, cxl = 12, cw = w - 24;
    if (th.card === 'solid' || th.card === 'glass' || th.card === 'emboss' || th.card === 'line') {
        const stroke = th.card === 'glass' ? 'rgba(255,255,255,0.14)' : (th.card === 'emboss' ? 'rgba(0,0,0,0.18)' : (th.card === 'line' ? '#e0e0e0' : 'none'));
        svg += '<rect x="' + cxl + '" y="' + y + '" width="' + cw + '" height="' + ch + '" rx="' + (th.card === 'line' ? 2 : 10) + '" fill="' + th.cardFill + '" stroke="' + stroke + '" stroke-width="0.6"/>';
    } else if (th.card === 'outline') {
        svg += '<rect x="' + cxl + '" y="' + y + '" width="' + cw + '" height="' + ch + '" fill="none" stroke="' + th.track + '" stroke-width="0.8"/>';
    }
    steps.forEach(function (s, i) {
        const ry = y + 4 + i * rowH, mid = ry + rowH / 2;
        const op = s.state === 'todo' ? 0.4 : 1;
        if (s.state === 'done') {
            svg += '<circle cx="26" cy="' + mid + '" r="5.2" fill="' + th.accent + '"/><path d="M23.4 ' + mid + ' l2 2 l3.4 -3.8" fill="none" stroke="' + ((mode === 'flat_material' || mode === 'grouped_modern' || mode === 'material_you') ? '#fff' : (th.accent2 ? '#fff' : '#06210a')) + '" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>';
        } else if (s.state === 'active') {
            svg += '<circle cx="26" cy="' + mid + '" r="5.2" fill="none" stroke="' + th.track + '" stroke-width="1.4"/><path d="M26 ' + (mid - 5.2) + ' a5.2 5.2 0 0 1 5.2 5.2" fill="none" stroke="' + th.accent + '" stroke-width="1.6" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 26 ' + mid + '" to="360 26 ' + mid + '" dur="1s" repeatCount="indefinite"/></path>';
        } else {
            svg += '<circle cx="26" cy="' + mid + '" r="5.2" fill="none" stroke="' + th.sub + '" stroke-width="0.9" opacity="0.6"/>';
        }
        svg += '<text x="38" y="' + (mid + 2.4) + '" font-size="6.8" font-family="' + F + '" font-weight="' + (s.state === 'active' ? 700 : 500) + '" fill="' + th.ink + '" opacity="' + op + '">' + s.name + '</text>';
    });
    y += ch;

    // Softkey (Symbian / Windows Mobile)
    if (th.softkeys) {
        svg += '<rect x="0" y="' + (h - 18) + '" width="' + w + '" height="18" fill="rgba(0,0,0,0.45)"/>' +
            '<text x="8" y="' + (h - 6) + '" font-size="7" font-family="' + F + '" font-weight="700" fill="#fff">' + Lx('Opsi', 'Options') + '</text>' +
            '<text x="' + (w - 8) + '" y="' + (h - 6) + '" text-anchor="end" font-size="7" font-family="' + F + '" font-weight="700" fill="#fff">' + Lx('Sembunyikan', 'Hide') + '</text>';
    } else {
        svg += '<rect x="' + (cx - 30) + '" y="' + (h - 9) + '" width="60" height="2.6" rx="1.3" fill="' + th.ink + '" opacity="0.5"/>';
    }
    return svg;
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
    // Layar progres: memperbaiki bug (patch) atau memperbarui versi OS (update).
    if (opts.screen === 'patch' || opts.screen === 'update') {
        const inner = renderOsProgress(mode, spec, w, h, size, {
            kind: opts.screen, pct: opts.progress, bugName: opts.bugName,
            toVersion: opts.toVersion, fromVersion: getCurrentVersionString(osState)
        });
        return '<div class="os-screen-wrap os-screen-' + opts.screen + '"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + size + '" height="' + Math.round(size * 2) + '" preserveAspectRatio="xMidYMid meet">' + inner + '</svg></div>';
    }
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
