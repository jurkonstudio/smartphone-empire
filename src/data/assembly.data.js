// FILE: src/data/assembly.data.js  (BARU — Pabrik Perakitan / Assembly)
// ============================================================
// Pabrik perakitan akhir: merakit komponen (baterai, layar, SoC, kamera, RAM, penyimpanan)
// menjadi ponsel jadi. Tenaga kerja dimodelkan sebagai KELOMPOK (headcount per peran),
// bukan individu, supaya tetap ringan walau jumlahnya ribuan.
//
// Jadwal sejarah: tahap konstruksi boleh dimulai 2001 (peta 3D menampilkan bangunan yang
// sedang dibangun), pabrik baru boleh BERPRODUKSI mulai 2002.
// ============================================================

export const ASSEMBLY_UNLOCK_YEAR = 2001;     // boleh mulai membangun
export const ASSEMBLY_OPERATE_YEAR = 2002;    // boleh memproses produksi
export const ASSEMBLY_TRAIN_DAYS = 14;        // pelatihan pekerja baru sebelum produktif
export const ASSEMBLY_REFUND_UPGRADE = 0.4;
export const ASSEMBLY_OVERTIME_BOOST = 1.2;   // kapasitas saat lembur
export const ASSEMBLY_RECENT_DAYS = 30;       // jendela hitung utilisasi
export const ASSEMBLY_MAX_LEAD_DAYS = 45;

export const ASSEMBLY_ROLES = [
    { id: 'operator',   wage: 700,  icon: 'users'  },
    { id: 'qc',         wage: 900,  icon: 'target' },
    { id: 'technician', wage: 1300, icon: 'cpu'    },
    { id: 'supervisor', wage: 1800, icon: 'shield' }
];

// capacityMonthly: unit ponsel per bulan pada staf penuh.
// discount: potongan biaya produksi pesanan (restock) saat pabrik beroperasi.
// crew: kebutuhan (sekaligus batas) pekerja per peran.
// automation: 0 manual, 1 semi, 2 otomatis, 3 robotik (dipakai adegan 3D).
export const ASSEMBLY_LEVELS = [
    { level: 1, name: 'Lini Rakit Manual',     cost: 10000000,  durationDays: 300, capacityMonthly: 60000,
      discount: 0.08, maintenanceMonthly: 50000,
      crew: { operator: 100, qc: 10, technician: 6, supervisor: 4 }, automation: 0 },
    { level: 2, name: 'Lini Semi-Otomatis',    cost: 30000000,  durationDays: 240, capacityMonthly: 300000,
      discount: 0.11, maintenanceMonthly: 150000,
      crew: { operator: 320, qc: 40, technician: 24, supervisor: 16 }, automation: 1 },
    { level: 3, name: 'Pabrik Otomatis',       cost: 100000000, durationDays: 300, capacityMonthly: 1500000,
      discount: 0.14, maintenanceMonthly: 500000,
      crew: { operator: 700, qc: 90, technician: 70, supervisor: 40 }, automation: 2 },
    { level: 4, name: 'Smart Factory Robotik', cost: 320000000, durationDays: 360, capacityMonthly: 6000000,
      discount: 0.17, maintenanceMonthly: 1600000,
      crew: { operator: 1100, qc: 200, technician: 120, supervisor: 80 }, automation: 3 }
];

// Indeks upah/perawatan menurut tahun: nilai `wage` & `maintenanceMonthly` di atas adalah
// nilai tahun 2026 (=1.0). Tahun 2002 baru ~0.35, naik ~5%/tahun. Tanpa ini Lv1 selalu rugi
// di awal karena volume produksi pemain masih kecil (hasil simulasi tools/asm-balance.mjs).
export const ASSEMBLY_WAGE_INDEX_BASE_YEAR = 2002;
export const ASSEMBLY_WAGE_INDEX_BASE = 0.35;
export const ASSEMBLY_WAGE_INDEX_GROWTH = 0.05;
export function getAssemblyWageIndex(year) {
    var y = Math.max(ASSEMBLY_WAGE_INDEX_BASE_YEAR, year || ASSEMBLY_WAGE_INDEX_BASE_YEAR);
    return ASSEMBLY_WAGE_INDEX_BASE * Math.pow(1 + ASSEMBLY_WAGE_INDEX_GROWTH, y - ASSEMBLY_WAGE_INDEX_BASE_YEAR);
}
export function getAssemblyRoleWage(role, year) {
    return Math.round(role.wage * getAssemblyWageIndex(year));
}

export function getAssemblyLevel(level) {
    for (var i = 0; i < ASSEMBLY_LEVELS.length; i++) if (ASSEMBLY_LEVELS[i].level === level) return ASSEMBLY_LEVELS[i];
    return null;
}
export function getAssemblyCrewTotal(level) {
    var l = getAssemblyLevel(level);
    if (!l) return 0;
    return ASSEMBLY_ROLES.reduce(function (n, r) { return n + (l.crew[r.id] || 0); }, 0);
}
export function getAssemblyWageMonthly(workers) {
    return ASSEMBLY_ROLES.reduce(function (n, r) { return n + ((workers && workers[r.id]) || 0) * r.wage; }, 0);
}
export function getAssemblyCapital(level) {
    return ASSEMBLY_LEVELS.reduce(function (n, l) { return l.level <= level ? n + l.cost : n; }, 0);
}
