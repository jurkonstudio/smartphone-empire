// FILE: src/ui/campus/CampusFx.js
// v2027.44 (Tahap 4) — Efek peta kampus:
//  1) cincin seleksi berdenyut di bawah bangunan yang dipilih,
//  2) ledakan "naik level": gelombang kejut + percikan (pool tetap, tanpa alokasi per-frame).
// Semua objek dibuat malas (lazy) dan dipakai ulang. Ringan untuk HP.

var SPARKS_PER_BURST = 14;
var MAX_BURSTS = 3;
var WAVE_MS = 950;
var GRAVITY = 9;

export function createCampusFx(THREE) {
    var group = new THREE.Group();
    group.name = 'campus-fx';

    var accent = new THREE.Color(0x2563eb);
    var ringGeo = new THREE.RingGeometry(0.9, 1, 56);
    ringGeo.rotateX(-Math.PI / 2);

    // ---------- cincin seleksi ----------
    var selMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide });
    var selRing = new THREE.Mesh(ringGeo, selMat);
    var haloMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide });
    var haloGeo = new THREE.CircleGeometry(1, 40);
    haloGeo.rotateX(-Math.PI / 2);
    var halo = new THREE.Mesh(haloGeo, haloMat);
    selRing.visible = halo.visible = false;
    selRing.renderOrder = 5; halo.renderOrder = 4;
    group.add(halo, selRing);
    var sel = { on: false, r: 1, x: 0, z: 0 };

    // ---------- percikan & gelombang (dibuat saat ledakan pertama) ----------
    var sparks = null, sparkMats = null, waves = null, sparkGeo = null;
    var last = 0;

    function init() {
        if (sparks) return;
        sparkGeo = new THREE.BoxGeometry(0.13, 0.13, 0.13);
        sparkMats = [
            new THREE.MeshBasicMaterial({ color: 0xffc83d }),
            new THREE.MeshBasicMaterial({ color: accent.clone() }),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        ];
        sparks = [];
        for (var i = 0; i < SPARKS_PER_BURST * MAX_BURSTS; i++) {
            var m = new THREE.Mesh(sparkGeo, sparkMats[i % 3]);
            m.visible = false;
            group.add(m);
            sparks.push({ m: m, vx: 0, vy: 0, vz: 0, t0: 0, life: 1, on: false });
        }
        waves = [];
        for (var w = 0; w < MAX_BURSTS; w++) {
            var mat = new THREE.MeshBasicMaterial({ color: 0xffc83d, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
            var mesh = new THREE.Mesh(ringGeo, mat);
            mesh.visible = false; mesh.renderOrder = 6;
            group.add(mesh);
            waves.push({ m: mesh, mat: mat, t0: 0, r: 1, on: false });
        }
    }

    function setAccent(css, dark) {
        try { accent.set(css); } catch (e) { /* biarkan warna lama */ }
        selMat.color.copy(accent);
        haloMat.color.copy(accent);
        haloMat.opacity = dark ? 0.24 : 0.18;
        if (sparkMats) sparkMats[1].color.copy(accent);
    }

    function select(cx, cz, r) {
        sel.on = true; sel.x = cx; sel.z = cz; sel.r = r;
        selRing.position.set(cx, 0.16, cz);
        halo.position.set(cx, 0.15, cz);
        selRing.scale.set(r, 1, r);
        halo.scale.set(r, 1, r);
        selRing.visible = halo.visible = true;
    }

    function clearSelection() {
        sel.on = false;
        selRing.visible = halo.visible = false;
    }

    function burst(cx, cz, r, top) {
        init();
        var now = performance.now();
        // gelombang kejut
        for (var w = 0; w < waves.length; w++) {
            if (waves[w].on) continue;
            var wv = waves[w];
            wv.on = true; wv.t0 = now; wv.r = Math.max(1, r);
            wv.m.position.set(cx, 0.2, cz);
            wv.m.visible = true;
            break;
        }
        // percikan
        var n = 0;
        for (var i = 0; i < sparks.length && n < SPARKS_PER_BURST; i++) {
            var s = sparks[i];
            if (s.on) continue;
            var a = Math.random() * Math.PI * 2;
            var sp = 0.8 + Math.random() * 1.8;
            s.vx = Math.cos(a) * sp; s.vz = Math.sin(a) * sp;
            s.vy = 3 + Math.random() * 3;
            s.t0 = now; s.life = 800 + Math.random() * 600;
            s.m.position.set(cx + (Math.random() - 0.5) * r * 0.6, Math.max(0.5, top), cz + (Math.random() - 0.5) * r * 0.6);
            s.m.scale.setScalar(1);
            s.m.visible = true; s.on = true;
            n++;
        }
    }

    // Dipanggil tiap frame ambient. now = ms (performance.now / rAF timestamp).
    function update(now) {
        var t = now / 1000;
        if (sel.on) {
            var p = 0.5 + 0.5 * Math.sin(t * 3.2);
            var k = 1 + 0.06 * p;
            selRing.scale.set(sel.r * k, 1, sel.r * k);
            selMat.opacity = 0.55 + 0.35 * p;
            halo.scale.set(sel.r * 0.98, 1, sel.r * 0.98);
        }
        if (!sparks) return false;
        var dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
        last = now;
        var live = false;
        for (var i = 0; i < sparks.length; i++) {
            var s = sparks[i];
            if (!s.on) continue;
            var age = (now - s.t0) / s.life;
            if (age >= 1) { s.on = false; s.m.visible = false; continue; }
            s.vy -= GRAVITY * dt;
            s.m.position.x += s.vx * dt;
            s.m.position.y = Math.max(0.1, s.m.position.y + s.vy * dt);
            s.m.position.z += s.vz * dt;
            s.m.rotation.x += dt * 6; s.m.rotation.y += dt * 5;
            s.m.scale.setScalar(Math.max(0.01, 1 - age * age));
            live = true;
        }
        for (var w = 0; w < waves.length; w++) {
            var wv = waves[w];
            if (!wv.on) continue;
            var q = (now - wv.t0) / WAVE_MS;
            if (q >= 1) { wv.on = false; wv.m.visible = false; wv.mat.opacity = 0; continue; }
            var e = 1 - Math.pow(1 - q, 3);
            var sc = wv.r * (0.7 + 1.9 * e);
            wv.m.scale.set(sc, 1, sc);
            wv.mat.opacity = 0.85 * (1 - q);
            live = true;
        }
        return live;
    }

    return {
        group: group,
        setAccent: setAccent,
        select: select,
        clearSelection: clearSelection,
        burst: burst,
        update: update,
        dispose: function () {
            if (group.parent) group.parent.remove(group);
            ringGeo.dispose(); haloGeo.dispose(); selMat.dispose(); haloMat.dispose();
            if (sparks) { sparkGeo.dispose(); sparkMats.forEach(function (m) { m.dispose(); }); }
            if (waves) waves.forEach(function (w) { w.mat.dispose(); });
            sparks = waves = null;
        }
    };
}
