// FILE: src/core/ToastService.js
import { bus } from './EventBus.js';

// Service ringan untuk notifikasi. UI ToastContainer mendengarkan bus.
// Pengguna: import { ToastService } from './core/ToastService.js';
let _nextId = 1;

export const ToastService = {
    show(message, type = 'info', durationMs = 2800) {
        const id = _nextId++;
        bus.emit('toast:show', { id, message, type, durationMs });
        return id;
    },
    success(msg, ms) { return this.show(msg, 'success', ms); },
    error(msg, ms)   { return this.show(msg, 'error', ms); },
    warning(msg, ms) { return this.show(msg, 'warning', ms); },
    info(msg, ms)    { return this.show(msg, 'info', ms); }
};
