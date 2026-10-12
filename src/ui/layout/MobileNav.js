// FILE: src/ui/layout/MobileNav.js
import { NAV_ITEMS } from '../../config/constants.js';

export function renderMobileNav({ active }) {
    return NAV_ITEMS.map(item => `
        <button class="nav-btn ${active === item.id ? 'active' : ''}"
                data-nav="${item.id}"
                aria-label="${item.label}"
                aria-current="${active === item.id ? 'page' : 'false'}">
            <span class="nav-ico" aria-hidden="true">${item.icon}</span>
            <span>${item.label}</span>
        </button>
    `).join('');
}
