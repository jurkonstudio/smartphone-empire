// FILE: src/data/wholesale.data.js  (BARU — Kontrak grosir produk jadi)
// ============================================================
// Semua angka balance kontrak grosir ada di file ini (WholesaleContractSystem tanpa angka sendiri).
// Pembeli = merek kompetitor (bukan ekosistem). Kontrak TIDAK mengubah pangsa pasar pemain
// (tidak menyentuh playerShareScale / BALANCE.market): ini pendapatan tambahan dari stok surplus.
// ============================================================

export const WHOLESALE = {
    maxOpenOffers: 12,              // tawaran terbuka sekaligus (semua produk)
    maxOffersPerProduct: 2,         // tawaran terbuka per produk
    minStockToOffer: 100,           // stok minimal sebelum produk ditawarkan
    minQty: 100,
    qtyShare: { min: 0.08, max: 0.35 },       // porsi stok yang ditawarkan
    offerDays: { min: 20, max: 60 },          // masa tawaran berlaku
    deliveryDays: { min: 3, max: 10 },        // jeda sebelum pembayaran masuk
    qualityRef: 60,                 // kualitas acuan (sama dengan BALANCE.products.refs.quality)
    offerChanceBase: 0.5,           // peluang tawaran baru per bulan, dikali kualitas relatif
    offerChanceMin: 0.15,
    offerChanceMax: 0.9,
    // Harga tawaran sebagai porsi dari harga ritel, menurut watak pembeli (kompetitor).
    priceByPersonality: {
        aggressive: [0.55, 0.70],
        follower:   [0.60, 0.75],
        innovator:  [0.70, 0.85],
        dominant:   [0.70, 0.85],
        premium:    [0.85, 0.98],
        declining:  [0.50, 0.65]
    },
    priceDefault: [0.65, 0.80],
    qualityPriceBonus: 0.12,        // kualitas di atas acuan menaikkan harga (per 1.0 relatif)
    priceMin: 0.40,
    priceMax: 1.05,
    historyLimit: 20
};
