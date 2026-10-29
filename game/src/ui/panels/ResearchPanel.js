import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/panels/ResearchPanel.js  (REPLACE)
import { RESEARCH_CATEGORIES, getNodeById, RESEARCH_NODES } from '../../data/research.data.js';
import { getComponentById } from '../../data/components.data.js';
import { getOsFeatureById } from '../../data/os.data.js';
import { BALANCE } from '../../data/balance.data.js';
import { renderOSPanel, openOsWizardModal, openCreateOsModal, openFeatureDetailModal } from './OSPanel.js';
import { getTimelineFilter, setTimelineFilter } from './TimelinePanel.js';
import { renderManufacturePanel } from './ManufacturePanel.js';
import { renderFuturePanel, renderFutureTabLabel } from './FuturePanel.js';
import { renderChipResearchPanel, getChipResearchFilter, setChipResearchFilter, openChipNodeModal } from './ChipResearchPanel.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { renderTechNodeRow, statLabel, renderRndOverview, renderRndRow, ensureRndStyles } from '../components/TechNodeCard.js';
import { RND_TRACKS } from '../../data/research.data.js';
import { ToastService } from '../../core/ToastService.js';
import { bus } from '../../core/EventBus.js';
import { t } from '../../core/LanguageService.js';
import { nodeName, nodeDesc, nodeNameById, catName } from '../../data/i18n/research-localize.js';
import { renderSilResearchBlock, renderSilSlotBoost } from '../components/SilResearchBlock.js';
import { renderSilSpeedBar } from '../components/SilSpeedBar.js';
import { SiliconService } from '../../systems/SiliconService.js';
import { WalletService } from '../../systems/WalletService.js';

function _tf(key, fallback, vars) {
    var v = t(key, vars);
    return (v && v !== key) ? v : fallback;
}
function _money(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }

let _filterCategory = 'all';
export function getFilterCategory() { return _filterCategory; }
export function setFilterCategory(cat) { _filterCategory = cat; }

const _ui = { query: '', sort: 'tier', open: { done: false, locked: false } };
let _ctx = { researchSystem: null };

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
    var componentPlantSystem = params.componentPlantSystem;
    var assemblySystem = params.assemblySystem;

    const chipTabVisible = _isChipTabVisible();

    const subtabBar = `
        <div class="subtab-bar">
            <button class="subtab-btn ${subtab === 'tech'    ? 'active' : ''}" data-subtab="tech">${t('research.subtab.tech')}</button>
            <button class="subtab-btn ${subtab === 'os'      ? 'active' : ''}" data-subtab="os">${t('research.subtab.os')}</button>
            <button class="subtab-btn ${subtab === 'manufaktur' ? 'active' : ''}" data-subtab="manufaktur">${t('research.subtab.manufacture')}</button>
            <button class="subtab-btn ${subtab === 'future' ? 'active' : ''}" data-subtab="future">${renderFutureTabLabel()}</button>
            ${chipTabVisible ? `<button class="subtab-btn ${subtab === 'chip' ? 'active' : ''}" data-subtab="chip">${t('research.subtab.chip')}</button>` : ''}
        </div>
    `;

    let body = '';
    if (subtab === 'os') {
        body = renderOSPanel({ osSystem, researchSystem });
    } else if (subtab === 'future') {
        body = renderFuturePanel();
    } else if (subtab === 'manufaktur' && chipResearchSystem) {
        body = renderManufacturePanel({ chipResearchSystem, componentPlantSystem, assemblySystem });
    } else if (subtab === 'chip' && chipTabVisible && chipResearchSystem) {
        body = renderChipResearchPanel({ chipResearchSystem });
    } else {
        body = renderTechSection({ researchSystem });
    }
    return subtabBar + body;
}

function renderTechSection(params) {
    var researchSystem = params.researchSystem;
    _ctx.researchSystem = researchSystem;
    _ensureStyles();
    ensureRndStyles();
    _ensureHandlers();

    const data = window.__game.state.get();
    const active = data.research.active || [];
    const maxSlots = data.research.maxSlots || 1;

    const hasAvailable = RESEARCH_NODES.some(n => researchSystem.getNodeStatus(n.id).status === 'available');
    let emptyMessage = t('research.slot.hint');
    
    if (!hasAvailable && active.length === 0) {
        const nextYearNodes = RESEARCH_NODES.filter(n => data.time.currentYear < n.minYear);
        if (nextYearNodes.length) {
            const nextYear = Math.min(...nextYearNodes.map(n => n.minYear));
            emptyMessage = `Semua riset tahun ${data.time.currentYear} telah selesai. Majukan waktu ke tahun ${nextYear}.`;
        } else {
            emptyMessage = "Selamat! Semua teknologi di game ini telah diselesaikan.";
        }
    }

    return '<div class="rs-root">' +
        _renderHero(researchSystem, data) +
        _renderRndSection(researchSystem) +
        
        '<div class="sticky-header-area">' +
            _renderSlotBar(active, maxSlots, emptyMessage) +
            _renderCategoryBar(researchSystem) +
            _renderToolbar() +
        '</div>' +
        
        '<div class="rs-body" data-rs-body>' + _renderBody(researchSystem) + '</div>' +
        '</div>';
}

function _renderRndSection(sys) {
    if (typeof sys.getRndOverview !== 'function') return '';
    var ov = sys.getRndOverview();
    var bench = sys.getBenchmark();
    var overviewHtml = renderRndOverview(ov, { title: '' });
    
    var slotCost = typeof sys.getSlotCost === 'function' ? sys.getSlotCost() : -1;
    var canAffordSlot = slotCost !== -1 ? WalletService.canAfford(slotCost) : false;

    var rows = RESEARCH_CATEGORIES.map(function (c) {
        var info = sys.getRefineInfo(c.id);
        var bonusLabel = statLabel((RND_TRACKS[c.id] || {}).productStat || c.id);
        
        return renderRndRow(info, { 
            actionAttr: 'data-rnd-action', 
            bonusLabel: bonusLabel, 
            benchmark: bench,
            slotCost: slotCost,
            canAffordSlot: canAffordSlot
        });
    }).join('');

    return '<details class="section-collapsible rnd-card" open>' +
        '<summary class="section-summary"><span class="section-summary-text">' + escapeHtml(t('rs.rnd.title') || 'R&D Lanjutan') + '</span><span class="section-summary-line"></span></summary>' +
        overviewHtml + 
        '<div class="rnd-carousel-container">' + rows + '</div>' +
        '</details>';
}

function _renderHero(sys, data) {
    var sum = sys.getSummary();
    var sp = sys.getSpeedInfo();
    var pct = Math.round(sum.percent * 100);
    var deg = Math.round(sum.percent * 360);
    var speedTxt = sp.speed.toFixed(2).replace(/\.?0+$/, '') + 'x';

    return '<div class="rs-hero">' +
        '<div class="rs-ring" style="--rs-deg:' + deg + 'deg;" role="img" aria-label="' + pct + '%">' +
            '<div class="rs-ring-in"><b>' + pct + '%</b></div>' +
        '</div>' +
        '<div class="rs-hero-main">' +
            '<div class="rs-hero-title">' + escapeHtml(_tf('rs.hero.title', 'Pusat Riset')) + '</div>' +
            '<div class="rs-hero-sub">' + escapeHtml(_tf('rs.hero.progress', sum.completed + ' dari ' + sum.total + ' teknologi', { done: sum.completed, total: sum.total })) + '</div>' +
            '<div class="rs-hero-stats">' +
                '<div class="rs-stat"><span>' + escapeHtml(_tf('rs.hero.slots', 'Slot')) + '</span>' +
                    '<b data-rs-hero-slots>' + sum.running + '/' + sum.maxSlots + '</b></div>' +
                '<div class="rs-stat"><span>' + escapeHtml(_tf('rs.hero.speed', 'Kecepatan')) + '</span>' +
                    '<b>' + speedTxt + (sp.atCap ? ' <em>' + escapeHtml(_tf('rs.hero.speed_max', 'maks')) + '</em>' : '') + '</b></div>' +
                '<div class="rs-stat"><span>' + escapeHtml(_tf('rs.hero.cash', 'Kas')) + '</span>' +
                    '<b>' + _money(data.cash) + '</b></div>' +
            '</div>' +
        '</div>' +
    '</div>';
}

function _renderSlotBar(active, maxSlots, emptyMessage) {
    emptyMessage = emptyMessage || t('research.slot.hint');
    var emptyCount = Math.max(0, maxSlots - active.length);
    var emptySlots = '';
    for (var i = 0; i < emptyCount; i++) {
        emptySlots += '<div class="rs-slot-empty" style="line-height: 1.4; text-align: left; padding: 10px;">' + escapeHtml(emptyMessage) + '</div>';
        if (active.length) break;
    }

    if (!active.length) {
        return '<div class="slot-strip slot-strip-empty">' +
            '<div class="slot-strip-top"><span class="slot-strip-label">' + t('research.slot.title') + '</span><span class="slot-strip-count" data-research-slots>0/' + maxSlots + '</span></div>' +
            '<div class="slot-strip-hint" style="line-height: 1.4; padding: 4px 0;">' + escapeHtml(emptyMessage) + '</div></div>';
    }

    var rows = active.map(function (e) {
        return '<div class="slot-strip-item">' +
            '<div class="slot-strip-item-head"><span class="slot-strip-item-name">' + escapeHtml(nodeNameById(e.nodeId, e.name)) + '</span><span class="slot-strip-item-pct" data-research-pct="' + escapeHtml(e.nodeId) + '">' + _pctOf(e) + '%</span></div>' +
            '<div class="progress slot-strip-item-progress"><div class="progress-bar" data-research-bar="' + escapeHtml(e.nodeId) + '" style="width:' + _pctOf(e) + '%;"></div></div>' +
            '<div class="slot-strip-item-eta" data-research-eta="' + escapeHtml(e.nodeId) + '">' + _etaOf(e) + '</div>' +
            '<div class="slot-strip-item-boost">' + renderSilSlotBoost('tech', e.nodeId, SiliconService.researchFinishCost(e)) + '</div></div>';
    }).join('');

    return '<div class="slot-strip">' +
        '<div class="slot-strip-top"><span class="slot-strip-label">' + t('research.slot.title') + '</span><span class="slot-strip-count" data-research-slots>' + active.length + '/' + maxSlots + '</span></div>' +
        rows + emptySlots + renderSilSpeedBar({ speed: true }) + '</div>';
}

function _speed() { try { return window.__game.research._getSpeedMultiplier() || 1; } catch (e) { return 1; } }
function _pctOf(e) { var dur = e.durationDays || 0, prog = e.progressDays || 0; return dur > 0 ? Math.round(Math.min(1, prog / dur) * 100) : 0; }
function _etaOf(e) { var dur = e.durationDays || 0, prog = e.progressDays || 0; return t('research.slot.eta', { n: Math.ceil(Math.max(0, dur - prog) / _speed()) }); }

function _renderCategoryBar(sys) {
    var sum = sys.getSummary();
    var chips = RESEARCH_CATEGORIES.map(function (c) {
        var b = sum.byCategory[c.id] || { done: 0, total: 0 };
        var cls = 'chip ' + (_filterCategory === c.id ? 'active' : '');
        return '<button class="' + cls + '" data-filter-cat="' + c.id + '">' + renderIcon(c.icon, 12) + ' ' + escapeHtml(catName(c)) + ' <span class="rs-chip-count">' + b.done + '/' + b.total + '</span></button>';
    }).join('');

    return '<div class="chip-bar"><button class="chip ' + (_filterCategory === 'all' ? 'active' : '') + '" data-filter-cat="all">' + t('timeline.filter.all') + ' <span class="rs-chip-count">' + sum.completed + '/' + sum.total + '</span></button>' + chips + '</div>';
}

var SORTS = [
    { id: 'tier', key: 'rs.sort.tier', fb: 'Tier' }, { id: 'year', key: 'rs.sort.year', fb: 'Tahun' },
    { id: 'cost', key: 'rs.sort.cost', fb: 'Termurah' }, { id: 'time', key: 'rs.sort.time', fb: 'Tercepat' }
];

function _renderToolbar() {
    var sorts = SORTS.map(function (s) {
        return '<button type="button" class="rs-sort-btn' + (_ui.sort === s.id ? ' active' : '') + '" data-rs-sort="' + s.id + '">' + escapeHtml(_tf(s.key, s.fb)) + '</button>';
    }).join('');

    return '<div class="rs-toolbar">' +
        '<div class="rs-search"><span class="rs-search-ico">' + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' + '</span>' +
            '<input type="search" class="rs-search-input" data-rs-search autocomplete="off" spellcheck="false" placeholder="' + escapeHtml(_tf('rs.search.placeholder', 'Cari teknologi…')) + '" value="' + escapeHtml(_ui.query) + '">' +
            '<button type="button" class="rs-search-clear" data-rs-clear aria-label="' + escapeHtml(_tf('rs.search.clear', 'Hapus')) + '"' + (_ui.query ? '' : ' hidden') + '>×</button></div>' +
        '<div class="rs-sort"><span class="rs-sort-label">' + escapeHtml(_tf('rs.sort.label', 'Urutkan')) + '</span>' + sorts + '</div>' +
    '</div>';
}

function _norm(s) { return String(s || '').toLowerCase(); }
function _searchText(node, cat) {
    var eff = node.effects || {};
    var parts = [node.name, node.description, nodeName(node), nodeDesc(node), cat ? catName(cat) : '', node.id];
    (eff.unlocksComponents || []).forEach(function (id) { var c = getComponentById(id); parts.push(c ? c.name : id); });
    (eff.unlocksOsFeatures || []).forEach(function (id) { var f = getOsFeatureById(id); parts.push(f ? f.name : id); });
    Object.keys(eff.statBonuses || {}).forEach(function (k) { parts.push(statLabel(k)); });
    return _norm(parts.join(' '));
}

function _sortItems(arr) {
    var mode = _ui.sort;
    arr.sort(function (a, b) {
        var x = a.node, y = b.node, d = 0;
        if (mode === 'cost') d = x.cost - y.cost; else if (mode === 'time') d = x.durationDays - y.durationDays; else if (mode === 'year') d = (x.minYear || 0) - (y.minYear || 0);
        if (d !== 0) return d;
        if (x.tier !== y.tier) return x.tier - y.tier;
        if ((x.minYear || 0) !== (y.minYear || 0)) return (x.minYear || 0) - (y.minYear || 0);
        return x.cost - y.cost;
    });
}

function _pickRecommended(sys, groups) {
    var r = sys.getRecommended();
    if (r) return { node: r.node, dependents: r.dependents, blocker: null };
    var held = groups.ready.filter(function (it) { return it.blocker === 'slots' || it.blocker === 'cash'; });
    if (!held.length) return null;
    held.sort(function (a, b) { var da = sys.getDependents(a.node.id).length, db = sys.getDependents(b.node.id).length; if (db !== da) return db - da; return a.node.cost - b.node.cost; });
    var top = held[0];
    return { node: top.node, dependents: sys.getDependents(top.node.id).length, blocker: top.blocker };
}

function _renderBody(sys) {
    const data = window.__game.state.get();
    const active = data.research.active || [];
    const cash = data.cash || 0;
    const q = _norm(_ui.query).trim();
    const sp = sys.getSpeedInfo().speed;

    const allNodes = _filterCategory === 'all' ? RESEARCH_CATEGORIES.flatMap(c => sys.getNodesByCategory(c.id)) : sys.getNodesByCategory(_filterCategory);

    const groups = { running: [], ready: [], locked: [], done: [] };
    allNodes.forEach(function (n) {
        const cat = RESEARCH_CATEGORIES.find(function (c) { return c.id === n.category; });
        if (q && _searchText(n, cat).indexOf(q) < 0) return;
        const st = sys.getNodeStatus(n.id);
        var item = { node: n, status: st.status, reason: st.reason, blocker: st.blocker || null };
        if (st.status === 'running') groups.running.push(item); else if (st.status === 'done') groups.done.push(item); else if (st.status === 'available' || st.blocker === 'slots' || st.blocker === 'cash') groups.ready.push(item); else groups.locked.push(item);
    });
    Object.keys(groups).forEach(function (k) { _sortItems(groups[k]); });

    const rec = (!q) ? _pickRecommended(sys, groups) : null;
    const recId = rec ? rec.node.id : null;
    const ctx = { active: active, cash: cash, speed: sp, sys: sys, recId: recId };

    let html = '';
    if (rec && (_filterCategory === 'all' || rec.node.category === _filterCategory)) html += _renderRecommended(rec, ctx);
    if (groups.running.length) html += _renderNodeGroup(t('research.section.running'), groups.running, ctx);
    if (groups.ready.length) {
        var held = groups.ready.filter(function (it) { return it.status !== 'available'; }).length;
        var label = t('research.section.available') + (held ? '  (' + held + ' ' + _tf('rs.section.blocked_note', 'tertahan') + ')' : '');
        html += _renderNodeGroup(label, groups.ready, ctx, groups.ready.length);
    }
    if (groups.locked.length) html += _renderCollapsibleGroup('locked', t('research.section.locked'), groups.locked, ctx, !!q);
    if (groups.done.length) html += _renderCollapsibleGroup('done', t('research.section.done'), groups.done, ctx, !!q);

    if (!groups.running.length && !groups.ready.length && !groups.locked.length && !groups.done.length) {
        html += q ? '<div class="empty"><div class="empty-title">' + escapeHtml(_tf('rs.search.none', 'Tidak ada hasil.', { q: _ui.query })) + '</div></div>' : '<div class="empty"><div class="empty-title">' + t('research.section.empty') + '</div></div>';
    }
    return html;
}

function _renderRecommended(rec, ctx) {
    var n = rec.node; var cat = RESEARCH_CATEGORIES.find(function (c) { return c.id === n.category; }); var eta = ctx.sys.getEtaDays(n);
    var why = rec.dependents > 0 ? _tf('rs.rec.opens', 'Membuka ' + rec.dependents + ' riset lanjutan', { n: rec.dependents }) : _tf('rs.rec.cheap', 'Biaya terjangkau, cepat selesai');
    var note = ''; if (rec.blocker === 'slots') note = '<div class="rs-rec-note">' + escapeHtml(_tf('rs.rec.blocked_slots', 'Slot penuh.')) + '</div>'; else if (rec.blocker === 'cash') note = '<div class="rs-rec-note">' + escapeHtml(_tf('rs.rec.blocked_cash', 'Kas belum cukup.')) + '</div>';
    return '<div class="rs-rec"><div class="rs-rec-ico" data-node-detail="' + escapeHtml(n.id) + '">' + (cat ? renderIcon(cat.icon, 18) : '') + '</div><div class="rs-rec-main" data-node-detail="' + escapeHtml(n.id) + '"><div class="rs-rec-kicker">' + escapeHtml(_tf('rs.rec.title', 'Rekomendasi')) + '</div><div class="rs-rec-name">' + escapeHtml(nodeName(n)) + '</div><div class="rs-rec-why">' + escapeHtml(why) + ' · ' + _money(n.cost) + ' · ~' + escapeHtml(_tf('rs.row.days', eta + ' hari', { n: eta })) + '</div>' + note + '</div><button type="button" class="rs-rec-btn' + (rec.blocker ? ' is-held' : '') + '" data-research-action="start" data-node-id="' + escapeHtml(n.id) + '">' + escapeHtml(_tf('rs.rec.start', 'Mulai')) + '</button></div>';
}

function _renderNodeGroup(label, items, ctx) {
    var header = '<div class="section-label"><span class="section-label-text">' + escapeHtml(label) + ' · ' + items.length + '</span><span class="section-label-line"></span></div>';
    var rows = items.map(function (it) { return _renderRow(it, ctx); }).join('');
    return header + '<div class="node-list">' + rows + '</div>';
}

function _renderCollapsibleGroup(key, label, items, ctx, forceOpen) {
    var header = '<summary class="section-summary"><span class="section-summary-text">' + escapeHtml(label) + ' · ' + items.length + '</span><span class="section-summary-line"></span></summary>';
    var rows = items.map(function (it) { return _renderRow(it, ctx); }).join('');
    var open = (forceOpen || _ui.open[key]) ? ' open' : '';
    return '<details class="section-collapsible" data-rs-group="' + key + '"' + open + '>' + header + '<div class="node-list">' + rows + '</div></details>';
}

function _renderRow(it, ctx) {
    var n = it.node; var cat = RESEARCH_CATEGORIES.find(function (c) { return c.id === n.category; });
    var pct = null, eta = null;
    if (it.status === 'running') { var entry = (ctx.active || []).find(function (e) { return e.nodeId === n.id; }); if (entry) { pct = _pctOf(entry); eta = _etaOf(entry); } }
    var durLabel = null; if (ctx.speed > 1.05) durLabel = _tf('rs.row.days_eta', n.durationDays + ' hari (~' + Math.ceil(n.durationDays / ctx.speed) + ' hari efektif)', { n: n.durationDays, eta: Math.ceil(n.durationDays / ctx.speed) });
    return renderTechNodeRow({ node: n, status: it.status, categoryInfo: cat, detailAttr: 'data-node-detail', actionAttr: 'data-research-action', progressPct: pct, progressEta: eta, reason: it.reason, blocker: it.blocker, affordable: WalletService.canAfford(n.cost), recommended: ctx.recId === n.id && (it.status === 'available' || it.blocker === 'slots' || it.blocker === 'cash'), description: (it.status === 'done' || it.status === 'running') ? '' : nodeDesc(n), durationLabel: durLabel });
}

let _handlersBound = false;
function _refreshBody() {
    var sys = _ctx.researchSystem; if (!sys) return;
    var body = document.querySelector('[data-rs-body]'); if (!body) return;
    try { body.innerHTML = _renderBody(sys); } catch (e) { console.error('[ResearchPanel] refresh body:', e); }
    var clear = document.querySelector('[data-rs-clear]'); if (clear) clear.hidden = !_ui.query;
    document.querySelectorAll('[data-rs-sort]').forEach(function (b) { b.classList.toggle('active', b.dataset.rsSort === _ui.sort); });
}

function _ensureHandlers() {
    if (_handlersBound || typeof document === 'undefined') return;
    _handlersBound = true;
    document.addEventListener('input', function (e) {
        var inp = e.target && e.target.closest && e.target.closest('[data-rs-search]'); if (!inp) return;
        _ui.query = inp.value || ''; _refreshBody();
    });
    document.addEventListener('click', function (e) {
        var tg = e.target; if (!tg || !tg.closest) return;
        var rndBtn = tg.closest('[data-rnd-action]');
        
        if (rndBtn && _ctx.researchSystem) {
            e.preventDefault(); 
            var act = rndBtn.getAttribute('data-rnd-action'); 
            var cid = rndBtn.getAttribute('data-rnd-id');
            
            if (act === 'buy-slot') {
                if (typeof _ctx.researchSystem.buySlot === 'function') {
                    var resSlot = _ctx.researchSystem.buySlot();
                    if (!resSlot.ok) {
                        ToastService.error(resSlot.reason);
                    } else {
                        ToastService.success('Slot R&D baru berhasil dibuka!');
                        if (window.__game && window.__game.renderSoft) window.__game.renderSoft();
                    }
                }
                return;
            }
            
            var res = act === 'cancel' ? _ctx.researchSystem.cancelRefine(cid) : _ctx.researchSystem.startRefine(cid);
            if (!res.ok) ToastService.error(res.reason); else ToastService.success(act === 'cancel' ? t('rs.rnd.cancelled') : t('rs.rnd.started', { lv: res.targetLevel }));
            if (window.__game && window.__game.renderSoft) window.__game.renderSoft(); 
            return;
        }
        var sortBtn = tg.closest('[data-rs-sort]'); if (sortBtn) { e.preventDefault(); _ui.sort = sortBtn.dataset.rsSort; _refreshBody(); return; }
        var clear = tg.closest('[data-rs-clear]'); if (clear) { e.preventDefault(); _ui.query = ''; var inp = document.querySelector('[data-rs-search]'); if (inp) { inp.value = ''; inp.focus(); } _refreshBody(); }
    });
    bus.on('research:refine-progress', function (d) {
        (d.active || []).forEach(function (r) {
            var pct = Math.round(r.percent * 100);
            var bar = document.querySelector('[data-rnd-bar="' + r.categoryId + '"]'); if (bar) bar.style.width = pct + '%';
            var pe = document.querySelector('[data-rnd-pct="' + r.categoryId + '"]'); if (pe) pe.textContent = pct + '%';
        });
    });
    bus.on('research:refined', function () { if (document.querySelector('.rnd-card') && window.__game && window.__game.renderSoft) window.__game.renderSoft(); });
    document.addEventListener('toggle', function (e) {
        var d = e.target; if (!d || !d.getAttribute || !d.getAttribute('data-rs-group') || _ui.query) return;
        _ui.open[d.getAttribute('data-rs-group')] = !!d.open;
    }, true);
}

export function openNodeDetailModal(params) {
    var nodeId = params.nodeId; var researchSystem = params.researchSystem; _ensureStyles();
    const node = getNodeById(nodeId); if (!node) return;
    const data = window.__game.state.get(); const st = researchSystem.getNodeStatus(nodeId); const cat = RESEARCH_CATEGORIES.find(c => c.id === node.category); const speed = researchSystem.getSpeedInfo().speed; const eta = researchSystem.getEtaDays(node); const done = data.research.completed; const eff = node.effects || {};
    const pillKey = (st.status === 'locked' && (st.blocker === 'slots' || st.blocker === 'cash')) ? 'available' : st.status;
    const pill = '<span class="rs-pill rs-pill-' + pillKey + '">' + escapeHtml(_tf('rs.status.' + pillKey, pillKey)) + '</span>';
    const poor = !WalletService.canAfford(node.cost);
    const kv = '<div class="rs-kv">' + _kv(t('research.node.cost'), '<span class="' + (poor && st.status !== 'done' && st.status !== 'running' ? 'rs-neg' : '') + '">' + _money(node.cost) + '</span>') + _kv(t('research.node.duration'), t('research.node.duration_days', { n: node.durationDays })) + _kv(t('research.node.available_year'), String(node.minYear)) + _kv(t('research.node.tier'), 'T' + node.tier) + '</div>';
    let progressHtml = '';
    if (st.status === 'running') { const entry = data.research.active.find(e => e.nodeId === nodeId); if (entry) { const p = _pctOf(entry); progressHtml = '<div class="rs-block"><div class="rs-block-title">' + escapeHtml(_tf('rs.detail.progress', 'Progres')) + ' · ' + p + '%</div><div class="progress"><div class="progress-bar" style="width:' + p + '%;"></div></div><div class="rs-muted" style="margin-top:4px;">' + escapeHtml(_etaOf(entry)) + '</div></div>'; } }
    let finance = '';
    if (st.status !== 'done' && st.status !== 'running') { const after = data.cash - node.cost; finance += '<div class="sum-row"><span>' + escapeHtml(_tf('rs.detail.eta', 'Estimasi selesai')) + '</span><b>' + escapeHtml(_tf('rs.detail.eta_val', '~' + eta + ' hari pada ' + speed.toFixed(2) + 'x', { n: eta, x: speed.toFixed(2).replace(/\.?0+$/, '') })) + '</b></div>'; finance += '<div class="sum-row"><span>' + escapeHtml(_tf('rs.detail.cash_after', 'Kas setelah mulai')) + '</span><b class="' + (after < 0 ? 'rs-neg' : '') + '">' + _money(after) + '</b></div>'; }
    if (st.status === 'running') { const refund = Math.floor(node.cost * (BALANCE.research.refundPercent || 0)); finance += '<div class="sum-row"><span>' + escapeHtml(_tf('rs.detail.refund', 'Pengembalian jika batal')) + '</span><b>' + _money(refund) + '</b></div>'; }
    const sb = eff.statBonuses || {}; const sbKeys = Object.keys(sb);
    const bonusHtml = sbKeys.length ? '<div class="rs-block"><div class="rs-block-title">' + escapeHtml(_tf('rs.detail.bonus', 'Bonus stat')) + '</div>' + sbKeys.map(function (k) { const w = Math.max(4, Math.min(100, Math.round(sb[k] / 90 * 100))); return '<div class="rs-bonus"><span>' + escapeHtml(statLabel(k)) + '</span><div class="rs-bonus-bar"><i style="width:' + w + '%;"></i></div><b>+' + sb[k] + '</b></div>'; }).join('') + '</div>' : '';
    const chips = [];
    (eff.unlocksComponents || []).forEach(function (id) { const c = getComponentById(id); chips.push('<span class="rs-tag rs-tag-comp">' + escapeHtml(c ? c.name : id) + '</span>'); });
    (eff.unlocksOsFeatures || []).forEach(function (id) { const f = getOsFeatureById(id); chips.push('<span class="rs-tag rs-tag-os">' + escapeHtml(f ? f.name : id) + '</span>'); });
    const unlocksHtml = chips.length ? '<div class="rs-block"><div class="rs-block-title">' + escapeHtml(_tf('rs.detail.unlocks', 'Membuka akses')) + '</div><div class="rs-tags">' + chips.join('') + '</div></div>' : '';
    const prereqs = node.prerequisites || [];
    const prereqHtml = '<div class="rs-block"><div class="rs-block-title">' + t('research.node.prereq') + '</div>' + (prereqs.length ? prereqs.map(function (p) { const pn = getNodeById(p); const ok = done.includes(p); return '<div class="rs-link ' + (ok ? 'is-ok' : 'is-todo') + '"><i>' + (ok ? '✓' : '○') + '</i><span>' + escapeHtml(pn ? nodeName(pn) : p) + '</span>' + (pn ? '<em>' + pn.minYear + '</em>' : '') + '</div>'; }).join('') : '<div class="rs-muted">' + t('research.node.prereq_none') + '</div>') + '</div>';
    const deps = researchSystem.getDependents(nodeId);
    const depHtml = '<div class="rs-block"><div class="rs-block-title">' + escapeHtml(_tf('rs.detail.opens', 'Membuka riset')) + '</div>' + (deps.length ? deps.map(function (d) { return '<div class="rs-link is-next"><i>→</i><span>' + escapeHtml(nodeName(d)) + '</span><em>' + d.minYear + '</em></div>'; }).join('') : '<div class="rs-muted">' + escapeHtml(_tf('rs.detail.opens_none', 'Ujung jalur.')) + '</div>') + '</div>';
    const canStart = st.status === 'available'; const held = st.status === 'locked' && (st.blocker === 'slots' || st.blocker === 'cash');
    const actionBtn = canStart ? `<button class="btn-primary" data-research-action="start" data-node-id="${escapeHtml(nodeId)}" style="width:100%;margin-top:12px;">${t('research.node.start')}</button>` : st.status === 'running' ? `<button class="btn-danger" data-research-action="cancel" data-node-id="${escapeHtml(nodeId)}" style="width:100%;margin-top:12px;">${t('research.node.cancel')}</button>` : held ? `<button class="btn-secondary" data-research-action="start" data-node-id="${escapeHtml(nodeId)}" style="width:100%;margin-top:12px;opacity:0.7;">${escapeHtml(st.reason || '')}</button>` : `<button class="btn-secondary" disabled style="width:100%;margin-top:12px;opacity:0.5;">${escapeHtml(st.status === 'done' ? _tf('rs.status.done', 'Selesai') : (st.reason || t('research.node.not_available')))}</button>`;
    const html = `
        <div class="rs-modal-head"><span class="rs-modal-ico">${cat ? renderIcon(cat.icon, 20) : ''}</span><div class="rs-modal-titles"><div class="modal-title" style="margin:0;">${escapeHtml(nodeName(node))}</div><div class="rs-muted">${cat ? escapeHtml(cat.name) : escapeHtml(node.category)} · T${node.tier}</div></div>${pill}</div>
        <div class="modal-sub">${escapeHtml(nodeDesc(node))}</div>${kv}${finance}${progressHtml}${bonusHtml}${unlocksHtml}${prereqHtml}${depHtml}
        ${st.reason && !held ? '<div class="sum-row" style="margin-top:8px;"><span>' + t('research.node.status') + '</span><b>' + escapeHtml(st.reason) + '</b></div>' : ''}
        ${renderSilResearchBlock('tech', nodeId)}${actionBtn}<button class="btn-secondary" data-modal-close style="width:100%;margin-top:8px;">${t('common.close')}</button>
    `;
    window.__game.Modal.open('node-detail', html);
}

function _kv(label, value) { return '<div class="rs-kv-item"><span>' + escapeHtml(label) + '</span><b>' + value + '</b></div>'; }

let _stylesInjected = false;
function _ensureStyles() {
    if (_stylesInjected || typeof document === 'undefined') return; _stylesInjected = true;
    var el = document.createElement('style'); el.id = 'rs-research-styles'; el.textContent = RS_CSS; document.head.appendChild(el);
}

const RS_CSS = `
.rs-root { display: block; }
.rs-hero { display: flex; align-items: center; gap: 14px; padding: 14px; margin-bottom: 10px; background: linear-gradient(135deg, var(--bg-2), var(--bg-3)); border: 1px solid var(--border); border-radius: var(--r-lg); }
.rs-ring { --rs-deg: 0deg; flex: 0 0 auto; width: 68px; height: 68px; border-radius: 50%; background: conic-gradient(var(--accent) var(--rs-deg), var(--bg-4) 0); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 1px var(--border); }
.rs-ring-in { width: 54px; height: 54px; border-radius: 50%; background: var(--bg-2); display: flex; align-items: center; justify-content: center; font-size: 14px; font-variant-numeric: tabular-nums; color: var(--text-primary); }
.rs-hero-main { flex: 1; min-width: 0; }
.rs-hero-title { font-size: var(--fs-md); font-weight: var(--fw-bold); letter-spacing: -0.01em; color: var(--text-primary); }
.rs-hero-sub { font-size: var(--fs-xs); color: var(--text-tertiary); margin: 2px 0 8px; }
.rs-hero-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.rs-stat { background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--r); padding: 6px 8px; min-width: 0; }
.rs-stat span { display: block; font-size: 9.5px; text-transform: uppercase; letter-spacing: .6px; color: var(--text-tertiary); font-weight: var(--fw-bold); }
.rs-stat b { display: block; font-size: var(--fs-sm); color: var(--text-primary); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rs-stat em { font-style: normal; font-size: 9px; color: var(--warn); margin-left: 2px; }
.rs-slot-empty { margin-top: 8px; padding: 7px 10px; border: 1px dashed var(--border-strong); border-radius: var(--r); font-size: 11px; color: var(--text-tertiary); text-align: center; }
.rs-chip-count { font-size: 10px; opacity: .75; font-variant-numeric: tabular-nums; margin-left: 2px; }
.sticky-header-area { position: sticky; top: 0; z-index: 10; background: var(--bg-0); padding-top: 4px; padding-bottom: 8px; margin-bottom: 8px; box-shadow: 0 4px 12px -6px rgba(0,0,0,0.3); }
.rs-toolbar { display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px; }
.rs-search { position: relative; display: flex; align-items: center; }
.rs-search-ico { position: absolute; left: 11px; color: var(--text-tertiary); display: flex; pointer-events: none; }
.rs-search-input { width: 100%; box-sizing: border-box; min-height: 38px; padding: 8px 34px 8px 32px; font: inherit; font-size: var(--fs-base); background: var(--bg-2); color: var(--text-primary); border: 1px solid var(--border); border-radius: var(--r-md); outline: none; -webkit-appearance: none; appearance: none; }
.rs-search-input::-webkit-search-cancel-button { display: none; }
.rs-search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.rs-search-clear { position: absolute; right: 6px; width: 26px; height: 26px; border: 0; border-radius: 50%; background: var(--bg-4); color: var(--text-secondary); font-size: 16px; line-height: 1; cursor: pointer; }
.rs-search-clear[hidden] { display: none; }
.rs-sort { display: flex; align-items: center; gap: 6px; overflow-x: auto; scrollbar-width: none; }
.rs-sort::-webkit-scrollbar { display: none; }
.rs-sort-label { font-size: 10px; text-transform: uppercase; letter-spacing: .6px; color: var(--text-tertiary); font-weight: var(--fw-bold); flex-shrink: 0; }
.rs-sort-btn { flex-shrink: 0; padding: 4px 10px; font: inherit; font-size: var(--fs-xs); font-weight: var(--fw-semibold); background: transparent; color: var(--text-secondary); border: 1px solid var(--border); border-radius: var(--r-pill); cursor: pointer; }
.rs-sort-btn.active { background: var(--bg-4); color: var(--text-primary); border-color: var(--border-strong); }
.rs-rec { display: flex; align-items: center; gap: 10px; margin-top: 12px; padding: 10px 12px; background: linear-gradient(135deg, var(--accent-soft), transparent 70%), var(--bg-2); border: 1px solid var(--accent); border-radius: var(--r-lg); }
.rs-rec-ico { cursor: pointer; width: 36px; height: 36px; flex: 0 0 auto; border-radius: var(--r-md); background: var(--bg-1); display: flex; align-items: center; justify-content: center; color: var(--accent); }
.rs-rec-main { cursor: pointer; flex: 1; min-width: 0; }
.rs-rec-kicker { font-size: 9.5px; font-weight: var(--fw-bold); text-transform: uppercase; letter-spacing: .8px; color: var(--accent); }
.rs-rec-name { font-size: var(--fs-md); font-weight: var(--fw-bold); color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rs-rec-why { font-size: var(--fs-xs); color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.rs-rec-note { font-size: 10.5px; color: var(--warn); margin-top: 2px; }
.rs-rec-btn { flex: 0 0 auto; padding: 8px 14px; border: 0; border-radius: var(--r-md); background: var(--accent); color: #fff; font: inherit; font-size: var(--fs-sm); font-weight: var(--fw-bold); cursor: pointer; }
.rs-rec-btn.is-held { background: var(--bg-4); color: var(--text-secondary); }
.node-row-desc { font-size: 11px; color: var(--text-tertiary); line-height: 1.4; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.node-row-reason { font-size: 10.5px; color: var(--text-tertiary); margin-bottom: 4px; }
.node-row-reason.is-held { color: var(--warn); }
.node-row-rec { font-size: 9.5px; font-weight: var(--fw-bold); text-transform: uppercase; letter-spacing: .4px; color: var(--accent); background: var(--accent-soft); padding: 2px 6px; border-radius: var(--r-sm); flex-shrink: 0; }
.node-row-cost.is-poor { color: var(--danger); }
.node-row-cta-held { opacity: .45; }
.node-row-cta-done { color: var(--success); background: transparent; border-color: transparent; cursor: default; font-size: 14px; }
.node-row-wrap.node-held::before { background: var(--warn); }
.node-row-wrap.node-recommended { background: linear-gradient(90deg, var(--accent-soft), transparent 40%); }
.node-row-wrap.node-locked { opacity: .6; }
.rs-modal-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.rs-modal-ico { width: 38px; height: 38px; flex: 0 0 auto; border-radius: var(--r-md); background: var(--bg-3); display: flex; align-items: center; justify-content: center; color: var(--accent); }
.rs-modal-titles { flex: 1; min-width: 0; }
.rs-muted { font-size: 11.5px; color: var(--text-tertiary); line-height: 1.4; }
.rs-pill { flex: 0 0 auto; font-size: 10px; font-weight: var(--fw-bold); text-transform: uppercase; letter-spacing: .5px; padding: 3px 8px; border-radius: var(--r-pill); }
.rs-pill-done { background: var(--success-soft); color: var(--success); }
.rs-pill-running { background: var(--warn-soft); color: var(--warn); }
.rs-pill-available { background: var(--info-soft); color: var(--info); }
.rs-pill-locked { background: var(--bg-4); color: var(--text-tertiary); }
.rs-kv { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 10px 0; }
.rs-kv-item { background: var(--bg-3); border-radius: var(--r); padding: 8px 10px; }
.rs-kv-item > span { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: .5px; color: var(--text-tertiary); font-weight: var(--fw-bold); }
.rs-kv-item b { font-size: var(--fs-md); color: var(--text-primary); font-variant-numeric: tabular-nums; }
.rs-neg { color: var(--danger) !important; }
.rs-block { margin-top: 12px; }
.rs-block-title { font-size: 10px; font-weight: var(--fw-bold); text-transform: uppercase; letter-spacing: .7px; color: var(--text-tertiary); margin-bottom: 6px; }
.rs-bonus { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; font-size: var(--fs-sm); }
.rs-bonus span { width: 74px; flex: 0 0 auto; color: var(--text-secondary); }
.rs-bonus-bar { flex: 1; height: 6px; border-radius: var(--r-pill); background: var(--bg-4); overflow: hidden; }
.rs-bonus-bar i { display: block; height: 100%; background: linear-gradient(90deg, var(--accent-hover, var(--accent)), var(--success)); border-radius: inherit; }
.rs-bonus b { width: 34px; text-align: right; color: var(--success); font-variant-numeric: tabular-nums; }
.rs-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.rs-tag { font-size: 11px; padding: 3px 8px; border-radius: var(--r-pill); background: var(--bg-3); color: var(--text-secondary); border: 1px solid var(--border); }
.rs-tag-os { background: var(--info-soft); color: var(--info); border-color: transparent; }
.rs-link { display: flex; align-items: baseline; gap: 8px; padding: 5px 0; font-size: var(--fs-sm); border-bottom: 1px solid var(--border); }
.rs-link:last-child { border-bottom: 0; }
.rs-link i { font-style: normal; width: 14px; text-align: center; flex: 0 0 auto; }
.rs-link span { flex: 1; min-width: 0; color: var(--text-primary); }
.rs-link em { font-style: normal; font-size: 10.5px; color: var(--text-tertiary); font-variant-numeric: tabular-nums; }
.rs-link.is-ok i { color: var(--success); }
.rs-link.is-todo i { color: var(--text-tertiary); }
.rs-link.is-next i { color: var(--accent); }
@media (max-width: 380px) { .rs-hero { padding: 12px; gap: 10px; } .rs-ring { width: 58px; height: 58px; } .rs-ring-in { width: 46px; height: 46px; font-size: 12.5px; } .rs-hero-stats { gap: 6px; } }
`;

export { openOsWizardModal, openCreateOsModal, openFeatureDetailModal, getTimelineFilter, setTimelineFilter, getChipResearchFilter, setChipResearchFilter, openChipNodeModal };
