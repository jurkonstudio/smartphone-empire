import { icon } from '../icons.js';
import { NAV_ITEMS } from '../../config/constants.js';
import { APP_CONFIG } from '../../config/app.config.js';

export function renderSidebar({ active }) {
  const items = NAV_ITEMS.map((item) => {
    const isActive = item.id === active;
    return `
      <button class="nav-item${isActive ? ' is-active' : ''}"
              type="button"
              data-nav="${item.id}"
              aria-current="${isActive ? 'page' : 'false'}">
        <span class="nav-item__icon">${icon(item.icon, 18)}</span>
        <span class="nav-item__label">${item.label}</span>
        ${item.badge ? `<span class="nav-item__badge">${item.badge}</span>` : ''}
      </button>
    `;
  }).join('');

  return `
    <div class="sidebar__brand">
      <div class="sidebar__logo">SE</div>
      <div>
        <div class="sidebar__title">${APP_CONFIG.name}</div>
        <div class="sidebar__sub">v${APP_CONFIG.version} · ${APP_CONFIG.milestone}</div>
      </div>
    </div>

    <div class="sidebar__section">Menu</div>
    <nav class="sidebar__nav">${items}</nav>

    <div class="sidebar__footer">
      <div class="sidebar__footer-row">
        <span class="dot dot--off"></span>
        <span>Cloud: belum terhubung</span>
      </div>
      <div class="sidebar__footer-row">
        <span class="dot dot--warn"></span>
        <span>Mode: DEMO</span>
      </div>
    </div>
  `;
}
