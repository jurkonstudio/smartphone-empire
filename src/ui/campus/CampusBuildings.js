// FILE: src/ui/campus/CampusBuildings.js
// v2027.37a — Detail upgrade: fasad jendela bertekstur (menyala di mode gelap),
// bayangan palsu, trotoar + marka jalan + lampu jalan, kolam, taman, bangku,
// pohon 3 jenis, detail unik tiap bangunan (pintu, kanopi, helipad, tangki, rak
// server, dll). Logika level/RULES/computePlan TIDAK diubah.
//
// Semua angka yang memengaruhi "kapan bangunan naik level" ada di RULES
// (di bawah). Ubah di sana kalau ingin lebih cepat / lebih lambat.
import { DESIGN_ERAS, getDesignEraForYear } from '../../data/era-design.data.js';
import { BALANCE } from '../../data/balance.data.js';

// true  = bangunan tidak pernah turun level (puncak disimpan di state.campusPeak)
// false = level selalu mengikuti kondisi terkini (bisa turun kalau staf dipecat, dll)
export var NEVER_DOWNGRADE = true;

// Warna per tema. Warna atap (roof) diambil dari CSS variable --accent.
// night: 1 = jendela & lampu jalan menyala. sunCol = warna matahari/bulan.
export const PALETTES = {
    light: {
        grass: 0xcfe6c8, plaza: 0xeceff4, road: 0xd3d9e2, wall: 0xffffff,
        window: 0x8fb4e8, trunk: 0xb59a7a, leaf: 0x8cc98a,
        solar: 0x4a6fa5, metal: 0x9aa5b4, glow: 0x00b8d9,
        grass2: 0xbfdcb6, soil: 0x9c8467, curb: 0xc3cad6, water: 0x7ec8e8,
        leaf2: 0xa6d9a0, gold: 0xe0b445, shade: 0x000000,
        flowerA: 0xf472b6, flowerB: 0xfacc15,
        lamp: 0xfff1c4, beacon: 0xff4d4d, halo: 0xffd98a,
        hemiSky: 0xffffff, hemiGround: 0xcfd6e0, hemiI: 0.95, dirI: 0.8,
        sunCol: 0xfff1da, night: 0
    },
    dark: {
        grass: 0x2d4a3b, plaza: 0x3b4252, road: 0x30353f, wall: 0xb4becd,
        window: 0x4f77b8, trunk: 0x6b5a45, leaf: 0x3f7a55,
        solar: 0x2c4a7a, metal: 0x6c7686, glow: 0x00d4ff,
        grass2: 0x264235, soil: 0x3d3228, curb: 0x4a5163, water: 0x2f6f9a,
        leaf2: 0x4c8f66, gold: 0xc9a13a, shade: 0x000000,
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

// Pohon: 6 lama + 6 baru (sekitar kolam & tepi). Sudah dicek tidak menabrak slot.
export const TREE_SPOTS = [
    [-7, -6], [-5.5, -7.5], [7, -6.5], [8, -4], [-8, 5], [7.5, 6.5],
    [-1.4, -6.6], [2.5, -5.6], [-3, -5.5], [4.4, -4.4], [9.2, 6.4], [-9.2, 8.8]
];

// Kolam kecil di utara plaza (dipakai juga oleh CampusLife untuk riak air).
export var POND = { x: 0.5, z: -6, r: 1.4 };

// Posisi slot bangunan (x, z). Sudah dicek tidak bertabrakan dengan HQ,
// jalan, pohon, dan satu sama lain.
export var SLOTS = {
    lab:       [-6.0, -3.6],
    factory:   [6.6, 0.6],
    store:     [-5.4, 4.2],
    os:        [4.6, 5.0],
    billboard: [2.6, 8.6],
    monument:  [-2.9, 2.9]
};
export var SLOT_ORDER = ['lab', 'factory', 'store', 'os', 'billboard', 'monument'];

// Kawasan kota di pinggir peta. Muncul bertahap: 1 + 2 blok per era.
export var SPRAWL_SPOTS = [
    [-8.8, -3.5], [9.0, -1.6], [-3.2, -8.8], [-3.2, 8.8], [-8.8, 3.0], [9.0, 3.8], [0.6, -8.8],
    [5.6, 8.8], [-8.8, -8.5], [9.0, -8.6], [3.8, -8.8], [-6.0, 8.8], [8.2, 8.8]
];

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
                 metric: function (d) { return len(d.marketing && d.marketing.activeCampaigns); } }
};
var RULE_KEYS = Object.keys(RULES);

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

    var sprawl = Math.min(SPRAWL_SPOTS.length, 1 + eraIdx * 2);
    var sig = eraIdx + '|' + RULE_KEYS.map(function (k) { return levels[k]; }).join(',') + '|' + sprawl;
    return { eraIdx: eraIdx, era: era, levels: levels, sprawl: sprawl, sig: sig };
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
export function describeBuilding(id, plan, data) {
    if (!plan) return null;
    if (id === 'sprawl') {
        return { title: 'Kawasan Kota', sub: 'Tumbuh seiring era: ' + (plan.era.shortLabel || plan.era.label) };
    }
    var r = RULES[id];
    if (!r) return null;
    var lv = plan.levels[id] || 0;
    var m = r.metric(data || {});
    var mShown = (id === 'monument') ? (Math.round(m * 10) / 10) : m;
    var sub;
    if (lv >= r.max) sub = 'Level maksimum';
    else {
        var need = r.steps[lv - r.base];
        sub = 'Naik di ' + need + ' ' + r.unit + ' (kini ' + mShown + ')';
    }
    return { title: r.name + ' · Lv ' + lv + '/' + r.max, sub: sub };
}

// ============================================================
// ASSETS
// ============================================================
var COLOR_ROLES = [
    'grass', 'plaza', 'road', 'wall', 'window', 'trunk', 'leaf', 'solar', 'metal', 'glow',
    'grass2', 'soil', 'curb', 'water', 'leaf2', 'gold', 'shade', 'flowerA', 'flowerB',
    'lamp', 'beacon', 'halo'
];

// Opsi material khusus per role (transparan dsb).
var MAT_OPTS = {
    shade: { transparent: true, opacity: 0.2, depthWrite: false },
    halo:  { transparent: true, opacity: 0, depthWrite: false },
    water: { transparent: true, opacity: 0.9 }
};

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
        t.anisotropy = 4;
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
                a.fillStyle = hexCss(tint(wall, -0.07)); a.fillRect(x, y, 3, C);          // pilaster
                a.fillStyle = hexCss(tint(wall, -0.14)); a.fillRect(x, y + C - 4, C, 4);   // pelat lantai
                a.fillStyle = hexCss(tint(win, -0.4));   a.fillRect(x + 10, y + 12, 44, 38); // bingkai
                var gr = a.createLinearGradient(0, y + 14, 0, y + 48);
                gr.addColorStop(0, hexCss(tint(win, 0.4)));
                gr.addColorStop(1, hexCss(win));
                a.fillStyle = gr; a.fillRect(x + 12, y + 14, 40, 34);
                a.fillStyle = hexCss(tint(win, -0.3));   a.fillRect(x + 31, y + 14, 2, 34);  // tiang tengah
                if (lit[r * 4 + c]) {
                    b.fillStyle = hexCss(tint(win, 0.2));
                    b.fillRect(x + 12, y + 14, 19, 34);
                    b.fillRect(x + 33, y + 14, 19, 34);
                }
            }
        }
        tMap.needsUpdate = true;
        tEmi.needsUpdate = true;
    }
    draw(0xffffff, 0x8fb4e8);
    return { map: tMap, emi: tEmi, draw: draw, dispose: function () { tMap.dispose(); tEmi.dispose(); } };
}

export function createAssets(THREE) {
    var geos = new Map();
    var mats = new Map();
    var facade = makeFacade(THREE);
    mats.set('facade', new THREE.MeshLambertMaterial({
        map: facade.map, emissive: 0xffffff, emissiveMap: facade.emi,
        emissiveIntensity: 0, flatShading: true
    }));
    function cached(key, make) {
        if (!geos.has(key)) geos.set(key, make());
        return geos.get(key);
    }
    return {
        THREE: THREE,
        box: function (w, h, d) { return cached('b' + w + '_' + h + '_' + d, function () { return new THREE.BoxGeometry(w, h, d); }); },
        // Box dengan UV fasad: jumlah jendela mengikuti lebar & jumlah lantai.
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
                return g;
            });
        },
        cyl: function (rt, rb, h, s) { return cached('y' + rt + '_' + rb + '_' + h + '_' + s, function () { return new THREE.CylinderGeometry(rt, rb, h, s); }); },
        cone: function (r, h, s) { return cached('c' + r + '_' + h + '_' + s, function () { return new THREE.ConeGeometry(r, h, s); }); },
        sph: function (r, ws, hs) { return cached('s' + r + '_' + ws + '_' + hs, function () { return new THREE.SphereGeometry(r, ws, hs); }); },
        tor: function (r, t) { return cached('t' + r + '_' + t, function () { return new THREE.TorusGeometry(r, t, 6, 40); }); },
        mat: function (role) {
            if (!mats.has(role)) {
                mats.set(role, new THREE.MeshLambertMaterial(Object.assign({ flatShading: true }, MAT_OPTS[role] || {})));
            }
            return mats.get(role);
        },
        applyPalette: function (p, accent) {
            var self = this;
            COLOR_ROLES.forEach(function (r) { if (p[r] !== undefined) self.mat(r).color.setHex(p[r]); });
            try { self.mat('roof').color.set(accent); } catch (e) { self.mat('roof').color.setHex(0x2563eb); }
            var g = self.mat('glow');
            if (g.emissive && p.glow !== undefined) { g.emissive.setHex(p.glow); g.emissiveIntensity = 0.55; }

            var night = p.night ? 1 : 0;
            facade.draw(p.wall, p.window !== undefined ? p.window : 0x8fb4e8);
            self.mat('facade').emissiveIntensity = night ? 0.9 : 0;
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
        },
        dispose: function () {
            geos.forEach(function (g) { g.dispose(); });
            mats.forEach(function (m) { m.dispose(); });
            facade.dispose();
            geos.clear(); mats.clear();
        }
    };
}

function mesh(A, THREE, geo, role, x, y, z) {
    var m = new THREE.Mesh(geo, A.mat(role));
    m.position.set(x, y, z);
    return m;
}

// Banyak salinan satu geometri dalam 1 draw call. item = [x,y,z, sx,sy,sz, rotY].
function instanced(A, THREE, geo, role, items) {
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
    im.frustumCulled = false;
    return im;
}

// ============================================================
// TANAH, JALAN, TAMAN
// ============================================================
var GRASS_PATCHES = [
    [-6.5, 8.2, 3, 2], [6.2, -8.2, 2.6, 1.8], [8.6, 7.8, 2.2, 2.4], [-9, -6.6, 1.8, 3],
    [3.6, -5.2, 2.4, 1.6], [-2.4, -6.8, 2.2, 1.4], [8.4, -2.6, 2, 1.6], [-4.2, 7.4, 1.8, 1.6]
];
var LAMP_SPOTS = [
    [-1.55, 4.6], [-1.55, 6.8], [-1.55, 9.0], [1.55, 4.6], [1.55, 6.8],
    [-4.6, 1.55], [-6.8, 1.55], [-9.0, 1.55], [-4.6, -1.55], [-6.8, -1.55], [-9.0, -1.55]
];
var PLANTERS = [[3.1, 3.1], [3.1, -3.1], [-3.1, -3.1]];

// Tanah dasar (pulau bertebing), plaza, jalan + trotoar + marka, kolam, taman, lampu.
export function buildGround(A, THREE) {
    var g = new THREE.Group();
    var i;
    g.add(mesh(A, THREE, A.box(19.6, 0.6, 19.6), 'soil', 0, -0.9, 0));
    g.add(mesh(A, THREE, A.box(20, 0.6, 20), 'grass', 0, -0.3, 0));
    GRASS_PATCHES.forEach(function (p) {
        g.add(mesh(A, THREE, A.box(p[2], 0.02, p[3]), 'grass2', p[0], 0.01, p[1]));
    });
    g.add(mesh(A, THREE, A.box(7, 0.08, 7), 'plaza', 0, 0.04, 0));
    // inlay plaza: cincin tipis
    var inlay = mesh(A, THREE, A.cyl(3.3, 3.3, 0.02, 28), 'curb', 0, 0.085, 0);
    g.add(inlay);
    g.add(mesh(A, THREE, A.box(2, 0.06, 6.5), 'road', 0, 0.03, 6.75));
    g.add(mesh(A, THREE, A.box(6.5, 0.06, 2), 'road', -6.75, 0.03, 0));
    // trotoar (kiri-kanan tiap jalan)
    [-1.225, 1.225].forEach(function (x) { g.add(mesh(A, THREE, A.box(0.45, 0.09, 6.5), 'curb', x, 0.045, 6.75)); });
    [-1.225, 1.225].forEach(function (z) { g.add(mesh(A, THREE, A.box(6.5, 0.09, 0.45), 'curb', -6.75, 0.045, z)); });

    // marka jalan putus-putus + zebra cross (instanced)
    var dashes = [], cross = [];
    for (i = 0; i < 6; i++) dashes.push([0, 0.065, 4.4 + i * 1.0, 1, 1, 1, 0]);
    for (i = 0; i < 6; i++) dashes.push([-4.4 - i * 1.0, 0.065, 0, 1, 1, 1, Math.PI / 2]);
    for (i = 0; i < 5; i++) cross.push([-0.8 + i * 0.4, 0.066, 3.85]);
    for (i = 0; i < 5; i++) cross.push([-3.85, 0.066, -0.8 + i * 0.4]);
    g.add(instanced(A, THREE, A.box(0.1, 0.012, 0.5), 'wall', dashes));
    g.add(instanced(A, THREE, A.box(0.22, 0.012, 0.5), 'wall', cross.slice(0, 5)));
    g.add(instanced(A, THREE, A.box(0.5, 0.012, 0.22), 'wall', cross.slice(5)));

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

// ============================================================
// BLOK GEDUNG
// ============================================================
// Bayangan palsu (tanpa shadow map): bidang gelap transparan, miring menjauhi matahari.
function addShadow(group, A, THREE, w, h, d, x, z) {
    var sx = -Math.min(1.4, h * 0.22), sz = -Math.min(1.0, h * 0.16);
    var bw = Math.round((w + 0.3 + Math.abs(sx)) * 100) / 100;
    var bd = Math.round((d + 0.3 + Math.abs(sz)) * 100) / 100;
    var s = mesh(A, THREE, A.box(bw, 0.01, bd), 'shade', x + sx / 2, 0.02, z + sz / 2);
    s.raycast = function () {};   // jangan ikut tap
    group.add(s);
}

// Satu blok gedung: fasad bertekstur + plinth + atap aksen + inset atap.
// noShadow = true untuk blok sekunder (supaya bayangan tidak menumpuk).
function addBlock(group, A, THREE, w, h, d, x, z, floors, noShadow) {
    if (!noShadow) addShadow(group, A, THREE, w, h, d, x, z);
    group.add(mesh(A, THREE, A.fbox(w, h, d, floors), 'facade', x, h / 2, z));
    group.add(mesh(A, THREE, A.box(w + 0.1, 0.12, d + 0.1), 'curb', x, 0.06, z));
    group.add(mesh(A, THREE, A.box(w + 0.2, 0.14, d + 0.2), 'roof', x, h + 0.07, z));
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

var SLOT_BUILDERS = {
    lab: buildLab, factory: buildFactory, store: buildStore,
    os: buildOS, monument: buildMonument, billboard: buildBillboard
};

// Bangun bangunan slot lengkap dengan posisi & userData.
export function buildSlot(A, THREE, id, level, eraIdx) {
    var fn = SLOT_BUILDERS[id];
    if (!fn || !level) return null;
    var g = fn(A, THREE, level, eraIdx || 0);
    var p = SLOTS[id];
    g.position.x = p[0];
    g.position.z = p[1];
    g.userData = { id: id, level: level };
    return g;
}

// Blok kawasan kota; makin tinggi di era akhir. 3 varian atap + kanopi toko.
export function buildSprawl(A, THREE, i, eraIdx) {
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
