// FILE: src/data/ecosystem.data.js  (BARU — ekosistem: aksesori & App Store)
// ============================================================
// Angka dasar ekosistem. Semua nilai uang dalam USD (sama seperti WalletService).
// Target keseimbangan: pendapatan ekosistem penuh ±15–25% pendapatan ponsel di akhir permainan (0.2.8; probe browser: ±17% di 2026, ponsel $250),
// margin kotor lini 35–55%. Dikalibrasi di 0.2.6 dengan tools/eco-calib.mjs (sistem permainan asli).
// Plafon referensi: Apple FY2025 (10-K) Wearables/Home/Accessories = 17% dan Services = 52% dari
// pendapatan iPhone; itu batas atas industri, bukan target pemain biasa.
// ============================================================

export const ECO_CONST = {
    fixedScaleExp: 0.3,            // 0.2.8: biaya tetap bulanan dikali skala^0.3 (sebelumnya akar kuadrat)
    maxAttachShare: 0.12,          // batas unit aksesori per bulan = 5% basis ponsel aktif
    lineAttachScale: 1.7,         // kalibrasi 0.2.6: pengali tingkat pasang semua lini aksesori (lihat tools/eco-calib.mjs)
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
    // Bobot skor lock-in (total 1.0). Sebelum layanan ada: 0.5 lini + 0.5 App Store.
    scoreWeightLines: 0.4,
    scoreWeightStore: 0.4,
    scoreWeightServices: 0.2,
    demandPerScore: 0.06,          // lock-in maksimum: +6% permintaan ponsel
    competitorReliefPerScore: 0.15,// lock-in maksimum: tekanan kompetitor turun 15%

    // App Store
    appStoreBugId: 'bug_appstore_fail',
    appStoreFeatureId: 'fw_appstore',
    storeMinYear: 2008,
    storeSpendBase: 2.1,           // USD belanja per pengguna aktif per bulan (awal); 0.6 sebelum kalibrasi 0.2.6
    storeEraGrowth: 0.08,          // belanja naik 8% per tahun sejak 2008
    storeEraCap: 3,                // maks. pengali belanja 3x
    storeAppealBase: 0.2,          // komisi dasar yang dianggap "netral" bagi pengembang
    storeAppealSlope: 1.5,         // komisi di atas dasar menurunkan daya tarik (aplikasi berkurang)
    storeAppealMin: 0.6,
    storeAppealMax: 1.1,
    storeFixedMonthly: 1200,       // biaya operasi toko per bulan (ikut skala); 4000 sebelum kalibrasi 0.2.6
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
      refPrice: 60,  setup: 18000, monthlyFixed: 360, attach: 0.004,  elasticity: 0.9 },
    { id: 'watch',   nameKey: 'eco.line.name.watch',   minYear: 2014,
      refPrice: 180, setup: 60000, monthlyFixed: 750, attach: 0.0012, elasticity: 0.8 },
    { id: 'charger', nameKey: 'eco.line.name.charger', minYear: 2000,
      refPrice: 35,  setup: 8000,  monthlyFixed: 120,  attach: 0.012,  elasticity: 1.0 }
];

export function getEcoLine(id) {
    for (var i = 0; i < ECO_LINES.length; i++) if (ECO_LINES[i].id === id) return ECO_LINES[i];
    return null;
}

export function tierBasePrice(line, tier) {
    var m = ECO_TIER_META[tier] || ECO_TIER_META.mid;
    return line.refPrice * m.priceMult;
}

// ============================================================
// Layanan berlangganan (Cloud dan Asisten AI). Model sama dengan lini aksesori,
// tetapi pendapatannya berupa langganan per pengguna per bulan.
//
// baseBy      : 'phones' (basis ponsel aktif) atau 'os' (pengguna OS aktif)
// refPrice    : harga langganan standar per bulan (USD); tier lain mengalikannya
// unitCostRatio: HPP per pelanggan per bulan / refPrice (server, inferensi AI)
// requiredFeatureId: fitur OS yang harus ada di versi OS yang dipakai
// ============================================================
export const ECO_SERVICES = [
    { id: 'cloud', nameKey: 'eco.svc.name.cloud', descKey: 'eco.svc.desc.cloud', minYear: 2012,
      requiredFeatureId: 'fw_cloud_sync', baseBy: 'phones',
      refPrice: 2, setup: 40000, monthlyFixed: 450, attach: 0.10, elasticity: 1.2, unitCostRatio: 0.35 },
    { id: 'ai',    nameKey: 'eco.svc.name.ai',    descKey: 'eco.svc.desc.ai',    minYear: 2023,
      requiredFeatureId: 'fw_ai_on_device', baseBy: 'os',
      refPrice: 4, setup: 60000, monthlyFixed: 900, attach: 0.09, elasticity: 0.9, unitCostRatio: 0.5 }
];

export const SERVICE_TIERS = ['free', 'standard', 'premium'];

// priceMult  : pengali harga terhadap refPrice (free = 0, tidak ada harga)
// costMult   : pengali HPP per pelanggan (free tetap menanggung biaya server)
// attachMult : pengali tingkat langganan (free paling banyak dipakai)
export const SERVICE_TIER_META = {
    free:     { nameKey: 'eco.svc.tier.free',     priceMult: 0,   costMult: 0.5, attachMult: 1.8 },
    standard: { nameKey: 'eco.svc.tier.standard', priceMult: 1,   costMult: 1.0, attachMult: 1.0 },
    premium:  { nameKey: 'eco.svc.tier.premium',  priceMult: 2.5, costMult: 1.4, attachMult: 0.6 }
};

export function getEcoService(id) {
    for (var i = 0; i < ECO_SERVICES.length; i++) if (ECO_SERVICES[i].id === id) return ECO_SERVICES[i];
    return null;
}

export function serviceTierBasePrice(svc, tier) {
    var m = SERVICE_TIER_META[tier] || SERVICE_TIER_META.standard;
    return svc.refPrice * m.priceMult;
}

