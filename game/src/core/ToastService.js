// FILE: src/core/ToastService.js
// ============================================================
// ToastService — dengan proteksi anti-double + dukungan action button.
// ============================================================
import { bus } from './EventBus.js';
import { NotificationPrefs } from './NotificationPrefs.js';

var DEDUPE_MS = 800;
var _nextId = 1;
var _lastKey = null;
var _lastTime = 0;

function _isDuplicate(message, type) {
    var key = type + '::' + message;
    var now = Date.now();
    if (key === _lastKey && (now - _lastTime) < DEDUPE_MS) {
        return true;
    }
    _lastKey = key;
    _lastTime = now;
    return false;
}

export var ToastService = {
    /**
     * show(message, type, durationMs, options)
     * options: { action: { label: 'Baca', onClick: function }, force: boolean }
     */
    show: function (message, type, durationMs, options) {
        if (!message) return 0;
        // Pengaturan notifikasi: default MATI. Gerbang tunggal untuk semua toast.
        // options.force = true: pesan sistem penting (mis. versi baru) melewati saklar notifikasi.
        if (!(options && options.force) && !NotificationPrefs.isTypeEnabled(type || 'info')) return 0;
        if (_isDuplicate(message, type || 'info')) return 0;
        var id = _nextId++;
        var payload = {
            id: id,
            message: message,
            type: type || 'info',
            durationMs: durationMs || 2800,
            action: (options && options.action) ? options.action : null
        };
        bus.emit('toast:show', payload);
        return id;
    },
    success: function (msg, ms, options) { return this.show(msg, 'success', ms, options); },
    error:   function (msg, ms, options) { return this.show(msg, 'error',   ms, options); },
    warning: function (msg, ms, options) { return this.show(msg, 'warning', ms, options); },
    info:    function (msg, ms, options) { return this.show(msg, 'info',    ms, options); }
};
