// FILE: src/data/competitors/blackberry.js
export const blackberry = {
    id: 'blackberry',
    name: 'BlackBerry (RIM)',
    country: 'Kanada',
    color: '#000000',
    activeFromYear: 2000, activeToYear: 2016,
    personality: 'premium',
    startShare: 0.01,
    researchStartTier: 2, researchSpeedMultiplier: 1.05,
    foundedYear: 1984, founder: 'Mike Lazaridis, Jim Balsillie',
    hq: 'Waterloo, Ontario, Kanada', parentCompany: 'Research In Motion',
    origin: 'Pager nirkabel (1984) → ponsel email RIM 957 (2000) → BlackBerry.',
    exitReason: 'Berhenti produksi ponsel sendiri (2016), lisensi merek ke TCL.',
    strengths: ['Keyboard fisik', 'Email aman', 'Baterai awet'],
    weaknesses: ['Layar sentuh lambat', 'Fokus korporat'],
    osName: 'BlackBerry OS',
    factuality: 'historical',
    factNote: 'Peristiwa terverifikasi. Pangsa dihitung dari pasar total (feature + smartphone).',
    sources: 'BlackBerry archives, Reuters, Wikipedia EN',
    milestones: [
        { year: 1984, text: 'Didirikan sebagai Research In Motion (RIM) oleh Mike Lazaridis.', verified: true },
        { year: 1999, text: 'RIM 850 — pager dua arah.', verified: true },
        { year: 2000, text: 'RIM 957 — smartphone-email pertama BlackBerry.', verified: true },
        { year: 2007, text: 'Puncak popularitas korporat.', verified: true },
        { year: 2013, text: 'Buyout & restrukturisasi.', verified: true },
        { year: 2016, text: 'Stop produksi ponsel sendiri.', verified: true }
    ],
    trivia: [
        'Presiden AS Barack Obama dikenal memakai BlackBerry sepanjang 2009–2016.',
        'Nama "BlackBerry" dipilih karena keyboardnya mirip biji blackberry.'
    ],
    shareByYear: {
        2000: 0.01, 2003: 0.02, 2005: 0.03, 2007: 0.04, 2008: 0.05,
        2009: 0.04, 2010: 0.04, 2011: 0.025, 2012: 0.015, 2013: 0.01,
        2015: 0.005, 2016: 0.00
    },
    // [v2027.4] Diperkaya: 11 produk historis 2000-2015.
    signatureProducts: [
        { name: 'BlackBerry 957',       year: 2000, tier: 1, shareBoost: 0.01 },
        { name: 'BlackBerry 5810',      year: 2002, tier: 1, shareBoost: 0.01 },
        { name: 'BlackBerry 7100',      year: 2004, tier: 2, shareBoost: 0.01 },
        { name: 'BlackBerry 8700',      year: 2005, tier: 2, shareBoost: 0.02 },
        { name: 'BlackBerry Pearl 8100',year: 2006, tier: 2, shareBoost: 0.02 },
        { name: 'BlackBerry Curve 8300',year: 2007, tier: 2, shareBoost: 0.02 },
        { name: 'BlackBerry Bold',      year: 2008, tier: 3, shareBoost: 0.02 },
        { name: 'BlackBerry Storm',     year: 2008, tier: 2, shareBoost: -0.01 },
        { name: 'BlackBerry Torch 9800',year: 2010, tier: 2, shareBoost: 0.00 },
        { name: 'BlackBerry Z10',       year: 2013, tier: 3, shareBoost: -0.02 },
        { name: 'BlackBerry Priv',      year: 2015, tier: 3, shareBoost: -0.01 }
    ],
    lifeEvents: [
        { year: 2006, text: 'BlackBerry populer di kalangan korporat.', shareDelta: 0.02 },
        { year: 2010, text: 'BlackBerry mulai ditinggalkan pasar konsumen.', shareDelta: -0.02 },
        { year: 2016, text: 'BlackBerry menghentikan produksi ponsel sendiri.', shareDelta: -0.01 }
    ]
};
