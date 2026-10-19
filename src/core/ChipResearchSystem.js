// FILE: src/core/ChipResearchSystem.js
// ============================================================
// ChipResearchSystem — riset chip TERPISAH dari ResearchSystem.
// Mengelola 52 node dari chip-research.data.js.
// State: data.chipResearch = { active: [], completed: [], maxSlots, totalCompleted }
// Progress via time:day-changed, mirror pola ResearchSystem.
// ============================================================
import { bus } from './EventBus.js';
import { state } from './GameState.js';
import { BALANCE } from '../data/balance.data.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { ToastService } from './ToastService.js';
import { LOG_TYPES } from '../config/constants.js';
import {
    CHIP_RESEARCH_NODES,
    CHIP_RESEARCH_CATEGORIES,
    getChipResearchById,
    validateChipResearch
} from '../data/chip-research.data.js';
import { WalletService } from '../systems/WalletService.js';

// Panel "Manufaktur": node riset fabrikasi yang masih terkunci bisa dibeli
// (dibuka lebih awal) dengan uang game mulai tahun ini.
export const FAB_UNLOCK_YEAR = 2023;
export const FAB_UNLOCK_CATEGORIES = ['process', 'business'];
export const FAB_UNLOCK_PRICE_MULT = 1.5;

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;

export class ChipResearchSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        // Validasi data chip-research sekali saat boot (warning saja)
        try { validateChipResearch(); } catch (e) {}

        // Self-init state (kalau belum ada)
        this._ensureState();
        this._refreshMaxSlots();

        // Subscribe
        this._unsubs.push(bus.on('time:day-changed', () => this._onDayChanged()));
        this._unsubs.push(bus.on('team:changed',   () => this._refreshMaxSlots()));
        this._unsubs.push(bus.on('state:hydrated', () => this._onHydrated()));

        console.info('[ChipResearchSystem] siap. Slot: ' + (this.state.data.chipResearch ? this.state.data.chipResearch.maxSlots : 0));
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    // ============================================================
    // STATE MANAGEMENT
    // ============================================================
    _ensureState() {
        const data = this.state.data;
        if (!data.chipResearch) {
            data.chipResearch = {
                active: [],
                completed: [],
                maxSlots: 1,
                totalCompleted: 0
            };
        }
        if (!Array.isArray(data.chipResearch.active))    data.chipResearch.active = [];
        if (!Array.isArray(data.chipResearch.completed)) data.chipResearch.completed = [];
        if (!Array.isArray(data.chipResearch.unlocked))  data.chipResearch.unlocked = [];
        if (typeof data.chipResearch.maxSlots !== 'number') data.chipResearch.maxSlots = 1;
        if (typeof data.chipResearch.totalCompleted !== 'number') {
            data.chipResearch.totalCompleted = data.chipResearch.completed.length;
        }
    }

    _onHydrated() {
        this._ensureState();
        const cr = this.state.data.chipResearch;
        const current = this.state.data.time.elapsedGameMinutes;
        // Perbaiki entri aktif yang kekurangan field (save lama)
        cr.active.forEach(e => {
            if (typeof e.progressDays !== 'number')         e.progressDays = 0;
            if (typeof e.durationDays !== 'number')         e.durationDays = 0;
            if (typeof e.lastProcessedMinute !== 'number')  e.lastProcessedMinute = current;
            if (typeof e.startedAtGameMinute !== 'number')  e.startedAtGameMinute = current;
        });
        // Kalau completed punya duplikat atau totalCompleted salah
        cr.completed = cr.completed.filter((v, i, a) => a.indexOf(v) === i);
        cr.totalCompleted = cr.completed.length;
        this._refreshMaxSlots();
    }

    _refreshMaxSlots() {
        const data = this.state.data;
        const base = (BALANCE.research && BALANCE.research.baseSlots) || 1;
        const perEng = (BALANCE.research && BALANCE.research.perEngineerSlots) || 0.5;
        const cap = (BALANCE.research && BALANCE.research.maxSlots) || 3;
        const eng = (data.team && data.team.engineers) || 0;
        const slots = Math.min(cap, base + Math.floor(eng * perEng));

        if (data.chipResearch.maxSlots !== slots) {
            data.chipResearch.maxSlots = slots;
            bus.emit('chip-research:slots-changed', { maxSlots: slots });
            bus.emit('state:changed', data);
        }
    }

    _getSpeedMultiplier() {
        const eng = (this.state.data.team && this.state.data.team.engineers) || 0;
        const base = (BALANCE.research && BALANCE.research.baseSpeed) || 1.0;
        const per = (BALANCE.research && BALANCE.research.perEngineerSpeed) || 0.08;
        const cap = (BALANCE.research && BALANCE.research.maxSpeedMultiplier) || 2.5;
        return Math.min(base + eng * per, cap);
    }

    // ============================================================
    // PROGRESS (dipicu hari berubah)
    // ============================================================
    _onDayChanged() {
        const data = this.state.data;
        if (!data.chipResearch || !data.chipResearch.active.length) return;

        const currentMinute = data.time.elapsedGameMinutes;
        const speed = this._getSpeedMultiplier();
        const completedEntries = [];

        for (const entry of data.chipResearch.active) {
            const last = (typeof entry.lastProcessedMinute === 'number')
                ? entry.lastProcessedMinute
                : entry.startedAtGameMinute;

            const deltaMinutes = currentMinute - last;
            if (deltaMinutes <= 0) continue;

            const deltaDays = deltaMinutes / MINUTES_PER_DAY;
            entry.progressDays += deltaDays * speed;
            entry.lastProcessedMinute = currentMinute;

            if (entry.progressDays >= entry.durationDays) {
                completedEntries.push(entry);
            }
        }

        for (const entry of completedEntries) {
            this._completeResearch(entry);
        }

        if (data.chipResearch.active.length > 0) {
            bus.emit('chip-research:progress', {
                active: data.chipResearch.active.map(e => ({
                    nodeId: e.nodeId,
                    name: e.name,
                    progressDays: e.progressDays,
                    durationDays: e.durationDays,
                    percent: e.durationDays > 0 ? Math.min(1, e.progressDays / e.durationDays) : 0,
                    remainingDays: Math.max(0, (e.durationDays - e.progressDays) / speed)
                })),
                maxSlots: data.chipResearch.maxSlots
            });
        }
    }

    _completeResearch(entry) {
        const data = this.state.data;
        const cr = data.chipResearch;
        const idx = cr.active.findIndex(e => e.nodeId === entry.nodeId);
        if (idx < 0) return;
        cr.active.splice(idx, 1);

        if (cr.completed.indexOf(entry.nodeId) === -1) {
            cr.completed.push(entry.nodeId);
            cr.totalCompleted = (cr.totalCompleted || 0) + 1;
        }

        const node = getChipResearchById(entry.nodeId);
        if (!node) return;

        // Notifikasi
        ToastService.success('Riset chip selesai: ' + node.name);
        if (data.settings && data.settings.vibrate) {
            try { if (navigator.vibrate) navigator.vibrate([20, 30, 20]); } catch (e) {}
        }
        this.state.addLog('Riset chip selesai: ' + node.name + ' (' + node.category + ').', LOG_TYPES.success);

        // Milestone chip pertama
        if (cr.completed.length === 1) {
            this.state.addMilestone('first_chip_research', 'Riset chip pertama: ' + node.name);
        }

        bus.emit('chip-research:completed', {
            nodeId: node.id,
            name: node.name,
            category: node.category,
            unlock: node.unlock || null
        });

        bus.emit('state:changed', data);
    }

    // ============================================================
    // API PUBLIK
    // ============================================================
    // { status, reason }
    // status: 'done' | 'running' | 'available' | 'locked'
    getNodeStatus(nodeId, opts) {
        const ignoreCash = !!(opts && opts.ignoreCash);
        const data = this.state.data;
        if (!data.chipResearch) return { status: 'locked', reason: 'Sistem belum siap.' };

        const node = getChipResearchById(nodeId);
        if (!node) return { status: 'locked', reason: 'Node tidak ditemukan.' };

        if (data.chipResearch.completed.indexOf(nodeId) !== -1) {
            return { status: 'done', reason: null };
        }
        if (data.chipResearch.active.some(e => e.nodeId === nodeId)) {
            return { status: 'running', reason: null };
        }
        const bought = this.isPurchased(nodeId);
        if (!bought && data.time.currentYear < node.minYear) {
            return { status: 'locked', reason: 'Tersedia tahun ' + node.minYear };
        }
        const missing = bought ? [] : (node.prerequisites || []).filter(p => data.chipResearch.completed.indexOf(p) === -1);
        if (missing.length) {
            const names = missing.map(m => (getChipResearchById(m) || {}).name || m);
            return { status: 'locked', reason: 'Butuh: ' + names.join(', ') };
        }
        if (data.chipResearch.active.length >= data.chipResearch.maxSlots) {
            return { status: 'locked', reason: 'Slot chip penuh (' + data.chipResearch.active.length + '/' + data.chipResearch.maxSlots + ')' };
        }
        if (!ignoreCash && !WalletService.canAfford(node.cost)) {
            return { status: 'locked', reason: 'Uang tidak cukup ($' + node.cost.toLocaleString('en-US') + ')' };
        }
        return { status: 'available', reason: null };
    }

    startResearch(nodeId, opts) {
        const paidWithSilicon = !!(opts && opts.paidWithSilicon);
        const data = this.state.data;
        const node = getChipResearchById(nodeId);
        if (!node) return { ok: false, reason: 'Node tidak ditemukan.' };

        const st = this.getNodeStatus(nodeId, { ignoreCash: paidWithSilicon });
        if (st.status !== 'available') {
            return { ok: false, reason: st.reason || 'Belum bisa dimulai.' };
        }

        if (!paidWithSilicon) WalletService.pay(node.cost, 'chip-research');

        const entry = {
            nodeId: node.id,
            category: node.category,
            name: node.name,
            startedAtGameMinute: data.time.elapsedGameMinutes,
            lastProcessedMinute: data.time.elapsedGameMinutes,
            progressDays: 0,
            durationDays: node.durationDays,
            startYear: data.time.currentYear,
            startMonth: data.time.currentMonth,
            startDay: data.time.currentDay
        };
        data.chipResearch.active.push(entry);

        this.state.addLog('Mulai riset chip: ' + node.name + ' ($' + node.cost.toLocaleString('en-US') + ').', LOG_TYPES.info);
        bus.emit('chip-research:started', {
            nodeId: node.id,
            name: node.name,
            category: node.category,
            cost: node.cost,
            durationDays: node.durationDays
        });
        bus.emit('state:changed', data);
        return { ok: true };
    }

    cancelResearch(nodeId) {
        const data = this.state.data;
        const idx = data.chipResearch.active.findIndex(e => e.nodeId === nodeId);
        if (idx < 0) return { ok: false, reason: 'Riset chip tidak aktif.' };

        const node = getChipResearchById(nodeId);
        data.chipResearch.active.splice(idx, 1);

        const refundPct = (BALANCE.research && BALANCE.research.refundPercent) || 0.5;
        const refund = node ? Math.floor(node.cost * refundPct) : 0;
        if (refund > 0) this.state.addCash(refund);

        this.state.addLog(
            'Riset chip dibatalkan: ' + (node ? node.name : nodeId) + ' (refund $' + refund.toLocaleString('en-US') + ').',
            LOG_TYPES.warning
        );
        bus.emit('chip-research:cancelled', { nodeId, refund });
        bus.emit('state:changed', data);
        return { ok: true, refund };
    }

    // [SIL] Majukan progress riset aktif sebanyak `days` hari-progress
    // (Infinity = selesaikan sekarang). Selesai lewat jalur normal sehingga
    // toast, log, milestone & event tetap jalan.
    boostResearch(nodeId, days) {
        const data = this.state.data;
        const entry = data.chipResearch.active.find(e => e.nodeId === nodeId);
        if (!entry) return { ok: false, reason: 'Riset tidak aktif.' };
        const add = (days === Infinity) ? (entry.durationDays - entry.progressDays) : Math.max(0, days || 0);
        entry.progressDays = Math.min(entry.durationDays, entry.progressDays + add);
        if (entry.progressDays >= entry.durationDays) {
            this._completeResearch(entry);
            return { ok: true, completed: true };
        }
        bus.emit('state:changed', data);
        return { ok: true, completed: false };
    }

    // Ringkasan untuk UI ProgressPanel (Dashboard).
    getProgress() {
        const data = this.state.data;
        if (!data.chipResearch) return [];
        const speed = this._getSpeedMultiplier();
        return data.chipResearch.active.map(e => {
            const percent = e.durationDays > 0 ? Math.min(1, e.progressDays / e.durationDays) : 0;
            const remainingDays = e.durationDays > 0
                ? Math.max(0, Math.ceil((e.durationDays - e.progressDays) / speed))
                : 0;
            return {
                nodeId: e.nodeId,
                name: e.name,
                category: e.category,
                percent,
                progressDays: e.progressDays,
                durationDays: e.durationDays,
                remainingDays
            };
        });
    }

    // ============================================================
    // MANUFAKTUR — buka node terkunci dengan uang (>= FAB_UNLOCK_YEAR)
    // ============================================================
    isPurchased(nodeId) {
        const cr = this.state.data.chipResearch;
        return !!(cr && Array.isArray(cr.unlocked) && cr.unlocked.indexOf(nodeId) !== -1);
    }

    isFabUnlockOpen() {
        return this.state.data.time.currentYear >= FAB_UNLOCK_YEAR;
    }

    getUnlockPrice(nodeId) {
        const node = getChipResearchById(nodeId);
        return node ? Math.round(node.cost * FAB_UNLOCK_PRICE_MULT) : 0;
    }

    // Node manufaktur yang belum selesai/berjalan dan masih terkunci oleh
    // tahun atau prasyarat (belum dibuka lewat pembelian).
    isGateLocked(nodeId) {
        const data = this.state.data;
        const node = getChipResearchById(nodeId);
        if (!node || FAB_UNLOCK_CATEGORIES.indexOf(node.category) === -1) return false;
        const cr = data.chipResearch;
        if (cr.completed.indexOf(nodeId) !== -1) return false;
        if (cr.active.some(e => e.nodeId === nodeId)) return false;
        if (this.isPurchased(nodeId)) return false;
        if (data.time.currentYear < node.minYear) return true;
        return (node.prerequisites || []).some(p => cr.completed.indexOf(p) === -1);
    }

    getLockedManufactureNodes() {
        return CHIP_RESEARCH_NODES.filter(n => this.isGateLocked(n.id));
    }

    purchaseUnlock(nodeId) {
        const data = this.state.data;
        const node = getChipResearchById(nodeId);
        if (!node || FAB_UNLOCK_CATEGORIES.indexOf(node.category) === -1) return { ok: false, reason: 'Node tidak ditemukan.' };
        if (!this.isFabUnlockOpen()) return { ok: false, reason: 'Pembukaan manufaktur baru tersedia tahun ' + FAB_UNLOCK_YEAR + '.' };
        if (!this.isGateLocked(nodeId)) return { ok: false, reason: 'Node ini tidak perlu dibuka.' };
        const price = this.getUnlockPrice(nodeId);
        // Khusus uang game (bukan Silicon).
        if ((data.cash || 0) < price) return { ok: false, reason: 'Uang tidak cukup ($' + price.toLocaleString('en-US') + ')' };

        this.state.addCash(-price);
        data.chipResearch.unlocked.push(nodeId);
        this.state.addLog('Manufaktur chip dibuka: ' + node.name + ' ($' + price.toLocaleString('en-US') + ').', LOG_TYPES.success);
        bus.emit('chip-research:unlocked', { nodeId, name: node.name, price });
        bus.emit('state:changed', data);
        return { ok: true, price };
    }

    isCompleted(nodeId) {
        const cr = this.state.data.chipResearch;
        if (!cr) return false;
        return cr.completed.indexOf(nodeId) !== -1;
    }

    getCompletedIds() {
        const cr = this.state.data.chipResearch;
        return cr ? cr.completed.slice() : [];
    }

    getAllNodes() {
        return CHIP_RESEARCH_NODES.slice();
    }

    getNodesByCategory(catId) {
        return CHIP_RESEARCH_NODES.filter(n => n.category === catId);
    }

    getCategories() {
        return CHIP_RESEARCH_CATEGORIES.slice();
    }

    // ============================================================
    // CHEAT
    // ============================================================
    completeAllResearch() {
        const data = this.state.data;
        CHIP_RESEARCH_NODES.forEach(n => {
            if (data.chipResearch.completed.indexOf(n.id) === -1) {
                data.chipResearch.completed.push(n.id);
            }
        });
        data.chipResearch.active = [];
        data.chipResearch.totalCompleted = data.chipResearch.completed.length;
        this.state.addLog('(cheat) Semua riset chip diselesaikan.', LOG_TYPES.info);
        bus.emit('state:changed', data);
        return { ok: true, total: data.chipResearch.completed.length };
    }

    completeResearch(nodeId) {
        const data = this.state.data;
        const node = getChipResearchById(nodeId);
        if (!node) return { ok: false, reason: 'Node tidak ditemukan.' };
        if (data.chipResearch.completed.indexOf(nodeId) !== -1) return { ok: false, reason: 'Sudah selesai.' };

        const idx = data.chipResearch.active.findIndex(e => e.nodeId === nodeId);
        if (idx >= 0) data.chipResearch.active.splice(idx, 1);

        data.chipResearch.completed.push(nodeId);
        data.chipResearch.totalCompleted = (data.chipResearch.totalCompleted || 0) + 1;

        this.state.addLog('(cheat) Riset chip ' + node.name + ' diselesaikan.', LOG_TYPES.info);
        bus.emit('chip-research:completed', { nodeId, name: node.name, category: node.category, unlock: node.unlock || null });
        bus.emit('state:changed', data);
        return { ok: true };
    }
  }
