// FILE: src/ui/panels/ProgressPanel.js
// Menampilkan riset aktif nyata dari ResearchSystem (dipakai di Dashboard).

export function renderProgressPanel(state, researchSystem) {
    // Fallback aman jika researchSystem tidak di-pass
    if (!researchSystem) {
        return `
            <div class="card">
                <div class="card-title">Progres Riset</div>
                <div style="font-size:12px;color:var(--text-mute);">Sistem riset belum siap.</div>
            </div>
        `;
    }

    const active = researchSystem.getProgress();

    if (!active.length) {
        return `
            <div class="card">
                <div class="card-title">Progres Riset</div>
                <div class="empty-hint" style="margin-top:4px;margin-bottom:10px;">Tidak ada riset aktif</div>
                <button class="btn-secondary" data-nav="research" style="width:100%;font-size:12px;padding:8px;">
                    Buka Tab Riset →
                </button>
            </div>
        `;
    }

    const rows = active.map(r => {
        const pct = Math.round(r.percent * 100);
        return `
            <div style="margin-bottom:10px;">
                <div class="progress-label">
                    <span>${r.name}</span>
                    <span>${pct}% • sisa ${r.remainingDays} hari</span>
                </div>
                <div class="progress">
                    <div class="progress-bar" style="width:${pct}%;"></div>
                </div>
            </div>
        `;
    }).join('');

    const slots = state.research ? state.research.maxSlots : 1;
    const activeCount = state.research ? state.research.active.length : 0;

    return `
        <div class="card">
            <div class="card-title">Progres Riset (${activeCount}/${slots} slot)</div>
            ${rows}
        </div>
    `;
}
