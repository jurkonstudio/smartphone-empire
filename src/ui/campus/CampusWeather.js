// FILE: src/ui/campus/CampusWeather.js
// Cuaca (cerah / hujan / salju) dan senja untuk peta 3D Kampus dan Manufaktur.
// Dipakai bersama oleh CampusScene.js dan ManufactureScene.js.
//
// Aturan desain:
//  - Cuaca OTOMATIS: deterministik per blok 30 menit (jam dinding perangkat); tanpa kontrol UI.
//  - Senja mengikuti JAM LOKAL perangkat: 0 sebelum 16.5, naik ke 1 pada 18.0, turun ke 0 pada 19.5.
//  - Uji lewat URL: ?weather=clear|rain|snow dan ?sunset=0..1
//  - Posisi matahari TIDAK diubah (shadow map dibekukan); hanya warna dan intensitas cahaya.
//  - Partikel bergerak hanya saat ambien hidup; saat ambien mati tampil diam.
//  - Dua draw call tambahan paling banyak (hujan = LineSegments, salju = Points), tanpa mesh baru.

var BLOCK_MS = 30 * 60 * 1000;
var CHECK_EVERY = 20;       // detik: seberapa sering cuaca/senja dicek ulang
var RAIN_COUNT = { low: 260, medium: 520, high: 900 };
var SNOW_COUNT = { low: 200, medium: 360, high: 600 };
var BOX_H = 18;

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
    var fogObj = null;

    // --- hujan ---
    var nR = RAIN_COUNT[tier];
    var rainPos = new Float32Array(nR * 3), rainSp = new Float32Array(nR), rainSeg = new Float32Array(nR * 6);
    var rainGeo = new THREE.BufferGeometry();
    var rainAttr = new THREE.BufferAttribute(rainSeg, 3);
    if (THREE.DynamicDrawUsage !== undefined && rainAttr.setUsage) rainAttr.setUsage(THREE.DynamicDrawUsage);
    rainGeo.setAttribute('position', rainAttr);
    var rainMat = new THREE.LineBasicMaterial({ color: 0xbcd0e8, transparent: true, opacity: 0.35, depthWrite: false, fog: false });
    var rain = new THREE.LineSegments(rainGeo, rainMat);
    rain.frustumCulled = false; rain.visible = false; rain.renderOrder = 50;
    scene.add(rain);

    // --- salju ---
    var nS = SNOW_COUNT[tier];
    var snowPos = new Float32Array(nS * 3), snowPh = new Float32Array(nS), snowSp = new Float32Array(nS);
    var snowGeo = new THREE.BufferGeometry();
    var snowAttr = new THREE.BufferAttribute(snowPos, 3);
    if (THREE.DynamicDrawUsage !== undefined && snowAttr.setUsage) snowAttr.setUsage(THREE.DynamicDrawUsage);
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
            rainSp[i] = 20 + Math.random() * 8;
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
        for (var i = 0; i < nR; i++) {
            var x = rainPos[i * 3], y = rainPos[i * 3 + 1], z = rainPos[i * 3 + 2];
            var k = i * 6;
            rainSeg[k] = x; rainSeg[k + 1] = y; rainSeg[k + 2] = z;
            rainSeg[k + 3] = x - 0.12; rainSeg[k + 4] = y + 0.9; rainSeg[k + 5] = z;
        }
        rainAttr.needsUpdate = true;
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
        snow.visible = k === 'snow';
        if (k !== 'clear' && was !== k) seedBox(getCenter(), halfBox());
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

    refresh();    // keadaan awal (tanpa onChange); cahaya diterapkan saat applyLook(look) pertama

    function update(sec, ambientOn) {
        if (disposed) return;
        if (sec - lastCheck >= CHECK_EVERY) {
            lastCheck = sec;
            if (refresh() && opts.onChange) opts.onChange();
        }
        var dt = lastSec === null ? 0 : Math.min(0.1, Math.max(0, sec - lastSec));
        lastSec = sec;
        if (!ambientOn || dt === 0 || kind === 'clear') return;
        var c = getCenter(), h = halfBox(), i;
        if (kind === 'rain') {
            for (i = 0; i < nR; i++) {
                var y = rainPos[i * 3 + 1] - rainSp[i] * dt;
                if (y < 0) y += BOX_H;
                rainPos[i * 3 + 1] = y;
                rainPos[i * 3] = wrapAround(rainPos[i * 3] - 2 * dt, c.x, h);
                rainPos[i * 3 + 2] = wrapAround(rainPos[i * 3 + 2], c.z, h);
            }
            writeRain();
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

    return {
        update: update,
        applyLook: applyLook,
        setKind: setKind,
        refresh: refresh,
        getKind: function () { return kind; },
        getSunset: function () { return sunset; },
        // untuk uji
        rain: rain, snow: snow, rainPos: rainPos, snowPos: snowPos,
        dispose: function () {
            if (disposed) return;
            disposed = true;
            scene.remove(rain); scene.remove(snow);
            rainGeo.dispose(); snowGeo.dispose(); rainMat.dispose(); snowMat.dispose();
            if (snowTex) snowTex.dispose();
            if (fogObj && scene.fog === fogObj) scene.fog = null;
        }
    };
}
