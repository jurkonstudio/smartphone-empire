// FILE: src/systems/ProductSystem.js
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

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;

const REVIEW_SOURCES = {
    feature_phone:    ['Majalah Tekno', 'Forum HP', 'Tabloid Gadget'],
    touch_revolution: ['Blog Teknologi', 'Forum Diskusi', 'Portal Berita'],
    modern_smartphone:['YouTube Review', 'Media Sosial', 'Situs Teknologi'],
    ai_ecosystem:     ['Reviewer Video Pendek', 'Komunitas Online', 'Podcast Tech']
};

export class ProductSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        this._unsubs.push(bus.on('time:day-changed', (s) => this._onDayChanged(s)));
        this._unsubs.push(bus.on('state:hydrated',   () => this._onHydrated()));
        console.info('[ProductSystem] siap.');
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    _onHydrated() {
        const data = this.state.data;
        if (!data.products.catalog) data.products.catalog = [];
        if (!data.marketing.activeCampaigns) data.marketing.activeCampaigns = [];
        if (!data.reviews.feed) data.reviews.feed = [];

        const defThreshold = (BALANCE.products.autoRestock && BALANCE.products.autoRestock.defaultThresholdPercent) || 20;

        data.products.catalog.forEach(p => {
            if (typeof p.stock !== 'number') p.stock = 0;
            if (typeof p.totalSold !== 'number') p.totalSold = 0;
            if (typeof p.totalRevenue !== 'number') p.totalRevenue = 0;
            if (typeof p.totalProduced !== 'number') p.totalProduced = p.stock;
            if (!Array.isArray(p.reviews)) p.reviews = [];
            if (!p.status) p.status = 'selling';

            // Guard baseCapacity
            if (typeof p.baseCapacity !== 'number') {
                p.baseCapacity = (p.config && p.config.productionQty) || 5000;
            }

            // Guard autoRestock
            if (!p.autoRestock || typeof p.autoRestock !== 'object') {
                p.autoRestock = {
                    enabled: false,
                    thresholdPercent: defThreshold,
                    lastAutoOrderMinute: 0,
                    lastWarnMinute: 0
                };
            } else {
                if (typeof p.autoRestock.enabled !== 'boolean') p.autoRestock.enabled = false;
                if (typeof p.autoRestock.thresholdPercent !== 'number') p.autoRestock.thresholdPercent = defThreshold;
                if (typeof p.autoRestock.lastAutoOrderMinute !== 'number') p.autoRestock.lastAutoOrderMinute = 0;
                if (typeof p.autoRestock.lastWarnMinute !== 'number') p.autoRestock.lastWarnMinute = 0;
            }
        });

        const d = data.products.development;
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
        const stats = {
            display: 0, camera: 0, battery: 0, performance: 0,
            connectivity: 0, quality: 0, design: 0, usability: 0
        };
        const map = {
            display: config.displayId, camera: config.cameraId,
            battery: config.batteryId, chip: config.chipId,
            network: config.networkId, body: config.bodyId,
            form_factor: config.formFactorId
        };
        for (const k in map) {
            const comp = getComponentById(map[k]);
            if (!comp) continue;
            for (const s in comp.stats) {
                if (stats[s] !== undefined) stats[s] += comp.stats[s];
            }
        }
        const color = getBodyColorById(config.bodyColorId);
        if (color) stats.design += (color.designBonus || 0);

        ['display','camera','battery','performance','connectivity','quality','design','usability'].forEach(k => {
            stats[k] = Math.max(0, Math.min(100, Math.round(stats[k])));
        });

        const qualityScore = Math.round(
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

    computeUnitCost(config) {
        let cost = 0;
        const ids = [config.displayId, config.cameraId, config.batteryId,
                     config.chipId, config.networkId, config.bodyId, config.formFactorId];
        ids.forEach(id => {
            const c = getComponentById(id);
            if (c) cost += c.costPerUnit;
        });
        return Math.round(cost);
    }

    estimateDemand(config) {
        const data = this.state.data;
        const stats = this.computeStats(config);
        const era = data.era || 'feature_phone';
        const baseDemand = BALANCE.products.baseMarketDemand[era] || 5000;
        const ff = getComponentById(config.formFactorId);
        const baseMult = (ff && ff.baseDemandMultiplier) ? ff.baseDemandMultiplier : 1.0;
        const w = BALANCE.products.weights;
        const refs = BALANCE.products.refs;

        const qualityF = Math.pow(Math.max(0.2, stats.qualityScore / refs.quality), w.quality);
        const priceF   = Math.pow(Math.max(0.2, refs.price / Math.max(1, config.price)), w.price);
        const repF     = Math.pow(Math.max(0.2, (data.market.reputation || 10) / refs.reputation), w.reputation);
        const marketingF = 1.0;
        const osFactor = this._getOsFactor();
        const trendF = this._getTrendFactor(stats);
        const competitorF = 0.8;
        const lifecycleF = 1.0;

        const demand = baseDemand * baseMult * qualityF * priceF * repF * marketingF * osFactor * trendF * competitorF * lifecycleF;
        return Math.max(0, Math.round(demand));
    }

    _getOsFactor() {
        const os = window.__game && window.__game.os ? window.__game.os : null;
        if (!os || !os.getCurrentStats()) return 0.7;
        const stats = os.getCurrentStats();
        const avg = (stats.stability + stats.speed + stats.features + stats.security + stats.design) / 5;
        return Math.pow(Math.max(0.2, avg / BALANCE.products.refs.os), BALANCE.products.weights.os);
    }

    _getTrendFactor(stats) {
        const data = this.state.data;
        const trends = data.market.trends || BALANCE.market.trendsByEra[data.era] || {};
        const mapping = { camera: stats.camera, battery: stats.battery, screen: stats.display, performance: stats.performance, design: stats.design };
        let sum = 0, weightSum = 0;
        for (const k in trends) {
            const w = trends[k] || 0;
            const v = mapping[k] || 0;
            sum += w * (v / 100);
            weightSum += w;
        }
        if (weightSum === 0) return 1.0;
        return 0.5 + (sum / weightSum);
    }

    // ============================================================
    // KONFIRMASI DESAIN
    // ============================================================
    confirmDesign(config) {
        const data = this.state.data;
        if (data.products.development) return { ok: false, reason: 'Ada produk yang sedang dikembangkan.' };

        const required = ['displayId', 'cameraId', 'batteryId', 'chipId', 'networkId', 'formFactorId', 'bodyId'];
        for (const k of required) {
            if (!config[k]) return { ok: false, reason: 'Komponen belum lengkap: ' + k };
        }
        if (!config.osOptionId) return { ok: false, reason: 'Pilih OS.' };
        const name = (config.name || '').trim();
        if (!name) return { ok: false, reason: 'Nama produk kosong.' };
        if (config.price < 1) return { ok: false, reason: 'Harga minimal $1.' };
        if (config.productionQty < 100) return { ok: false, reason: 'Jumlah produksi minimal 100 unit.' };

        const unitCost = this.computeUnitCost(config);
        const setupCost = BALANCE.products.productionSetupCost;
        const totalCost = unitCost * config.productionQty + setupCost;

        if (data.cash < totalCost) return { ok: false, reason: 'Uang tidak cukup. Butuh $' + totalCost.toLocaleString('en-US') + '.' };

        const stats = this.computeStats(config);
        const baseDays = 40 + Math.floor(config.productionQty / 5000);
        const speedup = this._getDevSpeedMultiplier();
        const totalDays = Math.max(7, Math.round(baseDays / speedup));

        this.state.setCash(data.cash - totalCost);

        const productId = 'p_' + Date.now() + '_' + data.products.nextProductId;
        data.products.nextProductId += 1;

        const project = {
            id: productId,
            name: name,
            config: { ...config },
            stats: stats,
            unitCost: unitCost,
            totalCost: totalCost,
            price: config.price,
            productionQty: config.productionQty,
            phase: 'design',
            phaseProgressDays: 0,
            phaseDurationDays: Math.max(3, Math.round(totalDays * 0.3)),
            totalDurationDays: totalDays,
            startedAtGameMinute: data.time.elapsedGameMinutes,
            lastProcessedMinute: data.time.elapsedGameMinutes,
            startedAt: { year: data.time.currentYear, month: data.time.currentMonth, day: data.time.currentDay }
        };
        data.products.development = project;
        data.products.designing = null;

        this.state.addLog('Mulai kembangkan "' + name + '" (biaya $' + totalCost.toLocaleString('en-US') + ').', LOG_TYPES.info);
        ToastService.success('Pengembangan "' + name + '" dimulai!');
        bus.emit('product:development-started', { productId, name, phases: 4 });
        bus.emit('tutorial:action', { id: 'action:product-started' });
        bus.emit('state:changed', data);
        return { ok: true, productId, totalCost, totalDays };
    }

    cancelDevelopment() {
        const data = this.state.data;
        const d = data.products.development;
        if (!d) return { ok: false, reason: 'Tidak ada pengembangan aktif.' };
        const refund = Math.floor(d.totalCost * 0.5);
        this.state.addCash(refund);
        data.products.development = null;
        this.state.addLog('Pengembangan dibatalkan (refund $' + refund.toLocaleString('en-US') + ').', LOG_TYPES.warning);
        bus.emit('product:development-cancelled', { productId: d.id, refund });
        bus.emit('state:changed', data);
        return { ok: true, refund };
    }

    _getDevSpeedMultiplier() {
        const t = this.state.data.team;
        return 1 + (t.designers * 0.10) + (t.engineers * 0.05);
    }

    // ============================================================
    // TICK HARIAN
    // ============================================================
    _onDayChanged(_snap) {
        const data = this.state.data;
        if (data.products.development) this._tickDevelopment();
        this._tickMarketing();
        this._processDailySales();
        this._chargeWarehouse();
        this._maybeAddRandomReviews();
        this._tickAutoRestock();
    }

    _tickDevelopment() {
        const data = this.state.data;
        const d = data.products.development;
        const currentMinute = data.time.elapsedGameMinutes;
        const last = typeof d.lastProcessedMinute === 'number' ? d.lastProcessedMinute : d.startedAtGameMinute;
        const deltaMin = currentMinute - last;
        if (deltaMin <= 0) return;

        const speed = this._getDevSpeedMultiplier();
        d.phaseProgressDays += (deltaMin / MINUTES_PER_DAY) * speed;
        d.lastProcessedMinute = currentMinute;

        const phaseIndex = { design: 1, prototype: 2, production: 3, released: 4 };
        const percentOverall = ((phaseIndex[d.phase] - 1) * 25) + Math.min(25, (d.phaseProgressDays / d.phaseDurationDays) * 25);

        bus.emit('product:development-progress', {
            productId: d.id,
            name: d.name,
            phase: d.phase,
            percentOverall: Math.round(percentOverall),
            remainingDays: Math.max(0, Math.ceil((d.phaseDurationDays - d.phaseProgressDays) / speed))
        });

        if (d.phaseProgressDays >= d.phaseDurationDays) {
            const sequence = ['design', 'prototype', 'production', 'released'];
            const idx = sequence.indexOf(d.phase);
            if (idx < sequence.length - 1) {
                const next = sequence[idx + 1];
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

    _releaseProduct(d) {
        const data = this.state.data;
        const cfg = d.config;

        const product = {
            id: d.id,
            name: d.name,
            config: { ...cfg },
            stats: { ...d.stats },
            price: cfg.price,
            unitCost: d.unitCost,
            stock: cfg.productionQty,
            totalProduced: cfg.productionQty,
            baseCapacity: cfg.productionQty,   // referensi untuk auto-restock
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
            autoRestock: {
                enabled: false,
                thresholdPercent: (BALANCE.products.autoRestock && BALANCE.products.autoRestock.defaultThresholdPercent) || 20,
                lastAutoOrderMinute: 0,
                lastWarnMinute: 0
            }
        };

        const activeCount = data.products.catalog.filter(p => p.status === 'selling').length;
        if (activeCount >= BALANCE.products.maxActiveProducts) {
            ToastService.warning('Katalog penuh (maks ' + BALANCE.products.maxActiveProducts + ' produk aktif).');
        }

        const rv = this._generateReview(product, true);
        product.reviews.push(rv);
        this._pushReviewToFeed(product, rv);

        const repDelta = (rv.score - 5) * BALANCE.products.reputationPerReviewPoint;
        if (repDelta !== 0) this.state.addReputation((data.market.reputation || 0) + repDelta);

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
        const data = this.state.data;
        if (!data.products.catalog.length) return;

        let totalDailyRevenue = 0;

        for (const p of data.products.catalog) {
            if (p.status !== 'selling') continue;
            if (p.stock <= 0) continue;

            const demand = this._computeDailyDemand(p);
            const sold = Math.min(demand, p.stock);
            if (sold <= 0) continue;

            const revenue = sold * p.price;
            p.stock -= sold;
            p.totalSold += sold;
            p.totalRevenue += revenue;
            totalDailyRevenue += revenue;

            if (!p.dailySales) p.dailySales = [];
            p.dailySales.push({ day: data.time.elapsedGameMinutes, sold, revenue });
            if (p.dailySales.length > 400) p.dailySales.shift();

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

    _computeDailyDemand(p) {
        const data = this.state.data;
        const era = data.era || 'feature_phone';
        const baseDemand = BALANCE.products.baseMarketDemand[era] || 5000;
        const ff = getComponentById(p.config.formFactorId);
        const baseMult = (ff && ff.baseDemandMultiplier) ? ff.baseDemandMultiplier : 1.0;
        const w = BALANCE.products.weights;
        const refs = BALANCE.products.refs;

        const qualityF = Math.pow(Math.max(0.2, p.stats.qualityScore / refs.quality), w.quality);
        const priceF   = Math.pow(Math.max(0.2, refs.price / Math.max(1, p.price)), w.price);
        const repF     = Math.pow(Math.max(0.2, (data.market.reputation || 10) / refs.reputation), w.reputation);
        const marketingF = this._getMarketingFactor(p.id);
        const osFactor = this._getOsFactor();
        const trendF = this._getTrendFactor(p.stats);
        const competitorF = Math.max(0.4, 1 / (1 + (p.competitorPressure || 0)));
        const lifecycleF = this._getLifecycleFactor(p);

        const noise = 1 + (Math.random() * 2 - 1) * BALANCE.products.dailyNoise;

        const demand = baseDemand * baseMult * qualityF * priceF * repF
                     * marketingF * osFactor * trendF * competitorF
                     * lifecycleF * noise;

        return Math.max(0, Math.round(demand));
    }

    _getMarketingFactor(productId) {
        const data = this.state.data;
        const campaigns = data.marketing.activeCampaigns.filter(c => c.productId === productId);
        if (!campaigns.length) return 1.0;
        let sum = 0;
        campaigns.forEach(c => sum += c.effectiveReach || 0);
        return Math.min(BALANCE.marketing.maxMarketingFactor, 1 + sum);
    }

    _getLifecycleFactor(p) {
        const ageDays = (this.state.data.time.elapsedGameMinutes - p.releaseGameMinute) / MINUTES_PER_DAY;
        const lc = BALANCE.products.lifecycle;
        if (ageDays < lc.riseDays)    return lc.riseMult + (ageDays / lc.riseDays) * (1 - lc.riseMult);
        if (ageDays < lc.peakDays)    return lc.peakMult;
        if (ageDays < lc.declineDays) return lc.peakMult - ((ageDays - lc.peakDays) / (lc.declineDays - lc.peakDays)) * (lc.peakMult - lc.declineMult);
        if (ageDays < lc.deadDays)    return lc.declineMult * (1 - (ageDays - lc.declineDays) / (lc.deadDays - lc.declineDays)) + lc.deadMult * ((ageDays - lc.declineDays) / (lc.deadDays - lc.declineDays));
        return lc.deadMult;
    }

    // ============================================================
    // AUTO-RESTOCK (BARU)
    // ============================================================
    _tickAutoRestock() {
        const data = this.state.data;
        const cfg = BALANCE.products.autoRestock;
        if (!cfg) return;

        const now = data.time.elapsedGameMinutes;
        const cooldownMs = (cfg.defaultCooldownDays || 7) * MINUTES_PER_DAY;
        const warnInterval = (cfg.warnIntervalDays || 3) * MINUTES_PER_DAY;
        const minQty = cfg.minOrderQty || 100;
        const maxMult = cfg.maxStockMultiplier || 2.0;

        for (const p of data.products.catalog) {
            if (p.status !== 'selling') continue;
            const ar = p.autoRestock;
            if (!ar || !ar.enabled) continue;

            const baseCapacity = p.baseCapacity || (p.config && p.config.productionQty) || 5000;
            const thresholdPct = (ar.thresholdPercent || 20) / 100;
            const threshold = baseCapacity * thresholdPct;
            const maxStock = baseCapacity * maxMult;

            // Stok masih cukup?
            if (p.stock > threshold) continue;

            // Sudah mentok max stock?
            if (p.stock >= maxStock) continue;

            // Cooldown?
            if ((now - (ar.lastAutoOrderMinute || 0)) < cooldownMs) continue;

            // Hitung qty
            let neededQty = baseCapacity - p.stock;
            if (neededQty < minQty) neededQty = minQty;
            if (p.stock + neededQty > maxStock) neededQty = maxStock - p.stock;
            if (neededQty <= 0) continue;

            const totalCost = p.unitCost * neededQty + BALANCE.products.productionSetupCost;

            // Uang tidak cukup?
            if (data.cash < totalCost) {
                if ((now - (ar.lastWarnMinute || 0)) >= warnInterval) {
                    ToastService.warning('⚠ Auto-restock "' + p.name + '" gagal: butuh $' + totalCost.toLocaleString('en-US'));
                    this.state.addLog('Auto-restock "' + p.name + '" gagal: uang tidak cukup.', LOG_TYPES.warning);
                    ar.lastWarnMinute = now;
                    bus.emit('state:changed', data);
                }
                continue;
            }

            // Jalankan auto-restock
            this.state.setCash(data.cash - totalCost);
            p.stock += neededQty;
            p.totalProduced += neededQty;
            ar.lastAutoOrderMinute = now;
            ar.lastWarnMinute = 0;

            const msg = 'Auto-restock "' + p.name + '": +' + neededQty.toLocaleString('en-US') + ' unit ($' + totalCost.toLocaleString('en-US') + ')';
            this.state.addLog(msg, LOG_TYPES.success);
            ToastService.success('🔄 ' + msg);

            bus.emit('product:auto-restocked', {
                productId: p.id,
                name: p.name,
                qty: neededQty,
                cost: totalCost
            });
        }
    }

    // API untuk UI
    toggleAutoRestock(productId, enabled) {
        const data = this.state.data;
        const p = data.products.catalog.find(x => x.id === productId);
        if (!p) return { ok: false, reason: 'Produk tidak ditemukan.' };
        if (!p.autoRestock) p.autoRestock = { enabled: false, thresholdPercent: 20, lastAutoOrderMinute: 0, lastWarnMinute: 0 };
        p.autoRestock.enabled = !!enabled;
        const label = enabled ? 'diaktifkan' : 'dimatikan';
        ToastService.info('Auto-restock "' + p.name + '" ' + label + '.');
        bus.emit('state:changed', data);
        return { ok: true };
    }

    setAutoRestockThreshold(productId, percent) {
        const data = this.state.data;
        const p = data.products.catalog.find(x => x.id === productId);
        if (!p) return { ok: false, reason: 'Produk tidak ditemukan.' };
        if (!p.autoRestock) p.autoRestock = { enabled: false, thresholdPercent: 20, lastAutoOrderMinute: 0, lastWarnMinute: 0 };
        const clamped = Math.max(5, Math.min(80, percent));
        p.autoRestock.thresholdPercent = clamped;
        bus.emit('state:changed', data);
        return { ok: true, thresholdPercent: clamped };
    }

    // ============================================================
    // PEMASARAN
    // ============================================================
    startCampaign(productId, campaignId) {
        const data = this.state.data;
        const campaign = getCampaignById(campaignId);
        if (!campaign) return { ok: false, reason: 'Kampanye tidak ditemukan.' };
        const product = data.products.catalog.find(p => p.id === productId);
        if (!product) return { ok: false, reason: 'Produk tidak ditemukan.' };
        if (product.status !== 'selling') return { ok: false, reason: 'Produk sudah tidak dijual.' };
        if (data.cash < campaign.cost) return { ok: false, reason: 'Uang tidak cukup.' };

        this.state.setCash(data.cash - campaign.cost);

        const marketers = data.team.marketers || 0;
        const bonus = 1 + marketers * BALANCE.marketing.perMarketerBonus;
        const effectiveReach = campaign.reachBase * bonus;

        const nowMin = data.time.elapsedGameMinutes;
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
        bus.emit('product:campaign-started', { productId, campaignId });
        bus.emit('state:changed', data);
        return { ok: true };
    }

    _tickMarketing() {
        const data = this.state.data;
        const now = data.time.elapsedGameMinutes;
        const before = data.marketing.activeCampaigns.length;
        data.marketing.activeCampaigns = data.marketing.activeCampaigns.filter(c => c.endsAtMinute > now);
        if (data.marketing.activeCampaigns.length < before) {
            bus.emit('state:changed', data);
        }
    }

    // ============================================================
    // STOK & PRODUKSI
    // ============================================================
    orderProduction(productId, qty) {
        const data = this.state.data;
        const p = data.products.catalog.find(x => x.id === productId);
        if (!p) return { ok: false, reason: 'Produk tidak ditemukan.' };
        if (qty < 100) return { ok: false, reason: 'Minimal 100 unit.' };
        const totalCost = p.unitCost * qty + BALANCE.products.productionSetupCost;
        if (data.cash < totalCost) return { ok: false, reason: 'Uang tidak cukup.' };

        this.state.setCash(data.cash - totalCost);
        p.stock += qty;
        p.totalProduced += qty;

        this.state.addLog('Produksi tambahan: ' + qty + ' unit "' + p.name + '".', LOG_TYPES.info);
        ToastService.success('+' + qty + ' unit ' + p.name);
        bus.emit('state:changed', data);
        return { ok: true, totalCost };
    }

    _chargeWarehouse() {
        const data = this.state.data;
        let total = 0;
        data.products.catalog.forEach(p => {
            if (p.status === 'selling' && p.stock > 0) {
                total += p.stock * BALANCE.products.warehouseCostPerUnitPerDay;
            }
        });
        if (total > 0) this.state.addCash(-Math.round(total));
    }

    discontinueProduct(productId) {
        const data = this.state.data;
        const p = data.products.catalog.find(x => x.id === productId);
        if (!p) return { ok: false, reason: 'Produk tidak ditemukan.' };
        if (p.status !== 'selling') return { ok: false, reason: 'Produk sudah tidak aktif.' };

        const discountPrice = Math.round(p.price * (1 - BALANCE.products.discontinueDiscountPercent));
        const fireSale = p.stock * discountPrice;
        p.status = 'discontinued';
        if (fireSale > 0) this.state.addCash(fireSale);
        p.stock = 0;

        this.state.addLog('"' + p.name + '" dihentikan. Sisa stok dijual $' + fireSale.toLocaleString('en-US') + '.', LOG_TYPES.warning);
        ToastService.info(p.name + ' dihentikan.');
        bus.emit('product:discontinued', { productId, fireSale });
        bus.emit('state:changed', data);
        return { ok: true, fireSale };
    }

    // ============================================================
    // ULASAN
    // ============================================================
    _generateReview(product, isInitial) {
        const era = this.state.data.era || 'feature_phone';
        const sources = REVIEW_SOURCES[era] || REVIEW_SOURCES.feature_phone;
        const source = sources[Math.floor(Math.random() * sources.length)];
        const q = product.stats.qualityScore;
        const thresholds = BALANCE.products.reviewThresholds;
        let base;
        if (q >= thresholds.excellent) base = 9;
        else if (q >= thresholds.good) base = 7.5;
        else if (q >= thresholds.average) base = 6;
        else if (q >= thresholds.poor) base = 4;
        else base = 2.5;
        const variance = (Math.random() * 2 - 1) * 1.2;
        let score = Math.round((base + variance) * 10) / 10;
        score = Math.max(1, Math.min(10, score));

        const statKeys = ['display', 'camera', 'battery', 'performance', 'connectivity', 'design', 'usability'];
        let best = statKeys[0], worst = statKeys[0];
        statKeys.forEach(k => {
            if ((product.stats[k] || 0) > (product.stats[best] || 0)) best = k;
            if ((product.stats[k] || 0) < (product.stats[worst] || 0)) worst = k;
        });

        const strongText = {
            display: 'layar memukau', camera: 'kamera jempolan',
            battery: 'baterai awet', performance: 'performa ngebut',
            connectivity: 'konektivitas lancar', design: 'desain cantik',
            usability: 'mudah dipakai'
        }[best] || 'berkualitas';

        const weakText = {
            display: 'layar kurang tajam', camera: 'kamera mengecewakan',
            battery: 'baterai boros', performance: 'performa lambat',
            connectivity: 'sinyal sering hilang', design: 'desain kaku',
            usability: 'sulit digunakan'
        }[worst] || 'ada kekurangan';

        const templatesPositive = [
            product.name + ' punya ' + strongText + '. Sangat direkomendasikan!',
            'Puas dengan ' + product.name + ', terutama ' + strongText + '.',
            strongText.charAt(0).toUpperCase() + strongText.slice(1) + ' jadi nilai jual utama ' + product.name + '.'
        ];
        const templatesMixed = [
            product.name + ': ' + strongText + ', tapi ' + weakText + '.',
            'Bagus untuk ' + strongText + ', sayang ' + weakText + '.',
            'Cukup oke. ' + strongText + ', hanya saja ' + weakText + '.'
        ];
        const templatesNegative = [
            product.name + ' mengecewakan. ' + weakText.charAt(0).toUpperCase() + weakText.slice(1) + '.',
            'Tidak sesuai harapan. ' + weakText.charAt(0).toUpperCase() + weakText.slice(1) + '.',
            'Banyak keluhan soal ' + product.name + ': ' + weakText + '.'
        ];

        let text;
        if (score >= 7) text = templatesPositive[Math.floor(Math.random() * templatesPositive.length)];
        else if (score >= 5) text = templatesMixed[Math.floor(Math.random() * templatesMixed.length)];
        else text = templatesNegative[Math.floor(Math.random() * templatesNegative.length)];

        const d = this.state.data;
        return {
            id: 'rv_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            source, score, text,
            year: d.time.currentYear,
            month: d.time.currentMonth,
            day: d.time.currentDay,
            gameMinute: d.time.elapsedGameMinutes,
            isInitial: !!isInitial
        };
    }

    _pushReviewToFeed(product, review) {
        const data = this.state.data;
        data.reviews.feed.unshift({ ...review, productId: product.id, productName: product.name });
        if (data.reviews.feed.length > BALANCE.reviews.maxReviewsInFeed) {
            data.reviews.feed.length = BALANCE.reviews.maxReviewsInFeed;
        }
        bus.emit('review:received', { productId: product.id, review });
    }

    _maybeAddRandomReviews() {
        const data = this.state.data;
        const active = data.products.catalog.filter(p => p.status === 'selling');
        if (!active.length) return;
        active.forEach(p => {
            if (Math.random() < BALANCE.reviews.perDayChance) {
                const rv = this._generateReview(p, false);
                p.reviews.push(rv);
                if (p.reviews.length > 10) p.reviews.shift();
                this._pushReviewToFeed(p, rv);
                const repDelta = (rv.score - 5) * BALANCE.products.reputationPerReviewPoint * 0.5;
                if (repDelta !== 0) this.state.addReputation((data.market.reputation || 0) + repDelta);
            }
        });
    }

    // ============================================================
    // CHEAT
    // ============================================================
    quickRelease(configOverride) {
        const cfg = configOverride || this._pickCheatConfig();
        const res = this.confirmDesign(cfg);
        if (!res.ok) return res;
        const d = this.state.data.products.development;
        if (d) this._releaseProduct(d);
        return { ok: true };
    }

    _pickCheatConfig() {
        const data = this.state.data;
        const unlocked = COMPONENTS.filter(c =>
            !c.requiresResearch || data.research.completed.includes(c.requiresResearch)
        );
        const pick = (catId) => {
            const list = unlocked.filter(c => c.category === catId);
            return list.length ? list[list.length - 1].id : null;
        };
        return {
            name: 'CheatPhone ' + Math.floor(Math.random() * 1000),
            formFactorId: pick('form_factor') || 'ff_candybar',
            displayId:    pick('display')     || 'scr_mono',
            cameraId:     pick('camera')      || 'cam_vga',
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
