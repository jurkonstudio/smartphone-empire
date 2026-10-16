// FILE: src/core/TimeSystem.js
import { bus } from './EventBus.js';
import { TIME_CONFIG } from '../config/time.config.js';

// ============================================================
// Utilitas kalender
// ============================================================
export function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

export function getDaysInMonth(year, month) {
    // month: 1-12
    const m = TIME_CONFIG.months[month - 1];
    if (!m) return 30;
    if (m.days === 28 && isLeapYear(year)) return 29;
    return m.days;
}

export function getMonthName(month, short) {
    const m = TIME_CONFIG.months[month - 1];
    if (!m) return 'Bulan ' + month;
    return short ? m.short : m.name;
}

export function formatDate(year, month, day, opts) {
    const short = opts && opts.short;
    return day + ' ' + getMonthName(month, short) + ' ' + year;
}

// ============================================================
// TimeSystem
// ============================================================
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
        this._sanitizeBoost();
        document.addEventListener('visibilitychange', this._boundVis);
        this._rafId = requestAnimationFrame(this._boundLoop);
    }

    stop() {
        this._running = false;
        if (this._rafId !== null) cancelAnimationFrame(this._rafId);
        this._rafId = null;
        document.removeEventListener('visibilitychange', this._boundVis);
    }

    // Kecepatan > 1x hanya sah bila ada boost berbayar yang masih aktif.
    // Mencegah save lama / cloud sync membawa 10x gratis.
    _sanitizeBoost() {
        const d = this.state.data;
        const b = d.speedBoost;
        const valid = b && typeof b.speed === 'number' && b.speed > 1 && b.remainingSec > 0;
        if (valid) {
            if (d.gameSpeed !== b.speed) d.gameSpeed = b.speed;
        } else {
            if (b) d.speedBoost = null;
            if (d.gameSpeed !== 1) d.gameSpeed = 1;
        }
    }

    getBoost() {
        const b = this.state.data.speedBoost;
        if (!b || !(b.remainingSec > 0) || !(b.speed > 1)) return null;
        return { speed: b.speed, remainingSec: b.remainingSec };
    }

    // Dipanggil SiliconService setelah SIL dibayar.
    activateBoost(speed, remainingSec) {
        if (!TIME_CONFIG.speedOptions.includes(speed) || speed <= 1) return;
        const d = this.state.data;
        d.speedBoost = { speed: speed, remainingSec: remainingSec };
        d.gameSpeed = speed;
        d.isPaused = false;
        bus.emit('time:speed-changed', this.snapshot());
    }

    clearBoost(reason) {
        const d = this.state.data;
        d.speedBoost = null;
        d.gameSpeed = 1;
        bus.emit('time:speed-changed', this.snapshot());
        if (reason === 'expired') bus.emit('time:boost-expired', this.snapshot());
    }

    _handleVisibility() {
        if (document.visibilityState === 'visible') this._lastTs = null;
    }

    _loop(ts) {
        if (!this._running) return;
        if (this._lastTs === null) this._lastTs = ts;

        let dt = (ts - this._lastTs) / 1000;
        this._lastTs = ts;

        if (dt > TIME_CONFIG.maxDeltaSeconds) dt = TIME_CONFIG.maxDeltaSeconds;
        if (dt < 0) dt = 0;

        // Jaga-jaga: kecepatan > 1x tanpa boost aktif → balik ke 1x.
        if (this.state.data.gameSpeed > 1 && !this.getBoost()) this._sanitizeBoost();

        if (dt > 0 && !this.state.data.isPaused) {
            // Hitung mundur boost (detik nyata, hanya saat game berjalan).
            const b = this.state.data.speedBoost;
            if (b && b.remainingSec > 0) {
                b.remainingSec -= dt;
                if (b.remainingSec <= 0) this.clearBoost('expired');
            }
            const minutesPerSecond =
                (TIME_CONFIG.minutesPerHour * TIME_CONFIG.hoursPerDay) /
                TIME_CONFIG.realSecondsPerGameDay;
            const gameMinutes = dt * minutesPerSecond * this.state.data.gameSpeed;
            if (gameMinutes > 0) this._advance(gameMinutes);
        }

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

        // Rollover hari -> bulan -> tahun menggunakan kalender realistis
        let daysThisMonth = getDaysInMonth(t.currentYear, t.currentMonth);
        while (t.currentDay > daysThisMonth) {
            t.currentDay -= daysThisMonth;
            t.currentMonth += 1;
            if (t.currentMonth > TIME_CONFIG.monthsPerYear) {
                t.currentMonth = 1;
                t.currentYear += 1;
            }
            daysThisMonth = getDaysInMonth(t.currentYear, t.currentMonth);
        }

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

    // Kecepatan > 1x TIDAK bisa diset langsung: harus lewat SiliconService.buySpeed().
    // Hanya 1x yang diizinkan di sini (membatalkan boost yang sedang berjalan).
    setSpeed(speed) {
        if (speed !== 1) return;
        this.clearBoost('manual');
        this.state.data.isPaused = false;
    }

    // Tombol ⏩ / tombol F: buka panel percepatan (didengarkan oleh SilSpeedBar.js).
    cycleSpeed() {
        bus.emit('sil:open-speed', this.snapshot());
    }

    // Untuk testing manual via console:
    //   __game.cheat.skipDays(30)
    fastForwardDays(days) {
        const mins = days * TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;
        this._advance(mins);
        return this.snapshot();
    }
}
