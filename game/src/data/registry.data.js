// FILE: src/data/registry.data.js  (BARU)
// ============================================================
// Registry (tahap 2, di kartu Registrar panel Future): pemain melamar ekstensi domain sendiri.
// FAKTA: biaya evaluasi ICANN putaran 2012 $185.000; biaya tetap registry $25.000/tahun; putaran baru dibuka 2012.
// ANGKA DESAIN (boleh disetel): semua peluang, durasi, tarif sponsor, lelang NPC, batas domain, harga, biaya operasi.
// Teks ada di i18n (registry.*), bukan di sini.
// ============================================================
export const REGISTRY_CONFIG = {
    unlockYear: 2012,
    applicationFee: 185000,          // fakta (putaran 2012), tidak kembali kecuali mundur saat kontensi
    annualFee: 25000,                // fakta: biaya tetap registry ke ICANN per tahun
    opexMonthly: 6000,               // desain: biaya backend registry per bulan
    // Sponsor (pihak lain yang mendukung lamaran)
    sponsorMax: 3, sponsorCost: 15000,
    // Evaluasi
    evalBase: 0.70, evalPerSponsor: 0.05, evalSponsorCap: 0.85, evalCashBonus: 0.05, evalCashMult: 3,
    evalExpBonus: 0.05, evalExpYears: 2, evalCap: 0.95,
    evalMonths: 12, reviseChance: 0.20, reviseMonths: 3,
    // Keberatan
    objectBase: 0.15, objectPerSponsor: 0.05, objectMonths: 6, objectWin: 0.40,
    // Kontensi + lelang
    contention: { popular: 0.35, niche: 0.10, brand: 0 },
    npcBidMin: 400000, npcBidMax: 3000000, auctionMonthsMin: 6, auctionMonthsMax: 12,
    withdrawRefund: 0.70, decideDays: 30,
    bidOptions: [500000, 1000000, 2000000, 3000000],
    // Kontrak & peluncuran
    offerDays: 30,
    techMonths: 3, techFail: 0.05, techRetryMonths: 2,
    sunriseMonths: 2, landrushMonths: 1,
    maxMonths: 36, reapplyAfterMonths: 3,
    // Pasar ekstensi: cap domain (dunia, sebelum economyScale), harga per domain/tahun, kecepatan tumbuh
    economyScale: 0.25,
    types: {
        popular: { cap: 600000, price: 14, growth: 0.05 },
        niche:   { cap: 80000,  price: 22, growth: 0.04 },
        brand:   { cap: 2000,   price: 0,  growth: 0.10, repGain: 4 }
    },
    sunriseFrac: 0.05, landrushFrac: 0.25   // porsi cap yang terisi saat sunrise / landrush
};

// Ekstensi yang bisa dilamar. Nama sengaja prasetel (tanpa kolom ketik) supaya kontensi jelas.
export const REGISTRY_EXTENSIONS = [
    { id: 'web',   ext: '.web',   type: 'popular' },
    { id: 'online',ext: '.online',type: 'popular' },
    { id: 'tech',  ext: '.tech',  type: 'niche' },
    { id: 'shop',  ext: '.shop',  type: 'niche' },
    { id: 'music', ext: '.music', type: 'niche' },
    { id: 'brand', ext: '.brand', type: 'brand' }
];
