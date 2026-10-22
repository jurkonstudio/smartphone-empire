// FILE: src/ui/panels/MarketNavPanels.js  (BARU)
// Kartu Navigasi Pasar: peluang, segmen konsumen, sub-wilayah, gelombang tren, tren tambahan,
// reaksi per segmen/wilayah, dan riwayat viral. Dipasang di sub-tab Pangsa, Tren, dan Publik.
// Semua fungsi aman: bila sistem belum siap atau terjadi error, mengembalikan string kosong.
import { t } from '../../core/LanguageService.js';
import { escapeHtml } from '../../utils/html.js';
import { loc } from '../../systems/MarketNavSystem.js';
import { getSegment, getSubregion } from '../../data/market-nav.data.js';
import { ensureRegionalStyle } from './RegionalStyle.js';

function esc(s) { return escapeHtml(s); }
function pct(v, d) { return (Math.max(0, Number(v) || 0) * 100).toFixed(d == null ? 0 : d) + '%'; }
function num(v) { return (typeof v === 'number' && isFinite(v)) ? Math.round(v) : null; }

function _nav() {
    var g = window.__game;
    return (g && g.marketNav) ? g.marketNav : null;
}

function _safe(fn) {
    try { return fn() || ''; } catch (e) { console.warn('[MarketNavPanels]', e); return ''; }
}

function _dot(color) { return '<span class="rg-dot" style="background:' + esc(color || '#888') + '"></span>'; }

function _card(titleKey, body, hintKey) {
    return '<div class="card"><div class="card-title">' + esc(t(titleKey)) + '</div>' +
        (hintKey ? '<div class="rg-row-meta" style="margin:-2px 0 10px;">' + esc(t(hintKey)) + '</div>' : '') +
        body + '</div>';
}

function _tag(text, cls) { return '<span class="rg-tag' + (cls ? ' ' + cls : '') + '">' + esc(text) + '</span>'; }

function _nameOf(kind, id) {
    var def = kind === 'segment' ? getSegment(id) : getSubregion(id);
    if (!def) return { name: String(id), icon: '•', color: '#888' };
    return { name: loc(def.name), icon: def.icon || '•', color: def.color };
}

// Baris generik untuk segmen/wilayah: nama, porsi permintaan, minat, sentimen, penetrasi.
function _entityRow(def, rec, maxWeight, locked, lockedYear) {
    var name = esc((def.icon || '') + ' ' + loc(def.name));
    if (locked) {
        return '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + _dot(def.color) + name + '</div>' +
            '<div class="rg-row-meta">' + esc(t('market.nav.locked', { n: lockedYear })) + '</div></div></div>';
    }
    var delta = rec.weightDelta || 0;
    var arrow = Math.abs(delta) < 0.01 ? '' : (delta > 0 ? ' ▲' : ' ▼');
    var intent = num(rec.intent), sent = num(rec.sentiment);
    var meta = esc(t('market.nav.intent')) + ' ' + (intent == null ? '–' : intent) + ' · ' +
        esc(t('market.nav.sentiment')) + ' ' + (sent == null ? '–' : sent) + ' · ' +
        esc(t('market.nav.penetration')) + ' ' + Math.round((rec.index || 0) * 100) + '%';
    var width = maxWeight > 0 ? Math.min(100, (rec.weight / maxWeight) * 100) : 0;
    return '<div class="rg-row"><div class="rg-row-main">' +
        '<div class="rg-row-name">' + _dot(def.color) + name + '</div>' +
        '<div class="rg-row-meta">' + meta + '</div>' +
        '<div class="rg-meter"><i style="width:' + width.toFixed(0) + '%;background:' + esc(def.color || '#888') + '"></i></div>' +
        '</div><div class="rg-val">' + pct(rec.weight, 1) + arrow + '</div></div>';
}

// ---------------------------------------------------------------- sub-tab Pangsa

function _opportunities(nav) {
    var list = nav.getOpportunities(3);
    if (!list || !list.length) return '';
    var rows = list.map(function (o) {
        var n = _nameOf(o.kind, o.id);
        var tag = o.index < 0.6 ? _tag(t('market.nav.opps.untapped'), 'good') : _tag(t('market.nav.opps.strong'), '');
        return '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + _dot(n.color) + esc(n.icon + ' ' + n.name) + '</div>' +
            '<div class="rg-row-meta">' + esc(t('market.nav.kind.' + o.kind)) + ' · ' + esc(t('market.nav.share_of_demand', { n: (o.weight * 100).toFixed(1) })) + '</div>' +
            '</div>' + tag + '</div>';
    }).join('');
    return _card('market.nav.opps.title', rows, 'market.nav.opps.desc');
}

function _segments(nav) {
    var list = nav.getSegments();
    var year = nav.state.data.time.currentYear;
    var max = 0; list.forEach(function (s) { if (!s.locked) max = Math.max(max, s.weight); });
    var rows = list.map(function (s) {
        return _entityRow(s.def, s, max, s.locked, s.def.minYear || year);
    }).join('');
    return _card('market.nav.segments.title', rows, 'market.nav.segments.desc');
}

function _regions(nav) {
    var list = nav.getRegions();
    var max = 0; list.forEach(function (s) { max = Math.max(max, s.weight); });
    var rows = list.map(function (s) { return _entityRow(s.def, s, max, false, 0); }).join('');
    return _card('market.nav.regions.title', rows, 'market.nav.regions.desc');
}

export function renderNavShare() {
    var nav = _nav();
    if (!nav) return '';
    ensureRegionalStyle();
    return _safe(function () { return _opportunities(nav); }) +
        _safe(function () { return _segments(nav); }) +
        _safe(function () { return _regions(nav); });
}

// ---------------------------------------------------------------- sub-tab Tren

function _waves(nav) {
    var active = nav.getActiveWaves().slice(0, 4);
    var soon = nav.getUpcomingWaves().slice(0, 2);
    var body = '';
    if (!active.length) body += '<div class="rg-row-meta">' + esc(t('market.nav.waves.none')) + '</div>';
    active.forEach(function (w) {
        var wd = w.def;
        body += '<div class="rg-row"><div class="rg-row-main">' +
            '<div class="rg-row-name">' + esc((wd.icon || '') + ' ' + loc(wd.name)) + '</div>' +
            '<div class="rg-row-meta">' + esc(loc(wd.desc)) + '</div>' +
            '<div class="rg-meter"><i style="width:' + Math.round(Math.min(1, w.intensity) * 100) + '%;background:var(--accent)"></i></div>' +
            '</div><div class="rg-val">' + Math.round(Math.min(1, w.intensity) * 100) + '%</div></div>';
    });
    soon.forEach(function (w) {
        body += '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc((w.def.icon || '') + ' ' + loc(w.def.name)) + '</div></div>' +
            _tag(t('market.nav.waves.soon', { n: w.monthsAway }), 'info') + '</div>';
    });
    return _card('market.nav.waves.title', body, 'market.nav.waves.desc');
}

function _extTrends(nav) {
    var list = nav.getAllTrends().filter(function (x) { return x.ext; });
    if (!list.length) return '';
    var rows = list.map(function (x) {
        var v = Math.round(Math.max(0, Math.min(1, x.value || 0)) * 100);
        var dir = x.dir > 0 ? t('market.nav.dir.up') : (x.dir < 0 ? t('market.nav.dir.down') : t('market.nav.dir.flat'));
        var cls = x.dir > 0 ? 'good' : (x.dir < 0 ? 'warn' : '');
        return '<div class="rg-row"><div class="rg-row-main">' +
            '<div class="rg-row-name">' + esc((x.icon || '') + ' ' + t('market.trend.' + x.id)) + '</div>' +
            '<div class="rg-meter"><i style="width:' + v + '%;background:var(--accent)"></i></div>' +
            '</div><div style="text-align:right;"><div class="rg-val">' + v + '%</div>' + _tag(dir, cls) + '</div></div>';
    }).join('');
    return _card('market.nav.trends_ext.title', rows, 'market.nav.trends_ext.desc');
}

export function renderNavTrends() {
    var nav = _nav();
    if (!nav) return '';
    ensureRegionalStyle();
    return _safe(function () { return _waves(nav); }) + _safe(function () { return _extTrends(nav); });
}

// ---------------------------------------------------------------- sub-tab Publik

function _reactions(nav) {
    var segs = nav.getSegments().filter(function (s) { return !s.locked && num(s.sentiment) != null; });
    var regs = nav.getRegions().filter(function (s) { return num(s.sentiment) != null; });
    if (!segs.length && !regs.length) {
        return _card('market.nav.reactions.title', '<div class="rg-row-meta">' + esc(t('market.nav.reactions.none')) + '</div>', 'market.nav.reactions.desc');
    }
    function row(def, rec) {
        var s = num(rec.sentiment);
        var cls = s >= 60 ? 'good' : (s < 40 ? 'warn' : '');
        return '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + _dot(def.color) + esc((def.icon || '') + ' ' + loc(def.name)) + '</div>' +
            '<div class="rg-meter"><i style="width:' + s + '%;background:' + esc(def.color || '#888') + '"></i></div></div>' +
            _tag(String(s), cls) + '</div>';
    }
    var body = '<div class="rg-row-meta" style="margin-bottom:6px;"><b>' + esc(t('market.nav.segments.title')) + '</b></div>' +
        segs.map(function (s) { return row(s.def, s); }).join('') +
        '<div class="rg-row-meta" style="margin:8px 0 6px;"><b>' + esc(t('market.nav.regions.title')) + '</b></div>' +
        regs.map(function (s) { return row(s.def, s); }).join('');
    return _card('market.nav.reactions.title', body, 'market.nav.reactions.desc');
}

function _viralHistory() {
    var g = window.__game;
    var op = g && g.opinion;
    var list = (op && op.getViralHistory) ? op.getViralHistory().slice(0, 6) : [];
    var body;
    if (!list.length) {
        body = '<div class="rg-row-meta">' + esc(t('market.nav.history.none')) + '</div>';
    } else {
        body = list.map(function (v) {
            var title = (v.i18n && v.i18n.title) ? loc(v.i18n.title) : (v.title || '');
            var okey = (v.outcome === 'ignored' || v.outcome === 'expired') ? v.outcome : 'responded';
            var cls = v.type === 'positive' ? 'good' : 'warn';
            var when = (v.year ? v.year : '') + (v.month ? '-' + String(v.month).padStart(2, '0') : '');
            return '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc(title) + '</div>' +
                '<div class="rg-row-meta">' + esc(when) + (v.productName ? ' · ' + esc(v.productName) : '') + '</div></div>' +
                _tag(t('market.nav.outcome.' + okey), cls) + '</div>';
        }).join('');
    }
    return _card('market.nav.history.title', body, null);
}

export function renderNavPublic() {
    var nav = _nav();
    if (!nav) return '';
    ensureRegionalStyle();
    return _safe(function () { return _reactions(nav); }) + _safe(_viralHistory);
}
