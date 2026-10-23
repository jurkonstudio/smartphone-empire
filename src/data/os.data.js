// FILE: src/data/os.data.js
// ============================================================
// Data OS: era, fitur firmware, lisensi OS, aplikasi bawaan,
// template pertumbuhan developer, dan template bug.
//
// Ekspor yang dipakai modul lain:
//   OSSystem.js     -> OS_FEATURES, OS_LICENSES, BUILTIN_APPS, DEV_TEMPLATES,
//                      BUG_TEMPLATES, getOsFeatureById, getBuiltinAppById
//   OSPanel.js      -> OS_FEATURES, OS_LICENSES, BUILTIN_APPS, OS_ERAS, getOsFeatureById
//   ProductSystem   -> getLicenseById
//   ResearchPanel   -> getOsFeatureById
// ============================================================

import { BALANCE } from './balance.data.js';

export const OS_ERAS = [
    { id: 'firmware', name: 'Firmware Dasar',    fromYear: 2000, toYear: 2006 },
    { id: 'touch',    name: 'Era Layar Sentuh',  fromYear: 2007, toYear: 2012 },
    { id: 'modern',   name: 'Smartphone Modern', fromYear: 2013, toYear: 2018 },
    { id: 'ai_era',   name: 'AI & Ekosistem',    fromYear: 2019, toYear: 2025 },
    { id: 'future',   name: 'Era AI On-Device',  fromYear: 2026, toYear: 9999 }
];

// Fitur dengan starter:true otomatis dimiliki (tidak bisa dipilih/dikembangkan).
export const OS_FEATURES = [
    { id: 'fw_sms', name: 'SMS & Pesan Teks', description: 'Kirim dan terima pesan teks dasar.', era: 'firmware', minYear: 2000, devCost: 0, devDays: 0,
      statEffects: { stability: 2, speed: 0, features: 3, security: 0, design: 0 }, requiresFeatures: [], requiresResearch: [], starter: true },
    { id: 'fw_contacts', name: 'Buku Telepon', description: 'Simpan dan kelola kontak di ponsel.', era: 'firmware', minYear: 2000, devCost: 0, devDays: 0,
      statEffects: { stability: 2, speed: 0, features: 3, security: 0, design: 1 }, requiresFeatures: [], requiresResearch: [], starter: true },
    { id: 'fw_poly_ringtone', name: 'Nada Dering Polifonik', description: 'Nada dering polifonik 16 suara.', era: 'firmware', minYear: 2000, devCost: 2000, devDays: 4,
      statEffects: { stability: 0, speed: 0, features: 3, security: 0, design: 3 }, requiresFeatures: [], requiresResearch: ['net_edge'] },
    { id: 'fw_j2me', name: 'Java Mobile (J2ME)', description: 'Platform aplikasi dan game Java.', era: 'firmware', minYear: 2000, devCost: 6000, devDays: 8,
      statEffects: { stability: 0, speed: -1, features: 7, security: 0, design: 0 }, requiresFeatures: [], requiresResearch: ['net_gprs'] },
    { id: 'fw_irda', name: 'Transfer Inframerah', description: 'Kirim kontak dan file lewat port inframerah (IrDA).', era: 'firmware', minYear: 2001, devCost: 2500, devDays: 4,
      statEffects: { stability: 0, speed: 0, features: 2, security: 0, design: 0 }, requiresFeatures: [], requiresResearch: ['net_irda'] },
    { id: 'fw_mms', name: 'MMS', description: 'Kirim pesan multimedia berisi foto dan nada lewat jaringan data.', era: 'firmware', minYear: 2002, devCost: 5000, devDays: 6,
      statEffects: { stability: 0, speed: 0, features: 4, security: 0, design: 1 }, requiresFeatures: ['fw_sms'], requiresResearch: ['net_gprs'] },
    { id: 'fw_wap_browser', name: 'Browser WAP', description: 'Browser sederhana untuk situs WAP.', era: 'firmware', minYear: 2001, devCost: 5000, devDays: 7,
      statEffects: { stability: 0, speed: 0, features: 5, security: 0, design: 0 }, requiresFeatures: [], requiresResearch: ['net_gprs'] },
    { id: 'fw_fm_radio', name: 'Radio FM', description: 'Dengarkan siaran radio FM lewat headset.', era: 'firmware', minYear: 2001, devCost: 2500, devDays: 4,
      statEffects: { stability: 0, speed: 0, features: 3, security: 0, design: 1 }, requiresFeatures: [], requiresResearch: ['audio_fm'] },
    { id: 'fw_email', name: 'Klien Email', description: 'Baca dan kirim email POP3/IMAP langsung dari ponsel.', era: 'firmware', minYear: 2002, devCost: 6000, devDays: 8,
      statEffects: { stability: 0, speed: 0, features: 6, security: 0, design: 0 }, requiresFeatures: ['fw_wap_browser'], requiresResearch: ['net_email'] },
    { id: 'fw_memcard', name: 'Kartu Memori', description: 'Dukungan kartu memori untuk foto, kontak, dan file.', era: 'firmware', minYear: 2002, devCost: 3500, devDays: 5,
      statEffects: { stability: 0, speed: 0, features: 3, security: 0, design: 0 }, requiresFeatures: [], requiresResearch: ['stor_mmc'] },
    { id: 'fw_mp3_player', name: 'Pemutar MP3', description: 'Putar lagu MP3 dari kartu memori dengan daftar putar.', era: 'firmware', minYear: 2003, devCost: 5500, devDays: 7,
      statEffects: { stability: 0, speed: 0, features: 5, security: 0, design: 2 }, requiresFeatures: ['fw_memcard'], requiresResearch: ['audio_mp3'] },
    { id: 'fw_file_manager', name: 'Manajer File', description: 'Kelola folder dan file di ponsel serta kartu memori.', era: 'firmware', minYear: 2003, devCost: 4000, devDays: 6,
      statEffects: { stability: 1, speed: 0, features: 3, security: 0, design: 1 }, requiresFeatures: ['fw_memcard'], requiresResearch: ['stor_sd'] },
    { id: 'fw_video_rec', name: 'Perekam Video', description: 'Rekam dan simpan klip video pendek.', era: 'firmware', minYear: 2004, devCost: 6500, devDays: 8,
      statEffects: { stability: 0, speed: 0, features: 5, security: 0, design: 1 }, requiresFeatures: ['fw_camera_app'], requiresResearch: ['cam_video'] },
    { id: 'fw_video_player', name: 'Pemutar Video', description: 'Putar klip video dan streaming sederhana.', era: 'firmware', minYear: 2004, devCost: 6000, devDays: 8,
      statEffects: { stability: 0, speed: 0, features: 5, security: 0, design: 1 }, requiresFeatures: [], requiresResearch: ['net_streaming'] },
    { id: 'fw_gps_basic', name: 'GPS Dasar', description: 'Penentu posisi dan peta sederhana.', era: 'firmware', minYear: 2004, devCost: 8000, devDays: 9,
      statEffects: { stability: 0, speed: 0, features: 4, security: 0, design: 0 }, requiresFeatures: [], requiresResearch: ['sensor_gps'] },
    { id: 'fw_touch_basic', name: 'Layar Sentuh Resistif', description: 'Dukungan stylus dan layar sentuh resistif.', era: 'firmware', minYear: 2003, devCost: 9000, devDays: 10,
      statEffects: { stability: -1, speed: 0, features: 5, security: 0, design: 4 }, requiresFeatures: [], requiresResearch: ['layar_touch_res'] },
    { id: 'fw_camera_app', name: 'Aplikasi Kamera', description: 'Aplikasi kamera dasar.', era: 'firmware', minYear: 2003, devCost: 6000, devDays: 7,
      statEffects: { stability: 0, speed: 0, features: 5, security: 0, design: 2 }, requiresFeatures: [], requiresResearch: ['cam_vga'] },
    { id: 'fw_bt_basic', name: 'Bluetooth Dasar', description: 'Transfer file dan headset via Bluetooth.', era: 'firmware', minYear: 2004, devCost: 6000, devDays: 7,
      statEffects: { stability: 1, speed: 0, features: 4, security: 1, design: 0 }, requiresFeatures: [], requiresResearch: [] },
    { id: 'fw_camera_gallery', name: 'Galeri Foto', description: 'Galeri foto dan penyimpanan gambar.', era: 'firmware', minYear: 2005, devCost: 7000, devDays: 8,
      statEffects: { stability: 0, speed: 0, features: 5, security: 0, design: 3 }, requiresFeatures: [], requiresResearch: ['cam_2mp'] },
    { id: 'fw_multitasking', name: 'Multitasking', description: 'Beberapa aplikasi berjalan bersamaan.', era: 'firmware', minYear: 2005, devCost: 12000, devDays: 12,
      statEffects: { stability: -1, speed: 3, features: 6, security: 0, design: 0 }, requiresFeatures: [], requiresResearch: ['chip_dual'] },
    { id: 'fw_browser_mobile', name: 'Browser Mobile Penuh', description: 'Browser web penuh dengan HTML.', era: 'firmware', minYear: 2005, devCost: 10000, devDays: 10,
      statEffects: { stability: 0, speed: 1, features: 7, security: 0, design: 1 }, requiresFeatures: ['fw_wap_browser'], requiresResearch: ['net_3g'] },
    { id: 'fw_wifi', name: 'Wi-Fi', description: 'Terhubung ke jaringan Wi-Fi rumah dan kantor untuk data lebih cepat.', era: 'firmware', minYear: 2005, devCost: 9000, devDays: 9,
      statEffects: { stability: -1, speed: 1, features: 5, security: 0, design: 0 }, requiresFeatures: [], requiresResearch: ['net_wifi'] },
    { id: 'fw_touch', name: 'UI Multitouch', description: 'Antarmuka kapasitif multitouch dengan gestur.', era: 'touch', minYear: 2007, devCost: 20000, devDays: 14,
      statEffects: { stability: 1, speed: 2, features: 6, security: 0, design: 8 }, requiresFeatures: [], requiresResearch: ['layar_touch_cap'] },
    { id: 'fw_appstore', name: 'App Store', description: 'Toko aplikasi resmi untuk developer pihak ketiga.', era: 'touch', minYear: 2008, devCost: 30000, devDays: 18,
      statEffects: { stability: 1, speed: 0, features: 12, security: 0, design: 2 }, requiresFeatures: ['fw_browser_mobile'], requiresResearch: ['net_4g'] },
    { id: 'fw_gps', name: 'Navigasi GPS', description: 'Peta dan navigasi berbasis lokasi.', era: 'touch', minYear: 2009, devCost: 15000, devDays: 12,
      statEffects: { stability: 0, speed: 0, features: 7, security: 0, design: 1 }, requiresFeatures: [], requiresResearch: ['net_4g'] },
    { id: 'fw_smart_notif', name: 'Notifikasi Pintar', description: 'Pusat notifikasi dan push notification.', era: 'touch', minYear: 2009, devCost: 12000, devDays: 10,
      statEffects: { stability: 0, speed: 0, features: 5, security: 0, design: 3 }, requiresFeatures: ['fw_appstore'], requiresResearch: [] },
    { id: 'fw_voice_assistant', name: 'Asisten Suara', description: 'Perintah suara dasar.', era: 'touch', minYear: 2011, devCost: 25000, devDays: 15,
      statEffects: { stability: -1, speed: 0, features: 8, security: 0, design: 2 }, requiresFeatures: ['fw_touch'], requiresResearch: [] },
    { id: 'fw_siri', name: 'Asisten Virtual', description: 'Asisten virtual percakapan.', era: 'touch', minYear: 2011, devCost: 28000, devDays: 16,
      statEffects: { stability: -1, speed: 0, features: 9, security: 0, design: 2 }, requiresFeatures: ['fw_voice_assistant'], requiresResearch: [] },
    { id: 'fw_cloud_sync', name: 'Sinkronisasi Cloud', description: 'Cadangan dan sinkronisasi data online.', era: 'touch', minYear: 2012, devCost: 22000, devDays: 14,
      statEffects: { stability: 2, speed: 0, features: 6, security: 2, design: 0 }, requiresFeatures: ['fw_appstore'], requiresResearch: ['net_4g'] },
    { id: 'fw_imessage', name: 'Pesan Instan Terintegrasi', description: 'Chat instan terintegrasi di OS.', era: 'modern', minYear: 2013, devCost: 20000, devDays: 12,
      statEffects: { stability: 0, speed: 0, features: 7, security: 1, design: 1 }, requiresFeatures: ['fw_cloud_sync'], requiresResearch: [] },
    { id: 'fw_biometric', name: 'Biometrik', description: 'Autentikasi wajah/sidik jari tingkat OS.', era: 'modern', minYear: 2013, devCost: 30000, devDays: 16,
      statEffects: { stability: 0, speed: 0, features: 3, security: 10, design: 1 }, requiresFeatures: [], requiresResearch: ['cam_12mp'] },
    { id: 'fw_fingerprint', name: 'Sensor Sidik Jari', description: 'Buka kunci dengan sidik jari.', era: 'modern', minYear: 2014, devCost: 25000, devDays: 14,
      statEffects: { stability: 0, speed: 0, features: 2, security: 8, design: 0 }, requiresFeatures: ['fw_biometric'], requiresResearch: [] },
    { id: 'fw_flat_ui', name: 'UI Flat Modern', description: 'Desain antarmuka flat dan animasi halus.', era: 'modern', minYear: 2014, devCost: 28000, devDays: 15,
      statEffects: { stability: 0, speed: 3, features: 0, security: 0, design: 12 }, requiresFeatures: [], requiresResearch: ['layar_amoled'] },
    { id: 'fw_notifications', name: 'Notifikasi Lanjutan', description: 'Notifikasi interaktif dan dikelompokkan.', era: 'modern', minYear: 2014, devCost: 15000, devDays: 10,
      statEffects: { stability: 0, speed: 0, features: 5, security: 0, design: 3 }, requiresFeatures: ['fw_smart_notif'], requiresResearch: [] },
    { id: 'fw_sign_in', name: 'Akun Terpadu', description: 'Satu akun untuk semua layanan dan sinkronisasi sandi.', era: 'modern', minYear: 2015, devCost: 18000, devDays: 11,
      statEffects: { stability: 0, speed: 0, features: 4, security: 4, design: 1 }, requiresFeatures: ['fw_cloud_sync'], requiresResearch: [] },
    { id: 'fw_low_power', name: 'Mode Hemat Daya', description: 'Penghematan baterai cerdas.', era: 'modern', minYear: 2015, devCost: 16000, devDays: 10,
      statEffects: { stability: 2, speed: 0, features: 3, security: 0, design: 0 }, requiresFeatures: [], requiresResearch: [] },
    { id: 'fw_aod', name: 'Always-On Display', description: 'Layar selalu menyala hemat daya.', era: 'modern', minYear: 2016, devCost: 18000, devDays: 10,
      statEffects: { stability: 0, speed: 0, features: 3, security: 0, design: 6 }, requiresFeatures: ['fw_flat_ui'], requiresResearch: [] },
    { id: 'fw_foldable_ui', name: 'UI Layar Lipat', description: 'Antarmuka adaptif untuk layar lipat.', era: 'ai_era', minYear: 2019, devCost: 45000, devDays: 20,
      statEffects: { stability: -1, speed: 0, features: 8, security: 0, design: 10 }, requiresFeatures: ['fw_multitasking', 'fw_flat_ui'], requiresResearch: [] },
    { id: 'fw_dark_mode', name: 'Mode Gelap', description: 'Tema gelap seluruh sistem.', era: 'ai_era', minYear: 2019, devCost: 14000, devDays: 9,
      statEffects: { stability: 0, speed: 0, features: 2, security: 0, design: 8 }, requiresFeatures: [], requiresResearch: ['bat_big5000'] },
    { id: 'fw_focus_mode', name: 'Mode Fokus', description: 'Kontrol gangguan dan fokus kerja.', era: 'ai_era', minYear: 2019, devCost: 16000, devDays: 10,
      statEffects: { stability: 1, speed: 0, features: 4, security: 0, design: 2 }, requiresFeatures: ['fw_notifications'], requiresResearch: [] },
    { id: 'fw_digital_wellbeing', name: 'Kesejahteraan Digital', description: 'Statistik dan batas waktu pemakaian.', era: 'ai_era', minYear: 2019, devCost: 16000, devDays: 10,
      statEffects: { stability: 1, speed: 0, features: 4, security: 0, design: 2 }, requiresFeatures: ['fw_notifications'], requiresResearch: [] },
    { id: 'fw_ai_on_device', name: 'AI On-Device', description: 'Pemrosesan AI langsung di perangkat.', era: 'ai_era', minYear: 2020, devCost: 50000, devDays: 22,
      statEffects: { stability: 0, speed: 3, features: 12, security: 2, design: 1 }, requiresFeatures: [], requiresResearch: ['chip_npu'] },
    { id: 'fw_privacy', name: 'Pusat Privasi', description: 'Kontrol izin dan privasi granular.', era: 'ai_era', minYear: 2020, devCost: 35000, devDays: 16,
      statEffects: { stability: 1, speed: 0, features: 3, security: 14, design: 1 }, requiresFeatures: ['fw_biometric'], requiresResearch: [] },
    { id: 'fw_ecosystem', name: 'Ekosistem Perangkat', description: 'Integrasi lintas perangkat dan eSIM.', era: 'ai_era', minYear: 2021, devCost: 60000, devDays: 24,
      statEffects: { stability: 1, speed: 1, features: 10, security: 3, design: 3 }, requiresFeatures: ['fw_cloud_sync'], requiresResearch: ['net_wifi6'] },
    { id: 'fw_ondevice_llm', name: 'LLM On-Device', description: 'Model bahasa besar berjalan di perangkat.', era: 'future', minYear: 2026, devCost: 90000, devDays: 28,
      statEffects: { stability: 0, speed: 2, features: 14, security: 3, design: 1 }, requiresFeatures: ['fw_ai_on_device'], requiresResearch: [] },
    { id: 'fw_ai_agent', name: 'AI Agent', description: 'Agen AI yang menjalankan tugas otomatis.', era: 'future', minYear: 2026, devCost: 110000, devDays: 32,
      statEffects: { stability: -1, speed: 1, features: 16, security: 2, design: 2 }, requiresFeatures: ['fw_ondevice_llm'], requiresResearch: [] },

    // [paket 2027-28, SPEKULATIF] Fitur OS era Agentic AI.
    { id: 'fw_agentic_os', name: 'OS Agentik', description: 'Sistem operasi berpusat agen: satu perintah menjalankan banyak aplikasi.', era: 'future', minYear: 2027, devCost: 150000, devDays: 36,
      statEffects: { stability: -1, speed: 1, features: 18, security: 1, design: 3 }, requiresFeatures: ['fw_ai_agent'], requiresResearch: ['ai_agentic_runtime'], speculative: true },
    { id: 'fw_agent_guard', name: 'Pagar Agen', description: 'Izin berlapis dan jejak audit untuk tindakan agen AI.', era: 'future', minYear: 2027, devCost: 90000, devDays: 24,
      statEffects: { stability: 1, speed: 0, features: 4, security: 16, design: 1 }, requiresFeatures: ['fw_ai_agent', 'fw_privacy'], requiresResearch: ['ai_agentic_runtime'], speculative: true },
    { id: 'fw_agent_store', name: 'Toko Agen', description: 'Toko agen dan skill AI pihak ketiga di atas OS agentik.', era: 'future', minYear: 2028, devCost: 120000, devDays: 30,
      statEffects: { stability: 0, speed: 0, features: 14, security: 0, design: 2 }, requiresFeatures: ['fw_agentic_os', 'fw_appstore'], requiresResearch: ['ai_agentic_runtime'], speculative: true }
];

// Lisensi OS pihak ketiga (biaya per unit ponsel).
export const OS_LICENSES = [
    { id: 'lic_symbian',   name: 'Symbian OS',        availableFromYear: 2000, costPerUnit: 6,  stats: { stability: 45, speed: 40, features: 45, security: 35, design: 35 } },
    { id: 'lic_winmobile', name: 'Windows Mobile',    availableFromYear: 2003, costPerUnit: 9,  stats: { stability: 40, speed: 40, features: 55, security: 40, design: 40 } },
    { id: 'lic_android',   name: 'Android (Open)',    availableFromYear: 2008, costPerUnit: 3,  stats: { stability: 55, speed: 55, features: 65, security: 50, design: 55 } },
    { id: 'lic_android_p', name: 'Android Premium',   availableFromYear: 2014, costPerUnit: 8,  stats: { stability: 70, speed: 68, features: 78, security: 68, design: 72 } },
    { id: 'lic_android_ai',name: 'Android AI Suite',  availableFromYear: 2023, costPerUnit: 14, stats: { stability: 80, speed: 78, features: 90, security: 80, design: 82 } }
];

// Lisensi OS pihak ketiga ikut berevolusi tiap tahun (update besar tahunan),
// sehingga OS buatan sendiri harus terus diriset agar tidak tertinggal.
export function getLicenseStatsAtYear(lic, year) {
    if (!lic) return null;
    var cfg = BALANCE.rnd.os;
    var yrs = Math.max(0, (year || lic.availableFromYear) - lic.availableFromYear);
    var bonus = Math.min(cfg.licenseGrowthCap, yrs * cfg.licenseGrowthPerYear);
    var out = {};
    Object.keys(lic.stats).forEach(function (k) { out[k] = Math.min(100, Math.round(lic.stats[k] + bonus)); });
    return out;
}

// Jalur R&D Platform OS (naik level terus-menerus, tiap level menambah stat OS).
export const OS_PLATFORM_TRACKS = [
    { id: 'stability', name: 'Kernel & Stabilitas',   hint: 'Lebih sedikit crash dan bug' },
    { id: 'speed',     name: 'Optimasi Runtime',      hint: 'Aplikasi terbuka lebih cepat' },
    { id: 'features',  name: 'Framework & API',       hint: 'Lebih banyak kemampuan platform' },
    { id: 'security',  name: 'Sandbox & Enkripsi',    hint: 'Data pengguna lebih aman' },
    { id: 'design',    name: 'Sistem Desain UI',      hint: 'Antarmuka lebih halus dan konsisten' }
];

// Aplikasi bawaan (dibuat pemain; butuh fitur App Store).
export const BUILTIN_APPS = [
    { id: 'app_notes',    name: 'Catatan',        devCost: 8000,   appealBonus: 2, requiresFeature: 'fw_appstore' },
    { id: 'app_music',    name: 'Pemutar Musik',  devCost: 12000,  appealBonus: 3, requiresFeature: 'fw_appstore' },
    { id: 'app_maps',     name: 'Peta',           devCost: 25000,  appealBonus: 5, requiresFeature: 'fw_gps' },
    { id: 'app_gallery',  name: 'Galeri Pintar',  devCost: 18000,  appealBonus: 4, requiresFeature: 'fw_camera_gallery' },
    { id: 'app_chat',     name: 'Aplikasi Chat',  devCost: 30000,  appealBonus: 6, requiresFeature: 'fw_imessage' },
    { id: 'app_wallet',   name: 'Dompet Digital', devCost: 40000,  appealBonus: 7, requiresFeature: 'fw_biometric' },
    { id: 'app_assistant',name: 'Asisten AI',     devCost: 70000,  appealBonus: 10, requiresFeature: 'fw_ai_on_device' }
];

// Pertumbuhan aplikasi pihak ketiga per bulan (dipakai OSSystem._onMonthChanged).
export const DEV_TEMPLATES = {
    baseGrowthPerMonth: 5,
    perReputationBonus: 0.5,
    perStabilityBonus: 0.1,
    maxApps: 2000
};

export function getOsFeatureById(id)   { return OS_FEATURES.find(function (f) { return f.id === id; }) || null; }
export function getLicenseById(id)     { return OS_LICENSES.find(function (l) { return l.id === id; }) || null; }
export function getBuiltinAppById(id)  { return BUILTIN_APPS.find(function (a) { return a.id === id; }) || null; }

// ============================================================
// TEMPLATE BUG (konteks tahun & fitur) — dipakai OSSystem._rollForBug
// ============================================================
export const BUG_TEMPLATES = [
    // ============================================================
    // ERA 1: GSM, SMS, Layar Monokrom (2000 - 2003)
    // ============================================================
    { id: 'bug_sms_freeze', name: 'Keypad Macet (SMS)', severity: 2, satisfactionHit: 4, reputationHit: 2, patchCost: 3000, patchDays: 3, minYear: 2000, maxYear: 2004, requiresFeature: 'fw_sms' },
    { id: 'bug_fw_hang', name: 'Firmware Hang di Menu', severity: 2, satisfactionHit: 5, reputationHit: 2, patchCost: 5000, patchDays: 5, minYear: 2000, maxYear: 2006 },
    { id: 'bug_bat_drain', name: 'Baterai Cepat Habis', severity: 2, satisfactionHit: 6, reputationHit: 3, patchCost: 4000, patchDays: 6, minYear: 2000, maxYear: 2008 },
    { id: 'bug_gprs_fail', name: 'GPRS Gagal Tersambung', severity: 3, satisfactionHit: 7, reputationHit: 4, patchCost: 8000, patchDays: 8, minYear: 2001, maxYear: 2007, requiresFeature: 'fw_wap_browser' },
    { id: 'bug_java_crash', name: 'Aplikasi Java Crash', severity: 2, satisfactionHit: 5, reputationHit: 2, patchCost: 6000, patchDays: 7, minYear: 2002, maxYear: 2009, requiresFeature: 'fw_j2me' },
    { id: 'bug_mms_fail', name: 'MMS Gagal Terkirim', severity: 2, satisfactionHit: 4, reputationHit: 2, patchCost: 5000, patchDays: 5, minYear: 2003, maxYear: 2008, requiresFeature: 'fw_mms' },
    { id: 'bug_ir_fail', name: 'Transfer Inframerah Terputus', severity: 1, satisfactionHit: 3, reputationHit: 1, patchCost: 3000, patchDays: 4, minYear: 2002, maxYear: 2006, requiresFeature: 'fw_irda' },

    // ============================================================
    // ERA 2: Kamera, Multimedia, 3G Awal (2004 - 2006)
    // ============================================================
    { id: 'bug_email_sync', name: 'Email Gagal Sinkron', severity: 2, satisfactionHit: 5, reputationHit: 2, patchCost: 5000, patchDays: 6, minYear: 2002, maxYear: 2012, requiresFeature: 'fw_email' },
    { id: 'bug_card_corrupt', name: 'Kartu Memori Terbaca Rusak', severity: 3, satisfactionHit: 7, reputationHit: 4, patchCost: 7000, patchDays: 8, minYear: 2003, maxYear: 2012, requiresFeature: 'fw_memcard' },
    { id: 'bug_mp3_skip', name: 'Lagu MP3 Terputus-putus', severity: 1, satisfactionHit: 3, reputationHit: 1, patchCost: 3000, patchDays: 4, minYear: 2003, maxYear: 2010, requiresFeature: 'fw_mp3_player' },
    { id: 'bug_video_codec', name: 'Video Tidak Bisa Diputar', severity: 2, satisfactionHit: 5, reputationHit: 3, patchCost: 6000, patchDays: 7, minYear: 2004, maxYear: 2012, requiresFeature: 'fw_video_player' },
    { id: 'bug_gps_fix', name: 'GPS Lama Mengunci Lokasi', severity: 2, satisfactionHit: 5, reputationHit: 2, patchCost: 6000, patchDays: 7, minYear: 2004, maxYear: 2010, requiresFeature: 'fw_gps_basic' },
    { id: 'bug_cam_save', name: 'Kamera Gagal Simpan Foto', severity: 3, satisfactionHit: 7, reputationHit: 4, patchCost: 10000, patchDays: 10, minYear: 2004, maxYear: 2010, requiresFeature: 'fw_camera_gallery' },
    { id: 'bug_bt_pair', name: 'Bluetooth Gagal Pairing', severity: 2, satisfactionHit: 5, reputationHit: 3, patchCost: 8000, patchDays: 8, minYear: 2004, maxYear: 2012, requiresFeature: 'fw_bt_basic' },
    { id: 'bug_mem_full', name: 'Memori Penuh (Lag)', severity: 3, satisfactionHit: 8, reputationHit: 5, patchCost: 12000, patchDays: 12, minYear: 2005, maxYear: 2014 },
    { id: 'bug_3g_switch', name: 'Gagal Pindah Jaringan 3G', severity: 3, satisfactionHit: 8, reputationHit: 5, patchCost: 15000, patchDays: 14, minYear: 2005, maxYear: 2013, requiresFeature: 'fw_browser_mobile' },
    { id: 'bug_symbian_crash', name: 'Sistem Operasi Crash', severity: 4, satisfactionHit: 10, reputationHit: 6, patchCost: 18000, patchDays: 15, minYear: 2006, maxYear: 2012 },

    // ============================================================
    // ERA 3: Layar Sentuh & Smartphone Awal (2007 - 2009)
    // ============================================================
    { id: 'bug_touch_unresponsive', name: 'Layar Sentuh Kurang Responsif', severity: 3, satisfactionHit: 9, reputationHit: 5, patchCost: 15000, patchDays: 12, minYear: 2007, maxYear: 2015, requiresFeature: 'fw_touch' },
    { id: 'bug_wifi_drop', name: 'Koneksi Wi-Fi Terputus', severity: 3, satisfactionHit: 7, reputationHit: 4, patchCost: 12000, patchDays: 10, minYear: 2006, maxYear: 2018, requiresFeature: 'fw_wifi' },
    { id: 'bug_browser_crash', name: 'Browser Sering Crash', severity: 3, satisfactionHit: 7, reputationHit: 4, patchCost: 15000, patchDays: 14, minYear: 2008, maxYear: 2016, requiresFeature: 'fw_browser_mobile' },
    { id: 'bug_appstore_fail', name: 'App Store Gagal Unduh', severity: 3, satisfactionHit: 8, reputationHit: 5, patchCost: 20000, patchDays: 15, minYear: 2008, maxYear: 2018, requiresFeature: 'fw_appstore' },
    { id: 'bug_gps_slow', name: 'GPS Lambat Dapat Lokasi', severity: 2, satisfactionHit: 5, reputationHit: 2, patchCost: 10000, patchDays: 8, minYear: 2009, maxYear: 2017, requiresFeature: 'fw_gps' },
    { id: 'bug_notif_delay', name: 'Notifikasi Tertunda', severity: 2, satisfactionHit: 5, reputationHit: 3, patchCost: 9000, patchDays: 7, minYear: 2009, maxYear: 2020, requiresFeature: 'fw_smart_notif' },

    // ============================================================
    // ERA 4: Smartphone Meledak (2010 - 2012)
    // ============================================================
    { id: 'bug_antenna_gate', name: 'Sinyal Drop Saat Dipegang', severity: 4, satisfactionHit: 12, reputationHit: 8, patchCost: 25000, patchDays: 20, minYear: 2010, maxYear: 2012 },
    { id: 'bug_os_update_crash', name: 'Crash Setelah Update OS', severity: 3, satisfactionHit: 8, reputationHit: 5, patchCost: 15000, patchDays: 12, minYear: 2010, maxYear: 2018 },
    { id: 'bug_voice_misunderstanding', name: 'Asisten Suara Salah Dengar', severity: 2, satisfactionHit: 5, reputationHit: 3, patchCost: 12000, patchDays: 10, minYear: 2011, maxYear: 2020, requiresFeature: 'fw_voice_assistant' },
    { id: 'bug_multitask_ram', name: 'RAM Penuh Saat Multitasking', severity: 3, satisfactionHit: 7, reputationHit: 4, patchCost: 14000, patchDays: 11, minYear: 2011, maxYear: 2019, requiresFeature: 'fw_multitasking' },
    { id: 'bug_cam_focus', name: 'Kamera Gagal Fokus', severity: 2, satisfactionHit: 6, reputationHit: 3, patchCost: 10000, patchDays: 9, minYear: 2012, maxYear: 2020, requiresFeature: 'fw_camera_gallery' },
    { id: 'bug_cloud_sync', name: 'Sinkronisasi Cloud Macet', severity: 3, satisfactionHit: 7, reputationHit: 4, patchCost: 16000, patchDays: 13, minYear: 2012, maxYear: 2026, requiresFeature: 'fw_cloud_sync' },

    // ============================================================
    // ERA 5: LTE & Sensor Biometrik (2013 - 2015)
    // ============================================================
    { id: 'bug_imessage_bug', name: 'Pesan Tidak Terkirim', severity: 3, satisfactionHit: 8, reputationHit: 5, patchCost: 18000, patchDays: 14, minYear: 2013, maxYear: 2018, requiresFeature: 'fw_imessage' },
    { id: 'bug_fingerprint_fail', name: 'Sensor Sidik Jari Gagal', severity: 3, satisfactionHit: 8, reputationHit: 5, patchCost: 20000, patchDays: 15, minYear: 2014, maxYear: 2022, requiresFeature: 'fw_fingerprint' },
    { id: 'bug_thermal_throttle', name: 'HP Panas & Performa Turun', severity: 3, satisfactionHit: 9, reputationHit: 5, patchCost: 22000, patchDays: 18, minYear: 2015, maxYear: 2026 },
    { id: 'bug_bootloop', name: 'Bootloop (Mati Total)', severity: 4, satisfactionHit: 15, reputationHit: 10, patchCost: 35000, patchDays: 25, minYear: 2015, maxYear: 2020 },
    { id: 'bug_lte_drop', name: 'Sinyal 4G Sering Putus', severity: 3, satisfactionHit: 7, reputationHit: 4, patchCost: 15000, patchDays: 12, minYear: 2015, maxYear: 2022, requiresFeature: 'fw_browser_mobile' },

    // ============================================================
    // ERA 6: Premium & USB-C (2016 - 2018)
    // ============================================================
    { id: 'bug_oled_burnin', name: 'Layar OLED Burn-in', severity: 3, satisfactionHit: 9, reputationHit: 6, patchCost: 25000, patchDays: 20, minYear: 2016, maxYear: 2026, requiresFeature: 'fw_aod' }, // AOD relates to OLED usage
    { id: 'bug_usbc_charging', name: 'USB-C Gagal Charging', severity: 3, satisfactionHit: 8, reputationHit: 5, patchCost: 18000, patchDays: 14, minYear: 2016, maxYear: 2024 },
    { id: 'bug_faceid_fail', name: 'Face ID Gagal (Gelap)', severity: 2, satisfactionHit: 6, reputationHit: 3, patchCost: 15000, patchDays: 12, minYear: 2017, maxYear: 2026, requiresFeature: 'fw_biometric' },
    { id: 'bug_notch_ui', name: 'UI Tidak Rapi di Notch', severity: 1, satisfactionHit: 3, reputationHit: 1, patchCost: 8000, patchDays: 7, minYear: 2017, maxYear: 2020 },
    { id: 'bug_battery_health', name: 'Baterai Drop Drastis', severity: 3, satisfactionHit: 8, reputationHit: 5, patchCost: 20000, patchDays: 15, minYear: 2018, maxYear: 2026, requiresFeature: 'fw_low_power' },

    // ============================================================
    // ERA 7: 5G & Layar Lipat (2019 - 2021)
    // ============================================================
    { id: 'bug_fold_screen', name: 'Layar Lipat Berkedip', severity: 4, satisfactionHit: 12, reputationHit: 8, patchCost: 40000, patchDays: 30, minYear: 2019, maxYear: 2026, requiresFeature: 'fw_foldable_ui' },
    { id: 'bug_5g_heat', name: 'HP Panas Saat Pakai 5G', severity: 3, satisfactionHit: 8, reputationHit: 5, patchCost: 22000, patchDays: 18, minYear: 2019, maxYear: 2026, requiresFeature: 'fw_browser_mobile' }, // assuming 5G relates to network browser
    { id: 'bug_indisplay_fp', name: 'Sensor Sidik Jari Layar Gagal', severity: 3, satisfactionHit: 7, reputationHit: 4, patchCost: 18000, patchDays: 15, minYear: 2019, maxYear: 2026, requiresFeature: 'fw_fingerprint' },
    { id: 'bug_camera_lens_switch', name: 'Kamera Macet Ganti Lensa', severity: 3, satisfactionHit: 7, reputationHit: 4, patchCost: 20000, patchDays: 16, minYear: 2020, maxYear: 2026, requiresFeature: 'fw_camera_gallery' },
    { id: 'bug_hfr_stutter', name: 'Animasi Tersendat (120Hz)', severity: 2, satisfactionHit: 5, reputationHit: 3, patchCost: 15000, patchDays: 12, minYear: 2021, maxYear: 2026, requiresFeature: 'fw_flat_ui' }, // relates to smooth animations

    // ============================================================
    // ERA 8 & 9: AI, Privasi & Masa Depan (2022 - 2026)
    // ============================================================
    { id: 'bug_ai_summary_wrong', name: 'AI Salah Merangkum Teks', severity: 2, satisfactionHit: 6, reputationHit: 4, patchCost: 25000, patchDays: 15, minYear: 2022, maxYear: 2026, requiresFeature: 'fw_ai_on_device' },
    { id: 'bug_hdr_inconsistent', name: 'Foto HDR Warna Aneh', severity: 2, satisfactionHit: 5, reputationHit: 3, patchCost: 18000, patchDays: 12, minYear: 2022, maxYear: 2026, requiresFeature: 'fw_camera_gallery' },
    { id: 'bug_esim_activation', name: 'eSIM Gagal Aktivasi', severity: 3, satisfactionHit: 7, reputationHit: 4, patchCost: 22000, patchDays: 14, minYear: 2023, maxYear: 2026, requiresFeature: 'fw_ecosystem' }, // assuming ecosystem feature covers eSIM
    { id: 'bug_ai_hallucination', name: 'AI Berhalusinasi (Bug)', severity: 3, satisfactionHit: 9, reputationHit: 6, patchCost: 35000, patchDays: 20, minYear: 2024, maxYear: 2026, requiresFeature: 'fw_ondevice_llm' },
    { id: 'bug_ai_agent_fail', name: 'AI Agent Gagal Eksekusi', severity: 4, satisfactionHit: 12, reputationHit: 8, patchCost: 50000, patchDays: 30, minYear: 2026, maxYear: 9999, requiresFeature: 'fw_ai_agent' },
    { id: 'bug_agent_permission_leak', name: 'Agen AI Bocorkan Izin Akses', severity: 4, satisfactionHit: 13, reputationHit: 9, patchCost: 55000, patchDays: 24, minYear: 2027, maxYear: 9999, requiresFeature: 'fw_agentic_os' },
    { id: 'bug_zero_day', name: 'Celah Keamanan Kritis (Zero-Day)', severity: 4, satisfactionHit: 15, reputationHit: 10, patchCost: 60000, patchDays: 10, minYear: 2010, maxYear: 9999, requiresFeature: 'fw_privacy' } // Security bug dari era modern
];
