// FILE: src/ui/layout/Header.js
// v2027.18a — wallet: cash + silicon button.
// v2027.41 — chip countdown boost percepatan (data-time-boost).
// v2027.44 — ketuk nama perusahaan = buka Pusat Notifikasi (profil & nama ada di Pengaturan).
import { gIcon, ensureIconStyles } from '../icons/GameIcons.js';
ensureIconStyles();
import { generateLogo } from '../avatars/AvatarGenerator.js';
import { t } from '../../core/LanguageService.js';
import { formatCurrency } from '../../utils/format.js';
import { getUnreadCount, isNotificationPanelOpen } from '../notifications/NotificationRenderer.js';

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

    const unread = getUnreadCount();
    const unreadTxt = unread > 99 ? '99+' : String(unread);
    const notifOpen = isNotificationPanelOpen();

    const silicon = state.silicon != null ? state.silicon : 0;

    const sb = state.speedBoost;
    const boostOn = sb && sb.remainingSec > 0 && sb.speed > 1;
    const boostSec = boostOn ? Math.ceil(sb.remainingSec) : 0;
    const boostTxt = boostOn
        ? '⚡ ' + sb.speed + 'x · ' + String(Math.floor(boostSec / 60)).padStart(2, '0') + ':' + String(boostSec % 60).padStart(2, '0')
        : '';

    return `
        <div class="header-inner">
            <div class="header-row">
                <button class="header-company-btn" data-notif-toggle type="button" aria-haspopup="dialog" aria-expanded="${notifOpen}" aria-label="${t('header.notif_aria')}">
                    ${generateLogo(state.companyName, { size: 26 })}
                    <span class="header-company">${state.companyName}</span>
                    <span class="header-notif-badge" data-notif-badge ${unread > 0 ? '' : 'hidden'}>${unread > 0 ? unreadTxt : ''}</span>
                    <span class="header-chevron" aria-hidden="true">›</span>
                </button>
                ${warnBadge}
                <div class="header-wallet">
                    <div class="header-cash" data-cash>${formatCurrency(state.cash)}</div>
                    <button class="header-silicon" data-silicon-open type="button" aria-label="Silicon">
                        <span class="header-silicon-ico">${gIcon('sil', 16)}</span>
                        <span class="header-silicon-value" data-silicon-value>${silicon}</span>
                        <span class="header-silicon-plus" aria-hidden="true">+</span>
                    </button>
                </div>
            </div>
            <div class="header-row">
                <div class="header-meta">
                    <span data-time-date>${dateStr}</span>
                    <span>•</span>
                    <span data-time-clock>${hh}:${mm}</span>
                    <span>•</span>
                    <span class="header-status ${statusCls}" data-time-status>${status}</span>
                    <span class="header-boost" data-time-boost style="${boostOn ? '' : 'display:none;'}">${boostTxt}</span>
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
