// FILE: src/ui/panels/ExchangePanel.js
// v2027.2a — Sesi 2: trading (beli/jual) + portofolio + riwayat.
import { t } from '../../core/LanguageService.js';
import { Modal } from '../modal.js';
import { ToastService } from '../../core/ToastService.js';
import {
    STOCKS, MARKET_INDICES, STOCK_CATEGORIES, CURRENCIES,
    getStockById, getStocksForYear
} from '../../data/stocks.data.js';

// ---------- Modul state ----------
var _selectedCategory = 'all';
var _selectedStockId = null;

export function setExchangeCategory(catId) { _selectedCategory = catId; }
export function setExchangeStock(stockId)   { _selectedStockId = stockId; }

// ---------- Helper ----------
function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function _tf(key, fallback) {
    var v = t(key);
    return (v && v !== key) ? v : fallback;
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

function _fmtUSD(value) {
    var n = Number(value);
    if (!isFinite(n)) return '—';
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

    if (!_selectedStockId && activeStocks.length) {
        _selectedStockId = activeStocks[0].id;
    }

    var html = '';
    html += _renderIndices(stockSystem);
    html += _renderCategoryFilter();
    html += _renderStockList(stockSystem, activeStocks);
    html += _renderDetail(stockSystem);
    html += _renderPortfolio(stockSystem);
    html += _renderTransactions(stockSystem);

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
    var tabs = [{ id: 'all', label: _tf('exchange.cat.all', 'Semua') }].concat(
        STOCK_CATEGORIES.filter(function (c) { return c.id !== 'player'; })
    );

    return '<div class="subtab-bar" style="overflow-x:auto;white-space:nowrap;">' +
        tabs.map(function (c) {
            var active = (_selectedCategory === c.id) ? ' active' : '';
            return '<button class="subtab-btn' + active + '" data-ex-cat="' + c.id + '">' +
                escapeHtml(c.label) + '</button>';
        }).join('') +
    '</div>';
}

// ---------- Daftar Emiten ----------
function _renderStockList(stockSystem, activeStocks) {
    var list = activeStocks.filter(function (s) {
        return _selectedCategory === 'all' || s.category === _selectedCategory;
    });

    if (!list.length) {
        return '<div class="card"><div class="log-empty">' +
            _tf('exchange.empty', 'Tidak ada emiten di kategori ini.') + '</div></div>';
    }

    var rows = list.map(function (s) {
        var price = stockSystem.getPrice(s.id);
        var change = stockSystem.getChangePercent(s.id);
        var color = _changeColor(change);
        var isSel = (s.id === _selectedStockId);
        var arrow = change > 0.0001 ? '▲' : (change < -0.0001 ? '▼' : '·');
        var bg = isSel
            ? 'background:rgba(79,140,255,0.08);border-left:3px solid var(--accent);'
            : 'border-left:3px solid transparent;';
        return '<div data-ex-select="' + s.id + '" style="display:flex;align-items:center;gap:10px;padding:8px 10px;cursor:pointer;' + bg + '">' +
            '<div style="flex-shrink:0;width:56px;font-size:12px;font-weight:800;color:var(--text-dim);">' +
                escapeHtml(s.ticker) + '</div>' +
            '<div style="flex:1;min-width:0;">' +
                '<div style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
                    escapeHtml(s.name) + '</div>' +
                '<div style="font-size:10px;color:var(--text-mute);">' +
                    escapeHtml(_categoryLabel(s.category)) + '</div>' +
            '</div>' +
            '<div style="text-align:right;flex-shrink:0;">' +
                '<div style="font-size:12.5px;font-weight:700;">' +
                    _fmtCurrency(price, s.currency) + '</div>' +
                '<div style="font-size:10.5px;color:' + color + ';">' +
                    arrow + ' ' + _fmtChange(change) + '</div>' +
            '</div>' +
        '</div>';
    }).join('');

    return '<div class="card" style="padding:0;">' +
        '<div style="padding:12px 14px 8px;font-size:11px;font-weight:700;letter-spacing:0.4px;color:var(--text-mute);">' +
            _tf('exchange.list_title', 'DAFTAR EMITEN') + ' · ' + list.length +
        '</div>' + rows +
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

    var tickerLine = escapeHtml(stock.ticker) +
        (stock.realTicker ? ' <span style="font-size:10.5px;color:var(--text-mute);">(' +
            escapeHtml(stock.realTicker) + ')</span>' : '');

    var infoRows = '';
    infoRows += '<div class="sum-row"><span>' + _tf('exchange.detail.country', 'Negara') + '</span><b>' +
        escapeHtml(stock.country || '—') + '</b></div>';
    infoRows += '<div class="sum-row"><span>' + _tf('exchange.detail.category', 'Kategori') + '</span><b>' +
        escapeHtml(_categoryLabel(stock.category)) + '</b></div>';
    infoRows += '<div class="sum-row"><span>' + _tf('exchange.detail.currency', 'Mata Uang') + '</span><b>' +
        escapeHtml(stock.currency) + '</b></div>';
    infoRows += '<div class="sum-row"><span>' + _tf('exchange.detail.listing', 'Listing') + '</span><b>' +
        (stock.listedFrom || '—') + (stock.listedTo ? ' – ' + stock.listedTo : ' – ' +
            _tf('exchange.detail.now', 'sekarang')) + '</b></div>';

    // Info kepemilikan
    var d = stockSystem.state.data;
    var holding = null;
    for (var i = 0; i < (d.stocks.portfolio || []).length; i++) {
        if (d.stocks.portfolio[i].stockId === stock.id) { holding = d.stocks.portfolio[i]; break; }
    }
    if (holding) {
        infoRows += '<div class="sum-row" style="color:var(--accent);"><span>' +
            _tf('exchange.detail.your_shares', 'Lembar Anda') + '</span><b>' +
            holding.shares.toLocaleString('en-US') + '</b></div>';
    }

    // Tombol trading
    var tradeBtns =
        '<div style="display:flex;gap:8px;margin-top:12px;">' +
            '<button class="btn-primary" data-ex-buy="' + stock.id + '" style="flex:1;padding:10px;font-weight:700;">' +
                _tf('exchange.buy', 'Beli') + '</button>' +
            (holding ? '<button class="btn-secondary" data-ex-sell="' + stock.id + '" style="flex:1;padding:10px;font-weight:700;">' +
                _tf('exchange.sell', 'Jual') + '</button>' : '') +
        '</div>';

    return '<div class="card">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">' +
            '<div style="min-width:0;">' +
                '<div style="font-size:18px;font-weight:800;">' + escapeHtml(stock.name) + '</div>' +
                '<div style="font-size:12px;color:var(--text-mute);margin-top:2px;">' + tickerLine + '</div>' +
            '</div>' +
            '<div style="text-align:right;flex-shrink:0;">' +
                '<div style="font-size:18px;font-weight:800;color:var(--accent);">' +
                    _fmtCurrency(price, stock.currency) + '</div>' +
                '<div style="font-size:12px;color:' + color + ';">' +
                    arrow + ' ' + _fmtChange(change) + '</div>' +
            '</div>' +
        '</div>' +
        '<div style="margin-top:12px;">' +
            '<div style="font-size:11px;font-weight:700;color:var(--text-mute);letter-spacing:0.4px;margin-bottom:6px;">' +
                _tf('exchange.detail.chart', 'GRAFIK HARGA') + '</div>' +
            '<div class="chart-wrap" data-ex-chart style="height:160px;position:relative;">' +
                '<canvas style="width:100%;height:160px;"></canvas>' +
            '</div>' +
        '</div>' +
        '<div style="margin-top:12px;">' + infoRows + '</div>' +
        tradeBtns +
        '<div style="font-size:10.5px;color:var(--text-mute);margin-top:10px;line-height:1.5;">' +
            (stock.confidence === 'trend'
                ? _tf('exchange.detail.note_trend', 'Kurva harga bersifat perkiraan berbasis tren.')
                : stock.confidence === 'fictional'
                    ? _tf('exchange.detail.note_fictional', 'Emiten fiktif untuk gameplay.')
                    : _tf('exchange.detail.note_verified', 'Data historis split-adjusted dari sumber publik.')) +
        '</div>' +
    '</div>';
}

// ---------- Portofolio ----------
function _renderPortfolio(stockSystem) {
    var d = stockSystem.state.data;
    var cash = d.cash || 0;
    var list = stockSystem.getPortfolio();
    var portfolioValue = stockSystem.getPortfolioValue();
    var netWorth = stockSystem.getNetWorth();

    var rows = '';
    if (list.length) {
        rows = list.map(function (e) {
            var plColor = e.plUSD > 0 ? 'var(--success)' : (e.plUSD < 0 ? 'var(--danger)' : 'var(--text-mute)');
            var arrow = e.plUSD > 0 ? '▲' : (e.plUSD < 0 ? '▼' : '·');
            return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">' +
                '<div style="min-width:0;">' +
                    '<div style="font-size:12.5px;font-weight:700;">' + escapeHtml(e.ticker) + '</div>' +
                    '<div style="font-size:10.5px;color:var(--text-mute);">' +
                        e.shares.toLocaleString('en-US') + ' × ' + _fmtUSD(e.avgBuyPriceUSD) + '</div>' +
                '</div>' +
                '<div style="text-align:right;">' +
                    '<div style="font-size:12.5px;font-weight:700;">' + _fmtUSD(e.currentValueUSD) + '</div>' +
                    '<div style="font-size:10.5px;color:' + plColor + ';">' +
                        arrow + ' ' + _fmtUSD(e.plUSD) + ' (' + _fmtChange(e.plPct) + ')</div>' +
                '</div>' +
            '</div>';
        }).join('');
    } else {
        rows = '<div class="log-empty" style="font-size:12px;">' +
            _tf('exchange.portfolio.empty', 'Belum ada saham yang dimiliki.') + '</div>';
    }

    return '<div class="card">' +
        '<div class="card-title">' + _tf('exchange.portfolio.title', 'Portofolio') + '</div>' +
        '<div class="sum-row"><span>' + _tf('exchange.portfolio.cash', 'Uang Tunai') + '</span><b>' +
            _fmtUSD(cash) + '</b></div>' +
        '<div class="sum-row"><span>' + _tf('exchange.portfolio.stocks', 'Nilai Saham') + '</span><b>' +
            _fmtUSD(portfolioValue) + '</b></div>' +
        '<div class="sum-row" style="border-top:1px solid rgba(255,255,255,0.08);padding-top:6px;margin-top:4px;">' +
            '<span style="color:var(--accent);font-weight:700;">' + _tf('exchange.portfolio.net_worth', 'Total Aset') + '</span>' +
            '<b style="color:var(--accent);">' + _fmtUSD(netWorth) + '</b></div>' +
        (list.length ? '<div style="margin-top:12px;">' + rows + '</div>' : '') +
    '</div>';
}

// ---------- Riwayat Transaksi ----------
function _renderTransactions(stockSystem) {
    var list = stockSystem.getTransactions().slice(0, 5);
    if (!list.length) return '';

    var rows = list.map(function (tx) {
        var isBuy = tx.type === 'buy';
        var color = isBuy ? 'var(--danger)' : 'var(--success)';
        var sign = isBuy ? '−' : '+';
        var label = isBuy
            ? _tf('exchange.tx.buy', 'Beli')
            : _tf('exchange.tx.sell', 'Jual');
        return '<div style="display:flex;justify-content:space-between;gap:10px;padding:6px 0;font-size:11.5px;border-bottom:1px solid rgba(255,255,255,0.03);">' +
            '<div><b>' + escapeHtml(tx.ticker) + '</b> <span style="color:var(--text-mute);">· ' +
                label + ' ' + tx.shares.toLocaleString('en-US') + ' lbr</span></div>' +
            '<div style="text-align:right;color:' + color + ';">' + sign + _fmtUSD(Math.abs(tx.totalUSD)) +
                '<div style="font-size:9.5px;color:var(--text-mute);">' +
                tx.day + '/' + tx.month + '/' + tx.year + '</div></div>' +
        '</div>';
    }).join('');

    return '<div class="card">' +
        '<div class="card-title">' + _tf('exchange.tx.title', 'Riwayat Transaksi') + '</div>' +
        rows +
    '</div>';
}

// ============================================================
// MODAL BELI
// ============================================================
export function openBuyModal(stockId) {
    var stock = getStockById(stockId);
    if (!stock) return;
    var g = window.__game;
    if (!g || !g.stocks) return;

    var stockSystem = g.stocks;
    var localPrice = stockSystem.getPrice(stockId);
    var priceUSD = stockSystem.getPriceUSD(stockId);
    var cash = stockSystem.state.data.cash || 0;
    var maxShares = stockSystem.getMaxAffordableShares(stockId);

    var html =
        '<div class="modal-title">' + _tf('exchange.buy_modal.title', 'Beli Saham') + '</div>' +
        '<div class="modal-sub">' + escapeHtml(stock.name) + ' · ' + escapeHtml(stock.ticker) + '</div>' +
        '<div class="sum-row"><span>' + _tf('exchange.price_per_share', 'Harga / lembar') + '</span><b>' +
            _fmtCurrency(localPrice, stock.currency) +
            ' <span style="font-size:10.5px;color:var(--text-mute);">(' + _fmtUSD(priceUSD) + ')</span></b></div>' +
        '<div class="sum-row"><span>' + _tf('exchange.cash_available', 'Uang Tunai') + '</span><b>' +
            _fmtUSD(cash) + '</b></div>' +

        '<div style="margin-top:12px;">' +
            '<div style="font-size:11px;font-weight:700;color:var(--text-mute);margin-bottom:6px;">' +
                _tf('exchange.shares_label', 'Jumlah Lembar') + '</div>' +
            '<input type="number" data-qty-input value="10" min="1" step="1" ' +
                'style="width:100%;padding:10px;font-size:16px;font-weight:700;background:var(--bg-elev);border:1px solid var(--border);border-radius:8px;color:var(--text);" />' +
            '<div style="display:flex;gap:6px;margin-top:8px;">' +
                _presetBtn(10) + _presetBtn(50) + _presetBtn(100) +
                '<button class="chip-small" data-buy-preset="max" data-buy-stock="' + stockId + '" ' +
                    'style="flex:1;padding:6px;font-size:11px;font-weight:700;">' +
                    _tf('exchange.max', 'MAX') + ' (' + maxShares + ')</button>' +
            '</div>' +
        '</div>' +

        '<div style="margin-top:12px;padding:10px;background:rgba(79,140,255,0.08);border-radius:8px;">' +
            '<div class="sum-row"><span>' + _tf('exchange.total', 'Total estimasi') + '</span>' +
                '<b data-buy-total style="color:var(--accent);">' + _fmtUSD(priceUSD * 10) + '</b></div>' +
        '</div>' +

        '<div style="display:flex;gap:8px;margin-top:14px;">' +
            '<button class="btn-secondary" data-modal-close style="flex:1;padding:10px;">' +
                _tf('common.cancel', 'Batal') + '</button>' +
            '<button class="btn-primary" data-buy-confirm="' + stockId + '" ' +
                'style="flex:1;padding:10px;font-weight:700;">' +
                _tf('exchange.buy', 'Beli') + '</button>' +
        '</div>';

    Modal.open('buy-modal', html);
}

function _presetBtn(n) {
    return '<button class="chip-small" data-buy-preset="' + n + '" ' +
        'style="flex:1;padding:6px;font-size:11px;font-weight:700;">' + n + '</button>';
}

// ============================================================
// MODAL JUAL
// ============================================================
export function openSellModal(stockId) {
    var stock = getStockById(stockId);
    if (!stock) return;
    var g = window.__game;
    if (!g || !g.stocks) return;

    var stockSystem = g.stocks;
    var d = stockSystem.state.data;
    var holding = null;
    for (var i = 0; i < (d.stocks.portfolio || []).length; i++) {
        if (d.stocks.portfolio[i].stockId === stockId) { holding = d.stocks.portfolio[i]; break; }
    }
    if (!holding) {
        ToastService.error(_tf('exchange.not_owned', 'Anda tidak memiliki saham ini.'));
        return;
    }

    var localPrice = stockSystem.getPrice(stockId);
    var priceUSD = stockSystem.getPriceUSD(stockId);
    var maxShares = holding.shares;

    var html =
        '<div class="modal-title">' + _tf('exchange.sell_modal.title', 'Jual Saham') + '</div>' +
        '<div class="modal-sub">' + escapeHtml(stock.name) + ' · ' + escapeHtml(stock.ticker) + '</div>' +
        '<div class="sum-row"><span>' + _tf('exchange.price_per_share', 'Harga / lembar') + '</span><b>' +
            _fmtCurrency(localPrice, stock.currency) +
            ' <span style="font-size:10.5px;color:var(--text-mute);">(' + _fmtUSD(priceUSD) + ')</span></b></div>' +
        '<div class="sum-row"><span>' + _tf('exchange.owned_shares', 'Lembar Anda') + '</span><b>' +
            maxShares.toLocaleString('en-US') + '</b></div>' +
        '<div class="sum-row"><span>' + _tf('exchange.avg_buy', 'Harga beli rata-rata') + '</span><b>' +
            _fmtUSD(holding.avgBuyPriceUSD) + '</b></div>' +

        '<div style="margin-top:12px;">' +
            '<div style="font-size:11px;font-weight:700;color:var(--text-mute);margin-bottom:6px;">' +
                _tf('exchange.shares_label', 'Jumlah Lembar') + '</div>' +
            '<input type="number" data-qty-input value="' + Math.min(10, maxShares) + '" min="1" max="' + maxShares + '" step="1" ' +
                'style="width:100%;padding:10px;font-size:16px;font-weight:700;background:var(--bg-elev);border:1px solid var(--border);border-radius:8px;color:var(--text);" />' +
            '<div style="display:flex;gap:6px;margin-top:8px;">' +
                _sellPresetBtn(10, maxShares) + _sellPresetBtn(50, maxShares) + _sellPresetBtn(100, maxShares) +
                '<button class="chip-small" data-sell-preset="all" ' +
                    'style="flex:1;padding:6px;font-size:11px;font-weight:700;">' +
                    _tf('exchange.all', 'SEMUA') + '</button>' +
            '</div>' +
        '</div>' +

        '<div style="margin-top:12px;padding:10px;background:rgba(79,140,255,0.08);border-radius:8px;">' +
            '<div class="sum-row"><span>' + _tf('exchange.proceeds', 'Perkiraan hasil') + '</span>' +
                '<b data-sell-total style="color:var(--accent);">' +
                _fmtUSD(priceUSD * Math.min(10, maxShares)) + '</b></div>' +
        '</div>' +

        '<div style="display:flex;gap:8px;margin-top:14px;">' +
            '<button class="btn-secondary" data-modal-close style="flex:1;padding:10px;">' +
                _tf('common.cancel', 'Batal') + '</button>' +
            '<button class="btn-primary" data-sell-confirm="' + stockId + '" ' +
                'style="flex:1;padding:10px;font-weight:700;background:var(--danger);">' +
                _tf('exchange.sell', 'Jual') + '</button>' +
        '</div>';

    Modal.open('sell-modal', html);
}

function _sellPresetBtn(n, maxShares) {
    var v = Math.min(n, maxShares);
    return '<button class="chip-small" data-sell-preset="' + v + '" ' +
        'style="flex:1;padding:6px;font-size:11px;font-weight:700;">' + v + '</button>';
}

// ============================================================
// GRAFIK
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

    var minV = Infinity, maxV = -Infinity;
    series.forEach(function (p) {
        if (p.value < minV) minV = p.value;
        if (p.value > maxV) maxV = p.value;
    });
    if (minV === maxV) { minV = minV * 0.95; maxV = maxV * 1.05; }
    var range = maxV - minV;

    var xOf = function (i) { return padL + (plotW * i) / (series.length - 1); };
    var yOf = function (v) { return padT + plotH - ((v - minV) / range) * plotH; };

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (var i = 1; i <= 3; i++) {
        var y = padT + (plotH * i) / 4;
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(cssW - padR, y); ctx.stroke();
    }

    var cur = CURRENCIES[stock.currency] || CURRENCIES.USD;
    ctx.fillStyle = '#6a6a6a';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    var topLabel = maxV.toLocaleString('en-US', { maximumFractionDigits: cur.decimals });
    var botLabel = minV.toLocaleString('en-US', { maximumFractionDigits: cur.decimals });
    ctx.fillText(cur.symbol + topLabel, padL - 4, padT + 10);
    ctx.fillText(cur.symbol + botLabel, padL - 4, padT + plotH - 2);

    var firstV = series[0].value;
    var lastV = series[series.length - 1].value;
    var lineColor = (lastV < firstV) ? '#ef5350' : '#4CAF50';

    var grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, lineColor + '33');
    grad.addColorStop(1, lineColor + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(xOf(0), padT + plotH);
    series.forEach(function (p, i) { ctx.lineTo(xOf(i), yOf(p.value)); });
    ctx.lineTo(xOf(series.length - 1), padT + plotH);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    series.forEach(function (p, i) {
        var x = xOf(i), y = yOf(p.value);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = lineColor;
    ctx.beginPath();
    ctx.arc(xOf(series.length - 1), yOf(lastV), 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6a6a6a';
    ctx.font = '9.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(String(series[0].year), padL, cssH - 4);
    ctx.textAlign = 'right';
    ctx.fillText(String(series[series.length - 1].year), cssW - padR, cssH - 4);
}
