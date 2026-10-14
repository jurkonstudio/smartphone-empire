// FILE: src/ui/campus/CampusBuildings.js
// v2027.35a — Kampus yang tumbuh: bangunan baru + level otomatis dari
// perilaku pemain + gaya yang berubah per era (tahun).
//
// Semua angka yang memengaruhi "kapan bangunan naik level" ada di RULES
// (di bawah). Ubah di sana kalau ingin lebih cepat / lebih lambat.
import { DESIGN_ERAS, getDesignEraForYear } from '../../data/era-design.data.js';
import { BALANCE } from '../../data/balance.data.js';

// true  = bangunan tidak pernah turun level (puncak disimpan di state.campusPeak)
// false = level selalu mengikuti kondisi terkini (bisa turun kalau staf dipecat, dll)
export var NEVER_DOWNGRADE = true;

// Warna per tema. Warna atap (roof) diambil dari CSS variable --accent.
export const PALETTES = {
    light: {
        grass: 0xcfe6c8, plaza: 0xeceff4, road: 0xd3d9e2, wall: 0xffffff,
        window: 0x8fb4e8, trunk: 0xb59a7a, leaf: 0x8cc98a,
        solar: 0x4a6fa5, metal: 0x9aa5b4, glow: 0x00b8d9,
        hemiSky: 0xffffff, hemiGround: 0xcfd6e0, hemiI: 0.95, dirI: 0.8
    },
    dark: {
        grass: 0x2d4a3b, plaza: 0x3b4252, road: 0x30353f, wall: 0xb4becd,
        window: 0x4f77b8, trunk: 0x6b5a45, leaf: 0x3f7a55,
        solar: 0x2c4a7a, metal: 0x6c7686, glow: 0x00d4ff,
        hemiSky: 0x9fb0d0, hemiGround: 0x20242d, hemiI: 0.7, dirI: 0.55
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

export const TREE_SPOTS = [[-7, -6], [-5.5, -7.5], [7, -6.5], [8, -4], [-8, 5], [7.5, 6.5]];

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
var COLOR_ROLES = ['grass', 'plaza', 'road', 'wall', 'window', 'trunk', 'leaf', 'solar', 'metal', 'glow'];

export function createAssets(THREE) {
    var geos = new Map();
    var mats = new Map();
    function cached(key, make) {
        if (!geos.has(key)) geos.set(key, make());
        return geos.get(key);
    }
    return {
        box: function (w, h, d) { return cached('b' + w + '_' + h + '_' + d, function () { return new THREE.BoxGeometry(w, h, d); }); },
        cyl: function (rt, rb, h, s) { return cached('y' + rt + '_' + rb + '_' + h + '_' + s, function () { return new THREE.CylinderGeometry(rt, rb, h, s); }); },
        cone: function (r, h, s) { return cached('c' + r + '_' + h + '_' + s, function () { return new THREE.ConeGeometry(r, h, s); }); },
        sph: function (r, ws, hs) { return cached('s' + r + '_' + ws + '_' + hs, function () { return new THREE.SphereGeometry(r, ws, hs); }); },
        tor: function (r, t) { return cached('t' + r + '_' + t, function () { return new THREE.TorusGeometry(r, t, 6, 40); }); },
        mat: function (role) {
            if (!mats.has(role)) mats.set(role, new THREE.MeshLambertMaterial({ flatShading: true }));
            return mats.get(role);
        },
        applyPalette: function (p, accent) {
            var self = this;
            COLOR_ROLES.forEach(function (r) { if (p[r] !== undefined) self.mat(r).color.setHex(p[r]); });
            try { self.mat('roof').color.set(accent); } catch (e) { self.mat('roof').color.setHex(0x2563eb); }
            var g = self.mat('glow');
            if (g.emissive && p.glow !== undefined) { g.emissive.setHex(p.glow); g.emissiveIntensity = 0.55; }
        },
        dispose: function () {
            geos.forEach(function (g) { g.dispose(); });
            mats.forEach(function (m) { m.dispose(); });
            geos.clear(); mats.clear();
        }
    };
}

function mesh(A, THREE, geo, role, x, y, z) {
    var m = new THREE.Mesh(geo, A.mat(role));
    m.position.set(x, y, z);
    return m;
}

// Tanah dasar, plaza, dan dua jalan.
export function buildGround(A, THREE) {
    var g = new THREE.Group();
    g.add(mesh(A, THREE, A.box(20, 0.6, 20), 'grass', 0, -0.3, 0));
    g.add(mesh(A, THREE, A.box(7, 0.08, 7), 'plaza', 0, 0.04, 0));
    g.add(mesh(A, THREE, A.box(2, 0.06, 6.5), 'road', 0, 0.03, 6.75));
    g.add(mesh(A, THREE, A.box(6.5, 0.06, 2), 'road', -6.75, 0.03, 0));
    return g;
}

export function buildTree(A, THREE, x, z) {
    var g = new THREE.Group();
    g.add(mesh(A, THREE, A.cyl(0.12, 0.16, 0.6, 6), 'trunk', 0, 0.3, 0));
    g.add(mesh(A, THREE, A.cone(0.7, 1.4, 6), 'leaf', 0, 1.3, 0));
    g.position.set(x, 0, z);
    return g;
}

// Satu blok gedung: badan + pita jendela per lantai + atap aksen.
function addBlock(group, A, THREE, w, h, d, x, z, floors) {
    group.add(mesh(A, THREE, A.box(w, h, d), 'wall', x, h / 2, z));
    var fh = h / floors;
    for (var i = 0; i < floors; i++) {
        group.add(mesh(A, THREE, A.box(w + 0.04, 0.32, d + 0.04), 'window', x, (i + 0.55) * fh, z));
    }
    group.add(mesh(A, THREE, A.box(w + 0.2, 0.14, d + 0.2), 'roof', x, h + 0.07, z));
}

function addSolar(g, A, THREE, w, d, topY, x, z) {
    g.add(mesh(A, THREE, A.box(w, 0.05, d), 'solar', x, topY + 0.04, z));
}

// ============================================================
// HQ — level 1..4 + ornamen sesuai era
// ============================================================
var HQ_W = [0, 3.2, 3.8, 4.2, 4.4];
var HQ_H = [0, 1.6, 2.8, 4.0, 4.8];

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
        addBlock(g, A, THREE, 2.0, 1.6, 2.2, 3.2, 0.3, 1);
    } else {
        addBlock(g, A, THREE, 4.4, 4.8, 3.4, 0, 0, 4);
        addBlock(g, A, THREE, 2.0, 1.6, 2.2, 3.3, 0.3, 1);
        addBlock(g, A, THREE, 1.6, 7.0, 1.6, -1.2, -0.6, 6);
    }

    // ---- ornamen era ----
    var topY = HQ_H[level] + 0.14;
    var sx = HQ_W[level] / 2 - 0.6;
    if (eraIdx <= 1) {   // antena batang
        g.add(mesh(A, THREE, A.cyl(0.04, 0.05, 1.3, 6), 'metal', sx, topY + 0.65, -0.6));
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
    if (level >= 2) g.add(mesh(A, THREE, A.sph(0.55, 10, 8), 'window', -0.4, D[1] + 0.24, 0));
    if (level >= 3) g.add(mesh(A, THREE, A.cyl(0.04, 0.05, 1.2, 6), 'metal', 0.8, D[1] + 0.74, 0.5));
    return g;
}

function buildFactory(A, THREE, level, eraIdx) {
    var g = new THREE.Group();
    var W = [0, 3.2, 3.4, 3.6][level], H = [0, 1.3, 1.5, 1.8][level], D = [0, 2.4, 2.5, 2.6][level];
    addBlock(g, A, THREE, W, H, D, 0, 0, level >= 3 ? 2 : 1);
    if (level >= 2) addBlock(g, A, THREE, 2.0, 1.2, 2.0, -0.4, -(D / 2 + 1.0), 1);
    for (var i = 0; i < level; i++) {
        var ch = 1.9 + i * 0.3;
        g.add(mesh(A, THREE, A.cyl(0.2, 0.26, ch, 8), 'metal', W / 2 - 0.5 - i * 0.7, H + 0.14 + ch / 2, 0.3));
    }
    if (eraIdx >= 4) addSolar(g, A, THREE, W * 0.4, D * 0.4, H + 0.14, -W * 0.2, -0.2);
    return g;
}

function buildStore(A, THREE, level, eraIdx) {
    var g = new THREE.Group();
    var D = [null, [2.0, 1.0, 1.6], [2.4, 1.6, 1.8], [2.8, 2.2, 2.0]][level];
    var w = D[0], h = D[1], d = D[2];
    addBlock(g, A, THREE, w, h, d, 0, 0, 1);
    g.add(mesh(A, THREE, A.box(w, 0.1, 0.5), 'roof', 0, Math.min(h - 0.3, 0.9), d / 2 + 0.25));
    if (level >= 2) g.add(mesh(A, THREE, A.box(w * 0.5, 0.35, 0.06), 'glow', 0, h + 0.32, d / 2 - 0.1));
    if (level >= 3) {
        g.add(mesh(A, THREE, A.cyl(0.05, 0.05, 2.0, 6), 'metal', w / 2 + 0.3, 1.0, d / 2));
        g.add(mesh(A, THREE, A.box(0.9, 0.5, 0.08), 'glow', w / 2 + 0.3, 2.1, d / 2));
    }
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
    if (level >= 2) addBlock(g, A, THREE, 1.4, 1.8, 1.4, 1.7, -0.1, 2);
    if (level >= 3) addBlock(g, A, THREE, 1.4, 2.4, 1.4, -1.7, 0.1, 3);
    if (eraIdx >= 4) addSolar(g, A, THREE, 0.8, 0.6, 1.34, -0.4, 0);
    return g;
}

function buildMonument(A, THREE, level, eraIdx) {
    var g = new THREE.Group();
    g.position.y = 0.08; // di atas plaza
    var colH = level >= 2 ? 1.8 : 1.2;
    g.add(mesh(A, THREE, A.cyl(0.55, 0.65, 0.3, 10), 'wall', 0, 0.15, 0));
    g.add(mesh(A, THREE, A.cyl(0.14, 0.2, colH, 8), 'metal', 0, 0.3 + colH / 2, 0));
    g.add(mesh(A, THREE, A.sph(0.34, 10, 8), level >= 2 ? 'glow' : 'roof', 0, 0.3 + colH + 0.25, 0));
    return g;
}

function buildBillboard(A, THREE, level, eraIdx) {
    var g = new THREE.Group();
    g.add(mesh(A, THREE, A.cyl(0.07, 0.07, 1.8, 6), 'metal', -0.7, 0.9, 0));
    g.add(mesh(A, THREE, A.cyl(0.07, 0.07, 1.8, 6), 'metal', 0.7, 0.9, 0));
    g.add(mesh(A, THREE, A.box(2.0, 1.0, 0.12), 'roof', 0, 2.2, 0));
    g.add(mesh(A, THREE, A.box(1.8, 0.12, 0.14), 'glow', 0, 1.62, 0));
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

// Blok kawasan kota; makin tinggi di era akhir.
export function buildSprawl(A, THREE, i, eraIdx) {
    var g = new THREE.Group();
    var w = 1.1 + (i % 3) * 0.2;
    var d = 1.0 + ((i + 1) % 3) * 0.2;
    var h = 0.8 + (eraIdx || 0) * 0.38 + (i % 4) * 0.25;
    var floors = Math.max(1, Math.floor(h / 0.9));
    addBlock(g, A, THREE, w, h, d, 0, 0, floors);
    var p = SPRAWL_SPOTS[i];
    g.position.x = p[0];
    g.position.z = p[1];
    g.userData = { id: 'sprawl', level: 1 };
    return g;
}
