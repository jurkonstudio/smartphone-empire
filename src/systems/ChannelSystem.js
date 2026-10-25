// FILE: src/systems/ChannelSystem.js  (BARU — kanal distribusi)
// ============================================================
// Mengelola kanal penjualan (operator, online, toko sendiri) di atas distributor/ritel baseline.
//
// Efek ke game (semuanya netral bila tidak ada kanal aktif, jadi save lama aman):
//   getReachFactor(p)  pengali permintaan = 1 + total bonus jangkauan kanal aktif
//   getRetention(p)    bagian harga yang diterima pemain (< 1 bila ada kanal berpotongan)
//   getMonthlyFixedCost()  biaya tetap bulanan -> dimasukkan EconomySystem ke pengeluaran
//
// Unit tambahan hasil bonus jangkauan semuanya lewat kanal itu: porsi unit kanal c = b_c / (1 + B).
// State di state.data.channels (dibuat otomatis).
// Event bus: channel:activated / channel:deactivated.
// ============================================================
import { bus } from '../core/EventBus.js';
import { LOG_TYPES } from '../config/constants.js';
import { ToastService } from '../core/ToastService.js';
import { LanguageService } from '../core/LanguageService.js';
import { WalletService } from './WalletService.js';
import { productInScope } from './EraEventSystem.js';
import {
    CHANNELS, getChannelById, channelReachAt, CHANNEL_SCALE_BASE, CHANNEL_SCALE_MAX, CHANNEL_REACH_CAP
} from '../data/channels.data.js';

function _abs(y, m) { return (Number(y) || 0) * 12 + (Number(m) || 1); }
function _lang() { try { return LanguageService.getLang() === 'id' ? 'id' : 'en'; } catch (e) { return 'en'; } }
function _L(o) { return o == null ? '' : (typeof o === 'string' ? o : (o[_lang()] || o.en || o.id || '')); }
function _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function _nice(v) { var a = Math.abs(v); var step = a >= 100000 ? 1000 : 100; return Math.round(a / step) * step; }
function _yearFrac(t) { return (Number(t.currentYear) || 2000) + ((Number(t.currentMonth) || 1) - 1) / 12; }

export function ensureChannelState(data) {
    if (!data.channels || typeof data.channels !== 'object') data.channels = {};
    var c = data.channels;
    if (!c.active || typeof c.active !== 'object') c.active = {};   // { [id]: { sinceAbs, lockUntilAbs } }
    if (!c.stats || typeof c.stats !== 'object') c.stats = {};      // { [id]: { units, gross, cut, mUnits, mCut } }
    if (!c.paid || typeof c.paid !== 'object') c.paid = {};         // { setup, monthly }
    if (typeof c.paid.setup !== 'number') c.paid.setup = 0;
    if (typeof c.paid.monthly !== 'number') c.paid.monthly = 0;
    return c;
}

export class ChannelSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        ensureChannelState(this.state.data);
        this._unsubs.push(bus.on('time:month-changed', () => this._onMonth()));
        this._unsubs.push(bus.on('state:hydrated', () => ensureChannelState(this.state.data)));
    }

    stop() { this._unsubs.forEach(u => u()); this._unsubs = []; }

    _onMonth() {
        var c = ensureChannelState(this.state.data);
        Object.keys(c.stats).forEach(function (id) { c.stats[id].mUnits = 0; c.stats[id].mCut = 0; });
    }

    // ---------------------------------------------------------------- biaya
    _scale() {
        var rh = (this.state.data.market && this.state.data.market.revenueHistory) || [];
        var sum = 0, n = 0;
        for (var i = 0; i < Math.min(3, rh.length); i++) { sum += Number(rh[i] && rh[i].playerRevenue) || 0; n++; }
        return _clamp((n ? sum / n : 0) / CHANNEL_SCALE_BASE, 1, CHANNEL_SCALE_MAX);
    }

    getSetupCost(id) { var d = getChannelById(id); return d ? _nice(d.setup * this._scale()) : 0; }
    getMonthlyCost(id) { var d = getChannelById(id); return d ? _nice(d.monthly * this._scale()) : 0; }

    // Dipanggil EconomySystem tiap bulan (masuk pengeluaran bulanan).
    getMonthlyFixedCost() {
        var c = ensureChannelState(this.state.data);
        var self = this, sum = 0;
        Object.keys(c.active).forEach(function (id) { sum += self.getMonthlyCost(id); });
        c.paid.monthly = (c.paid.monthly || 0) + sum;
        return sum;
    }

    // Perkiraan tanpa efek samping (untuk UI).
    previewMonthlyFixedCost() {
        var c = ensureChannelState(this.state.data), self = this, sum = 0;
        Object.keys(c.active).forEach(function (id) { sum += self.getMonthlyCost(id); });
        return sum;
    }

    // ---------------------------------------------------------------- status
    isUnlocked(id) { var d = getChannelById(id); return !!d && this.state.data.time.currentYear >= d.unlock; }
    isActive(id) { return !!ensureChannelState(this.state.data).active[id]; }

    lockMonthsLeft(id) {
        var a = ensureChannelState(this.state.data).active[id];
        if (!a) return 0;
        var t = this.state.data.time;
        return Math.max(0, a.lockUntilAbs - _abs(t.currentYear, t.currentMonth));
    }

    // ---------------------------------------------------------------- efek permintaan & pendapatan
    // Bonus jangkauan tiap kanal aktif untuk produk/konfigurasi p ({ price, config }).
    _bonuses(p) {
        var d = this.state.data, c = ensureChannelState(d);
        var yf = _yearFrac(d.time), out = [];
        Object.keys(c.active).forEach(function (id) {
            var def = getChannelById(id);
            if (!def) return;
            var b = channelReachAt(def, yf);
            (def.scopeBonus || []).forEach(function (sb) { if (p && productInScope(p, sb.scope, d)) b += sb.add; });
            out.push({ id: id, def: def, bonus: Math.max(0, b) });
        });
        // jepit total bonus
        var total = out.reduce(function (a, x) { return a + x.bonus; }, 0);
        if (total > CHANNEL_REACH_CAP) out.forEach(function (x) { x.bonus *= CHANNEL_REACH_CAP / total; });
        return out;
    }

    getReachFactor(p) {
        try {
            var list = this._bonuses(p);
            if (!list.length) return 1;
            return 1 + list.reduce(function (a, x) { return a + x.bonus; }, 0);
        } catch (e) { return 1; }
    }

    // Rincian untuk satu produk: porsi unit & retensi per kanal + retensi gabungan.
    getBreakdown(p) {
        var list = this._bonuses(p);
        var B = list.reduce(function (a, x) { return a + x.bonus; }, 0);
        var shares = list.map(function (x) {
            return { id: x.id, bonus: x.bonus, share: B > 0 ? x.bonus / (1 + B) : 0, retention: x.def.retention };
        });
        var retention = 1 - shares.reduce(function (a, s) { return a + s.share * (1 - s.retention); }, 0);
        return { reach: 1 + B, retention: _clamp(retention, 0.3, 1), channels: shares };
    }

    getRetention(p) {
        try {
            if (!this.previewHasActive()) return 1;
            return this.getBreakdown(p).retention;
        } catch (e) { return 1; }
    }

    previewHasActive() { return Object.keys(ensureChannelState(this.state.data).active).length > 0; }

    // Dicatat ProductSystem tiap penjualan harian (statistik untuk panel).
    recordSale(p, sold, gross, net) {
        try {
            if (!this.previewHasActive() || sold <= 0) return;
            var c = ensureChannelState(this.state.data);
            var bd = this.getBreakdown(p);
            var cutTotal = Math.max(0, gross - net);
            var cutWeight = bd.channels.reduce(function (a, s) { return a + s.share * (1 - s.retention); }, 0);
            bd.channels.forEach(function (s) {
                var st = c.stats[s.id] || (c.stats[s.id] = { units: 0, gross: 0, cut: 0, mUnits: 0, mCut: 0 });
                var u = sold * s.share;
                var cut = cutWeight > 0 ? cutTotal * (s.share * (1 - s.retention)) / cutWeight : 0;
                st.units += u; st.gross += u * (gross / sold); st.cut += cut;
                st.mUnits += u; st.mCut += cut;
            });
        } catch (e) { /* statistik tidak boleh menggagalkan penjualan */ }
    }

    // ---------------------------------------------------------------- aksi pemain
    activate(id) {
        var d = this.state.data, def = getChannelById(id);
        if (!def) return { ok: false, reason: 'invalid' };
        var c = ensureChannelState(d);
        if (c.active[id]) return { ok: false, reason: 'already' };
        if (d.time.currentYear < def.unlock) return { ok: false, reason: 'locked', year: def.unlock };
        var cost = this.getSetupCost(id);
        if (cost > 0) {
            if (!WalletService.canAfford(cost)) return { ok: false, reason: 'funds', cost: cost };
            WalletService.pay(cost, 'channel-setup:' + id);
        }
        var now = _abs(d.time.currentYear, d.time.currentMonth);
        c.active[id] = { sinceAbs: now, lockUntilAbs: now + def.lockMonths };
        c.paid.setup += cost;
        this.state.addLog((_lang() === 'id' ? 'Kanal distribusi dibuka: ' : 'Sales channel opened: ') + _L(def.name) + '.', LOG_TYPES.success);
        bus.emit('channel:activated', { id: id, cost: cost });
        bus.emit('state:changed', d);
        return { ok: true, cost: cost };
    }

    deactivate(id) {
        var d = this.state.data, c = ensureChannelState(d), def = getChannelById(id);
        if (!def || !c.active[id]) return { ok: false, reason: 'invalid' };
        var left = this.lockMonthsLeft(id);
        if (left > 0) return { ok: false, reason: 'lock', monthsLeft: left };
        delete c.active[id];
        this.state.addLog((_lang() === 'id' ? 'Kanal distribusi ditutup: ' : 'Sales channel closed: ') + _L(def.name) + '.', LOG_TYPES.info);
        bus.emit('channel:deactivated', { id: id });
        bus.emit('state:changed', d);
        return { ok: true };
    }

    // ---------------------------------------------------------------- ringkasan UI
    getSummary() {
        var d = this.state.data, c = ensureChannelState(d), self = this;
        var yf = _yearFrac(d.time);
        var cut = 0, units = 0;
        Object.keys(c.stats).forEach(function (id) { cut += c.stats[id].mCut || 0; units += c.stats[id].mUnits || 0; });
        return {
            monthlyFixed: this.previewMonthlyFixedCost(),
            monthCut: cut, monthUnits: units,
            paidSetup: c.paid.setup, paidMonthly: c.paid.monthly,
            channels: CHANNELS.map(function (def) {
                var st = c.stats[def.id] || {};
                return {
                    id: def.id, def: def,
                    unlocked: self.isUnlocked(def.id), active: self.isActive(def.id),
                    reachNow: channelReachAt(def, yf),
                    setupCost: self.getSetupCost(def.id), monthlyCost: self.getMonthlyCost(def.id),
                    lockLeft: self.lockMonthsLeft(def.id),
                    units: st.units || 0, cut: st.cut || 0, mUnits: st.mUnits || 0, mCut: st.mCut || 0
                };
            })
        };
    }
}

export { CHANNELS };
