// FILE: src/ui/layout/IconTabs.js
// Tab/filter/pengurut memakai ikon SVG; hanya yang aktif menampilkan label (pola yang sama dengan tab HQ).
// Kunci ikon = atribut data-* yang stabil, jadi tidak bergantung bahasa. Label tetap ada di DOM
// (aria-label + title + .ti-label), semua tombol & handler asli tidak diubah.
// Berdiri sendiri. ?tabs=text mematikan, ?tabs=icon menyalakan lagi (disimpan di localStorage).
import { tabIconSvg } from '../icons/TabIcons.js';

var KEY = 'smartphone-empire:tabs';

// [atribut, {nilai: ikon}, {cls: wajib class, replace: ganti ikon bawaan}]
var GROUPS = [
    ['data-subtab', { tech: 'cpu', os: 'window', manufaktur: 'factory', future: 'sparkles', chip: 'wafer' }],
    ['data-os-tab', { status: 'gauge', rancang: 'pencil', pengguna: 'users', fitur: 'blocks', bug: 'bug', apps: 'apps' }],
    ['data-market-subtab', { share: 'pie', competitors: 'podium', trends: 'trending', promo: 'megaphone', channels: 'store',
        service: 'headset', ecosystem: 'orbit', appstore: 'bag', public: 'chat' }],
    ['data-prod-subtab', { design: 'compass', catalog: 'library', sales: 'receipt', chip: 'wafer' }],
    ['data-design-track', { phone: 'phone', tablet: 'tablet', earbuds: 'earbuds', watch: 'watch', charger: 'plug' }],
    ['data-rs-sort', { tier: 'layers', year: 'calendar', cost: 'coin', time: 'timer' }],
    ['data-catalog-filter', { all: 'apps', selling: 'tag', disc: 'archive' }, { cls: 'cat2-seg-btn' }],
    ['data-catalog-sort', { newest: 'sparkle', sold: 'flame', rating: 'star', stock: 'box' }, { cls: 'cat2-seg-btn' }],
    ['data-catalog-cat', { all: 'apps', phones: 'phone', acc: 'headphones' }, { cls: 'cat2-seg-btn' }],
    ['data-timeline-filter', { all: 'apps', phone: 'phone', os: 'window' }],
    ['data-filter-cat', { all: 'apps' }],
    ['data-home-tab', { focus: 'target', news: 'news', activity: 'pulse' }],
    ['data-set-tab', { umum: 'sliders', tampilan: 'palette', audio: 'speaker', notif: 'bell', keuangan: 'wallet',
        bahasa: 'globe', data: 'database', debug: 'terminal' }, { replace: true }]
];
var SEL = GROUPS.map(function (g) { return 'button[' + g[0] + ']'; }).join(',');

function pref() {
    try {
        var q = /[?&]tabs=(text|icon)/.exec(location.search);
        if (q) { localStorage.setItem(KEY, q[1]); return q[1]; }
        return localStorage.getItem(KEY) || 'icon';
    } catch (e) { return 'icon'; }
}

function iconFor(btn) {
    for (var i = 0; i < GROUPS.length; i++) {
        var g = GROUPS[i];
        if (!btn.hasAttribute(g[0])) continue;
        var o = g[2] || {};
        if (o.cls && !btn.classList.contains(o.cls)) return null;
        return { name: g[1][btn.getAttribute(g[0])], replace: !!o.replace };
    }
    return null;
}

function setup(btn) {
    if (btn.hasAttribute('data-ti')) return;
    var info = iconFor(btn);
    if (!info) return;
    var hasSvg = !!btn.querySelector('svg');
    var svg = info.name ? tabIconSvg(info.name) : '';
    if (!svg && !hasSvg) return;               // tanpa ikon sama sekali: biarkan teks apa adanya
    btn.setAttribute('data-ti', '1');

    var label = (btn.textContent || '').replace(/\s+/g, ' ').trim();

    if (svg && info.replace) {                 // ganti ikon bawaan yang kurang jelas (mis. audio & notifikasi sama-sama lonceng)
        var old = btn.querySelectorAll('.icon-wrap, svg');
        for (var k = 0; k < old.length; k++) if (old[k].parentNode) old[k].parentNode.removeChild(old[k]);
        hasSvg = false;
    }

    // Bungkus teks jadi .ti-label; hitungan "(3)" jadi lencana kecil supaya tetap tampak saat label tersembunyi.
    var badge = null;
    var nodes = Array.prototype.slice.call(btn.childNodes);
    for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.nodeType === 3 && n.nodeValue.trim()) {
            var m = /^(.*?)\s*\((\d+)\)\s*$/.exec(n.nodeValue.trim());
            var span = document.createElement('span');
            span.className = 'ti-label';
            span.textContent = m ? m[1] : n.nodeValue.trim();
            if (m) badge = m[2];
            btn.replaceChild(span, n);
        } else if (n.nodeType === 1 && n.tagName === 'SPAN' && !n.className && n.textContent.trim()) {
            n.className = 'ti-label';
        }
    }
    if (svg && !hasSvg) btn.insertAdjacentHTML('afterbegin', svg);
    if (badge) btn.insertAdjacentHTML('beforeend', '<span class="ti-badge">' + badge + '</span>');

    btn.classList.add('ti-tab');
    if (label) {
        btn.setAttribute('aria-label', label);
        if (!btn.hasAttribute('title')) btn.setAttribute('title', label);
    }
}

var queued = false;
function scan() {
    queued = false;
    var list = document.querySelectorAll(SEL);
    for (var i = 0; i < list.length; i++) setup(list[i]);
}
function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(scan);
}

function start() {
    new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
    queue();
}

if (pref() === 'text') {
    document.documentElement.setAttribute('data-tabs', 'text');
} else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}
