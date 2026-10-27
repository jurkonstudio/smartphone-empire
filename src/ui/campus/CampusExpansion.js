// FILE: src/ui/campus/CampusExpansion.js  (BARU — v2027.73: Perluasan Kampus)
// Distrik baru di tanah hasil perluasan pulau (timur, utara, selatan). DEKORATIF: tanpa level, slot, tap, atau kartu info,
// jadi logika game, ID bangunan, dan kartu info tidak berubah. Semua geometri berulang memakai InstancedMesh.
//
//  Timur       : Kompleks Olahraga (lintasan lari, lapangan, tribun, 4 lampu sorot), Kedai Pantai + dermaga + perahu layar
//  Timur laut  : Mercusuar (berkas cahaya berputar saat malam) + rumah penjaga
//  Utara       : Taman Botani (rumah kaca, bedeng bunga, pergola, palem), Ladang Surya (panel miring berbaris)
//  Selatan     : Bundaran (patung cincin cahaya), Area Parkir (stall + mobil), Amfiteater (tribun melengkung + panggung)
//
// API: var ex = buildExpansion(A, THREE); scene.add(ex.group); ex.update(tDetik, malam0..1); ex.lights; ex.dispose();
import { mesh, instanced } from './CampusBuildings.js';

function rng(seed) {
    return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

// Bentuk "stadion" (persegi panjang berujung setengah lingkaran sepanjang sumbu x). Dipakai lintasan lari.
function stadiumPath(path, w, d) {
    var r = d / 2, hw = w / 2 - r;
    path.moveTo(-hw, -r);
    path.lineTo(hw, -r);
    path.absarc(hw, 0, r, -Math.PI / 2, Math.PI / 2, false);
    path.lineTo(-hw, r);
    path.absarc(-hw, 0, r, Math.PI / 2, Math.PI * 1.5, false);
    return path;
}

export function buildExpansion(A, THREE) {
    var g = new THREE.Group();
    g.name = 'campus-expansion';
    var ownMats = [];
    var lights = [];             // untuk bloom malam (CampusScene -> cineLights)
    var boats = [];              // perahu layar yang bergoyang pelan
    var haloItems = [];          // halo lampu di tanah (hanya tampak malam)
    var lampPoles = [], lampHeads = [];

    function ownMat(opts) {
        var m = new THREE.MeshStandardMaterial(opts);
        ownMats.push(m);
        return m;
    }
    function put(m) { g.add(m); return m; }
    function lamp(x, z) {      // tiang lampu seragam dengan lampu jalan kampus (tiang 1.4, kepala di y 1.58)
        lampPoles.push([x, 0.79, z]);
        lampHeads.push([x, 1.58, z]);
        haloItems.push([x, 0.1, z]);
        lights.push({ x: x, y: 1.58, z: z, size: 1.8, color: 0xffc872 });
    }

    var matTrack = ownMat({ color: 0xc45a43, roughness: 0.95, metalness: 0 });
    var matRed = ownMat({ color: 0xc8453b, roughness: 0.7, metalness: 0.05 });
    var matGlass = ownMat({ color: 0xbfe8f0, roughness: 0.08, metalness: 0.25, transparent: true, opacity: 0.38, depthWrite: false });
    matGlass.userData = { envBase: 1.4 };
    A.track(matGlass, 1.4);
    var matSail = ownMat({ color: 0xf4f7fc, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
    var matBeam = new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    ownMats.push(matBeam);

    // ============================================================
    // 1) KOMPLEKS OLAHRAGA — timur (pusat 22.3, -0.7)
    // ============================================================
    (function sport() {
        var cx = 22.3, cz = -0.7;
        var trackGeo = A.custom('exTrack', function () {
            var sh = stadiumPath(new THREE.Shape(), 9.4, 6.2);
            sh.holes.push(stadiumPath(new THREE.Path(), 7.4, 4.2));
            var geo = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false, curveSegments: 10 });
            geo.rotateX(-Math.PI / 2);
            return geo;
        });
        var tr = new THREE.Mesh(trackGeo, matTrack);
        tr.position.set(cx, 0.015, cz);
        put(tr);
        // apron paving di sekeliling lintasan
        put(mesh(A, THREE, A.box(10.2, 0.03, 7.0), 'plaza', cx, 0.012, cz));
        // lapangan rumput + garis putih
        put(mesh(A, THREE, A.box(7.2, 0.035, 4.0), 'grass3', cx, 0.034, cz));
        var lines = [];
        lines.push([cx, 0.056, cz - 1.96, 7.1, 1, 1, 0], [cx, 0.056, cz + 1.96, 7.1, 1, 1, 0]);
        lines.push([cx - 3.56, 0.056, cz, 1, 1, 3.9, 0], [cx + 3.56, 0.056, cz, 1, 1, 3.9, 0], [cx, 0.056, cz, 1, 1, 3.9, 0]);
        put(instanced(A, THREE, A.box(1, 0.01, 0.06), 'wall', lines.filter(function (l) { return l[5] === 1; }).map(function (l) { return l.slice(); })));
        put(instanced(A, THREE, A.box(0.06, 0.01, 1), 'wall', lines.filter(function (l) { return l[5] !== 1; })));
        var ringGeo = A.custom('exCenterRing', function () {
            var rg = new THREE.RingGeometry(0.55, 0.61, 28);
            rg.rotateX(-Math.PI / 2);
            return rg;
        });
        var cr = mesh(A, THREE, ringGeo, 'wall', cx, 0.058, cz);
        put(cr);
        // gawang (dua sisi)
        [-1, 1].forEach(function (s) {
            var gx = cx + s * 3.62;
            put(mesh(A, THREE, A.box(0.05, 0.4, 0.05), 'wall', gx, 0.24, cz - 0.4));
            put(mesh(A, THREE, A.box(0.05, 0.4, 0.05), 'wall', gx, 0.24, cz + 0.4));
            put(mesh(A, THREE, A.box(0.05, 0.05, 0.85), 'wall', gx, 0.44, cz));
        });
        // tribun bertingkat di sisi utara (belakang kamera -> tidak menutupi lapangan) + atap
        var tz = cz - 3.6;
        for (var i = 0; i < 3; i++) {
            put(mesh(A, THREE, A.box(7.4, 0.22 + i * 0.22, 0.34), 'curb', cx, (0.22 + i * 0.22) / 2, tz - 0.17 - i * 0.34));
        }
        var seats = [];
        for (var k = 0; k < 3; k++) for (var q = 0; q < 12; q++) seats.push([cx - 3.25 + q * 0.59, 0.27 + k * 0.22, tz - 0.17 - k * 0.34 + 0.02, 1, 1, 1, 0]);
        var rr = rng(88);
        put(instanced(A, THREE, A.box(0.4, 0.07, 0.22), 'roof', seats, function (n, c) { var v = 0.8 + rr() * 0.3; c.setRGB(v, v, v); }));
        [-3.5, 3.5].forEach(function (dx) { put(mesh(A, THREE, A.box(0.07, 1.35, 0.07), 'metal', cx + dx, 0.675, tz - 1.15)); });
        put(mesh(A, THREE, A.box(7.9, 0.07, 1.6), 'roofAlt', cx, 1.38, tz - 0.55));
        // lampu sorot di empat sudut
        [[cx - 4.8, cz - 3.4], [cx + 4.8, cz - 3.4], [cx - 4.8, cz + 3.1], [cx + 4.8, cz + 3.1]].forEach(function (p) {
            put(mesh(A, THREE, A.cyl(0.04, 0.06, 3.0, 6), 'metal', p[0], 1.5, p[1]));
            put(mesh(A, THREE, A.box(0.5, 0.2, 0.12), 'lamp', p[0], 3.05, p[1]));
            lights.push({ x: p[0], y: 3.05, z: p[1], size: 2.6, color: 0xfff0c8, k: 0.9 });
            haloItems.push([p[0], 0.1, p[1]]);
        });
        // jalan setapak ke kedai pantai
        put(mesh(A, THREE, A.box(1.0, 0.03, 4.2), 'plaza', cx, 0.015, cz + 5.1 + 0.0));
        // bangku & tempat sampah
        put(mesh(A, THREE, A.box(0.8, 0.07, 0.28), 'trunk', cx + 2.4, 0.3, cz + 3.1));
        put(mesh(A, THREE, A.box(0.06, 0.26, 0.24), 'metal', cx + 2.04, 0.13, cz + 3.1));
        put(mesh(A, THREE, A.box(0.06, 0.26, 0.24), 'metal', cx + 2.76, 0.13, cz + 3.1));
    })();

    // ============================================================
    // 2) KEDAI PANTAI + DERMAGA + PERAHU — timur
    // ============================================================
    (function beach() {
        var bx = 22.2, bz = 8.8;
        put(mesh(A, THREE, A.box(3.0, 0.03, 2.6), 'plaza', bx + 0.4, 0.015, bz + 0.2));
        put(mesh(A, THREE, A.fbox(2.2, 1.15, 1.7, 1), A.facadeRole(), bx, 0.575, bz - 0.2));
        put(mesh(A, THREE, A.box(2.6, 0.1, 2.3), 'roof', bx, 1.22, bz));
        // kanopi bergaris
        for (var i = 0; i < 6; i++) {
            put(mesh(A, THREE, A.box(0.42, 0.04, 0.8), i % 2 ? 'wall' : 'flowerA', bx - 1.05 + i * 0.42, 0.98, bz + 1.05));
        }
        // meja + payung
        var rr = rng(31), um = [], po = [], tb = [];
        [[bx + 1.9, bz + 1.3], [bx + 0.9, bz + 2.2], [bx - 0.9, bz + 2.1]].forEach(function (p) {
            tb.push([p[0], 0.22, p[1]]);
            po.push([p[0], 0.5, p[1]]);
            um.push([p[0], 1.02, p[1], 1, 1, 1, rr() * 3]);
        });
        put(instanced(A, THREE, A.cyl(0.26, 0.26, 0.05, 10), 'wall', tb.map(function (t) { return [t[0], 0.38, t[2]]; })));
        put(instanced(A, THREE, A.cyl(0.03, 0.03, 1.0, 6), 'metal', po));
        put(instanced(A, THREE, A.cone(0.55, 0.28, 10), 'flowerB', um, function (n, c) { c.setRGB(0.9 + rr() * 0.1, 0.8 + rr() * 0.2, 0.8 + rr() * 0.2); }));
        // dermaga kayu: dek + tiang pancang + pagar
        var dx0 = 24.0, dx1 = 33.2, dz = 9.4, len = dx1 - dx0, mid = (dx0 + dx1) / 2;
        put(mesh(A, THREE, A.box(len, 0.07, 1.15), 'trunk', mid, 0.14, dz));
        var piles = [], rails = [];
        for (var p = 0; p <= 6; p++) {
            var px = dx0 + 0.8 + p * ((len - 1.4) / 6);
            piles.push([px, -0.25, dz - 0.5], [px, -0.25, dz + 0.5]);
            rails.push([px, 0.43, dz - 0.56], [px, 0.43, dz + 0.56]);
        }
        put(instanced(A, THREE, A.cyl(0.06, 0.07, 0.8, 6), 'trunk', piles));
        put(instanced(A, THREE, A.box(0.05, 0.5, 0.05), 'trunk', rails));
        put(mesh(A, THREE, A.box(len, 0.04, 0.04), 'trunk', mid, 0.62, dz - 0.56));
        put(mesh(A, THREE, A.box(len, 0.04, 0.04), 'trunk', mid, 0.62, dz + 0.56));
        lamp(dx1 - 0.4, dz + 0.58);
        // perahu layar: 1 ditambat di ujung dermaga, 2 berlabuh di perairan terbuka
        [[dx1 - 1.2, dz + 1.5, 0.35, 1.0], [34.5, -7.0, 2.1, 1.25], [30.5, 19.5, 5.2, 1.1]].forEach(function (b, bi) {
            var bg = new THREE.Group();
            bg.position.set(b[0], -0.42, b[1]);
            bg.rotation.y = b[2];
            var s = b[3];
            bg.add(mesh(A, THREE, A.box(1.5 * s, 0.2 * s, 0.5 * s), 'wall', 0, 0.1 * s, 0));
            bg.add(mesh(A, THREE, A.box(0.5 * s, 0.1 * s, 0.34 * s), 'roof', -0.55 * s, 0.25 * s, 0));
            bg.add(mesh(A, THREE, A.cyl(0.025 * s, 0.03 * s, 1.7 * s, 5), 'metal', 0.1 * s, 0.95 * s, 0));
            var sailGeo = A.custom('exSail', function () {
                var sh = new THREE.Shape();
                sh.moveTo(0, 0); sh.lineTo(0.95, 0); sh.lineTo(0, 1.55); sh.closePath();
                return new THREE.ShapeGeometry(sh);
            });
            var sail = new THREE.Mesh(sailGeo, matSail);
            sail.position.set(0.12 * s, 0.22 * s, 0.02);
            sail.scale.set(s, s, s);
            bg.add(sail);
            boats.push({ g: bg, ph: bi * 1.7, y0: -0.42 });
            put(bg);
        });
    })();

    // ============================================================
    // 3) MERCUSUAR + rumah penjaga — timur laut
    // ============================================================
    var beamPivot = null, lanternPos = { x: 22.9, y: 4.9, z: -13.6 };
    (function lighthouse() {
        var lx = 22.9, lz = -13.6;
        put(mesh(A, THREE, A.cyl(1.15, 1.25, 0.3, 14), 'curb', lx, 0.15, lz));
        var segs = 4, y = 0.3;
        for (var i = 0; i < segs; i++) {
            var rb = 0.92 - i * 0.12, rt = 0.92 - (i + 1) * 0.12;
            var sg = new THREE.Mesh(A.cyl(rt, rb, 1.05, 14), i % 2 ? matRed : A.mat('wall'));
            sg.position.set(lx, y + 0.525, lz);
            put(sg);
            y += 1.05;
        }
        put(mesh(A, THREE, A.cyl(0.62, 0.55, 0.12, 14), 'metal', lx, y + 0.06, lz));
        y += 0.12;
        put(mesh(A, THREE, A.cyl(0.36, 0.36, 0.52, 12), 'glow', lx, y + 0.26, lz));
        put(mesh(A, THREE, A.cone(0.5, 0.38, 12), 'roof', lx, y + 0.52 + 0.19, lz));
        put(mesh(A, THREE, A.sph(0.07, 6, 5), 'metal', lx, y + 0.52 + 0.45, lz));
        lanternPos = { x: lx, y: y + 0.26, z: lz };
        lights.push({ x: lx, y: y + 0.26, z: lz, size: 3.4, color: 0xfff2b0, k: 1 });
        // berkas cahaya: dua bilah tipis berputar (hanya terlihat malam)
        beamPivot = new THREE.Group();
        beamPivot.position.set(lx, y + 0.26, lz);
        var bgeo = A.custom('exBeam', function () {
            var sh = new THREE.Shape();
            sh.moveTo(0, -0.05); sh.lineTo(5.2, -0.55); sh.lineTo(5.2, 0.55); sh.lineTo(0, 0.05); sh.closePath();
            var geo = new THREE.ShapeGeometry(sh);
            geo.rotateX(-Math.PI / 2);
            return geo;
        });
        var b1 = new THREE.Mesh(bgeo, matBeam), b2 = new THREE.Mesh(bgeo, matBeam);
        b2.rotation.y = Math.PI;
        b1.raycast = b2.raycast = function () {};
        beamPivot.add(b1, b2);
        put(beamPivot);
        // rumah penjaga
        put(mesh(A, THREE, A.fbox(1.5, 0.8, 1.1, 1), A.facadeRole(), 21.1, 0.4, -12.2));
        put(mesh(A, THREE, A.box(1.7, 0.1, 1.3), 'roof', 21.1, 0.85, -12.2));
        put(mesh(A, THREE, A.box(0.9, 0.03, 2.4), 'plaza', 22.1, 0.015, -12.6));
        // pagar batu rendah + batu pantai
        var rks = [];
        for (var r = 0; r < 7; r++) { var a = r * 0.9 + 0.3; rks.push([lx + Math.cos(a) * 1.9, 0.12, lz + Math.sin(a) * 1.9, 0.3, 0.22, 0.3, a]); }
        put(instanced(A, THREE, A.custom('exRockM', function () { return new THREE.IcosahedronGeometry(1, 0); }), 'rock', rks));
    })();

    // ============================================================
    // 4) TAMAN BOTANI — utara
    // ============================================================
    (function botanic() {
        var gx = 6.0, gz = -19.6;
        // alas + jalan setapak
        put(mesh(A, THREE, A.box(10.4, 0.03, 4.2), 'plaza', 6.8, 0.012, -19.5));
        put(mesh(A, THREE, A.box(10.0, 0.01, 0.5), 'curb', 6.8, 0.03, -17.6));
        // rumah kaca: dasar, dinding kaca, rangka, atap setengah silinder kaca
        put(mesh(A, THREE, A.box(5.4, 0.28, 2.8), 'curb', gx, 0.14, gz));
        put(new THREE.Mesh(A.box(5.2, 0.95, 2.6), matGlass)).position.set(gx, 0.28 + 0.475, gz);
        var roofGeo = A.custom('exGlassRoof', function () {
            var cg = new THREE.CylinderGeometry(1.3, 1.3, 5.2, 14, 1, false, 0, Math.PI);
            cg.rotateZ(Math.PI / 2);
            return cg;
        });
        var roof = new THREE.Mesh(roofGeo, matGlass);
        roof.position.set(gx, 1.23, gz);
        roof.scale.set(1, 0.62, 1);
        put(roof);
        var frames = [];
        for (var f = 0; f <= 6; f++) frames.push([gx - 2.6 + f * (5.2 / 6), 0.76, gz - 1.3, 0.05, 0.95, 0.05], [gx - 2.6 + f * (5.2 / 6), 0.76, gz + 1.3, 0.05, 0.95, 0.05]);
        put(instanced(A, THREE, A.box(1, 1, 1), 'metal', frames));
        put(mesh(A, THREE, A.box(5.2, 0.05, 0.05), 'metal', gx, 2.0, gz));
        // tanaman di dalam (terlihat samar dari luar)
        var rr = rng(4141), pl = [];
        for (var i = 0; i < 14; i++) pl.push([gx - 2.2 + rr() * 4.4, 0.62, gz - 0.9 + rr() * 1.8, 1, 1, 1, 0]);
        put(instanced(A, THREE, A.sph(0.22, 6, 5), 'leaf', pl, function (n, c) { var v = 0.8 + rr() * 0.35; c.setRGB(v * 0.9, v, v * 0.9); }));
        // bedeng bunga (kanan rumah kaca)
        var beds = [], fa = [], fb = [];
        for (var r = 0; r < 3; r++) {
            var bz = -21.0 + r * 1.25;
            beds.push([10.5, 0.1, bz, 3.2, 1, 0.7, 0]);
            for (var k = 0; k < 9; k++) (k % 2 ? fb : fa).push([9.1 + k * 0.34 + rr() * 0.1, 0.27, bz + (rr() - 0.5) * 0.36, 1.4, 1.4, 1.4, 0]);
        }
        put(instanced(A, THREE, A.box(1, 0.2, 1), 'soil', beds));
        put(instanced(A, THREE, A.sph(0.08, 5, 4), 'flowerA', fa));
        put(instanced(A, THREE, A.sph(0.08, 5, 4), 'flowerB', fb));
        // pergola kayu (kiri)
        var pgx = 2.4, pgz = -19.4;
        [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(function (o) { put(mesh(A, THREE, A.box(0.08, 1.4, 0.08), 'trunk', pgx + o[0], 0.7, pgz + o[1])); });
        for (var b = 0; b < 5; b++) put(mesh(A, THREE, A.box(1.7, 0.05, 0.08), 'trunk', pgx, 1.42, pgz - 0.7 + b * 0.35));
        put(mesh(A, THREE, A.box(0.9, 0.07, 0.3), 'trunk', pgx, 0.3, pgz));
        // palem: batang melengkung (2 ruas) + mahkota pipih
        var trunks = [], crowns = [];
        [[1.8, -21.2], [12.0, -17.7], [11.4, -21.5], [4.0, -17.5]].forEach(function (p, i) {
            var h = 1.5 + (i % 2) * 0.35;
            trunks.push([p[0], h / 2, p[1], 1, h / 1.6, 1, 0]);
            crowns.push([p[0], h + 0.05, p[1], 1.5, 0.35, 1.5, i * 0.9]);
        });
        put(instanced(A, THREE, A.cyl(0.07, 0.1, 1.6, 6), 'trunk', trunks));
        put(instanced(A, THREE, A.sph(0.5, 7, 5), 'leaf', crowns));
        put(instanced(A, THREE, A.sph(0.2, 6, 5), 'leaf2', crowns.map(function (c) { return [c[0], c[1] + 0.12, c[2], 1, 1, 1, 0]; })));
    })();

    // ============================================================
    // 5) LADANG SURYA — utara-barat laut (panel miring berbaris)
    // ============================================================
    (function solarField() {
        var panelGeo = A.custom('exPanel', function () {
            var pg = new THREE.BoxGeometry(1.0, 0.04, 0.62);
            pg.rotateX(-0.42);
            return pg;
        });
        var panels = [], posts = [];
        for (var r = 0; r < 3; r++) for (var c = 0; c < 6; c++) {
            var x = -7.9 + c * 1.15, z = -18.0 - r * 1.1;
            panels.push([x, 0.42, z, 1, 1, 1, 0]);
            posts.push([x, 0.2, z + 0.12, 0.05, 0.4, 0.05, 0]);
        }
        put(instanced(A, THREE, panelGeo, 'solar', panels));
        put(instanced(A, THREE, A.box(1, 1, 1), 'metal', posts));
        put(mesh(A, THREE, A.box(7.6, 0.02, 3.4), 'grass3', -4.8, 0.012, -19.0));
        put(mesh(A, THREE, A.box(0.5, 0.4, 0.4), 'metal', -0.6, 0.2, -18.2));
    })();

    // ============================================================
    // 6) BUNDARAN SELATAN, AREA PARKIR, AMFITEATER — selatan
    // ============================================================
    (function south() {
        var rcz = 19.8;
        put(mesh(A, THREE, A.box(2, 0.06, 2.6), 'road', 0, 0.03, 16.3));
        put(mesh(A, THREE, A.cyl(2.6, 2.6, 0.06, 28), 'road', 0, 0.03, rcz));
        var curbRing = A.custom('exRing', function () { var rg = new THREE.RingGeometry(2.6, 3.0, 36); rg.rotateX(-Math.PI / 2); return rg; });
        put(mesh(A, THREE, curbRing, 'curb', 0, 0.062, rcz));
        put(mesh(A, THREE, A.cyl(1.3, 1.4, 0.1, 24), 'curb', 0, 0.07, rcz));
        put(mesh(A, THREE, A.cyl(1.15, 1.15, 0.12, 24), 'grass3', 0, 0.075, rcz));
        // patung: tiang + cincin cahaya
        put(mesh(A, THREE, A.cyl(0.35, 0.45, 0.35, 10), 'curb', 0, 0.28, rcz));
        put(mesh(A, THREE, A.box(0.22, 1.5, 0.22), 'metal', 0, 1.1, rcz));
        var ring = mesh(A, THREE, A.tor(0.55, 0.045), 'glow', 0, 1.55, rcz);
        ring.rotation.x = Math.PI / 2; ring.rotation.y = 0.5;
        put(ring);
        lights.push({ x: 0, y: 1.55, z: rcz, size: 2.0, color: 0x35d6ff, k: 0.7 });
        // cabang jalan ke parkir (timur) dan amfiteater (barat)
        put(mesh(A, THREE, A.box(1.4, 0.06, 1.5), 'road', 3.0, 0.03, rcz));
        put(mesh(A, THREE, A.box(1.4, 0.06, 1.5), 'road', -3.0, 0.03, rcz));
        [[-2.2, 17.0], [2.2, 17.0], [-2.2, 22.4], [2.2, 22.2]].forEach(function (p) { lamp(p[0], p[1]); });

        // --- parkir ---
        var px0 = 3.4, pcx = 8.3, pcz = 19.9;
        put(mesh(A, THREE, A.box(9.8, 0.05, 4.4), 'road', pcx, 0.025, pcz));
        put(mesh(A, THREE, A.box(9.9, 0.07, 0.12), 'curb', pcx, 0.035, pcz - 2.25));
        put(mesh(A, THREE, A.box(9.9, 0.07, 0.12), 'curb', pcx, 0.035, pcz + 2.25));
        var stl = [];
        for (var i = 0; i <= 8; i++) {
            stl.push([3.9 + i * 1.15, 0.056, 18.6, 1, 1, 1, 0]);
            stl.push([3.9 + i * 1.15, 0.056, 21.1, 1, 1, 1, 0]);
        }
        put(instanced(A, THREE, A.box(0.05, 0.01, 1.35), 'wall', stl));
        var rr = rng(2026), cars = [], cabins = [], cols = [];
        var palette = [[0.92, 0.92, 0.94], [0.2, 0.22, 0.27], [0.75, 0.15, 0.15], [0.2, 0.4, 0.75], [0.8, 0.8, 0.82], [0.9, 0.7, 0.2], [0.25, 0.55, 0.4]];
        [18.6, 21.1].forEach(function (zr, row) {
            for (var s = 0; s < 8; s++) {
                if (rr() < 0.42) continue;
                var x = 4.475 + s * 1.15, face = row ? Math.PI : 0;
                cars.push([x, 0.19, zr, 1, 1, 1, face]);
                cabins.push([x, 0.4, zr - (row ? -0.02 : 0.02), 1, 1, 1, face]);
                cols.push(palette[Math.floor(rr() * palette.length)]);
            }
        });
        put(instanced(A, THREE, A.box(0.42, 0.24, 0.85), 'wall', cars, function (n, c) { var p = cols[n]; c.setRGB(p[0], p[1], p[2]); }));
        put(instanced(A, THREE, A.box(0.34, 0.18, 0.46), 'window', cabins));
        // stasiun pengisian EV (tiang berkepala hijau)
        [[3.9, 20.1], [5.05, 20.1], [6.2, 20.1]].forEach(function (p) {
            put(mesh(A, THREE, A.box(0.08, 0.5, 0.08), 'metal', p[0], 0.28, p[1]));
            put(mesh(A, THREE, A.box(0.14, 0.12, 0.1), 'glow', p[0], 0.58, p[1]));
        });
        // pohon peneduh di tepi
        var tr = [], lf = [];
        [4.0, 7.0, 10.0, 12.8].forEach(function (x) { tr.push([x, 0.35, 22.6, 1, 1, 1, 0]); lf.push([x, 1.05, 22.6, 1, 1, 1, 0]); });
        put(instanced(A, THREE, A.cyl(0.07, 0.1, 0.7, 6), 'trunk', tr));
        put(instanced(A, THREE, A.sph(0.5, 8, 6), 'leaf', lf, function (n, c) { var v = 0.85 + rr() * 0.3; c.setRGB(v, v, v); }));

        // --- amfiteater: tribun melengkung 4 tingkat menghadap panggung ---
        var ax = -4.4, az = 18.0;
        put(mesh(A, THREE, A.box(2.2, 0.03, 7.2), 'plaza', ax + 0.4, 0.015, az));
        for (var t = 0; t < 4; t++) {
            (function (t) {
                var rIn = 1.6 + t * 0.5, rOut = rIn + 0.5, h = 0.12 * (t + 1);
                var geo = A.custom('exAmph' + t, function () {
                    var sh = new THREE.Shape();
                    sh.absarc(0, 0, rOut, Math.PI / 2, Math.PI * 1.5, false);
                    sh.absarc(0, 0, rIn, Math.PI * 1.5, Math.PI / 2, true);
                    sh.closePath();
                    var eg = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 16 });
                    eg.rotateX(-Math.PI / 2);
                    return eg;
                });
                var m = new THREE.Mesh(geo, A.mat(t % 2 ? 'plaza' : 'curb'));
                m.position.set(ax, 0.02, az);
                put(m);
            })(t);
        }
        put(mesh(A, THREE, A.box(1.4, 0.2, 2.8), 'plaza', ax + 0.5, 0.12, az));
        put(mesh(A, THREE, A.box(0.12, 1.5, 2.8), 'roofAlt', ax + 1.1, 0.95, az));
        put(mesh(A, THREE, A.box(0.9, 0.08, 2.8), 'roof', ax + 0.72, 1.7, az));
        lamp(ax + 0.4, az - 1.6);
        lamp(ax + 0.4, az + 1.6);
    })();

    // ---------- lampu jalan gabungan (instanced) ----------
    if (lampPoles.length) {
        g.add(instanced(A, THREE, A.cyl(0.035, 0.045, 1.4, 6), 'metal', lampPoles));
        g.add(instanced(A, THREE, A.sph(0.1, 8, 6), 'lamp', lampHeads));
    }
    if (haloItems.length) g.add(instanced(A, THREE, A.cyl(0.8, 0.8, 0.01, 14), 'halo', haloItems));

    return {
        group: g,
        lights: lights,
        update: function (t, night) {
            var n = Math.max(0, Math.min(1, night || 0));
            matBeam.opacity = 0.26 * n;
            matBeam.visible = n > 0.03;
            if (beamPivot) beamPivot.rotation.y = t * 0.9;
            for (var i = 0; i < boats.length; i++) {
                var b = boats[i];
                b.g.position.y = b.y0 + Math.sin(t * 1.3 + b.ph) * 0.025;
                b.g.rotation.z = Math.sin(t * 0.9 + b.ph) * 0.04;
            }
        },
        hasBoats: function () { return boats.length > 0; },
        dispose: function () {
            g.traverse(function (o) { if (o.isInstancedMesh) o.dispose(); });
            ownMats.forEach(function (m) { m.dispose(); });
            ownMats.length = 0;
        }
    };
}
