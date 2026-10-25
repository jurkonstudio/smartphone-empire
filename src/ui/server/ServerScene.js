// FILE: src/ui/server/ServerScene.js  (BARU — v2027.73: Peta Server 3D di DASAR LAUT)
// Pusat data bawah laut: dua pod tekanan berkaca di dasar laut, koridor penghubung, hub pendingin & daya,
// kabel serat yang naik ke permukaan (cahaya dari atas), gelembung, ikan, karang, dan dua lahan terkunci.
// Kedalaman dibaca dari kabut biru tebal + latar laut dalam — bukan langit di atas pulau.
//
// Dipanggil dari ServerMap.js (THREE dimuat lazy). Scene ini TIDAK mengubah scene Kampus/Manufaktur/Kantor.
// Pola yang dipakai: satu WebGLRenderer, geometri & material dicatat lalu di-dispose, InstancedMesh untuk rak/LED,
// satu loop ~30 fps yang berhenti saat tab tersembunyi, dan kualitas mengikuti detectQuality() (low/medium/high).
//
// API:
//   var srv = createServerScene(THREE, container, { quality?, now?, aria, title, subtitle, podNames:[..] });
//   srv.update(gameState);     // beban pod dari state.server.pods[i].util (0..1.5); placeholder bila belum ada
//   srv.dispose();
//
// Catatan: utilisasi & jumlah pod sementara dibaca dari state.server bila ada; ServerSystem (Sesi 1) belum ada.
import { detectQuality } from '../campus/CampusLook.js';
import { createDayClock, nightAmount } from '../campus/DayCycle.js';

var DEEP = 0x06304a;             // warna air dalam (latar & kabut)
var VIEW_DEFAULT = 10;           // setengah tinggi pandang (satuan dunia)
var VIEW_MIN = 5, VIEW_MAX = 18;
var FRAME_MS = 33;               // ~30 fps
var MAX_DPR = 1.75;
var PODS = [
    { x: -4, z: -4, util: 0.42 },   // Pod A
    { x: -4, z: 4, util: 0.78 }     // Pod B
];
var HUB = { x: 6.5, z: 0 };
var LOCKED = [ { x: -12, z: -6 }, { x: -12, z: 6 } ];   // lahan konstruksi untuk modul berikutnya
var HULL_Y = 2.5;                // pusat pod tekanan (dasar pod di atas dasar laut)
var HULL_R = 2.2;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function statusHex(u) { return u < 0.7 ? 0x43e08a : (u < 0.9 ? 0xffc247 : 0xff4d4d); }

// Dasar laut: datar di pusat (tempat pod & hub), bergelombang di pinggir. Dipakai juga untuk menaruh batu & karang.
function seabedY(x, z) {
    var r = Math.sqrt(x * x + z * z);
    var k = clamp((r - 12) / 10, 0, 1);
    var h = Math.sin(x * 0.23 + 1.3) * Math.cos(z * 0.19) * 0.9 +
        Math.sin((x + z) * 0.41) * 0.35 + Math.sin(x * 0.07 - z * 0.11) * 1.2;
    return -0.3 + h * k;
}

// Angka acak deterministik (agar tata letak batu & karang sama setiap kali peta dibuka).
function seeded(seed) {
    var s = seed >>> 0;
    return function () {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

export function createServerScene(THREE, container, opts) {
    opts = opts || {};
    var PERF = window.__PERF || {};
    var look = opts.quality || detectQuality(PERF);
    var low = look.tier === 'low';
    var medium = look.tier === 'medium';
    var reduce = false;
    try { reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}

    var renderer = new THREE.WebGLRenderer({ antialias: !low && PERF.antialias !== false, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR, look.maxDpr));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(DEEP, 1);
    var canvas = renderer.domElement;
    canvas.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;cursor:grab;';
    canvas.setAttribute('role', 'img');
    if (opts.aria) canvas.setAttribute('aria-label', opts.aria);
    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.isolation = 'isolate';
    container.style.overflow = 'hidden';
    container.style.background = 'linear-gradient(180deg,#0e5a7a 0%,#06304a 45%,#020f1c 100%)';
    container.appendChild(canvas);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(DEEP, low ? 0.024 : 0.03);
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
    var target = new THREE.Vector3(0, 0, 0);
    var ISO = new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(60);
    var view = VIEW_DEFAULT;
    var aspect = 1;

    // ---------- pencatatan geometri & material (di-dispose bersama) ----------
    var geos = [], mats = [];
    function G(g) { geos.push(g); return g; }
    function M(m) { mats.push(m); return m; }

    var hemi = new THREE.HemisphereLight(0x9fe9ff, 0x07263a, 1.0);
    scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xc4f1ff, 1.1);
    sun.position.set(-10, 30, 8);
    scene.add(sun);

    var matSteel = M(new THREE.MeshStandardMaterial({ color: 0x5b6f86, metalness: 0.55, roughness: 0.42 }));
    var matDark = M(new THREE.MeshStandardMaterial({ color: 0x23344a, metalness: 0.45, roughness: 0.6 }));
    var matRack = M(new THREE.MeshStandardMaterial({ color: 0x18263a, metalness: 0.3, roughness: 0.7 }));
    var matSlab = M(new THREE.MeshStandardMaterial({ color: 0x2b3f52, metalness: 0.2, roughness: 0.9 }));
    var matGlass = M(new THREE.MeshStandardMaterial({
        color: 0x9fe6ff, metalness: 0, roughness: 0.08, transparent: true, opacity: 0.16,
        depthWrite: false, emissive: 0x1f6f8f, emissiveIntensity: 0.35, side: THREE.DoubleSide
    }));
    var matLed = M(new THREE.MeshBasicMaterial({ color: 0xffffff }));   // warna per instance (setColorAt)
    var matFiber = M(new THREE.MeshBasicMaterial({ color: 0x7ff0ff, transparent: true, opacity: 0.8, depthWrite: false }));
    var matCore = M(new THREE.MeshBasicMaterial({ color: 0x7ff0ff, transparent: true, opacity: 0.85 }));
    var matShaft = M(new THREE.MeshBasicMaterial({
        color: 0x9fe9ff, transparent: true, opacity: 0.07, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    }));
    var matLock = M(new THREE.LineBasicMaterial({ color: 0x8fb3c7, transparent: true, opacity: 0.55 }));
    var matRock = M(new THREE.MeshStandardMaterial({ color: 0x3d4f5c, roughness: 1, metalness: 0 }));
    var matCoral = M(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0 }));
    var matFish = M(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.1 }));
    var matHubFan = M(new THREE.MeshBasicMaterial({ color: 0x7ff0ff, transparent: true, opacity: 0.9, depthWrite: false }));
    var matPower = M(new THREE.MeshBasicMaterial({ color: 0x43e08a }));
    var matGenStrip = M(new THREE.MeshBasicMaterial({ color: 0xffc247 }));

    // ---------- dasar laut ----------
    var seabedGeo = G(new THREE.PlaneGeometry(96, 96, 84, 84));
    seabedGeo.rotateX(-Math.PI / 2);
    var sp = seabedGeo.attributes.position;
    var colors = new Float32Array(sp.count * 3);
    var cA = new THREE.Color(0x244656), cB = new THREE.Color(0x4f7079), tmp = new THREE.Color();
    for (var i = 0; i < sp.count; i++) {
        var x = sp.getX(i), z = sp.getZ(i);
        sp.setY(i, seabedY(x, z));
        var n = 0.5 + 0.5 * Math.sin(x * 0.6 + z * 0.37) * Math.cos(z * 0.5 - x * 0.21);
        tmp.copy(cA).lerp(cB, n * 0.85);
        colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    seabedGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    seabedGeo.computeVertexNormals();
    var seabed = new THREE.Mesh(seabedGeo, M(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 })));
    scene.add(seabed);

    var dummy = new THREE.Object3D();
    var rnd = seeded(42);

    // batu & karang di pinggir (instanced; satu draw call per jenis)
    var ROCKS = low ? 10 : 22, CORALS = low ? 8 : 18;
    var rockMesh = new THREE.InstancedMesh(G(new THREE.IcosahedronGeometry(0.9, 0)), matRock, ROCKS);
    var coralMesh = new THREE.InstancedMesh(G(new THREE.ConeGeometry(0.32, 1.3, 6)), matCoral, CORALS);
    function scatter(mesh, count, kind) {
        for (var k = 0; k < count; k++) {
            var a = rnd() * Math.PI * 2, r = 13 + rnd() * 17;
            var x = Math.cos(a) * r, z = Math.sin(a) * r;
            var s = kind === 'rock' ? 0.6 + rnd() * 1.6 : 0.7 + rnd() * 1.1;
            dummy.position.set(x, seabedY(x, z) + (kind === 'rock' ? 0.1 * s : 0.6 * s), z);
            dummy.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
            dummy.scale.set(s, kind === 'rock' ? s * 0.7 : s, s);
            dummy.updateMatrix();
            mesh.setMatrixAt(k, dummy.matrix);
            if (kind === 'coral') mesh.setColorAt(k, new THREE.Color(rnd() < 0.5 ? 0x2fb8a6 : 0xf472b6));
        }
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        scene.add(mesh);
    }
    scatter(rockMesh, ROCKS, 'rock');
    scatter(coralMesh, CORALS, 'coral');

    // ---------- pod tekanan (dua saja) ----------
    var pods = PODS.map(function (p, idx) { return buildPod(p, idx); });

    function buildPod(p, idx) {
        var group = new THREE.Group();
        group.position.set(p.x, 0, p.z);
        scene.add(group);

        var slab = new THREE.Mesh(G(new THREE.BoxGeometry(9.6, 0.6, 6.8)), matSlab);
        slab.position.set(0, 0, 0);
        group.add(slab);

        var floor = new THREE.Mesh(G(new THREE.BoxGeometry(7.2, 0.1, 3.8)), matDark);
        floor.position.set(0, 0.35, 0);
        group.add(floor);

        var hull = new THREE.Mesh(G(new THREE.CylinderGeometry(HULL_R, HULL_R, 8, low ? 16 : 32, 1, true)), matGlass);
        hull.rotation.z = Math.PI / 2;
        hull.position.set(0, HULL_Y, 0);
        hull.renderOrder = 2;
        group.add(hull);

        // cincin rangka (tiga rusuk) & dua tutup logam di ujung
        [-2.8, 0, 2.8].forEach(function (rx) {
            var rib = new THREE.Mesh(G(new THREE.TorusGeometry(HULL_R, 0.07, 6, low ? 16 : 32)), matSteel);
            rib.rotation.y = Math.PI / 2;
            rib.position.set(rx, HULL_Y, 0);
            group.add(rib);
        });
        [-4, 4].forEach(function (ex) {
            var cap = new THREE.Mesh(G(new THREE.CylinderGeometry(HULL_R + 0.05, HULL_R + 0.05, 0.3, low ? 16 : 32)), matSteel);
            cap.rotation.z = Math.PI / 2;
            cap.position.set(ex, HULL_Y, 0);
            group.add(cap);
        });

        // rak komputasi: 5 kolom x 2 baris = 10 rak; LED status di atas tiap rak
        var rackSlots = [];
        [-2.8, -1.4, 0, 1.4, 2.8].forEach(function (rx) {
            [-0.7, 0.7].forEach(function (rz) { rackSlots.push({ x: rx, z: rz }); });
        });
        var racks = new THREE.InstancedMesh(G(new THREE.BoxGeometry(0.6, 1.2, 0.6)), matRack, rackSlots.length);
        var leds = new THREE.InstancedMesh(G(new THREE.BoxGeometry(0.5, 0.04, 0.3)), matLed, rackSlots.length);
        rackSlots.forEach(function (s, k) {
            dummy.position.set(s.x, HULL_Y - 1.25, s.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1);
            dummy.updateMatrix(); racks.setMatrixAt(k, dummy.matrix);
            dummy.position.set(s.x, HULL_Y - 0.62, s.z);
            dummy.updateMatrix(); leds.setMatrixAt(k, dummy.matrix);
            leds.setColorAt(k, new THREE.Color(0x43e08a));
        });
        racks.instanceMatrix.needsUpdate = true;
        leds.instanceMatrix.needsUpdate = true;
        if (leds.instanceColor) leds.instanceColor.needsUpdate = true;
        group.add(racks);
        group.add(leds);

        // lampu status di ujung pod (warna = beban)
        var lamp = new THREE.Mesh(G(new THREE.SphereGeometry(0.3, 12, 8)), M(new THREE.MeshBasicMaterial({ color: 0x43e08a })));
        lamp.position.set(4.35, HULL_Y + 1.4, 0);
        group.add(lamp);

        return { group: group, racks: racks, leds: leds, lamp: lamp, util: p.util, idx: idx, phase: idx * 1.7 };
    }

    // koridor penghubung antar ujung pod (sumbu z) + inti cahaya di dalamnya
    var corridor = new THREE.Mesh(G(new THREE.CylinderGeometry(0.9, 0.9, 8, low ? 12 : 20, 1, true)), matGlass);
    corridor.rotation.x = Math.PI / 2;
    corridor.position.set(0, HULL_Y, 0);
    scene.add(corridor);
    var core = new THREE.Mesh(G(new THREE.CylinderGeometry(0.22, 0.22, 8, 8)), matCore);
    core.rotation.x = Math.PI / 2;
    core.position.set(0, HULL_Y, 0);
    scene.add(core);

    // hub pendingin & daya di sisi kanan
    var cooler = new THREE.Mesh(G(new THREE.CylinderGeometry(2, 2, 3, low ? 14 : 24)), matSteel);
    cooler.position.set(HUB.x, 1.8, HUB.z);
    scene.add(cooler);
    var fan = new THREE.Mesh(G(new THREE.TorusGeometry(1.5, 0.12, 6, low ? 14 : 28)), matHubFan);
    fan.rotation.x = Math.PI / 2;
    fan.position.set(HUB.x, 3.35, HUB.z);
    scene.add(fan);
    var ups = new THREE.Mesh(G(new THREE.BoxGeometry(2.4, 1.8, 2.2)), matDark);
    ups.position.set(HUB.x, 1.2, HUB.z - 3.5);
    scene.add(ups);
    var upsLed = new THREE.Mesh(G(new THREE.BoxGeometry(2.0, 0.12, 0.12)), matPower);
    upsLed.position.set(HUB.x, 2.15, HUB.z - 3.5 + 1.15);
    scene.add(upsLed);
    var gen = new THREE.Mesh(G(new THREE.BoxGeometry(2.6, 1.6, 2)), matDark);
    gen.position.set(HUB.x, 1.1, HUB.z + 3.5);
    scene.add(gen);
    var genLed = new THREE.Mesh(G(new THREE.BoxGeometry(2.2, 0.12, 0.12)), matGenStrip);
    genLed.position.set(HUB.x, 1.95, HUB.z + 3.5 + 1.05);
    scene.add(genLed);

    // kabel serat dari Pod A naik ke permukaan (cahaya dari atas)
    var fiber = new THREE.Mesh(G(new THREE.CylinderGeometry(0.07, 0.07, 35, 8)), matFiber);
    fiber.position.set(-4, 4.7 + 17.5, -4);
    scene.add(fiber);

    // dua lahan terkunci (lahan konstruksi) untuk modul berikutnya
    LOCKED.forEach(function (lk) {
        var box = new THREE.BoxGeometry(4.6, 0.05, 4.6);
        var lines = new THREE.LineSegments(G(new THREE.EdgesGeometry(box)), matLock);
        lines.position.set(lk.x, 0.05 + seabedY(lk.x, lk.z) + 0.3, lk.z);
        scene.add(lines);
    });

    // ---------- ikan (dekoratif) ----------
    var FISH = low ? 0 : (medium ? 3 : 6);
    var fishMesh = null, fishData = [];
    if (FISH > 0) {
        fishMesh = new THREE.InstancedMesh(G(new THREE.SphereGeometry(0.3, 8, 6)), matFish, FISH);
        for (var f = 0; f < FISH; f++) {
            fishData.push({ r: 14 + rnd() * 8, a: rnd() * Math.PI * 2, sp: (rnd() < 0.5 ? -1 : 1) * (0.05 + rnd() * 0.06), y: 4 + rnd() * 4 });
            fishMesh.setColorAt(f, new THREE.Color(f % 2 ? 0xffb347 : 0x7fd6ff));
        }
        if (fishMesh.instanceColor) fishMesh.instanceColor.needsUpdate = true;
        scene.add(fishMesh);
    }

    // ---------- cahaya dari permukaan (shaft) ----------
    var SHAFTS = low ? 2 : 4;
    var shafts = [];
    for (var s = 0; s < SHAFTS; s++) {
        var sh = new THREE.Mesh(G(new THREE.PlaneGeometry(3.6, 46)), matShaft);
        sh.position.set(-14 + s * 9, 17, -6 + (s % 2) * 6);
        sh.rotation.set(0, Math.PI / 4, -0.22);
        scene.add(sh);
        shafts.push(sh);
    }

    // ---------- gelembung (Points, sekali dibuat, digerakkan per frame) ----------
    var BUBBLES = low ? 0 : (medium ? 16 : 36);
    var bubblePos = new Float32Array(Math.max(1, BUBBLES) * 3);
    var bubbleSeed = [];
    var bubbles = null;
    if (BUBBLES > 0) {
        for (var b = 0; b < BUBBLES; b++) {
            var fromHub = b % 2 === 0;
            bubbleSeed.push({
                x: fromHub ? HUB.x + (rnd() - 0.5) * 1.4 : -4 + (rnd() - 0.5) * 1.4,
                z: fromHub ? HUB.z + (rnd() - 0.5) * 1.4 : -4 + (rnd() - 0.5) * 1.4,
                y: 3 + rnd() * 10, sp: 0.8 + rnd() * 1.0
            });
        }
        var bGeo = G(new THREE.BufferGeometry());
        bGeo.setAttribute('position', new THREE.BufferAttribute(bubblePos, 3));
        bubbles = new THREE.Points(bGeo, M(new THREE.PointsMaterial({
            color: 0xd8f7ff, size: 0.16, transparent: true, opacity: 0.7, depthWrite: false, sizeAttenuation: true
        })));
        scene.add(bubbles);
    }

    // ---------- label & HUD (DOM, di atas kanvas) ----------
    var podNames = opts.podNames || ['Pod A', 'Pod B'];
    var labelEls = pods.map(function (p, i) {
        var el = document.createElement('div');
        el.className = 'srv-pod-label';
        el.style.cssText = 'position:absolute;left:0;top:0;transform:translate(-50%,-100%);pointer-events:none;' +
            'white-space:nowrap;padding:3px 9px;border-radius:999px;font-size:11.5px;font-weight:700;letter-spacing:.02em;' +
            'color:#e6fbff;background:rgba(2,15,28,.72);border:1px solid rgba(127,240,255,.45);';
        container.appendChild(el);
        return el;
    });
    var hudEl = document.createElement('div');
    hudEl.style.cssText = 'position:absolute;left:12px;top:12px;pointer-events:none;max-width:70%;padding:8px 11px;' +
        'border-radius:12px;background:rgba(2,15,28,.6);color:#d6f6ff;border:1px solid rgba(127,240,255,.25);' +
        'font-size:12px;line-height:1.45;';
    hudEl.innerHTML = '<div style="font-weight:800;font-size:13px;">' + esc(opts.title || 'Pusat Data Bawah Laut') + '</div>' +
        '<div style="opacity:.8;">' + esc(opts.subtitle || '') + '</div>';
    container.appendChild(hudEl);

    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    // ---------- kamera isometrik + geser/zoom ----------
    function applyCamera() {
        camera.left = -view * aspect; camera.right = view * aspect;
        camera.top = view; camera.bottom = -view;
        camera.updateProjectionMatrix();
        camera.position.copy(target).add(ISO);
        camera.lookAt(target);
    }
    function resize() {
        var w = container.clientWidth, h = container.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        aspect = w / h;
        applyCamera();
        draw(performance.now());
    }

    var clock = createDayClock();
    var night = 0;
    var disposed = false, raf = 0, last = 0, t0 = performance.now();
    var ptrs = {}, lastPinch = 0;
    var rightV = new THREE.Vector3(1, 0, -1).normalize();
    var upG = new THREE.Vector3(-1, 0, -1).normalize();
    var tmpV = new THREE.Vector3();

    function zoomBy(ratio) { view = clamp(view * ratio, VIEW_MIN, VIEW_MAX); applyCamera(); }
    function panBy(dx, dy) {
        var h = container.clientHeight || 1;
        var s = (2 * view) / h;
        target.addScaledVector(rightV, -dx * s);
        target.addScaledVector(upG, dy * s);
        target.x = clamp(target.x, -24, 24); target.z = clamp(target.z, -24, 24);
        applyCamera();
    }
    function onDown(e) {
        ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
        try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
        canvas.style.cursor = 'grabbing';
        lastPinch = 0;
    }
    function onMove(e) {
        var p = ptrs[e.pointerId];
        if (!p) return;
        var ids = Object.keys(ptrs);
        if (ids.length === 1) {
            panBy(e.clientX - p.x, e.clientY - p.y);
        } else if (ids.length >= 2) {
            var a = ptrs[ids[0]], b = ptrs[ids[1]];
            var d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
            if (lastPinch > 0) zoomBy(lastPinch / d);
            lastPinch = d;
        }
        p.x = e.clientX; p.y = e.clientY;
    }
    function onUp(e) {
        delete ptrs[e.pointerId];
        if (Object.keys(ptrs).length === 0) canvas.style.cursor = 'grab';
        lastPinch = 0;
    }
    function onWheel(e) { e.preventDefault(); zoomBy(e.deltaY > 0 ? 1.08 : 0.92); }
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // ---------- status & animasi ----------
    function readLoads(data) {
        var list = data && data.server && data.server.pods;
        return pods.map(function (p, i) {
            var v = list && list[i] && typeof list[i].util === 'number' ? list[i].util : p.util;
            return clamp(v, 0, 1.5);
        });
    }
    var loads = readLoads(null);
    var ledCol = new THREE.Color();     // dipakai ulang tiap frame (hindari alokasi)

    function animate(t, glow) {
        // hemisfer redup & cahaya lebih hangat pada malam; pod & LED lebih terang
        hemi.intensity = 1.0 - 0.45 * night;
        sun.intensity = 1.1 - 0.7 * night;
        shafts.forEach(function (sh, k) {
            sh.material.opacity = (0.075 - 0.05 * night) * (0.75 + 0.25 * Math.sin(t * 0.7 + k * 1.9));
        });
        matFiber.opacity = 0.55 + 0.35 * Math.sin(t * 2.2) * (loads[0] > 0.9 ? 1 : 0.5);
        matHubFan.opacity = 0.6 + 0.35 * Math.sin(t * 1.6);
        matGlass.emissiveIntensity = 0.3 + 0.5 * night;

        pods.forEach(function (p, pi) {
            var u = loads[pi];
            var speed = 2 + 5 * Math.min(1.5, u);
            for (var k = 0; k < p.leds.count; k++) {
                var b = 0.55 + 0.45 * Math.sin(t * speed + k * 0.9 + p.phase);
                if (u > 0.9) b = (Math.sin(t * 9 + k) > 0.2) ? 1 : 0.15;   // beban kritis: berkedip tajam
                ledCol.setHex(statusHex(u)).multiplyScalar(b * glow);
                p.leds.setColorAt(k, ledCol);
            }
            if (p.leds.instanceColor) p.leds.instanceColor.needsUpdate = true;
            p.lamp.material.color.setHex(statusHex(u));
        });
        if (fishMesh) {
            fishData.forEach(function (f, k) {
                var a = f.a + t * f.sp;
                dummy.position.set(HUB.x * 0.4 + Math.cos(a) * f.r, f.y, Math.sin(a) * f.r);
                dummy.rotation.set(0, -a + (f.sp > 0 ? Math.PI / 2 : -Math.PI / 2), 0);
                dummy.scale.set(1.6, 0.7, 0.7);
                dummy.updateMatrix();
                fishMesh.setMatrixAt(k, dummy.matrix);
            });
            fishMesh.instanceMatrix.needsUpdate = true;
        }
        if (bubbles) {
            for (var b = 0; b < bubbleSeed.length; b++) {
                var bs = bubbleSeed[b];
                var y = (bs.y + t * bs.sp) % 16;
                bubblePos[b * 3] = bs.x + Math.sin(t + b) * 0.12;
                bubblePos[b * 3 + 1] = 0.6 + y;
                bubblePos[b * 3 + 2] = bs.z;
            }
            bubbles.geometry.attributes.position.needsUpdate = true;
        }
    }

    function updateLabels() {
        var w = container.clientWidth, h = container.clientHeight;
        pods.forEach(function (p, i) {
            tmpV.set(PODS[i].x, HULL_Y + HULL_R + 0.8, PODS[i].z).project(camera);
            var sx = (tmpV.x + 1) / 2 * w, sy = (1 - tmpV.y) / 2 * h;
            var el = labelEls[i];
            el.style.transform = 'translate(' + Math.round(sx) + 'px,' + Math.round(sy) + 'px) translate(-50%,-100%)';
            var pct = Math.round(loads[i] * 100);
            el.textContent = (podNames[i] || ('Pod ' + (i + 1))) + ' · ' + pct + '%';
            el.style.borderColor = '#' + ('000000' + statusHex(loads[i]).toString(16)).slice(-6);
        });
    }

    // Satu gambar: animasi + render + label. Dipakai loop dan saat ukuran berubah.
    function draw(now) {
        if (disposed) return;
        last = now;
        var t = reduce ? 0 : (now - t0) / 1000;
        night = nightAmount(clock.hour());
        animate(t, 0.85 + 0.3 * night);
        renderer.render(scene, camera);
        updateLabels();
    }
    // Loop ~30 fps; berhenti saat tab tersembunyi (hemat baterai), lanjut saat kembali terlihat.
    function loop(now) {
        raf = 0;
        if (disposed) return;
        if (!document.hidden) raf = requestAnimationFrame(loop);
        if (now - last < FRAME_MS) return;
        draw(now);
    }
    function start() { if (!raf && !disposed && !document.hidden) raf = requestAnimationFrame(loop); }
    function onVis() { start(); }
    document.addEventListener('visibilitychange', onVis);

    var ro = null;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(resize); ro.observe(container); }
    applyCamera();
    resize();
    start();

    return {
        update: function (data) {
            if (disposed) return;
            loads = readLoads(data);
        },
        isDisposed: function () { return disposed; },
        dispose: function () {
            if (disposed) return;
            disposed = true;
            if (raf) cancelAnimationFrame(raf);
            raf = 0;
            if (ro) ro.disconnect();
            document.removeEventListener('visibilitychange', onVis);
            canvas.removeEventListener('pointerdown', onDown);
            canvas.removeEventListener('pointermove', onMove);
            canvas.removeEventListener('pointerup', onUp);
            canvas.removeEventListener('pointercancel', onUp);
            canvas.removeEventListener('wheel', onWheel);
            geos.forEach(function (g) { g.dispose(); });
            mats.forEach(function (m) { m.dispose(); });
            pods.forEach(function (p) { p.racks.dispose && p.racks.dispose(); p.leds.dispose && p.leds.dispose(); });
            rockMesh.dispose(); coralMesh.dispose();
            if (fishMesh) fishMesh.dispose();
            renderer.dispose();
            try { renderer.forceContextLoss(); } catch (e) {}
            labelEls.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
            if (hudEl.parentNode) hudEl.parentNode.removeChild(hudEl);
            if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        }
    };
}
