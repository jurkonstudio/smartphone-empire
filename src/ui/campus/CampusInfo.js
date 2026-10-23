// FILE: src/ui/campus/CampusInfo.js  (REPLACE — registri + navigasi sub-tab)
// v2027.63 — gedung HQ kini punya tombol "Masuk Kantor" (zoom masuk ke Office 3D di kanvas yang sama,
// ditangani CampusOfficeBridge.js). Data registri TIDAK diubah; HQ dikenali lewat id.
// v2027.62 — nama, ikon, deskripsi, satuan, dan tujuan tombol "Buka ..." sekarang dibaca dari
// REGISTRI (campus-buildings.data.js), bukan tabel terpisah. Tombol kini membawa sub-tab
// (mis. Riset > Manufaktur) sehingga pemain langsung mendarat di tab yang tepat.
// v2027.44 (Tahap 4) — Data kartu info bangunan: nama, level, progres ke level berikutnya,
// petunjuk, dan tujuan navigasi. Murni logika (tanpa THREE / DOM) supaya gampang dites.
// i18n: semua teks dicari lewat t() (key campus.info.*); teks [Indonesia, English] dari registri
// dipakai sebagai FALLBACK bila key belum ada di kamus. Ganti bahasa ditangani
// CampusMap (bus 'lang:changed' → scene.refreshLang() → getUiStrings()/getBuildingInfo()).
import { RULES } from './CampusBuildings.js';
import { CAMPUS_BY_ID } from '../../data/campus-buildings.data.js';
import { t, LanguageService } from '../../core/LanguageService.js';

// Tampilan tab induk bila gedung tidak menentukan label sendiri.
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
        enterOffice: 'Masuk Kantor', backCampus: 'Kampus',
        blocks: 'Blok kota aktif: {n}', reset: 'Reset tampilan peta', zin: 'Perbesar peta', zout: 'Perkecil peta'
    },
    {   // en
        levelOf: 'Level {lv} of {max}', maxed: 'Max level reached ✨',
        next: 'Reaches Lv {n} at {need} {unit} · now {now} ({left} to go)',
        build: 'Gets built at {need} {unit} · now {now} ({left} to go)',
        open: 'Open {view}', close: 'Close', built: '{name} is built!',
        up: '{name} reached Lv {lv}!', multi: '{n} buildings grew!',
        bannerSub: 'Your campus keeps growing', decor: 'Era decoration',
        enterOffice: 'Enter Office', backCampus: 'Campus',
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

// t() dengan fallback dari pasangan [id, en] bila key belum ada di kamus.
function _tf(key, pair, vars) {
    var v = t(key, vars);
    if (v && v !== key) return v;
    return pair ? fill(pair[langIdx()], vars) : key;
}
function _ui(k, vars) { return _tf('campus.info.ui.' + k, [UI[0][k], UI[1][k]], vars); }
function _name(id) { return _tf('campus.info.name.' + id, CAMPUS_BY_ID[id].name); }
function _desc(id) { return _tf('campus.info.desc.' + id, CAMPUS_BY_ID[id].desc); }
function _unit(id) { return _tf('campus.info.unit.' + id, CAMPUS_BY_ID[id].unit); }
function _view(key, pair) { return _tf('campus.info.view.' + key, pair); }

export function getUiStrings() {
    return {
        close: _ui('close'), reset: _ui('reset'), zin: _ui('zin'), zout: _ui('zout'), bannerSub: _ui('bannerSub'),
        built: function (name) { return _ui('built', { name: name }); },
        up: function (name, lv) { return _ui('up', { name: name, lv: lv }); },
        multi: function (n) { return _ui('multi', { n: n }); }
    };
}

// Teks untuk tombol jembatan Kampus <-> Kantor (CampusOfficeBridge.js).
export function getBridgeStrings() {
    return { enterOffice: _ui('enterOffice'), backCampus: _ui('backCampus') };
}

export function getBuildingName(id) {
    return CAMPUS_BY_ID[id] ? _name(id) : String(id);
}

export function hasCelebration(id) { return !!RULES[id]; }

// Tujuan tombol "Buka ...": { view, sub, label } dari registri (label sub-tab bila ada).
function _navOf(entry) {
    var n = entry.nav;
    if (!n) return null;
    // HQ: masuk ke interior kantor (Office 3D) langsung di peta, bukan pindah ke panel Tim.
    if (entry.id === 'hq') {
        return { view: n.view, sub: '', label: _ui('enterOffice'), office: true, attrs: { 'data-campus-office': '1' } };
    }
    var key = n.sub || n.view;
    var pair = n.label || VIEW_LABEL[n.view] || [n.view, n.view];
    return { view: n.view, sub: n.sub || '', label: _ui('open', { view: _view(key, pair) }) };
}

// Mengembalikan struktur siap-render untuk kartu info, atau null bila id tidak dikenal.
export function getBuildingInfo(id, plan, data, alerts) {
    var entry = CAMPUS_BY_ID[id];
    if (!plan || !entry) return null;
    var L = langIdx();
    var info = {
        id: id, icon: entry.emoji || '🏗️', name: _name(id), desc: _desc(id),
        level: 0, max: 0, hasLevels: false, pct: 0, maxed: false, hint: '', levelText: '', nav: null,
        alert: null
    };
    var al = alerts && alerts[id];
    if (al) info.alert = { tone: al.tone, text: al.text, action: al.action };
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
        info.nav = _navOf(entry);
    }
    info.sig = [id, L, info.level, Math.round(info.pct * 100), info.hint, info.alert ? info.alert.tone + info.alert.text : ''].join('|');
    return info;
}
