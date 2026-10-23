// FILE: src/ui/manufacture/ManufactureScene.js  (REPLACE — v2027.65: Pulau Kampus di seberang + jembatan)
// v2027.65 — Pulau Kampus tampil sebagai siluet di timur (selat ~12 unit) dan tersambung jembatan jalan raya
// dari ujung timur jalan raya Manufaktur ke gerbang barat Kampus. Truk menyeberangi jembatan sampai jalan Kampus
// (naik-turun mengikuti dek, muncul/menghilang dengan skala halus). Batas geser kamera diperlebar ke timur.
// Peta isometrik pulau industri yang menampilkan SEMUA pabrik di game dan terhubung ke data + panelnya:
//
//   Fab Chip   -> data.fab (FabSystem)                  : hall + cerobong + menara pendingin, tumbuh sesuai level
//   Pabrik SoC -> data.componentPlants.plants.soc       : atap gergaji (clean room) + logo chip berputar
//   Pabrik RAM -> ...plants.ram                         : modul memori + pin emas
//   Pabrik Layar -> ...plants.display                   : fasad kaca + panel layar menyala
//   Pabrik Kamera -> ...plants.camera                   : lensa besar + cincin berputar
//   Pabrik Baterai -> ...plants.battery                 : tangki sel + tiang listrik
//   Pusat Logistik -> stok, perawatan, pajak, hemat     : gudang + peti (jumlah mengikuti stok) + crane + dermaga & kapal
//
// Status tampil langsung di adegan:
//   terkunci   = bayangan abu-abu + gembok     siap dibangun = bayangan berwarna + kotak garis
//   dibangun/upgrade = perancah + crane berputar + bangunan yang tumbuh + bar progres
//   produksi   = lampu menyala, asap, konveyor jalan, truk di jalan raya, wafer mengalir di pipa dari Fab
//   tunggakan perawatan / menganggur = tanda seru di atas pabrik
//
// Ketuk pabrik -> kartu info + tombol aksi langsung (bangun / upgrade / produksi / batalkan, memakai sistem game
// yang sama dengan panel) + tombol menuju panel terkait (bus 'advisor:go').
// Render-on-demand; animasi ambient ~30fps dan berhenti saat tab tersembunyi / di luar layar.
// Rig cahaya, kontrol sentuh, dan tingkat kualitas dipakai bersama Peta Kampus & Peta Kantor.
import { frameGapMs, getRenderFps } from '../../core/RenderFps.js';
import { ToastService } from '../../core/ToastService.js';
import { bus } from '../../core/EventBus.js';
import { createLookRig, detectQuality } from '../campus/CampusLook.js';
import { createCampusControls } from '../campus/CampusControls.js';
import { BASE_VIEW, MAX_DPR, FRAME_MS, MIN_RESIZE_DELTA, NARROW_PX, clamp, tint, hexCss, readAccent, prefersReducedMotion } from '../office/OfficeConfig.js';
import { PLOTS, PLOT_BY_ID, CHIP_ORDER, PIPES, plotState, allStates, plotSig, describePlot, plotTitle, runAction, ms } from './ManufactureLogic.js';
import { LINK, buildLinkBridge, mfBridgeCfg, buildCampusFar } from '../campus/IslandLink.js';

// [terang, gelap]
var COLORS = {
    ground:  [0xc4e3bd, 0x203b32], grass2: [0xaed99f, 0x2b503b], soil: [0x806b56, 0x332a26],
    ocean:   [0x3fa9dc, 0x0d4a78], shallow: [0x86d8e8, 0x1a7a98], foam: [0xf4fbff, 0x9cc4d8],
    sand:    [0xf1dfae, 0x7a6f58], sandWet: [0xd9c795, 0x5e5543], rock: [0x98a0aa, 0x555d68],
    leaf:    [0x72bd78, 0x347d51], leaf2: [0x91cf87, 0x4c9b68], trunk: [0x9b7655, 0x5d4939],
    base:    [0xdfe5ee, 0x2c3544], pad: [0xf3f5fa, 0x3b4658], curb: [0xc3ccd9, 0x4a566b],
    road:    [0x6f7b8d, 0x1d232d], roadLine: [0xf5f7fb, 0xb9c3d3],
    wall:    [0xf4f7fc, 0xc0ccdc], wallDk: [0xd5dde9, 0x9aa7ba], roof: [0xb9c5d5, 0x56637a],
    metal:   [0xaab4c2, 0x6c7686], steel: [0xc9d1dc, 0x8a95a6], dark: [0x2a303b, 0x161a21],
    white:   [0xffffff, 0xc2cada], pipe: [0xb7c0cd, 0x7b8798], gold: [0xe0b445, 0xc9a13a],
    red:     [0xef5350, 0xd0443f], amber: [0xf5b83d, 0xd9a02a], green: [0x43c07a, 0x38a468],
    glass:   [0x9cc7ee, 0x4f77b8], win: [0x8fb4e8, 0x4f77b8], wood: [0x9a6e46, 0x6f4f33],
    crate:   [0xc99a62, 0x8a6a42], safety: [0xffc247, 0xd9a02a], hull: [0x2e3b52, 0x1b2434]
};
var PBR = { ground: [0.95, 0], base: [0.9, 0], pad: [0.85, 0], road: [0.95, 0], metal: [0.35, 0.35], steel: [0.4, 0.4], glass: [0.12, 0.1],
    gold: [0.3, 0.6], pipe: [0.4, 0.45], ocean: [0.42, 0], shallow: [0.4, 0], win: [0.3, 0.1] };

var ISLAND = { rx: 21, rz: 14.5, n: 3.2 };
function coastR(th) {
    var c = Math.abs(Math.cos(th)) / ISLAND.rx, s = Math.abs(Math.sin(th)) / ISLAND.rz;
    var r = Math.pow(Math.pow(c, ISLAND.n) + Math.pow(s, ISLAND.n), -1 / ISLAND.n);
    return r * (1 + 0.045 * Math.sin(3 * th + 0.8) + 0.03 * Math.sin(5 * th + 2.1));
}
function onIsland(x, z, m) { return Math.hypot(x, z) < coastR(Math.atan2(z, x)) - (m || 0); }
function nearPlots(x, z, m) { return Math.abs(x) < 16.4 + (m || 0) && Math.abs(z) < 8.9 + (m || 0); }

var ZC = -0.6;                       // pusat bangunan utama di dalam petak (lokal z); halaman di sisi +z
var PAD_TOP = 0.16;                  // permukaan alas petak

export function createManufactureScene(THREE, container, gameState) {
    var PERF = window.__PERF || {};
    var look = detectQuality(PERF);
    var renderer = new THREE.WebGLRenderer({ antialias: PERF.antialias !== false, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR, look.maxDpr));
    renderer.setClearColor(0x000000, 0);
    var canvas = renderer.domElement;
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', ms('aria'));
    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.isolation = 'isolate';
    container.style.overflow = 'hidden';
    container.style.background = 'radial-gradient(ellipse at 50% 24%, rgba(249,115,22,.13) 0%, rgba(148,163,184,.09) 38%, transparent 72%), linear-gradient(145deg, var(--bg-2, #f9fbff), var(--bg-1, #e7edf6))';
    container.appendChild(canvas);

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 140);
    var rig = createLookRig(THREE, renderer, scene, look);
    renderer.shadowMap.autoUpdate = !!rig.shadowsOn;

    // ---------- geometri & material bersama ----------
    var G = {
        box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 18), sph: new THREE.SphereGeometry(1, 14, 10),
        cone: new THREE.ConeGeometry(1, 1, 16), tor: new THREE.TorusGeometry(1, 0.09, 8, 28), plane: new THREE.PlaneGeometry(1, 1),
        circle: new THREE.CircleGeometry(1, 28), ring: new THREE.RingGeometry(0.78, 1, 36), ico: new THREE.IcosahedronGeometry(1, 0)
    };
    G.edges = new THREE.EdgesGeometry(G.box);
    var M = {};
    function pbr(color, key) {
        var p = PBR[key] || [0.7, 0];
        var m = new THREE.MeshStandardMaterial({ color: color, roughness: p[0], metalness: p[1] });
        m.envMapIntensity = 0.6;
        return m;
    }
    Object.keys(COLORS).forEach(function (k) { M[k] = pbr(COLORS[k][0], k); });
    M.glass.transparent = true; M.glass.opacity = 0.55;
    M.win.emissive = new THREE.Color(0x000000);
    M.smoke = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false });
    M.shade = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.14, depthWrite: false });
    M.lamp = new THREE.MeshBasicMaterial({ color: 0xfff1c4 });
    M.ledR = new THREE.MeshBasicMaterial({ color: 0xff4d4d });
    M.ledA = new THREE.MeshBasicMaterial({ color: 0xffc247 });
    M.ledG = new THREE.MeshBasicMaterial({ color: 0x43e08a });
    M.lock = new THREE.MeshStandardMaterial({ color: 0x8b97ad, roughness: 0.6 });
    M.lockGhost = new THREE.MeshBasicMaterial({ color: 0x8b97ad, transparent: true, opacity: 0.2, depthWrite: false });
    M.lockEdge = new THREE.LineBasicMaterial({ color: 0x8b97ad, transparent: true, opacity: 0.7 });
    M.selRing = new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.3, depthWrite: false });
    M.barBg = new THREE.MeshBasicMaterial({ color: 0x1b2230 });
    // bahan per-pabrik (warna aksen): padat, menyala, bayangan transparan, garis tepi
    var ACC = {}, GLOW = {}, GHOST = {}, EDGE = {};
    PLOTS.forEach(function (p) {
        ACC[p.id] = new THREE.MeshStandardMaterial({ color: p.accent, roughness: 0.55, metalness: 0.1 });
        GLOW[p.id] = new THREE.MeshBasicMaterial({ color: p.accent });
        GHOST[p.id] = new THREE.MeshBasicMaterial({ color: p.accent, transparent: true, opacity: 0.2, depthWrite: false });
        EDGE[p.id] = new THREE.LineBasicMaterial({ color: p.accent, transparent: true, opacity: 0.95 });
    });
    var crateCols = [M.crate, M.red, M.amber, M.steel];

    function mesh(parent, geo, mat, sx, sy, sz, x, y, z) {
        var mm = typeof mat === 'string' ? M[mat] : mat;
        var m = new THREE.Mesh(geo, mm);
        m.scale.set(sx, sy, sz);
        m.position.set(x, y, z);
        m.castShadow = !!look.shadows && !mm.transparent && !mm.isMeshBasicMaterial;
        m.receiveShadow = !!look.shadows;
        parent.add(m);
        return m;
    }
    function box(p, mat, w, h, d, x, y, z) { return mesh(p, G.box, mat, w, h, d, x, y, z); }
    function cyl(p, mat, r, h, x, y, z) { return mesh(p, G.cyl, mat, r, h, r, x, y, z); }
    function sph(p, mat, r, x, y, z) { return mesh(p, G.sph, mat, r, r, r, x, y, z); }
    function edges(p, mat, w, h, d, x, y, z) {
        var l = new THREE.LineSegments(G.edges, mat);
        l.scale.set(w, h, d); l.position.set(x, y, z);
        p.add(l);
        return l;
    }

    // ---------- label sprite (sama seperti Office) ----------
    var labelTex = [];
    function makeLabel(text, dark, dim, accentHex) {
        var c = document.createElement('canvas'), ctx = c.getContext('2d');
        var font = '700 26px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.font = font;
        var w = Math.ceil(ctx.measureText(text).width) + 36, h = 52, SS = 2;
        c.width = w * SS; c.height = h * SS;
        ctx.setTransform(SS, 0, 0, SS, 0, 0);
        ctx.font = font;
        ctx.fillStyle = dark ? 'rgba(20,24,32,0.88)' : 'rgba(255,255,255,0.92)';
        ctx.strokeStyle = hexCss(accentHex); ctx.lineWidth = 3;
        var r = 18;
        ctx.beginPath();
        ctx.moveTo(r, 2); ctx.lineTo(w - r, 2); ctx.quadraticCurveTo(w - 2, 2, w - 2, r);
        ctx.lineTo(w - 2, h - r); ctx.quadraticCurveTo(w - 2, h - 2, w - r, h - 2);
        ctx.lineTo(r, h - 2); ctx.quadraticCurveTo(2, h - 2, 2, h - r);
        ctx.lineTo(2, r); ctx.quadraticCurveTo(2, 2, r, 2);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = dark ? '#e8ecf4' : '#1b2230';
        ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
        ctx.fillText(text, w / 2, h / 2 + 1);
        var tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        labelTex.push(tex);
        var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, opacity: dim ? 0.7 : 1 }));
        sp.scale.set(0.49 * w / h, 0.49, 1);
        sp.renderOrder = 20;
        sp.userData.tex = tex;
        return sp;
    }
    var alertTex = {};
    function alertTexture(kind) {
        if (alertTex[kind]) return alertTex[kind];
        var c = document.createElement('canvas');
        c.width = 96; c.height = 96;
        var ctx = c.getContext('2d');
        ctx.fillStyle = kind === 'bad' ? '#ef4444' : '#f59e0b';
        ctx.beginPath(); ctx.arc(48, 48, 42, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 58px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('!', 48, 52);
        var tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        alertTex[kind] = tex;
        return tex;
    }

    // ---------- state scene ----------
    var dark = false, accentHex = 0x2563eb;
    var plots = {}, plotList = [];
    var states = {}, lastData = null;
    var selected = null;
    var disposed = false;
    var animPlots = [], shellTickers = [];
    var aspect = 1, lastW = 0, lastH = 0, resizeScheduled = false, fitted = false;
    var raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
    var raf = 0, loopRaf = 0, loopTimer = 0, lastFrame = 0, inView = true, focusRaf = 0;
    var ambient = !prefersReducedMotion();
    var legendOn = false, quality = { slow: 0, lowered: false, frameMs: FRAME_MS };
    var lastRendered = 0, ctxLost = false;
    var shiftPx = 0, shiftTarget = 0;
    var cardCollapsed = false, cardSig = '', chipSig = '', cardWasVisible = false;
    var busy = false, hintGone = false;
    var pipeObjs = [], truckObjs = [];

    // ============================================================
    // CANGKANG STATIS: pulau, plaza, jalan, pipa, lampu, truk
    // ============================================================
    var shell = new THREE.Group();
    scene.add(shell);
    var GY = 0, isleSeed = 2468, islePlaced = [];
    function isleRnd() { isleSeed = (isleSeed * 16807) % 2147483647; return (isleSeed - 1) / 2147483646; }
    function isleClear(x, z, r) {
        if (nearPlots(x, z, r + 0.6) || !onIsland(x, z, r + 0.5)) return false;
        for (var i = 0; i < islePlaced.length; i++) if (Math.hypot(islePlaced[i][0] - x, islePlaced[i][1] - z) < islePlaced[i][2] + r + 0.3) return false;
        return true;
    }
    function isleSpot(minF, maxF, r) {
        for (var k = 0; k < 80; k++) {
            var th = isleRnd() * Math.PI * 2, f = minF + isleRnd() * (maxF - minF), rr = coastR(th) * f;
            var x = Math.cos(th) * rr, z = Math.sin(th) * rr;
            if (isleClear(x, z, r)) return [x, z];
        }
        return null;
    }
    function islandGeo(scale, depth) {
        var key = 'isl' + scale + '_' + depth;
        if (G[key]) return G[key];
        var sh = new THREE.Shape(), N = 120, i;
        for (i = 0; i < N; i++) {
            var th = (i / N) * Math.PI * 2, r = coastR(th) * scale;
            if (i === 0) sh.moveTo(Math.cos(th) * r, -Math.sin(th) * r); else sh.lineTo(Math.cos(th) * r, -Math.sin(th) * r);
        }
        sh.closePath();
        var g = new THREE.ExtrudeGeometry(sh, { depth: depth, bevelEnabled: false, curveSegments: 1 });
        g.rotateX(-Math.PI / 2);
        G[key] = g;
        return g;
    }
    function islandSlab(scale, top, depth, mat) {
        var m = new THREE.Mesh(islandGeo(scale, depth), mat);
        m.position.y = top - depth;
        m.receiveShadow = !!look.shadows;
        shell.add(m);
        return m;
    }
    function terrain(geo, mat, sx, sy, sz, x, y, z) { var m = mesh(shell, geo, mat, sx, sy, sz, x, y, z); m.castShadow = false; return m; }
    function tree(x, z, s) {
        mesh(shell, G.cyl, 'trunk', 0.11 * s, 0.6 * s, 0.11 * s, x, GY + 0.3 * s, z);
        mesh(shell, G.sph, isleRnd() < 0.5 ? 'leaf' : 'leaf2', 0.5 * s, 0.5 * s, 0.5 * s, x, GY + 0.9 * s, z);
        mesh(shell, G.sph, 'leaf2', 0.32 * s, 0.32 * s, 0.32 * s, x + 0.1 * s, GY + 1.32 * s, z - 0.08 * s);
    }
    terrain(G.box, 'ocean', 340, 1, 340, 0, GY - 1.0, 0);
    islandSlab(1.22, GY - 0.47, 0.2, M.shallow);
    islandSlab(1.115, GY - 0.455, 0.2, M.foam);
    islandSlab(1.08, GY - 0.26, 0.5, M.sandWet);
    islandSlab(1.05, GY - 0.03, 0.7, M.sand);
    islandSlab(1.0, GY, 0.7, [M.ground, M.soil]);
    var di, hp, hr;
    for (di = 0; di < 5; di++) {                                   // bukit rendah di pinggiran
        hr = 1.3 + isleRnd() * 1.1; hp = isleSpot(0.74, 0.93, hr + 0.3);
        if (!hp) continue;
        islePlaced.push([hp[0], hp[1], hr]);
        terrain(G.sph, 'grass2', hr, hr * 0.42, hr, hp[0], GY, hp[1]);
    }
    for (di = 0; di < 4; di++) {                                   // hutan kecil
        var fc = isleSpot(0.82, 0.93, 1.4);
        if (!fc) continue;
        var nT = 3 + Math.floor(isleRnd() * 3), done = 0, fk;
        for (fk = 0; fk < 30 && done < nT; fk++) {
            var ta = isleRnd() * Math.PI * 2, td = 0.4 + isleRnd() * 1.4;
            var tx = fc[0] + Math.cos(ta) * td, tz = fc[1] + Math.sin(ta) * td, ts = 0.8 + isleRnd() * 0.4;
            if (!isleClear(tx, tz, 0.5 * ts)) continue;
            islePlaced.push([tx, tz, 0.5 * ts]); tree(tx, tz, ts); done++;
        }
    }
    for (di = 0; di < 14; di++) {                                  // batu pantai
        var rth = isleRnd() * Math.PI * 2, rr = coastR(rth) * (0.97 + isleRnd() * 0.07), rs = 0.12 + isleRnd() * isleRnd() * 0.35;
        terrain(G.ico, 'rock', rs * (1 + isleRnd() * 0.5), rs * 0.7, rs * (1 + isleRnd() * 0.5), Math.cos(rth) * rr, GY - 0.25 + rs * 0.2, Math.sin(rth) * rr);
    }
    for (di = 0; di < 34; di++) {                                  // riak ombak
        var wa = isleRnd() * Math.PI * 2, wr = coastR(wa) * (1.25 + isleRnd() * 0.45);
        var wm = terrain(G.box, 'foam', 0.9 + isleRnd() * 2.2, 0.012, 0.07 + isleRnd() * 0.05, Math.cos(wa) * wr, GY - 0.488, Math.sin(wa) * wr);
        wm.rotation.y = wa + Math.PI / 2;
    }

    // plaza + jalan raya (z = 0) + marka + trotoar
    box(shell, 'base', 33.4, 0.1, 17.9, 0, 0.05, 0);
    box(shell, 'road', 33.4, 0.03, 2.7, 0, 0.115, 0);
    box(shell, 'curb', 33.4, 0.05, 0.1, 0, 0.125, -1.4);
    box(shell, 'curb', 33.4, 0.05, 0.1, 0, 0.125, 1.4);
    var li;
    for (li = -15; li <= 15; li += 2) box(shell, 'roadLine', 0.9, 0.012, 0.09, li, 0.135, 0);
    // lampu jalan (menyala di tema gelap)
    var lampPosts = [];
    for (li = -14; li <= 14; li += 7) {
        [-1.75, 1.75].forEach(function (zz) {
            cyl(shell, 'metal', 0.05, 1.3, li, 0.75, zz);
            lampPosts.push(sph(shell, 'lamp', 0.12, li, 1.45, zz));
        });
    }
    // pipa wafer dari Fab -> SoC / RAM / Layar. Tiap pipa = rangkaian segmen sumbu-lurus + kubus wafer yang mengalir.
    function pipePath(pts, plotKey) {
        var g = new THREE.Group(), glowSegs = [], i, lens = [0], total = 0;
        for (i = 1; i < pts.length; i++) {
            var a = pts[i - 1], b = pts[i];
            var dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
            var L = Math.abs(dx) + Math.abs(dy) + Math.abs(dz);
            total += L; lens.push(total);
            var sx = Math.abs(dx) > 0 ? Math.abs(dx) + 0.22 : 0.22, sy = Math.abs(dy) > 0 ? Math.abs(dy) + 0.22 : 0.22, sz = Math.abs(dz) > 0 ? Math.abs(dz) + 0.22 : 0.22;
            var cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2, cz = (a[2] + b[2]) / 2;
            box(g, 'pipe', sx, sy, sz, cx, cy, cz);
            glowSegs.push(box(g, GLOW[plotKey], sx > 0.23 ? sx : 0.1, sy > 0.23 ? sy : 0.1, sz > 0.23 ? sz : 0.1, cx, cy + (sy > 0.23 ? 0 : 0.12), cz));
        }
        for (i = 0; i < pts.length; i++) {                           // sambungan + tiang penyangga
            sph(g, 'steel', 0.17, pts[i][0], pts[i][1], pts[i][2]);
            if (pts[i][1] > 1.5 || i === 0 || i === pts.length - 1) { /* tiang hanya di titik tinggi */ }
        }
        shell.add(g);
        var cubes = [], k;
        for (k = 0; k < 4; k++) { var cb = box(g, GLOW[plotKey], 0.3, 0.3, 0.3, 0, 0, 0); cb.visible = false; cubes.push(cb); }
        return { group: g, pts: pts, lens: lens, total: total, glow: glowSegs, cubes: cubes, active: false };
    }
    var fabY = 0.95;
    var pipeDefs = {
        'fab>soc': [[-9.8, fabY, -5.8], [-5.0, fabY, -5.8]],
        'fab>ram': [[9.8, fabY, -5.8], [5.0, fabY, -5.8]],
        'fab>display': [[-4, 1.0, -3.9], [-4, 1.0, -1.9], [-4, 1.9, -1.9], [-4, 1.9, 1.9], [-4, 1.0, 1.9], [-4, 1.0, 3.2]]
    };
    PIPES.forEach(function (pp) {
        var key = pp[0] + '>' + pp[1];
        var po = pipePath(pipeDefs[key], pp[1]);
        po.to = pp[1]; po.from = pp[0];
        pipeObjs.push(po);
    });
    [-1.9, 1.9].forEach(function (zz) { cyl(shell, 'metal', 0.09, 1.8, -4, 0.9, zz); });       // tiang jembatan pipa di atas jalan

    // truk di jalan raya (jalur +x di z = +0.6, jalur -x di z = -0.6)
    function makeTruck(accent, dir) {
        var g = new THREE.Group();
        box(g, 'dark', 0.25, 0.05, 0.5, 0, 0.1, 0);
        box(g, accent, 0.95, 0.5, 0.55, -0.3, 0.38, 0);                  // bak
        box(g, 'white', 0.42, 0.4, 0.5, 0.42, 0.33, 0);                  // kabin
        box(g, 'glass', 0.04, 0.2, 0.4, 0.64, 0.4, 0);
        [-0.5, 0.0, 0.5].forEach(function (wx) { [-0.28, 0.28].forEach(function (wz) { cyl(g, 'dark', 0.1, 0.1, wx, 0.1, wz).rotation.x = Math.PI / 2; }); });
        g.rotation.y = dir > 0 ? 0 : Math.PI;
        shell.add(g);
        return g;
    }
    [[ACC.fab, 1, 0.0], [ACC.battery, 1, 0.5], [ACC.camera, -1, 0.25], [ACC.display, -1, 0.75]].forEach(function (c, i) {
        truckObjs.push({ g: makeTruck(c[0], c[1]), dir: c[1], off: c[2], lane: c[1] > 0 ? 0.62 : -0.62, idx: i });
    });

    // jembatan jalan raya ke Pulau Kampus (timur) + siluet Pulau Kampus. Adaptor memakai geometri/material scene ini
    // (ikut tema lewat COLORS & di-dispose bersama G/M). Peta Kampus memakai jembatan yang sama dari sisi seberang.
    var LINK_ROLE = { road: 'road', curb: 'curb', line: 'roadLine', post: 'steel', pole: 'metal', lamp: 'lamp' };
    function noShadow(m) { m.castShadow = false; m.receiveShadow = false; return m; }
    var linkKit = {
        mat: function (role) { return M[LINK_ROLE[role]]; },
        custom: function (key, fn) { return G[key] || (G[key] = fn()); },
        box: function (g, role, w, h, d, x, y, z) { return noShadow(box(g, LINK_ROLE[role], w, h, d, x, y, z)); },
        cyl: function (g, role, r, h, x, y, z) { return noShadow(cyl(g, LINK_ROLE[role], r, h, x, y, z)); },
        sph: function (g, role, r, x, y, z) { return noShadow(sph(g, LINK_ROLE[role], r, x, y, z)); }
    };
    var linkBridge = buildLinkBridge(THREE, linkKit, mfBridgeCfg());
    shell.add(linkBridge.group);
    var farCampus = buildCampusFar(THREE, scene, LINK.OFFSET);
    var TRUCK_X0 = -16, TRUCK_X1 = LINK.OFFSET - LINK.CAMPUS_ROAD_END + 3;   // dari ujung barat plaza sampai jalan Kampus di seberang
    var TRUCK_RATE = 0.055 * 32 / (TRUCK_X1 - TRUCK_X0);                       // kecepatan dunia sama dengan sebelumnya

    // dermaga + kapal kargo (milik Pusat Logistik; dibangun di grup petak hub)
    // ============================================================

    // ============================================================
    // PETAK PABRIK
    // ============================================================
    PLOTS.forEach(function (def) {
        var g = new THREE.Group();
        g.position.set(def.x, 0, def.z);
        g.userData.plotId = def.id;
        box(g, 'pad', def.w - 0.3, 0.06, def.d - 0.3, 0, 0.13, 0);
        box(g, 'curb', def.w - 0.14, 0.05, 0.08, 0, 0.125, -(def.d / 2) + 0.12);
        box(g, 'curb', def.w - 0.14, 0.05, 0.08, 0, 0.125, (def.d / 2) - 0.12);
        var ovMat = new THREE.MeshBasicMaterial({ color: def.accent, transparent: true, opacity: 0.26, depthWrite: false });
        var ov = mesh(g, G.plane, ovMat, def.w - 0.2, def.d - 0.2, 1, 0, PAD_TOP + 0.01, 0);
        ov.rotation.x = -Math.PI / 2; ov.visible = false;
        var furn = new THREE.Group();
        furn.position.y = PAD_TOP;
        g.add(furn);
        var r = { def: def, group: g, furn: furn, ov: ov, ovMat: ovMat, sig: null, st: null, label: null, alertSp: null, alertBase: 0, tick: null, w: def.w, d: def.d, fxPos: new THREE.Vector3(def.x, 0, def.z) };
        plots[def.id] = r; plotList.push(r);
        scene.add(g);
    });

    // ---------- bangunan: ukuran menurut level ----------
    function dimsFor(def, L) {
        if (def.kind === 'fab') return { bw: 6.6 + 1.3 * L, bd: 3.0, bh: 1.45 + 0.3 * L };
        if (def.kind === 'hub') return { bw: 4.6, bd: 2.4, bh: 1.5 };
        return { bw: 3.4 + 0.38 * L, bd: 2.3 + 0.2 * L, bh: 1.0 + 0.34 * L };
    }
    function hall(f, id, dm, zc, noWin) {
        var bw = dm.bw, bd = dm.bd, bh = dm.bh;
        box(f, 'wall', bw, bh, bd, 0, bh / 2, zc);
        box(f, 'roof', bw + 0.18, 0.12, bd + 0.18, 0, bh + 0.06, zc);
        box(f, ACC[id], bw + 0.03, 0.17, bd + 0.03, 0, bh - 0.16, zc);
        if (!noWin) {
            box(f, 'win', bw * 0.78, 0.26, 0.05, 0, bh * 0.48, zc + bd / 2 + 0.02);
            box(f, 'win', 0.05, 0.26, bd * 0.7, bw / 2 + 0.02, bh * 0.48, zc);
        }
        box(f, 'dark', 0.72, Math.min(0.85, bh * 0.55), 0.06, -bw * 0.3, Math.min(0.85, bh * 0.55) / 2, zc + bd / 2 + 0.03);
    }
    function levelPips(f, id, L, maxL) {
        for (var i = 0; i < maxL; i++) box(f, i < L ? GLOW[id] : 'metal', 0.22, 0.1, 0.22, -0.4 * (maxL - 1) / 2 + i * 0.4 + 2.2, 0.05, 2.65);
    }
    function crateStacks(f, stock, x0, z0, id) {
        var n = clamp(Math.floor(Math.log10(Math.max(1, stock)) * 1.6), 0, 8);
        for (var i = 0; i < n; i++) {
            var cx = x0 + (i % 4) * 0.5, cz = z0 + Math.floor(i / 4) * 0.5;
            box(f, i % 3 === 0 ? ACC[id] : crateCols[i % crateCols.length], 0.4, 0.34, 0.4, cx, 0.17, cz);
            if (i % 2 === 1) box(f, crateCols[(i + 1) % crateCols.length], 0.36, 0.3, 0.36, cx, 0.49, cz);
        }
    }
    function smoke(f, x, y, z, tk, active) {
        var puffs = [];
        for (var i = 0; i < 3; i++) { var s = sph(f, 'smoke', 0.2, x, y, z); s.visible = !!active; s.castShadow = false; puffs.push(s); }
        if (!active) return;
        tk.push(function (sec) {
            for (var i = 0; i < puffs.length; i++) {
                var u = (sec * 0.45 + i / 3) % 1;
                puffs[i].position.set(x + u * 0.5, y + u * 1.7, z);
                var sc = 0.16 + u * 0.3 * (u > 0.75 ? (1 - u) * 4 : 1);
                puffs[i].scale.set(sc, sc, sc);
            }
        });
    }
    function beacon(f, x, y, z, tk, active, id) {
        var b = sph(f, active ? 'ledA' : 'metal', 0.1, x, y, z);
        cyl(f, 'metal', 0.025, 0.2, x, y - 0.14, z);
        if (active) tk.push(function (sec) { var s = 0.09 + Math.abs(Math.sin(sec * 5)) * 0.05; b.scale.set(s, s, s); b.material = Math.sin(sec * 5) > 0 ? M.ledA : M.ledR; });
        return b;
    }
    function conveyor(f, x, z, len, tk, active, id) {
        box(f, 'dark', len, 0.12, 0.5, x, 0.14, z);
        box(f, 'metal', len + 0.1, 0.04, 0.58, x, 0.2, z);
        var items = [];
        for (var i = 0; i < 4; i++) items.push(box(f, i % 2 ? ACC[id] : 'crate', 0.28, 0.22, 0.3, x, 0.34, z));
        var span = len - 0.4;
        tk.push(function (sec) {
            for (var i = 0; i < items.length; i++) {
                var u = active ? ((sec * 0.25 + i / items.length) % 1) : (i / items.length);
                items[i].position.x = x - span / 2 + u * span;
            }
        });
    }

    // ---------- per-jenis pabrik ----------
    var TYPE = {};
    TYPE.battery = function (f, def, L, st, tk, on) {
        var dm = dimsFor(def, L);
        hall(f, 'battery', dm, ZC);
        var n = clamp(1 + L, 2, 5), i;
        for (i = 0; i < n; i++) {                                    // tangki sel
            var tx = -(n - 1) * 0.5 * 0.82 + i * 0.82, th = 1.1 + 0.16 * L;
            cyl(f, 'steel', 0.34, th, tx, th / 2, 1.55);
            cyl(f, ACC.battery, 0.355, 0.12, tx, th * 0.62, 1.55);
            cyl(f, ACC.battery, 0.2, 0.1, tx, th + 0.05, 1.55);
            var band = cyl(f, on ? GLOW.battery : 'metal', 0.36, 0.06, tx, th * 0.3, 1.55);
            if (on) { var bi = i; tk.push(function (sec) { band.visible = Math.sin(sec * 4 + bi) > -0.2; }); }
        }
        var px = dm.bw / 2 + 0.6;                                    // tiang listrik
        box(f, 'metal', 0.1, 2.2, 0.1, px, 1.1, -1.7);
        box(f, 'metal', 0.9, 0.07, 0.07, px, 2.0, -1.7);
        box(f, 'metal', 0.6, 0.07, 0.07, px, 1.65, -1.7);
        if (L >= 2) { box(f, 'metal', 0.7, 0.5, 0.5, px, 0.25, -0.6); box(f, ACC.battery, 0.72, 0.08, 0.52, px, 0.54, -0.6); }
        beacon(f, -dm.bw / 2 + 0.3, dm.bh + 0.35, ZC, tk, on, 'battery');
        conveyor(f, 0, 2.45, 2.6, tk, on, 'battery');
    };
    TYPE.display = function (f, def, L, st, tk, on) {
        var dm = dimsFor(def, L);
        box(f, 'wall', dm.bw, dm.bh, dm.bd, 0, dm.bh / 2, ZC);
        box(f, 'glass', dm.bw - 0.15, dm.bh - 0.25, 0.06, 0, dm.bh / 2 - 0.02, ZC + dm.bd / 2 + 0.03);       // fasad kaca
        box(f, 'glass', 0.06, dm.bh - 0.25, dm.bd - 0.2, dm.bw / 2 + 0.03, dm.bh / 2 - 0.02, ZC);
        box(f, 'roof', dm.bw + 0.18, 0.12, dm.bd + 0.18, 0, dm.bh + 0.06, ZC);
        box(f, ACC.display, dm.bw + 0.03, 0.17, dm.bd + 0.03, 0, dm.bh - 0.16, ZC);
        var panel = box(f, on ? GLOW.display : 'dark', dm.bw * 0.58, 0.95, 0.09, 0, dm.bh + 0.7, ZC);        // layar raksasa di atap
        box(f, 'metal', 0.1, 0.4, 0.1, -dm.bw * 0.2, dm.bh + 0.3, ZC); box(f, 'metal', 0.1, 0.4, 0.1, dm.bw * 0.2, dm.bh + 0.3, ZC);
        panel.rotation.y = 0;
        if (on) tk.push(function (sec) { panel.material = (Math.floor(sec * 1.5) % 3 === 0) ? M.white : GLOW.display; });
        var n = 2 + L, i;
        for (i = 0; i < n; i++) {                                    // tumpukan panel layar di halaman
            var px = -n * 0.22 + i * 0.44;
            var pn = box(f, 'dark', 0.34, 0.8, 0.06, px, 0.4, 1.6 + (i % 2) * 0.15);
            pn.rotation.z = 0.12;
            box(f, i % 2 ? GLOW.display : 'win', 0.28, 0.7, 0.02, px, 0.4, 1.64 + (i % 2) * 0.15).rotation.z = 0.12;
        }
        beacon(f, dm.bw / 2 - 0.25, dm.bh + 0.35, ZC + 0.6, tk, on, 'display');
        conveyor(f, 0.4, 2.5, 2.4, tk, on, 'display');
    };
    TYPE.soc = function (f, def, L, st, tk, on) {
        var dm = dimsFor(def, L);
        box(f, 'wall', dm.bw, dm.bh, dm.bd, 0, dm.bh / 2, ZC);
        box(f, ACC.soc, dm.bw + 0.03, 0.17, dm.bd + 0.03, 0, dm.bh - 0.16, ZC);
        box(f, 'win', dm.bw * 0.78, 0.26, 0.05, 0, dm.bh * 0.48, ZC + dm.bd / 2 + 0.02);
        box(f, 'win', 0.05, 0.26, dm.bd * 0.7, dm.bw / 2 + 0.02, dm.bh * 0.48, ZC);
        var ns = 2 + L, i;
        for (i = 0; i < ns; i++) {                                   // atap gergaji clean room
            var sw = dm.bw / ns, sx = -dm.bw / 2 + sw * (i + 0.5);
            var sl = box(f, 'roof', sw * 0.96, 0.09, dm.bd + 0.1, sx, dm.bh + 0.16, ZC);
            sl.rotation.z = 0.38;
            box(f, 'glass', 0.05, 0.3, dm.bd * 0.9, sx - sw * 0.46, dm.bh + 0.1, ZC);
        }
        // logo chip berputar di tiang
        var logo = new THREE.Group();
        logo.position.set(0, dm.bh + 1.15, ZC);
        f.add(logo);
        cyl(f, 'metal', 0.06, 0.8, 0, dm.bh + 0.55, ZC);
        box(logo, 'dark', 0.85, 0.12, 0.85, 0, 0, 0);
        box(logo, ACC.soc, 0.5, 0.14, 0.5, 0, 0.01, 0);
        for (i = 0; i < 6; i++) { var pp = -0.33 + i * 0.132; box(logo, 'gold', 0.05, 0.06, 0.14, pp, 0, 0.5); box(logo, 'gold', 0.05, 0.06, 0.14, pp, 0, -0.5); box(logo, 'gold', 0.14, 0.06, 0.05, 0.5, 0, pp); box(logo, 'gold', 0.14, 0.06, 0.05, -0.5, 0, pp); }
        tk.push(function (sec) { logo.rotation.y = ambient ? sec * (on ? 1.1 : 0.3) : 0.6; });
        // wafer bersandar di halaman
        for (i = 0; i < 1 + Math.min(L, 3); i++) {
            var wf = cyl(f, 'gold', 0.42, 0.05, -1.0 + i * 0.7, 0.45, 1.65);
            wf.rotation.x = Math.PI / 2 - 0.2;
            cyl(f, ACC.soc, 0.18, 0.06, -1.0 + i * 0.7, 0.45, 1.66).rotation.x = Math.PI / 2 - 0.2;
        }
        beacon(f, dm.bw / 2 - 0.25, dm.bh + 0.55, ZC - 0.6, tk, on, 'soc');
        smoke(f, -dm.bw / 2 + 0.4, dm.bh + 0.5, ZC - 0.6, tk, on);
        conveyor(f, 1.1, 2.55, 2.0, tk, on, 'soc');
    };
    TYPE.camera = function (f, def, L, st, tk, on) {
        var dm = dimsFor(def, L);
        hall(f, 'camera', dm, ZC);
        var lens = new THREE.Group();
        lens.position.set(-0.7, 0.75 + 0.05 * L, 1.45);
        f.add(lens);
        cyl(lens, 'dark', 0.62, 0.95, 0, 0, 0).rotation.x = Math.PI / 2;
        var ring = mesh(lens, G.tor, ACC.camera, 0.66, 0.66, 0.66, 0, 0, 0.48);
        mesh(lens, G.tor, 'metal', 0.46, 0.46, 0.46, 0, 0, 0.5);
        var glassMat = on ? GLOW.camera : 'glass';
        var gl = sph(lens, glassMat, 0.4, 0, 0, 0.5); gl.scale.z = 0.35;
        cyl(f, 'metal', 0.1, 0.5, -0.7, 0.26, 1.45);
        tk.push(function (sec) { ring.rotation.z = ambient ? sec * (on ? 1.4 : 0.15) : 0; if (on) { var s = 0.36 + Math.abs(Math.sin(sec * 3)) * 0.07; gl.scale.set(s, s, 0.35 * s / 0.4); } });
        if (L >= 2) {                                                // lensa tambahan
            var l2 = new THREE.Group(); l2.position.set(0.7, 0.45, 1.6); f.add(l2);
            cyl(l2, 'dark', 0.33, 0.55, 0, 0, 0).rotation.x = Math.PI / 2;
            mesh(l2, G.tor, 'metal', 0.35, 0.35, 0.35, 0, 0, 0.28);
            var g2 = sph(l2, 'glass', 0.24, 0, 0, 0.29); g2.scale.z = 0.35;
        }
        if (L >= 3) { var dome = sph(f, 'white', 0.55, dm.bw / 2 - 0.7, dm.bh + 0.1, ZC); dome.scale.y = 0.8; box(f, 'dark', 0.08, 0.5, 0.5, dm.bw / 2 - 0.7, dm.bh + 0.35, ZC + 0.4); }
        beacon(f, -dm.bw / 2 + 0.3, dm.bh + 0.35, ZC, tk, on, 'camera');
    };
    TYPE.ram = function (f, def, L, st, tk, on) {
        var dm = dimsFor(def, L);
        hall(f, 'ram', dm, ZC);
        var n = 2 + L, i;
        for (i = 0; i < n; i++) {                                    // modul memori besar di atap
            var mx = -dm.bw / 2 + 0.45 + i * ((dm.bw - 0.9) / Math.max(1, n - 1));
            box(f, ACC.ram, 0.3, 0.7, 0.07, mx, dm.bh + 0.47, ZC);
            for (var c = 0; c < 3; c++) box(f, 'dark', 0.2, 0.14, 0.09, mx, dm.bh + 0.3 + c * 0.2, ZC);
            box(f, 'gold', 0.3, 0.06, 0.09, mx, dm.bh + 0.15, ZC);
        }
        for (i = 0; i < 2 + L; i++) {                                // modul di halaman
            var gx = -1.4 + i * 0.5;
            box(f, ACC.ram, 0.8, 0.4, 0.05, gx, 0.45, 1.65).rotation.y = 0.35;
            box(f, 'dark', 0.5, 0.14, 0.07, gx, 0.5, 1.66).rotation.y = 0.35;
        }
        beacon(f, dm.bw / 2 - 0.25, dm.bh + 0.9, ZC, tk, on, 'ram');
        smoke(f, -dm.bw / 2 + 0.4, dm.bh + 0.3, ZC - 0.7, tk, on);
        conveyor(f, 0.9, 2.55, 2.0, tk, on, 'ram');
    };
    TYPE.fab = function (f, def, L, st, tk, on) {
        var dm = dimsFor(def, L), zc = ZC - 0.1, i;
        hall(f, 'fab', dm, zc);
        box(f, 'white', dm.bw * 0.7, 0.35, dm.bd * 0.55, -dm.bw * 0.1, dm.bh + 0.3, zc);               // clean room di atap
        for (i = 0; i < 3 + L; i++) box(f, 'metal', 0.5, 0.18, 0.5, -dm.bw * 0.1 - dm.bw * 0.28 + i * (dm.bw * 0.56 / (2 + L)), dm.bh + 0.57, zc);
        var nChim = clamp(L, 1, 3);
        for (i = 0; i < nChim; i++) {                                // cerobong
            var cx = dm.bw / 2 - 0.7 - i * 0.7;
            cyl(f, 'steel', 0.2, 1.7 + 0.2 * i, cx, dm.bh + 0.85 + 0.1 * i, zc - 0.7);
            cyl(f, ACC.fab, 0.215, 0.12, cx, dm.bh + 1.6 + 0.2 * i, zc - 0.7);
            smoke(f, cx, dm.bh + 1.8 + 0.2 * i, zc - 0.7, tk, on);
        }
        if (L >= 2) {                                                // menara pendingin
            var nc = L - 1;
            for (i = 0; i < nc; i++) {
                var tx = -dm.bw / 2 + 0.7 + i * 1.15;
                var tw = mesh(f, G.cyl, 'wallDk', 0.5, 1.3, 0.5, tx, 0.65, zc - 1.9); tw.scale.set(0.5, 1.3, 0.5);
                cyl(f, 'steel', 0.42, 0.06, tx, 1.32, zc - 1.9);
                smoke(f, tx, 1.5, zc - 1.9, tk, on);
            }
        }
        // wafer raksasa berputar di tiang (logo Fab)
        var wafer = new THREE.Group();
        wafer.position.set(dm.bw / 2 - 1.6, dm.bh + 1.2, zc + 0.3);
        f.add(wafer);
        cyl(f, 'metal', 0.07, 1.0, dm.bw / 2 - 1.6, dm.bh + 0.55, zc + 0.3);
        var disc = cyl(wafer, 'gold', 0.75, 0.07, 0, 0, 0); disc.rotation.x = Math.PI / 2;
        var die = box(wafer, ACC.fab, 0.7, 0.7, 0.09, 0, 0, 0);
        for (i = 0; i < 4; i++) box(wafer, 'dark', 0.12, 0.12, 0.1, -0.2 + (i % 2) * 0.4, -0.2 + Math.floor(i / 2) * 0.4, 0);
        void die;
        wafer.rotation.y = Math.PI / 4;
        tk.push(function (sec) { disc.rotation.y = ambient ? sec * (on ? 1.2 : 0.25) : 0; });
        if (L >= 3) {                                                // gantry crane pengangkut wafer
            box(f, 'safety', 0.12, 1.1, 0.12, -dm.bw / 2 + 0.2, dm.bh + 0.55, zc + dm.bd / 2 + 0.3);
            box(f, 'safety', 0.12, 1.1, 0.12, dm.bw / 2 - 0.2, dm.bh + 0.55, zc + dm.bd / 2 + 0.3);
            box(f, 'safety', dm.bw - 0.2, 0.12, 0.14, 0, dm.bh + 1.1, zc + dm.bd / 2 + 0.3);
            var trol = box(f, 'dark', 0.3, 0.2, 0.2, 0, dm.bh + 0.95, zc + dm.bd / 2 + 0.3);
            tk.push(function (sec) { trol.position.x = ambient && on ? Math.sin(sec * 0.6) * (dm.bw / 2 - 0.8) : 0; });
        }
        if (L >= 4) box(f, 'wall', 2.2, dm.bh * 0.7, 2.0, dm.bw / 2 + 0.2 - 1.1, dm.bh * 0.35, zc - 2.6 + 0.2);   // gedung utilitas tambahan (Mega Fab)
        // dermaga muat + konveyor
        box(f, 'dark', 2.2, 0.08, 0.8, -dm.bw * 0.2, 0.04, zc + dm.bd / 2 + 0.55);
        conveyor(f, dm.bw * 0.2, 2.4, 3.0, tk, on, 'fab');
        beacon(f, -dm.bw / 2 + 0.3, dm.bh + 0.4, zc + 0.8, tk, on, 'fab');
        for (i = 0; i < 4; i++) box(f, i < L ? GLOW.fab : 'metal', 0.22, 0.1, 0.22, 4.9 + i * 0.4 - 1.2, 0.05, 2.85);
    };
    TYPE.hub = function (f, def, L, st, tk, on) {
        var dm = dimsFor(def, L), i;
        var big = clamp(L, 0, 6);                                    // L = jumlah pabrik berdiri
        hall(f, 'hub', { bw: dm.bw, bd: dm.bd, bh: dm.bh }, ZC - 0.1, true);
        for (i = 0; i < 3; i++) {                                    // pintu rolling
            box(f, 'steel', 1.0, 0.95, 0.05, -1.45 + i * 1.45, 0.48, ZC - 0.1 + dm.bd / 2 + 0.03);
            for (var s = 0; s < 4; s++) box(f, 'metal', 0.98, 0.02, 0.06, -1.45 + i * 1.45, 0.2 + s * 0.22, ZC - 0.1 + dm.bd / 2 + 0.05);
        }
        box(f, ACC.hub, 1.6, 0.4, 0.07, 0, dm.bh + 0.42, ZC + 0.9);                                       // papan nama gudang
        box(f, 'white', 1.2, 0.18, 0.08, 0, dm.bh + 0.42, ZC + 0.93);
        // peti kontainer: jumlah ikut stok
        var nBox = clamp(Math.floor(Math.log10(Math.max(1, st.stock)) * 1.5), 0, 9);
        for (i = 0; i < nBox; i++) {
            var cx = -2.0 + (i % 5) * 0.78, cz = 1.75 + Math.floor(i / 5) * 0.55, cm = [ACC.hub, 'red', 'amber', 'green', 'steel'][i % 5];
            box(f, cm, 0.7, 0.42, 0.45, cx, 0.21, cz);
            if (i % 3 === 0) box(f, cm === ACC.hub ? 'steel' : ACC.hub, 0.7, 0.42, 0.45, cx, 0.63, cz);
        }
        // crane pelabuhan
        var cx0 = 2.7;
        box(f, 'safety', 0.1, 2.6, 0.1, cx0 - 0.4, 1.3, 1.6); box(f, 'safety', 0.1, 2.6, 0.1, cx0 + 0.4, 1.3, 1.6);
        box(f, 'safety', 0.1, 2.6, 0.1, cx0 - 0.4, 1.3, 2.7); box(f, 'safety', 0.1, 2.6, 0.1, cx0 + 0.4, 1.3, 2.7);
        box(f, 'safety', 1.0, 0.12, 1.3, cx0, 2.6, 2.15);
        var jib = new THREE.Group(); jib.position.set(cx0, 2.75, 2.15); f.add(jib);
        box(jib, 'safety', 0.12, 0.12, 4.2, 0, 0, 1.3);
        var hook = box(f, 'dark', 0.25, 0.25, 0.25, cx0, 2.0, 3.0);
        var cab = box(f, 'steel', 0.4, 0.3, 0.3, cx0, 2.6, 2.15); void cab;
        tk.push(function (sec) { hook.position.z = ambient ? 3.4 + Math.sin(sec * 0.5) * 1.0 : 3.4; hook.position.y = ambient && on ? 1.9 + Math.sin(sec * 1.0) * 0.4 : 2.0; });
        // dermaga kayu + kapal kargo
        for (i = 0; i < 5; i++) box(f, 'wood', 1.4, 0.12, 1.55, cx0, 0.02, 3.3 + i * 1.55);
        box(f, 'metal', 0.18, 0.5, 0.18, cx0 - 0.8, 0.2, 3.3 + 4 * 1.55 + 0.6); box(f, 'metal', 0.18, 0.5, 0.18, cx0 + 0.8, 0.2, 3.3 + 4 * 1.55 + 0.6);
        var ship = new THREE.Group(); ship.position.set(cx0 + 1.6, -0.1, 3.3 + 4 * 1.55 + 0.9); f.add(ship);
        box(ship, 'hull', 1.2, 0.55, 3.8, 0, 0.1, 0); box(ship, 'red', 1.22, 0.14, 3.82, 0, 0.0, 0);
        box(ship, 'white', 0.9, 0.7, 0.6, 0, 0.75, -1.3); box(ship, 'glass', 0.92, 0.18, 0.62, 0, 0.9, -1.3);
        var nShipBoxes = clamp(big, 1, 6);
        for (i = 0; i < nShipBoxes; i++) box(ship, [ACC.hub, 'red', 'amber', 'green', 'steel', 'crate'][i % 6], 0.5, 0.4, 0.62, (i % 2 ? 0.28 : -0.28), 0.6, 1.0 - Math.floor(i / 2) * 0.7);
        tk.push(function (sec) { ship.position.y = ambient ? -0.1 + Math.sin(sec * 0.9) * 0.04 : -0.1; ship.rotation.z = ambient ? Math.sin(sec * 0.7) * 0.02 : 0; });
        beacon(f, -dm.bw / 2 + 0.3, dm.bh + 0.3, ZC - 0.1, tk, st.producing || on, 'hub');
    };

    // ---------- konstruksi (perancah + crane + bangunan tumbuh + bar progres) ----------
    function construction(f, def, st, tk) {
        var b = st.building, L = Math.max(1, b.target), dm = dimsFor(def, L);
        var bw = dm.bw, bd = dm.bd, bh = dm.bh, zc = ZC;
        if (def.kind === 'fab') zc = ZC - 0.1;
        var h = Math.max(0.12, b.pct * bh);
        if (b.isBuild) box(f, 'wall', bw * 0.94, h, bd * 0.94, 0, h / 2, zc);                    // bangunan tumbuh
        else {                                                         // upgrade: lantai tambahan tumbuh di sebelah bangunan lama
            var ex = Math.max(0.12, b.pct * 1.2);
            box(f, 'wall', 1.4, ex, bd * 0.9, bw / 2 + 0.9, ex / 2, zc);
        }
        var px = [-bw / 2 - 0.05, bw / 2 + 0.05];
        px.forEach(function (x) { [zc - bd / 2 - 0.05, zc + bd / 2 + 0.05].forEach(function (z) { box(f, 'safety', 0.09, bh + 0.5, 0.09, x, (bh + 0.5) / 2, z); }); });
        for (var lv = 1; lv <= 3; lv++) {
            var y = (bh + 0.5) * lv / 3;
            box(f, 'safety', bw + 0.1, 0.05, 0.05, 0, y, zc + bd / 2 + 0.05); box(f, 'safety', 0.05, 0.05, bd + 0.1, bw / 2 + 0.05, y, zc);
            box(f, 'safety', bw + 0.1, 0.05, 0.05, 0, y, zc - bd / 2 - 0.05); box(f, 'safety', 0.05, 0.05, bd + 0.1, -bw / 2 - 0.05, y, zc);
        }
        // crane menara dengan lengan berputar
        var cxp = -bw / 2 - 0.9, cz = zc - bd / 2 + 0.2, th = bh + 1.8;
        box(f, 'amber', 0.16, th, 0.16, cxp, th / 2, cz);
        var arm = new THREE.Group(); arm.position.set(cxp, th, cz); f.add(arm);
        box(arm, 'amber', 3.2, 0.12, 0.12, 1.0, 0, 0); box(arm, 'amber', 0.7, 0.12, 0.12, -0.9, 0, 0); box(arm, 'dark', 0.3, 0.3, 0.3, -1.05, -0.18, 0);
        var hook = box(arm, 'dark', 0.08, 0.5, 0.08, 1.6, -0.3, 0);
        box(arm, ACC[def.id], 0.28, 0.22, 0.28, 1.6, -0.62, 0);
        tk.push(function (sec) { arm.rotation.y = ambient ? sec * 0.35 : 0.5; hook.scale.y = 1 + Math.sin(sec * 1.2) * 0.2; });
        // bar progres melayang
        var barG = new THREE.Group(); barG.position.set(0, bh + 2.5, zc + 0.2); barG.rotation.y = Math.PI / 4; f.add(barG);
        box(barG, 'barBg', 2.4, 0.2, 0.06, 0, 0, 0);
        var fillW = Math.max(0.02, 2.3 * b.pct);
        box(barG, GLOW[def.id], fillW, 0.14, 0.08, -1.15 + fillW / 2, 0, 0.01);
        box(f, 'dark', 0.5, 0.05, 0.9, bw / 2 + 0.3, 0.05, zc + bd / 2 + 1.0);                         // timbunan material
        box(f, 'crate', 0.4, 0.3, 0.4, bw / 2 + 0.3, 0.2, zc + bd / 2 + 1.0);
        return { top: bh + 3.1 };
    }

    function ghostBuilding(f, def, locked) {
        var dm = dimsFor(def, 2), zc = def.kind === 'fab' ? ZC - 0.1 : ZC;
        var gm = locked ? M.lockGhost : GHOST[def.id], em = locked ? M.lockEdge : EDGE[def.id];
        var bw = def.kind === 'fab' ? 9.0 : dm.bw, bh = dm.bh;
        box(f, gm, bw, bh, dm.bd, 0, bh / 2, zc);
        edges(f, em, bw, bh, dm.bd, 0, bh / 2, zc);
        // patok sudut
        [-1, 1].forEach(function (sx) { [-1, 1].forEach(function (sz) { var k = mesh(f, G.cone, locked ? 'lock' : 'safety', 0.1, 0.32, 0.1, sx * (bw / 2 + 0.25), 0.16, zc + sz * (dm.bd / 2 + 0.25)); k.castShadow = false; }); });
        if (locked) {                                                // gembok
            box(f, 'lock', 0.62, 0.46, 0.24, 0, 0.48, zc + dm.bd / 2 + 0.6);
            var shk = mesh(f, G.tor, 'lock', 0.2, 0.26, 0.2, 0, 0.86, zc + dm.bd / 2 + 0.6); shk.scale.set(0.2, 0.26, 0.2);
            box(f, 'dark', 0.07, 0.13, 0.26, 0, 0.48, zc + dm.bd / 2 + 0.6);
        } else {                                                     // papan "bangun di sini"
            box(f, 'metal', 0.08, 0.9, 0.08, 0, 0.45, zc + dm.bd / 2 + 0.6);
            box(f, GLOW[def.id], 0.9, 0.5, 0.06, 0, 1.05, zc + dm.bd / 2 + 0.6);
            box(f, 'white', 0.5, 0.1, 0.07, 0, 1.05, zc + dm.bd / 2 + 0.63);
            box(f, 'white', 0.1, 0.5 * 0.5, 0.07, 0, 1.05, zc + dm.bd / 2 + 0.63);
        }
        return { top: bh + 0.8 };
    }

    // ---------- bangun ulang satu petak ----------
    function clearFurn(r) {
        var f = r.furn;
        for (var i = f.children.length - 1; i >= 0; i--) f.remove(f.children[i]);
    }
    function rebuildLabel(r) {
        if (r.label) {
            r.group.remove(r.label);
            if (r.label.material) r.label.material.dispose();
            var ix = labelTex.indexOf(r.label.userData.tex);
            if (r.label.userData.tex) { r.label.userData.tex.dispose(); if (ix >= 0) labelTex.splice(ix, 1); }
        }
        var st = r.st;
        var text = (st && st.status === 'locked' ? '🔒 ' : '') + plotTitle(r.def.id) + (st && st.status === 'built' && st.kind !== 'hub' ? ' · Lv ' + st.level : '');
        r.label = makeLabel(text, dark, !!(st && st.status === 'locked'), r.def.accent);
        r.label.position.set(0, r.labelY || 2.4, 0.9);
        r.group.add(r.label);
    }
    function rebuildAlert(r) {
        if (r.alertSp) { r.group.remove(r.alertSp); if (r.alertSp.material) r.alertSp.material.dispose(); r.alertSp = null; }
        if (!r.st || !r.st.alert || !r.label) return;
        var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: alertTexture(r.st.alert.lvl), transparent: true, depthTest: false }));
        sp.scale.set(0.42, 0.42, 1);
        sp.renderOrder = 21;
        var lp = r.label.position, off = (r.label.scale.x / 2 + 0.24) * 0.7071;
        sp.position.set(lp.x + off, lp.y + 0.04, lp.z - off);
        r.alertBase = sp.position.y;
        r.group.add(sp);
        r.alertSp = sp;
    }
    function rebuildPlot(r, st) {
        clearFurn(r);
        r.st = st;
        r.tick = null;
        var tk = [], top = 2.2, f = r.furn, def = r.def;
        var on = !!st.producing;
        try {
            if (st.building) {
                if (st.status === 'built') {                           // upgrade: bangunan lama tetap ada + perancah
                    TYPE[def.kind === 'plant' ? def.id : def.kind](f, def, st.level, st, tk, on);
                    top = construction(f, def, st, tk).top;
                } else top = construction(f, def, st, tk).top;
            } else if (st.status === 'built') {
                var key = def.kind === 'plant' ? def.id : def.kind;
                TYPE[key](f, def, st.level, st, tk, on);
                var dm = dimsFor(def, st.level);
                top = dm.bh + (key === 'display' ? 1.9 : key === 'fab' ? 2.8 : key === 'soc' ? 1.9 : key === 'ram' ? 1.6 : key === 'hub' ? 1.4 : 1.2);
                if (def.kind === 'plant') levelPips(f, def.id, st.level, 4);
                if (def.kind !== 'hub') crateStacks(f, st.stock, -2.6, 2.1, def.id);
            } else {
                top = ghostBuilding(f, def, st.status === 'locked').top;
            }
        } catch (e) { console.warn('[ManufactureScene] gagal bangun ' + def.id, e); }
        if (tk.length) {
            r.tick = function (sec) { for (var i = 0; i < tk.length; i++) tk[i](sec); };
            r.tick(0);
        }
        animPlots = plotList.filter(function (x) { return !!x.tick; });
        r.labelY = top + 0.25;
        rebuildLabel(r);
        rebuildAlert(r);
        rig.requestShadowUpdate();
    }

    // ---------- tema ----------
    function applyTheme() {
        dark = document.documentElement.getAttribute('data-theme') === 'dark';
        var ac = new THREE.Color();
        try { ac.set(readAccent()); } catch (e) { ac.setHex(0x2563eb); }
        accentHex = ac.getHex();
        var ix = dark ? 1 : 0;
        Object.keys(COLORS).forEach(function (k) { M[k].color.setHex(COLORS[k][ix]); });
        M.win.emissive.setHex(dark ? tint(COLORS.win[1], -0.35) : 0x000000);
        M.shade.opacity = dark ? 0.22 : 0.14;
        farCampus.setDark(dark);
        M.selRing.color.setHex(accentHex);
        M.lamp.color.setHex(dark ? 0xffe39a : 0xfff1c4);
        lampPosts.forEach(function (l) { var s = dark ? 0.16 : 0.12; l.scale.set(s, s, s); });
        rig.applyTheme(dark);
        plotList.forEach(function (r) { if (r.st) rebuildLabel(r); if (r.st) rebuildAlert(r); });
        rig.requestShadowUpdate();
    }

    // ============================================================
    // KAMERA
    // ============================================================
    var controls;
    function applyCamera() {
        var v = controls.view;
        var h = BASE_VIEW / v.zoom, w = h * aspect;
        var sh = shiftPx ? (shiftPx / 2) / Math.max(1, container.clientHeight) * h : 0;
        camera.left = -w / 2; camera.right = w / 2; camera.top = h / 2 - sh; camera.bottom = -h / 2 - sh;
        camera.position.set(v.x + 30, 30, v.z + 30);
        camera.lookAt(v.x, 0, v.z);
        camera.updateProjectionMatrix();
    }
    function fitZoom() { return clamp(Math.min(1.0, aspect * 0.52, 0.74), 0.2, 3); }
    function tweenView(tx, tz, tzoom) {
        if (focusRaf) cancelAnimationFrame(focusRaf);
        var v = controls.view, x0 = v.x, z0 = v.z, k0 = v.zoom, s0 = shiftPx, t0 = performance.now(), DUR = 420;
        if (prefersReducedMotion()) { v.x = tx; v.z = tz; v.zoom = tzoom; shiftPx = shiftTarget; applyCamera(); requestRender(); return; }
        function step(now) {
            focusRaf = 0;
            if (disposed) return;
            var p = Math.min(1, (now - t0) / DUR), e = 1 - Math.pow(1 - p, 3);
            v.x = x0 + (tx - x0) * e; v.z = z0 + (tz - z0) * e; v.zoom = k0 + (tzoom - k0) * e;
            shiftPx = s0 + (shiftTarget - s0) * e;
            applyCamera(); requestRender();
            if (p < 1) focusRaf = requestAnimationFrame(step);
        }
        focusRaf = requestAnimationFrame(step);
    }
    function updateShift() {
        var H = container.clientHeight || 0, want = 0;
        if (card.style.display !== 'none' && container.clientWidth < NARROW_PX) want = Math.min(card.offsetHeight + 12, H * 0.5);
        if (Math.abs(want - shiftTarget) < 1) return;
        shiftTarget = want;
        var v = controls.view;
        tweenView(v.x, v.z, v.zoom);
    }
    function resetView() { tweenView(0, 0, fitZoom()); }
    function focusPlot(id) {
        var r = plots[id];
        if (!r) return;
        tweenView(r.def.x, r.def.z, Math.max(controls.view.zoom, id === 'fab' ? 0.8 : 1.15));
    }

    // ============================================================
    // EFEK KEJADIAN (partikel + label melayang)
    // ============================================================
    var FX_MAX = 6, FX_LIFE = 2.2, FX_G = 3.4, FX_PARTS = 16;
    var FX_COLORS = { gold: 0xf5c542, green: 0x43c07a, cyan: 0x00b8d9, red: 0xff4d4d };
    var fxList = [], fxMatMap = {};
    function fxMaterial(kind) {
        if (!fxMatMap[kind]) fxMatMap[kind] = new THREE.MeshBasicMaterial({ color: FX_COLORS[kind] || 0xffffff });
        return fxMatMap[kind];
    }
    function endFx(i) {
        var fx = fxList[i];
        scene.remove(fx.group);
        if (fx.label) {
            fx.group.remove(fx.label);
            if (fx.label.material) fx.label.material.dispose();
            var tx = fx.label.userData.tex;
            if (tx) { tx.dispose(); var ix = labelTex.indexOf(tx); if (ix >= 0) labelTex.splice(ix, 1); }
        }
        fxList.splice(i, 1);
    }
    function celebrate(plotId, kind, text) {
        if (disposed || !ambient) return;
        var r = plots[plotId];
        if (!r || (r.st && r.st.status === 'locked')) return;
        while (fxList.length >= FX_MAX) endFx(0);
        var g = new THREE.Group(), parts = [], i, a, sp, m;
        g.position.set(r.def.x, PAD_TOP, r.def.z);
        for (i = 0; i < FX_PARTS; i++) {
            a = (i / FX_PARTS) * Math.PI * 2 + Math.random() * 0.4; sp = 0.9 + Math.random() * 1.1;
            m = new THREE.Mesh(G.box, fxMaterial(kind));
            m.scale.setScalar(0.08 + Math.random() * 0.06);
            m.position.set(0, 0.9, 0);
            m.userData.vx = Math.cos(a) * sp; m.userData.vz = Math.sin(a) * sp; m.userData.vy = 2.2 + Math.random() * 1.2; m.userData.s = m.scale.x;
            g.add(m); parts.push(m);
        }
        var lbl = null;
        if (text) { lbl = makeLabel(text, dark, false, r.def.accent); lbl.position.set(0, 2.6, 0); lbl.renderOrder = 23; g.add(lbl); }
        scene.add(g);
        fxList.push({ group: g, parts: parts, label: lbl, t0: performance.now() / 1000 });
        requestRender();
    }
    function updateFx(sec) {
        for (var i = fxList.length - 1; i >= 0; i--) {
            var fx = fxList[i], tau = Math.max(0, sec - fx.t0);
            if (tau >= FX_LIFE) { endFx(i); continue; }
            var p = tau / FX_LIFE, k = 1 - p;
            for (var q = 0; q < fx.parts.length; q++) {
                var m = fx.parts[q], u = m.userData, py = 0.9 + u.vy * tau - 0.5 * FX_G * tau * tau;
                m.position.set(u.vx * tau, Math.max(0.06, py), u.vz * tau);
                var sc = Math.max(0.001, k) * u.s; m.scale.set(sc, sc, sc);
            }
            if (fx.label) { fx.label.position.y = 2.6 + p * 0.5; fx.label.material.opacity = p < 0.7 ? 1 : Math.max(0, (1 - p) / 0.3); }
        }
    }

    // ============================================================
    // ANIMASI AMBIEN: truk, wafer di pipa, peringatan
    // ============================================================
    var activeTrucks = 1;
    function animateShell(sec) {
        var i, k, tr, u;
        for (i = 0; i < truckObjs.length; i++) {
            tr = truckObjs[i];
            tr.g.visible = i < activeTrucks;
            if (!tr.g.visible) continue;
            u = ((sec * TRUCK_RATE + tr.off) % 1);
            var x = tr.dir > 0 ? TRUCK_X0 + u * (TRUCK_X1 - TRUCK_X0) : TRUCK_X1 - u * (TRUCK_X1 - TRUCK_X0);
            tr.g.position.set(x, linkBridge.heightAt(x), tr.lane);
            tr.g.scale.setScalar(Math.max(0.001, Math.min(1, u / 0.05, (1 - u) / 0.05)));   // muncul/hilang halus di ujung jalan
        }
        for (i = 0; i < pipeObjs.length; i++) {
            var po = pipeObjs[i];
            if (!po.active) continue;
            for (k = 0; k < po.cubes.length; k++) {
                var d = ((sec * 0.35 + k / po.cubes.length) % 1) * po.total, s = 1;
                while (s < po.lens.length - 1 && d > po.lens[s]) s++;
                var a = po.pts[s - 1], b = po.pts[s], seg = po.lens[s] - po.lens[s - 1] || 1, f = clamp((d - po.lens[s - 1]) / seg, 0, 1);
                po.cubes[k].position.set(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f);
            }
        }
        for (i = 0; i < plotList.length; i++) {
            var sp = plotList[i].alertSp;
            if (!sp) continue;
            var bad = plotList[i].st && plotList[i].st.alert && plotList[i].st.alert.lvl === 'bad';
            sp.position.y = plotList[i].alertBase + Math.sin(sec * (bad ? 5 : 3) + i) * 0.05;
            var sc = bad ? 0.42 + Math.sin(sec * 5 + i) * 0.03 : 0.42;
            sp.scale.set(sc, sc, 1);
        }
    }
    function syncShell() {
        var active = 0;
        plotList.forEach(function (r) { if (r.st && r.st.producing) active++; });
        activeTrucks = clamp(1 + active, 1, truckObjs.length);
        pipeObjs.forEach(function (po) {
            var a = states[po.from], b = states[po.to];
            var on = !!(a && b && a.status === 'built' && b.status === 'built' && !a.building && !b.building);
            po.active = on;
            po.glow.forEach(function (g) { g.visible = on; });
            po.cubes.forEach(function (c) { c.visible = on; });
        });
    }

    // ============================================================
    // RENDER LOOP
    // ============================================================
    function watchQuality(now) {
        if (quality.lowered || !lastRendered || getRenderFps() > 30) { lastRendered = now; return; }
        var gap = now - lastRendered;
        lastRendered = now;
        if (gap > quality.frameMs * 2) quality.slow++; else if (quality.slow > 0) quality.slow -= 0.25;
        if (quality.slow >= 24) {
            quality.lowered = true; quality.frameMs = 50;
            renderer.setPixelRatio(1);
            if (lastW && lastH) renderer.setSize(lastW, lastH, false);
        }
    }
    function scheduleNext() {
        var fm = frameGapMs(PERF.frameMs, quality.frameMs);
        var wait = fm - (performance.now() - lastFrame) - 5;
        if (wait > 4) loopTimer = setTimeout(function () { loopTimer = 0; loopRaf = requestAnimationFrame(frame); }, wait);
        else loopRaf = requestAnimationFrame(frame);
    }
    function frame(now) {
        loopRaf = 0;
        if (disposed || document.hidden || !inView) { lastRendered = 0; return; }
        if (now - lastFrame < frameGapMs(PERF.frameMs, quality.frameMs) - 2) { scheduleNext(); return; }
        lastFrame = now;
        scheduleNext();
        if (ctxLost) return;
        var sec = now / 1000;
        for (var i = 0; i < animPlots.length; i++) animPlots[i].tick(sec);
        animateShell(sec);
        if (fxList.length) updateFx(sec);
        renderer.render(scene, camera);
        watchQuality(now);
    }
    function startLoop() {
        if (!ambient || loopRaf || loopTimer || disposed || document.hidden || !inView) return;
        lastRendered = 0;
        loopRaf = requestAnimationFrame(frame);
    }
    function requestRender() {
        if (ambient) { startLoop(); if (loopRaf || loopTimer) return; }
        if (raf || disposed) return;
        raf = requestAnimationFrame(function () {
            raf = 0;
            if (disposed || document.hidden || ctxLost) return;
            animateShell(performance.now() / 1000);
            renderer.render(scene, camera);
        });
    }

    // ============================================================
    // UI: chip pabrik + kartu info + legenda
    // ============================================================
    var chipBar = document.createElement('div');
    chipBar.className = 'manu-chips';
    chipBar.style.cssText = 'position:absolute;left:8px;right:44px;top:8px;z-index:3;display:flex;gap:6px;overflow-x:auto;touch-action:pan-x;scrollbar-width:none;padding:2px 0;' +
        '-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 22px),transparent);mask-image:linear-gradient(to right,#000 calc(100% - 22px),transparent);';
    container.appendChild(chipBar);
    var card = document.createElement('div');
    card.className = 'manu-card';
    card.style.cssText = 'position:absolute;z-index:3;display:none;box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;' +
        'padding:12px 14px;border-radius:14px;background:var(--bg-2);color:var(--text-primary);border:1px solid var(--border);box-shadow:var(--shadow);';
    card.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    container.appendChild(card);
    function isNarrow() { return container.clientWidth < NARROW_PX; }
    function applyCardLayout() {
        var cs = card.style;
        if (isNarrow()) {
            cs.left = '10px'; cs.right = '10px'; cs.width = 'auto'; cs.bottom = 'calc(10px + env(safe-area-inset-bottom, 0px))'; cs.maxHeight = 'min(46%, 340px)';
        } else {
            cs.left = '12px'; cs.right = 'auto'; cs.width = 'min(380px, 44%)'; cs.bottom = '12px'; cs.maxHeight = '72%';
        }
    }
    applyCardLayout();
    var hint = document.createElement('div');
    hint.style.cssText = 'position:absolute;left:12px;bottom:10px;z-index:2;font-size:11px;pointer-events:none;color:var(--text-tertiary);max-width:80%;transition:opacity .4s;';
    hint.textContent = ms('hint');
    container.appendChild(hint);
    var legendBtn = document.createElement('button');
    legendBtn.type = 'button'; legendBtn.textContent = 'ⓘ'; legendBtn.setAttribute('aria-label', 'legend'); legendBtn.setAttribute('aria-expanded', 'false');
    legendBtn.style.cssText = 'position:absolute;right:8px;top:8px;z-index:4;width:32px;height:32px;border-radius:50%;border:1px solid var(--border);background:var(--bg-2);color:var(--text-primary);font-size:15px;line-height:1;cursor:pointer;padding:0;';
    container.appendChild(legendBtn);
    var legend = document.createElement('div');
    legend.style.cssText = 'position:absolute;right:8px;top:46px;z-index:4;display:none;max-width:250px;padding:10px 12px;border-radius:12px;background:var(--bg-2);color:var(--text-primary);' +
        'border:1px solid var(--border);box-shadow:var(--shadow);font-size:11.5px;line-height:1.5;max-height:calc(100% - 60px);overflow-y:auto;';
    legend.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    container.appendChild(legend);
    function rebuildLegend() {
        legend.innerHTML = '';
        var h1 = document.createElement('div');
        h1.style.cssText = 'font-weight:800;font-size:12px;margin-bottom:2px;';
        h1.textContent = ms('lg.title');
        legend.appendChild(h1);
        [['lg.run', '#43c07a'], ['lg.crane', '#ffc247'], ['lg.ghost', '#f97316'], ['lg.lock', '#8b97ad'], ['lg.pipe', '#b7c0cd'], ['lg.crate', '#c99a62'], ['lg.alert', '#ef4444']].forEach(function (p) {
            var row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:7px;margin-top:3px;';
            var sw = document.createElement('span');
            sw.style.cssText = 'flex:0 0 auto;width:10px;height:10px;border-radius:3px;background:' + p[1] + ';';
            var tx = document.createElement('span'); tx.textContent = ms(p[0]);
            row.appendChild(sw); row.appendChild(tx); legend.appendChild(row);
        });
    }
    legendBtn.addEventListener('click', function () {
        legendOn = !legendOn;
        legend.style.display = legendOn ? 'block' : 'none';
        legendBtn.setAttribute('aria-expanded', legendOn ? 'true' : 'false');
        if (legendOn) rebuildLegend();
    });
    function mkBtn(label, primary, tall) {
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = label;
        b.style.cssText = 'border:1px solid ' + (primary ? 'var(--accent)' : 'var(--border)') + ';background:' + (primary ? 'var(--accent)' : 'var(--bg-3)') + ';color:' + (primary ? '#fff' : 'var(--text-primary)') +
            ';border-radius:999px;padding:7px 14px;font-size:12.5px;font-weight:700;cursor:pointer;' + (tall ? 'min-height:' + (isNarrow() ? 40 : 34) + 'px;' : '');
        return b;
    }
    var lastCentered = null;
    function rebuildChips() {
        var selId = selected || '';
        var parts = [selId, ms('all')];
        CHIP_ORDER.forEach(function (id) { var s = states[id]; parts.push(id + ':' + (s && s.status === 'locked' ? 0 : 1) + ':' + (s && s.alert ? s.alert.lvl : '') + ':' + plotTitle(id)); });
        var sig = parts.join('|');
        if (sig === chipSig) return;
        chipSig = sig;
        var keepLeft = chipBar.scrollLeft, selBtn = null;
        chipBar.innerHTML = '';
        var all = mkBtn(ms('all'), false);
        all.style.padding = '6px 12px'; all.style.fontSize = '11.5px'; all.style.flex = '0 0 auto'; all.style.background = 'var(--bg-2)';
        all.addEventListener('click', function () { select(null); resetView(); });
        chipBar.appendChild(all);
        CHIP_ORDER.forEach(function (id) {
            var s = states[id], open = !(s && s.status === 'locked'), isSel = selId === id;
            var b = mkBtn((open ? '' : '🔒 ') + plotTitle(id), isSel);
            b.style.padding = '6px 12px'; b.style.fontSize = '11.5px'; b.style.flex = '0 0 auto'; b.style.whiteSpace = 'nowrap';
            if (!isSel) b.style.background = 'var(--bg-2)';
            if (!open) b.style.opacity = '0.7';
            if (open && s && s.alert) {
                var dot = document.createElement('span');
                dot.textContent = ' ●';
                dot.style.cssText = 'color:' + (s.alert.lvl === 'bad' ? '#ef4444' : '#f59e0b') + ';';
                b.appendChild(dot);
            }
            b.addEventListener('click', function () { select(id); focusPlot(id); });
            chipBar.appendChild(b);
            if (isSel) selBtn = b;
        });
        chipBar.scrollLeft = keepLeft;
        if (selBtn && lastCentered !== selId) {
            var left = selBtn.offsetLeft - (chipBar.clientWidth - selBtn.offsetWidth) / 2;
            try { chipBar.scrollTo({ left: Math.max(0, left), behavior: prefersReducedMotion() ? 'auto' : 'smooth' }); } catch (e) { chipBar.scrollLeft = Math.max(0, left); }
        }
        lastCentered = selId || null;
    }
    function goTo(g) { if (g) bus.emit('advisor:go', { nav: g.nav, subtab: g.subtab }); }
    function doAction(a) {
        if (!a || busy) return;
        if (a.disabled) { try { if (a.note) ToastService.info(a.note); } catch (e) {} return; }
        busy = true;
        var res = null;
        try { res = runAction(a); } catch (e) { console.warn('[ManufactureScene] aksi gagal:', e); res = { ok: false, reason: String((e && e.message) || e) }; }
        if (res && res.ok === false && res.reason) { try { ToastService.error(res.reason); } catch (e2) {} }
        else { try { if (navigator.vibrate) navigator.vibrate(15); } catch (e3) {} }
        setTimeout(function () { busy = false; }, 350);
    }
    function cardSignature(info) {
        return JSON.stringify([info.title, info.badge, info.lines, (info.actions || []).map(function (a) { return [a.id, a.label, a.note, a.disabled ? 1 : 0]; }),
            info.go ? info.go.label : '', info.go2 ? info.go2.label : '', cardCollapsed ? 1 : 0, isNarrow() ? 1 : 0, info.alert ? info.alert.key : '']);
    }
    function refreshCard() {
        var info = null;
        if (selected && lastData) info = describePlot(selected, lastData);
        if (!info) {
            card.style.display = 'none'; cardSig = '';
            hint.style.display = hintGone ? 'none' : '';
            if (cardWasVisible) { cardWasVisible = false; updateShift(); }
            return;
        }
        var sig = cardSignature(info);
        if (sig === cardSig && card.style.display !== 'none') return;
        cardSig = sig;
        var keepScroll = card.scrollTop;
        applyCardLayout();
        card.innerHTML = '';
        var head = document.createElement('div');
        head.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:' + (cardCollapsed ? '0' : '6px') + ';';
        var ttl = document.createElement('div');
        ttl.style.cssText = 'font-size:15px;font-weight:800;letter-spacing:-0.01em;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        ttl.textContent = info.title;
        var badge = document.createElement('span');
        badge.style.cssText = 'font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--accent-soft);color:var(--accent);white-space:nowrap;';
        badge.textContent = info.badge;
        head.appendChild(ttl); head.appendChild(badge);
        if (isNarrow()) {
            var tg = document.createElement('button');
            tg.type = 'button'; tg.textContent = cardCollapsed ? '▴' : '▾';
            tg.setAttribute('aria-label', ms(cardCollapsed ? 'expand' : 'collapse'));
            tg.setAttribute('aria-expanded', cardCollapsed ? 'false' : 'true');
            tg.style.cssText = 'border:none;background:transparent;color:var(--text-tertiary);font-size:16px;cursor:pointer;padding:4px 8px;min-width:36px;min-height:36px;';
            tg.addEventListener('click', function () { cardCollapsed = !cardCollapsed; cardSig = ''; refreshCard(); });
            head.appendChild(tg);
        }
        var x = document.createElement('button');
        x.type = 'button'; x.textContent = '✕'; x.setAttribute('aria-label', ms('close'));
        x.style.cssText = 'border:none;background:transparent;color:var(--text-tertiary);font-size:15px;cursor:pointer;padding:4px 8px;min-width:36px;min-height:36px;';
        x.addEventListener('click', function () { select(null); });
        head.appendChild(x);
        card.appendChild(head);
        if (!(cardCollapsed && isNarrow())) {
            var lines = document.createElement('div');
            lines.style.cssText = 'font-size:12.5px;line-height:1.55;color:var(--text-secondary, var(--text-tertiary));';
            (info.lines || []).forEach(function (ln) { var d = document.createElement('div'); d.textContent = ln; lines.appendChild(d); });
            if (info.alert) {
                var al = document.createElement('div');
                al.style.cssText = 'font-weight:700;color:' + (info.alert.lvl === 'bad' ? '#ef4444' : '#f59e0b') + ';';
                al.textContent = '⚠ ' + ms(info.alert.key, info.alert.vars);
                lines.appendChild(al);
            }
            card.appendChild(lines);
            if (info.actions && info.actions.length) {
                var arow = document.createElement('div');
                arow.style.cssText = 'display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;align-items:flex-start;';
                info.actions.forEach(function (a) {
                    var wrap = document.createElement('div');
                    wrap.style.cssText = 'display:flex;flex-direction:column;gap:3px;max-width:100%;';
                    var ab = mkBtn(a.label, !a.disabled, true);
                    if (a.disabled) { ab.style.opacity = '0.55'; ab.style.background = 'var(--bg-3)'; ab.style.color = 'var(--text-primary)'; ab.style.borderColor = 'var(--border)'; ab.style.cursor = 'not-allowed'; }
                    ab.setAttribute('aria-disabled', a.disabled ? 'true' : 'false');
                    ab.addEventListener('click', function () { doAction(a); });
                    wrap.appendChild(ab);
                    if (a.note) {
                        var nt = document.createElement('div');
                        nt.style.cssText = 'font-size:11px;color:var(--text-tertiary);padding:0 6px;';
                        nt.textContent = a.note;
                        wrap.appendChild(nt);
                    }
                    arow.appendChild(wrap);
                });
                card.appendChild(arow);
            }
            if (info.go || info.go2) {
                var row = document.createElement('div');
                row.style.cssText = 'display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;';
                var hasActions = !!(info.actions && info.actions.length);
                if (info.go) { var b1 = mkBtn(info.go.label, !hasActions, true); b1.addEventListener('click', function () { goTo(info.go); }); row.appendChild(b1); }
                if (info.go2) { var b2 = mkBtn(info.go2.label, false, true); b2.addEventListener('click', function () { goTo(info.go2); }); row.appendChild(b2); }
                card.appendChild(row);
            }
        }
        card.style.display = 'block';
        card.scrollTop = keepScroll;
        hint.style.display = 'none';
        cardWasVisible = true;
        updateShift();
    }
    function select(id) {
        selected = id;
        if (id) hintGone = true;
        plotList.forEach(function (r) { r.ov.visible = (id === r.def.id); });
        cardSig = '';
        refreshCard();
        rebuildChips();
        requestRender();
    }
    function handleTap(cx, cy) {
        if (disposed) return;
        var rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
        scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
        raycaster.setFromCamera(ndc, camera);
        var hits = raycaster.intersectObjects(plotList.map(function (r) { return r.group; }), true);
        var plotId = null;
        for (var i = 0; i < hits.length && !plotId; i++) {
            if (hits[i].object.isSprite || hits[i].object.isLineSegments) continue;
            var o = hits[i].object;
            while (o) { if (o.userData && o.userData.plotId) { plotId = o.userData.plotId; break; } o = o.parent; }
        }
        if (!plotId) { select(null); return; }
        select(plotId);
    }

    controls = createCampusControls(canvas, {
        unitsPerPixel: function (zoom) { return (BASE_VIEW / zoom) / Math.max(1, container.clientHeight); },
        minZoom: 0.2, maxZoom: 3,
        bounds: { minX: -20, maxX: LINK.OFFSET - 12, minZ: -20, maxZ: 20 },   // geser ke timur sampai jembatan/Pulau Kampus
        onChange: function () { applyCamera(); requestRender(); },
        onTap: handleTap
    });

    function resize() {
        if (disposed || resizeScheduled) return;
        resizeScheduled = true;
        requestAnimationFrame(function () {
            resizeScheduled = false;
            if (disposed || document.hidden) return;
            var w = container.clientWidth, h = container.clientHeight;
            if (!w || !h) return;
            if (Math.abs(w - lastW) < MIN_RESIZE_DELTA && Math.abs(h - lastH) < MIN_RESIZE_DELTA) return;
            lastW = w; lastH = h;
            renderer.setSize(w, h, false);
            aspect = w / h;
            if (!fitted) { fitted = true; controls.view.zoom = fitZoom(); }
            applyCardLayout();
            cardSig = ''; chipSig = '';
            refreshCard(); rebuildChips();
            applyCamera();
            requestRender();
        });
    }

    // ---------- sinkron dengan state game ----------
    function update(data) {
        if (disposed || !data) return;
        lastData = data;
        states = allStates(data);
        plotList.forEach(function (r) {
            var st = states[r.def.id], sig = plotSig(st, data);
            if (sig === r.sig) { r.st = st; return; }
            r.sig = sig;
            rebuildPlot(r, st);
        });
        syncShell();
        rebuildChips();
        refreshCard();
        requestRender();
    }
    function relabel() {
        hint.textContent = ms('hint');
        canvas.setAttribute('aria-label', ms('aria'));
        plotList.forEach(function (r) { rebuildLabel(r); rebuildAlert(r); });
        if (legendOn) rebuildLegend();
        chipSig = ''; cardSig = '';
        rebuildChips(); refreshCard(); requestRender();
    }
    function onVis() { if (!document.hidden) requestRender(); }
    var io = null;
    if (typeof IntersectionObserver !== 'undefined') {
        io = new IntersectionObserver(function (en) { inView = en[en.length - 1].isIntersecting; if (inView) requestRender(); });
        io.observe(container);
    }
    document.addEventListener('visibilitychange', onVis);
    function onCtxLost(e) { e.preventDefault(); ctxLost = true; }
    function onCtxRestored() { ctxLost = false; rig.requestShadowUpdate(); requestRender(); }
    canvas.addEventListener('webglcontextlost', onCtxLost);
    canvas.addEventListener('webglcontextrestored', onCtxRestored);
    var ro = null;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(resize); ro.observe(container); }
    else window.addEventListener('resize', resize);

    applyTheme();
    update(gameState);
    resize();

    return {
        update: update,
        refreshTheme: function () { applyTheme(); if (lastData) { plotList.forEach(function (r) { r.sig = null; }); update(lastData); } else requestRender(); },
        relabel: relabel,
        celebrate: celebrate,
        select: function (id) { if (!PLOT_BY_ID[id] && id) return false; select(id || null); if (id) focusPlot(id); return true; },
        getSelected: function () { return selected; },
        isDisposed: function () { return disposed; },
        dispose: function () {
            disposed = true;
            if (raf) cancelAnimationFrame(raf);
            if (loopRaf) cancelAnimationFrame(loopRaf);
            if (loopTimer) { clearTimeout(loopTimer); loopTimer = 0; }
            if (focusRaf) cancelAnimationFrame(focusRaf);
            if (io) io.disconnect();
            if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', onVis);
            canvas.removeEventListener('webglcontextlost', onCtxLost);
            canvas.removeEventListener('webglcontextrestored', onCtxRestored);
            controls.dispose();
            farCampus.dispose();
            plotList.forEach(function (r) {
                if (r.label && r.label.material) r.label.material.dispose();
                if (r.alertSp && r.alertSp.material) r.alertSp.material.dispose();
                r.ovMat.dispose();
            });
            while (fxList.length) endFx(0);
            Object.keys(fxMatMap).forEach(function (k) { fxMatMap[k].dispose(); });
            labelTex.forEach(function (tx) { tx.dispose(); });
            Object.keys(alertTex).forEach(function (k) { alertTex[k].dispose(); });
            Object.keys(G).forEach(function (k) { G[k].dispose(); });
            Object.keys(M).forEach(function (k) { M[k].dispose(); });
            [ACC, GLOW, GHOST, EDGE].forEach(function (grp) { Object.keys(grp).forEach(function (k) { grp[k].dispose(); }); });
            rig.dispose();
            renderer.dispose();
            try { renderer.forceContextLoss(); } catch (e) {}
            [chipBar, card, hint, legendBtn, legend, canvas].forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
        }
    };
}
