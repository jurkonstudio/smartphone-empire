// FILE: src/ui/panels/ProductPanel.js
// Tab Produk: sub-tab Desain | Katalog | Penjualan | Chip (conditional).
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

// Chip lab unlock check
function isChipLabUnlocked() {
    const data = state.get();
    return (data.research.completed || []).includes('chip_design_tool');
}

export function renderProductPanel({ subtab, productSystem, researchSystem, osSystem }) {
    const chipUnlocked = isChipLabUnlocked();

    // Kalau user set subtab = 'chip' tapi belum unlock, fallback ke design
    if (subtab === 'chip' && !chipUnlocked) subtab = 'design';

    const subtabs = [
        { id: 'design',  label: 'Desain' },
        { id: 'catalog', label: 'Katalog' },
        { id: 'sales',   label: 'Penjualan' }
    ];
    if (chipUnlocked) {
        subtabs.push({ id: 'chip', label: '🧩 Chip' });
    }

    const subtabBar = `
        <div class="subtab-bar">
            ${subtabs.map(t => `
                <button class="subtab-btn ${subtab === t.id ? 'active' : ''}" data-prod-subtab="${t.id}">${t.label}</button>
            `).join('')}
        </div>
    `;

    let body = '';
    if (subtab === 'catalog')      body = _renderCatalog();
    else if (subtab === 'sales')   body = _renderSales();
    else if (subtab === 'chip')    body = _renderChipTab();
    else                           body = _renderDesignTab(productSystem);

    return subtabBar + body;
}

// ============================================================
// SUB-TAB DESAIN
// ============================================================
function _renderDesignTab(productSystem) {
    const data = state.get();
    const dev = data.products.development;

    if (dev) {
        const phaseLabel = { design: 'Desain', prototype: 'Prototipe', production: 'Produksi', released: 'Rilis' }[dev.phase] || dev.phase;
        const phaseIndex = { design: 1, prototype: 2, production: 3, released: 4 };
        const percent = ((phaseIndex[dev.phase] - 1) * 25) + Math.min(25, (dev.phaseProgressDays / dev.phaseDurationDays) * 25);

        return `
            <div class="card">
                <div class="card-title">Pengembangan Aktif</div>
                <div style="font-size:16px;font-weight:700;margin-bottom:6px;">${escapeHtml(dev.name)}</div>
                <div style="font-size:12px;color:var(--text-dim);margin-bottom:10px;">
                    Tahap: <b>${phaseLabel}</b> • Total ${dev.totalDurationDays} hari game
                </div>
                <div class="progress-label">
                    <span data-prod-dev-phase>${phaseLabel}</span>
                    <span data-prod-dev-pct>${Math.round(percent)}%</span>
                </div>
                <div class="progress">
                    <div class="progress-bar" data-prod-dev-bar style="width:${Math.round(percent)}%;"></div>
                </div>
                <div style="font-size:11.5px;color:var(--text-mute);margin-top:8px;" data-prod-dev-eta>
                    Menunggu waktu berjalan...
                </div>
                <button class="btn-danger" data-prod-action="cancel-dev" style="margin-top:12px;width:100%;">
                    Batalkan Proyek
                </button>
            </div>
        `;
    }

    return `
        <div class="card">
            <div class="card-title">Desain Produk Baru</div>
            <div style="font-size:12.5px;color:var(--text-dim);line-height:1.6;margin-bottom:12px;">
                Rancang ponsel: pilih komponen yang sudah terbuka dari riset, tentukan OS, harga, dan jumlah produksi.
            </div>
            <button class="btn-primary" data-prod-action="open-wizard" style="width:100%;">
                📱 Mulai Desain Ponsel
            </button>
        </div>
    `;
}

// ============================================================
// SUB-TAB KATALOG
// ============================================================
function _renderCatalog() {
    const data = state.get();
    const catalog = data.products.catalog || [];
    if (!catalog.length) {
        return `<div class="empty">
            <div class="empty-ico">📦</div>
            <div class="empty-title">Belum ada produk</div>
            <div class="empty-desc">Rilis ponsel pertamamu di sub-tab Desain.</div>
        </div>`;
    }
    const cards = catalog.map(p => {
        const avgReview = p.reviews.length
            ? (p.reviews.reduce((s, r) => s + r.score, 0) / p.reviews.length).toFixed(1)
            : '-';
        const statusLabel = { selling: 'Dijual', discontinued: 'Dihentikan' }[p.status] || p.status;
        const autoActive = p.autoRestock && p.autoRestock.enabled;
        return `
            <div class="card prod-card" data-prod-detail="${p.id}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:14px;font-weight:700;">
                            ${escapeHtml(p.name)}
                            ${autoActive ? '<span style="color:var(--accent);font-size:12px;margin-left:6px;">🔄</span>' : ''}
                        </div>
                        <div style="font-size:11px;color:var(--text-mute);">${p.releaseDate.day}/${p.releaseDate.month}/${p.releaseDate.year} • ${statusLabel}</div>
                    </div>
                    <div class="prod-badge ${p.status === 'selling' ? 'selling' : 'disc'}">${statusLabel}</div>
                </div>
                <div class="prod-stats-mini">
                    <span>⭐ ${avgReview}/10</span>
                    <span>📦 ${p.stock.toLocaleString('en-US')} stok</span>
                    <span>💰 $${p.totalRevenue.toLocaleString('en-US')}</span>
                </div>
                <div class="prod-stats-mini">
                    <span>Terjual: ${p.totalSold.toLocaleString('en-US')}</span>
                    <span>Harga: $${p.price}</span>
                    <span>Kualitas: ${p.stats.qualityScore}</span>
                </div>
            </div>
        `;
    }).join('');
    return `<div class="prod-list">${cards}</div>`;
}

// ============================================================
// SUB-TAB PENJUALAN
// ============================================================
function _renderSales() {
    const data = state.get();
    const catalog = data.products.catalog || [];
    const totalRevenue = catalog.reduce((s, p) => s + p.totalRevenue, 0);
    const totalSold = catalog.reduce((s, p) => s + p.totalSold, 0);
    const activeProducts = catalog.filter(p => p.status === 'selling').length;
    const topProduct = catalog.slice().sort((a, b) => b.totalSold - a.totalSold)[0];

    return `
        <div class="kpi-grid">
            <div class="kpi">
                <div class="kpi-label">Total Pendapatan</div>
                <div class="kpi-value" style="color:var(--accent);font-size:15px;">$${totalRevenue.toLocaleString('en-US')}</div>
            </div>
            <div class="kpi blue">
                <div class="kpi-label">Total Terjual</div>
                <div class="kpi-value">${totalSold.toLocaleString('en-US')}</div>
            </div>
            <div class="kpi warn">
                <div class="kpi-label">Produk Aktif</div>
                <div class="kpi-value">${activeProducts}</div>
            </div>
            <div class="kpi">
                <div class="kpi-label">Terlaris</div>
                <div class="kpi-value" style="font-size:12px;">${topProduct ? escapeHtml(topProduct.name) : '-'}</div>
            </div>
        </div>
        ${renderSalesChart(data)}
        <div class="card">
            <div class="card-title">Daftar Produk</div>
            ${catalog.length
                ? catalog.map(p => `
                    <div class="sum-row">
                        <span>${escapeHtml(p.name)}</span>
                        <b>${p.totalSold.toLocaleString('en-US')} unit</b>
                    </div>
                `).join('')
                : '<div class="log-empty">Belum ada produk.</div>'
            }
        </div>
    `;
}

// ============================================================
// SUB-TAB CHIP
// ============================================================
function _renderChipTab() {
    const data = state.get();
    const cs = window.__game && window.__game.chips ? window.__game.chips : null;
    const fs = window.__game && window.__game.fab ? window.__game.fab : null;

    if (!cs) {
        return `<div class="empty"><div class="empty-ico">🧩</div><div class="empty-title">Chip System belum siap</div></div>`;
    }

    const chips = (data.chips && data.chips.catalog) || [];
    const designing = data.chips && data.chips.designing;
    const fab = data.fab || { built: false, level: 0, inventory: 0 };

    // Available architectures/nodes/features count
    const archs = cs.getAvailableArchitectures ? cs.getAvailableArchitectures() : [];
    const nodes = cs.getAvailableNodes ? cs.getAvailableNodes() : [];
    const feats = cs.getAvailableFeatures ? cs.getAvailableFeatures() : [];

    // Header lab stats
    const labHeader = `
        <div class="card">
            <div class="card-title">🧩 Chip Lab</div>
            <div class="sum-row"><span>Arsitektur tersedia</span><b>${archs.length}</b></div>
            <div class="sum-row"><span>Node tersedia</span><b>${nodes.length}</b></div>
            <div class="sum-row"><span>Fitur tersedia</span><b>${feats.length}</b></div>
            <div class="sum-row"><span>Chip di katalog</span><b>${chips.length}</b></div>
        </div>
    `;

    // Design in progress
    let designHtml = '';
    if (designing) {
        const pct = Math.round((designing.progressDays / designing.durationDays) * 100);
        designHtml = `
            <div class="card" style="border-color:var(--info);">
                <div class="card-title" style="color:var(--info);">🔧 Sedang Didesain</div>
                <div style="font-size:14px;font-weight:700;margin-bottom:6px;">${escapeHtml(designing.name)}</div>
                <div class="progress-label"><span>Progress</span><span>${pct}%</span></div>
                <div class="progress"><div class="progress-bar" style="width:${pct}%;"></div></div>
                <div style="font-size:11.5px;color:var(--text-mute);margin-top:6px;">
                    ${Math.max(0, Math.ceil(designing.durationDays - designing.progressDays))} hari tersisa
                </div>
                <button class="btn-danger" data-chip-action="cancel-design" style="width:100%;margin-top:10px;font-size:12px;">Batalkan</button>
            </div>
        `;
    } else {
        designHtml = `
            <div class="card">
                <div class="card-title">Desain Chip Baru</div>
                <div style="font-size:12.5px;color:var(--text-dim);line-height:1.6;margin-bottom:12px;">
                    Rancang silicon: pilih arsitektur, node, core, clock, dan fitur. Chip akan dipakai di ponsel atau diproduksi massal.
                </div>
                <button class="btn-primary" data-chip-action="new" style="width:100%;">
                    🧩 Mulai Desain Chip
                </button>
            </div>
        `;
    }

    // Chips catalog
    let catalogHtml = '';
    if (chips.length) {
        catalogHtml = `
            <div class="card">
                <div class="card-title">Katalog Chip (${chips.length})</div>
                <div class="chip-list">
                    ${chips.map(c => {
                        const lifecycle = cs.getChipLifecycle ? cs.getChipLifecycle(c) : null;
                        let mockup = '';
                        try { mockup = renderChipMockup(c.config, { size: 70 }); }
                        catch (e) { mockup = ''; }
                        return `
                            <div class="chip-row" data-chip-detail="${c.id}">
                                <div class="chip-row-mockup">${mockup}</div>
                                <div class="chip-row-info">
                                    <div class="chip-row-name">${escapeHtml(c.name)}</div>
                                    <div class="chip-row-meta">
                                        Perf <b>${c.stats.performance}</b> • Eff <b>${c.stats.efficiency}</b> • $${c.stats.costPerUnit}/unit
                                    </div>
                                    ${lifecycle ? `
                                        <div class="chip-lifecycle" style="color:${lifecycle.color};">
                                            ● ${lifecycle.label} (×${lifecycle.multiplier.toFixed(2)})
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    } else if (!designing) {
        catalogHtml = `
            <div class="empty">
                <div class="empty-ico">🧩</div>
                <div class="empty-title">Belum ada chip</div>
                <div class="empty-desc">Desain chip pertama Anda di Chip Designer.</div>
            </div>
        `;
    }

    // Fab section
    let fabHtml = '';
    if (fab.built) {
        const levelInfo = fs && fs.getFabLevelInfo ? fs.getFabLevelInfo(fab.level) : null;
        const capacity = levelInfo ? levelInfo.capacityMonthly : 0;
        fabHtml = `
            <div class="card">
                <div class="card-title">🏭 Fabrikasi</div>
                <div class="sum-row"><span>Level</span><b>${fab.level} — ${levelInfo ? escapeHtml(levelInfo.name) : 'Fab'}</b></div>
                <div class="sum-row"><span>Kapasitas</span><b>${capacity.toLocaleString('en-US')}/bln</b></div>
                <div class="sum-row"><span>Stok chip</span><b style="color:var(--accent);">${(fab.inventory || 0).toLocaleString('en-US')} unit</b></div>
                <button class="btn-secondary" data-chip-action="fab" style="width:100%;margin-top:10px;">
                    🏭 Kelola Fab
                </button>
            </div>
        `;
    } else {
        const hasResearch = (data.research.completed || []).includes('fab_construction');
        fabHtml = `
            <div class="card">
                <div class="card-title">🏭 Fabrikasi</div>
                <div style="font-size:12.5px;color:var(--text-dim);line-height:1.6;margin-bottom:10px;">
                    ${hasResearch
                        ? 'Bangun pabrik chip sendiri untuk produksi massal & biaya lebih murah.'
                        : 'Butuh riset "Konstruksi Fab" untuk membangun pabrik sendiri.'}
                </div>
                <button class="btn-primary" data-chip-action="fab" style="width:100%;" ${!hasResearch ? 'disabled style="opacity:0.5;width:100%;"' : ''}>
                    ${hasResearch ? '🏭 Bangun Fab' : 'Butuh Riset Fab'}
                </button>
            </div>
        `;
    }

    return labHeader + designHtml + catalogHtml + fabHtml;
}
