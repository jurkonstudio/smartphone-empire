// FILE: src/ui/phone/PhoneMockup.js
// ============================================================
// PhoneMockup — SVG render ponsel era-aware + spec-layer V2.2b.
// Setiap detail visual (bezel, notch, kamera, tombol) gated
// oleh spec milestone (tahun) + research completed (override).
// ============================================================
import { getComponentById, getBodyColorById } from '../../data/components.data.js';
import { getDesignEraForYear } from '../../data/era-design.data.js';
import { state } from '../../core/GameState.js';
import { resolveSpec } from '../../data/phone-specs.data.js';

function safeGetState() {
    try { return state.get(); }
    catch (e) { return { time: { currentYear: 2000 }, research: { completed: [] }, companyName: '' }; }
}

function safeGetYear() {
    try { return state.get().time.currentYear; }
    catch (e) { return 2000; }
}

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
// BODY RECT per form factor
// ============================================================
function getBodyRect(formFactor) {
    if (formFactor === 'ff_fold' || formFactor === 'ff_foldable') {
        return { x: 12, y: 8, w: 76, h: 180 };
    }
    if (formFactor === 'ff_slider') {
        return { x: 22, y: 8, w: 56, h: 152 };
    }
    if (formFactor === 'ff_flip') {
        return { x: 22, y: 8, w: 56, h: 86 };
    }
    return { x: 22, y: 8, w: 56, h: 180 };
}

// ============================================================
// SCREEN RECT — spec insets diinterpretasikan sebagai % dari body
// ============================================================
function getScreenRect(spec, formFactor) {
    const body = getBodyRect(formFactor);
    const s = spec.screen || { insetTop: 20, insetBottom: 20, insetSide: 8, cornerRadius: 8 };
    const insetTop = (s.insetTop / 100) * body.h;
    const insetBottom = (s.insetBottom / 100) * body.h;
    const insetSide = (s.insetSide / 100) * body.w;
    return {
        x: body.x + insetSide,
        y: body.y + insetTop,
        w: body.w - insetSide * 2,
        h: body.h - insetTop - insetBottom,
        cornerRadius: s.cornerRadius || 6
    };
}

// ============================================================
// SCREEN CONTENT (era-based style, now using explicit rect)
// ============================================================
function screenContent(screenStyle, rect) {
    const x0 = rect.x, y0 = rect.y, w = rect.w, h = rect.h;
    const cx = x0 + w / 2;
    const cy = y0 + h / 2;

    if (screenStyle === 'monochrome') {
        const lines = Math.max(6, Math.floor(h / 3));
        return `
            <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#6a8a4a"/>
            <g opacity="0.15">
                ${Array.from({length: lines}, (_, i) =>
                    `<line x1="${x0}" y1="${y0 + i*(h/lines)}" x2="${x0 + w}" y2="${y0 + i*(h/lines)}" stroke="#000" stroke-width="0.15"/>`
                ).join('')}
            </g>
            <g fill="#2a3a1a">
                <rect x="${x0 + 1.5}" y="${y0 + 1.5}" width="1.5" height="3.5" rx="0.2"/>
                <rect x="${x0 + 3.5}" y="${y0 + 2.5}" width="1.5" height="2.5" rx="0.2"/>
                <rect x="${x0 + 5.5}" y="${y0 + 3.5}" width="1.5" height="1.5" rx="0.2"/>
            </g>
            <text x="${x0 + w - 2}" y="${y0 + 4.5}" text-anchor="end" font-size="2.2" font-family="monospace" fill="#2a3a1a" font-weight="700">▮▮▮</text>
            <text x="${cx}" y="${cy - 1}" text-anchor="middle" font-size="2.8" font-family="monospace" fill="#2a3a1a" font-weight="700" letter-spacing="0.3">READY</text>
            <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="2" font-family="monospace" fill="#3a4a2a">Menu</text>
            <rect x="${x0}" y="${y0 + h - 4}" width="${w}" height="4" fill="#3a4a2a"/>
            <text x="${x0 + 2}" y="${y0 + h - 1}" font-size="1.7" font-family="monospace" fill="#c8d0b8">Menu</text>
            <text x="${x0 + w - 2}" y="${y0 + h - 1}" text-anchor="end" font-size="1.7" font-family="monospace" fill="#c8d0b8">OK</text>
        `;
    }

    if (screenStyle === 'color_tft') {
        const gx = 4, gy = 8;
        const cols = 3, rows = Math.max(2, Math.floor((h - 12) / 12));
        return `
            <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#1a3a5a"/>
            <rect x="${x0}" y="${y0}" width="${w}" height="4" fill="#0a1a2a"/>
            <text x="${x0 + 2}" y="${y0 + 2.8}" font-size="1.8" font-family="sans-serif" fill="#5aa0d0" font-weight="700">SIGNAL</text>
            <text x="${x0 + w - 2}" y="${y0 + 2.8}" text-anchor="end" font-size="1.8" font-family="sans-serif" fill="#5aa0d0">🔋</text>
            <g>
                ${Array.from({length: cols}, (_, col) => Array.from({length: rows}, (_, row) => {
                    const ix = x0 + gx + col * ((w - gx*2) / cols);
                    const iy = y0 + gy + row * ((h - gy - 6) / rows);
                    const iw = (w - gx*2) / cols - 2;
                    const ih = (h - gy - 6) / rows - 2;
                    return `
                        <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="1" fill="#2a5a8a" opacity="0.7"/>
                        <circle cx="${ix + iw/2}" cy="${iy + ih/2}" r="${Math.min(iw, ih)*0.2}" fill="#5aa0d0" opacity="0.9"/>
                    `;
                }).join('')).join('')}
            </g>
            <text x="${x0 + 2}" y="${y0 + h - 1.5}" font-size="1.6" font-family="sans-serif" fill="#5aa0d0">Options</text>
            <text x="${x0 + w - 2}" y="${y0 + h - 1.5}" text-anchor="end" font-size="1.6" font-family="sans-serif" fill="#5aa0d0">Back</text>
        `;
    }

    if (screenStyle === 'glossy') {
        return `
            <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#0a1525"/>
            <text x="${x0 + 1.5}" y="${y0 + 3}" font-size="1.6" font-family="sans-serif" fill="#7ab5ff" font-weight="600">9:41</text>
            <text x="${x0 + w - 1.5}" y="${y0 + 3}" text-anchor="end" font-size="1.6" font-family="sans-serif" fill="#7ab5ff">▮▮▮</text>
            ${Array.from({length: 4}, (_, col) => `
                <rect x="${x0 + 3 + col * ((w-6)/4)}" y="${y0 + 8}" width="${(w-6)/4 - 2}" height="${(w-6)/4 - 2}" rx="1.5" fill="#2a5a8a" stroke="#5aa0d0" stroke-width="0.2"/>
            `).join('')}
            <rect x="${x0 + 2}" y="${y0 + h - 12}" width="${w - 4}" height="8" rx="1.5" fill="#4a8ac0" opacity="0.4"/>
            <text x="${cx}" y="${y0 + h - 7}" text-anchor="middle" font-size="1.8" font-family="sans-serif" fill="#e8f0ff" font-weight="600">Slide to unlock</text>
            <circle cx="${cx}" cy="${y0 + h - 3}" r="2" fill="none" stroke="#7ab5ff" stroke-width="0.3"/>
        `;
    }

    if (screenStyle === 'flat') {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
        const cols = 4, rows = 2;
        return `
            <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#0f1218"/>
            <text x="${x0 + 2}" y="${y0 + 3}" font-size="1.6" font-family="sans-serif" fill="#a0a8b3" font-weight="500">10:30</text>
            <g fill="#a0a8b3">
                ${Array.from({length:4}, (_, i) => `<rect x="${x0 + w - 11 + i*2.5}" y="${y0 + 1.5}" width="1.8" height="1.8"/>`).join('')}
            </g>
            ${Array.from({length: cols * rows}, (_, i) => {
                const col = i % cols, row = Math.floor(i / cols);
                const ix = x0 + 3 + col * ((w-6)/cols);
                const iy = y0 + 8 + row * ((h-14)/rows);
                const size = Math.min((w-6)/cols, (h-14)/rows) - 2;
                return `<rect x="${ix}" y="${iy}" width="${size}" height="${size}" rx="1.5" fill="${colors[i % colors.length]}" opacity="0.9"/>`;
            }).join('')}
            <rect x="${cx - 4}" y="${y0 + h - 2.5}" width="8" height="0.5" rx="0.25" fill="#a0a8b3" opacity="0.6"/>
        `;
    }

    if (screenStyle === 'amoled') {
        return `
            <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#000000"/>
            <text x="${x0 + 2}" y="${y0 + 3}" font-size="1.6" font-family="sans-serif" fill="#c9a961" font-weight="600">11:11</text>
            <text x="${x0 + w - 2}" y="${y0 + 3}" text-anchor="end" font-size="1.6" font-family="sans-serif" fill="#c9a961">4G ▮▮</text>
            <rect x="${x0 + 3}" y="${y0 + 6}" width="${w - 6}" height="5" rx="2" fill="#1a1a1a" stroke="#c9a961" stroke-width="0.15" opacity="0.8"/>
            <text x="${cx}" y="${cy + 3}" text-anchor="middle" font-size="9" font-family="sans-serif" fill="#f0ede8" font-weight="200" letter-spacing="-0.4">11:11</text>
            <text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="1.7" font-family="sans-serif" fill="#c9a961" letter-spacing="0.5">DESIGN STUDIO</text>
            <rect x="${cx - 4}" y="${y0 + h - 2.5}" width="8" height="0.5" rx="0.25" fill="#c9a961" opacity="0.5"/>
        `;
    }

    if (screenStyle === 'hdr') {
        const gradId = 'hdrMesh_' + Math.random().toString(36).slice(2, 6);
        return `
            <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#080c14"/>
            <text x="${x0 + 2}" y="${y0 + 3}" font-size="1.6" font-family="sans-serif" fill="#00d4ff" font-weight="600">12:30</text>
            <text x="${x0 + w - 2}" y="${y0 + 3}" text-anchor="end" font-size="1.6" font-family="sans-serif" fill="#00d4ff">5G ▮▮</text>
            <defs>
                <radialGradient id="${gradId}" cx="30%" cy="40%">
                    <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="#080c14" stop-opacity="0"/>
                </radialGradient>
            </defs>
            <rect x="${x0}" y="${y0 + 5}" width="${w}" height="${h - 5}" fill="url(#${gradId})"/>
            <rect x="${x0 + 3}" y="${cy - 7}" width="${w - 6}" height="12" rx="3" fill="#0f1420" stroke="#00d4ff" stroke-width="0.15" opacity="0.8"/>
            <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="2" font-family="sans-serif" fill="#ffffff" font-weight="600">New Design</text>
            <text x="${cx}" y="${cy + 3}" text-anchor="middle" font-size="1.6" font-family="sans-serif" fill="#00d4ff" opacity="0.7">AI assisted</text>
            <rect x="${cx - 4}" y="${y0 + h - 2.5}" width="8" height="0.5" rx="0.25" fill="#ffffff" opacity="0.5"/>
        `;
    }

    if (screenStyle === 'flexible') {
        const gradId = 'auroraGrad_' + Math.random().toString(36).slice(2, 6);
        const blurId = 'auroraBlur_' + Math.random().toString(36).slice(2, 6);
        return `
            <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#04040a"/>
            <defs>
                <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#a855f7" stop-opacity="0.5"/>
                    <stop offset="50%" stop-color="#06b6d4" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#ec4899" stop-opacity="0.4"/>
                </linearGradient>
                <filter id="${blurId}">
                    <feGaussianBlur stdDeviation="2"/>
                </filter>
            </defs>
            <ellipse cx="${cx}" cy="${cy}" rx="${w*0.5}" ry="${h*0.35}" fill="url(#${gradId})" filter="url(#${blurId})" opacity="0.6"/>
            <text x="${x0 + 2}" y="${y0 + 3}" font-size="1.6" font-family="sans-serif" fill="#ffffff" font-weight="600">12:30</text>
            <text x="${x0 + w - 2}" y="${y0 + 3}" text-anchor="end" font-size="1.6" font-family="sans-serif" fill="#a855f7">6G ▮▮</text>
            <text x="${cx}" y="${cy + 2}" text-anchor="middle" font-size="10" font-family="sans-serif" fill="#ffffff" font-weight="200" letter-spacing="-0.4">2025</text>
            <text x="${cx}" y="${cy + 7}" text-anchor="middle" font-size="1.6" font-family="sans-serif" fill="#a855f7" letter-spacing="0.6" font-weight="600">FUTURE DESIGN</text>
            <rect x="${cx - 4}" y="${y0 + h - 2.5}" width="8" height="0.5" rx="0.25" fill="#a855f7" opacity="0.6"/>
        `;
    }

    return `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#1a1a1a"/>`;
}

// ============================================================
// LAYER: BODY FRAME
// ============================================================
function renderBodyLayer(formFactor, gradId, bodyHex) {
    const body = getBodyRect(formFactor);
    const edgeLight = shadeHex(bodyHex, 25);
    const edgeDark = shadeHex(bodyHex, -45);
    const isFold = formFactor === 'ff_fold' || formFactor === 'ff_foldable';

    let extra = '';
    if (formFactor === 'ff_flip') {
        const hingeY = body.y + body.h;
        extra = `<rect x="${body.x}" y="${hingeY}" width="${body.w}" height="86" rx="5" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.5" stroke-width="0.4"/>
            <line x1="${body.x}" y1="${hingeY}" x2="${body.x + body.w}" y2="${hingeY}" stroke="#000" stroke-opacity="0.4" stroke-width="0.5"/>`;
    } else if (formFactor === 'ff_slider') {
        const lowerY = body.y + body.h;
        extra = `<rect x="${body.x}" y="${lowerY}" width="${body.w}" height="30" rx="5" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.5" stroke-width="0.4"/>
            <g fill="#fff" opacity="0.4">
                ${Array.from({length: 4}, (_, col) => Array.from({length: 2}, (_, row) =>
                    `<circle cx="${body.x + 8 + col * 10}" cy="${lowerY + 8 + row * 10}" r="1.3"/>`
                ).join('')).join('')}
            </g>`;
    }

    return `
        <rect x="${body.x}" y="${body.y}" width="${body.w}" height="${body.h}" rx="${isFold ? 10 : 6}" fill="url(#${gradId})" stroke="#000" stroke-opacity="0.45" stroke-width="0.4"/>
        <rect x="${body.x + 0.5}" y="${body.y + 0.5}" width="${body.w - 1}" height="${body.h - 1}" rx="${isFold ? 10 : 6}" fill="none" stroke="${edgeLight}" stroke-opacity="0.35" stroke-width="0.3"/>
        <rect x="${body.x}" y="${body.y + body.h - 0.8}" width="${body.w}" height="0.8" rx="0.4" fill="${edgeDark}" opacity="0.6"/>
        ${extra}
        ${isFold ? `<line x1="${body.x + body.w/2}" y1="${body.y + 4}" x2="${body.x + body.w/2}" y2="${body.y + body.h - 4}" stroke="#000" stroke-opacity="0.3" stroke-width="0.4" stroke-dasharray="1.5 1"/>` : ''}
    `;
}

// ============================================================
// LAYER: SIDE BUTTONS
// ============================================================
function renderSideButtons(spec, formFactor) {
    const body = getBodyRect(formFactor);
    if (formFactor === 'ff_flip' || formFactor === 'ff_slider') return '';

    const isModern = spec.bezel === 'thin' || spec.bezel === 'minimal' || spec.bezel === 'none';
    const powerY = isModern ? body.y + body.h * 0.30 : body.y + 10;
    const volY = body.y + body.h * 0.30;
    const btnW = 1.2;
    const btnH = 6;

    let out = '';
    // Power (kanan)
    if (isModern) {
        out += `<rect x="${body.x + body.w + 0.3}" y="${powerY}" width="${btnW}" height="${btnH}" rx="0.4" fill="${shadeHex('#888', -20)}"/>`;
    } else {
        // Legacy: tombol atas
        out += `<rect x="${body.x + body.w * 0.3}" y="${body.y - 0.5}" width="${btnH}" height="${btnW}" rx="0.4" fill="${shadeHex('#888', -20)}"/>`;
    }
    // Volume (kiri)
    if (isModern) {
        out += `<rect x="${body.x - 1.5}" y="${volY}" width="${btnW}" height="${btnH}" rx="0.4" fill="${shadeHex('#888', -20)}"/>
            <rect x="${body.x - 1.5}" y="${volY + btnH + 2}" width="${btnW}" height="${btnH}" rx="0.4" fill="${shadeHex('#888', -20)}"/>`;
    }
    return out;
}

// ============================================================
// LAYER: CAMERA ARRAY
// ============================================================
function renderCameraLayer(spec, cameraId, formFactor) {
    const body = getBodyRect(formFactor);
    const cams = spec.cameras || { rear: 0, layout: 'none', position: 'none', bump: 'none' };
    if (!cams.rear || cams.rear < 1) return '';

    const bumpType = cams.bump;
    const baseX = body.x + 6;
    const baseY = body.y + 6;

    if (bumpType === 'square' || bumpType === 'square_lg' || bumpType === 'square_xl') {
        const size = bumpType === 'square_xl' ? 16 : bumpType === 'square_lg' ? 13 : 11;
        const lensR = size * 0.16;
        const positions = cams.rear === 1 ? [[0.5, 0.5]] :
                          cams.rear === 2 ? [[0.3, 0.3], [0.7, 0.3]] :
                          cams.rear === 3 ? [[0.3, 0.3], [0.7, 0.3], [0.5, 0.72]] :
                                            [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]];
        return `
            <rect x="${baseX}" y="${baseY}" width="${size}" height="${size}" rx="${size * 0.22}" fill="#0a0a0a"/>
            <rect x="${baseX}" y="${baseY}" width="${size}" height="${size}" rx="${size * 0.22}" fill="none" stroke="#2a2a2a" stroke-width="0.2"/>
            ${positions.map(([px, py]) => `
                <circle cx="${baseX + size * px}" cy="${baseY + size * py}" r="${lensR}" fill="#1a1a1a" stroke="#3a3a3a" stroke-width="0.3"/>
                <circle cx="${baseX + size * px}" cy="${baseY + size * py}" r="${lensR * 0.45}" fill="#2a4a6a" opacity="0.65"/>
            `).join('')}
        `;
    }
    if (bumpType === 'band') {
        const w = 20, h = 6;
        return `
            <rect x="${baseX}" y="${baseY}" width="${w}" height="${h}" rx="2" fill="#0a0a0a" opacity="0.9"/>
            ${Array.from({length: cams.rear}, (_, i) => `
                <circle cx="${baseX + 3 + i * 6}" cy="${baseY + h/2}" r="1.6" fill="#1a1a1a" stroke="#3a3a3a" stroke-width="0.3"/>
                <circle cx="${baseX + 3 + i * 6}" cy="${baseY + h/2}" r="0.7" fill="#2a4a6a" opacity="0.65"/>
            `).join('')}
        `;
    }
    // Flush / slight: lingkaran kecil
    const size = cams.bump === 'slight' ? 4.5 : 3.5;
    return `
        <rect x="${baseX}" y="${baseY}" width="${size}" height="${size * 0.75}" rx="${size*0.25}" fill="#000" opacity="0.7"/>
        <circle cx="${baseX + size*0.4}" cy="${baseY + size*0.35}" r="${size*0.22}" fill="#2a2a2a" stroke="#444" stroke-width="0.3"/>
        ${cams.flash ? `<circle cx="${baseX + size*0.75}" cy="${baseY + size*0.55}" r="${size*0.15}" fill="#ffe9b0" opacity="0.6"/>` : ''}
    `;
}

// ============================================================
// LAYER: NOTCH / PUNCH-HOLE / DYNAMIC ISLAND
// ============================================================
function renderNotchLayer(spec, screenRect) {
    const notch = spec.notch || 'none';
    if (notch === 'none') return '';
    const cx = screenRect.x + screenRect.w / 2;
    const top = screenRect.y;

    if (notch === 'notch') {
        const w = screenRect.w * 0.42;
        return `
            <rect x="${cx - w/2}" y="${top}" width="${w}" height="3.2" rx="0 0 2 2" fill="#000"/>
            <rect x="${cx + w/2 - 1.6}" y="${top + 1.6}" width="1" height="1" rx="0.5" fill="#1a1a1a"/>
        `;
    }
    if (notch === 'teardrop') {
        return `
            <path d="M ${cx - 3} ${top} Q ${cx - 3} ${top + 3} ${cx} ${top + 3} Q ${cx + 3} ${top + 3} ${cx + 3} ${top} Z" fill="#000"/>
        `;
    }
    if (notch === 'punch_hole_center') {
        return `<circle cx="${cx}" cy="${top + 1.8}" r="1.3" fill="#000" stroke="#1a1a1a" stroke-width="0.2"/>`;
    }
    if (notch === 'punch_hole_left') {
        return `<circle cx="${screenRect.x + 3}" cy="${top + 1.8}" r="1.2" fill="#000" stroke="#1a1a1a" stroke-width="0.2"/>`;
    }
    if (notch === 'dynamic_island') {
        const w = 6.5, h = 2.4;
        return `
            <rect x="${cx - w/2}" y="${top + 1}" width="${w}" height="${h}" rx="${h/2}" fill="#000"/>
            <circle cx="${cx + w/2 - 1}" cy="${top + 1 + h/2}" r="0.5" fill="#1a1a1a"/>
        `;
    }
    // under_display: tidak ada notch, screen full
    return '';
}

// ============================================================
// LAYER: SPEAKER (earpiece / bottom)
// ============================================================
function renderSpeakerLayer(spec, formFactor) {
    const body = getBodyRect(formFactor);
    if (spec.speaker === 'stereo') {
        return `
            <rect x="${body.x + body.w*0.35}" y="${body.y + 1.5}" width="${body.w*0.30}" height="0.6" rx="0.3" fill="#1a1a1a" opacity="0.6"/>
            <rect x="${body.x + body.w*0.35}" y="${body.y + body.h - 2.1}" width="${body.w*0.30}" height="0.6" rx="0.3" fill="#1a1a1a" opacity="0.6"/>
        `;
    }
    if (spec.speaker === 'earpiece') {
        return `<rect x="${body.x + body.w*0.38}" y="${body.y + 2}" width="${body.w*0.24}" height="0.5" rx="0.25" fill="#1a1a1a" opacity="0.55"/>`;
    }
    return '';
}

// ============================================================
// LAYER: PORTS
// ============================================================
function renderPortsLayer(spec, formFactor) {
    const body = getBodyRect(formFactor);
    let out = '';
    const ports = spec.ports || [];
    if (ports.indexOf('audio_jack_bottom') >= 0) {
        out += `<circle cx="${body.x + body.w*0.18}" cy="${body.y + body.h - 1.2}" r="0.9" fill="#000" stroke="#333" stroke-width="0.15"/>`;
    }
    if (ports.indexOf('audio_jack_top') >= 0) {
        out += `<circle cx="${body.x + body.w*0.18}" cy="${body.y + 1.2}" r="0.9" fill="#000" stroke="#333" stroke-width="0.15"/>`;
    }
    if (ports.indexOf('charging_usb_c') >= 0) {
        out += `<rect x="${body.x + body.w*0.42}" y="${body.y + body.h - 1.4}" width="${body.w*0.16}" height="0.8" rx="0.4" fill="#000"/>`;
    } else if (ports.indexOf('charging_micro_usb') >= 0) {
        out += `<rect x="${body.x + body.w*0.42}" y="${body.y + body.h - 1.2}" width="${body.w*0.16}" height="0.6" rx="0.2" fill="#000"/>`;
    } else if (ports.indexOf('charging_dock') >= 0) {
        out += `<rect x="${body.x + body.w*0.3}" y="${body.y + body.h - 1.4}" width="${body.w*0.4}" height="0.7" rx="0.3" fill="#000"/>`;
    } else if (ports.indexOf('charging_barrel') >= 0) {
        out += `<circle cx="${body.x + body.w*0.5}" cy="${body.y + body.h - 1.2}" r="0.9" fill="#000" stroke="#333" stroke-width="0.15"/>`;
    }
    return out;
}

// ============================================================
// LAYER: REFLECTION (kaca)
// ============================================================
function renderReflectionLayer(screenRect) {
    const x0 = screenRect.x, y0 = screenRect.y;
    const w = screenRect.w, h = screenRect.h;
    const gradId = 'refl_' + Math.random().toString(36).slice(2, 6);
    return `
        <defs>
            <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.14"/>
                <stop offset="35%" stop-color="#ffffff" stop-opacity="0.02"/>
                <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
            </linearGradient>
        </defs>
        <rect x="${x0}" y="${y0}" width="${w}" height="${h * 0.55}" fill="url(#${gradId})" pointer-events="none"/>
    `;
}

// ============================================================
// LAYER: HOME BUTTON / GESTURE BAR
// ============================================================
function renderHomeLayer(spec, screenRect, formFactor) {
    if (formFactor === 'ff_fold' || formFactor === 'ff_foldable') {
        return '';
    }
    const body = getBodyRect(formFactor);
    const hb = spec.homeButton;

    if (hb === 'circle' || hb === 'fingerprint') {
        const cy = body.y + body.h - 12;
        const cx = body.x + body.w / 2;
        return `
            <circle cx="${cx}" cy="${cy}" r="4.5" fill="none" stroke="#222" stroke-opacity="0.6" stroke-width="0.35"/>
            <circle cx="${cx}" cy="${cy}" r="3" fill="none" stroke="#222" stroke-opacity="0.4" stroke-width="0.3"/>
        `;
    }
    if (hb === 'touch_bar') {
        const cy = body.y + body.h - 10;
        const cx = body.x + body.w / 2;
        return `<rect x="${cx - 4}" y="${cy - 1}" width="8" height="2" rx="1" fill="none" stroke="#222" stroke-opacity="0.5" stroke-width="0.3"/>`;
    }
    if (hb === 'gesture_bar') {
        const cy = body.y + body.h - 4;
        const cx = body.x + body.w / 2;
        return `<rect x="${cx - 5}" y="${cy}" width="10" height="0.6" rx="0.3" fill="#ffffff" opacity="0.55"/>`;
    }
    if (hb === 'row') {
        // Candybar: tiga tombol fisik di bawah layar
        const cy = body.y + body.h - 22;
        const cx = body.x + body.w / 2;
        return `
            <rect x="${cx - 8}" y="${cy - 2}" width="6" height="3" rx="0.6" fill="#1a1a1a" opacity="0.7"/>
            <rect x="${cx - 1.5}" y="${cy - 2}" width="3" height="3" rx="0.6" fill="#1a1a1a" opacity="0.7"/>
            <rect x="${cx + 2}" y="${cy - 2}" width="6" height="3" rx="0.6" fill="#1a1a1a" opacity="0.7"/>
        `;
    }
    return '';
}

// ============================================================
// MAIN RENDER
// ============================================================
export function renderPhoneMockup(config, opts) {
    const size = (opts && opts.size) || 220;
    const width = Math.round(size * 0.55);
    const height = size;

    const st = safeGetState();
    const year = (opts && opts.year) || st.time.currentYear || 2000;
    const completed = (st.research && st.research.completed) || [];
    const companyName = (st.companyName || '').trim();

    const era = getDesignEraForYear(year);
    const spec = resolveSpec(year, completed);

    const formFactor = (config && config.formFactorId) || 'ff_candybar';
    const bodyColorId = (config && config.bodyColorId) || 'color_black';
    const cameraId = (config && config.cameraId) || 'cam_vga';

    const bodyColor = getBodyColorById(bodyColorId);
    const bodyHex = bodyColor ? bodyColor.hex : '#1a1a1a';

    const screenRect = getScreenRect(spec, formFactor);
    const gradId = 'bodygrad_' + Math.random().toString(36).slice(2, 8);

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200" width="${width}" height="${height}">
            <defs>
                <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${shadeHex(bodyHex, 15)}"/>
                    <stop offset="45%" stop-color="${bodyHex}"/>
                    <stop offset="100%" stop-color="${shadeHex(bodyHex, -35)}"/>
                </linearGradient>
            </defs>

            ${renderBodyLayer(formFactor, gradId, bodyHex)}
            ${renderSideButtons(spec, formFactor)}
            ${renderCameraLayer(spec, cameraId, formFactor)}
            ${renderSpeakerLayer(spec, formFactor)}
            ${renderPortsLayer(spec, formFactor)}

            <rect x="${screenRect.x}" y="${screenRect.y}" width="${screenRect.w}" height="${screenRect.h}" rx="${screenRect.cornerRadius}" fill="#050505"/>
            <g clip-path="url(#screenclip_${gradId})">
                <clipPath id="screenclip_${gradId}">
                    <rect x="${screenRect.x}" y="${screenRect.y}" width="${screenRect.w}" height="${screenRect.h}" rx="${screenRect.cornerRadius}"/>
                </clipPath>
                ${screenContent(era.screenStyle, screenRect)}
            </g>
            ${renderReflectionLayer(screenRect)}
            ${renderNotchLayer(spec, screenRect)}
            ${renderHomeLayer(spec, screenRect, formFactor)}
        </svg>
    `;

    const brandHtml = (opts && opts.showBrand === false) ? '' :
        (companyName ? `<div class="phone-brand">${escapeHtml(companyName)}</div>` : '');

    return `<div class="phone-mockup-wrap phone-era-${era.id} phone-spec-${spec.id}" style="width:${width}px;height:${height + (brandHtml ? 18 : 0)}px;">${svg}${brandHtml}</div>`;
}

export function renderPhoneThumbnail(config, size) {
    return renderPhoneMockup(config, { size: size || 60, showBrand: false });
}

export function getMockupEra() {
    return getDesignEraForYear(safeGetYear());
}

export function getMockupSpec() {
    const st = safeGetState();
    const completed = (st.research && st.research.completed) || [];
    return resolveSpec(st.time.currentYear || 2000, completed);
}

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
                                               }
