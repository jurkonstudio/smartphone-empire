// FILE: src/ui/campus/Beach.js
// Pantai pasir landai (Kampus & Manufaktur). Menggantikan dua "anak tangga" pasir (lempengan 1.05 & 1.08)
// dengan satu permukaan miring dari tepi rumput ke garis air, diwarnai lewat vertex color:
//   - pasir kering terang di dekat rumput -> pasir basah makin gelap mendekati air (batas basah berkelok, bukan lingkaran),
//   - butiran halus acak,
//   - garis sampah laut tipis (rumput laut/ranting) yang putus-putus di batas pasang.
// Satu mesh, satu draw call, tanpa tekstur. Statis; setTheme() hanya menulis ulang vertex color.
// Garis air shader laut tetap di skala 1.08 (lihat SeaWater.js); ujung luar pantai berhenti tepat di situ.

export var BEACH = { S0: 1.0, S1: 1.08, Y0: -0.01, Y1: -0.255 };

// Tinggi permukaan pantai pada skala garis pantai f (1.0..1.08); dipakai untuk menaruh batu.
export function beachY(f) {
    var t = Math.max(0, Math.min(1, (f - BEACH.S0) / (BEACH.S1 - BEACH.S0)));
    return BEACH.Y0 + (BEACH.Y1 - BEACH.Y0) * t;
}

function hash2(a, b) {
    var s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return s - Math.floor(s);
}
function smooth(e0, e1, x) { var t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }
// noise 1D periodik di sepanjang pantai (th 0..2pi), k = jumlah ulangan bulat.
function shoreNoise(th, k, seed) {
    var u = th / (Math.PI * 2) * k, i0 = Math.floor(u), f = u - i0;
    var a = hash2(((i0 % k) + k) % k, seed), b = hash2((((i0 + 1) % k) + k) % k, seed);
    f = f * f * (3 - 2 * f);
    return a + (b - a) * f;
}

// opts: { radius: function (th, scale) -> jari-jari, y: tinggi dasar tambahan (default 0), seg, rows }
export function createBeach(THREE, opts) {
    var SEG = opts.seg || 360, ROWS = opts.rows || 17, yBase = opts.y || 0;
    var cols = SEG + 1;
    var pos = new Float32Array(cols * ROWS * 3), col = new Float32Array(cols * ROWS * 3);
    var i, j;
    for (i = 0; i < cols; i++) {
        var th = (i % SEG) / SEG * Math.PI * 2;
        for (j = 0; j < ROWS; j++) {
            var t = j / (ROWS - 1);
            var sc = BEACH.S0 + (BEACH.S1 - BEACH.S0) * t;
            var r = opts.radius(th, sc);
            var k = (i * ROWS + j) * 3;
            pos[k] = Math.cos(th) * r;
            pos[k + 1] = yBase + BEACH.Y0 + (BEACH.Y1 - BEACH.Y0) * t;
            pos[k + 2] = Math.sin(th) * r;
        }
    }
    var idx = [];
    for (i = 0; i < SEG; i++) {
        for (j = 0; j < ROWS - 1; j++) {
            var a = i * ROWS + j, b = (i + 1) * ROWS + j, c = a + 1, d = b + 1;
            idx.push(a, b, c, b, d, c);
        }
    }
    // pastikan sisi depan menghadap ke atas (+y)
    (function () {
        var ia = idx[0], ib = idx[1], ic = idx[2];
        var ax = pos[ia * 3], ay = pos[ia * 3 + 1], az = pos[ia * 3 + 2];
        var ux = pos[ib * 3] - ax, uy = pos[ib * 3 + 1] - ay, uz = pos[ib * 3 + 2] - az;
        var vx = pos[ic * 3] - ax, vy = pos[ic * 3 + 1] - ay, vz = pos[ic * 3 + 2] - az;
        var ny = uz * vx - ux * vz;
        if (ny < 0) for (var q = 0; q < idx.length; q += 3) { var tmp = idx[q + 1]; idx[q + 1] = idx[q + 2]; idx[q + 2] = tmp; }
    })();

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    var mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
    mat.envMapIntensity = 0.35;
    var mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    var cDry = new THREE.Color(), cWet = new THREE.Color(), cDeb = new THREE.Color(), cTmp = new THREE.Color();

    // dryHex/wetHex: warna pasir kering & basah tema aktif.
    function paint(dark, dryHex, wetHex) {
        cDry.setHex(dryHex);
        cWet.setHex(wetHex);
        cDeb.setHex(dark ? 0x4a4234 : 0x7a6a48);
        for (var ci = 0; ci < cols; ci++) {
            var th = (ci % SEG) / SEG * Math.PI * 2;
            var wob = shoreNoise(th, 9, 3) - 0.5;          // batas basah berkelok
            var tl = 0.5 + (shoreNoise(th, 14, 7) - 0.5) * 0.16;   // posisi garis sampah
            var patchy = smooth(0.52, 0.7, shoreNoise(th, 23, 11));   // sampah hanya sebagian
            for (var cj = 0; cj < ROWS; cj++) {
                var t = cj / (ROWS - 1);
                var w = smooth(0.22 + wob * 0.2, 0.82 + wob * 0.12, t);
                cTmp.copy(cDry).lerp(cWet, w);
                var dk = 1 - 0.2 * smooth(0.78, 1.0, t);   // paling gelap tepat di garis air
                var g = 0.955 + hash2(ci % SEG, cj + 17) * 0.09;     // butiran halus
                var dt = (t - tl) / 0.05;
                var deb = Math.exp(-dt * dt) * patchy * 0.55;
                if (deb > 0.01) cTmp.lerp(cDeb, deb);
                var k = (ci * ROWS + cj) * 3;
                col[k] = cTmp.r * dk * g;
                col[k + 1] = cTmp.g * dk * g;
                col[k + 2] = cTmp.b * dk * g;
            }
        }
        geo.attributes.color.needsUpdate = true;
    }

    return {
        mesh: mesh,
        setTheme: function (dark, dryHex, wetHex) { paint(!!dark, dryHex, wetHex); },
        dispose: function () {
            if (mesh.parent) mesh.parent.remove(mesh);
            geo.dispose();
            mat.dispose();
        }
    };
}
