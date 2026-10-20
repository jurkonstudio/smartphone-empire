import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/panels/ChipDesignerPanel.js
// v2027.4a — Tambah tombol CTA "Buka Riset Chip" saat arsitektur kosong.
// v2027.13c — i18n.
// v2027.13d — i18n penuh (Fase 2): label preview, tier/yield/biaya, kategori fitur & budget via key,
//             ikon kategori dirender sebagai ikon, wizard render ulang saat 'lang:changed'.
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
import { bus } from '../../core/EventBus.js';
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
import { renderIcon } from '../icons/FeatureIcons.js';
import { t, LanguageService } from '../../core/LanguageService.js';

let _wiz = null;

// _tf(key, fallbackId, fallbackEn, vars): pakai kamus jika key ada,
// kalau belum (sebelum Fase 3) pakai fallback sesuai bahasa aktif.
function _tf(key, fbId, fbEn, vars) {
    var v = t(key, vars);
    if (v && v !== key) return v;
    var en = false;
    try { en = LanguageService.getLang() === 'en'; } catch (e) {}
    var s = (en && fbEn !== undefined) ? fbEn : fbId;
    if (vars) {
        s = String(s).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
    }
    return s;
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

function chipSystem() {
    return window.__game && window.__game.chips ? window.__game.chips : null;
}

// ------------------------------------------------------------
// Terjemahan data (kategori fitur & budget tier).
// Jika key belum ada, pakai teks dari data (bahasa Indonesia).
// ------------------------------------------------------------
var CAT_FALLBACK_EN = {
    graphics: 'Graphics', memory: 'Memory', power: 'Power', security: 'Security',
    ai: 'Intelligence', connectivity: 'Connectivity', special: 'Special'
};
var BUDGET_FALLBACK_EN = {
    low:    { label: 'Low Budget',    desc: 'Cheap but low yield' },
    normal: { label: 'Normal Budget', desc: 'Balanced' },
    high:   { label: 'High Budget',   desc: 'High yield' },
    ultra:  { label: 'Ultra Budget',  desc: 'Max yield, expensive' }
};

function _catName(cat) {
    return _tf('chip.cat.' + cat.id, cat.name, CAT_FALLBACK_EN[cat.id] || cat.name);
}
function _catIcon(cat) {
    try {
        var svg = renderIcon(cat.icon, 14);
        if (typeof svg === 'string' && svg) return svg;
    } catch (e) {}
    return '';
}
function _budgetLabel(b) {
    var fb = BUDGET_FALLBACK_EN[b.id];
    return _tf('chip.budget.' + b.id + '.label', b.label, fb ? fb.label : b.label);
}
function _budgetDesc(b) {
    var fb = BUDGET_FALLBACK_EN[b.id];
    return _tf('chip.budget.' + b.id + '.desc', b.description, fb ? fb.desc : b.description);
}

// ============================================================
// OPEN
// ============================================================
export function openChipDesigner() {
    if (state.get().chips && state.get().chips.designing) {
        ToastService.warning(t('chip.design.designing'));
        return;
    }

    const s = defaultState();
    const archs = chipSystem() ? chipSystem().getAvailableArchitectures() : [];
    const nodes = chipSystem() ? chipSystem().getAvailableNodes() : [];

    if (archs.length) s.architectureId = archs[archs.length - 1].id;
    if (nodes.length) s.nodeId = nodes[nodes.length - 1].id;

    _wiz = s;
    _render();
}

// Ganti bahasa: render ulang langkah aktif (state wizard & nama yang diketik dipertahankan).
// Satu listener global — tidak bocor karena hanya terdaftar sekali saat modul dimuat.
bus.on('lang:changed', function () {
    if (!_wiz) return;
    if (!(Modal.isOpen && Modal.isOpen('chip-designer'))) return;
    _render();
});

// ===========================
