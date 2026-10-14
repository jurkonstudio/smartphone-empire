// FILE: src/data/name-blocklist.data.js
// v2027.33b — fix false positive: kata < 4 huruf = exact match
// Sumber: LDNOOBW V2, censor-text, riset akademis ID

// ============================================================
// 1. KOMPETITOR (exact match, case-insensitive)
// ============================================================
export const COMPETITOR_NAMES = [
    'nokia', 'motorola', 'sony', 'ericsson', 'sonyericsson',
    'samsung', 'lg', 'siemens', 'palm', 'blackberry', 'rim',
    'apple', 'htc', 'google', 'android', 'huawei', 'xiaomi',
    'oppo', 'vivo', 'microsoft', 'lumia', 'honor', 'nothing',
    'nokio', 'motora', 'samsul', 'apel', 'huawaei', 'xioami'
];

// ============================================================
// 2. KATA KOTOR INDONESIA (partial match)
// ============================================================
export const PROFANITY_ID = [
    // Keadaan mental
    'goblok', 'goblog', 'tolol', 'bego', 'idiot', 'sinting',
    'gila', 'sarap', 'edan', 'ontohod', 'dungu', 'bodoh',
    // Seksual
    'ngentot', 'entot', 'memek', 'kontol', 'kntl', 'pepek',
    'jembut', 'tetek', 'nenen', 'sange', 'cabul',
    'coli', 'colmek', 'masturbasi', 'bokep', 'porno',
    // Hewan (umpatan)
    'anjing', 'anjg', 'anjeng', 'asu', 'babi', 'bangsat', 'bajingan',
    'monyet', 'kunyuk', 'kampret', 'keparat',
    // Benda kotor
    'taik', 'sampah', 'bangke', 'bangkai', 'najis',
    // Makhluk halus
    'setan', 'iblis', 'tuyul', 'jahanam',
    // Kekerabatan
    'ibumu', 'bapakmu', 'emakmu', 'nenekmu', 'kakekmu',
    'bapaklu', 'emaklu',
    // Sifat negatif
    'sialan', 'modar', 'mampus', 'matilu', 'brengsek', 'bejat',
    'kampungan', 'ndeso', 'norak',
    // Singkatan chat
    'bgsd', 'bgst', 'peler', 'pler', 'ngehe', 'jancok', 'dancok'
];

// ============================================================
// 3. KATA KOTOR INGGRIS (partial match, kata >= 4 huruf)
// ============================================================
export const PROFANITY_EN = [
    'fuck', 'fuk', 'fck', 'shit', 'sh1t', 'arse',
    'asshole', 'bastard', 'bitch', 'b1tch', 'dick', 'cock', 'pussy',
    'cunt', 'whore', 'slut', 'boobs', 'tits', 'porn',
    'masturbat', 'orgasm', 'sperm', 'penis', 'vagina',
    'idiot', 'stupid', 'dumb', 'moron', 'retard', 'imbecile',
    'loser', 'jerkoff', 'jackass', 'dumbass',
    'nigger', 'nigga', 'faggot',
    'chink', 'wetback', 'raghead',
    'crap', 'anus', 'rectum'
];

// ============================================================
// 4. KATA KOTOR MULTI-BAHASA (partial match, kata >= 4 huruf)
// ============================================================
export const PROFANITY_MULTI = [
    // Jerman
    'scheisse', 'arsch', 'wichser', 'ficker', 'fotze', 'kacke',
    // Belanda
    'kloten', 'godverdomme', 'kanker', 'tyfus',
    // Spanyol
    'puta', 'joder', 'mierda', 'cabron', 'pendejo', 'estupido',
    'gilipollas',
    // Prancis
    'merde', 'putain', 'connard', 'salaud', 'bordel',
    // Italia
    'cazzo', 'merda', 'stronzo', 'puttana', 'minchia',
    // Rusia
    'blyad', 'khuy', 'pizda', 'yebat', 'mudak',
    // Jepang
    'kuso', 'chikusho', 'shine', 'baka',
    // Korea
    'shibal', 'ssibal', 'gaesaekki', 'byeongsin',
    // Thai
    'kuay',
    // Arab
    'sharmouta', 'himar'
];

// ============================================================
// 5. BRAND LAIN (exact match)
// ============================================================
export const OTHER_BRANDS = [
    'iphone', 'ipad', 'macbook', 'windows', 'windowsphone',
    'symbian', 'miui', 'coloros', 'funtouch',
    'harmonyos', 'ios', 'pixel', 'galaxy',
    'redmi', 'poco', 'realme', 'oneplus', 'acer',
    'lenovo', 'dell', 'panasonic',
    'toshiba', 'fujitsu', 'nec', 'alcatel', 'zte', 'meizu',
    'smartisan', 'blackshark', 'nubia', 'tecno', 'infinix',
    'itel', 'lava', 'micromax', 'karbonn'
];

// ============================================================
// 6. NORMALISASI
// ============================================================
export function normalizeText(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .trim()
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/7/g, 't')
        .replace(/8/g, 'b')
        .replace(/@/g, 'a')
        .replace(/\$/g, 's')
        .replace(/!/g, 'i')
        .replace(/[\s\-_.]+/g, '')
        .replace(/(.)\1{2,}/g, '$1');
}

// ============================================================
// 7. HELPER MATCH
// Kata < 4 huruf = exact match (hindari false positive kaya "Hello")
// Kata >= 4 huruf = partial match
// ============================================================
function _matchWord(norm, rawWord) {
    const w = normalizeText(rawWord);
    if (w.length < 4) return norm === w;
    return norm.includes(w);
}

// ============================================================
// 8. VALIDASI UTAMA
// ============================================================
export function validateCompanyName(name) {
    if (!name || !name.trim()) {
        return { ok: false, reason: 'empty' };
    }

    const trimmed = name.trim();
    const normalized = normalizeText(trimmed);

    // Kompetitor — exact match
    for (const comp of COMPETITOR_NAMES) {
        if (normalizeText(comp) === normalized) {
            return { ok: false, reason: 'competitor', matched: comp };
        }
    }

    // Other brands — exact match
    for (const brand of OTHER_BRANDS) {
        if (normalizeText(brand) === normalized) {
            return { ok: false, reason: 'brand', matched: brand };
        }
    }

    // Profanity ID
    for (const word of PROFANITY_ID) {
        if (_matchWord(normalized, word)) {
            return { ok: false, reason: 'profanity', lang: 'id', matched: word };
        }
    }

    // Profanity EN
    for (const word of PROFANITY_EN) {
        if (_matchWord(normalized, word)) {
            return { ok: false, reason: 'profanity', lang: 'en', matched: word };
        }
    }

    // Profanity multi
    for (const word of PROFANITY_MULTI) {
        if (_matchWord(normalized, word)) {
            return { ok: false, reason: 'profanity', lang: 'multi', matched: word };
        }
    }

    // Panjang
    if (trimmed.length < 2) return { ok: false, reason: 'too_short' };
    if (trimmed.length > 24) return { ok: false, reason: 'too_long' };

    return { ok: true };
}
