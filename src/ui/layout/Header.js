import { icon } from '../icons.js';
import { VIEW_TITLES } from '../../config/constants.js';
import { APP_CONFIG } from '../../config/app.config.js';
import { formatMonthYear } from '../../utils/format.js';

export function renderHeader({ state, activeView = 'dashboard' }) {
  const s = state;
  const meta = VIEW_TITLES[activeView] || VIEW_TITLES.dashboard;
  const dateStr = formatMonthYear(s.time.year, s.time.month);

  return `
    <div class="header__mobile-brand">
      <div class="header__logo-sm">${s.company.initial}</div>
      <div class="header__titles">
        <div class="header__page">${meta.title}</div>
        <div class="header__crumb">${s.company.name}</div>
      </div>
    </div>

    <div class="header__right">
      <span class="header__chip" title="Waktu demo (belum ada clock nyata)">
        <span class="dot dot--warn"></span>
        <span class="mono">DEMO · ${dateStr}</span>
      </span>
      <span class="header__chip" title="${APP_CONFIG.cloud.message}">
        <span class="dot dot--off"></span>
        <span>Cloud: off</span>
      </span>
      <button class="header__icon-btn header__icon-btn--mobile-only"
              type="button"
              data-nav="settings"
              aria-label="Buka pengaturan">
        ${icon('settings', 18)}
      </button>
    </div>
  `;
}
