import { NAV_ITEMS } from '../../config/constants.js';

export function renderSidebar({ active }) {
    return `
        <div style="display:flex; flex-direction:column; gap:10px; padding:15px;">
            ${NAV_ITEMS.map(item => `
                <button data-nav="${item.id}" style="text-align:left; padding:12px; background:${active === item.id ? '#333' : 'transparent'}; color:${active === item.id ? '#4CAF50' : '#fff'}; border:none; border-radius:5px; cursor:pointer; font-size:14px;">
                    ${item.label}
                </button>
            `).join('')}
        </div>
    `;
}
