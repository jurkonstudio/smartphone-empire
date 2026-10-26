// FILE: src/systems/FabSystem.js
// ============================================================
// FabSystem — bangun pabrik chip, upgrade, produksi massal.
//
// Fab Level:
//   1 = Small Fab    ($5jt, 90 hari, 5000 unit/bulan)
//   2 = Medium Fab   ($25jt, 150 hari, 50000 unit/bulan)
//   3 = Large Fab    ($120jt, 240 hari, 500000 unit/bulan)
//   4 = Mega Fab     ($600jt, 360 hari, 5jt unit/bulan)
// ============================================================
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { ToastService } from '../core/ToastService.js';
import { LOG_TYPES } from '../config/constants.js';
import { WalletService } from './WalletService.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;

export const FAB_LEVELS = [
    { level: 1, id: 'small',  name: 'Small Fab',   cost: 5000000,   durationDays: 90,  capacityMonthly: 5000,   description: 'Fab kecil untuk chip awal' },
    { level: 2, id: 'medium', name: 'Medium Fab',  cost: 25000000,  durationDays: 150, capacityMonthly: 50000,  description: 'Fab skala menengah' },
    { level: 3, id: 'large',  name: 'Large Fab',   cost: 120000000, durationDays: 240, capacityMonthly: 500000, description: 'Fab skala besar' },
    { level: 4, id: 'mega',   name: 'Mega Fab',    cost: 600000000, durationDays: 360, capacityMonthly: 5000000, description: 'Fab kelas industri' }
];

export class FabSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        this._unsubs.push(bus.on('time:day-changed', () => this._tickDaily()));
        this._unsubs.push(bus.on('state:hydrated',   () => this._onHydrated()));
        console.info('[FabSystem] siap.');
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    _onHydrated() {
        const data = this.state.data;
        if (!data.fab) {
            data.fab = {
                built: false, level: 0, builtAtMinute: 0,
                upgrade: null, producing: null,
                inventory: 0, history: [], totalProduced: 0, lastYieldRate: 1.0
            };
        }
        if (typeof data.fab.inventory !== 'number') data.fab.inventory = 0;
        if (!Array.isArray(data.fab.history)) data.fab.history = [];
        if (typeof data.fab.totalProduced !== 'number') data.fab.totalProduced = 0;
        // Stok per desain chip (chipId -> unit). Dipakai pabrik SoC.
        if (!data.fab.stockByChip || typeof data.fab.stockByChip !== 'object') data.fab.stockByChip = {};
    }

    getFabLevelInfo(level) {
        return FAB_LEVELS.find(f => f.level === level) || null;
    }

    getNextFabLevel() {
        const cur = this.state.data.fab.level || 0;
        return FAB_LEVELS.find(f => f.level === cur + 1) || null;
    }

    // ============================================================
    // BUILD FAB
    // ============================================================
    buildFab(targetLevel) {
        const data = this.state.data;
        if (data.fab.built) return { ok: false, reason: 'Fab sudah dibangun.' };

        // Cek riset fab_construction
        if (!data.research.completed.includes('fab_construction')) {
            return { ok: false, reason: 'Butuh riset: Konstruksi Fab' };
        }

        const tier = FAB_LEVELS.find(f => f.level === (targetLevel || 1));
        if (!tier) return { ok: false, reason: 'Level fab tidak valid.' };

        if (!WalletService.canAfford(tier.cost)) {
            return { ok: false, reason: 'Uang tidak cukup. Butuh $' + tier.cost.toLocaleString('en-US') + '.' };
        }

        WalletService.pay(tier.cost, 'fab-build');

        // Setup upgrade state (dipakai sebagai build state)
        data.fab.upgrade = {
            targetLevel: tier.level,
            progressDays: 0,
            durationDays: tier.durationDays,
            cost: tier.cost,
            startedAtMinute: data.time.elapsedGameMinutes,
            lastProcessedMinute: data.time.elapsedGameMinutes,
            isBuild: true
        };

        this.state.addLog('Mulai bangun ' + tier.name + ' ($' + tier.cost.toLocaleString('en-US') + ', ' + tier.durationDays + ' hari).', LOG_TYPES.info);
        ToastService.success('Pembangunan ' + tier.name + ' dimulai!');
        bus.emit('fab:build-started', { level: tier.level, name: tier.name });
        bus.emit('state:changed', data);
        return { ok: true, level: tier.level };
    }

    // ============================================================
    // UPGRADE FAB
    // ============================================================
    upgradeFab() {
        const data = this.state.data;
        if (!data.fab.built) return { ok: false, reason: 'Belum ada fab.' };
        if (data.fab.upgrade) return { ok: false, reason: 'Sedang ada upgrade berjalan.' };

        const next = this.getNextFabLevel();
        if (!next) return { ok: false, reason: 'Fab sudah di level maksimal.' };

        if (!WalletService.canAfford(next.cost)) {
            return { ok: false, reason: 'Uang tidak cukup. Butuh $' + next.cost.toLocaleString('en-US') + '.' };
        }

        WalletService.pay(next.cost, 'fab-upgrade');

        data.fab.upgrade = {
            targetLevel: next.level,
            progressDays: 0,
            durationDays: next.durationDays,
            cost: next.cost,
            startedAtMinute: data.time.elapsedGameMinutes,
            lastProcessedMinute: data.time.elapsedGameMinutes,
            isBuild: false
        };

        this.state.addLog('Upgrade fab ke ' + next.name + ' ($' + next.cost.toLocaleString('en-US') + ').', LOG_TYPES.info);
        ToastService.success('Upgrade fab dimulai!');
        bus.emit('fab:upgrade-started', { level: next.level, name: next.name });
        bus.emit('state:changed', data);
        return { ok: true, level: next.level };
    }

    // ============================================================
    // ORDER PRODUCTION
    // ============================================================
    orderProduction(chipId, qty) {
        const data = this.state.data;
        if (!data.fab.built) return { ok: false, reason: 'Belum ada fab.' };
        if (data.fab.producing) return { ok: false, reason: 'Fab sedang produksi.' };

        const chip = data.chips.catalog.find(c => c.id === chipId);
        if (!chip) return { ok: false, reason: 'Chip tidak ditemukan.' };

        if (qty < 100) return { ok: false, reason: 'Minimal 100 unit.' };

        const fabInfo = this.getFabLevelInfo(data.fab.level);
        if (!fabInfo) return { ok: false, reason: 'Fab level tidak valid.' };

        // Cek kapasitas bulanan (dengan durasi produksi 30 hari standar)
        const capacityPerMonth = fabInfo.capacityMonthly;
        const allowedQty = Math.min(qty, capacityPerMonth);
        if (allowedQty < qty) {
            ToastService.warning('Kapasitas fab terbatas: maks ' + allowedQty + ' unit/bulan.');
        }

        // Biaya produksi
        const yieldRate = this._computeCurrentYield(chip);
        const effectiveQty = Math.ceil(allowedQty / yieldRate); // butuh lebih banyak wafer untuk hasilkan X unit
        const unitCost = chip.stats.costPerUnit;
        const totalCost = Math.round(unitCost * effectiveQty);

        if (!WalletService.canAfford(totalCost)) {
            return { ok: false, reason: 'Uang tidak cukup. Butuh $' + totalCost.toLocaleString('en-US') + '.' };
        }

        WalletService.pay(totalCost, 'fab-produce');

        // Setup production
        data.fab.producing = {
            chipId: chip.id,
            chipName: chip.name,
            qty: allowedQty,           // target output
            totalUnits: allowedQty,
            progressUnits: 0,
            startedAtMinute: data.time.elapsedGameMinutes,
            lastProcessedMinute: data.time.elapsedGameMinutes,
            durationDays: 30,          // 1 bulan produksi
            yieldRate,
            costPaid: totalCost
        };

        this.state.addLog('Produksi chip "' + chip.name + '": ' + allowedQty + ' unit ($' + totalCost.toLocaleString('en-US') + ').', LOG_TYPES.info);
        ToastService.success('Produksi chip dimulai!');
        bus.emit('fab:production-started', { chipId: chip.id, qty: allowedQty });
        bus.emit('state:changed', data);
        return { ok: true, qty: allowedQty, cost: totalCost };
    }

    _computeCurrentYield(chip) {
        // Yield = chip.yieldRate × (fab level bonus)
        const fabLevel = this.state.data.fab.level || 1;
        const fabBonus = 1 + (fabLevel - 1) * 0.05;
        return Math.min(0.98, (chip.yieldRate || 0.7) * fabBonus);
    }

    // ============================================================
    // DAILY TICK
    // ============================================================
    _tickDaily() {
        const data = this.state.data;

        // Build / upgrade progress
        if (data.fab.upgrade) this._tickBuildUpgrade();

        // Production progress
        if (data.fab.producing) this._tickProduction();
    }

    _tickBuildUpgrade() {
        const data = this.state.data;
        const u = data.fab.upgrade;
        const currentMinute = data.time.elapsedGameMinutes;
        const last = u.lastProcessedMinute || u.startedAtMinute;
        const deltaMinutes = currentMinute - last;
        if (deltaMinutes <= 0) return;

        u.progressDays += deltaMinutes / MINUTES_PER_DAY;
        u.lastProcessedMinute = currentMinute;

        const percent = Math.min(1, u.progressDays / u.durationDays);
        bus.emit('fab:progress', { percent, isBuild: u.isBuild, targetLevel: u.targetLevel });

        if (u.progressDays >= u.durationDays) {
            if (u.isBuild) {
                data.fab.built = true;
                data.fab.level = u.targetLevel;
                data.fab.builtAtMinute = currentMinute;
                this.state.addMilestone('first_fab', 'Fab pertama dibangun: ' + this.getFabLevelInfo(u.targetLevel).name);
                ToastService.success('🏭 Fab selesai dibangun!');
                this.state.addLog('Fab level ' + u.targetLevel + ' selesai dibangun.', LOG_TYPES.success);
                bus.emit('fab:built', { level: u.targetLevel });
            } else {
                data.fab.level = u.targetLevel;
                ToastService.success('🏭 Fab di-upgrade ke level ' + u.targetLevel + '!');
                this.state.addLog('Fab di-upgrade ke level ' + u.targetLevel + '.', LOG_TYPES.success);
                bus.emit('fab:upgraded', { level: u.targetLevel });
            }
            data.fab.upgrade = null;
            bus.emit('state:changed', data);
        }
    }

    _tickProduction() {
        const data = this.state.data;
        const p = data.fab.producing;
        const currentMinute = data.time.elapsedGameMinutes;
        const last = p.lastProcessedMinute || p.startedAtMinute;
        const deltaMinutes = currentMinute - last;
        if (deltaMinutes <= 0) return;

        const deltaDays = deltaMinutes / MINUTES_PER_DAY;
        const unitsPerDay = p.totalUnits / p.durationDays;
        p.progressUnits = Math.min(p.totalUnits, p.progressUnits + unitsPerDay * deltaDays);
        p.lastProcessedMinute = currentMinute;

        const percent = p.progressUnits / p.totalUnits;
        bus.emit('fab:production-progress', {
            chipId: p.chipId,
            percent,
            progressUnits: Math.floor(p.progressUnits),
            totalUnits: p.totalUnits
        });

        if (p.progressUnits >= p.totalUnits) {
            data.fab.inventory += p.totalUnits;
            data.fab.stockByChip = data.fab.stockByChip || {};
            data.fab.stockByChip[p.chipId] = (data.fab.stockByChip[p.chipId] || 0) + p.totalUnits;
            data.fab.totalProduced += p.totalUnits;
            data.fab.history.unshift({
                chipId: p.chipId,
                chipName: p.chipName,
                qty: p.totalUnits,
                yieldRate: p.yieldRate,
                costPaid: p.costPaid,
                completedAtMinute: currentMinute
            });
            if (data.fab.history.length > 20) data.fab.history.length = 20;

            ToastService.success('🏭 Produksi selesai: ' + p.totalUnits + ' unit "' + p.chipName + '"');
            this.state.addLog('Produksi chip "' + p.chipName + '" selesai: ' + p.totalUnits + ' unit.', LOG_TYPES.success);

            bus.emit('fab:production-completed', { chipId: p.chipId, qty: p.totalUnits });
            data.fab.producing = null;
            bus.emit('state:changed', data);
        }
    }

    // ============================================================
    // API
    // ============================================================
    getFabSummary() {
        const data = this.state.data;
        const fab = data.fab;
        const info = this.getFabLevelInfo(fab.level);
        return {
            built: fab.built,
            level: fab.level,
            levelInfo: info,
            inventory: fab.inventory,
            totalProduced: fab.totalProduced,
            producing: fab.producing,
            upgrade: fab.upgrade,
            history: fab.history.slice(0, 10)
        };
    }

    cancelUpgrade() {
        const data = this.state.data;
        if (!data.fab.upgrade) return { ok: false, reason: 'Tidak ada upgrade aktif.' };
        const refund = Math.floor(data.fab.upgrade.cost * 0.4);
        this.state.addCash(refund);
        data.fab.upgrade = null;
        ToastService.info('Upgrade dibatalkan (refund $' + refund.toLocaleString('en-US') + ').');
        bus.emit('state:changed', data);
        return { ok: true, refund };
    }

    cancelProduction() {
        const data = this.state.data;
        if (!data.fab.producing) return { ok: false, reason: 'Tidak ada produksi aktif.' };
        const refund = Math.floor(data.fab.producing.costPaid * 0.5);
        this.state.addCash(refund);
        data.fab.producing = null;
        ToastService.info('Produksi dibatalkan (refund $' + refund.toLocaleString('en-US') + ').');
        bus.emit('state:changed', data);
        return { ok: true, refund };
    }

    // CHEAT
    quickBuildFab(level) {
        const data = this.state.data;
        data.fab.built = true;
        data.fab.level = Math.min(4, Math.max(1, level || 1));
        data.fab.upgrade = null;
        ToastService.success('(cheat) Fab level ' + data.fab.level + ' dibangun.');
        bus.emit('state:changed', data);
        return { ok: true, level: data.fab.level };
    }
}

export { FAB_LEVELS as FAB_TIER_LIST };
