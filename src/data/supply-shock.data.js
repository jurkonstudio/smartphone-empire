// FILE: src/data/supply-shock.data.js  (BARU — paket 2027–2028)
// ============================================================
// Indeks biaya komponen akibat krisis pasokan memori (skenario "Rammageddon").
// Pengali dikalikan ke costPerUnit komponen kategori terkait. Hanya kategori
// yang tercantum yang terpengaruh; kategori lain = x1.
//
// SPEKULATIF: angka adalah skenario permainan, bukan data resmi atau ramalan
// pasti. Ubah angka di sini tanpa menyentuh logika.
// Interpolasi linear antar anchor (tahun desimal). Sebelum anchor pertama = 1.
// ============================================================

export const SUPPLY_SHOCK_SPECULATIVE = true;

export const COMPONENT_COST_INDEX = {
    ram: [
        { year: 2026.0, mult: 1.00 },
        { year: 2027.0, mult: 1.35 },
        { year: 2028.0, mult: 1.50 },
        { year: 2029.0, mult: 1.20 },
        { year: 2030.0, mult: 1.05 }
    ]
};

// Ambang indeks RAM untuk menyatakan "krisis memori" aktif (dipakai
// CompetitorActionSystem untuk menggeser pilihan aksi merek).
export const MEMORY_CRUNCH_THRESHOLD = 1.15;

function _interp(points, t) {
    if (!points || !points.length) return 1;
    if (t <= points[0].year) return points[0].mult;
    var last = points[points.length - 1];
    if (t >= last.year) return last.mult;
    for (var i = 0; i < points.length - 1; i++) {
        var a = points[i], b = points[i + 1];
        if (t >= a.year && t <= b.year) {
            return a.mult + (b.mult - a.mult) * ((t - a.year) / (b.year - a.year));
        }
    }
    return last.mult;
}

// Indeks biaya kategori pada tahun & bulan (1..12) tertentu.
export function getComponentCostIndex(category, year, month) {
    var pts = COMPONENT_COST_INDEX[category];
    if (!pts) return 1;
    var y = Number(year) || 2000;
    var m = Math.min(12, Math.max(1, Number(month) || 1));
    return _interp(pts, y + (m - 1) / 12);
}

// Sama, dibaca dari objek waktu game ({ currentYear, currentMonth }).
export function getComponentCostIndexForTime(category, time) {
    if (!time) return 1;
    return getComponentCostIndex(category, time.currentYear, time.currentMonth);
}

// Krisis memori aktif pada waktu tertentu?
export function isMemoryCrunchActive(time) {
    return getComponentCostIndexForTime('ram', time) >= MEMORY_CRUNCH_THRESHOLD;
}
