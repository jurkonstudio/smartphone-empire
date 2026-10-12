// FILE: src/ui/panels/ProductPanel.js
// Versi DEFENSIVE — semua bagian di-guard agar tidak crash.
import { renderSalesChart } from './SalesChart.js';
import { getComponentById } from '../../data/components.data.js';
import { state } from '../../core/GameState.js';
import { ToastService } from '../../core/ToastService.js';
import { openChipDesigner } from './ChipDesignerPanel.js';
import { openFabPanel, openProductionQtyModal } from './FabPanel.js';
import { renderChipMockup } from '../phone/ChipMockup.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function safe(fn, fallback) {
    try { return fn(); }
    catch (err) {
        console.error('[ProductPanel] section error:', err);
        return fallback || '<div class="card" style="border-color:var(--danger);"><div class="card-title" style="color:var(--danger);">Error</div><div style="font-size:12px;color:var(--text-dim);">' + escapeHtml(err.message || 'unknown') + '</div></div>';
    }
}

function isChipLabUnlocked() {
    try {
        var data = state.get();
        if (!data || !data.research || !Array.isArray(data.research.completed)) return false;
        return data.research.completed.indexOf('chip_design_tool') !== -1;
    } catch (e) {
        console.error('[ProductPanel] isChipLabUnlocked error:', e);
        return false;
    }
}

export function renderProductPanel(params) {
    params = params || {};
    var subtab = params.subtab || 'design';
    var productSystem = params.productSystem;
    var researchSystem = params.researchSystem;
    var osSystem = params.osSystem;

    var chipUnlocked = isChipLabUnlocked();
    if (subtab === 'chip' && !chipUnlocked) subtab = 'design';

    var subtabs = [
        { id: 'design',  label: 'Desain' },
        { id: 'catalog', label: 'Katalog' },
        { id: 'sales',   label: 'Penjualan' }
    ];
    if (chipUnlocked) subtabs.push({ id: 'chip', label: 'Chip' });

    var subtabBar = '<div class="subtab-bar">';
    for (var i = 0; i < subtabs.length; i++) {
        var t = subtabs[i];
        subtabBar += '<button class="subtab-btn ' + (subtab === t.id ? 'active' : '') + '" data-prod-subtab="' + t.id + '">' + t.label + '</button>';
    }
    subtabBar += '</div>';

    var body = '';
    if (subtab === 'catalog') {
        body = safe(function () { return _renderCatalog(); }, '<div class="empty"><div class="empty-title">Gagal render Katalog</div></div>');
    } else if (subtab === 'sales') {
        body = safe(function () { return _renderSales(); }, '<div class="empty"><div class="empty-title">Gagal render Penjualan</div></div>');
    } else if (subtab === 'chip') {
        body = safe(function () { return _renderChipTab(); }, '<div class="empty"><div class="empty-title">Gagal render Chip</div></div>');
    } else {
        body = safe(function () { return _renderDesignTab(productSystem); }, '<div class="empty"><div class="empty-title">Gagal render Desain</div></div>');
    }

    return subtabBar + body;
}

function _renderDesignTab(productSystem) {
    var data = state.get();
    var dev = data.products ? data.products.development : null;

    if (dev) {
        var phaseLabel = { design: 'Desain', prototype: 'Prototipe', production: 'Produksi', released: 'Rilis' }[dev.phase] || dev.phase;
        var phaseIndex = { design: 1, prototype: 2, production: 3, released: 4 };
        var percent = ((phaseIndex[dev.phase] - 1) * 25) + Math.min(25, (dev.phaseProgressDays / dev.phaseDurationDays) * 25);

        return '<div class="card">' +
            '<div class="card-title">Pengembangan Aktif</div>' +
            '<div style="font-size:16px;font-weight:700;margin-bottom:6px;">' + escapeHtml(dev.name) + '</div>' +
            '<div style="font-size:12px;color:var(--text-dim);margin-bottom:10px;">Tahap: <b>' + phaseLabel + '</b> - Total ' + dev.totalDurationDays + ' hari game</div>' +
            '<div class="progress-label"><span data-prod-dev-phase>' + phaseLabel + '</span><span data-prod-dev-pct>' + Math.round(percent) + '%</span></div>' +
            '<div class="progress"><div class="progress-bar" data-prod-dev-bar style="width:' + Math.round(percent) + '%;"></div></div>' +
            '<div style="font-size:11.5px;color:var(--text-mute);margin-top:8px;" data-prod-dev-eta>Menunggu waktu berjalan...</div>' +
            '<button class="btn-danger" data-prod-action="cancel-dev" style="margin-top:12px;width:100%;">Batalkan Proyek</button>' +
            '</div>';
    }

    return '<div class="card">' +
        '<div class="card-title">Desain Produk Baru</div>' +
        '<div style="font-size:12.5px;color:var(--text-dim);line-height:1.6;margin-bottom:12px;">Rancang ponsel: pilih komponen, tentukan OS, harga, dan jumlah produksi.</div>' +
        '<button class="btn-primary" data-prod-action="open-wizard" style="width:100%;">Mulai Desain Ponsel</button>' +
        '</div>';
}

function _renderCatalog() {
    var data = state.get();
    var catalog = (data.products && data.products.catalog) ? data.products.catalog : [];
    if (!catalog.length) {
        return '<div class="empty"><div class="empty-ico">📦</div><div class="empty-title">Belum ada produk</div><div class="empty-desc">Rilis ponsel pertamamu di sub-tab Desain.</div></div>';
    }
    var cards = '';
    for (var i = 0; i < catalog.length; i++) {
        var p = catalog[i];
        var avgReview = (p.reviews && p.reviews.length) ? (p.reviews.reduce(function (s, r) { return s + r.score; }, 0) / p.reviews.length).toFixed(1) : '-';
        var statusLabel = { selling: 'Dijual', discontinued: 'Dihentikan' }[p.status] || p.status;
        var autoActive = p.autoRestock && p.autoRestock.enabled;
        cards += '<div class="card prod-card" data-prod-detail="' + p.id + '">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:14px;font-weight:700;">' + escapeHtml(p.name) + (autoActive ? ' <span style="color:var(--accent);font-size:12px;">[AUTO]</span>' : '') + '</div>' +
            '<div style="font-size:11px;color:var(--text-mute);">' + p.releaseDate.day + '/' + p.releaseDate.month + '/' + p.releaseDate.year + ' - ' + statusLabel + '</div>' +
            '</div>' +
            '<div class="prod-badge ' + (p.status === 'selling' ? 'selling' : 'disc') + '">' + statusLabel + '</div>' +
            '</div>' +
            '<div class="prod-stats-mini"><span>⭐ ' + avgReview + '/10</span><span>📦 ' + p.stock.toLocaleString('en-US') + ' stok</span><span>💰 $' + p.totalRevenue.toLocaleString('en-US') + '</span></div>' +
            '<div class="prod-stats-mini"><span>Terjual: ' + p.totalSold.toLocaleString('en-US') + '</span><span>Harga: $' + p.price + '</span><span>Kualitas: ' + p.stats.qualityScore + '</span></div>' +
            '</div>';
    }
    return '<div class="prod-list">' + cards + '</div>';
}

function _renderSales() {
    var data = state.get();
    var catalog = (data.products && data.products.catalog) ? data.products.catalog : [];
    var totalRevenue = catalog.reduce(function (s, p) { return s + p.totalRevenue; }, 0);
    var totalSold = catalog.reduce(function (s, p) { return s + p.totalSold; }, 0);
    var activeProducts = catalog.filter(function (p) { return p.status === 'selling'; }).length;
    var topProduct = catalog.slice().sort(function (a, b) { return b.totalSold - a.totalSold; })[0];

    var kpiGrid = '<div class="kpi-grid">' +
        '<div class="kpi"><div class="kpi-label">Total Pendapatan</div><div class="kpi-value" style="color:var(--accent);font-size:15px;">$' + totalRevenue.toLocaleString('en-US') + '</div></div>' +
        '<div class="kpi blue"><div class="kpi-label">Total Terjual</div><div class="kpi-value">' + totalSold.toLocaleString('en-US') + '</div></div>' +
        '<div class="kpi warn"><div class="kpi-label">Produk Aktif</div><div class="kpi-value">' + activeProducts + '</div></div>' +
        '<div class="kpi"><div class="kpi-label">Terlaris</div><div class="kpi-value" style="font-size:12px;">' + (topProduct ? escapeHtml(topProduct.name) : '-') + '</div></div>' +
        '</div>';

    var chartHtml = '';
    try { chartHtml = renderSalesChart(data); } catch (e) { chartHtml = ''; }

    var listHtml = '<div class="card"><div class="card-title">Daftar Produk</div>';
    if (catalog.length) {
        for (var i = 0; i < catalog.length; i++) {
            var p = catalog[i];
            listHtml += '<div class="sum-row"><span>' + escapeHtml(p.name) + '</span><b>' + p.totalSold.toLocaleString('en-US') + ' unit</b></div>';
        }
    } else {
        listHtml += '<div class="log-empty">Belum ada produk.</div>';
    }
    listHtml += '</div>';

    return kpiGrid + chartHtml + listHtml;
}

function _renderChipTab() {
    var data = state.get();
    var game = window.__game || {};
    var cs = game.chips || null;
    var fs = game.fab || null;

    if (!cs) {
        return '<div class="empty"><div class="empty-ico">🧩</div><div class="empty-title">Chip System belum siap</div></div>';
    }

    var chips = (data.chips && data.chips.catalog) ? data.chips.catalog : [];
    var designing = data.chips ? data.chips.designing : null;
    var fab = data.fab || { built: false, level: 0, inventory: 0 };

    var archs = safe(function () { return cs.getAvailableArchitectures(); }, []);
    var nodes = safe(function () { return cs.getAvailableNodes(); }, []);
    var feats = safe(function () { return cs.getAvailableFeatures(); }, []);

    var labHeader = '<div class="card">' +
        '<div class="card-title">Chip Lab</div>' +
        '<div class="sum-row"><span>Arsitektur tersedia</span><b>' + archs.length + '</b></div>' +
        '<div class="sum-row"><span>Node tersedia</span><b>' + nodes.length + '</b></div>' +
        '<div class="sum-row"><span>Fitur tersedia</span><b>' + feats.length + '</b></div>' +
        '<div class="sum-row"><span>Chip di katalog</span><b>' + chips.length + '</b></div>' +
        '</div>';

    var designHtml = '';
    if (designing) {
        var pct = Math.round((designing.progressDays / designing.durationDays) * 100);
        designHtml = '<div class="card" style="border-color:var(--info);">' +
            '<div class="card-title" style="color:var(--info);">Sedang Didesain</div>' +
            '<div style="font-size:14px;font-weight:700;margin-bottom:6px;">' + escapeHtml(designing.name) + '</div>' +
            '<div class="progress-label"><span>Progress</span><span>' + pct + '%</span></div>' +
            '<div class="progress"><div class="progress-bar" style="width:' + pct + '%;"></div></div>' +
            '<div style="font-size:11.5px;color:var(--text-mute);margin-top:6px;">' + Math.max(0, Math.ceil(designing.durationDays - designing.progressDays)) + ' hari tersisa</div>' +
            '<button class="btn-danger" data-chip-action="cancel-design" style="width:100%;margin-top:10px;font-size:12px;">Batalkan</button>' +
            '</div>';
    } else {
        designHtml = '<div class="card">' +
            '<div class="card-title">Desain Chip Baru</div>' +
            '<div style="font-size:12.5px;color:var(--text-dim);line-height:1.6;margin-bottom:12px;">Rancang silicon: pilih arsitektur, node, core, clock, dan fitur.</div>' +
            '<button class="btn-primary" data-chip-action="new" style="width:100%;">Mulai Desain Chip</button>' +
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
                '<div class="chip-row-meta">Perf <b>' + c.stats.performance + '</b> - Eff <b>' + c.stats.efficiency + '</b> - $' + c.stats.costPerUnit + '/unit</div>' +
                (lifecycle ? '<div class="chip-lifecycle" style="color:' + lifecycle.color + ';">' + lifecycle.label + ' (x' + lifecycle.multiplier.toFixed(2) + ')</div>' : '') +
                '</div>' +
                '</div>';
        }
        catalogHtml = '<div class="card"><div class="card-title">Katalog Chip (' + chips.length + ')</div><div class="chip-list">' + rows + '</div></div>';
    } else if (!designing) {
        catalogHtml = '<div class="empty"><div class="empty-ico">🧩</div><div class="empty-title">Belum ada chip</div><div class="empty-desc">Desain chip pertama Anda di Chip Designer.</div></div>';
    }

    var fabHtml = '';
    if (fab.built) {
        var levelInfo = (fs && fs.getFabLevelInfo) ? safe(function () { return fs.getFabLevelInfo(fab.level); }, null) : null;
        var capacity = levelInfo ? levelInfo.capacityMonthly : 0;
        fabHtml = '<div class="card">' +
            '<div class="card-title">Fabrikasi</div>' +
            '<div class="sum-row"><span>Level</span><b>' + fab.level + ' - ' + (levelInfo ? escapeHtml(levelInfo.name) : 'Fab') + '</b></div>' +
            '<div class="sum-row"><span>Kapasitas</span><b>' + capacity.toLocaleString('en-US') + '/bln</b></div>' +
            '<div class="sum-row"><span>Stok chip</span><b style="color:var(--accent);">' + (fab.inventory || 0).toLocaleString('en-US') + ' unit</b></div>' +
            '<button class="btn-secondary" data-chip-action="fab" style="width:100%;margin-top:10px;">Kelola Fab</button>' +
            '</div>';
    } else {
        var hasResearch = (data.research && Array.isArray(data.research.completed)) ? data.research.completed.indexOf('fab_construction') !== -1 : false;
        fabHtml = '<div class="card">' +
            '<div class="card-title">Fabrikasi</div>' +
            '<div style="font-size:12.5px;color:var(--text-dim);line-height:1.6;margin-bottom:10px;">' + (hasResearch ? 'Bangun pabrik chip sendiri untuk produksi massal.' : 'Butuh riset Konstruksi Fab untuk membangun pabrik sendiri.') + '</div>' +
            '<button class="btn-primary" data-chip-action="fab" style="width:100%;"' + (!hasResearch ? ' disabled style="opacity:0.5;width:100%;"' : '') + '>' + (hasResearch ? 'Bangun Fab' : 'Butuh Riset Fab') + '</button>' +
            '</div>';
    }

    return labHeader + designHtml + catalogHtml + fabHtml;
}
