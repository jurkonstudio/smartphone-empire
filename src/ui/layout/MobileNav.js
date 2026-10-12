// FILE: src/ui/layout/MobileNav.js
// ============================================================
// Bottom nav dengan Liquid Glass slider.
// Slider diposisikan oleh main.js via updateNavSlider().
// ============================================================
import { NAV_ITEMS } from '../../config/constants.js';
import { getNavIcon } from '../icons/NavIcons.js';

export function renderMobileNav(params) {
    var active = params && params.active ? params.active : null;

    var slider = '<div class="nav-slider" aria-hidden="true"></div>';

    var btns = '';
    for (var i = 0; i < NAV_ITEMS.length; i++) {
        var item = NAV_ITEMS[i];
        var cls = active === item.id ? 'active' : '';
        btns +=
            '<button class="nav-btn ' + cls + '"' +
            ' data-nav="' + item.id + '"' +
            ' aria-label="' + item.label + '"' +
            ' aria-current="' + (active === item.id ? 'page' : 'false') + '">' +
            '<span class="nav-ico" aria-hidden="true">' + getNavIcon(item.id) + '</span>' +
            '<span class="nav-label">' + item.label + '</span>' +
            '</button>';
    }
    return slider + btns;
}
