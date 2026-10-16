// FILE: src/data/competitors/google_android.js
export const google_android = {
    id: 'google_android',
    name: 'Android (Ekosistem)',
    country: 'Amerika Serikat',
    color: '#4285F4',
    activeFromYear: 2008, activeToYear: null,
    personality: 'innovator',
    startShare: 0.005,
    researchStartTier: 3, researchSpeedMultiplier: 1.3,
    isEcosystem: true,
    foundedYear: 2003, founder: 'Andy Rubin, Rich Miner, Nick Sears, Chris White',
    hq: 'Mountain View, California, AS', parentCompany: 'Alphabet Inc.',
    origin: 'Android Inc. (2003) diakuisisi Google (2005) → OS open-source → ekosistem OEM.',
    exitReason: null,
    strengths: ['OS gratis', 'Ekosistem Google', 'Jangkauan OEM luas'],
    weaknesses: ['Fragmentasi versi', 'Kontrol hardware lemah'],
    osName: 'Android',
    factuality: 'mixed',
    factNote: 'Entitas ini mewakili ekosistem OS, bukan satu brand hardware. Pangsa mengacu jumlah device aktif Android global (bukan merek).',
    sources: 'Google Blog, Statcounter, IDC',
    milestones: [
        { year: 2003, text: 'Android Inc. didirikan oleh Andy Rubin dkk.', verified: true },
        { year: 2005, text: 'Diakuisisi Google (~$50 juta).', verified: true },
        { year: 2008, text: 'Android 1.0 + HTC Dream.', verified: true },
        { year: 2011, text: 'Menjadi OS ponsel terbesar global.', verified: true },
        { year: 2016, text: 'Google Pixel — hardware Google.', verified: true },
        { year: 2024, text: 'Android dikuasai ~70% pasar OS mobile global.', verified: true }
    ],
    trivia: [
        'Android awalnya dirancang untuk kamera digital, bukan ponsel.',
        'Nama versi Android (Cupcake, Donut, ...) semuanya makanan manis.'
    ],
    shareByYear: {
        2008: 0.005, 2009: 0.03, 2010: 0.10, 2011: 0.20, 2012: 0.35,
        2013: 0.50, 2014: 0.60, 2015: 0.65, 2016: 0.68, 2017: 0.70,
        2018: 0.72, 2019: 0.70, 2020: 0.72, 2021: 0.71, 2022: 0.70,
        2023: 0.70, 2024: 0.71, 2026: 0.72
    },
    // [v2027.4] Diperkaya: 21 entri historis 2008-2026.
    signatureProducts: [
        { name: 'Android 1.0',            year: 2008, tier: 3, shareBoost: 0.03 },
        { name: 'Android 1.5 Cupcake',    year: 2009, tier: 3, shareBoost: 0.02 },
        { name: 'Google Nexus One',       year: 2010, tier: 3, shareBoost: 0.02 },
        { name: 'Android 2.2 Froyo',      year: 2010, tier: 3, shareBoost: 0.02 },
        { name: 'Android 4.0 ICS',        year: 2011, tier: 4, shareBoost: 0.02 },
        { name: 'Google Nexus 7',         year: 2012, tier: 3, shareBoost: 0.02 },
        { name: 'Android 4.4 KitKat',     year: 2013, tier: 4, shareBoost: 0.02 },
        { name: 'Android 5.0 Lollipop',   year: 2014, tier: 4, shareBoost: 0.02 },
        { name: 'Google Nexus 6P',        year: 2015, tier: 4, shareBoost: 0.02 },
        { name: 'Google Pixel',           year: 2016, tier: 4, shareBoost: 0.02 },
        { name: 'Google Pixel 2',         year: 2017, tier: 4, shareBoost: 0.02 },
        { name: 'Google Pixel 3',         year: 2018, tier: 4, shareBoost: 0.02 },
        { name: 'Google Pixel 3a',        year: 2019, tier: 4, shareBoost: 0.02 },
        { name: 'Pixel 4a',               year: 2020, tier: 4, shareBoost: 0.02 },
        { name: 'Pixel 6 + Tensor',       year: 2021, tier: 5, shareBoost: 0.02 },
        { name: 'Pixel 7',                year: 2022, tier: 5, shareBoost: 0.02 },
        { name: 'Pixel Fold',             year: 2023, tier: 5, shareBoost: 0.02 },
        { name: 'Pixel 8 Pro',            year: 2023, tier: 5, shareBoost: 0.02 },
        { name: 'Pixel 9 + Gemini',       year: 2024, tier: 5, shareBoost: 0.02 },
        { name: 'Android 16',             year: 2025, tier: 5, shareBoost: 0.02 },
        { name: 'Pixel 10 + Tensor G5',   year: 2025, tier: 5, shareBoost: 0.02 }
    ],
    lifeEvents: [
        { year: 2008, text: 'Android diluncurkan sebagai OS terbuka.', shareDelta: 0.05 },
        { year: 2011, text: 'Android jadi OS ponsel terbesar.', shareDelta: 0.06 },
        { year: 2016, text: 'Google Pixel memperkuat kehadiran hardware.', shareDelta: 0.02 }
    ]
};
