// FILE: src/data/competitors/palm.js
// Palm — diperkaya dengan produk historis 2002-2011.
export const palm = {
    id: 'palm',
    name: 'Palm',
    country: 'Amerika Serikat',
    color: '#B5651D',
    activeFromYear: 2002, activeToYear: 2011,
    personality: 'innovator',
    startShare: 0.02,
    researchStartTier: 2, researchSpeedMultiplier: 1.0,
    foundedYear: 1992, founder: 'Jeff Hawkins, Donna Dubinsky, Ed Colligan',
    hq: 'Sunnyvale, California, AS', parentCompany: null,
    origin: 'PDA Palm Pilot (1992) → ponsel Treo (2002) → webOS (2009).',
    exitReason: 'Diakuisisi HP (2010), divisi ditutup (2011).',
    strengths: ['Pionir PDA', 'Software rapi'],
    weaknesses: ['Harga tinggi', 'Ekosistem kecil'],
    osName: 'Palm OS → webOS',
    factuality: 'historical',
    factNote: 'Peristiwa terverifikasi. Palm adalah pionir kategori PDA sebelum smartphone.',
    sources: 'Palm Support archives, Wikipedia EN',
    milestones: [
        { year: 1992, text: 'Didirikan oleh Jeff Hawkins dkk.', verified: true },
        { year: 1996, text: 'Palm Pilot 1000 — PDA pertama sukses massal.', verified: true },
        { year: 2002, text: 'Treo 180 — PDA + ponsel pertama.', verified: true },
        { year: 2009, text: 'Palm Pre — webOS debut.', verified: true },
        { year: 2010, text: 'Diakuisisi HP ($1,2 miliar).', verified: true },
        { year: 2011, text: 'HP hentikan produksi perangkat webOS.', verified: true }
    ],
    trivia: [
        'Palm Pilot awal hanya punya 128 KB RAM.',
        'Graffiti — sistem tulisan tangan Palm — menjadi standar PDA 1990-an.'
    ],
    shareByYear: {
        2002: 0.02, 2003: 0.02, 2005: 0.02, 2007: 0.01, 2009: 0.01, 2011: 0.00
    },
    // [v2027.4] Diperkaya: 8 produk historis 2002-2011.
    signatureProducts: [
        { name: 'Palm Treo 180',   year: 2002, tier: 2, shareBoost: 0.01 },
        { name: 'Palm Treo 600',   year: 2003, tier: 2, shareBoost: 0.01 },
        { name: 'Palm Treo 650',   year: 2004, tier: 2, shareBoost: 0.01 },
        { name: 'Palm Treo 700w',  year: 2006, tier: 2, shareBoost: 0.00 },
        { name: 'Palm Treo 700p',  year: 2006, tier: 2, shareBoost: 0.00 },
        { name: 'Palm Centro',     year: 2007, tier: 2, shareBoost: 0.01 },
        { name: 'Palm Pre (webOS)',year: 2009, tier: 3, shareBoost: 0.01 },
        { name: 'Palm Pixi (webOS)',year: 2009,tier: 2, shareBoost: 0.00 }
    ],
    lifeEvents: [
        { year: 2009, text: 'Palm Pre dirilis dengan webOS.', shareDelta: 0.01 },
        { year: 2011, text: 'Palm diakuisisi HP dan berhenti.', shareDelta: -0.05 }
    ]
};
