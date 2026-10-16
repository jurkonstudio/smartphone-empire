// FILE: src/data/competitors/nothing.js
export const nothing = {
    id: 'nothing',
    name: 'Nothing',
    country: 'Inggris',
    color: '#000000',
    activeFromYear: 2022,
    activeToYear: null,
    personality: 'innovator',
    startShare: 0.001,
    researchStartTier: 4,
    researchSpeedMultiplier: 1.2,
    foundedYear: 2020,
    founder: 'Carl Pei',
    hq: 'London, Inggris',
    parentCompany: 'Nothing Technology',
    origin: 'Startup Carl Pei (co-founder OnePlus) -> ponsel transparan Nothing Phone (1).',
    exitReason: null,
    strengths: ['Desain transparan unik', 'Software bersih', 'Marketing viral'],
    weaknesses: ['Skala produksi kecil'],
    osName: 'Nothing OS / Android',
    factuality: 'historical',
    factNote: 'Peristiwa terverifikasi. Nothing adalah pemain termuda di daftar ini.',
    sources: 'Nothing press, The Verge, Wikipedia EN',
    milestones: [
        { year: 2020, text: 'Didirikan oleh Carl Pei (co-founder OnePlus).', verified: true },
        { year: 2021, text: 'Ear (1) - TWS pertama.', verified: true },
        { year: 2022, text: 'Phone (1) - ponsel transparan debut.', verified: true },
        { year: 2023, text: 'Phone (2) - flagship mid-range.', verified: true }
    ],
    trivia: [
        'Nama Nothing sengaja kontras dengan industri yang penuh sesuatu.',
        'Carl Pei mendirikan Nothing setelah keluar dari OnePlus pada 2020.'
    ],
    shareByYear: {
        2022: 0.001, 2023: 0.003, 2024: 0.004, 2026: 0.005
    },
    signatureProducts: [
        { name: 'Nothing Phone (1)',  year: 2022, tier: 5, shareBoost: 0.02 },
        { name: 'Nothing Phone (2)',  year: 2023, tier: 5, shareBoost: 0.02 },
        { name: 'Nothing Phone (2a)', year: 2024, tier: 4, shareBoost: 0.02 },
        { name: 'CMF Phone 1',        year: 2024, tier: 3, shareBoost: 0.02 },
        { name: 'Nothing Phone (3a)', year: 2025, tier: 4, shareBoost: 0.02 },
        { name: 'Nothing Phone (3)',  year: 2025, tier: 5, shareBoost: 0.01 },
        { name: 'Nothing Phone (4a)', year: 2026, tier: 4, shareBoost: 0.02 }
    ],
    lifeEvents: [
        { year: 2022, text: 'Nothing merilis ponsel transparan pertama.', shareDelta: 0.02 }
    ]
};
