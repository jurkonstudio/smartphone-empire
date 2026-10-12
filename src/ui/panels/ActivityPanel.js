// FILE: src/ui/panels/ActivityPanel.js
// Fase 1: masih statis. Nanti akan diisi log aktivitas nyata.
export function renderActivityPanel(state) {
    return `
        <div class="card">
            <div class="card-title">Aktivitas Terbaru</div>
            <div style="font-size:12.5px;color:var(--text-dim);line-height:1.8;">
                • Hari 1: Perusahaan <b style="color:var(--text)">${state.companyName}</b> didirikan.
                <br>
                • Menunggu milestone berikutnya.
            </div>
        </div>
    `;
}
