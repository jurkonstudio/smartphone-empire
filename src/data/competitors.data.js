// FILE: src/data/competitors.data.js
// ============================================================
// DATA KOMPETITOR DUNIA NYATA
// v2027.2b — aktifFromYear realistis, biografi, kurva historis.
//
// Catatan:
// - activeFromYear = tahun mulai jual ponsel merek sendiri.
//   Kalau < 1999 (game mulai 17 Nov 1999), otomatis aktif dari awal.
// - shareByYear = pangsa pasar total ponsel global (feature phone + smartphone).
// - isEcosystem: true untuk entitas yang mewakili ekosistem OS,
//   bukan brand hardware. Jangan dihitung dobel di total revenue.
// ============================================================

export const COMPETITORS = [
    // ==================== ERA 1: 2000-2006 ====================
    {
        id: 'nokia',
        name: 'Nokia',
        country: 'Finlandia',
        color: '#124191',
        activeFromYear: 1982,
        activeToYear: 2014,
        personality: 'dominant',
        startShare: 0.30,
        researchStartTier: 2,
        researchSpeedMultiplier: 1.2,
        foundedYear: 1865,
        founder: 'Fredrik Idestam',
        hq: 'Espoo, Finlandia',
        parentCompany: null,
        origin: 'Pabrik pulp kayu (1865) → kabel (1898) → telekomunikasi (1960-an) → ponsel Mobira (1982).',
        exitReason: 'Divisi ponsel diakuisisi Microsoft (2014).',
        strengths: ['Distribusi global', 'Baterai awet', 'Desain kokoh'],
        weaknesses: ['Lambat beradaptasi ke layar sentuh'],
        osName: 'Symbian',
        shareByYear: {
            1999: 0.28, 2000: 0.30, 2003: 0.34, 2006: 0.34, 2007: 0.38,
            2008: 0.38, 2009: 0.36, 2010: 0.28, 2011: 0.23, 2012: 0.19,
            2013: 0.04, 2014: 0.00
        },
        signatureProducts: [
            { name: 'Nokia 3310', year: 2000, tier: 1, shareBoost: 0.02 },
            { name: 'Nokia 1100', year: 2003, tier: 1, shareBoost: 0.02 },
            { name: 'Nokia N95',  year: 2007, tier: 2, shareBoost: 0.01 }
        ],
        lifeEvents: [
            { year: 2007, text: 'iPhone menggerus pangsa Nokia.', shareDelta: -0.05 },
            { year: 2011, text: 'Nokia beralih ke Windows Phone.', shareDelta: -0.08 },
            { year: 2013, text: 'Divisi ponsel Nokia diakuisisi Microsoft.', shareDelta: -0.15 }
        ]
    },
    {
        id: 'motorola',
        name: 'Motorola',
        country: 'Amerika Serikat',
        color: '#5C6BC0',
        activeFromYear: 1983,
        activeToYear: 2011,
        personality: 'aggressive',
        startShare: 0.15,
        researchStartTier: 1,
        researchSpeedMultiplier: 1.0,
        foundedYear: 1928,
        founder: 'Paul V. Galvin',
        hq: 'Schaumburg, Illinois, AS',
        parentCompany: null,
        origin: 'Galvin Manufacturing (radio mobil) → Motorola (1947) → semikonduktor → ponsel DynaTAC 8000X (1983).',
        exitReason: 'Motorola Mobility diakuisisi Lenovo (2014), merek memudar.',
        strengths: ['Desain tipis', 'Harga kompetitif'],
        weaknesses: ['Inovasi lambat', 'Fokus pasar AS'],
        osName: 'Proprietary',
        shareByYear: {
            1999: 0.15, 2000: 0.15, 2003: 0.14, 2004: 0.16, 2005: 0.14,
            2006: 0.11, 2007: 0.09, 2008: 0.07, 2009: 0.04, 2010: 0.03,
            2011: 0.02
        },
        signatureProducts: [
            { name: 'Motorola RAZR V3', year: 2004, tier: 2, shareBoost: 0.03 }
        ],
        lifeEvents: [
            { year: 2004, text: 'RAZR V3 jadi fenomena global.', shareDelta: 0.04 },
            { year: 2008, text: 'Motorola kesulitan bersaing di era smartphone.', shareDelta: -0.05 },
            { year: 2011, text: 'Motorola Mobility diakuisisi Google.', shareDelta: -0.05 }
        ]
    },
    {
        id: 'sony_ericsson',
        name: 'Sony Ericsson',
        country: 'Swedia/Jepang',
        color: '#00A551',
        activeFromYear: 2001,
        activeToYear: 2012,
        personality: 'premium',
        startShare: 0.05,
        researchStartTier: 1,
        researchSpeedMultiplier: 1.1,
        foundedYear: 2001,
        founder: 'Joint venture Sony & Ericsson',
        hq: 'London, Inggris',
        parentCompany: 'Sony Ericsson Mobile Communications (JV)',
        origin: 'Gabungan divisi ponsel Sony dan Ericsson.',
        exitReason: 'Sony membeli seluruh saham Ericsson (2012), merek dilebur.',
        strengths: ['Kamera', 'Desain musik', 'Kualitas audio'],
        weaknesses: ['Harga premium', 'Software kaku'],
        osName: 'Symbian / Android',
        shareByYear: {
            2001: 0.05, 2003: 0.06, 2005: 0.07, 2007: 0.08, 2008: 0.09,
            2009: 0.07, 2010: 0.04, 2011: 0.03, 2012: 0.02
        },
        signatureProducts: [
            { name: 'Sony Ericsson T610',   year: 2003, tier: 2, shareBoost: 0.02 },
            { name: 'Sony Ericsson K750i',  year: 2005, tier: 2, shareBoost: 0.02 },
            { name: 'Sony Ericsson Xperia', year: 2010, tier: 3, shareBoost: 0.01 }
        ],
        lifeEvents: [
            { year: 2001, text: 'Ericsson dan Sony bergabung.', shareDelta: 0.02 },
            { year: 2012, text: 'Sony membeli seluruh saham Ericsson.', shareDelta: 0.0 }
        ]
    },
    {
        id: 'samsung',
        name: 'Samsung',
        country: 'Korea Selatan',
        color: '#1428A0',
        activeFromYear: 1988,
        activeToYear: null,
        personality: 'aggressive',
        startShare: 0.05,
        researchStartTier: 1,
        researchSpeedMultiplier: 1.1,
        foundedYear: 1938,
        founder: 'Lee Byung-chul',
        hq: 'Suwon, Korea Selatan',
        parentCompany: 'Samsung Group',
        origin: 'Pedagang mie & ikan kering (1938) → elektronik (1969) → ponsel SH-100 (1988).',
        exitReason: null,
        strengths: ['Produksi komponen', 'Skala global', 'Inovasi layar'],
        weaknesses: ['Awalnya lemah di software'],
        osName: 'Proprietary → Android',
        shareByYear: {
            1999: 0.04, 2000: 0.05, 2002: 0.09, 2004: 0.12, 2006: 0.13,
            2008: 0.16, 2010: 0.20, 2012: 0.23, 2013: 0.28, 2015: 0.23,
            2016: 0.22, 2018: 0.20, 2020: 0.19, 2022: 0.21, 2024: 0.18,
            2026: 0.19
        },
        signatureProducts: [
            { name: 'Samsung Galaxy S',  year: 2010, tier: 3, shareBoost: 0.04 },
            { name: 'Samsung Galaxy S3', year: 2012, tier: 3, shareBoost: 0.05 },
            { name: 'Samsung Galaxy S24',year: 2024, tier: 5, shareBoost: 0.03 }
        ],
        lifeEvents: [
            { year: 2010, text: 'Samsung Galaxy S memulai kebangkitan.', shareDelta: 0.06 },
            { year: 2013, text: 'Samsung jadi pemimpin pasar Android.', shareDelta: 0.05 },
            { year: 2016, text: 'Skandal Note 7 menekan sementara.', shareDelta: -0.03 },
            { year: 2020, text: 'Samsung kembali dominan.', shareDelta: 0.02 }
        ]
    },
    {
        id: 'lg',
        name: 'LG',
        country: 'Korea Selatan',
        color: '#A50034',
        activeFromYear: 1996,
        activeToYear: 2021,
        personality: 'follower',
        startShare: 0.03,
        researchStartTier: 1,
        researchSpeedMultiplier: 0.95,
        foundedYear: 1947,
        founder: 'Koo In-hwoi',
        hq: 'Seoul, Korea Selatan',
        parentCompany: 'LG Group',
        origin: 'Kosmetik Lucky Chemical (1947) → elektronik GoldStar (1958) → ponsel LG-CU100 (1996).',
        exitReason: 'Keluar dari pasar ponsel (April 2021).',
        strengths: ['Desain berani', 'Kamera awal'],
        weaknesses: ['Software lemah', 'Konsistensi produk'],
        osName: 'Android',
        shareByYear: {
            2000: 0.03, 2003: 0.05, 2006: 0.06, 2008: 0.05, 2010: 0.04,
            2012: 0.04, 2014: 0.05, 2016: 0.04, 2018: 0.03, 2020: 0.02,
            2021: 0.01
        },
        signatureProducts: [
            { name: 'LG Chocolate', year: 2006, tier: 2, shareBoost: 0.02 },
            { name: 'LG G3',        year: 2014, tier: 4, shareBoost: 0.02 }
        ],
        lifeEvents: [
            { year: 2006, text: 'LG Chocolate populer.', shareDelta: 0.02 },
            { year: 2021, text: 'LG hengkang dari pasar ponsel.', shareDelta: -0.08 }
        ]
    },
    {
        id: 'siemens',
        name: 'Siemens',
        country: 'Jerman',
        color: '#EC6602',
        activeFromYear: 1994,
        activeToYear: 2006,
        personality: 'follower',
        startShare: 0.06,
        researchStartTier: 1,
        researchSpeedMultiplier: 0.9,
        foundedYear: 1847,
        founder: 'Werner von Siemens',
        hq: 'Munich, Jerman',
        parentCompany: 'Siemens AG',
        origin: 'Telegraf (1847) → listrik → telekomunikasi → ponsel Siemens S1 (1994).',
        exitReason: 'Divisi ponsel dijual ke BenQ (2005), BenQ-Siemens bangkrut 2006.',
        strengths: ['Rekayasa solid'],
        weaknesses: ['Lambat beradaptasi', 'Desain konservatif'],
        osName: 'Proprietary',
        shareByYear: {
            2000: 0.06, 2002: 0.05, 2004: 0.04, 2005: 0.03, 2006: 0.01
        },
        signatureProducts: [
            { name: 'Siemens S45', year: 2001, tier: 1, shareBoost: 0.01 }
        ],
        lifeEvents: [
            { year: 2005, text: 'Siemens menjual divisi ponsel ke BenQ.', shareDelta: -0.04 },
            { year: 2006, text: 'BenQ-Siemens gagal dan berhenti produksi.', shareDelta: -0.03 }
        ]
    },
    {
        id: 'palm',
        name: 'Palm',
        country: 'Amerika Serikat',
        color: '#B5651D',
        activeFromYear: 2002,
        activeToYear: 2011,
        personality: 'innovator',
        startShare: 0.02,
        researchStartTier: 2,
        researchSpeedMultiplier: 1.0,
        foundedYear: 1992,
        founder: 'Jeff Hawkins, Donna Dubinsky, Ed Colligan',
        hq: 'Sunnyvale, California, AS',
        parentCompany: null,
        origin: 'PDA Palm Pilot (1992) → ponsel Treo (2002) → webOS (2009).',
        exitReason: 'Diakuisisi HP (2010), ditutup 2011.',
        strengths: ['Pionir PDA', 'Software rapi'],
        weaknesses: ['Harga tinggi', 'Ekosistem kecil'],
        osName: 'Palm OS → webOS',
        shareByYear: {
            2002: 0.02, 2003: 0.02, 2005: 0.02, 2007: 0.01, 2009: 0.01, 2011: 0.00
        },
        signatureProducts: [
            { name: 'Palm Treo 650',    year: 2004, tier: 2, shareBoost: 0.01 },
            { name: 'Palm Pre (webOS)', year: 2009, tier: 3, shareBoost: 0.01 }
        ],
        lifeEvents: [
            { year: 2009, text: 'Palm Pre dirilis dengan webOS.', shareDelta: 0.01 },
            { year: 2011, text: 'Palm diakuisisi HP dan berhenti.', shareDelta: -0.05 }
        ]
    },
    {
        id: 'blackberry',
        name: 'BlackBerry (RIM)',
        country: 'Kanada',
        color: '#000000',
        activeFromYear: 2000,
        activeToYear: 2016,
        personality: 'premium',
        startShare: 0.01,
        researchStartTier: 2,
        researchSpeedMultiplier: 1.05,
        foundedYear: 1984,
        founder: 'Mike Lazaridis, Jim Balsillie',
        hq: 'Waterloo, Ontario, Kanada',
        parentCompany: 'Research In Motion',
        origin: 'Pager nirkabel (1984) → ponsel email RIM 957 (2000) → BlackBerry.',
        exitReason: 'Berhenti produksi ponsel sendiri (2016), lisensi ke TCL.',
        strengths: ['Keyboard fisik', 'Email aman', 'Baterai awet'],
        weaknesses: ['Layar sentuh lambat', 'Fokus korporat'],
        osName: 'BlackBerry OS',
        shareByYear: {
            2000: 0.01, 2003: 0.02, 2005: 0.03, 2007: 0.04, 2008: 0.05,
            2009: 0.04, 2010: 0.04, 2011: 0.025, 2012: 0.015, 2013: 0.01,
            2015: 0.005, 2016: 0.00
        },
        signatureProducts: [
            { name: 'BlackBerry 8700', year: 2005, tier: 2, shareBoost: 0.03 },
            { name: 'BlackBerry Bold', year: 2008, tier: 3, shareBoost: 0.02 },
            { name: 'BlackBerry Z10',  year: 2013, tier: 4, shareBoost: -0.02 }
        ],
        lifeEvents: [
            { year: 2006, text: 'BlackBerry populer di kalangan korporat.', shareDelta: 0.02 },
            { year: 2010, text: 'BlackBerry mulai ditinggalkan pasar konsumen.', shareDelta: -0.02 },
            { year: 2016, text: 'BlackBerry menghentikan produksi ponsel sendiri.', shareDelta: -0.01 }
        ]
    },
    {
        id: 'apple',
        name: 'Apple',
        country: 'Amerika Serikat',
        color: '#555555',
        activeFromYear: 2007,
        activeToYear: null,
        personality: 'premium',
        startShare: 0.003,
        researchStartTier: 3,
        researchSpeedMultiplier: 1.4,
        foundedYear: 1976,
        founder: 'Steve Jobs, Steve Wozniak, Ronald Wayne',
        hq: 'Cupertino, California, AS',
        parentCompany: null,
        origin: 'Komputer Apple II (1977) → Macintosh (1984) → iPod (2001) → iPhone (2007).',
        exitReason: null,
        strengths: ['Ekosistem iOS', 'Desain premium', 'Brand kuat', 'Retail'],
        weaknesses: ['Harga tinggi', 'Kontrol ketat'],
        osName: 'iOS',
        shareByYear: {
            2007: 0.003, 2008: 0.008, 2009: 0.014, 2010: 0.030, 2011: 0.050,
            2012: 0.070, 2013: 0.090, 2014: 0.110, 2015: 0.130, 2016: 0.120,
            2017: 0.120, 2018: 0.130, 2019: 0.135, 2020: 0.150, 2021: 0.170,
            2022: 0.180, 2023: 0.200, 2024: 0.180, 2025: 0.185, 2026: 0.190
        },
        signatureProducts: [
            { name: 'iPhone (2007)', year: 2007, tier: 3, shareBoost: 0.05 },
            { name: 'iPhone 3GS',    year: 2009, tier: 3, shareBoost: 0.04 },
            { name: 'iPhone 4',      year: 2010, tier: 3, shareBoost: 0.05 },
            { name: 'iPhone 12',     year: 2020, tier: 5, shareBoost: 0.04 }
        ],
        lifeEvents: [
            { year: 2007, text: 'iPhone pertama mengubah industri.', shareDelta: 0.05 },
            { year: 2010, text: 'iPhone 4 memantapkan dominasi Apple.', shareDelta: 0.05 },
            { year: 2014, text: 'iPhone 6 jadi produk terlaris Apple.', shareDelta: 0.03 }
        ]
    },
    {
        id: 'htc',
        name: 'HTC',
        country: 'Taiwan',
        color: '#69BE28',
        activeFromYear: 2006,
        activeToYear: 2019,
        personality: 'innovator',
        startShare: 0.005,
        researchStartTier: 2,
        researchSpeedMultiplier: 1.1,
        foundedYear: 1997,
        founder: 'Cher Wang, H.T. Cho, Peter Chou',
        hq: 'Taoyuan, Taiwan',
        parentCompany: null,
        origin: 'ODM Windows Mobile untuk operator (1997) → merek sendiri HTC TyTN (2006).',
        exitReason: 'Keluar dari pasar massal (2019), fokus VR & B2B.',
        strengths: ['Windows Mobile awal', 'Android awal', 'Desain logam'],
        weaknesses: ['Marketing lemah', 'Software kadang buggy'],
        osName: 'Windows Mobile → Android',
        shareByYear: {
            2006: 0.005, 2008: 0.02, 2010: 0.05, 2011: 0.08, 2012: 0.06,
            2013: 0.03, 2015: 0.02, 2018: 0.01, 2019: 0.005
        },
        signatureProducts: [
            { name: 'HTC Dream (G1)', year: 2008, tier: 3, shareBoost: 0.04 },
            { name: 'HTC One (M7)',   year: 2013, tier: 4, shareBoost: 0.02 }
        ],
        lifeEvents: [
            { year: 2008, text: 'HTC merilis Android pertama.', shareDelta: 0.05 },
            { year: 2013, text: 'HTC kesulitan bersaing harga.', shareDelta: -0.05 },
            { year: 2019, text: 'HTC hengkang dari pasar massal.', shareDelta: -0.03 }
        ]
    },
    {
        id: 'google_android',
        name: 'Android (Ekosistem)',
        country: 'Amerika Serikat',
        color: '#4285F4',
        activeFromYear: 2008,
        activeToYear: null,
        personality: 'innovator',
        startShare: 0.005,
        researchStartTier: 3,
        researchSpeedMultiplier: 1.3,
        isEcosystem: true,
        foundedYear: 2003,
        founder: 'Andy Rubin, Rich Miner, Nick Sears, Chris White',
        hq: 'Mountain View, California, AS',
        parentCompany: 'Alphabet Inc.',
        origin: 'Android Inc. (2003) diakuisisi Google (2005) → OS open-source → ekosistem OEM.',
        exitReason: null,
        strengths: ['OS gratis', 'Ekosistem Google', 'Jangkauan OEM luas'],
        weaknesses: ['Fragmentasi versi', 'Kontrol hardware lemah'],
        osName: 'Android',
        shareByYear: {
            2008: 0.005, 2009: 0.03, 2010: 0.10, 2011: 0.20, 2012: 0.35,
            2013: 0.50, 2014: 0.60, 2015: 0.65, 2016: 0.68, 2017: 0.70,
            2018: 0.72, 2019: 0.70, 2020: 0.72, 2021: 0.71, 2022: 0.70,
            2023: 0.70, 2024: 0.71, 2026: 0.72
        },
        signatureProducts: [
            { name: 'Android 1.0',  year: 2008, tier: 3, shareBoost: 0.03 },
            { name: 'Google Pixel', year: 2016, tier: 4, shareBoost: 0.02 }
        ],
        lifeEvents: [
            { year: 2008, text: 'Android diluncurkan sebagai OS terbuka.', shareDelta: 0.05 },
            { year: 2011, text: 'Android jadi OS ponsel terbesar.', shareDelta: 0.06 },
            { year: 2016, text: 'Google Pixel memperkuat kehadiran hardware.', shareDelta: 0.02 }
        ]
    },
    {
        id: 'huawei',
        name: 'Huawei',
        country: 'Tiongkok',
        color: '#CF0A2C',
        activeFromYear: 2004,
        activeToYear: null,
        personality: 'aggressive',
        startShare: 0.005,
        researchStartTier: 3,
        researchSpeedMultiplier: 1.2,
        foundedYear: 1987,
        founder: 'Ren Zhengfei',
        hq: 'Shenzhen, Tiongkok',
        parentCompany: 'Huawei Technologies',
        origin: 'Peralatan jaringan telekomunikasi (1987) → ponsel Huawei U626 (2004) → flagship P/Mate.',
        exitReason: null,
        strengths: ['Kamera Leica', 'Chip Kirin', 'Harga agresif'],
        weaknesses: ['Sanksi AS (2019+)'],
        osName: 'Android → HarmonyOS',
        shareByYear: {
            2004: 0.005, 2008: 0.01, 2012: 0.03, 2014: 0.05, 2016: 0.08,
            2018: 0.11, 2019: 0.13, 2020: 0.11, 2021: 0.04, 2022: 0.03,
            2023: 0.04, 2024: 0.05, 2026: 0.05
        },
        signatureProducts: [
            { name: 'Huawei P9',      year: 2016, tier: 4, shareBoost: 0.03 },
            { name: 'Huawei P30 Pro', year: 2019, tier: 5, shareBoost: 0.04 },
            { name: 'Huawei Mate 60', year: 2023, tier: 5, shareBoost: 0.02 }
        ],
        lifeEvents: [
            { year: 2016, text: 'Huawei masuk jajaran 3 besar dunia.', shareDelta: 0.04 },
            { year: 2019, text: 'Sanksi AS membatasi akses Google.', shareDelta: -0.03 },
            { year: 2021, text: 'Huawei mengembangkan HarmonyOS.', shareDelta: 0.01 }
        ]
    },
    {
        id: 'xiaomi',
        name: 'Xiaomi',
        country: 'Tiongkok',
        color: '#FF6900',
        activeFromYear: 2011,
        activeToYear: null,
        personality: 'aggressive',
        startShare: 0.005,
        researchStartTier: 2,
        researchSpeedMultiplier: 1.15,
        foundedYear: 2010,
        founder: 'Lei Jun dkk',
        hq: 'Beijing, Tiongkok',
        parentCompany: 'Xiaomi Corporation',
        origin: 'Software MIUI (2010) → ponsel Mi 1 (2011) → ekosistem IoT.',
        exitReason: null,
        strengths: ['Harga murah', 'Ekosistem IoT', 'Komunitas fanatik'],
        weaknesses: ['Reputasi brand awal', 'Iklan di OS'],
        osName: 'MIUI / Android',
        shareByYear: {
            2011: 0.005, 2013: 0.02, 2014: 0.03, 2016: 0.04, 2018: 0.07,
            2020: 0.11, 2022: 0.13, 2024: 0.14, 2026: 0.14
        },
        signatureProducts: [
            { name: 'Xiaomi Mi 1',    year: 2011, tier: 3, shareBoost: 0.02 },
            { name: 'Redmi Note',     year: 2014, tier: 4, shareBoost: 0.03 },
            { name: 'Xiaomi 14 Ultra',year: 2024, tier: 5, shareBoost: 0.03 }
        ],
        lifeEvents: [
            { year: 2014, text: 'Xiaomi jadi merek ponsel Tiongkok terbesar.', shareDelta: 0.03 },
            { year: 2018, text: 'Xiaomi IPO dan ekspansi global.', shareDelta: 0.02 }
        ]
    },
    {
        id: 'oppo',
        name: 'Oppo',
        country: 'Tiongkok',
        color: '#1F7A3B',
        activeFromYear: 2008,
        activeToYear: null,
        personality: 'follower',
        startShare: 0.003,
        researchStartTier: 2,
        researchSpeedMultiplier: 1.05,
        foundedYear: 2004,
        founder: 'Tony Chen (Chen Mingyong)',
        hq: 'Dongguan, Tiongkok',
        parentCompany: 'BBK Electronics',
        origin: 'Elektronik konsumen BBK → merek ponsel Oppo (2008).',
        exitReason: null,
        strengths: ['Selfie camera', 'Fast charging', 'Distribusi Asia'],
        weaknesses: ['Software kurang optimal'],
        osName: 'ColorOS / Android',
        shareByYear: {
            2008: 0.003, 2011: 0.005, 2013: 0.01, 2016: 0.06, 2018: 0.08,
            2020: 0.09, 2022: 0.10, 2024: 0.09, 2026: 0.09
        },
        signatureProducts: [
            { name: 'Oppo N1',     year: 2013, tier: 4, shareBoost: 0.02 },
            { name: 'Oppo Find X', year: 2018, tier: 5, shareBoost: 0.02 }
        ],
        lifeEvents: [
            { year: 2016, text: 'Oppo jadi merek terbesar di Tiongkok.', shareDelta: 0.04 }
        ]
    },
    {
        id: 'vivo',
        name: 'Vivo',
        country: 'Tiongkok',
        color: '#2C5EA0',
        activeFromYear: 2011,
        activeToYear: null,
        personality: 'follower',
        startShare: 0.003,
        researchStartTier: 2,
        researchSpeedMultiplier: 1.05,
        foundedYear: 2009,
        founder: 'Shen Wei',
        hq: 'Dongguan, Tiongkok',
        parentCompany: 'BBK Electronics',
        origin: 'Anak perusahaan BBK → merek ponsel Vivo (2011).',
        exitReason: null,
        strengths: ['In-display fingerprint', 'Audio DAC'],
        weaknesses: ['Brand awareness global rendah'],
        osName: 'Funtouch OS / Android',
        shareByYear: {
            2011: 0.002, 2013: 0.01, 2016: 0.05, 2018: 0.07, 2020: 0.08,
            2022: 0.09, 2024: 0.09, 2026: 0.09
        },
        signatureProducts: [
            { name: 'Vivo X20',      year: 2017, tier: 4, shareBoost: 0.02 },
            { name: 'Vivo X100 Pro', year: 2024, tier: 5, shareBoost: 0.02 }
        ],
        lifeEvents: [
            { year: 2018, text: 'Vivo jadi pemain utama di Asia Tenggara.', shareDelta: 0.03 }
        ]
    },
    {
        id: 'microsoft_nokia',
        name: 'Microsoft Lumia',
        country: 'Amerika Serikat',
        color: '#00A4EF',
        activeFromYear: 2013,
        activeToYear: 2017,
        personality: 'declining',
        startShare: 0.03,
        researchStartTier: 3,
        researchSpeedMultiplier: 1.0,
        foundedYear: 2013,
        founder: 'Microsoft (akuisisi divisi ponsel Nokia)',
        hq: 'Redmond, Washington, AS',
        parentCompany: 'Microsoft Corporation',
        origin: 'Akuisisi divisi ponsel Nokia (2013) → merek Lumia dengan Windows Phone.',
        exitReason: 'Ditutup (2017), merek dihentikan.',
        strengths: ['Kamera PureView', 'Windows Phone UI'],
        weaknesses: ['Ekosistem app minim', 'Akuisisi gagal'],
        osName: 'Windows Phone',
        shareByYear: {
            2013: 0.03, 2014: 0.02, 2015: 0.01, 2016: 0.005, 2017: 0.00
        },
        signatureProducts: [
            { name: 'Lumia 1020', year: 2013, tier: 4, shareBoost: 0.02 },
            { name: 'Lumia 950',  year: 2015, tier: 4, shareBoost: -0.02 }
        ],
        lifeEvents: [
            { year: 2013, text: 'Microsoft akuisisi Nokia.', shareDelta: 0.0 },
            { year: 2016, text: 'Microsoft menyerah di pasar ponsel.', shareDelta: -0.03 }
        ]
    },
    {
        id: 'honor',
        name: 'Honor',
        country: 'Tiongkok',
        color: '#0066CC',
        activeFromYear: 2013,
        activeToYear: null,
        personality: 'aggressive',
        startShare: 0.002,
        researchStartTier: 4,
        researchSpeedMultiplier: 1.15,
        foundedYear: 2013,
        founder: 'Huawei (sub-brand)',
        hq: 'Shenzhen, Tiongkok',
        parentCompany: 'Honor Device Co. (mandiri sejak 2020)',
        origin: 'Sub-brand Huawei (2013) untuk segmen muda → spin-off mandiri (2020).',
        exitReason: null,
        strengths: ['Harga agresif', 'Desain muda'],
        weaknesses: ['Brand baru global pasca-split'],
        osName: 'MagicOS / Android',
        shareByYear: {
            2013: 0.002, 2015: 0.005, 2018: 0.02, 2020: 0.01, 2022: 0.03,
            2024: 0.04, 2026: 0.05
        },
        signatureProducts: [
            { name: 'Honor Magic5 Pro', year: 2023, tier: 5, shareBoost: 0.03 }
        ],
        lifeEvents: [
            { year: 2020, text: 'Honor berpisah dari Huawei.', shareDelta: 0.02 }
        ]
    },
    {
        id: 'oneplus',
        name: 'OnePlus',
        country: 'Tiongkok',
        color: '#EB0028',
        activeFromYear: 2014,
        activeToYear: null,
        personality: 'innovator',
        startShare: 0.002,
        researchStartTier: 3,
        researchSpeedMultiplier: 1.15,
        foundedYear: 2013,
        founder: 'Pete Lau, Carl Pei',
        hq: 'Shenzhen, Tiongkok',
        parentCompany: 'BBK Electronics (via Oppo)',
        origin: 'Sub-brand Oppo untuk pasar global → ponsel OnePlus One (2014).',
        exitReason: null,
        strengths: ['Harga flagship killer', 'Software bersih', 'Komunitas fanatik'],
        weaknesses: ['Skala produksi kecil', 'Ketergantungan Oppo'],
        osName: 'OxygenOS / Android',
        shareByYear: {
            2014: 0.002, 2016: 0.005, 2018: 0.008, 2020: 0.010, 2022: 0.012,
            2024: 0.010, 2026: 0.010
        },
        signatureProducts: [
            { name: 'OnePlus One', year: 2014, tier: 4, shareBoost: 0.02 },
            { name: 'OnePlus 11',  year: 2023, tier: 5, shareBoost: 0.02 }
        ],
        lifeEvents: [
            { year: 2014, text: 'OnePlus One "flagship killer" rilis.', shareDelta: 0.01 }
        ]
    },
    {
        id: 'nothing',
        name: 'Nothing',
        country: 'Inggris',
        color: '#000000',
        activeFromYear: 2022,
        activeToYear: null,
        personality: 'innovator',
        startShare: 0.001,
        researchStartTier: 4,
        researchSpeedMultiplier: 1.2,
        foundedYear: 2020,
        founder: 'Carl Pei',
        hq: 'London, Inggris',
        parentCompany: 'Nothing Technology',
        origin: 'Startup Carl Pei (co-founder OnePlus) → ponsel transparan Nothing Phone (1).',
        exitReason: null,
        strengths: ['Desain transparan unik', 'Software bersih', 'Marketing viral'],
        weaknesses: ['Skala produksi kecil'],
        osName: 'Nothing OS / Android',
        shareByYear: {
            2022: 0.001, 2023: 0.003, 2024: 0.004, 2026: 0.005
        },
        signatureProducts: [
            { name: 'Nothing Phone (1)', year: 2022, tier: 5, shareBoost: 0.02 },
            { name: 'Nothing Phone (2)', year: 2023, tier: 5, shareBoost: 0.02 }
        ],
        lifeEvents: [
            { year: 2022, text: 'Nothing merilis ponsel transparan pertama.', shareDelta: 0.02 }
        ]
    }
];

export const FICTIONAL_NAMES = {
    nokia: 'Nokio',
    motorola: 'Motora',
    sony_ericsson: 'Sonic Ericson',
    samsung: 'Samsul',
    lg: 'LGX',
    siemens: 'Simen',
    palm: 'Pamu',
    blackberry: 'Blackburry',
    apple: 'Apel',
    htc: 'HTCX',
    google_android: 'Gugel OS',
    huawei: 'Huawaei',
    xiaomi: 'Xioami',
    oppo: 'Opoh',
    vivo: 'Viva',
    microsoft_nokia: 'Microkia',
    honor: 'Honour',
    oneplus: 'OnePlusX',
    nothing: 'Somewhat'
};

export function getCompetitorById(id) {
    return COMPETITORS.find(c => c.id === id) || null;
}

export function getFictionalName(id) {
    return FICTIONAL_NAMES[id] || id;
}

export function getActiveCompetitors(year) {
    return COMPETITORS.filter(c => {
        if (year < c.activeFromYear) return false;
        if (c.activeToYear !== null && year > c.activeToYear) return false;
        return true;
    });
}

export function getLifeEventsForYear(year) {
    const events = [];
    COMPETITORS.forEach(c => {
        (c.lifeEvents || []).forEach(le => {
            if (le.year === year) {
                events.push({ competitorId: c.id, competitorName: c.name, ...le });
            }
        });
    });
    return events;
}

// ============================================================
// HISTORICAL SHARE — interpolasi linear antar pivot.
// ============================================================
export function getHistoricalShare(competitorId, year) {
    const comp = getCompetitorById(competitorId);
    if (!comp || !comp.shareByYear) return null;
    const map = comp.shareByYear;
    if (map[year] !== undefined) return map[year];
    const years = Object.keys(map).map(Number).sort((a, b) => a - b);
    if (!years.length) return null;
    if (year < years[0]) return map[years[0]];
    if (year > years[years.length - 1]) return map[years[years.length - 1]];
    for (let i = 0; i < years.length - 1; i++) {
        const y1 = years[i], y2 = years[i + 1];
        if (year >= y1 && year <= y2) {
            const v1 = map[y1], v2 = map[y2];
            return v1 + (v2 - v1) * ((year - y1) / (y2 - y1));
        }
    }
    return map[years[years.length - 1]];
            }
