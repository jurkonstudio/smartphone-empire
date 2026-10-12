// FILE: src/ui/panels/ProductPanel.js
import { renderSalesChart } from './SalesChart.js';
import { getComponentById } from '../../data/components.data.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export function renderProductPanel({ subtab, productSystem, researchSystem, osSystem }) {
    const subtabBar = `
        <div class="subtab-bar">
            <button class="subtab-btn ${subtab === 'design'  ? 'active' : ''}" data-prod-subtab="design">Desain</button>
            <button class="subtab-btn ${subtab === 'catalog' ? 'active' : ''}" data-prod-subtab="catalog">Katalog</button>
            <button class="subtab-btn ${subtab === 'sales'   ? 'active' : ''}" data-prod-subtab="sales">Penjualan</button>
        </div>
    `;
    let body = '';
    if (subtab === 'catalog') body = _renderCatalog();
    else if (subtab === 'sales') body = _renderSales();
    else body = _renderDesignTab(productSystem);
    return subtabBar + body;
}

function _renderDesignTab(productSystem) {
    const data = window.__game.state.get();
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

function _renderCatalog() {
    const data = window.__game.state.get();
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

function _renderSales() {
    const data = window.__game.state.get();
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
// MODAL DETAIL PRODUK
// ============================================================
export function openProductDetailModal({ productId, productSystem }) {
    const data = window.__game.state.get();
    const p = data.products.catalog.find(x => x.id === productId);
    if (!p) return;

    const avg = p.reviews.length ? (p.reviews.reduce((s, r) => s + r.score, 0) / p.reviews.length).toFixed(1) : '-';

    const specRows = [
        ['Layar', p.config.displayId],
        ['Kamera', p.config.cameraId],
        ['Baterai', p.config.batteryId],
        ['Chip', p.config.chipId],
        ['Jaringan', p.config.networkId],
        ['Bodi', p.config.bodyId],
        ['OS', p.config.osOptionId]
    ].map(([label, id]) => {
        const comp = getComponentById(id);
        const label2 = comp ? comp.name : (id || '-');
        return `<div class="sum-row"><span>${label}</span><b>${escapeHtml(label2)}</b></div>`;
    }).join('');

    const campaigns = data.marketing.activeCampaigns.filter(c => c.productId === p.id);

    // Guard autoRestock
    const ar = p.autoRestock || { enabled: false, thresholdPercent: 20, lastAutoOrderMinute: 0 };
    const baseCapacity = p.baseCapacity || (p.config && p.config.productionQty) || 5000;
    const threshold = Math.round(baseCapacity * (ar.thresholdPercent / 100));
    const now = data.time.elapsedGameMinutes;
    const lastOrderDaysAgo = ar.lastAutoOrderMinute > 0
        ? Math.floor((now - ar.lastAutoOrderMinute) / 1440)
        : null;

    const autoSection = p.status === 'selling' ? `
        <div class="card-title" style="margin-top:14px;">🔄 Pengisian Stok Otomatis</div>
        <div class="auto-restock-row">
            <div style="flex:1;">
                <div style="font-size:13px;font-weight:600;">Aktifkan Auto-Restock</div>
                <div style="font-size:11px;color:var(--text-mute);margin-top:2px;">
                    ${ar.enabled ? 'Sistem akan restock otomatis saat stok rendah' : 'Restock manual saja'}
                </div>
            </div>
            <button class="toggle-switch ${ar.enabled ? 'on' : ''}"
                    data-auto-toggle data-prod-id="${p.id}"
                    aria-label="${ar.enabled ? 'Matikan' : 'Aktifkan'}">
                <span class="toggle-thumb"></span>
            </button>
        </div>
        ${ar.enabled ? `
            <div class="auto-restock-sub">
                <div class="auto-label">Restock saat stok turun di bawah:</div>
                <div class="threshold-chips">
                    ${[10, 20, 30, 40, 50].map(t => `
                        <button class="chip-small ${ar.thresholdPercent === t ? 'active' : ''}"
                                data-auto-threshold="${t}" data-prod-id="${p.id}">${t}%</button>
                    `).join('')}
                </div>
                <div style="margin-top:10px;">
                    <div class="sum-row"><span>Target stok</span><b>${baseCapacity.toLocaleString('en-US')} unit</b></div>
                    <div class="sum-row"><span>Trigger di</span><b>${threshold.toLocaleString('en-US')} unit</b></div>
                    <div class="sum-row"><span>Stok sekarang</span><b>${p.stock.toLocaleString('en-US')} unit</b></div>
                    <div class="sum-row"><span>Cooldown</span><b>7 hari</b></div>
                    <div class="sum-row"><span>Terakhir auto-order</span><b>${lastOrderDaysAgo !== null ? lastOrderDaysAgo + ' hari lalu' : 'Belum pernah'}</b></div>
                </div>
            </div>
        ` : ''}
    ` : '';

    const html = `
        <div class="modal-title">${escapeHtml(p.name)}</div>
        <div class="modal-sub">Rilis ${p.releaseDate.day}/${p.releaseDate.month}/${p.releaseDate.year}</div>
        <div class="card-title" style="margin-top:8px;">Penjualan</div>
        <div class="sum-row"><span>Total terjual</span><b>${p.totalSold.toLocaleString('en-US')} unit</b></div>
        <div class="sum-row"><span>Pendapatan</span><b>$${p.totalRevenue.toLocaleString('en-US')}</b></div>
        <div class="sum-row"><span>Stok saat ini</span><b>${p.stock.toLocaleString('en-US')}</b></div>
        <div class="sum-row"><span>Ulasan rata-rata</span><b>⭐ ${avg}/10 (${p.reviews.length})</b></div>

        <div class="card-title" style="margin-top:12px;">Spesifikasi</div>
        ${specRows}

        ${autoSection}

        ${p.status === 'selling' ? `
            <div class="card-title" style="margin-top:14px;">Aksi</div>
            <button class="btn-secondary" data-prod-action="order-prod" data-prod-id="${p.id}" style="width:100%;margin-bottom:6px;">
                🏭 Pesan Produksi Tambahan
            </button>
            <button class="btn-secondary" data-prod-action="campaign" data-prod-id="${p.id}" style="width:100%;margin-bottom:6px;">
                📣 Kampanye Pemasaran ${campaigns.length ? '(' + campaigns.length + ' aktif)' : ''}
            </button>
            <button class="btn-danger" data-prod-action="discontinue" data-prod-id="${p.id}" style="width:100%;">
                Hentikan Produk
            </button>
        ` : '<div class="empty-hint" style="margin-top:10px;">Produk sudah dihentikan.</div>'}

        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:12px;">Tutup</button>
    `;
    window.__game.Modal.open('product-detail', html);
}

export function openCampaignModal({ productId }) {
    const { MARKETING_CAMPAIGNS } = window.__game.modules.marketing;
    const html = `
        <div class="modal-title">Pilih Kampanye</div>
        <div class="modal-sub">Efek diperkuat oleh jumlah Marketer.</div>
        ${MARKETING_CAMPAIGNS.map(c => `
            <button class="wiz-option" data-campaign-pick="${c.id}" data-prod-id="${productId}" style="width:100%;margin-bottom:6px;text-align:left;">
                <div class="wiz-opt-name">${escapeHtml(c.name)}</div>
                <div class="wiz-opt-meta">$${c.cost.toLocaleString('en-US')} • ${c.durationDays} hari • reach +${Math.round(c.reachBase * 100)}%</div>
            </button>
        `).join('')}
        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:8px;">Batal</button>
    `;
    window.__game.Modal.open('campaign-pick', html);
}

export function openOrderProductionModal({ productId }) {
    const data = window.__game.state.get();
    const p = data.products.catalog.find(x => x.id === productId);
    if (!p) return;
    const html = `
        <div class="modal-title">Produksi Tambahan</div>
        <div class="modal-sub">${escapeHtml(p.name)}</div>
        <label class="field-label">Jumlah unit</label>
        <input class="field-input" data-order-qty type="number" min="100" step="100" value="1000" />
        <div class="sum-row" style="margin-top:8px;"><span>Biaya per unit</span><b>$${p.unitCost}</b></div>
        <div class="sum-row"><span>Setup cost</span><b>$2.000</b></div>
        <div class="sum-row"><span>Total estimasi</span><b data-order-total>$0</b></div>
        <button class="btn-primary" data-order-confirm data-prod-id="${productId}" style="width:100%;margin-top:12px;">Pesan</button>
        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:6px;">Batal</button>
    `;
    window.__game.Modal.open('order-prod', html);
    const root = document.querySelector('[data-modal-id="order-prod"]');
    const qtyInput = root.querySelector('[data-order-qty]');
    const totalEl = root.querySelector('[data-order-total]');
    const refresh = () => {
        const q = parseInt(qtyInput.value, 10) || 0;
        totalEl.textContent = '$' + ((q * p.unitCost) + 2000).toLocaleString('en-US');
    };
    qtyInput.addEventListener('input', refresh);
    refresh();
}
