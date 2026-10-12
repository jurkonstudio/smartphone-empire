// FILE: src/ui/phone/PhoneMockup.js
// ============================================================
// PhoneMockup — SVG render ponsel dari config desain.
// Deterministik: config sama = mockup sama.
// Mendukung 6 form factor: candybar, slider, flip, fullscreen,
// bezel, fold.
// ============================================================

import { getComponentById, getBodyColorById } from '../../data/components.data.js';

// Warna screen berdasarkan tier display
function screenColor(displayId) {
    const comp = getComponentById(displayId);
    if (!comp) return { bg: '#1a1a1a', glow: '#2a2a2a' };
    const tier = comp.tier || 1;
    if (comp.id === 'scr_mono') return { bg: '#3a3a3a', glow: '#4a4a4a' };
    if (tier <= 2) return { bg: '#1a2530', glow: '#2a3540' };
    if (tier === 3) return { bg: '#0a1520', glow: '#1a2530' };
    if (tier === 4) return { bg: '#050510', glow: '#151525' };
    return { bg: '#000005', glow: '#0a0a15' };
}

// Ukuran camera bump berdasarkan tier
function cameraBumpSize(cameraId) {
    const c = getComponentById(cameraId);
    if (!c) return 0;
    if (!c.requiresResearch) return 0;
    return Math.min(4, c.tier || 1);
}

// Screen inset berdasarkan form factor
function screenInset(formFactorId, tier) {
    if (formFactorId === 'ff_candybar')  return { top: 40, bottom: 40, side: 16 };
    if (formFactorId === 'ff_slider')    return { top: 34, bottom: 60, side: 14 };
    if (formFactorId === 'ff_flip')      return { top: 30, bottom: 30, side: 14 };
    if (formFactorId === 'ff_fullscreen')return { top: 22, bottom: 22, side: 10 };
    if (formFactorId === 'ff_bezel')     return { top: 14, bottom: 14, side: 6 };
    if (formFactorId === 'ff_fold')      return { top: 18, bottom: 18, side: 8 };
    return { top: 30, bottom: 30, side: 12 };
}

// ============================================================
// SVG generator
// ============================================================
export function renderPhoneMockup(config, opts) {
    const size = (opts && opts.size) || 220;
    const width = Math.round(size * 0.55);
    const height = size;

    const formFactor = config && config.formFactorId ? config.formFactorId : 'ff_candybar';
    const bodyId = (config && config.bodyId) || 'body_plastic';
    const bodyColorId = (config && config.bodyColorId) || 'color_black';
    const displayId = (config && config.displayId) || 'scr_mono';
    const cameraId = (config && config.cameraId) || 'cam_vga';

    const bodyColor = getBodyColorById(bodyColorId);
    const bodyHex = bodyColor ? bodyColor.hex : '#1a1a1a';
    const screen = screenColor(displayId);
    const bump = cameraBumpSize(cameraId);
    const inset = screenInset(formFactor, 1);

    // Determine screen-on look
    const isMono = displayId === 'scr_mono';
    const hasHomeButton = formFactor === 'ff_candybar' || formFactor === 'ff_slider';
    const hasFold = formFactor === 'ff_fold';
    const isFlip = formFactor === 'ff_flip';

    // Gradient body shading
    const gradId = 'bodygrad_' + Math.random().toString(36).slice(2, 8);
    const screenGradId = 'scrg_' + Math.random().toString(36).slice(2, 8);

    // Fake UI content di layar
    function screenContent() {
        const x0 = inset.side;
        const y0 = inset.top;
        const w = 100 - inset.side * 2;
        const h = 100 - inset.top - inset.bottom;

        if (isMono) {
            // Pixel grid + teks
            return `
                <g>
                    <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${screen.bg}"/>
                    <line x1="${x0}" y1="${y0 + 4}" x2="${x0 + w}" y2="${y0 + 4}" stroke="#5a5a5a" stroke-width="0.4"/>
                    <line x1="${x0}" y1="${y0 + 10}" x2="${x0 + w}" y2="${y0 + 10}" stroke="#5a5a5a" stroke-width="0.4" stroke-dasharray="1 1"/>
                    <text x="${x0 + w/2}" y="${y0 + h/2 + 1.5}" text-anchor="middle" font-size="5" font-family="monospace" fill="#6a6a6a" letter-spacing="0.3">READY</text>
                </g>
            `;
        }

        // Modern screen: status bar + dynamic island + app grid
        return `
            <g>
                <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="url(#${screenGradId})"/>
                <!-- Status bar -->
                <text x="${x0 + 1.5}" y="${y0 + 3}" font-size="2.2" fill="#7a9ab5" font-family="sans-serif">12:30</text>
                <circle cx="${x0 + w - 6}" cy="${y0 + 2}" r="1" fill="#7a9ab5"/>
                <circle cx="${x0 + w - 3}" cy="${y0 + 2}" r="1" fill="#7a9ab5"/>
                <!-- Dynamic island / notch -->
                ${inset.top >= 20 && !hasHomeButton ? `
                    <rect x="${x0 + w/2 - 4}" y="${y0 + 0.5}" width="8" height="2.4" rx="1.2" fill="#000"/>
                ` : ''}
                <!-- App grid dots -->
                <g fill="#4a6a85" opacity="0.7">
                    <circle cx="${x0 + 3}" cy="${y0 + 14}" r="1.2"/>
                    <circle cx="${x0 + 8}" cy="${y0 + 14}" r="1.2"/>
                    <circle cx="${x0 + 13}" cy="${y0 + 14}" r="1.2"/>
                    <circle cx="${x0 + 18}" cy="${y0 + 14}" r="1.2"/>
                    <circle cx="${x0 + 3}" cy="${y0 + 19}" r="1.2"/>
                    <circle cx="${x0 + 8}" cy="${y0 + 19}" r="1.2"/>
                    <circle cx="${x0 + 13}" cy="${y0 + 19}" r="1.2"/>
                    <circle cx="${x0 + 18}" cy="${y0 + 19}" r="1.2"/>
                </g>
                <!-- Home indicator -->
                <line x1="${x0 + w/2 - 8}" y1="${y0 + h - 2.5}" x2="${x0 + w/2 + 8}" y2="${y0 + h - 2.5}" stroke="#7a9ab5" stroke-width="0.6" stroke-linecap="round" opacity="0.5"/>
            </g>
        `;
    }

    // Bentuk luar body per form factor
    function renderBody() {
        if (formFactor === 'ff_flip') {
            // Dua bagian dengan hinge di tengah
            return `
                <rect x="22" y="8" width="56" height="80" rx="7" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.5" stroke-width="0.4"/>
                <rect x="22" y="94" width="56" height="80" rx="7" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.5" stroke-width="0.4"/>
                <line x1="22" y1="88" x2="78" y2="88" stroke="#000" stroke-opacity="0.35" stroke-width="0.6" stroke-dasharray="2 1"/>
                <rect x="22" y="94" width="56" height="14" rx="2" fill="#000" opacity="0.25"/>
                <text x="50" y="103" text-anchor="middle" font-size="3" fill="#fff" opacity="0.6" font-family="sans-serif" letter-spacing="0.5">COVER</text>
            `;
        }
        if (formFactor === 'ff_slider') {
            return `
                <rect x="22" y="8" width="56" height="140" rx="7" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.5" stroke-width="0.4"/>
                <rect x="22" y="148" width="56" height="40" rx="7" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.5" stroke-width="0.4"/>
                <rect x="26" y="152" width="48" height="32" rx="4" fill="#000" opacity="0.2"/>
                <g fill="#fff" opacity="0.5">
                    <circle cx="34" cy="162" r="1.5"/>
                    <circle cx="42" cy="162" r="1.5"/>
                    <circle cx="50" cy="162" r="1.5"/>
                    <circle cx="58" cy="162" r="1.5"/>
                    <circle cx="34" cy="172" r="1.5"/>
                    <circle cx="42" cy="172" r="1.5"/>
                    <circle cx="50" cy="172" r="1.5"/>
                    <circle cx="58" cy="172" r="1.5"/>
                </g>
            `;
        }
        if (formFactor === 'ff_fold') {
            return `
                <rect x="12" y="8" width="76" height="180" rx="8" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.5" stroke-width="0.4"/>
                <line x1="50" y1="10" x2="50" y2="186" stroke="#000" stroke-opacity="0.35" stroke-width="0.5" stroke-dasharray="1.5 1"/>
            `;
        }
        if (formFactor === 'ff_bezel') {
            return `
                <rect x="18" y="8" width="64" height="180" rx="10" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.5" stroke-width="0.4"/>
                <rect x="18" y="8" width="64" height="12" rx="10" fill="#000" opacity="0.5"/>
            `;
        }
        if (formFactor === 'ff_fullscreen') {
            return `
                <rect x="20" y="8" width="60" height="180" rx="10" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.5" stroke-width="0.4"/>
            `;
        }
        // Candybar (default)
        return `
            <rect x="22" y="8" width="56" height="180" rx="8" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.5" stroke-width="0.4"/>
        `;
    }

    // Camera bump
    function renderCamera() {
        if (bump === 0) return '';
        const size = 4 + bump * 1.8;
        const x = 30;
        const y = 14;
        return `
            <rect x="${x}" y="${y}" width="${size}" height="${size * 0.7}" rx="${size*0.25}" fill="#000" opacity="0.65"/>
            <circle cx="${x + size*0.25}" cy="${y + size*0.35}" r="${size*0.18}" fill="#2a2a2a" stroke="#444" stroke-width="0.3"/>
            <circle cx="${x + size*0.7}" cy="${y + size*0.35}" r="${size*0.16}" fill="#2a2a2a" stroke="#444" stroke-width="0.3" opacity="0.8"/>
        `;
    }

    // Tombol home
    function renderHomeButton() {
        if (!hasHomeButton) return '';
        return `
            <circle cx="50" cy="182" r="6" fill="#000" opacity="0.35"/>
            <circle cx="50" cy="182" r="4.5" fill="#1a1a1a" opacity="0.5"/>
            <rect x="46" y="181" width="8" height="2" rx="1" fill="#666" opacity="0.4"/>
        `;
    }

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200" width="${width}" height="${height}">
            <defs>
                <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${bodyHex}" stop-opacity="1"/>
                    <stop offset="45%" stop-color="${bodyHex}" stop-opacity="0.92"/>
                    <stop offset="100%" stop-color="${shadeHex(bodyHex, -30)}" stop-opacity="1"/>
                </linearGradient>
                <linearGradient id="${screenGradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${screen.bg}"/>
                    <stop offset="100%" stop-color="${screen.glow}"/>
                </linearGradient>
                <filter id="drop_${gradId}" x="-10%" y="-10%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="0.8" stdDeviation="0.8" flood-color="#000" flood-opacity="0.35"/>
                </filter>
            </defs>
            <g filter="url(#drop_${gradId})">
                ${renderBody()}
                ${renderCamera()}
                ${screenContent()}
                ${renderHomeButton()}
            </g>
        </svg>
    `;

    return `<div class="phone-mockup-wrap" style="width:${width}px;height:${height}px;">${svg}</div>`;
}

// Darken / lighten hex color
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

// Versi ringkas — hanya siluet, untuk thumbnail katalog
export function renderPhoneThumbnail(config, size) {
    return renderPhoneMockup(config, { size: size || 60 });
}
