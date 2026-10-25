// FILE: src/systems/AfterSalesSystem.js  (BARU — layanan pasca-jual)
// ============================================================
// Garansi, pusat servis, dukungan update OS, dan insiden cacat massal (recall).
//
// Alur uang: EconomySystem memanggil processMonth() SEKALI per bulan; hasilnya (biaya klaim +
// biaya dukungan OS + biaya tetap pusat servis) dimasukkan ke pengeluaran bulanan, jadi masuk
// laporan keuangan dan pengecekan kas/bangkrut seperti biaya lain.
//
// Efek ke game (netral bila belum ada penjualan, jadi save lama aman):
//   getDemandFactor(p)  pengali permintaan produk (garansi, kepuasan servis, dukungan OS, stigma insiden)
//   reputasi & sentimen publik bergeser pelan mengikuti kepuasan layanan
//
// State di state.data.afterSales (dibuat otomatis). Event bus: aftersales:incident / aftersales:resolved.
// ============================================================
import { bus } from '../core/EventBus.js';
import { LOG_TYPES } from '../config/constants.js';
import { ToastService } from '../core/ToastService.js';
import { LanguageService } from '../core/LanguageService.js';
import { WalletService } from './WalletService.js';
import {
    AS_SCALE_BASE, AS_SCALE_MAX, WARRANTY_OPTIONS, WARRANTY_DEFAULT, OS_YEARS_MIN, OS_YEARS_MAX, OS_YEARS_DEFAULT,
    POLICY_LOCK_MONTHS, SERVICE_LEVELS, getServiceLevel, baseFailureAt, FOLDABLE_FORMS, FOLDABLE_FAILURE_MULT,
    CLAIM_COST_UNIT_FRACTION, CLAIM_HANDLING_COST, OS_SUPPORT_COST_FACTOR, INCIDENT
} from '../data/aftersales.data.js';

function _abs(y, m) { return (Number(y) || 0) * 12 + (Number(m) || 1); }
function _lang() { try { return LanguageService.getLang() === 'id' ? 'id' : 'en'; } catch (e) { return 'en'; } }
function _L(id, en) { return _lang() === 'id' ? id : en; }
function _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function _num(v, d) { v = Number(v); return isFinite(v) ? v : (d || 0); }
function _nice(v) { var a = Math.abs(v); var step = a >= 100000 ? 1000 : 100; return Math.round(a / step) * step; }
function _yearFrac(t) { return (Number(t.currentYear) || 2000) + ((Number(t.currentMonth) || 1) - 1) / 12; }

var MAX_COHORTS = 60;
var HISTORY_LIMIT = 12;

export function ensureAfterSalesState(data) {
    if (!data.afterSales || typeof data.afterSales !== 'object') data.afterSales = {};
    var a = data.afterSales;
    if (!getServiceLevel(a.level)) a.level = 'partner';
    if (typeof a.satisfaction !== 'number' || !isFinite(a.satisfaction)) a.satisfaction = 60;
    if (typeof a.backlog !== 'number' || !isFinite(a.backlog) || a.backlog < 0) a.backlog = 0;
    if (!a.policy || typeof a.policy !== 'object') a.policy = {};
    if (!a.sold || typeof a.sold !== 'object') a.sold = {};
    if (!a.cur || typeof a.cur !== 'object') a.cur = {};
    if (!Array.isArray(a.incidents)) a.incidents = [];
    if (!a.stigma || typeof a.stigma !== 'object') a.stigma = {};
    if (!a.stats || typeof a.stats !== 'object') a.stats = {};
    ['claims', 'claimCost', 'osCost', 'fixedCost', 'recalls', 'campaigns', 'ignored', 'setup'].forEach(function (k) {
        if (typeof a.stats[k] !== 'number') a.stats[k] = 0;
    });
    if (!a.month || typeof a.month !== 'object') a.month = { claims: 0, processed: 0, claimCost: 0, osCost: 0, fixed: 0, units: 0 };
    if (!Array.isArray(a.history)) a.history = [];
    if (typeof a.lastProcessedAbs !== 'number') a.lastProcessedAbs = 0;
    if (typeof a.nextIncidentId !== 'number') a.nextIncidentId = 1;
    return a;
}

export class AfterSalesSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
        this._assembly = null;
    }

    // Pabrik perakitan sendiri (AssemblySystem): QC yang baik membuat ponsel lebih awet.
    setAssembly(asm) { this._assembly = asm; }

    start() {
        var self = this;
        ensureAfterSalesState(this.state.data);
        this._unsubs.push(bus.on('product:sale', function (e) { self._recordSale(e); }));
        this._unsubs.push(bus.on('state:hydrated', function () { ensureAfterSalesState(self.state.data); }));
    }

    stop() { this._unsubs.forEach(function (u) { u(); }); this._unsubs = []; }

    // ---------------------------------------------------------------- util
    _now() { var t = this.state.data.time; return _abs(t.currentYear, t.currentMonth); }
    _a() { return ensureAfterSalesState(this.state.data); }
    _catalog() { var c = this.state.data.products && this.state.data.products.catalog; return Array.isArray(c) ? c : []; }
    _product(pid) { var c = this._catalog(); for (var i = 0; i < c.length; i++) if (c[i].id === pid) return c[i]; return null; }

    _scale() {
        var rh = (this.state.data.market && this.state.data.market.revenueHistory) || [];
        var sum = 0, n = 0;
        for (var i = 0; i < Math.min(3, rh.length); i++) { sum += _num(rh[i] && rh[i].playerRevenue); n++; }
        return _clamp((n ? sum / n : 0) / AS_SCALE_BASE, 1, AS_SCALE_MAX);
    }

    // ---------------------------------------------------------------- kebijakan produk
    getPolicy(pid) {
        var a = this._a();
        var p = a.policy[pid];
        if (!p || typeof p !== 'object') p = a.policy[pid] = { warranty: WARRANTY_DEFAULT, osYears: OS_YEARS_DEFAULT, lockUntilAbs: 0 };
        if (!WARRANTY_OPTIONS.some(function (o) { return o.months === p.warranty; })) p.warranty = WARRANTY_DEFAULT;
        p.osYears = _clamp(Math.round(_num(p.osYears, OS_YEARS_DEFAULT)), OS_YEARS_MIN, OS_YEARS_MAX);
        if (typeof p.lockUntilAbs !== 'number') p.lockUntilAbs = 0;
        return p;
    }

    policyLockLeft(pid) { return Math.max(0, this.getPolicy(pid).lockUntilAbs - this._now()); }

    setWarranty(pid, months) {
        if (!this._product(pid)) return { ok: false, reason: 'invalid' };
        if (!WARRANTY_OPTIONS.some(function (o) { return o.months === months; })) return { ok: false, reason: 'invalid' };
        var pol = this.getPolicy(pid);
        if (pol.warranty === months) return { ok: false, reason: 'same' };
        var left = this.policyLockLeft(pid);
        if (left > 0) return { ok: false, reason: 'lock', monthsLeft: left };
        pol.warranty = months;
        pol.lockUntilAbs = this._now() + POLICY_LOCK_MONTHS;
        bus.emit('state:changed', this.state.data);
        return { ok: true };
    }

    // Dukungan update OS adalah janji publik: boleh dinaikkan, tidak boleh diturunkan.
    setOsYears(pid, years) {
        if (!this._product(pid)) return { ok: false, reason: 'invalid' };
        years = Math.round(_num(years));
        if (years < OS_YEARS_MIN || years > OS_YEARS_MAX) return { ok: false, reason: 'invalid' };
        var pol = this.getPolicy(pid);
        if (years === pol.osYears) return { ok: false, reason: 'same' };
        if (years < pol.osYears) return { ok: false, reason: 'promise' };
        pol.osYears = years;
        bus.emit('state:changed', this.state.data);
        return { ok: true };
    }

    // ---------------------------------------------------------------- penjualan -> kohort
    _recordSale(e) {
        try {
            if (!e || !e.productId) return;
            var sold = _num(e.sold);
            if (sold <= 0) return;
            var a = this._a();
            var w = this.getPolicy(e.productId).warranty;
            var cur = a.cur[e.productId] || (a.cur[e.productId] = {});
            cur[w] = _num(cur[w]) + sold;
        } catch (err) { /* pencatatan tidak boleh menggagalkan penjualan */ }
    }

    // Unit yang masih dalam garansi / dukungan OS, dihitung dari kohort bulanan + penjualan bulan berjalan.
    _cohorts(pid) {
        var a = this._a();
        var list = (Array.isArray(a.sold[pid]) ? a.sold[pid] : []).slice();
        var cur = a.cur[pid];
        if (cur) {
            var now = this._now();
            Object.keys(cur).forEach(function (w) { if (cur[w] > 0) list.push({ a: now, u: cur[w], w: Number(w) }); });
        }
        return list;
    }

    unitsInWarranty(pid) {
        var now = this._now(), sum = 0;
        this._cohorts(pid).forEach(function (c) { if (now - c.a < c.w) sum += c.u; });
        return sum;
    }

    unitsInOsSupport(pid) {
        var now = this._now(), months = this.getPolicy(pid).osYears * 12, sum = 0;
        this._cohorts(pid).forEach(function (c) { if (now - c.a < months) sum += c.u; });
        return sum;
    }

    // ---------------------------------------------------------------- tingkat kerusakan & biaya klaim
    // Pengali kerusakan dari kualitas rakitan, pabrik perakitan sendiri, bug OS, dan bentuk lipat.
    failureMultiplier(p) {
        var d = this.state.data;
        var q = _clamp(_num(p && p.stats && p.stats.quality, 50), 0, 100);
        var mult = 1.45 - (q / 100) * 0.9;                         // kualitas 50 -> 1.0
        try {
            var asm = this._assembly;
            if (asm && asm.isOperating && asm.isOperating()) {
                mult *= _clamp(1 + (asm.getDefectRate() - 0.04) * 3, 0.9, 1.15);   // QC bagus -> lebih awet
            }
        } catch (e) {}
        var bugs = ((d.os && d.os.bugs) || []).filter(function (b) { return b.status === 'active' || b.status === 'patching'; }).length;
        mult *= 1 + Math.min(0.3, bugs * 0.04);
        if (p && p.config && FOLDABLE_FORMS.indexOf(p.config.formFactorId) >= 0) mult *= FOLDABLE_FAILURE_MULT;
        return _clamp(mult, 0.4, 3);
    }

    annualFailureRate(p) {
        return _clamp(baseFailureAt(_yearFrac(this.state.data.time)) * this.failureMultiplier(p), 0.01, 0.35);
    }

    costPerClaim(p) {
        var lv = this.getLevel();
        return _num(p && p.unitCost) * CLAIM_COST_UNIT_FRACTION * lv.costMult + CLAIM_HANDLING_COST;
    }

    // ---------------------------------------------------------------- pusat servis
    getLevel() { return getServiceLevel(this._a().level) || SERVICE_LEVELS[0]; }
    isLevelUnlocked(id) { var d = getServiceLevel(id); return !!d && this.state.data.time.currentYear >= d.unlock; }
    _totalInForce() {
        var self = this, sum = 0;
        this._catalog().forEach(function (p) { sum += self.unitsInWarranty(p.id); });
        return sum;
    }
    getSetupCost(id) { var d = getServiceLevel(id); return d ? _nice(d.setup * Math.sqrt(this._scale())) : 0; }
    getMonthlyCost(id) {
        var d = getServiceLevel(id);
        if (!d || (!d.monthlyBase && !d.perUnit)) return 0;
        return _nice(d.monthlyBase + d.perUnit * this._totalInForce());
    }

    _fixedFor(id, inForce) {
        var d = getServiceLevel(id);
        if (!d || (!d.monthlyBase && !d.perUnit)) return 0;
        return _nice(d.monthlyBase + d.perUnit * inForce);
    }

    setLevel(id) {
        var def = getServiceLevel(id);
        if (!def) return { ok: false, reason: 'invalid' };
        var a = this._a();
        if (a.level === id) return { ok: false, reason: 'same' };
        if (!this.isLevelUnlocked(id)) return { ok: false, reason: 'locked', year: def.unlock };
        var cost = this.getSetupCost(id);
        if (cost > 0) {
            if (!WalletService.canAfford(cost)) return { ok: false, reason: 'funds', cost: cost };
            var pay = WalletService.pay(cost, 'aftersales-setup:' + id);
            if (!pay.ok) return { ok: false, reason: 'funds', cost: cost };
            a.stats.setup += cost;
        }
        a.level = id;
        this.state.addLog(_L('Pusat servis diubah: ', 'Service network changed: ') + _L(def.name.id, def.name.en) + '.', LOG_TYPES.success);
        bus.emit('aftersales:level-changed', { id: id, cost: cost });
        bus.emit('state:changed', this.state.data);
        return { ok: true, cost: cost };
    }

    // ---------------------------------------------------------------- perhitungan bulanan
    // noise=true dipakai saat memproses bulan sungguhan; false untuk perkiraan di UI (tanpa efek samping).
    _calc(noise) {
        var a = this._a(), lv = this.getLevel();
        var perProduct = [], totalInForce = 0, claims = 0, claimCostAvg = 0, osCost = 0;
        var self = this;
        this._catalog().forEach(function (p) {
            var inForce = self.unitsInWarranty(p.id);
            var osUnits = self.unitsInOsSupport(p.id);
            var rate = self.annualFailureRate(p) / 12;
            var n = noise ? (1 + (Math.random() * 2 - 1) * 0.08) : 1;
            var base = inForce * rate * n;
            var extra = 0;
            a.incidents.forEach(function (inc) {
                if (inc.pid === p.id) extra += self._incidentClaims(inc);
            });
            var pc = self.costPerClaim(p);
            var pol = self.getPolicy(p.id);
            var oc = osUnits * OS_SUPPORT_COST_FACTOR * _num(p.unitCost) * Math.max(0, pol.osYears - 1);
            totalInForce += inForce;
            claims += base + extra;
            claimCostAvg += (base + extra) * pc;
            osCost += oc;
            perProduct.push({ id: p.id, name: p.name, inForce: inForce, osUnits: osUnits, claims: base + extra, incident: extra, costPerClaim: pc, osCost: oc, annualRate: rate * 12 });
        });
        var capacity = Math.round(totalInForce * lv.capacityPct);
        var avail = a.backlog + claims;
        var processed = Math.min(capacity, avail);
        var avgCost = claims > 0 ? claimCostAvg / claims : 0;
        var waitMonths = capacity > 0 ? Math.max(0, avail - processed) / capacity : 0;
        return {
            perProduct: perProduct, totalInForce: totalInForce, claims: claims, capacity: capacity, processed: processed,
            claimCost: processed * avgCost, osCost: osCost, fixed: this._fixedFor(a.level, totalInForce),
            backlogAfter: Math.max(0, avail - processed), waitMonths: waitMonths
        };
    }

    // Perkiraan bulan berikutnya untuk panel (tidak mengubah state).
    previewMonth() {
        try {
            var c = this._calc(false);
            return { claims: c.claims, capacity: c.capacity, processed: c.processed, claimCost: c.claimCost, osCost: c.osCost, fixed: c.fixed,
                total: c.claimCost + c.osCost + c.fixed, waitMonths: c.waitMonths, inForce: c.totalInForce, perProduct: c.perProduct };
        } catch (e) { return { claims: 0, capacity: 0, processed: 0, claimCost: 0, osCost: 0, fixed: 0, total: 0, waitMonths: 0, inForce: 0, perProduct: [] }; }
    }

    // Dipanggil EconomySystem tiap bulan. Mengembalikan total biaya bulan ini ($).
    processMonth() {
        var d = this.state.data, a = this._a(), now = this._now();
        if (a.lastProcessedAbs === now) return 0;     // jaga dari pemrosesan ganda
        a.lastProcessedAbs = now;
        try {
            var self = this;
            // 1) Tutup penjualan bulan berjalan menjadi kohort.
            Object.keys(a.cur).forEach(function (pid) {
                var cur = a.cur[pid];
                if (!Array.isArray(a.sold[pid])) a.sold[pid] = [];
                Object.keys(cur).forEach(function (w) {
                    if (cur[w] > 0) a.sold[pid].push({ a: now, u: Math.round(cur[w]), w: Number(w) });
                });
            });
            a.cur = {};

            // 2) Hitung klaim, kapasitas, biaya.
            var c = this._calc(true);
            var level = this.getLevel();

            // 3) Antrean & kepuasan.
            a.backlog = Math.max(0, c.backlogAfter) * 0.9;     // sebagian pelanggan menyerah tiap bulan
            var wait = c.waitMonths;
            var target = level.satCap - 38 * _clamp(wait, 0, 1.5);
            if (c.totalInForce > 0) a.satisfaction = _clamp(a.satisfaction + (target - a.satisfaction) * 0.35, 0, 100);

            // 4) Efek ke reputasi & sentimen.
            if (c.totalInForce > 0) {
                var k = _clamp((a.satisfaction - 60) / 40, -1, 1);
                if (Math.abs(k) > 0.02) {
                    this.state.addReputation(k * 0.12);
                    this.state.addSentiment(k * 1.2);
                }
            }

            // 5) Insiden: batas waktu keputusan, durasi, dan insiden baru.
            this._advanceIncidents(now);
            this._rollIncidents(now, c);

            // 6) Pembukuan.
            var total = Math.round(c.claimCost + c.osCost + c.fixed);
            a.stats.claims += c.processed;
            a.stats.claimCost += c.claimCost;
            a.stats.osCost += c.osCost;
            a.stats.fixedCost += c.fixed;
            a.month = { claims: c.claims, processed: c.processed, claimCost: c.claimCost, osCost: c.osCost, fixed: c.fixed, units: c.totalInForce };
            a.history.unshift({ abs: now, claims: Math.round(c.claims), processed: Math.round(c.processed), cost: total, sat: Math.round(a.satisfaction) });
            if (a.history.length > HISTORY_LIMIT) a.history.length = HISTORY_LIMIT;

            // 7) Rapikan kohort yang sudah lewat masa garansi & dukungan OS.
            Object.keys(a.sold).forEach(function (pid) {
                var keepMonths = self.getPolicy(pid).osYears * 12;
                a.sold[pid] = a.sold[pid].filter(function (co) { return now - co.a < Math.max(co.w, keepMonths); }).slice(-MAX_COHORTS);
                if (!a.sold[pid].length) delete a.sold[pid];
            });
            Object.keys(a.stigma).forEach(function (pid) { if (a.stigma[pid].untilAbs <= now) delete a.stigma[pid]; });
            a.incidents = a.incidents.filter(function (inc) { return inc.status === 'open' || inc.status === 'ignored' || now - inc.startAbs < 24; }).slice(-30);

            if (total > 0 && c.claims > 0 && c.totalInForce > 0 && wait > 1) {
                this.state.addLog(_L('Antrean servis menumpuk (' + Math.round(a.backlog).toLocaleString('en-US') + ' klaim). Pertimbangkan pusat servis yang lebih besar.',
                    'Service backlog is building (' + Math.round(a.backlog).toLocaleString('en-US') + ' claims). Consider a bigger service network.'), LOG_TYPES.warning);
            }
            return total;
        } catch (err) {
            console.error('[AfterSalesSystem] processMonth gagal:', err);
            return 0;
        }
    }

    // ---------------------------------------------------------------- insiden cacat massal
    _incidentClaims(inc) {
        if (!inc || inc.monthsRun >= INCIDENT.durationMonths) return 0;
        var per = inc.affectedUnits / INCIDENT.durationMonths;
        if (inc.status === 'recall') return 0;
        if (inc.status === 'campaign') return per * INCIDENT.campaignResidual;
        return per;     // open / ignored
    }

    _advanceIncidents(now) {
        var a = this._a(), self = this;
        a.incidents.forEach(function (inc) {
            if (inc.status === 'open' && now >= inc.deadlineAbs) self._applyIgnore(inc, now, true);
            if (inc.status !== 'ended') {
                inc.monthsRun = (inc.monthsRun || 0) + 1;
                if (inc.monthsRun >= INCIDENT.durationMonths && inc.status !== 'open') { inc.endedStatus = inc.status; inc.status = 'ended'; }
            }
        });
    }

    _rollIncidents(now, c) {
        var a = this._a(), self = this;
        c.perProduct.forEach(function (row) {
            if (row.inForce < INCIDENT.minUnitsInForce) return;
            if (a.incidents.some(function (i) { return i.pid === row.id && (i.status === 'open' || i.status === 'ignored' || i.status === 'campaign'); })) return;
            var p = self._product(row.id);
            if (!p) return;
            var chance = _clamp(INCIDENT.baseChancePerMonth * self.failureMultiplier(p), 0, INCIDENT.maxChancePerMonth);
            if (Math.random() >= chance) return;
            var r = Math.random();
            var sev = INCIDENT.severities[r < 0.55 ? 0 : (r < 0.88 ? 1 : 2)];
            var inc = {
                id: a.nextIncidentId++, pid: row.id, name: p.name, sev: sev.id, startAbs: now, deadlineAbs: now + INCIDENT.decideMonths,
                affectedUnits: Math.round(row.inForce * sev.affected), monthsRun: 0, status: 'open'
            };
            a.incidents.push(inc);
            var msg = _L('Cacat massal terdeteksi pada "' + p.name + '" (tingkat ' + sev.id + '). Putuskan di Pasar > Servis.',
                'Mass defect found on "' + p.name + '" (level ' + sev.id + '). Decide in Market > Service.');
            self.state.addLog(msg, LOG_TYPES.danger);
            try { ToastService.warning(msg); } catch (e) {}
            bus.emit('aftersales:incident', { id: inc.id, productId: inc.pid, severity: inc.sev });
        });
    }

    getOpenIncidents() { return this._a().incidents.filter(function (i) { return i.status === 'open'; }); }

    // Biaya tindakan untuk satu insiden (pakai unit dalam garansi saat ini).
    incidentCost(inc, choice) {
        var p = this._product(inc.pid), lv = this.getLevel();
        if (!p) return 0;
        var frac = choice === 'recall' ? INCIDENT.recallCostFraction : (choice === 'campaign' ? INCIDENT.campaignCostFraction : 0);
        return Math.round(this.unitsInWarranty(inc.pid) * _num(p.unitCost) * frac * lv.costMult);
    }

    _applyIgnore(inc, now, forced) {
        var a = this._a();
        inc.status = 'ignored';
        a.stats.ignored += 1;
        this.state.addReputation(-INCIDENT.reputationPerSeverity * inc.sev);
        this.state.addSentiment(-INCIDENT.sentimentPerSeverity * inc.sev);
        a.stigma[inc.pid] = { untilAbs: now + INCIDENT.stigmaMonths, amount: INCIDENT.stigmaPerSeverity * inc.sev };
        this.state.addLog(_L('Cacat "' + inc.name + '" dibiarkan' + (forced ? ' sampai lewat batas waktu' : '') + ': reputasi dan penjualan terpukul.',
            'Defect on "' + inc.name + '" was left unaddressed' + (forced ? ' past the deadline' : '') + ': reputation and sales took a hit.'), LOG_TYPES.danger);
        bus.emit('aftersales:resolved', { id: inc.id, choice: 'ignore', forced: !!forced });
    }

    resolveIncident(id, choice) {
        var a = this._a(), now = this._now();
        var inc = null;
        for (var i = 0; i < a.incidents.length; i++) if (a.incidents[i].id === id) inc = a.incidents[i];
        if (!inc || inc.status !== 'open') return { ok: false, reason: 'invalid' };
        if (choice === 'ignore') {
            this._applyIgnore(inc, now, false);
            bus.emit('state:changed', this.state.data);
            return { ok: true, cost: 0 };
        }
        if (choice !== 'recall' && choice !== 'campaign') return { ok: false, reason: 'invalid' };
        var cost = this.incidentCost(inc, choice);
        if (cost > 0) {
            if (!WalletService.canAfford(cost)) return { ok: false, reason: 'funds', cost: cost };
            var pay = WalletService.pay(cost, 'aftersales-' + choice);
            if (!pay.ok) return { ok: false, reason: 'funds', cost: cost };
        }
        inc.status = choice;
        inc.paid = cost;
        if (choice === 'recall') {
            a.stats.recalls += 1;
            this.state.addReputation(INCIDENT.recallRepBonus);
            this.state.addSentiment(1);
            this.state.addLog(_L('Recall "' + inc.name + '" dijalankan: $' + cost.toLocaleString('en-US') + '.', 'Recall of "' + inc.name + '" executed: $' + cost.toLocaleString('en-US') + '.'), LOG_TYPES.success);
        } else {
            a.stats.campaigns += 1;
            this.state.addReputation(INCIDENT.campaignRepBonus);
            this.state.addLog(_L('Kampanye servis gratis "' + inc.name + '" berjalan: $' + cost.toLocaleString('en-US') + '.', 'Free service campaign for "' + inc.name + '" started: $' + cost.toLocaleString('en-US') + '.'), LOG_TYPES.success);
        }
        bus.emit('aftersales:resolved', { id: inc.id, choice: choice, cost: cost });
        bus.emit('state:changed', this.state.data);
        return { ok: true, cost: cost };
    }

    // ---------------------------------------------------------------- efek permintaan
    getDemandFactor(p) {
        try {
            if (!p || !p.id) return 1;
            var a = this._a(), pol = this.getPolicy(p.id);
            var opt = WARRANTY_OPTIONS.filter(function (o) { return o.months === pol.warranty; })[0];
            var warrantyF = opt ? opt.demand : 1;
            var serviceF = 1 + _clamp((a.satisfaction - 60) / 100, -0.25, 0.15) * 0.25;
            var osF = 1 + (pol.osYears - OS_YEARS_DEFAULT) * 0.012;
            var st = a.stigma[p.id];
            var stigmaF = st && st.untilAbs > this._now() ? 1 - _clamp(st.amount, 0, 0.3) : 1;
            return _clamp(warrantyF * serviceF * osF * stigmaF, 0.7, 1.12);
        } catch (e) { return 1; }
    }

    // ---------------------------------------------------------------- ringkasan UI
    getSummary() {
        var a = this._a(), self = this;
        var pv = this.previewMonth();
        return {
            level: this.getLevel(), satisfaction: a.satisfaction, backlog: a.backlog, preview: pv,
            stats: a.stats, month: a.month, history: a.history,
            levels: SERVICE_LEVELS.map(function (def) {
                return {
                    id: def.id, def: def, active: a.level === def.id, unlocked: self.isLevelUnlocked(def.id),
                    setupCost: self.getSetupCost(def.id), monthlyCost: self.getMonthlyCost(def.id)
                };
            }),
            products: this._catalog().map(function (p) {
                var pol = self.getPolicy(p.id);
                var row = pv.perProduct.filter(function (r) { return r.id === p.id; })[0] || {};
                return {
                    id: p.id, name: p.name, status: p.status, warranty: pol.warranty, osYears: pol.osYears, lockLeft: self.policyLockLeft(p.id),
                    inForce: row.inForce || 0, annualRate: self.annualFailureRate(p), osCost: row.osCost || 0, demandFactor: self.getDemandFactor(p)
                };
            }),
            incidents: a.incidents.filter(function (i) { return i.status === 'open'; }).map(function (i) {
                return { id: i.id, name: i.name, sev: i.sev, affectedUnits: i.affectedUnits, monthsLeft: Math.max(0, i.deadlineAbs - self._now()),
                    recallCost: self.incidentCost(i, 'recall'), campaignCost: self.incidentCost(i, 'campaign') };
            })
        };
    }
}

export { SERVICE_LEVELS, WARRANTY_OPTIONS, OS_YEARS_MIN, OS_YEARS_MAX };
