// FILE: src/systems/PromotionSystem.js  (BARU)
// ============================================================
// Promosi regional: Global / Asia / Eropa.
//
// Cara kerja ringkas:
//   1. Pemain membeli paket promosi untuk SATU produk yang sedang dijual.
//   2. Tiap paket punya cakupan wilayah (regional = fokus 1.6x, global = 0.75x di semua).
//   3. Efek ke permintaan = SUM(bobot_wilayah * (jangkauan_kampanye * kecocokan_produk * musim
//      + bonus_brand_wilayah)). Hasilnya ditambahkan ke marketingFactor ProductSystem.
//   4. Setiap hari kampanye aktif menaikkan "brand wilayah" (0-100) yang bertahan lama
//      dan perlahan menurun bila tidak ada promosi di wilayah itu.
//   5. Penjualan harian dipecah per wilayah untuk laporan di panel.
//
// State disimpan di state.data.promo (dibuat otomatis, aman untuk save lama).
// ============================================================
import { bus } from '../core/EventBus.js';
import { BALANCE } from '../data/balance.data.js';
import { LOG_TYPES } from '../config/constants.js';
import { ToastService } from '../core/ToastService.js';
import { getMacro } from '../core/MacroModel.js';
import { t } from '../core/LanguageService.js';
import {
    REGION_IDS, getRegionWeights, getSeason, getSeasonMult, getRegionCostMult
} from '../data/region.data.js';
import {
    PROMO_PACKAGES, getPackageById, getPackagesByScope, getCoverage, isBroadScope, MAX_ACTIVE_PER_PRODUCT
} from '../data/promotion.data.js';
import { WalletService } from './WalletService.js';

var MINUTES_PER_DAY = 24 * 60;
var BRAND_BONUS_MAX = 0.4;        // brand 100 = +40% jangkauan di wilayah itu
var REGION_CAMPAIGN_CAP = 1.2;    // batas jumlah jangkauan kampanye per wilayah
var BRAND_DECAY_PER_DAY = 0.12;
var GLOBAL_BRAND_SHARE = 0.6;     // kampanye global menaikkan brand 60% per wilayah

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

export class PromotionSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        var self = this;
        this._ensure();
        this._unsubs.push(bus.on('state:hydrated', function () { self._ensure(); }));
        this._unsubs.push(bus.on('time:day-changed', function () { self._onDay(); }));
        this._unsubs.push(bus.on('time:month-changed', function () { self._onMonth(); }));
        this._unsubs.push(bus.on('product:sale', function (p) { self._onSale(p); }));
        console.info('[PromotionSystem] siap.');
    }

    stop() {
        this._unsubs.forEach(function (u) { u(); });
        this._unsubs = [];
    }

    // ------------------------------------------------------------ state

    _ensure() {
        var d = this.state.data;
        if (!d.promo || typeof d.promo !== 'object') d.promo = {};
        var p = d.promo;
        if (!Array.isArray(p.campaigns)) p.campaigns = [];
        if (!p.brand || typeof p.brand !== 'object') p.brand = {};
        if (!p.stats || typeof p.stats !== 'object') p.stats = {};
        if (!p.stats.byRegion) p.stats.byRegion = {};
        REGION_IDS.forEach(function (r) {
            if (typeof p.brand[r] !== 'number') p.brand[r] = 0;
            var s = p.stats.byRegion[r] || (p.stats.byRegion[r] = {});
            ['units', 'revenue', 'mUnits', 'mRevenue'].forEach(function (k) {
                if (typeof s[k] !== 'number') s[k] = 0;
            });
        });
        if (typeof p.stats.spent !== 'number') p.stats.spent = 0;
        if (typeof p.stats.launched !== 'number') p.stats.launched = 0;
        return p;
    }

    get promo() { return this._ensure(); }

    _macro() { return getMacro(this.state.data.time, BALANCE.macro); }

    _product(productId) {
        var cat = this.state.data.products.catalog || [];
        for (var i = 0; i < cat.length; i++) if (cat[i].id === productId) return cat[i];
        return null;
    }

    // ------------------------------------------------------------ info untuk UI

    getWeights() { return getRegionWeights(this.state.data.time.currentYear); }

    getBrand() {
        var b = this.promo.brand;
        return { asia: b.asia, europe: b.europe, rest: b.rest };
    }

    getStats() { return this.promo.stats; }

    getPackages(scope) { return getPackagesByScope(scope); }

    getSeasonInfo() {
        var m = this.state.data.time.currentMonth;
        var out = {};
        REGION_IDS.forEach(function (r) {
            var s = getSeason(r, m);
            out[r] = { mult: s ? s.mult : 1.0, key: s ? s.key : null };
        });
        return out;
    }

    // Peluang musim promo terdekat (maks 12 bulan ke depan) untuk satu wilayah.
    getNextSeason(region) {
        var m = this.state.data.time.currentMonth;
        for (var i = 1; i <= 12; i++) {
            var mm = ((m - 1 + i) % 12) + 1;
            var s = getSeason(region, mm);
            if (s) return { month: mm, monthsAway: i, mult: s.mult, key: s.key };
        }
        return null;
    }

    getCostScale() {
        var macro = this._macro();
        return Math.pow(Math.max(1, macro.baseDemand / 5000), 0.7);
    }

    getPackageCost(pkg) {
        var year = this.state.data.time.currentYear;
        var regionMult = isBroadScope(pkg.scope) ? 1.0 : getRegionCostMult(pkg.scope, year);
        return Math.max(100, Math.round((pkg.cost * this.getCostScale() * regionMult) / 100) * 100);
    }

    getActive(productId) {
        var list = this.promo.campaigns;
        if (productId == null) return list.slice();
        return list.filter(function (c) { return c.productId === productId; });
    }

    // Kecocokan produk dengan selera wilayah (0.7 - 1.4).
    getRegionFit(product, region) {
        if (!product) return 1;
        var macro = this._macro();
        if (region === 'asia') {
            var v = Math.pow(Math.max(0.2, macro.priceRef / Math.max(1, product.price)), 0.5);
            return clamp(v, 0.7, 1.4);
        }
        if (region === 'europe') {
            var st = product.stats || {};
            var q = (st.qualityScore || 50) / Math.max(1, macro.qualityRef);
            var dsg = (st.design || 50) / 100;
            return clamp(Math.pow(Math.max(0.2, q), 0.8) * (0.9 + dsg * 0.2), 0.7, 1.4);
        }
        if (region === 'rest') {
            // Amerika & Lainnya: campuran kualitas dan reputasi/brand.
            var st2 = product.stats || {};
            var q2 = (st2.qualityScore || 50) / Math.max(1, macro.qualityRef);
            var refRep = (BALANCE.products && BALANCE.products.refs && BALANCE.products.refs.reputation) || 50;
            var rep = clamp((this.state.data.market.reputation || 10) / Math.max(1, refRep), 0.5, 1.5);
            return clamp(Math.pow(Math.max(0.2, q2), 0.6) * Math.pow(rep, 0.3) * 1.08, 0.7, 1.4);
        }
        return 1;
    }

    _marketerBonus() {
        var m = this.state.data.team.marketers || 0;
        return 1 + m * ((BALANCE.marketing && BALANCE.marketing.perMarketerBonus) || 0.1);
    }

    // Jangkauan efektif satu paket per wilayah, belum dikali kecocokan/musim.
    _packageReach(pkg) {
        var cov = getCoverage(pkg);
        var bonus = this._marketerBonus();
        var out = {};
        REGION_IDS.forEach(function (r) { out[r] = (cov[r] || 0) * pkg.reach * bonus; });
        return out;
    }

    // Kontribusi satu kampanye/paket ke wilayah r (sudah kali fit & musim).
    _contribution(reachR, pkgLike, product, r, month) {
        if (!reachR) return 0;
        var fit = this.getRegionFit(product, r);
        if (r === 'asia' && pkgLike.valueFitBonus) fit += pkgLike.valueFitBonus;
        if (r === 'europe' && pkgLike.designFitBonus) fit += pkgLike.designFitBonus;
        var season = getSeasonMult(r, month);
        var festival = ((r === 'asia' || r === 'rest') && pkgLike.festivalBonus && season > 1) ? (1 + pkgLike.festivalBonus) : 1;
        return reachR * fit * season * festival;
    }

    // Lift per wilayah untuk produk (kampanye aktif + bonus brand).
    getRegionLifts(productId) {
        var d = this.state.data;
        var product = this._product(productId);
        var month = d.time.currentMonth;
        var weights = this.getWeights();
        var brand = this.promo.brand;
        var camps = this.promo.campaigns.filter(function (c) { return c.productId === productId; });
        var self = this;
        var lifts = {};
        var total = 0;
        REGION_IDS.forEach(function (r) {
            var sum = 0;
            camps.forEach(function (c) {
                sum += self._contribution((c.eff && c.eff[r]) || 0, c, product, r, month);
            });
            sum = Math.min(REGION_CAMPAIGN_CAP, sum);
            var lift = sum + BRAND_BONUS_MAX * (brand[r] / 100);
            lifts[r] = lift;
            total += weights[r] * lift;
        });
        lifts.total = total;
        return lifts;
    }

    // Dipanggil ProductSystem._getMarketingFactor (ditambahkan ke 1 + legacy).
    getLiftForProduct(productId) {
        try { return this.getRegionLifts(productId).total; }
        catch (e) { return 0; }
    }

    // Perkiraan sebelum membeli.
    previewPackage(productId, pkgId) {
        var d = this.state.data;
        var pkg = getPackageById(pkgId);
        var product = this._product(productId);
        if (!pkg || !product) return null;
        var month = d.time.currentMonth;
        var weights = this.getWeights();
        var reach = this._packageReach(pkg);
        var perRegion = {};
        var est = 0;
        var self = this;
        REGION_IDS.forEach(function (r) {
            var c = self._contribution(reach[r], pkg, product, r, month);
            perRegion[r] = c;
            est += weights[r] * c;
        });
        var cost = this.getPackageCost(pkg);
        var fit = {};
        REGION_IDS.forEach(function (r) { fit[r] = self.getRegionFit(product, r); });
        return {
            pkg: pkg,
            cost: cost,
            estLift: est,
            perRegion: perRegion,
            fit: fit,
            durationDays: pkg.durationDays,
            brandGain: pkg.brandGain,
            affordable: d.cash >= cost,
            shortfall: Math.max(0, cost - d.cash)
        };
    }

    // Saran paket terbaik (lift per dolar) yang tidak menguras kas.
    recommend(productId) {
        var self = this;
        var cash = this.state.data.cash;
        var best = null;
        PROMO_PACKAGES.forEach(function (pkg) {
            var pv = self.previewPackage(productId, pkg.id);
            if (!pv || pv.cost > cash * 0.4) return;
            if (self.promo.campaigns.some(function (c) { return c.productId === productId && c.pkgId === pkg.id; })) return;
            var score = pv.estLift / pv.cost;
            if (!best || score > best.score) best = { pkgId: pkg.id, score: score, estLift: pv.estLift };
        });
        return best ? best.pkgId : null;
    }

    // ------------------------------------------------------------ aksi

    startCampaign(productId, pkgId) {
        var d = this.state.data;
        var p = this._ensure();
        var pkg = getPackageById(pkgId);
        if (!pkg) return { ok: false, reason: t('promo.err.not_found') };
        var product = this._product(productId);
        if (!product) return { ok: false, reason: t('promo.err.no_product') };
        if (product.status !== 'selling') return { ok: false, reason: t('promo.err.not_selling') };
        if (p.campaigns.some(function (c) { return c.productId === productId && c.pkgId === pkgId; })) {
            return { ok: false, reason: t('promo.err.duplicate') };
        }
        var activeCount = p.campaigns.filter(function (c) { return c.productId === productId; }).length;
        if (activeCount >= MAX_ACTIVE_PER_PRODUCT) {
            return { ok: false, reason: t('promo.err.max_active', { n: MAX_ACTIVE_PER_PRODUCT }) };
        }
        if (pkg.minYear && d.time.currentYear < pkg.minYear) {
            return { ok: false, reason: t('promo.err.locked_year', { n: pkg.minYear }) };
        }
        var cost = this.getPackageCost(pkg);
        if (!WalletService.canAfford(cost)) return { ok: false, reason: t('promo.err.no_cash') };

        WalletService.pay(cost, 'promotion');
        var now = d.time.elapsedGameMinutes;
        p.campaigns.push({
            id: 'pc_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            pkgId: pkg.id,
            scope: pkg.scope,
            productId: productId,
            startedAtMinute: now,
            endsAtMinute: now + pkg.durationDays * MINUTES_PER_DAY,
            durationDays: pkg.durationDays,
            cost: cost,
            eff: this._packageReach(pkg),
            brandGain: pkg.brandGain,
            festivalBonus: pkg.festivalBonus || 0,
            valueFitBonus: pkg.valueFitBonus || 0,
            designFitBonus: pkg.designFitBonus || 0,
            segment: pkg.segment || null,
            segmentBoost: pkg.segment ? (pkg.segmentBoost || 0.5) : 0
        });
        p.stats.spent += cost;
        p.stats.launched += 1;
        if (pkg.repGain) this.state.addReputation(pkg.repGain);

        var label = t('promo.pkg.' + pkg.id + '.name');
        this.state.addLog(t('promo.log.started', { name: label, product: product.name }), LOG_TYPES.info);
        ToastService.success(t('promo.toast.started', { name: label }));
        bus.emit('promo:started', { productId: productId, pkgId: pkg.id });
        bus.emit('promo:changed', {});
        bus.emit('state:changed', d);
        return { ok: true };
    }

    // ------------------------------------------------------------ siklus

    _onDay() {
        var p = this._ensure();
        var now = this.state.data.time.elapsedGameMinutes;
        var finished = [];
        var active = [];
        p.campaigns.forEach(function (c) {
            if (c.endsAtMinute <= now) finished.push(c); else active.push(c);
        });

        var covered = { asia: false, europe: false, rest: false };
        active.forEach(function (c) {
            var perDay = c.brandGain / Math.max(1, c.durationDays);
            REGION_IDS.forEach(function (r) {
                var inScope = isBroadScope(c.scope) || c.scope === r;
                if (!inScope) return;
                covered[r] = true;
                var share = isBroadScope(c.scope) ? GLOBAL_BRAND_SHARE : 1;
                p.brand[r] = clamp(p.brand[r] + perDay * share * (1 - p.brand[r] / 120), 0, 100);
            });
        });
        REGION_IDS.forEach(function (r) {
            if (!covered[r]) p.brand[r] = Math.max(0, p.brand[r] - BRAND_DECAY_PER_DAY);
        });

        if (finished.length) {
            p.campaigns = active;
            var self = this;
            finished.forEach(function (c) {
                var prod = self._product(c.productId);
                var label = t('promo.pkg.' + c.pkgId + '.name');
                self.state.addLog(t('promo.log.finished', { name: label, product: prod ? prod.name : '-' }), LOG_TYPES.info);
                bus.emit('promo:finished', { productId: c.productId, pkgId: c.pkgId });
            });
            ToastService.info(t('promo.toast.finished', { n: finished.length }));
            bus.emit('promo:changed', {});
        }
    }

    _onMonth() {
        var p = this._ensure();
        REGION_IDS.forEach(function (r) {
            p.stats.byRegion[r].mUnits = 0;
            p.stats.byRegion[r].mRevenue = 0;
        });
    }

    // Pecah penjualan produk ke wilayah: bobot pasar * (1 + lift wilayah).
    _onSale(payload) {
        if (!payload || !(payload.sold > 0)) return;
        var p = this._ensure();
        var lifts = this.getRegionLifts(payload.productId);
        var w = this.getWeights();
        var raw = {};
        var sum = 0;
        REGION_IDS.forEach(function (r) { raw[r] = w[r] * (1 + lifts[r]); sum += raw[r]; });
        if (sum <= 0) return;
        REGION_IDS.forEach(function (r) {
            var share = raw[r] / sum;
            var s = p.stats.byRegion[r];
            var units = payload.sold * share;
            var rev = (payload.revenue || 0) * share;
            s.units += units; s.mUnits += units;
            s.revenue += rev; s.mRevenue += rev;
        });
    }
}
