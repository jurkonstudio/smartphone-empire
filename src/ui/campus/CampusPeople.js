// FILE: src/ui/campus/CampusPeople.js  (BARU — manusia realistis untuk peta Kampus)
// Pejalan kaki low-poly berproporsi manusia: kepala + rambut, torso, dua lengan dan dua kaki yang berayun
// berlawanan saat melangkah, badan menghadap arah jalan (berputar halus di ujung trotoar), warna kulit,
// rambut, baju, dan celana bervariasi (deterministik per indeks), sebagian membawa ransel.
// Saat hujan sebagian orang membuka payung (setRain).
//
// Biaya: ~9-11 mesh per orang, geometri dari cache A (dipakai bersama), material dipakai bersama per warna
// (mk dari CampusLife -> ikut dibuang saat dispose). Tanpa alokasi per frame.
// Model menghadap +x; sumbu ayun anggota badan = z.

var SKIN = [0xf1c9a5, 0xe0b48c, 0xc68e63, 0x9a6540, 0x6e452b];
var HAIR = [0x16110d, 0x2b1d12, 0x4a3320, 0x0d0d0d, 0x7d7d7d, 0x8a5a2b];
var SHIRT = [0xf97316, 0x3b82f6, 0xa855f7, 0x14b8a6, 0xeab308, 0xef4444, 0xf8fafc, 0x22c55e, 0xec4899, 0x64748b];
var PANTS = [0x1f2937, 0x374151, 0x1e3a5f, 0x6b5b45, 0x2f3e2f, 0x111827];
var UMB = [0xef4444, 0x2563eb, 0x111827, 0xeab308, 0x10b981];
var STRIDE = 28;          // radian ayun per satuan jarak dunia (langkah ~0.22)
var SWING = 0.6;          // sudut ayun maksimum kaki (rad)
var TURN_RATE = 7;        // kecepatan berputar badan (rad/detik)

export function personLook(i) {
    // Indeks bilangan prima berbeda supaya kombinasi kulit/rambut/baju/celana tidak berulang serempak.
    return {
        skin: SKIN[(i * 3 + 1) % SKIN.length],
        hair: HAIR[(i * 5 + 2) % HAIR.length],
        shirt: SHIRT[(i * 7 + 3) % SHIRT.length],
        pants: PANTS[(i * 11 + 1) % PANTS.length],
        umbrella: UMB[(i * 3) % UMB.length],
        pack: i % 3 === 0,               // sepertiga membawa ransel
        umb: i % 4 !== 3                 // 3 dari 4 orang punya payung
    };
}

export function wrapAngle(a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
}

// Arah badan (yaw) dari sumbu jalan dan arah maju. Model menghadap +x:
//   sumbu x: maju = +x (0), mundur = -x (PI); sumbu z: maju = -z (PI/2), mundur = +z (-PI/2).
export function yawFor(axis, forward) {
    if (axis === 'x') return forward ? 0 : Math.PI;
    return forward ? Math.PI / 2 : -Math.PI / 2;
}

export function createPeople(THREE, A, root, mk, put) {
    var people = [];
    var lastT = null;
    var rainOn = false;
    var matCache = {};
    function mat(c) { return matCache[c] || (matCache[c] = mk(c)); }

    function add(spec) {
        var L = personLook(spec.index || 0);
        var g = new THREE.Group();
        var inner = new THREE.Group();            // diputar mengikuti arah jalan
        g.add(inner);
        function limb(w, h, d, c, z, y) {
            var pivot = new THREE.Group();
            pivot.position.set(0, y, z);
            pivot.add(put(A.box(w, h, d), mat(c), 0, -h / 2, 0));
            inner.add(pivot);
            return pivot;
        }
        var legL = limb(0.045, 0.17, 0.05, L.pants, 0.03, 0.17);
        var legR = limb(0.045, 0.17, 0.05, L.pants, -0.03, 0.17);
        inner.add(put(A.box(0.062, 0.15, 0.11), mat(L.shirt), 0, 0.245, 0));
        var armL = limb(0.035, 0.13, 0.036, L.shirt, 0.073, 0.31);
        var armR = limb(0.035, 0.13, 0.036, L.shirt, -0.073, 0.31);
        // tangan (kulit) di ujung lengan
        armL.add(put(A.box(0.032, 0.03, 0.032), mat(L.skin), 0, -0.14, 0));
        armR.add(put(A.box(0.032, 0.03, 0.032), mat(L.skin), 0, -0.14, 0));
        inner.add(put(A.sph(0.048, 10, 8), mat(L.skin), 0.004, 0.37, 0));
        var hair = put(A.sph(0.052, 10, 6), mat(L.hair), -0.006, 0.382, 0);
        hair.scale.set(1, 0.78, 1);
        inner.add(hair);
        if (L.pack) inner.add(put(A.box(0.04, 0.09, 0.075), mat(0x334155), -0.05, 0.25, 0));
        var umb = null;
        if (L.umb) {
            umb = new THREE.Group();
            umb.add(put(A.cyl(0.004, 0.004, 0.2, 4), mat(0x1f2937), 0, 0.5, 0));
            umb.add(put(A.cyl(0.01, 0.125, 0.05, 10), mat(L.umbrella), 0, 0.61, 0));
            umb.visible = rainOn;
            inner.add(umb);
        }
        root.add(g);
        var p = {
            g: g, inner: inner, legL: legL, legR: legR, armL: armL, armR: armR, umb: umb,
            axis: spec.axis, side: spec.side, speed: spec.speed, s0: spec.s0,
            yaw: yawFor(spec.axis, true), look: L
        };
        inner.rotation.y = p.yaw;
        people.push(p);
        return p;
    }

    // dist: jarak tempuh dunia (menentukan fase langkah); forward: arah maju sumbu jalan; t: detik.
    function pose(p, dist, forward, t) {
        var dt = lastT === null ? 0 : Math.min(0.1, Math.max(0, t - lastT));
        var target = yawFor(p.axis, forward);
        var d = wrapAngle(target - p.yaw), step = TURN_RATE * Math.max(dt, 1 / 60);
        p.yaw = Math.abs(d) <= step ? target : p.yaw + (d > 0 ? step : -step);
        p.inner.rotation.y = p.yaw;
        var s = Math.sin(dist * STRIDE) * SWING;
        p.legL.rotation.z = s; p.legR.rotation.z = -s;
        p.armL.rotation.z = -s * 0.8; p.armR.rotation.z = s * 0.8;
        // payung dipegang: lengan kanan terangkat sedikit & tidak berayun
        if (p.umb && rainOn) p.armR.rotation.z = -0.5;
    }

    return {
        add: add,
        pose: pose,
        // panggil sekali per frame SETELAH semua pose(): menyimpan waktu untuk dt putaran badan
        endFrame: function (t) { lastT = t; },
        setRain: function (on) {
            rainOn = !!on;
            for (var i = 0; i < people.length; i++) if (people[i].umb) people[i].umb.visible = rainOn;
        },
        list: people
    };
}
