// FILE: src/systems/ChipSystem.js
// ============================================================
// ChipSystem — desain chip, lifecycle aging, stat computation.
//
// Rumus utama:
//   Performance = cores^0.85 × clockGHz^1.2 × arch.perf × node.perf
//   Efficiency  = node.eff × arch.eff ÷ clockGHz^0.6 × cacheBonus
//   Cost/unit   = node.costBase × (cores^0.7) × arch.cost × fabMultiplier
//   Yield Rate  = node.yieldBase × (budget/optimalBudget)^0.3
// ============================================================
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { BALANCE } from '../data/balance.data.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { ToastService } from '../core/ToastService.js';
import { LOG_TYPES } from '../config/constants.js';
import {
    CHIP_ARCHITECTURES, getArchitectureById, getAvailableArchitectures
} from '../data/chip-architecture.data.js';
import {
    CHIP_NODES, getChipNodeById, getAvailableChipNodes
} from '../data/chip-node.data.js';
import {
    CHIP_FEATURES, getChipFeatureById, getAvailableChipFeatures
} from '../data/chip-features.data.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;

// ============================================================
// BUDGET TIERS — biaya desain chip berdasarkan total complexity
// ============================================================
const BUDGET_TIERS = [
    { id: 'low',    label: 'Budget Rendah',   multiplier: 0.6, yieldMod: -0.15, description: 'Hemat tapi yield rendah' },
    { id: 'normal', label: 'Budget Normal',   multiplier: 1.0, yieldMod: 0,     description: 'Seimbang' },
    { id: 'high',   label: 'Budget Tinggi',   multiplier: 1.8, yieldMod: 0.1,   description: 'Yield tinggi' },
    { id: 'ultra',  label: 'Budget Ultra',    multiplier: 3.0, yieldMod: 0.2,   description: 'Yield maksimal, mahal' }
];

export class ChipSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        this._unsubs.push(bus.on('time:day-changed', () => this._tickDaily()));
        this._unsubs.push(bus.on('state:hydrated',   () => this._onHydrated()));
        console.info('[ChipSystem] siap.');
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    _onHydrated() {
        const data = this.state.data;
        if (!data.chips) data.chips = { catalog: [], designing: null, nextChipId: 1 };
        if (!Array.isArray(data.chips.catalog)) data.chips.catalog = [];
        if (typeof data.chips.nextChipId !== 'number') data.chips.nextChipId = 1;
    }

    // ============================================================
    // STAT COMPUTATION
    // ============================================================
    computeChipStats(config) {
        const arch = getArchitectureById(config.architectureId);
        const node = getChipNodeById(config.nodeId);
        if (!arch || !node) return null;

        const cores = Math.max(1, config.cores || 1);
        const clock = Math.max(0.2, config.clockGHz || 1.0);
        const cacheMB = Math.max(0.06, (config.cacheKB || 64) / 1024);
        const featureIds = Array.isArray(config.features) ? config.features : [];

        // PERFORMANCE
        let perf = Math.pow(cores, 0.85) * Math.pow(clock, 1.2) * arch.perfMultiplier * node.perfBonus;
        // Cache bonus (logaritmik)
        perf *= 1 + Math.log10(1 + cacheMB) * 0.15;

        // EFFICIENCY
        let eff = node.effBonus * arch.effMultiplier / Math.pow(clock, 0.6);
        eff *= 1 + Math.log10(1 + cacheMB) * 0.08;

        // Features bonus
        let featureBonus = { camera: 0, display: 0, performance: 0, battery: 0, connectivity: 0, quality: 0 };
        featureIds.forEach(fid => {
            const f = getChipFeatureById(fid);
            if (f && f.statBonus) {
                Object.keys(f.statBonus).forEach(k => {
                    featureBonus[k] = (featureBonus[k] || 0) + f.statBonus[k];
                });
            }
        });

        // Scale ke 0-100 (chip tier 1 tahun 2003 = ~25-35; chip modern = 90+)
        const perfScore = Math.min(100, Math.round(perf * 22 + featureBonus.performance));
        const effScore = Math.min(100, Math.round(eff * 28 + featureBonus.battery));

        // COST per unit ($) — base
        let cost = node.costBase * Math.pow(cores, 0.7) * arch.costMultiplier;
        cost += featureIds.reduce((sum, fid) => {
            const f = getChipFeatureById(fid);
            return sum + (f ? f.costPerUnit : 0);
        }, 0);

        // Bonus tambahan dari feature
        return {
            performance: perfScore,
            efficiency: effScore,
            costPerUnit: Math.round(cost),
            featureBonus,
            cores, clock, cacheMB,
            archName: arch.name,
            nodeName: node.name
        };
    }

    // ============================================================
    // DESIGN COST — biaya R&D awal (one-time)
    // ============================================================
    computeDesignCost(config) {
        const arch = getArchitectureById(config.architectureId);
        const node = getChipNodeById(config.nodeId);
        if (!arch || !node) return 0;

        const cores = Math.max(1, config.cores || 1);
        const featureCount = Array.isArray(config.features) ? config.features.length : 0;

        // Basis: $50k × tier arsitektur × node tier
        let base = 50000 * arch.tier * node.tier;
        // Core multiplier
        base *= 1 + (cores - 1) * 0.15;
        // Feature multiplier
        base *= 1 + featureCount * 0.1;

        // Budget tier multiplier
        const budget = BUDGET_TIERS.find(b => b.id === (config.budgetId || 'normal'));
        if (budget) base *= budget.multiplier;

        return Math.round(base);
    }

    computeDesignDuration(config) {
        const arch = getArchitectureById(config.architectureId);
        const node = getChipNodeById(config.nodeId);
        if (!arch || !node) return 90;

        const cores = Math.max(1, config.cores || 1);
        const featureCount = Array.isArray(config.features) ? config.features.length : 0;

        let days = 60 + arch.tier * 20 + node.tier * 15;
        days += (cores - 1) * 5;
        days += featureCount * 8;

        // Engineer speedup
        const engineers = (this.state.data.staff || []).filter(s => s.role === 'engineer').length;
        const speedup = 1 + Math.min(1.0, engineers * 0.08);

        return Math.max(30, Math.round(days / speedup));
    }

    // ============================================================
    // YIELD RATE — % hasil produksi yang layak jual
    // ============================================================
    computeYieldRate(config) {
        const node = getChipNodeById(config.nodeId);
        if (!node) return 0.5;

        const budget = BUDGET_TIERS.find(b => b.id === (config.budgetId || 'normal'));
        const budgetMod = budget ? budget.yieldMod : 0;

        // Complexity factor — makin banyak core + fitur, yield turun
        const cores = Math.max(1, config.cores || 1);
        const featureCount = Array.isArray(config.features) ? config.features.length : 0;
        const complexityPenalty = (cores - 1) * 0.015 + featureCount * 0.01;

        // Fab level bonus — kalau punya fab sendiri, yield naik
        const fab = this.state.data.fab;
        const fabBonus = fab && fab.built ? (fab.level - 1) * 0.03 : 0;

        let yieldRate = node.yieldBase + budgetMod - complexityPenalty + fabBonus;
        return Math.max(0.3, Math.min(0.98, yieldRate));
    }

    // ============================================================
    // API PUBLIK
    // ============================================================
    getAvailableArchitectures() {
        const year = this.state.data.time.currentYear;
        const completed = this.state.data.research.completed || [];
        return getAvailableArchitectures(year, completed);
    }

    getAvailableNodes() {
        const year = this.state.data.time.currentYear;
        const completed = this.state.data.research.completed || [];
        return getAvailableChipNodes(year, completed);
    }

    getAvailableFeatures() {
        const year = this.state.data.time.currentYear;
        const completed = this.state.data.research.completed || [];
        return getAvailableChipFeatures(year, completed);
    }

    getBudgetTiers() {
        return BUDGET_TIERS.slice();
    }

    getChipById(id) {
        return this.state.data.chips.catalog.find(c => c.id === id) || null;
    }

    // ============================================================
    // LIFECYCLE — aging multiplier
    // ============================================================
    getChipAgeMonths(chip) {
        const currentMinute = this.state.data.time.elapsedGameMinutes;
        const releasedMinute = chip.releasedAtMinute || 0;
        const deltaMinutes = currentMinute - releasedMinute;
        return Math.floor(deltaMinutes / (30 * MINUTES_PER_DAY));
    }

    getChipLifecycle(chip) {
        const ageMonths = this.getChipAgeMonths(chip);
        if (ageMonths < 12) return { phase: 'cutting_edge', multiplier: 1.30, label: 'Cutting Edge', color: 'var(--success)' };
        if (ageMonths < 24) return { phase: 'modern',       multiplier: 1.00, label: 'Modern',        color: 'var(--info)' };
        if (ageMonths < 36) return { phase: 'aging',        multiplier: 0.80, label: 'Aging',         color: 'var(--warn)' };
        return                     { phase: 'outdated',     multiplier: 0.55, label: 'Outdated',      color: 'var(--danger)' };
    }

    // ============================================================
    // START DESIGN
    // ============================================================
    startDesign(config) {
        const data = this.state.data;
        if (data.chips.designing) return { ok: false, reason: 'Ada chip yang sedang didesain.' };

        const name = (config.name || '').trim();
        if (!name) return { ok: false, reason: 'Nama chip kosong.' };
        if (name.length > 24) return { ok: false, reason: 'Nama maksimal 24 karakter.' };

        const arch = getArchitectureById(config.architectureId);
        if (!arch) return { ok: false, reason: 'Arsitektur tidak valid.' };
        const node = getChipNodeById(config.nodeId);
        if (!node) return { ok: false, reason: 'Proses node tidak valid.' };

        // Core count check
        const cores = config.cores || 1;
        if (cores < 1 || cores > arch.coresMax) {
            return { ok: false, reason: 'Jumlah core harus 1-' + arch.coresMax + '.' };
        }

        // Clock check (200 MHz - 5 GHz)
        const clock = config.clockGHz || 1.0;
        if (clock < 0.2 || clock > 5.0) {
            return { ok: false, reason: 'Clock speed harus 0.2 - 5.0 GHz.' };
        }

        // Cache check
        const cacheKB = config.cacheKB || 64;
        if (cacheKB < 64 || cacheKB > 16384) {
            return { ok: false, reason: 'Cache harus 64 KB - 16 MB.' };
        }

        // Features check — semua harus tersedia
        const features = Array.isArray(config.features) ? config.features : [];
        const availableFeatures = this.getAvailableFeatures().map(f => f.id);
        for (const fid of features) {
            if (!availableFeatures.includes(fid)) {
                return { ok: false, reason: 'Fitur tidak tersedia: ' + fid };
            }
        }

        // Cost check
        const designCost = this.computeDesignCost(config);
        if (data.cash < designCost) {
            return { ok: false, reason: 'Uang tidak cukup. Butuh $' + designCost.toLocaleString('en-US') + '.' };
        }

        // Charge
        this.state.setCash(data.cash - designCost);

        // Compute stats once
        const stats = this.computeChipStats(config);
        const durationDays = this.computeDesignDuration(config);
        const yieldRate = this.computeYieldRate(config);

        // Register project
        const project = {
            id: 'chip_' + Date.now() + '_' + data.chips.nextChipId,
            name,
            config: { ...config, features: features.slice() },
            stats,
            yieldRate,
            designCost,
            durationDays,
            progressDays: 0,
            startedAtMinute: data.time.elapsedGameMinutes,
            lastProcessedMinute: data.time.elapsedGameMinutes,
            startedAt: {
                year: data.time.currentYear,
                month: data.time.currentMonth,
                day: data.time.currentDay
            }
        };
        data.chips.nextChipId += 1;
        data.chips.designing = project;

        this.state.addLog('Mulai desain chip "' + name + '" ($' + designCost.toLocaleString('en-US') + ', ' + durationDays + ' hari).', LOG_TYPES.info);
        ToastService.success('Desain chip "' + name + '" dimulai!');
        bus.emit('chip:design-started', { chipId: project.id, name: project.name });
        bus.emit('tutorial:action', { id: 'action:chip-design-started' });
        bus.emit('state:changed', data);

        return { ok: true, chipId: project.id, designCost, durationDays, stats, yieldRate };
    }

    cancelDesign() {
        const data = this.state.data;
        const d = data.chips.designing;
        if (!d) return { ok: false, reason: 'Tidak ada desain chip aktif.' };
        const refund = Math.floor(d.designCost * 0.4);
        this.state.addCash(refund);
        data.chips.designing = null;
        this.state.addLog('Desain chip dibatalkan (refund $' + refund.toLocaleString('en-US') + ').', LOG_TYPES.warning);
        bus.emit('chip:design-cancelled', { chipId: d.id, refund });
        bus.emit('state:changed', data);
        return { ok: true, refund };
    }

    // ============================================================
    // DAILY TICK
    // ============================================================
    _tickDaily() {
        const data = this.state.data;
        if (data.chips.designing) this._tickDesignProgress();
    }

    _tickDesignProgress() {
        const data = this.state.data;
        const d = data.chips.designing;
        const currentMinute = data.time.elapsedGameMinutes;
        const last = d.lastProcessedMinute || d.startedAtMinute;
        const deltaMinutes = currentMinute - last;
        if (deltaMinutes <= 0) return;

        // Engineer speedup
        const engineers = (data.staff || []).filter(s => s.role === 'engineer').length;
        const speedup = 1 + Math.min(1.0, engineers * 0.08);

        d.progressDays += (deltaMinutes / MINUTES_PER_DAY) * speedup;
        d.lastProcessedMinute = currentMinute;

        const percent = Math.min(1, d.progressDays / d.durationDays);
        bus.emit('chip:design-progress', {
            chipId: d.id,
            name: d.name,
            percent,
            progressDays: d.progressDays,
            durationDays: d.durationDays,
            remainingDays: Math.max(0, Math.ceil((d.durationDays - d.progressDays) / speedup))
        });

        if (d.progressDays >= d.durationDays) {
            this._releaseChip(d);
        }
    }

    _releaseChip(d) {
        const data = this.state.data;

        const chip = {
            id: d.id,
            name: d.name,
            config: { ...d.config },
            stats: { ...d.stats },
            yieldRate: d.yieldRate,
            designCost: d.designCost,
            releasedAtMinute: data.time.elapsedGameMinutes,
            releaseDate: {
                year: data.time.currentYear,
                month: data.time.currentMonth,
                day: data.time.currentDay
            },
            competitorPressure: 0.2
        };

        data.chips.catalog.push(chip);
        data.chips.designing = null;

        // Milestone chip pertama
        if (data.chips.catalog.length === 1) {
            this.state.addMilestone('first_chip', 'Chip pertama dirilis: ' + chip.name);
        }

        this.state.addLog('Chip "' + chip.name + '" selesai didesain! Performance ' + chip.stats.performance + ', Efficiency ' + chip.stats.efficiency + '.', LOG_TYPES.success);
        ToastService.success('Chip "' + chip.name + '" siap!');
        if (data.settings.vibrate) { try { if (navigator.vibrate) navigator.vibrate([30, 40, 30]); } catch (e) {} }

        bus.emit('chip:released', { chipId: chip.id, name: chip.name, stats: chip.stats });
        bus.emit('state:changed', data);
    }

    // ============================================================
    // CHEAT
    // ============================================================
    quickDesignChip(configOverride) {
        const cfg = configOverride || this._pickCheatChipConfig();
        const res = this.startDesign(cfg);
        if (!res.ok) return res;
        const d = this.state.data.chips.designing;
        if (d) {
            d.progressDays = d.durationDays;
            this._releaseChip(d);
        }
        return { ok: true };
    }

    _pickCheatChipConfig() {
        const archs = this.getAvailableArchitectures();
        const nodes = this.getAvailableNodes();
        const feats = this.getAvailableFeatures();
        const arch = archs[archs.length - 1] || CHIP_ARCHITECTURES[0];
        const node = nodes[nodes.length - 1] || CHIP_NODES[0];
        return {
            name: 'CheatChip ' + Math.floor(Math.random() * 1000),
            architectureId: arch.id,
            nodeId: node.id,
            cores: Math.min(arch.coresMax, 4),
            clockGHz: 2.0,
            cacheKB: 1024,
            features: feats.slice(0, 2).map(f => f.id),
            budgetId: 'normal'
        };
    }
                                         }
