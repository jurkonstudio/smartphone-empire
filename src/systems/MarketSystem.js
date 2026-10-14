// FILE: src/systems/MarketSystem.js
// v2027.1c — fix pangsa pasar: revenue pemain dari accumulator event.
// Pangsa = playerRevenue / (playerRevenue + competitorRevenue + othersRevenue)
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { BALANCE } from '../data/balance.data.js';
import { LOG_TYPES } from '../config/constants.js';
import { getCompetitorById, getFictionalName } from '../data/competitors.data.js';

// Pangsa "others" (brand kecil tak terlacak) — realistis 30% pasar.
const OTHERS_SHARE = 0.30;

export class MarketSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
        this._competitorSystem = null;
        // [v2027.1c] Accumulator revenue bulan berjalan.
        this._monthRevenueAccum = 0;
    }

    setCompetitorSystem(cs) { this._competitorSystem = cs; }

    start() {
        this._unsubs.push(bus.on('time:month-changed', (s) => this._onMonthChanged(s)));
        this._unsubs.push(bus.on('state:hydrated',     () => this._ensureTrends()));

        // [v2027.1c] Kumpulkan revenue harian dari ProductSystem.
        // Event sama yang dipakai EconomySystem — kita paralel mendengar.
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
        const era = data.era || 'feature_phone';
        data.market.trends = { ...(BALANCE.market.trendsByEra[era] || BALANCE.market.trendsByEra.feature_phone) };
    }

    // ============================================================
    // BULANAN: HITUNG PANGSA
    // ============================================================
    _onMonthChanged(snap) {
        const data = this.state.data;

        // ---- 1. Revenue pemain dari accumulator ----
        // [v2027.1c] Sebelumnya scan dailySales dengan mismatch skala → selalu 0.
        const playerRevenue = Math.round(this._monthRevenueAccum);

        // ---- 2. Revenue kompetitor ----
        const cs = this._competitorSystem;
        const competitorRevenues = [];
        let totalCompetitorRevenue = 0;

        if (cs) {
            const ids = cs.getActiveIds();
            ids.forEach(id => {
                const comp = getCompetitorById(id);
                if (!comp) return;
                const rev = Math.max(0, Math.round(cs.computeCompetitorPower(id, snap.currentYear)));
                competitorRevenues.push({ id, name: comp.name, revenue: rev });
                totalCompetitorRevenue += rev;
            });
        }

        // ---- 3. Others — pangsa brand kecil (30% dari tracked market) ----
        const tracked = playerRevenue + totalCompetitorRevenue;
        const others = Math.round(tracked * OTHERS_SHARE);
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

        // ---- 9. Reset accumulator untuk bulan depan ----
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
        const drift = BALANCE.market.trendVariationPerMonth || 0.05;
        for (const k in t) {
            t[k] = Math.max(0.1, Math.min(0.95, t[k] + (Math.random() * 2 - 1) * drift));
        }
        data.market.trends = t;
        data.market.lastTrendUpdateMonth = { year: data.time.currentYear, month: data.time.currentMonth };
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
