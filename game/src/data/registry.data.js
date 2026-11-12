// FILE: src/data/registry.data.js  (DIUBAH: putaran per tahun + sponsor kompetitor)
// ============================================================
// Registry (tahap 2, di kartu Registrar panel Future): pemain melamar ekstensi domain sendiri.
// FAKTA: putaran 2012 biaya evaluasi $185.000; biaya tetap registry $25.000/tahun.
// ANGKA SEMENTARA: putaran 2008 dan 2026 (biaya lamaran) perlu dicek ulang ke sumber resmi ICANN
//   dan dokumen desain. Putaran 2008 di dunia nyata hanya menetapkan aturan; pembukaan pelamaran 2012.
// ANGKA DESAIN (boleh disetel): semua peluang, durasi, bobot sponsor, lelang NPC, batas domain, harga, biaya operasi.
// Teks ada di i18n (registry.*), bukan di sini.
// ============================================================

// Putaran pelamaran. Putaran aktif = yang tahunnya paling baru <= tahun permainan.
// Lamaran menyimpan biaya putaran saat diajukan (app.fee), jadi putaran baru tidak mengubah lamaran lama.
export const REGISTRY_ROUNDS = [
    { year: 2008, applicationFee: 100000, fact: false },   // SEMENTARA: angka desain
    { year: 2012, applicationFee: 185000, fact: true },    // fakta
    { year: 2026, applicationFee: 227000, fact: false }    // SEMENTARA: cek ulang ke pengumuman ICANN 2026
];

// Nama perusahaan pihak ketiga (NPC) untuk keberatan/penawar bila tidak ada kompetitor yang cocok.
// Nama sengaja bahasa-netral (merek fiktif), tidak perlu diterjemahkan.
export const REGISTRY_NPC_APPLICANTS = ['Lumen Net', 'Corvid Domains', 'Brightline Co', 'Nexa Holdings'];

export const REGISTRY_CONFIG = {
    annualFee: 25000,                // fakta: biaya tetap registry ke ICANN per tahun
    opexMonthly: 6000,               // desain: biaya backend registry per bulan
    // Sponsor = perusahaan kompetitor yang mendukung lamaran (dipilih dari kompetitor aktif, bukan yang sudah menarik diri)
    sponsorMax: 3, sponsorCost: 15000,
    sponsorShareRef: 0.10,           // pangsa pasar kompetitor yang dianggap bobot 1,0
    sponsorWeightMin: 0.5, sponsorWeightMax: 1.5,
    // Evaluasi
    evalBase: 0.70, evalPerSponsor: 0.05, evalSponsorCap: 0.85, evalCashBonus: 0.05, evalCashMult: 3,
    evalExpBonus: 0.05, evalExpYears: 2, evalCap: 0.95,
    evalMonths: 12, reviseChance: 0.20, reviseMonths: 3,
    // Keberatan: dasar kecil + tiap kompetitor besar yang TIDAK menjadi sponsor bisa keberatan
    rivalMinShare: 0.08,             // pangsa minimal agar kompetitor dianggap pesaing besar
    objectBase: 0.05, objectPerRival: 0.04, objectCap: 0.30,
    objectMonths: 6, objectWin: 0.40,
    // Kontensi + lelang: penawar bisa kompetitor besar yang tidak jadi sponsor
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
