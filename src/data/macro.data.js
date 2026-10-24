// FILE: src/data/macro.data.js
// ============================================================
// DATA MAKRO-EKONOMI & PASAR — jangkar tahunan dunia nyata 2000-2026.
// Dibaca oleh src/core/MacroModel.js. Ubah angka di sini tanpa
// menyentuh logika.
//
// CATATAN SUMBER: angka adalah PERKIRAAN pembulatan dari tren publik
// (IMF WEO, US BLS CPI, Federal Reserve, IDC/Gartner/Counterpoint).
// 2025-2026 adalah proyeksi. Cocokkan ulang dengan sumber resmi
// bila butuh akurasi tinggi.
// ============================================================

// Pertumbuhan PDB riil dunia (% per tahun).
export const GDP_GROWTH = {
    2000: 4.4, 2001: 1.9, 2002: 2.2, 2003: 2.9, 2004: 4.4, 2005: 3.8,
    2006: 4.3, 2007: 4.3, 2008: 1.9, 2009: -1.3, 2010: 4.5, 2011: 3.4,
    2012: 2.8, 2013: 2.8, 2014: 3.0, 2015: 3.0, 2016: 2.8, 2017: 3.4,
    2018: 3.3, 2019: 2.6, 2020: -3.0, 2021: 6.0, 2022: 3.4, 2023: 3.3,
    2024: 3.3, 2025: 3.0, 2026: 3.1
};

// Inflasi konsumen (% per tahun, patokan CPI AS).
export const INFLATION = {
    2000: 3.4, 2001: 2.8, 2002: 1.6, 2003: 2.3, 2004: 2.7, 2005: 3.4,
    2006: 3.2, 2007: 2.8, 2008: 3.8, 2009: -0.4, 2010: 1.6, 2011: 3.2,
    2012: 2.1, 2013: 1.5, 2014: 1.6, 2015: 0.1, 2016: 1.3, 2017: 2.1,
    2018: 2.4, 2019: 1.8, 2020: 1.2, 2021: 4.7, 2022: 8.0, 2023: 4.1,
    2024: 2.9, 2025: 2.7, 2026: 2.7
};

// Suku bunga acuan rata-rata tahunan (%, patokan Fed funds).
export const POLICY_RATE = {
    2000: 6.2, 2001: 3.9, 2002: 1.7, 2003: 1.1, 2004: 1.4, 2005: 3.2,
    2006: 5.0, 2007: 5.0, 2008: 1.9, 2009: 0.2, 2010: 0.2, 2011: 0.1,
    2012: 0.1, 2013: 0.1, 2014: 0.1, 2015: 0.1, 2016: 0.4, 2017: 1.0,
    2018: 1.8, 2019: 2.2, 2020: 0.4, 2021: 0.1, 2022: 1.7, 2023: 5.0,
    2024: 5.1, 2025: 4.2, 2026: 3.6
};

// Asumsi jangka panjang di luar rentang tabel.
export const LONG_RUN = { gdp: 3.0, inflation: 2.5, policyRate: 3.0, populationGrowth: 1.0 };

// Permintaan dasar harian untuk pemain (unit/hari pada produk "standar").
// Interpolasi log-linear antar jangkar → mulus, tidak melompat di batas era.
// Nilai di titik tengah era sama dengan BALANCE lama (5000/25000/80000/200000).
export const BASE_DEMAND_ANCHORS = [
    [2000, 4200], [2003, 5000], [2010, 25000], [2016, 80000], [2022, 200000], [2026, 205000]
];

// Ekspektasi kualitas konsumen (skala 0-100, sebanding qualityScore).
// Konsumen makin menuntut seiring waktu → ponsel lama otomatis terlihat usang.
export const QUALITY_EXPECTATION = [
    [2000, 52], [2012, 60], [2026, 70]
];

// Tren fitur yang dicari pasar per tahun (jangkar di titik tengah era).
export const TREND_ANCHORS = [
    // Gelombang tren era 2000-2007: ponsel awet (3310) -> ponsel berkamera -> desain tipis (RAZR)
    // -> musik & multimedia -> layar sentuh (iPhone). Sebelumnya tren datar sebelum 2003.
    [2000, { camera: 0.05, battery: 0.6, screen: 0.15, performance: 0.15, design: 0.3 }],
    [2003, { camera: 0.3, battery: 0.5, screen: 0.2, performance: 0.2, design: 0.4 }],
    [2005, { camera: 0.45, battery: 0.4, screen: 0.25, performance: 0.25, design: 0.55 }],
    [2007, { camera: 0.45, battery: 0.35, screen: 0.5, performance: 0.35, design: 0.6 }],
    [2010, { camera: 0.5, battery: 0.4, screen: 0.6, performance: 0.5, design: 0.6 }],
    [2016, { camera: 0.7, battery: 0.6, screen: 0.5, performance: 0.8, design: 0.5 }],
    [2022, { camera: 0.6, battery: 0.7, screen: 0.5, performance: 0.9, design: 0.5 }]
];
