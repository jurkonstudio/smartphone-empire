// FILE: src/data/competitors/novamind.js  (BARU — paket kompetitor)
// Pendatang FIKTIF AI-native. SPEKULATIF: skenario permainan, bukan prediksi
// atau perusahaan nyata. Tidak meniru perusahaan mana pun.
export const novamind = {
    id: 'novamind',
    name: 'Novamind',
    country: 'Fiktif',
    color: '#7c3aed',
    activeFromYear: 2028,
    activeToYear: null,
    personality: 'innovator',
    startShare: 0.002,
    researchStartTier: 5,
    researchSpeedMultiplier: 1.2,
    foundedYear: 2026,
    founder: 'Fiktif',
    hq: 'Fiktif',
    parentCompany: 'Novamind Labs (fiktif)',
    origin: 'Startup fiktif yang merancang ponsel di sekitar agen AI, bukan di sekitar aplikasi.',
    exitReason: null,
    strengths: ['Agen AI sebagai inti OS', 'Antarmuka suara/teks tunggal', 'Citra pendatang baru'],
    weaknesses: ['Skala produksi kecil', 'Bergantung pasokan memori mahal', 'Ekosistem aplikasi tipis'],
    osName: 'Novamind Agent OS',
    factuality: 'speculative',
    factNote: 'Perusahaan fiktif untuk skenario permainan 2028-2030. Bukan fakta dan bukan prediksi.',
    sources: 'Skenario permainan',
    milestones: [
        { year: 2028, text: 'Mengumumkan ponsel pertama berbasis agen AI. (skenario)', verified: false }
    ],
    trivia: [
        'Novamind adalah perusahaan fiktif; kemiripan nama dengan perusahaan nyata tidak disengaja.'
    ],
    shareByYear: {
        2028: 0.002, 2029: 0.006, 2030: 0.010
    },
    signatureProducts: [
        { name: 'Novamind One',  year: 2028, tier: 5, shareBoost: 0.003 },
        { name: 'Novamind Two',  year: 2029, tier: 5, shareBoost: 0.003 }
    ],
    lifeEvents: [
        { year: 2028, text: 'Novamind (fiktif) masuk pasar dengan ponsel berbasis agen AI.', shareDelta: 0.002 }
    ]
};
