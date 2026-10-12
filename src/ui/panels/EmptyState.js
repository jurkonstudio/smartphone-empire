// FILE: src/ui/panels/EmptyState.js
// Empty state handler. Mendukung icon sebagai:
//   - String ID (icon baru, mis. 'inbox', 'brain')
//   - Emoji lama (backward compat)
//   - Tidak ada (fallback default)
import { getIllustration } from '../illustrations/Illustrations.js';

// Map icon ID baru → nama ilustrasi
const ICON_ID_TO_ILLUSTRATION = {
    'inbox':        'box',
    'box':          'box',
    'smartphone':   'box',
    'database':     'box',
    'brain':        'flask',
    'brain-cog':    'flask',
    'brain-circuit':'flask',
    'flask':        'flask',
    'activity':     'chart',
    'chart':        'chart',
    'contacts':     'team',
    'team':         'team',
    'message':      'chat',
    'chat':         'chat',
    'mail':         'chat',
    'rocket':       'rocket',
    'sparkles':     'rocket',
    'store':        'rocket',
    'target':       'rocket'
};

// Map emoji lama → nama ilustrasi (backward compat)
const EMOJI_TO_ILLUSTRATION = {
    '📦': 'box',
    '📱': 'box',
    '🔬': 'flask',
    '📈': 'chart',
    '👥': 'team',
    '💬': 'chat',
    '🚀': 'rocket'
};

function _resolveIllustration(icon) {
    if (!icon) return 'rocket';
    if (ICON_ID_TO_ILLUSTRATION[icon]) return ICON_ID_TO_ILLUSTRATION[icon];
    if (EMOJI_TO_ILLUSTRATION[icon]) return EMOJI_TO_ILLUSTRATION[icon];
    return 'rocket';
}

export function renderEmptyState({ icon, title, description, hint }) {
    const illusName = _resolveIllustration(icon);

    return `
        <div class="empty">
            ${getIllustration(illusName, 140)}
            <div class="empty-title">${title || 'Belum ada konten'}</div>
            ${description ? `<div class="empty-desc">${description}</div>` : ''}
            ${hint ? `<div class="empty-hint">${hint}</div>` : ''}
        </div>
    `;
}
