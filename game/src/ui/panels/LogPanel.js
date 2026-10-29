import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/panels/LogPanel.js
// v2027.13a — i18n.
import { t } from '../../core/LanguageService.js';

const TYPE_COLOR = {
    info:    'var(--text-dim)',
    success: 'var(--accent)',
    warning: 'var(--warn)',
    danger:  'var(--danger)'
};

export function renderLogPanel(state, options) {
    const limit = (options && options.limit) ? options.limit : 5;
    const entries = (state.log || []).slice(0, limit);
    const body = entries.length
        ? entries.map(function (e) {
            return `
                <div class="log-entry">
                    <span class="log-time">${e.day}/${e.month}/${e.year}</span>
                    <span class="log-text" style="color:${TYPE_COLOR[e.type] || 'var(--text)'}">${escapeHtml(e.text)}</span>
                </div>`;
        }).join('')
        : '<div class="log-empty">' + t('log.empty') + '</div>';

    return `
        <div class="card">
            <div class="card-title">${t('log.title')}</div>
            ${body}
        </div>
    `;
}
