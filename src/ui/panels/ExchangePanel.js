// FILE: src/ui/panels/ExchangePanel.js
// v2027.1a — Panel Exchange (Sesi 1: display only).
import { t } from '../../core/LanguageService.js';
import {
    STOCKS, MARKET_INDICES, STOCK_CATEGORIES, CURRENCIES,
    getStockById, getStocksForYear
} from '../../data/stocks.data.js';

// ---------- Modul state ----------
var _selectedCategory = 'all';
var _selectedStockId = null;

export function setExchangeCategory(catId) { _selectedCategory = catId; }
export function setExchangeStock(stockId)   { _selectedStockId = stockId; }
export function getExchangeCategory()       { return _selectedCategory; }
export function getExchangeStock()          { return _selectedStockId; }

// ---------- Helper ----------
function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function _fmtCurrency(value, currency) {
    var c = CURRENCIES[currency] || CURRENCIES.USD;
    var n = Number(value);
    if (!isFinite(n)) return '—';
    var formatted = n.toLocaleString('en-US', {
        minimumFractionDigits: c.decimals,
        maximumFractionDigits: c.decimals
    });
    return c.symbol + formatted;
}

function _fmtChange(pct) {
    if (!isFinite(pct) || pct === 0) return '0.00%';
    var sign = pct > 0 ? '+' : '';
    return sign + (pct * 100).toFixed(2) + '%';
}

function _changeColor(pct) {
    if (pct > 0.0001) return 'var(--success)';
    if (pct < -0.0001) return 'var(--danger)';
    return 'var(--text-mute)';
}

function _categoryLabel(id) {
    for (var i = 0; i < STOCK_CATEGORIES.length; i++) {
        if (STOCK_CATEGORIES[i].id === id) return STOCK_CATEGORIES[i].label;
    }
    return id;
}

// ============================================================
// RENDER UTAMA
// ============================================================
export function renderExchangePanel({ stockSystem }) {
    if (!stockSystem) {
        return '<div class="card"><div class="card-title">Exchange</div>' +
            '<div style="font-size:12px;color:var(--text-mute);">Stock system belum siap.</div></div>';
    }

    var activeStocks = getStocksForYear(stockSystem.state.data.time.currentYear);

    // Auto-pilih saham pertama jika belum ada.
    if (!_selectedStockId && activeStocks.length) {
        _selectedStockId = activeStocks[0].id;
    }

    var html = '';
    html += _renderIndices(stockSystem);
    html += _renderCategoryFilter();
    html += _renderStockList(stockSystem, activeStocks);
    html += _renderDetail(stockSystem);
    html += _renderPortfolio(stockSystem);

    return html;
}

// ---------- Indeks Makro ----------
function _renderIndices(stockSystem) {
    var cards = MARKET_INDICES.map(function (idx) {
        var v = stockSystem.getIndexValue(idx.id);
        return '<div class="card" style="padding:10px;flex:1;min-width:0;">' +
            '<div style="font-size:10px;color:var(--text-mute);font-weight:700;letter-spacing:0.4px;">' +
                escapeHtml(idx.ticker) + '</div>' +
            '<div style="font-size:11.5px;color:var(--text-dim);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
                escapeHtml(idx.name) + '</div>' +
            '<div style="font-size:16px;font-weight:800;color:var(--accent);margin-top:6px;">' +
                v.toLocaleString('en-US', { maximumFractionDigits: 2 }) + '</div>' +
        '</div>';
    }).join('');

    return '<div style="display:flex;gap:8px;margin-bottom:12px;">' + cards + '</div>';
}

// ---------- Filter Kategori ----------
function _renderCategoryFilter() {
    var tabs = [{ id: 'all', label: 'Semua' }].concat(STOCK_CATEGORIES.filter(function (c) {
        return c.id !== 'player';  // player tampil terpisah
    }));

    return '<div class="subtab-bar" style="overflow-x:auto;white-space:nowrap;">' +
        tabs.map(function (c) {
            var active = (_selectedCategory === c.id) ? ' active' : '';
            return '<button class="subtab-btn' + active + '" data-ex-cat="' + c.id + '">' +
                escapeHtml(c.label) + '</button>';
        }).join('') +
    '</div>';
}

// ---------- Daftar Saham ----------
function _renderStockList(stockSystem, activeStocks) {
    var list = activeStocks.filter(function (s) {
        return _selectedCategory === 'all' || s.category === _selectedCategory;
    });

    if (!list.length) {
        return '<div class="card"><div class="log-empty">Tidak ada emiten di kategori ini.</div></div>';
    }

    var rows = list.map(function (s) {
        var price = stockSystem.getPrice(s.id);
        var change = stockSystem.getChangePercent(s.id);
        var color = _changeColor(change);
        var isSel = (s.id === _selectedStockId);
        var arrow = change > 0.0001 ? '▲' : (change < -0.0001 ? '▼' : '·');
        var bg = isSel ? 'background:rgba(79,140,255,0.08);border-left:3px solid var(--accent);' : 'border-left:3px solid transparent;';
        return '<div data-ex-select="' + s.id + '" style="display:flex;align-items:center;gap:10px;padding:8px 10px;cursor:pointer;' + bg + '">' +
            '<div style="flex-shrink:0;width:56px;font-size:12px;font-weight:800;color:var(--text-dim);">' + escapeHtml(s.ticker) + '</div>' +
            '<div style="flex:1;min-width:0;">' +
                '<div style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(s.name) + '</div>' +
                '<div style="font-size:10px;color:var(--text-mute);">' + escapeHtml(_categoryLabel(s.category)) + '</div>' +
            '</div>' +
            '<div style="text-align:right;flex-shrink:0;">' +
                '<div style="font-size:12.5px;font-weight:700;">' + _fmtCurrency(price, s.currency) + '</div>' +
                '<div style="font-size:10.5px;color:' + color + ';">' + arrow + ' ' + _fmtChange(change) + '</div>' +
            '</div>' +
        '</div>';
    }).join('');

    return '<div class="card" style="padding:0;">' +
        '<div style="padding:12px 14px 8px;font-size:11px;font-weight:700;letter-spacing:0.4px;color:var(--text-mute);">' +
            'DAFTAR EMITEN · ' + list.length +
        '</div>' +
        rows +
    '</div>';
}

// ---------- Detail Emiten Terpilih ----------
function _renderDetail(stockSystem) {
    if (!_selectedStockId) return '';
    var stock = getStockById(_selectedStockId);
    if (!stock) return '';

    var price = stockSystem.getPrice(stock.id);
    var change = stockSystem.getChangePercent(stock.id);
    var color = _changeColor(change);
    var arrow = change > 0.0001 ? '▲' : (change < -0.0001 ? '▼' : '·');
    var arrowColor = change > 0 ? 'var(--success)' : change < 0 ? 'var(--danger)' : 'var(--text-mute)';

    var tickerLine = escapeHtml(stock.ticker) +
        (stock.realTicker ? ' <span style="font-size:10.5px;color:var(--text-mute);">(' + escapeHtml(stock.realTicker) + ')</span>' : '');

    var infoRows = '';
    infoRows += '<div class="sum-row"><span>Negara</span><b>' + escapeHtml(stock.country || '—') + '</b></div>';
    infoRows += '<div class="sum-row"><span>Kategori</span><b>' + escapeHtml(_categoryLabel(stock.category)) + '</b></div>';
    infoRows += '<div class="sum-row"><span>Mata Uang</span><b>' + escapeHtml(stock.currency) + '</b></div>';
    infoRows += '<div class="sum-row"><span>Listing</span><b>' + (stock.listedFrom || '—') +
        (stock.listedTo ? ' – ' + stock.listedTo : ' – sekarang') + '</b></div>';

    return '<div class="card">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">' +
            '<div style="min-width:0;">' +
                '<div style="font-size:18px;font-weight:800;">' + escapeHtml(stock.name) + '</div>' +
                '<div style="font-size:12px;color:var(--text-mute);margin-top:2px;">' + tickerLine + '</div>' +
            '</div>' +
            '<div style="text-align:right;flex-shrink:0;">' +
                '<div style="font-size:18px;font-weight:800;color:var(--accent);">' + _fmtCurrency(price, stock.currency) + '</div>' +
                '<div style="font-size:12px;color:' + color + ';">' + arrow + ' ' + _fmtChange(change) + '</div>' +
            '</div>' +
        '</div>' +
        '<div style="margin-top:12px;">' +
            '<div style="font-size:11px;font-weight:700;color:var(--text-mute);letter-spacing:0.4px;margin-bottom:6px;">' +
                'GRAFIK HARGA' +
            '</div>' +
            '<div class="chart-wrap" data-ex-chart style="height:160px;position:relative;">' +
                '<canvas style="width:100%;height:160px;"></canvas>' +
            '</div>' +
        '</div>' +
        '<div style="margin-top:12px;">' + infoRows + '</div>' +
        '<div style="font-size:10.5px;color:var(--text-mute);margin-top:10px;line-height:1.5;">' +
            (stock.confidence === 'trend' ? 'Kurva harga bersifat perkiraan berbasis tren.' : 'Data historis split-adjusted dari sumber publik.') +
        '</div>' +
    '</div>';
}

// ---------- Portofolio ----------
function _renderPortfolio(stockSystem) {
    var d = stockSystem.state.data;
    var cash = d.cash || 0;
    return '<div class="card">' +
        '<div class="card-title">Portofolio</div>' +
        '<div class="sum-row"><span>Uang Tunai</span><b>$' + Math.round(cash).toLocaleString('en-US') + '</b></div>' +
        '<div class="sum-row"><span>Nilai Saham</span><b>$0</b></div>' +
        '<div class="sum-row"><span style="color:var(--text-mute);">Total Aset</span>' +
            '<b>$' + Math.round(cash).toLocaleString('en-US') + '</b></div>' +
        '<div style="font-size:11px;color:var(--text-mute);margin-top:8px;line-height:1.5;">' +
            'Fitur jual-beli saham akan hadir di update berikutnya.' +
        '</div>' +
    '</div>';
}

// ============================================================
// GRAFIK — dipanggil dari main.js setelah render.
// ============================================================
export function drawExchangeChart(container) {
    if (!container) return;
    var canvas = container.querySelector('canvas');
    if (!canvas) return;
    var game = window.__game;
    if (!game || !game.stocks) return;
    if (!_selectedStockId) return;

    var series = game.stocks.getSeries(_selectedStockId);
    if (series.length < 2) return;

    var stock = getStockById(_selectedStockId);
    if (!stock) return;

    var cssW = container.clientWidth || 320;
    var cssH = 160;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    var padL = 46, padR = 8, padT = 10, padB = 18;
    var plotW = cssW - padL - padR;
    var plotH = cssH - padT - padB;

    // Cari min & max untuk auto-scale.
    var minV = Infinity, maxV = -Infinity;
    series.forEach(function (p) {
        if (p.value < minV) minV = p.value;
        if (p.value > maxV) maxV = p.value;
    });
    if (minV === maxV) { minV = minV * 0.95; maxV = maxV * 1.05; }
    var range = maxV - minV;

    var xOf = function (i) { return padL + (plotW * i) / (series.length - 1); };
    var yOf = function (v) { return padT + plotH - ((v - minV) / range) * plotH; };

    // Grid.
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (var i = 1; i <= 3; i++) {
        var y = padT + (plotH * i) / 4;
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(cssW - padR, y); ctx.stroke();
    }

    // Label Y.
    var cur = CURRENCIES[stock.currency] || CURRENCIES.USD;
    ctx.fillStyle = '#6a6a6a';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    var topLabel = maxV.toLocaleString('en-US', { maximumFractionDigits: cur.decimals });
    var botLabel = minV.toLocaleString('en-US', { maximumFractionDigits: cur.decimals });
    ctx.fillText(cur.symbol + topLabel, padL - 4, padT + 10);
    ctx.fillText(cur.symbol + botLabel, padL - 4, padT + plotH - 2);

    // Warna adaptif tren.
    var firstV = series[0].value;
    var lastV = series[series.length - 1].value;
    var lineColor = (lastV < firstV) ? '#ef5350' : '#4CAF50';

    // Fill.
    var grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, lineColor + '33');
    grad.addColorStop(1, lineColor + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(xOf(0), padT + plotH);
    series.forEach(function (p, i) {
        ctx.lineTo(xOf(i), yOf(p.value));
    });
    ctx.lineTo(xOf(series.length - 1), padT + plotH);
    ctx.closePath();
    ctx.fill();

    // Line.
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    series.forEach(function (p, i) {
        var x = xOf(i), y = yOf(p.value);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Titik akhir.
    ctx.fillStyle = lineColor;
    ctx.beginPath();
    ctx.arc(xOf(series.length - 1), yOf(lastV), 3, 0, Math.PI * 2);
    ctx.fill();

    // Label X (tahun pertama & terakhir).
    ctx.fillStyle = '#6a6a6a';
    ctx.font = '9.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(String(series[0].year), padL, cssH - 4);
    ctx.textAlign = 'right';
    ctx.fillText(String(series[series.length - 1].year), cssW - padR, cssH - 4);
}
