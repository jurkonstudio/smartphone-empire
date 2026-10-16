// FILE: src/systems/MarketSystem.js
// v2027.2a — pangsa pasar ber-anchor historis + ekosistem di-skip.
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

        // ---- 1. Revenue pemain ----
        const playerRevenue = Math.round(this._monthRevenueAccum);

        // ---- 2. Revenue kompetitor (anchored historis) ----
        // [v2027.2a] Skip entitas isEcosystem (Android) supaya tidak
        // double-count dengan brand hardware.
        const cs = this._competitorSystem;
        const competitorRevenues = [];
        let totalCompetitorRevenue = 0;

        if (cs) {
            const ids = cs.getActiveIds();
            ids.forEach(id => {
                const comp = getCompetitorById(id);
                if (!comp) return;
                if (comp.isEcosystem) return; // skip Android ecosystem
                const rev = Math.max(0, Math.round(cs.computeCompetitorPower(id, year)));
                competitorRevenues.push({ id, name: comp.name, revenue: rev });
                totalCompetitorRevenue += rev;
            });
        }

        // ---- 3. Others — proporsi dari tracked (player + kompetitor) ----
        const othersShare = this._interpYearly(BALANCE.market.othersShareByYear, year, 0.25);
        const tracked = playerRevenue + totalCompetitorRevenue;
        const others = Math.round(tracked * (othersShare / Math.max(0.01, 1 - othersShare)));

        const total = tracked + others;

        // ---- 4. Pangsa pemain ----
        const playerShare = total > 0 ? playerRevenue / total : 0;

        // ---- 5. Simpan ----
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
            totalRevenue: total,
            competitors: data.market.competitors.map(c => ({ id: c.id, share: c.share }))
        });
        if (data.market.shareHistory.length > 24) data.market.shareHistory.length = 24;

        data.market.revenueHistory.unshift({
            year: snap.currentYear,
            month: snap.currentMonth,
            playerRevenue,
            totalRevenue: total
        });
        if (data.market.revenueHistory.length > 24) data.market.revenueHistory.length = 24;

        // ---- 6. Drift tren ----
        this._driftTrends();

        // ---- 7. Milestone ----
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

        // ---- 8. Log ----
        if (playerRevenue > 0) {
            this.state.addLog(
                'Pangsa pasar: ' + (playerShare * 100).toFixed(1) +
                '% (pendapatan bulan ini $' + playerRevenue.toLocaleString('en-US') + ').',
                LOG_TYPES.info
            );
        }

        // ---- 9. Reset accumulator ----
        this._monthRevenueAccum = 0;

        // ---- 10. Emit ----
        bus.emit('market:share-updated', {
            playerShare,
            competitors: data.market.competitors.map(c => ({ id: c.id, name: c.name, share: c.share }))
        });
        bus.emit('state:changed', data);
    }

    _driftTrends() {
        const data = this.state.data;
        const t = data.market.trends || {};
        const target = getMacro(data.time, BALANCE.macro).trends;
        const pull = BALANCE.macro.trendPull;
        const noise = BALANCE.macro.trendNoise;
        // Mean-reverting: tren ditarik ke jangkar tahun berjalan + sedikit gejolak,
        // bukan random walk yang bisa melenceng jauh dari sejarah.
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

    // ============================================================
    // API PUBLIK
    // ============================================================
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
