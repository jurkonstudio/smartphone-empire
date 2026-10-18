// FILE: src/ui/campus/CampusInfo.js  (REPLACE — i18n)
// v2027.44 (Tahap 4) — Data kartu info bangunan: nama, level, progres ke level berikutnya,
// petunjuk, dan tujuan navigasi. Murni logika (tanpa THREE / DOM) supaya gampang dites.
// i18n: semua teks dicari lewat t() (key campus.info.*); tabel [id, en] di file ini
// tetap dipakai sebagai FALLBACK bila key belum ada di kamus. Ganti bahasa ditangani
// CampusMap (bus 'lang:changed' → scene.refreshLang() → getUiStrings()/getBuildingInfo()).
import { RULES } from './CampusBuildings.js';
import { t, LanguageService } from '../../core/LanguageService.js';

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

// t() dengan fallback dari tabel [id, en] bila key belum ada di kamus.
function _tf(key, pair, vars) {
    var v = t(key, vars);
    if (v && v !== key) return v;
    return pair ? fill(pair[langIdx()], vars) : key;
}
function _ui(k, vars) { return _tf('campus.info.ui.' + k, [UI[0][k], UI[1][k]], vars); }
function _name(id) { return _tf('campus.info.name.' + id, NAMES[id]); }
function _desc(id) { return _tf('campus.info.desc.' + id, DESC[id]); }
function _unit(id) { return _tf('campus.info.unit.' + id, UNITS[id]); }
function _view(v) { return _tf('campus.info.view.' + v, VIEW_LABEL[v]); }

export function getUiStrings() {
    return {
        close: _ui('close'), reset: _ui('reset'), zin: _ui('zin'), zout: _ui('zout'), bannerSub: _ui('bannerSub'),
        built: function (name) { return _ui('built', { name: name }); },
        up: function (name, lv) { return _ui('up', { name: name, lv: lv }); },
        multi: function (n) { return _ui('multi', { n: n }); }
    };
}

export function getBuildingName(id) {
    return NAMES[id] ? _name(id) : String(id);
}

export function hasCelebration(id) { return !!RULES[id]; }

// Mengembalikan struktur siap-render untuk kartu info, atau null bila id tidak dikenal.
export function getBuildingInfo(id, plan, data) {
    if (!plan || !NAMES[id]) return null;
    var L = langIdx();
    var info = {
        id: id, icon: ICONS[id] || '🏗️', name: _name(id), desc: _desc(id),
        level: 0, max: 0, hasLevels: false, pct: 0, maxed: false, hint: '', levelText: '', nav: null
    };
    var r = RULES[id];
    if (!r) {
        info.levelText = _ui('decor');
        info.hint = id === 'sprawl' ? _ui('blocks', { n: plan.sprawl || 0 }) : '';
    } else {
        var lv = plan.levels[id] || 0;
        var m = r.metric(data || {});
        var shown = id === 'monument' ? Math.round(m * 10) / 10 : m;
        info.hasLevels = true;
        info.level = lv;
        info.max = r.max;
        info.levelText = _ui('levelOf', { lv: lv, max: r.max });
        if (lv >= r.max) {
            info.maxed = true;
            info.pct = 1;
            info.hint = _ui('maxed');
        } else {
            var idx = lv - r.base;                      // langkah berikutnya
            var need = r.steps[idx];
            var prev = idx > 0 ? r.steps[idx - 1] : 0;
            info.pct = clamp01((m - prev) / Math.max(1e-9, need - prev));
            var left = id === 'monument' ? Math.max(0, Math.round((need - m) * 10) / 10) : Math.max(0, Math.ceil(need - m));
            info.hint = _ui(lv === 0 ? 'build' : 'next', {
                n: lv + 1, need: fmt(need), unit: _unit(id), now: fmt(shown), left: fmt(left)
            });
        }
        var view = NAV[id];
        if (view) info.nav = { view: view, label: _ui('open', { view: _view(view) }) };
    }
    info.sig = [id, L, info.level, Math.round(info.pct * 100), info.hint].join('|');
    return info;
}
