// FILE: src/ui/avatars/AvatarGenerator.js
// ============================================================
// Avatar prosedural — SVG wajah unik dari nama staff.
// Deterministik: nama yang sama selalu menghasilkan avatar sama.
// Kombinasi: 8 hairstyle × 6 skin × 6 hair color × 4 accessory = 1152.
// ============================================================

function hashString(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) + h) + str.charCodeAt(i);
    }
    return Math.abs(h);
}

const SKIN_TONES = [
    '#f4d5b8', '#eec29b', '#d9a375', '#b57a52', '#8a5940', '#5c3a29'
];
const HAIR_COLORS = [
    '#1a1a1a', '#3a2a1a', '#6b4423', '#a0682b', '#d4a054', '#e8c78a'
];
const HAIRSTYLES = [
    // 0: Botak (naik tipis)
    () => '',
    // 1: Pendek rapi
    () => `<path d="M28 38 Q28 18 50 18 Q72 18 72 38 L72 42 Q72 30 50 30 Q28 30 28 42 Z" fill="HAIR"/>`,
    // 2: Cepak
    () => `<path d="M30 42 Q30 22 50 22 Q70 22 70 42 L70 44 Q70 34 50 34 Q30 34 30 44 Z" fill="HAIR"/>
           <path d="M28 40 L30 32 Q50 24 70 32 L72 40" stroke="HAIR" fill="HAIR"/>`,
    // 3: Ikal pendek
    () => `<g fill="HAIR">
        <circle cx="30" cy="36" r="8"/>
        <circle cx="38" cy="28" r="9"/>
        <circle cx="50" cy="24" r="9"/>
        <circle cx="62" cy="28" r="9"/>
        <circle cx="70" cy="36" r="8"/>
    </g>`,
    // 4: Rambut samping (bob)
    () => `<path d="M24 55 Q24 20 50 20 Q76 20 76 55 L76 60 Q72 45 70 40 Q60 30 50 30 Q40 30 30 40 Q28 45 24 60 Z" fill="HAIR"/>`,
    // 5: Rambut panjang
    () => `<path d="M20 70 Q20 18 50 18 Q80 18 80 70 L80 78 Q74 55 70 50 Q60 38 50 38 Q40 38 30 50 Q26 55 20 78 Z" fill="HAIR"/>`,
    // 6: Undercut
    () => `<path d="M30 36 Q30 18 50 18 Q70 18 70 36 L70 38 Q70 28 50 28 Q30 28 30 38 Z" fill="HAIR"/>
           <path d="M25 45 L30 38 L30 42 L25 48 Z" fill="HAIR"/>
           <path d="M75 45 L70 38 L70 42 L75 48 Z" fill="HAIR"/>`,
    // 7: Spiky
    () => `<g fill="HAIR">
        <path d="M28 38 L32 24 L36 32 L42 20 L46 30 L52 18 L56 30 L62 22 L66 32 L72 24 L72 38 Z"/>
    </g>`
];

const ACCESSORIES = [
    // 0: Tidak ada
    () => '',
    // 1: Kacamata
    () => `<g fill="none" stroke="#1a1a1a" stroke-width="2">
        <circle cx="40" cy="55" r="7"/>
        <circle cx="60" cy="55" r="7"/>
        <line x1="47" y1="55" x2="53" y2="55"/>
        <line x1="33" y1="55" x2="26" y2="52"/>
        <line x1="67" y1="55" x2="74" y2="52"/>
    </g>`,
    // 2: Janggut tipis
    () => `<path d="M38 72 Q50 82 62 72 Q60 78 50 80 Q40 78 38 72 Z" fill="#3a2a1a" opacity="0.85"/>`,
    // 3: Kumis
    () => `<path d="M40 68 Q46 65 50 68 Q54 65 60 68" stroke="#3a2a1a" stroke-width="2.5" fill="none"/>`
];

// Ekspresi mata (selalu sama) + variasi posisi
function eyesVariant(seed) {
    const v = seed % 4;
    if (v === 0) {
        return `
            <circle cx="42" cy="55" r="2.5" fill="#1a1a1a"/>
            <circle cx="58" cy="55" r="2.5" fill="#1a1a1a"/>
        `;
    }
    if (v === 1) {
        return `
            <ellipse cx="42" cy="55" rx="2" ry="3" fill="#1a1a1a"/>
            <ellipse cx="58" cy="55" rx="2" ry="3" fill="#1a1a1a"/>
        `;
    }
    if (v === 2) {
        return `
            <path d="M39 55 Q42 52 45 55" stroke="#1a1a1a" stroke-width="2" fill="none"/>
            <path d="M55 55 Q58 52 61 55" stroke="#1a1a1a" stroke-width="2" fill="none"/>
        `;
    }
    return `
        <circle cx="42" cy="55" r="3" fill="#1a1a1a"/>
        <circle cx="58" cy="55" r="3" fill="#1a1a1a"/>
        <circle cx="42.8" cy="54" r="1" fill="#fff"/>
        <circle cx="58.8" cy="54" r="1" fill="#fff"/>
    `;
}

function mouthVariant(seed) {
    const v = seed % 3;
    if (v === 0) return `<path d="M44 70 Q50 74 56 70" stroke="#1a1a1a" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    if (v === 1) return `<path d="M45 71 L55 71" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>`;
    return `<path d="M45 70 Q50 76 55 70" stroke="#1a1a1a" stroke-width="2" fill="none" stroke-linecap="round"/>`;
}

function blushVariant(seed) {
    if ((seed % 5) !== 0) return '';
    return `
        <circle cx="36" cy="65" r="4" fill="#f4a8a8" opacity="0.5"/>
        <circle cx="64" cy="65" r="4" fill="#f4a8a8" opacity="0.5"/>
    `;
}

// ============================================================
// Avatar utama
// ============================================================
export function generateAvatar(name, opts) {
    const size = (opts && opts.size) || 40;
    const bgColor = (opts && opts.bg) || 'var(--bg-3)';
    const seed = hashString(String(name || 'anonymous'));

    const skin = SKIN_TONES[seed % SKIN_TONES.length];
    const hair = HAIR_COLORS[(seed >> 3) % HAIR_COLORS.length];
    const hairStyle = HAIRSTYLES[(seed >> 6) % HAIRSTYLES.length];
    const accessory = ACCESSORIES[(seed >> 9) % ACCESSORIES.length];

    const hairSvg = hairStyle().replace(/HAIR/g, hair);
    const accessorySvg = accessory();
    const eyesSvg = eyesVariant((seed >> 12) % 4);
    const mouthSvg = mouthVariant((seed >> 14) % 3);
    const blushSvg = blushVariant((seed >> 16) % 5);

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
            <defs>
                <clipPath id="avclip${seed}">
                    <circle cx="50" cy="50" r="50"/>
                </clipPath>
            </defs>
            <g clip-path="url(#avclip${seed})">
                <rect width="100" height="100" fill="${bgColor}"/>
                <circle cx="50" cy="52" r="26" fill="${skin}"/>
                ${hairSvg}
                ${eyesSvg}
                ${mouthSvg}
                ${blushSvg}
                ${accessorySvg}
            </g>
        </svg>
    `;

    return `<div class="avatar-wrap" style="width:${size}px;height:${size}px;">${svg}</div>`;
}

// ============================================================
// Company logo generator
// ============================================================
const LOGO_PATTERNS = [
    // 0: Initial besar
    (initials) => `<text x="50" y="66" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="44" font-weight="800" fill="#fff" letter-spacing="-2">${initials}</text>`,
    // 1: Lingkaran + initial
    (initials) => `
        <circle cx="50" cy="50" r="28" fill="none" stroke="#fff" stroke-width="3"/>
        <text x="50" y="62" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="30" font-weight="800" fill="#fff">${initials}</text>`,
    // 2: Hexagon
    (initials) => `
        <polygon points="50,20 75,35 75,65 50,80 25,65 25,35" fill="none" stroke="#fff" stroke-width="3"/>
        <text x="50" y="62" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="26" font-weight="800" fill="#fff">${initials}</text>`,
    // 3: Diamond
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

    // Gradient variant
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
