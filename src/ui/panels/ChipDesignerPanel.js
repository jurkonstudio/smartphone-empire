// FILE: src/ui/panels/ChipDesignerPanel.js
// v2027.4a — Tambah tombol CTA "Buka Riset Chip" saat arsitektur kosong.
// ============================================================
// ChipDesignerPanel — Wizard desain chip. 4 langkah:
//   1. Nama + Arsitektur
//   2. Node + Cores + Clock + Cache
//   3. Features + Budget
//   4. Preview + Confirm
// Live preview mockup + radar chart.
// ============================================================
import { Modal } from '../modal.js';
import { ToastService } from '../../core/ToastService.js';
import { state } from '../../core/GameState.js';
import {
    CHIP_ARCHITECTURES, getArchitectureById, getAvailableArchitectures
} from '../../data/chip-architecture.data.js';
import {
    CHIP_NODES, getChipNodeById, getAvailableChipNodes
} from '../../data/chip-node.data.js';
import {
    CHIP_FEATURES, FEATURE_CATEGORIES, getChipFeatureById, getAvailableChipFeatures
} from '../../data/chip-features.data.js';
import { renderChipMockup } from '../phone/ChipMockup.js';
import { renderChipRadarChart } from '../charts/ChipRadarChart.js';

let _wiz = null;

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function defaultState() {
    return {
        step: 1,
        name: '',
        architectureId: null,
        nodeId: null,
        cores: 2,
        clockGHz: 1.0,
        cacheKB: 256,
        features: [],
        budgetId: 'normal'
    };
}

// ChipSystem accessor
function chipSystem() {
    return window.__game && window.__game.chips ? window.__game.chips : null;
}

// ============================================================
// OPEN
// ============================================================
export function openChipDesigner() {
    if (state.get().chips && state.get().chips.designing) {
        ToastService.warning('Ada chip yang sedang didesain.');
        return;
    }

    const s = defaultState();
    const archs = chipSystem() ? chipSystem().getAvailableArchitectures() : [];
    const nodes = chipSystem() ? chipSystem().getAvailableNodes() : [];

    // Default: pilih arsitektur & node terbaru yang tersedia
    if (archs.length) s.architectureId = archs[archs.length - 1].id;
    if (nodes.length) s.nodeId = nodes[nodes.length - 1].id;

    _wiz = s;
    _render();
}

// ============================================================
// RENDER
// ============================================================
function _render() {
    const s = _wiz;
    if (!s) return;

    let body = '';
    if (s.step === 1)      body = _step1(s);
    else if (s.step === 2) body = _step2(s);
    else if (s.step === 3) body = _step3(s);
    else                   body = _step4(s);

    const html = `
        <div class="chip-wiz-header">
            <div class="chip-wiz-icon">🧩</div>
            <div>
                <div class="chip-wiz-title">Chip Designer</div>
                <div class="chip-wiz-sub">Rancang silicon-mu sendiri</div>
            </div>
        </div>

        <div class="wiz-step-indicator">
            ${[1,2,3,4].map(i => `<span class="wiz-dot ${i === s.step ? 'active' : ''} ${i < s.step ? 'done' : ''}"></span>`).join('')}
        </div>
        <div class="modal-sub" style="margin-bottom:12px;">Langkah ${s.step} dari 4 — ${_stepTitle(s.step)}</div>

        ${body}
    `;

    if (Modal.isOpen && Modal.isOpen('chip-designer')) {
        const root = document.querySelector('[data-modal-id="chip-designer"]');
        if (root) {
            root.querySelector('.modal-card').innerHTML = html;
            _bindStep();
        }
    } else {
        Modal.open('chip-designer', html, { dismissible: false });
        _bindStep();
    }
}

function _stepTitle(step) {
    return { 1: 'Nama & Arsitektur', 2: 'Spesifikasi', 3: 'Fitur & Budget', 4: 'Preview & Rilis' }[step] || '';
}

// ============================================================
// BIND
// ============================================================
function _bindStep() {
    const root = document.querySelector('[data-modal-id="chip-designer"]');
    if (!root) return;

    const nameInput = root.querySelector('[data-chip-name]');
    if (nameInput) {
        nameInput.value = _wiz.name;
        nameInput.addEventListener('input', (e) => { _wiz.name = e.target.value; });
    }

    root.querySelectorAll('[data-chip-pick]').forEach(btn => {
        btn.addEventListener('click', () => {
            const parts = btn.dataset.chipPick.split(':');
            const key = parts[0];
            const value = parts.slice(1).join(':');
            if (key === 'features') {
                const arr = _wiz.features || [];
                const idx = arr.indexOf(value);
                if (idx >= 0) arr.splice(idx, 1);
                else arr.push(value);
                _wiz.features = arr;
            } else if (key === 'cores' || key === 'clockGHz' || key === 'cacheKB') {
                _wiz[key] = parseFloat(value);
            } else {
                _wiz[key] = value;
            }
            _render();
        });
    });

    const nextBtn = root.querySelector('[data-chip-next]');
    if (nextBtn) nextBtn.addEventListener('click', () => _next());
    const backBtn = root.querySelector('[data-chip-back]');
    if (backBtn) backBtn.addEventListener('click', () => _back());
    const cancelBtn = root.querySelector('[data-chip-cancel]');
    if (cancelBtn) cancelBtn.addEventListener('click', () => { _wiz = null; Modal.close('chip-designer', true); });
    const confirmBtn = root.querySelector('[data-chip-confirm]');
    if (confirmBtn) confirmBtn.addEventListener('click', () => _confirm());

    // [v2027.4a] Tombol CTA ke tab Riset -> Chip
    const gotoResearchBtn = root.querySelector('[data-chip-goto-research]');
    if (gotoResearchBtn) {
        gotoResearchBtn.addEventListener('click', () => {
            _wiz = null;
            Modal.close('chip-designer', true);
            const game = window.__game;
            if (game && game.navigate) {
                game.navigate('research');
                setTimeout(() => {
                    const chipTab = document.querySelector('[data-subtab="chip"]');
                    if (chipTab) chipTab.click();
                }, 60);
            }
        });
    }

    if (_wiz.step === 4) {
        setTimeout(_refreshPreview, 40);
    }
}

// ============================================================
// NAVIGATION
// ============================================================
function _next() {
    const s = _wiz;
    if (s.step === 1) {
        if (!s.name.trim()) { ToastService.warning('Isi nama chip.'); return; }
        if (s.name.length > 24) { ToastService.warning('Nama maksimal 24 karakter.'); return; }
        if (!s.architectureId) { ToastService.warning('Pilih arsitektur.'); return; }
    }
    if (s.step === 2) {
        if (!s.nodeId) { ToastService.warning('Pilih process node.'); return; }
    }
    if (s.step >= 4) return;
    s.step += 1;
    _render();
}

function _back() {
    if (_wiz && _wiz.step > 1) {
        _wiz.step -= 1;
        _render();
    }
}

function _confirm() {
    const s = _wiz;
    const cs = chipSystem();
    if (!cs) { ToastService.error('ChipSystem belum siap.'); return; }

    const res = cs.startDesign({
        name: s.name.trim(),
        architectureId: s.architectureId,
        nodeId: s.nodeId,
        cores: s.cores,
        clockGHz: s.clockGHz,
        cacheKB: s.cacheKB,
        features: s.features.slice(),
        budgetId: s.budgetId
    });
    if (!res.ok) {
        ToastService.error(res.reason || 'Gagal.');
        return;
    }
    _wiz = null;
    Modal.close('chip-designer', true);
    if (window.__game.render) window.__game.render();
}

// ============================================================
// STEP 1 — NAMA & ARSITEKTUR
// ============================================================
function _step1(s) {
    const archs = chipSystem() ? chipSystem().getAvailableArchitectures() : [];
    if (!archs.length) {
        return `<div class="empty-hint" style="margin:20px 0;">Belum ada arsitektur tersedia. Riset chip architecture dulu.</div>
            <div class="wiz-nav">
                <button class="btn-secondary" data-chip-cancel style="flex:1;">Tutup</button>
                <button class="btn-primary" data-chip-goto-research style="flex:2;">Buka Riset Chip →</button>
            </div>`;
    }

    return `
        <label class="field-label">Nama Chip</label>
        <input class="field-input" data-chip-name maxlength="24" placeholder="Contoh: X1 Nano, Titan A1, ..." autocomplete="off" />

        <label class="field-label" style="margin-top:12px;">Arsitektur</label>
        <div class="wiz-options">
            ${archs.map(a => `
                <button class="wiz-option ${s.architectureId === a.id ? 'selected' : ''}" data-chip-pick="architectureId:${a.id}">
                    <div class="wiz-opt-name">${escapeHtml(a.name)}</div>
                    <div class="wiz-opt-meta">Tier ${a.tier} • Max ${a.coresMax} core • ${a.minYear}</div>
                    <div style="font-size:10.5px;color:var(--text-mute);margin-top:4px;line-height:1.4;">${escapeHtml(a.description)}</div>
                </button>
            `).join('')}
        </div>

        <div class="wiz-nav">
            <button class="btn-secondary" data-chip-cancel style="flex:1;">Batal</button>
            <button class="btn-primary" data-chip-next style="flex:2;">Lanjut →</button>
        </div>
    `;
}

// ============================================================
// STEP 2 — SPESIFIKASI
// ============================================================
function _step2(s) {
    const nodes = chipSystem() ? chipSystem().getAvailableNodes() : [];
    const arch = getArchitectureById(s.architectureId);
    const coresMax = arch ? arch.coresMax : 8;

    const coreOptions = [1, 2, 4, 6, 8, 12, 16].filter(c => c <= coresMax);
    const clockOptions = [0.2, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
    const cacheOptions = [64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384];

    return `
        <div style="max-height:50vh;overflow-y:auto;padding-right:4px;">

            <div class="wiz-cat">
                <div class="wiz-cat-title">⚙️ Process Node <span style="color:var(--text-mute);font-weight:500;">(${nodes.length})</span></div>
                <div class="wiz-options-row">
                    ${nodes.length ? nodes.map(n => `
                        <button class="wiz-option ${s.nodeId === n.id ? 'selected' : ''}" data-chip-pick="nodeId:${n.id}">
                            <div class="wiz-opt-name">${escapeHtml(n.name)}</div>
                            <div class="wiz-opt-meta">Tier ${n.tier} • ${n.minYear}</div>
                            <div style="font-size:10px;color:var(--text-mute);margin-top:3px;">
                                Perf ×${n.perfBonus.toFixed(2)} • Yield ${Math.round(n.yieldBase*100)}%
                            </div>
                        </button>
                    `).join('') : '<div class="wiz-empty">Belum ada node tersedia.</div>'}
                </div>
            </div>

            <div class="wiz-cat">
                <div class="wiz-cat-title">🔲 Jumlah Core <span style="color:var(--text-mute);font-weight:500;">(max ${coresMax})</span></div>
                <div class="wiz-options-row">
                    ${coreOptions.map(c => `
                        <button class="wiz-option ${s.cores === c ? 'selected' : ''}" data-chip-pick="cores:${c}" style="min-width:60px;">
                            <div class="wiz-opt-name" style="text-align:center;">${c}x</div>
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="wiz-cat">
                <div class="wiz-cat-title">⚡ Clock Speed (GHz)</div>
                <div class="wiz-options-row">
                    ${clockOptions.map(c => `
                        <button class="wiz-option ${s.clockGHz === c ? 'selected' : ''}" data-chip-pick="clockGHz:${c}" style="min-width:58px;">
                            <div class="wiz-opt-name" style="text-align:center;">${c}</div>
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="wiz-cat">
                <div class="wiz-cat-title">💾 Cache Size</div>
                <div class="wiz-options-row">
                    ${cacheOptions.map(c => {
                        const label = c >= 1024 ? (c/1024) + ' MB' : c + ' KB';
                        return `
                            <button class="wiz-option ${s.cacheKB === c ? 'selected' : ''}" data-chip-pick="cacheKB:${c}" style="min-width:70px;">
                                <div class="wiz-opt-name" style="text-align:center;">${label}</div>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>

        </div>
        <div class="wiz-nav">
            <button class="btn-secondary" data-chip-back style="flex:1;">← Kembali</button>
            <button class="btn-primary" data-chip-next style="flex:2;">Lanjut →</button>
        </div>
    `;
}

// ============================================================
// STEP 3 — FEATURES & BUDGET
// ============================================================
function _step3(s) {
    const feats = chipSystem() ? chipSystem().getAvailableFeatures() : [];
    const budgets = chipSystem() ? chipSystem().getBudgetTiers() : [];

    const byCat = {};
    feats.forEach(f => {
        if (!byCat[f.category]) byCat[f.category] = [];
        byCat[f.category].push(f);
    });

    const featureSections = FEATURE_CATEGORIES.map(cat => {
        const list = byCat[cat.id] || [];
        if (!list.length) return '';
        return `
            <div class="wiz-cat">
                <div class="wiz-cat-title">${cat.icon} ${cat.name}</div>
                <div class="wiz-options-row">
                    ${list.map(f => {
                        const selected = (s.features || []).includes(f.id);
                        return `
                            <button class="wiz-option ${selected ? 'selected' : ''}" data-chip-pick="features:${f.id}" style="min-width:140px;">
                                <div class="wiz-opt-name">${escapeHtml(f.name)}</div>
                                <div class="wiz-opt-meta">+$${f.costPerUnit}/unit</div>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');

    const selectedCount = (s.features || []).length;

    return `
        <div style="max-height:50vh;overflow-y:auto;padding-right:4px;">

            <div class="wiz-cat">
                <div class="wiz-cat-title">💰 Budget R&D</div>
                <div class="wiz-options">
                    ${budgets.map(b => `
                        <button class="wiz-option ${s.budgetId === b.id ? 'selected' : ''}" data-chip-pick="budgetId:${b.id}">
                            <div class="wiz-opt-name">${escapeHtml(b.label)} <span style="color:var(--accent);">×${b.multiplier}</span></div>
                            <div class="wiz-opt-meta">${escapeHtml(b.description)} • Yield ${b.yieldMod >= 0 ? '+' : ''}${Math.round(b.yieldMod*100)}%</div>
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="wiz-cat">
                <div class="wiz-cat-title">🧩 Fitur <span style="color:var(--text-mute);font-weight:500;">(${selectedCount} dipilih)</span></div>
                ${featureSections || '<div class="wiz-empty">Belum ada fitur tersedia.</div>'}
            </div>

        </div>
        <div class="wiz-nav">
            <button class="btn-secondary" data-chip-back style="flex:1;">← Kembali</button>
            <button class="btn-primary" data-chip-next style="flex:2;">Preview →</button>
        </div>
    `;
}

// ============================================================
// STEP 4 — PREVIEW & CONFIRM
// ============================================================
function _step4(s) {
    return `
        <div class="chip-preview-layout">
            <div class="chip-preview-left">
                <div class="chip-preview-device" data-chip-mockup-container></div>
                <div class="chip-preview-radar" data-chip-radar-container></div>
            </div>
            <div class="chip-preview-right">
                <div class="card-title">Preview</div>
                <div data-chip-preview>${_previewHtml(s)}</div>
            </div>
        </div>

        <div class="wiz-nav">
            <button class="btn-secondary" data-chip-back style="flex:1;">← Kembali</button>
            <button class="btn-primary" data-chip-confirm style="flex:2;">Mulai Desain ✓</button>
        </div>
    `;
}

// ============================================================
// LIVE PREVIEW
// ============================================================
function _refreshPreview() {
    const root = document.querySelector('[data-modal-id="chip-designer"]');
    if (!root) return;

    const mc = root.querySelector('[data-chip-mockup-container]');
    if (mc) {
        try { mc.innerHTML = renderChipMockup(_wiz, { size: 190 }); }
        catch (e) { console.error('[ChipDesigner] Mockup error:', e); mc.innerHTML = ''; }
    }

    const rc = root.querySelector('[data-chip-radar-container]');
    if (rc) {
        try {
            const stats = _computeStats(_wiz);
            rc.innerHTML = renderChipRadarChart(stats, { size: 160 });
        } catch (e) { console.error('[ChipDesigner] Radar error:', e); rc.innerHTML = ''; }
    }

    const pe = root.querySelector('[data-chip-preview]');
    if (pe) pe.innerHTML = _previewHtml(_wiz);
}

// ============================================================
// COMPUTE
// ============================================================
function _computeStats(s) {
    const cs = chipSystem();
    if (cs && cs.computeChipStats) {
        try {
            const stats = cs.computeChipStats(s);
            if (stats) {
                const yieldRate = cs.computeYieldRate(s);
                return { ...stats, yieldRate };
            }
        } catch (e) { /* fallback */ }
    }
    return { performance: 0, efficiency: 0, costPerUnit: 0, yieldRate: 0.7 };
}

function _previewHtml(s) {
    const cs = chipSystem();
    if (!cs) return '<div style="font-size:12px;color:var(--text-mute);">ChipSystem belum siap.</div>';
    try {
        const stats = _computeStats(s);
        const designCost = cs.computeDesignCost ? cs.computeDesignCost(s) : 0;
        const durationDays = cs.computeDesignDuration ? cs.computeDesignDuration(s) : 90;
        const yieldRate = cs.computeYieldRate ? cs.computeYieldRate(s) : 0.7;

        const arch = getArchitectureById(s.architectureId);
        const node = getChipNodeById(s.nodeId);
        const featuresCount = (s.features || []).length;

        return `
            <div class="preview-row"><span>Arsitektur</span><b>${escapeHtml(arch ? arch.name : '-')}</b></div>
            <div class="preview-row"><span>Node</span><b>${escapeHtml(node ? node.name : '-')}</b></div>
            <div class="preview-row"><span>Core × Clock</span><b>${s.cores}x @ ${s.clockGHz} GHz</b></div>
            <div class="preview-row"><span>Cache</span><b>${s.cacheKB >= 1024 ? (s.cacheKB/1024) + ' MB' : s.cacheKB + ' KB'}</b></div>
            <div class="preview-row"><span>Fitur</span><b>${featuresCount}</b></div>
            <div class="preview-row"><span>Performance</span><b style="color:var(--success);">${stats.performance}</b></div>
            <div class="preview-row"><span>Efficiency</span><b style="color:var(--info);">${stats.efficiency}</b></div>
            <div class="preview-row"><span>Cost per unit</span><b>$${stats.costPerUnit}</b></div>
            <div class="preview-row"><span>Yield Rate</span><b style="color:${yieldRate >= 0.75 ? 'var(--success)' : yieldRate >= 0.5 ? 'var(--warn)' : 'var(--danger)'};">${Math.round(yieldRate*100)}%</b></div>
            <div class="preview-row total" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
                <span>Biaya Desain</span><b style="color:var(--accent);">$${designCost.toLocaleString('en-US')}</b>
            </div>
            <div class="preview-row"><span>Durasi Desain</span><b>${durationDays} hari</b></div>
        `;
    } catch (e) {
        return '<div style="font-size:12px;color:var(--danger);">Preview error: ' + escapeHtml(e.message) + '</div>';
    }
                }
