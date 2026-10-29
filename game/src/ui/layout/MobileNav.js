// FILE: src/ui/layout/MobileNav.js
// v2027.7b — [PRECISION] Memisahkan area ikon & teks agar slider bisa presisi di tengah ikon saja.
// [i18n FIX] id 'dashboard' dipetakan ke key 'nav.home' (sebelumnya 'nav.dashboard' tidak ada -> Missing key & label hardcoded).
import { NAV_ITEMS } from '../../config/constants.js';
import { getNavIcon } from '../icons/NavIcons.js';
import { t } from '../../core/LanguageService.js';

// Pemetaan id nav -> key kamus. Id yang tidak tercantum memakai 'nav.<id>'.
var NAV_KEY_MAP = { dashboard: 'nav.home' };

function navLabel(item) {
    var key = NAV_KEY_MAP[item.id] || ('nav.' + item.id);
    var label = t(key);
    if (!label || label === key) label = item.label;
    return label;
}

export function renderMobileNav(params) {
    var active = params && params.active ? params.active : null;

    var slider = '<div class="nav-slider" aria-hidden="true"></div>';

    var btns = '';
    for (var i = 0; i < NAV_ITEMS.length; i++) {
        var item = NAV_ITEMS[i];
        var cls = active === item.id ? 'active' : '';
        var label = navLabel(item);

        // Struktur dibungkus: .nav-ico-wrap (khusus untuk slider) dan .nav-label
        btns +=
            '<button class="nav-btn ' + cls + '"' +
            ' data-nav="' + item.id + '"' +
            ' aria-label="' + label + '"' +
            ' aria-current="' + (active === item.id ? 'page' : 'false') + '">' +
            '<div class="nav-ico-wrap">' +
                '<span class="nav-ico" aria-hidden="true">' + getNavIcon(item.id) + '</span>' +
            '</div>' +
            '<span class="nav-label">' + label + '</span>' +
            '</button>';
    }
    return slider + btns;
}
