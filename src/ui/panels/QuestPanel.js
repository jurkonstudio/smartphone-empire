// FILE: src/ui/panels/QuestsPanel.js
export function renderQuestsPanel(state) {
    const active = state.quests?.active || [];
    const completed = state.quests?.completed || [];

    const list = active.length
        ? active.map(q => `
            <div class="quest-item">
                <div class="quest-dot"></div>
                <div>
                    <div class="quest-title">${q.title}</div>
                    <div class="quest-desc">${q.description}</div>
                </div>
            </div>`).join('')
        : `<div class="log-empty">Semua quest awal selesai 🎉</div>`;

    return `
        <div class="card">
            <div class="card-title">Quest (${completed.length} selesai)</div>
            ${list}
        </div>
    `;
}
