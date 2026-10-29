// FILE: src/data/competitors/sagem.js
// Sagem — kompetitor era 2000-2010 (celah audit: pemain kecil era ponsel fitur).
export const sagem = {
    id: 'sagem',
    name: 'Sagem',
    country: 'Prancis',
    color: '#0A6EBD',
    activeFromYear: 2000, activeToYear: 2008,
    personality: 'follower',
    startShare: 0.018,
    researchStartTier: 1, researchSpeedMultiplier: 0.9,
    foundedYear: 1925, founder: 'Marcel Môme',
    hq: 'Paris, Prancis', parentCompany: 'Safran',
    origin: 'Perusahaan elektronik dan telekomunikasi Prancis; ponsel GSM sejak 1990-an.',
    exitReason: 'Divisi ponsel Sagem Wireless dilepas ke Sagemcom dan berhenti membuat ponsel (2008).',
    strengths: ['Jaringan operator Eropa', 'Harga bersaing'],
    weaknesses: ['Skala kecil', 'Merek kurang dikenal'],
    osName: 'Proprietary',
    factuality: 'historical',
    factNote: 'Garis besar perusahaan terverifikasi. Pangsa dipadatkan dan tahun/nama model produk berupa perkiraan.',
    sources: 'Wikipedia EN, arsip pers perusahaan',
    milestones: [
        { year: 1925, text: 'Sagem didirikan di Prancis.', verified: true },
        { year: 2008, text: 'Bisnis ponsel dihentikan.', verified: true }
    ],
    trivia: [],
    shareByYear: {
        2000: 0.018, 2002: 0.02, 2004: 0.018, 2006: 0.012, 2008: 0.004
    },
    signatureProducts: [
        { name: 'Sagem MC 850', year: 2001, tier: 1, shareBoost: 0.005 },
        { name: 'Sagem myX-5', year: 2003, tier: 1, shareBoost: 0.005 },
        { name: 'Sagem myV-65', year: 2004, tier: 2, shareBoost: 0.005 },
        { name: 'Sagem my401X', year: 2006, tier: 1, shareBoost: 0.0 }
    ],
    lifeEvents: [
        { year: 2008, text: 'Sagem menutup bisnis ponsel.', shareDelta: -0.008 }
    ]
};
