// FILE: src/ui/office/OfficeExterior.js  (BARU — v2027.83 "Office Exterior")
// Tembok luar, halaman, dan gedung-gedung sekitar Office 3D Map dibuat sedetail Peta Kampus.
// Logika game, denah, rute staf, kartu, dan antarmuka TIDAK berubah. Posisi & ukuran semua benda sama dengan versi lama.
//
//   * Tanah   : rumput bertekstur (noise), plaza paving berpola batu, jalan beraspal bertekstur, tepi tanah berlapis (strata).
//   * Gedung  : fasad kampus bertekstur (jendela berbingkai + kaca gradasi + pilaster), AO vertex di dasar, atap + unit AC,
//               kanopi pintu, plat nama beraksen, bayangan kontak. Malam: jendela menyala hangat (emissive map).
//   * Kantor  : dinding plester bertekstur, plint (skirting), jendela berkaca (kusen, palang, pantulan, menyala saat malam),
//               ambang & lis atas, dinding depan rendah bertutup.
//   * Taman   : pohon & semak INSTANCED (1 draw call per bagian), petak bunga, bangku, tempat sampah, bollard, tiang lampu
//               bertudung (halo + kolam cahaya saat malam), gerbang berlentera, tiang bendera berkibar,
//               air mancur bertingkat dengan air beriak & pancuran.
//   * Tier low (mode hemat): tanpa bunga/halo/pancuran, tekstur lebih kecil. Tier medium/high: bayangan gedung; high: bayangan pohon.
//
// Dipakai dari OfficeScene.js:
//   var exterior = buildOfficeExterior(THREE, { shell, G, M, props, look, FLOOR, GY, PZ, renderer });
//   exterior.applyTheme(dark, winHex);   // setelah warna M.* diatur tiap ganti tema
//   exterior.tick(sec);                  // di loop animasi (air mancur, bendera)
//   exterior.dispose();                  // saat scene dibuang (sebelum G / M di-dispose)

function tintHex(n, f) {                       // f: -1 (gelap) .. 1 (terang)
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var tg = f < 0 ? 0 : 255, a = Math.abs(f);
    r = Math.round(r + (tg - r) * a); g = Math.round(g + (tg - g) * a); b = Math.round(b + (tg - b) * a);
    return (r << 16) | (g << 8) | b;
}
function cssHex(n) { return '#' + ('000000' + (n >>> 0).toString(16)).slice(-6); }
function mkRnd(seed) { var s = seed >>> 0 || 1; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

export function buildOfficeExterior(THREE, ctx) {
    var shell = ctx.shell, G = ctx.G, M = ctx.M, props = ctx.props, look = ctx.look || { tier: 'medium', shadows: true };
    var FLOOR = ctx.FLOOR, GY = ctx.GY, PZ = ctx.PZ, renderer = ctx.renderer;
    var tier = look.tier || 'medium';
    var LO = tier === 'low', HI = tier === 'high';
    var shadowsOn = !!look.shadows;
    var rnd = mkRnd(2468);
    var aniso = 4;
    try { aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 4); } catch (e) {}

    var texs = [], mats = [], geos = [], group = new THREE.Group();
    shell.add(group);
    var dark = false, winHexNow = 0x8fb4e8, drawnKey = '';
    var animFns = [];

    // ============================================================
    // UTIL
    // ============================================================
    function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    function tex(c, repeat) {
        var t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        if (repeat) { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; }
        t.anisotropy = aniso;
        texs.push(t);
        return t;
    }
    function reg(m) { mats.push(m); return m; }
    function std(o, rough, metal, env) {
        var m = new THREE.MeshStandardMaterial(o);
        m.roughness = rough; m.metalness = metal || 0;
        m.envMapIntensity = env === undefined ? 0.5 : env;
        return reg(m);
    }
    function mat(k) { return typeof k === 'string' ? M[k] : k; }
    var geoCache = {};
    function cached(key, make) { if (!geoCache[key]) { geoCache[key] = make(); geos.push(geoCache[key]); } return geoCache[key]; }

    // Box dengan UV berskala dunia (tile = panjang dunia satu pengulangan tekstur).
    function tbox(w, h, d, tile) {
        return cached('t|' + [w, h, d, tile].join('|'), function () {
            var g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
            var dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]], f, v, i;
            for (f = 0; f < 6; f++) for (v = 0; v < 4; v++) {
                i = f * 4 + v;
                uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile);
            }
            uv.needsUpdate = true;
            return g;
        });
    }
    // Slab tanah: sisi memakai tekstur strata (v penuh 0..1), atas = rumput.
    function slabGeo(w, h, d, tile, sideTile) {
        return cached('s|' + [w, h, d, tile, sideTile].join('|'), function () {
            var g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, f, v, i;
            for (f = 0; f < 6; f++) for (v = 0; v < 4; v++) {
                i = f * 4 + v;
                if (f === 0 || f === 1) uv.setXY(i, uv.getX(i) * d / sideTile, uv.getY(i));
                else if (f >= 4) uv.setXY(i, uv.getX(i) * w / sideTile, uv.getY(i));
                else uv.setXY(i, uv.getX(i) * w / tile, uv.getY(i) * d / tile);
            }
            uv.needsUpdate = true;
            return g;
        });
    }
    // Box fasad: jendela mengikuti lebar & jumlah lantai + vertex color (gelap di dasar) sebagai AO murah.
    function fbox(w, h, d, floors) {
        return cached('f|' + [w, h, d, floors].join('|'), function () {
            var g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, f, v, i;
            var uw = Math.max(1, Math.round(w / 0.75)) / 4, ud = Math.max(1, Math.round(d / 0.75)) / 4, uh = Math.max(1, floors) / 4;
            for (f = 0; f < 6; f++) for (v = 0; v < 4; v++) {
                i = f * 4 + v;
                var u = uv.getX(i), t = uv.getY(i);
                if (f < 2) uv.setXY(i, u * ud, t * uh);
                else if (f >= 4) uv.setXY(i, u * uw, t * uh);
                else uv.setXY(i, 0.01, 0.01);
            }
            uv.needsUpdate = true;
            var pos = g.attributes.position, col = new Float32Array(pos.count * 3), k;
            for (k = 0; k < pos.count; k++) {
                var ty = (pos.getY(k) + h / 2) / h;
                var sh = 0.7 + 0.3 * Math.pow(Math.max(0, Math.min(1, ty)), 0.55);
                col[k * 3] = col[k * 3 + 1] = col[k * 3 + 2] = sh;
            }
            g.setAttribute('color', new THREE.BufferAttribute(col, 3));
            return g;
        });
    }

    // Penempatan: benda statis (matriks dibekukan). opt.dyn = bergerak (dianimasikan).
    function place(geo, material, x, y, z, sx, sy, sz, cast, dyn) {
        var m = new THREE.Mesh(geo, mat(material));
        m.position.set(x, y, z);
        if (sx !== undefined) m.scale.set(sx, sy, sz);
        m.castShadow = !!cast && shadowsOn;
        m.receiveShadow = shadowsOn;
        if (!dyn) { m.updateMatrix(); m.matrixAutoUpdate = false; }
        group.add(m);
        return m;
    }
    function B(material, w, h, d, x, y, z, cast) { return place(G.box, material, x, y, z, w, h, d, cast); }
    function Bt(material, w, h, d, tile, x, y, z, cast) { return place(tbox(w, h, d, tile), material, x, y, z, undefined, undefined, undefined, cast); }
    function Cy(material, r, h, x, y, z, cast) { return place(G.cyl, material, x, y, z, r, h, r, cast); }

    // ============================================================
    // TEKSTUR PROSEDURAL
    // ============================================================
    var TS = LO ? 128 : 256;
    // rumput: bintik besar lembut + helai halus (abu-abu terang; warna dari material)
    var grassTex = (function () {
        var c = canvas(TS, TS), g = c.getContext('2d'), r = mkRnd(424242), i, k = TS / 128;
        g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, TS, TS);
        for (i = 0; i < 220; i++) {
            var x = r() * TS, y = r() * TS, rad = (3 + r() * 11) * k, dk = r() < 0.55;
            g.fillStyle = dk ? 'rgba(48,84,36,0.07)' : 'rgba(255,255,255,0.5)';
            for (var ox = -TS; ox <= TS; ox += TS) for (var oy = -TS; oy <= TS; oy += TS) { g.beginPath(); g.arc(x + ox, y + oy, rad, 0, 6.2832); g.fill(); }
        }
        for (i = 0; i < 700 * k; i++) {
            var bx = r() * TS, by = r() * TS, ln = (2 + r() * 4) * k;
            g.strokeStyle = r() < 0.5 ? 'rgba(40,80,30,0.10)' : 'rgba(255,255,255,0.35)';
            g.lineWidth = 1;
            g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + (r() - 0.5) * 2 * k, by - ln); g.stroke();
        }
        return tex(c, true);
    })();
    // paving: batu persegi bergaya running bond + nat + bintik
    var paverTex = (function () {
        var c = canvas(256, 256), g = c.getContext('2d'), r = mkRnd(9137), row, col;
        g.fillStyle = '#e6e6e6'; g.fillRect(0, 0, 256, 256);
        for (row = 0; row < 8; row++) {
            var off = (row % 2) * 32;
            for (col = -1; col < 5; col++) {
                var v = 214 + Math.round(r() * 30);
                g.fillStyle = 'rgb(' + v + ',' + v + ',' + (v + 2) + ')';
                g.fillRect(col * 64 + off + 1, row * 32 + 1, 62, 30);
            }
        }
        g.strokeStyle = 'rgba(120,128,140,0.55)'; g.lineWidth = 2;
        for (row = 0; row <= 8; row++) { g.beginPath(); g.moveTo(0, row * 32); g.lineTo(256, row * 32); g.stroke(); }
        for (row = 0; row < 8; row++) {
            var o2 = (row % 2) * 32;
            for (col = -1; col < 5; col++) { g.beginPath(); g.moveTo(col * 64 + o2, row * 32); g.lineTo(col * 64 + o2, row * 32 + 32); g.stroke(); }
        }
        for (var i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.18)'; g.fillRect(r() * 256, r() * 256, 2, 2); }
        return tex(c, true);
    })();
    // aspal/jalan setapak: butiran halus
    var roadTex = (function () {
        var c = canvas(TS, TS), g = c.getContext('2d'), r = mkRnd(5531), i;
        g.fillStyle = '#e9e9e9'; g.fillRect(0, 0, TS, TS);
        for (i = 0; i < 2600; i++) {
            var v = 195 + Math.round(r() * 55);
            g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',0.7)';
            g.fillRect(r() * TS, r() * TS, 1 + r() * 2, 1 + r() * 2);
        }
        for (i = 0; i < 60; i++) { g.strokeStyle = 'rgba(70,76,88,0.10)'; g.lineWidth = 1; g.beginPath(); var sx = r() * TS, sy = r() * TS; g.moveTo(sx, sy); g.lineTo(sx + (r() - 0.5) * 30, sy + (r() - 0.5) * 30); g.stroke(); }
        return tex(c, true);
    })();
    // plester dinding: bintik sangat halus
    var plasterTex = (function () {
        var c = canvas(TS, TS), g = c.getContext('2d'), r = mkRnd(7741), i;
        g.fillStyle = '#f7f7f7'; g.fillRect(0, 0, TS, TS);
        for (i = 0; i < 1800; i++) {
            var v = 236 + Math.round(r() * 20);
            g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',0.8)';
            g.fillRect(r() * TS, r() * TS, 1 + r() * 2, 1 + r() * 2);
        }
        for (i = 0; i < 14; i++) { g.fillStyle = 'rgba(120,130,150,0.035)'; g.fillRect(0, r() * TS, TS, 2 + r() * 6); }
        return tex(c, true);
    })();
    // jendela kantor: kaca gradasi + palang + kilau diagonal (abu terang; warna dari material)
    var glassTex = (function () {
        var c = canvas(128, 96), g = c.getContext('2d');
        var gr = g.createLinearGradient(0, 0, 0, 96);
        gr.addColorStop(0, 'rgb(255,255,255)'); gr.addColorStop(0.55, 'rgb(214,222,232)'); gr.addColorStop(1, 'rgb(168,180,198)');
        g.fillStyle = gr; g.fillRect(0, 0, 128, 96);
        g.fillStyle = 'rgba(255,255,255,0.42)';
        g.beginPath(); g.moveTo(8, 0); g.lineTo(46, 0); g.lineTo(16, 96); g.lineTo(0, 96); g.lineTo(0, 40); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.22)';
        g.beginPath(); g.moveTo(60, 0); g.lineTo(76, 0); g.lineTo(40, 96); g.lineTo(24, 96); g.closePath(); g.fill();
        g.fillStyle = 'rgba(70,84,104,0.8)';
        g.fillRect(62, 0, 4, 96); g.fillRect(0, 44, 128, 4);
        return tex(c, false);
    })();
    var radialTex = (function () {
        var c = canvas(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
        return tex(c, false);
    })();
    // riak air (abu terang) untuk kolam
    var waterTex = (function () {
        var c = canvas(128, 128), g = c.getContext('2d'), r = mkRnd(311), i;
        g.fillStyle = '#e4e4e4'; g.fillRect(0, 0, 128, 128);
        for (i = 0; i < 46; i++) {
            var x = r() * 128, y = r() * 128, rad = 5 + r() * 14;
            g.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,0.7)' : 'rgba(120,170,200,0.25)';
            g.lineWidth = 1.2;
            for (var ox = -128; ox <= 128; ox += 128) for (var oy = -128; oy <= 128; oy += 128) { g.beginPath(); g.ellipse(x + ox, y + oy, rad, rad * 0.45, 0, 0, 6.2832); g.stroke(); }
        }
        return tex(c, true);
    })();
    // fasad kampus: 4x4 sel (jendela berbingkai, kaca gradasi, pilaster) + peta emissive (jendela menyala acak)
    var facade = (function () {
        var S = 256, C = 64;
        var cMap = canvas(S, S), cEmi = canvas(S, S);
        var tMap = tex(cMap, true), tEmi = tex(cEmi, true);
        var lit = [], seed = 7, i;
        for (i = 0; i < 16; i++) { seed = (seed * 16807) % 2147483647; lit.push((seed % 100) < 68); }
        function draw(win) {
            var a = cMap.getContext('2d'), b = cEmi.getContext('2d'), r, c;
            a.fillStyle = '#ffffff'; a.fillRect(0, 0, S, S);
            b.fillStyle = '#000000'; b.fillRect(0, 0, S, S);
            for (r = 0; r < 4; r++) for (c = 0; c < 4; c++) {
                var x = c * C, y = r * C;
                a.fillStyle = cssHex(tintHex(0xffffff, -0.11)); a.fillRect(x, y, 4, C);              // pilaster
                a.fillStyle = cssHex(tintHex(0xffffff, 0.0)); a.fillRect(x + 4, y, 2, C);
                a.fillStyle = cssHex(tintHex(0xffffff, -0.18)); a.fillRect(x, y + C - 4, C, 4);      // garis bayangan lantai
                a.fillStyle = cssHex(tintHex(win, -0.52)); a.fillRect(x + 8, y + 10, 48, 42);        // bingkai
                a.fillStyle = cssHex(tintHex(win, -0.25)); a.fillRect(x + 10, y + 12, 44, 38);
                var gr = a.createLinearGradient(x + 10, y + 12, x + 48, y + 50);
                gr.addColorStop(0, cssHex(tintHex(win, 0.55)));
                gr.addColorStop(0.48, cssHex(tintHex(win, 0.12)));
                gr.addColorStop(1, cssHex(tintHex(win, -0.18)));
                a.fillStyle = gr; a.fillRect(x + 12, y + 14, 40, 34);                                // kaca
                a.fillStyle = 'rgba(255,255,255,0.22)';
                a.beginPath(); a.moveTo(x + 13, y + 15); a.lineTo(x + 24, y + 15); a.lineTo(x + 13, y + 34); a.closePath(); a.fill();
                a.fillStyle = cssHex(tintHex(win, -0.38)); a.fillRect(x + 31, y + 14, 2, 34);        // palang
                a.fillStyle = cssHex(tintHex(win, -0.32)); a.fillRect(x + 12, y + 31, 40, 2);
                if (lit[r * 4 + c]) {
                    b.fillStyle = '#ffd890'; b.fillRect(x + 13, y + 15, 17, 15); b.fillRect(x + 34, y + 15, 17, 15);
                    b.fillStyle = '#ffc870'; b.fillRect(x + 13, y + 33, 17, 14); b.fillRect(x + 34, y + 33, 17, 14);
                }
            }
            tMap.needsUpdate = true; tEmi.needsUpdate = true;
        }
        draw(0x8fb4e8);
        return { map: tMap, emi: tEmi, draw: draw };
    })();
    // tepi tanah berlapis (dilukis ulang per tema karena memakai warna rumput & tanah)
    var strataCanvas = canvas(256, 128), strataTex = tex(strataCanvas, true);
    function drawStrata() {
        var g = strataCanvas.getContext('2d'), r = mkRnd(1999), i;
        var grass = M.ground ? M.ground.color.getHex() : 0xc4e3bd, soil = M.soil ? M.soil.color.getHex() : 0x806b56;
        g.fillStyle = cssHex(soil); g.fillRect(0, 0, 256, 128);
        for (i = 0; i < 7; i++) {
            g.fillStyle = cssHex(tintHex(soil, (i % 2 ? -0.14 : 0.1))); g.globalAlpha = 0.55;
            g.fillRect(0, 22 + i * 15 + r() * 6, 256, 5 + r() * 7);
        }
        g.globalAlpha = 1;
        for (i = 0; i < 140; i++) {
            g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.14)';
            g.fillRect(r() * 256, 18 + r() * 110, 2 + r() * 4, 2 + r() * 3);
        }
        g.fillStyle = cssHex(tintHex(grass, -0.12)); g.fillRect(0, 0, 256, 20);                      // lapisan rumput
        g.fillStyle = cssHex(grass);
        for (i = 0; i < 64; i++) { g.beginPath(); g.arc(i * 4 + 2, 17 + Math.sin(i * 0.9) * 2, 4.5, 0, 6.2832); g.fill(); }
        g.fillRect(0, 0, 256, 14);
        strataTex.needsUpdate = true;
    }

    // ============================================================
    // MATERIAL
    // ============================================================
    var grassMat = std({ map: grassTex, color: 0xc4e3bd }, 0.96, 0, 0.35);
    var grass2Mat = std({ map: grassTex, color: 0xaed99f }, 0.97, 0, 0.35);
    var sideMat = std({ map: strataTex, color: 0xffffff }, 1, 0, 0.2);
    var soilBotMat = std({ color: 0x806b56 }, 1, 0, 0.1);
    var paverMat = std({ map: paverTex, color: 0xdfe3ea }, 0.82, 0, 0.4);
    var roadMat = std({ map: roadTex, color: 0xc3c9d3 }, 0.9, 0, 0.35);
    var plasterMat = std({ map: plasterTex, color: 0xf4f7fc }, 0.9, 0, 0.5);
    var hedgeMat = std({ map: grassTex, color: 0x4c9a61 }, 0.9, 0, 0.35);
    var glassWinMat = std({ map: glassTex, color: 0x8fb4e8, emissive: 0xffd9a0, emissiveIntensity: 0 }, 0.08, 0.2, 1.1);
    var facadeMats = [0, 1, 2].map(function () {
        var m = std({ map: facade.map, emissive: 0xffe0a8, emissiveMap: facade.emi, emissiveIntensity: 0, vertexColors: true, color: 0xe9edf3 }, 0.72, 0.04, 0.5);
        return m;
    });
    var lampHeadMat = std({ color: 0xfff1c4, emissive: 0xffd98a, emissiveIntensity: 0.25 }, 0.4, 0, 0.6);
    var waterMat = std({ map: waterTex, color: 0x86d8e8, emissive: 0x2a6f95, emissiveIntensity: 0.1 }, 0.08, 0, 1.0);
    var flowerMat = std({ color: 0xffffff }, 0.8, 0, 0.3);
    var treeLeafMat = std({ color: 0x72bd78 }, 0.75, 0, 0.5);
    var treeTrunkMat = std({ color: 0x9b7655 }, 0.9, 0, 0.3);
    var haloMat = reg(new THREE.SpriteMaterial({ map: radialTex, color: 0xffd98a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    var poolMat = reg(new THREE.MeshBasicMaterial({ map: radialTex, color: 0xffe2a8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    var haloSprites = [], poolMeshes = [];

    // ============================================================
    // TANAH: slab rumput + tepi strata, plaza paving, jalan, kerb
    // ============================================================
    (function () {
        var gm = place(slabGeo(36, 1.4, 28, 6, 6), [sideMat, sideMat, grassMat, soilBotMat, sideMat, sideMat], 0, GY - 0.7, 0, undefined, undefined, undefined, false);
        gm.receiveShadow = shadowsOn;
        // plaza paving di sekeliling gedung kantor + bingkai trotoar
        Bt(paverMat, 26, 0.1, 19.6, 2, 0, PZ - 0.05, 0);
        B('curb', 26.4, 0.1, 0.22, 0, PZ, -9.9);
        B('curb', 26.4, 0.1, 0.22, 0, PZ, 9.9);
        B('curb', 0.22, 0.1, 19.6, -13.1, PZ, 0);
        B('curb', 0.22, 0.1, 19.6, 13.1, PZ, 0);
        // jalan: pintu utama (x = -3) -> gerbang depan, jalan lintang depan, kiri & belakang
        Bt(roadMat, 2.4, 0.1, 6.9, 3, -3, GY + 0.04, 10.65);
        Bt(roadMat, 36, 0.1, 1.6, 3, 0, GY + 0.04, 11.9);
        Bt(roadMat, 1.2, 0.1, 22.3, 3, -14.1, GY + 0.04, 0.75);
        Bt(roadMat, 36, 0.1, 1.0, 3, 0, GY + 0.04, -10.4);
        // marka jalan masuk + garis tepi jalan lintang depan
        for (var pm = 0; pm < 5; pm++) B('white', 0.08, 0.01, 0.6, -3, GY + 0.095, 7.6 + pm * 1.2);
        for (var em = 0; em < 12; em++) B('white', 0.9, 0.01, 0.06, -16.2 + em * 3.0, GY + 0.095, 12.55);
        // petak rumput terang
        [[-9.5, 13.0, 6, 1.4], [7.5, 13.0, 8, 1.4], [15.0, 6.2, 3, 9]].forEach(function (g) {
            Bt(grass2Mat, g[2], 0.03, g[3], 4, g[0], GY + 0.012, g[1]);
        });
        // podium bertingkat gedung kantor: plaza -> undakan -> lantai kantor
        B('curb', 19.4, 0.14, 13.4, 0, -0.15, 0);
        B('base', 18.5, 0.22, 12.5, 0, -0.11, 0);
        B('curb', 2.4, 0.1, 0.5, -3, -0.19, 6.95);              // tangga pintu utama
        B('mat', 1.1, 0.012, 0.6, -3, 0.032, 5.62);             // keset
    })();

    // ============================================================
    // GEDUNG KAMPUS (belakang & kiri): fasad bertekstur
    // ============================================================
    function aoPatch(w, d, x, z, k) {
        var m = new THREE.Mesh(G.plane, props.aoMat);
        m.scale.set(w, d, 1);
        m.position.set(x, GY + 0.035, z);
        m.rotation.x = -Math.PI / 2;
        m.renderOrder = 1;
        m.userData.k = k || 1;
        m.updateMatrix(); m.matrixAutoUpdate = false;
        group.add(m);
        return m;
    }
    function campusBlock(x0, x1, z0, z1, h, variant) {
        var w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
        var floors = Math.max(1, Math.round(h / 0.9));
        place(fbox(w, h, d, floors), facadeMats[variant % 3], cx, GY + h / 2, cz, undefined, undefined, undefined, true);
        B('bldgRoof', w + 0.3, 0.16, d + 0.3, cx, GY + h + 0.08, cz, true);                           // atap + lis
        B('bldgBand', w + 0.1, 0.12, d + 0.1, cx, GY + 0.06, cz);                                     // sokel bawah
        B('bldgBand', w + 0.18, 0.06, d + 0.18, cx, GY + h - 0.02, cz);                               // lis bawah atap
        // unit AC + rumah tangga di atap
        var nac = Math.max(1, Math.floor(w / 3.2)), i;
        for (i = 0; i < nac; i++) {
            var ax = x0 + (i + 0.5) * (w / nac) + (i % 2 ? 0.25 : -0.25);
            B('metal', 0.7, 0.28, 0.5, ax, GY + h + 0.3, cz - d * 0.15, true);
            B('dark', 0.5, 0.03, 0.3, ax, GY + h + 0.455, cz - d * 0.15);
        }
        if (h > 3) B('bldgBand', 1.1, 0.5, 1.0, x0 + w * 0.72, GY + h + 0.41, cz - d * 0.2, true);
        // pintu, kanopi, plat nama beraksen
        var dx = cx + w * 0.18;
        B('dark', 0.9, 0.95, 0.06, dx, GY + 0.475, z1 + 0.035);
        B('bldgRoof', 1.5, 0.06, 0.55, dx, GY + 1.12, z1 + 0.27, true);
        B('metal', 0.04, 0.95, 0.04, dx - 0.68, GY + 0.62, z1 + 0.5);
        B('metal', 0.04, 0.95, 0.04, dx + 0.68, GY + 0.62, z1 + 0.5);
        B('glow', Math.min(w * 0.5, 3.2), 0.1, 0.05, cx - w * 0.12, GY + h - 0.2, z1 + 0.04);
        aoPatch(w + 1.3, d + 1.3, cx, cz, 1);
    }
    campusBlock(-17, -8, -13.8, -11.0, 3.6, 0);        // perpustakaan
    campusBlock(-6.5, 2, -13.8, -11.0, 2.8, 1);        // aula kuliah
    campusBlock(4, 12.5, -13.8, -11.0, 2.4, 2);        // student center
    campusBlock(-17.7, -15.0, -8.6, -1.2, 2.8, 1);     // asrama (sisi kiri)
    campusBlock(-17.7, -15.0, 2.2, 8.6, 2.2, 0);       // lab annex (sisi kiri depan)

    // tiang bendera (berkibar)
    Cy('metal', 0.04, 3.6, -10.3, GY + 1.8, -8.7, true);
    place(G.sph, 'gold', -10.3, GY + 3.62, -8.7, 0.07, 0.07, 0.07);
    var flag = place(G.box, 'red', -9.85, GY + 3.25, -8.7, 0.9, 0.5, 0.03, false, true);
    animFns.push(function (sec) { flag.rotation.y = Math.sin(sec * 2.2) * 0.12; flag.scale.x = 0.9 + Math.sin(sec * 3.1) * 0.03; });

    // ============================================================
    // TAMAN: semak, bunga, bangku, lampu, gerbang, air mancur
    // ============================================================
    var hedges = [[-7.7, 8.25, 4.6, 0.7], [1.7, 8.25, 4.6, 0.7], [6.7, 8.25, 4.6, 0.7], [-12.2, 4.8, 0.7, 2.2]];
    hedges.forEach(function (hd) {
        Bt(hedgeMat, hd[2], 0.34, hd[3], 1.2, hd[0], GY + 0.17, hd[1]);
        place(G.ico1, hedgeMat, hd[0], GY + 0.36, hd[1], hd[2] * 0.5, 0.1, hd[3] * 0.56);    // punggung semak membulat
    });
    var dummy = new THREE.Object3D();
    if (!LO) {                                                                  // petak bunga di depan semak
        var fl = [];
        hedges.forEach(function (hd, hi) {
            var along = hi === 3 ? hd[3] : hd[2], n = Math.floor(along / 0.24), k;
            for (k = 0; k < n; k++) {
                var t = -along / 2 + (k + 0.5) * (along / n) + (rnd() - 0.5) * 0.08;
                fl.push(hi === 3 ? [hd[0] + 0.5 + rnd() * 0.1, hd[1] + t] : [hd[0] + t, hd[1] + 0.52 + rnd() * 0.1]);
            }
        });
        var fm = new THREE.InstancedMesh(G.sph, flowerMat, fl.length);
        var fcol = [0xf472b6, 0xfacc15, 0xffffff, 0xfb7185, 0xc084fc], cc = new THREE.Color();
        fl.forEach(function (p, i) {
            var s = 0.05 + rnd() * 0.035;
            dummy.position.set(p[0], GY + 0.07 + rnd() * 0.04, p[1]);
            dummy.scale.set(s, s * 0.85, s); dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
            fm.setMatrixAt(i, dummy.matrix);
            cc.setHex(fcol[Math.floor(rnd() * fcol.length)]); fm.setColorAt(i, cc);
        });
        fm.instanceMatrix.needsUpdate = true; if (fm.instanceColor) fm.instanceColor.needsUpdate = true;
        fm.receiveShadow = shadowsOn; group.add(fm);
    }

    function lampPost(x, z) {
        Cy('dark', 0.09, 0.12, x, GY + 0.06, z);
        Cy('metal', 0.035, 1.55, x, GY + 0.83, z, true);
        B('metal', 0.2, 0.04, 0.04, x, GY + 1.6, z);
        place(G.sph, lampHeadMat, x, GY + 1.55, z, 0.11, 0.13, 0.11);
        place(G.cone, 'dark', x, GY + 1.7, z, 0.15, 0.1, 0.15);
        if (!LO) {
            var sp = new THREE.Sprite(haloMat); sp.position.set(x, GY + 1.55, z); sp.scale.set(1.5, 1.5, 1); sp.visible = false;
            group.add(sp); haloSprites.push(sp);
            var pl = new THREE.Mesh(G.plane, poolMat); pl.scale.set(3.2, 3.2, 1); pl.rotation.x = -Math.PI / 2;
            pl.position.set(x, GY + 0.1, z); pl.renderOrder = 2; pl.visible = false;
            group.add(pl); poolMeshes.push(pl);
        }
    }
    lampPost(-4.9, 7.9); lampPost(-1.1, 7.9); lampPost(-4.9, 12.7); lampPost(-1.1, 12.7);
    lampPost(8.5, 7.4); lampPost(-11.4, 7.4);

    function bench(x, z, rotY) {
        var g = new THREE.Group();
        g.position.set(x, GY, z); g.rotation.y = rotY || 0;
        group.add(g);
        function part(m, w, h, d, r, bx, by, bz) { var p = props.rb(g, m, w, h, d, r, bx, by, bz); p.castShadow = false; p.receiveShadow = shadowsOn; }
        var i;
        for (i = 0; i < 3; i++) part('wood', 1.4, 0.035, 0.11, 0.012, 0, 0.37, -0.12 + i * 0.12);
        for (i = 0; i < 3; i++) part('wood', 1.4, 0.07, 0.03, 0.01, 0, 0.47 + i * 0.09, -0.19);
        part('dark', 0.05, 0.38, 0.34, 0.012, -0.6, 0.19, 0);
        part('dark', 0.05, 0.38, 0.34, 0.012, 0.6, 0.19, 0);
        part('dark', 0.05, 0.05, 0.3, 0.012, -0.6, 0.45, -0.02);
        part('dark', 0.05, 0.05, 0.3, 0.012, 0.6, 0.45, -0.02);
        aoPatch(1.7, 0.7, x, z, 1);
    }
    bench(-7.7, 9.2, 0); bench(1.7, 9.2, 0); bench(5.6, 9.2, 0); bench(7.8, 9.2, 0);
    // tempat sampah & bollard jalan masuk
    [[-9.3, 9.2], [3.6, 9.2]].forEach(function (p) {
        Cy('dark', 0.16, 0.5, p[0], GY + 0.25, p[1], true);
        Cy('metal', 0.18, 0.05, p[0], GY + 0.52, p[1]);
    });
    for (var bl = 0; bl < 5; bl++) {
        Cy('metal', 0.05, 0.42, -4.35, GY + 0.21, 8.2 + bl * 1.05);
        Cy('metal', 0.05, 0.42, -1.65, GY + 0.21, 8.2 + bl * 1.05);
    }
    // gerbang depan: dua tiang + tutup + lentera
    [-4.7, -1.3].forEach(function (gx) {
        B('curb', 0.5, 1.1, 0.5, gx, GY + 0.55, 13.2, true);
        B('gold', 0.4, 0.08, 0.4, gx, GY + 1.14, 13.2);
        place(G.sph, lampHeadMat, gx, GY + 1.3, 13.2, 0.1, 0.12, 0.1);
        place(G.cone, 'dark', gx, GY + 1.42, 13.2, 0.14, 0.1, 0.14);
    });

    // air mancur bertingkat (kolam, air beriak, pancuran)
    var FX = 11.0, FZ = 8.0, jets = [];
    Cy('curb', 1.25, 0.34, FX, GY + 0.17, FZ, true);
    place(G.cyl, waterMat, FX, GY + 0.3, FZ, 1.05, 0.1, 1.05);
    Cy('curb', 0.14, 0.7, FX, GY + 0.35, FZ, true);
    Cy('curb', 0.5, 0.08, FX, GY + 0.62, FZ);
    place(G.cyl, waterMat, FX, GY + 0.67, FZ, 0.42, 0.05, 0.42);
    Cy('curb', 0.07, 0.4, FX, GY + 0.8, FZ);
    if (!LO) {
        var jm = reg(new THREE.MeshStandardMaterial({ color: 0xf4fbff, transparent: true, opacity: 0.85, roughness: 0.2 }));
        for (var jn = 0; jn < 7; jn++) {
            var jp = place(G.sph, jm, FX, GY + 1.0, FZ, 0.045, 0.045, 0.045, false, true);
            jets.push({ m: jp, a: (jn / 7) * 6.2832, ph: jn / 7 });
        }
        animFns.push(function (sec) {
            for (var q = 0; q < jets.length; q++) {
                var t = (sec * 0.9 + jets[q].ph) % 1, rr = 0.42 * t, yy = 1.0 + Math.sin(t * Math.PI) * 0.32 - t * t * 0.22;
                jets[q].m.position.set(FX + Math.cos(jets[q].a) * rr, GY + yy, FZ + Math.sin(jets[q].a) * rr);
            }
        });
    }
    animFns.push(function (sec) { waterTex.offset.set((sec * 0.012) % 1, (sec * 0.008) % 1); });

    // ============================================================
    // POHON (INSTANCED): planter plaza + baris tepi halaman
    // ============================================================
    var trunks = [], blobs = [];
    function addTree(x, z, s, y0) {
        var base = y0 === undefined ? GY : y0;
        trunks.push([x, base + 0.31 * s, z, 0.1 * s, 0.62 * s]);
        var n = LO ? 3 : 6, i;
        for (i = 0; i < n; i++) {
            var a = rnd() * 6.2832, rd = (i === 0 ? 0 : 0.2 + rnd() * 0.18) * s, bs = (i === 0 ? 0.52 : 0.27 + rnd() * 0.15) * s;
            blobs.push([x + Math.cos(a) * rd, base + (0.84 + (i === 0 ? 0 : 0.12 + rnd() * 0.36)) * s, z + Math.sin(a) * rd, bs, rnd()]);
        }
    }
    [[-11.8, -8.2], [11.8, -8.2], [-11.8, 8.2]].forEach(function (c) {
        Cy('curb', 0.62, 0.3, c[0], PZ + 0.15, c[1], true);                      // planter
        addTree(c[0], c[1], 1.15, PZ + 0.28);
    });
    var ti;
    for (ti = 0; ti < 9; ti++) { var tx0 = -16 + ti * 3.6; if (Math.abs(tx0 + 3) < 2.4) continue; addTree(tx0, 13.4, 0.9 + rnd() * 0.3); }
    for (ti = 0; ti < 6; ti++) addTree(16.4, -9 + ti * 3.4, 0.85 + rnd() * 0.3);
    for (ti = 0; ti < 5; ti++) addTree(-12 + ti * 3.3, -9.6 + (ti % 2) * 0.2, 0.9 + rnd() * 0.25);
    (function () {
        var tm = new THREE.InstancedMesh(G.cyl, treeTrunkMat, trunks.length);
        trunks.forEach(function (t, i) { dummy.position.set(t[0], t[1], t[2]); dummy.scale.set(t[3], t[4], t[3]); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); tm.setMatrixAt(i, dummy.matrix); });
        tm.instanceMatrix.needsUpdate = true; tm.castShadow = HI && shadowsOn; tm.receiveShadow = shadowsOn; group.add(tm);
        var lm = new THREE.InstancedMesh(G.ico1, treeLeafMat, blobs.length), cc = new THREE.Color();
        blobs.forEach(function (b, i) {
            dummy.position.set(b[0], b[1], b[2]); dummy.scale.set(b[3], b[3] * 0.92, b[3]); dummy.rotation.set(0, b[4] * 6.28, 0); dummy.updateMatrix();
            lm.setMatrixAt(i, dummy.matrix);
            if (b[4] < 0.35) cc.setRGB(1.2, 1.12, 0.88); else cc.setRGB(0.86 + b[4] * 0.16, 0.92 + b[4] * 0.1, 0.86 + b[4] * 0.12);   // variasi warna daun
            lm.setColorAt(i, cc);
        });
        lm.instanceMatrix.needsUpdate = true; if (lm.instanceColor) lm.instanceColor.needsUpdate = true;
        lm.castShadow = HI && shadowsOn; lm.receiveShadow = shadowsOn; group.add(lm);
    })();

    // ============================================================
    // KANTOR: dinding luar, jendela berkaca, plint, ambang, lis atas
    // ============================================================
    (function () {
        var x0 = FLOOR.x0, x1 = FLOOR.x1, z0 = FLOOR.z0, z1 = FLOOR.z1, i0;
        Bt(plasterMat, x1 - x0 + 0.24, 2.4, 0.24, 2, 0, 1.2, z0, true);                        // dinding belakang
        Bt(plasterMat, 0.24, 2.4, z1 - z0, 2, x0, 1.2, (z0 + z1) / 2, true);                   // dinding kiri
        // dinding depan rendah dengan celah pintu utama (x -3.5 .. -2.5) + tutup
        var fw1 = (-3.5) - (x0 - 0.12), fw2 = (x1 + 0.12) - (-2.5);
        Bt(plasterMat, fw1, 0.35, 0.22, 2, ((x0 - 0.12) + (-3.5)) / 2, 0.175, z1 + 0.01, true);
        Bt(plasterMat, fw2, 0.35, 0.22, 2, ((-2.5) + (x1 + 0.12)) / 2, 0.175, z1 + 0.01, true);
        B('wallTop', fw1 + 0.06, 0.04, 0.3, ((x0 - 0.12) + (-3.5)) / 2, 0.37, z1 + 0.01);
        B('wallTop', fw2 + 0.06, 0.04, 0.3, ((-2.5) + (x1 + 0.12)) / 2, 0.37, z1 + 0.01);
        B('metal', 0.1, 0.9, 0.1, -3.55, 0.45, z1 + 0.02, true);
        B('metal', 0.1, 0.9, 0.1, -2.45, 0.45, z1 + 0.02, true);
        Bt(plasterMat, 0.22, 0.35, z1 - z0, 2, x1 + 0.01, 0.175, (z0 + z1) / 2, true);         // dinding kanan rendah
        B('wallTop', 0.3, 0.04, z1 - z0 + 0.06, x1 + 0.01, 0.37, (z0 + z1) / 2);
        // plint (skirting) sisi dalam dinding tinggi
        B('wallTop', x1 - x0, 0.12, 0.04, 0, 0.06, z0 + 0.14);
        B('wallTop', 0.04, 0.12, z1 - z0, x0 + 0.14, 0.06, (z0 + z1) / 2);
        // jendela dinding belakang & kiri (posisi sama dengan sebelumnya)
        for (i0 = 0; i0 < 11; i0++) {
            var wxx = -8.2 + i0 * 1.64;
            B('wallTop', 1.32, 0.96, 0.04, wxx, 1.55, z0 + 0.11);
            B(glassWinMat, 1.15, 0.8, 0.06, wxx, 1.55, z0 + 0.13);
            B('wallTop', 1.36, 0.06, 0.14, wxx, 1.05, z0 + 0.17);
            B('wallTop', 1.4, 0.05, 0.1, wxx, 2.06, z0 + 0.15);                                 // lintel di atas jendela
        }
        for (i0 = 0; i0 < 7; i0++) {
            if (i0 === 4 || i0 === 5) continue;                                                 // ruang untuk papan nama perusahaan
            var wzz = -5.1 + i0 * 1.7;
            B('wallTop', 0.04, 0.96, 1.32, x0 + 0.11, 1.55, wzz);
            B(glassWinMat, 0.06, 0.8, 1.15, x0 + 0.13, 1.55, wzz);
            B('wallTop', 0.14, 0.06, 1.36, x0 + 0.17, 1.05, wzz);
            B('wallTop', 0.1, 0.05, 1.4, x0 + 0.15, 2.06, wzz);
        }
        // lis atas (cornice) di dinding tinggi
        B('wallTop', x1 - x0 + 0.5, 0.12, 0.4, 0, 2.46, z0);
        B('wallTop', 0.4, 0.12, z1 - z0 + 0.1, x0, 2.46, 0);
    })();

    // ============================================================
    // TEMA, ANIMASI, DISPOSE
    // ============================================================
    function applyTheme(isDark, winHex) {
        dark = !!isDark;
        if (typeof winHex === 'number') winHexNow = winHex;
        function sync(m, key, f) { if (M[key]) m.color.setHex(f ? tintHex(M[key].color.getHex(), f) : M[key].color.getHex()); }
        sync(grassMat, 'ground'); sync(grass2Mat, 'grass2'); sync(paverMat, 'paving'); sync(roadMat, 'path');
        sync(plasterMat, 'wall'); sync(hedgeMat, 'hedge'); sync(treeLeafMat, 'leaf'); sync(treeTrunkMat, 'trunk');
        sync(soilBotMat, 'soil', -0.15); sync(waterMat, 'shallow');
        [0, 1, 2].forEach(function (i) { sync(facadeMats[i], 'bldg', [0, 0.05, -0.06][i]); });
        glassWinMat.color.setHex(winHexNow);
        var key = dark + '|' + winHexNow + '|' + (M.ground ? M.ground.color.getHex() : 0);
        if (key !== drawnKey) { drawnKey = key; facade.draw(winHexNow); drawStrata(); }
        // malam: jendela & lampu menyala
        for (var i = 0; i < facadeMats.length; i++) facadeMats[i].emissiveIntensity = dark ? 1.15 : 0;
        glassWinMat.emissiveIntensity = dark ? 0.3 : 0;
        lampHeadMat.emissiveIntensity = dark ? 1.4 : 0.25;
        waterMat.emissiveIntensity = dark ? 0.26 : 0.1;
        haloMat.opacity = dark ? 0.55 : 0; poolMat.opacity = dark ? 0.32 : 0;
        for (i = 0; i < haloSprites.length; i++) haloSprites[i].visible = dark;
        for (i = 0; i < poolMeshes.length; i++) poolMeshes[i].visible = dark;
    }
    applyTheme(false, 0x8fb4e8);

    return {
        applyTheme: applyTheme,
        tick: function (sec) { for (var i = 0; i < animFns.length; i++) animFns[i](sec); },
        dispose: function () {
            shell.remove(group);
            geos.forEach(function (g) { g.dispose(); });
            mats.forEach(function (m) { m.dispose(); });
            texs.forEach(function (t) { t.dispose(); });
            geos = []; mats = []; texs = []; animFns = []; haloSprites = []; poolMeshes = [];
        }
    };
}
