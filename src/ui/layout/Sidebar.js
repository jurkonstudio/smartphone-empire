// FILE: src/ui/layout/Sidebar.js
// Sidebar desktop (>=768px). Tampil sebagai rail ikon di 768-1099px dan sidebar penuh di >=1100px.
// Di mobile elemen #sidebar disembunyikan lewat CSS (desktop.css), bottom nav tetap dipakai.
// Navigasi memakai atribut data-nav yang sama dengan bottom nav, jadi ditangani delegasi klik di main.js.
// Label mengikuti pola MobileNav.js (key 'nav.<id>', id 'dashboard' -> 'nav.home').
import { NAV_ITEMS } from '../../config/constants.js';
import { APP_CONFIG } from '../../config/app.config.js';
import { getNavIcon } from '../icons/NavIcons.js';
import { t } from '../../core/LanguageService.js';

var NAV_KEY_MAP = { dashboard: 'nav.home' };

function navLabel(item) {
    var key = NAV_KEY_MAP[item.id] || ('nav.' + item.id);
    var label = t(key);
    if (!label || label === key) label = item.label;
    return label;
}

function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function brandInitials() {
    var words = String(APP_CONFIG.name || 'SE').split(/\s+/);
    var out = '';
    for (var i = 0; i < words.length && out.length < 2; i++) {
        if (words[i]) out += words[i].charAt(0).toUpperCase();
    }
    return out || 'SE';
}

export function renderSidebar(params) {
    var active = params && params.active ? params.active : null;

    var btns = '';
    for (var i = 0; i < NAV_ITEMS.length; i++) {
        var item = NAV_ITEMS[i];
        var isActive = active === item.id;
        var label = esc(navLabel(item));
        btns +=
            '<button type="button" class="dk-nav-btn' + (isActive ? ' active' : '') + '"' +
            ' data-nav="' + item.id + '"' +
            ' aria-label="' + label + '" title="' + label + '"' +
            ' aria-current="' + (isActive ? 'page' : 'false') + '">' +
            '<span class="dk-nav-ico" aria-hidden="true">' + getNavIcon(item.id) + '</span>' +
            '<span class="dk-nav-label">' + label + '</span>' +
            '</button>';
    }

    return '' +
        '<div class="dk-side-brand" aria-hidden="true">' +
            '<span class="dk-side-logo">' + esc(brandInitials()) + '</span>' +
            '<span class="dk-side-name">' + esc(APP_CONFIG.name) + '</span>' +
        '</div>' +
        '<div class="dk-nav">' + btns + '</div>';
}
