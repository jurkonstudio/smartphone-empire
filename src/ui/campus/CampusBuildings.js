// FILE: src/ui/campus/CampusBuildings.js
// v2027.61 — GAME-AWARE: peta kini bereaksi pada isi game, bukan hanya jumlah level.
//   • HQ memajang nama perusahaan; lampu peringatan merah saat kas negatif.
//   • Lab R&D: cincin atom berputar saat riset/chip research berjalan.
//   • Pabrik Chip: wafer di atap (berputar saat Fab produksi) + jalur produksi menyala.
//   • Pusat OS: LED server merah bila ada bug aktif; hologram berputar saat OS dikembangkan.
//   • Toko / Arena / Billboard: memajang model ponsel PRODUK TERBARU (bentuk sesuai form factor,
//     warna sesuai warna bodi, layar sesuai era). Arena menyala saat produk sedang disiapkan.
//   Logika level (RULES), SLOTS, koordinat, ID bangunan TIDAK diubah.
// v2027.60 — PREMIUM LOOK: material PBR (MeshStandardMaterial) + env map, bayangan nyata
// (shadow map statis, tier adaptif) + contact-AO, varian fasad/atap per bangunan, vertex-color AO
// pada fasad, pohon & semak instanced (1 draw call per bagian, bukan per pohon), tekstur rumput,
// variasi warna instance pada kawasan kota, pembersihan InstancedMesh saat bangunan diganti.
// Logika level (RULES/computePlan), SLOTS, koordinat, ID, dan userData TIDAK diubah.
// v2027.50 — i18n: teks tooltip describeBuilding() memakai t()/_tf; nama bangunan
// memakai ulang key campus.info.name.*. Geometri & logika level TIDAK diubah.
// v2027.38 — PETA DIPERLUAS: pulau 20x20 -> 30x30. Tambahan: Akademi Inovasi,
// Arena Peluncuran, Pelabuhan Logistik (teluk + dermaga + kapal), Ladang Angin
// (era Premium+), Monorail layang (era Smartphone Matang+), gerbang jalan,
// jalan lebih panjang, 18 blok kawasan kota, 29 pohon. Logika level lama
// (hq/lab/factory/store/os/monument/billboard) TIDAK diubah.
// v2027.52 — visual polish: palet lebih kaya, fasad berlapis, detail jendela dan jalan.
// v2027.51 — visual semi-realistic + ekspansi dunia 100x100, district instancing,
// tetap mempertahankan RULES, computePlan, DESIGN_ERAS, i18n, slot, dan level.
// v2027.37a — fasad jendela bertekstur, bayangan palsu, trotoar, lampu jalan,
// kolam, taman, pohon 3 jenis, detail unik tiap bangunan.
//
// Semua angka yang memengaruhi "kapan bangunan naik level" ada di RULES
// (di bawah). Ubah di sana kalau ingin lebih cepat / lebih lambat.
import { DESIGN_ERAS, getDesignEraForYear } from '../../data/era-design.data.js';
import { BALANCE } from '../../data/balance.data.js';
import { t } from '../../core/LanguageService.js';
import { SHADE_DIR } from './CampusLook.js';

// Ukuran dunia visual; koordinat inti lama tetap di tengah agar integrasi tidak bergeser.
export const CAMPUS_WORLD_SIZE = 100;
export const CAMPUS_WORLD_HALF = CAMPUS_WORLD_SIZE / 2;

// true  = bangunan tidak pernah turun level (puncak disimpan di state.campusPeak)
// false = level selalu mengikuti kondisi terkini (bisa turun kalau staf dipecat, dll)
export var NEVER_DOWNGRADE = true;

// Warna per tema. Warna atap (roof) diambil dari CSS variable --accent.
// night: 1 = jendela & lampu jalan menyala. sunCol = warna matahari/bulan.
export const PALETTES = {
    light: {
        grass: 0xc4e3bd, plaza: 0xf3f5fa, road: 0xbfc9d8, wall: 0xf4f7fc,
        window: 0x75aee8, trunk: 0x9b7655, leaf: 0x72bd78,
        solar: 0x315c91, metal: 0x8494a8, glow: 0x00c7ed,
        grass2: 0xaed99f, soil: 0x806b56, curb: 0xd2d9e5, water: 0x55b9e5,
        leaf2: 0x91cf87, gold: 0xf0bd4e, shade: 0x000000,
        flowerA: 0xf472b6, flowerB: 0xfacc15,
        lamp: 0xfff1c4, beacon: 0xff4d4d, halo: 0xffd98a,
        hemiSky: 0xf0f6ff, hemiGround: 0xb8c8bb, hemiI: 1.05, dirI: 0.9,
        sunCol: 0xfff1da, night: 0
    },
    dark: {
        grass: 0x203b32, plaza: 0x343e50, road: 0x252d3a, wall: 0xc0ccdc,
        window: 0x5798e8, trunk: 0x5d4939, leaf: 0x347d51,
        solar: 0x254a7a, metal: 0x78869a, glow: 0x00ddff,
        grass2: 0x2b503b, soil: 0x332a26, curb: 0x515d72, water: 0x176d9f,
        leaf2: 0x4c9b68, gold: 0xe3b348, shade: 0x000000,
        flowerA: 0xd9558f, flowerB: 0xd1a914,
        lamp: 0xfff1c4, beacon: 0xff4d4d, halo: 0xffd98a,
        hemiSky: 0x9fb0d0, hemiGround: 0x20242d, hemiI: 0.7, dirI: 0.55,
        sunCol: 0xaebfe8, night: 1
    }
};

// Warna jendela per era desain (urutan sama dengan DESIGN_ERAS).
export const ERA_WINDOWS = [
    { light: 0x9fb08a, dark: 0x6b7d56 },  // LCD monokrom (hijau)
    { light: 0x8fb4c8, dark: 0x4f7a90 },  // TFT warna
    { light: 0x7db3f0, dark: 0x3f6fb8 },  // revolusi touchscreen
    { light: 0x8fb4e8, dark: 0x4f77b8 },  // smartphone matang
    { light: 0xd7c28a, dark: 0x8a7440 },  // premium (emas)
    { light: 0x7fe3f5, dark: 0x2aa8c8 },  // AI & notch (cyan)
    { light: 0xc6a3ff, dark: 0x7a4fd0 }   // foldable (ungu)
];

// Pohon: 8 lama + 21 baru di area perluasan. Tata letak sudah dicek tidak
// menabrak slot, jalan, teluk, jalur monorail, maupun blok kota.
export const TREE_SPOTS = [
    [-7, -6], [-5.5, -7.5], [-8, 5], [-1.4, -6.6], [2.5, -5.6], [-3, -5.5],
    [4.4, -4.4], [-9.2, 8.8], [-8.0, 2.8], [-9.2, -3.2], [6.4, -8.0], [-2.0, -8.0],
    [12.4, -12.8], [13.6, 4.0], [10.0, -2.0], [5.2, -12.8], [-12.8, 11.2], [-12.8, 13.6],
    [13.6, -9.2], [-12.8, -3.2], [8.8, -12.8], [2.8, -12.8], [-2.0, -12.8], [11.2, 2.8],
    [0.4, -12.8], [-3.2, 13.6], [-11.6, 2.8], [-10.4, 7.6], [-12.8, 7.6]
];

// Kolam kecil di utara plaza (dipakai juga oleh CampusLife untuk riak air).
export var POND = { x: 0.5, z: -6, r: 1.4 };

// Teluk di tenggara (tempat Pelabuhan). Dipakai CampusLife untuk kapal.
export var BAY = { x: 11, z: 11.8, w: 7.4, d: 5.8 };

// Posisi slot bangunan (x, z). Sudah dicek tidak bertabrakan dengan HQ,
// jalan, pohon, dan satu sama lain.
export var SLOTS = {
    lab:       [-6.0, -3.6],
    factory:   [6.6, 0.6],
    store:     [-5.4, 4.2],
    os:        [4.6, 5.0],
    billboard: [2.6, 8.6],
    monument:  [-2.9, 2.9],
    academy:   [-10.5, -6.5],
    arena:     [10.8, -6.2],
    port:      [11.0, 6.8]
};
export var SLOT_ORDER = ['lab', 'factory', 'store', 'os', 'billboard', 'monument', 'academy', 'arena', 'port'];

// Ladang angin (era Premium+) dan jalur monorail (era Smartphone Matang+).
export var WIND_SPOTS = [[-11.5, -13.2], [-8.2, -13.2], [-4.8, -13.2]];
export var RAIL = { z: -10.2, x0: -13, x1: 13, y: 1.5, stationX: 7.5 };

// Kawasan kota di pinggir peta. Muncul bertahap: 1 + 1 blok per era (maks 6).
export var SPRAWL_SPOTS = [
    [5.4, 9.2], [-9.8, 3.5], [13.0, 1.6], [5.4, -6.0], [-7.9, 7.3], [11.1, -0.3]
];

// ============================================================
// i18n helper — t() dengan fallback (Indonesia) bila key belum ada.
// RULES[x].name / .unit dipertahankan sebagai fallback & kompatibilitas.
// ============================================================
function _fill(str, vars) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) {
        return (vars && Object.prototype.hasOwnProperty.call(vars, k)) ? String(vars[k]) : m;
    });
}
function _tf(key, fb, vars) {
    var v = t(key, vars);
    return (v && v !== key) ? v : _fill(fb, vars);
}
// Nama bangunan: pakai ulang key campus.info.name.<id> (sama dengan CampusInfo).
function _bName(id, fb) { return _tf('campus.info.name.' + id, fb); }
function _bUnit(id, fb) { return _tf('campus.info.unit.' + id, fb); }

// ============================================================
// ATURAN LEVEL — level = base + jumlah "steps" yang sudah terlewati.
// metric(data) membaca state game.
// ============================================================
function len(a) { return Array.isArray(a) ? a.length : 0; }

function researchMetric(d) {
    var starters = len(BALANCE && BALANCE.starterResearch);
    var done = len(d.research && d.research.completed);
    var chip = len(d.chipResearch && d.chipResearch.completed);
    return Math.max(0, done - starters) + chip;
}
function stockMetric(d) {
    var cat = d.products && d.products.catalog;
    if (!Array.isArray(cat)) return 0;
    var n = 0;
    for (var i = 0; i < cat.length; i++) n += (cat[i] && cat[i].stock) || 0;
    return n;
}
function shareMetric(d) {
    var s = (d.market && typeof d.market.share === 'number') ? d.market.share : 0;
    return s <= 1 ? s * 100 : s;   // dukung 0..1 maupun 0..100
}

export var RULES = {
    hq:        { name: 'Kantor Pusat',      max: 4, base: 1, steps: [5, 15, 30],  unit: 'staf',
                 metric: function (d) { return len(d.staff); } },
    lab:       { name: 'Lab R&D',           max: 3, base: 0, steps: [2, 8, 20],   unit: 'riset selesai',
                 metric: researchMetric },
    factory:   { name: 'Pabrik Chip',       max: 3, base: 0, steps: [1, 2, 3],    unit: 'level Fab',
                 metric: function (d) { return (d.fab && d.fab.built) ? Math.max(1, d.fab.level || 1) : 0; } },
    store:     { name: 'Toko Flagship',     max: 3, base: 0, steps: [1, 3, 6],    unit: 'produk rilis',
                 metric: function (d) { return len(d.products && d.products.catalog); } },
    os:        { name: 'Pusat OS & Server', max: 3, base: 0, steps: [1, 3, 6],    unit: 'versi OS',
                 metric: function (d) { return len(d.os && d.os.versions); } },
    monument:  { name: 'Monumen Prestasi',  max: 2, base: 0, steps: [2, 8],       unit: '% pangsa pasar',
                 metric: shareMetric },
    billboard: { name: 'Billboard Kampanye', max: 1, base: 0, steps: [1],         unit: 'kampanye aktif', live: true,
                 metric: function (d) { return len(d.marketing && d.marketing.activeCampaigns); } },
    academy:   { name: 'Akademi Inovasi',   max: 3, base: 0, steps: [8, 20, 40],  unit: 'staf',
                 metric: function (d) { return len(d.staff); } },
    arena:     { name: 'Arena Peluncuran',  max: 3, base: 0, steps: [4, 10, 20],  unit: 'produk rilis',
                 metric: function (d) { return len(d.products && d.products.catalog); } },
    port:      { name: 'Pelabuhan Logistik', max: 3, base: 0, steps: [1000, 5000, 20000], unit: 'unit stok',
                 metric: stockMetric }
};
var RULE_KEYS = Object.keys(RULES);

// Era desain minimum untuk dekorasi era (indeks DESIGN_ERAS).
export var RAIL_MIN_ERA = 3;   // Smartphone Matang
export var WIND_MIN_ERA = 4;   // Premium

function levelFor(rule, m) {
    var lv = rule.base;
    for (var i = 0; i < rule.steps.length; i++) if (m >= rule.steps[i]) lv = rule.base + i + 1;
    return Math.min(lv, rule.max);
}

// Level HQ lama (dipertahankan untuk kompatibilitas).
export function getHqLevel(data) {
    return levelFor(RULES.hq, RULES.hq.metric(data || {}));
}

// ============================================================
// PLAN — murni (tanpa THREE), mudah dites.
// ============================================================
export function computePlan(data) {
    data = data || {};
    var year = (data.time && data.time.currentYear) || 2000;
    var era = getDesignEraForYear(year);
    var eraIdx = Math.max(0, DESIGN_ERAS.indexOf(era));
    var peak = (NEVER_DOWNGRADE && data.campusPeak && typeof data.campusPeak === 'object') ? data.campusPeak : null;

    var levels = {};
    RULE_KEYS.forEach(function (k) {
        var r = RULES[k];
        var lv = levelFor(r, r.metric(data));
        if (peak && !r.live && typeof peak[k] === 'number') lv = Math.max(lv, Math.min(peak[k], r.max));
        levels[k] = lv;
    });

    var sprawl = Math.min(SPRAWL_SPOTS.length, 1 + Math.round(eraIdx * 1));
    var rail = eraIdx >= RAIL_MIN_ERA;
    var wind = eraIdx >= WIND_MIN_ERA;
    var flavor = flavorOf(data);
    var sig = eraIdx + '|' + RULE_KEYS.map(function (k) { return levels[k]; }).join(',') + '|' + sprawl +
        '|' + (rail ? 1 : 0) + (wind ? 1 : 0) + '|' + flavor.sig;
    return { eraIdx: eraIdx, era: era, levels: levels, sprawl: sprawl, rail: rail, wind: wind, flavor: flavor, sig: sig };
}

// ============================================================
// FLAVOR — sinyal "isi game" selain level (murni, tanpa THREE).
// Semua nilai dikuantisasi supaya plan.sig hanya berubah pada kejadian nyata.
// ============================================================
var FF_KIND = {
    ff_candybar: 'bar_old', ff_slider: 'slider', ff_touch_slider: 'slider', ff_flip: 'flip',
    ff_flip_fold: 'flip2', ff_communicator: 'keys', ff_pda: 'keys', ff_qwerty: 'keys', ff_swivel: 'keys',
    ff_dual: 'fold', ff_fold: 'fold', ff_tri_fold: 'fold'
};
var BODY_HEX = {
    color_black: 0x1a1a1a, color_white: 0xf5f5f5, color_silver: 0xc0c0c0, color_blue: 0x2196f3,
    color_red: 0xe53935, color_gold: 0xffd700, color_green: 0x43a047, color_titanium: 0x8a8a8a
};
function shortBrand(name) {
    var n = (typeof name === 'string' ? name : '').replace(/\s+/g, ' ').trim();
    if (!n) return 'My Tech Co';
    return n.length > 18 ? n.slice(0, 17) + '\u2026' : n;
}
export function flavorOf(d) {
    d = d || {};
    var cat = d.products && d.products.catalog;
    var hero = null, i;
    if (Array.isArray(cat) && cat.length) {
        for (i = cat.length - 1; i >= 0; i--) { if (cat[i] && cat[i].status === 'selling') { hero = cat[i]; break; } }
        if (!hero) hero = cat[cat.length - 1];
    }
    var cfg = (hero && hero.config) || {};
    var heroInfo = hero ? {
        name: String(hero.name || ''),
        kind: FF_KIND[cfg.formFactorId] || 'bar',
        color: BODY_HEX[cfg.bodyColorId] !== undefined ? BODY_HEX[cfg.bodyColorId] : 0x1a1a1a
    } : null;
    var bugs = 0, ob = d.os && d.os.bugs;
    if (Array.isArray(ob)) for (i = 0; i < ob.length; i++) if (ob[i] && ob[i].status === 'active') bugs++;
    var f = {
        brand: shortBrand(d.companyName),
        hero: heroInfo,
        research: len(d.research && d.research.active) + len(d.chipResearch && d.chipResearch.active) > 0,
        fabBusy: !!(d.fab && d.fab.built && d.fab.producing),
        osBusy: !!(d.os && d.os.developing),
        osBugs: bugs,
        launch: !!(d.products && (d.products.designing || d.products.development)),
        warn: !!(d.finance && (d.finance.negativeMonths || 0) > 0)
    };
    f.heroKey = heroInfo ? (heroInfo.kind + '.' + heroInfo.color.toString(16)) : '-';
    f.sig = [f.brand, f.heroKey, f.research ? 1 : 0, f.fabBusy ? 1 : 0, f.osBusy ? 1 : 0,
        Math.min(f.osBugs, 9), f.launch ? 1 : 0, f.warn ? 1 : 0].join('~');
    return f;
}

// Potongan flavor yang relevan per bangunan -> hanya bangunan itu yang dibangun ulang saat berubah.
export function flavorKeyFor(id, f) {
    if (!f) return '';
    switch (id) {
        case 'hq': return f.brand + '|' + (f.warn ? 1 : 0);
        case 'lab': return f.research ? '1' : '0';
        case 'factory': return f.fabBusy ? '1' : '0';
        case 'store': return f.heroKey;
        case 'os': return (f.osBusy ? 1 : 0) + ',' + (f.osBugs > 0 ? 1 : 0);
        case 'arena': return f.heroKey + '|' + (f.launch ? 1 : 0);
        case 'billboard': return f.heroKey;
        default: return '';
    }
}

// Simpan puncak level (hanya kalau NEVER_DOWNGRADE). Tidak memicu event.
export function rememberPeak(data, plan) {
    if (!NEVER_DOWNGRADE || !data || !plan) return;
    var p = data.campusPeak;
    if (!p || typeof p !== 'object') p = data.campusPeak = {};
    RULE_KEYS.forEach(function (k) {
        if (RULES[k].live) return;
        if (plan.levels[k] > (p[k] || 0)) p[k] = plan.levels[k];
    });
}

// Teks untuk tooltip saat bangunan di-tap.
// Dipanggil saat tap (bukan di-cache), jadi selalu mengikuti bahasa aktif.
export function describeBuilding(id, plan, data) {
    if (!plan) return null;
    if (id === 'sprawl') {
        return {
            title: _bName('sprawl', 'Kawasan Kota'),
            sub: _tf('campus.tip.sprawl_sub', 'Tumbuh seiring era: {era}', { era: plan.era.shortLabel || plan.era.label })
        };
    }
    if (id === 'wind') {
        return {
            title: _bName('wind', 'Ladang Angin'),
            sub: _tf('campus.tip.wind_sub', 'Energi hijau kampus — sejak era Premium')
        };
    }
    if (id === 'rail') {
        return {
            title: _bName('rail', 'Monorail Kota'),
            sub: _tf('campus.tip.rail_sub', 'Menghubungkan kawasan — sejak era Smartphone Matang')
        };
    }
    var r = RULES[id];
    if (!r) return null;
    var lv = plan.levels[id] || 0;
    var m = r.metric(data || {});
    var mShown = (id === 'monument') ? (Math.round(m * 10) / 10) : m;
    var sub;
    if (lv >= r.max) sub = _tf('campus.tip.max_level', 'Level maksimum');
    else {
        var need = r.steps[lv - r.base];
        sub = _tf('campus.tip.next', 'Naik di {need} {unit} (kini {now})', {
            need: need, unit: _bUnit(id, r.unit), now: mShown
        });
    }
    return {
        title: _tf('campus.tip.title', '{name} · Lv {lv}/{max}', {
            name: _bName(id, r.name), lv: lv, max: r.max
        }),
        sub: sub
    };
}

// ============================================================
// ASSETS
// ============================================================
var COLOR_ROLES = [
    'grass', 'plaza', 'road', 'wall', 'window', 'trunk', 'leaf', 'solar', 'metal', 'glow',
    'grass2', 'soil', 'curb', 'water', 'leaf2', 'gold', 'shade', 'flowerA', 'flowerB',
    'lamp', 'beacon', 'halo', 'roofAlt'
];

// Opsi material khusus per role (transparan dsb).
var MAT_OPTS = {
    shade: { transparent: true, opacity: 0.2, depthWrite: false },
    halo:  { transparent: true, opacity: 0, depthWrite: false },
    water: { transparent: true, opacity: 0.88 },
    ao:    { transparent: true, opacity: 0.34, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }
};
// Role tanpa pencahayaan (bayangan palsu, halo lampu, contact-AO).
var BASIC_ROLES = { shade: 1, halo: 1, ao: 1 };
// PBR per role: r = roughness, m = metalness, e = skala envMapIntensity (di tema terang).
var MAT_PROPS = {
    grass: { r: 0.97, m: 0, e: 0.35 }, grass2: { r: 0.97, m: 0, e: 0.35 }, soil: { r: 1, m: 0, e: 0.2 },
    plaza: { r: 0.82, m: 0, e: 0.45 }, road: { r: 0.94, m: 0, e: 0.25 }, curb: { r: 0.86, m: 0, e: 0.4 },
    wall: { r: 0.62, m: 0, e: 0.6 }, roof: { r: 0.46, m: 0.15, e: 0.8 }, roofAlt: { r: 0.72, m: 0.05, e: 0.55 },
    window: { r: 0.14, m: 0.3, e: 1.5 }, solar: { r: 0.28, m: 0.55, e: 1.3 },
    metal: { r: 0.38, m: 0.75, e: 1.0 }, gold: { r: 0.3, m: 0.9, e: 1.1 },
    trunk: { r: 0.95, m: 0, e: 0.3 }, leaf: { r: 0.9, m: 0, e: 0.35 }, leaf2: { r: 0.9, m: 0, e: 0.35 },
    glow: { r: 0.35, m: 0, e: 0.5 }, water: { r: 0.06, m: 0, e: 1.4 },
    flowerA: { r: 0.7, m: 0, e: 0.3 }, flowerB: { r: 0.7, m: 0, e: 0.3 }, lamp: { r: 0.4, m: 0, e: 0.3 }, beacon: { r: 0.4, m: 0, e: 0.3 }
};
// 3 varian fasad (tekstur sama, tint beda) + seed per bangunan -> gedung tidak tampak seperti salinan.
var FACADE_KEYS = ['facade', 'facadeB', 'facadeC'];
var FACADE_TINT = [0xffffff, 0xf2e8d6, 0xdde7f3];
var VARIANT_SEED = { hq: 0, lab: 1, factory: 2, store: 3, os: 4, monument: 0, billboard: 0, academy: 5, arena: 6, port: 7 };
var ROOF_ALT = { factory: true, port: true };

function hexCss(n) { return '#' + ('000000' + (n >>> 0).toString(16)).slice(-6); }
function tint(n, f) {   // f: -1 (gelap) .. 1 (terang)
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var t = f < 0 ? 0 : 255, a = Math.abs(f);
    r = Math.round(r + (t - r) * a); g = Math.round(g + (t - g) * a); b = Math.round(b + (t - b) * a);
    return (r << 16) | (g << 8) | b;
}

// Tekstur fasad 4x4 sel (256px): satu tile dipakai ulang semua gedung.
// Peta warna + peta emissive (jendela menyala acak untuk mode gelap).
function makeFacade(THREE) {
    var S = 256, C = 64;
    var cMap = document.createElement('canvas');
    var cEmi = document.createElement('canvas');
    cMap.width = cMap.height = cEmi.width = cEmi.height = S;
    var tMap = new THREE.CanvasTexture(cMap);
    var tEmi = new THREE.CanvasTexture(cEmi);
    [tMap, tEmi].forEach(function (t) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
    });
    var lit = [], seed = 7, i;
    for (i = 0; i < 16; i++) { seed = (seed * 16807) % 2147483647; lit.push((seed % 100) < 68); }

    function draw(wall, win) {
        var a = cMap.getContext('2d'), b = cEmi.getContext('2d');
        a.fillStyle = hexCss(wall); a.fillRect(0, 0, S, S);
        b.fillStyle = '#000000'; b.fillRect(0, 0, S, S);
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 4; c++) {
                var x = c * C, y = r * C;
                // Pilaster, shadow line, dan highlight tipis memberi kedalaman pada fasad.
                a.fillStyle = hexCss(tint(wall, -0.11)); a.fillRect(x, y, 4, C);
                a.fillStyle = hexCss(tint(wall, 0.13)); a.fillRect(x + 4, y, 2, C);
                a.fillStyle = hexCss(tint(wall, -0.18)); a.fillRect(x, y + C - 4, C, 4);
                // Bingkai jendela bertingkat dengan kaca gradasi.
                a.fillStyle = hexCss(tint(win, -0.52)); a.fillRect(x + 8, y + 10, 48, 42);
                a.fillStyle = hexCss(tint(win, -0.25)); a.fillRect(x + 10, y + 12, 44, 38);
                var gr = a.createLinearGradient(x + 10, y + 12, x + 48, y + 50);
                gr.addColorStop(0, hexCss(tint(win, 0.55)));
                gr.addColorStop(0.48, hexCss(tint(win, 0.12)));
                gr.addColorStop(1, hexCss(tint(win, -0.18)));
                a.fillStyle = gr; a.fillRect(x + 12, y + 14, 40, 34);
                // Refleksi kaca diagonal dan mullion.
                a.fillStyle = 'rgba(255,255,255,0.22)';
                a.beginPath(); a.moveTo(x + 13, y + 15); a.lineTo(x + 24, y + 15); a.lineTo(x + 13, y + 34); a.closePath(); a.fill();
                a.fillStyle = hexCss(tint(win, -0.38)); a.fillRect(x + 31, y + 14, 2, 34);
                a.fillStyle = hexCss(tint(win, -0.32)); a.fillRect(x + 12, y + 31, 40, 2);
                if (lit[r * 4 + c]) {
                    b.fillStyle = hexCss(tint(win, 0.38));
                    b.fillRect(x + 13, y + 15, 17, 15);
                    b.fillRect(x + 34, y + 15, 17, 15);
                    b.fillStyle = hexCss(tint(win, 0.15));
                    b.fillRect(x + 13, y + 33, 17, 14);
                    b.fillRect(x + 34, y + 33, 17, 14);
                }
            }
        }
        tMap.needsUpdate = true;
        tEmi.needsUpdate = true;
    }
    draw(0xffffff, 0x8fb4e8);
    return { map: tMap, emi: tEmi, draw: draw, dispose: function () { tMap.dispose(); tEmi.dispose(); } };
}

// Tekstur noise rumput (tile 128px, seamless): bintik terang/gelap lembut, dikalikan warna palet.
function makeNoiseTex(THREE) {
    var S = 128, c = document.createElement('canvas');
    c.width = c.height = S;
    var g = c.getContext('2d');
    g.fillStyle = '#f7f7f7'; g.fillRect(0, 0, S, S);
    var seed = 424242;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    for (var i = 0; i < 240; i++) {
        var x = rnd() * S, y = rnd() * S, r = 3 + rnd() * 11;
        g.fillStyle = rnd() < 0.55 ? 'rgba(48,84,36,0.07)' : 'rgba(255,255,255,0.55)';
        for (var ox = -S; ox <= S; ox += S) {
            for (var oy = -S; oy <= S; oy += S) { g.beginPath(); g.arc(x + ox, y + oy, r, 0, 6.2832); g.fill(); }
        }
    }
    var tx = new THREE.CanvasTexture(c);
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 4;
    return tx;
}

// Tekstur contact-AO: persegi hitam dengan tepi lembut (inti tertutup bangunan, yang terlihat hanya tepi).
function makeAoTex(THREE) {
    var S = 128, c = document.createElement('canvas');
    c.width = c.height = S;
    var g = c.getContext('2d');
    g.shadowColor = 'rgba(0,0,0,1)';
    g.shadowBlur = 20;
    g.fillStyle = '#000';
    g.fillRect(S * 0.18, S * 0.18, S * 0.64, S * 0.64);
    var tx = new THREE.CanvasTexture(c);
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
}

// opts: { shadows: bool (shadow map nyata aktif), env: bool (environment map aktif) }
export function createAssets(THREE, opts) {
    opts = opts || {};
    var envOn = opts.env !== false;
    var geos = new Map();
    var mats = new Map();
    var extraMats = [];          // material milik modul lain (CampusLife) yang ikut skala env
    var facade = makeFacade(THREE);
    var noiseTex = makeNoiseTex(THREE);
    var patchTex = noiseTex.clone();
    patchTex.repeat.set(1.5, 1);
    patchTex.needsUpdate = true;
    noiseTex.repeat.set(36, 36);
    var aoTex = makeAoTex(THREE);

    FACADE_KEYS.forEach(function (k, i) {
        var fm = new THREE.MeshStandardMaterial({
            map: facade.map, emissive: 0xffffff, emissiveMap: facade.emi, emissiveIntensity: 0,
            roughness: 0.72, metalness: 0.04, vertexColors: true, color: FACADE_TINT[i]
        });
        fm.envMapIntensity = 0.5;
        fm.userData.envBase = 0.5;
        mats.set(k, fm);
    });

    function makeMat(role) {
        var o = MAT_OPTS[role] || {};
        var m;
        if (BASIC_ROLES[role]) {
            m = new THREE.MeshBasicMaterial(Object.assign({}, o));
            if (role === 'ao') m.map = aoTex;
        } else {
            var p = MAT_PROPS[role] || { r: 0.7, m: 0, e: 0.5 };
            m = new THREE.MeshStandardMaterial(Object.assign({ roughness: p.r, metalness: envOn ? p.m : p.m * 0.3 }, o));
            m.envMapIntensity = p.e;
            m.userData.envBase = p.e;
            if (role === 'grass') m.map = noiseTex;
            else if (role === 'grass2') m.map = patchTex;
        }
        return m;
    }
    function cached(key, make) {
        if (!geos.has(key)) geos.set(key, make());
        return geos.get(key);
    }
    // Material warna bebas (warna bodi produk) & papan nama perusahaan — di-cache, dibuang di dispose().
    var colorMats = new Map();
    var signMats = new Map();
    function makeSign(text) {
        var W = 512, H = 96, c = document.createElement('canvas');
        c.width = W; c.height = H;
        var g = c.getContext('2d');
        var px = 54;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        do { g.font = '700 ' + px + 'px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'; px -= 3; }
        while (g.measureText(text).width > W - 40 && px > 20);
        g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = 'rgba(8,16,32,0.85)';
        g.strokeText(text, W / 2, H / 2 + 2);
        g.fillStyle = '#ffffff';
        g.fillText(text, W / 2, H / 2 + 2);
        var tx = new THREE.CanvasTexture(c);
        tx.colorSpace = THREE.SRGBColorSpace;
        tx.anisotropy = 4;
        var m = new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false });
        m.userData.tex = tx;
        return m;
    }
    return {
        THREE: THREE,
        flavor: null,            // sinyal isi-game (plan.flavor), diisi CampusScene sebelum membangun
        // Bidang tegak (papan nama / layar).
        vplane: function (w, h) { return cached('v' + w + '_' + h, function () { return new THREE.PlaneGeometry(w, h); }); },
        colorMat: function (hex) {
            if (!colorMats.has(hex)) {
                var m = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.38, metalness: 0.35 });
                m.envMapIntensity = 0.9; m.userData.envBase = 0.9;
                colorMats.set(hex, m);
                extraMats.push(m);
            }
            return colorMats.get(hex);
        },
        signMat: function (text) {
            if (!signMats.has(text)) {
                if (signMats.size > 12) {   // batasi cache (nama bisa diganti pemain)
                    signMats.forEach(function (m) { m.userData.tex.dispose(); m.dispose(); });
                    signMats.clear();
                }
                signMats.set(text, makeSign(text));
            }
            return signMats.get(text);
        },
        realShadows: !!opts.shadows,
        facadeKeys: FACADE_KEYS,
        variantSeed: 0,          // diatur builder tiap bangunan -> varian fasad deterministik
        roofAlt: false,
        facadeRole: function () { return FACADE_KEYS[Math.abs(this.variantSeed | 0) % FACADE_KEYS.length]; },
        box: function (w, h, d) { return cached('b' + w + '_' + h + '_' + d, function () { return new THREE.BoxGeometry(w, h, d); }); },
        // Bidang datar (untuk contact-AO), menghadap atas.
        plane: function (w, d) {
            return cached('p' + w + '_' + d, function () {
                var g = new THREE.PlaneGeometry(w, d);
                g.rotateX(-Math.PI / 2);
                return g;
            });
        },
        // Box dengan UV fasad: jumlah jendela mengikuti lebar & jumlah lantai.
        // + vertex color: gelap di dasar, terang di atas (AO palsu yang murah, tanpa tekstur tambahan).
        fbox: function (w, h, d, floors) {
            return cached('f' + w + '_' + h + '_' + d + '_' + floors, function () {
                var g = new THREE.BoxGeometry(w, h, d);
                var uv = g.attributes.uv;
                var uw = Math.max(1, Math.round(w / 0.75)) / 4;
                var ud = Math.max(1, Math.round(d / 0.75)) / 4;
                var uh = Math.max(1, floors) / 4;
                for (var f = 0; f < 6; f++) {
                    for (var v = 0; v < 4; v++) {
                        var i = f * 4 + v, u = uv.getX(i), t = uv.getY(i);
                        if (f < 2) uv.setXY(i, u * ud, t * uh);        // sisi ±x
                        else if (f >= 4) uv.setXY(i, u * uw, t * uh);  // sisi ±z
                        else uv.setXY(i, 0.01, 0.01);                  // atas/bawah: polos
                    }
                }
                uv.needsUpdate = true;
                var pos = g.attributes.position;
                var col = new Float32Array(pos.count * 3);
                for (var k = 0; k < pos.count; k++) {
                    var ty = (pos.getY(k) + h / 2) / h;
                    var sh = 0.7 + 0.3 * Math.pow(Math.max(0, Math.min(1, ty)), 0.55);
                    col[k * 3] = col[k * 3 + 1] = col[k * 3 + 2] = sh;
                }
                g.setAttribute('color', new THREE.BufferAttribute(col, 3));
                return g;
            });
        },
        cyl: function (rt, rb, h, s) { return cached('y' + rt + '_' + rb + '_' + h + '_' + s, function () { return new THREE.CylinderGeometry(rt, rb, h, s); }); },
        cone: function (r, h, s) { return cached('c' + r + '_' + h + '_' + s, function () { return new THREE.ConeGeometry(r, h, s); }); },
        sph: function (r, ws, hs) { return cached('s' + r + '_' + ws + '_' + hs, function () { return new THREE.SphereGeometry(r, ws, hs); }); },
        tor: function (r, t) { return cached('t' + r + '_' + t, function () { return new THREE.TorusGeometry(r, t, 6, 40); }); },
        mat: function (role) {
            if (!mats.has(role)) mats.set(role, makeMat(role));
            return mats.get(role);
        },
        // Daftarkan material modul lain agar ikut skala environment per tema.
        track: function (m, base) {
            if (!m) return m;
            m.userData = m.userData || {};
            m.userData.envBase = base;
            extraMats.push(m);
            return m;
        },
        // k = envI tema / 0.55 (tema terang = 1).
        setEnvIntensity: function (envI) {
            var k = envI / 0.55;
            var apply = function (m) {
                if (m.userData && m.userData.envBase !== undefined) m.envMapIntensity = m.userData.envBase * k;
            };
            mats.forEach(apply);
            extraMats.forEach(apply);
        },
        applyPalette: function (p, accent) {
            var self = this;
            COLOR_ROLES.forEach(function (r) { if (p[r] !== undefined) self.mat(r).color.setHex(p[r]); });
            try { self.mat('roof').color.set(accent); } catch (e) { self.mat('roof').color.setHex(0x2563eb); }
            var g = self.mat('glow');
            if (g.emissive && p.glow !== undefined) { g.emissive.setHex(p.glow); g.emissiveIntensity = 0.55; }

            var night = p.night ? 1 : 0;
            facade.draw(p.wall, p.window !== undefined ? p.window : 0x8fb4e8);
            FACADE_KEYS.forEach(function (k) { self.mat(k).emissiveIntensity = night ? 0.9 : 0; });
            var lamp = self.mat('lamp');
            lamp.emissive.setHex(0xffd98a);
            lamp.emissiveIntensity = night ? 1.1 : 0.15;
            var bc = self.mat('beacon');
            bc.emissive.setHex(0xff2d2d);
            bc.emissiveIntensity = 0.8;
            var hl = self.mat('halo');
            hl.opacity = night ? 0.22 : 0;
            hl.visible = !!night;
            var wt = self.mat('water');
            wt.emissive.setHex(0x2a6f95);
            wt.emissiveIntensity = night ? 0.25 : 0.12;
            if (p.aoOpacity !== undefined) self.mat('ao').opacity = self.realShadows ? p.aoOpacity * 0.8 : p.aoOpacity;
        },
        dispose: function () {
            geos.forEach(function (g) { g.dispose(); });
            mats.forEach(function (m) { m.dispose(); });
            colorMats.forEach(function (m) { m.dispose(); });
            signMats.forEach(function (m) { m.userData.tex.dispose(); m.dispose(); });
            facade.dispose();
            noiseTex.dispose(); patchTex.dispose(); aoTex.dispose();
            geos.clear(); mats.clear(); colorMats.clear(); signMats.clear(); extraMats.length = 0;
        }
    };
}

function mesh(A, THREE, geo, role, x, y, z) {
    var m = new THREE.Mesh(geo, A.mat(role));
    m.position.set(x, y, z);
    return m;
}

// Banyak salinan satu geometri dalam 1 draw call. item = [x,y,z, sx,sy,sz, rotY].
// tintFn(i, color) opsional: isi warna pengali per-instance (variasi halus tanpa material baru).
function instanced(A, THREE, geo, role, items, tintFn) {
    var im = new THREE.InstancedMesh(geo, A.mat(role), items.length);
    var m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    var p = new THREE.Vector3(), s = new THREE.Vector3();
    for (var i = 0; i < items.length; i++) {
        var it = items[i];
        e.set(0, it[6] || 0, 0);
        q.setFromEuler(e);
        p.set(it[0], it[1], it[2]);
        s.set(it[3] || 1, it[4] || 1, it[5] || 1);
        m.compose(p, q, s);
        im.setMatrixAt(i, m);
    }
    im.instanceMatrix.needsUpdate = true;
    if (tintFn) {
        var tc = new THREE.Color();
        for (var j = 0; j < items.length; j++) { tintFn(j, tc); im.setColorAt(j, tc); }
        im.instanceColor.needsUpdate = true;
    }
    im.frustumCulled = false;
    return im;
}

// ============================================================
// TANAH, JALAN, TAMAN
// ============================================================
var GRASS_PATCHES = [
    [-6.5, 8.2, 3, 2], [6.2, -8.2, 2.6, 1.8], [-9, -6.6, 1.8, 3],
    [3.6, -5.2, 2.4, 1.6], [-2.4, -6.8, 2.2, 1.4], [-4.2, 7.4, 1.8, 1.6],
    // area perluasan
    [-12.2, -12, 4, 3], [12.4, -13, 3.2, 2], [-12.6, 12.4, 3.4, 3], [3.4, 13.2, 3, 2.2],
    [-10.8, -3.2, 3, 1.6], [13, 3, 2, 3.2], [-1.2, -12.6, 5, 1.6], [8.6, -9.2, 2.4, 1.4]
];
var LAMP_SPOTS = [
    [-1.55, 4.6], [-1.55, 6.8], [-1.55, 9.0], [1.55, 4.6], [1.55, 6.8],
    [-1.55, 11.2], [-1.55, 13.4], [1.55, 11.2], [1.55, 13.4],
    [-4.6, 1.55], [-6.8, 1.55], [-9.0, 1.55], [-4.6, -1.55], [-6.8, -1.55], [-9.0, -1.55],
    [-11.2, 1.55], [-13.4, 1.55], [-11.2, -1.55], [-13.4, -1.55]
];
var PLANTERS = [[3.1, 3.1], [3.1, -3.1], [-3.1, -3.1]];

// Gerbang pintu masuk: dua tiang + balok + papan nama menyala.
function addGate(g, A, THREE, x, z, rot) {
    var a = new THREE.Group();
    a.add(mesh(A, THREE, A.box(0.28, 2.2, 0.28), 'wall', -1.6, 1.1, 0));
    a.add(mesh(A, THREE, A.box(0.28, 2.2, 0.28), 'wall', 1.6, 1.1, 0));
    a.add(mesh(A, THREE, A.box(3.8, 0.34, 0.34), 'roof', 0, 2.3, 0));
    a.add(mesh(A, THREE, A.box(1.8, 0.2, 0.06), 'glow', 0, 2.3, 0.19));
    a.add(mesh(A, THREE, A.box(0.4, 0.08, 0.4), 'curb', -1.6, 0.04, 0));
    a.add(mesh(A, THREE, A.box(0.4, 0.08, 0.4), 'curb', 1.6, 0.04, 0));
    a.position.set(x, 0.06, z);
    a.rotation.y = rot;
    g.add(a);
}

// Tanah dasar (pulau bertebing 30x30), plaza, jalan + trotoar + marka, kolam, teluk, taman, lampu.
export function buildGround(A, THREE) {
    var g = new THREE.Group();
    var i;
    g.add(mesh(A, THREE, A.box(CAMPUS_WORLD_SIZE - 0.4, 0.6, CAMPUS_WORLD_SIZE - 0.4), 'soil', 0, -0.9, 0));
    g.add(mesh(A, THREE, A.box(CAMPUS_WORLD_SIZE, 0.6, CAMPUS_WORLD_SIZE), 'grass', 0, -0.3, 0));
    GRASS_PATCHES.forEach(function (p) {
        g.add(mesh(A, THREE, A.box(p[2], 0.02, p[3]), 'grass2', p[0], 0.01, p[1]));
    });
    g.add(mesh(A, THREE, A.box(7, 0.08, 7), 'plaza', 0, 0.04, 0));
    // inlay plaza: cincin tipis
    var inlay = mesh(A, THREE, A.cyl(3.3, 3.3, 0.02, 28), 'curb', 0, 0.085, 0);
    g.add(inlay);
    // jalan selatan (z 3.5 -> 15) dan barat (x -3.5 -> -15)
    g.add(mesh(A, THREE, A.box(2, 0.06, 11.5), 'road', 0, 0.03, 9.25));
    g.add(mesh(A, THREE, A.box(11.5, 0.06, 2), 'road', -9.25, 0.03, 0));
    // trotoar (kiri-kanan tiap jalan)
    [-1.225, 1.225].forEach(function (x) { g.add(mesh(A, THREE, A.box(0.45, 0.09, 11.5), 'curb', x, 0.045, 9.25)); });
    [-1.225, 1.225].forEach(function (z) { g.add(mesh(A, THREE, A.box(11.5, 0.09, 0.45), 'curb', -9.25, 0.045, z)); });

    // marka jalan putus-putus + zebra cross (instanced)
    var dashes = [], cross = [];
    for (i = 0; i < 10; i++) dashes.push([0, 0.065, 4.4 + i * 1.0, 1, 1, 1, 0]);
    for (i = 0; i < 10; i++) dashes.push([-4.4 - i * 1.0, 0.065, 0, 1, 1, 1, Math.PI / 2]);
    for (i = 0; i < 5; i++) cross.push([-0.8 + i * 0.4, 0.066, 3.85]);
    for (i = 0; i < 5; i++) cross.push([-3.85, 0.066, -0.8 + i * 0.4]);
    g.add(instanced(A, THREE, A.box(0.1, 0.012, 0.5), 'wall', dashes));
    g.add(instanced(A, THREE, A.box(0.22, 0.012, 0.5), 'wall', cross.slice(0, 5)));
    g.add(instanced(A, THREE, A.box(0.5, 0.012, 0.22), 'wall', cross.slice(5)));

    // gerbang di ujung kedua jalan
    addGate(g, A, THREE, 0, 14.2, 0);
    addGate(g, A, THREE, -14.2, 0, Math.PI / 2);

    // teluk tenggara: tepi pasir + air
    g.add(mesh(A, THREE, A.box(BAY.w + 0.6, 0.03, BAY.d + 0.6), 'plaza', BAY.x, 0.015, BAY.z));
    g.add(mesh(A, THREE, A.box(BAY.w, 0.04, BAY.d), 'water', BAY.x, 0.04, BAY.z));

    // kolam + tepi pasir + batu + teratai
    g.add(mesh(A, THREE, A.cyl(POND.r + 0.22, POND.r + 0.24, 0.05, 18), 'plaza', POND.x, 0.025, POND.z));
    g.add(mesh(A, THREE, A.cyl(POND.r, POND.r, 0.04, 18), 'water', POND.x, 0.04, POND.z));
    [[-1.1, 0.9, 0.17], [1.15, 0.5, 0.13], [0.3, -1.45, 0.15]].forEach(function (r) {
        var rock = mesh(A, THREE, A.sph(r[2], 6, 5), 'metal', POND.x + r[0], 0.06, POND.z + r[1]);
        rock.scale.y = 0.6;
        g.add(rock);
    });
    [[0.3, 0.2], [-0.4, -0.3], [0.6, -0.55]].forEach(function (p) {
        g.add(mesh(A, THREE, A.cyl(0.14, 0.14, 0.012, 8), 'leaf2', POND.x + p[0], 0.066, POND.z + p[1]));
    });

    // planter + bunga + bangku
    var flowersA = [], flowersB = [];
    PLANTERS.forEach(function (p) {
        g.add(mesh(A, THREE, A.box(0.9, 0.22, 0.9), 'curb', p[0], 0.08 + 0.11, p[1]));
        g.add(mesh(A, THREE, A.box(0.78, 0.18, 0.78), 'leaf', p[0], 0.08 + 0.28, p[1]));
        [[-0.2, -0.2], [0.2, 0.15], [0, 0], [-0.22, 0.2], [0.22, -0.2]].forEach(function (o, k) {
            (k % 2 ? flowersB : flowersA).push([p[0] + o[0], 0.08 + 0.42, p[1] + o[1]]);
        });
    });
    g.add(instanced(A, THREE, A.sph(0.08, 5, 4), 'flowerA', flowersA));
    g.add(instanced(A, THREE, A.sph(0.08, 5, 4), 'flowerB', flowersB));
    [[2.2, 3.05, 0], [-2.0, -3.2, 0]].forEach(function (b) {
        g.add(mesh(A, THREE, A.box(0.9, 0.07, 0.3), 'trunk', b[0], 0.08 + 0.3, b[1]));
        g.add(mesh(A, THREE, A.box(0.9, 0.22, 0.05), 'trunk', b[0], 0.08 + 0.45, b[1] - 0.14));
        g.add(mesh(A, THREE, A.box(0.06, 0.26, 0.26), 'metal', b[0] - 0.36, 0.08 + 0.13, b[1]));
        g.add(mesh(A, THREE, A.box(0.06, 0.26, 0.26), 'metal', b[0] + 0.36, 0.08 + 0.13, b[1]));
    });

    // lampu jalan: tiang, kepala menyala, dan halo cahaya di tanah (hanya malam)
    var poles = [], heads = [], halos = [];
    LAMP_SPOTS.forEach(function (l) {
        poles.push([l[0], 0.09 + 0.7, l[1]]);
        heads.push([l[0], 1.58, l[1]]);
        halos.push([l[0], 0.1, l[1]]);
    });
    g.add(instanced(A, THREE, A.cyl(0.035, 0.045, 1.4, 6), 'metal', poles));
    g.add(instanced(A, THREE, A.sph(0.1, 8, 6), 'lamp', heads));
    g.add(instanced(A, THREE, A.cyl(0.8, 0.8, 0.01, 14), 'halo', halos));

    // Ekspansi kota 100x100. Inti lama (radius 17) sengaja dibiarkan utuh.
    // Jalan dibangun sebagai segmen instanced-friendly; blok kota memakai InstancedMesh
    // supaya area luas tidak membuat ratusan draw call pada perangkat mobile.
    var roadItems = [], sidewalkItems = [], laneItems = [];
    var grid = [-42, -30, -18, 18, 30, 42];
    grid.forEach(function (v) {
        // jalan vertikal; celah pusat mempertahankan plaza/kawasan lama.
        if (Math.abs(v) >= 18) {
            roadItems.push([v, 0.025, -30, 1, 1, 24, 0]);
            roadItems.push([v, 0.025, 30, 1, 1, 24, 0]);
            sidewalkItems.push([v - 1.45, 0.055, -30, 1, 1, 24, 0]);
            sidewalkItems.push([v + 1.45, 0.055, -30, 1, 1, 24, 0]);
            sidewalkItems.push([v - 1.45, 0.055, 30, 1, 1, 24, 0]);
            sidewalkItems.push([v + 1.45, 0.055, 30, 1, 1, 24, 0]);
        }
        // jalan horizontal di area luar, dipotong di sekitar pusat lama.
        roadItems.push([-30, 0.025, v, 24, 1, 1, 0]);
        roadItems.push([30, 0.025, v, 24, 1, 1, 0]);
        sidewalkItems.push([-30, 0.055, v - 1.45, 24, 1, 1, 0]);
        sidewalkItems.push([-30, 0.055, v + 1.45, 24, 1, 1, 0]);
        sidewalkItems.push([30, 0.055, v - 1.45, 24, 1, 1, 0]);
        sidewalkItems.push([30, 0.055, v + 1.45, 24, 1, 1, 0]);
    });
    if (roadItems.length) g.add(instanced(A, THREE, A.box(1, 1, 1), 'road', roadItems));
    if (sidewalkItems.length) g.add(instanced(A, THREE, A.box(1, 1, 1), 'curb', sidewalkItems));

    // Distrik pinggiran: gedung kantor, hunian, dan gudang dengan variasi tinggi/atap.
    // Seed deterministik menjaga tata kota stabil antar-render.
    var shells = [[], [], []], roofs = [[], [], []], seed = 918273;
    function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var coords = [];
    for (var cx = -42; cx <= 42; cx += 6) {
        for (var cz = -42; cz <= 42; cz += 6) {
            if (Math.abs(cx) < 18 && Math.abs(cz) < 18) continue;
            // sisakan koridor jalan pada kelipatan 12.
            if (Math.abs(cx) % 12 < 2 || Math.abs(cz) % 12 < 2) continue;
            if (rand() < 0.19) continue; // ruang hijau/plaza kecil
            coords.push([cx + (rand() - 0.5) * 1.1, cz + (rand() - 0.5) * 1.1]);
        }
    }
    coords.forEach(function (p, idx) {
        var w = 2.2 + rand() * 1.7, d = 2.0 + rand() * 1.8;
        var h = 2.2 + rand() * 7.8;
        var tier = h < 4.2 ? 0 : (h < 7.0 ? 1 : 2);
        shells[tier].push([p[0], h / 2, p[1], w, h, d, 0]);
        roofs[tier].push([p[0], h + 0.035, p[1], w + 0.08, 0.07, d + 0.08, 0]);
        // beberapa atap punya utilitas kecil (hanya pada sampel agar draw-call tetap rendah).
        if (idx % 9 === 0) {
            g.add(mesh(A, THREE, A.box(0.55, 0.32, 0.55), 'metal', p[0] + 0.25, h + 0.22, p[1] - 0.2));
        }
    });
    // Variasi nilai warna per gedung kota (deterministik, terpisah dari seed tata letak).
    var tseed = 5150;
    function tintCity(i, c) {
        tseed = (tseed * 16807) % 2147483647;
        var v = 0.86 + ((tseed - 1) / 2147483646) * 0.2;
        c.setRGB(v, v * 0.99, v * 1.0);
    }
    for (var tier = 0; tier < 3; tier++) {
        if (shells[tier].length) g.add(instanced(A, THREE, A.box(1, 1, 1), tier === 0 ? 'wall' : 'window', shells[tier], tintCity));
        if (roofs[tier].length) g.add(instanced(A, THREE, A.box(1, 1, 1), tier === 2 ? 'metal' : 'roof', roofs[tier]));
    }

    // Garis batas halus mengisyaratkan luas dunia tanpa menambah geometri berat.
    var edge = [];
    edge.push([0, 0.012, -49.4, 98.8, 1, 0.12, 0]);
    edge.push([0, 0.012, 49.4, 98.8, 1, 0.12, 0]);
    edge.push([-49.4, 0.012, 0, 0.12, 1, 98.8, 0]);
    edge.push([49.4, 0.012, 0, 0.12, 1, 98.8, 0]);
    g.add(instanced(A, THREE, A.box(1, 1, 1), 'curb', edge));
    // Seluruh permukaan tanah menerima bayangan dari bangunan & pohon inti kampus.
    g.traverse(function (o) { if (o.isMesh) o.receiveShadow = true; });
    return g;
}

// 3 jenis pohon: pinus bertingkat, bulat rindang, dan cemara ramping.
export function buildTree(A, THREE, x, z) {
    var g = new THREE.Group();
    var k = Math.abs(Math.round(x * 7 + z * 13)) % 3;
    if (k === 0) {
        g.add(mesh(A, THREE, A.cyl(0.12, 0.16, 0.6, 6), 'trunk', 0, 0.3, 0));
        g.add(mesh(A, THREE, A.cone(0.78, 0.95, 7), 'leaf', 0, 0.95, 0));
        g.add(mesh(A, THREE, A.cone(0.6, 0.9, 7), 'leaf', 0, 1.5, 0));
        g.add(mesh(A, THREE, A.cone(0.4, 0.8, 7), 'leaf2', 0, 2.03, 0));
    } else if (k === 1) {
        g.add(mesh(A, THREE, A.cyl(0.14, 0.18, 0.85, 6), 'trunk', 0, 0.42, 0));
        g.add(mesh(A, THREE, A.sph(0.68, 8, 6), 'leaf', 0, 1.3, 0));
        g.add(mesh(A, THREE, A.sph(0.45, 7, 5), 'leaf2', 0.4, 1.05, 0.12));
        g.add(mesh(A, THREE, A.sph(0.4, 7, 5), 'leaf2', -0.3, 1.7, -0.1));
    } else {
        g.add(mesh(A, THREE, A.cyl(0.1, 0.14, 0.7, 6), 'trunk', 0, 0.35, 0));
        g.add(mesh(A, THREE, A.cone(0.5, 1.7, 6), 'leaf', 0, 1.5, 0));
        g.add(mesh(A, THREE, A.sph(0.14, 5, 4), 'flowerB', 0.28, 1.0, 0.25));
    }
    g.position.set(x, 0, z);
    return g;
}

// ------------------------------------------------------------
// HUTAN INSTANCED: jumlah draw call tidak lagi bergantung jumlah pohon.
// Setiap spesies = beberapa InstancedMesh (batang, tajuk, ...). Variasi skala, putaran, dan warna
// per pohon. `nodes[i].rotation.{x,z}` ditulis CampusLife (pohon bergoyang); panggil flush() setelahnya.
// ------------------------------------------------------------
// [geometri, argumen, role, x, y, z, tint?]
var TREE_PARTS = [
    [   // 0: pinus bertingkat
        ['cyl', [0.12, 0.16, 0.6, 6], 'trunk', 0, 0.3, 0, 0],
        ['cone', [0.78, 0.95, 7], 'leaf', 0, 0.95, 0, 1],
        ['cone', [0.6, 0.9, 7], 'leaf', 0, 1.5, 0, 1],
        ['cone', [0.4, 0.8, 7], 'leaf2', 0, 2.03, 0, 1]
    ],
    [   // 1: bulat rindang
        ['cyl', [0.14, 0.18, 0.85, 6], 'trunk', 0, 0.42, 0, 0],
        ['sph', [0.68, 10, 8], 'leaf', 0, 1.3, 0, 1],
        ['sph', [0.45, 9, 7], 'leaf2', 0.4, 1.05, 0.12, 1],
        ['sph', [0.4, 9, 7], 'leaf2', -0.3, 1.7, -0.1, 1]
    ],
    [   // 2: cemara ramping + buah kuning
        ['cyl', [0.1, 0.14, 0.7, 6], 'trunk', 0, 0.35, 0, 0],
        ['cone', [0.5, 1.7, 6], 'leaf', 0, 1.5, 0, 1],
        ['sph', [0.14, 6, 5], 'flowerB', 0.28, 1.0, 0.25, 0]
    ]
];

export function buildForest(A, THREE, spots) {
    var group = new THREE.Group();
    group.name = 'campus-forest';
    var seed = 31337;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var nodes = [], bySp = [[], [], []];
    spots.forEach(function (p) {
        var k = Math.abs(Math.round(p[0] * 7 + p[1] * 13)) % 3;   // spesies sama dengan buildTree()
        var node = {
            x: p[0], z: p[1], yaw: rnd() * Math.PI * 2, s: 0.86 + rnd() * 0.34,
            tint: [0.88 + rnd() * 0.2, 0.92 + rnd() * 0.16, 0.82 + rnd() * 0.2],
            rotation: { x: 0, z: 0 }
        };
        nodes.push(node);
        bySp[k].push(node);
    });
    var entries = [];
    var tc = new THREE.Color();
    bySp.forEach(function (list, k) {
        if (!list.length) return;
        TREE_PARTS[k].forEach(function (part) {
            var geo = A[part[0]].apply(A, part[1]);
            var im = new THREE.InstancedMesh(geo, A.mat(part[2]), list.length);
            im.frustumCulled = false;
            im.castShadow = true;
            im.receiveShadow = true;
            if (part[7]) {
                for (var i = 0; i < list.length; i++) { tc.setRGB(list[i].tint[0], list[i].tint[1], list[i].tint[2]); im.setColorAt(i, tc); }
                im.instanceColor.needsUpdate = true;
            }
            group.add(im);
            entries.push({ im: im, list: list, part: part });
        });
    });
    var mt = new THREE.Matrix4(), mp = new THREE.Matrix4(), mm = new THREE.Matrix4();
    var q = new THREE.Quaternion(), e = new THREE.Euler(), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    function flush() {
        for (var n = 0; n < entries.length; n++) {
            var en = entries[n], part = en.part, list = en.list;
            mp.makeTranslation(part[3], part[4], part[5]);
            for (var i = 0; i < list.length; i++) {
                var nd = list[i];
                e.set(nd.rotation.x, nd.yaw, nd.rotation.z);
                q.setFromEuler(e);
                pv.set(nd.x, 0, nd.z);
                sv.set(nd.s, nd.s, nd.s);
                mt.compose(pv, q, sv);
                mm.multiplyMatrices(mt, mp);
                en.im.setMatrixAt(i, mm);
            }
            en.im.instanceMatrix.needsUpdate = true;
        }
    }
    flush();
    return {
        group: group,
        nodes: nodes,
        flush: flush,
        dispose: function () {
            entries.forEach(function (en) { en.im.dispose(); });
            if (group.parent) group.parent.remove(group);
        }
    };
}

// Semak rapi di tepi jalan (instanced, 1 draw call). Sengaja menjauhi trotoar, lampu, billboard,
// dan pintu lab agar tidak menutupi jalan, pintu masuk, atau bangunan.
export var SHRUB_SPOTS = (function () {
    var out = [], i;
    var zs = [5.2, 6.8, 8.4, 10.0, 11.6, 13.2];
    for (i = 0; i < zs.length; i++) {
        out.push([-2.05, zs[i]]);
        if (zs[i] < 7.2 || zs[i] > 10.0) out.push([2.05, zs[i]]);   // lewati sisi billboard (2.6, 8.6)
    }
    var xs = [-5.2, -6.8, -8.4, -10.0, -11.6, -13.2];
    for (i = 0; i < xs.length; i++) out.push([xs[i], 2.05]);
    [-9.6, -11.2, -12.8].forEach(function (x) { out.push([x, -2.05]); });
    return out;
})();

export function buildShrubs(A, THREE) {
    var g = new THREE.Group();
    g.name = 'campus-shrubs';
    var seed = 777;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var items = SHRUB_SPOTS.map(function (p) {
        var s = 0.8 + rnd() * 0.5;
        return [p[0], 0.2 * s, p[1], s, s * (0.75 + rnd() * 0.25), s, rnd() * 3];
    });
    var im = instanced(A, THREE, A.sph(0.3, 8, 6), 'leaf2', items, function (i, c) {
        c.setRGB(0.82 + rnd() * 0.2, 0.9 + rnd() * 0.16, 0.8 + rnd() * 0.18);
    });
    im.castShadow = true;
    im.receiveShadow = true;
    g.add(im);
    return g;
}

// Aktifkan cast/receive shadow pada semua mesh opak sebuah bangunan.
export function applyShadowFlags(group, on) {
    if (!on || !group) return;
    group.traverse(function (o) {
        if (!o.isMesh) return;
        var m = o.material;
        if (m && m.transparent) return;           // kaca-air, bayangan palsu, AO, halo
        o.castShadow = true;
        o.receiveShadow = true;
    });
}

// InstancedMesh tidak otomatis melepas buffer GPU saat dibuang dari scene -> panggil ini.
export function disposeObject(obj) {
    if (!obj) return;
    obj.traverse(function (o) { if (o.isInstancedMesh) o.dispose(); });
}

// ============================================================
// BLOK GEDUNG
// ============================================================
// Bayangan palsu (hanya tier tanpa shadow map): bidang gelap transparan, miring menjauhi matahari.
// Arah ikut SHADE_DIR (CampusLook) supaya konsisten dengan posisi matahari.
function addShadow(group, A, THREE, w, h, d, x, z) {
    if (A.realShadows) return;
    var sx = SHADE_DIR[0] * Math.min(1.4, h * 0.22), sz = SHADE_DIR[1] * Math.min(1.0, h * 0.16);
    var bw = Math.round((w + 0.3 + Math.abs(sx)) * 100) / 100;
    var bd = Math.round((d + 0.3 + Math.abs(sz)) * 100) / 100;
    var s = mesh(A, THREE, A.box(bw, 0.01, bd), 'shade', x + sx / 2, 0.02, z + sz / 2);
    s.raycast = function () {};   // jangan ikut tap
    group.add(s);
}

// Contact-AO: gradien gelap lembut di sekeliling dasar bangunan (menggantikan SSAO yang mahal).
function addContactAO(group, A, THREE, w, d, x, z) {
    var bw = Math.round((w + 1.2) * 100) / 100, bd = Math.round((d + 1.2) * 100) / 100;
    var s = mesh(A, THREE, A.plane(bw, bd), 'ao', x, 0.07, z);
    s.renderOrder = 1;
    s.raycast = function () {};
    group.add(s);
}

// Satu blok gedung: fasad bertekstur (varian per bangunan) + plinth + atap + inset atap + contact-AO.
// noShadow = true untuk blok sekunder (supaya bayangan/AO tidak menumpuk).
function addBlock(group, A, THREE, w, h, d, x, z, floors, noShadow) {
    if (!noShadow) { addShadow(group, A, THREE, w, h, d, x, z); addContactAO(group, A, THREE, w, d, x, z); }
    group.add(mesh(A, THREE, A.fbox(w, h, d, floors), A.facadeRole(), x, h / 2, z));
    group.add(mesh(A, THREE, A.box(w + 0.1, 0.12, d + 0.1), 'curb', x, 0.06, z));
    group.add(mesh(A, THREE, A.box(w + 0.2, 0.14, d + 0.2), A.roofAlt ? 'roofAlt' : 'roof', x, h + 0.07, z));
    group.add(mesh(A, THREE, A.box(w - 0.1, 0.03, d - 0.1), 'plaza', x, h + 0.155, z));
}

function addSolar(g, A, THREE, w, d, topY, x, z) {
    g.add(mesh(A, THREE, A.box(w, 0.05, d), 'solar', x, topY + 0.04, z));
}

// Pintu kaca + kanopi di sisi +z (menghadap kamera).
function addDoor(g, A, THREE, x, z, d, dx, awW) {
    g.add(mesh(A, THREE, A.box(0.5, 0.62, 0.06), 'window', x + dx, 0.12 + 0.31, z + d / 2 + 0.07));
    g.add(mesh(A, THREE, A.box(awW, 0.05, 0.36), 'roof', x + dx, 0.9, z + d / 2 + 0.25));
}

// Unit AC / ventilasi di atap.
function addRoofGear(g, A, THREE, w, d, topY, x, z) {
    g.add(mesh(A, THREE, A.box(0.34, 0.2, 0.3), 'metal', x - w * 0.28, topY + 0.1, z + d * 0.2));
    g.add(mesh(A, THREE, A.cyl(0.13, 0.13, 0.2, 8), 'metal', x + w * 0.25, topY + 0.1, z - d * 0.22));
}

function addBeacon(g, A, THREE, x, y, z) {
    g.add(mesh(A, THREE, A.sph(0.07, 6, 5), 'beacon', x, y, z));
}

// Bagian yang berputar (cincin riset, wafer, model ponsel). CampusScene memutar g.userData.spin.
// Dilepas dari shadow map statis oleh CampusScene.
function addSpin(g, o, speed) {
    if (!g.userData.spin) g.userData.spin = [];
    o.userData.base = o.rotation.y;     // sudut awal (mis. 45° menghadap kamera)
    g.userData.spin.push({ o: o, v: speed });
}

// Cincin "atom" berputar (penanda riset / OS / peluncuran sedang berjalan).
function atomRings(A, THREE, r) {
    var p = new THREE.Group();
    p.add(mesh(A, THREE, A.sph(0.11, 8, 6), 'glow', 0, 0, 0));
    [1.05, -1.05].forEach(function (tilt, i) {
        var t = mesh(A, THREE, A.tor(r * (1 + i * 0.28), 0.022), 'glow', 0, 0, 0);
        t.rotation.x = tilt;
        t.rotation.y = i * 1.2;
        p.add(t);
    });
    return p;
}

// Model ponsel kecil (tinggi ±0.66, dasar di y=0, menghadap +z). kind dari FF_KIND, hex = warna bodi,
// layar memakai role 'window' -> warna layar ikut era (hijau monokrom di era awal) & menyala di mode gelap.
function buildPhone(A, THREE, kind, hex, eraIdx) {
    var g = new THREE.Group();
    var body = A.colorMat(hex), scr = A.mat('window'), key = A.mat('metal');
    var T = 0.06;
    function bx(parent, w, h, d, mat, x, y, z) {
        var m = new THREE.Mesh(A.box(w, h, d), mat);
        m.position.set(x, y, z);
        parent.add(m);
        return m;
    }
    var f = T / 2 + 0.004;
    if (kind === 'bar_old') {
        bx(g, 0.34, 0.66, T, body, 0, 0.33, 0);
        bx(g, 0.24, 0.2, 0.012, scr, 0, 0.53, f);
        bx(g, 0.26, 0.22, 0.012, key, 0, 0.18, f);
    } else if (kind === 'keys') {
        bx(g, 0.44, 0.5, T, body, 0, 0.25, 0);
        bx(g, 0.32, 0.2, 0.012, scr, 0, 0.37, f);
        bx(g, 0.38, 0.12, 0.012, key, 0, 0.13, f);
    } else if (kind === 'slider') {
        bx(g, 0.34, 0.5, T, body, 0, 0.25, -0.035);
        bx(g, 0.26, 0.1, 0.012, key, 0, 0.14, -0.035 + f);
        bx(g, 0.34, 0.5, T, body, 0, 0.55, 0.03);
        bx(g, 0.28, 0.4, 0.012, scr, 0, 0.55, 0.03 + f);
    } else if (kind === 'flip' || kind === 'flip2') {
        bx(g, 0.34, 0.3, T, body, 0, 0.15, 0);
        if (kind === 'flip') bx(g, 0.26, 0.2, 0.012, key, 0, 0.15, f);
        else bx(g, 0.28, 0.24, 0.012, scr, 0, 0.15, f);
        var up = new THREE.Group();
        up.position.set(0, 0.31, -0.01);
        up.rotation.x = -0.32;
        bx(up, 0.34, 0.34, T, body, 0, 0.17, 0);
        bx(up, 0.28, 0.28, 0.012, scr, 0, 0.17, f);
        g.add(up);
    } else if (kind === 'fold') {
        [-1, 1].forEach(function (sd) {
            var half = new THREE.Group();
            half.rotation.y = sd * -0.3;
            bx(half, 0.3, 0.6, T, body, sd * 0.15, 0.3, 0);
            bx(half, 0.26, 0.54, 0.012, scr, sd * 0.15, 0.3, f);
            g.add(half);
        });
        bx(g, 0.03, 0.62, 0.05, key, 0, 0.31, -0.005);
    } else {   // 'bar' modern: layar penuh; era AI/foldable ada lubang kamera
        bx(g, 0.32, 0.66, 0.05, body, 0, 0.33, 0);
        bx(g, 0.29, 0.61, 0.012, scr, 0, 0.33, 0.025 + 0.004);
        if (eraIdx >= 5) bx(g, 0.035, 0.035, 0.014, key, 0, 0.6, 0.033);
    }
    return g;
}

// ============================================================
// HQ — level 1..4 + ornamen sesuai era
// ============================================================
var HQ_W = [0, 3.2, 3.8, 4.2, 4.4];
var HQ_H = [0, 1.6, 2.8, 4.0, 4.8];
var HQ_D = [0, 2.6, 3.0, 3.2, 3.4];

export function buildHQ(A, THREE, level, eraIdx) {
    eraIdx = eraIdx || 0;
    A.variantSeed = VARIANT_SEED.hq; A.roofAlt = false;
    var g = new THREE.Group();
    g.position.y = 0.08; // di atas plaza
    if (level === 1) {
        addBlock(g, A, THREE, 3.2, 1.6, 2.6, 0, 0, 1);
    } else if (level === 2) {
        addBlock(g, A, THREE, 3.8, 2.8, 3.0, 0, 0, 2);
    } else if (level === 3) {
        addBlock(g, A, THREE, 4.2, 4.0, 3.2, 0, 0, 3);
        addBlock(g, A, THREE, 2.0, 1.6, 2.2, 3.2, 0.3, 1, true);
    } else {
        addBlock(g, A, THREE, 4.4, 4.8, 3.4, 0, 0, 4);
        addBlock(g, A, THREE, 2.0, 1.6, 2.2, 3.3, 0.3, 1, true);
        addBlock(g, A, THREE, 1.6, 7.0, 1.6, -1.2, -0.6, 6, true);
    }

    // ---- lobi: kaca, kanopi bertiang, tangga ----
    var fz = HQ_D[level] / 2;
    g.add(mesh(A, THREE, A.box(1.0, 0.78, 0.06), 'window', 0, 0.12 + 0.39, fz + 0.07));
    g.add(mesh(A, THREE, A.box(1.8, 0.1, 0.7), 'roof', 0, 1.02, fz + 0.4));
    g.add(mesh(A, THREE, A.cyl(0.06, 0.06, 0.95, 8), 'wall', -0.8, 0.52, fz + 0.65));
    g.add(mesh(A, THREE, A.cyl(0.06, 0.06, 0.95, 8), 'wall', 0.8, 0.52, fz + 0.65));
    g.add(mesh(A, THREE, A.box(1.8, 0.08, 0.5), 'curb', 0, 0.04, fz + 0.45));
    if (level >= 2) {   // logo cincin di fasad depan
        g.add(mesh(A, THREE, A.tor(0.34, 0.06), 'glow', 0, HQ_H[level] - 0.55, fz + 0.05));
    }
    // papan nama perusahaan (nama dari game) + lampu peringatan saat kas negatif
    var fl = A.flavor;
    if (fl && fl.brand) {
        g.add(mesh(A, THREE, A.box(2.0, 0.3, 0.05), 'roof', 0, 1.38, fz + 0.03));
        var sgn = new THREE.Mesh(A.vplane(1.9, 0.24), A.signMat(fl.brand));
        sgn.position.set(0, 1.38, fz + 0.065);
        sgn.raycast = function () {};
        g.add(sgn);
        if (fl.warn) {
            addBeacon(g, A, THREE, -1.12, 1.38, fz + 0.08);
            addBeacon(g, A, THREE, 1.12, 1.38, fz + 0.08);
        }
    }

    // ---- ornamen era ----
    var topY = HQ_H[level] + 0.14;
    var sx = HQ_W[level] / 2 - 0.6;
    if (eraIdx <= 1) {   // antena batang + lampu merah
        g.add(mesh(A, THREE, A.cyl(0.04, 0.05, 1.3, 6), 'metal', sx, topY + 0.65, -0.6));
        addBeacon(g, A, THREE, sx, topY + 1.35, -0.6);
    }
    if (eraIdx >= 2) {   // parabola
        g.add(mesh(A, THREE, A.cyl(0.04, 0.04, 0.4, 6), 'metal', -0.4, topY + 0.2, 0.9));
        var dish = mesh(A, THREE, A.cyl(0.45, 0.08, 0.14, 10), 'metal', -0.4, topY + 0.45, 0.9);
        dish.rotation.x = -0.7;
        g.add(dish);
    }
    if (eraIdx >= 4) {   // panel surya
        addSolar(g, A, THREE, 1.0, 0.8, topY, sx, 0.6);
        addSolar(g, A, THREE, 1.0, 0.8, topY, sx, -0.5);
    }
    if (eraIdx >= 5) {   // cincin cahaya di plaza
        var ring = mesh(A, THREE, A.tor(3.25, 0.06), 'glow', 0, 0.06, 0);
        ring.rotation.x = Math.PI / 2;
        g.add(ring);
    }
    if (level >= 3) {    // helipad di sayap rendah
        g.add(mesh(A, THREE, A.cyl(0.7, 0.7, 0.04, 14), 'metal', 3.25, 1.76, 0.3));
        g.add(mesh(A, THREE, A.box(0.1, 0.02, 0.5), 'wall', 3.1, 1.795, 0.3));
        g.add(mesh(A, THREE, A.box(0.1, 0.02, 0.5), 'wall', 3.4, 1.795, 0.3));
        g.add(mesh(A, THREE, A.box(0.3, 0.02, 0.1), 'wall', 3.25, 1.795, 0.3));
    }
    if (level === 4) {   // menara: antena + lampu peringatan
        if (eraIdx < 6) {
            g.add(mesh(A, THREE, A.cyl(0.02, 0.035, 1.1, 6), 'metal', -1.2, 7.14 + 0.55, -0.6));
            addBeacon(g, A, THREE, -1.2, 7.14 + 1.15, -0.6);
        }
    }
    if (eraIdx >= 6) {   // orb di puncak
        var ox = level === 4 ? -1.2 : 0, oz = level === 4 ? -0.6 : 0;
        var oy = (level === 4 ? 7.14 : topY) + 0.45;
        g.add(mesh(A, THREE, A.sph(0.28, 10, 8), 'glow', ox, oy, oz));
    }
    g.userData.id = 'hq'; g.userData.level = level;
    return g;
}

// ============================================================
// BANGUNAN SLOT
// ============================================================
function buildLab(A, THREE, level, eraIdx) {
    var g = new THREE.Group();
    var D = [null, [2.2, 1.4, 1.8, 1], [2.6, 2.2, 2.0, 2], [2.8, 3.0, 2.2, 3]][level];
    addBlock(g, A, THREE, D[0], D[1], D[2], 0, 0, D[3]);
    addDoor(g, A, THREE, 0, 0, D[2], 0.45, 0.8);
    if (level === 1) addRoofGear(g, A, THREE, D[0], D[2], D[1] + 0.17, 0, 0);
    if (level >= 2) {
        g.add(mesh(A, THREE, A.sph(0.55, 10, 8), 'window', -0.4, D[1] + 0.24, 0));
        var rg = mesh(A, THREE, A.tor(0.55, 0.04), 'metal', -0.4, D[1] + 0.17, 0);
        rg.rotation.x = Math.PI / 2;
        g.add(rg);
        // rumah kaca di depan
        g.add(mesh(A, THREE, A.box(0.9, 0.5, 0.7), 'window', -0.6, 0.12 + 0.25, D[2] / 2 + 0.45));
        g.add(mesh(A, THREE, A.box(1.0, 0.05, 0.8), 'roof', -0.6, 0.12 + 0.52, D[2] / 2 + 0.45));
    }
    if (level >= 3) {
        g.add(mesh(A, THREE, A.cyl(0.04, 0.05, 1.2, 6), 'metal', 0.8, D[1] + 0.74, 0.5));
        addBeacon(g, A, THREE, 0.8, D[1] + 1.38, 0.5);
        g.add(mesh(A, THREE, A.cyl(0.04, 0.04, 0.3, 6), 'metal', 0.9, D[1] + 0.32, -0.5));
        var dish = mesh(A, THREE, A.cyl(0.3, 0.06, 0.1, 10), 'metal', 0.9, D[1] + 0.55, -0.5);
        dish.rotation.x = -0.6;
        g.add(dish);
    }
    if (A.flavor && A.flavor.research) {   // riset berjalan: cincin atom berputar di atas atap
        var at = atomRings(A, THREE, 0.34);
        at.position.set(level >= 2 ? -0.4 : 0, D[1] + (level >= 2 ? 1.1 : 0.7), 0);
        g.add(at);
        addSpin(g, at, 1.7);
    }
    return g;
}

function buildFactory(A, THREE, level, eraIdx) {
    var g = new THREE.Group();
    var W = [0, 3.2, 3.4, 3.6][level], H = [0, 1.3, 1.5, 1.8][level], D = [0, 2.4, 2.5, 2.6][level];
    addBlock(g, A, THREE, W, H, D, 0, 0, level >= 3 ? 2 : 1);
    if (level >= 2) addBlock(g, A, THREE, 2.0, 1.2, 2.0, -0.4, -(D / 2 + 1.0), 1, true);
    addDoor(g, A, THREE, 0, 0, D, -W * 0.25, 1.0);
    // cerobong (posisi HARUS tetap: dipakai CampusLife untuk asap)
    for (var i = 0; i < level; i++) {
        var ch = 1.9 + i * 0.3;
        g.add(mesh(A, THREE, A.cyl(0.2, 0.26, ch, 8), 'metal', W / 2 - 0.5 - i * 0.7, H + 0.14 + ch / 2, 0.3));
        g.add(mesh(A, THREE, A.cyl(0.26, 0.26, 0.08, 8), 'roof', W / 2 - 0.5 - i * 0.7, H + 0.14 + ch, 0.3));
    }
    // atap gigi gergaji (skylight) di bagian belakang
    for (var r = 0; r < level - 1; r++) {
        var rid = mesh(A, THREE, A.cyl(0.55, 0.55, D - 1.3, 3), 'roof', -W / 2 + 0.7 + r * 1.0, H + 0.14 + 0.15, -0.45);
        rid.rotation.x = -Math.PI / 2;
        rid.scale.set(1, 1, 0.55);
        g.add(rid);
    }
    if (level >= 2) {
        // tangki penyimpanan
        g.add(mesh(A, THREE, A.cyl(0.35, 0.35, 0.9, 10), 'metal', -W / 2 - 0.5, 0.45, 0.2));
        g.add(mesh(A, THREE, A.sph(0.35, 8, 5), 'wall', -W / 2 - 0.5, 0.9, 0.2));
        // dok bongkar-muat + truk parkir
        g.add(mesh(A, THREE, A.box(0.5, 0.3, 1.2), 'curb', W / 2 + 0.25, 0.15, -0.2));
        g.add(mesh(A, THREE, A.box(0.5, 0.5, 0.95), 'wall', W / 2 + 1.05, 0.4, -0.1));
        g.add(mesh(A, THREE, A.box(0.5, 0.35, 0.3), 'roof', W / 2 + 1.05, 0.33, 0.55));
    }
    if (eraIdx >= 4) addSolar(g, A, THREE, W * 0.4, D * 0.4, H + 0.14, -W * 0.2, -0.2);
    // wafer silikon di atap (pabrik CHIP): berputar + jalur produksi menyala saat Fab memproduksi
    var busy = !!(A.flavor && A.flavor.fabBusy);
    var wf = new THREE.Group();
    wf.position.set(-W * 0.25, H + 0.14 + 0.3, 0.75);
    wf.add(mesh(A, THREE, A.cyl(0.3, 0.3, 0.03, 20), 'gold', 0, 0, 0));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (o) {
        wf.add(mesh(A, THREE, A.box(0.12, 0.02, 0.12), 'window', o[0] * 0.1, 0.02, o[1] * 0.1));
    });
    g.add(mesh(A, THREE, A.cyl(0.025, 0.025, 0.3, 6), 'metal', -W * 0.25, H + 0.14 + 0.15, 0.75));
    g.add(wf);
    if (busy) {
        addSpin(g, wf, 1.4);
        g.add(mesh(A, THREE, A.box(W * 0.4, 0.12, 0.04), 'glow', W * 0.18, 0.55, D / 2 + 0.04));
    }
    return g;
}

function buildStore(A, THREE, level, eraIdx) {
    var g = new THREE.Group();
    var D = [null, [2.0, 1.0, 1.6], [2.4, 1.6, 1.8], [2.8, 2.2, 2.0]][level];
    var w = D[0], h = D[1], d = D[2];
    addBlock(g, A, THREE, w, h, d, 0, 0, 1);
    // etalase kaca besar + pintu
    var gh = Math.min(h - 0.45, 0.8);
    g.add(mesh(A, THREE, A.box(w * 0.55, gh, 0.05), 'window', -w * 0.15, 0.12 + gh / 2, d / 2 + 0.07));
    g.add(mesh(A, THREE, A.box(0.4, 0.62, 0.06), 'window', w * 0.3, 0.12 + 0.31, d / 2 + 0.07));
    // kanopi belang 3 jalur
    var awY = 0.12 + gh + 0.1;
    ['roof', 'wall', 'roof'].forEach(function (role, i) {
        var s = mesh(A, THREE, A.box(w / 3, 0.05, 0.5), role, (i - 1) * (w / 3), awY, d / 2 + 0.3);
        s.rotation.x = 0.25;
        g.add(s);
    });
    // tanaman pot
    g.add(mesh(A, THREE, A.cyl(0.12, 0.09, 0.2, 7), 'curb', -w / 2 + 0.2, 0.1, d / 2 + 0.6));
    g.add(mesh(A, THREE, A.sph(0.16, 6, 5), 'leaf', -w / 2 + 0.2, 0.32, d / 2 + 0.6));
    if (level >= 2) {
        g.add(mesh(A, THREE, A.box(w * 0.5, 0.35, 0.06), 'glow', 0, h + 0.32, d / 2 - 0.1));
        g.add(mesh(A, THREE, A.tor(0.13, 0.03), 'wall', 0, h + 0.32, d / 2 - 0.05));
    }
    if (level >= 3) {
        g.add(mesh(A, THREE, A.cyl(0.05, 0.05, 2.0, 6), 'metal', w / 2 + 0.3, 1.0, d / 2));
        g.add(mesh(A, THREE, A.box(0.9, 0.5, 0.08), 'glow', w / 2 + 0.3, 2.1, d / 2));
    }
    if (level < 3) g.add(mesh(A, THREE, A.box(0.34, 0.2, 0.3), 'metal', w * 0.3, h + 0.27, -d * 0.25));
    if (eraIdx >= 4) addSolar(g, A, THREE, w * 0.4, d * 0.4, h + 0.14, -w * 0.2, -0.1);
    // etalase atap: model ponsel PRODUK TERBARU pemain (bentuk, warna, layar sesuai game)
    var hero = A.flavor && A.flavor.hero;
    if (hero) {
        var px = w * 0.27, pz = d * 0.12, py = h + 0.14;
        g.add(mesh(A, THREE, A.cyl(0.2, 0.24, 0.12, 12), 'metal', px, py + 0.06, pz));
        var tr = mesh(A, THREE, A.tor(0.22, 0.015), 'glow', px, py + 0.13, pz);
        tr.rotation.x = Math.PI / 2;
        g.add(tr);
        var pv = new THREE.Group();
        pv.position.set(px, py + 0.12, pz);
        pv.rotation.y = Math.PI / 4;
        var ph = buildPhone(A, THREE, hero.kind, hero.color, eraIdx);
        ph.scale.setScalar(1.15);
        pv.add(ph);
        g.add(pv);
        addSpin(g, pv, 0.8);
    }
    return g;
}

function buildOS(A, THREE, level, eraIdx) {
    var g = new THREE.Group();
    addBlock(g, A, THREE, 2.0, 1.2, 1.6, 0, 0, 1);
    g.add(mesh(A, THREE, A.cyl(0.04, 0.04, 0.5, 6), 'metal', 0.5, 1.14 + 0.25, 0));
    var dish = mesh(A, THREE, A.cyl(0.35, 0.06, 0.12, 10), 'metal', 0.5, 1.14 + 0.55, 0);
    dish.rotation.x = -0.6;
    g.add(dish);
    if (level >= 2) addBlock(g, A, THREE, 1.4, 1.8, 1.4, 1.7, -0.1, 2, true);
    if (level >= 3) addBlock(g, A, THREE, 1.4, 2.4, 1.4, -1.7, 0.1, 3, true);
    // modul rak server di depan (1 per level) + LED
    var ledRole = (A.flavor && A.flavor.osBugs > 0) ? 'beacon' : 'glow';   // bug aktif -> LED server merah
    for (var i = 0; i < level; i++) {
        var mx = -0.55 + i * 0.6;
        g.add(mesh(A, THREE, A.box(0.46, 0.5, 0.3), 'metal', mx, 0.25, 1.05));
        g.add(mesh(A, THREE, A.box(0.34, 0.05, 0.02), ledRole, mx, 0.38, 1.21));
        g.add(mesh(A, THREE, A.box(0.34, 0.05, 0.02), ledRole, mx, 0.2, 1.21));
    }
    if (A.flavor && A.flavor.osBusy) {   // versi OS baru sedang dikembangkan
        var oh = atomRings(A, THREE, 0.3);
        oh.position.set(0, 1.14 + 0.85, 0.1);
        g.add(oh);
        addSpin(g, oh, 2.0);
    }
    // unit pendingin di atap
    g.add(mesh(A, THREE, A.cyl(0.24, 0.24, 0.16, 10), 'metal', -0.5, 1.14 + 0.08, -0.1));
    g.add(mesh(A, THREE, A.cyl(0.18, 0.18, 0.02, 10), 'wall', -0.5, 1.14 + 0.17, -0.1));
    if (level >= 3) {   // bola hologram di atas menara tertinggi
        g.add(mesh(A, THREE, A.sph(0.3, 10, 8), 'glow', -1.7, 2.54 + 0.55, 0.1));
        var hr = mesh(A, THREE, A.tor(0.42, 0.025), 'glow', -1.7, 2.54 + 0.55, 0.1);
        hr.rotation.x = Math.PI / 2.4;
        g.add(hr);
    }
    if (eraIdx >= 4) addSolar(g, A, THREE, 0.8, 0.6, 1.34, -0.4, 0);
    return g;
}

function buildMonument(A, THREE, level, eraIdx) {
    var g = new THREE.Group();
    g.position.y = 0.08; // di atas plaza
    var colH = level >= 2 ? 1.8 : 1.2;
    g.add(mesh(A, THREE, A.cyl(0.78, 0.88, 0.14, 12), 'curb', 0, 0.07, 0));
    g.add(mesh(A, THREE, A.cyl(0.55, 0.65, 0.3, 10), 'wall', 0, 0.29, 0));
    g.add(mesh(A, THREE, A.cyl(0.14, 0.2, colH, 8), 'metal', 0, 0.44 + colH / 2, 0));
    var topY = 0.44 + colH;
    if (level >= 2) {
        // bintang emas (oktahedron) + cincin laurel
        g.add(mesh(A, THREE, A.cone(0.3, 0.45, 4), 'gold', 0, topY + 0.42, 0));
        var dn = mesh(A, THREE, A.cone(0.3, 0.45, 4), 'gold', 0, topY + 0.0, 0);
        dn.rotation.x = Math.PI;
        g.add(dn);
        var lr = mesh(A, THREE, A.tor(0.3, 0.035), 'gold', 0, 0.44 + colH * 0.55, 0);
        lr.rotation.x = Math.PI / 2;
        g.add(lr);
        g.add(mesh(A, THREE, A.sph(0.12, 8, 6), 'glow', 0, topY + 0.21, 0));
    } else {
        g.add(mesh(A, THREE, A.sph(0.34, 10, 8), 'roof', 0, topY + 0.25, 0));
    }
    return g;
}

function buildBillboard(A, THREE, level, eraIdx) {
    var g = new THREE.Group();
    g.add(mesh(A, THREE, A.cyl(0.07, 0.07, 1.8, 6), 'metal', -0.7, 0.9, 0));
    g.add(mesh(A, THREE, A.cyl(0.07, 0.07, 1.8, 6), 'metal', 0.7, 0.9, 0));
    g.add(mesh(A, THREE, A.box(2.0, 1.0, 0.12), 'roof', 0, 2.2, 0));
    g.add(mesh(A, THREE, A.box(1.8, 0.8, 0.04), 'glow', 0, 2.2, 0.08));          // layar
    g.add(mesh(A, THREE, A.box(1.0, 0.1, 0.02), 'wall', -0.25, 2.32, 0.105));    // isi layar
    var bh = A.flavor && A.flavor.hero;
    if (bh) {   // iklan menampilkan ponsel produk terbaru
        var bp = buildPhone(A, THREE, bh.kind, bh.color, eraIdx);
        bp.scale.setScalar(0.72);
        bp.position.set(0.55, 1.95, 0.11);
        g.add(bp);
        g.add(mesh(A, THREE, A.box(0.6, 0.1, 0.02), 'wall', -0.45, 2.1, 0.105));
    } else {
        g.add(mesh(A, THREE, A.box(0.6, 0.1, 0.02), 'wall', -0.45, 2.1, 0.105));
    }
    g.add(mesh(A, THREE, A.box(1.8, 0.12, 0.14), 'glow', 0, 1.62, 0));
    g.add(mesh(A, THREE, A.box(2.1, 0.05, 0.28), 'metal', 0, 1.5, 0));           // catwalk
    // lampu sorot di atas
    g.add(mesh(A, THREE, A.box(2.0, 0.05, 0.05), 'metal', 0, 2.78, 0.3));
    [-0.7, 0, 0.7].forEach(function (x) {
        g.add(mesh(A, THREE, A.box(0.04, 0.04, 0.3), 'metal', x, 2.78, 0.15));
        g.add(mesh(A, THREE, A.sph(0.07, 6, 5), 'lamp', x, 2.76, 0.32));
    });
    g.rotation.y = Math.PI / 4;   // hadap kamera isometrik
    return g;
}

// ============================================================
// BANGUNAN BARU (perluasan peta)
// ============================================================

// Akademi Inovasi: blok utama + bendera; Lv2 sayap + pergola; Lv3 perpustakaan berkubah + menara jam.
function buildAcademy(A, THREE, level, eraIdx) {
    var g = new THREE.Group();
    g.add(mesh(A, THREE, A.box(5.4, 0.06, 4.2), 'plaza', 0, 0.03, 0.3));
    var D = [null, [2.6, 1.3, 1.8, 1], [3.0, 1.9, 2.0, 2], [3.2, 2.5, 2.2, 3]][level];
    addBlock(g, A, THREE, D[0], D[1], D[2], 0, 0, D[3]);
    addDoor(g, A, THREE, 0, 0, D[2], 0, 1.0);
    // tiang bendera + bendera
    var fx = D[0] / 2 - 0.3, fz = D[2] / 2 - 0.3, fy = D[1] + 0.14;
    g.add(mesh(A, THREE, A.cyl(0.025, 0.03, 1.4, 6), 'metal', fx, fy + 0.7, fz));
    g.add(mesh(A, THREE, A.box(0.5, 0.28, 0.02), 'roof', fx + 0.26, fy + 1.2, fz));
    if (level >= 2) {
        // sayap kiri + pergola di halaman depan
        addBlock(g, A, THREE, 1.5, 1.2, 1.7, -(D[0] / 2 + 0.85), 0.2, 1, true);
        g.add(mesh(A, THREE, A.box(2.4, 0.05, 0.8), 'roof', 0.2, 0.95, D[2] / 2 + 0.95));
        [[-0.9, 0.6], [1.3, 0.6], [-0.9, 1.3], [1.3, 1.3]].forEach(function (o) {
            g.add(mesh(A, THREE, A.cyl(0.04, 0.04, 0.9, 6), 'wall', o[0], 0.5, D[2] / 2 + o[1] + 0.1));
        });
        g.add(mesh(A, THREE, A.box(0.5, 0.2, 0.2), 'trunk', 0.2, 0.18, D[2] / 2 + 1.1));   // bangku
    }
    if (level >= 3) {
        // perpustakaan berkubah di sayap kanan + menara jam
        addBlock(g, A, THREE, 1.5, 1.4, 1.6, D[0] / 2 + 0.85, 0.2, 1, true);
        g.add(mesh(A, THREE, A.sph(0.62, 12, 8), 'window', D[0] / 2 + 0.85, 1.4 + 0.2, 0.2));
        addBlock(g, A, THREE, 0.8, 3.7, 0.8, -D[0] / 2 + 0.5, -0.6, 6, true);
        var tx = -D[0] / 2 + 0.5, ty = 3.7 + 0.14;
        g.add(mesh(A, THREE, A.cone(0.55, 0.7, 4), 'roof', tx, ty + 0.35, -0.6));
        var clk = mesh(A, THREE, A.cyl(0.2, 0.2, 0.05, 12), 'gold', tx, 3.2, -0.6 + 0.43);
        clk.rotation.x = Math.PI / 2;
        g.add(clk);
        addBeacon(g, A, THREE, tx, ty + 0.78, -0.6);
    }
    if (eraIdx >= 4) addSolar(g, A, THREE, D[0] * 0.4, D[2] * 0.4, D[1] + 0.14, -D[0] * 0.2, -0.1);
    return g;
}

// Arena Peluncuran: stadion oval (tribun 16 segmen), lampu sorot, kanopi (Lv2), layar raksasa (Lv3).
function buildArena(A, THREE, level, eraIdx) {
    var g = new THREE.Group();
    var R = [0, 2.0, 2.2, 2.4][level], H = [0, 0.9, 1.2, 1.5][level];
    var N = 16, i;
    g.add(mesh(A, THREE, A.cyl(3.3, 3.3, 0.06, 26), 'plaza', 0, 0.03, 0));
    var chord = Math.round((2 * R * Math.sin(Math.PI / N) + 0.08) * 100) / 100;
    var wall = [], band = [], seats = [];
    for (i = 0; i < N; i++) {
        var a = (i / N) * Math.PI * 2, th = -(a + Math.PI / 2);
        wall.push([Math.cos(a) * R, 0.06 + H / 2, Math.sin(a) * R, 1, 1, 1, th]);
        band.push([Math.cos(a) * R, 0.06 + H + 0.05, Math.sin(a) * R, 1, 1, 1, th]);
        seats.push([Math.cos(a) * (R - 0.42), 0.06 + H * 0.3, Math.sin(a) * (R - 0.42), 1, 1, 1, th]);
    }
    g.add(instanced(A, THREE, A.box(chord, H, 0.5), 'wall', wall));
    g.add(instanced(A, THREE, A.box(chord, 0.1, 0.62), 'roof', band));
    g.add(instanced(A, THREE, A.box(chord * 0.92, H * 0.6, 0.4), 'curb', seats));
    // lapangan + garis
    g.add(mesh(A, THREE, A.cyl(R - 0.85, R - 0.85, 0.05, 20), 'leaf', 0, 0.08, 0));
    g.add(mesh(A, THREE, A.box(0.05, 0.012, (R - 1.0) * 1.7), 'wall', 0, 0.112, 0));
    var cc = mesh(A, THREE, A.tor(0.32, 0.014), 'wall', 0, 0.114, 0);
    cc.rotation.x = Math.PI / 2;
    g.add(cc);
    // menara lampu sorot di 4 sudut
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(function (c) {
        var tx = c[0] * (R + 0.2) * Math.SQRT1_2, tz = c[1] * (R + 0.2) * Math.SQRT1_2;
        g.add(mesh(A, THREE, A.cyl(0.04, 0.06, H + 1.5, 6), 'metal', tx, (H + 1.5) / 2 + 0.06, tz));
        g.add(mesh(A, THREE, A.box(0.4, 0.14, 0.14), 'lamp', tx, H + 1.62, tz));
    });
    // panggung peluncuran di tengah lapangan: ponsel produk terbaru berputar; cincin atom saat produk disiapkan
    var ah = A.flavor && A.flavor.hero;
    if (ah) {
        g.add(mesh(A, THREE, A.cyl(0.42, 0.46, 0.16, 16), 'curb', 0, 0.18, 0));
        var st = mesh(A, THREE, A.tor(0.4, 0.018), 'glow', 0, 0.27, 0);
        st.rotation.x = Math.PI / 2;
        g.add(st);
        var ap = new THREE.Group();
        ap.position.set(0, 0.26, 0);
        ap.rotation.y = Math.PI / 4;
        var aph = buildPhone(A, THREE, ah.kind, ah.color, eraIdx);
        aph.scale.setScalar(1.5);
        ap.add(aph);
        g.add(ap);
        addSpin(g, ap, 0.9);
        if (A.flavor.launch) {
            var lr = atomRings(A, THREE, 0.62);
            lr.position.set(0, 0.8, 0);
            g.add(lr);
            addSpin(g, lr, 1.6);
        }
    }
    // gerbang masuk menghadap kamera (+x,+z)
    var ex = R * Math.SQRT1_2 + 0.15;
    g.add(mesh(A, THREE, A.box(0.9, 0.7, 0.5), 'window', ex, 0.4, ex));
    g.children[g.children.length - 1].rotation.y = Math.PI / 4;
    if (level >= 2) {
        // kanopi cincin + penyangga
        var cp = mesh(A, THREE, A.tor(R - 0.1, 0.1), 'roof', 0, H + 0.95, 0);
        cp.rotation.x = Math.PI / 2;
        g.add(cp);
        for (i = 0; i < 8; i++) {
            var pa = (i / 8) * Math.PI * 2;
            g.add(mesh(A, THREE, A.cyl(0.03, 0.03, 0.85, 5), 'metal', Math.cos(pa) * (R - 0.1), H + 0.5, Math.sin(pa) * (R - 0.1)));
        }
    }
    if (level >= 3) {
        // layar raksasa + tiang bendera di pintu masuk
        var sc = new THREE.Group();
        sc.add(mesh(A, THREE, A.cyl(0.05, 0.06, 2.2, 6), 'metal', 0, 1.1, 0));
        sc.add(mesh(A, THREE, A.box(1.7, 0.8, 0.1), 'roof', 0, 2.4, 0));
        sc.add(mesh(A, THREE, A.box(1.5, 0.6, 0.04), 'glow', 0, 2.4, 0.07));
        sc.position.set(-0.6, H + 0.2, -0.6);
        sc.rotation.y = Math.PI / 4;
        g.add(sc);
        [0.7, -0.7].forEach(function (o) {
            g.add(mesh(A, THREE, A.cyl(0.02, 0.03, 1.4, 5), 'metal', ex + 0.9 + o * 0.3, 0.7, ex - 0.2 - o * 0.3));
            g.add(mesh(A, THREE, A.box(0.3, 0.18, 0.02), 'roof', ex + 1.05 + o * 0.3, 1.25, ex - 0.2 - o * 0.3));
        });
    }
    return g;
}

// Pelabuhan Logistik: apron + kontainer bertumpuk + kantor + derek portal di dermaga.
// Kapal kargo digerakkan oleh CampusLife (Lv2+); posisi dermaga HARUS tetap (BAY / slot port).
function buildPort(A, THREE, level, eraIdx) {
    var g = new THREE.Group();
    var i, r, c, s;
    g.add(mesh(A, THREE, A.box(5.4, 0.06, 3.0), 'plaza', 0, 0.03, 0));
    g.add(mesh(A, THREE, A.box(1.2, 0.1, 4.4), 'plaza', 0, 0.06, 3.05));      // dermaga masuk ke teluk
    // kontainer: rows x cols x stack, warna bergilir
    var cfg = [null, [2, 2, 1], [3, 2, 2], [3, 3, 2]][level];
    var roles = ['roof', 'gold', 'flowerA', 'metal'];
    var buckets = [[], [], [], []];
    for (r = 0; r < cfg[0]; r++) {
        for (c = 0; c < cfg[1]; c++) {
            for (s = 0; s < cfg[2]; s++) {
                buckets[(r + c * 2 + s) % 4].push([-2.3 + c * 0.78, 0.06 + 0.15 + s * 0.3, -1.05 + r * 0.42, 1, 1, 1, 0]);
            }
        }
    }
    for (i = 0; i < 4; i++) if (buckets[i].length) g.add(instanced(A, THREE, A.box(0.7, 0.28, 0.34), roles[i], buckets[i]));
    // kantor pelabuhan
    addBlock(g, A, THREE, 1.2, 1.0, 1.0, 2.0, -0.4, 1, true);
    g.add(mesh(A, THREE, A.box(0.4, 0.2, 0.3), 'metal', 2.2, 1.27, -0.4));
    // derek portal di dermaga (boom menjulur ke atas kapal)
    function crane(zc) {
        [[-0.55, -0.4], [0.55, -0.4], [-0.55, 0.4], [0.55, 0.4]].forEach(function (o) {
            g.add(mesh(A, THREE, A.box(0.06, 1.4, 0.06), 'metal', o[0], 0.8, zc + o[1]));
        });
        g.add(mesh(A, THREE, A.box(1.3, 0.08, 0.9), 'roof', 0, 1.52, zc));
        g.add(mesh(A, THREE, A.box(2.9, 0.07, 0.1), 'roof', 0.9, 1.62, zc));
        g.add(mesh(A, THREE, A.box(0.3, 0.2, 0.3), 'wall', 0.2, 1.4, zc));
        g.add(mesh(A, THREE, A.cyl(0.01, 0.01, 0.9, 4), 'metal', 1.9, 1.15, zc));
        g.add(mesh(A, THREE, A.box(0.3, 0.06, 0.2), 'glow', 1.9, 0.68, zc));
    }
    crane(2.6);
    if (level >= 3) {
        crane(4.1);
        addBlock(g, A, THREE, 0.7, 2.2, 0.7, 2.3, 1.0, 4, true);   // menara kontrol
        addBeacon(g, A, THREE, 2.3, 2.5, 1.0);
    }
    // tiang lampu sorot
    g.add(mesh(A, THREE, A.cyl(0.04, 0.05, 1.5, 6), 'metal', -2.5, 0.8, 1.2));
    g.add(mesh(A, THREE, A.sph(0.1, 8, 6), 'lamp', -2.5, 1.6, 1.2));
    if (eraIdx >= 4) addSolar(g, A, THREE, 0.9, 0.7, 1.14, 2.0, -0.4);
    return g;
}

// Ladang angin: 3 turbin di tepi utara. Rotor disimpan di userData.rotors
// supaya CampusLife bisa memutarnya.
export function buildWind(A, THREE) {
    var g = new THREE.Group();
    var rotors = [];
    WIND_SPOTS.forEach(function (p, k) {
        var t = new THREE.Group();
        t.add(mesh(A, THREE, A.cyl(0.07, 0.13, 2.8, 8), 'wall', 0, 1.4, 0));
        t.add(mesh(A, THREE, A.cyl(0.16, 0.16, 0.06, 8), 'curb', 0, 0.03, 0));
        t.add(mesh(A, THREE, A.box(0.2, 0.18, 0.46), 'metal', 0, 2.86, 0));
        var hub = new THREE.Group();
        hub.position.set(0, 2.86, 0.3);
        hub.add(mesh(A, THREE, A.sph(0.1, 8, 6), 'roof', 0, 0, 0));
        for (var b = 0; b < 3; b++) {
            var arm = new THREE.Group();
            arm.rotation.z = (b / 3) * Math.PI * 2;
            arm.add(mesh(A, THREE, A.box(0.1, 1.15, 0.03), 'wall', 0, 0.62, 0));
            hub.add(arm);
        }
        t.add(hub);
        rotors.push(hub);
        t.rotation.y = Math.PI / 4 + (k - 1) * 0.12;
        t.position.set(p[0], 0, p[1]);
        g.add(t);
    });
    g.userData = { id: 'wind', level: 1, rotors: rotors };
    return g;
}

// Monorail layang sepanjang tepi utara: tiang, dek, pagar, stasiun + lift.
// Kereta bergerak ada di CampusLife (z/y harus sama dengan RAIL).
export function buildRail(A, THREE) {
    var g = new THREE.Group();
    var len = RAIL.x1 - RAIL.x0, cx = (RAIL.x0 + RAIL.x1) / 2;
    var pillars = [], i;
    for (i = RAIL.x0 + 1; i <= RAIL.x1 - 1; i += 3.25) pillars.push([i, RAIL.y / 2, RAIL.z, 1, 1, 1, 0]);
    g.add(instanced(A, THREE, A.cyl(0.12, 0.17, RAIL.y, 8), 'metal', pillars));
    g.add(mesh(A, THREE, A.box(len, 0.14, 0.8), 'curb', cx, RAIL.y, RAIL.z));
    g.add(mesh(A, THREE, A.box(len, 0.04, 0.05), 'metal', cx, RAIL.y + 0.14, RAIL.z - 0.36));
    g.add(mesh(A, THREE, A.box(len, 0.04, 0.05), 'metal', cx, RAIL.y + 0.14, RAIL.z + 0.36));
    // stasiun: peron, atap, tiang, lift kaca
    var sx = RAIL.stationX;
    g.add(mesh(A, THREE, A.box(3.4, 0.1, 1.5), 'plaza', sx, RAIL.y + 0.01, RAIL.z + 0.35));
    g.add(mesh(A, THREE, A.box(3.4, 0.07, 1.6), 'roof', sx, RAIL.y + 1.05, RAIL.z + 0.35));
    [[-1.5, 0.95], [1.5, 0.95], [-1.5, -0.2], [1.5, -0.2]].forEach(function (o) {
        g.add(mesh(A, THREE, A.cyl(0.04, 0.04, 1.05, 6), 'wall', sx + o[0], RAIL.y + 0.55, RAIL.z + o[1]));
    });
    g.add(mesh(A, THREE, A.box(0.8, RAIL.y + 0.1, 0.8), 'window', sx + 2.4, (RAIL.y + 0.1) / 2, RAIL.z + 0.5));
    g.add(mesh(A, THREE, A.box(0.9, 0.08, 0.9), 'roof', sx + 2.4, RAIL.y + 0.14, RAIL.z + 0.5));
    g.add(mesh(A, THREE, A.box(1.2, 0.2, 0.05), 'glow', sx, RAIL.y + 0.86, RAIL.z + 1.1));
    g.userData = { id: 'rail', level: 1 };
    return g;
}

var SLOT_BUILDERS = {
    lab: buildLab, factory: buildFactory, store: buildStore,
    os: buildOS, monument: buildMonument, billboard: buildBillboard,
    academy: buildAcademy, arena: buildArena, port: buildPort
};

// Bangun bangunan slot lengkap dengan posisi & userData.
export function buildSlot(A, THREE, id, level, eraIdx) {
    var fn = SLOT_BUILDERS[id];
    if (!fn || !level) return null;
    A.variantSeed = VARIANT_SEED[id] || 0;
    A.roofAlt = !!ROOF_ALT[id];
    var g = fn(A, THREE, level, eraIdx || 0);
    var p = SLOTS[id];
    g.position.x = p[0];
    g.position.z = p[1];
    g.userData.id = id; g.userData.level = level;
    return g;
}

// Blok kawasan kota; makin tinggi di era akhir. 3 varian atap + kanopi toko.
export function buildSprawl(A, THREE, i, eraIdx) {
    A.variantSeed = i; A.roofAlt = (i % 3) === 1;
    var g = new THREE.Group();
    var w = 1.1 + (i % 3) * 0.2;
    var d = 1.0 + ((i + 1) % 3) * 0.2;
    var h = 0.8 + (eraIdx || 0) * 0.38 + (i % 4) * 0.25;
    var floors = Math.max(1, Math.floor(h / 0.9));
    addBlock(g, A, THREE, w, h, d, 0, 0, floors);
    var topY = h + 0.17;
    var v = i % 3;
    if (v === 0) {          // tangki air
        g.add(mesh(A, THREE, A.cyl(0.22, 0.22, 0.4, 8), 'metal', w * 0.2, topY + 0.2, -d * 0.2));
        g.add(mesh(A, THREE, A.cone(0.26, 0.18, 8), 'roof', w * 0.2, topY + 0.49, -d * 0.2));
    } else if (v === 1) {   // antena (+ lampu kalau tinggi)
        g.add(mesh(A, THREE, A.cyl(0.025, 0.035, 0.9, 6), 'metal', w * 0.2, topY + 0.45, -d * 0.2));
        if (h > 1.8) addBeacon(g, A, THREE, w * 0.2, topY + 0.93, -d * 0.2);
    } else {                // blok atas bertingkat
        var up = new THREE.Group();
        up.position.y = h + 0.17;
        addBlock(up, A, THREE, w * 0.6, 0.7, d * 0.6, 0, 0, 1, true);
        g.add(up);
    }
    if (v !== 2) addRoofGear(g, A, THREE, w, d, topY, 0, 0);
    // kanopi toko di lantai dasar
    g.add(mesh(A, THREE, A.box(w * 0.7, 0.05, 0.3), 'roof', 0, 0.62, d / 2 + 0.2));
    if (eraIdx >= 4 && v !== 2) addSolar(g, A, THREE, w * 0.4, d * 0.4, topY, -w * 0.2, d * 0.1);
    var p = SPRAWL_SPOTS[i];
    g.position.x = p[0];
    g.position.z = p[1];
    g.userData = { id: 'sprawl', level: 1 };
    return g;
}
