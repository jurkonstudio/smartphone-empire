import { NAV_ITEMS, MOBILE_NAV_IDS } from '../../config/constants.js';

export function renderMobileNav({ active }) {
    const mobileItems = NAV_ITEMS.filter(item => MOBILE_NAV_IDS.includes(item.id));
    
    return mobileItems.map(item => `
        <button data-nav="${item.id}" style="background:transparent; border:none; color:${active === item.id ? '#4CAF50' : '#aaa'}; font-size:12px; display:flex; flex-direction:column; align-items:center; cursor:pointer;">
            <span>${item.label}</span>
        </button>
    `).join('');
}
