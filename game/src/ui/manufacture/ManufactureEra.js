// FILE: src/ui/manufacture/ManufactureEra.js  (BARU — v2028.43: lapisan "era" Peta Manufaktur 3D)
// Pulau industri tumbuh bertahap mengikuti tiga hal sekaligus:
//   1) TAHUN game            (2000 -> 2026+)      : teknologi apa yang sudah ada di dunia
//   2) LEVEL pemain (exp)     (PlayerProgression)  : seberapa jauh pemain berkembang
//   3) LEVEL PABRIK total     (Fab + 5 pabrik + Assembly) : seberapa besar kompleks industrinya
// Setiap fitur baru hanya muncul bila ketiganya terpenuhi, lalu "tumbuh" (jumlah/ukuran bertambah) saat tahun & level naik.
//
//   Fitur            Tahun  Lv  Lv.Pabrik   Isi
//   Pagar + gerbang   2000    2     0       pagar rantai di sisi utara + pos jaga
//   Lampu sorot       2002    4     1       menara lampu (natrium oranye < 2012, LED putih >= 2012), berpendar malam hari
//   Area parkir       2004    6     2       mobil pekerja (jumlah naik dengan level)
//   Menara telekom    2006    8     3       tiang + parabola; >= 2024 jadi mast 5G dengan cincin sinyal berdenyut
//   Ladang surya      2010   10     4       baris panel surya di sisi utara (baris bertambah)
//   Panel atap        2012   12     5       panel surya di atap semua pabrik (dipasang ManufactureDetail via kit.era)
//   Turbin angin      2014   15     6       1-3 turbin berputar di tepi pantai
//   Drone gudang      2018   18     8       drone angkut peti antar pabrik (1-3)
//   AGV otonom        2020   22    10       kereta angkut tanpa awak di tepi plaza (2-4)
//   Stasiun EV        2022   25    12       tiang cas kendaraan listrik (3-6)
//   Menara kontrol    2024   30    14       menara kaca + radar berputar + cincin holografik
//
// Murni tambahan: tidak mengubah logika game. Semua bentuk statis digabung (mergedBoxes); hanya bagian bergerak yang punya
// referensi untuk animasi (tick). Tanpa import dari scene (kit disuplai scene) agar tidak ada siklus.
import { LanguageService } from '../../core/LanguageService.js';

function clampN(v, a, b) { return v < a ? a : v > b ? b : v; }
function lang() { var l = 'id'; try { l = LanguageService.getLang(); } catch (e) {} return l === 'id' ? 'id' : 'en'; }

export var ERA_FEATURES = [
    { id: 'fence',    year: 2000, lv: 2,  fl: 0 },
    { id: 'flood',    year: 2002, lv: 4,  fl: 1 },
    { id: 'parking',  year: 2004, lv: 6,  fl: 2 },
    { id: 'mast',     year: 2006, lv: 8,  fl: 3 },
    { id: 'solar',    year: 2010, lv: 10, fl: 4 },
    { id: 'roofsolar', year: 2012, lv: 12, fl: 5 },
    { id: 'wind',     year: 2014, lv: 15, fl: 6 },
    { id: 'drone',    year: 2018, lv: 18, fl: 8 },
    { id: 'agv',      year: 2020, lv: 22, fl: 10 },
    { id: 'ev',       year: 2022, lv: 25, fl: 12 },
    { id: 'tower',    year: 2024, lv: 30, fl: 14 }
];

var ERA_NAMES = [
    { from: 2000, id: 'Industri Awal', en: 'Early Industry' },
    { from: 2005, id: 'Manufaktur Digital', en: 'Digital Manufacturing' },
    { from: 2010, id: 'Pabrik Hijau', en: 'Green Factory' },
    { from: 2015, id: 'Industri 4.0', en: 'Industry 4.0' },
    { from: 2020, id: 'Pabrik Cerdas', en: 'Smart Factory' },
    { from: 2025, id: 'Pabrik Otonom', en: 'Autonomous Plant' }
];
var FEAT_NAMES = {
    fence:    { id: 'Pagar & pos jaga', en: 'Fence & guardhouse' },
    flood:    { id: 'Lampu sorot', en: 'Floodlights' },
    parking:  { id: 'Area parkir', en: 'Car park' },
    mast:     { id: 'Menara telekom', en: 'Telecom mast' },
    solar:    { id: 'Ladang surya', en: 'Solar field' },
    roofsolar: { id: 'Panel surya atap', en: 'Rooftop solar' },
    wind:     { id: 'Turbin angin', en: 'Wind turbines' },
    drone:    { id: 'Drone gudang', en: 'Warehouse drones' },
    agv:      { id: 'AGV otonom', en: 'Autonomous AGVs' },
    ev:       { id: 'Stasiun cas EV', en: 'EV charging' },
    tower:    { id: 'Menara kontrol', en: 'Control tower' }
};
var TXT = {
    id: { era: 'Era', next: 'Berikutnya', year: 'tahun', lv: 'Lv', fl: 'total Lv pabrik', all: 'Semua fasilitas era ini terbuka', unlocked: 'terbuka' },
    en: { era: 'Era', next: 'Next', year: 'year', lv: 'Lv', fl: 'total factory Lv', all: 'All facilities unlocked', unlocked: 'unlocked' }
};

export function eraName(year) {
    var out = ERA_NAMES[0];
    for (var i = 0; i < ERA_NAMES.length; i++) if (year >= ERA_NAMES[i].from) out = ERA_NAMES[i];
    return lang() === 'id' ? out.id : out.en;
}
export function featName(id) { var n = FEAT_NAMES[id]; return n ? n[lang()] : id; }

// Hitung status era dari data game. playerLevel dioper dari scene (PlayerProgression) agar modul ini tetap murni.
// states = allStates(data) dari ManufactureLogic (level per pabrik).
export function computeEra(data, states, playerLevel) {
    var year = (data && data.time && data.time.currentYear) || 2000;
    var lvl = Math.max(1, Math.floor(Number(playerLevel) || 1));
    var fl = 0, k;
    for (k in (states || {})) {
        var st = states[k];
        if (st && st.status === 'built') fl += Math.max(1, st.level || 1);
    }
    var n = {}, sig = [], nextF = null, missing = null;
    ERA_FEATURES.forEach(function (f) {
        var ok = year >= f.year && lvl >= f.lv && fl >= f.fl;
        if (!ok) {
            if (!nextF) { nextF = f; missing = { year: year < f.year, lv: lvl < f.lv, fl: fl < f.fl }; }
            return;
        }
        // tumbuh 1..3: keduanya (level & tahun) harus ikut maju
        var byLv = Math.floor((lvl - f.lv) / 8), byYr = Math.floor((year - f.year) / 6), byFl = Math.floor((fl - f.fl) / 6);
        n[f.id] = 1 + clampN(Math.min(byLv, byYr, byFl + 1), 0, 2);
        sig.push(f.id + n[f.id]);
    });
    var eraSig = year >= 2012 ? 'L' : 'S';                    // lampu sorot natrium vs LED
    if (year >= 2024) eraSig += '5';                           // mast 5G
    return {
        year: year, lvl: lvl, fl: fl, n: n, next: nextF, missing: missing,
        roofSolar: !!n.roofsolar,
        led: year >= 2012, fiveG: year >= 2024,
        sig: sig.join(',') + '|' + eraSig
    };
}

// Teks lencana (kiri atas peta): era + fasilitas berikutnya + syarat yang belum terpenuhi.
export function eraBadgeText(era) {
    var T = TXT[lang()];
    var dec = Math.floor(era.year / 10) * 10;
    var line1 = T.era + ' ' + dec + (lang() === 'id' ? '-an' : 's') + ' · ' + eraName(era.year);
    var line2;
    if (!era.next) line2 = T.all;
    else {
        var need = [];
        if (era.missing.year) need.push(T.year + ' ' + era.next.year);
        if (era.missing.lv) need.push(T.lv + ' ' + era.next.lv);
        if (era.missing.fl) need.push(T.fl + ' ' + era.next.fl);
        line2 = T.next + ': ' + featName(era.next.id) + ' (' + need.join(' · ') + ')';
    }
    return { line1: line1, line2: line2 };
}

// ============================================================
// LAPISAN 3D
// kit: { THREE, parent, M, G, look, mesh, box, cyl, sph, mergedBoxes, clear(x,z,r), reserve(x,z,r), ambient(), aura() }
// ============================================================
export function createEraLayer(kit) {
    var THREE = kit.THREE, M = kit.M, G = kit.G;
    var root = new THREE.Group();
    kit.parent.add(root);
    var own = [];                         // material milik lapisan ini (dibuang saat dispose)
    function mat(m) { own.push(m); return m; }
    var mSolar = mat(new THREE.MeshStandardMaterial({ color: 0x1d3a6e, roughness: 0.32, metalness: 0.55 }));
    var mBlade = mat(new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 0.5, metalness: 0.05 }));
    var mHolo = mat(new THREE.MeshBasicMaterial({ color: 0x5cf0ff, transparent: true, opacity: 0.5, depthWrite: false }));
    var mRadar = mat(new THREE.MeshBasicMaterial({ color: 0x8ae8ff, transparent: true, opacity: 0.7, depthWrite: false }));
    var mFlood = mat(new THREE.MeshBasicMaterial({ color: 0xffb55a }));
    var mGlowSpr = mat(new THREE.MeshBasicMaterial({ map: kit.aura(), color: 0xffb55a, transparent: true, opacity: 0, depthWrite: false }));
    var mCar = [0xd9534f, 0x3d7bd9, 0xe8e8ee, 0x2f3a4a, 0xe0b445, 0x43a870].map(function (c) { return mat(new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.25 })); });
    var mAgv = mat(new THREE.MeshStandardMaterial({ color: 0xff8a2a, roughness: 0.5, metalness: 0.2 }));
    var mEvLed = mat(new THREE.MeshBasicMaterial({ color: 0x43e08a }));
    var mDroneLed = mat(new THREE.MeshBasicMaterial({ color: 0xff4d4d }));

    // ---------- tata letak tetap: SEMUA fitur dipesan lokasinya sejak awal (urutan tetap) ----------
    // Supaya posisi tidak melompat saat fitur baru terbuka. Anchor dicoba berurutan; bila semuanya terhalang, cari acak
    // dengan PRNG lokal (seed tetap per fitur).
    var layout = {};
    function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
    function fits(x, z, hw, hd) {
        var pts = [[0, 0], [-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]];
        for (var i = 0; i < pts.length; i++) if (!kit.clear(x + pts[i][0], z + pts[i][1], 0.7)) return false;
        return true;
    }
    function place(id, hw, hd, anchors, seed) {
        var i, p = null;
        for (i = 0; i < anchors.length && !p; i++) if (fits(anchors[i][0], anchors[i][1], hw, hd)) p = { x: anchors[i][0], z: anchors[i][1] };
        if (!p) {
            var r = rng(seed);
            for (i = 0; i < 80 && !p; i++) {
                var x = -18 + r() * 36, z = -13 + r() * 26;
                if (fits(x, z, hw, hd)) p = { x: x, z: z };
            }
        }
        if (p) { kit.reserve(p.x, p.z, Math.max(hw, hd) * 0.9); p.hw = hw; p.hd = hd; }
        layout[id] = p;
        return p;
    }
    place('parking', 3.4, 1.2, [[-10.5, -11.8], [-12.0, -10.8], [-9.0, -12.2]], 11);
    place('solar', 4.5, 1.9, [[0.5, -11.9], [3, -11.2], [7, -11.9]], 12);
    place('ev', 1.5, 0.9, [[18.0, -4.3], [18.0, 4.6], [17.5, -6.5]], 13);
    place('mast', 0.8, 0.8, [[-18.6, -3.6], [-18.4, 3.6], [-17.6, -11.0]], 14);
    place('tower', 1.3, 1.3, [[17.2, -11.0], [15.0, -12.2], [-16.8, -11.8]], 15);
    ['w1', 'w2', 'w3'].forEach(function (k, i) {
        place(k, 1.1, 1.1, [[[7, -13.4], [13, -11.9], [-1, -13.7]][i], [[-9, -13.3], [-16, -10.9], [18.6, -9.6]][i]], 20 + i);
    });

    // ---------- grup per fitur: dibangun ulang hanya bila jumlahnya berubah ----------
    var groups = {};          // id -> { g, n, tick }
    var ticks = [];
    var nightK = 0;

    function disposeGroup(id) {
        var o = groups[id];
        if (!o) return;
        root.remove(o.g);
        o.g.traverse(function (ch) { if (ch.userData && ch.userData.ownGeo && ch.geometry) ch.geometry.dispose(); });
        var ix = ticks.indexOf(o.tick);
        if (ix >= 0) ticks.splice(ix, 1);
        delete groups[id];
    }

    var BUILD = {};

    BUILD.fence = function (g, n) {
        var posts = [], rails = [], x, z = -9.4;
        for (x = -16; x <= 16; x += 1.6) posts.push([0.06, 0.62, 0.06, x, 0.31, z]);
        rails.push([32.2, 0.035, 0.03, 0, 0.58, z], [32.2, 0.035, 0.03, 0, 0.3, z]);
        kit.mergedBoxes(g, 'steel', posts);
        kit.mergedBoxes(g, 'metal', rails);
        // pos jaga di gerbang barat-utara + palang
        var gx = -16.2, gz = -9.0;
        kit.box(g, 'wall', 0.7, 0.46, 0.55, gx, 0.23, gz);
        kit.box(g, 'roof', 0.82, 0.06, 0.66, gx, 0.49, gz);
        kit.box(g, 'win', 0.3, 0.16, 0.02, gx, 0.3, gz + 0.28);
        if (n >= 2) { kit.box(g, 'safety', 1.1, 0.04, 0.04, gx + 0.95, 0.4, gz + 0.1); kit.cyl(g, 'metal', 0.04, 0.45, gx + 0.4, 0.22, gz + 0.1); }
        if (n >= 3) { // kamera CCTV di dua tiang
            [-8, 8].forEach(function (cx) { kit.box(g, 'dark', 0.14, 0.07, 0.07, cx, 0.7, z + 0.05); });
        }
    };

    BUILD.flood = function (g, n, era) {
        var cnt = clampN(n + 1, 2, 4), pos = [[-18.0, -8.0], [17.8, -8.5], [-18.0, 7.0], [18.4, 6.8]], i, sprites = [];
        var led = !!era.led;
        mFlood.color.setHex(led ? 0xe4f4ff : 0xffb55a);
        mGlowSpr.color.setHex(led ? 0xcfe9ff : 0xffb55a);
        for (i = 0; i < cnt; i++) {
            var px = pos[i][0], pz = pos[i][1];
            kit.cyl(g, 'metal', 0.06, 2.0, px, 1.0, pz);
            kit.box(g, 'dark', 0.5, 0.3, 0.1, px, 2.05, pz);
            var head = kit.box(g, mFlood, 0.42, 0.22, 0.04, px, 2.05, pz + 0.07);
            head.castShadow = false;
            var spr = new THREE.Mesh(G.plane, mGlowSpr);
            spr.rotation.x = -Math.PI / 2; spr.scale.set(3.8, 3.8, 1); spr.position.set(px, 0.17, pz + 0.4); spr.renderOrder = 1;
            g.add(spr);
        }
    };

    BUILD.parking = function (g, n) {
        var o = layout.parking; if (!o) return;
        var cols = 6, rows = n >= 3 ? 2 : 1, cars = n >= 3 ? 12 : (n === 2 ? 8 : 5), i, lines = [];
        kit.box(g, 'road', o.hw * 2, 0.03, o.hd * 2, o.x, 0.04, o.z);
        for (i = 0; i <= cols; i++) lines.push([0.03, 0.012, o.hd * 2 - 0.2, o.x - o.hw + 0.3 + i * ((o.hw * 2 - 0.6) / cols), 0.065, o.z]);
        kit.mergedBoxes(g, 'roadLine', lines);
        var slot = (o.hw * 2 - 0.6) / cols;
        for (i = 0; i < cars; i++) {
            var c = i % cols, r = Math.floor(i / cols) % rows;
            var cx = o.x - o.hw + 0.3 + slot * (c + 0.5), cz = o.z + (rows === 2 ? (r === 0 ? -0.5 : 0.5) : 0), m = mCar[(i * 5 + 1) % mCar.length];
            kit.box(g, m, 0.34, 0.12, 0.62, cx, 0.12, cz);
            kit.box(g, 'win', 0.28, 0.09, 0.3, cx, 0.22, cz - 0.02);
        }
    };

    BUILD.mast = function (g, n, era) {
        var o = layout.mast; if (!o) return;
        kit.cyl(g, 'steel', 0.07, 3.4, o.x, 1.7, o.z);
        kit.cyl(g, 'steel', 0.16, 0.12, o.x, 0.06, o.z);
        kit.box(g, 'steel', 0.4, 0.04, 0.04, o.x, 2.7, o.z);
        kit.box(g, 'steel', 0.04, 0.04, 0.4, o.x, 2.35, o.z);
        var dish = kit.sph(g, 'white', 0.22, o.x + 0.2, 2.7, o.z + 0.12); dish.scale.set(0.22, 0.22, 0.08);
        kit.sph(g, 'ledR', 0.06, o.x, 3.45, o.z);
        var rings = [];
        if (era.fiveG) {
            [0, 0.5].forEach(function (ph) {
                var m = mat(new THREE.MeshBasicMaterial({ color: 0x8ae8ff, transparent: true, opacity: 0, depthWrite: false }));
                var rg = new THREE.Mesh(G.ring, m); rg.rotation.x = -Math.PI / 2; rg.position.set(o.x, 3.0, o.z);
                g.add(rg); rings.push({ m: m, mesh: rg, ph: ph });
            });
        }
        return function (sec) {
            for (var i = 0; i < rings.length; i++) {
                var t = (sec * 0.35 + rings[i].ph) % 1, s = 0.4 + t * 2.4;
                rings[i].mesh.scale.set(s, s, 1); rings[i].m.opacity = (1 - t) * 0.45;
            }
        };
    };

    BUILD.solar = function (g, n) {
        var o = layout.solar; if (!o) return;
        var rows = 2 + n, panels = [], frames = [], i, k, cols = Math.floor((o.hw * 2) / 0.75);
        var depth = o.hd * 2 / rows;
        kit.box(g, 'grass2', o.hw * 2 + 0.4, 0.03, o.hd * 2 + 0.3, o.x, 0.02, o.z);
        for (i = 0; i < rows; i++) {
            var rz = o.z - o.hd + depth * (i + 0.5);
            for (k = 0; k < cols; k++) {
                var px = o.x - o.hw + 0.4 + k * 0.75;
                panels.push([0.66, 0.035, Math.min(0.55, depth * 0.8), px, 0.34, rz]);
            }
            frames.push([o.hw * 2, 0.03, 0.04, o.x, 0.2, rz]);
        }
        for (i = 0; i < rows; i++) for (k = 0; k <= cols; k += 3) frames.push([0.04, 0.3, 0.04, o.x - o.hw + 0.1 + k * 0.75, 0.15, o.z - o.hd + depth * (i + 0.5)]);
        kit.mergedBoxes(g, mSolar, panels);
        kit.mergedBoxes(g, 'steel', frames);
    };

    BUILD.wind = function (g, n) {
        var blades = [];
        ['w1', 'w2', 'w3'].forEach(function (k, i) {
            if (i >= n) return;
            var o = layout[k]; if (!o) return;
            kit.cyl(g, 'white', 0.1, 3.2, o.x, 1.6, o.z);
            kit.cyl(g, 'white', 0.14, 0.12, o.x, 0.06, o.z);
            var hub = new THREE.Group(); hub.position.set(o.x, 3.25, o.z + 0.14);
            kit.box(hub, 'white', 0.2, 0.2, 0.34, 0, 0, -0.08);
            var rot = new THREE.Group(); hub.add(rot);
            for (var b = 0; b < 3; b++) {
                var arm = new THREE.Group(); arm.rotation.z = b * Math.PI * 2 / 3; rot.add(arm);
                var bl = new THREE.Mesh(G.box, mBlade); bl.scale.set(0.09, 1.25, 0.03); bl.position.set(0, 0.7, 0.04); bl.castShadow = !!kit.look.shadows; arm.add(bl);
            }
            g.add(hub);
            blades.push({ rot: rot, ph: i * 1.7 });
        });
        return function (sec) { for (var i = 0; i < blades.length; i++) blades[i].rot.rotation.z = (kit.ambient() ? sec * 1.1 : 0) + blades[i].ph; };
    };

    // jalur drone antar pabrik (koordinat plot)
    var DRONE_PATHS = [[[-12, 5.2], [-4.5, 14.0]], [[-4, 5.2], [4, 5.2]], [[0, -5.2], [12, 5.2]]];
    BUILD.drone = function (g, n) {
        var ds = [];
        for (var i = 0; i < n; i++) {
            var d = new THREE.Group(), body = kit.box(d, 'dark', 0.22, 0.07, 0.22, 0, 0, 0);
            var rotors = [];
            [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
                kit.box(d, 'steel', 0.03, 0.03, 0.03, c[0] * 0.14, 0.02, c[1] * 0.14);
                var r = kit.box(d, 'white', 0.17, 0.012, 0.025, c[0] * 0.14, 0.05, c[1] * 0.14); rotors.push(r);
            });
            kit.box(d, 'ledR', 0.04, 0.03, 0.04, 0, -0.01, 0.12).material = mDroneLed;
            var crate = kit.box(d, 'crate', 0.14, 0.12, 0.14, 0, -0.14, 0);
            d.visible = true; g.add(d);
            ds.push({ d: d, rotors: rotors, crate: crate, path: DRONE_PATHS[i % DRONE_PATHS.length], off: i * 0.31 });
        }
        return function (sec) {
            for (var i = 0; i < ds.length; i++) {
                var o = ds[i], t = ((kit.ambient() ? sec * 0.022 : 0) + o.off) % 1;
                var leg = t < 0.5 ? t * 2 : (1 - t) * 2;            // 0->1->0 (pulang-pergi)
                var e = leg * leg * (3 - 2 * leg), a = o.path[0], b = o.path[1];
                o.d.position.set(a[0] + (b[0] - a[0]) * e, 2.7 + Math.sin(sec * 2 + i) * 0.04 + Math.sin(e * Math.PI) * 0.5, a[1] + (b[1] - a[1]) * e);
                var dir = t < 0.5 ? 1 : -1;
                o.d.rotation.y = Math.atan2((b[0] - a[0]) * dir, (b[1] - a[1]) * dir);
                o.crate.visible = t < 0.5;                           // bawa peti saat berangkat, kosong saat pulang
                for (var r = 0; r < o.rotors.length; r++) o.rotors[r].rotation.y = sec * 40 + r;
            }
        };
    };

    var AGV_LANES = [{ z: -8.62, x0: -14.5, x1: 14.5 }, { z: 1.78, x0: -1.2, x1: 14.2 }];
    BUILD.agv = function (g, n) {
        var cnt = n + 1, carts = [], i;
        for (i = 0; i < cnt; i++) {
            var c = new THREE.Group();
            kit.box(c, 'dark', 0.5, 0.09, 0.3, 0, 0, 0);
            kit.box(c, mAgv, 0.38, 0.12, 0.24, 0, 0.1, 0);
            kit.box(c, mEvLed, 0.5, 0.02, 0.02, 0, 0.02, 0.16);
            g.add(c);
            carts.push({ c: c, lane: AGV_LANES[i % AGV_LANES.length], ph: i * 0.37 });
        }
        return function (sec) {
            for (var i = 0; i < carts.length; i++) {
                var o = carts[i], u = ((kit.ambient() ? sec * 0.03 : 0) + o.ph) % 1, leg = u < 0.5 ? u * 2 : (1 - u) * 2;
                var e = leg * leg * (3 - 2 * leg);                       // melambat di ujung jalur
                o.c.position.set(o.lane.x0 + (o.lane.x1 - o.lane.x0) * e, 0.2, o.lane.z);
                o.c.rotation.y = u < 0.5 ? 0 : Math.PI;
            }
        };
    };

    BUILD.ev = function (g, n) {
        var o = layout.ev; if (!o) return;
        var cnt = 2 + n, i, slot = (o.hw * 2) / cnt;
        kit.box(g, 'road', o.hw * 2 + 0.2, 0.03, o.hd * 2, o.x, 0.04, o.z);
        for (i = 0; i < cnt; i++) {
            var cx = o.x - o.hw + slot * (i + 0.5);
            kit.box(g, 'steel', 0.1, 0.5, 0.1, cx, 0.3, o.z - o.hd + 0.25);
            kit.box(g, mEvLed, 0.07, 0.07, 0.02, cx, 0.46, o.z - o.hd + 0.31);
            kit.box(g, 'roadLine', 0.03, 0.012, o.hd * 1.3, cx + slot / 2, 0.065, o.z + 0.1);
            if (i % 2 === 0) { kit.box(g, mCar[5], 0.32, 0.11, 0.58, cx, 0.11, o.z + 0.15); kit.box(g, 'win', 0.26, 0.08, 0.28, cx, 0.2, o.z + 0.13); }
        }
        kit.box(g, 'roof', o.hw * 2 + 0.2, 0.05, 0.5, o.x, 0.95, o.z - o.hd + 0.3);               // kanopi
        [-1, 1].forEach(function (s) { kit.box(g, 'steel', 0.05, 0.9, 0.05, o.x + s * (o.hw + 0.05), 0.5, o.z - o.hd + 0.3); });
    };

    BUILD.tower = function (g, n) {
        var o = layout.tower; if (!o) return;
        kit.box(g, 'base', 1.6, 0.12, 1.6, o.x, 0.06, o.z);
        kit.box(g, 'steel', 0.95, 0.5, 0.95, o.x, 0.37, o.z);
        kit.box(g, 'glass', 0.8, 2.4, 0.8, o.x, 1.8, o.z);
        kit.box(g, 'steel', 0.9, 0.08, 0.9, o.x, 3.04, o.z);
        kit.box(g, 'win', 0.7, 0.4, 0.7, o.x, 3.28, o.z);
        kit.cyl(g, 'steel', 0.03, 0.5, o.x, 3.7, o.z);
        var radar = new THREE.Mesh(G.box, mRadar); radar.scale.set(0.7, 0.04, 0.08); radar.position.set(o.x, 3.95, o.z); g.add(radar);
        var holo = new THREE.Mesh(G.tor, mHolo); holo.scale.set(1.0, 1.0, 1.0); holo.rotation.x = Math.PI / 2; holo.position.set(o.x, 2.2, o.z); g.add(holo);
        var holo2 = new THREE.Mesh(G.tor, mHolo); holo2.scale.set(0.75, 0.75, 0.75); holo2.rotation.x = Math.PI / 2; holo2.position.set(o.x, 1.6, o.z); g.add(holo2);
        return function (sec) {
            radar.rotation.y = kit.ambient() ? sec * 2.2 : 0;
            holo.rotation.z = kit.ambient() ? sec * 0.8 : 0;
            holo2.rotation.z = kit.ambient() ? -sec * 1.1 : 0;
            var p = 1 + Math.sin(sec * 1.6) * 0.04;
            holo.scale.set(p, p, p);
            mHolo.opacity = 0.32 + 0.3 * nightK;
        };
    };

    // ---------- sinkron ----------
    var lastSig = '';
    function apply(era) {
        if (era.sig === lastSig) return false;
        lastSig = era.sig;
        Object.keys(BUILD).forEach(function (id) {
            var want = era.n[id] || 0, cur = groups[id];
            var key = want + (id === 'flood' || id === 'mast' ? (era.led ? 'L' : 'S') + (era.fiveG ? '5' : '') : '');
            if (cur && cur.key === key) return;
            disposeGroup(id);
            if (!want) return;
            var g = new THREE.Group();
            root.add(g);
            var tk = null;
            try { tk = BUILD[id](g, want, era); } catch (e) { console.warn('[ManufactureEra] ' + id, e); }
            groups[id] = { g: g, n: want, key: key, tick: tk };
            if (tk) ticks.push(tk);
        });
        return true;
    }
    // Menandai geometri gabungan milik lapisan ini supaya ikut dibuang (mergedBoxes sudah menandai ownGeo).
    function tick(sec, night) {
        nightK = night || 0;
        mGlowSpr.opacity = 0.05 + 0.5 * nightK;
        for (var i = 0; i < ticks.length; i++) ticks[i](sec);
    }
    function dispose() {
        Object.keys(groups).forEach(disposeGroup);
        kit.parent.remove(root);
        own.forEach(function (m) { m.dispose(); });
    }
    return { apply: apply, tick: tick, dispose: dispose, has: function (id) { return !!groups[id]; } };
}

// ============================================================
// Panel surya atap untuk hall (dipanggil dari buildHallDetail bila kit.era.roofSolar)
// ============================================================
export function buildRoofSolar(kit, f, dm, zc, top) {
    var hw = dm.bw / 2, list = [], x, z = zc + 0.08, depth = Math.min(0.5, dm.bd * 0.22);
    for (x = -hw + 0.7; x <= hw - 0.7; x += 0.62) list.push([0.54, 0.03, depth, x, top + 0.05, z]);
    kit.mergedBoxes(f, 'solar', list);
}
