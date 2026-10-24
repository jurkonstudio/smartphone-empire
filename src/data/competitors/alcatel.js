// FILE: src/data/competitors/alcatel.js
// Alcatel One Touch — kompetitor era 2000-2010 (celah audit: pemain kecil era ponsel fitur).
export const alcatel = {
    id: 'alcatel',
    name: 'Alcatel One Touch',
    country: 'Prancis',
    color: '#E4002B',
    activeFromYear: 2000, activeToYear: 2005,
    personality: 'follower',
    startShare: 0.02,
    researchStartTier: 1, researchSpeedMultiplier: 0.9,
    foundedYear: 1898, founder: 'Pierre Azaria (Alcatel modern)',
    hq: 'Paris, Prancis', parentCompany: 'Alcatel',
    origin: 'Raksasa telekomunikasi Prancis; lini ponsel One Touch dari akhir 1990-an.',
    exitReason: 'Lini ponsel dilebur ke usaha patungan TCL (2004) dan sepenuhnya diambil TCL (2005).',
    strengths: ['Harga terjangkau', 'Saluran operator'],
    weaknesses: ['Inovasi terbatas'],
    osName: 'Proprietary',
    factuality: 'historical',
    factNote: 'Garis besar perusahaan terverifikasi. Pangsa dipadatkan dan tahun/nama model produk berupa perkiraan.',
    sources: 'Wikipedia EN, arsip pers perusahaan',
    milestones: [
        { year: 2004, text: 'Usaha patungan ponsel dengan TCL.', verified: true },
        { year: 2005, text: 'TCL mengambil alih bisnis ponsel.', verified: true }
    ],
    trivia: [],
    shareByYear: {
        2000: 0.02, 2002: 0.025, 2004: 0.025, 2005: 0.02
    },
    signatureProducts: [
        { name: 'Alcatel One Touch 501', year: 2000, tier: 1, shareBoost: 0.005 },
        { name: 'Alcatel One Touch 535', year: 2002, tier: 1, shareBoost: 0.005 },
        { name: 'Alcatel One Touch 735', year: 2004, tier: 1, shareBoost: 0.005 }
    ],
    lifeEvents: [
        { year: 2005, text: 'Bisnis ponsel Alcatel pindah ke TCL.', shareDelta: -0.01 }
    ]
};
