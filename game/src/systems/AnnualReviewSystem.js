// FILE: src/systems/AnnualReviewSystem.js  (BARU — Rapor Tahunan + Target Dewan)
// ============================================================
// Tiap 1 Januari game:
//   1. menutup periode tahun lalu: hitung omzet, pangsa pasar rata-rata, peringkat,
//      kekayaan bersih, lalu menilai 3 target dewan (nilai S/A/B/C/D);
//   2. menerapkan hadiah/hukuman nilai (kas, reputasi, pengali permintaan sementara);
//   3. meminta pemain memilih 1 Fokus Strategis, yang juga menentukan target dewan
//      tahun berikutnya.
//
// State baru: data.annual (dilengkapi otomatis oleh ensureAnnualState, aman untuk save lama):
//   baseline { year, month, netWorth, productSold:{id:n}, reputation }  awal periode berjalan
//   targets  { year, revenue, share, netWorth, focusId, rival } | null  target periode berjalan
//            rival = { id, name, baseShare } | undefined (Rival Tahunan, target ke-4; save lama tanpa rival tetap 3 target)
//   focus    { id, year } | null
//   pending  laporan yang menunggu keputusan fokus | null
//   history  [{ year, grade, avgRatio, revenueAnnual, avgShare, rank, netWorth, passed, focusId, rivalId, rivalBeaten }]
//
// UI TIDAK ada di sini: sistem hanya memancarkan 'annual:pending' dan 'annual:resolved'.
// Semua angka balance ada di src/data/annual-review.data.js.
// Pengali permintaan memakai slot `events.mods` milik EraEventSystem (sudah dibaca ProductSystem).
// ============================================================
import { bus } from '../core/EventBus.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { LOG_TYPES } from '../config/constants.js';
import { ENDGAME } from '../config/endgame.config.js';
import { ToastService } from '../core/ToastService.js';
import { LanguageService } from '../core/LanguageService.js';
import { WalletService } from './WalletService.js';
import { ensureEraEventState } from './EraEventSystem.js';
import {
    ANNUAL_CONFIG, FOCUS_OPTIONS, TARGET_KEYS, SCALE_BASE_REVENUE, SCALE_MAX, getFocusById
} from '../data/annual-review.data.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;

function _abs(y, m) { return (Number(y) || 0) * 12 + (Number(m) || 1); }
function _lang() { try { return LanguageService.getLang() === 'id' ? 'id' : 'en'; } catch (e) { return 'en'; } }
function _L(o) { return o == null ? '' : (typeof o === 'string' ? o : (o[_lang()] || o.en || o.id || '')); }
function _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function _num(v) { v = Number(v); return isFinite(v) ? v : 0; }

// ---------------------------------------------------------------- state

export function ensureAnnualState(data) {
    if (!data.annual || typeof data.annual !== 'object') data.annual = {};
    var a = data.annual;
    if (a.baseline === undefined) a.baseline = null;
    if (a.targets === undefined) a.targets = null;
    if (a.focus === undefined) a.focus = null;
    if (a.pending === undefined) a.pending = null;
    if (!Array.isArray(a.history)) a.history = [];
    return a;
}

// ---------------------------------------------------------------- fungsi murni (dipakai UI & tes)

// Kekayaan bersih: kas + simpanan bank - sisa pinjaman. (Portofolio saham tidak dihitung,
// sama seperti skor akhir musim.)
export function computeNetWorth(data) {
    var cash = _num(data.cash);
    var fin = data.finance || {};
    var debt = 0, dep = 0;
    (fin.loans || []).forEach(function (l) { debt += _num(l && l.remaining); });
    var deposits = (fin.bank && fin.bank.deposits) || [];
    deposits.forEach(function (x) { dep += _num(x && x.balance); });
    return Math.round(cash + dep - debt);
}

// Skala bisnis dari omzet bulanan rata-rata (1x..SCALE_MAX).
export function computeScale(avgMonthlyRevenue) {
    return _clamp(_num(avgMonthlyRevenue) / SCALE_BASE_REVENUE, 1, SCALE_MAX);
}

// Berapa bulan (1..12) yang tercakup sejak awal periode.
export function monthsCovered(data, baseline) {
    if (!baseline) return 12;
    var n = _abs(data.time.currentYear, data.time.currentMonth) - _abs(baseline.year, baseline.month);
    return _clamp(n, 0, 12);
}

// Metrik n bulan terakhir dari market.shareHistory (entri terbaru di indeks 0).
export function computePeriodMetrics(data, n) {
    var hist = ((data.market && data.market.shareHistory) || []).slice(0, Math.max(0, n));
    var months = hist.length;
    var revenue = 0, shareSum = 0;
    var compSum = {};
    hist.forEach(function (h) {
        revenue += _num(h.playerRevenue);
        shareSum += _num(h.playerShare);
        (h.competitors || []).forEach(function (c) { compSum[c.id] = (compSum[c.id] || 0) + _num(c.share); });
    });
    var avgShare = months ? shareSum / months : 0;
    var names = {};
    ((data.market && data.market.competitors) || []).forEach(function (c) { names[c.id] = c.name; });
    var rivals = Object.keys(compSum).map(function (id) {
        return { id: id, name: names[id] || id, share: months ? compSum[id] / months : 0 };
    }).filter(function (r) { return r.share > 0; }).sort(function (x, y) { return y.share - x.share; });
    var rank = 1 + rivals.filter(function (r) { return r.share > avgShare; }).length;
    var rivalShares = {};
    rivals.forEach(function (r) { rivalShares[r.id] = r.share; });
    return { months: months, revenue: revenue, avgShare: avgShare, rank: rank, brands: rivals.length + 1, topRival: rivals[0] || null, rivals: rivals, rivalShares: rivalShares };
}

function _productSoldMap(data) {
    var map = {};
    ((data.products && data.products.catalog) || []).forEach(function (p) { if (p && p.id) map[p.id] = _num(p.totalSold); });
    return map;
}

// Unit terjual dan ponsel terlaris sejak awal periode.
export function computeUnits(data, baseline) {
    var base = (baseline && baseline.productSold) || {};
    var total = 0, best = null;
    ((data.products && data.products.catalog) || []).forEach(function (p) {
        if (!p || !p.id) return;
        var delta = Math.max(0, _num(p.totalSold) - _num(base[p.id]));
        total += delta;
        if (delta > 0 && (!best || delta > best.units)) best = { name: p.name || p.id, units: delta };
    });
    return { units: total, best: best };
}

// Rival Tahunan: pesaing terdekat di atas pemain (sulit melewati beberapa tingkat); bila tak ada yang di atas,
// pesaing terkuat. `rivals` urut pangsa menurun. `activeIds` (opsional) membatasi ke merek yang masih aktif.
export function pickRival(rivals, avgShare, difficulty, activeIds) {
    var R = ANNUAL_CONFIG.rival;
    if (!R || !R.enabled) return null;
    var pool = (rivals || []).filter(function (r) {
        return r && r.share > 0 && (!activeIds || activeIds.indexOf(r.id) >= 0);
    });
    var big = pool.filter(function (r) { return r.share >= R.minShare; });
    if (big.length) pool = big;
    if (!pool.length) return null;
    var above = pool.filter(function (r) { return r.share > avgShare; }).sort(function (a, b) { return a.share - b.share; });
    var pick;
    if (above.length) {
        var skip = (R.skipAbove && R.skipAbove[difficulty]) || 0;
        pick = above[Math.min(skip, above.length - 1)];
    } else {
        pick = pool.slice().sort(function (a, b) { return b.share - a.share; })[0];
    }
    return { id: pick.id, name: pick.name, baseShare: pick.share };
}

// Item penilaian rival untuk periode berjalan atau yang ditutup. Rival yang sudah tak ada (share 0) = otomatis lulus.
function _rivalItem(rival, metrics) {
    var rs = _num(metrics.rivalShares && metrics.rivalShares[rival.id]);
    var actual = metrics.avgShare;
    var withdrawn = rs <= 0;
    var ratio = withdrawn ? 1 : _clamp(actual / rs, 0, 2);
    return { key: 'rival', target: rs, actual: actual, ratio: ratio, passed: withdrawn || actual >= rs,
             rivalId: rival.id, rivalName: rival.name, withdrawn: withdrawn };
}

function _activeIds(data) {
    return ((data.market && data.market.competitors) || []).map(function (c) { return c.id; });
}

function _diffKey(data, table) {
    var k = data && data.difficulty;
    return (table && table[k] !== undefined) ? k : 'normal';
}

function _roundTarget(key, v) {
    if (key === 'share') return Math.max(0.0001, Math.round(v * 10000) / 10000);
    if (key === 'revenue') return Math.max(1000, Math.round(v / 1000) * 1000);
    return Math.round(v);
}

// Target dewan. `last` = { revenueAnnual, avgShare } periode sebelumnya atau null (tahun pertama).
// `index` = jumlah rapor yang sudah ada (menentukan faktor kekayaan bersih).
export function buildTargets(data, last, index, baselineNetWorth, focusId) {
    var C = ANNUAL_CONFIG;
    var dk = _diffKey(data, C.growth.revenue);
    var revenue, share;
    if (!last) {
        revenue = C.firstYear.revenue[dk];
        share = C.firstYear.share[dk];
    } else {
        revenue = Math.max(C.floors.revenue[dk], _num(last.revenueAnnual) * C.growth.revenue[dk]);
        share = Math.max(C.floors.share, _num(last.avgShare) * C.growth.share[dk]);
    }
    var arr = C.netWorthFactorByIndex;
    var f = arr[Math.min(Math.max(0, index), arr.length - 1)];
    var base = _num(baselineNetWorth);
    var nw = base + Math.abs(base) * (f - 1);

    var focus = focusId ? getFocusById(focusId) : null;
    var tm = (focus && focus.targetMult) || {};
    revenue *= (tm.revenue || 1);
    share *= (tm.share || 1);
    nw = nw >= 0 ? nw * (tm.netWorth || 1) : nw / (tm.netWorth || 1);

    return {
        revenue: _roundTarget('revenue', revenue),
        share: _roundTarget('share', share),
        netWorth: _roundTarget('netWorth', nw)
    };
}

// Nilai tiap target. `targets` memakai angka setahun penuh; omzet diprorata bila periode < 12 bulan.
export function evaluateTargets(targets, metrics, netWorth, months) {
    var items = TARGET_KEYS.map(function (key) {
        var target = _num(targets[key]);
        var actual = key === 'revenue' ? metrics.revenue : (key === 'share' ? metrics.avgShare : netWorth);
        if (key === 'revenue' && months > 0 && months < 12) target = target * months / 12;
        var ratio;
        if (target > 0) ratio = _clamp(actual / target, 0, 2);
        else ratio = actual >= target ? 1 : 0;
        return { key: key, target: target, actual: actual, ratio: ratio, passed: actual >= target };
    });
    if (targets.rival) items.push(_rivalItem(targets.rival, metrics));
    var avg = items.reduce(function (s, it) { return s + it.ratio; }, 0) / items.length;
    return { items: items, avgRatio: avg };
}

export function gradeFor(avgRatio) {
    var g = ANNUAL_CONFIG.grades;
    for (var i = 0; i < g.length; i++) if (avgRatio >= g[i].min) return g[i].id;
    return g[g.length - 1].id;
}

// Data kartu "Target Dewan" untuk Home (null bila tidak ada target aktif).
export function getBoardCardData(data) {
    var a = data && data.annual;
    if (!a || !a.targets || a.pending) return null;
    var k = monthsCovered(data, a.baseline);
    var m = computePeriodMetrics(data, k);
    var nw = computeNetWorth(data);
    var items = TARGET_KEYS.map(function (key) {
        var target = _num(a.targets[key]);
        var actual = key === 'revenue' ? m.revenue : (key === 'share' ? m.avgShare : nw);
        var hasData = key === 'netWorth' ? true : m.months > 0;
        var ratio = target > 0 ? _clamp(actual / target, 0, 1.5) : (actual >= target ? 1 : 0);
        return { key: key, target: target, actual: actual, hasData: hasData, ratio: ratio, passed: hasData && actual >= target };
    });
    if (a.targets.rival) {
        var ri = _rivalItem(a.targets.rival, m);
        ri.hasData = m.months > 0;
        ri.ratio = ri.target > 0 ? _clamp(ri.actual / ri.target, 0, 1.5) : 1;
        ri.passed = ri.hasData && ri.passed;
        items.push(ri);
    }
    return { year: a.targets.year, months: k, items: items, focusId: a.targets.focusId || null };
}

// ---------------------------------------------------------------- sistem

export class AnnualReviewSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
        this._announced = false;
    }

    start() {
        ensureAnnualState(this.state.data);
        this._unsubs.push(bus.on('time:year-changed', (snap) => this._onYear(snap)));
        this._unsubs.push(bus.on('time:day-changed', () => this._onDay()));
        this._unsubs.push(bus.on('state:hydrated', () => { ensureAnnualState(this.state.data); this._announced = false; this._init(); this._tryOpen(); }));
        this._init();
        this._tryOpen();
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    _canRun() {
        var d = this.state.data;
        if (d.gameOver) return false;
        var tu = d.tutorial;
        if (tu && !tu.completed && !tu.skipped) return false;
        return true;
    }

    _onDay() {
        this._init();                       // game baru setelah reset: siapkan target periode pertama
        if (this._canRun()) this._tryOpen();
    }

    // Siapkan baseline + target periode berjalan bila belum ada (game baru atau save lama).
    _init() {
        var d = this.state.data;
        var a = ensureAnnualState(d);
        if (a.targets || a.pending || d.gameOver) return;
        var nw = computeNetWorth(d);
        a.baseline = {
            year: d.time.currentYear, month: d.time.currentMonth, netWorth: nw,
            productSold: _productSoldMap(d), reputation: _num(d.market && d.market.reputation)
        };
        // Save lama di tengah game: pakai capaian 12 bulan terakhir sebagai acuan, bukan angka tahun pertama.
        var last = null, index = a.history.length;
        var hist = ((d.market && d.market.shareHistory) || []).slice(0, 12);
        var rev = hist.reduce(function (s, h) { return s + _num(h.playerRevenue); }, 0);
        if (!a.history.length && hist.length >= 3 && rev > 0) {
            var sh = hist.reduce(function (s, h) { return s + _num(h.playerShare); }, 0) / hist.length;
            last = { revenueAnnual: rev * 12 / hist.length, avgShare: sh };
            index = 1;
        } else if (a.history.length) {
            last = a.history[a.history.length - 1];
        }
        var t = buildTargets(d, last, index, nw, a.focus && a.focus.id);
        a.targets = { year: d.time.currentYear, revenue: t.revenue, share: t.share, netWorth: t.netWorth, focusId: a.focus ? a.focus.id : null };
        if (last && hist.length >= 3) {
            var mm = computePeriodMetrics(d, 12);
            var rv = pickRival(mm.rivals, mm.avgShare, d.difficulty, _activeIds(d));
            if (rv) a.targets.rival = rv;
        }
        bus.emit('state:changed', d);
    }

    // ---------------------------------------------------------------- penutupan periode

    _onYear(snap) {
        var d = this.state.data;
        if (d.gameOver) return;
        if (snap && snap.currentYear > ENDGAME.endYear) return;   // musim berakhir: layar akhir yang tampil
        var a = ensureAnnualState(d);
        if (a.pending) return;
        if (!a.targets && !a.baseline) { this._init(); return; }
        a.pending = this._closePeriod(d, a);
        this._announced = false;
        bus.emit('state:changed', d);
        this._tryOpen();
    }

    _closePeriod(d, a) {
        var C = ANNUAL_CONFIG;
        var months = Math.max(1, monthsCovered(d, a.baseline));
        var m = computePeriodMetrics(d, months);
        var nw = computeNetWorth(d);
        var u = computeUnits(d, a.baseline);
        var scale = computeScale(m.months ? m.revenue / m.months : 0);
        var prev = a.history.length ? a.history[a.history.length - 1] : null;
        var grace = a.history.length < C.graceReports;
        var closedYear = a.targets ? a.targets.year : (d.time.currentYear - 1);

        var report = {
            year: closedYear, months: months, scale: scale, grace: grace,
            revenue: m.revenue, revenueAnnual: m.months ? m.revenue * 12 / m.months : 0,
            avgShare: m.avgShare, rank: m.rank, brands: m.brands, topRival: m.topRival,
            prevRank: prev ? prev.rank : null,
            netWorth: nw, netWorthStart: a.baseline ? a.baseline.netWorth : nw,
            units: u.units, bestPhone: u.best,
            reputation: _num(d.market && d.market.reputation), reputationStart: a.baseline ? a.baseline.reputation : null,
            graded: false, items: [], avgRatio: 0, grade: null, effects: null,
            nextYear: d.time.currentYear,
            rival: null,
            rivalsTop: m.rivals.slice(0, 8).map(function (r) { return { id: r.id, name: r.name, share: r.share }; })
        };

        if (a.targets) {
            var ev = evaluateTargets(a.targets, m, nw, months);
            report.graded = true;
            report.items = ev.items;
            report.avgRatio = ev.avgRatio;
            report.grade = gradeFor(ev.avgRatio);
            var ri = ev.items.filter(function (it) { return it.key === 'rival'; })[0];
            if (ri) report.rival = { id: ri.rivalId, name: ri.rivalName, beaten: ri.passed, withdrawn: ri.withdrawn, playerShare: ri.actual, rivalShare: ri.target };
            report.effects = this._applyGradeEffects(d, report);
            if (report.rival && report.rival.beaten && !report.rival.withdrawn) {
                this.state.addLog((_lang() === 'id' ? 'Kamu mengalahkan rival tahunan: ' : 'You beat your annual rival: ') + report.rival.name + '.', LOG_TYPES.info);
            }
            this.state.addLog((_lang() === 'id' ? 'Rapor ' : 'Annual report ') + closedYear + ': ' +
                (_lang() === 'id' ? 'nilai ' : 'grade ') + report.grade + '.', LOG_TYPES.info);
        }

        a.history.push({
            year: closedYear, grade: report.grade, avgRatio: report.avgRatio,
            revenueAnnual: report.revenueAnnual, avgShare: report.avgShare, rank: report.rank,
            netWorth: nw, passed: report.items.filter(function (i) { return i.passed; }).length,
            focusId: a.targets ? a.targets.focusId : null,
            rivalId: report.rival ? report.rival.id : null,
            rivalBeaten: report.rival ? !!report.rival.beaten : null
        });
        if (a.history.length > C.historyMax) a.history.splice(0, a.history.length - C.historyMax);

        // Periode baru dimulai sekarang; target baru dibuat setelah pemain memilih fokus.
        a.baseline = {
            year: d.time.currentYear, month: d.time.currentMonth, netWorth: nw,
            productSold: _productSoldMap(d), reputation: _num(d.market && d.market.reputation)
        };
        a.targets = null;
        return report;
    }

    _applyGradeEffects(d, report) {
        var C = ANNUAL_CONFIG;
        var fx = C.gradeEffects[report.grade] || {};
        var cash = Math.round(_num(fx.cash) * report.scale);
        var rep = _num(fx.reputation);
        var demand = (fx.demand || []).slice();
        // Bonus mengalahkan rival (selalu positif, berlaku juga di masa percobaan).
        var win = (C.rival && C.rival.winEffects) || {};
        var winRep = 0, winCash = 0;
        if (report.rival && report.rival.beaten && !report.rival.withdrawn) {
            winCash = Math.round(_num(win.cash) * report.scale);
            winRep = _num(win.reputation);
        }
        if (report.grace && C.graceKeepsOnlyPositive) {
            if (rep < 0) rep = 0;
            demand = [];
        }
        cash += winCash; rep += winRep;
        if (cash) this.state.addCash(cash);
        if (rep) this.state.addReputation(rep);
        this._pushMods(d, 'annual_grade:' + report.year, demand);
        return { cash: cash, reputation: rep, demand: demand };
    }

    _pushMods(d, eventId, demand) {
        if (!demand || !demand.length) return;
        var ev = ensureEraEventState(d);
        var now = d.time.elapsedGameMinutes;
        demand.forEach(function (m) {
            ev.mods.push({
                eventId: eventId, scope: m.scope || 'all', mult: m.mult,
                untilMinute: now + Math.round((m.days || 0) * MINUTES_PER_DAY)
            });
        });
    }

    // ---------------------------------------------------------------- pengumuman ke UI

    _tryOpen() {
        if (!this._canRun()) return;
        var a = ensureAnnualState(this.state.data);
        if (!a.pending) return;
        if (this._announced) return;
        this._announced = true;
        bus.emit('annual:pending', { report: a.pending });
    }

    reannounce() { this._announced = false; this._tryOpen(); }
    retryLater() { this._announced = false; }
    getPending() { return ensureAnnualState(this.state.data).pending; }

    // ---------------------------------------------------------------- fokus strategis

    // Biaya & efek fokus setelah dikalikan skala laporan (untuk UI dan pembayaran).
    getFocusPreview(report) {
        var scale = (report && report.scale) || 1;
        return FOCUS_OPTIONS.map(function (f) {
            return {
                def: f,
                cost: Math.round(f.cost * scale),
                cash: Math.round(_num(f.effects.cash) * scale),
                reputation: _num(f.effects.reputation),
                demand: f.effects.demand || [],
                targetMult: f.targetMult || {}
            };
        });
    }

    // Target dasar tahun berikutnya (tanpa pengali fokus), untuk ditampilkan sebelum memilih.
    previewBaseTargets() {
        var d = this.state.data, a = ensureAnnualState(d);
        var last = a.history.length ? a.history[a.history.length - 1] : null;
        var base = a.baseline ? a.baseline.netWorth : computeNetWorth(d);
        return buildTargets(d, last, a.history.length, base, null);
    }

    // Rival yang akan ditunjuk dewan untuk tahun berikutnya (untuk ditampilkan sebelum memilih fokus).
    previewRival() {
        var d = this.state.data, a = ensureAnnualState(d);
        if (!a.pending) return null;
        return pickRival(a.pending.rivalsTop, a.pending.avgShare, d.difficulty, _activeIds(d));
    }

    canChooseFocus(focusId) {
        var a = ensureAnnualState(this.state.data);
        if (!a.pending) return { ok: false, reason: 'not-pending' };
        var p = this.getFocusPreview(a.pending).find(function (x) { return x.def.id === focusId; });
        if (!p) return { ok: false, reason: 'invalid' };
        if (p.cost > 0 && !WalletService.canAfford(p.cost)) return { ok: false, reason: 'funds' };
        return { ok: true };
    }

    chooseFocus(focusId) {
        var d = this.state.data;
        var a = ensureAnnualState(d);
        if (!a.pending) return { ok: false, reason: 'not-pending' };
        var report = a.pending;
        var p = this.getFocusPreview(report).find(function (x) { return x.def.id === focusId; });
        if (!p) return { ok: false, reason: 'invalid' };

        if (p.cost > 0) {
            if (!WalletService.canAfford(p.cost)) return { ok: false, reason: 'funds' };
            WalletService.pay(p.cost, 'annual-focus:' + focusId);
        }
        if (p.cash) this.state.addCash(p.cash);
        if (p.reputation) this.state.addReputation(p.reputation);
        this._pushMods(d, 'annual_focus:' + focusId + ':' + report.nextYear, p.demand);

        var last = a.history.length ? a.history[a.history.length - 1] : null;
        var baseNW = a.baseline ? a.baseline.netWorth : computeNetWorth(d);
        var t = buildTargets(d, last, a.history.length, baseNW, focusId);
        a.targets = { year: report.nextYear, revenue: t.revenue, share: t.share, netWorth: t.netWorth, focusId: focusId };
        var rv = pickRival(report.rivalsTop, report.avgShare, d.difficulty, _activeIds(d));
        if (rv) a.targets.rival = rv;
        a.focus = { id: focusId, year: report.nextYear };
        a.pending = null;
        this._announced = false;

        var label = _L(p.def.label);
        this.state.addLog((_lang() === 'id' ? 'Fokus strategis ' : 'Strategic focus ') + report.nextYear + ': ' + label + '.', LOG_TYPES.info);
        if (rv) this.state.addLog((_lang() === 'id' ? 'Rival tahun ' : 'Rival for ') + report.nextYear + ': ' + rv.name + '.', LOG_TYPES.info);
        ToastService.success((_lang() === 'id' ? 'Fokus dipilih: ' : 'Focus chosen: ') + label);
        bus.emit('annual:resolved', { report: report, focusId: focusId, targets: a.targets });
        bus.emit('state:changed', d);
        return { ok: true, focus: p, targets: a.targets, outcome: _L(p.def.outcome) };
    }

    // Dipanggil UI setelah layar hasil ditutup.
    advance() { this._tryOpen(); }
}
