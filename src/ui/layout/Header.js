// FILE: src/ui/layout/Header.js
import { getMonthName } from '../../core/TimeSystem.js';
import { generateLogo } from '../avatars/AvatarGenerator.js';

export function renderHeader({ state, timeSnapshot, warning }) {
    const t = timeSnapshot;
    const hh = String(Math.floor(t.currentHour)).padStart(2, '0');
    const mm = String(Math.floor(t.currentMinute)).padStart(2, '0');
    const status = t.isPaused ? 'Paused' : (t.gameSpeed + 'x');
    const statusCls = t.isPaused ? '' : 'running';
    const dateStr = t.currentDay + ' ' + getMonthName(t.currentMonth, true) + ' ' + t.currentYear;

    const warnBadge = warning ? `<span class="header-warn">⚠ ${warning}</span>` : '';

    return `
        <div class="header-inner">
            <div class="header-row">
                <button class="header-company-btn" data-nav="profile" aria-label="Profil perusahaan">
                    ${generateLogo(state.companyName, { size: 26 })}
                    <span class="header-company">${state.companyName}</span>
                    <span class="header-chevron">›</span>
                </button>
                ${warnBadge}
                <div class="header-cash" data-cash>$${state.cash.toLocaleString('en-US')}</div>
            </div>
            <div class="header-row">
                <div class="header-meta">
                    <span data-time-date>${dateStr}</span>
                    <span>•</span>
                    <span data-time-clock>${hh}:${mm}</span>
                    <span>•</span>
                    <span class="header-status ${statusCls}" data-time-status>${status}</span>
                </div>
                <div class="header-controls">
                    <button class="btn-icon" data-time-action="toggle-pause" aria-label="${t.isPaused ? 'Mulai' : 'Jeda'}">
                        ${t.isPaused ? '▶' : '❚❚'}
                    </button>
                    <button class="btn-icon" data-time-action="cycle-speed" aria-label="Kecepatan">⏩</button>
                </div>
            </div>
        </div>
    `;
}
