// FILE: src/ui/campus/CampusPost.js  (BARU — v2027.72: pasca-proses "premium" peta kampus)
// Hanya dipakai pada tier kualitas 'high' (desktop). Tier lain tetap memakai render langsung (tanpa biaya tambahan).
// Alur per frame:
//   1. scene -> render target HDR (+ MSAA)            : cahaya tetap linear, belum di-tone-map
//   2. ambang terang (bright pass)                    : hanya bagian paling terang (jendela malam, papan nama, kilau)
//   3. blur gaussian terpisah (H lalu V) pada 1/2 res : bloom lembut, murah
//   4. komposit ke layar                              : bloom + tone mapping ACES (rumus sama dengan three.js)
//                                                       + grading (saturasi, kontras, tint malam) + encode sRGB
// Catatan:
//  - Hanya memakai three.js inti (tanpa addon EffectComposer dari CDN), jadi tidak ada impor tambahan.
//  - Alpha canvas dijaga: kanvas transparan tetap transparan (CSS di belakang tetap terlihat).
//  - Tanpa HDR (EXT_color_buffer_float tidak tersedia) target memakai 8-bit: bloom tetap ada tapi lebih lembut.
//  - Matikan untuk QA: tambahkan ?campuspost=0 pada URL.

var VERT = [
    'varying vec2 vUv;',
    'void main() {',
    '    vUv = uv;',
    '    gl_Position = vec4(position.xy, 0.0, 1.0);',
    '}'
].join('\n');

var BRIGHT_FRAG = [
    'uniform sampler2D tDiffuse;',
    'uniform float uThr;',
    'varying vec2 vUv;',
    'void main() {',
    '    vec4 c = texture2D(tDiffuse, vUv);',
    '    gl_FragColor = vec4(max(c.rgb - vec3(uThr), vec3(0.0)), 1.0);',
    '}'
].join('\n');

var BLUR_FRAG = [
    'uniform sampler2D tDiffuse;',
    'uniform vec2 uDir;',
    'varying vec2 vUv;',
    'void main() {',
    '    vec3 s = texture2D(tDiffuse, vUv).rgb * 0.2270270270;',
    '    s += texture2D(tDiffuse, vUv + uDir * 1.3846153846).rgb * 0.3162162162;',
    '    s += texture2D(tDiffuse, vUv - uDir * 1.3846153846).rgb * 0.3162162162;',
    '    s += texture2D(tDiffuse, vUv + uDir * 3.2307692308).rgb * 0.0702702703;',
    '    s += texture2D(tDiffuse, vUv - uDir * 3.2307692308).rgb * 0.0702702703;',
    '    gl_FragColor = vec4(s, 1.0);',
    '}'
].join('\n');

// Komposit: lihat catatan di atas. Warna scene disimpan premultiplied (alpha canvas).
var COMP_FRAG = [
    'uniform sampler2D tScene;',
    'uniform sampler2D tBloom;',
    'uniform float uBloom;',
    'uniform float uExposure;',
    'uniform float uSat;',
    'uniform float uContrast;',
    'uniform vec3 uTint;',
    'varying vec2 vUv;',
    '',
    '// Rumus ACES filmic yang sama dengan three.js (tonemapping_pars_fragment).',
    'const mat3 ACESInputMat = mat3(',
    '    vec3(0.59719, 0.07600, 0.02840),',
    '    vec3(0.35458, 0.90834, 0.13383),',
    '    vec3(0.04823, 0.01566, 0.83777)',
    ');',
    'const mat3 ACESOutputMat = mat3(',
    '    vec3( 1.60475, -0.10208, -0.00327),',
    '    vec3(-0.53108,  1.10813, -0.07276),',
    '    vec3(-0.07367, -0.00605,  1.07602)',
    ');',
    'vec3 RRTAndODTFit(vec3 v) {',
    '    vec3 a = v * (v + 0.0245786) - 0.000090537;',
    '    vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;',
    '    return a / b;',
    '}',
    'vec3 acesFilmic(vec3 color) {',
    '    color *= uExposure / 0.6;',
    '    color = ACESInputMat * color;',
    '    color = RRTAndODTFit(color);',
    '    color = ACESOutputMat * color;',
    '    return clamp(color, 0.0, 1.0);',
    '}',
    'vec3 toSRGB(vec3 c) {',
    '    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));',
    '}',
    '',
    'void main() {',
    '    vec4 s = texture2D(tScene, vUv);',
    '    vec3 b = texture2D(tBloom, vUv).rgb * uBloom;',
    '    float bMax = max(b.r, max(b.g, b.b));',
    '    float A = clamp(max(s.a, bMax), 0.0, 1.0);',
    '    if (A <= 0.0001) { gl_FragColor = vec4(0.0); return; }',
    '    vec3 c = (s.rgb + b) / A;                       // warna lurus (buang premultiply)',
    '    c = acesFilmic(c);',
    '    float L = dot(c, vec3(0.2126, 0.7152, 0.0722));',
    '    c = mix(vec3(L), c, uSat);                      // saturasi',
    '    c = (c - 0.5) * uContrast + 0.5;                // kontras',
    '    c = clamp(c * uTint, 0.0, 1.0);                 // tint (lebih dingin saat malam)',
    '    c = toSRGB(c);',
    '    gl_FragColor = vec4(c * A, A);                  // kembali premultiplied',
    '}'
].join('\n');

function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
function lerp(a, b, t) { return a + (b - a) * t; }

export function createCampusPost(THREE, renderer, opts) {
    opts = opts || {};
    var hdr = false;
    try { hdr = !!renderer.getContext().getExtension('EXT_color_buffer_float'); } catch (e) { hdr = false; }
    var type = hdr ? THREE.HalfFloatType : THREE.UnsignedByteType;
    var sceneRT = new THREE.WebGLRenderTarget(4, 4, { type: type, samples: opts.samples || 0, depthBuffer: true });
    var halfOpts = { type: type, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
    var brightRT = new THREE.WebGLRenderTarget(2, 2, halfOpts);
    var blurRT = new THREE.WebGLRenderTarget(2, 2, halfOpts);
    var bloomRT = new THREE.WebGLRenderTarget(2, 2, halfOpts);

    var quadGeo = new THREE.PlaneGeometry(2, 2);
    var quadScene = new THREE.Scene();
    var quad = new THREE.Mesh(quadGeo, null);
    quad.frustumCulled = false;                 // posisi dihitung di shader, bukan lewat kamera
    quadScene.add(quad);
    var quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    function mat(frag, uniforms) {
        return new THREE.ShaderMaterial({ uniforms: uniforms, vertexShader: VERT, fragmentShader: frag, depthTest: false, depthWrite: false });
    }
    var brightMat = mat(BRIGHT_FRAG, { tDiffuse: { value: null }, uThr: { value: 1.15 } });
    var blurMat = mat(BLUR_FRAG, { tDiffuse: { value: null }, uDir: { value: new THREE.Vector2() } });
    var compMat = mat(COMP_FRAG, {
        tScene: { value: null }, tBloom: { value: null },
        uBloom: { value: 0.35 }, uExposure: { value: 1 }, uSat: { value: 1.07 },
        uContrast: { value: 1.04 }, uTint: { value: new THREE.Vector3(1, 1, 1) }
    });

    var texX = 0.5, texY = 0.5, spread = 1.6;

    function pass(material, target) {
        quad.material = material;
        renderer.setRenderTarget(target);
        renderer.render(quadScene, quadCam);
    }

    // Satu frame: scene -> HDR -> bloom -> komposit ke kanvas.
    function render(scene, camera) {
        renderer.setRenderTarget(sceneRT);
        renderer.render(scene, camera);

        brightMat.uniforms.tDiffuse.value = sceneRT.texture;
        pass(brightMat, brightRT);

        blurMat.uniforms.tDiffuse.value = brightRT.texture;
        blurMat.uniforms.uDir.value.set(texX * spread, 0);
        pass(blurMat, blurRT);

        blurMat.uniforms.tDiffuse.value = blurRT.texture;
        blurMat.uniforms.uDir.value.set(0, texY * spread);
        pass(blurMat, bloomRT);

        compMat.uniforms.tScene.value = sceneRT.texture;
        compMat.uniforms.tBloom.value = bloomRT.texture;
        compMat.uniforms.uExposure.value = renderer.toneMappingExposure;
        pass(compMat, null);
    }

    // Ukuran dalam piksel perangkat (sama dengan ukuran kanvas).
    function setSize(w, h) {
        w = Math.max(1, Math.floor(w));
        h = Math.max(1, Math.floor(h));
        var hw = Math.max(1, w >> 1), hh = Math.max(1, h >> 1);
        sceneRT.setSize(w, h);
        brightRT.setSize(hw, hh);
        blurRT.setSize(hw, hh);
        bloomRT.setSize(hw, hh);
        texX = 1 / hw;
        texY = 1 / hh;
    }

    // Tingkat malam 0..1: siang = bloom tipis & warna jernih; malam = glow lebih kuat & tint dingin.
    function setNight(n) {
        n = clamp01(+n || 0);
        brightMat.uniforms.uThr.value = lerp(1.15, 0.9, n);
        compMat.uniforms.uBloom.value = lerp(0.35, 0.65, n);
        compMat.uniforms.uSat.value = lerp(1.07, 1.0, n);
        compMat.uniforms.uContrast.value = lerp(1.04, 1.02, n);
        compMat.uniforms.uTint.value.set(lerp(1, 0.94, n), lerp(1, 0.97, n), lerp(1, 1.05, n));
    }

    setNight(0);

    return {
        hdr: hdr,
        render: render,
        setSize: setSize,
        setNight: setNight,
        dispose: function () {
            renderer.setRenderTarget(null);
            sceneRT.dispose();
            brightRT.dispose();
            blurRT.dispose();
            bloomRT.dispose();
            quadGeo.dispose();
            brightMat.dispose();
            blurMat.dispose();
            compMat.dispose();
        }
    };
}
