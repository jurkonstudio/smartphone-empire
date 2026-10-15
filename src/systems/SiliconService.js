// FILE: src/systems/SiliconService.js
// ============================================================
// SiliconService — premium currency "Silicon" (SIL).
// v2027.2a — daily login + aksi percepat.
// ============================================================
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { ToastService } from '../core/ToastService.js';
import { LOG_TYPES } from '../config/constants.js';
import { t } from '../core/LanguageService.js';

var MAX_HISTORY = 20;

export var SILICON_ACTIONS = [
    { id: 'skip7',    cost: 10, icon: '📅', ready: true },
    { id: 'skip30',   cost: 40, icon: '🗓️', ready: true },
    { id: 'research', cost: 20, icon: '🔬', ready: true },
    { id: 'dev',      cost: 30, icon: '📱', ready: true },
    { id: 'morale',   cost: 15, icon: '😊', ready: true },
    { id: 'rep',      cost: 25, icon: '⭐', ready: true }
];

function _pushHistory(type, delta, reason) {
    var d = state.data;
    if (!Array.isArray(d.siliconHistory)) d.siliconHistory = [];
    d.siliconHistory.unshift({
        type: type,
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

    // [v2027.2a] Daily login — bonus SIL sekali per hari (real calendar day).
    claimDailyLogin() {
        var d = state.data;
        if (!d.dailyLogin || typeof d.dailyLogin !== 'object') {
            d.dailyLogin = { lastClaimDate: null, streak: 0 };
        }
        var today = new Date().toISOString().slice(0, 10);
        if (d.dailyLogin.lastClaimDate === today) {
            return { ok: false, reason: 'already_claimed' };
        }
        var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        var streak = (d.dailyLogin.lastClaimDate === yesterday) ? (d.dailyLogin.streak + 1) : 1;
        var reward = Math.min(streak, 7);
        d.dailyLogin.lastClaimDate = today;
        d.dailyLogin.streak = streak;
        this.add(reward, 'daily-login');
        return { ok: true, amount: reward, streak: streak };
    },

    runAction(actionId) {
        var def = SILICON_ACTIONS.find(function (a) { return a.id === actionId; });
        if (!def) return { ok: false, reason: 'Aksi tidak dikenal.' };
        if (!def.ready) return { ok: false, reason: 'Aksi belum tersedia.' };
        if (!this.canAfford(def.cost)) return { ok: false, reason: 'Silicon tidak cukup (' + def.cost + ' SIL).' };

        var game = window.__game;
        if (!game) return { ok: false, reason: 'Game belum siap.' };

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

        var spendRes = this.spend(def.cost, actionId);
        if (!spendRes.ok) return spendRes;

        try {
            if (actionId === 'skip7') {
                game.timeSystem.fastForwardDays(7);
                ToastService.success(t('silicon.msg.skip7') || 'Time skip +7 days.');
            } else if (actionId === 'skip30') {
                game.timeSystem.fastForwardDays(30);
                ToastService.success(t('silicon.msg.skip30') || 'Time skip +30 days.');
            } else if (actionId === 'research') {
                var nodes = (state.data.research.active || []).map(function (r) { return r.nodeId; });
                nodes.forEach(function (nodeId) {
                    if (game.research && game.research.completeResearch) game.research.completeResearch(nodeId);
                });
                ToastService.success(t('silicon.msg.research') || 'Research completed instantly.');
            } else if (actionId === 'dev') {
                var d = state.data.products.development;
                if (d) {
                    var totalMinutes = (d.totalDurationDays || 0) * 24 * 60;
                    var remaining = Math.max(0, totalMinutes);
                    game.timeSystem.fastForwardDays(Math.max(1, Math.ceil(remaining / (24 * 60))));
                }
                ToastService.success(t('silicon.msg.dev') || 'Product development accelerated.');
            } else if (actionId === 'morale') {
                (state.data.staff || []).forEach(function (s) { s.morale = 100; });
                bus.emit('state:changed', state.data);
                ToastService.success(t('silicon.msg.morale') || 'Staff morale restored.');
            } else if (actionId === 'rep') {
                state.addReputation(20);
                ToastService.success(t('silicon.msg.rep') || 'Reputation +20.');
            }
        } catch (err) {
            console.error('[SiliconService] Aksi gagal:', actionId, err);
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
