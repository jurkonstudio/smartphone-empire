// FILE: src/ui/campus/CinematicFx.js
// Sentuhan sinematik murah untuk peta 3D (Kampus & Manufaktur). Tanpa EffectComposer / post-processing.
//   1) Vignette   : overlay CSS radial-gradient (pointer-events: none). Lebih kuat di tema gelap, hangat saat senja.
//                   Tidak dibuat di tier 'low' (mode hemat).
//   2) Bloom lampu: satu THREE.Points aditif (satu draw call) di lampu jalan / papan nama. Hanya tier medium/high,
//                   hanya saat tema gelap atau senja. Ukuran mengikuti zoom (piksel per unit dunia).
//   3) Kabut jarak: faktor haze untuk siluet pulau tetangga (dipakai lewat onHaze -> far.setHaze di IslandLink.js).
//                   scene.fog TIDAK disentuh (tetap milik CampusWeather.applyFog).
// Statis: tidak ada animasi, jadi aman untuk prefers-reduced-motion. dispose() membuang semuanya.

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function mixRgb(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function rgbHex(c) { return ((Math.round(c[0]) & 255) << 16) | ((Math.round(c[1]) & 255) << 8) | (Math.round(c[2]) & 255); }

// Vignette per tema: [r,g,b] dan kekuatan dasar.
var VIG = { light: { rgb: [20, 28, 48], a: 0.10 }, dark: { rgb: [2, 4, 12], a: 0.34 } };
var VIG_WARM = [70, 30, 20];
var VIG_WEATHER = { clear: 0, sunny: -0.02, overcast: 0.04, rain: 0.07, snow: 0.03 };

// Haze siluet tetangga: warna langit pucat (terang) / biru malam (gelap); makin kuat saat cuaca berkabut.
var HAZE = { light: [219, 231, 243], dark: [20, 32, 58] };
var HAZE_AMT = { clear: 0.2, sunny: 0.16, overcast: 0.3, rain: 0.34, snow: 0.34 };
var HAZE_WARM = [232, 184, 150];

// Kekuatan bloom per cuaca (kabut membuat cahaya lebih menyebar).
var BLOOM_WEATHER = { clear: 1, sunny: 0.9, overcast: 1.05, rain: 1.15, snow: 1.1 };

var VERT = [
    'attribute float aSize;',
    'attribute vec3 aColor;',
    'uniform float uPx;',
    'uniform float uMax;',
    'varying vec3 vCol;',
    'void main() {',
    '    vCol = aColor;',
    '    gl_PointSize = clamp(aSize * uPx, 2.0, uMax);',
    '    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}'
].join('\n');

var FRAG = [
    'uniform float uI;',
    'varying vec3 vCol;',
    'void main() {',
    '    vec2 d = gl_PointCoord - 0.5;',
    '    float r = length(d) * 2.0;',
    '    float a = exp(-r * r * 4.5) * (1.0 - smoothstep(0.8, 1.0, r));',
    '    gl_FragColor = vec4(vCol, a * uI);',
    '    #include <colorspace_fragment>',
    '}'
].join('\n');

function readMaxPoint(renderer) {
    try {
        var gl = renderer.getContext();
        var r = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
        if (r && r[1] > 8) return Math.min(128, r[1]);
    } catch (e) {}
    return 64;
}

// opts: {
//   renderer, canvas, container,
//   tier: 'low' | 'medium' | 'high',
//   lights: [{ x, y, z, size, color, k }]   // size = diameter glow (unit dunia); k = pengali kekuatan (opsional)
//   viewDir: [x,y,z]                        // arah dari scene ke kamera (default 1,1,1); glow digeser sedikit ke arah ini
//   onHaze: function (hexColor, amount)     // dipanggil saat haze berubah
// }
export function createCinematic(THREE, scene, opts) {
    var tier = opts.tier || 'medium';
    var saver = tier === 'low';
    var container = opts.container, canvas = opts.canvas;
    var dark = false, kind = 'clear', sunset = 0, px = 0;
    var disposed = false;

    // ---------- vignette ----------
    var vig = null;
    if (!saver && container) {
        try {
            if (window.getComputedStyle(container).position === 'static') container.style.position = 'relative';
        } catch (e) {}
        vig = document.createElement('div');
        vig.setAttribute('aria-hidden', 'true');
        vig.className = 'cine-vignette';
        vig.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;';
        if (canvas && canvas.parentNode === container) container.insertBefore(vig, canvas.nextSibling);
        else container.appendChild(vig);
    }

    // ---------- bloom lampu ----------
    var lights = (opts.lights || []).slice();
    var bloom = null, bloomMat = null, bloomGeo = null;
    if (!saver && lights.length) {
        var vd = opts.viewDir || [1, 1, 1];
        var vl = Math.hypot(vd[0], vd[1], vd[2]) || 1;
        var SHIFT = 0.6;      // geser ke arah kamera agar glow tidak kalah uji-kedalaman terhadap kepala lampunya sendiri
        var sx = vd[0] / vl * SHIFT, sy = vd[1] / vl * SHIFT, sz = vd[2] / vl * SHIFT;
        var n = lights.length;
        var pos = new Float32Array(n * 3), col = new Float32Array(n * 3), siz = new Float32Array(n);
        var tmp = new THREE.Color(), boost = tier === 'high' ? 1.2 : 1;
        for (var i = 0; i < n; i++) {
            var L = lights[i];
            pos[i * 3] = L.x + sx; pos[i * 3 + 1] = L.y + sy; pos[i * 3 + 2] = L.z + sz;
            tmp.setHex(L.color === undefined ? 0xffc872 : L.color);
            var k = L.k === undefined ? 1 : L.k;
            col[i * 3] = tmp.r * k; col[i * 3 + 1] = tmp.g * k; col[i * 3 + 2] = tmp.b * k;
            siz[i] = (L.size || 1.8) * boost;
        }
        bloomGeo = new THREE.BufferGeometry();
        bloomGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        bloomGeo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
        bloomGeo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
        bloomMat = new THREE.ShaderMaterial({
            uniforms: { uPx: { value: 30 }, uMax: { value: readMaxPoint(opts.renderer) }, uI: { value: 0 } },
            vertexShader: VERT,
            fragmentShader: FRAG,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true,
            fog: false
        });
        bloom = new THREE.Points(bloomGeo, bloomMat);
        bloom.frustumCulled = false;      // posisi titik tersebar; satu draw call murah
        bloom.renderOrder = 20;           // di atas laut/bangunan transparan
        bloom.visible = false;
        scene.add(bloom);
    }

    // ---------- keadaan -> tampilan ----------
    function sunsetNow() { return clamp01(sunset); }

    function applyLook() {
        var s = sunsetNow();
        var wk = VIG_WEATHER[kind] || 0;

        if (vig) {
            var base = dark ? VIG.dark : VIG.light;
            var rgb = mixRgb(base.rgb, VIG_WARM, 0.5 * s);
            var a = clamp01(base.a + wk + 0.06 * s);
            var c = Math.round(rgb[0]) + ',' + Math.round(rgb[1]) + ',' + Math.round(rgb[2]);
            vig.style.background = 'radial-gradient(ellipse at 50% 50%, rgba(' + c + ',0) 52%, rgba(' + c + ',' + a.toFixed(3) + ') 100%)';
        }

        if (bloom) {
            var night = dark ? 1 : s * 0.55;
            var I = night * (BLOOM_WEATHER[kind] || 1) * 0.85;
            bloomMat.uniforms.uI.value = I;
            bloom.visible = I > 0.02;
        }

        if (opts.onHaze) {
            var hc = mixRgb(dark ? HAZE.dark : HAZE.light, HAZE_WARM, (dark ? 0.12 : 0.35) * s);
            var amt = clamp01((HAZE_AMT[kind] === undefined ? 0.2 : HAZE_AMT[kind]) + (dark ? 0.06 : 0) + 0.06 * s);
            opts.onHaze(rgbHex(hc), amt);
        }
    }

    applyLook();

    return {
        points: bloom,
        setTheme: function (d) {
            if (disposed) return;
            d = !!d;
            if (d === dark) return;
            dark = d;
            applyLook();
        },
        // Dipanggil tiap render: murah (hanya bandingkan nilai). pxPerUnit = tinggi buffer render / tinggi kamera ortografik.
        update: function (pxPerUnit, k, s) {
            if (disposed) return;
            if (bloomMat && pxPerUnit > 0 && Math.abs(pxPerUnit - px) > 0.01) {
                px = pxPerUnit;
                bloomMat.uniforms.uPx.value = pxPerUnit;
            }
            s = s || 0;
            if ((k && k !== kind) || Math.abs(s - sunset) > 0.01) {
                if (k) kind = k;
                sunset = s;
                applyLook();
            }
        },
        dispose: function () {
            if (disposed) return;
            disposed = true;
            if (vig && vig.parentNode) vig.parentNode.removeChild(vig);
            if (bloom) scene.remove(bloom);
            if (bloomGeo) bloomGeo.dispose();
            if (bloomMat) bloomMat.dispose();
        }
    };
}
