// FILE: src/ui/office/OfficeProps.js  (BARU — v2027.80 "Realistic Office")
// Pustaka visual untuk Office 3D Map: tekstur prosedural (lantai, kayu, kain, layar komputer, layar ponsel),
// geometri kotak membulat, model orang beranatomi (pinggul-badan-leher-kepala, lengan 2 ruas, kaki 2 ruas + sepatu,
// wajah, rambut, aksesori) dengan pose berbasis IK, serta perangkat komputer & perabot yang lebih nyata
// (monitor/CRT, laptop, keyboard, mouse, PC tower, kursi kantor, meja berlaci, tanaman, ponsel, lampu meja, dst).
//
// Tidak memuat logika game. Semua bentuk dibuat dari primitif Three.js (tanpa file model/gambar), tekstur digambar
// dengan canvas 2D sekali lalu dipakai ulang. Detail otomatis menyesuaikan tier kualitas (low | medium | high).
//
// Konvensi: orang menghadap -z, layar monitor menghadap +z, satuan sama dengan OfficeScene (permukaan meja = 0.655).

export function createOfficeProps(THREE, env) {
    var look = env.look || { tier: 'medium', shadows: true };
    var S = env.state;                 // { era, dark, accent } — dibaca saat dipanggil (selalu terbaru)
    var M = env.M;                     // material bersama milik scene (nama -> material)
    var G = env.G;                     // geometri bersama milik scene
    var renderer = env.renderer;
    var DETAIL = look.tier === 'high' ? 2 : (look.tier === 'medium' ? 1 : 0);
    var HALF_PI = Math.PI / 2;
    var aniso = 4;
    try { aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 4); } catch (e) {}

    var texList = [], matList = [], geoCache = {};

    // ============================================================
    // UTIL
    // ============================================================
    function rng(seed) {
        var s = (seed >>> 0) || 1;
        return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
    }
    function reg(m) { matList.push(m); return m; }
    function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    function toTex(c, repeat, linear) {
        var t = new THREE.CanvasTexture(c);
        if (!linear) t.colorSpace = THREE.SRGBColorSpace;
        if (repeat) { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; }
        t.anisotropy = aniso;
        texList.push(t);
        return t;
    }
    function grey(v) { v = Math.max(0, Math.min(255, Math.round(v))); return 'rgb(' + v + ',' + v + ',' + v + ')'; }
    function matOf(m) { return typeof m === 'string' ? M[m] : m; }
    function hex6(n) { return '#' + ('000000' + (n >>> 0).toString(16)).slice(-6); }
    function noiseFill(ctx, w, h, lo, hi, seed) {
        var id = ctx.createImageData(w, h), d = id.data, r = rng(seed), i, v;
        for (i = 0; i < d.length; i += 4) { v = lo + r() * (hi - lo); d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255; }
        ctx.putImageData(id, 0, 0);
    }
    function rrPath(ctx, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
    function fillRR(ctx, x, y, w, h, r, fill) { rrPath(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); }

    // ============================================================
    // GEOMETRI
    // ============================================================
    // Kotak dengan tepi membulat (kotak dipecah, titik didorong ke permukaan "kotak dalam + radius").
    // UV memakai ukuran dunia (1 m = 1 ubin tekstur) supaya serat kayu/kain selalu berskala sama.
    function rbox(w, h, d, r) {
        var rr = Math.min(r, w * 0.49, h * 0.49, d * 0.49);
        if (!(rr > 0.002)) return G.box;      // terlalu kecil untuk dibulatkan: pakai kotak biasa (skala 1 -> panggil lewat mkBox)
        var key = 'rb|' + [w, h, d, rr].map(function (v) { return v.toFixed(4); }).join('|');
        if (geoCache[key]) return geoCache[key];
        var m = DETAIL >= 2 ? 3 : 2, n = 2 * m + 1;
        var bg = new THREE.BoxGeometry(1, 1, 1, n, n, n);
        var pos = bg.attributes.position, nor = bg.attributes.normal, uv = bg.attributes.uv;
        var hx = w / 2, hy = h / 2, hz = d / 2, ex = hx - rr, ey = hy - rr, ez = hz - rr;
        function axisVal(p, e) {            // p: -0.5..0.5 (kisi seragam) -> koordinat yang mengumpul di sudut
            var i = Math.round((p + 0.5) * n), k = i <= m ? i : n - i;
            var o = rr * Math.tan((Math.PI / 4) * (m - k) / m);
            return (i <= m ? -1 : 1) * (e + o);
        }
        for (var i = 0; i < pos.count; i++) {
            var fx = nor.getX(i), fy = nor.getY(i);
            var vx = axisVal(pos.getX(i), ex), vy = axisVal(pos.getY(i), ey), vz = axisVal(pos.getZ(i), ez);
            if (Math.abs(fx) > 0.5) uv.setXY(i, vz + hz, vy + hy);
            else if (Math.abs(fy) > 0.5) uv.setXY(i, vx + hx, vz + hz);
            else uv.setXY(i, vx + hx, vy + hy);
            var cx = Math.max(-ex, Math.min(ex, vx)), cy = Math.max(-ey, Math.min(ey, vy)), cz = Math.max(-ez, Math.min(ez, vz));
            var dx = vx - cx, dy = vy - cy, dz = vz - cz, dl = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
            dx /= dl; dy /= dl; dz /= dl;
            pos.setXYZ(i, cx + dx * rr, cy + dy * rr, cz + dz * rr);
            nor.setXYZ(i, dx, dy, dz);
        }
        pos.needsUpdate = true; nor.needsUpdate = true; uv.needsUpdate = true;
        bg.computeBoundingSphere(); bg.computeBoundingBox();
        geoCache[key] = bg;
        return bg;
    }
    function capsuleG(r, len) {
        var key = 'cp|' + r.toFixed(4) + '|' + len.toFixed(4);
        if (!geoCache[key]) geoCache[key] = new THREE.CapsuleGeometry(r, len, DETAIL >= 1 ? 4 : 3, DETAIL >= 1 ? 10 : 8);
        return geoCache[key];
    }
    function cached(key, make) { if (!geoCache[key]) geoCache[key] = make(); return geoCache[key]; }
    var hairCapG = null;

    // Mesh + bayangan. Benda kecil tidak melempar bayangan (hemat shadow pass).
    function mk(parent, geo, mat, x, y, z, sx, sy, sz) {
        var mm = matOf(mat);
        var m = new THREE.Mesh(geo, mm);
        if (sx !== undefined) m.scale.set(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz);
        m.position.set(x || 0, y || 0, z || 0);
        m.castShadow = !!look.shadows && !mm.transparent && !mm.isMeshBasicMaterial;
        m.receiveShadow = !!look.shadows;
        parent.add(m);
        return m;
    }
    function small(m) { m.castShadow = false; return m; }
    // kotak membulat dengan ukuran nyata (skala 1)
    function rb(parent, mat, w, h, d, r, x, y, z) {
        var geo = rbox(w, h, d, r);
        if (geo === G.box) return mk(parent, G.box, mat, x, y, z, w, h, d);
        return mk(parent, geo, mat, x, y, z);
    }
    function cyl(parent, mat, r, h, x, y, z) { return mk(parent, G.cyl, mat, x, y, z, r, h, r); }
    function sph(parent, mat, r, x, y, z) { return mk(parent, G.sph, mat, x, y, z, r, r, r); }
    function rot(m, x, y, z) { m.rotation.set(x || 0, y || 0, z || 0); return m; }

    // ============================================================
    // TEKSTUR: radial lembut (bayangan kontak / cahaya)
    // ============================================================
    var radialTex = (function () {
        var c = mkCanvas(128, 128), ctx = c.getContext('2d');
        var g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
        return toTex(c, false);
    })();
    var aoMat = reg(new THREE.MeshBasicMaterial({ map: radialTex, color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false }));
    var glowMat = reg(new THREE.MeshBasicMaterial({ map: radialTex, color: 0x8fc2ff, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending }));
    // bayangan kontak lembut (di bawah meja / kursi / perabot)
    function aoPlane(parent, w, d, x, z, k) {
        var m = new THREE.Mesh(G.plane, aoMat);
        m.scale.set(w * 1.35, d * 1.35, 1);
        m.position.set(x, 0.028, z);
        m.rotation.x = -HALF_PI;
        m.renderOrder = 1;
        m.userData.k = k || 1;
        parent.add(m);
        return m;
    }

    // ============================================================
    // TEKSTUR: lantai per ruangan (abu-abu terang; warna diatur material)
    // ============================================================
    var floorBase = {};
    function floorCanvas(type) {
        if (floorBase[type]) return floorBase[type];
        var S2 = 256, c = mkCanvas(S2, S2), ctx = c.getContext('2d'), r = rng(type.length * 977 + type.charCodeAt(0)), i, j, k;
        if (type === 'wood') {
            var planks = 5, ph = S2 / planks;
            for (i = 0; i < planks; i++) {
                ctx.fillStyle = grey(212 + r() * 38); ctx.fillRect(0, i * ph, S2, ph);
                for (k = 0; k < 16; k++) {            // serat kayu
                    var gy = i * ph + r() * ph, cyc = 1 + Math.floor(r() * 3), amp = 0.6 + r() * 1.4, phs = r() * 6.28;
                    ctx.strokeStyle = 'rgba(70,55,40,' + (0.05 + r() * 0.11).toFixed(3) + ')';
                    ctx.lineWidth = 0.6 + r() * 1.1;
                    ctx.beginPath();
                    for (j = 0; j <= S2; j += 8) { var yy = gy + Math.sin(j / S2 * 6.2832 * cyc + phs) * amp; if (j === 0) ctx.moveTo(j, yy); else ctx.lineTo(j, yy); }
                    ctx.stroke();
                }
                var jx = r() * S2;                       // sambungan papan (selang-seling)
                ctx.fillStyle = 'rgba(45,35,28,0.55)'; ctx.fillRect(jx, i * ph, 1.6, ph);
                ctx.fillStyle = 'rgba(35,28,22,0.7)'; ctx.fillRect(0, i * ph + ph - 1.6, S2, 1.6);
            }
        } else if (type === 'tile') {
            var tn = 2, ts = S2 / tn;
            for (i = 0; i < tn; i++) for (j = 0; j < tn; j++) {
                ctx.fillStyle = grey(232 + r() * 20); ctx.fillRect(j * ts, i * ts, ts, ts);
                for (k = 0; k < 70; k++) { ctx.fillStyle = 'rgba(90,100,115,' + (0.03 + r() * 0.06).toFixed(3) + ')'; ctx.fillRect(j * ts + r() * ts, i * ts + r() * ts, 1 + r() * 2, 1 + r() * 2); }
                ctx.strokeStyle = 'rgba(120,130,150,0.07)'; ctx.lineWidth = 1.2;       // urat marmer samar
                ctx.beginPath(); ctx.moveTo(j * ts + r() * ts, i * ts); ctx.bezierCurveTo(j * ts + r() * ts, i * ts + ts * 0.3, j * ts + r() * ts, i * ts + ts * 0.7, j * ts + r() * ts, i * ts + ts); ctx.stroke();
            }
            ctx.fillStyle = 'rgba(60,66,78,0.62)';
            for (i = 0; i < tn; i++) { ctx.fillRect(0, i * ts, S2, 2.5); ctx.fillRect(i * ts, 0, 2.5, S2); }
        } else if (type === 'grid') {           // lantai ruang server: panel lantai berlubang
            var gn = 4, gs = S2 / gn;
            for (i = 0; i < gn; i++) for (j = 0; j < gn; j++) {
                ctx.fillStyle = grey(224 + r() * 18); ctx.fillRect(j * gs, i * gs, gs, gs);
                ctx.fillStyle = 'rgba(60,68,80,0.35)';
                for (k = 0; k < 16; k++) { ctx.beginPath(); ctx.arc(j * gs + 12 + (k % 4) * 13, i * gs + 12 + Math.floor(k / 4) * 13, 2.2, 0, 6.2832); ctx.fill(); }
            }
            ctx.fillStyle = 'rgba(45,52,64,0.7)';
            for (i = 0; i < gn; i++) { ctx.fillRect(0, i * gs, S2, 2); ctx.fillRect(i * gs, 0, 2, S2); }
        } else if (type === 'diag') {           // lantai keuangan: ubin berlian
            ctx.fillStyle = grey(236); ctx.fillRect(0, 0, S2, S2);
            var ds = S2 / 2;
            for (i = -1; i < 3; i++) for (j = -1; j < 3; j++) {
                if ((i + j) % 2 === 0) continue;
                ctx.fillStyle = grey(214 + r() * 8);
                ctx.beginPath(); ctx.moveTo(j * ds + ds / 2, i * ds); ctx.lineTo(j * ds + ds, i * ds + ds / 2); ctx.lineTo(j * ds + ds / 2, i * ds + ds); ctx.lineTo(j * ds, i * ds + ds / 2); ctx.closePath(); ctx.fill();
            }
            ctx.strokeStyle = 'rgba(70,70,80,0.45)'; ctx.lineWidth = 1.6;
            for (i = -2; i < 4; i++) { ctx.beginPath(); ctx.moveTo(i * ds / 2 * 1, 0); ctx.lineTo(i * ds / 2 + S2, S2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i * ds / 2 + S2, 0); ctx.lineTo(i * ds / 2, S2); ctx.stroke(); }
        } else if (type === 'dots') {           // beton poles (studio desain)
            noiseFill(ctx, S2, S2, 224, 246, 31);
            for (k = 0; k < 14; k++) { ctx.fillStyle = 'rgba(110,115,125,' + (0.03 + r() * 0.05).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(r() * S2, r() * S2, 14 + r() * 30, 0, 6.2832); ctx.fill(); }
            ctx.strokeStyle = 'rgba(70,75,85,0.4)'; ctx.lineWidth = 1.5; ctx.strokeRect(0.5, 0.5, S2 - 1, S2 - 1);
        } else {                                  // karpet
            noiseFill(ctx, S2, S2, 196, 244, 57);
            ctx.strokeStyle = 'rgba(80,90,110,0.07)'; ctx.lineWidth = 1;
            for (i = -S2; i < S2; i += 6) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + S2, S2); ctx.stroke(); }
            for (i = 0; i < S2; i += 6) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - S2, S2); ctx.stroke(); }
        }
        floorBase[type] = c;
        return c;
    }
    var FLOOR_PROPS = {
        wood: { rough: 0.5, bump: 0.35 }, tile: { rough: 0.22, bump: 0.25 }, grid: { rough: 0.45, bump: 0.3 },
        diag: { rough: 0.28, bump: 0.25 }, dots: { rough: 0.55, bump: 0.15 }, carpet: { rough: 0.97, bump: 0.5 }
    };
    // -> { map, rough, bump } ; satu tekstur per ruangan (ulangan mengikuti ukuran ruangan)
    function floorSurface(type, w, d) {
        var t = new THREE.CanvasTexture(floorCanvas(type));
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = aniso;
        t.repeat.set(Math.max(1, w / 2), Math.max(1, d / 2));
        texList.push(t);
        var p = FLOOR_PROPS[type] || FLOOR_PROPS.carpet;
        return { map: t, rough: p.rough, bump: p.bump };
    }

    // ============================================================
    // TEKSTUR: kayu & kain untuk perabot
    // ============================================================
    var woodTex = (function () {
        var S2 = 256, c = mkCanvas(S2, S2), ctx = c.getContext('2d'), r = rng(4242), i, j;
        ctx.fillStyle = grey(236); ctx.fillRect(0, 0, S2, S2);
        for (i = 0; i < 46; i++) {
            var y0 = r() * S2, cyc = 1 + Math.floor(r() * 2), amp = 1 + r() * 4, ph = r() * 6.28;
            ctx.strokeStyle = 'rgba(95,70,45,' + (0.05 + r() * 0.12).toFixed(3) + ')'; ctx.lineWidth = 0.6 + r() * 1.6;
            ctx.beginPath();
            for (j = 0; j <= S2; j += 8) { var yy = y0 + Math.sin(j / S2 * 6.2832 * cyc + ph) * amp; if (j === 0) ctx.moveTo(j, yy); else ctx.lineTo(j, yy); }
            ctx.stroke();
        }
        for (i = 0; i < 3; i++) {                       // mata kayu
            var kx = r() * S2, ky = r() * S2;
            ctx.strokeStyle = 'rgba(85,60,38,0.16)'; ctx.lineWidth = 1;
            for (j = 1; j < 4; j++) { ctx.beginPath(); ctx.ellipse(kx, ky, 4 + j * 5, 2 + j * 2, 0, 0, 6.2832); ctx.stroke(); }
        }
        return toTex(c, true);
    })();
    var fabricTex = (function () {
        var S2 = 128, c = mkCanvas(S2, S2), ctx = c.getContext('2d'), i;
        noiseFill(ctx, S2, S2, 214, 250, 77);
        ctx.strokeStyle = 'rgba(40,50,70,0.10)'; ctx.lineWidth = 1;
        for (i = 0; i < S2; i += 4) { ctx.beginPath(); ctx.moveTo(0, i + 0.5); ctx.lineTo(S2, i + 0.5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i + 0.5, 0); ctx.lineTo(i + 0.5, S2); ctx.stroke(); }
        var t = toTex(c, true);
        t.repeat.set(2, 2);
        return t;
    })();
    var keyTex = (function () {
        var W = 160, H = 60, c = mkCanvas(W, H), ctx = c.getContext('2d'), col, row;
        ctx.fillStyle = '#9aa1ad'; ctx.fillRect(0, 0, W, H);
        var rows = [14, 13, 13, 12, 7];
        for (row = 0; row < rows.length; row++) {
            var n = rows[row], kw = (W - 8) / n;
            for (col = 0; col < n; col++) {
                if (row === 4 && col > 0 && col < n - 1) continue;
                var kx = 4 + col * kw, ky = 4 + row * 10.4;
                fillRR(ctx, kx + 0.8, ky + 0.8, kw - 1.6, 8.4, 1.6, '#eef0f4');
                ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(kx + 1.6, ky + 1.2, kw - 3.2, 1);
            }
            if (row === 4) fillRR(ctx, 4 + kw * 2.2, 4 + row * 10.4 + 0.8, kw * (n - 4.4) + kw * 3.2, 8.4, 1.6, '#eef0f4');
        }
        return toTex(c, false);
    })();

    // ============================================================
    // TEKSTUR: layar komputer (per jenis & era)
    // ============================================================
    var screenTexCache = {}, screenMatCache = {};
    function drawEra0(ctx, W, H, r) {            // LCD monokrom hijau
        ctx.fillStyle = '#a3b58d'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#2e3d29';
        ctx.fillRect(0, 0, W, 12);
        for (var y = 20; y < H - 6; y += 13) { var x = 8; while (x < W - 30) { var w = 8 + r() * 36; ctx.fillRect(x, y, w, 6); x += w + 6; if (r() < 0.18) break; } }
        ctx.fillStyle = 'rgba(46,61,41,0.1)'; for (y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    }
    function drawEra1(ctx, W, H, r) {            // desktop TFT warna sederhana
        var g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#2f6db3'); g.addColorStop(1, '#79b3e6');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        fillRR(ctx, 40, 26, 150, 100, 3, '#e9eef5');
        ctx.fillStyle = '#1e4a8a'; ctx.fillRect(40, 26, 150, 12);
        ctx.fillStyle = '#9aa7b8'; for (var i = 0; i < 6; i++) ctx.fillRect(50, 48 + i * 11, 40 + r() * 80, 5);
        ctx.fillStyle = '#c9d2de'; ctx.fillRect(0, H - 12, W, 12); ctx.fillStyle = '#3c7d3c'; ctx.fillRect(2, H - 10, 22, 8);
        for (i = 0; i < 4; i++) { ctx.fillStyle = ['#f5c542', '#e55', '#5b5', '#fff'][i]; ctx.fillRect(10, 12 + i * 26, 16, 16); }
    }
    function drawCode(ctx, W, H, r) {
        ctx.fillStyle = '#0e1525'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#18233a'; ctx.fillRect(0, 0, W, 14);
        var dots = ['#ff5f57', '#febc2e', '#28c840'], i;
        for (i = 0; i < 3; i++) { ctx.fillStyle = dots[i]; ctx.beginPath(); ctx.arc(8 + i * 10, 7, 3, 0, 6.2832); ctx.fill(); }
        ctx.fillStyle = '#111a2e'; ctx.fillRect(0, 14, 50, H - 14);
        for (i = 0; i < 7; i++) { ctx.fillStyle = i === 1 ? '#2b3b5f' : '#1c2842'; ctx.fillRect(5, 22 + i * 12, 40, 7); }
        var cols = ['#7dd3fc', '#c4b5fd', '#86efac', '#fca5a5', '#fde68a', '#93a4c3'];
        for (var y = 22, row = 0; y < H - 8; y += 10, row++) {
            ctx.fillStyle = '#34456a'; ctx.fillRect(56, y, 4, 5);
            var x = 66 + (row % 4 === 1 || row % 4 === 2 ? 12 : 0) + (row % 7 === 5 ? 12 : 0), n = 1 + Math.floor(r() * 4);
            for (var s = 0; s < n && x < W - 20; s++) { var w = 10 + r() * 38; ctx.fillStyle = cols[Math.floor(r() * cols.length)]; ctx.fillRect(x, y, w, 5); x += w + 5; }
        }
        ctx.fillStyle = '#6aa2ff'; ctx.fillRect(0, H - 8, W, 8);
    }
    function drawDesign(ctx, W, H, r, acc) {
        ctx.fillStyle = '#e9edf5'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, 14);
        ctx.fillStyle = '#d6dbe6'; ctx.fillRect(0, 14, 24, H - 14);
        var i; for (i = 0; i < 7; i++) { ctx.fillStyle = i === 2 ? acc : '#aab3c4'; fillRR(ctx, 6, 22 + i * 18, 12, 12, 3, ctx.fillStyle); }
        fillRR(ctx, 60, 24, 96, 128, 6, '#ffffff');
        fillRR(ctx, 74, 32, 68, 104, 8, '#f1f3f9');
        fillRR(ctx, 80, 40, 56, 34, 6, acc);
        ctx.fillStyle = '#ffb703'; ctx.beginPath(); ctx.arc(96, 98, 10, 0, 6.2832); ctx.fill();
        ctx.fillStyle = '#8ecae6'; ctx.fillRect(112, 88, 22, 22);
        ctx.fillStyle = '#cfd5e2'; ctx.fillRect(80, 118, 50, 5); ctx.fillRect(80, 127, 34, 5);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(W - 62, 14, 62, H - 14);
        var sw = [acc, '#ffb703', '#8ecae6', '#fb7185', '#34d399', '#a78bfa', '#f97316', '#334155'];
        for (i = 0; i < 8; i++) { ctx.fillStyle = sw[i]; fillRR(ctx, W - 56 + (i % 4) * 14, 24 + Math.floor(i / 4) * 14, 11, 11, 3, sw[i]); }
        ctx.fillStyle = '#dfe4ee'; for (i = 0; i < 5; i++) ctx.fillRect(W - 56, 64 + i * 14, 20 + r() * 30, 5);
    }
    function drawChart(ctx, W, H, r, acc) {
        ctx.fillStyle = '#f4f7fb'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, 14);
        ctx.fillStyle = acc; ctx.fillRect(6, 4, 30, 6);
        var i;
        for (i = 0; i < 3; i++) { fillRR(ctx, 8 + i * 78, 22, 70, 34, 5, '#ffffff'); ctx.fillStyle = '#9aa6bb'; ctx.fillRect(14 + i * 78, 28, 28, 4); ctx.fillStyle = i === 1 ? '#22c55e' : acc; ctx.fillRect(14 + i * 78, 38, 40, 9); }
        fillRR(ctx, 8, 64, 150, 88, 5, '#ffffff');
        for (i = 0; i < 9; i++) { var h = 14 + r() * 56; ctx.fillStyle = i % 3 === 2 ? '#7dd3fc' : acc; ctx.fillRect(16 + i * 15, 144 - h, 9, h); }
        fillRR(ctx, 166, 64, 82, 88, 5, '#ffffff');
        ctx.strokeStyle = acc; ctx.lineWidth = 2; ctx.beginPath();
        for (i = 0; i < 8; i++) { var yy = 130 - r() * 52; if (i === 0) ctx.moveTo(174 + i * 10, yy); else ctx.lineTo(174 + i * 10, yy); }
        ctx.stroke();
        ctx.fillStyle = '#e8edf5'; ctx.beginPath(); ctx.arc(208, 110, 0, 0, 6.2832); ctx.fill();
    }
    function drawDoc(ctx, W, H, r, acc) {
        ctx.fillStyle = '#e7ebf2'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = acc; ctx.fillRect(0, 0, W, 14);
        fillRR(ctx, 40, 20, W - 80, H - 26, 3, '#ffffff');
        ctx.fillStyle = '#2d3a52'; ctx.fillRect(54, 32, 90, 8);
        ctx.fillStyle = '#c5cddb';
        for (var y = 50; y < H - 14; y += 10) { ctx.fillRect(54, y, (W - 108) * (0.55 + r() * 0.45), 4); if (r() < 0.2) y += 8; }
        ctx.fillStyle = '#dbeafe'; ctx.fillRect(54, H - 50, 60, 26);
    }
    function drawDash(ctx, W, H, r, acc) {
        ctx.fillStyle = '#0b1424'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#13213a'; ctx.fillRect(0, 0, W, 14);
        ctx.fillStyle = acc; ctx.fillRect(6, 4, 24, 6);
        var i;
        for (i = 0; i < 4; i++) { fillRR(ctx, 8 + i * 60, 22, 54, 28, 4, '#13213a'); ctx.fillStyle = i === 2 ? '#f87171' : '#34d399'; ctx.fillRect(14 + i * 60, 38, 30, 6); ctx.fillStyle = '#4a5f86'; ctx.fillRect(14 + i * 60, 28, 20, 4); }
        fillRR(ctx, 8, 58, 160, 94, 5, '#13213a');
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.beginPath();
        var y = 118; for (i = 0; i < 16; i++) { y += (r() - 0.46) * 16; y = Math.max(70, Math.min(140, y)); if (i === 0) ctx.moveTo(14 + i * 9.6, y); else ctx.lineTo(14 + i * 9.6, y); }
        ctx.stroke();
        ctx.strokeStyle = 'rgba(148,163,184,0.15)'; ctx.lineWidth = 1; for (i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(10, 70 + i * 20); ctx.lineTo(166, 70 + i * 20); ctx.stroke(); }
        fillRR(ctx, 176, 58, 72, 94, 5, '#13213a');
        ctx.lineWidth = 10; ctx.strokeStyle = acc; ctx.beginPath(); ctx.arc(212, 105, 22, 0, 4.2); ctx.stroke();
        ctx.strokeStyle = '#34d399'; ctx.beginPath(); ctx.arc(212, 105, 22, 4.3, 6.1); ctx.stroke();
    }
    function drawTerm(ctx, W, H, r) {
        ctx.fillStyle = '#06100a'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#4ade80';
        for (var y = 8; y < H - 8; y += 10) { var x = 8, n = 1 + Math.floor(r() * 3); for (var s = 0; s < n; s++) { var w = 14 + r() * 50; ctx.fillRect(x, y, w, 4); x += w + 6; } }
        ctx.fillRect(8, H - 14, 8, 6);
    }
    function screenTexture(kind) {
        var era = S.era, acc = hex6(S.accent), key = kind + '|' + (era <= 1 ? era : 2) + '|' + acc;
        if (screenTexCache[key]) return screenTexCache[key];
        var W = 256, H = 160, c = mkCanvas(W, H), ctx = c.getContext('2d'), r = rng(kind.length * 131 + (era <= 1 ? era : 7));
        if (era === 0) drawEra0(ctx, W, H, r);
        else if (era === 1) drawEra1(ctx, W, H, r);
        else if (kind === 'code') drawCode(ctx, W, H, r);
        else if (kind === 'design') drawDesign(ctx, W, H, r, acc);
        else if (kind === 'chart') drawChart(ctx, W, H, r, acc);
        else if (kind === 'dash') drawDash(ctx, W, H, r, acc);
        else if (kind === 'term') drawTerm(ctx, W, H, r);
        else drawDoc(ctx, W, H, r, acc);
        // kilau kaca samar
        var gl = ctx.createLinearGradient(0, 0, W, H); gl.addColorStop(0, 'rgba(255,255,255,0.10)'); gl.addColorStop(0.45, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
        var t = toTex(c, false);
        screenTexCache[key] = t;
        return t;
    }
    function screenMat(kind) {
        var t = screenTexture(kind);
        var key = t.uuid;
        if (!screenMatCache[key]) screenMatCache[key] = reg(new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
        return screenMatCache[key];
    }

    // ---- layar ponsel ----
    var phoneMatCache = {};
    function phoneScreenMat(hue) {
        var key = 'h' + (Math.round(hue / 15) * 15);
        if (phoneMatCache[key]) return phoneMatCache[key];
        var W = 128, H = 256, c = mkCanvas(W, H), ctx = c.getContext('2d'), i, j;
        var g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, 'hsl(' + hue + ',75%,58%)'); g.addColorStop(1, 'hsl(' + ((hue + 50) % 360) + ',70%,28%)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.font = '700 40px system-ui,Segoe UI,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('9:41', W / 2, 62);
        ctx.font = '600 11px system-ui,Segoe UI,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillText('Senin, 25 Oktober', W / 2, 80);
        for (i = 0; i < 4; i++) for (j = 0; j < 3; j++) {
            fillRR(ctx, 12 + i * 29, 104 + j * 30, 22, 22, 6, 'hsla(' + ((hue + i * 47 + j * 83) % 360) + ',70%,72%,0.95)');
        }
        for (i = 0; i < 4; i++) fillRR(ctx, 12 + i * 29, 214, 22, 22, 6, 'rgba(255,255,255,0.85)');
        ctx.fillStyle = '#05070b'; ctx.beginPath(); ctx.arc(W / 2, 10, 4, 0, 6.2832); ctx.fill();
        var mt = reg(new THREE.MeshBasicMaterial({ map: toTex(c, false), toneMapped: false }));
        phoneMatCache[key] = mt;
        return mt;
    }

    // ---- aplikasikan peta tekstur ke material tema (warna tetap dari tema; tekstur hanya memodulasi) ----
    function applyMaps() {
        var wood = ['deskTop', 'desk', 'wood'];
        wood.forEach(function (k) { if (M[k]) { M[k].map = woodTex; M[k].needsUpdate = true; } });
        if (M.chair) { M.chair.map = fabricTex; M.chair.needsUpdate = true; }
        if (M.mat) { M.mat.map = fabricTex; M.mat.needsUpdate = true; }
        if (M.pool) { M.pool.map = radialTex; M.pool.needsUpdate = true; }
    }

    // ============================================================
    // PERANGKAT KOMPUTER
    // ============================================================
    var CRT_BODY = reg(new THREE.MeshStandardMaterial({ color: 0xd8d1be, roughness: 0.62 }));
    var CRT_DARK = reg(new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.5 }));
    var KEYBOARD_MAT = reg(new THREE.MeshStandardMaterial({ map: keyTex, roughness: 0.55, metalness: 0.1 }));
    var KEYBOARD_OLD = reg(new THREE.MeshStandardMaterial({ map: keyTex, color: 0xe8dfc6, roughness: 0.7 }));
    var SILVER = reg(new THREE.MeshStandardMaterial({ color: 0xc4cad4, roughness: 0.32, metalness: 0.85, envMapIntensity: 1.1 }));
    var PLASTIC_DARK = reg(new THREE.MeshStandardMaterial({ color: 0x20242b, roughness: 0.4, metalness: 0.1 }));
    var LENS = reg(new THREE.MeshStandardMaterial({ color: 0x0a0d14, roughness: 0.1, metalness: 0.6, envMapIntensity: 1.4 }));

    // monitor: era 0-1 = CRT beige tebal; era 2+ = layar datar tipis dengan dudukan. y = permukaan meja.
    function monitor(p, x, y, z, on, kind) {
        var g = new THREE.Group();
        g.position.set(x, y, z);
        p.add(g);
        var era = S.era, sm = on ? screenMat(kind || 'doc') : M.screenOff;
        if (era <= 1) {
            rb(g, CRT_BODY, 0.44, 0.36, 0.3, 0.03, 0, 0.21, 0.0);
            rb(g, CRT_BODY, 0.3, 0.26, 0.2, 0.05, 0, 0.2, -0.22);
            rb(g, CRT_BODY, 0.26, 0.03, 0.26, 0.01, 0, 0.015, -0.02);
            rb(g, CRT_DARK, 0.37, 0.29, 0.016, 0.01, 0, 0.215, 0.152);
            mk(g, G.plane, sm, 0, 0.215, 0.162, 0.33, 0.245, 1);
            small(mk(g, G.sph, 'ledG', 0.17, 0.065, 0.152, 0.008, 0.008, 0.008));
            if (DETAIL >= 1) { small(rb(g, CRT_DARK, 0.05, 0.012, 0.01, 0.004, 0.1, 0.052, 0.152)); small(rb(g, CRT_DARK, 0.05, 0.012, 0.01, 0.004, 0.04, 0.052, 0.152)); }
        } else {
            rb(g, PLASTIC_DARK, 0.52, 0.31, 0.022, 0.01, 0, 0.27, 0);                        // bingkai
            mk(g, G.plane, sm, 0, 0.27, 0.0118, 0.49, 0.282, 1);                              // panel layar
            rb(g, PLASTIC_DARK, 0.5, 0.29, 0.03, 0.02, 0, 0.27, -0.022);                     // punggung
            rb(g, SILVER, 0.045, 0.16, 0.022, 0.008, 0, 0.09, -0.03);                        // leher
            rb(g, SILVER, 0.2, 0.012, 0.15, 0.006, 0, 0.007, -0.02);                         // alas
            if (DETAIL >= 1) small(mk(g, G.sph, 'ledG', 0.2, 0.128, 0.012, 0.006, 0.006, 0.006));
        }
        if (on && DETAIL >= 1) { var gp = new THREE.Mesh(G.plane, glowMat); gp.scale.set(0.9, 0.7, 1); gp.position.set(0, 0.006, 0.28); gp.rotation.x = -HALF_PI; gp.renderOrder = 2; g.add(gp); }
        return g;
    }
    function keyboard(p, x, y, z, old) {
        var kb = rb(p, old ? KEYBOARD_OLD : KEYBOARD_MAT, old ? 0.34 : 0.3, old ? 0.03 : 0.012, old ? 0.13 : 0.11, 0.004, x, y + (old ? 0.016 : 0.007), z);
        return small(kb);
    }
    function mouse(p, x, y, z, old) {
        if (DETAIL >= 1) small(rb(p, 'dark', 0.2, 0.004, 0.17, 0.002, x, y + 0.003, z));      // alas mouse
        if (old) return small(rb(p, CRT_BODY, 0.05, 0.03, 0.08, 0.012, x, y + 0.02, z));
        var m = small(rb(p, SILVER, 0.04, 0.022, 0.066, 0.016, x, y + 0.015, z));
        return m;
    }
    function laptop(p, x, y, z, yaw, kind) {
        var g = new THREE.Group();
        g.position.set(x, y, z); g.rotation.y = yaw || 0;
        p.add(g);
        rb(g, SILVER, 0.34, 0.014, 0.23, 0.006, 0, 0.009, 0);                                  // badan
        mk(g, G.plane, KEYBOARD_MAT, 0, 0.0175, 0.02, 0.29, 0.12, 1).rotation.x = -HALF_PI;    // dek keyboard
        small(rb(g, 'metal', 0.09, 0.002, 0.06, 0.001, 0, 0.0185, 0.085));                      // trackpad
        var lid = new THREE.Group();
        lid.position.set(0, 0.016, -0.11); lid.rotation.x = -0.32;
        g.add(lid);
        rb(lid, SILVER, 0.34, 0.225, 0.008, 0.006, 0, 0.113, 0);
        mk(lid, G.plane, screenMat(kind || 'code'), 0, 0.113, 0.0048, 0.32, 0.2, 1);
        return g;
    }
    function tower(p, x, z) {                                   // PC tower beige (era lama)
        rb(p, CRT_BODY, 0.2, 0.42, 0.44, 0.015, x, 0.21, z);
        small(rb(p, CRT_DARK, 0.15, 0.03, 0.01, 0.004, x, 0.33, z + 0.222));
        small(rb(p, CRT_DARK, 0.15, 0.03, 0.01, 0.004, x, 0.28, z + 0.222));
        small(mk(p, G.sph, 'ledG', x + 0.06, 0.12, z + 0.222, 0.01, 0.01, 0.006));
        small(rb(p, CRT_DARK, 0.1, 0.012, 0.01, 0.004, x, 0.09, z + 0.222));
    }
    function mug(p, x, y, z, bodyMat) {
        var g = new THREE.Group();
        g.position.set(x, y, z);
        p.add(g);
        small(mk(g, G.cyl, bodyMat, 0, 0.033, 0, 0.03, 0.066, 0.03));
        if (DETAIL >= 1) {
            var h = small(mk(g, cached('mugH', function () { return new THREE.TorusGeometry(0.02, 0.0055, 6, 12); }), bodyMat, 0.031, 0.034, 0));
            h.rotation.y = 0;
            small(mk(g, G.cyl, 'dark', 0, 0.064, 0, 0.026, 0.004, 0.026));
        }
        return g;
    }
    function deskLamp(p, x, y, z) {
        small(rb(p, 'metal', 0.09, 0.012, 0.09, 0.004, x, y + 0.006, z));
        small(cyl(p, 'metal', 0.008, 0.2, x, y + 0.11, z));
        var head = small(mk(p, G.cone, 'amber', x - 0.05, y + 0.22, z + 0.02, 0.05, 0.08, 0.05));
        head.rotation.z = HALF_PI * 0.9;
        small(mk(p, G.sph, 'amber', x - 0.1, y + 0.215, z + 0.02, 0.012, 0.012, 0.012));
    }
    function notebook(p, x, y, z, yaw) {
        var g = new THREE.Group();
        g.position.set(x, y, z); g.rotation.y = yaw || 0; p.add(g);
        small(rb(g, bookMat(S.accent), 0.15, 0.014, 0.2, 0.004, 0, 0.007, 0));
        small(rb(g, 'paper', 0.14, 0.01, 0.19, 0.002, 0.004, 0.0075, 0));
        small(cyl(g, 'dark', 0.005, 0.15, 0.1, 0.018, 0.02)).rotation.set(HALF_PI, 0, 0.3);
    }
    function phoneFlat(p, x, y, z, yaw) {
        var m = small(rb(p, 'dark', 0.07, 0.008, 0.145, 0.01, x, y + 0.004, z));
        m.rotation.y = yaw || 0;
        var s = small(mk(p, G.plane, screenMat('chart'), x, y + 0.0085, z, 0.062, 0.135, 1));
        s.rotation.set(-HALF_PI, 0, yaw || 0);
        return m;
    }

    // ============================================================
    // PERABOT
    // ============================================================
    function chair(p, x, z, mat, o) {
        o = o || {};
        var g = new THREE.Group();
        g.position.set(x, 0, z);
        g.rotation.y = o.yaw || 0;
        p.add(g);
        var seatMat = mat || 'chair';
        var exec = !!o.exec;
        cyl(g, 'metal', 0.026, 0.2, 0, 0.16, 0);
        if (DETAIL >= 1) {
            for (var i = 0; i < 5; i++) {
                var a = i * Math.PI * 2 / 5;
                var leg = small(rb(g, PLASTIC_DARK, 0.2, 0.022, 0.04, 0.01, Math.cos(a) * 0.1, 0.05, Math.sin(a) * 0.1));
                leg.rotation.y = -a;
                small(mk(g, G.sph, 'dark', Math.cos(a) * 0.2, 0.025, Math.sin(a) * 0.2, 0.024, 0.024, 0.024));
            }
        } else {
            small(cyl(g, 'dark', 0.2, 0.03, 0, 0.03, 0));
        }
        rb(g, seatMat, 0.46, 0.065, 0.45, 0.026, 0, 0.305, 0);                                // dudukan
        var bh = exec ? 0.56 : 0.4;
        var back = rb(g, seatMat, 0.42, bh, 0.06, 0.028, 0, 0.3 + bh / 2 + 0.06, 0.225);      // sandaran
        back.rotation.x = 0.1;
        if (DETAIL >= 1) {
            small(rb(g, PLASTIC_DARK, 0.05, 0.12, 0.04, 0.012, 0, 0.4, 0.2));                  // penyangga punggung
            [-1, 1].forEach(function (s) {                                                       // sandaran tangan
                small(rb(g, PLASTIC_DARK, 0.03, 0.17, 0.03, 0.01, s * 0.245, 0.4, 0.04));
                small(rb(g, PLASTIC_DARK, 0.055, 0.025, 0.2, 0.012, s * 0.245, 0.49, 0.0));
            });
        }
        return g;
    }
    function desk(p, x, z, ghost) {
        if (ghost) {
            mk(p, G.box, 'ghost', x, 0.62, z, 1.3, 0.07, 0.65);
            mk(p, G.box, 'ghost', x - 0.58, 0.29, z, 0.06, 0.58, 0.6);
            mk(p, G.box, 'ghost', x + 0.58, 0.29, z, 0.06, 0.58, 0.6);
            return;
        }
        rb(p, 'deskTop', 1.3, 0.05, 0.65, 0.016, x, 0.63, z);                                   // permukaan = 0.655
        rb(p, 'desk', 0.04, 0.6, 0.58, 0.008, x - 0.605, 0.3, z);                              // panel kiri
        rb(p, 'desk', 0.4, 0.57, 0.58, 0.014, x + 0.42, 0.305, z);                             // laci kanan
        rb(p, 'desk', 0.82, 0.3, 0.02, 0.006, x - 0.19, 0.44, z - 0.285);                      // panel belakang
        if (DETAIL >= 1) {
            small(rb(p, 'dark', 0.36, 0.006, 0.006, 0.002, x + 0.42, 0.31, z + 0.292));          // garis laci
            small(rb(p, 'metal', 0.12, 0.012, 0.014, 0.005, x + 0.42, 0.44, z + 0.297));
            small(rb(p, 'metal', 0.12, 0.012, 0.014, 0.005, x + 0.42, 0.18, z + 0.297));
        }
    }
    function plant(p, x, z, s, seed) {
        s = s || 1;
        var r = rng(((Math.round(x * 100) * 31) ^ Math.round(z * 100)) + (seed || 7));
        var pot = small(mk(p, cached('potG', function () { return new THREE.CylinderGeometry(1, 0.72, 1, 18); }), 'pot', x, 0.12 * s, z, 0.17 * s, 0.24 * s, 0.17 * s));
        pot.castShadow = !!look.shadows;
        small(mk(p, G.cyl, 'dark', x, 0.238 * s, z, 0.155 * s, 0.012 * s, 0.155 * s));
        var n = DETAIL >= 1 ? 9 : 6, i;
        for (i = 0; i < n; i++) {
            var a = (i / n) * 6.2832 + r() * 0.5, t = 0.35 + r() * 0.45, L = (0.24 + r() * 0.2) * s;
            var leaf = mk(p, G.sph, r() < 0.5 ? 'plant' : 'leaf', x + Math.sin(a) * Math.sin(t) * L / 2, 0.25 * s + Math.cos(t) * L / 2, z + Math.cos(a) * Math.sin(t) * L / 2,
                0.05 * s, L / 2, 0.016 * s);
            leaf.rotation.order = 'YXZ';
            leaf.rotation.set(t, a, 0);
            leaf.castShadow = !!look.shadows && DETAIL >= 1;
        }
        if (DETAIL >= 1) mk(p, G.ico1, 'plant', x, 0.46 * s, z, 0.14 * s, 0.11 * s, 0.14 * s).castShadow = false;
    }
    function sofa(p, x, z, w, d, yaw, mat) {
        var g = new THREE.Group();
        g.position.set(x, 0, z); g.rotation.y = yaw || 0; p.add(g);
        var m = mat || 'chair';
        rb(g, m, w, 0.22, d, 0.05, 0, 0.17, 0);
        rb(g, m, w, 0.4, 0.2, 0.06, 0, 0.42, d / 2 - 0.1);
        rb(g, m, 0.2, 0.3, d, 0.06, -w / 2 + 0.1, 0.33, 0);
        rb(g, m, 0.2, 0.3, d, 0.06, w / 2 - 0.1, 0.33, 0);
        var cn = Math.max(1, Math.round((w - 0.4) / 0.5));
        for (var i = 0; i < cn; i++) small(rb(g, m, (w - 0.4) / cn - 0.02, 0.1, d - 0.28, 0.04, -((w - 0.4) / 2) + ((w - 0.4) / cn) * (i + 0.5), 0.33, -0.06));
        return g;
    }
    function bookshelf(p, w, h, d, x, y0, z, palette) {
        // lemari terbuka: panel belakang, sisi, papan; buku bervariasi tinggi/lebar/warna. Sisi depan menghadap +z.
        var r = rng(Math.round(x * 100) * 7 + Math.round(z * 100) + 5), t = 0.03, i;
        var rows = Math.max(2, Math.round(h / 0.42)), rh = (h - t) / rows;
        rb(p, 'wood', w, h, 0.02, 0.006, x, y0 + h / 2, z - d / 2 + 0.01);
        rb(p, 'wood', t, h, d, 0.008, x - w / 2 + t / 2, y0 + h / 2, z);
        rb(p, 'wood', t, h, d, 0.008, x + w / 2 - t / 2, y0 + h / 2, z);
        for (i = 0; i <= rows; i++) rb(p, 'wood', w, t, d, 0.008, x, y0 + t / 2 + i * rh, z);
        for (i = 0; i < rows; i++) {
            var by = y0 + t + i * rh, bx = x - w / 2 + t + 0.03;
            while (bx < x + w / 2 - t - 0.06) {
                var bw = 0.035 + r() * 0.05, bh = (rh - t) * (0.55 + r() * 0.4);
                small(rb(p, bookMat(palette[Math.floor(r() * palette.length)]), bw, bh, d * 0.7, 0.004, bx + bw / 2, by + bh / 2, z + 0.012));
                bx += bw + 0.004;
                if (r() < 0.06) bx += 0.1;
            }
        }
    }
    var bookMats = {};
    function bookMat(c) { if (!bookMats[c]) bookMats[c] = reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 })); return bookMats[c]; }

    // ============================================================
    // PONSEL (ikon game) — bodi membulat, kaca layar bertekstur, modul kamera
    // ============================================================
    function phone(p, mat, scale, o) {
        o = o || {};
        var g = new THREE.Group();
        var ghost = mat === 'ghost';
        var bodyMat = mat ? matOf(mat) : M.dark;
        rb(g, bodyMat, 0.3, 0.6, 0.045, 0.045, 0, 0, 0);
        var sm = ghost ? M.ghost : phoneScreenMat(o.hue !== undefined ? o.hue : 215);
        mk(g, G.plane, sm, 0, 0, 0.0232, 0.274, 0.572, 1);
        if (!ghost) {
            if (DETAIL >= 1) {
                rb(g, LENS, 0.115, 0.115, 0.012, 0.03, -0.07, 0.205, -0.0285);                    // pulau kamera
                [[-0.098, 0.232], [-0.098, 0.178], [-0.04, 0.205]].forEach(function (c) { small(mk(g, G.cyl, 'metal', c[0], c[1], -0.038, 0.021, 0.006, 0.021)).rotation.x = HALF_PI; small(mk(g, G.cyl, LENS, c[0], c[1], -0.0415, 0.0155, 0.004, 0.0155)).rotation.x = HALF_PI; });
                small(rb(g, 'metal', 0.006, 0.07, 0.012, 0.002, 0.152, 0.12, 0));                // tombol samping
            } else {
                small(rb(g, 'metal', 0.11, 0.11, 0.01, 0.01, -0.07, 0.205, -0.027));
            }
        }
        g.scale.setScalar(scale || 1);
        p.add(g);
        return g;
    }

    // ============================================================
    // ORANG — model beranatomi + pose IK
    // ============================================================
    var SKIN_MATS = (env.SKIN || [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac]).map(function (c) { return reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.58 })); });
    var HAIR_MATS = (env.HAIR || [0x1b1b1f, 0x3b2a1e, 0x6b4a2b, 0xb98b4a, 0xc7c7cc, 0x8c3b2a]).map(function (c) { return reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.42 })); });
    var PANTS_MATS = [0x2b3445, 0x33353b, 0x8b7b5e, 0x4a5160, 0x3a5580, 0x1f2430].map(function (c) { return reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 })); });
    var SHOE_MATS = [0x202124, 0xf0f0f0, 0x6b4a33, 0x30343d].map(function (c) { return reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 })); });
    var IRIS_MATS = [0x3b2a1e, 0x1b1b1f, 0x4a6a7a, 0x2e4a32].map(function (c) { return reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.3 })); });
    var EYE_WHITE = reg(new THREE.MeshStandardMaterial({ color: 0xf7f7f7, roughness: 0.3 }));
    var MOUTH_MAT = reg(new THREE.MeshStandardMaterial({ color: 0x8a3b3b, roughness: 0.5 }));
    var COLLAR_MAT = reg(new THREE.MeshStandardMaterial({ color: 0xf4f6fa, roughness: 0.7 }));
    var shirtCache = {};
    function shirtMat(c) { if (!shirtCache[c]) shirtCache[c] = reg(new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 })); return shirtCache[c]; }

    var L_UP = 0.27, L_FO = 0.255;
    // IK 2 ruas pada bidang sagital. f = jarak ke depan dari bahu, d = jarak ke bawah, lat = geser ke samping (m).
    function ik(sh, el, f, d, lat) {
        var dist = Math.sqrt(f * f + d * d);
        dist = Math.max(Math.abs(L_UP - L_FO) + 0.01, Math.min(L_UP + L_FO - 0.01, dist));
        var phi = Math.atan2(f, d);
        var ca = (L_UP * L_UP + dist * dist - L_FO * L_FO) / (2 * L_UP * dist);
        var cb = (L_UP * L_UP + L_FO * L_FO - dist * dist) / (2 * L_UP * L_FO);
        var a = Math.acos(Math.max(-1, Math.min(1, ca))), b = Math.acos(Math.max(-1, Math.min(1, cb)));
        sh.rotation.set(phi - a, 0, Math.max(-0.6, Math.min(0.6, lat / 0.5)));
        el.rotation.set(Math.PI - b, 0, 0);
    }

    // spec: { h:hash, role, color:int(warna peran), skill:1..5, mt:0..2 (tier moral) }
    // -> rig { pelvis, headG, pose(P), cup }.  g harus sudah ditempatkan oleh pemanggil (g.position.y = lift * LIFT).
    function figure(g, spec) {
        var h = spec.h >>> 0, role = spec.role, mt = spec.mt;
        var skin = SKIN_MATS[h % SKIN_MATS.length];
        var hairM = HAIR_MATS[(h >>> 3) % HAIR_MATS.length];
        var style = (h >>> 6) % 6;
        var pants = PANTS_MATS[(h >>> 11) % PANTS_MATS.length];
        var shoe = SHOE_MATS[(h >>> 14) % SHOE_MATS.length];
        var shirt = shirtMat(spec.color);
        var shortSleeve = ((h >>> 9) % 3) === 0;
        var sleeveLow = shortSleeve ? skin : shirt;
        var rig = {};

        var pelvis = new THREE.Group();
        pelvis.position.set(0, 0.4, 0);
        g.add(pelvis);
        rig.pelvis = pelvis;
        rb(pelvis, pants, 0.3, 0.15, 0.19, 0.05, 0, 0, 0);
        if (DETAIL >= 2) small(rb(pelvis, 'dark', 0.31, 0.022, 0.2, 0.008, 0, 0.065, 0));       // ikat pinggang

        var spine = new THREE.Group();
        spine.position.set(0, 0.06, 0);
        pelvis.add(spine);
        rig.spine = spine;
        rb(spine, shirt, 0.34, 0.4, 0.2, 0.075, 0, 0.21, 0);                                    // badan
        if (DETAIL >= 1) {
            small(mk(spine, cached('collar', function () { return new THREE.TorusGeometry(1, 0.22, 6, 16); }), COLLAR_MAT, 0, 0.42, 0, 0.055, 0.055, 0.04)).rotation.x = HALF_PI;
            small(cyl(spine, skin, 0.032, 0.075, 0, 0.46, 0));                                    // leher
        }

        // --- lengan ---
        var armJoint = function (side) {
            var sh = new THREE.Group();
            sh.position.set(side * 0.19, 0.37, 0);
            spine.add(sh);
            small(sph(sh, shirt, 0.058, 0, 0, 0));                                                 // bahu
            mk(sh, capsuleG(0.04, 0.19), shirt, 0, -0.135, 0).castShadow = !!look.shadows;       // lengan atas
            var el = new THREE.Group();
            el.position.set(0, -0.27, 0);
            sh.add(el);
            small(sph(el, sleeveLow, 0.036, 0, 0, 0));
            mk(el, capsuleG(0.032, 0.15), sleeveLow, 0, -0.12, 0).castShadow = !!look.shadows;   // lengan bawah
            var hand = small(mk(el, G.sph, skin, 0, -0.262, -0.008, 0.036, 0.042, 0.03));        // tangan
            return { sh: sh, el: el, hand: hand };
        };
        var aL = armJoint(-1), aR = armJoint(1);
        if (DETAIL >= 2 && (h >>> 17) % 2 === 0) small(cyl(aL.el, 'dark', 0.036, 0.02, 0, -0.215, 0));   // jam tangan
        rig.cup = null;
        if (DETAIL >= 1) {
            var cup = new THREE.Group();
            cup.position.set(0, -0.272, -0.035);
            small(cyl(cup, 'white', 0.03, 0.06, 0, 0, 0));
            small(cyl(cup, 'dark', 0.026, 0.004, 0, 0.03, 0));
            cup.visible = false;
            aR.el.add(cup);
            rig.cup = cup;
        }

        // --- kaki ---
        var legJoint = function (side) {
            var hip = new THREE.Group();
            hip.position.set(side * 0.075, -0.02, 0);
            pelvis.add(hip);
            mk(hip, capsuleG(0.052, 0.24), pants, 0, -0.17, 0).castShadow = !!look.shadows;
            var kn = new THREE.Group();
            kn.position.set(0, -0.34, 0);
            hip.add(kn);
            small(sph(kn, pants, 0.044, 0, 0, 0));
            mk(kn, capsuleG(0.04, 0.25), pants, 0, -0.165, 0).castShadow = !!look.shadows;
            small(rb(kn, shoe, 0.088, 0.052, 0.21, 0.022, 0, -0.335, -0.04));                    // sepatu
            return { hip: hip, kn: kn };
        };
        var lL = legJoint(-1), lR = legJoint(1);

        // --- kepala ---
        var headG = new THREE.Group();
        headG.position.set(0, 0.59, 0);
        spine.add(headG);
        rig.headG = headG;
        var head = sph(headG, skin, 1, 0, 0, 0);
        head.scale.set(0.092, 0.108, 0.1);
        if (DETAIL >= 1) {
            small(mk(headG, G.sph, skin, 0, -0.012, -0.098, 0.014, 0.015, 0.016));               // hidung
            small(mk(headG, G.sph, skin, -0.092, 0, -0.005, 0.011, 0.022, 0.014));               // telinga
            small(mk(headG, G.sph, skin, 0.092, 0, -0.005, 0.011, 0.022, 0.014));
            var iris = IRIS_MATS[(h >>> 20) % IRIS_MATS.length];
            var eyes = new THREE.Group();
            headG.add(eyes);
            [-1, 1].forEach(function (s) {
                small(mk(eyes, G.sph, EYE_WHITE, s * 0.036, 0.012, -0.0925, 0.0165, 0.012, 0.007));
                small(mk(eyes, G.sph, iris, s * 0.036, 0.012, -0.0975, 0.0085, 0.0085, 0.004));
            });
            rig.eyes = eyes;
            if (DETAIL >= 2) {
                [-1, 1].forEach(function (s) {
                    small(rot(rb(headG, hairM, 0.032, 0.0065, 0.007, 0.002, s * 0.036, 0.042, -0.0895), 0, 0, s * (mt === 0 ? -0.2 : 0.14)));
                });
                var mouth = small(mk(headG, cached('mouthG', function () { return new THREE.TorusGeometry(1, 0.13, 5, 12, Math.PI); }), MOUTH_MAT, 0, mt === 2 ? -0.042 : (mt === 0 ? -0.058 : -0.052), -0.0905, 0.016, 0.014, 0.01));
                mouth.rotation.z = mt === 2 ? Math.PI : 0;
                if (mt === 1) { mouth.scale.set(0.016, 0.001, 0.01); mouth.rotation.z = 0; }
            }
        }
        // rambut: tutup kepala miring ke belakang (dahi terbuka) + variasi gaya
        if (!hairCapG) hairCapG = cached('hairCap', function () { return new THREE.SphereGeometry(1, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.5); });
        var cap = mk(headG, hairCapG, hairM, 0, 0.012, 0.008, style === 5 ? 0.1 : (style === 4 ? 0.096 : 0.1), style === 4 ? 0.108 : 0.114, style === 4 ? 0.103 : 0.109);
        cap.rotation.x = 0.35;
        cap.castShadow = false;
        if (style === 1) {                                                                       // panjang lurus
            rb(headG, hairM, 0.2, 0.22, 0.06, 0.03, 0, -0.07, 0.07).castShadow = false;
            small(rb(headG, hairM, 0.03, 0.13, 0.07, 0.012, -0.093, -0.045, 0.02));
            small(rb(headG, hairM, 0.03, 0.13, 0.07, 0.012, 0.093, -0.045, 0.02));
        } else if (style === 2) {                                                                // cepol
            small(sph(headG, hairM, 0.048, 0, 0.12, 0.06));
        } else if (style === 3) {                                                                // kuncir
            var tail = small(mk(headG, capsuleG(0.026, 0.1), hairM, 0, -0.03, 0.115));
            tail.rotation.x = -0.35;
        } else if (style === 5) {                                                                // jambul
            small(mk(headG, G.sph, hairM, 0, 0.095, -0.045, 0.06, 0.035, 0.06));
        }
        // aksesori per peran
        if (DETAIL >= 1) {
            if (role === 'engineer') {                                                           // headphone
                small(mk(headG, cached('hpArc', function () { return new THREE.TorusGeometry(1, 0.07, 6, 18, Math.PI); }), 'dark', 0, 0.002, 0, 0.112, 0.112, 0.112));
                small(rot(cyl(headG, 'dark', 0.038, 0.034, -0.102, 0, 0), 0, 0, HALF_PI));
                small(rot(cyl(headG, 'dark', 0.038, 0.034, 0.102, 0, 0), 0, 0, HALF_PI));
            } else if (role === 'designer') {                                                    // kacamata bulat
                var ring = cached('glRing', function () { return new THREE.TorusGeometry(1, 0.13, 6, 16); });
                [-1, 1].forEach(function (s) {
                    small(mk(headG, ring, 'dark', s * 0.037, 0.012, -0.1, 0.028, 0.028, 0.028));
                    small(mk(headG, G.circle, 'glass', s * 0.037, 0.012, -0.0995, 0.026, 0.026, 1));
                    small(rb(headG, 'dark', 0.004, 0.004, 0.09, 0.001, s * 0.075, 0.014, -0.05));
                });
                small(rb(headG, 'dark', 0.016, 0.004, 0.004, 0.001, 0, 0.018, -0.1));
            } else if (role === 'marketer') {                                                    // headset + mic
                small(mk(headG, cached('hpArc2', function () { return new THREE.TorusGeometry(1, 0.045, 6, 18, Math.PI); }), 'dark', 0, 0.002, 0, 0.11, 0.11, 0.11));
                small(rot(cyl(headG, 'dark', 0.034, 0.03, 0.101, 0, 0), 0, 0, HALF_PI));
                small(rot(cyl(headG, 'dark', 0.034, 0.03, -0.101, 0, 0), 0, 0, HALF_PI));
                var boom = small(rb(headG, 'dark', 0.005, 0.005, 0.1, 0.001, 0.085, -0.045, -0.07));
                boom.rotation.y = 0.25;
                small(sph(headG, 'dark', 0.01, 0.07, -0.05, -0.115));
            }
        }
        // ID card + lanyard (warna = tier skill)
        if (DETAIL >= 2) {
            var tm = env.tierMat && env.tierMat[Math.max(1, Math.min(5, spec.skill || 1))];
            if (tm) {
                small(rb(spine, tm, 0.052, 0.07, 0.006, 0.002, 0, 0.2, -0.103));
                small(rot(rb(spine, tm, 0.006, 0.17, 0.004, 0.001, -0.025, 0.31, -0.102), 0, 0, -0.2));
                small(rot(rb(spine, tm, 0.006, 0.17, 0.004, 0.001, 0.025, 0.31, -0.102), 0, 0, 0.2));
            }
        }
        rig.dispose = null;

        var eyes0 = rig.eyes;
        // pose: P = { lift 0..1, moving, phi, sec, ph, arm:'type'|'sip'|'walk'|'stand', slump, look }
        rig.pose = function (P) {
            var lift = P.lift, sit = 1 - lift, sec = P.sec, ph = P.ph, moving = !!P.moving;
            var sw = moving ? Math.sin(P.phi) : 0, cw = moving ? Math.cos(P.phi) : 0;
            var th = sit * HALF_PI;
            lL.hip.rotation.set(th + sw * 0.55 * lift, 0, -0.07 * sit);
            lR.hip.rotation.set(th - sw * 0.55 * lift, 0, 0.07 * sit);
            lL.kn.rotation.x = -th - (moving ? Math.max(0, cw) * 0.8 * lift : 0);
            lR.kn.rotation.x = -th - (moving ? Math.max(0, -cw) * 0.8 * lift : 0);
            var breathe = Math.sin(sec * 2 + ph) * 0.008;
            spine.rotation.x = -(sit * (P.slump ? 0.3 : 0.1) + (moving ? lift * 0.06 : 0)) + breathe;
            headG.position.y = 0.59 + Math.sin(sec * 2 + ph) * (P.slump ? 0.003 : 0.005);
            headG.rotation.x = P.slump ? -0.32 : (sit > 0.5 ? 0.04 : 0);
            headG.rotation.y = (P.look && sit > 0.5) ? Math.sin(sec * 0.6 + ph) * 0.22 : 0;
            if (eyes0) eyes0.scale.y = (((sec + ph) % 4.6) < 0.12) ? 0.1 : 1;
            var a = P.arm;
            if (a === 'walk') {
                aL.sh.rotation.set(-sw * 0.5, 0, -0.05); aR.sh.rotation.set(sw * 0.5, 0, 0.05);
                aL.el.rotation.set(0.25 + Math.max(0, sw) * 0.2, 0, 0); aR.el.rotation.set(0.25 + Math.max(0, -sw) * 0.2, 0, 0);
            } else if (a === 'stand') {
                aL.sh.rotation.set(0.04, 0, -0.07); aR.sh.rotation.set(0.04, 0, 0.07);
                aL.el.rotation.set(0.14, 0, 0); aR.el.rotation.set(0.14, 0, 0);
            } else {
                var k = P.slump ? 0.5 : 1;
                var t1 = Math.sin(sec * 9 + ph) * 0.012 * k, t2 = Math.cos(sec * 8 + ph) * 0.012 * k;
                ik(aL.sh, aL.el, 0.33, 0.12 + t1, 0.095);
                if (a === 'sip') ik(aR.sh, aR.el, 0.14, -0.13, -0.185);
                else if ((Math.floor(sec / 7 + ph) % 3) === 0) ik(aR.sh, aR.el, 0.32 + t2, 0.12, 0.115);   // sesekali memegang mouse
                else ik(aR.sh, aR.el, 0.33, 0.12 + t2, -0.095);
            }
            if (rig.cup) rig.cup.visible = (a === 'sip');
        };
        return rig;
    }

    // ============================================================
    // POHON halaman (blob ikosahedron halus + variasi warna)
    // ============================================================
    function tree(add, rnd, GY, x, z, s) {
        add(G.cyl, 'trunk', 0.1 * s, 0.62 * s, 0.1 * s, x, GY + 0.31 * s, z);
        var blobs = DETAIL >= 1 ? 5 : 3, i;
        for (i = 0; i < blobs; i++) {
            var a = rnd() * 6.2832, rd = (i === 0 ? 0 : 0.22 + rnd() * 0.16) * s;
            var bs = (i === 0 ? 0.5 : 0.28 + rnd() * 0.14) * s;
            add(G.ico1, rnd() < 0.5 ? 'leaf' : 'leaf2', bs, bs * 0.92, bs, x + Math.cos(a) * rd, GY + (0.82 + (i === 0 ? 0 : 0.12 + rnd() * 0.34)) * s, z + Math.sin(a) * rd);
        }
    }

    function dispose() {
        Object.keys(geoCache).forEach(function (k) { geoCache[k].dispose(); });
        texList.forEach(function (t) { t.dispose(); });
        matList.forEach(function (m) { m.dispose(); });
        geoCache = {}; texList = []; matList = [];
    }

    return {
        rbox: rbox, rb: rb, capsuleG: capsuleG, cached: cached,
        applyMaps: applyMaps, floorSurface: floorSurface, radialTex: radialTex, aoPlane: aoPlane, aoMat: aoMat, glowMat: glowMat,
        screenMat: screenMat, phoneScreenMat: phoneScreenMat,
        monitor: monitor, keyboard: keyboard, mouse: mouse, laptop: laptop, tower: tower, mug: mug, deskLamp: deskLamp,
        notebook: notebook, phoneFlat: phoneFlat, chair: chair, desk: desk, plant: plant, sofa: sofa, bookshelf: bookshelf,
        phone: phone, figure: figure, tree: tree, dispose: dispose,
        detail: DETAIL, silver: SILVER, plasticDark: PLASTIC_DARK, lens: LENS
    };
}
