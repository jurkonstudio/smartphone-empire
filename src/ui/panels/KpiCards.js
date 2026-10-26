// FILE: src/ui/panels/KpiCards.js
// v2027.31a — HQ Overview: Hero Finance + grid metrik 2x2 (Reputasi, Sentimen, Tim, Era).
// Hanya MEMBACA state. Hook live yang dipertahankan: [data-cash], [data-kpi-year].
import { t } from '../../core/LanguageService.js';
import { formatCurrency, formatCompactMoney, roundScore } from '../../utils/format.js';
import { BALANCE } from '../../data/balance.data.js';
import { getEraById, getEraForYear } from '../../data/ui-era.data.js';
import { computeRunway, runwayText } from './OverviewSignals.js';

// ---- Ikon SVG kecil (stroke, mengikuti currentColor) ----
var _ICONS = {
    coin:   '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M15 9.5c-.5-.9-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.6-3-1.5"/>',
    star:   '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    chat:   '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    users:  '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    phone:  '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
    up:     '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    down:   '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
    flame:  '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    flask:  '<path d="M10 2v7.53L4.5 19A2 2 0 0 0 6.2 22h11.6a2 2 0 0 0 1.7-3L14 9.53V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    hire:   '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>',
    news:   '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>',
    pulse:  '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    warn:   '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    clock:  '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>'
};

export function ovIcon(name, size) {
    var s = size || 15;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        (_ICONS[name] || '') + '</svg>';
}

function _monthName(m) {
    var key = 'date.month.' + (m || 1);
    var v = t(key);
    return v === key ? String(m) : v;
}

function _hist(state) {
    return (state.finance && Array.isArray(state.finance.history)) ? state.finance.history : [];
}

// Sparkline kas dari riwayat keuangan (lama -> baru). Kosong bila data belum cukup.
function _sparkCash(state) {
    var hist = _hist(state).slice().reverse();
    if (hist.length < 2) return '';
    var vals = hist.map(function (h) { return Number(h.cash) || 0; });
    var w = 300, h = 46, mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
    if (mx === mn) { mx += 1; mn -= 1; }
    var pts = vals.map(function (v, i) {
        var x = (i / (vals.length - 1)) * w;
        var y = h - ((v - mn) / (mx - mn)) * (h - 6) - 3;
        return x.toFixed(1) + ',' + y.toFixed(1);
    });
    var area = '0,' + h + ' ' + pts.join(' ') + ' ' + w + ',' + h;
    return '<div class="ov-spark-wrap"><svg class="ov-spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">' +
        '<polygon points="' + area + '" fill="var(--ov-tone,var(--accent))" opacity=".12"/>' +
        '<polyline points="' + pts.join(' ') + '" fill="none" stroke="var(--ov-tone,var(--accent))" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
        '</svg></div>';
}

// ============================================================
// BAGIAN 1 — HERO FINANCE
// ============================================================
export function renderHeroFinance(state) {
    var cash = Number(state.cash) || 0;
    var last = _hist(state)[0] || null;
    var negMonths = (state.finance && state.finance.negativeMonths) || 0;

    var income = last ? (Number(last.income) || 0) : null;
    var expense = last ? (Number(last.expense) || 0) : null;
    var net = last ? (Number(last.net) || 0) : null;

    // --- baris delta (net bulan lapor terakhir) ---
    var deltaHtml;
    if (last) {
        var dCls = net > 0 ? 'up' : net < 0 ? 'down' : 'flat';
        var arrow = net > 0 ? '▲' : net < 0 ? '▼' : '■';
        deltaHtml = '<span class="ov-delta ' + dCls + '">' + arrow + ' ' + formatCompactMoney(net, { plus: true }) + '</span>' +
            '<span class="ov-muted">' + t('ov.net_month', { m: _monthName(last.month) }) + '</span>';
    } else {
        deltaHtml = '<span class="ov-muted">' + t('ov.no_report') + '</span>';
    }

    // --- runway (dihitung di OverviewSignals agar sama dengan daftar perhatian) ---
    var rw = computeRunway(state);
    var runTone = rw.tone;
    var runText = runwayText(rw);
    var runPct = rw.pct;

    var warnHtml = '';
    if (negMonths > 0) {
        warnHtml = '<div class="ov-runway" style="--ov-tone:var(--danger);">' + ovIcon('warn', 14) +
            '<span>' + t('ov.runway.neg', { n: negMonths, max: BALANCE.gameOverNegativeMonths }) + '</span></div>';
    }

    return '<section class="ov-sec ov-hero' + (cash < 0 ? ' ov-hero--neg' : '') + '">' +
        '<div class="ov-hero-top">' +
            '<span class="ov-label">' + t('kpi.cash') + '</span>' +
            '<span class="ov-chip" style="--ov-tone:var(--accent);">' + ovIcon('coin') + '</span>' +
        '</div>' +
        '<div class="ov-hero-value" data-cash' + (cash < 0 ? ' style="color:var(--danger);"' : '') + '>' + formatCurrency(cash) + '</div>' +
        '<div class="ov-hero-sub">' + deltaHtml + '</div>' +
        _sparkCash(state) +
        '<div class="ov-split">' +
            '<div class="ov-stat" style="--ov-tone:var(--success);">' +
                '<div class="ov-stat-top"><span class="ov-label">' + t('ov.income') + '</span>' + ovIcon('up', 14) + '</div>' +
                '<div class="ov-stat-value">' + (last ? formatCompactMoney(income) : '—') + '</div>' +
            '</div>' +
            '<div class="ov-stat" style="--ov-tone:var(--danger);">' +
                '<div class="ov-stat-top"><span class="ov-label">' + t('ov.burn') + '</span>' + ovIcon('flame', 14) + '</div>' +
                '<div class="ov-stat-value">' + (last ? formatCompactMoney(expense) : '—') + '</div>' +
            '</div>' +
        '</div>' +
        '<div class="ov-runway" style="--ov-tone:' + runTone + ';">' + ovIcon('clock', 14) + '<span data-ov-live="runway-text">' + runText + '</span></div>' +
        '<div class="ov-runway-bar" style="--ov-tone:' + runTone + ';"><i data-ov-live="runway-bar" style="width:' + runPct.toFixed(1) + '%;"></i></div>' +
        warnHtml +
    '</section>';
}

// ============================================================
// BAGIAN 2 — COMPANY METRICS GRID 2x2
// ============================================================
function _metric(o) {
    return '<div class="ov-metric" style="--ov-tone:' + o.tone + ';">' +
        '<div class="ov-metric-top">' +
            '<span class="ov-label">' + o.label + '</span>' +
            '<span class="ov-chip">' + ovIcon(o.icon) + '</span>' +
        '</div>' +
        '<div class="ov-metric-value">' + o.value + (o.unit ? '<span class="ov-metric-unit">' + o.unit + '</span>' : '') + '</div>' +
        '<div class="ov-meter' + (o.pct == null ? ' ov-meter--off' : '') + '" style="--w:' + (o.pct == null ? 0 : Math.max(0, Math.min(100, o.pct))) + '%;"><i></i></div>' +
        '<div class="ov-metric-sub">' + o.sub + '</div>' +
    '</div>';
}

function _sentimentInfo(s) {
    if (s >= 70) return { label: t('opinion.sentiment.very_good'), tone: 'var(--success)' };
    if (s >= 55) return { label: t('opinion.sentiment.good'),      tone: 'var(--info)' };
    if (s >= 45) return { label: t('opinion.sentiment.neutral'),   tone: 'var(--text-secondary)' };
    if (s >= 30) return { label: t('opinion.sentiment.bad'),       tone: 'var(--warn)' };
    return { label: t('opinion.sentiment.very_bad'), tone: 'var(--danger)' };
}

export function renderMetricsGrid(state, timeSnapshot, teamSystem) {
    var snap = timeSnapshot || {};

    // Reputasi
    var rep = (state.market && typeof state.market.reputation === 'number') ? state.market.reputation : 0;
    var repLabel = rep >= 70 ? t('kpi.rep_high') : rep >= 40 ? t('kpi.rep_mid') : t('kpi.rep_low');
    var repTone = rep >= 70 ? 'var(--success)' : rep >= 40 ? 'var(--warn)' : 'var(--danger)';

    // Sentimen (dibulatkan HANYA untuk tampilan)
    var fb = state.feedback || {};
    var sent = roundScore(fb.sentiment != null ? fb.sentiment : 50);
    var sInfo = _sentimentInfo(sent);

    // Tim
    var teamTotal = 0, morale = 0;
    try {
        if (teamSystem && typeof teamSystem.getTeamCounts === 'function') {
            var c = teamSystem.getTeamCounts();
            teamTotal = (c.engineers || 0) + (c.designers || 0) + (c.marketers || 0);
        }
        if (teamSystem && typeof teamSystem.getAverageMorale === 'function') {
            morale = teamSystem.getAverageMorale();
        }
    } catch (e) { /* diamkan */ }
    var moraleTone = teamTotal === 0 ? 'var(--text-tertiary)'
        : (morale >= 70 ? 'var(--success)' : morale >= 40 ? 'var(--warn)' : 'var(--danger)');

    // Era (progres di dalam era, dari data era yang sudah ada)
    var year = snap.currentYear || 2000;
    var era = state.era ? getEraById(state.era) : getEraForYear(year);
    var eraKey = 'profile.era.' + era.id;
    var eraName = t(eraKey);
    if (eraName === eraKey) eraName = era.label;
    var eraPct = (era.toYear >= 9999) ? null
        : ((year - era.fromYear) / (era.toYear - era.fromYear + 1)) * 100;

    return '<section class="ov-sec ov-metrics">' +
        _metric({ label: t('kpi.reputation'), icon: 'star', tone: repTone,
                  value: Number(rep).toFixed(1), pct: rep, sub: repLabel }) +
        _metric({ label: t('dashboard.sentiment'), icon: 'chat', tone: sInfo.tone,
                  value: String(sent), unit: '/100', pct: sent, sub: sInfo.label }) +
        _metric({ label: t('kpi.team'), icon: 'users', tone: moraleTone,
                  value: String(teamTotal), pct: teamTotal === 0 ? 0 : morale,
                  sub: teamTotal === 0 ? t('kpi.team_empty') : t('kpi.team_morale', { n: morale }) }) +
        _metric({ label: t('ov.era'), icon: 'phone', tone: 'var(--accent)',
                  value: '<span data-kpi-year>' + year + '</span>', pct: eraPct, sub: eraName }) +
    '</section>';
}

// Kompatibilitas: pemanggil lama tetap jalan.
export function renderKpiCards(state, timeSnapshot, teamSystem) {
    return renderHeroFinance(state) + renderMetricsGrid(state, timeSnapshot, teamSystem);
}
