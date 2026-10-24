// FILE: src/ui/campus/SeaWater.js
// Laut hidup & realistis untuk peta 3D Kampus dan Manufaktur (dipakai bersama).
//
// Pengganti kotak biru datar + lempengan "perairan dangkal/busa" statis. Satu bidang datar (y = -0.5)
// dengan ShaderMaterial; seluruh efek dihitung di fragment shader, tanpa geometri ekstra:
//   - gradien kedalaman dari peta jarak-ke-pantai (SDF, dibuat sekali di CPU): pasir/dangkal -> tengah -> dalam
//   - normal gelombang prosedural (jumlah sinus + value-noise yang bergeser) -> pantulan langit (fresnel) dan kilau matahari
//   - garis ombak yang merambat ke pantai + busa tepi yang maju-mundur (swash), garis pantai bergelombang tidak kaku
//   - caustic jaring cahaya di perairan dangkal, bercak warna skala besar, buih tipis di laut terbuka
//   - mengikuti tema terang/gelap, cuaca (mendung/hujan/salju) dan senja; ikut kabut scene
//
// Tidak memakai tekstur gambar, tidak ada request jaringan. Satu DataTexture kecil (half-float) untuk SDF.
// Mode gerak mati (reduced-motion): waktu dibekukan, laut tetap tampil bagus tapi diam.
//
// API:
//   var sea = createSea(THREE, { islands, quality, palette });
//   scene.add(sea.mesh);
//   sea.setTheme(dark);                       // ganti warna terang/gelap
//   sea.update(sec, weatherKind, sunset01);   // panggil tiap frame ambient (murah)
//   sea.dispose();
//
// islands: [{ cx, cz, radius(th) }]  garis AIR (bukan tepi rumput) tiap pulau; pusat dunia (cx, cz).
//   Koordinat dunia pantai: (cx + cos(th) * r, cz + sin(th) * r) — sama dengan lempengan pulau di scene.

var WATER_Y = -0.5;

// Warna [terang, gelap]. Selaras dengan PALETTES.ocean/shallow/foam di CampusBuildings.js.
var DEFAULT_PALETTE = {
    shallow: [0x86d8e8, 0x1a7a98],
    ocean:   [0x3fa9dc, 0x0d4a78],
    foam:    [0xf4fbff, 0x9cc4d8],
    sky:     [0xcfe6ff, 0x5f7fbf],      // warna yang dipantulkan permukaan (langit)
    sun:     [0xfff1d2, 0xaec2ee]       // warna kilau (matahari / bulan)
};

// Skala kecerahan agar setara dengan bahan berlampu yang digantikan (tone mapping ACES di renderer).
var LIT = { light: 1.12, dark: 0.8 };
// Pengaruh cuaca: [abu-abu, gelombang, kilau, kecerahan]
var WEATHER = {
    clear:    [0.00, 0.00, 1.00, 1.00],
    sunny:    [0.00, 0.00, 1.25, 1.04],
    overcast: [0.55, 0.30, 0.25, 0.86],
    rain:     [0.75, 0.85, 0.10, 0.78],
    snow:     [0.65, 0.20, 0.30, 0.92]
};

// ------------------------------------------------------------------
// SDF jarak-ke-pantai (satuan dunia). Positif = air, negatif = daratan.
// ------------------------------------------------------------------
function buildSdf(THREE, islands, cell) {
    var N = 96, TAB = 720, i, k;
    var margin = 18;
    var x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;

    var polys = islands.map(function (isl) {
        var px = new Float32Array(N + 1), pz = new Float32Array(N + 1);
        for (i = 0; i <= N; i++) {
            var th = (i % N) / N * Math.PI * 2, r = isl.radius(th);
            px[i] = isl.cx + Math.cos(th) * r;
            pz[i] = isl.cz + Math.sin(th) * r;
            if (px[i] < x0) x0 = px[i]; if (px[i] > x1) x1 = px[i];
            if (pz[i] < z0) z0 = pz[i]; if (pz[i] > z1) z1 = pz[i];
        }
        var tab = new Float32Array(TAB + 1);               // r(theta) untuk uji dalam/luar yang cepat
        for (i = 0; i <= TAB; i++) tab[i] = isl.radius((i % TAB) / TAB * Math.PI * 2);
        return { cx: isl.cx, cz: isl.cz, px: px, pz: pz, tab: tab };
    });

    x0 -= margin; x1 += margin; z0 -= margin; z1 += margin;
    var w = Math.max(8, Math.ceil((x1 - x0) / cell)), h = Math.max(8, Math.ceil((z1 - z0) / cell));
    var W = w * cell, H = h * cell;
    var data = new Uint16Array(w * h);
    var toHalf = THREE.DataUtils.toHalfFloat;

    for (var j = 0; j < h; j++) {
        var z = z0 + (j + 0.5) * cell;
        for (var ix = 0; ix < w; ix++) {
            var x = x0 + (ix + 0.5) * cell;
            var best = 40;
            for (k = 0; k < polys.length; k++) {
                var P = polys[k];
                var dx = x - P.cx, dz = z - P.cz;
                var rr = Math.sqrt(dx * dx + dz * dz);
                var a = Math.atan2(dz, dx); if (a < 0) a += Math.PI * 2;
                var f = a / (Math.PI * 2) * TAB, fi = Math.floor(f), ft = f - fi;
                var R = P.tab[fi] * (1 - ft) + P.tab[fi + 1] * ft;
                var gap = rr - R, d;
                if (Math.abs(gap) > 22) {
                    d = gap;                                  // jauh dari pantai: selisih radial sudah cukup
                } else {
                    var m2 = 1e9;
                    for (i = 0; i < N; i++) {
                        var ax = P.px[i], az = P.pz[i];
                        var bx = P.px[i + 1] - ax, bz = P.pz[i + 1] - az;
                        var t = ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz);
                        t = t < 0 ? 0 : (t > 1 ? 1 : t);
                        var ex = x - (ax + bx * t), ez = z - (az + bz * t);
                        var q = ex * ex + ez * ez;
                        if (q < m2) m2 = q;
                    }
                    d = Math.sqrt(m2); if (gap < 0) d = -d;
                }
                if (d < best) best = d;
            }
            data[j * w + ix] = toHalf(best);
        }
    }
    var tex = new THREE.DataTexture(data, w, h, THREE.RedFormat, THREE.HalfFloatType);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return { tex: tex, rect: [x0, z0, 1 / W, 1 / H] };
}

// ------------------------------------------------------------------
// Shader
// ------------------------------------------------------------------
var VERT = [
    'varying vec3 vW;',
    '#include <fog_pars_vertex>',
    'void main() {',
    '    vec4 wp = modelMatrix * vec4(position, 1.0);',
    '    vW = wp.xyz;',
    '    vec4 mvPosition = viewMatrix * wp;',
    '    gl_Position = projectionMatrix * mvPosition;',
    '    #include <fog_vertex>',
    '}'
].join('\n');

var FRAG = [
    'uniform float uTime;',
    'uniform sampler2D uSdf;',
    'uniform vec4 uRect;',
    'uniform vec3 uShallow, uMid, uDeep, uFoam, uSky, uSun;',
    'uniform vec3 uGlintDir;',
    'uniform float uDark, uGray, uChop, uGlint, uLit, uSunset;',
    'varying vec3 vW;',
    '#include <common>',
    '#include <fog_pars_fragment>',
    '',
    'float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'float vn(vec2 p) {',
    '    vec2 i = floor(p), f = fract(p);',
    '    f = f * f * (3.0 - 2.0 * f);',
    '    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);',
    '}',
    '',
    '// tinggi gelombang (satuan bebas): swell panjang + riak pendek yang bergeser',
    'float waveH(vec2 p, float t) {',
    '    float h = 0.0;',
    '    h += sin(dot(p, vec2(0.90, 0.42)) * 0.62 + t * 0.70) * 0.55;',
    '    h += sin(dot(p, vec2(-0.32, 0.95)) * 0.97 + t * 0.95 + 1.3) * 0.38;',
    '    h += sin(dot(p, vec2(0.62, -0.78)) * 1.63 + t * 1.30 + 2.1) * 0.22;',
    '    #if SEA_Q >= 1',
    '    h += (vn(p * 0.9 + vec2(t * 0.20, -t * 0.14)) - 0.5) * 0.42;',
    '    h += (vn(p * 2.3 - vec2(t * 0.28, t * 0.18)) - 0.5) * 0.14;',
    '    #endif',
    '    #if SEA_Q >= 2',
    '    h += sin(dot(p, vec2(-0.85, -0.5)) * 4.6 + t * 2.3 + 0.7) * 0.07;',
    '    h += (vn(p * 8.0 + vec2(-t * 0.5, t * 0.3)) - 0.5) * 0.07;',
    '    #endif',
    '    return h;',
    '}',
    '',
    'void main() {',
    '    vec2 p = vW.xz;',
    '    float t = uTime;',
    '',
    '    // jarak ke pantai dari SDF; di luar peta = laut dalam',
    '    vec2 uv = (p - uRect.xy) * uRect.zw;',
    '    float d = texture2D(uSdf, uv).r;',
    '    if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) d = 40.0;',
    '    float nz = vn(p * 0.33 + vec2(t * 0.035, t * 0.028));',
    '    float dd = d + (nz - 0.5) * 0.9;                       // garis pantai tidak kaku',
    '',
    '    // normal permukaan dari beda hingga',
    '    float amp = 0.21 * (1.0 + uChop * 1.7);',
    '    float e = 0.07;',
    '    // warp domain pelan-pelan agar pola gelombang tidak membentuk kisi yang berulang',
    '    vec2 pw = p + 3.2 * (vec2(vn(p * 0.085 + vec2(1.7, 8.3)), vn(p * 0.085 + vec2(5.1, 2.9))) - 0.5);',
    '    float h0 = waveH(pw, t);',
    '    float hx = waveH(pw + vec2(e, 0.0), t);',
    '    float hz = waveH(pw + vec2(0.0, e), t);',
    '    vec3 N = normalize(vec3(-(hx - h0) / e * amp, 1.0, -(hz - h0) / e * amp));',
    '    vec3 V = vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]);   // arah ke kamera (ortografik: konstan)',
    '',
    '    // warna menurut kedalaman: dangkal -> tengah -> dalam',
    '    vec3 col = mix(uShallow, uMid, smoothstep(0.2, 5.5, dd));',
    '    col = mix(col, uDeep, smoothstep(6.0, 19.0, dd) * 0.9);',
    '    col *= 0.93 + 0.14 * vn(p * 0.07 + 7.0 + vec2(t * 0.008, 0.0));   // bercak warna skala besar',
    '    col = mix(col, uShallow * vec3(1.06, 1.03, 0.88), (1.0 - smoothstep(0.0, 1.7, dd)) * 0.35);   // dasar berpasir',
    '    col *= uLit;',
    '',
    '    // caustic: jaring cahaya tipis di perairan dangkal',
    '    float c1 = vn(p * 1.25 + vec2(t * 0.32, t * 0.2));',
    '    float c2 = vn(p * 2.1 - vec2(t * 0.27, -t * 0.3));',
    '    float caus = pow(1.0 - abs(c1 - c2), 7.0);',
    '    col += uFoam * caus * 0.20 * (1.0 - smoothstep(0.8, 7.0, dd)) * (1.0 - uDark * 0.45) * (1.0 - uGray * 0.6);',
    '',
    '    // pantulan langit (fresnel; kamera isometrik rendah sehingga diperkuat)',
    '    float ndv = max(dot(N, V), 0.0);',
    '    float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);',
    '    col = mix(col, uSky * uLit, clamp(fres * 2.4 + 0.03, 0.0, 0.5));',
    '',
    '    // kilau matahari/bulan: titik-titik berkelip di puncak riak',
    '    vec3 H = normalize(uGlintDir + V);',
    '    float nh = max(dot(N, H), 0.0);',
    '    float tw = pow(vn(p * 3.2 + vec2(t * 0.9, -t * 0.6)), 2.0) * 1.25;',
    '    float spec = pow(nh, 320.0) * 1.5 * tw + pow(nh, 60.0) * 0.035;',
    '    col += uSun * spec * uGlint * smoothstep(0.3, 2.2, dd + 1.0);',
    '',
    '    // busa: swash tepi (maju-mundur) + garis ombak merambat ke pantai',
    '    float swash = 0.32 + 0.34 * (0.5 + 0.5 * sin(t * 0.8 + nz * 6.2832));',
    '    float fo = (1.0 - smoothstep(swash - 0.05, swash + 0.35, dd)) * smoothstep(-0.35, 0.0, dd);',
    '    float ph = dd * 0.52 + t * 0.10 + nz * 0.7;',
    '    float fr = fract(ph);',
    '    float line = smoothstep(0.0, 0.06, fr) * (1.0 - smoothstep(0.06, 0.30, fr));',
    '    float lmask = (1.0 - smoothstep(1.3, 6.8, dd)) * smoothstep(0.45, 1.1, dd);',
    '    float brk = vn(p * 2.1 + vec2(0.0, t * 0.22));',
    '    fo += line * lmask * smoothstep(0.30, 0.72, brk) * 0.85;',
    '',
    '    // buih tipis di laut terbuka (lebih banyak saat hujan)',
    '    float cap = smoothstep(0.62, 1.0, h0 + (vn(p * 5.2 + t * 0.4) - 0.5) * 0.45);',
    '    fo += cap * (0.025 + 0.45 * uChop) * smoothstep(3.0, 10.0, dd);',
    '',
    '    col = mix(col, uFoam * (0.78 + 0.22 * uLit), clamp(fo, 0.0, 1.0) * 0.92);',
    '',
    '    // cuaca & senja',
    '    float lum = dot(col, vec3(0.30, 0.59, 0.11));',
    '    col = mix(col, vec3(lum), uGray * 0.5);',
    '    col = mix(col, col * vec3(1.14, 0.90, 0.76) + uSun * 0.035, uSunset * 0.55);',
    '',
    '    gl_FragColor = vec4(col, 1.0);',
    '    #include <tonemapping_fragment>',
    '    #include <colorspace_fragment>',
    '    #include <fog_fragment>',
    '}'
].join('\n');

// ------------------------------------------------------------------
function hex(THREE, v) { return new THREE.Color(v); }

export function createSea(THREE, opts) {
    opts = opts || {};
    var islands = opts.islands || [];
    var tier = opts.quality || 'medium';
    var pal = Object.assign({}, DEFAULT_PALETTE, opts.palette || {});
    var q = tier === 'low' ? 0 : (tier === 'high' ? 2 : 1);
    var cell = tier === 'low' ? 0.8 : (tier === 'high' ? 0.4 : 0.5);

    var sdf = buildSdf(THREE, islands, cell);
    var size = opts.size || 600;

    var uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
        uTime:   { value: 7.3 },
        uSdf:    { value: sdf.tex },
        uRect:   { value: new THREE.Vector4(sdf.rect[0], sdf.rect[1], sdf.rect[2], sdf.rect[3]) },
        uShallow: { value: hex(THREE, pal.shallow[0]) },
        uMid:    { value: hex(THREE, pal.ocean[0]) },
        uDeep:   { value: hex(THREE, pal.ocean[0]) },
        uFoam:   { value: hex(THREE, pal.foam[0]) },
        uSky:    { value: hex(THREE, pal.sky[0]) },
        uSun:    { value: hex(THREE, pal.sun[0]) },
        // arah "matahari" untuk kilau: dipilih agar sudut separuh-vektor dengan kamera isometrik
        // jatuh dekat normal datar -> kilau muncul di puncak riak, bukan hanya di lereng curam.
        uGlintDir: { value: new THREE.Vector3(-0.325, 0.715, -0.585).normalize() },
        uDark:   { value: 0 },
        uGray:   { value: 0 },
        uChop:   { value: 0 },
        uGlint:  { value: 1 },
        uLit:    { value: LIT.light },
        uSunset: { value: 0 }
    }]);

    var mat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: VERT,
        fragmentShader: FRAG,
        defines: { SEA_Q: q },
        fog: true,
        depthWrite: true
    });

    var geo = new THREE.PlaneGeometry(size, size, 1, 1);
    geo.rotateX(-Math.PI / 2);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(opts.cx || 0, WATER_Y, opts.cz || 0);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    mesh.renderOrder = -1;                       // laut digambar lebih dulu; objek lain menimpanya
    mesh.frustumCulled = false;

    var night = 0, kind = 'clear', sunset = 0, disposed = false;   // night: 0 siang .. 1 malam (siklus siang-malam)
    var deepMul = new THREE.Color(), cB = new THREE.Color();

    // pair = [terang, gelap] (hex) -> campuran pada tingkat malam saat ini
    function mixPair(target, pair) { return target.setHex(pair[0]).lerp(cB.setHex(pair[1]), night); }

    function apply() {
        var u = uniforms;
        mixPair(u.uShallow.value, pal.shallow);
        mixPair(u.uMid.value, pal.ocean);
        deepMul.setRGB(0.55, 0.68, 0.86);        // laut dalam: lebih gelap & biru dari warna dasar
        mixPair(u.uDeep.value, pal.ocean).multiply(deepMul);
        mixPair(u.uFoam.value, pal.foam);
        mixPair(u.uSky.value, pal.sky);
        mixPair(u.uSun.value, pal.sun);
        u.uDark.value = night;
        var wx = WEATHER[kind] || WEATHER.clear;
        u.uGray.value = wx[0];
        u.uChop.value = wx[1];
        u.uGlint.value = wx[2] * (1 - 0.45 * night) * (1 - sunset * 0.2);
        u.uLit.value = (LIT.light + (LIT.dark - LIT.light) * night) * wx[3] * (1 - sunset * 0.06);
        u.uSunset.value = sunset;
    }
    apply();

    return {
        mesh: mesh,
        material: mat,
        // n: boolean (tema lama) atau 0..1 (tingkat malam).
        setTheme: function (n) {
            n = +n || 0;
            if (disposed || Math.abs(night - n) < 0.004) return;
            night = Math.max(0, Math.min(1, n));
            apply();
        },
        // kondisi langit; murah, keluar cepat bila tidak berubah. Waktu animasi TIDAK disentuh.
        setWeather: function (weatherKind, sunset01) {
            if (disposed) return;
            var s = sunset01 || 0;
            if ((weatherKind && weatherKind !== kind) || Math.abs(s - sunset) > 0.01) {
                if (weatherKind) kind = weatherKind;
                sunset = s;
                apply();
            }
        },
        // sec: detik (performance.now()/1000); kind & sunset dari createWeather().
        update: function (sec, weatherKind, sunset01) {
            if (disposed) return;
            this.setWeather(weatherKind, sunset01);
            uniforms.uTime.value = sec;
        },
        dispose: function () {
            if (disposed) return;
            disposed = true;
            geo.dispose();
            mat.dispose();
            sdf.tex.dispose();
        }
    };
}
