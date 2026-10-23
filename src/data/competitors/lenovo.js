// FILE: src/data/competitors/lenovo.js
// KOMPETITOR BARU — Lenovo (pasca-akuisisi Motorola).
export const lenovo = {
    id: 'lenovo', name: 'Lenovo', country: 'Tiongkok', color: '#E2231A',
    activeFromYear: 2012, activeToYear: null,
    personality: 'follower', startShare: 0.003,
    researchStartTier: 2, researchSpeedMultiplier: 1.0,
    foundedYear: 1984, founder: 'Liu Chuanzhi',
    hq: 'Beijing, Tiongkok / Morrisville, NC', parentCompany: 'Lenovo Group',
    origin: 'PC (1984) → ponsel Lenovo (2002) → akuisisi Motorola Mobility (2014).',
    exitReason: null,
    strengths: ['Skala PC global', 'Portofolio Motorola'],
    weaknesses: ['Brand ponsel kurang kuat'],
    osName: 'Android (Vibe / Motorola)',
    factuality: 'historical',
    factNote: 'Lenovo punya brand Motorola untuk ponsel global.',
    sources: 'Lenovo press, Reuters, Wikipedia EN',
    milestones: [
        { year: 1984, text: 'Lenovo didirikan oleh Liu Chuanzhi.', verified: true },
        { year: 2002, text: 'Lenovo masuk pasar ponsel Tiongkok.', verified: true },
        { year: 2005, text: 'Lenovo akuisisi divisi PC IBM.', verified: true },
        { year: 2014, text: 'Lenovo beli Motorola Mobility dari Google ($2,91 miliar).', verified: true },
        { year: 2016, text: 'Lenovo rebranding Motorola dengan nama Moto.', verified: true }
    ],
    trivia: [
        'Lenovo singkatan dari "Legend" + "novo" (baru).',
        'Lenovo adalah vendor PC terbesar dunia sejak 2013.'
    ],
    shareByYear: {
        2012: 0.003, 2014: 0.005, 2016: 0.008, 2018: 0.008, 2020: 0.007,
        2022: 0.006, 2024: 0.005, 2026: 0.005, // [paket kompetitor, SPEKULATIF] arah skenario 2027-2030
        2027: 0.0045, 2028: 0.0025, 2029: 0.0025, 2030: 0.0025
    },
    signatureProducts: [
        { name: 'Lenovo Vibe Z',      year: 2013, tier: 3, shareBoost: 0.01 },
        { name: 'Lenovo Vibe Shot',   year: 2015, tier: 3, shareBoost: 0.01 },
        { name: 'Moto Z',             year: 2016, tier: 4, shareBoost: 0.01 },
        { name: 'Moto G5',            year: 2017, tier: 3, shareBoost: 0.01 },
        { name: 'Motorola Edge+',     year: 2020, tier: 4, shareBoost: 0.01 },
        { name: 'Motorola Razr (2019)',year: 2019,tier: 4, shareBoost: 0.01 },
        { name: 'Moto Razr 50 Ultra', year: 2024, tier: 4, shareBoost: 0.01 }
    ],
    lifeEvents: [
        { year: 2014, text: 'Lenovo akuisisi Motorola Mobility.', shareDelta: 0.01 }
    ]
};
