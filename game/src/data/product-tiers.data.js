// FILE: src/data/product-tiers.data.js  (BARU — tier rilis seri: Basic, Pro, Pro Max)
// ============================================================
// Satu desain bisa dirilis sebagai satu seri berisi 1–3 varian.
// Nama tiap varian BEBAS diisi pemain. Perbedaan kecanggihan dan desain
// datang dari komponen & bodi/warna yang dipilih tiap varian di wizard,
// bukan dari bonus tetap per tier.
//   assemblyEffort : bobot kapasitas Pabrik Perakitan per unit.
//                    Varian yang lebih rumit (bodi & komponen lebih banyak)
//                    memakan kapasitas dan jeda produksi lebih besar.
// ============================================================

export const PRODUCT_TIERS = [
    { id: 'basic',  label: 'Basic',   labelEn: 'Basic',   assemblyEffort: 1.0 },
    { id: 'pro',    label: 'Pro',     labelEn: 'Pro',     assemblyEffort: 1.25 },
    { id: 'promax', label: 'Pro Max', labelEn: 'Pro Max', assemblyEffort: 1.6 }
];

export const TIER_IDS = PRODUCT_TIERS.map(function (t) { return t.id; });

export function getProductTier(id) {
    return PRODUCT_TIERS.find(function (t) { return t.id === id; }) || null;
}

// Produk lama (tanpa tier) diperlakukan sebagai Basic.
export function getTierAssemblyEffort(id) {
    var t = getProductTier(id);
    return t ? t.assemblyEffort : 1.0;
}
