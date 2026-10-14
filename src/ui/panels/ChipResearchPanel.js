// FILE: src/ui/panels/ChipResearchPanel.js
// Sub-tab "Chip" dalam tab Riset.
// v2026.2 — Row-based, section-grouped (konsisten dengan Tech panel).
// v2027.13c — i18n.
import {
    CHIP_RESEARCH_CATEGORIES,
    CHIP_RESEARCH_NODES,
    getChipResearchById
} from '../../data/chip-research.data.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { renderTechNodeRow } from '../components/TechNodeCard.js';
import { t } from '../../core/LanguageService.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

let _filterCategory = 'all';
export function getChipResearchFilter() { return _filterCategory; }
export function setChipResearchFilter(cat) { _filterCategory = cat; }

// ============================================================
// MAIN RENDER
// ============================================================
export function renderChipResearchPanel(params) {
    var chipResearchSystem = params.chipResearchSystem;
    const data = window.__game.state.get();
    const cr = data.chipResearch || { active: [], completed: [], maxSlots: 1, totalCompleted: 0 };
    const active = cr.active || [];
    const maxSlots = cr.maxSlots || 1;
    const completedCount = (cr.completed || []).length;
    const total = CHIP_RESEARCH_NODES.length;

    const slotBar = _renderSlotBar(active, maxSlots, completedCount, total);
    const chipBar = _renderChipFilter();

    const allNodes = _filterCategory === 'all'
        ? CHIP_RESEARCH_NODES.slice()
        : chipResearchSystem.getNodesByCategory(_filterCategory);

    const groups = { running: [], available: [], done: [], locked: [] };
    allNodes.forEach(function (n) {
        const st = chipResearchSystem.getNodeStatus(n.id);
        const bucket = groups[st.status] || groups.locked;
        bucket.push({ node: n, status: st.status, reason: st.reason });
    });

    Object.keys(groups).forEach(function (k) {
        groups[k].sort(function (a, b) {
            if (a.node.tier !== b.node.tier) return a.node.tier - b.node.tier;
            return (a.node.minYear || 0) - (b.node.minYear || 0);
        });
    });

    let html = slotBar + chipBar;

    if (groups.running.length) {
        html += _renderNodeGroup(t('chip.research.section_running'), groups.running, active);
    }
    if (groups.available.length) {
        html += _renderNodeGroup(t('chip.research.section_available'), groups.available, active);
    }
    if (groups.done.length) {
        html += _renderCollapsibleGroup(t('chip.research.section_done'), groups.done, active);
    }
    if (groups.locked.length) {
        html += _renderCollapsibleGroup(t('chip.research.section_locked'), groups.locked, active);
    }

    if (!groups.running.length && !groups.available.length &&
        !groups.done.length && !groups.locked.length) {
        html += '<div class="empty"><div class="empty-title">' + t('research.section.empty') + '</div></div>';
    }

    return html;
}

// ============================================================
// SLOT BAR
// ============================================================
function _renderSlotBar(active, maxSlots, completedCount, total) {
    var summaryLine = t('chip.research.done_summary', { n: completedCount, total: total });

    if (!active.length) {
        return '<div class="slot-strip slot-strip-empty">' +
            '<div class="slot-strip-top">' +
                '<span class="slot-strip-label">' + t('chip.research.slot_title') + '</span>' +
                '<span class="slot-strip-count" data-chip-research-slots>0/' + maxSlots + '</span>' +
            '</div>' +
            '<div class="slot-strip-hint">' + summaryLine + '. ' + t('chip.research.empty_active') + '</div>' +
            '</div>';
    }

    var rows = active.map(function (e) {
        return '<div class="slot-strip-item">' +
            '<div class="slot-strip-item-head">' +
                '<span class="slot-strip-item-name">' + escapeHtml(e.name) + '</span>' +
                '<span class="slot-strip-item-pct" data-chip-research-pct="' + e.nodeId + '">0%</span>' +
            '</div>' +
            '<div class="progress slot-strip-item-progress">' +
                '<div class="progress-bar" data-chip-research-bar="' + e.nodeId + '" style="width:0%;"></div>' +
            '</div>' +
            '<div class="slot-strip-item-eta" data-chip-research-eta="' + e.nodeId + '">—</div>' +
            '</div>';
    }).join('');

    return '<div class="slot-strip">' +
        '<div class="slot-strip-top">' +
            '<span class="slot-strip-label">' + t('chip.research.slot_title') + '</span>' +
            '<span class="slot-strip-count" data-chip-research-slots>' + active.length + '/' + maxSlots + '</span>' +
        '</div>' +
        '<div class="slot-strip-hint">' + summaryLine + '</div>' +
        rows +
        '</div>';
}

// ============================================================
// CHIP FILTER
// ============================================================
function _renderChipFilter() {
    var chips = CHIP_RESEARCH_CATEGORIES.map(function (c) {
        var cls = 'chip ' + (_filterCategory === c.id ? 'active' : '');
        return '<button class="' + cls + '" data-chip-filter-cat="' + c.id + '">' +
            renderIcon(c.icon, 12) + ' ' + escapeHtml(c.name) +
            '</button>';
    }).join('');

    return '<div class="chip-bar">' +
        '<button class="chip ' + (_filterCategory === 'all' ? 'active' : '') + '" data-chip-filter-cat="all">' + t('timeline.filter.all') + '</button>' +
        chips +
        '</div>';
}

// ============================================================
// GROUPS
// ============================================================
function _renderNodeGroup(label, items, active) {
    var header = '<div class="section-label">' +
        '<span class="section-label-text">' + label + ' · ' + items.length + '</span>' +
        '<span class="section-label-line"></span>' +
        '</div>';

    var rows = items.map(function (it) { return _renderRow(it, active); }).join('');

    return header + '<div class="node-list">' + rows + '</div>';
}

function _renderCollapsibleGroup(label, items, active) {
    var header = '<summary class="section-summary">' +
        '<span class="section-summary-text">' + label + ' · ' + items.length + '</span>' +
        '<span class="section-summary-line"></span>' +
        '</summary>';

    var rows = items.map(function (it) { return _renderRow(it, active); }).join('');

    return '<details class="section-collapsible">' + header +
        '<div class="node-list">' + rows + '</div>' +
        '</details>';
}

function _renderRow(it, active) {
    var cat = CHIP_RESEARCH_CATEGORIES.find(function (c) { return c.id === it.node.category; });

    var pct = null, eta = null;
    if (it.status === 'running') {
        var entry = (active || []).find(function (e) { return e.nodeId === it.node.id; });
        if (entry) {
            pct = Math.round(entry.percent * 100);
            eta = t('research.slot.eta', { n: Math.ceil(entry.remainingDays) });
        }
    }

    return renderTechNodeRow({
        node: it.node,
        status: it.status,
        categoryInfo: cat,
        detailAttr: 'data-chip-node-detail',
        actionAttr: 'data-chip-research-action',
        progressPct: pct,
        progressEta: eta,
        reason: it.reason
    });
}

// ============================================================
// MODAL DETAIL NODE CHIP
// ============================================================
export function openChipNodeModal(params) {
    var nodeId = params.nodeId;
    var chipResearchSystem = params.chipResearchSystem;

    const node = getChipResearchById(nodeId);
    if (!node) return;
    const st = chipResearchSystem.getNodeStatus(nodeId);
    const cat = CHIP_RESEARCH_CATEGORIES.find(c => c.id === node.category);

    const prereqHtml = (node.prerequisites || []).length
        ? node.prerequisites.map(p => {
            const pn = getChipResearchById(p);
            const cr = window.__game.state.get().chipResearch || { completed: [] };
            const done = (cr.completed || []).indexOf(p) !== -1;
            return `<div class="sum-row"><span>${done ? '✓' : '○'} ${pn ? escapeHtml(pn.name) : p}</span><b></b></div>`;
        }).join('')
        : '<div style="font-size:12px;color:var(--text-mute);">' + t('research.node.prereq_none') + '</div>';

    const unlock = node.unlock || {};
    let unlockHtml = '';
    if (unlock.type === 'architecture') {
        unlockHtml = `<div style="font-size:12px;color:var(--text-dim);">Architecture: <b>${escapeHtml(unlock.id)}</b></div>`;
    } else if (unlock.type === 'node') {
        unlockHtml = `<div style="font-size:12px;color:var(--text-dim);">Process node: <b>${escapeHtml(unlock.id)}</b></div>`;
    } else if (unlock.type === 'feature') {
        unlockHtml = `<div style="font-size:12px;color:var(--text-dim);">Chip feature: <b>${escapeHtml(unlock.id)}</b></div>`;
    } else if (unlock.type === 'fab') {
        unlockHtml = `<div style="font-size:12px;color:var(--text-dim);">Unlocks: <b>${escapeHtml(unlock.id)}</b></div>`;
    } else if (unlock.type === 'bonus') {
        unlockHtml = `<div style="font-size:12px;color:var(--text-dim);">Bonus: <b>${escapeHtml(unlock.id)}</b></div>`;
    }

    const canStart = st.status === 'available';

    const html = `
        <div class="modal-title">${escapeHtml(node.name)}</div>
        <div class="modal-sub">${escapeHtml(node.description)}</div>
        <div class="sum-row"><span>${t('research.node.category')}</span><b>${cat ? cat.name : node.category}</b></div>
        <div class="sum-row"><span>${t('research.node.tier')}</span><b>${node.tier}</b></div>
        <div class="sum-row"><span>${t('research.node.available_year')}</span><b>${node.minYear}</b></div>
        <div class="sum-row"><span>${t('research.node.cost')}</span><b>$${node.cost.toLocaleString('en-US')}</b></div>
        <div class="sum-row"><span>${t('research.node.duration')}</span><b>${t('research.node.duration_days', { n: node.durationDays })}</b></div>
        <div class="card-title" style="margin-top:12px;">${t('research.node.prereq')}</div>
        ${prereqHtml}
        ${unlockHtml ? '<div class="card-title" style="margin-top:12px;">' + t('research.node.effects') + '</div>' + unlockHtml : ''}
        <div class="sum-row" style="margin-top:12px;"><span>${t('research.node.status')}</span><b>${st.reason || st.status}</b></div>
        ${canStart
            ? `<button class="btn-primary" data-chip-research-action="start" data-node-id="${nodeId}" style="width:100%;margin-top:12px;">${t('research.node.start')}</button>`
            : st.status === 'running'
                ? `<button class="btn-danger" data-chip-research-action="cancel" data-node-id="${nodeId}" style="width:100%;margin-top:12px;">${t('research.node.cancel')}</button>`
                : `<button class="btn-secondary" disabled style="width:100%;margin-top:12px;opacity:0.5;">${escapeHtml(st.reason || t('research.node.not_available'))}</button>`
        }
        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:8px;">${t('common.close')}</button>
    `;
    window.__game.Modal.open('chip-node-detail', html);
}
