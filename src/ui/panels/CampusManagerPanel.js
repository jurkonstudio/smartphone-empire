import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/panels/CampusManagerPanel.js
// v2027.16a — Building Manager panel untuk HQ → Campus.
// Baca data dari campus-buildings.data.js, tampilkan per kategori.
import {
    resolveAllBuildings,
    CAMPUS_BUILDINGS
} from '../../data/campus-buildings.data.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { t } from '../../core/LanguageService.js';


// Urutan kategori yang ditampilkan
const CATEGORY_ORDER = ['core', 'innovation', 'marketing', 'industry', 'support'];

// Ikon kategori (bukan ikon gedung — ikon gedung dari data)
const CATEGORY_ICONS = {
    core:       'activity',
    innovation: 'flask',
    marketing:  'signal',
    industry:   'factory',
    support:    'coffee'
};

// ============================================================
// MAIN
// ============================================================
export function renderCampusManagerPanel() {
    let state;
    try {
        state = window.__game.state.get();
    } catch (e) {
        return '<div class="card"><div class="card-title">Campus</div>' +
            '<div class="log-empty">' + t('campus.manager.empty') + '</div></div>';
    }

    const buildings = resolveAllBuildings(state);
    const built = buildings.filter(function (b) { return b.built; }).length;
    const total = buildings.length;

    // Header card
    const headerHtml =
        '<div class="card" style="padding:14px 16px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:6px;">' +
                '<div style="font-size:15px;font-weight:700;letter-spacing:-0.01em;">' +
                    t('campus.manager.title') +
                '</div>' +
                '<div style="font-size:12px;color:var(--text-tertiary);font-variant-numeric:tabular-nums;">' +
                    built + '/' + total +
                '</div>' +
            '</div>' +
            '<div class="progress" style="height:4px;">' +
                '<div class="progress-bar" style="width:' + Math.round((built / total) * 100) + '%;"></div>' +
            '</div>' +
            '<div style="font-size:11px;color:var(--text-tertiary);margin-top:6px;">' +
                t('campus.manager.subtitle', { built: built, total: total }) +
            '</div>' +
        '</div>';

    // Group by category
    const groups = {};
    buildings.forEach(function (b) {
        if (!groups[b.category]) groups[b.category] = [];
        groups[b.category].push(b);
    });

    let listHtml = '';
    CATEGORY_ORDER.forEach(function (catId) {
        const list = groups[catId];
        if (!list || !list.length) return;
        listHtml += _renderCategoryGroup(catId, list);
    });

    return headerHtml + listHtml;
}

// ============================================================
// CATEGORY GROUP
// ============================================================
function _renderCategoryGroup(catId, list) {
    const iconId = CATEGORY_ICONS[catId] || 'layers';
    const labelKey = 'campus.manager.category.' + catId;
    const label = t(labelKey);
    // Fallback: kalau key tidak ada (t() return key sendiri), pakai catId
    const labelText = (label === labelKey) ? catId : label;

    const header =
        '<div class="section-label">' +
            '<span class="section-label-text">' +
                renderIcon(iconId, 11) + ' ' +
                escapeHtml(labelText).toUpperCase() + ' · ' + list.length +
            '</span>' +
            '<span class="section-label-line"></span>' +
        '</div>';

    const rows = list.map(_renderBuildingRow).join('');
    return header + '<div class="campus-list">' + rows + '</div>';
}

// ============================================================
// BUILDING ROW
// ============================================================
function _renderBuildingRow(b) {
    const name = t(b.nameKey);
    const desc = t(b.descKey);
    const built = b.built;
    const atMax = b.level >= b.maxLevel;

    // Progress percent
    let pct = 0;
    if (b.progress && typeof b.progress.pct === 'number') {
        pct = Math.max(0, Math.min(100, b.progress.pct));
    }
    if (atMax) pct = 100;

    // Progress text (kiri bawah)
    let progressText = '';
    if (built) {
        progressText = t('campus.manager.level', { n: b.level });
    } else {
        progressText = t('campus.manager.not_built');
    }

    // Progress value (kanan bawah)
    let valueText = '';
    if (built && b.progress && b.progress.next != null) {
        const unitKey = b.progress.unitKey || 'campus.unit.level';
        const unitLabel = t(unitKey);
        valueText = t('campus.manager.to_next', {
            cur: b.progress.cur,
            next: b.progress.next,
            unit: unitLabel
        });
    } else if (atMax) {
        valueText = t('campus.manager.max_level');
    } else if (!built && b.requirementKey) {
        valueText = t('campus.manager.requirement', { req: t(b.requirementKey) });
    }

    // Icon color: pakai accent kalau built, mute kalau belum
    const iconBg = built ? 'var(--accent-soft)' : 'var(--bg-3)';
    const iconColor = built ? 'var(--accent)' : 'var(--text-tertiary)';
    const rowOpacity = built ? '1' : '0.65';

    return '<div class="campus-row" style="opacity:' + rowOpacity + ';">' +
        // Icon box
        '<div class="campus-row-icon" style="background:' + iconBg + ';color:' + iconColor + ';">' +
            renderIcon(b.icon, 20) +
        '</div>' +
        // Main content
        '<div class="campus-row-main">' +
            '<div class="campus-row-head">' +
                '<div class="campus-row-name">' + escapeHtml(name) + '</div>' +
                (built && atMax
                    ? '<span class="campus-row-badge max">' + t('campus.manager.max_level') + '</span>'
                    : built
                        ? '<span class="campus-row-badge">Lv ' + b.level + '</span>'
                        : '') +
            '</div>' +
            '<div class="campus-row-desc">' + escapeHtml(desc) + '</div>' +
            (built
                ? '<div class="progress" style="height:4px;margin-top:8px;">' +
                    '<div class="progress-bar" style="width:' + pct + '%;"></div>' +
                  '</div>'
                : '') +
            '<div class="campus-row-meta">' +
                '<span>' + escapeHtml(progressText) + '</span>' +
                (valueText
                    ? '<span class="campus-row-dot">·</span><span>' + escapeHtml(valueText) + '</span>'
                    : '') +
            '</div>' +
        '</div>' +
        '</div>';
}
