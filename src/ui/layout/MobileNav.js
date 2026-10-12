import { icon } from '../icons.js';
import { NAV_ITEMS, MOBILE_NAV_IDS } from '../../config/constants.js';

export function renderMobileNav({ active }) {
  const items = MOBILE_NAV_IDS.map((id) => {
    const item = NAV_ITEMS.find((n) => n.id === id);
    if (!item) return '';
    const isActive = item.id === active;
    return `
      <button class="nav-item${isActive ? ' is-active' : ''}"
              type="button"
              data-nav="${item.id}"
              aria-current="${isActive ? 'page' : 'false'}">
        <span class="nav-item__icon">${icon(item.icon, 20)}</span>
        <span class="nav-item__label">${item.label}</span>
      </button>
    `;
  }).join('');
  return items;
}
