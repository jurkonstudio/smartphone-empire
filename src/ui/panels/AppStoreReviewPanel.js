// FILE: src/ui/panels/AppStoreReviewPanel.js  (BARU — Peninjauan App Store)
// Sub-tab "Tinjauan App" di panel Pasar. Logika ada di AppStoreReviewSystem.js; klik ditangani main.js
// lewat atribut data-asr-*. Semua teks memakai kamus src/data/i18n/appstore-review.i18n.js (key asr.*).
import { t } from '../../core/LanguageService.js';
import { formatCurrency } from '../../utils/format.js';
import { ensureRegionalStyle } from './RegionalStyle.js';
import { ASR_REASONS } from '../../data/appstore-review.data.js';

function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function _n(v) { v = Number(v); return isFinite(v) ? v : 0; }
function money(n) { return formatCurrency(Math.round(_n(n))); }
function int(n) { return Math.round(_n(n)).toLocaleString('en-US'); }
function pct(x, d) { return (_n(x) * 100).toFixed(d == null ? 0 : d) + '%'; }
function signPct(x, d) {
    var v = _n(x) * 100;
    if (Math.abs(v) < 0.05) return '0%';
    return (v > 0 ? '+' : '-') + Math.abs(v).toFixed(d == null ? 0 : d) + '%';
}
function kpi(label, val) {
    return '<div class="rg-kpi"><div class="rg-kpi-label">' + esc(label) + '</div><div class="rg-kpi-value">' + esc(val) + '</div></div>';
}
function meter(value, color) {
    var w = Math.max(0, Math.min(100, Math.round(_n(value))));
    return '<div class="rg-meter"><i style="width:' + w + '%;background:' + color + '"></i></div>';
}
function chip(text, color) {
    return '<span style="display:inline-block;padding:2px 8px;margin:2px 4px 2px 0;border-radius:10px;font-size:11px;font-weight:600;' +
        'background:' + color + '22;color:' + color + '">' + esc(text) + '</span>';
}
function _qualityColor(q) { return q >= 60 ? '#30d158' : (q >= 45 ? '#ff9f0a' : '#ff453a'); }

function _summaryCard(sum) {
    var gwColor = sum.goodwill >= 60 ? '#30d158' : (sum.goodwill >= 35 ? '#ff9f0a' : '#ff453a');
    var s = sum.stats;
    return '<div class="card"><div class="card-title">' + esc(t('asr.title')) + '</div>' +
        '<div class="rg-desc">' + esc(t('asr.desc')) + '</div>' +
        '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc(t('asr.goodwill')) + '</div>' +
        meter(sum.goodwill, gwColor) + '</div><div class="rg-val">' + Math.round(sum.goodwill) + '%</div></div>' +
        '<div class="rg-row-meta">' + esc(t('asr.goodwill.hint')) + '</div>' +
        '<div class="rg-kpis">' +
            kpi(t('asr.kpi.pending'), sum.pending + '/' + sum.queueMax) +
            kpi(t('asr.kpi.apps'), int(sum.activeApps)) +
            kpi(t('asr.kpi.rate'), sum.arrivalRate.toFixed(1)) +
            kpi(t('asr.kpi.factor'), signPct(sum.storeFactor - 1, 1)) +
        '</div>' +
        '<div class="rg-row-meta">' + esc(t('asr.sum.line', { a: s.approved, r: s.rejected, m: s.flaggedMissed, c: s.flaggedCaught })) +
        ' · ' + esc(t('asr.sum.fees')) + ' <b>' + money(s.feesEarned) + '</b></div>' +
        '</div>';
}

function _policyCard(pol) {
    var scanBtns = pol.levels.map(function (lv) {
        var info = lv.id === 'off' ? '' : ' title="' + esc(t('asr.scan.info', { p: Math.round(lv.detect * 100), cost: money(lv.monthly) })) + '"';
        var label = t('asr.scan.' + lv.id) + (lv.setup > 0 ? ' · ' + t('asr.scan.setup', { cost: money(lv.setup) }) : '');
        return '<button class="' + (lv.active ? 'btn-primary' : 'btn-secondary') + '" data-asr-scan="' + esc(lv.id) + '"' + info + '>' + esc(label) + '</button>';
    }).join(' ');
    var scanInfo = '';
    for (var i = 0; i < pol.levels.length; i++) {
        if (pol.levels[i].active && pol.levels[i].id !== 'off') {
            scanInfo = '<div class="rg-row-meta">' + esc(t('asr.scan.info', { p: Math.round(pol.levels[i].detect * 100), cost: money(pol.levels[i].monthly) })) + '</div>';
        }
    }
    var feeLabel = pol.fee > 0 ? money(pol.fee) : t('asr.policy.fee.none');
    return '<div class="card"><div class="card-title">' + esc(t('asr.policy.title')) + '</div>' +
        '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc(t('asr.policy.scan')) + '</div>' +
        '<div class="rg-btn-row">' + scanBtns + '</div></div></div>' + scanInfo +
        '<div class="rg-row-meta">' + esc(t('asr.policy.scan.hint')) + '</div>' +
        '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc(t('asr.policy.fee')) + '</div></div>' +
        '<div class="rg-btn-row"><button class="btn-secondary" data-asr-fee="x" data-asr-val="-1"' + (pol.feeMin ? ' disabled' : '') + '>−</button>' +
        ' <b>' + esc(feeLabel) + '</b> ' +
        '<button class="btn-secondary" data-asr-fee="x" data-asr-val="1"' + (pol.feeMax ? ' disabled' : '') + '>+</button></div></div>' +
        '<div class="rg-row-meta">' + esc(t('asr.policy.fee.hint')) + '</div>' +
        '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc(t('asr.policy.auto')) + '</div></div>' +
        '<div class="rg-btn-row"><button class="' + (pol.autoTrusted ? 'btn-primary' : 'btn-secondary') + '" data-asr-auto="x">' +
        esc(pol.autoTrusted ? t('asr.policy.on') : t('asr.policy.off')) + '</button></div></div>' +
        '<div class="rg-row-meta">' + esc(t('asr.policy.auto.hint')) + '</div>' +
        '</div>';
}

function _submissionCard(s, inspectCost) {
    var flags = s.seen.map(function (f) { return chip(t('asr.flag.' + f), '#ff453a'); }).join('');
    var findings = flags
        ? '<div class="rg-row-meta">' + esc(t('asr.queue.found')) + ': ' + flags + '</div>'
        : '<div class="rg-row-meta">' + esc(t('asr.queue.scanClean')) + '</div>';
    var devLine = esc(t('asr.queue.dev')) + ': <b>' + esc(s.devName) + '</b> · ' + esc(t('asr.devtype.' + s.devType)) +
        (s.devTrusted ? ' ' + chip(t('asr.queue.trusted'), '#30d158') : '') + '<br>' +
        (s.devNew ? esc(t('asr.queue.devNew')) : esc(t('asr.queue.rep', { n: Math.round(s.devRep) })) + ' · ' +
            esc(t('asr.queue.devHistory', { a: s.devApproved, r: s.devRejected })));
    var q = Math.round(s.quality);
    var reasons = ASR_REASONS.map(function (r) {
        return '<button class="btn-secondary" data-asr-reject="' + s.id + '" data-asr-val="' + r + '">' + esc(t('asr.reason.' + r)) + '</button>';
    }).join(' ');
    return '<div class="card"><div class="card-title">' + esc(s.title) + '</div>' +
        '<div class="rg-row-meta">' + esc(t('asr.cat.' + s.category)) + ' · ' + esc(t('asr.model.' + s.model)) +
        ' · ' + esc(t('asr.queue.deadline', { n: s.monthsLeft })) + '</div>' +
        '<div class="rg-row-meta">' + devLine + '</div>' +
        '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc(t('asr.queue.quality')) + ' (' +
        esc(t(s.qualityExact ? 'asr.queue.qualityExact' : 'asr.queue.qualityEst')) + ')</div>' + meter(q, _qualityColor(q)) +
        '</div><div class="rg-val">' + (s.qualityExact ? '' : '~') + q + '</div></div>' +
        findings +
        '<div class="rg-btn-row"><button class="btn-primary" data-asr-approve="' + s.id + '">' + esc(t('asr.btn.approve')) + '</button> ' +
        '<button class="btn-secondary" data-asr-inspect="' + s.id + '"' + (s.inspected ? ' disabled' : '') + '>' +
        esc(s.inspected ? t('asr.btn.inspected') : t('asr.btn.inspect') + ' · ' + money(inspectCost)) + '</button></div>' +
        '<div class="rg-row-meta">' + esc(t('asr.btn.rejectLabel')) + '</div>' +
        '<div class="rg-btn-row">' + reasons + '</div>' +
        '</div>';
}

function _queueSection(sys, pol) {
    var q = sys.getQueue();
    if (!q.length) {
        return '<div class="card"><div class="card-title">' + esc(t('asr.queue.title')) + '</div>' +
            '<div class="rg-desc">' + esc(t('asr.queue.empty')) + '</div></div>';
    }
    return '<div class="card"><div class="card-title">' + esc(t('asr.queue.title')) + ' (' + q.length + ')</div></div>' +
        q.map(function (s) { return _submissionCard(s, pol.inspectCost); }).join('');
}

function _incidentCard(sys) {
    var list = sys.getIncidents();
    if (!list.length) return '';
    var rows = list.map(function (i) {
        return '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' +
            esc(t('asr.inc.row', { title: i.title, flag: t('asr.flag.' + i.flag), n: i.monthsLeft })) + '</div></div>' +
            '<div class="rg-btn-row"><button class="btn-primary" data-asr-takedown="' + i.appId + '">' + esc(t('asr.btn.takedown')) + '</button></div></div>';
    }).join('');
    return '<div class="card" style="border-left:3px solid #ff453a"><div class="card-title">' + esc(t('asr.inc.title')) + '</div>' +
        '<div class="rg-desc">' + esc(t('asr.inc.desc')) + '</div>' + rows + '</div>';
}

function _developersCard(sys) {
    var list = sys.getDevelopers(8);
    var body;
    if (!list.length) body = '<div class="rg-desc">' + esc(t('asr.dev.empty')) + '</div>';
    else {
        body = list.map(function (dv) {
            var btn = dv.banned
                ? '<button class="btn-secondary" data-asr-unban="' + esc(dv.id) + '">' + esc(t('asr.btn.unban')) + '</button>'
                : '<button class="btn-secondary" data-asr-ban="' + esc(dv.id) + '">' + esc(t('asr.btn.ban')) + '</button>';
            return '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc(dv.name) +
                (dv.trusted ? ' ' + chip(t('asr.queue.trusted'), '#30d158') : '') +
                (dv.banned ? ' ' + chip(t('asr.dev.banned'), '#ff453a') : '') + '</div>' +
                '<div class="rg-row-meta">' + esc(t('asr.queue.rep', { n: Math.round(dv.rep) })) + ' · ' +
                esc(t('asr.dev.row', { a: dv.approved, r: dv.rejected, f: dv.flagged })) + '</div></div>' +
                '<div class="rg-btn-row">' + btn + '</div></div>';
        }).join('');
    }
    return '<div class="card"><div class="card-title">' + esc(t('asr.dev.title')) + '</div>' + body + '</div>';
}

function _catalogCard(sys) {
    var list = sys.getCatalog(12);
    var body;
    if (!list.length) body = '<div class="rg-desc">' + esc(t('asr.cat.empty')) + '</div>';
    else {
        body = list.map(function (a) {
            var color = a.status === 'active' ? '#30d158' : (a.status === 'incident' ? '#ff453a' : '#8e8e93');
            return '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc(a.title) + ' ' +
                chip(t('asr.status.' + a.status), color) + '</div>' +
                '<div class="rg-row-meta">' + esc(t('asr.cat.' + a.category)) + ' · ' + esc(a.devName) + '</div></div>' +
                '<div class="rg-val" style="color:' + _qualityColor(a.quality) + '">' + Math.round(a.quality) + '</div></div>';
        }).join('');
    }
    return '<div class="card"><div class="card-title">' + esc(t('asr.cat.title')) + '</div>' + body + '</div>';
}

function _historyLabel(h) {
    var dec;
    if (h.decision === 'approve') dec = t(h.auto ? 'asr.hist.approveAuto' : 'asr.hist.approve');
    else if (h.decision === 'reject') dec = t('asr.hist.reject', { reason: t('asr.reason.' + h.reason) });
    else dec = t('asr.hist.' + h.decision);
    return dec + ' · ' + t('asr.out.' + h.outcome);
}

function _historyCard(sys) {
    var list = sys.getHistory(8);
    var body;
    if (!list.length) body = '<div class="rg-desc">' + esc(t('asr.hist.empty')) + '</div>';
    else {
        body = list.map(function (h) {
            return '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc(h.title) + (h.devName ? ' · ' + esc(h.devName) : '') + '</div>' +
                '<div class="rg-row-meta">' + esc(_historyLabel(h)) + '</div></div>' +
                (h.fee ? '<div class="rg-val">' + (h.fee > 0 ? '+' : '-') + money(Math.abs(h.fee)) + '</div>' : '') + '</div>';
        }).join('');
    }
    return '<div class="card"><div class="card-title">' + esc(t('asr.hist.title')) + '</div>' + body + '</div>';
}

// Jumlah pengiriman yang menunggu (untuk lencana di tombol sub-tab).
export function getAppReviewPendingCount(sys) {
    try { return sys && sys.isAvailable() ? sys.getSummary().pending : 0; } catch (e) { return 0; }
}

export function renderAppStoreReviewPanel(params) {
    ensureRegionalStyle();
    var sys = params.appReviewSystem;
    if (!sys) return '';
    if (!sys.isAvailable()) {
        return '<div class="card"><div class="card-title">' + esc(t('asr.title')) + '</div>' +
            '<div class="rg-desc">' + esc(t('asr.unavailable')) + '</div></div>';
    }
    var sum = sys.getSummary();
    var pol = sys.getPolicy();
    return _summaryCard(sum) + _incidentCard(sys) + _queueSection(sys, pol) + _policyCard(pol) +
        _developersCard(sys) + _catalogCard(sys) + _historyCard(sys);
}
