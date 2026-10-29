// FILE: src/data/competitors/sony_ericsson.js
// Sony Ericsson — diperkaya dengan produk historis 2001-2012.
export const sony_ericsson = {
    id: 'sony_ericsson',
    name: 'Sony Ericsson',
    country: 'Swedia / Jepang',
    color: '#00A551',
    activeFromYear: 2001, activeToYear: 2012,
    personality: 'premium',
    startShare: 0.05,
    researchStartTier: 1, researchSpeedMultiplier: 1.1,
    foundedYear: 2001, founder: 'Joint venture Sony & Ericsson',
    hq: 'London, Inggris', parentCompany: 'Sony Ericsson Mobile Communications',
    origin: 'Gabungan divisi ponsel Sony dan Ericsson. Fokus di kamera & musik.',
    exitReason: 'Sony membeli seluruh saham Ericsson (Feb 2012), merek dilebur.',
    strengths: ['Kamera', 'Walkman', 'Kualitas audio'],
    weaknesses: ['Harga premium', 'Software kaku'],
    osName: 'Symbian → Android',
    factuality: 'historical',
    factNote: 'Peristiwa terverifikasi. Ponsel pertama Sony Ericsson sebenarnya JV.',
    sources: 'Sony Mobile press archives, Wikipedia EN',
    milestones: [
        { year: 2001, text: 'Sony & Ericsson resmi bergabung (1 Oktober 2001).', verified: true },
        { year: 2003, text: 'T610 — ponsel kamera populer di pasar global.', verified: true },
        { year: 2005, text: 'W800 Walkman Phone — ponsel musik populer.', verified: true },
        { year: 2010, text: 'Xperia X10 — masuk era Android.', verified: true },
        { year: 2012, text: 'Sony beli seluruh saham Ericsson (Februari 2012).', verified: true }
    ],
    trivia: [
        'Sony Ericsson adalah joint venture 50:50.',
        'W800 Walkman Phone menginspirasi era ponsel-musik sebelum iPhone.'
    ],
    shareByYear: {
        2001: 0.05, 2003: 0.06, 2005: 0.07, 2007: 0.08, 2008: 0.09,
        2009: 0.07, 2010: 0.04, 2011: 0.03, 2012: 0.02
    },
    // [v2027.4] Diperkaya: 11 produk historis 2001-2012.
    signatureProducts: [
        { name: 'Sony Ericsson P800',       year: 2002, tier: 2, shareBoost: 0.01 },
        { name: 'Sony Ericsson T610',       year: 2003, tier: 2, shareBoost: 0.02 },
        { name: 'Sony Ericsson K750i',      year: 2005, tier: 2, shareBoost: 0.02 },
        { name: 'Sony Ericsson W800i',      year: 2005, tier: 2, shareBoost: 0.02 },
        { name: 'Sony Ericsson K800i',      year: 2006, tier: 3, shareBoost: 0.02 },
        { name: 'Sony Ericsson W880',       year: 2007, tier: 2, shareBoost: 0.01 },
        { name: 'Sony Ericsson C905',       year: 2008, tier: 3, shareBoost: 0.01 },
        { name: 'Sony Ericsson Xperia X1',  year: 2008, tier: 3, shareBoost: 0.00 },
        { name: 'Sony Ericsson Xperia X10', year: 2010, tier: 3, shareBoost: 0.01 },
        { name: 'Xperia PLAY',              year: 2011, tier: 3, shareBoost: 0.00 },
        { name: 'Sony Xperia S',            year: 2012, tier: 3, shareBoost: 0.01 }
    ],
    lifeEvents: [
        { year: 2001, text: 'Ericsson dan Sony bergabung.', shareDelta: 0.02 },
        { year: 2012, text: 'Sony membeli seluruh saham Ericsson.', shareDelta: 0.0 }
    ]
};
