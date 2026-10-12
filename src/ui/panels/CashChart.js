// FILE: src/ui/panels/CashChart.js
// Grafik garis Canvas: 24 bulan terakhir cash, income, expense.
// Data diambil dari state.finance.history (unshift: terbaru di index 0).
export function renderCashChart(state) {
    const id = 'cash-chart-' + Math.random().toString(36).slice(2, 8);
    // Panggil drawCashChart(containerId) setelah HTML terpasang ke DOM.
    return `
        <div class="card">
            <div class="card-title">Keuangan — 24 Bulan</div>
            <div class="chart-wrap" id="${id}">
                <canvas class="chart-canvas" data-chart-id="${id}"></canvas>
                ${(state.finance.history || []).length < 2
                    ? `<div class="chart-empty">Data muncul setelah 2 bulan simulasi.</div>` : ''}
            </div>
        </div>
    `;
}

// Dipanggil dari main.js setelah innerHTML dipasang
export function drawCashChart(container) {
    if (!container) return;
    const canvas = container.querySelector('canvas');
    if (!canvas) return;
    // Ambil state dari window.__game (read-only)
    const state = window.__game?.state?.get?.();
    if (!state) return;
    const history = [...(state.finance.history || [])].reverse(); // urut lama→baru

    const cssW = container.clientWidth || 320;
    const cssH = 140;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    if (history.length < 2) return;

    // Tentukan min/max nilai cash
    const values = history.map(h => h.cash);
    const minV = Math.min(...values, 0);
    const maxV = Math.max(...values, 1);
    const range = Math.max(1, maxV - minV);

    const padL = 6, padR = 6, padT = 10, padB = 18;
    const plotW = cssW - padL - padR;
    const plotH = cssH - padT - padB;

    const xOf = (i) => padL + (plotW * i) / (history.length - 1);
    const yOf = (v) => padT + plotH - ((v - minV) / range) * plotH;

    // Grid (3 garis horizontal)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
        const y = padT + (plotH * i) / 4;
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(cssW - padR, y); ctx.stroke();
    }

    // Garis cash (accent)
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((h, i) => {
        const x = xOf(i), y = yOf(h.cash);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Area di bawah garis (subtle)
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, 'rgba(76,175,80,0.18)');
    grad.addColorStop(1, 'rgba(76,175,80,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    history.forEach((h, i) => {
        const x = xOf(i), y = yOf(h.cash);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.lineTo(xOf(history.length - 1), padT + plotH);
    ctx.lineTo(xOf(0), padT + plotH);
    ctx.closePath();
    ctx.fill();

    // Label nilai max/min di kiri
    ctx.fillStyle = '#6a6a6a';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('$' + Math.round(maxV).toLocaleString('en-US'), padL + 2, padT + 10);
    ctx.fillText('$' + Math.round(minV).toLocaleString('en-US'), padL + 2, padT + plotH - 2);

    // Label bulan terakhir
    const last = history[history.length - 1];
    ctx.textAlign = 'right';
    ctx.fillText(`Bln ${last.month}/${String(last.year).slice(-2)}`, cssW - padR - 2, cssH - 4);
}
