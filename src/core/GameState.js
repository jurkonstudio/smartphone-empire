// FILE: src/core/GameState.js
import { TIME_CONFIG } from '../config/time.config.js';
import { BALANCE } from '../data/balance.data.js';
import { DIFFICULTY, LOG_TYPES } from '../config/constants.js';
import { bus } from './EventBus.js';
import { generateRandomName, rollTraits } from '../data/staff.data.js';

export const SCHEMA_VERSION = 4;

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
        staff: [],
        candidates: [],
        candidatePool: { lastRefreshMinute: 0, lastRefreshMonth: null },

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

        products: {
            catalog: [],
            designing: null,
            development: null,
            nextProductId: 1
        },

        // ===== CHIP (BARU) =====
        chips: {
            catalog: [],       // Chip yang sudah selesai dirancang
            designing: null,   // Chip yang sedang didesain
            nextChipId: 1
        },

        // ===== FAB (BARU) =====
        fab: {
            built: false,
            level: 0,          // 0=none, 1=small, 2=medium, 3=large, 4=mega
            builtAtMinute: 0,
            upgrade: null,     // { targetLevel, progressDays, durationDays, cost, startedAtMinute, lastProcessedMinute }
            producing: null,   // { chipId, qty, progressUnits, totalUnits, startedAtMinute, lastProcessedMinute }
            inventory: 0,      // Chip siap pakai di fab (dari produksi internal)
            history: [],       // Riwayat produksi
            totalProduced: 0,
            lastYieldRate: 1.0
        },

        marketing: { activeCampaigns: [] },
        reviews: { feed: [] },

        market: {
            share: 0,
            shareHistory: [],
            competitors: [],
            reputation: 10,
            trends: null,
            lastTrendUpdateMonth: null,
            revenueHistory: []
        },

        competitorState: {
            entities: {},
            lastLifeEventYear: 2000,
            initialized: false
        },

        feedback: {
            sentiment: 50,
            aspectSentiment: {
                design: 50, camera: 50, battery: 50, performance: 50,
                price: 50, reliability: 50, os: 50, support: 50
            },
            feed: [],
            activeViral: [],
            viralHistory: [],
            suggestions: [],
            perProductSatisfaction: {},
            competitorSentiment: {}
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
    if (oldData.time && typeof oldData.time === 'object') fresh.time = { ...fresh.time, ...oldData.time };
    if (typeof oldData.isPaused === 'boolean') fresh.isPaused = oldData.isPaused;
    if (typeof oldData.gameSpeed === 'number') fresh.gameSpeed = oldData.gameSpeed;
    return fresh;
}

function migrateV2toV3(oldData) {
    const fresh = createInitialState(DIFFICULTY.normal);
    if (!oldData || typeof oldData !== 'object') return fresh;
    Object.assign(fresh, oldData);
    fresh.schemaVersion = 3;
    const t = oldData.team || { engineers: 0, designers: 0, marketers: 0 };
    if (!Array.isArray(oldData.staff) || oldData.staff.length === 0) {
        const generated = [];
        const roleCounts = { engineer: t.engineers || 0, designer: t.designers || 0, marketer: t.marketers || 0 };
        let idCounter = 1;
        Object.keys(roleCounts).forEach(role => {
            for (let i = 0; i < roleCounts[role]; i++) {
                generated.push(_makeStaffEntry(role, 2, idCounter++, oldData.time));
            }
        });
        fresh.staff = generated;
    }
    if (!Array.isArray(fresh.candidates)) fresh.candidates = [];
    if (!fresh.candidatePool || typeof fresh.candidatePool !== 'object') {
        fresh.candidatePool = { lastRefreshMinute: 0, lastRefreshMonth: null };
    }
    return fresh;
}

function _makeStaffEntry(role, skill, idNum, timeObj) {
    const traitList = rollTraits();
    const baseSalary = (BALANCE.salary && BALANCE.salary[role]) || 2500;
    const skillDef = _skillTierDef(skill);
    const salary = Math.round(baseSalary * (skillDef ? skillDef.salaryMult : 1));
    return {
        id: 'staff_' + idNum + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name: generateRandomName(),
        role: role,
        skill: skill,
        salary: salary,
        morale: (BALANCE.team && BALANCE.team.moraleStart) || 75,
        traits: traitList,
        skillProgress: 0,
        hireDate: timeObj ? { year: timeObj.currentYear, month: timeObj.currentMonth, day: timeObj.currentDay } : { year: 2000, month: 1, day: 1 },
        hireGameMinute: timeObj ? (timeObj.elapsedGameMinutes || 0) : 0
    };
}

function _skillTierDef(tier) {
    const tiers = [
        { tier: 1, salaryMult: 1.0 },
        { tier: 2, salaryMult: 1.4 },
        { tier: 3, salaryMult: 2.0 },
        { tier: 4, salaryMult: 2.8 },
        { tier: 5, salaryMult: 4.0 }
    ];
    return tiers.find(t => t.tier === tier) || tiers[0];
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

    syncTeamCounters() {
        const counts = { engineers: 0, designers: 0, marketers: 0 };
        (this.data.staff || []).forEach(s => {
            if (s.role === 'engineer') counts.engineers++;
            else if (s.role === 'designer') counts.designers++;
            else if (s.role === 'marketer') counts.marketers++;
        });
        this.data.team = counts;
        bus.emit('team:changed', counts);
        bus.emit('state:changed', this.data);
        return counts;
    }

    getMonthlySalary() {
        if (Array.isArray(this.data.staff) && this.data.staff.length > 0) {
            return (this.data.staff || []).reduce((sum, s) => sum + (s.salary || 0), 0);
        }
        const t = this.data.team;
        const s = BALANCE.salary;
        return (t.engineers * s.engineer) + (t.designers * s.designer) + (t.marketers * s.marketer);
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
            text, type
        };
        this.data.log.unshift(entry);
        if (this.data.log.length > BALANCE.maxLogEntries) this.data.log.length = BALANCE.maxLogEntries;
        bus.emit('state:log-changed', { entry });
        bus.emit('state:changed', this.data);
        return entry;
    }

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

    hasSeenTip(id) { return this.data.seenTips.includes(id); }
    markTipSeen(id) {
        if (this.hasSeenTip(id)) return false;
        this.data.seenTips.push(id);
        bus.emit('tip:shown', { id });
        bus.emit('state:changed', this.data);
        return true;
    }

    setReputation(value) {
        const clamped = Math.max(BALANCE.market.minReputation, Math.min(BALANCE.market.maxReputation, value));
        this.data.market.reputation = clamped;
        bus.emit('state:changed', this.data);
    }
    addReputation(delta) { this.setReputation((this.data.market.reputation || 0) + delta); }

    setSentiment(value) {
        const clamped = Math.max(0, Math.min(100, Math.round(value)));
        this.data.feedback.sentiment = clamped;
        bus.emit('feedback:sentiment-changed', { value: clamped });
        bus.emit('state:changed', this.data);
    }
    addSentiment(delta) { this.setSentiment((this.data.feedback.sentiment || 50) + delta); }

    // ============== SERIALISASI ==============
    serialize() { return JSON.parse(JSON.stringify(this.data)); }

    hydrate(data) {
        if (!data || typeof data !== 'object') return false;
        let incoming = data;

        // Migrasi berantai
        if (!incoming.schemaVersion || incoming.schemaVersion < 2) {
            const fresh = createInitialState(DIFFICULTY.normal);
            if (typeof incoming.companyName === 'string') fresh.companyName = incoming.companyName;
            if (typeof incoming.cash === 'number') fresh.cash = incoming.cash;
            if (incoming.time) fresh.time = { ...fresh.time, ...incoming.time };
            if (typeof incoming.isPaused === 'boolean') fresh.isPaused = incoming.isPaused;
            if (typeof incoming.gameSpeed === 'number') fresh.gameSpeed = incoming.gameSpeed;
            incoming = fresh;
        }
        if (incoming.schemaVersion < 3) incoming = migrateV2toV3(incoming);

        // v3 → v4: chips & fab otomatis punya default dari base
        const base = createInitialState(incoming.difficulty || DIFFICULTY.normal);
        this.data = {
            ...base,
            ...incoming,
            time:     { ...base.time,     ...(incoming.time || {}) },
            finance:  { ...base.finance,  ...(incoming.finance || {}) },
            team:     { ...base.team,     ...(incoming.team || {}) },
            staff:    Array.isArray(incoming.staff) ? incoming.staff : [],
            candidates: Array.isArray(incoming.candidates) ? incoming.candidates : [],
            candidatePool: { ...base.candidatePool, ...(incoming.candidatePool || {}) },
            research: { ...base.research, ...(incoming.research || {}) },

            os: {
                ...base.os, ...(incoming.os || {}),
                apps: { ...base.os.apps, ...((incoming.os && incoming.os.apps) || {}) }
            },
            products: {
                ...base.products, ...(incoming.products || {}),
                catalog: Array.isArray(incoming.products && incoming.products.catalog) ? incoming.products.catalog : []
            },
            // ===== CHIP & FAB (BARU) =====
            chips: {
                ...base.chips, ...(incoming.chips || {}),
                catalog: Array.isArray(incoming.chips && incoming.chips.catalog) ? incoming.chips.catalog : []
            },
            fab: {
                ...base.fab, ...(incoming.fab || {}),
                history: Array.isArray(incoming.fab && incoming.fab.history) ? incoming.fab.history : []
            },
            marketing: {
                ...base.marketing, ...(incoming.marketing || {}),
                activeCampaigns: Array.isArray(incoming.marketing && incoming.marketing.activeCampaigns) ? incoming.marketing.activeCampaigns : []
            },
            reviews: {
                ...base.reviews, ...(incoming.reviews || {}),
                feed: Array.isArray(incoming.reviews && incoming.reviews.feed) ? incoming.reviews.feed : []
            },
            market: {
                ...base.market, ...(incoming.market || {}),
                shareHistory: Array.isArray(incoming.market && incoming.market.shareHistory) ? incoming.market.shareHistory : [],
                revenueHistory: Array.isArray(incoming.market && incoming.market.revenueHistory) ? incoming.market.revenueHistory : []
            },
            competitorState: {
                ...base.competitorState, ...(incoming.competitorState || {}),
                entities: { ...base.competitorState.entities, ...((incoming.competitorState && incoming.competitorState.entities) || {}) }
            },
            feedback: {
                ...base.feedback, ...(incoming.feedback || {}),
                aspectSentiment: { ...base.feedback.aspectSentiment, ...((incoming.feedback && incoming.feedback.aspectSentiment) || {}) },
                feed: Array.isArray(incoming.feedback && incoming.feedback.feed) ? incoming.feedback.feed : [],
                activeViral: Array.isArray(incoming.feedback && incoming.feedback.activeViral) ? incoming.feedback.activeViral : [],
                viralHistory: Array.isArray(incoming.feedback && incoming.feedback.viralHistory) ? incoming.feedback.viralHistory : [],
                suggestions: Array.isArray(incoming.feedback && incoming.feedback.suggestions) ? incoming.feedback.suggestions : [],
                perProductSatisfaction: { ...((incoming.feedback && incoming.feedback.perProductSatisfaction) || {}) },
                competitorSentiment: { ...((incoming.feedback && incoming.feedback.competitorSentiment) || {}) }
            },
            events:   { ...base.events,   ...(incoming.events || {}) },
            quests:   { ...base.quests,   ...(incoming.quests || {}) },
            tutorial: { ...base.tutorial, ...(incoming.tutorial || {}) },
            settings: { ...base.settings, ...(incoming.settings || {}) }
        };

        if (typeof this.data.research.totalCompleted !== 'number') this.data.research.totalCompleted = this.data.research.completed.length;
        if (!this.data.market.trends) this.data.market.trends = { ...BALANCE.market.trendsByEra.feature_phone };
        if (typeof this.data.feedback.sentiment !== 'number') this.data.feedback.sentiment = (BALANCE.feedback && BALANCE.feedback.initialSentiment) || 50;

        this.data.staff.forEach(s => {
            if (typeof s.skillProgress !== 'number') s.skillProgress = 0;
            if (typeof s.morale !== 'number') s.morale = 75;
            if (!Array.isArray(s.traits)) s.traits = [];
        });

        if (this.data.staff.length > 0) this.syncTeamCounters();

        bus.emit('state:hydrated', this.data);
        bus.emit('state:changed', this.data);
        return true;
    }

    reset(difficulty = DIFFICULTY.normal) {
        this.data = createInitialState(difficulty);
        bus.emit('state:changed', this.data);
    }

    getMonthlyFixedCost() {
        const m = BALANCE.monthly;
        return m.rentHQ + m.utilities + m.baseAdmin;
    }
}

export const state = new GameState();
export { createInitialState };
