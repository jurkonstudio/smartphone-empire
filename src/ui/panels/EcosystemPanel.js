// FILE: src/ui/panels/EcosystemPanel.js  (BARU — ekosistem: aksesori & App Store)
// Sub-tab "Ekosistem" di panel Pasar. Logika ada di EcosystemSystem.js; klik ditangani main.js
// lewat atribut data-eco-*. Semua teks memakai kamus src/data/i18n/ecosystem.i18n.js (key eco.*).
import { t } from '../../core/LanguageService.js';
import { formatCurrency } from '../../utils/format.js';
import { ensureRegionalStyle } from './RegionalStyle.js';
import { ECO_LINES, ECO_TIERS, ECO_TIER_META } from '../../data/ecosystem.data.js';

function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function _n(v) { v = Number(v); return isFinite(v) ? v : 0; }
function money(n) { return formatCurrency(Math.round(_n(n))); }
function int(n) { return Math.round(_n(n)).toLocaleString('en-US'); }
function pct(x, d) { return (_n(x) * 100).toFixed(d == null ? 0 : d) + '%'; }
function signPct(x, d, sign) {
    var v = _n(x) * 100;
    if (Math.abs(v) < 0.05) return '0%';
    return (sign && v > 0 ? '+' : (v < 0 ? '-' : '')) + Math.abs(v).toFixed(d == null ? 0 : d) + '%';
}
function kpi(label, val) {
    return '<div class="rg-kpi"><div class="rg-kpi-label">' + esc(label) + '</div><div class="rg-kpi-value">' + esc(val) + '</div></div>';
}
function _lockNote(left) {
    return left > 0 ? ' · ' + esc(t('eco.lock.store', { n: Math.ceil(left) })) : '';
}

function _summaryCard(sum) {
    var pctScore = Math.round(sum.score * 100);
    return '<div class="card"><div class="card-title">' + esc(t('eco.title')) + '</div>' +
        '<div class="rg-desc">' + esc(t('eco.desc')) + '</div>' +
        '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc(t('eco.lockin')) + '</div>' +
        '<div class="rg-meter"><i style="width:' + pctScore + '%;background:#0a84ff"></i></div></div>' +
        '<div class="rg-val">' + pctScore + '%</div></div>' +
        '<div class="rg-kpis">' +
            kpi(t('eco.kpi.demand'), signPct(sum.demandBonus, 1, true)) +
            kpi(t('eco.kpi.pressure'), signPct(-sum.competitorRelief, 1)) +
            kpi(t('eco.kpi.lines'), sum.linesOpen + '/' + sum.lineCount) +
            kpi(t('eco.kpi.base'), int(sum.phoneBase)) +
        '</div>' +
        '<div class="rg-row-meta">' + esc(t('eco.sum.lastRevenue')) + ' <b>' + money(sum.last && sum.last.revenue) + '</b>' +
        ' · ' + esc(t('eco.sum.unitsTotal')) + ' <b>' + int(sum.stats && sum.stats.units) + '</b></div>' +
        '</div>';
}

function _storeCard(sp) {
    if (!sp.available) {
        return '<div class="card"><div class="card-title">' + esc(t('eco.store.title')) + '</div>' +
            '<div class="rg-desc">' + esc(t('eco.store.unavailable')) + '</div></div>';
    }
    var dis = sp.locked ? ' disabled' : '';
    return '<div class="card"><div class="card-title">' + esc(t('eco.store.title')) + '</div>' +
        '<div class="rg-desc">' + esc(t('eco.store.desc')) + '</div>' +
        '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc(t('eco.store.commission')) + '</div></div>' +
        '<div class="rg-btn-row"><button class="btn-secondary" data-eco-commission="x" data-eco-val="-1"' + (sp.commission <= sp.minCommission + 1e-9 ? ' disabled' : dis) + '>−</button>' +
        ' <b>' + pct(sp.commission, 0) + '</b> ' +
        '<button class="btn-secondary" data-eco-commission="x" data-eco-val="1"' + (sp.commission >= sp.maxCommission - 1e-9 ? ' disabled' : dis) + '>+</button></div></div>' +
        '<div class="rg-kpis">' +
            kpi(t('eco.store.users'), int(sp.users)) +
            kpi(t('eco.store.gross'), money(sp.gross)) +
            kpi(t('eco.store.commissionRev'), money(sp.revenue)) +
            kpi(t('eco.store.cost'), money(sp.cost)) +
        '</div>' +
        '<div class="rg-row-meta">' + esc(t('eco.store.appeal')) + ' <b>' + pct(sp.appeal, 0) + '</b> · ' +
        esc(t('eco.store.quality')) + ' <b>' + pct(sp.quality, 0) + '</b>' + _lockNote(sp.lockLeft) + '</div>' +
        '</div>';
}

function _lineCard(sys, line) {
    var p = sys.getLinePreview(line.id);
    if (!p) return '';
    var name = esc(t(line.nameKey));
    if (!p.yearOk) {
        return '<div class="card" style="opacity:.6"><div class="card-title">' + name + '</div>' +
            '<div class="rg-desc">' + esc(t('eco.line.locked', { year: line.minYear })) + '</div></div>';
    }
    var tiers = ECO_TIERS.map(function (tier) {
        return '<button class="' + (p.tier === tier ? 'btn-primary' : 'btn-secondary') + '" data-eco-tier="' + esc(line.id) + '" data-eco-val="' + tier + '"' +
            (p.locked && p.tier !== tier ? ' disabled' : '') + '>' + esc(t(ECO_TIER_META[tier].nameKey)) + '</button>';
    }).join(' ');
    var priceDis = p.locked ? ' disabled' : '';
    var priceRow = '<div style="display:flex;align-items:center;gap:8px;">' +
        '<button class="btn-secondary" style="flex:1" data-eco-price="' + esc(line.id) + '" data-eco-val="-1"' +
        (p.price <= p.priceMin + 1e-9 ? ' disabled' : priceDis) + '>−</button>' +
        '<b style="min-width:72px;text-align:center">' + esc(money(p.price)) + '</b>' +
        '<button class="btn-secondary" style="flex:1" data-eco-price="' + esc(line.id) + '" data-eco-val="1"' +
        (p.price >= p.priceMax - 1e-9 ? ' disabled' : priceDis) + '>+</button></div>';
    var action;
    if (p.open) {
        action = '<button class="btn-secondary" data-eco-close="' + esc(line.id) + '"' + (p.closeLocked ? ' disabled' : '') + '>' +
            esc(t('eco.line.close')) + '</button>' +
            (p.closeLocked ? ' <span class="rg-row-meta">' + esc(t('eco.line.committed', { n: Math.ceil(p.commitLeft) })) + '</span>' : '');
    } else {
        action = '<button class="' + (p.canOpen ? 'btn-primary' : 'btn-secondary') + '" data-eco-open="' + esc(line.id) + '"' +
            (p.canOpen ? '' : ' disabled') + '>' + esc(t('eco.line.open')) + ' · ' + esc(money(p.setupCost)) + '</button>';
    }
    return '<div class="card"><div class="card-title">' + name + (p.open ? '' : ' · ' + esc(t('eco.line.notOpen'))) + '</div>' +
        '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc(t('eco.line.tier')) + '</div>' +
        '<div class="rg-btn-row">' + tiers + '</div></div></div>' +
        '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc(t('eco.line.price')) + '</div>' + priceRow + '</div></div>' +
        '<div class="rg-kpis">' +
            kpi(t('eco.line.units'), int(p.units)) +
            kpi(t('eco.line.revenue'), money(p.revenue)) +
            kpi(t('eco.line.cost'), money(p.cost)) +
            kpi(t('eco.line.margin'), pct(p.margin, 0)) +
        '</div>' +
        '<div class="rg-btn-row">' + action + '</div>' +
        (p.locked && p.open ? '<div class="rg-row-meta">' + esc(t('eco.line.priceLocked', { n: Math.ceil(p.lockLeft) })) + '</div>' : '') +
        '</div>';
}

export function renderEcosystemPanel(params) {
    ensureRegionalStyle();
    var sys = params.ecosystemSystem;
    if (!sys) return '';
    var sum = sys.getSummary();
    var sp = sys.getStorePreview();
    var lines = ECO_LINES.map(function (l) { return _lineCard(sys, l); }).join('');
    return _summaryCard(sum) + _storeCard(sp) + lines;
}
