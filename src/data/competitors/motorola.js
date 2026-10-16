// FILE: src/data/competitors/motorola.js
// Motorola — diperkaya dengan produk historis 2000-2011.
export const motorola = {
    id: 'motorola',
    name: 'Motorola',
    country: 'Amerika Serikat',
    color: '#5C6BC0',
    activeFromYear: 1983, activeToYear: 2011,
    personality: 'aggressive',
    startShare: 0.15,
    researchStartTier: 1, researchSpeedMultiplier: 1.0,
    foundedYear: 1928, founder: 'Paul V. Galvin',
    hq: 'Schaumburg, Illinois, AS', parentCompany: null,
    origin: 'Galvin Manufacturing (radio mobil) → Motorola (1947) → semikonduktor → ponsel DynaTAC (1983).',
    exitReason: 'Motorola Mobility diakuisisi Google (2011), lalu Lenovo (2014).',
    strengths: ['Desain tipis', 'Harga kompetitif'],
    weaknesses: ['Inovasi lambat', 'Fokus pasar AS'],
    osName: 'Proprietary',
    factuality: 'historical',
    factNote: 'Peristiwa kunci terverifikasi. Angka pangsa merupakan perkiraan dari laporan industri.',
    sources: 'Motorola Solutions archives, CNET, Wikipedia EN',
    milestones: [
        { year: 1928, text: 'Didirikan sebagai Galvin Manufacturing oleh Paul V. Galvin.', verified: true },
        { year: 1947, text: 'Ganti nama menjadi Motorola.', verified: true },
        { year: 1983, text: 'DynaTAC 8000X — ponsel komersial pertama di dunia.', verified: true },
        { year: 1996, text: 'StarTAC — ponsel lipat pertama.', verified: true },
        { year: 2004, text: 'RAZR V3 — fenomena desain global.', verified: true },
        { year: 2011, text: 'Motorola Mobility diakuisisi Google.', verified: true }
    ],
    trivia: [
        'DynaTAC 8000X dijuluki "brick" karena bobotnya ~800 gram dan dijual ~$3.995.',
        'Nama "Motorola" awalnya untuk radio mobil — "motor" + "ola" (suffix dari Victrola).'
    ],
    shareByYear: {
        1999: 0.15, 2000: 0.15, 2003: 0.14, 2004: 0.16, 2005: 0.14,
        2006: 0.11, 2007: 0.09, 2008: 0.07, 2009: 0.04, 2010: 0.03,
        2011: 0.02
    },
    // [v2027.4] Diperkaya: 8 produk historis 2000-2011.
    signatureProducts: [
        { name: 'Motorola V60',       year: 2000, tier: 1, shareBoost: 0.01 },
        { name: 'Motorola RAZR V3',   year: 2004, tier: 2, shareBoost: 0.03 },
        { name: 'Motorola ROKR E1',   year: 2005, tier: 2, shareBoost: 0.00 },
        { name: 'Motorola Q',         year: 2006, tier: 2, shareBoost: 0.01 },
        { name: 'Motorola RAZR2 V8',  year: 2007, tier: 2, shareBoost: 0.01 },
        { name: 'Motorola Droid',     year: 2009, tier: 3, shareBoost: 0.02 },
        { name: 'Motorola Defy',      year: 2010, tier: 2, shareBoost: 0.01 },
        { name: 'Motorola Xoom',      year: 2011, tier: 3, shareBoost: -0.01 }
    ],
    lifeEvents: [
        { year: 2004, text: 'RAZR V3 jadi fenomena global.', shareDelta: 0.04 },
        { year: 2008, text: 'Motorola kesulitan bersaing di era smartphone.', shareDelta: -0.05 },
        { year: 2011, text: 'Motorola Mobility diakuisisi Google.', shareDelta: -0.05 }
    ]
};
