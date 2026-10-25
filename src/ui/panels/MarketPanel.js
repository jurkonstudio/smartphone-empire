import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/panels/MarketPanel.js
// v2027.15b — audit grafik pangsa: urut kronologis, label sumbu X, sumbu Y sejajar grid,
// warna legend konsisten, tombol zoom, redraw saat resize, pct adaptif untuk kompetitor.
import { renderPublicOpinionPanel } from './PublicOpinionPanel.js';
import { t, LanguageService } from '../../core/LanguageService.js';
import { renderPromotionPanel } from './PromotionPanel.js';
import { renderChannelPanel } from './ChannelPanel.js';
import { renderAfterSalesPanel } from './AfterSalesPanel.js';
import { renderNavShare, renderNavTrends, renderNavPublic } from './MarketNavPanels.js';
import '../charts/ChartZoomModal.js'; // side-effect: pasang listener [data-chart-zoom]


function _personalityLabel(p) {
    var map = {
        aggressive: 'market.personality.aggressive',
        premium:    'market.personality.premium',
        innovator:  'market.personality.innovator',
        follower:   'market.personality.follower',
        dominant:   'market.personality.dominant',
        declining:  'market.personality.declining'
    };
    var key = map[p];
    return key ? t(key) : p;
}

// Kartu Navigasi Pasar: tidak boleh merusak sub-tab bila gagal.
function _navCards(fn) {
    try { return fn() || ''; } catch (e) { console.warn('[MarketPanel] kartu navigasi gagal', e); return ''; }
}

export function renderMarketPanel(params) {
    var subtab = params.subtab;
    var marketSystem = params.marketSystem;
    var competitorSystem = params.competitorSystem;
    var opinionSystem = params.opinionSystem;
    var channelSystem = params.channelSystem;
    var afterSalesSystem = params.afterSalesSystem;

    const subtabBar = `
        <div class="subtab-bar" style="overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;">
            <button style="flex:1 0 auto;white-space:nowrap;padding-left:10px;padding-right:10px;" class="subtab-btn ${subtab === 'share'       ? 'active' : ''}" data-market-subtab="share">${t('market.subtab.share')}</button>
            <button style="flex:1 0 auto;white-space:nowrap;padding-left:10px;padding-right:10px;" class="subtab-btn ${subtab === 'competitors' ? 'active' : ''}" data-market-subtab="competitors">${t('market.subtab.competitors')}</button>
            <button style="flex:1 0 auto;white-space:nowrap;padding-left:10px;padding-right:10px;" class="subtab-btn ${subtab === 'trends'      ? 'active' : ''}" data-market-subtab="trends">${t('market.subtab.trends')}</button>
            <button style="flex:1 0 auto;white-space:nowrap;padding-left:10px;padding-right:10px;" class="subtab-btn ${subtab === 'promo'       ? 'active' : ''}" data-market-subtab="promo">${t('market.subtab.promo')}</button>
            <button style="flex:1 0 auto;white-space:nowrap;padding-left:10px;padding-right:10px;" class="subtab-btn ${subtab === 'channels'    ? 'active' : ''}" data-market-subtab="channels">${LanguageService.getLang() === 'en' ? 'Channels' : 'Kanal'}</button>
            <button style="flex:1 0 auto;white-space:nowrap;padding-left:10px;padding-right:10px;" class="subtab-btn ${subtab === 'service'     ? 'active' : ''}" data-market-subtab="service">${LanguageService.getLang() === 'en' ? 'Service' : 'Servis'}</button>
            <button style="flex:1 0 auto;white-space:nowrap;padding-left:10px;padding-right:10px;" class="subtab-btn ${subtab === 'public'      ? 'active' : ''}" data-market-subtab="public">${t('market.subtab.public')}</button>
        </div>
    `;
    let body = '';
    if (subtab === 'competitors') body = _renderCompetitors(competitorSystem);
    else if (subtab === 'trends') body = _renderTrends(marketSystem) + _navCards(renderNavTrends);
    else if (subtab === 'promo') body = renderPromotionPanel();
    else if (subtab === 'channels') body = renderChannelPanel({ channelSystem: channelSystem });
    else if (subtab === 'service') body = renderAfterSalesPanel({ afterSalesSystem: afterSalesSystem });
    else if (subtab === 'public') body = renderPublicOpinionPanel({ opinionSystem }) + _navCards(renderNavPublic);
    else body = _renderShare(marketSystem) + _navCards(renderNavShare);
    return subtabBar + body;
}

// ============================================================
// SUB-TAB PANGSA
// ============================================================
// [v2027.15a] Presisi adaptif. Sebelumnya nilai < 0.005% selalu tampil
// "0.00%" yang menyesatkan — pemain mengira share mereka benar-benar nol,
// padahal hanya kecil. Presisi kini mengikuti orde besaran:
//    >= 1%     -> 1 desimal   (mis. "12.3%")
//    >= 0.1%   -> 2 desimal   (mis. "0.42%")
//    >= 0.01%  -> 3 desimal   (mis. "0.037%")
//    >= 0.001% -> 4 desimal   (mis. "0.0037%")
//    < 0.001%  -> 5 desimal   (mis. "0.00042%")
//    0         -> "0.00%"
function _pct(v) {
    const p = (v || 0) * 100;
    const abs = Math.abs(p);
    if (abs === 0)     return '0.00%';
    if (abs >= 1)      return p.toFixed(1) + '%';
    if (abs >= 0.1)    return p.toFixed(2) + '%';
    if (abs >= 0.01)   return p.toFixed(3) + '%';
    if (abs >= 0.001)  return p.toFixed(4) + '%';
    return p.toFixed(5) + '%';
}

function _renderShare(marketSystem) {
    const data = window.__game.state.get();
    const share = data.market.share || 0;
    const history = data.market.shareHistory || [];
    const competitors = data.market.competitors || [];
    const delta = marketSystem.getShareDelta();
    const arrow = delta > 0.0001 ? '↑' : delta < -0.0001 ? '↓' : '→';
    const arrowColor = delta > 0 ? 'var(--accent)' : delta < 0 ? 'var(--danger)' : 'var(--text-mute)';

    // [v2027.15a] Info diagnostik supaya pemain paham kenapa share kecil:
    // pasar global tahun 2000 ~30 juta unit/bulan, jauh lebih besar
    // dari skala pemain yang baru mulai.
    const latest = history[0] || null;
    const lastRev = latest && typeof latest.playerRevenue === 'number' ? latest.playerRevenue : 0;
    const lastEq  = latest && typeof latest.playerRevenueEq === 'number' ? latest.playerRevenueEq : 0;

    // Cari unit terjual bulan ini dari products catalog (total bulan berjalan
    // belum disimpan langsung, jadi pakai delta revenue / harga rata-rata).
    let lastUnits = 0;
    try {
        const cat = (data.products && data.products.catalog) || [];
        // dailySales entries hanya menyimpan per hari. Ambil yang gameMinute-nya
        // berada di bulan berjalan (approx 30 hari terakhir).
        const elapsed = (data.time && data.time.elapsedGameMinutes) || 0;
        const cutoff = elapsed - 30 * 24 * 60;
        cat.forEach(function (p) {
            (p.dailySales || []).forEach(function (d) {
                if (d.day >= cutoff && typeof d.sold === 'number') lastUnits += d.sold;
            });
        });
    } catch (e) { lastUnits = 0; }

    const infoHtml =
        '<div style="font-size:11.5px;color:var(--text-mute);margin-top:6px;line-height:1.5;">' +
            'Pendapatan bulan lalu: <b style="color:var(--text-secondary);">$' + lastRev.toLocaleString('en-US') + '</b>' +
            (lastUnits > 0 ? ' · ' + lastUnits.toLocaleString('en-US') + ' unit terjual' : '') +
            (lastEq > 0 ? '<br>Setara skala pasar: $' + lastEq.toLocaleString('en-US') : '') +
        '</div>';

    const html = `
        <div class="card">
            <div class="card-title">${t('market.share.title')}</div>
            <div style="display:flex;align-items:baseline;gap:10px;">
                <div style="font-size:28px;font-weight:800;color:var(--accent);">${_pct(share)}</div>
                <div style="font-size:13px;color:${arrowColor};">${arrow} ${_pct(Math.abs(delta))}</div>
            </div>
            <div style="font-size:11.5px;color:var(--text-mute);margin-top:4px;">${t('market.share.updated')}</div>
            ${infoHtml}
        </div>
        ${_renderShareChart(history)}
        <div class="card">
            <div class="card-title">${t('market.share.rank_title')}</div>
            <div class="sum-row">
                <span><b style="color:var(--accent);">${t('market.share.you')}</b></span>
                <b>${_pct(share)}</b>
            </div>
            ${competitors.slice().sort(function (a, b) { return b.share - a.share; }).map(function (c) {
                return '<div class="sum-row"><span>' + escapeHtml(c.name) + '</span><b>' + (c.share * 100).toFixed(1) + '%</b></div>';
            }).join('')}
            <div class="sum-row" style="color:var(--text-mute);"><span>${t('market.share.others')}</span><b>${_pct(Math.max(0, 1 - share - competitors.reduce(function (s, c) { return s + (c.share || 0); }, 0)))}</b></div>
        </div>
    `;
    return html;
}


// Terjemahan dengan fallback (aman walau file i18n belum diganti).
function _tx(key, idText, enText) {
    const v = t(key);
    if (v && v !== key) return v;
    let lang = 'id';
    try { lang = LanguageService.getLang(); } catch (e) {}
    return lang === 'id' ? idText : enText;
}

// Tick "cantik": 4 interval, langkah 1/2/2.5/5 x 10^k, menutup rentang [lo, hi].
function _niceAxis(lo, hi) {
    const raw = Math.max(1e-9, (hi - lo) / 4);
    const base = Math.pow(10, Math.floor(Math.log10(raw)));
    const mult = [1, 2, 2.5, 5, 10, 20, 50];
    for (let i = 0; i < mult.length; i++) {
        const step = base * mult[i];
        const nlo = Math.max(0, Math.floor(lo / step + 1e-9) * step);
        if (nlo + 4 * step >= hi - 1e-12) return { lo: nlo, hi: nlo + 4 * step, step: step };
    }
    return { lo: 0, hi: hi, step: hi / 4 };
}

// Desimal (dalam %) agar semua label sumbu punya presisi seragam.
function _axisDecimals(step) {
    const sp = step * 100;
    let d = 0;
    while (d < 5 && Math.abs(sp * Math.pow(10, d) - Math.round(sp * Math.pow(10, d))) > 1e-6) d++;
    return d;
}

let _shareFocus = false; // false = skala semua pemain, true = fokus ke garis Anda

let _scaleBound = false;
function _bindScaleToggle() {
    if (_scaleBound) return;
    _scaleBound = true;
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-share-scale]');
        if (!btn) return;
        _shareFocus = btn.dataset.shareScale === 'you';
        const card = btn.closest('.card');
        if (!card) return;
        card.querySelectorAll('[data-share-scale]').forEach(function (b) {
            const on = b === btn;
            b.style.background = on ? 'var(--accent)' : 'transparent';
            b.style.color = on ? '#fff' : 'var(--text-dim)';
        });
        card.querySelectorAll('.share-leg-comp').forEach(function (el) {
            el.style.opacity = _shareFocus ? '0.25' : '0.85';
        });
        const wrap = card.querySelector('.chart-wrap');
        if (wrap) drawShareChart(wrap);
    });
}
_bindScaleToggle();

const _COMP_COLORS = ['#6b8e23', '#c97f3c', '#8a5ec9'];
const _PLAYER_COLOR = '#4CAF50';
const _PLAYER_COLOR_DOWN = '#ef5350';

// Urutkan kronologis (lama -> baru) berdasarkan year/month, buang duplikat bulan.
// Tidak lagi bergantung pada asumsi "unshift = terbaru di index 0".
function _chrono(raw) {
    const seen = {};
    const out = [];
    (raw || []).forEach(function (h) {
        if (!h || typeof h.playerShare !== 'number' || !isFinite(h.playerShare)) return;
        const key = (h.year || 0) * 12 + (h.month || 0);
        if (seen[key]) return;
        seen[key] = true;
        out.push({ k: key, h: h });
    });
    out.sort(function (a, b) { return a.k - b.k; });
    return out.map(function (o) { return o.h; });
}

function _monthLabel(h) {
    const key = 'date.month.' + (h.month || 1);
    let m = t(key);
    if (m === key) m = String(h.month || 1);
    return m + ' ' + String(h.year || '').slice(-2);
}

function _renderShareChart(history) {
    const valid = _chrono(history);
    if (!valid.length) {
        return '<div class="card"><div class="card-title">' + t('market.share.chart_title') + '</div><div class="log-empty">' + t('market.share.chart_empty') + '</div></div>';
    }
    if (valid.length < 2) {
        return '<div class="card"><div class="card-title">' + t('market.share.chart_title') + '</div><div class="log-empty">' + t('market.share.chart_empty') + '</div></div>';
    }
    const id = 'share-chart-' + Math.random().toString(36).slice(2, 8);

    const state = window.__game && window.__game.state ? window.__game.state.get() : null;
    const compMeta = {};
    if (state && state.market && Array.isArray(state.market.competitors)) {
        state.market.competitors.forEach(function (c) { compMeta[c.id] = c; });
    }
    const latest = valid[valid.length - 1];
    const topComp = (latest && latest.competitors ? latest.competitors : [])
        .slice()
        .sort(function (a, b) { return b.share - a.share; })
        .slice(0, 3);

    const lastV = latest.playerShare, firstV = valid[0].playerShare;
    const pColor = lastV < firstV ? _PLAYER_COLOR_DOWN : _PLAYER_COLOR;

    const itemStyle = 'display:inline-flex;align-items:center;gap:4px;';
    const dotStyle = 'width:10px;height:3px;border-radius:2px;';
    const legendPlayer = '<span style="' + itemStyle + '"><span style="' + dotStyle + 'background:' + pColor + ';"></span>' + t('market.share.you') + '</span>';
    const legendComp = topComp.map(function (c, i) {
        const meta = compMeta[c.id] || { name: c.id };
        const color = _COMP_COLORS[i % _COMP_COLORS.length];
        return '<span class="share-leg-comp" style="' + itemStyle + 'opacity:' + (_shareFocus ? '0.25' : '0.85') + ';"><span style="' + dotStyle + 'background:' + color + ';"></span>' + escapeHtml(meta.name || c.id) + '</span>';
    }).join('');
    const legendHtml = '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;font-size:10.5px;color:var(--text-mute);">' + legendPlayer + legendComp + '</div>';

    return `
        <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
                <div class="card-title" style="margin:0;">${t('market.share.chart_title')}</div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <div style="display:inline-flex;border:1px solid var(--border);border-radius:8px;overflow:hidden;">
                        <button type="button" data-share-scale="all" style="padding:4px 9px;min-height:28px;font-size:11px;border:0;border-radius:0;background:${_shareFocus ? 'transparent' : 'var(--accent)'};color:${_shareFocus ? 'var(--text-dim)' : '#fff'};">${_tx('market.share.scale_all', 'Semua', 'All')}</button>
                        <button type="button" data-share-scale="you" style="padding:4px 9px;min-height:28px;font-size:11px;border:0;border-radius:0;background:${_shareFocus ? 'var(--accent)' : 'transparent'};color:${_shareFocus ? '#fff' : 'var(--text-dim)'};">${_tx('market.share.scale_you', 'Fokus Anda', 'Focus: You')}</button>
                    </div>
                    <button class="btn-secondary" type="button" data-chart-zoom="share" style="padding:4px 10px;min-height:28px;font-size:11px;">⤢ ${_tx('market.share.zoom', 'Zoom', 'Zoom')}</button>
                </div>
            </div>
            <div class="chart-wrap" id="${id}" style="height:150px;margin-top:8px;">
                <canvas class="chart-canvas" data-share-chart="${id}" style="height:150px;"></canvas>
            </div>
            ${legendHtml}
        </div>
    `;
}

let _resizeBound = false;
function _bindResizeRedraw() {
    if (_resizeBound) return;
    _resizeBound = true;
    let timer = null;
    window.addEventListener('resize', function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
            const wrap = document.querySelector('.chart-wrap[id^="share-chart-"]');
            if (wrap && wrap.offsetParent !== null) drawShareChart(wrap);
        }, 150);
    });
}

export function drawShareChart(container) {
    if (!container) return;
    const canvas = container.querySelector('canvas');
    if (!canvas) return;
    const game = window.__game;
    if (!game || !game.state) return;
    const history = _chrono(game.state.get().market.shareHistory);
    if (history.length < 2) return;
    _bindResizeRedraw();

    const cssW = container.clientWidth || 320;
    const cssH = container.clientHeight || 150;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const padL = 44, padR = 8, padT = 10, padB = 20;
    const plotW = cssW - padL - padR;
    const plotH = cssH - padT - padB;
    const n = history.length;

    // Data kompetitor per bulan (null = belum/tidak ada).
    let maxV = 0;
    const compSeries = {};
    history.forEach(function (h, i) {
        if (h.playerShare > maxV) maxV = h.playerShare;
        (h.competitors || []).forEach(function (c) {
            if (typeof c.share !== 'number' || !isFinite(c.share)) return;
            if (!compSeries[c.id]) compSeries[c.id] = new Array(n).fill(null);
            compSeries[c.id][i] = c.share;
        });
    });

    const latest = history[n - 1];
    const topComp = (latest.competitors || []).slice()
        .sort(function (a, b) { return b.share - a.share; })
        .slice(0, 3);
    // [fix] skala Y hanya dihitung dari series yang benar-benar digambar
    // (sebelumnya ikut semua kompetitor -> garis pemain gepeng bila ada kompetitor di luar top-3 besar).
    topComp.forEach(function (c) {
        (compSeries[c.id] || []).forEach(function (v) { if (v != null && v > maxV) maxV = v; });
    });
    // Skala Y. "Semua": 0..max semua garis. "Fokus Anda": rentang garis Anda saja.
    let axis;
    if (_shareFocus) {
        let pLo = Infinity, pHi = -Infinity;
        history.forEach(function (h) { if (h.playerShare < pLo) pLo = h.playerShare; if (h.playerShare > pHi) pHi = h.playerShare; });
        const span = Math.max(pHi - pLo, pHi * 0.2, 0.0001);
        axis = _niceAxis(Math.max(0, pLo - span * 0.1), pHi + span * 0.1);
    } else {
        axis = _niceAxis(0, Math.max(maxV * 1.08, 0.005));
    }
    const yLo = axis.lo, yHi = axis.hi;
    const dec = _axisDecimals(axis.step);

    const xOf = function (i) { return padL + (plotW * i) / (n - 1); };
    const yOf = function (v) { return padT + plotH - ((Math.max(yLo, Math.min(yHi, v)) - yLo) / (yHi - yLo)) * plotH; };

    // Grid + label Y: 5 garis, presisi seragam.
    ctx.font = '10px sans-serif';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
        const y = padT + (plotH * i) / 4;
        const val = Math.max(0, yHi - axis.step * i);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(cssW - padR, y); ctx.stroke();
        ctx.fillStyle = '#6a6a6a';
        ctx.textAlign = 'right';
        ctx.fillText((val * 100).toFixed(dec) + '%', padL - 4, y);
    }

    // Label X: awal, tengah, akhir (tanpa tumpang tindih).
    ctx.fillStyle = '#6a6a6a';
    ctx.textBaseline = 'top';
    const xIdx = n >= 5 ? [0, Math.round((n - 1) / 2), n - 1] : [0, n - 1];
    xIdx.forEach(function (i, k) {
        ctx.textAlign = k === 0 ? 'left' : (i === n - 1 ? 'right' : 'center');
        const x = k === 0 ? padL : (i === n - 1 ? cssW - 2 : xOf(i));
        ctx.fillText(_monthLabel(history[i]), x, padT + plotH + 6);
    });

    // Kompetitor dulu supaya garis pemain di atas.
    topComp.forEach(function (c, idx) {
        if (_shareFocus) return;
        const series = compSeries[c.id];
        if (!series) return;
        if (series.filter(function (v) { return v != null; }).length < 2) return;
        ctx.strokeStyle = _COMP_COLORS[idx % _COMP_COLORS.length];
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.65;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        let started = false;
        series.forEach(function (v, i) {
            if (v == null) { started = false; return; }
            const x = xOf(i), y = yOf(v);
            if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        });
        ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // Garis pemain.
    const firstVal = history[0].playerShare;
    const lastVal = latest.playerShare;
    const playerColor = lastVal < firstVal ? _PLAYER_COLOR_DOWN : _PLAYER_COLOR;
    ctx.strokeStyle = playerColor;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    history.forEach(function (h, i) {
        const x = xOf(i), y = yOf(h.playerShare);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = playerColor;
    ctx.beginPath();
    ctx.arc(xOf(n - 1), yOf(lastVal), 3.5, 0, Math.PI * 2);
    ctx.fill();
}

// ============================================================
// SUB-TAB KOMPETITOR
// ============================================================
function _renderCompetitors(competitorSystem) {
    if (!competitorSystem) return '<div class="empty"><div class="empty-ico">🏢</div><div class="empty-title">' + t('market.competitors.not_ready') + '</div></div>';
    const mode = window.__game.state.get().settings.competitorMode || 'real';
    const ids = competitorSystem.getActiveIds();
    if (!ids.length) return '<div class="empty"><div class="empty-ico">🏢</div><div class="empty-title">' + t('market.competitors.empty') + '</div></div>';

    const cards = ids.map(function (id) {
        const c = competitorSystem.getCompetitorData(id, mode);
        if (!c) return '';
        return `
            <div class="card comp-card" data-competitor-detail="${id}" style="border-left:3px solid ${c.color || '#333'};">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:14px;font-weight:700;">${escapeHtml(c.name)}</div>
                        <div style="font-size:11px;color:var(--text-mute);margin-top:2px;">${escapeHtml(c.country || '')} • ${_personalityLabel(c.personality)}</div>
                    </div>
                    <div style="text-align:right;flex-shrink:0;">
                        <div style="font-size:17px;font-weight:700;color:var(--info);">${((c.currentShare || 0) * 100).toFixed(1)}%</div>
                        <div style="font-size:10px;color:var(--text-mute);">${t('market.comp.share_label')}</div>
                    </div>
                </div>
                ${c.lastRelease ? '<div style="font-size:11.5px;color:var(--text-dim);margin-top:8px;">' + t('market.comp.latest', { name: escapeHtml(c.lastRelease.name), year: c.lastRelease.year }) + '</div>' : ''}
                <div style="font-size:10.5px;color:var(--text-mute);margin-top:4px;">${t('market.comp.os_tier', { os: escapeHtml(c.osName || '-'), tier: (c.currentTier || 1).toFixed(1) })}</div>
            </div>
        `;
    }).join('');

    return '<div class="comp-list">' + cards + '</div>';
}

// ============================================================
// SUB-TAB TREN
// ============================================================
function _renderTrends(marketSystem) {
    const trends = marketSystem.getTrends();
    const labels = {
        camera:      { key: 'market.trend.camera',      icon: '📷' },
        battery:     { key: 'market.trend.battery',     icon: '🔋' },
        screen:      { key: 'market.trend.screen',      icon: '📺' },
        performance: { key: 'market.trend.performance', icon: '⚡' },
        design:      { key: 'market.trend.design',      icon: '🎨' }
    };
    const sorted = Object.keys(trends).sort(function (a, b) { return trends[b] - trends[a]; });
    const top = sorted[0];

    return `
        <div class="card">
            <div class="card-title">${t('market.trends.title')}</div>
            <div style="font-size:13px;line-height:1.6;">
                ${t('market.trends.likes', { name: labels[top] ? t(labels[top].key) : top })}
            </div>
        </div>
        <div class="card">
            <div class="card-title">${t('market.trends.taste')}</div>
            ${sorted.map(function (k) {
                const v = Math.round((trends[k] || 0) * 100);
                const meta = labels[k] || { key: null, icon: '❓' };
                const labelText = meta.key ? t(meta.key) : k;
                return `
                    <div style="margin-bottom:10px;">
                        <div class="progress-label">
                            <span>${meta.icon} ${labelText}</span>
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
            <div class="card-title">${t('market.trends.note_title')}</div>
            <div style="font-size:12px;color:var(--text-dim);line-height:1.6;">
                ${t('market.trends.note_desc')}
            </div>
        </div>
    `;
}
