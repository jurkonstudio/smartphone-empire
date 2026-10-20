// FILE: src/ui/phone/research-visuals.js
// ============================================================
// PEMETAAN RISET → EFEK VISUAL MOCKUP PONSEL (murni data, tanpa logika render).
//
// Setiap node di RESEARCH_NODES (research.data.js) yang berdampak visual
// punya satu entri di sini. Node yang tidak punya efek visual tetap
// didaftarkan dengan `effects: null` agar bisa diaudit (tidak ada node yang
// terlewat).
//
// Field `effects` dibaca oleh PhoneMockup.js dan OsScreenMockup.js:
//   screenTag       : gaya layar tambahan (ditumpuk di atas scr_* komponen)
//   lensCount       : jumlah minimum lensa kamera di modul
//   moduleStyle     : bentuk modul kamera ('single' | 'dual' | 'quad_bump' |
//                     'periscope_bump' | 'aperture_ring' | 'gimbal_bump')
//   batteryClass    : kelas kotak baterai ('small' | 'medium' | 'large' | 'xl')
//   charging        : indikator pengisian di kemasan ('qc' | 'qi' | 'qi_50w' | 'fast_200w')
//   port            : port di bodi ('proprietary' | 'usb_c')
//   packContents    : barang tambahan di kotak ('usb_c_cable' | 'charger_brick' | 'wireless_pad')
//   statusLabel     : teks jaringan di status bar ('2G' | '2.5G' | 'E' | '3G' | 'H+' | '4G' | '5G' | 'SOS')
//   bodyRim         : material rim ('plastic' | 'anodized_metal' | 'steel' | 'ceramic_rim' | 'titanium')
//   bodyBack        : material punggung ('glass' | 'ceramic' | 'leather' | 'aramid')
//   fingerprint     : posisi sidik jari ('rear' | 'in_display')
//   faceSensor      : sensor wajah ('notch')
//   lidar           : true bila modul LiDAR tampil
//   speakers        : tata speaker ('mono' | 'stereo' | 'spatial')
//   headphoneJack   : true bila jack 3.5mm tampil
//   simSlot         : 'esim' bila SIM fisik tidak ada
//   osIndicator     : ikon di status bar OS ('npu' | 'bluetooth' | 'nfc')
//
// Catatan:
// - bat_usbc tidak punya komponen (lihat components.data.js); efeknya hanya
//   mengaktifkan port USB-C dan kabel di kemasan.
// - Mapping notch → sensor_face3d dan Dynamic Island → chip_5nm (di
//   phone-specs.data.js) sudah dikonfirmasi user.
// ============================================================

export const RESEARCH_VISUALS = {
    // ==================== LAYAR ====================
    layar_mono:        { category: 'display', effects: { screenTag: 'monochrome' } },
    layar_color_tft:   { category: 'display', effects: { screenTag: 'color_tft' } },
    layar_touch_res:   { category: 'display', effects: { screenTag: 'resistive_touch' } },
    layar_touch_cap:   { category: 'display', effects: { screenTag: 'capacitive_touch' } },
    layar_ips:         { category: 'display', effects: { screenTag: 'ips_thin_bezel' } },
    layar_amoled:      { category: 'display', effects: { screenTag: 'amoled_rounded' } },
    layar_hfr:         { category: 'display', effects: { screenTag: 'hfr_badge' } },
    layar_foldable:    { category: 'display', effects: { screenTag: 'foldable_hinge' } },

    // ==================== KAMERA ====================
    cam_vga:           { category: 'camera', effects: { lensCount: 1, moduleStyle: 'single' } },
    cam_1mp:           { category: 'camera', effects: { lensCount: 1, moduleStyle: 'single' } },
    cam_2mp:           { category: 'camera', effects: { lensCount: 1, moduleStyle: 'single' } },
    cam_5mp:           { category: 'camera', effects: { lensCount: 1, moduleStyle: 'single' } },
    cam_8mp:           { category: 'camera', effects: { lensCount: 1, moduleStyle: 'single' } },
    cam_12mp:          { category: 'camera', effects: { lensCount: 1, moduleStyle: 'single' } },
    cam_dual:          { category: 'camera', effects: { lensCount: 2, moduleStyle: 'dual' } },
    cam_48mp:          { category: 'camera', effects: { lensCount: 1, moduleStyle: 'quad_bump' } },
    cam_var_aperture:  { category: 'camera', effects: { moduleStyle: 'aperture_ring' } },
    cam_periscope:     { category: 'camera', effects: { lensCount: 3, moduleStyle: 'periscope_bump' } },
    cam_gimbal:        { category: 'camera', effects: { moduleStyle: 'gimbal_bump' } },

    // ==================== BATERAI ====================
    bat_nimh:          { category: 'battery', effects: { batteryClass: 'small', port: 'proprietary' } },
    bat_liion:         { category: 'battery', effects: { batteryClass: 'small', port: 'proprietary' } },
    bat_lipo:          { category: 'battery', effects: { batteryClass: 'medium', port: 'proprietary' } },
    bat_large:         { category: 'battery', effects: { batteryClass: 'large', port: 'proprietary' } },
    bat_fast:          { category: 'battery', effects: { batteryClass: 'large', charging: 'qc', packContents: ['charger_brick'] } },
    bat_usbc:          { category: 'battery', effects: { port: 'usb_c', packContents: ['usb_c_cable'] } }, // tanpa komponen
    bat_wireless:      { category: 'battery', effects: { batteryClass: 'large', charging: 'qi', packContents: ['wireless_pad'] } },
    bat_big5000:       { category: 'battery', effects: { batteryClass: 'xl' } },
    bat_sicarbon:      { category: 'battery', effects: { batteryClass: 'xl' } },
    bat_graphene:      { category: 'battery', effects: { batteryClass: 'xl' } },
    bat_wireless_50w:  { category: 'battery', effects: { batteryClass: 'large', charging: 'qi_50w', packContents: ['wireless_pad'] } },
    bat_200w:          { category: 'battery', effects: { batteryClass: 'large', charging: 'fast_200w', packContents: ['charger_brick'] } },
    bat_solidstate:    { category: 'battery', effects: { batteryClass: 'xl' } },

    // ==================== CHIP ====================
    // Tidak ada efek layar. Chip AI memunculkan ikon NPU di OS.
    chip_single:       { category: 'chip', effects: null },
    chip_dual:         { category: 'chip', effects: null },
    chip_quad:         { category: 'chip', effects: null },
    chip_64bit:        { category: 'chip', effects: null },
    chip_octa:         { category: 'chip', effects: null },
    chip_npu:          { category: 'chip', effects: { osIndicator: 'npu' } },
    chip_5nm:          { category: 'chip', effects: null },
    chip_3nm:          { category: 'chip', effects: null },

    // ==================== JARINGAN ====================
    net_gsm:           { category: 'network', effects: { statusLabel: '2G' } },
    net_gprs:          { category: 'network', effects: { statusLabel: '2.5G' } },
    net_edge:          { category: 'network', effects: { statusLabel: 'E' } },
    net_3g:            { category: 'network', effects: { statusLabel: '3G' } },
    net_hspa:          { category: 'network', effects: { statusLabel: 'H+' } },
    net_4g:            { category: 'network', effects: { statusLabel: '4G' } },
    net_5g:            { category: 'network', effects: { statusLabel: '5G' } },
    net_wifi6:         { category: 'network', effects: null },
    net_uwb:           { category: 'network', effects: null },
    net_satellite:     { category: 'network', effects: { statusLabel: 'SOS' } },

    // ==================== BODI ====================
    body_plastic:      { category: 'body', effects: { bodyRim: 'plastic', bodyBack: null } },
    body_aluminum:     { category: 'body', effects: { bodyRim: 'anodized_metal' } },
    body_glass:        { category: 'body', effects: { bodyBack: 'glass' } },
    body_steel:        { category: 'body', effects: { bodyRim: 'steel' } },
    body_ceramic:      { category: 'body', effects: { bodyBack: 'ceramic' } },
    body_titanium:     { category: 'body', effects: { bodyRim: 'titanium' } },
    body_vegan_leather:{ category: 'body', effects: { bodyBack: 'leather' } },
    body_aramid:       { category: 'body', effects: { bodyBack: 'aramid' } },

    // ==================== SENSOR ====================
    sensor_accel:      { category: 'sensor', effects: null },
    sensor_gyro:       { category: 'sensor', effects: null },
    sensor_fp_rear:    { category: 'sensor', effects: { fingerprint: 'rear' } },
    sensor_face3d:     { category: 'sensor', effects: { faceSensor: 'notch' } },
    sensor_indisplay:  { category: 'sensor', effects: { fingerprint: 'in_display' } },
    sensor_lidar:      { category: 'sensor', effects: { lidar: true } },

    // ==================== AUDIO & FITUR ====================
    audio_jack:        { category: 'audio', effects: { headphoneJack: true } },
    audio_bt:          { category: 'audio', effects: { osIndicator: 'bluetooth' } },
    audio_stereo:      { category: 'audio', effects: { speakers: 'stereo' } },
    audio_nfc:         { category: 'audio', effects: { osIndicator: 'nfc' } },
    audio_esim:        { category: 'audio', effects: { simSlot: 'esim' } },
    audio_spatial:     { category: 'audio', effects: { speakers: 'spatial' } },
};

// Jumlah node yang dipetakan (untuk audit). Harus sama dengan RESEARCH_NODES.length.
export const RESEARCH_VISUALS_COUNT = Object.keys(RESEARCH_VISUALS).length;
