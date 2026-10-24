// FILE: src/ui/campus/DayCycle.js
// Siklus siang-malam peta 3D (Kampus & Manufaktur) mengikuti JAM PERANGKAT (jam dunia nyata).
//   night(hour) = 0 siang penuh ... 1 malam penuh, berpindah halus:
//     fajar : 04:50 -> 06:30 (malam memudar)        | warna hangat fajar puncak ~05:55
//     siang : 06:30 -> 17:40
//     senja : 17:40 -> 19:20 (malam menguat)        | warna hangat senja = sunsetAmount() di CampusWeather (16:30-19:30)
//     malam : 19:20 -> 04:50
// Tema UI (terang/gelap) TIDAK lagi menentukan tampilan peta bila siklus aktif. Matikan siklus (kembali ke
// perilaku lama: peta mengikuti tema UI) lewat salah satu:
//     ?daycycle=off                          (URL, untuk uji)
//     localStorage.setItem('se.mapRealTime', '0')
// Uji jam tertentu: ?hour=21.5 (21:30). Jam palsu juga dipakai CampusWeather lewat now() supaya senja ikut.
// Modul murni (tanpa THREE) kecuali fungsi blend* yang hanya memakai angka hex.

export var NIGHT_KEY = 'se.mapRealTime';

function smooth(e0, e1, x) { var t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }

// hour: jam lokal desimal (17.25 = 17:15). Hasil 0..1.
export function nightAmount(hour) {
    var h = ((hour % 24) + 24) % 24;
    if (h < 4.83) return 1;
    if (h < 6.5) return 1 - smooth(4.83, 6.5, h);
    if (h < 17.67) return 0;
    if (h < 19.33) return smooth(17.67, 19.33, h);
    return 1;
}

// Kehangatan fajar 0..1 (puncak ~05:55). Senja sore sudah ditangani sunsetAmount() di CampusWeather.
export function dawnAmount(hour) {
    var h = ((hour % 24) + 24) % 24;
    if (h < 5 || h >= 7) return 0;
    var v = h <= 5.9 ? (h - 5) / 0.9 : (7 - h) / 1.1;
    return Math.max(0, Math.min(1, v)) * 0.8;
}

export function readHourOverride(search) {
    var m = /[?&]hour=([0-9]{1,2}(?:\.[0-9]+)?)(?:&|$)/.exec(String(search || ''));
    if (!m) return null;
    var v = parseFloat(m[1]);
    return isFinite(v) && v >= 0 && v < 24 ? v : null;
}

function cycleEnabled(search) {
    if (/[?&]daycycle=off(?:&|$)/.test(String(search || ''))) return false;
    try { if (window.localStorage && window.localStorage.getItem(NIGHT_KEY) === '0') return false; } catch (e) {}
    return true;
}

// Jam Date -> desimal.
function hourOf(ms) { var d = new Date(ms); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; }

// Satu jam bersama untuk satu scene.
//   clock.now()            -> ms (Date.now() yang digeser bila ?hour= dipakai) ; berikan ke createWeather({ now })
//   clock.hour()           -> jam desimal
//   clock.night(themeDark) -> 0..1 (siklus aktif) atau 0/1 mengikuti tema UI (siklus mati)
//   clock.enabled
export function createDayClock(search) {
    var s = search;
    if (s === undefined) { try { s = location.search; } catch (e) { s = ''; } }
    var ov = readHourOverride(s);
    var enabled = cycleEnabled(s);
    var offset = 0;
    if (ov !== null) offset = (ov - hourOf(Date.now())) * 3600000;
    function now() { return Date.now() + offset; }
    return {
        enabled: enabled,
        override: ov,
        now: now,
        hour: function () { return hourOf(now()); },
        night: function (themeDark) {
            if (!enabled) return themeDark ? 1 : 0;
            return nightAmount(hourOf(now()));
        }
    };
}

// ---------- pencampuran warna/angka terang <-> gelap ----------
export function lerpHex(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    var ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
    var br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
    return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
}

// Kunci numerik (bukan warna) yang dicampur linear; selain itu dianggap hex.
var NUM_KEYS = { hemiI: 1, dirI: 1, night: 1, sunI: 1, fillI: 1, rimI: 1, envI: 1, exposure: 1, aoOpacity: 1 };

// Campur dua objek flat (PALETTES.light/dark atau CAMPUS_LOOK.light/dark). Objek bersarang 'colors' ikut dicampur.
export function blendObj(a, b, t) {
    var out = {};
    Object.keys(a).forEach(function (k) {
        var va = a[k], vb = b[k];
        if (vb === undefined) { out[k] = va; return; }
        if (k === 'colors' && va && typeof va === 'object') { out[k] = blendObj(va, vb, t); return; }
        if (typeof va !== 'number') { out[k] = va; return; }
        out[k] = NUM_KEYS[k] ? va + (vb - va) * t : lerpHex(va, vb, t);
    });
    return out;
}
