// FILE: src/data/competitors/sharp.js
// Sharp — kompetitor era 2000-2010 (celah audit: pemain kecil era ponsel fitur).
export const sharp = {
    id: 'sharp',
    name: 'Sharp',
    country: 'Jepang',
    color: '#D7001D',
    activeFromYear: 2000, activeToYear: 2010,
    personality: 'innovator',
    startShare: 0.012,
    researchStartTier: 1, researchSpeedMultiplier: 0.9,
    foundedYear: 1912, founder: 'Tokuji Hayakawa',
    hq: 'Osaka, Jepang', parentCompany: 'Sharp Corporation',
    origin: 'Produsen elektronik Jepang; pelopor ponsel berkamera (J-SH04, 2000) dan layar LCD.',
    exitReason: 'Fokus ke pasar Jepang dan mundur dari pasar ponsel global.',
    strengths: ['Teknologi layar', 'Kamera awal'],
    weaknesses: ['Terbatas di Jepang'],
    osName: 'Proprietary',
    factuality: 'historical',
    factNote: 'Garis besar perusahaan terverifikasi. Pangsa dipadatkan dan tahun/nama model produk berupa perkiraan.',
    sources: 'Wikipedia EN, arsip pers perusahaan',
    milestones: [
        { year: 2000, text: 'J-SH04, ponsel berkamera komersial pertama di Jepang.', verified: true },
        { year: 2002, text: 'GX10 membawa ponsel kamera ke Eropa.', verified: true }
    ],
    trivia: [],
    shareByYear: {
        2000: 0.012, 2002: 0.015, 2004: 0.015, 2006: 0.01, 2008: 0.008, 2010: 0.005
    },
    signatureProducts: [
        { name: 'Sharp J-SH04', year: 2000, tier: 2, shareBoost: 0.008 },
        { name: 'Sharp GX10', year: 2002, tier: 2, shareBoost: 0.005 },
        { name: 'Sharp GX30', year: 2003, tier: 2, shareBoost: 0.003 },
        { name: 'Sharp 903SH', year: 2005, tier: 3, shareBoost: 0.003 }
    ],
    lifeEvents: [

    ]
};
