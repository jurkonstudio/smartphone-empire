// FILE: src/core/GameState.js
import { TIME_CONFIG } from '../config/time.config.js';
import { BALANCE } from '../data/balance.data.js';
import { DIFFICULTY, LOG_TYPES } from '../config/constants.js';
import { bus } from './EventBus.js';

export const SCHEMA_VERSION = 2;

function createInitialState(difficulty = DIFFICULTY.normal) {
    const startingCash = BALANCE.startingCash[difficulty] ?? BALANCE.startingCash.normal;
    return {
        schemaVersion: SCHEMA_VERSION,
        createdAt: Date.now(),

        companyName: 'My Tech Co',
        difficulty,

        time: {
            currentYear: TIME_CONFIG.startYear,
            currentMonth: TIME_CONFIG.startMonth,
            currentDay: TIME_CONFIG.startDay,
            currentHour: TIME_CONFIG.startHour,
            currentMinute: TIME_CONFIG.startMinute,
            elapsedGameMinutes: 0
        },
        isPaused: TIME_CONFIG.startPaused,
        gameSpeed: TIME_CONFIG.defaultSpeed,

        cash: startingCash,
        finance: {
            history: [],
            negativeMonths: 0,
            loans: [],
            lastProcessed: null
        },

        team: { engineers: 0, designers: 0, marketers: 0 },

        research: {
    active: [],
    completed: (BALANCE.starterResearch || []).slice(),
    maxSlots: 1,
    totalCompleted: (BALANCE.starterResearch || []).length
},

        os: {
            name: null,
            createdAt: null,
            versions: [],
            currentVersionId: null,
            developing: null,
            bugs: [],
            apps: { builtin: [], thirdParty: 0 },
            appsAccumulator: 0,
            licenseChoice: null
        },

        // ===== PRODUK (diperluas Batch B) =====
        products: {
            catalog: [],       // Produk yang sudah dirilis
            designing: null,   // Wizard design yang sedang diisi (state sementara)
            development: null, // Proyek pengembangan aktif (setelah confirm design)
            nextProductId: 1
        },

        // ===== PEMASARAN (Batch B) =====
        marketing: {
            activeCampaigns: []  // [{ id, campaignId, productId, startedAtMinute, endsAtMinute, cost, effectiveReach }]
        },

        // ===== ULASAN (Batch B) =====
        reviews: {
            feed: []           // Maks 30, [{ id, productId, source, score, text, date:{year,month,day}, gameMinute }]
        },

        // ===== PASAR (diperluas Batch B) =====
        market: {
    share: 0,
    shareHistory: [],
    competitors: [],       // state AI runtime, diisi CompetitorSystem
    reputation: 10,
    trends: null,
    lastTrendUpdateMonth: null,
    revenueHistory: []
},

// ===== KOMPETITOR AI (Batch C) =====
competitorState: {
    // { id: { currentTier, currentShare, lastReleaseMonth, releases[], activeViralId } }
    entities: {},
    lastLifeEventYear: 2000
},

// ===== FEEDBACK PUBLIK (Batch C) =====
feedback: {
    sentiment: 50,
    aspectSentiment: {
        design: 50, camera: 50, battery: 50, performance: 50,
        price: 50, reliability: 50, os: 50, support: 50
    },
    feed: [],              // 30 ulasan terbaru
    activeViral: [],       // viral event yang sedang berjalan
    viralHistory: [],      // viral event yang sudah lewat
    suggestions: [],       // saran pelanggan aktif (maks 3)
    perProductSatisfaction: {}, // { productId: score 0-100 }
    competitorSentiment: {}     // { competitorId: score 0-100 }
},

        events: {
            cooldownUntilMinute: 0,
            pending: null,
            history: []
        },

        quests: { active: [], completed: [] },

        log: [],
        milestones: [],

        tutorial: { completed: false, skipped: false, currentStep: 0 },
        seenTips: [],

        settings: { vibrate: true, sound: false },

        era: 'feature_phone',
        eraStartYear: TIME_CONFIG.startYear,

        gameOver: null
    };
}

function migrateV1toV2(oldData) {
    const fresh = createInitialState(DIFFICULTY.normal);
    if (!oldData || typeof oldData !== 'object') return fresh;

    if (typeof oldData.companyName === 'string') fresh.companyName = oldData.companyName;
    if (typeof oldData.cash === 'number') fresh.cash = oldData.cash;
    if (oldData.time && typeof oldData.time === 'object') {
        fresh.time = { ...fresh.time, ...oldData.time };
    }
    if (typeof oldData.isPaused === 'boolean') fresh.isPaused = oldData.isPaused;
    if (typeof oldData.gameSpeed === 'number') fresh.gameSpeed = oldData.gameSpeed;
    return fresh;
}

class GameState {
    constructor() {
        this.data = createInitialState();
        this._logSeq = 0;
    }

    get() { return this.data; }

    patch(updates) {
        Object.assign(this.data, updates);
        bus.emit('state:changed', this.data);
    }

    getGameDay() {
        const m = this.data.time.elapsedGameMinutes || 0;
        const perDay = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;
        return Math.floor(m / perDay);
    }

    // ============== KEUANGAN ==============
    setCash(newCash) {
        const prev = this.data.cash;
        if (prev === newCash) return;
        this.data.cash = newCash;
        bus.emit('state:cash-changed', { prev, next: newCash, delta: newCash - prev });
        bus.emit('state:changed', this.data);
    }

    addCash(delta) {
        if (!delta) return;
        this.setCash(this.data.cash + delta);
    }

    // ============== TIM ==============
    setTeam(team) {
        this.data.team = { ...this.data.team, ...team };
        bus.emit('team:changed', this.data.team);
        bus.emit('state:changed', this.data);
    }

    // ============== LOG ==============
    addLog(text, type = LOG_TYPES.info) {
        const t = this.data.time;
        const entry = {
            id: ++this._logSeq,
            gameMinute: t.elapsedGameMinutes,
            year: t.currentYear,
            month: t.currentMonth,
            day: t.currentDay,
            text,
            type
        };
        this.data.log.unshift(entry);
        if (this.data.log.length > BALANCE.maxLogEntries) {
            this.data.log.length = BALANCE.maxLogEntries;
        }
        bus.emit('state:log-changed', { entry });
        bus.emit('state:changed', this.data);
        return entry;
    }

    // ============== MILESTONE ==============
    addMilestone(id, text) {
        if (this.data.milestones.some(m => m.id === id)) return false;
        const t = this.data.time;
        const milestone = { id, year: t.currentYear, month: t.currentMonth, day: t.currentDay, text };
        this.data.milestones.push(milestone);
        if (this.data.milestones.length > BALANCE.maxMilestones) this.data.milestones.shift();
        bus.emit('state:milestone-added', { milestone });
        bus.emit('state:changed', this.data);
        return true;
    }

    // ============== TIPS ==============
    hasSeenTip(id) { return this.data.seenTips.includes(id); }
    markTipSeen(id) {
        if (this.hasSeenTip(id)) return false;
        this.data.seenTips.push(id);
        bus.emit('tip:shown', { id });
        bus.emit('state:changed', this.data);
        return true;
    }

    // ============== REPUTASI ==============
    setReputation(value) {
        const clamped = Math.max(BALANCE.market.minReputation, Math.min(BALANCE.market.maxReputation, value));
        this.data.market.reputation = clamped;
        bus.emit('state:changed', this.data);
    }
    addReputation(delta) {
        this.setReputation((this.data.market.reputation || 0) + delta);
    }

    // ============== SERIALISASI ==============
    serialize() { return JSON.parse(JSON.stringify(this.data)); }

    hydrate(data) {
        if (!data || typeof data !== 'object') return false;

        let incoming = data;
        if (!incoming.schemaVersion || incoming.schemaVersion < 2) {
            incoming = migrateV1toV2(incoming);
        }

        const base = createInitialState(incoming.difficulty || DIFFICULTY.normal);
        this.data = {
            ...base,
            ...incoming,
            time:     { ...base.time,     ...(incoming.time || {}) },
            finance:  { ...base.finance,  ...(incoming.finance || {}) },
            team:     { ...base.team,     ...(incoming.team || {}) },
            research: { ...base.research, ...(incoming.research || {}) },
            os: {
                ...base.os,
                ...(incoming.os || {}),
                apps: { ...base.os.apps, ...((incoming.os && incoming.os.apps) || {}) }
            },
            products: {
                ...base.products,
                ...(incoming.products || {}),
                catalog: Array.isArray(incoming.products && incoming.products.catalog)
                    ? incoming.products.catalog : []
            },
            marketing: {
                ...base.marketing,
                ...(incoming.marketing || {}),
                activeCampaigns: Array.isArray(incoming.marketing && incoming.marketing.activeCampaigns)
                    ? incoming.marketing.activeCampaigns : []
            },
            reviews: {
                ...base.reviews,
                ...(incoming.reviews || {}),
                feed: Array.isArray(incoming.reviews && incoming.reviews.feed)
                    ? incoming.reviews.feed : []
            },
            market: {
                ...base.market,
                ...(incoming.market || {}),
                shareHistory: Array.isArray(incoming.market && incoming.market.shareHistory)
                    ? incoming.market.shareHistory : [],
                revenueHistory: Array.isArray(incoming.market && incoming.market.revenueHistory)
                    ? incoming.market.revenueHistory : []
            },
            events:   { ...base.events,   ...(incoming.events || {}) },
            quests:   { ...base.quests,   ...(incoming.quests || {}) },
            tutorial: { ...base.tutorial, ...(incoming.tutorial || {}) },
            settings: { ...base.settings, ...(incoming.settings || {}) }
        };

        if (typeof this.data.research.totalCompleted !== 'number') {
            this.data.research.totalCompleted = this.data.research.completed.length;
        }
        if (!this.data.market.trends) {
            this.data.market.trends = { ...BALANCE.market.trendsByEra.feature_phone };
        }

        bus.emit('state:hydrated', this.data);
        bus.emit('state:changed', this.data);
        return true;
    }

    reset(difficulty = DIFFICULTY.normal) {
        this.data = createInitialState(difficulty);
        bus.emit('state:changed', this.data);
    }

    getMonthlySalary() {
        const t = this.data.team;
        const s = BALANCE.salary;
        return (t.engineers * s.engineer) + (t.designers * s.designer) + (t.marketers * s.marketer);
    }

    getMonthlyFixedCost() {
        const m = BALANCE.monthly;
        return m.rentHQ + m.utilities + m.baseAdmin;
    }
}

export const state = new GameState();
export { createInitialState };
