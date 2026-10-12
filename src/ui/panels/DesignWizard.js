// FILE: src/ui/panels/DesignWizard.js
// ============================================================
// DesignWizard — wizard desain ponsel ERA-AWARE.
// Kamera bersifat OPSIONAL (ponsel budget bisa tanpa kamera).
// ============================================================
import { Modal } from '../modal.js';
import { ToastService } from '../../core/ToastService.js';
import { state } from '../../core/GameState.js';
import { DesignEraService } from '../../core/DesignEraService.js';
import {
    COMPONENTS, COMPONENT_CATEGORIES, BODY_COLORS,
    getComponentById, getComponentsByCategory, getBodyColorById
} from '../../data/components.data.js';
import { renderPhoneMockup } from '../phone/PhoneMockup.js';
import { renderRadarChart } from '../charts/RadarChart.js';
import { getDesignEraForYear } from '../../data/era-design.data.js';

let _wizardState = null;

// Kategori yang boleh kosong
const OPTIONAL_CATEGORIES = ['camera'];

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function defaultState() {
    return {
        step: 1,
        name: '',
        formFactorId: null,
        displayId: null,
        cameraId: 'none',
        batteryId: null,
        chipId: null,
        networkId: null,
        osOptionId: null,
        bodyId: null,
        bodyColorId: null,
        price: 200,
        productionQty: 5000
    };
}

// ============================================================
// FILTER KOMPONEN PER ERA
// ============================================================
function filterComponentsByEra(catId) {
    const year = DesignEraService.getCurrentYear();
    const completed = state.get().research.completed || [];
    const all = getComponentsByCategory(catId);
    return all.filter(c => {
        if (typeof c.minYear === 'number' && year < c.minYear) return false;
        if (c.requiresResearch && !completed.includes(c.requiresResearch)) return false;
        return true;
    });
}

function filterFormFactorsByEra() {
    const year = DesignEraService.getCurrentYear();
    const era = getDesignEraForYear(year);
    const all = COMPONENTS.filter(c => c.category === 'form_factor');
    return all.filter(f => {
        if (typeof f.minYear === 'number' && year < f.minYear) return false;
        if (Array.isArray(era.formFactors) && era.formFactors.length) {
            return era.formFactors.includes(f.id);
        }
        return true;
    });
}

function filterBodyColorsByEra() {
    const year = DesignEraService.getCurrentYear();
    const era = getDesignEraForYear(year);
    if (!Array.isArray(era.bodyColors) || !era.bodyColors.length) return BODY_COLORS;
    return BODY_COLORS.filter(c => era.bodyColors.includes(c.id));
}

function filterBodiesByEra() {
    const year = DesignEraService.getCurrentYear();
    const completed = state.get().research.completed || [];
    const all = getComponentsByCategory('body');
    return all.filter(b => {
        if (typeof b.minYear === 'number' && year < b.minYear) return false;
        if (b.requiresResearch && !completed.includes(b.requiresResearch)) return false;
        return true;
    });
}

function currentEraInfo() {
    const year = DesignEraService.getCurrentYear();
    return getDesignEraForYear(year);
}

// ============================================================
// OPEN WIZARD
// ============================================================
export function openDesignWizard({ researchSystem, osSystem, productSystem }) {
    if (state.get().products.development) {
        ToastService.warning('Ada produk yang sedang dikembangkan.');
        return;
    }

    const s = defaultState();
    const ffs = filterFormFactorsByEra();
    if (ffs.length) s.formFactorId = ffs[ffs.length - 1].id;
    const colors = filterBodyColorsByEra();
    if (colors.length) s.bodyColorId = colors[colors.length - 1].id;

    _wizardState = s;
    _render();
}

// ============================================================
// RENDER
// ============================================================
function _render() {
    const s = _wizardState;
    if (!s) return;

    const era = currentEraInfo();
    let body = '';
    if (s.step === 1)      body = _step1(s);
    else if (s.step === 2) body = _step2(s);
    else if (s.step === 3) body = _step3(s);
    else                   body = _step4(s);

    const html = `
        <div class="wiz-era-banner" style="background:${era.aesthetic.bg};border-color:${era.aesthetic.accent}40;">
            <div class="wiz-era-year">${DesignEraService.getCurrentYear()}</div>
            <div class="wiz-era-info">
                <div class="wiz-era-label" style="color:${era.aesthetic.accent};">${escapeHtml(era.label)}</div>
                <div class="wiz-era-desc">${escapeHtml(era.description)}</div>
            </div>
        </div>

        <div class="wiz-step-indicator">
            ${[1,2,3,4].map(i => `<span class="wiz-dot ${i === s.step ? 'active' : ''} ${i < s.step ? 'done' : ''}"></span>`).join('')}
        </div>
        <div class="modal-sub" style="margin-bottom:12px;">Langkah ${s.step} dari 4 — ${_stepTitle(s.step)}</div>

        ${body}
    `;

    if (Modal.isOpen && Modal.isOpen('design-wizard')) {
        const root = document.querySelector('[data-modal-id="design-wizard"]');
        if (root) {
            root.querySelector('.modal-card').innerHTML = html;
            _bindStep();
        }
    } else {
        Modal.open('design-wizard', html, { dismissible: false });
        _bindStep();
    }
}

function _stepTitle(step) {
    return { 1: 'Nama & Bentuk', 2: 'Komponen', 3: 'OS & Bodi', 4: 'Harga & Produksi' }[step] || '';
}

// ============================================================
// BIND
// ============================================================
function _bindStep() {
    const root = document.querySelector('[data-modal-id="design-wizard"]');
    if (!root) return;

    const nameInput = root.querySelector('[data-wiz-name]');
    if (nameInput) {
        nameInput.value = _wizardState.name;
        nameInput.addEventListener('input', (e) => { _wizardState.name = e.target.value; });
    }

    root.querySelectorAll('[data-wiz-pick]').forEach(btn => {
        btn.addEventListener('click', () => {
            const parts = btn.dataset.wizPick.split(':');
            const key = parts[0];
            const value = parts.slice(1).join(':');
            _wizardState[key] = value;
            _render();
        });
    });

    const priceInput = root.querySelector('[data-wiz-price]');
    if (priceInput) {
        priceInput.value = _wizardState.price;
        priceInput.addEventListener('input', (e) => {
            _wizardState.price = parseInt(e.target.value, 10) || 0;
            _refreshPreview();
        });
    }
    const qtyInput = root.querySelector('[data-wiz-qty]');
    if (qtyInput) {
        qtyInput.value = _wizardState.productionQty;
        qtyInput.addEventListener('input', (e) => {
            _wizardState.productionQty = parseInt(e.target.value, 10) || 0;
            _refreshPreview();
        });
    }

    const nextBtn = root.querySelector('[data-wiz-next]');
    if (nextBtn) nextBtn.addEventListener('click', () => _next());
    const backBtn = root.querySelector('[data-wiz-back]');
    if (backBtn) backBtn.addEventListener('click', () => _back());
    const cancelBtn = root.querySelector('[data-wiz-cancel]');
    if (cancelBtn) cancelBtn.addEventListener('click', () => { _wizardState = null; Modal.close('design-wizard', true); });
    const confirmBtn = root.querySelector('[data-wiz-confirm]');
    if (confirmBtn) confirmBtn.addEventListener('click', () => _confirm());

    if (_wizardState.step === 4) {
        setTimeout(_refreshPreview, 50);
    }
}

// ============================================================
// NAVIGATION
// ============================================================
function _next() {
    const s = _wizardState;
    if (s.step === 1) {
        if (!s.name.trim()) { ToastService.warning('Isi nama produk.'); return; }
        if (!s.formFactorId) { ToastService.warning('Pilih bentuk.'); return; }
    }
    if (s.step === 2) {
        // Kamera OPSIONAL — cek komponen wajib saja
        if (!s.displayId || !s.batteryId || !s.chipId || !s.networkId) {
            ToastService.warning('Lengkapi komponen wajib (layar, baterai, chip, jaringan).');
            return;
        }
    }
    if (s.step === 3) {
        if (!s.osOptionId || !s.bodyId || !s.bodyColorId) {
            ToastService.warning('Pilih OS, bodi, dan warna.');
            return;
        }
    }
    if (s.step >= 4) return;
    s.step += 1;
    _render();
}

function _back() {
    if (_wizardState && _wizardState.step > 1) {
        _wizardState.step -= 1;
        _render();
    }
}

function _confirm() {
    const s = _wizardState;
    const game = window.__game;
    if (!game || !game.products) { ToastService.error('Sistem belum siap.'); return; }

    const res = game.products.confirmDesign({
        name: s.name.trim(),
        formFactorId: s.formFactorId,
        displayId: s.displayId,
        cameraId: (s.cameraId && s.cameraId !== 'none') ? s.cameraId : null,
        batteryId: s.batteryId,
        chipId: s.chipId,
        networkId: s.networkId,
        bodyId: s.bodyId,
        bodyColorId: s.bodyColorId,
        osOptionId: s.osOptionId,
        price: s.price,
        productionQty: s.productionQty
    });
    if (!res.ok) {
        ToastService.error(res.reason || 'Gagal.');
        return;
    }
    ToastService.success('Pengembangan dimulai!');
    _wizardState = null;
    Modal.close('design-wizard', true);
    if (game.render) game.render();
}

// ============================================================
// STEP 1
// ============================================================
function _step1(s) {
    const ffs = filterFormFactorsByEra();
    if (!ffs.length) {
        return `
            <div class="empty-hint" style="margin:20px 0;">Tidak ada form factor tersedia di tahun ini. Riset dulu.</div>
            <div class="wiz-nav">
                <button class="btn-secondary" data-wiz-cancel style="flex:1;">Batal</button>
            </div>
        `;
    }

    return `
        <label class="field-label">Nama Ponsel</label>
        <input class="field-input" data-wiz-name maxlength="24" placeholder="Contoh: X1, Nova, ..." autocomplete="off" />

        <label class="field-label" style="margin-top:12px;">Bentuk (Form Factor)</label>
        <div class="wiz-options">
            ${ffs.map(f => `
                <button class="wiz-option ${s.formFactorId === f.id ? 'selected' : ''}" data-wiz-pick="formFactorId:${f.id}">
                    <div class="wiz-opt-name">${escapeHtml(f.name)}</div>
                    <div class="wiz-opt-meta">Tier ${f.tier} • ${f.minYear}</div>
                </button>
            `).join('')}
        </div>

        <div class="wiz-nav">
            <button class="btn-secondary" data-wiz-cancel style="flex:1;">Batal</button>
            <button class="btn-primary" data-wiz-next style="flex:2;">Lanjut →</button>
        </div>
    `;
}

// ============================================================
// STEP 2 — KOMPONEN (kamera opsional)
// ============================================================
function _step2(s) {
    const cats = ['display', 'camera', 'battery', 'chip', 'network'];
    const stateKeys = {
        display: 'displayId',
        camera: 'cameraId',
        battery: 'batteryId',
        chip: 'chipId',
        network: 'networkId'
    };

    const groups = cats.map(catId => {
        const cat = COMPONENT_CATEGORIES.find(c => c.id === catId);
        const list = filterComponentsByEra(catId);
        const stateKey = stateKeys[catId];
        const selected = s[stateKey];
        const isOptional = OPTIONAL_CATEGORIES.includes(catId);

        let options = list.map(c => `
            <button class="wiz-option ${selected === c.id ? 'selected' : ''}" data-wiz-pick="${stateKey}:${c.id}">
                <div class="wiz-opt-name">${escapeHtml(c.name)}</div>
                <div class="wiz-opt-meta">$${c.costPerUnit}/unit</div>
            </button>
        `).join('');

        // Tambahkan opsi "Tanpa X" untuk kategori opsional
        if (isOptional) {
            const noneLabel = catId === 'camera' ? 'Tanpa Kamera' : 'Tanpa ' + cat.name;
            const noneMeta = catId === 'camera' ? 'Hemat biaya produksi' : 'Opsional';
            const isNoneSelected = (!selected || selected === 'none');
            options = `
                <button class="wiz-option ${isNoneSelected ? 'selected' : ''}" data-wiz-pick="${stateKey}:none">
                    <div class="wiz-opt-name">${noneLabel}</div>
                    <div class="wiz-opt-meta">${noneMeta}</div>
                </button>
            ` + options;
        }

        // Jika tidak ada komponen sama sekali & tidak optional → tampilkan pesan
        const totalCount = list.length + (isOptional ? 1 : 0);
        if (totalCount === 0) {
            options = `<div class="wiz-empty">Belum ada komponen — riset dulu atau tunggu tahun berikutnya.</div>`;
        }

        return `
            <div class="wiz-cat">
                <div class="wiz-cat-title">${cat.icon} ${cat.name} <span style="color:var(--text-mute);font-weight:500;">(${list.length}${isOptional ? ' + opsional' : ''})</span></div>
                <div class="wiz-options-row">${options}</div>
            </div>
        `;
    }).join('');

    return `
        <div style="max-height:45vh;overflow-y:auto;padding-right:4px;">${groups}</div>
        <div class="wiz-nav">
            <button class="btn-secondary" data-wiz-back style="flex:1;">← Kembali</button>
            <button class="btn-primary" data-wiz-next style="flex:2;">Lanjut →</button>
        </div>
    `;
}

// ============================================================
// STEP 3 — OS & BODI
// ============================================================
function _step3(s) {
    const osOptions = (window.__game && window.__game.os && window.__game.os.getOsOptionsForPhone)
        ? window.__game.os.getOsOptionsForPhone()
        : [];
    const bodies = filterBodiesByEra();
    const colors = filterBodyColorsByEra();

    if (colors.length && !colors.some(c => c.id === s.bodyColorId)) {
        s.bodyColorId = colors[0].id;
    }

    return `
        <div style="max-height:45vh;overflow-y:auto;padding-right:4px;">
            <div class="wiz-cat">
                <div class="wiz-cat-title">💿 Sistem Operasi</div>
                <div class="wiz-options-row">
                    ${osOptions.length ? osOptions.map(o => `
                        <button class="wiz-option ${s.osOptionId === o.id ? 'selected' : ''}" data-wiz-pick="osOptionId:${o.id}">
                            <div class="wiz-opt-name">${escapeHtml(o.label)}</div>
                            <div class="wiz-opt-meta">${o.source === 'license' ? '$' + o.costPerUnit + '/unit' : 'Gratis'}</div>
                        </button>
                    `).join('') : '<div class="wiz-empty">Belum ada OS. Buat OS dulu di tab Riset.</div>'}
                </div>
            </div>

            <div class="wiz-cat">
                <div class="wiz-cat-title">🧱 Bodi</div>
                <div class="wiz-options-row">
                    ${bodies.length ? bodies.map(b => `
                        <button class="wiz-option ${s.bodyId === b.id ? 'selected' : ''}" data-wiz-pick="bodyId:${b.id}">
                            <div class="wiz-opt-name">${escapeHtml(b.name)}</div>
                            <div class="wiz-opt-meta">$${b.costPerUnit}/unit</div>
                        </button>
                    `).join('') : '<div class="wiz-empty">Belum ada bodi tersedia.</div>'}
                </div>
            </div>

            <div class="wiz-cat">
                <div class="wiz-cat-title">🎨 Warna</div>
                ${colors.length ? `
                    <div class="wiz-colors">
                        ${colors.map(c => `
                            <button class="wiz-color ${s.bodyColorId === c.id ? 'selected' : ''}"
                                    data-wiz-pick="bodyColorId:${c.id}"
                                    style="background:${c.hex};"
                                    title="${escapeHtml(c.name)}"
                                    aria-label="${escapeHtml(c.name)}"></button>
                        `).join('')}
                    </div>
                ` : '<div class="wiz-empty">Belum ada warna tersedia.</div>'}
            </div>
        </div>
        <div class="wiz-nav">
            <button class="btn-secondary" data-wiz-back style="flex:1;">← Kembali</button>
            <button class="btn-primary" data-wiz-next style="flex:2;">Lanjut →</button>
        </div>
    `;
}

// ============================================================
// STEP 4 — HARGA + PREVIEW
// ============================================================
function _step4(s) {
    return `
        <div class="wiz-preview-layout">
            <div class="wiz-preview-left">
                <div class="wiz-preview-device">
                    <div data-wiz-mockup-container></div>
                </div>
                <div class="wiz-preview-radar" data-wiz-radar-container></div>
            </div>
            <div class="wiz-preview-right">
                <label class="field-label">Harga Jual (USD)</label>
                <input class="field-input" data-wiz-price type="number" min="1" value="${s.price}" />

                <label class="field-label" style="margin-top:10px;">Jumlah Produksi Awal</label>
                <input class="field-input" data-wiz-qty type="number" min="100" step="100" value="${s.productionQty}" />

                <div style="margin-top:14px;">
                    <div class="card-title">Preview</div>
                    <div data-wiz-preview>${_previewHtml(s)}</div>
                </div>
            </div>
        </div>

        <div class="wiz-nav">
            <button class="btn-secondary" data-wiz-back style="flex:1;">← Kembali</button>
            <button class="btn-primary" data-wiz-confirm style="flex:2;">Rilis Produk ✓</button>
        </div>
    `;
}

// ============================================================
// LIVE PREVIEW
// ============================================================
function _refreshPreview() {
    const root = document.querySelector('[data-modal-id="design-wizard"]');
    if (!root) return;

    const mockupContainer = root.querySelector('[data-wiz-mockup-container]');
    if (mockupContainer) {
        try {
            mockupContainer.innerHTML = renderPhoneMockup(_wizardState, { size: 180 });
        } catch (e) {
            console.error('[DesignWizard] Mockup error:', e);
            mockupContainer.innerHTML = '<div style="color:var(--text-mute);font-size:11px;">Mockup error</div>';
        }
    }

    const radarContainer = root.querySelector('[data-wiz-radar-container]');
    if (radarContainer) {
        try {
            const stats = _computeStats(_wizardState);
            radarContainer.innerHTML = renderRadarChart(stats, { size: 160 });
        } catch (e) {
            console.error('[DesignWizard] Radar error:', e);
            radarContainer.innerHTML = '';
        }
    }

    const previewEl = root.querySelector('[data-wiz-preview]');
    if (previewEl) previewEl.innerHTML = _previewHtml(_wizardState);
}

function _computeStats(s) {
    const ps = window.__game && window.__game.products;
    if (ps && ps.computeStats) {
        try { return ps.computeStats(s); }
        catch (e) { /* fallback */ }
    }
    const stat = { display: 0, camera: 0, battery: 0, performance: 0, connectivity: 0, quality: 0, design: 0, usability: 0 };
    const map = {
        displayId: 'display', cameraId: 'camera', batteryId: 'battery',
        chipId: 'performance', networkId: 'connectivity', bodyId: 'quality',
        formFactorId: 'usability'
    };
    for (const k in map) {
        const comp = getComponentById(s[k]);
        if (comp && comp.stats) {
            for (const st in comp.stats) {
                if (stat[st] !== undefined) stat[st] += comp.stats[st];
            }
        }
    }
    ['display','camera','battery','performance','connectivity','quality','design','usability'].forEach(k => {
        stat[k] = Math.max(0, Math.min(100, Math.round(stat[k])));
    });
    return stat;
}

function _previewHtml(s) {
    const ps = window.__game && window.__game.products;
    if (!ps) return '<div style="font-size:12px;color:var(--text-mute);">Sistem belum siap.</div>';
    try {
        const stats = _computeStats(s);
        const unitCost = ps.computeUnitCost ? ps.computeUnitCost(s) : 0;
        const totalCost = unitCost * (s.productionQty || 0) + 2000;
        const demand = ps.estimateDemand ? ps.estimateDemand(s) : 0;
        const margin = (s.price || 0) - unitCost;
        const marginPct = s.price > 0 ? Math.round((margin / s.price) * 100) : 0;
        const noCamera = !s.cameraId || s.cameraId === 'none';

        const warnings = [];
        if (stats.performance > 60 && stats.battery < 40) warnings.push('Chip kuat tapi baterai kecil.');
        if (stats.camera > 60 && stats.display < 40) warnings.push('Kamera bagus tapi layar kurang.');
        if (margin < 0) warnings.push('Harga di bawah biaya produksi!');

        return `
            <div class="preview-row"><span>Skor Kualitas</span><b>${stats.qualityScore || 0}/100</b></div>
            <div class="preview-row"><span>Biaya per unit</span><b>$${unitCost}</b></div>
            <div class="preview-row"><span>Total biaya</span><b>$${totalCost.toLocaleString('en-US')}</b></div>
            <div class="preview-row"><span>Margin</span><b style="color:${margin >= 0 ? 'var(--success)' : 'var(--danger)'};">$${margin} (${marginPct}%)</b></div>
            <div class="preview-row"><span>Estimasi permintaan/hari</span><b>~${demand.toLocaleString('en-US')} unit</b></div>
            ${noCamera ? '<div style="margin-top:8px;font-size:11px;color:var(--text-mute);">ℹ Ponsel ini tanpa kamera — pasar mungkin kurang tertarik.</div>' : ''}
            ${warnings.length ? `<div style="margin-top:8px;font-size:11px;color:var(--warn);line-height:1.5;">⚠ ${warnings.join('<br>⚠ ')}</div>` : ''}
        `;
    } catch (e) {
        return '<div style="font-size:12px;color:var(--danger);">Preview error: ' + escapeHtml(e.message) + '</div>';
    }
}
