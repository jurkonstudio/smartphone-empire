// FILE: src/ui/layout/Header.js
// Header ringkas 2 baris. Kontrol waktu utama hanya di sini.
// Aksi ditangani event delegation di main.js via [data-time-action].
export function renderHeader({ state, timeSnapshot }) {
    const t = timeSnapshot;
    const hh = String(Math.floor(t.currentHour)).padStart(2, '0');
    const mm = String(Math.floor(t.currentMinute)).padStart(2, '0');
    const status = t.isPaused ? 'Paused' : (t.gameSpeed + 'x');
    const statusCls = t.isPaused ? '' : 'running';

    return `
        <div class="header-inner">
            <div class="header-row">
                <div class="header-company">${state.companyName}</div>
                <div class="header-cash" data-cash>$${state.cash.toLocaleString('en-US')}</div>
            </div>
            <div class="header-row">
                <div class="header-meta">
                    <span data-time-date>Hari ${t.currentDay}/${t.currentMonth}/${t.currentYear}</span>
                    <span>•</span>
                    <span data-time-clock>${hh}:${mm}</span>
                    <span>•</span>
                    <span class="header-status ${statusCls}" data-time-status>${status}</span>
                </div>
                <div class="header-controls">
                    <button class="btn-icon" data-time-action="toggle-pause"
                            aria-label="${t.isPaused ? 'Mulai simulasi' : 'Jeda simulasi'}">
                        ${t.isPaused ? '▶' : '❚❚'}
                    </button>
                    <button class="btn-icon" data-time-action="cycle-speed"
                            aria-label="Ubah kecepatan simulasi">
                        ⏩
                    </button>
                </div>
            </div>
        </div>
    `;
}
