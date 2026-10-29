// FILE: src/data/competitors/siemens.js
// Siemens — diperkaya dengan produk historis 2000-2006.
export const siemens = {
    id: 'siemens',
    name: 'Siemens',
    country: 'Jerman',
    color: '#EC6602',
    activeFromYear: 1994, activeToYear: 2006,
    personality: 'follower',
    startShare: 0.06,
    researchStartTier: 1, researchSpeedMultiplier: 0.9,
    foundedYear: 1847, founder: 'Werner von Siemens',
    hq: 'Munich, Jerman', parentCompany: 'Siemens AG',
    origin: 'Telegraf (1847) → listrik → telekomunikasi → ponsel Siemens S1 (1994).',
    exitReason: 'Divisi ponsel dijual ke BenQ (2005), BenQ-Siemens bangkrut 2006.',
    strengths: ['Rekayasa solid'],
    weaknesses: ['Lambat beradaptasi', 'Desain konservatif'],
    osName: 'Proprietary',
    factuality: 'historical',
    factNote: 'Peristiwa terverifikasi. Pangsa dipadatkan (Siemens pernah ~7% global).',
    sources: 'Siemens Historical Institute, Wikipedia EN',
    milestones: [
        { year: 1847, text: 'Didirikan oleh Werner von Siemens (telegraf).', verified: true },
        { year: 1994, text: 'Ponsel pertama: Siemens S1.', verified: true },
        { year: 2005, text: 'Divisi ponsel dijual ke BenQ (Taiwan).', verified: true },
        { year: 2006, text: 'BenQ-Siemens bangkrut, merek dihentikan.', verified: true }
    ],
    trivia: [
        'Siemens adalah perusahaan listrik tertua di Jerman (1847).',
        'Siemens juga membuat MRI, kereta cepat, dan turbin angin.'
    ],
    shareByYear: {
        2000: 0.06, 2002: 0.05, 2004: 0.04, 2005: 0.03, 2006: 0.01
    },
    // [v2027.4] Diperkaya: 7 produk historis 2000-2006.
    signatureProducts: [
        { name: 'Siemens S35',     year: 2000, tier: 1, shareBoost: 0.01 },
        { name: 'Siemens S45',     year: 2001, tier: 1, shareBoost: 0.01 },
        { name: 'Siemens SL45',    year: 2001, tier: 2, shareBoost: 0.01 },
        { name: 'Siemens S55',     year: 2002, tier: 2, shareBoost: 0.01 },
        { name: 'Siemens Xelibri', year: 2003, tier: 1, shareBoost: -0.01 },
        { name: 'Siemens S65',     year: 2004, tier: 2, shareBoost: 0.01 },
        { name: 'BenQ-Siemens EF81',year: 2006,tier: 2, shareBoost: 0.00 }
    ],
    lifeEvents: [
        { year: 2005, text: 'Siemens menjual divisi ponsel ke BenQ.', shareDelta: -0.04 },
        { year: 2006, text: 'BenQ-Siemens gagal dan berhenti produksi.', shareDelta: -0.03 }
    ]
};
