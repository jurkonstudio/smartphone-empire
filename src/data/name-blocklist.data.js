// FILE: src/data/name-blocklist.data.js
// v2027.33a — Blocklist untuk nama perusahaan
// Sumber: LDNOOBW V2, censor-text, riset akademis ID

// ============================================================
// 1. KOMPETITOR (exact + partial, case-insensitive)
// ============================================================
export const COMPETITOR_NAMES = [
    // Dari competitors.data.js
    'nokia', 'motorola', 'sony', 'ericsson', 'sony ericsson',
    'samsung', 'lg', 'siemens', 'palm', 'blackberry', 'rim',
    'apple', 'htc', 'google', 'android', 'huawei', 'xiaomi',
    'oppo', 'vivo', 'microsoft', 'lumia', 'honor', 'nothing',
    // Fiktif (opsional, biar gak loophole)
    'nokio', 'motora', 'samsul', 'apel', 'huawaei', 'xioami'
];

// ============================================================
// 2. KATA KOTOR INDONESIA (partial match, case-insensitive)
// ============================================================
export const PROFANITY_ID = [
    // --- Keadaan mental ---
    'goblok', 'goblog', 'tolol', 'bego', 'bego', 'idiot', 'sinting',
    'gila', 'sarap', 'edan', 'ontohod', 'dungu', 'bodoh',
    // --- Aktivitas seksual / organ ---
    'ngentot', 'entot', 'memek', 'kontol', 'kntl', 'pepek', 'pepe',
    'jembut', 'tetek', 'tete', 'nenen', 'sange', 'sangean', 'cabul',
    'coli', 'colmek', 'masturbasi', 'bokep', 'porno',
    // --- Hewan (umpatan) ---
    'anjing', 'anjg', 'anjeng', 'asu', 'babi', 'bangsat', 'bajingan',
    'monyet', 'kunyuk', 'kampret', 'keparat',
    // --- Benda kotor ---
    'tai', 'taik', 'sampah', 'bangke', 'bangkai', 'najis',
    // --- Makhluk halus ---
    'setan', 'iblis', 'tuyul', 'jahanam',
    // --- Kekerabatan (dengan suffix -mu) ---
    'ibumu', 'bapakmu', 'emakmu', 'nenekmu', 'kakekmu',
    'ibumu', 'bapaklu', 'emaklu',
    // --- Kata sifat negatif ---
    'sialan', 'modar', 'mampus', 'matilu', 'brengsek', 'bejat',
    'kampungan', 'ndeso', 'norak',
    // --- Singkatan chat/leetspeak ---
    'anjg', 'anj', 'bgsd', 'bgst', 'peler', 'pler', 'mmk', 'ktl',
    'pnt', 'ngehe', 'jancok', 'dancok', 'cok', 'cuk'
];

// ============================================================
// 3. KATA KOTOR INGGRIS (partial match, case-insensitive)
// ============================================================
export const PROFANITY_EN = [
    // --- Sexual ---
    'fuck', 'fuk', 'fck', 'f*ck', 'shit', 'sh1t', 'ass', 'arse',
    'asshole', 'bastard', 'bitch', 'b1tch', 'dick', 'cock', 'pussy',
    'cunt', 'whore', 'slut', 'boobs', 'tits', 'porn', 'sex',
    'masturbat', 'orgasm', 'cum', 'sperm', 'penis', 'vagina',
    // --- Insults ---
    'idiot', 'stupid', 'dumb', 'moron', 'retard', 'imbecile',
    'loser', 'fool', 'jerk', 'jerkoff', 'jackass', 'dumbass',
    // --- Animals (insults) ---
    'dog', 'pig', 'monkey', 'donkey', 'cow', 'bitch',
    // --- Religion-based ---
    'damn', 'goddamn', 'hell', 'jesus', 'christ',
    // --- Racial/derogatory (sangat sensitif) ---
    'nigger', 'nigga', 'fag', 'faggot', 'retard', 'chink',
    'spic', 'kike', 'wetback', 'gook', 'jap', 'raghead',
    // --- General ---
    'crap', 'piss', 'fart', 'butt', 'anus', 'rectum'
];

// ============================================================
// 4. KATA KOTOR MULTI-BAHASA (partial match)
// ============================================================
export const PROFANITY_MULTI = [
    // Jerman
    'scheiße', 'scheisse', 'arsch', 'wichser', 'hure', 'ficker',
    'fotze', 'kacke', 'dumm', 'blöd',
    // Belanda
    'kut', 'lul', 'kloten', 'godverdomme', 'kanker', 'tyfus',
    // Spanyol
    'puta', 'joder', 'mierda', 'coño', 'cabron', 'pendejo',
    'estupido', 'idiota', 'gilipollas',
    // Prancis
    'merde', 'putain', 'connard', 'salaud', 'enculé', 'bordel',
    // Italia
    'cazzo', 'merda', 'stronzo', 'puttana', 'figa', 'minchia',
    // Rusia (transliterasi)
    'blyad', 'suka', 'khuy', 'pizda', 'yebat', 'mudak',
    // Jepang (romaji)
    'kuso', 'chikusho', 'shine', 'baka', 'aho',
    // Korea (romaji)
    'shibal', 'ssibal', 'gaesaekki', 'byeongsin',
    // Thai (romaji)
    'hia', 'kuay', 'sat', 'kwai',
    // Arab (transliterasi)
    'kuss', 'sharmouta', 'kalb', 'himar', 'zibi'
];

// ============================================================
// 5. BRAND TERKENAL LAIN (biar gak ada loophole)
// ============================================================
export const OTHER_BRANDS = [
    'iphone', 'ipad', 'macbook', 'windows', 'windows phone',
    'symbian', 'blackberry', 'miui', 'coloros', 'funtouch',
    'harmonyos', 'ios', 'android', 'pixel', 'galaxy',
    'redmi', 'poco', 'realme', 'oneplus', 'asus', 'acer',
    'lenovo', 'dell', 'hp', 'sony', 'panasonic', 'sharp',
    'toshiba', 'fujitsu', 'nec', 'alcatel', 'zte', 'meizu',
    'smartisan', 'black shark', 'nubia', 'tecno', 'infinix',
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
        // Leetspeak common substitutions
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
        // Hapus separator umum
        .replace(/[\s\-_.]+/g, '')
        // Hapus karakter berulang (gobloooook -> goblok)
        .replace(/(.)\1{2,}/g, '$1');
}

// ============================================================
// 7. VALIDASI
// ============================================================
export function validateCompanyName(name) {
    if (!name || !name.trim()) {
        return { ok: false, reason: 'empty' };
    }

    const normalized = normalizeText(name);

    // Cek kompetitor (exact di normalized)
    for (const comp of COMPETITOR_NAMES) {
        if (normalizeText(comp) === normalized) {
            return { ok: false, reason: 'competitor', matched: comp };
        }
    }

    // Cek partial profanity ID
    for (const word of PROFANITY_ID) {
        if (normalized.includes(normalizeText(word))) {
            return { ok: false, reason: 'profanity', lang: 'id', matched: word };
        }
    }

    // Cek partial profanity EN
    for (const word of PROFANITY_EN) {
        if (normalized.includes(normalizeText(word))) {
            return { ok: false, reason: 'profanity', lang: 'en', matched: word };
        }
    }

    // Cek partial profanity multi
    for (const word of PROFANITY_MULTI) {
        if (normalized.includes(normalizeText(word))) {
            return { ok: false, reason: 'profanity', lang: 'multi', matched: word };
        }
    }

    // Cek other brands
    for (const brand of OTHER_BRANDS) {
        if (normalizeText(brand) === normalized) {
            return { ok: false, reason: 'brand', matched: brand };
        }
    }

    // Cek panjang minimum/maksimum
    if (name.trim().length < 2) {
        return { ok: false, reason: 'too_short' };
    }
    if (name.trim().length > 24) {
        return { ok: false, reason: 'too_long' };
    }

    return { ok: true };
}
