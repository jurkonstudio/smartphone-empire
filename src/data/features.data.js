// FILE: src/data/features.data.js  (BARU)
// ============================================================
// FITUR TAMBAHAN (MODUL) — teknologi dunia nyata yang belum ada di game:
// Bluetooth, Wi-Fi, GPS, NFC, sidik jari, Face ID, tahan air, penyimpanan,
// kamera lanjutan, sensor, AI, USB-C, dll.
//
// Efek ke game (semua dihitung dari file ini, fungsi murni tanpa state):
//   1. Stat produk      -> getFeatureStats()
//   2. Biaya per unit   -> getFeatureUnitCost()
//   3. Permintaan       -> getFeatureAnalysis(): bonus "baru/hype", penalti
//                          "fitur standar yang tidak ada", kapasitas penyimpanan
//                          vs standar tahun itu, pengaruh per wilayah, dan regulasi
//                          (mis. wajib USB-C di Eropa 2024)
//   4. Riset            -> FEATURE_RESEARCH_NODES (kategori baru 'feature')
//   5. Ulasan/Advisor   -> hasil getFeatureAnalysis() berisi daftar pujian & keluhan
//
// Produk lama (tanpa featureIds) dianggap netral — save lama aman.
// ============================================================

import { getRegionWeights } from './region.data.js';

// ---------- Kategori riset baru + jalur R&D lanjutan ----------
export const FEATURE_RESEARCH_CATEGORY = { id: 'feature', name: 'Fitur', icon: 'layers' };
export const FEATURE_RND_TRACK = {
    name: 'Penyempurnaan Fitur',
    hint: 'Sensor, biometrik, audio, dan pengalaman pengguna',
    productStat: 'usability'
};

export const FEATURE_GROUPS = [
    { id: 'connect',    name: 'Konektivitas',    nameEn: 'Connectivity',   icon: 'signal' },
    { id: 'security',   name: 'Keamanan',        nameEn: 'Security',       icon: 'layers' },
    { id: 'audio',      name: 'Audio',           nameEn: 'Audio',          icon: 'layers' },
    { id: 'camera_ex',  name: 'Kamera Lanjutan', nameEn: 'Advanced Camera', icon: 'camera' },
    { id: 'durability', name: 'Ketahanan',       nameEn: 'Durability',     icon: 'layers' },
    { id: 'power',      name: 'Daya',            nameEn: 'Power',          icon: 'battery' },
    { id: 'sensor',     name: 'Sensor',          nameEn: 'Sensors',        icon: 'layers' },
    { id: 'ux',         name: 'Pengalaman',      nameEn: 'Experience',     icon: 'phone' },
    { id: 'storage',    name: 'Penyimpanan',     nameEn: 'Storage',        icon: 'layers' },
    { id: 'ai',         name: 'AI',              nameEn: 'AI',             icon: 'cpu' }
];

// ---------- Builder ringkas ----------
// F(id, group, minYear, nama, nameEn, biayaPerUnit, stats, opsi)
// opsi: maxYear, research, excl (grup eksklusif), novelty [tahun, bonus],
//       region {asia,europe,rest}, ref, d, de, storageGB
function F(id, group, minYear, name, nameEn, costPerUnit, stats, o) {
    o = o || {};
    return {
        id: id, group: group, minYear: minYear, maxYear: o.maxYear || null,
        name: name, nameEn: nameEn,
        description: o.d || '', descriptionEn: o.de || '',
        costPerUnit: costPerUnit, stats: stats || {},
        requiresResearch: o.research || null,
        exclusiveGroup: o.excl || null,
        novelty: o.novelty ? { years: o.novelty[0], bonus: o.novelty[1] } : null,
        regionDemand: o.region || null,
        storageGB: o.storageGB || null,
        realReference: o.ref || ''
    };
}

export const FEATURES = [
    // ==================== KONEKTIVITAS ====================
    F('ft_bluetooth', 'connect', 2002, 'Bluetooth', 'Bluetooth', 2, { connectivity: 4, usability: 2 },
        { research: 'ft_bluetooth', excl: 'bluetooth', ref: 'Nokia 6310 (2002)',
          d: 'Headset dan transfer file nirkabel jarak dekat.', de: 'Wireless headset and short-range file transfer.' }),
    F('ft_bluetooth5', 'connect', 2017, 'Bluetooth 5', 'Bluetooth 5', 3, { connectivity: 6, usability: 3 },
        { research: 'ft_bluetooth5', excl: 'bluetooth', novelty: [2, 0.02], ref: 'Galaxy S8 (2017)',
          d: 'Jangkauan dua kali lipat, cocok untuk earbud nirkabel.', de: 'Double the range, made for true wireless earbuds.' }),
    F('ft_irda', 'connect', 2000, 'Inframerah (IrDA)', 'Infrared (IrDA)', 1, { connectivity: 2 },
        { maxYear: 2009, ref: 'Nokia 6210 (2000)',
          d: 'Kirim kontak dan file lewat inframerah. Mulai ditinggalkan.', de: 'Beam contacts and files by infrared. Fading out.' }),
    F('ft_wifi', 'connect', 2005, 'Wi-Fi', 'Wi-Fi', 4, { connectivity: 6, usability: 2 },
        { research: 'ft_wifi', ref: 'Nokia N80 (2005)',
          d: 'Internet cepat lewat hotspot tanpa kuota seluler.', de: 'Fast internet over hotspots without mobile data.' }),
    F('ft_gps', 'connect', 2007, 'GPS', 'GPS', 6, { connectivity: 5, usability: 4 },
        { research: 'ft_gps', ref: 'Nokia N95 (2007)',
          d: 'Navigasi dan peta langsung di ponsel.', de: 'Navigation and maps built into the phone.' }),
    F('ft_dual_sim', 'connect', 2008, 'Dual SIM', 'Dual SIM', 3, { connectivity: 3, usability: 5 },
        { region: { asia: 1.12, rest: 1.05, europe: 0.99 }, ref: 'Ponsel dual SIM Asia (2008+)',
          d: 'Dua nomor dalam satu ponsel. Sangat disukai pasar Asia.', de: 'Two numbers in one phone. A huge hit in Asia.' }),
    F('ft_nfc', 'connect', 2011, 'NFC', 'NFC', 4, { connectivity: 3, usability: 4 },
        { research: 'ft_nfc', region: { asia: 1.08, europe: 1.06 }, ref: 'Galaxy Nexus (2011)',
          d: 'Bayar nirkontak dan pairing instan.', de: 'Contactless payments and instant pairing.' }),
    F('ft_usbc', 'connect', 2015, 'USB Type-C', 'USB Type-C', 3, { usability: 3, battery: 1 },
        { research: 'bat_usbc', ref: 'Nexus 6P (2015)',
          d: 'Colokan reversibel, transfer lebih cepat. Jadi wajib di Eropa 2024.', de: 'Reversible port with faster transfer. Mandatory in Europe from 2024.' }),
    F('ft_esim', 'connect', 2018, 'eSIM', 'eSIM', 3, { connectivity: 3, usability: 3 },
        { research: 'ft_esim', region: { europe: 1.04, rest: 1.04 }, ref: 'iPhone XS (2018)',
          d: 'Aktivasi operator tanpa kartu fisik.', de: 'Carrier activation without a physical card.' }),
    F('ft_uwb', 'connect', 2019, 'Ultra-Wideband (UWB)', 'Ultra-Wideband (UWB)', 8, { connectivity: 3, usability: 2 },
        { research: 'ft_uwb', novelty: [3, 0.03], ref: 'iPhone 11 (2019)',
          d: 'Pelacakan posisi presisi tinggi untuk tag dan kunci digital.', de: 'Precise spatial tracking for tags and digital keys.' }),
    F('ft_satellite', 'connect', 2022, 'SOS Satelit', 'Satellite SOS', 18, { connectivity: 6, quality: 3 },
        { research: 'ft_satellite', novelty: [3, 0.05], region: { rest: 1.08, europe: 1.04 }, ref: 'iPhone 14 (2022)',
          d: 'Pesan darurat tanpa sinyal seluler.', de: 'Emergency messaging with no cell signal.' }),
    F('ft_wifi7', 'connect', 2024, 'Wi-Fi 7', 'Wi-Fi 7', 8, { connectivity: 4 },
        { research: 'ft_wifi7', novelty: [2, 0.02], ref: 'Galaxy S24 Ultra (2024)',
          d: 'Latensi sangat rendah dan kecepatan multi-gigabit.', de: 'Very low latency and multi-gigabit speeds.' }),

    // ==================== KEAMANAN ====================
    F('ft_face_2d', 'security', 2011, 'Buka Kunci Wajah 2D', '2D Face Unlock', 3, { usability: 3, quality: -1 },
        { research: 'ft_face', excl: 'biometric', ref: 'Galaxy Nexus (2011)',
          d: 'Murah dan cepat, tetapi bisa dikelabui foto.', de: 'Cheap and quick, but a photo can fool it.' }),
    F('ft_fp_rear', 'security', 2013, 'Sidik Jari (Belakang)', 'Fingerprint (Rear)', 8, { quality: 3, usability: 5 },
        { research: 'ft_fingerprint', excl: 'biometric', novelty: [2, 0.03], ref: 'iPhone 5s (2013)',
          d: 'Buka kunci dengan satu sentuhan.', de: 'Unlock with a single touch.' }),
    F('ft_iris', 'security', 2015, 'Pemindai Iris', 'Iris Scanner', 12, { quality: 4, usability: 3 },
        { research: 'ft_iris', excl: 'biometric', maxYear: 2020, ref: 'Lumia 950 (2015)',
          d: 'Keamanan tinggi, tetapi lambat dan kurang praktis.', de: 'High security, but slow and fiddly.' }),
    F('ft_secure_chip', 'security', 2016, 'Chip Keamanan Perangkat Keras', 'Hardware Security Chip', 6, { quality: 3 },
        { research: 'ft_secure', region: { europe: 1.05 }, ref: 'Secure Enclave / Titan M (2016+)',
          d: 'Data sensitif tersimpan di area terisolasi.', de: 'Sensitive data stored in an isolated enclave.' }),
    F('ft_face_3d', 'security', 2017, 'Face ID 3D', '3D Face ID', 25, { quality: 6, usability: 6, design: -2 },
        { research: 'ft_face3d', excl: 'biometric', novelty: [3, 0.04], ref: 'iPhone X (2017)',
          d: 'Pemindaian wajah 3D yang aman, tanpa tombol.', de: 'Secure 3D face scanning, no button needed.' }),
    F('ft_fp_display', 'security', 2018, 'Sidik Jari di Layar', 'In-Display Fingerprint', 16, { quality: 4, usability: 6, design: 4 },
        { research: 'ft_fp_display', excl: 'biometric', novelty: [2, 0.03], ref: 'Vivo X20 Plus UD (2018)',
          d: 'Sensor tersembunyi di bawah layar.', de: 'Sensor hidden beneath the display.' }),

    // ==================== AUDIO ====================
    F('ft_fm_radio', 'audio', 2002, 'Radio FM', 'FM Radio', 1, { usability: 2 },
        { maxYear: 2022, region: { asia: 1.06, rest: 1.05 }, ref: 'Nokia 1100 (2003)',
          d: 'Dengar radio tanpa kuota. Populer di pasar berkembang.', de: 'Listen to radio with no data. Popular in emerging markets.' }),
    F('ft_mp3', 'audio', 2004, 'Pemutar MP3', 'MP3 Player', 3, { usability: 4, design: 1 },
        { research: 'ft_mp3', ref: 'Sony Ericsson W800 (2005)',
          d: 'Musik digital langsung di ponsel.', de: 'Digital music right on the phone.' }),
    F('ft_stereo', 'audio', 2013, 'Speaker Stereo', 'Stereo Speakers', 5, { usability: 3, quality: 2 },
        { research: 'ft_stereo', ref: 'HTC One M7 (2013)',
          d: 'Suara depan stereo untuk video dan game.', de: 'Front-facing stereo for video and games.' }),
    F('ft_no_jack', 'audio', 2016, 'Tanpa Jack 3,5 mm', 'No 3.5 mm Jack', 0, { usability: -3, design: 3, quality: 1 },
        { novelty: [2, -0.04], ref: 'iPhone 7 (2016)',
          d: 'Bodi lebih tipis dan tahan air, tetapi kontroversial.', de: 'Thinner and more waterproof, but controversial.' }),
    F('ft_spatial_audio', 'audio', 2019, 'Audio Spasial', 'Spatial Audio', 6, { usability: 3, quality: 2 },
        { research: 'ft_spatial', novelty: [2, 0.02], ref: 'Dolby Atmos di ponsel (2019+)',
          d: 'Suara surround 3D dari speaker dan earphone.', de: '3D surround sound from speakers and earphones.' }),

    // ==================== KAMERA LANJUTAN ====================
    F('ft_front_cam', 'camera_ex', 2005, 'Kamera Depan', 'Front Camera', 3, { camera: 4, usability: 2 },
        { research: 'ft_front_cam', ref: 'Nokia 6680 (2005)',
          d: 'Panggilan video dan swafoto.', de: 'Video calls and selfies.' }),
    F('ft_video_4k', 'camera_ex', 2014, 'Video 4K', '4K Video', 6, { camera: 5 },
        { research: 'ft_video_4k', ref: 'Galaxy Note 3 (2013) / Galaxy S5 (2014)',
          d: 'Rekam video resolusi ultra tinggi.', de: 'Record ultra-high-resolution video.' }),
    F('ft_night_mode', 'camera_ex', 2018, 'Mode Malam', 'Night Mode', 5, { camera: 8 },
        { research: 'ft_night_mode', novelty: [3, 0.04], ref: 'Pixel 3 Night Sight (2018)',
          d: 'Foto terang di cahaya minim lewat fotografi komputasional.', de: 'Bright low-light photos via computational photography.' }),
    F('ft_periscope', 'camera_ex', 2019, 'Zoom Periskop', 'Periscope Zoom', 14, { camera: 7, design: -1 },
        { research: 'ft_periscope', novelty: [3, 0.03], ref: 'Huawei P30 Pro (2019)',
          d: 'Zoom optik jauh dengan lensa tersusun menyamping.', de: 'Long optical zoom with a sideways lens stack.' }),
    F('ft_video_8k', 'camera_ex', 2020, 'Video 8K', '8K Video', 10, { camera: 4 },
        { research: 'ft_video_8k', novelty: [2, 0.02], ref: 'Galaxy S20 (2020)',
          d: 'Video resolusi tertinggi, butuh chip kuat.', de: 'Top-resolution video, needs a strong chip.' }),
    F('ft_lidar', 'camera_ex', 2020, 'Pemindai LiDAR', 'LiDAR Scanner', 12, { camera: 4, usability: 1 },
        { research: 'ft_lidar', novelty: [2, 0.02], ref: 'iPhone 12 Pro (2020)',
          d: 'Fokus kilat di gelap dan pemindaian ruang 3D.', de: 'Instant low-light focus and 3D room scanning.' }),
    F('ft_udc', 'camera_ex', 2020, 'Kamera Bawah Layar', 'Under-Display Camera', 20, { design: 6, camera: -3 },
        { research: 'ft_udc', novelty: [2, 0.03], ref: 'ZTE Axon 20 5G (2020)',
          d: 'Layar penuh tanpa lubang, kualitas foto depan turun.', de: 'Uninterrupted display, lower selfie quality.' }),

    // ==================== KETAHANAN ====================
    F('ft_rugged', 'durability', 2008, 'Bodi Militer (Rugged)', 'Rugged Body', 10, { quality: 8, design: -6 },
        { region: { rest: 1.05 }, ref: 'Motorola Defy (2010)',
          d: 'Tahan jatuh, debu, dan air. Tebal dan kurang modis.', de: 'Survives drops, dust and water. Bulky and unfashionable.' }),
    F('ft_gorilla', 'durability', 2008, 'Kaca Tahan Gores', 'Scratch-Resistant Glass', 3, { quality: 5 },
        { research: 'ft_gorilla', ref: 'Gorilla Glass (2008)',
          d: 'Layar lebih tahan goresan dan benturan.', de: 'A display that resists scratches and knocks.' }),
    F('ft_ip_splash', 'durability', 2013, 'Tahan Cipratan (IP57)', 'Splash Resistant (IP57)', 6, { quality: 5 },
        { research: 'ft_waterproof', excl: 'ip', region: { asia: 1.06 }, ref: 'Xperia Z (2013)',
          d: 'Aman dari hujan dan cipratan.', de: 'Safe from rain and splashes.' }),
    F('ft_ip68', 'durability', 2016, 'Tahan Air (IP68)', 'Waterproof (IP68)', 12, { quality: 8, design: 1 },
        { research: 'ft_waterproof2', excl: 'ip', novelty: [2, 0.03], region: { asia: 1.06 }, ref: 'Galaxy S7 (2016)',
          d: 'Tahan terendam hingga satu setengah meter.', de: 'Survives submersion up to 1.5 m.' }),

    // ==================== DAYA ====================
    F('ft_removable_battery', 'power', 2000, 'Baterai Bisa Dilepas', 'Removable Battery', 2, { usability: 4, battery: 3, design: -3 },
        { maxYear: 2016, region: { asia: 1.04, rest: 1.05 }, ref: 'Hampir semua ponsel era 2000-an',
          d: 'Ganti baterai sendiri. Bodi jadi lebih tebal.', de: 'Swap the battery yourself. Makes the body thicker.' }),
    F('ft_reverse_charge', 'power', 2018, 'Pengisian Nirkabel Balik', 'Reverse Wireless Charging', 6, { battery: 3, usability: 2 },
        { research: 'ft_reverse_charge', novelty: [2, 0.02], ref: 'Huawei Mate 20 Pro (2018)',
          d: 'Ponsel bisa mengisi earbud atau ponsel lain.', de: 'The phone can charge earbuds or other phones.' }),
    F('ft_magcharge', 'power', 2020, 'Pengisian Magnetik', 'Magnetic Charging', 5, { usability: 3, design: 2 },
        { research: 'ft_magcharge', novelty: [2, 0.02], ref: 'iPhone 12 MagSafe (2020)',
          d: 'Magnet menjaga pengisi dan aksesori tetap pas.', de: 'Magnets keep chargers and accessories aligned.' }),

    // ==================== SENSOR ====================
    F('ft_accel', 'sensor', 2006, 'Akselerometer', 'Accelerometer', 2, { usability: 3 },
        { research: 'ft_sensors1', ref: 'Nokia 5500 (2006)',
          d: 'Layar berputar otomatis dan kontrol gerak.', de: 'Auto-rotate and motion controls.' }),
    F('ft_gyro_compass', 'sensor', 2010, 'Giroskop & Kompas', 'Gyroscope & Compass', 3, { usability: 3, quality: 1 },
        { research: 'ft_sensors2', ref: 'iPhone 4 (2010)',
          d: 'Orientasi presisi untuk game dan peta.', de: 'Precise orientation for games and maps.' }),
    F('ft_health_sensor', 'sensor', 2014, 'Sensor Kesehatan', 'Health Sensors', 5, { usability: 2, quality: 2 },
        { research: 'ft_health', novelty: [2, 0.02], region: { europe: 1.04 }, ref: 'Galaxy S5 (2014)',
          d: 'Detak jantung dan kadar oksigen darah.', de: 'Heart rate and blood oxygen.' }),

    // ==================== PENGALAMAN ====================
    F('ft_voice_assistant', 'ux', 2011, 'Asisten Suara', 'Voice Assistant', 3, { usability: 4 },
        { research: 'ft_voice', novelty: [2, 0.03], ref: 'Siri / iPhone 4S (2011)',
          d: 'Perintah suara untuk pesan, alarm, dan pencarian.', de: 'Voice commands for messages, alarms and search.' }),
    F('ft_stylus', 'ux', 2011, 'Stylus', 'Stylus', 10, { usability: 5, design: 1 },
        { research: 'ft_stylus', region: { asia: 1.05 }, ref: 'Galaxy Note (2011)',
          d: 'Menulis dan menggambar langsung di layar.', de: 'Write and draw right on the screen.' }),
    F('ft_haptics', 'ux', 2015, 'Mesin Getar Presisi', 'Precision Haptics', 5, { usability: 3 },
        { research: 'ft_haptics', ref: 'iPhone 6s Taptic Engine (2015)',
          d: 'Getaran halus yang terasa seperti tombol.', de: 'Fine vibrations that feel like real buttons.' }),
    F('ft_aod', 'ux', 2016, 'Layar Selalu Menyala', 'Always-On Display', 3, { usability: 3, battery: -1 },
        { research: 'ft_aod', ref: 'Galaxy S7 (2016)',
          d: 'Jam dan notifikasi tetap terlihat saat layar mati.', de: 'Clock and notifications visible while locked.' }),

    // ==================== AI ====================
    F('ft_ai_camera', 'ai', 2018, 'Kamera AI', 'AI Camera', 4, { camera: 5, performance: 2 },
        { research: 'ft_ai_features', novelty: [2, 0.03], ref: 'Huawei P20 Pro (2018)',
          d: 'Pengenalan adegan dan penyempurnaan foto otomatis.', de: 'Scene recognition and automatic photo enhancement.' }),
    F('ft_gen_ai', 'ai', 2023, 'AI Generatif di Perangkat', 'On-Device Generative AI', 12, { usability: 7, performance: 3 },
        { research: 'ft_gen_ai', novelty: [3, 0.06], region: { asia: 1.04, europe: 1.04, rest: 1.04 }, ref: 'Galaxy S24 / Pixel 8 (2023-24)',
          d: 'Ringkas, tulis, dan edit foto dengan AI tanpa internet.', de: 'Summarize, write and edit photos with AI, offline.' }),
    F('ft_live_translate', 'ai', 2024, 'Terjemahan Langsung', 'Live Translate', 4, { usability: 4 },
        { research: 'ft_live_translate', novelty: [2, 0.03], region: { asia: 1.05, rest: 1.05 }, ref: 'Galaxy AI Live Translate (2024)',
          d: 'Terjemahan panggilan dan percakapan secara langsung.', de: 'Real-time translation of calls and conversations.' }),

    // ==================== PENYIMPANAN ====================
    // Pilih satu tingkat. Dibandingkan dengan standar tahun itu (lihat getExpectedStorageGB).
    F('ft_sdcard', 'storage', 2004, 'Slot Kartu microSD', 'microSD Card Slot', 2, { usability: 4 },
        { research: 'ft_sdcard', region: { asia: 1.04, rest: 1.05 }, ref: 'Motorola E398 (2004)',
          d: 'Perluas penyimpanan dengan kartu memori.', de: 'Expand storage with a memory card.' }),
    F('ft_stor_16mb', 'storage', 2000, 'Memori 16 MB', '16 MB Storage', 1, { usability: 1 },
        { excl: 'storage_tier', storageGB: 0.016, ref: 'Nokia 3310 (2000)', d: 'Cukup untuk kontak dan SMS.', de: 'Enough for contacts and texts.' }),
    F('ft_stor_128mb', 'storage', 2004, 'Memori 128 MB', '128 MB Storage', 2, { usability: 2 },
        { excl: 'storage_tier', storageGB: 0.128, ref: 'Nokia 6230 (2003)', d: 'Nada dering, game Java, dan foto kecil.', de: 'Ringtones, Java games and small photos.' }),
    F('ft_stor_1gb', 'storage', 2006, 'Memori 1 GB', '1 GB Storage', 3, { usability: 3 },
        { research: 'ft_storage_nand', excl: 'storage_tier', storageGB: 1, ref: 'Nokia N95 (2007)', d: 'Memori flash NAND untuk musik dan foto.', de: 'NAND flash for music and photos.' }),
    F('ft_stor_8gb', 'storage', 2008, 'Memori 8 GB', '8 GB Storage', 5, { usability: 4 },
        { research: 'ft_storage_nand', excl: 'storage_tier', storageGB: 8, ref: 'iPhone 3G (2008)', d: 'Cukup untuk aplikasi dan koleksi musik.', de: 'Room for apps and a music library.' }),
    F('ft_stor_16gb', 'storage', 2010, 'Memori 16 GB', '16 GB Storage', 7, { usability: 5 },
        { research: 'ft_storage_nand', excl: 'storage_tier', storageGB: 16, ref: 'iPhone 4 (2010)', d: 'Standar ponsel pintar awal 2010-an.', de: 'The early-2010s smartphone standard.' }),
    F('ft_stor_32gb', 'storage', 2012, 'Memori 32 GB', '32 GB Storage', 9, { usability: 5 },
        { research: 'ft_storage_nand', excl: 'storage_tier', storageGB: 32, ref: 'Galaxy S3 (2012)', d: 'Lega untuk video HD dan banyak game.', de: 'Roomy for HD video and many games.' }),
    F('ft_stor_64gb', 'storage', 2015, 'Memori 64 GB', '64 GB Storage', 12, { usability: 6 },
        { research: 'ft_storage_ufs', excl: 'storage_tier', storageGB: 64, ref: 'iPhone 6s (2015)', d: 'Penyimpanan UFS yang cepat.', de: 'Fast UFS storage.' }),
    F('ft_stor_128gb', 'storage', 2016, 'Memori 128 GB', '128 GB Storage', 15, { usability: 6 },
        { research: 'ft_storage_ufs', excl: 'storage_tier', storageGB: 128, ref: 'iPhone 7 (2016)', d: 'Cukup untuk video 4K.', de: 'Enough for 4K video.' }),
    F('ft_stor_256gb', 'storage', 2019, 'Memori 256 GB', '256 GB Storage', 21, { usability: 7 },
        { research: 'ft_storage_ufs3', excl: 'storage_tier', storageGB: 256, ref: 'Galaxy S10+ (2019)', d: 'Untuk foto RAW dan game besar.', de: 'For RAW photos and big games.' }),
    F('ft_stor_512gb', 'storage', 2021, 'Memori 512 GB', '512 GB Storage', 32, { usability: 7 },
        { research: 'ft_storage_ufs3', excl: 'storage_tier', storageGB: 512, ref: 'iPhone 13 Pro (2021)', d: 'Kelas pembuat konten.', de: 'Creator-grade capacity.' }),
    F('ft_stor_1tb', 'storage', 2023, 'Memori 1 TB', '1 TB Storage', 50, { usability: 8 },
        { research: 'ft_storage_ufs3', excl: 'storage_tier', storageGB: 1024, novelty: [2, 0.02], ref: 'iPhone 13 Pro (2021) / Galaxy S23 Ultra (2023)', d: 'Perpustakaan video 4K di saku.', de: 'A 4K video library in your pocket.' })
];

// ---------- Riset (kategori 'feature') ----------
// N(id, tier, minYear, nama, deskripsi, biaya, hari, prasyarat, fitur yang dibuka)
function N(id, tier, minYear, name, description, cost, durationDays, prerequisites, unlocksFeatures) {
    return {
        id: id, category: 'feature', tier: tier, minYear: minYear,
        name: name, description: description, cost: cost, durationDays: durationDays,
        prerequisites: prerequisites || [],
        effects: { unlocksComponents: [], unlocksFeatures: unlocksFeatures || [], statBonuses: {}, unlocksOsFeatures: [] }
    };
}

export const FEATURE_RESEARCH_NODES = [
    N('ft_bluetooth',   1, 2001, 'Bluetooth', 'Radio jarak dekat untuk headset dan transfer file.', 3000, 12, [], ['ft_bluetooth']),
    N('ft_sdcard',      2, 2004, 'Slot microSD', 'Slot kartu memori mini yang bisa dilepas.', 5000, 14, [], ['ft_sdcard']),
    N('ft_front_cam',   2, 2004, 'Kamera Depan', 'Modul kamera kedua untuk panggilan video 3G.', 9000, 22, ['cam_vga'], ['ft_front_cam']),
    N('ft_mp3',         2, 2003, 'Codec Audio Digital', 'Decoder MP3/AAC hemat daya untuk pemutar musik.', 7000, 18, [], ['ft_mp3']),
    N('ft_wifi',        2, 2004, 'Wi-Fi Seluler', 'Modul Wi-Fi 802.11 hemat daya untuk ponsel.', 9000, 22, [], ['ft_wifi']),
    N('ft_sensors1',    2, 2005, 'Sensor Gerak MEMS', 'Akselerometer mungil untuk rotasi layar dan gerakan.', 6000, 16, [], ['ft_accel']),
    N('ft_gps',         2, 2006, 'GPS Terintegrasi', 'Penerima satelit GPS dalam ukuran ponsel.', 14000, 30, [], ['ft_gps']),
    N('ft_storage_nand',2, 2006, 'Memori Flash NAND', 'Penyimpanan flash padat untuk musik dan foto.', 8000, 20, [], ['ft_stor_1gb', 'ft_stor_8gb', 'ft_stor_16gb', 'ft_stor_32gb']),
    N('ft_gorilla',     2, 2008, 'Kaca Kimia Kuat', 'Kaca aluminosilikat dengan penguatan ion.', 12000, 25, ['layar_touch_cap'], ['ft_gorilla']),
    N('ft_sensors2',    3, 2009, 'Giroskop & Magnetometer', 'Sensor orientasi enam sumbu.', 25000, 35, ['ft_sensors1'], ['ft_gyro_compass']),
    N('ft_voice',       3, 2010, 'Pengenalan Suara Awan', 'Pengenalan ucapan lewat server untuk asisten suara.', 45000, 50, ['net_hspa'], ['ft_voice_assistant']),
    N('ft_face',        3, 2011, 'Pengenalan Wajah 2D', 'Pencocokan wajah lewat kamera depan.', 30000, 40, ['ft_front_cam'], ['ft_face_2d']),
    N('ft_nfc',         3, 2010, 'NFC & Pembayaran Nirkontak', 'Chip NFC dan elemen pengaman untuk bayar.', 40000, 45, [], ['ft_nfc']),
    N('ft_stylus',      3, 2011, 'Digitizer Stylus', 'Panel pena presisi untuk menulis di layar.', 50000, 50, ['layar_touch_cap'], ['ft_stylus']),
    N('ft_fingerprint', 3, 2013, 'Sensor Sidik Jari', 'Sensor kapasitif sidik jari yang kecil dan cepat.', 55000, 55, ['layar_touch_cap'], ['ft_fp_rear']),
    N('ft_stereo',      3, 2012, 'Speaker Stereo Depan', 'Rongga akustik dan amplifier untuk suara stereo.', 40000, 45, ['ft_mp3'], ['ft_stereo']),
    N('ft_waterproof',  3, 2013, 'Segel Anti Air', 'Gasket dan nano-coating untuk IP57.', 45000, 50, [], ['ft_ip_splash']),
    N('ft_video_4k',    4, 2014, 'Perekaman Video 4K', 'Encoder video dan sensor untuk 4K.', 100000, 65, ['cam_12mp'], ['ft_video_4k']),
    N('ft_health',      4, 2014, 'Sensor Biometrik Kesehatan', 'Sensor optik detak jantung dan SpO2.', 85000, 55, ['ft_sensors2'], ['ft_health_sensor']),
    N('ft_iris',        4, 2015, 'Pemindai Iris', 'Kamera inframerah untuk pola iris.', 120000, 70, ['ft_face'], ['ft_iris']),
    N('ft_haptics',     4, 2015, 'Motor Getar Linear', 'Aktuator linear untuk umpan balik taktil.', 70000, 50, ['layar_touch_cap'], ['ft_haptics']),
    N('ft_storage_ufs', 4, 2015, 'Penyimpanan UFS', 'Flash UFS dengan antarmuka serial cepat.', 90000, 60, ['ft_storage_nand'], ['ft_stor_64gb', 'ft_stor_128gb']),
    N('ft_waterproof2', 4, 2016, 'Segel Anti Air IP68', 'Penyegelan penuh untuk terendam.', 130000, 70, ['ft_waterproof'], ['ft_ip68']),
    N('ft_secure',      4, 2016, 'Enklave Keamanan', 'Prosesor terpisah untuk kunci dan biometrik.', 90000, 60, ['chip_64bit'], ['ft_secure_chip']),
    N('ft_aod',         4, 2016, 'Layar Daya Rendah (AOD)', 'Mode piksel minimal pada panel AMOLED.', 60000, 45, ['layar_amoled'], ['ft_aod']),
    N('ft_bluetooth5',  4, 2016, 'Bluetooth 5', 'Standar jangkauan dan kecepatan lebih tinggi.', 80000, 60, ['ft_bluetooth'], ['ft_bluetooth5']),
    N('ft_face3d',      5, 2017, 'Pemindai Wajah 3D', 'Proyektor titik inframerah dan kamera kedalaman.', 260000, 95, ['ft_face', 'chip_octa'], ['ft_face_3d']),
    N('ft_fp_display',  4, 2018, 'Sidik Jari Bawah Layar', 'Sensor optik/ultrasonik di bawah panel.', 160000, 80, ['ft_fingerprint', 'layar_amoled'], ['ft_fp_display']),
    N('ft_esim',        4, 2018, 'eSIM', 'Profil operator digital pada chip tertanam.', 110000, 70, ['net_4g'], ['ft_esim']),
    N('ft_night_mode',  4, 2018, 'Fotografi Komputasional Malam', 'Penumpukan banyak bingkai untuk cahaya redup.', 140000, 75, ['cam_dual', 'chip_npu'], ['ft_night_mode']),
    N('ft_ai_features', 4, 2018, 'AI di Perangkat', 'Model pengenalan adegan yang berjalan di NPU.', 150000, 80, ['chip_npu'], ['ft_ai_camera']),
    N('ft_reverse_charge', 4, 2018, 'Pengisian Balik', 'Sirkuit dua arah untuk berbagi daya.', 90000, 55, ['bat_wireless'], ['ft_reverse_charge']),
    N('ft_periscope',   5, 2019, 'Lensa Periskop', 'Prisma dan lensa horizontal untuk zoom optik jauh.', 230000, 90, ['cam_dual'], ['ft_periscope']),
    N('ft_spatial',     4, 2019, 'Audio Spasial', 'Pemrosesan suara 3D dan pelacakan kepala.', 90000, 60, ['ft_stereo'], ['ft_spatial_audio']),
    N('ft_uwb',         5, 2019, 'Chip Ultra-Wideband', 'Radio UWB untuk jarak dan arah presisi.', 200000, 90, ['ft_bluetooth5'], ['ft_uwb']),
    N('ft_storage_ufs3',5, 2019, 'Penyimpanan UFS 3.x', 'Kecepatan baca tinggi untuk kapasitas besar.', 200000, 85, ['ft_storage_ufs'], ['ft_stor_256gb', 'ft_stor_512gb', 'ft_stor_1tb']),
    N('ft_video_8k',    5, 2020, 'Perekaman Video 8K', 'Pemrosesan gambar kelas tinggi untuk 8K.', 260000, 90, ['ft_video_4k', 'chip_5nm'], ['ft_video_8k']),
    N('ft_lidar',       5, 2020, 'Sensor LiDAR', 'Sensor waktu-tempuh cahaya untuk kedalaman.', 280000, 95, ['cam_dual'], ['ft_lidar']),
    N('ft_udc',         5, 2020, 'Kamera Bawah Layar', 'Panel transparan di atas sensor kamera.', 300000, 100, ['layar_amoled', 'cam_dual'], ['ft_udc']),
    N('ft_magcharge',   5, 2020, 'Pengisian Magnetik', 'Susunan magnet pada bodi untuk penyelarasan.', 140000, 70, ['bat_wireless'], ['ft_magcharge']),
    N('ft_satellite',   5, 2022, 'Komunikasi Satelit', 'Antena dan modem untuk pesan via satelit.', 420000, 115, ['net_5g'], ['ft_satellite']),
    N('ft_gen_ai',      5, 2023, 'AI Generatif di Perangkat', 'Model bahasa dan gambar ringkas pada NPU.', 450000, 115, ['ft_ai_features', 'chip_5nm'], ['ft_gen_ai']),
    N('ft_wifi7',       5, 2024, 'Wi-Fi 7', 'Standar Wi-Fi multi-gigabit berlatensi rendah.', 250000, 80, ['net_wifi6'], ['ft_wifi7']),
    N('ft_live_translate', 5, 2024, 'Terjemahan Waktu Nyata', 'Pipeline suara-ke-suara di perangkat.', 200000, 80, ['ft_gen_ai'], ['ft_live_translate'])
];

// ---------- Standar pasar: fitur yang "wajib ada" per tahun ----------
// Jika tidak ada satu pun fitur dari anyOf pada/ setelah tahun `year`,
// permintaan turun sebesar `weight` (naik bertahap 2 tahun) + muncul keluhan.
export const EXPECTATIONS = [
    { id: 'bluetooth',  year: 2008, weight: 0.03, anyOf: ['ft_bluetooth', 'ft_bluetooth5'], label: 'tidak ada Bluetooth', labelEn: 'no Bluetooth' },
    { id: 'wifi',       year: 2010, weight: 0.04, anyOf: ['ft_wifi'], label: 'tidak ada Wi-Fi', labelEn: 'no Wi-Fi' },
    { id: 'front_cam',  year: 2010, weight: 0.03, anyOf: ['ft_front_cam'], label: 'tidak ada kamera depan', labelEn: 'no front camera' },
    { id: 'accel',      year: 2010, weight: 0.02, anyOf: ['ft_accel'], label: 'layar tidak bisa berputar otomatis', labelEn: 'no auto-rotate' },
    { id: 'gorilla',    year: 2012, weight: 0.02, anyOf: ['ft_gorilla'], label: 'layar gampang tergores', labelEn: 'screen scratches easily' },
    { id: 'gps',        year: 2013, weight: 0.03, anyOf: ['ft_gps'], label: 'tidak ada GPS', labelEn: 'no GPS' },
    { id: 'gyro',       year: 2014, weight: 0.02, anyOf: ['ft_gyro_compass'], label: 'tidak ada giroskop dan kompas', labelEn: 'no gyroscope or compass' },
    { id: 'biometric',  year: 2016, weight: 0.05, anyOf: ['ft_fp_rear', 'ft_fp_display', 'ft_face_2d', 'ft_face_3d', 'ft_iris'], label: 'tidak ada pembuka kunci biometrik', labelEn: 'no biometric unlock' },
    { id: 'stereo',     year: 2018, weight: 0.02, anyOf: ['ft_stereo'], label: 'speaker hanya mono', labelEn: 'mono speaker only' },
    { id: 'video_4k',   year: 2018, weight: 0.02, anyOf: ['ft_video_4k', 'ft_video_8k'], label: 'tidak bisa merekam 4K', labelEn: 'no 4K recording' },
    { id: 'voice',      year: 2018, weight: 0.02, anyOf: ['ft_voice_assistant'], label: 'tidak ada asisten suara', labelEn: 'no voice assistant' },
    { id: 'ip',         year: 2018, weight: 0.03, anyOf: ['ft_ip_splash', 'ft_ip68'], label: 'tidak tahan air', labelEn: 'not water resistant' },
    { id: 'nfc',        year: 2019, weight: 0.03, anyOf: ['ft_nfc'], label: 'tidak ada NFC untuk bayar', labelEn: 'no NFC for payments' },
    { id: 'usbc',       year: 2019, weight: 0.03, anyOf: ['ft_usbc'], label: 'masih pakai colokan lama', labelEn: 'still an old charging port' },
    { id: 'haptics',    year: 2019, weight: 0.02, anyOf: ['ft_haptics'], label: 'getaran terasa murahan', labelEn: 'cheap-feeling vibration' },
    { id: 'ip68',       year: 2021, weight: 0.03, anyOf: ['ft_ip68'], label: 'belum IP68', labelEn: 'not IP68-rated' },
    { id: 'night_mode', year: 2021, weight: 0.03, anyOf: ['ft_night_mode'], label: 'foto malam buruk', labelEn: 'poor night photos' },
    { id: 'ai_camera',  year: 2022, weight: 0.03, anyOf: ['ft_ai_camera', 'ft_gen_ai'], label: 'tidak ada fitur AI', labelEn: 'no AI features' }
];

// ---------- Regulasi wilayah ----------
// Jika fitur tidak ada pada/ setelah fromYear, permintaan di wilayah tsb dikalikan demandMult.
export const REGULATIONS = [
    { id: 'eu_common_charger', region: 'europe', fromYear: 2025, requiresAnyOf: ['ft_usbc'], demandMult: 0.55,
      label: 'Regulasi Eropa: wajib USB-C', labelEn: 'EU rule: USB-C required' }
];

// ---------- Standar kapasitas penyimpanan (GB) per tahun ----------
const STORAGE_ANCHORS = [
    [2000, 0.016], [2004, 0.128], [2007, 1], [2009, 8], [2011, 16], [2013, 32],
    [2015, 32], [2016, 64], [2018, 128], [2020, 128], [2022, 256], [2026, 256]
];

export function getExpectedStorageGB(year) {
    var A = STORAGE_ANCHORS, y = Number(year) || 2000;
    if (y <= A[0][0]) return A[0][1];
    if (y >= A[A.length - 1][0]) return A[A.length - 1][1];
    for (var i = 0; i < A.length - 1; i++) {
        if (y >= A[i][0] && y <= A[i + 1][0]) {
            var t = (y - A[i][0]) / (A[i + 1][0] - A[i][0]);
            return Math.exp(Math.log(A[i][1]) + (Math.log(A[i + 1][1]) - Math.log(A[i][1])) * t);
        }
    }
    return A[A.length - 1][1];
}

// ---------- Helper ----------
export const FEATURE_STAT_CAP = { min: -10, max: 25 };   // batas total kontribusi fitur per stat
const FEATURE_MAP = {};
FEATURES.forEach(function (f) { FEATURE_MAP[f.id] = f; });

export function getFeatureById(id) { return FEATURE_MAP[id] || null; }
export function getFeaturesByGroup(groupId) { return FEATURES.filter(function (f) { return f.group === groupId; }); }
export function getFeatureName(f, lang) { return !f ? '' : (lang === 'en' ? (f.nameEn || f.name) : f.name); }
export function getFeatureDescription(f, lang) { return !f ? '' : (lang === 'en' ? (f.descriptionEn || f.description) : f.description); }

// Fitur yang bisa dipilih pada tahun tertentu dengan riset yang sudah selesai.
export function isFeatureSelectable(f, year, completedResearch) {
    if (!f) return false;
    if (year < f.minYear) return false;
    if (f.maxYear && year > f.maxYear) return false;
    if (f.requiresResearch && (completedResearch || []).indexOf(f.requiresResearch) === -1) return false;
    return true;
}

export function getAvailableFeatures(year, completedResearch) {
    return FEATURES.filter(function (f) { return isFeatureSelectable(f, year, completedResearch); });
}

// Validasi pilihan fitur pada desain. Mengembalikan { ok, reason }.
export function validateFeatureSelection(featureIds, year, completedResearch) {
    var ids = featureIds || [];
    var seenExcl = {};
    var seen = {};
    for (var i = 0; i < ids.length; i++) {
        var f = FEATURE_MAP[ids[i]];
        if (!f) return { ok: false, reason: 'Fitur tidak dikenal: ' + ids[i] };
        if (seen[f.id]) return { ok: false, reason: 'Fitur ganda: ' + f.name };
        seen[f.id] = true;
        if (!isFeatureSelectable(f, year, completedResearch)) return { ok: false, reason: 'Fitur belum tersedia: ' + f.name };
        if (f.exclusiveGroup) {
            if (seenExcl[f.exclusiveGroup]) return { ok: false, reason: 'Pilih salah satu: ' + f.name + ' bentrok dengan ' + seenExcl[f.exclusiveGroup] };
            seenExcl[f.exclusiveGroup] = f.name;
        }
    }
    return { ok: true, reason: '' };
}

// Total tambahan stat dari fitur (sudah dibatasi).
export function getFeatureStats(featureIds) {
    var sum = {};
    (featureIds || []).forEach(function (id) {
        var f = FEATURE_MAP[id];
        if (!f) return;
        for (var k in f.stats) sum[k] = (sum[k] || 0) + f.stats[k];
    });
    for (var s in sum) sum[s] = Math.max(FEATURE_STAT_CAP.min, Math.min(FEATURE_STAT_CAP.max, sum[s]));
    return sum;
}

export function getFeatureUnitCost(featureIds) {
    var cost = 0;
    (featureIds || []).forEach(function (id) {
        var f = FEATURE_MAP[id];
        if (f) cost += f.costPerUnit;
    });
    return cost;
}

function _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ------------------------------------------------------------
// ANALISIS UTAMA — dipakai estimasi permintaan, ulasan, dan advisor.
// featureIds = null/undefined  -> netral (produk lama), factor = 1.
// Mengembalikan:
//   factor        pengali permintaan global (sudah memperhitungkan bobot wilayah)
//   base          pengali sebelum efek wilayah
//   regionFactors { asia, europe, rest }
//   bonuses       [{ id, name, nameEn, value }]       -> bahan ulasan pujian
//   penalties     [{ id, label, labelEn, value }]     -> bahan ulasan keluhan
//   regulations   [{ id, region, label, labelEn }]    -> regulasi yang dilanggar
//   storage       { gb, expectedGb } atau null
// ------------------------------------------------------------
export function getFeatureAnalysis(featureIds, year) {
    var neutral = {
        factor: 1, base: 1, regionFactors: { asia: 1, europe: 1, rest: 1 },
        bonuses: [], penalties: [], regulations: [], storage: null
    };
    if (!Array.isArray(featureIds)) return neutral;

    var y = Number(year) || 2000;
    var owned = {};
    featureIds.forEach(function (id) { owned[id] = true; });

    var bonuses = [], penalties = [], regulations = [];
    var bonusSum = 0, penaltySum = 0;

    // 1) Hype fitur baru (turun linear) — nilai negatif = kontroversi.
    featureIds.forEach(function (id) {
        var f = FEATURE_MAP[id];
        if (!f || !f.novelty) return;
        var age = y - f.minYear;
        if (age < 0 || age >= f.novelty.years) return;
        var v = f.novelty.bonus * (1 - age / f.novelty.years);
        if (v >= 0) { bonusSum += v; bonuses.push({ id: id, name: f.name, nameEn: f.nameEn, value: v }); }
        else { penaltySum += -v; penalties.push({ id: id, label: f.name + ' menuai kontroversi', labelEn: f.nameEn + ' is controversial', value: -v }); }
    });
    bonusSum = Math.min(0.20, bonusSum);

    // 2) Fitur standar yang tidak ada.
    EXPECTATIONS.forEach(function (e) {
        if (y < e.year) return;
        if (e.anyOf.some(function (id) { return owned[id]; })) return;
        var ramp = Math.min(1, (y - e.year + 1) / 2);
        var v = e.weight * ramp;
        penaltySum += v;
        penalties.push({ id: e.id, label: e.label, labelEn: e.labelEn, value: v });
    });

    // 3) Penyimpanan vs standar tahun itu.
    var storage = null, storageDelta = 0;
    var tierId = featureIds.filter(function (id) { return FEATURE_MAP[id] && FEATURE_MAP[id].storageGB; })[0];
    var gb = tierId ? FEATURE_MAP[tierId].storageGB : 0.004;
    var expectedGb = getExpectedStorageGB(y);
    storage = { gb: gb, expectedGb: expectedGb };
    var ratio = gb / expectedGb;
    if (ratio < 1) {
        var sp = Math.min(0.15, (1 - ratio) * 0.12);
        storageDelta = -sp;
        penalties.push({ id: 'storage', label: 'memori internal terlalu kecil', labelEn: 'internal storage is too small', value: sp });
    } else {
        var sb = Math.min(0.06, Math.log(ratio) / Math.LN2 * 0.02);
        storageDelta = sb;
        if (sb > 0) bonuses.push({ id: 'storage', name: 'Memori lega', nameEn: 'Generous storage', value: sb });
    }

    penaltySum = Math.min(0.30, penaltySum);
    var base = _clamp(1 + bonusSum - penaltySum + storageDelta, 0.6, 1.25);

    // 4) Pengaruh per wilayah + regulasi.
    var regionFactors = { asia: 1, europe: 1, rest: 1 };
    featureIds.forEach(function (id) {
        var f = FEATURE_MAP[id];
        if (!f || !f.regionDemand) return;
        for (var r in f.regionDemand) {
            if (regionFactors[r] !== undefined) regionFactors[r] *= f.regionDemand[r];
        }
    });
    for (var r2 in regionFactors) regionFactors[r2] = _clamp(regionFactors[r2], 0.9, 1.2);

    REGULATIONS.forEach(function (rg) {
        if (y < rg.fromYear) return;
        if (rg.requiresAnyOf.some(function (id) { return owned[id]; })) return;
        if (regionFactors[rg.region] !== undefined) regionFactors[rg.region] *= rg.demandMult;
        regulations.push({ id: rg.id, region: rg.region, label: rg.label, labelEn: rg.labelEn });
    });

    var w = getRegionWeights(y) || {};
    var wa = Number(w.asia) || 0, we = Number(w.europe) || 0;
    var wr = Number(w.rest);
    if (!isFinite(wr) || w.rest === undefined) wr = Math.max(0, 1 - wa - we);
    var wsum = (wa + we + wr) || 1;
    var regional = (wa * regionFactors.asia + we * regionFactors.europe + wr * regionFactors.rest) / wsum;

    return {
        factor: base * regional, base: base, regionFactors: regionFactors,
        bonuses: bonuses, penalties: penalties, regulations: regulations, storage: storage
    };
}

// Memeriksa data: ID unik, riset valid, tidak ada siklus prasyarat internal.
// existingNodeIds = Set/array id node dari RESEARCH_NODES utama (untuk prasyarat lintas kategori).
export function validateFeatureData(existingNodeIds) {
    var issues = [];
    var known = {};
    (existingNodeIds ? Array.from(existingNodeIds) : []).forEach(function (id) { known[id] = true; });
    var nodeIds = {};
    FEATURE_RESEARCH_NODES.forEach(function (n) {
        if (nodeIds[n.id] || known[n.id]) issues.push('ID node duplikat: ' + n.id);
        nodeIds[n.id] = n;
    });
    var featIds = {};
    FEATURES.forEach(function (f) {
        if (featIds[f.id]) issues.push('ID fitur duplikat: ' + f.id);
        featIds[f.id] = true;
        if (f.requiresResearch && !nodeIds[f.requiresResearch] && !known[f.requiresResearch]) issues.push('Fitur ' + f.id + ' butuh riset tidak ada: ' + f.requiresResearch);
        if (f.requiresResearch && nodeIds[f.requiresResearch]) {
            var nd = nodeIds[f.requiresResearch];
            if (nd.minYear > f.minYear) issues.push('Fitur ' + f.id + ' (' + f.minYear + ') lebih awal dari riset ' + nd.id + ' (' + nd.minYear + ')');
            if (nd.effects.unlocksFeatures.indexOf(f.id) === -1) issues.push('Riset ' + nd.id + ' tidak membuka ' + f.id);
        }
    });
    FEATURE_RESEARCH_NODES.forEach(function (n) {
        n.prerequisites.forEach(function (p) { if (!nodeIds[p] && !known[p]) issues.push('Node ' + n.id + ' prasyarat tidak ada: ' + p); });
        n.effects.unlocksFeatures.forEach(function (fid) { if (!featIds[fid]) issues.push('Node ' + n.id + ' membuka fitur tidak ada: ' + fid); });
    });
    var mark = {};
    function visit(id, path) {
        if (mark[id] === 1) { issues.push('Siklus: ' + path.concat(id).join(' -> ')); return; }
        if (mark[id] === 2) return;
        mark[id] = 1;
        var n = nodeIds[id];
        if (n) n.prerequisites.forEach(function (p) { visit(p, path.concat(id)); });
        mark[id] = 2;
    }
    FEATURE_RESEARCH_NODES.forEach(function (n) { visit(n.id, []); });
    EXPECTATIONS.forEach(function (e) {
        e.anyOf.forEach(function (id) { if (!featIds[id]) issues.push('Ekspektasi ' + e.id + ' merujuk fitur tidak ada: ' + id); });
    });
    REGULATIONS.forEach(function (r) {
        r.requiresAnyOf.forEach(function (id) { if (!featIds[id]) issues.push('Regulasi ' + r.id + ' merujuk fitur tidak ada: ' + id); });
    });
    return issues;
}
