// FILE: src/ui/panels/CashChart.js
// v2027.13a — i18n.
import { t } from '../../core/LanguageService.js';

export function renderCashChart(state) {
    const id = 'cash-chart-' + Math.random().toString(36).slice(2, 8);
    const hasData = (state.finance.history || []).length >= 2;
    return `
        <div class="card">
            <div class="card-title">${t('chart.cash_title')}</div>
            <div class="chart-wrap" id="${id}">
                <canvas class="chart-canvas" data-chart-id="${id}"></canvas>
                ${hasData ? '' : '<div class="chart-empty">' + t('chart.cash_empty') + '</div>'}
            </div>
        </div>
    `;
}

export function drawCashChart(container) {
    if (!container) return;
    const canvas = container.querySelector('canvas');
    if (!canvas) return;
    const game = window.__game;
    if (!game || !game.state) return;
    const state = game.state.get();
    const historyRaw = state.finance.history || [];
    const history = historyRaw.slice().reverse();
    if (history.length < 2) return;

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

    const values = history.map(function (h) { return h.cash; });
    const minV = Math.min.apply(null, values.concat([0]));
    const maxV = Math.max.apply(null, values.concat([1]));
    const range = Math.max(1, maxV - minV);

    const padL = 6, padR = 6, padT = 10, padB = 18;
    const plotW = cssW - padL - padR;
    const plotH = cssH - padT - padB;

    function xOf(i) { return padL + (plotW * i) / (history.length - 1); }
    function yOf(v) { return padT + plotH - ((v - minV) / range) * plotH; }

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
        const y = padT + (plotH * i) / 4;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(cssW - padR, y);
        ctx.stroke();
    }

    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < history.length; i++) {
        const x = xOf(i);
        const y = yOf(history[i].cash);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, 'rgba(76,175,80,0.18)');
    grad.addColorStop(1, 'rgba(76,175,80,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    for (let i = 0; i < history.length; i++) {
        const x = xOf(i);
        const y = yOf(history[i].cash);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.lineTo(xOf(history.length - 1), padT + plotH);
    ctx.lineTo(xOf(0), padT + plotH);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#6a6a6a';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('$' + Math.round(maxV).toLocaleString('en-US'), padL + 2, padT + 10);
    ctx.fillText('$' + Math.round(minV).toLocaleString('en-US'), padL + 2, padT + plotH - 2);

    const last = history[history.length - 1];
    const mKey = 'date.month.' + (last.month || 1);
    const mShort = t(mKey);
    const monthLabel = (mShort === mKey) ? String(last.month) : mShort;
    ctx.textAlign = 'right';
    ctx.fillText(monthLabel + ' ' + String(last.year).slice(-2), cssW - padR - 2, cssH - 4);
}
