// FILE: src/systems/MarketIndexAdjuster.js
// ============================================================
// MarketIndexAdjuster — algoritma yang menyesuaikan dampak berita
// rilis kompetitor terhadap harga saham, berdasarkan kondisi
// INDEKS BURSA (NASDAQ / S&P 500 / Dow) pada bulan game berjalan.
//
// Ide dasar (event-study sederhana):
//   1. Indeks komposit  = 0.5 NASDAQ + 0.3 S&P500 + 0.2 Dow
//      (dinormalisasi per bulan lewat interpolasi valueByYear).
//   2. Rezim pasar      = dari return 12 bulan terakhir indeks:
//        euphoria (>= +35%) | bull (>= +15%) | neutral |
//        bear (<= -10%) | crash (<= -25%)
//   3. Beta saham       = regresi return tahunan saham terhadap
//        return tahunan indeks (maks 8 tahun terakhir), ditarik ke 1.0
//        (penyesuaian Blume 0.67/0.33), dijepit 0.6 - 1.6.
//        Data kurang dari 3 tahun -> beta 1.0.
//   4. Abnormal return  = dasar(tone) x pengali rezim x
//        sqrt(beta) x bobot berita (spekulatif = separuh).
//        Berita bagus di pasar jatuh DIREDAM, berita buruk di
//        pasar jatuh DIPERBESAR (dan sebaliknya di pasar naik).
//   5. Overlay          = jumlah semua impuls, meluruh 0.6x per
//        bulan, dijepit +/-15%. Harga akhir = harga dasar
//        historis x (1 + overlay), jadi data sejarah tidak
//        pernah menyimpang permanen.
//
// Modul ini murni (tanpa state game) supaya mudah diuji.
// ============================================================
import { STOCKS, MARKET_INDICES } from '../data/stocks.data.js';

export var ADJUSTER_CONFIG = {
    indexWeights: { nasdaq: 0.5, sp500: 0.3, dow: 0.2 },
    baseImpact: { positive: 0.04, negative: -0.05, mixed: 0 },
    mixedDrift: 0.012,            // berita campuran: ikut arah pasar (kecil)
    decayPerMonth: 0.6,
    pruneBelow: 0.002,
    maxOverlay: 0.15,
    betaMin: 0.6,
    betaMax: 1.6,
    betaYears: 8,
    speculativeWeight: 0.5,
    regimeThresholds: { euphoria: 0.35, bull: 0.15, bear: -0.10, crash: -0.25 },
    // pengali dampak per rezim: [berita positif, berita negatif]
    regimeMultiplier: {
        euphoria: [1.35, 0.75],
        bull:     [1.20, 0.85],
        neutral:  [1.00, 1.00],
        bear:     [0.70, 1.25],
        crash:    [0.45, 1.50]
    }
};

// ------------------------------------------------------------
// Interpolasi (sama dengan StockSystem._interpolate, tahun & bulan)
// ------------------------------------------------------------
function _interp(map, year, month) {
    if (!map) return null;
    var years = Object.keys(map).map(Number).sort(function (a, b) { return a - b; });
    if (!years.length) return null;
    if (year <= years[0]) return map[years[0]];
    if (year >= years[years.length - 1]) return map[years[years.length - 1]];
    for (var i = 0; i < years.length - 1; i++) {
        var y1 = years[i], y2 = years[i + 1];
        if (year >= y1 && year < y2) {
            var frac = (year - y1) + (month - 1) / 12;
            return map[y1] + (map[y2] - map[y1]) * (frac / (y2 - y1));
        }
    }
    return map[years[years.length - 1]];
}

function _shiftMonth(year, month, delta) {
    var idx = year * 12 + (month - 1) + delta;
    return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

// ------------------------------------------------------------
// Indeks komposit
// ------------------------------------------------------------
export function getCompositeIndex(year, month) {
    var w = ADJUSTER_CONFIG.indexWeights;
    var sum = 0, wsum = 0;
    for (var i = 0; i < MARKET_INDICES.length; i++) {
        var idx = MARKET_INDICES[i];
        var weight = w[idx.id];
        if (!weight) continue;
        var years = Object.keys(idx.valueByYear).map(Number).sort(function (a, b) { return a - b; });
        var base = idx.valueByYear[years[0]];
        var v = _interp(idx.valueByYear, year, month);
        if (v == null || !base) continue;
        sum += weight * (v / base * 100);   // rebased ke 100 pada tahun pertama
        wsum += weight;
    }
    return wsum > 0 ? sum / wsum : 0;
}

// Nilai komposit TAHUNAN memakai angka tahunan asli (bukan hasil
// interpolasi bulanan) supaya sejajar dengan priceByYear saham.
export function getCompositeAnnual(year) {
    var w = ADJUSTER_CONFIG.indexWeights;
    var sum = 0, wsum = 0;
    for (var i = 0; i < MARKET_INDICES.length; i++) {
        var idx = MARKET_INDICES[i];
        var weight = w[idx.id];
        if (!weight) continue;
        var years = Object.keys(idx.valueByYear).map(Number).sort(function (a, b) { return a - b; });
        var base = idx.valueByYear[years[0]];
        var v = idx.valueByYear[year];
        if (v == null) v = _interp(idx.valueByYear, year, 1);
        if (v == null || !base) continue;
        sum += weight * (v / base * 100);
        wsum += weight;
    }
    return wsum > 0 ? sum / wsum : 0;
}

// Return indeks antara dua titik waktu (desimal, 0.1 = +10%).
export function getIndexReturn(year, month, monthsBack) {
    var from = _shiftMonth(year, month, -monthsBack);
    var a = getCompositeIndex(from.year, from.month);
    var b = getCompositeIndex(year, month);
    if (!a || !b) return 0;
    return b / a - 1;
}

export function getMarketRegime(year, month) {
    var r12 = getIndexReturn(year, month, 12);
    var th = ADJUSTER_CONFIG.regimeThresholds;
    var id = 'neutral';
    if (r12 >= th.euphoria) id = 'euphoria';
    else if (r12 >= th.bull) id = 'bull';
    else if (r12 <= th.crash) id = 'crash';
    else if (r12 <= th.bear) id = 'bear';
    return {
        id: id,
        return12m: r12,
        return1m: getIndexReturn(year, month, 1),
        composite: getCompositeIndex(year, month)
    };
}

// ------------------------------------------------------------
// Beta saham terhadap indeks (return tahunan)
// ------------------------------------------------------------
var _betaCache = {};

export function getStockBeta(stock, year) {
    if (!stock || !stock.priceByYear) return 1;
    var key = stock.id + ':' + year;
    if (_betaCache[key] !== undefined) return _betaCache[key];

    var cfg = ADJUSTER_CONFIG;
    var sy = [], ry = [];
    var years = Object.keys(stock.priceByYear).map(Number).sort(function (a, b) { return a - b; });
    for (var i = 1; i < years.length; i++) {
        var y = years[i];
        if (y > year) break;
        if (years[i - 1] !== y - 1) continue;           // hanya tahun berurutan
        if (y < year - cfg.betaYears) continue;
        var p0 = stock.priceByYear[y - 1], p1 = stock.priceByYear[y];
        if (!(p0 > 0) || !(p1 > 0)) continue;
        var i0 = getCompositeAnnual(y - 1), i1 = getCompositeAnnual(y);
        if (!(i0 > 0) || !(i1 > 0)) continue;
        sy.push(Math.log(p1 / p0));
        ry.push(Math.log(i1 / i0));
    }

    var beta = 1;
    if (sy.length >= 3) {
        var ms = 0, mr = 0, n = sy.length;
        for (var a = 0; a < n; a++) { ms += sy[a]; mr += ry[a]; }
        ms /= n; mr /= n;
        var cov = 0, vr = 0;
        for (var b = 0; b < n; b++) {
            cov += (sy[b] - ms) * (ry[b] - mr);
            vr += (ry[b] - mr) * (ry[b] - mr);
        }
        if (vr > 1e-9) beta = cov / vr;
        // Penyesuaian Blume: tarik beta mentah ke 1.0 (sampel tahunan pendek = noisy).
        beta = 0.67 * beta + 0.33;
    }
    beta = Math.max(cfg.betaMin, Math.min(cfg.betaMax, beta));
    beta = Math.round(beta * 100) / 100;
    _betaCache[key] = beta;
    return beta;
}

// ------------------------------------------------------------
// Dampak satu berita pada satu saham
// entry: { tone, speculative }  ->  { pct, regime, beta, ... }
// ------------------------------------------------------------
export function computeNewsImpact(entry, stock, year, month) {
    var cfg = ADJUSTER_CONFIG;
    var regime = getMarketRegime(year, month);
    var beta = getStockBeta(stock, year);
    var tone = (entry && entry.tone) || 'mixed';

    var base = cfg.baseImpact[tone];
    if (base === undefined) base = 0;

    var mult = cfg.regimeMultiplier[regime.id] || [1, 1];
    var pct;
    if (tone === 'positive') pct = base * mult[0];
    else if (tone === 'negative') pct = base * mult[1];
    else {
        // campuran: kecil, searah momentum pasar bulan ini
        var dir = regime.return1m > 0 ? 1 : (regime.return1m < 0 ? -1 : 0);
        pct = cfg.mixedDrift * dir;
    }

    pct *= Math.sqrt(beta);
    if (entry && entry.speculative) pct *= cfg.speculativeWeight;
    pct = Math.round(pct * 10000) / 10000;

    return {
        pct: pct,
        regime: regime.id,
        beta: beta,
        indexReturn12m: regime.return12m,
        indexReturn1m: regime.return1m
    };
}

// ------------------------------------------------------------
// Impuls & overlay
// impulse: { key, stockId, y, m, pct }
// ------------------------------------------------------------
export function monthsBetween(y1, m1, y2, m2) {
    return (y2 - y1) * 12 + (m2 - m1);
}

export function impulseValueAt(impulse, year, month) {
    var k = monthsBetween(impulse.y, impulse.m, year, month);
    if (k < 0) return 0;
    return impulse.pct * Math.pow(ADJUSTER_CONFIG.decayPerMonth, k);
}

export function getOverlay(impulses, stockId, year, month) {
    if (!Array.isArray(impulses)) return 0;
    var sum = 0;
    for (var i = 0; i < impulses.length; i++) {
        if (impulses[i].stockId !== stockId) continue;
        sum += impulseValueAt(impulses[i], year, month);
    }
    var cap = ADJUSTER_CONFIG.maxOverlay;
    return Math.max(-cap, Math.min(cap, sum));
}

export function pruneImpulses(impulses, year, month) {
    if (!Array.isArray(impulses)) return [];
    return impulses.filter(function (im) {
        return Math.abs(impulseValueAt(im, year, month)) >= ADJUSTER_CONFIG.pruneBelow;
    });
}

// Saham yang terdampak berita kompetitor (cocok lewat competitorId).
export function findStocksForCompetitor(competitorId, year) {
    var out = [];
    for (var i = 0; i < STOCKS.length; i++) {
        var s = STOCKS[i];
        if (s.isPlayer || s.competitorId !== competitorId) continue;
        if (year < s.listedFrom) continue;
        if (s.listedTo !== null && year > s.listedTo) continue;
        out.push(s);
    }
    return out;
}

// Ringkasan untuk UI berita (tanpa mengubah state).
export function estimateNewsMarketReaction(entry, competitorId, year, month) {
    var stocks = findStocksForCompetitor(competitorId, year);
    if (!stocks.length) return null;
    var stock = stocks[0];
    var r = computeNewsImpact(entry, stock, year, month);
    return {
        stockId: stock.id,
        ticker: stock.ticker,
        pct: r.pct,
        regime: r.regime,
        beta: r.beta,
        indexReturn12m: r.indexReturn12m
    };
}

export var MarketIndexAdjuster = {
    config: ADJUSTER_CONFIG,
    getCompositeIndex: getCompositeIndex,
    getCompositeAnnual: getCompositeAnnual,
    getIndexReturn: getIndexReturn,
    getMarketRegime: getMarketRegime,
    getStockBeta: getStockBeta,
    computeNewsImpact: computeNewsImpact,
    getOverlay: getOverlay,
    pruneImpulses: pruneImpulses,
    findStocksForCompetitor: findStocksForCompetitor,
    estimateNewsMarketReaction: estimateNewsMarketReaction
};
