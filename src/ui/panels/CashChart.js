// FILE: src/ui/panels/CashChart.js
// v2027.31a — Chart keuangan: skala Y otomatis "nice", outlier di-clip + ditandai,
// gutter label sumbu (tidak menimpa garis), gradien area, tooltip sentuh/geser.
import { t } from '../../core/LanguageService.js';
import { formatCurrency, formatCompactMoney } from '../../utils/format.js';

// ---------------- SKALA Y (murni, bisa diuji) ----------------
function _niceNum(x, round) {
    if (!(x > 0)) return 1;
    var exp = Math.floor(Math.log10(x));
    var f = x / Math.pow(10, exp);
    var nf;
    if (round) nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
    else       nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
    return nf * Math.pow(10, exp);
}

// Mengembalikan { min, max, step, ticks[], clipped, rawMax }.
// - Selalu memasukkan 0 ke rentang (baseline jelas).
// - Jika satu-dua bulan jauh di atas yang lain (outlier), sumbu dipotong di
//   batas wajar dan titik outlier ditandai (clipped = true) supaya bentuk garis
//   bulan-bulan lain tetap terbaca.
export function computeCashScale(values, intervals) {
    var n = intervals || 4;
    var vals = (values || []).filter(function (v) { return Number.isFinite(v); });
    if (!vals.length) return { min: 0, max: 1, step: 1, ticks: [0, 1], clipped: false, rawMax: 0 };

    var lo = Math.min.apply(null, vals.concat([0]));
    var rawMax = Math.max.apply(null, vals.concat([0]));
    var hi = rawMax;
    var clipped = false;

    if (vals.length >= 6 && rawMax > 0) {
        var sorted = vals.slice().sort(function (a, b) { return a - b; });
        var q85 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.85))];
        var core = Math.max(q85, 0);
        var cap = core + Math.max(core - lo, 1) * 0.35;
        if (rawMax > cap * 2.2) { hi = cap; clipped = true; }
    }
    if (hi === lo) hi = lo + 1;

    var range = _niceNum(hi - lo, false);
    var step = _niceNum(range / n, true);
    // Atas: naik ke kelipatan step berikutnya. Bawah: kalau ada nilai negatif, sumbu hanya
    // turun sedikit di bawah nilai terendah (bukan satu step penuh) supaya tidak boros ruang.
    var max = Math.ceil(hi / step) * step;
    var min = lo < 0 ? lo - (hi - lo) * 0.06 : 0;
    if (max <= min) max = min + step;

    var ticks = [];
    for (var v = Math.ceil(min / step) * step; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
    return { min: min, max: max, step: step, ticks: ticks, clipped: clipped, rawMax: rawMax };
}

// ---------------- MARKUP ----------------
export function renderCashChart(state) {
    var id = 'cash-chart-' + Math.random().toString(36).slice(2, 8);
    var hist = (state.finance && state.finance.history) || [];
    var hasData = hist.length >= 2;

    var pill = '';
    if (hasData) {
        var diff = (Number(hist[0].cash) || 0) - (Number(hist[hist.length - 1].cash) || 0);
        var cls = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
        var arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '■';
        pill = '<span class="ov-delta ' + cls + '">' + arrow + ' ' + formatCompactMoney(diff, { plus: true }) + '</span>';
    }

    return '<section class="ov-sec ov-card ov-chart">' +
        '<div class="ov-sec-head">' +
            '<h3 class="ov-sec-title">' + t('chart.cash_title') + '</h3>' +
            pill +
        '</div>' +
        '<div class="chart-wrap" id="' + id + '">' +
            '<canvas class="chart-canvas" data-chart-id="' + id + '"></canvas>' +
            (hasData ? '' : '<div class="chart-empty">' + t('chart.cash_empty') + '</div>') +
        '</div>' +
    '</section>';
}

// ---------------- GAMBAR ----------------
function _css(name, fb) {
    try {
        var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return v || fb;
    } catch (e) { return fb; }
}

function _rgba(color, a) {
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color || '');
    if (!m) return 'rgba(16,185,129,' + a + ')';
    var h = m[1];
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    return 'rgba(' + parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16) + ',' + a + ')';
}

function _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function _monthLabel(h) {
    var key = 'date.month.' + (h.month || 1);
    var m = t(key);
    return (m === key ? String(h.month) : m) + ' ' + String(h.year).slice(-2);
}

export function drawCashChart(container) {
    if (!container) return;
    var canvas = container.querySelector('canvas');
    if (!canvas) return;
    var game = window.__game;
    if (!game || !game.state) return;
    var st = game.state.get();
    var hist = ((st.finance && st.finance.history) || []).slice().reverse(); // lama -> baru
    if (hist.length < 2) return;

    var cssW = container.clientWidth || 320;
    var cssH = container.clientHeight || 150;
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    var ctx = canvas.getContext('2d');

    var cUp = _css('--success', '#10b981');
    var cDown = _css('--danger', '#ef4444');
    var cGrid = _css('--border', 'rgba(255,255,255,0.07)');
    var cText = _css('--text-tertiary', '#6a7280');
    var cStrong = _css('--text-primary', '#e8eaee');
    var cBg = _css('--bg-3', '#1e2530');
    var cBg2 = _css('--bg-2', '#161b24');

    var n = hist.length;
    var values = hist.map(function (h) { return Number(h.cash) || 0; });
    var scale = computeCashScale(values, 4);
    var trendUp = values[n - 1] >= values[0];
    var cLine = trendUp ? cUp : cDown;

    // gutter kiri mengikuti lebar label terpanjang -> label tak pernah menimpa garis
    ctx.font = '10px sans-serif';
    var labels = scale.ticks.map(function (v) { return formatCompactMoney(v); });
    var maxLabelW = 0;
    labels.forEach(function (s) { maxLabelW = Math.max(maxLabelW, ctx.measureText(s).width); });
    var padL = Math.ceil(maxLabelW) + 10, padR = 12, padT = 14, padB = 22;
    var plotW = Math.max(40, cssW - padL - padR);
    var plotH = Math.max(40, cssH - padT - padB);
    var span = scale.max - scale.min;

    function xOf(i) { return padL + (plotW * i) / (n - 1); }
    function yOf(v) {
        var c = Math.min(Math.max(v, scale.min), scale.max);
        return padT + plotH - ((c - scale.min) / span) * plotH;
    }

    var maxIdx = values.indexOf(Math.max.apply(null, values));

    function draw(sel) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);

        // grid + label Y
        ctx.font = '10px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'right';
        scale.ticks.forEach(function (v, i) {
            var y = yOf(v);
            ctx.strokeStyle = cGrid;
            ctx.lineWidth = 1;
            ctx.setLineDash(v === 0 && scale.min < 0 ? [4, 3] : []);
            ctx.beginPath(); ctx.moveTo(padL, y + 0.5); ctx.lineTo(padL + plotW, y + 0.5); ctx.stroke();
            ctx.fillStyle = cText;
            ctx.fillText(labels[i], padL - 6, y);
        });
        ctx.setLineDash([]);

        // area gradien
        var grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
        grad.addColorStop(0, _rgba(cLine, 0.28));
        grad.addColorStop(1, _rgba(cLine, 0));
        var baseY = yOf(Math.max(0, scale.min));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(xOf(0), baseY);
        for (var i = 0; i < n; i++) ctx.lineTo(xOf(i), yOf(values[i]));
        ctx.lineTo(xOf(n - 1), baseY);
        ctx.closePath();
        ctx.fill();

        // garis
        ctx.strokeStyle = cLine;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (var j = 0; j < n; j++) {
            if (j === 0) ctx.moveTo(xOf(j), yOf(values[j])); else ctx.lineTo(xOf(j), yOf(values[j]));
        }
        ctx.stroke();

        // penanda outlier yang dipotong
        if (scale.clipped) {
            for (var k = 0; k < n; k++) {
                if (values[k] > scale.max) {
                    var tx = xOf(k), ty = padT - 1;
                    ctx.fillStyle = cLine;
                    ctx.beginPath(); ctx.moveTo(tx, ty - 4); ctx.lineTo(tx - 4, ty + 3); ctx.lineTo(tx + 4, ty + 3); ctx.closePath(); ctx.fill();
                }
            }
            ctx.font = '600 10px sans-serif';
            ctx.textBaseline = 'alphabetic';
            var peakTxt = formatCompactMoney(values[maxIdx]);
            var pw = ctx.measureText(peakTxt).width;
            ctx.textAlign = 'left';
            var px = Math.min(Math.max(xOf(maxIdx) + 7, padL), cssW - padR - pw);
            ctx.fillStyle = cLine;
            ctx.fillText(peakTxt, px, padT + 1);
        }

        // titik terakhir
        var lx = xOf(n - 1), ly = yOf(values[n - 1]);
        ctx.fillStyle = cBg2; ctx.beginPath(); ctx.arc(lx, ly, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = cLine; ctx.beginPath(); ctx.arc(lx, ly, 3.2, 0, Math.PI * 2); ctx.fill();

        // label X: awal, tengah, akhir
        ctx.font = '10px sans-serif';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = cText;
        var yLab = cssH - 6;
        ctx.textAlign = 'left';  ctx.fillText(_monthLabel(hist[0]), padL, yLab);
        ctx.textAlign = 'right'; ctx.fillText(_monthLabel(hist[n - 1]), padL + plotW, yLab);
        if (n >= 7) {
            var mid = Math.floor((n - 1) / 2);
            ctx.textAlign = 'center'; ctx.fillText(_monthLabel(hist[mid]), xOf(mid), yLab);
        }

        // tooltip
        if (sel != null && sel >= 0 && sel < n) {
            var sx = xOf(sel), sy = yOf(values[sel]);
            ctx.strokeStyle = cText; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
            ctx.beginPath(); ctx.moveTo(sx + 0.5, padT); ctx.lineTo(sx + 0.5, padT + plotH); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = cBg2; ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = cLine; ctx.beginPath(); ctx.arc(sx, sy, 3.5, 0, Math.PI * 2); ctx.fill();

            var l1 = _monthLabel(hist[sel]);
            var l2 = formatCurrency(values[sel]);
            ctx.font = '10px sans-serif';
            var w1 = ctx.measureText(l1).width;
            ctx.font = '700 12px sans-serif';
            var w2 = ctx.measureText(l2).width;
            var bw = Math.max(w1, w2) + 16, bh = 36;
            var bx = Math.min(Math.max(sx - bw / 2, padL), cssW - padR - bw);
            var by = 2;
            ctx.fillStyle = cBg; ctx.strokeStyle = cGrid; ctx.lineWidth = 1;
            _roundRect(ctx, bx, by, bw, bh, 8); ctx.fill(); ctx.stroke();
            ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
            ctx.font = '10px sans-serif'; ctx.fillStyle = cText;
            ctx.fillText(l1, bx + 8, by + 14);
            ctx.font = '700 12px sans-serif'; ctx.fillStyle = cStrong;
            ctx.fillText(l2, bx + 8, by + 29);
        }
    }

    canvas.__ovDraw = draw;
    canvas.__ovGeom = { padL: padL, plotW: plotW, n: n, sel: null };
    draw(null);

    // Sentuh / geser untuk melihat nilai per bulan (bind sekali per canvas).
    if (!canvas.__ovBound) {
        canvas.__ovBound = true;
        var idxOf = function (ev) {
            var g = canvas.__ovGeom;
            var rect = canvas.getBoundingClientRect();
            var r = (ev.clientX - rect.left - g.padL) / g.plotW;
            return Math.max(0, Math.min(g.n - 1, Math.round(r * (g.n - 1))));
        };
        canvas.addEventListener('pointerdown', function (ev) {
            var g = canvas.__ovGeom, i = idxOf(ev);
            g.sel = (g.sel === i && ev.pointerType !== 'mouse') ? null : i;
            canvas.__ovDraw(g.sel);
        });
        canvas.addEventListener('pointermove', function (ev) {
            if (ev.pointerType === 'mouse' || ev.buttons) {
                var g = canvas.__ovGeom; g.sel = idxOf(ev); canvas.__ovDraw(g.sel);
            }
        });
        canvas.addEventListener('pointerleave', function (ev) {
            if (ev.pointerType === 'mouse') { canvas.__ovGeom.sel = null; canvas.__ovDraw(null); }
        });
    }
}
