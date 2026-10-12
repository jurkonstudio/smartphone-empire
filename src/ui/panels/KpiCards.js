export function renderKpiCards(data) {
    return `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px;">
            <div style="background:#222; padding:15px; border-radius:8px; border-left: 4px solid #4CAF50;">
                <div style="font-size:12px; color:#aaa; margin-bottom:5px;">Uang Tunai</div>
                <div style="font-size:18px; font-weight:bold; color:#4CAF50;">$${data.cash.toLocaleString()}</div>
            </div>
            <div style="background:#222; padding:15px; border-radius:8px; border-left: 4px solid #2196F3;">
                <div style="font-size:12px; color:#aaa; margin-bottom:5px;">Hari Ke-</div>
                <div style="font-size:18px; font-weight:bold; color:#fff;">${data.day}</div>
            </div>
        </div>
    `;
}
