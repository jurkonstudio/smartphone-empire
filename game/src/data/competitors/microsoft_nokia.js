// FILE: src/data/competitors/microsoft_nokia.js
export const microsoft_nokia = {
    id: 'microsoft_nokia', name: 'Microsoft Lumia', country: 'Amerika Serikat', color: '#00A4EF',
    activeFromYear: 2013, activeToYear: 2017,
    personality: 'declining', startShare: 0.03,
    researchStartTier: 3, researchSpeedMultiplier: 1.0,
    foundedYear: 2013, founder: 'Microsoft (akuisisi divisi ponsel Nokia)',
    hq: 'Redmond, Washington, AS', parentCompany: 'Microsoft Corporation',
    origin: 'Akuisisi divisi ponsel Nokia (2013) → merek Lumia dengan Windows Phone.',
    exitReason: 'Ditutup (2017), merek dihentikan.',
    strengths: ['Kamera PureView', 'Windows Phone UI'],
    weaknesses: ['Ekosistem app minim', 'Akuisisi gagal'],
    osName: 'Windows Phone',
    factuality: 'historical',
    factNote: 'Peristiwa terverifikasi. Microsoft menulis-off ~$7,6 miliar dari akuisisi ini.',
    sources: 'Microsoft Newsroom, SEC filings, Wikipedia EN',
    milestones: [
        { year: 2013, text: 'Microsoft akuisisi divisi ponsel Nokia ($7,2 miliar).', verified: true },
        { year: 2013, text: 'Lumia 1020 — kamera 41 MP.', verified: true },
        { year: 2015, text: 'Windows 10 Mobile diluncurkan.', verified: true },
        { year: 2016, text: 'Write-off dan PHK besar di divisi ponsel.', verified: true },
        { year: 2017, text: 'Microsoft hentikan Windows Phone.', verified: true }
    ],
    trivia: [
        'Lumia 1020 (2013) masih dianggap salah satu kamera ponsel terbaik dekade itu.',
        'Microsoft menulis-off ~$7,6 miliar dari akuisisi Nokia — salah satu kerugian terbesar di industri.'
    ],
    shareByYear: {
        2013: 0.03, 2014: 0.02, 2015: 0.01, 2016: 0.005, 2017: 0.00
    },
    signatureProducts: [
        { name: 'Lumia 1020',      year: 2013, tier: 4, shareBoost: 0.02 },
        { name: 'Microsoft Lumia 535', year: 2014, tier: 2, shareBoost: 0.00 },
        { name: 'Lumia 950',       year: 2015, tier: 4, shareBoost: -0.02 },
        { name: 'Lumia 950 XL',    year: 2015, tier: 4, shareBoost: -0.01 },
        { name: 'Lumia 650',       year: 2016, tier: 2, shareBoost: -0.01 },
        { name: 'Lumia 550',       year: 2016, tier: 2, shareBoost: -0.01 }
    ],
    lifeEvents: [
        { year: 2013, text: 'Microsoft akuisisi Nokia.', shareDelta: 0.0 },
        { year: 2016, text: 'Microsoft menyerah di pasar ponsel.', shareDelta: -0.03 }
    ]
};
