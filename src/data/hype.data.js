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
