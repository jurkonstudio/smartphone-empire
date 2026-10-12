// FILE: src/data/balance.data.js
// Semua angka balancing di sini — ubah tanpa menyentuh logika.
// Satuan uang: USD. Satuan waktu: hari game (kecuali disebut lain).

export const BALANCE = {
    // ---- Modal awal per kesulitan ----
    startingCash: {
        santai: 200000,
        normal: 100000,
        sulit:   50000
    },

    // ---- Pengali efek kesulitan ----
    difficultyMultiplier: {
        santai: { expense: 0.8,  competitorAggression: 0.7, taxRate: 0.12 },
        normal: { expense: 1.0,  competitorAggression: 1.0, taxRate: 0.15 },
        sulit:  { expense: 1.3,  competitorAggression: 1.4, taxRate: 0.20 }
    },

    // ---- Biaya tetap bulanan ----
    monthly: {
        rentHQ: 5000,
        utilities: 500,
        baseAdmin: 300
    },

    // ---- Gaji bulanan per role ----
    salary: {
        engineer: 3000,
        designer: 2800,
        marketer: 2500
    },

    // ---- Biaya rekrut awal (one-time) ----
    recruitCost: {
        engineer: 2000,
        designer: 1800,
        marketer: 1500
    },

    // ---- Batas tim ----
    teamCap: {
        engineer: 20,
        designer: 20,
        marketer: 20
    },

    // ---- Pajak ----
    taxRate: 0.15,

    // ---- Pinjaman bank ----
    loans: [
        { id: 'small',  label: 'Pinjaman Kecil',  principal:  50000, monthlyInterestRate: 0.03, termMonths: 12 },
        { id: 'medium', label: 'Pinjaman Sedang', principal: 100000, monthlyInterestRate: 0.04, termMonths: 18 },
        { id: 'large',  label: 'Pinjaman Besar',  principal: 200000, monthlyInterestRate: 0.05, termMonths: 24 }
    ],

    // ---- Game over ----
    gameOverNegativeMonths: 2,
    burnRateWarnThreshold: 2,

    // ---- Log ----
    maxLogEntries: 100,
    maxMilestones: 200,

    // ---- Quest awal ----
    questRewards: {
        first_start_research: { cash: 2000, reputation: 1 },
        first_recruit:        { cash: 1500, reputation: 0 },
        first_product:        { cash: 5000, reputation: 3 }
    },

    // ============================================================
    // RISET — ditambahkan pada Batch A
    // ============================================================
    research: {
        baseSlots: 1,
        perEngineerSlots: 0.5,
        maxSlots: 3,

        baseSpeed: 1.0,
        perEngineerSpeed: 0.08,
        maxSpeedMultiplier: 2.5,

        refundPercent: 0.5
    },

    // ============================================================
    // OS — ditambahkan pada Batch A
    // ============================================================
    os: {
        baseFeatureSlots: 3,
        perEngineerFeatureSlots: 0.33,
        maxFeatureSlots: 8,

        baseSpeed: 1.0,
        perEngineerSpeed: 0.06,
        maxSpeedMultiplier: 2.0,

        baseBugChancePerDay: 0.02,

        appGrowthPerMonth: 5,
        appGrowthPerReputation: 0.5,
        appGrowthPerStability: 0.1,
        maxApps: 2000,

        refundPercent: 0.5,

        initialVersion: 'v1.0',
        minorVersionMax: 9,
        majorVersionStart: 1
    }
};
// ============================================================
// PRODUK & PENJUALAN — ditambahkan pada Batch B
// ============================================================
products: {
    // Ukuran basis pasar per era (unit per hari global).
    baseMarketDemand: {
        feature_phone:     5000,
        touch_revolution:  25000,
        modern_smartphone: 80000,
        ai_ecosystem:      200000
    },

    // Bobot tiap faktor permintaan (dikalikan, bukan dijumlahkan).
    // demand = baseDemand * quality^w1 * priceFactor^w2 * reputation^w3
    //          * marketingFactor^w4 * eraTrendFactor * osFactor
    //          * competitorPressureFactor * lifecycleFactor
    weights: {
        quality:    1.6,   // kualitas dominan
        price:      1.2,   // harga sensitif
        reputation: 0.8,   // reputasi moderat
        marketing:  0.6,   // pemasaran pendukung
        os:         1.0,   // OS penting
        trend:      0.7    // tren era
    },

    // Normalisasi: nilai-nilai dibagi dengan referensi untuk skala 0.5 - 1.5
    refs: {
        quality:    60,    // skor kualitas referensi (0-100)
        price:      150,   // harga rata-rata pasar dalam USD
        reputation: 50,    // reputasi referensi (0-100)
        os:         60     // skor OS rata-rata (0-100)
    },

    // Lifecycle product (dalam hari game sejak rilis)
    lifecycle: {
        riseDays:     60,     // fase naik
        peakDays:     120,    // fase puncak
        declineDays:  200,    // fase turun mulai
        deadDays:     365,    // tidak ada penjualan
        riseMult:     0.7,    // pengali fase naik
        peakMult:     1.0,
        declineMult:  0.5,
        deadMult:     0.1
    },

    // Biaya gudang per unit stok menganggur per hari
    warehouseCostPerUnitPerDay: 0.02,

    // Biaya setup produksi per order
    productionSetupCost: 2000,

    // Noise harian (0 = tanpa noise, 0.15 = fluktuasi ±15%)
    dailyNoise: 0.12,

    // Diskon saat discontinue (jual sisa stok)
    discontinueDiscountPercent: 0.6,

    // Skor ulasan — mapping kualitas ke rating 1-10
    reviewThresholds: {
        excellent: 85,   // 9-10
        good:      70,   // 7-8
        average:   50,   // 5-6
        poor:      30,   // 3-4
        bad:       0     // 1-2
    },

    // Reputasi impact dari ulasan (per poin rata-rata di atas 5)
    reputationPerReviewPoint: 0.4,

    // Batas atas jumlah model produk di katalog aktif
    maxActiveProducts: 5
},

// ============================================================
// PASAR & KOMPETITOR — ditambahkan pada Batch B
// ============================================================
market: {
    // Pangsa pasar dihitung bulanan.
    // sharePlayer = revenuePlayer / (revenuePlayer + sum(revenueCompetitor))

    // Reputasi awal
    startingReputation: 10,
    maxReputation: 100,
    minReputation: 0,

    // Kompetitor dasar (detail di competitors.data.js, Batch C)
    baseCompetitorCount: 3,
    competitorAggressionMultiplier: {
        santai: 0.7,
        normal: 1.0,
        sulit:  1.4
    },

    // Tren pasar per era (bobot 0-1, memengaruhi permintaan)
    // Nilai diupdate di MarketSystem._updateTrends() per era.
    trendsByEra: {
        feature_phone:    { camera: 0.3, battery: 0.5, screen: 0.2, performance: 0.2, design: 0.4 },
        touch_revolution: { camera: 0.5, battery: 0.4, screen: 0.6, performance: 0.5, design: 0.6 },
        modern_smartphone:{ camera: 0.7, battery: 0.6, screen: 0.5, performance: 0.8, design: 0.5 },
        ai_ecosystem:     { camera: 0.6, battery: 0.7, screen: 0.5, performance: 0.9, design: 0.5 }
    },

    // Variasi tren harian (0 = stabil, 0.2 = naik-turun cepat)
    trendVariationPerMonth: 0.05
},

// ============================================================
// PEMASARAN — ditambahkan pada Batch B
// ============================================================
marketing: {
    // Efek kampanye terhadap faktor pemasaran (0-1).
    // marketingFactor = 1 + sum(campaign.effectiveReach)
    // effectiveReach = reachBase * (1 + marketers * perMarketerBonus)
    perMarketerBonus: 0.1,
    maxMarketingFactor: 2.5
},

// ============================================================
// ULASAN & REPUTASI — ditambahkan pada Batch B
// ============================================================
reviews: {
    // Frekuensi ulasan baru muncul setelah rilis (dalam hari game)
    initialWaveDays: 7,        // ulasan pertama muncul dalam 7 hari
    followUpDays: 30,          // ulasan lanjutan
    maxReviewsInFeed: 30,
    perDayChance: 0.15         // 15% peluang ulasan baru per hari per produk
}
