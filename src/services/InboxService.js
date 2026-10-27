// FILE: src/services/InboxService.js  (BARU)
// ============================================================
// InboxService — pesan masuk pemain: notifikasi SIL terisi + pesan dari admin.
// Sumber: tabel server `inbox_messages` (supabase/09-pesan-inbox.sql).
// Pesan baru diterima via Realtime (+ polling cadangan 5 menit, hanya mengambil pesan yang lebih baru), lalu tampil sebagai toast
// (melewati saklar notifikasi pemain, karena ini info penting) dan masuk Inbox.
// Event bus: 'inbox:changed' {unread,total}, 'inbox:open' (minta buka panel).
// ============================================================
import { bus } from '../core/EventBus.js';
import { CloudService } from './CloudService.js';
import { SupabaseAdapter } from './cloud/SupabaseAdapter.js';
import { state } from '../core/GameState.js';
import { formatCurrency } from '../utils/format.js';

var POLL_MS = 300000;      // cadangan saja; pesan utama datang lewat Realtime
var LIMIT = 60;

var _items = [];
var _unsub = null;
var _timer = null;
var _running = false;
var _credited = {};   // id hadiah yang sudah dikreditkan ke kas di sesi ini
var _hello = false;      // ringkasan "pesan belum dibaca" cukup sekali per sesi

// Pesan lokal (survei Kontrol Pengguna): disimpan di save game (data.userControl.surveys), id negatif, tanpa server.
function _localList() {
    try {
        var uc = state.get().userControl;
        return (uc && Array.isArray(uc.surveys)) ? uc.surveys : [];
    } catch (e) { return []; }
}

function _unread() {
    var n = 0;
    for (var i = 0; i < _items.length; i++) if (!_items[i].read_at) n++;
    var loc = _localList();
    for (var j = 0; j < loc.length; j++) if (!loc[j].read_at) n++;
    return n;
}

function _changed() {
    try { bus.emit('inbox:changed', { unread: _unread(), total: _items.length }); } catch (e) {}
    if (typeof document === 'undefined') return;
    var u = _unread(), badges = document.querySelectorAll('[data-inbox-badge]');
    for (var i = 0; i < badges.length; i++) {
        if (u > 0) { badges[i].textContent = u > 99 ? '99+' : String(u); badges[i].hidden = false; }
        else { badges[i].textContent = ''; badges[i].hidden = true; }
    }
}

function _has(id) {
    for (var i = 0; i < _items.length; i++) if (_items[i].id === id) return true;
    return false;
}

function _toast(m) {
    var type = (m.kind === 'sil' || m.kind === 'reward') ? 'success' : (m.kind === 'system' ? 'warning' : 'info');
    var text = String(m.title || '') + (m.body ? ' — ' + m.body : '');
    // Langsung ke bus: pesan admin & SIL masuk tidak boleh tersembunyi oleh saklar notifikasi.
    bus.emit('toast:show', {
        id: 'inbox-' + m.id, message: text, type: type, durationMs: 6000,
        action: { label: 'Buka', onClick: function () { bus.emit('inbox:open', {}); } }
    });
}

function _incoming(m, quiet) {
    if (!m || m.id == null || _has(m.id)) return false;
    _items.unshift(m);
    _items.sort(function (a, b) { return b.id - a.id; });
    if (_items.length > 100) _items.length = 100;
    if (!quiet && !m.read_at) _toast(m);
    return true;
}

async function _load(first) {
    var rows;
    var since = (!first && _items.length) ? _items[0].id : null;   // _items terurut menurun
    try { rows = await SupabaseAdapter.inboxList(LIMIT, since); }
    catch (e) { return false; }                      // tabel belum dibuat / offline: diam saja
    var fresh = [];
    for (var i = 0; i < rows.length; i++) {
        if (!_has(rows[i].id)) fresh.push(rows[i]);
    }
    if (first) {
        _items = rows.slice();
        var un = _unread();
        if (un > 0 && !_hello) {
            _hello = true;
            bus.emit('toast:show', {
                id: 'inbox-hello', type: 'info', durationMs: 5000,
                message: 'Kamu punya ' + un + ' pesan belum dibaca.',
                action: { label: 'Buka', onClick: function () { bus.emit('inbox:open', {}); } }
            });
        }
    } else {
        for (var j = fresh.length - 1; j >= 0; j--) _incoming(fresh[j], false);
    }
    _changed();
    return true;
}

function _stop() {
    _running = false;
    if (_unsub) { try { _unsub(); } catch (e) {} _unsub = null; }
    if (_timer) { clearInterval(_timer); _timer = null; }
    _items = [];
    _changed();
}

async function _start() {
    if (_running) return;
    if (CloudService.getStatus() !== 'connected' || !CloudService.getUserId()) return;
    _running = true;
    await _load(true);
    try {
        _unsub = await SupabaseAdapter.subscribeInbox(CloudService.getUserId(), function (row) {
            if (_incoming(row, false)) _changed();
        });
    } catch (e) { _unsub = null; }
    _timer = setInterval(function () { if (!document.hidden) _load(false); }, POLL_MS);
}

var REASONS = {
    rate_limited: 'Terlalu banyak pesan. Tunggu sebentar lalu coba lagi.',
    invalid_body: 'Pesan harus 1–500 karakter.',
    receiver_not_found: 'ID pemain tidak ditemukan.',
    cannot_message_self: 'Tidak bisa mengirim pesan ke diri sendiri.',
    no_profile: 'Profil kamu belum siap. Coba lagi nanti.',
    message_not_found: 'Pesan tidak ditemukan.'
};
function _reason(e) {
    var m = String((e && (e.message || (e.raw && e.raw.message))) || '');
    for (var k in REASONS) if (m.indexOf(k) >= 0) return REASONS[k];
    if (e && (e.code === 'network')) return 'Tidak ada koneksi. Coba lagi.';
    return 'Fitur pesan antar pemain belum aktif di server.';
}

export var InboxService = {
    init: function () {
        bus.on('cloud:status-changed', function (e) {
            if (e && e.status === 'connected') _start();
            else if (e && e.status === 'disconnected') _stop();
        });
        document.addEventListener('visibilitychange', function () { if (!document.hidden && _running) _load(false); });
        _start();
    },
    getItems: function () {
        var loc = _localList();
        if (!loc.length) return _items.slice();
        return _items.concat(loc).sort(function (a, b) { return String(b.created_at || '').localeCompare(String(a.created_at || '')); });
    },
    // Tambah pesan lokal (tanpa server). m = { kind, title, body }.
    addLocal: function (m) {
        var uc;
        try { uc = state.get().userControl; } catch (e) { return false; }
        if (!uc || typeof uc !== 'object') return false;
        if (!Array.isArray(uc.surveys)) uc.surveys = [];
        var maxN = 0;
        for (var i = 0; i < uc.surveys.length; i++) maxN = Math.max(maxN, -uc.surveys[i].id || 0);
        var item = { id: -(maxN + 1), kind: m.kind || 'system', title: m.title || '', body: m.body || '', created_at: new Date().toISOString(), read_at: null, local: true };
        uc.surveys.unshift(item);
        if (uc.surveys.length > 12) uc.surveys.length = 12;
        _toast(item);
        _changed();
        return true;
    },
    getUnread: function () { return _unread(); },
    refresh: function () { return _running ? _load(false) : Promise.resolve(false); },

    markRead: function (ids) {
        var set = {}, any = false, now = new Date().toISOString();
        for (var i = 0; i < ids.length; i++) set[ids[i]] = 1;
        for (var j = 0; j < _items.length; j++) {
            if (set[_items[j].id] && !_items[j].read_at) { _items[j].read_at = now; any = true; }
        }
        var loc = _localList(), anyLocal = false;
        for (var q = 0; q < loc.length; q++) {
            if (set[loc[q].id] && !loc[q].read_at) { loc[q].read_at = now; any = true; anyLocal = true; }
        }
        if (!any) return;
        _changed();
        var cloudIds = ids.filter(function (x) { return x > 0; });
        if (cloudIds.length) SupabaseAdapter.inboxMarkRead(cloudIds).catch(function () {});
    },
    markAllRead: function () {
        var now = new Date().toISOString(), any = false;
        for (var i = 0; i < _items.length; i++) if (!_items[i].read_at) { _items[i].read_at = now; any = true; }
        var loc = _localList();
        for (var q = 0; q < loc.length; q++) if (!loc[q].read_at) { loc[q].read_at = now; any = true; }
        if (!any) return;
        _changed();
        if (_running) SupabaseAdapter.inboxMarkRead(null).catch(function () {});
    },
    remove: function (id) {
        if (id < 0) {
            var uc = null; try { uc = state.get().userControl; } catch (e) {}
            if (uc && Array.isArray(uc.surveys)) uc.surveys = uc.surveys.filter(function (m) { return m.id !== id; });
            _changed();
            return;
        }
        _items = _items.filter(function (m) { return m.id !== id; });
        _changed();
        SupabaseAdapter.inboxDelete([id]).catch(function () {});
    },
    // ---------- Pesan antar pemain ----------
    send: async function (publicId, body) {
        try { await SupabaseAdapter.rpcSendPlayerMessage(publicId, body); return { ok: true }; }
        catch (e) { return { ok: false, reason: _reason(e) }; }
    },
    lookup: async function (publicId) {
        try { var r = await SupabaseAdapter.rpcGetPlayerById(publicId); return r || { ok: false, error: 'player_not_found' }; }
        catch (e) { return { ok: false, error: 'network' }; }
    },
    block: async function (publicId) {
        try { await SupabaseAdapter.rpcInboxBlock(publicId); return { ok: true }; } catch (e) { return { ok: false, reason: _reason(e) }; }
    },
    unblock: async function (publicId) {
        try { await SupabaseAdapter.rpcInboxUnblock(publicId); return { ok: true }; } catch (e) { return { ok: false, reason: _reason(e) }; }
    },
    blocks: async function () {
        try { return await SupabaseAdapter.rpcInboxBlocks(); } catch (e) { return []; }
    },
    report: async function (messageId, reason) {
        try { await SupabaseAdapter.rpcInboxReport(messageId, reason); return { ok: true }; } catch (e) { return { ok: false, reason: _reason(e) }; }
    },

    // ---------- Hadiah cash (kind 'reward') ----------
    // Server membuat hadiah; klien hanya mengklaim. Token dibuat sekali per klaim dan dipakai ulang saat retry.
    claimReward: async function (id) {
        var it = null;
        for (var i = 0; i < _items.length; i++) if (_items[i].id === id) it = _items[i];
        if (!it || !it.reward_cash) return { ok: false, reason: 'Hadiah tidak ditemukan.' };
        if (it.reward_claimed_at) return { ok: false, reason: 'Hadiah ini sudah diklaim.' };
        if (it._claiming) return { ok: false, reason: 'Sedang memproses klaim…' };
        var token = 'rw_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
        it._claiming = true;
        var res = null;
        try {
            for (var k = 0; k < 3; k++) {
                try { res = await SupabaseAdapter.rpcClaimInboxReward(id, token); break; }
                catch (e) {
                    var msg = String((e && e.message) || '');
                    if (/already_claimed|reward_not_found|invalid_token/.test(msg)) throw e;
                    if (k === 2) throw e;
                    await new Promise(function (r) { setTimeout(r, 800 * (k + 1)); });
                }
            }
        } catch (e) {
            it._claiming = false;
            var m2 = String((e && e.message) || '');
            if (/already_claimed/.test(m2)) {
                it.reward_claimed_at = it.reward_claimed_at || new Date().toISOString();
                _changed();
                return { ok: false, reason: 'Hadiah ini sudah pernah diklaim.' };
            }
            return { ok: false, reason: 'Koneksi gagal. Coba klaim lagi.' };
        }
        it._claiming = false;
        var cash = Number(res && res.cash) || 0;
        if (!res || !res.ok || cash <= 0) return { ok: false, reason: 'Respons server tidak valid.' };
        it.reward_claimed_at = it.reward_claimed_at || new Date().toISOString();
        it.read_at = it.read_at || it.reward_claimed_at;
        // Kredit sekali per id di sesi ini (retry yang sama akan mengembalikan replay, tidak dikredit ulang).
        if (!_credited[id]) { _credited[id] = true; state.addCash(cash); }
        _changed();
        try { bus.emit('toast:show', { id: 'reward-' + id, type: 'success', durationMs: 4000,
            message: 'Hadiah ' + formatCurrency(cash) + ' masuk ke kas perusahaan.' }); } catch (e) {}
        return { ok: true, cash: cash };
    },

    clear: function () {
        // Hadiah yang belum diklaim tidak ikut dihapus (server juga menolaknya).
        _items = _items.filter(function (m) { return m.reward_cash && !m.reward_claimed_at; });
        try { var uc = state.get().userControl; if (uc && Array.isArray(uc.surveys)) uc.surveys = []; } catch (e) {}
        _changed();
        if (_running) SupabaseAdapter.inboxDelete(null).catch(function () {});
    }
};
