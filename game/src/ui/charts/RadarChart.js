// FILE: src/ui/charts/RadarChart.js
// ============================================================
// RadarChart — 5 axis SVG untuk statistik produk.
// Sum: display, camera, battery, performance, connectivity.
// Range: 0-100.
// v2027.13d — i18n (Fase 2): label sumbu lewat key radar.* (fallback sesuai bahasa aktif).
// Render murni fungsi: label diambil saat render, jadi ikut berganti saat UI di-render ulang.
// ============================================================
import { t, LanguageService } from '../../core/LanguageService.js';

// fb = [Indonesia, Inggris] — dipakai bila key belum ada di kamus (sebelum Fase 3).
const AXES = [
    { key: 'display',      i18n: 'radar.display',      fb: ['Layar', 'Display'] },
    { key: 'camera',       i18n: 'radar.camera',       fb: ['Kamera', 'Camera'] },
    { key: 'battery',      i18n: 'radar.battery',      fb: ['Baterai', 'Battery'] },
    { key: 'performance',  i18n: 'radar.performance',  fb: ['Performa', 'Performance'] },
    { key: 'connectivity', i18n: 'radar.connectivity', fb: ['Koneksi', 'Connectivity'] }
];

function _axisLabel(a) {
    var v = t(a.i18n);
    if (v && v !== a.i18n) return v;
    var en = false;
    try { en = LanguageService.getLang() === 'en'; } catch (e) {}
    return en ? a.fb[1] : a.fb[0];
}

function _esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function renderRadarChart(stats, opts) {
    const size = (opts && opts.size) || 200;
    const accent = (opts && opts.accent) || 'var(--accent)';
    const accentSoft = (opts && opts.accentSoft) || 'var(--accent-soft)';
    const valueColor = (opts && opts.valueColor) || 'var(--text-primary)';
    const gridColor = (opts && opts.gridColor) || 'var(--border)';
    const showLabels = !(opts && opts.noLabels);

    const cx = 50;
    const cy = 50;
    const radius = 32;
    const n = AXES.length;

    // Hitung titik sudut tiap axis (mulai dari atas = -90°)
    function pointAt(idx, value01) {
        const angle = (Math.PI * 2 * idx / n) - Math.PI / 2;
        const r = radius * value01;
        return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
    }

    // Grid rings (4 level)
    function ring(level) {
        const pts = [];
        for (let i = 0; i < n; i++) {
            const p = pointAt(i, level);
            pts.push(p[0].toFixed(2) + ',' + p[1].toFixed(2));
        }
        return pts.join(' ');
    }

    // Sumbu (garis dari center ke masing-masing titik max)
    const axisLines = [];
    for (let i = 0; i < n; i++) {
        const p = pointAt(i, 1);
        axisLines.push(`<line x1="${cx}" y1="${cy}" x2="${p[0].toFixed(2)}" y2="${p[1].toFixed(2)}" stroke="${gridColor}" stroke-width="0.3" opacity="0.6"/>`);
    }

    // Data polygon
    const values = AXES.map(a => {
        const v = stats && typeof stats[a.key] === 'number' ? stats[a.key] : 0;
        return Math.max(0, Math.min(100, v)) / 100;
    });
    const dataPoints = AXES.map((a, i) => {
        const p = pointAt(i, values[i]);
        return p[0].toFixed(2) + ',' + p[1].toFixed(2);
    }).join(' ');

    // Data vertex circles
    const vertexCircles = AXES.map((a, i) => {
        const p = pointAt(i, values[i]);
        return `<circle cx="${p[0].toFixed(2)}" cy="${p[1].toFixed(2)}" r="0.9" fill="${accent}" stroke="#fff" stroke-width="0.3"/>`;
    }).join('');

    // Labels
    const labels = showLabels ? AXES.map((a, i) => {
        const labelR = radius + 8;
        const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
        const lx = cx + Math.cos(angle) * labelR;
        const ly = cy + Math.sin(angle) * labelR + 1.5;
        const anchor = Math.abs(lx - cx) < 2 ? 'middle' : (lx < cx ? 'end' : 'start');
        const value = stats && typeof stats[a.key] === 'number' ? Math.round(stats[a.key]) : 0;
        return `
            <text x="${lx.toFixed(2)}" y="${ly.toFixed(2)}" text-anchor="${anchor}" font-size="3" font-weight="600" fill="${valueColor}" font-family="sans-serif">${_esc(_axisLabel(a))}</text>
            <text x="${lx.toFixed(2)}" y="${(ly + 3.2).toFixed(2)}" text-anchor="${anchor}" font-size="2.6" font-weight="700" fill="${accent}" font-family="sans-serif">${value}</text>
        `;
    }).join('') : '';

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
            <defs>
                <radialGradient id="radarFill_${Math.random().toString(36).slice(2,6)}">
                    <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="${accent}" stop-opacity="0.15"/>
                </radialGradient>
            </defs>
            <!-- Grid rings -->
            ${[0.25, 0.5, 0.75, 1].map(l => `<polygon points="${ring(l)}" fill="none" stroke="${gridColor}" stroke-width="0.25" opacity="${l === 1 ? 0.7 : 0.4}"/>`).join('')}
            <!-- Sumbu -->
            ${axisLines.join('')}
            <!-- Data polygon -->
            <polygon points="${dataPoints}" fill="${accentSoft}" stroke="${accent}" stroke-width="0.7" stroke-linejoin="round"/>
            <!-- Vertex -->
            ${vertexCircles}
            <!-- Labels -->
            ${labels}
        </svg>
    `;

    return `<div class="radar-chart-wrap" style="width:${size}px;height:${size}px;">${svg}</div>`;
}

// Mengembalikan sumbu dengan label yang sudah diterjemahkan (bentuk {key,label} tetap sama).
export function getRadarAxes() {
    return AXES.map(function (a) { return { key: a.key, label: _axisLabel(a) }; });
}
