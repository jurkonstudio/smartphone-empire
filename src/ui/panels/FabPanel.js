// FILE: src/ui/panels/FabPanel.js
// ============================================================
// FabPanel — panel Fab (pabrik chip) dalam bentuk modal.
// Menampilkan: status fab, build CTA, upgrade, produksi, history.
// v2027.13c — i18n.
// ============================================================
import { Modal } from '../modal.js';
import { ToastService } from '../../core/ToastService.js';
import { state } from '../../core/GameState.js';
import { t } from '../../core/LanguageService.js';
import { renderSilSpeedBar } from '../components/SilSpeedBar.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function fabSystem() {
    return window.__game && window.__game.fab ? window.__game.fab : null;
}

function chipSystem() {
    return window.__game && window.__game.chips ? window.__game.chips : null;
}

// ============================================================
// OPEN
// ============================================================
export function openFabPanel() {
    const fs = fabSystem();
    if (!fs) { ToastService.error(t('chip.fab.system_not_ready')); return; }
    _render();
}

// ============================================================
// RENDER
// ============================================================
function _render() {
    const fs = fabSystem();
    if (!fs) return;

    const summary = fs.getFabSummary();
    const data = state.get();

    let html = '';

    if (!summary.built) {
        html = _renderBuildCTA(summary, data);
    } else {
        html = _renderBuiltFab(summary, data);
    }

    Modal.open('fab-panel', html);
    _bind();
}

// ============================================================
// BUILD CTA
// ============================================================
function _renderBuildCTA(summary, data) {
    const levels = [
        { level: 1, id: 'small',  name: 'Small Fab',   cost: 5000000,   durationDays: 90,  capacityMonthly: 5000,   description: 'Fab kecil untuk chip awal' },
        { level: 2, id: 'medium', name: 'Medium Fab',  cost: 25000000,  durationDays: 150, capacityMonthly: 50000,  description: 'Fab skala menengah' },
        { level: 3, id: 'large',  name: 'Large Fab',   cost: 120000000, durationDays: 240, capacityMonthly: 500000, description: 'Fab skala besar' },
        { level: 4, id: 'mega',   name: 'Mega Fab',    cost: 600000000, durationDays: 360, capacityMonthly: 5000000, description: 'Fab kelas industri' }
    ];

    const hasResearch = (data.research.completed || []).indexOf('fab_construction') !== -1;

    return `
        <div class="modal-title">${t('fab.build_title')}</div>
        <div class="modal-sub">${t('fab.build_sub')}</div>

        ${!hasResearch ? '<div class="fab-warning">' + t('fab.need_research') + '</div>' : ''}

        <div class="fab-tier-list">
            ${levels.map(function (lv) {
                const canAfford = data.cash >= lv.cost;
                const disabled = !hasResearch || !canAfford;
                return '<div class="fab-tier-card ' + (disabled ? 'disabled' : '') + '">' +
                    '<div class="fab-tier-head">' +
                        '<div>' +
                            '<div class="fab-tier-name">' + escapeHtml(lv.name) + '</div>' +
                            '<div class="fab-tier-desc">' + escapeHtml(lv.description) + '</div>' +
                        '</div>' +
                        '<div class="fab-tier-badge">Lv ' + lv.level + '</div>' +
                    '</div>' +
                    '<div class="fab-tier-stats">' +
                        '<div class="fab-stat">' +
                            '<div class="fab-stat-label">' + t('fab.stat_cost') + '</div>' +
                            '<div class="fab-stat-value" style="color:var(--accent);">$' + lv.cost.toLocaleString('en-US') + '</div>' +
                        '</div>' +
                        '<div class="fab-stat">' +
                            '<div class="fab-stat-label">' + t('fab.stat_duration') + '</div>' +
                            '<div class="fab-stat-value">' + lv.durationDays + '</div>' +
                        '</div>' +
                        '<div class="fab-stat">' +
                            '<div class="fab-stat-label">' + t('fab.stat_capacity') + '</div>' +
                            '<div class="fab-stat-value">' + lv.capacityMonthly.toLocaleString('en-US') + t('chip.fab.per_month') + '</div>' +
                        '</div>' +
                    '</div>' +
                    (!disabled
                        ? '<button class="btn-primary" data-fab-action="build" data-fab-level="' + lv.level + '" style="width:100%;margin-top:8px;">' + t('fab.build_btn', { name: escapeHtml(lv.name) }) + '</button>'
                        : '<button class="btn-secondary" disabled style="width:100%;margin-top:8px;opacity:0.5;">' + (!hasResearch ? t('fab.need_research_btn') : t('fab.no_money')) + '</button>'
                    ) +
                    '</div>';
            }).join('')}
        </div>

        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:8px;">${t('fab.close')}</button>
    `;
}

// ============================================================
// BUILT FAB
// ============================================================
function _renderBuiltFab(summary, data) {
    const fs = fabSystem();
    const cs = chipSystem();

    // Build/Upgrade progress
    let progressHtml = '';
    if (summary.upgrade) {
        const u = summary.upgrade;
        const pct = Math.round(Math.min(1, u.progressDays / u.durationDays) * 100);
        const title = u.isBuild
            ? t('fab.building') + ' ' + t('fab.upgrade_target', { n: u.targetLevel })
            : t('fab.upgrade_target', { n: u.targetLevel });
        progressHtml = '<div class="card" style="border-color:var(--warn);">' +
            '<div class="card-title" style="color:var(--warn);">' + title + '</div>' +
            '<div class="progress-label"><span>' + t('fab.progress') + '</span><span>' + pct + '%</span></div>' +
            '<div class="progress"><div class="progress-bar" style="width:' + pct + '%;"></div></div>' +
            '<div style="font-size:11.5px;color:var(--text-mute);margin-top:6px;">' +
                t('fab.days_left', { n: Math.max(0, Math.ceil(u.durationDays - u.progressDays)) }) +
            '</div>' +
            renderSilSpeedBar({ speed: true, finish: 'fabBuild' }) +
            '<button class="btn-danger" data-fab-action="cancel-upgrade" style="width:100%;margin-top:10px;font-size:12px;">' + t('fab.cancel_upgrade') + '</button>' +
            '</div>';
    }

    // Producing
    if (summary.producing) {
        const p = summary.producing;
        const pct = Math.round((p.progressUnits / p.totalUnits) * 100);
        progressHtml += '<div class="card" style="border-color:var(--info);">' +
            '<div class="card-title" style="color:var(--info);">' + t('fab.producing', { name: escapeHtml(p.chipName) }) + '</div>' +
            '<div class="progress-label"><span>' + t('fab.producing_units', { done: Math.floor(p.progressUnits).toLocaleString('en-US'), total: p.totalUnits.toLocaleString('en-US') }) + '</span><span>' + pct + '%</span></div>' +
            '<div class="progress"><div class="progress-bar" style="width:' + pct + '%;"></div></div>' +
            '<div style="font-size:11.5px;color:var(--text-mute);margin-top:6px;">' +
                t('fab.producing_info', { yield: Math.round(p.yieldRate * 100), days: Math.max(0, Math.ceil(p.durationDays - (p.progressUnits / p.totalUnits * p.durationDays))) }) +
            '</div>' +
            renderSilSpeedBar({ speed: !summary.upgrade, finish: 'fabProd' }) +
            '<button class="btn-danger" data-fab-action="cancel-prod" style="width:100%;margin-top:10px;font-size:12px;">' + t('fab.cancel_prod') + '</button>' +
            '</div>';
    }

    // Fab info
    const levelInfo = summary.levelInfo;
    const capacity = levelInfo ? levelInfo.capacityMonthly : 0;
    const levelName = levelInfo ? levelInfo.name : 'Fab';

    const infoCard = '<div class="card">' +
        '<div class="card-title">🏭 ' + escapeHtml(levelName) + '</div>' +
        '<div class="sum-row"><span>' + t('fab.info_level') + '</span><b>' + summary.level + '</b></div>' +
        '<div class="sum-row"><span>' + t('fab.info_capacity') + '</span><b>' + t('fab.capacity_unit', { n: capacity.toLocaleString('en-US') }) + '</b></div>' +
        '<div class="sum-row"><span>' + t('fab.info_stock') + '</span><b style="color:var(--accent);">' + summary.inventory.toLocaleString('en-US') + ' ' + t('fab.unit') + '</b></div>' +
        '<div class="sum-row"><span>' + t('fab.info_total') + '</span><b>' + summary.totalProduced.toLocaleString('en-US') + ' ' + t('fab.unit') + '</b></div>' +
        '</div>';

    // Production section
    let productionSection = '';
    if (!summary.upgrade && !summary.producing) {
        const chips = (data.chips.catalog || []);
        if (chips.length > 0) {
            productionSection = '<div class="card">' +
                '<div class="card-title">' + t('fab.start_prod') + '</div>' +
                '<div style="font-size:12px;color:var(--text-mute);margin-bottom:10px;">' +
                    t('fab.start_prod_desc', { cap: capacity.toLocaleString('en-US') }) +
                '</div>' +
                chips.slice(0, 5).map(function (c) {
                    return '<button class="wiz-option" data-fab-action="select-prod" data-chip-id="' + c.id + '" style="width:100%;margin-bottom:6px;text-align:left;">' +
                        '<div class="wiz-opt-name">' + escapeHtml(c.name) + '</div>' +
                        '<div class="wiz-opt-meta">' + t('chip.catalog.perf') + ' ' + c.stats.performance + ' • ' + t('chip.catalog.eff') + ' ' + c.stats.efficiency + ' • $' + c.stats.costPerUnit + t('chip.fab.unit') + '</div>' +
                        '</button>';
                }).join('') +
                '</div>';
        } else {
            productionSection = '<div class="card">' +
                '<div class="card-title">' + t('fab.start_prod') + '</div>' +
                '<div style="font-size:12px;color:var(--text-mute);">' + t('fab.no_chip') + '</div>' +
                '</div>';
        }
    }

    // Upgrade button
    const nextLevel = summary.level < 4 ? summary.level + 1 : null;
    const nextLevelInfo = nextLevel ? (function () {
        const levels = [
            { level: 2, name: 'Medium Fab', cost: 25000000, durationDays: 150 },
            { level: 3, name: 'Large Fab',  cost: 120000000, durationDays: 240 },
            { level: 4, name: 'Mega Fab',   cost: 600000000, durationDays: 360 }
        ];
        return levels.find(function (l) { return l.level === nextLevel; });
    })() : null;

    const upgradeSection = nextLevelInfo
        ? '<div class="card">' +
            '<div class="card-title">' + t('fab.upgrade_title') + '</div>' +
            '<div class="sum-row"><span>' + t('fab.upgrade_target_lbl') + '</span><b>' + escapeHtml(nextLevelInfo.name) + '</b></div>' +
            '<div class="sum-row"><span>' + t('fab.upgrade_cost') + '</span><b>$' + nextLevelInfo.cost.toLocaleString('en-US') + '</b></div>' +
            '<div class="sum-row"><span>' + t('fab.upgrade_duration') + '</span><b>' + nextLevelInfo.durationDays + '</b></div>' +
            '<button class="btn-primary" data-fab-action="upgrade" style="width:100%;margin-top:10px;"' +
                (data.cash < nextLevelInfo.cost ? ' disabled style="opacity:0.5;width:100%;margin-top:10px;"' : '') + '>' +
                (data.cash < nextLevelInfo.cost ? t('fab.upgrade_disabled') : t('fab.upgrade_btn')) +
            '</button>' +
            '</div>'
        : '<div class="card">' +
            '<div class="card-title">' + t('fab.upgrade_title') + '</div>' +
            '<div style="font-size:12px;color:var(--text-mute);">' + t('fab.upgrade_max') + '</div>' +
            '</div>';

    // History
    const historyHtml = summary.history.length
        ? '<div class="card">' +
            '<div class="card-title">' + t('fab.history_title') + '</div>' +
            summary.history.map(function (h) {
                return '<div class="sum-row">' +
                    '<span>' + escapeHtml(h.chipName) + '</span>' +
                    '<b>' + h.qty.toLocaleString('en-US') + ' ' + t('fab.unit') + '</b>' +
                    '</div>';
            }).join('') +
            '</div>'
        : '';

    return `
        <div class="modal-title">${t('fab.title')}</div>
        <div class="modal-sub">${t('fab.sub')}</div>
        ${progressHtml}
        ${infoCard}
        ${productionSection}
        ${upgradeSection}
        ${historyHtml}
        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:8px;">${t('fab.close')}</button>
    `;
}

// ============================================================
// BIND
// ============================================================
function _bind() {
    // Handler dipasang via event delegation global di main.js
}

// ============================================================
// PRODUCTION QTY MODAL
// ============================================================
export function openProductionQtyModal(chipId) {
    const cs = chipSystem();
    const fs = fabSystem();
    if (!cs || !fs) return;

    const chip = cs.getChipById(chipId);
    if (!chip) { ToastService.error('Chip not found.'); return; }

    const summary = fs.getFabSummary();
    const capacity = summary.levelInfo ? summary.levelInfo.capacityMonthly : 5000;
    const defaultQty = Math.min(capacity, 5000);

    const html = `
        <div class="modal-title">${t('fab.prod_qty_title', { name: escapeHtml(chip.name) })}</div>
        <div class="modal-sub">${t('fab.prod_qty_sub')}</div>
        <label class="field-label">${t('fab.prod_qty_label')}</label>
        <input class="field-input" data-prod-qty type="number" min="100" step="100" value="${defaultQty}" />
        <div class="sum-row" style="margin-top:8px;"><span>${t('fab.prod_qty_capacity')}</span><b>${capacity.toLocaleString('en-US')}${t('chip.fab.per_month')}</b></div>
        <div class="sum-row"><span>${t('fab.prod_qty_cost')}</span><b>$${chip.stats.costPerUnit}</b></div>
        <div class="sum-row"><span>${t('fab.prod_qty_yield')}</span><b>${Math.round(chip.yieldRate * 100)}%</b></div>
        <div class="sum-row total"><span>${t('fab.prod_qty_estimate')}</span><b data-prod-total>$0</b></div>
        <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn-secondary" data-modal-close style="flex:1;">${t('fab.prod_qty_cancel')}</button>
            <button class="btn-primary" data-fab-action="confirm-prod" data-chip-id="${chipId}" style="flex:1;">${t('fab.prod_qty_confirm')}</button>
        </div>
    `;
    Modal.open('fab-prod-qty', html);

    const root = document.querySelector('[data-modal-id="fab-prod-qty"]');
    const input = root.querySelector('[data-prod-qty]');
    const totalEl = root.querySelector('[data-prod-total]');
    const refresh = function () {
        const q = parseInt(input.value, 10) || 0;
        const effective = Math.ceil(q / chip.yieldRate);
        totalEl.textContent = '$' + (effective * chip.stats.costPerUnit).toLocaleString('en-US');
    };
    input.addEventListener('input', refresh);
    refresh();
}
