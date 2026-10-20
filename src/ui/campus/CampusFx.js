// FILE: src/ui/campus/CampusFx.js
// v2027.60 — seleksi lebih elegan: cincin tipis + halo gradien radial (tekstur kecil, bukan lingkaran
// datar), fade-in/out halus, dan cincin hover (mouse) terpisah. Warna efek tidak ikut tone mapping
// (toneMapped:false) supaya tetap sama dengan warna aksen UI. Efek tidak menyentuh geometri/material
// bangunan, jadi data & model asli aman.
// v2027.44 (Tahap 4) — Efek peta kampus:
//  1) cincin seleksi berdenyut di bawah bangunan yang dipilih,
//  2) ledakan "naik level": gelombang kejut + percikan (pool tetap, tanpa alokasi per-frame).
// Semua objek dibuat malas (lazy) dan dipakai ulang. Ringan untuk HP.

var SPARKS_PER_BURST = 14;
var MAX_BURSTS = 3;
var WAVE_MS = 950;
var GRAVITY = 9;
var FADE_RATE = 14;        // makin besar = fade makin cepat (exp. smoothing per detik)

function makeHaloTex(THREE) {
    var S = 64, c = document.createElement('canvas');
    c.width = c.height = S;
    var g = c.getContext('2d');
    var gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    gr.addColorStop(0, 'rgba(255,255,255,0.05)');
    gr.addColorStop(0.72, 'rgba(255,255,255,0.5)');
    gr.addColorStop(0.9, 'rgba(255,255,255,0.18)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, S, S);
    return new THREE.CanvasTexture(c);
}

export function createCampusFx(THREE) {
    var group = new THREE.Group();
    group.name = 'campus-fx';

    var accent = new THREE.Color(0x2563eb);
    var immediate = false;       // true = reduced-motion / tanpa loop: lompat langsung, tanpa fade
    var ringGeo = new THREE.RingGeometry(0.94, 1, 64);
    ringGeo.rotateX(-Math.PI / 2);

    // ---------- cincin seleksi + halo ----------
    var selMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    var selRing = new THREE.Mesh(ringGeo, selMat);
    var haloTex = makeHaloTex(THREE);
    var haloMat = new THREE.MeshBasicMaterial({ color: accent, map: haloTex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    var haloGeo = new THREE.PlaneGeometry(2.5, 2.5);
    haloGeo.rotateX(-Math.PI / 2);
    var halo = new THREE.Mesh(haloGeo, haloMat);
    selRing.visible = halo.visible = false;
    selRing.renderOrder = 5; halo.renderOrder = 4;
    selRing.raycast = halo.raycast = function () {};
    group.add(halo, selRing);
    var sel = { on: false, a: 0, r: 1, x: 0, z: 0 };
    var haloBase = 0.34;

    // ---------- cincin hover (mouse) ----------
    var hovMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    var hovRing = new THREE.Mesh(ringGeo, hovMat);
    hovRing.visible = false; hovRing.renderOrder = 3;
    hovRing.raycast = function () {};
    group.add(hovRing);
    var hov = { on: false, a: 0, r: 1 };

    // ---------- percikan & gelombang (dibuat saat ledakan pertama) ----------
    var sparks = null, sparkMats = null, waves = null, sparkGeo = null;
    var last = 0;

    function init() {
        if (sparks) return;
        sparkGeo = new THREE.BoxGeometry(0.13, 0.13, 0.13);
        sparkMats = [
            new THREE.MeshBasicMaterial({ color: 0xffc83d, toneMapped: false }),
            new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false }),
            new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })
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
            var mat = new THREE.MeshBasicMaterial({ color: 0xffc83d, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
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
        hovMat.color.copy(accent);
        haloBase = dark ? 0.42 : 0.34;
        if (sparkMats) sparkMats[1].color.copy(accent);
    }

    function paintSel(p) {       // p: 0..1 denyut
        var a = sel.a;
        var k = (0.94 + 0.06 * a) * (1 + 0.05 * p);
        selRing.scale.set(sel.r * k, 1, sel.r * k);
        selMat.opacity = (0.6 + 0.35 * p) * a;
        halo.scale.set(sel.r * (0.9 + 0.1 * a), 1, sel.r * (0.9 + 0.1 * a));
        haloMat.opacity = haloBase * a;
        selRing.visible = halo.visible = a > 0.01;
    }
    function paintHov() {
        hovRing.scale.set(hov.r * 1.04, 1, hov.r * 1.04);
        hovMat.opacity = 0.5 * hov.a;
        hovRing.visible = hov.a > 0.01;
    }

    function select(cx, cz, r) {
        sel.on = true; sel.x = cx; sel.z = cz; sel.r = r;
        selRing.position.set(cx, 0.16, cz);
        halo.position.set(cx, 0.15, cz);
        if (immediate) sel.a = 1;
        paintSel(0.5);
    }

    function clearSelection() {
        sel.on = false;
        if (immediate) { sel.a = 0; paintSel(0.5); }
    }

    function hover(cx, cz, r) {
        hov.on = true; hov.r = r;
        hovRing.position.set(cx, 0.14, cz);
        if (immediate) hov.a = 1;
        paintHov();
    }

    function clearHover() {
        hov.on = false;
        if (immediate) { hov.a = 0; paintHov(); }
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
        var dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
        last = now;

        // fade seleksi / hover (exp. smoothing, snap saat hampir sampai)
        var f = 1 - Math.exp(-FADE_RATE * dt);
        var ta = sel.on ? 1 : 0;
        if (sel.a !== ta) { sel.a += (ta - sel.a) * f; if (Math.abs(ta - sel.a) < 0.01) sel.a = ta; }
        if (sel.a > 0 || sel.on) paintSel(0.5 + 0.5 * Math.sin(t * 3.2));
        var th = hov.on ? 1 : 0;
        if (hov.a !== th) { hov.a += (th - hov.a) * f; if (Math.abs(th - hov.a) < 0.01) hov.a = th; paintHov(); }

        if (!sparks) return false;
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
        setImmediate: function (v) { immediate = !!v; },
        select: select,
        clearSelection: clearSelection,
        hover: hover,
        clearHover: clearHover,
        burst: burst,
        update: update,
        dispose: function () {
            if (group.parent) group.parent.remove(group);
            ringGeo.dispose(); haloGeo.dispose(); haloTex.dispose();
            selMat.dispose(); haloMat.dispose(); hovMat.dispose();
            if (sparks) { sparkGeo.dispose(); sparkMats.forEach(function (m) { m.dispose(); }); }
            if (waves) waves.forEach(function (w) { w.mat.dispose(); });
            sparks = waves = null;
        }
    };
}
