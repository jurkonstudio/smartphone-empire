// FILE: src/ui/campus/CampusWeather.js
// Cuaca (cerah / hujan / salju) dan senja untuk peta 3D Kampus dan Manufaktur.
// Dipakai bersama oleh CampusScene.js dan ManufactureScene.js.
//
// Aturan desain:
//  - Cuaca OTOMATIS: deterministik per blok 30 menit (jam dinding perangkat); tanpa kontrol UI.
//  - Senja mengikuti JAM LOKAL perangkat: 0 sebelum 16.5, naik ke 1 pada 18.0, turun ke 0 pada 19.5.
//  - Uji lewat URL: ?weather=clear|rain|snow dan ?sunset=0..1
//  - Posisi matahari TIDAK diubah (shadow map dibekukan); hanya warna dan intensitas cahaya.
//  - Hujan (rev. 2): angin berhembus pelan (berubah tiap detik), tetes ukuran berbeda (kecepatan dan
//    panjang goresan mengikuti ukuran), setiap tetes menyentuh tanah memicu percikan kecil yang
//    memudar. Semua lewat satu LineSegments dan satu Points; tanpa mesh baru.
//  - Partikel hanya bergerak saat ambien hidup (ambien mati = diam).

var BLOCK_MS = 30 * 60 * 1000;
var CHECK_EVERY = 20;       // detik: seberapa sering cuaca/senja dicek ulang
var RAIN_COUNT = { low: 260, medium: 520, high: 900 };
var SNOW_COUNT = { low: 200, medium: 360, high: 600 };
var SPLASH_COUNT = { low: 40, medium: 80, high: 140 };
var SPLASH_CHANCE = { low: 0.3, medium: 0.45, high: 0.6 };  // peluang tetes menimbulkan percikan
var BOX_H = 18;
var SPLASH_LIFE = 0.22;     // detik
var SPLASH_RISE = 0.06;     // tinggi tambahan percikan selama hidupnya

// ---------- fungsi murni ----------

function hash01(n) {
    var h = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}

export function blockOf(nowMs) { return Math.floor(nowMs / BLOCK_MS); }

// Deterministik: sekitar 60% cerah, 30% hujan, 10% salju.
export function weatherForBlock(block) {
    var r = hash01(block);
    if (r < 0.6) return 'clear';
    if (r < 0.9) return 'rain';
    return 'snow';
}

export function readOverride(search) {
    var out = { weather: null, sunset: null };
    var s = String(search || '');
    var w = /[?&]weather=(clear|rain|snow)(?:&|$)/.exec(s);
    if (w) out.weather = w[1];
    var m = /[?&]sunset=([0-9]*\.?[0-9]+)(?:&|$)/.exec(s);
    if (m) {
        var v = parseFloat(m[1]);
        if (isFinite(v)) out.sunset = Math.max(0, Math.min(1, v));
    }
    return out;
}

// Angin: kemiringan horizontal hujan (dx per satuan panjang goresan). Gabungan beberapa gelombang
// lambat supaya tidak berulang dan terasa seperti hembusan yang naik-turun.
export function windAt(sec) {
    var s = sec || 0;
    var v = 0.1 + 0.05 * Math.sin(s * 0.21) + 0.035 * Math.sin(s * 0.63 + 1.3) + 0.02 * Math.sin(s * 1.7 + 0.4);
    return Math.max(0.02, v);
}

// hour: jam lokal desimal (mis. 17.25 = 17:15).
export function sunsetAmount(hour) {
    if (!(hour >= 16.5) || hour >= 19.5) return 0;
    if (hour <= 18) return (hour - 16.5) / 1.5;
    return (19.5 - hour) / 1.5;
}

export function mixHex(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    var ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
    var br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
    var r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), bl = Math.round(ab + (bb - ab) * t);
    return (r << 16) | (g << 8) | bl;
}

function lum(hex) {
    return (((hex >> 16) & 255) * 0.3 + ((hex >> 8) & 255) * 0.59 + (hex & 255) * 0.11) / 255;
}

function smooth01(v) { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); }

// look: objek dari CAMPUS_LOOK.light/dark. Mengembalikan nilai cahaya + kabut akhir (objek baru).
export function weatherLook(look, kind, sunset) {
    var s = Math.max(0, Math.min(1, sunset || 0));
    var o = {
        hemiSky: look.hemiSky, hemiGround: look.hemiGround, hemiI: look.hemiI,
        sunCol: look.sunCol, sunI: look.sunI,
        fillCol: look.fillCol, fillI: look.fillI,
        rimCol: look.rimCol, rimI: look.rimI,
        fogOn: false, fogCol: 0, fogNear: 0, fogFar: 0
    };
    var dark = lum(look.hemiSky) < 0.6;
    if (kind === 'rain') {
        o.sunI *= 0.45; o.hemiI *= 0.85; o.fillI *= 0.7; o.rimI *= 0.6;
        o.hemiSky = mixHex(o.hemiSky, 0x9aa6b8, 0.5);
        o.sunCol = mixHex(o.sunCol, 0xc9d3e0, 0.5);
        o.fogOn = true; o.fogNear = 34; o.fogFar = 100;
        o.fogCol = mixHex(look.hemiGround, o.hemiSky, dark ? 0.3 : 0.7);
    } else if (kind === 'snow') {
        o.sunI *= 0.6; o.hemiI *= 1.2; o.rimI *= 0.8;
        o.hemiSky = mixHex(o.hemiSky, 0xf0f5ff, 0.4);
        o.sunCol = mixHex(o.sunCol, 0xdfe8f5, 0.4);
        o.fogOn = true; o.fogNear = 30; o.fogFar = 85;
        o.fogCol = mixHex(look.hemiGround, 0xe3eaf3, dark ? 0.3 : 0.8);
    }
    if (s > 0) {
        o.sunCol = mixHex(o.sunCol, 0xff9a52, 0.75 * s);
        o.sunI *= 1 - 0.18 * s;
        o.hemiSky = mixHex(o.hemiSky, 0xffc9a0, 0.35 * s);
        o.hemiGround = mixHex(o.hemiGround, 0x8a6a5a, 0.25 * s);
        o.fillCol = mixHex(o.fillCol, 0x9db4e8, 0.5 * s);
        o.rimCol = mixHex(o.rimCol, 0xffb88a, 0.3 * s);
        if (o.fogOn) o.fogCol = mixHex(o.fogCol, 0xc79a80, 0.25 * s);
    }
    return o;
}

function wrapAround(v, c, h) {
    var span = 2 * h;
    return c + ((((v - c + h) % span) + span) % span - h);
}

function circleTexture(THREE) {
    try {
        var cv = document.createElement('canvas');
        cv.width = 32; cv.height = 32;
        var g = cv.getContext && cv.getContext('2d');
        if (!g) return null;
        var gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
        gr.addColorStop(0, 'rgba(255,255,255,1)');
        gr.addColorStop(0.6, 'rgba(255,255,255,0.85)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr;
        g.fillRect(0, 0, 32, 32);
        return new THREE.CanvasTexture(cv);
    } catch (e) { return null; }
}

// ---------- adegan ----------
// opts: { lights:{hemi,sun,fill,rim}, tier:'low|medium|high', getCenter():{x,z}, getHalf():number,
//         onChange():void, now():ms, search:string }
export function createWeather(THREE, scene, opts) {
    opts = opts || {};
    var lights = opts.lights || null;
    var tier = RAIN_COUNT[opts.tier] ? opts.tier : 'medium';
    var getCenter = opts.getCenter || function () { return { x: 0, z: 0 }; };
    var getHalf = opts.getHalf || function () { return 16; };
    var nowFn = opts.now || Date.now;
    var search = opts.search;
    if (search === undefined) { try { search = location.search; } catch (e) { search = ''; } }
    var over = readOverride(search);

    var kind = 'clear', sunset = 0, lastLook = null, lastCheck = -1e9, lastSec = null, disposed = false;
    var fogObj = null, rainTheme = null, wind = windAt(0);

    function setDyn(attr) { if (THREE.DynamicDrawUsage !== undefined && attr.setUsage) attr.setUsage(THREE.DynamicDrawUsage); }
    function palette() {
        return rainTheme === 'dark'
            ? { base: [0.82, 0.87, 0.94], bg: [0, 0, 0] }
            : { base: [0.29, 0.35, 0.45], bg: [0.96, 0.97, 0.99] };
    }
    function blendFor(th) { return th === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending; }

    // --- hujan ---
    var nR = RAIN_COUNT[tier];
    var rainPos = new Float32Array(nR * 3), rainSp = new Float32Array(nR), rainLen = new Float32Array(nR);
    var rainBr = new Float32Array(nR), rainK = new Float32Array(nR);
    var rainSeg = new Float32Array(nR * 6), rainCol = new Float32Array(nR * 6);
    var rainGeo = new THREE.BufferGeometry();
    var rainAttr = new THREE.BufferAttribute(rainSeg, 3);
    var rainColAttr = new THREE.BufferAttribute(rainCol, 3);
    setDyn(rainAttr); setDyn(rainColAttr);
    rainGeo.setAttribute('position', rainAttr);
    rainGeo.setAttribute('color', rainColAttr);
    // Warna per tetes (vertex color) memudar ke latar di tepi kotak dan di puncak kotak.
    // Mode gelap = additive (hitam tak terlihat); mode terang = normal (putih tak terlihat).
    var rainMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, fog: false });
    var rain = new THREE.LineSegments(rainGeo, rainMat);
    rain.frustumCulled = false; rain.visible = false; rain.renderOrder = 50;
    scene.add(rain);

    // --- percikan di tanah (pool melingkar; percikan lama ditimpa) ---
    var nP = SPLASH_COUNT[tier], splashChance = SPLASH_CHANCE[tier];
    var spPos = new Float32Array(nP * 3), spCol = new Float32Array(nP * 3);
    var spAge = new Float32Array(nP), spBr = new Float32Array(nP), spNext = 0;
    var spGeo = new THREE.BufferGeometry();
    var spPosAttr = new THREE.BufferAttribute(spPos, 3), spColAttr = new THREE.BufferAttribute(spCol, 3);
    setDyn(spPosAttr); setDyn(spColAttr);
    spGeo.setAttribute('position', spPosAttr);
    spGeo.setAttribute('color', spColAttr);
    var spMat = new THREE.PointsMaterial({ vertexColors: true, size: 2.5, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false, fog: false });
    var splash = new THREE.Points(spGeo, spMat);
    splash.frustumCulled = false; splash.visible = false; splash.renderOrder = 51;
    scene.add(splash);
    for (var q = 0; q < nP; q++) spAge[q] = SPLASH_LIFE;   // semua mati di awal

    // --- salju ---
    var nS = SNOW_COUNT[tier];
    var snowPos = new Float32Array(nS * 3), snowPh = new Float32Array(nS), snowSp = new Float32Array(nS);
    var snowGeo = new THREE.BufferGeometry();
    var snowAttr = new THREE.BufferAttribute(snowPos, 3);
    setDyn(snowAttr);
    snowGeo.setAttribute('position', snowAttr);
    var snowTex = circleTexture(THREE);
    var snowMat = new THREE.PointsMaterial({ color: 0xffffff, size: 4, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false, fog: false });
    if (snowTex) snowMat.map = snowTex;
    var snow = new THREE.Points(snowGeo, snowMat);
    snow.frustumCulled = false; snow.visible = false; snow.renderOrder = 50;
    scene.add(snow);

    function seedBox(c, h) {
        var i;
        for (i = 0; i < nR; i++) {
            rainPos[i * 3] = c.x + (Math.random() * 2 - 1) * h;
            rainPos[i * 3 + 1] = Math.random() * BOX_H;
            rainPos[i * 3 + 2] = c.z + (Math.random() * 2 - 1) * h;
            var s = Math.random();                              // ukuran tetes 0 (kecil) .. 1 (besar)
            rainSp[i] = 15 + 10 * s + Math.random() * 3;        // besar = lebih cepat
            rainLen[i] = 0.5 + 0.8 * s + Math.random() * 0.3;   // besar = goresan lebih panjang
            rainBr[i] = 0.3 + 0.7 * (0.5 * Math.random() + 0.5 * s);
            rainK[i] = 0.85 + 0.3 * Math.random();              // variasi kemiringan per tetes
        }
        for (i = 0; i < nS; i++) {
            snowPos[i * 3] = c.x + (Math.random() * 2 - 1) * h;
            snowPos[i * 3 + 1] = Math.random() * BOX_H;
            snowPos[i * 3 + 2] = c.z + (Math.random() * 2 - 1) * h;
            snowPh[i] = Math.random() * 6.283;
            snowSp[i] = 1.2 + Math.random() * 0.9;
        }
        writeRain();
        snowAttr.needsUpdate = true;
    }

    function writeRain() {
        var c = getCenter(), h = halfBox(), p = palette();
        for (var i = 0; i < nR; i++) {
            var x = rainPos[i * 3], y = rainPos[i * 3 + 1], z = rainPos[i * 3 + 2];
            var k = i * 6, L = rainLen[i], dx = -wind * rainK[i] * L;
            rainSeg[k] = x; rainSeg[k + 1] = y; rainSeg[k + 2] = z;
            rainSeg[k + 3] = x + dx; rainSeg[k + 4] = y + L; rainSeg[k + 5] = z;
            // pudar di tepi kotak (sumbu x & z) dan di dekat puncak kotak
            var ex = 1 - Math.abs(x - c.x) / h, ez = 1 - Math.abs(z - c.z) / h;
            var ey = 1 - Math.max(0, y - (BOX_H - 4)) / 4;
            var fade = smooth01(Math.min(ex, ez) / 0.3) * smooth01(ey) * rainBr[i];
            // ujung atas (kepala) goresan lebih terang dari ekor: kesan gerak
            for (var j = 0; j < 2; j++) {
                var t = j === 0 ? fade : fade * 0.55, o = k + j * 3;
                rainCol[o] = p.bg[0] + (p.base[0] - p.bg[0]) * t;
                rainCol[o + 1] = p.bg[1] + (p.base[1] - p.bg[1]) * t;
                rainCol[o + 2] = p.bg[2] + (p.base[2] - p.bg[2]) * t;
            }
        }
        rainAttr.needsUpdate = true;
        rainColAttr.needsUpdate = true;
    }

    function spawnSplash(x, z, br) {
        var i = spNext;
        spNext = (spNext + 1) % nP;
        spPos[i * 3] = x; spPos[i * 3 + 2] = z;
        spAge[i] = 0; spBr[i] = br;
    }

    function writeSplash() {
        var p = palette();
        for (var i = 0; i < nP; i++) {
            var a = spAge[i];
            var t = a < SPLASH_LIFE ? (1 - a / SPLASH_LIFE) * spBr[i] : 0;
            spPos[i * 3 + 1] = 0.06 + Math.min(a, SPLASH_LIFE) * SPLASH_RISE;
            spCol[i * 3] = p.bg[0] + (p.base[0] - p.bg[0]) * t;
            spCol[i * 3 + 1] = p.bg[1] + (p.base[1] - p.bg[1]) * t;
            spCol[i * 3 + 2] = p.bg[2] + (p.base[2] - p.bg[2]) * t;
        }
        spPosAttr.needsUpdate = true;
        spColAttr.needsUpdate = true;
    }

    function halfBox() { return Math.max(10, Math.min(36, getHalf())); }

    function applyFog(w) {
        if (!w.fogOn) { if (fogObj && scene.fog === fogObj) scene.fog = null; return; }
        if (!fogObj) fogObj = new THREE.Fog(w.fogCol, w.fogNear, w.fogFar);
        fogObj.color.setHex(w.fogCol); fogObj.near = w.fogNear; fogObj.far = w.fogFar;
        scene.fog = fogObj;
    }

    function applyLook(look) {
        if (look) lastLook = look;
        if (!lastLook || disposed) return;
        var th = lum(lastLook.hemiSky) < 0.6 ? 'dark' : 'light';
        if (th !== rainTheme) {
            rainTheme = th;
            var bl = blendFor(th);
            rainMat.blending = bl; rainMat.needsUpdate = true;
            spMat.blending = bl; spMat.needsUpdate = true;
            writeRain();
            writeSplash();
        }
        var w = weatherLook(lastLook, kind, sunset);
        if (lights) {
            lights.hemi.color.setHex(w.hemiSky); lights.hemi.groundColor.setHex(w.hemiGround); lights.hemi.intensity = w.hemiI;
            lights.sun.color.setHex(w.sunCol); lights.sun.intensity = w.sunI;
            lights.fill.color.setHex(w.fillCol); lights.fill.intensity = w.fillI;
            lights.rim.color.setHex(w.rimCol); lights.rim.intensity = w.rimI;
        }
        applyFog(w);
    }

    function setKind(k) {
        if (k !== 'clear' && k !== 'rain' && k !== 'snow') k = 'clear';
        var was = kind;
        kind = k;
        rain.visible = k === 'rain';
        splash.visible = k === 'rain';
        snow.visible = k === 'snow';
        if (k !== 'clear' && was !== k) {
            for (var q = 0; q < nP; q++) spAge[q] = SPLASH_LIFE;
            seedBox(getCenter(), halfBox());
        }
        applyLook();
    }

    // Cek blok cuaca dan jam senja; true bila ada yang berubah.
    function refresh() {
        var t = nowFn();
        var nk = over.weather || weatherForBlock(blockOf(t));
        var ns;
        if (over.sunset !== null) ns = over.sunset;
        else { var d = new Date(t); ns = sunsetAmount(d.getHours() + d.getMinutes() / 60); }
        var changed = false;
        if (nk !== kind) { sunset = ns; setKind(nk); changed = true; }
        else if (Math.abs(ns - sunset) > 0.01) { sunset = ns; applyLook(); changed = true; }
        return changed;
    }

    function update(sec, ambientOn) {
        if (disposed) return;
        if (sec - lastCheck >= CHECK_EVERY) {
            lastCheck = sec;
            if (refresh() && opts.onChange) opts.onChange();
        }
        var dt = lastSec === null ? 0 : Math.min(0.1, Math.max(0, sec - lastSec));
        lastSec = sec;
        if (!ambientOn || dt === 0 || kind === 'clear') return;
        wind = windAt(sec);
        var c = getCenter(), h = halfBox(), i;
        if (kind === 'rain') {
            var chance = splashChance;
            for (i = 0; i < nR; i++) {
                var x = rainPos[i * 3], y = rainPos[i * 3 + 1], z = rainPos[i * 3 + 2];
                var v = rainSp[i];
                y -= v * dt;
                x -= wind * rainK[i] * v * dt * 0.6;     // hujan bergerak miring searah goresan
                if (y < 0) {
                    y += BOX_H;
                    if (Math.random() < chance) spawnSplash(x, z, rainBr[i]);
                }
                rainPos[i * 3] = wrapAround(x, c.x, h);
                rainPos[i * 3 + 1] = y;
                rainPos[i * 3 + 2] = wrapAround(z, c.z, h);
            }
            writeRain();
            for (i = 0; i < nP; i++) spAge[i] += dt;
            writeSplash();
        } else {
            for (i = 0; i < nS; i++) {
                var sy = snowPos[i * 3 + 1] - snowSp[i] * dt;
                if (sy < 0) sy += BOX_H;
                snowPos[i * 3 + 1] = sy;
                snowPos[i * 3] = wrapAround(snowPos[i * 3] + Math.sin(sec * 0.8 + snowPh[i]) * 0.3 * dt, c.x, h);
                snowPos[i * 3 + 2] = wrapAround(snowPos[i * 3 + 2], c.z, h);
            }
            snowAttr.needsUpdate = true;
        }
    }

    // Panggil di akhir agar semua array sudah siap.
    refresh();

    return {
        update: update,
        applyLook: applyLook,
        setKind: setKind,
        refresh: refresh,
        getKind: function () { return kind; },
        getSunset: function () { return sunset; },
        getWind: function () { return wind; },
        // untuk uji
        rain: rain, snow: snow, splash: splash, rainPos: rainPos, snowPos: snowPos, spAge: spAge, rainK: rainK, rainLen: rainLen,
        dispose: function () {
            if (disposed) return;
            disposed = true;
            scene.remove(rain); scene.remove(snow); scene.remove(splash);
            rainGeo.dispose(); snowGeo.dispose(); spGeo.dispose();
            rainMat.dispose(); snowMat.dispose(); spMat.dispose();
            if (snowTex) snowTex.dispose();
            if (fogObj && scene.fog === fogObj) scene.fog = null;
        }
    };
}
