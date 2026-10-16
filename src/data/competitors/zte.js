// FILE: src/data/competitors/zte.js
// KOMPETITOR BARU — ZTE (termasuk sub-brand Nubia).
export const zte = {
    id: 'zte', name: 'ZTE', country: 'Tiongkok', color: '#0072CE',
    activeFromYear: 2002, activeToYear: null,
    personality: 'follower', startShare: 0.002,
    researchStartTier: 2, researchSpeedMultiplier: 1.0,
    foundedYear: 1985, founder: 'Hou Weigui',
    hq: 'Shenzhen, Tiongkok', parentCompany: 'ZTE Corporation',
    origin: 'Peralatan telekomunikasi (1985) → ponsel (2002) → sub-brand Nubia (2012).',
    exitReason: null,
    strengths: ['Harga agresif', 'Sub-brand Nubia gaming'],
    weaknesses: ['Sanksi AS 2018', 'Brand awareness rendah'],
    osName: 'MiFavor / Nubia UI / Android',
    factuality: 'historical',
    factNote: 'ZTE sempat kena sanksi AS 2018 yang hampir mematikan perusahaan.',
    sources: 'ZTE press, Reuters, Wikipedia EN',
    milestones: [
        { year: 1985, text: 'ZTE didirikan di Shenzhen (peralatan telekomunikasi).', verified: true },
        { year: 2002, text: 'ZTE masuk pasar ponsel Tiongkok.', verified: true },
        { year: 2012, text: 'ZTE meluncurkan sub-brand Nubia.', verified: true },
        { year: 2018, text: 'ZTE dikenai sanksi AS — hampir bangkrut.', verified: true },
        { year: 2020, text: 'ZTE Axon 10s Pro 5G flagship.', verified: true }
    ],
    trivia: [
        'ZTE hampir bangkrut 2018 karena larangan ekspor chip AS.',
        'Sub-brand Nubia awalnya khusus gaming phone.'
    ],
    shareByYear: {
        2002: 0.002, 2006: 0.005, 2010: 0.01, 2014: 0.015, 2016: 0.012,
        2018: 0.005, 2020: 0.008, 2022: 0.008, 2024: 0.007, 2026: 0.007
    },
    signatureProducts: [
        { name: 'ZTE Blade',          year: 2010, tier: 2, shareBoost: 0.01 },
        { name: 'ZTE Grand S',        year: 2013, tier: 3, shareBoost: 0.01 },
        { name: 'Nubia Z5',           year: 2013, tier: 3, shareBoost: 0.01 },
        { name: 'Nubia Z9',           year: 2015, tier: 3, shareBoost: 0.01 },
        { name: 'ZTE Axon 7',         year: 2016, tier: 3, shareBoost: 0.01 },
        { name: 'Nubia Red Magic',    year: 2018, tier: 4, shareBoost: 0.01 },
        { name: 'ZTE Axon 10 Pro 5G', year: 2019, tier: 4, shareBoost: 0.01 },
        { name: 'Nubia Z50 Ultra',    year: 2023, tier: 4, shareBoost: 0.01 },
        { name: 'Nubia Z60 Ultra',    year: 2024, tier: 5, shareBoost: 0.01 }
    ],
    lifeEvents: [
        { year: 2018, text: 'ZTE dikenai sanksi AS, hampir gulung tikar.', shareDelta: -0.02 }
    ]
};
