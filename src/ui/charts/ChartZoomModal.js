// FILE: src/ui/charts/ChartZoomModal.js
// v2027.1 — modal zoom chart kurva: pinch-zoom, pan, preset, legend toggle.
// Murni viewer — tidak mengubah state/ save/ sistem.
import { Modal } from '../modal.js';
import { t } from '../../core/LanguageService.js';

const COLORS = ['#4CAF50', '#6b8e23', '#c97f3c', '#8a5ec9', '#0a8aef', '#eb0028'];

let _cfg = null;
let _view = null;
let _gesture = null;
let _hidden = {};

// ============================================================
// Global button binder (self-execute sekali)
// ============================================================
let _bound = false;
function _bindGlobal() {
    if (_bound) return;
    _bound = true;
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-chart-zoom]');
        if (!btn) return;
        e.preventDefault();
        const type = btn.dataset.chartZoom;
        if (type === 'share') _openShareZoom();
    });
}
_bindGlobal();

// ============================================================
// MARKET SHARE — adapter
// ============================================================
function _openShareZoom() {
    const game = window.__game;
    if (!game || !game.state) return;
    const state = game.state.get();
    const hist = state.market.shareHistory || [];
    if (hist.length < 2) return;

    const sorted = [].concat(hist).reverse();

    const latest = sorted[sorted.length - 1];
    const topComp = (latest.competitors || []).slice()
        .sort((a, b) => b.share - a.share)
        .slice(0, 3);

    const compMeta = {};
    (state.market.competitors || []).forEach(c => { compMeta[c.id] = c; });

    const series = [{
        id: 'you',
        name: _youLabel(),
        color: COLORS[0],
        values: sorted.map(h => h.playerShare || 0)
    }];

    topComp.forEach((c, i) => {
        const meta = compMeta[c.id] || { name: c.id };
        series.push({
            id: c.id,
            name: meta.name || c.id,
            color: COLORS[(i + 1) % COLORS.length],
            values: sorted.map(h => {
                const entry = (h.competitors || []).find(x => x.id === c.id);
                return entry ? entry.share : null;
            })
        });
    });

    const labels = sorted.map(h => {
        const mKey = 'date.month.' + (h.month || 1);
        let mShort = t(mKey);
        if (mShort === mKey) mShort = String(h.month || 1);
        return mShort + ' ' + String(h.year || '').slice(-2);
    });

    _open({
        title: t('market.share.chart_title') || 'Pangsa Pasar',
        subtitle: t('market.share.title') || 'Your Market Share',
        series: series,
        labels: labels,
        yFmt: _fmtPctAuto,
        valueFmt: _fmtPctAuto
    });
}

function _youLabel() {
    const v = t('market.share.you');
    return (v && v !== 'market.share.you') ? v : 'Anda';
}

function _fmtPctAuto(v) {
    if (v == null || !isFinite(v)) return '—';
    const pct = v * 100;
    const abs = Math.abs(pct);
    if (abs >= 10) return pct.toFixed(1) + '%';
    if (abs >= 1) return pct.toFixed(2) + '%';
    if (abs >= 0.1) return pct.toFixed(2) + '%';
    if (abs >= 0.01) return pct.toFixed(3) + '%';
    if (abs === 0) return '0.00%';
    return pct.toFixed(4) + '%';
}

// ============================================================
// MODAL CORE
// ============================================================
function _open(cfg) {
    _cfg = cfg;
    _hidden = {};
    const total = cfg.labels.length;
    _view = { start: 0, end: total };
    _gesture = null;

    const html = _html(cfg);

    Modal.open('chart-zoom', html, {
        dismissible: true,
        onClose: function () { _cfg = null; _view = null; _gesture = null; }
    });

    const root = document.querySelector('[data-modal-id="chart-zoom"]');
    if (!root) return;

    _attachGestures(root);
    _attachPresets(root);
    _attachLegend(root);

    requestAnimationFrame(() => _draw(root));
}

function _html(cfg) {
    const legendItems = cfg.series.map(s =>
        '<button class="cz-legend-item" data-cz-toggle="' + _esc(s.id) + '" type="button">' +
            '<i style="background:' + s.color + ';"></i>' +
            '<span>' + _esc(s.name) + '</span>' +
        '</button>'
    ).join('');

    return '' +
        '<style>' +
            '.cz-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px;}' +
            '.cz-title{font-size:15px;font-weight:700;color:var(--text);line-height:1.2;}' +
            '.cz-sub{font-size:11px;color:var(--text-mute);margin-top:2px;}' +
            '.cz-close{width:32px;height:32px;min-height:32px;padding:0;font-size:14px;}' +
            '.cz-presets{display:flex;gap:5px;margin-bottom:8px;flex-wrap:wrap;}' +
            '.cz-preset{flex:1;min-width:0;padding:6px 8px;font-size:11px;font-weight:600;border-radius:6px;background:var(--bg-3);border:1px solid var(--border);color:var(--text-dim);}' +
            '.cz-preset.active{background:var(--accent);color:#fff;border-color:var(--accent);}' +
            '.cz-canvas-wrap{position:relative;width:100%;height:260px;background:var(--bg-3);border-radius:8px;overflow:hidden;touch-action:none;}' +
            '.cz-canvas{width:100%;height:100%;display:block;}' +
            '.cz-legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;}' +
            '.cz-legend-item{display:inline-flex;align-items:center;gap:4px;padding:4px 8px;font-size:11px;background:transparent;border:1px solid var(--border);border-radius:12px;color:var(--text-dim);cursor:pointer;}' +
            '.cz-legend-item.off{opacity:0.4;text-decoration:line-through;}' +
            '.cz-legend-item i{width:12px;height:3px;border-radius:2px;display:inline-block;}' +
            '.cz-hint{font-size:10.5px;color:var(--text-mute);text-align:center;margin-top:8px;}' +
            '.cz-tip{position:absolute;background:rgba(0,0,0,0.85);color:#fff;font-size:10.5px;padding:4px 7px;border-radius:4px;pointer-events:none;white-space:nowrap;transform:translate(-50%,-100%);display:none;z-index:10;}' +
        '</style>' +
        '<div class="cz-head">' +
            '<div>' +
                '<div class="cz-title">' + _esc(cfg.title) + '</div>' +
                (cfg.subtitle ? '<div class="cz-sub">' + _esc(cfg.subtitle) + '</div>' : '') +
            '</div>' +
            '<button class="btn-secondary cz-close" data-modal-close type="button">✕</button>' +
        '</div>' +
        '<div class="cz-presets" data-cz-presets>' +
            _presetBtn('all', 'Semua', true) +
            _presetBtn('24', '24 bln', false) +
            _presetBtn('12', '12 bln', false) +
            _presetBtn('6', '6 bln', false) +
        '</div>' +
        '<div class="cz-canvas-wrap" data-cz-wrap>' +
            '<canvas class="cz-canvas" data-cz-canvas></canvas>' +
            '<div class="cz-tip" data-cz-tip></div>' +
        '</div>' +
        '<div class="cz-legend" data-cz-legend>' + legendItems + '</div>' +
        '<div class="cz-hint">Cubit untuk zoom · Geser untuk pan · Ketuk titik untuk nilai</div>';
}

function _presetBtn(id, label, active) {
    return '<button class="cz-preset' + (active ? ' active' : '') + '" ' +
        'data-cz-preset="' + id + '" type="button">' + _esc(label) + '</button>';
}

// ============================================================
// PRESET RANGE
// ============================================================
function _attachPresets(root) {
    root.querySelector('[data-cz-presets]').addEventListener('click', function (e) {
        const btn = e.target.closest('[data-cz-preset]');
        if (!btn) return;
        const id = btn.dataset.czPreset;
        const total = _cfg.labels.length;
        let end = total;
        let start = 0;
        if (id === '6') start = Math.max(0, total - 6);
        else if (id === '12') start = Math.max(0, total - 12);
        else if (id === '24') start = Math.max(0, total - 24);
        _view = { start: start, end: end };
        root.querySelectorAll('[data-cz-preset]').forEach(b =>
            b.classList.toggle('active', b.dataset.czPreset === id)
        );
        _draw(root);
    });
}

// ============================================================
// LEGEND TOGGLE
// ============================================================
function _attachLegend(root) {
    root.querySelector('[data-cz-legend]').addEventListener('click', function (e) {
        const btn = e.target.closest('[data-cz-toggle]');
        if (!btn) return;
        const id = btn.dataset.czToggle;
        _hidden[id] = !_hidden[id];
        btn.classList.toggle('off', !!_hidden[id]);
        _draw(root);
    });
}

// ============================================================
// GESTURE — pinch zoom & pan
// ============================================================
function _attachGestures(root) {
    const wrap = root.querySelector('[data-cz-wrap]');
    const canvas = root.querySelector('[data-cz-canvas]');
    if (!wrap || !canvas) return;

    let touches = [];
    let lastCenter = 0;
    let lastDist = 0;
    let panStartIdx = 0;

    function _centerOf(t) {
        return (t[0].clientX + t[1].clientX) / 2;
    }
    function _distOf(t) {
        const dx = t[0].clientX - t[1].clientX;
        const dy = t[0].clientY - t[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    wrap.addEventListener('touchstart', function (e) {
        touches = Array.from(e.touches);
        if (touches.length === 2) {
            lastCenter = _centerOf(touches);
            lastDist = _distOf(touches);
        } else if (touches.length === 1) {
            panStartIdx = _view.start;
        }
    }, { passive: true });

    wrap.addEventListener('touchmove', function (e) {
        const t = Array.from(e.touches);
        if (t.length === 2 && touches.length === 2) {
            e.preventDefault();
            const dist = _distOf(t);
            const center = _centerOf(t);

            if (lastDist > 0) {
                const ratio = dist / lastDist;
                const span = _view.end - _view.start;
                const newSpan = Math.max(3, Math.min(_cfg.labels.length, Math.round(span / ratio)));
                const mid = (lastCenter / wrap.clientWidth) * span + _view.start;
                let newStart = Math.round(mid - (mid - _view.start) / ratio);
                let newEnd = newStart + newSpan;
                if (newStart < 0) { newEnd -= newStart; newStart = 0; }
                if (newEnd > _cfg.labels.length) { newStart = _cfg.labels.length - newSpan; newEnd = _cfg.labels.length; }
                if (newStart < 0) newStart = 0;
                _view.start = newStart;
                _view.end = newEnd;
                lastCenter = center;
                lastDist = dist;
                _draw(root);
            }
        } else if (t.length === 1 && touches.length === 1) {
            const dx = t[0].clientX - touches[0].clientX;
            const span = _view.end - _view.start;
            const shift = Math.round((dx / wrap.clientWidth) * span);
            let newStart = panStartIdx - shift;
            let newEnd = newStart + span;
            if (newStart < 0) { newStart = 0; newEnd = span; }
            if (newEnd > _cfg.labels.length) { newEnd = _cfg.labels.length; newStart = newEnd - span; }
            _view.start = newStart;
            _view.end = newEnd;
            _draw(root);
        }
    }, { passive: false });

    wrap.addEventListener('touchend', function (e) {
        touches = Array.from(e.touches);
        if (touches.length < 2) lastDist = 0;
    });

    // Tap → tooltip
    wrap.addEventListener('click', function (e) {
        const rect = wrap.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        _showTooltip(root, x, y);
    });
}

// ============================================================
// TOOLTIP
// ============================================================
function _showTooltip(root, x, y) {
    const tip = root.querySelector('[data-cz-tip]');
    const wrap = root.querySelector('[data-cz-wrap]');
    if (!tip || !wrap) return;
    const W = wrap.clientWidth;
    const span = _view.end - _view.start;
    const rel = Math.max(0, Math.min(1, x / W));
    const idx = Math.round(_view.start + rel * (span - 1));
    if (idx < 0 || idx >= _cfg.labels.length) return;

    const label = _cfg.labels[idx];
    const lines = [label];
    _cfg.series.forEach(s => {
        if (_hidden[s.id]) return;
        const v = s.values[idx];
        if (v == null) return;
        lines.push(s.name + ': ' + (_cfg.valueFmt ? _cfg.valueFmt(v) : v));
    });

    tip.textContent = lines.join(' · ');
    tip.style.left = x + 'px';
    tip.style.top = Math.max(20, y - 6) + 'px';
    tip.style.display = 'block';
    clearTimeout(_showTooltip._t);
    _showTooltip._t = setTimeout(() => { tip.style.display = 'none'; }, 2600);
}

// ============================================================
// DRAW
// ============================================================
function _draw(root) {
    if (!root || !_cfg || !_view) return;
    const canvas = root.querySelector('[data-cz-canvas]');
    const wrap = root.querySelector('[data-cz-wrap]');
    if (!canvas || !wrap) return;

    const cssW = wrap.clientWidth || 320;
    const cssH = wrap.clientHeight || 260;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const start = _view.start;
    const end = _view.end;
    const span = end - start;
    if (span < 2) return;

    // Cari min/max Y dari series yang tidak di-hide
    let minV = Infinity, maxV = -Infinity;
    _cfg.series.forEach(s => {
        if (_hidden[s.id]) return;
        for (let i = start; i < end; i++) {
            const v = s.values[i];
            if (v == null || !isFinite(v)) continue;
            if (v < minV) minV = v;
            if (v > maxV) maxV = v;
        }
    });
    if (minV === Infinity) { minV = 0; maxV = 1; }
    if (minV === maxV) { minV = Math.max(0, minV * 0.9); maxV = maxV * 1.1; }
    const pad = (maxV - minV) * 0.10;
    minV = Math.max(0, minV - pad);
    maxV = maxV + pad;
    const range = maxV - minV || 1;

    const padL = 48, padR = 10, padT = 14, padB = 26;
    const plotW = cssW - padL - padR;
    const plotH = cssH - padT - padB;

    const xOf = i => padL + (plotW * (i - start)) / (span - 1);
    const yOf = v => padT + plotH - ((v - minV) / range) * plotH;

    // Grid + label Y
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padT + (plotH * i) / 4;
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(cssW - padR, y); ctx.stroke();

        const v = maxV - (range * i) / 4;
        ctx.fillStyle = '#6a6a6a';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(_cfg.yFmt ? _cfg.yFmt(v) : String(v), padL - 4, y);
    }

    // X labels: tunjukkan ~4-5 label
    const step = Math.max(1, Math.floor(span / 5));
    ctx.fillStyle = '#6a6a6a';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = start; i < end; i += step) {
        ctx.fillText(_cfg.labels[i], xOf(i), padT + plotH + 6);
    }
    if ((end - 1 - start) % step !== 0) {
        ctx.fillText(_cfg.labels[end - 1], xOf(end - 1), padT + plotH + 6);
    }

    // Draw each series
    _cfg.series.forEach(s => {
        if (_hidden[s.id]) return;

        // Area gradient
        const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
        grad.addColorStop(0, _hexA(s.color, 0.22));
        grad.addColorStop(1, _hexA(s.color, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        let firstX = null;
        for (let i = start; i < end; i++) {
            const v = s.values[i];
            if (v == null) continue;
            const x = xOf(i), y = yOf(v);
            if (firstX == null) { ctx.moveTo(x, padT + plotH); firstX = x; }
            ctx.lineTo(x, y);
        }
        if (firstX == null) return;
        ctx.lineTo(xOf(end - 1), padT + plotH);
        ctx.closePath();
        ctx.fill();

        // Line
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        let started = false;
        for (let i = start; i < end; i++) {
            const v = s.values[i];
            if (v == null) { started = false; continue; }
            const x = xOf(i), y = yOf(v);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Endpoint dot (hanya untuk garis 'you' / index 0)
        if (s.id === 'you') {
            const lastIdx = end - 1;
            for (let i = lastIdx; i >= start; i--) {
                if (s.values[i] != null) {
                    const x = xOf(i), y = yOf(s.values[i]);
                    ctx.fillStyle = s.color;
                    ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.stroke();
                    break;
                }
            }
        }
    });
}

// ============================================================
// UTIL
// ============================================================
function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function _hexA(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }
