import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/panels/ProductPanel.js
// Versi LENGKAP — V6c-2 gate chip berbasis chipResearch + grandfather rule.
// v2027.13c — i18n.
// v2027.50 — i18n tuntas: fallback error, label lifecycle chip, nama tier fab,
//           nama kampanye, meta kampanye, aria-label; + listener lang:changed
//           untuk modal detail/kampanye/order yang sedang terbuka.
// v2029.7 — [FIX OS NAME] Menampilkan nama OS/Lisensi yang rapi di detail produk, bukan ID mentah.
import { renderSalesChart } from './SalesChart.js';
import { getComponentById } from '../../data/components.data.js';
import { getLicenseById } from '../../data/os.data.js'; // [FIX] Import data lisensi OS
import { state } from '../../core/GameState.js';
import { ToastService } from '../../core/ToastService.js';
import { openChipDesigner } from './ChipDesignerPanel.js';
import { openFabPanel, openProductionQtyModal } from './FabPanel.js';
import { renderChipMockup } from '../phone/ChipMockup.js';
import { t } from '../../core/LanguageService.js';
import { bus } from '../../core/EventBus.js';
import { renderSilSpeedBar } from '../components/SilSpeedBar.js';


function safe(fn, fallback) {
    try { return fn(); }
    catch (err) {
        console.error('[ProductPanel] section error:', err);
        return fallback || '<div class="card" style="border-color:var(--danger);"><div class="card-title" style="color:var(--danger);">' + tx('prod.error', 'Error') + '</div><div style="font-size:12px;color:var(--text-dim);">' + escapeHtml(err.message || tx('prod.error_unknown', 'tidak diketahui')) + '</div></div>';
    }
}

// [FIX] Fungsi untuk menerjemahkan ID OS menjadi nama yang rapi
function _getOsDisplayName(osOptionId) {
    if (!osOptionId) return '-';
    
    // Jika menggunakan OS milik sendiri (own:versi_id)
    if (osOptionId.startsWith('own:')) {
        const versionId = osOptionId.slice(4);
        const osData = state.get().os || {};
        const versions = osData.versions || [];
        const v = versions.find(x => x.id === versionId);
        return v ? (v.versionString || v.name || 'OS Milik Sendiri') : 'OS Milik Sendiri';
    }
    
    // Jika menggunakan lisensi pihak ketiga (license:lis_xxx)
    if (osOptionId.startsWith('license:')) {
        const licenseId = osOptionId.slice(8);
        const lic = getLicenseById(licenseId);
        return lic ? lic.name : osOptionId;
    }
    
    return osOptionId;
}

// ============================================================
// GATE CHIP LAB
// ============================================================
function isChipLabUnlocked() {
    try {
        var data = state.get();
        if (!data) return false;
        if (data.chips && Array.isArray(data.chips.catalog) && data.chips.catalog.length > 0) return true;
        var cr = data.chipResearch;
        if (cr && Array.isArray(cr.completed) && cr.completed.length > 0) {
            return cr.completed.indexOf('chip_design_tool') !== -1;
        }
        if (!data.time) return false;
        return (data.time.currentYear >= 2003);
    } catch (e) {
        return false;
    }
}

// ============================================================
// GATE FAB
// ============================================================
function isFabUnlocked() {
    try {
        var data = state.get();
        if (!data) return false;
        if (data.fab && data.fab.built) return true;
        var cr = data.chipResearch;
        if (cr && Array.isArray(cr.completed)) {
            if (cr.completed.indexOf('fab_construction') !== -1) return true;
        }
        if (data.research && Array.isArray(data.research.completed)) {
            if (data.research.completed.indexOf('fab_construction') !== -1) return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

// ============================================================
// MAIN RENDER
// ============================================================
export function renderProductPanel(params) {
    params = params || {};
    var subtab = params.subtab || 'design';
    var productSystem = params.productSystem;
    var researchSystem = params.researchSystem;
    var osSystem = params.osSystem;

    var chipUnlocked = isChipLabUnlocked();
    if (subtab === 'chip' && !chipUnlocked) subtab = 'design';

    var subtabs = [
        { id: 'design',  label: t('prod.subtab.design') },
        { id: 'catalog', label: t('prod.subtab.catalog') },
        { id: 'sales',   label: t('prod.subtab.sales') }
    ];
    if (chipUnlocked) subtabs.push({ id: 'chip', label: t('prod.subtab.chip') });

    var subtabBar = '<div class="subtab-bar">';
    for (var i = 0; i < subtabs.length; i++) {
        var tb = subtabs[i];
        subtabBar += '<button class="subtab-btn ' + (subtab === tb.id ? 'active' : '') + '" data-prod-subtab="' + tb.id + '">' + tb.label + '</button>';
    }
    subtabBar += '</div>';

    var body = '';
    if (subtab === 'catalog') {
        body = safe(function () { return _renderCatalog(); }, '<div class="empty"><div class="empty-title">' + tx('prod.error', 'Error') + '</div></div>');
    } else if (subtab === 'sales') {
        body = safe(function () { return _renderSales(); }, '<div class="empty"><div class="empty-title">' + tx('prod.error', 'Error') + '</div></div>');
    } else if (subtab === 'chip') {
        body = safe(function () { return _renderChipTab(); }, '<div class="empty"><div class="empty-title">' + tx('prod.error', 'Error') + '</div></div>');
    } else {
        body = safe(function () { return _renderDesignTab(productSystem); }, '<div class="empty"><div class="empty-title">' + tx('prod.error', 'Error') + '</div></div>');
    }

    return subtabBar + body;
}

// ============================================================
// SUB-TAB DESAIN
// ============================================================
function _renderDesignTab(productSystem) {
    var data = state.get();
    var dev = data.products ? data.products.development : null;

    if (dev) {
        var phaseKey = {
            design: 'prod.phase.design',
            prototype: 'prod.phase.prototype',
            production: 'prod.phase.production',
            released: 'prod.phase.released'
        }[dev.phase] || dev.phase;
        var phaseLabel = t(phaseKey);
        var phaseIndex = { design: 1, prototype: 2, production: 3, released: 4 };
        var percent = ((phaseIndex[dev.phase] - 1) * 25) + Math.min(25, (dev.phaseProgressDays / dev.phaseDurationDays) * 25);

        return '<div class="card">' +
            '<div class="card-title">' + t('prod.design.dev_title') + '</div>' +
            '<div style="font-size:16px;font-weight:700;margin-bottom:6px;">' + escapeHtml(dev.name) + '</div>' +
            '<div style="font-size:12px;color:var(--text-dim);margin-bottom:10px;">' + t('prod.design.dev_phase', { phase: phaseLabel, days: dev.totalDurationDays }) + '</div>' +
            '<div class="progress-label"><span data-prod-dev-phase>' + phaseLabel + '</span><span data-prod-dev-pct>' + Math.round(percent) + '%</span></div>' +
            '<div class="progress"><div class="progress-bar" data-prod-dev-bar style="width:' + Math.round(percent) + '%;"></div></div>' +
            '<div style="font-size:11.5px;color:var(--text-mute);margin-top:8px;" data-prod-dev-eta>' + t('prod.design.dev_eta') + '</div>' +
            renderSilSpeedBar({ speed: true, finish: 'dev' }) +
            '<button class="btn-danger" data-prod-action="cancel-dev" style="margin-top:12px;width:100%;">' + t('prod.design.cancel') + '</button>' +
            '</div>';
    }

    return '<div class="card">' +
        '<div class="card-title">' + t('prod.design.title') + '</div>' +
        '<div style="font-size:12.5px;color:var(--text-dim);line-height:1.6;margin-bottom:12px;">' + t('prod.design.desc') + '</div>' +
        '<button class="btn-primary" data-prod-action="open-wizard" style="width:100%;">' + t('prod.design.start') + '</button>' +
        '</div>';
}

// ============================================================
// SUB-TAB KATALOG
// ============================================================
// Fallback teks bila kunci i18n belum ada (t() mengembalikan key apa adanya).
function tx(key, fallback, vars) {
    var v = t(key, vars);
    if (v !== key) return v;
    return String(fallback).replace(/\{(\w+)\}/g, function (m, k) {
        return (vars && Object.prototype.hasOwnProperty.call(vars, k)) ? String(vars[k]) : m;
    });
}

var _catalogFilter = 'all';     // all | selling | disc
var _catalogSort = 'newest';    // newest | sold | rating | stock

export function setCatalogView(kind, value) {
    if (kind === 'filter') _catalogFilter = value;
    else if (kind === 'sort') _catalogSort = value;
}

function _avgReview(p) {
    return (p.reviews && p.reviews.length)
        ? p.reviews.reduce(function (s, r) { return s + r.score; }, 0) / p.reviews.length : null;
}

function _stockPct(p) {
    var cap = p.baseCapacity || p.totalProduced || 0;
    if (cap <= 0) return p.stock > 0 ? 100 : 0;
    return Math.max(0, Math.min(100, Math.round((p.stock / cap) * 100)));
}

function _renderCatalog() {
    var data = state.get();
    var catalog = (data.products && data.products.catalog) ? data.products.catalog : [];
    if (!catalog.length) {
        return '<div class="empty"><div class="empty-ico">📦</div><div class="empty-title">' + t('prod.catalog.empty') + '</div><div class="empty-desc">' + t('prod.catalog.empty_desc') + '</div></div>';
    }

    var selling = catalog.filter(function (p) { return p.status === 'selling'; });
    var lowStock = selling.filter(function (p) { return p.stock <= 0 || _stockPct(p) < 20; }).length;
    var totalRev = catalog.reduce(function (s, p) { return s + (p.totalRevenue || 0); }, 0);
    var summary = '<div class="kpi-grid cat-summary">' +
        '<div class="kpi"><div class="kpi-label">' + tx('prod.catalog.sum_active', 'Dijual') + '</div><div class="kpi-value">' + selling.length + '/' + catalog.length + '</div></div>' +
        '<div class="kpi ' + (lowStock ? 'warn' : 'blue') + '"><div class="kpi-label">' + tx('prod.catalog.sum_low', 'Stok menipis') + '</div><div class="kpi-value">' + lowStock + '</div></div>' +
        '<div class="kpi"><div class="kpi-label">' + tx('prod.catalog.sum_rev', 'Pendapatan') + '</div><div class="kpi-value" style="font-size:14px;">$' + totalRev.toLocaleString('en-US') + '</div></div>' +
        '</div>';

    var filters = [['all', tx('prod.catalog.f_all', 'Semua')], ['selling', t('prod.catalog.status_selling')], ['disc', t('prod.catalog.status_discontinued')]];
    var sorts = [['newest', tx('prod.catalog.s_new', 'Terbaru')], ['sold', tx('prod.catalog.s_sold', 'Terlaris')], ['rating', tx('prod.catalog.s_rating', 'Rating')], ['stock', tx('prod.catalog.s_stock', 'Stok')]];
    var bar = '<div class="cat-chips">';
    filters.forEach(function (f) { bar += '<button class="chip-small ' + (_catalogFilter === f[0] ? 'active' : '') + '" data-catalog-filter="' + f[0] + '">' + f[1] + '</button>'; });
    bar += '</div><div class="cat-chips">';
    sorts.forEach(function (f) { bar += '<button class="chip-small ' + (_catalogSort === f[0] ? 'active' : '') + '" data-catalog-sort="' + f[0] + '">' + f[1] + '</button>'; });
    bar += '</div>';

    var list = catalog.slice().filter(function (p) {
        if (_catalogFilter === 'selling') return p.status === 'selling';
        if (_catalogFilter === 'disc') return p.status !== 'selling';
        return true;
    });
    list.sort(function (a, b) {
        if (_catalogSort === 'sold') return (b.totalSold || 0) - (a.totalSold || 0);
        if (_catalogSort === 'rating') return (_avgReview(b) || 0) - (_avgReview(a) || 0);
        if (_catalogSort === 'stock') return (a.stock || 0) - (b.stock || 0);
        return (b.releaseGameMinute || 0) - (a.releaseGameMinute || 0);
    });
    if (!list.length) {
        return summary + bar + '<div class="empty"><div class="empty-desc">' + tx('prod.catalog.none_match', 'Tidak ada produk pada filter ini.') + '</div></div>';
    }

    var cards = '';
    for (var i = 0; i < list.length; i++) {
        var p = list[i];
        var avg = _avgReview(p);
        var avgTxt = avg === null ? '-' : avg.toFixed(1);
        var avgCls = avg === null ? '' : (avg >= 7 ? 'good' : (avg >= 5 ? 'mid' : 'bad'));
        var isSelling = p.status === 'selling';
        var statusLabel = isSelling ? t('prod.catalog.status_selling') : t('prod.catalog.status_discontinued');
        var autoActive = !!(p.autoRestock && p.autoRestock.enabled);
        var pct = _stockPct(p);
        var stockCls = p.stock <= 0 ? 'out' : (pct < 20 ? 'low' : '');
        var stockNote = !isSelling ? '' : (p.stock <= 0
            ? '<span class="cat-warn">' + tx('prod.catalog.out', 'Stok habis') + '</span>'
            : (pct < 20 ? '<span class="cat-warn">' + tx('prod.catalog.low', 'Stok menipis') + '</span>' : ''));
        var pendQty = (p.pendingProduction || []).reduce(function (n, o) { return n + (o.qty || 0); }, 0);
        if (isSelling && pendQty > 0) stockNote += '<span style="color:var(--accent);font-size:11px;">+' + pendQty.toLocaleString('en-US') + ' ' + tx('prod.catalog.in_production', 'dalam produksi') + '</span>';
        var toggle = isSelling
            ? '<div class="cat-auto"><span>' + tx('prod.catalog.auto_short', 'Auto-restock') + '</span>' +
              '<button class="toggle-switch ' + (autoActive ? 'on' : '') + '" data-auto-toggle data-prod-id="' + p.id + '" aria-pressed="' + autoActive + '" aria-label="' + tx('prod.catalog.auto_short', 'Auto-restock') + '"><span class="toggle-thumb"></span></button></div>'
            : '';

        cards += '<div class="card prod-card ' + (isSelling ? '' : 'is-disc') + '" data-prod-detail="' + p.id + '">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:14px;font-weight:700;">' + escapeHtml(p.name) + (autoActive ? ' <span style="color:var(--accent);font-size:12px;">' + t('prod.catalog.auto_tag') + '</span>' : '') + '</div>' +
            '<div style="font-size:11px;color:var(--text-mute);">' + p.releaseDate.day + '/' + p.releaseDate.month + '/' + p.releaseDate.year + '</div>' +
            '</div>' +
            '<div class="prod-badge ' + (isSelling ? 'selling' : 'disc') + '">' + statusLabel + '</div>' +
            '</div>' +
            '<div class="prod-stats-mini"><span class="cat-rate ' + avgCls + '">' + t('prod.catalog.review', { n: avgTxt }) + '</span><span>' + t('prod.catalog.price', { n: p.price }) + '</span><span>' + t('prod.catalog.quality', { n: p.stats.qualityScore }) + '</span></div>' +
            '<div class="prod-stats-mini"><span>' + t('prod.catalog.sold', { n: p.totalSold.toLocaleString('en-US') }) + '</span><span>' + t('prod.catalog.revenue', { n: p.totalRevenue.toLocaleString('en-US') }) + '</span></div>' +
            '<div class="cat-stock"><div class="cat-stock-head"><span>' + t('prod.catalog.stock', { n: p.stock.toLocaleString('en-US') }) + '</span>' + stockNote + '</div>' +
            '<div class="cat-bar"><div class="cat-bar-fill ' + stockCls + '" style="width:' + pct + '%;"></div></div></div>' +
            toggle +
            '</div>';
    }
    return summary + bar + '<div class="prod-list">' + cards + '</div>';
}

// ============================================================
// SUB-TAB PENJUALAN
// ============================================================
function _renderSales() {
    var data = state.get();
    var catalog = (data.products && data.products.catalog) ? data.products.catalog : [];
    var totalRevenue = catalog.reduce(function (s, p) { return s + p.totalRevenue; }, 0);
    var totalSold = catalog.reduce(function (s, p) { return s + p.totalSold; }, 0);
    var activeProducts = catalog.filter(function (p) { return p.status === 'selling'; }).length;
    var topProduct = catalog.slice().sort(function (a, b) { return b.totalSold - a.totalSold; })[0];

    var kpiGrid = '<div class="kpi-grid">' +
        '<div class="kpi"><div class="kpi-label">' + t('prod.sales.total_revenue') + '</div><div class="kpi-value" style="color:var(--accent);font-size:15px;">$' + totalRevenue.toLocaleString('en-US') + '</div></div>' +
        '<div class="kpi blue"><div class="kpi-label">' + t('prod.sales.total_sold') + '</div><div class="kpi-value">' + totalSold.toLocaleString('en-US') + '</div></div>' +
        '<div class="kpi warn"><div class="kpi-label">' + t('prod.sales.active_products') + '</div><div class="kpi-value">' + activeProducts + '</div></div>' +
        '<div class="kpi"><div class="kpi-label">' + t('prod.sales.best_seller') + '</div><div class="kpi-value" style="font-size:12px;">' + (topProduct ? escapeHtml(topProduct.name) : '-') + '</div></div>' +
        '</div>';

    var chartHtml = '';
    try { chartHtml = renderSalesChart(data); } catch (e) { chartHtml = ''; }

    var listHtml = '<div class="card"><div class="card-title">' + t('prod.sales.list_title') + '</div>';
    if (catalog.length) {
        for (var i = 0; i < catalog.length; i++) {
            var p = catalog[i];
            listHtml += '<div class="sum-row"><span>' + escapeHtml(p.name) + '</span><b>' + p.totalSold.toLocaleString('en-US') + ' ' + t('prod.detail.unit') + '</b></div>';
        }
    } else {
        listHtml += '<div class="log-empty">' + t('prod.sales.list_empty') + '</div>';
    }
    listHtml += '</div>';

    return kpiGrid + chartHtml + listHtml;
}

// ============================================================
// SUB-TAB CHIP
// ============================================================
function _renderChipTab() {
    var data = state.get();
    var game = window.__game || {};
    var cs = game.chips || null;
    var fs = game.fab || null;

    if (!cs) {
        return '<div class="empty"><div class="empty-ico">🧩</div><div class="empty-title">' + t('chip.fab.system_not_ready') + '</div></div>';
    }

    var chips = (data.chips && data.chips.catalog) ? data.chips.catalog : [];
    var designing = data.chips ? data.chips.designing : null;
    var fab = data.fab || { built: false, level: 0, inventory: 0 };

    var archs = safe(function () { return cs.getAvailableArchitectures(); }, []);
    var nodes = safe(function () { return cs.getAvailableNodes(); }, []);
    var feats = safe(function () { return cs.getAvailableFeatures(); }, []);

    var labHeader = '<div class="card">' +
        '<div class="card-title">' + t('chip.lab.title') + '</div>' +
        '<div class="sum-row"><span>' + t('chip.lab.arch_avail') + '</span><b>' + archs.length + '</b></div>' +
        '<div class="sum-row"><span>' + t('chip.lab.node_avail') + '</span><b>' + nodes.length + '</b></div>' +
        '<div class="sum-row"><span>' + t('chip.lab.feat_avail') + '</span><b>' + feats.length + '</b></div>' +
        '<div class="sum-row"><span>' + t('chip.lab.catalog') + '</span><b>' + chips.length + '</b></div>' +
        '</div>';

    var designHtml = '';
    if (designing) {
        var pct = Math.round((designing.progressDays / designing.durationDays) * 100);
        designHtml = '<div class="card" style="border-color:var(--info);">' +
            '<div class="card-title" style="color:var(--info);">' + t('chip.design.designing') + '</div>' +
            '<div style="font-size:14px;font-weight:700;margin-bottom:6px;">' + escapeHtml(designing.name) + '</div>' +
            '<div class="progress-label"><span>' + t('chip.design.progress') + '</span><span>' + pct + '%</span></div>' +
            '<div class="progress"><div class="progress-bar" style="width:' + pct + '%;"></div></div>' +
            '<div style="font-size:11.5px;color:var(--text-mute);margin-top:6px;">' + t('chip.design.days_left', { n: Math.max(0, Math.ceil(designing.durationDays - designing.progressDays)) }) + '</div>' +
            '<button class="btn-danger" data-chip-action="cancel-design" style="width:100%;margin-top:10px;font-size:12px;">' + t('chip.design.cancel') + '</button>' +
            '</div>';
    } else {
        designHtml = '<div class="card">' +
            '<div class="card-title">' + t('chip.design.title') + '</div>' +
            '<div style="font-size:12.5px;color:var(--text-dim);line-height:1.6;margin-bottom:12px;">' + t('chip.design.desc') + '</div>' +
            '<button class="btn-primary" data-chip-action="new" style="width:100%;">' + t('chip.design.start') + '</button>' +
            '</div>';
    }

    var catalogHtml = '';
    if (chips.length) {
        var rows = '';
        for (var i = 0; i < chips.length; i++) {
            var c = chips[i];
            var lifecycle = safe(function () { return cs.getChipLifecycle ? cs.getChipLifecycle(c) : null; }, null);
            var mockup = '';
            try { mockup = renderChipMockup(c.config, { size: 70 }); } catch (e) { mockup = ''; }
            rows += '<div class="chip-row" data-chip-detail="' + c.id + '">' +
                '<div class="chip-row-mockup">' + mockup + '</div>' +
                '<div class="chip-row-info">' +
                '<div class="chip-row-name">' + escapeHtml(c.name) + '</div>' +
                '<div class="chip-row-meta">' + t('chip.catalog.perf') + ' <b>' + c.stats.performance + '</b> - ' + t('chip.catalog.eff') + ' <b>' + c.stats.efficiency + '</b> - ' + tx('chip.cost_per_unit', '${n}/unit', { n: c.stats.costPerUnit }) + '</div>' +
                (lifecycle ? '<div class="chip-lifecycle" style="color:' + lifecycle.color + ';">' + tx('chip.lifecycle.' + lifecycle.phase, lifecycle.label) + ' (x' + lifecycle.multiplier.toFixed(2) + ')</div>' : '') +
                '</div>' +
                '</div>';
        }
        catalogHtml = '<div class="card"><div class="card-title">' + t('chip.catalog.title', { n: chips.length }) + '</div><div class="chip-list">' + rows + '</div></div>';
    } else if (!designing) {
        catalogHtml = '<div class="empty"><div class="empty-ico">🧩</div><div class="empty-title">' + t('chip.catalog.empty') + '</div><div class="empty-desc">' + t('chip.catalog.empty_desc') + '</div></div>';
    }

    var fabHtml = '';
    var fabUnlocked = isFabUnlocked();
    if (fab.built) {
        var levelInfo = (fs && fs.getFabLevelInfo) ? safe(function () { return fs.getFabLevelInfo(fab.level); }, null) : null;
        var capacity = levelInfo ? levelInfo.capacityMonthly : 0;
        fabHtml = '<div class="card">' +
            '<div class="card-title">' + t('chip.fab.title') + '</div>' +
            '<div class="sum-row"><span>' + t('chip.fab.level') + '</span><b>' + fab.level + ' - ' + (levelInfo ? escapeHtml(tx('fab.tier.' + levelInfo.id + '.name', levelInfo.name)) : tx('fab.default_name', 'Fab')) + '</b></div>' +
            '<div class="sum-row"><span>' + t('chip.fab.capacity') + '</span><b>' + capacity.toLocaleString('en-US') + t('chip.fab.per_month') + '</b></div>' +
            '<div class="sum-row"><span>' + t('chip.fab.stock') + '</span><b style="color:var(--accent);">' + (fab.inventory || 0).toLocaleString('en-US') + ' ' + t('chip.fab.unit') + '</b></div>' +
            '<button class="btn-secondary" data-chip-action="fab" style="width:100%;margin-top:10px;">' + t('chip.fab.manage') + '</button>' +
            '</div>';
    } else {
        fabHtml = '<div class="card">' +
            '<div class="card-title">' + t('chip.fab.title') + '</div>' +
            '<div style="font-size:12.5px;color:var(--text-dim);line-height:1.6;margin-bottom:10px;">' + (fabUnlocked ? t('chip.fab.build_desc') : t('chip.fab.need_research')) + '</div>' +
            '<button class="btn-primary" data-chip-action="fab" style="width:100%;' + (!fabUnlocked ? 'opacity:0.5;" disabled' : '"') + '>' + (fabUnlocked ? t('chip.fab.build') : t('chip.fab.need_research_btn')) + '</button>' +
            '</div>';
    }

    return labHeader + designHtml + catalogHtml + fabHtml;
}

// Chip ambang auto-restock (tampil saat auto-restock aktif).
function _thresholdChips(prodId, current) {
    var opts = [10, 20, 30, 50];
    var html = '<div class="auto-restock-sub"><div class="auto-label">' + tx('prod.detail.auto_threshold', 'Restock saat stok di bawah') + '</div><div class="threshold-chips">';
    opts.forEach(function (v) {
        html += '<button class="chip-small ' + (v === current ? 'active' : '') + '" data-auto-threshold="' + v + '" data-prod-id="' + prodId + '">' + v + '%</button>';
    });
    return html + '</div></div>';
}

// ============================================================
// MODAL: DETAIL PRODUK
// ============================================================
var _detailProdId = null;
var _campaignProdId = null;
var _orderProdId = null;
var _langBound = false;

function _gameModal() {
    return (window.__game && window.__game.Modal) ? window.__game.Modal : null;
}

// Render ulang modal produk yang sedang terbuka saat bahasa berganti.
function _bindLang() {
    if (_langBound) return;
    _langBound = true;
    bus.on('lang:changed', function () {
        var M = _gameModal();
        if (!M) return;
        if (_detailProdId && M.isOpen('product-detail')) {
            openProductDetailModal({ productId: _detailProdId });
        } else if (_campaignProdId && M.isOpen('campaign-pick')) {
            openCampaignModal({ productId: _campaignProdId });
        } else if (_orderProdId && M.isOpen('order-prod')) {
            var root = document.querySelector('[data-modal-id="order-prod"]');
            var inp = root ? root.querySelector('[data-order-qty]') : null;
            openOrderProductionModal({ productId: _orderProdId, qty: inp ? inp.value : null });
        }
    });
}
_bindLang();

export function openProductDetailModal(params) {
    try {
        var productId = params && params.productId;
        var data = state.get();
        var p = (data.products && data.products.catalog) ? data.products.catalog.find(function (x) { return x.id === productId; }) : null;
        if (!p) return;

        var avg = (p.reviews && p.reviews.length) ? (p.reviews.reduce(function (s, r) { return s + r.score; }, 0) / p.reviews.length).toFixed(1) : '-';

        var specRows = '';
        var specs = [
            [t('prod.detail.spec_screen'), p.config.displayId, 'comp'],
            [t('prod.detail.spec_camera'), p.config.cameraId, 'comp'],
            [t('prod.detail.spec_battery'), p.config.batteryId, 'comp'],
            [t('prod.detail.spec_chip'), p.config.chipId, 'comp'],
            [t('prod.detail.spec_network'), p.config.networkId, 'comp'],
            [t('prod.detail.spec_body'), p.config.bodyId, 'comp'],
            [t('prod.detail.spec_os'), p.config.osOptionId, 'os'] // [FIX] Tandai baris ini sebagai OS
        ];
        
        for (var i = 0; i < specs.length; i++) {
            var label = '-';
            // [FIX] Gunakan fungsi khusus untuk OS
            if (specs[i][2] === 'os') {
                label = _getOsDisplayName(specs[i][1]);
            } else {
                var comp = getComponentById(specs[i][1]);
                label = comp ? comp.name : (specs[i][1] || '-');
            }
            specRows += '<div class="sum-row"><span>' + specs[i][0] + '</span><b>' + escapeHtml(label) + '</b></div>';
        }

        var autoRestock = p.autoRestock || { enabled: false, thresholdPercent: 20 };
        var autoSection = p.status === 'selling'
            ? '<div class="card-title" style="margin-top:14px;">' + t('prod.detail.auto_title') + '</div>' +
              '<div class="auto-restock-row">' +
              '<div style="flex:1;">' +
              '<div style="font-size:13px;font-weight:600;">' + t('prod.detail.auto_label') + '</div>' +
              '<div style="font-size:11px;color:var(--text-mute);margin-top:2px;">' + (autoRestock.enabled ? t('prod.detail.auto_on') : t('prod.detail.auto_off')) + '</div>' +
              '</div>' +
              '<button class="toggle-switch ' + (autoRestock.enabled ? 'on' : '') + '" data-auto-toggle data-prod-id="' + p.id + '" aria-pressed="' + !!autoRestock.enabled + '" aria-label="' + tx('prod.catalog.auto_short', 'Auto-restock') + '"><span class="toggle-thumb"></span></button>' +
              '</div>' +
              (autoRestock.enabled ? _thresholdChips(p.id, autoRestock.thresholdPercent) : '')
            : '';

        var actionsHtml = p.status === 'selling'
            ? '<div class="card-title" style="margin-top:14px;">' + t('prod.detail.actions_title') + '</div>' +
              '<button class="btn-secondary" data-prod-action="order-prod" data-prod-id="' + p.id + '" style="width:100%;margin-bottom:6px;">' + t('prod.detail.order_btn') + '</button>' +
              '<button class="btn-secondary" data-prod-action="campaign" data-prod-id="' + p.id + '" style="width:100%;margin-bottom:6px;">' + t('prod.detail.campaign_btn') + '</button>' +
              '<button class="btn-danger" data-prod-action="discontinue" data-prod-id="' + p.id + '" style="width:100%;">' + t('prod.detail.discontinue_btn') + '</button>'
            : '<div class="empty-hint" style="margin-top:10px;">' + t('prod.detail.discontinued') + '</div>';

        var html = '<div class="modal-title">' + escapeHtml(p.name) + '</div>' +
            '<div class="modal-sub">' + t('prod.detail.release', { day: p.releaseDate.day, month: p.releaseDate.month, year: p.releaseDate.year }) + '</div>' +
            '<div class="card-title">' + t('prod.detail.section_sales') + '</div>' +
            '<div class="sum-row"><span>' + t('prod.detail.total_sold') + '</span><b>' + p.totalSold.toLocaleString('en-US') + ' ' + t('prod.detail.unit') + '</b></div>' +
            '<div class="sum-row"><span>' + t('prod.detail.revenue') + '</span><b>$' + p.totalRevenue.toLocaleString('en-US') + '</b></div>' +
            '<div class="sum-row"><span>' + t('prod.detail.stock') + '</span><b>' + p.stock.toLocaleString('en-US') + '</b></div>' +
            '<div class="sum-row"><span>' + t('prod.detail.review_avg') + '</span><b>' + avg + '/10 (' + p.reviews.length + ')</b></div>' +
            '<div class="card-title" style="margin-top:12px;">' + t('prod.detail.section_spec') + '</div>' +
            specRows +
            autoSection +
            actionsHtml +
            '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:12px;">' + t('prod.detail.close') + '</button>';

        _detailProdId = productId;
        window.__game.Modal.open('product-detail', html, { onClose: function () { _detailProdId = null; } });
    } catch (err) {
        console.error('[openProductDetailModal] error:', err);
    }
}

// ============================================================
// MODAL: PILIH KAMPANYE
// ============================================================
export function openCampaignModal(params) {
    try {
        var productId = params && params.productId;
        var marketing = (window.__game && window.__game.modules && window.__game.modules.marketing) ? window.__game.modules.marketing : null;
        var campaigns = (marketing && marketing.MARKETING_CAMPAIGNS) ? marketing.MARKETING_CAMPAIGNS : [];

        var buttonsHtml = '';
        for (var i = 0; i < campaigns.length; i++) {
            var c = campaigns[i];
            buttonsHtml += '<button class="wiz-option" data-campaign-pick="' + c.id + '" data-prod-id="' + productId + '" style="width:100%;margin-bottom:6px;text-align:left;">' +
                '<div class="wiz-opt-name">' + escapeHtml(tx('marketing.campaign.' + c.id, c.name)) + '</div>' +
                '<div class="wiz-opt-meta">' + tx('prod.campaign.meta', '${cost} - {days} hari - jangkauan +{reach}%', { cost: c.cost.toLocaleString('en-US'), days: c.durationDays, reach: Math.round(c.reachBase * 100) }) + '</div>' +
                '</button>';
        }

        var html = '<div class="modal-title">' + t('prod.campaign.title') + '</div>' +
            '<div class="modal-sub">' + t('prod.campaign.sub') + '</div>' +
            buttonsHtml +
            '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:8px;">' + t('prod.campaign.cancel') + '</button>';

        _campaignProdId = productId;
        window.__game.Modal.open('campaign-pick', html, { onClose: function () { _campaignProdId = null; } });
    } catch (err) {
        console.error('[openCampaignModal] error:', err);
    }
}

// ============================================================
// MODAL: ORDER PRODUKSI
// ============================================================
export function openOrderProductionModal(params) {
    try {
        var productId = params && params.productId;
        var data = state.get();
        var p = (data.products && data.products.catalog) ? data.products.catalog.find(function (x) { return x.id === productId; }) : null;
        if (!p) return;

        var html = '<div class="modal-title">' + t('prod.order.title') + '</div>' +
            '<div class="modal-sub">' + escapeHtml(p.name) + '</div>' +
            '<label class="field-label">' + t('prod.order.qty_label') + '</label>' +
            '<input class="field-input" data-order-qty type="number" min="100" step="100" value="' + (params && params.qty != null && params.qty !== '' ? escapeHtml(String(params.qty)) : '1000') + '" />' +
            '<div class="sum-row" style="margin-top:8px;"><span>' + t('prod.order.cost_unit') + '</span><b>$' + p.unitCost + '</b></div>' +
            '<div class="sum-row"><span>' + t('prod.order.setup') + '</span><b>$2,000</b></div>' +
            '<div class="sum-row"><span>' + tx('prod.order.vol', 'Pengali volume') + '</span><b data-order-vol>x1.00</b></div>' +
            '<div class="sum-row"><span>' + t('prod.order.total') + '</span><b data-order-total>$0</b></div>' +
            '<div class="sum-row"><span>' + t('prod.order.lead') + '</span><b data-order-lead>-</b></div>' +
            '<button class="btn-primary" data-order-confirm data-prod-id="' + productId + '" style="width:100%;margin-top:12px;">' + t('prod.order.submit') + '</button>' +
            '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:6px;">' + t('prod.order.cancel') + '</button>';

        _orderProdId = productId;
        window.__game.Modal.open('order-prod', html, { onClose: function () { _orderProdId = null; } });

        var root = document.querySelector('[data-modal-id="order-prod"]');
        if (!root) return;
        var qtyInput = root.querySelector('[data-order-qty]');
        var totalEl = root.querySelector('[data-order-total]');
        var leadEl = root.querySelector('[data-order-lead]');
        var volEl = root.querySelector('[data-order-vol]');
        function refresh() {
            var q = parseInt(qtyInput.value, 10) || 0;
            var ps = window.__game && window.__game.products;
            var quote = (ps && ps.quoteProduction) ? ps.quoteProduction(p.config, q) : null;
            totalEl.textContent = '$' + (quote ? quote.total : ((q * p.unitCost) + 2000)).toLocaleString('en-US');
            if (volEl) volEl.textContent = 'x' + (quote ? quote.volMult : 1).toFixed(2);
            var days = Math.max(1, Math.min(10, 2 + Math.floor(q / 2500))); // sinkron dgn BALANCE.products.manualRestock
            leadEl.textContent = days + ' ' + t('prod.order.days');
        }
        qtyInput.addEventListener('input', refresh);
        refresh();
    } catch (err) {
        console.error('[openOrderProductionModal] error:', err);
    }
            }
