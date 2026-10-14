// FILE: src/ui/layout/MobileNav.js
// v2027.6a — label dari t('nav.<id>'). Fallback ke item.label kalau key tidak ada.
import { NAV_ITEMS } from '../../config/constants.js';
import { getNavIcon } from '../icons/NavIcons.js';
import { t } from '../../core/LanguageService.js';

export function renderMobileNav(params) {
    var active = params && params.active ? params.active : null;

    var slider = '<div class="nav-slider" aria-hidden="true"></div>';

    var btns = '';
    for (var i = 0; i < NAV_ITEMS.length; i++) {
        var item = NAV_ITEMS[i];
        var cls = active === item.id ? 'active' : '';
        var label = t('nav.' + item.id);
        // Kalau key tidak ada, t() return key apa adanya — fallback ke label lama.
        if (!label || label === ('nav.' + item.id)) label = item.label;
        btns +=
            '<button class="nav-btn ' + cls + '"' +
            ' data-nav="' + item.id + '"' +
            ' aria-label="' + label + '"' +
            ' aria-current="' + (active === item.id ? 'page' : 'false') + '">' +
            '<span class="nav-ico" aria-hidden="true">' + getNavIcon(item.id) + '</span>' +
            '<span class="nav-label">' + label + '</span>' +
            '</button>';
    }
    return slider + btns;
}
