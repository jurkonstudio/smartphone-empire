// FILE: src/ui/campus/NeighborSilhouette.js
// Siluet ringan area tetangga: pulau kampus di dalam scene Kantor dan pulau kantor di dalam scene Kampus.
// Tujuannya: saat pemain menggeser peta, sedikit area sebelahnya ikut terlihat.
// Statis: tanpa animasi, tanpa tap, tanpa bayangan. Dibuat sekali; setDark() mengikuti tema;
// dispose() membuang geometri & material dari GPU.
import { PALETTES, islandRadius } from './CampusBuildings.js';
import { COLORS, ROOM_DEFS, officeCoastR, tint } from '../office/OfficeConfig.js';

// Jarak pusat siluet dari peta utama (pusat ke pusat). Pulau ~ lebar 44 unit, jadi pantainya hampir bersisian.
export var NEIGHBOR_OFFSET = 40;

function rngFn(seed) {
    return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

function stdMat(THREE, color, rough) {
    return new THREE.MeshStandardMaterial({ color: color, roughness: rough == null ? 0.8 : rough, metalness: 0 });
}

// Lempengan pulau berbentuk garis pantai (pola sama dengan peta utama). Atas di y = top.
function islandSlab(THREE, group, geos, radiusFn, scale, top, depth, mat) {
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
    var m = new THREE.Mesh(g, mat);
    m.position.y = top - depth;
    m.castShadow = false;
    m.receiveShadow = false;
    group.add(m);
    return m;
}

// Satu objek kotak/bola dengan geometri bersama (tidak membuat geometri baru per objek).
function piece(THREE, group, geo, mat, sx, sy, sz, x, y, z) {
    var m = new THREE.Mesh(geo, mat);
    m.scale.set(sx, sy, sz);
    m.position.set(x, y, z);
    m.castShadow = false;
    m.receiveShadow = false;
    group.add(m);
    return m;
}

// Siluet kampus untuk peta Kantor. Berpusat di (ox, 0, 0).
export function buildCampusSilhouette(THREE, parent, ox) {
    var group = new THREE.Group();
    group.position.x = ox;
    parent.add(group);

    var geos = [], keys = ['grass', 'soil', 'sand', 'sandWet', 'plaza', 'wall', 'window', 'leaf', 'trunk'];
    var mats = {};
    keys.forEach(function (k) { mats[k] = stdMat(THREE, PALETTES.light[k], k === 'window' ? 0.3 : 0.8); });
    var boxG = new THREE.BoxGeometry(1, 1, 1), ballG = new THREE.SphereGeometry(1, 10, 8);
    geos.push(boxG, ballG);

    var radius = function (th) { return islandRadius(th, 1); };
    islandSlab(THREE, group, geos, radius, 1.08, -0.26, 0.5, mats.sandWet);
    islandSlab(THREE, group, geos, radius, 1.05, -0.03, 0.7, mats.sand);
    islandSlab(THREE, group, geos, radius, 1.0, 0, 0.7, [mats.grass, mats.soil]);

    // gedung pusat (HQ) + jendela di atap
    piece(THREE, group, boxG, mats.wall, 5, 4, 5, 0, 2, 0);
    piece(THREE, group, boxG, mats.window, 5.1, 0.3, 5.1, 0, 4.15, 0);

    // gedung lain di sekitar pusat
    var rnd = rngFn(77), i, b = 0;
    for (i = 0; i < 40 && b < 10; i++) {
        var th = rnd() * Math.PI * 2, dist = islandRadius(th) * (0.35 + rnd() * 0.4);
        var x = Math.cos(th) * dist, z = Math.sin(th) * dist;
        if (Math.abs(x) < 4 && Math.abs(z) < 4) continue;
        var w = 1.6 + rnd() * 1.4, h = 1 + rnd() * 2.2;
        piece(THREE, group, boxG, rnd() < 0.5 ? mats.wall : mats.window, w, h, w, x, h / 2, z);
        b++;
    }
    // pepohonan di pinggir pulau
    for (i = 0; i < 40 && b < 22; i++) {
        var ta = rnd() * Math.PI * 2, td = islandRadius(ta) * (0.55 + rnd() * 0.35);
        var tx = Math.cos(ta) * td, tz = Math.sin(ta) * td;
        if (Math.abs(tx) < 4 && Math.abs(tz) < 4) continue;
        piece(THREE, group, boxG, mats.trunk, 0.2, 0.8, 0.2, tx, 0.4, tz);
        piece(THREE, group, ballG, mats.leaf, 0.6, 0.6, 0.6, tx, 1.0, tz);
        b++;
    }

    return {
        group: group,
        setDark: function (dark) {
            var P = dark ? PALETTES.dark : PALETTES.light;
            keys.forEach(function (k) { mats[k].color.setHex(P[k]); });
        },
        dispose: function () {
            geos.forEach(function (g) { g.dispose(); });
            keys.forEach(function (k) { mats[k].dispose(); });
            parent.remove(group);
        }
    };
}

// Siluet kantor untuk peta Kampus. Berpusat di (ox, 0, 0). Denah sama dengan ROOM_DEFS kantor.
export function buildOfficeSilhouette(THREE, parent, ox) {
    var group = new THREE.Group();
    group.position.x = ox;
    parent.add(group);

    var geos = [], keys = ['ground', 'soil', 'sand', 'base', 'wall', 'win', 'leaf', 'trunk'];
    var mats = {};
    keys.forEach(function (k) { mats[k] = stdMat(THREE, COLORS[k][0], 0.8); });
    var roomMats = ROOM_DEFS.map(function (r) { return stdMat(THREE, r.tone, 0.85); });
    var boxG = new THREE.BoxGeometry(1, 1, 1), ballG = new THREE.SphereGeometry(1, 10, 8);
    geos.push(boxG, ballG);

    islandSlab(THREE, group, geos, officeCoastR, 1.08, -0.26, 0.5, mats.sand);
    islandSlab(THREE, group, geos, officeCoastR, 1.0, 0, 0.7, [mats.ground, mats.soil]);

    // alas kantor (plinth) dan lantai per ruangan
    piece(THREE, group, boxG, mats.base, 18.5, 0.22, 12.5, 0, 0.11, 0);
    ROOM_DEFS.forEach(function (r, i) {
        var w = r.x1 - r.x0 - 0.12, d = r.z1 - r.z0 - 0.12;
        piece(THREE, group, boxG, roomMats[i], w, 0.03, d, (r.x0 + r.x1) / 2, 0.235, (r.z0 + r.z1) / 2);
    });
    // dinding belakang & kiri (yang tinggi, seperti kantor)
    piece(THREE, group, boxG, mats.wall, 18.4, 2.4, 0.24, 0, 1.42, -6.12);
    piece(THREE, group, boxG, mats.wall, 0.24, 2.4, 12.4, -9.12, 1.42, 0);
    // pepohonan sudut halaman
    [[-11.2, -7.4], [11.3, -7.2], [-11.4, 7.1], [11.4, 7.3]].forEach(function (c) {
        piece(THREE, group, boxG, mats.trunk, 0.14, 0.9, 0.14, c[0], 0.45, c[1]);
        piece(THREE, group, ballG, mats.leaf, 0.8, 0.8, 0.8, c[0], 1.35, c[1]);
    });

    return {
        group: group,
        setDark: function (dark) {
            var ix = dark ? 1 : 0;
            keys.forEach(function (k) { mats[k].color.setHex(COLORS[k][ix]); });
            ROOM_DEFS.forEach(function (r, i) {
                roomMats[i].color.setHex(dark ? tint(r.tone, -0.62) : r.tone);
            });
        },
        dispose: function () {
            geos.forEach(function (g) { g.dispose(); });
            keys.forEach(function (k) { mats[k].dispose(); });
            roomMats.forEach(function (m) { m.dispose(); });
            parent.remove(group);
        }
    };
}
