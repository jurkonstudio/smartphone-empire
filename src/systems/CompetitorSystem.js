// FILE: src/systems/CompetitorSystem.js
// v2027.1c — computeCompetitorPower scale dengan era (tidak lagi flat 500K).
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
                    power: 1.0,
                    introduced: true
                };
                bus.emit('competitor:activated', { id: c.id, name: c.name });
            }
        });

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

        this._seedForYear(year);

        const tierInc = BALANCE.competitors.aiResearchTierPerYear || 0.3;
        Object.keys(cs.entities).forEach(id => {
            const e = cs.entities[id];
            e.currentTier = Math.min(5, e.currentTier + tierInc);
        });

        const lifeEvents = getLifeEventsForYear(year);
        lifeEvents.forEach(le => {
            const comp = getCompetitorById(le.competitorId);
            if (!comp) return;
            const e = cs.entities[comp.id];
            if (!e) return;

            e.currentShare = Math.max(0, Math.min(1, (e.currentShare || 0) + (le.shareDelta || 0)));

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

        const tier = Math.max(1, Math.min(5, Math.round(e.currentTier + (Math.random() * 0.6 - 0.3))));

        let productName = null;
        const candidate = (comp.signatureProducts || []).find(sp =>
            sp.year <= year && sp.year >= year - 3 && sp.tier === tier
        );
        if (candidate) {
            productName = candidate.name;
        } else {
            productName = comp.name + ' ' + ['X', 'Pro', 'Plus', 'Lite', 'Neo'][Math.floor(Math.random() * 5)] + (year % 100);
        }

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
    // [v2027.1c] Hitung revenue bulanan kompetitor — scale dengan era.
    computeCompetitorPower(competitorId, year) {
        const comp = getCompetitorById(competitorId);
        if (!comp) return 0;
        const e = this.state.data.competitorState.entities[competitorId];
        if (!e) return 0;

        // Base revenue tumbuh seiring era.
        const base = this._baseRevenueForYear(year);

        // Tier 1-5 → 1.0x - 2.6x.
        const tierMult = 1 + ((e.currentTier || 1) - 1) * 0.4;

        // Share 0-0.5 → 1.0x - 2.0x.
        const shareMult = 1 + (e.currentShare || 0) * 2;

        // Personality.
        const personMult = {
            aggressive: 1.20,
            premium:    1.10,
            innovator:  1.05,
            follower:   0.90,
            dominant:   1.50,
            declining:  0.70
        }[comp.personality] || 1.0;

        // Noise ±10%.
        const noise = 1 + (Math.random() * 2 - 1) * 0.10;

        return Math.round(base * tierMult * shareMult * personMult * noise);
    }

    // [v2027.1c] Base revenue bulanan per era (skala bertumbuh).
    _baseRevenueForYear(year) {
        if (year <= 2002) return 500000;      // early feature phone
        if (year <= 2005) return 1000000;
        if (year <= 2008) return 2000000;
        if (year <= 2011) return 3500000;     // touch revolution
        if (year <= 2014) return 6000000;
        if (year <= 2017) return 10000000;    // modern smartphone
        if (year <= 2020) return 16000000;
        if (year <= 2023) return 25000000;    // AI era
        return 40000000;
    }

    getDisplayName(competitorId, mode) {
        const comp = getCompetitorById(competitorId);
        if (!comp) return competitorId;
        return mode === 'fictional' ? getFictionalName(competitorId) : comp.name;
    }

    getActiveIds() {
        return Object.keys(this.state.data.competitorState.entities);
    }

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
