// FILE: src/systems/StockSystem.js
// ============================================================
// StockSystem — mesin harga saham + trading.
// v2027.2b — fix: totalUSD & proceedsUSD dibulatkan (no pecahan sen).
//
// Semua nilai disimpan dalam USD. Harga lokal dikonversi
// memakai getCurrencyRateToUSD(currency, year).
//
// AI hook siap: _projectFuturePrice() bisa diganti panggilan AI.
//
// v2027.4 (sesi 1) — Penyesuaian ke indeks bursa:
//   Berita rilis kompetitor ('news:published', articleType
//   'competitor_release') menghasilkan impuls harga untuk saham
//   kompetitor itu. Besarnya dihitung MarketIndexAdjuster
//   (rezim pasar + beta terhadap indeks), meluruh tiap bulan.
//   Harga akhir = harga dasar historis x (1 + overlay).
// ============================================================
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import {
    STOCKS, MARKET_INDICES, getStocksForYear,
    getStockById, getCurrencyRateToUSD
} from '../data/stocks.data.js';
import {
    computeNewsImpact, findStocksForCompetitor, getOverlay,
    pruneImpulses, getMarketRegime, getStockBeta
} from './MarketIndexAdjuster.js';
import { WalletService } from './WalletService.js';

var MAX_HISTORY = 60;
var MAX_TRANSACTIONS = 20;
var MAX_NEWS_REACTIONS = 20;

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
        this._unsubs.push(bus.on('news:published', function (payload) { self._onNewsPublished(payload); }));
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
            d.stocks = { prices: {}, indices: {}, history: [], projected: {}, portfolio: [], transactions: [] };
        }
        if (!d.stocks.prices) d.stocks.prices = {};
        if (!d.stocks.indices) d.stocks.indices = {};
        if (!Array.isArray(d.stocks.history)) d.stocks.history = [];
        if (!d.stocks.projected) d.stocks.projected = {};
        if (!Array.isArray(d.stocks.portfolio)) d.stocks.portfolio = [];
        if (!Array.isArray(d.stocks.transactions)) d.stocks.transactions = [];
        if (!Array.isArray(d.stocks.newsImpulses)) d.stocks.newsImpulses = [];
        if (!Array.isArray(d.stocks.newsReactions)) d.stocks.newsReactions = [];
        if (!d.stocks.regime || typeof d.stocks.regime !== 'object') d.stocks.regime = null;
    }

    // ============================================================
    // INTERPOLASI
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
    // PROYEKSI setelah 2026 (hook AI)
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
    // Hitung harga bulan ini: harga dasar historis x (1 + overlay berita).
    _computePrices(year, month) {
        var d = this.state.data;
        var impulses = d.stocks.newsImpulses;
        var out = {};
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
            if (price == null) return;

            var overlay = getOverlay(impulses, s.id, year, month);
            if (overlay) price = Math.round(price * (1 + overlay) * 100) / 100;
            out[s.id] = price;
        }.bind(this));
        return out;
    }

    _recompute() {
        var d = this.state.data;
        var year = d.time.currentYear;
        var month = d.time.currentMonth;

        // Buang impuls yang sudah meluruh sebelum menghitung harga.
        d.stocks.newsImpulses = pruneImpulses(d.stocks.newsImpulses, year, month);

        var newPrices = this._computePrices(year, month);

        var newIndices = {};
        MARKET_INDICES.forEach(function (idx) {
            var price = this._interpolate(idx.valueByYear, year, month);
            if (price != null) newIndices[idx.id] = price;
        }.bind(this));

        d.stocks.prices = newPrices;
        d.stocks.indices = newIndices;
        d.stocks.regime = getMarketRegime(year, month);

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
    // BERITA KOMPETITOR -> IMPULS HARGA (disesuaikan ke indeks)
    // ============================================================
    _onNewsPublished(payload) {
        try {
            var art = payload && payload.article;
            if (!art || art.articleType !== 'competitor_release' || !art.competitorId) return;

            this._ensureState();
            var d = this.state.data;
            var year = d.time.currentYear;
            var month = d.time.currentMonth;

            var stocks = findStocksForCompetitor(art.competitorId, year);
            if (!stocks.length) return;

            var entry = { tone: art.sentiment, speculative: art.speculative === true };
            var changed = false;

            for (var i = 0; i < stocks.length; i++) {
                var stock = stocks[i];
                var key = art.id + ':' + stock.id;
                var dup = false;
                for (var j = 0; j < d.stocks.newsImpulses.length; j++) {
                    if (d.stocks.newsImpulses[j].key === key) { dup = true; break; }
                }
                if (dup) continue;

                var r = computeNewsImpact(entry, stock, year, month);
                if (!r.pct) continue;

                d.stocks.newsImpulses.push({ key: key, stockId: stock.id, y: year, m: month, pct: r.pct });
                d.stocks.newsReactions.unshift({
                    articleId: art.id, stockId: stock.id, ticker: stock.ticker,
                    pct: r.pct, regime: r.regime, beta: r.beta, y: year, m: month
                });
                changed = true;
            }
            if (!changed) return;

            if (d.stocks.newsReactions.length > MAX_NEWS_REACTIONS) {
                d.stocks.newsReactions.length = MAX_NEWS_REACTIONS;
            }

            // Perbarui harga bulan berjalan segera (tanpa menambah riwayat baru).
            var prices = this._computePrices(year, month);
            d.stocks.prices = prices;
            var h0 = d.stocks.history[0];
            if (h0 && h0.year === year && h0.month === month) {
                h0.prices = Object.assign({}, prices);
            }
            bus.emit('stocks:updated', { prices: prices, indices: d.stocks.indices });
        } catch (err) {
            console.warn('[StockSystem] _onNewsPublished error:', err);
        }
    }

    // API untuk UI: reaksi pasar terbaru, rezim, dan beta.
    getNewsReactions(limit) {
        var list = (this.state.data.stocks.newsReactions || []).slice();
        return limit > 0 ? list.slice(0, limit) : list;
    }

    getMarketRegime() {
        var d = this.state.data;
        return getMarketRegime(d.time.currentYear, d.time.currentMonth);
    }

    getBeta(stockId) {
        var stock = getStockById(stockId);
        return getStockBeta(stock, this.state.data.time.currentYear);
    }

    // ============================================================
    // API PUBLIK — HARGA
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

    getChangePercent(stockId) {
        var h = this.state.data.stocks.history || [];
        if (h.length < 2) return 0;
        var curr = h[0].prices[stockId];
        var prev = h[1].prices[stockId];
        if (curr == null || prev == null || prev === 0) return 0;
        return (curr - prev) / prev;
    }

    // ============================================================
    // TRADING — beli/jual
    // ============================================================

    getPriceUSD(stockId) {
        var stock = getStockById(stockId);
        if (!stock) return 0;
        var local = this.getPrice(stockId);
        if (!local) return 0;
        var year = this.state.data.time.currentYear;
        var rate = getCurrencyRateToUSD(stock.currency, year);
        return local * rate;
    }

    getMaxAffordableShares(stockId) {
        var priceUSD = this.getPriceUSD(stockId);
        if (priceUSD <= 0) return 0;
        // Dompet Universal: uang + SIL (sesuai mode bayar).
        return Math.floor(WalletService.getBuyingPower() / priceUSD);
    }

    buyStock(stockId, shares) {
        var stock = getStockById(stockId);
        if (!stock) return { ok: false, reason: 'Emiten tidak ditemukan.' };
        shares = Math.floor(shares);
        if (!shares || shares <= 0) return { ok: false, reason: 'Jumlah lembar tidak valid.' };

        var d = this.state.data;
        var year = d.time.currentYear;
        var localPrice = this.getPrice(stockId);
        if (!localPrice) return { ok: false, reason: 'Harga tidak tersedia.' };

        var rate = getCurrencyRateToUSD(stock.currency, year);
        var priceUSD = localPrice * rate;
        // [v2027.2b] Bulatkan supaya cash tetap integer.
        var totalUSD = Math.round(priceUSD * shares);

        if (!WalletService.canAfford(totalUSD)) {
            return { ok: false, reason: 'Uang tidak cukup. Butuh $' + totalUSD.toLocaleString('en-US') + '.' };
        }

        WalletService.pay(totalUSD, 'stock-buy');

        var existing = null;
        for (var i = 0; i < d.stocks.portfolio.length; i++) {
            if (d.stocks.portfolio[i].stockId === stockId) {
                existing = d.stocks.portfolio[i];
                break;
            }
        }

        if (existing) {
            var totalShares = existing.shares + shares;
            var totalCost = existing.totalCostUSD + totalUSD;
            existing.shares = totalShares;
            existing.totalCostUSD = totalCost;
            existing.avgBuyPriceUSD = totalCost / totalShares;
        } else {
            d.stocks.portfolio.push({
                stockId: stockId,
                shares: shares,
                avgBuyPriceUSD: priceUSD,
                totalCostUSD: totalUSD,
                firstBuyDate: { y: year, m: d.time.currentMonth, d: d.time.currentDay }
            });
        }

        this._pushTransaction({
            type: 'buy',
            stockId: stockId,
            ticker: stock.ticker,
            shares: shares,
            priceLocal: localPrice,
            priceUSD: priceUSD,
            totalUSD: totalUSD,
            currency: stock.currency,
            year: year, month: d.time.currentMonth, day: d.time.currentDay
        });

        bus.emit('stocks:updated', { prices: d.stocks.prices });
        bus.emit('state:changed', d);
        return { ok: true, shares: shares, totalUSD: totalUSD };
    }

    sellStock(stockId, shares) {
        var stock = getStockById(stockId);
        if (!stock) return { ok: false, reason: 'Emiten tidak ditemukan.' };
        shares = Math.floor(shares);
        if (!shares || shares <= 0) return { ok: false, reason: 'Jumlah lembar tidak valid.' };

        var d = this.state.data;

        var idx = -1;
        for (var i = 0; i < d.stocks.portfolio.length; i++) {
            if (d.stocks.portfolio[i].stockId === stockId) { idx = i; break; }
        }
        if (idx < 0) return { ok: false, reason: 'Anda tidak memiliki saham ini.' };

        var entry = d.stocks.portfolio[idx];
        if (shares > entry.shares) {
            return { ok: false, reason: 'Lembar tidak cukup. Anda punya ' + entry.shares + '.' };
        }

        var year = d.time.currentYear;
        var localPrice = this.getPrice(stockId);
        if (!localPrice) return { ok: false, reason: 'Harga tidak tersedia.' };

        var rate = getCurrencyRateToUSD(stock.currency, year);
        var priceUSD = localPrice * rate;
        // [v2027.2b] Bulatkan supaya cash tetap integer.
        var proceedsUSD = Math.round(priceUSD * shares);

        this.state.addCash(proceedsUSD);

        entry.shares -= shares;
        if (entry.shares <= 0) {
            d.stocks.portfolio.splice(idx, 1);
        } else {
            var costPerShare = entry.totalCostUSD / (entry.shares + shares);
            entry.totalCostUSD = costPerShare * entry.shares;
            entry.avgBuyPriceUSD = costPerShare;
        }

        this._pushTransaction({
            type: 'sell',
            stockId: stockId,
            ticker: stock.ticker,
            shares: shares,
            priceLocal: localPrice,
            priceUSD: priceUSD,
            totalUSD: proceedsUSD,
            currency: stock.currency,
            year: year, month: d.time.currentMonth, day: d.time.currentDay
        });

        bus.emit('stocks:updated', { prices: d.stocks.prices });
        bus.emit('state:changed', d);
        return { ok: true, shares: shares, totalUSD: proceedsUSD };
    }

    _pushTransaction(tx) {
        var d = this.state.data;
        tx.id = 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        d.stocks.transactions.unshift(tx);
        if (d.stocks.transactions.length > MAX_TRANSACTIONS) {
            d.stocks.transactions.length = MAX_TRANSACTIONS;
        }
    }

    getPortfolio() {
        var d = this.state.data;
        return (d.stocks.portfolio || []).map(function (e) {
            var stock = getStockById(e.stockId);
            var currentPrice = this.getPrice(e.stockId);
            var rate = getCurrencyRateToUSD(stock ? stock.currency : 'USD', d.time.currentYear);
            var currentPriceUSD = currentPrice * rate;
            var currentValueUSD = currentPriceUSD * e.shares;
            var plUSD = currentValueUSD - e.totalCostUSD;
            var plPct = e.totalCostUSD > 0 ? (plUSD / e.totalCostUSD) : 0;
            return {
                stockId: e.stockId,
                ticker: stock ? stock.ticker : e.stockId,
                name: stock ? stock.name : e.stockId,
                currency: stock ? stock.currency : 'USD',
                shares: e.shares,
                avgBuyPriceUSD: e.avgBuyPriceUSD,
                totalCostUSD: e.totalCostUSD,
                currentPriceLocal: currentPrice,
                currentPriceUSD: currentPriceUSD,
                currentValueUSD: currentValueUSD,
                plUSD: plUSD,
                plPct: plPct
            };
        }.bind(this));
    }

    getPortfolioValue() {
        var p = this.getPortfolio();
        var sum = 0;
        for (var i = 0; i < p.length; i++) sum += p[i].currentValueUSD;
        return sum;
    }

    getNetWorth() {
        var d = this.state.data;
        return (d.cash || 0) + this.getPortfolioValue();
    }

    getTransactions() {
        return (this.state.data.stocks.transactions || []).slice();
    }
}
