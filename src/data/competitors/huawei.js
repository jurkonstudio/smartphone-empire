// FILE: src/data/competitors/huawei.js
export const huawei = {
    id: 'huawei',
    name: 'Huawei',
    country: 'Tiongkok',
    color: '#CF0A2C',
    activeFromYear: 2004, activeToYear: null,
    personality: 'aggressive',
    startShare: 0.005,
    researchStartTier: 3, researchSpeedMultiplier: 1.2,
    foundedYear: 1987, founder: 'Ren Zhengfei',
    hq: 'Shenzhen, Tiongkok', parentCompany: 'Huawei Technologies',
    origin: 'Peralatan jaringan telekomunikasi (1987) → ponsel Huawei U626 (2004) → flagship P/Mate.',
    exitReason: null,
    strengths: ['Kamera Leica', 'Chip Kirin', 'Harga agresif'],
    weaknesses: ['Sanksi AS (2019+)'],
    osName: 'Android → HarmonyOS',
    factuality: 'historical',
    factNote: 'Peristiwa terverifikasi. Angka pangsa mengacu pasar total, bukan smartphone saja.',
    sources: 'Huawei Annual Report, Reuters, IDC',
    milestones: [
        { year: 1987, text: 'Didirikan oleh Ren Zhengfei (peralatan jaringan).', verified: true },
        { year: 2004, text: 'Ponsel pertama: Huawei U626.', verified: true },
        { year: 2016, text: 'Huawei P9 dengan kamera Leica — masuk 3 besar dunia.', verified: true },
        { year: 2019, text: 'Sanksi AS membatasi akses Google.', verified: true },
        { year: 2021, text: 'Meluncurkan HarmonyOS sebagai OS sendiri.', verified: true },
        { year: 2023, text: 'Huawei Mate 60 dengan chip Kirin 9000s (7nm).', verified: true }
    ],
    trivia: [
        'Ren Zhengfei adalah mantan insinyur militer PLA.',
        'Huawei adalah perusahaan telekom di balik banyak jaringan 4G/5G dunia.'
    ],
    shareByYear: {
        2004: 0.005, 2008: 0.01, 2012: 0.03, 2014: 0.05, 2016: 0.08,
        2018: 0.11, 2019: 0.13, 2020: 0.11, 2021: 0.04, 2022: 0.03,
        2023: 0.04, 2024: 0.05, 2026: 0.05, // [paket kompetitor, SPEKULATIF] arah skenario 2027-2030
        2027: 0.05, 2028: 0.05, 2029: 0.05, 2030: 0.05
    },
    // [v2027.4] Diperkaya: 21 produk historis 2004-2026.
    signatureProducts: [
        { name: 'Huawei U626',         year: 2004, tier: 1, shareBoost: 0.01 },
        { name: 'Huawei U8220',        year: 2009, tier: 2, shareBoost: 0.01 },
        { name: 'Huawei Ascend P1',    year: 2012, tier: 2, shareBoost: 0.01 },
        { name: 'Huawei Ascend P6',    year: 2013, tier: 3, shareBoost: 0.02 },
        { name: 'Google Nexus 6P',     year: 2015, tier: 3, shareBoost: 0.02 },
        { name: 'Huawei P9',           year: 2016, tier: 4, shareBoost: 0.03 },
        { name: 'Huawei Mate 10',      year: 2017, tier: 4, shareBoost: 0.02 },
        { name: 'Huawei P20 Pro',      year: 2018, tier: 4, shareBoost: 0.03 },
        { name: 'Huawei Mate 20 Pro',  year: 2018, tier: 4, shareBoost: 0.02 },
        { name: 'Huawei Mate X',       year: 2019, tier: 5, shareBoost: 0.02 },
        { name: 'Huawei P30 Pro',      year: 2019, tier: 5, shareBoost: 0.04 },
        { name: 'Huawei Mate 30 Pro',  year: 2019, tier: 5, shareBoost: -0.02 },
        { name: 'Huawei P40 Pro',      year: 2020, tier: 5, shareBoost: 0.01 },
        { name: 'Huawei P50 Pro',      year: 2021, tier: 5, shareBoost: 0.00 },
        { name: 'Huawei Mate 50',      year: 2022, tier: 5, shareBoost: 0.01 },
        { name: 'Huawei Mate 60 Pro',  year: 2023, tier: 5, shareBoost: 0.03 },
        { name: 'Huawei Mate XT',      year: 2024, tier: 5, shareBoost: 0.02 },
        { name: 'Huawei Pura 70',      year: 2024, tier: 5, shareBoost: 0.02 },
        { name: 'Huawei Pura 80',      year: 2025, tier: 5, shareBoost: 0.02 },
        { name: 'Huawei Mate XTs',     year: 2025, tier: 5, shareBoost: 0.02 },
        { name: 'Huawei Mate 80',      year: 2025, tier: 5, shareBoost: 0.02 }
    ],
    lifeEvents: [
        { year: 2016, text: 'Huawei masuk jajaran 3 besar dunia.', shareDelta: 0.04 },
        { year: 2019, text: 'Sanksi AS membatasi akses Google.', shareDelta: -0.03 },
        { year: 2021, text: 'Huawei mengembangkan HarmonyOS.', shareDelta: 0.01 }
    ]
};
