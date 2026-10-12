// FILE: src/ui/panels/ToastContainer.js
// ============================================================
// ToastContainer — penghubung ToastService (bus 'toast:show')
// dengan NotificationRenderer (per era).
// ============================================================
import { bus } from '../../core/EventBus.js';
import { renderNotification } from '../notifications/NotificationRenderer.js';

let _container = null;
let _unsubscribe = null;

export function mountToastContainer(el) {
    if (!el) return;
    _container = el;

    // Hindari listener ganda jika boot dipanggil ulang
    if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }

    _unsubscribe = bus.on('toast:show', (payload) => {
        if (!payload) return;
        try {
            renderNotification(_container, payload);
        } catch (err) {
            console.error('[ToastContainer] render gagal:', err);
        }
    });
}

export function unmountToastContainer() {
    if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
    _container = null;
}
