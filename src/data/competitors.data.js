// FILE: src/data/competitors.data.js
// ============================================================
// DATA KOMPETITOR DUNIA NYATA
// Nama merek asli dipakai sebagai referensi sejarah (fan project).
// Setiap kompetitor punya:
//   - activeFromYear / activeToYear (null = masih aktif)
//   - personality: aggressive | premium | innovator | follower | dominant | declining
//   - startShare: pangsa pasar saat mulai aktif (0-1)
//   - researchSpeedMultiplier: pengali kecepatan riset AI
//   - researchStartTier: tier awal riset AI (1-5)
//   - strengths / weaknesses: array string untuk UI
//   - osName: OS yang dipakai
//   - signatureProducts: produk ikonik dengan tahun & efek pangsa
//   - lifeEvents: kejadian sejarah yang mengubah pangsa
//
// Catatan fakta: tahun & angka adalah perkiraan umum. Baris yang
// kurang yakin ditandai // PERIKSA.
// ============================================================

export const COMPETITORS = [
    // ==================== ERA 1: 2000-2006 ====================
    {
        id: 'nokia',
        name: 'Nokia',
        country: 'Finlandia',
        color: '#124191',
        activeFromYear: 2000,
        activeToYear: 2013,
        personality: 'dominant',
        startShare: 0.35,
        researchStartTier: 2,
        researchSpeedMultiplier: 1.2,
        strengths: ['Distribusi global', 'Baterai awet', 'Desain kokoh'],
        weaknesses: ['Lambat beradaptasi ke layar sentuh'],
        osName: 'Symbian',
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
        activeFromYear: 2000,
        activeToYear: 2011,
        personality: 'aggressive',
        startShare: 0.15,
        researchStartTier: 1,
        researchSpeedMultiplier: 1.0,
        strengths: ['Desain tipis', 'Harga kompetitif'],
        weaknesses: ['Inovasi lambat', 'Fokus pasar AS'],
        osName: 'Proprietary',
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
        startShare: 0.10,
        researchStartTier: 1,
        researchSpeedMultiplier: 1.1,
        strengths: ['Kamera', 'Desain musik', 'Kualitas audio'],
        weaknesses: ['Harga premium', 'Software kaku'],
        osName: 'Symbian / Android',
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
        activeFromYear: 2000,
        activeToYear: null,
        personality: 'aggressive',
        startShare: 0.08,
        researchStartTier: 1,
        researchSpeedMultiplier: 1.1,
        strengths: ['Produksi komponen', 'Skala global', 'Inovasi layar'],
        weaknesses: ['Awalnya lemah di software'],
        osName: 'Proprietary → Android',
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
        activeFromYear: 2000,
        activeToYear: 2021,
        personality: 'follower',
        startShare: 0.06,
        researchStartTier: 1,
        researchSpeedMultiplier: 0.95,
        strengths: ['Desain berani', 'Kamera awal'],
        weaknesses: ['Software lemah', 'Konsistensi produk'],
        osName: 'Android',
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
        activeFromYear: 2000,
        activeToYear: 2006,
        personality: 'follower',
        startShare: 0.05,
        researchStartTier: 1,
        researchSpeedMultiplier: 0.9,
        strengths: ['Rekayasa solid'],
        weaknesses: ['Lambat beradaptasi', 'Desain konservatif'],
        osName: 'Proprietary',
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
        activeFromYear: 2000,
        activeToYear: 2011,
        personality: 'innovator',
        startShare: 0.04,
        researchStartTier: 2,
        researchSpeedMultiplier: 1.0,
        strengths: ['Pionir PDA', 'Software rapi'],
        weaknesses: ['Harga tinggi', 'Ekosistem kecil'],
        osName: 'Palm OS → webOS',
        signatureProducts: [
            { name: 'Palm Treo 650',   year: 2004, tier: 2, shareBoost: 0.01 },
            { name: 'Palm Pre (webOS)',year: 2009, tier: 3, shareBoost: 0.01 }
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
        startShare: 0.05,
        researchStartTier: 2,
        researchSpeedMultiplier: 1.05,
        strengths: ['Keyboard fisik', 'Email aman', 'Baterai awet'],
        weaknesses: ['Layar sentuh lambat', 'Fokus korporat'],
        osName: 'BlackBerry OS',
        signatureProducts: [
            { name: 'BlackBerry 8700', year: 2005, tier: 2, shareBoost: 0.03 },
            { name: 'BlackBerry Bold', year: 2008, tier: 3, shareBoost: 0.02 },
            { name: 'BlackBerry Z10',  year: 2013, tier: 4, shareBoost: -0.02 }
        ],
        lifeEvents: [
            { year: 2006, text: 'BlackBerry populer di kalangan korporat.', shareDelta: 0.05 },
            { year: 2010, text: 'BlackBerry mulai ditinggalkan pasar konsumen.', shareDelta: -0.06 },
            { year: 2016, text: 'BlackBerry menghentikan produksi ponsel sendiri.', shareDelta: -0.08 }
        ]
    },

    // ==================== ERA 2: 2007-2012 ====================
    {
        id: 'apple',
        name: 'Apple',
        country: 'Amerika Serikat',
        color: '#555555',
        activeFromYear: 2007,
        activeToYear: null,
        personality: 'premium',
        startShare: 0.0,
        researchStartTier: 3,
        researchSpeedMultiplier: 1.4,
        strengths: ['Ekosistem iOS', 'Desain premium', 'Brand kuat', 'Retail'],
        weaknesses: ['Harga tinggi', 'Kontrol ketat'],
        osName: 'iOS',
        signatureProducts: [
            { name: 'iPhone (2007)',      year: 2007, tier: 3, shareBoost: 0.05 },
            { name: 'iPhone 3GS',         year: 2009, tier: 3, shareBoost: 0.04 },
            { name: 'iPhone 4',           year: 2010, tier: 3, shareBoost: 0.05 },
            { name: 'iPhone 12',          year: 2020, tier: 5, shareBoost: 0.04 }
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
        activeFromYear: 2000,
        activeToYear: 2021,
        personality: 'innovator',
        startShare: 0.02,
        researchStartTier: 2,
        researchSpeedMultiplier: 1.1,
        strengths: ['Windows Mobile awal', 'Android awal', 'Desain logam'],
        weaknesses: ['Marketing lemah', 'Software kadang buggy'],
        osName: 'Windows Mobile → Android',
        signatureProducts: [
            { name: 'HTC Dream (G1)',  year: 2008, tier: 3, shareBoost: 0.04 },
            { name: 'HTC One (M7)',    year: 2013, tier: 4, shareBoost: 0.02 }
        ],
        lifeEvents: [
            { year: 2008, text: 'HTC merilis Android pertama.', shareDelta: 0.05 },
            { year: 2013, text: 'HTC kesulitan bersaing harga.', shareDelta: -0.05 },
            { year: 2021, text: 'HTC hengkang dari pasar massal.', shareDelta: -0.03 }
        ]
    },
    {
        id: 'google_android',
        name: 'Google / Android',
        country: 'Amerika Serikat',
        color: '#4285F4',
        activeFromYear: 2008,
        activeToYear: null,
        personality: 'innovator',
        startShare: 0.0,
        researchStartTier: 3,
        researchSpeedMultiplier: 1.3,
        strengths: ['OS gratis', 'Ekosistem Google', 'Update cepat'],
        weaknesses: ['Kontrol hardware lemah'],
        osName: 'Android',
        signatureProducts: [
            { name: 'Android 1.0',    year: 2008, tier: 3, shareBoost: 0.03 },
            { name: 'Google Pixel',   year: 2016, tier: 4, shareBoost: 0.02 }
        ],
        lifeEvents: [
            { year: 2008, text: 'Android diluncurkan sebagai OS terbuka.', shareDelta: 0.05 },
            { year: 2011, text: 'Android jadi OS ponsel terbesar.', shareDelta: 0.06 },
            { year: 2016, text: 'Google Pixel memperkuat kehadiran hardware.', shareDelta: 0.02 }
        ]
    },

    // ==================== ERA 3: 2013-2018 ====================
    {
        id: 'huawei',
        name: 'Huawei',
        country: 'Tiongkok',
        color: '#CF0A2C',
        activeFromYear: 2012,
        activeToYear: null,
        personality: 'aggressive',
        startShare: 0.02,
        researchStartTier: 3,
        researchSpeedMultiplier: 1.2,
        strengths: ['Kamera Leica', 'Chip Kirin', 'Harga agresif'],
        weaknesses: ['Sanksi AS (2019+)'],
        osName: 'Android → HarmonyOS',
        signatureProducts: [
            { name: 'Huawei P9',      year: 2016, tier: 4, shareBoost: 0.03 },
            { name: 'Huawei P30 Pro', year: 2019, tier: 5, shareBoost: 0.04 },
            { name: 'Huawei Mate 60', year: 2023, tier: 5, shareBoost: 0.02 }
        ],
        lifeEvents: [
            { year: 2016, text: 'Huawei masuk jajaran 3 besar dunia.', shareDelta: 0.05 },
            { year: 2019, text: 'Sanksi AS membatasi akses Google.', shareDelta: -0.05 },
            { year: 2021, text: 'Huawei mengembangkan HarmonyOS.', shareDelta: 0.02 }
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
        startShare: 0.0,
        researchStartTier: 2,
        researchSpeedMultiplier: 1.15,
        strengths: ['Harga murah', 'Ekosistem IoT', 'Komunitas fanatik'],
        weaknesses: ['Reputasi brand awal', 'Iklan di OS'],
        osName: 'MIUI / Android',
        signatureProducts: [
            { name: 'Xiaomi Mi 1',    year: 2011, tier: 3, shareBoost: 0.02 },
            { name: 'Redmi Note',     year: 2014, tier: 4, shareBoost: 0.03 },
            { name: 'Xiaomi 14 Ultra',year: 2024, tier: 5, shareBoost: 0.03 }
        ],
        lifeEvents: [
            { year: 2014, text: 'Xiaomi jadi merek ponsel Tiongkok terbesar.', shareDelta: 0.04 },
            { year: 2018, text: 'Xiaomi IPO dan ekspansi global.', shareDelta: 0.03 }
        ]
    },
    {
        id: 'oppo',
        name: 'Oppo',
        country: 'Tiongkok',
        color: '#1F7A3B',
        activeFromYear: 2011,
        activeToYear: null,
        personality: 'follower',
        startShare: 0.0,
        researchStartTier: 2,
        researchSpeedMultiplier: 1.05,
        strengths: ['Selfie camera', 'Fast charging', 'Distribusi Asia'],
        weaknesses: ['Software kurang optimal'],
        osName: 'ColorOS / Android',
        signatureProducts: [
            { name: 'Oppo N1',        year: 2013, tier: 4, shareBoost: 0.02 },
            { name: 'Oppo Find X',    year: 2018, tier: 5, shareBoost: 0.02 }
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
        startShare: 0.0,
        researchStartTier: 2,
        researchSpeedMultiplier: 1.05,
        strengths: ['In-display fingerprint', 'Audio DAC'],
        weaknesses: ['Brand awareness global rendah'],
        osName: 'Funtouch OS / Android',
        signatureProducts: [
            { name: 'Vivo X20',        year: 2017, tier: 4, shareBoost: 0.02 },
            { name: 'Vivo X100 Pro',   year: 2024, tier: 5, shareBoost: 0.02 }
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
        startShare: 0.05,
        researchStartTier: 3,
        researchSpeedMultiplier: 1.0,
        strengths: ['Kamera PureView', 'Windows Phone UI'],
        weaknesses: ['Ekosistem app minim', 'Akuisisi gagal'],
        osName: 'Windows Phone',
        signatureProducts: [
            { name: 'Lumia 1020', year: 2013, tier: 4, shareBoost: 0.02 },
            { name: 'Lumia 950',  year: 2015, tier: 4, shareBoost: -0.02 }
        ],
        lifeEvents: [
            { year: 2013, text: 'Microsoft akusisi Nokia.', shareDelta: 0.0 },
            { year: 2016, text: 'Microsoft menyerah di pasar ponsel.', shareDelta: -0.05 }
        ]
    },

    // ==================== ERA 4: 2019-2025+ ====================
    {
        id: 'honor',
        name: 'Honor',
        country: 'Tiongkok',
        color: '#0066CC',
        activeFromYear: 2020,
        activeToYear: null,
        personality: 'aggressive',
        startShare: 0.01,
        researchStartTier: 4,
        researchSpeedMultiplier: 1.15,
        strengths: ['Harga agresif', 'Desain muda'],
        weaknesses: ['Brand baru global'],
        osName: 'MagicOS / Android',
        signatureProducts: [
            { name: 'Honor Magic5 Pro', year: 2023, tier: 5, shareBoost: 0.03 }
        ],
        lifeEvents: [
            { year: 2020, text: 'Honor berpisah dari Huawei.', shareDelta: 0.02 }
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
        startShare: 0.0,
        researchStartTier: 4,
        researchSpeedMultiplier: 1.2,
        strengths: ['Desain transparan unik', 'Software bersih', 'Marketing viral'],
        weaknesses: ['Skala produksi kecil'],
        osName: 'Nothing OS / Android',
        signatureProducts: [
            { name: 'Nothing Phone (1)', year: 2022, tier: 5, shareBoost: 0.02 },
            { name: 'Nothing Phone (2)', year: 2023, tier: 5, shareBoost: 0.02 }
        ],
        lifeEvents: [
            { year: 2022, text: 'Nothing merilis ponsel transparan pertama.', shareDelta: 0.02 }
        ]
    }
];

// Perusahaan fiktif (opsional, untuk mode "Fiktif")
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
    nothing: 'Somewhat'
};

export function getCompetitorById(id) {
    return COMPETITORS.find(c => c.id === id) || null;
}

export function getFictionalName(id) {
    return FICTIONAL_NAMES[id] || id;
}

// Kompetitor aktif pada tahun tertentu
export function getActiveCompetitors(year) {
    return COMPETITORS.filter(c => {
        if (year < c.activeFromYear) return false;
        if (c.activeToYear !== null && year > c.activeToYear) return false;
        return true;
    });
}

// Life events yang terjadi pada tahun tertentu (untuk notifikasi)
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
