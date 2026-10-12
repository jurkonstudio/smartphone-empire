// FILE: src/ui/charts/ChipRadarChart.js
// ============================================================
// ChipRadarChart — 4 axis SVG untuk statistik chip.
// Axis: Performance, Efficiency, Value (cost inverted), Yield.
// ============================================================

const AXES = [
    { key: 'performance', label: 'Performa' },
    { key: 'efficiency',  label: 'Efisiensi' },
    { key: 'value',       label: 'Nilai' },
    { key: 'yield',       label: 'Yield' }
];

// Cost → Value: makin murah makin bagus.
// costPerUnit 5 = value 100, costPerUnit 500 = value 0.
function costToValue(cost) {
    if (typeof cost !== 'number' || cost <= 0) return 50;
    const v = 100 - Math.min(100, (cost - 5) / 4.95);
    return Math.max(0, Math.min(100, Math.round(v)));
}

export function renderChipRadarChart(stats, opts) {
    const size = (opts && opts.size) || 180;
    const accent = (opts && opts.accent) || 'var(--accent)';
    const accentSoft = (opts && opts.accentSoft) || 'var(--accent-soft)';
    const valueColor = (opts && opts.valueColor) || 'var(--text-primary)';
    const gridColor = (opts && opts.gridColor) || 'var(--border)';
    const showLabels = !(opts && opts.noLabels);

    const cx = 50;
    const cy = 50;
    const radius = 32;
    const n = AXES.length;

    function pointAt(idx, value01) {
        const angle = (Math.PI * 2 * idx / n) - Math.PI / 2;
        const r = radius * value01;
        return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
    }

    function ring(level) {
        const pts = [];
        for (let i = 0; i < n; i++) {
            const p = pointAt(i, level);
            pts.push(p[0].toFixed(2) + ',' + p[1].toFixed(2));
        }
        return pts.join(' ');
    }

    // Values
    const valueMap = {
        performance: (stats && stats.performance) || 0,
        efficiency:  (stats && stats.efficiency) || 0,
        value:       costToValue(stats && stats.costPerUnit),
        yield:       Math.round(((stats && stats.yieldRate) || 0.7) * 100)
    };

    const values = AXES.map(a => {
        const v = valueMap[a.key] || 0;
        return Math.max(0, Math.min(100, v)) / 100;
    });

    const dataPoints = AXES.map((a, i) => {
        const p = pointAt(i, values[i]);
        return p[0].toFixed(2) + ',' + p[1].toFixed(2);
    }).join(' ');

    const axisLines = [];
    for (let i = 0; i < n; i++) {
        const p = pointAt(i, 1);
        axisLines.push(`<line x1="${cx}" y1="${cy}" x2="${p[0].toFixed(2)}" y2="${p[1].toFixed(2)}" stroke="${gridColor}" stroke-width="0.3" opacity="0.6"/>`);
    }

    const vertexCircles = AXES.map((a, i) => {
        const p = pointAt(i, values[i]);
        return `<circle cx="${p[0].toFixed(2)}" cy="${p[1].toFixed(2)}" r="0.9" fill="${accent}" stroke="#fff" stroke-width="0.3"/>`;
    }).join('');

    const labels = showLabels ? AXES.map((a, i) => {
        const labelR = radius + 9;
        const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
        const lx = cx + Math.cos(angle) * labelR;
        const ly = cy + Math.sin(angle) * labelR + 1.5;
        const anchor = Math.abs(lx - cx) < 2 ? 'middle' : (lx < cx ? 'end' : 'start');
        const value = valueMap[a.key] || 0;
        return `
            <text x="${lx.toFixed(2)}" y="${ly.toFixed(2)}" text-anchor="${anchor}" font-size="3" font-weight="600" fill="${valueColor}" font-family="sans-serif">${a.label}</text>
            <text x="${lx.toFixed(2)}" y="${(ly + 3.2).toFixed(2)}" text-anchor="${anchor}" font-size="2.8" font-weight="700" fill="${accent}" font-family="sans-serif">${value}</text>
        `;
    }).join('') : '';

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
            <!-- Grid rings -->
            ${[0.25, 0.5, 0.75, 1].map(l => `<polygon points="${ring(l)}" fill="none" stroke="${gridColor}" stroke-width="0.25" opacity="${l === 1 ? 0.7 : 0.4}"/>`).join('')}

            <!-- Axis lines -->
            ${axisLines.join('')}

            <!-- Data polygon -->
            <polygon points="${dataPoints}" fill="${accentSoft}" stroke="${accent}" stroke-width="0.8" stroke-linejoin="round"/>

            <!-- Vertices -->
            ${vertexCircles}

            <!-- Labels -->
            ${labels}
        </svg>
    `;

    return `<div class="radar-chart-wrap chip-radar" style="width:${size}px;height:${size}px;">${svg}</div>`;
}

export function getChipRadarAxes() { return AXES; }
export { costToValue };
