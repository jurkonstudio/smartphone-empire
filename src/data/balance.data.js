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
    },

    // ============================================================
    // PRODUK & PENJUALAN — ditambahkan pada Batch B
    // ============================================================
    products: {
        baseMarketDemand: {
            feature_phone:     5000,
            touch_revolution:  25000,
            modern_smartphone: 80000,
            ai_ecosystem:      200000
        },

        weights: {
            quality:    1.6,
            price:      1.2,
            reputation: 0.8,
            marketing:  0.6,
            os:         1.0,
            trend:      0.7
        },

        refs: {
            quality:    60,
            price:      150,
            reputation: 50,
            os:         60
        },

        lifecycle: {
            riseDays:     60,
            peakDays:     120,
            declineDays:  200,
            deadDays:     365,
            riseMult:     0.7,
            peakMult:     1.0,
            declineMult:  0.5,
            deadMult:     0.1
        },

        warehouseCostPerUnitPerDay: 0.02,
        productionSetupCost: 2000,
        dailyNoise: 0.12,
        discontinueDiscountPercent: 0.6,

        reviewThresholds: {
            excellent: 85,
            good:      70,
            average:   50,
            poor:      30,
            bad:       0
        },

        reputationPerReviewPoint: 0.4,
        maxActiveProducts: 5
    },

    // ============================================================
    // PASAR & KOMPETITOR — ditambahkan pada Batch B
    // ============================================================
    market: {
        startingReputation: 10,
        maxReputation: 100,
        minReputation: 0,

        baseCompetitorCount: 3,
        competitorAggressionMultiplier: {
            santai: 0.7,
            normal: 1.0,
            sulit:  1.4
        },

        trendsByEra: {
            feature_phone:    { camera: 0.3, battery: 0.5, screen: 0.2, performance: 0.2, design: 0.4 },
            touch_revolution: { camera: 0.5, battery: 0.4, screen: 0.6, performance: 0.5, design: 0.6 },
            modern_smartphone:{ camera: 0.7, battery: 0.6, screen: 0.5, performance: 0.8, design: 0.5 },
            ai_ecosystem:     { camera: 0.6, battery: 0.7, screen: 0.5, performance: 0.9, design: 0.5 }
        },

        trendVariationPerMonth: 0.05
    },

    // ============================================================
    // PEMASARAN — ditambahkan pada Batch B
    // ============================================================
    marketing: {
        perMarketerBonus: 0.1,
        maxMarketingFactor: 2.5
    },

    // ============================================================
    // ULASAN & REPUTASI — ditambahkan pada Batch B
    // ============================================================
    reviews: {
        initialWaveDays: 7,
        followUpDays: 30,
        maxReviewsInFeed: 30,
        perDayChance: 0.15
    }
};
