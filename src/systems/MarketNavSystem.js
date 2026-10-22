// FILE: src/systems/MarketNavSystem.js  (BARU)
// ============================================================
// Navigasi Pasar — memperluas arah pasar di luar "satu angka pangsa":
//   • Segmen konsumen (8): selera, daya beli, porsi per tahun, niat beli, sentimen, pangsa estimasi.
//   • Sub-wilayah (8): di bawah Asia / Eropa / Amerika & Lainnya.
//   • Gelombang tren (15) + tren tambahan (konektivitas, kemudahan, ketahanan, bentuk).
//   • Faktor permintaan "navF" (netral ~1,0, dibatasi) untuk ProductSystem, termasuk efek
//     viral (dailyDemandBoost) yang sebelumnya tidak pernah terpasang ke permintaan.
//   • Peluang pasar, prakiraan tren, dan sampel audiens untuk ulasan konsumen.
//
// State: state.data.marketNav (dibuat otomatis, aman untuk save lama). Tren inti 5 dimensi di
// state.data.market.trends TIDAK disentuh.
// ============================================================
import { bus } from '../core/EventBus.js';
import { BALANCE } from '../data/balance.data.js';
import { getMacro, yearFraction } from '../core/MacroModel.js';
import { getRegionWeights } from '../data/region.data.js';
import { getComponentById } from '../data/components.data.js';
import { LanguageService } from '../core/LanguageService.js';
import {
    SEGMENTS, SUBREGIONS, EXT_TRENDS, TREND_WAVES, PERSONAS, STAT_KEYS,
    interpAnchors, waveIntensity, getSegmentWeights, getSubregionWeights, getSegment, getSubregion
} from '../data/market-nav.data.js';

// Faktor permintaan = rata-rata KECOCOKAN BENTUK spesifikasi terhadap selera orang yang mau
// membeli di harga itu. Produk dengan stat seragam selalu bernilai tepat 1,0 (netral di semua
// tahun dan tingkat harga), sehingga kalibrasi ekonomi lama tidak bergeser. Level kualitas
// tetap ditangani qualityF/priceF yang sudah ada.
export const NAV_LIMITS = { staticMin: 0.78, staticMax: 1.30, totalMin: 0.45, totalMax: 1.60 };
const SEG_DAMP = 0.65;
const REG_DAMP = 0.50;
const MINUTES_PER_DAY = 24 * 60;
const HISTORY_MAX = 24;
const LEGACY_TRENDS = ['camera', 'battery', 'screen', 'performance', 'design'];

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lang() { try { return LanguageService.getLang() === 'id' ? 'id' : 'en'; } catch (e) { return 'en'; } }
export function loc(obj) {
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang()] || obj.en || obj.id || '';
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export class MarketNavSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
        this._ctxKey = null;
        this._ctx = null;
    }

    start() {
        var self = this;
        this._ensure();
        this._unsubs.push(bus.on('state:hydrated', function () { self._ctxKey = null; self._ensure(); }));
        this._unsubs.push(bus.on('time:month-changed', function (s) { self._onMonth(s); }));
        console.info('[MarketNavSystem] siap.');
    }

    stop() {
        this._unsubs.forEach(function (u) { u(); });
        this._unsubs = [];
    }

    // ------------------------------------------------------------ state

    _ensure() {
        var d = this.state.data;
        if (!d.marketNav || typeof d.marketNav !== 'object') d.marketNav = {};
        var n = d.marketNav;
        if (!n.ext || typeof n.ext !== 'object') n.ext = {};
        var year = (d.time && d.time.currentYear) || 2000;
        EXT_TRENDS.forEach(function (e) {
            if (typeof n.ext[e.id] !== 'number' || !isFinite(n.ext[e.id])) n.ext[e.id] = interpAnchors(e.anchors, year);
        });
        if (!n.segments || typeof n.segments !== 'object') n.segments = {};
        if (!n.regions || typeof n.regions !== 'object') n.regions = {};
        SEGMENTS.forEach(function (s) { if (!n.segments[s.id]) n.segments[s.id] = { intent: null, sentiment: null, index: 0, share: 0 }; });
        SUBREGIONS.forEach(function (s) { if (!n.regions[s.id]) n.regions[s.id] = { intent: null, sentiment: null, index: 0, share: 0 }; });
        if (!Array.isArray(n.history)) n.history = [];
        if (!n.lastMonth) n.lastMonth = null;
        return n;
    }

    get nav() { return this._ensure(); }

    // ------------------------------------------------------------ konteks waktu

    _context() {
        var d = this.state.data;
        var tm = d.time;
        var key = tm.currentYear * 10000 + (tm.currentMonth || 1) * 100 + (tm.currentDay || 1);
        if (this._ctx && this._ctxKey === key) return this._ctx;

        var macro = getMacro(tm, BALANCE.macro);
        var t = yearFraction(tm);
        var year = tm.currentYear || 2000;
        var segMults = {}, regMults = {}, waves = [];
        TREND_WAVES.forEach(function (w) {
            var p = waveIntensity(w, t);
            if (p <= 0) return;
            waves.push({ wave: w, p: p });
            for (var s in (w.segs || {})) segMults[s] = (segMults[s] || 1) * (1 + p * (w.segs[s] - 1));
            for (var r in (w.regs || {})) regMults[r] = (regMults[r] || 1) * (1 + p * (w.regs[r] - 1));
        });
        waves.sort(function (a, b) { return b.p * b.wave.strength - a.p * a.wave.strength; });

        this._ctx = {
            year: year, t: t, macro: macro, waves: waves,
            ref: Math.max(0.3, (macro.qualityRef || 60) / 100),
            priceRef: Math.max(1, macro.priceRef || 150),
            segMults: segMults, regMults: regMults,
            segW: getSegmentWeights(year, segMults),
            subW: getSubregionWeights(year, getRegionWeights(year), regMults)
        };
        this._ctxKey = key;
        return this._ctx;
    }

    // ------------------------------------------------------------ kecocokan produk

    _vec(stats, config) {
        var v = {};
        STAT_KEYS.forEach(function (k) { v[k] = Number(stats && stats[k]) || 0; });
        var ff = config && config.formFactorId ? getComponentById(config.formFactorId) : null;
        var bdm = (ff && ff.baseDemandMultiplier) || 1;
        v.form = clamp((bdm - 1) / 0.25, 0, 1) * 100;
        return v;
    }

    // Kecocokan BENTUK (netral terhadap level): stat seragam -> 1,0.
    _shape(tastes, vec) {
        var sum = 0, wsum = 0, mean = 0;
        STAT_KEYS.forEach(function (k) { var w = tastes[k] || 0; sum += w * vec[k]; wsum += w; mean += vec[k]; });
        mean = mean / STAT_KEYS.length;
        if (wsum <= 0 || mean < 1) return 1;
        return clamp((sum / wsum) / mean, 0.5, 1.6);
    }

    _level(vec, ctx) {
        var mean = 0;
        STAT_KEYS.forEach(function (k) { mean += vec[k]; });
        return clamp((mean / STAT_KEYS.length / 100) / ctx.ref, 0.3, 1.8);
    }

    // Kedekatan harga produk dengan harga yang disukai (0..1,35), tanpa batas bawah keras.
    _aff(price, tilt, width, ctx) {
        var pi = Math.max(1, price) / ctx.priceRef;
        var z = Math.log(pi / tilt) / Math.max(0.2, width);
        return clamp(Math.exp(-z * z / 2) / 0.75, 0.02, 1.35);
    }

    segmentAppeal(seg, vec, price, ctx) {
        var aff = Math.max(0.35, this._aff(price, seg.tilt, seg.width, ctx));
        return clamp(this._shape(seg.tastes, vec) * this._level(vec, ctx) * Math.pow(aff, 0.7), 0.25, 2);
    }

    regionAppeal(sub, vec, price, ctx) {
        var aff = Math.max(0.35, this._aff(price, sub.tilt, sub.width, ctx));
        return clamp(this._shape(sub.tastes, vec) * this._level(vec, ctx) * Math.pow(aff, 0.5), 0.25, 2);
    }

    // Rata-rata kecocokan bentuk, berbobot porsi x kedekatan harga. { raw, shape: {id}, w: {id} }
    _fitMix(list, weights, vec, price, ctx) {
        var self = this, num = 0, den = 0, shape = {}, w = {};
        list.forEach(function (x) {
            var sh = self._shape(x.tastes, vec);
            var ww = (weights[x.id] || 0) * self._aff(price, x.tilt, x.width, ctx);
            shape[x.id] = sh; w[x.id] = ww;
            num += ww * sh; den += ww;
        });
        return { raw: den > 1e-9 ? num / den : 1, shape: shape, w: w };
    }

    _segBoostFor(productId) {
        var promo = this.state.data.promo;
        var out = null;
        if (!promo || !Array.isArray(promo.campaigns)) return out;
        promo.campaigns.forEach(function (c) {
            if (c && c.segment && c.productId === productId) {
                out = out || {};
                out[c.segment] = (out[c.segment] || 1) * (1 + (Number(c.segmentBoost) || 0.5));
            }
        });
        return out;
    }

    _weightsWithBoost(ctx, boost) {
        if (!boost) return ctx.segW;
        var out = {}, sum = 0;
        SEGMENTS.forEach(function (s) { out[s.id] = ctx.segW[s.id] * (boost[s.id] || 1); sum += out[s.id]; });
        SEGMENTS.forEach(function (s) { out[s.id] = out[s.id] / sum; });
        return out;
    }

    _appeals(vec, price, ctx) {
        var self = this, seg = {}, reg = {};
        SEGMENTS.forEach(function (s) { seg[s.id] = self.segmentAppeal(s, vec, price, ctx); });
        SUBREGIONS.forEach(function (s) { reg[s.id] = self.regionAppeal(s, vec, price, ctx); });
        return { seg: seg, reg: reg };
    }

    _waveFactor(vec, ctx) {
        var sum = 0;
        ctx.waves.forEach(function (w) {
            var m = 0;
            for (var k in w.wave.boost) m += w.wave.boost[k] * ((vec[k] || 0) / 100 - ctx.ref);
            sum += w.p * w.wave.strength * m;
        });
        return clamp(1 + sum, 0.9, 1.12);
    }

    _viralFactor(productId, ctx) {
        var fb = this.state.data.feedback;
        var list = (fb && Array.isArray(fb.activeViral)) ? fb.activeViral : [];
        var sum = 0;
        list.forEach(function (v) {
            var eff = v && v.effects;
            var boost = eff && Number(eff.dailyDemandBoost);
            if (!boost || !isFinite(boost)) return;
            if (v.productId != null && productId != null && v.productId !== productId) return;
            var focus = 1;
            if (Array.isArray(v.segs) && v.segs.length) {
                var ss = 0; v.segs.forEach(function (s) { ss += ctx.segW[s] || 0; });
                focus *= ss;
            }
            if (Array.isArray(v.regs) && v.regs.length) {
                var rs = 0; v.regs.forEach(function (r) { rs += ctx.subW[r] || 0; });
                focus *= rs;
            }
            var scale = (v.segs && v.segs.length) || (v.regs && v.regs.length) ? clamp(focus * 2.2, 0.3, 1) : 1;
            sum += boost * scale;
        });
        return clamp(1 + sum, 0.55, 1.5);
    }

    // ------------------------------------------------------------ API permintaan

    getDemandBreakdown(p) {
        if (!p || !p.stats) return { segPart: 1, regPart: 1, waveF: 1, viralF: 1, base: 1, total: 1 };
        var ctx = this._context();
        var vec = this._vec(p.stats, p.config);
        var segW = this._weightsWithBoost(ctx, this._segBoostFor(p.id));
        var segPart = 1 + (this._fitMix(SEGMENTS, segW, vec, p.price, ctx).raw - 1) * SEG_DAMP;
        var regPart = 1 + (this._fitMix(SUBREGIONS, ctx.subW, vec, p.price, ctx).raw - 1) * REG_DAMP;
        var waveF = this._waveFactor(vec, ctx);
        var base = clamp(segPart * regPart * waveF, NAV_LIMITS.staticMin, NAV_LIMITS.staticMax);
        var viralF = this._viralFactor(p.id, ctx);
        return {
            segPart: segPart, regPart: regPart, waveF: waveF, viralF: viralF, base: base,
            total: clamp(base * viralF, NAV_LIMITS.totalMin, NAV_LIMITS.totalMax)
        };
    }

    // Dipanggil ProductSystem._computeDailyDemand. Selalu mengembalikan angka aman.
    getDemandFactor(p) {
        try {
            var f = this.getDemandBreakdown(p).total;
            return (typeof f === 'number' && isFinite(f) && f > 0) ? f : 1;
        } catch (e) { return 1; }
    }

    // Untuk wizard desain (belum ada produk): tanpa viral/promosi.
    estimateFactor(stats, price, config) {
        try {
            var ctx = this._context();
            var vec = this._vec(stats, config);
            var segPart = 1 + (this._fitMix(SEGMENTS, ctx.segW, vec, price, ctx).raw - 1) * SEG_DAMP;
            var regPart = 1 + (this._fitMix(SUBREGIONS, ctx.subW, vec, price, ctx).raw - 1) * REG_DAMP;
            var f = clamp(segPart * regPart * this._waveFactor(vec, ctx), NAV_LIMITS.staticMin, NAV_LIMITS.staticMax);
            return isFinite(f) ? f : 1;
        } catch (e) { return 1; }
    }

    // ------------------------------------------------------------ siklus bulanan

    _selling() {
        return (this.state.data.products.catalog || []).filter(function (p) { return p.status === 'selling' && p.stats; });
    }

    _onMonth(snap) {
        var d = this.state.data;
        var n = this._ensure();
        this._ctxKey = null;
        var ctx = this._context();
        var year = ctx.year;

        // 1) Tren tambahan menuju jangkar + dorongan gelombang.
        var pull = BALANCE.macro.trendPull, noise = BALANCE.macro.trendNoise;
        EXT_TRENDS.forEach(function (e) {
            var target = interpAnchors(e.anchors, year);
            ctx.waves.forEach(function (w) { if (w.wave.boost[e.stat]) target += w.p * w.wave.strength * w.wave.boost[e.stat] * 1.5; });
            target = clamp(target, 0.1, 0.95);
            var cur = typeof n.ext[e.id] === 'number' ? n.ext[e.id] : target;
            n.ext[e.id] = clamp(cur + (target - cur) * pull + (Math.random() * 2 - 1) * noise, 0.1, 0.95);
        });

        // 2) Alokasi penjualan 30 hari terakhir ke segmen & sub-wilayah.
        var now = d.time.elapsedGameMinutes || 0;
        var cutoff = now - 30 * MINUTES_PER_DAY;
        var allocSeg = {}, allocReg = {}, total = 0;
        SEGMENTS.forEach(function (s) { allocSeg[s.id] = 0; });
        SUBREGIONS.forEach(function (s) { allocReg[s.id] = 0; });
        var selling = this._selling();
        var self = this;
        var best = { seg: {}, reg: {} }, sentAcc = { seg: {}, reg: {} };
        var bugs = ((d.os && d.os.bugs) || []).filter(function (b) { return b.status === 'active' || b.status === 'patching'; }).length;

        selling.forEach(function (p) {
            var vec = self._vec(p.stats, p.config);
            var ap = self._appeals(vec, p.price, ctx);
            var segW = self._weightsWithBoost(ctx, self._segBoostFor(p.id));
            var units = 0;
            (p.dailySales || []).forEach(function (s) { if (s.day >= cutoff && typeof s.sold === 'number') units += s.sold; });
            if (units > 0) {
                var ws = {}, wsum = 0, wr = {}, wrsum = 0;
                var fs = self._fitMix(SEGMENTS, segW, vec, p.price, ctx), fr = self._fitMix(SUBREGIONS, ctx.subW, vec, p.price, ctx);
                SEGMENTS.forEach(function (s) { ws[s.id] = fs.w[s.id] * Math.pow(fs.shape[s.id], 1.5); wsum += ws[s.id]; });
                SUBREGIONS.forEach(function (s) { wr[s.id] = fr.w[s.id] * Math.pow(fr.shape[s.id], 1.5); wrsum += wr[s.id]; });
                if (wsum <= 0 || wrsum <= 0) { ws = segW; wr = ctx.subW; wsum = 1; wrsum = 1; }
                SEGMENTS.forEach(function (s) { allocSeg[s.id] += units * (ws[s.id] / wsum); });
                SUBREGIONS.forEach(function (s) { allocReg[s.id] += units * (wr[s.id] / wrsum); });
                total += units;
            }
            SEGMENTS.forEach(function (s) {
                var a = ap.seg[s.id];
                best.seg[s.id] = Math.max(best.seg[s.id] || 0, a);
                (sentAcc.seg[s.id] = sentAcc.seg[s.id] || []).push(a);
            });
            SUBREGIONS.forEach(function (s) {
                var a = ap.reg[s.id];
                best.reg[s.id] = Math.max(best.reg[s.id] || 0, a);
                (sentAcc.reg[s.id] = sentAcc.reg[s.id] || []).push(a);
            });
        });

        var playerShare = Number(d.market && d.market.share) || 0;
        var maxShare = (BALANCE.market.playerShareScale && BALANCE.market.playerShareScale.maxShare) || 1;
        var viralByTarget = this._viralSentimentShift(ctx);

        function fill(list, store, weights, alloc, bestMap, acc, shift, bugSens) {
            list.forEach(function (s) {
                var rec = store[s.id];
                var w = weights[s.id] || 0;
                var idx = (total > 0 && w > 0) ? (alloc[s.id] / total) / w : 0;
                rec.index = isFinite(idx) ? idx : 0;
                rec.share = clamp(playerShare * rec.index, 0, maxShare);
                rec.units = Math.round(alloc[s.id] || 0);
                if (bestMap[s.id] !== undefined) {
                    rec.intent = clamp(Math.round(50 + 55 * (bestMap[s.id] - 1)), 0, 100);
                    var arr = acc[s.id], avg = arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
                    var sens = bugSens(s);
                    rec.sentiment = clamp(Math.round(50 + 45 * (avg - 1) - bugs * 2 * sens + (shift[s.id] || 0)), 0, 100);
                } else { rec.intent = null; rec.sentiment = null; }
            });
        }
        fill(SEGMENTS, n.segments, ctx.segW, allocSeg, best.seg, sentAcc.seg, viralByTarget.seg,
            function (s) { return s.id === 'pro' ? 1.5 : (s.id === 'gamer' || s.id === 'premium') ? 1.2 : s.id === 'senior' ? 0.6 : 1; });
        fill(SUBREGIONS, n.regions, ctx.subW, allocReg, best.reg, sentAcc.reg, viralByTarget.reg, function () { return 1; });

        // 3) Riwayat indeks penetrasi.
        var rec = { year: snap.currentYear, month: snap.currentMonth, seg: {}, reg: {} };
        SEGMENTS.forEach(function (s) { rec.seg[s.id] = Math.round(n.segments[s.id].index * 100) / 100; });
        SUBREGIONS.forEach(function (s) { rec.reg[s.id] = Math.round(n.regions[s.id].index * 100) / 100; });
        n.history.unshift(rec);
        if (n.history.length > HISTORY_MAX) n.history.length = HISTORY_MAX;
        n.lastMonth = { year: snap.currentYear, month: snap.currentMonth };

        bus.emit('market:nav-updated', { year: snap.currentYear, month: snap.currentMonth });
    }

    _viralSentimentShift(ctx) {
        var out = { seg: {}, reg: {} };
        var fb = this.state.data.feedback;
        var list = (fb && Array.isArray(fb.activeViral)) ? fb.activeViral : [];
        list.forEach(function (v) {
            var sign = v.type === 'positive' ? 1 : -1;
            var mag = 10 * sign;
            if (Array.isArray(v.segs) && v.segs.length) v.segs.forEach(function (s) { out.seg[s] = (out.seg[s] || 0) + mag; });
            else SEGMENTS.forEach(function (s) { out.seg[s.id] = (out.seg[s.id] || 0) + mag * 0.5; });
            if (Array.isArray(v.regs) && v.regs.length) v.regs.forEach(function (r) { out.reg[r] = (out.reg[r] || 0) + mag; });
            else SUBREGIONS.forEach(function (s) { out.reg[s.id] = (out.reg[s.id] || 0) + mag * 0.5; });
        });
        return out;
    }

    // ------------------------------------------------------------ info untuk UI

    getSegments() {
        var ctx = this._context(), n = this.nav;
        return SEGMENTS.map(function (s) {
            var rec = n.segments[s.id] || {};
            var base = getSegmentWeights(ctx.year - 5 < 2000 ? 2000 : ctx.year - 5)[s.id];
            return {
                def: s, weight: ctx.segW[s.id], weightDelta: ctx.segW[s.id] - base,
                intent: rec.intent, sentiment: rec.sentiment, index: rec.index || 0, share: rec.share || 0, units: rec.units || 0,
                locked: !!(s.minYear && ctx.year < s.minYear)
            };
        }).sort(function (a, b) { return b.weight - a.weight; });
    }

    getRegions() {
        var ctx = this._context(), n = this.nav;
        return SUBREGIONS.map(function (s) {
            var rec = n.regions[s.id] || {};
            return {
                def: s, weight: ctx.subW[s.id],
                intent: rec.intent, sentiment: rec.sentiment, index: rec.index || 0, share: rec.share || 0, units: rec.units || 0
            };
        }).sort(function (a, b) { return b.weight - a.weight; });
    }

    getActiveWaves() {
        var ctx = this._context();
        return ctx.waves.map(function (w) { return { def: w.wave, intensity: w.p }; });
    }

    // Wave yang akan mulai dalam <= 24 bulan (untuk "segera datang").
    getUpcomingWaves() {
        var ctx = this._context();
        return TREND_WAVES.filter(function (w) { return w.from > ctx.t && w.from - ctx.t <= 2; })
            .map(function (w) { return { def: w, monthsAway: Math.max(1, Math.round((w.from - ctx.t) * 12)) }; })
            .sort(function (a, b) { return a.monthsAway - b.monthsAway; });
    }

    // Semua dimensi tren (inti + tambahan) dengan arah prakiraan 6 bulan.
    getAllTrends() {
        var d = this.state.data, ctx = this._context(), n = this.nav;
        var core = d.market.trends || {};
        var futureT = ctx.t + 0.5;
        var fy = Math.floor(futureT);
        var fm = Math.min(12, Math.max(1, Math.floor((futureT - fy) * 12) + 1));
        var future = getMacro({ currentYear: fy, currentMonth: fm, currentDay: 15 }, BALANCE.macro).trends;
        var out = [];
        LEGACY_TRENDS.forEach(function (k) {
            var cur = typeof core[k] === 'number' ? core[k] : 0;
            var f = future && typeof future[k] === 'number' ? future[k] : cur;
            out.push({ id: k, value: cur, dir: Math.abs(f - cur) < 0.012 ? 0 : (f > cur ? 1 : -1), ext: false });
        });
        EXT_TRENDS.forEach(function (e) {
            var cur = n.ext[e.id];
            var f = interpAnchors(e.anchors, futureT);
            out.push({ id: e.id, value: cur, dir: Math.abs(f - cur) < 0.012 ? 0 : (f > cur ? 1 : -1), ext: true, icon: e.icon });
        });
        return out;
    }

    getOpportunities(limit) {
        var ctx = this._context(), n = this.nav;
        var sel = this._selling();
        var self = this;
        var list = [];
        SEGMENTS.forEach(function (s) {
            if (s.minYear && ctx.year < s.minYear) return;
            var rec = n.segments[s.id] || {};
            var w = ctx.segW[s.id];
            var a = 0;
            sel.forEach(function (p) { a = Math.max(a, self.segmentAppeal(s, self._vec(p.stats, p.config), p.price, ctx)); });
            var idx = sel.length ? Math.min(1.15, rec.index || 0) : 0;
            list.push({ kind: 'segment', id: s.id, score: w * (a || 0.8) * Math.max(0.15, 1.15 - idx), weight: w, index: rec.index || 0 });
        });
        SUBREGIONS.forEach(function (s) {
            var rec = n.regions[s.id] || {};
            var w = ctx.subW[s.id];
            var a = 0;
            sel.forEach(function (p) { a = Math.max(a, self.regionAppeal(s, self._vec(p.stats, p.config), p.price, ctx)); });
            var idx = sel.length ? Math.min(1.15, rec.index || 0) : 0;
            list.push({ kind: 'region', id: s.id, score: w * (a || 0.8) * Math.max(0.15, 1.15 - idx), weight: w, index: rec.index || 0 });
        });
        list.sort(function (a, b) { return b.score - a.score; });
        return list.slice(0, limit || 3);
    }

    getHistory() { return this.nav.history.slice(); }

    // ------------------------------------------------------------ ulasan konsumen

    // Pilih segmen & wilayah pengulas untuk satu produk (bobot = porsi x kecocokan).
    sampleAudience(p) {
        try {
            var ctx = this._context();
            var vec = this._vec(p.stats, p.config);
            var ap = this._appeals(vec, p.price, ctx);
            var segW = this._weightsWithBoost(ctx, this._segBoostFor(p.id));
            var fs = this._fitMix(SEGMENTS, segW, vec, p.price, ctx), fr = this._fitMix(SUBREGIONS, ctx.subW, vec, p.price, ctx);
            var segId = this._weighted(SEGMENTS, function (s) {
                if (s.minYear && ctx.year < s.minYear) return 0;
                return fs.w[s.id] * Math.pow(fs.shape[s.id], 1.5);
            });
            var regId = this._weighted(SUBREGIONS, function (s) { return fr.w[s.id] * Math.pow(fr.shape[s.id], 1.5); });
            return { segment: segId, region: regId, appeal: ap.seg[segId] };
        } catch (e) { return { segment: 'mainstream', region: 'west_europe', appeal: 1 }; }
    }

    _weighted(list, fn) {
        var tot = 0, ws = list.map(function (x) { var w = Math.max(0, fn(x)); tot += w; return w; });
        if (tot <= 0) return list[0].id;
        var r = Math.random() * tot;
        for (var i = 0; i < list.length; i++) { r -= ws[i]; if (r <= 0) return list[i].id; }
        return list[list.length - 1].id;
    }

    // Kalimat persona sesuai bahasa aktif; positive=true/false. null bila tidak ada.
    personaLine(segmentId, positive, productName) {
        var p = PERSONAS[segmentId];
        if (!p) return null;
        var pool = (positive ? p.pos : p.neg)[lang()];
        if (!pool || !pool.length) return null;
        return pick(pool).split('{p}').join(productName);
    }
}
