// FILE: src/systems/AppStoreReviewSystem.js  (BARU — Peninjauan App Store)
// ============================================================
// Developer game dan aplikasi mengirim karyanya ke App Store milik pemain. Pemain memeriksa antrean,
// lalu MENYETUJUI atau MENOLAK (dengan alasan). Keputusan memengaruhi:
//   - katalog aplikasi: belanja kotor App Store (lewat getStoreFactor(), dipakai EcosystemSystem)
//   - goodwill komunitas developer: laju pengiriman dan daya tarik toko
//   - insiden: aplikasi berbahaya yang lolos bisa menjadi insiden, lalu skandal bila dibiarkan
//
// Syarat aktif: OS pemain punya fitur App Store (fw_appstore), sama seperti EcosystemSystem.
// Netral bila belum ada aktivitas: getStoreFactor() = 1, jadi save lama tidak berubah.
//
// Alur uang: biaya pendaftaran developer masuk kas saat pengiriman diputuskan. Biaya pemindai bulanan
// dikembalikan lewat getMonthlyCost() dan dijumlahkan EcosystemSystem.processMonth() (sekali per bulan).
//
// State di state.data.appStoreReview (dibuat otomatis, lihat ensureAppReviewState).
// Event bus: 'appreview:submitted', 'appreview:decided', 'appreview:incident', 'appreview:changed'.
// ============================================================
import { bus } from '../core/EventBus.js';
import { t } from '../core/LanguageService.js';
import { ToastService } from '../core/ToastService.js';
import { WalletService } from './WalletService.js';
import { computeOsAdoption } from './OsAdoptionModel.js';
import { formatCurrency } from '../utils/format.js';
import { ECO_CONST } from '../data/ecosystem.data.js';
import {
    ASR_CONST, ASR_DEV_TYPES, ASR_DEV_TYPE_IDS, ASR_FLAGS, ASR_FLAG_IDS, ASR_REASONS,
    ASR_CATEGORIES, ASR_MODELS, ASR_NAME_PARTS, getAsrCategory
} from '../data/appstore-review.data.js';

var AS_SCALE_BASE = 30000;   // sama dengan EcosystemSystem: pendapatan 3 bulan rata-rata = skala 1
var AS_SCALE_MAX = 300;

function _abs(y, m) { return (Number(y) || 0) * 12 + (Number(m) || 1); }
function _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function _num(v, d) { v = Number(v); return isFinite(v) ? v : (d || 0); }
function _nice(v) { var a = Math.abs(v); var step = a >= 100000 ? 1000 : 100; return Math.round(a / step) * step; }
function _rand(lo, hi) { return lo + Math.random() * (hi - lo); }
function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function _nowAbs(data) { var tm = data.time || {}; return _abs(tm.currentYear, tm.currentMonth); }

function _pickWeighted(items) {
    var total = 0, i;
    for (i = 0; i < items.length; i++) total += items[i].weight;
    var r = Math.random() * total;
    for (i = 0; i < items.length; i++) { r -= items[i].weight; if (r <= 0) return items[i]; }
    return items[items.length - 1];
}

// Fitur OS di versi yang sedang dipakai (sama dengan EcosystemSystem._hasOsFeature).
function _hasOsFeature(data, fid) {
    var os = data.os || {};
    var vs = Array.isArray(os.versions) ? os.versions : [];
    var cur = null;
    for (var i = 0; i < vs.length; i++) if (vs[i].id === os.currentVersionId) cur = vs[i];
    if (!cur && vs.length) cur = vs[vs.length - 1];
    return !!(cur && Array.isArray(cur.features) && cur.features.indexOf(fid) >= 0);
}

function _storeAvailable(data) { return _hasOsFeature(data, ECO_CONST.appStoreFeatureId); }

function _scale(data) {
    var rh = (data.market && data.market.revenueHistory) || [];
    var sum = 0, n = 0;
    for (var i = 0; i < Math.min(3, rh.length); i++) { sum += _num(rh[i] && rh[i].playerRevenue); n++; }
    return _clamp((n ? sum / n : 0) / AS_SCALE_BASE, 1, AS_SCALE_MAX);
}

function _commission(data) {
    var st = data.ecosystem && data.ecosystem.store;
    return _clamp(_num(st && st.commission, ECO_CONST.commissionDefault), ECO_CONST.commissionMin, ECO_CONST.commissionMax);
}

// State peninjauan. Aman untuk save lama: dibuat dengan default bila belum ada.
export function ensureAppReviewState(data) {
    if (!data.appStoreReview || typeof data.appStoreReview !== 'object') data.appStoreReview = {};
    var r = data.appStoreReview;
    if (!r.policy || typeof r.policy !== 'object') r.policy = {};
    var p = r.policy;
    if (ASR_CONST.scanLevels.indexOf(p.scan) < 0) p.scan = 'off';
    if (ASR_CONST.scanLevels.indexOf(p.scanPaid) < 0) p.scanPaid = p.scan;   // level tertinggi yang sudah dibayar
    p.fee = _clamp(Math.round(_num(p.fee, 0)), 0, ASR_CONST.feeSteps.length - 1);
    if (typeof p.autoTrusted !== 'boolean') p.autoTrusted = false;
    r.goodwill = _clamp(_num(r.goodwill, ASR_CONST.goodwillStart), 0, 100);
    if (typeof r.nextId !== 'number' || !isFinite(r.nextId) || r.nextId < 1) r.nextId = 1;
    if (typeof r.nextDevId !== 'number' || !isFinite(r.nextDevId) || r.nextDevId < 1) r.nextDevId = 1;
    ['queue', 'catalog', 'incidents', 'history'].forEach(function (k) { if (!Array.isArray(r[k])) r[k] = []; });
    if (!r.devs || typeof r.devs !== 'object' || Array.isArray(r.devs)) r.devs = {};
    if (!r.stats || typeof r.stats !== 'object') r.stats = {};
    ['received', 'approved', 'rejected', 'expired', 'lost', 'flaggedCaught', 'flaggedMissed', 'wrongRejects',
        'feesEarned', 'takedowns', 'scandals', 'banned', 'inspected', 'finesPaid'].forEach(function (k) {
        if (typeof r.stats[k] !== 'number' || !isFinite(r.stats[k])) r.stats[k] = 0;
    });
    if (typeof r.malusUntilAbs !== 'number' || !isFinite(r.malusUntilAbs)) r.malusUntilAbs = 0;
    if (typeof r.lastScandalAbs !== 'number' || !isFinite(r.lastScandalAbs)) r.lastScandalAbs = -999;
    if (typeof r.lastMonthAbs !== 'number' || !isFinite(r.lastMonthAbs)) r.lastMonthAbs = 0;
    return r;
}

export class AppStoreReviewSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        var self = this;
        ensureAppReviewState(this.state.data);
        this._unsubs.push(bus.on('time:day-changed', function () { self._onDay(); }));
        this._unsubs.push(bus.on('time:month-changed', function () { self._onMonth(); }));
        this._unsubs.push(bus.on('state:hydrated', function () { ensureAppReviewState(self.state.data); }));
    }

    stop() { this._unsubs.forEach(function (u) { u(); }); this._unsubs = []; }

    _r() { return ensureAppReviewState(this.state.data); }
    _now() { return _nowAbs(this.state.data); }
    _scale() { return _scale(this.state.data); }

    isAvailable() { return _storeAvailable(this.state.data); }

    _canRun() {
        var d = this.state.data;
        if (d.gameOver) return false;
        return _storeAvailable(d);
    }

    _changed() { try { bus.emit('appreview:changed', {}); } catch (e) { /* abaikan */ } }

    _log(text, type) { try { this.state.addLog(text, type || 'info'); } catch (e) { /* abaikan */ } }

    _toast(kind, msg) { try { ToastService[kind](msg, 5000); } catch (e) { /* abaikan */ } }

    // ---------------------------------------------------------------- developer
    _newDev() {
        var r = this._r();
        var type = _pickWeighted(ASR_DEV_TYPE_IDS.map(function (id) { return ASR_DEV_TYPES[id]; })).id;
        var name = '';
        for (var tries = 0; tries < 6; tries++) {
            name = _pick(ASR_NAME_PARTS.devFirst) + ' ' + _pick(ASR_NAME_PARTS.devLast);
            var dup = false;
            for (var k in r.devs) if (r.devs[k].name === name) dup = true;
            if (!dup) break;
            if (tries === 5) name += ' ' + r.nextDevId;
        }
        var id = 'd' + (r.nextDevId++);
        var dev = {
            id: id, name: name, type: type, focus: Math.random() < 0.4 ? 'game' : 'app',
            rep: Math.round(_rand(ASR_CONST.repStart[0], ASR_CONST.repStart[1])),
            approved: 0, clean: 0, rejected: 0, flagged: 0, submitted: 0,
            banned: false, firstAbs: this._now(), lastAbs: this._now()
        };
        if (type === 'shady') dev.rep = Math.round(_rand(25, 55));
        r.devs[id] = dev;
        this._trimDevs(id);
        return dev;
    }

    _trimDevs(keepId) {
        var r = this._r();
        var ids = Object.keys(r.devs);
        if (ids.length <= ASR_CONST.devMax) return;
        var inUse = {};
        if (keepId) inUse[keepId] = true;   // developer yang baru dibuat belum ada di antrean
        r.queue.forEach(function (s) { inUse[s.devId] = true; });
        r.catalog.forEach(function (a) { inUse[a.devId] = true; });
        var cand = ids.filter(function (id) { return !inUse[id] && !r.devs[id].banned; });
        cand.sort(function (a, b) { return r.devs[a].lastAbs - r.devs[b].lastAbs; });
        while (Object.keys(r.devs).length > ASR_CONST.devMax && cand.length) delete r.devs[cand.shift()];
    }

    // Developer untuk sebuah id. Bila catatannya sudah terbuang, dibuat ulang agar keputusan tetap bisa diambil.
    _devOf(id) {
        var r = this._r();
        if (!r.devs[id]) {
            r.devs[id] = { id: id, name: '?', type: 'indie', focus: 'app', rep: 50, approved: 0, clean: 0, rejected: 0, flagged: 0,
                submitted: 0, banned: false, firstAbs: this._now(), lastAbs: this._now() };
        }
        return r.devs[id];
    }

    _isTrusted(dev) {
        return !!dev && !dev.banned && dev.rep >= ASR_CONST.trustedRep && dev.clean >= ASR_CONST.trustedApprovals;
    }

    _chooseDev() {
        var r = this._r();
        var pool = Object.keys(r.devs).map(function (id) { return r.devs[id]; }).filter(function (d) { return !d.banned; });
        // developer lama kembali dengan karya baru (peluang naik bila reputasinya baik)
        if (pool.length >= 4 && Math.random() < 0.55) {
            var weights = pool.map(function (d) { return { dev: d, weight: 1 + Math.max(0, d.rep) / 25 }; });
            return _pickWeighted(weights).dev;
        }
        return this._newDev();
    }

    // ---------------------------------------------------------------- laju kedatangan
    getArrivalRate() {
        var d = this.state.data, r = this._r();
        var users = _storeAvailable(d) ? (computeOsAdoption(d).activeUsers || 0) : 0;
        var years = Math.max(0, (Number((d.time || {}).currentYear) || 2008) - ASR_CONST.rateMinYear);
        var era = Math.min(ASR_CONST.rateEraCap, 1 + years * ASR_CONST.rateEraGrowth);
        var comm = _clamp(1 - (_commission(d) - ASR_CONST.rateCommissionBase) * ASR_CONST.rateCommissionSlope,
            ASR_CONST.rateCommissionMin, ASR_CONST.rateCommissionMax);
        var gw = ASR_CONST.goodwillRateMin + (ASR_CONST.goodwillRateMax - ASR_CONST.goodwillRateMin) * (r.goodwill / 100);
        var fee = 1 / (1 + ASR_CONST.feeSteps[r.policy.fee] / ASR_CONST.feeRateDivisor);
        var rate = (ASR_CONST.rateBase + Math.sqrt(users / ASR_CONST.rateUserScale) * ASR_CONST.rateUserWeight) * era * comm * gw * fee;
        return _clamp(rate, 0.2, ASR_CONST.rateMax);
    }

    // ---------------------------------------------------------------- harian: pengiriman baru
    _onDay() {
        if (!this._canRun()) return;
        var p = Math.min(0.9, this.getArrivalRate() / 30);
        if (Math.random() < p) this._generate();
    }

    _generate() {
        var d = this.state.data, r = this._r(), now = this._now();
        if (r.queue.length >= ASR_CONST.queueMax) {
            r.stats.lost += 1;
            r.goodwill = _clamp(r.goodwill - 0.5, 0, 100);
            return null;
        }
        var year = Number((d.time || {}).currentYear) || 2008;
        var dev = this._chooseDev();
        var dt = ASR_DEV_TYPES[dev.type] || ASR_DEV_TYPES.indie;

        var cats = ASR_CATEGORIES.filter(function (c) { return year >= c.minYear && c.kind === dev.focus; });
        if (!cats.length) cats = ASR_CATEGORIES.filter(function (c) { return year >= c.minYear; });
        var cat = _pickWeighted(cats);

        var quality = _clamp(Math.round(_rand(dt.q[0], dt.q[1]) + (dev.rep - 50) * 0.15), 5, 99);
        var flagChance = this._isTrusted(dev) ? ASR_CONST.trustedFlagChance : dt.flagChance;
        if (dev.rep < 30) flagChance *= 1.5;
        var flags = [];
        if (Math.random() < flagChance) {
            var pool = dev.type === 'shady' ? ['malware', 'scam', 'privacy', 'copyright', 'spam'] : ASR_FLAG_IDS;
            flags.push(_pick(pool));
            if (Math.random() < 0.15) {
                var second = _pick(pool);
                if (flags.indexOf(second) < 0) flags.push(second);
            }
            if (flags.indexOf('malware') >= 0) quality = Math.min(quality, 70);
        }
        // pemindai otomatis mendeteksi sebagian masalah saat pengiriman masuk
        var detect = ASR_CONST.scanDetect[r.policy.scan] || 0;
        var seen = flags.filter(function () { return Math.random() < detect; });

        var title = _pick(ASR_NAME_PARTS.appAdj) + ' ' + _pick(cat.titles);
        var sub = {
            id: r.nextId++, devId: dev.id, title: title, category: cat.id, model: _pick(ASR_MODELS),
            quality: quality, est: _clamp(Math.round(quality + _rand(-ASR_CONST.qualityNoise, ASR_CONST.qualityNoise)), 1, 100),
            flags: flags, seen: seen, inspected: false,
            submittedAbs: now, deadlineAbs: now + ASR_CONST.deadlineMonths
        };
        dev.submitted += 1;
        dev.lastAbs = now;
        r.stats.received += 1;

        if (r.policy.autoTrusted && this._isTrusted(dev)) {
            this._applyApprove(sub, dev, true);
            this._changed();
            return sub;
        }
        r.queue.push(sub);
        bus.emit('appreview:submitted', { id: sub.id });
        this._toast('info', t('asr.toast.submitted', { title: sub.title, dev: dev.name }));
        this._changed();
        return sub;
    }

    // ---------------------------------------------------------------- keputusan
    _find(id) {
        var q = this._r().queue;
        for (var i = 0; i < q.length; i++) if (q[i].id === id) return { sub: q[i], idx: i };
        return null;
    }

    _inspectCostNow() { return _nice(ASR_CONST.inspectCost * Math.sqrt(this._scale())); }

    _chargeFee() {
        var r = this._r();
        var fee = ASR_CONST.feeSteps[r.policy.fee] || 0;
        if (fee > 0) { this.state.addCash(fee); r.stats.feesEarned += fee; }
        return fee;
    }

    _pushHistory(entry) {
        var r = this._r();
        r.history.unshift(entry);
        if (r.history.length > ASR_CONST.historyMax) r.history.length = ASR_CONST.historyMax;
    }

    _addGoodwill(delta) {
        var r = this._r();
        r.goodwill = _clamp(r.goodwill + delta, 0, 100);
    }

    // Menambah aplikasi ke katalog. Dipakai oleh approve() dan persetujuan otomatis.
    _applyApprove(sub, dev, auto) {
        var r = this._r(), now = this._now();
        var flagged = sub.flags.length > 0;
        var low = sub.quality < ASR_CONST.lowQuality;
        r.catalog.unshift({
            id: sub.id, title: sub.title, category: sub.category, devId: dev.id, model: sub.model,
            quality: sub.quality, flags: sub.flags.slice(), approvedAbs: now,
            retireAbs: now + Math.round(_rand(ASR_CONST.appLifeMin, ASR_CONST.appLifeMax)),
            status: 'active'
        });
        if (r.catalog.length > ASR_CONST.catalogMax) {
            // buang yang sudah tidak aktif lebih dulu; bila tidak ada, buang yang terlama
            var drop = -1;
            for (var i = r.catalog.length - 1; i >= 0; i--) { if (r.catalog[i].status === 'removed' || r.catalog[i].status === 'retired') { drop = i; break; } }
            if (drop < 0) drop = r.catalog.length - 1;
            var gone = r.catalog.splice(drop, 1)[0];
            r.incidents = r.incidents.filter(function (x) { return x.appId !== gone.id; });
        }
        dev.approved += 1;
        r.stats.approved += 1;
        var outcome;
        if (flagged) { r.stats.flaggedMissed += 1; outcome = 'missed'; }
        else {
            dev.clean += 1;
            dev.rep = _clamp(dev.rep + (low ? 0 : ASR_CONST.repApprovedClean), 0, 100);
            if (low) outcome = 'junk';
            else { outcome = 'good'; if (sub.quality >= ASR_CONST.goodQuality) this._addGoodwill(ASR_CONST.approveBonus); }
        }
        var fee = this._chargeFee();
        this._pushHistory({ abs: now, title: sub.title, devName: dev.name, decision: 'approve', outcome: outcome, auto: !!auto, fee: fee });
        return outcome;
    }

    approve(id) {
        var f = this._find(id);
        if (!f) return { ok: false, reason: 'missing' };
        if (!this._canRun()) return { ok: false, reason: 'unavailable' };
        var r = this._r(), dev = this._devOf(f.sub.devId);
        r.queue.splice(f.idx, 1);
        var outcome = this._applyApprove(f.sub, dev, false);
        bus.emit('appreview:decided', { id: id, decision: 'approve', outcome: outcome });
        this._changed();
        return { ok: true, outcome: outcome };
    }

    // Alasan tepat bila cocok dengan masalah yang ada, atau 'quality' untuk aplikasi bermutu rendah.
    _reasonMatches(sub, reason) {
        if (reason === 'quality') return sub.quality < ASR_CONST.lowQuality;
        for (var i = 0; i < sub.flags.length; i++) if (ASR_FLAGS[sub.flags[i]].reason === reason) return true;
        return false;
    }

    reject(id, reason) {
        var f = this._find(id);
        if (!f) return { ok: false, reason: 'missing' };
        if (ASR_REASONS.indexOf(reason) < 0) return { ok: false, reason: 'badreason' };
        if (!this._canRun()) return { ok: false, reason: 'unavailable' };
        var r = this._r(), sub = f.sub, dev = this._devOf(sub.devId), now = this._now();
        r.queue.splice(f.idx, 1);
        dev.rejected += 1;
        r.stats.rejected += 1;

        var flagged = sub.flags.length > 0;
        var low = sub.quality < ASR_CONST.lowQuality;
        var match = this._reasonMatches(sub, reason);
        var outcome;
        if (flagged) {
            dev.flagged += 1;
            dev.rep = _clamp(dev.rep + ASR_CONST.repRejectedFlag, 0, 100);
            if (match) { r.stats.flaggedCaught += 1; outcome = 'caught'; }
            else { this._addGoodwill(-ASR_CONST.wrongReasonHit); outcome = 'caughtWrong'; }
        } else if (low) {
            dev.rep = _clamp(dev.rep + ASR_CONST.repRejectedLow, 0, 100);
            if (match) outcome = 'lowq';
            else { this._addGoodwill(-ASR_CONST.wrongReasonHit); outcome = 'lowWrong'; }
        } else {
            // menolak aplikasi yang sebenarnya layak
            r.stats.wrongRejects += 1;
            var hit = sub.quality >= ASR_CONST.goodQuality ? ASR_CONST.wrongRejectHit : ASR_CONST.wrongRejectHit / 2;
            this._addGoodwill(-hit);
            outcome = 'wrong';
            if (Math.random() < 0.3) {
                this._addGoodwill(-1);
                this._toast('warning', t('asr.toast.devComplains', { dev: dev.name, title: sub.title }));
                this._log(t('asr.log.devComplains', { dev: dev.name }), 'warning');
            }
        }
        var fee = this._chargeFee();
        this._pushHistory({ abs: now, title: sub.title, devName: dev.name, decision: 'reject', reason: reason, outcome: outcome, auto: false, fee: fee });
        bus.emit('appreview:decided', { id: id, decision: 'reject', outcome: outcome });
        this._changed();
        return { ok: true, outcome: outcome };
    }

    // Tinjauan manual: membuka mutu asli dan mencari masalah yang belum terdeteksi.
    inspect(id) {
        var f = this._find(id);
        if (!f) return { ok: false, reason: 'missing' };
        var sub = f.sub, r = this._r();
        if (sub.inspected) return { ok: false, reason: 'already' };
        var cost = this._inspectCostNow();
        if (!WalletService.canAfford(cost)) return { ok: false, reason: 'funds', cost: cost };
        WalletService.pay(cost, 'Tinjauan manual aplikasi: ' + sub.title);
        sub.inspected = true;
        r.stats.inspected += 1;
        var found = 0;
        sub.flags.forEach(function (fl) {
            if (sub.seen.indexOf(fl) >= 0) return;
            if (Math.random() < ASR_CONST.inspectDetect) { sub.seen.push(fl); found += 1; }
        });
        this._changed();
        return { ok: true, cost: cost, found: found };
    }

    // ---------------------------------------------------------------- insiden dan takedown
    takedown(appId) {
        var r = this._r();
        var app = null, i;
        for (i = 0; i < r.catalog.length; i++) if (r.catalog[i].id === appId) app = r.catalog[i];
        if (!app || app.status !== 'incident') return { ok: false, reason: 'missing' };
        app.status = 'removed';
        r.incidents = r.incidents.filter(function (x) { return x.appId !== appId; });
        r.stats.takedowns += 1;
        this._addGoodwill(-ASR_CONST.takedownHit);
        var dev = r.devs[app.devId];
        if (dev) dev.rep = _clamp(dev.rep + ASR_CONST.repRejectedFlag, 0, 100);
        this._pushHistory({ abs: this._now(), title: app.title, devName: dev ? dev.name : '?', decision: 'takedown', outcome: 'removed', auto: false, fee: 0 });
        this._changed();
        return { ok: true };
    }

    banDeveloper(devId) {
        var r = this._r(), dev = r.devs[devId];
        if (!dev) return { ok: false, reason: 'missing' };
        if (dev.banned) return { ok: false, reason: 'already' };
        dev.banned = true;
        dev.rep = Math.max(0, dev.rep + ASR_CONST.repBanned);
        r.stats.banned += 1;
        // pengiriman yang menunggu dari developer ini dibatalkan tanpa penalti tambahan
        r.queue = r.queue.filter(function (s) { return s.devId !== devId; });
        if (dev.flagged === 0) this._addGoodwill(-ASR_CONST.banCleanHit);
        this._pushHistory({ abs: this._now(), title: '-', devName: dev.name, decision: 'ban', outcome: dev.flagged > 0 ? 'justified' : 'unjustified', auto: false, fee: 0 });
        this._changed();
        return { ok: true, justified: dev.flagged > 0 };
    }

    unbanDeveloper(devId) {
        var r = this._r(), dev = r.devs[devId];
        if (!dev || !dev.banned) return { ok: false, reason: 'missing' };
        dev.banned = false;
        dev.rep = Math.max(dev.rep, 20);
        this._changed();
        return { ok: true };
    }

    // ---------------------------------------------------------------- kebijakan
    setScan(level) {
        var r = this._r(), p = r.policy;
        if (ASR_CONST.scanLevels.indexOf(level) < 0) return { ok: false, reason: 'unknown' };
        if (p.scan === level) return { ok: false, reason: 'same' };
        var idx = ASR_CONST.scanLevels.indexOf.bind(ASR_CONST.scanLevels);
        var cost = 0;
        if (idx(level) > idx(p.scanPaid)) {
            cost = _nice(ASR_CONST.scanSetup[level] * Math.sqrt(this._scale()));
            if (!WalletService.canAfford(cost)) return { ok: false, reason: 'funds', cost: cost };
            WalletService.pay(cost, 'Pemindai App Store: ' + level);
            p.scanPaid = level;
        }
        p.scan = level;
        this._changed();
        return { ok: true, cost: cost };
    }

    setFeeStep(dir) {
        var p = this._r().policy;
        if (!dir) return { ok: false, reason: 'same' };
        var next = _clamp(p.fee + (dir > 0 ? 1 : -1), 0, ASR_CONST.feeSteps.length - 1);
        if (next === p.fee) return { ok: false, reason: 'same' };
        p.fee = next;
        this._changed();
        return { ok: true };
    }

    toggleAutoTrusted() {
        var p = this._r().policy;
        p.autoTrusted = !p.autoTrusted;
        this._changed();
        return { ok: true, value: p.autoTrusted };
    }

    // ---------------------------------------------------------------- bulanan
    _onMonth() {
        if (!this._canRun()) return;
        var d = this.state.data, r = this._r(), now = this._now();
        if (now <= r.lastMonthAbs) return;   // penjaga: tidak dobel
        r.lastMonthAbs = now;
        var self = this;

        // 1. pengiriman kedaluwarsa
        var keep = [];
        r.queue.forEach(function (s) {
            if (s.deadlineAbs > now) { keep.push(s); return; }
            r.stats.expired += 1;
            self._addGoodwill(-ASR_CONST.expiryGoodwillHit);
            var dv = r.devs[s.devId];
            self._pushHistory({ abs: now, title: s.title, devName: dv ? dv.name : '?', decision: 'expired', outcome: 'expired', auto: true, fee: 0 });
        });
        var expired = r.queue.length - keep.length;
        r.queue = keep;
        if (expired > 0) this._toast('warning', t('asr.toast.expired', { n: expired }));

        // 2. insiden baru dari aplikasi bermasalah yang lolos
        r.catalog.forEach(function (app) {
            if (app.status !== 'active' || !app.flags.length) return;
            var danger = 0;
            app.flags.forEach(function (fl) { danger = Math.max(danger, ASR_FLAGS[fl].danger); });
            if (Math.random() >= ASR_CONST.incidentChanceMonthly * danger) return;
            app.status = 'incident';
            var flag = app.flags[0];
            r.incidents.push({ appId: app.id, flag: flag, sinceAbs: now });
            bus.emit('appreview:incident', { appId: app.id, flag: flag });
            self._toast('error', t('asr.toast.incident', { title: app.title, flag: t('asr.flag.' + flag) }));
            self._log(t('asr.log.incident', { title: app.title, flag: t('asr.flag.' + flag) }), 'danger');
        });

        // 3. insiden yang dibiarkan menjadi skandal
        var still = [];
        r.incidents.forEach(function (inc) {
            if (now - inc.sinceAbs < ASR_CONST.incidentEscalateMonths) { still.push(inc); return; }
            var app = null;
            for (var i = 0; i < r.catalog.length; i++) if (r.catalog[i].id === inc.appId) app = r.catalog[i];
            if (!app) return;
            app.status = 'removed';
            // denda hanya sekali per masa jeda; skandal beruntun tetap menarik aplikasi dan menurunkan goodwill
            var fresh = now - r.lastScandalAbs >= ASR_CONST.scandalCooldownMonths;
            var fine = fresh ? _nice(ASR_CONST.scandalFine * Math.sqrt(self._scale())) : 0;
            if (fine > 0) { self.state.addCash(-fine); r.stats.finesPaid += fine; }
            r.lastScandalAbs = now;
            r.stats.scandals += 1;
            r.malusUntilAbs = now + ASR_CONST.scandalMalusMonths;
            self._addGoodwill(fresh ? -ASR_CONST.scandalHit : -ASR_CONST.scandalHit / 2);
            self._toast('error', fine > 0 ? t('asr.toast.scandal', { title: app.title, fine: formatCurrency(fine) }) : t('asr.toast.scandalNoFine', { title: app.title }));
            self._log(fine > 0 ? t('asr.log.scandal', { title: app.title, fine: formatCurrency(fine) }) : t('asr.log.scandalNoFine', { title: app.title }), 'danger');
            self._pushHistory({ abs: now, title: app.title, devName: '', decision: 'scandal', outcome: 'fine', auto: true, fee: -fine });
        });
        r.incidents = still;

        // 4. aplikasi lama pensiun
        r.catalog.forEach(function (app) {
            if (app.status === 'active' && app.retireAbs <= now) app.status = 'retired';
        });

        // 5. goodwill kembali pelan ke nilai awal
        var diff = ASR_CONST.goodwillStart - r.goodwill;
        if (diff !== 0) r.goodwill = _clamp(r.goodwill + _clamp(diff, -ASR_CONST.goodwillDriftPerMonth, ASR_CONST.goodwillDriftPerMonth), 0, 100);

        this._changed();
    }

    // ---------------------------------------------------------------- efek ke EcosystemSystem
    // Biaya pemindai per bulan (ikut skala perusahaan). Hanya bila toko tersedia.
    getMonthlyCost() {
        var d = this.state.data, r = this._r();
        if (!_storeAvailable(d)) return 0;
        var base = ASR_CONST.scanMonthly[r.policy.scan] || 0;
        return base > 0 ? _nice(base * Math.pow(this._scale(), ECO_CONST.fixedScaleExp)) : 0;
    }

    _activeApps() {
        return this._r().catalog.filter(function (a) { return a.status === 'active' || a.status === 'incident'; });
    }

    // Pengali belanja kotor App Store. 1.0 = netral (belum ada aktivitas).
    getStoreFactor() {
        var r = this._r(), now = this._now();
        var apps = this._activeApps();
        var n = apps.length, sumQ = 0, junk = 0;
        apps.forEach(function (a) { sumQ += a.quality; if (a.quality < ASR_CONST.lowQuality) junk += 1; });
        var avgQ = n ? sumQ / n : 0;
        var bonus = n ? Math.min(ASR_CONST.catalogBonusMax, n * ASR_CONST.catalogBonusPerApp) * _clamp((avgQ - 35) / 45, 0, 1.2) : 0;
        var junkMalus = Math.min(ASR_CONST.junkMalusMax, junk * ASR_CONST.junkMalusPerApp);
        var incMalus = Math.min(ASR_CONST.incidentMalusMax, r.incidents.length * ASR_CONST.incidentStoreMalus)
            + (now < r.malusUntilAbs ? ASR_CONST.scandalMalus : 0);
        var f = _clamp(1 + bonus - junkMalus - incMalus, ASR_CONST.factorMin, ASR_CONST.factorMax);
        var appeal = _clamp(1 + (r.goodwill - ASR_CONST.goodwillStart) * ASR_CONST.goodwillAppealSlope,
            ASR_CONST.goodwillAppealMin, ASR_CONST.goodwillAppealMax);
        return f * appeal;
    }

    // ---------------------------------------------------------------- untuk panel
    getSummary() {
        var r = this._r(), d = this.state.data;
        var apps = this._activeApps();
        return {
            available: _storeAvailable(d), goodwill: r.goodwill, storeFactor: this.getStoreFactor(),
            arrivalRate: _storeAvailable(d) ? this.getArrivalRate() : 0,
            pending: r.queue.length, activeApps: apps.length, incidents: r.incidents.length,
            stats: Object.assign({}, r.stats), queueMax: ASR_CONST.queueMax
        };
    }

    getPolicy() {
        var r = this._r(), p = r.policy, scale = this._scale();
        var idx = ASR_CONST.scanLevels.indexOf.bind(ASR_CONST.scanLevels);
        var levels = ASR_CONST.scanLevels.map(function (lv) {
            return {
                id: lv, detect: ASR_CONST.scanDetect[lv],
                monthly: ASR_CONST.scanMonthly[lv] > 0 ? _nice(ASR_CONST.scanMonthly[lv] * Math.pow(scale, ECO_CONST.fixedScaleExp)) : 0,
                setup: idx(lv) > idx(p.scanPaid) ? _nice(ASR_CONST.scanSetup[lv] * Math.sqrt(scale)) : 0,
                active: p.scan === lv
            };
        });
        return {
            scan: p.scan, levels: levels, fee: ASR_CONST.feeSteps[p.fee], feeIndex: p.fee,
            feeMin: p.fee <= 0, feeMax: p.fee >= ASR_CONST.feeSteps.length - 1,
            autoTrusted: p.autoTrusted, inspectCost: this._inspectCostNow()
        };
    }

    getQueue() {
        var r = this._r(), now = this._now();
        return r.queue.map(function (s) {
            var dev = r.devs[s.devId] || {};
            return {
                id: s.id, title: s.title, category: s.category, model: s.model,
                devId: s.devId, devName: dev.name || '?', devType: dev.type === 'shady' ? 'indie' : (dev.type || 'indie'),
                devRep: dev.rep, devNew: !(dev.approved + dev.rejected), devTrusted: !!(dev.rep >= ASR_CONST.trustedRep && dev.clean >= ASR_CONST.trustedApprovals),
                devApproved: dev.approved || 0, devRejected: dev.rejected || 0,
                quality: s.inspected ? s.quality : s.est, qualityExact: !!s.inspected,
                seen: s.seen.slice(), inspected: !!s.inspected,
                monthsLeft: Math.max(0, s.deadlineAbs - now)
            };
        });
    }

    getIncidents() {
        var r = this._r(), now = this._now();
        return r.incidents.map(function (inc) {
            var app = null;
            for (var i = 0; i < r.catalog.length; i++) if (r.catalog[i].id === inc.appId) app = r.catalog[i];
            return {
                appId: inc.appId, flag: inc.flag, title: app ? app.title : '?',
                monthsLeft: Math.max(0, ASR_CONST.incidentEscalateMonths - (now - inc.sinceAbs))
            };
        });
    }

    getCatalog(limit) {
        var r = this._r();
        return r.catalog.slice(0, limit || 12).map(function (a) {
            var dev = r.devs[a.devId];
            return { id: a.id, title: a.title, category: a.category, quality: a.quality, status: a.status, devName: dev ? dev.name : '?' };
        });
    }

    getDevelopers(limit) {
        var r = this._r();
        var list = Object.keys(r.devs).map(function (id) { return r.devs[id]; })
            .filter(function (dv) { return dv.approved + dv.rejected > 0; });
        list.sort(function (a, b) { return (b.approved + b.rejected) - (a.approved + a.rejected); });
        var self = this;
        return list.slice(0, limit || 8).map(function (dv) {
            return {
                id: dv.id, name: dv.name, rep: dv.rep, approved: dv.approved, rejected: dv.rejected,
                flagged: dv.flagged, banned: dv.banned, trusted: self._isTrusted(dv)
            };
        });
    }

    getHistory(limit) { return this._r().history.slice(0, limit || 8); }

    getSubmissionDeadlineMonths() { return ASR_CONST.deadlineMonths; }

    getCategory(id) { return getAsrCategory(id); }
}
