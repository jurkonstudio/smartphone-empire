// FILE: src/data/os.data.js
// v2028.0 — OS Tech Tree lengkap, terikat dengan Riset Hardware (research.data.js).
// Logika: Fitur OS tidak bisa diriset jika Hardware pendukungnya belum selesai diriset.
export const OS_ERAS = [
    { id: 'firmware',   name: 'Firmware Dasar',      fromYear: 2000, toYear: 2006 },
    { id: 'touch',      name: 'Era Layar Sentuh',    fromYear: 2007, toYear: 2012 },
    { id: 'modern',     name: 'Smartphone Modern',   fromYear: 2013, toYear: 2018 },
    { id: 'ai_era',     name: 'AI & Ekosistem',      fromYear: 2019, toYear: 2025 },
    { id: 'future',     name: 'Era AI On-Device',    fromYear: 2026, toYear: 9999 }
];

export const OS_FEATURES = [
    // ============ ERA 1 — FIRMWARE (2000-2006) ============
    // Fokus: Teks, Suara, Java, Keypad Fisik.
    { id: 'fw_sms', era: 'firmware', minYear: 2000, starter: true, requiresResearch: ['net_gsm'],
      name: 'Pesan SMS', icon: 'message', description: 'Pesan singkat antar operator.',
      devCost: 3000, devDays: 8, complexity: 1, requiresFeatures: [],
      statEffects: { stability: 5, speed: 2, features: 8, security: 3, design: 2 } },

    { id: 'fw_contacts', era: 'firmware', minYear: 2000, starter: true, requiresResearch: ['net_gsm'],
      name: 'Buku Kontak', icon: 'contacts', description: 'Manajemen kontak dasar dengan grup.',
      devCost: 2500, devDays: 6, complexity: 1, requiresFeatures: [],
      statEffects: { stability: 4, speed: 2, features: 6, security: 3, design: 3 } },

    { id: 'fw_calendar', era: 'firmware', minYear: 2000, starter: true, requiresResearch: [],
      name: 'Kalender & Alarm', icon: 'calendar', description: 'Jadwal, pengingat, dan alarm.',
      devCost: 4000, devDays: 8, complexity: 1, requiresFeatures: [],
      statEffects: { stability: 5, speed: 2, features: 8, security: 2, design: 4 } },

    { id: 'fw_poly_ringtone', era: 'firmware', minYear: 2001, requiresResearch: ['layar_color_tft'],
      name: 'Nada Polifonik', icon: 'music-note', description: 'Nada dering polifonik untuk personalisasi.',
      devCost: 4500, devDays: 10, complexity: 1, requiresFeatures: [],
      statEffects: { stability: 3, speed: 1, features: 6, security: 0, design: 8 } },

    { id: 'fw_j2me', era: 'firmware', minYear: 2002, requiresResearch: ['chip_single'],
      name: 'J2ME Game', icon: 'gamepad', description: 'Platform game Java untuk ponsel.',
      devCost: 7000, devDays: 15, complexity: 2, requiresFeatures: [],
      statEffects: { stability: 4, speed: 3, features: 15, security: 2, design: 5 } },

    { id: 'fw_camera_app', era: 'firmware', minYear: 2002, requiresResearch: ['cam_vga'],
      name: 'Aplikasi Kamera', icon: 'camera', description: 'UI kamera sederhana untuk foto.',
      devCost: 6000, devDays: 12, complexity: 2, requiresFeatures: [],
      statEffects: { stability: 4, speed: 3, features: 10, security: 2, design: 6 } },

    { id: 'fw_wap_browser', era: 'firmware', minYear: 2003, requiresResearch: ['net_gprs'],
      name: 'WAP Browser', icon: 'globe', description: 'Browser WAP untuk web mobile awal.',
      devCost: 6500, devDays: 14, complexity: 2, requiresFeatures: [],
      statEffects: { stability: 4, speed: 4, features: 12, security: 4, design: 3 } },

    { id: 'fw_touch_basic', era: 'firmware', minYear: 2004, requiresResearch: ['layar_touch_res'],
      name: 'Dukungan Touch Dasar', icon: 'touch', description: 'Navigasi dengan stylus atau jari (Resistif).',
      devCost: 8000, devDays: 15, complexity: 2, requiresFeatures: [],
      statEffects: { stability: 3, speed: 3, features: 10, security: 2, design: 10 } },

    // ============ ERA 2 — TOUCH (2007-2012) ============
    // Fokus: Multitouch, App Store, Media Sosial, Ekosistem Awal.
    { id: 'fw_touch', era: 'touch', minYear: 2007, requiresResearch: ['layar_touch_cap'],
      name: 'Layar Sentuh Kapasitif', icon: 'sparkles', description: 'Multitouch penuh dengan gesture (seperti iPhone awal).',
      devCost: 15000, devDays: 20, complexity: 3, requiresFeatures: ['fw_touch_basic'],
      statEffects: { stability: 8, speed: 5, features: 15, security: 4, design: 20 } },

    { id: 'fw_browser_mobile', era: 'touch', minYear: 2007, requiresResearch: ['net_3g'],
      name: 'Mobile Browser Modern', icon: 'compass', description: 'Browser full web dengan tab (Safari/Chrome awal).',
      devCost: 14000, devDays: 20, complexity: 3, requiresFeatures: ['fw_touch'],
      statEffects: { stability: 6, speed: 8, features: 16, security: 8, design: 7 } },

    { id: 'fw_appstore', era: 'touch', minYear: 2008, requiresResearch: ['net_3g', 'chip_single'],
      name: 'App Store', icon: 'store', description: 'Toko aplikasi pihak ketiga. Terobosan ekosistem.',
      devCost: 30000, devDays: 30, complexity: 4, requiresFeatures: ['fw_touch'],
      statEffects: { stability: 6, speed: 4, features: 25, security: 10, design: 8 },
      unlockEcosystem: 'app_store' },

    { id: 'fw_multitasking', era: 'touch', minYear: 2010, requiresResearch: ['chip_dual'],
      name: 'Multitasking', icon: 'columns', description: 'Menjalankan aplikasi di background.',
      devCost: 18000, devDays: 25, complexity: 3, requiresFeatures: ['fw_appstore'],
      statEffects: { stability: 5, speed: 12, features: 18, security: 4, design: 6 } },

    { id: 'fw_camera_gallery', era: 'touch', minYear: 2007, requiresResearch: ['cam_2mp'],
      name: 'Kamera & Galeri', icon: 'image', description: 'Aplikasi kamera dan galeri foto yang terintegrasi.',
      devCost: 10000, devDays: 15, complexity: 2, requiresFeatures: [],
      statEffects: { stability: 4, speed: 5, features: 12, security: 3, design: 7 } },

    { id: 'fw_gps', era: 'touch', minYear: 2009, requiresResearch: ['net_3g'],
      name: 'GPS & Navigasi', icon: 'map-pin', description: 'Peta digital dengan navigasi real-time.',
      devCost: 14000, devDays: 20, complexity: 3, requiresFeatures: [],
      statEffects: { stability: 5, speed: 3, features: 15, security: 5, design: 4 } },

    { id: 'fw_imessage', era: 'touch', minYear: 2011, requiresResearch: ['net_3g'],
      name: 'Instant Messaging', icon: 'mail', description: 'Chat real-time (WhatsApp/iMessage).',
      devCost: 16000, devDays: 22, complexity: 3, requiresFeatures: ['fw_appstore'],
      statEffects: { stability: 7, speed: 6, features: 16, security: 12, design: 8 } },

    { id: 'fw_cloud_sync', era: 'touch', minYear: 2011, requiresResearch: ['net_hspa'],
      name: 'Cloud Sync', icon: 'cloud', description: 'Sinkronisasi data ke server awan (iCloud awal).',
      devCost: 22000, devDays: 28, complexity: 4, requiresFeatures: ['fw_appstore'],
      statEffects: { stability: 8, speed: 8, features: 16, security: 14, design: 5 } },

    { id: 'fw_voice_assistant', era: 'touch', minYear: 2011, requiresResearch: ['chip_dual'],
      name: 'Asisten Suara Dasar', icon: 'mic', description: 'Kontrol suara sederhana (Siri awal).',
      devCost: 25000, devDays: 35, complexity: 4, requiresFeatures: ['fw_cloud_sync'],
      statEffects: { stability: 5, speed: 8, features: 18, security: 8, design: 12 } },

    // ============ ERA 3 — MODERN (2013-2018) ============
    // Fokus: Keamanan Biometrik, Desain Flat, NFC, AR, Kamera Ganda.
    { id: 'fw_flat_ui', era: 'modern', minYear: 2013, requiresResearch: ['layar_ips'],
      name: 'Flat UI', icon: 'palette', description: 'Desain antarmuka flat modern (iOS 7).',
      devCost: 35000, devDays: 30, complexity: 3, requiresFeatures: ['fw_touch'],
      statEffects: { stability: 6, speed: 5, features: 8, security: 3, design: 22 } },

    { id: 'fw_fingerprint', era: 'modern', minYear: 2013, requiresResearch: ['chip_64bit'],
      name: 'Fingerprint Sensor', icon: 'fingerprint', description: 'Autentikasi sidik jari (Touch ID).',
      devCost: 45000, devDays: 40, complexity: 4, requiresFeatures: ['fw_flat_ui'],
      statEffects: { stability: 8, speed: 5, features: 14, security: 25, design: 8 } },

    { id: 'fw_digital_pay', era: 'modern', minYear: 2015, requiresResearch: ['chip_64bit'],
      name: 'Pembayaran Digital', icon: 'credit-card', description: 'Pembayaran via NFC (Apple Pay).',
      devCost: 55000, devDays: 40, complexity: 4, requiresFeatures: ['fw_fingerprint'],
      statEffects: { stability: 8, speed: 4, features: 20, security: 18, design: 6 } },

    { id: 'fw_3d_touch', era: 'modern', minYear: 2015, requiresResearch: ['layar_touch_cap'],
      name: 'Tekanan Layar (3D Touch)', icon: 'hand', description: 'Deteksi tingkat tekanan pada layar.',
      devCost: 45000, devDays: 45, complexity: 4, requiresFeatures: ['fw_flat_ui'],
      statEffects: { stability: 5, speed: 8, features: 14, security: 3, design: 12 } },

    { id: 'fw_low_power', era: 'modern', minYear: 2015, requiresResearch: ['bat_large'],
      name: 'Mode Hemat Daya', icon: 'battery', description: 'Optimasi daya untuk baterai lemah.',
      devCost: 25000, devDays: 25, complexity: 3, requiresFeatures: ['fw_flat_ui'],
      statEffects: { stability: 6, speed: 3, features: 10, security: 3, design: 5 } },

    { id: 'fw_portrait_mode', era: 'modern', minYear: 2016, requiresResearch: ['cam_dual'],
      name: 'Mode Portrait', icon: 'portrait', description: 'Efek bokeh dengan kamera ganda.',
      devCost: 55000, devDays: 50, complexity: 4, requiresFeatures: ['fw_camera_gallery'],
      statEffects: { stability: 6, speed: 8, features: 15, security: 5, design: 14 } },

    { id: 'fw_biometric', era: 'modern', minYear: 2017, requiresResearch: ['cam_12mp'],
      name: 'Biometric Face (Face ID)', icon: 'scan-face', description: 'Face recognition 3D untuk unlock.',
      devCost: 90000, devDays: 70, complexity: 5, requiresFeatures: ['fw_digital_pay'],
      statEffects: { stability: 9, speed: 8, features: 16, security: 30, design: 12 } },

    { id: 'fw_arkit', era: 'modern', minYear: 2017, requiresResearch: ['chip_octa'],
      name: 'AR Framework', icon: 'cube', description: 'Framework Augmented Reality (ARKit).',
      devCost: 85000, devDays: 65, complexity: 5, requiresFeatures: ['fw_camera_gallery'],
      statEffects: { stability: 7, speed: 12, features: 25, security: 8, design: 10 } },

    // ============ ERA 4 — AI & EKOSISTEM (2019-2025) ============
    // Fokus: Dark Mode, AI, Privasi, Layar Lipat.
    { id: 'fw_dark_mode', era: 'ai_era', minYear: 2019, requiresResearch: ['layar_amoled'],
      name: 'Mode Gelap', icon: 'moon', description: 'Tema gelap sistem-wide hemat baterai (terutama di OLED).',
      devCost: 60000, devDays: 30, complexity: 3, requiresFeatures: ['fw_flat_ui'],
      statEffects: { stability: 5, speed: 5, features: 12, security: 3, design: 20 } },

    { id: 'fw_gesture_nav', era: 'ai_era', minYear: 2019, requiresResearch: ['layar_amoled'],
      name: 'Gesture Navigation', icon: 'move', description: 'Navigasi tanpa tombol fisik (swipe).',
      devCost: 75000, devDays: 40, complexity: 4, requiresFeatures: ['fw_touch'],
      statEffects: { stability: 6, speed: 6, features: 12, security: 4, design: 22 } },

    { id: 'fw_privacy', era: 'ai_era', minYear: 2020, requiresResearch: [],
      name: 'Privacy Dashboard', icon: 'shield', description: 'Transparansi akses data oleh aplikasi.',
      devCost: 90000, devDays: 50, complexity: 4, requiresFeatures: ['fw_biometric'],
      statEffects: { stability: 8, speed: 5, features: 14, security: 25, design: 12 } },

    { id: 'fw_ai_on_device', era: 'ai_era', minYear: 2021, requiresResearch: ['chip_npu'],
      name: 'AI On-Device', icon: 'brain', description: 'Pemrosesan AI lokal tanpa internet (Live Text, dll).',
      devCost: 150000, devDays: 70, complexity: 5, requiresFeatures: ['fw_voice_assistant'],
      statEffects: { stability: 8, speed: 18, features: 30, security: 15, design: 12 } },

    { id: 'fw_dynamic_island', era: 'ai_era', minYear: 2022, requiresResearch: ['layar_amoled'],
      name: 'Dynamic Island', icon: 'sparkles', description: 'Notifikasi interaktif di area kamera depan.',
      devCost: 90000, devDays: 55, complexity: 5, requiresFeatures: ['fw_ai_on_device'],
      statEffects: { stability: 5, speed: 6, features: 18, security: 3, design: 25 } },

    { id: 'fw_aod', era: 'ai_era', minYear: 2022, requiresResearch: ['layar_amoled'],
      name: 'Always-On Display', icon: 'sun', description: 'Info ringkas saat layar mati.',
      devCost: 75000, devDays: 40, complexity: 4, requiresFeatures: ['fw_dark_mode'],
      statEffects: { stability: 5, speed: 3, features: 12, security: 3, design: 18 } },

    { id: 'fw_foldable_ui', era: 'ai_era', minYear: 2022, requiresResearch: ['layar_foldable'],
      name: 'Foldable UI', icon: 'layout', description: 'Antarmuka adaptif untuk layar lipat.',
      devCost: 120000, devDays: 60, complexity: 5, requiresFeatures: ['fw_multitasking'],
      statEffects: { stability: 6, speed: 8, features: 22, security: 4, design: 20 } },

    // ============ ERA 5 — FUTURE (2026+) ============
    { id: 'fw_ondevice_llm', era: 'future', minYear: 2026, requiresResearch: ['chip_3nm'],
      name: 'On-Device LLM', icon: 'brain-cog', description: 'Language model penuh (seperti ChatGPT) di ponsel.',
      devCost: 250000, devDays: 100, complexity: 5, requiresFeatures: ['fw_ai_on_device'],
      statEffects: { stability: 9, speed: 20, features: 30, security: 15, design: 15 } },

    { id: 'fw_ai_agent', era: 'future', minYear: 2027, requiresResearch: ['chip_3nm'],
      name: 'AI Agent Personal', icon: 'bot', description: 'Agen AI yang melakukan task otomatis lintas aplikasi.',
      devCost: 320000, devDays: 120, complexity: 5, requiresFeatures: ['fw_ondevice_llm'],
      statEffects: { stability: 9, speed: 25, features: 35, security: 18, design: 15 } }
];

// ============================================================
// BUG TEMPLATES (Tidak Berubah)
// ============================================================
export const BUG_TEMPLATES = [
    { id: 'bug_crash',       name: 'Aplikasi Sering Crash',     severity: 1, satisfactionHit: 3,  reputationHit: 1, patchCost: 5000,  patchDays: 5 },
    { id: 'bug_battery',     name: 'Drain Baterai Berlebih',    severity: 2, satisfactionHit: 5,  reputationHit: 2, patchCost: 8000,  patchDays: 7 },
    { id: 'bug_wifi',        name: 'Koneksi Wi-Fi Tidak Stabil', severity: 2, satisfactionHit: 4,  reputationHit: 2, patchCost: 6000,  patchDays: 6 },
    { id: 'bug_heating',     name: 'Ponsel Cepat Panas',        severity: 3, satisfactionHit: 8,  reputationHit: 4, patchCost: 15000, patchDays: 12 },
    { id: 'bug_security',    name: 'Celah Keamanan Kritis',     severity: 4, satisfactionHit: 12, reputationHit: 8, patchCost: 30000, patchDays: 18 },
    { id: 'bug_ui_glitch',   name: 'Antarmuka Berkedip',        severity: 1, satisfactionHit: 2,  reputationHit: 1, patchCost: 4000,  patchDays: 4 }
];

// ============================================================
// LISENSI OS & APLIKASI (Tidak Berubah)
// ============================================================
export const OS_LICENSES = [
    { id: 'license_basic', name: 'Nexus Mobile OS', era: 'firmware', availableFromYear: 2000, costPerUnit: 3, stats: { stability: 60, speed: 40, features: 30, security: 40, design: 35 }, description: 'OS generasi awal dengan fitur standar.' },
    { id: 'license_modern', name: 'Aurora OS', era: 'touch', availableFromYear: 2008, costPerUnit: 8, stats: { stability: 70, speed: 65, features: 60, security: 60, design: 70 }, description: 'OS layar sentuh populer dengan ekosistem besar.' },
    { id: 'license_premium', name: 'Zenith OS', era: 'modern', availableFromYear: 2015, costPerUnit: 15, stats: { stability: 85, speed: 85, features: 80, security: 85, design: 85 }, description: 'OS premium dengan ekosistem terbaik.' },
    { id: 'license_ai', name: 'Cortex AI OS', era: 'ai_era', availableFromYear: 2020, costPerUnit: 25, stats: { stability: 90, speed: 92, features: 95, security: 90, design: 88 }, description: 'OS berbasis AI dengan integrasi ekosistem lanjutan.' }
];

export const BUILTIN_APPS = [
    { id: 'app_messenger',  name: 'Pesan',          devCost: 3000,  devDays: 5,  requiresFeature: 'fw_sms',              appealBonus: 3 },
    { id: 'app_photos',     name: 'Galeri Foto',    devCost: 5000,  devDays: 8,  requiresFeature: 'fw_camera_gallery',   appealBonus: 4 },
    { id: 'app_music',      name: 'Pemutar Musik',  devCost: 6000,  devDays: 10, requiresFeature: null,                  appealBonus: 4 },
    { id: 'app_maps',       name: 'Peta',           devCost: 12000, devDays: 18, requiresFeature: 'fw_gps',              appealBonus: 6 },
    { id: 'app_store',      name: 'Toko App',       devCost: 20000, devDays: 25, requiresFeature: 'fw_appstore',         appealBonus: 10 },
    { id: 'app_wallet',     name: 'Dompet Digital', devCost: 25000, devDays: 30, requiresFeature: 'fw_digital_pay',      appealBonus: 8 },
    { id: 'app_health',     name: 'Kesehatan',      devCost: 22000, devDays: 28, requiresFeature: 'fw_fingerprint',           appealBonus: 6 },
    { id: 'app_arkit',      name: 'Studio AR',      devCost: 55000, devDays: 55, requiresFeature: 'fw_arkit',            appealBonus: 10 },
    { id: 'app_assistant',  name: 'Asisten AI',     devCost: 40000, devDays: 40, requiresFeature: 'fw_ai_on_device',     appealBonus: 12 }
];

export const DEV_TEMPLATES = {
    baseGrowthPerMonth: 5,
    perReputationBonus: 0.5,
    perStabilityBonus: 0.1,
    maxApps: 3000,
    featuredAppChance: 0.02
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
export function getOsFeatureById(id) {
    for (var i = 0; i < OS_FEATURES.length; i++) {
        if (OS_FEATURES[i].id === id) return OS_FEATURES[i];
    }
    return null;
}

export function getLicenseById(id) {
    for (var i = 0; i < OS_LICENSES.length; i++) {
        if (OS_LICENSES[i].id === id) return OS_LICENSES[i];
    }
    return null;
}

export function getBuiltinAppById(id) {
    for (var i = 0; i < BUILTIN_APPS.length; i++) {
        if (BUILTIN_APPS[i].id === id) return BUILTIN_APPS[i];
    }
    return null;
}

export function getBugTemplateById(id) {
    for (var i = 0; i < BUG_TEMPLATES.length; i++) {
        if (BUG_TEMPLATES[i].id === id) return BUG_TEMPLATES[i];
    }
    return null;
}

export function getFeaturesByEra(eraId) {
    return OS_FEATURES.filter(function (f) { return f.era === eraId; });
}

export function getFeaturesForYear(year) {
    return OS_FEATURES.filter(function (f) { return year >= f.minYear; });
}

export function getEraForYear(year) {
    for (var i = 0; i < OS_ERAS.length; i++) {
        if (year >= OS_ERAS[i].fromYear && year <= OS_ERAS[i].toYear) return OS_ERAS[i];
    }
    return OS_ERAS[OS_ERAS.length - 1];
          }
