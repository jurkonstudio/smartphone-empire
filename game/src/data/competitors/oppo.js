// FILE: src/data/competitors/oppo.js
export const oppo = {
    id: 'oppo', name: 'Oppo', country: 'Tiongkok', color: '#1F7A3B',
    activeFromYear: 2008, activeToYear: null,
    personality: 'follower', startShare: 0.003,
    researchStartTier: 2, researchSpeedMultiplier: 1.05,
    foundedYear: 2004, founder: 'Tony Chen (Chen Mingyong)',
    hq: 'Dongguan, Tiongkok', parentCompany: 'BBK Electronics',
    origin: 'Elektronik konsumen BBK → merek ponsel Oppo (2008).',
    exitReason: null,
    strengths: ['Selfie camera', 'Fast charging', 'Distribusi Asia'],
    weaknesses: ['Software kurang optimal'],
    osName: 'ColorOS / Android',
    factuality: 'historical',
    factNote: 'Peristiwa terverifikasi. Oppo & Vivo keduanya anak BBK Electronics.',
    sources: 'Oppo press, IDC, Wikipedia EN',
    milestones: [
        { year: 2004, text: 'Didirikan oleh Tony Chen di bawah BBK.', verified: true },
        { year: 2008, text: 'Merek ponsel: Oppo A103.', verified: true },
        { year: 2013, text: 'Oppo N1 — kamera berputar.', verified: true },
        { year: 2016, text: 'Puncak penjualan di Tiongkok.', verified: true },
        { year: 2018, text: 'Find X — kamera pop-up, desain tanpa bezel.', verified: true }
    ],
    trivia: [
        'Oppo, Vivo, dan OnePlus semuanya bagian dari BBK Electronics.',
        'Oppo pionir fast-charging "VOOC" sejak 2014.'
    ],
    shareByYear: {
        2008: 0.003, 2011: 0.005, 2013: 0.01, 2016: 0.06, 2018: 0.08,
        2020: 0.09, 2022: 0.10, 2024: 0.09, 2026: 0.09, // [paket kompetitor, SPEKULATIF] arah skenario 2027-2030
        2027: 0.085, 2028: 0.078, 2029: 0.083, 2030: 0.087
    },
    signatureProducts: [
        { name: 'OPPO Finder',        year: 2012, tier: 3, shareBoost: 0.02 },
        { name: 'OPPO N1',            year: 2013, tier: 4, shareBoost: 0.02 },
        { name: 'OPPO Find 7',        year: 2014, tier: 3, shareBoost: 0.02 },
        { name: 'OPPO R9',            year: 2016, tier: 4, shareBoost: 0.03 },
        { name: 'OPPO Find X',        year: 2018, tier: 5, shareBoost: 0.02 },
        { name: 'OPPO Reno',          year: 2019, tier: 4, shareBoost: 0.02 },
        { name: 'OPPO Find N',        year: 2021, tier: 5, shareBoost: 0.02 },
        { name: 'OPPO Find N3',       year: 2023, tier: 5, shareBoost: 0.02 },
        { name: 'OPPO Find X8',       year: 2024, tier: 5, shareBoost: 0.02 },
        { name: 'OPPO Find N5',       year: 2025, tier: 5, shareBoost: 0.02 },
        { name: 'OPPO Find X9',       year: 2025, tier: 5, shareBoost: 0.02 }
    ],
    lifeEvents: [
        { year: 2016, text: 'Oppo jadi merek terbesar di Tiongkok.', shareDelta: 0.04 }
    ]
};
