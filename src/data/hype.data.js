// FILE: src/data/hype.data.js  (BARU)
// ============================================================
// Angka keseimbangan siklus hype (HypeCycleSystem).
// Aturan: satu flagship per tahun kalender. Varian (Basic/Pro/Pro Max) ikut seri.
// Antisipasi meluruh lebih lambat dari buzz riset (buzz 0.80/bln), sehingga
// hype bertahan di antara dua peluncuran.
// Angka ini titik awal. Kalibrasi lewat simulasi sebelum dikunci.
// ============================================================
export const HYPE_BALANCE = {
    maxAnticipation: 60,      // batas stok antisipasi (poin)
    decayPerMonth: 0.93,      // peluruhan bulanan antisipasi
    minKeep: 0.5,             // di bawah ini dibulatkan ke 0
    demandPerPoint: 0.004,    // +0.4% permintaan per poin antisipasi
    maxDemandBonus: 0.25,     // bonus permintaan maksimum dari antisipasi

    launchSpike: 25,          // poin saat flagship dirilis
    teaserMonth: 6,           // bulan ke-N setelah rilis: teaser resmi
    teaserPoints: 6,
    leakMonth: 9,             // bulan ke-N setelah rilis: kebocoran acak
    leakChance: 0.5,          // peluang kebocoran positif
    leakPositive: 10,
    leakNegative: 8
};

// ---- v2: hype dipengaruhi OS & chip buatan sendiri ----
export const HYPE_QUALITY = {
    osStabilityScale: 200,    // stabilitas OS: (stabilitas - 50) / skala → pengaruh ke lonjakan
    osMax: 0.15,              // batas bonus/penalti dari stabilitas OS
    bugPenalty: 0.06,         // penalti per bug OS aktif (maks 3 bug)
    maxBugs: 3,
    thirdPartyOsPenalty: -0.10,   // OS pihak ketiga: lonjakan lebih kecil
    thirdPartyChipPenalty: -0.10, // chip pihak ketiga: lonjakan lebih kecil
    chipMax: 0.20,            // batas bonus/penalti dari keunggulan chip
    synergy: 0.10,            // OS + chip sendiri
    minSpikeMult: 0.4,
    maxSpikeMult: 1.5,
    teaserNoDevFactor: 0.3,   // belum ada desain dikembangkan: teaser tipis
    teaserThirdPartyFactor: 0.5, // desain dikembangkan tanpa OS/chip sendiri
    leakChipBonus: 0.2,       // peluang bocoran positif bila chip sendiri unggul
    leakBugPenalty: 0.2,      // peluang bocoran positif turun bila bug OS aktif
    leakMin: 0.1,
    leakMax: 0.9
};
