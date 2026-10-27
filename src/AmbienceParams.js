// FILE: src/ui/ambience/AmbienceParams.js
// Menerjemahkan state game -> parameter audio ambien per peta, dan menghubungkannya ke bus event.
// Dihitung paling sering 1x per 1,5 detik (state:changed bisa sangat sering).
import { AmbienceService } from '../../core/AmbienceService.js';
import { allStates } from '../manufacture/ManufactureLogic.js';

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

// Kantor: makin banyak staf makin ramai (akar supaya tim kecil tetap terasa hidup).
export function officeParams(d) {
    var n = (d && d.staff && d.staff.length) || 0;
    return { crowd: clamp(Math.sqrt(n / 24), 0, 1) };
}

// Manufaktur: aktivitas = porsi pabrik berdiri yang sedang berproduksi; konstruksi = ada yang sedang dibangun.
export function manufactureParams(d) {
    var st = allStates(d), built = 0, prod = 0, cons = 0;
    Object.keys(st).forEach(function (k) {
        var s = st[k];
        if (s.kind === 'hub') return;
        if (s.status === 'built') { built++; if (s.producing) prod++; }
        if (s.building) cons++;
    });
    return { activity: built ? clamp(0.18 + 0.82 * prod / built, 0, 1) : 0.08, construction: clamp(cons / 2, 0, 1) };
}

// Server: beban rata-rata mengatur kecepatan kipas; beban puncak > ~1 memicu bip peringatan lembut.
export function serverParams(d) {
    var pods = d && d.server && d.server.pods;
    if (!pods || !pods.length) return { load: 0.6, peak: 0.78 };
    var sum = 0, peak = 0;
    pods.forEach(function (p) { var u = clamp(typeof p.util === 'number' ? p.util : 0.5, 0, 1.5); sum += u; if (u > peak) peak = u; });
    return { load: sum / pods.length, peak: peak };
}

var FN = { office: officeParams, manufacture: manufactureParams, server: serverParams };

// Masuk ke adegan + ikuti state. Mengembalikan fungsi pembersih (taruh di daftar unsubs peta).
export function bindAmbience(name, bus, getData) {
    var fn = FN[name], last = 0, timer = 0;
    function push() {
        timer = 0; last = Date.now();
        if (fn) { try { AmbienceService.setParams(fn(getData())); } catch (e) {} }
    }
    function onState() {
        if (timer) return;
        timer = setTimeout(push, Math.max(0, 1500 - (Date.now() - last)));
    }
    AmbienceService.enter(name);
    push();
    var off = bus.on('state:changed', onState);
    return function () {
        if (typeof off === 'function') off();
        if (timer) { clearTimeout(timer); timer = 0; }
        AmbienceService.leave(name);
    };
}
