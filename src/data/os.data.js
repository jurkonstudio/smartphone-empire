// Ganti BUG_TEMPLATES di src/data/os.data.js dengan kode ini:

export const BUG_TEMPLATES = [
    // ============================================================
    // ERA 1: GSM, SMS, Layar Monokrom (2000 - 2003)
    // ============================================================
    { id: 'bug_sms_freeze', name: 'Keypad Macet (SMS)', severity: 2, satisfactionHit: 4, reputationHit: 2, patchCost: 3000, patchDays: 3, minYear: 2000, maxYear: 2004, requiresFeature: 'fw_sms' },
    { id: 'bug_fw_hang', name: 'Firmware Hang di Menu', severity: 2, satisfactionHit: 5, reputationHit: 2, patchCost: 5000, patchDays: 5, minYear: 2000, maxYear: 2006 },
    { id: 'bug_bat_drain', name: 'Baterai Cepat Habis', severity: 2, satisfactionHit: 6, reputationHit: 3, patchCost: 4000, patchDays: 6, minYear: 2000, maxYear: 2008 },
    { id: 'bug_gprs_fail', name: 'GPRS Gagal Tersambung', severity: 3, satisfactionHit: 7, reputationHit: 4, patchCost: 8000, patchDays: 8, minYear: 2001, maxYear: 2007, requiresFeature: 'fw_wap_browser' },
    { id: 'bug_java_crash', name: 'Aplikasi Java Crash', severity: 2, satisfactionHit: 5, reputationHit: 2, patchCost: 6000, patchDays: 7, minYear: 2002, maxYear: 2009, requiresFeature: 'fw_j2me' },
    { id: 'bug_mms_fail', name: 'MMS Gagal Terkirim', severity: 2, satisfactionHit: 4, reputationHit: 2, patchCost: 5000, patchDays: 5, minYear: 2003, maxYear: 2008, requiresFeature: 'fw_camera_app' },
    { id: 'bug_ir_fail', name: 'Transfer Inframerah Terputus', severity: 1, satisfactionHit: 3, reputationHit: 1, patchCost: 3000, patchDays: 4, minYear: 2002, maxYear: 2006 },

    // ============================================================
    // ERA 2: Kamera, Multimedia, 3G Awal (2004 - 2006)
    // ============================================================
    { id: 'bug_cam_save', name: 'Kamera Gagal Simpan Foto', severity: 3, satisfactionHit: 7, reputationHit: 4, patchCost: 10000, patchDays: 10, minYear: 2004, maxYear: 2010, requiresFeature: 'fw_camera_gallery' },
    { id: 'bug_bt_pair', name: 'Bluetooth Gagal Pairing', severity: 2, satisfactionHit: 5, reputationHit: 3, patchCost: 8000, patchDays: 8, minYear: 2004, maxYear: 2012, requiresFeature: 'fw_bt_basic' },
    { id: 'bug_mem_full', name: 'Memori Penuh (Lag)', severity: 3, satisfactionHit: 8, reputationHit: 5, patchCost: 12000, patchDays: 12, minYear: 2005, maxYear: 2014 },
    { id: 'bug_3g_switch', name: 'Gagal Pindah Jaringan 3G', severity: 3, satisfactionHit: 8, reputationHit: 5, patchCost: 15000, patchDays: 14, minYear: 2005, maxYear: 2013, requiresFeature: 'fw_browser_mobile' },
    { id: 'bug_symbian_crash', name: 'Sistem Operasi Crash', severity: 4, satisfactionHit: 10, reputationHit: 6, patchCost: 18000, patchDays: 15, minYear: 2006, maxYear: 2012 },

    // ============================================================
    // ERA 3: Layar Sentuh & Smartphone Awal (2007 - 2009)
    // ============================================================
    { id: 'bug_touch_unresponsive', name: 'Layar Sentuh Kurang Responsif', severity: 3, satisfactionHit: 9, reputationHit: 5, patchCost: 15000, patchDays: 12, minYear: 2007, maxYear: 2015, requiresFeature: 'fw_touch' },
    { id: 'bug_wifi_drop', name: 'Koneksi Wi-Fi Terputus', severity: 3, satisfactionHit: 7, reputationHit: 4, patchCost: 12000, patchDays: 10, minYear: 2007, maxYear: 2018, requiresFeature: 'fw_browser_mobile' },
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
    { id: 'bug_zero_day', name: 'Celah Keamanan Kritis (Zero-Day)', severity: 4, satisfactionHit: 15, reputationHit: 10, patchCost: 60000, patchDays: 10, minYear: 2010, maxYear: 9999, requiresFeature: 'fw_privacy' } // Security bug dari era modern
];
