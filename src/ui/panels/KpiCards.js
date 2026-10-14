// FILE: src/ui/panels/KpiCards.js
// v2027.13a — i18n.
import { t } from '../../core/LanguageService.js';

function _monthShort(m) {
    var key = 'date.month.' + (m || 1);
    var v = t(key);
    return v === key ? '' : v;
}

export function renderKpiCards(state, timeSnapshot, teamSystem) {
    var tSnap = timeSnapshot;
    var monthShort = _monthShort(tSnap.currentMonth);

    var rep = (state.market && typeof state.market.reputation === 'number')
        ? state.market.reputation : 0;
    var repLabel = rep >= 70 ? t('kpi.rep_high') : rep >= 40 ? t('kpi.rep_mid') : t('kpi.rep_low');
    var repColor = rep >= 70 ? 'var(--success)' : rep >= 40 ? 'var(--warn)' : 'var(--danger)';

    var teamTotal = 0;
    var morale = 0;
    try {
        if (teamSystem && typeof teamSystem.getTeamCounts === 'function') {
            var c = teamSystem.getTeamCounts();
            teamTotal = (c.engineers || 0) + (c.designers || 0) + (c.marketers || 0);
        }
        if (teamSystem && typeof teamSystem.getAverageMorale === 'function') {
            morale = teamSystem.getAverageMorale();
        }
    } catch (e) { /* diamkan */ }

    var moraleLabel = teamTotal === 0
        ? t('kpi.team_empty')
        : t('kpi.team_morale', { n: morale });
    var moraleColor = teamTotal === 0
        ? 'var(--text-tertiary)'
        : (morale >= 70 ? 'var(--success)' : morale >= 40 ? 'var(--warn)' : 'var(--danger)');

    return '<div class="kpi-grid">' +
        '<div class="kpi">' +
            '<div class="kpi-label">' + t('kpi.cash') + '</div>' +
            '<div class="kpi-value" data-cash style="color:var(--accent);">$' + state.cash.toLocaleString('en-US') + '</div>' +
        '</div>' +
        '<div class="kpi green">' +
            '<div class="kpi-label">' + t('kpi.reputation') + '</div>' +
            '<div class="kpi-value">' + rep + '</div>' +
            '<div class="kpi-sub" style="color:' + repColor + ';">' + repLabel + '</div>' +
        '</div>' +
        '<div class="kpi blue">' +
            '<div class="kpi-label">' + t('kpi.team') + '</div>' +
            '<div class="kpi-value">' + teamTotal + '</div>' +
            '<div class="kpi-sub" style="color:' + moraleColor + ';">' + moraleLabel + '</div>' +
        '</div>' +
        '<div class="kpi warn">' +
            '<div class="kpi-label">' + t('kpi.date') + '</div>' +
            '<div class="kpi-value"><span data-kpi-day>' + tSnap.currentDay + '</span> ' + monthShort + '</div>' +
            '<div class="kpi-sub" data-kpi-year>' + tSnap.currentYear + '</div>' +
        '</div>' +
        '</div>';
}
