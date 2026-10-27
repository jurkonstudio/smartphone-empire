// FILE: src/ui/panels/GuidePanel.js
// v0.2.14 — isi Panduan disesuaikan dengan game sekarang: + Manufaktur, Pasar & Kompetitor, Progres & Akun; sistem, glosarium, dan tips diperluas.
// v2027.16a — full guide: rules, time, menu map, team, product, finance, SIL: quick start, systems, glossary, tips, backup, diagnostic.
// Teks dibaca dari src/data/i18n/guide.i18n.js (key guide.*).
import { t } from '../../core/LanguageService.js';
import { getNavIcon } from '../icons/NavIcons.js';
import { getIconContent } from '../icons/FeatureIcons.js';

// Ikon bergaya line (Lucide) agar seragam dengan navigasi & panel lain.
var _LOCAL_ICONS = {
    newspaper: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    package:   '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    gem:       '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
    landmark:  '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>'
};

// Ambil isi <svg> dari ikon navigasi (home/team/research/products/market).
function _navInner(id) {
    return String(getNavIcon(id)).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
}

// Peta key sistem -> sumber ikon.
function _sysIcon(key) {
    var map = {
        phone:    function () { return _navInner('products'); },
        research: function () { return _navInner('research'); },
        os:       function () { return getIconContent('blocks'); },
        chip:     function () { return getIconContent('cpu'); },
        fab:      function () { return getIconContent('factory'); },
        plant:    function () { return getIconContent('grid'); },
        assembly: function () { return getIconContent('cube'); },
        wholesale: function () { return _LOCAL_ICONS.package; },
        team:     function () { return _navInner('team'); },
        market:   function () { return _navInner('market'); },
        segment:  function () { return getIconContent('compass'); },
        channel:  function () { return getIconContent('store'); },
        service:  function () { return getIconContent('shield'); },
        eco:      function () { return getIconContent('cloud'); },
        appstore: function () { return getIconContent('clipboard'); },
        exchange: function () { return getIconContent('activity'); },
        bank:     function () { return _LOCAL_ICONS.landmark; },
        invest:   function () { return getIconContent('trending-up'); },
        promo:    function () { return _LOCAL_ICONS.megaphone; },
        opinion:  function () { return getIconContent('message-square'); },
        office:   function () { return getIconContent('building'); },
        silicon:  function () { return _LOCAL_ICONS.gem; },
        news:     function () { return _LOCAL_ICONS.newspaper; },
        advisor:  function () { return getIconContent('bot'); }
    };
    var inner = (map[key] && map[key]()) || getIconContent('question') || '';
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"' +
        ' stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        inner + '</svg>';
}

// Section: Quick Start (7 steps)
function _quickStart() {
    var steps = ['1','2','3','4','5','6','7'].map(function (n) {
        return '<div class="guide-step">' +
            '<span class="guide-step-num">' + n + '</span>' +
            '<span class="guide-step-text">' + t('guide.qs.' + n) + '</span>' +
            '</div>';
    }).join('');
    return _card(t('guide.section.quickstart'),
        '<div style="font-size:12.5px;color:var(--text-secondary);line-height:1.55;margin-bottom:10px;">' +
            t('guide.qs.intro') +
        '</div>' + steps, true);
}

// Section: detail rows (judul + penjelasan) dibaca dari i18n: guide.<sec>.<n>.t / .d
// Jumlah baris per section.
var _DETAIL_COUNT = { rules: 7, time: 5, nav: 8, team: 6, product: 6, mfg: 6, market: 7, finance: 6, silicon: 5, progress: 6 };

function _detail(sec, openByDefault) {
    var n = _DETAIL_COUNT[sec] || 0;
    var rows = '';
    for (var i = 1; i <= n; i++) {
        rows += '<div class="gloss-row">' +
            '<b>' + t('guide.' + sec + '.' + i + '.t') + '</b>' +
            '<span>' + t('guide.' + sec + '.' + i + '.d') + '</span>' +
            '</div>';
    }
    var intro = '<div style="font-size:12.5px;color:var(--text-secondary);line-height:1.55;margin-bottom:6px;">' +
        t('guide.' + sec + '.intro') + '</div>';
    return _card(t('guide.section.' + sec), intro + rows, !!openByDefault);
}

// Section: Game Systems
function _systems() {
    var items = [
        'phone', 'research', 'os', 'chip', 'fab', 'plant', 'assembly', 'wholesale', 'team',
        'market', 'segment', 'channel', 'service', 'eco', 'appstore', 'promo', 'opinion',
        'exchange', 'bank', 'invest', 'office', 'silicon', 'news', 'advisor'
    ];
    var html = items.map(function (it) {
        return '<div class="guide-sys-row">' +
            '<div class="guide-sys-icon">' + _sysIcon(it) + '</div>' +
            '<div class="guide-sys-body">' +
                '<div class="guide-sys-title">' + t('guide.sys.' + it + '.t') + '</div>' +
                '<div class="guide-sys-desc">' + t('guide.sys.' + it + '.d') + '</div>' +
            '</div>' +
        '</div>';
    }).join('');
    return _card(t('guide.section.systems'), html, false);
}

// Section: Glossary
function _glossary() {
    var keys = [
        'reputation','share','quality','demand','burnrate','runway','rnd','slot','era','os',
        'prototype','lifecycle','networth','portfolio','yield','tier','morale',
        'creditrating','sil','boost','viral','segment','wholesale','warranty','lockin','commission'
    ];
    var html = keys.map(function (k) {
        return '<div class="gloss-row">' +
            '<b>' + t('guide.term.' + k) + '</b>' +
            '<span>' + t('guide.def.' + k) + '</span>' +
            '</div>';
    }).join('');
    return _card(t('guide.section.glossary'), html, false);
}

// Section: Tips
function _tips() {
    var list = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20'].map(function (n) {
        return '<li>' + t('guide.tips.' + n) + '</li>';
    }).join('');
    return _card(t('guide.section.tips'), '<ul class="tips-list">' + list + '</ul>', false);
}

// Section: Backup
function _backup() {
    var html =
        '<div style="font-size:12.5px;color:var(--text-secondary);line-height:1.55;margin-bottom:10px;">' +
            t('guide.backup.intro') +
        '</div>' +
        '<div class="sum-row"><span style="color:var(--accent);font-weight:700;">Export</span><span style="font-size:12px;color:var(--text-dim);">' +
            t('guide.backup.export').replace(/^Export:\s*/, '') +
        '</span></div>' +
        '<div class="sum-row"><span style="color:var(--accent);font-weight:700;">Import</span><span style="font-size:12px;color:var(--text-dim);">' +
            t('guide.backup.import').replace(/^Import:\s*/, '') +
        '</span></div>' +
        '<div style="margin-top:10px;padding:8px 10px;background:var(--warn-soft);border-radius:8px;font-size:11.5px;color:var(--warn);line-height:1.5;">' +
            t('guide.backup.warn') +
        '</div>' +
        '<div style="margin-top:10px;font-size:11.5px;color:var(--text-dim);line-height:1.55;">' +
            t('guide.backup.cloud') +
        '</div>' +
        '<div style="margin-top:6px;font-size:11.5px;color:var(--text-dim);line-height:1.55;">' +
            t('guide.backup.integrity') +
        '</div>';
    return _card(t('guide.section.backup'), html, false);
}

// Section: Diagnostic
function _diagnostic() {
    var html =
        '<div style="font-size:12.5px;color:var(--text-secondary);line-height:1.55;margin-bottom:10px;">' +
            t('guide.diag.intro') +
        '</div>' +
        '<div style="font-size:11.5px;color:var(--text-dim);line-height:1.55;margin-bottom:10px;">' +
            t('guide.diag.what') +
        '</div>' +
        '<div style="font-size:11.5px;color:var(--text-dim);line-height:1.55;margin-bottom:12px;">' +
            t('guide.diag.how') +
        '</div>' +
        '<button class="btn-primary" data-guide-report style="width:100%;padding:10px;font-weight:700;">' +
            t('guide.diag.btn') +
        '</button>' +
        '<div style="font-size:10.5px;color:var(--text-mute);margin-top:10px;line-height:1.5;text-align:center;">' +
            t('guide.diag.privacy') +
        '</div>';
    return _card(t('guide.section.diagnostic'), html, false);
}

// Section: Shortcuts
function _shortcuts() {
    var html =
        '<div class="sum-row"><span>' + t('guide.sc.space') + '</span><b>' + t('guide.sc.space.d') + '</b></div>' +
        '<div class="sum-row"><span>' + t('guide.sc.f') + '</span><b>' + t('guide.sc.f.d') + '</b></div>' +
        '<div class="sum-row"><span>' + t('guide.sc.swipe') + '</span><b>' + t('guide.sc.swipe.d') + '</b></div>';
    return _card(t('guide.section.shortcuts'), html, false);
}

// ---------- Helpers ----------
function _card(title, contentHtml, openByDefault) {
    return '<details class="collapsible-card"' + (openByDefault ? ' open' : '') + '>' +
        '<summary class="collapsible-summary">' +
            '<span>' + title + '</span>' +
        '</summary>' +
        '<div class="collapsible-body">' + contentHtml + '</div>' +
    '</details>';
}

// ---------- Main render ----------
export function renderGuidePanel() {
    return '<div style="margin-bottom:8px;">' +
            '<div style="font-size:15px;font-weight:800;letter-spacing:-0.01em;">' +
                t('guide.title') +
            '</div>' +
        '</div>' +
        _quickStart() +
        _detail('rules') +
        _detail('time') +
        _detail('nav') +
        _systems() +
        _detail('team') +
        _detail('product') +
        _detail('mfg') +
        _detail('market') +
        _detail('finance') +
        _detail('silicon') +
        _detail('progress') +
        _glossary() +
        _tips() +
        _backup() +
        _diagnostic() +
        _shortcuts() +
        '<button class="btn-secondary" data-nav="settings" style="width:100%;margin-top:8px;">' +
            t('guide.back') +
        '</button>';
}
