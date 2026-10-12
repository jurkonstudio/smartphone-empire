// FILE: src/ui/panels/ToastContainer.js
// Mengelola DOM toast. Mendengarkan bus event 'toast:show'.
import { bus } from '../../core/EventBus.js';

let _container = null;
let _unsubscribe = null;

export function mountToastContainer(el) {
    if (!el) return;
    _container = el;
    // Hindari listener ganda jika boot dipanggil ulang
    if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
    _unsubscribe = bus.on('toast:show', ({ message, type, durationMs }) => {
        _show(message, type, durationMs);
    });
}

function _show(message, type, durationMs) {
    if (!_container) return;
    const node = document.createElement('div');
    node.className = `toast ${type || 'info'}`;
    node.textContent = message;
    _container.appendChild(node);

    // Auto dismiss
    const t1 = setTimeout(() => {
        node.classList.add('out');
        const t2 = setTimeout(() => node.remove(), 260);
        // Fallback jika tab background
        setTimeout(() => { if (node.parentNode) node.remove(); }, 800);
    }, durationMs || 2800);
}
