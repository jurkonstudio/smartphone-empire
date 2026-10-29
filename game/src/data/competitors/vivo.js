// FILE: src/data/competitors/vivo.js
export const vivo = {
    id: 'vivo', name: 'Vivo', country: 'Tiongkok', color: '#2C5EA0',
    activeFromYear: 2011, activeToYear: null,
    personality: 'follower', startShare: 0.003,
    researchStartTier: 2, researchSpeedMultiplier: 1.05,
    foundedYear: 2009, founder: 'Shen Wei',
    hq: 'Dongguan, Tiongkok', parentCompany: 'BBK Electronics',
    origin: 'Anak perusahaan BBK → merek ponsel Vivo (2011).',
    exitReason: null,
    strengths: ['In-display fingerprint', 'Audio DAC'],
    weaknesses: ['Brand awareness global rendah'],
    osName: 'Funtouch OS / Android',
    factuality: 'historical',
    factNote: 'Peristiwa terverifikasi. Vivo sering bekerja sama dengan sepak bola & musik.',
    sources: 'Vivo press, IDC, Wikipedia EN',
    milestones: [
        { year: 2009, text: 'Didirikan oleh Shen Wei (anak BBK).', verified: true },
        { year: 2011, text: 'Vivo V1 — ponsel pertama.', verified: true },
        { year: 2013, text: 'Xplay 3S — layar 2K pertama di smartphone.', verified: true },
        { year: 2018, text: 'NEX — kamera selfie pop-up.', verified: true },
        { year: 2020, text: 'X50 Pro — kamera gimbal.', verified: true }
    ],
    trivia: [
        'Vivo dan Oppo adalah "saudara" di bawah BBK Electronics.',
        'Vivo sering jadi sponsor resmi FIFA World Cup.'
    ],
    shareByYear: {
        2011: 0.002, 2013: 0.01, 2016: 0.05, 2018: 0.07, 2020: 0.08,
        2022: 0.09, 2024: 0.09, 2026: 0.09, // [paket kompetitor, SPEKULATIF] arah skenario 2027-2030
        2027: 0.085, 2028: 0.078, 2029: 0.083, 2030: 0.087
    },
    signatureProducts: [
        { name: 'vivo X5Max',         year: 2014, tier: 3, shareBoost: 0.02 },
        { name: 'vivo X20 Plus UD',   year: 2018, tier: 4, shareBoost: 0.02 },
        { name: 'vivo NEX',           year: 2018, tier: 5, shareBoost: 0.02 },
        { name: 'iQOO',               year: 2019, tier: 4, shareBoost: 0.02 },
        { name: 'vivo X50 Pro',       year: 2020, tier: 4, shareBoost: 0.02 },
        { name: 'vivo X60 & ZEISS',   year: 2021, tier: 4, shareBoost: 0.02 },
        { name: 'vivo X Fold',        year: 2022, tier: 5, shareBoost: 0.02 },
        { name: 'vivo X100',          year: 2023, tier: 5, shareBoost: 0.02 },
        { name: 'vivo X200',          year: 2024, tier: 5, shareBoost: 0.02 },
        { name: 'vivo X Fold5',       year: 2025, tier: 5, shareBoost: 0.02 },
        { name: 'vivo X300',          year: 2025, tier: 5, shareBoost: 0.02 }
    ],
    lifeEvents: [
        { year: 2018, text: 'Vivo jadi pemain utama di Asia Tenggara.', shareDelta: 0.03 }
    ]
};
