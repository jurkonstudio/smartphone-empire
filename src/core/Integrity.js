// FILE: src/core/Integrity.js
// ============================================================
// Integrity — tanda tangan save (tamper-evident), BUKAN enkripsi.
//
// Tujuan: edit manual localStorage / file export terdeteksi, sehingga
// saldo SIL & cash yang diubah tidak diterima diam-diam.
// Batasan jujur: kode klien bisa dibaca siapa pun, jadi ini hanya
// penghalang. Proteksi sesungguhnya = server (lihat supabase/hardening.sql).
// ============================================================

// Hash 53-bit sinkron (cyrb53) — cepat, tanpa dependensi.
function _h(str, seed) {
    var h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (var i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

var K1 = 'se|v1|' + 'jurkon-studio';
var K2 = 0x5e17a;

export var Integrity = {
    sign: function (data, savedAt) {
        var body = JSON.stringify(data);
        return _h(K1 + savedAt + body, K2) + '.' + _h(body.length + K1, K2 ^ 0x9e37);
    },
    verify: function (data, savedAt, sig) {
        if (!sig) return false;
        return this.sign(data, savedAt) === sig;
    },
    // Terapkan sanksi bila save diedit: SIL dikembalikan ke 0 & ditandai.
    penalize: function (data) {
        if (!data || typeof data !== 'object') return data;
        data.silicon = 0;
        data.tamperFlag = true;
        return data;
    }
};
