// FILE: src/systems/PaymentService.js
// ============================================================
// PaymentService — skema pembayaran top-up Silicon.
//
// Alur:  createOrder(paket, metode) → provider.checkout(order)
//        → 'paid' | 'pending' | 'failed' | 'cancelled'
//        → jika paid: fulfill (idempoten) → SiliconService.add()
//
// Kontrak provider (didaftarkan lewat registerProvider):
//   {
//     id: 'gopay',
//     serverVerified: true,           // WAJIB true untuk produksi
//     checkout(order)  → Promise<{ status, externalId?, redirectUrl? }>
//     verify(order)    → Promise<{ status }>   // untuk order pending
//   }
//
// KEAMANAN: SIL hanya boleh dikreditkan setelah pembayaran diverifikasi
// server (webhook / RPC Supabase). Provider tanpa serverVerified hanya
// diizinkan pada DEV_BUILD (sandbox).
// ============================================================
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { isDevMode, DEV_BUILD } from '../config/dev.config.js';
import { SiliconService } from './SiliconService.js';
import {
    SILICON_PACKAGES,
    PAYMENT_METHODS,
    MAX_ORDER_HISTORY
} from '../data/silicon.data.js';

var _providers = {};

function _orders() {
    var d = state.data;
    if (!Array.isArray(d.paymentOrders)) d.paymentOrders = [];
    return d.paymentOrders;
}

function _findOrder(id) {
    return _orders().find(function (o) { return o.id === id; }) || null;
}

function _newId() {
    return 'ord_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function _save(order) {
    var list = _orders();
    if (list.indexOf(order) === -1) list.unshift(order);
    if (list.length > MAX_ORDER_HISTORY) list.length = MAX_ORDER_HISTORY;
    bus.emit('payment:changed', order);
    bus.emit('state:changed', state.data);
}

export var PaymentService = {
    getPackages() { return SILICON_PACKAGES.slice(); },
    getPackage(id) { return SILICON_PACKAGES.find(function (p) { return p.id === id; }) || null; },
    getOrders() { return _orders().slice(); },

    // ---------- Provider registry ----------
    registerProvider(provider) {
        if (!provider || !provider.id || typeof provider.checkout !== 'function') return false;
        _providers[provider.id] = provider;
        bus.emit('payment:providers-changed', { id: provider.id });
        return true;
    },
    unregisterProvider(id) { delete _providers[id]; },
    hasProvider(id) { return !!_providers[id]; },

    // Daftar slot metode bayar + status. status: 'available' | 'soon'
    getMethods() {
        var dev = isDevMode();
        return PAYMENT_METHODS
            .filter(function (m) { return !m.devOnly || dev; })
            .map(function (m) {
                var p = _providers[m.provider];
                var ok = !!p && (p.serverVerified === true || (DEV_BUILD && m.devOnly));
                return Object.assign({}, m, { status: ok ? 'available' : 'soon' });
            });
    },

    // ---------- Order ----------
    createOrder(packageId, methodId) {
        var pkg = this.getPackage(packageId);
        if (!pkg) return { ok: false, reason: 'Paket tidak ditemukan.' };
        var method = this.getMethods().find(function (m) { return m.id === methodId; });
        if (!method) return { ok: false, reason: 'Metode pembayaran tidak ditemukan.' };
        if (method.status !== 'available') return { ok: false, reason: 'Metode ini belum tersedia.' };

        var order = {
            id: _newId(),
            packageId: pkg.id,
            methodId: method.id,
            provider: method.provider,
            sil: pkg.sil + pkg.bonus,
            priceIdr: pkg.priceIdr,
            priceUsd: pkg.priceUsd,
            status: 'created',
            externalId: null,
            redirectUrl: null,
            createdAt: Date.now(),
            fulfilledAt: null
        };
        _save(order);
        return { ok: true, order: order };
    },

    async pay(packageId, methodId) {
        var created = this.createOrder(packageId, methodId);
        if (!created.ok) return created;
        var order = created.order;
        var provider = _providers[order.provider];
        try {
            var res = await provider.checkout(Object.assign({}, order));
            return this._applyResult(order, res);
        } catch (err) {
            console.error('[PaymentService] checkout gagal:', err);
            order.status = 'failed';
            _save(order);
            return { ok: false, order: order, reason: 'Pembayaran gagal. Coba lagi.' };
        }
    },

    // Cek ulang order yang masih pending (mis. setelah user kembali dari app e-wallet).
    async refresh(orderId) {
        var order = _findOrder(orderId);
        if (!order) return { ok: false, reason: 'Order tidak ditemukan.' };
        if (order.status !== 'pending') return { ok: true, order: order };
        var provider = _providers[order.provider];
        if (!provider || typeof provider.verify !== 'function') {
            return { ok: false, order: order, reason: 'Provider tidak mendukung verifikasi.' };
        }
        try {
            var res = await provider.verify(Object.assign({}, order));
            return this._applyResult(order, res);
        } catch (err) {
            return { ok: false, order: order, reason: 'Gagal memeriksa status.' };
        }
    },

    cancel(orderId) {
        var order = _findOrder(orderId);
        if (!order || (order.status !== 'pending' && order.status !== 'created')) {
            return { ok: false, reason: 'Order tidak bisa dibatalkan.' };
        }
        order.status = 'cancelled';
        _save(order);
        return { ok: true, order: order };
    },

    _applyResult(order, res) {
        res = res || {};
        if (res.externalId) order.externalId = res.externalId;
        if (res.redirectUrl) order.redirectUrl = res.redirectUrl;
        var status = res.status;
        if (status === 'paid') return this._fulfill(order);
        if (status === 'pending') {
            order.status = 'pending';
            _save(order);
            return { ok: true, order: order, pending: true };
        }
        order.status = (status === 'cancelled') ? 'cancelled' : 'failed';
        _save(order);
        return { ok: false, order: order, reason: order.status === 'cancelled' ? 'Dibatalkan.' : 'Pembayaran gagal.' };
    },

    // Idempoten: order 'paid' tidak pernah dikreditkan dua kali.
    _fulfill(order) {
        if (order.status === 'paid') return { ok: true, order: order, already: true };
        order.status = 'paid';
        order.fulfilledAt = Date.now();
        var r = SiliconService.add(order.sil, 'topup:' + order.packageId);
        _save(order);
        if (!r.ok) return { ok: false, order: order, reason: r.reason };
        bus.emit('payment:fulfilled', { orderId: order.id, sil: order.sil });
        return { ok: true, order: order, sil: order.sil };
    }
};

// ---------- Provider Sandbox (khusus dev) ----------
// Langsung 'paid' tanpa uang sungguhan. Hanya terdaftar jika DEV_BUILD.
if (DEV_BUILD) {
    PaymentService.registerProvider({
        id: 'sandbox',
        serverVerified: false,
        checkout: function () {
            return new Promise(function (resolve) {
                setTimeout(function () { resolve({ status: 'paid', externalId: 'sandbox-' + Date.now() }); }, 600);
            });
        },
        verify: function () { return Promise.resolve({ status: 'paid' }); }
    });
}
