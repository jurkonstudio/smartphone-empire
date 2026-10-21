diff -ruN smartphone-empire-main/src/data/future-panels.data.js ../fixed-tree/src/data/future-panels.data.js
--- a/src/data/future-panels.data.js	2026-10-21 16:18:17.000000000 +0700
+++ b/src/data/future-panels.data.js	2026-10-21 16:47:32.950169477 +0700
@@ -64,18 +64,18 @@
 // Mengembalikan { unlocked, reason } untuk satu panel.
 // data = state.data (berisi time.currentYear dan research.completed).
 export function getFutureUnlockState(panel, data) {
-    if (!panel) return { unlocked: false, reason: 'Panel tidak dikenal.' };
+    if (!panel) return { unlocked: false, reason: 'Panel tidak dikenal.', reasonKey: 'future.reason.unknown' };
     var u = panel.unlock || {};
-    if (!u.enabled) return { unlocked: false, reason: 'Segera hadir. Belum terhubung ke sistem game.' };
+    if (!u.enabled) return { unlocked: false, reason: 'Segera hadir. Belum terhubung ke sistem game.', reasonKey: 'future.reason.soon' };
 
     var year = (data && data.time && data.time.currentYear) || 0;
     if (typeof u.year === 'number' && year < u.year) {
-        return { unlocked: false, reason: 'Tersedia mulai ' + u.year + '.' };
+        return { unlocked: false, reason: 'Tersedia mulai ' + u.year + '.', reasonKey: 'future.reason.year', reasonVars: { y: u.year } };
     }
     if (u.research) {
         var done = (data && data.research && data.research.completed) || [];
         if (done.indexOf(u.research) === -1) {
-            return { unlocked: false, reason: 'Butuh riset: ' + u.research + '.' };
+            return { unlocked: false, reason: 'Butuh riset: ' + u.research + '.', reasonKey: 'future.reason.research', reasonVars: { id: u.research } };
         }
     }
     return { unlocked: true, reason: '' };
diff -ruN smartphone-empire-main/src/data/i18n/index.js ../fixed-tree/src/data/i18n/index.js
--- a/src/data/i18n/index.js	2026-10-21 16:18:17.000000000 +0700
+++ b/src/data/i18n/index.js	2026-10-21 16:47:32.952330172 +0700
@@ -13,9 +13,10 @@
 import { ONBOARDING_AUTH_I18N } from './onboarding-auth.i18n.js';
 import { TEXT_FIX_I18N } from './text-fix.i18n.js';
 import { OS_UPDATE_CARDS_I18N } from './os-update-cards.i18n.js';
+import { RESEARCH_PAGES_I18N } from './research-pages.i18n.js';
 
-const id = Object.assign({}, _id, SILICON_SPEED_I18N.id, PLAYER_PROFILE_I18N.id, NOTIFICATION_I18N.id, RESEARCH_UI_I18N.id, REGIONAL_I18N.id, OFFICE_I18N.id, UI_BATCH_I18N.id, ONBOARDING_AUTH_I18N.id, TEXT_FIX_I18N.id, OS_UPDATE_CARDS_I18N.id);
-const en = Object.assign({}, _en, SILICON_SPEED_I18N.en, PLAYER_PROFILE_I18N.en, NOTIFICATION_I18N.en, RESEARCH_UI_I18N.en, REGIONAL_I18N.en, OFFICE_I18N.en, UI_BATCH_I18N.en, ONBOARDING_AUTH_I18N.en, TEXT_FIX_I18N.en, OS_UPDATE_CARDS_I18N.en);
+const id = Object.assign({}, _id, SILICON_SPEED_I18N.id, PLAYER_PROFILE_I18N.id, NOTIFICATION_I18N.id, RESEARCH_UI_I18N.id, REGIONAL_I18N.id, OFFICE_I18N.id, UI_BATCH_I18N.id, ONBOARDING_AUTH_I18N.id, TEXT_FIX_I18N.id, OS_UPDATE_CARDS_I18N.id, RESEARCH_PAGES_I18N.id);
+const en = Object.assign({}, _en, SILICON_SPEED_I18N.en, PLAYER_PROFILE_I18N.en, NOTIFICATION_I18N.en, RESEARCH_UI_I18N.en, REGIONAL_I18N.en, OFFICE_I18N.en, UI_BATCH_I18N.en, ONBOARDING_AUTH_I18N.en, TEXT_FIX_I18N.en, OS_UPDATE_CARDS_I18N.en, RESEARCH_PAGES_I18N.en);
 
 export const DICTIONARIES = { id, en };
 
diff -ruN smartphone-empire-main/src/data/i18n/research-data.en.js ../fixed-tree/src/data/i18n/research-data.en.js
--- a/src/data/i18n/research-data.en.js	1970-01-01 07:00:00.000000000 +0700
+++ b/src/data/i18n/research-data.en.js	2026-10-21 16:47:32.955099561 +0700
@@ -0,0 +1,144 @@
+// FILE: src/data/i18n/research-data.en.js  (BARU)
+// ============================================================
+// Terjemahan English untuk data halaman Riset, Fabrikasi (Manufaktur),
+// dan Future. Data asli tetap berbahasa Indonesia; file ini hanya dipakai
+// saat bahasa aktif = English. Lihat research-localize.js untuk cara pakainya.
+//
+// Kunci = id dari research.data.js, material-plants.data.js, future-panels.data.js.
+// ============================================================
+
+export const RESEARCH_DATA_EN = {
+    categories: {
+        display: 'Display',
+        camera: 'Camera',
+        battery: 'Battery',
+        chip: 'Chip',
+        network: 'Network',
+        body: 'Body',
+        sensor: 'Sensors',
+        audio: 'Audio & Features'
+    },
+
+    // Judul dan hint jalur R&D Lanjutan (RND_TRACKS).
+    rnd: {
+        display: { title: 'Display', hint: 'Brightness, color accuracy, panel efficiency' },
+        camera:  { title: 'Camera',  hint: 'Sensor, optics, and image processing' },
+        battery: { title: 'Battery', hint: 'Cell density, fast charging, power management' },
+        chip:    { title: 'Chip',    hint: 'Efficiency, performance, and thermals' },
+        network: { title: 'Network', hint: 'Antenna, modem, and signal stability' },
+        body:    { title: 'Body',    hint: 'Materials, weight, and durability' },
+        sensor:  { title: 'Sensors', hint: 'Biometric accuracy and security features' },
+        audio:   { title: 'Audio',   hint: 'Sound quality, connectivity, and features' }
+    },
+
+    nodes: {
+        layar_mono: { name: 'Monochrome Display', description: 'Simple black-and-white display for early feature phones.' },
+        layar_color_tft: { name: 'TFT Color', description: 'The first color display with moderate power consumption.' },
+        layar_touch_res: { name: 'Resistive Touchscreen', description: 'Resistive touchscreen, common on early PDAs and phones.' },
+        layar_touch_cap: { name: 'Capacitive Multitouch', description: 'Modern capacitive touchscreen with multitouch.' },
+        layar_ips: { name: 'IPS / Retina Display', description: 'High pixel density with wide viewing angles.' },
+        layar_amoled: { name: 'AMOLED', description: 'High-contrast, power-efficient OLED panel.' },
+        layar_hfr: { name: '90/120 Hz Display', description: 'High refresh rate for smooth animations.' },
+        layar_foldable: { name: 'Foldable Display', description: 'Flexible panel for foldable phones.' },
+
+        cam_vga: { name: 'VGA Camera', description: 'The first 0.3 MP camera for phones.' },
+        cam_1mp: { name: '1 MP Camera', description: 'The first megapixel camera with better detail.' },
+        cam_2mp: { name: '2 MP Camera', description: 'Standard phone camera of the mid-2000s.' },
+        cam_5mp: { name: '5 MP Camera', description: 'High-resolution camera with autofocus.' },
+        cam_8mp: { name: '8 MP Camera', description: '8 MP camera with HD video recording.' },
+        cam_12mp: { name: '12 MP Camera', description: 'Main camera with optical image stabilization.' },
+        cam_dual: { name: 'Dual Camera', description: 'Two cameras for bokeh effects and optical zoom.' },
+        cam_48mp: { name: '48 MP Camera', description: 'Large sensor with pixel binning.' },
+        cam_var_aperture: { name: 'Variable Aperture', description: 'A lens aperture that changes to control light.' },
+        cam_periscope: { name: 'Periscope Zoom', description: 'Periscope lens for 5x-10x optical zoom without a thick body.' },
+        cam_gimbal: { name: 'Gimbal Stabilization', description: 'Micro mechanical stabilizer for super-smooth video.' },
+
+        bat_nimh: { name: 'NiMH Battery', description: 'Early-generation nickel-metal hydride battery.' },
+        bat_liion: { name: 'Li-Ion Battery', description: 'Lithium-ion battery with higher energy density.' },
+        bat_lipo: { name: 'Li-Po Battery', description: 'Flexible polymer battery for slim designs.' },
+        bat_large: { name: 'High-Capacity Battery', description: '2500+ mAh cell for modern smartphones.' },
+        bat_fast: { name: 'Fast Charging', description: 'Quick charging with a dedicated protocol.' },
+        bat_usbc: { name: 'USB Type-C Cable & Port', description: 'The new standard reversible connector for data and charging. The retail box now includes a USB Type-C cable.' },
+        bat_wireless: { name: 'Wireless Charging', description: 'Qi standard wireless charging.' },
+        bat_big5000: { name: '5000 mAh Battery', description: 'Large capacity for all-day use.' },
+        bat_sicarbon: { name: 'Silicon-Carbon (Si/C) Battery', description: 'Silicon anode for high capacity in a thin body.' },
+        bat_graphene: { name: 'Graphene Battery', description: 'Future technology with extreme energy density.' },
+        bat_wireless_50w: { name: '50W Wireless Charging', description: 'Ultra-fast wireless charging.' },
+        bat_200w: { name: '200W Super Fast Charging', description: 'Charges fully in under 10 minutes.' },
+        bat_solidstate: { name: 'Solid-State Battery', description: 'Future battery with no liquid electrolyte. Very safe and dense.' },
+
+        chip_single: { name: 'Single-core Chip', description: 'Single-core processor for basic features.' },
+        chip_dual: { name: 'Dual-core Chip', description: 'Two cores for early multitasking.' },
+        chip_quad: { name: 'Quad-core Chip', description: 'Four cores, the modern smartphone standard.' },
+        chip_64bit: { name: '64-bit Chip', description: '64-bit ARM architecture for better efficiency.' },
+        chip_octa: { name: 'Octa-core Chip', description: 'Eight cores with advanced power management.' },
+        chip_npu: { name: 'AI NPU', description: 'Neural Processing Unit for on-device AI.' },
+        chip_5nm: { name: '5nm Process', description: '5nm fabrication for high power efficiency.' },
+        chip_3nm: { name: '3nm Process', description: 'The most advanced fabrication for maximum performance.' },
+
+        net_gsm: { name: 'GSM', description: '2G cellular network for calls and SMS.' },
+        net_gprs: { name: 'GPRS', description: 'The first 2.5G packet data for phones.' },
+        net_edge: { name: 'EDGE', description: '2.75G data speed upgrade.' },
+        net_3g: { name: '3G', description: 'Third-generation cellular data and video calls.' },
+        net_hspa: { name: 'HSPA', description: '3.5G upgrade for streaming.' },
+        net_4g: { name: '4G LTE', description: 'High-speed fourth-generation network.' },
+        net_5g: { name: '5G', description: 'Fifth-generation network with low latency.' },
+        net_wifi6: { name: 'Wi-Fi 6 / eSIM', description: 'Modern connectivity with a built-in eSIM.' },
+        net_uwb: { name: 'Ultra-Wideband (UWB)', description: 'High-precision position tracking (like AirTag).' },
+        net_satellite: { name: 'Satellite SOS', description: 'Emergency messages via satellite when there is no cellular signal.' },
+
+        body_plastic: { name: 'ABS Plastic', description: 'A sturdy plastic body for early feature phones.' },
+        body_aluminum: { name: 'Anodized Aluminum', description: 'Lightweight, premium metal body.' },
+        body_glass: { name: 'Tempered Glass', description: 'Strong glass with an oleophobic coating.' },
+        body_steel: { name: 'Stainless Steel 316L', description: 'Corrosion-resistant steel. Very sturdy and luxurious.' },
+        body_ceramic: { name: 'Zirconia Ceramic', description: 'Scratch-resistant, elegant ceramic body.' },
+        body_titanium: { name: 'Grade 5 Titanium', description: 'Aerospace-grade material, light and super strong.' },
+        body_vegan_leather: { name: 'Vegan Leather', description: 'Premium synthetic leather that is non-slip and durable.' },
+        body_aramid: { name: 'Aramid Fiber', description: 'Light, strong carbon-style fiber, typical of gaming phones.' },
+
+        sensor_accel: { name: 'Accelerometer', description: 'Motion sensor for automatic screen rotation.' },
+        sensor_gyro: { name: 'Gyroscope & Compass', description: 'Precise 6-axis orientation sensor.' },
+        sensor_fp_rear: { name: 'Rear Fingerprint', description: 'Fast capacitive fingerprint sensor.' },
+        sensor_face3d: { name: 'Face ID (3D Scanner)', description: 'Face scanning with infrared dot projection.' },
+        sensor_indisplay: { name: 'In-Display Fingerprint', description: 'Hidden optical sensor beneath the screen.' },
+        sensor_lidar: { name: 'LiDAR Sensor', description: '3D depth scanner for the environment.' },
+
+        audio_jack: { name: '3.5mm Audio Jack', description: 'Standard headphone connector.' },
+        audio_bt: { name: 'Bluetooth 2.0', description: 'File transfer and wireless headsets.' },
+        audio_stereo: { name: 'Stereo Speakers', description: 'Dual left-and-right speakers.' },
+        audio_nfc: { name: 'NFC (Payments)', description: 'Short-range communication chip.' },
+        audio_esim: { name: 'eSIM', description: 'Digital SIM card with no physical card.' },
+        audio_spatial: { name: 'Spatial Audio', description: '3D surround sound with head tracking.' }
+    },
+
+    plants: {
+        battery: {
+            name: 'Battery Plant',
+            description: 'In-house Li-Ion and Li-Po cells. Lowers the battery cost of every phone you design.',
+            levels: { 1: 'Pilot Line', 2: 'Production Line', 3: 'Small Gigafactory', 4: 'Gigafactory' }
+        },
+        display: {
+            name: 'Display Plant',
+            description: 'In-house LCD, TFT, and AMOLED panels. Requires an established chip fab.',
+            levels: { 1: 'Pilot Line', 2: 'Production Line', 3: 'Large Display Fab', 4: 'Industrial Display Fab' }
+        }
+    },
+
+    future: {
+        f_ai: { name: 'F-AI', description: 'The next generation of AI models for the whole company: a sharper business advisor, design suggestions, and AI-based OS features.' },
+        dev_tools: { name: 'Developer Tools', description: 'SDK and toolkit for third-party app developers. Connects the OS to its app ecosystem.' },
+        game_engine: { name: 'Game Engine', description: 'Graphics and performance engine for games on phones. Depends on chip quality and the app ecosystem.' },
+        user_control: { name: 'User Control', description: 'Privacy settings, usage limits, and controls held by the user. Affects public opinion and the market.' }
+    },
+
+    futureSystems: {
+        advisor: 'Business Advisor',
+        os: 'OS',
+        design: 'Phone Design',
+        products: 'Products',
+        chip: 'Chip',
+        opinion: 'Public Opinion',
+        market: 'Market',
+        team: 'Team'
+    }
+};
diff -ruN smartphone-empire-main/src/data/i18n/research-localize.js ../fixed-tree/src/data/i18n/research-localize.js
--- a/src/data/i18n/research-localize.js	1970-01-01 07:00:00.000000000 +0700
+++ b/src/data/i18n/research-localize.js	2026-10-21 16:47:32.951304480 +0700
@@ -0,0 +1,68 @@
+// FILE: src/data/i18n/research-localize.js  (BARU)
+// Helper lokalisasi untuk nama & deskripsi data Riset, Fabrikasi, dan Future.
+// Bahasa Indonesia selalu memakai data asli. English memakai RESEARCH_DATA_EN
+// bila entri tersedia; jika tidak, jatuh ke data asli (tidak pernah kosong).
+import { LanguageService } from '../../core/LanguageService.js';
+import { RESEARCH_DATA_EN } from './research-data.en.js';
+
+function _isEn() {
+    try { return LanguageService.getLang() === 'en'; } catch (e) { return false; }
+}
+
+function _pick(bucket, id, field, fallback) {
+    if (!_isEn() || !id) return fallback;
+    var entry = RESEARCH_DATA_EN[bucket] && RESEARCH_DATA_EN[bucket][id];
+    // field null = entri berupa string langsung (mis. kategori).
+    var v = field == null ? entry : (entry && entry[field]);
+    return (typeof v === 'string' && v) ? v : fallback;
+}
+
+// Node riset (tech tree)
+export function nodeName(node) {
+    return node ? _pick('nodes', node.id, 'name', node.name) : '';
+}
+export function nodeDesc(node) {
+    return node ? _pick('nodes', node.id, 'description', node.description) : '';
+}
+export function nodeNameById(id, fallback) {
+    return _pick('nodes', id, 'name', fallback);
+}
+
+// Kategori riset
+export function catName(cat) {
+    return cat ? _pick('categories', cat.id, null, cat.name) : '';
+}
+
+// Jalur R&D Lanjutan. key = id kategori (display, camera, ...).
+export function rndTitle(key, fallback) {
+    var e = _isEn() && RESEARCH_DATA_EN.rnd[key];
+    return e ? e.title : fallback;
+}
+export function rndHint(key, fallback) {
+    var e = _isEn() && RESEARCH_DATA_EN.rnd[key];
+    return e ? e.hint : fallback;
+}
+
+// Pabrik komponen
+export function plantName(pt) {
+    return pt ? _pick('plants', pt.id, 'name', pt.name) : '';
+}
+export function plantDesc(pt) {
+    return pt ? _pick('plants', pt.id, 'description', pt.description) : '';
+}
+export function plantLevelName(pt, level, fallback) {
+    var e = _isEn() && pt && RESEARCH_DATA_EN.plants[pt.id] && RESEARCH_DATA_EN.plants[pt.id].levels;
+    return (e && e[level]) || fallback;
+}
+
+// Panel Future
+export function futureName(p) {
+    return p ? _pick('future', p.id, 'name', p.name) : '';
+}
+export function futureDesc(p) {
+    return p ? _pick('future', p.id, 'description', p.description) : '';
+}
+export function futureSystemLabel(key, fallback) {
+    var v = _isEn() && RESEARCH_DATA_EN.futureSystems[key];
+    return v || fallback;
+}
diff -ruN smartphone-empire-main/src/data/i18n/research-pages.i18n.js ../fixed-tree/src/data/i18n/research-pages.i18n.js
--- a/src/data/i18n/research-pages.i18n.js	1970-01-01 07:00:00.000000000 +0700
+++ b/src/data/i18n/research-pages.i18n.js	2026-10-21 16:47:32.951054931 +0700
@@ -0,0 +1,106 @@
+// FILE: src/data/i18n/research-pages.i18n.js  (BARU)
+// Kamus UI untuk sub-tab Manufaktur (pabrik komponen), Future, dan teks
+// R&D / alasan status di tab Teknologi. Teks id persis sama dengan fallback
+// Indonesia yang sebelumnya ada di kode, jadi mode Indonesia tidak berubah.
+export const RESEARCH_PAGES_I18N = {
+    id: {
+        'tnc.unlock.architecture': 'Arsitektur',
+        'tnc.unlock.node': 'Node',
+        'tnc.unlock.feature': 'Fitur',
+        'tnc.unlock.fab': 'Fab',
+        'tnc.unlock.bonus': 'Bonus',
+
+        'mf.plant.title': 'Pabrik Komponen',
+        'mf.plant.sub': 'Buat bahan baku ponsel sendiri. Setelah pabrik dibangun, harga internal otomatis dipakai di Desain ponsel.',
+        'mf.plant.total_made': 'Total dibuat',
+        'mf.plant.building': 'Sedang dibangun',
+        'mf.plant.upgrading': 'Sedang di-upgrade',
+        'mf.plant.cancel': 'Batalkan',
+        'mf.plant.not_built': 'Belum dibangun',
+        'mf.plant.days': 'hari',
+        'mf.plant.build': 'Bangun',
+        'mf.plant.capacity': 'Kapasitas',
+        'mf.plant.month': 'bulan',
+        'mf.plant.discount': 'Diskon',
+        'mf.plant.upgrade': 'Upgrade',
+        'mf.plant.producing': 'Produksi berjalan',
+        'mf.plant.none': 'Belum ada komponen yang bisa diproduksi. Selesaikan riset komponen dulu.',
+        'mf.plant.unit_cost': 'Biaya internal',
+        'mf.plant.stock': 'Stok',
+        'mf.plant.produce': 'Produksi',
+
+        'future.hero.open': 'Teknologi masa depan yang sudah terbuka.',
+        'future.hero.locked': 'Teknologi masa depan yang akan terhubung ke sistem game. Panel di bawah ini masih terkunci.',
+        'future.status.open': 'Terbuka',
+        'future.reason.unknown': 'Panel tidak dikenal.',
+        'future.reason.soon': 'Segera hadir. Belum terhubung ke sistem game.',
+        'future.reason.year': 'Tersedia mulai {y}.',
+        'future.reason.research': 'Butuh riset: {id}.',
+
+        'pl.unlock.year': 'Pabrik ini tersedia mulai {y}.',
+        'pl.unlock.fab': 'Butuh fab chip yang sudah berdiri.',
+        'pl.unlock.unknown': 'Tipe pabrik tidak dikenal.',
+
+        'rs.rnd.menuju': 'Menuju Lv {lv}',
+        'rs.rnd.upgrade': 'Upgrade Lv {lv}',
+        'rs.rnd.kas_kurang': 'Kas Kurang',
+        'rs.rnd.buy_slot': 'Beli Slot Baru',
+        'rs.rnd.bench': 'Standar Pasar',
+        'rs.rnd.reason.base': 'Selesaikan riset dasar kategori ini dulu',
+        'rs.rnd.reason.max': 'Level maksimum',
+        'rs.rnd.reason.node': 'Selesaikan riset dasar baru untuk membuka level lebih tinggi',
+        'rs.rnd.reason.year': 'Tunggu kemajuan zaman untuk level berikutnya',
+        'rs.rnd.reason.slots': 'Slot R&D penuh ({n}/{m})',
+        'rs.rnd.reason.cash': 'Uang tidak cukup (${cost})'
+    },
+    en: {
+        'tnc.unlock.architecture': 'Architecture',
+        'tnc.unlock.node': 'Node',
+        'tnc.unlock.feature': 'Feature',
+        'tnc.unlock.fab': 'Fab',
+        'tnc.unlock.bonus': 'Bonus',
+
+        'mf.plant.title': 'Component Plants',
+        'mf.plant.sub': 'Make your own phone parts. Once a plant is built, its internal price is used automatically in Phone Design.',
+        'mf.plant.total_made': 'Total made',
+        'mf.plant.building': 'Under construction',
+        'mf.plant.upgrading': 'Upgrading',
+        'mf.plant.cancel': 'Cancel',
+        'mf.plant.not_built': 'Not built',
+        'mf.plant.days': 'days',
+        'mf.plant.build': 'Build',
+        'mf.plant.capacity': 'Capacity',
+        'mf.plant.month': 'month',
+        'mf.plant.discount': 'Discount',
+        'mf.plant.upgrade': 'Upgrade',
+        'mf.plant.producing': 'Production running',
+        'mf.plant.none': 'No components can be produced yet. Finish the component research first.',
+        'mf.plant.unit_cost': 'Internal cost',
+        'mf.plant.stock': 'Stock',
+        'mf.plant.produce': 'Produce',
+
+        'future.hero.open': 'Future technologies that are already unlocked.',
+        'future.hero.locked': 'Future technologies that will connect to the game systems. The panels below are still locked.',
+        'future.status.open': 'Unlocked',
+        'future.reason.unknown': 'Unknown panel.',
+        'future.reason.soon': 'Coming soon. Not yet connected to the game systems.',
+        'future.reason.year': 'Available from {y}.',
+        'future.reason.research': 'Requires research: {id}.',
+
+        'pl.unlock.year': 'This plant is available from {y}.',
+        'pl.unlock.fab': 'Requires an established chip fab.',
+        'pl.unlock.unknown': 'Unknown plant type.',
+
+        'rs.rnd.menuju': 'Toward Lv {lv}',
+        'rs.rnd.upgrade': 'Upgrade to Lv {lv}',
+        'rs.rnd.kas_kurang': 'Not enough cash',
+        'rs.rnd.buy_slot': 'Buy New Slot',
+        'rs.rnd.bench': 'Market standard',
+        'rs.rnd.reason.base': 'Finish the basic research in this category first',
+        'rs.rnd.reason.max': 'Maximum level',
+        'rs.rnd.reason.node': 'Finish new basic research to unlock higher levels',
+        'rs.rnd.reason.year': 'Wait for the era to advance for the next level',
+        'rs.rnd.reason.slots': 'R&D slots full ({n}/{m})',
+        'rs.rnd.reason.cash': 'Not enough money (${cost})'
+    }
+};
diff -ruN smartphone-empire-main/src/main.js ../fixed-tree/src/main.js
--- a/src/main.js	2026-10-21 16:18:17.000000000 +0700
+++ b/src/main.js	2026-10-21 16:47:33.004354237 +0700
@@ -528,6 +528,9 @@
     // Menggunakan 'true' di akhir (Capture Phase) agar mencegah keyboard muncul
     document.body.addEventListener('click', function(e) {
         var chip = e.target.closest('.chip, .chip-small, [data-quick-reply]');
+        // Hanya chip quick reply yang sungguhan (opt-in lewat data-quick-reply, atau di dalam chat).
+        // Chip filter lain (Rekrut, Bursa, Riset) harus dibiarkan ke handler masing-masing.
+        if (chip && !chip.hasAttribute('data-quick-reply') && !chip.closest('[data-modal-id="advisor"], .chat-messages')) chip = null;
         if (chip) {
             e.preventDefault();
             e.stopPropagation();
diff -ruN smartphone-empire-main/src/systems/ComponentPlantSystem.js ../fixed-tree/src/systems/ComponentPlantSystem.js
--- a/src/systems/ComponentPlantSystem.js	2026-10-21 16:18:17.000000000 +0700
+++ b/src/systems/ComponentPlantSystem.js	2026-10-21 16:47:32.968797385 +0700
@@ -88,13 +88,13 @@
 
     isUnlocked(typeId) {
         const pt = getPlantTypeById(typeId);
-        if (!pt) return { ok: false, reason: 'Tipe pabrik tidak dikenal.' };
+        if (!pt) return { ok: false, reason: 'Tipe pabrik tidak dikenal.', reasonKey: 'pl.unlock.unknown' };
         const data = this.state.data;
         if ((data.time.currentYear || 0) < pt.unlockYear) {
-            return { ok: false, reason: 'Pabrik ini tersedia mulai ' + pt.unlockYear + '.' };
+            return { ok: false, reason: 'Pabrik ini tersedia mulai ' + pt.unlockYear + '.', reasonKey: 'pl.unlock.year', reasonVars: { y: pt.unlockYear } };
         }
         if (pt.requiresFab && !(data.fab && data.fab.built)) {
-            return { ok: false, reason: 'Butuh fab chip yang sudah berdiri.' };
+            return { ok: false, reason: 'Butuh fab chip yang sudah berdiri.', reasonKey: 'pl.unlock.fab' };
         }
         return { ok: true };
     }
diff -ruN smartphone-empire-main/src/systems/ResearchSystem.js ../fixed-tree/src/systems/ResearchSystem.js
--- a/src/systems/ResearchSystem.js	2026-10-21 16:18:17.000000000 +0700
+++ b/src/systems/ResearchSystem.js	2026-10-21 16:47:32.972733872 +0700
@@ -471,17 +471,17 @@
         const days = Math.min(cfg.maxDays, Math.round(cfg.baseDays * Math.pow(cfg.daysGrowth, level)));
 
         const running = data.research.refining.find(e => e.categoryId === catId) || null;
-        let status = 'available', reason = null, blocker = null;
+        let status = 'available', reason = null, blocker = null, reasonKey = null, reasonVars = null;
         if (running) { status = 'running'; }
-        else if (doneInCat < 1) { status = 'locked'; blocker = 'node'; reason = 'Selesaikan riset dasar kategori ini dulu'; }
-        else if (level >= cfg.maxLevel) { status = 'maxed'; reason = 'Level maksimum'; }
+        else if (doneInCat < 1) { status = 'locked'; blocker = 'node'; reason = 'Selesaikan riset dasar kategori ini dulu'; reasonKey = 'rs.rnd.reason.base'; }
+        else if (level >= cfg.maxLevel) { status = 'maxed'; reason = 'Level maksimum'; reasonKey = 'rs.rnd.reason.max'; }
         else if (level >= cap) {
             status = 'capped';
-            if (level >= capNodes && capNodes <= capYear) { blocker = 'node'; reason = 'Selesaikan riset dasar baru untuk membuka level lebih tinggi'; }
-            else { blocker = 'year'; reason = 'Tunggu kemajuan zaman untuk level berikutnya'; }
+            if (level >= capNodes && capNodes <= capYear) { blocker = 'node'; reason = 'Selesaikan riset dasar baru untuk membuka level lebih tinggi'; reasonKey = 'rs.rnd.reason.node'; }
+            else { blocker = 'year'; reason = 'Tunggu kemajuan zaman untuk level berikutnya'; reasonKey = 'rs.rnd.reason.year'; }
         }
-        else if (data.research.refining.length >= this.getRefineSlots()) { status = 'locked'; blocker = 'slots'; reason = 'Slot R&D penuh (' + data.research.refining.length + '/' + this.getRefineSlots() + ')'; }
-        else if (!WalletService.canAfford(cost)) { status = 'locked'; blocker = 'cash'; reason = 'Uang tidak cukup ($' + cost.toLocaleString('en-US') + ')'; }
+        else if (data.research.refining.length >= this.getRefineSlots()) { status = 'locked'; blocker = 'slots'; reason = 'Slot R&D penuh (' + data.research.refining.length + '/' + this.getRefineSlots() + ')'; reasonKey = 'rs.rnd.reason.slots'; reasonVars = { n: data.research.refining.length, m: this.getRefineSlots() }; }
+        else if (!WalletService.canAfford(cost)) { status = 'locked'; blocker = 'cash'; reason = 'Uang tidak cukup ($' + cost.toLocaleString('en-US') + ')'; reasonKey = 'rs.rnd.reason.cash'; reasonVars = { cost: cost.toLocaleString('en-US') }; }
 
         return {
             id: catId, name: track ? track.name : catId, hint: track ? track.hint : '',
@@ -489,7 +489,7 @@
             statBonus: Math.min(cfg.statCap, level * cfg.statPerLevel),
             nextStatBonus: Math.min(cfg.statCap, (level + 1) * cfg.statPerLevel),
             benchmark: this.getBenchmark(),
-            status, reason, blocker, running
+            status, reason, reasonKey, reasonVars, blocker, running
         };
     }
 
diff -ruN smartphone-empire-main/src/ui/components/TechNodeCard.js ../fixed-tree/src/ui/components/TechNodeCard.js
--- a/src/ui/components/TechNodeCard.js	2026-10-21 16:18:17.000000000 +0700
+++ b/src/ui/components/TechNodeCard.js	2026-10-21 16:47:32.980475142 +0700
@@ -2,6 +2,13 @@
 // FILE: src/ui/components/TechNodeCard.js  (REPLACE)
 import { renderIcon } from '../icons/FeatureIcons.js';
 import { t } from '../../core/LanguageService.js';
+import { nodeName, catName, rndTitle } from '../../data/i18n/research-localize.js';
+
+// Alasan status R&D: pakai terjemahan bila ada reasonKey dari ResearchSystem.
+function _rndReason(info) {
+    if (!info || !info.reason) return info ? (info.reason || '') : '';
+    return info.reasonKey ? _tf(info.reasonKey, info.reason, info.reasonVars) : info.reason;
+}
 
 
 function _tf(key, fallback, vars) {
@@ -112,13 +119,13 @@
             (opts.recommended ? ' node-recommended' : '') + '" data-node-row="' + escapeHtml(node.id) + '">' +
             '<div class="node-row-content" ' + detailAttr + '="' + escapeHtml(node.id) + '">' +
                 '<div class="node-row-head">' +
-                    '<span class="node-row-title">' + escapeHtml(node.name) + '</span>' +
+                    '<span class="node-row-title">' + escapeHtml(nodeName(node)) + '</span>' +
                     recBadge + yearBadge +
                 '</div>' +
                 '<div class="node-row-sub">' +
                     '<span class="node-row-cat">' +
                         (cat.icon ? renderIcon(cat.icon, 11) : '') +
-                        '<span>' + escapeHtml(cat.name || '') + ' · T' + (node.tier || '?') + '</span>' +
+                        '<span>' + escapeHtml(catName(cat) || '') + ' · T' + (node.tier || '?') + '</span>' +
                     '</span>' +
                     (effects ? '<span class="node-row-effects">' + effects + '</span>' : '') +
                 '</div>' +
@@ -211,7 +218,7 @@
         var pct = run.durationDays > 0 ? Math.min(100, Math.round(run.progressDays / run.durationDays * 100)) : 0;
         actionHtml = '<div class="rnd-action-box">' +
             '<div class="rnd-progress-head">' +
-                '<span>Menuju Lv ' + run.targetLevel + '</span>' +
+                '<span>' + escapeHtml(_tf('rs.rnd.menuju', 'Menuju Lv {lv}', { lv: run.targetLevel })) + '</span>' +
                 '<b data-rnd-pct="' + escapeHtml(info.id) + '">' + pct + '%</b>' +
             '</div>' +
             '<div class="rnd-bar-bg">' +
@@ -228,8 +235,8 @@
         var etaStr = (info.etaDays || '?') + 'h';
         
         var btnText = can 
-            ? '<span>' + iconUp + ' Upgrade Lv ' + (info.level + 1) + '</span><small>' + costStr + ' · ~' + etaStr + '</small>' 
-            : iconLock + ' ' + (info.reason || 'Kas Kurang');
+            ? '<span>' + iconUp + ' ' + escapeHtml(_tf('rs.rnd.upgrade', 'Upgrade Lv {lv}', { lv: info.level + 1 })) + '</span><small>' + costStr + ' · ~' + etaStr + '</small>' 
+            : iconLock + ' ' + (_rndReason(info) || _tf('rs.rnd.kas_kurang', 'Kas Kurang'));
 
         actionHtml = '<button class="' + btnCls + '" ' + btnAttr + '>' + btnText + '</button>';
     } else if (info.status === 'locked' && info.blocker === 'slots') {
@@ -247,18 +254,18 @@
                 '<div style="font-size:10px; color:var(--warn); text-align:center; font-weight:600;">Slot R&D Penuh</div>' +
                 '<button class="rnd-btn-start" style="background:' + bg + '; color:' + clr + '; border:' + brd + ';" ' +
                     (canAfford ? attr + '="buy-slot"' : 'disabled') + '>' +
-                    '<span>' + iconPlus + ' Beli Slot Baru</span>' +
+                    '<span>' + iconPlus + ' ' + _tf('rs.rnd.buy_slot', 'Beli Slot Baru') + '</span>' +
                     '<small>' + _rndMoney(slotCost) + '</small>' +
                 '</button>' +
             '</div>';
         }
     } else {
-        actionHtml = '<div class="rnd-note">' + iconLock + ' ' + escapeHtml(info.reason || 'Terkunci') + '</div>';
+        actionHtml = '<div class="rnd-note">' + iconLock + ' ' + escapeHtml(_rndReason(info) || _tf('rs.row.locked', 'Terkunci')) + '</div>';
     }
 
     return '<div class="rnd-row">' +
         '<div class="rnd-row-head">' +
-            '<div class="rnd-row-title">' + escapeHtml(info.name.replace('Penyempurnaan ', '')) + '</div>' +
+            '<div class="rnd-row-title">' + escapeHtml(rndTitle(info.id, info.name.replace('Penyempurnaan ', ''))) + '</div>' +
             '<div class="rnd-row-lv">Lv <b>' + (info.level || 0) + '</b>/' + info.cap + '</div>' +
         '</div>' +
         '<div class="rnd-row-sub">' +
@@ -267,7 +274,7 @@
         '<div class="rnd-meter">' +
             '<i class="rnd-meter-cap" style="width:' + capPct + '%"></i>' +
             '<i class="rnd-meter-fill" style="width:' + lvPct + '%"></i>' +
-            (benchPct !== null ? '<u class="rnd-meter-bench" style="left:' + benchPct + '%" title="Standar Pasar"></u>' : '') +
+            (benchPct !== null ? '<u class="rnd-meter-bench" style="left:' + benchPct + '%" title="' + escapeHtml(_tf('rs.rnd.bench', 'Standar Pasar')) + '"></u>' : '') +
         '</div>' +
         actionHtml +
     '</div>';
diff -ruN smartphone-empire-main/src/ui/panels/FuturePanel.js ../fixed-tree/src/ui/panels/FuturePanel.js
--- a/src/ui/panels/FuturePanel.js	2026-10-21 16:18:17.000000000 +0700
+++ b/src/ui/panels/FuturePanel.js	2026-10-21 16:47:32.990398962 +0700
@@ -3,6 +3,8 @@
 // Menampilkan kotak-kotak panel masa depan yang masih terkunci.
 // Datanya ada di src/data/future-panels.data.js.
 import { renderIcon } from '../icons/FeatureIcons.js';
+import { t } from '../../core/LanguageService.js';
+import { futureName, futureDesc, futureSystemLabel } from '../../data/i18n/research-localize.js';
 import {
     FUTURE_PANELS, FUTURE_SYSTEM_LABELS,
     getFutureUnlockState
@@ -33,24 +35,24 @@
     var head = '<div class="fp-hero">' +
         '<div class="fp-hero-title">' + renderIcon('sparkles', 16) + ' Future</div>' +
         '<div class="fp-hero-sub">' + esc(anyOpen
-            ? 'Teknologi masa depan yang sudah terbuka.'
-            : 'Teknologi masa depan yang akan terhubung ke sistem game. Panel di bawah ini masih terkunci.') + '</div>' +
+            ? t('future.hero.open')
+            : t('future.hero.locked')) + '</div>' +
         '</div>';
 
     var cards = FUTURE_PANELS.map(function (p) {
         var st = getFutureUnlockState(p, data);
         var links = (p.linksTo || []).map(function (k) {
-            return '<span class="fp-tag">' + esc(FUTURE_SYSTEM_LABELS[k] || k) + '</span>';
+            return '<span class="fp-tag">' + esc(futureSystemLabel(k, FUTURE_SYSTEM_LABELS[k] || k)) + '</span>';
         }).join('');
         return '<div class="fp-card ' + (st.unlocked ? 'fp-open' : 'fp-locked') + '" data-future-id="' + esc(p.id) + '">' +
             '<div class="fp-card-top">' +
                 '<div class="fp-ico">' + renderIcon(p.icon, 20) + '</div>' +
                 '<div class="fp-lock">' + renderIcon(st.unlocked ? 'check' : 'lock', 14) + '</div>' +
             '</div>' +
-            '<div class="fp-name">' + esc(p.name) + '</div>' +
-            '<div class="fp-desc">' + esc(p.description) + '</div>' +
+            '<div class="fp-name">' + esc(futureName(p)) + '</div>' +
+            '<div class="fp-desc">' + esc(futureDesc(p)) + '</div>' +
             '<div class="fp-links">' + links + '</div>' +
-            '<div class="fp-status">' + esc(st.unlocked ? 'Terbuka' : st.reason) + '</div>' +
+            '<div class="fp-status">' + esc(st.unlocked ? t('future.status.open') : (st.reasonKey ? t(st.reasonKey, st.reasonVars) : st.reason)) + '</div>' +
             '</div>';
     }).join('');
 
diff -ruN smartphone-empire-main/src/ui/panels/ManufacturePanel.js ../fixed-tree/src/ui/panels/ManufacturePanel.js
--- a/src/ui/panels/ManufacturePanel.js	2026-10-21 16:18:17.000000000 +0700
+++ b/src/ui/panels/ManufacturePanel.js	2026-10-21 16:47:32.992948454 +0700
@@ -10,6 +10,7 @@
 import { FAB_UNLOCK_YEAR, FAB_UNLOCK_CATEGORIES, FAB_MAX_EARLY_YEARS } from '../../core/ChipResearchSystem.js';
 import { renderIcon } from '../icons/FeatureIcons.js';
 import { t } from '../../core/LanguageService.js';
+import { plantName, plantDesc, plantLevelName } from '../../data/i18n/research-localize.js';
 import { PLANT_MIN_ORDER } from '../../data/material-plants.data.js';
 
 // Ukuran batch default untuk tombol "Produksi" (dibatasi kapasitas pabrik).
@@ -64,7 +65,7 @@
             esc(_tf('mf.plant.cancel', 'Batalkan')) + '</button>';
     } else if (!s.built) {
         if (!s.unlock.ok) {
-            status = s.unlock.reason;
+            status = s.unlock.reasonKey ? t(s.unlock.reasonKey, s.unlock.reasonVars) : s.unlock.reason;
         } else {
             status = _tf('mf.plant.not_built', 'Belum dibangun') + ' · ' + _money(s.nextInfo.cost) + ' · ' + s.nextInfo.durationDays + ' ' + _tf('mf.plant.days', 'hari');
             var canBuild = cash >= s.nextInfo.cost;
@@ -74,7 +75,7 @@
         }
     } else {
         var li = s.levelInfo;
-        status = 'Level ' + s.level + ' · ' + li.name + ' · ' + _tf('mf.plant.capacity', 'Kapasitas') + ' ' + _num(li.capacityMonthly) + '/' + _tf('mf.plant.month', 'bulan') +
+        status = 'Level ' + s.level + ' · ' + plantLevelName(pt, s.level, li.name) + ' · ' + _tf('mf.plant.capacity', 'Kapasitas') + ' ' + _num(li.capacityMonthly) + '/' + _tf('mf.plant.month', 'bulan') +
             ' · ' + _tf('mf.plant.discount', 'Diskon') + ' ' + Math.round(li.discount * 100) + '%';
         if (s.nextInfo) {
             var canUp = cash >= s.nextInfo.cost && !s.upgrade;
@@ -84,8 +85,8 @@
     }
 
     rows.push('<div class="mf-row"><div class="mf-ico">' + renderIcon(pt.icon || 'settings', 18) + '</div>' +
-        '<div class="mf-main"><div class="mf-name">' + esc(pt.name) + '</div>' +
-        '<div class="mf-desc">' + esc(pt.description) + '</div>' +
+        '<div class="mf-main"><div class="mf-name">' + esc(plantName(pt)) + '</div>' +
+        '<div class="mf-desc">' + esc(plantDesc(pt)) + '</div>' +
         '<div class="mf-reason">' + esc(status) + '</div></div>' +
         (action ? '<div class="mf-buy">' + action + '</div>' : '') + '</div>');
 
@@ -127,7 +128,7 @@
         });
     }
 
-    return '<div class="section-label"><span class="section-label-text">' + esc(pt.name) + '</span><span class="section-label-line"></span></div>' +
+    return '<div class="section-label"><span class="section-label-text">' + esc(plantName(pt)) + '</span><span class="section-label-line"></span></div>' +
         '<div class="mf-list">' + rows.join('') + '</div>';
 }
 
diff -ruN smartphone-empire-main/src/ui/panels/ResearchPanel.js ../fixed-tree/src/ui/panels/ResearchPanel.js
--- a/src/ui/panels/ResearchPanel.js	2026-10-21 16:18:17.000000000 +0700
+++ b/src/ui/panels/ResearchPanel.js	2026-10-21 16:47:32.997468924 +0700
@@ -15,6 +15,7 @@
 import { ToastService } from '../../core/ToastService.js';
 import { bus } from '../../core/EventBus.js';
 import { t } from '../../core/LanguageService.js';
+import { nodeName, nodeDesc, nodeNameById, catName } from '../../data/i18n/research-localize.js';
 import { renderSilResearchBlock, renderSilSlotBoost } from '../components/SilResearchBlock.js';
 import { renderSilSpeedBar } from '../components/SilSpeedBar.js';
 import { SiliconService } from '../../systems/SiliconService.js';
@@ -187,7 +188,7 @@
 
     var rows = active.map(function (e) {
         return '<div class="slot-strip-item">' +
-            '<div class="slot-strip-item-head"><span class="slot-strip-item-name">' + escapeHtml(e.name) + '</span><span class="slot-strip-item-pct" data-research-pct="' + escapeHtml(e.nodeId) + '">' + _pctOf(e) + '%</span></div>' +
+            '<div class="slot-strip-item-head"><span class="slot-strip-item-name">' + escapeHtml(nodeNameById(e.nodeId, e.name)) + '</span><span class="slot-strip-item-pct" data-research-pct="' + escapeHtml(e.nodeId) + '">' + _pctOf(e) + '%</span></div>' +
             '<div class="progress slot-strip-item-progress"><div class="progress-bar" data-research-bar="' + escapeHtml(e.nodeId) + '" style="width:' + _pctOf(e) + '%;"></div></div>' +
             '<div class="slot-strip-item-eta" data-research-eta="' + escapeHtml(e.nodeId) + '">' + _etaOf(e) + '</div>' +
             '<div class="slot-strip-item-boost">' + renderSilSlotBoost('tech', e.nodeId, SiliconService.researchFinishCost(e)) + '</div></div>';
@@ -207,7 +208,7 @@
     var chips = RESEARCH_CATEGORIES.map(function (c) {
         var b = sum.byCategory[c.id] || { done: 0, total: 0 };
         var cls = 'chip ' + (_filterCategory === c.id ? 'active' : '');
-        return '<button class="' + cls + '" data-filter-cat="' + c.id + '">' + renderIcon(c.icon, 12) + ' ' + escapeHtml(c.name) + ' <span class="rs-chip-count">' + b.done + '/' + b.total + '</span></button>';
+        return '<button class="' + cls + '" data-filter-cat="' + c.id + '">' + renderIcon(c.icon, 12) + ' ' + escapeHtml(catName(c)) + ' <span class="rs-chip-count">' + b.done + '/' + b.total + '</span></button>';
     }).join('');
 
     return '<div class="chip-bar"><button class="chip ' + (_filterCategory === 'all' ? 'active' : '') + '" data-filter-cat="all">' + t('timeline.filter.all') + ' <span class="rs-chip-count">' + sum.completed + '/' + sum.total + '</span></button>' + chips + '</div>';
@@ -234,7 +235,7 @@
 function _norm(s) { return String(s || '').toLowerCase(); }
 function _searchText(node, cat) {
     var eff = node.effects || {};
-    var parts = [node.name, node.description, cat ? cat.name : '', node.id];
+    var parts = [node.name, node.description, nodeName(node), nodeDesc(node), cat ? catName(cat) : '', node.id];
     (eff.unlocksComponents || []).forEach(function (id) { var c = getComponentById(id); parts.push(c ? c.name : id); });
     (eff.unlocksOsFeatures || []).forEach(function (id) { var f = getOsFeatureById(id); parts.push(f ? f.name : id); });
     Object.keys(eff.statBonuses || {}).forEach(function (k) { parts.push(statLabel(k)); });
@@ -307,7 +308,7 @@
     var n = rec.node; var cat = RESEARCH_CATEGORIES.find(function (c) { return c.id === n.category; }); var eta = ctx.sys.getEtaDays(n);
     var why = rec.dependents > 0 ? _tf('rs.rec.opens', 'Membuka ' + rec.dependents + ' riset lanjutan', { n: rec.dependents }) : _tf('rs.rec.cheap', 'Biaya terjangkau, cepat selesai');
     var note = ''; if (rec.blocker === 'slots') note = '<div class="rs-rec-note">' + escapeHtml(_tf('rs.rec.blocked_slots', 'Slot penuh.')) + '</div>'; else if (rec.blocker === 'cash') note = '<div class="rs-rec-note">' + escapeHtml(_tf('rs.rec.blocked_cash', 'Kas belum cukup.')) + '</div>';
-    return '<div class="rs-rec"><div class="rs-rec-ico" data-node-detail="' + escapeHtml(n.id) + '">' + (cat ? renderIcon(cat.icon, 18) : '') + '</div><div class="rs-rec-main" data-node-detail="' + escapeHtml(n.id) + '"><div class="rs-rec-kicker">' + escapeHtml(_tf('rs.rec.title', 'Rekomendasi')) + '</div><div class="rs-rec-name">' + escapeHtml(n.name) + '</div><div class="rs-rec-why">' + escapeHtml(why) + ' · ' + _money(n.cost) + ' · ~' + escapeHtml(_tf('rs.row.days', eta + ' hari', { n: eta })) + '</div>' + note + '</div><button type="button" class="rs-rec-btn' + (rec.blocker ? ' is-held' : '') + '" data-research-action="start" data-node-id="' + escapeHtml(n.id) + '">' + escapeHtml(_tf('rs.rec.start', 'Mulai')) + '</button></div>';
+    return '<div class="rs-rec"><div class="rs-rec-ico" data-node-detail="' + escapeHtml(n.id) + '">' + (cat ? renderIcon(cat.icon, 18) : '') + '</div><div class="rs-rec-main" data-node-detail="' + escapeHtml(n.id) + '"><div class="rs-rec-kicker">' + escapeHtml(_tf('rs.rec.title', 'Rekomendasi')) + '</div><div class="rs-rec-name">' + escapeHtml(nodeName(n)) + '</div><div class="rs-rec-why">' + escapeHtml(why) + ' · ' + _money(n.cost) + ' · ~' + escapeHtml(_tf('rs.row.days', eta + ' hari', { n: eta })) + '</div>' + note + '</div><button type="button" class="rs-rec-btn' + (rec.blocker ? ' is-held' : '') + '" data-research-action="start" data-node-id="' + escapeHtml(n.id) + '">' + escapeHtml(_tf('rs.rec.start', 'Mulai')) + '</button></div>';
 }
 
 function _renderNodeGroup(label, items, ctx) {
@@ -328,7 +329,7 @@
     var pct = null, eta = null;
     if (it.status === 'running') { var entry = (ctx.active || []).find(function (e) { return e.nodeId === n.id; }); if (entry) { pct = _pctOf(entry); eta = _etaOf(entry); } }
     var durLabel = null; if (ctx.speed > 1.05) durLabel = _tf('rs.row.days_eta', n.durationDays + ' hari (~' + Math.ceil(n.durationDays / ctx.speed) + ' hari efektif)', { n: n.durationDays, eta: Math.ceil(n.durationDays / ctx.speed) });
-    return renderTechNodeRow({ node: n, status: it.status, categoryInfo: cat, detailAttr: 'data-node-detail', actionAttr: 'data-research-action', progressPct: pct, progressEta: eta, reason: it.reason, blocker: it.blocker, affordable: WalletService.canAfford(n.cost), recommended: ctx.recId === n.id && (it.status === 'available' || it.blocker === 'slots' || it.blocker === 'cash'), description: (it.status === 'done' || it.status === 'running') ? '' : n.description, durationLabel: durLabel });
+    return renderTechNodeRow({ node: n, status: it.status, categoryInfo: cat, detailAttr: 'data-node-detail', actionAttr: 'data-research-action', progressPct: pct, progressEta: eta, reason: it.reason, blocker: it.blocker, affordable: WalletService.canAfford(n.cost), recommended: ctx.recId === n.id && (it.status === 'available' || it.blocker === 'slots' || it.blocker === 'cash'), description: (it.status === 'done' || it.status === 'running') ? '' : nodeDesc(n), durationLabel: durLabel });
 }
 
 let _handlersBound = false;
@@ -411,14 +412,14 @@
     (eff.unlocksOsFeatures || []).forEach(function (id) { const f = getOsFeatureById(id); chips.push('<span class="rs-tag rs-tag-os">' + escapeHtml(f ? f.name : id) + '</span>'); });
     const unlocksHtml = chips.length ? '<div class="rs-block"><div class="rs-block-title">' + escapeHtml(_tf('rs.detail.unlocks', 'Membuka akses')) + '</div><div class="rs-tags">' + chips.join('') + '</div></div>' : '';
     const prereqs = node.prerequisites || [];
-    const prereqHtml = '<div class="rs-block"><div class="rs-block-title">' + t('research.node.prereq') + '</div>' + (prereqs.length ? prereqs.map(function (p) { const pn = getNodeById(p); const ok = done.includes(p); return '<div class="rs-link ' + (ok ? 'is-ok' : 'is-todo') + '"><i>' + (ok ? '✓' : '○') + '</i><span>' + escapeHtml(pn ? pn.name : p) + '</span>' + (pn ? '<em>' + pn.minYear + '</em>' : '') + '</div>'; }).join('') : '<div class="rs-muted">' + t('research.node.prereq_none') + '</div>') + '</div>';
+    const prereqHtml = '<div class="rs-block"><div class="rs-block-title">' + t('research.node.prereq') + '</div>' + (prereqs.length ? prereqs.map(function (p) { const pn = getNodeById(p); const ok = done.includes(p); return '<div class="rs-link ' + (ok ? 'is-ok' : 'is-todo') + '"><i>' + (ok ? '✓' : '○') + '</i><span>' + escapeHtml(pn ? nodeName(pn) : p) + '</span>' + (pn ? '<em>' + pn.minYear + '</em>' : '') + '</div>'; }).join('') : '<div class="rs-muted">' + t('research.node.prereq_none') + '</div>') + '</div>';
     const deps = researchSystem.getDependents(nodeId);
-    const depHtml = '<div class="rs-block"><div class="rs-block-title">' + escapeHtml(_tf('rs.detail.opens', 'Membuka riset')) + '</div>' + (deps.length ? deps.map(function (d) { return '<div class="rs-link is-next"><i>→</i><span>' + escapeHtml(d.name) + '</span><em>' + d.minYear + '</em></div>'; }).join('') : '<div class="rs-muted">' + escapeHtml(_tf('rs.detail.opens_none', 'Ujung jalur.')) + '</div>') + '</div>';
+    const depHtml = '<div class="rs-block"><div class="rs-block-title">' + escapeHtml(_tf('rs.detail.opens', 'Membuka riset')) + '</div>' + (deps.length ? deps.map(function (d) { return '<div class="rs-link is-next"><i>→</i><span>' + escapeHtml(nodeName(d)) + '</span><em>' + d.minYear + '</em></div>'; }).join('') : '<div class="rs-muted">' + escapeHtml(_tf('rs.detail.opens_none', 'Ujung jalur.')) + '</div>') + '</div>';
     const canStart = st.status === 'available'; const held = st.status === 'locked' && (st.blocker === 'slots' || st.blocker === 'cash');
     const actionBtn = canStart ? `<button class="btn-primary" data-research-action="start" data-node-id="${escapeHtml(nodeId)}" style="width:100%;margin-top:12px;">${t('research.node.start')}</button>` : st.status === 'running' ? `<button class="btn-danger" data-research-action="cancel" data-node-id="${escapeHtml(nodeId)}" style="width:100%;margin-top:12px;">${t('research.node.cancel')}</button>` : held ? `<button class="btn-secondary" data-research-action="start" data-node-id="${escapeHtml(nodeId)}" style="width:100%;margin-top:12px;opacity:0.7;">${escapeHtml(st.reason || '')}</button>` : `<button class="btn-secondary" disabled style="width:100%;margin-top:12px;opacity:0.5;">${escapeHtml(st.status === 'done' ? _tf('rs.status.done', 'Selesai') : (st.reason || t('research.node.not_available')))}</button>`;
     const html = `
-        <div class="rs-modal-head"><span class="rs-modal-ico">${cat ? renderIcon(cat.icon, 20) : ''}</span><div class="rs-modal-titles"><div class="modal-title" style="margin:0;">${escapeHtml(node.name)}</div><div class="rs-muted">${cat ? escapeHtml(cat.name) : escapeHtml(node.category)} · T${node.tier}</div></div>${pill}</div>
-        <div class="modal-sub">${escapeHtml(node.description)}</div>${kv}${finance}${progressHtml}${bonusHtml}${unlocksHtml}${prereqHtml}${depHtml}
+        <div class="rs-modal-head"><span class="rs-modal-ico">${cat ? renderIcon(cat.icon, 20) : ''}</span><div class="rs-modal-titles"><div class="modal-title" style="margin:0;">${escapeHtml(nodeName(node))}</div><div class="rs-muted">${cat ? escapeHtml(cat.name) : escapeHtml(node.category)} · T${node.tier}</div></div>${pill}</div>
+        <div class="modal-sub">${escapeHtml(nodeDesc(node))}</div>${kv}${finance}${progressHtml}${bonusHtml}${unlocksHtml}${prereqHtml}${depHtml}
         ${st.reason && !held ? '<div class="sum-row" style="margin-top:8px;"><span>' + t('research.node.status') + '</span><b>' + escapeHtml(st.reason) + '</b></div>' : ''}
         ${renderSilResearchBlock('tech', nodeId)}${actionBtn}<button class="btn-secondary" data-modal-close style="width:100%;margin-top:8px;">${t('common.close')}</button>
     `;
