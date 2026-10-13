// FILE: src/ui/phone/OsScreenMockup.js
// ============================================================
// OsScreenMockup — render layar OS sebagai SVG realistis.
// Tampilan berubah sesuai fitur OS yang sudah dimiliki pemain.
// Layer: wallpaper, status bar, widget, app grid, dock, home.
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

// Ambil fitur dari versi OS aktif.
function getCurrentFeatures(osState) {
    if (!osState || !osState.versions || !osState.versions.length) return [];
    const id = osState.currentVersionId || osState.versions[osState.versions.length - 1].id;
    const v = osState.versions.find(function (x) { return x.id === id; });
    if (!v || !Array.isArray(v.features)) return [];
    return v.features;
}

// ============================================================
// WALLPAPER per era
// ============================================================
function wallpaperPalette(eraId, isDark) {
    const table = {
        era_lcd_mono:         { a: '#6a8a4a', b: '#3a4a2a', pattern: 'grid' },
        era_tft_color:        { a: '#1a3a5a', b: '#3a6a9a', pattern: 'dots' },
        era_touch_revolution: { a: '#0a1525', b: '#1a3050', pattern: 'gloss' },
        era_smartphone_modern:{ a: '#1a2530', b: '#2a3a50', pattern: 'flat' },
        era_premium:          { a: '#0a0a0a', b: '#2a1f10', pattern: 'noise' },
        era_ai_era:           { a: '#080c14', b: '#0f2030', pattern: 'mesh' },
        era_foldable:         { a: '#04040a', b: '#1a0a2a', pattern: 'aurora' }
    };
    const base = table[eraId] || table.era_smartphone_modern;
    if (isDark) {
        return { a: '#000000', b: '#0a0a14', pattern: base.pattern };
    }
    return base;
}

// ============================================================
// WALLPAPER render
// ============================================================
function renderWallpaper(eraId, isDark, w, h) {
    const pal = wallpaperPalette(eraId, isDark);
    const gradId = 'oswp_' + Math.random().toString(36).slice(2, 7);

    let pattern = '';
    if (pal.pattern === 'grid') {
        pattern = '<g opacity="0.08">' +
            Array.from({ length: 20 }, function (_, i) {
                return '<line x1="0" y1="' + (i * h / 20) + '" x2="' + w + '" y2="' + (i * h / 20) + '" stroke="#fff" stroke-width="0.3"/>';
            }).join('') + '</g>';
    } else if (pal.pattern === 'dots') {
        pattern = '<g opacity="0.1">' +
            Array.from({ length: 12 }, function (_, i) {
                return Array.from({ length: 6 }, function (_, j) {
                    return '<circle cx="' + (i * w / 12) + '" cy="' + (j * h / 6) + '" r="0.8" fill="#fff"/>';
                }).join('');
            }).join('') + '</g>';
    } else if (pal.pattern === 'aurora') {
        const blurId = 'osblur_' + Math.random().toString(36).slice(2, 7);
        pattern = '<defs><filter id="' + blurId + '"><feGaussianBlur stdDeviation="24"/></filter></defs>' +
            '<ellipse cx="' + (w * 0.3) + '" cy="' + (h * 0.25) + '" rx="' + (w * 0.7) + '" ry="' + (h * 0.3) + '" fill="#a855f7" opacity="0.35" filter="url(#' + blurId + ')"/>' +
            '<ellipse cx="' + (w * 0.7) + '" cy="' + (h * 0.65) + '" rx="' + (w * 0.6) + '" ry="' + (h * 0.25) + '" fill="#06b6d4" opacity="0.3" filter="url(#' + blurId + ')"/>';
    } else if (pal.pattern === 'mesh') {
        const blurId = 'osblur_' + Math.random().toString(36).slice(2, 7);
        pattern = '<defs><radialGradient id="' + gradId + '_mesh" cx="30%" cy="35%">' +
            '<stop offset="0%" stop-color="#00d4ff" stop-opacity="0.28"/>' +
            '<stop offset="100%" stop-color="' + pal.a + '" stop-opacity="0"/></radialGradient></defs>' +
            '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="url(#' + gradId + '_mesh)"/>';
    }

    return '<defs>' +
        '<linearGradient id="' + gradId + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="' + pal.a + '"/>' +
            '<stop offset="100%" stop-color="' + pal.b + '"/>' +
        '</linearGradient>' +
        '</defs>' +
        '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="url(#' + gradId + ')"/>' +
        pattern;
}

// ============================================================
// STATUS BAR
// ============================================================
function renderStatusBar(w, isDark, accent) {
    const color = isDark ? '#e8eaee' : '#f0f4ff';
    const timeText = '9:41';
    return '<g>' +
        '<text x="14" y="15" font-size="9" font-family="-apple-system, sans-serif" font-weight="700" fill="' + color + '">' + timeText + '</text>' +
        '<g fill="' + color + '" opacity="0.9">' +
            // signal bars
            '<rect x="' + (w - 44) + '" y="8" width="2" height="3" rx="0.3"/>' +
            '<rect x="' + (w - 41) + '" y="7" width="2" height="4" rx="0.3"/>' +
            '<rect x="' + (w - 38) + '" y="6" width="2" height="5" rx="0.3"/>' +
            '<rect x="' + (w - 35) + '" y="5" width="2" height="6" rx="0.3"/>' +
            // battery
            '<rect x="' + (w - 26) + '" y="6" width="14" height="7" rx="1.5" fill="none" stroke="' + color + '" stroke-width="0.8"/>' +
            '<rect x="' + (w - 25) + '" y="7" width="9" height="5" rx="0.8" fill="' + color + '"/>' +
            '<rect x="' + (w - 11) + '" y="8" width="1.5" height="3" rx="0.3" fill="' + color + '"/>' +
        '</g>' +
    '</g>';
}

// ============================================================
// NOTCH / DYNAMIC ISLAND
// ============================================================
function renderNotch(spec, w) {
    if (!spec || !spec.notch) return '';
    const cx = w / 2;

    if (spec.notch === 'notch') {
        const nw = w * 0.42;
        return '<path d="M ' + (cx - nw/2) + ' 0 L ' + (cx - nw/2 + 3) + ' 12 L ' + (cx + nw/2 - 3) + ' 12 L ' + (cx + nw/2) + ' 0 Z" fill="#000"/>' +
            '<circle cx="' + (cx + nw/2 - 8) + '" cy="7" r="1.6" fill="#0a0a14"/>' +
            '<circle cx="' + (cx - nw/2 + 8) + '" cy="7" r="0.8" fill="#0a0a14"/>';
    }
    if (spec.notch === 'teardrop') {
        return '<path d="M ' + (cx - 10) + ' 0 Q ' + (cx - 10) + ' 12 ' + cx + ' 12 Q ' + (cx + 10) + ' 12 ' + (cx + 10) + ' 0 Z" fill="#000"/>';
    }
    if (spec.notch === 'punch_hole_center') {
        return '<circle cx="' + cx + '" cy="7" r="4" fill="#000"/>' +
            '<circle cx="' + cx + '" cy="7" r="2" fill="#0a0a14"/>';
    }
    if (spec.notch === 'punch_hole_left') {
        return '<circle cx="20" cy="7" r="4" fill="#000"/>' +
            '<circle cx="20" cy="7" r="2" fill="#0a0a14"/>';
    }
    if (spec.notch === 'dynamic_island') {
        return '<rect x="' + (cx - 22) + '" y="4" width="44" height="14" rx="7" fill="#000"/>' +
            '<circle cx="' + (cx + 14) + '" cy="11" r="2.5" fill="#0a0a14"/>' +
            '<circle cx="' + (cx + 14) + '" cy="11" r="1.2" fill="#1a2a3a" opacity="0.6"/>';
    }
    return '';
}

// ============================================================
// WIDGET (jika fw_widgets_basic / fw_home_widgets)
// ============================================================
function renderWidget(hasBasic, hasAdvanced, w, accent, isDark) {
    if (!hasBasic && !hasAdvanced) return '';
    const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.35)';
    const textColor = '#ffffff';
    const timeText = '9:41';
    const big = hasAdvanced;
    const cardW = big ? (w - 48) : (w - 60);
    const cardH = big ? 78 : 62;
    const x = 24;
    const y = 34;

    return '<g>' +
        '<rect x="' + x + '" y="' + y + '" width="' + cardW + '" height="' + cardH + '" rx="10" fill="' + cardBg + '"/>' +
        '<text x="' + (x + 12) + '" y="' + (y + 22) + '" font-size="' + (big ? 22 : 18) + '" font-family="-apple-system, sans-serif" font-weight="200" fill="' + textColor + '" letter-spacing="-0.5">' + timeText + '</text>' +
        '<text x="' + (x + 12) + '" y="' + (y + 34) + '" font-size="7" font-family="sans-serif" fill="' + textColor + '" opacity="0.7">Design Studio</text>' +
        (big
            ? '<g>' +
                '<line x1="' + (x + 12) + '" y1="' + (y + 46) + '" x2="' + (x + cardW - 12) + '" y2="' + (y + 46) + '" stroke="' + textColor + '" stroke-opacity="0.15"/>' +
                '<text x="' + (x + 12) + '" y="' + (y + 60) + '" font-size="7" fill="' + textColor + '" opacity="0.8">Design session aktif</text>' +
                '<circle cx="' + (x + cardW - 16) + '" cy="' + (y + 56) + '" r="5" fill="' + accent + '" opacity="0.85"/>' +
              '</g>'
            : '') +
    '</g>';
}

// ============================================================
// APP ICON
// ============================================================
function renderAppIcon(x, y, size, color, glyph) {
    const r = size * 0.22;
    return '<g>' +
        '<rect x="' + x + '" y="' + y + '" width="' + size + '" height="' + size + '" rx="' + r + '" fill="' + color + '"/>' +
        '<g transform="translate(' + x + ',' + y + ')" stroke="#ffffff" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.95">' +
            glyph +
        '</g>' +
    '</g>';
}

// Glyphs for common apps
function glyphFor(appId) {
    const t = function (cx, cy) { return 'translate(' + cx + ',' + cy + ')'; };
    const map = {
        app_messenger: '<path d="M3 3h12v9H7l-4 3z" transform="' + t(4, 4) + '"/>',
        app_photos:    '<circle cx="10" cy="10" r="3" transform="' + t(4, 4) + '"/><circle cx="6" cy="6" r="1" transform="' + t(4, 4) + '" fill="#fff"/>',
        app_music:     '<circle cx="7" cy="15" r="2" transform="' + t(5, 3) + '"/><circle cx="15" cy="13" r="2" transform="' + t(5, 3) + '"/><line x1="9" y1="15" x2="9" y2="6" transform="' + t(5, 3) + '"/><line x1="17" y1="13" x2="17" y2="4" transform="' + t(5, 3) + '"/>',
        app_maps:      '<path d="M10 3C6 3 4 6 4 9c0 4 6 9 6 9s6-5 6-9c0-3-2-6-6-6z" transform="' + t(3, 2) + '"/><circle cx="10" cy="9" r="2" transform="' + t(3, 2) + '"/>',
        app_store:     '<path d="M4 4l4-2 8 2v12H4z" transform="' + t(3, 3) + '"/><line x1="8" y1="2" x2="8" y2="16" transform="' + t(3, 3) + '"/>',
        app_wallet:    '<rect x="4" y="6" width="14" height="10" rx="2" transform="' + t(2, 2) + '"/><line x1="4" y1="10" x2="18" y2="10" transform="' + t(2, 2) + '"/>',
        app_health:    '<path d="M11 15l-5-5a3 3 0 1 1 5-4 3 3 0 1 1 5 4z" transform="' + t(1, 2) + '"/>',
        app_arkit:     '<path d="M10 3l7 4v8l-7 4-7-4V7z" transform="' + t(2, 2) + '"/><line x1="3" y1="7" x2="10" y2="11" transform="' + t(2, 2) + '"/><line x1="10" y1="11" x2="17" y2="7" transform="' + t(2, 2) + '"/>',
        app_assistant: '<rect x="4" y="6" width="12" height="10" rx="2" transform="' + t(2, 2) + '"/><circle cx="8" cy="10" r="1" transform="' + t(2, 2) + '" fill="#fff"/><circle cx="12" cy="10" r="1" transform="' + t(2, 2) + '" fill="#fff"/>',
        app_llm:       '<path d="M10 4v12M6 8c-2 0-3 2-3 4s1 4 3 4M14 8c2 0 3 2 3 4s-1 4-3 4" transform="' + t(2, 2) + '"/>',
        // System apps (dari fitur)
        sys_phone:     '<path d="M4 4l3 1 2 4-2 2 4 4 2-2 4 2v3c0 1-1 2-2 2-6 0-11-5-11-11 0-1 1-2 2-2z" transform="' + t(2, 2) + '"/>',
        sys_camera:    '<rect x="3" y="6" width="14" height="10" rx="2" transform="' + t(2, 2) + '"/><circle cx="10" cy="11" r="3" transform="' + t(2, 2) + '"/>',
        sys_calendar:  '<rect x="3" y="4" width="14" height="12" rx="2" transform="' + t(2, 2) + '"/><line x1="3" y1="9" x2="17" y2="9" transform="' + t(2, 2) + '"/>',
        sys_browser:   '<circle cx="10" cy="10" r="7" transform="' + t(2, 2) + '"/><line x1="3" y1="10" x2="17" y2="10" transform="' + t(2, 2) + '"/><path d="M10 3c3 2 3 12 0 14" transform="' + t(2, 2) + '"/>',
        sys_music:     '<circle cx="10" cy="14" r="2" transform="' + t(2, 2) + '"/><line x1="12" y1="14" x2="12" y2="4" transform="' + t(2, 2) + '"/><path d="M12 4l5 1v3l-5-1" transform="' + t(2, 2) + '"/>',
        sys_cloud:     '<path d="M6 14c-2 0-3-2-3-4s1-4 3-4c1-2 3-3 5-3 3 0 5 2 6 4 2 0 3 2 3 4s-1 4-3 4z" transform="' + t(0, 2) + '"/>',
        sys_health:    '<path d="M11 15l-5-5a3 3 0 1 1 5-4 3 3 0 1 1 5 4z" transform="' + t(1, 2) + '"/>',
        sys_folder:    '<path d="M3 6h5l2 2h9v9H3z" transform="' + t(2, 2) + '"/>',
        sys_files:     '<path d="M5 3h7l3 3v11H5z" transform="' + t(2, 2) + '"/><path d="M8 9h6M8 12h6" transform="' + t(2, 2) + '"/>',
        sys_ai:        '<circle cx="10" cy="10" r="6" transform="' + t(2, 2) + '"/><path d="M7 10h6M10 7v6" transform="' + t(2, 2) + '"/>',
        sys_pay:       '<rect x="3" y="6" width="14" height="10" rx="2" transform="' + t(2, 2) + '"/><line x1="3" y1="10" x2="17" y2="10" transform="' + t(2, 2) + '"/>'
    };
    return map[appId] || '<rect x="6" y="6" width="8" height="8" rx="2" transform="' + t(2, 2) + '"/>';
}

// Daftar app yang muncul, berdasarkan fitur + builtin apps.
function collectApps(featureIds, builtinIds) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const apps = [];

    // Builtin apps pemain (dari os.apps.builtin)
    const builtinMeta = {
        app_messenger: { label: 'Pesan',      color: '#2563eb', icon: 'app_messenger' },
        app_photos:    { label: 'Galeri',     color: '#8b5cf6', icon: 'app_photos' },
        app_music:     { label: 'Musik',      color: '#ec4899', icon: 'app_music' },
        app_maps:      { label: 'Peta',       color: '#10b981', icon: 'app_maps' },
        app_store:     { label: 'Toko',       color: '#3b82f6', icon: 'app_store' },
        app_wallet:    { label: 'Dompet',     color: '#111827', icon: 'app_wallet' },
        app_health:    { label: 'Kesehatan',  color: '#ef4444', icon: 'app_health' },
        app_arkit:     { label: 'AR',         color: '#a855f7', icon: 'app_arkit' },
        app_assistant: { label: 'Asisten',    color: '#06b6d4', icon: 'app_assistant' },
        app_llm:       { label: 'AI',         color: '#7c3aed', icon: 'app_llm' }
    };
    builtinIds.forEach(function (id) {
        const meta = builtinMeta[id];
        if (meta) apps.push({ id: id, label: meta.label, color: meta.color, icon: meta.icon });
    });

    // System apps dari fitur OS
    if (has('fw_sms'))               apps.push({ id: 'sys_phone',    label: 'Telepon', color: '#16a34a', icon: 'sys_phone' });
    if (has('fw_camera_app') || has('fw_camera_gallery'))
                                     apps.push({ id: 'sys_camera',   label: 'Kamera',  color: '#475569', icon: 'sys_camera' });
    if (has('fw_calendar'))          apps.push({ id: 'sys_calendar', label: 'Kalender', color: '#dc2626', icon: 'sys_calendar' });
    if (has('fw_browser_mobile') || has('fw_wap_browser'))
                                     apps.push({ id: 'sys_browser',  label: 'Browser', color: '#0284c7', icon: 'sys_browser' });
    if (has('fw_music_streaming'))   apps.push({ id: 'sys_music',    label: 'Streaming', color: '#db2777', icon: 'sys_music' });
    if (has('fw_cloud_sync'))        apps.push({ id: 'sys_cloud',    label: 'Cloud',   color: '#0891b2', icon: 'sys_cloud' });
    if (has('fw_health'))            apps.push({ id: 'sys_health',   label: 'Sehat',   color: '#e11d48', icon: 'sys_health' });
    if (has('fw_files'))             apps.push({ id: 'sys_files',    label: 'File',    color: '#0891b2', icon: 'sys_files' });
    if (has('fw_siri') || has('fw_ai_on_device'))
                                     apps.push({ id: 'sys_ai',       label: 'AI',      color: '#7c3aed', icon: 'sys_ai' });
    if (has('fw_digital_pay'))       apps.push({ id: 'sys_pay',      label: 'Bayar',   color: '#1f2937', icon: 'sys_pay' });
    if (has('fw_folders'))           apps.push({ id: 'sys_folder',   label: 'Folder',  color: '#f59e0b', icon: 'sys_folder' });

    // Dedup by id (kalau builtin sudah ada, skip system)
    const seen = {};
    const out = [];
    apps.forEach(function (a) {
        if (!seen[a.id]) { seen[a.id] = true; out.push(a); }
    });
    return out.slice(0, 16);
}

// ============================================================
// APP GRID
// ============================================================
function renderAppGrid(apps, featureIds, isDark) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const w = 200;
    const gridTop = (has('fw_widgets_basic') || has('fw_home_widgets')) ? 130 : 60;
    const cols = 4;
    const iconSize = 22;
    const gapX = (w - 24 - cols * iconSize) / (cols - 1);
    const gapY = 34;

    let html = '<g>';
    apps.forEach(function (app, i) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = 14 + col * (iconSize + gapX);
        const y = gridTop + row * gapY;
        if (y > 320) return;
        html += renderAppIcon(x, y, iconSize, app.color, glyphFor(app.icon));
        html += '<text x="' + (x + iconSize / 2) + '" y="' + (y + iconSize + 7) + '" text-anchor="middle" font-size="5.5" font-family="sans-serif" fill="#ffffff" opacity="0.85">' + escapeHtml(app.label) + '</text>';
    });
    html += '</g>';
    return html;
}

// ============================================================
// DOCK (era modern+)
// ============================================================
function renderDock(featureIds) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const isModern = has('fw_touch') || has('fw_control_center') || has('fw_gesture_nav');
    if (!isModern) return '';

    return '<g>' +
        '<rect x="14" y="340" width="172" height="42" rx="14" fill="rgba(255,255,255,0.08)"/>' +
        '<g>' +
            renderDockIcon(24, 348, '#16a34a', 'sys_phone') +
            renderDockIcon(62, 348, '#2563eb', 'app_messenger') +
            renderDockIcon(100, 348, '#0284c7', 'sys_browser') +
            renderDockIcon(138, 348, '#475569', 'sys_camera') +
        '</g>' +
    '</g>';
}

function renderDockIcon(x, y, color, iconId) {
    return renderAppIcon(x, y, 26, color, glyphFor(iconId));
}

// ============================================================
// HOME INDICATOR
// ============================================================
function renderHomeIndicator(featureIds) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    if (!has('fw_gesture_nav') && !has('fw_touch')) return '';
    return '<rect x="88" y="392" width="24" height="2" rx="1" fill="#ffffff" opacity="0.6"/>';
}

// ============================================================
// CONTROL CENTER indikator
// ============================================================
function renderControlCenterHint(featureIds, accent) {
    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    if (!has('fw_control_center')) return '';
    return '<rect x="0" y="0" width="200" height="3" fill="' + accent + '" opacity="0.4"/>';
}

// ============================================================
// MAIN
// ============================================================
export function renderOsScreenMockup(opts) {
    opts = opts || {};
    const st = opts.osState ? { os: opts.osState, time: opts.time || { currentYear: 2000 }, research: opts.research || { completed: [] } } : safeGetState();

    const year = (st.time && st.time.currentYear) || 2000;
    const completed = (st.research && st.research.completed) || [];
    const era = getDesignEraForYear(year);
    const spec = resolveSpec(year, completed);

    const osState = st.os || {};
    const featureIds = getCurrentFeatures(osState);
    const builtinIds = (osState.apps && Array.isArray(osState.apps.builtin)) ? osState.apps.builtin : [];

    const has = function (id) { return featureIds.indexOf(id) >= 0; };
    const isDark = has('fw_dark_mode');

    const size = opts.size || 200;
    const w = 200;
    const h = 400;

    const apps = collectApps(featureIds, builtinIds);

    const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + size + '" height="' + Math.round(size * 2) + '" preserveAspectRatio="xMidYMid meet">' +
            renderWallpaper(era.id, isDark, w, h) +
            renderWidget(has('fw_widgets_basic'), has('fw_home_widgets'), w, era.aesthetic.accent, isDark) +
            renderAppGrid(apps, featureIds, isDark) +
            renderDock(featureIds) +
            renderStatusBar(w, isDark, era.aesthetic.accent) +
            renderControlCenterHint(featureIds, era.aesthetic.accent) +
            renderNotch(spec, w) +
            renderHomeIndicator(featureIds) +
        '</svg>';

    return '<div class="os-screen-wrap">' + svg + '</div>';
}

// ============================================================
// THUMBNAIL & API
// ============================================================
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
