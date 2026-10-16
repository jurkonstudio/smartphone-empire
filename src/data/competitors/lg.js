// FILE: src/data/competitors/lg.js
export const lg = {
    id: 'lg',
    name: 'LG',
    country: 'Korea Selatan',
    color: '#A50034',
    activeFromYear: 1996, activeToYear: 2021,
    personality: 'follower',
    startShare: 0.03,
    researchStartTier: 1, researchSpeedMultiplier: 0.95,
    foundedYear: 1947, founder: 'Koo In-hwoi',
    hq: 'Seoul, Korea Selatan', parentCompany: 'LG Group',
    origin: 'Kosmetik Lucky Chemical (1947) → elektronik GoldStar (1958) → ponsel LG-CU100 (1996).',
    exitReason: 'Keluar dari pasar ponsel global (26 Juli 2021).',
    strengths: ['Desain berani', 'Kamera awal'],
    weaknesses: ['Software lemah', 'Konsistensi produk'],
    osName: 'Android',
    factuality: 'historical',
    factNote: 'Peristiwa terverifikasi. LG pernah jadi top-3 global pada awal 2000-an.',
    sources: 'LG Newsroom, Reuters, Wikipedia EN',
    milestones: [
        { year: 1947, text: 'Didirikan sebagai Lucky Chemical (kosmetik).', verified: true },
        { year: 1958, text: 'Berdiri GoldStar (elektronik).', verified: true },
        { year: 1996, text: 'Ponsel pertama: LG-CU100.', verified: true },
        { year: 2006, text: 'LG Chocolate — ponsel desain populer.', verified: true },
        { year: 2014, text: 'LG G3 — layar QHD pertama di flagship.', verified: true },
        { year: 2021, text: 'Keluar dari pasar ponsel global.', verified: true }
    ],
    trivia: [
        '"LG" adalah singkatan dari Lucky-GoldStar.',
        'LG pernah jadi vendor ponsel top-3 global pada 2008.'
    ],
    shareByYear: {
        2000: 0.03, 2003: 0.05, 2006: 0.06, 2008: 0.05, 2010: 0.04,
        2012: 0.04, 2014: 0.05, 2016: 0.04, 2018: 0.03, 2020: 0.02, 2021: 0.01
    },
    // [v2027.4] Diperkaya: 15 produk historis 2000-2021.
    signatureProducts: [
        { name: 'LG Chocolate',        year: 2006, tier: 2, shareBoost: 0.02 },
        { name: 'LG Prada KE850',      year: 2006, tier: 2, shareBoost: 0.02 },
        { name: 'LG Renoir',           year: 2008, tier: 2, shareBoost: 0.01 },
        { name: 'LG Optimus 7',        year: 2010, tier: 2, shareBoost: 0.00 },
        { name: 'LG Optimus 2X',       year: 2010, tier: 3, shareBoost: 0.01 },
        { name: 'LG Optimus G',        year: 2012, tier: 3, shareBoost: 0.01 },
        { name: 'LG Nexus 4',          year: 2012, tier: 3, shareBoost: 0.02 },
        { name: 'LG G2',               year: 2013, tier: 3, shareBoost: 0.02 },
        { name: 'LG G3',               year: 2014, tier: 4, shareBoost: 0.02 },
        { name: 'LG V10',              year: 2015, tier: 3, shareBoost: 0.01 },
        { name: 'LG G5',               year: 2016, tier: 3, shareBoost: -0.02 },
        { name: 'LG G6',               year: 2017, tier: 3, shareBoost: 0.01 },
        { name: 'LG G7 ThinQ',         year: 2018, tier: 3, shareBoost: 0.00 },
        { name: 'LG V50 ThinQ 5G',     year: 2019, tier: 4, shareBoost: 0.01 },
        { name: 'LG Wing',             year: 2020, tier: 4, shareBoost: 0.00 }
    ],
    lifeEvents: [
        { year: 2006, text: 'LG Chocolate populer.', shareDelta: 0.02 },
        { year: 2021, text: 'LG hengkang dari pasar ponsel.', shareDelta: -0.08 }
    ]
};
