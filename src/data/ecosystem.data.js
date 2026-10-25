// FILE: src/data/ecosystem.data.js  (BARU — ekosistem: aksesori & App Store)
// ============================================================
// Angka dasar ekosistem. Semua nilai uang dalam USD (sama seperti WalletService).
// Target keseimbangan (usulan handoff): pendapatan ekosistem penuh ±5–15% pendapatan ponsel
// di akhir permainan, margin 35–55%. Belum diuji terhadap ekonomi permainan yang sebenarnya.
// ============================================================

export const ECO_CONST = {
    maxAttachShare: 0.05,          // batas unit aksesori per bulan = 5% basis ponsel aktif
    priceFactorMin: 0.2,           // batas pengali permintaan akibat harga
    priceFactorMax: 2.0,
    lockMonths: 3,                 // jeda antar perubahan tier / harga / komisi
    commitMonths: 6,               // lini tidak bisa ditutup sebelum sekian bulan sejak dibuka
    priceStep: 0.1,                // langkah harga +/- 10%
    priceMinMult: 0.5,             // harga boleh 50%..300% dari harga dasar tier
    priceMaxMult: 3.0,
    commissionStep: 0.02,
    commissionMin: 0.15,
    commissionMax: 0.30,
    commissionDefault: 0.20,
    demandPerScore: 0.06,          // lock-in maksimum: +6% permintaan ponsel
    competitorReliefPerScore: 0.15,// lock-in maksimum: tekanan kompetitor turun 15%

    // App Store
    appStoreBugId: 'bug_appstore_fail',
    appStoreFeatureId: 'fw_appstore',
    storeMinYear: 2008,
    storeSpendBase: 0.6,           // USD belanja per pengguna aktif per bulan (awal)
    storeEraGrowth: 0.08,          // belanja naik 8% per tahun sejak 2008
    storeEraCap: 3,                // maks. pengali belanja 3x
    storeAppealBase: 0.2,          // komisi dasar yang dianggap "netral" bagi pengembang
    storeAppealSlope: 1.5,         // komisi di atas dasar menurunkan daya tarik (aplikasi berkurang)
    storeAppealMin: 0.6,
    storeAppealMax: 1.1,
    storeFixedMonthly: 4000,       // biaya operasi toko per bulan (ikut skala)
    storeIncentiveRate: 0.06,      // insentif pengembang: fraksi dari belanja kotor
    storeUsersForFullScore: 2000000,
    storeQualityMin: 0.5,
    bugSeverityPenalty: 0.05,      // kualitas toko turun per tingkat keparahan bug OS aktif
    bugAppStorePenalty: 0.2       // bug khusus App Store menurunkan kualitas toko
};

export const ECO_TIERS = ['basic', 'mid', 'premium'];

// priceMult = pengali terhadap refPrice lini; costRatio = HPP per unit / harga dasar tier;
// attachMult = pengali tingkat pasang (tier mahal dibeli lebih sedikit orang, tetapi kualitasnya lebih baik).
export const ECO_TIER_META = {
    basic:   { nameKey: 'eco.tier.basic',   priceMult: 0.5, costRatio: 0.55, attachMult: 0.8 },
    mid:     { nameKey: 'eco.tier.mid',     priceMult: 1.0, costRatio: 0.60, attachMult: 1.0 },
    premium: { nameKey: 'eco.tier.premium', priceMult: 2.0, costRatio: 0.65, attachMult: 1.15 }
};

// attach      : porsi basis ponsel aktif yang membeli per bulan (sebelum faktor harga & kepuasan)
// setup       : biaya pembukaan lini (dikali akar skala perusahaan)
// monthlyFixed: biaya tetap lini per bulan (dikali akar skala perusahaan)
// elasticity  : seberapa sensitif permintaan terhadap harga
export const ECO_LINES = [
    { id: 'earbuds', nameKey: 'eco.line.name.earbuds', minYear: 2004,
      refPrice: 60,  setup: 18000, monthlyFixed: 1200, attach: 0.004,  elasticity: 0.9 },
    { id: 'watch',   nameKey: 'eco.line.name.watch',   minYear: 2014,
      refPrice: 180, setup: 60000, monthlyFixed: 2500, attach: 0.0012, elasticity: 0.8 },
    { id: 'charger', nameKey: 'eco.line.name.charger', minYear: 2000,
      refPrice: 35,  setup: 8000,  monthlyFixed: 400,  attach: 0.012,  elasticity: 1.0 }
];

export function getEcoLine(id) {
    for (var i = 0; i < ECO_LINES.length; i++) if (ECO_LINES[i].id === id) return ECO_LINES[i];
    return null;
}

export function tierBasePrice(line, tier) {
    var m = ECO_TIER_META[tier] || ECO_TIER_META.mid;
    return line.refPrice * m.priceMult;
}
