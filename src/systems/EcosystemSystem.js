// FILE: src/systems/EcosystemSystem.js  (BARU — ekosistem: aksesori & App Store)
// ============================================================
// Lini aksesori (earbuds, jam pintar, charger) dijual ke seluruh basis ponsel aktif milik pemain.
// App Store memberi komisi bulanan dari pengguna OS yang aktif (butuh fitur fw_appstore).
//
// Alur uang (sama seperti pabrik komponen): EconomySystem memanggil processMonth() SEKALI per bulan
// (mengembalikan biaya: HPP, biaya tetap, insentif pengembang), lalu takeMonthlyRevenue()
// (menambah kas dengan pendapatan bulan itu).
//
// Efek ke game (netral bila belum ada aksesori / App Store, jadi save lama aman):
//   getDemandFactor(p)     pengali permintaan ponsel dari skor lock-in (maks +6%)
//   getCompetitorRelief()  pengali tekanan kompetitor (1.0 = tanpa efek)
//
// State di state.data.ecosystem (dibuat otomatis, lihat ensureEcosystemState).
// ============================================================
import { bus } from '../core/EventBus.js';
import { LanguageService } from '../core/LanguageService.js';
import { WalletService } from './WalletService.js';
import { computeOsAdoption, getProductActiveUsers } from './OsAdoptionModel.js';
import { ensureAfterSalesState } from './AfterSalesSystem.js';
import {
    ECO_CONST, ECO_LINES, ECO_TIERS, ECO_TIER_META, getEcoLine, tierBasePrice,
    ECO_SERVICES, SERVICE_TIERS, SERVICE_TIER_META, getEcoService, serviceTierBasePrice
} from '../data/ecosystem.data.js';

var AS_SCALE_BASE = 30000;   // sama dengan AfterSalesSystem: pendapatan 3 bulan rata-rata = skala 1
var AS_SCALE_MAX = 300;
var HISTORY_LIMIT = 12;

function _abs(y, m) { return (Number(y) || 0) * 12 + (Number(m) || 1); }
function _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function _num(v, d) { v = Number(v); return isFinite(v) ? v : (d || 0); }
function _nice(v) { var a = Math.abs(v); var step = a >= 100000 ? 1000 : 100; return Math.round(a / step) * step; }
function _lang() { try { return LanguageService.getLang() === 'id' ? 'id' : 'en'; } catch (e) { return 'en'; } }
function _L(id, en) { return _lang() === 'id' ? id : en; }

function _nowAbs(data) { var t = data.time || {}; return _abs(t.currentYear, t.currentMonth); }

// Fitur OS di versi yang sedang dipakai (sama dengan OSSystem.hasFeature, tanpa starter).
function _hasOsFeature(data, fid) {
    var os = data.os || {};
    var vs = Array.isArray(os.versions) ? os.versions : [];
    var cur = null;
    for (var i = 0; i < vs.length; i++) if (vs[i].id === os.currentVersionId) cur = vs[i];
    if (!cur && vs.length) cur = vs[vs.length - 1];
    return !!(cur && Array.isArray(cur.features) && cur.features.indexOf(fid) >= 0);
}

function _storeAvailable(data) { return _hasOsFeature(data, ECO_CONST.appStoreFeatureId); }

function _activeBugSeverity(data) {
    var os = data.os || {};
    var sev = 0, appStoreBug = false;
    (os.bugs || []).forEach(function (b) {
        if (b.status !== 'active') return;
        sev += _num(b.severity, 1);
        if (b.id === ECO_CONST.appStoreBugId) appStoreBug = true;
    });
    return { sev: sev, appStoreBug: appStoreBug };
}

// Akar skala perusahaan (sama seperti AfterSalesSystem._scale).
function _scale(data) {
    var rh = (data.market && data.market.revenueHistory) || [];
    var sum = 0, n = 0;
    for (var i = 0; i < Math.min(3, rh.length); i++) { sum += _num(rh[i] && rh[i].playerRevenue); n++; }
    return _clamp((n ? sum / n : 0) / AS_SCALE_BASE, 1, AS_SCALE_MAX);
}

// Basis ponsel aktif milik pemain (semua produk, tanpa memandang OS).
function _phoneBase(data) {
    var cat = (data.products && Array.isArray(data.products.catalog)) ? data.products.catalog : [];
    var sum = 0;
    cat.forEach(function (p) { sum += getProductActiveUsers(p, data); });
    return sum;
}

// Pengali kepuasan layanan, sama dengan AfterSalesSystem.getDemandFactor (bagian servis).
function _satFactor(data) {
    var sat = ensureAfterSalesState(data).satisfaction;
    return 1 + _clamp((sat - 60) / 100, -0.25, 0.15) * 0.25;
}

function _storeQuality(data) {
    var b = _activeBugSeverity(data);
    var q = 1 - ECO_CONST.bugSeverityPenalty * b.sev;
    if (b.appStoreBug) q -= ECO_CONST.bugAppStorePenalty;
    return _clamp(q, ECO_CONST.storeQualityMin, 1);
}

function _storeSpend(data) {
    var years = Math.max(0, (Number((data.time || {}).currentYear) || 2008) - ECO_CONST.storeMinYear);
    return ECO_CONST.storeSpendBase * Math.min(ECO_CONST.storeEraCap, 1 + years * ECO_CONST.storeEraGrowth);
}

function _storeAppeal(commission) {
    return _clamp(1 - (commission - ECO_CONST.commissionDefault) * ECO_CONST.storeAppealSlope,
        ECO_CONST.storeAppealMin, ECO_CONST.storeAppealMax);
}

// Basis pelanggan layanan: ponsel aktif (Cloud) atau pengguna OS aktif (Asisten AI).
function _serviceBase(data, svc) {
    return svc.baseBy === 'os' ? (computeOsAdoption(data).activeUsers || 0) : _phoneBase(data);
}

function _serviceAvailable(data, svc) {
    return _hasOsFeature(data, svc.requiredFeatureId);
}

// State ekosistem. Aman untuk save lama: dibuat dengan default bila belum ada.
export function ensureEcosystemState(data) {
    if (!data.ecosystem || typeof data.ecosystem !== 'object') data.ecosystem = {};
    var e = data.ecosystem;
    if (!e.lines || typeof e.lines !== 'object') e.lines = {};
    ECO_LINES.forEach(function (l) {
        var s = e.lines[l.id];
        if (!s || typeof s !== 'object') s = e.lines[l.id] = {};
        if (typeof s.open !== 'boolean') s.open = false;
        if (ECO_TIERS.indexOf(s.tier) < 0) s.tier = 'mid';
        if (typeof s.price !== 'number' || !isFinite(s.price) || s.price <= 0) s.price = tierBasePrice(l, s.tier);
        if (typeof s.openedAbs !== 'number' || !isFinite(s.openedAbs)) s.openedAbs = 0;
        if (typeof s.lockUntilAbs !== 'number' || !isFinite(s.lockUntilAbs)) s.lockUntilAbs = 0;
    });
    if (!e.services || typeof e.services !== 'object') e.services = {};
    ECO_SERVICES.forEach(function (svc) {
        var s = e.services[svc.id];
        if (!s || typeof s !== 'object') s = e.services[svc.id] = {};
        if (typeof s.open !== 'boolean') s.open = false;
        if (SERVICE_TIERS.indexOf(s.tier) < 0) s.tier = 'standard';
        var base = serviceTierBasePrice(svc, s.tier);
        if (s.tier !== 'free' && (typeof s.price !== 'number' || !isFinite(s.price) || s.price <= 0)) s.price = base;
        if (s.tier === 'free') s.price = 0;
        if (typeof s.openedAbs !== 'number' || !isFinite(s.openedAbs)) s.openedAbs = 0;
        if (typeof s.lockUntilAbs !== 'number' || !isFinite(s.lockUntilAbs)) s.lockUntilAbs = 0;
    });
    if (!e.store || typeof e.store !== 'object') e.store = {};
    var st = e.store;
    st.commission = _clamp(_num(st.commission, ECO_CONST.commissionDefault), ECO_CONST.commissionMin, ECO_CONST.commissionMax);
    if (typeof st.lockUntilAbs !== 'number' || !isFinite(st.lockUntilAbs)) st.lockUntilAbs = 0;
    if (typeof e.score !== 'number' || !isFinite(e.score)) e.score = 0;
    if (!e.stats || typeof e.stats !== 'object') e.stats = {};
    ['revenue', 'cost', 'units', 'storeRevenue', 'lineOpenings', 'serviceRevenue', 'subscribers'].forEach(function (k) {
        if (typeof e.stats[k] !== 'number' || !isFinite(e.stats[k])) e.stats[k] = 0;
    });
    if (!e.pending || typeof e.pending !== 'object') e.pending = {};
    if (typeof e.pending.revenue !== 'number' || !isFinite(e.pending.revenue)) e.pending.revenue = 0;
    if (!e.last || typeof e.last !== 'object') e.last = {};
    if (typeof e.lastProcessedAbs !== 'number' || !isFinite(e.lastProcessedAbs)) e.lastProcessedAbs = 0;
    if (!Array.isArray(e.history)) e.history = [];
    return e;
}

// Hitung rencana satu lini untuk bulan ini (tanpa mengubah state).
function _linePlan(line, s, base, sat, scale) {
    var tier = ECO_TIER_META[s.tier] || ECO_TIER_META.mid;
    var basePrice = tierBasePrice(line, s.tier);
    var price = Math.max(1, _num(s.price, basePrice));
    var priceF = _clamp(Math.pow(basePrice / price, line.elasticity), ECO_CONST.priceFactorMin, ECO_CONST.priceFactorMax);
    var unitCost = basePrice * tier.costRatio;
    var raw = base * line.attach * ECO_CONST.lineAttachScale * tier.attachMult * priceF * sat;
    var units = Math.round(_clamp(raw, 0, base * ECO_CONST.maxAttachShare));
    return {
        units: units,
        price: price,
        unitCost: unitCost,
        revenue: units * price,
        cogs: units * unitCost,
        fixed: _nice(line.monthlyFixed * Math.sqrt(scale))
    };
}

export class EcosystemSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        var self = this;
        ensureEcosystemState(this.state.data);
        this._unsubs.push(bus.on('state:hydrated', function () { ensureEcosystemState(self.state.data); }));
    }

    stop() { this._unsubs.forEach(function (u) { u(); }); this._unsubs = []; }

    _e() { return ensureEcosystemState(this.state.data); }
    _now() { return _nowAbs(this.state.data); }
    _scale() { return _scale(this.state.data); }

    _lockLeft(untilAbs) { return Math.max(0, untilAbs - this._now()); }

    // Skor lock-in 0..1: lini aksesori, App Store, dan layanan berlangganan (bobot di ECO_CONST).
    _refreshScore() {
        var d = this.state.data, e = this._e();
        var open = ECO_LINES.filter(function (l) { return e.lines[l.id].open; }).length;
        var lineScore = open / ECO_LINES.length;
        var users = _storeAvailable(d) ? (computeOsAdoption(d).activeUsers || 0) : 0;
        var storeScore = _clamp(users / ECO_CONST.storeUsersForFullScore, 0, 1);
        var svcOpen = ECO_SERVICES.filter(function (v) { return e.services[v.id].open; }).length;
        var svcScore = svcOpen / ECO_SERVICES.length;
        e.score = _clamp(ECO_CONST.scoreWeightLines * lineScore + ECO_CONST.scoreWeightStore * storeScore
            + ECO_CONST.scoreWeightServices * svcScore, 0, 1);
        return e.score;
    }

    // ---------------------------------------------------------------- efek ke game
    getDemandFactor() {
        var s = _clamp(_num(this._e().score), 0, 1);
        return 1 + ECO_CONST.demandPerScore * s;
    }

    getCompetitorRelief() {
        var s = _clamp(_num(this._e().score), 0, 1);
        return 1 - ECO_CONST.competitorReliefPerScore * s;
    }

    // ---------------------------------------------------------------- aksi pemain
    isLineOpen(id) { var s = this._e().lines[id]; return !!(s && s.open); }

    openLine(id) {
        var line = getEcoLine(id);
        if (!line) return { ok: false, reason: 'unknown' };
        var d = this.state.data, e = this._e(), s = e.lines[id];
        if (s.open) return { ok: false, reason: 'already' };
        var year = Number((d.time || {}).currentYear) || 2000;
        if (year < line.minYear) return { ok: false, reason: 'locked', year: line.minYear };
        var cost = _nice(line.setup * Math.sqrt(this._scale()));
        if (!WalletService.canAfford(cost)) return { ok: false, reason: 'funds', cost: cost };
        WalletService.pay(cost, 'Membuka lini ekosistem: ' + line.id);
        s.open = true;
        s.openedAbs = this._now();
        e.stats.lineOpenings += 1;
        this._refreshScore();
        bus.emit('ecosystem:line-opened', { id: id });
        return { ok: true, cost: cost };
    }

    closeLine(id) {
        var line = getEcoLine(id);
        if (!line) return { ok: false, reason: 'unknown' };
        var e = this._e(), s = e.lines[id];
        if (!s.open) return { ok: false, reason: 'already' };
        var untilAbs = s.openedAbs + ECO_CONST.commitMonths;
        if (this._now() < untilAbs) return { ok: false, reason: 'commit', monthsLeft: untilAbs - this._now() };
        s.open = false;
        this._refreshScore();
        return { ok: true };
    }

    setTier(id, tier) {
        var line = getEcoLine(id);
        if (!line || ECO_TIERS.indexOf(tier) < 0) return { ok: false, reason: 'unknown' };
        var s = this._e().lines[id];
        if (s.tier === tier) return { ok: false, reason: 'same' };
        if (this._now() < s.lockUntilAbs) return { ok: false, reason: 'lock', monthsLeft: this._lockLeft(s.lockUntilAbs) };
        s.tier = tier;
        s.price = tierBasePrice(line, tier);
        s.lockUntilAbs = this._now() + ECO_CONST.lockMonths;
        return { ok: true };
    }

    setPriceStep(id, dir) {
        var line = getEcoLine(id);
        if (!line || !dir) return { ok: false, reason: 'unknown' };
        var s = this._e().lines[id];
        if (this._now() < s.lockUntilAbs) return { ok: false, reason: 'lock', monthsLeft: this._lockLeft(s.lockUntilAbs) };
        var base = tierBasePrice(line, s.tier);
        var lo = base * ECO_CONST.priceMinMult, hi = base * ECO_CONST.priceMaxMult;
        var next = dir > 0 ? s.price * (1 + ECO_CONST.priceStep) : s.price / (1 + ECO_CONST.priceStep);
        next = Math.round(_clamp(next, lo, hi) * 100) / 100;
        if (next === s.price) return { ok: false, reason: 'same' };
        s.price = next;
        s.lockUntilAbs = this._now() + ECO_CONST.lockMonths;
        return { ok: true };
    }

    setCommissionStep(dir) {
        var d = this.state.data, e = this._e(), st = e.store;
        if (!_storeAvailable(d)) return { ok: false, reason: 'unavailable' };
        if (this._now() < st.lockUntilAbs) return { ok: false, reason: 'lock', monthsLeft: this._lockLeft(st.lockUntilAbs) };
        if (!dir) return { ok: false, reason: 'same' };
        var next = Math.round(_clamp(st.commission + dir * ECO_CONST.commissionStep, ECO_CONST.commissionMin, ECO_CONST.commissionMax) * 100) / 100;
        if (next === st.commission) return { ok: false, reason: 'same' };
        st.commission = next;
        st.lockUntilAbs = this._now() + ECO_CONST.lockMonths;
        return { ok: true };
    }

    // ---------------------------------------------------------------- layanan berlangganan
    isServiceOpen(id) { var s = this._e().services[id]; return !!(s && s.open); }

    getServiceAvailability(id) {
        var svc = getEcoService(id);
        if (!svc) return { ok: false, reason: 'unknown' };
        var year = Number((this.state.data.time || {}).currentYear) || 2000;
        if (year < svc.minYear) return { ok: false, reason: 'locked', year: svc.minYear };
        if (!_serviceAvailable(this.state.data, svc)) return { ok: false, reason: 'unavailable' };
        return { ok: true };
    }

    openService(id) {
        var svc = getEcoService(id);
        if (!svc) return { ok: false, reason: 'unknown' };
        var d = this.state.data, e = this._e(), s = e.services[id];
        if (s.open) return { ok: false, reason: 'already' };
        var av = this.getServiceAvailability(id);
        if (!av.ok) return av;
        var cost = _nice(svc.setup * Math.sqrt(this._scale()));
        if (!WalletService.canAfford(cost)) return { ok: false, reason: 'funds', cost: cost };
        WalletService.pay(cost, 'Membuka layanan berlangganan: ' + svc.id);
        s.open = true;
        s.openedAbs = this._now();
        this._refreshScore();
        bus.emit('ecosystem:service-opened', { id: id });
        return { ok: true, cost: cost };
    }

    closeService(id) {
        var svc = getEcoService(id);
        if (!svc) return { ok: false, reason: 'unknown' };
        var s = this._e().services[id];
        if (!s.open) return { ok: false, reason: 'already' };
        var untilAbs = s.openedAbs + ECO_CONST.commitMonths;
        if (this._now() < untilAbs) return { ok: false, reason: 'commit', monthsLeft: untilAbs - this._now() };
        s.open = false;
        this._refreshScore();
        return { ok: true };
    }

    setServiceTier(id, tier) {
        var svc = getEcoService(id);
        if (!svc || SERVICE_TIERS.indexOf(tier) < 0) return { ok: false, reason: 'unknown' };
        var s = this._e().services[id];
        if (s.tier === tier) return { ok: false, reason: 'same' };
        if (this._now() < s.lockUntilAbs) return { ok: false, reason: 'lock', monthsLeft: this._lockLeft(s.lockUntilAbs) };
        s.tier = tier;
        s.price = serviceTierBasePrice(svc, tier);
        s.lockUntilAbs = this._now() + ECO_CONST.lockMonths;
        return { ok: true };
    }

    // Harga hanya bisa diubah di tier berbayar; tier gratis tidak punya harga.
    setServicePriceStep(id, dir) {
        var svc = getEcoService(id);
        if (!svc || !dir) return { ok: false, reason: 'unknown' };
        var s = this._e().services[id];
        if (s.tier === 'free') return { ok: false, reason: 'free' };
        if (this._now() < s.lockUntilAbs) return { ok: false, reason: 'lock', monthsLeft: this._lockLeft(s.lockUntilAbs) };
        var base = serviceTierBasePrice(svc, s.tier);
        var lo = base * ECO_CONST.priceMinMult, hi = base * ECO_CONST.priceMaxMult;
        var next = dir > 0 ? s.price * (1 + ECO_CONST.priceStep) : s.price / (1 + ECO_CONST.priceStep);
        next = Math.round(_clamp(next, lo, hi) * 100) / 100;
        if (next === s.price) return { ok: false, reason: 'same' };
        s.price = next;
        s.lockUntilAbs = this._now() + ECO_CONST.lockMonths;
        return { ok: true };
    }

    // Hitung rencana satu layanan untuk bulan ini (tanpa mengubah state).
    _servicePlan(svc, s, base, sat, scale) {
        var tier = SERVICE_TIER_META[s.tier] || SERVICE_TIER_META.standard;
        var basePrice = serviceTierBasePrice(svc, s.tier);
        var price = tier.priceMult > 0 ? Math.max(0.01, _num(s.price, basePrice)) : 0;
        var priceF = 1;
        if (basePrice > 0) {
            priceF = _clamp(Math.pow(basePrice / price, svc.elasticity), ECO_CONST.priceFactorMin, ECO_CONST.priceFactorMax);
        }
        var unitCost = svc.refPrice * svc.unitCostRatio * tier.costMult;
        var raw = base * svc.attach * tier.attachMult * priceF * sat;
        var subs = Math.round(_clamp(raw, 0, base * ECO_CONST.maxAttachShare));
        return {
            subscribers: subs, price: price, unitCost: unitCost,
            revenue: subs * price, cogs: subs * unitCost,
            fixed: _nice(svc.monthlyFixed * Math.sqrt(scale))
        };
    }

    getServicePreview(id) {
        var svc = getEcoService(id);
        if (!svc) return null;
        var d = this.state.data, e = this._e(), s = e.services[id];
        var base = _serviceBase(d, svc), sat = _satFactor(d), scale = this._scale();
        var plan = this._servicePlan(svc, s, base, sat, scale);
        var basePrice = serviceTierBasePrice(svc, s.tier);
        var av = this.getServiceAvailability(id);
        var setupCost = _nice(svc.setup * Math.sqrt(scale));
        var commitLeft = s.open ? Math.max(0, s.openedAbs + ECO_CONST.commitMonths - this._now()) : 0;
        return {
            id: id, nameKey: svc.nameKey, descKey: svc.descKey, minYear: svc.minYear,
            available: av.ok, availabilityReason: av.ok ? null : av.reason, availabilityYear: av.year || null,
            open: s.open, tier: s.tier, price: plan.price, basePrice: basePrice,
            priceMin: basePrice * ECO_CONST.priceMinMult, priceMax: basePrice * ECO_CONST.priceMaxMult,
            setupCost: setupCost, canOpen: !s.open && av.ok && WalletService.canAfford(setupCost),
            locked: this._now() < s.lockUntilAbs, lockLeft: this._lockLeft(s.lockUntilAbs),
            closeLocked: s.open && commitLeft > 0, commitLeft: commitLeft,
            base: base, subscribers: plan.subscribers, revenue: plan.revenue,
            cost: plan.cogs + plan.fixed, unitCost: plan.unitCost,
            margin: plan.revenue > 0 ? (plan.revenue - plan.cogs) / plan.revenue : 0
        };
    }

    // ---------------------------------------------------------------- uang (dipanggil EconomySystem)
    // Dipanggil sekali per bulan. Mengembalikan total biaya bulan itu; pendapatan disimpan di pending.
    processMonth() {
        var d = this.state.data, e = this._e(), now = this._now();
        if (now <= e.lastProcessedAbs) return 0;   // penjaga: tidak dobel
        e.lastProcessedAbs = now;

        var scale = this._scale(), sat = _satFactor(d), base = _phoneBase(d);
        var revenue = 0, cost = 0, units = 0, lineRevenue = 0;
        var self = this;
        ECO_LINES.forEach(function (line) {
            var s = e.lines[line.id];
            if (!s || !s.open) return;
            var plan = _linePlan(line, s, base, sat, scale);
            revenue += plan.revenue;
            lineRevenue += plan.revenue;
            cost += plan.cogs + plan.fixed;
            units += plan.units;
        });

        // Layanan berlangganan: pendapatan langganan dan biaya per pelanggan + tetap.
        var svcRevenue = 0, subscribers = 0;
        ECO_SERVICES.forEach(function (svc) {
            var s = e.services[svc.id];
            if (!s || !s.open) return;
            var sb = _serviceBase(d, svc);
            var sp = self._servicePlan(svc, s, sb, sat, scale);
            svcRevenue += sp.revenue;
            subscribers += sp.subscribers;
            revenue += sp.revenue;
            cost += sp.cogs + sp.fixed;
        });

        // App Store: komisi dari belanja kotor pengguna OS aktif.
        var storeUsers = 0, storeRev = 0;
        if (_storeAvailable(d)) {
            storeUsers = computeOsAdoption(d).activeUsers || 0;
            if (storeUsers > 0) {
                var gross = storeUsers * _storeSpend(d) * _storeAppeal(e.store.commission) * _storeQuality(d);
                storeRev = gross * e.store.commission;
                cost += gross * ECO_CONST.storeIncentiveRate + _nice(ECO_CONST.storeFixedMonthly * Math.sqrt(scale));
            }
        }
        revenue += storeRev;

        revenue = Math.round(_num(revenue));
        cost = Math.round(_num(cost));
        e.pending.revenue = revenue;
        e.last = {
            units: units, storeUsers: storeUsers, revenue: revenue, cost: cost,
            lineRevenue: Math.round(lineRevenue), storeRevenue: Math.round(storeRev),
            serviceRevenue: Math.round(svcRevenue), subscribers: subscribers
        };
        e.stats.units += units;
        e.stats.serviceRevenue += Math.round(svcRevenue);
        e.stats.subscribers = subscribers;
        e.stats.storeRevenue += Math.round(storeRev);
        e.stats.cost += cost;

        e.history.unshift({ abs: now, revenue: revenue, cost: cost, units: units, score: 0 });
        if (e.history.length > HISTORY_LIMIT) e.history.length = HISTORY_LIMIT;

        this._refreshScore();
        e.history[0].score = e.score;
        return cost;
    }

    // Menambah kas dengan pendapatan bulan ini (dipanggil EconomySystem sesudah processMonth).
    takeMonthlyRevenue() {
        var e = this._e();
        var r = _num(e.pending.revenue);
        e.pending.revenue = 0;
        if (r > 0) { this.state.addCash(r); e.stats.revenue += r; }
        return r;
    }

    // ---------------------------------------------------------------- untuk panel
    getLinePreview(id) {
        var line = getEcoLine(id);
        if (!line) return null;
        var d = this.state.data, e = this._e(), s = e.lines[id];
        var base = _phoneBase(d), sat = _satFactor(d), scale = this._scale();
        var plan = _linePlan(line, s, base, sat, scale);
        var basePrice = tierBasePrice(line, s.tier);
        var year = Number((d.time || {}).currentYear) || 2000;
        var setupCost = _nice(line.setup * Math.sqrt(scale));
        var commitLeft = s.open ? Math.max(0, s.openedAbs + ECO_CONST.commitMonths - this._now()) : 0;
        return {
            id: id, nameKey: line.nameKey, minYear: line.minYear, yearOk: year >= line.minYear,
            open: s.open, tier: s.tier, price: s.price, basePrice: basePrice,
            priceMin: basePrice * ECO_CONST.priceMinMult, priceMax: basePrice * ECO_CONST.priceMaxMult,
            setupCost: setupCost, canOpen: !s.open && year >= line.minYear && WalletService.canAfford(setupCost),
            locked: this._now() < s.lockUntilAbs, lockLeft: this._lockLeft(s.lockUntilAbs),
            closeLocked: s.open && commitLeft > 0, commitLeft: commitLeft,
            units: plan.units, revenue: plan.revenue, cost: plan.cogs + plan.fixed, unitCost: plan.unitCost,
            margin: plan.revenue > 0 ? (plan.revenue - plan.cogs) / plan.revenue : 0
        };
    }

    getStorePreview() {
        var d = this.state.data, e = this._e(), st = e.store;
        var available = _storeAvailable(d);
        var users = available ? (computeOsAdoption(d).activeUsers || 0) : 0;
        var spend = _storeSpend(d), appeal = _storeAppeal(st.commission), quality = _storeQuality(d);
        var gross = users * spend * appeal * quality;
        return {
            available: available, commission: st.commission, users: users,
            spend: spend, appeal: appeal, quality: quality, gross: gross,
            revenue: gross * st.commission,
            cost: users > 0 ? gross * ECO_CONST.storeIncentiveRate + _nice(ECO_CONST.storeFixedMonthly * Math.sqrt(this._scale())) : 0,
            locked: this._now() < st.lockUntilAbs, lockLeft: this._lockLeft(st.lockUntilAbs),
            minCommission: ECO_CONST.commissionMin, maxCommission: ECO_CONST.commissionMax
        };
    }

    getSummary() {
        var d = this.state.data, e = this._e();
        var linesOpen = ECO_LINES.filter(function (l) { return e.lines[l.id].open; }).length;
        var servicesOpen = ECO_SERVICES.filter(function (v) { return e.services[v.id].open; }).length;
        return {
            score: e.score, demandBonus: this.getDemandFactor() - 1, competitorRelief: 1 - this.getCompetitorRelief(),
            linesOpen: linesOpen, lineCount: ECO_LINES.length, storeAvailable: _storeAvailable(d),
            servicesOpen: servicesOpen, serviceCount: ECO_SERVICES.length,
            phoneBase: _phoneBase(d), last: e.last, stats: e.stats, history: e.history.slice()
        };
    }
}
