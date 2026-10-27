// FILE: src/data/research.data.js
// ============================================================
// DATA RISET — 9 kategori (Layar, Kamera, Baterai, Chip, Jaringan, Bodi, Sensor, Audio, Fitur).
// Semua angka balancing di sini (bukan di logic/UI).
// ============================================================

import { BALANCE } from './balance.data.js';
// Sistem Fitur Ponsel: kategori + node riset 'feature' digabung ke tech tree utama.
// features.data.js hanya mengimpor region.data.js, jadi tidak ada impor melingkar.
import {
    FEATURE_RESEARCH_CATEGORY,
    FEATURE_RESEARCH_NODES,
    FEATURE_RND_TRACK,
    validateFeatureData
} from './features.data.js';

export const RESEARCH_CATEGORIES = [
    { id: 'display',   name: 'Layar',        icon: 'monitor' },
    { id: 'camera',    name: 'Kamera',       icon: 'camera' },
    { id: 'battery',   name: 'Baterai',      icon: 'battery' },
    { id: 'chip',      name: 'Chip',         icon: 'cpu' },
    { id: 'network',   name: 'Jaringan',     icon: 'signal' },
    { id: 'body',      name: 'Bodi',         icon: 'layers' },      // BARU
    { id: 'sensor',    name: 'Sensor',       icon: 'shield' },      // BARU
    { id: 'audio',     name: 'Audio & Fitur',icon: 'headphones' }   // BARU
];
RESEARCH_CATEGORIES.push(FEATURE_RESEARCH_CATEGORY);   // kategori ke-9: 'feature'

// Kategori inti (8 pertama) = dasar perhitungan "Tech Edge". Kategori Fitur tidak ikut
// dirata-rata agar save lama tidak terkena nerf tersembunyi (mastery fitur mulai 0).
export const TECH_EDGE_EXCLUDED_CATEGORIES = ['feature'];

export const RESEARCH_NODES = [
    // ==================== LAYAR (Asli) ====================
    { id: 'layar_mono', category: 'display', tier: 1, minYear: 2000,
      name: 'Layar Monokrom',
      description: 'Layar hitam-putih sederhana untuk ponsel fitur awal.',
      cost: 2000, durationDays: 10, prerequisites: [],
      effects: { unlocksComponents: ['scr_mono'], statBonuses: { display: 5 }, unlocksOsFeatures: [] } },
    { id: 'layar_color_tft', category: 'display', tier: 1, minYear: 2001,
      name: 'TFT Warna',
      description: 'Layar warna pertama dengan konsumsi daya sedang.',
      cost: 6000, durationDays: 18, prerequisites: ['layar_mono'],
      effects: { unlocksComponents: ['scr_tft'], statBonuses: { display: 12 }, unlocksOsFeatures: [] } },
    { id: 'layar_touch_res', category: 'display', tier: 2, minYear: 2003,
      name: 'Touchscreen Resistif',
      description: 'Layar sentuh resistif, umum di PDA dan ponsel awal.',
      cost: 12000, durationDays: 25, prerequisites: ['layar_color_tft'],
      effects: { unlocksComponents: ['scr_touch_res'], statBonuses: { display: 18 }, unlocksOsFeatures: ['fw_touch_basic'] } },
    { id: 'layar_touch_cap', category: 'display', tier: 3, minYear: 2007,
      name: 'Kapasitif Multitouch',
      description: 'Layar sentuh kapasitif modern dengan multitouch.',
      cost: 30000, durationDays: 45, prerequisites: ['layar_touch_res'],
      effects: { unlocksComponents: ['scr_touch_cap'], statBonuses: { display: 30 }, unlocksOsFeatures: ['fw_touch'] } },
    { id: 'layar_ips', category: 'display', tier: 3, minYear: 2010,
      name: 'IPS / Retina Display',
      description: 'Kepadatan piksel tinggi dengan sudut pandang luas.',
      cost: 60000, durationDays: 55, prerequisites: ['layar_touch_cap'],
      effects: { unlocksComponents: ['scr_ips'], statBonuses: { display: 45 }, unlocksOsFeatures: [] } },
    { id: 'layar_amoled', category: 'display', tier: 4, minYear: 2014,
      name: 'AMOLED',
      description: 'Panel OLED dengan kontras tinggi dan hemat daya.',
      cost: 120000, durationDays: 70, prerequisites: ['layar_ips'],
      effects: { unlocksComponents: ['scr_amoled'], statBonuses: { display: 60 }, unlocksOsFeatures: ['fw_flat_ui'] } },
    { id: 'layar_hfr', category: 'display', tier: 4, minYear: 2017,
      name: 'Layar 90/120 Hz',
      description: 'Refresh rate tinggi untuk animasi mulus.',
      cost: 180000, durationDays: 80, prerequisites: ['layar_amoled'],
      effects: { unlocksComponents: ['scr_hfr'], statBonuses: { display: 75 }, unlocksOsFeatures: [] } },
    { id: 'layar_foldable', category: 'display', tier: 5, minYear: 2019,
      name: 'Layar Lipat',
      description: 'Panel fleksibel untuk ponsel lipat.',
      cost: 350000, durationDays: 110, prerequisites: ['layar_hfr'],
      effects: { unlocksComponents: ['scr_fold'], statBonuses: { display: 90 }, unlocksOsFeatures: [] } },
    { id: 'layar_crease_free', category: 'display', tier: 5, minYear: 2025,
      name: 'Layar Tanpa Lipatan',
      description: 'Panel fleksibel generasi baru dengan garis lipatan nyaris tak terlihat di layar dalam.',
      cost: 500000, durationDays: 130, prerequisites: ['layar_foldable'],
      effects: { unlocksComponents: [], statBonuses: { display: 95 }, unlocksOsFeatures: [] } },

    // ==================== KAMERA (Asli + Tambahan) ====================
    { id: 'cam_vga', category: 'camera', tier: 1, minYear: 2001,
      name: 'Kamera VGA',
      description: 'Kamera 0.3 MP pertama untuk ponsel.',
      cost: 3000, durationDays: 12, prerequisites: [],
      effects: { unlocksComponents: ['cam_vga'], statBonuses: { camera: 5 }, unlocksOsFeatures: [] } },
    { id: 'cam_1mp', category: 'camera', tier: 1, minYear: 2003,
      name: 'Kamera 1 MP',
      description: 'Kamera megapiksel pertama dengan detail lebih baik.',
      cost: 8000, durationDays: 20, prerequisites: ['cam_vga'],
      effects: { unlocksComponents: ['cam_1mp'], statBonuses: { camera: 12 }, unlocksOsFeatures: [] } },
    { id: 'cam_2mp', category: 'camera', tier: 2, minYear: 2005,
      name: 'Kamera 2 MP',
      description: 'Standar kamera ponsel pertengahan 2000-an.',
      cost: 15000, durationDays: 28, prerequisites: ['cam_1mp'],
      effects: { unlocksComponents: ['cam_2mp'], statBonuses: { camera: 20 }, unlocksOsFeatures: ['fw_camera_gallery'] } },
    { id: 'cam_5mp', category: 'camera', tier: 3, minYear: 2007,
      name: 'Kamera 5 MP',
      description: 'Kamera resolusi tinggi dengan autofokus.',
      cost: 35000, durationDays: 42, prerequisites: ['cam_2mp'],
      effects: { unlocksComponents: ['cam_5mp'], statBonuses: { camera: 32 }, unlocksOsFeatures: [] } },
    { id: 'cam_8mp', category: 'camera', tier: 3, minYear: 2010,
      name: 'Kamera 8 MP',
      description: 'Kamera 8 MP dengan perekaman video HD.',
      cost: 65000, durationDays: 58, prerequisites: ['cam_5mp'],
      effects: { unlocksComponents: ['cam_8mp'], statBonuses: { camera: 45 }, unlocksOsFeatures: [] } },
    { id: 'cam_12mp', category: 'camera', tier: 4, minYear: 2013,
      name: 'Kamera 12 MP',
      description: 'Kamera utama dengan stabilisasi optik.',
      cost: 120000, durationDays: 75, prerequisites: ['cam_8mp'],
      effects: { unlocksComponents: ['cam_12mp'], statBonuses: { camera: 60 }, unlocksOsFeatures: ['fw_biometric'] } },
    { id: 'cam_dual', category: 'camera', tier: 4, minYear: 2016,
      name: 'Kamera Ganda',
      description: 'Dua kamera untuk efek bokeh dan zoom optik.',
      cost: 200000, durationDays: 85, prerequisites: ['cam_12mp'],
      effects: { unlocksComponents: ['cam_dual'], statBonuses: { camera: 75 }, unlocksOsFeatures: [] } },
    { id: 'cam_48mp', category: 'camera', tier: 5, minYear: 2019,
      name: 'Kamera 48 MP',
      description: 'Sensor besar dengan piksel binning.',
      cost: 380000, durationDays: 105, prerequisites: ['cam_dual'],
      effects: { unlocksComponents: ['cam_48mp'], statBonuses: { camera: 92 }, unlocksOsFeatures: [] } },
    // --- TAMBAHAN KAMERA ---
    { id: 'cam_var_aperture', category: 'camera', tier: 4, minYear: 2019,
      name: 'Variable Aperture', description: 'Bukaan lensa yang bisa berubah untuk kontrol cahaya.',
      cost: 150000, durationDays: 60, prerequisites: ['cam_dual'],
      effects: { unlocksComponents: ['cam_var_aperture'], statBonuses: { camera: 10 }, unlocksOsFeatures: [] } },
    { id: 'cam_periscope', category: 'camera', tier: 5, minYear: 2020,
      name: 'Periscope Zoom', description: 'Lensa periskop untuk zoom optik 5x-10x tanpa bodi tebal.',
      cost: 250000, durationDays: 80, prerequisites: ['cam_48mp'],
      effects: { unlocksComponents: ['cam_periscope'], statBonuses: { camera: 15 }, unlocksOsFeatures: [] } },
    { id: 'cam_gimbal', category: 'camera', tier: 5, minYear: 2021,
      name: 'Gimbal Stabilization', description: 'Stabilizer mekanik mikro untuk video super mulus.',
      cost: 280000, durationDays: 85, prerequisites: ['cam_12mp'],
      effects: { unlocksComponents: ['cam_gimbal'], statBonuses: { camera: 15, quality: 5 }, unlocksOsFeatures: [] } },

    // ==================== BATERAI (Asli + Tambahan) ====================
    { id: 'bat_nimh', category: 'battery', tier: 1, minYear: 2000,
      name: 'Baterai NiMH',
      description: 'Baterai nikel-metal hidrida generasi awal.',
      cost: 1500, durationDays: 8, prerequisites: [],
      effects: { unlocksComponents: ['bat_nimh'], statBonuses: { battery: 5 }, unlocksOsFeatures: [] } },
    { id: 'bat_liion', category: 'battery', tier: 1, minYear: 2000,
      name: 'Baterai Li-Ion',
      description: 'Baterai lithium-ion dengan energi lebih padat.',
      cost: 4000, durationDays: 15, prerequisites: [],
      effects: { unlocksComponents: ['bat_liion'], statBonuses: { battery: 12 }, unlocksOsFeatures: [] } },
    { id: 'bat_lipo', category: 'battery', tier: 2, minYear: 2004,
      name: 'Baterai Li-Po',
      description: 'Baterai polimer fleksibel untuk desain tipis.',
      cost: 10000, durationDays: 22, prerequisites: ['bat_liion'],
      effects: { unlocksComponents: ['bat_lipo'], statBonuses: { battery: 22 }, unlocksOsFeatures: [] } },
    { id: 'bat_large', category: 'battery', tier: 3, minYear: 2012,
      name: 'Baterai Kapasitas Besar',
      description: 'Sel 2500+ mAh untuk smartphone modern.',
      cost: 45000, durationDays: 50, prerequisites: ['bat_lipo'],
      effects: { unlocksComponents: ['bat_large'], statBonuses: { battery: 40 }, unlocksOsFeatures: [] } },
    { id: 'bat_fast', category: 'battery', tier: 4, minYear: 2014,
      name: 'Fast Charging',
      description: 'Pengisian cepat dengan protokol khusus.',
      cost: 90000, durationDays: 65, prerequisites: ['bat_large'],
      effects: { unlocksComponents: ['bat_fast'], statBonuses: { battery: 55 }, unlocksOsFeatures: [] } },
    { id: 'bat_usbc', category: 'battery', tier: 4, minYear: 2015,
      name: 'Kabel & Port USB Tipe-C',
      description: 'Konektor reversibel standar baru untuk data dan pengisian daya. Kotak penjualan ikut berisi kabel USB Tipe-C.',
      cost: 60000, durationDays: 50, prerequisites: ['bat_large'],
      effects: { unlocksComponents: [], statBonuses: { battery: 48 }, unlocksOsFeatures: [] } },
    { id: 'bat_wireless', category: 'battery', tier: 4, minYear: 2017,
      name: 'Wireless Charging',
      description: 'Pengisian nirkabel standar Qi.',
      cost: 150000, durationDays: 78, prerequisites: ['bat_fast'],
      effects: { unlocksComponents: ['bat_wireless'], statBonuses: { battery: 70 }, unlocksOsFeatures: [] } },
    { id: 'bat_big5000', category: 'battery', tier: 5, minYear: 2020,
      name: 'Baterai 5000 mAh',
      description: 'Kapasitas besar untuk pemakaian seharian.',
      cost: 220000, durationDays: 90, prerequisites: ['bat_wireless'],
      effects: { unlocksComponents: ['bat_5000'], statBonuses: { battery: 85 }, unlocksOsFeatures: ['fw_dark_mode'] } },
    { id: 'bat_sicarbon', category: 'battery', tier: 5, minYear: 2023,
      name: 'Baterai Silicon-Carbon (Si/C)',
      description: 'Anoda silikon untuk kapasitas besar di bodi tetap tipis.',
      cost: 320000, durationDays: 100, prerequisites: ['bat_big5000'],
      effects: { unlocksComponents: ['bat_sicarbon'], statBonuses: { battery: 95 }, unlocksOsFeatures: [] } },
    { id: 'bat_graphene', category: 'battery', tier: 5, minYear: 2024,
      name: 'Baterai Graphene',
      description: 'Teknologi masa depan dengan kepadatan energi ekstrem.',
      cost: 450000, durationDays: 120, prerequisites: ['bat_sicarbon'],
      effects: { unlocksComponents: ['bat_graphene'], statBonuses: { battery: 100 }, unlocksOsFeatures: [] } },
    // --- TAMBAHAN BATERAI ---
    { id: 'bat_wireless_50w', category: 'battery', tier: 4, minYear: 2021,
      name: '50W Wireless Charging', description: 'Pengisian nirkabel super cepat.',
      cost: 180000, durationDays: 70, prerequisites: ['bat_wireless'],
      effects: { unlocksComponents: ['bat_wireless_50w'], statBonuses: { battery: 10 }, unlocksOsFeatures: [] } },
    { id: 'bat_200w', category: 'battery', tier: 5, minYear: 2022,
      name: '200W Super Fast Charging', description: 'Mengisi daya penuh dalam waktu kurang dari 10 menit.',
      cost: 300000, durationDays: 90, prerequisites: ['bat_fast'],
      effects: { unlocksComponents: ['bat_200w'], statBonuses: { battery: 15 }, unlocksOsFeatures: [] } },
    { id: 'bat_solidstate', category: 'battery', tier: 5, minYear: 2026,
      name: 'Solid-State Battery', description: 'Baterai masa depan tanpa elektrolit cair, sangat aman dan padat.',
      cost: 600000, durationDays: 150, prerequisites: ['bat_graphene'],
      effects: { unlocksComponents: ['bat_solidstate'], statBonuses: { battery: 20 }, unlocksOsFeatures: [] } },

    // ==================== CHIP (Asli) ====================
    { id: 'chip_single', category: 'chip', tier: 1, minYear: 2000,
      name: 'Chip Single-core',
      description: 'Prosesor satu inti untuk fitur dasar.',
      cost: 3000, durationDays: 14, prerequisites: [],
      effects: { unlocksComponents: ['chip_single'], statBonuses: { performance: 5 }, unlocksOsFeatures: [] } },
    { id: 'chip_dual', category: 'chip', tier: 2, minYear: 2004,
      name: 'Chip Dual-core',
      description: 'Dua inti untuk multitasking awal.',
      cost: 12000, durationDays: 26, prerequisites: ['chip_single'],
      effects: { unlocksComponents: ['chip_dual'], statBonuses: { performance: 18 }, unlocksOsFeatures: ['fw_multitasking'] } },
    { id: 'chip_quad', category: 'chip', tier: 3, minYear: 2010,
      name: 'Chip Quad-core',
      description: 'Empat inti, standar smartphone modern.',
      cost: 50000, durationDays: 55, prerequisites: ['chip_dual'],
      effects: { unlocksComponents: ['chip_quad'], statBonuses: { performance: 35 }, unlocksOsFeatures: [] } },
    { id: 'chip_64bit', category: 'chip', tier: 3, minYear: 2013,
      name: 'Chip 64-bit',
      description: 'Arsitektur ARM 64-bit untuk efisiensi lebih baik.',
      cost: 85000, durationDays: 68, prerequisites: ['chip_quad'],
      effects: { unlocksComponents: ['chip_64'], statBonuses: { performance: 50 }, unlocksOsFeatures: [] } },
    { id: 'chip_octa', category: 'chip', tier: 4, minYear: 2014,
      name: 'Chip Octa-core',
      description: 'Delapan inti dengan manajemen daya canggih.',
      cost: 140000, durationDays: 80, prerequisites: ['chip_64bit'],
      effects: { unlocksComponents: ['chip_octa'], statBonuses: { performance: 65 }, unlocksOsFeatures: [] } },
    { id: 'chip_npu', category: 'chip', tier: 4, minYear: 2018,
      name: 'NPU AI',
      description: 'Neural Processing Unit untuk AI on-device.',
      cost: 220000, durationDays: 95, prerequisites: ['chip_octa'],
      effects: { unlocksComponents: ['chip_npu'], statBonuses: { performance: 80 }, unlocksOsFeatures: ['fw_ai_on_device'] } },
    { id: 'chip_5nm', category: 'chip', tier: 5, minYear: 2020,
      name: 'Proses 5nm',
      description: 'Fabrikasi 5nm untuk efisiensi daya tinggi.',
      cost: 320000, durationDays: 105, prerequisites: ['chip_npu'],
      effects: { unlocksComponents: ['chip_5nm'], statBonuses: { performance: 92 }, unlocksOsFeatures: [] } },
    { id: 'chip_3nm', category: 'chip', tier: 5, minYear: 2023,
      name: 'Proses 3nm',
      description: 'Fabrikasi paling canggih dengan performa maksimal.',
      cost: 480000, durationDays: 120, prerequisites: ['chip_5nm'],
      effects: { unlocksComponents: ['chip_3nm'], statBonuses: { performance: 100 }, unlocksOsFeatures: [] } },
    // [paket 2027-28, SPEKULATIF] Runtime agen AI di perangkat; membuka fitur OS agentik.
    { id: 'ai_agentic_runtime', category: 'chip', tier: 5, minYear: 2027,
      name: 'Runtime Agen AI',
      description: 'Lapisan runtime agar agen AI menjalankan tugas berantai di perangkat. Membuka fitur OS agentik.',
      cost: 650000, durationDays: 140, prerequisites: ['chip_npu', 'chip_3nm'],
      effects: { unlocksComponents: [], statBonuses: { performance: 6 }, unlocksOsFeatures: ['fw_agentic_os', 'fw_agent_guard', 'fw_agent_store'] }, speculative: true },

    // ==================== JARINGAN (Asli + Tambahan) ====================
    { id: 'net_gsm', category: 'network', tier: 1, minYear: 2000,
      name: 'GSM',
      description: 'Jaringan seluler 2G untuk panggilan dan SMS.',
      cost: 1000, durationDays: 6, prerequisites: [],
      effects: { unlocksComponents: ['net_gsm'], statBonuses: { connectivity: 5 }, unlocksOsFeatures: ['fw_sms', 'fw_contacts'] } },
    { id: 'net_gprs', category: 'network', tier: 1, minYear: 2000,
      name: 'GPRS',
      description: 'Data paket 2.5G pertama untuk ponsel.',
      cost: 3000, durationDays: 12, prerequisites: ['net_gsm'],
      effects: { unlocksComponents: ['net_gprs'], statBonuses: { connectivity: 12 }, unlocksOsFeatures: ['fw_j2me'] } },
    { id: 'net_irda', category: 'network', tier: 1, minYear: 2001,
      name: 'Inframerah (IrDA)',
      description: 'Port inframerah untuk kirim kontak dan file jarak dekat.',
      cost: 2500, durationDays: 8, prerequisites: ['net_gsm'],
      effects: { unlocksComponents: [], statBonuses: { connectivity: 4 }, unlocksOsFeatures: ['fw_irda'] } },
    { id: 'net_email', category: 'network', tier: 1, minYear: 2002,
      name: 'Email Mobile (POP3/IMAP)',
      description: 'Ambil dan kirim email lewat jaringan data ponsel.',
      cost: 4000, durationDays: 10, prerequisites: ['net_gprs'],
      effects: { unlocksComponents: [], statBonuses: { connectivity: 3 }, unlocksOsFeatures: ['fw_email'] } },
    { id: 'net_streaming', category: 'network', tier: 2, minYear: 2004,
      name: 'Streaming Media (RTSP)',
      description: 'Putar video dan audio langsung dari jaringan data.',
      cost: 9000, durationDays: 20, prerequisites: ['net_edge'],
      effects: { unlocksComponents: [], statBonuses: { connectivity: 6 }, unlocksOsFeatures: ['fw_video_player'] } },
    { id: 'stor_mmc', category: 'chip', tier: 1, minYear: 2002,
      name: 'Slot Kartu MMC',
      description: 'Slot kartu memori MultiMediaCard pertama.',
      cost: 3500, durationDays: 10, prerequisites: ['chip_single'],
      effects: { unlocksComponents: ['stor_mmc_16'], statBonuses: { usability: 1 }, unlocksOsFeatures: ['fw_memcard'] } },
    { id: 'stor_sd', category: 'chip', tier: 1, minYear: 2003,
      name: 'Kartu SD',
      description: 'Kartu Secure Digital berkapasitas lebih besar.',
      cost: 5000, durationDays: 12, prerequisites: ['stor_mmc'],
      effects: { unlocksComponents: ['stor_sd_128'], statBonuses: { usability: 1 }, unlocksOsFeatures: ['fw_file_manager'] } },
    { id: 'stor_minisd', category: 'chip', tier: 2, minYear: 2004,
      name: 'Kartu miniSD',
      description: 'Kartu memori mini untuk bodi tipis.',
      cost: 7000, durationDays: 14, prerequisites: ['stor_sd'],
      effects: { unlocksComponents: ['stor_minisd_512'], statBonuses: { usability: 2 }, unlocksOsFeatures: [] } },
    { id: 'stor_microsd', category: 'chip', tier: 2, minYear: 2005,
      name: 'Kartu microSD',
      description: 'Kartu memori terkecil dengan kapasitas gigabyte.',
      cost: 9000, durationDays: 16, prerequisites: ['stor_minisd'],
      effects: { unlocksComponents: ['stor_microsd_1g'], statBonuses: { usability: 2 }, unlocksOsFeatures: [] } },
    { id: 'cam_video', category: 'camera', tier: 2, minYear: 2004,
      name: 'Perekam Video QCIF',
      description: 'Rekam klip video pendek dari kamera ponsel.',
      cost: 8000, durationDays: 18, prerequisites: ['cam_vga'],
      effects: { unlocksComponents: [], statBonuses: { camera: 4 }, unlocksOsFeatures: ['fw_video_rec'] } },
    { id: 'sensor_gps', category: 'sensor', tier: 2, minYear: 2004,
      name: 'Penerima GPS',
      description: 'Penerima satelit untuk menentukan posisi.',
      cost: 14000, durationDays: 28, prerequisites: ['net_gprs'],
      effects: { unlocksComponents: [], statBonuses: { connectivity: 5 }, unlocksOsFeatures: ['fw_gps_basic'] } },
    { id: 'stor_microsdhc', category: 'chip', tier: 2, minYear: 2007,
      name: 'Kartu microSDHC',
      description: 'Standar kartu memori kapasitas tinggi (SDHC).',
      cost: 15000, durationDays: 20, prerequisites: ['stor_microsd'],
      effects: { unlocksComponents: ['stor_microsdhc_4g'], statBonuses: { usability: 2 }, unlocksOsFeatures: [] } },
    { id: 'stor_flash16', category: 'chip', tier: 3, minYear: 2010,
      name: 'Flash Internal 16GB',
      description: 'Memori flash NAND tertanam di papan ponsel.',
      cost: 30000, durationDays: 40, prerequisites: ['stor_microsdhc'],
      effects: { unlocksComponents: ['stor_flash_16g'], statBonuses: { usability: 2 }, unlocksOsFeatures: [] } },
    { id: 'stor_emmc64', category: 'chip', tier: 3, minYear: 2013,
      name: 'eMMC 64GB',
      description: 'Penyimpanan tertanam eMMC dengan kontroler cepat.',
      cost: 60000, durationDays: 60, prerequisites: ['stor_flash16'],
      effects: { unlocksComponents: ['stor_emmc_64g'], statBonuses: { usability: 2 }, unlocksOsFeatures: [] } },
    { id: 'stor_ufs21', category: 'chip', tier: 4, minYear: 2016,
      name: 'UFS 2.1',
      description: 'Penyimpanan Universal Flash Storage generasi pertama untuk ponsel.',
      cost: 120000, durationDays: 80, prerequisites: ['stor_emmc64'],
      effects: { unlocksComponents: ['stor_ufs_128g'], statBonuses: { usability: 2 }, unlocksOsFeatures: [] } },
    { id: 'stor_ufs30', category: 'chip', tier: 4, minYear: 2019,
      name: 'UFS 3.0',
      description: 'UFS generasi ketiga dengan kecepatan hampir dua kali lipat.',
      cost: 200000, durationDays: 100, prerequisites: ['stor_ufs21'],
      effects: { unlocksComponents: ['stor_ufs_256g'], statBonuses: { usability: 3 }, unlocksOsFeatures: [] } },
    { id: 'stor_ufs31', category: 'chip', tier: 5, minYear: 2022,
      name: 'UFS 3.1',
      description: 'UFS 3.1 dengan fitur penulisan cepat dan kapasitas besar.',
      cost: 350000, durationDays: 110, prerequisites: ['stor_ufs30'],
      effects: { unlocksComponents: ['stor_ufs_512g'], statBonuses: { usability: 3 }, unlocksOsFeatures: [] } },
    { id: 'stor_ufs40', category: 'chip', tier: 5, minYear: 2024,
      name: 'UFS 4.0',
      description: 'UFS 4.0 dengan kecepatan tertinggi dan kapasitas terabyte.',
      cost: 500000, durationDays: 120, prerequisites: ['stor_ufs31'],
      effects: { unlocksComponents: ['stor_ufs_1t'], statBonuses: { usability: 3 }, unlocksOsFeatures: [] } },
    { id: 'net_edge', category: 'network', tier: 2, minYear: 2003,
      name: 'EDGE',
      description: 'Peningkatan kecepatan data 2.75G.',
      cost: 8000, durationDays: 20, prerequisites: ['net_gprs'],
      effects: { unlocksComponents: ['net_edge'], statBonuses: { connectivity: 20 }, unlocksOsFeatures: ['fw_poly_ringtone'] } },
    { id: 'net_wifi', category: 'network', tier: 2, minYear: 2005,
      name: 'Wi-Fi (802.11b/g)',
      description: 'Jaringan nirkabel lokal untuk data cepat di rumah dan kantor.',
      cost: 12000, durationDays: 25, prerequisites: ['net_edge'],
      effects: { unlocksComponents: [], statBonuses: { connectivity: 12 }, unlocksOsFeatures: ['fw_wifi'] } },
    { id: 'net_3g', category: 'network', tier: 2, minYear: 2005,
      name: '3G',
      description: 'Data seluler generasi ketiga, video call.',
      cost: 20000, durationDays: 35, prerequisites: ['net_edge'],
      effects: { unlocksComponents: ['net_3g'], statBonuses: { connectivity: 35 }, unlocksOsFeatures: ['fw_browser_mobile'] } },
    { id: 'net_hspa', category: 'network', tier: 3, minYear: 2008,
      name: 'HSPA',
      description: 'Peningkatan 3.5G untuk streaming.',
      cost: 45000, durationDays: 50, prerequisites: ['net_3g'],
      effects: { unlocksComponents: ['net_hspa'], statBonuses: { connectivity: 48 }, unlocksOsFeatures: [] } },
    { id: 'net_4g', category: 'network', tier: 3, minYear: 2012,
      name: '4G LTE',
      description: 'Jaringan generasi keempat berkecepatan tinggi.',
      cost: 90000, durationDays: 68, prerequisites: ['net_hspa'],
      effects: { unlocksComponents: ['net_4g'], statBonuses: { connectivity: 65 }, unlocksOsFeatures: ['fw_appstore', 'fw_cloud_sync', 'fw_gps'] } },
    { id: 'net_5g', category: 'network', tier: 5, minYear: 2020,
      name: '5G',
      description: 'Jaringan generasi kelima dengan latensi rendah.',
      cost: 300000, durationDays: 100, prerequisites: ['net_4g'],
      effects: { unlocksComponents: ['net_5g'], statBonuses: { connectivity: 90 }, unlocksOsFeatures: [] } },
    { id: 'net_wifi6', category: 'network', tier: 5, minYear: 2021,
      name: 'Wi-Fi 6 / eSIM',
      description: 'Konektivitas modern dengan eSIM terintegrasi.',
      cost: 400000, durationDays: 110, prerequisites: ['net_5g'],
      effects: { unlocksComponents: ['net_wifi6'], statBonuses: { connectivity: 100 }, unlocksOsFeatures: ['fw_ecosystem'] } },
    // --- TAMBAHAN JARINGAN ---
    { id: 'net_uwb', category: 'network', tier: 4, minYear: 2019,
      name: 'Ultra-Wideband (UWB)', description: 'Pelacakan posisi presisi tinggi (seperti AirTag).',
      cost: 120000, durationDays: 60, prerequisites: ['net_4g'],
      effects: { unlocksComponents: ['net_uwb'], statBonuses: { connectivity: 15 }, unlocksOsFeatures: ['fw_ecosystem'] } },
    { id: 'net_satellite', category: 'network', tier: 5, minYear: 2023,
      name: 'Satellite SOS', description: 'Pesan darurat via satelit saat tidak ada sinyal seluler.',
      cost: 400000, durationDays: 120, prerequisites: ['net_5g'],
      effects: { unlocksComponents: ['net_satellite'], statBonuses: { connectivity: 20, quality: 10 }, unlocksOsFeatures: [] } },

    // ==================== BODI (BARU) ====================
    { id: 'body_plastic', category: 'body', tier: 1, minYear: 2000,
      name: 'Plastik ABS', description: 'Bodi plastik kokoh untuk ponsel fitur awal.',
      cost: 2000, durationDays: 10, prerequisites: [],
      effects: { unlocksComponents: ['body_plastic'], statBonuses: { quality: 5 }, unlocksOsFeatures: [] } },
    { id: 'body_aluminum', category: 'body', tier: 2, minYear: 2004,
      name: 'Aluminium Anodized', description: 'Bodi logam ringan dan premium.',
      cost: 15000, durationDays: 25, prerequisites: ['body_plastic'],
      effects: { unlocksComponents: ['body_aluminum'], statBonuses: { quality: 15 }, unlocksOsFeatures: [] } },
    { id: 'body_glass', category: 'body', tier: 3, minYear: 2010,
      name: 'Kaca Tempered', description: 'Kaca kuat dengan lapisan oleophobic.',
      cost: 45000, durationDays: 40, prerequisites: ['body_aluminum'],
      effects: { unlocksComponents: ['body_glass'], statBonuses: { quality: 30 }, unlocksOsFeatures: [] } },
    { id: 'body_steel', category: 'body', tier: 4, minYear: 2017,
      name: 'Stainless Steel 316L', description: 'Baja tahan karat, sangat kokoh dan mewah.',
      cost: 100000, durationDays: 60, prerequisites: ['body_glass'],
      effects: { unlocksComponents: ['body_stainless'], statBonuses: { quality: 50 }, unlocksOsFeatures: [] } },
    { id: 'body_ceramic', category: 'body', tier: 4, minYear: 2020,
      name: 'Keramik Zirkonia', description: 'Bodi keramik tahan gores dan elegan.',
      cost: 180000, durationDays: 70, prerequisites: ['body_steel'],
      effects: { unlocksComponents: ['body_ceramic'], statBonuses: { quality: 70 }, unlocksOsFeatures: [] } },
    { id: 'body_titanium', category: 'body', tier: 5, minYear: 2023,
      name: 'Titanium Grade 5', description: 'Material aerospace-grade, ringan dan super kuat.',
      cost: 300000, durationDays: 90, prerequisites: ['body_ceramic'],
      effects: { unlocksComponents: ['body_titanium'], statBonuses: { quality: 90 }, unlocksOsFeatures: [] } },
    { id: 'body_vegan_leather', category: 'body', tier: 3, minYear: 2020,
      name: 'Vegan Leather', description: 'Kulit sintetis premium yang tidak licin dan tahan lama.',
      cost: 80000, durationDays: 50, prerequisites: ['body_glass'],
      effects: { unlocksComponents: ['body_vegan_leather'], statBonuses: { quality: 15, design: 10 }, unlocksOsFeatures: [] } },
    { id: 'body_aramid', category: 'body', tier: 5, minYear: 2021,
      name: 'Aramid Fiber', description: 'Serat karbon ringan dan kuat, khas HP gaming.',
      cost: 220000, durationDays: 75, prerequisites: ['body_ceramic'],
      effects: { unlocksComponents: ['body_aramid'], statBonuses: { quality: 20, design: 5 }, unlocksOsFeatures: [] } },

    // ==================== SENSOR (BARU) ====================
    { id: 'sensor_accel', category: 'sensor', tier: 1, minYear: 2006,
      name: 'Akselerometer', description: 'Sensor gerak untuk putar layar otomatis.',
      cost: 5000, durationDays: 15, prerequisites: [],
      effects: { unlocksComponents: ['sensor_accel'], statBonuses: { usability: 10 }, unlocksOsFeatures: [] } },
    { id: 'sensor_gyro', category: 'sensor', tier: 2, minYear: 2010,
      name: 'Giroskop & Kompas', description: 'Sensor orientasi 6-sumbu presisi.',
      cost: 20000, durationDays: 30, prerequisites: ['sensor_accel'],
      effects: { unlocksComponents: ['sensor_gyro'], statBonuses: { usability: 20 }, unlocksOsFeatures: [] } },
    { id: 'sensor_fp_rear', category: 'sensor', tier: 3, minYear: 2013,
      name: 'Sidik Jari (Belakang)', description: 'Sensor sidik jari kapasitif cepat.',
      cost: 60000, durationDays: 45, prerequisites: ['sensor_gyro', 'layar_touch_cap'],
      effects: { unlocksComponents: ['sensor_fp_rear'], statBonuses: { security: 40 }, unlocksOsFeatures: ['fw_biometric'] } },
    { id: 'sensor_face3d', category: 'sensor', tier: 4, minYear: 2017,
      name: 'Face ID (3D Pemindai)', description: 'Pemindaian wajah dengan titik inframerah.',
      cost: 150000, durationDays: 70, prerequisites: ['sensor_fp_rear', 'cam_dual'],
      effects: { unlocksComponents: ['sensor_faceid'], statBonuses: { security: 60 }, unlocksOsFeatures: [] } },
    { id: 'sensor_indisplay', category: 'sensor', tier: 4, minYear: 2018,
      name: 'Sidik Jari Dalam Layar', description: 'Sensor optik tersembunyi di bawah layar.',
      cost: 180000, durationDays: 80, prerequisites: ['sensor_fp_rear', 'layar_amoled'],
      effects: { unlocksComponents: ['sensor_indisplay'], statBonuses: { security: 75 }, unlocksOsFeatures: [] } },
    { id: 'sensor_lidar', category: 'sensor', tier: 5, minYear: 2020,
      name: 'Sensor LiDAR', description: 'Pemindai kedalaman ruang 3D.',
      cost: 250000, durationDays: 90, prerequisites: ['sensor_face3d'],
      effects: { unlocksComponents: ['sensor_lidar'], statBonuses: { security: 90 }, unlocksOsFeatures: [] } },

    // ==================== AUDIO & FITUR (BARU) ====================
    { id: 'audio_jack', category: 'audio', tier: 1, minYear: 2000,
      name: 'Jack Audio 3.5mm', description: 'Colokan headphone standar.',
      cost: 1000, durationDays: 5, prerequisites: [],
      effects: { unlocksComponents: ['audio_jack'], statBonuses: { usability: 5 }, unlocksOsFeatures: [] } },
    { id: 'audio_fm', category: 'audio', tier: 1, minYear: 2001,
      name: 'Radio FM',
      description: 'Tuner radio FM bawaan dengan headset sebagai antena.',
      cost: 2500, durationDays: 7, prerequisites: ['audio_jack'],
      effects: { unlocksComponents: [], statBonuses: { usability: 2 }, unlocksOsFeatures: ['fw_fm_radio'] } },
    { id: 'audio_mp3', category: 'audio', tier: 1, minYear: 2003,
      name: 'Pemutar MP3',
      description: 'Dekoder MP3 untuk memutar lagu dari kartu memori.',
      cost: 6000, durationDays: 14, prerequisites: ['audio_jack', 'stor_mmc'],
      effects: { unlocksComponents: [], statBonuses: { usability: 4 }, unlocksOsFeatures: ['fw_mp3_player'] } },
    { id: 'audio_bt', category: 'audio', tier: 1, minYear: 2002,
      name: 'Bluetooth 2.0', description: 'Transfer file dan headset nirkabel.',
      cost: 6000, durationDays: 15, prerequisites: ['audio_jack'],
      effects: { unlocksComponents: ['audio_bt'], statBonuses: { connectivity: 10 }, unlocksOsFeatures: ['fw_bt_basic'] } },
    { id: 'audio_stereo', category: 'audio', tier: 2, minYear: 2013,
      name: 'Speaker Stereo', description: 'Speaker ganda kiri-kanan.',
      cost: 35000, durationDays: 35, prerequisites: ['audio_bt'],
      effects: { unlocksComponents: ['audio_stereo'], statBonuses: { quality: 15 }, unlocksOsFeatures: [] } },
    { id: 'audio_nfc', category: 'audio', tier: 3, minYear: 2017,
      name: 'NFC (Pembayaran)', description: 'Chip komunikasi jarak dekat.',
      cost: 70000, durationDays: 50, prerequisites: ['audio_bt'],
      effects: { unlocksComponents: ['audio_nfc'], statBonuses: { connectivity: 20 }, unlocksOsFeatures: ['fw_wallet'] } },
    { id: 'audio_esim', category: 'audio', tier: 4, minYear: 2018,
      name: 'eSIM', description: 'Kartu SIM digital tanpa fisik.',
      cost: 120000, durationDays: 65, prerequisites: ['audio_nfc', 'net_4g'],
      effects: { unlocksComponents: ['audio_esim'], statBonuses: { connectivity: 25 }, unlocksOsFeatures: ['fw_ecosystem'] } },
    { id: 'audio_spatial', category: 'audio', tier: 5, minYear: 2021,
      name: 'Audio Spasial', description: 'Suara surround 3D dengan pelacakan kepala.',
      cost: 200000, durationDays: 80, prerequisites: ['audio_stereo'],
      effects: { unlocksComponents: ['audio_spatial'], statBonuses: { quality: 30 }, unlocksOsFeatures: [] } }
];
RESEARCH_NODES.push(...FEATURE_RESEARCH_NODES);   // 44 node riset kategori 'feature'

// ============================================================
// VALIDASI — dijalankan sekali saat boot.
// ============================================================
export function validateResearchData() {
    const issues = [];
    const ids = new Set();
    RESEARCH_NODES.forEach(n => {
        if (ids.has(n.id)) issues.push('ID duplikat: ' + n.id);
        ids.add(n.id);
    });
    const required = ['id', 'category', 'name', 'cost', 'durationDays', 'minYear', 'tier'];
    RESEARCH_NODES.forEach(n => {
        required.forEach(f => {
            if (n[f] === undefined) issues.push('Node ' + n.id + ' tidak punya field ' + f);
        });
    });
    RESEARCH_NODES.forEach(n => {
        (n.prerequisites || []).forEach(p => {
            if (!ids.has(p)) issues.push('Node ' + n.id + ' prasyarat "' + p + '" tidak ada');
        });
    });
    const byId = new Map(RESEARCH_NODES.map(n => [n.id, n]));
    const VISITING = 1, VISITED = 2;
    const mark = new Map();
    function visit(id, path) {
        const st = mark.get(id);
        if (st === VISITING) { issues.push('Siklus terdeteksi: ' + path.concat(id).join(' -> ')); return; }
        if (st === VISITED) return;
        mark.set(id, VISITING);
        const node = byId.get(id);
        if (node) (node.prerequisites || []).forEach(p => visit(p, path.concat(id)));
        mark.set(id, VISITED);
    }
    RESEARCH_NODES.forEach(n => visit(n.id, []));
    const validCats = new Set(RESEARCH_CATEGORIES.map(c => c.id));
    RESEARCH_NODES.forEach(n => {
        if (!validCats.has(n.category)) issues.push('Node ' + n.id + ' kategori tidak valid: ' + n.category);
    });
    // Validasi data fitur (ID id node utama = semua node selain kategori 'feature').
    const featNodeIds = new Set(FEATURE_RESEARCH_NODES.map(n => n.id));
    validateFeatureData(RESEARCH_NODES.filter(n => !featNodeIds.has(n.id)).map(n => n.id))
        .forEach(i => issues.push('[fitur] ' + i));
    if (issues.length) {
        console.warn('[research.data] Ditemukan ' + issues.length + ' masalah:');
        issues.forEach(i => console.warn('  - ' + i));
    } else {
        console.info('[research.data] Validasi OK. ' + RESEARCH_NODES.length + ' node, ' + RESEARCH_CATEGORIES.length + ' kategori.');
    }
    return issues;
}

export function getNodeById(id) {
    return RESEARCH_NODES.find(n => n.id === id) || null;
}
export function getNodesByCategory(catId) {
    return RESEARCH_NODES.filter(n => n.category === catId);
}

// ============================================================
// R&D BERKELANJUTAN — definisi jalur + fungsi murni (tanpa state)
// Dipakai ResearchSystem, ProductSystem, dan UI.
// ============================================================
export const RND_TRACKS = {
    display: { name: 'Penyempurnaan Layar',   hint: 'Kecerahan, akurasi warna, efisiensi panel',   productStat: 'display' },
    camera:  { name: 'Penyempurnaan Kamera',  hint: 'Sensor, optik, dan pemrosesan gambar',         productStat: 'camera' },
    battery: { name: 'Penyempurnaan Baterai', hint: 'Kepadatan sel, pengisian cepat, manajemen daya', productStat: 'battery' },
    chip:    { name: 'Penyempurnaan Chip',    hint: 'Efisiensi, performa, dan termal',               productStat: 'performance' },
    network: { name: 'Penyempurnaan Jaringan', hint: 'Antena, modem, dan kestabilan sinyal',         productStat: 'connectivity' },
    // TAMBAHAN RND TRACKS:
    body:    { name: 'Penyempurnaan Bodi',    hint: 'Material, bobot, dan durabilitas',              productStat: 'quality' },
    sensor:  { name: 'Penyempurnaan Sensor',  hint: 'Akurasi biometrik dan fitur keamanan',          productStat: 'security' },
    audio:   { name: 'Penyempurnaan Audio',   hint: 'Kualitas suara, konektivitas, dan fitur',       productStat: 'usability' },
    feature: FEATURE_RND_TRACK
};

// Standar level teknologi yang dianggap "normal" oleh pasar pada tahun tertentu.
export function getTechBenchmark(year) {
    var cfg = BALANCE.rnd;
    var b = Math.max(0, (year || 2000) - 2000) * cfg.benchmarkPerYear;
    return Math.min(b, cfg.maxLevel * 0.9);
}

// Bonus stat produk dari level penyempurnaan satu kategori.
export function getMasteryStatBonus(level) {
    var cfg = BALANCE.rnd;
    return Math.min(cfg.statCap, Math.max(0, level || 0) * cfg.statPerLevel);
}

// Rata-rata level semua kategori vs standar pasar -> faktor permintaan.
export function computeTechEdge(levels, year) {
    var cfg = BALANCE.rnd;
    var sum = 0;
    var cats = RESEARCH_CATEGORIES.filter(function (c) { return TECH_EDGE_EXCLUDED_CATEGORIES.indexOf(c.id) === -1; });
    cats.forEach(function (c) { sum += (levels && levels[c.id]) || 0; });
    var avg = sum / cats.length;
    var bench = getTechBenchmark(year);
    var delta = avg - bench;
    var factor = Math.max(cfg.edge.min, Math.min(cfg.edge.max, 1 + cfg.edge.perLevel * delta));
    return { avg: avg, benchmark: bench, delta: delta, factor: factor };
          }
