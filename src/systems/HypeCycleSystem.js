// FILE: src/systems/HypeCycleSystem.js  (BARU)
// ============================================================
// Siklus hype untuk seri flagship tahunan.
//   - Aturan satu flagship per tahun kalender (checkFlagshipSlot).
//   - Antisipasi: stok poin yang naik saat peluncuran, teaser, dan kebocoran,
//     lalu meluruh per bulan. Menambah permintaan produk (getDemandFactor).
// Disimpan di state.data.hype (aman untuk simpanan lama: diisi bila belum ada).
// ============================================================
import { bus } from '../core/EventBus.js';
import { LOG_TYPES } from '../config/constants.js';
import { HYPE_BALANCE as H } from '../data/hype.data.js';

export class HypeCycleSystem {
    constructor(gameState, rng) {
        this.state = gameState;
        this._rng = rng || Math.random;
        this._unsub = bus.on('time:month-changed', () => this._onMonth());
    }

    _h() {
        var d = this.state.data;
        if (!d.hype) d.hype = { anticipation: 0, lastFlagshipYear: null, lastFlagshipMonth: null };
        return d.hype;
    }

    getAnticipation() { return this._h().anticipation || 0; }

    // Pengali permintaan dari antisipasi (1 = tanpa bonus).
    getDemandFactor() {
        return 1 + Math.min(H.maxDemandBonus, this.getAnticipation() * H.demandPerPoint);
    }

    // Satu flagship per tahun kalender.
    checkFlagshipSlot() {
        var h = this._h();
        var y = this.state.data.time.currentYear;
        if (h.lastFlagshipYear === y) {
            return { ok: false, reason: 'Flagship tahun ' + y + ' sudah dirilis. Rilis berikutnya bisa di tahun ' + (y + 1) + '.' };
        }
        return { ok: true };
    }

    // Dipanggil saat seri flagship dirilis.
    onFlagshipReleased() {
        var t = this.state.data.time;
        var h = this._h();
        h.lastFlagshipYear = t.currentYear;
        h.lastFlagshipMonth = t.currentMonth;
        this._add(H.launchSpike, 'Peluncuran flagship: antusiasme publik melonjak.');
    }

    _add(points, text) {
        var h = this._h();
        h.anticipation = Math.max(0, Math.min(H.maxAnticipation, h.anticipation + points));
        if (text) this.state.addLog(text, LOG_TYPES.info);
    }

    // Dipanggil tiap bulan oleh time:month-changed.
    _onMonth() {
        var h = this._h();
        h.anticipation = h.anticipation * H.decayPerMonth;
        if (h.anticipation < H.minKeep) h.anticipation = 0;
        if (h.lastFlagshipYear == null) return;

        var t = this.state.data.time;
        var since = (t.currentYear * 12 + t.currentMonth) - (h.lastFlagshipYear * 12 + h.lastFlagshipMonth);
        if (since === H.teaserMonth) {
            this._add(H.teaserPoints, 'Teaser flagship berikutnya mulai beredar.');
        }
        if (since === H.leakMonth) {
            if (this._rng() < H.leakChance) this._add(H.leakPositive, 'Kebocoran spesifikasi flagship beredar.');
            else this._add(-H.leakNegative, 'Kebocoran flagship memicu spekulasi negatif.');
        }
    }

    destroy() { if (this._unsub) this._unsub(); }
}
