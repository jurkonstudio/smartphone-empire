// FILE: src/ui/panels/ManufactureUiState.js  (BARU)
// State UI ringan untuk sub-tab Manufaktur: bagian aktif, kartu yang dibuka, ukuran batch produksi.
// Dipakai bersama oleh ManufacturePanel & AssemblyPanel. Tidak disimpan ke save (hanya sesi).
export var MF_SECTIONS = ['overview', 'assembly', 'plants', 'chip'];

var _section = 'overview';
var _open = {};      // id kartu -> true/false
var _batch = {};     // plantId -> jumlah unit (0 = kapasitas penuh)

export function getSection() { return _section; }
export function setSection(id) { if (MF_SECTIONS.indexOf(id) >= 0) _section = id; return _section; }
export function isOpen(id, dflt) { return (id in _open) ? !!_open[id] : !!dflt; }
export function toggleOpen(id, dflt) { _open[id] = !isOpen(id, dflt); return _open[id]; }
export function getBatch(plantId, dflt) { return (plantId in _batch) ? _batch[plantId] : dflt; }
export function setBatch(plantId, qty) { _batch[plantId] = Math.max(0, parseInt(qty, 10) || 0); }

// token: 'sec:assembly' | 'tog:<id>:<defaultOpen 1|0>' | 'batch:<plantId>:<qty>'
// Mengembalikan true bila token dikenali (pemanggil lalu render ulang).
export function handleUiToken(token) {
    var p = String(token || '').split(':');
    if (p[0] === 'sec') { return MF_SECTIONS.indexOf(p[1]) >= 0 && (setSection(p[1]), true); }
    // id boleh memuat ':' (mis. plant:battery); elemen terakhir = default terbuka (1/0).
    if (p[0] === 'tog' && p.length >= 3) { toggleOpen(p.slice(1, -1).join(':'), p[p.length - 1] === '1'); return true; }
    if (p[0] === 'batch') { setBatch(p[1], p[2]); return true; }
    return false;
}
