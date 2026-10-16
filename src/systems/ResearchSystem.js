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
    validateResearchData
} from '../data/research.data.js';

// 1 hari game = 24 jam × 60 menit = 1440 menit (dari time.config.js)
const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;

// ============================================================
// ResearchSystem
// Tanggung jawab:
//  - Menjalankan antrian riset paralel (slot dari engineer).
//  - Menghitung progress per time:day-changed (bukan tick).
//  - Menyelesaikan riset, memotong uang saat mulai, refund saat batal.
//  - Emit research:started / research:progress / research:completed / research:cancelled.
// ============================================================
export class ResearchSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        // Validasi data sekali saat boot (hanya warn ke console)
        validateResearchData();

        // Hitung slot berdasarkan tim saat ini
        this._refreshMaxSlots();

        // Event bus
        this._unsubs.push(bus.on('time:day-changed', (snap) => this._onDayChanged(snap)));
        this._unsubs.push(bus.on('team:changed',   ()     => this._refreshMaxSlots()));
        this._unsubs.push(bus.on('state:hydrated', ()     => this._onHydrated()));

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

        // Pastikan setiap entri aktif punya nilai default (save lama)
        data.research.active.forEach(e => {
            if (typeof e.progressDays !== 'number')       e.progressDays = 0;
            if (typeof e.durationDays !== 'number')       e.durationDays = 0;
            if (typeof e.lastProcessedMinute !== 'number') e.lastProcessedMinute = current;
            if (typeof e.startedAtGameMinute !== 'number') e.startedAtGameMinute = current;
        });
        this._refreshMaxSlots();
    }

    _refreshMaxSlots() {
        const data = this.state.data;
        const base = BALANCE.research.baseSlots;
        const perEng = BALANCE.research.perEngineerSlots;
        const cap = BALANCE.research.maxSlots;
        const eng = data.team.engineers || 0;
        const slots = Math.min(cap, base + Math.floor(eng * perEng));

        if (data.research.maxSlots !== slots) {
            data.research.maxSlots = slots;
            bus.emit('research:slots-changed', { maxSlots: slots });
            bus.emit('state:changed', data);
        }
    }

    // Kecepatan efektif = base + (engineers × bonus), di-cap oleh maxSpeedMultiplier.
    _getSpeedMultiplier() {
        const eng = this.state.data.team.engineers || 0;
        const base = BALANCE.research.baseSpeed;
        const per = BALANCE.research.perEngineerSpeed;
        const cap = BALANCE.research.maxSpeedMultiplier;
        const raw = base + eng * per;
        return Math.min(raw, cap);
    }

    // ---------- PROGRESS (dipicu hari berubah) ----------
    _onDayChanged(_snapshot) {
        const data = this.state.data;
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

            // Hitung dalam satuan hari, kalikan speed.
            const deltaDays = deltaMinutes / MINUTES_PER_DAY;
            entry.progressDays += deltaDays * speed;
            entry.lastProcessedMinute = currentMinute;

            if (entry.progressDays >= entry.durationDays) {
                completedEntries.push(entry);
            }
        }

        // Proses yang selesai
        for (const entry of completedEntries) {
            this._completeResearch(entry);
        }

        // Emit progress untuk yang masih berjalan
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

        // Notifikasi
        ToastService.success('Riset selesai: ' + node.name);
        if (data.settings.vibrate) {
            try { if (navigator.vibrate) navigator.vibrate([20, 30, 20]); } catch (e) {}
        }
        this.state.addLog('Riset selesai: ' + node.name + ' (' + node.category + ').', LOG_TYPES.success);

        // Milestone riset pertama
        if (data.research.completed.length === 1) {
            this.state.addMilestone('first_research', 'Riset pertama: ' + node.name);
        }

        // Emit untuk sistem lain (mis. Batch B akan membaca untuk komponen)
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

    // Kembalikan { status, reason }.
    // status: 'done' | 'running' | 'available' | 'locked'
    getNodeStatus(nodeId, opts) {
        const ignoreCash = !!(opts && opts.ignoreCash);
        const data = this.state.data;
        const node = getNodeById(nodeId);
        if (!node) return { status: 'locked', reason: 'Node tidak ditemukan.' };

        if (data.research.completed.includes(nodeId)) {
            return { status: 'done', reason: null };
        }
        if (data.research.active.some(e => e.nodeId === nodeId)) {
            return { status: 'running', reason: null };
        }
        if (data.time.currentYear < node.minYear) {
            return { status: 'locked', reason: 'Tersedia tahun ' + node.minYear };
        }
        const missing = (node.prerequisites || []).filter(p => !data.research.completed.includes(p));
        if (missing.length) {
            const names = missing.map(m => (getNodeById(m) || {}).name || m);
            return { status: 'locked', reason: 'Butuh: ' + names.join(', ') };
        }
        if (data.research.active.length >= data.research.maxSlots) {
            return { status: 'locked', reason: 'Slot riset penuh (' + data.research.active.length + '/' + data.research.maxSlots + ')' };
        }
        if (!ignoreCash && data.cash < node.cost) {
            return { status: 'locked', reason: 'Uang tidak cukup ($' + node.cost.toLocaleString('en-US') + ')' };
        }
        return { status: 'available', reason: null };
    }

    // Kembalikan { ok: boolean, reason?: string }.
    startResearch(nodeId, opts) {
        const paidWithSilicon = !!(opts && opts.paidWithSilicon);
        const data = this.state.data;
        const node = getNodeById(nodeId);
        if (!node) return { ok: false, reason: 'Node tidak ditemukan.' };

        const st = this.getNodeStatus(nodeId, { ignoreCash: paidWithSilicon });
        if (st.status !== 'available') {
            return { ok: false, reason: st.reason || 'Belum bisa dimulai.' };
        }

        if (!paidWithSilicon) this.state.setCash(data.cash - node.cost);

        // Daftarkan sebagai aktif
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
        // Untuk tutorial (jika ada langkah "mulai riset")
        bus.emit('tutorial:action', { id: 'action:research-started' });
        bus.emit('state:changed', data);

        return { ok: true };
    }

    // Batalkan riset, refund sebagian (lihat balance.research.refundPercent).
    cancelResearch(nodeId) {
        const data = this.state.data;
        const idx = data.research.active.findIndex(e => e.nodeId === nodeId);
        if (idx < 0) return { ok: false, reason: 'Riset tidak aktif.' };

        const node = getNodeById(nodeId);
        data.research.active.splice(idx, 1);

        const refund = node
            ? Math.floor(node.cost * (BALANCE.research.refundPercent || 0))
            : 0;
        if (refund > 0) this.state.addCash(refund);

        this.state.addLog(
            'Riset dibatalkan: ' + (node ? node.name : nodeId) + ' (refund $' + refund.toLocaleString('en-US') + ').',
            LOG_TYPES.warning
        );
        bus.emit('research:cancelled', { nodeId, refund });
        bus.emit('state:changed', data);
        return { ok: true, refund };
    }

    // [SIL] Majukan progress riset aktif sebanyak `days` hari-progress
    // (Infinity = selesaikan sekarang). Selesai lewat jalur normal sehingga
    // toast, log, milestone & event tetap jalan.
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

    // Ringkasan untuk UI ProgressPanel (Dashboard).
    getProgress() {
        const data = this.state.data;
        const speed = this._getSpeedMultiplier();
        return data.research.active.map(e => {
            const percent = e.durationDays > 0
                ? Math.min(1, e.progressDays / e.durationDays)
                : 0;
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

    // Cek apakah sebuah komponen (untuk Batch B) sudah terbuka.
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

    // Apakah fitur OS (untuk OSSystem) sudah terbuka via riset.
    isOsFeatureUnlocked(featureId) {
        // Cek node riset yang meng-unlock fitur OS ini.
        // Dilakukan oleh OSSystem juga, tapi helper ini berguna.
        const data = this.state.data;
        for (const nodeId of data.research.completed) {
            const node = getNodeById(nodeId);
            if (node && node.effects && Array.isArray(node.effects.unlocksOsFeatures)) {
                if (node.effects.unlocksOsFeatures.includes(featureId)) return true;
            }
        }
        // Fitur OS tanpa requiresResearch otomatis terbuka
        return false;
    }

    // Daftar node berdasarkan kategori (untuk UI).
    getNodesByCategory(categoryId) {
        return RESEARCH_NODES.filter(n => n.category === categoryId);
    }

    // Kategori untuk filter chip di UI.
    getCategories() {
        return RESEARCH_CATEGORIES;
    }

    // ============================================================
    // CHEAT (untuk testing console)
    // ============================================================
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

        // Jika sedang aktif, hapus dari daftar aktif
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
