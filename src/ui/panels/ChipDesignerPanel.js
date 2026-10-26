import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/panels/ChipDesignerPanel.js
// v2027.4d — layout ringkas untuk HP: mockup & metrik sejajar, stepper judul aktif saja,
// radar pindah ke langkah 4, footer sticky.
// v2027.4c — FIX: file sebelumnya terpotong (_render & handler hilang → GLOBAL ERROR
// "_render is not defined"). Wizard dilengkapi (4 langkah, live mockup + radar, validasi,
// konfirmasi via ChipSystem.startDesign). Pola sama dengan DesignWizard.
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

// Ganti bahasa: render ulang langkah aktif (state wizard & nama yang diketik dipertahankan).
// Satu listener global — tidak bocor karena hanya terdaftar sekali saat modul dimuat.
bus.on('lang:changed', function () {
    if (!_wiz) return;
    if (!(Modal.isOpen && Modal.isOpen('chip-designer'))) return;
    _render();
});

// ============================================================
// RENDER — bagian yang sebelumnya hilang (penyebab "_render is not defined").
// Pola mengikuti DesignWizard yang sudah berfungsi: satu kartu modal,
// re-render innerHTML, event delegation di kartu (dipasang sekali).
// ============================================================
const MODAL_ID = 'chip-designer';
const CACHE_OPTIONS = [64, 256, 1024, 4096, 16384];
const CLOCK_MIN = 0.2;
const CLOCK_MAX = 5.0;
const STEP_FB = {
    1: ['Nama & Arsitektur', 'Name & Architecture'],
    2: ['Spesifikasi', 'Specifications'],
    3: ['Fitur & Anggaran', 'Features & Budget'],
    4: ['Preview & Rilis', 'Preview & Release']
};

function _cacheLabel(kb) {
    return kb >= 1024 ? (kb / 1024) + ' MB' : kb + ' KB';
}

function _money(n) {
    return '$' + Math.round(n || 0).toLocaleString('en-US');
}

function _year() {
    try { return state.get().time.currentYear; } catch (e) { return ''; }
}

function _cfg(s) {
    return {
        name: s.name,
        architectureId: s.architectureId,
        nodeId: s.nodeId,
        cores: s.cores,
        clockGHz: s.clockGHz,
        cacheKB: s.cacheKB,
        features: s.features.slice(),
        budgetId: s.budgetId
    };
}

function _archMax(s) {
    const a = getArchitectureById(s.architectureId);
    return a ? a.coresMax : 8;
}

// Pastikan jumlah core tidak melebihi batas arsitektur terpilih.
function _clampCores(s) {
    s.cores = Math.max(1, Math.min(_archMax(s), s.cores || 1));
}

// Semua metrik langsung dari ChipSystem (satu sumber kebenaran dengan startDesign).
function _metrics(s) {
    const cs = chipSystem();
    if (!cs) return null;
    const cfg = _cfg(s);
    const stats = cs.computeChipStats(cfg);
    if (!stats) return null;
    const yieldRate = cs.computeYieldRate(cfg);
    return {
        stats: Object.assign({}, stats, { yieldRate: yieldRate }),
        yieldRate: yieldRate,
        designCost: cs.computeDesignCost(cfg),
        durationDays: cs.computeDesignDuration(cfg)
    };
}

function _validate(s, step) {
    if (step === 1) {
        const name = (s.name || '').trim();
        if (!name) return _tf('chip.wiz.err_name', 'Isi nama chip.', 'Enter a chip name.');
        if (name.length > 24) return _tf('chip.wiz.err_name_long', 'Nama maksimal 24 karakter.', 'Name max 24 characters.');
        if (!s.architectureId) return _tf('chip.wiz.err_arch', 'Pilih arsitektur.', 'Pick an architecture.');
    }
    if (step === 2 && !s.nodeId) {
        return _tf('chip.wiz.err_node', 'Pilih proses node.', 'Pick a process node.');
    }
    return null;
}

// ------------------------------------------------------------
// Bagian langkah
// ------------------------------------------------------------
function _bodyIdentity(s, cs) {
    const archs = cs ? cs.getAvailableArchitectures() : [];
    const ph = _tf('chip.wiz.name_ph', 'Mis. X1 Nano, Titan A1', 'E.g. X1 Nano, Titan A1');
    let h = '<div class="cw-label">' + escapeHtml(_tf('chip.wiz.name_label', 'Nama Chip', 'Chip Name')) + '</div>' +
        '<input class="cw-input" data-cw-name maxlength="24" autocomplete="off" placeholder="' + escapeHtml(ph) +
        '" value="' + escapeHtml(s.name) + '">' +
        '<div class="cw-label">' + escapeHtml(_tf('chip.wiz.arch_label', 'Arsitektur', 'Architecture')) + '</div>';
    if (!archs.length) {
        return h + '<div class="fab-warning">' +
            escapeHtml(_tf('chip.wiz.no_arch', 'Belum ada arsitektur. Riset arsitektur chip dulu.', 'No architectures available. Research chip architecture first.')) +
            '</div>';
    }
    h += '<div class="cw-grid">' + archs.map(function (a) {
        const on = s.architectureId === a.id;
        return '<button type="button" class="cw-opt' + (on ? ' on' : '') + '" data-cw-pick="arch:' + a.id +
            '" aria-pressed="' + on + '"><b>' + escapeHtml(a.name) + '</b><span>' +
            escapeHtml(_tf('chip.wiz.tier', 'Tier {t} • Maks {max} core • {year}', 'Tier {t} • Max {max} cores • {year}',
                { t: a.tier, max: a.coresMax, year: _year() })) +
            '</span><small>' + escapeHtml(a.description || '') + '</small></button>';
    }).join('') + '</div>';
    return h;
}

function _bodySpec(s, cs) {
    const nodes = cs ? cs.getAvailableNodes() : [];
    const max = _archMax(s);
    let h = '<div class="cw-label">' + escapeHtml(_tf('chip.wiz.node', 'Node Proses', 'Process Node')) + '</div>' +
        '<div class="cw-grid">' + nodes.map(function (n) {
            const on = s.nodeId === n.id;
            return '<button type="button" class="cw-opt' + (on ? ' on' : '') + '" data-cw-pick="node:' + n.id +
                '" aria-pressed="' + on + '"><b>' + escapeHtml(n.name) + '</b><span>' +
                escapeHtml(_tf('chip.node.perf', 'Perf ×{n} • Yield {y}%', 'Perf ×{n} • Yield {y}%',
                    { n: Number(n.perfBonus).toFixed(2), y: Math.round(n.yieldBase * 100) })) +
                '</span></button>';
        }).join('') + '</div>';

    h += '<div class="cw-label">' + escapeHtml(_tf('chip.wiz.cores', 'Jumlah Core', 'Number of Cores')) +
        ' <b data-cw-cores-val>' + s.cores + '</b> ' +
        escapeHtml(_tf('chip.wiz.cores_max', '(maks {n})', '(max {n})', { n: max })) + '</div>' +
        '<input type="range" class="cw-range" data-cw-cores min="1" max="' + max + '" step="1" value="' + s.cores + '">';

    h += '<div class="cw-label">' + escapeHtml(_tf('chip.wiz.clock', 'Kecepatan Clock (GHz)', 'Clock Speed (GHz)')) +
        ' <b data-cw-clock-val>' + s.clockGHz.toFixed(1) + '</b></div>' +
        '<input type="range" class="cw-range" data-cw-clock min="' + CLOCK_MIN + '" max="' + CLOCK_MAX +
        '" step="0.1" value="' + s.clockGHz + '">';

    h += '<div class="cw-label">' + escapeHtml(_tf('chip.wiz.cache', 'Ukuran Cache', 'Cache Size')) + '</div>' +
        '<div class="cw-chips">' + CACHE_OPTIONS.map(function (kb) {
            const on = s.cacheKB === kb;
            return '<button type="button" class="cw-chip' + (on ? ' on' : '') + '" data-cw-cache="' + kb +
                '" aria-pressed="' + on + '">' + _cacheLabel(kb) + '</button>';
        }).join('') + '</div>';
    return h;
}

function _bodyFeatures(s, cs) {
    const feats = cs ? cs.getAvailableFeatures() : [];
    const budgets = cs ? cs.getBudgetTiers() : [];
    let h = '<div class="cw-label">' + escapeHtml(_tf('chip.wiz.budget', 'Anggaran R&D', 'R&D Budget')) + '</div>' +
        '<div class="cw-grid">' + budgets.map(function (b) {
            const on = s.budgetId === b.id;
            return '<button type="button" class="cw-opt' + (on ? ' on' : '') + '" data-cw-budget="' + b.id +
                '" aria-pressed="' + on + '"><b>' + escapeHtml(_budgetLabel(b)) + '</b><small>' +
                escapeHtml(_budgetDesc(b)) + '</small></button>';
        }).join('') + '</div>';

    h += '<div class="cw-label">' + escapeHtml(_tf('chip.wiz.features', 'Fitur', 'Features')) + ' <span>' +
        escapeHtml(_tf('chip.wiz.features_count', '({n} dipilih)', '({n} selected)', { n: s.features.length })) + '</span></div>';

    FEATURE_CATEGORIES.forEach(function (cat) {
        const list = feats.filter(function (f) { return f.category === cat.id; });
        if (!list.length) return;
        h += '<div class="cw-cat">' + _catIcon(cat) + '<span>' + escapeHtml(_catName(cat)) + '</span></div>' +
            '<div class="cw-chips">' + list.map(function (f) {
                const on = s.features.indexOf(f.id) !== -1;
                return '<button type="button" class="cw-chip' + (on ? ' on' : '') + '" data-cw-feat="' + f.id +
                    '" title="' + escapeHtml(f.description || '') + '" aria-pressed="' + on + '">' +
                    escapeHtml(f.name) + '</button>';
            }).join('') + '</div>';
    });
    return h;
}

function _bodyConfirm(s, cs, m) {
    const arch = getArchitectureById(s.architectureId);
    const node = getChipNodeById(s.nodeId);
    const budget = cs ? cs.getBudgetTiers().find(function (b) { return b.id === s.budgetId; }) : null;
    const rows = [
        [_tf('chip.wiz.name_label', 'Nama Chip', 'Chip Name'), (s.name || '').trim() || '-'],
        [_tf('chip.wiz.arch_label', 'Arsitektur', 'Architecture'), arch ? arch.name : '-'],
        [_tf('chip.wiz.node', 'Node Proses', 'Process Node'), node ? node.name : '-'],
        [_tf('chip.wiz.cores', 'Jumlah Core', 'Number of Cores'), s.cores],
        [_tf('chip.wiz.clock', 'Clock (GHz)', 'Clock (GHz)'), s.clockGHz.toFixed(1)],
        [_tf('chip.wiz.cache', 'Cache', 'Cache'), _cacheLabel(s.cacheKB)],
        [_tf('chip.wiz.features', 'Fitur', 'Features'), s.features.length],
        [_tf('chip.wiz.budget', 'Anggaran R&D', 'R&D Budget'), budget ? _budgetLabel(budget) : '-']
    ];
    if (m) {
        rows.push(
            [_tf('cw.sum.rd_cost', 'Biaya R&D', 'R&D Cost'), _money(m.designCost)],
            [_tf('cw.sum.duration', 'Durasi desain', 'Design time'), _tf('chip.wiz.days', '{n} hari', '{n} days', { n: m.durationDays })],
            [_tf('cw.sum.yield', 'Yield', 'Yield'), Math.round(m.yieldRate * 100) + '%'],
            [_tf('cw.sum.unit', 'Biaya per unit', 'Cost per unit'), _money(m.stats.costPerUnit)]
        );
    }
    let h = '<div class="cw-sum">' + rows.map(function (r) {
        return '<span>' + escapeHtml(String(r[0])) + '</span><b>' + escapeHtml(String(r[1])) + '</b>';
    }).join('') + '</div>' +
        '<div class="cw-radar" data-cw-radar></div>';
    if (!m) {
        h += '<div class="fab-warning">' + escapeHtml(_tf('chip.wiz.err_arch', 'Pilih arsitektur.', 'Pick an architecture.')) + '</div>';
    }
    return h;
}

function _stepBody(s, cs, m) {
    if (s.step === 1) return _bodyIdentity(s, cs);
    if (s.step === 2) return _bodySpec(s, cs);
    if (s.step === 3) return _bodyFeatures(s, cs);
    return _bodyConfirm(s, cs, m);
}

function _liveHtml(m) {
    if (!m) return '';
    return '<div class="cw-cell"><span>' + escapeHtml(_tf('chip.catalog.perf', 'Perf', 'Perf')) + '</span><b>' + m.stats.performance + '</b></div>' +
        '<div class="cw-cell"><span>' + escapeHtml(_tf('chip.catalog.eff', 'Eff', 'Eff')) + '</span><b>' + m.stats.efficiency + '</b></div>' +
        '<div class="cw-cell"><span>Yield</span><b>' + Math.round(m.yieldRate * 100) + '%</b></div>' +
        '<div class="cw-cell"><span>' + escapeHtml(_tf('cw.sum.unit', 'Biaya/unit', 'Cost/unit')) + '</span><b>' + _money(m.stats.costPerUnit) + '</b></div>';
}

function _footer(s) {
    const back = s.step > 1
        ? '<button type="button" class="btn-secondary" data-cw-act="back">' + escapeHtml(_tf('chip.wiz.btn_back', '← Kembali', '← Back')) + '</button>'
        : '';
    const cancel = '<button type="button" class="btn-secondary" data-cw-act="close">' +
        escapeHtml(_tf('chip.wiz.btn_cancel', 'Batal', 'Cancel')) + '</button>';
    const main = s.step < 4
        ? '<button type="button" class="btn-primary" data-cw-act="next">' + escapeHtml(_tf('chip.wiz.btn_next', 'Lanjut →', 'Next →')) + '</button>'
        : '<button type="button" class="btn-primary" data-cw-act="confirm">' + escapeHtml(_tf('chip.wiz.btn_confirm', 'Mulai Desain ✓', 'Start Design ✓')) + '</button>';
    return '<div class="cw-foot">' + cancel + back + main + '</div>';
}

// ------------------------------------------------------------
// Kartu modal & update
// ------------------------------------------------------------
function _currentCard() {
    const root = document.querySelector('[data-modal-id="' + MODAL_ID + '"]');
    return root ? root.querySelector('.modal-card') : null;
}

let _stylesInjected = false;
function _injectStyles() {
    if (_stylesInjected || document.getElementById('cw-styles')) { _stylesInjected = true; return; }
    _stylesInjected = true;
    const css = `
.cw-root .chip-wiz-header{padding:8px 10px;margin-bottom:8px;gap:10px}
.cw-root .cw-hdr-icon{width:34px;height:34px;border-radius:9px}
.cw-root .chip-wiz-title{font-size:13px}
.cw-root .chip-wiz-sub{font-size:10.5px}
.cw-steps{display:flex;gap:4px;list-style:none;padding:0;margin:0 0 8px}
.cw-steps li{flex:1;min-width:0;font-size:10.5px;opacity:.5;text-align:center;padding:5px 2px;border-bottom:2px solid var(--border);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cw-steps li.active{opacity:1;border-color:var(--accent);color:var(--accent);font-weight:700;flex:2.4}
.cw-steps li.done{opacity:.85;border-color:var(--success)}
.cw-steps li:not(.active) .cw-lbl{display:none}
.cw-steps b{margin-right:3px}
.cw-top{display:grid;grid-template-columns:148px 1fr;gap:8px;align-items:center}
.cw-mock{display:flex;justify-content:center;align-items:center;background:linear-gradient(135deg,#0a0a15,#0a1525);border-radius:12px;border:1px solid var(--border);padding:4px;min-height:156px}
.cw-live{display:grid;grid-template-columns:1fr 1fr;gap:6px;min-width:0}
.cw-cell{background:var(--bg-3);border-radius:8px;padding:5px 7px;font-size:10px;color:var(--text-mute)}
.cw-cell b{display:block;font-size:14px;color:var(--text-primary);font-variant-numeric:tabular-nums}
.cw-radar{display:flex;justify-content:center;margin-top:10px}
.cw-body{margin-top:8px}
.cw-label{font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;color:var(--text-mute);margin:9px 0 5px}
.cw-label b{color:var(--text-primary);font-size:12px;letter-spacing:0}
.cw-input{width:100%;padding:10px 12px;background:var(--bg-3);border:1px solid var(--border);border-radius:var(--r);color:inherit;font-size:14px;box-sizing:border-box}
.cw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px}
.cw-opt{text-align:left;background:var(--bg-3);border:1px solid var(--border);border-radius:var(--r);padding:7px 9px;color:inherit;cursor:pointer;display:flex;flex-direction:column;gap:3px}
.cw-opt.on{border-color:var(--accent);background:var(--accent-soft);box-shadow:0 0 0 1px var(--accent) inset}
.cw-opt span{font-size:11px;color:var(--text-mute)}
.cw-opt small{font-size:10.5px;color:var(--text-dim);line-height:1.35}
.cw-range{width:100%}
.cw-chips{display:flex;flex-wrap:wrap;gap:6px}
.cw-chip{padding:5px 9px;border-radius:var(--r-pill);background:var(--bg-3);border:1px solid var(--border);font-size:12px;color:inherit;cursor:pointer}
.cw-chip.on{background:var(--accent-soft);border-color:var(--accent);color:var(--accent)}
.cw-cat{font-size:11px;color:var(--text-mute);margin:10px 0 4px;display:flex;align-items:center;gap:6px}
.cw-foot{position:sticky;bottom:0;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:12px;padding:8px 0 calc(8px + env(safe-area-inset-bottom,0px));background:var(--bg-2,#1c1c1f);z-index:2}
.cw-foot button{flex:1;min-width:0;padding:10px 8px;font-size:13px}
@media (min-width:480px){.cw-foot button{flex:0 0 auto}}
.cw-sum{display:grid;grid-template-columns:1fr auto;gap:6px 12px;font-size:12.5px}
.cw-sum span{color:var(--text-mute)}
.cw-sum b{text-align:right;font-variant-numeric:tabular-nums}
.cw-hdr-icon{width:42px;height:42px;border-radius:10px;background:linear-gradient(135deg,#1a4a8a,#0a2a9a);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(10,42,154,.35);flex-shrink:0}
`;
    const el = document.createElement('style');
    el.id = 'cw-styles';
    el.textContent = css;
    document.head.appendChild(el);
}

// Pastikan kartu modal ada dan terpasang handler delegasi (sekali saja).
function _ensureCard() {
    _injectStyles();
    if (Modal.isOpen && Modal.isOpen(MODAL_ID)) {
        const existing = _currentCard();
        if (existing) return existing;
    }
    Modal.open(MODAL_ID, '<div class="cw-root"></div>', {
        dismissible: false,
        onClose: function () { _wiz = null; }
    });
    const card = _currentCard();
    if (card && !card.dataset.cwBound) {
        card.dataset.cwBound = '1';
        card.addEventListener('click', _onClick);
        card.addEventListener('input', _onInput);
        card.addEventListener('change', _onInput);
    }
    return card;
}

function _setText(sel, txt) {
    const card = _currentCard();
    const el = card && card.querySelector(sel);
    if (el) el.textContent = txt;
}

// Perbarui hanya panel live (mockup, radar, metrik) tanpa me-render ulang input.
function _updateLive(s, m) {
    const card = _currentCard();
    if (!card) return;
    const mock = card.querySelector('[data-cw-mock]');
    if (mock) mock.innerHTML = renderChipMockup(_cfg(s), { size: 148 });
    const radar = card.querySelector('[data-cw-radar]');
    if (radar) radar.innerHTML = (m && m.stats) ? renderChipRadarChart(m.stats, { size: 150 }) : '';
    const live = card.querySelector('[data-cw-metrics]');
    if (live) live.innerHTML = _liveHtml(m);
}

function _render() {
    const s = _wiz;
    if (!s) return;
    const cs = chipSystem();
    const m = _metrics(s);
    const card = _ensureCard();
    if (!card) return;

    const top = card.scrollTop;
    const sameStep = card.dataset.cwStep === String(s.step);

    const stepper = [1, 2, 3, 4].map(function (i) {
        const cls = i === s.step ? 'active' : (i < s.step ? 'done' : '');
        const label = _tf('chip.wiz.step' + i, STEP_FB[i][0], STEP_FB[i][1]);
        return '<li class="' + cls + '"' + (i === s.step ? ' aria-current="step"' : '') + '><b>' +
            (i < s.step ? '✓' : i) + '</b><span class="cw-lbl">' + escapeHtml(label) + '</span></li>';
    }).join('');

    const header =
        '<div class="chip-wiz-header"><div class="cw-hdr-icon">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e6f0ff" stroke-width="1.6">' +
        '<rect x="6" y="6" width="12" height="12" rx="2"/>' +
        '<path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/></svg></div>' +
        '<div><div class="chip-wiz-title">' + escapeHtml(_tf('chip.wiz.title', 'Desainer Chip', 'Chip Designer')) + '</div>' +
        '<div class="chip-wiz-sub">' + escapeHtml(_tf('chip.wiz.sub', 'Rancang silikon Anda sendiri', 'Design your own silicon')) + '</div></div></div>';

    card.innerHTML = '<div class="cw-root">' + header +
        '<ol class="cw-steps">' + stepper + '</ol>' +
        '<div class="cw-top"><div class="cw-mock" data-cw-mock></div>' +
        '<div class="cw-live" data-cw-metrics></div></div>' +
        '<div class="cw-body">' + _stepBody(s, cs, m) + '</div>' +
        _footer(s) + '</div>';

    card.dataset.cwStep = String(s.step);
    card.scrollTop = sameStep ? top : 0;
    _updateLive(s, m);
}

// ------------------------------------------------------------
// Event delegation
// ------------------------------------------------------------
function _act(name) {
    const s = _wiz;
    if (!s) return;

    if (name === 'close') {
        Modal.close(MODAL_ID);
        return;
    }
    if (name === 'back') {
        if (s.step > 1) s.step -= 1;
        _render();
        return;
    }
    if (name === 'next') {
        const err = _validate(s, s.step);
        if (err) { ToastService.warning(err); return; }
        if (s.step < 4) s.step += 1;
        _render();
        return;
    }
    if (name === 'confirm') {
        const cs = chipSystem();
        if (!cs) { ToastService.error(_tf('chip.fab.system_not_ready', 'Sistem belum siap.', 'System not ready.')); return; }
        const err = _validate(s, 1) || _validate(s, 2);
        if (err) { ToastService.warning(err); return; }
        const res = cs.startDesign(_cfg(s));
        if (!res || !res.ok) {
            ToastService.warning((res && res.reason) || _tf('chip.design.designing', 'Gagal memulai desain.', 'Could not start design.'));
            return;
        }
        Modal.close(MODAL_ID);
    }
}

function _onClick(e) {
    const s = _wiz;
    if (!s || !e.target || !e.target.closest) return;
    const el = e.target.closest('[data-cw-act],[data-cw-pick],[data-cw-cache],[data-cw-feat],[data-cw-budget]');
    if (!el) return;

    if (el.hasAttribute('data-cw-act')) { _act(el.getAttribute('data-cw-act')); return; }

    if (el.hasAttribute('data-cw-pick')) {
        const raw = el.getAttribute('data-cw-pick');
        const idx = raw.indexOf(':');
        const kind = raw.slice(0, idx);
        const val = raw.slice(idx + 1);
        if (kind === 'arch') { s.architectureId = val; _clampCores(s); }
        else if (kind === 'node') { s.nodeId = val; }
    } else if (el.hasAttribute('data-cw-cache')) {
        s.cacheKB = parseInt(el.getAttribute('data-cw-cache'), 10) || 256;
    } else if (el.hasAttribute('data-cw-feat')) {
        const fid = el.getAttribute('data-cw-feat');
        const at = s.features.indexOf(fid);
        if (at === -1) s.features.push(fid); else s.features.splice(at, 1);
    } else if (el.hasAttribute('data-cw-budget')) {
        s.budgetId = el.getAttribute('data-cw-budget');
    }
    _render();
}

// Input langsung memperbarui state + panel live (tanpa me-render ulang agar fokus tidak hilang).
function _onInput(e) {
    const s = _wiz;
    const el = e.target;
    if (!s || !el || !el.matches) return;

    if (el.matches('[data-cw-name]')) {
        s.name = el.value;
        _updateLive(s, _metrics(s));
        return;
    }
    if (el.matches('[data-cw-cores]')) {
        s.cores = Math.max(1, Math.min(_archMax(s), parseInt(el.value, 10) || 1));
        _setText('[data-cw-cores-val]', String(s.cores));
        _updateLive(s, _metrics(s));
        return;
    }
    if (el.matches('[data-cw-clock]')) {
        const v = Math.round(parseFloat(el.value) * 10) / 10;
        s.clockGHz = Math.max(CLOCK_MIN, Math.min(CLOCK_MAX, isNaN(v) ? 1.0 : v));
        _setText('[data-cw-clock-val]', s.clockGHz.toFixed(1));
        _updateLive(s, _metrics(s));
    }
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
    _clampCores(s);

    _wiz = s;
    _render();
}
