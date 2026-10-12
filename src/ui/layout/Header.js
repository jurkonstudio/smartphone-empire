// Header menampilkan: nama perusahaan, tanggal game, tombol pause & kecepatan.
// Aksi tombol ditangani lewat event delegation di main.js.
export function renderHeader({ state, activeView, timeSnapshot }) {
    const t = timeSnapshot || {};
    const dateStr = `Hari ${t.currentDay}/${t.currentMonth}/${t.currentYear}`;
    const hh = String(Math.floor(t.currentHour || 0)).padStart(2, '0');
    const mm = String(Math.floor(t.currentMinute || 0)).padStart(2, '0');
    const speedLabel = t.isPaused ? 'Paused' : `${t.gameSpeed}x`;
    const statusColor = t.isPaused ? '#ff9800' : '#4CAF50';

    return `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:10px; padding:0 12px;">
            <div style="flex:1; min-width:0;">
                <div style="font-size:14px; font-weight:bold; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                    ${state.companyName}
                </div>
                <div style="font-size:11px; color:#aaa;">
                    ${dateStr} • ${hh}:${mm} •
                    <span style="color:${statusColor}; font-weight:bold;">${speedLabel}</span>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                <div style="font-size:13px; color:#4CAF50; font-weight:bold;">
                    $${state.cash.toLocaleString()}
                </div>
                <button data-time-action="toggle-pause" aria-label="${t.isPaused ? 'Mulai' : 'Jeda'}"
                    style="background:#333; color:#fff; border:none; border-radius:4px; padding:6px 10px; font-size:12px; cursor:pointer; min-width:38px;">
                    ${t.isPaused ? '▶' : '❚❚'}
                </button>
                <button data-time-action="cycle-speed" aria-label="Ubah Kecepatan"
                    style="background:#333; color:#fff; border:none; border-radius:4px; padding:6px 10px; font-size:12px; cursor:pointer; min-width:48px;">
                    ⏩ ${t.isPaused ? '--' : t.gameSpeed + 'x'}
                </button>
            </div>
        </div>
    `;
}
