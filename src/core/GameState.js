// FILE: src/core/GameState.js
import { TIME_CONFIG } from '../config/time.config.js';
import { BALANCE } from '../data/balance.data.js';
import { DIFFICULTY, LOG_TYPES } from '../config/constants.js';
import { bus } from './EventBus.js';

export const SCHEMA_VERSION = 2;

// ---------- Default state (v2) ----------
function createInitialState(difficulty = DIFFICULTY.normal) {
    const startingCash = BALANCE.startingCash[difficulty] ?? BALANCE.startingCash.normal;
    return {
        schemaVersion: SCHEMA_VERSION,
        createdAt: Date.now(),

        companyName: 'My Tech Co',
        difficulty,

        // Waktu
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

        // Keuangan
        cash: startingCash,
        finance: {
            history: [],              // max 24 bulan
            negativeMonths: 0,        // beruntun
            loans: [],                // pinjaman aktif
            lastProcessed: null       // { year, month } cegah double
        },

        // Tim
        team: { engineers: 0, designers: 0, marketers: 0 },

        // Riset
        research: {
            active: [],               // maks BASE_RESEARCH_SLOTS
            completed: [],            // [id]
            maxSlots: 1
        },

        // OS
        os: {
            versions: [],             // history OS selesai
            currentVersionId: null,
            developing: null          // proyek OS berjalan
        },

        // Produk
        products: {
            catalog: [],
            designing: null
        },

        // Pasar
        market: {
            share: 0,
            shareHistory: [],
            competitors: []
        },

        // Event
        events: {
            cooldownUntilMinute: 0,
            pending: null,
            history: []
        },

        // Quest
        quests: { active: [], completed: [] },

        // Log & milestones
        log: [],
        milestones: [],

        // Tutorial & tips
        tutorial: { completed: false, skipped: false, currentStep: 0 },
        seenTips: [],

        // Pengaturan
        settings: { vibrate: true, sound: false },

        // Era
        era: 'feature_phone',
        eraStartYear: TIME_CONFIG.startYear,

        // Status akhir
        gameOver: null   // { reason, year, month } jika kalah
    };
}

// ---------- Migrasi v1 → v2 ----------
function migrateV1toV2(oldData) {
    const fresh = createInitialState(DIFFICULTY.normal);
    if (!oldData || typeof oldData !== 'object') return fresh;

    // Bawa nilai yang mungkin ada di v1
    if (typeof oldData.companyName === 'string') fresh.companyName = oldData.companyName;
    if (typeof oldData.cash === 'number') fresh.cash = oldData.cash;
    if (oldData.time && typeof oldData.time === 'object') {
        fresh.time = { ...fresh.time, ...oldData.time };
    }
    if (typeof oldData.isPaused === 'boolean') fresh.isPaused = oldData.isPaused;
    if (typeof oldData.gameSpeed === 'number') fresh.gameSpeed = oldData.gameSpeed;
    // research v1 (activeId/progress) diabaikan — schema baru
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
        const milestone = {
            id,
            year: t.currentYear,
            month: t.currentMonth,
            day: t.currentDay,
            text
        };
        this.data.milestones.push(milestone);
        if (this.data.milestones.length > BALANCE.maxMilestones) {
            this.data.milestones.shift();
        }
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

    // ============== SERIALISASI ==============
    serialize() { return JSON.parse(JSON.stringify(this.data)); }

    hydrate(data) {
        if (!data || typeof data !== 'object') return false;

        // Tangani migrasi berdasarkan schemaVersion
        let incoming = data;
        if (!incoming.schemaVersion || incoming.schemaVersion < 2) {
            incoming = migrateV1toV2(incoming);
        }

        // Merge dengan default agar field baru tidak hilang
        const base = createInitialState(incoming.difficulty || DIFFICULTY.normal);
        this.data = {
            ...base,
            ...incoming,
            time:      { ...base.time,      ...(incoming.time || {}) },
            finance:   { ...base.finance,   ...(incoming.finance || {}) },
            team:      { ...base.team,      ...(incoming.team || {}) },
            research:  { ...base.research,  ...(incoming.research || {}) },
            os:        { ...base.os,        ...(incoming.os || {}) },
            products:  { ...base.products,  ...(incoming.products || {}) },
            market:    { ...base.market,    ...(incoming.market || {}) },
            events:    { ...base.events,    ...(incoming.events || {}) },
            quests:    { ...base.quests,    ...(incoming.quests || {}) },
            tutorial:  { ...base.tutorial,  ...(incoming.tutorial || {}) },
            settings:  { ...base.settings,  ...(incoming.settings || {}) }
        };
        bus.emit('state:hydrated', this.data);
        bus.emit('state:changed', this.data);
        return true;
    }

    reset(difficulty = DIFFICULTY.normal) {
        this.data = createInitialState(difficulty);
        bus.emit('state:changed', this.data);
    }

    // Utilitas: total gaji bulanan (dipakai EconomySystem & UI)
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
