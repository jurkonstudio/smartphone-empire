// FILE: src/ui/modal.js
// Helper sederhana untuk membuka/menutup modal overlay.
// Setiap modal punya id unik; hanya satu yang tampil pada satu waktu.
import { bus } from '../core/EventBus.js';

let _root = null;
const _openStack = [];

function ensureRoot() {
    if (_root) return _root;
    _root = document.createElement('div');
    _root.id = 'modal-root';
    _root.className = 'modal-root';
    document.body.appendChild(_root);
    return _root;
}

export const Modal = {
    open(id, html, { dismissible = true, onClose = null } = {}) {
        const root = ensureRoot();
        // Tutup modal yang sedang terbuka (single-modal policy)
        if (_openStack.length) this.close(_openStack[_openStack.length - 1].id, true);

        const node = document.createElement('div');
        node.className = 'modal-backdrop';
        node.dataset.modalId = id;
        node.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true">${html}</div>`;
        root.appendChild(node);

        // Event delegation untuk tombol close
        const closeBtn = node.querySelector('[data-modal-close]');
        if (closeBtn) closeBtn.addEventListener('click', () => this.close(id));

        if (dismissible) {
            node.addEventListener('click', (e) => {
                if (e.target === node) this.close(id);
            });
        }

        _openStack.push({ id, node, onClose });
        requestAnimationFrame(() => node.classList.add('visible'));
        bus.emit('ui:modal-open', { id });
    },

    close(id, silent = false) {
        const idx = _openStack.findIndex(m => m.id === id);
        if (idx < 0) return;
        const { node, onClose } = _openStack[idx];
        _openStack.splice(idx, 1);
        node.classList.remove('visible');
        setTimeout(() => node.remove(), 220);
        if (!silent && typeof onClose === 'function') {
            try { onClose(); } catch (e) { console.error(e); }
        }
        bus.emit('ui:modal-close', { id });
    },

    closeAll() {
        while (_openStack.length) this.close(_openStack[_openStack.length - 1].id, true);
    },

    isOpen(id) { return _openStack.some(m => m.id === id); }
};
