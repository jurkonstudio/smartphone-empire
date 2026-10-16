// FILE: src/data/competitors/apple.js
export const apple = {
    id: 'apple',
    name: 'Apple',
    country: 'Amerika Serikat',
    color: '#555555',
    activeFromYear: 2007, activeToYear: null,
    personality: 'premium',
    startShare: 0.003,
    researchStartTier: 3, researchSpeedMultiplier: 1.4,
    foundedYear: 1976, founder: 'Steve Jobs, Steve Wozniak, Ronald Wayne',
    hq: 'Cupertino, California, AS', parentCompany: null,
    origin: 'Komputer Apple II (1977) → Macintosh (1984) → iPod (2001) → iPhone (2007).',
    exitReason: null,
    strengths: ['Ekosistem iOS', 'Desain premium', 'Brand kuat', 'Retail'],
    weaknesses: ['Harga tinggi', 'Kontrol ketat'],
    osName: 'iOS',
    factuality: 'historical',
    factNote: 'Peristiwa terverifikasi. Pangsa global dihitung dari pasar total.',
    sources: 'Apple Newsroom, IDC, Counterpoint, Wikipedia EN',
    milestones: [
        { year: 1976, text: 'Didirikan oleh Steve Jobs, Wozniak, dan Ronald Wayne.', verified: true },
        { year: 1984, text: 'Macintosh — komputer pribadi dengan GUI.', verified: true },
        { year: 2001, text: 'iPod mengubah pasar pemutar musik.', verified: true },
        { year: 2007, text: 'iPhone pertama (29 Juni 2007) mengubah industri.', verified: true },
        { year: 2010, text: 'iPhone 4 — Retina display.', verified: true },
        { year: 2023, text: 'Apple menyalip Samsung sebagai vendor terbesar global dalam unit (Q4 2023).', verified: true }
    ],
    trivia: [
        'Apple hampir bangkrut pada 1997, diselamatkan investasi Microsoft $150 juta.',
        'iPhone awal hanya mendukung jaringan 2G — belum 3G.'
    ],
    shareByYear: {
        2007: 0.003, 2008: 0.008, 2009: 0.014, 2010: 0.030, 2011: 0.050,
        2012: 0.070, 2013: 0.090, 2014: 0.110, 2015: 0.130, 2016: 0.120,
        2017: 0.120, 2018: 0.130, 2019: 0.135, 2020: 0.150, 2021: 0.170,
        2022: 0.180, 2023: 0.200, 2024: 0.180, 2025: 0.185, 2026: 0.190
    },
    // [v2027.4] Diperkaya: 25 produk historis 2007-2026.
    signatureProducts: [
        { name: 'iPhone (2007)',      year: 2007, tier: 3, shareBoost: 0.05 },
        { name: 'iPhone 3G',          year: 2008, tier: 3, shareBoost: 0.03 },
        { name: 'iPhone 3GS',         year: 2009, tier: 3, shareBoost: 0.04 },
        { name: 'iPhone 4',           year: 2010, tier: 3, shareBoost: 0.05 },
        { name: 'iPhone 4S',          year: 2011, tier: 3, shareBoost: 0.04 },
        { name: 'iPhone 5',           year: 2012, tier: 4, shareBoost: 0.04 },
        { name: 'iPhone 5s',          year: 2013, tier: 4, shareBoost: 0.03 },
        { name: 'iPhone 5c',          year: 2013, tier: 3, shareBoost: 0.01 },
        { name: 'iPhone 6',           year: 2014, tier: 4, shareBoost: 0.05 },
        { name: 'iPhone 6s',          year: 2015, tier: 4, shareBoost: 0.03 },
        { name: 'iPhone SE',          year: 2016, tier: 3, shareBoost: 0.02 },
        { name: 'iPhone 7',           year: 2016, tier: 4, shareBoost: 0.03 },
        { name: 'iPhone X',           year: 2017, tier: 4, shareBoost: 0.04 },
        { name: 'iPhone 8',           year: 2017, tier: 4, shareBoost: 0.02 },
        { name: 'iPhone XS',          year: 2018, tier: 4, shareBoost: 0.02 },
        { name: 'iPhone XR',          year: 2018, tier: 4, shareBoost: 0.02 },
        { name: 'iPhone 11 Pro',      year: 2019, tier: 5, shareBoost: 0.03 },
        { name: 'iPhone 11',          year: 2019, tier: 4, shareBoost: 0.03 },
        { name: 'iPhone 12',          year: 2020, tier: 5, shareBoost: 0.04 },
        { name: 'iPhone 13 Pro',      year: 2021, tier: 5, shareBoost: 0.03 },
        { name: 'iPhone 14 Pro',      year: 2022, tier: 5, shareBoost: 0.03 },
        { name: 'iPhone 15 Pro',      year: 2023, tier: 5, shareBoost: 0.03 },
        { name: 'iPhone 16',          year: 2024, tier: 5, shareBoost: 0.03 },
        { name: 'iPhone 16e',         year: 2025, tier: 4, shareBoost: 0.02 },
        { name: 'iPhone 17',          year: 2025, tier: 5, shareBoost: 0.03 }
    ],
    lifeEvents: [
        { year: 2007, text: 'iPhone pertama mengubah industri.', shareDelta: 0.05 },
        { year: 2010, text: 'iPhone 4 memantapkan dominasi Apple.', shareDelta: 0.05 },
        { year: 2014, text: 'iPhone 6 jadi produk terlaris Apple.', shareDelta: 0.03 }
    ]
};
