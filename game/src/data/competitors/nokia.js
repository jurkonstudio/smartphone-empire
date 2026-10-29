// FILE: src/data/competitors/nokia.js
// Nokia — diperkaya dengan produk historis 2000-2014.
export const nokia = {
    id: 'nokia',
    name: 'Nokia',
    country: 'Finlandia',
    color: '#124191',
    activeFromYear: 1982, activeToYear: 2014,
    personality: 'dominant',
    startShare: 0.30,
    researchStartTier: 2, researchSpeedMultiplier: 1.2,
    foundedYear: 1865, founder: 'Fredrik Idestam',
    hq: 'Espoo, Finlandia', parentCompany: null,
    origin: 'Pabrik pulp kayu (1865) → kabel (1898) → telekomunikasi (1960-an) → ponsel Mobira Senator (1982).',
    exitReason: 'Divisi ponsel diakuisisi Microsoft (2013–2014).',
    strengths: ['Distribusi global', 'Baterai awet', 'Desain kokoh'],
    weaknesses: ['Lambat beradaptasi ke layar sentuh'],
    osName: 'Symbian',
    factuality: 'historical',
    factNote: 'Tahun & pangsa mengacu data publik. Angka pangsa dibulatkan.',
    sources: 'Nokia Heritage, Science Museum Group, Wikipedia EN',
    milestones: [
        { year: 1865, text: 'Didirikan sebagai pabrik pulp kayu di Tampere oleh Fredrik Idestam.', verified: true },
        { year: 1898, text: 'Ekspansi ke produksi kabel & karet.', verified: true },
        { year: 1982, text: 'Mobira Senator — ponsel pertama Nokia.', verified: true },
        { year: 1998, text: 'Menjadi vendor ponsel terbesar dunia.', verified: true },
        { year: 2007, text: 'Puncak pangsa global ~38%.', verified: true },
        { year: 2013, text: 'Divisi ponsel diakuisisi Microsoft ($7,2 miliar).', verified: true }
    ],
    trivia: [
        'Nama "Nokia" diambil dari kota Nokia di Finlandia.',
        'Sebelum ponsel, Nokia memproduksi kertas toilet, ban, dan televisi.',
        'Mobira Senator (1982) berbobot ~10 kg — bukan ponsel saku.'
    ],
    shareByYear: {
        1999: 0.28, 2000: 0.30, 2003: 0.34, 2006: 0.34, 2007: 0.38,
        2008: 0.38, 2009: 0.36, 2010: 0.28, 2011: 0.23, 2012: 0.19,
        2013: 0.04, 2014: 0.00
    },
    // [v2027.4] Diperkaya: 13 produk historis 2000-2014.
    signatureProducts: [
        { name: 'Nokia 3310',            year: 2000, tier: 1, shareBoost: 0.02 },
        { name: 'Nokia 7650',            year: 2002, tier: 2, shareBoost: 0.01 },
        { name: 'Nokia 1100',            year: 2003, tier: 1, shareBoost: 0.02 },
        { name: 'Nokia N-Gage',          year: 2003, tier: 2, shareBoost: 0.01 },
        { name: 'Nokia 6630',            year: 2004, tier: 2, shareBoost: 0.01 },
        { name: 'Nokia N73',             year: 2006, tier: 2, shareBoost: 0.01 },
        { name: 'Nokia N95',             year: 2007, tier: 3, shareBoost: 0.02 },
        { name: 'Nokia 5800 XpressMusic',year: 2008, tier: 2, shareBoost: 0.01 },
        { name: 'Nokia E71',             year: 2008, tier: 3, shareBoost: 0.01 },
        { name: 'Nokia N900',            year: 2009, tier: 3, shareBoost: 0.01 },
        { name: 'Nokia N8',              year: 2010, tier: 3, shareBoost: 0.01 },
        { name: 'Nokia Lumia 800',       year: 2011, tier: 3, shareBoost: -0.01 },
        { name: 'Nokia Lumia 920',       year: 2012, tier: 3, shareBoost: -0.01 },
        { name: 'Nokia Lumia 1020',      year: 2013, tier: 4, shareBoost: 0.01 },
        { name: 'Nokia X',               year: 2014, tier: 2, shareBoost: 0.00 }
    ],
    lifeEvents: [
        { year: 2007, text: 'iPhone menggerus pangsa Nokia.', shareDelta: -0.05 },
        { year: 2011, text: 'Nokia beralih ke Windows Phone.', shareDelta: -0.08 },
        { year: 2013, text: 'Divisi ponsel Nokia diakuisisi Microsoft.', shareDelta: -0.15 }
    ]
};
