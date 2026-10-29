// FILE: src/systems/HypeCycleSystem.js  (REPLACE — v2)
// ============================================================
// Siklus hype untuk seri flagship tahunan.
//   - Aturan satu flagship per tahun kalender (checkFlagshipSlot).
//   - Antisipasi: stok poin yang naik saat peluncuran, teaser, dan kebocoran,
//     lalu meluruh per bulan. Menambah permintaan produk (getDemandFactor).
//   - v2: lonjakan peluncuran & isi kebocoran dihitung dari kualitas produk:
//     stabilitas OS sendiri, bug OS aktif, keunggulan chip sendiri (computeTechEdge),
//     dan sinergi OS + chip sendiri. Produk pihak ketiga tetap bisa dipakai, lonjakannya lebih kecil.
// Sumber OS & chip disuntik lewat setSources({ os, chip }).
// Disimpan di state.data.hype (aman untuk simpanan lama: diisi bila belum ada).
// ============================================================
import { bus } from '../core/EventBus.js';
import { LOG_TYPES } from '../config/constants.js';
import { HYPE_BALANCE as H, HYPE_QUALITY as Q } from '../data/hype.data.js';
import { computeTechEdge } from '../data/research.data.js';
import { isDesignChipId } from '../data/chip-design-registry.js';

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export class HypeCycleSystem {
    constructor(gameState, rng) {
        this.state = gameState;
        this._rng = rng || Math.random;
        this._src = { os: null, chip: null };
        this._unsub = bus.on('time:month-changed', () => this._onMonth());
    }

    setSources(src) { this._src = Object.assign({ os: null, chip: null }, src || {}); }

    _h() {
        var d = this.state.data;
        if (!d.hype) d.hype = { anticipation: 0, lastFlagshipYear: null, lastFlagshipMonth: null, lastSpike: 0 };
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

    _activeBugs() {
        var bugs = (this.state.data.os && this.state.data.os.bugs) || [];
        return bugs.filter(function (b) { return b.status === 'active'; }).length;
    }

    _osStability() {
        var os = this._src.os;
        var cs = os && typeof os.getCurrentStats === 'function' ? os.getCurrentStats() : null;
        return cs && typeof cs.stability === 'number' ? cs.stability : 50;
    }

    // Menilai kualitas sebuah produk (desain dikembangkan atau yang baru dirilis).
    assessProduct(p) {
        var cfg = (p && p.config) || {};
        var year = this.state.data.time.currentYear;
        var ownOs = typeof cfg.osOptionId === 'string' && cfg.osOptionId.indexOf('own:') === 0;
        var ownChip = isDesignChipId(cfg.chipId);
        var levels = p && p.techSnapshot ? p.techSnapshot.levels : null;
        var edge = levels ? computeTechEdge(levels, year).factor : 1;
        var bugs = ownOs ? Math.min(Q.maxBugs, this._activeBugs()) : 0;

        var osF = ownOs
            ? clamp((this._osStability() - 50) / Q.osStabilityScale, -Q.osMax, Q.osMax) - Q.bugPenalty * bugs
            : Q.thirdPartyOsPenalty;
        var chipF = ownChip ? clamp(edge - 1, -Q.chipMax, Q.chipMax) : Q.thirdPartyChipPenalty;
        var synergy = ownOs && ownChip ? Q.synergy : 0;
        var mult = clamp(1 + osF + chipF + synergy, Q.minSpikeMult, Q.maxSpikeMult);
        return { ownOs: ownOs, ownChip: ownChip, osF: osF, chipF: chipF, synergy: synergy, mult: mult, bugs: bugs, edge: edge };
    }

    // Dipanggil saat seri flagship dirilis. p = produk yang dirilis (punya config & techSnapshot).
    onFlagshipReleased(p) {
        var t = this.state.data.time;
        var h = this._h();
        h.lastFlagshipYear = t.currentYear;
        h.lastFlagshipMonth = t.currentMonth;

        var a = this.assessProduct(p);
        var spike = H.launchSpike * a.mult;
        h.lastSpike = Math.round(spike * 10) / 10;

        var text;
        if (a.bugs > 0) text = 'Peluncuran flagship dibayangi bug OS yang belum diperbaiki.';
        else if (a.mult >= 1.05) text = 'Peluncuran flagship disambut antusias.';
        else text = 'Peluncuran flagship: antusiasme publik naik.';
        this._add(spike, text);
    }

    _add(points, text) {
        var h = this._h();
        h.anticipation = Math.max(0, Math.min(H.maxAnticipation, h.anticipation + points));
        if (text) this.state.addLog(text, LOG_TYPES.info);
    }

    _devAssess() {
        var dev = this.state.data.products && this.state.data.products.development;
        return dev ? this.assessProduct(dev) : null;
    }

    // Dipanggil tiap bulan oleh time:month-changed.
    _onMonth() {
        var h = this._h();
        h.anticipation = h.anticipation * H.decayPerMonth;
        if (h.anticipation < H.minKeep) h.anticipation = 0;
        if (h.lastFlagshipYear == null) return;

        var t = this.state.data.time;
        var since = (t.currentYear * 12 + t.currentMonth) - (h.lastFlagshipYear * 12 + h.lastFlagshipMonth);
        var a = this._devAssess();

        if (since === H.teaserMonth) {
            var strength = !a ? Q.teaserNoDevFactor : ((a.ownChip || a.ownOs) ? 1 : Q.teaserThirdPartyFactor);
            if (strength >= 1) this._add(H.teaserPoints, 'Teaser flagship berikutnya mulai beredar.');
            else this._add(H.teaserPoints * strength, 'Teaser tipis, belum banyak yang bisa dibocorkan.');
        }

        if (since === H.leakMonth) {
            var pPos = H.leakChance;
            if (a) {
                if (a.ownChip && a.edge > 1) pPos += Q.leakChipBonus;
                if (a.bugs > 0) pPos -= Q.leakBugPenalty;
            }
            pPos = clamp(pPos, Q.leakMin, Q.leakMax);
            if (this._rng() < pPos) {
                this._add(H.leakPositive, a && a.ownChip && a.edge > 1
                    ? 'Bocoran chip sendiri beredar: performanya disebut unggul.'
                    : 'Kebocoran spesifikasi flagship beredar.');
            } else {
                this._add(-H.leakNegative, a && a.bugs > 0
                    ? 'Bocoran menyebut bug OS belum tuntas.'
                    : 'Kebocoran flagship memicu spekulasi negatif.');
            }
        }
    }

    destroy() { if (this._unsub) this._unsub(); }
}
