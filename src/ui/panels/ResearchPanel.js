// FILE: src/ui/panels/ResearchPanel.js
// Tab Riset: sub-tab Teknologi | OS | Sejarah | Chip.
// v2026.2 — Row-based, section-grouped (Sim Companies style).
// v2027.13c — i18n.
import { RESEARCH_CATEGORIES, getNodeById } from '../../data/research.data.js';
import { renderOSPanel, openOsWizardModal, openCreateOsModal, openFeatureDetailModal } from './OSPanel.js';
import { renderTimelinePanel, getTimelineFilter, setTimelineFilter } from './TimelinePanel.js';
import {
    renderChipResearchPanel,
    getChipResearchFilter,
    setChipResearchFilter,
    openChipNodeModal
} from './ChipResearchPanel.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { renderTechNodeRow } from '../components/TechNodeCard.js';
import { t } from '../../core/LanguageService.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

let _filterCategory = 'all';
export function getFilterCategory() { return _filterCategory; }
export function setFilterCategory(cat) { _filterCategory = cat; }

function _isChipTabVisible() {
    try {
        const data = window.__game.state.get();
        if (data.time && data.time.currentYear >= 2003) return true;
        if (data.chipResearch && data.chipResearch.completed && data.chipResearch.completed.length > 0) return true;
        if (data.chips && data.chips.catalog && data.chips.catalog.length > 0) return true;
        return false;
    } catch (e) { return false; }
}

export function renderResearchPanel(params) {
    var subtab = params.subtab;
    var researchSystem = params.researchSystem;
    var osSystem = params.osSystem;
    var chipResearchSystem = params.chipResearchSystem;

    const chipTabVisible = _isChipTabVisible();

    const subtabBar = `
        <div class="subtab-bar">
            <button class="subtab-btn ${subtab === 'tech'    ? 'active' : ''}" data-subtab="tech">${t('research.subtab.tech')}</button>
            <button class="subtab-btn ${subtab === 'os'      ? 'active' : ''}" data-subtab="os">${t('research.subtab.os')}</button>
            <button class="subtab-btn ${subtab === 'sejarah' ? 'active' : ''}" data-subtab="sejarah">${t('research.subtab.history')}</button>
            ${chipTabVisible ? `<button class="subtab-btn ${subtab === 'chip' ? 'active' : ''}" data-subtab="chip">${t('research.subtab.chip')}</button>` : ''}
        </div>
    `;

    let body = '';
    if (subtab === 'os') {
        body = renderOSPanel({ osSystem, researchSystem });
    } else if (subtab === 'sejarah') {
        body = renderTimelinePanel();
    } else if (subtab === 'chip' && chipTabVisible && chipResearchSystem) {
        body = renderChipResearchPanel({ chipResearchSystem });
    } else {
        body = renderTechSection({ researchSystem });
    }
    return subtabBar + body;
}

// ============================================================
// TECH SECTION
// ============================================================
function renderTechSection(params) {
    var researchSystem = params.researchSystem;
    const data = window.__game.state.get();
    const active = data.research.active || [];
    const maxSlots = data.research.maxSlots || 1;

    const slotBar = _renderSlotBar(active, maxSlots);
    const chipBar = _renderChipFilter();

    const allNodes = _filterCategory === 'all'
        ? RESEARCH_CATEGORIES.flatMap(c => researchSystem.getNodesByCategory(c.id))
        : researchSystem.getNodesByCategory(_filterCategory);

    const groups = { running: [], available: [], done: [], locked: [] };
    allNodes.forEach(function (n) {
        const st = researchSystem.getNodeStatus(n.id);
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
        html += _renderNodeGroup(t('research.section.running'), groups.running, active);
    }
    if (groups.available.length) {
        html += _renderNodeGroup(t('research.section.available'), groups.available, active);
    }
    if (groups.done.length) {
        html += _renderCollapsibleGroup(t('research.section.done'), groups.done, active);
    }
    if (groups.locked.length) {
        html += _renderCollapsibleGroup(t('research.section.locked'), groups.locked, active);
    }

    if (!groups.running.length && !groups.available.length &&
        !groups.done.length && !groups.locked.length) {
        html += '<div class="empty"><div class="empty-title">' + t('research.section.empty') + '</div></div>';
    }

    return html;
}

function _renderSlotBar(active, maxSlots) {
    if (!active.length) {
        return '<div class="slot-strip slot-strip-empty">' +
            '<div class="slot-strip-top">' +
                '<span class="slot-strip-label">' + t('research.slot.title') + '</span>' +
                '<span class="slot-strip-count" data-research-slots>0/' + maxSlots + '</span>' +
            '</div>' +
            '<div class="slot-strip-hint">' + t('research.slot.hint') + '</div>' +
            '</div>';
    }

    var rows = active.map(function (e) {
        return '<div class="slot-strip-item">' +
            '<div class="slot-strip-item-head">' +
                '<span class="slot-strip-item-name">' + escapeHtml(e.name) + '</span>' +
                '<span class="slot-strip-item-pct" data-research-pct="' + e.nodeId + '">0%</span>' +
            '</div>' +
            '<div class="progress slot-strip-item-progress">' +
                '<div class="progress-bar" data-research-bar="' + e.nodeId + '" style="width:0%;"></div>' +
            '</div>' +
            '<div class="slot-strip-item-eta" data-research-eta="' + e.nodeId + '">—</div>' +
            '</div>';
    }).join('');

    return '<div class="slot-strip">' +
        '<div class="slot-strip-top">' +
            '<span class="slot-strip-label">' + t('research.slot.title') + '</span>' +
            '<span class="slot-strip-count" data-research-slots>' + active.length + '/' + maxSlots + '</span>' +
        '</div>' +
        rows +
        '</div>';
}

function _renderChipFilter() {
    var chips = RESEARCH_CATEGORIES.map(function (c) {
        var cls = 'chip ' + (_filterCategory === c.id ? 'active' : '');
        return '<button class="' + cls + '" data-filter-cat="' + c.id + '">' +
            renderIcon(c.icon, 12) + ' ' + escapeHtml(c.name) +
            '</button>';
    }).join('');

    return '<div class="chip-bar">' +
        '<button class="chip ' + (_filterCategory === 'all' ? 'active' : '') + '" data-filter-cat="all">' + t('timeline.filter.all') + '</button>' +
        chips +
        '</div>';
}

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
    var cat = RESEARCH_CATEGORIES.find(function (c) { return c.id === it.node.category; });

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
        detailAttr: 'data-node-detail',
        actionAttr: 'data-research-action',
        progressPct: pct,
        progressEta: eta,
        reason: it.reason
    });
}

// ============================================================
// MODAL DETAIL NODE
// ============================================================
export function openNodeDetailModal(params) {
    var nodeId = params.nodeId;
    var researchSystem = params.researchSystem;

    const node = getNodeById(nodeId);
    if (!node) return;
    const st = researchSystem.getNodeStatus(nodeId);
    const cat = RESEARCH_CATEGORIES.find(c => c.id === node.category);

    const prereqHtml = (node.prerequisites || []).length
        ? node.prerequisites.map(p => {
            const pn = getNodeById(p);
            const done = window.__game.state.get().research.completed.includes(p);
            return `<div class="sum-row"><span>${done ? '✓' : '○'} ${pn ? escapeHtml(pn.name) : p}</span><b></b></div>`;
        }).join('')
        : '<div style="font-size:12px;color:var(--text-mute);">' + t('research.node.prereq_none') + '</div>';

    const eff = node.effects || {};
    const unlockComps = (eff.unlocksComponents || []).length
        ? `<div style="font-size:12px;color:var(--text-dim);">${t('research.node.effects_comp', { list: eff.unlocksComponents.join(', ') })}</div>` : '';
    const unlockFeat = (eff.unlocksOsFeatures || []).length
        ? `<div style="font-size:12px;color:var(--text-dim);">${t('research.node.effects_feat', { list: eff.unlocksOsFeatures.join(', ') })}</div>` : '';

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
        ${unlockComps || unlockFeat ? '<div class="card-title" style="margin-top:12px;">' + t('research.node.effects') + '</div>' + unlockComps + unlockFeat : ''}
        <div class="sum-row" style="margin-top:12px;"><span>${t('research.node.status')}</span><b>${st.reason || st.status}</b></div>
        ${canStart
            ? `<button class="btn-primary" data-research-action="start" data-node-id="${nodeId}" style="width:100%;margin-top:12px;">${t('research.node.start')}</button>`
            : st.status === 'running'
                ? `<button class="btn-danger" data-research-action="cancel" data-node-id="${nodeId}" style="width:100%;margin-top:12px;">${t('research.node.cancel')}</button>`
                : `<button class="btn-secondary" disabled style="width:100%;margin-top:12px;opacity:0.5;">${escapeHtml(st.reason || t('research.node.not_available'))}</button>`
        }
        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:8px;">${t('common.close')}</button>
    `;
    window.__game.Modal.open('node-detail', html);
}

export {
    openOsWizardModal,
    openCreateOsModal,
    openFeatureDetailModal,
    getTimelineFilter,
    setTimelineFilter,
    getChipResearchFilter,
    setChipResearchFilter,
    openChipNodeModal
};
