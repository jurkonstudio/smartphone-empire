// FILE: src/data/competitors/xiaomi.js
export const xiaomi = {
    id: 'xiaomi', name: 'Xiaomi', country: 'Tiongkok', color: '#FF6900',
    activeFromYear: 2011, activeToYear: null,
    personality: 'aggressive', startShare: 0.001,
    researchStartTier: 3, researchSpeedMultiplier: 1.15,
    foundedYear: 2010, founder: 'Lei Jun',
    hq: 'Beijing, Tiongkok', parentCompany: 'Xiaomi Corporation (HKEX: 1810)',
    origin: 'Startup perangkat lunak MIUI (2010) → ponsel Mi 1 dengan spesifikasi flagship harga setengahnya (2011).',
    exitReason: null,
    strengths: ['Rasio harga-performa', 'Ekosistem IoT luas', 'Penjualan online efisien'],
    weaknesses: ['Margin tipis', 'Brand premium masih dibangun'],
    osName: 'MIUI / HyperOS (Android)',
    factuality: 'historical',
    factNote: 'Peristiwa terverifikasi. Xiaomi IPO di Hong Kong pada 2018.',
    sources: 'Xiaomi press, IDC, Counterpoint, Wikipedia EN',
    milestones: [
        { year: 2010, text: 'Didirikan oleh Lei Jun; MIUI dirilis.', verified: true },
        { year: 2011, text: 'Mi 1 — ponsel pertama.', verified: true },
        { year: 2013, text: 'Redmi — lini anggaran.', verified: true },
        { year: 2018, text: 'IPO di Bursa Hong Kong.', verified: true },
        { year: 2021, text: 'Naik ke posisi 2 dunia dan umumkan kendaraan listrik.', verified: true }
    ],
    trivia: [
        'Xiaomi dikenal dengan penjualan \"flash sale\" online yang habis dalam hitungan menit.',
        'Ekosistem Xiaomi mencakup TV, robot penyedot debu, hingga skuter listrik.'
    ],
    shareByYear: {
        2011: 0.001, 2013: 0.010, 2014: 0.040, 2015: 0.045, 2016: 0.035,
        2017: 0.060, 2018: 0.085, 2020: 0.105, 2021: 0.130, 2022: 0.125,
        2024: 0.130, 2026: 0.130
    },
    signatureProducts: [
        { name: 'Xiaomi Mi 1',        year: 2011, tier: 3, shareBoost: 0.00 },
        { name: 'Redmi',              year: 2013, tier: 2, shareBoost: 0.01 },
        { name: 'Xiaomi Mi 4',        year: 2014, tier: 3, shareBoost: 0.01 },
        { name: 'Xiaomi Mi Mix',      year: 2016, tier: 4, shareBoost: 0.01 },
        { name: 'Poco F1',            year: 2018, tier: 4, shareBoost: 0.01 },
        { name: 'Xiaomi Mi Note 10',  year: 2019, tier: 4, shareBoost: 0.01 },
        { name: 'Xiaomi Mi 10',       year: 2020, tier: 5, shareBoost: 0.01 },
        { name: 'Xiaomi 14',          year: 2023, tier: 5, shareBoost: 0.01 },
        { name: 'Xiaomi 15',          year: 2024, tier: 5, shareBoost: 0.01 },
        { name: 'Xiaomi 17',          year: 2025, tier: 5, shareBoost: 0.01 }
    ],
    lifeEvents: [
        { year: 2014, text: 'Xiaomi memulai ekspansi global.', shareDelta: 0.01 }
    ]
};
