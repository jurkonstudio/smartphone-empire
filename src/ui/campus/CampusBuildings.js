// FILE: src/ui/campus/CampusBuildings.js  (REPLACE — v2027.65: koridor jembatan ke Pulau Manufaktur bebas pohon/bukit/batu)
// v2027.62 — gedung & aturan level dibaca dari REGISTRI (campus-buildings.data.js): satu sumber
// kebenaran untuk 3D, kartu info, alert, dan panel. + Pabrik Komponen (pcplant) & Pusat Desain
// Chip (chipdesign) yang terhubung ke sistem game. Logika level lama tidak berubah.
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
import {
    CAMPUS_RULES, CAMPUS_SLOTS, CAMPUS_SLOT_ORDER, CAMPUS_BY_ID, CAMPUS_RESERVED, CAMPUS_ROADS, campusLevelFor
} from '../../data/campus-buildings.data.js';

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
        ocean: 0x3fa9dc, shallow: 0x86d8e8, foam: 0xf4fbff,
        sand: 0xf1dfae, sandWet: 0xd9c795, rock: 0x98a0aa,
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
        ocean: 0x0d4a78, shallow: 0x1a7a98, foam: 0x9cc4d8,
        sand: 0x7a6f58, sandWet: 0x5e5543, rock: 0x555d68,
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

// ============================================================
// PULAU: garis pantai organik (superellipse + gelombang halus). Inti kampus (±15) selalu di dalam.
// ============================================================
export var ISLAND_R = 22;
export function islandRadius(th, scale) {
    var c = Math.abs(Math.cos(th)), sn = Math.abs(Math.sin(th)), n = 3.2;
    var sup = Math.pow(Math.pow(c, n) + Math.pow(sn, n), -1 / n);
    var wob = 1 + 0.045 * Math.sin(3 * th + 0.8) + 0.03 * Math.sin(5 * th + 2.1) + 0.02 * Math.sin(9 * th + 0.3);
    return ISLAND_R * sup * wob * (scale || 1);
}

function _rng(seed) {
    return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}
// Lahan gedung: pohon/semak/lampu dengan pusat di dalam (+pad) ditiadakan agar tidak menembus bangunan.
function _onReserved(x, z, pad) {
    for (var i = 0; i < CAMPUS_RESERVED.length; i++) {
        var r = CAMPUS_RESERVED[i];
        if (x > r.x0 - pad && x < r.x1 + pad && z > r.z0 - pad && z < r.z1 + pad) return true;
    }
    return false;
}
// Jalan tambahan (Jalan Permukiman): pohon, semak, dan lampu jalan lama tidak boleh berdiri di atasnya.
function _onRoad(x, z, pad) {
    for (var i = 0; i < CAMPUS_ROADS.length; i++) {
        var r = CAMPUS_ROADS[i];
        if (x > r.x0 - pad && x < r.x1 + pad && z > r.z0 - pad && z < r.z1 + pad) return true;
    }
    return false;
}
// Zona inti yang tidak boleh dimasuki dekorasi luar (jalan, teluk, gerbang, monorail, kincir angin).
function _inCore(x, z) { return Math.abs(x) < 16.3 && Math.abs(z) < 16.3; }
function _inland(x, z, margin) { return Math.hypot(x, z) < islandRadius(Math.atan2(z, x)) - margin; }
// v2027.65: koridor jembatan ke Pulau Manufaktur (jalan barat z = 0 menerus ke barat). Dekorasi dikosongkan dari sini.
function _inLinkCorridor(x, z, pad) { return x < -14.5 && Math.abs(z) < 3.4 + (pad || 0); }

// Bukit rendah di pinggiran pulau (setengah bola pipih) -> kedalaman visual, bukan gedung.
export var HILLS = (function () {
    var rnd = _rng(4242), out = [], tries = 0;
    while (out.length < 10 && tries++ < 800) {
        var th = rnd() * Math.PI * 2;
        var r = 17.5 + rnd() * 6.5;
        var x = Math.cos(th) * r, z = Math.sin(th) * r;
        var rad = 1.8 + rnd() * 1.6;
        if (_inCore(x, z) || !_inland(x, z, rad + 2.6)) continue;
        var ok = true;
        for (var i = 0; i < out.length; i++) { if (Math.hypot(out[i][0] - x, out[i][1] - z) < out[i][2] + rad + 1.5) { ok = false; break; } }
        if (ok) out.push([x, z, rad, 0.22 + rnd() * 0.2]);
    }
    return out.filter(function (h) { return !_inLinkCorridor(h[0], h[1], h[2]); });   // bukan di jalur jembatan
})();

// Pohon: 29 di inti kampus + hutan berkelompok di pinggiran pulau (di luar zona inti & bukit).
export const TREE_SPOTS = (function () {
    var base = [
        [-7, -6], [-5.5, -7.5], [-8, 5], [-1.4, -6.6], [2.5, -5.6], [-3, -5.5],
        [4.4, -4.4], [-9.2, 8.8], [-8.0, 2.8], [-9.2, -3.2], [6.4, -8.0], [-2.0, -8.0],
        [12.4, -12.8], [13.6, 4.0], [10.0, -2.0], [5.2, -12.8], [-12.8, 11.2], [-12.8, 13.6],
        [13.6, -9.2], [-12.8, -3.2], [8.8, -12.8], [2.8, -12.8], [-2.0, -12.8], [11.2, 2.8],
        [0.4, -12.8], [-3.2, 13.6], [-11.6, 2.8], [-10.4, 7.6], [-12.8, 7.6]
    ];
    base = base.filter(function (p) { return !_onReserved(p[0], p[1], 0.9) && !_onRoad(p[0], p[1], 0.6); });
    var rnd = _rng(9917), out = base.slice(), outer = [];
    function free(x, z) {
        for (var i = 0; i < HILLS.length; i++) {
            if (Math.hypot(HILLS[i][0] - x, HILLS[i][1] - z) < HILLS[i][2] * 0.95 + 0.4) return false;
        }
        for (var j = 0; j < outer.length; j++) {
            if (Math.hypot(outer[j][0] - x, outer[j][1] - z) < 1.15) return false;
        }
        return true;
    }
    var N = 15;
    for (var i = 0; i < N; i++) {
        var th = (i / N) * Math.PI * 2 + (rnd() - 0.5) * 0.3;
        var cr = islandRadius(th) - 4.6;
        var cx = Math.cos(th) * cr, cz = Math.sin(th) * cr;
        var cnt = 5 + Math.floor(rnd() * 5);
        for (var k = 0; k < cnt * 3 && cnt > 0; k++) {
            var x = cx + (rnd() + rnd() - 1) * 3.4, z = cz + (rnd() + rnd() - 1) * 3.4;
            if (_inCore(x, z) || !_inland(x, z, 2.4) || !free(x, z)) continue;
            outer.push([Math.round(x * 10) / 10, Math.round(z * 10) / 10]);
            if (--cnt === 0) break;
        }
    }
    return out.concat(outer).filter(function (p) { return !_inLinkCorridor(p[0], p[1]); });   // jalur jembatan bebas pohon
})();

// Kolam kecil di utara plaza (dipakai juga oleh CampusLife untuk riak air).
export var POND = { x: 0.5, z: -6, r: 1.4 };

// Teluk di tenggara (tempat Pelabuhan). Dipakai CampusLife untuk kapal.
export var BAY = { x: 11, z: 11.8, w: 7.4, d: 5.8 };

// Posisi slot bangunan (x, z) dan urutannya — dari registri (campus-buildings.data.js).
export var SLOTS = CAMPUS_SLOTS;
export var SLOT_ORDER = CAMPUS_SLOT_ORDER;

// Ladang angin (era Premium+) dan jalur monorail (era Smartphone Matang+).
export var WIND_SPOTS = [[-11.5, -13.2], [-8.2, -13.2], [-4.8, -13.2]];
export var RAIL = { z: -10.2, x0: -13, x1: 13, y: 1.5, stationX: 7.5 };

// Kawasan kota di pinggir peta. Muncul bertahap: 1 + 1 blok per era (maks 6).
// DINONAKTIFKAN: blok kota filler merusak pemandangan & tidak punya fungsi game.
// Dikosongkan (bukan dihapus) agar CampusScene/computePlan tetap kompatibel.
export var SPRAWL_SPOTS = [];

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
// ATURAN LEVEL — dibaca dari registri (campus-buildings.data.js). Ubah angka di sana.
// ============================================================
export var RULES = CAMPUS_RULES;
var RULE_KEYS = Object.keys(RULES);

// Era desain minimum untuk dekorasi era (indeks DESIGN_ERAS).
export var RAIL_MIN_ERA = CAMPUS_BY_ID.rail.minEra;   // Smartphone Matang
export var WIND_MIN_ERA = CAMPUS_BY_ID.wind.minEra;   // Premium

function levelFor(rule, m) { return campusLevelFor(rule, m); }

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
    var sig = eraIdx + '|' + RULE_KEYS.map(function (k) { return levels[k]; }).join(',') + '|' + sprawl +
        '|' + (rail ? 1 : 0) + (wind ? 1 : 0);
    return { eraIdx: eraIdx, era: era, levels: levels, sprawl: sprawl, rail: rail, wind: wind, sig: sig };
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
    'lamp', 'beacon', 'halo', 'roofAlt',
    'ocean', 'shallow', 'foam', 'sand', 'sandWet', 'rock'
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
    ocean: { r: 0.42, m: 0, e: 0.7 }, shallow: { r: 0.4, m: 0, e: 0.7 }, foam: { r: 0.9, m: 0, e: 0.3 },
    sand: { r: 0.95, m: 0, e: 0.35 }, sandWet: { r: 0.9, m: 0, e: 0.35 }, rock: { r: 0.9, m: 0, e: 0.3 },
    flowerA: { r: 0.7, m: 0, e: 0.3 }, flowerB: { r: 0.7, m: 0, e: 0.3 }, lamp: { r: 0.4, m: 0, e: 0.3 }, beacon: { r: 0.4, m: 0, e: 0.3 }
};
// 3 varian fasad (tekstur sama, tint beda) + seed per bangunan -> gedung tidak tampak seperti salinan.
var FACADE_KEYS = ['facade', 'facadeB', 'facadeC'];
var FACADE_TINT = [0xffffff, 0xf2e8d6, 0xdde7f3];
// Seed varian fasad & atap per gedung, dari registri (variant, roofAlt).
var VARIANT_SEED = {};
var ROOF_ALT = {};
Object.keys(CAMPUS_BY_ID).forEach(function (k) {
    VARIANT_SEED[k] = CAMPUS_BY_ID[k].variant || 0;
    ROOF_ALT[k] = !!CAMPUS_BY_ID[k].roofAlt;
});

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
    return {
        THREE: THREE,
        realShadows: !!opts.shadows,
        facadeKeys: FACADE_KEYS,
        variantSeed: 0,          // diatur builder tiap bangunan -> varian fasad deterministik
        roofAlt: false,
        facadeRole: function () { return FACADE_KEYS[Math.abs(this.variantSeed | 0) % FACADE_KEYS.length]; },
        // Geometri kustom (pulau, bukit, batu) ikut di-dispose bersama cache.
        custom: function (key, make) { return cached('x' + key, make); },
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
            facade.dispose();
            noiseTex.dispose(); patchTex.dispose(); aoTex.dispose();
            geos.clear(); mats.clear(); extraMats.length = 0;
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
export var LAMP_SPOTS = [
    [-1.55, 4.6], [-1.55, 6.8], [-1.55, 9.0], [1.55, 4.6], [1.55, 6.8],
    [-1.55, 11.2], [-1.55, 13.4], [1.55, 11.2], [1.55, 13.4],
    [-4.6, 1.55], [-6.8, 1.55], [-9.0, 1.55], [-4.6, -1.55], [-6.8, -1.55], [-9.0, -1.55],
    [-11.2, 1.55], [-13.4, 1.55], [-11.2, -1.55], [-13.4, -1.55]
];
LAMP_SPOTS = LAMP_SPOTS.filter(function (l) { return !_onReserved(l[0], l[1], 0.25) && !_onRoad(l[0], l[1], 0.1); });
export var PLANTERS = [[3.1, 3.1], [3.1, -3.1], [-3.1, -3.1]];

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

// Lempengan berbentuk pulau (outline organik). Atas di y = top, tebal = depth.
// UV cap dipetakan ke 100x100 unit dunia -> kepadatan tekstur rumput sama seperti sebelumnya.
function islandSlab(A, THREE, scale, top, depth, mat) {
    var geo = A.custom('isl' + scale + '_' + depth, function () {
        var sh = new THREE.Shape(), N = 120, i;
        for (i = 0; i < N; i++) {
            var th = (i / N) * Math.PI * 2, r = islandRadius(th, scale);
            var px = Math.cos(th) * r, pz = Math.sin(th) * r;
            if (i === 0) sh.moveTo(px, -pz); else sh.lineTo(px, -pz);
        }
        sh.closePath();
        var g = new THREE.ExtrudeGeometry(sh, { depth: depth, bevelEnabled: false, curveSegments: 1 });
        g.rotateX(-Math.PI / 2);
        var pos = g.attributes.position, uv = g.attributes.uv;
        for (i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 100 + 0.5, pos.getZ(i) / 100 + 0.5);
        uv.needsUpdate = true;
        return g;
    });
    var m = new THREE.Mesh(geo, mat);
    m.position.y = top - depth;
    return m;
}

// Pulau berlapis: rumput -> pasir -> pasir basah. Laut (perairan dangkal, busa, ombak) TIDAK lagi
// dibuat dari lempengan statis di sini: digambar shader SeaWater.js (dibuat oleh CampusScene).
function addIsland(g, A, THREE) {
    g.add(islandSlab(A, THREE, 1.08, -0.26, 0.5, A.mat('sandWet')));
    g.add(islandSlab(A, THREE, 1.05, -0.03, 0.7, A.mat('sand')));
    g.add(islandSlab(A, THREE, 1.0, 0, 0.7, [A.mat('grass'), A.mat('soil')]));
}

// Pemandangan alami: bukit, batu pantai, bercak rumput. TANPA gedung dekoratif.
function addScenery(g, A, THREE) {
    var i, rnd = _rng(1357);

    // bukit rendah
    if (HILLS.length) {
        var hg = A.custom('hill', function () { return new THREE.SphereGeometry(1, 14, 8); });
        var hs = HILLS.map(function (h) { return [h[0], 0, h[1], h[2], h[3], h[2] * (0.9 + rnd() * 0.2), rnd() * 3]; });
        var hm = instanced(A, THREE, hg, 'grass2', hs, function (n, c) { var v = 0.9 + rnd() * 0.16; c.setRGB(v, v, v * 0.97); });
        g.add(hm);
    }

    // batu pantai (di pasir & dangkal)
    var rg = A.custom('rock', function () { return new THREE.IcosahedronGeometry(1, 0); });
    var rocks = [];
    for (i = 0; i < 46; i++) {
        var th = rnd() * Math.PI * 2, f = 1.02 + rnd() * 0.17;
        var rr = islandRadius(th, f);
        var s0 = 0.14 + rnd() * rnd() * 0.5;
        var surf = f < 1.05 ? -0.03 : (f < 1.08 ? -0.26 : (f < 1.115 ? -0.455 : -0.47));   // tinggi permukaan di lapisan itu
        rocks.push([Math.cos(th) * rr, surf + s0 * 0.25, Math.sin(th) * rr, s0 * (1 + rnd() * 0.6), s0 * (0.7 + rnd() * 0.5), s0 * (1 + rnd() * 0.6), rnd() * 6]);
    }
    g.add(instanced(A, THREE, rg, 'rock', rocks.filter(function (r) { return !_inLinkCorridor(r[0], r[2]); }), function (n, c) { var v = 0.85 + rnd() * 0.25; c.setRGB(v, v, v); }));

    // riak ombak: kini ditangani shader laut (SeaWater.js)

    // bercak rumput tambahan di pinggiran (variasi warna, tetap di dalam pantai)
    var patches = [];
    for (i = 0; i < 26; i++) {
        var pa = rnd() * Math.PI * 2, pr = 16 + rnd() * 6;
        var px = Math.cos(pa) * pr, pz = Math.sin(pa) * pr;
        var pw = 2.4 + rnd() * 3, pd = 2 + rnd() * 2.6;
        if (_inCore(px, pz) || !_inland(px, pz, Math.max(pw, pd) * 0.75 + 1.6)) continue;
        patches.push([px, 0.012, pz, pw, 1, pd, 0]);
    }
    if (patches.length) g.add(instanced(A, THREE, A.box(1, 0.02, 1), 'grass2', patches));
}

// Tanah dasar: pulau organik di tengah laut, plaza, jalan + trotoar + marka, kolam, teluk, taman, lampu.
export function buildGround(A, THREE) {
    var g = new THREE.Group();
    var i;
    addIsland(g, A, THREE);
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

    addScenery(g, A, THREE);
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
    return out.filter(function (p) { return !_onReserved(p[0], p[1], 0.6) && !_onRoad(p[0], p[1], 0.3); });
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
    g.userData = { id: 'hq', level: level };
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
    for (var i = 0; i < level; i++) {
        var mx = -0.55 + i * 0.6;
        g.add(mesh(A, THREE, A.box(0.46, 0.5, 0.3), 'metal', mx, 0.25, 1.05));
        g.add(mesh(A, THREE, A.box(0.34, 0.05, 0.02), 'glow', mx, 0.38, 1.21));
        g.add(mesh(A, THREE, A.box(0.34, 0.05, 0.02), 'glow', mx, 0.2, 1.21));
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
    g.add(mesh(A, THREE, A.box(0.6, 0.1, 0.02), 'wall', -0.45, 2.1, 0.105));
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

// ============================================================
// GEDUNG BARU (registri v2027.62)
// ============================================================

// Pabrik Komponen: hall utama + cerobong + roda gigi di fasad. Lv2 hall sayap + silo;
// Lv3 menara ventilasi di atas hall (+ panel surya era Premium+).
function buildPcPlant(A, THREE, level, eraIdx) {
    var g = new THREE.Group();
    var W = [0, 2.2, 2.5, 2.7][level], H = [0, 1.1, 1.3, 1.5][level], D = [0, 1.8, 1.9, 2.0][level];
    addBlock(g, A, THREE, W, H, D, 0, 0, level >= 3 ? 2 : 1);
    addDoor(g, A, THREE, 0, 0, D, -W * 0.22, 0.9);
    // roda gigi di fasad: identitas "manufaktur"
    var gear = mesh(A, THREE, A.tor(0.22, 0.05), 'metal', W * 0.25, H * 0.6, D / 2 + 0.06);
    g.add(gear);
    // cerobong
    var chH = 1.0 + level * 0.35;
    var cx = W / 2 - 0.4, cz = -D * 0.22;
    g.add(mesh(A, THREE, A.cyl(0.13, 0.17, chH, 8), 'metal', cx, H + 0.14 + chH / 2, cz));
    g.add(mesh(A, THREE, A.cyl(0.19, 0.19, 0.06, 8), 'roof', cx, H + 0.14 + chH, cz));
    if (level >= 2) {
        // hall sayap di kiri + silo bahan baku di kanan belakang
        addBlock(g, A, THREE, 1.2, 0.8, 1.4, -(W / 2 + 0.55), 0.1, 1, true);
        g.add(mesh(A, THREE, A.cyl(0.26, 0.26, 1.0, 10), 'wall', W / 2 + 0.1, 0.5, -D * 0.25));
        g.add(mesh(A, THREE, A.sph(0.26, 8, 6), 'roof', W / 2 + 0.1, 1.0, -D * 0.25));
    }
    if (level >= 3) {
        // menara ventilasi di atas hall utama
        var up = new THREE.Group();
        up.position.y = H + 0.14;
        addBlock(up, A, THREE, 0.9, 1.2, 0.9, -W * 0.25, 0, 2, true);
        g.add(up);
    }
    if (eraIdx >= 4) addSolar(g, A, THREE, W * 0.4, D * 0.4, H + 0.14, -W * 0.2, -0.1);
    return g;
}

// Pusat Desain Chip: studio rendah + kubah kaca + antena. Lv2 menara desain 3 lantai;
// Lv3 menara ramping dengan cincin cahaya dan lampu peringatan (+ panel surya era Premium+).
function buildChipDesign(A, THREE, level, eraIdx) {
    var g = new THREE.Group();
    addBlock(g, A, THREE, 2.2, 0.8, 1.6, 0, 0, 1);
    addDoor(g, A, THREE, 0, 0, 1.6, -0.6, 0.8);
    // kubah kaca studio
    g.add(mesh(A, THREE, A.sph(0.42, 10, 8), 'window', 0.5, 0.92, -0.2));
    if (level === 1) {
        g.add(mesh(A, THREE, A.cyl(0.03, 0.03, 0.9, 6), 'metal', -0.8, 1.2, -0.4));
        addBeacon(g, A, THREE, -0.8, 1.68, -0.4);
    }
    if (level >= 2) {
        // menara desain 3 lantai di belakang studio + pita cahaya
        addBlock(g, A, THREE, 0.9, 2.4, 0.9, -0.55, -0.2, 3, true);
        g.add(mesh(A, THREE, A.box(0.92, 0.12, 0.05), 'glow', -0.55, 2.2, 0.28));
    }
    if (level >= 3) {
        // spire + cincin cahaya di menara + lampu peringatan
        g.add(mesh(A, THREE, A.cyl(0.03, 0.05, 1.0, 6), 'metal', -0.55, 2.47 + 0.5, -0.2));
        addBeacon(g, A, THREE, -0.55, 3.5, -0.2);
        var ring = mesh(A, THREE, A.tor(0.5, 0.035), 'glow', -0.55, 1.6, -0.2);
        ring.rotation.x = Math.PI / 2;
        g.add(ring);
    }
    if (eraIdx >= 4) addSolar(g, A, THREE, 1.0, 0.7, 0.94, 0.5, 0.5);
    return g;
}


// ============================================================
// BANK KOTA + PERUMAHAN KARYAWAN (jalan permukiman, halte, rumah, taman)
// ============================================================

// Bank Kota. Lv1 kantor cabang berserambi + ATM; Lv2 bank regional dengan sayap, tiang bendera, mobil lapis baja;
// Lv3 menara keuangan dengan cincin emas dan antena berlampu. Menghadap +z (plaza).
function buildBank(A, THREE, level, eraIdx) {
    var g = new THREE.Group();
    var W = [0, 2.6, 3.0, 3.4][level], H = [0, 1.2, 1.7, 1.2][level], D = [0, 1.9, 2.1, 2.2][level];
    addBlock(g, A, THREE, W, H, D, 0, 0, level === 1 ? 1 : 2);
    var fz = D / 2;
    // tangga + serambi: 4 kolom, atap datar, pedimen
    g.add(mesh(A, THREE, A.box(W * 0.78, 0.08, 0.62), 'plaza', 0, 0.1, fz + 0.36));
    [-0.34, -0.12, 0.12, 0.34].forEach(function (k) {
        g.add(mesh(A, THREE, A.cyl(0.055, 0.06, 0.82, 8), 'wall', W * k * 1.1, 0.55, fz + 0.52));
    });
    g.add(mesh(A, THREE, A.box(W * 0.8, 0.09, 0.6), 'roof', 0, 1.0, fz + 0.36));
    var pl = mesh(A, THREE, A.box(W * 0.3, 0.05, 0.5), 'roof', -W * 0.15, 1.1, fz + 0.36);
    pl.rotation.z = 0.35; g.add(pl);
    var pr = mesh(A, THREE, A.box(W * 0.3, 0.05, 0.5), 'roof', W * 0.15, 1.1, fz + 0.36);
    pr.rotation.z = -0.35; g.add(pr);
    // pintu kaca ganda + papan nama menyala + koin emas di atas pintu
    g.add(mesh(A, THREE, A.box(0.56, 0.7, 0.05), 'window', 0, 0.12 + 0.35, fz + 0.06));
    g.add(mesh(A, THREE, A.box(W * 0.5, 0.17, 0.05), 'glow', 0, 1.0, fz + 0.69));
    var coin = mesh(A, THREE, A.cyl(0.2, 0.2, 0.05, 18), 'gold', 0, 1.42, fz + 0.1);
    coin.rotation.x = Math.PI / 2;
    if (H > 1.3) g.add(coin);
    // ATM di sisi kanan: bilik logam + layar menyala
    g.add(mesh(A, THREE, A.box(0.3, 0.56, 0.24), 'metal', W / 2 - 0.25, 0.36, fz + 0.2));
    g.add(mesh(A, THREE, A.box(0.2, 0.15, 0.02), 'glow', W / 2 - 0.25, 0.5, fz + 0.33));
    // jendela kaca kiri
    g.add(mesh(A, THREE, A.box(W * 0.22, Math.min(0.55, H - 0.5), 0.05), 'window', -W * 0.34, 0.12 + Math.min(0.55, H - 0.5) / 2 + 0.05, fz + 0.06));

    if (level === 1) {
        // koin di atap + unit AC
        var c1 = mesh(A, THREE, A.cyl(0.24, 0.24, 0.06, 18), 'gold', 0, H + 0.62, 0);
        c1.rotation.x = Math.PI / 2; g.add(c1);
        g.add(mesh(A, THREE, A.cyl(0.03, 0.03, 0.4, 5), 'metal', 0, H + 0.36, -0.02));
        addRoofGear(g, A, THREE, W, D, H + 0.14, 0, 0);
    }
    if (level >= 2) {
        // sayap belakang + tiang bendera + mobil lapis baja (kotak putih + kabin logam)
        addBlock(g, A, THREE, 2.0, 0.9, 1.1, -0.3, -(D / 2 + 0.6), 1, true);
        [-0.9, 0.9].forEach(function (x) {
            g.add(mesh(A, THREE, A.cyl(0.02, 0.02, 1.5, 5), 'metal', x, 0.8, fz + 0.95));
            g.add(mesh(A, THREE, A.box(0.3, 0.17, 0.02), x < 0 ? 'roof' : 'glow', x + 0.17, 1.4, fz + 0.95));
        });
        g.add(mesh(A, THREE, A.box(0.62, 0.26, 0.3), 'wall', W / 2 + 0.55, 0.2, fz + 0.15));
        g.add(mesh(A, THREE, A.box(0.2, 0.2, 0.29), 'metal', W / 2 + 0.95, 0.17, fz + 0.15));
    }
    if (level === 2) {
        // pedimen emas besar + ventilasi
        var c2 = mesh(A, THREE, A.cyl(0.3, 0.3, 0.07, 20), 'gold', 0, H + 0.7, 0);
        c2.rotation.x = Math.PI / 2; g.add(c2);
        g.add(mesh(A, THREE, A.cyl(0.04, 0.04, 0.5, 5), 'metal', 0, H + 0.42, -0.02));
        addRoofGear(g, A, THREE, W, D, H + 0.14, 0, 0);
    }
    if (level >= 3) {
        // menara kaca di belakang: kaca bergaris cahaya + cincin emas + antena
        var up = new THREE.Group();
        up.position.set(0.2, H + 0.14, -0.2);
        addBlock(up, A, THREE, 1.7, 3.0, 1.3, 0, 0, 6, true);
        [0.8, 1.6, 2.4].forEach(function (y) { up.add(mesh(A, THREE, A.box(1.76, 0.05, 1.36), 'glow', 0, y + 0.1, 0)); });
        var ring = mesh(A, THREE, A.tor(0.45, 0.06), 'gold', 0, 3.6, 0);
        ring.rotation.x = Math.PI / 2; up.add(ring);
        up.add(mesh(A, THREE, A.cyl(0.03, 0.04, 0.9, 6), 'metal', 0, 3.6, 0));
        addBeacon(up, A, THREE, 0, 4.1, 0);
        g.add(up);
    }
    if (eraIdx >= 4) addSolar(g, A, THREE, W * 0.4, D * 0.35, H + 0.14, -W * 0.25, 0.25);
    return g;
}

// Satu rumah: plinth, dinding berfasad, atap limas, pintu, cerobong, semak, jalan masuk (+ mobil parkir).
// Menghadap +z lokal; rotY memutar. i = indeks untuk variasi.
function addHouse(g, A, THREE, x, z, rotY, i) {
    var hg = new THREE.Group();
    var w = 0.92 + (i % 3) * 0.1, d = 0.82, h = 0.5 + (i % 2) * 0.12;
    A.variantSeed = (A.variantSeed | 0) + i;
    addContactAO(hg, A, THREE, w, d, 0, 0);
    hg.add(mesh(A, THREE, A.box(w + 0.06, 0.1, d + 0.06), 'curb', 0, 0.05, 0));
    hg.add(mesh(A, THREE, A.fbox(w, h, d, 1), A.facadeRole(), 0, 0.1 + h / 2, 0));
    var roof = mesh(A, THREE, A.cone(1, 0.34, 4), (i % 2) ? 'roofAlt' : 'roof', 0, 0.1 + h + 0.17, 0);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set((w + 0.16) / 1.414, 1, (d + 0.16) / 1.414);
    hg.add(roof);
    hg.add(mesh(A, THREE, A.box(0.2, 0.34, 0.05), 'window', w * 0.2, 0.1 + 0.17, d / 2 + 0.03));
    hg.add(mesh(A, THREE, A.box(0.3, 0.03, 0.2), 'roof', w * 0.2, 0.1 + 0.38, d / 2 + 0.1));
    hg.add(mesh(A, THREE, A.box(0.1, 0.3, 0.1), 'curb', -w * 0.25, 0.1 + h + 0.28, -d * 0.2));
    hg.add(mesh(A, THREE, A.sph(0.13, 6, 5), 'leaf2', -w * 0.34, 0.2, d / 2 + 0.13));
    hg.add(mesh(A, THREE, A.sph(0.1, 6, 5), 'leaf2', -w * 0.12, 0.17, d / 2 + 0.12));
    hg.add(mesh(A, THREE, A.box(0.3, 0.02, 0.62), 'plaza', w * 0.2, 0.08, d / 2 + 0.4));
    if (i % 2 === 0) {      // mobil parkir di jalan masuk
        hg.add(mesh(A, THREE, A.box(0.2, 0.1, 0.34), i % 4 === 0 ? 'roof' : 'wall', w * 0.2, 0.15, d / 2 + 0.42));
    }
    hg.position.set(x, 0, z);
    hg.rotation.y = rotY;
    g.add(hg);
}

// Perumahan Karyawan + Jalan Permukiman. Koordinat lokal = dunia - slot (-11.6, 8.8).
// Jalan menyambung ke jalan selatan di x dunia -1.0 (lokal +10.6) dan masuk ke permukiman.
// Lv1 3 rumah; Lv2 6 rumah; Lv3 8 rumah + apartemen + taman bermain.
function buildHousing(A, THREE, level, eraIdx) {
    var g = new THREE.Group();
    var RZ = -1.3;            // sumbu jalan (lokal): z dunia 7.5
    var X0 = -3.2, X1 = 10.6; // ujung barat / timur jalan (lokal)
    var LEN = X1 - X0, CX = (X0 + X1) / 2, i;

    // badan jalan + trotoar (dua sisi) + "turunan trotoar" di pertemuan dengan jalan selatan
    g.add(mesh(A, THREE, A.box(LEN, 0.06, 1.6), 'road', CX, 0.03, RZ));
    g.add(mesh(A, THREE, A.box(LEN - 0.5, 0.09, 0.4), 'curb', CX - 0.25, 0.045, RZ - 1.0));
    g.add(mesh(A, THREE, A.box(LEN - 0.5, 0.09, 0.4), 'curb', CX - 0.25, 0.045, RZ + 1.0));
    g.add(mesh(A, THREE, A.box(0.5, 0.03, 1.6), 'road', X1 - 0.25 + 0.15, 0.095, RZ));
    // marka tengah putus-putus + zebra cross dekat pertemuan
    var dashes = [];
    for (i = 0; i < 12; i++) dashes.push([X0 + 0.6 + i * 1.1, 0.065, RZ, 1, 1, 1, Math.PI / 2]);
    g.add(instanced(A, THREE, A.box(0.1, 0.012, 0.5), 'wall', dashes));
    var zebra = [];
    for (i = 0; i < 4; i++) zebra.push([X1 - 1.7, 0.066, RZ - 0.6 + i * 0.4, 1, 1, 1, 0]);
    g.add(instanced(A, THREE, A.box(0.5, 0.012, 0.22), 'wall', zebra));
    // ujung barat jalan: putaran kecil (cul-de-sac) + bola lampu
    g.add(mesh(A, THREE, A.cyl(1.0, 1.0, 0.06, 20), 'road', X0, 0.03, RZ));
    g.add(mesh(A, THREE, A.cyl(0.32, 0.32, 0.08, 12), 'plaza', X0, 0.07, RZ));
    g.add(mesh(A, THREE, A.sph(0.16, 6, 5), 'leaf2', X0, 0.2, RZ));

    // lampu jalan: dunia N (-10.05, -13.45) di z 6.2 dan S (-3.4, -9.2, -12.4) di z 8.85
    var lamps = [[1.55, RZ - 1.3], [-1.85, RZ - 1.3], [8.2, RZ + 1.35], [2.4, RZ + 1.35], [-0.8, RZ + 1.35]];
    var poles = [], heads = [], halos = [];
    lamps.forEach(function (l) {
        poles.push([l[0], 0.09 + 0.7, l[1]]);
        heads.push([l[0], 1.58, l[1]]);
        halos.push([l[0], 0.1, l[1]]);
    });
    g.add(instanced(A, THREE, A.cyl(0.035, 0.045, 1.4, 6), 'metal', poles));
    g.add(instanced(A, THREE, A.sph(0.1, 8, 6), 'lamp', heads));
    g.add(instanced(A, THREE, A.cyl(0.8, 0.8, 0.01, 14), 'halo', halos));

    // halte bus dekat pertemuan (atap, tiang, kaca, bangku)
    g.add(mesh(A, THREE, A.box(0.9, 0.05, 0.4), 'roof', 8.7, 0.66, RZ + 1.55));
    g.add(mesh(A, THREE, A.cyl(0.02, 0.02, 0.58, 5), 'metal', 8.3, 0.37, RZ + 1.7));
    g.add(mesh(A, THREE, A.cyl(0.02, 0.02, 0.58, 5), 'metal', 9.1, 0.37, RZ + 1.7));
    g.add(mesh(A, THREE, A.box(0.84, 0.4, 0.02), 'window', 8.7, 0.4, RZ + 1.72));
    g.add(mesh(A, THREE, A.box(0.5, 0.04, 0.14), 'trunk', 8.7, 0.22, RZ + 1.62));

    // rumah: baris utara (menghadap jalan: +z) dan selatan (menghadap -z)
    A.variantSeed = 1;
    var N = [[2.4, -3.4], [0.7, -3.4], [-1.0, -3.4], [-2.7, -3.4]];
    var S = [[2.2, 1.8], [0.5, 1.8], [-1.2, 1.8], [-2.8, 1.8]];
    var order = [N[0], N[1], S[0], N[2], S[1], S[2], N[3], S[3]];   // urutan tumbuh
    var count = [0, 3, 6, 8][level];
    for (i = 0; i < count; i++) {
        var spot = order[i];
        addHouse(g, A, THREE, spot[0], spot[1], spot[1] < 0 ? 0 : Math.PI, i);
    }
    // pohon pekarangan
    [[1.55, -3.15], [-1.85, 1.6]].forEach(function (p, k) {
        if (k >= (level >= 2 ? 2 : 1)) return;
        g.add(mesh(A, THREE, A.cyl(0.04, 0.05, 0.4, 5), 'trunk', p[0], 0.2, p[1]));
        g.add(mesh(A, THREE, A.sph(0.26, 7, 6), 'leaf', p[0], 0.55, p[1]));
    });

    if (level >= 3) {
        // apartemen 4 lantai di tenggara + taman bermain (ayunan, perosotan, bangku, pohon)
        A.variantSeed = 2;
        var ap = new THREE.Group();
        addBlock(ap, A, THREE, 1.6, 1.5, 1.1, 0, 0, 4);
        addRoofGear(ap, A, THREE, 1.6, 1.1, 1.64, 0, 0);
        ap.add(mesh(A, THREE, A.box(0.5, 0.05, 0.36), 'roof', 0, 0.9, 0.7));
        ap.position.set(2.0, 0, 4.15);
        ap.rotation.y = Math.PI;
        g.add(ap);
        var park = new THREE.Group();
        park.add(mesh(A, THREE, A.box(2.6, 0.02, 1.6), 'grass2', 0, 0.01, 0));
        // ayunan
        park.add(mesh(A, THREE, A.box(0.9, 0.05, 0.05), 'metal', -0.6, 0.62, 0.2));
        park.add(mesh(A, THREE, A.box(0.04, 0.62, 0.04), 'metal', -1.02, 0.31, 0.2));
        park.add(mesh(A, THREE, A.box(0.04, 0.62, 0.04), 'metal', -0.18, 0.31, 0.2));
        park.add(mesh(A, THREE, A.box(0.2, 0.03, 0.1), 'roof', -0.45, 0.28, 0.2));
        park.add(mesh(A, THREE, A.box(0.2, 0.03, 0.1), 'glow', -0.8, 0.28, 0.2));
        // perosotan
        var sl = mesh(A, THREE, A.box(0.16, 0.03, 0.62), 'roofAlt', 0.45, 0.28, -0.1);
        sl.rotation.x = 0.55; park.add(sl);
        park.add(mesh(A, THREE, A.box(0.2, 0.46, 0.2), 'metal', 0.45, 0.23, -0.42));
        // bangku + pohon
        park.add(mesh(A, THREE, A.box(0.5, 0.05, 0.14), 'trunk', 0.95, 0.2, 0.55));
        park.add(mesh(A, THREE, A.cyl(0.05, 0.06, 0.5, 6), 'trunk', 1.1, 0.25, -0.5));
        park.add(mesh(A, THREE, A.sph(0.34, 7, 6), 'leaf', 1.1, 0.7, -0.5));
        park.position.set(-0.9, 0, 4.2);
        g.add(park);
    }
    if (eraIdx >= 4) {   // panel surya di sebagian atap rumah (era Premium+)
        for (i = 0; i < Math.min(count, 4); i++) {
            var sp = order[i];
            g.add(mesh(A, THREE, A.box(0.4, 0.03, 0.3), 'solar', sp[0] - 0.1, 0.1 + 0.62 + 0.18, sp[1] + (sp[1] < 0 ? 0.12 : -0.12)));
        }
    }
    return g;
}

var SLOT_BUILDERS = {
    lab: buildLab, factory: buildFactory, store: buildStore,
    os: buildOS, monument: buildMonument, billboard: buildBillboard,
    academy: buildAcademy, arena: buildArena, port: buildPort,
    pcplant: buildPcPlant, chipdesign: buildChipDesign,
    bank: buildBank, housing: buildHousing
};
// Id gedung yang punya builder 3D (dipakai validateCampusRegistry).
export var BUILDER_IDS = Object.keys(SLOT_BUILDERS).concat(['hq']);

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
    g.userData = { id: id, level: level };
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
