// FILE: src/ui/panels/TimePanel.js
// v2027.13c — i18n.
import { getMonthName } from '../../core/TimeSystem.js';
import { t } from '../../core/LanguageService.js';

function _monthName(m) {
    var key = 'date.month_full.' + (m || 1);
    var v = t(key);
    return v === key ? getMonthName(m) : v;
}

export function renderTimePanel(tSnap) {
    const hh = String(Math.floor(tSnap.currentHour)).padStart(2, '0');
    const mm = String(Math.floor(tSnap.currentMinute)).padStart(2, '0');
    const statusLabel = tSnap.isPaused ? t('time.paused') : (tSnap.gameSpeed + 'x');
    const statusCls = tSnap.isPaused ? '' : 'running';
    const totalMinutes = Math.floor(tSnap.elapsedGameMinutes);
    const dateStr = tSnap.currentDay + ' ' + _monthName(tSnap.currentMonth) + ' ' + tSnap.currentYear;

    return `
        <div class="card">
            <div class="card-title">${t('time.title')}</div>
            <div style="font-size:15px;font-weight:700;">${dateStr}</div>
            <div style="font-size:12px;color:var(--text-dim);margin-top:6px;line-height:1.6;">
                ${t('time.clock', { hh: hh, mm: mm })}
                &nbsp;•&nbsp;
                <span class="header-status ${statusCls}">${statusLabel}</span>
                <br>
                ${t('time.elapsed', { n: totalMinutes.toLocaleString('en-US') })}
            </div>
        </div>
    `;
}
