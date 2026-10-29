// FILE: src/data/competitors/realme.js
export const realme = {
    id: 'realme',
    name: 'Realme',
    country: 'Tiongkok',
    color: '#FFC915',
    activeFromYear: 2018,
    activeToYear: null,
    personality: 'aggressive',
    startShare: 0.002,
    researchStartTier: 3,
    researchSpeedMultiplier: 1.15,
    foundedYear: 2018,
    founder: 'Sky Li (Li Bingzhong)',
    hq: 'Shenzhen, Tiongkok',
    parentCompany: 'BBK Electronics (via Oppo)',
    origin: 'Sub-brand Oppo untuk pasar India/Asia Tenggara (2018) -> merek global.',
    exitReason: null,
    strengths: ['Harga agresif', 'Spesifikasi tinggi murah', 'Pasar berkembang'],
    weaknesses: ['Brand awareness rendah di Barat'],
    osName: 'realme UI / Android',
    factuality: 'historical',
    factNote: 'Realme tumbuh cepat di India dan Asia Tenggara pasca 2018.',
    sources: 'Realme press, IDC, Counterpoint',
    milestones: [
        { year: 2018, text: 'Realme lahir sebagai sub-brand Oppo.', verified: true },
        { year: 2019, text: 'Realme jadi merek tercepat mencapai 10 juta penjualan.', verified: true },
        { year: 2021, text: 'Realme masuk 6 besar vendor global.', verified: true },
        { year: 2023, text: 'Realme GT5 Pro - flagship dengan kamera periskop.', verified: true }
    ],
    trivia: [
        'Realme awalnya sub-brand Oppo untuk pasar India.',
        'Slogan Dare to Leap jadi tagline resmi sejak 2019.'
    ],
    shareByYear: {
        2018: 0.002,
        2019: 0.01,
        2020: 0.02,
        2021: 0.03,
        2022: 0.035,
        2023: 0.03,
        2024: 0.03,
        2026: 0.03, // [paket kompetitor, SPEKULATIF] arah skenario 2027-2030
        2027: 0.028, 2028: 0.024, 2029: 0.026, 2030: 0.028
    },
    signatureProducts: [
        { name: 'Realme 1',       year: 2018, tier: 3, shareBoost: 0.01 },
        { name: 'Realme X',       year: 2019, tier: 3, shareBoost: 0.01 },
        { name: 'Realme X2 Pro',  year: 2019, tier: 4, shareBoost: 0.01 },
        { name: 'Realme GT',      year: 2021, tier: 4, shareBoost: 0.01 },
        { name: 'Realme GT 2 Pro',year: 2022, tier: 4, shareBoost: 0.01 },
        { name: 'Realme GT5 Pro', year: 2023, tier: 5, shareBoost: 0.01 },
        { name: 'Realme GT6',     year: 2024, tier: 4, shareBoost: 0.01 },
        { name: 'Realme GT7 Pro', year: 2025, tier: 5, shareBoost: 0.01 }
    ],
    lifeEvents: [
        { year: 2019, text: 'Realme jadi merek tercepat mencapai 10 juta unit.', shareDelta: 0.02 }
    ]
};
