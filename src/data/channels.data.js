// FILE: src/data/channels.data.js  (BARU — kanal distribusi)
// ============================================================
// Kanal penjualan tambahan di atas "Distributor & Ritel" (baseline = ekonomi game yang sudah ada).
// Tiap kanal aktif MEMPERLUAS permintaan (bonus jangkauan per tahun) tetapi unit tambahan yang
// lewat kanal itu dipotong margin (retention < 1). Biaya produksi per unit tidak berubah, jadi
// kanal berpotongan besar hanya untung bila margin ponsel cukup tebal.
//
//   reach        keyframe [tahun, bonus]  -> bonus permintaan (0.30 = +30%), diinterpolasi linear
//   retention    bagian harga yang diterima pemain untuk unit lewat kanal (0.72 = potongan 28%)
//   setup        biaya sekali bayar saat mengaktifkan (skala 1x, dikali skala ukuran bisnis)
//   monthly      biaya tetap per bulan (skala 1x, dikali skala ukuran bisnis)
//   lockMonths   komitmen minimum sebelum boleh dinonaktifkan
//   unlock       tahun kanal tersedia
//   scopeBonus   bonus tambahan untuk ponsel dalam scope tertentu (premium/budget/…)
//
// Skala ukuran bisnis = rata-rata omzet 3 bulan / $30K, dijepit 1–300 (sama dengan insiden dinamis).
// ============================================================

export const CHANNEL_SCALE_BASE = 30000;
export const CHANNEL_SCALE_MAX = 300;
export const CHANNEL_REACH_CAP = 0.9;   // total bonus jangkauan maksimum (+90%)

export const CHANNELS = [
    {
        id: 'carrier', icon: 'signal', unlock: 2000,
        name: { id: 'Operator Seluler', en: 'Mobile Carriers' },
        desc: {
            id: 'Dijual lewat toko dan paket kontrak operator. Jangkauan besar di era 2000-an, tetapi operator menekan harga dan memotong margin. Pengaruhnya menyusut setelah toko aplikasi dan penjualan bebas SIM.',
            en: 'Sold through carrier stores and contract bundles. Huge reach in the 2000s, but carriers squeeze prices and cut margins. Influence fades with app stores and SIM-free sales.'
        },
        reach: [[2000, 0.45], [2004, 0.40], [2008, 0.30], [2012, 0.18], [2016, 0.10], [2022, 0.05], [2030, 0.03]],
        retention: 0.72, setup: 12000, monthly: 800, lockMonths: 6
    },
    {
        id: 'online', icon: 'globe', unlock: 2003,
        name: { id: 'Toko Online', en: 'Online Store' },
        desc: {
            id: 'Penjualan langsung lewat web. Awalnya kecil, lalu tumbuh seiring e-commerce. Potongan rendah dan biaya tetap ringan.',
            en: 'Direct web sales. Small at first, then grows with e-commerce. Low cut and light fixed costs.'
        },
        reach: [[2003, 0.01], [2006, 0.03], [2010, 0.10], [2015, 0.20], [2020, 0.30], [2030, 0.38]],
        retention: 0.94, setup: 6000, monthly: 500, lockMonths: 3
    },
    {
        id: 'own_store', icon: 'store', unlock: 2004,
        name: { id: 'Toko Sendiri', en: 'Own Stores' },
        desc: {
            id: 'Gerai merek sendiri: margin penuh dan memperkuat citra premium, tetapi sewa dan staf mahal serta komitmen sewa minimal 1 tahun.',
            en: 'Brand-owned shops: full margin and a stronger premium image, but rent and staff are costly and the lease is a 1-year commitment.'
        },
        reach: [[2004, 0.04], [2010, 0.09], [2020, 0.13], [2030, 0.15]],
        retention: 1.0, setup: 40000, monthly: 3500, lockMonths: 12,
        scopeBonus: [{ scope: 'premium', add: 0.06 }]
    }
];

export function getChannelById(id) {
    for (var i = 0; i < CHANNELS.length; i++) if (CHANNELS[i].id === id) return CHANNELS[i];
    return null;
}

// Bonus jangkauan dasar kanal pada tahun (pecahan) tertentu. Di luar keyframe: dijepit ke ujung.
export function channelReachAt(def, yearFrac) {
    var k = def.reach;
    if (!k || !k.length) return 0;
    if (yearFrac <= k[0][0]) return k[0][1];
    for (var i = 1; i < k.length; i++) {
        if (yearFrac <= k[i][0]) {
            var a = k[i - 1], b = k[i];
            var f = (yearFrac - a[0]) / (b[0] - a[0]);
            return a[1] + (b[1] - a[1]) * f;
        }
    }
    return k[k.length - 1][1];
}
