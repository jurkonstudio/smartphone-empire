// FILE: src/systems/SiliconService.js
// ============================================================
// SiliconService — premium currency "Silicon" (SIL).
// v2027.1a
//
// Fungsi:
//   - Kelola saldo SIL (tambah, kurangi).
//   - Aksi pembelian: time skip, instant research, dsb.
//   - Riwayat transaksi (maks 20).
//
// Aksi dibatasi lewat whitelist ACTIONS — tidak bisa dipanggil
// dari console sembarangan tanpa argumen valid.
// ============================================================
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { ToastService } from '../core/ToastService.js';
import { LOG_TYPES } from '../config/constants.js';
import { t } from '../core/LanguageService.js';

var MAX_HISTORY = 20;

// ---------- Katalog aksi ----------
// id, cost SIL, handler.
export var SILICON_ACTIONS = [
    { id: 'skip7',   cost: 10, icon: '📅', ready: true },
    { id: 'skip30',  cost: 40, icon: '🗓️', ready: true },
    { id: 'research', cost: 20, icon: '🔬', ready: true },
    { id: 'dev',     cost: 30, icon: '📱', ready: true },
    { id: 'morale',  cost: 15, icon: '😊', ready: true },
    { id: 'rep',     cost: 25, icon: '⭐', ready: true }
];

function _pushHistory(type, delta, reason) {
    var d = state.data;
    if (!Array.isArray(d.siliconHistory)) d.siliconHistory = [];
    d.siliconHistory.unshift({
        type: type,             // 'earn' | 'spend'
        delta: delta,
        reason: reason,
        balanceAfter: d.silicon,
        at: Date.now(),
        year: d.time.currentYear,
        month: d.time.currentMonth,
        day: d.time.currentDay
    });
    if (d.siliconHistory.length > MAX_HISTORY) d.siliconHistory.length = MAX_HISTORY;
}

export var SiliconService = {
    getBalance() {
        return state.data.silicon || 0;
    },

    canAfford(cost) {
        return (state.data.silicon || 0) >= cost;
    },

    add(amount, reason) {
        amount = Math.floor(amount);
        if (!amount || amount <= 0) return { ok: false, reason: 'Jumlah tidak valid.' };
        state.data.silicon = (state.data.silicon || 0) + amount;
        _pushHistory('earn', amount, reason || 'reward');
        bus.emit('silicon:changed', { balance: state.data.silicon, delta: amount });
        bus.emit('state:changed', state.data);
        return { ok: true, balance: state.data.silicon };
    },

    spend(amount, reason) {
        amount = Math.floor(amount);
        if (!amount || amount <= 0) return { ok: false, reason: 'Jumlah tidak valid.' };
        if (!this.canAfford(amount)) return { ok: false, reason: 'Silicon tidak cukup.' };
        state.data.silicon = (state.data.silicon || 0) - amount;
        _pushHistory('spend', -amount, reason || 'spend');
        bus.emit('silicon:changed', { balance: state.data.silicon, delta: -amount });
        bus.emit('state:changed', state.data);
        return { ok: true, balance: state.data.silicon };
    },

    getHistory() {
        return (state.data.siliconHistory || []).slice();
    },

    // ---------- Aksi ----------
    // Dipanggil dari UI. Mengembalikan { ok, reason?, spent? }.
    runAction(actionId) {
        var def = SILICON_ACTIONS.find(function (a) { return a.id === actionId; });
        if (!def) return { ok: false, reason: 'Aksi tidak dikenal.' };
        if (!def.ready) return { ok: false, reason: 'Aksi belum tersedia.' };
        if (!this.canAfford(def.cost)) return { ok: false, reason: 'Silicon tidak cukup (' + def.cost + ' SIL).' };

        var game = window.__game;
        if (!game) return { ok: false, reason: 'Game belum siap.' };

        // ---- Validasi aksi spesifik SEBELUM charge ----
        if (actionId === 'research') {
            var activeR = (state.data.research.active || []);
            if (!activeR.length) return { ok: false, reason: 'Tidak ada riset berjalan.' };
        }
        if (actionId === 'dev') {
            if (!state.data.products.development) return { ok: false, reason: 'Tidak ada produk sedang dikembangkan.' };
        }
        if (actionId === 'morale') {
            var staff = state.data.staff || [];
            if (!staff.length) return { ok: false, reason: 'Belum ada staff.' };
            var need = staff.some(function (s) { return (s.morale || 0) < 100; });
            if (!need) return { ok: false, reason: 'Semua staff sudah morale penuh.' };
        }
        if (actionId === 'rep') {
            var rep = state.data.market.reputation || 0;
            if (rep >= 100) return { ok: false, reason: 'Reputasi sudah maksimal.' };
        }

        // ---- Charge SIL ----
        var spendRes = this.spend(def.cost, actionId);
        if (!spendRes.ok) return spendRes;

        // ---- Jalankan aksi ----
        try {
            if (actionId === 'skip7') {
                game.timeSystem.fastForwardDays(7);
                ToastService.success(t('silicon.msg.skip7', { n: 7 }) || ('Time skip +7 hari.'));
            } else if (actionId === 'skip30') {
                game.timeSystem.fastForwardDays(30);
                ToastService.success(t('silicon.msg.skip30', { n: 30 }) || ('Time skip +30 hari.'));
            } else if (actionId === 'research') {
                var nodes = (state.data.research.active || []).map(function (r) { return r.nodeId; });
                nodes.forEach(function (nodeId) {
                    if (game.research && game.research.completeResearch) game.research.completeResearch(nodeId);
                });
                ToastService.success(t('silicon.msg.research') || 'Riset diselesaikan seketika.');
            } else if (actionId === 'dev') {
                var d = state.data.products.development;
                if (d) {
                    var totalMinutes = (d.totalDurationDays || 0) * 24 * 60;
                    var remaining = Math.max(0, totalMinutes);
                    game.timeSystem.fastForwardDays(Math.max(1, Math.ceil(remaining / (24 * 60))));
                }
                ToastService.success(t('silicon.msg.dev') || 'Pengembangan produk dipercepat.');
            } else if (actionId === 'morale') {
                (state.data.staff || []).forEach(function (s) { s.morale = 100; });
                bus.emit('state:changed', state.data);
                ToastService.success(t('silicon.msg.morale') || 'Morale semua staff dipulihkan.');
            } else if (actionId === 'rep') {
                state.addReputation(20);
                ToastService.success(t('silicon.msg.rep') || 'Reputasi +20.');
            }
        } catch (err) {
            console.error('[SiliconService] Aksi gagal:', actionId, err);
            // Refund SIL kalau aksi gagal.
            state.data.silicon = (state.data.silicon || 0) + def.cost;
            _pushHistory('earn', def.cost, 'refund:' + actionId);
            bus.emit('silicon:changed', { balance: state.data.silicon, delta: def.cost });
            bus.emit('state:changed', state.data);
            return { ok: false, reason: 'Aksi gagal, Silicon dikembalikan.' };
        }

        bus.emit('silicon:action-done', { id: actionId, cost: def.cost });
        return { ok: true, spent: def.cost };
    }
};
