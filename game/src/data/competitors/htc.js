// FILE: src/data/competitors/htc.js
export const htc = {
    id: 'htc',
    name: 'HTC',
    country: 'Taiwan',
    color: '#69BE28',
    activeFromYear: 2006, activeToYear: 2019,
    personality: 'innovator',
    startShare: 0.005,
    researchStartTier: 2, researchSpeedMultiplier: 1.1,
    foundedYear: 1997, founder: 'Cher Wang, H.T. Cho, Peter Chou',
    hq: 'Taoyuan, Taiwan', parentCompany: null,
    origin: 'ODM Windows Mobile untuk operator (1997) → merek sendiri HTC TyTN (2006).',
    exitReason: 'Keluar dari pasar massal (2019), fokus VR & B2B.',
    strengths: ['Windows Mobile awal', 'Android awal', 'Desain logam'],
    weaknesses: ['Marketing lemah', 'Software kadang buggy'],
    osName: 'Windows Mobile → Android',
    factuality: 'historical',
    factNote: 'Peristiwa terverifikasi. HTC adalah pembuat Android phone pertama.',
    sources: 'HTC archives, Wikipedia EN',
    milestones: [
        { year: 1997, text: 'Didirikan oleh Cher Wang dkk sebagai ODM.', verified: true },
        { year: 2002, text: 'Windows Mobile pertama dengan merek HTC.', verified: true },
        { year: 2006, text: 'Mulai merek sendiri: HTC TyTN.', verified: true },
        { year: 2008, text: 'HTC Dream (T-Mobile G1) — Android phone pertama.', verified: true },
        { year: 2011, text: 'Puncak pangsa global (~10%).', verified: true },
        { year: 2017, text: 'Divisi smartphone sebagian diakuisisi Google.', verified: true }
    ],
    trivia: [
        'HTC membuat banyak ponsel Windows Mobile untuk operator sebelum bikin merek sendiri.',
        'Google membeli sebagian divisi HTC sebesar $1,1 miliar (2017).'
    ],
    shareByYear: {
        2006: 0.005, 2008: 0.02, 2010: 0.05, 2011: 0.08, 2012: 0.06,
        2013: 0.03, 2015: 0.02, 2018: 0.01, 2019: 0.005
    },
    // [v2027.4] Diperkaya: 16 produk historis 2006-2018.
    signatureProducts: [
        { name: 'HTC TyTN',           year: 2006, tier: 2, shareBoost: 0.01 },
        { name: 'HTC Touch',          year: 2007, tier: 2, shareBoost: 0.01 },
        { name: 'HTC Dream (G1)',     year: 2008, tier: 3, shareBoost: 0.04 },
        { name: 'HTC Hero',           year: 2009, tier: 3, shareBoost: 0.02 },
        { name: 'HTC Nexus One',      year: 2010, tier: 3, shareBoost: 0.02 },
        { name: 'HTC EVO 4G',         year: 2010, tier: 3, shareBoost: 0.02 },
        { name: 'HTC Sensation',      year: 2011, tier: 3, shareBoost: 0.01 },
        { name: 'HTC One X',          year: 2012, tier: 3, shareBoost: 0.02 },
        { name: 'HTC One (M7)',       year: 2013, tier: 4, shareBoost: 0.02 },
        { name: 'HTC One (M8)',       year: 2014, tier: 4, shareBoost: 0.00 },
        { name: 'HTC One M9',         year: 2015, tier: 3, shareBoost: -0.01 },
        { name: 'Google Pixel (HTC)', year: 2016, tier: 4, shareBoost: 0.02 },
        { name: 'HTC U11',            year: 2017, tier: 3, shareBoost: 0.01 },
        { name: 'HTC U12+',           year: 2018, tier: 3, shareBoost: 0.00 },
        { name: 'HTC Exodus 1',       year: 2018, tier: 3, shareBoost: -0.01 },
        { name: 'HTC U19e',           year: 2019, tier: 2, shareBoost: 0.00 }
    ],
    lifeEvents: [
        { year: 2008, text: 'HTC merilis Android pertama.', shareDelta: 0.05 },
        { year: 2013, text: 'HTC kesulitan bersaing harga.', shareDelta: -0.05 },
        { year: 2019, text: 'HTC hengkang dari pasar massal.', shareDelta: -0.03 }
    ]
};
