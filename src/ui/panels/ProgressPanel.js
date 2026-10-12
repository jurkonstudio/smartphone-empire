// FILE: src/ui/panels/ProgressPanel.js
// FIX: sebelumnya 40% hardcode. Sekarang baca state.research.progress (0..1).
// Belum ada riset aktif di Fase 1, jadi 0%.
export function renderProgressPanel(state) {
    const r = state.research || {};
    const progress = typeof r.progress === 'number' ? r.progress : 0;
    const clamped = Math.max(0, Math.min(1, progress));
    const percent = Math.round(clamped * 100);

    const hasActive = !!r.activeId;
    const label = hasActive
        ? 'Riset berjalan'
        : 'Tidak ada riset aktif';

    return `
        <div class="card">
            <div class="card-title">Progres Riset</div>
            <div class="progress-label">
                <span>${label}</span>
                <span>${percent}%</span>
            </div>
            <div class="progress">
                <div class="progress-bar" style="width:${percent}%;"></div>
            </div>
            ${hasActive ? '' : `
                <div style="font-size:11.5px;color:var(--text-mute);margin-top:10px;">
                    Technology tree akan tersedia pada Fase 3.
                </div>
            `}
        </div>
    `;
}
