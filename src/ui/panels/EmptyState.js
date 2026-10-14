// FILE: src/ui/panels/EmptyState.js
// v2027.13c — i18n untuk fallback.
import { getIllustration } from '../illustrations/Illustrations.js';
import { t } from '../../core/LanguageService.js';

export function renderEmptyState(params) {
    var icon = params.icon;
    var title = params.title;
    var description = params.description;
    var hint = params.hint;

    const iconMap = {
        '📦': 'box',
        '📱': 'box',
        '🔬': 'flask',
        '📈': 'chart',
        '👥': 'team',
        '💬': 'chat',
        '🚀': 'rocket'
    };
    const illusName = iconMap[icon] || 'rocket';

    return `
        <div class="empty">
            ${getIllustration(illusName, 140)}
            <div class="empty-title">${title || t('empty.default_title')}</div>
            ${description ? '<div class="empty-desc">' + description + '</div>' : ''}
            ${hint ? '<div class="empty-hint">' + hint + '</div>' : ''}
        </div>
    `;
}
