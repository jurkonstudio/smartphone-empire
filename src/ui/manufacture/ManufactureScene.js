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
import { createWeather } from '../campus/CampusWeather.js';
import { createCampusControls } from '../campus/CampusControls.js';
import { BASE_VIEW, MAX_DPR, FRAME_MS, MIN_RESIZE_DELTA, NARROW_PX, clamp, tint, hexCss, readAccent, prefersReducedMotion } from '../office/OfficeConfig.js';
import { PLOTS, PLOT_BY_ID, CHIP_ORDER, PIPES, plotState, allStates, plotSig, describePlot, plotTitle, runAction, ms,
    ROAD_NODES, ROAD_EDGES, APRON, DOCK, CT_SLOTS, shortestRoute } from './ManufactureLogic.js';
import { LINK, buildLinkBridge, mfBridgeCfg, buildCampusFar } from '../campus/IslandLink.js';
import { createSea } from '../campus/SeaWater.js';
import { createCinematic } from '../campus/CinematicFx.js';
import { islandRadius as campusIslandRadius } from '../campus/CampusBuildings.js';
import { ASSEMBLY_ROLES } from '../../data/assembly.data.js';

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
    crate:   [0xc99a62, 0x8a6a42], safety: [0xffc247, 0xd9a02a], hull: [0x2e3b52, 0x1b2434],
    asphalt: [0x5d6675, 0x1b2028], stripe: [0xf1f3f7, 0x9aa3b2], fence: [0x9aa4b2, 0x6a7586],
    carA: [0xd9534f, 0xb84540], carB: [0x4a7fd1, 0x3b66a8], carC: [0xe8e8ea, 0xa7adb8], carD: [0x3d4350, 0x262b34],
    vest: [0xff8a3d, 0xe0762f], coat: [0xf6f7fa, 0xc9cfda], techc: [0x3fae72, 0x2f8a58], skin: [0xe6b997, 0xc29a7c], panel: [0x2b4a8f, 0x1d3568]
};
var PBR = { ground: [0.95, 0], base: [0.9, 0], pad: [0.85, 0], road: [0.95, 0], metal: [0.35, 0.35], steel: [0.4, 0.4], glass: [0.12, 0.1],
    gold: [0.3, 0.6], pipe: [0.4, 0.45], ocean: [0.42, 0], shallow: [0.4, 0], win: [0.3, 0.1] };

var ISLAND = { rx: 21, rz: 14.5, n: 3.2 };
function smooth01(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
function coastR(th) {
    var c = Math.abs(Math.cos(th)) / ISLAND.rx, s = Math.abs(Math.sin(th)) / ISLAND.rz;
    var r = Math.pow(Math.pow(c, ISLAND.n) + Math.pow(s, ISLAND.n), -1 / ISLAND.n);
    r = r * (1 + 0.045 * Math.sin(3 * th + 0.8) + 0.03 * Math.sin(5 * th + 2.1));
    var sn = Math.sin(th);                                  // daratan tambahan di selatan untuk pabrik Assembly
    if (sn > 0) r *= 1 + 0.6 * sn * sn * (1 - smooth01((r * Math.cos(th) - 8) / 4.5));
    var lb = (th - 0.8) / 0.55;                             // lobe tenggara: ruang apron & dermaga Pusat Logistik
    r *= 1 + 0.16 * Math.max(0, sn) * Math.exp(-lb * lb);   // nol di th = 0 (jembatan Kampus tidak bergeser)
    return r;
}
function onIsland(x, z, m) { return Math.hypot(x, z) < coastR(Math.atan2(z, x)) - (m || 0); }
function nearPlots(x, z, m) {
    m = m || 0;
    if (Math.abs(x) < 16.4 + m && Math.abs(z) < 8.9 + m) return true;
    if (x > -17.8 - m && x < -15.0 + m && z > -4.8 - m && z < 9.9 + m) return true;   // jalan akses barat
    if (x > -17.8 - m && x < 7.8 + m && z > 8.2 - m && z < 18.9 + m) return true;     // petak Assembly + jalan akses
    return x > 7.8 - m && x < 18.2 + m && z > 8.2 - m && z < 20.2 + m;                // apron + dermaga
}

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
    scene.traverse(function (o) {                                   // peta lebih luas (pabrik Assembly): perlebar jangkauan bayangan
        if (o.isDirectionalLight && o.castShadow) { var sc = o.shadow.camera; sc.left = -32; sc.right = 32; sc.top = 32; sc.bottom = -32; sc.far = 90; sc.updateProjectionMatrix(); }
    });
    renderer.shadowMap.autoUpdate = !!rig.shadowsOn;
    var weather = createWeather(THREE, scene, {                      // cuaca otomatis + senja (jam lokal)
        lights: rig.lights, tier: look.tier,
        getCenter: function () { return controls ? controls.view : { x: 0, z: 0 }; },
        getHalf: function () { return (camera.right - camera.left) * 0.7 + 3; },
        onChange: function () { requestRender(); }
    });

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
    // Laut hidup (shader): garis air = tepi pasir basah (skala 1.08) pulau Manufaktur + siluet pulau Kampus.
    // Perairan dangkal, busa, dan ombak digambar shader (SeaWater.js), bukan lempengan statis.
    var sea = createSea(THREE, {
        quality: look.tier,
        palette: { shallow: COLORS.shallow, ocean: COLORS.ocean, foam: COLORS.foam },
        islands: [
            { cx: 0, cz: 0, radius: function (th) { return coastR(th) * 1.08; } },
            { cx: LINK.OFFSET, cz: 0, radius: function (th) { return campusIslandRadius(th, 1.08); } }
        ]
    });
    scene.add(sea.mesh);
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

    // plaza + jalan raya (z = 0) + marka + trotoar
    box(shell, 'base', 33.4, 0.1, 17.9, 0, 0.05, 0);
    box(shell, 'road', 33.4, 0.03, 2.7, 0, 0.115, 0);
    buildRoads();                                                   // jalan selatan & barat dari graf ROAD_EDGES
    buildApron();                                                   // apron Pusat Logistik (lapangan bongkar)
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
    [[-9.5, 9.95], [2.0, 9.95], [9.0, 9.95]].forEach(function (lp) {          // lampu jalan selatan (sisi Assembly)
        cyl(shell, 'metal', 0.05, 1.3, lp[0], 0.75, lp[1]);
        lampPosts.push(sph(shell, 'lamp', 0.12, lp[0], 1.45, lp[1]));
    });
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

    // ============================================================
    // JALAN DARI GRAF & TRUK KONTAINER
    // Jalan digambar dari ROAD_EDGES (satu kotak per ruas + garis putus-putus). Truk kontainer berjalan di atas
    // graf: berangkat dari pabrik/Assembly/Pusat Logistik ke dermaga, bongkar, lalu kembali. Hanya ambien.
    // ============================================================
    function buildRoads() {
        ROAD_EDGES.forEach(function (e) {
            if (e.draw === false) return;
            var A = ROAD_NODES[e.a], B = ROAD_NODES[e.b];
            var dx = B[0] - A[0], dz = B[1] - A[1], L = Math.hypot(dx, dz), ang = -Math.atan2(dz, dx);
            var rd = box(shell, 'road', L + e.w, 0.03, e.w, (A[0] + B[0]) / 2, 0.115, (A[1] + B[1]) / 2);
            rd.rotation.y = ang;
            var n = Math.max(1, Math.floor(L / 2.2)), k;
            for (k = 0; k < n; k++) {
                var t = (k + 0.5) / n;
                box(shell, 'roadLine', 0.8, 0.012, 0.07, A[0] + dx * t, 0.135, A[1] + dz * t).rotation.y = ang;
            }
        });
    }
    function buildApron() {
        var aw = APRON.x1 - APRON.x0, ad = APRON.z1 - APRON.z0, ax = (APRON.x0 + APRON.x1) / 2, az = (APRON.z0 + APRON.z1) / 2;
        box(shell, 'pad', aw, 0.03, ad, ax, 0.125, az);
        box(shell, 'safety', aw - 0.4, 0.012, 0.08, ax, 0.14, APRON.z1 - 0.2);            // garis kuning tepi apron
    }

    var CT_LANE = 0.3, CT_SPEED = 1.5, CT_LOAD = 4, CT_UNLOAD = 3;     // lajur (dari tengah), kecepatan, jeda muat/bongkar (detik)
    var ctList = [];
    function lerpAng(a, b, t) { var d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + d * t; }
    function ctSmooth(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
    // Jalur berlajur kanan dari daftar node. Titik di tiap simpul memakai offset 'miter' agar belokan menyambung.
    function routePath(ids) {
        var P = [], i, n = ids.length, nrm = [];
        for (i = 0; i < n; i++) P.push(ROAD_NODES[ids[i]]);
        for (i = 0; i < n - 1; i++) {
            var dx = P[i + 1][0] - P[i][0], dz = P[i + 1][1] - P[i][1], L = Math.hypot(dx, dz) || 1;
            nrm.push([-dz / L, dx / L]);                                  // normal kanan (sisi kanan jalan)
        }
        var pts = [], lens = [0];
        for (i = 0; i < n; i++) {
            var o;
            if (i === 0) o = nrm[0];
            else if (i === n - 1) o = nrm[n - 2];
            else {
                var a = nrm[i - 1], b = nrm[i], mx = a[0] + b[0], mz = a[1] + b[1], ml = Math.hypot(mx, mz);
                if (ml < 1e-6) o = a;
                else { var c = Math.max(0.5, (mx * a[0] + mz * a[1]) / ml); o = [mx / ml / c, mz / ml / c]; }
            }
            pts.push([P[i][0] + o[0] * CT_LANE, P[i][1] + o[1] * CT_LANE]);
            if (i > 0) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        }
        return { pts: pts, lens: lens, total: lens[lens.length - 1] };
    }
    // Posisi dan arah pada jarak s sepanjang jalur. Arah dilicinkan di dekat simpul agar belokan tidak patah.
    function samplePath(p, s) {
        var n = p.lens.length, s0 = clamp(s, 0, p.total), i = 1;
        while (i < n - 1 && s0 > p.lens[i]) i++;
        var seg = (p.lens[i] - p.lens[i - 1]) || 1, f = clamp((s0 - p.lens[i - 1]) / seg, 0, 1);
        var a = p.pts[i - 1], b = p.pts[i];
        var th = Math.atan2(b[1] - a[1], b[0] - a[0]);
        if (i > 1 && f < 0.5) {
            var tp = Math.atan2(p.pts[i - 1][1] - p.pts[i - 2][1], p.pts[i - 1][0] - p.pts[i - 2][0]);
            th = lerpAng(tp, th, 0.5 + 0.5 * ctSmooth(f / 0.5));
        } else if (i < n - 1 && f > 0.5) {
            var tn = Math.atan2(p.pts[i + 1][1] - p.pts[i][1], p.pts[i + 1][0] - p.pts[i][0]);
            th = lerpAng(th, tn, 0.5 * ctSmooth((f - 0.5) / 0.5));
        }
        return { x: a[0] + (b[0] - a[0]) * f, z: a[1] + (b[1] - a[1]) * f, ang: th };
    }
    // Truk kontainer: kepala traktor di +x, bak datar, dan kontainer 20 ft berwarna aksen pabrik.
    function makeContainerTruck(accent) {
        var g = new THREE.Group();
        box(g, 'dark', 1.0, 0.06, 0.5, 0.0, 0.1, 0);                                       // sasis
        box(g, 'white', 0.42, 0.4, 0.5, 0.52, 0.34, 0);                                    // kabin
        box(g, 'glass', 0.04, 0.2, 0.4, 0.74, 0.4, 0);                                     // kaca depan
        box(g, accent, 0.06, 0.1, 0.52, 0.52, 0.56, 0);                                    // pita atap kabin
        var cont = box(g, accent, 1.05, 0.5, 0.56, -0.45, 0.46, 0);                        // kontainer
        box(g, 'white', 1.07, 0.04, 0.58, -0.45, 0.72, 0);                                 // pita putih kontainer
        [-0.7, -0.4, 0.3, 0.55].forEach(function (wx) { [-0.27, 0.27].forEach(function (wz) { cyl(g, 'dark', 0.1, 0.1, wx, 0.1, wz).rotation.x = Math.PI / 2; }); });
        g.userData.cargo = cont;
        shell.add(g);
        return g;
    }
    // Sumber truk aktif: pabrik/Assembly sedang berproduksi, Pusat Logistik punya stok.
    function srcActive(id) {
        var s = states[id];
        if (!s) return false;
        if (id === 'hub') return s.status === 'built' && s.stock > 0;
        return !!s.producing;
    }
    CT_SLOTS.forEach(function (sl, i) {
        var outIds = shortestRoute(sl.origin, 'dock');
        if (!outIds) return;
        var fwd = routePath(outIds), back = routePath(outIds.slice().reverse());
        var g = makeContainerTruck(ACC[sl.id] || ACC.hub);
        var T1 = fwd.total / CT_SPEED;
        ctList.push({
            slot: sl, g: g, cargo: g.userData.cargo, fwd: fwd, back: back, T1: T1,
            cycle: CT_LOAD + T1 + CT_UNLOAD + back.total / CT_SPEED, phase: i * 7.3, active: false
        });
    });
    // Pose truk pada waktu t dalam siklus. Jeda muat & bongkar berpindah halus antara lajur pergi dan pulang,
    // sehingga tidak ada lompatan saat berbalik di dermaga atau saat siklus diulang.
    function mixPose(a, b, u) { return { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, ang: lerpAng(a.ang, b.ang, u) }; }
    function ctPose(tr, t) {
        var LO = CT_LOAD, T1 = tr.T1, UN = CT_UNLOAD;
        if (t < LO) return { p: mixPose(samplePath(tr.back, tr.back.total), samplePath(tr.fwd, 0), ctSmooth(t / LO)), cargo: true };
        if (t < LO + T1) return { p: samplePath(tr.fwd, (t - LO) * CT_SPEED), cargo: true };
        if (t < LO + T1 + UN) return { p: mixPose(samplePath(tr.fwd, tr.fwd.total), samplePath(tr.back, 0), ctSmooth((t - LO - T1) / UN)), cargo: false, unload: true };
        return { p: samplePath(tr.back, (t - LO - T1 - UN) * CT_SPEED), cargo: false };
    }
    function animateContainers(sec) {
        for (var i = 0; i < ctList.length; i++) {
            var tr = ctList[i];
            tr.g.visible = tr.active;
            if (!tr.active) continue;
            var pose = ctPose(tr, ambient ? (sec + tr.phase) % tr.cycle : CT_LOAD);     // ambien mati: parkir di asal, kargo terlihat
            tr.g.position.set(pose.p.x, 0.12, pose.p.z);
            tr.g.rotation.y = -pose.p.ang;
            if (pose.unload) { if (!tr.ordered) { tr.ordered = true; tr.okOrder = craneOrder(tr, pose.p); } }   // sekali per bongkar
            else tr.ordered = false;
            tr.cargo.visible = pose.cargo || (!!pose.unload && !tr.okOrder);   // kargo hilang hanya bila kontainer sudah dipesan crane
        }
    }

    // ============================================================
    // KAPAL KARGO: siklus away -> approach -> berth -> depart -> away (hanya ambien)
    // Kapal hidup di grup shell (koordinat dunia), bukan di petak hub, agar bisa berlayar tanpa ikut rebuild petak.
    // Model dibuat malas per ukuran (kecil/sedang/besar): hanya yang dipakai yang dibuat, hanya satu yang tampil.
    // Jalur laut dua segmen: P0 -> P1 -> berth. Kapal berputar di tempat sebelum berangkat (20% awal depart).
    // Ambien mati: satu kapal bersandar statis bila hub berdiri (seperti sebelumnya).
    // ============================================================
    var SHIP = { P0: [24, 30], P1: [18.2, 22], berth: [DOCK.shipX, DOCK.shipZ], Y: 0.06, app: 14, away: 6, dwellMin: 20, dwellMax: 30 };
    var SHIP_TIER = [{ sc: 0.78, n: 2 }, { sc: 1, n: 4 }, { sc: 1.25, n: 6 }];
    var SHIP_L1 = Math.hypot(SHIP.P1[0] - SHIP.P0[0], SHIP.P1[1] - SHIP.P0[1]);
    var SHIP_L2 = Math.hypot(SHIP.berth[0] - SHIP.P1[0], SHIP.berth[1] - SHIP.P1[1]);
    var SHIP_LEN = SHIP_L1 + SHIP_L2;
    var SHIP_ANG1 = Math.atan2(SHIP.P1[0] - SHIP.P0[0], SHIP.P1[1] - SHIP.P0[1]);     // haluan = +z lokal
    var SHIP_ANG2 = Math.atan2(SHIP.berth[0] - SHIP.P1[0], SHIP.berth[1] - SHIP.P1[1]);
    var shipModels = [], shipS = { ph: 'away', t: 0, dwell: 24, last: null, cur: null };
    function hubBuilt() { var h = states.hub; return !!(h && h.status === 'built'); }
    // ukuran menurut level hub dan stok: kecil <= 2, sedang 3-4, besar >= 5
    function shipWant() {
        var h = states.hub || {}, sc = (h.level || 0) + ((h.stock || 0) >= 500 ? 1 : 0);
        return sc <= 2 ? 0 : (sc <= 4 ? 1 : 2);
    }
    function buildShipModel(tier) {
        var T = SHIP_TIER[tier], s = T.sc, g = new THREE.Group(), i, L = 3.8 * s, Wd = 1.2 * s;
        shell.add(g);
        box(g, 'hull', Wd, 0.55, L, 0, 0.1, 0);
        box(g, 'red', Wd + 0.02, 0.14, L + 0.02, 0, 0.0, 0);
        box(g, 'white', 0.9 * s, 0.7, 0.6 * s, 0, 0.75, -1.3 * s);
        box(g, 'glass', 0.92 * s, 0.18, 0.62 * s, 0, 0.9, -1.3 * s);
        for (i = 0; i < T.n; i++) box(g, [ACC.hub, 'red', 'amber', 'green', 'steel', 'crate'][i % 6], 0.5 * s, 0.4, 0.62 * s, (i % 2 ? 0.28 : -0.28) * s, 0.6 + Math.floor(i / 2) * 0.42, 0);
        var foam = noShadow(box(g, 'foam', 0.7 * s, 0.03, 0.6, 0, 0.02, -(L / 2 + 0.45)));    // buih di buritan
        foam.visible = false;
        g.visible = false;
        return { g: g, foam: foam, foamBz: 0.6, sc: s, loaded: [] };    // foamBz: skala dasar buih (sama dengan dimensi box di atas)
    }
    function shipModel(tier) { return shipModels[tier] || (shipModels[tier] = buildShipModel(tier)); }
    function shipEase(u) { return ctSmooth(u); }
    // pose di sepanjang jalur dari P0 (f = 0) ke berth (f = 1); arah dilicinkan di sekitar simpul P1
    function shipPose(f) {
        var s = clamp(f, 0, 1) * SHIP_LEN, x, z;
        if (s <= SHIP_L1) {
            var u = s / SHIP_L1;
            x = SHIP.P0[0] + (SHIP.P1[0] - SHIP.P0[0]) * u; z = SHIP.P0[1] + (SHIP.P1[1] - SHIP.P0[1]) * u;
        } else {
            var v = (s - SHIP_L1) / SHIP_L2;
            x = SHIP.P1[0] + (SHIP.berth[0] - SHIP.P1[0]) * v; z = SHIP.P1[1] + (SHIP.berth[1] - SHIP.P1[1]) * v;
        }
        return { x: x, z: z, ang: lerpAng(SHIP_ANG1, SHIP_ANG2, clamp((s - (SHIP_L1 - 1.5)) / 3, 0, 1)) };
    }
    function shipPlace(m, p, sec, moving) {
        m.g.position.set(p.x, SHIP.Y + (ambient ? Math.sin(sec * 0.9) * 0.04 : 0), p.z);
        m.g.rotation.y = p.ang;
        m.g.rotation.z = ambient ? Math.sin(sec * 0.7) * 0.02 : 0;
        m.g.visible = true;
        m.foam.visible = !!moving && ambient;
        if (m.foam.visible) m.foam.scale.z = m.foamBz * (0.8 + 0.4 * Math.abs(Math.sin(sec * 4)));
    }
    function shipHideAll() { for (var i = 0; i < shipModels.length; i++) if (shipModels[i]) shipModels[i].g.visible = false; }
    function animateShip(sec) {
        var dt = shipS.last === null ? 0 : clamp(sec - shipS.last, 0, 0.5);
        shipS.last = sec;
        if (!hubBuilt()) { shipModels.forEach(function (m) { if (m) shipShipOut(m); }); shipHideAll(); shipS.ph = 'away'; shipS.t = 0; return; }
        if (!ambient) {                                                  // ambien mati: satu kapal bersandar statis
            var mS = shipModel(shipWant());
            if (mS !== shipS.cur) { if (shipS.cur) shipShipOut(shipS.cur); shipHideAll(); shipS.cur = mS; }
            shipS.ph = 'berth'; shipS.t = 0; shipS.dwell = SHIP.dwellMin;
            shipPlace(mS, shipPose(1), sec, false);
            return;
        }
        shipS.t += dt;
        if (shipS.ph === 'away') {
            shipHideAll();
            if (!(shipS.t >= SHIP.away && srcActive('hub'))) return;    // tunggu sampai ada stok yang dikirim
            shipS.cur = shipModel(shipWant()); shipS.ph = 'approach'; shipS.t = 0;
        }
        var m = shipS.cur;
        if (shipS.ph === 'approach') {
            var u = Math.min(1, shipS.t / SHIP.app);
            shipPlace(m, shipPose(shipEase(u)), sec, u < 1);
            if (u >= 1) { shipS.ph = 'berth'; shipS.t = 0; shipS.dwell = SHIP.dwellMin + Math.random() * (SHIP.dwellMax - SHIP.dwellMin); }
        } else if (shipS.ph === 'berth') {
            shipPlace(m, shipPose(1), sec, false);
            if (shipS.t >= shipS.dwell) { shipS.ph = 'depart'; shipS.t = 0; }
        } else if (shipS.ph === 'depart') {
            var v = Math.min(1, shipS.t / SHIP.app), TURN = 0.2;
            if (v < TURN) {                                              // putar di tempat dulu
                var bp = shipPose(1);
                shipPlace(m, { x: bp.x, z: bp.z, ang: lerpAng(SHIP_ANG2, SHIP_ANG2 + Math.PI, shipEase(v / TURN)) }, sec, false);
            } else {
                var pq = shipPose(1 - shipEase((v - TURN) / (1 - TURN)));
                pq.ang += Math.PI;
                shipPlace(m, pq, sec, true);
            }
            if (v >= 1) { shipS.ph = 'away'; shipS.t = 0; m.g.visible = false; shipShipOut(m); }
        }
    }

    // ============================================================
    // CRANE & KONTAINER (tahap 2): satu crane ship-to-shore di apron, koordinat dunia. Hanya ambien.
    // Truk yang mulai membongkar mengirim satu kontainer ke antrean crane. Crane mengangkat kontainer dari titik
    // bongkar lalu menaruhnya di kapal yang sedang sandar (selama ada tempat) atau di tumpukan apron. Saat kapal
    // sandar dan tumpukan berisi, crane memuat tumpukan ke kapal. Kontainer memakai pool tetap, tanpa objek baru
    // per frame. Tanpa hub berdiri: crane dan kontainer disembunyikan, truk tidak membongkar (kargo tetap terlihat).
    // Jika tidak ada tempat, crane menahan kontainer di udara; jika pool habis, kargo truk tetap terlihat.
    // ============================================================
    var CR = { T: [13.5, 12.6], TOP: 4.0, TRAVEL: 3.6, SHIP_H: 1.035, RMIN: 1.6, RMAX: 7.6, REST: [0.3, 3.5], MOVE: 2.6, VERT: 1.2, REL: 0.4, OFF: 0.35 };
    var CNT = { L: 1.05, H: 0.5, W: 0.56, POOL: 24, BASE: 6, LV: 2, DECK_Y: 0.625, TRUCK_Y: 0.58 };
    var cntPool = [], cntFree = [], stackPos = [], stackOcc = [];
    var craneQ = [];
    var craneS = { last: null, vis: null, job: null, st: 'idle', t: 0, dur: 0, A: null, B: null, th: CR.REST[0], r: CR.REST[1], h: CR.TRAVEL, held: null };
    for (var ci = 0; ci < CNT.POOL; ci++) {
        var cm = box(shell, 'white', CNT.L, CNT.H, CNT.W, 0, -5, 0);
        cm.visible = false;
        var cp = { mesh: cm, at: 'free' };
        cntPool.push(cp); cntFree.push(cp);
    }
    for (var si = 0; si < CNT.BASE * CNT.LV; si++) {                 // tumpukan: 6 alas, 2 lapis; isi lapis bawah dulu
        var bs = si % CNT.BASE, lv = Math.floor(si / CNT.BASE);
        stackPos.push([15.95 + (bs % 2) * 1.0, 0.39 + lv * 0.5, 9.87 + Math.floor(bs / 2) * 0.56]);
        stackOcc.push(null);
    }
    var craneObj = { legs: [], boom: new THREE.Group(), trolley: null, hook: null, cable: null };
    [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].forEach(function (o) {
        craneObj.legs.push(box(shell, 'safety', 0.14, CR.TOP, 0.14, CR.T[0] + o[0], CR.TOP / 2, CR.T[1] + o[1]));
    });
    craneObj.boom.position.set(CR.T[0], CR.TOP, CR.T[1]); shell.add(craneObj.boom);
    box(craneObj.boom, 'safety', CR.RMAX + 0.4, 0.16, 0.16, (CR.RMAX + 0.4) / 2, 0, 0);
    craneObj.trolley = box(shell, 'dark', 0.32, 0.16, 0.32, CR.T[0], CR.TOP, CR.T[1]);
    craneObj.hook = box(shell, 'dark', 0.25, 0.25, 0.25, CR.T[0], CR.TRAVEL, CR.T[1]);
    craneObj.cable = box(shell, 'metal', 0.04, 1, 0.04, CR.T[0], CR.TOP, CR.T[1]);
    // pose crane: sudut lengan th (dari tiang), jangkauan troli r, tinggi kait h. Kontainer yang dibawa ikut kait.
    function craneSetPose(th, r, h) {
        var s = craneS, x = CR.T[0] + r * Math.cos(th), z = CR.T[1] + r * Math.sin(th);
        s.th = th; s.r = r; s.h = h;
        craneObj.boom.rotation.y = -th;                              // lengan lokal +x menunjuk ke arah th
        craneObj.trolley.position.set(x, CR.TOP, z);
        craneObj.hook.position.set(x, h, z);
        craneObj.cable.position.set(x, (CR.TOP + h) / 2, z);
        craneObj.cable.scale.set(0.04, Math.max(0.01, CR.TOP - h), 0.04);
        if (s.held) s.held.mesh.position.set(x, h - CR.OFF, z);
    }
    function craneAim(x, z) {
        return { th: Math.atan2(z - CR.T[1], x - CR.T[0]), r: clamp(Math.hypot(x - CR.T[0], z - CR.T[1]), CR.RMIN, CR.RMAX) };
    }
    // mulai tahap gerak: dari pose sekarang ke pose B dalam dur detik
    // panjang lintasan kait (lengkung di udara) dari pose A ke B; dipakai agar ayunan tidak terlalu cepat
    function craneLen(A, B) {
        var len = 0, px = 0, pz = 0, ph = 0, i;
        for (i = 0; i <= 8; i++) {
            var e = i / 8, th = lerpAng(A.th, B.th, e), r = A.r + (B.r - A.r) * e, h = A.h + (B.h - A.h) * e;
            var x = CR.T[0] + r * Math.cos(th), z = CR.T[1] + r * Math.sin(th);
            if (i > 0) len += Math.hypot(x - px, z - pz, h - ph);
            px = x; pz = z; ph = h;
        }
        return len;
    }
    // durasi tahap = minimum 'dur' atau 0,7 x panjang lintasan (kecepatan rata-rata ~1,4 satuan/detik)
    function craneStage(name, dur, B) {
        var s = craneS;
        s.st = name; s.t = 0; s.A = { th: s.th, r: s.r, h: s.h }; s.B = B;
        s.dur = Math.max(dur, craneLen(s.A, B) * 0.7);
    }
    // slot dek kapal k: lokal (lx, lz) dan koordinat dunia saat sandar (haluan = SHIP_ANG2)
    function shipSlotWorld(m, k) {
        var lx = (k % 2 ? 0.3 : -0.3) * m.sc, lz = [0, -1.1, 1.1][Math.floor(k / 2)], a = SHIP_ANG2;
        return { lx: lx, lz: lz, x: SHIP.berth[0] + lx * Math.cos(a) + lz * Math.sin(a), z: SHIP.berth[1] - lx * Math.sin(a) + lz * Math.cos(a) };
    }
    // kapal sedang sandar dan masih cukup waktu untuk satu bongkar muat (sekitar 4 detik) serta ada tempat
    function shipCap() { var h = states.hub || {}; return clamp(h.level || 1, 1, 6); }
    function shipAt(need) {
        var m = shipS.cur;
        if (!ambient || !hubBuilt() || shipS.ph !== 'berth' || !m) return null;
        if (shipS.dwell - shipS.t < (need || 6) || m.loaded.length >= shipCap()) return null;
        return m;
    }
    // kapal yang berangkat membawa kontainer di dek: kontainer kembali ke pool
    function shipShipOut(m) {
        for (var i = 0; i < m.loaded.length; i++) { var c = m.loaded[i]; shell.add(c.mesh); c.mesh.visible = false; c.at = 'free'; cntFree.push(c); }
        m.loaded = [];
    }

    // truk mulai membongkar: ambil kontainer dari pool dan taruh di titik bongkar (menunggu crane). false jika tidak bisa.
    function craneOrder(tr, p) {
        if (!hubBuilt() || !cntFree.length || craneQ.length >= 2) return false;   // antrean penuh: truk pulang dengan kargo
        var c = cntFree.pop();
        c.at = 'job'; c.mesh.material = ACC[tr.slot.id] || ACC.hub; c.mesh.rotation.y = 0;
        c.mesh.position.set(p.x, CNT.TRUCK_Y, p.z); c.mesh.visible = true;
        craneQ.push({ kind: 'truck', cont: c, pick: { x: p.x, z: p.z, y: CNT.TRUCK_Y } });
        return true;
    }
    // pekerjaan berikutnya: antrean truk dulu; bila kosong dan kapal sandar, muat tumpukan dari atas
    // Tumpukan >= 6 atau antrean kosong: kapal yang sandar dimuat dari tumpukan dulu.
    function craneNextJob() {
        var m = shipAt(12), k, n = 0;
        for (k = 0; k < stackOcc.length; k++) if (stackOcc[k]) n++;
        if (m && (n >= 6 || !craneQ.length)) {
            for (k = stackOcc.length - 1; k >= 0; k--) if (stackOcc[k]) {
                var c = stackOcc[k]; stackOcc[k] = null; c.at = 'job';     // sudah diambil crane, belum di tumpukan
                return { kind: 'stack', cont: c, pick: { x: stackPos[k][0], z: stackPos[k][2], y: stackPos[k][1] } };
            }
        }
        if (craneQ.length) return craneQ.shift();
        return null;
    }
    function craneBegin(j) {
        var P = craneAim(j.pick.x, j.pick.z);
        j.P = P; j.pickH = j.pick.y + CR.OFF;
        craneS.job = j;
        craneStage('toPick', CR.MOVE, { th: P.th, r: P.r, h: CR.TRAVEL });
    }
    // tujuan: kapal bila sandar dan ada tempat, selain itu slot tumpukan kosong pertama; null = tahan dulu
    function craneDest() {
        var m = shipAt(), k, d;
        if (m) {
            d = { kind: 'ship', m: m, k: m.loaded.length };
            if (shipS.dwell - shipS.t >= craneNeed(craneDestPose(d)) + 0.5) return d;   // cukup waktu sampai lepas
        }
        for (k = 0; k < stackOcc.length; k++) if (!stackOcc[k]) return { kind: 'stack', k: k };
        return null;
    }
    // waktu sisa yang dibutuhkan dari posisi crane sekarang: ayun ke tujuan + turun + lepas
    function craneNeed(dp) {
        var A = { th: craneS.th, r: craneS.r, h: CR.TRAVEL }, M = { th: dp.P.th, r: dp.P.r, h: CR.TRAVEL }, D = { th: dp.P.th, r: dp.P.r, h: dp.h };
        return Math.max(CR.MOVE, craneLen(A, M) * 0.7) + Math.max(CR.VERT, craneLen(M, D) * 0.7) + CR.REL;
    }
    function craneDestPose(d) {
        if (d.kind === 'ship') {
            var w = shipSlotWorld(d.m, d.k);
            d.lx = w.lx; d.lz = w.lz;
            return { P: craneAim(w.x, w.z), h: CR.SHIP_H };
        }
        var sp = stackPos[d.k];
        return { P: craneAim(sp[0], sp[2]), h: sp[1] + CR.OFF };
    }
    function craneRelease(j) {
        var c = j.cont, d = j.dest;
        craneS.held = null;
        if (d.kind === 'ship') {
            d.m.g.add(c.mesh);                                        // kontainer pindah induk ke grup kapal
            c.mesh.position.set(d.lx, CNT.DECK_Y, d.lz); c.mesh.rotation.y = Math.PI / 2;
            d.m.loaded.push(c); c.at = 'ship';
        } else {
            stackOcc[d.k] = c; c.at = 'stack';
            c.mesh.position.set(stackPos[d.k][0], stackPos[d.k][1], stackPos[d.k][2]); c.mesh.rotation.y = 0;
        }
    }
    // tahap selesai -> tahap berikut. Tahap 'up' berakhir di 'dest' (menunggu tujuan).
    function craneAdvance(j) {
        var s = craneS, P = j.P, D = j.D;
        switch (s.st) {
            case 'toPick': craneStage('down', CR.VERT, { th: P.th, r: P.r, h: j.pickH }); break;
            case 'down': j.cont.at = 'hook'; s.held = j.cont; craneStage('up', CR.VERT, { th: P.th, r: P.r, h: CR.TRAVEL }); break;
            case 'up': s.st = 'dest'; break;
            case 'swing': craneStage('downD', CR.VERT, { th: D.th, r: D.r, h: j.dropH }); break;
            case 'downD': craneStage('rel', CR.REL, { th: D.th, r: D.r, h: j.dropH }); break;
            case 'rel': craneRelease(j); craneStage('upD', CR.VERT, { th: D.th, r: D.r, h: CR.TRAVEL }); break;
            case 'upD': s.job = null; s.st = 'idle'; break;
        }
    }
    function animateCrane(sec) {
        var s = craneS, on = hubBuilt(), dt = s.last === null ? 0 : clamp(sec - s.last, 0, 0.5);
        s.last = sec;
        if (s.vis !== on) {                                           // crane dan kontainer ikut petak hub
            s.vis = on;
            craneObj.legs.forEach(function (o) { o.visible = on; });
            craneObj.boom.visible = on;
            [craneObj.trolley, craneObj.hook, craneObj.cable].forEach(function (o) { o.visible = on; });
            cntPool.forEach(function (c) { c.mesh.visible = on && c.at !== 'free'; });
        }
        if (!on || !ambient) return;                                  // ambien mati: crane diam di posenya
        if (!s.job) { var nj = craneNextJob(); if (!nj) return; craneBegin(nj); }
        var j = s.job;
        if (s.st === 'dest') {
            var d = craneDest();
            if (!d) return;                                           // tidak ada tempat: tahan kontainer di udara
            var dp = craneDestPose(d);
            j.dest = d; j.D = dp.P; j.dropH = dp.h;
            craneStage('swing', CR.MOVE, { th: dp.P.th, r: dp.P.r, h: CR.TRAVEL });
        }
        s.t += dt;
        var u = s.dur > 0 ? Math.min(1, s.t / s.dur) : 1, e = ctSmooth(u), A = s.A, B = s.B;
        craneSetPose(lerpAng(A.th, B.th, e), A.r + (B.r - A.r) * e, A.h + (B.h - A.h) * e);
        if (u >= 1) craneAdvance(j);
    }

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
    // Sentuhan sinematik: vignette CSS, bloom lampu malam (Points aditif), haze siluet Kampus. Tanpa post-processing.
    var cine = createCinematic(THREE, scene, {
        renderer: renderer, canvas: canvas, container: container, tier: look.tier,
        lights: lampPosts.map(function (l) { var wp = l.getWorldPosition(new THREE.Vector3()); return { x: wp.x, y: wp.y, z: wp.z, size: 1.7, color: 0xffc872 }; }),
        onHaze: function (hex, amt) { farCampus.setHaze(hex, amt); }
    });
    var lastWinSun = -1;
    // Jendela pabrik menyala hangat bertahap saat senja (tema terang). Tema gelap: tetap seperti applyTheme.
    function winSunset() {
        var sn = weather.getSunset();
        if (Math.abs(sn - lastWinSun) <= 0.01) return;
        lastWinSun = sn;
        if (dark) return;
        var t = Math.max(0, Math.min(1, (sn - 0.12) / 0.5)); t = t * t * (3 - 2 * t);
        M.win.emissive.setRGB(0.72 * t, 0.58 * t, 0.34 * t);
    }
    function cineTick() { winSunset(); cine.update(canvas.height / Math.max(0.001, camera.top - camera.bottom), weather.getKind(), weather.getSunset()); }
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
        if (def.kind === 'assembly') return { bw: 7 + 1.9 * L, bd: 3.6 + 0.4 * L, bh: 1.3 + 0.2 * L };
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
        // kait crane hub kini diam (crane bergerak ada di animateCrane, di apron)
        // dermaga kayu + kapal kargo
        var dZ0 = DOCK.z0 - 5.2, dZ1 = DOCK.z1 - 5.2, nP = 6, plk = (dZ1 - dZ0) / nP;    // koordinat lokal (origin hub = 12, 5.2)
        for (i = 0; i < nP; i++) box(f, 'wood', DOCK.w, 0.12, plk - 0.04, cx0, 0.02, dZ0 + (i + 0.5) * plk);
        for (i = 0; i <= nP; i += 2) [-0.6, 0.6].forEach(function (ox) { box(f, 'metal', 0.14, 0.9, 0.14, cx0 + ox, -0.25, dZ0 + i * plk); });
        // kapal kargo tidak lagi di petak ini: dikelola animateShip (koordinat dunia, bisa berlayar)
        beacon(f, -dm.bw / 2 + 0.3, dm.bh + 0.3, ZC - 0.1, tk, st.producing || on, 'hub');
    };

    // ---------- Pabrik perakitan (Assembly): hall bergerigi + bay terbuka (potongan) + kantor + dermaga + parkir ----------
    var ASM_ZC = -1.2;
    TYPE.assembly = function (f, def, L, st, tk, on) {
        var dm = dimsFor(def, L), bw = dm.bw, bd = dm.bd, bh = dm.bh, zc = ASM_ZC, i, k, t;
        var roofSink = f.userData.roofSink || null;                                  // daftar atap (disembunyikan saat "masuk")
        function roofPart(m) { if (roofSink) roofSink.push(m); return m; }
        // rig kerja: tangan pekerja & ponsel di ban berjalan; hanya tampil saat mode masuk
        var asmR = { on: false, hands: [], phones: [] };
        f.userData.asmRig = asmR;
        var asm = st.asm || {}, act = !!asm.operating, total = asm.total || 0, autoLv = Math.max(0, L - 1);
        var xL = -bw / 2, xR = bw / 2, zF = zc + bd / 2, zB = zc - bd / 2;
        var bayX0 = xL + bw * 0.38, bayW = bw * 0.34, bayX1 = bayX0 + bayW, bayCx = bayX0 + bayW / 2;
        // aspal halaman depan
        var apZ0 = zF + 0.05, apZ1 = 4.3;
        box(f, 'asphalt', def.w - 0.8, 0.03, apZ1 - apZ0, 0, 0.015, (apZ0 + apZ1) / 2);
        // lantai bay (potongan atap) + jalur pejalan
        box(f, 'dark', bayW, 0.04, bd - 0.12, bayCx, 0.03, zc);
        box(f, 'safety', bayW - 0.1, 0.012, 0.05, bayCx, 0.055, zF - 0.16);
        // dinding belakang & samping
        box(f, 'wall', bw, bh, 0.12, 0, bh / 2, zB + 0.06);
        box(f, 'wall', 0.12, bh, bd, xL + 0.06, bh / 2, zc);
        box(f, 'wall', 0.12, bh, bd, xR - 0.06, bh / 2, zc);
        // seksi beratap A (kiri) dan B (kanan) + dinding sekat di tepi bay
        var secs = [{ x0: xL, x1: bayX0 }, { x0: bayX1, x1: xR }];
        secs.forEach(function (S, si) {
            var sw = S.x1 - S.x0, cx = (S.x0 + S.x1) / 2;
            box(f, 'wall', sw, bh, 0.12, cx, bh / 2, zF - 0.06);                                        // dinding depan
            for (var r = 0; r < Math.floor(sw / 0.8); r++) box(f, 'wallDk', 0.05, bh * 0.98, 0.04, S.x0 + 0.4 + r * 0.8, bh / 2, zF + 0.015);   // rusuk panel
            box(f, ACC.assembly, sw + 0.03, 0.14, 0.06, cx, bh - 0.12, zF + 0.02);                      // pita aksen
            box(f, 'win', sw * 0.8, 0.2, 0.05, cx, bh * 0.52, zF + 0.03);                              // pita jendela
            box(f, 'wallDk', 0.12, bh, bd, si === 0 ? S.x1 - 0.06 : S.x0 + 0.06, bh / 2, zc);           // sekat bay
            var n = Math.max(1, Math.floor(sw / 1.5)), tw = sw / n;                                      // atap gergaji
            for (var q = 0; q < n; q++) {
                var tx = S.x0 + (q + 0.5) * tw;
                var pnl = roofPart(box(f, 'roof', tw * 1.04, 0.06, bd + 0.12, tx, bh + 0.2, zc)); pnl.rotation.z = -0.26;
                roofPart(box(f, 'win', 0.05, 0.3, bd * 0.94, tx - tw / 2 + 0.03, bh + 0.15, zc));
            }
        });
        // pintu rolling di dinding depan seksi A
        for (i = 0; i < 2; i++) {
            var dx = xL + 1.2 + i * 1.6;
            box(f, 'steel', 1.0, 0.8, 0.05, dx, 0.4, zF + 0.04);
            for (var sl = 0; sl < 4; sl++) box(f, 'metal', 0.98, 0.02, 0.06, dx, 0.18 + sl * 0.19, zF + 0.06);
        }
        // rangka atap terbuka di atas bay
        for (i = 0; i < 4; i++) box(f, 'steel', 0.07, 0.07, bd + 0.1, bayX0 + 0.3 + i * ((bayW - 0.6) / 3), bh + 0.03, zc);
        box(f, 'steel', bayW, 0.06, 0.06, bayCx, bh + 0.03, zF - 0.05);
        box(f, 'steel', bayW, 0.06, 0.06, bayCx, bh + 0.03, zB + 0.05);
        // lampu gantung di bay
        for (i = 0; i < 4; i++) box(f, act ? 'lamp' : 'metal', 0.3, 0.04, 0.12, bayX0 + 0.5 + i * ((bayW - 1.0) / 3), bh - 0.12, zc);
        // lini perakitan: konveyor + stasiun + pekerja + robot
        var nl = clamp(L, 1, 4), laneGap = nl > 1 ? (bd - 1.5) / (nl - 1) : 0;
        var figTotal = clamp(Math.round(Math.sqrt(total) * 1.3), 0, 28), placed = 0;
        var palette = ['vest', 'vest', 'coat', 'techc'];
        for (k = 0; k < nl; k++) {
            var zl = nl === 1 ? zc : zB + 0.75 + k * laneGap;
            conveyor(f, bayCx, zl, bayW - 0.3, tk, act, 'assembly');
            box(f, 'red', 0.2, 0.18, 0.2, bayX1 - 0.25, 0.09, zl + 0.34);                               // bin cacat
            box(f, 'win', 0.26, 0.2, 0.05, bayX0 + 0.25, 0.4, zl - 0.34);                               // layar QC
            var slots = Math.max(3, Math.floor((bayW - 0.8) / 0.62));
            for (i = 0; i < slots && placed < figTotal; i++) {
                var side = i % 2 ? 1 : -1, px = bayX0 + 0.45 + i * ((bayW - 0.9) / Math.max(1, slots - 1));
                box(f, 'metal', 0.3, 0.16, 0.22, px, 0.08, zl + side * 0.36);                           // meja kerja
                var mat = palette[(placed + k) % palette.length];
                var body = cyl(f, mat, 0.07, 0.22, px, 0.26, zl + side * 0.42);
                sph(f, 'skin', 0.055, px, 0.43, zl + side * 0.42);
                var hnd = box(f, 'skin', 0.12, 0.05, 0.05, px + 0.06, 0.19, zl + side * 0.34);
                asmR.hands.push({ m: hnd, x: px + 0.06, z: zl + side * 0.34, side: side, ph: placed * 1.3 + k });
                if (act) (function (b, ph) { tk.push(function (sec) { b.position.y = 0.26 + (ambient ? Math.abs(Math.sin(sec * 2.2 + ph)) * 0.012 : 0); }); })(body, placed);
                placed++;
            }
            for (var pj = 0; pj < 3; pj++) asmR.phones.push({ m: box(f, 'dark', 0.11, 0.03, 0.17, bayX0 + 0.25, 0.25, zl), j: pj, k: k });   // ponsel di ban berjalan
            if (autoLv >= 2) {                                                                          // lengan robot
                for (t = 0; t < 2; t++) {
                    var rx = bayX0 + bayW * (0.3 + t * 0.4), arm = new THREE.Group();
                    arm.position.set(rx, 0.28, zl - 0.36); f.add(arm);
                    cyl(f, 'steel', 0.09, 0.28, rx, 0.14, zl - 0.36);
                    box(arm, 'amber', 0.07, 0.3, 0.07, 0, 0.15, 0); box(arm, 'amber', 0.07, 0.07, 0.3, 0, 0.3, 0.14);
                    sph(f, 'ledG', 0.03, rx, 0.3, zl - 0.36);
                    (function (a, ph) { tk.push(function (sec) { a.rotation.y = act && ambient ? Math.sin(sec * 1.3 + ph) * 0.9 : 0.3; }); })(arm, k * 1.7 + t);
                }
            }
        }
        if (autoLv >= 3) {                                                                              // AGV pengantar komponen
            for (i = 0; i < 2; i++) {
                var agv = new THREE.Group(); agv.position.set(bayX0 + 0.2 + i * (bayW - 0.4), 0.09, zc); f.add(agv);
                box(agv, 'safety', 0.24, 0.1, 0.3, 0, 0, 0); box(agv, ACC.assembly, 0.16, 0.08, 0.2, 0, 0.09, 0); sph(agv, 'ledA', 0.025, 0.1, 0.07, 0.13);
                (function (g, ph) { tk.push(function (sec) { g.position.z = zc + (act && ambient ? Math.sin(sec * 0.6 + ph) * (bd / 2 - 0.4) : 0); }); })(agv, i * 3.14);
            }
        }
        // gerak kerja (hanya saat mode masuk, operasi aktif, dan ambien hidup); diam di posisi istirahat selain itu
        tk.push(function (sec) {
            var mv = asmR.on && ambient && act;
            for (var h = 0; h < asmR.hands.length; h++) {
                var hd = asmR.hands[h], sn = Math.sin(sec * 2.6 + hd.ph);
                hd.m.position.z = hd.z + (mv ? hd.side * 0.07 * (sn + 1) * 0.5 : 0);
                hd.m.position.y = 0.19 + (mv ? 0.03 * Math.max(0, sn) : 0);
            }
            var xa = bayX0 + 0.25, xb = bayX1 - 0.25;
            for (var q = 0; q < asmR.phones.length; q++) {
                var pp = asmR.phones[q], u = mv ? ((sec * 0.07 + pp.j / 3 + pp.k * 0.17) % 1) : ((pp.j / 3 + pp.k * 0.17) % 1);
                pp.m.position.x = xa + u * (xb - xa);
            }
        });
        asmR.setInside = function (on) {
            asmR.on = !!on;
            asmR.hands.forEach(function (h) { h.m.visible = asmR.on; });
            asmR.phones.forEach(function (p) { p.m.visible = asmR.on && act; });
        };
        // peralatan atap: AC, cerobong, panel surya
        roofPart(box(f, 'steel', 0.7, 0.28, 0.5, xL + 1.0, bh + 0.5, zc - 0.7)); roofPart(box(f, 'steel', 0.6, 0.24, 0.45, xL + 2.2, bh + 0.48, zc + 0.6));
        cyl(f, 'metal', 0.1, 0.8, xL + 0.5, bh + 0.65, zB + 0.5); smoke(f, xL + 0.5, bh + 1.1, zB + 0.5, tk, on);
        if (L >= 3) for (i = 0; i < 6; i++) { var sp = roofPart(box(f, 'panel', 0.5, 0.03, 0.34, bayX1 + 0.5 + (i % 3) * 0.6, bh + 0.52 + Math.floor(i / 3) * 0.04, zc - 0.5 + Math.floor(i / 3) * 0.7)); sp.rotation.x = -0.35; }
        beacon(f, xR - 0.3, bh + 0.5, zB + 0.4, tk, act, 'assembly');
        // dermaga muat (sisi timur) + truk + forklift
        for (i = 0; i < 3; i++) {
            var dz = zc + (i - 1) * 1.1;
            box(f, 'dark', 0.05, 0.62, 0.72, xR + 0.03, 0.31, dz); box(f, 'steel', 0.07, 0.04, 0.78, xR + 0.04, 0.66, dz);
            box(f, 'safety', 0.12, 0.1, 0.5, xR + 0.1, 0.06, dz);
        }
        box(f, 'roof', 1.2, 0.06, 3.6, xR + 0.62, 0.95, zc); [-1.7, 1.7].forEach(function (zz) { box(f, 'steel', 0.06, 0.95, 0.06, xR + 1.2, 0.48, zc + zz); });
        var nTruck = act && total > 0 ? (L >= 3 ? 2 : 1) : 0;
        for (i = 0; i < nTruck; i++) {
            var tz = zc + (i === 0 ? -1.1 : 1.1), tg = new THREE.Group(); tg.position.set(xR + 0.1, 0, tz); f.add(tg);
            box(tg, 'white', 1.7, 0.6, 0.66, 1.0, 0.45, 0); box(tg, ACC.assembly, 1.7, 0.12, 0.68, 1.0, 0.3, 0);
            box(tg, 'white', 0.42, 0.45, 0.6, 2.05, 0.36, 0); box(tg, 'glass', 0.04, 0.2, 0.5, 2.27, 0.42, 0);
            [0.3, 1.5, 1.95].forEach(function (wx) { [-0.34, 0.34].forEach(function (wz) { cyl(tg, 'dark', 0.1, 0.1, wx, 0.1, wz).rotation.x = Math.PI / 2; }); });
        }
        var nCrate = clamp(Math.floor(Math.log10(Math.max(1, st.stock || 0)) * 1.3), 0, 6);
        for (i = 0; i < nCrate; i++) box(f, i % 2 ? 'crate' : ACC.assembly, 0.34, 0.3, 0.34, xR + 0.5 + (i % 3) * 0.4, 0.17 + Math.floor(i / 3) * 0.3, zc + 2.15);
        var fk = new THREE.Group(); fk.position.set(xR + 0.6, 0.12, zc); f.add(fk);
        box(fk, 'safety', 0.3, 0.16, 0.2, 0, 0.1, 0); box(fk, 'metal', 0.14, 0.2, 0.14, -0.06, 0.28, 0); box(fk, 'dark', 0.24, 0.03, 0.12, 0.26, 0.06, 0);
        if (act) tk.push(function (sec) { fk.position.z = zc + (ambient ? Math.sin(sec * 0.7) * 1.4 : 0); });
        // kantor administrasi di barat hall
        var ow = 3.2, ox = xL - 0.12 - ow / 2, fl = L >= 3 ? 3 : (L >= 2 ? 2 : 1), oh = 0.7 * fl + 0.15, od = bd + 0.5, oz = zc + 0.1;
        box(f, 'white', ow, oh, od, ox, oh / 2, oz); box(f, 'roof', ow + 0.12, 0.08, od + 0.12, ox, oh + 0.04, oz);
        box(f, 'glass', ow * 0.92, oh * 0.8, 0.05, ox, oh * 0.5, oz + od / 2 + 0.03);
        box(f, 'glass', 0.05, oh * 0.8, od * 0.8, ox + ow / 2 + 0.03, oh * 0.5, oz);
        for (i = 1; i < fl; i++) box(f, 'wallDk', ow * 0.94, 0.04, 0.07, ox, 0.7 * i + 0.08, oz + od / 2 + 0.05);
        box(f, ACC.assembly, ow + 0.04, 0.14, od + 0.04, ox, oh - 0.06, oz);
        box(f, 'roof', 0.9, 0.05, 0.5, ox - 0.5, 0.52, oz + od / 2 + 0.28); [-0.9, -0.1].forEach(function (cx) { box(f, 'steel', 0.04, 0.5, 0.04, ox + cx - 0.05, 0.26, oz + od / 2 + 0.5); });
        box(f, 'dark', 0.5, 0.42, 0.05, ox - 0.5, 0.21, oz + od / 2 + 0.04);
        box(f, 'metal', 0.04, oh + 1.1, 0.04, ox + ow / 2 - 0.25, (oh + 1.1) / 2, oz + od / 2 - 0.25);       // tiang bendera
        box(f, ACC.assembly, 0.34, 0.2, 0.03, ox + ow / 2 - 0.08, oh + 0.95, oz + od / 2 - 0.25);
        // pos jaga + palang
        var gx = -def.w / 2 + 1.2;
        box(f, 'wall', 0.8, 0.62, 0.7, gx, 0.31, 3.7); box(f, 'roof', 0.92, 0.06, 0.82, gx, 0.65, 3.7); box(f, 'win', 0.5, 0.18, 0.04, gx, 0.4, 3.7 + 0.37);
        box(f, 'metal', 0.06, 0.5, 0.06, gx + 0.7, 0.25, 3.7);
        for (i = 0; i < 4; i++) box(f, i % 2 ? 'white' : 'red', 0.3, 0.07, 0.06, gx + 0.85 + i * 0.3, 0.52, 3.7);
        // pagar depan (celah di gerbang)
        var fx0 = gx + 2.4, fx1 = def.w / 2 - 0.5;
        box(f, 'fence', fx1 - fx0, 0.03, 0.03, (fx0 + fx1) / 2, 0.4, 4.4); box(f, 'fence', fx1 - fx0, 0.03, 0.03, (fx0 + fx1) / 2, 0.2, 4.4);
        for (var fp = fx0; fp <= fx1; fp += 1.3) box(f, 'fence', 0.04, 0.44, 0.04, fp, 0.22, 4.4);
        // parkir karyawan (jumlah mobil mengikuti headcount) + bus antar-jemput
        for (i = 0; i < 9; i++) box(f, 'stripe', 0.03, 0.01, 0.62, -8.0 + i * 0.78, 0.035, 3.2);
        var nCars = clamp(Math.round(total / 14), 2, 14), carMats = ['carA', 'carB', 'carC', 'carD'];
        for (i = 0; i < nCars; i++) {
            var cxp = -7.6 + (i % 8) * 0.78, czp = i < 8 ? 3.25 : 2.55, cm = carMats[i % 4];
            box(f, cm, 0.55, 0.14, 0.3, cxp, 0.1, czp); box(f, 'win', 0.28, 0.1, 0.26, cxp - 0.02, 0.22, czp);
        }
        if (L >= 2) { box(f, 'amber', 1.5, 0.34, 0.5, 0.9, 0.2, 3.3); box(f, 'glass', 1.3, 0.12, 0.52, 0.9, 0.27, 3.3); [-0.45, 0.45].forEach(function (bx) { cyl(f, 'dark', 0.08, 0.08, 0.9 + bx, 0.07, 3.55).rotation.x = Math.PI / 2; }); }
        // gardu listrik & tangki air di belakang
        box(f, 'steel', 0.7, 0.4, 0.5, xR - 1.0, 0.2, zB - 0.5); box(f, 'safety', 0.9, 0.04, 0.7, xR - 1.0, 0.05, zB - 0.5);
        cyl(f, 'metal', 0.38, 0.9, xR - 2.2, 0.45, zB - 0.5);
    };

    // ---------- konstruksi (perancah + crane + bangunan tumbuh + bar progres) ----------
    function construction(f, def, st, tk) {
        var b = st.building, L = Math.max(1, b.target), dm = dimsFor(def, L);
        var bw = dm.bw, bd = dm.bd, bh = dm.bh, zc = ZC;
        if (def.kind === 'fab') zc = ZC - 0.1;
        if (def.kind === 'assembly') zc = ASM_ZC;
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
        var dm = dimsFor(def, 2), zc = def.kind === 'fab' ? ZC - 0.1 : (def.kind === 'assembly' ? ASM_ZC : ZC);
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
        r.roofMeshes = []; f.userData.roofSink = r.roofMeshes;      // atap dicatat ulang setiap bangun (furn dibangun ulang)
        f.userData.asmRig = null;
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
                top = dm.bh + (key === 'display' ? 1.9 : key === 'fab' ? 2.8 : key === 'soc' ? 1.9 : key === 'ram' ? 1.6 : key === 'hub' ? 1.4 : key === 'assembly' ? 1.7 : 1.2);
                if (def.kind === 'plant') levelPips(f, def.id, st.level, 4);
                if (def.kind !== 'hub' && def.kind !== 'assembly') crateStacks(f, st.stock, -2.6, 2.1, def.id);
            } else {
                top = ghostBuilding(f, def, st.status === 'locked').top;
            }
        } catch (e) { console.warn('[ManufactureScene] gagal bangun ' + def.id, e); }
        applyInside(r);
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

    // ---------- mode masuk Assembly: atap gergaji disembunyikan, label stasiun dari data ----------
    // Tidak ada mesh baru: atap yang sudah dibuat hanya diubah visibilitasnya; label stasiun berupa sprite.
    function applyInside(r) {
        var on = !!r.inside;
        (r.roofMeshes || []).forEach(function (m) { m.visible = !on; });
        (r.stations || []).forEach(function (s) { s.visible = on; });
        if (r.furn.userData.asmRig) r.furn.userData.asmRig.setInside(on);
    }
    function setInside(r, on) {
        on = !!on;
        if (!r || !!r.inside === on) return;
        r.inside = on;
        applyInside(r);
        requestRender();
        rig.requestShadowUpdate();
    }
    function clearStations(r) {
        (r.stations || []).forEach(function (sp) {
            r.group.remove(sp);
            if (sp.material) sp.material.dispose();
            var tx = sp.userData.tex;
            if (tx) { tx.dispose(); var ix = labelTex.indexOf(tx); if (ix >= 0) labelTex.splice(ix, 1); }
        });
        r.stations = [];
    }
    var STN_KEY = { operator: 'stn.operator', qc: 'stn.qc', technician: 'stn.technician', supervisor: 'stn.supervisor' };
    function stationLines(st) {
        var a = st && st.asm;
        if (!a || !a.workers) return null;
        var crew = (a.levelInfo && a.levelInfo.crew) || {};
        return ASSEMBLY_ROLES.map(function (role) {
            var s = ms(STN_KEY[role.id] || role.id) + ' ' + (a.workers[role.id] || 0) + '/' + (crew[role.id] || 0);
            if (role.id === 'operator') s += ' · ' + ms('stn.util', { v: Math.round(clamp(a.utilization || 0, 0, 1) * 100) });
            return s;
        });
    }
    // Satu label per peran (maks 4), di depan bay. Dibangun ulang hanya bila teks/level/tema berubah.
    function refreshStations(r) {
        if (!r) return;
        var st = r.st, lines = (r.def.id === 'assembly' && st && st.status === 'built') ? stationLines(st) : null;
        var key = lines ? 'L' + st.level + '|' + lines.join('|') + (dark ? '|d' : '|l') : '';
        if (key !== (r.stationKey || '')) {
            clearStations(r);
            r.stationKey = key;
            if (lines) {
                var dm = dimsFor(r.def, st.level), bw = dm.bw, bd = dm.bd, bh = dm.bh;
                var x = -bw / 2 + bw * 0.55;                                 // pusat bay terbuka (lihat TYPE.assembly)
                lines.forEach(function (text, i) {
                    var sp = makeLabel(text, dark, false, r.def.accent);
                    sp.position.set(x, PAD_TOP + bh - 0.6 + i * 0.5, ASM_ZC + bd / 2 + 0.9);
                    r.group.add(sp);
                    r.stations.push(sp);
                });
            }
        }
        applyInside(r);
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
        lastWinSun = -1;                                        // paksa hitung ulang nyala senja pada frame berikutnya
        M.shade.opacity = dark ? 0.22 : 0.14;
        farCampus.setDark(dark);
        sea.setTheme(dark);
        sea.setWeather(weather.getKind(), weather.getSunset());
        cine.setTheme(dark);
        M.selRing.color.setHex(accentHex);
        M.lamp.color.setHex(dark ? 0xffe39a : 0xfff1c4);
        lampPosts.forEach(function (l) { var s = dark ? 0.16 : 0.12; l.scale.set(s, s, s); });
        weather.applyLook(rig.applyTheme(dark));
        plotList.forEach(function (r) { if (r.st) rebuildLabel(r); if (r.st) rebuildAlert(r); });
        if (plots.assembly) { plots.assembly.stationKey = null; refreshStations(plots.assembly); }
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
    var ASM_IN_ZOOM = 1.6;
    function insideTarget(r) {                                               // pusat hall Assembly (koordinat dunia)
        return { x: r.def.x, z: r.def.z + ASM_ZC, zoom: Math.max(controls.view.zoom, ASM_IN_ZOOM) };
    }
    function focusPlot(id) {
        var r = plots[id];
        if (!r) return;
        if (id === 'assembly' && r.inside) { var t = insideTarget(r); tweenView(t.x, t.z, t.zoom); return; }
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
        animateContainers(sec);
        animateShip(sec);
        animateCrane(sec);
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
        ctList.forEach(function (tr) { tr.active = srcActive(tr.slot.id); });
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
        weather.update(sec, ambient);
        sea.update(sec, weather.getKind(), weather.getSunset());
        if (fxList.length) updateFx(sec);
        cineTick();
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
            weather.update(performance.now() / 1000, ambient);
            sea.setWeather(weather.getKind(), weather.getSunset());
            cineTick();
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
        var asm = plots.assembly, entering = id === 'assembly' && !!asm && !asm.inside;
        setInside(asm, id === 'assembly');                                   // masuk saat Assembly dipilih, keluar saat yang lain
        if (entering) { var t = insideTarget(asm); tweenView(t.x, t.z, t.zoom); }
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
        bounds: { minX: -22, maxX: LINK.OFFSET - 12, minZ: -20, maxZ: 27 },   // geser ke timur sampai jembatan/Pulau Kampus
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
        refreshStations(plots.assembly);
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
            scene.remove(sea.mesh); sea.dispose();
            cine.dispose();
            farCampus.dispose();
            plotList.forEach(function (r) {
                if (r.label && r.label.material) r.label.material.dispose();
                if (r.alertSp && r.alertSp.material) r.alertSp.material.dispose();
                clearStations(r);
                r.ovMat.dispose();
            });
            while (fxList.length) endFx(0);
            Object.keys(fxMatMap).forEach(function (k) { fxMatMap[k].dispose(); });
            labelTex.forEach(function (tx) { tx.dispose(); });
            Object.keys(alertTex).forEach(function (k) { alertTex[k].dispose(); });
            Object.keys(G).forEach(function (k) { G[k].dispose(); });
            Object.keys(M).forEach(function (k) { M[k].dispose(); });
            [ACC, GLOW, GHOST, EDGE].forEach(function (grp) { Object.keys(grp).forEach(function (k) { grp[k].dispose(); }); });
            weather.dispose();
            rig.dispose();
            renderer.dispose();
            try { renderer.forceContextLoss(); } catch (e) {}
            [chipBar, card, hint, legendBtn, legend, canvas].forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
        }
    };
}
