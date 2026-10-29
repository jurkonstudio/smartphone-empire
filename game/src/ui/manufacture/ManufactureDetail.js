// FILE: src/ui/manufacture/ManufactureDetail.js  (BARU — v2027.80: detail industri realistis Peta Manufaktur 3D)
// Pembangun detail tambahan yang dipasang ke bangunan pabrik oleh ManufactureScene.js:
//   buildHallDetail -> pilaster sudut, plinth beton, parapet atap, unit AC/HVAC + kipas berputar, ventilasi cerobong kecil,
//                      skylight kaca, kanopi pintu + lampu + papan aksen, pipa utilitas + penyangga + talang di dinding timur.
//   buildYardDetail -> garis tepi pad (kuning putus-putus), bollard pengaman, hidran, trafo listrik (pabrik level >= 2).
// Semua bentuk statis digabung per material lewat kit.mergedBoxes (hemat draw call); hanya kipas atap yang beranimasi (opsional).
// `kit` disuplai scene: { box, cyl, sph, mergedBoxes, ACC, ambient() }. Tidak ada import dari scene (tanpa siklus).

function clampN(v, a, b) { return v < a ? a : v > b ? b : v; }

// opt: { roof (default true), skylight (true), door (true), pipes (true), tk: [], on: bool }
export function buildHallDetail(kit, f, id, dm, zc, opt) {
    opt = opt || {};
    var bw = dm.bw, bh = dm.bh, bd = dm.bd, hw = bw / 2;
    var front = zc + bd / 2, back = zc - bd / 2, top = bh + 0.12, i;
    var wallDk = [], steel = [], glass = [];

    // pilaster sudut + plinth beton di kaki dinding
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
        wallDk.push([0.13, bh, 0.13, c[0] * hw, bh / 2, zc + c[1] * bd / 2]);
    });
    wallDk.push([bw + 0.07, 0.11, bd + 0.07, 0, 0.055, zc]);

    if (opt.roof !== false) {
        // parapet tipis mengelilingi atap
        var py = top + 0.045;
        steel.push([bw + 0.16, 0.09, 0.05, 0, py, front + 0.065]);
        steel.push([bw + 0.16, 0.09, 0.05, 0, py, back - 0.065]);
        steel.push([0.05, 0.09, bd + 0.16, hw + 0.065, py, zc]);
        steel.push([0.05, 0.09, bd + 0.16, -hw - 0.065, py, zc]);

        // unit HVAC di jalur belakang atap + kipas berputar + ventilasi kecil di sela-selanya
        var n = clampN(Math.round(bw / 1.7), 2, 5), zr = zc - (bd / 2 - 0.34);
        var step = (bw - 1.3) / (n - 1), fans = [];
        for (i = 0; i < n; i++) {
            var hx = -hw + 0.65 + i * step;
            steel.push([0.58, 0.22, 0.36, hx, top + 0.11, zr]);
            kit.cyl(f, 'dark', 0.12, 0.03, hx, top + 0.235, zr);
            fans.push(kit.box(f, 'metal', 0.2, 0.015, 0.035, hx, top + 0.255, zr));
            if (i < n - 1) {
                kit.cyl(f, 'metal', 0.06, 0.2, hx + step / 2, top + 0.1, zr);
                kit.cyl(f, 'steel', 0.1, 0.03, hx + step / 2, top + 0.22, zr);
            }
        }
        if (opt.tk) {
            var on = !!opt.on;
            opt.tk.push(function (sec) {
                var sp = (kit.ambient() ? sec : 0) * (on ? 9 : 0.6);
                for (var k = 0; k < fans.length; k++) fans[k].rotation.y = sp + k * 0.9;
            });
        }

        // skylight kaca di sisi depan atap (menghindari kubah/menara di sisi kanan)
        if (opt.skylight !== false) {
            for (var sx = -hw + 0.9; sx <= hw - 1.7; sx += 0.95) {
                steel.push([0.62, 0.03, 0.36, sx, top + 0.015, front - 0.32]);
                glass.push([0.55, 0.04, 0.3, sx, top + 0.035, front - 0.32]);
            }
        }
    }

    // kanopi pintu + lampu gantung + papan aksen kecil
    if (opt.door !== false) {
        var dx = -bw * 0.3, doorH = Math.min(0.85, bh * 0.55);
        wallDk.push([0.95, 0.04, 0.3, dx, doorH + 0.07, front + 0.15]);
        steel.push([0.04, 0.12, 0.04, dx - 0.42, doorH + 0.01, front + 0.28]);
        steel.push([0.04, 0.12, 0.04, dx + 0.42, doorH + 0.01, front + 0.28]);
        kit.sph(f, 'lamp', 0.04, dx, doorH + 0.01, front + 0.2);
        kit.box(f, kit.ACC[id] || 'steel', 0.22, 0.12, 0.03, dx + 0.62, doorH * 0.8, front + 0.03);
    }

    // pipa utilitas horizontal di dinding timur + penyangga + talang air
    if (opt.pipes !== false) {
        var pr = kit.cyl(f, 'pipe', 0.05, bd * 0.82, hw + 0.12, 0.38, zc);
        pr.rotation.x = Math.PI / 2;
        var band = kit.cyl(f, kit.ACC[id] || 'steel', 0.056, 0.06, hw + 0.12, 0.38, zc + bd * 0.2);
        band.rotation.x = Math.PI / 2;
        [-0.35, 0, 0.35].forEach(function (k) { steel.push([0.04, 0.38, 0.04, hw + 0.12, 0.19, zc + k * bd]); });
        kit.cyl(f, 'pipe', 0.03, bh, hw + 0.06, bh / 2, back + 0.25);
    }

    kit.mergedBoxes(f, 'wallDk', wallDk);
    kit.mergedBoxes(f, 'steel', steel);
    kit.mergedBoxes(f, 'glass', glass);
}

// def: PLOTS[i]; level: level pabrik (untuk trafo)
export function buildYardDetail(kit, f, def, level) {
    var hw = def.w / 2, hd = def.d / 2, i;
    var yel = [], n = Math.floor((def.w - 1.2) / 0.7);

    // garis tepi pad: kuning putus-putus di sisi depan & belakang
    for (i = 0; i < n; i++) {
        var lx = -hw + 0.75 + i * 0.7;
        yel.push([0.4, 0.008, 0.07, lx, 0.006, hd - 0.18]);
        yel.push([0.4, 0.008, 0.07, lx, 0.006, -(hd - 0.18)]);
    }
    kit.mergedBoxes(f, 'safety', yel);

    // bollard pengaman di dua sudut depan
    [-1, 1].forEach(function (s) {
        kit.cyl(f, 'safety', 0.05, 0.3, s * (hw - 0.4), 0.15, hd - 0.5);
        kit.cyl(f, 'dark', 0.056, 0.04, s * (hw - 0.4), 0.21, hd - 0.5);
    });

    if (def.kind !== 'plant') return;

    // hidran kebakaran
    var hx = hw - 0.35, hz = hd - 1.15;
    kit.cyl(f, 'red', 0.06, 0.2, hx, 0.1, hz);
    kit.sph(f, 'red', 0.06, hx, 0.22, hz);
    kit.box(f, 'red', 0.16, 0.04, 0.04, hx, 0.14, hz);

    // trafo listrik di belakang-kiri (muncul mulai level 2)
    if (level >= 2) {
        var tx = -(hw - 0.55), tz = -(hd - 0.55);
        kit.box(f, 'wallDk', 0.5, 0.42, 0.36, tx, 0.21, tz);
        kit.box(f, 'steel', 0.04, 0.34, 0.3, tx - 0.27, 0.2, tz);
        kit.box(f, 'steel', 0.04, 0.34, 0.3, tx + 0.27, 0.2, tz);
        [-0.14, 0, 0.14].forEach(function (d) { kit.cyl(f, 'white', 0.035, 0.14, tx + d, 0.49, tz); });
        kit.box(f, 'safety', 0.14, 0.1, 0.01, tx, 0.24, tz + 0.185);
    }
}
