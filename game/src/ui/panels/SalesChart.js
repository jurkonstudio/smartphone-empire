// FILE: src/ui/panels/SalesChart.js
// v2027.13c — i18n.
import { t } from '../../core/LanguageService.js';

export function renderSalesChart(state) {
    const id = 'sales-chart-' + Math.random().toString(36).slice(2, 8);
    const activeProducts = state.products.catalog.filter(function (p) { return p.status === 'selling' && (p.dailySales || []).length > 0; });
    const hasData = activeProducts.length > 0;
    return `
        <div class="card">
            <div class="card-title">${t('chart.sales_title')}</div>
            <div class="chart-wrap" id="${id}" style="height:160px;">
                <canvas class="chart-canvas" data-chart-id="${id}" style="height:160px;"></canvas>
                ${hasData ? '' : '<div class="chart-empty">' + t('chart.sales_empty') + '</div>'}
            </div>
        </div>
    `;
}

export function drawSalesChart(container) {
    if (!container) return;
    const canvas = container.querySelector('canvas');
    if (!canvas) return;
    const game = window.__game;
    if (!game) return;
    const state = game.state.get();

    const activeProducts = state.products.catalog.filter(function (p) { return p.status === 'selling' && (p.dailySales || []).length > 0; });
    if (!activeProducts.length) return;

    // Ambil 30 hari terakhir dari semua produk, agregat
    const dayMap = new Map();
    activeProducts.forEach(function (p) {
        (p.dailySales || []).slice(-30).forEach(function (d) {
            const key = Math.floor(d.day / 1440);
            dayMap.set(key, (dayMap.get(key) || 0) + d.revenue);
        });
    });
    const sortedKeys = Array.from(dayMap.keys()).sort(function (a, b) { return a - b; });
    if (sortedKeys.length < 2) return;
    const revenues = sortedKeys.map(function (k) { return dayMap.get(k); });

    const cssW = container.clientWidth || 320;
    const cssH = 160;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    const padL = 40, padR = 8, padT = 10, padB = 20;
    const plotW = cssW - padL - padR;
    const plotH = cssH - padT - padB;
    const maxV = Math.max.apply(null, revenues.concat([1]));
    const minV = 0;
    const range = Math.max(1, maxV - minV);

    // Grid horizontal
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
        const y = padT + (plotH * i) / 3;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(cssW - padR, y);
        ctx.stroke();
    }

    const xOf = function (i) { return padL + (plotW * i) / (revenues.length - 1); };
    const yOf = function (v) { return padT + plotH - ((v - minV) / range) * plotH; };

    // Line
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    revenues.forEach(function (v, i) {
        const x = xOf(i), y = yOf(v);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Area
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, 'rgba(76,175,80,0.25)');
    grad.addColorStop(1, 'rgba(76,175,80,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    revenues.forEach(function (v, i) {
        const x = xOf(i), y = yOf(v);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.lineTo(xOf(revenues.length - 1), padT + plotH);
    ctx.lineTo(xOf(0), padT + plotH);
    ctx.closePath();
    ctx.fill();

    // Label
    ctx.fillStyle = '#6a6a6a';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('$' + Math.round(maxV).toLocaleString('en-US'), padL - 4, padT + 10);
    ctx.fillText('$0', padL - 4, padT + plotH - 2);
    ctx.textAlign = 'center';
    ctx.fillText(t('chart.sales_x'), cssW / 2, cssH - 4);
}
