// FILE: src/data/annual-review.data.js  (BARU — Rapor Tahunan + Target Dewan)
// ============================================================
// Semua angka balance Rapor Tahunan ada di sini. Ubah di file ini saja;
// sistem (AnnualReviewSystem) dan UI (AnnualReviewModal) tidak menyimpan angka.
//
// Konsep:
//   - Tiap tahun dewan memberi 3 target: omzet setahun, rata-rata pangsa pasar,
//     dan kekayaan bersih akhir tahun.
//   - Tiap 1 Januari game menutup rapor tahun lalu: nilai S/A/B/C/D dari rata-rata
//     capaian target, hadiah atau hukuman, lalu pemain memilih 1 Fokus Strategis.
//   - Fokus Strategis memberi bonus sekaligus harga yang harus dibayar, termasuk
//     menaikkan target dewan tahun berikutnya.
//
// Satuan uang: USD. Nilai "base" dikalikan skala bisnis (lihat `scale` di sistem:
// rata-rata omzet bulanan / SCALE_BASE_REVENUE, dijepit 1..SCALE_MAX) supaya hadiah
// dan biaya tetap relevan di tahun 2000 maupun 2025.
// ============================================================

export const SCALE_BASE_REVENUE = 30000;  // omzet bulanan yang dianggap skala 1x (sama dengan insiden dinamis)
export const SCALE_MAX = 300;

export const ANNUAL_CONFIG = {
    // Rapor pertama hanya memberi hadiah, tanpa hukuman (tahun perkenalan).
    graceReports: 1,
    historyMax: 50,

    // ---------------- Target dewan
    // Tahun pertama (belum ada riwayat): angka dasar per tingkat kesulitan.
    firstYear: {
        revenue:  { santai: 60000,  normal: 90000,  sulit: 120000 },   // omzet setahun
        share:    { santai: 0.002,  normal: 0.003,  sulit: 0.004 },    // rata-rata pangsa pasar (0.003 = 0,3%)
        netWorthFactor: 0.6      // kekayaan bersih akhir tahun >= 60% dari awal (tahun investasi boleh boros)
    },
    // Tahun berikutnya: target = capaian tahun lalu x pengali pertumbuhan.
    growth: {
        revenue:  { santai: 1.08, normal: 1.15, sulit: 1.25 },
        share:    { santai: 1.05, normal: 1.12, sulit: 1.20 }
    },
    // Kekayaan bersih tahun ke-N: target = kekayaan bersih awal tahun x faktor ini.
    netWorthFactorByIndex: [0.6, 0.9, 1.05],   // tahun ke-1, ke-2, ke-3 dan seterusnya (indeks terakhir dipakai ulang)
    // Lantai supaya target tak jatuh ke 0 ketika tahun lalu buruk.
    floors: {
        revenue: { santai: 40000, normal: 60000, sulit: 80000 },
        share:   0.001
    },

    // ---------------- Nilai rapor: rata-rata capaian (aktual / target, tiap target dijepit 0..2)
    grades: [
        { id: 'S', min: 1.25 },
        { id: 'A', min: 1.00 },
        { id: 'B', min: 0.80 },
        { id: 'C', min: 0.50 },
        { id: 'D', min: 0    }
    ],

    // Hadiah/hukuman per nilai. cash = base x skala. demand = pengali permintaan sementara.
    gradeEffects: {
        S: { cash: 12000, reputation: 4,  demand: [] },
        A: { cash: 6000,  reputation: 2,  demand: [] },
        B: { cash: 0,     reputation: 0,  demand: [] },
        C: { cash: 0,     reputation: -1, demand: [] },
        D: { cash: 0,     reputation: -3, demand: [{ scope: 'all', mult: 0.95, days: 90 }] }
    },
    // Selama masa percobaan, hanya bagian positif dari efek nilai yang berlaku.
    graceKeepsOnlyPositive: true,

    // ---------------- Rival Tahunan (target ke-4)
    // Tiap tahun dewan menunjuk satu pesaing: pangsa pasar rata-ratamu harus melewati pangsa rata-rata rival
    // di tahun yang sama. Rival = pesaing terdekat di atasmu (sulit: satu tingkat lebih jauh di atas);
    // bila kamu sudah #1, rivalnya pesaing terkuat.
    rival: {
        enabled: true,
        minShare: 0.0005,                                  // abaikan merek yang pangsanya di bawah 0,05% (bila masih ada pilihan lain)
        skipAbove: { santai: 0, normal: 0, sulit: 1 },     // berapa tingkat dilewati di atas pemain
        // Bonus tambahan bila rival dikalahkan (dijumlahkan dengan hadiah nilai; kas x skala bisnis)
        winEffects: { cash: 4000, reputation: 2 }
    }
};

export const GRADE_TEXT = {
    S: { id: 'Luar biasa. Dewan berdiri memberi tepuk tangan.',            en: 'Outstanding. The board gives you a standing ovation.' },
    A: { id: 'Target tercapai. Dewan puas dengan arah perusahaan.',          en: 'Targets met. The board is happy with the direction.' },
    B: { id: 'Hampir. Dewan masih percaya, tapi minta lebih tahun depan.',   en: 'Close. The board still trusts you but wants more next year.' },
    C: { id: 'Meleset cukup jauh. Dewan mulai mempertanyakan strategimu.',   en: 'A clear miss. The board starts questioning your strategy.' },
    D: { id: 'Jauh dari target. Investor gelisah dan pasar ikut ragu.',      en: 'Far off target. Investors are nervous and the market hesitates.' }
};

// ---------------------------------------------------------------- Fokus Strategis
// effects: cash (+/- x skala), reputation, demand [{scope, mult, days}] (scope: all|budget|premium|color|camera)
// cost: biaya di muka (x skala), dibayar lewat WalletService.
// targetMult: pengali target dewan tahun berikutnya { revenue, share, netWorth }.
// Selalu ada satu fokus gratis (cost 0) supaya pemain tak pernah terkunci.
export const FOCUS_OPTIONS = [
    {
        id: 'efficiency',
        cost: 0,
        label:   { id: 'Efisiensi',  en: 'Efficiency' },
        tagline: { id: 'Kencangkan ikat pinggang, amankan kas.', en: 'Tighten the belt and protect cash.' },
        outcome: { id: 'Anggaran dipangkas dan pemborosan dihentikan. Kas lebih tebal, tapi pasar premium terasa kurang diurus.',
                   en: 'Budgets are trimmed and waste is cut. Cash is healthier, but the premium market feels neglected.' },
        effects: { cash: 5000, reputation: 0, demand: [{ scope: 'premium', mult: 0.95, days: 365 }] },
        targetMult: { revenue: 1, share: 1, netWorth: 1.10 }
    },
    {
        id: 'innovation',
        cost: 6000,
        label:   { id: 'Inovasi',    en: 'Innovation' },
        tagline: { id: 'Investasi di produk unggulan.', en: 'Invest in flagship products.' },
        outcome: { id: 'Tim R&D diberi ruang dan anggaran. Ponsel premium jadi bahan pembicaraan, tapi biayanya tidak murah.',
                   en: 'R&D gets room and budget. Premium phones become the talk of the town, but it is not cheap.' },
        effects: { cash: 0, reputation: 3, demand: [{ scope: 'premium', mult: 1.10, days: 365 }] },
        targetMult: { revenue: 1, share: 1, netWorth: 1 }
    },
    {
        id: 'expansion',
        cost: 4000,
        label:   { id: 'Ekspansi',   en: 'Expansion' },
        tagline: { id: 'Kejar pasar sebesar mungkin.', en: 'Chase as much market as possible.' },
        outcome: { id: 'Kamu menancapkan gas: distribusi dan promosi diperluas. Permintaan naik, tetapi dewan menaikkan target omzet dan pangsa pasar.',
                   en: 'You hit the gas: distribution and promotion widen. Demand rises, but the board raises revenue and share targets.' },
        effects: { cash: 0, reputation: 0, demand: [{ scope: 'all', mult: 1.05, days: 365 }] },
        targetMult: { revenue: 1.10, share: 1.10, netWorth: 1 }
    }
];

export function getFocusById(id) {
    for (var i = 0; i < FOCUS_OPTIONS.length; i++) if (FOCUS_OPTIONS[i].id === id) return FOCUS_OPTIONS[i];
    return null;
}

// Nama target untuk UI (id/en) dan jenis format nilainya.
export const TARGET_META = {
    revenue:  { kind: 'money',   label: { id: 'Omzet setahun',             en: 'Annual revenue' } },
    share:    { kind: 'percent', label: { id: 'Rata-rata pangsa pasar',    en: 'Average market share' } },
    netWorth: { kind: 'money',   label: { id: 'Kekayaan bersih akhir tahun', en: 'Year-end net worth' } },
    // Target rival: nama rival ditambahkan UI ("Kalahkan Nokia"); nilainya pangsa pasar rata-rata.
    rival:    { kind: 'percent', label: { id: 'Kalahkan ', en: 'Beat ' } }
};
export const TARGET_KEYS = ['revenue', 'share', 'netWorth'];
