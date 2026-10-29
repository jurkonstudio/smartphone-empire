// FILE: src/systems/CountryMarketModel.js  (BARU)
// ============================================================
// Model negara pasar — murni (tanpa DOM/bus/state), jadi aman & mudah dites.
//   - computeSupplyTable(price, qty, year, seed)   → tabel negara yang dipasok
//   - computeOsCountryUsage(data)                  → negara pengguna OS terbanyak
// Distribusi dihitung ulang dari data yang ada (tidak menambah field save),
// jadi tidak merusak save lama. Jitter per produk deterministik (hash id).
// ============================================================
import { COUNTRIES, WEALTH_REF_PRICE, getUnlockedCountries, getNextUnlocks } from '../data/countries.data.js';
import { getProductActiveUsers } from './OsAdoptionModel.js';

function _hash(str) {
    var h = 2166136261;
    str = String(str || '');
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
}

// 0..1 deterministik dari (seed, countryId).
function _rand(seed, cid) { return (_hash(seed + '|' + cid) % 10000) / 10000; }

// Penetrasi ponsel negara pada tahun tertentu. Negara kaya mulai tinggi,
// negara berkembang mulai rendah lalu naik sampai ~1 dalam `ramp` tahun.
function _penetration(c, year) {
    var floor = 0.1 + 0.15 * (c.wealth - 1);
    var t = Math.max(0, year - c.since) / Math.max(1, c.ramp);
    return Math.min(1, floor + t * (1 - floor));
}

// Selera harga: 1.0 bila harga pas dengan acuan negara, turun bila jauh.
function _priceAffinity(c, price) {
    var ref = WEALTH_REF_PRICE[c.wealth] || 400;
    var p = Math.max(20, Number(price) || ref);
    var d = Math.log(p / ref);
    return Math.max(0.2, 1 / (1 + 0.7 * d * d));
}

function _weight(c, year, price, seed) {
    var jitter = 0.88 + _rand(seed, c.id) * 0.24;     // ±12%
    return Math.pow(c.pop, 0.75) * _penetration(c, year) * (0.35 + 0.65 * _priceAffinity(c, price)) * jitter;
}

// Bagi `qty` unit ke negara (largest remainder → jumlah pas).
function _allocate(rows, qty) {
    var total = rows.reduce(function (s, r) { return s + r.w; }, 0) || 1;
    var used = 0;
    rows.forEach(function (r) {
        r.share = r.w / total;
        r.units = Math.floor(qty * r.share);
        r.frac = qty * r.share - r.units;
        used += r.units;
    });
    var left = Math.max(0, Math.round(qty) - used);
    rows.slice().sort(function (a, b) { return b.frac - a.frac; }).slice(0, left)
        .forEach(function (r) { r.units += 1; });
    return rows;
}

export function computeSupplyTable(price, qty, year, seed) {
    var open = getUnlockedCountries(year);
    var rows = open.map(function (c) {
        return {
            country: c,
            w: _weight(c, year, price, seed),
            fresh: (year - c.since) <= 1 && c.since > 2000   // baru dibuka
        };
    });
    _allocate(rows, qty || 0);
    rows.sort(function (a, b) { return b.share - a.share; });
    return {
        rows: rows,
        openCount: open.length,
        totalCount: COUNTRIES.length,
        next: getNextUnlocks(year, 3)
    };
}

// Negara pengguna OS: tiap ponsel ber-OS sendiri → sebar pengguna aktifnya
// ke negara yang terbuka di tahun rilis ponsel itu.
export function computeOsCountryUsage(data) {
    var os = (data && data.os) || {};
    var nowYear = (data && data.time && data.time.currentYear) || 2000;
    var products = (data && data.products && Array.isArray(data.products.catalog)) ? data.products.catalog : [];

    var acc = {};
    var total = 0;
    products.forEach(function (p) {
        var opt = (p.config && p.config.osOptionId) || '';
        if (opt.indexOf('own:') !== 0) return;
        var sold = p.totalSold || 0;
        if (sold <= 0) return;
        // v3: perangkat aktif tidak lagi bergantung tier versi (pengguna bisa update antar versi),
        // pakai helper yang sama dengan tab Pengguna agar total negara = total pengguna OS.
        var active = getProductActiveUsers(p, data);
        if (active <= 0) return;

        var pYear = (p.releaseDate && p.releaseDate.year) || nowYear;
        var rows = getUnlockedCountries(pYear).map(function (c) {
            return { country: c, w: _weight(c, pYear, p.price, p.id) };
        });
        _allocate(rows, active);
        rows.forEach(function (r) {
            if (!acc[r.country.id]) acc[r.country.id] = { country: r.country, active: 0, shipped: 0 };
            acc[r.country.id].active += r.units;
            acc[r.country.id].shipped += Math.round(sold * r.share);
            total += r.units;
        });
    });

    var list = Object.keys(acc).map(function (k) { return acc[k]; })
        .sort(function (a, b) { return b.active - a.active; });
    list.forEach(function (r) { r.share = total > 0 ? r.active / total : 0; });

    return {
        total: total,
        list: list,
        countryCount: list.length,
        next: getNextUnlocks(nowYear, 3)
    };
}
