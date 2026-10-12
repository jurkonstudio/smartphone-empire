// FILE: src/ui/panels/DesignWizard.js
// Wizard modal desain ponsel. Multi-step: Nama+FF → Komponen → OS+Bodi → Harga+Qty.
import { Modal } from '../modal.js';
import { ToastService } from '../../core/ToastService.js';
import {
    COMPONENTS, COMPONENT_CATEGORIES, BODY_COLORS,
    getComponentsByCategory, getComponentById, getBodyColorById
} from '../../data/components.data.js';

// State wizard disimpan di module-scope (tidak masuk save)
let _wizardState = null;

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
        cameraId: null,
        batteryId: null,
        chipId: null,
        networkId: null,
        osOptionId: null,
        bodyId: null,
        bodyColorId: 'color_black',
        price: 200,
        productionQty: 5000
    };
}

function getUnlockedByCategory(catId, researchSystem) {
    const completed = researchSystem ? researchSystem.state.data.research.completed : [];
    return getComponentsByCategory(catId).filter(c => {
        if (!c.requiresResearch) return true;
        return completed.includes(c.requiresResearch);
    });
}

export function openDesignWizard({ researchSystem, osSystem, productSystem }) {
    if (window.__game.state.get().products.development) {
        ToastService.warning('Ada produk yang sedang dikembangkan.');
        return;
    }
    _wizardState = defaultState();
    _render();
}

function _render() {
    const s = _wizardState;
    let body = '';
    if (s.step === 1)      body = _step1(s);
    else if (s.step === 2) body = _step2(s);
    else if (s.step === 3) body = _step3(s);
    else                   body = _step4(s);

    const html = `
        <div class="modal-title">Desain Ponsel</div>
        <div class="wiz-step-indicator">
            ${[1,2,3,4].map(i => `<span class="wiz-dot ${i === s.step ? 'active' : ''} ${i < s.step ? 'done' : ''}"></span>`).join('')}
        </div>
        <div class="modal-sub">Langkah ${s.step} dari 4</div>
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

function _bindStep() {
    const root = document.querySelector('[data-modal-id="design-wizard"]');
    if (!root) return;
    // Input nama
    const nameInput = root.querySelector('[data-wiz-name]');
    if (nameInput) {
        nameInput.value = _wizardState.name;
        nameInput.addEventListener('input', (e) => { _wizardState.name = e.target.value; });
    }
    // Option picker (data-wiz-pick="key:value")
    root.querySelectorAll('[data-wiz-pick]').forEach(btn => {
        btn.addEventListener('click', () => {
            const parts = btn.dataset.wizPick.split(':');
            const key = parts[0];
            const value = parts.slice(1).join(':');
            _wizardState[key] = value;
            _render();
        });
    });
    // Input harga & qty
    const priceInput = root.querySelector('[data-wiz-price]');
    if (priceInput) {
        priceInput.addEventListener('input', (e) => {
            _wizardState.price = parseInt(e.target.value, 10) || 0;
            _refreshPreview();
        });
    }
    const qtyInput = root.querySelector('[data-wiz-qty]');
    if (qtyInput) {
        qtyInput.addEventListener('input', (e) => {
            _wizardState.productionQty = parseInt(e.target.value, 10) || 0;
            _refreshPreview();
        });
    }
    // Navigation
    const nextBtn = root.querySelector('[data-wiz-next]');
    if (nextBtn) nextBtn.addEventListener('click', () => _next());
    const backBtn = root.querySelector('[data-wiz-back]');
    if (backBtn) backBtn.addEventListener('click', () => _back());
    const cancelBtn = root.querySelector('[data-wiz-cancel]');
    if (cancelBtn) cancelBtn.addEventListener('click', () => { _wizardState = null; Modal.close('design-wizard', true); });
    const confirmBtn = root.querySelector('[data-wiz-confirm]');
    if (confirmBtn) confirmBtn.addEventListener('click', () => _confirm());
}

function _next() {
    const s = _wizardState;
    if (s.step === 1) {
        if (!s.name.trim()) { ToastService.warning('Isi nama produk.'); return; }
        if (!s.formFactorId) { ToastService.warning('Pilih bentuk.'); return; }
    }
    if (s.step === 2) {
        if (!s.displayId || !s.cameraId || !s.batteryId || !s.chipId || !s.networkId) {
            ToastService.warning('Lengkapi semua komponen.');
            return;
        }
    }
    if (s.step === 3) {
        if (!s.osOptionId || !s.bodyId) {
            ToastService.warning('Pilih OS dan bodi.');
            return;
        }
    }
    s.step += 1;
    _render();
}

function _back() {
    if (_wizardState.step > 1) {
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
        cameraId: s.cameraId,
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
// STEPS
// ============================================================
function _step1(s) {
    const ffList = COMPONENTS.filter(c => c.category === 'form_factor');
    return `
        <label class="field-label">Nama Ponsel</label>
        <input class="field-input" data-wiz-name maxlength="24" placeholder="Contoh: X1, Nova, ..." />
        <label class="field-label" style="margin-top:12px;">Bentuk (Form Factor)</label>
        <div class="wiz-options">
            ${ffList.map(f => `
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

function _step2(s) {
    const cats = ['display', 'camera', 'battery', 'chip', 'network'];
    const groups = cats.map(catId => {
        const cat = COMPONENT_CATEGORIES.find(c => c.id === catId);
        const list = getUnlockedByCategory(catId, window.__game.research);
        const stateKey = catId === 'display' ? 'displayId'
                      : catId === 'camera' ? 'cameraId'
                      : catId === 'battery' ? 'batteryId'
                      : catId === 'chip' ? 'chipId'
                      : 'networkId';
        const selected = s[stateKey];
        return `
            <div class="wiz-cat">
                <div class="wiz-cat-title">${cat.icon} ${cat.name}</div>
                <div class="wiz-options-row">
                    ${list.length ? list.map(c => `
                        <button class="wiz-option ${selected === c.id ? 'selected' : ''}" data-wiz-pick="${stateKey}:${c.id}">
                            <div class="wiz-opt-name">${escapeHtml(c.name)}</div>
                            <div class="wiz-opt-meta">$${c.costPerUnit}/unit</div>
                        </button>
                    `).join('') : '<div class="wiz-empty">Belum ada komponen terbuka — riset dulu.</div>'}
                </div>
            </div>
        `;
    }).join('');
    return `
        <div style="max-height:45vh;overflow-y:auto;">${groups}</div>
        <div class="wiz-nav">
            <button class="btn-secondary" data-wiz-back style="flex:1;">← Kembali</button>
            <button class="btn-primary" data-wiz-next style="flex:2;">Lanjut →</button>
        </div>
    `;
}

function _step3(s) {
    const osOptions = window.__game.os.getOsOptionsForPhone();
    const bodies = getUnlockedByCategory('body', window.__game.research);

    return `
        <div style="max-height:45vh;overflow-y:auto;">
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
                    ${bodies.map(b => `
                        <button class="wiz-option ${s.bodyId === b.id ? 'selected' : ''}" data-wiz-pick="bodyId:${b.id}">
                            <div class="wiz-opt-name">${escapeHtml(b.name)}</div>
                            <div class="wiz-opt-meta">$${b.costPerUnit}/unit</div>
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="wiz-cat">
                <div class="wiz-cat-title">🎨 Warna</div>
                <div class="wiz-colors">
                    ${BODY_COLORS.map(c => `
                        <button class="wiz-color ${s.bodyColorId === c.id ? 'selected' : ''}" data-wiz-pick="bodyColorId:${c.id}"
                                style="background:${c.hex};" title="${escapeHtml(c.name)}"></button>
                    `).join('')}
                </div>
            </div>
        </div>
        <div class="wiz-nav">
            <button class="btn-secondary" data-wiz-back style="flex:1;">← Kembali</button>
            <button class="btn-primary" data-wiz-next style="flex:2;">Lanjut →</button>
        </div>
    `;
}

function _step4(s) {
    return `
        <label class="field-label">Harga Jual (USD)</label>
        <input class="field-input" data-wiz-price type="number" min="1" value="${s.price}" />
        <label class="field-label" style="margin-top:10px;">Jumlah Produksi Awal (unit)</label>
        <input class="field-input" data-wiz-qty type="number" min="100" step="100" value="${s.productionQty}" />
        <div style="margin-top:12px;">
            <div class="card-title">Preview</div>
            <div data-wiz-preview>
                ${_previewHtml(s)}
            </div>
        </div>
        <div class="wiz-nav">
            <button class="btn-secondary" data-wiz-back style="flex:1;">← Kembali</button>
            <button class="btn-primary" data-wiz-confirm style="flex:2;">Rilis Produk ✓</button>
        </div>
    `;
}

function _refreshPreview() {
    const root = document.querySelector('[data-modal-id="design-wizard"]');
    if (!root) return;
    const el = root.querySelector('[data-wiz-preview]');
    if (el) el.innerHTML = _previewHtml(_wizardState);
}

function _previewHtml(s) {
    const ps = window.__game.products;
    if (!ps) return '<div style="font-size:12px;color:var(--text-mute);">Sistem belum siap.</div>';
    try {
        const stats = ps.computeStats(s);
        const unitCost = ps.computeUnitCost(s);
        const totalCost = unitCost * (s.productionQty || 0) + 2000;
        const demand = ps.estimateDemand(s);
        const margin = s.price - unitCost;
        const marginPct = s.price > 0 ? Math.round((margin / s.price) * 100) : 0;

        // Peringatan ketidakseimbangan
        const warnings = [];
        if (stats.performance > 60 && stats.battery < 40) warnings.push('Chip kuat tapi baterai kecil.');
        if (stats.camera > 60 && stats.display < 40) warnings.push('Kamera bagus tapi layar kurang.');
        if (margin < 0) warnings.push('Harga di bawah biaya produksi!');

        return `
            <div class="preview-row"><span>Skor Kualitas</span><b>${stats.qualityScore}/100</b></div>
            <div class="preview-row"><span>Biaya per unit</span><b>$${unitCost}</b></div>
            <div class="preview-row"><span>Total biaya</span><b>$${totalCost.toLocaleString('en-US')}</b></div>
            <div class="preview-row"><span>Margin</span><b style="color:${margin >= 0 ? 'var(--accent)' : 'var(--danger)'};">$${margin} (${marginPct}%)</b></div>
            <div class="preview-row"><span>Estimasi permintaan/hari</span><b>~${demand.toLocaleString('en-US')} unit</b></div>
            ${warnings.length ? `<div style="margin-top:8px;font-size:11.5px;color:var(--warn);">⚠ ${warnings.join('<br>⚠ ')}</div>` : ''}
        `;
    } catch (e) {
        return '<div style="font-size:12px;color:var(--danger);">Preview error: ' + escapeHtml(e.message) + '</div>';
    }
                                                    }
