// FILE: src/ui/layout/Sidebar.js
// Sidebar hanya untuk desktop. Saat ini disembunyikan via CSS (mobile-first).
import { NAV_ITEMS } from '../../config/constants.js';

export function renderSidebar({ active }) {
    return `
        <div style="padding:14px 10px; display:flex; flex-direction:column; gap:6px; width:100%;">
            ${NAV_ITEMS.map(item => `
                <button class="nav-btn ${active === item.id ? 'active' : ''}"
                        data-nav="${item.id}"
                        style="flex-direction:row; justify-content:flex-start; gap:10px; padding:10px 12px; border-radius:8px; font-size:13px;">
                    <span class="nav-ico" aria-hidden="true">${item.icon}</span>
                    <span>${item.label}</span>
                </button>
            `).join('')}
        </div>
    `;
}
