// FILE: src/ui/panels/KpiCards.js
// Rework: 4 KPI (Uang, Reputasi, Tim, Tanggal).
// Hindari redundansi dengan header.

var MONTH_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

export function renderKpiCards(state, timeSnapshot, teamSystem) {
    var t = timeSnapshot;
    var monthShort = MONTH_SHORT[(t.currentMonth || 1) - 1] || '';

    var rep = (state.market && typeof state.market.reputation === 'number')
        ? state.market.reputation : 0;
    var repLabel = rep >= 70 ? 'Baik' : rep >= 40 ? 'Cukup' : 'Rendah';
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
        ? 'Belum ada tim'
        : 'Morale ' + morale + '/100';
    var moraleColor = teamTotal === 0
        ? 'var(--text-tertiary)'
        : (morale >= 70 ? 'var(--success)' : morale >= 40 ? 'var(--warn)' : 'var(--danger)');

    return '<div class="kpi-grid">' +
        '<div class="kpi">' +
            '<div class="kpi-label">Uang Tunai</div>' +
            '<div class="kpi-value" data-cash style="color:var(--accent);">$' + state.cash.toLocaleString('en-US') + '</div>' +
        '</div>' +
        '<div class="kpi green">' +
            '<div class="kpi-label">Reputasi</div>' +
            '<div class="kpi-value">' + rep + '</div>' +
            '<div class="kpi-sub" style="color:' + repColor + ';">' + repLabel + '</div>' +
        '</div>' +
        '<div class="kpi blue">' +
            '<div class="kpi-label">Tim</div>' +
            '<div class="kpi-value">' + teamTotal + '</div>' +
            '<div class="kpi-sub" style="color:' + moraleColor + ';">' + moraleLabel + '</div>' +
        '</div>' +
        '<div class="kpi warn">' +
            '<div class="kpi-label">Tanggal</div>' +
            '<div class="kpi-value"><span data-kpi-day>' + t.currentDay + '</span> ' + monthShort + '</div>' +
            '<div class="kpi-sub" data-kpi-year>' + t.currentYear + '</div>' +
        '</div>' +
        '</div>';
}
