// Panel ringkas waktu simulasi di dashboard.
// Semua tombol ditangani lewat event delegation di main.js.
export function renderTimePanel(t) {
    const hh = String(Math.floor(t.currentHour || 0)).padStart(2, '0');
    const mm = String(Math.floor(t.currentMinute || 0)).padStart(2, '0');
    const speedLabel = t.isPaused ? 'Paused' : `${t.gameSpeed}x`;
    const statusColor = t.isPaused ? '#ff9800' : '#4CAF50';

    return `
        <div style="background:#222; padding:15px; border-radius:8px; margin-bottom:20px; border-left:4px solid ${statusColor};">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="font-size:13px; color:#aaa;">⏱️ Waktu Simulasi</div>
                <div style="font-size:12px; color:${statusColor}; font-weight:bold;">${speedLabel}</div>
            </div>
            <div style="font-size:16px; font-weight:bold; color:#fff;">
                Hari ${t.currentDay} Bulan ${t.currentMonth} Tahun ${t.currentYear}
            </div>
            <div style="font-size:12px; color:#888; margin-top:4px;">
                Pukul ${hh}:${mm} • Total ${Math.floor(t.elapsedGameMinutes).toLocaleString()} menit game
            </div>
            <div style="display:flex; gap:8px; margin-top:12px;">
                <button data-time-action="toggle-pause"
                    style="flex:1; padding:10px; background:#333; color:#fff; border:none; border-radius:4px; font-size:13px; cursor:pointer;">
                    ${t.isPaused ? '▶ Mulai' : '❚❚ Jeda'}
                </button>
                <button data-time-action="cycle-speed"
                    style="flex:1; padding:10px; background:#333; color:#fff; border:none; border-radius:4px; font-size:13px; cursor:pointer;">
                    ⏩ Kecepatan
                </button>
            </div>
        </div>
    `;
}
