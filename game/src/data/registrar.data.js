// FILE: src/data/registrar.data.js  (BARU)
// ============================================================
// Registrar (panel Future): angka & tabel. Semua teks ada di i18n (registrar.i18n.js), bukan di sini.
//
// FAKTA (dari riset): urutan proses akreditasi ICANN, biaya lamar $3.500, modal kerja $70.000,
// biaya tahunan $4.000, biaya transaksi ~$0,18, akreditasi berlaku 5 tahun, harga grosir .com
// ($7,85 pada 2012-2021, $9,59 -> $10,26 pada 2024, $10,97 mulai 1 Nov 2026), total domain dunia.
// ANGKA DESAIN (bukan fakta, boleh disetel): semua peluang, durasi review, batas pangsa, laju pertumbuhan,
// skor kepatuhan, tarif staf kepatuhan, deposit registry.
// ============================================================

export const REGISTRAR_CONFIG = {
    // ---- Pembukaan ----
    resellerYear: 2000,                                   // reseller: tanpa akreditasi
    registrarUnlock: { year: 2003, research: 'net_3g' },  // registrar: dikunci ke 3G (riset itu baru bisa selesai 2005)

    // ---- Pengajuan (fakta + desain) ----
    applicationFee: 3500,       // fakta: tidak dikembalikan
    workingCapital: 70000,      // fakta: modal kerja yang harus tersedia di kas
    insurancePremium: 6000,     // per tahun (perkiraan); wajib aktif saat mengajukan
    annualFee: 4000,            // fakta: biaya tahunan akreditasi
    perTxFee: 0.18,             // fakta: biaya ICANN per registrasi/perpanjangan/transfer (USD)
    termYears: 5,               // fakta: akreditasi berlaku 5 tahun

    // ---- Review (desain) ----
    reviewMonths: 2, reviewJitter: 1,   // 2 bulan, +-1
    reviseChance: 0.25, reviseExtraMonths: 1, reviseDeadlineDays: 30,
    rejectBase: 0.05, rejectThinCash: 0.15, rejectViolation: 0.20, rejectLowRep: 0.10, rejectCap: 0.60,
    thinCashMult: 1.5,          // kas < 1,5x syarat = tipis
    lowRepBelow: 40,
    reapplyAfterMonths: 3,      // setelah ditolak
    offerDays: 30,              // tawaran kontrak kedaluwarsa

    // ---- Operasional ----
    fixedMonthly: 900,          // dikali skala^0,3 seperti ekosistem
    fixedScaleExp: 0.3,
    scaleBase: 30000, scaleMax: 300,     // sama dengan EcosystemSystem
    renewRejectBase: 0.03, renewRejectPerWarning: 0.10,

    // ---- Registry (onboarding per ekstensi) ----
    registryOnboardMonths: 1,
    registryDeposit: 5000,      // deposit grosir minimal, tertahan (tidak habis)

    // ---- Harga jual ----
    markup: 1.3,                // harga default = (grosir + biaya transaksi) x 1,3
    priceMultMin: 0.5, priceMultMax: 2.0, priceMultStep: 0.1, priceCooldownMonths: 3,

    // ---- Pangsa pasar ----
    // Desain awal: 0,25 poin/bulan, maksimal 12%. Dokumen mensyaratkan kalibrasi: pendapatan domain 2026 <= ~8% pendapatan ponsel.
    // 12% terlalu besar untuk ekonomi game, jadi diturunkan ke 5% (rencana cadangan di dokumen desain).
    resellerShareGrow: 0.10, resellerShareCap: 0.02,       // dalam poin persen / bulan, dan batas (pecahan)
    registrarShareGrow: 0.25, registrarShareCap: 0.05,
    // Skala ekonomi game: domain nyata = jutaan; angka ini menjaga domain sebagai bonus, bukan mesin uang utama.
    economyScale: 0.25,         // BELUM dikalibrasi dengan bot simulasi (tools/eco-calib.mjs); target: domain 2026 <= ~8% pendapatan ponsel
    priceElasticity: 0.6,       // harga di atas default memperlambat pertumbuhan, di bawah mempercepat

    // ---- Kepatuhan (desain) ----
    abuseChance: 0.015,         // per bulan
    abusePolicyMult: { open: 1.3, balanced: 1.0, strict: 0.7 },
    abuseHandleCost: 800,       // per laporan yang ditangani
    pointsAudit: 3, pointsRevoke: 6, pointDecayMonths: 3,
    staffCost: 4500, staffMax: 2, staffReduction: 0.30,   // per staf kepatuhan, per bulan
    capitalShortfallPoints: 1,  // kas di bawah modal kerja tertahan: +1 poin/bulan
    repHitAudit: 3, repHitRevoked: 10, sentimentHitAbuse: 2,

    // ---- Tahun reseller: margin lebih tipis ----
    resellerCostMult: 1.12      // reseller membeli dari registrar dengan harga 12% di atas grosir
};

// Registry yang bisa dihubungi. 'com' saja untuk sekarang; ekstensi pemain menyusul di tahap Registry.
export const REGISTRIES = [
    { id: 'com', ext: '.com', share: 0.52 }   // share = porsi .com dari total domain dunia (perkiraan, desain)
];

// Total domain dunia (juta). Terverifikasi: 2005, 2007-2011, 2020, 2025. Selain itu perkiraan/interpolasi (lihat dokumen desain).
export const DOMAIN_MARKET_CURVE = [
    [2000, 32], [2001, 33], [2002, 40], [2004, 65], [2005, 94], [2006, 120], [2007, 153], [2008, 177],
    [2009, 192], [2010, 205.3], [2011, 225], [2020, 366.3], [2025, 386.9], [2030, 400]
];

// Harga grosir .com (USD). [tahun, bulan, harga]. Sebelum 2012 ~ $7 (perkiraan); 2022-2023 diinterpolasi (belum terverifikasi).
export const COM_WHOLESALE_STEPS = [
    [2000, 1, 7.00], [2012, 1, 7.85], [2022, 1, 8.80], [2023, 1, 9.59], [2024, 1, 10.26], [2026, 11, 10.97]
];

export function getWholesalePrice(year, month) {
    var abs = year * 12 + (month || 1), price = COM_WHOLESALE_STEPS[0][2];
    for (var i = 0; i < COM_WHOLESALE_STEPS.length; i++) {
        var s = COM_WHOLESALE_STEPS[i];
        if (abs >= s[0] * 12 + s[1]) price = s[2];
    }
    return price;
}

// Total domain dunia (juta) untuk satu tahun/bulan: interpolasi linear antar titik kurva.
export function getTotalDomainsMillions(year, month) {
    var x = year + ((month || 1) - 1) / 12, c = DOMAIN_MARKET_CURVE;
    if (x <= c[0][0]) return c[0][1];
    for (var i = 1; i < c.length; i++) {
        if (x <= c[i][0]) {
            var a = c[i - 1], b = c[i], f = (x - a[0]) / (b[0] - a[0]);
            return a[1] + (b[1] - a[1]) * f;
        }
    }
    return c[c.length - 1][1];
}
