// FILE: src/ui/phone/PhoneGenerations.js  (BARU 0.2.12; 0.2.14: galeri sampel layar lipat & dual)
// Galeri Generasi di Produk → Desain → Ponsel.
// - Hero: mockup ponsel terakhir Anda (atau contoh standar) dengan era dari tahun dan riset yang sudah selesai.
// - Timeline: seluruh milestone dari PHONE_SPECS (generasi 1 sampai terbaru), tiap kartu dirender dari spec-nya sendiri.
// Semua data dibaca dari state setiap kali panel dirender, jadi galeri ikut berubah saat tahun, riset, atau ponsel baru berubah.
import { state } from '../../core/GameState.js';
import { t } from '../../core/LanguageService.js';
import { escapeHtml } from '../../utils/html.js';
import { PHONE_SPECS, resolveSpec } from '../../data/phone-specs.data.js';
import { getDesignEraById } from '../../data/era-design.data.js';
import { renderPhoneMockup } from './PhoneMockup.js';

const DEFAULT_CONFIG = { formFactorId: 'ff_candybar', bodyColorId: 'color_black', cameraId: 'cam_vga', displayId: '' };

// Cache thumbnail kecil supaya render ulang panel tidak membangun ulang semua SVG.
const _cache = {};
let _cacheCount = 0;
function _cached(key, build) {
    if (_cache[key] !== undefined) return _cache[key];
    let html = '';
    try { html = build(); } catch (e) { html = ''; }
    if (_cacheCount > 80) { for (const k in _cache) delete _cache[k]; _cacheCount = 0; }
    _cache[key] = html;
    _cacheCount++;
    return html;
}

function _safeState() {
    try { return state.get() || {}; } catch (e) { return {}; }
}

// Ponsel terakhir yang Anda rilis (produk dengan tahun rilis terbaru).
function _referencePhone(st) {
    const cat = (st.products && st.products.catalog) || [];
    let best = null;
    cat.forEach(function (p) {
        if (!p || !p.config) return;
        const y = (p.releaseDate && p.releaseDate.year) || 0;
        const by = best ? ((best.releaseDate && best.releaseDate.year) || 0) : -1;
        if (!best || y >= by) best = p;
    });
    return best ? { config: best.config, name: (best.name || '').trim() } : null;
}

// Status tiap generasi terhadap tahun dan riset saat ini.
function _specStatus(spec, nowSpec, year) {
    if (spec.id === nowSpec.id) return 'now';
    if (spec.toYear < year) return 'past';
    if (spec.fromYear > year) return 'future';
    return 'research'; // tahunnya sudah tiba, tapi riset pembukanya belum selesai
}

function _materialLabel(mat) {
    const key = 'gen.mat.' + mat;
    const v = t(key);
    return v === key ? String(mat || '') : v;
}

function _lensLabel(n) {
    if (!n) return t('gen.chip.no_lens');
    return t('gen.chip.lenses', { n: n });
}

function _yearsLabel(spec) {
    if (spec.fromYear === spec.toYear) return String(spec.fromYear);
    const to = spec.toYear >= 9999 ? t('gen.years.now') : String(spec.toYear);
    return spec.fromYear + '–' + to;
}

function _eraVars(era) {
    const a = (era && era.aesthetic) || {};
    return { accent: a.accent || '#0a84ff', bg: a.bg || '#0b0f1a' };
}

function _heroHtml(cfg, year, completed, nowSpec) {
    const key = 'hero|' + nowSpec.id + '|' + year + '|' + completed.length + '|' + JSON.stringify(cfg);
    return _cached(key, function () {
        return renderPhoneMockup(cfg, { size: 250, year: year, showBrand: false, isStatic: false, packCaption: false });
    });
}

function _chipsHtml(spec, era) {
    const chips = [
        t('gen.chip.era') + ': ' + (era.shortLabel || era.label || ''),
        _lensLabel((spec.cameras && spec.cameras.rear) || 0),
        _materialLabel(spec.material)
    ].filter(Boolean);
    return chips.map(function (c) { return '<span class="gen-chip">' + escapeHtml(c) + '</span>'; }).join('');
}

function _cardHtml(spec, idx, nowSpec, year, completed, cfg) {
    const status = _specStatus(spec, nowSpec, year);
    const era = getDesignEraById(spec.eraId);
    const thumb = _cached('thumb|' + spec.id + '|' + JSON.stringify(cfg) + '|' + completed.length, function () {
        return renderPhoneMockup(cfg, { size: 96, year: spec.fromYear, spec: spec, showBrand: false, isStatic: true, inHouse: false });
    });
    let stText;
    if (status === 'now') stText = t('gen.st.now');
    else if (status === 'past') stText = t('gen.st.past');
    else if (status === 'future') stText = t('gen.st.future', { year: spec.fromYear });
    else stText = t('gen.st.research');
    return '<div class="gen-card is-' + status + '" data-gen-spec="' + escapeHtml(spec.id) + '" title="' + escapeHtml(era.label || '') + '">' +
        (status === 'now' ? '<span class="gen-card-pill">' + escapeHtml(t('gen.st.live')) + '</span>' : '') +
        '<div class="gen-card-thumb">' + thumb + '</div>' +
        '<div class="gen-card-no">' + escapeHtml(t('gen.gen_no', { n: idx + 1 })) + '</div>' +
        '<div class="gen-card-name">' + escapeHtml(spec.label) + '</div>' +
        '<div class="gen-card-yr">' + escapeHtml(_yearsLabel(spec)) + '</div>' +
        '<div class="gen-card-st">' + escapeHtml(stText) + '</div>' +
        '</div>';
}

// ---- Galeri sampel layar lipat & dual (0.2.14) ----
// Sampel bentuk lipat/dual dirender dari spec tahun bukanya. Selama tahun atau riset belum terpenuhi
// kartunya redup (sama seperti generasi yang belum terbuka), lalu menyala otomatis saat sudah terbuka.
const FOLD_SAMPLES = [
    { id: 'ff_dual',             year: 2020, research: null,                key: 'duo' },
    { id: 'ff_fold',             year: 2019, research: 'layar_foldable',    key: 'fold' },
    { id: 'ff_flip_fold',        year: 2020, research: 'layar_foldable',    key: 'flip' },
    { id: 'ff_tri_fold',         year: 2024, research: 'layar_foldable',    key: 'tri' },
    { id: 'ff_tri_fold_c',       year: 2025, research: 'layar_foldable',    key: 'tric' },
    { id: 'ff_fold_wide',        year: 2026, research: 'layar_foldable',    key: 'wide' },
    { id: 'ff_book_crease_free', year: 2026, research: 'layar_crease_free', key: 'crease' }
];

function _specForYear(y) {
    let hit = null;
    PHONE_SPECS.forEach(function (s) { if (y >= s.fromYear && y <= s.toYear) hit = s; });
    return hit || PHONE_SPECS[PHONE_SPECS.length - 1];
}

function _foldStatus(sample, year, completed) {
    if (year < sample.year) return 'future';
    if (sample.research && completed.indexOf(sample.research) === -1) return 'research';
    return 'open';
}

function _foldCardHtml(sample, year, completed, cfg) {
    const status = _foldStatus(sample, year, completed);
    const spec = _specForYear(sample.year);
    const fcfg = Object.assign({}, cfg, { formFactorId: sample.id });
    const thumb = _cached('fold|' + sample.id + '|' + (cfg.bodyColorId || '') + '|' + (cfg.cameraId || ''), function () {
        return renderPhoneMockup(fcfg, { size: 96, year: sample.year, spec: spec, showBrand: false, isStatic: true, inHouse: false, ignoreResearch: true, fit: { w: 104, h: 98 } });
    });
    let stText;
    if (status === 'future') stText = t('gen.st.future', { year: sample.year });
    else if (status === 'research') stText = t('gen.st.research');
    else stText = t('gen.fold.open');
    const cls = status === 'open' ? 'is-open' : 'is-' + status;
    return '<div class="gen-card gen-fold-card ' + cls + '" data-gen-fold="' + escapeHtml(sample.id) + '">' +
        '<div class="gen-card-thumb">' + thumb + '</div>' +
        '<div class="gen-card-no">' + escapeHtml(t('gen.fold.tag.' + sample.key)) + '</div>' +
        '<div class="gen-card-name">' + escapeHtml(t('gen.fold.name.' + sample.key)) + '</div>' +
        '<div class="gen-card-yr">' + escapeHtml(String(sample.year)) + '</div>' +
        '<div class="gen-card-st">' + escapeHtml(stText) + '</div>' +
        '</div>';
}

function _foldGalleryHtml(year, completed, cfg) {
    const openCount = FOLD_SAMPLES.filter(function (s) { return _foldStatus(s, year, completed) === 'open'; }).length;
    return '<div class="gen-rail-head gen-fold-head">' +
            '<span>' + escapeHtml(t('gen.fold.title')) + '</span>' +
            '<span>' + escapeHtml(t('gen.fold.count', { n: openCount, total: FOLD_SAMPLES.length })) + '</span>' +
        '</div>' +
        '<div class="gen-rail" role="list">' + FOLD_SAMPLES.map(function (s) { return _foldCardHtml(s, year, completed, cfg); }).join('') + '</div>' +
        '<div class="gen-note">' + escapeHtml(t('gen.fold.note')) + '</div>';
}

function _safeFold(year, completed, cfg) {
    try { return _foldGalleryHtml(year, completed, cfg); } catch (e) { return ''; }
}

// Dipanggil dari ProductPanel (tab Desain, kategori Ponsel) sebelum kartu "Mulai desain".
export function renderPhoneGenerations() {
    const st = _safeState();
    const year = (st.time && st.time.currentYear) || 2000;
    const completed = (st.research && st.research.completed) || [];
    const nowSpec = resolveSpec(year, completed);
    const era = getDesignEraById(nowSpec.eraId);
    const ev = _eraVars(era);
    const ref = _referencePhone(st);
    const cfg = ref ? ref.config : DEFAULT_CONFIG;

    const openCount = PHONE_SPECS.filter(function (s) { return s.fromYear <= year; }).length;
    const heroName = ref && ref.name ? t('gen.hero.last', { name: ref.name }) : (ref ? t('gen.hero.last_unnamed') : t('gen.hero.sample'));

    const cards = PHONE_SPECS.map(function (s, i) {
        return _cardHtml(s, i, nowSpec, year, completed, cfg);
    }).join('');

    const styleVars = '--gen-accent:' + ev.accent + ';--gen-bg:' + ev.bg + ';';

    return '<div class="card gen-wrap" style="' + styleVars + '">' +
        '<div class="card-title">' + escapeHtml(t('gen.title')) + '</div>' +
        '<div class="gen-stage">' +
            '<div class="gen-stage-glow" aria-hidden="true"></div>' +
            '<div class="gen-hero-phone">' + _heroHtml(cfg, year, completed, nowSpec) + '</div>' +
            '<div class="gen-hero-cap">' + escapeHtml(heroName) + '</div>' +
        '</div>' +
        '<div class="gen-hero-meta">' +
            '<div class="gen-hero-name">' + escapeHtml(nowSpec.label) + '</div>' +
            '<div class="gen-hero-sub">' + escapeHtml(era.label || '') + ' · ' + year + '</div>' +
        '</div>' +
        '<div class="gen-chips">' + _chipsHtml(nowSpec, era) + '</div>' +
        '<div class="gen-rail-head">' +
            '<span>' + escapeHtml(t('gen.rail.title')) + '</span>' +
            '<span>' + escapeHtml(t('gen.rail.count', { n: openCount, total: PHONE_SPECS.length })) + '</span>' +
        '</div>' +
        '<div class="gen-rail" role="list">' + cards + '</div>' +
        '<div class="gen-note">' + escapeHtml(t('gen.note')) + '</div>' +
        _safeFold(year, completed, cfg) +
        '</div>';
}
