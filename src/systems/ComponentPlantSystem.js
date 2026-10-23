// FILE: src/systems/ComponentPlantSystem.js  (Tahap 1 + Tahap 1b + Tahap 2)
// ============================================================
// ComponentPlantSystem — bangun & kelola pabrik komponen internal.
//
// Alur:
//   1. Bangun pabrik (level 1) -> tunggu durationDays.
//   2. Upgrade level (2..4)     -> tunggu durationDays.
//   3. Pesan produksi komponen  -> bayar unit x harga internal,
//      hasil = qty x yield, masuk ke inventory setelah durasi selesai.
//   4. Perawatan harian         -> pabrik yang sudah berdiri memotong biaya
//      perawatan bulanan (dibagi per hari). Jika uang kurang, tagihan
//      menumpuk sebagai hutang dan ditagih saat uang cukup.
//   5. Pemakaian stok (Tahap 2) -> consumeForProduct() dipanggil saat produk
//      diluncurkan. Stok pabrik dipakai dulu; sisanya dibeli dengan harga pasar.
//
// Kapasitas per bulan membatasi satu order. Satu pabrik hanya menjalankan
// satu order produksi sekaligus (sama seperti Fab).
//
// Pabrik yang menganggur (tidak berproduksi) terus dihitung. Setelah
// PLANT_IDLE_WARN_DAYS hari, pemain diberi peringatan.
// ============================================================
import { bus } from '../core/EventBus.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { ToastService } from '../core/ToastService.js';
import { LOG_TYPES } from '../config/constants.js';
import { WalletService } from './WalletService.js';
import { FAB_LEVELS } from './FabSystem.js';
import { COMPONENTS, getComponentById } from '../data/components.data.js';
import {
    PLANT_TYPES, PLANT_MIN_ORDER, PLANT_CYCLE_DAYS,
    getPlantTypeById, getPlantLevelInfo, getPlantYield, resolveComponentCost,
    getPlantMaintenance, getPlantCapital,
    INFRA_TAX_RATE_MONTHLY, EXTERNAL_PRICE_RATE, EXTERNAL_QUOTA_RATIO, EXTERNAL_PRICE_DECAY
} from '../data/material-plants.data.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;
const REFUND_UPGRADE = 0.4;
const REFUND_PRODUCTION = 0.5;
const HISTORY_LIMIT = 20;
const PLANT_IDLE_WARN_DAYS = 60;   // peringatan jika pabrik menganggur selama ini

function _money(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }

function _emptyPlant() {
    return { built: false, level: 0, upgrade: null, producing: null, idleDays: 0, unpaid: 0 };
}

export class ComponentPlantSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        this._unsubs.push(bus.on('time:day-changed', () => this._tickDaily()));
        this._unsubs.push(bus.on('state:hydrated',   () => this._onHydrated()));
        // Game baru (onboarding) tidak memicu state:hydrated, jadi inisialisasi juga di sini.
        // _onHydrated idempoten: hanya mengisi yang belum ada.
        this._onHydrated();
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
        if (typeof cp.totalConsumed !== 'number') cp.totalConsumed = 0;
        if (typeof cp.maintenancePaid !== 'number') cp.maintenancePaid = 0;
        if (typeof cp.externalRevenue !== 'number') cp.externalRevenue = 0;
        if (typeof cp.externalUnits !== 'number') cp.externalUnits = 0;
        if (typeof cp.savings !== 'number') cp.savings = 0;
        if (typeof cp.pendingRevenue !== 'number') cp.pendingRevenue = 0;
        if (typeof cp.taxPaid !== 'number') cp.taxPaid = 0;
        if (!cp.external || typeof cp.external !== 'object') cp.external = { key: '', sold: {} };

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
            if (typeof ps.idleDays !== 'number') ps.idleDays = 0;
            if (typeof ps.unpaid !== 'number') ps.unpaid = 0;
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
        if (this.getEligibleComponents(typeId).length === 0) {
            return { ok: false, reason: 'Belum ada komponen yang bisa diproduksi. Selesaikan riset dulu.', reasonKey: 'pl.unlock.components' };
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
    // PAJAK INFRASTRUKTUR (dibaca EconomySystem tiap bulan)
    // Pajak properti + utilitas dasar = INFRA_TAX_RATE_MONTHLY x modal terpasang.
    // Mencakup semua pabrik komponen yang berdiri dan fab chip.
    // ============================================================
    getPlantInfraTax(typeId) {
        const ps = this._getPlantState(typeId);
        if (!ps || !ps.built || !ps.level) return 0;
        return Math.round(getPlantCapital(typeId, ps.level) * INFRA_TAX_RATE_MONTHLY);
    }

    getFabInfraTax() {
        const f = this.state.data.fab;
        if (!f || !f.built || !f.level) return 0;
        const cap = FAB_LEVELS.reduce((a, l) => l.level <= f.level ? a + l.cost : a, 0);
        return Math.round(cap * INFRA_TAX_RATE_MONTHLY);
    }

    getMonthlyInfraTax() {
        let sum = this.getFabInfraTax();
        PLANT_TYPES.forEach(pt => { sum += this.getPlantInfraTax(pt.id); });
        return sum;
    }

    // Dipanggil EconomySystem saat menutup bulan: omzet penjualan eksternal bulan ini
    // (kas sudah bertambah saat dijual; ini hanya untuk laporan & pajak laba).
    takeMonthlyRevenue() {
        const cp = this.state.data.componentPlants;
        if (!cp) return 0;
        const r = cp.pendingRevenue || 0;
        cp.pendingRevenue = 0;
        return r;
    }

    // ============================================================
    // MARGIN & PENJUALAN EKSTERNAL
    // Biaya efektif per unit bagus = biaya internal / yield. Stok surplus bisa dijual
    // grosir (harga pasar x EXTERNAL_PRICE_RATE), dibatasi kuota bulanan dan harga
    // turun saat kuota terpakai. Pabrik kecil (yield rendah) bisa merugi; skala = margin.
    // ============================================================
    _monthKey() {
        const t = this.state.data.time;
        return t.currentYear + '-' + t.currentMonth;
    }

    _externalState() {
        const cp = this.state.data.componentPlants;
        const key = this._monthKey();
        if (!cp.external || cp.external.key !== key) cp.external = { key: key, sold: {} };
        return cp.external;
    }

    getEffectiveUnitCost(typeId, componentId) {
        const ps = this._getPlantState(typeId);
        if (!ps || !ps.level) return 0;
        const y = getPlantYield(ps.level) || 1;
        return this.getUnitCost(componentId) / y;
    }

    // { price, effCost, marginPerUnit, marginPct, quotaLeft, stock }
    getExternalQuote(typeId, componentId) {
        const comp = getComponentById(componentId);
        const ps = this._getPlantState(typeId);
        if (!comp || !ps || !ps.built || !ps.level) return null;
        const info = getPlantLevelInfo(typeId, ps.level);
        const quota = Math.floor(info.capacityMonthly * EXTERNAL_QUOTA_RATIO);
        const sold = this._externalState().sold[typeId] || 0;
        const quotaLeft = Math.max(0, quota - sold);
        const base = (comp.costPerUnit || 0) * EXTERNAL_PRICE_RATE;
        const price = base * (1 - EXTERNAL_PRICE_DECAY * Math.min(1, sold / Math.max(1, quota)));
        const effCost = this.getEffectiveUnitCost(typeId, componentId);
        const margin = price - effCost;
        return {
            price: price, effCost: effCost, marginPerUnit: margin,
            marginPct: price > 0 ? margin / price : 0,
            quotaLeft: quotaLeft, quota: quota, stock: this.getInventory(componentId)
        };
    }

    sellExternal(typeId, componentId, qty) {
        const data = this.state.data;
        const cp = data.componentPlants;
        const pt = getPlantTypeById(typeId);
        const q = this.getExternalQuote(typeId, componentId);
        if (!pt || !q) return { ok: false, reason: 'Pabrik belum dibangun.' };
        const comp = getComponentById(componentId);
        if (!comp || comp.category !== pt.category) return { ok: false, reason: 'Komponen tidak cocok dengan pabrik ini.' };
        qty = Math.floor(Math.min(qty || 0, q.stock, q.quotaLeft));
        if (qty < 1) {
            return { ok: false, reason: q.stock < 1 ? 'Stok kosong.' : 'Kuota jual bulan ini habis.' };
        }
        const ext = this._externalState();
        const sold = ext.sold[typeId] || 0;
        // Harga rata-rata batch: harga turun linear sepanjang kuota.
        const base = (comp.costPerUnit || 0) * EXTERNAL_PRICE_RATE;
        const midRatio = Math.min(1, (sold + qty / 2) / Math.max(1, q.quota));
        const avgPrice = base * (1 - EXTERNAL_PRICE_DECAY * midRatio);
        const revenue = Math.round(avgPrice * qty);
        const cost = Math.round(q.effCost * qty);

        cp.inventory[componentId] = q.stock - qty;
        ext.sold[typeId] = sold + qty;
        cp.externalRevenue += revenue;
        cp.externalUnits += qty;
        cp.pendingRevenue += revenue;
        this.state.addCash(revenue);

        this.state.addLog('Jual grosir ' + comp.name + ': ' + qty.toLocaleString('en-US') + ' unit (' + _money(revenue) + ', margin ' + _money(revenue - cost) + ').', LOG_TYPES.success);
        ToastService.success('Terjual ' + qty.toLocaleString('en-US') + ' unit · ' + _money(revenue));
        bus.emit('plant:external-sale', { typeId: typeId, componentId: componentId, qty: qty, revenue: revenue });
        bus.emit('state:changed', data);
        return { ok: true, qty: qty, revenue: revenue, margin: revenue - cost };
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
    // PEMAKAIAN STOK (Tahap 2)
    // Dipanggil saat produk diluncurkan. Stok pabrik dipakai dulu.
    // Kekurangannya dibeli dengan harga pasar; biaya itu dikembalikan
    // ke pemanggil (marketCost) supaya pemanggil yang membayarnya.
    // ============================================================
    consumeForProduct(componentId, qty) {
        const cp = this.state.data.componentPlants;
        const comp = getComponentById(componentId);
        qty = Math.max(0, Math.floor(qty || 0));
        if (!comp || !cp) return { fromStock: 0, shortfall: qty, marketCost: (comp ? comp.costPerUnit || 0 : 0) * qty };

        const have = this.getInventory(componentId);
        const used = Math.min(have, qty);
        const shortfall = qty - used;

        if (used > 0) {
            cp.inventory[componentId] = have - used;
            cp.totalConsumed = (cp.totalConsumed || 0) + used;
            // Penghematan: selisih harga pasar vs biaya efektif internal.
            const pt = PLANT_TYPES.find(p => p.category === comp.category);
            if (pt) {
                const saved = ((comp.costPerUnit || 0) - this.getEffectiveUnitCost(pt.id, componentId)) * used;
                cp.savings = (cp.savings || 0) + saved;
            }
            bus.emit('state:changed', this.state.data);
        }

        return {
            fromStock: used,
            shortfall: shortfall,
            marketCost: Math.round((comp.costPerUnit || 0) * shortfall * 100) / 100
        };
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
            this._tickMaintenance(pt.id);
            this._tickIdle(pt.id);
        });
    }

    _tickMaintenance(typeId) {
        const cp = this.state.data.componentPlants;
        const ps = this._getPlantState(typeId);
        if (!ps || !ps.built || !ps.level) return;

        const daily = Math.round(getPlantMaintenance(typeId, ps.level) / PLANT_CYCLE_DAYS);
        if (daily <= 0) return;
        ps.unpaid = (ps.unpaid || 0) + daily;

        if (WalletService.canAfford(ps.unpaid)) {
            WalletService.pay(ps.unpaid, 'plant-maintenance');
            cp.maintenancePaid = (cp.maintenancePaid || 0) + ps.unpaid;
            ps.unpaid = 0;
        } else {
            const pt = getPlantTypeById(typeId);
            ToastService.warning('Perawatan ' + pt.name + ' belum terbayar (' + _money(ps.unpaid) + ').');
        }
    }

    _tickIdle(typeId) {
        const ps = this._getPlantState(typeId);
        if (!ps || !ps.built) return;

        if (ps.producing || ps.upgrade) {
            ps.idleDays = 0;
            return;
        }
        ps.idleDays = (ps.idleDays || 0) + 1;
        if (ps.idleDays === PLANT_IDLE_WARN_DAYS) {
            const pt = getPlantTypeById(typeId);
            this.state.addLog(pt.name + ' menganggur ' + PLANT_IDLE_WARN_DAYS + ' hari. Biaya perawatan tetap berjalan.', LOG_TYPES.info);
            ToastService.info(pt.name + ' menganggur. Mulai produksi agar kapasitasnya terpakai.');
            bus.emit('plant:idle', { typeId: typeId, days: ps.idleDays });
        }
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
        const ps = this._getPlantState(typeId);
        const p = ps.producing;
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
            ps.producing = null;
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
                unlock: this.isUnlocked(pt.id),
                maintenanceMonthly: ps.level ? getPlantMaintenance(pt.id, ps.level) : 0,
                unpaid: ps.unpaid || 0,
                idleDays: ps.idleDays || 0,
                infraTax: this.getPlantInfraTax(pt.id),
                capital: ps.level ? getPlantCapital(pt.id, ps.level) : 0
            };
        });
    }
}
