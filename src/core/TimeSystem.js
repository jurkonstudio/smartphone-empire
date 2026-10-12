// FILE: src/core/TimeSystem.js
import { bus } from './EventBus.js';
import { TIME_CONFIG } from '../config/time.config.js';

// TimeSystem — SATU-SATUNYA pemaju waktu simulasi.
// Menggunakan requestAnimationFrame + delta time (bukan setInterval).
export class TimeSystem {
    constructor(gameState) {
        this.state = gameState;
        this._rafId = null;
        this._lastTs = null;
        this._lastTickEmit = 0;
        this._running = false;
        this._boundLoop = this._loop.bind(this);
        this._boundVis = this._handleVisibility.bind(this);
    }

    start() {
        if (this._running) return;
        this._running = true;
        document.addEventListener('visibilitychange', this._boundVis);
        this._rafId = requestAnimationFrame(this._boundLoop);
    }

    stop() {
        this._running = false;
        if (this._rafId !== null) cancelAnimationFrame(this._rafId);
        this._rafId = null;
        document.removeEventListener('visibilitychange', this._boundVis);
    }

    // Reset timestamp saat tab kembali terlihat agar tidak ada lompatan
    _handleVisibility() {
        if (document.visibilityState === 'visible') this._lastTs = null;
    }

    _loop(ts) {
        if (!this._running) return;
        if (this._lastTs === null) this._lastTs = ts;

        let dt = (ts - this._lastTs) / 1000;
        this._lastTs = ts;

        // Batas aman
        if (dt > TIME_CONFIG.maxDeltaSeconds) dt = TIME_CONFIG.maxDeltaSeconds;
        if (dt < 0) dt = 0;

        if (dt > 0 && !this.state.data.isPaused) {
            const minutesPerSecond =
                (TIME_CONFIG.minutesPerHour * TIME_CONFIG.hoursPerDay) /
                TIME_CONFIG.realSecondsPerGameDay;
            const gameMinutes = dt * minutesPerSecond * this.state.data.gameSpeed;
            if (gameMinutes > 0) this._advance(gameMinutes);
        }

        // Emit tick throttled (untuk update jam di header)
        if (ts - this._lastTickEmit >= TIME_CONFIG.tickEmitIntervalMs) {
            this._lastTickEmit = ts;
            bus.emit('time:tick', this.snapshot());
        }

        this._rafId = requestAnimationFrame(this._boundLoop);
    }

    _advance(gameMinutes) {
        const t = this.state.data.time;
        const pDay = t.currentDay, pMonth = t.currentMonth, pYear = t.currentYear;

        t.elapsedGameMinutes += gameMinutes;
        t.currentMinute += gameMinutes;

        while (t.currentMinute >= TIME_CONFIG.minutesPerHour) {
            t.currentMinute -= TIME_CONFIG.minutesPerHour;
            t.currentHour += 1;
        }
        while (t.currentHour >= TIME_CONFIG.hoursPerDay) {
            t.currentHour -= TIME_CONFIG.hoursPerDay;
            t.currentDay += 1;
        }
        while (t.currentDay > TIME_CONFIG.daysPerMonth) {
            t.currentDay -= TIME_CONFIG.daysPerMonth;
            t.currentMonth += 1;
        }
        while (t.currentMonth > TIME_CONFIG.monthsPerYear) {
            t.currentMonth -= TIME_CONFIG.monthsPerYear;
            t.currentYear += 1;
        }

        // Event kalender
        if (t.currentDay !== pDay || t.currentMonth !== pMonth || t.currentYear !== pYear) {
            bus.emit('time:day-changed', this.snapshot());
        }
        if (t.currentMonth !== pMonth || t.currentYear !== pYear) {
            bus.emit('time:month-changed', this.snapshot());
        }
        if (t.currentYear !== pYear) {
            bus.emit('time:year-changed', this.snapshot());
        }
    }

    snapshot() {
        const d = this.state.data;
        return {
            currentYear: d.time.currentYear,
            currentMonth: d.time.currentMonth,
            currentDay: d.time.currentDay,
            currentHour: d.time.currentHour,
            currentMinute: d.time.currentMinute,
            elapsedGameMinutes: d.time.elapsedGameMinutes,
            isPaused: d.isPaused,
            gameSpeed: d.gameSpeed
        };
    }

    togglePause() {
        this.state.data.isPaused = !this.state.data.isPaused;
        bus.emit('time:speed-changed', this.snapshot());
    }

    setSpeed(speed) {
        if (!TIME_CONFIG.speedOptions.includes(speed)) return;
        this.state.data.gameSpeed = speed;
        this.state.data.isPaused = false;
        bus.emit('time:speed-changed', this.snapshot());
    }

    cycleSpeed() {
        const opts = TIME_CONFIG.speedOptions;
        const idx = opts.indexOf(this.state.data.gameSpeed);
        this.setSpeed(opts[(idx + 1) % opts.length]);
    }

    // Utilitas untuk testing manual via console:
    //   window.__game.timeSystem.fastForwardDays(30)
    fastForwardDays(days) {
        const mins = days * TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;
        this._advance(mins);
        return this.snapshot();
    }
}
