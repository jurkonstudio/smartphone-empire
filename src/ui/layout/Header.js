// FILE: src/ui/layout/Header.js
// v2027.29a — company level badge.
import { generateLogo } from '../avatars/AvatarGenerator.js';
import { t } from '../../core/LanguageService.js';

function _getCompanyLevel(state) {
    var milestones = (state.milestones || []).length;
    var products = (state.products && state.products.catalog) ? state.products.catalog.length : 0;
    var research = (state.research && state.research.completed) ? state.research.completed.length : 0;
    var staff = (state.staff || []).length;
    var score = milestones + products * 3 + Math.floor(research / 3) + Math.floor(staff / 2);
    if (score >= 60) return 5;
    if (score >= 35) return 4;
    if (score >= 18) return 3;
    if (score >= 6)  return 2;
    return 1;
}

export function renderHeader({ state, timeSnapshot, warning }) {
    const time = timeSnapshot;
    const hh = String(Math.floor(time.currentHour)).padStart(2, '0');
    const mm = String(Math.floor(time.currentMinute)).padStart(2, '0');
    const status = time.isPaused ? t('header.paused') : (time.gameSpeed + 'x');
    const statusCls = time.isPaused ? '' : 'running';

    const mKey = 'date.month.' + (time.currentMonth || 1);
    const mShort = t(mKey);
    const monthLabel = (mShort === mKey) ? String(time.currentMonth || 1) : mShort;
    const dateStr = t('header.day_prefix') + ' ' + time.currentDay + ' ' + monthLabel + ' ' + time.currentYear;

    const warnBadge = warning ? `<span class="header-warn">⚠ ${warning}</span>` : '';
    const pauseAria = time.isPaused ? t('header.play_aria') : t('header.pause_aria');

    const level = _getCompanyLevel(state);

    return `
        <div class="header-inner">
            <div class="header-row">
                <button class="header-company-btn" data-nav="profile" aria-label="${t('header.company_aria')}">
                    ${generateLogo(state.companyName, { size: 26 })}
                    <span class="header-company">${state.companyName}</span>
                    <span class="header-chevron">›</span>
                </button>
                <span class="header-level" data-level="${level}">Lv.${level}</span>
                ${warnBadge}
                <div class="header-cash-wrap">
                    <div class="header-cash" data-cash>$${state.cash.toLocaleString('en-US')}</div>
                    <div class="header-cash-delta" data-cash-delta aria-hidden="true"></div>
                </div>
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
                    <button class="btn-icon" data-time-action="toggle-pause" aria-label="${pauseAria}">
                        ${time.isPaused ? '▶' : '❚❚'}
                    </button>
                    <button class="btn-icon" data-time-action="cycle-speed" aria-label="${t('header.speed_aria')}">⏩</button>
                </div>
            </div>
        </div>
    `;
}
