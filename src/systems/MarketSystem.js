// FILE: src/systems/MarketSystem.js
// ============================================================
// MarketSystem — menghitung pangsa pasar bulanan, update tren.
// Kompetitor penuh akan dibangun Batch C; di sini hanya placeholder
// sederhana: 3 kompetitor dummy dengan revenue dasar.
// ============================================================
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { BALANCE } from '../data/balance.data.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { LOG_TYPES } from '../config/constants.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;

export class MarketSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        this._unsubs.push(bus.on('time:month-changed', (s) => this._onMonthChanged(s)));
        this._unsubs.push(bus.on('state:hydrated',     () => this._onHydrated()));
        this._ensureCompetitors();
        this._ensureTrends();
        console.info('[MarketSystem] siap.');
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    _onHydrated() {
        this._ensureCompetitors();
        this._ensureTrends();
    }

    _ensureCompetitors() {
        const data = this.state.data;
        if (data.market.competitors && data.market.competitors.length) return;
        // Placeholder 3 kompetitor dummy (nama fiktif, bukan merek nyata)
        data.market.competitors = [
            { id: 'comp_nova',   name: 'Nova Mobile',   share: 0.30, baseRevenue: 400000, personality: 'aggressive' },
            { id: 'comp_aurora', name: 'Aurora Tech',   share: 0.25, baseRevenue: 330000, personality: 'premium' },
            { id: 'comp_pixel',  name: 'Pixelworks',    share: 0.20, baseRevenue: 260000, personality: 'innovator' }
        ];
        // Sisanya (0.25) = "pemain lain" (tidak ditampilkan detail)
    }

    _ensureTrends() {
        const data = this.state.data;
        if (data.market.trends) return;
        const era = data.era || 'feature_phone';
        data.market.trends = { ...(BALANCE.market.trendsByEra[era] || BALANCE.market.trendsByEra.feature_phone) };
    }

    // ============================================================
    // BULANAN: hitung pangsa pasar
    // ============================================================
    _onMonthChanged(snap) {
        const data = this.state.data;

        // Total revenue pemain bulan ini = jumlah totalRevenue semua produk yang dijual bulan ini.
        // Untuk sederhana, gunakan total dailySales bulan ini.
        let playerRevenue = 0;
        data.products.catalog.forEach(p => {
            (p.dailySales || []).forEach(d => {
                // Sudah dihitung kemarin; sederhananya ambil totalSold * price.
            });
            playerRevenue += p.totalRevenue / Math.max(1, ((data.time.elapsedGameMinutes - p.releaseGameMinute) / (MINUTES_PER_DAY * 30)));
        });
        playerRevenue = Math.round(playerRevenue);

        // Kompetitor: revenue dasar × agresi kesulitan
        const diff = BALANCE.difficultyMultiplier[data.difficulty] || BALANCE.difficultyMultiplier.normal;
        const aggression = diff.competitorAggression || 1.0;
        const competitorRevenues = data.market.competitors.map(c => {
            const base = c.baseRevenue * aggression;
            const noise = 1 + (Math.random() * 2 - 1) * 0.15;
            return { id: c.id, name: c.name, revenue: Math.round(base * noise) };
        });

        const othersRevenue = Math.round((playerRevenue + competitorRevenues.reduce((s, c) => s + c.revenue, 0)) * 0.8);
        const totalRevenue = playerRevenue + competitorRevenues.reduce((s, c) => s + c.revenue, 0) + othersRevenue;

        const playerShare = totalRevenue > 0 ? playerRevenue / totalRevenue : 0;
        competitorRevenues.forEach((cr, i) => {
            const comp = data.market.competitors[i];
            if (comp) comp.share = totalRevenue > 0 ? cr.revenue / totalRevenue : 0;
        });

        data.market.share = playerShare;
        data.market.shareHistory.unshift({
            year: snap.currentYear,
            month: snap.currentMonth,
            playerShare: playerShare,
            competitors: competitorRevenues.map(c => ({ id: c.id, share: data.market.competitors.find(x => x.id === c.id).share }))
        });
        if (data.market.shareHistory.length > 24) data.market.shareHistory.length = 24;

        data.market.revenueHistory.unshift({
            year: snap.currentYear,
            month: snap.currentMonth,
            playerRevenue,
            totalRevenue
        });
        if (data.market.revenueHistory.length > 24) data.market.revenueHistory.length = 24;

        // Update tren sedikit (drift)
        this._driftTrends();

        // Log milestone pangsa pertama
        if (playerShare >= 0.10 && !data.milestones.some(m => m.id === 'share_10')) {
            this.state.addMilestone('share_10', 'Pangsa pasar 10%.');
        }
        if (playerShare >= 0.25 && !data.milestones.some(m => m.id === 'share_25')) {
            this.state.addMilestone('share_25', 'Pangsa pasar 25%.');
        }

        bus.emit('market:share-updated', {
            playerShare,
            competitors: data.market.competitors.map(c => ({ id: c.id, name: c.name, share: c.share }))
        });
        bus.emit('state:changed', data);

        if (playerRevenue > 0) {
            this.state.addLog('Pangsa pasar bulan ini: ' + (playerShare * 100).toFixed(1) + '%.', LOG_TYPES.info);
        }
    }

    _driftTrends() {
        const data = this.state.data;
        const t = data.market.trends || {};
        const drift = BALANCE.market.trendVariationPerMonth;
        for (const k in t) {
            const delta = (Math.random() * 2 - 1) * drift;
            t[k] = Math.max(0.1, Math.min(0.95, t[k] + delta));
        }
        data.market.trends = t;
    }

    // ============================================================
    // API PUBLIK
    // ============================================================
    getMarketShare() {
        return this.state.data.market.share || 0;
    }
    getCompetitors() {
        return this.state.data.market.competitors || [];
    }
    getTrends() {
        return this.state.data.market.trends || {};
    }
    getReputation() {
        return this.state.data.market.reputation || 0;
    }
          }
