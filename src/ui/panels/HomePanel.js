// FILE: src/ui/panels/HomePanel.js
// v2027.14 — placeholder diganti peta kampus 3D (mount lewat main.js).
import { t } from '../../core/LanguageService.js';
import { renderCampusLoading } from '../campus/CampusFallback.js';

export function renderHomePanel() {
    return '<div id="campus-map" class="card" role="img" aria-label="' + t('home.campus.aria') + '" ' +
        'style="padding:0;height:min(62vh,480px);min-height:320px;position:relative;overflow:hidden;">' +
        renderCampusLoading() +
        '</div>';
}
