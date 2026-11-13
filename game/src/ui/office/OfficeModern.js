// FILE: src/ui/office/OfficeModern.js  (BARU — v2027.84 "Office Modern")
// Lapisan dekorasi bertahap untuk Office 3D Map. Logika game, denah, rute staf, dan kartu TIDAK berubah.
// Dipanggil dari OfficeScene.rebuildRoom() SETELAH perabot dasar ruangan dibangun, hanya menambah benda baru
// di area kosong (dinding / lantai tepi / atas meja). Fitur muncul bertahap: lihat OfficeProgress.js
// (butuh LEVEL ruangan DAN ERA/tahun game sekaligus).
//
//   Work     : galeri dinding, strip LED, resepsionis (HQ kecil), taman dalam ruangan (HQ sedang/besar),
//              hologram kecil di meja engineer/desainer (era AI+).
//   CEO      : lampu lantai, layar pintar di dinding.
//   Lab      : cincin LED lantai di sekitar meja holo, panel data melayang (era AI+).
//   Showroom : video wall (era Premium+).
//   Keuangan : running text bursa.
//   Semua    : strip LED aksen di dasar dinding belakang (era Smartphone Matang+).
// Tier kualitas 'low' (mode hemat) melewati semua benda beranimasi / transparan.

import { clamp, deskCapacity, hash, sortedStaff } from './OfficeConfig.js';
import { ART_PALETTE, deskRows, deskSlot, featureOn } from './OfficeProgress.js';

export function createOfficeModern(THREE, ctx) {
    var G = ctx.G, M = ctx.M, props = ctx.props;
    var look = ctx.look || { tier: 'medium', shadows: false };
    var LOW = look.tier === 'low';
    var mats = {};          // cache material milik modul ini (dibuang di dispose)

    function stdMat(key, color, rough, metal) {
        if (!mats[key]) mats[key] = new THREE.MeshStandardMaterial({ color: color, roughness: rough, metalness: metal || 0 });
        return mats[key];
    }
    function basicMat(key, color, opacity) {
        if (!mats[key]) {
            mats[key] = new THREE.MeshBasicMaterial({ color: color, transparent: opacity < 1, opacity: opacity, depthWrite: opacity >= 1 });
        }
        return mats[key];
    }
    function bx(parent, mat, w, h, d, x, y, z) {
        var mm = typeof mat === 'string' ? M[mat] : mat;
        var m = new THREE.Mesh(G.box, mm);
        m.scale.set(w, h, d);
        m.position.set(x, y, z);
        m.castShadow = !!look.shadows && !mm.transparent && !mm.isMeshBasicMaterial;
        m.receiveShadow = !!look.shadows;
        parent.add(m);
        return m;
    }
    function ball(parent, mat, r, x, y, z) {
        var mm = typeof mat === 'string' ? M[mat] : mat;
        var m = new THREE.Mesh(G.sph, mm);
        m.scale.set(r, r, r);
        m.position.set(x, y, z);
        m.castShadow = false;
        parent.add(m);
        return m;
    }
    function tube(parent, mat, r, h, x, y, z) {
        var mm = typeof mat === 'string' ? M[mat] : mat;
        var m = new THREE.Mesh(G.cyl, mm);
        m.scale.set(r, h, r);
        m.position.set(x, y, z);
        m.castShadow = !!look.shadows && !mm.isMeshBasicMaterial;
        parent.add(m);
        return m;
    }

    // Strip LED aksen di dasar dinding belakang ruangan (lokal: z = -d/2). Menyala ikut warna aksen (M.glow).
    function trimBack(f, r) {
        var w = Math.max(0.6, r.w - 0.7);
        bx(f, 'glow', w, 0.035, 0.04, 0, 0.05, -r.d / 2 + 0.13);
    }

    // ---------------- WORK ----------------
    function decorateWork(r, d, p, st, E, tk, ex) {
        var L = st.level, f = r.furn;
        var staff = sortedStaff(d);
        var cap = deskCapacity(p, staff.length);
        var pal = ART_PALETTE[clamp(E, 0, ART_PALETTE.length - 1)];

        if (featureOn('gallery', L, E)) {                      // bingkai di dinding barat (menghadap +x), di luar papan nama
            var zs = [-2.6, 2.5, -1.65], n = Math.min(zs.length, 1 + (L - 1));
            for (var g = 0; g < n; g++) {
                var key = 'art' + E + '_' + g;
                var artMat = stdMat(key, pal[g % pal.length], 0.6, 0);
                bx(f, 'wood', 0.05, 0.62, 0.74, -5.89, 1.5, zs[g]);
                bx(f, artMat, 0.03, 0.5, 0.62, -5.86, 1.5, zs[g]);
                bx(f, 'white', 0.032, 0.34, 0.46, -5.855, 1.5, zs[g]);      // passe-partout
                bx(f, stdMat(key + 'b', pal[(g + 1) % pal.length], 0.6, 0), 0.034, 0.22, 0.34, -5.85, 1.5, zs[g]);
            }
        }
        if (featureOn('ledTrim', L, E)) {                      // strip LED sepanjang dinding barat
            bx(f, 'glow', 0.04, 0.035, 6.9, -5.9, 0.05, 0);
        }
        if (featureOn('reception', L, E) && cap <= 12) {       // resepsionis di kanan pintu utama
            var rz = 3.2, rx = 3.6;
            props.rb(f, 'white', 1.7, 0.56, 0.5, 0.04, rx, 0.28, rz);
            props.rb(f, 'wood', 1.8, 0.06, 0.58, 0.02, rx, 0.59, rz);
            props.laptop(f, rx - 0.35, 0.62, rz - 0.04, 0, 'dash');
            props.mug(f, rx + 0.45, 0.62, rz + 0.02, 'white');
            props.deskLamp(f, rx + 0.7, 0.62, rz - 0.15);
            if (ex.signTexture) {
                var tex = ex.signTexture(d.companyName);
                var sm = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
                var sg = new THREE.Mesh(G.plane, sm);
                sg.scale.set(1.3, 0.3, 1);
                sg.position.set(rx, 0.3, rz + 0.255);
                sg.userData.own = 1; sg.userData.tex = tex;
                f.add(sg);
            }
        }
        if (featureOn('planters', L, E) && cap <= 24) {        // taman memanjang di dinding selatan (pintu utama x=0 tetap kosong)
            [-2.8, 2.8].forEach(function (cx, ci) {
                bx(f, 'pot', 2.6, 0.36, 0.45, cx, 0.18, 3.42);
                bx(f, 'soil', 2.46, 0.04, 0.34, cx, 0.37, 3.42);
                for (var b = 0; b < 5; b++) {
                    var s = 0.17 + ((hash('pl' + ci + b) % 5) * 0.02);
                    var bush = ball(f, b % 2 ? 'plant' : 'leaf', s, cx - 1.0 + b * 0.5, 0.5 + s * 0.4, 3.42);
                    bush.scale.y = s * 1.25;
                }
            });
        }
        if (featureOn('holoDesk', L, E) && !LOW) {              // hologram kecil di atas laptop engineer / desainer
            var holo = basicMat('holoDesk', 0x00e5ff, 0.4);
            var rows = deskRows(cap);
            var floaters = [];
            for (var i = 0; i < Math.min(staff.length, 30); i++) {
                var s = staff[i], sl = deskSlot(i, 6, rows);
                if (!sl || (s.role !== 'engineer' && s.role !== 'designer')) continue;
                var orb = ball(f, holo, 0.055, sl.x - 0.42, 0.98, sl.z + 0.03);
                var ring = new THREE.Mesh(G.tor, holo);
                ring.scale.set(0.11, 0.11, 0.11);
                ring.position.set(sl.x - 0.42, 0.98, sl.z + 0.03);
                ring.rotation.x = Math.PI / 2;
                f.add(ring);
                floaters.push({ orb: orb, ring: ring, y: 0.98, ph: i * 0.7 });
            }
            if (floaters.length) {
                tk.push(function (sec) {
                    for (var q = 0; q < floaters.length; q++) {
                        var o = floaters[q];
                        var dy = Math.sin(sec * 1.8 + o.ph) * 0.03;
                        o.orb.position.y = o.y + dy;
                        o.ring.position.y = o.y + dy;
                        o.ring.rotation.z = sec * 1.4 + o.ph;
                    }
                });
            }
        }
    }

    // ---------------- CEO ----------------
    function decorateCeo(r, d, p, st, E, tk) {
        var L = st.level, f = r.furn;
        if (featureOn('ceoLamp', L, E)) {                      // lampu lantai di pojok timur laut
            tube(f, 'metal', 0.02, 1.5, 1.45, 0.75, -1.75);
            tube(f, 'metal', 0.12, 0.03, 1.45, 0.015, -1.75);
            var shade = tube(f, 'white', 0.15, 0.26, 1.45, 1.55, -1.75);
            shade.scale.x = 0.15; shade.scale.z = 0.15;
            ball(f, 'glow', 0.06, 1.45, 1.4, -1.75);
        }
        if (featureOn('smartScreen', L, E)) {                  // layar pintar di partisi timur (menghadap -x)
            bx(f, 'dark', 0.05, 0.62, 1.02, 1.65, 1.35, 0.5);
            var face = new THREE.Mesh(G.plane, props.screenMat('dash'));
            face.scale.set(0.92, 0.52, 1);
            face.position.set(1.62, 1.35, 0.5);
            face.rotation.y = -Math.PI / 2;
            f.add(face);
        }
        if (featureOn('ledTrim', L, E)) trimBack(f, r);
    }

    // ---------------- LAB ----------------
    function decorateLab(r, d, p, st, E, tk) {
        var L = st.level, f = r.furn;
        if (featureOn('labRing', L, E)) {                      // cincin LED di lantai (radius < meja holo + bar progres)
            var ring = new THREE.Mesh(G.tor, M.glow);
            ring.scale.set(0.75, 0.75, 0.75);
            ring.position.set(0, 0.045, 0.5);
            ring.rotation.x = Math.PI / 2;
            f.add(ring);
        }
        if (featureOn('labPanels', L, E) && !LOW) {            // tiga panel data melayang mengitari meja holo
            var holo = basicMat('labPanel', 0x00e5ff, 0.22);
            var panels = [];
            for (var i = 0; i < 3; i++) {
                var pm = new THREE.Mesh(G.plane, holo);
                pm.scale.set(0.5, 0.34, 1);
                f.add(pm);
                panels.push(pm);
            }
            tk.push(function (sec) {
                for (var q = 0; q < panels.length; q++) {
                    var a = sec * 0.5 + q * (Math.PI * 2 / 3);
                    panels[q].position.set(Math.cos(a) * 1.3, 1.05 + Math.sin(sec * 1.5 + q) * 0.05, 0.5 + Math.sin(a) * 1.3);
                    panels[q].rotation.y = Math.atan2(Math.cos(a), Math.sin(a));
                }
            });
        }
        if (featureOn('ledTrim', L, E)) trimBack(f, r);
    }

    // ---------------- SHOWROOM ----------------
    function decorateShowroom(r, d, p, st, E, tk) {
        var L = st.level, f = r.furn;
        if (featureOn('videoWall', L, E)) {                    // video wall di dinding utara sisi timur (pintu ada di dinding barat)
            bx(f, 'dark', 1.8, 0.86, 0.05, 1.9, 1.35, -1.56);
            var panels = [];
            for (var i = 0; i < 3; i++) {
                var cell = bx(f, i === 0 ? 'screenOn' : 'screenOff', 0.55, 0.7, 0.02, 1.9 + (i - 1) * 0.58, 1.35, -1.53);
                panels.push({ m: cell, ph: i * 1.1 });
            }
            if (!LOW) {
                tk.push(function (sec) {
                    for (var q = 0; q < panels.length; q++) {
                        var pn = panels[q];
                        pn.m.material = (Math.sin(sec * 1.4 + pn.ph) > -0.2) ? M.screenOn : M.glow;
                    }
                });
            }
        }
        if (featureOn('ledTrim', L, E)) trimBack(f, r);
    }

    // ---------------- KEUANGAN ----------------
    function decorateFinance(r, d, p, st, E, tk) {
        var L = st.level, f = r.furn;
        if (featureOn('ticker', L, E)) {                       // pita running text di atas papan bursa
            var cells = [];
            for (var i = 0; i < 6; i++) cells.push(bx(f, 'ledG', 0.15, 0.06, 0.02, 0.35 + i * 0.2, 1.86, -2.01));
            if (!LOW) {
                tk.push(function (sec) {
                    var on = Math.floor(sec * 3) % cells.length;
                    for (var q = 0; q < cells.length; q++) cells[q].visible = ((q + cells.length - on) % cells.length) < 4;
                });
            }
        }
        if (featureOn('ledTrim', L, E)) trimBack(f, r);
    }

    // ---------------- RUANGAN LAIN (hanya strip LED) ----------------
    function decorateTrimOnly(r, d, p, st, E) {
        if (featureOn('ledTrim', st.level, E)) trimBack(r.furn, r);
    }

    var DECOR = {
        work: decorateWork, ceo: decorateCeo, lab: decorateLab, showroom: decorateShowroom,
        finance: decorateFinance, design: decorateTrimOnly, marketing: decorateTrimOnly
    };

    return {
        // r = objek ruangan scene, d = data game, p = plan (computePlan), st = {open, level}, E = indeks era,
        // tk = array ticker, ex = { signTexture } dari scene.
        decorate: function (r, d, p, st, E, tk, ex) {
            var fn = DECOR[r.def.id];
            if (!fn || !st || !st.open) return;
            fn(r, d, p, st, E || 0, tk, ex || {});
        },
        dispose: function () {
            Object.keys(mats).forEach(function (k) { mats[k].dispose(); });
            mats = {};
        }
    };
}
