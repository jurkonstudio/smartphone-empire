// FILE: src/ui/phone/ChipMockup.js
// ============================================================
// ChipMockup — SVG render chip silicon (top-down die view).
// Gaya berbeda dari PhoneMockup — fokus ke PCB + die + pins.
// ============================================================

import { getArchitectureById } from '../../data/chip-architecture.data.js';
import { getChipNodeById } from '../../data/chip-node.data.js';

// Warna die berdasarkan node (makin kecil nm → makin terang/biru)
function dieColor(nodeId) {
    const node = getChipNodeById(nodeId);
    if (!node) return { base: '#2a4a6a', edge: '#1a3050', grid: '#3a5a7a' };
    const tier = node.tier || 1;
    if (tier === 1) return { base: '#3a3a4a', edge: '#2a2a35', grid: '#4a4a5a' };
    if (tier === 2) return { base: '#2a4a5a', edge: '#1a3545', grid: '#3a5a6a' };
    if (tier === 3) return { base: '#1a4a6a', edge: '#0a304a', grid: '#2a5a7a' };
    if (tier === 4) return { base: '#0a3a7a', edge: '#001a4a', grid: '#1a4a8a' };
    return                { base: '#0a2a9a', edge: '#001a6a', grid: '#1a3aaa' };
}

// Warna package berdasarkan arsitektur
function packageColor(archId) {
    const arch = getArchitectureById(archId);
    if (!arch) return { body: '#1a1a1a', edge: '#0a0a0a' };
    if (arch.tier >= 4) return { body: '#2a2a2a', edge: '#0a0a0a' };
    return { body: '#1a1a1a', edge: '#0a0a0a' };
}

// Chip class label (CPU/GPU/SoC/AI) berdasarkan features
function chipClass(config) {
    const features = config.features || [];
    if (features.includes('npu_gen3') || features.includes('llm_accelerator')) return 'AI-SoC';
    if (features.includes('npu_gen1') || features.includes('npu_gen2')) return 'SoC + NPU';
    if (features.includes('gpu_modern') || features.includes('ray_tracing')) return 'SoC';
    if ((config.cores || 1) >= 4) return 'SoC';
    if ((config.cores || 1) >= 2) return 'CPU';
    return 'CPU';
}

export function renderChipMockup(config, opts) {
    const size = (opts && opts.size) || 200;
    const width = size;
    const height = size;

    const cfg = config || {};
    const arch = getArchitectureById(cfg.architectureId);
    const node = getChipNodeById(cfg.nodeId);

    const die = dieColor(cfg.nodeId);
    const pkg = packageColor(cfg.architectureId);
    const tier = node ? node.tier : 1;
    const hasHeatSpreader = tier >= 4;

    const chipId = Math.random().toString(36).slice(2, 8);
    const gradId = 'chipBody_' + chipId;
    const dieGradId = 'chipDie_' + chipId;
    const glowId = 'chipGlow_' + chipId;

    // Chip logo text — 4-6 char
    const chipLabel = (cfg.name || 'X1').replace(/[^A-Za-z0-9]/g, '').slice(0, 5).toUpperCase() || 'X1';
    const classLabel = chipClass(cfg);
    const nodeLabel = node ? node.name : '90nm';
    const coresLabel = (cfg.cores || 1) + 'x';

    // ============================================================
    // PINS — pattern di keliling chip
    // ============================================================
    function renderPins() {
        const pins = [];
        const pinWidth = 1.4;
        const pinLength = 3.5;
        const margin = 8;
        const pitch = 4.5;

        // Top & bottom
        for (let x = margin + 4; x < 100 - margin - 4; x += pitch) {
            pins.push(`<rect x="${x}" y="${margin - pinLength}" width="${pinWidth}" height="${pinLength}" fill="#c8a05a" rx="0.3"/>`);
            pins.push(`<rect x="${x}" y="${100 - margin}" width="${pinWidth}" height="${pinLength}" fill="#c8a05a" rx="0.3"/>`);
        }
        // Left & right
        for (let y = margin + 4; y < 100 - margin - 4; y += pitch) {
            pins.push(`<rect x="${margin - pinLength}" y="${y}" width="${pinLength}" height="${pinWidth}" fill="#c8a05a" rx="0.3"/>`);
            pins.push(`<rect x="${100 - margin}" y="${y}" width="${pinLength}" height="${pinWidth}" fill="#c8a05a" rx="0.3"/>`);
        }
        return pins.join('');
    }

    // ============================================================
    // DIE GRID — grid transistor pattern
    // ============================================================
    function renderDieGrid(x0, y0, w, h) {
        const lines = [];
        const step = 3;
        for (let x = x0 + step; x < x0 + w; x += step) {
            lines.push(`<line x1="${x}" y1="${y0}" x2="${x}" y2="${y0 + h}" stroke="${die.grid}" stroke-width="0.15" opacity="0.5"/>`);
        }
        for (let y = y0 + step; y < y0 + h; y += step) {
            lines.push(`<line x1="${x0}" y1="${y}" x2="${x0 + w}" y2="${y}" stroke="${die.grid}" stroke-width="0.15" opacity="0.5"/>`);
        }
        return lines.join('');
    }

    // ============================================================
    // FUNCTIONAL BLOCKS di dalam die (CPU, cache, IO)
    // ============================================================
    function renderDieBlocks(x0, y0, w, h, cores) {
        const blocks = [];
        const coreCount = Math.min(8, cores || 1);
        const cols = coreCount <= 4 ? 2 : 4;
        const rows = Math.ceil(coreCount / cols);
        const blockW = (w - 4) / cols;
        const blockH = (h * 0.55) / rows;

        for (let i = 0; i < coreCount; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const bx = x0 + 2 + col * blockW;
            const by = y0 + 2 + row * blockH;
            blocks.push(`<rect x="${bx + 0.5}" y="${by + 0.5}" width="${blockW - 1}" height="${blockH - 1}" fill="${die.grid}" stroke="${die.edge}" stroke-width="0.2" opacity="0.85" rx="0.3"/>`);
        }
        // Cache block di bawah
        blocks.push(`<rect x="${x0 + 2}" y="${y0 + h * 0.6}" width="${w - 4}" height="${h * 0.36}" fill="${die.edge}" stroke="${die.grid}" stroke-width="0.2" opacity="0.7" rx="0.3"/>`);
        return blocks.join('');
    }

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${width}" height="${height}">
            <defs>
                <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${pkg.body}"/>
                    <stop offset="50%" stop-color="${pkg.body}"/>
                    <stop offset="100%" stop-color="${pkg.edge}"/>
                </linearGradient>
                <linearGradient id="${dieGradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${die.base}"/>
                    <stop offset="100%" stop-color="${die.edge}"/>
                </linearGradient>
                <radialGradient id="${glowId}">
                    <stop offset="0%" stop-color="${die.grid}" stop-opacity="0.5"/>
                    <stop offset="100%" stop-color="${die.grid}" stop-opacity="0"/>
                </radialGradient>
                <filter id="dropShadow_${chipId}" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
                </filter>
            </defs>

            <g filter="url(#dropShadow_${chipId})">
                <!-- Pins -->
                ${renderPins()}

                <!-- Package body -->
                <rect x="8" y="8" width="84" height="84" rx="3" fill="url(#${gradId})" stroke="#050505" stroke-width="0.4"/>

                <!-- Package inner frame -->
                <rect x="11" y="11" width="78" height="78" rx="2" fill="none" stroke="#2a2a2a" stroke-width="0.2"/>

                <!-- Corner pin-1 marker -->
                <circle cx="14" cy="14" r="1.2" fill="${die.grid}"/>
                <circle cx="14" cy="14" r="0.6" fill="#fff" opacity="0.8"/>

                <!-- Heat spreader (tier 4+) -->
                ${hasHeatSpreader ? `
                    <rect x="13" y="13" width="74" height="74" rx="1.5" fill="rgba(120,120,130,0.15)" stroke="rgba(200,200,210,0.3)" stroke-width="0.3"/>
                    <line x1="13" y1="13" x2="87" y2="13" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
                ` : ''}

                <!-- Die (the actual silicon) -->
                <rect x="20" y="20" width="60" height="60" rx="0.5" fill="url(#${dieGradId})" stroke="${die.edge}" stroke-width="0.3"/>

                <!-- Die glow center -->
                <rect x="20" y="20" width="60" height="60" rx="0.5" fill="url(#${glowId})"/>

                <!-- Die grid pattern -->
                ${renderDieGrid(20, 20, 60, 60)}

                <!-- Functional blocks (cores + cache) -->
                ${renderDieBlocks(20, 20, 60, 60, cfg.cores || 1)}

                <!-- Chip label (text on die) -->
                <text x="50" y="48" text-anchor="middle" font-size="6.5" font-weight="800" font-family="-apple-system, sans-serif" fill="#e8f0ff" letter-spacing="0.3" opacity="0.95">${chipLabel}</text>
                <text x="50" y="54" text-anchor="middle" font-size="2.6" font-family="monospace" fill="#8ab0d0" letter-spacing="0.5">${classLabel}</text>

                <!-- Node info bottom right of die -->
                <text x="76" y="76" text-anchor="end" font-size="2.2" font-family="monospace" fill="${die.grid}" opacity="0.9">${nodeLabel}</text>

                <!-- Cores info bottom left -->
                <text x="24" y="76" text-anchor="start" font-size="2.2" font-family="monospace" fill="${die.grid}" opacity="0.9">${coresLabel}</text>
            </g>
        </svg>
    `;

    return `<div class="chip-mockup-wrap" style="width:${width}px;height:${height}px;">${svg}</div>`;
}

export function renderChipThumbnail(config, size) {
    return renderChipMockup(config, { size: size || 60 });
                  }
