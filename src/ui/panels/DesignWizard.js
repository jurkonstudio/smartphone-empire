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
import { resolveComponentCost, getMarketPrice, getBuiltPlantEffect } from '../../data/material-plants.data.js';
import { BALANCE } from '../../data/balance.data.js';
import { isFaiActive, getFaiDesignAdvice } from '../../systems/FutureEffects.js';
import {
    FEATURES, FEATURE_GROUPS, EXPECTATIONS, REGULATIONS, getFeatureById, getFeatureName, getFeatureDescription,
    isFeatureSelectable
} from '../../data/features.data.js';
import { nodeNameById } from '../../data/i18n/research-localize.js';
import { getTierAssemblyEffort } from '../../data/product-tiers.data.js';

let _wizardState = null;
let _wizardView = 'front';

const OPTIONAL_CATEGORIES = ['camera', 'ram', 'storage'];
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

// Saran F-AI (hanya bila F-AI terbuka). null bila belum aktif.
function _getFaiAdvice(s) {
    let data = {};
    try { data = state.get(); } catch (e) {}
    if (!isFaiActive(data)) return null;
    let unitCost = 50, stats = {};
    const ps = window.__game && window.__game.products;
    try { unitCost = ps.computeUnitCost(s); } catch (e) {}
    try { stats = _computeStats(s) || {}; } catch (e) {}
    const skip = [];
    if (!s.cameraId || s.cameraId === 'none') skip.push('camera');
    return getFaiDesignAdvice(stats, unitCost, _getPriceLimits(s), skip);
}

const WZ_CSS = `
.wz-feat-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.wz-feat { flex: 1 1 140px; min-width: 130px; text-align: left; padding: 8px 10px; border-radius: 10px; background: var(--bg-3); border: 1px solid var(--border); color: var(--text-primary); cursor: pointer; position: relative; }
.wz-feat.selected { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, var(--bg-3)); }
.wz-feat.selected::after { content: "✓"; position: absolute; top: 6px; right: 8px; font-size: 11px; font-weight: 800; color: var(--accent); }
.wz-feat.locked { opacity: 0.5; cursor: not-allowed; }
.wz-feat b { display: block; font-size: 12px; padding-right: 14px; }
.wz-feat small { display: block; font-size: 10px; color: var(--text-tertiary); line-height: 1.35; margin-top: 2px; }
.wz-feat-hint { font-size: 11px; color: var(--text-tertiary); margin: -4px 0 8px; line-height: 1.4; }
.wz-feat-fx { margin-top: 8px; font-size: 11px; line-height: 1.5; }
.wz-feat-fx .pos { color: var(--success); } .wz-feat-fx .neg { color: var(--warn); }
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

const WZ_TIER_CSS = `
.wz-tier-note { font-size: 11px; color: var(--text-tertiary); margin: 0 0 10px; line-height: 1.45; }
.wz-tiers { display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 2px 2px 8px; margin: 0 -2px 10px; -webkit-overflow-scrolling: touch; }
.wz-tier { flex: 0 0 80%; scroll-snap-align: start; min-width: 0; background: var(--bg-2); border: 1px solid var(--border); border-radius: 12px; padding: 10px; display: flex; flex-direction: column; gap: 6px; transition: opacity .15s; }
.wz-tier.is-off { opacity: .55; }
.wz-tier.is-off .wz-tier-presets { pointer-events: none; }
.wz-tier-head { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.wz-tier-badge { font-size: 12px; font-weight: 800; padding: 3px 10px; border-radius: 999px; background: var(--accent); color: #fff; }
.wz-tier-pro .wz-tier-badge { background: color-mix(in srgb, var(--accent) 65%, #000); }
.wz-tier-promax .wz-tier-badge { background: #1d1d1f; }
.wz-tier-req, .wz-tier-toggle { font-size: 11px; color: var(--text-tertiary); display: inline-flex; align-items: center; gap: 4px; }
.wz-tier-thumb { display: flex; justify-content: center; min-height: 96px; }
.wz-tier-thumb svg { max-width: 100%; height: auto; }
.wz-tier-name-row { display: flex; gap: 6px; align-items: center; }
.wz-tier-name-row .field-input { flex: 1; min-width: 0; }
.wz-tier-warn { display: none; font-size: 11px; color: var(--warn); line-height: 1.4; }
.wz-tier-info .preview-row { font-size: 11px; }
.wz-tier-presets { display: flex; gap: 4px; }
.wz-tier-presets .wz-tier-preset { flex: 1; min-width: 0; }
.wz-tier-parts { font-size: 11px; }
.wz-tier-parts summary { cursor: pointer; color: var(--text-secondary); padding: 4px 0; font-weight: 600; }
.wz-tier-parts-grid { display: grid; grid-template-columns: 1fr; gap: 6px; padding: 4px 0 8px; }
.wz-tier-part { display: flex; flex-direction: column; gap: 3px; color: var(--text-tertiary); font-size: 10.5px; }
.wz-tier-part select { width: 100%; }
@media (min-width: 640px) {
    .wz-tier { flex: 1 1 0; }
    .wz-tiers { overflow-x: visible; }
}
`;

function _injectStyles() {
    if (document.getElementById('wz-style')) return;
    const el = document.createElement('style');
    el.id = 'wz-style';
    el.textContent = WZ_CSS + WZ_TIER_CSS;
    document.head.appendChild(el);
}


function defaultState() {
    return {
        step: 1, name: '', nameAuto: '', formFactorManual: false, formFactorId: null, displayId: null, cameraId: 'none', ramId: 'none', storageId: 'none',
        batteryId: null, chipId: null, networkId: null, osOptionId: null,
        bodyId: null, bodyColorId: null, price: 100, priceManuallyEdited: false, productionQty: 5000,
        featureIds: [], tierPlans: null
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

    const catMap = { display: 'displayId', camera: 'cameraId', battery: 'batteryId', chip: 'chipId', ram: 'ramId', storage: 'storageId', network: 'networkId' };  // storage ikut: memori kecil menurunkan permintaan (fitur)
    for (const catId in catMap) {
        const list = filterComponentsByEra(catId);
        const best = _pickMostExpensive(list);
        if (best) s[catMap[catId]] = best.id;
    }
    if (!s.cameraId) s.cameraId = 'none';
    if (!s.ramId) s.ramId = 'none';
    if (!s.storageId) s.storageId = 'none';

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

    s.featureIds = _autoFeatureIds();   // standar pasar + regulasi, fitur termurah
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
    const lblOpen  = _tf('wiz.view.open', _pick('Terbuka', 'Open'));
    const canOpen  = s.formFactorId === 'ff_fold' || s.formFactorId === 'ff_tri_fold';

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
                            ${canOpen ? `<button type="button" data-wiz-view="open" aria-pressed="${_wizardView === 'open'}" class="${_wizardView === 'open' ? 'active' : ''}">${lblOpen}</button>` : ''}
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
            if (key === 'osOptionId') _osMenuOpen = false;
            if (key === 'formFactorId') _wizardState.formFactorManual = true;
            if (key === 'cameraId') _wizardView = 'back';
            else if (key === 'displayId' || key === 'formFactorId') _wizardView = 'front';
            _render();
        });
    });

    root.querySelectorAll('[data-wiz-os-toggle]').forEach(function (btn) {
        btn.addEventListener('click', function () { _osMenuOpen = !_osMenuOpen; _render(); });
    });

    root.querySelectorAll('[data-wiz-feature]').forEach(function (btn) {
        btn.addEventListener('click', function () { _toggleFeature(btn.dataset.wizFeature); });
    });

    root.querySelectorAll('[data-wiz-view]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            _wizardView = (btn.dataset.wizView === 'back' || btn.dataset.wizView === 'box' || btn.dataset.wizView === 'open') ? btn.dataset.wizView : 'front';
            root.querySelectorAll('[data-wiz-view]').forEach(function (b) {
                b.classList.toggle('active', b.dataset.wizView === _wizardView);
                b.setAttribute('aria-pressed', b.dataset.wizView === _wizardView ? 'true' : 'false');
            });
            _refreshPreview();
        });
    });

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

    if (_wizardState.step === 4) _bindTierPanels(root);
}

function _updateConfirmButtonState() {
    const root = document.querySelector('[data-modal-id="design-wizard"]');
    if (!root) return;
    const btn = root.querySelector('[data-wiz-confirm]');
    const s = _wizardState;
    if (!btn || !s || !s.tierPlans) return;

    const plans = _enabledPlans(s);
    const hasIssues = TIER_ORDER.some(function (id) { return _tierIssues(s, id).length > 0; });
    const afford = _affordFamily(_quoteFamily(s).total);
    const canRelease = plans.length > 0 && !hasIssues && afford.ok;

    btn.disabled = !canRelease;
    btn.style.opacity = canRelease ? '' : '0.5';
    btn.style.cursor = canRelease ? '' : 'not-allowed';
    if (canRelease) btn.textContent = t('wiz.step4.release');
    else if (plans.length === 0) btn.textContent = _pick('Pilih varian', 'Pick a variant');
    else if (hasIssues) btn.textContent = _pick('Periksa varian', 'Check variants');
    else btn.textContent = _tf('wiz.cash.short_btn', _pick('Dana tidak cukup', 'Not enough cash'));
}

function _confirm() {
    const s = _wizardState;
    const game = window.__game;
    if (!game || !game.products) { ToastService.error(t('wiz.err.not_ready')); return; }
    _ensureTierPlans(s);

    const res = game.products.confirmTierFamily(_baseConfig(s), _enabledPlans(s));
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
    const cats = ['display', 'camera', 'battery', 'chip', 'ram', 'storage', 'network'];
    const stateKeys = { display: 'displayId', camera: 'cameraId', battery: 'batteryId', chip: 'chipId', ram: 'ramId', storage: 'storageId', network: 'networkId' };

    const groups = cats.map(function (catId) {
        const cat = COMPONENT_CATEGORIES.find(function (c) { return c.id === catId; });
        const list = filterComponentsByEra(catId);
        if (catId === 'storage' && list.length === 0) return '';
        const stateKey = stateKeys[catId];
        const selected = s[stateKey];
        const isOptional = OPTIONAL_CATEGORIES.indexOf(catId) !== -1;

        let options = list.map(function (c) {
            const unitNow = resolveComponentCost(state.get(), c);
            const inHouse = unitNow < getMarketPrice(state.get(), c);
            return '<button class="wiz-option ' + (selected === c.id ? 'selected' : '') + '" data-wiz-pick="' + stateKey + ':' + c.id + '">' +
                '<div class="wiz-opt-name">' + escapeHtml(c.name) + '</div>' +
                '<div class="wiz-opt-meta">' + _perUnit(unitNow) + (inHouse ? ' · <span class="wiz-opt-tag">' + escapeHtml(_tf('wiz.step2.in_house', 'Internal')) + '</span>' : '') + (_statTag(c) ? ' · <span class="wiz-opt-tag">' + escapeHtml(_statTag(c)) + '</span>' : '') + '</div>' +
                '</button>';
        }).join('');

        if (isOptional) {
            const noneLabel = catId === 'camera' ? t('wiz.step2.no_camera') : catId === 'ram' ? _tf('wiz.step2.no_ram', 'RAM Standar') : catId === 'storage' ? _tf('wiz.step2.no_storage', 'Tanpa kartu memori') : t('wiz.step2.no_item', { name: _catName(cat) });
            const noneMeta = catId === 'camera' ? t('wiz.step2.no_camera_hint') : catId === 'ram' ? _tf('wiz.step2.no_ram_hint', 'Memori bawaan chip, tanpa biaya tambahan') : catId === 'storage' ? _tf('wiz.step2.no_storage_hint', 'Memori internal dasar 4 MB') : t('wiz.step2.optional');
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

// ============================================================
// FITUR PONSEL (features.data.js) — modul tambahan di atas komponen.
// Penyimpanan tetap lewat komponen 'storage' (langkah 2); tier ft_stor_* disembunyikan agar tidak dihitung ganda.
// ============================================================
function _featName(f) { return getFeatureName(f, _isEn() ? 'en' : 'id'); }
function _featDesc(f) { return getFeatureDescription(f, _isEn() ? 'en' : 'id'); }
function _pickedCompleted() {
    let done = [];
    try { done = state.get().research.completed || []; } catch (e) {}
    return done;
}

// Daftar fitur yang tampil: bisa dipilih, atau terkunci hanya karena belum riset.
function _visibleFeatures() {
    const year = DesignEraService.getCurrentYear();
    const done = _pickedCompleted();
    return FEATURES.filter(function (f) {
        if (f.storageGB) return false;
        if (year < f.minYear) return false;
        if (f.maxYear && year > f.maxYear) return false;
        return true;
    }).map(function (f) {
        return { f: f, ok: isFeatureSelectable(f, year, done) };
    });
}

// Buang pilihan yang sudah tidak valid (kedaluwarsa/belum riset/bentrok) supaya wizard tidak crash.
function _pruneFeatures(s) {
    const year = DesignEraService.getCurrentYear();
    const done = _pickedCompleted();
    const seenExcl = {};
    s.featureIds = (Array.isArray(s.featureIds) ? s.featureIds : []).filter(function (id) {
        const f = getFeatureById(id);
        if (!f || f.storageGB || !isFeatureSelectable(f, year, done)) return false;
        if (f.exclusiveGroup) {
            if (seenExcl[f.exclusiveGroup]) return false;
            seenExcl[f.exclusiveGroup] = true;
        }
        return true;
    });
}

function _toggleFeature(id) {
    const s = _wizardState;
    const f = getFeatureById(id);
    if (!s || !f) return;
    const year = DesignEraService.getCurrentYear();
    if (!isFeatureSelectable(f, year, _pickedCompleted())) return;
    const cur = (s.featureIds || []).slice();
    const at = cur.indexOf(id);
    if (at >= 0) {
        cur.splice(at, 1);
        s.featureIds = cur;
    } else {
        const next = f.exclusiveGroup ? cur.filter(function (x) {
            const o = getFeatureById(x);
            return !(o && o.exclusiveGroup === f.exclusiveGroup);
        }) : cur;
        next.push(id);
        s.featureIds = next;
    }
    _render();
}

// Isi otomatis: fitur termurah untuk tiap standar pasar yang berlaku + syarat regulasi.
function _autoFeatureIds() {
    const year = DesignEraService.getCurrentYear();
    const done = _pickedCompleted();
    const chosen = [];
    const usedExcl = {};
    function pickFrom(ids) {
        if (ids.some(function (id) { return chosen.indexOf(id) >= 0; })) return;
        const opts = ids.map(getFeatureById).filter(function (f) {
            return f && !f.storageGB && isFeatureSelectable(f, year, done) && !(f.exclusiveGroup && usedExcl[f.exclusiveGroup]);
        }).sort(function (a, b) { return a.costPerUnit - b.costPerUnit; });
        if (!opts.length) return;
        chosen.push(opts[0].id);
        if (opts[0].exclusiveGroup) usedExcl[opts[0].exclusiveGroup] = true;
    }
    EXPECTATIONS.forEach(function (e) { if (year >= e.year) pickFrom(e.anyOf); });
    REGULATIONS.forEach(function (r) { if (year >= r.fromYear) pickFrom(r.requiresAnyOf); });
    return chosen;
}

function _featureSectionHtml(s) {
    const rows = _visibleFeatures();
    if (!rows.length) return '';
    const sel = s.featureIds || [];
    const groups = FEATURE_GROUPS.map(function (g) {
        const items = rows.filter(function (r) { return r.f.group === g.id; });
        if (!items.length) return '';
        const gname = _isEn() ? (g.nameEn || g.name) : g.name;
        return '<div class="wiz-cat">' +
            '<div class="wiz-cat-title" style="text-transform:none;">' + escapeHtml(gname) + '</div>' +
            '<div class="wz-feat-grid">' + items.map(function (r) {
                const f = r.f;
                const on = sel.indexOf(f.id) >= 0;
                let sub;
                if (r.ok) {
                    sub = _perUnit(f.costPerUnit);
                } else {
                    const need = nodeNameById(f.requiresResearch, f.requiresResearch);
                    sub = _tf('wiz.feat.locked', _pick('Butuh riset: {n}', 'Research needed: {n}'), { n: need });
                }
                return '<button type="button" class="wz-feat ' + (on ? 'selected ' : '') + (r.ok ? '' : 'locked') + '"' +
                    (r.ok ? ' data-wiz-feature="' + f.id + '"' : ' disabled aria-disabled="true"') +
                    ' title="' + escapeHtml(_featDesc(f)) + '">' +
                    '<b>' + escapeHtml(_featName(f)) + '</b>' +
                    '<small>' + escapeHtml(sub) + '</small></button>';
            }).join('') + '</div></div>';
    }).join('');
    const title = _tf('wiz.feat.title', _pick('Fitur Tambahan', 'Extra Features'));
    const hint = _tf('wiz.feat.hint', _pick(
        'Fitur standar yang tidak ada bikin permintaan turun. Buka fitur baru lewat tab Riset > Fitur.',
        'Missing standard features reduce demand. Unlock more in Research > Features.'));
    return '<div class="wiz-cat">' +
        '<div class="wiz-cat-title" style="text-transform:none;">' + renderIcon('layers', 14, 'style="vertical-align:middle;margin-right:5px;"') + escapeHtml(title) + '</div>' +
        '<div class="wz-feat-hint">' + escapeHtml(hint) + '</div>' + groups + '</div>';
}

// Ringkasan efek fitur untuk pratinjau (sumber sama dengan permintaan nyata: ProductSystem.getFeatureAnalysisFor).
function _featureFxHtml(s) {
    const ps = window.__game && window.__game.products;
    if (!ps || !ps.getFeatureAnalysisFor) return '';
    const a = ps.getFeatureAnalysisFor(s);
    const en = _isEn();
    const pct = Math.round((a.factor - 1) * 1000) / 10;
    const lines = [];
    a.penalties.slice().sort(function (x, y) { return y.value - x.value; }).slice(0, 4).forEach(function (p) {
        lines.push('<div class="neg">− ' + escapeHtml(en ? (p.labelEn || p.label) : p.label) + '</div>');
    });
    a.regulations.forEach(function (r) {
        lines.push('<div class="neg">− ' + escapeHtml(en ? (r.labelEn || r.label) : r.label) + '</div>');
    });
    a.bonuses.slice().sort(function (x, y) { return y.value - x.value; }).slice(0, 3).forEach(function (b) {
        lines.push('<div class="pos">+ ' + escapeHtml(en ? (b.nameEn || b.name) : b.name) + '</div>');
    });
    const row = '<div class="preview-row"><span>' + escapeHtml(_tf('wiz.feat.demand', _pick('Efek fitur ke permintaan', 'Feature effect on demand'))) + '</span>' +
        '<b style="color:' + (pct >= 0 ? 'var(--success)' : 'var(--warn)') + ';">' + (pct >= 0 ? '+' : '') + pct + '%</b></div>';
    return row + (lines.length ? '<div class="wz-feat-fx">' + lines.join('') + '</div>' : '');
}


let _osMenuOpen = false;

function _step3(s) {
    const osOptions = (window.__game && window.__game.os && window.__game.os.getOsOptionsForPhone)
        ? window.__game.os.getOsOptionsForPhone()
        : [];
    const bodies = filterBodiesByEra();
    const colors = filterBodyColorsByEra();
    _pruneFeatures(s);

    if (colors.length && !colors.some(function (c) { return c.id === s.bodyColorId; })) {
        s.bodyColorId = colors[0].id;
    }

    return `
        <div class="wz-scroll">
            <div class="wiz-cat">
                <div class="wiz-cat-title" style="text-transform:none;">${renderIcon('disc', 14, 'style="vertical-align:middle;margin-right:5px;"')}${t('wiz.step3.os_label')}</div>
                ${(function () {
                    if (!osOptions.length) return '<div class="wiz-empty">' + t('wiz.step3.os_empty') + '</div>';
                    var cur = osOptions.filter(function (o) { return o.id === s.osOptionId; })[0] || osOptions[0];
                    var curMeta = cur.source === 'license' ? _perUnit(cur.costPerUnit) : t('wiz.step3.os_free');
                    var head = '<button class="wiz-os-toggle ' + (_osMenuOpen ? 'open' : '') + '" data-wiz-os-toggle aria-expanded="' + _osMenuOpen + '">' +
                        '<span class="wiz-os-cur"><span class="wiz-opt-name">' + escapeHtml(cur.label) + '</span>' +
                        '<span class="wiz-opt-meta">' + curMeta + '</span></span>' +
                        '<span class="wiz-os-caret">▾</span></button>';
                    if (!_osMenuOpen) return head;
                    return head + '<div class="wiz-options wiz-options-col wiz-os-menu">' + osOptions.map(function (o) {
                        var meta = o.source === 'license' ? _perUnit(o.costPerUnit) : t('wiz.step3.os_free');
                        return '<button class="wiz-option ' + (s.osOptionId === o.id ? 'selected' : '') + '" data-wiz-pick="osOptionId:' + o.id + '">' +
                            '<div class="wiz-opt-name">' + escapeHtml(o.label) + '</div>' +
                            '<div class="wiz-opt-meta">' + meta + '</div>' +
                            '</button>';
                    }).join('') + '</div>';
                })()}
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
            ${_featureSectionHtml(s)}
        </div>
        <div class="wiz-nav">
            <button class="btn-secondary" data-wiz-back style="flex:1;">${t('wiz.step3.back')}</button>
            <button class="btn-primary" data-wiz-next style="flex:2;">${t('wiz.step3.next')}</button>
        </div>
    `;
}

// ============================================================
// RILIS SERI: Basic / Pro / Pro Max (langkah 4)
// Satu desain dirilis sebagai seri 1–3 varian. Nama tiap varian bebas.
// ============================================================
const TIER_ORDER = ['basic', 'pro', 'promax'];
const TIER_LABEL = { basic: 'Basic', pro: 'Pro', promax: 'Pro Max' };

// Bagian yang bisa dibedakan per varian: kecanggihan (komponen) dan desain (bodi, warna).
const TIER_PARTS = [
    { key: 'chipId', cat: 'chip', label: ['Chip', 'Chip'] },
    { key: 'displayId', cat: 'display', label: ['Layar', 'Display'] },
    { key: 'cameraId', cat: 'camera', label: ['Kamera', 'Camera'] },
    { key: 'batteryId', cat: 'battery', label: ['Baterai', 'Battery'] },
    { key: 'bodyId', cat: 'body', label: ['Bodi', 'Body'] },
    { key: 'bodyColorId', cat: 'color', label: ['Warna', 'Color'] }
];

// Rencana tiap varian. Komponen, nama, dan harga yang belum diedit pemain mengikuti langkah 1–3.
function _ensureTierPlans(s) {
    if (!s.tierPlans) {
        s.tierPlans = {};
        TIER_ORDER.forEach(function (id) {
            s.tierPlans[id] = {
                on: true, name: '', nameEdited: false,
                price: 0, priceManuallyEdited: false,
                productionQty: s.productionQty || 5000,
                partsEdited: false
            };
        });
    }
    const tp = s.tierPlans;
    tp.basic.on = true; // Basic wajib
    TIER_ORDER.forEach(function (id) {
        const p = tp[id];
        if (!p.partsEdited) TIER_PARTS.forEach(function (part) { p[part.key] = s[part.key]; });
    });
    TIER_ORDER.forEach(function (id) {
        const p = tp[id];
        if (!p.nameEdited) p.name = _autoTierName(s, id);
        if (!p.priceManuallyEdited) p.price = _getSuggestedPrices(_tierCfg(s, id)).balanced;
    });
    return tp;
}

function _autoTierName(s, id) {
    const base = (s.name || '').trim() || 'Model';
    if (id === 'pro') return base + ' Pro';
    if (id === 'promax') return base + ' Pro Max';
    return base;
}

function _planParts(p) {
    const o = {};
    if (!p) return o;
    TIER_PARTS.forEach(function (part) { o[part.key] = p[part.key]; });
    return o;
}

// Konfigurasi satu varian: langkah 1–3 + komponen & desain milik varian itu.
function _tierCfg(s, id) {
    const tp = s.tierPlans && s.tierPlans[id];
    return Object.assign({}, s, { tier: id }, _planParts(tp));
}

// Konfigurasi dasar yang dipakai bersama semua varian (fitur, OS, bentuk, RAM, penyimpanan, jaringan).
function _baseConfig(s) {
    return {
        formFactorId: s.formFactorId,
        displayId: s.displayId,
        cameraId: (s.cameraId && s.cameraId !== 'none') ? s.cameraId : null,
        ramId: (s.ramId && s.ramId !== 'none') ? s.ramId : null,
        storageId: (s.storageId && s.storageId !== 'none') ? s.storageId : null,
        batteryId: s.batteryId,
        chipId: s.chipId,
        networkId: s.networkId,
        bodyId: s.bodyId,
        bodyColorId: s.bodyColorId,
        osOptionId: s.osOptionId,
        featureIds: (s.featureIds || []).slice()
    };
}

function _enabledPlans(s) {
    return TIER_ORDER.filter(function (id) { return s.tierPlans[id].on; }).map(function (id) {
        const p = s.tierPlans[id];
        const plan = { tier: id, name: (p.name || '').trim(), price: p.price, productionQty: p.productionQty };
        TIER_PARTS.forEach(function (part) { plan[part.key] = p[part.key]; });
        return plan;
    });
}

function _quoteFamily(s) {
    const ps = window.__game && window.__game.products;
    const plans = _enabledPlans(s);
    if (!ps || !ps.quoteTierFamily || !plans.length) return { total: 0, items: [] };
    try { return ps.quoteTierFamily(_baseConfig(s), plans); }
    catch (e) { return { total: 0, items: [] }; }
}

function _affordFamily(total) {
    let cash = 0;
    try { cash = state.get().cash || 0; } catch (e) {}
    let power = cash;
    try { power = WalletService.getBuyingPower(); } catch (e) {}
    return { cost: total, cash: Math.floor(power), ok: WalletService.canAfford(total) };
}

// Masalah pada satu varian (kosong = siap rilis). Varian yang tidak dirilis tidak diperiksa.
function _tierIssues(s, id) {
    const p = s.tierPlans[id];
    if (!p.on) return [];
    const out = [];
    const name = (p.name || '').trim();
    if (!name) {
        out.push(_pick('Nama wajib diisi.', 'Name is required.'));
    } else {
        const key = name.toLowerCase();
        const dupInFamily = TIER_ORDER.some(function (other) {
            return other !== id && s.tierPlans[other].on &&
                (s.tierPlans[other].name || '').trim().toLowerCase() === key;
        });
        if (dupInFamily) out.push(_pick('Nama ini sama dengan varian lain.', 'Same name as another variant.'));
        else if (_isNameDuplicate(name)) out.push(_pick('Nama sudah dipakai produk lain.', 'Name already used by another product.'));
    }
    const lim = _getPriceLimits(_tierCfg(s, id));
    if (!(p.price >= lim.min)) {
        out.push(_tf('wiz.price.too_low', 'Harga terlalu murah! Minimal ${min} (Biaya produksi).', { min: lim.min }));
    } else if (!(p.price <= lim.max)) {
        out.push(_tf('wiz.price.too_high', 'Harga terlalu mahal! Pasar tidak akan membeli di atas ${max}.', { max: lim.max }));
    }
    if (!(p.productionQty >= 100)) out.push(_pick('Jumlah produksi minimal 100 unit.', 'Minimum 100 units.'));
    return out;
}

function _tierInfoHtml(s, id) {
    const ps = window.__game && window.__game.products;
    const cfg = _tierCfg(s, id);
    const stats = _computeStats(cfg) || {};
    let unit = 0;
    try { unit = ps && ps.computeUnitCost ? ps.computeUnitCost(cfg) : 0; } catch (e) {}
    const p = s.tierPlans[id];
    const margin = (p.price || 0) - unit;
    const marginPct = p.price > 0 ? Math.round((margin / p.price) * 100) : 0;
    return `
        <div class="preview-row"><span>${t('wiz.preview.quality')}</span><b>${stats.qualityScore || 0}/100</b></div>
        <div class="preview-row"><span>${_pick('Biaya per unit', 'Cost per unit')}</span><b>$${unit}</b></div>
        <div class="preview-row"><span>${t('wiz.preview.margin')}</span><b style="color:${margin >= 0 ? 'var(--success)' : 'var(--danger)'};">$${margin} (${marginPct}%)</b></div>
        <div class="preview-row"><span>${_pick('Beban perakitan', 'Assembly load')}</span><b>×${getTierAssemblyEffort(id).toFixed(2)}</b></div>`;
}

function _tierPresets(s, id) {
    const sugg = _getSuggestedPrices(_tierCfg(s, id));
    const list = [
        { key: 'budget', label: _tf('wiz.price.budget', 'Ekonomis'), value: sugg.budget },
        { key: 'balanced', label: _tf('wiz.price.market', 'Pasar'), value: sugg.balanced },
        { key: 'premium', label: _tf('wiz.price.premium', 'Premium'), value: sugg.premium }
    ];
    if (id === 'basic') {
        const fai = _getFaiAdvice(s);
        if (fai) list.push({ key: 'fai', label: 'F-AI', value: fai.price });
    }
    return list;
}

function _tierPresetsHtml(s, id) {
    const p = s.tierPlans[id];
    return _tierPresets(s, id).map(function (x) {
        const active = p.price === x.value ? ' active' : '';
        return '<button type="button" class="wz-suggest-btn wz-tier-preset' + active + '" data-wz-tier-suggest="' + id + ':' + x.key + '">' +
            '<b>$' + x.value + '</b><span>' + escapeHtml(x.label) + '</span></button>';
    }).join('');
}

function _tierThumbHtml(s, id) {
    try {
        return renderPhoneMockup(_tierCfg(s, id), { size: 96, view: 'front', isStatic: true, showBrand: false, packCaption: false });
    } catch (e) { return ''; }
}

function _partOptionList(part) {
    if (part.cat === 'body') return filterBodiesByEra();
    if (part.cat === 'color') return filterBodyColorsByEra();
    return filterComponentsByEra(part.cat);
}

function _partSelectHtml(id, part, selected, dis) {
    const list = _partOptionList(part);
    const isColor = part.cat === 'color';
    const opts = list.map(function (c) {
        return '<option value="' + escapeHtml(c.id) + '"' + (c.id === selected ? ' selected' : '') + '>' +
            escapeHtml(isColor ? _colorName(c) : c.name) + '</option>';
    });
    // Pilihan lama yang sudah tidak ada di daftar (mis. ganti era) tetap ditampilkan agar tidak salah tampil.
    if (selected && selected !== 'none' && !list.some(function (c) { return c.id === selected; })) {
        const cur = isColor ? getBodyColorById(selected) : getComponentById(selected);
        if (cur) opts.unshift('<option value="' + escapeHtml(cur.id) + '" selected>' + escapeHtml(isColor ? _colorName(cur) : cur.name) + '</option>');
    }
    if (part.cat === 'camera') {
        opts.unshift('<option value="none"' + (!selected || selected === 'none' ? ' selected' : '') + '>' + escapeHtml(t('wiz.step2.no_camera')) + '</option>');
    }
    return '<label class="wz-tier-part"><span>' + escapeHtml(_pick(part.label[0], part.label[1])) + '</span>' +
        '<select class="field-input" data-wz-tier-part="' + id + '" data-part="' + part.key + '"' + dis + '>' + opts.join('') + '</select></label>';
}

function _tierPanelHtml(s, id) {
    const p = s.tierPlans[id];
    const dis = p.on ? '' : ' disabled';
    const head = id === 'basic'
        ? '<span class="wz-tier-req">' + _pick('Wajib', 'Required') + '</span>'
        : '<label class="wz-tier-toggle"><input type="checkbox" data-wz-tier-on="' + id + '"' + (p.on ? ' checked' : '') + ' /> <span>' + _pick('Rilis', 'Release') + '</span></label>';
    const partsHtml = TIER_PARTS.map(function (part) { return _partSelectHtml(id, part, p[part.key], dis); }).join('');
    return `
        <section class="wz-tier wz-tier-${id}${p.on ? '' : ' is-off'}" data-wz-tier="${id}">
            <header class="wz-tier-head">
                <span class="wz-tier-badge">${escapeHtml(TIER_LABEL[id])}</span>
                ${head}
            </header>
            <div class="wz-tier-thumb" data-wz-tier-thumb="${id}">${_tierThumbHtml(s, id)}</div>
            <label class="field-label" style="margin:0;">${_pick('Nama model', 'Model name')}</label>
            <div class="wz-tier-name-row">
                <input class="field-input" data-wz-tier-name="${id}" maxlength="24" autocomplete="off" value="${escapeHtml(p.name)}"${dis} />
                <button type="button" class="wiz-name-dice" data-wz-tier-reroll="${id}" title="${escapeHtml(_pick('Acak nama', 'Random name'))}"${dis}>🎲</button>
            </div>
            <div class="wz-tier-warn" data-wz-tier-warn="${id}"></div>
            <div class="wz-tier-info" data-wz-tier-info="${id}">${_tierInfoHtml(s, id)}</div>
            <details class="wz-tier-parts">
                <summary>${_pick('Komponen & desain', 'Components & design')}</summary>
                <div class="wz-tier-parts-grid">${partsHtml}</div>
            </details>
            <label class="field-label" style="margin:0;">${t('wiz.step4.price_label')}</label>
            <input class="field-input" data-wz-tier-price="${id}" type="number" value="${p.price}"${dis} />
            <div class="wz-tier-presets" data-wz-tier-presets="${id}">${_tierPresetsHtml(s, id)}</div>
            <label class="field-label" style="margin:0;">${t('wiz.step4.qty_label')}</label>
            <input class="field-input" data-wz-tier-qty="${id}" type="number" min="100" step="100" value="${p.productionQty}"${dis} />
        </section>`;
}

function _familySummaryHtml(s) {
    const q = _quoteFamily(s);
    if (!q.items.length) {
        return '<div style="font-size:12px;color:var(--warn);">' +
            escapeHtml(_pick('Pilih minimal satu varian untuk dirilis.', 'Pick at least one variant to release.')) + '</div>';
    }
    const afford = _affordFamily(q.total);
    const rows = q.items.map(function (it) {
        const label = TIER_LABEL[it.tier] || it.tier;
        return '<div class="preview-row"><span>' + escapeHtml(it.cfg.name || label) + ' · ' + escapeHtml(label) + '</span>' +
            '<b>' + it.cfg.productionQty.toLocaleString('en-US') + ' unit · ' + _fmtUsd(it.cost) + '</b></div>';
    }).join('');
    const total = '<div class="preview-row"><span>' + escapeHtml(_pick('Total desain seri (sekali bayar)', 'Family design total (paid once)')) +
        '</span><b>' + _fmtUsd(q.total) + '</b></div>';
    const warn = afford.ok ? '' :
        '<div style="margin-top:8px;font-size:11px;color:var(--warn);">⚠ ' + escapeHtml(_tf('wiz.cash.short_detail',
            _pick('Dana tidak cukup: butuh {need}, tersedia {have}. Kurangi jumlah produksi.', 'Not enough cash: need {need}, you have {have}. Lower the production quantity.'),
            { need: _fmtUsd(afford.cost), have: _fmtUsd(afford.cash) })) + '</div>';
    return rows + total + warn;
}

function _step4(s) {
    _ensureTierPlans(s);
    return `
        <div class="wz-tier-note">${_pick(
            'Satu desain, sampai tiga model. Tiap varian bisa beda chip, layar, kamera, baterai, bodi, dan warna. Nama bebas. Pro dan Pro Max opsional.',
            'One design, up to three models. Each variant can differ in chip, display, camera, battery, body, and color. Names are free. Pro and Pro Max are optional.')}</div>
        <div class="wz-tiers">${TIER_ORDER.map(function (id) { return _tierPanelHtml(s, id); }).join('')}</div>
        <div class="card-title">${t('wiz.step4.summary')}</div>
        <div data-wiz-preview>${_familySummaryHtml(s)}</div>
        <div class="wiz-nav">
            <button class="btn-secondary" data-wiz-back style="flex:1;">${t('wiz.step4.back')}</button>
            <button class="btn-primary" data-wiz-confirm style="flex:2;">${t('wiz.step4.release')}</button>
        </div>
    `;
}

// Perbarui teks panel tanpa merender ulang input (agar fokus pengetikan tidak hilang).
function _refreshTiers(root) {
    const s = _wizardState;
    if (!s || !s.tierPlans || !root) return;
    TIER_ORDER.forEach(function (id) {
        const p = s.tierPlans[id];
        const sec = root.querySelector('[data-wz-tier="' + id + '"]');
        if (!sec) return;
        sec.classList.toggle('is-off', !p.on);
        const warn = root.querySelector('[data-wz-tier-warn="' + id + '"]');
        if (warn) {
            const issues = _tierIssues(s, id);
            warn.innerHTML = issues.map(function (x) { return '⚠ ' + escapeHtml(x); }).join('<br>');
            warn.style.display = issues.length ? 'block' : 'none';
        }
        const info = root.querySelector('[data-wz-tier-info="' + id + '"]');
        if (info) info.innerHTML = _tierInfoHtml(s, id);
        const presets = root.querySelector('[data-wz-tier-presets="' + id + '"]');
        if (presets) presets.innerHTML = _tierPresetsHtml(s, id);
    });
    const sum = root.querySelector('[data-wiz-preview]');
    if (sum) sum.innerHTML = _familySummaryHtml(s);
    _updateConfirmButtonState();
}

function _setTierEnabled(root, id, on) {
    ['data-wz-tier-name', 'data-wz-tier-price', 'data-wz-tier-qty', 'data-wz-tier-reroll', 'data-wz-tier-part'].forEach(function (attr) {
        root.querySelectorAll('[' + attr + '="' + id + '"]').forEach(function (el) { el.disabled = !on; });
    });
}

// Harga ikut saran pasar selama pemain belum mengisi harga sendiri.
function _recalcTierPrice(root, s, id) {
    const p = s.tierPlans[id];
    if (p.priceManuallyEdited) return;
    p.price = _getSuggestedPrices(_tierCfg(s, id)).balanced;
    const inp = root.querySelector('[data-wz-tier-price="' + id + '"]');
    if (inp) inp.value = p.price;
}

function _bindTierPanels(root) {
    const s = _wizardState;
    if (!s || !s.tierPlans) return;

    root.querySelectorAll('[data-wz-tier-on]').forEach(function (cb) {
        cb.addEventListener('change', function () {
            const id = cb.dataset.wzTierOn;
            s.tierPlans[id].on = cb.checked;
            _setTierEnabled(root, id, cb.checked);
            _refreshTiers(root);
        });
    });
    root.querySelectorAll('[data-wz-tier-part]').forEach(function (sel) {
        sel.addEventListener('change', function () {
            const id = sel.dataset.wzTierPart;
            const part = TIER_PARTS.find(function (x) { return x.key === sel.dataset.part; });
            if (!part) return;
            const p = s.tierPlans[id];
            p[part.key] = sel.value;
            p.partsEdited = true;
            _recalcTierPrice(root, s, id);
            const thumb = root.querySelector('[data-wz-tier-thumb="' + id + '"]');
            if (thumb) thumb.innerHTML = _tierThumbHtml(s, id);
            _refreshTiers(root);
        });
    });
    root.querySelectorAll('[data-wz-tier-name]').forEach(function (inp) {
        inp.addEventListener('input', function () {
            const p = s.tierPlans[inp.dataset.wzTierName];
            p.name = inp.value;
            p.nameEdited = true;
            _refreshTiers(root);
        });
    });
    root.querySelectorAll('[data-wz-tier-price]').forEach(function (inp) {
        inp.addEventListener('input', function () {
            const p = s.tierPlans[inp.dataset.wzTierPrice];
            p.price = parseInt(inp.value, 10) || 0;
            p.priceManuallyEdited = true;
            _refreshTiers(root);
        });
    });
    root.querySelectorAll('[data-wz-tier-qty]').forEach(function (inp) {
        inp.addEventListener('input', function () {
            const p = s.tierPlans[inp.dataset.wzTierQty];
            p.productionQty = parseInt(inp.value, 10) || 0;
            _refreshTiers(root);
        });
    });
    root.querySelectorAll('[data-wz-tier-reroll]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const id = btn.dataset.wzTierReroll;
            const p = s.tierPlans[id];
            const rawCompany = (state.get().companyName) || 'Star';
            const taken = TIER_ORDER.map(function (x) { return s.tierPlans[x].name; });
            p.name = _generateBrandedName(rawCompany, DesignEraService.getCurrentYear(), s.formFactorId, taken);
            p.nameEdited = true;
            const inp = root.querySelector('[data-wz-tier-name="' + id + '"]');
            if (inp) inp.value = p.name;
            _refreshTiers(root);
        });
    });
    // Tombol harga cepat: delegasi di kotak presets, karena isinya dirender ulang saat refresh.
    root.querySelectorAll('[data-wz-tier-presets]').forEach(function (box) {
        box.addEventListener('click', function (e) {
            const btn = e.target.closest('[data-wz-tier-suggest]');
            if (!btn || !box.contains(btn)) return;
            const parts = btn.dataset.wzTierSuggest.split(':');
            const id = parts[0], key = parts[1];
            const hit = _tierPresets(s, id).find(function (x) { return x.key === key; });
            if (!hit) return;
            const p = s.tierPlans[id];
            p.price = hit.value;
            p.priceManuallyEdited = true;
            const inp = root.querySelector('[data-wz-tier-price="' + id + '"]');
            if (inp) inp.value = p.price;
            _refreshTiers(root);
        });
    });

    _refreshTiers(root);
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

    if (_wizardState && _wizardState.step === 4) _refreshTiers(root);
}

function _computeStats(s) {
    const ps = window.__game && window.__game.products;
    if (ps && ps.computeStats) {
        try { return ps.computeStats(s); } catch (e) {}
    }
    const stat = { display: 0, camera: 0, battery: 0, performance: 0, connectivity: 0, quality: 0, design: 0, usability: 0 };
    const map = {
        displayId: 'display', cameraId: 'camera', batteryId: 'battery',
        chipId: 'performance', ramId: 'performance', storageId: 'usability', networkId: 'connectivity', bodyId: 'quality',
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
    if (s.step === 4 && s.tierPlans && !_affordFamily(_quoteFamily(s)).ok) warnings.push(_tf('wiz.cash.short_batch', _pick('Dana tidak cukup untuk batch ini', 'Not enough cash for this batch')));

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
        { labelKey: 'wiz.detail.spec_storage', id: (s.storageId && s.storageId !== 'none') ? s.storageId : null },
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
