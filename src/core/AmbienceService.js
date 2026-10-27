// FILE: src/core/AmbienceService.js
// v2028.40 — Audio ambien adaptif untuk peta 3D: Kampus, Manufaktur, Kantor, Server (bawah laut).
//
// Semua suara DISINTESIS langsung lewat Web Audio (tanpa file mp3, tanpa unduhan, tanpa jaringan) sehingga:
//   - bisa mengikuti kondisi peta secara langsung (siang/malam, cuaca, aktivitas pabrik, jumlah staf, beban server),
//   - loop tidak pernah terdengar berulang (noise acak + kejadian acak),
//   - ukuran aplikasi tidak bertambah.
//
// API:
//   AmbienceService.init()                 sekali saat app mulai (pasang pembuka kunci audio)
//   AmbienceService.setEnabled(bool)       ikut Setelan > Efek Suara
//   AmbienceService.enter('campus'|'manufacture'|'office'|'server')   dipanggil saat peta tampil (idempoten)
//   AmbienceService.leave(name)            dipanggil saat peta dibuang (penundaan singkat agar remount tidak berkedip)
//   AmbienceService.setParams({ activity, crowd, load, peak, construction, night, weather })
//   AmbienceService.setVolume(0..1)
//
// Matikan hanya ambien (efek suara tetap): localStorage.setItem('se.ambience','0') atau ?ambience=off
// Uji: ?hour=22 (malam), ?weather=rain|snow|sunny|overcast|clear  (sama dengan peta 3D).

import { createDayClock } from '../ui/campus/DayCycle.js';
import { weatherForBlock, blockOf, readOverride } from '../ui/campus/CampusWeather.js';

var VOLUME_KEY = 'se.ambienceVol';
var OFF_KEY = 'se.ambience';
var MASTER = 0.9;            // pengali akhir (sebelum kompresor)

// Parameter hidup yang dibaca semua adegan.
var P = { night: 0, weather: 'clear', activity: 0.5, crowd: 0.4, load: 0.5, peak: 0.7, construction: 0 };

var ctx = null, master = null, bufs = null, irBuf = null;
var enabled = false, unlocked = false, want = null, cur = null;
var leaveTimer = 0, envTimer = 0, volume = 1, envLocked = false;
var clock = createDayClock();
var override = { weather: null };
try { override = readOverride(location.search); } catch (e) {}

function rnd(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function userOff() {
    try { if (/[?&]ambience=off(?:&|$)/.test(location.search)) return true; } catch (e) {}
    try { if (window.localStorage && window.localStorage.getItem(OFF_KEY) === '0') return true; } catch (e) {}
    return false;
}

// ---------- buffer noise (dibuat sekali) ----------
// Loop mulus: ujung buffer dicampur (equal-power) ke awal sehingga tidak ada klik di titik loop.
function loopable(data, n, f) {
    for (var i = 0; i < f; i++) {
        var w = i / f, a = Math.cos(w * Math.PI / 2), b = Math.sin(w * Math.PI / 2);
        data[i] = data[i] * b + data[n + i] * a;
    }
}
function makeNoise(kind, seconds) {
    var sr = ctx.sampleRate, n = Math.floor(sr * seconds), f = Math.floor(sr * 0.25);
    var buf = ctx.createBuffer(2, n, sr);
    for (var ch = 0; ch < 2; ch++) {
        var tmp = new Float32Array(n + f), last = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (var i = 0; i < n + f; i++) {
            var w = Math.random() * 2 - 1;
            if (kind === 'white') tmp[i] = w * 0.6;
            else if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; tmp[i] = last * 3.5; }
            else {   // pink (Paul Kellet)
                b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
                b2 = 0.96900 * b2 + w * 0.1538520; b3 = 0.86650 * b3 + w * 0.3104856;
                b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
                tmp[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
            }
        }
        loopable(tmp, n, f);
        buf.getChannelData(ch).set(tmp.subarray(0, n));
    }
    return buf;
}
// Impuls gema ruang: noise meluruh + sedikit digelapkan.
function makeIR(seconds, decay) {
    var sr = ctx.sampleRate, n = Math.floor(sr * seconds), buf = ctx.createBuffer(2, n, sr);
    for (var ch = 0; ch < 2; ch++) {
        var d = buf.getChannelData(ch), lp = 0;
        for (var i = 0; i < n; i++) {
            var t = i / n;
            lp += (Math.random() * 2 - 1 - lp) * (0.25 - 0.18 * t);
            d[i] = lp * Math.pow(1 - t, decay) * 1.8;
        }
    }
    return buf;
}

// ---------- konteks audio ----------
function ensureCtx() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC({ latencyHint: 'playback' }); } catch (e) { try { ctx = new AC(); } catch (e2) { return false; } }
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 14; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.3;
    master = ctx.createGain();
    master.gain.value = MASTER * volume;
    master.connect(comp); comp.connect(ctx.destination);
    bufs = { white: makeNoise('white', 3), pink: makeNoise('pink', 5), brown: makeNoise('brown', 5) };
    irBuf = makeIR(2.2, 3.2);
    return true;
}

// ---------- perkakas pembuat adegan ----------
function makeScene(name) {
    var S = { name: name, srcs: [], timers: [], dead: false };
    S.out = ctx.createGain(); S.out.gain.value = 0; S.out.connect(master);
    S.lp = ctx.createBiquadFilter(); S.lp.type = 'lowpass'; S.lp.frequency.value = 20000; S.lp.Q.value = 0.3;
    S.lp.connect(S.out); S.dest = S.lp;
    S.send = ctx.createGain(); S.send.gain.value = 1;
    S.verb = ctx.createConvolver(); S.verb.buffer = irBuf;
    S.verbOut = ctx.createGain(); S.verbOut.gain.value = 0.8;
    S.send.connect(S.verb); S.verb.connect(S.verbOut); S.verbOut.connect(S.out);
    return S;
}
function gainN(v) { var g = ctx.createGain(); g.gain.value = v; return g; }
function filt(type, f, q) { var b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q !== undefined) b.Q.value = q; return b; }
function noiseSrc(S, kind, rate) {
    var s = ctx.createBufferSource(); s.buffer = bufs[kind]; s.loop = true;
    if (rate) s.playbackRate.value = rate;
    s.start(0, Math.random() * s.buffer.duration); S.srcs.push(s); return s;
}
function osc(S, type, f) { var o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.start(); S.srcs.push(o); return o; }
function lfo(S, f, depth, param, shape) { var o = osc(S, shape || 'sine', f), g = gainN(depth); o.connect(g); g.connect(param); return o; }
function setT(param, v, tc) { param.setTargetAtTime(v, ctx.currentTime, tc || 0.7); }

// Lapisan terus-menerus: noise -> filter... -> (ayunan lambat) -> level -> tujuan adegan.
function layer(S, kind, filters, swell) {
    var node = noiseSrc(S, kind);
    for (var i = 0; i < filters.length; i++) { node.connect(filters[i]); node = filters[i]; }
    if (swell) { var m = gainN(1 - swell[1]); lfo(S, swell[0], swell[1], m.gain); node.connect(m); node = m; }
    var level = gainN(0); node.connect(level); level.connect(S.dest);
    return level;
}
function toneLayer(S, type, f, level) { var o = osc(S, type, f), g = gainN(level); o.connect(g); g.connect(S.dest); return { o: o, g: g }; }

// Keluaran satu kejadian: opsional pan stereo + kirim ke gema.
function route(S, node, pan, wet) {
    var out = node;
    if (pan && ctx.createStereoPanner) { var p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); node.connect(p); out = p; }
    out.connect(S.dest);
    if (wet) { var w = gainN(wet); out.connect(w); w.connect(S.send); }
}
function env(g, t, a, d, peak) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}
// Nada pendek dengan sapuan frekuensi: o = { f0, f1, d, a, g, type, pan, wet, h }
function tone(S, t, o) {
    var c = ctx.createOscillator(); c.type = o.type || 'sine';
    c.frequency.setValueAtTime(o.f0, t);
    if (o.f1 && o.f1 !== o.f0) c.frequency.exponentialRampToValueAtTime(o.f1, t + (o.a || 0.005) + o.d);
    var g = ctx.createGain(); env(g, t, o.a || 0.005, o.d, o.g);
    c.connect(g);
    if (o.lp) { var f = filt('lowpass', o.lp, 0.5); g.connect(f); route(S, f, o.pan, o.wet); } else route(S, g, o.pan, o.wet);
    c.start(t); c.stop(t + (o.a || 0.005) + o.d + 0.05);
    if (o.h) tone(S, t, { f0: o.f0 * o.h[0], f1: o.f1 ? o.f1 * o.h[0] : 0, d: o.d, a: o.a, g: o.g * o.h[1], type: 'sine', pan: o.pan, wet: o.wet });
}
// Ledakan noise pendek: o = { f, q, type, d, a, g, pan, wet }
function burst(S, t, o) {
    var s = ctx.createBufferSource(); s.buffer = bufs.white; s.loop = true;
    var f = filt(o.type || 'bandpass', o.f, o.q || 1), g = ctx.createGain();
    env(g, t, o.a || 0.002, o.d, o.g);
    s.connect(f); f.connect(g); route(S, g, o.pan, o.wet);
    s.start(t, Math.random() * 2); s.stop(t + (o.a || 0.002) + o.d + 0.05);
}
// Benda logam/lonceng: beberapa parsial meluruh.
function ring(S, t, partials, d, g, pan, wet) {
    for (var i = 0; i < partials.length; i++)
        tone(S, t, { f0: partials[i][0], d: d / (1 + i * 0.55), a: 0.003, g: g * partials[i][1], pan: pan, wet: wet });
}
// Jadwal kejadian acak. rate() mengembalikan pengali frekuensi (<=0.06 = diam).
function every(S, minS, maxS, fn, rate) {
    var id = 0;
    function next() {
        if (S.dead) return;
        var r = rate ? rate() : 1;
        var wait = Math.min(14, rnd(minS, maxS) / Math.max(0.08, r));
        id = setTimeout(function () {
            if (S.dead) return;
            var r2 = rate ? rate() : 1;
            if (r2 > 0.06 && ctx && ctx.state === 'running' && !(typeof document !== 'undefined' && document.hidden)) {
                try { fn(ctx.currentTime + 0.03, r2); } catch (e) { /* satu kejadian gagal tidak boleh mematikan adegan */ }
            }
            next();
        }, wait * 1000);
    }
    next();
    S.timers.push(function () { clearTimeout(id); });
}

// ---------- lapisan bersama ----------
var WEATHER_WIND = { clear: 0.10, sunny: 0.07, overcast: 0.22, rain: 0.34, snow: 0.15 };
// Angin + hujan. scale mengatur keseluruhan (dalam ruangan lebih kecil), muffle = frekuensi lowpass bagian hujan.
function weatherBeds(S, scale, rainLp) {
    var windF = filt('bandpass', 380, 0.45);
    var wind = layer(S, 'pink', [windF], [0.07, 0.35]);
    lfo(S, 0.05, 130, windF.frequency);
    var rainHi = layer(S, 'white', [filt('highpass', 1100, 0.5), filt('lowpass', rainLp, 0.5)]);
    var rainBody = layer(S, 'pink', [filt('bandpass', 2200, 0.5)]);
    var rainLow = layer(S, 'brown', [filt('lowpass', 420, 0.5)]);
    return function (p) {
        var k = p.weather, raining = k === 'rain' ? 1 : 0;
        setT(wind.gain, (WEATHER_WIND[k] === undefined ? 0.1 : WEATHER_WIND[k]) * scale, 1.2);
        setT(rainHi.gain, 0.085 * raining * scale, 1.5);
        setT(rainBody.gain, 0.075 * raining * scale, 1.5);
        setT(rainLow.gain, 0.05 * raining * scale, 1.5);
    };
}
// Ombak pantai (pulau kampus & dermaga).
function seaBeds(S, scale) {
    var swell = layer(S, 'brown', [filt('lowpass', 520, 0.4)], [0.11, 0.6]);
    var swell2 = layer(S, 'pink', [filt('bandpass', 300, 0.5)], [0.173, 0.5]);
    var foam = layer(S, 'white', [filt('highpass', 2300, 0.4), filt('lowpass', 8000, 0.4)], [0.123, 0.85]);
    setT(swell.gain, 0.10 * scale, 2); setT(swell2.gain, 0.04 * scale, 2); setT(foam.gain, 0.014 * scale, 2);
}

// ---------- ADEGAN: KAMPUS ----------
function buildCampus() {
    var S = makeScene('campus');
    var weatherApply = weatherBeds(S, 1, 9500);
    seaBeds(S, 1);
    // Jangkrik malam: dua suara, nada & irama berbeda; AM cepat (kepak) x AM lambat (rangkaian).
    function cricket(f, fast, slow) {
        var c = osc(S, 'sine', f), a = gainN(0.5), b = gainN(0.5), lvl = gainN(0);
        lfo(S, fast, 0.5, a.gain, 'square'); lfo(S, slow, 0.5, b.gain, 'square');
        c.connect(a); a.connect(b); b.connect(lvl); lvl.connect(S.dest); return lvl;
    }
    var cr1 = cricket(4350, 37, 2.7), cr2 = cricket(5050, 43, 2.1);
    // Keramaian jauh kampus (siang): bisik pembicaraan jauh.
    var f1 = filt('bandpass', 620, 1.6), f2 = filt('bandpass', 1700, 2);
    lfo(S, 0.37, 140, f1.frequency); lfo(S, 0.53, 300, f2.frequency);
    var crowd = layer(S, 'pink', [f1], [3.9, 0.4]);
    var crowd2 = layer(S, 'pink', [f2], [5.1, 0.45]);
    // Air mancur taman.
    var fountain = layer(S, 'white', [filt('highpass', 1800, 0.5), filt('lowpass', 6500, 0.5)], [7.3, 0.18]);
    setT(fountain.gain, 0.011, 2);

    function dayF() { var rain = P.weather === 'rain' ? 0.12 : (P.weather === 'snow' ? 0.15 : 1); return (1 - P.night) * rain; }
    every(S, 1.4, 5.5, function (t) {                     // kicau burung
        var pan = rnd(-0.8, 0.8), base = rnd(2500, 4300), n = 2 + (Math.random() * 4 | 0), gap = rnd(0.09, 0.16), dir = Math.random() < 0.5 ? 1 : -1;
        for (var i = 0; i < n; i++) {
            var f0 = base * (1 + 0.04 * i);
            tone(S, t + i * gap, { f0: f0, f1: f0 * (1 + dir * rnd(0.2, 0.5)), d: rnd(0.06, 0.11), a: 0.008, g: 0.028, pan: pan, wet: 0.25, h: [2, 0.2] });
        }
        if (Math.random() < 0.18) {                        // sesekali merpati: dua nada rendah lembut
            tone(S, t + 0.9, { f0: 470, f1: 400, d: 0.28, a: 0.04, g: 0.03, pan: pan, wet: 0.4, h: [2, 0.12] });
            tone(S, t + 1.25, { f0: 440, f1: 380, d: 0.34, a: 0.04, g: 0.026, pan: pan, wet: 0.4, h: [2, 0.12] });
        }
    }, function () { return dayF() * 0.9; });
    every(S, 45, 95, function (t) {                        // lonceng kampus jauh
        ring(S, t, [[523.25, 1], [1318.5, 0.3], [1568, 0.18], [2093, 0.1]], 4.8, 0.05, -0.4, 0.9);
    }, function () { return dayF() > 0.5 ? 1 : 0; });

    return {
        S: S,
        apply: function (p) {
            weatherApply(p);
            var night = p.night, dry = (p.weather === 'rain' || p.weather === 'snow') ? 0.2 : 1;
            setT(cr1.gain, 0.022 * night * dry, 2.5); setT(cr2.gain, 0.017 * night * dry, 2.5);
            setT(crowd.gain, 0.016 * (1 - night) * dry, 2); setT(crowd2.gain, 0.008 * (1 - night) * dry, 2);
            setT(S.lp.frequency, p.weather === 'snow' ? 4200 : 20000, 1.5);
        }
    };
}

// ---------- ADEGAN: MANUFAKTUR ----------
function buildManufacture() {
    var S = makeScene('manufacture');
    var weatherApply = weatherBeds(S, 0.8, 9000);
    seaBeds(S, 0.75);
    var hum = [toneLayer(S, 'sine', 50, 0.045), toneLayer(S, 'sine', 100, 0.035), toneLayer(S, 'sine', 150.4, 0.016), toneLayer(S, 'sine', 200.8, 0.008)];
    var rumble = layer(S, 'brown', [filt('lowpass', 190, 0.5)], [0.2, 0.2]);
    var motorF = filt('lowpass', 420, 0.8), motorG = gainN(0), motor = osc(S, 'sawtooth', 96);
    motor.connect(motorF); motorF.connect(motorG); motorG.connect(S.dest);
    lfo(S, 6.5, 0.4, motorG.gain);
    var conv = layer(S, 'white', [filt('bandpass', 3100, 2.2)], [13, 0.7]);     // sabuk konveyor / lengan robot

    function act() { return P.activity; }
    every(S, 1.2, 2.6, function (t) {                                            // mesin press
        var pan = rnd(-0.5, 0.5);
        tone(S, t, { f0: 125, f1: 42, d: 0.2, a: 0.002, g: 0.2, pan: pan, wet: 0.3, lp: 500 });
        burst(S, t, { f: 800, q: 0.6, type: 'lowpass', d: 0.12, g: 0.24, pan: pan, wet: 0.25 });
        if (Math.random() < 0.35) {                                              // pukulan ganda
            tone(S, t + 0.16, { f0: 118, f1: 40, d: 0.17, a: 0.002, g: 0.14, pan: pan, wet: 0.3, lp: 500 });
            burst(S, t + 0.16, { f: 800, q: 0.6, type: 'lowpass', d: 0.1, g: 0.15, pan: pan, wet: 0.25 });
        }
    }, function () { return 0.2 + act() * 1.6 - (act() < 0.12 ? 0.3 : 0); });
    every(S, 3, 8, function (t) {                                                // semburan udara pneumatik
        burst(S, t, { f: 6200, q: 0.8, d: rnd(0.22, 0.45), a: 0.012, g: 0.05, pan: rnd(-0.7, 0.7), wet: 0.2 });
    }, function () { return act() * 1.2; });
    every(S, 5, 11, function (t) {                                               // bip lengan robot
        var pan = rnd(-0.6, 0.6);
        tone(S, t, { f0: 880, d: 0.07, a: 0.004, g: 0.014, pan: pan, wet: 0.2, type: 'square', lp: 2600 });
        tone(S, t + 0.11, { f0: 1175, d: 0.09, a: 0.004, g: 0.014, pan: pan, wet: 0.2, type: 'square', lp: 2600 });
    }, function () { return act() > 0.2 ? 1 : 0; });
    every(S, 7, 15, function (t) {                                               // kontainer mendarat di dermaga
        var pan = rnd(-0.5, 0.5);
        tone(S, t, { f0: 90, f1: 45, d: 0.25, a: 0.002, g: 0.15, pan: pan, wet: 0.5, lp: 400 });
        ring(S, t, [[310, 1], [826, 0.6], [1380, 0.4], [2210, 0.25]], 1.7, 0.08, pan, 0.65);
    }, function () { return 0.4 + act(); });
    every(S, 25, 50, function (t) {                                              // bip mundur forklift
        var pan = rnd(-0.7, 0.7);
        for (var i = 0; i < 6; i++) tone(S, t + i * 0.42, { f0: 1000, d: 0.17, a: 0.004, g: 0.012, pan: pan, wet: 0.25, type: 'square', lp: 2200 });
    }, function () { return act() > 0.15 ? 1 : 0; });
    every(S, 0.45, 1.1, function (t) {                                           // pemalu: pabrik sedang dibangun
        var pan = rnd(-0.7, 0.7);
        burst(S, t, { f: 1800, q: 1.2, d: 0.05, g: 0.1, pan: pan, wet: 0.3 });
        ring(S, t, [[1900, 1], [3300, 0.4]], 0.14, 0.05, pan, 0.3);
    }, function () { return P.construction > 0.05 ? 0.5 + P.construction : 0; });
    every(S, 70, 140, function (t) {                                             // klakson kapal jauh
        function horn(f, g) {
            var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
            var lp = filt('lowpass', 420, 0.7), gg = ctx.createGain();
            gg.gain.setValueAtTime(0.0001, t); gg.gain.linearRampToValueAtTime(g, t + 0.4);
            gg.gain.setValueAtTime(g, t + 2.0); gg.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
            o.connect(lp); lp.connect(gg); route(S, gg, -0.45, 0.8); o.start(t); o.stop(t + 3.5);
        }
        horn(98, 0.05); horn(123.5, 0.04);
    });

    return {
        S: S,
        apply: function (p) {
            weatherApply(p);
            var a = p.activity;
            for (var i = 0; i < hum.length; i++) setT(hum[i].g.gain, [0.045, 0.035, 0.016, 0.008][i] * (0.35 + 0.65 * a), 1.5);
            setT(rumble.gain, 0.13 * (0.4 + 0.6 * a), 1.5);
            setT(motor.frequency, 90 + 28 * a, 1.5);
            setT(motorG.gain, 0.02 * a, 1.5);
            setT(conv.gain, 0.012 * a, 1.5);
            setT(S.lp.frequency, p.weather === 'snow' ? 4500 : 20000, 1.5);
        }
    };
}

// ---------- ADEGAN: KANTOR ----------
function buildOffice() {
    var S = makeScene('office');
    var weatherApply = weatherBeds(S, 0.28, 3200);          // hujan/angin terdengar samar dari jendela
    var room = layer(S, 'pink', [filt('lowpass', 700, 0.5)]);
    var vent = layer(S, 'pink', [filt('bandpass', 230, 0.8)], [0.05, 0.25]);
    var hvac = toneLayer(S, 'sine', 118, 0.008);
    // Gumaman percakapan: tiga formant, amplitudo & frekuensi bergoyang pelan.
    var babble = [];
    [[520, 2.2, 3.7, 0.7], [1400, 2.8, 5.3, 0.5], [2500, 3.2, 4.4, 0.3]].forEach(function (b, i) {
        var f = filt('bandpass', b[0], b[1]);
        lfo(S, 0.31 + i * 0.17, b[0] * 0.18, f.frequency);
        babble.push({ g: layer(S, 'pink', [f], [b[2], 0.4]), w: b[3] });
    });
    function crowd() { return P.crowd * (1 - 0.7 * P.night); }

    function key(t, pan) {
        burst(S, t, { f: rnd(1900, 3400), q: 1.3, d: 0.02, g: rnd(0.025, 0.05), pan: pan, wet: 0.08 });
        tone(S, t, { f0: 190, f1: 120, d: 0.025, a: 0.001, g: 0.012, pan: pan });
    }
    every(S, 0.6, 3.2, function (t) {                                            // rentetan mengetik
        var pan = rnd(-0.8, 0.8), n = 4 + (Math.random() * 10 | 0), tt = t;
        for (var i = 0; i < n; i++) { key(tt, pan); tt += rnd(0.065, 0.17) * (Math.random() < 0.12 ? 2.5 : 1); }
        if (Math.random() < 0.5) burst(S, tt + 0.05, { f: 900, q: 1, d: 0.04, g: 0.05, pan: pan });   // spasi/enter lebih berat
    }, function () { return 0.15 + crowd() * 2.2; });
    every(S, 3, 9, function (t) {                                                // klik mouse
        var pan = rnd(-0.8, 0.8);
        burst(S, t, { f: 4200, q: 2, d: 0.012, g: 0.035, pan: pan });
        burst(S, t + 0.09, { f: 3400, q: 2, d: 0.01, g: 0.02, pan: pan });
    }, function () { return crowd() * 1.5; });
    every(S, 6, 15, function (t) {                                               // kursi/langkah
        var pan = rnd(-0.8, 0.8);
        tone(S, t, { f0: 95, f1: 60, d: 0.09, a: 0.003, g: 0.045, pan: pan, lp: 300 });
        burst(S, t, { f: 500, q: 0.6, type: 'lowpass', d: 0.07, g: 0.05, pan: pan });
        if (Math.random() < 0.6) {
            tone(S, t + 0.45, { f0: 92, f1: 58, d: 0.09, a: 0.003, g: 0.04, pan: pan, lp: 300 });
            burst(S, t + 0.45, { f: 500, q: 0.6, type: 'lowpass', d: 0.07, g: 0.045, pan: pan });
        }
    }, function () { return crowd() > 0.12 ? crowd() * 1.4 : 0; });
    every(S, 28, 65, function (t) {                                              // telepon berdering jauh
        var pan = rnd(-0.6, 0.6);
        for (var r = 0; r < 2; r++) for (var i = 0; i < 4; i++) {
            tone(S, t + r * 1.1 + i * 0.12, { f0: i % 2 ? 698 : 880, d: 0.1, a: 0.004, g: 0.016, pan: pan, wet: 0.45, lp: 2800, h: [2, 0.2] });
        }
    }, function () { return crowd() > 0.2 ? 1 : 0; });

    return {
        S: S,
        apply: function (p) {
            weatherApply(p);
            var c = crowd();
            setT(room.gain, 0.05 + 0.012 * p.night, 1.5);
            setT(vent.gain, 0.02, 1.5);
            setT(hvac.g.gain, 0.008 + 0.004 * p.night, 1.5);
            for (var i = 0; i < babble.length; i++) setT(babble[i].g.gain, (0.004 + 0.034 * c) * babble[i].w, 2);
        }
    };
}

// ---------- ADEGAN: SERVER (kubah bawah laut) ----------
function buildServer() {
    var S = makeScene('server');
    S.lp.frequency.value = 3400;            // peredam air: semuanya sedikit teredam
    var deepF = filt('lowpass', 220, 0.6);
    lfo(S, 0.06, 70, deepF.frequency);
    var deep = layer(S, 'brown', [deepF], [0.09, 0.3]);
    var body = layer(S, 'pink', [filt('bandpass', 500, 0.4)], [0.13, 0.4]);
    setT(deep.gain, 0.3, 2); setT(body.gain, 0.05, 2);
    // Kipas rak: tiga gergaji sedikit tidak selaras + embusan udara.
    var fanF = filt('lowpass', 500, 0.9), fanG = gainN(0), fans = [];
    [92, 117.4, 143.1].forEach(function (f) { var o = osc(S, 'sawtooth', f); o.connect(fanF); fans.push({ o: o, f: f }); });
    fanF.connect(fanG); fanG.connect(S.dest);
    lfo(S, 0.8, 0.25, fanG.gain);
    var air = layer(S, 'white', [filt('bandpass', 950, 0.7)], [0.6, 0.15]);
    // Dengung trafo (100 Hz = 2 x 50 Hz listrik).
    toneLayer(S, 'sine', 100, 0.028); toneLayer(S, 'sine', 200, 0.011); toneLayer(S, 'sine', 300, 0.005);

    function load() { return clamp(P.load, 0, 1.4); }
    every(S, 0.25, 1.6, function (t) {                                           // klik relay / HDD
        var pan = rnd(-0.8, 0.8);
        burst(S, t, { f: 3200, q: 3, d: 0.012, g: 0.035, pan: pan, wet: 0.12 });
        tone(S, t, { f0: 1800, d: 0.01, a: 0.001, g: 0.01, pan: pan });
    }, function () { return 0.2 + load() * 1.5; });
    every(S, 0.5, 2.4, function (t) {                                            // gelembung
        var pan = rnd(-0.9, 0.9), n = Math.random() < 0.3 ? 3 : 1;
        for (var i = 0; i < n; i++) {
            var f = rnd(380, 880);
            tone(S, t + i * rnd(0.07, 0.15), { f0: f, f1: f * rnd(1.6, 2.3), d: rnd(0.05, 0.13), a: 0.006, g: 0.03, pan: pan, wet: 0.3 });
        }
    });
    every(S, 25, 50, function (t) {                                              // ping sonar
        tone(S, t, { f0: 1480, d: 2.8, a: 0.01, g: 0.03, pan: rnd(-0.5, 0.5), wet: 0.95, h: [2, 0.15] });
    });
    every(S, 20, 40, function (t) {                                              // kawanan ikan lewat
        var s = ctx.createBufferSource(); s.buffer = bufs.pink; s.loop = true;
        var f = filt('bandpass', 280, 1.2), g = ctx.createGain(), dur = rnd(2.2, 3.2), from = Math.random() < 0.5 ? -0.8 : 0.8;
        f.frequency.setValueAtTime(280, t); f.frequency.exponentialRampToValueAtTime(760, t + dur);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.045, t + dur * 0.5); g.gain.linearRampToValueAtTime(0.0001, t + dur);
        s.connect(f); f.connect(g);
        var p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (p) { p.pan.setValueAtTime(from, t); p.pan.linearRampToValueAtTime(-from, t + dur); g.connect(p); p.connect(S.dest); } else g.connect(S.dest);
        s.start(t, Math.random() * 2); s.stop(t + dur + 0.1);
    });
    every(S, 2.2, 2.6, function (t) {                                            // peringatan beban berlebih (lembut)
        tone(S, t, { f0: 760, d: 0.16, a: 0.006, g: 0.018, wet: 0.35, lp: 2200 });
        tone(S, t + 0.22, { f0: 620, d: 0.2, a: 0.006, g: 0.018, wet: 0.35, lp: 2200 });
    }, function () { return P.peak > 1.02 ? 1 : 0; });

    return {
        S: S,
        apply: function (p) {
            var l = clamp(p.load, 0, 1.4);
            for (var i = 0; i < fans.length; i++) setT(fans[i].o.frequency, fans[i].f * (0.9 + 0.45 * l), 1.2);
            setT(fanF.frequency, 380 + 520 * l, 1.2);
            setT(fanG.gain, 0.03 + 0.05 * l, 1.2);
            setT(air.gain, 0.012 + 0.04 * l, 1.2);
        }
    };
}

var BUILDERS = { campus: buildCampus, manufacture: buildManufacture, office: buildOffice, server: buildServer };

// ---------- kendali adegan aktif ----------
function stopScene(sc, delayMs) {
    if (!sc) return;
    var S = sc.S;
    S.dead = true;
    S.timers.forEach(function (f) { f(); });
    S.timers = [];
    try { S.out.gain.cancelScheduledValues(ctx.currentTime); S.out.gain.setTargetAtTime(0, ctx.currentTime, delayMs / 3500); } catch (e) {}
    setTimeout(function () {
        S.srcs.forEach(function (s) { try { s.stop(); } catch (e) {} try { s.disconnect(); } catch (e) {} });
        try { S.out.disconnect(); } catch (e) {}
        try { S.verbOut.disconnect(); } catch (e) {}
        S.srcs = [];
    }, delayMs + 200);
}
function refreshEnv() {
    if (envLocked) { if (cur) cur.apply(P); return; }
    P.night = clock.night(document.documentElement.getAttribute('data-theme') === 'dark');
    P.weather = override.weather || weatherForBlock(blockOf(clock.now()));
    if (cur) cur.apply(P);
}
function startScene(name) {
    if (!BUILDERS[name] || !ensureCtx() || !enabled || !unlocked || userOff()) return;
    if (cur && cur.S.name === name && !cur.S.dead) return;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    var old = cur;
    refreshEnv();
    cur = BUILDERS[name]();
    cur.apply(P);
    cur.S.out.gain.setTargetAtTime(1, ctx.currentTime + 0.05, 0.55);
    if (old) stopScene(old, 1500);
    if (!envTimer) envTimer = setInterval(refreshEnv, 15000);
}
function stopCurrent(delayMs) {
    if (cur) { stopScene(cur, delayMs || 1100); cur = null; }
    if (envTimer) { clearInterval(envTimer); envTimer = 0; }
}

export const AmbienceService = {
    init: function () {
        try { var v = parseFloat(window.localStorage.getItem(VOLUME_KEY)); if (isFinite(v)) volume = clamp(v, 0, 1); } catch (e) {}
        var unlock = function () {
            if (unlocked) return;
            unlocked = true;
            ['touchstart', 'pointerdown', 'click', 'keydown'].forEach(function (ev) { document.removeEventListener(ev, unlock); });
            if (!ensureCtx()) return;
            try { ctx.resume(); } catch (e) {}
            if (want && enabled) startScene(want);
        };
        ['touchstart', 'pointerdown', 'click', 'keydown'].forEach(function (ev) { document.addEventListener(ev, unlock, { passive: true }); });
        // Hemat baterai: jeda konteks saat app di latar belakang.
        document.addEventListener('visibilitychange', function () {
            if (!ctx) return;
            try { if (document.hidden) ctx.suspend(); else if (enabled && want) ctx.resume(); } catch (e) {}
        });
    },
    setEnabled: function (on) {
        enabled = !!on;
        if (!enabled) { stopCurrent(500); return; }
        if (want && unlocked) startScene(want);
    },
    enter: function (name) {
        if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = 0; }
        want = name;
        startScene(name);
    },
    // Tunda sebentar: renderView membuang lalu memasang ulang peta pada frame yang sama.
    leave: function (name) {
        if (want !== name) return;
        if (leaveTimer) clearTimeout(leaveTimer);
        leaveTimer = setTimeout(function () { leaveTimer = 0; if (want === name) { want = null; stopCurrent(1100); } }, 450);
    },
    setParams: function (p) {
        if (!p) return;
        for (var k in p) if (Object.prototype.hasOwnProperty.call(P, k) && typeof p[k] !== 'undefined') P[k] = p[k];
        if (cur && !cur.S.dead) cur.apply(P);
    },
    setVolume: function (v) {
        volume = clamp(+v || 0, 0, 1);
        try { window.localStorage.setItem(VOLUME_KEY, String(volume)); } catch (e) {}
        if (master) setT(master.gain, MASTER * volume, 0.1);
    },
    getVolume: function () { return volume; },
    // Uji: kunci malam/cuaca agar tidak ditimpa jam perangkat.
    lockEnv: function (on) { envLocked = !!on; },
    // Untuk halaman uji / diagnostik.
    debug: function () { return { enabled: enabled, unlocked: unlocked, want: want, scene: cur ? cur.S.name : null, state: ctx ? ctx.state : 'none', params: Object.assign({}, P) }; }
};
