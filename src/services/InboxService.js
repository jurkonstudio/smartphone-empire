// FILE: src/services/InboxService.js  (BARU)
// ============================================================
// InboxService — pesan masuk pemain: notifikasi SIL terisi + pesan dari admin.
// Sumber: tabel server `inbox_messages` (supabase/09-pesan-inbox.sql).
// Pesan baru diterima via Realtime (+ polling cadangan), lalu tampil sebagai toast
// (melewati saklar notifikasi pemain, karena ini info penting) dan masuk Inbox.
// Event bus: 'inbox:changed' {unread,total}, 'inbox:open' (minta buka panel).
// ============================================================
import { bus } from '../core/EventBus.js';
import { CloudService } from './CloudService.js';
import { SupabaseAdapter } from './cloud/SupabaseAdapter.js';

var POLL_MS = 90000;
var LIMIT = 60;

var _items = [];
var _unsub = null;
var _timer = null;
var _running = false;
var _hello = false;      // ringkasan "pesan belum dibaca" cukup sekali per sesi

function _unread() {
    var n = 0;
    for (var i = 0; i < _items.length; i++) if (!_items[i].read_at) n++;
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
    var type = m.kind === 'sil' ? 'success' : (m.kind === 'system' ? 'warning' : 'info');
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
    try { rows = await SupabaseAdapter.inboxList(LIMIT); }
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

export var InboxService = {
    init: function () {
        bus.on('cloud:status-changed', function (e) {
            if (e && e.status === 'connected') _start();
            else if (e && e.status === 'disconnected') _stop();
        });
        document.addEventListener('visibilitychange', function () { if (!document.hidden && _running) _load(false); });
        _start();
    },
    getItems: function () { return _items.slice(); },
    getUnread: function () { return _unread(); },
    refresh: function () { return _running ? _load(false) : Promise.resolve(false); },

    markRead: function (ids) {
        var set = {}, any = false, now = new Date().toISOString();
        for (var i = 0; i < ids.length; i++) set[ids[i]] = 1;
        for (var j = 0; j < _items.length; j++) {
            if (set[_items[j].id] && !_items[j].read_at) { _items[j].read_at = now; any = true; }
        }
        if (!any) return;
        _changed();
        SupabaseAdapter.inboxMarkRead(ids).catch(function () {});
    },
    markAllRead: function () {
        var now = new Date().toISOString(), any = false;
        for (var i = 0; i < _items.length; i++) if (!_items[i].read_at) { _items[i].read_at = now; any = true; }
        if (!any) return;
        _changed();
        SupabaseAdapter.inboxMarkRead(null).catch(function () {});
    },
    remove: function (id) {
        _items = _items.filter(function (m) { return m.id !== id; });
        _changed();
        SupabaseAdapter.inboxDelete([id]).catch(function () {});
    },
    clear: function () {
        _items = [];
        _changed();
        SupabaseAdapter.inboxDelete(null).catch(function () {});
    }
};
