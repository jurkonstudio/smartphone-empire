// FILE: src/data/competitors/helpers.js
// ============================================================
// Helper murni — TIDAK butuh COMPETITORS.
// Fungsi yang butuh COMPETITORS ada di index.js.
// ============================================================

export const FICTIONAL_NAMES = {
    nokia: 'Nokio', motorola: 'Motora', sony_ericsson: 'Sonic Ericson',
    samsung: 'Samsul', lg: 'LGX', siemens: 'Simen', palm: 'Pamu',
    blackberry: 'Blackburry', apple: 'Apel', htc: 'HTCX',
    google_android: 'Gugel OS', huawei: 'Huawaei', xiaomi: 'Xioami',
    oppo: 'Opoh', vivo: 'Viva', microsoft_nokia: 'Microkia',
    honor: 'Honour', oneplus: 'OnePlusX', nothing: 'Somewhat',
    asus: 'Asos', sony_mobile: 'Soni Mobile', realme: 'Realmi',
    meizu: 'MeizuX', lenovo: 'Lenovu', tecno: 'Tekno', zte: 'ZetE',
    novamind: 'Novamind'
};

export function getFictionalName(id) {
    return FICTIONAL_NAMES[id] || id;
}

// Interpolasi linear map {year: value} — untuk shareByYear.
export function interpShare(map, year) {
    if (!map) return null;
    if (map[year] !== undefined) return map[year];
    const years = Object.keys(map).map(Number).sort((a, b) => a - b);
    if (!years.length) return null;
    if (year < years[0]) return map[years[0]];
    if (year > years[years.length - 1]) return map[years[years.length - 1]];
    for (let i = 0; i < years.length - 1; i++) {
        const y1 = years[i], y2 = years[i + 1];
        if (year >= y1 && year <= y2) {
            const v1 = map[y1], v2 = map[y2];
            return v1 + (v2 - v1) * ((year - y1) / (y2 - y1));
        }
    }
    return map[years[years.length - 1]];
}
