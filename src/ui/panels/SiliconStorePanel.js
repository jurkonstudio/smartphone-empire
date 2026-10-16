// FILE: src/ui/panels/SiliconStorePanel.js
// Modal Top Up Silicon: paket + slot metode pembayaran + riwayat order.
import { gIcon, ensureIconStyles } from '../icons/GameIcons.js';
import { Modal } from '../modal.js';
import { t, LanguageService } from '../../core/LanguageService.js';
import { SiliconService } from '../../systems/SiliconService.js';
import { PaymentService } from '../../systems/PaymentService.js';
import { PAYMENT_GROUPS } from '../../data/silicon.data.js';
import { ToastService } from '../../core/ToastService.js';
import { bus } from '../../core/EventBus.js';

var MODAL_ID = 'silicon-store';

// Pilihan UI (tidak disimpan ke save).
var _sel = { pkg: 'pkg_l', method: null, busy: false };

function _esc(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function _tf(key, fb, vars) {
    var v = t(key, vars);
    return (v && v !== key) ? v : fb;
}

function _isId() {
    try { return LanguageService.getLang() === 'id'; } catch (e) { return true; }
}
function _price(o) {
    if (_isId()) return 'Rp' + o.priceIdr.toLocaleString('id-ID');
    return '$' + o.priceUsd.toFixed(2);
}

function _renderPackages() {
    return '<div class="sil-pkg-grid">' + PaymentService.getPackages().map(function (p) {
        var tag = p.tag ? '<span class="sil-pkg-tag sil-pkg-tag-' + p.tag + '">' + _tf('silicon.store.tag.' + p.tag, p.tag) + '</span>' : '';
        return '<button type="button" class="sil-pkg' + (_sel.pkg === p.id ? ' active' : '') + '" data-sil-pkg="' + p.id + '">' +
            tag +
            '<span class="sil-pkg-ico">' + gIcon(p.icon, 20) + '</span>' +
            '<span class="sil-pkg-amt">' + p.sil + '</span>' +
            '<span class="sil-pkg-bonus">' + (p.bonus ? '+' + p.bonus + ' ' + _tf('silicon.store.bonus', 'bonus') : '&nbsp;') + '</span>' +
            '<span class="sil-pkg-price">' + _price(p) + '</span>' +
        '</button>';
    }).join('') + '</div>';
}

function _renderMethods(methods) {
    var html = '';
    PAYMENT_GROUPS.forEach(function (g) {
        var items = methods.filter(function (m) { return m.group === g; });
        if (!items.length) return;
        html += '<div class="sil-method-group">' + _tf('silicon.store.group.' + g, g) + '</div>';
        html += items.map(function (m) {
            var avail = m.status === 'available';
            var badge = avail
                ? '<span class="sil-badge sil-badge-on">' + _tf('silicon.store.available', 'Aktif') + '</span>'
                : '<span class="sil-badge">' + _tf('silicon.store.soon', 'Segera') + '</span>';
            return '<button type="button" class="sil-method' + (_sel.method === m.id ? ' active' : '') + (avail ? '' : ' is-soon') + '" ' +
                'data-sil-method="' + m.id + '"' + (avail ? '' : ' disabled') + '>' +
                '<span class="sil-method-ico">' + gIcon(m.icon || 'wallet', 18) + '</span>' +
                '<span class="sil-method-name">' + _esc(m.name) + '</span>' +
                badge +
                '<span class="sil-radio"></span>' +
            '</button>';
        }).join('');
    });
    return html;
}

function _renderOrders() {
    var orders = PaymentService.getOrders().slice(0, 4);
    if (!orders.length) return '';
    var rows = orders.map(function (o) {
        var cls = o.status === 'paid' ? 'pos' : (o.status === 'pending' ? 'warn' : 'neg');
        var refresh = o.status === 'pending'
            ? ' <button type="button" class="slot-boost" data-sil-order-refresh="' + o.id + '">' + _tf('silicon.store.check', 'Cek status') + '</button>' : '';
        return '<div class="sil-hist-row">' +
            '<span class="sil-hist-reason">' + _esc(o.packageId.replace('pkg_', '').toUpperCase()) + ' · ' + o.sil + ' SIL' + refresh + '</span>' +
            '<span class="sil-hist-delta ' + cls + '">' + _tf('silicon.store.status.' + o.status, o.status) + '</span>' +
        '</div>';
    }).join('');
    return '<div class="section-label"><span class="section-label-text">' + _tf('silicon.store.orders', 'Pesanan') + '</span>' +
        '<span class="section-label-line"></span></div><div class="node-list">' + rows + '</div>';
}

function _build() {
    var methods = PaymentService.getMethods();
    var anyAvail = methods.some(function (m) { return m.status === 'available'; });

    // Pilih default: metode pertama yang aktif.
    var cur = methods.find(function (m) { return m.id === _sel.method && m.status === 'available'; });
    if (!cur) {
        var first = methods.find(function (m) { return m.status === 'available'; });
        _sel.method = first ? first.id : null;
    }

    var pkg = PaymentService.getPackage(_sel.pkg) || PaymentService.getPackages()[0];
    var canPay = !!_sel.method && !_sel.busy;

    var html =
        '<div class="modal-title g-ico-title">' + gIcon('sil', 20) + '<span>' + _tf('silicon.store.title', 'Top Up Silicon') + '</span></div>' +
        '<div class="modal-sub">' + _tf('silicon.store.sub', 'Pilih paket dan metode pembayaran.') + '</div>' +

        '<div class="sil-balance sil-balance-compact">' +
            '<div class="sil-balance-label">' + _tf('silicon.balance', 'SALDO') + '</div>' +
            '<div class="sil-balance-value">' + SiliconService.getBalance() + ' <span>SIL</span></div>' +
        '</div>' +

        '<div class="section-label"><span class="section-label-text">' + _tf('silicon.store.packages', 'Paket') + '</span>' +
            '<span class="section-label-line"></span></div>' +
        _renderPackages() +

        '<div class="section-label"><span class="section-label-text">' + _tf('silicon.store.methods', 'Metode Pembayaran') + '</span>' +
            '<span class="section-label-line"></span></div>' +
        (anyAvail ? '' : '<div class="sil-hint">' + _tf('silicon.store.none', 'Metode pembayaran belum aktif. Segera hadir.') + '</div>') +
        '<div class="sil-methods">' + _renderMethods(methods) + '</div>' +

        '<div class="sil-summary">' +
            '<div class="sum-row"><span>' + _tf('silicon.store.you_get', 'Kamu dapat') + '</span><b>' + (pkg.sil + pkg.bonus) + ' SIL</b></div>' +
            '<div class="sum-row total"><span>' + _tf('silicon.store.total', 'Total') + '</span><b>' + _price(pkg) + '</b></div>' +
        '</div>' +

        '<button type="button" class="btn-primary" data-sil-pay style="width:100%;margin-top:12px;"' + (canPay ? '' : ' disabled') + '>' +
            (_sel.busy ? _tf('silicon.store.processing', 'Memproses…') : _tf('silicon.store.pay', 'Bayar') + ' · ' + _price(pkg)) + '</button>' +

        _renderOrders() +

        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:8px;">' + _tf('common.close', 'Close') + '</button>';

    return html;
}

function _onClick(e) {
    if (e.target.closest('[data-modal-close]')) { Modal.close(MODAL_ID); return; }

    var pk = e.target.closest('[data-sil-pkg]');
    if (pk) { _sel.pkg = pk.dataset.silPkg; _render(); return; }

    var md = e.target.closest('[data-sil-method]');
    if (md && !md.disabled) { _sel.method = md.dataset.silMethod; _render(); return; }

    var rf = e.target.closest('[data-sil-order-refresh]');
    if (rf) {
        PaymentService.refresh(rf.dataset.silOrderRefresh).then(function (r) {
            if (r.ok && r.sil) ToastService.success(_tf('silicon.store.done', '+{n} SIL ditambahkan.', { n: r.sil }));
            else if (r.pending) ToastService.info(_tf('silicon.store.still_pending', 'Masih menunggu pembayaran.'));
            _render();
        });
        return;
    }

    if (e.target.closest('[data-sil-pay]')) {
        if (!_sel.method || _sel.busy) return;
        _sel.busy = true;
        _render();
        PaymentService.pay(_sel.pkg, _sel.method).then(function (r) {
            _sel.busy = false;
            if (r.ok && r.sil) {
                ToastService.success(_tf('silicon.store.done', '+{n} SIL ditambahkan.', { n: r.sil }));
            } else if (r.ok && r.pending) {
                ToastService.info(_tf('silicon.store.pending', 'Menunggu pembayaran. Cek statusnya nanti.'));
                if (r.order && r.order.redirectUrl) { try { window.open(r.order.redirectUrl, '_blank', 'noopener'); } catch (err) {} }
            } else {
                ToastService.error(r.reason || _tf('silicon.store.failed', 'Pembayaran gagal.'));
            }
            _render();
        });
    }
}

// Render ulang isi modal di tempat (tanpa animasi buka ulang).
function _render() {
    if (!Modal.isOpen(MODAL_ID)) return;
    var card = document.querySelector('[data-modal-id="' + MODAL_ID + '"] .modal-card');
    if (!card) return;
    var scroll = card.scrollTop;
    card.innerHTML = _build();
    card.scrollTop = scroll;
}

export function openSiliconStoreModal() {
    ensureIconStyles();
    Modal.open(MODAL_ID, _build());
    var root = document.querySelector('[data-modal-id="' + MODAL_ID + '"]');
    if (root) root.addEventListener('click', _onClick);
}

// Saldo berubah saat modal terbuka (mis. setelah bayar) → segarkan.
bus.on('silicon:changed', function () { _render(); });
