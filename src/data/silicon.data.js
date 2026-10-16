// FILE: src/data/silicon.data.js
// ============================================================
// Data ekonomi Silicon (SIL): harga fitur, paket top-up, slot metode bayar.
// Semua angka balancing ada di sini (bukan di logic/UI).
// ============================================================

// ---------- HARGA FITUR ----------
export const SILICON_COSTS = {
    // Percepatan waktu (2x / 5x / 10x) — WAJIB bayar SIL.
    // Tiap pembelian = `cost` SIL untuk satu paket waktu (`seconds` detik NYATA,
    // hanya berkurang saat game berjalan / tidak pause). Setelah habis, kembali ke 1x.
    // Beli lagi saat boost aktif = waktu ditambah (nilai sisa dikonversi bila ganti kecepatan).
    // maxSeconds = batas total waktu boost yang boleh ditimbun.
    speed: {
        cost: 10,
        maxSeconds: 1800,
        packs: {
            2:  { seconds: 300 },   // 10 SIL = 5 menit nyata  (~10 hari game)
            5:  { seconds: 180 },   // 10 SIL = 3 menit nyata  (~15 hari game)
            10: { seconds: 120 }    // 10 SIL = 2 menit nyata  (~20 hari game)
        }
    },

    // Unlock riset = bayar SIL sebagai pengganti uang tunai ($).
    // Syarat tahun & prasyarat riset TETAP berlaku (tidak bisa loncat era).
    // cost = clamp(durasi × unlockPerDay, unlockMin, unlockMax)
    research: {
        unlockPerDay: 0.5,
        unlockMin: 5,
        unlockMax: 80,
        // Boost progress: berapa hari progress per paket boost + harga per hari.
        boostDays: 7,
        boostPerDay: 0.5,
        boostMin: 3,
        // Selesaikan sekarang: harga per hari tersisa.
        finishPerDay: 0.4,
        finishMin: 2,
        finishMax: 80
    }
};

// ---------- PAKET TOP-UP ----------
// icon = id ikon di src/ui/icons/GameIcons.js (bukan emoji).
// priceIdr / priceUsd = harga tampil. bonus = SIL tambahan (promo).
export const SILICON_PACKAGES = [
    { id: 'pkg_s',  icon: 'gem-s', sil: 50,   bonus: 0,    priceIdr: 15000,  priceUsd: 0.99,  tag: null },
    { id: 'pkg_m',  icon: 'gem-m', sil: 120,  bonus: 10,   priceIdr: 35000,  priceUsd: 2.49,  tag: null },
    { id: 'pkg_l',  icon: 'gem-l', sil: 300,  bonus: 45,   priceIdr: 79000,  priceUsd: 5.49,  tag: 'popular' },
    { id: 'pkg_xl', icon: 'gem-xl', sil: 700,  bonus: 140,  priceIdr: 169000, priceUsd: 11.99, tag: null },
    { id: 'pkg_xxl',icon: 'gem-xxl', sil: 1500, bonus: 400,  priceIdr: 329000, priceUsd: 22.99, tag: 'best' }
];

// ---------- SLOT METODE PEMBAYARAN ----------
// Setiap slot dikaitkan ke satu `provider`. Slot AKTIF hanya jika provider
// terdaftar lewat PaymentService.registerProvider(). Selama belum, tampil "Segera".
// group: 'ewallet' | 'qris' | 'bank' | 'card' | 'store' | 'sandbox'
export const PAYMENT_METHODS = [
    { id: 'gopay',    group: 'ewallet', icon: 'wallet', name: 'GoPay',            provider: 'gopay' },
    { id: 'ovo',      group: 'ewallet', icon: 'wallet-cards', name: 'OVO',              provider: 'ovo' },
    { id: 'dana',     group: 'ewallet', icon: 'phone-pay', name: 'DANA',             provider: 'dana' },
    { id: 'shopeepay',group: 'ewallet', icon: 'bag', name: 'ShopeePay',        provider: 'shopeepay' },
    { id: 'qris',     group: 'qris',    icon: 'qr', name: 'QRIS',             provider: 'qris' },
    { id: 'va',       group: 'bank',    icon: 'bank', name: 'Virtual Account',  provider: 'va' },
    { id: 'card',     group: 'card',    icon: 'card', name: 'Kartu Kredit/Debit', provider: 'card' },
    { id: 'gplay',    group: 'store',   icon: 'play-store', name: 'Google Play',      provider: 'gplay' },
    { id: 'appstore', group: 'store',   icon: 'app-store', name: 'App Store',        provider: 'appstore' },
    // Hanya muncul saat DEV_BUILD + dev mode aktif.
    { id: 'sandbox',  group: 'sandbox', icon: 'flask', name: 'Sandbox (Dev)',    provider: 'sandbox', devOnly: true }
];

export const PAYMENT_GROUPS = ['ewallet', 'qris', 'bank', 'card', 'store', 'sandbox'];

export const MAX_ORDER_HISTORY = 20;
