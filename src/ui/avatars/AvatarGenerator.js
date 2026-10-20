import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/avatars/AvatarGenerator.js
// v2027.7a — Modern 2026 avatar: geometric + initials.
// Gaya Slack/Linear/Notion. Deterministik dari nama.
// ============================================================

function hashString(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) + h) + str.charCodeAt(i);
    }
    return Math.abs(h);
}

function getInitials(name) {
    if (!name) return '??';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '??';
    if (parts.length === 1) return escapeHtml(parts[0].slice(0, 2).toUpperCase());
    return escapeHtml((parts[0][0] + parts[parts.length - 1][0]).toUpperCase());
}

const AVATAR_PALETTES = [
    { bg: '#6366f1', accent: '#c7d2fe', text: '#ffffff' },  // indigo
    { bg: '#10b981', accent: '#a7f3d0', text: '#ffffff' },  // emerald
    { bg: '#f59e0b', accent: '#fde68a', text: '#ffffff' },  // amber
    { bg: '#f43f5e', accent: '#fecdd3', text: '#ffffff' },  // rose
    { bg: '#8b5cf6', accent: '#ddd6fe', text: '#ffffff' },  // violet
    { bg: '#06b6d4', accent: '#a5f3fc', text: '#ffffff' },  // cyan
    { bg: '#14b8a6', accent: '#99f6e4', text: '#ffffff' },  // teal
    { bg: '#0ea5e9', accent: '#bae6fd', text: '#ffffff' },  // sky
    { bg: '#d946ef', accent: '#f5d0fe', text: '#ffffff' },  // fuchsia
    { bg: '#84cc16', accent: '#d9f99d', text: '#ffffff' }   // lime
];

// ============================================================
// AVATAR utama — geometric + initials
// ============================================================
export function generateAvatar(name, opts) {
    const size = (opts && opts.size) || 40;
    const seed = hashString(String(name || 'anonymous'));
    const palette = AVATAR_PALETTES[seed % AVATAR_PALETTES.length];
    const variant = (seed >> 4) % 4;
    const initials = getInitials(name);

    let accentSvg = '';
    if (variant === 0) {
        // Circle top-right (partially cut off)
        accentSvg = `<circle cx="85" cy="15" r="28" fill="${palette.accent}" opacity="0.55"/>`;
    } else if (variant === 1) {
        // Triangle bottom-left
        accentSvg = `<polygon points="0,100 50,55 0,55" fill="${palette.accent}" opacity="0.55"/>`;
    } else if (variant === 2) {
        // Double small circle
        accentSvg = `
            <circle cx="82" cy="18" r="18" fill="${palette.accent}" opacity="0.6"/>
            <circle cx="18" cy="84" r="12" fill="${palette.accent}" opacity="0.4"/>
        `;
    } else {
        // Diagonal split
        accentSvg = `<polygon points="100,0 100,100 0,100" fill="${palette.accent}" opacity="0.35"/>`;
    }

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
            <defs>
                <clipPath id="avclip${seed}">
                    <rect width="100" height="100" rx="22"/>
                </clipPath>
            </defs>
            <g clip-path="url(#avclip${seed})">
                <rect width="100" height="100" fill="${palette.bg}"/>
                ${accentSvg}
                <text x="50" y="67" text-anchor="middle"
                      font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
                      font-size="36" font-weight="800" fill="${palette.text}"
                      letter-spacing="-1.5">${initials}</text>
            </g>
        </svg>
    `;

    return `<div class="avatar-wrap" style="width:${size}px;height:${size}px;">${svg}</div>`;
}

// ============================================================
// COMPANY LOGO
// ============================================================
const LOGO_PATTERNS = [
    (initials) => `<text x="50" y="66" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="44" font-weight="800" fill="#fff" letter-spacing="-2">${initials}</text>`,
    (initials) => `
        <circle cx="50" cy="50" r="28" fill="none" stroke="#fff" stroke-width="3"/>
        <text x="50" y="62" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="30" font-weight="800" fill="#fff">${initials}</text>`,
    (initials) => `
        <polygon points="50,20 75,35 75,65 50,80 25,65 25,35" fill="none" stroke="#fff" stroke-width="3"/>
        <text x="50" y="62" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="26" font-weight="800" fill="#fff">${initials}</text>`,
    (initials) => `
        <rect x="30" y="30" width="40" height="40" transform="rotate(45 50 50)" fill="none" stroke="#fff" stroke-width="3"/>
        <text x="50" y="62" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="26" font-weight="800" fill="#fff">${initials}</text>`
];

export function generateLogo(name, opts) {
    const size = (opts && opts.size) || 64;
    const seed = hashString(String(name || 'empire'));
    const pattern = LOGO_PATTERNS[seed % LOGO_PATTERNS.length];
    const initials = String(name || 'E')
        .split(/\s+/)
        .map(w => w[0] || '')
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'E';

    const gradId = 'lg' + seed;
    const gradPairs = [
        ['var(--accent)', 'var(--accent-hover)'],
        ['#2563eb', '#7c3aed'],
        ['#06b6d4', '#10b981'],
        ['#f59e0b', '#ef4444'],
        ['#8b5cf6', '#ec4899']
    ];
    const pair = gradPairs[seed % gradPairs.length];

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
            <defs>
                <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${pair[0]}"/>
                    <stop offset="100%" stop-color="${pair[1]}"/>
                </linearGradient>
            </defs>
            <rect width="100" height="100" rx="22" fill="url(#${gradId})"/>
            ${pattern(initials)}
        </svg>
    `;

    return `<div class="logo-wrap" style="width:${size}px;height:${size}px;">${svg}</div>`;
}
