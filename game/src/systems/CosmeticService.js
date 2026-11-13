// FILE: src/systems/CosmeticService.js  (BARU, v0.2.19)
// ============================================================
// Kepemilikan & pemakaian kosmetik SIL.
//  - Disimpan di save: state.data.player.cosmetics = { v:1, owned:{id:waktuBeli}, equipped:{cat:id} }
//  - Beli = SiliconService.spendRaw(harga) (SIL murni; uang game TIDAK bisa dipakai membeli kosmetik).
//  - Kosmetik hanya tampilan, tidak mengubah hasil permainan.
//  - Event: 'cosmetic:changed' { kind: 'buy'|'equip'|'unequip', id, cat }
// ============================================================
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { SaveService } from '../core/SaveService.js';
import { SiliconService } from './SiliconService.js';
import { COSMETICS, COSMETIC_CATS, rarityOf } from '../data/cosmetics.data.js';

var BY_ID = {};
COSMETICS.forEach(function (c) { BY_ID[c.id] = c; });

// Ambil (dan rapikan) data kosmetik pemain. Id tak dikenal / bingkai yang tidak dimiliki dibuang.
function _c() {
    var d = state.data;
    if (!d.player || typeof d.player !== 'object') d.player = {};
    var c = d.player.cosmetics;
    if (!c || typeof c !== 'object') c = d.player.cosmetics = { v: 1, owned: {}, equipped: {} };
    if (!c.owned || typeof c.owned !== 'object') c.owned = {};
    if (!c.equipped || typeof c.equipped !== 'object') c.equipped = {};
    Object.keys(c.owned).forEach(function (id) { if (!BY_ID[id]) delete c.owned[id]; });
    COSMETIC_CATS.forEach(function (cat) {
        var id = c.equipped[cat];
        if (id && (!BY_ID[id] || BY_ID[id].cat !== cat || !c.owned[id])) delete c.equipped[cat];
    });
    return c;
}

function _save() { try { SaveService.save(state); } catch (e) {} }

export var CosmeticService = {
    categories: function () { return COSMETIC_CATS.slice(); },
    catalog: function (cat) {
        return COSMETICS.filter(function (c) { return !cat || c.cat === cat; })
            .map(function (c) { return Object.assign({ rarity: rarityOf(c) }, c); });
    },
    get: function (id) { return BY_ID[id] ? Object.assign({ rarity: rarityOf(BY_ID[id]) }, BY_ID[id]) : null; },
    isOwned: function (id) { return !!_c().owned[id]; },
    ownedCount: function () { return Object.keys(_c().owned).length; },
    equippedId: function (cat) { return _c().equipped[cat] || null; },
    // Item yang sedang dipakai di kategori itu (atau null). Dipakai tampilan (peta kampus, mockup, avatar).
    equipped: function (cat) { var id = _c().equipped[cat]; return id ? this.get(id) : null; },

    canBuy: function (id) {
        var it = BY_ID[id];
        if (!it) return { ok: false, reason: 'unknown' };
        if (_c().owned[id]) return { ok: false, reason: 'owned' };
        if (!SiliconService.canAffordRaw(it.price)) {
            return { ok: false, reason: 'insufficient', need: Math.max(0, it.price - (state.data.silicon || 0)) };
        }
        return { ok: true, price: it.price };
    },

    buy: function (id) {
        var chk = this.canBuy(id);
        if (!chk.ok) return chk;
        var it = BY_ID[id];
        var sp = SiliconService.spendRaw(it.price, 'cosmetic:' + id);
        if (!sp.ok) return { ok: false, reason: 'failed', detail: sp.reason };
        var c = _c();
        c.owned[id] = Date.now();
        if (!c.equipped[it.cat]) c.equipped[it.cat] = id;   // item pertama di kategori langsung dipakai
        _save();
        bus.emit('cosmetic:changed', { kind: 'buy', id: id, cat: it.cat });
        return { ok: true, id: id, price: it.price, balance: sp.balance, equipped: c.equipped[it.cat] === id };
    },

    equip: function (id) {
        var it = BY_ID[id];
        if (!it) return { ok: false, reason: 'unknown' };
        var c = _c();
        if (!c.owned[id]) return { ok: false, reason: 'not-owned' };
        c.equipped[it.cat] = id;
        _save();
        bus.emit('cosmetic:changed', { kind: 'equip', id: id, cat: it.cat });
        return { ok: true };
    },

    unequip: function (cat) {
        var c = _c();
        if (COSMETIC_CATS.indexOf(cat) < 0 || !c.equipped[cat]) return { ok: false, reason: 'none' };
        var id = c.equipped[cat];
        delete c.equipped[cat];
        _save();
        bus.emit('cosmetic:changed', { kind: 'unequip', id: id, cat: cat });
        return { ok: true };
    }
};
