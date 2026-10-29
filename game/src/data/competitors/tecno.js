// FILE: src/data/competitors/tecno.js
// KOMPETITOR BARU — Tecno (fokus Afrika & Asia Selatan).
export const tecno = {
    id: 'tecno', name: 'Tecno', country: 'Tiongkok', color: '#1A2C5B',
    activeFromYear: 2006, activeToYear: null,
    personality: 'follower', startShare: 0.001,
    researchStartTier: 1, researchSpeedMultiplier: 0.95,
    foundedYear: 2006, founder: 'George Zhu (Transsion Holdings)',
    hq: 'Shenzhen, Tiongkok', parentCompany: 'Transsion Holdings',
    origin: 'Transsion → merek Tecno untuk pasar Afrika → ekspansi ke Asia Selatan.',
    exitReason: null,
    strengths: ['Harga super murah', 'Distribusi Afrika'],
    weaknesses: ['Spesifikasi rendah', 'Fokus pasar berkembang'],
    osName: 'HiOS / Android',
    factuality: 'historical',
    factNote: 'Tecno adalah pemimpin pasar Afrika lewat Transsion.',
    sources: 'Transsion report, IDC, Wikipedia EN',
    milestones: [
        { year: 2006, text: 'Tecno didirikan oleh Transsion Holdings.', verified: true },
        { year: 2017, text: 'Tecno jadi merek ponsel terbesar di Afrika.', verified: true },
        { year: 2019, text: 'Tecno ekspansi ke India dan Asia Tenggara.', verified: true },
        { year: 2023, text: 'Tecno Phantom X2 Pro dengan kamera retractable.', verified: true }
    ],
    trivia: [
        'Transsion menguasai lebih dari 40% pasar ponsel Afrika.',
        'Tecno awalnya mengkhususkan kamera untuk kulit gelap — unik di industri.'
    ],
    shareByYear: {
        2006: 0.001, 2010: 0.005, 2014: 0.01, 2018: 0.015, 2020: 0.02,
        2022: 0.025, 2024: 0.025, 2026: 0.025, // [paket kompetitor, SPEKULATIF] arah skenario 2027-2030
        2027: 0.023, 2028: 0.02, 2029: 0.022, 2030: 0.024
    },
    signatureProducts: [
        { name: 'Tecno Camon',        year: 2015, tier: 2, shareBoost: 0.01 },
        { name: 'Tecno Spark',        year: 2017, tier: 2, shareBoost: 0.01 },
        { name: 'Tecno Phantom X',    year: 2021, tier: 3, shareBoost: 0.01 },
        { name: 'Tecno Phantom X2 Pro',year: 2023,tier: 4, shareBoost: 0.01 },
        { name: 'Tecno Phantom V Fold',year: 2023,tier: 4, shareBoost: 0.01 },
        { name: 'Tecno Camon 30',     year: 2024, tier: 3, shareBoost: 0.01 }
    ],
    lifeEvents: [
        { year: 2017, text: 'Tecno jadi pemimpin pasar Afrika.', shareDelta: 0.02 }
    ]
};
