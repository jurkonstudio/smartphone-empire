// FILE: src/ui/panels/OsStatBar.js
// Komponen kecil: render 5 stat bar OS (dipakai OSPanel & modal).
const STAT_META = {
    stability: { label: 'Stabilitas', color: '#4CAF50' },
    speed:     { label: 'Kecepatan', color: '#2196F3' },
    features:  { label: 'Fitur',     color: '#FF9800' },
    security:  { label: 'Keamanan',  color: '#9C27B0' },
    design:    { label: 'Desain',    color: '#E91E63' }
};

export function renderOsStatBar(stats, { compact } = {}) {
    if (!stats) return '';
    const keys = ['stability', 'speed', 'features', 'security', 'design'];
    const rows = keys.map(k => {
        const meta = STAT_META[k];
        const val = Math.max(0, Math.min(100, Math.round(stats[k] || 0)));
        return `
            <div class="os-stat-row ${compact ? 'compact' : ''}">
                <div class="os-stat-label">${meta.label}</div>
                <div class="os-stat-bar">
                    <div class="os-stat-fill" style="width:${val}%;background:${meta.color};"></div>
                </div>
                <div class="os-stat-value">${val}</div>
            </div>
        `;
    }).join('');
    return `<div class="os-stat-grid">${rows}</div>`;
}

export function getStatMeta() { return STAT_META; }
