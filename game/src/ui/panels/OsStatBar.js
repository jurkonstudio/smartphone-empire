// FILE: src/ui/panels/OsStatBar.js
// v2027.13c — i18n.
// Komponen kecil: render 5 stat bar OS (dipakai OSPanel & modal).
import { t } from '../../core/LanguageService.js';

const STAT_META = {
    stability: { labelKey: 'os.stat.stability', color: '#4CAF50' },
    speed:     { labelKey: 'os.stat.speed',     color: '#2196F3' },
    features:  { labelKey: 'os.stat.features',  color: '#FF9800' },
    security:  { labelKey: 'os.stat.security',  color: '#9C27B0' },
    design:    { labelKey: 'os.stat.design',    color: '#E91E63' }
};

export function renderOsStatBar(stats, opts) {
    if (!stats) return '';
    const compact = opts && opts.compact;
    const keys = ['stability', 'speed', 'features', 'security', 'design'];
    const rows = keys.map(function (k) {
        const meta = STAT_META[k];
        const val = Math.max(0, Math.min(100, Math.round(stats[k] || 0)));
        return `
            <div class="os-stat-row ${compact ? 'compact' : ''}">
                <div class="os-stat-label">${t(meta.labelKey)}</div>
                <div class="os-stat-bar">
                    <div class="os-stat-fill" style="width:${val}%;background:${meta.color};"></div>
                </div>
                <div class="os-stat-value">${val}</div>
            </div>
        `;
    }).join('');
    return `<div class="os-stat-grid">${rows}</div>`;
}

// Return metadata dengan label (translated) — untuk pemakaian luar.
export function getStatMeta() {
    return {
        stability: { label: t('os.stat.stability'), color: '#4CAF50' },
        speed:     { label: t('os.stat.speed'),     color: '#2196F3' },
        features:  { label: t('os.stat.features'),  color: '#FF9800' },
        security:  { label: t('os.stat.security'),  color: '#9C27B0' },
        design:    { label: t('os.stat.design'),    color: '#E91E63' }
    };
}
