// FILE: src/data/historical-timeline.data.js
// ============================================================
// HISTORICAL TIMELINE — referensi ponsel & OS ikonik 2000-2026.
// Sumber: xlsx "Riset_Ponsel_dan_OS_2000_2026".
// ============================================================
// Catatan:
// - Data bersifat referensi. Entri 2024+ ditandai speculative: true.
// - Tidak dipakai oleh sistem gameplay saat ini. Basis untuk:
//   V2 (phone mockup per era), V3 (OS screen), V4 (timeline panel),
//   V5 (App Market data).
// ============================================================

// ============================================================
// ERA — selaras dengan OS_ERAS di os.data.js
// ============================================================
export const TIMELINE_ERAS = [
    { id: 'firmware', name: 'Firmware Dasar',    fromYear: 2000, toYear: 2006, label: 'Ponsel Fitur' },
    { id: 'touch',    name: 'Era Layar Sentuh',  fromYear: 2007, toYear: 2012, label: 'Revolusi Touch' },
    { id: 'modern',   name: 'Smartphone Modern', fromYear: 2013, toYear: 2018, label: 'Modern' },
    { id: 'ai_era',   name: 'AI & Ekosistem',    fromYear: 2019, toYear: 2025, label: 'Era AI' },
    { id: 'future',   name: 'Era AI On-Device',  fromYear: 2026, toYear: 9999, label: 'Future' }
];

// ============================================================
// PONSEL IKONIK — 2000-2026
// ============================================================
export const ICONIC_PHONES = [
    {
        year: 2000,
        model: 'Nokia 3310',
        maker: 'Nokia',
        feature: 'Daya tahan ekstrem, game Snake II, antena internal, sangat populer global.',
        tags: ['durability', 'gaming', 'iconic', 'feature_phone']
    },
    {
        year: 2000,
        model: 'Sharp J-SH04',
        maker: 'Sharp / J-Phone',
        feature: 'Ponsel berkamera komersial pertama di Jepang, memulai tren kirim foto lewat ponsel.',
        tags: ['camera', 'first', 'japan']
    },
    {
        year: 2001,
        model: 'Nokia 6310',
        maker: 'Nokia',
        feature: 'Ponsel bisnis dengan Bluetooth, WAP, dan GPRS; andalan eksekutif awal 2000-an.',
        tags: ['business', 'bluetooth', 'gprs']
    },
    {
        year: 2002,
        model: 'Nokia 7650',
        maker: 'Nokia',
        feature: 'Ponsel Symbian pertama dengan kamera internal terintegrasi.',
        tags: ['symbian', 'camera', 'first']
    },
    {
        year: 2002,
        model: 'T-Mobile Sidekick (Danger Hiptop)',
        maker: 'Danger / T-Mobile',
        feature: 'Layar putar dengan keyboard penuh, populer untuk pesan instan dan email di kalangan anak muda.',
        tags: ['keyboard', 'messaging', 'youth']
    },
    {
        year: 2003,
        model: 'Nokia 1100',
        maker: 'Nokia',
        feature: 'Ponsel dasar murah dan tahan banting; salah satu ponsel terlaris sepanjang masa di pasar berkembang.',
        tags: ['budget', 'durability', 'emerging_market']
    },
    {
        year: 2004,
        model: 'Motorola RAZR V3',
        maker: 'Motorola',
        feature: 'Desain clamshell super tipis, ikon fesyen era 2000-an.',
        tags: ['design', 'thin', 'clamshell', 'iconic']
    },
    {
        year: 2005,
        model: 'Sony Ericsson W800 Walkman',
        maker: 'Sony Ericsson',
        feature: 'Ponsel Walkman pertama: pemutar musik, kartu memori, dan kamera 2MP dalam satu bodi.',
        tags: ['music', 'camera', 'walkman']
    },
    {
        year: 2006,
        model: 'BlackBerry Pearl 8100',
        maker: 'BlackBerry',
        feature: 'Keyboard SureType, kamera, multimedia, mempopulerkan BBM di segmen konsumen umum.',
        tags: ['keyboard', 'business', 'bbm']
    },
    {
        year: 2006,
        model: 'LG Chocolate (KG800)',
        maker: 'LG',
        feature: 'Desain minimalis hitam dengan panel sentuh; membuktikan desain sebagai alasan membeli ponsel.',
        tags: ['design', 'music', 'fashion']
    },
    {
        year: 2007,
        model: 'Apple iPhone (Original)',
        maker: 'Apple',
        feature: 'Revolusi layar sentuh kapasitif multi-touch, menghilangkan keyboard fisik, mendefinisikan smartphone modern.',
        tags: ['touch', 'multitouch', 'revolutionary', 'iconic']
    },
    {
        year: 2008,
        model: 'HTC Dream (T-Mobile G1)',
        maker: 'HTC / Google',
        feature: 'Ponsel komersial pertama yang menggunakan sistem operasi Android.',
        tags: ['android', 'first', 'keyboard']
    },
    {
        year: 2010,
        model: 'Samsung Galaxy S (Original)',
        maker: 'Samsung',
        feature: 'Layar Super AMOLED, awal dari dinasti flagship Android tersukses.',
        tags: ['amoled', 'flagship', 'galaxy']
    },
    {
        year: 2011,
        model: 'Samsung Galaxy Note',
        maker: 'Samsung',
        feature: "Mempopulerkan tren layar besar ('Phablet') dan penggunaan stylus S-Pen.",
        tags: ['phablet', 'stylus', 'large_screen']
    },
    {
        year: 2013,
        model: 'Nokia Lumia 1020',
        maker: 'Nokia',
        feature: 'Kamera PureView 41 Megapiksel dengan OIS, puncak inovasi fotografi mobile masa itu.',
        tags: ['camera', '41mp', 'ois', 'pureview']
    },
    {
        year: 2016,
        model: 'Google Pixel (Original)',
        maker: 'Google',
        feature: "Ponsel pertama dengan branding murni 'Pixel', integrasi Google Assistant, komputasi fotografi.",
        tags: ['google', 'assistant', 'computational_photography']
    },
    {
        year: 2017,
        model: 'Apple iPhone X',
        maker: 'Apple',
        feature: 'Desain bezel-less dengan notch, pengenalan Face ID, menghilangkan tombol Home fisik.',
        tags: ['bezel_less', 'notch', 'face_id', 'iconic']
    },
    {
        year: 2019,
        model: 'Samsung Galaxy Fold',
        maker: 'Samsung',
        feature: 'Pelopor smartphone komersial dengan layar lipat (foldable) fleksibel.',
        tags: ['foldable', 'first', 'flexible']
    },
    {
        year: 2021,
        model: 'Apple iPhone 13 Pro',
        maker: 'Apple',
        feature: 'Layar ProMotion 120Hz, peningkatan baterai masif, standar baru videografi mobile (ProRes).',
        tags: ['promotion', '120hz', 'prores', 'camera']
    },
    {
        year: 2023,
        model: 'Samsung Galaxy S23 Ultra',
        maker: 'Samsung',
        feature: 'Kamera 200MP dengan kemampuan Zoom 100x, integrasi penuh ekosistem produktivitas.',
        tags: ['200mp', 'zoom', 'flagship']
    },
    {
        year: 2024,
        model: 'Samsung Galaxy S24 Series',
        maker: 'Samsung',
        feature: "Era 'Galaxy AI', integrasi kecerdasan buatan on-device secara mendalam.",
        tags: ['ai', 'on_device', 'galaxy_ai'],
        speculative: true
    },
    {
        year: 2025,
        model: 'Huawei Mate XT',
        maker: 'Huawei',
        feature: 'Smartphone lipat tiga (tri-fold) komersial pertama di dunia.',
        tags: ['tri_fold', 'first', 'foldable'],
        speculative: true
    },
    {
        year: 2026,
        model: 'Samsung Galaxy S26 / iPhone 18',
        maker: 'Samsung / Apple',
        feature: 'Generasi terbaru dengan fabrikasi chipset 2nm dan pemrosesan AI tingkat lanjut.',
        tags: ['2nm', 'ai', 'flagship'],
        speculative: true
    }
];

// ============================================================
// PERKEMBANGAN OS — 2000-2026
// ============================================================
export const OS_HISTORY = [
    {
        year: 2000,
        os: 'Symbian OS v6.0',
        dev: 'Symbian Ltd.',
        feature: 'Menjadi standar awal smartphone, digunakan luas oleh Nokia, Sony Ericsson, dan Motorola.',
        tags: ['symbian', 'nokia', 'standard']
    },
    {
        year: 2002,
        os: 'Java ME (J2ME / MIDP 2.0)',
        dev: 'Sun Microsystems',
        feature: 'Platform aplikasi dan game lintas merek ponsel; cikal bakal toko aplikasi lewat unduhan operator.',
        tags: ['java', 'games', 'apps']
    },
    {
        year: 2002,
        os: 'BlackBerry OS',
        dev: 'Research In Motion (RIM)',
        feature: 'Fokus pada keamanan data korporat, push email, dan layanan BlackBerry Messenger (BBM).',
        tags: ['blackberry', 'enterprise', 'security', 'email']
    },
    {
        year: 2003,
        os: 'Windows Mobile',
        dev: 'Microsoft',
        feature: 'Mengadopsi antarmuka mirip desktop Windows (Start Menu), menggunakan stylus.',
        tags: ['windows', 'microsoft', 'stylus']
    },
    {
        year: 2005,
        os: 'Windows Mobile 5.0',
        dev: 'Microsoft',
        feature: 'Membawa Office Mobile dan push email ke ponsel Windows; pesaing langsung BlackBerry dan Symbian.',
        tags: ['windows', 'microsoft', 'email']
    },
    {
        year: 2007,
        os: 'iOS (Awalnya iPhone OS)',
        dev: 'Apple Inc.',
        feature: 'Desain intuitif untuk jari tangan (tanpa stylus), meluncurkan App Store pada 2008 yang mengubah industri.',
        tags: ['ios', 'apple', 'touch', 'appstore']
    },
    {
        year: 2008,
        os: 'Android (v1.0)',
        dev: 'Google (Open Handset Alliance)',
        feature: 'OS open-source berbasis Linux. Fleksibel, mendukung kustomisasi penuh dan Google Play Store.',
        tags: ['android', 'google', 'open_source', 'linux']
    },
    {
        year: 2010,
        os: 'Windows Phone 7',
        dev: 'Microsoft',
        feature: "Desain antarmuka 'Metro UI' berbasis tile yang estetik, menggantikan Windows Mobile lama.",
        tags: ['windows_phone', 'metro_ui', 'microsoft']
    },
    {
        year: 2013,
        os: 'Firefox OS / Tizen',
        dev: 'Mozilla / Samsung',
        feature: 'Upaya alternatif membuat OS berbasis web/Linux, namun kesulitan bersaing dengan Android/iOS.',
        tags: ['firefox_os', 'tizen', 'web', 'niche']
    },
    {
        year: 2015,
        os: 'Windows 10 Mobile',
        dev: 'Microsoft',
        feature: 'Usaha terakhir Microsoft menyatukan OS PC dan mobile. Dihentikan dukungannya secara total pada 2019.',
        tags: ['windows_mobile', 'unified', 'discontinued']
    },
    {
        year: 2019,
        os: 'HarmonyOS',
        dev: 'Huawei',
        feature: 'Lahir akibat pembatasan perdagangan AS terhadap Huawei; berkembang menjadi OS multi-perangkat.',
        tags: ['harmonyos', 'huawei', 'multi_device', 'sanctions']
    },
    {
        year: 2021,
        os: 'Android 12 (Material You)',
        dev: 'Google',
        feature: 'Perombakan desain visual terbesar Android dengan visualisasi tema dinamis berbasis wallpaper.',
        tags: ['material_you', 'dynamic_theme', 'android']
    },
    {
        year: 2024,
        os: 'iOS 18 / Android 15',
        dev: 'Apple / Google',
        feature: 'Fokus masif pada integrasi AI generatif sistem (Apple Intelligence & Gemini Nano).',
        tags: ['ai', 'generative', 'on_device', 'apple_intelligence'],
        speculative: true
    },
    {
        year: 2026,
        os: 'iOS 20 / Android 17',
        dev: 'Apple / Google',
        feature: 'Pematangan arsitektur OS yang sepenuhnya berpusat pada agen AI (Agentic AI) dan privasi data lokal.',
        tags: ['agentic_ai', 'privacy', 'future'],
        speculative: true
    }
];

// ============================================================
// UTIL
// ============================================================
export function getEraForYear(year) {
    for (var i = 0; i < TIMELINE_ERAS.length; i++) {
        if (year >= TIMELINE_ERAS[i].fromYear && year <= TIMELINE_ERAS[i].toYear) {
            return TIMELINE_ERAS[i];
        }
    }
    return TIMELINE_ERAS[TIMELINE_ERAS.length - 1];
}

export function getIconicPhonesForYear(year) {
    return ICONIC_PHONES.filter(function (p) { return p.year <= year; });
}

export function getOsHistoryForYear(year) {
    return OS_HISTORY.filter(function (o) { return o.year <= year; });
}

export function getIconicPhoneByYear(year) {
    for (var i = 0; i < ICONIC_PHONES.length; i++) {
        if (ICONIC_PHONES[i].year === year) return ICONIC_PHONES[i];
    }
    return null;
}

export function getOsHistoryByYear(year) {
    for (var i = 0; i < OS_HISTORY.length; i++) {
        if (OS_HISTORY[i].year === year) return OS_HISTORY[i];
    }
    return null;
}

export function getIconicPhonesByEra(eraId) {
    var era = null;
    for (var i = 0; i < TIMELINE_ERAS.length; i++) {
        if (TIMELINE_ERAS[i].id === eraId) { era = TIMELINE_ERAS[i]; break; }
    }
    if (!era) return [];
    return ICONIC_PHONES.filter(function (p) {
        return p.year >= era.fromYear && p.year <= era.toYear;
    });
}

export function getOsHistoryByEra(eraId) {
    var era = null;
    for (var i = 0; i < TIMELINE_ERAS.length; i++) {
        if (TIMELINE_ERAS[i].id === eraId) { era = TIMELINE_ERAS[i]; break; }
    }
    if (!era) return [];
    return OS_HISTORY.filter(function (o) {
        return o.year >= era.fromYear && o.year <= era.toYear;
    });
}
