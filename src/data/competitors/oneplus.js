// FILE: src/data/competitors/oneplus.js
export const oneplus = {
    id: 'oneplus', name: 'OnePlus', country: 'Tiongkok', color: '#EB0028',
    activeFromYear: 2014, activeToYear: null,
    personality: 'innovator', startShare: 0.002,
    researchStartTier: 3, researchSpeedMultiplier: 1.15,
    foundedYear: 2013, founder: 'Pete Lau, Carl Pei',
    hq: 'Shenzhen, Tiongkok', parentCompany: 'BBK Electronics (via Oppo)',
    origin: 'Sub-brand Oppo untuk pasar global → ponsel OnePlus One (2014).',
    exitReason: null,
    strengths: ['Harga flagship killer', 'Software bersih', 'Komunitas fanatik'],
    weaknesses: ['Skala produksi kecil', 'Ketergantungan Oppo'],
    osName: 'OxygenOS / Android',
    factuality: 'historical',
    factNote: 'Peristiwa terverifikasi. Carl Pei lalu keluar dan mendirikan Nothing.',
    sources: 'OnePlus press, The Verge, Wikipedia EN',
    milestones: [
        { year: 2013, text: 'Didirikan oleh Pete Lau & Carl Pei.', verified: true },
        { year: 2014, text: 'OnePlus One — "flagship killer" $299.', verified: true },
        { year: 2016, text: 'OnePlus 3 — populer global.', verified: true },
        { year: 2021, text: 'Integrasi lebih dalam dengan Oppo.', verified: true },
        { year: 2023, text: 'OnePlus 11 flagship global.', verified: true }
    ],
    trivia: [
        'OnePlus One awalnya hanya bisa dibeli dengan "invite system" — viral pemasaran.',
        'Carl Pei keluar 2020 dan mendirikan Nothing.'
    ],
    shareByYear: {
        2014: 0.002, 2016: 0.005, 2018: 0.008, 2020: 0.010, 2022: 0.012,
        2024: 0.010, 2026: 0.010
    },
    signatureProducts: [
        { name: 'OnePlus One',        year: 2014, tier: 4, shareBoost: 0.02 },
        { name: 'OnePlus 2',          year: 2015, tier: 3, shareBoost: 0.00 },
        { name: 'OnePlus 3',          year: 2016, tier: 4, shareBoost: 0.02 },
        { name: 'OnePlus 6',          year: 2018, tier: 4, shareBoost: 0.02 },
        { name: 'OnePlus 7 Pro',      year: 2019, tier: 5, shareBoost: 0.02 },
        { name: 'OnePlus Nord',       year: 2020, tier: 4, shareBoost: 0.02 },
        { name: 'OnePlus 9 & Hasselblad',year: 2021, tier: 5, shareBoost: 0.02 },
        { name: 'OnePlus 11',         year: 2023, tier: 5, shareBoost: 0.02 },
        { name: 'OnePlus Open',       year: 2023, tier: 5, shareBoost: 0.02 },
        { name: 'OnePlus 13',         year: 2025, tier: 5, shareBoost: 0.02 },
        { name: 'OnePlus 15',         year: 2025, tier: 5, shareBoost: 0.02 }
    ],
    lifeEvents: [
        { year: 2014, text: 'OnePlus One "flagship killer" rilis.', shareDelta: 0.01 }
    ]
};
