// FILE: src/data/competitors.data.js
// ============================================================
// DATA KOMPETITOR DUNIA NYATA
// v2027.3a — tambah biografi transparan: factuality + milestones
// + trivia + sources. Setiap milestone punya flag `verified`.
//
// Tingkat faktualitas:
//   'historical' — hampir semua angka & peristiwa berasal dari publik.
//   'mixed'      — fakta + penyederhanaan/penggabungan demi gameplay.
//   'fictional'  — entitas game murni.
// ============================================================

export const COMPETITORS = [
    // ==================== NOKIA ====================
    {
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

    // ==================== MOTOROLA ====================
    {
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
        signatureProducts: [
            { name: 'Motorola RAZR V3', year: 2004, tier: 2, shareBoost: 0.03 }
        ],
        lifeEvents: [
            { year: 2004, text: 'RAZR V3 jadi fenomena global.', shareDelta: 0.04 },
            { year: 2008, text: 'Motorola kesulitan bersaing di era smartphone.', shareDelta: -0.05 },
            { year: 2011, text: 'Motorola Mobility diakuisisi Google.', shareDelta: -0.05 }
        ]
    },

    // ==================== SONY ERICSSON ====================
    {
        id: 'sony_ericsson',
        name: 'Sony Ericsson',
        country: 'Swedia / Jepang',
        color: '#00A551',
        activeFromYear: 2001, activeToYear: 2012,
        personality: 'premium',
        startShare: 0.05,
        researchStartTier: 1, researchSpeedMultiplier: 1.1,
        foundedYear: 2001, founder: 'Joint venture Sony & Ericsson',
        hq: 'London, Inggris', parentCompany: 'Sony Ericsson Mobile Communications',
        origin: 'Gabungan divisi ponsel Sony dan Ericsson. Fokus di kamera & musik.',
        exitReason: 'Sony membeli seluruh saham Ericsson (Feb 2012), merek dilebur.',
        strengths: ['Kamera', 'Walkman', 'Kualitas audio'],
        weaknesses: ['Harga premium', 'Software kaku'],
        osName: 'Symbian → Android',
        factuality: 'historical',
        factNote: 'Peristiwa terverifikasi. Ponsel pertama Sony Ericsson sebenarnya JV.',
        sources: 'Sony Mobile press archives, Wikipedia EN',
        milestones: [
            { year: 2001, text: 'Sony & Ericsson resmi bergabung (1 Oktober 2001).', verified: true },
            { year: 2003, text: 'T610 — ponsel kamera populer di pasar global.', verified: true },
            { year: 2005, text: 'W800 Walkman Phone — ponsel musik populer.', verified: true },
            { year: 2010, text: 'Xperia X10 — masuk era Android.', verified: true },
            { year: 2012, text: 'Sony beli seluruh saham Ericsson (Februari 2012).', verified: true }
        ],
        trivia: [
            'Sony Ericsson adalah joint venture 50:50.',
            'W800 Walkman Phone menginspirasi era ponsel-musik sebelum iPhone.'
        ],
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

    // ==================== SAMSUNG ====================
    {
        id: 'samsung',
        name: 'Samsung',
        country: 'Korea Selatan',
        color: '#1428A0',
        activeFromYear: 1988, activeToYear: null,
        personality: 'aggressive',
        startShare: 0.05,
        researchStartTier: 1, researchSpeedMultiplier: 1.1,
        foundedYear: 1938, founder: 'Lee Byung-chul',
        hq: 'Suwon, Korea Selatan', parentCompany: 'Samsung Group',
        origin: 'Pedagang mie & ikan kering (1938) → elektronik Samsung (1969) → ponsel SH-100 (1988).',
        exitReason: null,
        strengths: ['Produksi komponen', 'Skala global', 'Inovasi layar'],
        weaknesses: ['Awalnya lemah di software'],
        osName: 'Proprietary → Android',
        factuality: 'historical',
        factNote: 'Peristiwa terverifikasi. Angka pangsa global diambil dari laporan IDC/Counterpoint.',
        sources: 'Samsung Newsroom, IDC, Counterpoint Research, Wikipedia EN',
        milestones: [
            { year: 1938, text: 'Didirikan oleh Lee Byung-chul sebagai perusahaan dagang.', verified: true },
            { year: 1969, text: 'Samsung Electronics didirikan.', verified: true },
            { year: 1988, text: 'Ponsel pertama: Samsung SH-100.', verified: true },
            { year: 2010, text: 'Galaxy S — era Android dimulai.', verified: true },
            { year: 2012, text: 'Menjadi vendor ponsel terbesar global (Q1 2012).', verified: true },
            { year: 2016, text: 'Skandal baterai Note 7 — recall global.', verified: true }
        ],
        trivia: [
            'Samsung memulai sebagai eksportir mie instan dan ikan kering ke Manchuria.',
            '"Samsung" berarti "tiga bintang" dalam bahasa Korea.'
        ],
        shareByYear: {
            1999: 0.04, 2000: 0.05, 2002: 0.09, 2004: 0.12, 2006: 0.13,
            2008: 0.16, 2010: 0.20, 2012: 0.23, 2013: 0.28, 2015: 0.23,
            2016: 0.22, 2018: 0.20, 2020: 0.19, 2022: 0.21, 2024: 0.18, 2026: 0.19
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

    // ==================== LG ====================
    {
        id: 'lg',
        name: 'LG',
        country: 'Korea Selatan',
        color: '#A50034',
        activeFromYear: 1996, activeToYear: 2021,
        personality: 'follower',
        startShare: 0.03,
        researchStartTier: 1, researchSpeedMultiplier: 0.95,
        foundedYear: 1947, founder: 'Koo In-hwoi',
        hq: 'Seoul, Korea Selatan', parentCompany: 'LG Group',
        origin: 'Kosmetik Lucky Chemical (1947) → elektronik GoldStar (1958) → ponsel LG-CU100 (1996).',
        exitReason: 'Keluar dari pasar ponsel global (26 Juli 2021).',
        strengths: ['Desain berani', 'Kamera awal'],
        weaknesses: ['Software lemah', 'Konsistensi produk'],
        osName: 'Android',
        factuality: 'historical',
        factNote: 'Peristiwa terverifikasi. LG pernah jadi top-3 global pada awal 2000-an.',
        sources: 'LG Newsroom, Reuters, Wikipedia EN',
        milestones: [
            { year: 1947, text: 'Didirikan sebagai Lucky Chemical (kosmetik).', verified: true },
            { year: 1958, text: 'Berdiri GoldStar (elektronik).', verified: true },
            { year: 1996, text: 'Ponsel pertama: LG-CU100.', verified: true },
            { year: 2006, text: 'LG Chocolate — ponsel desain populer.', verified: true },
            { year: 2014, text: 'LG G3 — layar QHD pertama di flagship.', verified: true },
            { year: 2021, text: 'Keluar dari pasar ponsel global.', verified: true }
        ],
        trivia: [
            '"LG" adalah singkatan dari Lucky-GoldStar.',
            'LG pernah jadi vendor ponsel top-3 global pada 2008.'
        ],
        shareByYear: {
            2000: 0.03, 2003: 0.05, 2006: 0.06, 2008: 0.05, 2010: 0.04,
            2012: 0.04, 2014: 0.05, 2016: 0.04, 2018: 0.03, 2020: 0.02, 2021: 0.01
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

    // ==================== SIEMENS ====================
    {
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
        signatureProducts: [
            { name: 'Siemens S45', year: 2001, tier: 1, shareBoost: 0.01 }
        ],
        lifeEvents: [
            { year: 2005, text: 'Siemens menjual divisi ponsel ke BenQ.', shareDelta: -0.04 },
            { year: 2006, text: 'BenQ-Siemens gagal dan berhenti produksi.', shareDelta: -0.03 }
        ]
    },

    // ==================== PALM ====================
    {
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
        signatureProducts: [
            { name: 'Palm Treo 650',    year: 2004, tier: 2, shareBoost: 0.01 },
            { name: 'Palm Pre (webOS)', year: 2009, tier: 3, shareBoost: 0.01 }
        ],
        lifeEvents: [
            { year: 2009, text: 'Palm Pre dirilis dengan webOS.', shareDelta: 0.01 },
            { year: 2011, text: 'Palm diakuisisi HP dan berhenti.', shareDelta: -0.05 }
        ]
    },

    // ==================== BLACKBERRY ====================
    {
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

    // ==================== APPLE ====================
    {
        id: 'apple',
        name: 'Apple',
        country: 'Amerika Serikat',
        color: '#555555',
        activeFromYear: 2007, activeToYear: null,
        personality: 'premium',
        startShare: 0.003,
        researchStartTier: 3, researchSpeedMultiplier: 1.4,
        foundedYear: 1976, founder: 'Steve Jobs, Steve Wozniak, Ronald Wayne',
        hq: 'Cupertino, California, AS', parentCompany: null,
        origin: 'Komputer Apple II (1977) → Macintosh (1984) → iPod (2001) → iPhone (2007).',
        exitReason: null,
        strengths: ['Ekosistem iOS', 'Desain premium', 'Brand kuat', 'Retail'],
        weaknesses: ['Harga tinggi', 'Kontrol ketat'],
        osName: 'iOS',
        factuality: 'historical',
        factNote: 'Peristiwa terverifikasi. Pangsa global dihitung dari pasar total.',
        sources: 'Apple Newsroom, IDC, Counterpoint, Wikipedia EN',
        milestones: [
            { year: 1976, text: 'Didirikan oleh Steve Jobs, Wozniak, dan Ronald Wayne.', verified: true },
            { year: 1984, text: 'Macintosh — komputer pribadi dengan GUI.', verified: true },
            { year: 2001, text: 'iPod mengubah pasar pemutar musik.', verified: true },
            { year: 2007, text: 'iPhone pertama (29 Juni 2007) mengubah industri.', verified: true },
            { year: 2010, text: 'iPhone 4 — Retina display.', verified: true },
            { year: 2023, text: 'Apple menyalip Samsung sebagai vendor terbesar global dalam unit (Q4 2023).', verified: true }
        ],
        trivia: [
            'Apple hampir bangkrut pada 1997, diselamatkan investasi Microsoft $150 juta.',
            'iPhone awal hanya mendukung jaringan 2G — belum 3G.'
        ],
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

    // ==================== HTC ====================
    {
        id: 'htc',
        name: 'HTC',
        country: 'Taiwan',
        color: '#69BE28',
        activeFromYear: 2006, activeToYear: 2019,
        personality: 'innovator',
        startShare: 0.005,
        researchStartTier: 2, researchSpeedMultiplier: 1.1,
        foundedYear: 1997, founder: 'Cher Wang, H.T. Cho, Peter Chou',
        hq: 'Taoyuan, Taiwan', parentCompany: null,
        origin: 'ODM Windows Mobile untuk operator (1997) → merek sendiri HTC TyTN (2006).',
        exitReason: 'Keluar dari pasar massal (2019), fokus VR & B2B.',
        strengths: ['Windows Mobile awal', 'Android awal', 'Desain logam'],
        weaknesses: ['Marketing lemah', 'Software kadang buggy'],
        osName: 'Windows Mobile → Android',
        factuality: 'historical',
        factNote: 'Peristiwa terverifikasi. HTC adalah pembuat Android phone pertama.',
        sources: 'HTC archives, Wikipedia EN',
        milestones: [
            { year: 1997, text: 'Didirikan oleh Cher Wang dkk sebagai ODM.', verified: true },
            { year: 2002, text: 'Windows Mobile pertama dengan merek HTC.', verified: true },
            { year: 2006, text: 'Mulai merek sendiri: HTC TyTN.', verified: true },
            { year: 2008, text: 'HTC Dream (T-Mobile G1) — Android phone pertama.', verified: true },
            { year: 2011, text: 'Puncak pangsa global (~10%).', verified: true },
            { year: 2017, text: 'Divisi smartphone sebagian diakuisisi Google.', verified: true }
        ],
        trivia: [
            'HTC membuat banyak ponsel Windows Mobile untuk operator sebelum bikin merek sendiri.',
            'Google membeli sebagian divisi HTC sebesar $1,1 miliar (2017).'
        ],
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

    // ==================== ANDROID ====================
    {
        id: 'google_android',
        name: 'Android (Ekosistem)',
        country: 'Amerika Serikat',
        color: '#4285F4',
        activeFromYear: 2008, activeToYear: null,
        personality: 'innovator',
        startShare: 0.005,
        researchStartTier: 3, researchSpeedMultiplier: 1.3,
        isEcosystem: true,
        foundedYear: 2003, founder: 'Andy Rubin, Rich Miner, Nick Sears, Chris White',
        hq: 'Mountain View, California, AS', parentCompany: 'Alphabet Inc.',
        origin: 'Android Inc. (2003) diakuisisi Google (2005) → OS open-source → ekosistem OEM.',
        exitReason: null,
        strengths: ['OS gratis', 'Ekosistem Google', 'Jangkauan OEM luas'],
        weaknesses: ['Fragmentasi versi', 'Kontrol hardware lemah'],
        osName: 'Android',
        factuality: 'mixed',
        factNote: 'Entitas ini mewakili ekosistem OS, bukan satu brand hardware. Pangsa mengacu jumlah device aktif Android global (bukan merek).',
        sources: 'Google Blog, Statcounter, IDC',
        milestones: [
            { year: 2003, text: 'Android Inc. didirikan oleh Andy Rubin dkk.', verified: true },
            { year: 2005, text: 'Diakuisisi Google (~$50 juta).', verified: true },
            { year: 2008, text: 'Android 1.0 + HTC Dream.', verified: true },
            { year: 2011, text: 'Menjadi OS ponsel terbesar global.', verified: true },
            { year: 2016, text: 'Google Pixel — hardware Google.', verified: true },
            { year: 2024, text: 'Android dikuasai ~70% pasar OS mobile global.', verified: true }
        ],
        trivia: [
            'Android awalnya dirancang untuk kamera digital, bukan ponsel.',
            'Nama versi Android (Cupcake, Donut, ...) semuanya makanan manis.'
        ],
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

    // ==================== HUAWEI ====================
    {
        id: 'huawei',
        name: 'Huawei',
        country: 'Tiongkok',
        color: '#CF0A2C',
        activeFromYear: 2004, activeToYear: null,
        personality: 'aggressive',
        startShare: 0.005,
        researchStartTier: 3, researchSpeedMultiplier: 1.2,
        foundedYear: 1987, founder: 'Ren Zhengfei',
        hq: 'Shenzhen, Tiongkok', parentCompany: 'Huawei Technologies',
        origin: 'Peralatan jaringan telekomunikasi (1987) → ponsel Huawei U626 (2004) → flagship P/Mate.',
        exitReason: null,
        strengths: ['Kamera Leica', 'Chip Kirin', 'Harga agresif'],
        weaknesses: ['Sanksi AS (2019+)'],
        osName: 'Android → HarmonyOS',
        factuality: 'historical',
        factNote: 'Peristiwa terverifikasi. Angka pangsa mengacu pasar total, bukan smartphone saja.',
        sources: 'Huawei Annual Report, Reuters, IDC',
        milestones: [
            { year: 1987, text: 'Didirikan oleh Ren Zhengfei (peralatan jaringan).', verified: true },
            { year: 2004, text: 'Ponsel pertama: Huawei U626.', verified: true },
            { year: 2016, text: 'Huawei P9 dengan kamera Leica — masuk 3 besar dunia.', verified: true },
            { year: 2019, text: 'Sanksi AS membatasi akses Google.', verified: true },
            { year: 2021, text: 'Meluncurkan HarmonyOS sebagai OS sendiri.', verified: true },
            { year: 2023, text: 'Huawei Mate 60 dengan chip Kirin 9000s (7nm).', verified: true }
        ],
        trivia: [
            'Ren Zhengfei adalah mantan insinyur militer PLA.',
            'Huawei adalah perusahaan telekom di balik banyak jaringan 4G/5G dunia.'
        ],
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

    // ==================== XIAOMI ====================
    {
        id: 'xiaomi',
        name: 'Xiaomi',
        country: 'Tiongkok',
        color: '#FF6900',
        activeFromYear: 2011, activeToYear: null,
        personality: 'aggressive',
        startShare: 0.005,
        researchStartTier: 2, researchSpeedMultiplier: 1.15,
        foundedYear: 2010, founder: 'Lei Jun dkk',
        hq: 'Beijing, Tiongkok', parentCompany: 'Xiaomi Corporation',
        origin: 'Software MIUI (2010) → ponsel Mi 1 (2011) → ekosistem IoT.',
        exitReason: null,
        strengths: ['Harga murah', 'Ekosistem IoT', 'Komunitas fanatik'],
        weaknesses: ['Reputasi brand awal', 'Iklan di OS'],
        osName: 'MIUI / Android',
        factuality: 'historical',
        factNote: 'Peristiwa terverifikasi. Xiaomi adalah salah satu dari 5 vendor terbesar global 2020-an.',
        sources: 'Xiaomi press, IDC, Counterpoint',
        milestones: [
            { year: 2010, text: 'Didirikan oleh Lei Jun dkk.', verified: true },
            { year: 2011, text: 'Xiaomi Mi 1 — ponsel pertama.', verified: true },
            { year: 2014, text: 'Menjadi vendor ponsel terbesar Tiongkok.', verified: true },
            { year: 2018, text: 'IPO di Hong Kong.', verified: true },
            { year: 2024, text: 'Xiaomi 14 Ultra — flagship global.', verified: true }
        ],
        trivia: [
            'MIUI — OS Android modifikasi Xiaomi — sudah ada sebelum ponsel mereka.',
            'Slogan awal "Always believe that something wonderful is about to happen".'
        ],
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

    // ==================== OPPO ====================
    {
        id: 'oppo',
        name: 'Oppo',
        country: 'Tiongkok',
        color: '#1F7A3B',
        activeFromYear: 2008, activeToYear: null,
        personality: 'follower',
        startShare: 0.003,
        researchStartTier: 2, researchSpeedMultiplier: 1.05,
        foundedYear: 2004, founder: 'Tony Chen (Chen Mingyong)',
        hq: 'Dongguan, Tiongkok', parentCompany: 'BBK Electronics',
        origin: 'Elektronik konsumen BBK → merek ponsel Oppo (2008).',
        exitReason: null,
        strengths: ['Selfie camera', 'Fast charging', 'Distribusi Asia'],
        weaknesses: ['Software kurang optimal'],
        osName: 'ColorOS / Android',
        factuality: 'historical',
        factNote: 'Peristiwa terverifikasi. Oppo & Vivo keduanya anak BBK Electronics.',
        sources: 'Oppo press, IDC, Wikipedia EN',
        milestones: [
            { year: 2004, text: 'Didirikan oleh Tony Chen di bawah BBK.', verified: true },
            { year: 2008, text: 'Merek ponsel: Oppo A103.', verified: true },
            { year: 2013, text: 'Oppo N1 — kamera berputar.', verified: true },
            { year: 2016, text: 'Puncak penjualan di Tiongkok.', verified: true },
            { year: 2018, text: 'Find X — kamera pop-up, desain tanpa bezel.', verified: true }
        ],
        trivia: [
            'Oppo, Vivo, dan OnePlus semuanya bagian dari BBK Electronics.',
            'Oppo pionir fast-charging "VOOC" sejak 2014.'
        ],
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

    // ==================== VIVO ====================
    {
        id: 'vivo',
        name: 'Vivo',
        country: 'Tiongkok',
        color: '#2C5EA0',
        activeFromYear: 2011, activeToYear: null,
        personality: 'follower',
        startShare: 0.003,
        researchStartTier: 2, researchSpeedMultiplier: 1.05,
        foundedYear: 2009, founder: 'Shen Wei',
        hq: 'Dongguan, Tiongkok', parentCompany: 'BBK Electronics',
        origin: 'Anak perusahaan BBK → merek ponsel Vivo (2011).',
        exitReason: null,
        strengths: ['In-display fingerprint', 'Audio DAC'],
        weaknesses: ['Brand awareness global rendah'],
        osName: 'Funtouch OS / Android',
        factuality: 'historical',
        factNote: 'Peristiwa terverifikasi. Vivo sering bekerja sama dengan sepak bola & musik.',
        sources: 'Vivo press, IDC, Wikipedia EN',
        milestones: [
            { year: 2009, text: 'Didirikan oleh Shen Wei (anak BBK).', verified: true },
            { year: 2011, text: 'Vivo V1 — ponsel pertama.', verified: true },
            { year: 2013, text: 'Xplay 3S — layar 2K pertama di smartphone.', verified: true },
            { year: 2018, text: 'NEX — kamera selfie pop-up.', verified: true },
            { year: 2020, text: 'X50 Pro — kamera gimbal.', verified: true }
        ],
        trivia: [
            'Vivo dan Oppo adalah "saudara" di bawah BBK Electronics.',
            'Vivo sering jadi sponsor resmi FIFA World Cup.'
        ],
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

    // ==================== MICROSOFT LUMIA ====================
    {
        id: 'microsoft_nokia',
        name: 'Microsoft Lumia',
        country: 'Amerika Serikat',
        color: '#00A4EF',
        activeFromYear: 2013, activeToYear: 2017,
        personality: 'declining',
        startShare: 0.03,
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
            { name: 'Lumia 1020', year: 2013, tier: 4, shareBoost: 0.02 },
            { name: 'Lumia 950',  year: 2015, tier: 4, shareBoost: -0.02 }
        ],
        lifeEvents: [
            { year: 2013, text: 'Microsoft akuisisi Nokia.', shareDelta: 0.0 },
            { year: 2016, text: 'Microsoft menyerah di pasar ponsel.', shareDelta: -0.03 }
        ]
    },

    // ==================== HONOR ====================
    {
        id: 'honor',
        name: 'Honor',
        country: 'Tiongkok',
        color: '#0066CC',
        activeFromYear: 2013, activeToYear: null,
        personality: 'aggressive',
        startShare: 0.002,
        researchStartTier: 4, researchSpeedMultiplier: 1.15,
        foundedYear: 2013, founder: 'Huawei (sub-brand)',
        hq: 'Shenzhen, Tiongkok', parentCompany: 'Honor Device Co. (mandiri sejak 2020)',
        origin: 'Sub-brand Huawei (2013) untuk segmen muda → spin-off mandiri (2020).',
        exitReason: null,
        strengths: ['Harga agresif', 'Desain muda'],
        weaknesses: ['Brand baru global pasca-split'],
        osName: 'MagicOS / Android',
        factuality: 'historical',
        factNote: 'Peristiwa terverifikasi. Honor dijual dari Huawei untuk hindari sanksi AS.',
        sources: 'Honor press, Reuters, Wikipedia EN',
        milestones: [
            { year: 2013, text: 'Didirikan sebagai sub-brand Huawei.', verified: true },
            { year: 2015, text: 'Honor 7 populer di Tiongkok.', verified: true },
            { year: 2020, text: 'Spin-off dari Huawei karena sanksi AS (17 Nov 2020).', verified: true },
            { year: 2022, text: 'Ekspansi global sebagai entitas mandiri.', verified: true }
        ],
        trivia: [
            'Honor dijual ke konsorsium Shenzhen untuk menghindari sanksi AS terhadap Huawei.',
            'Tanggal spin-off Honor (17 Nov 2020) — kebetulan sama dengan tanggal mulai game!'
        ],
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

    // ==================== ONEPLUS ====================
    {
        id: 'oneplus',
        name: 'OnePlus',
        country: 'Tiongkok',
        color: '#EB0028',
        activeFromYear: 2014, activeToYear: null,
        personality: 'innovator',
        startShare: 0.002,
        researchStartTier: 3, researchSpeedMultiplier: 1.15,
        foundedYear: 2013, founder: 'Pete Lau, Carl Pei',
        hq: 'Shenzhen, Tiongkok', parentCompany: 'BBK Electronics (via Oppo)',
        origin: 'Sub-brand Oppo untuk pasar global → ponsel OnePlus One (2014).',
        exitReason: null,
        strengths: ['Harga flagship killer', 'Software bersih', 'Komunitas fanatik'],
        weaknesses: ['Skala produksi kecil', 'Ketergantungan Oppo'],
        osName: 'OxygenOS / Android',
        factuality: 'historical',
        factNote: 'Peristiwa terverifikasi. Carl Pei lalu keluar dan mendirikan Nothing.',
        sources: 'OnePlus press, The Verge, Wikipedia EN',
        milestones: [
            { year: 2013, text: 'Didirikan oleh Pete Lau & Carl Pei.', verified: true },
            { year: 2014, text: 'OnePlus One — "flagship killer" $299.', verified: true },
            { year: 2016, text: 'OnePlus 3 — populer global.', verified: true },
            { year: 2021, text: 'Integrasi lebih dalam dengan Oppo.', verified: true },
            { year: 2023, text: 'OnePlus 11 flagship global.', verified: true }
        ],
        trivia: [
            'OnePlus One awalnya hanya bisa dibeli dengan "invite system" — viral pemasaran.',
            'Carl Pei keluar 2020 dan mendirikan Nothing.'
        ],
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

    // ==================== NOTHING ====================
    {
        id: 'nothing',
        name: 'Nothing',
        country: 'Inggris',
        color: '#000000',
        activeFromYear: 2022, activeToYear: null,
        personality: 'innovator',
        startShare: 0.001,
        researchStartTier: 4, researchSpeedMultiplier: 1.2,
        foundedYear: 2020, founder: 'Carl Pei',
        hq: 'London, Inggris', parentCompany: 'Nothing Technology',
        origin: 'Startup Carl Pei (co-founder OnePlus) → ponsel transparan Nothing Phone (1).',
        exitReason: null,
        strengths: ['Desain transparan unik', 'Software bersih', 'Marketing viral'],
        weaknesses: ['Skala produksi kecil'],
        osName: 'Nothing OS / Android',
        factuality: 'historical',
        factNote: 'Peristiwa terverifikasi. Nothing adalah pemain termuda di daftar ini.',
        sources: 'Nothing press, The Verge, Wikipedia EN',
        milestones: [
            { year: 2020, text: 'Didirikan oleh Carl Pei (co-founder OnePlus).', verified: true },
            { year: 2021, text: 'Ear (1) — TWS pertama.', verified: true },
            { year: 2022, text: 'Phone (1) — ponsel transparan debut.', verified: true },
            { year: 2023, text: 'Phone (2) — flagship mid-range.', verified: true }
        ],
        trivia: [
            'Nama "Nothing" sengaja kontras dengan industri yang penuh "sesuatu".',
            'Carl Pei mendirikan Nothing setelah keluar dari OnePlus pada 2020.'
        ],
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
    nokia: 'Nokio', motorola: 'Motora', sony_ericsson: 'Sonic Ericson',
    samsung: 'Samsul', lg: 'LGX', siemens: 'Simen', palm: 'Pamu',
    blackberry: 'Blackburry', apple: 'Apel', htc: 'HTCX',
    google_android: 'Gugel OS', huawei: 'Huawaei', xiaomi: 'Xioami',
    oppo: 'Opoh', vivo: 'Viva', microsoft_nokia: 'Microkia',
    honor: 'Honour', oneplus: 'OnePlusX', nothing: 'Somewhat'
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
