// FILE: src/systems/StockSystem.js
// ============================================================
// StockSystem — mesin harga saham untuk halaman Exchange.
// v2027.1b — full: interpolasi + proyeksi + getSeries untuk chart.
//
// Siap untuk integrasi AI setelah 2026:
//   - _projectFuturePrice(year, month, stock) jadi hook AI.
//   - Hasil disimpan di state.data.stocks.projected.
//   - Kalau provider tidak ada, pakai rumus fallback lokal.
// ============================================================
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { STOCKS, MARKET_INDICES, getStocksForYear } from '../data/stocks.data.js';

var MAX_HISTORY = 60;  // 5 tahun × 12 bulan

export class StockSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
        this._aiProvider = null;
    }

    start() {
        var self = this;
        this._unsubs.push(bus.on('time:month-changed', function () { self._recompute(); }));
        this._unsubs.push(bus.on('state:hydrated', function () { self._ensureState(); self._recompute(); }));
        this._ensureState();
        this._recompute();
        console.info('[StockSystem] siap.');
    }

    stop() {
        this._unsubs.forEach(function (u) { u(); });
        this._unsubs = [];
    }

    _ensureState() {
        var d = this.state.data;
        if (!d.stocks || typeof d.stocks !== 'object') {
            d.stocks = { prices: {}, indices: {}, history: [], projected: {} };
        }
        if (!d.stocks.prices) d.stocks.prices = {};
        if (!d.stocks.indices) d.stocks.indices = {};
        if (!Array.isArray(d.stocks.history)) d.stocks.history = [];
        if (!d.stocks.projected) d.stocks.projected = {};
    }

    // ============================================================
    // INTERPOLASI — dari pivot tahunan ke nilai bulanan.
    // ============================================================
    _interpolate(map, year, month) {
        if (!map) return null;
        var years = Object.keys(map).map(Number).sort(function (a, b) { return a - b; });
        if (!years.length) return null;

        if (year <= years[0]) return map[years[0]];
        if (year >= years[years.length - 1]) return map[years[years.length - 1]];

        for (var i = 0; i < years.length - 1; i++) {
            var y1 = years[i], y2 = years[i + 1];
            if (year >= y1 && year < y2) {
                var v1 = map[y1], v2 = map[y2];
                var frac = (year - y1) + (month - 1) / 12;
                var span = y2 - y1;
                return v1 + (v2 - v1) * (frac / span);
            }
        }
        return map[years[years.length - 1]];
    }

    // ============================================================
    // PROYEKSI — hook untuk AI di masa depan.
    // Sesi 1: pakai tren historis + noise kecil.
    // ============================================================
    _projectFuturePrice(stock, year, month) {
        var key = stock.id + ':' + year + ':' + month;
        if (this.state.data.stocks.projected[key] !== undefined) {
            return this.state.data.stocks.projected[key];
        }

        var map = stock.priceByYear;
        var years = map ? Object.keys(map).map(Number).sort(function (a, b) { return a - b; }) : [];
        if (!years.length) return 0;

        var lastYear = years[years.length - 1];
        var lastVal = map[lastYear];

        var anchorIdx = Math.max(0, years.length - 5);
        var anchorYear = years[anchorIdx];
        var anchorVal = map[anchorYear];
        var span = lastYear - anchorYear;
        var cagr = span > 0 ? Math.pow(lastVal / anchorVal, 1 / span) - 1 : 0.05;
        cagr = Math.max(-0.15, Math.min(0.25, cagr));

        var yearsAhead = (year - lastYear) + (month - 1) / 12;
        var projected = lastVal * Math.pow(1 + cagr, yearsAhead);
        projected = Math.round(projected * 100) / 100;

        this.state.data.stocks.projected[key] = projected;

        if (this._aiProvider) {
            this._callAI(stock, year, month, projected);
        }

        return projected;
    }

    _callAI(stock, year, month, fallbackPrice) {
        var self = this;
        try {
            this._aiProvider({
                stock: { id: stock.id, ticker: stock.ticker, name: stock.name },
                year: year, month: month,
                fallbackPrice: fallbackPrice
            }).then(function (result) {
                if (result && typeof result.price === 'number') {
                    var key = stock.id + ':' + year + ':' + month;
                    self.state.data.stocks.projected[key] = result.price;
                    bus.emit('stocks:updated', { prices: self.state.data.stocks.prices });
                }
            }).catch(function (err) {
                console.warn('[StockSystem] AI projection gagal:', err);
            });
        } catch (e) {
            console.warn('[StockSystem] AI provider error:', e);
        }
    }

    setAIProvider(fn) {
        this._aiProvider = (typeof fn === 'function') ? fn : null;
    }

    // ============================================================
    // REKALKULASI BULANAN
    // ============================================================
    _recompute() {
        var d = this.state.data;
        var year = d.time.currentYear;
        var month = d.time.currentMonth;

        var newPrices = {};
        STOCKS.forEach(function (s) {
            if (s.isPlayer) return;
            if (year < s.listedFrom) return;
            if (s.listedTo !== null && year > s.listedTo) return;
            if (!s.priceByYear) return;

            var years = Object.keys(s.priceByYear).map(Number);
            var lastYear = Math.max.apply(null, years);

            var price;
            if (year > lastYear) {
                price = this._projectFuturePrice(s, year, month);
            } else {
                price = this._interpolate(s.priceByYear, year, month);
            }
            if (price != null) newPrices[s.id] = price;
        }.bind(this));

        var newIndices = {};
        MARKET_INDICES.forEach(function (idx) {
            var price = this._interpolate(idx.valueByYear, year, month);
            if (price != null) newIndices[idx.id] = price;
        }.bind(this));

        d.stocks.prices = newPrices;
        d.stocks.indices = newIndices;

        d.stocks.history.unshift({
            year: year,
            month: month,
            prices: Object.assign({}, newPrices),
            indices: Object.assign({}, newIndices)
        });
        if (d.stocks.history.length > MAX_HISTORY) {
            d.stocks.history.length = MAX_HISTORY;
        }

        bus.emit('stocks:updated', { prices: newPrices, indices: newIndices });
    }

    // ============================================================
    // API PUBLIK
    // ============================================================
    getPrice(stockId) {
        return this.state.data.stocks.prices[stockId] || 0;
    }

    getIndexValue(indexId) {
        return this.state.data.stocks.indices[indexId] || 0;
    }

    getActiveStocks() {
        var y = this.state.data.time.currentYear;
        return getStocksForYear(y);
    }

    getHistory(stockId, limit) {
        var h = this.state.data.stocks.history || [];
        var out = [];
        for (var i = 0; i < h.length; i++) {
            var v = h[i].prices[stockId];
            if (v != null) out.push({ year: h[i].year, month: h[i].month, value: v });
            if (limit && out.length >= limit) break;
        }
        return out;
    }

    // Bangun deret bulanan untuk grafik (dari listing s/d bulan sekarang).
    getSeries(stockId) {
        var stock = null;
        for (var i = 0; i < STOCKS.length; i++) {
            if (STOCKS[i].id === stockId) { stock = STOCKS[i]; break; }
        }
        if (!stock || !stock.priceByYear) return [];

        var d = this.state.data;
        var endY = d.time.currentYear;
        var endM = d.time.currentMonth;
        var startY = Math.max(1999, stock.listedFrom || 1999);

        var out = [];
        for (var y = startY; y <= endY; y++) {
            var mLimit = (y === endY) ? endM : 12;
            for (var m = 1; m <= mLimit; m++) {
                var v = this._interpolate(stock.priceByYear, y, m);
                if (v != null) out.push({ year: y, month: m, value: v });
            }
        }
        return out;
    }

    // Hitung perubahan % vs bulan lalu (untuk UI ▲/▼).
    getChangePercent(stockId) {
        var h = this.state.data.stocks.history || [];
        if (h.length < 2) return 0;
        var curr = h[0].prices[stockId];
        var prev = h[1].prices[stockId];
        if (curr == null || prev == null || prev === 0) return 0;
        return (curr - prev) / prev;
    }
}
