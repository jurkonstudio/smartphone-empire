// FILE: src/systems/MarketSystem.js
// ============================================================
// MarketSystem — hitung pangsa pasar riil bulanan.
// Pangsa = playerRevenue / (playerRevenue + sum(competitorRevenue) + othersRevenue)
//
// Kompetitor revenue datang dari CompetitorSystem.computeCompetitorPower().
// Tren di-drift tiap bulan. Pangsa disimpan 24 bulan.
// ============================================================
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { BALANCE } from '../data/balance.data.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { LOG_TYPES } from '../config/constants.js';
import { getCompetitorById, getFictionalName } from '../data/competitors.data.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;

export class MarketSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
        this._competitorSystem = null;  // di-inject oleh main.js
    }

    // main.js memanggil ini setelah instansiasi CompetitorSystem
    setCompetitorSystem(cs) { this._competitorSystem = cs; }

    start() {
        this._unsubs.push(bus.on('time:month-changed', (s) => this._onMonthChanged(s)));
        this._unsubs.push(bus.on('state:hydrated',     () => this._ensureTrends()));
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

        // ---- 1. Hitung revenue pemain bulan ini ----
        const playerRevenue = this._computePlayerRevenue();

        // ---- 2. Hitung revenue kompetitor aktif ----
        const cs = this._competitorSystem;
        const competitorRevenues = [];
        let totalCompetitorRevenue = 0;

        if (cs) {
            const ids = cs.getActiveIds();
            ids.forEach(id => {
                const comp = getCompetitorById(id);
                if (!comp) return;
                const power = cs.computeCompetitorPower(id, snap.currentYear);
                // Tambah noise halus
                const noise = 1 + (Math.random() * 2 - 1) * 0.12;
                const rev = Math.max(0, Math.round(power * noise));
                competitorRevenues.push({ id, name: comp.name, revenue: rev });
                totalCompetitorRevenue += rev;
            });
        }

        // ---- 3. Others (pemain lain / pasar gelap) ----
        const others = Math.round((playerRevenue + totalCompetitorRevenue) * 0.4);

        // ---- 4. Total & pangsa ----
        const total = playerRevenue + totalCompetitorRevenue + others;
        const playerShare = total > 0 ? playerRevenue / total : 0;

        // ---- 5. Simpan ke state ----
        data.market.share = playerShare;

        // Update share per kompetitor di state.market.competitors (untuk UI cepat)
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

        // ---- 7. Milestone pangsa ----
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
            this.state.addLog('Pangsa pasar bulan ini: ' + (playerShare * 100).toFixed(1) + '%.', LOG_TYPES.info);
        }

        // ---- 9. Emit ----
        bus.emit('market:share-updated', {
            playerShare,
            competitors: data.market.competitors.map(c => ({ id: c.id, name: c.name, share: c.share }))
        });
        bus.emit('state:changed', data);
    }

    // ============================================================
    // REVENUE PEMAIN BULAN INI
    // ============================================================
    _computePlayerRevenue() {
        const data = this.state.data;
        let total = 0;

        // Ambil dari dailySales yang jatuh di bulan ini
        const currentAbsMonth = data.time.currentYear * 12 + (data.time.currentMonth - 1);

        data.products.catalog.forEach(p => {
            if (!p.dailySales) return;
            p.dailySales.forEach(d => {
                // Konversi game minute ke bulan (kasar via 30.4 hari)
                const dayAbs = Math.floor(d.day / MINUTES_PER_DAY);
                const monthAbs = Math.floor(dayAbs / 30.4);
                if (monthAbs === currentAbsMonth) {
                    total += d.revenue;
                }
            });
        });

        return Math.round(total);
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

    // Perubahan pangsa vs bulan sebelumnya
    getShareDelta() {
        const h = this.state.data.market.shareHistory || [];
        if (h.length < 2) return 0;
        return h[0].playerShare - h[1].playerShare;
    }

    // Mode nama
    getDisplayName(id, mode) {
        const comp = getCompetitorById(id);
        if (!comp) return id;
        return mode === 'fictional' ? getFictionalName(id) : comp.name;
    }
}
