// FILE: src/ui/panels/CloudStatus.js
// v2027.13c — i18n.
import { t } from '../../core/LanguageService.js';

export function renderCloudStatus() {
    return `
        <div class="card">
            <div class="card-title">${t('cloud.card_title')}</div>
            <div style="font-size:12.5px;color:var(--accent);line-height:1.7;">
                ${t('cloud.autosave')}<br>
                ${t('cloud.sync_unavailable')}
            </div>
        </div>
    `;
}
