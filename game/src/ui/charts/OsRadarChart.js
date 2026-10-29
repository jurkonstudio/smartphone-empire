// FILE: src/ui/charts/OsRadarChart.js
// ============================================================
// OsRadarChart — radar SVG 5 sumbu untuk stat OS (0-100).
// opts: { size, base } — base = stat pembanding (garis putus-putus),
// dipakai wizard untuk menunjukkan "sebelum vs sesudah".
// v2027.13d — i18n (Fase 2): label sumbu memakai key os.stat.*_short yang sudah ada
// (sama dengan OSPanel), aria-label lewat os.radar.aria. Fallback sesuai bahasa aktif.
// Render murni fungsi: label diambil saat render, jadi ikut berganti saat UI di-render ulang.
// ============================================================
import { t, LanguageService } from '../../core/LanguageService.js';

// fb = [Indonesia, Inggris] — dipakai bila key belum ada di kamus.
const AXES = [
    { key: 'stability', i18n: 'os.stat.stab_short',   fb: ['Stabil', 'Stab'] },
    { key: 'speed',     i18n: 'os.stat.cepat_short',  fb: ['Cepat', 'Speed'] },
    { key: 'features',  i18n: 'os.stat.fitur_short',  fb: ['Fitur', 'Feat'] },
    { key: 'security',  i18n: 'os.stat.aman_short',   fb: ['Aman', 'Sec'] },
    { key: 'design',    i18n: 'os.stat.desain_short', fb: ['Desain', 'Design'] }
];

function _tf(key, fbId, fbEn) {
    var v = t(key);
    if (v && v !== key) return v;
    var en = false;
    try { en = LanguageService.getLang() === 'en'; } catch (e) {}
    return en ? fbEn : fbId;
}

function _axisLabel(a) {
    return _tf(a.i18n, a.fb[0], a.fb[1]);
}

function _esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const CX = 60, CY = 56, R = 34;

function pt(i, v01, r) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
    return [CX + Math.cos(a) * r * v01, CY + Math.sin(a) * r * v01];
}

function ring(k) {
    return AXES.map((_, i) => pt(i, k, R).map(n => n.toFixed(1)).join(',')).join(' ');
}

function shape(stats) {
    return AXES.map((ax, i) => {
        const v = Math.max(0, Math.min(100, (stats && stats[ax.key]) || 0)) / 100;
        return pt(i, v, R).map(n => n.toFixed(1)).join(',');
    }).join(' ');
}

export function renderOsRadar(stats, opts) {
    const o = opts || {};
    const w = o.size || 150;
    const h = Math.round(w * 112 / 120);

    const grid = [0.25, 0.5, 0.75, 1].map(k =>
        '<polygon class="osx-radar-grid" points="' + ring(k) + '"/>').join('');

    const spokes = AXES.map((_, i) => {
        const p = pt(i, 1, R);
        return '<line class="osx-radar-grid" x1="' + CX + '" y1="' + CY +
               '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '"/>';
    }).join('');

    const base = o.base
        ? '<polygon class="osx-radar-base" points="' + shape(o.base) + '"/>'
        : '';

    const dots = AXES.map((ax, i) => {
        const v = Math.max(0, Math.min(100, (stats && stats[ax.key]) || 0)) / 100;
        const p = pt(i, v, R);
        return '<circle class="osx-radar-dot" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="1.7"/>';
    }).join('');

    const labels = AXES.map((ax, i) => {
        const p = pt(i, 1, R + 9);
        const dy = i === 0 ? 0 : (i === 1 || i === 4 ? 2 : 5);
        return '<text class="osx-radar-lbl" x="' + p[0].toFixed(1) + '" y="' + (p[1] + dy).toFixed(1) +
               '" text-anchor="middle">' + _esc(_axisLabel(ax)) + '</text>';
    }).join('');

    return '<svg class="osx-radar" viewBox="0 0 120 112" width="' + w + '" height="' + h +
           '" role="img" aria-label="' + _esc(_tf('os.radar.aria', 'Radar stat OS', 'OS stats radar')) + '">' +
           grid + spokes + base +
           '<polygon class="osx-radar-fill" points="' + shape(stats) + '"/>' +
           dots + labels + '</svg>';
}
