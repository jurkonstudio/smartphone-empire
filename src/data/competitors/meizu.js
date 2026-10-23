// FILE: src/data/competitors/meizu.js
// KOMPETITOR BARU — Meizu (Tiongkok).
export const meizu = {
    id: 'meizu', name: 'Meizu', country: 'Tiongkok', color: '#00BFFF',
    activeFromYear: 2008, activeToYear: null,
    personality: 'follower', startShare: 0.001,
    researchStartTier: 2, researchSpeedMultiplier: 1.0,
    foundedYear: 2003, founder: 'Jack Wong (Huang Zhang)',
    hq: 'Zhuhai, Tiongkok', parentCompany: 'Geely (sejak 2022)',
    origin: 'MP3 player (2003) → smartphone M8 (2008) → Flyme OS.',
    exitReason: null,
    strengths: ['Desain', 'Flyme OS'],
    weaknesses: ['Distribusi terbatas', 'Pasar Tiongkok dominan'],
    osName: 'Flyme OS / Android',
    factuality: 'historical',
    factNote: 'Meizu populer di Tiongkok 2010-2015, lalu menurun.',
    sources: 'Meizu press, Wikipedia EN',
    milestones: [
        { year: 2003, text: 'Meizu didirikan sebagai produsen MP3 player.', verified: true },
        { year: 2008, text: 'Meizu M8 — smartphone pertama (Windows CE).', verified: true },
        { year: 2011, text: 'Meizu M9 — masuk era Android.', verified: true },
        { year: 2015, text: 'Meizu Pro 5 — flagship terbaiknya.', verified: true },
        { year: 2022, text: 'Geely mengakuisisi Meizu.', verified: true }
    ],
    trivia: [
        'Meizu awalnya produsen MP3 player sukses sebelum masuk ponsel.',
        'Meizu M8 adalah ponsel pertama dengan chip Samsung yang dioptimalkan.'
    ],
    shareByYear: {
        2008: 0.001, 2011: 0.005, 2013: 0.01, 2015: 0.015, 2017: 0.008,
        2019: 0.004, 2021: 0.002, 2024: 0.001, 2026: 0.001, // [paket kompetitor, SPEKULATIF] arah skenario 2027-2030
        2027: 0.0008, 2028: 0.0005, 2029: 0.0005, 2030: 0.0005
    },
    signatureProducts: [
        { name: 'Meizu M8',           year: 2008, tier: 2, shareBoost: 0.01 },
        { name: 'Meizu M9',           year: 2011, tier: 3, shareBoost: 0.01 },
        { name: 'Meizu MX3',          year: 2013, tier: 3, shareBoost: 0.01 },
        { name: 'Meizu Pro 5',        year: 2015, tier: 4, shareBoost: 0.01 },
        { name: 'Meizu 16th',         year: 2018, tier: 3, shareBoost: 0.00 },
        { name: 'Meizu 20 Infinity',  year: 2023, tier: 4, shareBoost: 0.00 }
    ],
    lifeEvents: [
        { year: 2022, text: 'Meizu diakuisisi Geely.', shareDelta: 0.0 }
    ]
};
