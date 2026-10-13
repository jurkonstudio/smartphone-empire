// FILE: src/ui/phone/OsScreenMockup.js
// ============================================================
// OsScreenMockup — render layar OS sebagai SVG realistis.
// Dua mode:
//   - 'settings' (default) — tampilan Settings/Pengaturan
//   - 'home'               — tampilan home screen dengan grid app
// Nilai di setiap row berubah sesuai fitur OS yang dimiliki pemain.
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
// PALETTE (per era, dark/light)
// ============================================================
function palette(eraId, isDark) {
    if (isDark) {
        return {
            bg: '#000000',
            surface: '#1a1a1f',
            surfaceAlt: '#0a0a0f',
            text: '#f0f4ff',
            sub: 'rgba(240,244,255,0.55)',
            line: 'rgba(255,255,255,0.08)',
            accent: '#0a84ff'
        };
    }
    // Light mode (default kalau belum punya fw_dark_mode)
    const eras = {
        era_lcd_mono:          { accent: '#4a5a3a' },
        era_tft_color:         { accent: '#3a6a9a' },
        era_touch_revolution:  { accent: '#0a84ff' },
        era_smartphone_modern: { accent: '#4f8cff' },
        era_premium:           { accent: '#c9a961' },
        era_ai_era:            { accent: '#00d4ff' },
        era_foldable:          { accent: '#a855f7' }
    };
    const e = eras[eraId] || eras.era_smartphone_modern;
    return {
        bg: '#f2f2f7',
        surface: '#ffffff',
        surfaceAlt: '#e8e8ed',
        text: '#0a0a0f',
        sub: 'rgba(10,10,15,0.55)',
        line: 'rgba(0,0,0,0.08)',
        accent: e.accent
    };
}

// ============================================================
// NOTCH / DYNAMIC ISLAND
// ============================================================
function renderNotch(spec, w, pal) {
    if (!spec || !spec.notch) return '';
    const cx = w / 2;
    const notchColor = '#000';

    if (spec.notch === 'notch') {
        const nw = w * 0.42;
        return '<path d="M ' + (cx - nw/2) + ' 0 L ' + (cx - nw/2 + 3) + ' 12 L ' + (cx + nw/2 - 3) + ' 12 L ' + (cx + nw/2) + ' 0 Z" fill="' + notchColor + '"/>' +
            '<circle cx="' + (cx + nw/2 - 8) + '" cy="7" r="1.6" fill="#0a0a14"/>';
    }
    if (spec.notch === 'teardrop') {
        return '<path d="M ' + (cx - 10) + ' 0 Q ' + (cx - 10) + ' 12 ' + cx + ' 12 Q ' + (cx + 10) + ' 12 ' + (cx + 10) + ' 0 Z" fill="' + notchColor + '"/>';
    }
    if (spec.notch === 'punch_hole_center') {
        return '<circle cx="' + cx + '" cy="7" r="4" fill="' + notchColor + '"/>' +
            '<circle cx="' + cx + '" cy="7" r="2" fill="#1a1a1f"/>';
    }
    if (spec.notch === 'punch_hole_left') {
        return '<circle cx="20" cy="7" r="4" fill="' + notchColor + '"/>' +
            '<circle cx="20" cy="7" r="2" fill="#1a1a1f"/>';
    }
    if (spec.notch === 'dynamic_island') {
        return '<rect x="' + (cx - 24) + '" y="4" width="48" height="15" rx="7.5" fill="' + notchColor + '"/>' +
            '<circle cx="' + (cx + 14) + '" cy="11.5" r="2.6" fill="#0a0a14"/>' +
            '<circle cx="' + (cx + 14) + '" cy="11.5" r="1.3" fill="#1a2a3a" opacity="0.6"/>';
    }
    return '';
}

// ============================================================
// STATUS BAR
// ============================================================
function renderStatusBar(w, pal) {
    const color = pal.text;
    return '<g>' +
        '<text x="14" y="14" font-size="9" font-family="-apple-system, sans-serif" font-weight="700" fill="' + color + '">9:41</text>' +
        '<g fill="' + color + '" opacity="0.9">' +
            '<rect x="' + (w - 44) + '" y="8" width="2" height="3" rx="0.3"/>' +
            '<rect x="' + (w - 41) + '" y="7" width="2" height="4" rx="0.3"/>' +
            '<rect x="' + (w - 38) + '" y="6" width="2" height="5" rx="0.3"/>' +
            '<rect x="' + (w - 35) + '" y="5" width="2" height="6" rx="0.3"/>' +
            '<rect x="' + (w - 26) + '" y="6" width="14" height="7" rx="1.5" fill="none" stroke="' + color + '" stroke-width="0.8"/>' +
            '<rect x="' + (w - 25) + '" y="7" width="9" height="5" rx="0.8" fill="' + color + '"/>' +
            '<rect x="' + (w - 11) + '" y="8" width="1.5" height="3" rx="0.3" fill="' + color + '"/>' +
        '</g>' +
    '</g>';
}

// ============================================================
// HEADER (back arrow + title)
// ============================================================
function renderHeader(pal, title, subtitle) {
    return '<g>' +
        '<path d="M 22 30 L 14 34 L 22 38" fill="none" stroke="' + pal.accent + '" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<text x="' + (subtitle ? 34 : 100) + '" y="32" ' + (subtitle ? '' : 'text-anchor="middle" ') + 'font-size="11" font-family="-apple-system, sans-serif" font-weight="700" fill="' + pal.text + '">' + escapeHtml(title) + '</text>' +
        (subtitle ? '<text x="34" y="42" font-size="6.5" font-family="-apple-system, sans-serif" fill="' + pal.sub + '">' + escapeHtml(subtitle) + '</text>' : '') +
    '</g>';
}

// ============================================================
// SEARCH BAR
// ============================================================
function renderSearchBar(pal, y) {
    return '<g>' +
        '<rect x="14" y="' + y + '" width="172" height="18" rx="6" fill="' + pal.surfaceAlt + '"/>' +
        '<circle cx="26" cy="' + (y + 9) + '" r="3.5" fill="none" stroke="' + pal.sub + '" stroke-width="0.9"/>' +
        '<line x1="28.5" y1="' + (y + 11.5) + '" x2="31" y2="' + (y + 14) + '" stroke="' + pal.sub + '" stroke-width="0.9" stroke-linecap="round"/>' +
        '<text x="36" y="' + (y + 12) + '" font-size="7" font-family="-apple-system, sans-serif" fill="' + pal.sub + '">Cari pengaturan</text>' +
    '</g>';
}

// ============================================================
// PROFILE CARD
// ============================================================
function renderProfileCard(pal, y, companyName) {
    const w = 172;
    const h = 42;
    const x = 14;
    const initial = (companyName || 'My Tech Co').charAt(0).toUpperCase();

    return '<g>' +
        '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" fill="' + pal.surface + '"/>' +
        '<circle cx="' + (x + 22) + '" cy="' + (y + h/2) + '" r="12" fill="' + pal.accent + '"/>' +
        '<text x="' + (x + 22) + '" y="' + (y + h/2 + 4) + '" text-anchor="middle" font-size="13" font-family="-apple-system, sans-serif" font-weight="700" fill="#ffffff">' + escapeHtml(initial) + '</text>' +
        '<text x="' + (x + 42) + '" y="' + (y + 18) + '" font-size="8.5" font-family="-apple-system, sans-serif" font-weight="700" fill="' + pal.text + '">' + escapeHtml(companyName || 'My Tech Co') + '</text>' +
        '<text x="' + (x + 42) + '" y="' + (y + 29) + '" font-size="7" font-family="-apple-system, sans-serif" fill="' + pal.sub + '">Akun &amp; Ekosistem</text>' +
        '<path d="M ' + (x + w - 18) + ' ' + (y + h/2 - 4) + ' L ' + (x + w - 14) + ' ' + (y + h/2) + ' L ' + (x + w - 18) + ' ' + (y + h/2 + 4) + '" fill="none" stroke="' + pal.sub + '" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</g>';
}

// ============================================================
// ICON GLYPHS (mini, 14x14 area — origin di 0,0)
// ============================================================
function glyph(name, color) {
    const s = 'fill="none" stroke="' + color + '" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"';
    const map = {
        wifi:     '<path d="M3 7 a8 8 0 0 1 8 0" ' + s + '/><path d="M0.5 4.5 a12 12 0 0 1 13 0" ' + s + '/><circle cx="7" cy="10" r="0.7" fill="' + color + '"/>',
        display:  '<rect x="1" y="2" width="12" height="9" rx="1.2" ' + s + '/><line x1="5" y1="14" x2="9" y2="14" ' + s + '/><line x1="7" y1="11" x2="7" y2="14" ' + s + '/>',
        volume:   '<path d="M1 5 L4 5 L7 2 L7 12 L4 9 L1 9 Z" ' + s + '/><path d="M9 4.5 a4 4 0 0 1 0 5" ' + s + '/>',
        bell:     '<path d="M3 9 c0 -3 0.5 -5 4 -5 c3.5 0 4 2 4 5 l1 1.5 h-10 z" ' + s + '/><path d="M5.5 11.5 a1.5 1.5 0 0 0 3 0" ' + s + '/>',
        lock:     '<rect x="2.5" y="6" width="9" height="7" rx="1.4" ' + s + '/><path d="M4.5 6 V4.5 a2.5 2.5 0 0 1 5 0 V6" ' + s + '/>',
        ai:       '<circle cx="7" cy="7" r="3" ' + s + '/><path d="M7 1 v2 M7 11 v2 M1 7 h2 M11 7 h2 M2.5 2.5 l1.5 1.5 M10 10 l1.5 1.5 M2.5 11.5 l1.5 -1.5 M10 4 l1.5 -1.5" ' + s + '/>',
        info:     '<circle cx="7" cy="7" r="6" ' + s + '/><line x1="7" y1="6" x2="7" y2="10" ' + s + '/><circle cx="7" cy="4.5" r="0.6" fill="' + color + '"/>',
        cloud:    '<path d="M3 11 h7 a2.5 2.5 0 0 0 0.5 -4.5 a3.5 3.5 0 0 0 -6.5 -1 a2.5 2.5 0 0 0 -1 5.5 z" ' + s + '/>'
    };
    return map[name] || '';
}

// ============================================================
// SETTINGS ROW
// ============================================================
function renderRow(y, iconName, label, value, pal, toggleOn) {
    const iconX = 22;
    const iconY = y + 8;
    const valueX = 178;
    const chevronX = 186;

    let rightSide = '';
    if (toggleOn === true) {
        // Toggle: track + knob
        rightSide = '<rect x="' + (chevronX - 16) + '" y="' + (y + 6) + '" width="20" height="12" rx="6" fill="' + pal.accent + '"/>' +
            '<circle cx="' + (chevronX - 2) + '" cy="' + (y + 12) + '" r="4.5" fill="#ffffff"/>';
    } else if (toggleOn === false) {
        rightSide = '<rect x="' + (chevronX - 16) + '" y="' + (y + 6) + '" width="20" height="12" rx="6" fill="' + pal.surfaceAlt + '"/>' +
            '<circle cx="' + (chevronX - 12) + '" cy="' + (y + 12) + '" r="4.5" fill="#ffffff"/>';
    } else {
        rightSide =
            (value ? '<text x="' + (chevronX - 6) + '" y="' + (y + 13) + '" text-anchor="end" font-size="6.5" font-family="-apple-system, sans-serif" fill="' + pal.sub + '">' + escapeHtml(value) + '</text>' : '') +
            '<path d="M ' + (chevronX - 3) + ' ' + (y + 9) + ' L ' + (chevronX) + ' ' + (y + 12) + ' L ' + (chevronX - 3) + ' ' + (y + 15) + '" fill="none" stroke="' + pal.sub + '" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>';
    }

    return '<g>' +
        '<g transform="translate(' + iconX + ',' + iconY + ')" stroke-linecap="round" stroke-linejoin="round">' + glyph(iconName, pal.accent) + '</g>' +
        '<text x="' + (iconX + 22) + '" y="' + (y + 13) + '" font-size="8" font-family="-apple-system, sans-serif" font-weight="500" fill="' + pal.text + '">' + escapeHtml(label) + '</text>' +
        rightSide +
        '<line x1="14" y1="' + (y + 22) + '" x2="186" y2="' + (y + 22) + '" stroke="' + pal.line + '" stroke-width="0.5"/>' +
    '</g>';
}

// ============================================================
// FOOTER
// ============================================================
function renderFooter(pal, osName, versionString) {
    const label = (osName || 'MyOS') + ' ' + (versionString || '—');
    return '<g>' +
        '<text x="100" y="392" text-anchor="middle" font-size="6.5" font-family="-apple-system, sans-serif" fill="' + pal.sub + '">' + escapeHtml(label) + '</text>' +
    '</g>';
}

// ============================================================
// SETTINGS VIEW
// ============================================================
function renderSettingsView(featureIds, osState, spec, year, isDark, size) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const eraId = getDesignEraForYear(year).id;
    const pal = palette(eraId, isDark);
    const w = 200;
    const h = 400;

    // Hitung nilai per row
    const networkValue = has('net_5g') ? '5G' : has('net_4g') ? 'LTE' : has('net_3g') ? '3G' : has('net_gsm') ? 'GSM' : 'Nonaktif';
    const displayValue = isDark ? 'Gelap' : 'Terang';
    const volumeValue = '80%';
    const notificationOn = has('fw_smart_notif') || has('fw_notifications');
    const securityValue = has('fw_biometric') ? 'Face ID' : has('fw_fingerprint') ? 'Fingerprint' : has('fw_privacy') ? 'PIN' : 'Nonaktif';
    const aiOn = has('fw_siri') || has('fw_ai_on_device') || has('fw_ondevice_llm');
    const versionValue = getCurrentVersionString(osState) || '—';
    const storageValue = has('fw_cloud_sync') ? '128 GB' : '64 GB';

    // Status bar
    let svg = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="' + pal.bg + '"/>';
    svg += renderStatusBar(w, pal);
    svg += renderHeader(pal, 'Pengaturan', 'Sistem & Preferensi');
    svg += renderSearchBar(pal, 52);
    svg += renderProfileCard(pal, 78, osState && osState.name ? osState.name : null);

    // Section title
    svg += '<text x="14" y="134" font-size="7" font-family="-apple-system, sans-serif" font-weight="700" fill="' + pal.sub + '" letter-spacing="0.5">PENGATURAN SISTEM</text>';

    // Rows
    const startY = 142;
    const rowH = 24;
    let i = 0;
    svg += renderRow(startY + i * rowH, 'wifi',    'Jaringan',   networkValue, pal); i++;
    svg += renderRow(startY + i * rowH, 'display', 'Tampilan',   displayValue, pal); i++;
    svg += renderRow(startY + i * rowH, 'volume',  'Suara',      volumeValue, pal); i++;
    svg += renderRow(startY + i * rowH, 'bell',    'Notifikasi', null, pal, notificationOn); i++;
    svg += renderRow(startY + i * rowH, 'lock',    'Keamanan',   securityValue, pal); i++;
    svg += renderRow(startY + i * rowH, 'ai',      'AI & Asisten', null, pal, aiOn); i++;
    svg += renderRow(startY + i * rowH, 'cloud',   'Penyimpanan', storageValue, pal); i++;

    // About OS row
    svg += renderRow(startY + i * rowH, 'info', 'Tentang OS', versionValue, pal); i++;

    // Notch di atas
    svg += renderNotch(spec, w, pal);

    // Footer versi
    svg += renderFooter(pal, osState && osState.name, versionValue);

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + size + '" height="' + Math.round(size * 2) + '" preserveAspectRatio="xMidYMid meet">' + svg + '</svg>';
}

// ============================================================
// HOME VIEW (sederhana, untuk nanti)
// ============================================================
function renderHomeView(featureIds, osState, spec, year, isDark, size) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const eraId = getDesignEraForYear(year).id;
    const pal = palette(eraId, isDark);
    const w = 200;
    const h = 400;

    let svg = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="' + pal.bg + '"/>';
    svg += renderStatusBar(w, pal);
    svg += '<text x="100" y="200" text-anchor="middle" font-size="10" font-family="-apple-system, sans-serif" fill="' + pal.sub + '">Home screen</text>';
    svg += renderNotch(spec, w, pal);
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
    const isDark = featureIds.indexOf('fw_dark_mode') >= 0;

    const size = opts.size || 120;
    const view = opts.view || 'settings';

    let svgInner = '';
    if (view === 'home') {
        svgInner = renderHomeView(featureIds, osState, spec, year, isDark, size);
    } else {
        svgInner = renderSettingsView(featureIds, osState, spec, year, isDark, size);
    }

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
        eraId: getDesignEraForYear(year).id,
        specId: resolveSpec(year, completed).id,
        featureCount: featureIds.length,
        isDark: featureIds.indexOf('fw_dark_mode') >= 0
    };
                                      }
