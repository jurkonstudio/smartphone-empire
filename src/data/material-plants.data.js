// FILE: src/data/material-plants.data.js  (Tahap 1 + Tahap 1b: efek & biaya perawatan pabrik)
// ============================================================
// Pabrik komponen internal: perusahaan membuat bahan baku ponsel sendiri
// (baterai, layar) alih-alih membelinya dari pemasok.
//
// Tiap tipe pabrik memproduksi SATU kategori komponen dari components.data.js
// (battery -> baterai, display -> layar). Komponen yang boleh diproduksi
// mengikuti aturan yang sama dengan Desain ponsel: tahun minYear dan riset
// (requiresResearch) harus terpenuhi.
//
// Harga internal = costPerUnit (harga pasar) x (1 - diskon level pabrik).
// Diskon inilah yang dipakai Desain ponsel saat pabrik sudah dibangun
// (lihat resolveComponentCost di bawah dan ProductSystem.computeUnitCost).
//
// Tahap 1b menambahkan:
//   - effects: bonus spesifikasi yang dibawa pabrik ke produk (lihat
//     getBuiltPlantEffect). Nilai dalam persen (0.06 = +6%).
//   - maintenanceMonthly: biaya perawatan per bulan selama pabrik berdiri.
//     Besarnya 0,5% dari biaya bangun per bulan (dihitung per level).
// ============================================================

export const PLANT_MIN_ORDER = 1000;          // minimal unit per order produksi
export const PLANT_CYCLE_DAYS = 30;           // kapasitas dihitung per bulan
export const PLANT_YIELD_BASE = 0.80;         // yield dasar (unit bagus / unit diproduksi)
export const PLANT_YIELD_PER_LEVEL = 0.04;    // tambahan yield per level pabrik
export const PLANT_YIELD_CAP = 0.97;

export const PLANT_TYPES = [
    {
        id: 'battery',
        name: 'Pabrik Baterai',
        icon: 'battery',
        category: 'battery',
        unlockYear: 2002,
        requiresFab: false,
        description: 'Sel Li-Ion dan Li-Po buatan sendiri. Mengurangi biaya baterai dan menambah daya tahan setiap ponsel yang kamu desain.',
        // Efek yang dibawa ke produk. Key harus cocok dengan pemakai di ProductSystem.
        effectKeys: ['batteryLife'],
        levels: [
            { level: 1, name: 'Lini Pilot',        cost: 8000000,   durationDays: 120, capacityMonthly: 50000,   discount: 0.10,
              maintenanceMonthly: 40000,   effects: { batteryLife: 0.03 } },
            { level: 2, name: 'Lini Produksi',     cost: 25000000,  durationDays: 180, capacityMonthly: 300000,  discount: 0.20,
              maintenanceMonthly: 125000,  effects: { batteryLife: 0.06 } },
            { level: 3, name: 'Gigafactory Kecil', cost: 90000000,  durationDays: 270, capacityMonthly: 1500000, discount: 0.30,
              maintenanceMonthly: 450000,  effects: { batteryLife: 0.10 } },
            { level: 4, name: 'Gigafactory',       cost: 300000000, durationDays: 360, capacityMonthly: 6000000, discount: 0.38,
              maintenanceMonthly: 1500000, effects: { batteryLife: 0.14 } }
        ]
    },
    {
        id: 'display',
        name: 'Pabrik Layar',
        icon: 'monitor',
        category: 'display',
        unlockYear: 2003,
        requiresFab: true,   // panel LCD/AMOLED butuh fab chip sebagai fondasi proses
        description: 'Panel LCD, TFT, dan AMOLED buatan sendiri. Butuh fab chip yang sudah berdiri. Menaikkan kualitas layar produk.',
        effectKeys: ['displayQuality'],
        levels: [
            { level: 1, name: 'Lini Pilot',         cost: 15000000,  durationDays: 150, capacityMonthly: 20000,   discount: 0.08,
              maintenanceMonthly: 75000,   effects: { displayQuality: 0.03 } },
            { level: 2, name: 'Lini Produksi',      cost: 50000000,  durationDays: 210, capacityMonthly: 150000,  discount: 0.16,
              maintenanceMonthly: 250000,  effects: { displayQuality: 0.06 } },
            { level: 3, name: 'Fab Layar Besar',    cost: 180000000, durationDays: 300, capacityMonthly: 800000,  discount: 0.25,
              maintenanceMonthly: 900000,  effects: { displayQuality: 0.10 } },
            { level: 4, name: 'Fab Layar Industri', cost: 500000000, durationDays: 360, capacityMonthly: 3000000, discount: 0.33,
              maintenanceMonthly: 2500000, effects: { displayQuality: 0.14 } }
        ]
    }
];

export function getPlantTypeById(id) {
    return PLANT_TYPES.find(function (p) { return p.id === id; }) || null;
}

export function getPlantTypeForCategory(category) {
    return PLANT_TYPES.find(function (p) { return p.category === category; }) || null;
}

// Info level pabrik. level 1 = biaya bangun; level berikutnya = biaya upgrade.
export function getPlantLevelInfo(typeId, level) {
    var pt = getPlantTypeById(typeId);
    if (!pt || !level) return null;
    return pt.levels.find(function (l) { return l.level === level; }) || null;
}

export function getPlantYield(level) {
    var y = PLANT_YIELD_BASE + PLANT_YIELD_PER_LEVEL * Math.max(0, (level || 1) - 1);
    return Math.min(PLANT_YIELD_CAP, Math.round(y * 1000) / 1000);
}

// Diskon harga internal untuk level pabrik tertentu (0 jika belum dibangun).
export function getPlantDiscount(typeId, level) {
    var info = getPlantLevelInfo(typeId, level);
    return info ? info.discount : 0;
}

// Efek spesifikasi per level, mis. { batteryLife: 0.06 }. Kosong jika level tidak ada.
export function getPlantEffects(typeId, level) {
    var info = getPlantLevelInfo(typeId, level);
    return info && info.effects ? info.effects : {};
}

// Biaya perawatan per bulan untuk level tertentu (0 jika level tidak ada).
export function getPlantMaintenance(typeId, level) {
    var info = getPlantLevelInfo(typeId, level);
    return info ? (info.maintenanceMonthly || 0) : 0;
}

// Nilai efek satu key dari pabrik yang SUDAH dibangun dan tidak sedang upgrade
// (pabrik yang sedang dibangun belum memberi efek). Dipakai ProductSystem
// dan PublicOpinionSystem, misalnya getBuiltPlantEffect(data, 'battery', 'batteryLife').
export function getBuiltPlantEffect(data, typeId, key) {
    var cp = data && data.componentPlants;
    var ps = cp && cp.plants ? cp.plants[typeId] : null;
    if (!ps || !ps.built || !ps.level || ps.upgrade) return 0;
    return getPlantEffects(typeId, ps.level)[key] || 0;
}

// ============================================================
// Penghubung ke Desain ponsel.
// Dipanggil dengan data game (state.data) dan komponen dari components.data.js.
// Mengembalikan harga per unit yang dipakai untuk menghitung biaya produk.
// Jika pabrik untuk kategori ini belum dibangun, harga pasar tetap dipakai.
// ============================================================
export function resolveComponentCost(data, comp) {
    if (!comp) return 0;
    var market = comp.costPerUnit || 0;
    var pt = getPlantTypeForCategory(comp.category);
    if (!pt || !data || !data.componentPlants || !data.componentPlants.plants) return market;
    var ps = data.componentPlants.plants[pt.id];
    if (!ps || !ps.built || !ps.level) return market;
    var discount = getPlantDiscount(pt.id, ps.level);
    return Math.round(market * (1 - discount) * 100) / 100;
}
