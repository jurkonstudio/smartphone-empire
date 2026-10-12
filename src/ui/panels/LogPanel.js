// FILE: src/ui/panels/LogPanel.js
// Menampilkan entri log nyata dari state.log (maks 5 terbaru di dashboard).
const TYPE_COLOR = {
    info:    'var(--text-dim)',
    success: 'var(--accent)',
    warning: 'var(--warn)',
    danger:  'var(--danger)'
};

export function renderLogPanel(state, { limit = 5 } = {}) {
    const entries = (state.log || []).slice(0, limit);
    const body = entries.length
        ? entries.map(e => `
            <div class="log-entry">
                <span class="log-time">${e.day}/${e.month}/${e.year}</span>
                <span class="log-text" style="color:${TYPE_COLOR[e.type] || 'var(--text)'}">${e.text}</span>
            </div>`).join('')
        : `<div class="log-empty">Belum ada aktivitas.</div>`;

    return `
        <div class="card">
            <div class="card-title">Aktivitas Terbaru</div>
            ${body}
        </div>
    `;
}
