// FILE: src/ui/office/OfficeScene.js  (BARU)
// v2027.50a — Office 3D Map: interior kantor isometrik (dollhouse) yang terhubung ke data game.
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
import { ROLES, SKILL_TIERS } from '../../data/staff.data.js';
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
    { id: 'ceo',       x0: -9,   x1: -5.5, z0: -6,   z1: -1.5, tone: 0xe9d8c4, go: { nav: 'profile' } },
    { id: 'lab',       x0: -5.5, x1: -1,   z0: -6,   z1: -1.5, tone: 0xd6e8f5, go: { nav: 'research', subtab: 'tech' } },
    { id: 'design',    x0: -1,   x1: 3,    z0: -6,   z1: -1.5, tone: 0xe6dcf5, go: { nav: 'products', subtab: 'design' } },
    { id: 'server',    x0: 3,    x1: 6.5,  z0: -6,   z1: -1.5, tone: 0xd5ecea, go: { nav: 'research', subtab: 'os' } },
    { id: 'chip',      x0: 6.5,  x1: 9,    z0: -6,   z1: -1.5, tone: 0xf3e3cf, go: { nav: 'products', subtab: 'chip' } },
    { id: 'work',      x0: -9,   x1: 3,    z0: -1.5, z1: 6,    tone: 0xe8ecf2, go: { nav: 'team', subtab: 'team' } },
    { id: 'showroom',  x0: 3,    x1: 9,    z0: -1.5, z1: 1.8,  tone: 0xf5e6e6, go: { nav: 'products', subtab: 'catalog' } },
    { id: 'marketing', x0: 3,    x1: 6,    z0: 1.8,  z1: 6,    tone: 0xdff3e3, go: { nav: 'market', subtab: 'promo' } },
    { id: 'finance',   x0: 6,    x1: 9,    z0: 1.8,  z1: 6,    tone: 0xf6efcf, go: { nav: 'team', subtab: 'bank' },
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
    win:     [0x8fb4e8, 0x4f77b8]
};

var SKIN = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac];
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
            var s = sortedStaff(d), parts = [deskCapacity(p, s.length)];
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

// Info untuk kartu (ruangan). Dipakai scene & bisa dites tanpa THREE.
export function describeRoom(id, data, plan) {
    var def = null, i;
    for (i = 0; i < ROOM_DEFS.length; i++) if (ROOM_DEFS[i].id === id) def = ROOM_DEFS[i];
    var logic = ROOM_LOGIC[id];
    if (!def || !logic) return null;
    var st = logic.state(data, plan);
    return {
        id: id,
        title: t('office.room.' + id),
        open: st.open,
        badge: st.open ? t('office.status.level', { n: st.level }) : t('office.status.locked'),
        lines: st.open ? logic.lines(data, plan) : [t(st.req || 'office.status.locked')],
        go: st.open ? { nav: def.go.nav, subtab: def.go.subtab, label: t('office.go.' + id) } : null,
        go2: (st.open && def.go2) ? { nav: def.go2.nav, subtab: def.go2.subtab, label: t(def.go2.labelKey) } : null
    };
}

export function describeStaff(s) {
    var rd = roleDef(s.role), td = tierDef(s.skill || 1);
    return {
        title: s.name || '-',
        badge: rd ? rd.label : String(s.role),
        lines: [
            t('office.staff.sub', { role: rd ? rd.label : s.role, tier: td.label, m: Math.round(s.morale || 0) }),
            t('office.staff.salary', { v: fmtMoney(s.salary || 0) })
        ],
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
        plane: new THREE.PlaneGeometry(1, 1)
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
        box(shell, 'win', 0.06, 0.8, 1.15, FLOOR.x0 + 0.13, 1.55, -5.1 + i0 * 1.7);
    }
    // partisi dalam (setinggi 0.7) dengan celah pintu
    function partition(axis, fixed, from, to, gaps) {
        var cuts = [from], k;
        (gaps || []).forEach(function (g) { cuts.push(g - 0.6, g + 0.6); });
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
        var furn = new THREE.Group();
        g.add(furn);
        var r = { def: def, group: g, slab: slab, floorMat: floorMat, ov: ov, ovMat: ovMat, furn: furn,
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
    function person(p, s, x, z, tickers) {
        var g = new THREE.Group();
        g.userData.staffId = s.id;
        g.position.set(x, 0, z);
        chair(g, 0, 0.0);
        var rm = roleMat[s.role] || roleMat.engineer;
        var skin = skinMat[hash(s.id) % skinMat.length];
        cyl(g, rm, 0.15, 0.42, 0, 0.62, -0.02);                        // badan
        var head = sph(g, skin, 0.115, 0, 0.97, -0.02);                // kepala
        sph(g, 'dark', 0.12, 0, 1.0, 0.01).scale.set(0.12, 0.07, 0.12);   // rambut
        var armL = box(g, rm, 0.07, 0.07, 0.32, -0.14, 0.7, -0.2);
        var armR = box(g, rm, 0.07, 0.07, 0.32, 0.14, 0.7, -0.2);
        var dot = sph(g, moraleMat[moraleTier(s.morale || 0)], 0.055, 0, 1.2, -0.02);  // indikator moral
        var ph = (hash(s.id) % 628) / 100;
        tickers.push(function (sec) {
            var b = Math.sin(sec * 2 + ph);
            head.position.y = 0.97 + b * 0.012;
            dot.position.y = 1.2 + b * 0.02;
            armL.position.y = 0.7 + Math.sin(sec * 9 + ph) * 0.012;
            armR.position.y = 0.7 + Math.cos(sec * 8 + ph) * 0.012;
        });
        staffObjs[s.id] = g;
        p.add(g);
        return g;
    }

    var BUILD = {};

    BUILD.ceo = function (r, d, p, st, tk) {
        var f = r.furn;
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
        if ((p.levels.monument || 0) >= 2) {                              // globe
            cyl(f, 'metal', 0.18, 0.06, 1.25, 0.03, -0.2);
            var gl = sph(f, accentHex ? 'glow' : 'glass', 0.28, 1.25, 0.4, -0.2);
            tk.push(function (sec) { gl.rotation.y = sec * 0.6; });
        }
    };

    BUILD.work = function (r, d, p, st, tk) {
        var f = r.furn;
        var staff = sortedStaff(d);
        var cap = deskCapacity(p, staff.length);
        var showN = Math.min(staff.length, MAX_DESKS);
        for (var i = 0; i < cap; i++) {
            var col = i % COLS, row = Math.floor(i / COLS);
            if (row >= ROWS) break;
            var x = -5 + col * 2.0, z = -2.95 + row * 1.45;
            var s = i < showN ? staff[i] : null;
            desk(f, x, z, !s);
            if (s) {
                monitor(f, x, 0.655, z - 0.1, true);
                person(f, s, x, z + 0.52, tk);
            }
        }
        plant(f, -5.75, -3.55, 0.9);
        plant(f, 5.75, -3.55, 0.9);
        plant(f, 5.6, 3.3, 1.2);
        cyl(f, 'metal', 0.17, 0.12, -5.7, 0.06, 3.3);                     // dispenser air
        cyl(f, 'glass', 0.15, 0.5, -5.7, 0.4, 3.3);
        box(f, 'white', 0.5, 0.7, 0.4, 5.3, 0.35, 0.2);                   // printer
    };

    BUILD.lab = function (r, d, p, st, tk) {
        var f = r.furn;
        var nB = Math.min(4, 1 + st.level);
        var act = Math.min(6, len(d.research && d.research.active) + len(d.chipResearch && d.chipResearch.active));
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
        var cols = Math.min(3, n), leds = [], placed = 0;
        for (var i = 0; i < n; i++) {
            var col = i % 3, row = Math.floor(i / 3);
            var x = (col - (cols - 1) / 2) * 1.0, z = -1.6 + row * 1.5;
            box(f, 'rack', 0.7, 1.4, 0.6, x, 0.7, z);
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
            c.traverse(function (o) { if (o.userData && o.userData.own && o.material) o.material.dispose(); });
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

    function rebuildRoom(r, d, p, st) {
        clearFurn(r);
        r.st = st;
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
        hemi.color.setHex(P.hemiSky);
        hemi.groundColor.setHex(P.hemiGround);
        hemi.intensity = P.hemiI;
        sun.intensity = P.dirI;
        if (P.sunCol !== undefined) sun.color.setHex(P.sunCol);
        roomList.forEach(function (r) {
            r.ovMat.color.setHex(accentHex);
            if (r.st) { applyRoomVisual(r); rebuildLabel(r); }
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
    function frame(now) {
        loopRaf = 0;
        if (disposed || document.hidden || !inView) return;
        loopRaf = requestAnimationFrame(frame);
        if (now - lastFrame < FRAME_MS) return;
        lastFrame = now;
        var sec = now / 1000;
        for (var i = 0; i < animRooms.length; i++) animRooms[i].tick(sec);
        renderer.render(scene, camera);
    }
    function startLoop() {
        if (!ambient || loopRaf || disposed || document.hidden || !inView) return;
        loopRaf = requestAnimationFrame(frame);
    }
    function requestRender() {
        if (ambient) { startLoop(); if (loopRaf) return; }
        if (raf || disposed) return;
        raf = requestAnimationFrame(function () {
            raf = 0;
            if (disposed || document.hidden) return;
            renderer.render(scene, camera);
        });
    }

    // ---------- UI overlay (chip ruangan + kartu info) ----------
    var chipBar = document.createElement('div');
    chipBar.className = 'office-chips';
    chipBar.style.cssText = 'position:absolute;left:8px;right:8px;top:8px;z-index:3;display:flex;gap:6px;' +
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
            else { selected.staffId = null; }
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
        roomList.forEach(function (r) { rebuildLabel(r); });
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
    var ro = null;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(resize); ro.observe(container); }
    else window.addEventListener('resize', resize);

    applyTheme();
    update(gameState);
    resize();

    return {
        update: update,
        refreshTheme: function () { applyTheme(); requestRender(); },
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
            controls.dispose();
            roomList.forEach(function (r) {
                clearFurn(r);
                if (r.label && r.label.material) r.label.material.dispose();
                r.floorMat.dispose(); r.ovMat.dispose();
            });
            labelTex.forEach(function (tx) { tx.dispose(); });
            Object.keys(G).forEach(function (k) { G[k].dispose(); });
            Object.keys(M).forEach(function (k) { M[k].dispose(); });
            Object.keys(roleMat).forEach(function (k) { roleMat[k].dispose(); });
            skinMat.forEach(function (m) { m.dispose(); });
            moraleMat.forEach(function (m) { m.dispose(); });
            Object.keys(hueMats).forEach(function (k) { hueMats[k].dispose(); });
            renderer.dispose();
            try { renderer.forceContextLoss(); } catch (e) {}
            [chipBar, card, hint, canvas].forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
        }
    };
}
