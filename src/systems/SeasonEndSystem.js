// FILE: src/systems/SeasonEndSystem.js
// ============================================================
// SeasonEndSystem — akhir permainan (satu musim berakhir di endYear).
// Saat kalender masuk tahun setelah endYear:
//   1. skor akhir dihitung dari kekayaan bersih, milestone, produk, riset, dan staf;
//   2. data.gameOver diisi (mengunci ekonomi & bank seperti kebangkrutan);
//   3. waktu dihentikan dan event endgame:finished dikirim ke layar hasil.
// ============================================================
import { bus } from '../core/EventBus.js';
import { LOG_TYPES } from '../config/constants.js';
import { ENDGAME } from '../config/endgame.config.js';

// Fungsi murni: dipakai saat akhir musim dan bisa diuji tanpa UI.
export function computeSeasonScore(d) {
    const loans = (d.finance && d.finance.loans) || [];
    const debt = loans.reduce((sum, l) => sum + (l.remaining || 0), 0);
    const netWorth = (d.cash || 0) - debt;
    const w = ENDGAME.weights;

    const parts = {
        netWorth:   Math.max(0, Math.round(netWorth / 10000)),
        milestones: (d.milestones || []).length * w.milestone,
        products:   ((d.products && d.products.catalog) || []).length * w.product,
        research:   ((d.research && d.research.completed) || []).length * w.research,
        staff:      (d.staff || []).length * w.staff
    };
    parts.total = parts.netWorth + parts.milestones + parts.products + parts.research + parts.staff;
    return parts;
}

export class SeasonEndSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        this._unsubs.push(bus.on('time:year-changed', (snap) => this._onYearChanged(snap)));
        this._unsubs.push(bus.on('state:hydrated', () => this._checkLoaded()));
        this._checkLoaded();
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    _onYearChanged(snap) {
        if (snap.currentYear > ENDGAME.endYear) this._finish();
    }

    // Save yang sudah melewati batas (mis. dimuat ulang) langsung dianggap selesai.
    _checkLoaded() {
        const year = this.state.data.time && this.state.data.time.currentYear;
        if (year > ENDGAME.endYear) this._finish();
    }

    _finish() {
        const data = this.state.data;
        if (data.gameOver) return;

        const parts = computeSeasonScore(data);
        data.gameOver = {
            reason: 'season_end',
            year: ENDGAME.endYear,
            month: 12,
            score: parts.total,
            breakdown: parts
        };
        data.isPaused = true;

        this.state.addLog(
            'Musim ' + ENDGAME.endYear + ' berakhir. Skor akhir: ' + parts.total + '.',
            LOG_TYPES.success
        );
        bus.emit('endgame:finished', {
            score: parts.total,
            breakdown: parts,
            companyName: data.companyName
        });
        bus.emit('state:changed', data);
    }
}
