// FILE: src/data/competitors/sony_mobile.js
// KOMPETITOR BARU — Sony Mobile (pasca-Sony Ericsson).
export const sony_mobile = {
    id: 'sony_mobile', name: 'Sony Mobile', country: 'Jepang', color: '#00A551',
    activeFromYear: 2012, activeToYear: null,
    personality: 'premium', startShare: 0.02,
    researchStartTier: 3, researchSpeedMultiplier: 1.1,
    foundedYear: 2012, founder: 'Sony Corporation (ambil alih Ericsson)',
    hq: 'Tokyo, Jepang', parentCompany: 'Sony Corporation',
    origin: 'Sony Ericsson diambil alih penuh Sony (2012) → Sony Mobile Communications.',
    exitReason: null,
    strengths: ['Kamera Alpha', 'Audio Hi-Res', 'Desain premium'],
    weaknesses: ['Pasar terbatas', 'Marketing kurang agresif'],
    osName: 'Xperia UI / Android',
    factuality: 'historical',
    factNote: 'Sony Mobile adalah kelanjutan Sony Ericsson pasca 2012.',
    sources: 'Sony Mobile press, Wikipedia EN',
    milestones: [
        { year: 2012, text: 'Sony ambil alih penuh Sony Ericsson.', verified: true },
        { year: 2013, text: 'Xperia Z — tahan air 1080p.', verified: true },
        { year: 2015, text: 'Xperia Z5 Premium — layar 4K pertama di ponsel.', verified: true },
        { year: 2019, text: 'Xperia 1 — layar 21:9 sinema.', verified: true },
        { year: 2022, text: 'Xperia 1 IV dengan lensa telefoto zoom optik.', verified: true }
    ],
    trivia: [
        'Sony Xperia Z5 Premium (2015) adalah ponsel pertama dengan layar 4K.',
        'Sony Mobile sering dianggap "underrated" — teknologi bagus tapi penjualan kecil.'
    ],
    shareByYear: {
        2012: 0.02, 2014: 0.03, 2016: 0.02, 2018: 0.01, 2020: 0.01,
        2022: 0.008, 2024: 0.007, 2026: 0.007, // [paket kompetitor, SPEKULATIF] arah skenario 2027-2030
        2027: 0.006, 2028: 0.0035, 2029: 0.0035, 2030: 0.0035
    },
    signatureProducts: [
        { name: 'Sony Xperia S',       year: 2012, tier: 3, shareBoost: 0.02 },
        { name: 'Sony Xperia Z',       year: 2013, tier: 4, shareBoost: 0.02 },
        { name: 'Xperia Z5 Premium',   year: 2015, tier: 4, shareBoost: 0.01 },
        { name: 'Xperia XZ Premium',   year: 2017, tier: 4, shareBoost: 0.01 },
        { name: 'Xperia 1',            year: 2019, tier: 4, shareBoost: 0.01 },
        { name: 'Xperia 1 II',         year: 2020, tier: 4, shareBoost: 0.01 },
        { name: 'Xperia 1 III',        year: 2021, tier: 5, shareBoost: 0.01 },
        { name: 'Xperia 1 IV',         year: 2022, tier: 5, shareBoost: 0.01 },
        { name: 'Xperia 1 V',          year: 2023, tier: 5, shareBoost: 0.01 },
        { name: 'Xperia 1 VI',         year: 2024, tier: 5, shareBoost: 0.01 },
        { name: 'Xperia 1 VII',        year: 2025, tier: 5, shareBoost: 0.01 }
    ],
    lifeEvents: [
        { year: 2012, text: 'Sony Mobile lahir dari Ericsson.', shareDelta: 0.0 }
    ]
};
