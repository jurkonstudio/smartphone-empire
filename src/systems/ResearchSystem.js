// FILE: src/systems/ResearchSystem.js
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { BALANCE } from '../data/balance.data.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { ToastService } from '../core/ToastService.js';
import { LOG_TYPES } from '../config/constants.js';
import {
    RESEARCH_NODES,
    RESEARCH_CATEGORIES,
    getNodeById,
    validateResearchData,
    RND_TRACKS,
    getTechBenchmark,
    computeTechEdge
} from '../data/research.data.js';
import { WalletService } from './WalletService.js';

// 1 hari game = 24 jam × 60 menit = 1440 menit (dari time.config.js)
const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;

// ============================================================
// ResearchSystem
// ============================================================
export class ResearchSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        validateResearchData();
        this._refreshMaxSlots();

        this._unsubs.push(bus.on('time:day-changed', (snap) => this._onDayChanged(snap)));
        this._unsubs.push(bus.on('team:changed',   ()     => this._refreshMaxSlots()));
        this._unsubs.push(bus.on('state:hydrated', ()     => this._onHydrated()));
        this._unsubs.push(bus.on('time:month-changed', () => this._onMonthChangedRnd()));
        this._ensureRnd();

        console.info('[ResearchSystem] siap. Slot aktif: ' + this.state.data.research.maxSlots);
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    // ---------- LIFECYCLE ----------
    _onHydrated() {
        const data = this.state.data;
        const current = data.time.elapsedGameMinutes;

        // Pastikan properti baru ada untuk save lama (Anti-Crash)
        if (typeof data.research.purchasedSlots !== 'number') {
            data.research.purchasedSlots = 0;
        }

        data.research.active.forEach(e => {
            if (typeof e.progressDays !== 'number')       e.progressDays = 0;
            if (typeof e.durationDays !== 'number')       e.durationDays = 0;
            if (typeof e.lastProcessedMinute !== 'number') e.lastProcessedMinute = current;
            if (typeof e.startedAtGameMinute !== 'number') e.startedAtGameMinute = current;
        });
        this._refreshMaxSlots();
        this._ensureRnd();
    }

    _refreshMaxSlots() {
        const data = this.state.data;
        const base = BALANCE.research.baseSlots;
        const perEng = BALANCE.research.perEngineerSlots;
        const cap = BALANCE.research.maxSlots;
        const eng = data.team.engineers || 0;
        
        // --- PERBAIKAN: Tambahkan slot yang dibeli ---
        const purchased = data.research.purchasedSlots || 0;
        const calculatedFromEngineers = Math.min(cap, base + Math.floor(eng * perEng));
        const slots = calculatedFromEngineers + purchased;

        if (data.research.maxSlots !== slots) {
            data.research.maxSlots = slots;
            bus.emit('research:slots-changed', { maxSlots: slots });
            bus.emit('state:changed', data);
        }
    }

    // --- FITUR BELI SLOT ---
    getSlotCost() {
        const data = this.state.data;
        const currentPurchased = data.research.purchasedSlots || 0;
        
        // Batasi maksimal beli 3 slot tambahan
        if (currentPurchased >= 3) return -1;

        // Harga: $50k, $110k, $242k
        const basePrice = 50000;
        const multiplier = Math.pow(2.2, currentPurchased); 
        return Math.round(basePrice * multiplier);
    }

    buySlot() {
        const data = this.state.data;
        const cost = this.getSlotCost();
        
        if (cost === -1) return { ok: false, reason: 'Batas maksimal beli slot (3) tercapai.' };
        if (!WalletService.canAfford(cost)) return { ok: false, reason: 'Kas tidak mencukupi untuk membeli slot.' };

        WalletService.pay(cost, 'research-slot');
        data.research.purchasedSlots = (data.research.purchasedSlots || 0) + 1;
        
        this._refreshMaxSlots();
        this.state.addLog('Membeli 1 Slot R&D baru ($' + cost.toLocaleString('en-US') + ').', LOG_TYPES.info);
        bus.emit('state:changed', data);
        
        return { ok: true, newMax: data.research.maxSlots };
    }
    // -----------------------

    _getSpeedMultiplier() {
        const eng = this.state.data.team.engineers || 0;
        const base = BALANCE.research.baseSpeed;
        const per = BALANCE.research.perEngineerSpeed;
        const cap = BALANCE.research.maxSpeedMultiplier;
        const raw = base + eng * per;
        return Math.min(raw, cap);
    }

    _onDayChanged(_snapshot) {
        const data = this.state.data;
        this._tickRefining();
        if (!data.research.active.length) return;

        const currentMinute = data.time.elapsedGameMinutes;
        const speed = this._getSpeedMultiplier();
        const completedEntries = [];

        for (const entry of data.research.active) {
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

        if (data.research.active.length > 0) {
            bus.emit('research:progress', {
                active: data.research.active.map(e => ({
                    nodeId: e.nodeId,
                    name: e.name,
                    progressDays: e.progressDays,
                    durationDays: e.durationDays,
                    percent: e.durationDays > 0 ? Math.min(1, e.progressDays / e.durationDays) : 0,
                    remainingDays: Math.max(0, (e.durationDays - e.progressDays) / speed)
                })),
                maxSlots: data.research.maxSlots
            });
        }
    }

    _completeResearch(entry) {
        const data = this.state.data;
        const idx = data.research.active.findIndex(e => e.nodeId === entry.nodeId);
        if (idx < 0) return;
        data.research.active.splice(idx, 1);

        if (!data.research.completed.includes(entry.nodeId)) {
            data.research.completed.push(entry.nodeId);
            data.research.totalCompleted = (data.research.totalCompleted || 0) + 1;
        }

        const node = getNodeById(entry.nodeId);
        if (!node) return;

        ToastService.success('Riset selesai: ' + node.name);
        if (data.settings.vibrate) {
            try { if (navigator.vibrate) navigator.vibrate([20, 30, 20]); } catch (e) {}
        }
        this.state.addLog('Riset selesai: ' + node.name + ' (' + node.category + ').', LOG_TYPES.success);

        if (data.research.completed.length === 1) {
            this.state.addMilestone('first_research', 'Riset pertama: ' + node.name);
        }

        const bz = BALANCE.rnd.buzz;
        this.addBuzz(bz.perNode + (node.tier || 1) * bz.perTier, 'research');
        if (typeof this.state.addReputation === 'function') this.state.addReputation(bz.reputationPerNode);

        bus.emit('research:completed', {
            nodeId: node.id,
            name: node.name,
            category: node.category,
            effects: node.effects || {}
        });

        bus.emit('state:changed', data);
    }

    // ============================================================
    // API PUBLIK
    // ============================================================
    getNodeStatus(nodeId, opts) {
        const ignoreCash = !!(opts && opts.ignoreCash);
        const data = this.state.data;
        const node = getNodeById(nodeId);
        if (!node) return { status: 'locked', reason: 'Node tidak ditemukan.', blocker: 'missing' };

        if (data.research.completed.includes(nodeId)) {
            return { status: 'done', reason: null, blocker: null };
        }
        if (data.research.active.some(e => e.nodeId === nodeId)) {
            return { status: 'running', reason: null, blocker: null };
        }
        if (data.time.currentYear < node.minYear) {
            return { status: 'locked', reason: 'Tersedia tahun ' + node.minYear, blocker: 'year' };
        }
        const missing = (node.prerequisites || []).filter(p => !data.research.completed.includes(p));
        if (missing.length) {
            const names = missing.map(m => (getNodeById(m) || {}).name || m);
            return { status: 'locked', reason: 'Butuh: ' + names.join(', '), blocker: 'prereq' };
        }
        if (data.research.active.length >= data.research.maxSlots) {
            return { status: 'locked', reason: 'Slot riset penuh (' + data.research.active.length + '/' + data.research.maxSlots + ')', blocker: 'slots' };
        }
        if (!ignoreCash && !WalletService.canAfford(node.cost)) {
            return { status: 'locked', reason: 'Uang tidak cukup ($' + node.cost.toLocaleString('en-US') + ')', blocker: 'cash' };
        }
        return { status: 'available', reason: null, blocker: null };
    }

    startResearch(nodeId, opts) {
        const paidWithSilicon = !!(opts && opts.paidWithSilicon);
        const data = this.state.data;
        const node = getNodeById(nodeId);
        if (!node) return { ok: false, reason: 'Node tidak ditemukan.' };

        const st = this.getNodeStatus(nodeId, { ignoreCash: paidWithSilicon });
        if (st.status !== 'available') {
            return { ok: false, reason: st.reason || 'Belum bisa dimulai.' };
        }

        if (!paidWithSilicon) WalletService.pay(node.cost, 'research');

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
        data.research.active.push(entry);

        this.state.addLog('Mulai riset: ' + node.name + ' ($' + node.cost.toLocaleString('en-US') + ').', LOG_TYPES.info);

        bus.emit('research:started', {
            nodeId: node.id,
            name: node.name,
            category: node.category,
            cost: node.cost,
            durationDays: node.durationDays
        });
        bus.emit('tutorial:action', { id: 'action:research-started' });
        bus.emit('state:changed', data);

        return { ok: true };
    }

    cancelResearch(nodeId) {
        const data = this.state.data;
        const idx = data.research.active.findIndex(e => e.nodeId === nodeId);
        if (idx < 0) return { ok: false, reason: 'Riset tidak aktif.' };

        const node = getNodeById(nodeId);
        data.research.active.splice(idx, 1);

        const refund = node ? Math.floor(node.cost * (BALANCE.research.refundPercent || 0)) : 0;
        if (refund > 0) this.state.addCash(refund);

        this.state.addLog('Riset dibatalkan: ' + (node ? node.name : nodeId) + ' (refund $' + refund.toLocaleString('en-US') + ').', LOG_TYPES.warning);
        bus.emit('research:cancelled', { nodeId, refund });
        bus.emit('state:changed', data);
        return { ok: true, refund };
    }

    boostResearch(nodeId, days) {
        const data = this.state.data;
        const entry = data.research.active.find(e => e.nodeId === nodeId);
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

    getProgress() {
        const data = this.state.data;
        const speed = this._getSpeedMultiplier();
        return data.research.active.map(e => {
            const percent = e.durationDays > 0 ? Math.min(1, e.progressDays / e.durationDays) : 0;
            const remainingDays = e.durationDays > 0 ? Math.max(0, Math.ceil((e.durationDays - e.progressDays) / speed)) : 0;
            return {
                nodeId: e.nodeId, name: e.name, category: e.category,
                percent, progressDays: e.progressDays, durationDays: e.durationDays, remainingDays
            };
        });
    }

    isUnlocked(componentId) {
        const data = this.state.data;
        for (const nodeId of data.research.completed) {
            const node = getNodeById(nodeId);
            if (node && node.effects && Array.isArray(node.effects.unlocksComponents)) {
                if (node.effects.unlocksComponents.includes(componentId)) return true;
            }
        }
        return false;
    }

    isOsFeatureUnlocked(featureId) {
        const data = this.state.data;
        for (const nodeId of data.research.completed) {
            const node = getNodeById(nodeId);
            if (node && node.effects && Array.isArray(node.effects.unlocksOsFeatures)) {
                if (node.effects.unlocksOsFeatures.includes(featureId)) return true;
            }
        }
        return false;
    }

    getNodesByCategory(categoryId) {
        return RESEARCH_NODES.filter(n => n.category === categoryId);
    }

    getCategories() {
        return RESEARCH_CATEGORIES;
    }

    getSpeedInfo() {
        const speed = this._getSpeedMultiplier();
        const cap = BALANCE.research.maxSpeedMultiplier;
        return { speed, cap, atCap: speed >= cap - 1e-9 };
    }

    getEtaDays(nodeOrId) {
        const node = typeof nodeOrId === 'string' ? getNodeById(nodeOrId) : nodeOrId;
        if (!node) return 0;
        return Math.ceil(node.durationDays / Math.max(0.01, this._getSpeedMultiplier()));
    }

    getDependents(nodeId) {
        return RESEARCH_NODES.filter(n => (n.prerequisites || []).includes(nodeId));
    }

    getSummary() {
        const data = this.state.data;
        const done = new Set(data.research.completed);
        const byCategory = {};
        RESEARCH_CATEGORIES.forEach(c => { byCategory[c.id] = { id: c.id, total: 0, done: 0, running: 0 }; });
        const runningIds = new Set(data.research.active.map(e => e.nodeId));
        RESEARCH_NODES.forEach(n => {
            const b = byCategory[n.category];
            if (!b) return;
            b.total++;
            if (done.has(n.id)) b.done++;
            else if (runningIds.has(n.id)) b.running++;
        });
        const total = RESEARCH_NODES.length;
        const completed = RESEARCH_NODES.filter(n => done.has(n.id)).length;
        return {
            total,
            completed,
            percent: total > 0 ? completed / total : 0,
            running: data.research.active.length,
            maxSlots: data.research.maxSlots,
            byCategory
        };
    }

    getRecommended() {
        const candidates = [];
        RESEARCH_NODES.forEach(n => {
            if (this.getNodeStatus(n.id).status !== 'available') return;
            candidates.push({ node: n, dependents: this.getDependents(n.id).length });
        });
        if (!candidates.length) return null;
        candidates.sort((a, b) => {
            if (b.dependents !== a.dependents) return b.dependents - a.dependents;
            if (a.node.cost !== b.node.cost) return a.node.cost - b.node.cost;
            return a.node.durationDays - b.node.durationDays;
        });
        return candidates[0];
    }


    // ============================================================
    // R&D LANJUTAN
    // ============================================================
    _ensureRnd() {
        const r = this.state.data.research;
        if (!r.mastery || typeof r.mastery !== 'object') r.mastery = {};
        RESEARCH_CATEGORIES.forEach(c => { if (typeof r.mastery[c.id] !== 'number') r.mastery[c.id] = 0; });
        if (!Array.isArray(r.refining)) r.refining = [];
        if (typeof r.buzz !== 'number') r.buzz = 0;
        if (typeof r.totalRefined !== 'number') r.totalRefined = 0;
        const cur = this.state.data.time.elapsedGameMinutes;
        r.refining.forEach(e => {
            if (typeof e.progressDays !== 'number') e.progressDays = 0;
            if (typeof e.lastProcessedMinute !== 'number') e.lastProcessedMinute = cur;
        });
    }

    getRefineSlots() {
        const cfg = BALANCE.rnd;
        const eng = this.state.data.team.engineers || 0;
        return Math.min(cfg.maxSlots, cfg.slotsBase + Math.floor(eng / cfg.engineersPerExtraSlot));
    }

    getMastery() {
        this._ensureRnd();
        return Object.assign({}, this.state.data.research.mastery);
    }

    getBenchmark() { return getTechBenchmark(this.state.data.time.currentYear); }

    getTechEdge(levels) {
        return computeTechEdge(levels || this.state.data.research.mastery, this.state.data.time.currentYear);
    }

    getTechSnapshot() {
        this._ensureRnd();
        return { levels: Object.assign({}, this.state.data.research.mastery), year: this.state.data.time.currentYear };
    }

    getRefineInfo(catId) {
        this._ensureRnd();
        const data = this.state.data;
        const cfg = BALANCE.rnd;
        const track = RND_TRACKS[catId];
        const level = data.research.mastery[catId] || 0;
        const year = data.time.currentYear;

        const doneInCat = RESEARCH_NODES.filter(n => n.category === catId && data.research.completed.includes(n.id)).length;
        const capNodes = cfg.capBase + cfg.capPerCompletedNode * doneInCat;
        const capYear = Math.floor(Math.max(0, year - 2000) * cfg.capYearPerYear) + cfg.capYearBase;
        const cap = Math.min(cfg.maxLevel, capNodes, capYear);

        const baseCost = (cfg.baseCost[catId] || 15000);
        const cost = Math.round(baseCost * Math.pow(cfg.costGrowth, level) * (1 + cfg.yearCostInflation * Math.max(0, year - 2000)) / 100) * 100;
        const days = Math.min(cfg.maxDays, Math.round(cfg.baseDays * Math.pow(cfg.daysGrowth, level)));

        const running = data.research.refining.find(e => e.categoryId === catId) || null;
        let status = 'available', reason = null, blocker = null;
        if (running) { status = 'running'; }
        else if (doneInCat < 1) { status = 'locked'; blocker = 'node'; reason = 'Selesaikan riset dasar kategori ini dulu'; }
        else if (level >= cfg.maxLevel) { status = 'maxed'; reason = 'Level maksimum'; }
        else if (level >= cap) {
            status = 'capped';
            if (level >= capNodes && capNodes <= capYear) { blocker = 'node'; reason = 'Selesaikan riset dasar baru untuk membuka level lebih tinggi'; }
            else { blocker = 'year'; reason = 'Tunggu kemajuan zaman untuk level berikutnya'; }
        }
        else if (data.research.refining.length >= this.getRefineSlots()) { status = 'locked'; blocker = 'slots'; reason = 'Slot R&D penuh (' + data.research.refining.length + '/' + this.getRefineSlots() + ')'; }
        else if (!WalletService.canAfford(cost)) { status = 'locked'; blocker = 'cash'; reason = 'Uang tidak cukup ($' + cost.toLocaleString('en-US') + ')'; }

        return {
            id: catId, name: track ? track.name : catId, hint: track ? track.hint : '',
            level, cap, maxLevel: cfg.maxLevel, cost, days, etaDays: Math.ceil(days / Math.max(0.01, this._getSpeedMultiplier())),
            statBonus: Math.min(cfg.statCap, level * cfg.statPerLevel),
            nextStatBonus: Math.min(cfg.statCap, (level + 1) * cfg.statPerLevel),
            benchmark: this.getBenchmark(),
            status, reason, blocker, running
        };
    }

    getRndOverview() {
        const edge = this.getTechEdge();
        return {
            avg: edge.avg, benchmark: edge.benchmark, delta: edge.delta, factor: edge.factor,
            buzz: this.getBuzz(), buzzFactor: this.getBuzzFactor(),
            slots: this.getRefineSlots(), used: this.state.data.research.refining.length,
            totalRefined: this.state.data.research.totalRefined || 0
        };
    }

    startRefine(catId) {
        this._ensureRnd();
        const data = this.state.data;
        if (!RND_TRACKS[catId]) return { ok: false, reason: 'Jalur R&D tidak ditemukan.' };
        const info = this.getRefineInfo(catId);
        if (info.status !== 'available') return { ok: false, reason: info.reason || 'Belum bisa dimulai.' };

        WalletService.pay(info.cost, 'research');
        const entry = {
            categoryId: catId,
            name: info.name + ' Lv ' + (info.level + 1),
            targetLevel: info.level + 1,
            cost: info.cost,
            durationDays: info.days,
            progressDays: 0,
            startedAtGameMinute: data.time.elapsedGameMinutes,
            lastProcessedMinute: data.time.elapsedGameMinutes
        };
        data.research.refining.push(entry);
        this.state.addLog('Mulai R&D lanjutan: ' + entry.name + ' ($' + info.cost.toLocaleString('en-US') + ').', LOG_TYPES.info);
        bus.emit('research:refine-started', { categoryId: catId, targetLevel: entry.targetLevel });
        bus.emit('state:changed', data);
        return { ok: true, targetLevel: entry.targetLevel, cost: info.cost, days: info.days };
    }

    cancelRefine(catId) {
        const data = this.state.data;
        const idx = data.research.refining.findIndex(e => e.categoryId === catId);
        if (idx < 0) return { ok: false, reason: 'R&D tidak aktif.' };
        const e = data.research.refining[idx];
        data.research.refining.splice(idx, 1);
        const refund = Math.floor((e.cost || 0) * (BALANCE.research.refundPercent || 0));
        if (refund > 0) this.state.addCash(refund);
        this.state.addLog('R&D dibatalkan: ' + e.name + ' (refund $' + refund.toLocaleString('en-US') + ').', LOG_TYPES.warning);
        bus.emit('research:refine-cancelled', { categoryId: catId, refund });
        bus.emit('state:changed', data);
        return { ok: true, refund };
    }

    boostRefine(catId, days) {
        const data = this.state.data;
        const e = data.research.refining.find(x => x.categoryId === catId);
        if (!e) return { ok: false, reason: 'R&D tidak aktif.' };
        const add = (days === Infinity) ? (e.durationDays - e.progressDays) : Math.max(0, days || 0);
        e.progressDays = Math.min(e.durationDays, e.progressDays + add);
        if (e.progressDays >= e.durationDays) { this._completeRefine(e); return { ok: true, completed: true }; }
        bus.emit('state:changed', data);
        return { ok: true, completed: false };
    }

    _tickRefining() {
        const data = this.state.data;
        this._ensureRnd();
        const list = data.research.refining;
        if (!list.length) return;
        const cur = data.time.elapsedGameMinutes;
        const speed = this._getSpeedMultiplier();
        const done = [];
        list.forEach(e => {
            const delta = cur - e.lastProcessedMinute;
            if (delta <= 0) return;
            e.progressDays += (delta / MINUTES_PER_DAY) * speed;
            e.lastProcessedMinute = cur;
            if (e.progressDays >= e.durationDays) done.push(e);
        });
        done.forEach(e => this._completeRefine(e));
        if (data.research.refining.length) {
            bus.emit('research:refine-progress', {
                active: data.research.refining.map(e => ({
                    categoryId: e.categoryId, name: e.name,
                    percent: e.durationDays > 0 ? Math.min(1, e.progressDays / e.durationDays) : 0,
                    remainingDays: Math.max(0, (e.durationDays - e.progressDays) / speed)
                }))
            });
        }
    }

    _completeRefine(entry) {
        const data = this.state.data;
        const idx = data.research.refining.findIndex(e => e.categoryId === entry.categoryId);
        if (idx >= 0) data.research.refining.splice(idx, 1);
        data.research.mastery[entry.categoryId] = Math.max(data.research.mastery[entry.categoryId] || 0, entry.targetLevel);
        data.research.totalRefined = (data.research.totalRefined || 0) + 1;

        const bz = BALANCE.rnd.buzz;
        this.addBuzz(bz.perRefineBase + entry.targetLevel * bz.perRefineLevel, 'refine');
        if (typeof this.state.addReputation === 'function') this.state.addReputation(bz.reputationPerLevel * Math.max(1, entry.targetLevel / 4));

        ToastService.success('R&D selesai: ' + entry.name);
        if (data.settings.vibrate) { try { if (navigator.vibrate) navigator.vibrate([20, 30, 20]); } catch (e) {} }
        const edge = this.getTechEdge();
        const standing = edge.delta >= 0 ? 'di atas standar pasar' : 'masih di bawah standar pasar';
        this.state.addLog('R&D selesai: ' + entry.name + ' — teknologi ' + standing + '. Produk baru memakai level ini.', LOG_TYPES.success);
        bus.emit('research:refined', { categoryId: entry.categoryId, level: entry.targetLevel });
        bus.emit('state:changed', data);
    }

    addBuzz(points, _reason) {
        const data = this.state.data;
        this._ensureRnd();
        const bz = BALANCE.rnd.buzz;
        data.research.buzz = Math.min(bz.max, (data.research.buzz || 0) + Math.max(0, points || 0));
        bus.emit('research:buzz', { buzz: data.research.buzz, reason: _reason || null });
    }
    getBuzz() { return this.state.data.research.buzz || 0; }
    getBuzzFactor() {
        const bz = BALANCE.rnd.buzz;
        return 1 + Math.min(bz.maxDemandBonus, this.getBuzz() * bz.demandPerPoint);
    }
    _onMonthChangedRnd() {
        const data = this.state.data;
        this._ensureRnd();
        if ((data.research.buzz || 0) <= 0) return;
        data.research.buzz *= BALANCE.rnd.buzz.decayPerMonth;
        if (data.research.buzz < 0.5) data.research.buzz = 0;
        bus.emit('research:buzz', { buzz: data.research.buzz, reason: 'decay' });
    }

    completeAllResearch() {
        const data = this.state.data;
        RESEARCH_NODES.forEach(n => {
            if (!data.research.completed.includes(n.id)) {
                data.research.completed.push(n.id);
            }
        });
        data.research.active = [];
        data.research.totalCompleted = data.research.completed.length;
        this.state.addLog('(cheat) Semua riset diselesaikan.', LOG_TYPES.info);
        bus.emit('state:changed', data);
        return { ok: true, total: data.research.completed.length };
    }

    completeResearch(nodeId) {
        const data = this.state.data;
        const node = getNodeById(nodeId);
        if (!node) return { ok: false, reason: 'Node tidak ditemukan.' };
        if (data.research.completed.includes(nodeId)) return { ok: false, reason: 'Sudah selesai.' };

        const idx = data.research.active.findIndex(e => e.nodeId === nodeId);
        if (idx >= 0) data.research.active.splice(idx, 1);

        data.research.completed.push(nodeId);
        data.research.totalCompleted = (data.research.totalCompleted || 0) + 1;

        this.state.addLog('(cheat) Riset ' + node.name + ' diselesaikan.', LOG_TYPES.info);
        bus.emit('research:completed', { nodeId, name: node.name, category: node.category, effects: node.effects || {} });
        bus.emit('state:changed', data);
        return { ok: true };
    }
            }
