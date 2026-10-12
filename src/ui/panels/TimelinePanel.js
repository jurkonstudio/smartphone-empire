// FILE: src/ui/panels/TimelinePanel.js
export function renderTimelinePanel(_state, t) {
    return `
        <div class="card">
            <div class="card-title">Timeline</div>
            <div style="font-size:12.5px;color:var(--text-dim);line-height:1.7;">
                Tahun berjalan: <b style="color:var(--text)">${t.currentYear}</b><br>
                Era saat ini: <b style="color:var(--text)">Feature Phone (2000-2006)</b><br>
                Milestone berikutnya tersedia di Fase 3.
            </div>
        </div>
    `;
}
