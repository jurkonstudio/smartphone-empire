// FILE: src/ui/panels/EmptyState.js
export function renderEmptyState({ icon, title, description, hint }) {
    return `
        <div class="empty">
            <div class="empty-ico" aria-hidden="true">${icon || '📦'}</div>
            <div class="empty-title">${title || 'Belum ada konten'}</div>
            ${description ? `<div class="empty-desc">${description}</div>` : ''}
            ${hint ? `<div class="empty-hint">${hint}</div>` : ''}
        </div>
    `;
}
