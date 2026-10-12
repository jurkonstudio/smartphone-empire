// FILE: src/ui/panels/KpiCards.js
export function renderKpiCards(state, timeSnapshot) {
    const day = timeSnapshot.currentDay;
    const month = timeSnapshot.currentMonth;
    const year = timeSnapshot.currentYear;

    return `
        <div class="kpi-grid">
            <div class="kpi">
                <div class="kpi-label">Uang Tunai</div>
                <div class="kpi-value" data-cash style="color:var(--accent);">
                    $${state.cash.toLocaleString('en-US')}
                </div>
            </div>
            <div class="kpi blue">
                <div class="kpi-label">Hari Ke-</div>
                <div class="kpi-value">${day}</div>
                <div style="font-size:11px;color:var(--text-mute);margin-top:2px;">
                    Bulan ${month} • Tahun ${year}
                </div>
            </div>
        </div>
    `;
}
