import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/panels/ActivityPanel.js
// v2027.13c — i18n. (legacy file)
import { t } from '../../core/LanguageService.js';

export function renderActivityPanel(state) {
    return `
        <div class="card">
            <div class="card-title">${t('activity.title')}</div>
            <div style="font-size:12.5px;color:var(--text-dim);line-height:1.8;">
                • ${t('activity.founded', { name: escapeHtml(state.companyName) })}<br>
                • ${t('activity.waiting')}
            </div>
        </div>
    `;
}
