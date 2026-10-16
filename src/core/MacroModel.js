// FILE: src/core/MacroModel.js
// ============================================================
// MacroModel — fungsi murni (tanpa state) yang mengubah tanggal game
// menjadi indikator makro-ekonomi dunia nyata. Karena deterministik
// terhadap tanggal, hasilnya stabil, kompatibel dengan save lama,
// dan tidak perlu disimpan.
// ============================================================
import {
    GDP_GROWTH, INFLATION, POLICY_RATE, LONG_RUN,
    BASE_DEMAND_ANCHORS, QUALITY_EXPECTATION, TREND_ANCHORS
} from '../data/macro.data.js';

const BASE_YEAR = 2000;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------- util tabel ----------
function annual(table, year, fallback) {
    if (table[year] !== undefined) return table[year];
    const ys = Object.keys(table).map(Number);
    if (year < Math.min(...ys)) return table[Math.min(...ys)];
    return fallback;
}

// Interpolasi linear nilai tahunan yang diletakkan di tengah tahun (y+0.5)
// → nilai berubah halus, bukan "melompat" tiap 1 Januari.
function smoothAnnual(table, t, fallback) {
    const y = Math.floor(t);
    const mid = y + 0.5;
    const a = t < mid ? y - 1 : y;
    const b = a + 1;
    const va = annual(table, a, fallback);
    const vb = annual(table, b, fallback);
    const w = clamp((t - (a + 0.5)), 0, 1);
    return va + (vb - va) * w;
}

// Indeks kumulatif (1.0 di awal 2000) dari laju tahunan (%).
function buildIndex(getRate) {
    const start = {};
    let v = 1;
    for (let y = BASE_YEAR; y <= 2100; y++) {
        start[y] = v;
        v *= 1 + getRate(y) / 100;
    }
    return (t) => {
        if (t <= BASE_YEAR) return 1;
        const y = Math.min(2100, Math.floor(t));
        const frac = t - y;
        return start[y] * Math.pow(1 + getRate(y) / 100, frac);
    };
}

const cpiIndex = buildIndex((y) => annual(INFLATION, y, LONG_RUN.inflation));
const perCapitaIndex = buildIndex((y) =>
    annual(GDP_GROWTH, y, LONG_RUN.gdp) - LONG_RUN.populationGrowth);

function interpLog(anchors, t) {
    if (t <= anchors[0][0]) return anchors[0][1];
    const last = anchors[anchors.length - 1];
    if (t >= last[0]) return last[1];
    for (let i = 0; i < anchors.length - 1; i++) {
        const [t1, v1] = anchors[i], [t2, v2] = anchors[i + 1];
        if (t >= t1 && t <= t2) {
            const w = (t - t1) / (t2 - t1);
            return Math.exp(Math.log(v1) + (Math.log(v2) - Math.log(v1)) * w);
        }
    }
    return last[1];
}

function interpLinear(anchors, t) {
    if (t <= anchors[0][0]) return anchors[0][1];
    const last = anchors[anchors.length - 1];
    if (t >= last[0]) return last[1];
    for (let i = 0; i < anchors.length - 1; i++) {
        const [t1, v1] = anchors[i], [t2, v2] = anchors[i + 1];
        if (t >= t1 && t <= t2) return v1 + (v2 - v1) * ((t - t1) / (t2 - t1));
    }
    return last[1];
}

function interpTrends(t) {
    if (t <= TREND_ANCHORS[0][0]) return { ...TREND_ANCHORS[0][1] };
    const last = TREND_ANCHORS[TREND_ANCHORS.length - 1];
    if (t >= last[0]) return { ...last[1] };
    for (let i = 0; i < TREND_ANCHORS.length - 1; i++) {
        const [t1, a] = TREND_ANCHORS[i], [t2, b] = TREND_ANCHORS[i + 1];
        if (t >= t1 && t <= t2) {
            const w = (t - t1) / (t2 - t1);
            const out = {};
            for (const k in a) out[k] = a[k] + (b[k] - a[k]) * w;
            return out;
        }
    }
    return { ...last[1] };
}

// ---------- API ----------
export function yearFraction(time) {
    const y = time.currentYear || BASE_YEAR;
    const m = (time.currentMonth || 1) - 1;
    const d = (time.currentDay || 1) - 1;
    return y + m / 12 + d / 365.25;
}

let _cacheKey = null, _cacheVal = null;

// cfg = BALANCE.macro (parameter kekuatan efek, bisa di-tune).
export function getMacro(time, cfg) {
    const key = time.currentYear * 10000 + (time.currentMonth || 1) * 100 + (time.currentDay || 1);
    if (_cacheKey === key && _cacheVal) return _cacheVal;

    const t = yearFraction(time);
    const gdp = smoothAnnual(GDP_GROWTH, t, LONG_RUN.gdp);
    const gap = gdp - LONG_RUN.gdp; // deviasi dari tren jangka panjang

    const cpi = cpiIndex(t);
    const income = perCapitaIndex(t);
    const rate = smoothAnnual(POLICY_RATE, t, LONG_RUN.policyRate);

    const c = cfg || {};
    const m = {
        t,
        gdpGrowth: gdp,
        policyRate: rate,
        cpiIndex: cpi,
        realIncomeIndex: income,
        // Siklus bisnis → permintaan (resesi menekan, rebound mengangkat).
        demandCycle: clamp(1 + (c.cycleElasticity ?? 0.045) * gap,
                           c.cycleMin ?? 0.8, c.cycleMax ?? 1.12),
        // Saat resesi konsumen lebih sensitif harga.
        priceSensitivity: clamp(1 - (c.priceCycleSensitivity ?? 0.06) * gap, 0.9, 1.3),
        // Biaya hidup & upah.
        wageIndex: cpi * Math.pow(income, c.wagePassThrough ?? 0.6),
        // Harga referensi konsumen (USD), 150 di awal 2000.
        priceRef: (c.basePriceRef ?? 150) * cpi * Math.pow(income, c.priceIncomePassThrough ?? 0.5),
        qualityRef: interpLinear(QUALITY_EXPECTATION, t),
        baseDemand: interpLog(BASE_DEMAND_ANCHORS, t),
        trends: interpTrends(t),
        rateFactor: clamp((c.rateBase ?? 0.8) + (c.ratePerPoint ?? 0.08) * rate, 0.8, 1.3)
    };
    _cacheKey = key; _cacheVal = m;
    return m;
}

// Skor ulasan dasar (1-10) dari kualitas relatif, kontinu (tanpa tangga).
const REVIEW_CURVE = [[0, 2.5], [30, 4], [50, 6], [70, 7.5], [85, 9], [100, 9.8]];
export function reviewBaseScore(relativeQuality) {
    return interpLinear(REVIEW_CURVE, clamp(relativeQuality, 0, 100));
}
