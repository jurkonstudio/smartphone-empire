// FILE: src/systems/CompetitorSystem.js
// ============================================================
// CompetitorSystem — AI kompetitor dunia nyata.
// Tanggung jawab:
//   - Seed entitas kompetitor saat tahun berganti (aktif/nonaktif).
//   - Menaikkan tier riset mereka perlahan (mengikuti tahun).
//   - Merilis produk AI setiap aiReleaseIntervalMonths bulan.
//   - Memicu lifeEvents pada tahun yang ditentukan (mis. iPhone 2007).
//   - Menyediakan data pangsa awal untuk MarketSystem.
// ============================================================
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { BALANCE } from '../data/balance.data.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { ToastService } from '../core/ToastService.js';
import { LOG_TYPES } from '../config/constants.js';
import {
    COMPETITORS,
    getActiveCompetitors,
    getCompetitorById,
    getFictionalName,
    getLifeEventsForYear
} from '../data/competitors.data.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;
const DAYS_PER_MONTH_AVG = 30.4;

function absMonth(year, month) {
    return year * 12 + (month - 1);
}

export class CompetitorSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        this._unsubs.push(bus.on('time:year-changed',  (s) => this._onYearChanged(s)));
        this._unsubs.push(bus.on('time:month-changed', (s) => this._onMonthChanged(s)));
        this._unsubs.push(bus.on('state:hydrated',     () => this._onHydrated()));

        // Seed pertama
        this._seedForYear(this.state.data.time.currentYear);
        console.info('[CompetitorSystem] siap.');
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    _onHydrated() {
        const cs = this.state.data.competitorState;
        if (!cs.entities) cs.entities = {};
        if (!cs.initialized) {
            cs.initialized = true;
            this._seedForYear(this.state.data.time.currentYear);
        }
    }

    // ============================================================
    // SEED & EVENT TAHUNAN
    // ============================================================
    _seedForYear(year) {
        const data = this.state.data;
        const cs = data.competitorState;
        const active = getActiveCompetitors(year);

        active.forEach(c => {
            if (!cs.entities[c.id]) {
                cs.entities[c.id] = {
                    id: c.id,
                    currentTier: c.researchStartTier || 1,
                    currentShare: c.startShare || 0,
                    lastReleaseMonth: absMonth(year, 1),
                    releases: [],
                    activeViralId: null,
                    power: 1.0,        // di-update MarketSystem
                    introduced: true
                };
                bus.emit('competitor:activated', { id: c.id, name: c.name });
            }
        });

        // Hapus yang sudah tidak aktif
        Object.keys(cs.entities).forEach(id => {
            const c = getCompetitorById(id);
            if (!c) return;
            if (c.activeToYear !== null && year > c.activeToYear) {
                delete cs.entities[id];
                bus.emit('competitor:deactivated', { id: c.id, name: c.name });
            }
        });

        cs.initialized = true;
        bus.emit('state:changed', data);
    }

    _onYearChanged(snap) {
        const data = this.state.data;
        const cs = data.competitorState;
        const year = snap.currentYear;

        // Seed kompetitor baru
        this._seedForYear(year);

        // Naikkan tier riset AI perlahan
        const tierInc = BALANCE.competitors.aiResearchTierPerYear || 0.3;
        Object.keys(cs.entities).forEach(id => {
            const e = cs.entities[id];
            e.currentTier = Math.min(5, e.currentTier + tierInc);
        });

        // Fire life events tahun ini
        const lifeEvents = getLifeEventsForYear(year);
        lifeEvents.forEach(le => {
            const comp = getCompetitorById(le.competitorId);
            if (!comp) return;
            const e = cs.entities[comp.id];
            if (!e) return;

            // Update share
            e.currentShare = Math.max(0, Math.min(1, (e.currentShare || 0) + (le.shareDelta || 0)));

            // Notifikasi ke pemain
            const isBig = Math.abs(le.shareDelta || 0) >= 0.05;
            const msg = comp.name + ': ' + le.text;
            this.state.addLog(msg, LOG_TYPES.info);
            if (isBig) {
                ToastService.info('📰 ' + msg);
                this.state.addMilestone('comp_' + comp.id + '_' + year, msg);
            }

            bus.emit('competitor:life-event', {
                competitorId: comp.id,
                competitorName: comp.name,
                year,
                text: le.text,
                shareDelta: le.shareDelta || 0
            });
        });

        cs.lastLifeEventYear = year;
        bus.emit('state:changed', data);
    }

    _onMonthChanged(snap) {
        const data = this.state.data;
        const cs = data.competitorState;
        const year = snap.currentYear;
        const month = snap.currentMonth;
        const absNow = absMonth(year, month);
        const interval = BALANCE.competitors.aiReleaseIntervalMonths || 8;

        Object.keys(cs.entities).forEach(id => {
            const e = cs.entities[id];
            if (absNow - e.lastReleaseMonth >= interval) {
                this._releaseAiProduct(id, year, month);
                e.lastReleaseMonth = absNow;
            }
        });
    }

    // ============================================================
    // AI RILIS PRODUK
    // ============================================================
    _releaseAiProduct(competitorId, year, month) {
        const comp = getCompetitorById(competitorId);
        if (!comp) return;
        const cs = this.state.data.competitorState;
        const e = cs.entities[competitorId];
        if (!e) return;

        // Pilih tier: kadang tier terbaru, kadang tier sebelumnya (variasi)
        const tier = Math.max(1, Math.min(5, Math.round(e.currentTier + (Math.random() * 0.6 - 0.3))));

        // Cari produk ikonik dari data atau generate generik
        let productName = null;
        const candidate = (comp.signatureProducts || []).find(sp =>
            sp.year <= year && sp.year >= year - 3 && sp.tier === tier
        );
        if (candidate) {
            productName = candidate.name;
        } else {
            productName = comp.name + ' ' + ['X', 'Pro', 'Plus', 'Lite', 'Neo'][Math.floor(Math.random() * 5)] + (year % 100);
        }

        // Share boost berdasarkan tier & personality
        const baseBoost = 0.005 + (tier - 1) * 0.008;
        const personMult = {
            aggressive: 1.2,
            premium:    1.1,
            innovator:  1.15,
            follower:   0.9,
            dominant:   1.0,
            declining:  0.6
        }[comp.personality] || 1.0;
        const shareBoost = baseBoost * personMult;

        e.currentShare = Math.min(0.5, (e.currentShare || 0) + shareBoost);
        e.releases.push({ name: productName, year, month, tier });
        if (e.releases.length > 10) e.releases.shift();

        // Log & emit
        this.state.addLog(comp.name + ' merilis ' + productName + ' (Tier ' + tier + ').', LOG_TYPES.info);
        bus.emit('competitor:released-product', {
            competitorId,
            competitorName: comp.name,
            productName,
            tier,
            year,
            month
        });
        bus.emit('state:changed', this.state.data);
    }

    // ============================================================
    // API PUBLIK
    // ============================================================
    // Hitung "power" (proxy revenue) kompetitor untuk MarketSystem.
    // Semakin tinggi tier, semakin besar power.
    computeCompetitorPower(competitorId, year) {
        const comp = getCompetitorById(competitorId);
        if (!comp) return 0;
        const e = this.state.data.competitorState.entities[competitorId];
        if (!e) return 0;

        // Base revenue berdasarkan share awal & tier
        const startShare = comp.startShare || 0;
        const tier = e.currentTier || 1;
        const tierMult = 1 + (tier - 1) * 0.6;
        const shareMult = 1 + (startShare * 5);

        // Base revenue kasar = 500k (kompetitor skala besar)
        let base = 500000;

        // Penyesuaian era: kompetitor lebih kuat di era awal, lebih lemah di era akhir untuk brand lama
        if (comp.personality === 'declining') base *= 0.6;
        if (comp.personality === 'dominant')  base *= 1.4;
        if (comp.personality === 'aggressive')base *= 1.15;
        if (comp.personality === 'premium')   base *= 1.10;
        if (comp.personality === 'innovator') base *= 1.05;
        if (comp.personality === 'follower')  base *= 0.85;

        return Math.round(base * tierMult * shareMult);
    }

    // Ambil nama tampil sesuai mode Asli/Fiktif
    getDisplayName(competitorId, mode) {
        const comp = getCompetitorById(competitorId);
        if (!comp) return competitorId;
        return mode === 'fictional' ? getFictionalName(competitorId) : comp.name;
    }

    // Daftar kompetitor aktif tahun ini
    getActiveIds() {
        return Object.keys(this.state.data.competitorState.entities);
    }

    // Ambil data lengkap untuk UI
    getCompetitorData(id, mode) {
        const comp = getCompetitorById(id);
        if (!comp) return null;
        const e = this.state.data.competitorState.entities[id];
        return {
            id: comp.id,
            name: mode === 'fictional' ? getFictionalName(id) : comp.name,
            realName: comp.name,
            country: comp.country,
            color: comp.color,
            personality: comp.personality,
            osName: comp.osName,
            strengths: comp.strengths || [],
            weaknesses: comp.weaknesses || [],
            currentTier: e ? e.currentTier : comp.researchStartTier,
            currentShare: e ? e.currentShare : comp.startShare,
            lastRelease: e && e.releases.length ? e.releases[e.releases.length - 1] : null,
            signatureProducts: comp.signatureProducts || [],
            activeFromYear: comp.activeFromYear,
            activeToYear: comp.activeToYear
        };
    }

    // ============================================================
    // CHEAT
    // ============================================================
    forceRelease(competitorId) {
        const y = this.state.data.time.currentYear;
        const m = this.state.data.time.currentMonth;
        this._releaseAiProduct(competitorId, y, m);
        return { ok: true };
    }

    triggerLifeEventFor(competitorId) {
        const comp = getCompetitorById(competitorId);
        if (!comp) return { ok: false, reason: 'Kompetitor tidak ditemukan.' };
        const events = (comp.lifeEvents || []).filter(le => le.year === this.state.data.time.currentYear);
        if (!events.length) return { ok: false, reason: 'Tidak ada life event tahun ini.' };
        const le = events[0];
        const e = this.state.data.competitorState.entities[competitorId];
        if (e) e.currentShare = Math.max(0, (e.currentShare || 0) + (le.shareDelta || 0));
        this.state.addLog('(cheat) ' + comp.name + ': ' + le.text, LOG_TYPES.info);
        bus.emit('competitor:life-event', { competitorId, competitorName: comp.name, year: this.state.data.time.currentYear, text: le.text, shareDelta: le.shareDelta || 0 });
        return { ok: true };
    }
}

export { absMonth, DAYS_PER_MONTH_AVG };
