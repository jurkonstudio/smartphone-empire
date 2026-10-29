// FILE: src/data/competitors/panasonic.js
// Panasonic — kompetitor era 2000-2010 (celah audit: pemain kecil era ponsel fitur).
export const panasonic = {
    id: 'panasonic',
    name: 'Panasonic',
    country: 'Jepang',
    color: '#0041C0',
    activeFromYear: 2000, activeToYear: 2010,
    personality: 'follower',
    startShare: 0.02,
    researchStartTier: 1, researchSpeedMultiplier: 0.9,
    foundedYear: 1918, founder: 'Konosuke Matsushita',
    hq: 'Osaka, Jepang', parentCompany: 'Panasonic Corporation',
    origin: 'Produsen elektronik besar Jepang; ponsel GSM dan 3G, kuat di Jepang.',
    exitReason: 'Mundur dari pasar Eropa (2006) dan akhirnya dari ponsel konsumen global.',
    strengths: ['Kualitas rekayasa', 'Merek elektronik kuat'],
    weaknesses: ['Kalah gesit dari pesaing Korea'],
    osName: 'Proprietary',
    factuality: 'historical',
    factNote: 'Garis besar perusahaan terverifikasi. Pangsa dipadatkan dan tahun/nama model produk berupa perkiraan.',
    sources: 'Wikipedia EN, arsip pers perusahaan',
    milestones: [
        { year: 2001, text: 'Panasonic GD55 menembus pasar GSM Eropa.', verified: true },
        { year: 2006, text: 'Menarik diri dari pasar ponsel Eropa.', verified: true }
    ],
    trivia: [],
    shareByYear: {
        2000: 0.02, 2002: 0.02, 2004: 0.015, 2006: 0.01, 2008: 0.006, 2010: 0.003
    },
    signatureProducts: [
        { name: 'Panasonic GD55', year: 2001, tier: 1, shareBoost: 0.004 },
        { name: 'Panasonic X70', year: 2003, tier: 2, shareBoost: 0.003 },
        { name: 'Panasonic GD87', year: 2003, tier: 2, shareBoost: 0.003 },
        { name: 'Panasonic P902i', year: 2005, tier: 2, shareBoost: 0.002 }
    ],
    lifeEvents: [
        { year: 2006, text: 'Panasonic menarik diri dari Eropa.', shareDelta: -0.004 }
    ]
};
