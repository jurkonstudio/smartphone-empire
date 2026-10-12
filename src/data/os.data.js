// FILE: src/data/os.data.js
// ============================================================
// DATA SISTEM OPERASI — fitur per era, lisensi pihak ketiga,
// template aplikasi & bug. Semua angka balancing di sini.
//
// Tabel balancing awal (biaya fitur & durasi):
//   Era 1 (2000-2006): biaya 3.000-8.000,   durasi 8-15 hari
//   Era 2 (2007-2012): biaya 10.000-30.000, durasi 15-30 hari
//   Era 3 (2013-2018): biaya 30.000-80.000, durasi 25-50 hari
//   Era 4 (2019-2025): biaya 60.000-180.000, durasi 30-60 hari
//
// Batas fitur per versi = 3 + floor(engineers/3), maks 8.
// ============================================================

export const OS_ERAS = [
    { id: 'firmware',   name: 'Firmware Dasar',  fromYear: 2000, toYear: 2006 },
    { id: 'touch',      name: 'Era Layar Sentuh', fromYear: 2007, toYear: 2012 },
    { id: 'modern',     name: 'Smartphone Modern', fromYear: 2013, toYear: 2018 },
    { id: 'ai_era',     name: 'AI & Ekosistem',  fromYear: 2019, toYear: 9999 }
];

export const OS_FEATURES = [
    // ============ ERA 1: FIRMWARE DASAR (2000-2006) ============
    { id: 'fw_sms', era: 'firmware', minYear: 2000, requiresResearch: ['net_gsm'],
      name: 'Pesan SMS', description: 'Dukungan pesan singkat.',
      devCost: 3000, devDays: 8, complexity: 1, requiresFeatures: [],
      statEffects: { stability: 5, speed: 2, features: 8, security: 3, design: 2 } },

    { id: 'fw_contacts', era: 'firmware', minYear: 2000, requiresResearch: ['net_gsm'],
      name: 'Buku Kontak', description: 'Manajemen kontak dasar.',
      devCost: 2500, devDays: 6, complexity: 1, requiresFeatures: [],
      statEffects: { stability: 4, speed: 2, features: 6, security: 3, design: 3 } },

    { id: 'fw_poly_ringtone', era: 'firmware', minYear: 2001, requiresResearch: ['net_edge'],
      name: 'Nada Polifonik', description: 'Nada dering polifonik untuk personalisasi.',
      devCost: 4000, devDays: 10, complexity: 1, requiresFeatures: [],
      statEffects: { stability: 3, speed: 1, features: 6, security: 0, design: 8 } },

    { id: 'fw_j2me', era: 'firmware', minYear: 2002, requiresResearch: ['net_gprs'],
      name: 'J2ME Game', description: 'Platform game Java untuk ponsel fitur.',
      devCost: 7000, devDays: 15, complexity: 2, requiresFeatures: [],
      statEffects: { stability: 4, speed: 3, features: 15, security: 2, design: 5 } },

    { id: 'fw_calendar', era: 'firmware', minYear: 2003, requiresResearch: [],
      name: 'Kalender & Alarm', description: 'Fitur produktivitas dasar.',
      devCost: 5000, devDays: 10, complexity: 1, requiresFeatures: [],
      statEffects: { stability: 5, speed: 2, features: 8, security: 2, design: 4 } },

    { id: 'fw_touch_basic', era: 'firmware', minYear: 2004, requiresResearch: ['layar_touch_res'],
      name: 'Dukungan Touch Dasar', description: 'Navigasi dengan stylus atau jari.',
      devCost: 8000, devDays: 15, complexity: 2, requiresFeatures: [],
      statEffects: { stability: 3, speed: 3, features: 10, security: 2, design: 10 } },

    // ============ ERA 2: LAYAR SENTUH (2007-2012) ============
    { id: 'fw_touch', era: 'touch', minYear: 2007, requiresResearch: ['layar_touch_cap'],
      name: 'Layar Sentuh Kapasitif', description: 'Dukungan multitouch penuh.',
      devCost: 15000, devDays: 20, complexity: 3, requiresFeatures: ['fw_touch_basic'],
      statEffects: { stability: 8, speed: 5, features: 15, security: 4, design: 20 } },

    { id: 'fw_multitasking', era: 'touch', minYear: 2008, requiresResearch: ['chip_dual'],
      name: 'Multitasking', description: 'Menjalankan beberapa aplikasi sekaligus.',
      devCost: 18000, devDays: 25, complexity: 3, requiresFeatures: [],
      statEffects: { stability: 5, speed: 12, features: 18, security: 4, design: 6 } },

    { id: 'fw_appstore', era: 'touch', minYear: 2008, requiresResearch: ['net_4g'],
      name: 'App Store', description: 'Toko aplikasi pihak ketiga.',
      devCost: 30000, devDays: 30, complexity: 4, requiresFeatures: ['fw_multitasking'],
      statEffects: { stability: 6, speed: 4, features: 25, security: 8, design: 8 } },

    { id: 'fw_browser_mobile', era: 'touch', minYear: 2007, requiresResearch: ['net_3g'],
      name: 'Browser Mobile', description: 'Browser web untuk layar sentuh.',
      devCost: 12000, devDays: 18, complexity: 2, requiresFeatures: ['fw_touch'],
      statEffects: { stability: 5, speed: 8, features: 14, security: 6, design: 5 } },

    { id: 'fw_camera_gallery', era: 'touch', minYear: 2007, requiresResearch: ['cam_2mp'],
      name: 'Kamera & Galeri', description: 'Aplikasi kamera dan galeri foto.',
      devCost: 10000, devDays: 15, complexity: 2, requiresFeatures: [],
      statEffects: { stability: 4, speed: 5, features: 12, security: 3, design: 7 } },

    { id: 'fw_gps', era: 'touch', minYear: 2009, requiresResearch: ['net_4g'],
      name: 'GPS & Navigasi', description: 'Peta digital dan lokasi.',
      devCost: 14000, devDays: 20, complexity: 3, requiresFeatures: [],
      statEffects: { stability: 5, speed: 3, features: 15, security: 5, design: 4 } },

    // ============ ERA 3: SMARTPHONE MODERN (2013-2018) ============
    { id: 'fw_flat_ui', era: 'modern', minYear: 2013, requiresResearch: ['layar_amoled'],
      name: 'Flat UI', description: 'Desain antarmuka modern tanpa gradien.',
      devCost: 35000, devDays: 30, complexity: 3, requiresFeatures: ['fw_touch'],
      statEffects: { stability: 6, speed: 5, features: 8, security: 3, design: 22 } },

    { id: 'fw_smart_notif', era: 'modern', minYear: 2014, requiresResearch: [],
      name: 'Notifikasi Pintar', description: 'Notifikasi kontekstual dan terkelompok.',
      devCost: 40000, devDays: 32, complexity: 3, requiresFeatures: ['fw_multitasking'],
      statEffects: { stability: 6, speed: 6, features: 18, security: 5, design: 10 } },

    { id: 'fw_voice_assistant', era: 'modern', minYear: 2015, requiresResearch: [],
      name: 'Asisten Suara', description: 'Interaksi suara dengan AI.',
      devCost: 60000, devDays: 45, complexity: 4, requiresFeatures: ['fw_smart_notif'],
      statEffects: { stability: 5, speed: 8, features: 22, security: 6, design: 12 } },

    { id: 'fw_digital_pay', era: 'modern', minYear: 2015, requiresResearch: [],
      name: 'Pembayaran Digital', description: 'Pembayaran via NFC dan aplikasi.',
      devCost: 55000, devDays: 40, complexity: 4, requiresFeatures: ['fw_smart_notif'],
      statEffects: { stability: 8, speed: 4, features: 20, security: 18, design: 6 } },

    { id: 'fw_biometric', era: 'modern', minYear: 2016, requiresResearch: ['cam_12mp'],
      name: 'Biometrik', description: 'Sensor sidik jari dan wajah.',
      devCost: 70000, devDays: 48, complexity: 4, requiresFeatures: ['fw_digital_pay'],
      statEffects: { stability: 7, speed: 6, features: 15, security: 22, design: 10 } },

    { id: 'fw_cloud_sync', era: 'modern', minYear: 2016, requiresResearch: ['net_4g'],
      name: 'Cloud Sync', description: 'Sinkronisasi data lintas perangkat.',
      devCost: 65000, devDays: 45, complexity: 4, requiresFeatures: ['fw_smart_notif'],
      statEffects: { stability: 8, speed: 8, features: 18, security: 12, design: 6 } },

    // ============ ERA 4: AI & EKOSISTEM (2019-2025) ============
    { id: 'fw_gesture_nav', era: 'ai_era', minYear: 2019, requiresResearch: [],
      name: 'Gesture Navigasi', description: 'Navigasi tanpa tombol fisik.',
      devCost: 80000, devDays: 40, complexity: 4, requiresFeatures: ['fw_flat_ui'],
      statEffects: { stability: 6, speed: 6, features: 12, security: 4, design: 20 } },

    { id: 'fw_dark_mode', era: 'ai_era', minYear: 2019, requiresResearch: ['bat_big5000'],
      name: 'Mode Gelap', description: 'Tema gelap hemat baterai untuk OLED.',
      devCost: 60000, devDays: 30, complexity: 3, requiresFeatures: ['fw_flat_ui'],
      statEffects: { stability: 4, speed: 4, features: 10, security: 3, design: 18 } },

    { id: 'fw_ai_on_device', era: 'ai_era', minYear: 2020, requiresResearch: ['chip_npu'],
      name: 'AI On-Device', description: 'Pemrosesan AI lokal tanpa cloud.',
      devCost: 150000, devDays: 60, complexity: 5, requiresFeatures: ['fw_voice_assistant'],
      statEffects: { stability: 8, speed: 18, features: 30, security: 15, design: 12 } },

    { id: 'fw_privacy', era: 'ai_era', minYear: 2021, requiresResearch: [],
      name: 'Privasi Lanjutan', description: 'Kontrol izin dan enkripsi end-to-end.',
      devCost: 120000, devDays: 55, complexity: 5, requiresFeatures: ['fw_biometric'],
      statEffects: { stability: 10, speed: 4, features: 12, security: 28, design: 6 } },

    { id: 'fw_security_update', era: 'ai_era', minYear: 2022, requiresResearch: [],
      name: 'Update Keamanan Berkala', description: 'Patch keamanan otomatis.',
      devCost: 100000, devDays: 45, complexity: 4, requiresFeatures: ['fw_privacy'],
      statEffects: { stability: 12, speed: 5, features: 8, security: 30, design: 4 } },

    { id: 'fw_ecosystem', era: 'ai_era', minYear: 2023, requiresResearch: ['net_wifi6'],
      name: 'Ekosistem Lintas Perangkat', description: 'Integrasi dengan tablet, jam, dan perangkat lain.',
      devCost: 180000, devDays: 65, complexity: 5, requiresFeatures: ['fw_cloud_sync'],
      statEffects: { stability: 10, speed: 10, features: 25, security: 12, design: 18 } }
];

// ============================================================
// LISENSI OS PIHAK KETIGA — alternatif jika pemain tidak mau
// mengembangkan OS sendiri. Biaya per unit, stat tetap.
// ============================================================
export const OS_LICENSES = [
    {
        id: 'license_basic',
        name: 'Nexus Mobile OS',
        era: 'firmware',
        availableFromYear: 2000,
        costPerUnit: 3,
        stats: { stability: 60, speed: 40, features: 30, security: 40, design: 35 },
        description: 'OS generasi awal dengan fitur standar.'
    },
    {
        id: 'license_modern',
        name: 'Aurora OS',
        era: 'touch',
        availableFromYear: 2008,
        costPerUnit: 8,
        stats: { stability: 70, speed: 65, features: 60, security: 60, design: 70 },
        description: 'OS layar sentuh populer dengan ekosistem besar.'
    },
    {
        id: 'license_premium',
        name: 'Zenith OS',
        era: 'modern',
        availableFromYear: 2015,
        costPerUnit: 15,
        stats: { stability: 85, speed: 85, features: 80, security: 85, design: 85 },
        description: 'OS premium dengan ekosistem terbaik.'
    }
];

// ============================================================
// APLIKASI BAWAAN — pemain bisa merilis untuk menambah daya tarik.
// ============================================================
export const BUILTIN_APPS = [
    { id: 'app_messenger',  name: 'Pesan',       devCost: 3000,  devDays: 5,  requiresFeature: 'fw_sms',           appealBonus: 3 },
    { id: 'app_photos',     name: 'Galeri Foto', devCost: 5000,  devDays: 8,  requiresFeature: 'fw_camera_gallery', appealBonus: 4 },
    { id: 'app_music',      name: 'Pemutar Musik', devCost: 6000, devDays: 10, requiresFeature: 'fw_contacts',      appealBonus: 4 },
    { id: 'app_maps',       name: 'Peta',        devCost: 12000, devDays: 18, requiresFeature: 'fw_gps',            appealBonus: 6 },
    { id: 'app_store',      name: 'Toko App',    devCost: 20000, devDays: 25, requiresFeature: 'fw_appstore',       appealBonus: 10 },
    { id: 'app_assistant',  name: 'Asisten AI',  devCost: 40000, devDays: 40, requiresFeature: 'fw_ai_on_device',   appealBonus: 12 }
];

// Template untuk developer pihak ketiga (jumlah apps bertambah otomatis)
export const DEV_TEMPLATES = {
    baseGrowthPerMonth: 5,          // jumlah apps dasar per bulan (jika App Store ada)
    perReputationBonus: 0.5,        // +0.5 apps per poin reputasi per bulan
    perStabilityBonus: 0.1,         // +0.1 apps per poin stabilitas per bulan
    maxApps: 2000                   // batas atas
};

// ============================================================
// BUG OS — dipicu harian jika Stabilitas rendah.
// Peluang per hari: (100 - stability) / 100 * baseChancePerDay
// baseChancePerDay = 0.02 (2%) di balance.data.js
// ============================================================
export const BUG_TEMPLATES = [
    { id: 'bug_crash',      name: 'Aplikasi Sering Crash',     severity: 1, satisfactionHit: 3,  reputationHit: 1, patchCost: 5000,  patchDays: 5 },
    { id: 'bug_battery',    name: 'Drain Baterai Berlebih',     severity: 2, satisfactionHit: 5,  reputationHit: 2, patchCost: 8000,  patchDays: 7 },
    { id: 'bug_wifi',       name: 'Koneksi Wi-Fi Tidak Stabil', severity: 2, satisfactionHit: 4,  reputationHit: 2, patchCost: 6000,  patchDays: 6 },
    { id: 'bug_heating',    name: 'Ponsel Cepat Panas',         severity: 3, satisfactionHit: 8,  reputationHit: 4, patchCost: 15000, patchDays: 12 },
    { id: 'bug_security',   name: 'Celah Keamanan Kritis',      severity: 4, satisfactionHit: 12, reputationHit: 8, patchCost: 30000, patchDays: 18 },
    { id: 'bug_ui_glitch',  name: 'Antarmuka Berkedip',         severity: 1, satisfactionHit: 2,  reputationHit: 1, patchCost: 4000,  patchDays: 4 }
];

// Utilitas pencarian
export function getOsFeatureById(id) { return OS_FEATURES.find(f => f.id === id) || null; }
export function getLicenseById(id)   { return OS_LICENSES.find(l => l.id === id) || null; }
export function getBuiltinAppById(id) { return BUILTIN_APPS.find(a => a.id === id) || null; }
export function getBugTemplateById(id) { return BUG_TEMPLATES.find(b => b.id === id) || null; }
