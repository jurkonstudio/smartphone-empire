// FILE: src/ui/layout/Header.js
// v2027.18a — wallet: cash + silicon button.
// v2027.41 — chip countdown boost percepatan (data-time-boost).
// v2027.44 — ketuk nama perusahaan = buka Pusat Notifikasi (profil & nama ada di Pengaturan).
import { gIcon, ensureIconStyles } from '../icons/GameIcons.js';
ensureIconStyles();
import { generateLogo } from '../avatars/AvatarGenerator.js';
import { t, LanguageService } from '../../core/LanguageService.js';
import { SiliconService } from '../../systems/SiliconService.js';
import { formatCurrency } from '../../utils/format.js';
import { getUnreadCount, isNotificationPanelOpen } from '../notifications/NotificationRenderer.js';
import { InboxService } from '../../services/InboxService.js';

// [v2030] Chip runway permanen di header. Kecil agar muat di layar HP.
let _runwayCss = false;
function _ensureRunwayCss() {
    if (_runwayCss || typeof document === 'undefined' || !document.head) return;
    _runwayCss = true;
    const s = document.createElement('style');
    s.id = 'runway-chip-style';
    s.textContent = [
        '.header-runway{display:inline-flex;align-items:center;gap:3px;font-size:var(--fs-2xs,11px);font-weight:700;',
        'padding:2px 7px;border-radius:999px;margin-right:4px;flex-shrink:0;white-space:nowrap;',
        'background:var(--bg-3,#222);color:var(--success,#30a46c);border:1px solid var(--border,#444);font-variant-numeric:tabular-nums;}',
        '.header-runway.lvl-low{background:var(--warn,#f5b400);color:#1a1a1a;border-color:transparent;}',
        '.header-runway.lvl-danger{background:var(--danger,#e5484d);color:#fff;border-color:transparent;}'
    ].join('');
    document.head.appendChild(s);
}

function _rwL(id, en) {
    return LanguageService.getLang() === 'en' ? en : id;
}

export function renderRunwayChip(rw) {
    if (!rw) return '';
    _ensureRunwayCss();
    const m = rw.months;
    const unit = _rwL('bln', 'mo');
    const label = (m === Infinity) ? _rwL('aman', 'safe')
                : (m < 1 ? '&lt;1 ' + unit : Math.floor(m) + ' ' + unit);
    const cons = (rw.monthsConservative === Infinity) ? _rwL('aman', 'safe')
               : Math.max(0, Math.floor(rw.monthsConservative)) + ' ' + unit;
    const tip = _rwL(
        'Runway (bersih): ' + label + '. Tanpa pendapatan: ' + cons + '.',
        'Runway (net): ' + label + '. Without income: ' + cons + '.'
    );
    const lvl = rw.level === 'danger' ? 'lvl-danger' : (rw.level === 'low' ? 'lvl-low' : 'lvl-ok');
    return '<span class="header-runway ' + lvl + '" data-runway title="' + tip + '" aria-label="' + tip + '">⏳ ' + label + '</span>';
}

export function renderHeader({ state, timeSnapshot, warning, runway }) {
    const time = timeSnapshot;
    const hh = String(Math.floor(time.currentHour)).padStart(2, '0');
    const mm = String(Math.floor(time.currentMinute)).padStart(2, '0');
    const status = time.isPaused ? t('header.paused') : (time.gameSpeed + 'x');
    const statusCls = time.isPaused ? '' : 'running';

    const mKey = 'date.month.' + (time.currentMonth || 1);
    const mShort = t(mKey);
    const monthLabel = (mShort === mKey) ? String(time.currentMonth || 1) : mShort;
    const dateStr = t('header.day_prefix') + ' ' + time.currentDay + ' ' + monthLabel + ' ' + time.currentYear;

    // Chip runway menggantikan badge burn rate lama bila tersedia.
    const warnBadge = runway ? renderRunwayChip(runway) : (warning ? `<span class="header-warn">⚠ ${warning}</span>` : '');
    const pauseAria = time.isPaused ? t('header.play_aria') : t('header.pause_aria');

    const unread = getUnreadCount();
    const unreadTxt = unread > 99 ? '99+' : String(unread);
    const notifOpen = isNotificationPanelOpen();

    const inboxN = InboxService.getUnread();
    const inboxTxt = inboxN > 99 ? '99+' : String(inboxN);

    const silicon = SiliconService.getDisplayBalance();   // '…' sampai saldo server terkonfirmasi

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
                    <button class="btn-icon header-inbox" data-inbox-open type="button" aria-label="Pesan">
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
                        <span class="header-inbox-badge" data-inbox-badge ${inboxN > 0 ? '' : 'hidden'}>${inboxN > 0 ? inboxTxt : ''}</span>
                    </button>
                    <button class="btn-icon" data-time-action="toggle-pause" aria-label="${pauseAria}">
                        ${time.isPaused ? '▶' : '❚❚'}
                    </button>
                    <button class="btn-icon" data-time-action="cycle-speed" aria-label="${t('header.speed_aria')}">⏩</button>
                </div>
            </div>
        </div>
    `;
}
