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
        // [FREE BOOST] Jatah percepatan gratis: `freePerWindow` kali per `freeWindowHours` jam (waktu NYATA).
        // Hitungan mulai dari pemakaian gratis pertama; setelah window lewat, jatah kembali penuh.
        freePerWindow: 2,
        freeWindowHours: 24,
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
    // [LOCK] QRIS dikunci: Top Up hanya bisa lewat GoPay. Hapus `locked: true` untuk membuka lagi.
    { id: 'qris',     group: 'qris',    icon: 'qr', name: 'QRIS',             provider: 'qris', locked: true },
    { id: 'va',       group: 'bank',    icon: 'bank', name: 'Virtual Account',  provider: 'va' },
    { id: 'card',     group: 'card',    icon: 'card', name: 'Kartu Kredit/Debit', provider: 'card' },
    { id: 'gplay',    group: 'store',   icon: 'play-store', name: 'Google Play',      provider: 'gplay' },
    { id: 'appstore', group: 'store',   icon: 'app-store', name: 'App Store',        provider: 'appstore' },
    // Hanya muncul saat DEV_BUILD + dev mode aktif.
    { id: 'sandbox',  group: 'sandbox', icon: 'flask', name: 'Sandbox (Dev)',    provider: 'sandbox', devOnly: true }
];

export const PAYMENT_GROUPS = ['ewallet', 'qris', 'bank', 'card', 'store', 'sandbox'];

export const MAX_ORDER_HISTORY = 20;

// ---------- DOMPET UNIVERSAL (uang $ <-> SIL) ----------
// Semua biaya berupa uang ($) boleh dibayar dengan SIL, dan semua biaya berupa SIL
// boleh dibayar dengan uang. SIL TIDAK PERNAH dicetak dari uang: yang terjadi hanyalah
// pembayaran langsung, jadi proteksi server (hardening.sql) tetap berlaku.
// Kurs: 1 SIL = baseCashPerSil × (1 + inflationPerYear × (tahun - 2000)).
// Nilai dasar sengaja sama dengan paket tukar terkecil (10 SIL = $25.000).
export const WALLET = {
    baseCashPerSil: 2500,
    inflationPerYear: 0.15,
    // Mode bayar (disimpan di state.settings.payMode):
    //  'auto'       : mata uang asli item dulu, kekurangan ditutup mata uang lain
    //  'cash_first' : selalu pakai uang dulu, SIL menutup kekurangan
    //  'sil_first'  : selalu pakai SIL dulu, uang menutup kekurangan
    //  'strict'     : terpisah — item uang hanya dengan uang, item SIL hanya dengan SIL
    modes: ['auto', 'cash_first', 'sil_first', 'strict'],
    defaultMode: 'auto'
};

export function getCashPerSil(year) {
    var y = (typeof year === 'number' && isFinite(year)) ? year : 2000;
    var mult = 1 + WALLET.inflationPerYear * Math.max(0, y - 2000);
    return Math.max(1, Math.round(WALLET.baseCashPerSil * mult));
}

// ---------- KATALOG: apa saja yang bisa dibayar uang / SIL ----------
// Dipakai layar "Apa yang bisa dibayar?" (Setelan -> Keuangan). Semua baris di sini
// benar-benar lewat WalletService/SiliconService (uang <-> SIL).
// native: 'cash' = harga aslinya uang ($), 'sil' = harga aslinya SIL.
export const WALLET_CATALOG = [
    { id: 'research', native: 'cash', id_: 'Riset teknologi & chip', en_: 'Tech & chip research',
      id_d: 'Mulai riset (uang atau SIL).', en_d: 'Start research (cash or SIL).' },
    { id: 'research_sil', native: 'sil', id_: 'Unlock, boost & selesaikan riset / OS', en_: 'Unlock, boost & finish research / OS',
      id_d: 'Harga SIL, boleh dibayar uang.', en_d: 'SIL price, payable with cash.' },
    { id: 'speed', native: 'sil', id_: 'Percepatan waktu 2x / 5x / 10x', en_: 'Time speed 2x / 5x / 10x',
      id_d: 'Harga SIL, boleh dibayar uang.', en_d: 'SIL price, payable with cash.' },
    { id: 'instant', native: 'sil', id_: 'Aksi instan (produk, fab, bug OS, moral, reputasi)', en_: 'Instant actions (product, fab, OS bugs, morale, reputation)',
      id_d: 'Harga SIL, boleh dibayar uang.', en_d: 'SIL price, payable with cash.' },
    { id: 'team', native: 'cash', id_: 'Rekrut, latih & PHK staf', en_: 'Hire, train & fire staff',
      id_d: 'Biaya rekrut, pelatihan, dan pesangon.', en_d: 'Recruiting, training and severance costs.' },
    { id: 'product', native: 'cash', id_: 'Pengembangan produk, restock manual, kampanye', en_: 'Product development, manual restock, campaigns',
      id_d: 'Biaya produksi & pemasaran.', en_d: 'Production and marketing costs.' },
    { id: 'promo', native: 'cash', id_: 'Promosi regional & respons viral', en_: 'Regional promotions & viral responses',
      id_d: 'Paket promosi, minta maaf, recall.', en_d: 'Promo packages, apologies, recalls.' },
    { id: 'os', native: 'cash', id_: 'OS: versi baru, patch bug, aplikasi bawaan', en_: 'OS: new versions, bug patches, built-in apps',
      id_d: 'Biaya pengembangan OS.', en_d: 'OS development costs.' },
    { id: 'chipfab', native: 'cash', id_: 'Desain chip, bangun/upgrade fab, produksi chip', en_: 'Chip design, build/upgrade fab, chip production',
      id_d: 'Biaya chip & pabrik.', en_d: 'Chip and factory costs.' },
    { id: 'bank', native: 'cash', id_: 'Bank: lunasi pinjaman, bayar kredit, setor deposito', en_: 'Bank: repay loans, credit line, deposits',
      id_d: 'Pelunasan & setoran.', en_d: 'Repayments and deposits.' },
    { id: 'stocks', native: 'cash', id_: 'Beli saham di Bursa', en_: 'Buy stocks on the Exchange',
      id_d: 'Jumlah maksimal ikut daya beli gabungan.', en_d: 'Max shares follow combined buying power.' },
    { id: 'rescue', native: 'cash', id_: 'Dana darurat kas minus (opsional)', en_: 'Negative-cash emergency fund (optional)',
      id_d: 'SIL menutup defisit tutup bulan bila diaktifkan.', en_d: 'SIL covers the month-end deficit when enabled.' }
];
// Sengaja TIDAK memakai SIL secara otomatis (agar tidak terkuras diam-diam).
export const WALLET_CASH_ONLY = [
    { id_: 'Gaji, sewa & pajak bulanan', en_: 'Monthly salaries, rent & tax' },
    { id_: 'Auto-restock & biaya gudang', en_: 'Auto-restock & warehouse fees' }
];
