// FILE: src/data/bank.data.js  (BARU)
// ============================================================
// DATA BANK — peringkat kredit + 3 bank (Global, Asia, Eropa).
// Bunga bulanan = (baseRate*(1+spreadRating) + riskPremium - diskonBrand) * rateFactor makro.
// ============================================================

// Peringkat kredit (urut dari terbaik). limitBase & incomeMult = plafon total.
export const RATINGS = [
    { id: 'AAA', min: 90, spread: -0.20, limitBase: 400000, incomeMult: 4.0, color: '#22c55e' },
    { id: 'AA',  min: 80, spread: -0.12, limitBase: 300000, incomeMult: 3.2, color: '#4ade80' },
    { id: 'A',   min: 70, spread: -0.05, limitBase: 200000, incomeMult: 2.5, color: '#84cc16' },
    { id: 'BBB', min: 60, spread:  0.00, limitBase: 150000, incomeMult: 1.8, color: '#eab308' },
    { id: 'BB',  min: 50, spread:  0.10, limitBase: 100000, incomeMult: 1.2, color: '#f59e0b' },
    { id: 'B',   min: 40, spread:  0.25, limitBase:  60000, incomeMult: 0.8, color: '#f97316' },
    { id: 'CCC', min: 30, spread:  0.45, limitBase:  30000, incomeMult: 0.4, color: '#ef4444' },
    { id: 'D',   min: 0,  spread: null,  limitBase: 0,      incomeMult: 0,   color: '#991b1b' }
];

export function getRatingById(id) {
    return RATINGS.find(function (r) { return r.id === id; }) || RATINGS[RATINGS.length - 1];
}
export function ratingRank(id) {          // 0 = AAA ... 7 = D
    return RATINGS.findIndex(function (r) { return r.id === id; });
}
export function ratingFromScore(score) {
    for (var i = 0; i < RATINGS.length; i++) if (score >= RATINGS[i].min) return RATINGS[i];
    return RATINGS[RATINGS.length - 1];
}

// Batas umur perusahaan -> skor maksimum (perusahaan baru belum bisa AAA).
export const AGE_SCORE_CAPS = [
    { months: 6,  cap: 64 },
    { months: 12, cap: 74 },
    { months: 24, cap: 89 }
];

export const BANK_RULES = {
    lateFeePct: 0.03,            // denda telat = 3% dari cicilan
    defaultMissedLimit: 3,       // 3x telat -> bank memblokir
    blockMonths: 6,              // lama blokir pengajuan
    defaultRepPenalty: 3,
    minMonthlyRate: 0.004,
    creditLineShare: 0.35,       // plafon kredit modal kerja = 35% plafon total
    creditLineMinRating: 'BB',
    missedWindowMonths: 12
};

// Simpanan: tabungan fleksibel & deposito berjangka.
// Bunga per tahun (%) = suku bunga acuan * pengali (+ bonus tenor) * pengali bank, minimal minAnnualPct.
export const DEPOSIT_CONFIG = {
    taxPct: 0.15,                          // pajak final atas bunga
    flexMult: 0.5,                         // tabungan = 50% suku bunga acuan
    termMult: { 3: 0.8, 6: 1.0, 12: 1.2 }, // deposito per tenor (bulan)
    termBonusPct: { 3: 0, 6: 0.1, 12: 0.25 },
    termOptions: [3, 6, 12],
    minAnnualPct: 0.3,
    earlyPenaltyPct: 0.01,                 // denda tarik deposito sebelum jatuh tempo (dari pokok)
    minDeposit: 5000                       // diskalakan mengikuti besar pasar
};

export const BANKS = [
    {
        id: 'global_bank', region: 'global', depositMult: 1.0,
        minRating: 'B', baseRate: 0.020, riskPremium: 0, fee: 0.015, prepayPenalty: 0.02,
        products: [
            { id: 'gb_term', kind: 'term', min: 25000, max: 1000000, terms: [12, 24, 36] },
            { id: 'gb_line', kind: 'line', rateAdd: 0.006 }
        ]
    },
    {
        id: 'asia_bank', region: 'asia', depositMult: 1.15,
        minRating: 'CCC', baseRate: 0.018, riskPremium: 0.004, fee: 0.020, prepayPenalty: 0.01,
        minBrand: 10, brandDiscountMax: 0.004,
        products: [
            { id: 'ab_growth', kind: 'term', min: 20000, max: 400000, terms: [6, 12, 18] }
        ]
    },
    {
        id: 'euro_bank', region: 'europe', depositMult: 0.95,
        minRating: 'BBB', baseRate: 0.013, riskPremium: 0, fee: 0.008, prepayPenalty: 0.01,
        minHistoryMonths: 3, minProfitMonths: 3, brandDiscountMax: 0.003,
        products: [
            { id: 'eb_long', kind: 'term', min: 50000, max: 2000000, terms: [24, 36, 60] }
        ]
    }
];

export function getBankById(id) {
    return BANKS.find(function (b) { return b.id === id; }) || null;
}
export function getProductById(bank, productId) {
    if (!bank) return null;
    return bank.products.find(function (p) { return p.id === productId; }) || null;
}
