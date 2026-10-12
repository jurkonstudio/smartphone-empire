// FILE: src/ui/panels/ToastContainer.js
// ============================================================
// ToastContainer — penghubung ToastService (bus 'toast:show')
// dengan NotificationRenderer (per era).
// Dilengkapi guard anti-mount-ganda.
// ============================================================
import { bus } from '../../core/EventBus.js';
import { renderNotification } from '../notifications/NotificationRenderer.js';

let _container = null;
let _unsubscribe = null;
let _mounted = false;

export function mountToastContainer(el) {
    if (!el) return;

    // Guard: kalau sudah ter-mount dengan container yang sama, skip
    if (_mounted && _container === el && _unsubscribe) {
        console.warn('[ToastContainer] Sudah ter-mount, skip duplikasi.');
        return;
    }

    // Bersihkan listener lama sebelum pasang baru
    if (_unsubscribe) {
        _unsubscribe();
        _unsubscribe = null;
    }

    _container = el;
    _mounted = true;

    _unsubscribe = bus.on('toast:show', (payload) => {
        if (!payload || !_container) return;
        try {
            renderNotification(_container, payload);
        } catch (err) {
            console.error('[ToastContainer] render gagal:', err);
        }
    });
}

export function unmountToastContainer() {
    if (_unsubscribe) {
        _unsubscribe();
        _unsubscribe = null;
    }
    _container = null;
    _mounted = false;
}
