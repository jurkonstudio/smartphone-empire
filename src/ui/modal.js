// FILE: src/ui/modal.js
// v2027.38a — fix: hapus node lama se-id sebelum buat baru.
// Bug sebelumnya: node lama masih di DOM 220ms (fade-out), jadi
// querySelector('[data-modal-id=...]') mengembalikan node lama saat
// modal di-render ulang dengan id yang sama (mis. ganti tab auth).
// [a11y] Esc menutup modal dismissible, focus trap (Tab/Shift+Tab),
// fokus kembali ke pemicu saat tutup, aria-labelledby, aria-label tombol
// tutup, dan kunci scroll body (class "modal-open").
// Signature Modal.open/close dan event ui:modal-open/close tidak berubah.
import { bus } from '../core/EventBus.js';
import { t } from '../core/LanguageService.js';

let _root = null;
let _keyBound = false;
const _openStack = [];

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';
const TEXT_INPUT = /^(text|email|password|number|search|tel|url)$/i;

function ensureRoot() {
    if (_root) return _root;
    _root = document.createElement('div');
    _root.id = 'modal-root';
    _root.className = 'modal-root';
    document.body.appendChild(_root);
    return _root;
}

function _tf(key, fb) {
    try { const v = t(key); return (v && v !== key) ? v : fb; } catch (e) { return fb; }
}

function _focusables(card) {
    const list = card.querySelectorAll(FOCUSABLE);
    const out = [];
    for (let i = 0; i < list.length; i++) {
        const el = list[i];
        if (el.disabled) continue;
        if (el.getAttribute('tabindex') === '-1') continue;
        if (el.type === 'hidden') continue;
        if (el.getClientRects && el.getClientRects().length === 0) continue;
        out.push(el);
    }
    return out;
}

function _isTextField(el) {
    const tag = (el.tagName || '').toLowerCase();
    return tag === 'textarea' || (tag === 'input' && TEXT_INPUT.test(el.type || 'text'));
}

function _focus(el) {
    try { el.focus({ preventScroll: true }); } catch (e) { /* abaikan */ }
}

function _lockScroll(on) {
    try { document.body.classList[on ? 'add' : 'remove']('modal-open'); } catch (e) { /* abaikan */ }
}

function _decorate(id, card) {
    // aria-labelledby dari judul pertama (jika ada)
    const title = card.querySelector('h1, h2, h3, h4, .modal-title');
    if (title && (title.textContent || '').trim()) {
        if (!title.id) title.id = 'modal-title-' + String(id).replace(/[^\w-]/g, '_');
        card.setAttribute('aria-labelledby', title.id);
    }
    // tombol tutup tanpa teks yang jelas (mis. "✕") diberi aria-label
    const btns = card.querySelectorAll('[data-modal-close]');
    for (let i = 0; i < btns.length; i++) {
        const b = btns[i];
        if (b.getAttribute('aria-label')) continue;
        if ((b.textContent || '').trim().length < 3) b.setAttribute('aria-label', _tf('common.close', 'Close'));
    }
}

function _onKeydown(e) {
    const top = _openStack[_openStack.length - 1];
    if (!top) return;
    if (e.key === 'Escape') {
        if (top.dismissible) { e.preventDefault(); Modal.close(top.id); }
        return;
    }
    if (e.key !== 'Tab') return;
    const card = top.card;
    const items = _focusables(card);
    if (!items.length) { e.preventDefault(); _focus(card); return; }
    const first = items[0], last = items[items.length - 1];
    const active = document.activeElement;
    const inside = active && (active === card || card.contains(active));
    if (!inside) { e.preventDefault(); _focus(e.shiftKey ? last : first); return; }
    if (e.shiftKey && (active === first || active === card)) { e.preventDefault(); _focus(last); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); _focus(first); }
}

function _bindKeys() {
    if (_keyBound) return;
    document.addEventListener('keydown', _onKeydown, true);
    _keyBound = true;
}

function _unbindKeys() {
    if (!_keyBound || _openStack.length) return;
    document.removeEventListener('keydown', _onKeydown, true);
    _keyBound = false;
}

export const Modal = {
    // Mengembalikan node modal (backdrop) — pakai ini untuk attach handler.
    open(id, html, { dismissible = true, onClose = null } = {}) {
        const root = ensureRoot();
        // Tutup modal yang sedang terbuka (single-modal policy)
        if (_openStack.length) this.close(_openStack[_openStack.length - 1].id, true);

        // [v2027.38a] Hapus sisa node lama dengan id sama (yang sedang fade-out).
        var leftovers = root.querySelectorAll('[data-modal-id="' + id + '"]');
        for (var i = 0; i < leftovers.length; i++) leftovers[i].remove();

        // [a11y] Simpan elemen pemicu (setelah modal sebelumnya menutup & mengembalikan fokus).
        let trigger = document.activeElement || null;
        if (trigger === document.body || (root.contains && root.contains(trigger))) trigger = null;

        const node = document.createElement('div');
        node.className = 'modal-backdrop';
        node.dataset.modalId = id;
        node.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true">${html}</div>`;
        root.appendChild(node);

        const card = node.querySelector('.modal-card');
        _decorate(id, card);

        const closeBtn = node.querySelector('[data-modal-close]');
        if (closeBtn) closeBtn.addEventListener('click', () => this.close(id));

        if (dismissible) {
            node.addEventListener('click', (e) => {
                if (e.target === node) this.close(id);
            });
        }

        _openStack.push({ id, node, card, onClose, dismissible, trigger });
        _lockScroll(true);
        _bindKeys();

        // [a11y] Fokus awal: elemen fokusable pertama (bukan kolom teks, agar keyboard HP
        // tidak langsung muncul); jika tidak ada, kartu itu sendiri.
        const items = _focusables(card);
        if (items.length && !_isTextField(items[0])) _focus(items[0]);
        else { card.setAttribute('tabindex', '-1'); _focus(card); }

        requestAnimationFrame(() => node.classList.add('visible'));
        bus.emit('ui:modal-open', { id });
        return node;
    },

    close(id, silent = false) {
        const idx = _openStack.findIndex(m => m.id === id);
        if (idx < 0) return;
        const { node, onClose, trigger } = _openStack[idx];
        _openStack.splice(idx, 1);
        node.classList.remove('visible');
        setTimeout(() => node.remove(), 220);
        if (!_openStack.length) _lockScroll(false);
        _unbindKeys();
        // [a11y] Kembalikan fokus ke pemicu bila masih ada di halaman.
        if (trigger && trigger.isConnected !== false && typeof trigger.focus === 'function') _focus(trigger);
        if (!silent && typeof onClose === 'function') {
            try { onClose(); } catch (e) { console.error(e); }
        }
        bus.emit('ui:modal-close', { id });
    },

    closeAll() {
        while (_openStack.length) this.close(_openStack[_openStack.length - 1].id, true);
    },

    isOpen(id) { return _openStack.some(m => m.id === id); },

    // [era-event] Ada modal apa pun yang sedang terbuka? (event tak boleh menimpanya)
    hasOpen() { return _openStack.length > 0; }
};
