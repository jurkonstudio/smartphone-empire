// FILE: src/systems/StockSystem.js
// v2027.1a — Sesi 1: hitung harga bulanan via interpolasi.
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { STOCKS, MARKET_INDICES, getStocksForYear } from '../data/stocks.data.js';

export class StockSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        this._unsubs.push(bus.on('time:month-changed', () => this._recompute()));
        this._ensureState();
        this._recompute();
        console.info('[StockSystem] siap.');
    }

    stop() {
        this._unsubs.forEach(u => u()); this._unsubs = [];
    }

    _ensureState() {
        const d = this.state.data;
        if (!d.stocks) d.stocks = { prices: {}, indices: {}, history: [], portfolio: [] };
    }

    // Interpolasi linear antara dua pivot tahun.
    _interpolate(map, year, month) {
        if (!map) return 0;
        const years = Object.keys(map).map(Number).sort((a, b) => a - b);
        if (!years.length) return 0;
        const y1 = years.find(y => y >= year) || years[years.length - 1];
        const y2 = years.find(y => y > y1) || y1;
        const v1 = map[y1];
        const v2 = map[y2];
        if (y1 === y2) return v1;
        // Fraksi dalam tahun (0..1).
        const frac = (year - y1) + (month - 1) / 12;
        const total = y2 - y1;
        return v1 + (v2 - v1) * (frac / total);
    }

    _recompute() {
        const d = this.state.data;
        const { currentYear: year, currentMonth: month } = d.time;

        const newPrices = {};
        STOCKS.forEach(s => {
            if (s.isPlayer) return;
            if (year < s.listedFrom) return;
            if (s.listedTo !== null && year > s.listedTo) return;
            if (!s.priceByYear) return;
            newPrices[s.id] = this._interpolate(s.priceByYear, year, month);
        });

        const newIndices = {};
        MARKET_INDICES.forEach(idx => {
            newIndices[idx.id] = this._interpolate(idx.valueByYear, year, month);
        });

        d.stocks.prices = newPrices;
        d.stocks.indices = newIndices;

        // Simpan snapshot bulanan untuk grafik.
        d.stocks.history.unshift({
            year, month,
            prices: { ...newPrices },
            indices: { ...newIndices }
        });
        if (d.stocks.history.length > 36) d.stocks.history.length = 36;

        bus.emit('stocks:updated', { prices: newPrices, indices: newIndices });
    }

    getPrice(stockId) { return this.state.data.stocks.prices[stockId] || 0; }
    getIndexValue(indexId) { return this.state.data.stocks.indices[indexId] || 0; }
    getActiveStocks() {
        const y = this.state.data.time.currentYear;
        return getStocksForYear(y);
    }
}
