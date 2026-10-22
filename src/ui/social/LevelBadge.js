// FILE: src/ui/social/LevelBadge.js  (BARU)
// Ikon level (SVG) + kartu Level untuk profil Pemain & Perusahaan.
//   badge 'player'  = lingkaran bersegi bintang (ikon di avatar pemain)
//   badge 'company' = heksagon (ikon di logo perusahaan)
// Warna ikon naik per peringkat: Rintisan > Berkembang > Mapan > Elit > Legenda > Puncak.
import { LanguageService } from '../../core/LanguageService.js';
import { rankOfLevel, tierName, LEVEL_MAX } from '../../systems/PlayerProgression.js';

var _uid = 0;
function _lang() { var l = 'id'; try { l = LanguageService.getLang(); } catch (e) {} return l === 'en' ? 'en' : 'id'; }
function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function _fmt(n) { return Math.round(Number(n) || 0).toLocaleString(_lang() === 'en' ? 'en-US' : 'id-ID'); }

var TXT = {
    id: { level: 'Level', xp: 'XP', next: 'Menuju Lv {n}', max: 'Level maksimum', reward: 'Hadiah naik level', activity: 'Aktivitas', cred: 'Kredibilitas',
          playerTitle: 'Level & Kredibilitas', companyTitle: 'Level Perusahaan', rank: 'Peringkat',
          playerHint: 'Level naik dari pendapatan, unit terjual, lama bermain, pangsa pasar, dan kredibilitas.',
          companyHint: 'Level perusahaan = aktivitas (penjualan, produk, tim, riset, lama beroperasi) + kredibilitas (reputasi, kredit bank, sentimen publik, moral tim).',
          revenue: 'Pendapatan', sold: 'Unit terjual', products: 'Produk aktif', staff: 'Tim', research: 'Riset', tenure: 'Lama operasi', share: 'Pangsa pasar' },
    en: { level: 'Level', xp: 'XP', next: 'To Lv {n}', max: 'Max level', reward: 'Level-up reward', activity: 'Activity', cred: 'Credibility',
          playerTitle: 'Level & Credibility', companyTitle: 'Company Level', rank: 'Rank',
          playerHint: 'Level grows from revenue, units sold, play time, market share, and credibility.',
          companyHint: 'Company level = activity (sales, products, team, research, years active) + credibility (reputation, bank credit, public sentiment, team morale).',
          revenue: 'Revenue', sold: 'Units sold', products: 'Active products', staff: 'Team', research: 'Research', tenure: 'Time active', share: 'Market share' }
};
function T(k, v) {
    var s = (TXT[_lang()] || TXT.id)[k] || k;
    return s.replace(/\{(\w+)\}/g, function (m, x) { return v && v[x] !== undefined ? v[x] : m; });
}
export function rankName(level) { var r = rankOfLevel(level); return _lang() === 'en' ? r.en_name : r.id_name; }

// o: { level, kind: 'player'|'company', size }
export function levelBadgeHtml(o) {
    o = o || {};
    var lv = Math.max(1, Math.min(LEVEL_MAX, Math.floor(Number(o.level) || 1)));
    var size = o.size || 36;
    var r = rankOfLevel(lv);
    var id = 'lvb' + (++_uid);
    var shape = o.kind === 'company'
        ? '<polygon points="50,4 91,27 91,73 50,96 9,73 9,27" fill="url(#' + id + ')" stroke="rgba(255,255,255,.55)" stroke-width="3" stroke-linejoin="round"/>' +
          '<polygon points="50,14 82,32 82,68 50,86 18,68 18,32" fill="rgba(0,0,0,.28)"/>'
        : '<circle cx="50" cy="50" r="46" fill="url(#' + id + ')" stroke="rgba(255,255,255,.55)" stroke-width="3"/>' +
          '<circle cx="50" cy="50" r="35" fill="rgba(0,0,0,.28)"/>';
    var stars = '';
    for (var i = 0; i < r.id; i++) {          // satu titik terang per peringkat di atas Rintisan
        var a = (-90 + (i - (r.id - 1) / 2) * 22) * Math.PI / 180;
        stars += '<circle cx="' + (50 + 41 * Math.cos(a)).toFixed(1) + '" cy="' + (50 + 41 * Math.sin(a)).toFixed(1) + '" r="3" fill="#fff"/>';
    }
    var fs = lv >= 10 ? 34 : 40;
    return '<span class="lv-badge lv-r' + r.id + '" style="--lv-size:' + size + 'px" role="img" aria-label="' + _esc(T('level') + ' ' + lv + ' · ' + rankName(lv)) + '">' +
        '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
            '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + r.c1 + '"/><stop offset="1" stop-color="' + r.c2 + '"/></linearGradient></defs>' +
            shape + stars +
            '<text x="50" y="' + (o.kind === 'company' ? 51 : 52) + '" text-anchor="middle" dominant-baseline="central" font-size="' + fs + '" font-weight="900" fill="#fff" font-family="inherit">' + lv + '</text>' +
        '</svg></span>';
}

function _bar(label, pct, value, cls) {
    pct = Math.max(0, Math.min(100, pct));
    return '<div class="lv-bar"><div class="lv-bar-head"><span>' + _esc(label) + '</span><b>' + _esc(value) + '</b></div>' +
        '<div class="lv-bar-track"><div class="lv-bar-fill ' + (cls || '') + '" style="width:' + pct + '%"></div></div></div>';
}

function _xpBlock(d) {
    var max = d.level >= LEVEL_MAX;
    var into = Math.max(0, d.xp - d.levelXp), span = Math.max(1, d.nextLevelXp - d.levelXp);
    return _bar(max ? T('max') : T('next', { n: d.level + 1 }), d.levelPct, max ? 'MAX' : _fmt(into) + ' / ' + _fmt(span) + ' ' + T('xp'), 'is-xp');
}

function _head(d, kind, title) {
    return '<div class="lv-head">' + levelBadgeHtml({ level: d.level, kind: kind, size: 64 }) +
        '<div class="lv-head-info"><div class="lv-head-title">' + _esc(title) + '</div>' +
        '<div class="lv-head-level">' + _esc(T('level')) + ' ' + d.level + ' · ' + _esc(rankName(d.level)) + '</div>' +
        '<div class="lv-head-xp">' + _fmt(d.xp) + ' ' + _esc(T('xp')) + '</div></div></div>';
}

// d = PlayerProgression.compute()
export function playerLevelCardHtml(d) {
    var lang = _lang();
    var reward = d.level >= LEVEL_MAX ? '' :
        '<div class="sum-row" style="margin-top:8px;"><span>' + _esc(T('reward')) + '</span><b style="color:var(--success);">+$' + _fmt(d.nextReward) + '</b></div>';
    return '<div class="card pf-card lv-card">' + _head(d, 'player', T('playerTitle')) + _xpBlock(d) +
        _bar(T('cred'), d.credibility, tierName(d.tier, lang) + ' · ' + d.credibility.toFixed(1), 'is-cred') + reward +
        '<div class="pf-hint">' + _esc(T('playerHint')) + '</div></div>';
}

// d = PlayerProgression.computeCompany()
export function companyLevelCardHtml(d) {
    var lang = _lang();
    var p = d.parts;
    function chip(k, v) { return '<span class="lv-chip">' + _esc(T(k)) + ' <b>+' + _fmt(v) + '</b></span>'; }
    var actPct = Math.min(100, Math.round(d.activityXp / 8));    // 800 XP aktivitas = penuh (hanya untuk panjang bar)
    return '<div class="card pf-card lv-card">' + _head(d, 'company', T('companyTitle')) + _xpBlock(d) +
        _bar(T('activity'), actPct, '+' + _fmt(d.activityXp) + ' ' + T('xp'), 'is-act') +
        _bar(T('cred'), d.credibility, tierName(d.tier, lang) + ' · ' + d.credibility.toFixed(1) + ' (+' + _fmt(d.credXp) + ' ' + T('xp') + ')', 'is-cred') +
        '<div class="lv-chips">' + chip('revenue', p.revenue) + chip('sold', p.sold) + chip('products', p.products) + chip('staff', p.staff) +
            chip('research', p.research) + chip('tenure', p.tenure) + chip('share', p.share) + '</div>' +
        '<div class="pf-hint">' + _esc(T('companyHint')) + '</div></div>';
}
