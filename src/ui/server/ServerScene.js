// FILE: src/ui/server/ServerScene.js  (v2027.74 — Peta Server 3D: visual lebih realistis & canggih)
// Pusat data bawah laut. Perubahan utama dari v2027.73:
//  - Kabut dikalibrasi ulang untuk kamera ortografik (sebelumnya ~96% menutup pusat peta, jadi pod tampak pucat).
//  - Dasar laut bertekstur riak pasir + kaustik cahaya yang bergerak; bayangan dinamis (medium/high); env map PMREM
//    untuk pantulan baja & kaca; sinar cahaya dari permukaan bertekstur lembut.
//  - Pod: pelana penyangga, hatch kubah, jendela ujung, rak bertekstur unit server, strip lantai berwarna beban,
//    lampu langit-langit, lampu titik interior (high). Pipa daya & pendingin ke hub, kipas berbilah, cerobong generator.
//  - Hidup: kelp bergoyang, karang & batu variatif, kawanan ikan berekor, ubur-ubur bercahaya, drone ROV berlampu,
//    salju laut, denyut data di kabel serat & konduit. Gelembung/partikel kini terlihat (ukuran piksel, bukan satuan dunia).
//  - Lahan terkunci tampil sebagai lokasi konstruksi (pagar perancah, tiang, derek yang berputar, lampu kedip).
//  - Interaksi: ketuk pod untuk fokus kamera + kartu status; ketuk ruang kosong untuk batal.
//  - Tier low tetap ringan: tanpa bayangan/env/kelp/partikel/ROV; tier mengikuti detectQuality().
//
// API tetap: createServerScene(THREE, container, opts) -> { update(state), dispose(), isDisposed(), select(i) }
// opts: { quality?, aria, title, subtitle, podNames:[..], statusNames:[normal,sibuk,kritis], hint?, onSelect?(i) }
import { detectQuality } from '../campus/CampusLook.js';
import { createDayClock, nightAmount } from '../campus/DayCycle.js';

var DEEP = 0x06304a, DEEP_NIGHT = 0x02121f;
var VIEW_DEFAULT = 10, VIEW_MIN = 5, VIEW_MAX = 18;
var FRAME_MS = 33;               // ~30 fps
var MAX_DPR = 1.75;
var PODS = [ { x: -4, z: -4, util: 0.42 }, { x: -4, z: 4, util: 0.78 } ];
var HUB = { x: 6.5, z: 0 };
var LOCKED = [ { x: -12, z: -6 }, { x: -12, z: 6 } ];
var HULL_Y = 2.5, HULL_R = 2.2;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function statusIdx(u) { return u < 0.7 ? 0 : (u < 0.9 ? 1 : 2); }
function statusHex(u) { return [0x43e08a, 0xffc247, 0xff4d4d][statusIdx(u)]; }

function seabedY(x, z) {
    var r = Math.sqrt(x * x + z * z);
    var k = clamp((r - 12) / 10, 0, 1);
    var h = Math.sin(x * 0.23 + 1.3) * Math.cos(z * 0.19) * 0.9 +
        Math.sin((x + z) * 0.41) * 0.35 + Math.sin(x * 0.07 - z * 0.11) * 1.2;
    return -0.3 + h * k;
}
function seeded(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

var CAUSTIC = [
    'float caustic(vec2 p,float t){',
    ' vec2 q=p+vec2(sin(p.y*1.7+t*0.6),cos(p.x*1.3+t*0.5))*0.35;',
    ' float a=sin(q.x*3.1+t)*sin(q.y*2.7-t*0.8);',
    ' float b=sin((q.x+q.y)*2.3+t*0.7);',
    ' return pow(1.0-clamp(abs(a+b*0.6),0.0,1.0),6.0);',
    '}'
].join('\n');

export function createServerScene(THREE, container, opts) {
    opts = opts || {};
    var PERF = window.__PERF || {};
    var look = opts.quality || detectQuality(PERF);
    var low = look.tier === 'low', medium = look.tier === 'medium', high = !low && !medium;
    var reduce = false;
    try { reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}

    var renderer = new THREE.WebGLRenderer({ antialias: !low && PERF.antialias !== false, alpha: false, powerPreference: 'high-performance' });
    var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR, look.maxDpr);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    var useShadow = !!look.shadows && !low;
    if (useShadow) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = high ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    }
    var canvas = renderer.domElement;
    canvas.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;cursor:grab;';
    canvas.setAttribute('role', 'img');
    if (opts.aria) canvas.setAttribute('aria-label', opts.aria);
    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.isolation = 'isolate';
    container.style.overflow = 'hidden';
    container.style.background = '#06304a';
    container.appendChild(canvas);

    var scene = new THREE.Scene();
    var cDay = new THREE.Color(DEEP), cNight = new THREE.Color(DEEP_NIGHT);
    renderer.setClearColor(DEEP, 1);
    // Fog linear: kamera ortografik berjarak ~60 dari pusat; fog lama (Exp2 0.03) menutup ~96% di pusat.
    scene.fog = new THREE.Fog(DEEP, low ? 44 : 50, low ? 100 : 118);
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
    var target = new THREE.Vector3(0, 0, 0);
    var ISO = new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(60);
    var view = VIEW_DEFAULT, aspect = 1;

    // ---------- pencatatan resource (di-dispose bersama) ----------
    var geos = [], mats = [], texs = [], extraMeshes = [];
    function G(g) { geos.push(g); return g; }
    function M(m) { mats.push(m); return m; }
    function T(t) { texs.push(t); return t; }
    var U = { uTime: { value: 0 }, uNight: { value: 0 } };

    function canvasTex(w, h, draw, srgb) {
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        draw(c.getContext('2d'), w, h);
        var t = new THREE.CanvasTexture(c);
        if (srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
        return T(t);
    }
    function patchShader(mat, key, vHead, vBody, fHead, fBody) {
        mat.customProgramCacheKey = function () { return key; };
        mat.onBeforeCompile = function (sh) {
            sh.uniforms.uTime = U.uTime; sh.uniforms.uNight = U.uNight;
            sh.vertexShader = sh.vertexShader
                .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uNight;\n' + (vHead || ''))
                .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + (vBody || ''));
            if (fBody) {
                sh.fragmentShader = sh.fragmentShader
                    .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uNight;\n' + (fHead || ''))
                    .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + fBody);
            }
        };
    }

    // ---------- tekstur prosedural (kecil, dibuat sekali) ----------
    var glowTex = canvasTex(64, 64, function (c, w, h) {
        var g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
    });
    var sandTex = canvasTex(low ? 64 : 256, low ? 64 : 256, function (c, w, h) {
        var img = c.createImageData(w, h), r = seeded(7);
        for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
            var rip = Math.sin((x * 12 + Math.sin(y * 2 * Math.PI * 3 / h) * 9) * 2 * Math.PI / w) * 0.5 + 0.5;
            var v = 0.74 + rip * 0.16 + (r() - 0.5) * 0.1, k = (y * w + x) * 4;
            img.data[k] = img.data[k + 1] = img.data[k + 2] = clamp(v, 0, 1) * 255; img.data[k + 3] = 255;
        }
        c.putImageData(img, 0, 0);
    });
    sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping; sandTex.repeat.set(22, 22);
    var rackTex = canvasTex(64, 128, function (c, w, h) {
        c.fillStyle = '#1b2a3e'; c.fillRect(0, 0, w, h);
        for (var y = 3; y < h - 3; y += 9) {
            c.fillStyle = '#2c4260'; c.fillRect(4, y, w - 8, 7);
            c.fillStyle = '#0d1624'; c.fillRect(w - 18, y + 2, 11, 3);
        }
    });
    var rackGlow = canvasTex(64, 128, function (c, w, h) {
        c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
        var r = seeded(11);
        for (var y = 3; y < h - 3; y += 9) for (var x = 8; x < 30; x += 5) {
            if (r() < 0.7) { c.fillStyle = '#fff'; c.fillRect(x, y + 2, 2, 3); }
        }
    });
    var shaftTex = canvasTex(64, 256, function (c, w, h) {
        var gx = c.createLinearGradient(0, 0, w, 0);
        gx.addColorStop(0, 'rgba(255,255,255,0)'); gx.addColorStop(0.5, 'rgba(255,255,255,1)'); gx.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = gx; c.fillRect(0, 0, w, h);
        c.globalCompositeOperation = 'destination-in';
        var gy = c.createLinearGradient(0, 0, 0, h);
        gy.addColorStop(0, 'rgba(255,255,255,1)'); gy.addColorStop(0.7, 'rgba(255,255,255,.35)'); gy.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = gy; c.fillRect(0, 0, w, h);
    });
    var hazardTex = canvasTex(64, 16, function (c, w, h) {
        c.fillStyle = '#1b1b1b'; c.fillRect(0, 0, w, h); c.fillStyle = '#f2b51c';
        for (var x = -h; x < w + h; x += 16) { c.beginPath(); c.moveTo(x, h); c.lineTo(x + 8, h); c.lineTo(x + 8 + h, 0); c.lineTo(x + h, 0); c.fill(); }
    });
    hazardTex.wrapS = hazardTex.wrapT = THREE.RepeatWrapping; hazardTex.repeat.set(3, 1);

    // ---------- env map (pantulan baja & kaca) ----------
    var envRT = null;
    if (!low && look.env !== false) {
        try {
            var pm = new THREE.PMREMGenerator(renderer);
            var es = new THREE.Scene();
            var eg = new THREE.SphereGeometry(30, 16, 12), ep = eg.attributes.position, ec = new Float32Array(ep.count * 3);
            var top = new THREE.Color(0x8fe6ff), mid = new THREE.Color(0x1e7ca0), bot = new THREE.Color(0x03121f), cc = new THREE.Color();
            for (var ei = 0; ei < ep.count; ei++) {
                var ey = ep.getY(ei) / 30;
                if (ey >= 0) cc.copy(mid).lerp(top, Math.pow(ey, 1.6)); else cc.copy(mid).lerp(bot, Math.min(1, -ey * 1.8));
                ec[ei * 3] = cc.r; ec[ei * 3 + 1] = cc.g; ec[ei * 3 + 2] = cc.b;
            }
            eg.setAttribute('color', new THREE.BufferAttribute(ec, 3));
            var em = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
            es.add(new THREE.Mesh(eg, em));
            envRT = pm.fromScene(es, 0.04);
            eg.dispose(); em.dispose(); pm.dispose();
            scene.environment = envRT.texture;
        } catch (e) { envRT = null; }
    }

    // ---------- cahaya ----------
    var hemi = new THREE.HemisphereLight(0x7fd8ff, 0x08283d, envRT ? 0.6 : 1.0);
    scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xc4f1ff, 1.3);
    sun.position.set(-14, 42, 12);
    if (useShadow) {
        sun.castShadow = true;
        sun.shadow.mapSize.set(look.shadowMap || 1024, look.shadowMap || 1024);
        var sc = sun.shadow.camera; sc.left = -28; sc.right = 28; sc.top = 28; sc.bottom = -28; sc.near = 5; sc.far = 120;
        sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.05;
    }
    scene.add(sun);
    var fill = new THREE.DirectionalLight(0x2aa6c8, 0.28);
    fill.position.set(18, 10, -14);
    scene.add(fill);

    // ---------- material ----------
    function std(color, metal, rough, extra) {
        var o = { color: color, metalness: metal, roughness: rough };
        if (extra) for (var k in extra) o[k] = extra[k];
        return M(new THREE.MeshStandardMaterial(o));
    }
    var matSteel = std(0x6a7f96, 0.7, 0.34, { envMapIntensity: 1.0 });
    var matDark = std(0x23344a, 0.5, 0.55, { envMapIntensity: 0.6 });
    var matSlab = std(0x2b3f52, 0.2, 0.9, { envMapIntensity: 0.3 });
    var matCool = std(0x2f7d93, 0.6, 0.35, { emissive: 0x0a3a4a, envMapIntensity: 0.9 });
    var matGlass = M(new THREE.MeshStandardMaterial({
        color: 0x9fe6ff, metalness: 0.3, roughness: 0.05, transparent: true, opacity: 0.2, depthWrite: false,
        emissive: 0x1f6f8f, emissiveIntensity: 0.35, side: THREE.DoubleSide, envMapIntensity: 1.8
    }));
    var matLed = M(new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
    var matFiber = M(new THREE.MeshBasicMaterial({ color: 0x7ff0ff, transparent: true, opacity: 0.8, depthWrite: false }));
    var matCore = M(new THREE.MeshBasicMaterial({ color: 0x7ff0ff, transparent: true, opacity: 0.85 }));
    var matShaft = M(new THREE.MeshBasicMaterial({
        map: shaftTex, color: 0xaeeeff, transparent: true, opacity: 0.1, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false
    }));
    var matLock = M(new THREE.LineBasicMaterial({ color: 0x8fb3c7, transparent: true, opacity: 0.6 }));
    var matTrim = M(new THREE.LineBasicMaterial({ color: 0x4fd6ee, transparent: true, opacity: 0.55 }));
    var matSel = M(new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, fog: false }));
    var matRock = std(0x3d4f5c, 0, 1, { flatShading: true, envMapIntensity: 0.25 });
    var matCoral = std(0xffffff, 0, 0.75, { envMapIntensity: 0.3 });
    var matHubFan = M(new THREE.MeshBasicMaterial({ color: 0x7ff0ff, transparent: true, opacity: 0.9, depthWrite: false }));
    var matPower = M(new THREE.MeshBasicMaterial({ color: 0x43e08a, toneMapped: false }));
    var matGenStrip = M(new THREE.MeshBasicMaterial({ color: 0xffc247, toneMapped: false }));
    var matWindow = M(new THREE.MeshBasicMaterial({ color: 0xa8f3ff, toneMapped: false }));
    var matHazard = std(0xffffff, 0.1, 0.8, { map: hazardTex });
    var matCrane = std(0xf2b51c, 0.3, 0.6);

    function halo(color, size, x, y, z, op) {
        var s = new THREE.Sprite(M(new THREE.SpriteMaterial({
            map: glowTex, color: color, transparent: true, opacity: op == null ? 0.9 : op,
            blending: THREE.AdditiveBlending, depthWrite: false, fog: false
        })));
        s.scale.set(size, size, 1); s.position.set(x, y, z);
        scene.add(s); return s;
    }
    function pipe(x1, y1, z1, x2, y2, z2, r, mat) {
        var dx = x2 - x1, dy = y2 - y1, dz = z2 - z1, len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        var m = new THREE.Mesh(G(new THREE.CylinderGeometry(r, r, len, 10)), mat);
        m.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize());
        if (useShadow) m.castShadow = true;
        scene.add(m);
        var band = new THREE.Mesh(G(new THREE.CylinderGeometry(r * 1.35, r * 1.35, 0.28, 10)), matSteel);
        band.position.copy(m.position); band.quaternion.copy(m.quaternion); scene.add(band);
        return m;
    }

    // ---------- dasar laut ----------
    var segs = high ? 84 : (medium ? 60 : 40);
    var seabedGeo = G(new THREE.PlaneGeometry(96, 96, segs, segs));
    seabedGeo.rotateX(-Math.PI / 2);
    var sp = seabedGeo.attributes.position, colors = new Float32Array(sp.count * 3);
    var cA = new THREE.Color(0x244656), cB = new THREE.Color(0x5a8088), tmp = new THREE.Color();
    for (var i = 0; i < sp.count; i++) {
        var x = sp.getX(i), z = sp.getZ(i);
        sp.setY(i, seabedY(x, z));
        var n = 0.5 + 0.5 * Math.sin(x * 0.6 + z * 0.37) * Math.cos(z * 0.5 - x * 0.21);
        tmp.copy(cA).lerp(cB, n * 0.85);
        colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    seabedGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    seabedGeo.computeVertexNormals();
    var seabedMat = std(0xffffff, 0, 1, { vertexColors: true, map: sandTex, envMapIntensity: 0.2 });
    if (!low) {
        patchShader(seabedMat, 'srv-seabed', 'varying vec3 vWP;', 'vWP=(modelMatrix*vec4(transformed,1.0)).xyz;',
            'varying vec3 vWP;\n' + CAUSTIC,
            'float c_=caustic(vWP.xz*0.32,uTime)*(1.0-smoothstep(10.0,34.0,length(vWP.xz)))*(0.55-0.35*uNight);\n' +
            'totalEmissiveRadiance+=vec3(0.35,0.78,0.88)*c_;');
    }
    var seabed = new THREE.Mesh(seabedGeo, seabedMat);
    seabed.receiveShadow = useShadow;
    scene.add(seabed);

    var dummy = new THREE.Object3D();
    var rnd = seeded(42);

    // ---------- batu, karang, kelp (instanced) ----------
    var ROCKS = low ? 10 : (high ? 30 : 20), CORALS = low ? 8 : (high ? 22 : 14), DOMES = low ? 0 : (high ? 14 : 8);
    var rockGeo = G(new THREE.IcosahedronGeometry(0.9, low ? 0 : 1));
    var rp = rockGeo.attributes.position;
    for (var ri = 0; ri < rp.count; ri++) { var rk = 0.82 + 0.3 * rnd(); rp.setXYZ(ri, rp.getX(ri) * rk, rp.getY(ri) * rk, rp.getZ(ri) * rk); }
    var rockMesh = new THREE.InstancedMesh(rockGeo, matRock, ROCKS);
    var coralMesh = new THREE.InstancedMesh(G(new THREE.ConeGeometry(0.32, 1.3, 6)), matCoral, CORALS);
    var domeMesh = DOMES ? new THREE.InstancedMesh(G(new THREE.IcosahedronGeometry(0.5, 1)), matCoral, DOMES) : null;
    var CORAL_COL = [0x2fb8a6, 0xf472b6, 0xff9a52, 0xa78bfa];
    function scatter(mesh, count, kind) {
        for (var k = 0; k < count; k++) {
            var a = rnd() * Math.PI * 2, r = 12.5 + rnd() * 18;
            var x = Math.cos(a) * r, z = Math.sin(a) * r;
            var s = kind === 'rock' ? 0.6 + rnd() * 1.7 : 0.7 + rnd() * 1.1;
            dummy.position.set(x, seabedY(x, z) + (kind === 'rock' ? 0.15 * s : (kind === 'dome' ? 0.15 : 0.6 * s)), z);
            dummy.rotation.set(kind === 'coral' ? (rnd() - 0.5) * 0.4 : rnd() * 3, rnd() * 3, kind === 'coral' ? (rnd() - 0.5) * 0.4 : rnd() * 3);
            dummy.scale.set(s, kind === 'rock' ? s * 0.7 : (kind === 'dome' ? s * 0.6 : s), s);
            dummy.updateMatrix();
            mesh.setMatrixAt(k, dummy.matrix);
            if (kind !== 'rock') mesh.setColorAt(k, new THREE.Color(CORAL_COL[Math.floor(rnd() * 4)]));
        }
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        if (useShadow && kind === 'rock') mesh.castShadow = true;
        mesh.receiveShadow = useShadow;
        scene.add(mesh);
    }
    scatter(rockMesh, ROCKS, 'rock');
    scatter(coralMesh, CORALS, 'coral');
    if (domeMesh) scatter(domeMesh, DOMES, 'dome');

    var kelpMesh = null;
    if (!low) {
        var CLUSTERS = high ? 8 : 5, PER = high ? 7 : 5, KELP = CLUSTERS * PER;
        var kg = G(new THREE.PlaneGeometry(0.36, 2.6, 1, 6)); kg.translate(0, 1.3, 0);
        var kp = kg.attributes.position;
        for (var ki = 0; ki < kp.count; ki++) kp.setX(ki, kp.getX(ki) * (1 - kp.getY(ki) / 2.6 * 0.75));
        var kelpMat = std(0xffffff, 0, 0.8, { side: THREE.DoubleSide, envMapIntensity: 0.2 });
        patchShader(kelpMat, 'srv-kelp', '',
            'float hh_=clamp(position.y,0.0,3.0);float ph_=instanceMatrix[3].x*0.6+instanceMatrix[3].z*0.4;\n' +
            'transformed.x+=sin(uTime*1.2+ph_+hh_*0.9)*0.08*hh_;transformed.z+=cos(uTime*0.9+ph_*1.3+hh_*0.7)*0.06*hh_;');
        kelpMesh = new THREE.InstancedMesh(kg, kelpMat, KELP);
        var kc = new THREE.Color(), ki2 = 0;
        for (var cl = 0; cl < CLUSTERS; cl++) {
            var ca = rnd() * Math.PI * 2, cr = 13 + rnd() * 12, cx = Math.cos(ca) * cr, cz = Math.sin(ca) * cr;
            for (var q = 0; q < PER; q++) {
                var kx = cx + (rnd() - 0.5) * 2.4, kz = cz + (rnd() - 0.5) * 2.4, ks = 0.7 + rnd() * 0.9;
                dummy.position.set(kx, seabedY(kx, kz) - 0.05, kz); dummy.rotation.set(0, rnd() * 6.28, 0); dummy.scale.set(1, ks, 1);
                dummy.updateMatrix(); kelpMesh.setMatrixAt(ki2, dummy.matrix);
                kc.setHSL(0.36 + rnd() * 0.1, 0.55, 0.22 + rnd() * 0.12); kelpMesh.setColorAt(ki2, kc); ki2++;
            }
        }
        kelpMesh.frustumCulled = false;
        scene.add(kelpMesh);
    }

    // ---------- pod tekanan ----------
    var pickables = [];
    var pods = PODS.map(function (p, idx) { return buildPod(p, idx); });

    function buildPod(p, idx) {
        var group = new THREE.Group();
        group.position.set(p.x, 0, p.z);
        scene.add(group);
        function add(geo, mat, x, y, z, cast) {
            var m = new THREE.Mesh(G(geo), mat); m.position.set(x, y, z);
            if (cast && useShadow) m.castShadow = true;
            group.add(m); return m;
        }
        var slab = add(new THREE.BoxGeometry(9.6, 0.6, 6.8), matSlab, 0, 0, 0, true);
        slab.receiveShadow = useShadow; slab.userData.pod = idx; pickables.push(slab);
        var trim = new THREE.LineSegments(G(new THREE.EdgesGeometry(new THREE.BoxGeometry(9.6, 0.6, 6.8))), matTrim);
        group.add(trim);
        add(new THREE.BoxGeometry(7.2, 0.1, 3.8), matDark, 0, 0.35, 0);

        // pelana penyangga di bawah tiap rusuk
        [-2.8, 0, 2.8].forEach(function (rx) { add(new THREE.BoxGeometry(0.5, 0.55, 3.0), matDark, rx, 0.5, 0, true); });

        var hull = add(new THREE.CylinderGeometry(HULL_R, HULL_R, 8, low ? 16 : 36, 1, true), matGlass, 0, HULL_Y, 0);
        hull.rotation.z = Math.PI / 2; hull.renderOrder = 2; hull.userData.pod = idx; pickables.push(hull);

        [-2.8, 0, 2.8].forEach(function (rx) {
            var rib = add(new THREE.TorusGeometry(HULL_R, 0.08, 6, low ? 16 : 36), matSteel, rx, HULL_Y, 0, true);
            rib.rotation.y = Math.PI / 2;
        });
        [-4, 4].forEach(function (ex) {
            var cap = add(new THREE.CylinderGeometry(HULL_R + 0.05, HULL_R + 0.05, 0.3, low ? 16 : 36), matSteel, ex, HULL_Y, 0, true);
            cap.rotation.z = Math.PI / 2;
        });
        // jendela bulat di ujung luar + flensa; cincin sambungan di ujung koridor
        var win = add(new THREE.CircleGeometry(0.7, 20), matWindow, -4.17, HULL_Y, 0); win.rotation.y = -Math.PI / 2;
        var wr = add(new THREE.TorusGeometry(0.74, 0.07, 6, 20), matSteel, -4.18, HULL_Y, 0); wr.rotation.y = Math.PI / 2;
        var jr = add(new THREE.TorusGeometry(0.95, 0.1, 8, 20), matSteel, 4.2, HULL_Y, 0); jr.rotation.y = Math.PI / 2;
        // hatch kubah di atas
        add(new THREE.SphereGeometry(0.55, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), matSteel, 1.6, HULL_Y + HULL_R - 0.05, 0, true);
        var hr = add(new THREE.TorusGeometry(0.56, 0.07, 6, 16), matDark, 1.6, HULL_Y + HULL_R - 0.05, 0); hr.rotation.x = Math.PI / 2;

        // rak komputasi: 5 kolom x 2 baris = 10 rak, tekstur unit server + emisif per pod
        var rackMat = M(new THREE.MeshStandardMaterial({
            color: 0xffffff, map: rackTex, emissive: 0x43e08a, emissiveMap: rackGlow, emissiveIntensity: 0.8,
            metalness: 0.5, roughness: 0.55, envMapIntensity: 0.6
        }));
        var rackSlots = [];
        [-2.8, -1.4, 0, 1.4, 2.8].forEach(function (rx) { [-0.7, 0.7].forEach(function (rz) { rackSlots.push({ x: rx, z: rz }); }); });
        var racks = new THREE.InstancedMesh(G(new THREE.BoxGeometry(0.6, 1.5, 0.6)), rackMat, rackSlots.length);
        var leds = new THREE.InstancedMesh(G(new THREE.BoxGeometry(0.5, 0.04, 0.3)), matLed, rackSlots.length);
        rackSlots.forEach(function (s, k) {
            dummy.position.set(s.x, 1.2, s.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1);
            dummy.updateMatrix(); racks.setMatrixAt(k, dummy.matrix);
            dummy.position.set(s.x, 1.97, s.z); dummy.updateMatrix(); leds.setMatrixAt(k, dummy.matrix);
            leds.setColorAt(k, new THREE.Color(0x43e08a));
        });
        racks.instanceMatrix.needsUpdate = true; leds.instanceMatrix.needsUpdate = true;
        if (leds.instanceColor) leds.instanceColor.needsUpdate = true;
        racks.frustumCulled = false; leds.frustumCulled = false;
        group.add(racks); group.add(leds);

        // strip lantai berwarna beban, baki kabel, lampu langit-langit
        var stripMat = M(new THREE.MeshBasicMaterial({ color: 0x43e08a, toneMapped: false }));
        [-1.55, 1.55].forEach(function (sz) { add(new THREE.BoxGeometry(7, 0.03, 0.08), stripMat, 0, 0.42, sz); });
        add(new THREE.BoxGeometry(6.4, 0.08, 0.3), matDark, 0, HULL_Y + 0.7, 0);
        add(new THREE.BoxGeometry(6, 0.04, 0.14), matWindow, 0, HULL_Y + 1.75, 0);

        var lamp = add(new THREE.SphereGeometry(0.3, 12, 8), M(new THREE.MeshBasicMaterial({ color: 0x43e08a, toneMapped: false })), 4.35, HULL_Y + 1.4, 0);
        var lampHalo = halo(0x43e08a, 2.4, p.x + 4.35, HULL_Y + 1.4, p.z, 0.55);

        var inner = null;
        if (high) { inner = new THREE.PointLight(0x43e08a, 6, 7, 1.6); inner.position.set(0, HULL_Y + 0.9, 0); group.add(inner); }

        // bingkai seleksi (muncul saat pod diketuk)
        var sel = new THREE.LineSegments(G(new THREE.EdgesGeometry(new THREE.BoxGeometry(10.2, 0.2, 7.4))), matSel);
        sel.position.y = 0.05; sel.visible = false; group.add(sel);

        return { group: group, racks: racks, leds: leds, lamp: lamp, lampHalo: lampHalo, rackMat: rackMat, stripMat: stripMat, inner: inner, sel: sel, util: p.util, idx: idx, phase: idx * 1.7 };
    }

    // koridor penghubung antar ujung pod + inti cahaya
    var corridor = new THREE.Mesh(G(new THREE.CylinderGeometry(0.9, 0.9, 8, low ? 12 : 24, 1, true)), matGlass);
    corridor.rotation.x = Math.PI / 2; corridor.position.set(0, HULL_Y, 0); corridor.renderOrder = 2;
    scene.add(corridor);
    var core = new THREE.Mesh(G(new THREE.CylinderGeometry(0.22, 0.22, 8, 8)), matCore);
    core.rotation.x = Math.PI / 2; core.position.set(0, HULL_Y, 0);
    scene.add(core);

    // hub pendingin & daya
    var cooler = new THREE.Mesh(G(new THREE.CylinderGeometry(2, 2, 3, low ? 14 : 28)), matSteel);
    cooler.position.set(HUB.x, 1.8, HUB.z); if (useShadow) cooler.castShadow = true; scene.add(cooler);
    [0.7, 1.3, 1.9, 2.5, 3.1].forEach(function (fy) {
        var fin = new THREE.Mesh(G(new THREE.TorusGeometry(2.04, 0.05, 6, low ? 14 : 28)), matDark);
        fin.rotation.x = Math.PI / 2; fin.position.set(HUB.x, fy, HUB.z); scene.add(fin);
    });
    var fan = new THREE.Mesh(G(new THREE.TorusGeometry(1.5, 0.12, 6, low ? 14 : 28)), matHubFan);
    fan.rotation.x = Math.PI / 2; fan.position.set(HUB.x, 3.35, HUB.z); scene.add(fan);
    var fanBlades = new THREE.Group(); fanBlades.position.set(HUB.x, 3.42, HUB.z); scene.add(fanBlades);
    var bladeGeo = G(new THREE.BoxGeometry(1.35, 0.04, 0.22));
    for (var bi = 0; bi < 6; bi++) {
        var bl = new THREE.Mesh(bladeGeo, matDark); bl.rotation.y = bi * Math.PI / 3; bl.position.set(Math.cos(bi * Math.PI / 3) * 0.7, 0, -Math.sin(bi * Math.PI / 3) * 0.7);
        bl.rotation.z = 0.25; fanBlades.add(bl);
    }
    var ups = new THREE.Mesh(G(new THREE.BoxGeometry(2.4, 1.8, 2.2)), matDark);
    ups.position.set(HUB.x, 1.2, HUB.z - 3.5); if (useShadow) ups.castShadow = true; scene.add(ups);
    var upsLed = new THREE.Mesh(G(new THREE.BoxGeometry(2.0, 0.12, 0.12)), matPower);
    upsLed.position.set(HUB.x, 2.15, HUB.z - 3.5 + 1.15); scene.add(upsLed);
    var gen = new THREE.Mesh(G(new THREE.BoxGeometry(2.6, 1.6, 2)), matDark);
    gen.position.set(HUB.x, 1.1, HUB.z + 3.5); if (useShadow) gen.castShadow = true; scene.add(gen);
    var genLed = new THREE.Mesh(G(new THREE.BoxGeometry(2.2, 0.12, 0.12)), matGenStrip);
    genLed.position.set(HUB.x, 1.95, HUB.z + 3.5 + 1.05); scene.add(genLed);
    var stack = new THREE.Mesh(G(new THREE.CylinderGeometry(0.22, 0.26, 1.5, 10)), matSteel);
    stack.position.set(HUB.x + 0.8, 2.6, HUB.z + 3.5); scene.add(stack);

    // pipa: daya ke UPS & generator, pendingin ke koridor
    pipe(0.8, 0, -4, 5.3, 0, -4, 0.22, matCool);
    pipe(0.8, 0, 4, 5.2, 0, 4, 0.22, matCool);
    pipe(4.5, HULL_Y, 0, 0.9, HULL_Y, 0, 0.28, matCool);

    // kabel serat dari tiap pod naik ke permukaan
    [-4, 4].forEach(function (fz) {
        var f = new THREE.Mesh(G(new THREE.CylinderGeometry(0.07, 0.07, 35, 8)), matFiber);
        f.position.set(-4, 4.7 + 17.5, fz); scene.add(f);
    });
    halo(0x9fe9ff, 4, -4, 18, -4, 0.35); halo(0x9fe9ff, 4, -4, 18, 4, 0.35);

    // ---------- lahan terkunci = lokasi konstruksi ----------
    var cranes = [], beacons = [];
    var padGeo = G(new THREE.BoxGeometry(4.8, 0.16, 4.8)), cageGeo = G(new THREE.EdgesGeometry(new THREE.BoxGeometry(4.6, 2.4, 4.6)));
    var poleGeo = G(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6)), borderLong = G(new THREE.BoxGeometry(4.8, 0.1, 0.22));
    var mastGeo = G(new THREE.BoxGeometry(0.2, 3.6, 0.2)), jibGeo = G(new THREE.BoxGeometry(3, 0.14, 0.14)), crateGeo = G(new THREE.BoxGeometry(0.9, 0.7, 0.9));
    LOCKED.forEach(function (lk, li) {
        var g = new THREE.Group(), by = seabedY(lk.x, lk.z) + 0.08;
        g.position.set(lk.x, by, lk.z); scene.add(g);
        function part(geo, mat, x, y, z) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; }
        var pad = part(padGeo, matSlab, 0, 0, 0); pad.receiveShadow = useShadow;
        [[0, 2.4], [0, -2.4]].forEach(function (b) { part(borderLong, matHazard, b[0], 0.1, b[1]); });
        [[2.4, 0], [-2.4, 0]].forEach(function (b) { var m = part(borderLong, matHazard, b[0], 0.1, b[1]); m.rotation.y = Math.PI / 2; });
        [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]].forEach(function (c) { part(poleGeo, matSteel, c[0], 1.28, c[1]); });
        var cage = new THREE.LineSegments(cageGeo, matLock); cage.position.y = 1.28; g.add(cage);
        part(crateGeo, matDark, -1.2, 0.43, 1.2); part(crateGeo, matDark, -0.2, 0.43, 1.6).rotation.y = 0.5;
        part(mastGeo, matCrane, 1.2, 1.96, -1.2);
        var jib = new THREE.Group(); jib.position.set(1.2, 3.7, -1.2); g.add(jib);
        var jm = new THREE.Mesh(jibGeo, matCrane); jm.position.x = 0.9; jib.add(jm);
        var cw = new THREE.Mesh(crateGeo, matDark); cw.scale.set(0.5, 0.5, 0.5); cw.position.x = -0.9; jib.add(cw);
        cranes.push({ jib: jib, k: li });
        beacons.push({ s: halo(0xffb02e, 1.6, lk.x + 1.2, by + 3.9, lk.z - 1.2, 0.8), k: li });
        if (useShadow) g.children.forEach(function (c) { if (c.isMesh) c.castShadow = true; });
    });

    // ---------- kehidupan: ikan, ubur-ubur, ROV ----------
    var FISH = low ? 0 : (medium ? 10 : 22), fishMesh = null, fishData = [];
    if (FISH > 0) {
        var fg = G(new THREE.SphereGeometry(0.3, 10, 8)); fg.scale(1.7, 0.75, 0.45);
        var fishMat = std(0xffffff, 0.1, 0.5, { envMapIntensity: 0.6 });
        patchShader(fishMat, 'srv-fish', '',
            'float tl_=clamp(-position.x*2.2,0.0,1.0);\ntransformed.z+=sin(uTime*9.0+instanceMatrix[3].x*3.0+instanceMatrix[3].z)*0.16*tl_*tl_;');
        fishMesh = new THREE.InstancedMesh(fg, fishMat, FISH);
        var schools = 3;
        for (var f = 0; f < FISH; f++) {
            var sid = f % schools;
            fishData.push({ r: 13 + sid * 3.2 + rnd() * 1.4, a: sid * 2.1 + rnd() * 0.5, sp: (sid % 2 ? -1 : 1) * (0.05 + sid * 0.012), y: 3.5 + sid * 1.4 + rnd() * 1.2, s: 0.8 + rnd() * 0.5 });
            fishMesh.setColorAt(f, new THREE.Color([0xffb347, 0x7fd6ff, 0xe8f4ff][sid]));
        }
        if (fishMesh.instanceColor) fishMesh.instanceColor.needsUpdate = true;
        fishMesh.frustumCulled = false;
        scene.add(fishMesh);
    }
    var JELLY = low ? 0 : (high ? 3 : 2), jellies = [];
    if (JELLY) {
        var jg = G(new THREE.SphereGeometry(0.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2));
        var jm2 = M(new THREE.MeshBasicMaterial({ color: 0xff8be0, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
        for (var j = 0; j < JELLY; j++) {
            var jb = new THREE.Mesh(jg, jm2); scene.add(jb);
            jellies.push({ m: jb, h: halo(0xff8be0, 2.0, 0, 0, 0, 0.35), x: -14 + j * 11, z: 10 - j * 9, y: 5 + j, ph: j * 2.1 });
        }
    }
    var rov = null;
    if (!low) {
        rov = new THREE.Group();
        var rb = new THREE.Mesh(G(new THREE.BoxGeometry(0.8, 0.32, 0.55)), std(0xff9f1c, 0.3, 0.5)); rov.add(rb);
        [-0.32, 0.32].forEach(function (tz) { var th = new THREE.Mesh(G(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8)), matDark); th.rotation.x = Math.PI / 2; th.position.set(-0.2, 0, tz); rov.add(th); });
        var cone = new THREE.Mesh(G(new THREE.ConeGeometry(0.8, 2.4, 12, 1, true)), M(new THREE.MeshBasicMaterial({ color: 0xcff6ff, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })));
        cone.rotation.z = Math.PI / 2; cone.position.x = 1.5; rov.add(cone);
        rov.add(halo(0xcff6ff, 1.2, 0.5, 0, 0, 0.9));
        scene.add(rov);
    }

    // cahaya dari permukaan
    var SHAFTS = low ? 2 : (high ? 5 : 3), shafts = [];
    for (var s = 0; s < SHAFTS; s++) {
        var sh = new THREE.Mesh(G(new THREE.PlaneGeometry(4.4, 48)), matShaft);
        sh.position.set(-14 + s * 8, 17, -8 + (s % 2) * 8);
        sh.rotation.set(0, Math.PI / 4, -0.22); sh.renderOrder = 1;
        scene.add(sh); shafts.push(sh);
    }

    // ---------- partikel: gelembung, salju laut, denyut data (ukuran PIKSEL) ----------
    function mkPoints(n, px, color, vcolors) {
        var arr = new Float32Array(Math.max(1, n) * 3), geo = G(new THREE.BufferGeometry());
        geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
        var carr = null;
        if (vcolors) { carr = new Float32Array(Math.max(1, n) * 3); geo.setAttribute('color', new THREE.BufferAttribute(carr, 3)); }
        var mt = M(new THREE.PointsMaterial({
            map: glowTex, color: color || 0xffffff, size: px * dpr, sizeAttenuation: false, transparent: true, opacity: 0.85,
            depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: !!vcolors, fog: false
        }));
        var pt = new THREE.Points(geo, mt); pt.frustumCulled = false; scene.add(pt);
        return { pts: pt, arr: arr, carr: carr, mat: mt, base: px * dpr };
    }
    var BUBBLES = low ? 0 : (medium ? 18 : 40), bubbleSeed = [], bub = null;
    if (BUBBLES) {
        bub = mkPoints(BUBBLES, 7, 0xd8f7ff);
        for (var b = 0; b < BUBBLES; b++) {
            var fromHub = b % 2 === 0, pz = b % 4 < 2 ? -4 : 4;
            bubbleSeed.push({ x: fromHub ? HUB.x + (rnd() - 0.5) * 1.4 : -4 + (rnd() - 0.5) * 1.4, z: fromHub ? HUB.z + (rnd() - 0.5) * 1.4 : pz + (rnd() - 0.5) * 1.4, y: 3 + rnd() * 10, sp: 0.8 + rnd() * 1.0 });
        }
    }
    var SNOW = low ? 0 : (high ? 90 : 40), snow = null, snowSeed = [];
    if (SNOW) {
        snow = mkPoints(SNOW, 3.5, 0xbfe9f5); snow.mat.opacity = 0.5;
        for (var sn = 0; sn < SNOW; sn++) snowSeed.push({ x: (rnd() - 0.5) * 44, z: (rnd() - 0.5) * 44, y: rnd() * 18, sp: 0.15 + rnd() * 0.25 });
    }
    // rute denyut data: [dari], [ke], pod (-1 = netral), kecepatan (satuan/detik), offset agar tampak di atas pipa
    var ROUTES = [
        { a: [-4, 4.7, -4], b: [-4, 38, -4], pod: 0, sp: 9, o: [0.12, 0, 0.12] },
        { a: [-4, 4.7, 4], b: [-4, 38, 4], pod: 1, sp: 9, o: [0.12, 0, 0.12] },
        { a: [0, HULL_Y, -3.6], b: [0, HULL_Y, 3.6], pod: -1, sp: 3, o: [0, 0.3, 0] },
        { a: [0.8, 0, -4], b: [5.3, 0, -4], pod: 0, sp: 3, o: [0, 0.3, 0] },
        { a: [0.8, 0, 4], b: [5.2, 0, 4], pod: 1, sp: 3, o: [0, 0.3, 0] }
    ];
    var PER_ROUTE = low ? 0 : (high ? 6 : 3), pulses = null;
    if (PER_ROUTE) pulses = mkPoints(ROUTES.length * PER_ROUTE, 8, 0xffffff, true);

    // ---------- label, HUD, vinyet (DOM di atas kanvas) ----------
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    var podNames = opts.podNames || ['Pod A', 'Pod B'];
    var statusNames = opts.statusNames || ['Normal', 'Sibuk', 'Kritis'];
    var vig = document.createElement('div');
    vig.style.cssText = 'position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 42%,rgba(0,0,0,0) 52%,rgba(1,8,16,.55) 100%),linear-gradient(180deg,rgba(120,220,255,.10),rgba(0,0,0,0) 28%);';
    container.appendChild(vig);
    var labelEls = pods.map(function () {
        var el = document.createElement('div');
        el.style.cssText = 'position:absolute;left:0;top:0;transform:translate(-50%,-100%);pointer-events:none;' +
            'white-space:nowrap;padding:3px 10px;border-radius:999px;font-size:11.5px;font-weight:700;letter-spacing:.02em;' +
            'color:#e6fbff;background:rgba(2,15,28,.74);border:1px solid rgba(127,240,255,.45);backdrop-filter:blur(3px);';
        container.appendChild(el); return el;
    });
    var hudEl = document.createElement('div');
    hudEl.style.cssText = 'position:absolute;left:12px;top:12px;pointer-events:none;max-width:70%;padding:8px 11px;' +
        'border-radius:12px;background:rgba(2,15,28,.62);color:#d6f6ff;border:1px solid rgba(127,240,255,.25);font-size:12px;line-height:1.45;backdrop-filter:blur(4px);';
    hudEl.innerHTML = '<div style="font-weight:800;font-size:13px;">' + esc(opts.title || 'Pusat Data Bawah Laut') + '</div>' +
        '<div style="opacity:.8;">' + esc(opts.subtitle || '') + '</div>';
    container.appendChild(hudEl);
    var hintEl = null;
    if (opts.hint) {
        hintEl = document.createElement('div');
        hintEl.style.cssText = 'position:absolute;left:50%;bottom:10px;transform:translateX(-50%);pointer-events:none;padding:4px 11px;border-radius:999px;' +
            'font-size:11px;color:#bfeaf5;background:rgba(2,15,28,.55);border:1px solid rgba(127,240,255,.2);white-space:nowrap;';
        hintEl.textContent = opts.hint; container.appendChild(hintEl);
    }

    // ---------- kamera isometrik + geser/zoom + ketuk pod ----------
    function applyCamera() {
        camera.left = -view * aspect; camera.right = view * aspect; camera.top = view; camera.bottom = -view;
        camera.updateProjectionMatrix();
        camera.position.copy(target).add(ISO);
        camera.lookAt(target);
    }
    function resize() {
        var w = container.clientWidth, h = container.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        aspect = w / h; applyCamera(); draw(performance.now());
    }
    var clock = createDayClock(), night = 0;
    var disposed = false, raf = 0, last = 0, t0 = performance.now();
    var ptrs = {}, lastPinch = 0, tapStart = null, focus = null, selected = -1;
    var rightV = new THREE.Vector3(1, 0, -1).normalize(), upG = new THREE.Vector3(-1, 0, -1).normalize(), tmpV = new THREE.Vector3();
    var raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();

    function zoomBy(ratio) { view = clamp(view * ratio, VIEW_MIN, VIEW_MAX); applyCamera(); }
    function panBy(dx, dy) {
        var s = (2 * view) / (container.clientHeight || 1);
        target.addScaledVector(rightV, -dx * s); target.addScaledVector(upG, dy * s);
        target.x = clamp(target.x, -24, 24); target.z = clamp(target.z, -24, 24);
        applyCamera();
    }
    function select(i) {
        selected = i;
        focus = i >= 0 ? { x: PODS[i].x, y: 1.2, z: PODS[i].z, view: 9 } : null;
        if (typeof opts.onSelect === 'function') { try { opts.onSelect(i); } catch (e) {} }
    }
    function pick(e) {
        var r = canvas.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        var hit = raycaster.intersectObjects(pickables, false)[0];
        var idx = hit ? hit.object.userData.pod : -1;
        select(idx === selected ? -1 : idx);
    }
    function onDown(e) {
        ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
        try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
        canvas.style.cursor = 'grabbing'; lastPinch = 0;
        tapStart = Object.keys(ptrs).length === 1 ? { t: performance.now(), moved: 0 } : null;
    }
    function onMove(e) {
        var p = ptrs[e.pointerId]; if (!p) return;
        var ids = Object.keys(ptrs);
        if (ids.length === 1) {
            var dx = e.clientX - p.x, dy = e.clientY - p.y;
            if (tapStart) tapStart.moved += Math.abs(dx) + Math.abs(dy);
            if (tapStart && tapStart.moved > 6) focus = null;
            panBy(dx, dy);
        } else if (ids.length >= 2) {
            tapStart = null; focus = null;
            var a = ptrs[ids[0]], b2 = ptrs[ids[1]], d = Math.hypot(a.x - b2.x, a.y - b2.y) || 1;
            if (lastPinch > 0) zoomBy(lastPinch / d);
            lastPinch = d;
        }
        p.x = e.clientX; p.y = e.clientY;
    }
    function onUp(e) {
        if (tapStart && e.type === 'pointerup' && tapStart.moved < 8 && performance.now() - tapStart.t < 400) pick(e);
        tapStart = null;
        delete ptrs[e.pointerId];
        if (Object.keys(ptrs).length === 0) canvas.style.cursor = 'grab';
        lastPinch = 0;
    }
    function onWheel(e) { e.preventDefault(); focus = null; zoomBy(e.deltaY > 0 ? 1.08 : 0.92); }
    function onLost(e) { e.preventDefault(); }
    canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('webglcontextlost', onLost);

    // ---------- status & animasi ----------
    function readLoads(data) {
        var list = data && data.server && data.server.pods;
        return pods.map(function (p, i) {
            var v = list && list[i] && typeof list[i].util === 'number' ? list[i].util : p.util;
            return clamp(v, 0, 1.5);
        });
    }
    var loads = readLoads(null);
    var ledCol = new THREE.Color(), pulseCol = new THREE.Color(0x7ff0ff), lblCache = [];
    var zoomK = 1;

    function animate(t, glow) {
        U.uTime.value = t; U.uNight.value = night;
        hemi.intensity = (envRT ? 0.6 : 1.0) - 0.3 * night;
        sun.intensity = 1.3 - 0.85 * night;
        scene.fog.color.lerpColors(cDay, cNight, night);
        renderer.setClearColor(scene.fog.color, 1);
        shafts.forEach(function (sh, k) { sh.rotation.z = -0.22 + Math.sin(t * 0.15 + k) * 0.03; });
        matShaft.opacity = (0.11 - 0.07 * night) * (0.8 + 0.2 * Math.sin(t * 0.7));
        matFiber.opacity = 0.55 + 0.35 * Math.sin(t * 2.2) * (loads[0] > 0.9 ? 1 : 0.5);
        matHubFan.opacity = 0.6 + 0.35 * Math.sin(t * 1.6);
        matGlass.emissiveIntensity = 0.3 + 0.5 * night;
        matWindow.color.setScalar(0.85 + 0.15 * Math.sin(t * 1.3));

        var avg = (loads[0] + loads[1]) / 2;
        fanBlades.rotation.y = t * (2 + 6 * avg);
        gen.position.y = 1.1 + Math.sin(t * 38) * 0.004 * (0.4 + avg);
        upsLed.scale.x = 0.9 + 0.1 * Math.sin(t * 3);

        pods.forEach(function (p, pi) {
            var u = loads[pi], speed = 2 + 5 * Math.min(1.5, u), col = statusHex(u);
            for (var k = 0; k < p.leds.count; k++) {
                var b = 0.55 + 0.45 * Math.sin(t * speed + k * 0.9 + p.phase);
                if (u > 0.9) b = (Math.sin(t * 9 + k) > 0.2) ? 1 : 0.15;
                ledCol.setHex(col).multiplyScalar(b * glow);
                p.leds.setColorAt(k, ledCol);
            }
            if (p.leds.instanceColor) p.leds.instanceColor.needsUpdate = true;
            p.lamp.material.color.setHex(col);
            p.lampHalo.material.color.setHex(col);
            p.lampHalo.material.opacity = 0.4 + 0.3 * (0.5 + 0.5 * Math.sin(t * (u > 0.9 ? 8 : 2)));
            p.rackMat.emissive.setHex(col);
            p.rackMat.emissiveIntensity = (0.5 + 0.5 * Math.min(1, u)) * glow;
            p.stripMat.color.setHex(col);
            if (p.inner) { p.inner.color.setHex(col); p.inner.intensity = 4 + 4 * Math.min(1, u) + 2 * night; }
            p.sel.visible = selected === pi;
            if (p.sel.visible) matSel.opacity = 0.55 + 0.4 * Math.sin(t * 4);
        });

        cranes.forEach(function (c) { c.jib.rotation.y = Math.sin(t * 0.3 + c.k * 1.7) * 0.7; });
        beacons.forEach(function (bc) { bc.s.material.opacity = (Math.sin(t * 3 + bc.k) > 0.3) ? 0.9 : 0.15; });

        if (fishMesh) {
            fishData.forEach(function (f, k) {
                var a = f.a + t * f.sp, sg = f.sp > 0 ? 1 : -1;
                dummy.position.set(HUB.x * 0.4 + Math.cos(a) * f.r, f.y + Math.sin(t * 0.8 + k) * 0.25, Math.sin(a) * f.r);
                dummy.rotation.set(0, Math.atan2(-Math.cos(a) * sg, -Math.sin(a) * sg), 0);
                dummy.scale.set(f.s, f.s, f.s);
                dummy.updateMatrix(); fishMesh.setMatrixAt(k, dummy.matrix);
            });
            fishMesh.instanceMatrix.needsUpdate = true;
        }
        jellies.forEach(function (j, k) {
            var pu = 0.5 + 0.5 * Math.sin(t * 1.8 + j.ph);
            var jy = j.y + Math.sin(t * 0.5 + j.ph) * 1.2, jx = j.x + Math.sin(t * 0.12 + j.ph) * 2;
            j.m.position.set(jx, jy, j.z); j.m.scale.set(1 + 0.15 * pu, 1 - 0.25 * pu, 1 + 0.15 * pu);
            j.h.position.set(jx, jy - 0.1, j.z); j.h.material.opacity = 0.25 + 0.2 * (0.6 + night * 0.4) * pu;
        });
        if (rov) {
            var ra = t * 0.22, rx = -2 + Math.cos(ra) * 9.5, rz = Math.sin(ra) * 8.5;
            rov.position.set(rx, 3.4 + Math.sin(ra * 2.3) * 0.5, rz);
            rov.rotation.y = Math.atan2(Math.cos(ra) * 8.5, Math.sin(ra) * 9.5);
        }
        if (bub) {
            for (var b2 = 0; b2 < bubbleSeed.length; b2++) {
                var bs = bubbleSeed[b2], y = (bs.y + t * bs.sp) % 16;
                bub.arr[b2 * 3] = bs.x + Math.sin(t + b2) * 0.12; bub.arr[b2 * 3 + 1] = 0.6 + y; bub.arr[b2 * 3 + 2] = bs.z;
            }
            bub.pts.geometry.attributes.position.needsUpdate = true;
        }
        if (snow) {
            for (var s2 = 0; s2 < snowSeed.length; s2++) {
                var ss = snowSeed[s2], sy = 18 - ((ss.y + t * ss.sp * 3) % 18);
                snow.arr[s2 * 3] = ss.x + Math.sin(t * 0.3 + s2) * 0.4; snow.arr[s2 * 3 + 1] = sy; snow.arr[s2 * 3 + 2] = ss.z;
            }
            snow.pts.geometry.attributes.position.needsUpdate = true;
        }
        if (pulses) {
            var n = 0;
            ROUTES.forEach(function (rt) {
                var dx = rt.b[0] - rt.a[0], dy = rt.b[1] - rt.a[1], dz = rt.b[2] - rt.a[2];
                var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (rt.pod >= 0) pulseCol.setHex(statusHex(loads[rt.pod])); else pulseCol.setHex(0x7ff0ff);
                for (var k = 0; k < PER_ROUTE; k++) {
                    var u2 = ((t * rt.sp / len) + k / PER_ROUTE) % 1;
                    pulses.arr[n * 3] = rt.a[0] + dx * u2 + rt.o[0]; pulses.arr[n * 3 + 1] = rt.a[1] + dy * u2 + rt.o[1]; pulses.arr[n * 3 + 2] = rt.a[2] + dz * u2 + rt.o[2];
                    pulses.carr[n * 3] = pulseCol.r; pulses.carr[n * 3 + 1] = pulseCol.g; pulses.carr[n * 3 + 2] = pulseCol.b; n++;
                }
            });
            pulses.pts.geometry.attributes.position.needsUpdate = true;
            pulses.pts.geometry.attributes.color.needsUpdate = true;
        }
        // ukuran partikel mengikuti zoom (ortografik tidak punya atenuasi jarak)
        zoomK = clamp(VIEW_DEFAULT / view, 0.6, 1.8);
        [bub, snow, pulses].forEach(function (pp) { if (pp) pp.mat.size = pp.base * zoomK; });
    }

    function updateLabels() {
        var w = container.clientWidth, h = container.clientHeight;
        pods.forEach(function (p, i) {
            tmpV.set(PODS[i].x, HULL_Y + HULL_R + 0.8, PODS[i].z).project(camera);
            var sx = (tmpV.x + 1) / 2 * w, sy = (1 - tmpV.y) / 2 * h, el = labelEls[i];
            el.style.transform = 'translate(' + Math.round(sx) + 'px,' + Math.round(sy) + 'px) translate(-50%,-100%)';
            var txt = (podNames[i] || ('Pod ' + (i + 1))) + ' · ' + Math.round(loads[i] * 100) + '%' + (selected === i ? ' · ' + statusNames[statusIdx(loads[i])] : '');
            if (lblCache[i] !== txt) { el.textContent = txt; lblCache[i] = txt; }
            el.style.borderColor = '#' + ('000000' + statusHex(loads[i]).toString(16)).slice(-6);
            el.style.fontWeight = selected === i ? '800' : '700';
        });
    }

    function draw(now) {
        if (disposed) return;
        last = now;
        var t = reduce ? 0 : (now - t0) / 1000;
        night = nightAmount(clock.hour());
        if (focus) {
            target.x += (focus.x - target.x) * 0.14; target.y += (focus.y - target.y) * 0.14; target.z += (focus.z - target.z) * 0.14;
            view += (focus.view - view) * 0.12; applyCamera();
            if (Math.abs(focus.x - target.x) + Math.abs(focus.z - target.z) < 0.03 && Math.abs(focus.view - view) < 0.03) focus = null;
        }
        animate(t, 0.9 + 0.35 * night);
        renderer.render(scene, camera);
        updateLabels();
    }
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
    applyCamera(); resize(); start();

    return {
        update: function (data) { if (!disposed) loads = readLoads(data); },
        select: function (i) { if (!disposed) select(i); },
        isDisposed: function () { return disposed; },
        dispose: function () {
            if (disposed) return;
            disposed = true;
            if (raf) cancelAnimationFrame(raf);
            raf = 0;
            if (ro) ro.disconnect();
            document.removeEventListener('visibilitychange', onVis);
            canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove);
            canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp);
            canvas.removeEventListener('wheel', onWheel); canvas.removeEventListener('webglcontextlost', onLost);
            geos.forEach(function (g) { g.dispose(); });
            mats.forEach(function (m) { m.dispose(); });
            texs.forEach(function (t) { t.dispose(); });
            pods.forEach(function (p) { p.racks.dispose && p.racks.dispose(); p.leds.dispose && p.leds.dispose(); });
            [rockMesh, coralMesh, domeMesh, kelpMesh, fishMesh].forEach(function (m) { if (m && m.dispose) m.dispose(); });
            if (sun.shadow && sun.shadow.map) sun.shadow.map.dispose();
            if (envRT) envRT.dispose();
            renderer.dispose();
            try { renderer.forceContextLoss(); } catch (e) {}
            labelEls.concat([hudEl, vig, hintEl]).forEach(function (el) { if (el && el.parentNode) el.parentNode.removeChild(el); });
            if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        }
    };
}
