// FILE: src/ui/panels/TimePanel.js
import { getMonthName } from '../../core/TimeSystem.js';

export function renderTimePanel(t) {
    const hh = String(Math.floor(t.currentHour)).padStart(2, '0');
    const mm = String(Math.floor(t.currentMinute)).padStart(2, '0');
    const statusLabel = t.isPaused ? 'Paused' : (t.gameSpeed + 'x');
    const statusCls = t.isPaused ? '' : 'running';
    const totalMinutes = Math.floor(t.elapsedGameMinutes);
    const dateStr = t.currentDay + ' ' + getMonthName(t.currentMonth) + ' ' + t.currentYear;

    return `
        <div class="card">
            <div class="card-title">Waktu Simulasi</div>
            <div style="font-size:15px;font-weight:700;">${dateStr}</div>
            <div style="font-size:12px;color:var(--text-dim);margin-top:6px;line-height:1.6;">
                Pukul <b style="color:var(--text)">${hh}:${mm}</b>
                &nbsp;•&nbsp;
                <span class="header-status ${statusCls}">${statusLabel}</span>
                <br>
                Total ${totalMinutes.toLocaleString('id-ID')} menit game berjalan
            </div>
        </div>
    `;
}
