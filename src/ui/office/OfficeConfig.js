// FILE: src/ui/office/OfficeConfig.js
// Konstanta & util murni untuk Office 3D Map (dipisah dari OfficeScene.js).
import { ROLES, SKILL_TIERS, TRAITS } from '../../data/staff.data.js';

//
// Peningkatan v2027.52a (tahap 3):
//   * UPGRADE LANGSUNG DARI PETA — kartu Lab Chip memuat tombol "Bangun Fab" / "Upgrade ke …" lengkap
//     dengan harga, estimasi hari & alasan bila belum bisa (riset belum ada / uang kurang). Kartu staf
//     memuat tombol "Latih" (biaya & progres skill). Semua memakai sistem game yang sama dengan panel
//     (FabSystem.buildFab/upgradeFab, TeamSystem.trainStaff) — tidak ada logika ganda.
//   * Konstruksi 3D: saat Fab dibangun / di-upgrade, Lab Chip menampilkan lokasi konstruksi (perancah,
//     derek berputar, bangunan yang tumbuh, bar progres) dan kartu menampilkan persen + sisa hari.
//   * Staf lebih hidup: tujuan jalan sesuai peran (Lab, Studio Desain, Marketing, Showroom, Ruang CEO,
//     dispenser air), maksimal 5 staf berjalan sekaligus, rute bergantian tiap siklus, gelembung emoji
//     (☕ 💡 💤 🧪 🎨 📣 …), gerakan minum kopi di meja, dan baris "Aktivitas" yang hidup di kartu staf.
//   * Rapi di HP: kartu bawah bisa diciutkan, tinggi dibatasi + bisa di-scroll, area aman (notch),
//     tombol lebih besar, di layar lebar kartu jadi panel melayang; kamera otomatis bergeser supaya
//     ruangan/staf terpilih tidak tertutup kartu; chip ruangan tidak lagi "loncat" ke awal tiap update
//     dan otomatis menggulung ke chip terpilih; kartu tidak dibangun ulang bila isinya tak berubah
//     (ketukan tombol tidak lagi hilang saat state game berubah).
//
// Peningkatan v2027.51a (sesi 1) — tetap berlaku:
//   * Lantai bermotif per ruangan (kayu / ubin / grid / karpet), bayangan palsu di bawah perabot,
//     kolam cahaya hangat + jendela menyala saat malam (tema gelap), keset pintu, jam & papan nama
//     perusahaan di dinding.
//   * Staf lebih hidup: wajah (mata), rambut bervariasi, aksesori per peran (headphone / kacamata /
//     headset), plat nama berwarna sesuai tier skill, pose lesu saat moral rendah, dan beberapa staf
//     berjalan keluar meja menuju ruang CEO / Lab lalu kembali (hanya jika animasi aktif).
//   * Ruangan lebih detail: kipas rak server, lengan robot di Lab Chip, sinar spotlight showroom,
//     koin berputar di brankas, karpet + lukisan di ruang CEO, mesin kopi + laptop/PC sesuai era.
//   * Gelembung peringatan di atas ruangan (bug OS, kas negatif, moral staf rendah) + titik
//     peringatan pada chip ruangan.
//   * Interaksi: staf terpilih diberi cincin sorot + kamera fokus, kartu staf memuat trait & negara,
//     tombol legenda (ⓘ), pemulihan WebGL context-loss, kualitas render adaptif untuk HP lemah.
//   * Perbaikan: bug material 'glow' globe CEO, kebocoran tekstur, label tidak ikut ganti bahasa.
//
//   Staf            -> orang di meja (warna = peran, bola kecil = moral). Ketuk untuk detail.
//   Riset           -> Lab R&D (orb melayang = riset aktif, papan tulis = riset selesai)
//   Desain produk   -> Studio Desain (ponsel di turntable + 4 pip fase pengembangan)
//   OS              -> Ruang Server (rak = versi OS, LED merah = bug terbuka)
//   Fab / chip      -> Lab Chip (mesin = level Fab, konveyor jalan saat produksi)
//   Produk dijual   -> Showroom (podium per produk, peti = stok)
//   Kampanye        -> Ruang Marketing (layar menyala = kampanye aktif)
//   Kas / utang     -> Keuangan (brankas, tumpukan koin, map utang, papan bursa)
//   Reputasi/pangsa -> Ruang CEO (piala di rak)
//
// Ruangan terkunci tampil sebagai "blueprint" sampai syaratnya terpenuhi.
// Ketuk ruangan -> kartu info + tombol menuju panel terkait (lewat bus 'advisor:go').
// Level & era dibaca dari computePlan() milik Campus supaya konsisten dengan peta kampus.
// Render-on-demand; animasi ambient ~30fps dan berhenti saat tab tersembunyi / di luar layar.

export var BASE_VIEW = 17;
export var MAX_DPR = 1.75; // visual clarity on modern displays; adaptive quality still protects weaker phones
export var FRAME_MS = 33;
export var MIN_RESIZE_DELTA = 2;
export var MAX_DESKS = 30;
export var COLS = 6, ROWS = 5;
export var PHASES = ['design', 'prototype', 'production', 'released'];

// Denah lantai: x -9..9, z -6..6 (kamera isometrik melihat dari +x,+z).
export var FLOOR = { x0: -9, x1: 9, z0: -6, z1: 6 };

export var ROOM_DEFS = [
    { id: 'ceo', pat: 'wood',       x0: -9,   x1: -5.5, z0: -6,   z1: -1.5, tone: 0xe9d8c4, go: { nav: 'profile' } },
    { id: 'lab', pat: 'tile',       x0: -5.5, x1: -1,   z0: -6,   z1: -1.5, tone: 0xd6e8f5, go: { nav: 'research', subtab: 'tech' } },
    { id: 'design', pat: 'dots',    x0: -1,   x1: 3,    z0: -6,   z1: -1.5, tone: 0xe6dcf5, go: { nav: 'products', subtab: 'design' } },
    { id: 'server', pat: 'grid',    x0: 3,    x1: 6.5,  z0: -6,   z1: -1.5, tone: 0xd5ecea, go: { nav: 'research', subtab: 'os' } },
    { id: 'chip', pat: 'grid',      x0: 6.5,  x1: 9,    z0: -6,   z1: -1.5, tone: 0xf3e3cf, go: { nav: 'products', subtab: 'chip' } },
    { id: 'work', pat: 'carpet',      x0: -9,   x1: 3,    z0: -1.5, z1: 6,    tone: 0xe8ecf2, go: { nav: 'team', subtab: 'team' } },
    { id: 'showroom', pat: 'tile',  x0: 3,    x1: 9,    z0: -1.5, z1: 1.8,  tone: 0xf5e6e6, go: { nav: 'products', subtab: 'catalog' } },
    { id: 'marketing', pat: 'carpet', x0: 3,    x1: 6,    z0: 1.8,  z1: 6,    tone: 0xdff3e3, go: { nav: 'market', subtab: 'promo' } },
    { id: 'finance', pat: 'diag',   x0: 6,    x1: 9,    z0: 1.8,  z1: 6,    tone: 0xf6efcf, go: { nav: 'team', subtab: 'bank' },
                       go2: { nav: 'team', subtab: 'exchange', labelKey: 'office.btn.exchange' } }
];

// Warna tema sendiri (selain warna dari PALETTES kampus). [terang, gelap]
export var COLORS = {
    ground:  [0xe9edf4, 0x202735],
    base:    [0xcbd4e2, 0x303949],
    wall:    [0xf8fafc, 0x707d91],
    wallTop: [0xffffff, 0x9aa7ba],
    part:    [0xb9c5d5, 0x465367],
    desk:    [0xc9a47a, 0x8a6f52],
    deskTop: [0xe2c9a4, 0xa88a68],
    chair:   [0x5b6678, 0x7a8599],
    metal:   [0xaab4c2, 0x6c7686],
    rack:    [0x3a4352, 0x252b36],
    white:   [0xffffff, 0xc2cada],
    paper:   [0xf2efe6, 0xbdb9ad],
    gold:    [0xe0b445, 0xc9a13a],
    plant:   [0x6fb274, 0x4c8f66],
    pot:     [0xb78a62, 0x7d5f43],
    wood:    [0x9a6e46, 0x6f4f33],
    dark:    [0x2a303b, 0x161a21],
    red:     [0xef5350, 0xd0443f],
    amber:   [0xf5b83d, 0xd9a02a],
    green:   [0x43c07a, 0x38a468],
    glass:   [0x9cc7ee, 0x4f77b8],
    win:     [0x8fb4e8, 0x4f77b8],
    mat:     [0x8a97b3, 0x3a4560]
};

export var SKIN = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac];
export var HAIR = [0x1b1b1f, 0x3b2a1e, 0x6b4a2b, 0xb98b4a, 0xc7c7cc, 0x8c3b2a];
export var WALKERS_MAX = 5;               // staf yang boleh berjalan keluar meja (dibatasi juga oleh jumlah staf)
export var NARROW_PX = 640;               // di bawah lebar ini kartu = lembar bawah (HP); di atasnya = panel melayang
export var CORRIDORS = [-2.01, -0.56, 0.89, 2.34];   // lorong horizontal di antara baris meja (koordinat lokal Work)
export var DOOR_NORTH = { ceo: -4.25, lab: -0.25, design: 4.0 };      // x pintu di dinding utara Work
export var DOOR_EAST = { showroom: -2.05, marketing: 1.65 };          // z pintu di dinding timur Work
export var DEST_ROOM = { ceo: 'ceo', lab: 'lab', design: 'design', showroom: 'showroom', marketing: 'marketing' };
export var DEST_BY_ROLE = {
    engineer: ['lab', 'design', 'water', 'ceo'],
    designer: ['design', 'showroom', 'water', 'ceo'],
    marketer: ['marketing', 'showroom', 'water', 'ceo']
};
export var DEST_DEFAULT = ['water', 'showroom', 'ceo'];
export var DEST_EMOJI = { lab: '🧪', design: '🎨', marketing: '📣', showroom: '🛍️', ceo: '📋', water: '💧' };
export var SHADOW_OPACITY = 0.14;
export var MORALE_HEX = [0xef5350, 0xf5b83d, 0x43c07a];   // rendah, sedang, tinggi


// ============================================================
// UTIL
// ============================================================
export function len(a) { return Array.isArray(a) ? a.length : 0; }
export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function hash(str) {
    var h = 2166136261 >>> 0, s = String(str);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
}
export function tint(n, f) {   // f: -1 (gelap) .. 1 (terang)
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var tg = f < 0 ? 0 : 255, a = Math.abs(f);
    r = Math.round(r + (tg - r) * a); g = Math.round(g + (tg - g) * a); b = Math.round(b + (tg - b) * a);
    return (r << 16) | (g << 8) | b;
}
export function hexCss(n) { return '#' + ('000000' + (n >>> 0).toString(16)).slice(-6); }
export function fmtMoney(v) {
    var a = Math.abs(v), s = v < 0 ? '-$' : '$';
    if (a >= 1e9) return s + (a / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return s + (a / 1e6).toFixed(2) + 'M';
    if (a >= 1e4) return s + (a / 1e3).toFixed(1) + 'K';
    return s + Math.round(a).toLocaleString('en-US');
}
export function moraleTier(m) { return m >= 70 ? 2 : (m >= 40 ? 1 : 0); }
export function roleIndex(role) { for (var i = 0; i < ROLES.length; i++) if (ROLES[i].id === role) return i; return 99; }
export function roleDef(role) { for (var i = 0; i < ROLES.length; i++) if (ROLES[i].id === role) return ROLES[i]; return null; }
export function tierDef(n) { for (var i = 0; i < SKILL_TIERS.length; i++) if (SKILL_TIERS[i].tier === n) return SKILL_TIERS[i]; return SKILL_TIERS[0]; }
export function readAccent() {
    try {
        var v = getComputedStyle(document.documentElement).getPropertyValue('--accent');
        if (v && v.trim()) return v.trim();
    } catch (e) {}
    return '#2563eb';
}
export function prefersReducedMotion() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch (e) { return false; }
}
export function sortedStaff(data) {
    var list = Array.isArray(data.staff) ? data.staff.slice() : [];
    list.sort(function (a, b) {
        var d = roleIndex(a.role) - roleIndex(b.role);
        if (d) return d;
        d = (b.skill || 0) - (a.skill || 0);
        if (d) return d;
        return String(a.name).localeCompare(String(b.name));
    });
    return list;
}
export function roleCount(data, role) {
    var n = 0, s = data.staff || [];
    for (var i = 0; i < s.length; i++) if (s[i] && s[i].role === role) n++;
    return n;
}
export function deskCapacity(plan, staffN) {
    var byLevel = [6, 6, 12, 18, 30];
    var cap = byLevel[clamp(plan.levels.hq || 1, 0, 4)];
    return clamp(Math.max(cap, staffN), 6, MAX_DESKS);
}
export function lowMoraleCount(data) {
    var n = 0, s = data.staff || [];
    for (var i = 0; i < s.length; i++) if (s[i] && (s[i].morale || 0) < 40) n++;
    return n;
}
export function traitDef(id) { for (var i = 0; i < TRAITS.length; i++) if (TRAITS[i].id === id) return TRAITS[i]; return null; }
export function moneyBucket(v) {
    var s = v < 0 ? -1 : 1;
    return s * Math.floor(Math.log10(Math.max(1, Math.abs(v))) * 2);
}

