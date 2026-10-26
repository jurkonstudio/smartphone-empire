// FILE: src/ui/panels/OverviewSignals.js  (BARU — Overview v2)
// Sinyal bersama untuk panel Overview: perhitungan runway dan daftar "perlu perhatian".
// Hanya MEMBACA state. Tidak ada perubahan ekonomi di sini.
import { t } from '../../core/LanguageService.js';
import { escapeHtml } from '../../utils/html.js';
import { BALANCE } from '../../data/balance.data.js';

export var RUNWAY_CAP_MONTHS = 24;

// Runway dihitung dari laporan bulan terakhir, sama seperti sebelumnya.
export function computeRunway(state) {
    var hist = (state.finance && Array.isArray(state.finance.history)) ? state.finance.history : [];
    var last = hist[0] || null;
    var cash = Number(state.cash) || 0;
    if (!last) return { kind: 'nodata', months: null, pct: 0, tone: 'var(--text-secondary)' };
    if (cash <= 0) return { kind: 'empty', months: 0, pct: 0, tone: 'var(--danger)' };
    var income = Number(last.income) || 0, expense = Number(last.expense) || 0;
    if (income >= expense) return { kind: 'positive', months: null, pct: 100, tone: 'var(--success)' };
    var months = cash / (expense - income);
    var tone = months < 2 ? 'var(--danger)' : months < 6 ? 'var(--warn)' : 'var(--info)';
    var pct = Math.max(0, Math.min(100, (months / RUNWAY_CAP_MONTHS) * 100));
    return { kind: 'months', months: months, pct: pct, tone: tone };
}

export function runwayText(r) {
    if (r.kind === 'nodata') return t('ov.runway.nodata');
    if (r.kind === 'empty') return t('ov.runway.empty');
    if (r.kind === 'positive') return t('ov.runway.positive');
    return t('ov.runway.months', { n: (Math.round(r.months * 10) / 10).toString() });
}

// Jumlah tim (insinyur, desainer, pemasar) dan moral rata-rata. null bila sistem tim tidak tersedia.
export function teamCounts(teamSystem) {
    var total = 0, morale = 0;
    try {
        if (teamSystem && typeof teamSystem.getTeamCounts === 'function') {
            var c = teamSystem.getTeamCounts();
            total = (c.engineers || 0) + (c.designers || 0) + (c.marketers || 0);
        } else return null;
        if (teamSystem && typeof teamSystem.getAverageMorale === 'function') morale = teamSystem.getAverageMorale();
    } catch (e) { return null; }
    return { total: total, morale: morale };
}

// Daftar hal yang perlu perhatian pemain, diurutkan dari yang paling mendesak.
// Setiap item: key (untuk menyorot aksi cepat), tone, label, dan tujuan navigasi.
export function computeAttention(state, teamSystem) {
    var items = [];
    var r = computeRunway(state);
    var neg = (state.finance && state.finance.negativeMonths) || 0;
    var rep = (state.market && typeof state.market.reputation === 'number') ? state.market.reputation : null;
    var fb = state.feedback || {};
    var viral = (fb.activeViral || [])[0];
    var catalog = (state.products && state.products.catalog) || [];
    var selling = catalog.filter(function (p) { return p.status === 'selling'; }).length;
    var team = teamCounts(teamSystem);

    if (r.kind === 'empty' || (r.kind === 'months' && r.months < 2)) {
        items.push({ key: 'runway', tone: 'var(--danger)', label: runwayText(r), nav: 'market' });
    }
    if (neg > 0) {
        items.push({ key: 'neg', tone: 'var(--danger)',
            label: t('ov.runway.neg', { n: neg, max: BALANCE.gameOverNegativeMonths }), nav: 'market' });
    }
    if (team && team.total === 0) {
        items.push({ key: 'team', tone: 'var(--warn)', label: t('kpi.team_empty'), hq: 'team' });
    }
    if (rep != null && rep < 40) {
        items.push({ key: 'rep', tone: 'var(--danger)', label: t('kpi.rep_low'), nav: 'market' });
    }
    if (viral && viral.type === 'negative') {
        items.push({ key: 'viral', tone: 'var(--danger)', label: '⚠ ' + String(viral.title || ''), nav: 'market' });
    }
    if (catalog.length === 0 || selling === 0) {
        items.push({ key: 'release', tone: 'var(--warn)', label: t('ov.qa.release'), nav: 'products' });
    }
    return items;
}

// Strip perhatian. Kosong bila semua baik, sehingga tata letak tidak menambah ruang yang tidak perlu.
export function renderAttentionStrip(items) {
    if (!items || !items.length) return '';
    var chips = items.map(function (it) {
        var attr = it.hq ? 'data-hq-subtab="' + it.hq + '"' : 'data-nav="' + it.nav + '"';
        return '<button type="button" class="ov-attn-chip" ' + attr + ' style="--ov-tone:' + it.tone + ';">' +
            '<span class="ov-attn-dot"></span>' + escapeHtml(it.label) + '</button>';
    }).join('');
    return '<section class="ov-sec ov-attn" aria-label="attention">' + chips + '</section>';
}
