// FILE: src/data/competitors/nec.js
// NEC — kompetitor era 2000-2010 (celah audit: pemain kecil era ponsel fitur).
export const nec = {
    id: 'nec',
    name: 'NEC',
    country: 'Jepang',
    color: '#1B3F8F',
    activeFromYear: 2000, activeToYear: 2010,
    personality: 'follower',
    startShare: 0.02,
    researchStartTier: 1, researchSpeedMultiplier: 0.9,
    foundedYear: 1899, founder: 'Kunihiko Iwadare',
    hq: 'Tokyo, Jepang', parentCompany: 'NEC Corporation',
    origin: 'Perusahaan komunikasi Jepang; ponsel 3G awal di Eropa dan Jepang.',
    exitReason: 'Bisnis ponsel digabung dengan Casio dan Hitachi (NEC Casio, 2010).',
    strengths: ['Teknologi 3G', 'Pasar Jepang'],
    weaknesses: ['Skala global kecil'],
    osName: 'Proprietary',
    factuality: 'historical',
    factNote: 'Garis besar perusahaan terverifikasi. Pangsa dipadatkan dan tahun/nama model produk berupa perkiraan.',
    sources: 'Wikipedia EN, arsip pers perusahaan',
    milestones: [
        { year: 2003, text: 'NEC e606 hadir di jaringan 3G Eropa.', verified: true },
        { year: 2010, text: 'Digabung menjadi NEC Casio Mobile.', verified: true }
    ],
    trivia: [],
    shareByYear: {
        2000: 0.02, 2002: 0.02, 2004: 0.018, 2006: 0.012, 2008: 0.008, 2010: 0.003
    },
    signatureProducts: [
        { name: 'NEC e606', year: 2003, tier: 2, shareBoost: 0.005 },
        { name: 'NEC e808', year: 2004, tier: 2, shareBoost: 0.003 },
        { name: 'NEC N900iL', year: 2005, tier: 2, shareBoost: 0.002 }
    ],
    lifeEvents: [
        { year: 2010, text: 'Ponsel NEC digabung ke NEC Casio.', shareDelta: -0.005 }
    ]
};
