// FILE: src/core/GameState.js
import { TIME_CONFIG } from '../config/time.config.js';
import { bus } from './EventBus.js';

// Struktur awal state — satu tempat untuk semua default
function createInitialState() {
    return {
        companyName: 'My Tech Co',
        cash: 100000,
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
        // Placeholder riset (diisi penuh di Fase 3)
        research: {
            activeId: null,
            progress: 0,                    // 0..1
            startedAtGameMinute: 0,
            completesAtGameMinute: 0
        }
    };
}

class GameState {
    constructor() {
        this.data = createInitialState();
    }

    get() { return this.data; }

    // Patch dangkal; emit state:changed
    patch(updates) {
        Object.assign(this.data, updates);
        bus.emit('state:changed', this.data);
    }

    // Perubahan uang dengan event khusus (untuk animasi count-up/down)
    setCash(newCash) {
        const prev = this.data.cash;
        if (prev === newCash) return;
        this.data.cash = newCash;
        bus.emit('state:cash-changed', { prev, next: newCash, delta: newCash - prev });
        bus.emit('state:changed', this.data);
    }

    addCash(delta) {
        this.setCash(this.data.cash + delta);
    }

    // Serialisasi untuk SaveService
    serialize() {
        return JSON.parse(JSON.stringify(this.data));
    }

    // Hidrasi dari save; merge dengan default agar field baru selalu ada
    hydrate(data) {
        if (!data || typeof data !== 'object') return false;
        const base = createInitialState();
        const merged = {
            ...base,
            ...data,
            time: { ...base.time, ...(data.time || {}) },
            research: { ...base.research, ...(data.research || {}) }
        };
        this.data = merged;
        bus.emit('state:hydrated', this.data);
        bus.emit('state:changed', this.data);
        return true;
    }

    reset() {
        this.data = createInitialState();
        bus.emit('state:changed', this.data);
    }
}

export const state = new GameState();
