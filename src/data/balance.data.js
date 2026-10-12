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
        rentHQ: 5000,         // sewa kantor pusat
        utilities: 500,        // listrik, internet, dll
        baseAdmin: 300         // administrasi
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
    taxRate: 0.15, // dipakai jika difficultyMultiplier tidak menimpa

    // ---- Pinjaman bank ----
    loans: [
        { id: 'small',  label: 'Pinjaman Kecil',  principal:  50000, monthlyInterestRate: 0.03, termMonths: 12 },
        { id: 'medium', label: 'Pinjaman Sedang', principal: 100000, monthlyInterestRate: 0.04, termMonths: 18 },
        { id: 'large',  label: 'Pinjaman Besar',  principal: 200000, monthlyInterestRate: 0.05, termMonths: 24 }
    ],

    // ---- Game over ----
    gameOverNegativeMonths: 2,
    burnRateWarnThreshold: 2, // beri peringatan jika cash < N bulan biaya

    // ---- Log ----
    maxLogEntries: 100,       // simpan 100 terbaru
    maxMilestones: 200,

    // ---- Quest awal (sebagian dikelola QuestSystem) ----
    questRewards: {
        first_start_research: { cash: 2000, reputation: 1 },
        first_recruit:        { cash: 1500, reputation: 0 },
        first_product:        { cash: 5000, reputation: 3 }
    }
};
