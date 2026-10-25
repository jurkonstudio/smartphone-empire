// FILE: src/systems/ProductSystem.js
// Versi lengkap — dengan _checkSalesMilestones untuk trigger berita milestone.
// v2028.5 — [LOGIC] Menambahkan validasi batas harga (floor & ceiling) di backend.
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { BALANCE } from '../data/balance.data.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { ToastService } from '../core/ToastService.js';
import { LOG_TYPES } from '../config/constants.js';
import {
    COMPONENTS, COMPONENT_CATEGORIES, BODY_COLORS,
    getComponentById, getComponentsByCategory, getBodyColorById
} from '../data/components.data.js';
import { getCampaignById, MARKETING_CAMPAIGNS } from '../data/marketing.data.js';
import { resolveComponentCost, getMarketPrice, getBuiltPlantEffect, getPlantTypeForCategory } from '../data/material-plants.data.js';
import { getLicenseById, getLicenseStatsAtYear } from '../data/os.data.js';
import { computeTechEdge, getMasteryStatBonus, RND_TRACKS } from '../data/research.data.js';
import { getFeatureStats, getFeatureUnitCost, getFeatureAnalysis, validateFeatureSelection, getStorageGBForComponent } from '../data/features.data.js';
import { getMacro, reviewBaseScore } from '../core/MacroModel.js';
import { WalletService } from './WalletService.js';
import { getEraEventDemandFactor } from './EraEventSystem.js';
import { getDevToolsDemandMult, getGameEnginePerfBonus, getUserControlDemandMult } from './FutureEffects.js';

var MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;

var REVIEW_SOURCES = {
    feature_phone:    ['Majalah Tekno', 'Forum HP', 'Tabloid Gadget'],
    touch_revolution: ['Blog Teknologi', 'Forum Diskusi', 'Portal Berita'],
    modern_smartphone:['YouTube Review', 'Media Sosial', 'Situs Teknologi'],
    ai_ecosystem:     ['Reviewer Video Pendek', 'Komunitas Online', 'Podcast Tech']
};

export class ProductSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
        this._promotion = null;
        this._componentPlants = null;
        this._nav = null;
        this._channels = null;
        this._market = null;
    }

    // Navigasi pasar (MarketNavSystem): segmen, wilayah, gelombang tren, dan efek viral ke permintaan.
    setMarketNav(nav) { this._nav = nav; }
    // [kanal distribusi] ChannelSystem: pengali jangkauan permintaan & retensi pendapatan (netral bila tidak ada kanal aktif).
    setChannels(ch) { this._channels = ch; }
    _channelReach(p) { return this._channels ? this._channels.getReachFactor(p) : 1.0; }
    // [pasca-jual] AfterSalesSystem: pengali permintaan dari garansi, kepuasan servis, dukungan OS, dan stigma cacat (1.0 bila tidak ada).
    setAfterSales(as) { this._afterSales = as; }
    _afterSalesFactor(p) { return this._afterSales ? this._afterSales.getDemandFactor(p) : 1.0; }
    // [ekosistem] EcosystemSystem: pengali kecil dari skor lock-in (1.0 bila belum ada aksesori / App Store).
    setEcosystem(eco) { this._ecosystem = eco; }
    _ecosystemFactor(p) { return this._ecosystem ? this._ecosystem.getDemandFactor(p) : 1.0; }

    // Sistem pasar: dipakai untuk memperkirakan tekanan kompetitor di wizard.
    setMarketSystem(market) { this._market = market; }

    _getCompetitorFactor(stats, price) {
        if (!this._market || typeof this._market.estimatePressure !== 'function') return 0.8;
        var pressure = this._market.estimatePressure(stats, price);
        return Math.max(0.4, 1 / (1 + (pressure || 0)));
    }

    // Promosi regional (PromotionSystem) menambah lift ke faktor pemasaran.
    setPromotionSystem(ps) { this._promotion = ps; }

    // Pabrik komponen internal: stok baterai & layar diambil dari sini saat rilis dan restok.
    setComponentPlantSystem(cps) { this._componentPlants = cps; }
    setAssemblySystem(asm) { this._assembly = asm; }
    setEconBrakes(eb) { this._econ = eb; }

    // [v2029.1] Pengali biaya volume & tagihan produksi massal.
    _volMult(qty) { return this._econ ? this._econ.volumeMultiplier(qty) : 1; }
    _recordProd(qty) { if (this._econ) this._econ.recordProduction(qty); }
    // Tagihan produksi tambahan (restock): komponen x pengali volume + biaya setup.
    // Tagihan desain (sama persis dengan confirmDesign): komponen non-pabrik x pengali volume + setup.
    quoteDesign(config) {
        var qty = (config && config.productionQty) || 0;
        var vm = this._volMult(qty);
        return { volMult: vm, total: Math.round(this.computeUnitCost(config, true) * qty * vm) + BALANCE.products.productionSetupCost };
    }
    quoteProduction(config, qty) {
        var parts = this.computeUnitCost(config, true) * qty + this._quoteComponents(config, qty);
        if (this._assembly) { try { parts = parts * this._assembly.getCostFactor(); } catch (e) {} }
        var vm = this._volMult(qty);
        return { volMult: vm, parts: Math.round(parts), total: Math.round(parts * vm + BALANCE.products.productionSetupCost) };
    }

    start() {
        var self = this;
        this._unsubs.push(bus.on('time:day-changed', function (s) { self._onDayChanged(s); }));
        this._unsubs.push(bus.on('state:hydrated',   function () { self._onHydrated(); }));
        console.info('[ProductSystem] siap.');
    }

    stop() {
        this._unsubs.forEach(function (u) { u(); });
        this._unsubs = [];
    }

    _onHydrated() {
        var data = this.state.data;
        if (!data.products.catalog) data.products.catalog = [];
        if (!data.marketing.activeCampaigns) data.marketing.activeCampaigns = [];

        var defThreshold = (BALANCE.products.autoRestock && BALANCE.products.autoRestock.defaultThresholdPercent) || 20;

        data.products.catalog.forEach(function (p) {
            if (typeof p.stock !== 'number') p.stock = 0;
            if (typeof p.totalSold !== 'number') p.totalSold = 0;
            if (typeof p.totalRevenue !== 'number') p.totalRevenue = 0;
            if (typeof p.totalProduced !== 'number') p.totalProduced = p.stock;
            if (!Array.isArray(p.reviews)) p.reviews = [];
            if (!p.status) p.status = 'selling';
            if (typeof p.baseCapacity !== 'number') p.baseCapacity = (p.config && p.config.productionQty) || 5000;
            if (!p.milestonesHit || typeof p.milestonesHit !== 'object') p.milestonesHit = {};
            if (!Array.isArray(p.pendingProduction)) p.pendingProduction = [];

            if (!p.autoRestock || typeof p.autoRestock !== 'object') {
                p.autoRestock = { enabled: false, thresholdPercent: defThreshold, lastAutoOrderMinute: 0, lastWarnMinute: 0 };
            } else {
                if (typeof p.autoRestock.enabled !== 'boolean') p.autoRestock.enabled = false;
                if (typeof p.autoRestock.thresholdPercent !== 'number') p.autoRestock.thresholdPercent = defThreshold;
                if (typeof p.autoRestock.lastAutoOrderMinute !== 'number') p.autoRestock.lastAutoOrderMinute = 0;
                if (typeof p.autoRestock.lastWarnMinute !== 'number') p.autoRestock.lastWarnMinute = 0;
            }
        });

        var d = data.products.development;
        if (d) {
            if (typeof d.phaseProgressDays !== 'number') d.phaseProgressDays = 0;
            if (typeof d.phaseDurationDays !== 'number') d.phaseDurationDays = 0;
            if (typeof d.lastProcessedMinute !== 'number') d.lastProcessedMinute = data.time.elapsedGameMinutes;
            if (!d.phase) d.phase = 'design';
        }
    }

    // ============================================================
    // STATISTIK PRODUK
    // ============================================================
    computeStats(config) {
        var stats = {
            display: 0, camera: 0, battery: 0, performance: 0,
            connectivity: 0, quality: 0, design: 0, usability: 0
        };
        var map = {
            display: config.displayId, camera: config.cameraId,
            battery: config.batteryId, chip: config.chipId,
            network: config.networkId, body: config.bodyId, ram: config.ramId, storage: config.storageId,
            form_factor: config.formFactorId
        };
        for (var k in map) {
            var comp = getComponentById(map[k]);
            if (!comp) continue;
            for (var s in comp.stats) {
                if (stats[s] !== undefined) stats[s] += comp.stats[s];
            }
        }
        var color = getBodyColorById(config.bodyColorId);
        if (color) stats.design += (color.designBonus || 0);

        // [R&D berkelanjutan] Level penyempurnaan teknologi menambah stat produk baru.
        var mastery = (this.state.data.research && this.state.data.research.mastery) || {};
        Object.keys(RND_TRACKS).forEach(function (cat) {
            var ps = RND_TRACKS[cat].productStat;
            if (stats[ps] !== undefined) stats[ps] += getMasteryStatBonus(mastery[cat] || 0);
        });

        // [Pabrik] Bonus spesifikasi dari pabrik sendiri (baterai & layar).
        var plantBat = getBuiltPlantEffect(this.state.data, 'battery', 'batteryLife');
        var plantDisp = getBuiltPlantEffect(this.state.data, 'display', 'displayQuality');
        stats.battery = stats.battery * (1 + plantBat);
        stats.display = stats.display * (1 + plantDisp);
        // [Pabrik] SoC (performa), Kamera (kualitas foto), RAM (kelancaran/kegunaan).
        stats.performance = stats.performance * (1 + getBuiltPlantEffect(this.state.data, 'soc', 'performance'));
        stats.camera = stats.camera * (1 + getBuiltPlantEffect(this.state.data, 'camera', 'cameraQuality'));
        // RAM: efek berupa poin tambahan pada skala 0–100 (L1 +2 … L4 +8), bukan perkalian.
        stats.usability = stats.usability + getBuiltPlantEffect(this.state.data, 'ram', 'usability') * 100;
        // [Mesin Game] Bonus performa sebanding performa chip, hanya bila OS milik pemain punya App Store (FutureEffects.js).
        var chipComp = getComponentById(config.chipId);
        var chipPerf = (chipComp && chipComp.stats && chipComp.stats.performance) || 0;
        stats.performance += getGameEnginePerfBonus(chipPerf, config.osOptionId, this.state.data);
        // [Fitur Ponsel] Tambahan stat dari modul fitur (sudah dibatasi FEATURE_STAT_CAP). Tanpa featureIds = netral.
        var featStats = getFeatureStats(config.featureIds);
        for (var fk in featStats) {
            if (stats[fk] !== undefined) stats[fk] += featStats[fk];
        }

        ['display','camera','battery','performance','connectivity','quality','design','usability'].forEach(function (k) {
            stats[k] = Math.max(0, Math.min(100, Math.round(stats[k])));
        });

        var qualityScore = Math.round(
            stats.display * 0.15 +
            stats.camera * 0.15 +
            stats.battery * 0.15 +
            stats.performance * 0.20 +
            stats.connectivity * 0.10 +
            stats.quality * 0.10 +
            stats.design * 0.10 +
            stats.usability * 0.05
        );
        stats.qualityScore = qualityScore;
        return stats;
    }

    // excludePlantParts=true: hanya komponen non-pabrik (baterai, layar, SoC, kamera & RAM ditangani stok pabrik).
    computeUnitCost(config, excludePlantParts) {
        var cost = 0;
        var ids = [config.displayId, config.cameraId, config.batteryId,
                   config.chipId, config.networkId, config.bodyId, config.formFactorId, config.ramId, config.storageId];
        var self = this;
        ids.forEach(function (id) {
            var c = getComponentById(id);
            if (excludePlantParts && c && getPlantTypeForCategory(c.category)) return;
            // Harga internal jika pabrik komponen (baterai/layar) sudah dibangun.
            if (c) cost += resolveComponentCost(self.state.data, c);
        });
        // [Fitur Ponsel] Biaya modul fitur per unit (bukan komponen pabrik, jadi selalu ikut).
        cost += getFeatureUnitCost(config.featureIds);
        return Math.round(cost);
    }

    // [Fitur Ponsel] Pengali permintaan dari fitur. Dipakai estimasi wizard DAN permintaan nyata
    // (fungsi yang sama, supaya angka pratinjau = angka setelah rilis).
    // Produk/save lama tanpa featureIds -> 1 (netral).
    getFeatureAnalysisFor(configOrProduct) {
        var cfg = configOrProduct && (configOrProduct.config || configOrProduct);
        return getFeatureAnalysis(cfg ? cfg.featureIds : null, this.state.data.time.currentYear,
            { storageGB: cfg ? getStorageGBForComponent(cfg.storageId) : 0 });
    }
    _getFeatureFactor(configOrProduct) {
        var f = this.getFeatureAnalysisFor(configOrProduct).factor;
        return (typeof f === 'number' && isFinite(f) && f > 0) ? f : 1;
    }

    estimateDemand(config) {
        var data = this.state.data;
        var stats = this.computeStats(config);
        var era = data.era || 'feature_phone';
        var macro = getMacro(data.time, BALANCE.macro);
        var baseDemand = macro.baseDemand * macro.demandCycle;
        var ff = getComponentById(config.formFactorId);
        var baseMult = (ff && ff.baseDemandMultiplier) ? ff.baseDemandMultiplier : 1.0;
        var w = BALANCE.products.weights;
        var refs = BALANCE.products.refs;

        var qualityF = Math.pow(Math.max(0.2, stats.qualityScore / macro.qualityRef), w.quality);
        var priceF   = Math.pow(Math.max(0.2, macro.priceRef / Math.max(1, config.price)), w.price * macro.priceSensitivity);
        var repF     = Math.pow(Math.max(0.2, (data.market.reputation || 10) / refs.reputation), w.reputation);
        var marketingF = 1.0;
        var osFactor = this._getOsFactor(config);
        var trendF = this._getTrendFactor(stats);
        var competitorF = this._getCompetitorFactor(stats, config.price);
        var lifecycleF = 1.0;
        var techF = this._getTechFactor(null);
        var navF = this._nav ? this._nav.estimateFactor(stats, config.price, config) : 1.0;
        var featureF = this._getFeatureFactor(config);
        var channelF = this._channelReach({ price: config.price, config: config });

        var demand = baseDemand * baseMult * qualityF * priceF * repF * marketingF * osFactor * trendF * competitorF * lifecycleF * techF * navF * featureF * channelF;
        return Math.max(0, Math.round(demand));
    }

    _getOsFactor(configOrProduct) {
        var data = this.state.data;
        var osOptionId = null;

        if (configOrProduct) {
            if (configOrProduct.osOptionId) osOptionId = configOrProduct.osOptionId;
            else if (configOrProduct.config && configOrProduct.config.osOptionId) {
                osOptionId = configOrProduct.config.osOptionId;
            }
        }

        var stats = null;
        if (osOptionId) {
            if (osOptionId.indexOf('own:') === 0) {
                var versionId = osOptionId.slice(4);
                var v = (data.os.versions || []).find(function (x) { return x.id === versionId; });
                if (v && v.stats) {
                    var osSys = window.__game && window.__game.os ? window.__game.os : null;
                    stats = (osSys && osSys.getEffectiveStats) ? osSys.getEffectiveStats(v) : v.stats;
                }
            } else if (osOptionId.indexOf('license:') === 0) {
                var licenseId = osOptionId.slice(8);
                var lic = getLicenseById(licenseId);
                if (lic && lic.stats) stats = getLicenseStatsAtYear(lic, data.time.currentYear);
            }
        }

        if (!stats) {
            var os = window.__game && window.__game.os ? window.__game.os : null;
            if (!os) return 0.7;
            stats = os.getCurrentStats();
            if (!stats) return 0.7;
        }

        var avg = (stats.stability + stats.speed + stats.features + stats.security + stats.design) / 5;
        return Math.pow(Math.max(0.2, avg / BALANCE.products.refs.os), BALANCE.products.weights.os)
             * getDevToolsDemandMult(osOptionId, data)
             * getUserControlDemandMult(osOptionId, data);   // Kontrol Pengguna: kebijakan data (FutureEffects.js)
    }

    // Faktor teknologi: (1) keunggulan level R&D saat produk dirancang vs standar
    // pasar HARI INI — produk lama makin usang seiring standar naik; (2) gaung pasar
    // dari terobosan terbaru. Produk lama tanpa snapshot dianggap netral (save lama aman).
    _getTechFactor(p) {
        var data = this.state.data;
        var year = data.time.currentYear;
        var edgeF = 1.0;
        if (p === null) {
            edgeF = computeTechEdge((data.research && data.research.mastery) || {}, year).factor;
        } else if (p && p.techSnapshot && p.techSnapshot.levels) {
            edgeF = computeTechEdge(p.techSnapshot.levels, year).factor;
        }
        var bz = BALANCE.rnd.buzz;
        var buzzF = 1 + Math.min(bz.maxDemandBonus, ((data.research && data.research.buzz) || 0) * bz.demandPerPoint);
        return edgeF * buzzF;
    }

    _getTrendFactor(stats) {
        var data = this.state.data;
        var trends = data.market.trends || BALANCE.market.trendsByEra[data.era] || {};
        var mapping = { camera: stats.camera, battery: stats.battery, screen: stats.display, performance: stats.performance, design: stats.design };
        var sum = 0, weightSum = 0;
        for (var k in trends) {
            var w = trends[k] || 0;
            var v = mapping[k] || 0;
            sum += w * (v / 100);
            weightSum += w;
        }
        if (weightSum === 0) return 1.0;
        return 0.5 + (sum / weightSum);
    }

    _isNameTaken(name) {
        var norm = (name || '').trim().toLowerCase();
        if (!norm) return false;
        var catalog = this.state.data.products.catalog || [];
        return catalog.some(function (p) {
            return (p.name || '').trim().toLowerCase() === norm;
        });
    }

    // ============================================================
    // KONFIRMASI DESAIN
    // ============================================================
    confirmDesign(config) {
        var data = this.state.data;
        if (data.products.development) return { ok: false, reason: 'Ada produk yang sedang dikembangkan.' };

        if (config.cameraId === 'none') config.cameraId = null;
        if (config.ramId === 'none') config.ramId = null;
        if (config.storageId === 'none') config.storageId = null;

        var required = ['displayId', 'batteryId', 'chipId', 'networkId', 'formFactorId', 'bodyId'];
        for (var i = 0; i < required.length; i++) {
            var k = required[i];
            if (!config[k]) return { ok: false, reason: 'Komponen belum lengkap: ' + k };
        }
        if (!config.osOptionId) return { ok: false, reason: 'Pilih OS.' };

        var name = (config.name || '').trim();
        if (!name) return { ok: false, reason: 'Nama produk kosong.' };
        if (this._isNameTaken(name)) return { ok: false, reason: 'Nama "' + name + '" sudah dipakai produk lain.' };

        if (config.productionQty < 100) return { ok: false, reason: 'Jumlah produksi minimal 100 unit.' };

        // [Fitur Ponsel] Validasi pilihan fitur (riset, tahun, grup eksklusif). Kosong/undefined = tanpa fitur.
        if (config.featureIds !== undefined && !Array.isArray(config.featureIds)) config.featureIds = [];
        if (Array.isArray(config.featureIds)) {
            var fv = validateFeatureSelection(config.featureIds, data.time.currentYear, (data.research && data.research.completed) || []);
            if (!fv.ok) return { ok: false, reason: fv.reason };
        }

        var unitCost = this.computeUnitCost(config);
        
        // ============================================================
        // VALIDASI BATAS HARGA (FLOOR & CEILING)
        // ============================================================
        var minPrice = unitCost + 1;
        var maxPrice = Math.ceil(Math.max(unitCost * 2.2 * 1.5, unitCost * 4));
        
        if (config.price < minPrice) {
            return { ok: false, reason: 'Harga di bawah biaya produksi (Min $' + minPrice + ').' };
        }
        if (config.price > maxPrice) {
            return { ok: false, reason: 'Harga melampaui batas logis pasar (Max $' + maxPrice + ').' };
        }

        var setupCost = BALANCE.products.productionSetupCost;
        // Baterai & layar tidak ditagih di sini: diambil dari stok pabrik atau dibeli harga pasar saat rilis.
        var volMult = this._volMult(config.productionQty);
        var totalCost = Math.round(this.computeUnitCost(config, true) * config.productionQty * volMult) + setupCost;

        if (!WalletService.canAfford(totalCost)) return { ok: false, reason: 'Uang tidak cukup. Butuh $' + totalCost.toLocaleString('en-US') + '.' };

        var stats = this.computeStats(config);
        var baseDays = 40 + Math.floor(config.productionQty / 5000);
        var speedup = this._getDevSpeedMultiplier();
        var totalDays = Math.max(7, Math.round(baseDays / speedup));

        WalletService.pay(totalCost, 'product-dev');
        this._recordProd(config.productionQty);

        var productId = 'p_' + Date.now() + '_' + data.products.nextProductId;
        data.products.nextProductId += 1;

        var project = {
            id: productId,
            name: name,
            config: Object.assign({}, config, Array.isArray(config.featureIds) ? { featureIds: config.featureIds.slice() } : {}),
            stats: stats,
            unitCost: unitCost,
            volMult: volMult,
            totalCost: totalCost,
            price: config.price,
            productionQty: config.productionQty,
            phase: 'design',
            phaseProgressDays: 0,
            phaseDurationDays: Math.max(3, Math.round(totalDays * 0.3)),
            totalDurationDays: totalDays,
            techSnapshot: { levels: Object.assign({}, (data.research && data.research.mastery) || {}), year: data.time.currentYear },
            startedAtGameMinute: data.time.elapsedGameMinutes,
            lastProcessedMinute: data.time.elapsedGameMinutes,
            startedAt: { year: data.time.currentYear, month: data.time.currentMonth, day: data.time.currentDay }
        };
        data.products.development = project;
        data.products.designing = null;

        this.state.addLog('Mulai kembangkan "' + name + '" (biaya $' + totalCost.toLocaleString('en-US') + ').', LOG_TYPES.info);
        ToastService.success('Pengembangan "' + name + '" dimulai!');
        bus.emit('product:development-started', { productId: productId, name: name, phases: 4 });
        bus.emit('tutorial:action', { id: 'action:product-started' });
        bus.emit('state:changed', data);
        return { ok: true, productId: productId, totalCost: totalCost, totalDays: totalDays };
    }

    cancelDevelopment() {
        var data = this.state.data;
        var d = data.products.development;
        if (!d) return { ok: false, reason: 'Tidak ada pengembangan aktif.' };
        var refund = Math.floor(d.totalCost * 0.5);
        this.state.addCash(refund);
        data.products.development = null;
        this.state.addLog('Pengembangan dibatalkan (refund $' + refund.toLocaleString('en-US') + ').', LOG_TYPES.warning);
        bus.emit('product:development-cancelled', { productId: d.id, refund: refund });
        bus.emit('state:changed', data);
        return { ok: true, refund: refund };
    }

    _getDevSpeedMultiplier() {
        var t = this.state.data.team;
        return 1 + (t.designers * 0.10) + (t.engineers * 0.05);
    }

    // ============================================================
    // TICK HARIAN
    // ============================================================
    _onDayChanged(_snap) {
        var data = this.state.data;
        if (data.products.development) this._tickDevelopment();
        this._tickMarketing();
        this._processDailySales();
        this._chargeWarehouse();
        this._maybeAddRandomReviews();
        this._tickAutoRestock();
        this._tickPendingProduction();
    }

    _tickDevelopment() {
        var data = this.state.data;
        var d = data.products.development;
        var currentMinute = data.time.elapsedGameMinutes;
        var last = typeof d.lastProcessedMinute === 'number' ? d.lastProcessedMinute : d.startedAtGameMinute;
        var deltaMin = currentMinute - last;
        if (deltaMin <= 0) return;

        var speed = this._getDevSpeedMultiplier();
        d.phaseProgressDays += (deltaMin / MINUTES_PER_DAY) * speed;
        d.lastProcessedMinute = currentMinute;

        var phaseIndex = { design: 1, prototype: 2, production: 3, released: 4 };
        var percentOverall = ((phaseIndex[d.phase] - 1) * 25) + Math.min(25, (d.phaseProgressDays / d.phaseDurationDays) * 25);

        bus.emit('product:development-progress', {
            productId: d.id,
            name: d.name,
            phase: d.phase,
            percentOverall: Math.round(percentOverall),
            remainingDays: Math.max(0, Math.ceil((d.phaseDurationDays - d.phaseProgressDays) / speed))
        });

        if (d.phaseProgressDays >= d.phaseDurationDays) {
            var sequence = ['design', 'prototype', 'production', 'released'];
            var idx = sequence.indexOf(d.phase);
            if (idx < sequence.length - 1) {
                var next = sequence[idx + 1];
                d.phase = next;
                d.phaseProgressDays = 0;
                d.phaseDurationDays = Math.max(3, Math.round(d.totalDurationDays * 0.25));
                this.state.addLog('"' + d.name + '" tahap: ' + next + '.', LOG_TYPES.info);
                bus.emit('product:phase-changed', { productId: d.id, phase: next });
            } else {
                this._releaseProduct(d);
            }
        }
    }

    // [Pabrik] Baterai, layar, SoC, kamera & RAM: stok pabrik dipakai dulu. Kekurangan dibeli harga pasar.
    // _quoteComponents hanya menghitung (tanpa mengurangi stok); _settleComponents
    // mengurangi stok dan mengembalikan tagihan. Penagihan dilakukan pemanggil.
    _quoteComponents(cfg, qty) {
        var cps = this._componentPlants;
        var self = this;
        var bill = 0;
        [cfg.batteryId, cfg.displayId, cfg.chipId, cfg.cameraId, cfg.ramId].forEach(function (id) {
            var comp = getComponentById(id);
            if (!comp) return;
            var have = cps ? cps.getInventory(id) : 0;
            bill += Math.max(0, qty - have) * getMarketPrice(self.state.data, comp);
        });
        return Math.round(bill);
    }

    _settleComponents(cfg, qty) {
        var cps = this._componentPlants;
        if (!cps) return 0;
        var self = this, bill = 0;
        [cfg.batteryId, cfg.displayId, cfg.chipId, cfg.cameraId, cfg.ramId].forEach(function (id) {
            var comp = getComponentById(id);
            if (!comp) return;
            var r = cps.consumeForProduct(id, qty);
            bill += r.marketCost || 0;
            if (r.fromStock > 0) {
                self.state.addLog('Stok pabrik ' + comp.name + ': ' + r.fromStock.toLocaleString('en-US') + ' unit dipakai.', LOG_TYPES.info);
            }
        });
        return Math.round(bill);
    }

    _releaseProduct(d) {
        var data = this.state.data;
        var cfg = d.config;

        var product = {
            id: d.id,
            name: d.name,
            config: Object.assign({}, cfg, Array.isArray(cfg.featureIds) ? { featureIds: cfg.featureIds.slice() } : {}),
            stats: Object.assign({}, d.stats),
            techSnapshot: d.techSnapshot ? { levels: Object.assign({}, d.techSnapshot.levels), year: d.techSnapshot.year } : null,
            price: cfg.price,
            unitCost: d.unitCost,
            stock: cfg.productionQty,
            totalProduced: cfg.productionQty,
            baseCapacity: cfg.productionQty,
            totalSold: 0,
            totalRevenue: 0,
            status: 'selling',
            releaseGameMinute: data.time.elapsedGameMinutes,
            releaseDate: {
                year: data.time.currentYear,
                month: data.time.currentMonth,
                day: data.time.currentDay
            },
            reviews: [],
            dailySales: [],
            competitorPressure: 0.2,
            milestonesHit: {},
            pendingProduction: [],
            autoRestock: {
                enabled: false,
                thresholdPercent: (BALANCE.products.autoRestock && BALANCE.products.autoRestock.defaultThresholdPercent) || 20,
                lastAutoOrderMinute: 0,
                lastWarnMinute: 0
            }
        };

        var activeCount = data.products.catalog.filter(function (p) { return p.status === 'selling'; }).length;
        if (activeCount >= BALANCE.products.maxActiveProducts) {
            ToastService.warning('Katalog penuh (maks ' + BALANCE.products.maxActiveProducts + ' produk aktif).');
        }

        var rv = this._generateReview(product, true);
        product.reviews.push(rv);

        var repDelta = this._reviewReputationDelta(rv.score, 1);
        if (repDelta !== 0) this.state.addReputation(repDelta);

        var partsBill = Math.round(this._settleComponents(cfg, cfg.productionQty) * (d.volMult || 1));
        if (partsBill > 0) {
            this.state.addCash(-partsBill);
            this.state.addLog('Komponen "' + product.name + '" dibeli harga pasar: $' + partsBill.toLocaleString('en-US') + '.', LOG_TYPES.info);
        }

        data.products.catalog.push(product);
        data.products.development = null;

        if (data.products.catalog.length === 1) {
            this.state.addMilestone('first_product', 'Ponsel pertama dirilis: ' + product.name);
        }

        this.state.addLog('"' + product.name + '" dirilis! Ulasan: ' + rv.score + '/10.', LOG_TYPES.success);
        ToastService.success('Rilis: ' + product.name + ' (' + rv.score + '/10)');
        if (data.settings.vibrate) { try { if (navigator.vibrate) navigator.vibrate([30, 40, 30]); } catch (e) {} }

        bus.emit('product:released', { productId: product.id, name: product.name, score: rv.score });
        bus.emit('state:changed', data);
    }

    // ============================================================
    // PENJUALAN HARIAN
    // ============================================================
    _processDailySales() {
        var data = this.state.data;
        if (!data.products.catalog.length) return;

        // [v2029.1] Pass 1: permintaan mentah semua produk yang dijual.
        var rows = [], rawTotal = 0;
        for (var i = 0; i < data.products.catalog.length; i++) {
            var p = data.products.catalog[i];
            if (p.status !== 'selling') continue;
            var dm = this._computeDailyDemand(p);
            rows.push({ p: p, demand: dm });
            rawTotal += dm;
        }
        // Plafon pasar: total permintaan jenuh (semua produk berbagi pasar yang sama).
        var capFactor = this._econ ? this._econ.applyDemandCap(rawTotal) : 1;

        var totalDailyRevenue = 0;
        for (var r = 0; r < rows.length; r++) {
            var p = rows[r].p;
            if (p.stock <= 0) continue;

            var demand = Math.round(rows[r].demand * capFactor);
            var sold = Math.min(demand, p.stock);
            if (sold <= 0) continue;

            var grossRevenue = sold * p.price;
            // [Kanal] potongan margin untuk unit yang lewat operator/online (1.0 bila tidak ada kanal aktif).
            var revenue = this._channels ? Math.round(grossRevenue * this._channels.getRetention(p)) : grossRevenue;
            if (this._channels) this._channels.recordSale(p, sold, grossRevenue, revenue);
            p.stock -= sold;
            p.totalSold += sold;
            p.totalRevenue += revenue;
            totalDailyRevenue += revenue;

            bus.emit('product:sale', { productId: p.id, sold: sold, revenue: revenue });

            if (!p.dailySales) p.dailySales = [];
            p.dailySales.push({ day: data.time.elapsedGameMinutes, sold: sold, revenue: revenue });
            if (p.dailySales.length > 400) p.dailySales.shift();

            this._checkSalesMilestones(p);

            if (p.stock === 0) {
                this.state.addLog('Stok "' + p.name + '" habis.', LOG_TYPES.warning);
                bus.emit('product:stock-out', { productId: p.id, name: p.name });
            }
        }

        if (totalDailyRevenue > 0) {
            this.state.addCash(totalDailyRevenue);
            bus.emit('economy:add-revenue', { amount: totalDailyRevenue });
            bus.emit('product:daily-sales-processed', { totalRevenue: totalDailyRevenue });
        }
    }

    _checkSalesMilestones(p) {
        try {
            var milestones = [1000000, 10000000, 100000000];
            var labels = { 1000000: '1m', 10000000: '10m', 100000000: '100m' };
            if (!p.milestonesHit) p.milestonesHit = {};
            for (var i = 0; i < milestones.length; i++) {
                var m = milestones[i];
                if (p.totalSold >= m && !p.milestonesHit[m]) {
                    p.milestonesHit[m] = true;
                    bus.emit('product:milestone-sales', {
                        productId: p.id,
                        productName: p.name,
                        milestone: labels[m],
                        totalSold: p.totalSold,
                        price: p.price
                    });
                }
            }
        } catch (err) {
            console.error('[ProductSystem] _checkSalesMilestones error:', err);
        }
    }

    _computeDailyDemand(p) {
        var data = this.state.data;
        var era = data.era || 'feature_phone';
        var macro = getMacro(data.time, BALANCE.macro);
        var baseDemand = macro.baseDemand * macro.demandCycle;
        var ff = getComponentById(p.config.formFactorId);
        var baseMult = (ff && ff.baseDemandMultiplier) ? ff.baseDemandMultiplier : 1.0;
        var w = BALANCE.products.weights;
        var refs = BALANCE.products.refs;

        var qualityF = Math.pow(Math.max(0.2, p.stats.qualityScore / macro.qualityRef), w.quality);
        var priceF   = Math.pow(Math.max(0.2, macro.priceRef / Math.max(1, p.price)), w.price * macro.priceSensitivity);
        var repF     = Math.pow(Math.max(0.2, (data.market.reputation || 10) / refs.reputation), w.reputation);
        var marketingF = this._getMarketingFactor(p.id);
        var osFactor = this._getOsFactor(p);
        var trendF = this._getTrendFactor(p.stats);
        var ecoRelief = this._ecosystem ? this._ecosystem.getCompetitorRelief() : 1.0; // [ekosistem] lock-in menekan tekanan kompetitor
        var competitorF = Math.max(0.4, 1 / (1 + (p.competitorPressure || 0) * ecoRelief));
        var lifecycleF = this._getLifecycleFactor(p);
        var techF = this._getTechFactor(p);
        var navF = this._nav ? this._nav.getDemandFactor(p) : 1.0;
        // [era-event] pengali sementara dari keputusan event 2000–2002 (1.0 bila tidak ada).
        var eventF = getEraEventDemandFactor(data, p);
        var featureF = this._getFeatureFactor(p);   // [Fitur Ponsel] 1.0 untuk produk lama
        var channelF = this._channelReach(p);       // [Kanal] 1.0 bila tidak ada kanal aktif
        var afterSalesF = this._afterSalesFactor(p); // [Pasca-jual] 1.0 bila belum ada data
        var ecosystemF = this._ecosystemFactor(p);   // [Ekosistem] 1.0 bila belum ada aksesori / App Store

        // Noise harian dihaluskan (AR1) supaya penjualan tidak naik-turun liar.
        var sm = BALANCE.macro.demandNoiseSmoothing;
        var rawNoise = (Math.random() * 2 - 1) * BALANCE.products.dailyNoise;
        p.noiseState = (p.noiseState || 0) * sm + rawNoise * (1 - sm) * 1.8;
        var noise = 1 + Math.max(-BALANCE.products.dailyNoise, Math.min(BALANCE.products.dailyNoise, p.noiseState));

        var demand = baseDemand * baseMult * qualityF * priceF * repF
                     * marketingF * osFactor * trendF * competitorF
                     * lifecycleF * techF * navF * eventF * featureF * channelF * afterSalesF * ecosystemF * noise;

        return Math.max(0, Math.round(demand));
    }

    _getMarketingFactor(productId) {
        var data = this.state.data;
        var campaigns = data.marketing.activeCampaigns.filter(function (c) { return c.productId === productId; });
        var sum = 0;
        campaigns.forEach(function (c) { sum += c.effectiveReach || 0; });
        // Promosi regional (Global/Asia/Eropa) + brand wilayah.
        if (this._promotion) sum += this._promotion.getLiftForProduct(productId);
        if (sum <= 0) return 1.0;
        return Math.min(BALANCE.marketing.maxMarketingFactor, 1 + sum);
    }

    _getLifecycleFactor(p) {
        var ageDays = (this.state.data.time.elapsedGameMinutes - p.releaseGameMinute) / MINUTES_PER_DAY;
        var lc = BALANCE.products.lifecycle;
        if (ageDays < lc.riseDays)    return lc.riseMult + (ageDays / lc.riseDays) * (1 - lc.riseMult);
        if (ageDays < lc.peakDays)    return lc.peakMult;
        if (ageDays < lc.declineDays) return lc.peakMult - ((ageDays - lc.peakDays) / (lc.declineDays - lc.peakDays)) * (lc.peakMult - lc.declineMult);
        if (ageDays < lc.deadDays)    return lc.declineMult * (1 - (ageDays - lc.declineDays) / (lc.deadDays - lc.declineDays)) + lc.deadMult * ((ageDays - lc.declineDays) / (lc.deadDays - lc.declineDays));
        return lc.deadMult;
    }

    // ============================================================
    // AUTO-RESTOCK
    // ============================================================
    _tickAutoRestock() {
        var data = this.state.data;
        var cfg = BALANCE.products.autoRestock;
        if (!cfg) return;

        var now = data.time.elapsedGameMinutes;
        var cooldownMs = (cfg.defaultCooldownDays || 7) * MINUTES_PER_DAY;
        var warnInterval = (cfg.warnIntervalDays || 3) * MINUTES_PER_DAY;
        var minQty = cfg.minOrderQty || 100;
        var maxMult = cfg.maxStockMultiplier || 2.0;

        for (var i = 0; i < data.products.catalog.length; i++) {
            var p = data.products.catalog[i];
            if (p.status !== 'selling') continue;
            var ar = p.autoRestock;
            if (!ar || !ar.enabled) continue;

            var baseCapacity = p.baseCapacity || (p.config && p.config.productionQty) || 5000;
            var thresholdPct = (ar.thresholdPercent || 20) / 100;
            var threshold = baseCapacity * thresholdPct;
            var maxStock = baseCapacity * maxMult;

            if (p.stock > threshold) continue;
            if (p.stock >= maxStock) continue;
            if ((now - (ar.lastAutoOrderMinute || 0)) < cooldownMs) continue;

            var neededQty = baseCapacity - p.stock;
            if (neededQty < minQty) neededQty = minQty;
            if (p.stock + neededQty > maxStock) neededQty = maxStock - p.stock;
            if (neededQty <= 0) continue;

            var totalCost = this.quoteProduction(p.config, neededQty).total;

            if (data.cash < totalCost) {
                if ((now - (ar.lastWarnMinute || 0)) >= warnInterval) {
                    ToastService.warning('Auto-restock "' + p.name + '" gagal: butuh $' + totalCost.toLocaleString('en-US'));
                    this.state.addLog('Auto-restock "' + p.name + '" gagal: uang tidak cukup.', LOG_TYPES.warning);
                    ar.lastWarnMinute = now;
                    bus.emit('state:changed', data);
                }
                continue;
            }

            this.state.setCash(data.cash - totalCost);
            this._recordProd(neededQty);
            this._settleComponents(p.config, neededQty);
            p.stock += neededQty;
            p.totalProduced += neededQty;
            ar.lastAutoOrderMinute = now;
            ar.lastWarnMinute = 0;

            var msg = 'Auto-restock "' + p.name + '": +' + neededQty.toLocaleString('en-US') + ' unit ($' + totalCost.toLocaleString('en-US') + ')';
            this.state.addLog(msg, LOG_TYPES.success);
            ToastService.success('Auto-restock: ' + msg);
            bus.emit('product:auto-restocked', { productId: p.id, name: p.name, qty: neededQty, cost: totalCost });
        }
    }

    toggleAutoRestock(productId, enabled) {
        var data = this.state.data;
        var p = data.products.catalog.find(function (x) { return x.id === productId; });
        if (!p) return { ok: false, reason: 'Produk tidak ditemukan.' };
        if (!p.autoRestock) p.autoRestock = { enabled: false, thresholdPercent: 20, lastAutoOrderMinute: 0, lastWarnMinute: 0 };
        p.autoRestock.enabled = !!enabled;
        var label = enabled ? 'diaktifkan' : 'dimatikan';
        ToastService.info('Auto-restock "' + p.name + '" ' + label + '.');
        bus.emit('state:changed', data);
        return { ok: true };
    }

    setAutoRestockThreshold(productId, percent) {
        var data = this.state.data;
        var p = data.products.catalog.find(function (x) { return x.id === productId; });
        if (!p) return { ok: false, reason: 'Produk tidak ditemukan.' };
        if (!p.autoRestock) p.autoRestock = { enabled: false, thresholdPercent: 20, lastAutoOrderMinute: 0, lastWarnMinute: 0 };
        var clamped = Math.max(5, Math.min(80, percent));
        p.autoRestock.thresholdPercent = clamped;
        bus.emit('state:changed', data);
        return { ok: true, thresholdPercent: clamped };
    }

    // ============================================================
    // PEMASARAN
    // ============================================================
    startCampaign(productId, campaignId) {
        var data = this.state.data;
        var campaign = getCampaignById(campaignId);
        if (!campaign) return { ok: false, reason: 'Kampanye tidak ditemukan.' };
        var product = data.products.catalog.find(function (p) { return p.id === productId; });
        if (!product) return { ok: false, reason: 'Produk tidak ditemukan.' };
        if (product.status !== 'selling') return { ok: false, reason: 'Produk sudah tidak dijual.' };
        if (!WalletService.canAfford(campaign.cost)) return { ok: false, reason: 'Uang tidak cukup.' };

        WalletService.pay(campaign.cost, 'campaign');

        var marketers = data.team.marketers || 0;
        var bonus = 1 + marketers * BALANCE.marketing.perMarketerBonus;
        var effectiveReach = campaign.reachBase * bonus;

        var nowMin = data.time.elapsedGameMinutes;
        data.marketing.activeCampaigns.push({
            id: 'mc_' + Date.now(),
            campaignId: campaign.id,
            campaignName: campaign.name,
            productId: product.id,
            startedAtMinute: nowMin,
            endsAtMinute: nowMin + campaign.durationDays * MINUTES_PER_DAY,
            cost: campaign.cost,
            effectiveReach: effectiveReach
        });

        this.state.addLog('Kampanye "' + campaign.name + '" untuk ' + product.name + '.', LOG_TYPES.info);
        ToastService.success('Kampanye dimulai: ' + campaign.name);
        bus.emit('product:campaign-started', { productId: productId, campaignId: campaignId });
        bus.emit('state:changed', data);
        return { ok: true };
    }

    _tickMarketing() {
        var data = this.state.data;
        var now = data.time.elapsedGameMinutes;
        var before = data.marketing.activeCampaigns.length;
        data.marketing.activeCampaigns = data.marketing.activeCampaigns.filter(function (c) { return c.endsAtMinute > now; });
        if (data.marketing.activeCampaigns.length < before) {
            bus.emit('state:changed', data);
        }
    }

    // ============================================================
    // STOK & PRODUKSI
    // ============================================================
    // Jeda hari produksi manual (makin banyak unit, makin lama).
    getManualRestockDays(qty) {
        if (this._assembly) {
            try {
                if (this._assembly.isOperating()) {
                    var ad = this._assembly.getLeadDays(qty, this._assembly.getPendingUnits());
                    if (ad) return ad;
                }
            } catch (e) {}
        }
        var c = (BALANCE.products.manualRestock) || { baseDays: 2, unitsPerExtraDay: 2500, maxDays: 10 };
        var days = c.baseDays + Math.floor((qty || 0) / c.unitsPerExtraDay);
        return Math.max(1, Math.min(c.maxDays, days));
    }

    orderProduction(productId, qty) {
        var data = this.state.data;
        var p = data.products.catalog.find(function (x) { return x.id === productId; });
        if (!p) return { ok: false, reason: 'Produk tidak ditemukan.' };
        if (p.status !== 'selling') return { ok: false, reason: 'Produk sudah tidak dijual.' };
        if (qty < 100) return { ok: false, reason: 'Minimal 100 unit.' };
        var totalCost = this.quoteProduction(p.config, qty).total;
        if (!WalletService.canAfford(totalCost)) return { ok: false, reason: 'Uang tidak cukup.' };

        WalletService.pay(totalCost, 'restock');
        this._recordProd(qty);
        if (this._assembly) { try { this._assembly.recordOrder(qty); } catch (e) {} }
        this._settleComponents(p.config, qty);

        var days = this.getManualRestockDays(qty);
        if (!Array.isArray(p.pendingProduction)) p.pendingProduction = [];
        p.pendingProduction.push({
            id: 'po_' + Date.now() + '_' + p.pendingProduction.length,
            qty: qty,
            cost: totalCost,
            days: days,
            orderedAtMinute: data.time.elapsedGameMinutes,
            readyAtMinute: data.time.elapsedGameMinutes + days * MINUTES_PER_DAY
        });

        this.state.addLog('Produksi tambahan dipesan: ' + qty.toLocaleString('en-US') + ' unit "' + p.name + '" (siap ' + days + ' hari lagi).', LOG_TYPES.info);
        ToastService.success('Produksi ' + p.name + ' selesai dalam ' + days + ' hari.');
        bus.emit('product:production-ordered', { productId: p.id, name: p.name, qty: qty, days: days });
        bus.emit('state:changed', data);
        return { ok: true, totalCost: totalCost, days: days };
    }

    // Pesanan manual yang sudah lewat jedanya masuk ke stok.
    _tickPendingProduction() {
        var data = this.state.data;
        var now = data.time.elapsedGameMinutes;
        var changed = false;
        for (var i = 0; i < data.products.catalog.length; i++) {
            var p = data.products.catalog[i];
            if (!Array.isArray(p.pendingProduction) || p.pendingProduction.length === 0) continue;
            var still = [];
            for (var j = 0; j < p.pendingProduction.length; j++) {
                var o = p.pendingProduction[j];
                if (o.readyAtMinute <= now) {
                    p.stock += o.qty;
                    p.totalProduced += o.qty;
                    changed = true;
                    var msg = 'Produksi tambahan "' + p.name + '" tiba: +' + o.qty.toLocaleString('en-US') + ' unit.';
                    this.state.addLog(msg, LOG_TYPES.success);
                    ToastService.success(msg);
                    bus.emit('product:production-arrived', { productId: p.id, name: p.name, qty: o.qty });
                } else {
                    still.push(o);
                }
            }
            p.pendingProduction = still;
        }
        if (changed) bus.emit('state:changed', data);
    }

    _chargeWarehouse() {
        var data = this.state.data;
        var total = 0;
        data.products.catalog.forEach(function (p) {
            if (p.status === 'selling' && p.stock > 0) {
                total += p.stock * BALANCE.products.warehouseCostPerUnitPerDay;
            }
        });
        if (total > 0) this.state.addCash(-Math.round(total));
    }

    discontinueProduct(productId) {
        var data = this.state.data;
        var p = data.products.catalog.find(function (x) { return x.id === productId; });
        if (!p) return { ok: false, reason: 'Produk tidak ditemukan.' };
        if (p.status !== 'selling') return { ok: false, reason: 'Produk sudah tidak aktif.' };

        var discountPrice = Math.round(p.price * (1 - BALANCE.products.discontinueDiscountPercent));
        var fireSale = p.stock * discountPrice;
        p.status = 'discontinued';
        if (fireSale > 0) this.state.addCash(fireSale);
        p.stock = 0;
        p.pendingProduction = [];

        this.state.addLog('"' + p.name + '" dihentikan. Sisa stok dijual $' + fireSale.toLocaleString('en-US') + '.', LOG_TYPES.warning);
        ToastService.info(p.name + ' dihentikan.');
        bus.emit('product:discontinued', { productId: productId, fireSale: fireSale });
        bus.emit('state:changed', data);
        return { ok: true, fireSale: fireSale };
    }

    // ============================================================
    // ULASAN (editor review embedded di p.reviews)
    // ============================================================
    _generateReview(product, isInitial) {
        var era = this.state.data.era || 'feature_phone';
        var sources = REVIEW_SOURCES[era] || REVIEW_SOURCES.feature_phone;
        var source = sources[Math.floor(Math.random() * sources.length)];
        var macro = getMacro(this.state.data.time, BALANCE.macro);
        var q = product.stats.qualityScore + (BALANCE.products.refs.quality - macro.qualityRef);
        var base = reviewBaseScore(q);
        var expectedPrice = macro.priceRef * Math.pow(Math.max(0.3, q / BALANCE.products.refs.quality), 1.2);
        var valueAdj = -BALANCE.macro.reviewValueWeight * Math.log(Math.max(1, product.price) / expectedPrice);
        base += Math.max(-1.2, Math.min(1.0, valueAdj));
        var variance = (Math.random() * 2 - 1) * 0.9;
        var score = Math.round((base + variance) * 10) / 10;
        score = Math.max(1, Math.min(10, score));

        var statKeys = ['display', 'camera', 'battery', 'performance', 'connectivity', 'design', 'usability'];
        var best = statKeys[0], worst = statKeys[0];
        statKeys.forEach(function (k) {
            if ((product.stats[k] || 0) > (product.stats[best] || 0)) best = k;
            if ((product.stats[k] || 0) < (product.stats[worst] || 0)) worst = k;
        });

        var strongTextMap = {
            display: 'layar memukau', camera: 'kamera jempolan',
            battery: 'baterai awet', performance: 'performa ngebut',
            connectivity: 'konektivitas lancar', design: 'desain cantik',
            usability: 'mudah dipakai'
        };
        var weakTextMap = {
            display: 'layar kurang tajam', camera: 'kamera mengecewakan',
            battery: 'baterai boros', performance: 'performa lambat',
            connectivity: 'sinyal sering hilang', design: 'desain kaku',
            usability: 'sulit digunakan'
        };
        var strongText = strongTextMap[best] || 'berkualitas';
        var weakText = weakTextMap[worst] || 'ada kekurangan';

        var templatesPositive = [
            product.name + ' punya ' + strongText + '. Sangat direkomendasikan!',
            'Puas dengan ' + product.name + ', terutama ' + strongText + '.',
            strongText.charAt(0).toUpperCase() + strongText.slice(1) + ' jadi nilai jual utama ' + product.name + '.'
        ];
        var templatesMixed = [
            product.name + ': ' + strongText + ', tapi ' + weakText + '.',
            'Bagus untuk ' + strongText + ', sayang ' + weakText + '.',
            'Cukup oke. ' + strongText + ', hanya saja ' + weakText + '.'
        ];
        var templatesNegative = [
            product.name + ' mengecewakan. ' + weakText.charAt(0).toUpperCase() + weakText.slice(1) + '.',
            'Tidak sesuai harapan. ' + weakText.charAt(0).toUpperCase() + weakText.slice(1) + '.',
            'Banyak keluhan soal ' + product.name + ': ' + weakText + '.'
        ];

        var text;
        if (score >= 7) text = templatesPositive[Math.floor(Math.random() * templatesPositive.length)];
        else if (score >= 5) text = templatesMixed[Math.floor(Math.random() * templatesMixed.length)];
        else text = templatesNegative[Math.floor(Math.random() * templatesNegative.length)];

        var d = this.state.data;
        return {
            id: 'rv_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            source: source, score: score, text: text,
            year: d.time.currentYear,
            month: d.time.currentMonth,
            day: d.time.currentDay,
            gameMinute: d.time.elapsedGameMinutes,
            isInitial: !!isInitial
        };
    }

    _maybeAddRandomReviews() {
        var data = this.state.data;
        var active = data.products.catalog.filter(function (p) { return p.status === 'selling'; });
        if (!active.length) return;
        active.forEach(function (p) {
            if (Math.random() < BALANCE.reviews.perDayChance) {
                var rv = this._generateReview(p, false);
                p.reviews.push(rv);
                if (p.reviews.length > 10) p.reviews.shift();
                var repDelta = this._reviewReputationDelta(rv.score, 0.5);
                if (repDelta !== 0) this.state.addReputation(repDelta);
            }
        }.bind(this));
    }

    _reviewReputationDelta(score, factor) {
        var rep = this.state.data.market.reputation || 0;
        var max = BALANCE.market.maxReputation || 100;
        var raw = (score - 5) * BALANCE.products.reputationPerReviewPoint * factor;
        var room = raw > 0 ? (1 - rep / max) * 1.5 : (0.5 + rep / max);
        return raw * Math.max(0.1, Math.min(1.2, room));
    }

    // ============================================================
    // CHEAT
    // ============================================================
    quickRelease(configOverride) {
        var cfg = configOverride || this._pickCheatConfig();
        var res = this.confirmDesign(cfg);
        if (!res.ok) return res;
        var d = this.state.data.products.development;
        if (d) this._releaseProduct(d);
        return { ok: true };
    }

    _pickCheatConfig() {
        var data = this.state.data;
        var unlocked = COMPONENTS.filter(function (c) {
            return !c.requiresResearch || data.research.completed.indexOf(c.requiresResearch) !== -1;
        });
        var pick = function (catId) {
            var list = unlocked.filter(function (c) { return c.category === catId; });
            return list.length ? list[list.length - 1].id : null;
        };
        return {
            name: 'CheatPhone ' + Math.floor(Math.random() * 1000),
            formFactorId: pick('form_factor') || 'ff_candybar',
            displayId:    pick('display')     || 'scr_mono',
            cameraId:     pick('camera')      || null,
            batteryId:    pick('battery')     || 'bat_liion',
            chipId:       pick('chip')        || 'chip_single',
            networkId:    pick('network')     || 'net_gsm',
            bodyId:       pick('body')        || 'body_plastic',
            bodyColorId:  'color_black',
            osOptionId:   (window.__game && window.__game.os && window.__game.os.getCurrentVersionObject())
                            ? 'own:' + window.__game.os.getCurrentVersionObject().id
                            : null,
            price: 200,
            productionQty: 10000
        };
    }
                }
