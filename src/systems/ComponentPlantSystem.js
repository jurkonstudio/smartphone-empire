// FILE: src/systems/ComponentPlantSystem.js  (BARU — Tahap 1)
// ============================================================
// ComponentPlantSystem — bangun & kelola pabrik komponen internal.
//
// Alur:
//   1. Bangun pabrik (level 1) -> tunggu durationDays.
//   2. Upgrade level (2..4)     -> tunggu durationDays.
//   3. Pesan produksi komponen  -> bayar unit x harga internal,
//      hasil = qty x yield, masuk ke inventory setelah durasi selesai.
//
// Kapasitas per bulan membatasi satu order. Satu pabrik hanya menjalankan
// satu order produksi sekaligus (sama seperti Fab).
//
// Tahap 1 berhenti di: pabrik membuat stok, dan harga internal sudah
// dipakai Desain ponsel. Pemakaian stok saat produk diluncurkan
// (konsumsi inventory) menjadi Tahap 2.
// ============================================================
import { bus } from '../core/EventBus.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { ToastService } from '../core/ToastService.js';
import { LOG_TYPES } from '../config/constants.js';
import { WalletService } from './WalletService.js';
import { COMPONENTS, getComponentById } from '../data/components.data.js';
import {
    PLANT_TYPES, PLANT_MIN_ORDER, PLANT_CYCLE_DAYS,
    getPlantTypeById, getPlantLevelInfo, getPlantYield, resolveComponentCost
} from '../data/material-plants.data.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;
const REFUND_UPGRADE = 0.4;
const REFUND_PRODUCTION = 0.5;
const HISTORY_LIMIT = 20;

function _money(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }

function _emptyPlant() {
    return { built: false, level: 0, upgrade: null, producing: null };
}

export class ComponentPlantSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        this._unsubs.push(bus.on('time:day-changed', () => this._tickDaily()));
        this._unsubs.push(bus.on('state:hydrated',   () => this._onHydrated()));
        console.info('[ComponentPlantSystem] siap.');
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    _onHydrated() {
        const data = this.state.data;
        if (!data.componentPlants || typeof data.componentPlants !== 'object') {
            data.componentPlants = {};
        }
        const cp = data.componentPlants;
        if (!cp.plants || typeof cp.plants !== 'object') cp.plants = {};
        if (!cp.inventory || typeof cp.inventory !== 'object') cp.inventory = {};
        if (!Array.isArray(cp.history)) cp.history = [];
        if (typeof cp.totalProduced !== 'number') cp.totalProduced = 0;

        PLANT_TYPES.forEach(pt => {
            const ps = cp.plants[pt.id];
            if (!ps || typeof ps !== 'object') {
                cp.plants[pt.id] = _emptyPlant();
                return;
            }
            if (typeof ps.level !== 'number') ps.level = 0;
            if (typeof ps.built !== 'boolean') ps.built = ps.level > 0;
            if (ps.upgrade === undefined) ps.upgrade = null;
            if (ps.producing === undefined) ps.producing = null;
        });
    }

    // ============================================================
    // SYARAT
    // ============================================================
    _getPlantState(typeId) {
        const cp = this.state.data.componentPlants;
        return cp && cp.plants ? cp.plants[typeId] : null;
    }

    isUnlocked(typeId) {
        const pt = getPlantTypeById(typeId);
        if (!pt) return { ok: false, reason: 'Tipe pabrik tidak dikenal.', reasonKey: 'pl.unlock.unknown' };
        const data = this.state.data;
        if ((data.time.currentYear || 0) < pt.unlockYear) {
            return { ok: false, reason: 'Pabrik ini tersedia mulai ' + pt.unlockYear + '.', reasonKey: 'pl.unlock.year', reasonVars: { y: pt.unlockYear } };
        }
        if (pt.requiresFab && !(data.fab && data.fab.built)) {
            return { ok: false, reason: 'Butuh fab chip yang sudah berdiri.', reasonKey: 'pl.unlock.fab' };
        }
        return { ok: true };
    }

    // Komponen yang boleh diproduksi pabrik ini pada tahun berjalan dan riset yang ada.
    getEligibleComponents(typeId) {
        const pt = getPlantTypeById(typeId);
        if (!pt) return [];
        const data = this.state.data;
        const year = data.time.currentYear || 0;
        const completed = (data.research && data.research.completed) || [];
        return COMPONENTS
            .filter(c => c.category === pt.category)
            .filter(c => (c.minYear || 0) <= year)
            .filter(c => !c.requiresResearch || completed.indexOf(c.requiresResearch) !== -1)
            .sort((a, b) => (a.tier - b.tier) || (a.minYear - b.minYear));
    }

    // Harga per unit yang dibayar ke pabrik sendiri (sudah memakai diskon level).
    getUnitCost(componentId) {
        const comp = getComponentById(componentId);
        if (!comp) return 0;
        return resolveComponentCost(this.state.data, comp);
    }

    getInventory(componentId) {
        const cp = this.state.data.componentPlants;
        return (cp && cp.inventory && cp.inventory[componentId]) || 0;
    }

    // ============================================================
    // BANGUN & UPGRADE
    // ============================================================
    buildPlant(typeId) {
        const data = this.state.data;
        const ps = this._getPlantState(typeId);
        if (!ps) return { ok: false, reason: 'Pabrik tidak ditemukan.' };
        if (ps.built) return { ok: false, reason: 'Pabrik sudah dibangun.' };
        if (ps.upgrade) return { ok: false, reason: 'Pabrik sedang dibangun.' };

        const unlock = this.isUnlocked(typeId);
        if (!unlock.ok) return unlock;

        const info = getPlantLevelInfo(typeId, 1);
        if (!WalletService.canAfford(info.cost)) {
            return { ok: false, reason: 'Uang tidak cukup. Butuh ' + _money(info.cost) + '.' };
        }

        WalletService.pay(info.cost, 'plant-build');
        ps.upgrade = {
            targetLevel: 1,
            isBuild: true,
            progressDays: 0,
            durationDays: info.durationDays,
            cost: info.cost,
            startedAtMinute: data.time.elapsedGameMinutes,
            lastProcessedMinute: data.time.elapsedGameMinutes
        };

        const pt = getPlantTypeById(typeId);
        this.state.addLog('Mulai bangun ' + pt.name + ' (' + info.name + ', ' + _money(info.cost) + ', ' + info.durationDays + ' hari).', LOG_TYPES.info);
        ToastService.success('Pembangunan ' + pt.name + ' dimulai!');
        bus.emit('plant:build-started', { typeId: typeId, level: 1 });
        bus.emit('state:changed', data);
        return { ok: true, level: 1 };
    }

    upgradePlant(typeId) {
        const data = this.state.data;
        const ps = this._getPlantState(typeId);
        if (!ps || !ps.built) return { ok: false, reason: 'Pabrik belum dibangun.' };
        if (ps.upgrade) return { ok: false, reason: 'Sedang ada pembangunan berjalan.' };

        const next = getPlantLevelInfo(typeId, ps.level + 1);
        if (!next) return { ok: false, reason: 'Pabrik sudah di level maksimal.' };
        if (!WalletService.canAfford(next.cost)) {
            return { ok: false, reason: 'Uang tidak cukup. Butuh ' + _money(next.cost) + '.' };
        }

        WalletService.pay(next.cost, 'plant-upgrade');
        ps.upgrade = {
            targetLevel: next.level,
            isBuild: false,
            progressDays: 0,
            durationDays: next.durationDays,
            cost: next.cost,
            startedAtMinute: data.time.elapsedGameMinutes,
            lastProcessedMinute: data.time.elapsedGameMinutes
        };

        const pt = getPlantTypeById(typeId);
        this.state.addLog('Upgrade ' + pt.name + ' ke ' + next.name + ' (' + _money(next.cost) + ').', LOG_TYPES.info);
        ToastService.success('Upgrade pabrik dimulai!');
        bus.emit('plant:upgrade-started', { typeId: typeId, level: next.level });
        bus.emit('state:changed', data);
        return { ok: true, level: next.level };
    }

    cancelUpgrade(typeId) {
        const data = this.state.data;
        const ps = this._getPlantState(typeId);
        if (!ps || !ps.upgrade) return { ok: false, reason: 'Tidak ada pembangunan aktif.' };
        const refund = Math.floor(ps.upgrade.cost * REFUND_UPGRADE);
        this.state.addCash(refund);
        ps.upgrade = null;
        ToastService.info('Pembangunan dibatalkan (refund ' + _money(refund) + ').');
        bus.emit('state:changed', data);
        return { ok: true, refund: refund };
    }

    // ============================================================
    // PRODUKSI KOMPONEN
    // ============================================================
    orderProduction(typeId, componentId, qty) {
        const data = this.state.data;
        const pt = getPlantTypeById(typeId);
        const ps = this._getPlantState(typeId);
        if (!pt || !ps) return { ok: false, reason: 'Pabrik tidak ditemukan.' };
        if (!ps.built || !ps.level) return { ok: false, reason: 'Pabrik belum dibangun.' };
        if (ps.upgrade) return { ok: false, reason: 'Pabrik sedang dibangun ulang / upgrade.' };
        if (ps.producing) return { ok: false, reason: 'Pabrik sedang berproduksi.' };

        const comp = getComponentById(componentId);
        if (!comp || comp.category !== pt.category) {
            return { ok: false, reason: 'Komponen ini tidak bisa diproduksi pabrik tersebut.' };
        }
        const eligible = this.getEligibleComponents(typeId).some(c => c.id === componentId);
        if (!eligible) return { ok: false, reason: 'Riset komponen ini belum selesai.' };

        qty = Math.floor(qty || 0);
        if (qty < PLANT_MIN_ORDER) {
            return { ok: false, reason: 'Minimal ' + PLANT_MIN_ORDER.toLocaleString('en-US') + ' unit.' };
        }

        const info = getPlantLevelInfo(typeId, ps.level);
        const allowedQty = Math.min(qty, info.capacityMonthly);
        if (allowedQty < qty) {
            ToastService.warning('Kapasitas pabrik terbatas: maks ' + allowedQty.toLocaleString('en-US') + ' unit/bulan.');
        }

        const unitCost = this.getUnitCost(componentId);
        const totalCost = Math.round(unitCost * allowedQty);
        if (!WalletService.canAfford(totalCost)) {
            return { ok: false, reason: 'Uang tidak cukup. Butuh ' + _money(totalCost) + '.' };
        }

        WalletService.pay(totalCost, 'plant-produce');

        const yieldRate = getPlantYield(ps.level);
        const totalUnits = Math.floor(allowedQty * yieldRate);
        const durationDays = Math.max(2, Math.round(PLANT_CYCLE_DAYS * allowedQty / info.capacityMonthly));

        ps.producing = {
            componentId: comp.id,
            componentName: comp.name,
            qty: allowedQty,
            totalUnits: totalUnits,
            progressUnits: 0,
            startedAtMinute: data.time.elapsedGameMinutes,
            lastProcessedMinute: data.time.elapsedGameMinutes,
            durationDays: durationDays,
            yieldRate: yieldRate,
            unitCost: unitCost,
            costPaid: totalCost
        };

        this.state.addLog('Produksi ' + pt.name + ': ' + comp.name + ' ' + allowedQty.toLocaleString('en-US') + ' unit (' + _money(totalCost) + ').', LOG_TYPES.info);
        ToastService.success('Produksi komponen dimulai!');
        bus.emit('plant:production-started', { typeId: typeId, componentId: comp.id, qty: allowedQty });
        bus.emit('state:changed', data);
        return { ok: true, qty: allowedQty, cost: totalCost, totalUnits: totalUnits };
    }

    cancelProduction(typeId) {
        const data = this.state.data;
        const ps = this._getPlantState(typeId);
        if (!ps || !ps.producing) return { ok: false, reason: 'Tidak ada produksi aktif.' };
        const refund = Math.floor(ps.producing.costPaid * REFUND_PRODUCTION);
        this.state.addCash(refund);
        ps.producing = null;
        ToastService.info('Produksi dibatalkan (refund ' + _money(refund) + ').');
        bus.emit('state:changed', data);
        return { ok: true, refund: refund };
    }

    // ============================================================
    // TICK HARIAN
    // ============================================================
    _tickDaily() {
        const cp = this.state.data.componentPlants;
        if (!cp || !cp.plants) return;
        PLANT_TYPES.forEach(pt => {
            const ps = cp.plants[pt.id];
            if (!ps) return;
            if (ps.upgrade) this._tickBuildUpgrade(pt.id);
            if (ps.producing) this._tickProduction(pt.id);
        });
    }

    _tickBuildUpgrade(typeId) {
        const data = this.state.data;
        const ps = this._getPlantState(typeId);
        const u = ps.upgrade;
        const currentMinute = data.time.elapsedGameMinutes;
        const last = u.lastProcessedMinute || u.startedAtMinute;
        const deltaMinutes = currentMinute - last;
        if (deltaMinutes <= 0) return;

        u.progressDays += deltaMinutes / MINUTES_PER_DAY;
        u.lastProcessedMinute = currentMinute;

        const percent = Math.min(1, u.progressDays / u.durationDays);
        bus.emit('plant:progress', { typeId: typeId, percent: percent, isBuild: u.isBuild, targetLevel: u.targetLevel });

        if (u.progressDays >= u.durationDays) {
            const pt = getPlantTypeById(typeId);
            const info = getPlantLevelInfo(typeId, u.targetLevel);
            ps.built = true;
            ps.level = u.targetLevel;
            if (u.isBuild) {
                this.state.addMilestone('first_plant_' + typeId, 'Pabrik pertama dibangun: ' + pt.name);
                ToastService.success('🏭 ' + pt.name + ' selesai dibangun!');
                this.state.addLog(pt.name + ' selesai dibangun (' + info.name + ').', LOG_TYPES.success);
                bus.emit('plant:built', { typeId: typeId, level: u.targetLevel });
            } else {
                ToastService.success('🏭 ' + pt.name + ' di-upgrade ke ' + info.name + '!');
                this.state.addLog(pt.name + ' di-upgrade ke ' + info.name + '.', LOG_TYPES.success);
                bus.emit('plant:upgraded', { typeId: typeId, level: u.targetLevel });
            }
            ps.upgrade = null;
            bus.emit('state:changed', data);
        }
    }

    _tickProduction(typeId) {
        const data = this.state.data;
        const cp = data.componentPlants;
        const p = this._getPlantState(typeId).producing;
        const currentMinute = data.time.elapsedGameMinutes;
        const last = p.lastProcessedMinute || p.startedAtMinute;
        const deltaMinutes = currentMinute - last;
        if (deltaMinutes <= 0) return;

        const deltaDays = deltaMinutes / MINUTES_PER_DAY;
        const unitsPerDay = p.totalUnits / p.durationDays;
        p.progressUnits = Math.min(p.totalUnits, p.progressUnits + unitsPerDay * deltaDays);
        p.lastProcessedMinute = currentMinute;

        bus.emit('plant:production-progress', {
            typeId: typeId,
            componentId: p.componentId,
            percent: p.totalUnits ? p.progressUnits / p.totalUnits : 1
        });

        if (p.progressUnits >= p.totalUnits) {
            cp.inventory[p.componentId] = (cp.inventory[p.componentId] || 0) + p.totalUnits;
            cp.totalProduced += p.totalUnits;
            cp.history.unshift({
                typeId: typeId,
                componentId: p.componentId,
                componentName: p.componentName,
                qty: p.totalUnits,
                yieldRate: p.yieldRate,
                costPaid: p.costPaid,
                completedAtMinute: currentMinute
            });
            if (cp.history.length > HISTORY_LIMIT) cp.history.length = HISTORY_LIMIT;

            ToastService.success('🏭 Produksi selesai: ' + p.totalUnits.toLocaleString('en-US') + ' unit ' + p.componentName);
            this.state.addLog('Produksi ' + p.componentName + ' selesai: ' + p.totalUnits.toLocaleString('en-US') + ' unit.', LOG_TYPES.success);
            bus.emit('plant:production-completed', { typeId: typeId, componentId: p.componentId, qty: p.totalUnits });
            this._getPlantState(typeId).producing = null;
            bus.emit('state:changed', data);
        }
    }

    // ============================================================
    // RINGKASAN UNTUK UI
    // ============================================================
    getSummary() {
        const cp = this.state.data.componentPlants || {};
        return PLANT_TYPES.map(pt => {
            const ps = (cp.plants && cp.plants[pt.id]) || _emptyPlant();
            return {
                type: pt,
                built: ps.built,
                level: ps.level,
                levelInfo: ps.level ? getPlantLevelInfo(pt.id, ps.level) : null,
                nextInfo: getPlantLevelInfo(pt.id, (ps.level || 0) + 1),
                upgrade: ps.upgrade,
                producing: ps.producing,
                unlock: this.isUnlocked(pt.id)
            };
        });
    }
}
