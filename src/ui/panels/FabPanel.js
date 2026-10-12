// FILE: src/ui/panels/FabPanel.js
// ============================================================
// FabPanel — panel Fab (pabrik chip) dalam bentuk modal.
// Menampilkan: status fab, build CTA, upgrade, produksi, history.
// ============================================================
import { Modal } from '../modal.js';
import { ToastService } from '../../core/ToastService.js';
import { state } from '../../core/GameState.js';

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
    if (!fs) { ToastService.error('FabSystem belum siap.'); return; }
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
// BUILD CTA (belum ada fab)
// ============================================================
function _renderBuildCTA(summary, data) {
    const fs = fabSystem();
    const tiers = fs.constructor ? [] : []; // fallback

    // Import FAB_LEVELS via system
    const levels = [
        { level: 1, id: 'small',  name: 'Small Fab',   cost: 5000000,   durationDays: 90,  capacityMonthly: 5000,   description: 'Fab kecil untuk chip awal' },
        { level: 2, id: 'medium', name: 'Medium Fab',  cost: 25000000,  durationDays: 150, capacityMonthly: 50000,  description: 'Fab skala menengah' },
        { level: 3, id: 'large',  name: 'Large Fab',   cost: 120000000, durationDays: 240, capacityMonthly: 500000, description: 'Fab skala besar' },
        { level: 4, id: 'mega',   name: 'Mega Fab',    cost: 600000000, durationDays: 360, capacityMonthly: 5000000, description: 'Fab kelas industri' }
    ];

    const hasResearch = (data.research.completed || []).includes('fab_construction');

    return `
        <div class="modal-title">🏭 Bangun Fabrikasi Chip</div>
        <div class="modal-sub">Pabrik chip sendiri = biaya per unit lebih murah & kontrol penuh.</div>

        ${!hasResearch ? `
            <div class="fab-warning">
                ⚠ Butuh riset <b>Konstruksi Fab</b> untuk membangun pabrik.
                <br><span style="font-size:11px;">Riset tersedia tahun 2010.</span>
            </div>
        ` : ''}

        <div class="fab-tier-list">
            ${levels.map(t => {
                const canAfford = data.cash >= t.cost;
                const disabled = !hasResearch || !canAfford;
                return `
                    <div class="fab-tier-card ${disabled ? 'disabled' : ''}">
                        <div class="fab-tier-head">
                            <div>
                                <div class="fab-tier-name">${escapeHtml(t.name)}</div>
                                <div class="fab-tier-desc">${escapeHtml(t.description)}</div>
                            </div>
                            <div class="fab-tier-badge">Lv ${t.level}</div>
                        </div>
                        <div class="fab-tier-stats">
                            <div class="fab-stat">
                                <div class="fab-stat-label">Biaya</div>
                                <div class="fab-stat-value" style="color:var(--accent);">$${t.cost.toLocaleString('en-US')}</div>
                            </div>
                            <div class="fab-stat">
                                <div class="fab-stat-label">Durasi</div>
                                <div class="fab-stat-value">${t.durationDays} hari</div>
                            </div>
                            <div class="fab-stat">
                                <div class="fab-stat-label">Kapasitas</div>
                                <div class="fab-stat-value">${t.capacityMonthly.toLocaleString('en-US')}/bln</div>
                            </div>
                        </div>
                        ${!disabled ? `
                            <button class="btn-primary" data-fab-action="build" data-fab-level="${t.level}" style="width:100%;margin-top:8px;">
                                Bangun ${escapeHtml(t.name)}
                            </button>
                        ` : `
                            <button class="btn-secondary" disabled style="width:100%;margin-top:8px;opacity:0.5;">
                                ${!hasResearch ? 'Butuh riset Fab' : 'Uang tidak cukup'}
                            </button>
                        `}
                    </div>
                `;
            }).join('')}
        </div>

        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:8px;">Tutup</button>
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
        progressHtml = `
            <div class="card" style="border-color:var(--warn);">
                <div class="card-title" style="color:var(--warn);">${u.isBuild ? '🏗️ Membangun' : '⬆️ Upgrade'} ke Level ${u.targetLevel}</div>
                <div class="progress-label"><span>Progress</span><span>${pct}%</span></div>
                <div class="progress"><div class="progress-bar" style="width:${pct}%;"></div></div>
                <div style="font-size:11.5px;color:var(--text-mute);margin-top:6px;">
                    ${Math.max(0, Math.ceil(u.durationDays - u.progressDays))} hari tersisa
                </div>
                <button class="btn-danger" data-fab-action="cancel-upgrade" style="width:100%;margin-top:10px;font-size:12px;">Batalkan</button>
            </div>
        `;
    }

    // Producing
    let prodHtml = '';
    if (summary.producing) {
        const p = summary.producing;
        const pct = Math.round((p.progressUnits / p.totalUnits) * 100);
        progressHtml += `
            <div class="card" style="border-color:var(--info);">
                <div class="card-title" style="color:var(--info);">⚙️ Produksi: ${escapeHtml(p.chipName)}</div>
                <div class="progress-label"><span>${Math.floor(p.progressUnits).toLocaleString('en-US')} / ${p.totalUnits.toLocaleString('en-US')} unit</span><span>${pct}%</span></div>
                <div class="progress"><div class="progress-bar" style="width:${pct}%;"></div></div>
                <div style="font-size:11.5px;color:var(--text-mute);margin-top:6px;">
                    Yield ${Math.round(p.yieldRate * 100)}% • Sisa ${Math.max(0, Math.ceil(p.durationDays - (p.progressUnits / p.totalUnits * p.durationDays)))} hari
                </div>
                <button class="btn-danger" data-fab-action="cancel-prod" style="width:100%;margin-top:10px;font-size:12px;">Batalkan Produksi</button>
            </div>
        `;
    }

    // Fab info
    const levelInfo = summary.levelInfo;
    const capacity = levelInfo ? levelInfo.capacityMonthly : 0;

    const infoCard = `
        <div class="card">
            <div class="card-title">🏭 ${levelInfo ? levelInfo.name : 'Fab'}</div>
            <div class="sum-row"><span>Level</span><b>${summary.level}</b></div>
            <div class="sum-row"><span>Kapasitas</span><b>${capacity.toLocaleString('en-US')} unit/bulan</b></div>
            <div class="sum-row"><span>Stok chip siap pakai</span><b style="color:var(--accent);">${summary.inventory.toLocaleString('en-US')} unit</b></div>
            <div class="sum-row"><span>Total diproduksi</span><b>${summary.totalProduced.toLocaleString('en-US')} unit</b></div>
        </div>
    `;

    // Produksi aktif hanya jika tidak sedang building/producing
    let productionSection = '';
    if (!summary.upgrade && !summary.producing) {
        const chips = (data.chips.catalog || []);
        if (chips.length > 0) {
            productionSection = `
                <div class="card">
                    <div class="card-title">Mulai Produksi</div>
                    <div style="font-size:12px;color:var(--text-mute);margin-bottom:10px;">
                        Pilih chip untuk diproduksi massal. Kapasitas fab: ${capacity.toLocaleString('en-US')} unit/bulan.
                    </div>
                    ${chips.slice(0, 5).map(c => `
                        <button class="wiz-option" data-fab-action="select-prod" data-chip-id="${c.id}" style="width:100%;margin-bottom:6px;text-align:left;">
                            <div class="wiz-opt-name">${escapeHtml(c.name)}</div>
                            <div class="wiz-opt-meta">Perf ${c.stats.performance} • Eff ${c.stats.efficiency} • $${c.stats.costPerUnit}/unit</div>
                        </button>
                    `).join('')}
                </div>
            `;
        } else {
            productionSection = `
                <div class="card">
                    <div class="card-title">Mulai Produksi</div>
                    <div style="font-size:12px;color:var(--text-mute);">
                        Belum ada chip di katalog. Desain chip dulu di Chip Designer.
                    </div>
                </div>
            `;
        }
    }

    // Upgrade button
    const nextLevel = summary.level < 4 ? summary.level + 1 : null;
    const nextLevelInfo = nextLevel ? (function(){
        const levels = [
            { level: 2, name: 'Medium Fab', cost: 25000000, durationDays: 150 },
            { level: 3, name: 'Large Fab',  cost: 120000000, durationDays: 240 },
            { level: 4, name: 'Mega Fab',   cost: 600000000, durationDays: 360 }
        ];
        return levels.find(l => l.level === nextLevel);
    })() : null;

    const upgradeSection = nextLevelInfo ? `
        <div class="card">
            <div class="card-title">⬆️ Upgrade Fab</div>
            <div class="sum-row"><span>Target</span><b>${escapeHtml(nextLevelInfo.name)}</b></div>
            <div class="sum-row"><span>Biaya</span><b>$${nextLevelInfo.cost.toLocaleString('en-US')}</b></div>
            <div class="sum-row"><span>Durasi</span><b>${nextLevelInfo.durationDays} hari</b></div>
            <button class="btn-primary" data-fab-action="upgrade" style="width:100%;margin-top:10px;"
                ${data.cash < nextLevelInfo.cost ? 'disabled style="opacity:0.5;width:100%;margin-top:10px;"' : ''}>
                ${data.cash < nextLevelInfo.cost ? 'Uang Tidak Cukup' : 'Upgrade Fab'}
            </button>
        </div>
    ` : `
        <div class="card">
            <div class="card-title">⬆️ Upgrade Fab</div>
            <div style="font-size:12px;color:var(--text-mute);">Fab sudah di level maksimal.</div>
        </div>
    `;

    // History
    const historyHtml = summary.history.length ? `
        <div class="card">
            <div class="card-title">Riwayat Produksi</div>
            ${summary.history.map(h => `
                <div class="sum-row">
                    <span>${escapeHtml(h.chipName)}</span>
                    <b>${h.qty.toLocaleString('en-US')} unit</b>
                </div>
            `).join('')}
        </div>
    ` : '';

    return `
        <div class="modal-title">🏭 Fab Panel</div>
        <div class="modal-sub">Kelola pabrik chip Anda</div>
        ${progressHtml}
        ${infoCard}
        ${productionSection}
        ${upgradeSection}
        ${historyHtml}
        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:8px;">Tutup</button>
    `;
}

// ============================================================
// BIND
// ============================================================
function _bind() {
    const root = document.querySelector('[data-modal-id="fab-panel"]');
    if (!root) return;
    // Handler dipasang via event delegation global di main.js
    // (data-fab-action akan ditangkap di bindGlobalClicks)
}

// ============================================================
// PRODUCTION QTY MODAL
// ============================================================
export function openProductionQtyModal(chipId) {
    const cs = chipSystem();
    const fs = fabSystem();
    if (!cs || !fs) return;

    const chip = cs.getChipById(chipId);
    if (!chip) { ToastService.error('Chip tidak ditemukan.'); return; }

    const summary = fs.getFabSummary();
    const capacity = summary.levelInfo ? summary.levelInfo.capacityMonthly : 5000;
    const defaultQty = Math.min(capacity, 5000);

    const html = `
        <div class="modal-title">🏭 Produksi: ${escapeHtml(chip.name)}</div>
        <div class="modal-sub">Target output unit chip</div>
        <label class="field-label">Jumlah Unit</label>
        <input class="field-input" data-prod-qty type="number" min="100" step="100" value="${defaultQty}" />
        <div class="sum-row" style="margin-top:8px;"><span>Kapasitas fab</span><b>${capacity.toLocaleString('en-US')}/bln</b></div>
        <div class="sum-row"><span>Cost per unit</span><b>$${chip.stats.costPerUnit}</b></div>
        <div class="sum-row"><span>Yield rate</span><b>${Math.round(chip.yieldRate * 100)}%</b></div>
        <div class="sum-row total"><span>Estimasi biaya</span><b data-prod-total>$0</b></div>
        <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn-secondary" data-modal-close style="flex:1;">Batal</button>
            <button class="btn-primary" data-fab-action="confirm-prod" data-chip-id="${chipId}" style="flex:1;">Produksi</button>
        </div>
    `;
    Modal.open('fab-prod-qty', html);

    const root = document.querySelector('[data-modal-id="fab-prod-qty"]');
    const input = root.querySelector('[data-prod-qty]');
    const totalEl = root.querySelector('[data-prod-total]');
    const refresh = () => {
        const q = parseInt(input.value, 10) || 0;
        const effective = Math.ceil(q / chip.yieldRate);
        totalEl.textContent = '$' + (effective * chip.stats.costPerUnit).toLocaleString('en-US');
    };
    input.addEventListener('input', refresh);
    refresh();
      }
