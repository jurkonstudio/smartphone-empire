// FILE: src/systems/PaymentService.js
// v2028.44 — [FIX] Optimistic update: Tambahkan SIL lokal seketika saat paid, cegah hilang tertimpa server.
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { isDevMode, DEV_BUILD } from '../config/dev.config.js';
import { SiliconService } from './SiliconService.js';
import { CloudService } from '../services/CloudService.js';
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

    registerProvider(provider) {
        if (!provider || !provider.id || typeof provider.checkout !== 'function') return false;
        _providers[provider.id] = provider;
        bus.emit('payment:providers-changed', { id: provider.id });
        return true;
    },
    unregisterProvider(id) { delete _providers[id]; },
    hasProvider(id) { return !!_providers[id]; },

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
            qrString: null,
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
        
        if (!provider) {
            order.status = 'failed';
            _save(order);
            return { ok: false, order: order, reason: 'Provider tidak ditemukan.' };
        }

        try {
            var res = await provider.checkout(Object.assign({}, order));
            return this._applyResult(order, res);
        } catch (err) {
            console.error('[PaymentService] checkout gagal:', err);
            order.status = 'failed';
            _save(order);
            return { ok: false, order: order, reason: err.message || 'Pembayaran gagal.' };
        }
    },

    async refresh(orderId) {
        var order = _findOrder(orderId);
        if (!order) return { ok: false, reason: 'Order tidak ditemukan.' };
        
        // JIKA SUDAH PAID DI MEMORI LOKAL, LANGSUNG KEMBALIKAN SUKSES
        if (order.status === 'paid') {
            return { ok: true, order: order, sil: order.sil };
        }
        if (order.status === 'cancelled' || order.status === 'failed') {
            return { ok: false, order: order, reason: 'Pesanan dibatalkan/gagal.' };
        }
        
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
        if (res.qrString) order.qrString = res.qrString;
        
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

    _fulfill(order) {
        if (order.status === 'paid') {
            return { ok: true, order: order, already: true, sil: order.sil }; 
        }
        order.status = 'paid';
        order.fulfilledAt = Date.now();
        
        // [AUDIT FIX] Saat terhubung cloud, SIL top-up sudah dikreditkan SERVER (admin_approve_payment) dan
        // saldo ditarik dari server. Menambah lokal lagi membuat saldo tampil ganda & sempat bisa dibelanjakan.
        // Tambah lokal HANYA bila tidak terhubung (mode dev/sandbox).
        var _online = CloudService.getStatus() === 'connected';
        if (!_online) SiliconService.add(order.sil, 'topup:' + order.packageId);

        // Tarik saldo dari server (sumber kebenaran).
        if (_online) {
            import('../services/cloud/CloudSync.js').then(function(cs) {
                var sync = cs.CloudSync && cs.CloudSync.syncSilicon;
                if (typeof sync === 'function') return sync();
            }).catch(function(e) {
                console.warn('[PaymentService] sync saldo setelah top-up gagal:', e);
            });
        }
        
        _save(order);
        bus.emit('payment:fulfilled', { orderId: order.id, sil: order.sil });
        return { ok: true, order: order, sil: order.sil };
    }
};

// ============================================================
// DAFTARKAN PROVIDER MANUAL UNTUK GOPAY & QRIS
// ============================================================
function _orderErrorMessage(res) {
    var m = String((res && (res.reason || res.code)) || '');
    if (/too_many_pending/i.test(m)) return 'Kamu masih punya 5 pesanan yang menunggu persetujuan. Tunggu diproses admin atau batalkan salah satunya.';
    if (/invalid_package/i.test(m)) return 'Paket tidak valid. Muat ulang game lalu coba lagi.';
    if (/not_authenticated|not_signed_in/i.test(m)) return 'Sesi login berakhir. Masuk lagi lalu coba lagi.';
    if (/network|failed to fetch|load failed/i.test(m) || (res && res.code === 'network')) return 'Gagal menyimpan pesanan ke server. Cek koneksi.';
    return 'Gagal menyimpan pesanan ke server' + (m ? ' (' + m + ')' : '') + '.';
}

const ManualProvider = {
    serverVerified: true,
    checkout: async function(order) {
        if (CloudService.getStatus() !== 'connected') {
            throw new Error('Masuk ke akunmu dulu agar pesanan terkirim ke admin.');
        }
        var res = await CloudService.createPaymentOrder(order.id, order.packageId, order.priceIdr, order.sil);
        if (!res || !res.ok) throw new Error(_orderErrorMessage(res));
        return { status: 'pending' };
    },
    verify: async function(order) {
        if (CloudService.getStatus() === 'connected') {
            var res = await CloudService.checkPaymentStatus(order.id);
            if (res.ok && res.data && res.data.status === 'paid') {
                return { status: 'paid' };
            }
        }
        return { status: 'pending' };
    }
};

PaymentService.registerProvider({ id: 'gopay', ...ManualProvider });
PaymentService.registerProvider({ id: 'qris', ...ManualProvider });

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
