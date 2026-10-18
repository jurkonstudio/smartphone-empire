// FILE: src/ui/office/OfficeScene.js  (REPLACE)
// v2027.51a — Office 3D Map: interior kantor isometrik (dollhouse) yang terhubung ke data game.
//
// Peningkatan v2027.51a (sesi 1):
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
import { computePlan, rememberPeak, PALETTES, ERA_WINDOWS } from '../campus/CampusBuildings.js';
import { createCampusControls } from '../campus/CampusControls.js';
import { ROLES, SKILL_TIERS, TRAITS } from '../../data/staff.data.js';
import { bus } from '../../core/EventBus.js';
import { t } from '../../core/LanguageService.js';

var BASE_VIEW = 17;
var MAX_DPR = 1.5;
var FRAME_MS = 33;
var MIN_RESIZE_DELTA = 2;
var MAX_DESKS = 30;
var COLS = 6, ROWS = 5;
var PHASES = ['design', 'prototype', 'production', 'released'];

// Denah lantai: x -9..9, z -6..6 (kamera isometrik melihat dari +x,+z).
var FLOOR = { x0: -9, x1: 9, z0: -6, z1: 6 };

var ROOM_DEFS = [
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
var COLORS = {
    ground:  [0xcfe6c8, 0x2d4a3b],
    base:    [0xdfe5ee, 0x3b4252],
    wall:    [0xf6f8fb, 0x8d98ab],
    wallTop: [0xffffff, 0xb4becd],
    part:    [0xc9d2de, 0x5b6578],
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

var SKIN = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac];
var HAIR = [0x1b1b1f, 0x3b2a1e, 0x6b4a2b, 0xb98b4a, 0xc7c7cc, 0x8c3b2a];
var WALKERS_MAX = 2;               // staf yang boleh berjalan keluar meja
var SHADOW_OPACITY = 0.14;
var MORALE_HEX = [0xef5350, 0xf5b83d, 0x43c07a];   // rendah, sedang, tinggi

// ============================================================
// UTIL
// ============================================================
function len(a) { return Array.isArray(a) ? a.length : 0; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function hash(str) {
    var h = 2166136261 >>> 0, s = String(str);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
}
function tint(n, f) {   // f: -1 (gelap) .. 1 (terang)
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var tg = f < 0 ? 0 : 255, a = Math.abs(f);
    r = Math.round(r + (tg - r) * a); g = Math.round(g + (tg - g) * a); b = Math.round(b + (tg - b) * a);
    return (r << 16) | (g << 8) | b;
}
function hexCss(n) { return '#' + ('000000' + (n >>> 0).toString(16)).slice(-6); }
function fmtMoney(v) {
    var a = Math.abs(v), s = v < 0 ? '-$' : '$';
    if (a >= 1e9) return s + (a / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return s + (a / 1e6).toFixed(2) + 'M';
    if (a >= 1e4) return s + (a / 1e3).toFixed(1) + 'K';
    return s + Math.round(a).toLocaleString('en-US');
}
function moraleTier(m) { return m >= 70 ? 2 : (m >= 40 ? 1 : 0); }
function roleIndex(role) { for (var i = 0; i < ROLES.length; i++) if (ROLES[i].id === role) return i; return 99; }
function roleDef(role) { for (var i = 0; i < ROLES.length; i++) if (ROLES[i].id === role) return ROLES[i]; return null; }
function tierDef(n) { for (var i = 0; i < SKILL_TIERS.length; i++) if (SKILL_TIERS[i].tier === n) return SKILL_TIERS[i]; return SKILL_TIERS[0]; }
function readAccent() {
    try {
        var v = getComputedStyle(document.documentElement).getPropertyValue('--accent');
        if (v && v.trim()) return v.trim();
    } catch (e) {}
    return '#2563eb';
}
function prefersReducedMotion() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch (e) { return false; }
}
function sortedStaff(data) {
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
function roleCount(data, role) {
    var n = 0, s = data.staff || [];
    for (var i = 0; i < s.length; i++) if (s[i] && s[i].role === role) n++;
    return n;
}
function deskCapacity(plan, staffN) {
    var byLevel = [6, 6, 12, 18, 30];
    var cap = byLevel[clamp(plan.levels.hq || 1, 0, 4)];
    return clamp(Math.max(cap, staffN), 6, MAX_DESKS);
}
function lowMoraleCount(data) {
    var n = 0, s = data.staff || [];
    for (var i = 0; i < s.length; i++) if (s[i] && (s[i].morale || 0) < 40) n++;
    return n;
}
function traitDef(id) { for (var i = 0; i < TRAITS.length; i++) if (TRAITS[i].id === id) return TRAITS[i]; return null; }
function moneyBucket(v) {
    var s = v < 0 ? -1 : 1;
    return s * Math.floor(Math.log10(Math.max(1, Math.abs(v))) * 2);
}

// ============================================================
// LOGIKA RUANGAN (murni, tanpa THREE) — status buka/terkunci, level, signature, teks kartu.
// ============================================================
var ROOM_LOGIC = {
    ceo: {
        state: function (d, p) { return { open: true, level: clamp(1 + (p.levels.monument || 0), 1, 3) }; },
        sig: function (d, p) { return [p.levels.monument || 0, Math.round((d.market && d.market.reputation) || 0) >= 50 ? 1 : 0, d.companyName].join('|'); },
        lines: function (d, p) {
            var share = d.market && typeof d.market.share === 'number' ? d.market.share : 0;
            if (share <= 1) share = share * 100;
            return [
                t('office.ceo.company', { name: d.companyName || '-' }),
                t('office.ceo.rep', { n: Math.round((d.market && d.market.reputation) || 0) }),
                t('office.ceo.share', { n: (Math.round(share * 10) / 10) }),
                t('office.ceo.trophies', { n: trophyCount(d, p) })
            ];
        }
    },
    work: {
        state: function (d, p) { return { open: true, level: clamp(p.levels.hq || 1, 1, 4) }; },
        sig: function (d, p) {
            var s = sortedStaff(d), parts = [deskCapacity(p, s.length), d.companyName || ''];
            for (var i = 0; i < s.length && i < MAX_DESKS; i++) {
                parts.push(s[i].id + ':' + s[i].role + ':' + (s[i].skill || 1) + ':' + moraleTier(s[i].morale || 0));
            }
            return parts.join(',');
        },
        lines: function (d, p) {
            var s = d.staff || [], sum = 0;
            for (var i = 0; i < s.length; i++) sum += (s[i].morale || 0);
            var lines = [
                t('office.work.staff', { n: s.length, cap: deskCapacity(p, s.length) }),
                t('office.work.roles', { e: roleCount(d, 'engineer'), d: roleCount(d, 'designer'), m: roleCount(d, 'marketer') })
            ];
            if (s.length) lines.push(t('office.work.morale', { n: Math.round(sum / s.length) }));
            if (s.length > MAX_DESKS) lines.push(t('office.more', { n: s.length - MAX_DESKS }));
            return lines;
        },
        alert: function (d) {
            var n = lowMoraleCount(d);
            return n ? { lvl: n >= 3 ? 'bad' : 'warn', key: 'office.alert.morale', n: n } : null;
        }
    },
    lab: {
        state: function (d, p) {
            var act = len(d.research && d.research.active) + len(d.chipResearch && d.chipResearch.active);
            var lv = p.levels.lab || 0;
            return { open: lv > 0 || act > 0, level: Math.max(1, lv), req: 'office.req.lab' };
        },
        sig: function (d) {
            return [len(d.research && d.research.active) + len(d.chipResearch && d.chipResearch.active),
                    Math.min(12, len(d.research && d.research.completed))].join('|');
        },
        lines: function (d) {
            return [
                t('office.lab.active', { n: len(d.research && d.research.active) + len(d.chipResearch && d.chipResearch.active) }),
                t('office.lab.done', { n: len(d.research && d.research.completed) + len(d.chipResearch && d.chipResearch.completed) })
            ];
        }
    },
    design: {
        state: function (d, p) {
            var pr = d.products || {};
            var open = roleCount(d, 'designer') > 0 || len(pr.catalog) > 0 || !!pr.designing || !!pr.development;
            return { open: open, level: clamp(1 + (roleCount(d, 'designer') >= 3 ? 1 : 0) + (roleCount(d, 'designer') >= 6 ? 1 : 0), 1, 3), req: 'office.req.design' };
        },
        sig: function (d) {
            var dev = d.products && d.products.development;
            return [dev ? dev.phase : '-', dev ? dev.id : '-', (d.products && d.products.designing) ? 1 : 0, roleCount(d, 'designer')].join('|');
        },
        lines: function (d) {
            var dev = d.products && d.products.development;
            var lines = [];
            if (dev) lines.push(t('office.design.dev', { name: dev.name || '-', phase: t('office.phase.' + (dev.phase || 'design')) }));
            else lines.push(t('office.design.idle'));
            lines.push(t('office.design.designers', { n: roleCount(d, 'designer') }));
            return lines;
        }
    },
    server: {
        state: function (d, p) {
            var lv = p.levels.os || 0;
            return { open: lv > 0 || !!(d.os && d.os.developing), level: Math.max(1, lv), req: 'office.req.server' };
        },
        sig: function (d) {
            return [len(d.os && d.os.versions), Math.min(12, len(d.os && d.os.bugs)), (d.os && d.os.developing) ? 1 : 0].join('|');
        },
        lines: function (d) {
            var bugs = len(d.os && d.os.bugs);
            var lines = [t('office.server.versions', { n: len(d.os && d.os.versions) }),
                         bugs ? t('office.server.bugs', { n: bugs }) : t('office.server.nobugs')];
            if (d.os && d.os.developing) lines.push(t('office.server.dev'));
            return lines;
        },
        alert: function (d) {
            var n = len(d.os && d.os.bugs);
            return n ? { lvl: n >= 5 ? 'bad' : 'warn', key: 'office.alert.bugs', n: n } : null;
        }
    },
    chip: {
        state: function (d, p) {
            var f = d.fab || {};
            var open = !!f.built || !!f.upgrade || (p.levels.factory || 0) > 0 ||
                len(d.chips && d.chips.catalog) > 0 || len(d.chipResearch && d.chipResearch.completed) > 0;
            return { open: open, level: Math.max(1, p.levels.factory || 0), req: 'office.req.chip' };
        },
        sig: function (d) {
            var f = d.fab || {};
            return [f.built ? (f.level || 1) : 0, f.producing ? 1 : 0, moneyBucket(f.inventory || 0), len(d.chips && d.chips.catalog)].join('|');
        },
        lines: function (d) {
            var f = d.fab || {};
            var lines = [f.built ? t('office.chip.fab', { n: f.level || 1 }) : t('office.chip.nofab'),
                         t('office.chip.designs', { n: len(d.chips && d.chips.catalog) })];
            if (f.built) lines.push(t('office.chip.inv', { n: Math.round(f.inventory || 0).toLocaleString('en-US') }));
            if (f.producing) lines.push(t('office.chip.producing'));
            return lines;
        }
    },
    showroom: {
        state: function (d, p) {
            return { open: len(d.products && d.products.catalog) > 0, level: Math.max(1, p.levels.store || 0), req: 'office.req.showroom' };
        },
        sig: function (d) {
            var cat = (d.products && d.products.catalog) || [], parts = [];
            for (var i = 0; i < cat.length; i++) parts.push(cat[i].id + ':' + (cat[i].status || '') + ':' + (cat[i].stock > 0 ? 1 : 0));
            return parts.join(',') + '|' + moneyBucket(totalStock(d));
        },
        lines: function (d) {
            var cat = (d.products && d.products.catalog) || [], sold = 0, selling = 0;
            for (var i = 0; i < cat.length; i++) { sold += (cat[i].totalSold || 0); if (cat[i].status === 'selling') selling++; }
            return [t('office.show.selling', { n: selling }),
                    t('office.show.stock', { n: Math.round(totalStock(d)).toLocaleString('en-US') }),
                    t('office.show.sold', { n: Math.round(sold).toLocaleString('en-US') })];
        },
        alert: function (d) {
            var cat = (d.products && d.products.catalog) || [], n = 0;
            for (var i = 0; i < cat.length; i++) if (cat[i].status === 'selling' && !(cat[i].stock > 0)) n++;
            return n ? { lvl: 'warn', key: 'office.alert.stock', n: n } : null;
        }
    },
    marketing: {
        state: function (d) {
            var m = roleCount(d, 'marketer'), c = len(d.marketing && d.marketing.activeCampaigns);
            return { open: m > 0 || c > 0, level: clamp(1 + (m >= 3 ? 1 : 0) + (m >= 6 ? 1 : 0), 1, 3), req: 'office.req.marketing' };
        },
        sig: function (d) { return [roleCount(d, 'marketer'), len(d.marketing && d.marketing.activeCampaigns)].join('|'); },
        lines: function (d) {
            return [t('office.mkt.campaigns', { n: len(d.marketing && d.marketing.activeCampaigns) }),
                    t('office.mkt.team', { n: roleCount(d, 'marketer') })];
        }
    },
    finance: {
        state: function () { return { open: true, level: 1 }; },
        sig: function (d) {
            return [moneyBucket(d.cash || 0), (d.cash || 0) < 0 ? 1 : 0, len(d.finance && d.finance.loans), len(d.stocks && d.stocks.portfolio)].join('|');
        },
        lines: function (d) {
            var debt = totalDebt(d);
            var lines = [t('office.fin.cash', { v: fmtMoney(d.cash || 0) }),
                         debt > 0 ? t('office.fin.debt', { v: fmtMoney(debt) }) : t('office.fin.nodebt')];
            var h = len(d.stocks && d.stocks.portfolio);
            if (h) lines.push(t('office.fin.holdings', { n: h }));
            return lines;
        },
        alert: function (d) {
            return (d.cash || 0) < 0 ? { lvl: 'bad', key: 'office.alert.cash', n: 1 } : null;
        }
    }
};

function totalStock(d) {
    var cat = (d.products && d.products.catalog) || [], s = 0;
    for (var i = 0; i < cat.length; i++) s += (cat[i].stock || 0);
    return s;
}
function totalDebt(d) {
    var l = (d.finance && d.finance.loans) || [], s = 0;
    for (var i = 0; i < l.length; i++) s += (l[i].remaining || 0);
    return s;
}
function trophyCount(d, p) {
    var rep = (d.market && d.market.reputation) || 0;
    return clamp((p.levels.monument || 0) + (rep >= 50 ? 1 : 0), 0, 3);
}

// Peringatan ruangan (murni). null = aman.
export function roomAlert(id, data, plan) {
    var logic = ROOM_LOGIC[id];
    if (!logic || !logic.alert) return null;
    try { return logic.alert(data, plan); } catch (e) { return null; }
}

// Info untuk kartu (ruangan). Dipakai scene & bisa dites tanpa THREE.
export function describeRoom(id, data, plan) {
    var def = null, i;
    for (i = 0; i < ROOM_DEFS.length; i++) if (ROOM_DEFS[i].id === id) def = ROOM_DEFS[i];
    var logic = ROOM_LOGIC[id];
    if (!def || !logic) return null;
    var st = logic.state(data, plan);
    var al = st.open ? roomAlert(id, data, plan) : null;
    var lines = st.open ? logic.lines(data, plan) : [t(st.req || 'office.status.locked')];
    if (al) lines.push('⚠ ' + t(al.key, { n: al.n }));
    return {
        id: id,
        title: t('office.room.' + id),
        open: st.open,
        alert: al,
        badge: st.open ? t('office.status.level', { n: st.level }) : t('office.status.locked'),
        lines: lines,
        go: st.open ? { nav: def.go.nav, subtab: def.go.subtab, label: t('office.go.' + id) } : null,
        go2: (st.open && def.go2) ? { nav: def.go2.nav, subtab: def.go2.subtab, label: t(def.go2.labelKey) } : null
    };
}

export function describeStaff(s) {
    var rd = roleDef(s.role), td = tierDef(s.skill || 1);
    var m = Math.round(s.morale || 0);
    var lines = [
        t('office.staff.sub', { role: rd ? rd.label : s.role, tier: td.label, m: m }),
        t('office.staff.salary', { v: fmtMoney(s.salary || 0) })
    ];
    var tr = [];
    if (Array.isArray(s.traits)) {
        for (var i = 0; i < s.traits.length; i++) { var td2 = traitDef(s.traits[i]); if (td2) tr.push(td2.label); }
    }
    if (tr.length) lines.push(t('office.staff.traits', { list: tr.join(', ') }));
    if (s.countryLabel) lines.push(t('office.staff.from', { c: (s.countryFlag ? s.countryFlag + ' ' : '') + s.countryLabel }));
    if (m < 40) lines.push('⚠ ' + t('office.staff.lowmorale'));
    return {
        title: s.name || '-',
        badge: rd ? rd.label : String(s.role),
        lines: lines,
        go: { nav: 'team', subtab: 'team', label: t('office.btn.team') }
    };
}

// ============================================================
// SCENE
// ============================================================
export function createOfficeScene(THREE, container, gameState) {
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    renderer.setClearColor(0x000000, 0);
    var canvas = renderer.domElement;
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', t('office.aria'));
    container.innerHTML = '';
    container.style.position = 'relative';
    container.appendChild(canvas);

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    var hemi = new THREE.HemisphereLight(0xffffff, 0xcccccc, 1);
    var sun = new THREE.DirectionalLight(0xfff1da, 0.8);
    sun.position.set(8, 12, 6);
    scene.add(hemi, sun);

    // ---------- geometri bersama ----------
    var G = {
        box: new THREE.BoxGeometry(1, 1, 1),
        cyl: new THREE.CylinderGeometry(1, 1, 1, 20),
        sph: new THREE.SphereGeometry(1, 16, 12),
        cone: new THREE.ConeGeometry(1, 1, 18),
        tor: new THREE.TorusGeometry(1, 0.07, 8, 28),
        plane: new THREE.PlaneGeometry(1, 1),
        circle: new THREE.CircleGeometry(1, 28),
        arc: new THREE.TorusGeometry(1, 0.07, 6, 18, Math.PI),
        ring: new THREE.RingGeometry(0.78, 1, 36)
    };

    // ---------- material bersama ----------
    var M = {};
    Object.keys(COLORS).forEach(function (k) { M[k] = new THREE.MeshLambertMaterial({ color: COLORS[k][0] }); });
    M.glass.transparent = true; M.glass.opacity = 0.55;
    M.ghost = new THREE.MeshLambertMaterial({ color: COLORS.desk[0], transparent: true, opacity: 0.4 });
    M.screenOn = new THREE.MeshBasicMaterial({ color: 0x8fb4e8 });
    M.screenOff = new THREE.MeshBasicMaterial({ color: 0x1b2028 });
    M.glow = new THREE.MeshBasicMaterial({ color: 0x00b8d9 });
    M.holo = new THREE.MeshBasicMaterial({ color: 0x00b8d9, transparent: true, opacity: 0.28, depthWrite: false });
    M.ledG = new THREE.MeshBasicMaterial({ color: 0x43e08a });
    M.ledR = new THREE.MeshBasicMaterial({ color: 0xff4d4d });
    M.ledA = new THREE.MeshBasicMaterial({ color: 0xffc247 });
    M.shade = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.12, depthWrite: false });
    M.pool = new THREE.MeshBasicMaterial({ color: 0xffe2a8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    M.selRing = new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.95, depthTest: false, side: THREE.DoubleSide });
    M.shade.opacity = SHADOW_OPACITY;
    var hairMat = HAIR.map(function (c) { return new THREE.MeshLambertMaterial({ color: c }); });
    var tierMat = {};
    SKILL_TIERS.forEach(function (tr) { tierMat[tr.tier] = new THREE.MeshBasicMaterial({ color: parseInt(String(tr.color).replace('#', ''), 16) || 0x949aab }); });
    var roleMat = {};
    ROLES.forEach(function (r) { roleMat[r.id] = new THREE.MeshLambertMaterial({ color: parseInt(String(r.color).replace('#', ''), 16) || 0x888888 }); });
    var skinMat = SKIN.map(function (c) { return new THREE.MeshLambertMaterial({ color: c }); });
    var moraleMat = MORALE_HEX.map(function (c) { return new THREE.MeshBasicMaterial({ color: c }); });
    var hueMats = {};
    function hueMat(key) {
        if (!hueMats[key]) {
            var h = hash(key) % 360;
            hueMats[key] = new THREE.MeshLambertMaterial({ color: new THREE.Color('hsl(' + h + ', 62%, 58%)') });
        }
        return hueMats[key];
    }

    function mesh(parent, geo, mat, sx, sy, sz, x, y, z) {
        var m = new THREE.Mesh(geo, typeof mat === 'string' ? M[mat] : mat);
        m.scale.set(sx, sy, sz);
        m.position.set(x, y, z);
        parent.add(m);
        return m;
    }
    function box(p, mat, w, h, d, x, y, z) { return mesh(p, G.box, mat, w, h, d, x, y, z); }
    function cyl(p, mat, r, h, x, y, z) { return mesh(p, G.cyl, mat, r, h, r, x, y, z); }
    function sph(p, mat, r, x, y, z) { return mesh(p, G.sph, mat, r, r, r, x, y, z); }
    function cone(p, mat, r, h, x, y, z) { return mesh(p, G.cone, mat, r, h, r, x, y, z); }
    // bayangan palsu: bidang gelap tipis di lantai (murah, tanpa shadow map)
    function shadowBox(p, w, d, x, z) {
        var m = mesh(p, G.plane, 'shade', w, d, 1, x, 0.03, z);
        m.rotation.x = -Math.PI / 2;
        return m;
    }
    function shadowRound(p, r, x, z) {
        var m = mesh(p, G.circle, 'shade', r, r, 1, x, 0.03, z);
        m.rotation.x = -Math.PI / 2;
        return m;
    }

    // ---------- tekstur motif lantai (putih transparan; warna diatur lewat material) ----------
    var ownTex = [];
    function makePatternTexture(type, w, d) {
        var c = document.createElement('canvas');
        c.width = 128; c.height = 128;
        var ctx = c.getContext('2d');
        ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 3;
        var i;
        ctx.beginPath();
        if (type === 'wood') {
            for (i = 0; i <= 128; i += 32) { ctx.moveTo(0, i); ctx.lineTo(128, i); }
            for (i = 0; i < 4; i++) { var off = (i % 2) * 64 + 20 * (i % 3); ctx.moveTo(off % 128, i * 32); ctx.lineTo(off % 128, i * 32 + 32); }
        } else if (type === 'tile') {
            ctx.moveTo(0, 0); ctx.lineTo(128, 0); ctx.moveTo(0, 0); ctx.lineTo(0, 128);
            ctx.moveTo(64, 0); ctx.lineTo(64, 128); ctx.moveTo(0, 64); ctx.lineTo(128, 64);
        } else if (type === 'grid') {
            ctx.lineWidth = 2;
            for (i = 0; i <= 128; i += 32) { ctx.moveTo(i, 0); ctx.lineTo(i, 128); ctx.moveTo(0, i); ctx.lineTo(128, i); }
        } else if (type === 'diag') {
            for (i = -128; i <= 128; i += 64) { ctx.moveTo(i, 0); ctx.lineTo(i + 128, 128); ctx.moveTo(i + 128, 0); ctx.lineTo(i, 128); }
        } else if (type === 'dots') {
            for (var gx = 16; gx < 128; gx += 32) for (var gy = 16; gy < 128; gy += 32) { ctx.moveTo(gx + 3, gy); ctx.arc(gx, gy, 3, 0, Math.PI * 2); }
            ctx.fill();
        } else {   // carpet: garis diagonal halus
            ctx.lineWidth = 2;
            for (i = -128; i <= 128; i += 16) { ctx.moveTo(i, 0); ctx.lineTo(i + 128, 128); }
        }
        if (type !== 'dots') ctx.stroke();
        var tex = new THREE.CanvasTexture(c);
        tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(Math.max(1, w / 2), Math.max(1, d / 2));
        ownTex.push(tex);
        return tex;
    }

    // ---------- label sprite ----------
    var labelTex = [];
    function makeLabel(text, dark, dim, accentHex) {
        var c = document.createElement('canvas');
        var ctx = c.getContext('2d');
        var font = '700 26px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.font = font;
        var w = Math.ceil(ctx.measureText(text).width) + 36, h = 52;
        c.width = w; c.height = h;
        ctx.font = font;
        ctx.fillStyle = dark ? 'rgba(20,24,32,0.88)' : 'rgba(255,255,255,0.92)';
        ctx.strokeStyle = hexCss(accentHex);
        ctx.lineWidth = 3;
        var r = 18;
        ctx.beginPath();
        ctx.moveTo(r, 2); ctx.lineTo(w - r, 2); ctx.quadraticCurveTo(w - 2, 2, w - 2, r);
        ctx.lineTo(w - 2, h - r); ctx.quadraticCurveTo(w - 2, h - 2, w - r, h - 2);
        ctx.lineTo(r, h - 2); ctx.quadraticCurveTo(2, h - 2, 2, h - r);
        ctx.lineTo(2, r); ctx.quadraticCurveTo(2, 2, r, 2);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = dark ? '#e8ecf4' : '#1b2230';
        ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
        ctx.fillText(text, w / 2, h / 2 + 1);
        var tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        labelTex.push(tex);
        var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, opacity: dim ? 0.7 : 1 });
        var sp = new THREE.Sprite(mat);
        sp.scale.set(0.46 * w / h, 0.46, 1);
        sp.renderOrder = 20;
        sp.userData.tex = tex;
        return sp;
    }

    // ---------- state scene ----------
    var dark = false, accentHex = 0x2563eb, eraIdx = 0, winHex = 0x8fb4e8;
    var rooms = {};           // id -> room obj
    var roomList = [];
    var staffObjs = {};       // staffId -> group (untuk highlight / info)
    var lastData = null, lastPlan = null;
    var selected = null;      // { room, staffId }
    var disposed = false;
    var animRooms = [];       // room yang punya tick()
    var aspect = 1, lastW = 0, lastH = 0, resizeScheduled = false, fitted = false;
    var raycaster = new THREE.Raycaster();
    var ndc = new THREE.Vector2();
    var raf = 0, loopRaf = 0, lastFrame = 0, inView = true, focusRaf = 0;
    var ambient = !prefersReducedMotion();
    var selRing = mesh(scene, G.ring, 'selRing', 0.5, 0.5, 1, 0, 0.05, 0);
    selRing.rotation.x = -Math.PI / 2;
    selRing.renderOrder = 15;
    selRing.visible = false;
    var alertTex = {};         // kind -> CanvasTexture bersama
    var legendOn = false;
    var quality = { slow: 0, fast: 0, lowered: false, frameMs: FRAME_MS };
    var lastRendered = 0, ctxLost = false;
    var tmpV = new THREE.Vector3();

    // ---------- shell statis (lantai dasar, dinding, partisi) ----------
    var shell = new THREE.Group();
    scene.add(shell);
    var ground = mesh(shell, G.plane, 'ground', 40, 40, 1, 0, -0.22, 0);
    ground.rotation.x = -Math.PI / 2;
    box(shell, 'base', 18.5, 0.18, 12.5, 0, -0.11, 0);

    function wallSeg(mat, x0, x1, z0, z1, h, th) {
        var w = Math.abs(x1 - x0) || th, d = Math.abs(z1 - z0) || th;
        return box(shell, mat, w, h, d, (x0 + x1) / 2, h / 2, (z0 + z1) / 2);
    }
    // dinding luar: belakang (z=-6) & kiri (x=-9) tinggi; depan & kanan rendah
    wallSeg('wall', FLOOR.x0 - 0.12, FLOOR.x1 + 0.12, FLOOR.z0 - 0.12, FLOOR.z0 + 0.12, 2.4, 0.24);
    wallSeg('wall', FLOOR.x0 - 0.12, FLOOR.x0 + 0.12, FLOOR.z0, FLOOR.z1, 2.4, 0.24);
    wallSeg('wallTop', FLOOR.x0 - 0.12, FLOOR.x1 + 0.12, FLOOR.z1 - 0.1, FLOOR.z1 + 0.12, 0.35, 0.22);
    wallSeg('wallTop', FLOOR.x1 - 0.1, FLOOR.x1 + 0.12, FLOOR.z0, FLOOR.z1, 0.35, 0.22);
    // jendela di dinding belakang & kiri
    var i0;
    for (i0 = 0; i0 < 11; i0++) {
        box(shell, 'win', 1.15, 0.8, 0.06, -8.2 + i0 * 1.64, 1.55, FLOOR.z0 + 0.13);
    }
    for (i0 = 0; i0 < 7; i0++) {
        if (i0 === 4 || i0 === 5) continue;     // ruang untuk papan nama perusahaan (BUILD.work)
        box(shell, 'win', 0.06, 0.8, 1.15, FLOOR.x0 + 0.13, 1.55, -5.1 + i0 * 1.7);
    }
    // jam dinding (jarum mengikuti jam game)
    var clockG = new THREE.Group();
    clockG.position.set(0.82, 1.55, FLOOR.z0 + 0.15);
    shell.add(clockG);
    cyl(clockG, 'gold', 0.25, 0.03, 0, 0, 0).rotation.x = Math.PI / 2;
    cyl(clockG, 'white', 0.21, 0.05, 0, 0, 0.005).rotation.x = Math.PI / 2;
    var clockHr = new THREE.Group(), clockMin = new THREE.Group();
    clockHr.position.z = 0.04; clockMin.position.z = 0.05;
    clockG.add(clockHr, clockMin);
    box(clockHr, 'dark', 0.03, 0.12, 0.01, 0, 0.06, 0);
    box(clockMin, 'dark', 0.02, 0.18, 0.01, 0, 0.09, 0);
    function setClock(data) {
        var tm = (data && data.time) || {};
        var h = typeof tm.currentHour === 'number' ? tm.currentHour : 9;
        var mi = typeof tm.currentMinute === 'number' ? tm.currentMinute : 0;
        clockHr.rotation.z = -(((h % 12) + mi / 60) / 12) * Math.PI * 2;
        clockMin.rotation.z = -(mi / 60) * Math.PI * 2;
    }

    // partisi dalam (setinggi 0.7) dengan celah pintu
    function partition(axis, fixed, from, to, gaps) {
        var cuts = [from], k;
        (gaps || []).forEach(function (g) {
            cuts.push(g - 0.6, g + 0.6);
            if (axis === 'x') {
                box(shell, 'mat', 1.0, 0.012, 0.5, g, 0.008, fixed);
                box(shell, 'wall', 0.1, 1.0, 0.1, g - 0.6, 0.5, fixed);
                box(shell, 'wall', 0.1, 1.0, 0.1, g + 0.6, 0.5, fixed);
            } else {
                box(shell, 'mat', 0.5, 0.012, 1.0, fixed, 0.008, g);
                box(shell, 'wall', 0.1, 1.0, 0.1, fixed, 0.5, g - 0.6);
                box(shell, 'wall', 0.1, 1.0, 0.1, fixed, 0.5, g + 0.6);
            }
        });
        cuts.push(to);
        for (k = 0; k < cuts.length; k += 2) {
            var a = cuts[k], b = cuts[k + 1];
            if (b - a < 0.05) continue;
            if (axis === 'x') wallSeg('part', a, b, fixed - 0.06, fixed + 0.06, 0.7, 0.12);
            else wallSeg('part', fixed - 0.06, fixed + 0.06, a, b, 0.7, 0.12);
        }
    }
    partition('x', -1.5, -9, 9, [-7.25, -3.25, 1, 4.75, 7.75]);          // z = -1.5 memanjang di x
    partition('z', -5.5, -6, -1.5, []);
    partition('z', -1, -6, -1.5, []);
    partition('z', 3, -6, 6, [0.2, 3.9]);
    partition('z', 6.5, -6, -1.5, []);
    partition('x', 1.8, 3, 9, [4.5]);
    partition('z', 6, 1.8, 6, [3.9]);

    // ---------- ruangan ----------
    ROOM_DEFS.forEach(function (def) {
        var w = def.x1 - def.x0, d = def.z1 - def.z0;
        var g = new THREE.Group();
        g.position.set((def.x0 + def.x1) / 2, 0, (def.z0 + def.z1) / 2);
        g.userData.roomId = def.id;
        var floorMat = new THREE.MeshLambertMaterial({ color: def.tone, transparent: true, opacity: 1 });
        var slab = box(g, floorMat, w - 0.12, 0.12, d - 0.12, 0, -0.04, 0);
        var ovMat = new THREE.MeshBasicMaterial({ color: accentHex, transparent: true, opacity: 0.26, depthWrite: false });
        var ov = mesh(g, G.plane, ovMat, w - 0.2, d - 0.2, 1, 0, 0.025, 0);
        ov.rotation.x = -Math.PI / 2;
        ov.visible = false;
        var patMat = new THREE.MeshBasicMaterial({ map: makePatternTexture(def.pat, w, d), color: 0x000000, transparent: true, opacity: 0.1, depthWrite: false });
        var pat = mesh(g, G.plane, patMat, w - 0.2, d - 0.2, 1, 0, 0.022, 0);
        pat.rotation.x = -Math.PI / 2;
        var pool = mesh(g, G.circle, 'pool', Math.min(w, d) * 0.44, Math.min(w, d) * 0.44, 1, 0, 0.03, 0);
        pool.rotation.x = -Math.PI / 2;
        pool.visible = false;
        var furn = new THREE.Group();
        g.add(furn);
        var r = { def: def, group: g, slab: slab, floorMat: floorMat, ov: ov, ovMat: ovMat, furn: furn,
                  pat: pat, patMat: patMat, pool: pool, alertSp: null, alertBase: 0,
                  w: w, d: d, sig: null, st: null, label: null, tick: null, locked: false };
        rooms[def.id] = r;
        roomList.push(r);
        scene.add(g);
    });

    // ---------- bangunan perabot ----------
    function monitor(p, x, y, z, on) {
        var scr = on ? 'screenOn' : 'screenOff';
        if (eraIdx <= 1) {                                // CRT tebal
            box(p, 'paper', 0.42, 0.34, 0.38, x, y + 0.17, z);
            box(p, scr, 0.32, 0.24, 0.02, x, y + 0.18, z + 0.2);
        } else {                                          // layar datar
            box(p, 'dark', 0.5, 0.3, 0.03, x, y + 0.26, z);
            box(p, scr, 0.46, 0.26, 0.012, x, y + 0.26, z + 0.02);
            box(p, 'metal', 0.07, 0.12, 0.05, x, y + 0.06, z);
        }
    }
    function chair(p, x, z, mat) {
        cyl(p, 'metal', 0.035, 0.28, x, 0.14, z);
        box(p, mat || 'chair', 0.42, 0.07, 0.42, x, 0.3, z);
        box(p, mat || 'chair', 0.42, 0.4, 0.05, x, 0.52, z + 0.2);
    }
    function plant(p, x, z, s) {
        s = s || 1;
        cyl(p, 'pot', 0.16 * s, 0.24 * s, x, 0.12 * s, z);
        sph(p, 'plant', 0.24 * s, x, 0.42 * s, z);
        sph(p, 'plant', 0.16 * s, x + 0.1 * s, 0.6 * s, z - 0.05 * s);
    }
    function desk(p, x, z, ghost) {
        var top = ghost ? 'ghost' : 'deskTop', side = ghost ? 'ghost' : 'desk';
        box(p, top, 1.3, 0.07, 0.65, x, 0.62, z);
        box(p, side, 0.06, 0.58, 0.6, x - 0.58, 0.29, z);
        box(p, side, 0.06, 0.58, 0.6, x + 0.58, 0.29, z);
        box(p, side, 1.1, 0.3, 0.04, x, 0.4, z - 0.28);
    }
    function phoneModel(p, mat, scale) {
        var g = new THREE.Group();
        box(g, mat || 'dark', 0.3, 0.6, 0.05, 0, 0, 0);
        box(g, 'screenOn', 0.26, 0.54, 0.012, 0, 0, 0.03);
        box(g, 'metal', 0.05, 0.03, 0.06, 0, 0.26, -0.005);
        g.scale.setScalar(scale || 1);
        p.add(g);
        return g;
    }
    // ---------- orang ----------
    // path (opsional): titik-titik {x,z} dari kursi ke tujuan; staf berdiri, berjalan, lalu kembali duduk.
    function makeWalk(path, seed) {
        var cum = [0], i, total = 0;
        for (i = 1; i < path.length; i++) {
            total += Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z);
            cum.push(total);
        }
        var SPEED = 0.95, SIT = 16 + (seed % 14), STAY = 2.6;
        var tW = total / SPEED, cycle = SIT + tW + STAY + tW, off = (seed % 97) * 0.9;
        function pointAt(d) {
            var k = 1;
            while (k < cum.length - 1 && d > cum[k]) k++;
            var seg = cum[k] - cum[k - 1] || 1, u = clamp((d - cum[k - 1]) / seg, 0, 1);
            return { x: path[k - 1].x + (path[k].x - path[k - 1].x) * u, z: path[k - 1].z + (path[k].z - path[k - 1].z) * u,
                     dx: path[k].x - path[k - 1].x, dz: path[k].z - path[k - 1].z };
        }
        // -> { x, z, lift 0..1, moving, dx, dz }
        return function (sec) {
            var tt = (sec + off) % cycle, pt;
            if (tt < SIT) return { x: path[0].x, z: path[0].z, lift: 0, moving: false, dx: 0, dz: -1 };
            tt -= SIT;
            if (tt < tW) {
                pt = pointAt(tt * SPEED);
                return { x: pt.x, z: pt.z, lift: Math.min(1, tt / 0.3), moving: true, dx: pt.dx, dz: pt.dz };
            }
            tt -= tW;
            var last = path[path.length - 1];
            if (tt < STAY) return { x: last.x, z: last.z, lift: 1, moving: false, dx: 0, dz: 0, idle: true };
            tt -= STAY;
            pt = pointAt(total - tt * SPEED);
            return { x: pt.x, z: pt.z, lift: Math.min(1, (tW - tt) / 0.3), moving: true, dx: -pt.dx, dz: -pt.dz };
        };
    }

    function person(p, s, x, z, tickers, opts) {
        opts = opts || {};
        var h = hash(s.id);
        // kursi (diam di meja)
        var seat = new THREE.Group();
        seat.userData.staffId = s.id;
        seat.position.set(x, 0, z);
        chair(seat, 0, 0.0);
        shadowRound(seat, 0.34, 0, 0.02);
        p.add(seat);

        // badan (bisa berjalan)
        var g = new THREE.Group();
        g.userData.staffId = s.id;
        g.position.set(x, 0, z);
        var mt = moraleTier(s.morale || 0);
        var rm = roleMat[s.role] || roleMat.engineer;
        var skin = skinMat[h % skinMat.length];
        var hairM = hairMat[(h >> 3) % hairMat.length];
        var style = (h >> 6) % 3;
        var torso = cyl(g, rm, 0.15, 0.42, 0, 0.62, -0.02);                 // badan
        var headG = new THREE.Group();
        headG.position.set(0, 0.97, -0.02);
        g.add(headG);
        sph(headG, skin, 0.115, 0, 0, 0);                                   // kepala
        sph(headG, hairM, 0.12, 0, 0.03, 0.03).scale.set(0.12, 0.07, 0.12); // rambut (topi)
        if (style === 1) box(headG, hairM, 0.2, 0.2, 0.06, 0, -0.02, 0.1);  // rambut panjang
        else if (style === 2) sph(headG, hairM, 0.05, 0, 0.13, 0.04);       // cepol
        box(headG, 'dark', 0.02, 0.03, 0.01, -0.04, 0.012, -0.112);         // mata
        box(headG, 'dark', 0.02, 0.03, 0.01, 0.04, 0.012, -0.112);
        if (s.role === 'engineer') {                                        // headphone
            mesh(headG, G.arc, 'dark', 0.125, 0.125, 0.125, 0, 0, 0);
            cyl(headG, 'dark', 0.04, 0.035, -0.125, 0, 0).rotation.z = Math.PI / 2;
            cyl(headG, 'dark', 0.04, 0.035, 0.125, 0, 0).rotation.z = Math.PI / 2;
        } else if (s.role === 'designer') {                                 // kacamata
            box(headG, 'dark', 0.17, 0.012, 0.01, 0, 0.02, -0.114);
            box(headG, 'glass', 0.06, 0.05, 0.008, -0.045, 0.015, -0.116);
            box(headG, 'glass', 0.06, 0.05, 0.008, 0.045, 0.015, -0.116);
        } else if (s.role === 'marketer') {                                 // headset + mic
            cyl(headG, 'dark', 0.035, 0.03, 0.125, 0, 0).rotation.z = Math.PI / 2;
            box(headG, 'dark', 0.012, 0.012, 0.1, 0.09, -0.05, -0.07);
        }
        var armL = box(g, rm, 0.07, 0.07, 0.32, -0.14, 0.7, -0.2);
        var armR = box(g, rm, 0.07, 0.07, 0.32, 0.14, 0.7, -0.2);
        var dot = sph(g, moraleMat[mt], 0.055, 0, 1.2, -0.02);              // indikator moral
        var legs = new THREE.Group();                                        // kaki (hanya terlihat saat berdiri)
        var legL = box(legs, 'dark', 0.07, 0.73, 0.08, -0.06, 0.045, -0.02);
        var legR = box(legs, 'dark', 0.07, 0.73, 0.08, 0.06, 0.045, -0.02);
        legs.visible = false;
        g.add(legs);
        if (mt === 0) { headG.rotation.x = -0.38; }                           // lesu saat moral rendah
        var ph = (h % 628) / 100;
        var amp = mt === 0 ? 0.006 : 0.012;
        var walk = (opts.path && ambient) ? makeWalk(opts.path, h) : null;
        tickers.push(function (sec) {
            var b = Math.sin(sec * 2 + ph);
            var ws = walk ? walk(sec) : null;
            var lift = ws ? ws.lift : 0;
            if (ws) {
                g.position.x = ws.x; g.position.z = ws.z;
                g.position.y = lift * 0.32;
                if (ws.moving || ws.idle) { if (ws.dx || ws.dz) g.rotation.y = Math.atan2(-ws.dx, -ws.dz); }
                else g.rotation.y = 0;
                legs.visible = lift > 0.02;
            }
            var base = mt === 0 ? 0.93 : 0.97;
            headG.position.y = base + b * amp;
            dot.position.y = 1.2 + b * 0.02;
            if (ws && ws.moving) {
                var sw = Math.sin(sec * 8 + ph);
                armL.position.y = 0.7; armR.position.y = 0.7;
                armL.rotation.x = sw * 0.5; armR.rotation.x = -sw * 0.5;
                legL.rotation.x = -sw * 0.5; legR.rotation.x = sw * 0.5;
            } else {
                armL.rotation.x = 0; armR.rotation.x = 0; legL.rotation.x = 0; legR.rotation.x = 0;
                var typing = lift < 0.5;
                var k = mt === 0 ? 0.5 : 1;
                armL.position.y = 0.7 + (typing ? Math.sin(sec * 9 + ph) * 0.012 * k : 0);
                armR.position.y = 0.7 + (typing ? Math.cos(sec * 8 + ph) * 0.012 * k : 0);
            }
        });
        void torso;
        staffObjs[s.id] = g;
        p.add(g);
        return g;
    }

    function signTexture(text) {
        var c = document.createElement('canvas');
        c.width = 512; c.height = 128;
        var ctx = c.getContext('2d');
        ctx.fillStyle = dark ? '#1b2230' : '#ffffff';
        ctx.fillRect(0, 0, 512, 128);
        ctx.fillStyle = hexCss(accentHex);
        ctx.fillRect(0, 0, 14, 128);
        ctx.fillRect(0, 116, 512, 12);
        var fs = 54, str = String(text || 'Smartphone Empire');
        ctx.font = '800 ' + fs + 'px system-ui, -apple-system, "Segoe UI", sans-serif';
        while (ctx.measureText(str).width > 450 && fs > 22) { fs -= 4; ctx.font = '800 ' + fs + 'px system-ui, -apple-system, "Segoe UI", sans-serif'; }
        ctx.fillStyle = dark ? '#f0f3fa' : '#1b2230';
        ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
        ctx.fillText(str, 262, 58);
        var tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        ownTex.push(tex);
        return tex;
    }
    // jalur jalan staf: kursi -> lorong -> pintu ruang tujuan (koordinat lokal ruang Work)
    var AISLES = [-4, -2, 0, 2, 4];
    function walkPath(x, z, gapX, endZ) {
        var aisle = AISLES[0], best = 99, i;
        for (i = 0; i < AISLES.length; i++) {
            var a = AISLES[i];
            if (Math.abs(a - x) > 1.05) continue;               // hanya lorong yang bersebelahan dengan meja
            var sc = Math.abs(a - gapX);
            if (sc < best) { best = sc; aisle = a; }
        }
        var pts = [{ x: x, z: z }, { x: aisle, z: z }, { x: aisle, z: -3.5 }];
        if (Math.abs(gapX - aisle) > 0.05) pts.push({ x: gapX, z: -3.5 });
        pts.push({ x: gapX, z: endZ });
        return pts;
    }

    var BUILD = {};

    BUILD.ceo = function (r, d, p, st, tk) {
        var f = r.furn;
        var rug = box(f, new THREE.MeshLambertMaterial({ color: tint(accentHex, dark ? -0.45 : 0.6) }), 2.4, 0.02, 1.8, 0.1, 0.02, -0.45);
        rug.userData.own = 1;                                            // karpet mengikuti warna aksen
        shadowBox(f, 1.8, 0.95, 0.1, -0.85);
        shadowBox(f, 0.9, 1.4, -1.25, 1.2);
        shadowBox(f, 2.6, 0.45, 0, -1.95);
        box(f, 'wood', 1.7, 0.08, 0.8, 0.1, 0.72, -0.9);
        box(f, 'desk', 0.08, 0.7, 0.7, -0.7, 0.35, -0.9);
        box(f, 'desk', 0.08, 0.7, 0.7, 0.9, 0.35, -0.9);
        monitor(f, 0.1, 0.76, -1.0, true);
        box(f, 'gold', 0.3, 0.05, 0.08, 0.4, 0.78, -0.62);               // papan nama
        chair(f, 0.1, -0.15, 'wood');
        box(f, 'wood', 2.5, 1.3, 0.3, 0.0, 0.65, -2.05);                 // rak buku
        var cols = [accentHex, 0xe0b445, 0x43c07a, 0xef5350, 0x8a7fe0, 0x4fb3e8];
        for (var i = 0; i < 9; i++) box(f, new THREE.MeshLambertMaterial({ color: cols[i % cols.length] }), 0.16, 0.34, 0.2, -1.0 + i * 0.25, 0.92, -1.93).userData.own = 1;
        var tn = trophyCount(d, p);
        for (var k = 0; k < tn; k++) {
            cyl(f, 'gold', 0.1, 0.05, -0.8 + k * 0.45, 1.36, -2.0);
            cyl(f, 'gold', 0.03, 0.2, -0.8 + k * 0.45, 1.46, -2.0);
            sph(f, 'gold', 0.1, -0.8 + k * 0.45, 1.64, -2.0);
        }
        box(f, 'chair', 0.7, 0.35, 1.3, -1.2, 0.18, 1.2);                // sofa
        box(f, 'chair', 0.18, 0.55, 1.3, -1.5, 0.4, 1.2);
        plant(f, 1.3, 1.7, 1.1);
        // lukisan di dinding kiri + lampu meja
        box(f, 'wood', 0.05, 0.62, 0.92, -1.6, 1.45, 0.2);
        var art = box(f, new THREE.MeshLambertMaterial({ color: tint(accentHex, 0.3) }), 0.03, 0.5, 0.8, -1.57, 1.45, 0.2);
        art.userData.own = 1;
        box(f, 'gold', 0.03, 0.2, 0.3, -1.55, 1.4, 0.35);
        cyl(f, 'metal', 0.05, 0.02, -0.4, 0.77, -1.05);
        box(f, 'amber', 0.04, 0.2, 0.04, -0.4, 0.88, -1.05);
        if ((p.levels.monument || 0) >= 2) {                              // globe
            cyl(f, 'metal', 0.18, 0.06, 1.25, 0.03, -0.2);
            var gl = sph(f, 'glow', 0.28, 1.25, 0.4, -0.2);
            tk.push(function (sec) { gl.rotation.y = sec * 0.6; });
        }
    };

    BUILD.work = function (r, d, p, st, tk) {
        var f = r.furn;
        var staff = sortedStaff(d);
        var cap = deskCapacity(p, staff.length);
        var showN = Math.min(staff.length, MAX_DESKS);
        // pilih staf yang boleh berjalan (maks WALKERS_MAX, moral cukup, hanya bila animasi aktif)
        var walkers = {};
        if (ambient && showN >= 3) {
            var wn = 0;
            for (var q = 0; q < showN && wn < WALKERS_MAX; q++) {
                if ((staff[q].morale || 0) >= 40 && hash(staff[q].id) % 3 === 0) { walkers[staff[q].id] = wn; wn++; }
            }
        }
        for (var i = 0; i < cap; i++) {
            var col = i % COLS, row = Math.floor(i / COLS);
            if (row >= ROWS) break;
            var x = -5 + col * 2.0, z = -2.95 + row * 1.45;
            var s = i < showN ? staff[i] : null;
            shadowBox(f, 1.5, 0.95, x, z + 0.1);
            desk(f, x, z, !s);
            if (s) {
                monitor(f, x, 0.655, z - 0.1, true);
                var hs = hash(s.id);
                if (eraIdx <= 1) {
                    box(f, 'paper', 0.2, 0.4, 0.45, x + 0.3, 0.2, z - 0.02);              // PC tower di bawah meja
                } else {
                    box(f, 'metal', 0.34, 0.015, 0.24, x - 0.38, 0.665, z + 0.04);        // laptop
                    box(f, 'dark', 0.34, 0.21, 0.012, x - 0.38, 0.77, z - 0.08).rotation.x = -0.2;
                }
                cyl(f, hueMat('m' + (hs % 7)), 0.03, 0.06, x + 0.46, 0.7, z + 0.1);       // cangkir
                box(f, tierMat[clamp(s.skill || 1, 1, 5)], 0.2, 0.015, 0.06, x, 0.66, z + 0.27);   // plat tier skill
                var opts = null;
                if (walkers[s.id] !== undefined) {
                    var k = walkers[s.id];
                    var gapX = k === 0 ? -4.25 : -0.25;                                    // pintu ke Ruang CEO / Lab
                    var target = k === 0 ? rooms.ceo : rooms.lab;
                    var inside = !!(target && target.st && target.st.open);
                    opts = { path: walkPath(x, z + 0.52, gapX, inside ? -4.45 : -3.95) };
                }
                person(f, s, x, z + 0.52, tk, opts);
            }
        }
        plant(f, -5.75, -3.55, 0.9);
        plant(f, 5.75, -3.55, 0.9);
        plant(f, 5.6, 3.3, 1.2);
        shadowRound(f, 0.3, -5.7, 3.3);
        cyl(f, 'metal', 0.17, 0.12, -5.7, 0.06, 3.3);                     // dispenser air
        cyl(f, 'glass', 0.15, 0.5, -5.7, 0.4, 3.3);
        shadowBox(f, 0.5, 0.45, 5.72, 0.2);
        box(f, 'white', 0.3, 0.7, 0.4, 5.72, 0.35, 0.2);                  // printer
        // papan nama perusahaan di dinding kiri
        var tex = signTexture(d.companyName);
        var sm = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        var sign = mesh(f, G.plane, sm, 2.3, 0.575, 1, -5.84, 1.55, 0.3);
        sign.rotation.y = Math.PI / 2;
        sign.userData.own = 1; sign.userData.tex = tex;
    };

    BUILD.lab = function (r, d, p, st, tk) {
        var f = r.furn;
        var nB = Math.min(4, 1 + st.level);
        var act = Math.min(6, len(d.research && d.research.active) + len(d.chipResearch && d.chipResearch.active));
        shadowRound(f, 0.7, 0, 0.5);
        for (var i = 0; i < nB; i++) {
            var x = (i - (nB - 1) / 2) * 1.1;
            box(f, 'metal', 0.9, 0.5, 0.55, x, 0.25, -1.4);
            box(f, 'white', 0.96, 0.04, 0.6, x, 0.52, -1.4);
            cyl(f, 'glass', 0.08, 0.22, x - 0.2, 0.65, -1.4);
            cyl(f, 'glass', 0.06, 0.3, x + 0.15, 0.69, -1.4);
            sph(f, 'glow', 0.05, x - 0.2, 0.62, -1.4);
        }
        cyl(f, 'metal', 0.55, 0.3, 0, 0.15, 0.5);                         // meja holo
        cyl(f, 'glow', 0.4, 0.03, 0, 0.32, 0.5);
        var ring = mesh(f, G.tor, 'glow', 0.6, 0.6, 0.6, 0, 1.0, 0.5);
        ring.rotation.x = Math.PI / 2;
        ring.visible = act > 0;
        var orbs = [];
        for (var o = 0; o < act; o++) orbs.push(sph(f, 'glow', 0.13, 0, 1.2, 0.5));
        tk.push(function (sec) {
            ring.rotation.z = sec * 1.2;
            for (var q = 0; q < orbs.length; q++) {
                var a = sec * 0.9 + q * (Math.PI * 2 / orbs.length);
                orbs[q].position.set(Math.cos(a) * 0.9, 1.1 + Math.sin(sec * 2 + q) * 0.08, 0.5 + Math.sin(a) * 0.9);
            }
        });
        box(f, 'white', 3.4, 1.0, 0.05, 0, 1.3, -2.18);                   // papan riset selesai
        var done = Math.min(12, len(d.research && d.research.completed));
        for (var c = 0; c < 12; c++) {
            box(f, c < done ? 'glow' : 'part', 0.24, 0.24, 0.02, -1.4 + (c % 6) * 0.56, 1.5 - Math.floor(c / 6) * 0.4, -2.14);
        }
        plant(f, 1.9, 1.8, 0.9);
    };

    BUILD.design = function (r, d, p, st, tk) {
        var f = r.furn;
        var dev = d.products && d.products.development;
        var idx = dev ? Math.max(0, PHASES.indexOf(dev.phase)) : -1;
        shadowRound(f, 0.9, 0, 0.3);
        cyl(f, 'metal', 0.75, 0.16, 0, 0.08, 0.3);
        var pg = phoneModel(f, dev ? 'dark' : 'ghost', 1.5);
        pg.position.set(0, 0.62, 0.3);
        if (!dev) pg.scale.setScalar(1.1);
        tk.push(function (sec) { pg.rotation.y = dev ? sec * 1.0 : sec * 0.3; });
        for (var i = 0; i < 4; i++) box(f, i <= idx ? 'glow' : 'screenOff', 0.14, 0.14, 0.14, -0.33 + i * 0.22, 0.1, 1.45);
        for (var k = 0; k < 2; k++) {
            var x = -1.2 + k * 2.4;
            desk(f, x, -1.5, false);
            monitor(f, x, 0.655, -1.6, true);
            box(f, 'dark', 0.5, 0.02, 0.32, x, 0.67, -1.3);                // tablet gambar
            chair(f, x, -0.8);
        }
        box(f, 'white', 3.0, 1.0, 0.05, 0, 1.3, -2.18);                    // mood board
        var cs = [accentHex, 0xe0b445, 0x43c07a, 0xef5350, 0x8a7fe0, 0x4fb3e8, 0xf472b6, 0xfb923c];
        for (var c = 0; c < 8; c++) {
            box(f, new THREE.MeshLambertMaterial({ color: cs[c] }), 0.5, 0.34, 0.02, -1.0 + (c % 4) * 0.67, 1.48 - Math.floor(c / 4) * 0.42, -2.14).userData.own = 1;
        }
    };

    BUILD.server = function (r, d, p, st, tk) {
        var f = r.furn;
        var n = Math.min(6, 2 * st.level);
        var bugs = Math.min(len(d.os && d.os.bugs), n * 2);
        var cols = Math.min(3, n), leds = [], placed = 0, fans = [];
        for (var i = 0; i < n; i++) {
            var col = i % 3, row = Math.floor(i / 3);
            var x = (col - (cols - 1) / 2) * 1.0, z = -1.6 + row * 1.5;
            shadowBox(f, 0.85, 0.75, x, z);
            box(f, 'rack', 0.7, 1.4, 0.6, x, 0.7, z);
            cyl(f, 'dark', 0.14, 0.03, x, 1.415, z);                           // kipas pendingin
            var blade = box(f, 'metal', 0.24, 0.012, 0.04, x, 1.435, z);
            fans.push(blade);
            box(f, 'metal', 0.62, 0.04, 0.02, x, 1.3, z + 0.31);
            for (var k = 0; k < 5; k++) {
                var bad = placed < bugs && (k % 2 === 0);
                if (bad) placed++;
                var led = box(f, bad ? 'ledR' : 'ledG', 0.09, 0.05, 0.02, x - 0.22 + (k % 2) * 0.12, 0.35 + k * 0.17, z + 0.31);
                leds.push({ m: led, bad: bad, ph: (i * 5 + k) * 0.7 });
            }
            box(f, 'ledA', 0.28, 0.04, 0.02, x + 0.18, 1.1, z + 0.31);
        }
        box(f, 'dark', 3.0, 0.02, 0.1, 0, 0.012, 0.9);                      // kabel
        box(f, 'dark', 0.1, 0.02, 2.4, -1.4, 0.012, 0);
        var holo = null;
        if (d.os && d.os.developing) {
            holo = cyl(f, 'holo', 0.3, 1.5, 0, 0.75, 1.55);
            var hr = mesh(f, G.tor, 'glow', 0.4, 0.4, 0.4, 0, 1.0, 1.55);
            hr.rotation.x = Math.PI / 2;
            tk.push(function (sec) { hr.position.y = 0.6 + (Math.sin(sec * 1.5) * 0.5 + 0.5) * 0.8; });
        }
        tk.push(function (sec) {
            for (var fi = 0; fi < fans.length; fi++) fans[fi].rotation.y = sec * 12 + fi;
            for (var q = 0; q < leds.length; q++) {
                var l = leds[q];
                l.m.visible = l.bad ? (Math.sin(sec * 6 + l.ph) > -0.2) : (Math.sin(sec * 3 + l.ph) > -0.75);
            }
        });
        if (!holo) plant(f, 1.4, 1.8, 0.8);
    };

    BUILD.chip = function (r, d, p, st, tk) {
        var f = r.furn;
        var fab = d.fab || {};
        if (!fab.built) {
            box(f, 'wood', 1.6, 0.08, 0.8, 0, 0.7, -1.2);
            box(f, 'desk', 0.08, 0.68, 0.7, -0.7, 0.34, -1.2);
            box(f, 'desk', 0.08, 0.68, 0.7, 0.7, 0.34, -1.2);
            box(f, 'paper', 0.5, 0.01, 0.35, -0.3, 0.75, -1.2);
            if (len(d.chips && d.chips.catalog) || len(d.chipResearch && d.chipResearch.completed)) {
                cyl(f, 'gold', 0.28, 0.03, 0.35, 0.76, -1.2);
                box(f, 'dark', 0.14, 0.03, 0.14, 0.35, 0.79, -1.2);
            }
            chair(f, 0, -0.5);
            plant(f, 0.9, 1.8, 0.9);
            return;
        }
        var nM = Math.min(4, fab.level || 1);
        for (var i = 0; i < nM; i++) {
            var z = -1.8 + i * 1.05;
            box(f, 'metal', 0.9, 1.0, 0.8, -0.55, 0.5, z);
            box(f, 'glow', 0.04, 0.35, 0.55, -0.09, 0.62, z);
            box(f, 'ledA', 0.1, 0.06, 0.06, -0.8, 1.04, z);
        }
        box(f, 'dark', 0.5, 0.05, 4.0, 0.5, 0.06, -0.2);                    // konveyor
        var items = [];
        for (var k = 0; k < 6; k++) items.push(box(f, 'gold', 0.2, 0.1, 0.2, 0.5, 0.14, -2.0 + k * 0.7));
        var prod = !!fab.producing;
        tk.push(function (sec) {
            for (var q = 0; q < items.length; q++) {
                var base = -2.0 + q * 0.7;
                items[q].position.z = prod ? (-2.0 + ((base + 2.0 + sec * 0.8) % 4.2)) : base;
            }
        });
        // lengan robot: bergerak saat produksi berjalan
        shadowRound(f, 0.25, 1.0, -0.6);
        cyl(f, 'metal', 0.13, 0.3, 1.0, 0.15, -0.6);
        var armP = new THREE.Group();
        armP.position.set(1.0, 0.36, -0.6);
        f.add(armP);
        box(armP, 'amber', 0.55, 0.08, 0.08, -0.25, 0, 0);
        box(armP, 'dark', 0.1, 0.12, 0.12, -0.55, -0.04, 0);
        tk.push(function (sec) { armP.rotation.y = prod ? Math.sin(sec * 1.4) * 0.7 : 0; });
        var crates = clamp(Math.ceil(Math.log10((fab.inventory || 0) + 1) * 2), 0, 8);
        for (var c = 0; c < crates; c++) {
            box(f, 'wood', 0.32, 0.3, 0.32, -0.9 + (c % 2) * 0.36, 0.15 + Math.floor(c / 4) * 0.31, 1.75 - (Math.floor(c / 2) % 2) * 0.36);
        }
    };

    BUILD.showroom = function (r, d, p, st, tk) {
        var f = r.furn;
        var cat = ((d.products && d.products.catalog) || []).filter(function (x) { return x.status === 'selling'; });
        cat.sort(function (a, b) { return (b.releaseGameMinute || 0) - (a.releaseGameMinute || 0); });
        var cap = Math.min(9, 3 * st.level);
        var show = cat.slice(0, cap), spin = [];
        var perRow = 5;
        for (var i = 0; i < show.length; i++) {
            var row = Math.floor(i / perRow), idxInRow = i % perRow;
            var count = Math.min(perRow, show.length - row * perRow);
            var x = (idxInRow - (count - 1) / 2) * 1.0 - 0.3, z = -0.55 + row * 1.2;
            var pd = show[i];
            cyl(f, 'white', 0.3, 0.35, x, 0.175, z);
            var pg = phoneModel(f, hueMat(pd.id), 1.0);
            pg.position.set(x, 0.68, z);
            spin.push(pg);
            sph(f, pd.stock > 0 ? 'ledG' : 'ledR', 0.045, x, 0.2, z + 0.3);
            if (pd.stock > 0) cone(f, 'holo', 0.32, 1.05, x, 0.9, z);          // sorot lampu
        }
        tk.push(function (sec) { for (var q = 0; q < spin.length; q++) spin[q].rotation.y = sec * 0.7 + q; });
        box(f, 'glow', 2.4, 0.45, 0.05, -0.6, 1.5, -1.58);                   // banner
        var crates = clamp(Math.round(Math.log10(totalStock(d) + 1) * 3), 0, 12);
        for (var c = 0; c < crates; c++) {
            box(f, 'wood', 0.34, 0.3, 0.34, 2.45 + (c % 2) * 0.38, 0.15 + Math.floor(c / 6) * 0.31, -1.1 + (Math.floor(c / 2) % 3) * 0.4);
        }
    };

    BUILD.marketing = function (r, d, p, st, tk) {
        var f = r.furn;
        var camp = len(d.marketing && d.marketing.activeCampaigns);
        var screens = [];
        for (var i = 0; i < 3; i++) {
            var x = -0.9 + i * 0.9;
            box(f, 'dark', 0.8, 0.5, 0.05, x, 1.2, -2.05);
            var face = box(f, i < camp ? 'screenOn' : 'screenOff', 0.72, 0.42, 0.02, x, 1.2, -2.02);
            screens.push({ m: face, on: i < camp, ph: i * 1.3 });
        }
        var mk = Math.min(3, roleCount(d, 'marketer'));
        for (var k = 0; k < mk; k++) {
            var dx = -0.7 + k * 0.7;
            box(f, 'deskTop', 0.6, 0.06, 0.5, dx, 0.6, -0.3);
            box(f, 'desk', 0.05, 0.57, 0.46, dx - 0.27, 0.285, -0.3);
            box(f, 'desk', 0.05, 0.57, 0.46, dx + 0.27, 0.285, -0.3);
            cone(f, 'amber', 0.1, 0.26, dx, 0.76, -0.3).rotation.z = Math.PI / 2;
            chair(f, dx, 0.35);
        }
        if (camp > 0) {
            var m = cone(f, 'glow', 0.35, 0.8, 1.0, 0.5, 1.6);
            m.rotation.z = -Math.PI / 2.4;
            tk.push(function (sec) { var s = 1 + Math.sin(sec * 4) * 0.06; m.scale.set(0.35 * s, 0.8, 0.35 * s); });
        }
        plant(f, -1.1, 1.6, 0.9);
        tk.push(function (sec) {
            for (var q = 0; q < screens.length; q++) {
                var s = screens[q];
                if (s.on) s.m.material = (Math.sin(sec * 2.2 + s.ph) > 0) ? M.screenOn : M.glow;
            }
        });
    };

    BUILD.finance = function (r, d, p, st, tk) {
        var f = r.furn;
        var vault = cyl(f, 'metal', 0.6, 0.18, -0.5, 0.9, -1.95);
        vault.rotation.x = Math.PI / 2;
        var ring = mesh(f, G.tor, 'gold', 0.5, 0.5, 0.5, -0.5, 0.9, -1.84);
        box(f, 'gold', 0.5, 0.06, 0.04, -0.5, 0.9, -1.8);
        box(f, 'gold', 0.06, 0.5, 0.04, -0.5, 0.9, -1.8);
        void ring;
        var cash = d.cash || 0;
        var n = clamp(Math.floor(Math.log10(Math.max(1, cash)) - 1), 0, 6);
        for (var i = 0; i < n; i++) {
            var hgt = 0.12 * (1 + (i % 3)) + 0.08 * Math.floor(i / 3);
            cyl(f, 'gold', 0.14, hgt, -1.0 + i * 0.34, hgt / 2, -1.2);
        }
        if (cash >= 1e6) {                                                   // koin berputar saat kas >= $1M
            var pv = new THREE.Group();
            pv.position.set(-0.5, 1.85, -1.6);
            f.add(pv);
            cyl(pv, 'gold', 0.17, 0.035, 0, 0, 0).rotation.x = Math.PI / 2;
            tk.push(function (sec) { pv.rotation.y = sec * 2.4; pv.position.y = 1.85 + Math.sin(sec * 2) * 0.05; });
        }
        var loans = Math.min(5, len(d.finance && d.finance.loans));
        for (var k = 0; k < loans; k++) box(f, 'red', 0.36, 0.05, 0.26, -1.0, 0.03 + k * 0.055, 0.1);
        var bad = cash < 0;
        var lamp = sph(f, bad ? 'ledR' : 'ledG', 0.07, -1.1, 0.45, 1.7);
        cyl(f, 'metal', 0.025, 0.4, -1.1, 0.2, 1.7);
        // papan bursa
        box(f, 'dark', 1.15, 0.75, 0.05, 0.85, 1.4, -2.05);
        var hold = len(d.stocks && d.stocks.portfolio);
        var bars = [];
        for (var b = 0; b < 5; b++) {
            var up = (hash('b' + b + hold) % 2) === 0;
            bars.push({ m: box(f, up ? 'ledG' : 'ledR', 0.1, 0.4, 0.02, 0.45 + b * 0.2, 1.3, -2.01), base: 0.2 + 0.12 * ((hash('h' + b) % 4) + 1), ph: b * 1.1 });
        }
        tk.push(function (sec) {
            for (var q = 0; q < bars.length; q++) {
                var bb = bars[q];
                var h = bb.base * (hold ? (1 + 0.25 * Math.sin(sec * 1.6 + bb.ph)) : 1);
                bb.m.scale.y = h;
                bb.m.position.y = 1.05 + h / 2;
            }
            if (bad) lamp.visible = Math.sin(sec * 6) > 0;
        });
        desk(f, 0.6, 0.5, false);
        monitor(f, 0.6, 0.655, 0.4, true);
        chair(f, 0.6, 1.2);
    };

    // ---------- bangun / bangun ulang ruangan ----------
    function clearFurn(r) {
        var f = r.furn;
        for (var i = f.children.length - 1; i >= 0; i--) {
            var c = f.children[i];
            f.remove(c);
            c.traverse(function (o) {
                if (!o.userData || !o.userData.own) return;
                if (o.material) o.material.dispose();
                if (o.userData.tex) {
                    o.userData.tex.dispose();
                    var ti = ownTex.indexOf(o.userData.tex);
                    if (ti >= 0) ownTex.splice(ti, 1);
                }
            });
        }
    }
    function dropStaffRefs() {
        Object.keys(staffObjs).forEach(function (k) {
            var g = staffObjs[k], alive = false, p = g.parent;
            while (p) { if (p === scene) { alive = true; break; } p = p.parent; }
            if (!alive) delete staffObjs[k];
        });
    }

    function applyRoomVisual(r) {
        var locked = !r.st.open;
        r.locked = locked;
        var tone = r.def.tone;
        var c = dark ? tint(tone, -0.62) : tone;
        if (locked) c = dark ? tint(0x56607a, -0.2) : tint(0x9fb4d6, 0.1);
        r.floorMat.color.setHex(c);
        r.floorMat.opacity = locked ? 0.55 : 1;
        r.pat.visible = !locked;
        r.pool.visible = dark && !locked;
    }
    function rebuildLabel(r) {
        if (r.label) {
            r.group.remove(r.label);
            if (r.label.material) { r.label.material.dispose(); }
            if (r.label.userData.tex) {
                r.label.userData.tex.dispose();
                var ix = labelTex.indexOf(r.label.userData.tex);
                if (ix >= 0) labelTex.splice(ix, 1);
            }
        }
        var text = (r.locked ? '🔒 ' : '') + t('office.room.' + r.def.id);
        r.label = makeLabel(text, dark, r.locked, accentHex);
        r.label.position.set(0, 1.25, r.d / 2 - 0.45);
        if (r.def.id === 'work') r.label.position.set(-3.4, 1.35, r.d / 2 - 0.4);
        r.group.add(r.label);
    }

    function alertTexture(kind) {
        if (alertTex[kind]) return alertTex[kind];
        var c = document.createElement('canvas');
        c.width = 96; c.height = 96;
        var ctx = c.getContext('2d');
        ctx.fillStyle = kind === 'bad' ? '#ef4444' : '#f59e0b';
        ctx.beginPath(); ctx.arc(48, 48, 42, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 58px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('!', 48, 52);
        var tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        alertTex[kind] = tex;
        return tex;
    }
    function rebuildAlert(r) {
        if (r.alertSp) {
            r.group.remove(r.alertSp);
            if (r.alertSp.material) r.alertSp.material.dispose();
            r.alertSp = null;
        }
        if (!r.alert || !r.st || !r.st.open || !r.label) return;
        var mat = new THREE.SpriteMaterial({ map: alertTexture(r.alert.lvl), transparent: true, depthTest: false });
        var sp = new THREE.Sprite(mat);
        sp.scale.set(0.42, 0.42, 1);
        sp.renderOrder = 21;
        var lp = r.label.position, off = (r.label.scale.x / 2 + 0.24) * 0.7071;
        sp.position.set(lp.x + off, lp.y + 0.04, lp.z - off);
        r.alertBase = sp.position.y;
        r.group.add(sp);
        r.alertSp = sp;
    }

    function rebuildRoom(r, d, p, st) {
        clearFurn(r);
        r.st = st;
        r.alert = st.open ? roomAlert(r.def.id, d, p) : null;
        r.tick = null;
        applyRoomVisual(r);
        var tickers = [];
        if (st.open) {
            try { BUILD[r.def.id](r, d, p, st, tickers); }
            catch (e) { console.warn('[OfficeScene] gagal bangun ruangan ' + r.def.id, e); }
        } else {
            // blueprint terkunci: gembok di tengah
            var f = r.furn;
            box(f, 'metal', 0.6, 0.5, 0.25, 0, 0.35, 0);
            var sh = mesh(f, G.tor, 'metal', 0.22, 0.22, 0.22, 0, 0.72, 0);
            sh.scale.set(0.22, 0.28, 0.22);
            box(f, 'dark', 0.08, 0.14, 0.27, 0, 0.35, 0);
        }
        if (tickers.length) {
            r.tick = function (sec) { for (var i = 0; i < tickers.length; i++) tickers[i](sec); };
            r.tick(0);   // posisi awal yang rapi (juga untuk mode reduced-motion yang tanpa loop)
        }
        animRooms = roomList.filter(function (x) { return !!x.tick; });
        rebuildLabel(r);
        rebuildAlert(r);
        dropStaffRefs();
    }

    // ---------- tema & era ----------
    function applyTheme() {
        dark = document.documentElement.getAttribute('data-theme') === 'dark';
        var P = dark ? PALETTES.dark : PALETTES.light;
        var ac = new THREE.Color();
        try { ac.set(readAccent()); } catch (e) { ac.setHex(0x2563eb); }
        accentHex = ac.getHex();
        var ew = ERA_WINDOWS[Math.max(0, eraIdx)] || ERA_WINDOWS[3];
        winHex = dark ? ew.dark : ew.light;
        var ix = dark ? 1 : 0;
        Object.keys(COLORS).forEach(function (k) { M[k].color.setHex(COLORS[k][ix]); });
        M.win.color.setHex(winHex);
        if (M.win.emissive) M.win.emissive.setHex(dark ? tint(winHex, -0.45) : 0x000000);
        M.ghost.color.setHex(COLORS.desk[ix]);
        M.screenOn.color.setHex(tint(winHex, dark ? 0.05 : 0.25));
        M.screenOff.color.setHex(dark ? 0x10141a : 0x232a34);
        M.glow.color.setHex(accentHex);
        M.holo.color.setHex(accentHex);
        M.selRing.color.setHex(accentHex);
        M.pool.opacity = dark ? 0.2 : 0;
        M.shade.opacity = dark ? SHADOW_OPACITY + 0.08 : SHADOW_OPACITY;
        hemi.color.setHex(P.hemiSky);
        hemi.groundColor.setHex(P.hemiGround);
        hemi.intensity = P.hemiI;
        sun.intensity = P.dirI;
        if (P.sunCol !== undefined) sun.color.setHex(P.sunCol);
        roomList.forEach(function (r) {
            r.ovMat.color.setHex(accentHex);
            r.patMat.color.setHex(dark ? 0xffffff : 0x000000);
            r.patMat.opacity = dark ? 0.07 : 0.1;
            if (r.st) { applyRoomVisual(r); rebuildLabel(r); rebuildAlert(r); }
        });
    }

    // ---------- kamera ----------
    function applyCamera() {
        var v = controls.view;
        var h = BASE_VIEW / v.zoom, w = h * aspect;
        camera.left = -w / 2; camera.right = w / 2; camera.top = h / 2; camera.bottom = -h / 2;
        camera.position.set(v.x + 20, 20, v.z + 20);
        camera.lookAt(v.x, 0, v.z);
        camera.updateProjectionMatrix();
    }
    function fitZoom() { return clamp(Math.min(1.05, aspect * 0.78), 0.3, 3); }
    function tweenView(tx, tz, tzoom) {
        if (focusRaf) cancelAnimationFrame(focusRaf);
        var v = controls.view, x0 = v.x, z0 = v.z, k0 = v.zoom, t0 = performance.now(), DUR = 420;
        if (prefersReducedMotion()) {
            v.x = tx; v.z = tz; v.zoom = tzoom; applyCamera(); requestRender(); return;
        }
        function step(now) {
            focusRaf = 0;
            if (disposed) return;
            var p = Math.min(1, (now - t0) / DUR), e = 1 - Math.pow(1 - p, 3);
            v.x = x0 + (tx - x0) * e; v.z = z0 + (tz - z0) * e; v.zoom = k0 + (tzoom - k0) * e;
            applyCamera(); requestRender();
            if (p < 1) focusRaf = requestAnimationFrame(step);
        }
        focusRaf = requestAnimationFrame(step);
    }
    function resetView() { tweenView(0, 0, fitZoom()); }
    function focusRoom(id) {
        var r = rooms[id];
        if (!r) return;
        tweenView(r.group.position.x, r.group.position.z, Math.max(controls.view.zoom, 1.25));
    }

    // ---------- render loop ----------
    function animateOverlays(sec) {
        for (var i = 0; i < roomList.length; i++) {
            var sp = roomList[i].alertSp;
            if (!sp) continue;
            var bad = roomList[i].alert && roomList[i].alert.lvl === 'bad';
            sp.position.y = roomList[i].alertBase + Math.sin(sec * (bad ? 5 : 3) + i) * 0.05;
            var sc = bad ? 0.42 + Math.sin(sec * 5 + i) * 0.03 : 0.42;
            sp.scale.set(sc, sc, 1);
        }
        updateRing(sec);
    }
    // turunkan kualitas otomatis bila perangkat tidak sanggup menjaga ~30fps
    function watchQuality(now) {
        if (quality.lowered || !lastRendered) { lastRendered = now; return; }
        var gap = now - lastRendered;
        lastRendered = now;
        if (gap > quality.frameMs * 2) quality.slow++; else if (quality.slow > 0) quality.slow -= 0.25;
        if (quality.slow >= 24) {
            quality.lowered = true;
            quality.frameMs = 50;
            renderer.setPixelRatio(1);
            if (lastW && lastH) renderer.setSize(lastW, lastH, false);
        }
    }
    function frame(now) {
        loopRaf = 0;
        if (disposed || document.hidden || !inView) { lastRendered = 0; return; }
        loopRaf = requestAnimationFrame(frame);
        if (now - lastFrame < quality.frameMs) return;
        lastFrame = now;
        if (ctxLost) return;
        var sec = now / 1000;
        for (var i = 0; i < animRooms.length; i++) animRooms[i].tick(sec);
        animateOverlays(sec);
        renderer.render(scene, camera);
        watchQuality(now);
    }
    function startLoop() {
        if (!ambient || loopRaf || disposed || document.hidden || !inView) return;
        lastRendered = 0;
        loopRaf = requestAnimationFrame(frame);
    }
    function requestRender() {
        if (ambient) { startLoop(); if (loopRaf) return; }
        if (raf || disposed) return;
        raf = requestAnimationFrame(function () {
            raf = 0;
            if (disposed || document.hidden || ctxLost) return;
            updateRing(0);
            renderer.render(scene, camera);
        });
    }

    function updateRing(sec) {
        if (!selected || !selected.staffId) { selRing.visible = false; return; }
        var g = staffObjs[selected.staffId];
        if (!g) { selRing.visible = false; return; }
        g.getWorldPosition(tmpV);
        selRing.position.set(tmpV.x, 0.05, tmpV.z);
        var k = 0.5 + Math.sin(sec * 4) * 0.03;
        selRing.scale.set(k, k, 1);
        selRing.visible = true;
    }
    function focusStaff(id) {
        var g = staffObjs[id];
        if (!g) return;
        g.getWorldPosition(tmpV);
        tweenView(tmpV.x, tmpV.z, Math.max(controls.view.zoom, 1.5));
    }

    // ---------- UI overlay (chip ruangan + kartu info) ----------
    var chipBar = document.createElement('div');
    chipBar.className = 'office-chips';
    chipBar.style.cssText = 'position:absolute;left:8px;right:44px;top:8px;z-index:3;display:flex;gap:6px;' +
        'overflow-x:auto;touch-action:pan-x;scrollbar-width:none;padding:2px 0;';
    container.appendChild(chipBar);

    var card = document.createElement('div');
    card.style.cssText = 'position:absolute;left:10px;right:10px;bottom:10px;z-index:3;display:none;' +
        'padding:12px 14px;border-radius:14px;background:var(--bg-2);color:var(--text-primary);' +
        'border:1px solid var(--border);box-shadow:var(--shadow);';
    card.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    container.appendChild(card);

    var hint = document.createElement('div');
    hint.style.cssText = 'position:absolute;left:12px;bottom:10px;z-index:2;font-size:11px;pointer-events:none;' +
        'color:var(--text-tertiary);max-width:80%;';
    hint.textContent = t('office.hint');
    container.appendChild(hint);

    var legendBtn = document.createElement('button');
    legendBtn.type = 'button';
    legendBtn.textContent = 'ⓘ';
    legendBtn.style.cssText = 'position:absolute;right:8px;top:8px;z-index:4;width:30px;height:30px;border-radius:50%;' +
        'border:1px solid var(--border);background:var(--bg-2);color:var(--text-primary);font-size:15px;line-height:1;cursor:pointer;padding:0;';
    legendBtn.setAttribute('aria-expanded', 'false');
    container.appendChild(legendBtn);
    var legend = document.createElement('div');
    legend.style.cssText = 'position:absolute;right:8px;top:44px;z-index:4;display:none;max-width:230px;padding:10px 12px;' +
        'border-radius:12px;background:var(--bg-2);color:var(--text-primary);border:1px solid var(--border);' +
        'box-shadow:var(--shadow);font-size:11.5px;line-height:1.5;';
    container.appendChild(legend);
    function legendRow(color, text, round) {
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:7px;margin-top:3px;';
        var sw = document.createElement('span');
        sw.style.cssText = 'flex:0 0 auto;width:10px;height:10px;background:' + color + ';border-radius:' + (round === false ? '2px' : '50%') + ';';
        var tx = document.createElement('span');
        tx.textContent = text;
        row.appendChild(sw); row.appendChild(tx);
        return row;
    }
    function rebuildLegend() {
        legend.innerHTML = '';
        var h1 = document.createElement('div');
        h1.style.cssText = 'font-weight:800;font-size:12px;';
        h1.textContent = t('office.legend.title');
        legend.appendChild(h1);
        ROLES.forEach(function (rd) { legend.appendChild(legendRow(rd.color, rd.label, false)); });
        legend.appendChild(legendRow('#43c07a', t('office.legend.morale.high')));
        legend.appendChild(legendRow('#f5b83d', t('office.legend.morale.mid')));
        legend.appendChild(legendRow('#ef5350', t('office.legend.morale.low')));
        legend.appendChild(legendRow('#e0b445', t('office.legend.tier'), false));
        legend.appendChild(legendRow('#f59e0b', t('office.legend.alert')));
        legend.appendChild(legendRow('#9fb4d6', t('office.legend.locked'), false));
    }
    legendBtn.addEventListener('click', function () {
        legendOn = !legendOn;
        legend.style.display = legendOn ? 'block' : 'none';
        legendBtn.setAttribute('aria-expanded', legendOn ? 'true' : 'false');
        if (legendOn) rebuildLegend();
    });
    legendBtn.setAttribute('aria-label', 'legend');

    function mkBtn(label, primary) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.style.cssText = 'border:1px solid ' + (primary ? 'var(--accent)' : 'var(--border)') + ';' +
            'background:' + (primary ? 'var(--accent)' : 'var(--bg-3)') + ';color:' + (primary ? '#fff' : 'var(--text-primary)') + ';' +
            'border-radius:999px;padding:7px 14px;font-size:12.5px;font-weight:700;cursor:pointer;';
        return b;
    }

    function rebuildChips() {
        chipBar.innerHTML = '';
        var all = mkBtn(t('office.btn.all'), false);
        all.style.padding = '5px 11px'; all.style.fontSize = '11.5px'; all.style.flex = '0 0 auto';
        all.style.background = 'var(--bg-2)';
        all.addEventListener('click', function () { select(null); resetView(); });
        chipBar.appendChild(all);
        roomList.forEach(function (r) {
            var open = !r.st || r.st.open;
            var b = mkBtn((open ? '' : '🔒 ') + t('office.room.' + r.def.id), selected && selected.room === r.def.id);
            b.style.padding = '5px 11px'; b.style.fontSize = '11.5px'; b.style.flex = '0 0 auto';
            if (!(selected && selected.room === r.def.id)) b.style.background = 'var(--bg-2)';
            if (!open) b.style.opacity = '0.7';
            if (open && r.alert) {
                var dot = document.createElement('span');
                dot.textContent = ' ●';
                dot.style.cssText = 'color:' + (r.alert.lvl === 'bad' ? '#ef4444' : '#f59e0b') + ';';
                b.appendChild(dot);
            }
            b.addEventListener('click', function () { select({ room: r.def.id }); focusRoom(r.def.id); });
            chipBar.appendChild(b);
        });
    }

    function goTo(g) {
        if (!g) return;
        bus.emit('advisor:go', { nav: g.nav, subtab: g.subtab });
    }

    function refreshCard() {
        card.innerHTML = '';
        if (!selected || !lastData || !lastPlan) { card.style.display = 'none'; hint.style.display = ''; return; }
        var info = null;
        if (selected.staffId) {
            var st = null, ss = lastData.staff || [];
            for (var i = 0; i < ss.length; i++) if (ss[i].id === selected.staffId) st = ss[i];
            if (st) info = describeStaff(st);
            else { selected.staffId = null; updateRing(0); }
        }
        if (!info) info = describeRoom(selected.room, lastData, lastPlan);
        if (!info) { card.style.display = 'none'; hint.style.display = ''; return; }

        var head = document.createElement('div');
        head.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;';
        var ttl = document.createElement('div');
        ttl.style.cssText = 'font-size:15px;font-weight:800;letter-spacing:-0.01em;flex:1;min-width:0;';
        ttl.textContent = info.title;
        var badge = document.createElement('span');
        badge.style.cssText = 'font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;' +
            'background:var(--accent-soft);color:var(--accent);white-space:nowrap;';
        badge.textContent = info.badge;
        var x = document.createElement('button');
        x.type = 'button'; x.textContent = '✕'; x.setAttribute('aria-label', 'close');
        x.style.cssText = 'border:none;background:transparent;color:var(--text-tertiary);font-size:15px;cursor:pointer;padding:2px 4px;';
        x.addEventListener('click', function () { select(null); });
        head.appendChild(ttl); head.appendChild(badge); head.appendChild(x);
        card.appendChild(head);

        var lines = document.createElement('div');
        lines.style.cssText = 'font-size:12.5px;line-height:1.55;color:var(--text-secondary, var(--text-tertiary));';
        (info.lines || []).forEach(function (ln) {
            var d = document.createElement('div'); d.textContent = ln; lines.appendChild(d);
        });
        card.appendChild(lines);

        if (info.go || info.go2) {
            var row = document.createElement('div');
            row.style.cssText = 'display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;';
            if (info.go) { var b1 = mkBtn(info.go.label, true); b1.addEventListener('click', function () { goTo(info.go); }); row.appendChild(b1); }
            if (info.go2) { var b2 = mkBtn(info.go2.label, false); b2.addEventListener('click', function () { goTo(info.go2); }); row.appendChild(b2); }
            card.appendChild(row);
        }
        card.style.display = 'block';
        hint.style.display = 'none';
    }

    function select(sel) {
        selected = sel;
        roomList.forEach(function (r) {
            var on = !!(sel && sel.room === r.def.id);
            r.ov.visible = on;
        });
        refreshCard();
        rebuildChips();
        updateRing(0);
        requestRender();
    }

    // ---------- tap / pick ----------
    function handleTap(cx, cy) {
        if (disposed) return;
        var rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
        scene.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);
        raycaster.setFromCamera(ndc, camera);
        var groups = roomList.map(function (r) { return r.group; });
        var hits = raycaster.intersectObjects(groups, true);
        var staffId = null, roomId = null;
        for (var i = 0; i < hits.length && !roomId; i++) {
            if (hits[i].object.isSprite) continue;
            var o = hits[i].object;
            while (o) {
                if (o.userData && o.userData.staffId && !staffId) staffId = o.userData.staffId;
                if (o.userData && o.userData.roomId) { roomId = o.userData.roomId; break; }
                o = o.parent;
            }
        }
        if (!roomId) { select(null); return; }
        select({ room: roomId, staffId: staffId });
        if (staffId) focusStaff(staffId);
    }

    var controls = createCampusControls(canvas, {
        unitsPerPixel: function (zoom) { return (BASE_VIEW / zoom) / Math.max(1, container.clientHeight); },
        minZoom: 0.3,
        maxZoom: 3,
        limit: 9,
        onChange: function () { applyCamera(); requestRender(); },
        onTap: handleTap
    });

    function resize() {
        if (disposed || resizeScheduled) return;
        resizeScheduled = true;
        requestAnimationFrame(function () {
            resizeScheduled = false;
            if (disposed || document.hidden) return;
            var w = container.clientWidth, h = container.clientHeight;
            if (!w || !h) return;
            if (Math.abs(w - lastW) < MIN_RESIZE_DELTA && Math.abs(h - lastH) < MIN_RESIZE_DELTA) return;
            lastW = w; lastH = h;
            renderer.setSize(w, h, false);
            aspect = w / h;
            if (!fitted) { fitted = true; controls.view.zoom = fitZoom(); }
            applyCamera();
            requestRender();
        });
    }

    // ---------- sinkron dengan state game ----------
    function update(data) {
        if (disposed || !data) return;
        var plan = computePlan(data);
        rememberPeak(data, plan);
        lastData = data; lastPlan = plan;
        setClock(data);
        var force = false;
        if (plan.eraIdx !== eraIdx) { eraIdx = plan.eraIdx; applyTheme(); force = true; }
        roomList.forEach(function (r) {
            var logic = ROOM_LOGIC[r.def.id];
            var st = logic.state(data, plan);
            var sig = (st.open ? 1 : 0) + ':' + st.level + ':' + logic.sig(data, plan) + ':' + eraIdx;
            if (!force && sig === r.sig) return;
            r.sig = sig;
            rebuildRoom(r, data, plan, st);
        });
        rebuildChips();
        refreshCard();
        requestRender();
    }

    function relabel() {
        hint.textContent = t('office.hint');
        canvas.setAttribute('aria-label', t('office.aria'));
        roomList.forEach(function (r) { rebuildLabel(r); rebuildAlert(r); });
        if (legendOn) rebuildLegend();
        rebuildChips();
        refreshCard();
        requestRender();
    }

    function onVis() { if (!document.hidden) requestRender(); }
    var io = null;
    if (typeof IntersectionObserver !== 'undefined') {
        io = new IntersectionObserver(function (en) {
            inView = en[en.length - 1].isIntersecting;
            if (inView) requestRender();
        });
        io.observe(container);
    }
    document.addEventListener('visibilitychange', onVis);
    function onCtxLost(e) { e.preventDefault(); ctxLost = true; }
    function onCtxRestored() { ctxLost = false; requestRender(); }
    canvas.addEventListener('webglcontextlost', onCtxLost);
    canvas.addEventListener('webglcontextrestored', onCtxRestored);
    var ro = null;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(resize); ro.observe(container); }
    else window.addEventListener('resize', resize);

    applyTheme();
    update(gameState);
    resize();

    return {
        update: update,
        updateClock: function (data) { if (disposed) return; setClock(data); if (!ambient) requestRender(); },
        refreshTheme: function () {
            applyTheme();
            // papan nama & label mengikuti tema: bangun ulang ruang Work
            if (rooms.work) rooms.work.sig = null;
            if (lastData) update(lastData); else requestRender();
        },
        relabel: relabel,
        select: function (id) { select(id ? { room: id } : null); if (id) focusRoom(id); },
        dispose: function () {
            disposed = true;
            if (raf) cancelAnimationFrame(raf);
            if (loopRaf) cancelAnimationFrame(loopRaf);
            if (focusRaf) cancelAnimationFrame(focusRaf);
            if (io) io.disconnect();
            if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', onVis);
            canvas.removeEventListener('webglcontextlost', onCtxLost);
            canvas.removeEventListener('webglcontextrestored', onCtxRestored);
            controls.dispose();
            roomList.forEach(function (r) {
                clearFurn(r);
                if (r.label && r.label.material) r.label.material.dispose();
                if (r.alertSp && r.alertSp.material) r.alertSp.material.dispose();
                r.floorMat.dispose(); r.ovMat.dispose(); r.patMat.dispose();
            });
            labelTex.forEach(function (tx) { tx.dispose(); });
            ownTex.forEach(function (tx) { tx.dispose(); });
            Object.keys(alertTex).forEach(function (k) { alertTex[k].dispose(); });
            hairMat.forEach(function (m) { m.dispose(); });
            Object.keys(tierMat).forEach(function (k) { tierMat[k].dispose(); });
            Object.keys(G).forEach(function (k) { G[k].dispose(); });
            Object.keys(M).forEach(function (k) { M[k].dispose(); });
            Object.keys(roleMat).forEach(function (k) { roleMat[k].dispose(); });
            skinMat.forEach(function (m) { m.dispose(); });
            moraleMat.forEach(function (m) { m.dispose(); });
            Object.keys(hueMats).forEach(function (k) { hueMats[k].dispose(); });
            renderer.dispose();
            try { renderer.forceContextLoss(); } catch (e) {}
            [chipBar, card, hint, legendBtn, legend, canvas].forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
        }
    };
}
