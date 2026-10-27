// FILE: src/ui/campus/CampusPeople.js  (REPLACE — v2027.84: manusia lebih nyata: sendi, leher, sepatu, wajah, model rambut)
// v2027.84 — tiap orang kini punya: pinggul + dada + bahu, leher, kepala dengan mata, SIKU dan LUTUT yang menekuk,
// sepatu, lengan baju pendek/panjang, 5 gaya kepala (rambut pendek, rambut panjang, kerudung, topi, cepol),
// tinggi badan bervariasi (termasuk anak), sebagian menatap ponsel sambil berjalan, sebagian membawa ransel.
// Gerak: ayun pinggul + tekukan lutut bergantian, lengan berlawanan, badan miring ke depan & memuntir halus
// berlawanan dengan langkah. Saat hujan pemegang payung mengangkat lengan kanan (payung miring di atas kepala).
//
// Biaya: ~18-21 mesh per orang (geometri dari cache A dipakai bersama, material dipakai bersama per warna).
// Tanpa alokasi per frame. Model menghadap +x; sumbu ayun anggota badan = z.
// API publik tetap sama seperti v2027.37 (add / pose / endFrame / setRain / list).

var SKIN = [0xf1c9a5, 0xe0b48c, 0xc68e63, 0x9a6540, 0x6e452b];
var HAIR = [0x16110d, 0x2b1d12, 0x4a3320, 0x0d0d0d, 0x7d7d7d, 0x8a5a2b];
var SHIRT = [0xf97316, 0x3b82f6, 0xa855f7, 0x14b8a6, 0xeab308, 0xef4444, 0xf8fafc, 0x22c55e, 0xec4899, 0x64748b];
var PANTS = [0x1f2937, 0x374151, 0x1e3a5f, 0x6b5b45, 0x2f3e2f, 0x111827];
var SHOES = [0xf8fafc, 0x111827, 0x7c2d12, 0x1e3a8a];
var UMB = [0xef4444, 0x2563eb, 0x111827, 0xeab308, 0x10b981];
var HEIGHT = [1, 0.95, 1.05, 0.98, 1.03, 0.78, 1.01, 0.96, 1.06, 0.99];   // satu anak (0.78) di antara dewasa
var STRIDE = 28;          // radian ayun per satuan jarak dunia (langkah ~0.22)
var SWING = 0.6;          // sudut ayun maksimum pinggul (rad)
var KNEE = 0.85;          // tekukan lutut maksimum saat kaki diayun ke depan (rad)
var TURN_RATE = 7;        // kecepatan berputar badan (rad/detik)
var UMB_ARM = 0.5, UMB_ELBOW = 1.5;   // lengan pemegang payung (bahu, siku)

export function personLook(i) {
    // Indeks bilangan prima berbeda supaya kombinasi kulit/rambut/baju/celana tidak berulang serempak.
    return {
        skin: SKIN[(i * 3 + 1) % SKIN.length],
        hair: HAIR[(i * 5 + 2) % HAIR.length],
        shirt: SHIRT[(i * 7 + 3) % SHIRT.length],
        pants: PANTS[(i * 11 + 1) % PANTS.length],
        umbrella: UMB[(i * 3) % UMB.length],
        pack: i % 3 === 0,               // sepertiga membawa ransel
        umb: i % 4 !== 3,                // 3 dari 4 orang punya payung
        style: (i * 3 + 2) % 5,          // 0 pendek, 1 panjang, 2 kerudung, 3 topi, 4 cepol
        accent: SHIRT[(i * 7 + 8) % SHIRT.length],   // warna kerudung / topi
        longSleeve: i % 4 === 1,
        phone: i % 5 === 2,              // menatap ponsel sambil berjalan
        shoe: SHOES[(i * 3) % SHOES.length],
        h: HEIGHT[i % HEIGHT.length]
    };
}

export function wrapAngle(a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
}

// Arah badan (yaw) dari sumbu jalan dan arah maju. Model menghadap +x:
//   sumbu x (dan 'h'): maju = +x (0), mundur = -x (PI); sumbu z: maju = -z (PI/2), mundur = +z (-PI/2).
export function yawFor(axis, forward) {
    if (axis !== 'z') return forward ? 0 : Math.PI;     // 'x' dan 'h' (jalan permukiman) sama-sama sejajar sumbu x
    return forward ? Math.PI / 2 : -Math.PI / 2;
}

export function createPeople(THREE, A, root, mk, put) {
    var people = [];
    var lastT = null;
    var rainOn = false;
    var matCache = {};
    function mat(c) { return matCache[c] || (matCache[c] = mk(c)); }
    var EYE = 0x1a1410;

    function add(spec) {
        var L = personLook(spec.index || 0);
        var g = new THREE.Group();
        var inner = new THREE.Group();            // diputar mengikuti arah jalan
        g.add(inner);
        g.scale.set(L.h, L.h, L.h);

        // sendi dua ruas: pivot atas (pinggul/bahu) -> ruas atas -> pivot bawah (lutut/siku) -> ruas bawah
        function joint(parent, y, z) {
            var pv = new THREE.Group();
            pv.position.set(0, y, z);
            parent.add(pv);
            return pv;
        }

        // ----- kaki -----
        function leg(z) {
            var hip = joint(inner, 0.198, z);
            hip.add(put(A.box(0.05, 0.1, 0.055), mat(L.pants), 0, -0.05, 0));
            var knee = joint(hip, -0.1, 0);
            knee.add(put(A.box(0.042, 0.085, 0.048), mat(L.pants), 0, -0.0425, 0));
            knee.add(put(A.box(0.078, 0.026, 0.05), mat(L.shoe), 0.013, -0.088, 0));
            return { hip: hip, knee: knee };
        }
        var lL = leg(0.03), lR = leg(-0.03);

        // ----- badan -----
        inner.add(put(A.box(0.06, 0.05, 0.106), mat(L.pants), 0, 0.2, 0));              // pinggul
        var torso = joint(inner, 0.2, 0);                                                  // pivot di pinggul: condong + memuntir
        torso.add(put(A.box(0.064, 0.125, 0.112), mat(L.shirt), 0, 0.07, 0));              // dada
        torso.add(put(A.box(0.05, 0.03, 0.14), mat(L.shirt), 0, 0.13, 0));                 // bahu lebih lebar
        torso.add(put(A.cyl(0.017, 0.019, 0.034, 6), mat(L.skin), 0, 0.157, 0));           // leher
        if (L.pack) torso.add(put(A.box(0.042, 0.095, 0.08), mat(0x334155), -0.056, 0.08, 0));

        // ----- lengan (bahu -> siku) -----
        function arm(z) {
            var sh = joint(torso, 0.118, z);
            sh.add(put(A.box(0.036, 0.07, 0.038), mat(L.shirt), 0, -0.035, 0));
            var el = joint(sh, -0.07, 0);
            el.add(put(A.box(0.031, 0.075, 0.033), mat(L.longSleeve ? L.shirt : L.skin), 0, -0.0375, 0));
            return { sh: sh, el: el };
        }
        var aL = arm(0.079), aR = arm(-0.079);

        // ----- kepala -----
        var headG = joint(torso, 0.168, 0);                      // pivot leher: bisa menunduk
        var head = put(A.sph(0.048, 10, 8), mat(L.skin), 0.004, 0.036, 0);
        head.scale.set(1, 1.06, 0.96);
        headG.add(head);
        if (A.realShadows) {                                     // tier 'low' melewati mata (hemat draw call)
            headG.add(put(A.box(0.012, 0.011, 0.012), mat(EYE), 0.05, 0.044, 0.02));
            headG.add(put(A.box(0.012, 0.011, 0.012), mat(EYE), 0.05, 0.044, -0.02));
        }
        var hairM = mat(L.hair);
        if (L.style === 2) {                                     // kerudung: bingkai wajah + drape sampai bahu
            var scarf = put(A.sph(0.053, 10, 8), mat(L.accent), -0.012, 0.038, 0);
            scarf.scale.set(1, 1.06, 1);
            headG.add(scarf);
            headG.add(put(A.box(0.07, 0.06, 0.108), mat(L.accent), -0.012, -0.012, 0));
        } else {
            var hr = put(A.sph(0.052, 10, 6), L.style === 3 ? mat(L.accent) : hairM, -0.006, 0.05, 0);
            hr.scale.set(1, 0.78, 1);
            headG.add(hr);
            if (L.style === 3) headG.add(put(A.box(0.05, 0.008, 0.07), mat(L.accent), 0.05, 0.052, 0));          // lidah topi
            else if (L.style === 1) headG.add(put(A.box(0.03, 0.1, 0.098), hairM, -0.04, 0.0, 0));                // rambut panjang
            else if (L.style === 4) headG.add(put(A.sph(0.02, 6, 5), hairM, -0.052, 0.062, 0));                   // cepol
        }

        // ----- ponsel (di tangan kanan, menempel di siku kanan) -----
        var phone = null;
        if (L.phone) {
            phone = put(A.box(0.008, 0.05, 0.03), mat(0x0f172a), 0.012, -0.08, 0);
            aR.el.add(phone);
        }

        // ----- payung (tersembunyi saat cerah): dua mesh saja (tiang + kanopi) -----
        var umb = null;
        if (L.umb) {
            umb = new THREE.Group();
            umb.position.set(0.09, 0.285, -0.075);
            umb.rotation.z = 0.35;                               // miring ke belakang, menaungi kepala
            umb.rotation.x = 0.25;
            umb.add(put(A.cyl(0.004, 0.004, 0.3, 4), mat(0x1f2937), 0, 0.15, 0));
            umb.add(put(A.cyl(0.01, 0.125, 0.05, 10), mat(L.umbrella), 0, 0.31, 0));
            umb.visible = rainOn;
            inner.add(umb);
        }

        root.add(g);
        var p = {
            g: g, inner: inner, torso: torso, headG: headG,
            legL: lL.hip, legR: lR.hip, kneeL: lL.knee, kneeR: lR.knee,
            armL: aL.sh, armR: aR.sh, elbowL: aL.el, elbowR: aR.el,
            phone: phone, umb: umb,
            axis: spec.axis, side: spec.side, speed: spec.speed, s0: spec.s0,
            yaw: yawFor(spec.axis, true), look: L
        };
        inner.rotation.y = p.yaw;
        torso.rotation.z = -0.06;                                // condong sedikit ke depan
        if (phone) headG.rotation.z = -0.3;                      // menunduk menatap ponsel
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
        var ph = dist * STRIDE;
        var s = Math.sin(ph), c = Math.cos(ph);
        // kaki: pinggul berayun berlawanan; lutut menekuk hanya saat kaki sedang diayun ke depan
        p.legL.rotation.z = s * SWING;
        p.legR.rotation.z = -s * SWING;
        p.kneeL.rotation.z = -Math.max(0, c) * KNEE;
        p.kneeR.rotation.z = -Math.max(0, -c) * KNEE;
        // lengan: berlawanan dengan kaki sisi yang sama; siku menekuk lebih saat lengan di depan
        p.armL.rotation.z = -s * 0.7;
        p.armR.rotation.z = s * 0.7;
        p.elbowL.rotation.z = 0.2 + 0.4 * Math.max(0, -s);
        p.elbowR.rotation.z = 0.2 + 0.4 * Math.max(0, s);
        // badan memuntir halus berlawanan dengan pinggul + sedikit goyang samping
        p.torso.rotation.y = s * 0.1;
        p.torso.rotation.x = c * 0.03;
        var holdUmb = p.umb && rainOn;
        if (holdUmb) {                                           // payung dipegang: lengan kanan terangkat & tidak berayun
            p.armR.rotation.z = UMB_ARM;
            p.elbowR.rotation.z = UMB_ELBOW;
        } else if (p.phone) {                                    // ponsel di depan dada
            p.armR.rotation.z = 0.55;
            p.elbowR.rotation.z = 1.5;
        }
        if (p.phone) p.phone.visible = !holdUmb;
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
