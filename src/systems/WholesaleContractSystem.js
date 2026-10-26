// FILE: src/systems/WholesaleContractSystem.js  (BARU — Kontrak grosir produk jadi)
// ============================================================
// Alur:
//   1. Tiap bulan, produk yang selling dan punya stok bisa menerima tawaran grosir dari
//      merek kompetitor (peluang dipengaruhi kualitas efektif produk).
//   2. Pemain menerima -> unit langsung dipesan dari stok (stok berkurang) dan kontrak
//      masuk status "shipping".
//   3. Setelah jeda pengiriman, pembayaran masuk ke kas. Kontrak juga dibatalkan bila
//      produk dihentikan (stok dikembalikan).
// Tidak mengubah pangsa pasar, reputasi, atau data penjualan ritel (totalSold/totalRevenue).
// Event: wholesale:offer-new, wholesale:accepted, wholesale:delivered, wholesale:cancelled.
// ============================================================
import { bus } from '../core/EventBus.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { LOG_TYPES } from '../config/constants.js';
import { COMPETITORS } from '../data/competitors.data.js';
import { WHOLESALE } from '../data/wholesale.data.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;

function _clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function _rand(a, b) { return a + Math.random() * (b - a); }
function _money(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }

export function emptyWholesale() {
    return { offers: [], contracts: [], nextId: 1, revenueTotal: 0, delivered: 0, history: [] };
}

export class WholesaleContractSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
        this._competitorActions = null;
    }

    // Dipasang dari main.js. Tanpa ini, penjualan tetap jalan tanpa dorongan ke pembeli.
    setCompetitorActions(ca) { this._competitorActions = ca || null; }

    start() {
        this._unsubs.push(bus.on('time:month-changed', (s) => this._onMonth(s)));
        this._unsubs.push(bus.on('time:day-changed', () => this._tickDaily()));
        this._unsubs.push(bus.on('state:hydrated', () => this._raw()));
        this._raw();
        console.info('[WholesaleContractSystem] siap.');
    }
    stop() { this._unsubs.forEach(u => u()); this._unsubs = []; }

    // Save lama tanpa field grosir -> default aman.
    _raw() {
        const data = this.state.data;
        const base = emptyWholesale();
        if (!data.wholesale || typeof data.wholesale !== 'object') data.wholesale = base;
        const w = data.wholesale;
        Object.keys(base).forEach(k => { if (w[k] === undefined) w[k] = base[k]; });
        if (!Array.isArray(w.offers)) w.offers = [];
        if (!Array.isArray(w.contracts)) w.contracts = [];
        if (!Array.isArray(w.history)) w.history = [];
        return w;
    }

    _now() { return this.state.data.time.elapsedGameMinutes || 0; }
    _products() { return (this.state.data.products && this.state.data.products.catalog) || []; }

    // Kualitas efektif = skor desain + bonus batch (sama dengan ProductSystem._effectiveQuality).
    _quality(p) {
        var base = (p.stats && p.stats.qualityScore) || 0;
        var bq = (typeof p.batchQuality === 'number') ? p.batchQuality : 0;
        return _clamp(base + _clamp(bq, -6, 10), 0, 100);
    }

    _buyers() { return COMPETITORS.filter(c => c && !c.isEcosystem); }

    // ------------------------------------------------------------
    // TAWARAN BULANAN
    // ------------------------------------------------------------
    _onMonth() {
        const w = this._raw();
        this._expireOffers();
        const q = this._products();
        for (let i = 0; i < q.length; i++) {
            if (w.offers.length >= WHOLESALE.maxOpenOffers) break;
            const p = q[i];
            if (p.status !== 'selling' || (p.stock || 0) < WHOLESALE.minStockToOffer) continue;
            const open = w.offers.filter(o => o.productId === p.id).length;
            if (open >= WHOLESALE.maxOffersPerProduct) continue;
            const quality = this._quality(p);
            const chance = _clamp(WHOLESALE.offerChanceBase * (quality / WHOLESALE.qualityRef), WHOLESALE.offerChanceMin, WHOLESALE.offerChanceMax);
            if (Math.random() > chance) continue;
            this._createOffer(p, quality);
        }
        bus.emit('state:changed', this.state.data);
    }

    _createOffer(p, quality) {
        const w = this._raw();
        const buyers = this._buyers();
        if (!buyers.length) return null;
        const buyer = buyers[Math.floor(Math.random() * buyers.length)];
        const range = WHOLESALE.priceByPersonality[buyer.personality] || WHOLESALE.priceDefault;
        const qRel = quality / WHOLESALE.qualityRef - 1;
        const ratio = _clamp(_rand(range[0], range[1]) * (1 + WHOLESALE.qualityPriceBonus * qRel), WHOLESALE.priceMin, WHOLESALE.priceMax);
        // Lantai biaya: harga grosir tidak pernah di bawah biaya produksi.
        const floor = Math.ceil(Math.max(0, p.unitCost || 0) * WHOLESALE.costFloorMult);
        // Bila lantai biaya sudah di atas batas harga ritel, tidak ada tawaran yang layak.
        if (floor > (p.price || 0) * WHOLESALE.priceMax) return null;
        const unitPrice = Math.max(1, floor, Math.round((p.price || 0) * ratio));
        const share = _rand(WHOLESALE.qtyShare.min, WHOLESALE.qtyShare.max);
        const qty = Math.min(p.stock, Math.max(WHOLESALE.minQty, Math.floor(p.stock * share)));
        const days = Math.round(_rand(WHOLESALE.offerDays.min, WHOLESALE.offerDays.max));
        const offer = {
            id: 'wo_' + w.nextId, buyerId: buyer.id, buyerName: buyer.name,
            productId: p.id, productName: p.name, qty: qty, unitPrice: unitPrice, total: qty * unitPrice,
            createdAtMinute: this._now(), expiresAtMinute: this._now() + days * MINUTES_PER_DAY
        };
        w.nextId += 1;
        w.offers.push(offer);
        bus.emit('wholesale:offer-new', offer);
        return offer;
    }

    _expireOffers() {
        const w = this._raw(), now = this._now();
        const alive = [];
        w.offers.forEach(o => {
            if (o.expiresAtMinute > now) alive.push(o);
            else bus.emit('wholesale:offer-expired', { id: o.id, buyerName: o.buyerName, productName: o.productName });
        });
        w.offers = alive;
    }

    // ------------------------------------------------------------
    // AKSI PEMAIN
    // ------------------------------------------------------------
    getOffers() {
        const w = this._raw(), now = this._now();
        return w.offers.map(o => Object.assign({}, o, {
            daysLeft: Math.max(0, Math.ceil((o.expiresAtMinute - now) / MINUTES_PER_DAY))
        })).sort((a, b) => a.expiresAtMinute - b.expiresAtMinute);
    }

    accept(offerId) {
        const data = this.state.data, w = this._raw();
        const idx = w.offers.findIndex(o => o.id === offerId);
        if (idx < 0) return { ok: false, reason: 'Tawaran tidak ditemukan atau sudah kedaluwarsa.' };
        const o = w.offers[idx];
        if (o.expiresAtMinute <= this._now()) { this._expireOffers(); return { ok: false, reason: 'Tawaran sudah kedaluwarsa.' }; }
        const p = this._products().find(x => x.id === o.productId);
        if (!p || p.status !== 'selling') return { ok: false, reason: 'Produk sudah tidak dijual.' };
        if ((p.stock || 0) < o.qty) return { ok: false, reason: 'Stok tidak cukup (' + (p.stock || 0).toLocaleString('en-US') + ' unit).' };

        const days = Math.round(_rand(WHOLESALE.deliveryDays.min, WHOLESALE.deliveryDays.max));
        p.stock -= o.qty;
        w.offers.splice(idx, 1);
        const contract = {
            id: 'wc_' + w.nextId, offerId: o.id, buyerName: o.buyerName,
            productId: p.id, productName: p.name, qty: o.qty, unitPrice: o.unitPrice, total: o.total,
            acceptedAtMinute: this._now(), deliverAtMinute: this._now() + days * MINUTES_PER_DAY,
            status: 'shipping'
        };
        w.nextId += 1;
        w.contracts.push(contract);
        this.state.addLog('Kontrak grosir diterima: ' + o.qty.toLocaleString('en-US') + ' unit "' + p.name + '" ke ' + o.buyerName + ' (' + _money(o.total) + ', kirim ' + days + ' hari).', LOG_TYPES.info);
        bus.emit('wholesale:accepted', contract);
        // Pembeli mendapat dorongan pangsa (lewat jalur modifier kompetitor, dibatasi cap).
        if (this._competitorActions && WHOLESALE.buyerBoost) {
            this._competitorActions.applyWholesaleSupply(o.buyerId, WHOLESALE.buyerBoost.relEffect, WHOLESALE.buyerBoost.durationTicks);
        }
        bus.emit('state:changed', data);
        return { ok: true, contract: contract };
    }

    decline(offerId) {
        const data = this.state.data, w = this._raw();
        const idx = w.offers.findIndex(o => o.id === offerId);
        if (idx < 0) return { ok: false, reason: 'Tawaran tidak ditemukan.' };
        const o = w.offers.splice(idx, 1)[0];
        bus.emit('wholesale:declined', { id: o.id, buyerName: o.buyerName, productName: o.productName });
        bus.emit('state:changed', data);
        return { ok: true };
    }

    // ------------------------------------------------------------
    // TICK HARIAN: kirim / bayar / batalkan
    // ------------------------------------------------------------
    _tickDaily() {
        const data = this.state.data, w = this._raw(), now = this._now();
        this._expireOffers();
        let changed = false;
        const still = [];
        w.contracts.forEach(c => {
            const p = this._products().find(x => x.id === c.productId);
            if (!p || p.status !== 'selling') {
                // produk dihentikan: kembalikan stok yang dipesan
                if (p) p.stock = (p.stock || 0) + c.qty;
                c.status = 'cancelled';
                this.state.addLog('Kontrak grosir "' + c.productName + '" ke ' + c.buyerName + ' dibatalkan (produk dihentikan).', LOG_TYPES.warning);
                bus.emit('wholesale:cancelled', { id: c.id, buyerName: c.buyerName, productName: c.productName, qty: c.qty });
                changed = true;
                return;
            }
            if (c.deliverAtMinute > now) { still.push(c); return; }
            this.state.addCash(c.total);
            w.revenueTotal += c.total;
            w.delivered += 1;
            w.history.unshift({ id: c.id, buyerName: c.buyerName, productName: c.productName, qty: c.qty, total: c.total, minute: now });
            if (w.history.length > WHOLESALE.historyLimit) w.history.length = WHOLESALE.historyLimit;
            this.state.addLog('Pembayaran grosir masuk: ' + _money(c.total) + ' dari ' + c.buyerName + ' (' + c.qty.toLocaleString('en-US') + ' unit "' + c.productName + '").', LOG_TYPES.success);
            bus.emit('wholesale:delivered', { id: c.id, buyerName: c.buyerName, productName: c.productName, qty: c.qty, total: c.total });
            changed = true;
        });
        w.contracts = still;
        if (changed) bus.emit('state:changed', data);
    }

    // ------------------------------------------------------------
    // PANTAUAN (untuk panel)
    // ------------------------------------------------------------
    getSnapshot() {
        const w = this._raw();
        return {
            offers: this.getOffers(),
            shipping: w.contracts.slice(),
            revenueTotal: w.revenueTotal,
            delivered: w.delivered,
            history: w.history.slice(0, 5)
        };
    }
}
