// FILE: src/systems/RegistrySystem.js  (BARU)
// ============================================================
// Registry (tahap 2): pemain melamar ekstensi domain sendiri.
// Alur: lamar (+ sponsor) -> evaluasi 12 bln -> [keberatan] -> [kontensi: lelang / mundur] -> kontrak -> uji teknis
//       -> sunrise -> landrush -> pendaftaran umum. Semua angka di src/data/registry.data.js, teks di i18n (registry.*, registrar.letter.tld_*).
// State baru (otomatis, save lama aman): data.registry. Pemain TIDAK melihat persen; getRegistryOutlook() hanya tingkat + alasan.
// ============================================================
import { bus } from '../core/EventBus.js';
import { LOG_TYPES } from '../config/constants.js';
import { REGISTRY_CONFIG as C, REGISTRY_EXTENSIONS } from '../data/registry.data.js';
import { getTotalDomainsMillions } from '../data/registrar.data.js';
import { ensureRegistrarState, absMonth, sendIcannLetter } from './RegistrarSystem.js';

function _clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function _num(v) { v = Number(v); return isFinite(v) ? v : 0; }
function _usd(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
function _year(data) { return (data && data.time && data.time.currentYear) || 0; }
function _dayNow(data) {
    var tm = (data && data.time) || {};
    if (isFinite(tm.elapsedGameMinutes) && tm.elapsedGameMinutes > 0) return Math.floor(tm.elapsedGameMinutes / 1440);
    return (tm.currentYear || 0) * 372 + ((tm.currentMonth || 1) - 1) * 31 + (tm.currentDay || 1);
}
function _ext(id) { return REGISTRY_EXTENSIONS.find(function (e) { return e.id === id; }) || null; }

export function ensureRegistryState(data) {
    if (!data.registry || typeof data.registry !== 'object') data.registry = {};
    var g = data.registry;
    if (!g.app || typeof g.app !== 'object') g.app = null;
    if (!Array.isArray(g.live)) g.live = [];
    g.cooldownUntil = _num(g.cooldownUntil);
    g.earned = _num(g.earned);
    g.last = g.last && typeof g.last === 'object' ? g.last : { revenue: 0, profit: 0, domains: 0 };
    if (!g.draft || typeof g.draft !== 'object') g.draft = {};
    g.draft.ext = _ext(g.draft.ext) ? g.draft.ext : null;
    g.draft.sponsors = _clamp(Math.round(_num(g.draft.sponsors)), 0, C.sponsorMax);
    return g;
}

export function isRegistryOpen(data) { return _year(data) >= C.unlockYear; }

// ---------- Peluang (disembunyikan) ----------
export function computeEvalChance(data, sponsors) {
    var p = Math.min(C.evalSponsorCap, C.evalBase + C.evalPerSponsor * _clamp(sponsors || 0, 0, C.sponsorMax));
    if (_num(data.cash) >= C.evalCashMult * C.applicationFee) p += C.evalCashBonus;
    var acc = ensureRegistrarState(data).acc;
    if (acc && acc.status !== 'revoked' && absMonth(data) - acc.sinceAbs >= C.evalExpYears * 12) p += C.evalExpBonus;
    return Math.min(C.evalCap, p);
}
export function computeObjectChance(sponsors) { return Math.max(0, C.objectBase - C.objectPerSponsor * (sponsors || 0)); }

// Perkiraan peluang sampai peluncuran (lelang dianggap menang ~50%). Hanya untuk Asisten Bisnis.
export function estimateLaunchChance(data, extId, sponsors) {
    var e = _ext(extId); if (!e) return 0;
    var pe = computeEvalChance(data, sponsors), po = computeObjectChance(sponsors), pc = C.contention[e.type] || 0;
    return pe * (1 - po * (1 - C.objectWin)) * (1 - pc * 0.5);
}
export function getRegistryOutlook(data, extId, sponsors) {
    var p = estimateLaunchChance(data, extId, sponsors), e = _ext(extId), reasons = [];
    if ((sponsors || 0) < 2) reasons.push('sponsors');
    if (_num(data.cash) < C.evalCashMult * C.applicationFee) reasons.push('cash');
    if (e && (C.contention[e.type] || 0) >= 0.3) reasons.push('contest');
    var acc = ensureRegistrarState(data).acc;
    if (!(acc && acc.status !== 'revoked' && absMonth(data) - acc.sinceAbs >= C.evalExpYears * 12)) reasons.push('exp');
    return { level: p >= 0.75 ? 'high' : (p >= 0.55 ? 'medium' : 'low'), reasons: reasons };
}

export function getRegistryCost(sponsors) { return C.applicationFee + C.sponsorCost * (sponsors || 0); }

export function canStartRegistry(data) {
    var g = ensureRegistryState(data);
    if (!isRegistryOpen(data)) return { ok: false, reason: 'locked' };
    if (g.app) return { ok: false, reason: 'busy' };
    if (!g.draft.ext) return { ok: false, reason: 'pick' };
    if (g.live.some(function (x) { return x.id === g.draft.ext; })) return { ok: false, reason: 'owned' };
    if (absMonth(data) < g.cooldownUntil) return { ok: false, reason: 'cooldown', months: g.cooldownUntil - absMonth(data) };
    var need = getRegistryCost(g.draft.sponsors) + C.annualFee;
    if (_num(data.cash) < need) return { ok: false, reason: 'cash', need: need };
    return { ok: true };
}

// ---------- Aksi pemain ----------
export function pickExtension(state, id) {
    var g = ensureRegistryState(state.data);
    if (!_ext(id) || g.app) return { ok: false, reason: 'unavailable' };
    g.draft.ext = id; return { ok: true };
}
export function setSponsors(state, n) {
    var g = ensureRegistryState(state.data);
    if (g.app) return { ok: false, reason: 'unavailable' };
    g.draft.sponsors = _clamp(Math.round(_num(n)), 0, C.sponsorMax); return { ok: true };
}

function _addPre(app, n) {   // tambah bulan pra-kontrak, dibatasi maksimal 36
    var add = _clamp(n, 0, Math.max(0, C.maxMonths - app.pre));
    app.pre += add; return add;
}

export function submitRegistry(state) {
    var data = state.data, g = ensureRegistryState(data), chk = canStartRegistry(data);
    if (!chk.ok) return chk;
    var e = _ext(g.draft.ext), n = g.draft.sponsors;
    state.addCash(-getRegistryCost(n));
    var app = { id: e.id, ext: e.ext, type: e.type, sponsors: n, phase: 'eval', monthsLeft: C.evalMonths, pre: C.evalMonths, objected: false,
        revised: false, techRetried: false, npcBid: 0, deadline: 0, daysLeft: 0 };
    if (Math.random() < C.reviseChance) { app.revised = true; app.monthsLeft += _addPre(app, C.reviseMonths); }
    g.app = app;
    return { ok: true };
}

export function auctionBid(state, amount) {
    var data = state.data, g = ensureRegistryState(data), a = g.app;
    if (!a || a.phase !== 'contest') return { ok: false, reason: 'unavailable' };
    if (C.bidOptions.indexOf(amount) === -1) return { ok: false, reason: 'unknown' };
    if (_num(data.cash) < amount) return { ok: false, reason: 'cash', need: amount };
    if (amount >= a.npcBid) {
        state.addCash(-a.npcBid);
        var months = C.auctionMonthsMin + Math.floor(Math.random() * (C.auctionMonthsMax - C.auctionMonthsMin + 1));
        a.phase = 'auction'; a.monthsLeft = _addPre(a, months) || 1; a.deadline = 0;
        sendIcannLetter(data, 'tld_auction_won', { ext: a.ext, price: _usd(a.npcBid) }, null);
        return { ok: true, won: true };
    }
    g.app = null; g.cooldownUntil = absMonth(data) + C.reapplyAfterMonths;
    sendIcannLetter(data, 'tld_auction_rejected', { ext: a.ext }, null);
    return { ok: true, won: false };
}

export function withdrawRegistry(state) {
    var data = state.data, g = ensureRegistryState(data), a = g.app;
    if (!a || a.phase !== 'contest') return { ok: false, reason: 'unavailable' };
    var back = Math.round(C.applicationFee * C.withdrawRefund);
    state.addCash(back); g.app = null; g.cooldownUntil = absMonth(data) + C.reapplyAfterMonths;
    sendIcannLetter(data, 'tld_withdrawn', { ext: a.ext, refund: _usd(back) }, null);
    return { ok: true, refund: back };
}

export function signRegistry(state) {
    var data = state.data, g = ensureRegistryState(data), a = g.app;
    if (!a || a.phase !== 'offer') return { ok: false, reason: 'unavailable' };
    if (_num(data.cash) < C.annualFee) return { ok: false, reason: 'cash', need: C.annualFee };
    state.addCash(-C.annualFee);
    a.phase = 'tech'; a.monthsLeft = C.techMonths; a.deadline = 0;
    return { ok: true };
}

// ---------- Ringkasan untuk panel ----------
export function describeRegistry(data) {
    var g = ensureRegistryState(data), tm = data.time || {}, rep = _clamp(_num(data.market && data.market.reputation), 0, 100);
    var domains = 0, gross = 0;
    g.live.forEach(function (x) { domains += x.domains; gross += x.domains * C.types[x.type].price / 12; });
    var cost = g.live.length * (C.annualFee / 12 + C.opexMonthly);
    return { state: g, domains: Math.round(domains), gross: gross, cost: cost, net: gross - cost, count: g.live.length, rep: rep,
        worldM: getTotalDomainsMillions(_year(data), tm.currentMonth) };
}

// ---------- Sistem bulanan / harian ----------
export class RegistrySystem {
    constructor(state) {
        this.state = state;
        this._unsubs = [bus.on('time:month-changed', () => this._onMonth()), bus.on('time:day-changed', () => this._onDay())];
    }
    destroy() { this._unsubs.forEach(function (u) { try { u(); } catch (e) {} }); this._unsubs = []; }

    pick(id) { return pickExtension(this.state, id); }
    sponsors(n) { return setSponsors(this.state, n); }
    submit() { return submitRegistry(this.state); }
    bid(amount) { return auctionBid(this.state, amount); }
    withdraw() { return withdrawRegistry(this.state); }
    sign() { return signRegistry(this.state); }

    // Satu pintu untuk tombol UI (data-rg="tld-...").
    act(action, ds) {
        ds = ds || {};
        if (action === 'tld-pick') return this.pick(ds.rgId);
        if (action === 'tld-sponsors') return this.sponsors(parseInt(ds.rgN, 10) || 0);
        if (action === 'tld-submit') return this.submit();
        if (action === 'tld-bid') return this.bid(parseInt(ds.rgN, 10) || 0);
        if (action === 'tld-withdraw') return this.withdraw();
        if (action === 'tld-sign') return this.sign();
        return null;
    }

    _onDay() {
        var data = this.state.data; if (!data) return;
        var g = ensureRegistryState(data), a = g.app;
        if (!a || !(a.deadline > 0)) return;
        a.daysLeft = Math.max(0, a.deadline - _dayNow(data));
        if (a.daysLeft > 0) return;
        if (a.phase === 'contest') { withdrawRegistry(this.state); }     // tidak memutuskan tepat waktu = mundur (refund 70%)
        else if (a.phase === 'offer') {
            g.app = null; g.cooldownUntil = absMonth(data) + C.reapplyAfterMonths;
            sendIcannLetter(data, 'tld_offer_expired', { ext: a.ext }, null);
        }
    }

    _onMonth() {
        var data = this.state.data; if (!data) return;
        ensureRegistryState(data);
        try { this._app(data); } catch (e) {}
        try { this._live(data); } catch (e) {}
    }

    _reject(data, code, vars) {
        var g = data.registry, a = g.app;
        g.app = null; g.cooldownUntil = absMonth(data) + C.reapplyAfterMonths;
        sendIcannLetter(data, code, vars || { ext: a.ext, months: C.reapplyAfterMonths }, null);
    }

    _toContestOrOffer(data) {
        var g = data.registry, a = g.app, pc = C.contention[a.type] || 0;
        if (Math.random() < pc) {
            a.phase = 'contest'; a.monthsLeft = 0; a.deadline = _dayNow(data) + C.decideDays; a.daysLeft = C.decideDays;
            a.npcBid = Math.round(C.npcBidMin + Math.random() * (C.npcBidMax - C.npcBidMin));
            sendIcannLetter(data, 'tld_contention', { ext: a.ext, days: C.decideDays, refund: _usd(C.applicationFee * C.withdrawRefund) }, 'tld_contest');
        } else this._toOffer(data);
    }

    _toOffer(data) {
        var a = data.registry.app;
        a.phase = 'offer'; a.monthsLeft = 0; a.deadline = _dayNow(data) + C.offerDays; a.daysLeft = C.offerDays;
        sendIcannLetter(data, 'tld_offer', { ext: a.ext, days: C.offerDays, fee: _usd(C.annualFee) }, 'tld_offer');
    }

    _app(data) {
        var g = data.registry, a = g.app;
        if (!a || !(a.monthsLeft > 0)) return;
        a.monthsLeft -= 1;
        if (a.monthsLeft > 0) return;
        if (a.phase === 'eval') {
            if (Math.random() >= computeEvalChance(data, a.sponsors)) return this._reject(data, 'tld_eval_rejected');
            if (Math.random() < computeObjectChance(a.sponsors)) {
                a.objected = true; a.phase = 'objection'; a.monthsLeft = _addPre(a, C.objectMonths) || 1;
                sendIcannLetter(data, 'tld_objection', { ext: a.ext, months: C.objectMonths }, null);
                return;
            }
            return this._toContestOrOffer(data);
        }
        if (a.phase === 'objection') {
            if (Math.random() >= C.objectWin) return this._reject(data, 'tld_objection_rejected');
            return this._toContestOrOffer(data);
        }
        if (a.phase === 'auction') return this._toOffer(data);
        if (a.phase === 'tech') {
            if (!a.techRetried && Math.random() < C.techFail) {
                a.techRetried = true; a.monthsLeft = C.techRetryMonths;
                sendIcannLetter(data, 'tld_tech_retry', { ext: a.ext, months: C.techRetryMonths }, null);
                return;
            }
            g.live.push({ id: a.id, ext: a.ext, type: a.type, phase: 'sunrise', monthsLeft: C.sunriseMonths, domains: 0, sinceAbs: absMonth(data) });
            g.app = null;
            sendIcannLetter(data, 'tld_sunrise', { ext: a.ext, months: C.sunriseMonths }, null);
        }
    }

    _live(data) {
        var g = data.registry;
        if (!g.live.length) { g.last = { revenue: 0, profit: 0, domains: 0 }; return; }
        var rep = _clamp(_num(data.market && data.market.reputation), 0, 100), rf = 0.7 + 0.6 * rep / 100;
        g.live.forEach((x) => {
            if (x.sinceAbs === absMonth(data)) return;   // bulan peluncuran: fase baru mulai bulan depan
            var T = C.types[x.type], target = T.cap * C.economyScale;
            if (x.phase === 'sunrise') {
                x.domains = target * C.sunriseFrac;
                if (--x.monthsLeft <= 0) { x.phase = 'landrush'; x.monthsLeft = C.landrushMonths; sendIcannLetter(data, 'tld_landrush', { ext: x.ext }, null); }
            } else if (x.phase === 'landrush') {
                x.domains = target * C.landrushFrac;
                if (--x.monthsLeft <= 0) {
                    x.phase = 'general';
                    sendIcannLetter(data, 'tld_live', { ext: x.ext }, null);
                    if (T.repGain) { try { this.state.addReputation(T.repGain); } catch (e) {} }
                }
            } else {
                x.domains = Math.min(target, x.domains + (target - x.domains) * T.growth * rf);
            }
        });
        var d = describeRegistry(data), net = Math.round(d.net);
        if (net) this.state.addCash(net);
        g.earned += net;
        g.last = { revenue: Math.round(d.gross), profit: net, domains: d.domains };
        try {
            bus.emit('economy:add-revenue', { amount: Math.round(d.gross) });
            bus.emit('economy:add-cogs', { amount: Math.round(d.cost) });
        } catch (e) {}
    }
}
