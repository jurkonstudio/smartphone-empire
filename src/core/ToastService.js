// FILE: src/core/ToastService.js
// ============================================================
// ToastService — antrian notifikasi dengan proteksi anti-double.
// Setiap panggilan show() dideduplikasi dalam window DEDUPE_MS
// agar pesan identik tidak muncul 2x berturut-turut.
// ============================================================
import { bus } from './EventBus.js';

const DEDUPE_MS = 800;
let _nextId = 1;
let _lastKey = null;
let _lastTime = 0;

function _isDuplicate(message, type) {
    const key = type + '::' + message;
    const now = Date.now();
    if (key === _lastKey && (now - _lastTime) < DEDUPE_MS) {
        return true;
    }
    _lastKey = key;
    _lastTime = now;
    return false;
}

export const ToastService = {
    show(message, type = 'info', durationMs = 2800) {
        if (!message) return 0;
        if (_isDuplicate(message, type)) return 0;
        const id = _nextId++;
        bus.emit('toast:show', { id, message, type, durationMs });
        return id;
    },
    success(msg, ms) { return this.show(msg, 'success', ms); },
    error(msg, ms)   { return this.show(msg, 'error', ms); },
    warning(msg, ms) { return this.show(msg, 'warning', ms); },
    info(msg, ms)    { return this.show(msg, 'info', ms); }
};
