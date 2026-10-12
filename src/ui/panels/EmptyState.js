// FILE: src/ui/panels/EmptyState.js
import { getIllustration } from '../illustrations/Illustrations.js';

export function renderEmptyState({ icon, title, description, hint }) {
    // Map icon emoji lama ke nama ilustrasi baru
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
            <div class="empty-title">${title || 'Belum ada konten'}</div>
            ${description ? `<div class="empty-desc">${description}</div>` : ''}
            ${hint ? `<div class="empty-hint">${hint}</div>` : ''}
        </div>
    `;
}
