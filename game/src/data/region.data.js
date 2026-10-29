// FILE: src/data/region.data.js  (BARU)
// ============================================================
// DATA WILAYAH PASAR — Asia, Eropa, dan "Lainnya" (Amerika dkk).
// Dipakai PromotionSystem (promosi regional) dan BankSystem (bank regional).
// Angka = PERKIRAAN pembulatan tren publik (IDC/Counterpoint), bukan data resmi.
// ============================================================

export const REGION_IDS = ['asia', 'europe', 'rest'];   // wilayah permintaan
export const SCOPE_IDS  = ['global', 'asia', 'europe', 'rest', 'segment']; // cakupan promosi

export const REGION_COLORS = {
    global: '#3b82f6',
    asia:   '#ef4444',
    europe: '#a855f7',
    rest:   '#10b981',
    segment: '#f59e0b'
};

// Porsi permintaan dunia per tahun: [tahun, asia, eropa]  (lainnya = sisa)
// Asia naik pesat (Cina/India/SEA), Eropa relatif datar lalu turun porsinya.
const DEMAND_ANCHORS = [
    [2000, 0.24, 0.28], [2005, 0.29, 0.27], [2010, 0.38, 0.24],
    [2015, 0.46, 0.21], [2020, 0.50, 0.19], [2026, 0.53, 0.17]
];

function _lerp(a, b, t) { return a + (b - a) * t; }

export function getRegionWeights(year) {
    var y = Number(year) || 2000;
    var A = DEMAND_ANCHORS;
    var asia, europe;
    if (y <= A[0][0]) { asia = A[0][1]; europe = A[0][2]; }
    else if (y >= A[A.length - 1][0]) { asia = A[A.length - 1][1]; europe = A[A.length - 1][2]; }
    else {
        for (var i = 0; i < A.length - 1; i++) {
            if (y >= A[i][0] && y <= A[i + 1][0]) {
                var t = (y - A[i][0]) / (A[i + 1][0] - A[i][0]);
                asia = _lerp(A[i][1], A[i + 1][1], t);
                europe = _lerp(A[i][2], A[i + 1][2], t);
                break;
            }
        }
    }
    return { asia: asia, europe: europe, rest: Math.max(0, 1 - asia - europe) };
}

// Musim promosi (deterministik per bulan): pengganda efektivitas promosi.
export const SEASON_EVENTS = [
    { region: 'asia',   month: 2,  mult: 1.15, key: 'season.asia.lny' },
    { region: 'asia',   month: 6,  mult: 1.12, key: 'season.asia.618' },
    { region: 'asia',   month: 10, mult: 1.10, key: 'season.asia.goldenweek' },
    { region: 'asia',   month: 11, mult: 1.35, key: 'season.asia.1111' },
    { region: 'asia',   month: 12, mult: 1.08, key: 'season.asia.yearend' },
    { region: 'europe', month: 7,  mult: 1.12, key: 'season.europe.summer' },
    { region: 'europe', month: 11, mult: 1.18, key: 'season.europe.blackfriday' },
    { region: 'europe', month: 12, mult: 1.30, key: 'season.europe.christmas' },
    { region: 'rest',   month: 2,  mult: 1.10, key: 'season.rest.carnival' },
    { region: 'rest',   month: 8,  mult: 1.08, key: 'season.rest.backtoschool' },
    { region: 'rest',   month: 11, mult: 1.25, key: 'season.rest.blackfriday' },
    { region: 'rest',   month: 12, mult: 1.30, key: 'season.rest.holiday' }
];

export function getSeason(region, month) {
    for (var i = 0; i < SEASON_EVENTS.length; i++) {
        var e = SEASON_EVENTS[i];
        if (e.region === region && e.month === month) return e;
    }
    return null;
}

export function getSeasonMult(region, month) {
    var s = getSeason(region, month);
    return s ? s.mult : 1.0;
}

// Biaya kepatuhan iklan/privasi Eropa naik sejak GDPR (2018).
export function getRegionCostMult(region, year) {
    if (region === 'europe' && year >= 2018) return 1.08;
    return 1.0;
}
