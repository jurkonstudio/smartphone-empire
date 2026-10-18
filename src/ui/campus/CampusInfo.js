// FILE: src/ui/campus/CampusInfo.js
// v2027.44 (Tahap 4) — Data kartu info bangunan: nama, level, progres ke level berikutnya,
// petunjuk, dan tujuan navigasi. Murni logika (tanpa THREE / DOM) supaya gampang dites.
// Dua bahasa (id / en) ditaruh di file ini agar tidak perlu menyentuh file i18n besar.
import { RULES } from './CampusBuildings.js';
import { LanguageService } from '../../core/LanguageService.js';

var ICONS = {
    hq: '🏢', lab: '🔬', factory: '🏭', store: '🏬', os: '🖥️', monument: '🏆',
    billboard: '📣', academy: '🎓', arena: '🏟️', port: '⚓',
    wind: '🌬️', rail: '🚆', sprawl: '🏙️'
};

// [Indonesia, English]
var NAMES = {
    hq: ['Kantor Pusat', 'Headquarters'], lab: ['Lab R&D', 'R&D Lab'],
    factory: ['Pabrik Chip', 'Chip Factory'], store: ['Toko Flagship', 'Flagship Store'],
    os: ['Pusat OS & Server', 'OS & Server Hub'], monument: ['Monumen Prestasi', 'Achievement Monument'],
    billboard: ['Billboard Kampanye', 'Campaign Billboard'], academy: ['Akademi Inovasi', 'Innovation Academy'],
    arena: ['Arena Peluncuran', 'Launch Arena'], port: ['Pelabuhan Logistik', 'Logistics Port'],
    wind: ['Ladang Angin', 'Wind Farm'], rail: ['Monorail Kota', 'City Monorail'],
    sprawl: ['Kawasan Kota', 'City District']
};
var DESC = {
    hq: ['Tumbuh seiring jumlah staf Anda.', 'Grows with your headcount.'],
    lab: ['Tumbuh seiring riset yang selesai.', 'Grows with completed research.'],
    factory: ['Mencerminkan level Fab chip Anda.', 'Reflects your chip Fab level.'],
    store: ['Makin megah seiring produk yang dirilis.', 'Grows grander with each product released.'],
    os: ['Server bertambah seiring versi OS.', 'More servers as you ship OS versions.'],
    monument: ['Penanda pangsa pasar Anda.', 'A marker of your market share.'],
    billboard: ['Menyala saat ada kampanye aktif.', 'Lights up while a campaign is active.'],
    academy: ['Rumah bagi tim yang besar.', 'Home to a large team.'],
    arena: ['Panggung peluncuran produk.', 'The stage for product launches.'],
    port: ['Menampung stok barang jadi.', 'Holds your finished-goods stock.'],
    wind: ['Energi hijau kampus, sejak era Premium.', 'Green energy for the campus, since the Premium era.'],
    rail: ['Menghubungkan kawasan, sejak era Smartphone Matang.', 'Connects districts, since the Mature Smartphone era.'],
    sprawl: ['Kota tumbuh seiring era desain.', 'The city grows with each design era.']
};
var UNITS = {
    hq: ['staf', 'staff'], lab: ['riset selesai', 'research done'], factory: ['level Fab', 'Fab level'],
    store: ['produk rilis', 'products released'], os: ['versi OS', 'OS versions'],
    monument: ['% pangsa pasar', '% market share'], billboard: ['kampanye aktif', 'active campaigns'],
    academy: ['staf', 'staff'], arena: ['produk rilis', 'products released'], port: ['unit stok', 'stock units']
};
// Tab utama tujuan tombol "Buka ...". (Sub-tab dipilih pemain sendiri di panel tujuan.)
var NAV = {
    hq: 'team', lab: 'research', factory: 'research', store: 'products', os: 'research',
    monument: 'market', billboard: 'products', academy: 'team', arena: 'products', port: 'products'
};
var VIEW_LABEL = {
    team: ['HQ', 'HQ'], research: ['Riset', 'Research'], products: ['Produk', 'Products'], market: ['Pasar', 'Market']
};
var UI = [
    {   // id
        levelOf: 'Level {lv} dari {max}', maxed: 'Level maksimum tercapai ✨',
        next: 'Naik ke Lv {n} di {need} {unit} · kini {now} (tinggal {left})',
        build: 'Dibangun di {need} {unit} · kini {now} (tinggal {left})',
        open: 'Buka {view}', close: 'Tutup', built: '{name} berhasil dibangun!',
        up: '{name} naik ke Lv {lv}!', multi: '{n} bangunan berkembang!',
        bannerSub: 'Kampus Anda terus tumbuh', decor: 'Dekorasi era',
        blocks: 'Blok kota aktif: {n}', reset: 'Reset tampilan peta', zin: 'Perbesar peta', zout: 'Perkecil peta'
    },
    {   // en
        levelOf: 'Level {lv} of {max}', maxed: 'Max level reached ✨',
        next: 'Reaches Lv {n} at {need} {unit} · now {now} ({left} to go)',
        build: 'Gets built at {need} {unit} · now {now} ({left} to go)',
        open: 'Open {view}', close: 'Close', built: '{name} is built!',
        up: '{name} reached Lv {lv}!', multi: '{n} buildings grew!',
        bannerSub: 'Your campus keeps growing', decor: 'Era decoration',
        blocks: 'City blocks active: {n}', reset: 'Reset map view', zin: 'Zoom in', zout: 'Zoom out'
    }
];

function langIdx() {
    var l = 'id';
    try { l = LanguageService.getLang(); } catch (e) {}
    return l === 'en' ? 1 : 0;
}
function fill(str, vars) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] !== undefined ? vars[k] : m; });
}
function fmt(n) {
    try { return Number(n).toLocaleString(langIdx() ? 'en-US' : 'id-ID'); } catch (e) { return String(n); }
}
function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

export function getUiStrings() {
    var s = UI[langIdx()];
    return {
        close: s.close, reset: s.reset, zin: s.zin, zout: s.zout, bannerSub: s.bannerSub,
        built: function (name) { return fill(s.built, { name: name }); },
        up: function (name, lv) { return fill(s.up, { name: name, lv: lv }); },
        multi: function (n) { return fill(s.multi, { n: n }); }
    };
}

export function getBuildingName(id) {
    var n = NAMES[id];
    return n ? n[langIdx()] : String(id);
}

export function hasCelebration(id) { return !!RULES[id]; }

// Mengembalikan struktur siap-render untuk kartu info, atau null bila id tidak dikenal.
export function getBuildingInfo(id, plan, data) {
    if (!plan || !NAMES[id]) return null;
    var L = langIdx(), s = UI[L];
    var info = {
        id: id, icon: ICONS[id] || '🏗️', name: NAMES[id][L], desc: DESC[id][L],
        level: 0, max: 0, hasLevels: false, pct: 0, maxed: false, hint: '', levelText: '', nav: null
    };
    var r = RULES[id];
    if (!r) {
        info.levelText = s.decor;
        info.hint = id === 'sprawl' ? fill(s.blocks, { n: plan.sprawl || 0 }) : '';
    } else {
        var lv = plan.levels[id] || 0;
        var m = r.metric(data || {});
        var shown = id === 'monument' ? Math.round(m * 10) / 10 : m;
        info.hasLevels = true;
        info.level = lv;
        info.max = r.max;
        info.levelText = fill(s.levelOf, { lv: lv, max: r.max });
        if (lv >= r.max) {
            info.maxed = true;
            info.pct = 1;
            info.hint = s.maxed;
        } else {
            var idx = lv - r.base;                      // langkah berikutnya
            var need = r.steps[idx];
            var prev = idx > 0 ? r.steps[idx - 1] : 0;
            info.pct = clamp01((m - prev) / Math.max(1e-9, need - prev));
            var left = id === 'monument' ? Math.max(0, Math.round((need - m) * 10) / 10) : Math.max(0, Math.ceil(need - m));
            info.hint = fill(lv === 0 ? s.build : s.next, {
                n: lv + 1, need: fmt(need), unit: UNITS[id][L], now: fmt(shown), left: fmt(left)
            });
        }
        var view = NAV[id];
        if (view) info.nav = { view: view, label: fill(s.open, { view: VIEW_LABEL[view][L] }) };
    }
    info.sig = [id, L, info.level, Math.round(info.pct * 100), info.hint].join('|');
    return info;
}
