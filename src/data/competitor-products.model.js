// FILE: src/data/competitor-products.model.js
// ============================================================
// MODEL PRODUK & MARGIN KOMPETITOR (untuk panel Akuisisi).
//
// CATATAN PENTING: data rival di game tidak menyimpan harga atau biaya
// produksi. Yang ada hanya nama, tahun, tier, dan shareBoost. Maka harga,
// biaya unit, margin, dan volume di sini adalah ESTIMASI GAME yang
// dihitung dari:
//   harga     = harga rata-rata pasar tahun itu x pengali tier x pengali watak merek
//   biaya     = harga x rasio biaya (turun seiring tier, digeser watak merek,
//               dan naik saat krisis memori 2027-2029)
//   volume    = unit pasar/bulan x pangsa merek, dibagi ke produk yang
//               masih hidup menurut bobot tier dan umur produk
// Modul ini murni (tanpa DOM) sehingga bisa diuji dari Node.
// ============================================================
import { BALANCE } from './balance.data.js';
import { getCompetitorById } from './competitors/index.js';
import { getComponentCostIndex } from './supply-shock.data.js';

export const PRODUCT_MODEL = {
    tierPriceMult:  { 1: 0.45, 2: 0.80, 3: 1.25, 4: 1.90, 5: 2.80 },
    tierCostRatio:  { 1: 0.82, 2: 0.78, 3: 0.72, 4: 0.66, 5: 0.62 },
    tierVolWeight:  { 1: 1.6,  2: 1.3,  3: 1.0,  4: 0.5,  5: 0.25 },
    personalityPrice: { premium: 1.25, dominant: 1.0, innovator: 1.1, aggressive: 0.85, follower: 0.85, declining: 0.9 },
    personalityCost:  { premium: -0.05, dominant: -0.02, innovator: 0.0, aggressive: 0.04, follower: 0.03, declining: 0.03 },
    // Pengali volume menurut umur produk (tahun sejak rilis): baru -> mati.
    lifecycle: [1.0, 0.85, 0.6, 0.35, 0.12],
    // Kenaikan rasio biaya per +1.0 indeks RAM di atas 1.0 (krisis memori).
    ramCostSensitivity: 0.12,
    minCostRatio: 0.45,
    maxCostRatio: 0.97
};

function _interp(map, year, fallback) {
    if (!map) return fallback;
    if (map[year] !== undefined) return map[year];
    var ys = Object.keys(map).map(Number).sort(function (a, b) { return a - b; });
    if (!ys.length) return fallback;
    if (year <= ys[0]) return map[ys[0]];
    if (year >= ys[ys.length - 1]) return map[ys[ys.length - 1]];
    for (var i = 0; i < ys.length - 1; i++) {
        if (year >= ys[i] && year <= ys[i + 1]) {
            return map[ys[i]] + (map[ys[i + 1]] - map[ys[i]]) * ((year - ys[i]) / (ys[i + 1] - ys[i]));
        }
    }
    return fallback;
}

function _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function _tier(t) { return _clamp(Math.round(Number(t) || 2), 1, 5); }

// Harga & biaya satu produk pada tahun tertentu (tanpa volume).
export function estimateUnitEconomics(comp, tier, year, month) {
    var M = PRODUCT_MODEL;
    var tr = _tier(tier);
    var avgP = _interp(BALANCE.market.avgPriceByYear, year, 200);
    var price = avgP * M.tierPriceMult[tr] * (M.personalityPrice[comp.personality] || 1);
    var ratio = M.tierCostRatio[tr] + (M.personalityCost[comp.personality] || 0);
    var ram = getComponentCostIndex('ram', year, month || 6);
    ratio += Math.max(0, ram - 1) * M.ramCostSensitivity;
    ratio = _clamp(ratio, M.minCostRatio, M.maxCostRatio);
    var cost = price * ratio;
    return {
        price: Math.round(price),
        unitCost: Math.round(cost),
        marginPerUnit: Math.round(price - cost),
        marginPct: (price - cost) / price,
        ramIndex: ram
    };
}

// Bangun daftar produk lengkap sebuah kompetitor.
//   ctx = { year, month, share (0..1), releases: [{name,year,month,tier}] }
export function buildCompetitorProducts(competitorId, ctx) {
    var comp = getCompetitorById(competitorId);
    if (!comp) return null;
    var M = PRODUCT_MODEL;
    var year = ctx.year, month = ctx.month || 6;

    var list = [];
    var seen = {};
    (comp.signatureProducts || []).forEach(function (sp) {
        seen[sp.name] = true;
        list.push({ name: sp.name, year: sp.year, month: null, tier: _tier(sp.tier), shareBoost: sp.shareBoost || 0, source: 'signature' });
    });
    (ctx.releases || []).forEach(function (r) {
        if (!r || seen[r.name]) return;
        seen[r.name] = true;
        list.push({ name: r.name, year: r.year, month: r.month || null, tier: _tier(r.tier), shareBoost: null, source: 'release' });
    });

    var nowIdx = year * 12 + (month - 1);

    // Produk yang belum rilis disembunyikan agar roadmap rival tidak bocor.
    // Produk ikonik (bulan rilis tak diketahui) baru tampil setelah tahun
    // rilisnya terlewati; rilis AI (bulan diketahui) tampil begitu sudah rilis.
    list = list.filter(function (p) {
        return p.month ? (p.year * 12 + p.month - 1 <= nowIdx) : (p.year < year);
    });
    list.forEach(function (p) {
        // Bulan rilis tak diketahui (produk signature) dianggap awal tahun.
        var relIdx = p.year * 12 + ((p.month || 1) - 1);
        var ageYears = Math.max(0, Math.floor((nowIdx - relIdx) / 12));
        p.ageYears = ageYears;
        if (p.year > year) p.status = 'upcoming';
        else if (ageYears >= M.lifecycle.length) p.status = 'ended';
        else p.status = ageYears <= 0 ? 'new' : (ageYears <= 2 ? 'selling' : 'declining');
        p.lifeMult = (p.status === 'upcoming' || p.status === 'ended') ? 0 : M.lifecycle[ageYears];
        // Harga dipatok pada tahun rilis. Biaya produk yang masih dijual
        // mengikuti indeks RAM saat ini (krisis memori menggerus margin).
        var econ = estimateUnitEconomics(comp, p.tier, p.year, p.month || 6);
        if (p.status !== 'ended' && p.status !== 'upcoming') {
            var ramNow = getComponentCostIndex('ram', year, month);
            var ratio = _clamp(M.tierCostRatio[p.tier] + (M.personalityCost[comp.personality] || 0) +
                Math.max(0, ramNow - 1) * M.ramCostSensitivity, M.minCostRatio, M.maxCostRatio);
            econ.unitCost = Math.round(econ.price * ratio);
            econ.marginPerUnit = econ.price - econ.unitCost;
            econ.marginPct = econ.marginPerUnit / econ.price;
            econ.ramIndex = ramNow;
        }
        p.price = econ.price; p.unitCost = econ.unitCost;
        p.marginPerUnit = econ.marginPerUnit; p.marginPct = econ.marginPct; p.ramIndex = econ.ramIndex;
    });

    // Bagi volume bulanan merek ke produk yang hidup.
    var marketUnits = _interp(BALANCE.market.marketUnitsByYear, year, 30000000);
    var brandUnits = marketUnits * Math.max(0, ctx.share || 0);
    var weightSum = 0;
    list.forEach(function (p) {
        p.weight = p.lifeMult * (M.tierVolWeight[p.tier] || 1);
        weightSum += p.weight;
    });
    list.forEach(function (p) {
        p.unitsPerMonth = weightSum > 0 ? Math.round(brandUnits * (p.weight / weightSum)) : 0;
        p.revenuePerMonth = p.unitsPerMonth * p.price;
        p.profitPerMonth = p.unitsPerMonth * p.marginPerUnit;
    });

    list.sort(function (a, b) {
        var rank = { new: 0, selling: 1, declining: 2, upcoming: 3, ended: 4 };
        if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
        return b.year - a.year || b.tier - a.tier;
    });

    var live = list.filter(function (p) { return p.unitsPerMonth > 0; });
    var rev = live.reduce(function (s, p) { return s + p.revenuePerMonth; }, 0);
    var prof = live.reduce(function (s, p) { return s + p.profitPerMonth; }, 0);
    var units = live.reduce(function (s, p) { return s + p.unitsPerMonth; }, 0);
    var best = live.slice().sort(function (a, b) { return b.profitPerMonth - a.profitPerMonth; })[0] || null;

    return {
        competitorId: comp.id,
        personality: comp.personality,
        products: list,
        summary: {
            total: list.length,
            liveCount: live.length,
            unitsPerMonth: units,
            revenuePerMonth: rev,
            profitPerMonth: prof,
            marginPct: rev > 0 ? prof / rev : 0,
            bestName: best ? best.name : null
        }
    };
}
