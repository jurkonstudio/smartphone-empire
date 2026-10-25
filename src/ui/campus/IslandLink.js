// FILE: src/ui/campus/IslandLink.js  (BARU — v2027.65)
// Penghubung Peta Kampus <-> Peta Manufaktur. Dua pulau sekarang saling bersebrangan di laut dan
// tersambung satu jembatan jalan raya: jalan barat Kampus (z = 0) lurus menyambung ke jalan raya
// Manufaktur (z = 0). Karena dua peta adalah dua scene WebGL terpisah (satu konteks aktif sekaligus),
// masing-masing scene menggambar pulau seberang sebagai siluet statis ringan + jembatan yang sama.
//
// Tata letak (koordinat dunia scene Kampus; scene Manufaktur adalah cerminan sumbu x-nya):
//     Manufaktur (pusat x = -OFFSET) <== jembatan ==> Kampus (pusat x = 0)
//
// Modul ini berisi:
//   - LINK                   konstanta bersama (jarak pulau, lebar jembatan, tinggi jalan).
//   - campusBridgeCfg()      konfigurasi jembatan sudut pandang Kampus (arah -x).
//   - mfBridgeCfg()          konfigurasi jembatan sudut pandang Manufaktur (arah +x).
//   - buildLinkBridge()      jembatan: tanjakan, dek, pilar, pagar, lampu, gapura. Mengembalikan
//                            { group, heightAt(x) } supaya kendaraan bisa naik-turun mengikuti dek.
//   - makeCampusKit()        adaptor material/geometri Kampus (createAssets) untuk jembatan.
//   - buildMfFar()           siluet Pulau Manufaktur (dilihat dari Kampus).
//   - buildCampusFar()       siluet Pulau Kampus (dilihat dari Manufaktur).
// Semua statis: tanpa animasi, tanpa tap, tanpa bayangan. dispose() membuang geometri & material.
import { PALETTES, islandRadius, SLOTS, SLOT_ORDER } from './CampusBuildings.js';
import { PLOTS } from '../manufacture/ManufactureLogic.js';

export var LINK = {
    OFFSET: 55,             // jarak pusat Kampus ke pusat Manufaktur (sumbu x)
    WIDTH: 2.3,             // lebar badan jalan jembatan
    DECK_Y: 0.5,            // permukaan dek di atas laut
    RAMP: 3.6,              // panjang tanjakan naik/turun (di daratan, sebelum garis pantai)
    CAMPUS_ROAD_Y: 0.06,    // permukaan jalan barat Kampus
    MF_ROAD_Y: 0.13,        // permukaan jalan raya Manufaktur
    CAMPUS_ROAD_END: 15,    // ujung jalan barat Kampus (|x| lokal)
    MF_ROAD_END: 16.7,      // ujung jalan raya Manufaktur (|x| lokal)
    EPS: 0.004              // sedikit di atas jalan lama agar tidak z-fighting
};

// Garis pantai Pulau Manufaktur. HARUS sama dengan coastR() di ManufactureScene.js.
var MF_ISLAND = { rx: 21, rz: 14.5, n: 3.2 };
export function mfCoastR(th) {
    var c = Math.abs(Math.cos(th)) / MF_ISLAND.rx, s = Math.abs(Math.sin(th)) / MF_ISLAND.rz;
    var r = Math.pow(Math.pow(c, MF_ISLAND.n) + Math.pow(s, MF_ISLAND.n), -1 / MF_ISLAND.n);
    return r * (1 + 0.045 * Math.sin(3 * th + 0.8) + 0.03 * Math.sin(5 * th + 2.1));
}

// ---------- konfigurasi jembatan ----------
// Kampus: dari ujung jalan barat (x -15) ke barat sampai masuk jalan raya Manufaktur.
export function campusBridgeCfg() {
    return {
        dir: -1,
        x0: -(LINK.CAMPUS_ROAD_END - 0.1), y0: LINK.CAMPUS_ROAD_Y,
        x1: -LINK.OFFSET + LINK.MF_ROAD_END - 0.4, y1: LINK.MF_ROAD_Y,
        coast0: -islandRadius(Math.PI),
        coast1: -LINK.OFFSET + mfCoastR(0),
        dash: [1.0, 0.5, 0.1]
    };
}
// Manufaktur: dari ujung timur jalan raya (x 16.7) ke timur sampai masuk jalan barat Kampus.
export function mfBridgeCfg() {
    return {
        dir: 1,
        x0: LINK.MF_ROAD_END - 0.5, y0: LINK.MF_ROAD_Y,
        x1: LINK.OFFSET - LINK.CAMPUS_ROAD_END + 0.4, y1: LINK.CAMPUS_ROAD_Y,
        coast0: mfCoastR(0),
        coast1: LINK.OFFSET - islandRadius(Math.PI),
        dash: [2.0, 0.9, 0.09]
    };
}

// ============================================================
// JEMBATAN
// kit = { mat(role), custom(key, fn), box(g, role, w,h,d, x,y,z), cyl(g, role, r,h, x,y,z), sph(g, role, r, x,y,z) }
// role: road | curb | line | post | pole | lamp
// ============================================================
export function buildLinkBridge(THREE, kit, cfg) {
    var group = new THREE.Group();
    group.name = 'island-link-bridge';
    var dir = cfg.dir, x0 = cfg.x0, W = LINK.WIDTH, R = LINK.RAMP, E = LINK.EPS;
    var deckY = LINK.DECK_Y, y0 = cfg.y0, y1 = cfg.y1;
    var L = dir * (cfg.x1 - x0);                      // panjang total (sepanjang jalan)
    var c0 = dir * (cfg.coast0 - x0);                 // jarak ke garis pantai pulau asal
    var c1 = dir * (cfg.coast1 - x0);                 // jarak ke garis pantai pulau seberang
    var s1 = Math.max(0.6, c0 - 0.8 - R), s2 = s1 + R;            // tanjakan naik (di daratan asal)
    var s4 = Math.min(L - 0.5, c1 + 0.8 + R), s3 = s4 - R;        // tanjakan turun (di daratan seberang)

    function wx(s) { return x0 + dir * s; }
    // Tinggi permukaan jalan di jarak s.
    function yAt(s) {
        if (s <= s1) return y0;
        if (s < s2) return y0 + (deckY - y0) * (s - s1) / R;
        if (s <= s3) return deckY;
        if (s < s4) return deckY + (y1 - deckY) * (s - s3) / (s4 - s3);
        return y1;
    }

    // Papan miring dari (sa) ke (sb); permukaan atas melewati titik jalan. lift = tinggi permukaan papan
    // dari jalan, th = tebal, zc = geser samping, wid = lebar.
    function slab(role, sa, sb, wid, th, zc, lift) {
        var xa = wx(sa), xb = wx(sb), ya = yAt(sa) + E, yb = yAt(sb) + E, t;
        if (xb < xa) { t = xa; xa = xb; xb = t; t = ya; ya = yb; yb = t; }
        var dx = xb - xa, dy = yb - ya, len = Math.hypot(dx, dy), phi = Math.atan2(dy, dx);
        var nx = -Math.sin(phi), ny = Math.cos(phi);
        var cx = (xa + xb) / 2 + nx * (lift - th / 2), cy = (ya + yb) / 2 + ny * (lift - th / 2);
        var m = kit.box(group, role, len, th, wid, cx, cy, zc);
        m.rotation.z = phi;
        return m;
    }

    // Tanjakan padat (baji) supaya tidak ada rongga di bawah jalan yang menanjak.
    function wedge(sLow, sHigh, rise) {
        var key = 'lkWedge_' + rise.toFixed(3) + '_' + R;
        var geo = kit.custom(key, function () {
            var sh = new THREE.Shape();
            sh.moveTo(0, -0.18); sh.lineTo(R, -0.18); sh.lineTo(R, rise); sh.lineTo(0, 0); sh.closePath();
            var g = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: false, curveSegments: 1 });
            g.translate(0, 0, -W / 2);
            return g;
        });
        var m = new THREE.Mesh(geo, kit.mat('road'));
        var worldSign = sHigh > sLow ? dir : -dir;       // ke arah mana tanjakan menaik di dunia
        m.rotation.y = worldSign > 0 ? 0 : Math.PI;
        m.position.set(wx(sLow), yAt(sLow) + E, 0);
        m.castShadow = false; m.receiveShadow = false;
        group.add(m);
        return m;
    }

    // ---- badan jalan ----
    slab('road', 0, s1, W, 0.1, 0, 0);                     // datar di daratan asal
    wedge(s1, s2, deckY - y0);                             // naik
    slab('road', s2, s3, W, 0.1, 0, 0);                    // dek di atas air
    slab('curb', s2, s3, W - 0.35, 0.3, 0, -0.1);          // gelagar di bawah dek
    wedge(s4, s3, deckY - y1);                             // turun
    slab('road', s4, L, W, 0.1, 0, 0);                     // datar di daratan seberang

    // ---- pagar rendah di kedua sisi (sepanjang jalan) ----
    var segs = [[0, s1], [s1, s2], [s2, s3], [s3, s4], [s4, L]];
    segs.forEach(function (sg) {
        if (sg[1] - sg[0] < 0.01) return;
        [-1, 1].forEach(function (side) { slab('curb', sg[0], sg[1], 0.12, 0.26, side * (W / 2 - 0.06), 0.26); });
    });

    // ---- marka tengah putus-putus (mengikuti kemiringan) ----
    if (cfg.dash) {
        var ds = cfg.dash;
        for (var s = 0.6; s < L - 0.3; s += ds[0]) {
            var slope = (yAt(s + 0.15) - yAt(s - 0.15)) / 0.3;
            var dm = kit.box(group, 'line', ds[1], 0.012, ds[2], wx(s), yAt(s) + E + 0.007, 0);
            dm.rotation.z = Math.atan(slope * dir);
        }
    }

    // ---- pangkal jembatan (abutment): menutup celah antara dek dan tanah di sisi darat ----
    [[s2, c0 + 0.3], [c1 - 0.3, s3]].forEach(function (ab) {
        var len = ab[1] - ab[0];
        if (len > 0.2) kit.box(group, 'curb', len, 0.5, W - 0.2, wx((ab[0] + ab[1]) / 2), 0.15, 0);
    });

    // ---- pilar di atas air/pasir ----
    var pierSpan = c1 - c0 - 2.2;
    if (pierSpan > 1) {
        var nP = Math.max(2, Math.round(pierSpan / 3.0) + 1), stepP = pierSpan / (nP - 1);
        for (var i = 0; i < nP; i++) {
            var px = wx(c0 + 1.1 + i * stepP);
            var colTop = deckY - 0.5, colBot = -0.62;
            [-1, 1].forEach(function (side) {
                kit.cyl(group, 'curb', 0.15, colTop - colBot, px, (colTop + colBot) / 2, side * (W / 2 - 0.4));
            });
            kit.box(group, 'curb', 0.5, 0.2, W - 0.1, px, deckY - 0.42, 0);     // balok kepala pilar
        }
    }

    // ---- lampu jembatan (selang-seling kiri/kanan) ----
    var lampIdx = 0;
    for (var ls = s2 + 1.2; ls < s3 - 0.9; ls += 4.4, lampIdx++) {
        var lz = (lampIdx % 2 ? 1 : -1) * (W / 2 - 0.06), lx = wx(ls);
        kit.cyl(group, 'pole', 0.035, 1.3, lx, deckY + 0.65 + E, lz);
        kit.sph(group, 'lamp', 0.1, lx, deckY + 1.35 + E, lz);
    }

    // ---- gapura di kedua ujung dek ----
    [s2 + 0.25, s3 - 0.25].forEach(function (gs) {
        var gx = wx(gs);
        [-1, 1].forEach(function (side) { kit.box(group, 'post', 0.2, 1.9, 0.2, gx, deckY + 0.95, side * (W / 2 - 0.06)); });
        kit.box(group, 'post', 0.24, 0.2, W + 0.1, gx, deckY + 1.9, 0);
    });

    return {
        group: group,
        // Tinggi permukaan jalan di posisi x dunia (di luar jembatan = tinggi jalan pulau terdekat).
        heightAt: function (x) { return yAt(dir * (x - x0)); },
        span: { s1: s1, s2: s2, s3: s3, s4: s4, length: L }
    };
}

// Adaptor Kampus: geometri/material dari createAssets (ikut tema & di-dispose bersama A.dispose()).
export function makeCampusKit(THREE, A) {
    var MAP = { road: 'road', curb: 'curb', line: 'wall', post: 'wall', pole: 'metal', lamp: 'lamp' };
    function put(g, geo, role, x, y, z) {
        var m = new THREE.Mesh(geo, A.mat(MAP[role]));
        m.position.set(x, y, z);
        m.castShadow = false; m.receiveShadow = false;
        g.add(m);
        return m;
    }
    return {
        mat: function (role) { return A.mat(MAP[role]); },
        custom: function (key, fn) { return A.custom(key, fn); },
        box: function (g, role, w, h, d, x, y, z) { return put(g, A.box(w, h, d), role, x, y, z); },
        cyl: function (g, role, r, h, x, y, z) { return put(g, A.cyl(r, r, h, 10), role, x, y, z); },
        sph: function (g, role, r, x, y, z) { return put(g, A.sph(r, 8, 6), role, x, y, z); }
    };
}

// ============================================================
// SILUET PULAU SEBERANG
// ============================================================
function rngFn(seed) {
    return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

// Fondasi siluet: grup, material berpasangan [terang, gelap], geometri bersama, lempengan pulau.
function createFar(THREE, parent, ox, defs) {
    var group = new THREE.Group();
    group.position.x = ox;
    parent.add(group);
    var geos = [], keys = Object.keys(defs), mats = {}, extra = [];
    keys.forEach(function (k) {
        var m = new THREE.MeshStandardMaterial({ color: defs[k][0], roughness: 0.85, metalness: 0 });
        m.envMapIntensity = 0.45;     // setara skala env bahan pulau utama
        mats[k] = m;
    });
    var boxG = new THREE.BoxGeometry(1, 1, 1), ballG = new THREE.SphereGeometry(1, 10, 8), cylG = new THREE.CylinderGeometry(1, 1, 1, 12);
    geos.push(boxG, ballG, cylG);

    function mm(key) { return typeof key === 'string' ? mats[key] : key; }
    // Haze jarak (CinematicFx): warna material dicampur ke warna kabut agar pulau tetangga tampak lebih jauh.
    var nightN = 0, hazeCol = new THREE.Color(0xffffff), hazeAmt = 0;
    var cMix = new THREE.Color();
    function paint() {
        keys.forEach(function (k) {
            mats[k].color.setHex(defs[k][0]);
            if (nightN > 0) mats[k].color.lerp(cMix.setHex(defs[k][1]), nightN);
            if (hazeAmt > 0) mats[k].color.lerp(hazeCol, hazeAmt);
        });
        extra.forEach(function (m) {
            m.color.setHex(m.userData.baseHex);
            if (hazeAmt > 0) m.color.lerp(hazeCol, hazeAmt);
        });
    }
    return {
        group: group, mats: mats, boxG: boxG, ballG: ballG, cylG: cylG,
        // Warna tetap (mis. aksen pabrik); ikut di-dispose.
        solid: function (hex) {
            var m = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.6, metalness: 0.1 });
            m.envMapIntensity = 0.45;
            m.userData.baseHex = hex;
            if (hazeAmt > 0) m.color.lerp(hazeCol, hazeAmt);
            extra.push(m);
            return m;
        },
        piece: function (geo, key, sx, sy, sz, x, y, z) {
            var m = new THREE.Mesh(geo, mm(key));
            m.scale.set(sx, sy, sz);
            m.position.set(x, y, z);
            m.castShadow = false; m.receiveShadow = false;
            group.add(m);
            return m;
        },
        // Lempengan berbentuk garis pantai; atas di y = top. key string atau [cap, sisi].
        slab: function (radiusFn, scale, top, depth, key) {
            var sh = new THREE.Shape(), N = 96, i;
            for (i = 0; i < N; i++) {
                var th = (i / N) * Math.PI * 2, r = radiusFn(th) * scale;
                var px = Math.cos(th) * r, pz = Math.sin(th) * r;
                if (i === 0) sh.moveTo(px, -pz); else sh.lineTo(px, -pz);
            }
            sh.closePath();
            var g = new THREE.ExtrudeGeometry(sh, { depth: depth, bevelEnabled: false, curveSegments: 1 });
            g.rotateX(-Math.PI / 2);
            geos.push(g);
            var m = new THREE.Mesh(g, Array.isArray(key) ? key.map(mm) : mm(key));
            m.position.y = top - depth;
            m.castShadow = false; m.receiveShadow = false;
            group.add(m);
            return m;
        },
        // dark: boolean (lama) atau 0..1 (tingkat malam, siklus siang-malam)
        setDark: function (dark) {
            nightN = Math.max(0, Math.min(1, +dark || 0));
            paint();
        },
        // hex warna kabut + jumlah campuran 0..1 (0 = warna asli).
        setHaze: function (hex, amount) {
            hazeCol.setHex(hex);
            hazeAmt = Math.max(0, Math.min(0.6, amount || 0));
            paint();
        },
        dispose: function () {
            geos.forEach(function (g) { g.dispose(); });
            keys.forEach(function (k) { mats[k].dispose(); });
            extra.forEach(function (m) { m.dispose(); });
            parent.remove(group);
        }
    };
}

// Warna Pulau Manufaktur [terang, gelap] — sama dengan COLORS di ManufactureScene.js.
var MF_FAR = {
    ground: [0xc4e3bd, 0x203b32], soil: [0x806b56, 0x332a26], shallow: [0x86d8e8, 0x1a7a98], foam: [0xf4fbff, 0x9cc4d8],
    sand: [0xf1dfae, 0x7a6f58], sandWet: [0xd9c795, 0x5e5543], base: [0xdfe5ee, 0x2c3544], pad: [0xf3f5fa, 0x3b4658],
    road: [0x6f7b8d, 0x1d232d], roadLine: [0xf5f7fb, 0xb9c3d3], wall: [0xf4f7fc, 0xc0ccdc], steel: [0xc9d1dc, 0x8a95a6],
    leaf: [0x72bd78, 0x347d51], trunk: [0x9b7655, 0x5d4939]
};

// Siluet Pulau Manufaktur untuk peta Kampus. Berpusat di (ox, 0, 0); denah sama dengan PLOTS.
export function buildMfFar(THREE, parent, ox) {
    var F = createFar(THREE, parent, ox, MF_FAR);
    var R = mfCoastR;
    // perairan dangkal & busa digambar shader laut (SeaWater.js)
    F.slab(R, 1.08, -0.26, 0.5, 'sandWet');
    F.slab(R, 1.05, -0.03, 0.7, 'sand');
    F.slab(R, 1.0, 0, 0.7, ['ground', 'soil']);

    // plaza + jalan raya + jalan menuju jembatan
    F.piece(F.boxG, 'base', 33.4, 0.1, 17.9, 0, 0.05, 0);
    F.piece(F.boxG, 'road', 33.4, 0.03, 2.7, 0, 0.115, 0);
    var ax0 = LINK.MF_ROAD_END - 0.2, ax1 = mfCoastR(0) - 0.2;
    F.piece(F.boxG, 'road', ax1 - ax0, 0.03, 2.7, (ax0 + ax1) / 2, 0.115, 0);
    for (var li = -15; li <= 15; li += 2) F.piece(F.boxG, 'roadLine', 0.9, 0.012, 0.09, li, 0.135, 0);

    // pabrik: alas + badan + pita atap berwarna aksen
    PLOTS.forEach(function (p) {
        var acc = F.solid(p.accent);
        var hh = p.kind === 'fab' ? 2.4 : (p.kind === 'hub' ? 1.3 : 1.7);
        var bw = p.kind === 'fab' ? p.w - 2.2 : p.w - 1.6, bd = p.d - 1.8, bz = p.z - 0.6;
        F.piece(F.boxG, 'pad', p.w, 0.06, p.d, p.x, 0.13, p.z);
        F.piece(F.boxG, 'wall', bw, hh, bd, p.x, 0.16 + hh / 2, bz);
        F.piece(F.boxG, acc, bw + 0.1, 0.2, bd + 0.1, p.x, 0.16 + hh + 0.1, bz);
        if (p.kind === 'fab') {
            [-3.2, 3.2].forEach(function (cx) { F.piece(F.cylG, 'steel', 0.45, 3.4, 0.45, p.x + cx, 0.16 + 1.7, p.z - 1.7); });
        }
    });

    // pepohonan di pinggir pulau (di luar plaza & di luar jalur jembatan)
    var rnd = rngFn(313), i, n = 0;
    for (i = 0; i < 80 && n < 12; i++) {
        var th = rnd() * Math.PI * 2, dist = mfCoastR(th) * (0.72 + rnd() * 0.2);
        var tx = Math.cos(th) * dist, tz = Math.sin(th) * dist;
        if (Math.abs(tx) < 17.4 && Math.abs(tz) < 9.6) continue;
        if (tx > 15 && Math.abs(tz) < 3.8) continue;
        F.piece(F.cylG, 'trunk', 0.12, 0.7, 0.12, tx, 0.35, tz);
        F.piece(F.ballG, 'leaf', 0.5, 0.5, 0.5, tx, 0.95, tz);
        n++;
    }
    return F;
}

// Warna Pulau Kampus [terang, gelap] diambil dari PALETTES.
var CAMPUS_FAR_KEYS = ['grass', 'soil', 'sand', 'sandWet', 'shallow', 'foam', 'plaza', 'road', 'wall', 'window', 'leaf', 'trunk', 'curb'];
// Tinggi siluet gedung per slot (satuan dunia).
var SLOT_H = { lab: 2.2, factory: 1.8, store: 1.6, os: 2.4, billboard: 2.6, monument: 1.8, academy: 2.0, arena: 1.5, port: 0.9, pcplant: 1.8, chipdesign: 2.0, bank: 1.8, housing: 0.9 };

// Siluet Pulau Kampus untuk peta Manufaktur. Berpusat di (ox, 0, 0); gedung di posisi slot asli.
export function buildCampusFar(THREE, parent, ox) {
    var defs = {};
    CAMPUS_FAR_KEYS.forEach(function (k) { defs[k] = [PALETTES.light[k], PALETTES.dark[k]]; });
    var F = createFar(THREE, parent, ox, defs);
    var R = function (th) { return islandRadius(th, 1); };
    // perairan dangkal & busa digambar shader laut (SeaWater.js)
    F.slab(R, 1.08, -0.26, 0.5, 'sandWet');
    F.slab(R, 1.05, -0.03, 0.7, 'sand');
    F.slab(R, 1.0, 0, 0.7, ['grass', 'soil']);

    // plaza + jalan barat (menuju jembatan) + jalan selatan
    F.piece(F.boxG, 'plaza', 7, 0.08, 7, 0, 0.04, 0);
    var coastW = islandRadius(Math.PI);
    var wx0 = -LINK.CAMPUS_ROAD_END, wx1 = -(coastW - 0.25);          // dari ujung jalan lama sampai tepi pantai
    F.piece(F.boxG, 'road', 11.5, 0.06, 2, -9.25, 0.03, 0);
    F.piece(F.boxG, 'road', Math.abs(wx1 - wx0), 0.06, 2, (wx0 + wx1) / 2, 0.03, 0);
    F.piece(F.boxG, 'road', 2, 0.06, 11.5, 0, 0.03, 9.25);

    // HQ di tengah + pita jendela di atap
    F.piece(F.boxG, 'wall', 5, 4, 5, 0, 2, 0);
    F.piece(F.boxG, 'window', 5.1, 0.3, 5.1, 0, 4.15, 0);

    // gedung-gedung di slot asli kampus
    SLOT_ORDER.forEach(function (id) {
        var sp = SLOTS[id];
        if (!sp) return;
        var h = SLOT_H[id] || 1.8;
        if (id === 'billboard') { F.piece(F.boxG, 'window', 2.2, h, 0.3, sp[0], h / 2, sp[1]); return; }
        if (id === 'monument') { F.piece(F.cylG, 'plaza', 0.5, h, 0.5, sp[0], h / 2, sp[1]); return; }
        var w = id === 'arena' ? 3.8 : 2.8;
        // v2027.72 — siluet lebih hidup: halaman paving, podium + tingkat atas (setback), pita jendela & atap beda warna
        F.piece(F.boxG, 'plaza', w + 1.3, 0.05, w + 1.3, sp[0], 0.03, sp[1]);
        if (id === 'arena' || id === 'port' || id === 'housing') {
            F.piece(F.boxG, 'wall', w, h, w, sp[0], h / 2, sp[1]);
            F.piece(F.boxG, 'window', w + 0.1, 0.22, w + 0.1, sp[0], h + 0.05, sp[1]);
            return;
        }
        var ph = h * 0.58;
        F.piece(F.boxG, 'wall', w, ph, w, sp[0], ph / 2, sp[1]);
        F.piece(F.boxG, 'window', w + 0.08, 0.18, w + 0.08, sp[0], ph * 0.55, sp[1]);
        F.piece(F.boxG, 'curb', w + 0.14, 0.1, w + 0.14, sp[0], ph + 0.05, sp[1]);
        var uw = w * 0.66, uh = h - ph;
        F.piece(F.boxG, 'wall', uw, uh, uw, sp[0] + 0.15, ph + uh / 2, sp[1] - 0.15);
        F.piece(F.boxG, 'window', uw + 0.08, 0.2, uw + 0.08, sp[0] + 0.15, h + 0.05, sp[1] - 0.15);
    });

    // pepohonan di pinggir pulau (di luar inti & di luar jalur jembatan)
    var rnd = rngFn(77), i, n = 0;
    for (i = 0; i < 160 && n < 28; i++) {      // v2027.72 — 16 -> 28 pohon
        var th = rnd() * Math.PI * 2, dist = islandRadius(th) * (0.6 + rnd() * 0.3);
        var tx = Math.cos(th) * dist, tz = Math.sin(th) * dist;
        if (Math.abs(tx) < 15 && Math.abs(tz) < 15) continue;
        if (tx < -14 && Math.abs(tz) < 3.8) continue;
        // v2027.72 — 3 bentuk pohon (bulat, cemara ramping, pinus 2 tingkat) + ukuran acak
        var kind = rnd(), sc = 0.8 + rnd() * 0.55;
        F.piece(F.cylG, 'trunk', 0.12, 0.7 * sc, 0.12, tx, 0.35 * sc, tz);
        if (kind < 0.4) F.piece(F.ballG, 'leaf', 0.55 * sc, 0.55 * sc, 0.55 * sc, tx, 0.95 * sc, tz);
        else if (kind < 0.7) F.piece(F.ballG, 'leaf', 0.36 * sc, 0.95 * sc, 0.36 * sc, tx, 1.2 * sc, tz);
        else { F.piece(F.ballG, 'leaf', 0.58 * sc, 0.42 * sc, 0.58 * sc, tx, 0.85 * sc, tz); F.piece(F.ballG, 'leaf', 0.38 * sc, 0.38 * sc, 0.38 * sc, tx, 1.3 * sc, tz); }
        n++;
    }
    return F;
}
