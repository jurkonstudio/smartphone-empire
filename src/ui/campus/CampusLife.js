// FILE: src/ui/campus/CampusLife.js
// v2027.36a — "Kampus hidup": animasi ambient super ringan (mobil, pejalan kaki,
// awan + bayangan, asap pabrik, drone era modern, pohon bergoyang, jendela menyala
// di mode gelap, pulse cahaya). Semua geometri dari cache createAssets, jumlah
// objek kecil (~60 mesh), tanpa shadow map & tanpa alokasi per-frame.

var CAR_COLORS = [0xef4444, 0xf59e0b, 0x10b981, 0x6366f1, 0xf8fafc, 0x1f2937, 0xec4899];
var WALK_COLORS = [0xf97316, 0x3b82f6, 0xa855f7, 0x14b8a6];
var ROAD_Z = { from: 10.4, to: 3.6 };     // jalan selatan: x = lane, z dari tepi ke plaza
var ROAD_X = { from: -10.4, to: -3.6 };   // jalan barat:   z = lane, x dari tepi ke plaza
var FACTORY = { x: 6.6, z: 0.6, W: [0, 3.2, 3.4, 3.6], H: [0, 1.3, 1.5, 1.8] }; // sama dgn buildFactory
var PUFFS = 9;

export function createCampusLife(THREE, A, scene, trees) {
    var root = new THREE.Group();
    scene.add(root);
    var mats = [];
    var dark = false;
    var windowHex = 0x8fb4e8;
    var chimneys = [];
    var droneOn = false;

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

    // ---------- mobil ----------
    var carDark = mk(0x111827);
    var cars = [];
    function makeCar(color) {
        var g = new THREE.Group();
        var body = mk(color);
        g.add(put(A.box(0.72, 0.2, 0.38), body, 0, 0.14, 0));
        g.add(put(A.box(0.34, 0.16, 0.32), carDark, -0.04, 0.32, 0));
        g.add(put(A.box(0.05, 0.06, 0.08), A.mat('glow'), 0.37, 0.15, 0.12));
        g.add(put(A.box(0.05, 0.06, 0.08), A.mat('glow'), 0.37, 0.15, -0.12));
        root.add(g);
        return g;
    }
    function addCar(axis, lane, inbound, speed, s0, ci) {
        cars.push({ axis: axis, lane: lane, inbound: inbound, speed: speed, s0: s0, g: makeCar(CAR_COLORS[ci % CAR_COLORS.length]) });
    }
    addCar('z',  0.5, true,  0.17, 0.05, 0);
    addCar('z',  0.5, true,  0.17, 0.55, 3);
    addCar('z', -0.5, false, 0.2,  0.30, 1);
    addCar('x',  0.5, true,  0.19, 0.20, 2);
    addCar('x', -0.5, false, 0.16, 0.10, 4);
    addCar('x', -0.5, false, 0.16, 0.65, 6);

    // ---------- pejalan kaki ----------
    var walkers = [];
    function addWalker(axis, side, speed, s0, ci) {
        var g = new THREE.Group();
        var m = mk(WALK_COLORS[ci % WALK_COLORS.length]);
        g.add(put(A.cyl(0.05, 0.07, 0.22, 6), m, 0, 0.11, 0));
        g.add(put(A.sph(0.065, 6, 5), mk(0xf1c9a5), 0, 0.28, 0));
        root.add(g);
        walkers.push({ axis: axis, side: side, speed: speed, s0: s0, g: g });
    }
    addWalker('x',  1.2, 0.045, 0.1, 0);
    addWalker('x', -1.2, 0.05, 0.7, 1);
    addWalker('z', -1.2, 0.045, 0.4, 2);
    addWalker('z',  1.2, 0.05, 1.2, 3);

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

    // ---------- update per frame ----------
    var tmpDir = { x: 0, z: 0 };

    function lerp(a, b, s) { return a + (b - a) * s; }

    function update(t, dt) {
        var i, c, s, f;

        // mobil
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

        // pejalan (bolak-balik)
        for (i = 0; i < walkers.length; i++) {
            var w = walkers[i];
            var q = (w.s0 + t * w.speed) % 2;
            if (q > 1) q = 2 - q;
            var wp = lerp(-9.6, -3.9, q);
            var bob = Math.abs(Math.sin(t * 8 + i)) * 0.035;
            if (w.axis === 'x') w.g.position.set(wp, bob, w.side);
            else w.g.position.set(w.side, bob, lerp(10, 3.9, q));
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

        // drone
        if (droneOn) {
            var ang = t * 0.35;
            var dx = Math.cos(ang) * 5.6, dz = Math.sin(ang) * 5.6;
            drone.position.set(dx, 5.8 + Math.sin(t * 2) * 0.12, dz);
            drone.rotation.y = -ang;
            drone.rotation.z = Math.sin(t * 2) * 0.05;
            droneShadow.position.set(dx - 3.4, 0.12, dz - 2.3);
            for (i = 0; i < rotors.length; i++) rotors[i].rotation.y = t * 40;
        }

        // pohon bergoyang
        for (i = 0; i < trees.length; i++) {
            trees[i].rotation.z = Math.sin(t * 1.3 + i * 1.7) * 0.035;
            trees[i].rotation.x = Math.cos(t * 1.1 + i) * 0.025;
        }

        // pulse cahaya
        var gm = A.mat('glow');
        gm.emissiveIntensity = 0.6 + Math.sin(t * 2.2) * 0.22;
        var wm = A.mat('window');
        wm.emissiveIntensity = dark ? 0.42 + Math.sin(t * 0.8) * 0.07 : 0;
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
        },
        setEra: function (idx) {
            droneOn = idx >= 3;
            drone.visible = droneOn;
            droneShadow.visible = droneOn;
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
