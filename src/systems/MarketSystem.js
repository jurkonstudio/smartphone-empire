// FILE: src/systems/MarketSystem.js
// v2028.6 — [LOGIC] Kompetitor lebih agresif menekan produk pemain yang harganya tidak masuk akal (overpriced).
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { BALANCE } from '../data/balance.data.js';
import { LOG_TYPES } from '../config/constants.js';
import { getCompetitorById, getFictionalName } from '../data/competitors.data.js';
import { getMacro } from '../core/MacroModel.js';

export class MarketSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
        this._competitorSystem = null;
        this._monthRevenueAccum = 0;
    }

    setCompetitorSystem(cs) { this._competitorSystem = cs; }

    start() {
        this._unsubs.push(bus.on('time:month-changed', (s) => this._onMonthChanged(s)));
        this._unsubs.push(bus.on('state:hydrated',     () => this._ensureTrends()));
        this._unsubs.push(bus.on('economy:add-revenue', (payload) => {
            if (payload && typeof payload.amount === 'number') {
                this._monthRevenueAccum += payload.amount;
            }
        }));
        this._ensureTrends();
        console.info('[MarketSystem] siap.');
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    _ensureTrends() {
        const data = this.state.data;
        if (data.market.trends) return;
        data.market.trends = { ...getMacro(data.time, BALANCE.macro).trends };
    }

    _onMonthChanged(snap) {
        const data = this.state.data;
        const year = snap.currentYear;

        const playerRevenue = Math.round(this._monthRevenueAccum);
        const cs = this._competitorSystem;
        const competitorRevenues = [];
        let totalCompetitorRevenue = 0;

        if (cs) {
            const ids = cs.getActiveIds();
            ids.forEach(id => {
                const comp = getCompetitorById(id);
                if (!comp) return;
                if (comp.isEcosystem) return;
                const rev = Math.max(0, Math.round(cs.computeCompetitorPower(id, year)));
                competitorRevenues.push({ id, name: comp.name, revenue: rev });
                totalCompetitorRevenue += rev;
            });
        }

        const othersShare = this._interpYearly(BALANCE.market.othersShareByYear, year, 0.25);

        const playerRevenueEq = this._toMarketScale(playerRevenue, year, snap.currentMonth);
        const tracked = playerRevenueEq + totalCompetitorRevenue;
        const others = Math.round(tracked * (othersShare / Math.max(0.01, 1 - othersShare)));
        const total = tracked + others;
        const maxShare = (BALANCE.market.playerShareScale && BALANCE.market.playerShareScale.maxShare) || 1;
        const playerShare = total > 0 ? Math.min(maxShare, playerRevenueEq / total) : 0;

        data.market.share = playerShare;
        data.market.competitors = competitorRevenues.map(cr => {
            const comp = getCompetitorById(cr.id);
            return {
                id: cr.id,
                name: comp ? comp.name : cr.id,
                share: total > 0 ? cr.revenue / total : 0,
                baseRevenue: cr.revenue,
                personality: comp ? comp.personality : 'follower'
            };
        });

        data.market.shareHistory.unshift({
            year: snap.currentYear,
            month: snap.currentMonth,
            playerShare,
            playerRevenue,
            // [fix] sebelumnya tidak disimpan -> info "Setara skala pasar" di panel selalu kosong.
            playerRevenueEq: playerRevenueEq,
            totalRevenue: total,
            competitors: data.market.competitors.map(c => ({ id: c.id, share: c.share }))
        });
        if (data.market.shareHistory.length > 24) data.market.shareHistory.length = 24;

        data.market.revenueHistory.unshift({
            year: snap.currentYear,
            month: snap.currentMonth,
            playerRevenue,
            playerRevenueEq: playerRevenueEq,
            totalRevenue: total
        });
        if (data.market.revenueHistory.length > 24) data.market.revenueHistory.length = 24;

        this._driftTrends();

        const pct = Math.round(playerShare * 100);
        if (pct >= 10 && !data.milestones.some(m => m.id === 'share_10')) {
            this.state.addMilestone('share_10', 'Pangsa pasar 10%.');
        }
        if (pct >= 25 && !data.milestones.some(m => m.id === 'share_25')) {
            this.state.addMilestone('share_25', 'Pangsa pasar 25%.');
        }
        if (pct >= 50 && !data.milestones.some(m => m.id === 'share_50')) {
            this.state.addMilestone('share_50', 'Pangsa pasar 50% — pemimpin pasar!');
        }

        if (playerRevenue > 0) {
            this.state.addLog(
                'Pangsa pasar: ' + (playerShare * 100).toFixed(1) +
                '% (pendapatan bulan ini $' + playerRevenue.toLocaleString('en-US') + ').',
                LOG_TYPES.info
            );
        }

        this._updateCompetitorPressure();
        this._monthRevenueAccum = 0;

        bus.emit('market:share-updated', {
            playerShare,
            competitors: data.market.competitors.map(c => ({ id: c.id, name: c.name, share: c.share }))
        });
        bus.emit('state:changed', data);
    }

    _toMarketScale(playerRevenue, year, month) {
        const cfg = BALANCE.market.playerShareScale;
        if (!cfg || cfg.enabled === false) return playerRevenue;

        const data = this.state.data;
        const units   = this._interpYearly(BALANCE.market.marketUnitsByYear, year, 30000000);
        const macro   = getMacro({ currentYear: year, currentMonth: month, currentDay: 15 }, BALANCE.macro);
        const gameMonthlyBaseUnits = Math.max(1, macro.baseDemand * 30.4);
        const scale = (units * cfg.referenceShare) / gameMonthlyBaseUnits;

        let eq = playerRevenue * scale;

        const n = Math.max(1, cfg.smoothMonths || 1);
        if (n > 1) {
            const hist = (data.market.revenueHistory || []).slice(0, n - 1);
            let sum = eq, cnt = 1;
            hist.forEach(h => {
                if (typeof h.playerRevenueEq === 'number') { sum += h.playerRevenueEq; cnt++; }
            });
            eq = sum / cnt;
        }
        this._lastPlayerRevenueEq = Math.round(eq);
        return Math.round(eq);
    }

    // ============================================================
    // TEKANAN KOMPETITOR (VALUE VS PRICE)
    // ============================================================
    _updateCompetitorPressure() {
        const data = this.state.data;
        const cfg = BALANCE.competitors.pressure;
        const catalog = (data.products && data.products.catalog) || [];
        if (!cfg || !catalog.length) return;

        const aggrMap = BALANCE.market.competitorAggressionMultiplier || {};
        const aggr = aggrMap[data.difficulty] || 1.0;
        const entities = (data.competitorState && data.competitorState.entities) || {};
        const comps = data.market.competitors || [];

        catalog.forEach(p => {
            if (p.status !== 'selling' || !p.stats) return;
            let pressure = cfg.base;
            
            // Kalkulasi Value for Money pemain
            const refPrice = getMacro(data.time, BALANCE.macro).priceRef;
            const expectedPrice = refPrice * Math.pow(Math.max(10, p.stats.qualityScore) / 50, 1.3);
            const priceRatio = p.price / expectedPrice;
            
            // Jika overpriced (>1.2), tekanan kompetitor naik drastis
            let pricePressureMod = 1.0;
            if (priceRatio > 1.2) {
                pricePressureMod = 1.0 + (priceRatio - 1.2) * 2.0;
            } else if (priceRatio < 0.7) {
                pricePressureMod = 0.5; // Jika murah meriah, tekanan kompetitor berkurang
            }

            comps.forEach(c => {
                const e = entities[c.id];
                const tier = e ? e.currentTier : 1;
                const compQuality = tier * cfg.tierToQuality + cfg.tierOffset;
                const gap = Math.max(0, Math.min(cfg.maxGap, (compQuality - p.stats.qualityScore) / cfg.gapDivisor));
                
                pressure += c.share * gap * cfg.gainPerShare * pricePressureMod;
            });
            
            p.competitorPressure = Math.min(cfg.maxPressure, pressure * aggr);
        });
    }

    _driftTrends() {
        const data = this.state.data;
        const t = data.market.trends || {};
        const target = getMacro(data.time, BALANCE.macro).trends;
        const pull = BALANCE.macro.trendPull;
        const noise = BALANCE.macro.trendNoise;
        for (const k in target) {
            const cur = (t[k] !== undefined) ? t[k] : target[k];
            const next = cur + (target[k] - cur) * pull + (Math.random() * 2 - 1) * noise;
            t[k] = Math.max(0.1, Math.min(0.95, next));
        }
        data.market.trends = t;
        data.market.lastTrendUpdateMonth = { year: data.time.currentYear, month: data.time.currentMonth };
    }

    _interpYearly(map, year, fallback) {
        if (!map) return fallback;
        if (map[year] !== undefined) return map[year];
        const years = Object.keys(map).map(Number).sort((a, b) => a - b);
        if (!years.length) return fallback;
        if (year < years[0]) return map[years[0]];
        if (year > years[years.length - 1]) return map[years[years.length - 1]];
        for (let i = 0; i < years.length - 1; i++) {
            const y1 = years[i], y2 = years[i + 1];
            if (year >= y1 && year <= y2) {
                const v1 = map[y1], v2 = map[y2];
                return v1 + (v2 - v1) * ((year - y1) / (y2 - y1));
            }
        }
        return map[years[years.length - 1]];
    }

    getMarketShare()      { return this.state.data.market.share || 0; }
    getCompetitors()      { return this.state.data.market.competitors || []; }
    getTrends()           { return this.state.data.market.trends || {}; }
    getReputation()       { return this.state.data.market.reputation || 0; }
    getShareHistory()     { return this.state.data.market.shareHistory || []; }

    getShareDelta() {
        const h = this.state.data.market.shareHistory || [];
        if (h.length < 2) return 0;
        return h[0].playerShare - h[1].playerShare;
    }

    getDisplayName(id, mode) {
        const comp = getCompetitorById(id);
        if (!comp) return id;
        return mode === 'fictional' ? getFictionalName(id) : comp.name;
    }
}
