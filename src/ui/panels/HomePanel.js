// FILE: src/ui/panels/HomePanel.js
// v2027.13c — dipisah dari main.js + i18n.
import { renderIcon } from '../icons/FeatureIcons.js';
import { t } from '../../core/LanguageService.js';

export function renderHomePanel() {
    return '<div class="card" style="text-align:center;padding:60px 20px;">' +
        '<div style="display:inline-flex;align-items:center;justify-content:center;width:88px;height:88px;border-radius:24px;background:var(--accent-soft);color:var(--accent);margin-bottom:18px;">' +
            renderIcon('layers', 44) +
        '</div>' +
        '<div style="font-size:17px;font-weight:700;margin-bottom:8px;letter-spacing:-0.01em;">' +
            t('home.placeholder.title') +
        '</div>' +
        '<div style="font-size:13px;color:var(--text-tertiary);line-height:1.6;max-width:300px;margin:0 auto;">' +
            t('home.placeholder.body') +
        '</div>' +
        '</div>';
}
