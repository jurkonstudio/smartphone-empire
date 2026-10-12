// FILE: src/ui/illustrations/Illustrations.js
// ============================================================
// Ilustrasi SVG flat-minimalis untuk empty state.
// Semua memakai CSS variable agar ikut tema.
// Ukuran default: 160x160, scalable via width/height.
// ============================================================

const BASE = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" stroke-linecap="round" stroke-linejoin="round"';

// Helper: pilih warna accent dari CSS var
const C = {
    accent: 'var(--accent)',
    accentSoft: 'var(--accent-soft)',
    bg1: 'var(--bg-3)',
    bg2: 'var(--bg-4)',
    border: 'var(--border-strong)',
    text: 'var(--text-secondary)',
    textDim: 'var(--text-tertiary)'
};

// ============================================================
// 1. PRODUK — Kotak terbuka dengan sparkle
// ============================================================
function illustrationBox() {
    return `
        <svg ${BASE}>
            <circle cx="100" cy="100" r="82" fill="${C.accentSoft}"/>
            <ellipse cx="100" cy="160" rx="52" ry="6" fill="${C.textDim}" opacity="0.15"/>
            <!-- Box -->
            <path d="M60 105 L100 125 L140 105 L140 145 L100 165 L60 145 Z" fill="${C.bg2}" stroke="${C.border}" stroke-width="2"/>
            <path d="M60 105 L100 85 L140 105 L100 125 Z" fill="${C.bg3}" stroke="${C.border}" stroke-width="2"/>
            <path d="M100 125 L100 165" stroke="${C.border}" stroke-width="2"/>
            <path d="M100 85 L100 65" stroke="${C.border}" stroke-width="2" opacity="0.4" stroke-dasharray="3 3"/>
            <!-- Sparkles -->
            <g stroke="${C.accent}" stroke-width="2">
                <path d="M100 50 L100 42 M100 88 L100 80" opacity="0"/>
                <path d="M60 55 L55 50 M55 60 L50 55" />
                <path d="M145 45 L150 40 M150 50 L155 45"/>
                <path d="M155 80 L160 75 M160 85 L165 80"/>
            </g>
            <circle cx="100" cy="42" r="3" fill="${C.accent}"/>
        </svg>
    `;
}

// ============================================================
// 2. RISET — Labu erlenmeyer dengan gelembung
// ============================================================
function illustrationFlask() {
    return `
        <svg ${BASE}>
            <circle cx="100" cy="100" r="82" fill="${C.accentSoft}"/>
            <ellipse cx="100" cy="160" rx="52" ry="6" fill="${C.textDim}" opacity="0.15"/>
            <!-- Flask -->
            <path d="M85 55 L85 80 L60 130 Q55 145 70 148 L130 148 Q145 145 140 130 L115 80 L115 55"
                  fill="${C.bg2}" stroke="${C.border}" stroke-width="2"/>
            <line x1="80" y1="55" x2="120" y2="55" stroke="${C.border}" stroke-width="3"/>
            <!-- Liquid -->
            <path d="M70 122 L130 122 Q140 145 130 148 L70 148 Q60 145 70 122 Z"
                  fill="${C.accent}" opacity="0.45"/>
            <path d="M70 122 L130 122" stroke="${C.accent}" stroke-width="2"/>
            <!-- Bubbles -->
            <circle cx="88" cy="112" r="3" fill="${C.accent}"/>
            <circle cx="100" cy="105" r="4" fill="${C.accent}"/>
            <circle cx="112" cy="115" r="2.5" fill="${C.accent}"/>
            <circle cx="105" cy="95" r="2" fill="${C.accent}" opacity="0.7"/>
        </svg>
    `;
}

// ============================================================
// 3. PASAR — Grafik naik dengan trend line
// ============================================================
function illustrationChart() {
    return `
        <svg ${BASE}>
            <circle cx="100" cy="100" r="82" fill="${C.accentSoft}"/>
            <!-- Grid -->
            <g stroke="${C.border}" stroke-width="1" opacity="0.3">
                <line x1="45" y1="60" x2="45" y2="150"/>
                <line x1="45" y1="150" x2="160" y2="150"/>
                <line x1="45" y1="120" x2="160" y2="120" stroke-dasharray="2 4"/>
                <line x1="45" y1="90" x2="160" y2="90" stroke-dasharray="2 4"/>
                <line x1="45" y1="60" x2="160" y2="60" stroke-dasharray="2 4"/>
            </g>
            <!-- Trend line -->
            <path d="M50 135 L75 115 L100 120 L125 90 L155 65"
                  stroke="${C.accent}" stroke-width="3" fill="none"/>
            <!-- Dots -->
            <g fill="${C.bg1}" stroke="${C.accent}" stroke-width="2">
                <circle cx="50" cy="135" r="4"/>
                <circle cx="75" cy="115" r="4"/>
                <circle cx="100" cy="120" r="4"/>
                <circle cx="125" cy="90" r="4"/>
                <circle cx="155" cy="65" r="5"/>
            </g>
            <!-- Arrow head -->
            <path d="M148 68 L156 64 L152 72" stroke="${C.accent}" stroke-width="2.5" fill="${C.accent}"/>
        </svg>
    `;
}

// ============================================================
// 4. TIM — Dua siluet dengan speech bubble
// ============================================================
function illustrationTeam() {
    return `
        <svg ${BASE}>
            <circle cx="100" cy="100" r="82" fill="${C.accentSoft}"/>
            <ellipse cx="100" cy="160" rx="52" ry="6" fill="${C.textDim}" opacity="0.15"/>
            <!-- Person 1 -->
            <circle cx="75" cy="95" r="14" fill="${C.bg3}" stroke="${C.border}" stroke-width="2"/>
            <path d="M55 148 Q55 122 75 122 Q95 122 95 148" fill="${C.bg3}" stroke="${C.border}" stroke-width="2"/>
            <!-- Person 2 -->
            <circle cx="128" cy="90" r="16" fill="${C.accentSoft}" stroke="${C.accent}" stroke-width="2"/>
            <path d="M104 148 Q104 118 128 118 Q152 118 152 148" fill="${C.accentSoft}" stroke="${C.accent}" stroke-width="2"/>
            <!-- Speech bubble -->
            <path d="M130 55 Q130 45 140 45 L172 45 Q182 45 182 55 L182 67 Q182 77 172 77 L158 77 L150 85 L150 77 L140 77 Q130 77 130 67 Z"
                  fill="${C.bg2}" stroke="${C.border}" stroke-width="2"/>
            <circle cx="148" cy="61" r="1.5" fill="${C.text}"/>
            <circle cx="156" cy="61" r="1.5" fill="${C.text}"/>
            <circle cx="164" cy="61" r="1.5" fill="${C.text}"/>
        </svg>
    `;
}

// ============================================================
// 5. ULASAN — Dua speech bubble
// ============================================================
function illustrationChat() {
    return `
        <svg ${BASE}>
            <circle cx="100" cy="100" r="82" fill="${C.accentSoft}"/>
            <!-- Bubble 1 (kiri) -->
            <path d="M50 70 Q50 58 62 58 L118 58 Q130 58 130 70 L130 95 Q130 107 118 107 L82 107 L70 120 L70 107 L62 107 Q50 107 50 95 Z"
                  fill="${C.bg2}" stroke="${C.border}" stroke-width="2"/>
            <g stroke="${C.text}" stroke-width="2" opacity="0.5">
                <line x1="65" y1="75" x2="115" y2="75"/>
                <line x1="65" y1="85" x2="105" y2="85"/>
                <line x1="65" y1="95" x2="90" y2="95"/>
            </g>
            <!-- Bubble 2 (kanan, kecil) -->
            <path d="M100 115 Q100 105 110 105 L160 105 Q170 105 170 115 L170 132 Q170 142 160 142 L142 142 L136 150 L136 142 L110 142 Q100 142 100 132 Z"
                  fill="${C.accentSoft}" stroke="${C.accent}" stroke-width="2"/>
            <g stroke="${C.accent}" stroke-width="2" opacity="0.7">
                <line x1="112" y1="118" x2="158" y2="118"/>
                <line x1="112" y1="128" x2="140" y2="128"/>
            </g>
        </svg>
    `;
}

// ============================================================
// 6. GENERIK — Rocket / Startup (fallback)
// ============================================================
function illustrationRocket() {
    return `
        <svg ${BASE}>
            <circle cx="100" cy="100" r="82" fill="${C.accentSoft}"/>
            <!-- Trail -->
            <path d="M100 160 L100 180" stroke="${C.accent}" stroke-width="3" opacity="0.5"/>
            <path d="M88 155 L82 170" stroke="${C.accent}" stroke-width="2" opacity="0.4"/>
            <path d="M112 155 L118 170" stroke="${C.accent}" stroke-width="2" opacity="0.4"/>
            <!-- Rocket body -->
            <path d="M100 45 Q120 80 120 120 L80 120 Q80 80 100 45 Z"
                  fill="${C.bg2}" stroke="${C.border}" stroke-width="2"/>
            <!-- Window -->
            <circle cx="100" cy="90" r="9" fill="${C.accentSoft}" stroke="${C.accent}" stroke-width="2"/>
            <circle cx="100" cy="90" r="4" fill="${C.accent}"/>
            <!-- Fins -->
            <path d="M80 118 L68 132 L80 128 Z" fill="${C.bg3}" stroke="${C.border}" stroke-width="2"/>
            <path d="M120 118 L132 132 L120 128 Z" fill="${C.bg3}" stroke="${C.border}" stroke-width="2"/>
            <!-- Flame -->
            <path d="M92 122 Q100 138 108 122 Z" fill="${C.accent}" opacity="0.7"/>
            <!-- Stars -->
            <circle cx="50" cy="60" r="2" fill="${C.accent}"/>
            <circle cx="155" cy="70" r="2" fill="${C.accent}"/>
            <circle cx="60" cy="100" r="1.5" fill="${C.accent}" opacity="0.6"/>
            <circle cx="145" cy="105" r="1.5" fill="${C.accent}" opacity="0.6"/>
        </svg>
    `;
}

// ============================================================
// 7. SEDIH — Untuk game over / gagal
// ============================================================
function illustrationSad() {
    return `
        <svg ${BASE}>
            <circle cx="100" cy="100" r="82" fill="var(--danger-soft)"/>
            <!-- Broken chart -->
            <path d="M55 130 L80 110" stroke="${C.text}" stroke-width="3" opacity="0.5"/>
            <path d="M85 105 L95 115" stroke="${C.text}" stroke-width="3" opacity="0.5"/>
            <path d="M105 110 L130 90" stroke="${C.text}" stroke-width="3" opacity="0.5"/>
            <path d="M135 85 L150 95" stroke="${C.text}" stroke-width="3" opacity="0.5"/>
            <!-- Crack -->
            <path d="M95 90 L100 100 L92 108" stroke="var(--danger)" stroke-width="2" fill="none"/>
            <!-- Sad face -->
            <circle cx="100" cy="65" r="20" fill="${C.bg2}" stroke="${C.border}" stroke-width="2"/>
            <circle cx="92" cy="62" r="2" fill="${C.text}"/>
            <circle cx="108" cy="62" r="2" fill="${C.text}"/>
            <path d="M90 75 Q100 68 110 75" stroke="${C.text}" stroke-width="2" fill="none"/>
        </svg>
    `;
}

// ============================================================
// EXPORTS
// ============================================================
const ILLUSTRATIONS = {
    box:     illustrationBox,
    flask:   illustrationFlask,
    chart:   illustrationChart,
    team:    illustrationTeam,
    chat:    illustrationChat,
    rocket:  illustrationRocket,
    sad:     illustrationSad
};

export function getIllustration(name, size) {
    const fn = ILLUSTRATIONS[name] || ILLUSTRATIONS.rocket;
    const w = size || 140;
    const svg = fn();
    return `<div class="illus-wrap" style="width:${w}px;height:${w}px;">${svg}</div>`;
}

export function getIllustrationNames() {
    return Object.keys(ILLUSTRATIONS);
}
