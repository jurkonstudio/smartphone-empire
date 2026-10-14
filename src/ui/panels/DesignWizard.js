// FILE: src/ui/panels/DesignWizard.js
// v2027.12a — Auto-fill "Isi Rekomendasi"
// v2027.13c — i18n.
import { Modal } from '../modal.js';
import { ToastService } from '../../core/ToastService.js';
import { state } from '../../core/GameState.js';
import { DesignEraService } from '../../core/DesignEraService.js';
import {
    COMPONENTS, COMPONENT_CATEGORIES, BODY_COLORS,
    getComponentById, getComponentsByCategory, getBodyColorById
} from '../../data/components.data.js';
import { renderPhoneMockup } from '../phone/PhoneMockup.js';
import { getDesignEraForYear } from '../../data/era-design.data.js';
import { resolveSpec } from '../../data/phone-specs.data.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { t } from '../../core/LanguageService.js';

let _wizardState = null;

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
        priceManuallyEdited: false,
        productionQty: 5000
    };
}

// ============================================================
// FILTER
// ============================================================
function filterComponentsByEra(catId) {
    const year = DesignEraService.getCurrentYear();
    const completed = state.get().research.completed || [];
    const all = getComponentsByCategory(catId);
    return all.filter(function (c) {
        if (typeof c.minYear === 'number' && year < c.minYear) return false;
        if (c.requiresResearch && completed.indexOf(c.requiresResearch) === -1) return false;
        return true;
    });
}

function filterFormFactorsByEra() {
    const year = DesignEraService.getCurrentYear();
    const era = getDesignEraForYear(year);
    const all = COMPONENTS.filter(function (c) { return c.category === 'form_factor'; });
    return all.filter(function (f) {
        if (typeof f.minYear === 'number' && year < f.minYear) return false;
        if (Array.isArray(era.formFactors) && era.formFactors.length) {
            return era.formFactors.indexOf(f.id) !== -1;
        }
        return true;
    });
}

function filterBodyColorsByEra() {
    const year = DesignEraService.getCurrentYear();
    const era = getDesignEraForYear(year);
    if (!Array.isArray(era.bodyColors) || !era.bodyColors.length) return BODY_COLORS;
    return BODY_COLORS.filter(function (c) { return era.bodyColors.indexOf(c.id) !== -1; });
}

function filterBodiesByEra() {
    const year = DesignEraService.getCurrentYear();
    const completed = state.get().research.completed || [];
    const all = getComponentsByCategory('body');
    return all.filter(function (b) {
        if (typeof b.minYear === 'number' && year < b.minYear) return false;
        if (b.requiresResearch && completed.indexOf(b.requiresResearch) === -1) return false;
        return true;
    });
}

function currentEraInfo() {
    const year = DesignEraService.getCurrentYear();
    return getDesignEraForYear(year);
}

// ============================================================
// AUTO-FILL
// ============================================================
function _pickMostExpensive(list) {
    if (!list || !list.length) return null;
    let best = list[0];
    for (let i = 1; i < list.length; i++) {
        const cost = list[i].costPerUnit || 0;
        const bestCost = best.costPerUnit || 0;
        if (cost > bestCost) best = list[i];
    }
    return best;
}

function _autoFillBest(s) {
    const ffs = filterFormFactorsByEra();
    const bestFf = _pickMostExpensive(ffs);
    if (bestFf) s.formFactorId = bestFf.id;

    const catMap = { display: 'displayId', camera: 'cameraId', battery: 'batteryId', chip: 'chipId', network: 'networkId' };
    for (const catId in catMap) {
        const list = filterComponentsByEra(catId);
        const best = _pickMostExpensive(list);
        if (best) s[catMap[catId]] = best.id;
    }
    if (!s.cameraId) s.cameraId = 'none';

    const osOptions = (window.__game && window.__game.os && window.__game.os.getOsOptionsForPhone)
        ? window.__game.os.getOsOptionsForPhone()
        : [];
    if (osOptions.length) {
        let bestOs = osOptions[0];
        for (let i = 1; i < osOptions.length; i++) {
            const cost = osOptions[i].costPerUnit || 0;
            const bestCost = bestOs.costPerUnit || 0;
            if (cost > bestCost) bestOs = osOptions[i];
        }
        s.osOptionId = bestOs.id;
    }

    const bodies = filterBodiesByEra();
    const bestBody = _pickMostExpensive(bodies);
    if (bestBody) s.bodyId = bestBody.id;

    const colors = filterBodyColorsByEra();
    if (colors.length) s.bodyColorId = colors[0].id;

    const ps = window.__game && window.__game.products;
    if (ps && ps.computeUnitCost) {
        let unitCost = 0;
        try { unitCost = ps.computeUnitCost(s); } catch (e) {}
        if (unitCost > 0) {
            const raw = unitCost * 2;
            const rounded = Math.ceil(raw / 50) * 50;
            s.price = Math.max(200, rounded);
        }
    }
    s.priceManuallyEdited = false;
}

function _validateComplete(s) {
    const missing = [];
    if (!s.formFactorId) missing.push('form');
    if (!s.displayId) missing.push('display');
    if (!s.batteryId) missing.push('battery');
    if (!s.chipId) missing.push('chip');
    if (!s.networkId) missing.push('network');
    if (!s.osOptionId) missing.push('OS');
    if (!s.bodyId) missing.push('body');
    if (!s.bodyColorId) missing.push('color');
    return missing;
}

function _handleAutoFill() {
    const s = _wizardState;
    if (!s) return;

    if (!s.name.trim()) {
        s.name = 'Model ' + DesignEraService.getCurrentYear();
    }

    _autoFillBest(s);

    const missing = _validateComplete(s);
    if (missing.length) {
        ToastService.warning(t('wiz.warn.autofill_missing', { list: missing.join(', ') }));
        _render();
        return;
    }

    s.step = 4;
    _render();
    ToastService.success(t('wiz.success.autofill'));
}

// ============================================================
// OPEN
// ============================================================
export function openDesignWizard(params) {
    if (state.get().products.development) {
        ToastService.warning(t('wiz.err.dev_active'));
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
    let stepBody = '';
    if (s.step === 1)      stepBody = _step1(s);
    else if (s.step === 2) stepBody = _step2(s);
    else if (s.step === 3) stepBody = _step3(s);
    else                   stepBody = _step4(s);

    const html = `
        <div class="wiz-era-banner" style="background:${era.aesthetic.bg};border-color:${era.aesthetic.accent}40;">
            <div class="wiz-era-year">${DesignEraService.getCurrentYear()}</div>
            <div class="wiz-era-info">
                <div class="wiz-era-label" style="color:${era.aesthetic.accent};">${escapeHtml(era.label)}</div>
                <div class="wiz-era-desc">${escapeHtml(era.description)}</div>
            </div>
        </div>

        <div class="wiz-mockup-live" data-wiz-mockup-container></div>
        <div class="wiz-spec-strip" data-wiz-spec-strip></div>
        <div class="wiz-mockup-actions">
            <button class="btn-secondary" data-wiz-detail style="font-size:12px;min-height:34px;padding:6px 12px;">${t('wiz.detail.btn_show')}</button>
        </div>

        <div class="wiz-step-indicator">
            ${[1,2,3,4].map(function (i) { return '<span class="wiz-dot ' + (i === s.step ? 'active' : '') + ' ' + (i < s.step ? 'done' : '') + '"></span>'; }).join('')}
        </div>
        <div class="modal-sub" style="margin-bottom:12px;">${t('wiz.step_of', { n: s.step, title: _stepTitle(s.step) })}</div>

        ${stepBody}
    `;

    if (Modal.isOpen && Modal.isOpen('design-wizard')) {
        const root = document.querySelector('[data-modal-id="design-wizard"]');
        if (root) {
            root.querySelector('.modal-card').innerHTML = html;
            _bindStep();
            requestAnimationFrame(_refreshPreview);
        }
    } else {
        Modal.open('design-wizard', html, { dismissible: false });
        _bindStep();
        requestAnimationFrame(_refreshPreview);
    }
}

function _stepTitle(step) {
    const map = { 1: 'wiz.step1.title', 2: 'wiz.step2.title', 3: 'wiz.step3.title', 4: 'wiz.step4.title' };
    return t(map[step] || '');
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
        nameInput.addEventListener('input', function (e) { _wizardState.name = e.target.value; });
    }

    const autofillBtn = root.querySelector('[data-wiz-autofill]');
    if (autofillBtn) autofillBtn.addEventListener('click', function () { _handleAutoFill(); });

    root.querySelectorAll('[data-wiz-pick]').forEach(function (btn) {
        btn.addEventListener('click', function () {
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
        priceInput.addEventListener('input', function (e) {
            _wizardState.price = parseInt(e.target.value, 10) || 0;
            _wizardState.priceManuallyEdited = true;
            _refreshPreview();
            _updateConfirmButtonState();
        });
    }
    const qtyInput = root.querySelector('[data-wiz-qty]');
    if (qtyInput) {
        qtyInput.value = _wizardState.productionQty;
        qtyInput.addEventListener('input', function (e) {
            _wizardState.productionQty = parseInt(e.target.value, 10) || 0;
            _refreshPreview();
        });
    }

    const nextBtn = root.querySelector('[data-wiz-next]');
    if (nextBtn) nextBtn.addEventListener('click', function () { _next(); });
    const backBtn = root.querySelector('[data-wiz-back]');
    if (backBtn) backBtn.addEventListener('click', function () { _back(); });
    const cancelBtn = root.querySelector('[data-wiz-cancel]');
    if (cancelBtn) cancelBtn.addEventListener('click', function () { _wizardState = null; Modal.close('design-wizard', true); });
    const confirmBtn = root.querySelector('[data-wiz-confirm]');
    if (confirmBtn) confirmBtn.addEventListener('click', function () { _confirm(); });

    const detailBtn = root.querySelector('[data-wiz-detail]');
    if (detailBtn) detailBtn.addEventListener('click', function () { _openDetailModal(); });

    if (_wizardState.step === 4) _updateConfirmButtonState();
}

function _updateConfirmButtonState() {
    const root = document.querySelector('[data-modal-id="design-wizard"]');
    if (!root) return;
    const btn = root.querySelector('[data-wiz-confirm]');
    if (!btn) return;
    const s = _wizardState;
    if (!s) return;

    const ps = window.__game && window.__game.products;
    if (!ps) return;

    let unitCost = 0;
    try { unitCost = ps.computeUnitCost ? ps.computeUnitCost(s) : 0; } catch (e) {}
    const margin = (s.price || 0) - unitCost;
    const canRelease = margin >= 0;

    if (canRelease) {
        btn.disabled = false;
        btn.style.opacity = '';
        btn.style.cursor = '';
        btn.textContent = t('wiz.step4.release');
    } else {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.textContent = t('wiz.step4.price_low');
    }
}

// ============================================================
// NAV
// ============================================================
function _next() {
    const s = _wizardState;
    if (s.step === 1) {
        if (!s.name.trim()) { ToastService.warning(t('wiz.err.need_name')); return; }
        if (!s.formFactorId) { ToastService.warning(t('wiz.err.need_ff')); return; }
    }
    if (s.step === 2) {
        if (!s.displayId || !s.batteryId || !s.chipId || !s.networkId) {
            ToastService.warning(t('wiz.err.need_comp'));
            return;
        }
    }
    if (s.step === 3) {
        if (!s.osOptionId || !s.bodyId || !s.bodyColorId) {
            ToastService.warning(t('wiz.err.need_os_body'));
            return;
        }
        if (!s.priceManuallyEdited) {
            const ps = window.__game && window.__game.products;
            let unitCost = 0;
            try { unitCost = ps && ps.computeUnitCost ? ps.computeUnitCost(s) : 0; } catch (e) {}
            if (unitCost > 0) {
                const raw = unitCost * 2;
                const rounded = Math.ceil(raw / 50) * 50;
                s.price = Math.max(200, rounded);
            }
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
    if (!game || !game.products) { ToastService.error(t('wiz.err.not_ready')); return; }

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
        ToastService.error(res.reason || t('wiz.err.confirm_fail'));
        return;
    }
    ToastService.success(t('wiz.success.dev_start'));
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
            <div class="empty-hint" style="margin:20px 0;">${t('wiz.step1.no_ff')}</div>
            <div class="wiz-nav">
                <button class="btn-secondary" data-wiz-cancel style="flex:1;">${t('wiz.step1.cancel')}</button>
            </div>
        `;
    }

    return `
        <label class="field-label">${t('wiz.step1.name_label')}</label>
        <input class="field-input" data-wiz-name maxlength="24" placeholder="${t('wiz.step1.name_ph')}" autocomplete="off" />

        <button class="wiz-autofill-btn" data-wiz-autofill>
            <span class="wiz-autofill-ico">✨</span>
            <span>${t('wiz.step1.autofill_btn')}</span>
        </button>
        <div class="wiz-autofill-hint">${t('wiz.step1.autofill_hint')}</div>

        <label class="field-label" style="margin-top:16px;">${t('wiz.step1.ff_label')}</label>
        <div class="wiz-options">
            ${ffs.map(function (f) {
                return '<button class="wiz-option ' + (s.formFactorId === f.id ? 'selected' : '') + '" data-wiz-pick="formFactorId:' + f.id + '">' +
                    '<div class="wiz-opt-name">' + escapeHtml(f.name) + '</div>' +
                    '<div class="wiz-opt-meta">' + t('wiz.step1.ff_tier', { tier: f.tier, year: f.minYear }) + '</div>' +
                    '</button>';
            }).join('')}
        </div>

        <div class="wiz-nav">
            <button class="btn-secondary" data-wiz-cancel style="flex:1;">${t('wiz.step1.cancel')}</button>
            <button class="btn-primary" data-wiz-next style="flex:2;">${t('wiz.step1.next')}</button>
        </div>
    `;
}

// ============================================================
// STEP 2
// ============================================================
function _step2(s) {
    const cats = ['display', 'camera', 'battery', 'chip', 'network'];
    const stateKeys = { display: 'displayId', camera: 'cameraId', battery: 'batteryId', chip: 'chipId', network: 'networkId' };

    const groups = cats.map(function (catId) {
        const cat = COMPONENT_CATEGORIES.find(function (c) { return c.id === catId; });
        const list = filterComponentsByEra(catId);
        const stateKey = stateKeys[catId];
        const selected = s[stateKey];
        const isOptional = OPTIONAL_CATEGORIES.indexOf(catId) !== -1;

        let options = list.map(function (c) {
            return '<button class="wiz-option ' + (selected === c.id ? 'selected' : '') + '" data-wiz-pick="' + stateKey + ':' + c.id + '">' +
                '<div class="wiz-opt-name">' + escapeHtml(c.name) + '</div>' +
                '<div class="wiz-opt-meta">$' + c.costPerUnit + '/unit</div>' +
                '</button>';
        }).join('');

        if (isOptional) {
            const noneLabel = catId === 'camera' ? t('wiz.step2.no_camera') : t('wiz.step2.no_item', { name: cat.name });
            const noneMeta = catId === 'camera' ? t('wiz.step2.no_camera_hint') : t('wiz.step2.optional');
            const isNoneSelected = (!selected || selected === 'none');
            options = '<button class="wiz-option ' + (isNoneSelected ? 'selected' : '') + '" data-wiz-pick="' + stateKey + ':none">' +
                '<div class="wiz-opt-name">' + noneLabel + '</div>' +
                '<div class="wiz-opt-meta">' + noneMeta + '</div>' +
                '</button>' + options;
        }

        const totalCount = list.length + (isOptional ? 1 : 0);
        if (totalCount === 0) {
            options = '<div class="wiz-empty">' + t('wiz.step2.empty') + '</div>';
        }

        const iconHtml = cat ? renderIcon(cat.icon, 14, 'style="vertical-align:middle;margin-right:5px;"') : '';
        const countLabel = isOptional
            ? t('wiz.step2.cat_count_opt', { n: list.length })
            : t('wiz.step2.cat_count', { n: list.length });

        return '<div class="wiz-cat">' +
            '<div class="wiz-cat-title" style="text-transform:none;">' + iconHtml + escapeHtml(cat.name) + ' <span style="color:var(--text-mute);font-weight:500;">' + countLabel + '</span></div>' +
            '<div class="wiz-options-row">' + options + '</div>' +
            '</div>';
    }).join('');

    return `
        <div style="max-height:45vh;overflow-y:auto;padding-right:4px;">${groups}</div>
        <div class="wiz-nav">
            <button class="btn-secondary" data-wiz-back style="flex:1;">${t('wiz.step2.back')}</button>
            <button class="btn-primary" data-wiz-next style="flex:2;">${t('wiz.step2.next')}</button>
        </div>
    `;
}

// ============================================================
// STEP 3
// ============================================================
function _step3(s) {
    const osOptions = (window.__game && window.__game.os && window.__game.os.getOsOptionsForPhone)
        ? window.__game.os.getOsOptionsForPhone()
        : [];
    const bodies = filterBodiesByEra();
    const colors = filterBodyColorsByEra();

    if (colors.length && !colors.some(function (c) { return c.id === s.bodyColorId; })) {
        s.bodyColorId = colors[0].id;
    }

    return `
        <div style="max-height:45vh;overflow-y:auto;padding-right:4px;">
            <div class="wiz-cat">
                <div class="wiz-cat-title" style="text-transform:none;">${renderIcon('disc', 14, 'style="vertical-align:middle;margin-right:5px;"')}${t('wiz.step3.os_label')}</div>
                <div class="wiz-options-row">
                    ${osOptions.length ? osOptions.map(function (o) {
                        var meta = o.source === 'license' ? '$' + o.costPerUnit + '/unit' : t('wiz.step3.os_free');
                        return '<button class="wiz-option ' + (s.osOptionId === o.id ? 'selected' : '') + '" data-wiz-pick="osOptionId:' + o.id + '">' +
                            '<div class="wiz-opt-name">' + escapeHtml(o.label) + '</div>' +
                            '<div class="wiz-opt-meta">' + meta + '</div>' +
                            '</button>';
                    }).join('') : '<div class="wiz-empty">' + t('wiz.step3.os_empty') + '</div>'}
                </div>
            </div>

            <div class="wiz-cat">
                <div class="wiz-cat-title" style="text-transform:none;">${renderIcon('layers', 14, 'style="vertical-align:middle;margin-right:5px;"')}${t('wiz.step3.body_label')}</div>
                <div class="wiz-options-row">
                    ${bodies.length ? bodies.map(function (b) {
                        return '<button class="wiz-option ' + (s.bodyId === b.id ? 'selected' : '') + '" data-wiz-pick="bodyId:' + b.id + '">' +
                            '<div class="wiz-opt-name">' + escapeHtml(b.name) + '</div>' +
                            '<div class="wiz-opt-meta">$' + b.costPerUnit + '/unit</div>' +
                            '</button>';
                    }).join('') : '<div class="wiz-empty">' + t('wiz.step3.body_empty') + '</div>'}
                </div>
            </div>

            <div class="wiz-cat">
                <div class="wiz-cat-title" style="text-transform:none;">${renderIcon('palette', 14, 'style="vertical-align:middle;margin-right:5px;"')}${t('wiz.step3.color_label')}</div>
                ${colors.length ? '<div class="wiz-colors">' + colors.map(function (c) {
                    return '<button class="wiz-color ' + (s.bodyColorId === c.id ? 'selected' : '') + '"' +
                        ' data-wiz-pick="bodyColorId:' + c.id + '"' +
                        ' style="background:' + c.hex + ';"' +
                        ' title="' + escapeHtml(c.name) + '"' +
                        ' aria-label="' + escapeHtml(c.name) + '"></button>';
                }).join('') + '</div>' : '<div class="wiz-empty">' + t('wiz.step3.color_empty') + '</div>'}
            </div>
        </div>
        <div class="wiz-nav">
            <button class="btn-secondary" data-wiz-back style="flex:1;">${t('wiz.step3.back')}</button>
            <button class="btn-primary" data-wiz-next style="flex:2;">${t('wiz.step3.next')}</button>
        </div>
    `;
}

// ============================================================
// STEP 4
// ============================================================
function _step4(s) {
    const ps = window.__game && window.__game.products;
    let unitCost = 0;
    try { unitCost = ps && ps.computeUnitCost ? ps.computeUnitCost(s) : 0; } catch (e) {}
    const margin = (s.price || 0) - unitCost;
    const canRelease = margin >= 0;

    return `
        <div class="wiz-price-layout">
            <div>
                <label class="field-label">${t('wiz.step4.price_label')}</label>
                <input class="field-input" data-wiz-price type="number" min="1" value="${s.price}" />
            </div>
            <div>
                <label class="field-label">${t('wiz.step4.qty_label')}</label>
                <input class="field-input" data-wiz-qty type="number" min="100" step="100" value="${s.productionQty}" />
            </div>
        </div>

        <div style="margin-top:14px;">
            <div class="card-title">${t('wiz.step4.summary')}</div>
            <div data-wiz-preview>${_previewHtml(s)}</div>
        </div>

        <div class="wiz-nav">
            <button class="btn-secondary" data-wiz-back style="flex:1;">${t('wiz.step4.back')}</button>
            <button class="btn-primary" data-wiz-confirm style="flex:2;" ${canRelease ? '' : 'disabled'}>
                ${canRelease ? t('wiz.step4.release') : t('wiz.step4.price_low')}
            </button>
        </div>
    `;
}

// ============================================================
// LIVE PREVIEW
// ============================================================
function _getAdaptiveSize() {
    if (typeof window === 'undefined') return 220;
    return window.innerWidth < 380 ? 200 : 220;
}

function _refreshPreview() {
    const root = document.querySelector('[data-modal-id="design-wizard"]');
    if (!root) return;

    const mockupContainer = root.querySelector('[data-wiz-mockup-container]');
    if (mockupContainer) {
        try {
            const size = _getAdaptiveSize();
            mockupContainer.innerHTML = renderPhoneMockup(_wizardState, { size: size });
        } catch (e) {
            console.error('[DesignWizard] Mockup error:', e);
            mockupContainer.innerHTML = '';
        }
    }

    const specStrip = root.querySelector('[data-wiz-spec-strip]');
    if (specStrip) {
        try { specStrip.innerHTML = _specStripHtml(_wizardState); }
        catch (e) { console.error('[DesignWizard] Spec strip error:', e); specStrip.innerHTML = ''; }
    }

    const previewEl = root.querySelector('[data-wiz-preview]');
    if (previewEl) previewEl.innerHTML = _previewHtml(_wizardState);
}

function _computeStats(s) {
    const ps = window.__game && window.__game.products;
    if (ps && ps.computeStats) {
        try { return ps.computeStats(s); } catch (e) {}
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
    ['display','camera','battery','performance','connectivity','quality','design','usability'].forEach(function (k) {
        stat[k] = Math.max(0, Math.min(100, Math.round(stat[k])));
    });
    return stat;
}

// ============================================================
// SPEC STRIP
// ============================================================
function _specStripHtml(s) {
    const ps = window.__game && window.__game.products;
    if (!ps) return '';

    const name = (s.name || '').trim();
    const displayName = name ? escapeHtml(name) : '<span style="opacity:0.5;">' + t('wiz.spec.no_name') + '</span>';
    const price = s.price || 0;

    let unitCost = 0;
    let qualityScore = 0;
    try {
        unitCost = ps.computeUnitCost ? ps.computeUnitCost(s) : 0;
        const stats = _computeStats(s);
        qualityScore = stats.qualityScore || 0;
    } catch (e) {}

    const margin = price - unitCost;
    const marginPct = price > 0 ? Math.round((margin / price) * 100) : 0;
    const marginColor = margin >= 0 ? 'var(--success)' : 'var(--danger)';

    const displayComp = s.displayId ? getComponentById(s.displayId) : null;
    const chipComp = s.chipId ? getComponentById(s.chipId) : null;
    const displayLabel = displayComp ? displayComp.name : '—';
    const chipLabel = chipComp ? chipComp.name : '—';

    return `
        <div class="wiz-spec-head">
            <span class="wiz-spec-name">${displayName}</span>
            <span class="wiz-spec-price">$${price}</span>
        </div>
        <div class="wiz-spec-meta">
            <div class="wiz-spec-item">
                <span class="wiz-spec-label">${t('wiz.spec.quality')}</span>
                <span class="wiz-spec-value">${qualityScore}/100</span>
            </div>
            <div class="wiz-spec-item">
                <span class="wiz-spec-label">${t('wiz.spec.margin')}</span>
                <span class="wiz-spec-value" style="color:${marginColor};">$${margin} (${marginPct}%)</span>
            </div>
            <div class="wiz-spec-item">
                <span class="wiz-spec-label">${t('wiz.spec.screen')}</span>
                <span class="wiz-spec-value wiz-spec-trunc" title="${escapeHtml(displayLabel)}">${escapeHtml(displayLabel)}</span>
            </div>
            <div class="wiz-spec-item">
                <span class="wiz-spec-label">${t('wiz.spec.chip')}</span>
                <span class="wiz-spec-value wiz-spec-trunc" title="${escapeHtml(chipLabel)}">${escapeHtml(chipLabel)}</span>
            </div>
        </div>
    `;
}

function _previewHtml(s) {
    const ps = window.__game && window.__game.products;
    if (!ps) return '<div style="font-size:12px;color:var(--text-mute);">' + t('wiz.err.not_ready') + '</div>';
    try {
        const stats = _computeStats(s);
        const unitCost = ps.computeUnitCost ? ps.computeUnitCost(s) : 0;
        const totalCost = unitCost * (s.productionQty || 0) + 2000;
        const demand = ps.estimateDemand ? ps.estimateDemand(s) : 0;
        const margin = (s.price || 0) - unitCost;
        const marginPct = s.price > 0 ? Math.round((margin / s.price) * 100) : 0;
        const noCamera = !s.cameraId || s.cameraId === 'none';

        const warnings = [];
        if (stats.performance > 60 && stats.battery < 40) warnings.push(t('wiz.preview.warn_chip_bat'));
        if (stats.camera > 60 && stats.display < 40) warnings.push(t('wiz.preview.warn_cam_disp'));
        if (margin < 0) warnings.push(t('wiz.preview.warn_margin'));

        return `
            <div class="preview-row"><span>${t('wiz.preview.quality')}</span><b>${stats.qualityScore || 0}/100</b></div>
            <div class="preview-row"><span>${t('wiz.preview.unit_cost')}</span><b>$${unitCost}</b></div>
            <div class="preview-row"><span>${t('wiz.preview.total_cost')}</span><b>$${totalCost.toLocaleString('en-US')}</b></div>
            <div class="preview-row"><span>${t('wiz.preview.margin')}</span><b style="color:${margin >= 0 ? 'var(--success)' : 'var(--danger)'};">$${margin} (${marginPct}%)</b></div>
            <div class="preview-row"><span>${t('wiz.preview.demand')}</span><b>${t('wiz.preview.demand_unit', { n: demand.toLocaleString('en-US') })}</b></div>
            ${noCamera ? '<div style="margin-top:8px;font-size:11px;color:var(--text-mute);">' + t('wiz.preview.no_camera') + '</div>' : ''}
            ${warnings.length ? '<div style="margin-top:8px;font-size:11px;color:var(--warn);line-height:1.5;">⚠ ' + warnings.join('<br>⚠ ') + '</div>' : ''}
        `;
    } catch (e) {
        return '<div style="font-size:12px;color:var(--danger);">Preview error: ' + escapeHtml(e.message) + '</div>';
    }
}

// ============================================================
// DETAIL MODAL
// ============================================================
function _openDetailModal() {
    const s = _wizardState;
    if (!s) return;

    const year = DesignEraService.getCurrentYear();
    const completed = state.get().research.completed || [];
    const era = getDesignEraForYear(year);
    const spec = resolveSpec(year, completed);

    let mockupHtml = '';
    try { mockupHtml = renderPhoneMockup(s, { size: 240 }); }
    catch (e) { mockupHtml = '<div style="color:var(--danger);font-size:12px;">Mockup error</div>'; }

    const compInfo = [
        { labelKey: 'wiz.detail.spec_ff', id: s.formFactorId },
        { labelKey: 'wiz.detail.spec_screen', id: s.displayId },
        { labelKey: 'wiz.detail.spec_camera', id: (s.cameraId && s.cameraId !== 'none') ? s.cameraId : null },
        { labelKey: 'wiz.detail.spec_battery', id: s.batteryId },
        { labelKey: 'wiz.detail.spec_chip', id: s.chipId },
        { labelKey: 'wiz.detail.spec_network', id: s.networkId },
        { labelKey: 'wiz.detail.spec_body', id: s.bodyId }
    ];

    const compRows = compInfo.map(function (row) {
        var comp = row.id ? getComponentById(row.id) : null;
        var label = comp ? comp.name : (row.id ? row.id : '—');
        return '<div class="sum-row"><span>' + t(row.labelKey) + '</span><b>' + escapeHtml(label) + '</b></div>';
    }).join('');

    var colorComp = s.bodyColorId ? getBodyColorById(s.bodyColorId) : null;
    var colorRow = colorComp
        ? '<div class="sum-row"><span>' + t('wiz.detail.spec_color') + '</span><b><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:' + colorComp.hex + ';vertical-align:middle;margin-right:6px;border:1px solid var(--border);"></span>' + escapeHtml(colorComp.name) + '</b></div>'
        : '';

    const html = `
        <div class="modal-title">${t('wiz.detail.title')}</div>
        <div class="modal-sub">${t('wiz.detail.sub', { name: escapeHtml(s.name || t('wiz.spec.no_name')), year: year })}</div>

        <div class="wiz-detail-mockup">
            ${mockupHtml}
        </div>

        <div class="sum-row"><span>${t('wiz.detail.era')}</span><b>${escapeHtml(era.label)}</b></div>
        <div class="sum-row"><span>${t('wiz.detail.milestone')}</span><b>${escapeHtml(spec.label || spec.id)}</b></div>
        <div class="card-title" style="margin-top:14px;">${t('wiz.detail.section_comp')}</div>
        ${compRows}
        ${colorRow}

        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:14px;">${t('wiz.detail.close')}</button>
    `;

    Modal.open('design-wizard-detail', html);
                }
