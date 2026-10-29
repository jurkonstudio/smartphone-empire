// FILE: src/data/countries.data.js  (BARU)
// ============================================================
// DATA NEGARA PASAR — dibuka BERTAHAP per tahun (2000 → 2026).
// Dipakai CountryMarketModel (tabel pasokan produksi + negara pengguna OS).
// Angka = PERKIRAAN kasar (populasi ~ juta, kekayaan 1-5), bukan data resmi.
//   since  : tahun negara mulai bisa dipasok
//   ramp   : berapa tahun sampai penetrasi ponsel penuh
//   pop    : populasi (juta, pembulatan)
//   wealth : 1 (terendah) … 5 (tertinggi) → menentukan selera harga
//   region : 'asia' | 'europe' | 'rest' (sama dengan region.data.js)
// ============================================================

export const COUNTRIES = [
    // --- Tahap 1 · 2000 (pasar awal) ---
    { id: 'US', flag: '🇺🇸', id_name: 'Amerika Serikat', en_name: 'United States',  region: 'rest',   since: 2000, ramp: 6,  pop: 285, wealth: 5 },
    { id: 'JP', flag: '🇯🇵', id_name: 'Jepang',          en_name: 'Japan',          region: 'asia',   since: 2000, ramp: 5,  pop: 127, wealth: 5 },
    { id: 'GB', flag: '🇬🇧', id_name: 'Inggris',         en_name: 'United Kingdom', region: 'europe', since: 2000, ramp: 5,  pop: 59,  wealth: 5 },
    { id: 'DE', flag: '🇩🇪', id_name: 'Jerman',          en_name: 'Germany',        region: 'europe', since: 2000, ramp: 5,  pop: 82,  wealth: 5 },
    { id: 'FR', flag: '🇫🇷', id_name: 'Prancis',         en_name: 'France',         region: 'europe', since: 2000, ramp: 6,  pop: 60,  wealth: 5 },
    { id: 'KR', flag: '🇰🇷', id_name: 'Korea Selatan',   en_name: 'South Korea',    region: 'asia',   since: 2000, ramp: 5,  pop: 47,  wealth: 4 },
    { id: 'CN', flag: '🇨🇳', id_name: 'Tiongkok',        en_name: 'China',          region: 'asia',   since: 2000, ramp: 14, pop: 1260, wealth: 2 },
    // --- Tahap 2 · 2003 ---
    { id: 'IT', flag: '🇮🇹', id_name: 'Italia',          en_name: 'Italy',          region: 'europe', since: 2003, ramp: 4,  pop: 57,  wealth: 5 },
    { id: 'CA', flag: '🇨🇦', id_name: 'Kanada',          en_name: 'Canada',         region: 'rest',   since: 2003, ramp: 6,  pop: 31,  wealth: 5 },
    { id: 'AU', flag: '🇦🇺', id_name: 'Australia',       en_name: 'Australia',      region: 'rest',   since: 2003, ramp: 5,  pop: 19,  wealth: 5 },
    { id: 'RU', flag: '🇷🇺', id_name: 'Rusia',           en_name: 'Russia',         region: 'europe', since: 2003, ramp: 8,  pop: 146, wealth: 3 },
    // --- Tahap 3 · 2005 ---
    { id: 'IN', flag: '🇮🇳', id_name: 'India',           en_name: 'India',          region: 'asia',   since: 2005, ramp: 16, pop: 1050, wealth: 1 },
    { id: 'BR', flag: '🇧🇷', id_name: 'Brasil',          en_name: 'Brazil',         region: 'rest',   since: 2005, ramp: 10, pop: 175, wealth: 3 },
    { id: 'ES', flag: '🇪🇸', id_name: 'Spanyol',         en_name: 'Spain',          region: 'europe', since: 2005, ramp: 5,  pop: 41,  wealth: 4 },
    { id: 'MX', flag: '🇲🇽', id_name: 'Meksiko',         en_name: 'Mexico',         region: 'rest',   since: 2005, ramp: 10, pop: 100, wealth: 3 },
    // --- Tahap 4 · 2007 ---
    { id: 'ID', flag: '🇮🇩', id_name: 'Indonesia',       en_name: 'Indonesia',      region: 'asia',   since: 2007, ramp: 12, pop: 215, wealth: 2 },
    { id: 'TR', flag: '🇹🇷', id_name: 'Turki',           en_name: 'Turkey',         region: 'europe', since: 2007, ramp: 9,  pop: 65,  wealth: 3 },
    { id: 'TH', flag: '🇹🇭', id_name: 'Thailand',        en_name: 'Thailand',       region: 'asia',   since: 2007, ramp: 9,  pop: 63,  wealth: 3 },
    { id: 'ZA', flag: '🇿🇦', id_name: 'Afrika Selatan',  en_name: 'South Africa',   region: 'rest',   since: 2007, ramp: 9,  pop: 45,  wealth: 3 },
    // --- Tahap 5 · 2010 ---
    { id: 'PH', flag: '🇵🇭', id_name: 'Filipina',        en_name: 'Philippines',    region: 'asia',   since: 2010, ramp: 10, pop: 76,  wealth: 2 },
    { id: 'VN', flag: '🇻🇳', id_name: 'Vietnam',         en_name: 'Vietnam',        region: 'asia',   since: 2010, ramp: 10, pop: 78,  wealth: 2 },
    { id: 'SA', flag: '🇸🇦', id_name: 'Arab Saudi',      en_name: 'Saudi Arabia',   region: 'rest',   since: 2010, ramp: 6,  pop: 20,  wealth: 4 },
    { id: 'EG', flag: '🇪🇬', id_name: 'Mesir',           en_name: 'Egypt',          region: 'rest',   since: 2010, ramp: 10, pop: 66,  wealth: 2 },
    // --- Tahap 6 · 2013 ---
    { id: 'NG', flag: '🇳🇬', id_name: 'Nigeria',         en_name: 'Nigeria',        region: 'rest',   since: 2013, ramp: 12, pop: 125, wealth: 1 },
    { id: 'PK', flag: '🇵🇰', id_name: 'Pakistan',        en_name: 'Pakistan',       region: 'asia',   since: 2013, ramp: 12, pop: 145, wealth: 1 },
    { id: 'BD', flag: '🇧🇩', id_name: 'Bangladesh',      en_name: 'Bangladesh',     region: 'asia',   since: 2013, ramp: 12, pop: 130, wealth: 1 },
    // --- Tahap 7 · 2018 ---
    { id: 'KE', flag: '🇰🇪', id_name: 'Kenya',           en_name: 'Kenya',          region: 'rest',   since: 2018, ramp: 9,  pop: 30,  wealth: 1 },
    { id: 'ET', flag: '🇪🇹', id_name: 'Ethiopia',        en_name: 'Ethiopia',       region: 'rest',   since: 2022, ramp: 10, pop: 66,  wealth: 1 },
    // --- Tahap 8 · 2026 (terbaru) ---
    { id: 'AE', flag: '🇦🇪', id_name: 'Uni Emirat Arab', en_name: 'UAE',            region: 'rest',   since: 2026, ramp: 3,  pop: 4,   wealth: 5 }
];

// Harga acuan (USD) per tingkat kekayaan — untuk selera harga negara.
export const WEALTH_REF_PRICE = { 1: 150, 2: 250, 3: 400, 4: 650, 5: 900 };

export function getCountryById(id) {
    for (var i = 0; i < COUNTRIES.length; i++) if (COUNTRIES[i].id === id) return COUNTRIES[i];
    return null;
}

// Negara yang sudah terbuka di tahun tertentu.
export function getUnlockedCountries(year) {
    var y = Number(year) || 2000;
    return COUNTRIES.filter(function (c) { return c.since <= y; });
}

// Negara yang akan terbuka berikutnya (paling dekat setelah tahun ini).
export function getNextUnlocks(year, limit) {
    var y = Number(year) || 2000;
    return COUNTRIES.filter(function (c) { return c.since > y; })
        .sort(function (a, b) { return a.since - b.since; })
        .slice(0, limit || 3);
}
