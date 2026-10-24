// FILE: src/systems/EraEventSystem.js  (BARU — event pilihan 2000–2002)
// ============================================================
// Menjadwalkan event historis dengan pilihan (era-events.data.js), menyimpan
// keputusan pemain, dan menerapkan efeknya (kas, reputasi, permintaan sementara).
//
// State (memakai slot lama `events`, aman untuk save lama):
//   pending  id event yang sedang menunggu keputusan | null
//   queue    id event berikutnya (bila beberapa jatuh di bulan yang sama)
//   seen     id event yang sudah pernah dimunculkan (tidak muncul dua kali)
//   history  [{ eventId, choiceId, year, month }]
//   mods     [{ eventId, scope, mult, untilMinute }]  pengali permintaan aktif
//
// UI TIDAK ada di sini: sistem hanya memancarkan 'eraevent:pending'.
// Event bus: eraevent:pending / eraevent:resolved (lihat src/config/event.md).
// ============================================================
import { bus } from '../core/EventBus.js';
import { BALANCE } from '../data/balance.data.js';
import { getMacro } from '../core/MacroModel.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { LOG_TYPES } from '../config/constants.js';
import { ToastService } from '../core/ToastService.js';
import { LanguageService } from '../core/LanguageService.js';
import { WalletService } from './WalletService.js';
import { ERA_EVENTS, getEraEventById } from '../data/era-events.data.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;
const FACTOR_MIN = 0.6;
const FACTOR_MAX = 1.5;
const HISTORY_MAX = 60;

function _abs(y, m) { return (Number(y) || 0) * 12 + (Number(m) || 1); }
function _lang() { try { return LanguageService.getLang() === 'id' ? 'id' : 'en'; } catch (e) { return 'en'; } }
function _L(o) { return o == null ? '' : (typeof o === 'string' ? o : (o[_lang()] || o.en || o.id || '')); }
function _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Memastikan struktur state ada (save lama / hasil hydrate).
export function ensureEraEventState(data) {
    if (!data.events || typeof data.events !== 'object') data.events = {};
    var e = data.events;
    if (e.pending === undefined) e.pending = null;
    if (!Array.isArray(e.queue)) e.queue = [];
    if (!Array.isArray(e.seen)) e.seen = [];
    if (!Array.isArray(e.history)) e.history = [];
    if (!Array.isArray(e.mods)) e.mods = [];
    return e;
}

// Apakah produk termasuk cakupan (scope) pengali?
export function productInScope(p, scope, data) {
    if (!scope || scope === 'all') return true;
    var cfg = (p && p.config) || {};
    if (scope === 'color') return !!cfg.displayId && String(cfg.displayId).indexOf('scr_mono') !== 0;
    if (scope === 'camera') return !!cfg.cameraId && cfg.cameraId !== 'none';
    if (scope === 'budget' || scope === 'premium') {
        var ref = 150;
        try { ref = getMacro(data.time, BALANCE.macro).priceRef || ref; } catch (e) {}
        var price = Number(p && p.price) || 0;
        return scope === 'budget' ? price < ref * 0.9 : price > ref * 1.15;
    }
    return true;
}

// Pengali permintaan gabungan untuk satu produk. Fungsi murni; selalu angka aman.
// Dipanggil ProductSystem._computeDailyDemand.
export function getEraEventDemandFactor(data, product) {
    try {
        var mods = data && data.events && data.events.mods;
        if (!Array.isArray(mods) || !mods.length) return 1;
        var now = data.time.elapsedGameMinutes;
        var f = 1;
        for (var i = 0; i < mods.length; i++) {
            var m = mods[i];
            if (!m || m.untilMinute <= now) continue;
            if (!productInScope(product, m.scope, data)) continue;
            var mult = Number(m.mult);
            if (isFinite(mult) && mult > 0) f *= mult;
        }
        return _clamp(f, FACTOR_MIN, FACTOR_MAX);
    } catch (e) { return 1; }
}

export class EraEventSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
        this._announced = null; // id event yang sudah diumumkan ke UI (tidak disimpan)
    }

    start() {
        ensureEraEventState(this.state.data);
        this._unsubs.push(bus.on('time:month-changed', () => this._onMonth()));
        this._unsubs.push(bus.on('time:day-changed', () => this._onDay()));
        this._unsubs.push(bus.on('state:hydrated', () => { ensureEraEventState(this.state.data); this._announced = null; this._tryOpen(); }));
        this._onMonth(); // save dimuat di tengah jendela: langsung periksa
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    // ---------------------------------------------------------------- jadwal

    _canRun() {
        var d = this.state.data;
        if (d.gameOver) return false;
        var tu = d.tutorial;
        if (tu && !tu.completed && !tu.skipped) return false; // jangan ganggu tutorial
        return true;
    }

    _onMonth() {
        if (!this._canRun()) return;
        var d = this.state.data;
        var ev = ensureEraEventState(d);
        var now = _abs(d.time.currentYear, d.time.currentMonth);
        for (var i = 0; i < ERA_EVENTS.length; i++) {
            var def = ERA_EVENTS[i];
            if (ev.seen.indexOf(def.id) >= 0) continue;
            var from = _abs(def.at.year, def.at.month);
            var to = _abs(def.until.year, def.until.month);
            if (now < from) continue;
            ev.seen.push(def.id);               // lewat batas = hangus tanpa muncul
            if (now > to) continue;
            ev.queue.push(def.id);
        }
        this._tryOpen();
    }

    _onDay() {
        var ev = ensureEraEventState(this.state.data);
        var now = this.state.data.time.elapsedGameMinutes;
        var before = ev.mods.length;
        ev.mods = ev.mods.filter(m => m && m.untilMinute > now);
        if (ev.mods.length !== before) bus.emit('state:changed', this.state.data);
        if (this._canRun()) this._tryOpen();
    }

    // Ambil event berikutnya (bila tak ada yang menunggu) lalu umumkan ke UI.
    _tryOpen() {
        if (!this._canRun()) return;
        var ev = ensureEraEventState(this.state.data);
        if (!ev.pending && ev.queue.length) ev.pending = ev.queue.shift();
        if (!ev.pending) return;
        var def = getEraEventById(ev.pending);
        if (!def) { ev.pending = null; return; }
        if (this._announced === ev.pending) return;
        this._announced = ev.pending;
        bus.emit('eraevent:pending', { event: def });
    }

    // UI memanggil ini lagi bila modal tidak bisa dibuka (mis. modal lain terbuka).
    reannounce() { this._announced = null; this._tryOpen(); }

    // UI tak bisa menampilkan sekarang (modal lain terbuka): izinkan pengumuman ulang pada tick berikutnya.
    retryLater() { this._announced = null; }

    // UI memanggil ini setelah pemain menutup layar hasil: lanjut ke event antrean.
    advance() { this._tryOpen(); }

    getPending() {
        var ev = ensureEraEventState(this.state.data);
        return ev.pending ? getEraEventById(ev.pending) : null;
    }

    // ---------------------------------------------------------------- keputusan

    canChoose(eventId, choiceId) {
        var def = getEraEventById(eventId);
        var ch = def && def.choices.find(c => c.id === choiceId);
        if (!ch) return { ok: false, reason: 'invalid' };
        if (ch.cost > 0 && !WalletService.canAfford(ch.cost)) return { ok: false, reason: 'funds' };
        return { ok: true };
    }

    choose(eventId, choiceId) {
        var d = this.state.data;
        var ev = ensureEraEventState(d);
        if (ev.pending !== eventId) return { ok: false, reason: 'not-pending' };
        var def = getEraEventById(eventId);
        var ch = def && def.choices.find(c => c.id === choiceId);
        if (!ch) return { ok: false, reason: 'invalid' };

        if (ch.cost > 0) {
            if (!WalletService.canAfford(ch.cost)) return { ok: false, reason: 'funds' };
            WalletService.pay(ch.cost, 'era-event:' + eventId);
        }

        var fx = ch.effects || {};
        if (fx.cash) this.state.addCash(fx.cash);
        if (fx.reputation) this.state.addReputation(fx.reputation);
        if (Array.isArray(fx.demand)) {
            var now = d.time.elapsedGameMinutes;
            fx.demand.forEach(function (m) {
                ev.mods.push({
                    eventId: eventId, scope: m.scope || 'all', mult: m.mult,
                    untilMinute: now + Math.round((m.days || 0) * MINUTES_PER_DAY)
                });
            });
        }

        ev.history.push({ eventId: eventId, choiceId: choiceId, year: d.time.currentYear, month: d.time.currentMonth });
        if (ev.history.length > HISTORY_MAX) ev.history.splice(0, ev.history.length - HISTORY_MAX);
        ev.pending = null;
        this._announced = null;

        var title = _L(def.title), label = _L(ch.label);
        this.state.addLog((_lang() === 'id' ? 'Keputusan "' : 'Decision "') + title + '": ' + label + '.', LOG_TYPES.info);
        ToastService.success((_lang() === 'id' ? 'Keputusan diambil: ' : 'Decision made: ') + label);
        bus.emit('eraevent:resolved', { eventId: eventId, choiceId: choiceId, event: def, choice: ch });
        bus.emit('state:changed', d);
        return { ok: true, outcome: _L(ch.outcome), choice: ch };
    }

    // ---------------------------------------------------------------- bantu

    countResolved() { return ensureEraEventState(this.state.data).history.length; }
}

export { ERA_EVENTS };
