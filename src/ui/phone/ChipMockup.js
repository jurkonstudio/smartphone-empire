// FILE: src/ui/phone/ChipMockup.js
// v2027.4c — visual kelas atas: heat spreader chrome bertekstur, sheen premium (tier 5),
// blok NPU/GPU/ISP/MODEM/SEC/MC sesuai fitur, core P/E untuk big.LITTLE, animasi ringan (size>=120).
// ============================================================
// ChipMockup v2 — SVG chip top-down, visual kelas atas.
// Lapisan (luar -> dalam):
//   pin emas -> package (epoxy / gunmetal / heat spreader chrome
//   bertekstur sikat; tier 5 dengan sheen pelangi) -> die silikon
//   (grid transistor, glow sesuai node) -> blok fungsional
//   (core P/E, L2 SRAM, NPU, GPU, ISP, modem, security, MC).
// Animasi ringan (scanline, denyut core, sheen) hanya bila ukuran >= 120px
// supaya thumbnail di daftar tetap ringan.
// API tetap: renderChipMockup(config, opts), renderChipThumbnail(config, size).
// ============================================================
import { getArchitectureById } from '../../data/chip-architecture.data.js';
import { getChipNodeById } from '../../data/chip-node.data.js';
import { getChipFeatureById } from '../../data/chip-features.data.js';

let _uid = 0;

// Tema die per tier node (1 = paling tua, 5 = paling canggih)
const TIER_THEME = {
    1: { die: ['#3a3a4a', '#22222c'], grid: '#55556a', glow: '#8390b0', spreader: null },
    2: { die: ['#2a4a5a', '#15303c'], grid: '#3f6f86', glow: '#62b8e0', spreader: null },
    3: { die: ['#1a4a6a', '#0a2a42'], grid: '#2f7cb0', glow: '#4ec6ff', spreader: 'metal' },
    4: { die: ['#0a3a7a', '#021f4e'], grid: '#2c72dc', glow: '#5ab0ff', spreader: 'chrome' },
    5: { die: ['#0a2a9a', '#010f5c'], grid: '#4f8cff', glow: '#b4dcff', spreader: 'premium' }
};

// Warna package berdasarkan tier arsitektur
const PKG_TONE = { 1: '#17171b', 2: '#1c1d23', 3: '#24262e', 4: '#2c303b' };

// Gradien blok fungsional
const BLOCK_STYLE = {
    npu:  ['#d19bff', '#6a2fc4'],
    gpu:  ['#8dff9b', '#1f8f3d'],
    isp:  ['#ffd27a', '#b87412'],
    modem:['#7fe7ff', '#1a7aa0'],
    sec:  ['#ff9e9e', '#a02c3c'],
    mc:   ['#c9d4e6', '#56637c']
};

function lg(id, c1, c2) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>';
}

// Label kelas chip (CPU/GPU/SoC/AI) berdasarkan fitur
function chipClass(config) {
    const features = config.features || [];
    if (features.includes('npu_gen3') || features.includes('llm_accelerator')) return 'AI-SoC';
    if (features.includes('npu_gen1') || features.includes('npu_gen2')) return 'SoC + NPU';
    if (features.includes('gpu_modern') || features.includes('ray_tracing')) return 'SoC';
    if ((config.cores || 1) >= 4) return 'SoC';
    return 'CPU';
}

// Profil fitur -> blok apa saja yang tampil di die
function featureProfile(ids) {
    const p = { ai: false, gpu: false, isp: false, connectivity: false, security: false };
    (ids || []).forEach(function (id) {
        const f = getChipFeatureById(id);
        const cat = f ? f.category : '';
        const sid = String(id);
        if (cat === 'ai') p.ai = true;
        if (cat === 'connectivity') p.connectivity = true;
        if (cat === 'security') p.security = true;
        if (sid.indexOf('isp') === 0) p.isp = true;
        if (/gpu|ray/.test(sid)) p.gpu = true;
    });
    return p;
}

function blockList(p) {
    const list = [];
    if (p.ai) list.push({ key: 'npu', label: 'NPU' });
    if (p.gpu) list.push({ key: 'gpu', label: 'GPU' });
    if (p.isp) list.push({ key: 'isp', label: 'ISP' });
    if (p.connectivity) list.push({ key: 'modem', label: 'MODEM' });
    if (p.security) list.push({ key: 'sec', label: 'SEC' });
    list.push({ key: 'mc', label: 'MC' });
    return list.slice(0, 6);
}

function coreGrid(n) {
    const cols = n <= 2 ? n : (n <= 4 ? 2 : 4);
    return { cols: cols, rows: Math.ceil(n / cols) };
}

export function renderChipMockup(config, opts) {
    const size = (opts && opts.size) || 200;
    const animate = !(opts && opts.animate === false) && size >= 120;
    const cfg = config || {};
    const arch = getArchitectureById(cfg.architectureId);
    const node = getChipNodeById(cfg.nodeId);

    const archTier = arch ? (arch.tier || 1) : 1;
    const nodeTier = Math.min(5, Math.max(1, node ? (node.tier || 1) : 1));
    const th = TIER_THEME[nodeTier];
    const pkgTone = PKG_TONE[Math.min(4, Math.max(1, archTier))];
    const spreader = th.spreader;

    const cores = Math.max(1, Math.min(8, cfg.cores || 1));
    const bigCount = (arch && arch.id === 'arch_biglittle') ? Math.ceil(cores / 2) : cores;
    const prof = featureProfile(cfg.features);
    const blocks = blockList(prof);

    const uid = 'cm' + (++_uid);
    const id = function (s) { return s + '_' + uid; };

    const chipLabel = (cfg.name || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 5).toUpperCase() || 'X1';
    const classLabel = chipClass(cfg);
    const nodeLabel = node ? node.name : '90nm';
    const kb = cfg.cacheKB || 256;
    const cacheLabel = kb >= 1024 ? (kb / 1024) + 'MB' : kb + 'KB';

    // ---------- DEFS ----------
    let defs = '';
    defs += lg(id('die'), th.die[0], th.die[1]);
    defs += lg(id('pkg'), pkgTone, '#0b0b0e');
    defs += lg(id('pin'), '#f3d28a', '#8a6a2a');
    defs += lg(id('chrome'), '#eef2f8', '#7d8594');
    defs += lg(id('bigc'), '#8fd3ff', '#1d5fa8');
    defs += lg(id('litc'), '#7ff0d8', '#15766a');
    Object.keys(BLOCK_STYLE).forEach(function (k) {
        defs += lg(id('b_' + k), BLOCK_STYLE[k][0], BLOCK_STYLE[k][1]);
    });
    defs += '<linearGradient id="' + id('sheen') + '" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="#ff6ad5"/><stop offset="0.25" stop-color="#ffd166"/>' +
        '<stop offset="0.5" stop-color="#06d6a0"/><stop offset="0.75" stop-color="#4cc9f0"/>' +
        '<stop offset="1" stop-color="#b388ff"/></linearGradient>';
    defs += '<pattern id="' + id('sram') + '" width="2" height="2" patternUnits="userSpaceOnUse">' +
        '<rect width="2" height="2" fill="#0d1a2b"/>' +
        '<rect x="0.25" y="0.25" width="1.5" height="1.5" fill="none" stroke="#3a6a9a" stroke-width="0.18"/></pattern>';
    defs += '<filter id="' + id('shadow') + '" x="-20%" y="-20%" width="140%" height="140%">' +
        '<feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/></filter>';
    defs += '<clipPath id="' + id('clip') + '"><rect x="13" y="13" width="74" height="74" rx="1.5"/></clipPath>';
    if (animate) {
        defs += '<filter id="' + id('noise') + '" x="0" y="0" width="100%" height="100%">' +
            '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n"/>' +
            '<feColorMatrix in="n" type="saturate" values="0" result="g"/>' +
            '<feComponentTransfer in="g"><feFuncA type="table" tableValues="0 0.35"/></feComponentTransfer></filter>';
        defs += '<filter id="' + id('glow') + '" x="-30%" y="-30%" width="160%" height="160%">' +
            '<feGaussianBlur stdDeviation="1.6" result="b"/>' +
            '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
    }

    // ---------- PINS (lead emas di keliling) ----------
    let pins = '';
    const margin = 8, pinW = 1.4, pinL = 3.5, pitch = 4.5;
    const pinFill = 'url(#' + id('pin') + ')';
    for (let x = margin + 4; x < 100 - margin - 4; x += pitch) {
        pins += '<rect x="' + x + '" y="' + (margin - pinL) + '" width="' + pinW + '" height="' + pinL + '" fill="' + pinFill + '" rx="0.3"/>';
        pins += '<rect x="' + x + '" y="' + (100 - margin) + '" width="' + pinW + '" height="' + pinL + '" fill="' + pinFill + '" rx="0.3"/>';
    }
    for (let y = margin + 4; y < 100 - margin - 4; y += pitch) {
        pins += '<rect x="' + (margin - pinL) + '" y="' + y + '" width="' + pinL + '" height="' + pinW + '" fill="' + pinFill + '" rx="0.3"/>';
        pins += '<rect x="' + (100 - margin) + '" y="' + y + '" width="' + pinL + '" height="' + pinW + '" fill="' + pinFill + '" rx="0.3"/>';
    }

    // ---------- PACKAGE ----------
    let pkg = '<rect x="8" y="8" width="84" height="84" rx="3" fill="url(#' + id('pkg') + ')" stroke="#050505" stroke-width="0.4"/>';
    if (animate) {
        pkg += '<rect x="8" y="8" width="84" height="84" rx="3" fill="#fff" filter="url(#' + id('noise') + ')" opacity="0.5"/>';
    }
    pkg += '<rect x="11" y="11" width="78" height="78" rx="2" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="0.25"/>';
    pkg += '<circle cx="14" cy="14" r="1.2" fill="' + th.glow + '"/><circle cx="14" cy="14" r="0.55" fill="#fff" opacity="0.85"/>';

    // ---------- HEAT SPREADER (tier 3+) ----------
    let spreaderSvg = '';
    if (spreader) {
        let brushed = '';
        if (animate) {
            for (let y = 13.5; y < 87; y += 1.4) {
                brushed += '<line x1="13" y1="' + y.toFixed(1) + '" x2="87" y2="' + y.toFixed(1) + '" stroke="#fff" stroke-opacity="0.07" stroke-width="0.3"/>';
            }
        }
        let premium = '';
        if (spreader === 'premium' && animate) {
            premium = '<rect x="-60" y="13" width="40" height="74" fill="url(#' + id('sheen') + ')" opacity="0.35">' +
                '<animate attributeName="x" values="-60;160" dur="4.5s" repeatCount="indefinite"/></rect>';
        }
        spreaderSvg =
            '<g clip-path="url(#' + id('clip') + ')">' +
            '<rect x="13" y="13" width="74" height="74" rx="1.5" fill="url(#' + id('chrome') + ')"/>' +
            brushed + premium + '</g>' +
            '<rect x="13" y="13" width="74" height="74" rx="1.5" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="0.35"/>';
    }

    // ---------- DIE ----------
    const dieFilter = animate ? ' filter="url(#' + id('glow') + ')"' : '';
    let grid = '';
    for (let x = 23; x < 80; x += 3) {
        grid += '<line x1="' + x + '" y1="20" x2="' + x + '" y2="80" stroke="' + th.grid + '" stroke-width="0.15" opacity="0.25"/>';
    }
    for (let y = 23; y < 80; y += 3) {
        grid += '<line x1="20" y1="' + y + '" x2="80" y2="' + y + '" stroke="' + th.grid + '" stroke-width="0.15" opacity="0.25"/>';
    }
    let dieSvg =
        '<rect x="20" y="20" width="60" height="60" rx="0.6" fill="url(#' + id('die') + ')" stroke="' + th.glow + '" stroke-opacity="0.55" stroke-width="0.35"' + dieFilter + '/>' +
        grid;

    // ---------- CORES (P/E untuk big.LITTLE) ----------
    const g = coreGrid(cores);
    const gap = 1.2;
    const cellW = (52 - gap * (g.cols - 1)) / g.cols;
    const cellH = Math.min(9, (22 - gap * (g.rows - 1)) / g.rows);
    let coreSvg = '';
    for (let i = 0; i < cores; i++) {
        const col = i % g.cols;
        const row = Math.floor(i / g.cols);
        const x = 24 + col * (cellW + gap);
        const y = 24 + row * (cellH + gap);
        const isBig = i < bigCount;
        const letter = bigCount === cores ? 'C' : (isBig ? 'P' : 'E');
        coreSvg += '<rect x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + cellW.toFixed(2) + '" height="' + cellH.toFixed(2) +
            '" rx="0.6" fill="url(#' + id(isBig ? 'bigc' : 'litc') + ')" stroke="' + (isBig ? '#bfe6ff' : '#b6fff0') + '" stroke-opacity="0.35" stroke-width="0.2"/>';
        if (cellW >= 7 && cellH >= 5) {
            coreSvg += '<text x="' + (x + cellW / 2).toFixed(2) + '" y="' + (y + cellH / 2 + 0.9).toFixed(2) +
                '" text-anchor="middle" font-size="2.4" font-weight="700" font-family="monospace" fill="#06121f" opacity="0.85">' + letter + (i + 1) + '</text>';
        }
        if (animate) {
            coreSvg += '<rect x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + cellW.toFixed(2) + '" height="' + cellH.toFixed(2) +
                '" rx="0.6" fill="#fff" opacity="0"><animate attributeName="opacity" values="0;0.45;0" dur="2.6s" begin="' +
                (-i * 0.37).toFixed(2) + 's" repeatCount="indefinite"/></rect>';
        }
    }

    // ---------- L2 SRAM ----------
    const cacheSvg =
        '<rect x="24" y="48" width="52" height="8" rx="0.6" fill="url(#' + id('sram') + ')" stroke="' + th.glow + '" stroke-opacity="0.4" stroke-width="0.2"/>' +
        '<text x="50" y="53.3" text-anchor="middle" font-size="2.6" font-weight="700" font-family="monospace" fill="#dff1ff">L2 · ' + cacheLabel + '</text>';

    // ---------- BLOK FUNGSIONAL (NPU, GPU, ISP, MODEM, SEC, MC) ----------
    let blocksSvg = '';
    const bw = (52 - gap * (blocks.length - 1)) / blocks.length;
    blocks.forEach(function (b, idx) {
        const x = 24 + idx * (bw + gap);
        blocksSvg += '<rect x="' + x.toFixed(2) + '" y="58" width="' + bw.toFixed(2) + '" height="17" rx="1" fill="url(#' + id('b_' + b.key) + ')" stroke="#fff" stroke-opacity="0.25" stroke-width="0.2"/>' +
            '<text x="' + (x + bw / 2).toFixed(2) + '" y="67.2" text-anchor="middle" font-size="2.6" font-weight="800" font-family="monospace" fill="#06101c">' + b.label + '</text>';
        if (animate && b.key === 'npu') {
            blocksSvg += '<rect x="' + x.toFixed(2) + '" y="58" width="' + bw.toFixed(2) + '" height="1.1" fill="#fff" opacity="0.7">' +
                '<animate attributeName="y" values="58;73;58" dur="2s" repeatCount="indefinite"/></rect>';
        }
    });

    // ---------- SCANLINE DIE ----------
    const scan = animate
        ? '<rect x="20" y="20" width="60" height="1.1" fill="' + th.glow + '" opacity="0.55"><animate attributeName="y" values="20;78;20" dur="3.6s" repeatCount="indefinite"/></rect>'
        : '';

    // ---------- LABEL ----------
    const titleFill = spreader ? '#1a1f2b' : '#e8f0ff';
    const titleSvg = '<text x="50" y="16.4" text-anchor="middle" font-size="4" font-weight="800" font-family="-apple-system, sans-serif" letter-spacing="0.6" fill="' + titleFill + '">' + chipLabel + '</text>';
    const bottomY = spreader ? 84.6 : 86.4;
    const bottomFill = spreader ? '#2b3140' : '#8c96ab';
    const bottomSvg = '<text x="50" y="' + bottomY + '" text-anchor="middle" font-size="2.2" font-family="monospace" letter-spacing="0.4" fill="' + bottomFill + '">' +
        classLabel + ' · ' + nodeLabel + ' · ' + cores + 'x</text>';

    const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + size + '" height="' + size + '">' +
        '<defs>' + defs + '</defs>' +
        '<g filter="url(#' + id('shadow') + ')">' +
        pins + pkg + spreaderSvg + dieSvg + coreSvg + cacheSvg + blocksSvg + scan + titleSvg + bottomSvg +
        '</g></svg>';

    return '<div class="chip-mockup-wrap" style="width:' + size + 'px;height:' + size + 'px;">' + svg + '</div>';
}

export function renderChipThumbnail(config, size) {
    return renderChipMockup(config, { size: size || 60 });
}
