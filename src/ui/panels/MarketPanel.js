// FILE: src/ui/panels/MarketPanel.js
// Tab Pasar: sub-tab Pangsa | Kompetitor | Tren.
function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export function renderMarketPanel({ subtab, marketSystem }) {
    const subtabBar = `
        <div class="subtab-bar">
            <button class="subtab-btn ${subtab === 'share'       ? 'active' : ''}" data-market-subtab="share">Pangsa</button>
            <button class="subtab-btn ${subtab === 'competitors' ? 'active' : ''}" data-market-subtab="competitors">Kompetitor</button>
            <button class="subtab-btn ${subtab === 'trends'      ? 'active' : ''}" data-market-subtab="trends">Tren</button>
        </div>
    `;
    let body = '';
    if (subtab === 'competitors') body = _renderCompetitors(marketSystem);
    else if (subtab === 'trends') body = _renderTrends(marketSystem);
    else body = _renderShare(marketSystem);
    return subtabBar + body;
}

function _renderShare(marketSystem) {
    const data = window.__game.state.get();
    const share = data.market.share || 0;
    const history = data.market.shareHistory || [];
    const competitors = data.market.competitors || [];

    const lastHist = history[0];
    const prevHist = history[1];
    const delta = prevHist ? (lastHist.playerShare - prevHist.playerShare) : 0;
    const arrow = delta > 0.001 ? '↑' : delta < -0.001 ? '↓' : '→';
    const arrowColor = delta > 0 ? 'var(--accent)' : delta < 0 ? 'var(--danger)' : 'var(--text-mute)';

    return `
        <div class="card">
            <div class="card-title">Pangsa Pasar Anda</div>
            <div style="display:flex;align-items:baseline;gap:10px;">
                <div style="font-size:28px;font-weight:800;color:var(--accent);">${(share * 100).toFixed(1)}%</div>
                <div style="font-size:13px;color:${arrowColor};">${arrow} ${Math.abs(delta * 100).toFixed(1)}%</div>
            </div>
            <div style="font-size:11.5px;color:var(--text-mute);margin-top:4px;">Data diperbarui bulanan</div>
        </div>
        ${_renderShareChart(history)}
        <div class="card">
            <div class="card-title">Peringkat</div>
            <div class="sum-row">
                <span><b style="color:var(--accent);">Anda</b></span>
                <b>${(share * 100).toFixed(1)}%</b>
            </div>
            ${competitors.slice().sort((a,b) => b.share - a.share).map(c => `
                <div class="sum-row"><span>${escapeHtml(c.name)}</span><b>${(c.share * 100).toFixed(1)}%</b></div>
            `).join('')}
        </div>
    `;
}

function _renderShareChart(history) {
    if (!history.length) {
        return '<div class="card"><div class="card-title">Grafik Pangsa</div><div class="log-empty">Data muncul setelah 2 bulan simulasi.</div></div>';
    }
    const id = 'share-chart-' + Math.random().toString(36).slice(2, 8);
    return `
        <div class="card">
            <div class="card-title">Grafik Pangsa (24 Bulan)</div>
            <div class="chart-wrap" id="${id}" style="height:140px;">
                <canvas class="chart-canvas" data-share-chart="${id}" style="height:140px;"></canvas>
            </div>
        </div>
    `;
}

export function drawShareChart(container) {
    if (!container) return;
    const canvas = container.querySelector('canvas');
    if (!canvas) return;
    const game = window.__game;
    if (!game) return;
    const history = [...(game.state.get().market.shareHistory || [])].reverse();
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

    const padL = 30, padR = 8, padT = 10, padB = 16;
    const plotW = cssW - padL - padR;
    const plotH = cssH - padT - padB;
    const maxV = Math.max(0.1, Math.max.apply(null, history.map(h => h.playerShare)));
    const range = maxV || 0.1;

    const xOf = (i) => padL + (plotW * i) / (history.length - 1);
    const yOf = (v) => padT + plotH - (v / range) * plotH;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
        const y = padT + (plotH * i) / 4;
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(cssW - padR, y); ctx.stroke();
    }

    // Line
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((h, i) => {
        const x = xOf(i), y = yOf(h.playerShare);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Label
    ctx.fillStyle = '#6a6a6a';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText((maxV * 100).toFixed(0) + '%', padL - 4, padT + 10);
    ctx.fillText('0%', padL - 4, padT + plotH - 2);
}

function _renderCompetitors(marketSystem) {
    const competitors = marketSystem.getCompetitors();
    if (!competitors.length) return '<div class="empty"><div class="empty-ico">🏢</div><div class="empty-title">Belum ada kompetitor</div></div>';
    return competitors.map(c => `
        <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                <div style="flex:1;">
                    <div style="font-size:14px;font-weight:700;">${escapeHtml(c.name)}</div>
                    <div style="font-size:11px;color:var(--text-mute);margin-top:2px;">${_personalityLabel(c.personality)}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:18px;font-weight:700;color:var(--info);">${((c.share || 0) * 100).toFixed(1)}%</div>
                    <div style="font-size:10.5px;color:var(--text-mute);">pangsa</div>
                </div>
            </div>
        </div>
    `).join('');
}

function _personalityLabel(p) {
    const map = {
        aggressive: '⚔️ Agresif Harga',
        premium:    '💎 Premium',
        innovator:  '💡 Inovator',
        follower:   '🔄 Pengikut'
    };
    return map[p] || p;
}

function _renderTrends(marketSystem) {
    const trends = marketSystem.getTrends();
    const labels = {
        camera:      { name: 'Kamera',     icon: '📷' },
        battery:     { name: 'Baterai',    icon: '🔋' },
        screen:      { name: 'Layar',      icon: '📺' },
        performance: { name: 'Performa',   icon: '⚡' },
        design:      { name: 'Desain',     icon: '🎨' }
    };
    // Urutkan dari yang paling tinggi
    const sorted = Object.keys(trends).sort((a, b) => trends[b] - trends[a]);
    const top = sorted[0];

    return `
        <div class="card">
            <div class="card-title">Sorotan Pasar</div>
            <div style="font-size:13px;line-height:1.6;">
                Pasar sedang menyukai <b style="color:var(--accent);">${labels[top] ? labels[top].name : top}</b>.
            </div>
        </div>
        <div class="card">
            <div class="card-title">Selera Pasar</div>
            ${sorted.map(k => {
                const v = Math.round((trends[k] || 0) * 100);
                const meta = labels[k] || { name: k, icon: '❓' };
                return `
                    <div style="margin-bottom:10px;">
                        <div class="progress-label">
                            <span>${meta.icon} ${meta.name}</span>
                            <span>${v}%</span>
                        </div>
                        <div class="progress" style="height:6px;">
                            <div class="progress-bar" style="width:${v}%;"></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        <div class="card">
            <div class="card-title">Catatan</div>
            <div style="font-size:12px;color:var(--text-dim);line-height:1.6;">
                Selera pasar berubah perlahan setiap bulan. Produk yang cocok dengan tren akan lebih laris.
            </div>
        </div>
    `;
          }
