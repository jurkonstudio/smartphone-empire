import { bus } from './EventBus.js';
import { TIME_CONFIG } from '../config/time.config.js';

// ============================================================
// TimeSystem — Sumber waktu global tunggal.
// Satu-satunya entitas yang boleh memajukan waktu simulasi.
// Menggunakan requestAnimationFrame (otomatis berhenti di background).
// ============================================================
export class TimeSystem {
    constructor(gameState) {
        this.state = gameState;
        this.lastRealTimestamp = null;
        this.rafId = null;
        this.lastTickEmitMs = 0;
        this._boundTick = this._tick.bind(this);
        this._boundVisibility = this._handleVisibility.bind(this);
    }

    start() {
        if (this.rafId !== null) return;
        document.addEventListener('visibilitychange', this._boundVisibility);
        this.rafId = requestAnimationFrame(this._boundTick);
        console.info('[TimeSystem] Started. Initial paused:', this.state.data.isPaused);
    }

    stop() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        document.removeEventListener('visibilitychange', this._boundVisibility);
    }

    _handleVisibility() {
        // Reset timestamp agar tidak ada lompatan waktu saat tab kembali aktif
        if (document.visibilityState === 'visible') {
            this.lastRealTimestamp = null;
        }
    }

    _tick(timestamp) {
        if (this.lastRealTimestamp === null) {
            this.lastRealTimestamp = timestamp;
        }
        let deltaSeconds = (timestamp - this.lastRealTimestamp) / 1000;
        this.lastRealTimestamp = timestamp;

        // Batasi delta untuk mencegah lompatan besar (mis. tab berpindah frame)
        if (deltaSeconds > TIME_CONFIG.maxDeltaSeconds) {
            deltaSeconds = TIME_CONFIG.maxDeltaSeconds;
        }
        if (deltaSeconds < 0) deltaSeconds = 0;

        const data = this.state.data;
        if (!data.isPaused && deltaSeconds > 0) {
            const minutesPerRealSecond =
                (TIME_CONFIG.minutesPerHour * TIME_CONFIG.hoursPerDay) /
                TIME_CONFIG.realSecondsPerGameDay;
            const gameMinutes = deltaSeconds * minutesPerRealSecond * data.gameSpeed;
            this._advanceTime(gameMinutes);
        }

        // Emit time:tick secara throttle untuk progress bar masa depan
        if (timestamp - this.lastTickEmitMs >= TIME_CONFIG.tickEmitIntervalMs) {
            this.lastTickEmitMs = timestamp;
            bus.emit('time:tick', this.getSnapshot());
        }

        this.rafId = requestAnimationFrame(this._boundTick);
    }

    _advanceTime(gameMinutes) {
        if (!(gameMinutes > 0)) return;
        const time = this.state.data.time;
        const prevDay = time.currentDay;
        const prevMonth = time.currentMonth;
        const prevYear = time.currentYear;

        time.elapsedGameMinutes += gameMinutes;
        time.currentMinute += gameMinutes;

        // Cascade minute → hour → day → month → year
        while (time.currentMinute >= TIME_CONFIG.minutesPerHour) {
            time.currentMinute -= TIME_CONFIG.minutesPerHour;
            time.currentHour += 1;
        }
        while (time.currentHour >= TIME_CONFIG.hoursPerDay) {
            time.currentHour -= TIME_CONFIG.hoursPerDay;
            time.currentDay += 1;
        }
        while (time.currentDay > TIME_CONFIG.daysPerMonth) {
            time.currentDay -= TIME_CONFIG.daysPerMonth;
            time.currentMonth += 1;
        }
        while (time.currentMonth > TIME_CONFIG.monthsPerYear) {
            time.currentMonth -= TIME_CONFIG.monthsPerYear;
            time.currentYear += 1;
        }

        // Emit event (hanya jika benar-benar berubah)
        if (time.currentDay !== prevDay ||
            time.currentMonth !== prevMonth ||
            time.currentYear !== prevYear) {
            bus.emit('time:day-changed', this.getSnapshot());
        }
        if (time.currentMonth !== prevMonth || time.currentYear !== prevYear) {
            bus.emit('time:month-changed', this.getSnapshot());
        }
        if (time.currentYear !== prevYear) {
            bus.emit('time:year-changed', this.getSnapshot());
        }
    }

    getSnapshot() {
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

    setPaused(paused) {
        this.state.data.isPaused = !!paused;
        bus.emit('time:speed-changed', this.getSnapshot());
    }

    togglePause() {
        this.setPaused(!this.state.data.isPaused);
    }

    setSpeed(speed) {
        const valid = TIME_CONFIG.speedOptions.includes(speed);
        if (!valid) return;
        this.state.data.gameSpeed = speed;
        this.state.data.isPaused = false;
        bus.emit('time:speed-changed', this.getSnapshot());
    }

    cycleSpeed() {
        const options = TIME_CONFIG.speedOptions;
        const current = this.state.data.gameSpeed;
        const idx = options.indexOf(current);
        const next = options[(idx + 1) % options.length];
        this.setSpeed(next);
    }

    // ============================================================
    // Untuk keperluan tes manual dari console browser:
    //   window.__game.timeSystem.fastForwardDays(30)
    // Memajukan waktu tanpa menunggu waktu nyata.
    // ============================================================
    fastForwardDays(days) {
        const minutes = days * TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;
        this._advanceTime(minutes);
        console.info(`[TimeSystem] Fast-forward ${days} hari. Sekarang:`, this.getSnapshot());
    }
}
