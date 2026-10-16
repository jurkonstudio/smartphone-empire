// FILE: src/data/competitors/honor.js
export const honor = {
    id: 'honor', name: 'Honor', country: 'Tiongkok', color: '#0066CC',
    activeFromYear: 2013, activeToYear: null,
    personality: 'aggressive', startShare: 0.002,
    researchStartTier: 4, researchSpeedMultiplier: 1.15,
    foundedYear: 2013, founder: 'Huawei (sub-brand)',
    hq: 'Shenzhen, Tiongkok', parentCompany: 'Honor Device Co. (mandiri sejak 2020)',
    origin: 'Sub-brand Huawei (2013) untuk segmen muda → spin-off mandiri (2020).',
    exitReason: null,
    strengths: ['Harga agresif', 'Desain muda'],
    weaknesses: ['Brand baru global pasca-split'],
    osName: 'MagicOS / Android',
    factuality: 'historical',
    factNote: 'Peristiwa terverifikasi. Honor dijual dari Huawei untuk hindari sanksi AS.',
    sources: 'Honor press, Reuters, Wikipedia EN',
    milestones: [
        { year: 2013, text: 'Didirikan sebagai sub-brand Huawei.', verified: true },
        { year: 2015, text: 'Honor 7 populer di Tiongkok.', verified: true },
        { year: 2020, text: 'Spin-off dari Huawei karena sanksi AS (17 Nov 2020).', verified: true },
        { year: 2022, text: 'Ekspansi global sebagai entitas mandiri.', verified: true }
    ],
    trivia: [
        'Honor dijual ke konsorsium Shenzhen untuk menghindari sanksi AS terhadap Huawei.',
        'Tanggal spin-off Honor (17 Nov 2020) — kebetulan sama dengan tanggal mulai game!'
    ],
    shareByYear: {
        2013: 0.002, 2015: 0.005, 2018: 0.02, 2020: 0.01, 2022: 0.03,
        2024: 0.04, 2026: 0.05
    },
    signatureProducts: [
        { name: 'Honor 6',            year: 2014, tier: 3, shareBoost: 0.01 },
        { name: 'Honor 8',            year: 2016, tier: 3, shareBoost: 0.02 },
        { name: 'Honor Magic 2',      year: 2018, tier: 4, shareBoost: 0.01 },
        { name: 'Honor V40',          year: 2021, tier: 3, shareBoost: 0.02 },
        { name: 'Honor Magic Vs',     year: 2022, tier: 4, shareBoost: 0.02 },
        { name: 'Honor Magic V2',     year: 2023, tier: 4, shareBoost: 0.02 },
        { name: 'Honor Magic5 Pro',   year: 2023, tier: 5, shareBoost: 0.03 },
        { name: 'Honor Magic6 Pro',   year: 2024, tier: 5, shareBoost: 0.02 },
        { name: 'Honor Magic7',       year: 2024, tier: 5, shareBoost: 0.02 },
        { name: 'Honor Magic V5',     year: 2025, tier: 5, shareBoost: 0.02 },
        { name: 'Honor Magic V6',     year: 2026, tier: 5, shareBoost: 0.02 }
    ],
    lifeEvents: [
        { year: 2020, text: 'Honor berpisah dari Huawei.', shareDelta: 0.02 }
    ]
};
