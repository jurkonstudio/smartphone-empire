// FILE: src/ui/office/OfficeScene.js  (REPLACE)
// v2027.54a — kantor kini berdiri di dalam AREA KAMPUS (bukan pulau di tengah laut):
//   * Laut, pantai, busa ombak, bukit & batu dihapus. Gantinya: halaman kampus (lawn + plaza paving + trotoar),
//     jalan masuk dari gerbang depan ke pintu utama kantor, taman, bangku, tiang lampu, kolam air mancur,
//     dan gedung-gedung kampus tetangga (perpustakaan, aula, student center, asrama) di sisi belakang/kiri
//     supaya tidak menutupi denah kantor dari kamera isometrik.
//   * Gedung kantor punya podium bertingkat, pintu utama di dinding depan (celah + keset + tangga), kusen &
//     ambang jendela, dan lis atas (cornice) di dinding tinggi.
//   * Tata letak lebih rapi: warna lantai antar ruangan diseragamkan (campur ke netral), tutup atas partisi
//     seragam, kolam cahaya malam berbentuk persegi mengikuti ruangan (bukan lingkaran besar).
//   * Tidak mengubah ukuran/posisi ruangan, rute jalan staf, logika game, atau antarmuka kartu.
// v2027.53b — perbaikan audit tata letak:
//   * BUG KRITIS: indeks rambut memakai shift bertanda (h >> 3) pada hash tak bertanda. Untuk ~41% id staf
//     indeksnya negatif -> material undefined -> pembangunan ruang Work berhenti di tengah (staf & meja
//     setelahnya hilang). Sekarang memakai >>> (tanpa tanda).
//   * Tanaman pojok Work & dispenser digeser agar tidak menembus dinding/partisi/meja; rak buku CEO menempel dinding.
//   * Slot kosong terlihat rapi: podium bayangan di Showroom (sesuai kapasitas), meja bayangan di Marketing.
//     Grid podium tetap sama saat produk bertambah.
// v2027.53a — progres riset & fase produk tampil sebagai bar 3D di Lab / Studio Desain; event game
//   (riset selesai, produk rilis, penjualan, OS dirilis, Fab berdiri/upgrade, kenaikan skill) memunculkan
//   efek partikel + label melayang di ruangan terkait. Efek dibatasi jumlahnya & dimatikan saat animasi nonaktif.
// v2027.52b — label ruangan & chip dirender 2x (lebih tajam di HP).
// v2027.52a — Office 3D Map: interior kantor isometrik (dollhouse) yang terhubung ke data game.
//
// Peningkatan v2027.52a (tahap 3):
//   * UPGRADE LANGSUNG DARI PETA — kartu Lab Chip memuat tombol "Bangun Fab" / "Upgrade ke …" lengkap
//     dengan harga, estimasi hari & alasan bila belum bisa (riset belum ada / uang kurang). Kartu staf
//     memuat tombol "Latih" (biaya & progres skill). Semua memakai sistem game yang sama dengan panel
//     (FabSystem.buildFab/upgradeFab, TeamSystem.trainStaff) — tidak ada logika ganda.
//   * Konstruksi 3D: saat Fab dibangun / di-upgrade, Lab Chip menampilkan lokasi konstruksi (perancah,
//     derek berputar, bangunan yang tumbuh, bar progres) dan kartu menampilkan persen + sisa hari.
//   * Staf lebih hidup: tujuan jalan sesuai peran (Lab, Studio Desain, Marketing, Showroom, Ruang CEO,
//     dispenser air), maksimal 5 staf berjalan sekaligus, rute bergantian tiap siklus, gelembung emoji
//     (☕ 💡 💤 🧪 🎨 📣 …), gerakan minum kopi di meja, dan baris "Aktivitas" yang hidup di kartu staf.
//   * Rapi di HP: kartu bawah bisa diciutkan, tinggi dibatasi + bisa di-scroll, area aman (notch),
//     tombol lebih besar, di layar lebar kartu jadi panel melayang; kamera otomatis bergeser supaya
//     ruangan/staf terpilih tidak tertutup kartu; chip ruangan tidak lagi "loncat" ke awal tiap update
//     dan otomatis menggulung ke chip terpilih; kartu tidak dibangun ulang bila isinya tak berubah
//     (ketukan tombol tidak lagi hilang saat state game berubah).
//
// Peningkatan v2027.51a (sesi 1) — tetap berlaku:
//   * Lantai bermotif per ruangan (kayu / ubin / grid / karpet), bayangan palsu di bawah perabot,
//     kolam cahaya hangat + jendela menyala saat malam (tema gelap), keset pintu, jam & papan nama
//     perusahaan di dinding.
//   * Staf lebih hidup: wajah (mata), rambut bervariasi, aksesori per peran (headphone / kacamata /
//     headset), plat nama berwarna sesuai tier skill, pose lesu saat moral rendah, dan beberapa staf
//     berjalan keluar meja menuju ruang CEO / Lab lalu kembali (hanya jika animasi aktif).
//   * Ruangan lebih detail: kipas rak server, lengan robot di Lab Chip, sinar spotlight showroom,
//     koin berputar di brankas, karpet + lukisan di ruang CEO, mesin kopi + laptop/PC sesuai era.
//   * Gelembung peringatan di atas ruangan (bug OS, kas negatif, moral staf rendah) + titik
//     peringatan pada chip ruangan.
//   * Interaksi: staf terpilih diberi cincin sorot + kamera fokus, kartu staf memuat trait & negara,
//     tombol legenda (ⓘ), pemulihan WebGL context-loss, kualitas render adaptif untuk HP lemah.
//   * Perbaikan: bug material 'glow' globe CEO, kebocoran tekstur, label tidak ikut ganti bahasa.
//
//   Staf            -> orang di meja (warna = peran, bola kecil = moral). Ketuk untuk detail.
//   Riset           -> Lab R&D (orb melayang = riset aktif, papan tulis = riset selesai)
//   Desain produk   -> Studio Desain (ponsel di turntable + 4 pip fase pengembangan)
//   OS              -> Ruang Server (rak = versi OS, LED merah = bug terbuka)
//   Fab / chip      -> Lab Chip (mesin = level Fab, konveyor jalan saat produksi)
//   Produk dijual   -> Showroom (podium per produk, peti = stok)
//   Kampanye        -> Ruang Marketing (layar menyala = kampanye aktif)
//   Kas / utang     -> Keuangan (brankas, tumpukan koin, map utang, papan bursa)
//   Reputasi/pangsa -> Ruang CEO (piala di rak)
//
// Ruangan terkunci tampil sebagai "blueprint" sampai syaratnya terpenuhi.
// Ketuk ruangan -> kartu info + tombol menuju panel terkait (lewat bus 'advisor:go').
// Level & era dibaca dari computePlan() milik Campus supaya konsisten dengan peta kampus.
// Render-on-demand; animasi ambient ~30fps dan berhenti saat tab tersembunyi / di luar layar.
// Denah lantai: x -9..9, z -6..6 (kamera isometrik melihat dari +x,+z).
// Warna tema sendiri (selain warna dari PALETTES kampus). [terang, gelap]

import { frameGapMs, getRenderFps } from '../../core/RenderFps.js';
import { ROLES, SKILL_TIERS, TRAITS } from '../../data/staff.data.js';
import { ToastService } from '../../core/ToastService.js';
import { bus } from '../../core/EventBus.js';
import { computePlan, rememberPeak, PALETTES, ERA_WINDOWS } from '../campus/CampusBuildings.js';
import { createLookRig, detectQuality } from '../campus/CampusLook.js';
import { createCampusControls } from '../campus/CampusControls.js';
import { t } from '../../core/LanguageService.js';
import { BASE_VIEW, COLORS, COLS, ROWS, CORRIDORS, DEST_BY_ROLE, DEST_DEFAULT, DEST_EMOJI, DEST_ROOM, DOOR_EAST, DOOR_NORTH, FLOOR, FRAME_MS, HAIR, MAX_DESKS, MAX_DPR, MIN_RESIZE_DELTA, MORALE_HEX, NARROW_PX, PHASES, ROOM_DEFS, SHADOW_OPACITY, SKIN, WALKERS_MAX, clamp, deskCapacity, hash, hexCss, len, moraleTier, prefersReducedMotion, readAccent, roleCount, sortedStaff, tint } from './OfficeConfig.js';
import { describeRoom, describeStaff, fabProgress, roomAlert, totalStock, trophyCount, ROOM_LOGIC } from './OfficeLogic.js';
import { activeResearchPct, devPhaseFrac } from './OfficeFx.js';

// ============================================================
// SCENE
// ============================================================
export function createOfficeScene(THREE, container, gameState) {
    var PERF = window.__PERF || {};
    var look = detectQuality(PERF);     // tier kualitas sama dengan Peta Kampus (low | medium | high)
    var renderer = new THREE.WebGLRenderer({ antialias: PERF.antialias !== false, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR, look.maxDpr));
    renderer.setClearColor(0x000000, 0);
    var canvas = renderer.domElement;
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', t('office.aria'));
    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.isolation = 'isolate';
    container.style.overflow = 'hidden';
    container.style.background = 'radial-gradient(ellipse at 50% 24%, rgba(96,165,250,.17) 0%, rgba(148,163,184,.09) 38%, transparent 72%), radial-gradient(ellipse at 50% 100%, rgba(15,23,42,.07), transparent 52%), linear-gradient(145deg, var(--bg-2, #f9fbff), var(--bg-1, #e7edf6))';
    container.appendChild(canvas);

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    // Cahaya, tone mapping, environment map & bayangan nyata: rig yang sama dengan Peta Kampus.
    var rig = createLookRig(THREE, renderer, scene, look);
    // Ruangan dan staf bergerak, jadi shadow map ikut diperbarui (kantor kecil, biayanya kecil).
    renderer.shadowMap.autoUpdate = !!rig.shadowsOn;

    // ---------- geometri bersama ----------
    var G = {
        box: new THREE.BoxGeometry(1, 1, 1),
        cyl: new THREE.CylinderGeometry(1, 1, 1, 20),
        sph: new THREE.SphereGeometry(1, 16, 12),
        cone: new THREE.ConeGeometry(1, 1, 18),
        tor: new THREE.TorusGeometry(1, 0.07, 8, 28),
        plane: new THREE.PlaneGeometry(1, 1),
        circle: new THREE.CircleGeometry(1, 28),
        arc: new THREE.TorusGeometry(1, 0.07, 6, 18, Math.PI),
        ring: new THREE.RingGeometry(0.78, 1, 36),
        ico: new THREE.IcosahedronGeometry(1, 0)
    };

    // ---------- material bersama ----------
    var M = {};
    // Material PBR ringan (MeshStandard) supaya menangkap env map & bayangan seperti bangunan kampus.
    var PBR = {                  // [roughness, metalness]
        ground: [0.95, 0], base: [0.8, 0], metal: [0.35, 0.35], glass: [0.12, 0.1],
        gold: [0.3, 0.6], leaf: [0.7, 0], trunk: [0.9, 0],
        grass2: [0.97, 0], leaf2: [0.9, 0], soil: [1, 0], ocean: [0.42, 0], shallow: [0.4, 0],
        foam: [0.9, 0], sand: [0.95, 0], sandWet: [0.9, 0], rock: [0.9, 0]
    };
    function pbr(color, key) {
        var p = PBR[key] || [0.7, 0];
        var mt = new THREE.MeshStandardMaterial({ color: color, roughness: p[0], metalness: p[1] });
        mt.envMapIntensity = 0.6;
        return mt;
    }
    Object.keys(COLORS).forEach(function (k) { M[k] = pbr(COLORS[k][0], k); });
    M.glass.transparent = true; M.glass.opacity = 0.55;
    M.ghost = new THREE.MeshStandardMaterial({ color: COLORS.desk[0], transparent: true, opacity: 0.4 });
    M.screenOn = new THREE.MeshBasicMaterial({ color: 0x8fb4e8 });
    M.screenOff = new THREE.MeshBasicMaterial({ color: 0x1b2028 });
    M.glow = new THREE.MeshBasicMaterial({ color: 0x00b8d9 });
    M.holo = new THREE.MeshBasicMaterial({ color: 0x00b8d9, transparent: true, opacity: 0.28, depthWrite: false });
    M.ledG = new THREE.MeshBasicMaterial({ color: 0x43e08a });
    M.ledR = new THREE.MeshBasicMaterial({ color: 0xff4d4d });
    M.ledA = new THREE.MeshBasicMaterial({ color: 0xffc247 });
    M.shade = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.12, depthWrite: false });
    M.pool = new THREE.MeshBasicMaterial({ color: 0xffe2a8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    M.selRing = new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.95, depthTest: false, side: THREE.DoubleSide });
    M.shade.opacity = SHADOW_OPACITY;
    var hairMat = HAIR.map(function (c) { return new THREE.MeshStandardMaterial({ color: c }); });
    var tierMat = {};
    SKILL_TIERS.forEach(function (tr) { tierMat[tr.tier] = new THREE.MeshBasicMaterial({ color: parseInt(String(tr.color).replace('#', ''), 16) || 0x949aab }); });
    var roleMat = {};
    ROLES.forEach(function (r) { roleMat[r.id] = new THREE.MeshStandardMaterial({ color: parseInt(String(r.color).replace('#', ''), 16) || 0x888888 }); });
    var skinMat = SKIN.map(function (c) { return new THREE.MeshStandardMaterial({ color: c }); });
    var moraleMat = MORALE_HEX.map(function (c) { return new THREE.MeshBasicMaterial({ color: c }); });
    var hueMats = {};
    function hueMat(key) {
        if (!hueMats[key]) {
            var h = hash(key) % 360;
            hueMats[key] = new THREE.MeshStandardMaterial({ color: new THREE.Color('hsl(' + h + ', 62%, 58%)') });
        }
        return hueMats[key];
    }

    function mesh(parent, geo, mat, sx, sy, sz, x, y, z) {
        var mm = typeof mat === 'string' ? M[mat] : mat;
        var m = new THREE.Mesh(geo, mm);
        m.scale.set(sx, sy, sz);
        m.position.set(x, y, z);
        // Bayangan nyata hanya untuk benda padat. Material transparan & unlit (layar, sorot, gelembung) tidak melempar bayangan.
        m.castShadow = !!look.shadows && !mm.transparent && !mm.isMeshBasicMaterial;
        m.receiveShadow = !!look.shadows;
        parent.add(m);
        return m;
    }
    function box(p, mat, w, h, d, x, y, z) { return mesh(p, G.box, mat, w, h, d, x, y, z); }
    function cyl(p, mat, r, h, x, y, z) { return mesh(p, G.cyl, mat, r, h, r, x, y, z); }
    function sph(p, mat, r, x, y, z) { return mesh(p, G.sph, mat, r, r, r, x, y, z); }
    function cone(p, mat, r, h, x, y, z) { return mesh(p, G.cone, mat, r, h, r, x, y, z); }
    // bayangan palsu: bidang gelap tipis di lantai (murah, tanpa shadow map)
    function shadowBox(p, w, d, x, z) {
        var m = mesh(p, G.plane, 'shade', w, d, 1, x, 0.03, z);
        m.rotation.x = -Math.PI / 2;
        m.visible = !look.shadows;     // tier low saja: bayangan palsu. Tier lain memakai bayangan nyata.
        return m;
    }
    function shadowRound(p, r, x, z) {
        var m = mesh(p, G.circle, 'shade', r, r, 1, x, 0.03, z);
        m.rotation.x = -Math.PI / 2;
        m.visible = !look.shadows;
        return m;
    }

    // ---------- tekstur motif lantai (putih transparan; warna diatur lewat material) ----------
    var ownTex = [];
    function makePatternTexture(type, w, d) {
        var c = document.createElement('canvas');
        c.width = 128; c.height = 128;
        var ctx = c.getContext('2d');
        ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 3;
        var i;
        ctx.beginPath();
        if (type === 'wood') {
            for (i = 0; i <= 128; i += 32) { ctx.moveTo(0, i); ctx.lineTo(128, i); }
            for (i = 0; i < 4; i++) { var off = (i % 2) * 64 + 20 * (i % 3); ctx.moveTo(off % 128, i * 32); ctx.lineTo(off % 128, i * 32 + 32); }
        } else if (type === 'tile') {
            ctx.moveTo(0, 0); ctx.lineTo(128, 0); ctx.moveTo(0, 0); ctx.lineTo(0, 128);
            ctx.moveTo(64, 0); ctx.lineTo(64, 128); ctx.moveTo(0, 64); ctx.lineTo(128, 64);
        } else if (type === 'grid') {
            ctx.lineWidth = 2;
            for (i = 0; i <= 128; i += 32) { ctx.moveTo(i, 0); ctx.lineTo(i, 128); ctx.moveTo(0, i); ctx.lineTo(128, i); }
        } else if (type === 'diag') {
            for (i = -128; i <= 128; i += 64) { ctx.moveTo(i, 0); ctx.lineTo(i + 128, 128); ctx.moveTo(i + 128, 0); ctx.lineTo(i, 128); }
        } else if (type === 'dots') {
            for (var gx = 16; gx < 128; gx += 32) for (var gy = 16; gy < 128; gy += 32) { ctx.moveTo(gx + 3, gy); ctx.arc(gx, gy, 3, 0, Math.PI * 2); }
            ctx.fill();
        } else {   // carpet: garis diagonal halus
            ctx.lineWidth = 2;
            for (i = -128; i <= 128; i += 16) { ctx.moveTo(i, 0); ctx.lineTo(i + 128, 128); }
        }
        if (type !== 'dots') ctx.stroke();
        var tex = new THREE.CanvasTexture(c);
        tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(Math.max(1, w / 2), Math.max(1, d / 2));
        ownTex.push(tex);
        return tex;
    }

    // ---------- label sprite ----------
    var labelTex = [];
    function makeLabel(text, dark, dim, accentHex) {
        var c = document.createElement('canvas');
        var ctx = c.getContext('2d');
        var font = '700 26px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.font = font;
        var w = Math.ceil(ctx.measureText(text).width) + 36, h = 52;
        // Render 2x supaya teks tajam di layar HP (ukuran sprite di dunia tetap sama).
        var SS = 2;
        c.width = w * SS; c.height = h * SS;
        ctx.setTransform(SS, 0, 0, SS, 0, 0);
        ctx.font = font;
        ctx.fillStyle = dark ? 'rgba(20,24,32,0.88)' : 'rgba(255,255,255,0.92)';
        ctx.strokeStyle = hexCss(accentHex);
        ctx.lineWidth = 3;
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
        var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, opacity: dim ? 0.7 : 1 });
        var sp = new THREE.Sprite(mat);
        sp.scale.set(0.49 * w / h, 0.49, 1);
        sp.renderOrder = 20;
        sp.userData.tex = tex;
        return sp;
    }

    // ---------- state scene ----------
    var dark = false, accentHex = 0x2563eb, eraIdx = 0, winHex = 0x8fb4e8;
    var rooms = {};           // id -> room obj
    var roomList = [];
    var staffObjs = {};       // staffId -> group (untuk highlight / info)
    var lastData = null, lastPlan = null;
    var selected = null;      // { room, staffId }
    var disposed = false;
    var animRooms = [];       // room yang punya tick()
    var aspect = 1, lastW = 0, lastH = 0, resizeScheduled = false, fitted = false;
    var raycaster = new THREE.Raycaster();
    var ndc = new THREE.Vector2();
    var raf = 0, loopRaf = 0, loopTimer = 0, lastFrame = 0, inView = true, focusRaf = 0;
    var ambient = !prefersReducedMotion();
    var selRing = mesh(scene, G.ring, 'selRing', 0.5, 0.5, 1, 0, 0.05, 0);
    selRing.rotation.x = -Math.PI / 2;
    selRing.renderOrder = 15;
    selRing.visible = false;
    var alertTex = {};         // kind -> CanvasTexture bersama
    var legendOn = false;
    var quality = { slow: 0, fast: 0, lowered: false, frameMs: FRAME_MS };
    var lastRendered = 0, ctxLost = false;
    var tmpV = new THREE.Vector3();
    var activity = {};         // staffId -> { key, dest } aktivitas terkini (untuk kartu staf)
    var bubbleTex = {};        // emoji -> CanvasTexture bersama (gelembung di atas staf)
    var shiftPx = 0, shiftTarget = 0;      // geser kamera ke atas supaya objek terpilih tidak tertutup kartu (HP)
    var cardCollapsed = false, cardSig = '', chipSig = '', cardWasVisible = false, actLabelTick = 0;
    var actLabelEl = null;     // elemen baris "Aktivitas" di kartu staf
    var busy = false;          // cegah ketukan ganda pada tombol aksi

    // ---------- shell statis (lantai dasar, dinding, partisi) ----------
    var shell = new THREE.Group();
    scene.add(shell);
    // ---------- lingkungan: AREA KAMPUS (halaman, plaza, jalan, taman, gedung tetangga) ----------
    // Lantai kantor tetap di y = 0. Rumput kampus di y = GY, plaza paving sedikit di atasnya.
    // Kamera melihat dari +x,+z, jadi benda TINGGI hanya ditaruh di sisi belakang (z<0) & kiri (x<0);
    // sisi depan/kanan hanya benda rendah (rumput, jalan, semak, bangku, kolam) supaya denah tidak tertutup.
    var GY = -0.22;
    var PZ = GY + 0.02;                // permukaan plaza (sedikit di atas rumput, hindari z-fighting)
    var envRnd = (function () { var sd = 2468; return function () { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; }; })();
    function env(geo, mat, sx, sy, sz, x, y, z) {       // objek lingkungan: menerima bayangan, tidak melempar (hemat)
        var m = mesh(shell, geo, mat, sx, sy, sz, x, y, z);
        m.castShadow = false;
        return m;
    }
    function envBox(mat, w, h, d, x, y, z) { return env(G.box, mat, w, h, d, x, y, z); }
    function tree(x, z, s) {
        env(G.cyl, 'trunk', 0.11 * s, 0.6 * s, 0.11 * s, x, GY + 0.3 * s, z);
        env(G.sph, envRnd() < 0.5 ? 'leaf' : 'leaf2', 0.5 * s, 0.5 * s, 0.5 * s, x, GY + 0.9 * s, z);
        env(G.sph, 'leaf2', 0.32 * s, 0.32 * s, 0.32 * s, x + 0.1 * s, GY + 1.32 * s, z - 0.08 * s);
    }
    function lamp(x, z) {
        env(G.cyl, 'metal', 0.04, 1.5, x, GY + 0.75, z);
        env(G.sph, 'ledA', 0.1, x, GY + 1.55, z);
    }
    function bench(x, z, rotY) {
        var g = new THREE.Group();
        g.position.set(x, GY, z);
        g.rotation.y = rotY || 0;
        shell.add(g);
        box(g, 'wood', 1.4, 0.07, 0.38, 0, 0.36, 0).castShadow = false;
        box(g, 'wood', 1.4, 0.3, 0.05, 0, 0.55, -0.18).castShadow = false;
        box(g, 'dark', 0.06, 0.34, 0.34, -0.6, 0.17, 0).castShadow = false;
        box(g, 'dark', 0.06, 0.34, 0.34, 0.6, 0.17, 0).castShadow = false;
    }
    // gedung kampus tetangga: badan + atap + pita jendela di sisi yang menghadap kamera (+z dan +x)
    function campusBlock(x0, x1, z0, z1, h, bodyMat) {
        var w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, k;
        envBox(bodyMat || 'bldg', w, h, d, cx, GY + h / 2, cz);
        envBox('bldgRoof', w + 0.3, 0.16, d + 0.3, cx, GY + h + 0.08, cz);
        envBox('bldgBand', w + 0.1, 0.12, d + 0.1, cx, GY + 0.06, cz);          // sokel bawah
        var floors = h > 3 ? 2 : 1;
        for (k = 0; k < floors; k++) {
            var wy = GY + (h * (floors === 2 ? (k === 0 ? 0.3 : 0.7) : 0.55));
            envBox('win', Math.max(1, w - 1.2), 0.55, 0.05, cx, wy, z1 + 0.02);        // sisi depan (+z)
            envBox('win', 0.05, 0.55, Math.max(1, d - 1.0), x1 + 0.02, wy, cz);        // sisi kanan (+x)
        }
        envBox('dark', 0.9, 0.9, 0.06, cx + w * 0.18, GY + 0.45, z1 + 0.03);           // pintu
    }

    // halaman kampus (diorama): rumput + bibir tanah. Pinggir kiri/kanan sengaja keluar layar di HP.
    envBox('soil', 36.5, 1.0, 28.5, 0, GY - 0.35 - 0.5, 0);
    envBox('ground', 36, 0.6, 28, 0, GY - 0.3, 0);
    // plaza paving di sekeliling gedung kantor + bingkai trotoar
    envBox('paving', 26, 0.1, 19.6, 0, PZ - 0.05, 0);
    envBox('curb', 26.4, 0.1, 0.22, 0, PZ + 0.0, -9.9);
    envBox('curb', 26.4, 0.1, 0.22, 0, PZ + 0.0, 9.9);
    envBox('curb', 0.22, 0.1, 19.6, -13.1, PZ + 0.0, 0);
    envBox('curb', 0.22, 0.1, 19.6, 13.1, PZ + 0.0, 0);
    // jalan: dari pintu utama (x = -3) ke gerbang depan, jalan lintang depan, jalan kiri & belakang
    envBox('path', 2.4, 0.1, 6.9, -3, GY + 0.04, 10.65);
    envBox('path', 36, 0.1, 1.6, 0, GY + 0.04, 11.9);
    envBox('path', 1.2, 0.1, 22.3, -14.1, GY + 0.04, 0.75);
    envBox('path', 36, 0.1, 1.0, 0, GY + 0.04, -10.4);
    // marka tengah jalan masuk (garis putus-putus)
    for (var pm = 0; pm < 5; pm++) envBox('white', 0.08, 0.01, 0.6, -3, GY + 0.095, 7.6 + pm * 1.2);
    // gerbang depan: dua tiang + papan lintel rendah di pinggir halaman
    envBox('curb', 0.5, 1.1, 0.5, -4.7, GY + 0.55, 13.2);
    envBox('curb', 0.5, 1.1, 0.5, -1.3, GY + 0.55, 13.2);
    envBox('gold', 0.4, 0.08, 0.4, -4.7, GY + 1.14, 13.2);
    envBox('gold', 0.4, 0.08, 0.4, -1.3, GY + 1.14, 13.2);
    // gedung kampus tetangga (belakang & kiri)
    campusBlock(-17, -8, -13.8, -11.0, 3.6, 'bldg');        // perpustakaan
    campusBlock(-6.5, 2, -13.8, -11.0, 2.8, 'bldg');        // aula kuliah
    campusBlock(4, 12.5, -13.8, -11.0, 2.4, 'bldg');        // student center
    campusBlock(-17.7, -15.0, -8.6, -1.2, 2.8, 'bldg');     // asrama (sisi kiri)
    campusBlock(-17.7, -15.0, 2.2, 8.6, 2.2, 'bldg');       // lab annex (sisi kiri depan)
    // tiang bendera di belakang-kiri plaza (tinggi, tapi di belakang denah)
    envBox('metal', 0.08, 3.6, 0.08, -10.3, GY + 1.8, -8.7);
    envBox('red', 0.9, 0.5, 0.04, -9.85, GY + 3.25, -8.7);
    // taman depan: semak rapi di kiri & kanan jalan masuk, bangku & tiang lampu
    envBox('hedge', 4.6, 0.34, 0.7, -7.7, GY + 0.17, 8.25);
    envBox('hedge', 4.6, 0.34, 0.7, 1.7, GY + 0.17, 8.25);
    envBox('hedge', 4.6, 0.34, 0.7, 6.7, GY + 0.17, 8.25);
    envBox('hedge', 0.7, 0.34, 2.2, -12.2, GY + 0.17, 4.8);
    lamp(-4.9, 7.9); lamp(-1.1, 7.9); lamp(-4.9, 12.7); lamp(-1.1, 12.7);
    bench(-7.7, 9.2, 0); bench(1.7, 9.2, 0); bench(5.6, 9.2, 0); bench(7.8, 9.2, 0);
    // kolam air mancur di depan-kanan (rendah)
    env(G.cyl, 'curb', 1.25, 0.34, 1.25, 11.0, GY + 0.17, 8.0);
    env(G.cyl, 'shallow', 1.05, 0.36, 1.05, 11.0, GY + 0.17, 8.0);
    env(G.cyl, 'curb', 0.14, 0.7, 0.14, 11.0, GY + 0.35, 8.0);
    env(G.sph, 'foam', 0.2, 0.2, 0.2, 11.0, GY + 0.78, 8.0);
    // pohon: di planter plaza (pojok belakang & depan-kiri) dan baris di tepi halaman
    [[-11.8, -8.2], [11.8, -8.2], [-11.8, 8.2]].forEach(function (c) {
        env(G.cyl, 'curb', 0.62, 0.3, 0.62, c[0], PZ + 0.15, c[1]);
        env(G.cyl, 'trunk', 0.12, 0.9, 0.12, c[0], PZ + 0.7, c[1]);
        env(G.sph, 'leaf', 0.7, 0.7, 0.7, c[0], PZ + 1.35, c[1]);
    });
    var ti;
    for (ti = 0; ti < 9; ti++) {                        // baris pohon di tepi depan (z = 13.4), lewati gerbang
        var tx0 = -16 + ti * 3.6;
        if (Math.abs(tx0 + 3) < 2.4) continue;
        tree(tx0, 13.4, 0.9 + envRnd() * 0.3);
    }
    for (ti = 0; ti < 6; ti++) tree(16.4, -9 + ti * 3.4, 0.85 + envRnd() * 0.3);   // tepi kanan
    for (ti = 0; ti < 5; ti++) tree(-12 + ti * 3.3, -9.6 + (ti % 2) * 0.2, 0.9 + envRnd() * 0.25);   // di depan gedung belakang
    // petak rumput terang (hamparan lawn) di antara jalan, supaya halaman tidak datar
    [[-9.5, 13.0, 6, 1.4], [7.5, 13.0, 8, 1.4], [15.0, 6.2, 3, 9]].forEach(function (g) {
        envBox('grass2', g[2], 0.03, g[3], g[0], GY + 0.012, g[1]);
    });
    // podium bertingkat gedung kantor: plaza -> undakan -> lantai kantor
    envBox('curb', 19.4, 0.14, 13.4, 0, -0.15, 0);
    envBox('base', 18.5, 0.22, 12.5, 0, -0.11, 0);
    // tangga & keset di pintu utama (dinding depan, x = -3)
    envBox('curb', 2.4, 0.1, 0.5, -3, -0.19, 6.95);
    envBox('mat', 1.1, 0.012, 0.6, -3, 0.032, 5.62);

    function wallSeg(mat, x0, x1, z0, z1, h, th) {
        var w = Math.abs(x1 - x0) || th, d = Math.abs(z1 - z0) || th;
        return box(shell, mat, w, h, d, (x0 + x1) / 2, h / 2, (z0 + z1) / 2);
    }
    // dinding luar: belakang (z=-6) & kiri (x=-9) tinggi; depan & kanan rendah
    wallSeg('wall', FLOOR.x0 - 0.12, FLOOR.x1 + 0.12, FLOOR.z0 - 0.12, FLOOR.z0 + 0.12, 2.4, 0.24);
    wallSeg('wall', FLOOR.x0 - 0.12, FLOOR.x0 + 0.12, FLOOR.z0, FLOOR.z1, 2.4, 0.24);
    // dinding depan rendah dengan celah pintu utama (x -3.5 .. -2.5)
    wallSeg('wallTop', FLOOR.x0 - 0.12, -3.5, FLOOR.z1 - 0.1, FLOOR.z1 + 0.12, 0.35, 0.22);
    wallSeg('wallTop', -2.5, FLOOR.x1 + 0.12, FLOOR.z1 - 0.1, FLOOR.z1 + 0.12, 0.35, 0.22);
    box(shell, 'metal', 0.1, 0.9, 0.1, -3.55, 0.45, FLOOR.z1 + 0.02);
    box(shell, 'metal', 0.1, 0.9, 0.1, -2.45, 0.45, FLOOR.z1 + 0.02);
    wallSeg('wallTop', FLOOR.x1 - 0.1, FLOOR.x1 + 0.12, FLOOR.z0, FLOOR.z1, 0.35, 0.22);
    // jendela di dinding belakang & kiri
    var i0;
    for (i0 = 0; i0 < 11; i0++) {
        var wxx = -8.2 + i0 * 1.64;
        box(shell, 'wallTop', 1.32, 0.96, 0.04, wxx, 1.55, FLOOR.z0 + 0.11);          // kusen
        box(shell, 'win', 1.15, 0.8, 0.06, wxx, 1.55, FLOOR.z0 + 0.13);
        box(shell, 'wallTop', 1.36, 0.06, 0.14, wxx, 1.05, FLOOR.z0 + 0.17);          // ambang
    }
    for (i0 = 0; i0 < 7; i0++) {
        if (i0 === 4 || i0 === 5) continue;     // ruang untuk papan nama perusahaan (BUILD.work)
        var wzz = -5.1 + i0 * 1.7;
        box(shell, 'wallTop', 0.04, 0.96, 1.32, FLOOR.x0 + 0.11, 1.55, wzz);
        box(shell, 'win', 0.06, 0.8, 1.15, FLOOR.x0 + 0.13, 1.55, wzz);
        box(shell, 'wallTop', 0.14, 0.06, 1.36, FLOOR.x0 + 0.17, 1.05, wzz);
    }
    // lis atas (cornice) di dinding tinggi
    box(shell, 'wallTop', FLOOR.x1 - FLOOR.x0 + 0.5, 0.12, 0.4, 0, 2.46, FLOOR.z0);
    box(shell, 'wallTop', 0.4, 0.12, FLOOR.z1 - FLOOR.z0 + 0.1, FLOOR.x0, 2.46, 0);
    // jam dinding (jarum mengikuti jam game)
    var clockG = new THREE.Group();
    clockG.position.set(0.82, 1.55, FLOOR.z0 + 0.15);
    shell.add(clockG);
    cyl(clockG, 'gold', 0.25, 0.03, 0, 0, 0).rotation.x = Math.PI / 2;
    cyl(clockG, 'white', 0.21, 0.05, 0, 0, 0.005).rotation.x = Math.PI / 2;
    var clockHr = new THREE.Group(), clockMin = new THREE.Group();
    clockHr.position.z = 0.04; clockMin.position.z = 0.05;
    clockG.add(clockHr, clockMin);
    box(clockHr, 'dark', 0.03, 0.12, 0.01, 0, 0.06, 0);
    box(clockMin, 'dark', 0.02, 0.18, 0.01, 0, 0.09, 0);
    function setClock(data) {
        var tm = (data && data.time) || {};
        var h = typeof tm.currentHour === 'number' ? tm.currentHour : 9;
        var mi = typeof tm.currentMinute === 'number' ? tm.currentMinute : 0;
        clockHr.rotation.z = -(((h % 12) + mi / 60) / 12) * Math.PI * 2;
        clockMin.rotation.z = -(mi / 60) * Math.PI * 2;
    }

    // partisi dalam (setinggi 0.7) dengan celah pintu
    function partition(axis, fixed, from, to, gaps) {
        var cuts = [from], k;
        (gaps || []).forEach(function (g) {
            cuts.push(g - 0.6, g + 0.6);
            if (axis === 'x') {
                box(shell, 'mat', 1.0, 0.012, 0.5, g, 0.008, fixed);
                box(shell, 'wall', 0.1, 1.0, 0.1, g - 0.6, 0.5, fixed);
                box(shell, 'wall', 0.1, 1.0, 0.1, g + 0.6, 0.5, fixed);
            } else {
                box(shell, 'mat', 0.5, 0.012, 1.0, fixed, 0.008, g);
                box(shell, 'wall', 0.1, 1.0, 0.1, fixed, 0.5, g - 0.6);
                box(shell, 'wall', 0.1, 1.0, 0.1, fixed, 0.5, g + 0.6);
            }
        });
        cuts.push(to);
        for (k = 0; k < cuts.length; k += 2) {
            var a = cuts[k], b = cuts[k + 1];
            if (b - a < 0.05) continue;
            if (axis === 'x') {
                wallSeg('part', a, b, fixed - 0.06, fixed + 0.06, 0.7, 0.12);
                box(shell, 'wallTop', b - a, 0.04, 0.16, (a + b) / 2, 0.72, fixed);
            } else {
                wallSeg('part', fixed - 0.06, fixed + 0.06, a, b, 0.7, 0.12);
                box(shell, 'wallTop', 0.16, 0.04, b - a, fixed, 0.72, (a + b) / 2);
            }
        }
    }
    partition('x', -1.5, -9, 9, [-7.25, -3.25, 1, 4.75, 7.75]);          // z = -1.5 memanjang di x
    partition('z', -5.5, -6, -1.5, []);
    partition('z', -1, -6, -1.5, []);
    partition('z', 3, -6, 6, [0.2, 3.9]);
    partition('z', 6.5, -6, -1.5, []);
    partition('x', 1.8, 3, 9, [4.5]);
    partition('z', 6, 1.8, 6, [3.9]);

    // ---------- ruangan ----------
    ROOM_DEFS.forEach(function (def) {
        var w = def.x1 - def.x0, d = def.z1 - def.z0;
        var g = new THREE.Group();
        g.position.set((def.x0 + def.x1) / 2, 0, (def.z0 + def.z1) / 2);
        g.userData.roomId = def.id;
        var floorMat = new THREE.MeshStandardMaterial({ color: def.tone, transparent: true, opacity: 1 });
        var slab = box(g, floorMat, w - 0.12, 0.12, d - 0.12, 0, -0.04, 0);
        var ovMat = new THREE.MeshBasicMaterial({ color: accentHex, transparent: true, opacity: 0.26, depthWrite: false });
        var ov = mesh(g, G.plane, ovMat, w - 0.2, d - 0.2, 1, 0, 0.025, 0);
        ov.rotation.x = -Math.PI / 2;
        ov.visible = false;
        var patMat = new THREE.MeshBasicMaterial({ map: makePatternTexture(def.pat, w, d), color: 0x000000, transparent: true, opacity: 0.1, depthWrite: false });
        var pat = mesh(g, G.plane, patMat, w - 0.2, d - 0.2, 1, 0, 0.022, 0);
        pat.rotation.x = -Math.PI / 2;
        var pool = mesh(g, G.plane, 'pool', Math.max(0.5, w - 0.5), Math.max(0.5, d - 0.5), 1, 0, 0.03, 0);
        pool.rotation.x = -Math.PI / 2;
        pool.visible = false;
        var furn = new THREE.Group();
        g.add(furn);
        var r = { def: def, group: g, slab: slab, floorMat: floorMat, ov: ov, ovMat: ovMat, furn: furn,
                  pat: pat, patMat: patMat, pool: pool, alertSp: null, alertBase: 0,
                  w: w, d: d, sig: null, st: null, label: null, tick: null, locked: false };
        rooms[def.id] = r;
        roomList.push(r);
        scene.add(g);
        // Fine perimeter rails visually separate departments without cluttering the floor.
        var railMat = new THREE.MeshStandardMaterial({ color: 0x9aa8ba, transparent: true, opacity: 0.52 });
        var railY = 0.035, railH = 0.025, railT = 0.035;
        box(g, railMat, Math.max(0.1, w - 0.18), railH, railT, 0, railY, -(d / 2) + 0.09);
        box(g, railMat, Math.max(0.1, w - 0.18), railH, railT, 0, railY, (d / 2) - 0.09);
        box(g, railMat, railT, railH, Math.max(0.1, d - 0.18), -(w / 2) + 0.09, railY, 0);
        box(g, railMat, railT, railH, Math.max(0.1, d - 0.18), (w / 2) - 0.09, railY, 0);
        r.railMat = railMat;
    });

    // ---------- bangunan perabot ----------
    function monitor(p, x, y, z, on) {
        var scr = on ? 'screenOn' : 'screenOff';
        if (eraIdx <= 1) {                                // CRT tebal
            box(p, 'paper', 0.42, 0.34, 0.38, x, y + 0.17, z);
            box(p, scr, 0.32, 0.24, 0.02, x, y + 0.18, z + 0.2);
        } else {                                          // layar datar
            box(p, 'dark', 0.5, 0.3, 0.03, x, y + 0.26, z);
            box(p, scr, 0.46, 0.26, 0.012, x, y + 0.26, z + 0.02);
            box(p, 'metal', 0.07, 0.12, 0.05, x, y + 0.06, z);
        }
    }
    function chair(p, x, z, mat) {
        cyl(p, 'metal', 0.035, 0.28, x, 0.14, z);
        box(p, mat || 'chair', 0.42, 0.07, 0.42, x, 0.3, z);
        box(p, mat || 'chair', 0.42, 0.4, 0.05, x, 0.52, z + 0.2);
    }
    function plant(p, x, z, s) {
        s = s || 1;
        cyl(p, 'pot', 0.16 * s, 0.24 * s, x, 0.12 * s, z);
        sph(p, 'plant', 0.24 * s, x, 0.42 * s, z);
        sph(p, 'plant', 0.16 * s, x + 0.1 * s, 0.6 * s, z - 0.05 * s);
    }
    function desk(p, x, z, ghost) {
        var top = ghost ? 'ghost' : 'deskTop', side = ghost ? 'ghost' : 'desk';
        box(p, top, 1.3, 0.07, 0.65, x, 0.62, z);
        box(p, side, 0.06, 0.58, 0.6, x - 0.58, 0.29, z);
        box(p, side, 0.06, 0.58, 0.6, x + 0.58, 0.29, z);
        box(p, side, 1.1, 0.3, 0.04, x, 0.4, z - 0.28);
    }
    function phoneModel(p, mat, scale) {
        var g = new THREE.Group();
        box(g, mat || 'dark', 0.3, 0.6, 0.05, 0, 0, 0);
        box(g, 'screenOn', 0.26, 0.54, 0.012, 0, 0, 0.03);
        box(g, 'metal', 0.05, 0.03, 0.06, 0, 0.26, -0.005);
        g.scale.setScalar(scale || 1);
        p.add(g);
        return g;
    }
    // ---------- orang ----------
    // routes: [{ path:[{x,z}…], dest }] — tiap rute dimulai dari kursi. Tiap siklus staf memakai rute berikutnya:
    // duduk bekerja -> berjalan ke tujuan -> berdiri sebentar -> kembali duduk.
    function makeWalk(routes, seed) {
        var SPEED = 0.95, STAY = 2.6, maxTW = 0;
        var infos = routes.map(function (rt) {
            var cum = [0], total = 0, i;
            for (i = 1; i < rt.path.length; i++) {
                total += Math.hypot(rt.path[i].x - rt.path[i - 1].x, rt.path[i].z - rt.path[i - 1].z);
                cum.push(total);
            }
            if (total / SPEED > maxTW) maxTW = total / SPEED;
            return { path: rt.path, dest: rt.dest, cum: cum, total: total, tW: total / SPEED };
        });
        var cycle = 16 + (seed % 14) + 2 * maxTW + STAY, off = (seed % 97) * 0.9;
        function pointAt(inf, d) {
            var k = 1, cum = inf.cum, path = inf.path;
            while (k < cum.length - 1 && d > cum[k]) k++;
            var seg = cum[k] - cum[k - 1] || 1, u = clamp((d - cum[k - 1]) / seg, 0, 1);
            return { x: path[k - 1].x + (path[k].x - path[k - 1].x) * u, z: path[k - 1].z + (path[k].z - path[k - 1].z) * u,
                     dx: path[k].x - path[k - 1].x, dz: path[k].z - path[k - 1].z };
        }
        // -> { x, z, lift 0..1, moving, dx, dz, phase: sit|out|stay|back, dest }
        return function (sec) {
            var s = sec + off, ci = Math.floor(s / cycle), tt = s - ci * cycle;
            var inf = infos[(ci + seed) % infos.length], pt;
            var sit = cycle - 2 * inf.tW - STAY, first = inf.path[0];
            if (tt < sit) return { x: first.x, z: first.z, lift: 0, moving: false, dx: 0, dz: -1, phase: 'sit', dest: inf.dest };
            tt -= sit;
            if (tt < inf.tW) {
                pt = pointAt(inf, tt * SPEED);
                return { x: pt.x, z: pt.z, lift: Math.min(1, tt / 0.3), moving: true, dx: pt.dx, dz: pt.dz, phase: 'out', dest: inf.dest };
            }
            tt -= inf.tW;
            var last = inf.path[inf.path.length - 1];
            if (tt < STAY) return { x: last.x, z: last.z, lift: 1, moving: false, dx: 0, dz: 0, idle: true, phase: 'stay', dest: inf.dest };
            tt -= STAY;
            pt = pointAt(inf, inf.total - tt * SPEED);
            return { x: pt.x, z: pt.z, lift: Math.min(1, (inf.tW - tt) / 0.3), moving: true, dx: -pt.dx, dz: -pt.dz, phase: 'back', dest: inf.dest };
        };
    }

    // gelembung emoji di atas kepala (tekstur dibagi antar staf)
    function bubbleTexture(emoji) {
        if (bubbleTex[emoji]) return bubbleTex[emoji];
        var c = document.createElement('canvas');
        c.width = 96; c.height = 96;
        var ctx = c.getContext('2d');
        ctx.fillStyle = 'rgba(255,255,255,0.96)';
        ctx.strokeStyle = 'rgba(30,40,60,0.55)';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(48, 44, 38, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(40, 80); ctx.lineTo(48, 94); ctx.lineTo(56, 80); ctx.closePath(); ctx.fill();
        ctx.font = '46px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.fillText(emoji, 48, 46);
        var tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        bubbleTex[emoji] = tex;
        return tex;
    }

    function person(p, s, x, z, tickers, opts) {
        opts = opts || {};
        var h = hash(s.id);
        // kursi (diam di meja)
        var seat = new THREE.Group();
        seat.userData.staffId = s.id;
        seat.position.set(x, 0, z);
        chair(seat, 0, 0.0);
        shadowRound(seat, 0.34, 0, 0.02);
        p.add(seat);

        // badan (bisa berjalan)
        var g = new THREE.Group();
        g.userData.staffId = s.id;
        g.position.set(x, 0, z);
        var mt = moraleTier(s.morale || 0);
        var rm = roleMat[s.role] || roleMat.engineer;
        var skin = skinMat[h % skinMat.length];
        var hairM = hairMat[(h >>> 3) % hairMat.length];   // >>> (tanpa tanda): hash() tak bertanda, >> membuat indeks negatif
        var style = (h >>> 6) % 3;
        var torso = cyl(g, rm, 0.15, 0.42, 0, 0.62, -0.02);                 // badan
        var headG = new THREE.Group();
        headG.position.set(0, 0.97, -0.02);
        g.add(headG);
        sph(headG, skin, 0.115, 0, 0, 0);                                   // kepala
        sph(headG, hairM, 0.12, 0, 0.03, 0.03).scale.set(0.12, 0.07, 0.12); // rambut (topi)
        if (style === 1) box(headG, hairM, 0.2, 0.2, 0.06, 0, -0.02, 0.1);  // rambut panjang
        else if (style === 2) sph(headG, hairM, 0.05, 0, 0.13, 0.04);       // cepol
        box(headG, 'dark', 0.02, 0.03, 0.01, -0.04, 0.012, -0.112);         // mata
        box(headG, 'dark', 0.02, 0.03, 0.01, 0.04, 0.012, -0.112);
        if (s.role === 'engineer') {                                        // headphone
            mesh(headG, G.arc, 'dark', 0.125, 0.125, 0.125, 0, 0, 0);
            cyl(headG, 'dark', 0.04, 0.035, -0.125, 0, 0).rotation.z = Math.PI / 2;
            cyl(headG, 'dark', 0.04, 0.035, 0.125, 0, 0).rotation.z = Math.PI / 2;
        } else if (s.role === 'designer') {                                 // kacamata
            box(headG, 'dark', 0.17, 0.012, 0.01, 0, 0.02, -0.114);
            box(headG, 'glass', 0.06, 0.05, 0.008, -0.045, 0.015, -0.116);
            box(headG, 'glass', 0.06, 0.05, 0.008, 0.045, 0.015, -0.116);
        } else if (s.role === 'marketer') {                                 // headset + mic
            cyl(headG, 'dark', 0.035, 0.03, 0.125, 0, 0).rotation.z = Math.PI / 2;
            box(headG, 'dark', 0.012, 0.012, 0.1, 0.09, -0.05, -0.07);
        }
        var armL = box(g, rm, 0.07, 0.07, 0.32, -0.14, 0.7, -0.2);
        var armR = box(g, rm, 0.07, 0.07, 0.32, 0.14, 0.7, -0.2);
        var dot = sph(g, moraleMat[mt], 0.055, 0, 1.2, -0.02);              // indikator moral
        var legs = new THREE.Group();                                        // kaki (hanya terlihat saat berdiri)
        var legL = box(legs, 'dark', 0.07, 0.73, 0.08, -0.06, 0.045, -0.02);
        var legR = box(legs, 'dark', 0.07, 0.73, 0.08, 0.06, 0.045, -0.02);
        legs.visible = false;
        g.add(legs);
        if (mt === 0) { headG.rotation.x = -0.38; }                           // lesu saat moral rendah
        var ph = (h % 628) / 100;
        var amp = mt === 0 ? 0.006 : 0.012;
        var walk = (opts.routes && opts.routes.length && ambient) ? makeWalk(opts.routes, h) : null;

        // jadwal kecil di meja: minum kopi / ide / menguap — deterministik per staf
        var period = 22 + (h % 17), sipOn = (h % 2 === 0), ideaOn = ((s.skill || 1) >= 3 && h % 3 === 0);
        var bub = null, bubKind = '', actKey = '';
        function setBubble(emoji) {
            if (emoji === bubKind) return;
            bubKind = emoji;
            if (!emoji) { if (bub) bub.visible = false; return; }
            if (!bub) {
                bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTexture(emoji), transparent: true, depthTest: false }));
                bub.scale.set(0.4, 0.4, 1);
                bub.renderOrder = 22;
                bub.userData.own = 1;                       // material milik sprite ini (tekstur dibagi, jangan dibuang)
                g.add(bub);
            }
            bub.material.map = bubbleTexture(emoji);
            bub.material.needsUpdate = true;
            bub.visible = true;
        }
        function setAct(key, dest) {
            if (key === actKey) return;
            actKey = key;
            activity[s.id] = { key: key, dest: dest || '' };
        }
        setAct(mt === 0 ? 'office.act.tired' : 'office.act.working', '');

        tickers.push(function (sec) {
            var b = Math.sin(sec * 2 + ph);
            var ws = walk ? walk(sec) : null;
            var lift = ws ? ws.lift : 0;
            var seated = !ws || ws.phase === 'sit';
            var ev = ambient ? ((sec + ph * 7) % period) : 99;
            var sipping = seated && mt > 0 && sipOn && ev < 2.4;
            var thinking = seated && mt > 0 && !sipping && ideaOn && ev > 9 && ev < 11.5;
            var yawning = seated && mt === 0 && ev < 3;
            if (ws) {
                g.position.x = ws.x; g.position.z = ws.z;
                g.position.y = lift * 0.32;
                if (ws.moving || ws.idle) { if (ws.dx || ws.dz) g.rotation.y = Math.atan2(-ws.dx, -ws.dz); }
                else g.rotation.y = 0;
                legs.visible = lift > 0.02;
            }
            // aktivitas + gelembung
            if (!seated) {
                if (ws.phase === 'out') setAct('office.act.go.' + ws.dest, ws.dest);
                else if (ws.phase === 'stay') setAct('office.act.at.' + ws.dest, ws.dest);
                else setAct('office.act.back', ws.dest);
                setBubble(ws.phase === 'back' ? '' : (DEST_EMOJI[ws.dest] || ''));
            } else if (sipping) { setAct('office.act.coffee', ''); setBubble('☕'); }
            else if (thinking) { setAct('office.act.idea', ''); setBubble('💡'); }
            else if (yawning) { setAct('office.act.tired', ''); setBubble('💤'); }
            else { setAct(mt === 0 ? 'office.act.tired' : 'office.act.working', ''); setBubble(''); }
            if (bub && bub.visible) bub.position.set(0, 1.5 + Math.sin(sec * 3 + ph) * 0.03, -0.02);

            var base = mt === 0 ? 0.93 : 0.97;
            headG.position.y = base + b * amp;
            headG.rotation.y = seated && mt > 0 && ambient ? Math.sin(sec * 0.6 + ph) * 0.22 : 0;   // menoleh sesekali
            dot.position.y = 1.2 + b * 0.02;
            if (ws && ws.moving) {
                var sw = Math.sin(sec * 8 + ph);
                armL.position.set(-0.14, 0.7, -0.2); armR.position.set(0.14, 0.7, -0.2);
                armL.rotation.x = sw * 0.5; armR.rotation.x = -sw * 0.5;
                legL.rotation.x = -sw * 0.5; legR.rotation.x = sw * 0.5;
            } else {
                armL.rotation.x = 0; legL.rotation.x = 0; legR.rotation.x = 0;
                var typing = lift < 0.5 && !sipping;
                var k = mt === 0 ? 0.5 : 1;
                armL.position.y = 0.7 + (typing ? Math.sin(sec * 9 + ph) * 0.012 * k : 0);
                if (sipping) {                                   // tangan kanan membawa cangkir ke mulut
                    armR.position.set(0.14, 0.86, -0.17); armR.rotation.x = -1.15;
                } else {
                    armR.rotation.x = 0; armR.position.set(0.14, 0.7 + (typing ? Math.cos(sec * 8 + ph) * 0.012 * k : 0), -0.2);
                }
            }
        });
        void torso;
        staffObjs[s.id] = g;
        p.add(g);
        return g;
    }

    function signTexture(text) {
        var c = document.createElement('canvas');
        c.width = 512; c.height = 128;
        var ctx = c.getContext('2d');
        ctx.fillStyle = dark ? '#1b2230' : '#ffffff';
        ctx.fillRect(0, 0, 512, 128);
        ctx.fillStyle = hexCss(accentHex);
        ctx.fillRect(0, 0, 14, 128);
        ctx.fillRect(0, 116, 512, 12);
        var fs = 54, str = String(text || 'Smartphone Empire');
        ctx.font = '800 ' + fs + 'px system-ui, -apple-system, "Segoe UI", sans-serif';
        while (ctx.measureText(str).width > 450 && fs > 22) { fs -= 4; ctx.font = '800 ' + fs + 'px system-ui, -apple-system, "Segoe UI", sans-serif'; }
        ctx.fillStyle = dark ? '#f0f3fa' : '#1b2230';
        ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
        ctx.fillText(str, 262, 58);
        var tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        ownTex.push(tex);
        return tex;
    }
    // jalur jalan staf: kursi -> lorong -> pintu ruang tujuan (koordinat lokal ruang Work)
    var AISLES = [-4, -2, 0, 2, 4];
    function pickAisle(x, targetX) {
        var aisle = AISLES[0], best = 99, i;
        for (i = 0; i < AISLES.length; i++) {
            var a = AISLES[i];
            if (Math.abs(a - x) > 1.05) continue;               // hanya lorong yang bersebelahan dengan meja
            var sc = Math.abs(a - targetX);
            if (sc < best) { best = sc; aisle = a; }
        }
        return aisle;
    }
    function nearestCorridor(zTarget) {
        var best = CORRIDORS[0], d = 99;
        for (var i = 0; i < CORRIDORS.length; i++) {
            var dd = Math.abs(CORRIDORS[i] - zTarget);
            if (dd < d) { d = dd; best = CORRIDORS[i]; }
        }
        return best;
    }
    function walkPath(x, z, gapX, endZ) {
        var aisle = pickAisle(x, gapX);
        var pts = [{ x: x, z: z }, { x: aisle, z: z }, { x: aisle, z: -3.5 }];
        if (Math.abs(gapX - aisle) > 0.05) pts.push({ x: gapX, z: -3.5 });
        pts.push({ x: gapX, z: endZ });
        return pts;
    }
    // rute ke tujuan: pintu utara (CEO/Lab/Studio), pintu timur (Showroom/Marketing) atau dispenser air
    function routeTo(dest, x, z) {
        var aisle, zc, dz;
        if (DOOR_NORTH[dest] !== undefined) return walkPath(x, z, DOOR_NORTH[dest], dest === 'design' ? -4.2 : -4.45);
        if (DOOR_EAST[dest] !== undefined) {
            dz = DOOR_EAST[dest];
            aisle = pickAisle(x, 99);
            zc = nearestCorridor(dz);
            return [{ x: x, z: z }, { x: aisle, z: z }, { x: aisle, z: zc }, { x: 5.95, z: zc },
                    { x: 5.95, z: dz }, { x: 6.45, z: dz }];
        }
        aisle = pickAisle(x, -99);                               // water
        return [{ x: x, z: z }, { x: aisle, z: z }, { x: aisle, z: 3.45 }, { x: -5.35, z: 3.45 }];
    }

    var BUILD = {};

    BUILD.ceo = function (r, d, p, st, tk) {
        var f = r.furn;
        var rug = box(f, new THREE.MeshStandardMaterial({ color: tint(accentHex, dark ? -0.45 : 0.6) }), 2.4, 0.02, 1.8, 0.1, 0.02, -0.45);
        rug.userData.own = 1;                                            // karpet mengikuti warna aksen
        shadowBox(f, 1.8, 0.95, 0.1, -0.85);
        shadowBox(f, 0.9, 1.4, -1.25, 1.2);
        shadowBox(f, 2.6, 0.45, 0, -1.95);
        box(f, 'wood', 1.7, 0.08, 0.8, 0.1, 0.72, -0.9);
        box(f, 'desk', 0.08, 0.7, 0.7, -0.7, 0.35, -0.9);
        box(f, 'desk', 0.08, 0.7, 0.7, 0.9, 0.35, -0.9);
        monitor(f, 0.1, 0.76, -1.0, true);
        box(f, 'gold', 0.3, 0.05, 0.08, 0.4, 0.78, -0.62);               // papan nama
        chair(f, 0.1, -0.15, 'wood');
        box(f, 'wood', 2.5, 1.3, 0.3, 0.0, 0.65, -1.98);                 // rak buku (menempel dinding belakang)
        var cols = [accentHex, 0xe0b445, 0x43c07a, 0xef5350, 0x8a7fe0, 0x4fb3e8];
        for (var i = 0; i < 9; i++) box(f, new THREE.MeshStandardMaterial({ color: cols[i % cols.length] }), 0.16, 0.34, 0.2, -1.0 + i * 0.25, 0.92, -1.91).userData.own = 1;
        var tn = trophyCount(d, p);
        for (var k = 0; k < tn; k++) {
            cyl(f, 'gold', 0.1, 0.05, -0.8 + k * 0.45, 1.36, -1.93);
            cyl(f, 'gold', 0.03, 0.2, -0.8 + k * 0.45, 1.46, -1.93);
            sph(f, 'gold', 0.1, -0.8 + k * 0.45, 1.64, -1.93);
        }
        box(f, 'chair', 0.7, 0.35, 1.3, -1.2, 0.18, 1.2);                // sofa
        box(f, 'chair', 0.18, 0.55, 1.3, -1.5, 0.4, 1.2);
        plant(f, 1.3, 1.7, 1.1);
        // lukisan di dinding kiri + lampu meja
        box(f, 'wood', 0.05, 0.62, 0.92, -1.6, 1.45, 0.2);
        var art = box(f, new THREE.MeshStandardMaterial({ color: tint(accentHex, 0.3) }), 0.03, 0.5, 0.8, -1.57, 1.45, 0.2);
        art.userData.own = 1;
        box(f, 'gold', 0.03, 0.2, 0.3, -1.55, 1.4, 0.35);
        cyl(f, 'metal', 0.05, 0.02, -0.4, 0.77, -1.05);
        box(f, 'amber', 0.04, 0.2, 0.04, -0.4, 0.88, -1.05);
        if ((p.levels.monument || 0) >= 2) {                              // globe
            cyl(f, 'metal', 0.18, 0.06, 1.25, 0.03, -0.2);
            var gl = sph(f, 'glow', 0.28, 1.25, 0.4, -0.2);
            tk.push(function (sec) { gl.rotation.y = sec * 0.6; });
        }
    };

    BUILD.work = function (r, d, p, st, tk) {
        var f = r.furn;
        var staff = sortedStaff(d);
        var cap = deskCapacity(p, staff.length);
        var showN = Math.min(staff.length, MAX_DESKS);
        // pilih staf yang boleh berjalan (moral cukup, hanya bila animasi aktif); jumlahnya ikut ukuran tim
        var walkers = {};
        if (ambient && showN >= 2) {
            var budget = Math.min(WALKERS_MAX, Math.max(1, Math.floor(showN / 3)));
            var cand = [];
            for (var q = 0; q < showN; q++) if ((staff[q].morale || 0) >= 40) cand.push(q);
            cand.sort(function (a, b) {
                var ha = hash(staff[a].id) % 3 === 0 ? 0 : 1, hb = hash(staff[b].id) % 3 === 0 ? 0 : 1;
                return (ha - hb) || (a - b);
            });
            for (var wq = 0; wq < cand.length && wq < budget; wq++) walkers[staff[cand[wq]].id] = wq;
        }
        // tujuan yang tersedia: ruang harus terbuka; dispenser air hanya bila baris meja terakhir kosong
        function destOpen(dest) {
            if (dest === 'water') return cap <= 24;
            var rid = DEST_ROOM[dest];
            try { return !!(rid && ROOM_LOGIC[rid].state(d, p).open); } catch (e) { return false; }
        }
        function routesFor(sf, k, x, z) {
            var pool = DEST_BY_ROLE[sf.role] || DEST_DEFAULT, out = [], n = pool.length, j;
            var start = (k + hash(sf.id)) % n;
            for (j = 0; j < n && out.length < 3; j++) {
                var dest = pool[(start + j) % n];
                if (destOpen(dest)) out.push({ dest: dest, path: routeTo(dest, x, z) });
            }
            return out;
        }
        // Tata letak meja rapi: dua baris pertama diisi per KOLOM (pasangan meja depan-belakang) mulai dari tengah
        // ke luar, sehingga tim kecil membentuk satu blok rapi dekat pintu ruangan (bukan satu baris panjang +
        // baris bayangan). Meja ke-13 dst mengisi baris 3-5 seperti grid lama. Posisi tetap di grid lama,
        // jadi lorong & rute jalan staf tidak berubah.
        var COL_ORDER = [2, 3, 1, 4, 0, 5];
        for (var i = 0; i < cap; i++) {
            var col, row;
            if (i < 12) { col = COL_ORDER[Math.floor(i / 2)]; row = i % 2; }
            else { col = (i - 12) % COLS; row = 2 + Math.floor((i - 12) / COLS); }
            if (row >= ROWS) break;
            var x = -5 + col * 2.0, z = -2.95 + row * 1.45;
            var s = i < showN ? staff[i] : null;
            shadowBox(f, 1.5, 0.95, x, z + 0.1);
            desk(f, x, z, !s);
            if (s) {
                monitor(f, x, 0.655, z - 0.1, true);
                var hs = hash(s.id);
                if (eraIdx <= 1) {
                    box(f, 'paper', 0.2, 0.4, 0.45, x + 0.3, 0.2, z - 0.02);              // PC tower di bawah meja
                } else {
                    box(f, 'metal', 0.34, 0.015, 0.24, x - 0.38, 0.665, z + 0.04);        // laptop
                    box(f, 'dark', 0.34, 0.21, 0.012, x - 0.38, 0.77, z - 0.08).rotation.x = -0.2;
                }
                cyl(f, hueMat('m' + (hs % 7)), 0.03, 0.06, x + 0.46, 0.7, z + 0.1);       // cangkir
                box(f, tierMat[clamp(s.skill || 1, 1, 5)], 0.2, 0.015, 0.06, x, 0.66, z + 0.27);   // plat tier skill
                var opts = null;
                if (walkers[s.id] !== undefined) {
                    var rts = routesFor(s, walkers[s.id], x, z + 0.52);
                    if (rts.length) opts = { routes: rts };
                }
                person(f, s, x, z + 0.52, tk, opts);
            }
        }
        if (cap <= 12) {                                  // lobi di depan pintu utama (hanya bila baris depan kosong)
            box(f, 'mat', 3.0, 0.012, 1.3, 0, 0.034, 2.9);        // karpet lobi sejajar pintu utama (x lokal 0)
            plant(f, -1.7, 3.3, 0.8);
            plant(f, 1.7, 3.3, 0.8);
        }
        plant(f, -5.5, -3.5, 0.7);                       // pojok NW (tidak menembus dinding)
        plant(f, 5.5, -3.5, 0.7);                        // pojok NE (tidak menembus partisi)
        plant(f, 5.5, 3.4, 0.9);                         // pojok SE
        shadowRound(f, 0.3, -5.7, 3.45);
        cyl(f, 'metal', 0.17, 0.12, -5.7, 0.06, 3.45);                     // dispenser air
        cyl(f, 'glass', 0.15, 0.5, -5.7, 0.4, 3.45);
        shadowBox(f, 0.5, 0.45, 5.72, 0.2);
        box(f, 'white', 0.3, 0.7, 0.4, 5.72, 0.35, 0.2);                  // printer
        // papan nama perusahaan di dinding kiri
        var tex = signTexture(d.companyName);
        var sm = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        var sign = mesh(f, G.plane, sm, 2.3, 0.575, 1, -5.84, 1.55, 0.3);
        sign.rotation.y = Math.PI / 2;
        sign.userData.own = 1; sign.userData.tex = tex;
    };

    BUILD.lab = function (r, d, p, st, tk) {
        var f = r.furn;
        var nB = Math.min(4, 1 + st.level);
        var act = Math.min(6, len(d.research && d.research.active) + len(d.chipResearch && d.chipResearch.active));
        shadowRound(f, 0.7, 0, 0.5);
        for (var i = 0; i < nB; i++) {
            var x = (i - (nB - 1) / 2) * 1.1;
            box(f, 'metal', 0.9, 0.5, 0.55, x, 0.25, -1.4);
            box(f, 'white', 0.96, 0.04, 0.6, x, 0.52, -1.4);
            cyl(f, 'glass', 0.08, 0.22, x - 0.2, 0.65, -1.4);
            cyl(f, 'glass', 0.06, 0.3, x + 0.15, 0.69, -1.4);
            sph(f, 'glow', 0.05, x - 0.2, 0.62, -1.4);
        }
        cyl(f, 'metal', 0.55, 0.3, 0, 0.15, 0.5);                         // meja holo
        cyl(f, 'glow', 0.4, 0.03, 0, 0.32, 0.5);
        var ring = mesh(f, G.tor, 'glow', 0.6, 0.6, 0.6, 0, 1.0, 0.5);
        ring.rotation.x = Math.PI / 2;
        ring.visible = act > 0;
        var orbs = [];
        for (var o = 0; o < act; o++) orbs.push(sph(f, 'glow', 0.13, 0, 1.2, 0.5));
        tk.push(function (sec) {
            ring.rotation.z = sec * 1.2;
            for (var q = 0; q < orbs.length; q++) {
                var a = sec * 0.9 + q * (Math.PI * 2 / orbs.length);
                orbs[q].position.set(Math.cos(a) * 0.9, 1.1 + Math.sin(sec * 2 + q) * 0.08, 0.5 + Math.sin(a) * 0.9);
            }
        });
        box(f, 'white', 3.4, 1.0, 0.05, 0, 1.3, -2.18);                   // papan riset selesai
        var done = Math.min(12, len(d.research && d.research.completed));
        for (var c = 0; c < 12; c++) {
            box(f, c < done ? 'glow' : 'part', 0.24, 0.24, 0.02, -1.4 + (c % 6) * 0.56, 1.5 - Math.floor(c / 6) * 0.4, -2.14);
        }
        // progres riset aktif (rata-rata): bar di lantai depan meja holo, terisi sesuai persen
        var rp = activeResearchPct(d);
        if (rp >= 0) {
            var lbw = 1.8, lfw = Math.max(0.04, lbw * rp);
            box(f, 'dark', lbw + 0.1, 0.05, 0.14, 0, 0.03, 1.45);
            var lfill = box(f, rp >= 0.66 ? 'ledG' : 'ledA', lfw, 0.06, 0.1, -lbw / 2 + lfw / 2, 0.045, 1.45);
            tk.push(function (sec) { lfill.scale.y = 0.06 * (1 + Math.sin(sec * 4) * 0.12); });   // skala dasar = tinggi bar (0.06)
        }
        plant(f, 1.9, 1.8, 0.9);
    };

    BUILD.design = function (r, d, p, st, tk) {
        var f = r.furn;
        var dev = d.products && d.products.development;
        var idx = dev ? Math.max(0, PHASES.indexOf(dev.phase)) : -1;
        shadowRound(f, 0.9, 0, 0.3);
        cyl(f, 'metal', 0.75, 0.16, 0, 0.08, 0.3);
        var pg = phoneModel(f, dev ? 'dark' : 'ghost', 1.5);
        pg.position.set(0, 0.62, 0.3);
        if (!dev) pg.scale.setScalar(1.1);
        tk.push(function (sec) { pg.rotation.y = dev ? sec * 1.0 : sec * 0.3; });
        for (var i = 0; i < 4; i++) box(f, i <= idx ? 'glow' : 'screenOff', 0.14, 0.14, 0.14, -0.33 + i * 0.22, 0.1, 1.45);
        for (var k = 0; k < 2; k++) {
            var x = -1.2 + k * 2.4;
            desk(f, x, -1.5, false);
            monitor(f, x, 0.655, -1.6, true);
            box(f, 'dark', 0.5, 0.02, 0.32, x, 0.67, -1.3);                // tablet gambar
            chair(f, x, -0.8);
        }
        // progres fase berjalan: bar di depan pedestal ponsel
        var pfr = devPhaseFrac(dev);
        if (pfr >= 0) {
            var dbw = 2.2, dfw = Math.max(0.04, dbw * pfr);
            box(f, 'dark', dbw + 0.1, 0.05, 0.14, 0, 0.03, 1.95);
            var dfill = box(f, pfr >= 0.66 ? 'ledG' : 'glow', dfw, 0.06, 0.1, -dbw / 2 + dfw / 2, 0.045, 1.95);
            tk.push(function (sec) { dfill.scale.y = 0.06 * (1 + Math.sin(sec * 4 + 1) * 0.12); });
        }
        box(f, 'white', 3.0, 1.0, 0.05, 0, 1.3, -2.18);                    // mood board
        var cs = [accentHex, 0xe0b445, 0x43c07a, 0xef5350, 0x8a7fe0, 0x4fb3e8, 0xf472b6, 0xfb923c];
        for (var c = 0; c < 8; c++) {
            box(f, new THREE.MeshStandardMaterial({ color: cs[c] }), 0.5, 0.34, 0.02, -1.0 + (c % 4) * 0.67, 1.48 - Math.floor(c / 4) * 0.42, -2.14).userData.own = 1;
        }
    };

    BUILD.server = function (r, d, p, st, tk) {
        var f = r.furn;
        var n = Math.min(6, 2 * st.level);
        var bugs = Math.min(len(d.os && d.os.bugs), n * 2);
        var cols = Math.min(3, n), leds = [], placed = 0, fans = [];
        for (var i = 0; i < n; i++) {
            var col = i % 3, row = Math.floor(i / 3);
            var x = (col - (cols - 1) / 2) * 1.0, z = -1.6 + row * 1.5;
            shadowBox(f, 0.85, 0.75, x, z);
            box(f, 'rack', 0.7, 1.4, 0.6, x, 0.7, z);
            cyl(f, 'dark', 0.14, 0.03, x, 1.415, z);                           // kipas pendingin
            var blade = box(f, 'metal', 0.24, 0.012, 0.04, x, 1.435, z);
            fans.push(blade);
            box(f, 'metal', 0.62, 0.04, 0.02, x, 1.3, z + 0.31);
            for (var k = 0; k < 5; k++) {
                var bad = placed < bugs && (k % 2 === 0);
                if (bad) placed++;
                var led = box(f, bad ? 'ledR' : 'ledG', 0.09, 0.05, 0.02, x - 0.22 + (k % 2) * 0.12, 0.35 + k * 0.17, z + 0.31);
                leds.push({ m: led, bad: bad, ph: (i * 5 + k) * 0.7 });
            }
            box(f, 'ledA', 0.28, 0.04, 0.02, x + 0.18, 1.1, z + 0.31);
        }
        box(f, 'dark', 3.0, 0.02, 0.1, 0, 0.012, 0.9);                      // kabel
        box(f, 'dark', 0.1, 0.02, 2.4, -1.4, 0.012, 0);
        var holo = null;
        if (d.os && d.os.developing) {
            holo = cyl(f, 'holo', 0.3, 1.5, 0, 0.75, 1.55);
            var hr = mesh(f, G.tor, 'glow', 0.4, 0.4, 0.4, 0, 1.0, 1.55);
            hr.rotation.x = Math.PI / 2;
            tk.push(function (sec) { hr.position.y = 0.6 + (Math.sin(sec * 1.5) * 0.5 + 0.5) * 0.8; });
        }
        tk.push(function (sec) {
            for (var fi = 0; fi < fans.length; fi++) fans[fi].rotation.y = sec * 12 + fi;
            for (var q = 0; q < leds.length; q++) {
                var l = leds[q];
                l.m.visible = l.bad ? (Math.sin(sec * 6 + l.ph) > -0.2) : (Math.sin(sec * 3 + l.ph) > -0.75);
            }
        });
        if (!holo) plant(f, 1.4, 1.8, 0.8);
    };

    // lokasi konstruksi Fab: fondasi, bangunan yang tumbuh sesuai progres, perancah, derek berputar, bar progres
    function constructionSite(f, x, z, w, dp, fp, tk) {
        var pct = fp.pct, hgt = 0.1 + pct * 0.9, px = w / 2 + 0.02, pz = dp / 2 + 0.02, top = 1.25;
        shadowBox(f, w + 0.3, dp + 0.3, x, z);
        box(f, 'metal', w + 0.1, 0.06, dp + 0.1, x, 0.03, z);                          // fondasi
        box(f, 'white', w * 0.86, hgt, dp * 0.8, x, 0.06 + hgt / 2, z);               // bangunan yang tumbuh
        box(f, 'glow', w * 0.88, 0.04, dp * 0.82, x, 0.08 + hgt, z);                  // atap/pelat teratas
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {                    // tiang perancah
            box(f, 'wood', 0.05, top, 0.05, x + c[0] * px, top / 2, z + c[1] * pz);
        });
        box(f, 'wood', w + 0.1, 0.04, 0.04, x, 0.6, z + pz);
        box(f, 'wood', w + 0.1, 0.04, 0.04, x, top, z + pz);
        box(f, 'wood', 0.04, 0.04, dp + 0.1, x - px, 0.9, z);
        box(f, 'wood', 0.04, 0.04, dp + 0.1, x + px, top, z);
        for (var k = 0; k < 4; k++) box(f, k % 2 ? 'dark' : 'amber', 0.16, 0.06, 0.05, x - px + 0.12 + k * (w + 0.1) / 4, 0.1, z + pz + 0.12);   // pagar bahaya
        var crane = new THREE.Group();
        crane.position.set(x + px + 0.1, 0, z - pz - 0.05);
        f.add(crane);
        box(crane, 'amber', 0.07, 1.9, 0.07, 0, 0.95, 0);
        var arm = new THREE.Group();
        arm.position.y = 1.85;
        crane.add(arm);
        box(arm, 'amber', 1.1, 0.06, 0.06, -0.4, 0, 0);
        box(arm, 'dark', 0.14, 0.14, 0.14, 0.22, -0.02, 0);                            // bobot penyeimbang
        box(arm, 'dark', 0.015, 0.55, 0.015, -0.85, -0.27, 0);                         // kabel
        box(arm, 'gold', 0.1, 0.07, 0.1, -0.85, -0.56, 0);                            // kait
        tk.push(function (sec) { arm.rotation.y = Math.sin(sec * 0.5 + x) * 0.9; });
        var bw = Math.max(1.0, w), fw = bw * Math.max(0.03, pct);                      // bar progres di lantai
        box(f, 'dark', bw + 0.1, 0.05, 0.14, x, 0.03, z + pz + 0.4);
        var fill = box(f, pct >= 0.66 ? 'ledG' : 'ledA', fw, 0.06, 0.1, x - bw / 2 + fw / 2, 0.045, z + pz + 0.4);
        tk.push(function (sec) { fill.scale.y = 0.06 * (1 + Math.sin(sec * 4) * 0.12); });   // perbaikan: sebelumnya skala jadi 1 unit
    }

    BUILD.chip = function (r, d, p, st, tk) {
        var f = r.furn;
        var fab = d.fab || {};
        var fp = fabProgress(d);
        if (!fab.built) {
            box(f, 'wood', 1.6, 0.08, 0.8, 0, 0.7, -1.2);
            box(f, 'desk', 0.08, 0.68, 0.7, -0.7, 0.34, -1.2);
            box(f, 'desk', 0.08, 0.68, 0.7, 0.7, 0.34, -1.2);
            box(f, 'paper', 0.5, 0.01, 0.35, -0.3, 0.75, -1.2);
            if (len(d.chips && d.chips.catalog) || len(d.chipResearch && d.chipResearch.completed)) {
                cyl(f, 'gold', 0.28, 0.03, 0.35, 0.76, -1.2);
                box(f, 'dark', 0.14, 0.03, 0.14, 0.35, 0.79, -1.2);
            }
            chair(f, 0, -0.5);
            plant(f, 0.9, 1.8, 0.9);
            if (fp) constructionSite(f, 0, 0.95, 1.3, 1.0, fp, tk);                // Fab pertama sedang dibangun
            return;
        }
        var nM = Math.min(4, fab.level || 1);
        for (var i = 0; i < nM; i++) {
            var z = -1.8 + i * 1.05;
            box(f, 'metal', 0.9, 1.0, 0.8, -0.55, 0.5, z);
            box(f, 'glow', 0.04, 0.35, 0.55, -0.09, 0.62, z);
            box(f, 'ledA', 0.1, 0.06, 0.06, -0.8, 1.04, z);
        }
        box(f, 'dark', 0.5, 0.05, 4.0, 0.5, 0.06, -0.2);                    // konveyor
        var items = [];
        for (var k = 0; k < 6; k++) items.push(box(f, 'gold', 0.2, 0.1, 0.2, 0.5, 0.14, -2.0 + k * 0.7));
        var prod = !!fab.producing;
        tk.push(function (sec) {
            for (var q = 0; q < items.length; q++) {
                var base = -2.0 + q * 0.7;
                items[q].position.z = prod ? (-2.0 + ((base + 2.0 + sec * 0.8) % 4.2)) : base;
            }
        });
        // lengan robot: bergerak saat produksi berjalan
        shadowRound(f, 0.25, 1.0, -0.6);
        cyl(f, 'metal', 0.13, 0.3, 1.0, 0.15, -0.6);
        var armP = new THREE.Group();
        armP.position.set(1.0, 0.36, -0.6);
        f.add(armP);
        box(armP, 'amber', 0.55, 0.08, 0.08, -0.25, 0, 0);
        box(armP, 'dark', 0.1, 0.12, 0.12, -0.55, -0.04, 0);
        tk.push(function (sec) { armP.rotation.y = prod ? Math.sin(sec * 1.4) * 0.7 : 0; });
        var siteZ = -1.8 + nM * 1.05;
        if (fp && nM < 4) constructionSite(f, -0.55, siteZ, 0.9, 0.7, fp, tk);       // slot mesin berikutnya dibangun
        var crateShift = (fp && nM >= 3) ? 0.3 : 0;
        var crates = clamp(Math.ceil(Math.log10((fab.inventory || 0) + 1) * 2), 0, 8);
        for (var c = 0; c < crates; c++) {
            box(f, 'wood', 0.32, 0.3, 0.32, -0.9 + (c % 2) * 0.36, 0.15 + Math.floor(c / 4) * 0.31, 1.75 + crateShift - (Math.floor(c / 2) % 2) * 0.36);
        }
    };

    BUILD.showroom = function (r, d, p, st, tk) {
        var f = r.furn;
        var cat = ((d.products && d.products.catalog) || []).filter(function (x) { return x.status === 'selling'; });
        cat.sort(function (a, b) { return (b.releaseGameMinute || 0) - (a.releaseGameMinute || 0); });
        var cap = Math.min(9, 3 * st.level);
        var show = cat.slice(0, cap), spin = [];
        var perRow = 5;
        for (var i = 0; i < show.length; i++) {
            var row = Math.floor(i / perRow), idxInRow = i % perRow;
            var count = Math.min(perRow, cap - row * perRow);      // grid mengikuti kapasitas, bukan jumlah produk
            var x = (idxInRow - (count - 1) / 2) * 1.0 - 0.3, z = -0.55 + row * 1.2;
            var pd = show[i];
            cyl(f, 'white', 0.3, 0.35, x, 0.175, z);
            var pg = phoneModel(f, hueMat(pd.id), 1.0);
            pg.position.set(x, 0.68, z);
            spin.push(pg);
            sph(f, pd.stock > 0 ? 'ledG' : 'ledR', 0.045, x, 0.2, z + 0.3);
            if (pd.stock > 0) cone(f, 'holo', 0.32, 1.05, x, 0.9, z);          // sorot lampu
        }
        tk.push(function (sec) { for (var q = 0; q < spin.length; q++) spin[q].rotation.y = sec * 0.7 + q; });
        // slot kosong: podium bayangan (sama seperti meja bayangan di Work) agar ruang tidak tampak rusak
        for (var g = show.length; g < cap; g++) {
            var gRow = Math.floor(g / perRow), gIdx = g % perRow;
            var gCount = Math.min(perRow, cap - gRow * perRow);
            var gx = (gIdx - (gCount - 1) / 2) * 1.0 - 0.3, gz = -0.55 + gRow * 1.2;
            cyl(f, 'ghost', 0.3, 0.35, gx, 0.175, gz);
        }
        box(f, 'glow', 2.4, 0.45, 0.05, -0.6, 1.5, -1.58);                   // banner
        var crates = clamp(Math.round(Math.log10(totalStock(d) + 1) * 3), 0, 12);
        for (var c = 0; c < crates; c++) {
            box(f, 'wood', 0.34, 0.3, 0.34, 2.45 + (c % 2) * 0.38, 0.15 + Math.floor(c / 6) * 0.31, -1.1 + (Math.floor(c / 2) % 3) * 0.4);
        }
    };

    BUILD.marketing = function (r, d, p, st, tk) {
        var f = r.furn;
        var camp = len(d.marketing && d.marketing.activeCampaigns);
        var screens = [];
        for (var i = 0; i < 3; i++) {
            var x = -0.9 + i * 0.9;
            box(f, 'dark', 0.8, 0.5, 0.05, x, 1.2, -2.05);
            var face = box(f, i < camp ? 'screenOn' : 'screenOff', 0.72, 0.42, 0.02, x, 1.2, -2.02);
            screens.push({ m: face, on: i < camp, ph: i * 1.3 });
        }
        var mk = Math.min(3, roleCount(d, 'marketer'));
        for (var k = 0; k < mk; k++) {
            var dx = -0.7 + k * 0.7;
            box(f, 'deskTop', 0.6, 0.06, 0.5, dx, 0.6, -0.3);
            box(f, 'desk', 0.05, 0.57, 0.46, dx - 0.27, 0.285, -0.3);
            box(f, 'desk', 0.05, 0.57, 0.46, dx + 0.27, 0.285, -0.3);
            cone(f, 'amber', 0.1, 0.26, dx, 0.76, -0.3).rotation.z = Math.PI / 2;
            chair(f, dx, 0.35);
        }
        if (camp > 0) {
            var m = cone(f, 'glow', 0.35, 0.8, 1.0, 0.5, 1.6);
            m.rotation.z = -Math.PI / 2.4;
            tk.push(function (sec) { var s = 1 + Math.sin(sec * 4) * 0.06; m.scale.set(0.35 * s, 0.8, 0.35 * s); });
        }
        for (var gk = mk; gk < 3; gk++) {                                    // slot meja marketer yang belum terisi
            var gx2 = -0.7 + gk * 0.7;
            box(f, 'ghost', 0.6, 0.06, 0.5, gx2, 0.6, -0.3);
            box(f, 'ghost', 0.05, 0.57, 0.46, gx2 - 0.27, 0.285, -0.3);
            box(f, 'ghost', 0.05, 0.57, 0.46, gx2 + 0.27, 0.285, -0.3);
        }
        plant(f, -1.1, 1.6, 0.9);
        tk.push(function (sec) {
            for (var q = 0; q < screens.length; q++) {
                var s = screens[q];
                if (s.on) s.m.material = (Math.sin(sec * 2.2 + s.ph) > 0) ? M.screenOn : M.glow;
            }
        });
    };

    BUILD.finance = function (r, d, p, st, tk) {
        var f = r.furn;
        var vault = cyl(f, 'metal', 0.6, 0.18, -0.5, 0.9, -1.95);
        vault.rotation.x = Math.PI / 2;
        var ring = mesh(f, G.tor, 'gold', 0.5, 0.5, 0.5, -0.5, 0.9, -1.84);
        box(f, 'gold', 0.5, 0.06, 0.04, -0.5, 0.9, -1.8);
        box(f, 'gold', 0.06, 0.5, 0.04, -0.5, 0.9, -1.8);
        void ring;
        var cash = d.cash || 0;
        var n = clamp(Math.floor(Math.log10(Math.max(1, cash)) - 1), 0, 6);
        for (var i = 0; i < n; i++) {
            var hgt = 0.12 * (1 + (i % 3)) + 0.08 * Math.floor(i / 3);
            cyl(f, 'gold', 0.14, hgt, -1.0 + i * 0.34, hgt / 2, -1.2);
        }
        if (cash >= 1e6) {                                                   // koin berputar saat kas >= $1M
            var pv = new THREE.Group();
            pv.position.set(-0.5, 1.85, -1.6);
            f.add(pv);
            cyl(pv, 'gold', 0.17, 0.035, 0, 0, 0).rotation.x = Math.PI / 2;
            tk.push(function (sec) { pv.rotation.y = sec * 2.4; pv.position.y = 1.85 + Math.sin(sec * 2) * 0.05; });
        }
        var loans = Math.min(5, len(d.finance && d.finance.loans));
        for (var k = 0; k < loans; k++) box(f, 'red', 0.36, 0.05, 0.26, -1.0, 0.03 + k * 0.055, 0.1);
        var bad = cash < 0;
        var lamp = sph(f, bad ? 'ledR' : 'ledG', 0.07, -1.1, 0.45, 1.7);
        cyl(f, 'metal', 0.025, 0.4, -1.1, 0.2, 1.7);
        // papan bursa
        box(f, 'dark', 1.15, 0.75, 0.05, 0.85, 1.4, -2.05);
        var hold = len(d.stocks && d.stocks.portfolio);
        var bars = [];
        for (var b = 0; b < 5; b++) {
            var up = (hash('b' + b + hold) % 2) === 0;
            bars.push({ m: box(f, up ? 'ledG' : 'ledR', 0.1, 0.4, 0.02, 0.45 + b * 0.2, 1.3, -2.01), base: 0.2 + 0.12 * ((hash('h' + b) % 4) + 1), ph: b * 1.1 });
        }
        tk.push(function (sec) {
            for (var q = 0; q < bars.length; q++) {
                var bb = bars[q];
                var h = bb.base * (hold ? (1 + 0.25 * Math.sin(sec * 1.6 + bb.ph)) : 1);
                bb.m.scale.y = h;
                bb.m.position.y = 1.05 + h / 2;
            }
            if (bad) lamp.visible = Math.sin(sec * 6) > 0;
        });
        desk(f, 0.6, 0.5, false);
        monitor(f, 0.6, 0.655, 0.4, true);
        chair(f, 0.6, 1.2);
    };

    // ---------- bangun / bangun ulang ruangan ----------
    function clearFurn(r) {
        var f = r.furn;
        for (var i = f.children.length - 1; i >= 0; i--) {
            var c = f.children[i];
            f.remove(c);
            c.traverse(function (o) {
                if (!o.userData || !o.userData.own) return;
                if (o.material) o.material.dispose();
                if (o.userData.tex) {
                    o.userData.tex.dispose();
                    var ti = ownTex.indexOf(o.userData.tex);
                    if (ti >= 0) ownTex.splice(ti, 1);
                }
            });
        }
    }
    function dropStaffRefs() {
        Object.keys(staffObjs).forEach(function (k) {
            var g = staffObjs[k], alive = false, p = g.parent;
            while (p) { if (p === scene) { alive = true; break; } p = p.parent; }
            if (!alive) delete staffObjs[k];
        });
    }

    function mixHex(a, b, k) {
        var r = Math.round(((a >> 16) & 255) * (1 - k) + ((b >> 16) & 255) * k);
        var g = Math.round(((a >> 8) & 255) * (1 - k) + ((b >> 8) & 255) * k);
        var bl = Math.round((a & 255) * (1 - k) + (b & 255) * k);
        return (r << 16) | (g << 8) | bl;
    }
    function applyRoomVisual(r) {
        var locked = !r.st.open;
        r.locked = locked;
        var tone = mixHex(r.def.tone, 0xf1f4f9, 0.4);      // warna antar ruangan diseragamkan (lebih rapi)
        var c = dark ? tint(tone, -0.62) : tone;
        if (locked) c = dark ? tint(0x56607a, -0.2) : tint(0x9fb4d6, 0.1);
        r.floorMat.color.setHex(c);
        r.floorMat.opacity = locked ? 0.55 : 1;
        r.pat.visible = !locked;
        r.pool.visible = dark && !locked;
    }
    function rebuildLabel(r) {
        if (r.label) {
            r.group.remove(r.label);
            if (r.label.material) { r.label.material.dispose(); }
            if (r.label.userData.tex) {
                r.label.userData.tex.dispose();
                var ix = labelTex.indexOf(r.label.userData.tex);
                if (ix >= 0) labelTex.splice(ix, 1);
            }
        }
        var text = (r.locked ? '🔒 ' : '') + t('office.room.' + r.def.id);
        r.label = makeLabel(text, dark, r.locked, accentHex);
        r.label.position.set(0, 1.25, r.d / 2 - 0.45);
        if (r.def.id === 'work') r.label.position.set(-3.4, 1.35, r.d / 2 - 0.4);
        r.group.add(r.label);
    }

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
    function rebuildAlert(r) {
        if (r.alertSp) {
            r.group.remove(r.alertSp);
            if (r.alertSp.material) r.alertSp.material.dispose();
            r.alertSp = null;
        }
        if (!r.alert || !r.st || !r.st.open || !r.label) return;
        var mat = new THREE.SpriteMaterial({ map: alertTexture(r.alert.lvl), transparent: true, depthTest: false });
        var sp = new THREE.Sprite(mat);
        sp.scale.set(0.42, 0.42, 1);
        sp.renderOrder = 21;
        var lp = r.label.position, off = (r.label.scale.x / 2 + 0.24) * 0.7071;
        sp.position.set(lp.x + off, lp.y + 0.04, lp.z - off);
        r.alertBase = sp.position.y;
        r.group.add(sp);
        r.alertSp = sp;
    }

    function rebuildRoom(r, d, p, st) {
        clearFurn(r);
        r.st = st;
        r.alert = st.open ? roomAlert(r.def.id, d, p) : null;
        r.tick = null;
        applyRoomVisual(r);
        var tickers = [];
        if (st.open) {
            try { BUILD[r.def.id](r, d, p, st, tickers); }
            catch (e) { console.warn('[OfficeScene] gagal bangun ruangan ' + r.def.id, e); }
        } else {
            // blueprint terkunci: gembok di tengah
            var f = r.furn;
            box(f, 'metal', 0.6, 0.5, 0.25, 0, 0.35, 0);
            var sh = mesh(f, G.tor, 'metal', 0.22, 0.22, 0.22, 0, 0.72, 0);
            sh.scale.set(0.22, 0.28, 0.22);
            box(f, 'dark', 0.08, 0.14, 0.27, 0, 0.35, 0);
        }
        if (tickers.length) {
            r.tick = function (sec) { for (var i = 0; i < tickers.length; i++) tickers[i](sec); };
            r.tick(0);   // posisi awal yang rapi (juga untuk mode reduced-motion yang tanpa loop)
        }
        animRooms = roomList.filter(function (x) { return !!x.tick; });
        rebuildLabel(r);
        rebuildAlert(r);
        dropStaffRefs();
    }

    // ---------- tema & era ----------
    function applyTheme() {
        dark = document.documentElement.getAttribute('data-theme') === 'dark';
        var ac = new THREE.Color();
        try { ac.set(readAccent()); } catch (e) { ac.setHex(0x2563eb); }
        accentHex = ac.getHex();
        var ew = ERA_WINDOWS[Math.max(0, eraIdx)] || ERA_WINDOWS[3];
        winHex = dark ? ew.dark : ew.light;
        var ix = dark ? 1 : 0;
        Object.keys(COLORS).forEach(function (k) { M[k].color.setHex(COLORS[k][ix]); });
        M.win.color.setHex(winHex);
        if (M.win.emissive) M.win.emissive.setHex(dark ? tint(winHex, -0.45) : 0x000000);
        M.ghost.color.setHex(COLORS.desk[ix]);
        M.screenOn.color.setHex(tint(winHex, dark ? 0.05 : 0.25));
        M.screenOff.color.setHex(dark ? 0x10141a : 0x232a34);
        M.glow.color.setHex(accentHex);
        M.holo.color.setHex(accentHex);
        M.selRing.color.setHex(accentHex);
        M.pool.opacity = dark ? 0.2 : 0;
        M.shade.opacity = dark ? SHADOW_OPACITY + 0.08 : SHADOW_OPACITY;
        rig.applyTheme(dark);          // warna & intensitas cahaya sama dengan Peta Kampus
        roomList.forEach(function (r) {
            r.ovMat.color.setHex(accentHex);
            r.patMat.color.setHex(dark ? 0xffffff : 0x000000);
            r.patMat.opacity = dark ? 0.085 : 0.12;
            if (r.st) { applyRoomVisual(r); rebuildLabel(r); rebuildAlert(r); }
        });
    }

    // ---------- kamera ----------
    function applyCamera() {
        var v = controls.view;
        var h = BASE_VIEW / v.zoom, w = h * aspect;
        // shiftPx: geser tampilan ke atas supaya titik fokus tidak tertutup kartu di bawah (HP)
        var sh = shiftPx ? (shiftPx / 2) / Math.max(1, container.clientHeight) * h : 0;
        camera.left = -w / 2; camera.right = w / 2; camera.top = h / 2 - sh; camera.bottom = -h / 2 - sh;
        camera.position.set(v.x + 20, 20, v.z + 20);
        camera.lookAt(v.x, 0, v.z);
        camera.updateProjectionMatrix();
    }
    function fitZoom() { return clamp(Math.min(1.05, aspect * 0.78), 0.3, 3); }
    function tweenView(tx, tz, tzoom) {
        if (focusRaf) cancelAnimationFrame(focusRaf);
        var v = controls.view, x0 = v.x, z0 = v.z, k0 = v.zoom, s0 = shiftPx, t0 = performance.now(), DUR = 420;
        if (prefersReducedMotion()) {
            v.x = tx; v.z = tz; v.zoom = tzoom; shiftPx = shiftTarget; applyCamera(); requestRender(); return;
        }
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
    // hitung ulang geser kamera menurut tinggi kartu (hanya layar sempit); animasikan bila berubah
    function updateShift() {
        var H = container.clientHeight || 0, want = 0;
        if (card.style.display !== 'none' && container.clientWidth < NARROW_PX) {
            want = Math.min(card.offsetHeight + 12, H * 0.5);
        }
        if (Math.abs(want - shiftTarget) < 1) return;
        shiftTarget = want;
        var v = controls.view;
        tweenView(v.x, v.z, v.zoom);
    }
    function resetView() { tweenView(0, 0, fitZoom()); }
    function focusRoom(id) {
        var r = rooms[id];
        if (!r) return;
        tweenView(r.group.position.x, r.group.position.z, Math.max(controls.view.zoom, 1.25));
    }

    // ---------- efek kejadian game (partikel + label melayang) ----------
    // Dipanggil dari OfficeMap saat event game terjadi. Hanya saat animasi aktif (mati di mode reduced-motion).
    // Efek dibersihkan otomatis setelah FX_LIFE detik dan dibatasi jumlah simultannya.
    var FX_MAX = 6, FX_LIFE = 2.2, FX_G = 3.4, FX_PARTS = 16;
    var FX_COLORS = { gold: 0xf5c542, green: 0x43c07a, cyan: 0x00b8d9, red: 0xff4d4d };
    var fxList = [], fxMatMap = {};
    function fxMaterial(kind) {
        if (!fxMatMap[kind]) fxMatMap[kind] = new THREE.MeshBasicMaterial({ color: FX_COLORS[kind] || 0xffffff });
        return fxMatMap[kind];
    }
    function disposeFxLabel(sp) {
        if (!sp) return;
        if (sp.material) sp.material.dispose();
        var tx = sp.userData.tex;
        if (tx) {
            tx.dispose();
            var ix = labelTex.indexOf(tx);
            if (ix >= 0) labelTex.splice(ix, 1);
        }
    }
    function endFx(i) {
        var fx = fxList[i];
        scene.remove(fx.group);
        if (fx.label) { fx.group.remove(fx.label); disposeFxLabel(fx.label); }
        fxList.splice(i, 1);
    }
    function celebrate(roomId, kind, text) {
        if (disposed || !ambient) return;
        var r = rooms[roomId];
        if (!r || r.locked) return;
        while (fxList.length >= FX_MAX) endFx(0);
        var g = new THREE.Group();
        g.position.set(r.group.position.x, 0, r.group.position.z);
        var parts = [], i, a, sp, m;
        for (i = 0; i < FX_PARTS; i++) {
            a = (i / FX_PARTS) * Math.PI * 2 + Math.random() * 0.4;
            sp = 0.9 + Math.random() * 1.1;
            m = new THREE.Mesh(G.box, fxMaterial(kind));
            m.scale.setScalar(0.08 + Math.random() * 0.06);
            m.position.set(0, 0.9, 0);
            m.userData.vx = Math.cos(a) * sp;
            m.userData.vz = Math.sin(a) * sp;
            m.userData.vy = 2.2 + Math.random() * 1.2;
            m.userData.s = m.scale.x;
            g.add(m);
            parts.push(m);
        }
        var lbl = null;
        if (text) {
            lbl = makeLabel(text, dark, false, accentHex);
            lbl.position.set(0, 1.5, 0);
            lbl.renderOrder = 23;
            g.add(lbl);
        }
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
                var m = fx.parts[q], u = m.userData;
                var py = 0.9 + u.vy * tau - 0.5 * FX_G * tau * tau;
                m.position.set(u.vx * tau, Math.max(0.06, py), u.vz * tau);   // jangan tembus lantai
                var sc = Math.max(0.001, k) * u.s;
                m.scale.set(sc, sc, sc);
            }
            if (fx.label) {
                fx.label.position.y = 1.5 + p * 0.5;
                fx.label.material.opacity = p < 0.7 ? 1 : Math.max(0, (1 - p) / 0.3);
            }
        }
    }

    // ---------- render loop ----------
    function animateOverlays(sec) {
        for (var i = 0; i < roomList.length; i++) {
            var sp = roomList[i].alertSp;
            if (!sp) continue;
            var bad = roomList[i].alert && roomList[i].alert.lvl === 'bad';
            sp.position.y = roomList[i].alertBase + Math.sin(sec * (bad ? 5 : 3) + i) * 0.05;
            var sc = bad ? 0.42 + Math.sin(sec * 5 + i) * 0.03 : 0.42;
            sp.scale.set(sc, sc, 1);
        }
        updateRing(sec);
        if (actLabelEl && selected && selected.staffId && sec - actLabelTick > 0.4) {     // baris "Aktivitas" di kartu staf
            actLabelTick = sec;
            var txt = activityText(selected.staffId);
            if (actLabelEl.textContent !== txt) actLabelEl.textContent = txt;
        }
    }
    // turunkan kualitas otomatis bila perangkat tidak sanggup menjaga ~30fps
    function watchQuality(now) {
        // Pemain memilih 60 FPS sendiri: jangan turunkan kualitas diam-diam.
        if (quality.lowered || !lastRendered || getRenderFps() > 30) { lastRendered = now; return; }
        var gap = now - lastRendered;
        lastRendered = now;
        if (gap > quality.frameMs * 2) quality.slow++; else if (quality.slow > 0) quality.slow -= 0.25;
        if (quality.slow >= 24) {
            quality.lowered = true;
            quality.frameMs = 50;
            renderer.setPixelRatio(1);
            if (lastW && lastH) renderer.setSize(lastW, lastH, false);
        }
    }
    // PERF: antar frame, tidur dengan setTimeout lalu minta rAF sekali — tidak bangun di tiap vsync (60-120 Hz).
    function scheduleNext() {
        var fm = frameGapMs(PERF.frameMs, quality.frameMs);
        var wait = fm - (performance.now() - lastFrame) - 5;
        if (wait > 4) {
            loopTimer = setTimeout(function () { loopTimer = 0; loopRaf = requestAnimationFrame(frame); }, wait);
        } else {
            loopRaf = requestAnimationFrame(frame);
        }
    }
    function frame(now) {
        loopRaf = 0;
        if (disposed || document.hidden || !inView) { lastRendered = 0; return; }
        if (now - lastFrame < frameGapMs(PERF.frameMs, quality.frameMs) - 2) { scheduleNext(); return; }
        lastFrame = now;
        scheduleNext();
        if (ctxLost) return;
        var sec = now / 1000;
        for (var i = 0; i < animRooms.length; i++) animRooms[i].tick(sec);
        animateOverlays(sec);
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
            updateRing(0);
            renderer.render(scene, camera);
        });
    }

    function updateRing(sec) {
        if (!selected || !selected.staffId) { selRing.visible = false; return; }
        var g = staffObjs[selected.staffId];
        if (!g) { selRing.visible = false; return; }
        g.getWorldPosition(tmpV);
        selRing.position.set(tmpV.x, 0.05, tmpV.z);
        var k = 0.5 + Math.sin(sec * 4) * 0.03;
        selRing.scale.set(k, k, 1);
        selRing.visible = true;
    }
    function focusStaff(id) {
        var g = staffObjs[id];
        if (!g) return;
        g.getWorldPosition(tmpV);
        tweenView(tmpV.x, tmpV.z, Math.max(controls.view.zoom, 1.5));
    }

    // ---------- UI overlay (chip ruangan + kartu info) ----------
    var chipBar = document.createElement('div');
    chipBar.className = 'office-chips';
    chipBar.style.cssText = 'position:absolute;left:8px;right:44px;top:8px;z-index:3;display:flex;gap:6px;' +
        'overflow-x:auto;touch-action:pan-x;scrollbar-width:none;padding:2px 0;' +
        '-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 22px),transparent);' +
        'mask-image:linear-gradient(to right,#000 calc(100% - 22px),transparent);';
    container.appendChild(chipBar);

    var card = document.createElement('div');
    card.className = 'office-card';
    card.style.cssText = 'position:absolute;z-index:3;display:none;box-sizing:border-box;overflow-y:auto;' +
        'overscroll-behavior:contain;-webkit-overflow-scrolling:touch;' +
        'padding:12px 14px;border-radius:14px;background:var(--bg-2);color:var(--text-primary);' +
        'border:1px solid var(--border);box-shadow:var(--shadow);';
    card.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    container.appendChild(card);
    // HP: lembar bawah penuh lebar (tinggi dibatasi, area aman notch); layar lebar: panel melayang di kiri-bawah
    function isNarrow() { return container.clientWidth < NARROW_PX; }
    function applyCardLayout() {
        var cs = card.style;
        if (isNarrow()) {
            cs.left = '10px'; cs.right = '10px'; cs.width = 'auto';
            cs.bottom = 'calc(10px + env(safe-area-inset-bottom, 0px))';
            cs.maxHeight = 'min(46%, 340px)';
        } else {
            cs.left = '12px'; cs.right = 'auto'; cs.width = 'min(380px, 44%)';
            cs.bottom = '12px'; cs.maxHeight = '72%';
        }
    }
    applyCardLayout();

    var hint = document.createElement('div');
    hint.className = 'map-hint';
    hint.style.cssText = 'position:absolute;left:12px;bottom:10px;z-index:2;font-size:11px;pointer-events:none;' +
        'max-width:80%;transition:opacity .4s;';
    hint.textContent = t('office.hint');
    container.appendChild(hint);
    var hintGone = false;

    var legendBtn = document.createElement('button');
    legendBtn.type = 'button';
    legendBtn.textContent = 'ⓘ';
    legendBtn.style.cssText = 'position:absolute;right:8px;top:8px;z-index:4;width:32px;height:32px;border-radius:50%;' +
        'border:1px solid var(--border);background:var(--bg-2);color:var(--text-primary);font-size:15px;line-height:1;cursor:pointer;padding:0;';
    legendBtn.setAttribute('aria-expanded', 'false');
    container.appendChild(legendBtn);
    var legend = document.createElement('div');
    legend.style.cssText = 'position:absolute;right:8px;top:46px;z-index:4;display:none;max-width:240px;padding:10px 12px;' +
        'border-radius:12px;background:var(--bg-2);color:var(--text-primary);border:1px solid var(--border);' +
        'box-shadow:var(--shadow);font-size:11.5px;line-height:1.5;max-height:calc(100% - 60px);overflow-y:auto;';
    container.appendChild(legend);
    function legendRow(color, text, round) {
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:7px;margin-top:3px;';
        var sw = document.createElement('span');
        sw.style.cssText = 'flex:0 0 auto;width:10px;height:10px;background:' + color + ';border-radius:' + (round === false ? '2px' : '50%') + ';';
        var tx = document.createElement('span');
        tx.textContent = text;
        row.appendChild(sw); row.appendChild(tx);
        return row;
    }
    function rebuildLegend() {
        legend.innerHTML = '';
        var h1 = document.createElement('div');
        h1.style.cssText = 'font-weight:800;font-size:12px;';
        h1.textContent = t('office.legend.title');
        legend.appendChild(h1);
        ROLES.forEach(function (rd) { legend.appendChild(legendRow(rd.color, rd.label, false)); });
        legend.appendChild(legendRow('#43c07a', t('office.legend.morale.high')));
        legend.appendChild(legendRow('#f5b83d', t('office.legend.morale.mid')));
        legend.appendChild(legendRow('#ef5350', t('office.legend.morale.low')));
        legend.appendChild(legendRow('#e0b445', t('office.legend.tier'), false));
        legend.appendChild(legendRow('#f59e0b', t('office.legend.alert')));
        legend.appendChild(legendRow('#8fb4e8', t('office.legend.bubble')));
        legend.appendChild(legendRow('#9fb4d6', t('office.legend.locked'), false));
    }
    legendBtn.addEventListener('click', function () {
        legendOn = !legendOn;
        legend.style.display = legendOn ? 'block' : 'none';
        legendBtn.setAttribute('aria-expanded', legendOn ? 'true' : 'false');
        if (legendOn) rebuildLegend();
    });
    legendBtn.setAttribute('aria-label', 'legend');

    function mkBtn(label, primary, tall) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.style.cssText = 'border:1px solid ' + (primary ? 'var(--accent)' : 'var(--border)') + ';' +
            'background:' + (primary ? 'var(--accent)' : 'var(--bg-3)') + ';color:' + (primary ? '#fff' : 'var(--text-primary)') + ';' +
            'border-radius:999px;padding:7px 14px;font-size:12.5px;font-weight:700;cursor:pointer;' +
            (tall ? 'min-height:' + (isNarrow() ? 40 : 34) + 'px;' : '');
        return b;
    }

    // ---- chip ruangan: dibangun ulang hanya bila isinya berubah; posisi gulir dijaga; chip terpilih digulung ke tengah
    var lastCenteredRoom = null;
    function rebuildChips() {
        var selRoom = selected ? selected.room : '';
        var parts = [selRoom, t('office.btn.all')];
        roomList.forEach(function (r) {
            parts.push(r.def.id + ':' + ((!r.st || r.st.open) ? 1 : 0) + ':' + (r.alert ? r.alert.lvl : '') + ':' + t('office.room.' + r.def.id));
        });
        var sig = parts.join('|');
        if (sig === chipSig) return;
        chipSig = sig;
        var keepLeft = chipBar.scrollLeft, selBtn = null;
        chipBar.innerHTML = '';
        var all = mkBtn(t('office.btn.all'), false);
        all.style.padding = '6px 12px'; all.style.fontSize = '11.5px'; all.style.flex = '0 0 auto';
        all.style.background = 'var(--bg-2)';
        all.addEventListener('click', function () { select(null); resetView(); });
        chipBar.appendChild(all);
        roomList.forEach(function (r) {
            var open = !r.st || r.st.open;
            var isSel = !!(selected && selected.room === r.def.id);
            var b = mkBtn((open ? '' : '🔒 ') + t('office.room.' + r.def.id), isSel);
            b.style.padding = '6px 12px'; b.style.fontSize = '11.5px'; b.style.flex = '0 0 auto'; b.style.whiteSpace = 'nowrap';
            if (!isSel) b.style.background = 'var(--bg-2)';
            if (!open) b.style.opacity = '0.7';
            if (open && r.alert) {
                var dot = document.createElement('span');
                dot.textContent = ' ●';
                dot.style.cssText = 'color:' + (r.alert.lvl === 'bad' ? '#ef4444' : '#f59e0b') + ';';
                b.appendChild(dot);
            }
            b.addEventListener('click', function () { select({ room: r.def.id }); focusRoom(r.def.id); });
            chipBar.appendChild(b);
            if (isSel) selBtn = b;
        });
        chipBar.scrollLeft = keepLeft;
        if (selBtn && lastCenteredRoom !== selRoom) {
            var left = selBtn.offsetLeft - (chipBar.clientWidth - selBtn.offsetWidth) / 2;
            try { chipBar.scrollTo({ left: Math.max(0, left), behavior: prefersReducedMotion() ? 'auto' : 'smooth' }); }
            catch (e) { chipBar.scrollLeft = Math.max(0, left); }
        }
        lastCenteredRoom = selRoom || null;
    }

    function goTo(g) {
        if (!g) return;
        bus.emit('advisor:go', { nav: g.nav, subtab: g.subtab, staffId: g.staffId || null, mode: g.mode || null });
    }

    // ---- aksi langsung dari peta (bangun/upgrade Fab, latih staf) — memakai sistem game yang sama dengan panel
    function runAction(a) {
        if (!a || busy) return;
        if (a.disabled) { try { if (a.note) ToastService.info(a.note); } catch (e) {} return; }
        var g = window.__game;
        if (!g) return;
        busy = true;
        var res = null;
        try {
            if (a.id === 'fab-build' && g.fab) res = g.fab.buildFab(1);
            else if (a.id === 'fab-upgrade' && g.fab) res = g.fab.upgradeFab();
            else if (a.id === 'train' && g.teamSystem) res = g.teamSystem.trainStaff(a.staffId);
        } catch (e) {
            console.warn('[OfficeScene] aksi gagal:', e);
            res = { ok: false, reason: String((e && e.message) || e) };
        }
        if (res && res.ok === false && res.reason) { try { ToastService.error(res.reason); } catch (e2) {} }
        else { try { if (navigator.vibrate) navigator.vibrate(15); } catch (e3) {} }
        setTimeout(function () { busy = false; }, 350);
    }

    function activityText(staffId) {
        var a = activity[staffId];
        return t('office.staff.activity', { a: t(a ? a.key : 'office.act.working') });
    }

    function cardSignature(info) {
        return JSON.stringify([
            info.title, info.badge, info.lines,
            (info.actions || []).map(function (a) { return [a.id, a.label, a.note, a.disabled ? 1 : 0, a.staffId || '']; }),
            info.go ? info.go.label : '', info.go2 ? info.go2.label : '',
            cardCollapsed ? 1 : 0, isNarrow() ? 1 : 0, info.staffId || ''
        ]);
    }

    function refreshCard() {
        var info = null;
        if (selected && lastData && lastPlan) {
            if (selected.staffId) {
                var st = null, ss = lastData.staff || [];
                for (var i = 0; i < ss.length; i++) if (ss[i].id === selected.staffId) st = ss[i];
                if (st) info = describeStaff(st);
                else { selected.staffId = null; updateRing(0); }
            }
            if (!info) info = describeRoom(selected.room, lastData, lastPlan);
        }
        if (!info) {
            card.style.display = 'none'; cardSig = ''; actLabelEl = null;
            hint.style.display = hintGone ? 'none' : '';
            if (cardWasVisible) { cardWasVisible = false; updateShift(); }
            return;
        }
        // isi tidak berubah -> jangan bangun ulang DOM (supaya ketukan tombol tidak hilang saat state game berubah)
        var sig = cardSignature(info);
        if (sig === cardSig && card.style.display !== 'none') return;
        cardSig = sig;
        var keepScroll = card.scrollTop;
        applyCardLayout();
        card.innerHTML = '';
        actLabelEl = null;

        var head = document.createElement('div');
        head.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:' + (cardCollapsed ? '0' : '6px') + ';';
        var ttl = document.createElement('div');
        ttl.style.cssText = 'font-size:15px;font-weight:800;letter-spacing:-0.01em;flex:1;min-width:0;' +
            'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        ttl.textContent = info.title;
        var badge = document.createElement('span');
        badge.style.cssText = 'font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;' +
            'background:var(--accent-soft);color:var(--accent);white-space:nowrap;';
        badge.textContent = info.badge;
        head.appendChild(ttl); head.appendChild(badge);
        if (isNarrow()) {
            var tg = document.createElement('button');
            tg.type = 'button';
            tg.textContent = cardCollapsed ? '▴' : '▾';
            tg.setAttribute('aria-label', t(cardCollapsed ? 'office.card.expand' : 'office.card.collapse'));
            tg.setAttribute('aria-expanded', cardCollapsed ? 'false' : 'true');
            tg.style.cssText = 'border:none;background:transparent;color:var(--text-tertiary);font-size:16px;cursor:pointer;padding:4px 8px;min-width:36px;min-height:36px;';
            tg.addEventListener('click', function () { cardCollapsed = !cardCollapsed; cardSig = ''; refreshCard(); });
            head.appendChild(tg);
        }
        var x = document.createElement('button');
        x.type = 'button'; x.textContent = '✕'; x.setAttribute('aria-label', 'close');
        x.style.cssText = 'border:none;background:transparent;color:var(--text-tertiary);font-size:15px;cursor:pointer;padding:4px 8px;min-width:36px;min-height:36px;';
        x.addEventListener('click', function () { select(null); });
        head.appendChild(x);
        card.appendChild(head);

        if (!(cardCollapsed && isNarrow())) {
            var lines = document.createElement('div');
            lines.style.cssText = 'font-size:12.5px;line-height:1.55;color:var(--text-secondary, var(--text-tertiary));';
            (info.lines || []).forEach(function (ln) {
                var d = document.createElement('div'); d.textContent = ln; lines.appendChild(d);
            });
            if (info.staffId) {                               // baris aktivitas yang diperbarui live dari animasi
                actLabelEl = document.createElement('div');
                actLabelEl.style.cssText = 'color:var(--accent);font-weight:700;';
                actLabelEl.textContent = activityText(info.staffId);
                lines.appendChild(actLabelEl);
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
                    ab.addEventListener('click', function () { runAction(a); });
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
        if (!cardWasVisible) cardWasVisible = true;
        updateShift();
    }

    function select(sel) {
        selected = sel;
        if (sel) hintGone = true;
        roomList.forEach(function (r) {
            var on = !!(sel && sel.room === r.def.id);
            r.ov.visible = on;
        });
        cardSig = '';
        refreshCard();
        rebuildChips();
        updateRing(0);
        requestRender();
    }

    // ---------- tap / pick ----------
    function handleTap(cx, cy) {
        if (disposed) return;
        var rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
        scene.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);
        raycaster.setFromCamera(ndc, camera);
        var groups = roomList.map(function (r) { return r.group; });
        var hits = raycaster.intersectObjects(groups, true);
        var staffId = null, roomId = null;
        for (var i = 0; i < hits.length && !roomId; i++) {
            if (hits[i].object.isSprite) continue;
            var o = hits[i].object;
            while (o) {
                if (o.userData && o.userData.staffId && !staffId) staffId = o.userData.staffId;
                if (o.userData && o.userData.roomId) { roomId = o.userData.roomId; break; }
                o = o.parent;
            }
        }
        if (!roomId) { select(null); return; }
        select({ room: roomId, staffId: staffId });
        if (staffId) focusStaff(staffId);
    }

    var controls = createCampusControls(canvas, {
        unitsPerPixel: function (zoom) { return (BASE_VIEW / zoom) / Math.max(1, container.clientHeight); },
        minZoom: 0.3,
        maxZoom: 3,
        limit: 16,
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
            cardSig = ''; chipSig = '';          // tata letak HP <-> layar lebar bisa berubah (rotasi layar)
            refreshCard(); rebuildChips();
            applyCamera();
            requestRender();
        });
    }

    // ---------- sinkron dengan state game ----------
    function update(data) {
        if (disposed || !data) return;
        var plan = computePlan(data);
        rememberPeak(data, plan);
        lastData = data; lastPlan = plan;
        setClock(data);
        var force = false;
        if (plan.eraIdx !== eraIdx) { eraIdx = plan.eraIdx; applyTheme(); force = true; }
        roomList.forEach(function (r) {
            var logic = ROOM_LOGIC[r.def.id];
            var st = logic.state(data, plan);
            var sig = (st.open ? 1 : 0) + ':' + st.level + ':' + logic.sig(data, plan) + ':' + eraIdx;
            if (!force && sig === r.sig) return;
            r.sig = sig;
            rebuildRoom(r, data, plan, st);
        });
        rebuildChips();
        refreshCard();
        requestRender();
    }

    function relabel() {
        hint.textContent = t('office.hint');
        canvas.setAttribute('aria-label', t('office.aria'));
        roomList.forEach(function (r) { rebuildLabel(r); rebuildAlert(r); });
        if (legendOn) rebuildLegend();
        chipSig = ''; cardSig = '';
        rebuildChips();
        refreshCard();
        requestRender();
    }

    function onVis() { if (!document.hidden) requestRender(); }
    var io = null;
    if (typeof IntersectionObserver !== 'undefined') {
        io = new IntersectionObserver(function (en) {
            inView = en[en.length - 1].isIntersecting;
            if (inView) requestRender();
        });
        io.observe(container);
    }
    document.addEventListener('visibilitychange', onVis);
    function onCtxLost(e) { e.preventDefault(); ctxLost = true; }
    function onCtxRestored() { ctxLost = false; requestRender(); }
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
        updateClock: function (data) { if (disposed) return; setClock(data); if (!ambient) requestRender(); },
        refreshTheme: function () {
            applyTheme();
            // papan nama & label mengikuti tema: bangun ulang ruang Work
            if (rooms.work) rooms.work.sig = null;
            if (lastData) update(lastData); else requestRender();
        },
        relabel: relabel,
        celebrate: celebrate,
        select: function (id) { select(id ? { room: id } : null); if (id) focusRoom(id); },
        selectStaff: function (id) {        // pilih staf (kartu + kamera fokus); dipakai juga untuk uji
            if (!staffObjs[id]) return false;
            select({ room: 'work', staffId: id });
            focusStaff(id);
            return true;
        },
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
            roomList.forEach(function (r) {
                clearFurn(r);
                if (r.label && r.label.material) r.label.material.dispose();
                if (r.alertSp && r.alertSp.material) r.alertSp.material.dispose();
                r.floorMat.dispose(); r.ovMat.dispose(); r.patMat.dispose(); if (r.railMat) r.railMat.dispose();
            });
            while (fxList.length) endFx(0);
            Object.keys(fxMatMap).forEach(function (k) { fxMatMap[k].dispose(); });
            labelTex.forEach(function (tx) { tx.dispose(); });
            ownTex.forEach(function (tx) { tx.dispose(); });
            Object.keys(alertTex).forEach(function (k) { alertTex[k].dispose(); });
            Object.keys(bubbleTex).forEach(function (k) { bubbleTex[k].dispose(); });
            hairMat.forEach(function (m) { m.dispose(); });
            Object.keys(tierMat).forEach(function (k) { tierMat[k].dispose(); });
            Object.keys(G).forEach(function (k) { G[k].dispose(); });
            Object.keys(M).forEach(function (k) { M[k].dispose(); });
            Object.keys(roleMat).forEach(function (k) { roleMat[k].dispose(); });
            skinMat.forEach(function (m) { m.dispose(); });
            moraleMat.forEach(function (m) { m.dispose(); });
            Object.keys(hueMats).forEach(function (k) { hueMats[k].dispose(); });
            rig.dispose();
            renderer.dispose();
            try { renderer.forceContextLoss(); } catch (e) {}
            [chipBar, card, hint, legendBtn, legend, canvas].forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
        }
    };
}

