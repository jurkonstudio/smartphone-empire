// FILE: src/data/os-update-cards.data.js  (NEW)
// ============================================================
// KARTU UPDATE OS — pengelompokan fitur OS menjadi "jalur" (track)
// untuk panel Riset > OS > Rancang Update.
//
// - Data fitur TETAP di os.data.js (OS_FEATURES). File ini hanya
//   memetakan setiap fitur ke satu jalur dan menghitung biaya rilis.
// - Setiap kartu = satu fitur OS. Kartu yang dipilih dirakit menjadi
//   satu build/versi OS, dan build dikenakan BIAYA RILIS per build
//   di samping biaya pengembangan fitur.
// - Era mengikuti OS_ERAS (os.data.js): biaya rilis naik per era dan
//   per tahun (inflasi sama polanya dengan yearCostInflation di R&D).
//
// Ekspor:
//   OS_UPDATE_TRACKS, OS_UPDATE_FEE, getOsEraIndexForYear,
//   getUpdateBuildFee, findUnmappedOsFeatures
// ============================================================

import { OS_FEATURES, OS_ERAS } from './os.data.js';

export const OS_UPDATE_TRACKS = [
    { id: 'ui',           name: 'Antarmuka',           icon: 'palette', hint: 'Tampilan, gestur, dan gaya visual',
      features: ['fw_touch_basic', 'fw_touch', 'fw_flat_ui', 'fw_aod', 'fw_dark_mode', 'fw_foldable_ui'] },
    { id: 'messaging',    name: 'Pesan & Notifikasi',  icon: 'message', hint: 'SMS, kontak, chat, dan notifikasi',
      features: ['fw_sms', 'fw_contacts', 'fw_smart_notif', 'fw_notifications', 'fw_imessage', 'fw_focus_mode'] },
    { id: 'camera',       name: 'Kamera & Galeri',     icon: 'camera',  hint: 'Kamera, MMS, dan penyimpanan foto',
      features: ['fw_camera_app', 'fw_camera_gallery'] },
    { id: 'audio',        name: 'Audio & Hiburan',     icon: 'headphones', hint: 'Nada dering dan multimedia',
      features: ['fw_poly_ringtone'] },
    { id: 'connectivity', name: 'Jaringan & Peta',     icon: 'signal',  hint: 'Browser, Bluetooth, GPS, dan ekosistem',
      features: ['fw_wap_browser', 'fw_bt_basic', 'fw_browser_mobile', 'fw_gps', 'fw_ecosystem'] },
    { id: 'security',     name: 'Keamanan & Akun',     icon: 'shield',  hint: 'Biometrik, privasi, dan akun terpadu',
      features: ['fw_biometric', 'fw_fingerprint', 'fw_sign_in', 'fw_privacy', 'fw_agent_guard'] },
    { id: 'performance',  name: 'Performa & Baterai',  icon: 'battery', hint: 'Multitasking, hemat daya, dan kesehatan digital',
      features: ['fw_multitasking', 'fw_low_power', 'fw_digital_wellbeing'] },
    { id: 'platform',     name: 'Platform & Aplikasi', icon: 'store',   hint: 'Runtime aplikasi, toko, dan sinkronisasi',
      features: ['fw_j2me', 'fw_appstore', 'fw_cloud_sync', 'fw_agent_store'] },
    { id: 'ai',           name: 'Asisten & AI',        icon: 'brain',   hint: 'Asisten suara, AI on-device, dan agen',
      features: ['fw_voice_assistant', 'fw_siri', 'fw_ai_on_device', 'fw_ondevice_llm', 'fw_ai_agent', 'fw_agentic_os'] }
];

// Biaya rilis per build (dibayar sekali setiap kali build OS dimulai).
// Rumus: (base + perFeature x (kartu - 1)) x (1 + yearInflation x (tahun - 2000)) x eraMultiplier[era]
// lalu dibulatkan ke kelipatan roundTo.
export const OS_UPDATE_FEE = {
    base: 3000,
    perFeature: 1000,
    yearInflation: 0.03,
    eraMultiplier: [1, 1.1, 1.25, 1.5, 1.75],   // urut sesuai OS_ERAS
    roundTo: 100
};

// Indeks era (OS_ERAS) untuk suatu tahun. Tahun sebelum era pertama -> 0.
export function getOsEraIndexForYear(year) {
    var y = year || OS_ERAS[0].fromYear;
    var idx = 0;
    for (var i = 0; i < OS_ERAS.length; i++) {
        if (y >= OS_ERAS[i].fromYear) idx = i;
    }
    return idx;
}

// Biaya rilis untuk satu build berisi featureIds pada tahun tertentu.
export function getUpdateBuildFee(featureIds, year) {
    var n = Math.max(1, (featureIds || []).length);
    var y = year || OS_ERAS[0].fromYear;
    var mult = OS_UPDATE_FEE.eraMultiplier[getOsEraIndexForYear(y)] || 1;
    var raw = (OS_UPDATE_FEE.base + OS_UPDATE_FEE.perFeature * (n - 1))
        * (1 + OS_UPDATE_FEE.yearInflation * Math.max(0, y - 2000))
        * mult;
    var step = OS_UPDATE_FEE.roundTo || 1;
    return Math.round(raw / step) * step;
}

// Fitur OS yang belum masuk jalur mana pun (untuk audit saat pengembangan).
export function findUnmappedOsFeatures() {
    var mapped = {};
    OS_UPDATE_TRACKS.forEach(function (tr) { tr.features.forEach(function (id) { mapped[id] = true; }); });
    return OS_FEATURES.filter(function (f) { return !mapped[f.id]; }).map(function (f) { return f.id; });
}
