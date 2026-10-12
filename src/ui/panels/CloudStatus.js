// FILE: src/ui/panels/CloudStatus.js
export function renderCloudStatus() {
    return `
        <div class="card">
            <div class="card-title">Penyimpanan</div>
            <div style="font-size:12.5px;color:var(--accent);line-height:1.7;">
                💾 Auto-save lokal aktif (setiap 30 detik).<br>
                ☁️ Cloud sync: <span style="color:var(--text-mute)">Belum tersedia</span>
            </div>
        </div>
    `;
}
