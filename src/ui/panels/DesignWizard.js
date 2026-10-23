import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/panels/DesignWizard.js  (REPLACE — Final & Synced)
import { Modal } from '../modal.js';
import { bus } from '../../core/EventBus.js';
import { ToastService } from '../../core/ToastService.js';
import { state } from '../../core/GameState.js';
import { DesignEraService } from '../../core/DesignEraService.js';
import {
    COMPONENTS, COMPONENT_CATEGORIES, BODY_COLORS,
    getComponentById, getComponentsByCategory, getBodyColorById
} from '../../data/components.data.js';
import { renderPhoneMockup, renderPackagingCaption } from '../phone/PhoneMockup.js';
import { getDesignEraForYear, isFormFactorSelectable } from '../../data/era-design.data.js';
import { resolveSpec } from '../../data/phone-specs.data.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { t, LanguageService } from '../../core/LanguageService.js';
import { WalletService } from '../../systems/WalletService.js';
import { resolveComponentCost, getBuiltPlantEffect } from '../../data/material-plants.data.js';
import { BALANCE } from '../../data/balance.data.js';

let _wizardState = null;
let _wizardView = 'front';

const OPTIONAL_CATEGORIES = ['camera', 'ram'];
let _phoneShown = false;

function _isEn() {
    try { return LanguageService.getLang() === 'en'; } catch (e) { return false; }
}

function _tf(key, fallback, vars) {
    const v = t(key, vars);
    if (v && v !== key) return v;
    return String(fallback).replace(/\{(\w+)\}/g, function (m, k) {
        return (vars && vars[k] !== undefined) ? vars[k] : m;
    });
}
function _pick(id, en) { return _isEn() ? en : id; }

function _catName(cat) { return cat ? _tf('wiz.cat.' + cat.id, cat.name) : ''; }
function _eraLabel(era) { return _tf('wiz.era.' + era.id + '.label', era.label); }
function _eraDesc(era) { return _tf('wiz.era.' + era.id + '.desc', era.description); }
function _colorName(c) { return _tf('wiz.color.' + c.id, c.name); }
function _perUnit(n) { return _tf('wiz.cost_per_unit', '${n}/unit', { n: n }); }

const STAT_LABELS = {
    id: { display: 'Layar', camera: 'Kamera', battery: 'Baterai', performance: 'Performa', connectivity: 'Jaringan', quality: 'Mutu', design: 'Desain', usability: 'Kegunaan' },
    en: { display: 'Display', camera: 'Camera', battery: 'Battery', performance: 'Performance', connectivity: 'Network', quality: 'Quality', design: 'Design', usability: 'Usability' }
};

function _statLabel(k, L) {
    if (k === 'quality') return _tf('wiz.stat.quality', L.quality);
    return _tf('rs.stat.' + k, L[k] || k);
}

function _statTag(c) {
    if (!c || !c.stats) return '';
    const L = STAT_LABELS[_isEn() ? 'en' : 'id'];
    let key = null, val = 0;
    for (const k in c.stats) {
        if (k === 'quality') continue;
        if (c.stats[k] > val) { key = k; val = c.stats[k]; }
    }
    if (!key && c.stats.quality) { key = 'quality'; val = c.stats.quality; }
    return key ? _statLabel(key, L) + ' +' + val : '';
}

const NAME_MAX = 24;

const NAME_SERIES = {
    era_lcd_mono:          ['Classic', 'Basic', 'Mini', 'Slim', 'Compact', 'Plus', 'Lite', 'Solid', 'Talk', 'Chat', 'Easy', 'Pocket'],
    era_tft_color:         ['Color', 'Vision', 'Clip', 'Snap', 'Style', 'Fun', 'Mobi', 'Media', 'Wave', 'Spark', 'Joy', 'Pixel'],
    era_touch_revolution:  ['Touch', 'Smart', 'Wave', 'Spark', 'Pulse', 'Glide', 'Tap', 'Swift', 'Aero', 'Orbit', 'Xpress', 'Gloss'],
    era_smartphone_modern: ['Edge', 'Prime', 'Note', 'Studio', 'Air', 'Lite', 'Core', 'Flow', 'Zen', 'Metro', 'Neo', 'Vibe'],
    era_premium:           ['Prime', 'Ultra', 'Elite', 'Pro', 'Aura', 'Edge', 'Lumen', 'Titan', 'Zenith', 'Vertex', 'Apex', 'Lux'],
    era_ai_era:            ['AI', 'Nova', 'Vision', 'Neo', 'Quantum', 'Pulse', 'Aero', 'Nexus', 'Orion', 'Fusion', 'Vega', 'Lynx'],
    era_foldable:          ['Fold', 'Ultra', 'Infinity', 'Nova', 'Vision', 'Aether', 'Helix', 'Prism', 'Eon', 'Zenith', 'Atlas', 'Horizon']
};

const NAME_FF_WORDS = {
    ff_candybar:     ['Bar', 'Solid', 'Classic', 'Basic'],
    ff_flip:         ['Flip', 'Clam', 'Snap', 'Shell'],
    ff_slider:       ['Slide', 'Glide', 'Slider', 'Swish'],
    ff_communicator: ['Comm', 'Office', 'Exec', 'Organizer'],
    ff_pda:          ['PDA', 'Pocket', 'Pen', 'Stylus'],
    ff_qwerty:       ['Key', 'Type', 'Mail', 'Biz'],
    ff_swivel:       ['Twist', 'Spin', 'Swivel', 'Turn'],
    ff_fullscreen:   ['Touch', 'Glass', 'View', 'One'],
    ff_touch_slider: ['Slide Pro', 'Pull', 'Keys', 'Touch Key'],
    ff_bezel:        ['Vista', 'Slim', 'Air', 'View'],
    ff_edge:         ['Edge', 'Curve', 'Wave', 'Arc'],
    ff_popup:        ['Pop', 'Rise', 'Lift', 'Vision'],
    ff_dual:         ['Duo', 'Dual', 'Twin', 'Pair'],
    ff_fold:         ['Fold', 'Flex', 'Book', 'Z'],
    ff_flip_fold:    ['Flip', 'Petal', 'Pocket', 'Clam'],
    ff_tri_fold:     ['Tri', 'Triple', 'Trio', 'Origami']
};

const NAME_CODENAMES = ['Garuda', 'Rinjani', 'Komodo', 'Merapi', 'Bromo', 'Krakatau', 'Kancil', 'Anggrek', 'Maleo',
    'Atlas', 'Orion', 'Aurora', 'Phoenix', 'Zephyr', 'Lyra', 'Titan', 'Aster', 'Echo', 'Polar', 'Vega'];

function _rnd(n) { return Math.floor(Math.random() * n); }
function _choice(arr) { return arr[_rnd(arr.length)]; }

function _modelCode(year) {
    if (year < 2007) return String(1 + _rnd(9)) + String(1 + _rnd(9)) + _choice(['0', '1', '2', '5', '6']) + '0';
    if (year < 2015) return _choice(['S', 'X', 'N', 'i', 'G', 'T']) + (1 + _rnd(9)) + (_rnd(3) === 0 ? String(_rnd(10)) + '0' : '');
    return _choice(['', '', 'S', 'A', 'M', 'X']) + String(_choice([3, 5, 6, 7, 8, 9, 10, 11, 12, 20, 30, 40, 50]));
}

function _smallNum(year) {
    if (year < 2007) return String(_choice([2, 3, 5, 6, 7, 8]));
    return String(_choice([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 20, 30]));
}

function _cleanBrand(companyName) {
    let brand = String(companyName || 'My').replace(/\b(inc|ltd|corp|co|tech|group|labs|gooday)\b/gi, '').replace(/\s+/g, ' ').trim();
    if (!brand) brand = 'Smart';
    return brand.split(' ').slice(0, 2).join(' ');
}

function _fitName(brand, rest) {
    let name = [brand].concat(rest).join(' ');
    if (name.length <= NAME_MAX) return name;
    const b1 = brand.split(' ')[0];
    name = [b1].concat(rest).join(' ');
    if (name.length <= NAME_MAX) return name;
    for (let n = rest.length - 1; n >= 0; n--) {
        name = [b1].concat(rest.slice(0, n)).join(' ');
        if (name.length <= NAME_MAX) return name;
    }
    return b1.slice(0, NAME_MAX).trim();
}

function _successorTokens(brand, catalog) {
    const low = brand.toLowerCase();
    for (let i = catalog.length - 1; i >= 0; i--) {
        const nm = String((catalog[i] && catalog[i].name) || '').trim();
        if (nm.toLowerCase().indexOf(low) !== 0) continue;
        const rest = nm.slice(brand.length).trim();
        if (!rest) continue;
        const m = rest.match(/^(.*?)(?:\s+(\d{1,2}))$/);
        if (m && m[1] && Number(m[2]) <= 30) return [m[1], String(Number(m[2]) + 1)];
        if (!/\d{3,}$/.test(rest)) return [rest, '2'];
        return null;
    }
    return null;
}

function _nameTokens(brand, year, ffId, catalog) {
    const era = getDesignEraForYear(year);
    const series = _choice(NAME_SERIES[era.id] || NAME_SERIES.era_ai_era);
    const ffWord = _choice(NAME_FF_WORDS[ffId] || ['Phone']);
    const code = _modelCode(year);

    if (_rnd(100) < 30) {
        const next = _successorTokens(brand, catalog);
        if (next) return next;
    }
    const r = _rnd(100);
    if (r < 22) return [ffWord];
    if (r < 36) return [ffWord, _smallNum(year)];
    if (r < 52) return [series];
    if (r < 62) return [series, _smallNum(year)];
    if (r < 74) return [code];
    if (r < 82) return [_choice(NAME_CODENAMES)];
    if (r < 88) return [_choice(NAME_CODENAMES), _smallNum(year)];
    if (r < 94) return [series, String(year)];
    return [ffWord, series];
}

function _generateBrandedName(companyName, year, ffId, avoid) {
    const brand = _cleanBrand(companyName);
    const catalog = (state.get().products && state.get().products.catalog) || [];
    const skip = (avoid || []).map(function (n) { return String(n || '').trim().toLowerCase(); });
    for (let i = 0; i < 40; i++) {
        const name = _fitName(brand, _nameTokens(brand, year, ffId, catalog));
        const key = name.trim().toLowerCase();
        if (!_isNameDuplicate(name) && skip.indexOf(key) === -1) return name;
    }
    for (let j = 0; j < 20; j++) {
        const name = _fitName(brand, [_modelCode(year), String(10 + _rnd(90))]);
        if (!_isNameDuplicate(name)) return name;
    }
    return _fitName(brand, ['X' + Date.now().toString().slice(-4)]);
}

function _affordInfo(s) {
    const ps = window.__game && window.__game.products;
    // Sama dengan ProductSystem.confirmDesign: baterai & layar tidak ditagih saat desain.
    let designUnitCost = 0;
    try { designUnitCost = ps && ps.computeUnitCost ? ps.computeUnitCost(s, true) : 0; } catch (e) {}
    let cost = designUnitCost * (s.productionQty || 0) + BALANCE.products.productionSetupCost;
    try { if (ps && ps.quoteDesign) cost = ps.quoteDesign(s).total; } catch (e) {}
    let cash = 0;
    try { cash = state.get().cash || 0; } catch (e) {}
    let power = cash;
    try { power = WalletService.getBuyingPower(); } catch (e) {}
    return { cost: cost, cash: Math.floor(power), ok: WalletService.canAfford(cost) };
}

function _fmtUsd(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

function _shortText(str, max) {
    str = String(str || '');
    return str.length > max ? str.slice(0, max - 1).trimEnd() + '…' : str;
}

// SINKRONISASI DENGAN ProductSystem.js confirmDesign
function _getPriceLimits(s) {
    const ps = window.__game && window.__game.products;
    let unitCost = 50; 
    try { unitCost = ps.computeUnitCost(s); } catch(e) {}
    const minPrice = unitCost + 1;
    const maxPrice = Math.ceil(Math.max(unitCost * 2.2 * 1.5, unitCost * 4));
    return { min: minPrice, max: maxPrice };
}

function _getSuggestedPrices(s) {
    const ps = window.__game && window.__game.products;
    let unitCost = 50; 
    try { unitCost = ps.computeUnitCost(s); } catch(e) {}
    const round5 = (n) => Math.ceil(n / 5) * 5;
    return {
        budget:   Math.max(10, round5(unitCost * 1.15)),
        balanced: Math.max(15, round5(unitCost * 1.50)),
        premium:  Math.max(20, round5(unitCost * 2.20))
    };
}

const WZ_CSS = `
[data-modal-id="design-wizard"] .modal-card { padding-top: 0; padding-bottom: 0; scroll-behavior: auto; }
.wz-stage { position: sticky; top: 0; z-index: 6; margin: 0 -18px 12px; padding: 12px 18px 12px; background: var(--bg-2); border-bottom: 1px solid var(--border); box-shadow: 0 10px 18px -14px rgba(0,0,0,0.7); }
.wz-steps { display: flex; gap: 6px; margin: 0 0 12px; padding: 0; list-style: none; }
.wz-steps li { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 999px; background: var(--bg-3); color: var(--text-tertiary); font-size: 11px; font-weight: 600; white-space: nowrap; }
.wz-steps li b { flex: 0 0 auto; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; background: var(--bg-2); color: inherit; font-variant-numeric: tabular-nums; }
.wz-steps li span { overflow: hidden; text-overflow: ellipsis; }
.wz-steps li.done { color: var(--text-primary); }
.wz-steps li.done b { background: var(--accent); color: #fff; }
.wz-steps li.active { background: var(--accent); color: #fff; flex: 2.2; }
.wz-steps li.active b { background: rgba(255,255,255,0.22); }
@media (max-width: 440px) { .wz-steps li:not(.active) span { display: none; } .wz-steps li:not(.active) { justify-content: center; padding: 5px 0; } }
.wz-stage-body { display: flex; align-items: center; gap: 14px; }
.wz-phone { flex: 0 0 96px; min-height: 138px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; border-radius: var(--r-lg); background: radial-gradient(ellipse at 50% 88%, var(--bg-3) 0%, transparent 70%); }
.wz-live { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 7px; }
.wz-era { font-size: 11px; color: var(--text-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wz-era b { color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.wz-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.wz-name { font-size: 15px; font-weight: 700; letter-spacing: -0.01em; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wz-price { font-size: 15px; font-weight: 800; color: var(--accent); font-variant-numeric: tabular-nums; flex: 0 0 auto; }
.wz-meter-row { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-secondary); }
.wz-meter { flex: 1; height: 6px; border-radius: 99px; background: var(--bg-3); overflow: hidden; }
.wz-meter i { display: block; height: 100%; border-radius: 99px; transition: width 0.3s ease, background 0.3s; }
.wz-meter-row b { font-variant-numeric: tabular-nums; color: var(--text-primary); min-width: 46px; text-align: right; }
.wz-kv { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; color: var(--text-tertiary); }
.wz-kv b { color: var(--text-primary); font-weight: 600; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wz-warn { font-size: 11px; line-height: 1.35; color: var(--warn); }
.wz-tools { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.wz-tools .wiz-view-toggle button { font-size: 11px; padding: 4px 8px; min-height: 28px; }
.wz-live [data-wiz-pack-cap] .phone-pack-cap { text-align: left !important; margin-top: 0 !important; }
.wz-tools .btn-secondary { font-size: 11px; min-height: 28px; padding: 4px 10px; margin-left: auto; }
[data-modal-id="design-wizard"] .wiz-nav { position: sticky; bottom: 0; z-index: 5; margin: 14px -18px 0; padding: 10px 18px calc(10px + env(safe-area-inset-bottom)); background: var(--bg-2); border-top: 1px solid var(--border); }
.wz-step-title { font-size: 12px; color: var(--text-tertiary); margin: 0 0 10px; }
.wz-era-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.45; margin: 0 0 12px; }
.wz-scroll { padding-bottom: 4px; }
.wz-cap { font-size: 11px; line-height: 1.45; color: var(--text-tertiary); margin-top: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.wz-cap em { font-style: normal; color: var(--text-secondary); }
[data-modal-id="design-wizard"] .wiz-option { position: relative; }
[data-modal-id="design-wizard"] .wiz-option.selected::after { content: "✓"; position: absolute; top: 6px; right: 8px; font-size: 11px; font-weight: 800; color: var(--accent); }
[data-modal-id="design-wizard"] .wiz-option:focus-visible, [data-modal-id="design-wizard"] .wiz-color:focus-visible, [data-modal-id="design-wizard"] .wiz-view-toggle button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.wiz-opt-tag { color: var(--accent); font-weight: 600; }
[data-modal-id="design-wizard"] .wiz-option.selected .wiz-opt-name { padding-right: 16px; }
@media (prefers-reduced-motion: reduce) { .wz-meter i { transition: none; } }
.wz-suggest-btn { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:6px; border-radius:8px; background:var(--bg-3); border:1px solid var(--border); flex:1; cursor:pointer; }
.wz-suggest-btn.active { border-color:var(--accent); background:var(--accent-soft); }
.wz-suggest-btn b { font-size:12px; color:var(--text-primary); }
.wz-suggest-btn span { font-size:10px; color:var(--text-tertiary); margin-top:2px; }
.wz-price-warning { font-size: 11px; color: var(--danger); margin-top: 4px; display: none; }
.wiz-name-row { display: flex; gap: 8px; align-items: stretch; }
.wiz-name-row .field-input { flex: 1; min-width: 0; }
.wiz-name-dice { flex: 0 0 46px; border-radius: var(--r); background: var(--bg-3); border: 1px solid var(--border); font-size: 18px; line-height: 1; cursor: pointer; color: var(--text-primary); transition: transform 0.06s, border-color 0.15s; }
.wiz-name-dice:hover { border-color: var(--accent); }
.wiz-name-dice:active { transform: scale(0.92); }
.wiz-name-dice.spin { animation: wiz-dice-spin 0.4s ease; }
@keyframes wiz-dice-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.wiz-ff-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-top: 16px; }
.wiz-ff-count { font-size: 11px; color: var(--text-tertiary); white-space: nowrap; }
.wiz-ff-row { padding-top: 2px; scroll-snap-type: x proximity; -webkit-overflow-scrolling: touch; }
.wiz-ff-card { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 118px; min-width: 118px; padding: 24px 8px 10px; text-align: center; scroll-snap-align: center; }
.wiz-ff-thumb { height: 92px; width: 100%; display: flex; align-items: flex-end; justify-content: center; border-radius: var(--r); background: radial-gradient(ellipse at 50% 92%, var(--bg-2) 0%, transparent 72%); margin-bottom: 4px; pointer-events: none; }
.wiz-ff-card .wiz-opt-name { font-size: 12px; line-height: 1.25; min-height: 30px; display: flex; align-items: center; justify-content: center; }
.wiz-ff-card .wiz-opt-meta { font-size: 10px; line-height: 1.3; min-height: 26px; }
[data-modal-id="design-wizard"] .wiz-ff-card.selected .wiz-opt-name { padding-right: 0; }
.wiz-ff-badge { position: absolute; top: 6px; left: 8px; z-index: 1; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 99px; background: var(--accent); color: #fff; letter-spacing: 0.01em; }
.wiz-ff-detail { margin-top: 6px; padding: 10px 12px; border-radius: var(--r); background: var(--bg-3); border: 1px solid var(--border); font-size: 12px; line-height: 1.45; color: var(--text-secondary); }
.wiz-ff-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.wiz-ff-chip { font-size: 11px; padding: 3px 8px; border-radius: 99px; background: var(--bg-2); color: var(--text-secondary); border: 1px solid var(--border); font-variant-numeric: tabular-nums; }
.wiz-ff-chip.pos { color: var(--success, #34c759); }
.wiz-ff-chip.neg { color: var(--warn); }
.wiz-ff-ref { margin-top: 8px; font-size: 11px; color: var(--text-tertiary); }
@media (prefers-reduced-motion: reduce) { .wiz-name-dice.spin { animation: none; } }
`;

function _injectStyles() {
    if (document.getElementById('wz-style')) return;
    const el = document.createElement('style');
    el.id = 'wz-style';
    el.textContent = WZ_CSS;
    document.head.appendChild(el);
}


function defaultState() {
    return {
        step: 1, name: '', nameAuto: '', formFactorManual: false, formFactorId: null, displayId: null, cameraId: 'none', ramId: 'none',
        batteryId: null, chipId: null, networkId: null, osOptionId: null,
        bodyId: null, bodyColorId: null, price: 100, priceManuallyEdited: false, productionQty: 5000
    };
}

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
    const completed = state.get().research.completed || [];
    return COMPONENTS.filter(function (c) {
        return c.category === 'form_factor' && isFormFactorSelectable(c, year, completed);
    });
}

function _recommendedFormFactor(list) {
    if (!list || !list.length) return null;
    let best = list[0];
    for (let i = 1; i < list.length; i++) {
        const a = list[i], bm = best.baseDemandMultiplier || 1, am = a.baseDemandMultiplier || 1;
        if (am > bm || (am === bm && (a.tier || 0) > (best.tier || 0))) best = a;
    }
    return best;
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
    const stillValid = s.formFactorId && ffs.some(function (f) { return f.id === s.formFactorId; });
    if (!(s.formFactorManual && stillValid)) {
        const bestFf = _recommendedFormFactor(ffs);
        if (bestFf) s.formFactorId = bestFf.id;
    }

    const catMap = { display: 'displayId', camera: 'cameraId', battery: 'batteryId', chip: 'chipId', ram: 'ramId', network: 'networkId' };
    for (const catId in catMap) {
        const list = filterComponentsByEra(catId);
        const best = _pickMostExpensive(list);
        if (best) s[catMap[catId]] = best.id;
    }
    if (!s.cameraId) s.cameraId = 'none';
    if (!s.ramId) s.ramId = 'none';

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

function _isNameDuplicate(name) {
    var norm = (name || '').trim().toLowerCase();
    if (!norm) return false;
    var catalog = state.get().products.catalog || [];
    return catalog.some(function (p) {
        return (p.name || '').trim().toLowerCase() === norm;
    });
}

function _rerollName(s) {
    const rawCompany = state.get().companyName || 'Star';
    s.name = _generateBrandedName(rawCompany, DesignEraService.getCurrentYear(), s.formFactorId, [s.name]);
    s.nameAuto = s.name;
}

function _handleAutoFill() {
    const s = _wizardState;
    if (!s) return;

    _autoFillBest(s);

    const cur = (s.name || '').trim();
    if (!cur || cur.indexOf('Model ') === 0 || (s.nameAuto && s.nameAuto === s.name) || _isNameDuplicate(cur)) {
        _rerollName(s);
    }

    const missing = _validateComplete(s);
    if (missing.length) {
        const names = missing.map(function (code) { return _tf('wiz.missing.' + String(code).toLowerCase(), code); });
        ToastService.warning(t('wiz.warn.autofill_missing', { list: names.join(', ') }));
        _render();
        return;
    }

    s.step = 4;
    _render();
    ToastService.success(t('wiz.success.autofill'));
}

export function openDesignWizard(params) {
    if (state.get().products.development) {
        ToastService.warning(t('wiz.err.dev_active'));
        return;
    }

    const s = defaultState();
    const ffs = filterFormFactorsByEra();
    const recFf = _recommendedFormFactor(ffs);
    if (recFf) s.formFactorId = recFf.id;
    const colors = filterBodyColorsByEra();
    if (colors.length) s.bodyColorId = colors[colors.length - 1].id;

    _injectStyles();
    _bindLangOnce();
    _phoneShown = false;
    _wizardState = s;
    _wizardView = 'front';
    _render();
}

let _langBound = false;
function _bindLangOnce() {
    if (_langBound) return;
    _langBound = true;
    bus.on('lang:changed', function () {
        if (!_wizardState) return;
        if (Modal.isOpen && Modal.isOpen('design-wizard')) _render();
        else if (Modal.isOpen && Modal.isOpen('design-wizard-detail')) _openDetailModal();
    });
}

function _render() {
    const s = _wizardState;
    if (!s) return;

    const era = currentEraInfo();
    const year = DesignEraService.getCurrentYear();
    let stepBody = '';
    if (s.step === 1)      stepBody = _step1(s);
    else if (s.step === 2) stepBody = _step2(s);
    else if (s.step === 3) stepBody = _step3(s);
    else                   stepBody = _step4(s);

    const lblFront = _tf('wiz.view.front', _pick('Depan', 'Front'));
    const lblBack  = _tf('wiz.view.back', _pick('Belakang', 'Back'));
    const lblBox   = _tf('wiz.view.box', _pick('Kemasan', 'Box'));

    const stepper = [1, 2, 3, 4].map(function (i) {
        const cls = i === s.step ? 'active' : (i < s.step ? 'done' : '');
        return '<li class="' + cls + '"' + (i === s.step ? ' aria-current="step"' : '') + '>' +
            '<b>' + (i < s.step ? '✓' : i) + '</b><span>' + escapeHtml(_stepTitle(i)) + '</span></li>';
    }).join('');

    const html = `
        <div class="wz-stage" data-era="${era.id}">
            <ol class="wz-steps" aria-label="${escapeHtml(t('wiz.step_of', { n: s.step, title: _stepTitle(s.step) }))}">${stepper}</ol>
            <div class="wz-stage-body">
                <div class="wz-phone" data-wiz-mockup-container></div>
                <div class="wz-live">
                    <div class="wz-era"><b>${year}</b> · ${escapeHtml(_eraLabel(era))}</div>
                    <div data-wiz-spec-strip></div>
                    <div data-wiz-pack-cap></div>
                    <div class="wz-tools">
                        <div class="wiz-view-toggle">
                            <button type="button" data-wiz-view="front" aria-pressed="${_wizardView === 'front'}" class="${_wizardView === 'front' ? 'active' : ''}">${lblFront}</button>
                            <button type="button" data-wiz-view="back" aria-pressed="${_wizardView === 'back'}" class="${_wizardView === 'back' ? 'active' : ''}">${lblBack}</button>
                            <button type="button" data-wiz-view="box" aria-pressed="${_wizardView === 'box'}" class="${_wizardView === 'box' ? 'active' : ''}">${lblBox}</button>
                        </div>
                        <button class="btn-secondary" data-wiz-detail>${t('wiz.detail.btn_show')}</button>
                    </div>
                </div>
            </div>
        </div>

        ${s.step === 1 ? '<div class="wz-era-desc">' + escapeHtml(_eraDesc(era)) + '</div>' : ''}
        ${stepBody}
    `;

    const open = Modal.isOpen && Modal.isOpen('design-wizard');
    const root = open ? document.querySelector('[data-modal-id="design-wizard"]') : null;
    if (root) {
        const card = root.querySelector('.modal-card');
        const sameStep = card.dataset.wzStep === String(s.step);
        const top = card.scrollTop;
        const rows = Array.prototype.map.call(card.querySelectorAll('.wiz-options-row'), function (r) { return r.scrollLeft; });
        card.innerHTML = html;
        card.dataset.wzStep = String(s.step);
        if (sameStep) {
            card.scrollTop = top;
            card.querySelectorAll('.wiz-options-row').forEach(function (r, i) { if (rows[i]) r.scrollLeft = rows[i]; });
        } else {
            card.scrollTop = 0;
        }
        _bindStep();
        requestAnimationFrame(_refreshPreview);
    } else {
        Modal.open('design-wizard', html, { dismissible: false });
        const r2 = document.querySelector('[data-modal-id="design-wizard"] .modal-card');
        if (r2) r2.dataset.wzStep = String(s.step);
        _bindStep();
        requestAnimationFrame(_refreshPreview);
    }
}

function _stepTitle(step) {
    const map = { 1: 'wiz.step1.title', 2: 'wiz.step2.title', 3: 'wiz.step3.title', 4: 'wiz.step4.title' };
    return t(map[step] || '');
}

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

    const rerollBtn = root.querySelector('[data-wiz-reroll]');
    if (rerollBtn) rerollBtn.addEventListener('click', function () {
        _rerollName(_wizardState);
        if (nameInput) nameInput.value = _wizardState.name;
        rerollBtn.classList.remove('spin'); void rerollBtn.offsetWidth; rerollBtn.classList.add('spin');
    });

    const ffRow = root.querySelector('.wiz-ff-row');
    if (ffRow && ffRow.scrollLeft === 0) {
        const sel = ffRow.querySelector('.selected');
        if (sel) ffRow.scrollLeft = Math.max(0, sel.offsetLeft - (ffRow.clientWidth - sel.offsetWidth) / 2);
    }

    root.querySelectorAll('[data-wiz-pick]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const parts = btn.dataset.wizPick.split(':');
            const key = parts[0];
            const value = parts.slice(1).join(':');
            _wizardState[key] = value;
            if (key === 'formFactorId') _wizardState.formFactorManual = true;
            if (key === 'cameraId') _wizardView = 'back';
            else if (key === 'displayId' || key === 'formFactorId') _wizardView = 'front';
            _render();
        });
    });

    root.querySelectorAll('[data-wiz-view]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            _wizardView = (btn.dataset.wizView === 'back' || btn.dataset.wizView === 'box') ? btn.dataset.wizView : 'front';
            root.querySelectorAll('[data-wiz-view]').forEach(function (b) {
                b.classList.toggle('active', b.dataset.wizView === _wizardView);
                b.setAttribute('aria-pressed', b.dataset.wizView === _wizardView ? 'true' : 'false');
            });
            _refreshPreview();
        });
    });

    const priceInput = root.querySelector('[data-wiz-price]');
    if (priceInput) {
        priceInput.value = _wizardState.price;
        priceInput.addEventListener('input', function (e) {
            _wizardState.price = parseInt(e.target.value, 10) || 0;
            _wizardState.priceManuallyEdited = true;
            root.querySelectorAll('[data-wiz-suggest]').forEach(b => b.classList.remove('active'));
            _refreshPreview();
            _updateConfirmButtonState();
        });
    }
    
    root.querySelectorAll('[data-wiz-suggest]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const type = btn.dataset.wizSuggest;
            const prices = _getSuggestedPrices(_wizardState);
            _wizardState.price = prices[type];
            _wizardState.priceManuallyEdited = true;
            
            root.querySelectorAll('[data-wiz-suggest]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if(priceInput) priceInput.value = _wizardState.price;
            _refreshPreview();
            _updateConfirmButtonState();
        });
    });

    const qtyInput = root.querySelector('[data-wiz-qty]');
    if (qtyInput) {
        qtyInput.value = _wizardState.productionQty;
        qtyInput.addEventListener('input', function (e) {
            _wizardState.productionQty = parseInt(e.target.value, 10) || 0;
            _refreshPreview();
            _updateConfirmButtonState();
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
    const warnEl = root.querySelector('[data-wz-price-warning]');
    if (!btn) return;
    const s = _wizardState;
    if (!s) return;

    const ps = window.__game && window.__game.products;
    if (!ps) return;

    let unitCost = 0;
    try { unitCost = ps.computeUnitCost ? ps.computeUnitCost(s) : 0; } catch (e) {}
    
    const limits = _getPriceLimits(s);
    const afford = _affordInfo(s);
    
    let priceError = null;
    if (s.price < limits.min) {
        priceError = _tf('wiz.price.too_low', 'Harga terlalu murah! Minimal ${min} (Biaya produksi).', { min: limits.min });
    } else if (s.price > limits.max) {
        priceError = _tf('wiz.price.too_high', 'Harga terlalu mahal! Pasar tidak akan membeli di atas ${max}.', { max: limits.max });
    }

    const canRelease = !priceError && afford.ok;

    if (warnEl) {
        if (priceError) {
            warnEl.textContent = "⚠ " + priceError;
            warnEl.style.display = 'block';
        } else {
            warnEl.style.display = 'none';
        }
    }

    if (canRelease) {
        btn.disabled = false;
        btn.style.opacity = '';
        btn.style.cursor = '';
        btn.textContent = t('wiz.step4.release');
    } else {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.textContent = priceError ? _tf('wiz.price.invalid', 'Harga Tidak Valid') : (!afford.ok ? _tf('wiz.cash.short_btn', _pick('Dana tidak cukup', 'Not enough cash')) : t('wiz.step4.release'));
    }
}

function _next() {
    const s = _wizardState;
    if (s.step === 1) {
        if (!s.name.trim()) { ToastService.warning(t('wiz.err.need_name')); return; }
        if (!s.formFactorId) { ToastService.warning(t('wiz.err.need_ff')); return; }
        if (_isNameDuplicate(s.name)) {
            ToastService.error(_tf('wiz.err.duplicate_name', 'Nama produk sudah dipakai.'));
            return;
        }
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
            s.price = _getSuggestedPrices(s).balanced;
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

    const limits = _getPriceLimits(s);
    if (s.price < limits.min || s.price > limits.max) {
        ToastService.error(_tf('wiz.price.out_of_range', 'Harga di luar batas wajar pasar.'));
        return;
    }

    const res = game.products.confirmDesign({
        name: s.name.trim(),
        formFactorId: s.formFactorId,
        displayId: s.displayId,
        cameraId: (s.cameraId && s.cameraId !== 'none') ? s.cameraId : null,
        ramId: (s.ramId && s.ramId !== 'none') ? s.ramId : null,
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
    _wizardState = null;
    _wizardView = 'front';
    Modal.close('design-wizard', true);
    if (game.render) game.render();
}

function _ffShortRef(f) {
    return String(f.realReference || '').split('·')[0].trim();
}

function _ffDetailHtml(f, year) {
    if (!f) return '';
    const st = f.stats || {};
    const chips = [];
    if (st.usability) chips.push('<span class="wiz-ff-chip pos">' + escapeHtml(_tf('wiz.step1.ff_usability', 'Kegunaan')) + ' +' + st.usability + '</span>');
    if (st.design) chips.push('<span class="wiz-ff-chip pos">' + escapeHtml(_tf('wiz.step1.ff_design', 'Desain')) + ' +' + st.design + '</span>');
    if (f.costPerUnit > 0) chips.push('<span class="wiz-ff-chip neg">' + escapeHtml(_tf('wiz.step1.ff_cost', 'Biaya +${n}/unit', { n: f.costPerUnit })) + '</span>');
    if (f.baseDemandMultiplier) chips.push('<span class="wiz-ff-chip">' + escapeHtml(_tf('wiz.step1.ff_demand', 'Permintaan ×{n}', { n: f.baseDemandMultiplier.toFixed(2) })) + '</span>');
    const to = (typeof f.maxYear === 'number') ? f.maxYear : _tf('wiz.step1.ff_now', 'sekarang');
    return '<div class="wiz-ff-detail">' +
        '<div>' + escapeHtml(f.description || '') + '</div>' +
        '<div class="wiz-ff-chips">' + chips.join('') + '</div>' +
        '<div class="wiz-ff-ref">' + escapeHtml(_tf('wiz.step1.ff_ref', 'Contoh nyata: {ref}', { ref: f.realReference || '-' })) +
        ' · ' + escapeHtml(_tf('wiz.step1.ff_window', 'Tersedia {from}–{to}', { from: f.minYear, to: to })) + '</div>' +
        '</div>';
}

function _ffThumb(f, s) {
    const colors = filterBodyColorsByEra();
    const colorId = s.bodyColorId || (colors.length ? colors[0].id : 'color_black');
    try {
        return renderPhoneMockup(
            { formFactorId: f.id, bodyColorId: colorId, cameraId: 'none', displayId: s.displayId || '' },
            { fit: { w: 88, h: 88 }, view: 'front', isStatic: true, showBrand: false }
        );
    } catch (e) { return ''; }
}

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

    const year = DesignEraService.getCurrentYear();
    const rec = _recommendedFormFactor(ffs);
    const selected = ffs.filter(function (f) { return f.id === s.formFactorId; })[0] || null;
    const recLabel = _tf('wiz.step1.recommended', '★ Rekomendasi');

    return `
        <label class="field-label">${t('wiz.step1.name_label')}</label>
        <div class="wiz-name-row">
            <input class="field-input" data-wiz-name maxlength="24" placeholder="${t('wiz.step1.name_ph')}" autocomplete="off" />
            <button type="button" class="wiz-name-dice" data-wiz-reroll aria-label="${escapeHtml(_tf('wiz.step1.reroll', 'Acak nama'))}" title="${escapeHtml(_tf('wiz.step1.reroll', 'Acak nama'))}">🎲</button>
        </div>

        <button class="wiz-autofill-btn" data-wiz-autofill>
            <span class="wiz-autofill-ico">✨</span>
            <span>${t('wiz.step1.autofill_btn')}</span>
        </button>
        <div class="wiz-autofill-hint">${t('wiz.step1.autofill_hint')}</div>

        <div class="wiz-ff-head">
            <label class="field-label" style="margin:0;">${t('wiz.step1.ff_label')}</label>
            <span class="wiz-ff-count">${escapeHtml(_tf('wiz.step1.ff_count', '{n} pilihan di {year}', { n: ffs.length, year: year }))}</span>
        </div>
        <div class="wiz-options-row wiz-ff-row" role="listbox">
            ${ffs.map(function (f) {
                const sel = s.formFactorId === f.id;
                return '<button class="wiz-option wiz-ff-card ' + (sel ? 'selected' : '') + '" role="option" aria-selected="' + sel + '" data-wiz-pick="formFactorId:' + f.id + '">' +
                    (rec && rec.id === f.id ? '<span class="wiz-ff-badge">' + escapeHtml(recLabel) + '</span>' : '') +
                    '<div class="wiz-ff-thumb">' + _ffThumb(f, s) + '</div>' +
                    '<div class="wiz-opt-name">' + escapeHtml(f.name) + '</div>' +
                    '<div class="wiz-opt-meta">' + escapeHtml(_ffShortRef(f)) + '</div>' +
                    '</button>';
            }).join('')}
        </div>
        ${_ffDetailHtml(selected, year)}

        <div class="wiz-nav">
            <button class="btn-secondary" data-wiz-cancel style="flex:1;">${t('wiz.step1.cancel')}</button>
            <button class="btn-primary" data-wiz-next style="flex:2;">${t('wiz.step1.next')}</button>
        </div>
    `;
}

function _step2(s) {
    const cats = ['display', 'camera', 'battery', 'chip', 'ram', 'network'];
    const stateKeys = { display: 'displayId', camera: 'cameraId', battery: 'batteryId', chip: 'chipId', ram: 'ramId', network: 'networkId' };

    const groups = cats.map(function (catId) {
        const cat = COMPONENT_CATEGORIES.find(function (c) { return c.id === catId; });
        const list = filterComponentsByEra(catId);
        const stateKey = stateKeys[catId];
        const selected = s[stateKey];
        const isOptional = OPTIONAL_CATEGORIES.indexOf(catId) !== -1;

        let options = list.map(function (c) {
            const unitNow = resolveComponentCost(state.get(), c);
            const inHouse = unitNow < c.costPerUnit;
            return '<button class="wiz-option ' + (selected === c.id ? 'selected' : '') + '" data-wiz-pick="' + stateKey + ':' + c.id + '">' +
                '<div class="wiz-opt-name">' + escapeHtml(c.name) + '</div>' +
                '<div class="wiz-opt-meta">' + _perUnit(unitNow) + (inHouse ? ' · <span class="wiz-opt-tag">' + escapeHtml(_tf('wiz.step2.in_house', 'Internal')) + '</span>' : '') + (_statTag(c) ? ' · <span class="wiz-opt-tag">' + escapeHtml(_statTag(c)) + '</span>' : '') + '</div>' +
                '</button>';
        }).join('');

        if (isOptional) {
            const noneLabel = catId === 'camera' ? t('wiz.step2.no_camera') : catId === 'ram' ? _tf('wiz.step2.no_ram', 'RAM Standar') : t('wiz.step2.no_item', { name: _catName(cat) });
            const noneMeta = catId === 'camera' ? t('wiz.step2.no_camera_hint') : catId === 'ram' ? _tf('wiz.step2.no_ram_hint', 'Memori bawaan chip, tanpa biaya tambahan') : t('wiz.step2.optional');
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

        const selComp = (selected && selected !== 'none') ? getComponentById(selected) : null;
        const capHtml = selComp && selComp.description
            ? '<div class="wz-cap">' + escapeHtml(selComp.description) + (selComp.realReference ? ' <em>' + escapeHtml(selComp.realReference) + '</em>' : '') + '</div>'
            : '';

        return '<div class="wiz-cat">' +
            '<div class="wiz-cat-title" style="text-transform:none;">' + iconHtml + escapeHtml(_catName(cat)) + ' <span style="color:var(--text-mute);font-weight:500;">' + countLabel + '</span></div>' +
            '<div class="wiz-options-row">' + options + '</div>' +
            capHtml +
            '</div>';
    }).join('');

    return `
        <div class="wz-scroll">${groups}</div>
        <div class="wiz-nav">
            <button class="btn-secondary" data-wiz-back style="flex:1;">${t('wiz.step2.back')}</button>
            <button class="btn-primary" data-wiz-next style="flex:2;">${t('wiz.step2.next')}</button>
        </div>
    `;
}

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
        <div class="wz-scroll">
            <div class="wiz-cat">
                <div class="wiz-cat-title" style="text-transform:none;">${renderIcon('disc', 14, 'style="vertical-align:middle;margin-right:5px;"')}${t('wiz.step3.os_label')}</div>
                <div class="wiz-options-row">
                    ${osOptions.length ? osOptions.map(function (o) {
                        var meta = o.source === 'license' ? _perUnit(o.costPerUnit) : t('wiz.step3.os_free');
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
                            '<div class="wiz-opt-meta">' + _perUnit(b.costPerUnit) + (_statTag(b) ? ' · <span class="wiz-opt-tag">' + escapeHtml(_statTag(b)) + '</span>' : '') + '</div>' +
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
                        ' title="' + escapeHtml(_colorName(c)) + '"' +
                        ' aria-label="' + escapeHtml(_colorName(c)) + '"></button>';
                }).join('') + '</div>' : '<div class="wiz-empty">' + t('wiz.step3.color_empty') + '</div>'}
            </div>
        </div>
        <div class="wiz-nav">
            <button class="btn-secondary" data-wiz-back style="flex:1;">${t('wiz.step3.back')}</button>
            <button class="btn-primary" data-wiz-next style="flex:2;">${t('wiz.step3.next')}</button>
        </div>
    `;
}

function _step4(s) {
    const ps = window.__game && window.__game.products;
    let unitCost = 0;
    try { unitCost = ps && ps.computeUnitCost ? ps.computeUnitCost(s) : 0; } catch (e) {}
    const limits = _getPriceLimits(s);
    const afford = _affordInfo(s);
    const prices = _getSuggestedPrices(s);

    return `
        <div class="wiz-price-layout">
            <div>
                <label class="field-label">${t('wiz.step4.price_label')}</label>
                <input class="field-input" data-wiz-price type="number" min="${limits.min}" max="${limits.max}" value="${s.price}" />
                <div style="font-size:10px; color:var(--text-tertiary); margin-top:4px;">${_tf('wiz.price.range_hint', 'Batas pasar: ${min} - ${max}', { min: limits.min, max: limits.max })}</div>
                <div class="wz-price-warning" data-wz-price-warning></div>
            </div>
            <div>
                <label class="field-label">${t('wiz.step4.qty_label')}</label>
                <input class="field-input" data-wiz-qty type="number" min="100" step="100" value="${s.productionQty}" />
            </div>
        </div>

        <div style="display:flex; gap:8px; margin-top:8px; margin-bottom:16px;">
            <button class="wz-suggest-btn" data-wiz-suggest="budget">
                <b>$${prices.budget}</b>
                <span>${_tf('wiz.price.budget', 'Ekonomis')}</span>
            </button>
            <button class="wz-suggest-btn ${!s.priceManuallyEdited || s.price === prices.balanced ? 'active' : ''}" data-wiz-suggest="balanced">
                <b>$${prices.balanced}</b>
                <span>${_tf('wiz.price.market', 'Pasar')}</span>
            </button>
            <button class="wz-suggest-btn" data-wiz-suggest="premium">
                <b>$${prices.premium}</b>
                <span>${_tf('wiz.price.premium', 'Premium')}</span>
            </button>
        </div>

        <div>
            <div class="card-title">${t('wiz.step4.summary')}</div>
            <div data-wiz-preview>${_previewHtml(s)}</div>
        </div>

        <div class="wiz-nav">
            <button class="btn-secondary" data-wiz-back style="flex:1;">${t('wiz.step4.back')}</button>
            <button class="btn-primary" data-wiz-confirm style="flex:2;">
                ${t('wiz.step4.release')}
            </button>
        </div>
    `;
}

function _getAdaptiveSize() {
    if (typeof window === 'undefined') return 250;
    return window.innerWidth < 380 ? 124 : 140;
}

function _refreshPreview() {
    const root = document.querySelector('[data-modal-id="design-wizard"]');
    if (!root) return;

    const mockupContainer = root.querySelector('[data-wiz-mockup-container]');
    if (mockupContainer) {
        try {
            const size = _getAdaptiveSize();
            const yr = DesignEraService.getCurrentYear();
            const sp = resolveSpec(yr, state.get().research.completed || []);
            mockupContainer.innerHTML = renderPhoneMockup(_wizardState, {
                size: size,
                view: _wizardView,
                isStatic: _phoneShown,
                showBrand: false,
                packCaption: false
            });
            _phoneShown = true;
        } catch (e) {
            console.error('[DesignWizard] Mockup error:', e);
            mockupContainer.innerHTML = '';
        }
    }

    const packCap = root.querySelector('[data-wiz-pack-cap]');
    if (packCap) {
        try { packCap.innerHTML = _wizardView === 'box' ? renderPackagingCaption(_wizardState, { year: DesignEraService.getCurrentYear() }) : ''; }
        catch (e) { packCap.innerHTML = ''; }
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
        chipId: 'performance', ramId: 'performance', networkId: 'connectivity', bodyId: 'quality',
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

function _specStripHtml(s) {
    const ps = window.__game && window.__game.products;
    if (!ps) return '';

    const name = (s.name || '').trim();
    const displayName = name ? escapeHtml(name) : '<span style="opacity:0.5;">' + t('wiz.spec.no_name') + '</span>';
    const price = s.price || 0;

    let unitCost = 0;
    let stats = {};
    try {
        unitCost = ps.computeUnitCost ? ps.computeUnitCost(s) : 0;
        stats = _computeStats(s) || {};
    } catch (e) {}
    const qualityScore = Math.max(0, Math.min(100, stats.qualityScore || 0));

    const margin = price - unitCost;
    const marginPct = price > 0 ? Math.round((margin / price) * 100) : 0;
    const marginColor = margin >= 0 ? 'var(--success)' : 'var(--danger)';
    const meterColor = qualityScore >= 70 ? 'var(--success)' : (qualityScore >= 40 ? 'var(--warn)' : 'var(--danger)');

    const displayComp = s.displayId ? getComponentById(s.displayId) : null;
    const chipComp = s.chipId ? getComponentById(s.chipId) : null;

    const warnings = [];
    if (stats.performance > 60 && stats.battery < 40) warnings.push(t('wiz.preview.warn_chip_bat'));
    if (stats.camera > 60 && stats.display < 40) warnings.push(t('wiz.preview.warn_cam_disp'));
    if (margin < 0) warnings.push(t('wiz.preview.warn_margin'));
    if (s.step === 4 && !_affordInfo(s).ok) warnings.push(_tf('wiz.cash.short_batch', _pick('Dana tidak cukup untuk batch ini', 'Not enough cash for this batch')));

    return `
        <div class="wz-head">
            <span class="wz-name">${displayName}</span>
            <span class="wz-price">$${price}</span>
        </div>
        <div class="wz-meter-row" role="img" aria-label="${t('wiz.spec.quality')} ${qualityScore}/100">
            <span>${t('wiz.spec.quality')}</span>
            <span class="wz-meter"><i style="width:${qualityScore}%;background:${meterColor};"></i></span>
            <b>${qualityScore}/100</b>
        </div>
        <div class="wz-kv"><span>${t('wiz.spec.margin')}</span><b style="color:${marginColor};">$${margin} (${marginPct}%)</b></div>
        <div class="wz-kv"><span>${t('wiz.spec.screen')}</span><b title="${displayComp ? escapeHtml(displayComp.name) : ''}">${displayComp ? escapeHtml(_shortText(displayComp.name, 22)) : '—'}</b></div>
        <div class="wz-kv"><span>${t('wiz.spec.chip')}</span><b title="${chipComp ? escapeHtml(chipComp.name) : ''}">${chipComp ? escapeHtml(_shortText(chipComp.name, 22)) : '—'}</b></div>
        ${warnings.length ? '<div class="wz-warn">⚠ ' + escapeHtml(warnings[0]) + (warnings.length > 1 ? ' (+' + (warnings.length - 1) + ')' : '') + '</div>' : ''}
    `;
}

function _previewHtml(s) {
    const ps = window.__game && window.__game.products;
    if (!ps) return '<div style="font-size:12px;color:var(--text-mute);">' + t('wiz.err.not_ready') + '</div>';
    try {
        const stats = _computeStats(s);
        const unitCost = ps.computeUnitCost ? ps.computeUnitCost(s) : 0;
        // Tagihan desain: tanpa baterai & layar (sama dengan confirmDesign).
        const designUnitCost = ps.computeUnitCost ? ps.computeUnitCost(s, true) : 0;
        let totalCost = designUnitCost * (s.productionQty || 0) + BALANCE.products.productionSetupCost;
        let volMult = 1;
        if (ps.quoteDesign) { const q = ps.quoteDesign(s); totalCost = q.total; volMult = q.volMult; }
        const demand = ps.estimateDemand ? ps.estimateDemand(s) : 0;
        const margin = (s.price || 0) - unitCost;
        const marginPct = s.price > 0 ? Math.round((margin / s.price) * 100) : 0;
        // Pecahan biaya per unit: bagian desain (ditagih sekarang) + baterai & layar (ditagih saat produksi).
        // designUnitCost * qty + setup = totalCost, sehingga angka di pratinjau bisa dicocokkan.
        const plantPartCost = Math.max(0, unitCost - designUnitCost);
        const noCamera = !s.cameraId || s.cameraId === 'none';
        const _gd = state.get();
        const _fx = [
            ['battery', 'batteryLife', _pick('Baterai', 'Battery')], ['display', 'displayQuality', _pick('Layar', 'Display')],
            ['soc', 'performance', _pick('Performa', 'Performance')], ['camera', 'cameraQuality', _pick('Kamera', 'Camera')],
            ['ram', 'usability', _pick('Kelancaran', 'Smoothness')]
        ].map(function (x) { const v = getBuiltPlantEffect(_gd, x[0], x[1]); return v > 0 ? x[2] + ' +' + Math.round(v * 100) + '%' : ''; }).filter(Boolean);
        const plantFxHtml = _fx.length
            ? '<div class="preview-row"><span>' + _tf('wiz.preview.plant_fx', _pick('Bonus pabrik', 'Plant bonus')) + '</span><b>' + escapeHtml(_fx.join(', ')) + '</b></div>'
            : '';

        const warnings = [];
        if (stats.performance > 60 && stats.battery < 40) warnings.push(t('wiz.preview.warn_chip_bat'));
        if (stats.camera > 60 && stats.display < 40) warnings.push(t('wiz.preview.warn_cam_disp'));
        if (margin < 0) warnings.push(t('wiz.preview.warn_margin'));
        if (volMult > 1.02) warnings.push(_tf('wiz.warn.volume_cost', _pick('Volume besar: biaya komponen +{pct}% (pasokan menipis). Pecah produksi tidak membantu: unit 30 hari terakhir ikut dihitung.', 'Large volume: component cost +{pct}% (supply is tight). Splitting orders does not help: units from the last 30 days count too.'), { pct: Math.round((volMult - 1) * 100) }));
        const afford = _affordInfo(s);
        if (!afford.ok) {
            warnings.push(_tf('wiz.cash.short_detail',
                _pick('Dana tidak cukup: butuh {need}, tersedia {have}. Kurangi jumlah produksi.',
                      'Not enough cash: need {need}, you have {have}. Lower the production quantity.'),
                { need: _fmtUsd(afford.cost), have: _fmtUsd(afford.cash) }));
        }

        return `
            <div class="preview-row"><span>${t('wiz.preview.quality')}</span><b>${stats.qualityScore || 0}/100</b></div>
            <div class="preview-row"><span>${_tf('wiz.preview.unit_design', _pick('Biaya desain per unit', 'Design cost per unit'))}</span><b>$${designUnitCost}</b></div>
            <div class="preview-row"><span>${_tf('wiz.preview.unit_parts', _pick('Komponen pabrik (saat produksi)', 'Factory parts (at production)'))}</span><b>$${plantPartCost}</b></div>
            ${plantFxHtml}
            <div class="preview-row"><span>${t('wiz.preview.total_cost')}</span><b>$${totalCost.toLocaleString('en-US')}</b></div>
            <div class="preview-row"><span>${t('wiz.preview.margin')}</span><b style="color:${margin >= 0 ? 'var(--success)' : 'var(--danger)'};">$${margin} (${marginPct}%)</b></div>
            <div class="preview-row"><span>${t('wiz.preview.demand')}</span><b>${t('wiz.preview.demand_unit', { n: demand.toLocaleString('en-US') })}</b></div>
            ${noCamera ? '<div style="margin-top:8px;font-size:11px;color:var(--text-mute);">' + t('wiz.preview.no_camera') + '</div>' : ''}
            ${warnings.length ? '<div style="margin-top:8px;font-size:11px;color:var(--warn);line-height:1.5;">⚠ ' + warnings.join('<br>⚠ ') + '</div>' : ''}
        `;
    } catch (e) {
        return '<div style="font-size:12px;color:var(--danger);">' + escapeHtml(_tf('wiz.preview.error', 'Pratinjau error: {msg}', { msg: e.message })) + '</div>';
    }
}

function _openDetailModal() {
    const s = _wizardState;
    if (!s) return;

    const year = DesignEraService.getCurrentYear();
    const completed = state.get().research.completed || [];
    const era = getDesignEraForYear(year);
    const spec = resolveSpec(year, completed);

    let mockupHtml = '';
    try { mockupHtml = '<div style="display:flex;gap:10px;justify-content:center;align-items:flex-end;flex-wrap:wrap;">' + renderPhoneMockup(s, { size: 200, view: 'front', isStatic: true }) + renderPhoneMockup(s, { size: 200, view: 'back', isStatic: true, showBrand: false }) + '<div style="display:flex;flex-direction:column;align-items:center;">' + renderPhoneMockup(s, { size: 200, view: 'box', isStatic: true }) + '</div></div>'; }
    catch (e) { mockupHtml = '<div style="color:var(--danger);font-size:12px;">' + escapeHtml(_tf('wiz.mockup_error', 'Mockup gagal dimuat')) + '</div>'; }

    const compInfo = [
        { labelKey: 'wiz.detail.spec_ff', id: s.formFactorId },
        { labelKey: 'wiz.detail.spec_screen', id: s.displayId },
        { labelKey: 'wiz.detail.spec_camera', id: (s.cameraId && s.cameraId !== 'none') ? s.cameraId : null },
        { labelKey: 'wiz.detail.spec_battery', id: s.batteryId },
        { labelKey: 'wiz.detail.spec_chip', id: s.chipId },
        { labelKey: 'wiz.detail.spec_ram', id: (s.ramId && s.ramId !== 'none') ? s.ramId : null },
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
        ? '<div class="sum-row"><span>' + t('wiz.detail.spec_color') + '</span><b><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:' + colorComp.hex + ';vertical-align:middle;margin-right:6px;border:1px solid var(--border);"></span>' + escapeHtml(_colorName(colorComp)) + '</b></div>'
        : '';

    const html = `
        <div class="modal-title">${t('wiz.detail.title')}</div>
        <div class="modal-sub">${t('wiz.detail.sub', { name: escapeHtml(s.name || t('wiz.spec.no_name')), year: year })}</div>

        <div class="wiz-detail-mockup">
            ${mockupHtml}
        </div>

        <div class="sum-row"><span>${t('wiz.detail.era')}</span><b>${escapeHtml(_eraLabel(era))}</b></div>
        <div class="sum-row"><span>${t('wiz.detail.milestone')}</span><b>${escapeHtml(spec.label || spec.id)}</b></div>
        <div class="card-title" style="margin-top:14px;">${t('wiz.detail.section_comp')}</div>
        ${compRows}
        ${colorRow}

        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:14px;">${t('wiz.detail.close')}</button>
    `;

    Modal.open('design-wizard-detail', html);
}
