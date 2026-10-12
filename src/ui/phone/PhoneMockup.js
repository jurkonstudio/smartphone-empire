// FILE: src/ui/phone/PhoneMockup.js
// ============================================================
// PhoneMockup — SVG render ponsel era-aware.
// Gaya berubah otomatis sesuai tahun game.
// 7 sub-era: mono, TFT, glossy, flat, premium, AI, foldable.
// ============================================================
import { getComponentById, getBodyColorById } from '../../data/components.data.js';
import { getDesignEraForYear } from '../../data/era-design.data.js';
import { state } from '../../core/GameState.js';

function safeGetYear() {
    try { return state.get().time.currentYear; }
    catch (e) { return 2000; }
}

// Darken / lighten hex
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

// ============================================================
// KONTEN LAYAR per era
// ============================================================
function screenContent(eraId, screenStyle, inset) {
    const x0 = inset.side;
    const y0 = inset.top;
    const w = 100 - inset.side * 2;
    const h = 100 - inset.top - inset.bottom;
    const cx = x0 + w / 2;
    const cy = y0 + h / 2;

    // ---- MONOKROM (2000-2002) ----
    if (screenStyle === 'monochrome') {
        return `
            <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#6a8a4a"/>
            <!-- pixel grid -->
            <g opacity="0.15">
                ${Array.from({length: 20}, (_, i) =>
                    `<line x1="${x0}" y1="${y0 + i*2}" x2="${x0 + w}" y2="${y0 + i*2}" stroke="#000" stroke-width="0.15"/>`
                ).join('')}
            </g>
            <!-- signal bars -->
            <g fill="#2a3a1a">
                <rect x="${x0 + 2}" y="${y0 + 2}" width="1.5" height="4" rx="0.2"/>
                <rect x="${x0 + 4}" y="${y0 + 3}" width="1.5" height="3" rx="0.2"/>
                <rect x="${x0 + 6}" y="${y0 + 4}" width="1.5" height="2" rx="0.2"/>
            </g>
            <text x="${x0 + w - 2}" y="${y0 + 5.5}" text-anchor="end" font-size="2.5" font-family="monospace" fill="#2a3a1a" font-weight="700">▮▮▮</text>
            <!-- main text -->
            <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="3" font-family="monospace" fill="#2a3a1a" font-weight="700" letter-spacing="0.4">READY</text>
            <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="2.2" font-family="monospace" fill="#3a4a2a">Menu</text>
            <!-- softkey bar -->
            <rect x="${x0}" y="${y0 + h - 4}" width="${w}" height="4" fill="#3a4a2a"/>
            <text x="${x0 + 2}" y="${y0 + h - 1}" font-size="1.8" font-family="monospace" fill="#c8d0b8">Menu</text>
            <text x="${x0 + w - 2}" y="${y0 + h - 1}" text-anchor="end" font-size="1.8" font-family="monospace" fill="#c8d0b8">OK</text>
        `;
    }

    // ---- TFT COLOR (2003-2006) ----
    if (screenStyle === 'color_tft') {
        return `
            <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#1a3a5a"/>
            <!-- status bar -->
            <rect x="${x0}" y="${y0}" width="${w}" height="4" fill="#0a1a2a"/>
            <text x="${x0 + 2}" y="${y0 + 3}" font-size="2" font-family="sans-serif" fill="#5aa0d0" font-weight="700">SIGNAL</text>
            <text x="${x0 + w - 2}" y="${y0 + 3}" text-anchor="end" font-size="2" font-family="sans-serif" fill="#5aa0d0">🔋</text>
            <!-- menu grid icons (dotted squares) -->
            <g>
                ${[0,1,2].map(col => [0,1].map(row => {
                    const ix = x0 + 4 + col * 10;
                    const iy = y0 + 10 + row * 14;
                    return `
                        <rect x="${ix}" y="${iy}" width="8" height="10" rx="1" fill="#2a5a8a" opacity="0.7"/>
                        <circle cx="${ix + 4}" cy="${iy + 5}" r="2" fill="#5aa0d0" opacity="0.9"/>
                    `;
                }).join('')).join('')}
            </g>
            <!-- softkey labels -->
            <text x="${x0 + 2}" y="${y0 + h - 2}" font-size="1.8" font-family="sans-serif" fill="#5aa0d0">Options</text>
            <text x="${x0 + w - 2}" y="${y0 + h - 2}" text-anchor="end" font-size="1.8" font-family="sans-serif" fill="#5aa0d0">Back</text>
        `;
    }

    // ---- GLOSSY (2007-2010) ----
    if (screenStyle === 'glossy') {
        return `
            <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#0a1525"/>
            <!-- status bar -->
            <text x="${x0 + 1.5}" y="${y0 + 3}" font-size="1.8" font-family="sans-serif" fill="#7ab5ff" font-weight="600">9:41</text>
            <text x="${x0 + w - 1.5}" y="${y0 + 3}" text-anchor="end" font-size="1.8" font-family="sans-serif" fill="#7ab5ff">▮▮▮</text>
            <!-- app icons glossy -->
            ${[0,1,2,3].map(col => `
                <rect x="${x0 + 3 + col * 8}" y="${y0 + 10}" width="6" height="6" rx="1.5" fill="#2a5a8a" stroke="#5aa0d0" stroke-width="0.2"/>
            `).join('')}
            <!-- soft gloss highlight -->
            <rect x="${x0 + 2}" y="${y0 + 20}" width="${w - 4}" height="8" rx="1.5" fill="#4a8ac0" opacity="0.4"/>
            <text x="${cx}" y="${y0 + 25}" text-anchor="middle" font-size="2" font-family="sans-serif" fill="#e8f0ff" font-weight="600">Slide to unlock</text>
            <!-- home indicator (physical for old iPhone) -->
            <circle cx="${cx}" cy="${y0 + h - 5}" r="2.5" fill="none" stroke="#7ab5ff" stroke-width="0.4"/>
            <rect x="${cx - 1.2}" y="${y0 + h - 6}" width="2.4" height="2" rx="0.5" fill="none" stroke="#7ab5ff" stroke-width="0.4"/>
        `;
    }

    // ---- FLAT (2011-2014) ----
    if (screenStyle === 'flat') {
        return `
            <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#0f1218"/>
            <!-- status bar -->
            <text x="${x0 + 2}" y="${y0 + 3}" font-size="1.8" font-family="sans-serif" fill="#a0a8b3" font-weight="500">10:30</text>
            <g fill="#a0a8b3">
                <rect x="${x0 + w - 12}" y="${y0 + 1.5}" width="2" height="2"/>
                <rect x="${x0 + w - 9}" y="${y0 + 1.5}" width="2" height="2"/>
                <rect x="${x0 + w - 6}" y="${y0 + 1.5}" width="2" height="2"/>
                <rect x="${x0 + w - 3}" y="${y0 + 1.5}" width="2" height="2"/>
            </g>
            <!-- app grid -->
            ${[0,1,2,3].map(col => [0,1].map(row => {
                const ix = x0 + 4 + col * 9;
                const iy = y0 + 9 + row * 11;
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
                const c = colors[(col + row * 4) % colors.length];
                return `<rect x="${ix}" y="${iy}" width="6.5" height="6.5" rx="1.5" fill="${c}" opacity="0.9"/>`;
            }).join('')).join('')}
            <!-- home indicator -->
            <rect x="${cx - 4}" y="${y0 + h - 3}" width="8" height="0.6" rx="0.3" fill="#a0a8b3" opacity="0.6"/>
        `;
    }

    // ---- AMOLED (2015-2018) ----
    if (screenStyle === 'amoled') {
        return `
            <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#000000"/>
            <!-- status bar -->
            <text x="${x0 + 2}" y="${y0 + 3}" font-size="1.8" font-family="-apple-system, sans-serif" fill="#c9a961" font-weight="600">11:11</text>
            <text x="${x0 + w - 2}" y="${y0 + 3}" text-anchor="end" font-size="1.8" font-family="sans-serif" fill="#c9a961">4G ▮▮</text>
            <!-- notification card -->
            <rect x="${x0 + 3}" y="${y0 + 7}" width="${w - 6}" height="6" rx="2" fill="#1a1a1a" stroke="#c9a961" stroke-width="0.15" opacity="0.8"/>
            <circle cx="${x0 + 6}" cy="${y0 + 10}" r="1.2" fill="#c9a961"/>
            <line x1="${x0 + 9}" y1="${y0 + 9}" x2="${x0 + w - 6}" y2="${y0 + 9}" stroke="#c9a961" stroke-width="0.3" opacity="0.5"/>
            <line x1="${x0 + 9}" y1="${y0 + 11}" x2="${x0 + w - 10}" y2="${y0 + 11}" stroke="#c9a961" stroke-width="0.3" opacity="0.3"/>
            <!-- big clock -->
            <text x="${cx}" y="${cy + 3}" text-anchor="middle" font-size="10" font-family="-apple-system, sans-serif" fill="#f0ede8" font-weight="200" letter-spacing="-0.5">11:11</text>
            <text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="2" font-family="sans-serif" fill="#c9a961" letter-spacing="0.6">DESIGN STUDIO</text>
            <!-- home indicator -->
            <rect x="${cx - 4}" y="${y0 + h - 3}" width="8" height="0.6" rx="0.3" fill="#c9a961" opacity="0.5"/>
        `;
    }

    // ---- HDR / AI era (2019-2022) ----
    if (screenStyle === 'hdr') {
        const islandW = 6;
        const islandX = cx - islandW / 2;
        return `
            <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#080c14"/>
            <!-- status bar -->
            <text x="${x0 + 2}" y="${y0 + 3}" font-size="1.8" font-family="-apple-system, sans-serif" fill="#00d4ff" font-weight="600">12:30</text>
            <text x="${x0 + w - 2}" y="${y0 + 3}" text-anchor="end" font-size="1.8" font-family="sans-serif" fill="#00d4ff">5G ▮▮</text>
            <!-- dynamic island -->
            <rect x="${islandX}" y="${y0 + 1}" width="${islandW}" height="3.5" rx="1.75" fill="#000"/>
            <circle cx="${islandX + islandW - 1.5}" cy="${y0 + 2.75}" r="0.6" fill="#1a1a1a"/>
            <!-- content gradient mesh -->
            <defs>
                <radialGradient id="hdrMesh" cx="30%" cy="40%">
                    <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="#080c14" stop-opacity="0"/>
                </radialGradient>
            </defs>
            <rect x="${x0}" y="${y0 + 6}" width="${w}" height="${h - 6}" fill="url(#hdrMesh)"/>
            <!-- card -->
            <rect x="${x0 + 3}" y="${cy - 8}" width="${w - 6}" height="14" rx="3" fill="#0f1420" stroke="#00d4ff" stroke-width="0.15" opacity="0.8"/>
            <text x="${cx}" y="${cy - 3}" text-anchor="middle" font-size="2.2" font-family="sans-serif" fill="#ffffff" font-weight="600">New Design</text>
            <line x1="${x0 + 6}" y1="${cy + 1}" x2="${x0 + w - 6}" y2="${cy + 1}" stroke="#00d4ff" stroke-width="0.2" opacity="0.5"/>
            <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="1.8" font-family="sans-serif" fill="#00d4ff" opacity="0.7">AI assisted</text>
            <!-- home indicator -->
            <rect x="${cx - 4}" y="${y0 + h - 3}" width="8" height="0.6" rx="0.3" fill="#ffffff" opacity="0.5"/>
        `;
    }

    // ---- FLEXIBLE (2023+) ----
    if (screenStyle === 'flexible') {
        return `
            <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#04040a"/>
            <defs>
                <linearGradient id="auroraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#a855f7" stop-opacity="0.5"/>
                    <stop offset="50%" stop-color="#06b6d4" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#ec4899" stop-opacity="0.4"/>
                </linearGradient>
                <filter id="auroraBlur">
                    <feGaussianBlur stdDeviation="2"/>
                </filter>
            </defs>
            <ellipse cx="${cx}" cy="${cy}" rx="${w*0.5}" ry="${h*0.35}" fill="url(#auroraGrad)" filter="url(#auroraBlur)" opacity="0.6"/>
            <!-- status -->
            <text x="${x0 + 2}" y="${y0 + 3}" font-size="1.8" font-family="-apple-system, sans-serif" fill="#ffffff" font-weight="600">12:30</text>
            <text x="${x0 + w - 2}" y="${y0 + 3}" text-anchor="end" font-size="1.8" font-family="sans-serif" fill="#a855f7">6G ▮▮</text>
            <!-- circular clock -->
            <text x="${cx}" y="${cy + 2}" text-anchor="middle" font-size="11" font-family="-apple-system, sans-serif" fill="#ffffff" font-weight="200" letter-spacing="-0.5">2025</text>
            <text x="${cx}" y="${cy + 7}" text-anchor="middle" font-size="1.8" font-family="sans-serif" fill="#a855f7" letter-spacing="0.8" font-weight="600">FUTURE DESIGN</text>
            <!-- home indicator -->
            <rect x="${cx - 4}" y="${y0 + h - 3}" width="8" height="0.6" rx="0.3" fill="#a855f7" opacity="0.6"/>
        `;
    }

    // Fallback flat
    return `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#1a1a1a"/>`;
}

// ============================================================
// SCREEN BACKGROUND per era
// ============================================================
function screenBackground(screenStyle) {
    if (screenStyle === 'monochrome') return '#6a8a4a';
    if (screenStyle === 'color_tft')  return '#1a3a5a';
    if (screenStyle === 'glossy')     return '#0a1525';
    if (screenStyle === 'flat')       return '#0f1218';
    if (screenStyle === 'amoled')     return '#000000';
    if (screenStyle === 'hdr')        return '#080c14';
    if (screenStyle === 'flexible')   return '#04040a';
    return '#1a1a1a';
}

// ============================================================
// BENTUK BODY per form factor
// ============================================================
function renderBody(formFactor, gradId, era) {
    const isRetro = era.id === 'era_lcd_mono' || era.id === 'era_tft_color';
    const cornerR = isRetro ? 5 : 8;
    const hasAntenna = era.id === 'era_lcd_mono';

    if (formFactor === 'ff_flip') {
        return `
            <rect x="22" y="8" width="56" height="80" rx="${cornerR}" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.5" stroke-width="0.4"/>
            <rect x="22" y="94" width="56" height="80" rx="${cornerR}" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.5" stroke-width="0.4"/>
            <line x1="22" y1="88" x2="78" y2="88" stroke="#000" stroke-opacity="0.4" stroke-width="0.6" stroke-dasharray="2 1"/>
            <rect x="22" y="94" width="56" height="14" rx="2" fill="#000" opacity="0.25"/>
        `;
    }
    if (formFactor === 'ff_slider') {
        return `
            <rect x="22" y="8" width="56" height="140" rx="${cornerR}" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.5" stroke-width="0.4"/>
            <rect x="22" y="148" width="56" height="40" rx="${cornerR}" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.5" stroke-width="0.4"/>
            <rect x="26" y="152" width="48" height="32" rx="4" fill="#000" opacity="0.2"/>
            <g fill="#fff" opacity="0.5">
                ${[0,1,2,3].map(col => [0,1,2].map(row =>
                    `<circle cx="${30 + col * 8}" cy="${156 + row * 8}" r="1.4"/>`
                ).join('')).join('')}
            </g>
        `;
    }
    if (formFactor === 'ff_fold' || formFactor === 'ff_foldable') {
        return `
            <rect x="12" y="8" width="76" height="180" rx="${cornerR + 2}" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.5" stroke-width="0.4"/>
            <line x1="50" y1="10" x2="50" y2="186" stroke="#000" stroke-opacity="0.35" stroke-width="0.5" stroke-dasharray="1.5 1"/>
        `;
    }
    if (formFactor === 'ff_bezel') {
        return `
            <rect x="18" y="8" width="64" height="180" rx="${cornerR + 2}" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.5" stroke-width="0.4"/>
            <rect x="18" y="8" width="64" height="12" rx="${cornerR + 2}" fill="#000" opacity="0.5"/>
        `;
    }
    if (formFactor === 'ff_touchscreen') {
        return `
            <rect x="20" y="8" width="60" height="180" rx="${cornerR}" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.5" stroke-width="0.4"/>
            <circle cx="50" cy="182" r="4.5" fill="#000" opacity="0.35"/>
        `;
    }
    if (formFactor === 'ff_fullscreen') {
        return `
            <rect x="20" y="8" width="60" height="180" rx="${cornerR + 2}" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.5" stroke-width="0.4"/>
        `;
    }
    // Candybar (default)
    return `
        <rect x="22" y="8" width="56" height="180" rx="${cornerR}" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.5" stroke-width="0.4"/>
        ${hasAntenna ? `<rect x="60" y="0" width="2" height="12" rx="1" fill="#2a2a2a"/>` : ''}
    `;
}

// ============================================================
// CAMERA BUMP — hanya era modern+
// ============================================================
function renderCamera(cameraId, era) {
    if (era.id === 'era_lcd_mono') return ''; // belum ada kamera

    const comp = getComponentById(cameraId);
    if (!comp || !comp.requiresResearch) return '';

    const tier = Math.min(5, comp.tier || 1);
    const isModern = ['era_premium', 'era_ai_era', 'era_foldable'].includes(era.id);

    if (isModern) {
        // Bump square (iPhone-style)
        const size = 8 + tier * 1.5;
        const x = 30, y = 14;
        const lensR = size * 0.16;
        return `
            <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.22}" fill="#0a0a0a" opacity="0.9"/>
            <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.22}" fill="none" stroke="#2a2a2a" stroke-width="0.2"/>
            <circle cx="${x + size * 0.3}" cy="${y + size * 0.3}" r="${lensR}" fill="#1a1a1a" stroke="#3a3a3a" stroke-width="0.3"/>
            <circle cx="${x + size * 0.3}" cy="${y + size * 0.3}" r="${lensR * 0.4}" fill="#2a4a6a" opacity="0.6"/>
            <circle cx="${x + size * 0.7}" cy="${y + size * 0.3}" r="${lensR}" fill="#1a1a1a" stroke="#3a3a3a" stroke-width="0.3"/>
            <circle cx="${x + size * 0.7}" cy="${y + size * 0.3}" r="${lensR * 0.4}" fill="#2a4a6a" opacity="0.6"/>
            <circle cx="${x + size * 0.5}" cy="${y + size * 0.7}" r="${lensR * 0.6}" fill="#1a1a1a" stroke="#3a3a3a" stroke-width="0.3"/>
        `;
    }
    // Era awal — bump bulat kecil
    const size = 3 + tier * 1.2;
    return `
        <rect x="28" y="14" width="${size}" height="${size * 0.75}" rx="${size*0.25}" fill="#000" opacity="0.65"/>
        <circle cx="${28 + size*0.4}" cy="${14 + size*0.35}" r="${size*0.2}" fill="#2a2a2a" stroke="#444" stroke-width="0.3"/>
    `;
}

// ============================================================
// HOME BUTTON (era lama saja)
// ============================================================
function renderHomeButton(formFactor, era) {
    if (era.id === 'era_foldable' || era.id === 'era_ai_era') return '';
    if (formFactor === 'ff_fullscreen' || formFactor === 'ff_bezel') return '';
    if (formFactor === 'ff_fold' || formFactor === 'ff_foldable') return '';
    return `
        <circle cx="50" cy="182" r="5" fill="#000" opacity="0.3"/>
        <circle cx="50" cy="182" r="3.5" fill="#1a1a1a" opacity="0.5"/>
    `;
}

// ============================================================
// MAIN
// ============================================================
export function renderPhoneMockup(config, opts) {
    const size = (opts && opts.size) || 220;
    const width = Math.round(size * 0.55);
    const height = size;

    // Ambil era dari state (fallback: era dari opts)
    const year = (opts && opts.year) || safeGetYear();
    const era = getDesignEraForYear(year);

    const formFactor = (config && config.formFactorId) || 'ff_candybar';
    const bodyId = (config && config.bodyId) || 'body_plastic';
    const bodyColorId = (config && config.bodyColorId) || 'color_black';
    const displayId = (config && config.displayId) || 'scr_mono';
    const cameraId = (config && config.cameraId) || 'cam_vga';

    const bodyColor = getBodyColorById(bodyColorId);
    const bodyHex = bodyColor ? bodyColor.hex : '#1a1a1a';

    // Screen inset berdasarkan form factor
    const insetMap = {
        'ff_candybar':    { top: 40, bottom: 40, side: 16 },
        'ff_slider':      { top: 34, bottom: 60, side: 14 },
        'ff_flip':        { top: 30, bottom: 30, side: 14 },
        'ff_fullscreen':  { top: 20, bottom: 20, side: 10 },
        'ff_bezel':       { top: 14, bottom: 14, side: 6 },
        'ff_touchscreen': { top: 22, bottom: 30, side: 10 },
        'ff_fold':        { top: 18, bottom: 18, side: 8 },
        'ff_foldable':    { top: 18, bottom: 18, side: 8 }
    };
    const inset = insetMap[formFactor] || { top: 30, bottom: 30, side: 12 };

    const gradId = 'bodygrad_' + Math.random().toString(36).slice(2, 8);

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200" width="${width}" height="${height}">
            <defs>
                <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${bodyHex}" stop-opacity="1"/>
                    <stop offset="45%" stop-color="${bodyHex}" stop-opacity="0.9"/>
                    <stop offset="100%" stop-color="${shadeHex(bodyHex, -35)}" stop-opacity="1"/>
                </linearGradient>
                <filter id="drop_${gradId}" x="-15%" y="-10%" width="130%" height="125%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="${era.aesthetic.accent}" flood-opacity="0.35"/>
                </filter>
            </defs>
            <g filter="url(#drop_${gradId})">
                ${renderBody(formFactor, gradId, era)}
                ${renderCamera(cameraId, era)}
                ${screenContent(era.id, era.screenStyle, inset)}
                ${renderHomeButton(formFactor, era)}
            </g>
        </svg>
    `;

    return `<div class="phone-mockup-wrap phone-era-${era.id}" style="width:${width}px;height:${height}px;">${svg}</div>`;
}

export function renderPhoneThumbnail(config, size) {
    return renderPhoneMockup(config, { size: size || 60 });
}

export function getMockupEra() {
    return getDesignEraForYear(safeGetYear());
        }
