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
