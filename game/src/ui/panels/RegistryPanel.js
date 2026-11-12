// FILE: src/ui/panels/RegistryPanel.js  (BARU)
// Kotak "Ekstensi sendiri" di dalam kartu Registrar (panel Future). Hanya HTML; aksi ditangani main.js lewat data-rg="tld-...".
import { t } from '../../core/LanguageService.js';
import { REGISTRY_CONFIG as C, REGISTRY_EXTENSIONS } from '../../data/registry.data.js';
import {
    ensureRegistryState, isRegistryOpen, canStartRegistry, getRegistryOutlook, getRegistryCost, describeRegistry,
    getActiveRound, getNextRoundYear, getCompetitorCandidates
} from '../../systems/RegistrySystem.js';

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function usd(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }
function row(label, val, cls) { return '<div class="uc-row"><span>' + esc(label) + '</span><b class="' + (cls || '') + '">' + esc(val) + '</b></div>'; }
function box(inner) { return '<div class="uc-box"><div class="uc-title">' + esc(t('registry.title')) + '</div>' + inner + '</div>'; }

function liveHtml(data) {
    var d = describeRegistry(data);
    if (!d.count) return '';
    var list = d.state.live.map(function (x) {
        return row(x.ext, t('registry.phase.' + x.phase) + ' · ' + Math.round(x.domains).toLocaleString('en-US'), x.phase === 'general' ? 'good' : '');
    }).join('');
    return '<div class="uc-title" style="margin-top:8px">' + esc(t('registry.live.title')) + '</div><div class="uc-rows">' + list +
        row(t('registry.live.revenue'), usd(d.gross), '') + row(t('registry.live.cost'), usd(d.cost), '') +
        row(t('registry.live.profit'), usd(d.net), d.net < 0 ? 'bad' : 'good') + '</div>';
}

function appHtml(data, a) {
    var head = row(a.ext, t('registry.phase.' + a.phase), '');
    if (a.phase === 'contest') {
        var btns = C.bidOptions.map(function (v) {
            var can = (data.cash || 0) >= v;
            return '<button class="uc-btn uc-wide" style="margin-top:6px"' + (can ? '' : ' disabled') + ' data-rg="tld-bid" data-rg-n="' + v + '">' + esc(t('registry.contest.bid', { amount: usd(v) })) + '</button>';
        }).join('');
        return '<div class="uc-rows">' + head + '</div><div class="uc-note warn">' +
            esc(t('registry.contest.desc', { ext: a.ext, refund: usd((a.fee || 0) * C.withdrawRefund), n: a.daysLeft })) + '</div>' + btns +
            '<button class="uc-btn uc-wide" style="margin-top:6px" data-rg="tld-withdraw">' + esc(t('registry.contest.withdraw')) + '</button>';
    }
    if (a.phase === 'offer') {
        var can2 = (data.cash || 0) >= C.annualFee;
        return '<div class="uc-rows">' + head + '</div><div class="uc-note ok">' + esc(t('registry.offer.desc', { ext: a.ext, fee: usd(C.annualFee), n: a.daysLeft })) + '</div>' +
            '<button class="uc-btn uc-wide active" style="margin-top:6px"' + (can2 ? '' : ' disabled') + ' data-rg="tld-sign">' + esc(t('registry.offer.sign')) + '</button>' +
            (can2 ? '' : '<div class="uc-note warn">' + esc(t('registry.offer.cash')) + '</div>');
    }
    return '<div class="uc-rows">' + head + '</div><div class="uc-note ok">' + esc(t('registry.wait', { n: Math.max(1, a.monthsLeft) })) + '</div>';
}

function formHtml(data, g) {
    var picks = REGISTRY_EXTENSIONS.map(function (e) {
        return '<button class="uc-btn ' + (g.draft.ext === e.id ? 'active' : '') + '" style="flex:none;padding:0 10px;min-height:28px;margin:2px" data-rg="tld-pick" data-rg-id="' + esc(e.id) + '">' +
            esc(e.ext) + ' · ' + esc(t('registry.type.' + e.type)) + '</button>';
    }).join('');
    var year = (data.time || {}).currentYear || 0, round = getActiveRound(year), fee = round ? round.applicationFee : 0;
    var cands = getCompetitorCandidates(data), chosen = g.draft.sponsorIds || [];
    var sp = cands.map(function (c) {
        var on = chosen.indexOf(c.id) !== -1;
        return '<button class=\"uc-btn ' + (on ? 'active' : '') + '\" style=\"flex:none;padding:0 10px;min-height:28px;margin:2px\" data-rg=\"tld-sponsor\" data-rg-id=\"' + esc(c.id) + '\">' + esc(c.name) + '</button>';
    }).join('') || '<div class=\"uc-note warn\">' + esc(t('registry.sponsors_none')) + '</div>';
    var chk = canStartRegistry(data), msg = '';
    var n = chosen.length;
    if (!chk.ok) {
        if (chk.reason === 'pick') msg = t('registry.need_pick');
        else if (chk.reason === 'cash') msg = t('registry.need_cash');
        else if (chk.reason === 'owned') msg = t('registry.owned');
        else if (chk.reason === 'cooldown') msg = t('registry.cooldown', { n: chk.months });
        else if (chk.reason === 'locked') msg = t('registry.locked', { year: getNextRoundYear(year) || '' });
    }
    var advisor = '';
    if (g.draft.ext) {
        var o = getRegistryOutlook(data, g.draft.ext, chosen);
        var why = o.reasons.map(function (k) { return t('registry.advisor.why.' + k); }).join(' ');
        advisor = '<div class="uc-note ' + (o.level === 'high' ? 'ok' : 'warn') + '">' + esc(t('registry.advisor.label')) + ': ' + esc(t('registry.advisor.' + o.level)) + (why ? ' ' + esc(why) : '') + '</div>';
    }
    return '<div class="uc-desc">' + esc(t('registry.desc')) + '</div>' +
        '<div class="uc-seginfo">' + esc(t('registry.pick')) + '</div><div style="display:flex;flex-wrap:wrap">' + picks + '</div>' +
        '<div class="uc-seginfo" style="margin-top:6px">' + esc(t('registry.sponsors')) + ' — ' + esc(t('registry.sponsors_hint', { cost: usd(C.sponsorCost) })) + '</div><div style="display:flex;flex-wrap:wrap">' + sp + '</div>' +
        '<div class="uc-rows">' + row(t('registry.fee'), usd(fee), '') + row(t('registry.total'), usd(getRegistryCost(n, fee)), '') + '</div>' + advisor +
        (msg ? '<div class="uc-note warn">' + esc(msg) + '</div>' : '') +
        '<button class="uc-btn uc-wide" style="margin-top:8px"' + (chk.ok ? '' : ' disabled') + ' data-rg="tld-submit">' + esc(t('registry.submit')) + '</button>';
}

export function renderRegistryBox(data) {
    var g = ensureRegistryState(data);
    if (!isRegistryOpen(data)) return box('<div class="uc-note warn">' + esc(t('registry.locked', { year: getNextRoundYear((data.time || {}).currentYear || 0) || '' })) + '</div>');
    return box((g.app ? appHtml(data, g.app) : formHtml(data, g)) + liveHtml(data));
}
