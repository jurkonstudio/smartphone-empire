// FILE: src/data/silicon.data.js
// ============================================================
// Data ekonomi Silicon (SIL): harga fitur, paket top-up, slot metode bayar.
// Semua angka balancing ada di sini (bukan di logic/UI).
// ============================================================

// ---------- HARGA FITUR ----------
export const SILICON_COSTS = {
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
// priceIdr / priceUsd = harga tampil. bonus = SIL tambahan (promo).
export const SILICON_PACKAGES = [
    { id: 'pkg_s',  icon: '💎', sil: 50,   bonus: 0,    priceIdr: 15000,  priceUsd: 0.99,  tag: null },
    { id: 'pkg_m',  icon: '💎', sil: 120,  bonus: 10,   priceIdr: 35000,  priceUsd: 2.49,  tag: null },
    { id: 'pkg_l',  icon: '💠', sil: 300,  bonus: 45,   priceIdr: 79000,  priceUsd: 5.49,  tag: 'popular' },
    { id: 'pkg_xl', icon: '💠', sil: 700,  bonus: 140,  priceIdr: 169000, priceUsd: 11.99, tag: null },
    { id: 'pkg_xxl',icon: '🔷', sil: 1500, bonus: 400,  priceIdr: 329000, priceUsd: 22.99, tag: 'best' }
];

// ---------- SLOT METODE PEMBAYARAN ----------
// Setiap slot dikaitkan ke satu `provider`. Slot AKTIF hanya jika provider
// terdaftar lewat PaymentService.registerProvider(). Selama belum, tampil "Segera".
// group: 'ewallet' | 'qris' | 'bank' | 'card' | 'store' | 'sandbox'
export const PAYMENT_METHODS = [
    { id: 'gopay',    group: 'ewallet', icon: '🟢', name: 'GoPay',            provider: 'gopay' },
    { id: 'ovo',      group: 'ewallet', icon: '🟣', name: 'OVO',              provider: 'ovo' },
    { id: 'dana',     group: 'ewallet', icon: '🔵', name: 'DANA',             provider: 'dana' },
    { id: 'shopeepay',group: 'ewallet', icon: '🟠', name: 'ShopeePay',        provider: 'shopeepay' },
    { id: 'qris',     group: 'qris',    icon: '▦',  name: 'QRIS',             provider: 'qris' },
    { id: 'va',       group: 'bank',    icon: '🏦', name: 'Virtual Account',  provider: 'va' },
    { id: 'card',     group: 'card',    icon: '💳', name: 'Kartu Kredit/Debit', provider: 'card' },
    { id: 'gplay',    group: 'store',   icon: '▶',  name: 'Google Play',      provider: 'gplay' },
    { id: 'appstore', group: 'store',   icon: '🍎', name: 'App Store',        provider: 'appstore' },
    // Hanya muncul saat DEV_BUILD + dev mode aktif.
    { id: 'sandbox',  group: 'sandbox', icon: '🧪', name: 'Sandbox (Dev)',    provider: 'sandbox', devOnly: true }
];

export const PAYMENT_GROUPS = ['ewallet', 'qris', 'bank', 'card', 'store', 'sandbox'];

export const MAX_ORDER_HISTORY = 20;
