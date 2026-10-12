// FILE: src/data/components.data.js
// ============================================================
// DATA KOMPONEN PONSEL
// FIX: cam_vga minYear 2001 → 2000.
// ============================================================

export const COMPONENT_CATEGORIES = [
    { id: 'display',     name: 'Layar',    icon: '📺' },
    { id: 'camera',      name: 'Kamera',   icon: '📷' },
    { id: 'battery',     name: 'Baterai',  icon: '🔋' },
    { id: 'chip',        name: 'Chip',     icon: '🔲' },
    { id: 'network',     name: 'Jaringan', icon: '📡' },
    { id: 'body',        name: 'Bodi',     icon: '🧱' },
    { id: 'form_factor', name: 'Bentuk',   icon: '📱' }
];

export const COMPONENTS = [
    // ==================== LAYAR ====================
    { id: 'scr_mono',     category: 'display', tier: 1, minYear: 2000, name: 'Layar Monokrom',
      costPerUnit: 5,  stats: { display: 8,  quality: 5 },  requiresResearch: 'layar_mono' },
    { id: 'scr_tft',      category: 'display', tier: 1, minYear: 2001, name: 'TFT Warna',
      costPerUnit: 12, stats: { display: 18, quality: 12 }, requiresResearch: 'layar_color_tft' },
    { id: 'scr_touch_res',category: 'display', tier: 2, minYear: 2003, name: 'Touchscreen Resistif',
      costPerUnit: 22, stats: { display: 28, quality: 22 }, requiresResearch: 'layar_touch_res' },
    { id: 'scr_touch_cap',category: 'display', tier: 3, minYear: 2007, name: 'Kapasitif Multitouch',
      costPerUnit: 45, stats: { display: 48, quality: 40 }, requiresResearch: 'layar_touch_cap' },
    { id: 'scr_ips',      category: 'display', tier: 3, minYear: 2010, name: 'IPS / Retina',
      costPerUnit: 70, stats: { display: 62, quality: 58 }, requiresResearch: 'layar_ips' },
    { id: 'scr_amoled',   category: 'display', tier: 4, minYear: 2014, name: 'AMOLED',
      costPerUnit: 120, stats: { display: 78, quality: 72 }, requiresResearch: 'layar_amoled' },
    { id: 'scr_hfr',      category: 'display', tier: 4, minYear: 2017, name: 'Layar 90/120 Hz',
      costPerUnit: 165, stats: { display: 88, quality: 80 }, requiresResearch: 'layar_hfr' },
    { id: 'scr_fold',     category: 'display', tier: 5, minYear: 2019, name: 'Layar Lipat',
      costPerUnit: 300, stats: { display: 96, quality: 92 }, requiresResearch: 'layar_foldable' },

    // ==================== KAMERA ====================
    { id: 'cam_vga',      category: 'camera', tier: 1, minYear: 2000, name: 'Kamera VGA',
      costPerUnit: 6,  stats: { camera: 8,  quality: 6 },  requiresResearch: 'cam_vga' },
    { id: 'cam_1mp',      category: 'camera', tier: 1, minYear: 2003, name: 'Kamera 1 MP',
      costPerUnit: 14, stats: { camera: 18, quality: 14 }, requiresResearch: 'cam_1mp' },
    { id: 'cam_2mp',      category: 'camera', tier: 2, minYear: 2005, name: 'Kamera 2 MP',
      costPerUnit: 24, stats: { camera: 30, quality: 24 }, requiresResearch: 'cam_2mp' },
    { id: 'cam_5mp',      category: 'camera', tier: 3, minYear: 2007, name: 'Kamera 5 MP',
      costPerUnit: 48, stats: { camera: 48, quality: 42 }, requiresResearch: 'cam_5mp' },
    { id: 'cam_8mp',      category: 'camera', tier: 3, minYear: 2010, name: 'Kamera 8 MP',
      costPerUnit: 72, stats: { camera: 62, quality: 54 }, requiresResearch: 'cam_8mp' },
    { id: 'cam_12mp',     category: 'camera', tier: 4, minYear: 2013, name: 'Kamera 12 MP',
      costPerUnit: 120, stats: { camera: 78, quality: 68 }, requiresResearch: 'cam_12mp' },
    { id: 'cam_dual',     category: 'camera', tier: 4, minYear: 2016, name: 'Kamera Ganda',
      costPerUnit: 180, stats: { camera: 88, quality: 78 }, requiresResearch: 'cam_dual' },
    { id: 'cam_48mp',     category: 'camera', tier: 5, minYear: 2019, name: 'Kamera 48 MP',
      costPerUnit: 260, stats: { camera: 96, quality: 90 }, requiresResearch: 'cam_48mp' },

    // ==================== BATERAI ====================
    { id: 'bat_nimh',     category: 'battery', tier: 1, minYear: 2000, name: 'Baterai NiMH',
      costPerUnit: 4,  stats: { battery: 8,  quality: 5 },  requiresResearch: 'bat_nimh' },
    { id: 'bat_liion',    category: 'battery', tier: 1, minYear: 2000, name: 'Baterai Li-Ion',
      costPerUnit: 8,  stats: { battery: 18, quality: 12 }, requiresResearch: 'bat_liion' },
    { id: 'bat_lipo',     category: 'battery', tier: 2, minYear: 2004, name: 'Baterai Li-Po',
      costPerUnit: 18, stats: { battery: 30, quality: 22 }, requiresResearch: 'bat_lipo' },
    { id: 'bat_large',    category: 'battery', tier: 3, minYear: 2012, name: 'Baterai 2500 mAh',
      costPerUnit: 45, stats: { battery: 50, quality: 40 }, requiresResearch: 'bat_large' },
    { id: 'bat_fast',     category: 'battery', tier: 4, minYear: 2014, name: 'Fast Charging',
      costPerUnit: 90, stats: { battery: 65, quality: 58 }, requiresResearch: 'bat_fast' },
    { id: 'bat_wireless', category: 'battery', tier: 4, minYear: 2017, name: 'Wireless Charging',
      costPerUnit: 150, stats: { battery: 78, quality: 72 }, requiresResearch: 'bat_wireless' },
    { id: 'bat_5000',     category: 'battery', tier: 5, minYear: 2020, name: 'Baterai 5000 mAh',
      costPerUnit: 210, stats: { battery: 88, quality: 82 }, requiresResearch: 'bat_big5000' },
    { id: 'bat_graphene', category: 'battery', tier: 5, minYear: 2024, name: 'Baterai Graphene',
      costPerUnit: 400, stats: { battery: 100, quality: 95 }, requiresResearch: 'bat_graphene' },

    // ==================== CHIP ====================
    { id: 'chip_single',  category: 'chip', tier: 1, minYear: 2000, name: 'Chip Single-core',
      costPerUnit: 8,  stats: { performance: 8,  quality: 6 },  requiresResearch: 'chip_single' },
    { id: 'chip_dual',    category: 'chip', tier: 2, minYear: 2004, name: 'Chip Dual-core',
      costPerUnit: 22, stats: { performance: 22, quality: 18 }, requiresResearch: 'chip_dual' },
    { id: 'chip_quad',    category: 'chip', tier: 3, minYear: 2010, name: 'Chip Quad-core',
      costPerUnit: 55, stats: { performance: 45, quality: 38 }, requiresResearch: 'chip_quad' },
    { id: 'chip_64',      category: 'chip', tier: 3, minYear: 2013, name: 'Chip 64-bit',
      costPerUnit: 85, stats: { performance: 58, quality: 50 }, requiresResearch: 'chip_64bit' },
    { id: 'chip_octa',    category: 'chip', tier: 4, minYear: 2014, name: 'Chip Octa-core',
      costPerUnit: 140, stats: { performance: 72, quality: 62 }, requiresResearch: 'chip_octa' },
    { id: 'chip_npu',     category: 'chip', tier: 4, minYear: 2018, name: 'Chip dengan NPU',
      costPerUnit: 220, stats: { performance: 85, quality: 78 }, requiresResearch: 'chip_npu' },
    { id: 'chip_5nm',     category: 'chip', tier: 5, minYear: 2020, name: 'Chip 5nm',
      costPerUnit: 320, stats: { performance: 92, quality: 88 }, requiresResearch: 'chip_5nm' },
    { id: 'chip_3nm',     category: 'chip', tier: 5, minYear: 2023, name: 'Chip 3nm',
      costPerUnit: 480, stats: { performance: 100, quality: 95 }, requiresResearch: 'chip_3nm' },

    // ==================== JARINGAN ====================
    { id: 'net_gsm',      category: 'network', tier: 1, minYear: 2000, name: 'GSM',
      costPerUnit: 3,  stats: { connectivity: 8,  quality: 5 },  requiresResearch: 'net_gsm' },
    { id: 'net_gprs',     category: 'network', tier: 1, minYear: 2000, name: 'GPRS',
      costPerUnit: 5,  stats: { connectivity: 15, quality: 10 }, requiresResearch: 'net_gprs' },
    { id: 'net_edge',     category: 'network', tier: 2, minYear: 2003, name: 'EDGE',
      costPerUnit: 10, stats: { connectivity: 22, quality: 16 }, requiresResearch: 'net_edge' },
    { id: 'net_3g',       category: 'network', tier: 2, minYear: 2005, name: '3G',
      costPerUnit: 18, stats: { connectivity: 38, quality: 28 }, requiresResearch: 'net_3g' },
    { id: 'net_hspa',     category: 'network', tier: 3, minYear: 2008, name: 'HSPA',
      costPerUnit: 32, stats: { connectivity: 50, quality: 42 }, requiresResearch: 'net_hspa' },
    { id: 'net_4g',       category: 'network', tier: 3, minYear: 2012, name: '4G LTE',
      costPerUnit: 55, stats: { connectivity: 68, quality: 58 }, requiresResearch: 'net_4g' },
    { id: 'net_5g',       category: 'network', tier: 5, minYear: 2020, name: '5G',
      costPerUnit: 120, stats: { connectivity: 90, quality: 82 }, requiresResearch: 'net_5g' },
    { id: 'net_wifi6',    category: 'network', tier: 5, minYear: 2021, name: 'Wi-Fi 6 / eSIM',
      costPerUnit: 160, stats: { connectivity: 100, quality: 92 }, requiresResearch: 'net_wifi6' },

    // ==================== BODI ====================
    { id: 'body_plastic',   category: 'body', tier: 1, minYear: 2000, name: 'Plastik',
      costPerUnit: 3,   stats: { quality: 5,  design: 4 },   requiresResearch: null },
    { id: 'body_aluminum',  category: 'body', tier: 2, minYear: 2005, name: 'Aluminium',
      costPerUnit: 15,  stats: { quality: 15, design: 18 },  requiresResearch: null },
    { id: 'body_glass',     category: 'body', tier: 3, minYear: 2010, name: 'Kaca',
      costPerUnit: 30,  stats: { quality: 25, design: 32 },  requiresResearch: null },
    { id: 'body_ceramic',   category: 'body', tier: 4, minYear: 2016, name: 'Keramik',
      costPerUnit: 60,  stats: { quality: 40, design: 48 },  requiresResearch: null },
    { id: 'body_titanium',  category: 'body', tier: 5, minYear: 2020, name: 'Titanium',
      costPerUnit: 100, stats: { quality: 55, design: 62 },  requiresResearch: null },

    // ==================== FORM FACTOR ====================
    { id: 'ff_candybar',  category: 'form_factor', tier: 1, minYear: 2000, name: 'Candybar',
      costPerUnit: 0, stats: { usability: 20, design: 15 }, requiresResearch: null,
      baseDemandMultiplier: 1.0 },
    { id: 'ff_slider',    category: 'form_factor', tier: 1, minYear: 2003, name: 'Slider',
      costPerUnit: 0, stats: { usability: 25, design: 25 }, requiresResearch: null,
      baseDemandMultiplier: 1.05 },
    { id: 'ff_flip',      category: 'form_factor', tier: 2, minYear: 2004, name: 'Flip',
      costPerUnit: 0, stats: { usability: 28, design: 32 }, requiresResearch: null,
      baseDemandMultiplier: 1.08 },
    { id: 'ff_fullscreen',category: 'form_factor', tier: 3, minYear: 2008, name: 'Bar Layar Penuh',
      costPerUnit: 0, stats: { usability: 45, design: 55 }, requiresResearch: null,
      baseDemandMultiplier: 1.15 },
    { id: 'ff_bezel',     category: 'form_factor', tier: 4, minYear: 2014, name: 'Bezel-less',
      costPerUnit: 0, stats: { usability: 55, design: 68 }, requiresResearch: null,
      baseDemandMultiplier: 1.20 },
    { id: 'ff_fold',      category: 'form_factor', tier: 5, minYear: 2019, name: 'Lipat',
      costPerUnit: 0, stats: { usability: 60, design: 85 }, requiresResearch: 'layar_foldable',
      baseDemandMultiplier: 1.25 }
];

// Warna bodi
export const BODY_COLORS = [
    { id: 'color_black',    name: 'Hitam',    hex: '#1a1a1a', designBonus: 5 },
    { id: 'color_white',    name: 'Putih',    hex: '#f5f5f5', designBonus: 4 },
    { id: 'color_silver',   name: 'Silver',   hex: '#c0c0c0', designBonus: 6 },
    { id: 'color_blue',     name: 'Biru',     hex: '#2196F3', designBonus: 7 },
    { id: 'color_red',      name: 'Merah',    hex: '#e53935', designBonus: 6 },
    { id: 'color_gold',     name: 'Emas',     hex: '#ffd700', designBonus: 9 },
    { id: 'color_green',    name: 'Hijau',    hex: '#43a047', designBonus: 5 },
    { id: 'color_titanium', name: 'Titanium', hex: '#8a8a8a', designBonus: 10 }
];

// Utilitas
export function getComponentById(id) {
    return COMPONENTS.find(c => c.id === id) || null;
}
export function getComponentsByCategory(catId) {
    return COMPONENTS.filter(c => c.category === catId);
}
export function getBodyColorById(id) {
    return BODY_COLORS.find(c => c.id === id) || BODY_COLORS[0];
}
