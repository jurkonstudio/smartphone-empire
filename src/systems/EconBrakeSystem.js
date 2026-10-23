// FILE: src/systems/EconBrakeSystem.js  (v2029.1)
// ============================================================
// EconBrakeSystem — penahan ekonomi supaya kas tidak menumpuk tanpa batas.
//
//   1. Biaya naik seiring volume  -> volumeMultiplier(qty), recordProduction(qty)
//   2. Permintaan dibatasi pasar  -> applyDemandCap(rawTotal)
//   3. Respons kompetitor         -> rivalResponse()
//   4. Sink dana                  -> buyEfficiency(), acquire(id) + upkeep bulanan
//
// Semua angka ada di BALANCE.econ. State disimpan di data.econ (dibuat lazy,
// jadi save lama tetap aman). Semua fungsi kebal NaN: input aneh -> nilai netral.
// ============================================================
import { bus } from '../core/EventBus.js';
import { BALANCE } from '../data/balance.data.js';
import { LOG_TYPES } from '../config/constants.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { getMacro } from '../core/MacroModel.js';
import { WalletService } from './WalletService.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;
const fin = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

export class EconBrakeSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        this._unsubs.push(bus.on('state:hydrated', () => this._e()));
        this._e();
    }
    stop() { this._unsubs.forEach(u => u()); this._unsubs = []; }

    // ---------- state ----------
    _e() {
        const d = this.state.data;
        if (!d.econ || typeof d.econ !== 'object') d.econ = {};
        const e = d.econ;
        if (!Array.isArray(e.prodLedger)) e.prodLedger = [];
        if (typeof e.effLevel !== 'number') e.effLevel = 0;
        if (!Array.isArray(e.acquired)) e.acquired = [];
        if (typeof e.lastAcqMinute !== 'number') e.lastAcqMinute = -1e12;
        if (typeof e.util !== 'number') e.util = 0;          // utilisasi plafon (EMA)
        if (typeof e.lastFactor !== 'number') e.lastFactor = 1; // faktor jenuh terakhir (1 = tak terpotong)
        if (typeof e.lastRaw !== 'number') e.lastRaw = 0;
        if (typeof e.lastEff !== 'number') e.lastEff = 0;
        if (typeof e.lastCap !== 'number') e.lastCap = 0;
        if (typeof e.spentInvest !== 'number') e.spentInvest = 0;
        return e;
    }
    _cfg() { return BALANCE.econ; }
    _cpi() { return fin(getMacro(this.state.data.time, BALANCE.macro).cpiIndex, 1); }
    _baseDemandPerDay() {
        const m = getMacro(this.state.data.time, BALANCE.macro);
        return Math.max(1, fin(m.baseDemand * m.demandCycle, 1));
    }

    // ============================================================
    // 1) BIAYA vs VOLUME
    // ============================================================
    _trailingUnits() {
        const e = this._e(), now = this.state.data.time.elapsedGameMinutes;
        const win = this._cfg().volume.windowDays * MINUTES_PER_DAY;
        e.prodLedger = e.prodLedger.filter(r => now - r.m <= win);
        return e.prodLedger.reduce((s, r) => s + fin(r.q, 0), 0);
    }
    recordProduction(qty) {
        const q = fin(qty, 0);
        if (q <= 0) return;
        this._e().prodLedger.push({ m: this.state.data.time.elapsedGameMinutes, q });
    }
    _slope() {
        const c = this._cfg();
        const cut = clamp(this._e().effLevel * c.efficiency.slopeCutPerLevel, 0, 0.9);
        return c.volume.slope * (1 - cut);
    }
    // Pengali biaya komponen untuk pesanan `qty` (>= 1.0 dan <= maxMult).
    volumeMultiplier(qty) {
        const c = this._cfg().volume;
        const q0 = Math.max(1, this._baseDemandPerDay() * c.refDemandShare);
        const x = (fin(qty, 0) + this._trailingUnits()) / q0;
        const raw = x > 1 ? 1 + this._slope() * Math.log2(x) : 1;
        const parts = 1 - clamp(this._e().effLevel * this._cfg().efficiency.partsCutPerLevel, 0, 0.5);
        return clamp(raw * parts, 0.5, c.maxMult);
    }

    // ============================================================
    // 2) PLAFON PASAR
    // ============================================================
    getCapacity() {
        const c = this._cfg().cap;
        const diff = this.state.data.difficulty;
        const mult = (c.mult[diff] !== undefined) ? c.mult[diff] : c.mult.normal;
        return this._baseDemandPerDay() * mult * (1 + this.getAcquisitionCapBonus());
    }
    // rawTotal = jumlah permintaan harian semua produk. Kembalian: faktor skala 0..1.
    applyDemandCap(rawTotal) {
        const e = this._e();
        const raw = Math.max(0, fin(rawTotal, 0));
        const cap = this.getCapacity();
        const p = this._cfg().cap.sharpness;
        let eff = raw;
        if (raw > 0 && cap > 0) eff = raw / Math.pow(1 + Math.pow(raw / cap, p), 1 / p);
        const factor = raw > 0 ? clamp(eff / raw, 0, 1) : 1;
        const sm = this._cfg().cap.smoothing;
        e.util = fin(e.util, 0) * sm + clamp(raw / cap, 0, 3) * (1 - sm);
        e.lastFactor = factor; e.lastRaw = Math.round(raw); e.lastEff = Math.round(eff); e.lastCap = Math.round(cap);
        return factor;
    }

    // ============================================================
    // 3) RESPONS KOMPETITOR
    // ============================================================
    // Pengali tekanan pada produk pemain: rival bereaksi saat pemain mendekati plafon.
    rivalResponse() {
        const r = this._cfg().rival;
        const u = fin(this._e().util, 0);
        if (u <= r.startUtil) return 1;
        const t = clamp((u - r.startUtil) / (1 - r.startUtil), 0, 1.5);
        return clamp(1 + r.gain * t, 1, r.maxMult);
    }
    // Bobot tekanan sebuah rival (diperkecil bila sudah diakuisisi).
    rivalWeight(compId) {
        return this._e().acquired.some(a => a.id === compId) ? this._cfg().acquisition.rivalPressureWeight : 1;
    }

    // ============================================================
    // 4a) SINK: INVESTASI EFISIENSI PABRIK
    // ============================================================
    getAvgMonthlyRevenue() {
        const n = this._cfg().revenueWindowMonths;
        const h = (this.state.data.finance.history || []).slice(0, n);
        if (!h.length) return 0;
        return h.reduce((s, x) => s + fin(x.income, 0), 0) / h.length;
    }
    _efficiencyCost(level) {
        const c = this._cfg().efficiency, i = level - 1;
        return Math.round(Math.max(c.floorCost[i] * this._cpi(), c.revMonths[i] * this.getAvgMonthlyRevenue()));
    }
    getEfficiencyInfo() {
        const c = this._cfg().efficiency, lv = this._e().effLevel;
        const next = lv < c.maxLevel ? lv + 1 : null;
        return {
            level: lv, maxLevel: c.maxLevel,
            nextLevel: next,
            nextCost: next ? this._efficiencyCost(next) : 0,
            upkeep: this._efficiencyUpkeep(),
            slopeNow: this._slope(),
            partsCutNow: lv * c.partsCutPerLevel
        };
    }
    _efficiencyUpkeep() {
        const lv = this._e().effLevel;
        return lv > 0 ? Math.round(this._efficiencyCost(lv) * this._cfg().efficiency.upkeepRate) : 0;
    }
    buyEfficiency() {
        const d = this.state.data, e = this._e(), info = this.getEfficiencyInfo();
        if (d.gameOver) return { ok: false, reason: 'Permainan sudah berakhir.' };
        if (!info.nextLevel) return { ok: false, reason: 'Investasi pabrik sudah level maksimum.' };
        if (!WalletService.canAfford(info.nextCost)) return { ok: false, reason: 'Uang tidak cukup. Butuh ' + money(info.nextCost) + '.' };
        const r = WalletService.pay(info.nextCost, 'econ-efficiency');
        if (!r.ok) return { ok: false, reason: r.reason || 'Pembayaran gagal.' };
        e.effLevel = info.nextLevel;
        e.spentInvest += info.nextCost;
        this.state.addLog('Investasi pabrik level ' + e.effLevel + ' selesai (' + money(info.nextCost) + '). Biaya produksi massal lebih landai.', LOG_TYPES.success);
        bus.emit('econ:efficiency-bought', { level: e.effLevel, cost: info.nextCost });
        bus.emit('state:changed', d);
        return { ok: true, level: e.effLevel, cost: info.nextCost };
    }

    // ============================================================
    // 4b) SINK: AKUISISI MEREK RIVAL
    // ============================================================
    getAcquisitionCapBonus() {
        return this._e().acquired.reduce((s, a) => s + fin(a.capBonus, 0), 0);
    }
    _acqPrice(share) {
        const a = this._cfg().acquisition;
        const annual = this.getAvgMonthlyRevenue() * 12;
        return Math.round(Math.max(a.floorCost * this._cpi(), annual * (a.annualRevBase + a.annualRevPerShare * fin(share, 0))));
    }
    getAcquisitionTargets() {
        const d = this.state.data, e = this._e();
        return (d.market.competitors || [])
            .filter(c => c && c.id && !e.acquired.some(a => a.id === c.id))
            .map(c => ({
                id: c.id, name: c.name, share: fin(c.share, 0),
                price: this._acqPrice(c.share),
                capBonus: this._cfg().acquisition.capBonusBase + this._cfg().acquisition.capBonusPerShare * fin(c.share, 0)
            }))
            .sort((a, b) => b.share - a.share);
    }
    // Alasan tidak bisa membeli saat ini (null = boleh).
    acquisitionBlockReason() {
        const a = this._cfg().acquisition, d = this.state.data, e = this._e();
        if (d.gameOver) return 'Permainan sudah berakhir.';
        if (d.time.currentYear < a.minYear) return 'Akuisisi baru dibuka tahun ' + a.minYear + '.';
        if (e.acquired.length >= a.maxOwned) return 'Batas akuisisi tercapai (' + a.maxOwned + ').';
        const wait = a.cooldownMonths * 30 * MINUTES_PER_DAY - (d.time.elapsedGameMinutes - e.lastAcqMinute);
        if (wait > 0) return 'Jeda integrasi: ' + Math.ceil(wait / (30 * MINUTES_PER_DAY)) + ' bulan lagi.';
        return null;
    }
    acquire(compId) {
        const d = this.state.data, e = this._e();
        const block = this.acquisitionBlockReason();
        if (block) return { ok: false, reason: block };
        const t = this.getAcquisitionTargets().find(x => x.id === compId);
        if (!t) return { ok: false, reason: 'Target tidak tersedia.' };
        if (!WalletService.canAfford(t.price)) return { ok: false, reason: 'Uang tidak cukup. Butuh ' + money(t.price) + '.' };
        const r = WalletService.pay(t.price, 'econ-acquisition');
        if (!r.ok) return { ok: false, reason: r.reason || 'Pembayaran gagal.' };
        e.acquired.push({
            id: t.id, name: t.name, price: t.price, capBonus: t.capBonus,
            year: d.time.currentYear, month: d.time.currentMonth
        });
        e.lastAcqMinute = d.time.elapsedGameMinutes;
        e.spentInvest += t.price;
        if (this.state.addReputation) this.state.addReputation(this._cfg().acquisition.reputation);
        this.state.addLog('Mengakuisisi ' + t.name + ' (' + money(t.price) + '). Plafon pasar +' + Math.round(t.capBonus * 100) + '%.', LOG_TYPES.success);
        bus.emit('econ:acquired', { id: t.id, name: t.name, price: t.price });
        bus.emit('state:changed', d);
        return { ok: true, target: t };
    }
    _acqUpkeep() {
        const rate = this._cfg().acquisition.upkeepRate;
        return Math.round(this._e().acquired.reduce((s, a) => s + fin(a.price, 0) * rate, 0));
    }

    // Biaya tetap bulanan dari semua sink (dibaca EconomySystem).
    getMonthlyUpkeep() {
        return this._efficiencyUpkeep() + this._acqUpkeep();
    }

    // Ringkasan untuk UI & telemetri.
    getSummary() {
        const e = this._e();
        return {
            capacityPerDay: Math.round(this.getCapacity()),
            utilization: Math.round(fin(e.util, 0) * 100) / 100,
            lastFactor: e.lastFactor,
            rivalMult: this.rivalResponse(),
            volumeMultNow: this.volumeMultiplier(0),
            trailingUnits: this._trailingUnits(),
            efficiencyLevel: e.effLevel,
            acquired: e.acquired.length,
            upkeep: this.getMonthlyUpkeep(),
            spentInvest: e.spentInvest
        };
    }
}
