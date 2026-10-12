// FILE: src/ui/panels/TimelinePanel.js
// Menampilkan milestone nyata dari state.milestones.
const ERA_LABEL = {
    feature_phone:     'Feature Phone (2000-2006)',
    touch_revolution:  'Touch Revolution (2007-2012)',
    modern_smartphone: 'Modern Smartphone (2013-2018)',
    ai_ecosystem:      'AI & Ecosystem (2019-2025+)'
};

export function renderTimelinePanel(state, t) {
    const ms = (state.milestones || []).slice(-6).reverse();
    const list = ms.length
        ? ms.map(m => `
            <div class="ms-row">
                <span class="ms-year">${m.year}</span>
                <span class="ms-text">${m.text}</span>
            </div>`).join('')
        : `<div class="log-empty">Belum ada milestone tercapai.</div>`;

    return `
        <div class="card">
            <div class="card-title">Timeline</div>
            <div class="tl-era">
                Era: <b>${ERA_LABEL[state.era] || state.era}</b> • Tahun <b>${t.currentYear}</b>
            </div>
            <div class="ms-list">${list}</div>
        </div>
    `;
}
