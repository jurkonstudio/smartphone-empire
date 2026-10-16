// FILE: src/data/competitors/asus.js
// KOMPETITOR BARU — Asus (fokus gaming phone ROG).
export const asus = {
    id: 'asus', name: 'Asus', country: 'Taiwan', color: '#00539B',
    activeFromYear: 2014, activeToYear: null,
    personality: 'innovator', startShare: 0.002,
    researchStartTier: 3, researchSpeedMultiplier: 1.1,
    foundedYear: 1989, founder: 'Jonney Shih, Ted Hsu, MT Liao, Wayne Tsiah',
    hq: 'Taipei, Taiwan', parentCompany: 'ASUSTeK Computer',
    origin: 'Motherboard PC (1989) → laptop → ponsel Zenfone (2014) → gaming ROG Phone (2018).',
    exitReason: null,
    strengths: ['Gaming phone', 'Baterai besar', 'Pendinginan aktif'],
    weaknesses: ['Pasar niche', 'Jangkauan global terbatas'],
    osName: 'ZenUI / ROG UI / Android',
    factuality: 'historical',
    factNote: 'Asus adalah pemain niche di segmen gaming phone, bukan mainstream.',
    sources: 'Asus Newsroom, Wikipedia EN',
    milestones: [
        { year: 1989, text: 'Asus didirikan di Taipei sebagai pembuat motherboard.', verified: true },
        { year: 2014, text: 'Asus Zenfone — lini ponsel pintar pertama.', verified: true },
        { year: 2018, text: 'Asus ROG Phone — gaming phone pertama.', verified: true },
        { year: 2023, text: 'ROG Phone 7 Ultimate dengan kipas aktif.', verified: true }
    ],
    trivia: [
        'Asus awalnya singkatan dari "Pegasus" — empat huruf pertama dibuang.',
        'ROG Phone punya lampu RGB dan kipas pendingin eksternal — unik di industri ponsel.'
    ],
    shareByYear: {
        2014: 0.002, 2016: 0.005, 2018: 0.004, 2020: 0.003, 2022: 0.004,
        2024: 0.004, 2026: 0.004
    },
    signatureProducts: [
        { name: 'Asus Zenfone 2',     year: 2015, tier: 3, shareBoost: 0.01 },
        { name: 'Asus Zenfone 3',     year: 2016, tier: 3, shareBoost: 0.01 },
        { name: 'Asus ROG Phone',     year: 2018, tier: 4, shareBoost: 0.01 },
        { name: 'Asus ROG Phone II',  year: 2019, tier: 4, shareBoost: 0.01 },
        { name: 'Asus Zenfone 8',     year: 2021, tier: 3, shareBoost: 0.01 },
        { name: 'Asus ROG Phone 6',   year: 2022, tier: 4, shareBoost: 0.01 },
        { name: 'Asus ROG Phone 7',   year: 2023, tier: 4, shareBoost: 0.01 },
        { name: 'Asus ROG Phone 8',   year: 2024, tier: 4, shareBoost: 0.01 },
        { name: 'Asus ROG Phone 9',   year: 2025, tier: 5, shareBoost: 0.01 }
    ],
    lifeEvents: [
        { year: 2018, text: 'Asus luncurkan ROG Phone untuk gamer mobile.', shareDelta: 0.01 }
    ]
};
