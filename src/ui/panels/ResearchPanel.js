// FILE: src/ui/panels/ResearchPanel.js  (REPLACE)
// Tab Riset: sub-tab Teknologi | OS | Sejarah | Chip.
// v2028 — Pusat Riset:
//   • Hero ringkasan (progres global, slot, kecepatan, kas)
//   • Slot aktif + slot kosong, boost Silicon tetap ada
//   • Filter kategori dengan hitungan selesai/total
//   • Pencarian instan + sortir (tanpa render ulang halaman → fokus input aman)
//   • Kartu rekomendasi riset berikutnya
//   • Node "siap tapi tertahan" (slot penuh / kas kurang) tampil di Tersedia, bukan Terkunci
//   • Layout v2: hero → slot (kartu per slot) → dock filter sticky (cari, kategori, sortir) → daftar kartu → R&D Lanjutan (lipat)
//   • Modal detail baru: ETA, kas setelah mulai, jalur prasyarat, riset yang dibuka, bonus stat
// Kontrak atribut dengan main.js tidak berubah:
//   data-subtab, data-filter-cat, data-node-detail, data-research-action,
//   data-research-slots / -bar / -pct / -eta (live update).
import { RESEARCH_CATEGORIES, getNodeById, RESEARCH_NODES } from '../../data/research.data.js';
import { getComponentById } from '../../data/components.data.js';
import { getOsFeatureById } from '../../data/os.data.js';
import { BALANCE } from '../../data/balance.data.js';
import { renderOSPanel, openOsWizardModal, openCreateOsModal, openFeatureDetailModal } from './OSPanel.js';
import { renderTimelinePanel, getTimelineFilter, setTimelineFilter } from './TimelinePanel.js';
import {
    renderChipResearchPanel,
    getChipResearchFilter,
    setChipResearchFilter,
    openChipNodeModal
} from './ChipResearchPanel.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { renderTechNodeRow, statLabel, renderRndOverview, renderRndRow, ensureRndStyles } from '../components/TechNodeCard.js';
import { RND_TRACKS } from '../../data/research.data.js';
import { ToastService } from '../../core/ToastService.js';
import { bus } from '../../core/EventBus.js';
import { t } from '../../core/LanguageService.js';
import { renderSilResearchBlock, renderSilSlotBoost } from '../components/SilResearchBlock.js';
import { renderSilSpeedBar } from '../components/SilSpeedBar.js';
import { SiliconService } from '../../systems/SiliconService.js';
import { WalletService } from '../../systems/WalletService.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// t() dengan fallback bila key belum ada di kamus.
function _tf(key, fallback, vars) {
    var v = t(key, vars);
    return (v && v !== key) ? v : fallback;
}

function _money(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }

// ============================================================
// STATE UI (hidup selama sesi; tidak disimpan ke save)
// ============================================================
let _filterCategory = 'all';
export function getFilterCategory() { return _filterCategory; }
export function setFilterCategory(cat) { _filterCategory = cat; }

const _ui = {
    query: '',
    sort: 'tier',                 // tier | year | cost | time
    open: { done: false, locked: false, rnd: false }
};
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

// ============================================================
// PANEL UTAMA
// ============================================================
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
    _ctx.researchSystem = researchSystem;
    _ensureStyles();
    ensureRndStyles();
    _ensureHandlers();

    const data = window.__game.state.get();
    const active = data.research.active || [];
    const maxSlots = data.research.maxSlots || 1;

    // PERBAIKAN UX: Cek apakah ada riset yang tersedia di tahun ini
    const hasAvailable = RESEARCH_NODES.some(n => researchSystem.getNodeStatus(n.id).status === 'available');
    let emptyMessage = t('research.slot.hint');
    
    if (!hasAvailable && active.length === 0) {
        const nextYearNodes = RESEARCH_NODES.filter(n => data.time.currentYear < n.minYear);
        if (nextYearNodes.length) {
            const nextYear = Math.min(...nextYearNodes.map(n => n.minYear));
            emptyMessage = `Semua riset tahun ${data.time.currentYear} telah selesai. Majukan waktu ke tahun ${nextYear} untuk meriset teknologi baru.`;
        } else {
            emptyMessage = "Selamat! Semua teknologi di game ini telah diselesaikan.";
        }
    }

    return '<div class="rs-root">' +
        _renderHero(researchSystem, data) +
        _renderSlotBar(active, maxSlots, emptyMessage) +
        '<div class="rs-dock">' +
            _renderSearch() +
            _renderCategoryBar(researchSystem) +
            _renderSort() +
        '</div>' +
        '<div class="rs-body" data-rs-body>' + _renderBody(researchSystem) + '</div>' +
        _renderRndSection(researchSystem) +
        '</div>';
}

// ---------- R&D LANJUTAN (v2028.36) ----------
// Level teknologi naik terus-menerus; standar pasar juga naik tiap tahun.
function _renderRndSection(sys) {
    if (typeof sys.getRndOverview !== 'function') return '';
    var ov = sys.getRndOverview();
    var bench = sys.getBenchmark();
    var rows = RESEARCH_CATEGORIES.map(function (c) {
        var info = sys.getRefineInfo(c.id);
        var bonusLabel = statLabel((RND_TRACKS[c.id] || {}).productStat || c.id);
        return renderRndRow(info, { actionAttr: 'data-rnd-action', bonusLabel: bonusLabel, benchmark: bench });
    }).join('');
    var summaryTxt = _tf('rs.rnd.summary', 'Rata-rata Lv ' + ov.avg.toFixed(1) + ' · pasar ' + ov.benchmark.toFixed(1),
        { avg: ov.avg.toFixed(1), bench: ov.benchmark.toFixed(1) });
    return '<details class="section-collapsible rnd-card" data-rs-group="rnd"' + (_ui.open.rnd ? ' open' : '') + '>' +
        '<summary class="section-summary"><span class="section-summary-text">' + escapeHtml(t('rs.rnd.title')) + '</span>' +
        '<span class="rs-rnd-sum">' + escapeHtml(summaryTxt) + '</span><span class="section-summary-line"></span></summary>' +
        renderRndOverview(ov, { title: t('rs.rnd.level_title') }) + rows +
        '</details>';
}

// ---------- HERO ----------
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
            '<div class="rs-hero-sub">' + escapeHtml(_tf('rs.hero.progress', sum.completed + ' dari ' + sum.total + ' teknologi',
                { done: sum.completed, total: sum.total })) + '</div>' +
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

// ---------- SLOT STRIP (satu kartu per slot) ----------
function _renderSlotBar(active, maxSlots, emptyMessage) {
    emptyMessage = emptyMessage || t('research.slot.hint');
    var emptyCount = Math.max(0, maxSlots - active.length);

    var cards = active.map(function (e, i) {
        return '<div class="rs-slot is-active">' +
            '<div class="rs-slot-no">' + (i + 1) + '</div>' +
            '<div class="rs-slot-main">' +
                '<div class="rs-slot-head">' +
                    '<span class="rs-slot-name">' + escapeHtml(e.name) + '</span>' +
                    '<span class="rs-slot-pct" data-research-pct="' + escapeHtml(e.nodeId) + '">' + _pctOf(e) + '%</span>' +
                '</div>' +
                '<div class="progress rs-slot-progress">' +
                    '<div class="progress-bar" data-research-bar="' + escapeHtml(e.nodeId) + '" style="width:' + _pctOf(e) + '%;"></div>' +
                '</div>' +
                '<div class="rs-slot-foot">' +
                    '<span class="rs-slot-eta" data-research-eta="' + escapeHtml(e.nodeId) + '">' + _etaOf(e) + '</span>' +
                    '<span class="rs-slot-boost">' + renderSilSlotBoost('tech', e.nodeId, SiliconService.researchFinishCost(e)) + '</span>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');

    var emptyCards = '';
    for (var i = 0; i < emptyCount; i++) {
        emptyCards += '<div class="rs-slot rs-slot-empty">' +
            '<div class="rs-slot-no">' + (active.length + i + 1) + '</div>' +
            '<div class="rs-slot-main"><span class="rs-slot-free">' + escapeHtml(_tf('rs.slot.empty', 'Slot kosong')) + '</span></div>' +
        '</div>';
    }

    var hint = active.length
        ? ''
        : '<div class="slot-strip-hint rs-slot-hint">' + escapeHtml(emptyMessage) + '</div>';

    return '<div class="slot-strip rs-slots-wrap' + (active.length ? '' : ' slot-strip-empty') + '">' +
        '<div class="slot-strip-top">' +
            '<span class="slot-strip-label">' + t('research.slot.title') + '</span>' +
            '<span class="slot-strip-count" data-research-slots>' + active.length + '/' + maxSlots + '</span>' +
        '</div>' +
        '<div class="rs-slots">' + cards + emptyCards + '</div>' +
        hint +
        (active.length ? renderSilSpeedBar({ speed: true }) : '') +
        '</div>';
}

function _speed() {
    try { return window.__game.research._getSpeedMultiplier() || 1; } catch (e) { return 1; }
}
function _pctOf(e) {
    var dur = e.durationDays || 0, prog = e.progressDays || 0;
    return dur > 0 ? Math.round(Math.min(1, prog / dur) * 100) : 0;
}
function _etaOf(e) {
    var dur = e.durationDays || 0, prog = e.progressDays || 0;
    return t('research.slot.eta', { n: Math.ceil(Math.max(0, dur - prog) / _speed()) });
}

// ---------- FILTER KATEGORI ----------
function _renderCategoryBar(sys) {
    var sum = sys.getSummary();
    var chips = RESEARCH_CATEGORIES.map(function (c) {
        var b = sum.byCategory[c.id] || { done: 0, total: 0 };
        var cls = 'chip ' + (_filterCategory === c.id ? 'active' : '');
        return '<button class="' + cls + '" data-filter-cat="' + c.id + '">' +
            renderIcon(c.icon, 12) + ' ' + escapeHtml(c.name) +
            ' <span class="rs-chip-count">' + b.done + '/' + b.total + '</span>' +
            '</button>';
    }).join('');

    return '<div class="chip-bar">' +
        '<button class="chip ' + (_filterCategory === 'all' ? 'active' : '') + '" data-filter-cat="all">' +
            t('timeline.filter.all') + ' <span class="rs-chip-count">' + sum.completed + '/' + sum.total + '</span></button>' +
        chips +
        '</div>';
}

// ---------- TOOLBAR (cari + sortir) ----------
var SORTS = [
    { id: 'tier', key: 'rs.sort.tier', fb: 'Tier' },
    { id: 'year', key: 'rs.sort.year', fb: 'Tahun' },
    { id: 'cost', key: 'rs.sort.cost', fb: 'Termurah' },
    { id: 'time', key: 'rs.sort.time', fb: 'Tercepat' }
];

function _renderSearch() {
    return '<div class="rs-search">' +
        '<span class="rs-search-ico" aria-hidden="true">' + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' + '</span>' +
        '<input type="search" class="rs-search-input" data-rs-search autocomplete="off" spellcheck="false" ' +
            'placeholder="' + escapeHtml(_tf('rs.search.placeholder', 'Cari teknologi…')) + '" value="' + escapeHtml(_ui.query) + '">' +
        '<button type="button" class="rs-search-clear" data-rs-clear aria-label="' + escapeHtml(_tf('rs.search.clear', 'Hapus')) + '"' +
            (_ui.query ? '' : ' hidden') + '>×</button>' +
    '</div>';
}

function _renderSort() {
    var sorts = SORTS.map(function (s) {
        return '<button type="button" class="rs-sort-btn' + (_ui.sort === s.id ? ' active' : '') +
            '" data-rs-sort="' + s.id + '">' + escapeHtml(_tf(s.key, s.fb)) + '</button>';
    }).join('');
    return '<div class="rs-sort"><span class="rs-sort-label">' + escapeHtml(_tf('rs.sort.label', 'Urutkan')) + '</span>' +
        '<div class="rs-seg">' + sorts + '</div></div>';
}

// ---------- BODY (rekomendasi + grup node) — dirender ulang saat cari/sortir ----------
function _norm(s) { return String(s || '').toLowerCase(); }

function _searchText(node, cat) {
    var eff = node.effects || {};
    var parts = [node.name, node.description, cat ? cat.name : '', node.id];
    (eff.unlocksComponents || []).forEach(function (id) {
        var c = getComponentById(id); parts.push(c ? c.name : id);
    });
    (eff.unlocksOsFeatures || []).forEach(function (id) {
        var f = getOsFeatureById(id); parts.push(f ? f.name : id);
    });
    Object.keys(eff.statBonuses || {}).forEach(function (k) { parts.push(statLabel(k)); });
    return _norm(parts.join(' '));
}

function _sortItems(arr) {
    var mode = _ui.sort;
    arr.sort(function (a, b) {
        var x = a.node, y = b.node, d = 0;
        if (mode === 'cost') d = x.cost - y.cost;
        else if (mode === 'time') d = x.durationDays - y.durationDays;
        else if (mode === 'year') d = (x.minYear || 0) - (y.minYear || 0);
        if (d !== 0) return d;
        if (x.tier !== y.tier) return x.tier - y.tier;
        if ((x.minYear || 0) !== (y.minYear || 0)) return (x.minYear || 0) - (y.minYear || 0);
        return x.cost - y.cost;
    });
}

function _pickRecommended(sys, groups) {
    var r = sys.getRecommended();
    if (r) return { node: r.node, dependents: r.dependents, blocker: null };
    // Tidak ada yang langsung bisa dimulai → pilih dari yang tertahan slot/kas.
    var held = groups.ready.filter(function (it) { return it.blocker === 'slots' || it.blocker === 'cash'; });
    if (!held.length) return null;
    held.sort(function (a, b) {
        var da = sys.getDependents(a.node.id).length, db = sys.getDependents(b.node.id).length;
        if (db !== da) return db - da;
        return a.node.cost - b.node.cost;
    });
    var top = held[0];
    return { node: top.node, dependents: sys.getDependents(top.node.id).length, blocker: top.blocker };
}

function _renderBody(sys) {
    const data = window.__game.state.get();
    const active = data.research.active || [];
    const cash = data.cash || 0;
    const q = _norm(_ui.query).trim();
    const sp = sys.getSpeedInfo().speed;

    const allNodes = _filterCategory === 'all'
        ? RESEARCH_CATEGORIES.flatMap(c => sys.getNodesByCategory(c.id))
        : sys.getNodesByCategory(_filterCategory);

    const groups = { running: [], ready: [], locked: [], done: [] };
    allNodes.forEach(function (n) {
        const cat = RESEARCH_CATEGORIES.find(function (c) { return c.id === n.category; });
        if (q && _searchText(n, cat).indexOf(q) < 0) return;
        const st = sys.getNodeStatus(n.id);
        var item = { node: n, status: st.status, reason: st.reason, blocker: st.blocker || null };
        if (st.status === 'running') groups.running.push(item);
        else if (st.status === 'done') groups.done.push(item);
        else if (st.status === 'available' || st.blocker === 'slots' || st.blocker === 'cash') groups.ready.push(item);
        else groups.locked.push(item);
    });
    Object.keys(groups).forEach(function (k) { _sortItems(groups[k]); });

    const rec = (!q) ? _pickRecommended(sys, groups) : null;
    const recId = rec ? rec.node.id : null;
    const ctx = { active: active, cash: cash, speed: sp, sys: sys, recId: recId };

    let html = '';
    if (rec && (_filterCategory === 'all' || rec.node.category === _filterCategory)) {
        html += _renderRecommended(rec, ctx);
    }

    if (groups.running.length) html += _renderNodeGroup(t('research.section.running'), groups.running, ctx);
    if (groups.ready.length) {
        var held = groups.ready.filter(function (it) { return it.status !== 'available'; }).length;
        var label = t('research.section.available') +
            (held ? '  (' + held + ' ' + _tf('rs.section.blocked_note', 'tertahan') + ')' : '');
        html += _renderNodeGroup(label, groups.ready, ctx, groups.ready.length);
    }
    if (groups.locked.length) html += _renderCollapsibleGroup('locked', t('research.section.locked'), groups.locked, ctx, !!q);
    if (groups.done.length) html += _renderCollapsibleGroup('done', t('research.section.done'), groups.done, ctx, !!q);

    if (!groups.running.length && !groups.ready.length && !groups.locked.length && !groups.done.length) {
        html += q
            ? '<div class="empty"><div class="empty-title">' + escapeHtml(_tf('rs.search.none', 'Tidak ada hasil.', { q: _ui.query })) + '</div></div>'
            : '<div class="empty"><div class="empty-title">' + t('research.section.empty') + '</div></div>';
    }
    return html;
}

function _renderRecommended(rec, ctx) {
    var n = rec.node;
    var cat = RESEARCH_CATEGORIES.find(function (c) { return c.id === n.category; });
    var eta = ctx.sys.getEtaDays(n);
    var why = rec.dependents > 0
        ? _tf('rs.rec.opens', 'Membuka ' + rec.dependents + ' riset lanjutan', { n: rec.dependents })
        : _tf('rs.rec.cheap', 'Biaya terjangkau, cepat selesai');
    var note = '';
    if (rec.blocker === 'slots') note = '<div class="rs-rec-note">' + escapeHtml(_tf('rs.rec.blocked_slots', 'Slot penuh.')) + '</div>';
    else if (rec.blocker === 'cash') note = '<div class="rs-rec-note">' + escapeHtml(_tf('rs.rec.blocked_cash', 'Kas belum cukup.')) + '</div>';

    // data-node-detail HARUS di luar tombol: handler main.js mengecek detail lebih dulu daripada action.
    return '<div class="rs-rec">' +
        '<div class="rs-rec-ico" data-node-detail="' + escapeHtml(n.id) + '">' + (cat ? renderIcon(cat.icon, 18) : '') + '</div>' +
        '<div class="rs-rec-main" data-node-detail="' + escapeHtml(n.id) + '">' +
            '<div class="rs-rec-kicker">' + escapeHtml(_tf('rs.rec.title', 'Rekomendasi')) + '</div>' +
            '<div class="rs-rec-name">' + escapeHtml(n.name) + '</div>' +
            '<div class="rs-rec-why">' + escapeHtml(why) + ' · ' + _money(n.cost) + ' · ~' +
                escapeHtml(_tf('rs.row.days', eta + ' hari', { n: eta })) + '</div>' +
            note +
        '</div>' +
        '<button type="button" class="rs-rec-btn' + (rec.blocker ? ' is-held' : '') + '" data-research-action="start" data-node-id="' + escapeHtml(n.id) + '">' +
            escapeHtml(_tf('rs.rec.start', 'Mulai')) + '</button>' +
    '</div>';
}

function _renderNodeGroup(label, items, ctx) {
    var header = '<div class="section-label">' +
        '<span class="section-label-text">' + escapeHtml(label) + ' · ' + items.length + '</span>' +
        '<span class="section-label-line"></span>' +
        '</div>';
    var rows = items.map(function (it) { return _renderRow(it, ctx); }).join('');
    return header + '<div class="node-list">' + rows + '</div>';
}

function _renderCollapsibleGroup(key, label, items, ctx, forceOpen) {
    var header = '<summary class="section-summary">' +
        '<span class="section-summary-text">' + escapeHtml(label) + ' · ' + items.length + '</span>' +
        '<span class="section-summary-line"></span>' +
        '</summary>';
    var rows = items.map(function (it) { return _renderRow(it, ctx); }).join('');
    var open = (forceOpen || _ui.open[key]) ? ' open' : '';
    return '<details class="section-collapsible" data-rs-group="' + key + '"' + open + '>' + header +
        '<div class="node-list">' + rows + '</div>' +
        '</details>';
}

function _renderRow(it, ctx) {
    var n = it.node;
    var cat = RESEARCH_CATEGORIES.find(function (c) { return c.id === n.category; });

    var pct = null, eta = null;
    if (it.status === 'running') {
        var entry = (ctx.active || []).find(function (e) { return e.nodeId === n.id; });
        if (entry) {
            pct = _pctOf(entry);
            eta = _etaOf(entry);
        }
    }

    var durLabel = null;
    if (ctx.speed > 1.05) {
        durLabel = _tf('rs.row.days_eta', n.durationDays + ' hari (~' + Math.ceil(n.durationDays / ctx.speed) + ' hari efektif)',
            { n: n.durationDays, eta: Math.ceil(n.durationDays / ctx.speed) });
    }

    return renderTechNodeRow({
        node: n,
        status: it.status,
        categoryInfo: cat,
        detailAttr: 'data-node-detail',
        actionAttr: 'data-research-action',
        progressPct: pct,
        progressEta: eta,
        reason: it.reason,
        blocker: it.blocker,
        affordable: WalletService.canAfford(n.cost),
        recommended: ctx.recId === n.id && (it.status === 'available' || it.blocker === 'slots' || it.blocker === 'cash'),
        description: (it.status === 'done' || it.status === 'running') ? '' : n.description,
        durationLabel: durLabel
    });
}

// ============================================================
// INTERAKSI LOKAL (cari / sortir / buka-tutup grup)
// Dipasang sekali di document → main.js tidak perlu diubah.
// ============================================================
let _handlersBound = false;
function _refreshBody() {
    var sys = _ctx.researchSystem;
    if (!sys) return;
    var body = document.querySelector('[data-rs-body]');
    if (!body) return;
    try { body.innerHTML = _renderBody(sys); } catch (e) { console.error('[ResearchPanel] refresh body:', e); }
    var clear = document.querySelector('[data-rs-clear]');
    if (clear) clear.hidden = !_ui.query;
    document.querySelectorAll('[data-rs-sort]').forEach(function (b) {
        b.classList.toggle('active', b.dataset.rsSort === _ui.sort);
    });
}

function _ensureHandlers() {
    if (_handlersBound || typeof document === 'undefined') return;
    _handlersBound = true;

    document.addEventListener('input', function (e) {
        var inp = e.target && e.target.closest && e.target.closest('[data-rs-search]');
        if (!inp) return;
        _ui.query = inp.value || '';
        _refreshBody();
    });

    document.addEventListener('click', function (e) {
        var tg = e.target;
        if (!tg || !tg.closest) return;
        var rndBtn = tg.closest('[data-rnd-action]');
        if (rndBtn && _ctx.researchSystem) {
            e.preventDefault();
            var act = rndBtn.getAttribute('data-rnd-action');
            var cid = rndBtn.getAttribute('data-rnd-id');
            var res = act === 'cancel' ? _ctx.researchSystem.cancelRefine(cid) : _ctx.researchSystem.startRefine(cid);
            if (!res.ok) ToastService.error(res.reason);
            else ToastService.success(act === 'cancel' ? t('rs.rnd.cancelled') : t('rs.rnd.started', { lv: res.targetLevel }));
            if (window.__game && window.__game.renderSoft) window.__game.renderSoft();
            return;
        }
        var sortBtn = tg.closest('[data-rs-sort]');
        if (sortBtn) { e.preventDefault(); _ui.sort = sortBtn.dataset.rsSort; _refreshBody(); return; }
        var clear = tg.closest('[data-rs-clear]');
        if (clear) {
            e.preventDefault();
            _ui.query = '';
            var inp = document.querySelector('[data-rs-search]');
            if (inp) { inp.value = ''; inp.focus(); }
            _refreshBody();
        }
    });

    // Update progres R&D lanjutan tanpa render ulang; selesai -> render lembut.
    bus.on('research:refine-progress', function (d) {
        (d.active || []).forEach(function (r) {
            var pct = Math.round(r.percent * 100);
            var bar = document.querySelector('[data-rnd-bar="' + r.categoryId + '"]'); if (bar) bar.style.width = pct + '%';
            var pe = document.querySelector('[data-rnd-pct="' + r.categoryId + '"]'); if (pe) pe.textContent = pct + '%';
        });
    });
    bus.on('research:refined', function () {
        if (document.querySelector('.rnd-card') && window.__game && window.__game.renderSoft) window.__game.renderSoft();
    });

    // 'toggle' tidak bubble → pakai capture.
    document.addEventListener('toggle', function (e) {
        var d = e.target;
        if (!d || !d.getAttribute || !d.getAttribute('data-rs-group')) return;
        if (_ui.query) return;   // saat mencari, grup dipaksa terbuka — jangan simpan
        _ui.open[d.getAttribute('data-rs-group')] = !!d.open;
    }, true);
}

// ============================================================
// MODAL DETAIL NODE
// ============================================================
export function openNodeDetailModal(params) {
    var nodeId = params.nodeId;
    var researchSystem = params.researchSystem;
    _ensureStyles();

    const node = getNodeById(nodeId);
    if (!node) return;
    const data = window.__game.state.get();
    const st = researchSystem.getNodeStatus(nodeId);
    const cat = RESEARCH_CATEGORIES.find(c => c.id === node.category);
    const speed = researchSystem.getSpeedInfo().speed;
    const eta = researchSystem.getEtaDays(node);
    const done = data.research.completed;
    const eff = node.effects || {};

    // --- status pill ---
    const pillKey = (st.status === 'locked' && (st.blocker === 'slots' || st.blocker === 'cash')) ? 'available' : st.status;
    const pill = '<span class="rs-pill rs-pill-' + pillKey + '">' +
        escapeHtml(_tf('rs.status.' + pillKey, pillKey)) + '</span>';

    // --- kv grid ---
    const poor = !WalletService.canAfford(node.cost);
    const kv = '<div class="rs-kv">' +
        _kv(t('research.node.cost'), '<span class="' + (poor && st.status !== 'done' && st.status !== 'running' ? 'rs-neg' : '') + '">' + _money(node.cost) + '</span>') +
        _kv(t('research.node.duration'), t('research.node.duration_days', { n: node.durationDays })) +
        _kv(t('research.node.available_year'), String(node.minYear)) +
        _kv(t('research.node.tier'), 'T' + node.tier) +
    '</div>';

    // --- progress (bila berjalan) ---
    let progressHtml = '';
    if (st.status === 'running') {
        const entry = data.research.active.find(e => e.nodeId === nodeId);
        if (entry) {
            const p = _pctOf(entry);
            progressHtml = '<div class="rs-block"><div class="rs-block-title">' + escapeHtml(_tf('rs.detail.progress', 'Progres')) + ' · ' + p + '%</div>' +
                '<div class="progress"><div class="progress-bar" style="width:' + p + '%;"></div></div>' +
                '<div class="rs-muted" style="margin-top:4px;">' + escapeHtml(_etaOf(entry)) + '</div></div>';
        }
    }

    // --- finance rows (bila belum mulai) ---
    let finance = '';
    if (st.status !== 'done' && st.status !== 'running') {
        const after = data.cash - node.cost;
        finance += '<div class="sum-row"><span>' + escapeHtml(_tf('rs.detail.eta', 'Estimasi selesai')) + '</span><b>' +
            escapeHtml(_tf('rs.detail.eta_val', '~' + eta + ' hari pada ' + speed.toFixed(2) + 'x', { n: eta, x: speed.toFixed(2).replace(/\.?0+$/, '') })) + '</b></div>';
        finance += '<div class="sum-row"><span>' + escapeHtml(_tf('rs.detail.cash_after', 'Kas setelah mulai')) + '</span><b class="' + (after < 0 ? 'rs-neg' : '') + '">' + _money(after) + '</b></div>';
    }
    if (st.status === 'running') {
        const refund = Math.floor(node.cost * (BALANCE.research.refundPercent || 0));
        finance += '<div class="sum-row"><span>' + escapeHtml(_tf('rs.detail.refund', 'Pengembalian jika batal')) + '</span><b>' + _money(refund) + '</b></div>';
    }

    // --- bonus stat (bar) ---
    const sb = eff.statBonuses || {};
    const sbKeys = Object.keys(sb);
    const bonusHtml = sbKeys.length
        ? '<div class="rs-block"><div class="rs-block-title">' + escapeHtml(_tf('rs.detail.bonus', 'Bonus stat')) + '</div>' +
            sbKeys.map(function (k) {
                const w = Math.max(4, Math.min(100, Math.round(sb[k] / 90 * 100)));
                return '<div class="rs-bonus"><span>' + escapeHtml(statLabel(k)) + '</span>' +
                    '<div class="rs-bonus-bar"><i style="width:' + w + '%;"></i></div><b>+' + sb[k] + '</b></div>';
            }).join('') + '</div>'
        : '';

    // --- akses yang dibuka ---
    const chips = [];
    (eff.unlocksComponents || []).forEach(function (id) {
        const c = getComponentById(id);
        chips.push('<span class="rs-tag rs-tag-comp">' + escapeHtml(c ? c.name : id) + '</span>');
    });
    (eff.unlocksOsFeatures || []).forEach(function (id) {
        const f = getOsFeatureById(id);
        chips.push('<span class="rs-tag rs-tag-os">' + escapeHtml(f ? f.name : id) + '</span>');
    });
    const unlocksHtml = chips.length
        ? '<div class="rs-block"><div class="rs-block-title">' + escapeHtml(_tf('rs.detail.unlocks', 'Membuka akses')) + '</div><div class="rs-tags">' + chips.join('') + '</div></div>'
        : '';

    // --- prasyarat ---
    const prereqs = node.prerequisites || [];
    const prereqHtml = '<div class="rs-block"><div class="rs-block-title">' + t('research.node.prereq') + '</div>' +
        (prereqs.length
            ? prereqs.map(function (p) {
                const pn = getNodeById(p);
                const ok = done.includes(p);
                return '<div class="rs-link ' + (ok ? 'is-ok' : 'is-todo') + '"><i>' + (ok ? '✓' : '○') + '</i><span>' +
                    escapeHtml(pn ? pn.name : p) + '</span>' + (pn ? '<em>' + pn.minYear + '</em>' : '') + '</div>';
            }).join('')
            : '<div class="rs-muted">' + t('research.node.prereq_none') + '</div>') +
        '</div>';

    // --- riset yang dibuka (dependen) ---
    const deps = researchSystem.getDependents(nodeId);
    const depHtml = '<div class="rs-block"><div class="rs-block-title">' + escapeHtml(_tf('rs.detail.opens', 'Membuka riset')) + '</div>' +
        (deps.length
            ? deps.map(function (d) {
                return '<div class="rs-link is-next"><i>→</i><span>' + escapeHtml(d.name) + '</span><em>' + d.minYear + '</em></div>';
            }).join('')
            : '<div class="rs-muted">' + escapeHtml(_tf('rs.detail.opens_none', 'Ujung jalur.')) + '</div>') +
        '</div>';

    // --- tombol aksi ---
    const canStart = st.status === 'available';
    const held = st.status === 'locked' && (st.blocker === 'slots' || st.blocker === 'cash');
    const actionBtn = canStart
        ? `<button class="btn-primary" data-research-action="start" data-node-id="${escapeHtml(nodeId)}" style="width:100%;margin-top:12px;">${t('research.node.start')}</button>`
        : st.status === 'running'
            ? `<button class="btn-danger" data-research-action="cancel" data-node-id="${escapeHtml(nodeId)}" style="width:100%;margin-top:12px;">${t('research.node.cancel')}</button>`
            : held
                ? `<button class="btn-secondary" data-research-action="start" data-node-id="${escapeHtml(nodeId)}" style="width:100%;margin-top:12px;opacity:0.7;">${escapeHtml(st.reason || '')}</button>`
                : `<button class="btn-secondary" disabled style="width:100%;margin-top:12px;opacity:0.5;">${escapeHtml(st.status === 'done' ? _tf('rs.status.done', 'Selesai') : (st.reason || t('research.node.not_available')))}</button>`;

    const html = `
        <div class="rs-modal-head">
            <span class="rs-modal-ico">${cat ? renderIcon(cat.icon, 20) : ''}</span>
            <div class="rs-modal-titles">
                <div class="modal-title" style="margin:0;">${escapeHtml(node.name)}</div>
                <div class="rs-muted">${cat ? escapeHtml(cat.name) : escapeHtml(node.category)} · T${node.tier}</div>
            </div>
            ${pill}
        </div>
        <div class="modal-sub">${escapeHtml(node.description)}</div>
        ${kv}
        ${finance}
        ${progressHtml}
        ${bonusHtml}
        ${unlocksHtml}
        ${prereqHtml}
        ${depHtml}
        ${st.reason && !held ? '<div class="sum-row" style="margin-top:8px;"><span>' + t('research.node.status') + '</span><b>' + escapeHtml(st.reason) + '</b></div>' : ''}
        ${renderSilResearchBlock('tech', nodeId)}
        ${actionBtn}
        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:8px;">${t('common.close')}</button>
    `;
    window.__game.Modal.open('node-detail', html);
}

function _kv(label, value) {
    return '<div class="rs-kv-item"><span>' + escapeHtml(label) + '</span><b>' + value + '</b></div>';
}

// ============================================================
// STYLE (disuntik sekali; namespace .rs-* + sedikit tambahan .node-row-*)
// ============================================================
let _stylesInjected = false;
function _ensureStyles() {
    if (_stylesInjected || typeof document === 'undefined') return;
    _stylesInjected = true;
    var el = document.createElement('style');
    el.id = 'rs-research-styles';
    el.textContent = RS_CSS;
    document.head.appendChild(el);
}

const RS_CSS = `
.rs-root { display: block; }

/* HERO */
.rs-hero {
    display: flex; align-items: center; gap: 14px;
    padding: 14px; margin-bottom: 12px;
    background: linear-gradient(135deg, var(--bg-2), var(--bg-3));
    border: 1px solid var(--border); border-radius: var(--r-lg);
}
.rs-ring {
    --rs-deg: 0deg;
    flex: 0 0 auto; width: 68px; height: 68px; border-radius: 50%;
    background: conic-gradient(var(--accent) var(--rs-deg), var(--bg-4) 0);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 0 1px var(--border);
}
.rs-ring-in {
    width: 54px; height: 54px; border-radius: 50%; background: var(--bg-2);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-variant-numeric: tabular-nums; color: var(--text-primary);
}
.rs-hero-main { flex: 1; min-width: 0; }
.rs-hero-title { font-size: var(--fs-md); font-weight: var(--fw-bold); letter-spacing: -0.01em; color: var(--text-primary); }
.rs-hero-sub { font-size: var(--fs-xs); color: var(--text-tertiary); margin: 2px 0 8px; }
.rs-hero-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.rs-stat { background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--r); padding: 6px 8px; min-width: 0; }
.rs-stat span { display: block; font-size: 9.5px; text-transform: uppercase; letter-spacing: .6px; color: var(--text-tertiary); font-weight: var(--fw-bold); }
.rs-stat b { display: block; font-size: var(--fs-sm); color: var(--text-primary); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rs-stat em { font-style: normal; font-size: 9px; color: var(--warn); margin-left: 2px; }


/* KATEGORI */
.rs-chip-count { font-size: 10px; opacity: .75; font-variant-numeric: tabular-nums; margin-left: 2px; }

/* TOOLBAR */
.rs-search { position: relative; display: flex; align-items: center; }
.rs-search-ico { position: absolute; left: 11px; color: var(--text-tertiary); display: flex; pointer-events: none; }
.rs-search-input {
    width: 100%; box-sizing: border-box; min-height: 38px;
    padding: 8px 34px 8px 32px; font: inherit; font-size: var(--fs-base);
    background: var(--bg-2); color: var(--text-primary);
    border: 1px solid var(--border); border-radius: var(--r-md); outline: none;
    -webkit-appearance: none; appearance: none;
}
.rs-search-input::-webkit-search-cancel-button { display: none; }
.rs-search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.rs-search-clear {
    position: absolute; right: 6px; width: 26px; height: 26px; border: 0; border-radius: 50%;
    background: var(--bg-4); color: var(--text-secondary); font-size: 16px; line-height: 1; cursor: pointer;
}
.rs-search-clear[hidden] { display: none; }
/* REKOMENDASI */
.rs-rec {
    display: flex; align-items: center; gap: 10px;
    margin: 0 0 4px; padding: 10px 12px;
    background: linear-gradient(135deg, var(--accent-soft), transparent 70%), var(--bg-2);
    border: 1px solid var(--accent); border-radius: var(--r-lg);
}
.rs-rec-ico { cursor: pointer; width: 36px; height: 36px; flex: 0 0 auto; border-radius: var(--r-md); background: var(--bg-1); display: flex; align-items: center; justify-content: center; color: var(--accent); }
.rs-rec-main { cursor: pointer; flex: 1; min-width: 0; }
.rs-rec-kicker { font-size: 9.5px; font-weight: var(--fw-bold); text-transform: uppercase; letter-spacing: .8px; color: var(--accent); }
.rs-rec-name { font-size: var(--fs-md); font-weight: var(--fw-bold); color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rs-rec-why { font-size: var(--fs-xs); color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.rs-rec-note { font-size: 10.5px; color: var(--warn); margin-top: 2px; }
.rs-rec-btn { flex: 0 0 auto; padding: 8px 14px; border: 0; border-radius: var(--r-md); background: var(--accent); color: #fff; font: inherit; font-size: var(--fs-sm); font-weight: var(--fw-bold); cursor: pointer; }
.rs-rec-btn.is-held { background: var(--bg-4); color: var(--text-secondary); }

/* BARIS NODE (tambahan) */
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

/* MODAL */
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


/* SLOT: satu kartu per slot */
.rs-slots-wrap { padding: 12px; margin-bottom: 12px; border-radius: var(--r-lg); }
.rs-slots { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 8px; }
.rs-slot { display: flex; align-items: stretch; gap: 10px; padding: 10px; background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--r-md); min-width: 0; }
.rs-slot.is-active { border-color: var(--warn); background: linear-gradient(135deg, var(--warn-soft), transparent 65%), var(--bg-1); }
.rs-slot-no { flex: 0 0 auto; width: 24px; height: 24px; border-radius: 50%; background: var(--bg-4); color: var(--text-secondary); font-size: 11px; font-weight: var(--fw-bold); display: flex; align-items: center; justify-content: center; font-variant-numeric: tabular-nums; }
.rs-slot.is-active .rs-slot-no { background: var(--warn); color: #1a1a1a; }
.rs-slot-main { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.rs-slot-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 5px; }
.rs-slot-name { font-size: var(--fs-sm); font-weight: var(--fw-bold); color: var(--text-primary); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rs-slot-pct { font-size: var(--fs-sm); font-weight: var(--fw-bold); color: var(--accent); font-variant-numeric: tabular-nums; flex-shrink: 0; }
.rs-slot-progress { height: 5px; margin-bottom: 5px; }
.rs-slot-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.rs-slot-eta { font-size: 10.5px; color: var(--text-tertiary); font-variant-numeric: tabular-nums; }
.rs-slot-boost:empty { display: none; }
.rs-slot-empty { border-style: dashed; border-color: var(--border-strong); background: transparent; align-items: center; opacity: .8; }
.rs-slot-free { font-size: 11.5px; color: var(--text-tertiary); }
.rs-slot-hint { margin-top: 8px; line-height: 1.45; padding: 0 2px; }

/* DOCK FILTER (menempel di atas saat scroll) */
.rs-dock {
    position: sticky; top: 0; z-index: 5;
    display: flex; flex-direction: column; gap: 8px;
    margin: 0 -2px 12px; padding: 8px 2px 4px;
    background: var(--bg-0);
    border-bottom: 1px solid var(--border);
}
.rs-dock .chip-bar { margin-bottom: 0; padding-bottom: 2px; }
.rs-dock .chip { padding: 6px 12px; }
.rs-search { position: relative; display: flex; align-items: center; }
.rs-search-ico { position: absolute; left: 11px; color: var(--text-tertiary); display: flex; pointer-events: none; }
.rs-search-input {
    width: 100%; box-sizing: border-box; min-height: 38px;
    padding: 8px 34px 8px 32px; font: inherit; font-size: var(--fs-base);
    background: var(--bg-2); color: var(--text-primary);
    border: 1px solid var(--border); border-radius: var(--r-md); outline: none;
    -webkit-appearance: none; appearance: none;
}
.rs-search-input::-webkit-search-cancel-button { display: none; }
.rs-search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.rs-search-clear {
    position: absolute; right: 6px; width: 26px; height: 26px; border: 0; border-radius: 50%;
    background: var(--bg-4); color: var(--text-secondary); font-size: 16px; line-height: 1; cursor: pointer;
}
.rs-search-clear[hidden] { display: none; }
.rs-sort { display: flex; align-items: center; gap: 8px; }
.rs-sort-label { font-size: 10px; text-transform: uppercase; letter-spacing: .6px; color: var(--text-tertiary); font-weight: var(--fw-bold); flex-shrink: 0; }
.rs-seg { display: flex; flex: 1; min-width: 0; padding: 2px; background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--r-md); }
.rs-sort-btn {
    flex: 1; min-width: 0; padding: 5px 4px; font: inherit; font-size: var(--fs-xs); font-weight: var(--fw-semibold);
    background: transparent; color: var(--text-secondary); border: 0; border-radius: var(--r-sm); cursor: pointer;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.rs-sort-btn.active { background: var(--bg-4); color: var(--text-primary); box-shadow: inset 0 0 0 1px var(--border-strong); }

/* KARTU NODE (khusus panel Riset Teknologi; panel Chip tidak terpengaruh) */
.rs-body .section-label { margin: 16px 2px 8px; }
.rs-body .section-label:first-child { margin-top: 4px; }
.rs-body .node-list,
.rs-body .section-collapsible > .node-list {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr)); gap: 8px;
    background: transparent; border: 0; border-radius: 0; overflow: visible;
}
.rs-body .node-row-wrap {
    align-items: center; gap: 12px; padding: 12px 12px 12px 16px;
    background: var(--bg-2); border: 1px solid var(--border); border-bottom: 1px solid var(--border);
    border-radius: var(--r-lg); box-shadow: var(--shadow-sm);
}
.rs-body .node-row-wrap:last-child { border-bottom: 1px solid var(--border); }
.rs-body .node-row-wrap::before { top: 0; bottom: 0; width: 4px; border-radius: var(--r-lg) 0 0 var(--r-lg); background: var(--bg-4); }
.rs-body .node-row-wrap.node-running::before { background: var(--warn); }
.rs-body .node-row-wrap.node-available::before { background: var(--info); }
.rs-body .node-row-wrap.node-done::before { background: var(--success); }
.rs-body .node-row-wrap.node-locked::before { background: var(--bg-4); }
.rs-body .node-row-wrap.node-held::before { background: var(--warn); }
.rs-body .node-row-wrap:hover::before { width: 4px; }
.rs-body .node-row-title { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.rs-body .node-row-head { align-items: flex-start; }
.rs-body .node-row-sub { flex-direction: column; align-items: flex-start; gap: 3px; }
.rs-body .node-row-effects { display: block; }
.rs-body .node-row-foot {
    margin-top: 6px; gap: 6px; flex-wrap: wrap; align-items: center;
}
.rs-body .node-row-cost, .rs-body .node-row-dur {
    padding: 2px 8px; border-radius: var(--r-pill); background: var(--bg-3); font-size: 10.5px; line-height: 1.5;
}
.rs-body .node-row-dur { font-weight: var(--fw-semibold); }
.rs-body .node-row-dot { display: none; }
.rs-body .node-row-cost.is-poor { background: var(--danger-soft); }
.rs-body .node-row-progress { height: 5px; margin: 6px 0 2px; }
.rs-body .node-row-actions { align-self: center; padding: 0; }
.rs-body .node-row-cta { width: 38px; height: 38px; border-radius: var(--r-md); font-size: 20px; }
.rs-body .node-row-wrap.node-done { padding-top: 9px; padding-bottom: 9px; opacity: .78; }
.rs-body .node-row-wrap.node-done .node-row-sub { flex-direction: row; }
.rs-body .node-row-wrap.node-done .node-row-foot { display: none; }
.rs-body .node-row-wrap.node-locked { opacity: .62; }
.rs-body .section-collapsible > .node-list { margin-top: 8px; }
.rs-body .section-summary { padding: 8px 2px; min-height: 32px; }

/* R&D LANJUTAN (lipat, di bawah daftar) */
.rs-root > .rnd-card { margin-top: 18px; padding-top: 4px; border-top: 1px solid var(--border); }
.rs-rnd-sum { font-size: 10.5px; color: var(--text-tertiary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.rs-root > .rnd-card:not([open]) .rs-rnd-sum { color: var(--text-secondary); }

@media (max-width: 380px) {
    .rs-slots { grid-template-columns: 1fr; }
    .rs-sort-label { display: none; }
    .rs-hero { padding: 12px; gap: 10px; }
    .rs-ring { width: 58px; height: 58px; }
    .rs-ring-in { width: 46px; height: 46px; font-size: 12.5px; }
    .rs-hero-stats { gap: 6px; }
}
`;

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
