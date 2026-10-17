// FILE: src/ui/campus/CampusLife.js
// v2027.38 — + kapal kargo di teluk, monorail, kincir angin, helikopter HQ, jalan lebih panjang.
// v2027.37a — "Kampus hidup": animasi ambient ringan (mobil + bus, pejalan kaki di
// trotoar, awan + bayangan, asap pabrik, drone era modern, pohon bergoyang, jendela
// menyala di mode gelap, lampu peringatan berkedip, riak kolam, burung terbang,
// kunang-kunang malam). Semua geometri dari cache createAssets, objek sedikit,
// tanpa shadow map & tanpa alokasi per-frame.

var CAR_COLORS = [0xef4444, 0xf59e0b, 0x10b981, 0x6366f1, 0xf8fafc, 0x1f2937, 0xec4899];
var WALK_COLORS = [0xf97316, 0x3b82f6, 0xa855f7, 0x14b8a6, 0xeab308, 0xef4444];
var ROAD_Z = { from: 14.6, to: 3.6 };     // jalan selatan: x = lane, z dari tepi ke plaza
var ROAD_X = { from: -14.6, to: -3.6 };   // jalan barat:   z = lane, x dari tepi ke plaza
var FACTORY = { x: 6.6, z: 0.6, W: [0, 3.2, 3.4, 3.6], H: [0, 1.3, 1.5, 1.8] }; // sama dgn buildFactory
var POND = { x: 0.5, z: -6, r: 1.4 };     // sama dgn POND di CampusBuildings
var PORT = { x: 12.5, z: 11.8 };          // kapal bersandar di sisi dermaga (slot port 11.0,6.8 + BAY)
var RAIL = { z: -10.2, y: 1.5, x0: -11.5, x1: 11.5 };   // sama dgn RAIL di CampusBuildings
var CURB_Y = 0.09;                        // tinggi trotoar (pejalan berdiri di atasnya)
var PUFFS = 9;
var FLY_BASE = [[-1.4, -6.6], [2.5, -5.6], [-3, -5.5], [4.4, -4.4], [-7, -6], [8, -4], [-8, 5], [7.5, 6.5]];

export function createCampusLife(THREE, A, scene, trees) {
    var root = new THREE.Group();
    scene.add(root);
    var mats = [];
    var dark = false;
    var windowHex = 0x8fb4e8;
    var chimneys = [];
    var droneOn = false;
    var portLvl = 0, railOn = false, heliOn = false, windRotors = null;

    function mk(color, opts) {
        var m = new THREE.MeshLambertMaterial(Object.assign({ color: color, flatShading: true }, opts || {}));
        mats.push(m);
        return m;
    }
    function put(geo, mat, x, y, z) {
        var m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        return m;
    }

    // ---------- mobil + bus ----------
    var carDark = mk(0x111827);
    var cars = [];
    function makeCar(color, kind) {
        var g = new THREE.Group();
        var body = mk(color);
        if (kind === 'bus') {
            g.add(put(A.box(1.25, 0.3, 0.42), body, 0, 0.2, 0));
            g.add(put(A.box(1.12, 0.1, 0.44), carDark, 0, 0.27, 0));
            g.add(put(A.box(0.05, 0.06, 0.08), A.mat('glow'), 0.63, 0.14, 0.14));
            g.add(put(A.box(0.05, 0.06, 0.08), A.mat('glow'), 0.63, 0.14, -0.14));
        } else {
            g.add(put(A.box(0.72, 0.2, 0.38), body, 0, 0.14, 0));
            g.add(put(A.box(0.34, 0.16, 0.32), carDark, -0.04, 0.32, 0));
            g.add(put(A.box(0.05, 0.06, 0.08), A.mat('glow'), 0.37, 0.15, 0.12));
            g.add(put(A.box(0.05, 0.06, 0.08), A.mat('glow'), 0.37, 0.15, -0.12));
        }
        root.add(g);
        return g;
    }
    function addCar(axis, lane, inbound, speed, s0, ci) {
        var bus = ci === 'bus';
        cars.push({
            axis: axis, lane: lane, inbound: inbound, speed: speed, s0: s0,
            g: makeCar(bus ? 0x2563eb : CAR_COLORS[ci % CAR_COLORS.length], bus ? 'bus' : 'car')
        });
    }
    // Satu lajur = satu kecepatan, supaya tidak saling menembus.
    addCar('z',  0.5, true,  0.17, 0.05, 0);
    addCar('z',  0.5, true,  0.17, 0.30, 5);
    addCar('z',  0.5, true,  0.17, 0.55, 3);
    addCar('z',  0.5, true,  0.17, 0.80, 'bus');
    addCar('z', -0.5, false, 0.2,  0.30, 1);
    addCar('z', -0.5, false, 0.2,  0.80, 4);
    addCar('x',  0.5, true,  0.19, 0.20, 2);
    addCar('x',  0.5, true,  0.19, 0.70, 0);
    addCar('x', -0.5, false, 0.16, 0.10, 4);
    addCar('x', -0.5, false, 0.16, 0.38, 5);
    addCar('x', -0.5, false, 0.16, 0.65, 6);

    // ---------- pejalan kaki (di trotoar) ----------
    var walkers = [];
    function addWalker(axis, side, speed, s0, ci) {
        var g = new THREE.Group();
        var m = mk(WALK_COLORS[ci % WALK_COLORS.length]);
        g.add(put(A.cyl(0.05, 0.07, 0.22, 6), m, 0, 0.11, 0));
        g.add(put(A.sph(0.065, 6, 5), mk(0xf1c9a5), 0, 0.28, 0));
        root.add(g);
        walkers.push({ axis: axis, side: side, speed: speed, s0: s0, g: g });
    }
    addWalker('x',  1.22, 0.045, 0.1, 0);
    addWalker('x', -1.22, 0.05, 0.7, 1);
    addWalker('x',  1.22, 0.04, 1.4, 4);
    addWalker('z', -1.22, 0.045, 0.4, 2);
    addWalker('z',  1.22, 0.05, 1.2, 3);
    addWalker('z', -1.22, 0.04, 1.7, 5);

    // ---------- awan + bayangan awan ----------
    var cloudMat = mk(0xffffff, { transparent: true, opacity: 0.8, depthWrite: false });
    var shadowMat = mk(0x000000, { transparent: true, opacity: 0.1, depthWrite: false });
    var clouds = [];
    [[-14, -6, 0.22, 1.0], [2, 3, 0.16, 1.25], [-4, 9, 0.2, 0.85]].forEach(function (c) {
        var g = new THREE.Group();
        [[0, 0, 0, 0.9], [0.9, -0.1, 0.2, 0.7], [-0.9, -0.15, -0.1, 0.65], [0.2, 0.15, -0.5, 0.6]].forEach(function (b) {
            var s = put(A.sph(1, 8, 6), cloudMat, b[0], b[1], b[2]);
            s.scale.set(b[3], b[3] * 0.55, b[3]);
            g.add(s);
        });
        g.scale.setScalar(c[3]);
        var sh = put(A.cyl(1, 1, 0.01, 14), shadowMat, 0, 0.11, 0);
        sh.scale.set(2.2 * c[3], 1, 1.4 * c[3]);
        root.add(g, sh);
        clouds.push({ g: g, sh: sh, x0: c[0], z: c[1], speed: c[2], y: 9 });
    });

    // ---------- asap pabrik ----------
    var puffs = [];
    for (var i = 0; i < PUFFS; i++) {
        var pm = mk(0xe5e7eb, { transparent: true, opacity: 0, depthWrite: false });
        var p = put(A.sph(0.18, 6, 5), pm, 0, 0, 0);
        p.visible = false;
        root.add(p);
        puffs.push({ m: p, mat: pm, off: i / PUFFS });
    }

    // ---------- riak kolam ----------
    var rings = [];
    for (i = 0; i < 3; i++) {
        var rm = mk(0xffffff, { transparent: true, opacity: 0, depthWrite: false });
        var rg = put(A.tor(1, 0.03), rm, POND.x, 0.075, POND.z);
        rg.rotation.x = Math.PI / 2;
        root.add(rg);
        rings.push({ m: rg, mat: rm, off: i / 3 });
    }

    // ---------- burung ----------
    var birdMat = mk(0x475569);
    var birds = [];
    function addBird(R, y, speed, a0, k) {
        var g = new THREE.Group();
        g.add(put(A.box(0.16, 0.05, 0.06), birdMat, 0, 0, 0));
        var pl = new THREE.Group(), pr = new THREE.Group();
        pl.position.set(0, 0, 0.04); pr.position.set(0, 0, -0.04);
        pl.add(put(A.box(0.07, 0.012, 0.22), birdMat, 0, 0, 0.11));
        pr.add(put(A.box(0.07, 0.012, 0.22), birdMat, 0, 0, -0.11));
        g.add(pl, pr);
        root.add(g);
        birds.push({ g: g, pl: pl, pr: pr, R: R, y: y, speed: speed, a0: a0, k: k });
    }
    addBird(7.5, 7.4, 0.12, 0.0, 0);
    addBird(7.9, 7.7, 0.12, 0.35, 1);
    addBird(6.4, 8.2, -0.09, 2.2, 2);

    // ---------- kunang-kunang (malam) ----------
    var flies = [];
    for (i = 0; i < FLY_BASE.length; i++) {
        var fm = mk(0xfff59d, { transparent: true, opacity: 0, depthWrite: false });
        var fl = put(A.sph(0.05, 5, 4), fm, 0, 0.6, 0);
        fl.visible = false;
        root.add(fl);
        flies.push({ m: fl, mat: fm, bx: FLY_BASE[i][0], bz: FLY_BASE[i][1] });
    }

    // ---------- drone (era >= 3) ----------
    var drone = new THREE.Group();
    drone.add(put(A.box(0.32, 0.1, 0.32), A.mat('metal'), 0, 0, 0));
    drone.add(put(A.sph(0.07, 6, 5), A.mat('glow'), 0, -0.1, 0));
    var rotors = [];
    [[0.24, 0.24], [-0.24, 0.24], [0.24, -0.24], [-0.24, -0.24]].forEach(function (r) {
        var rt = put(A.cyl(0.13, 0.13, 0.015, 8), A.mat('wall'), r[0], 0.08, r[1]);
        drone.add(rt);
        rotors.push(rt);
    });
    drone.visible = false;
    var droneShadow = put(A.cyl(0.3, 0.3, 0.01, 10), shadowMat, 0, 0.12, 0);
    droneShadow.visible = false;
    root.add(drone, droneShadow);

    // ---------- kapal kargo (Pelabuhan Lv2+) ----------
    var ship = new THREE.Group();
    var hullM = mk(0x334155), deckM = mk(0xcbd5e1), cabinM = mk(0xf8fafc);
    ship.add(put(A.box(1.3, 0.26, 3.4), hullM, 0, 0.04, 0));
    ship.add(put(A.box(1.18, 0.04, 3.2), deckM, 0, 0.19, 0));
    ship.add(put(A.box(0.7, 0.5, 0.55), cabinM, 0, 0.45, -1.2));
    ship.add(put(A.box(0.74, 0.06, 0.6), A.mat('roof'), 0, 0.72, -1.2));
    ship.add(put(A.cyl(0.1, 0.12, 0.3, 8), A.mat('roof'), 0, 0.85, -1.2));
    [[-0.3, 0.2], [0.3, 0.2], [-0.3, 0.7], [0.3, 0.7], [0, 1.2]].forEach(function (o, k) {
        ship.add(put(A.box(0.5, 0.28, 0.4), k % 2 ? A.mat('gold') : A.mat('roof'), o[0], 0.35, o[1]));
    });
    ship.visible = false;
    root.add(ship);

    // ---------- monorail ----------
    var train = new THREE.Group();
    var trainM = mk(0xf8fafc);
    for (i = 0; i < 3; i++) {
        train.add(put(A.box(0.95, 0.34, 0.5), trainM, i * 1.02, 0, 0));
        train.add(put(A.box(0.85, 0.1, 0.52), carDark, i * 1.02, 0.07, 0));
        train.add(put(A.box(0.95, 0.05, 0.5), A.mat('roof'), i * 1.02, 0.2, 0));
    }
    train.add(put(A.box(0.05, 0.08, 0.1), A.mat('glow'), 3.06, 0, 0));
    train.visible = false;
    root.add(train);

    // ---------- helikopter (HQ Lv3+) ----------
    var heli = new THREE.Group();
    var heliM = mk(0xef4444);
    var hb = put(A.sph(0.2, 8, 6), heliM, 0, 0, 0);
    hb.scale.set(1.3, 0.8, 0.9);
    heli.add(hb);
    heli.add(put(A.box(0.5, 0.05, 0.05), heliM, -0.4, 0.03, 0));
    heli.add(put(A.box(0.02, 0.02, 0.5), A.mat('metal'), 0, 0.2, 0));
    var heliRotor = put(A.box(0.8, 0.012, 0.06), A.mat('metal'), 0, 0.2, 0);
    heli.add(heliRotor);
    heli.visible = false;
    root.add(heli);

    // ---------- update per frame ----------
    var tmpDir = { x: 0, z: 0 };

    function lerp(a, b, s) { return a + (b - a) * s; }

    function update(t) {
        var i, c, s, f;

        // mobil + bus
        for (i = 0; i < cars.length; i++) {
            c = cars[i];
            s = (c.s0 + t * c.speed) % 1;
            var road = c.axis === 'z' ? ROAD_Z : ROAD_X;
            var a = c.inbound ? road.from : road.to, b = c.inbound ? road.to : road.from;
            var pos = lerp(a, b, s), dirv = b > a ? 1 : -1;
            if (c.axis === 'z') { c.g.position.set(c.lane, 0.06, pos); tmpDir.x = 0; tmpDir.z = dirv; }
            else { c.g.position.set(pos, 0.06, c.lane); tmpDir.x = dirv; tmpDir.z = 0; }
            c.g.rotation.y = Math.atan2(-tmpDir.z, tmpDir.x);
            f = Math.min(1, s / 0.1, (1 - s) / 0.1);
            c.g.scale.setScalar(Math.max(0.001, f));
        }

        // pejalan (bolak-balik di trotoar)
        for (i = 0; i < walkers.length; i++) {
            var w = walkers[i];
            var q = (w.s0 + t * w.speed) % 2;
            if (q > 1) q = 2 - q;
            var wp = lerp(-13.8, -3.9, q);
            var bob = CURB_Y + Math.abs(Math.sin(t * 8 + i)) * 0.035;
            if (w.axis === 'x') w.g.position.set(wp, bob, w.side);
            else w.g.position.set(w.side, bob, lerp(14, 3.9, q));
        }

        // awan + bayangan
        for (i = 0; i < clouds.length; i++) {
            c = clouds[i];
            var cx = ((c.x0 + t * c.speed + 22) % 44) - 22;
            c.g.position.set(cx, c.y, c.z);
            c.sh.position.set(cx - c.y * 0.6, 0.11, c.z - c.y * 0.4);
        }

        // asap
        var n = chimneys.length;
        for (i = 0; i < puffs.length; i++) {
            var pf = puffs[i];
            if (!n) { pf.m.visible = false; continue; }
            var life = (t * 0.45 + pf.off) % 1;
            var ch = chimneys[i % n];
            pf.m.visible = true;
            pf.m.position.set(ch[0] + life * 0.9, ch[1] + life * 1.5, ch[2] - life * 0.4);
            pf.m.scale.setScalar(0.5 + life * 1.3);
            pf.mat.opacity = (1 - life) * (dark ? 0.35 : 0.5);
        }

        // riak kolam
        for (i = 0; i < rings.length; i++) {
            var rl = (t * 0.22 + rings[i].off) % 1;
            var rs = 0.2 + rl * (POND.r - 0.25);
            rings[i].m.scale.set(rs, rs, 1);
            rings[i].mat.opacity = (1 - rl) * 0.45;
        }
        var wmat = A.mat('water');
        wmat.emissiveIntensity = (dark ? 0.25 : 0.12) + Math.sin(t * 1.6) * 0.05;

        // burung
        for (i = 0; i < birds.length; i++) {
            var bd = birds[i];
            var ang = bd.a0 + t * bd.speed;
            var sgn = bd.speed > 0 ? 1 : -1;
            bd.g.position.set(Math.cos(ang) * bd.R, bd.y + Math.sin(t * 1.4 + bd.k) * 0.15, Math.sin(ang) * bd.R);
            bd.g.rotation.y = Math.atan2(-Math.cos(ang) * sgn, -Math.sin(ang) * sgn);
            var fl = Math.sin(t * 9 + bd.k * 2) * 0.7;
            bd.pl.rotation.x = fl;
            bd.pr.rotation.x = -fl;
        }

        // kunang-kunang
        for (i = 0; i < flies.length; i++) {
            var ff = flies[i];
            ff.m.visible = dark;
            if (!dark) continue;
            ff.m.position.set(
                ff.bx + Math.sin(t * 0.7 + i) * 0.6,
                0.7 + Math.sin(t * 1.3 + i * 2) * 0.25,
                ff.bz + Math.cos(t * 0.6 + i * 1.3) * 0.6
            );
            ff.mat.opacity = 0.15 + 0.75 * Math.max(0, Math.sin(t * 2 + i * 1.7));
        }

        // drone
        if (droneOn) {
            var da = t * 0.35;
            var dx = Math.cos(da) * 5.6, dz = Math.sin(da) * 5.6;
            drone.position.set(dx, 5.8 + Math.sin(t * 2) * 0.12, dz);
            drone.rotation.y = -da;
            drone.rotation.z = Math.sin(t * 2) * 0.05;
            droneShadow.position.set(dx - 3.4, 0.12, dz - 2.3);
            for (i = 0; i < rotors.length; i++) rotors[i].rotation.y = t * 40;
        }

        // kapal kargo: bergoyang pelan di dermaga
        if (portLvl >= 2) {
            ship.position.set(PORT.x, 0.1 + Math.sin(t * 1.1) * 0.025, PORT.z + Math.sin(t * 0.35) * 0.18);
            ship.rotation.z = Math.sin(t * 1.1) * 0.02;
            ship.scale.setScalar(portLvl >= 3 ? 1 : 0.82);
        }

        // monorail: bolak-balik dengan jeda halus di ujung
        if (railOn) {
            var ph = (t * 0.045) % 2;
            var sp = ph <= 1 ? ph : 2 - ph;
            var es = sp * sp * (3 - 2 * sp);
            train.position.set(lerp(RAIL.x0, RAIL.x1, es) - 1.5, RAIL.y + 0.34, RAIL.z);
        }

        // helikopter mengitari HQ
        if (heliOn) {
            var ha = -t * 0.28;
            heli.position.set(Math.cos(ha) * 7.2, 4.3 + Math.sin(t * 1.7) * 0.1, Math.sin(ha) * 7.2);
            heli.rotation.y = -ha + Math.PI / 2;
            heliRotor.rotation.y = t * 35;
        }

        // kincir angin
        if (windRotors) {
            for (i = 0; i < windRotors.length; i++) windRotors[i].rotation.z = t * (1.5 + i * 0.25);
        }

        // pohon bergoyang
        for (i = 0; i < trees.length; i++) {
            trees[i].rotation.z = Math.sin(t * 1.3 + i * 1.7) * 0.035;
            trees[i].rotation.x = Math.cos(t * 1.1 + i) * 0.025;
        }

        // pulse cahaya + kedip lampu peringatan
        var gm = A.mat('glow');
        gm.emissiveIntensity = 0.6 + Math.sin(t * 2.2) * 0.22;
        var wm = A.mat('window');
        wm.emissiveIntensity = dark ? 0.42 + Math.sin(t * 0.8) * 0.07 : 0;
        var fm = A.mat('facade');
        fm.emissiveIntensity = dark ? 0.88 + Math.sin(t * 0.8) * 0.06 : 0;
        A.mat('beacon').emissiveIntensity = (Math.sin(t * 3.2) > 0.55) ? 1.5 : 0.12;
    }

    return {
        update: update,
        setTheme: function (isDark, winHex) {
            dark = !!isDark;
            windowHex = winHex;
            var wm = A.mat('window');
            wm.emissive.setHex(dark ? windowHex : 0x000000);
            cloudMat.color.setHex(dark ? 0x8fa0c4 : 0xffffff);
            cloudMat.opacity = dark ? 0.45 : 0.8;
            shadowMat.opacity = dark ? 0.16 : 0.1;
            birdMat.color.setHex(dark ? 0x94a3b8 : 0x475569);
            for (var k = 0; k < rings.length; k++) rings[k].mat.color.setHex(dark ? 0xa5d8f5 : 0xffffff);
        },
        setEra: function (idx) {
            droneOn = idx >= 3;
            drone.visible = droneOn;
            droneShadow.visible = droneOn;
        },
        setPort: function (level) {
            portLvl = level || 0;
            ship.visible = portLvl >= 2;
        },
        setRail: function (on) {
            railOn = !!on;
            train.visible = railOn;
        },
        setHq: function (level) {
            heliOn = (level || 0) >= 3;
            heli.visible = heliOn;
        },
        setWind: function (rotors) {
            windRotors = (rotors && rotors.length) ? rotors : null;
        },
        setFactory: function (level) {
            chimneys = [];
            if (!level) return;
            var W = FACTORY.W[level], H = FACTORY.H[level];
            for (var i = 0; i < level; i++) {
                var chH = 1.9 + i * 0.3;
                chimneys.push([FACTORY.x + W / 2 - 0.5 - i * 0.7, H + 0.14 + chH, FACTORY.z + 0.3]);
            }
        },
        dispose: function () {
            scene.remove(root);
            mats.forEach(function (m) { m.dispose(); });
            mats.length = 0;
        }
    };
}
