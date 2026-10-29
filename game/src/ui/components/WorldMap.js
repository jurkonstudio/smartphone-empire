// FILE: src/ui/components/WorldMap.js  (BARU)
// ============================================================
// Peta dunia SVG untuk negara pasar. Data bentuk: src/data/world-map.data.js
// (dihasilkan tools/build-world-map.mjs dari assets/geo/*.geojson).
//
//   renderWorldMap({ id, items, year, tabs, valueText })  -> string HTML
//     items     : [{ id: 'US', value: 123, text?: '12% · 1,2 jt' }]  negara yang punya angka
//     year      : tahun game → negara dengan since > year digambar "terkunci" (garis putus)
//     tabs      : true → tombol zoom Dunia / Amerika / Eropa-Afrika / Asia-Pasifik
//     valueText : (item) => string untuk baris info saat penanda diketuk (opsional)
//   ensureWorldMapHandlers()  -> pasang delegasi klik/keyboard sekali (aman dipanggil berulang)
//
// Penanda: terisi + membesar mengikuti nilai (akar kuadrat), abu-abu = terbuka tanpa angka,
// putus-putus = belum terbuka. Bentuk daratan KASAR (gambar tangan), bukan batas resmi.
// Teks dwibahasa lewat L(id, en), mengikuti pola CountryPanels.js.
// ============================================================
import { escapeHtml } from '../../utils/html.js';
import { LanguageService } from '../../core/LanguageService.js';
import { COUNTRIES } from '../../data/countries.data.js';
import { WORLD_MAP } from '../../data/world-map.data.js';

function L(id, en) { return LanguageService.getLang() === 'id' ? id : en; }
function cname(c) { return LanguageService.getLang() === 'id' ? c.id_name : c.en_name; }

var VIEW_KEYS = ['world', 'americas', 'emea', 'apac'];
function viewLabel(k) {
    if (k === 'americas') return L('Amerika', 'Americas');
    if (k === 'emea') return L('Eropa & Afrika', 'Europe & Africa');
    if (k === 'apac') return L('Asia-Pasifik', 'Asia-Pacific');
    return L('Dunia', 'World');
}

var _instances = {};   // id -> { opts, view }
var _seq = 0;
var _bound = false;
var _stylesInjected = false;

function _state(opts) {
    var byId = {};
    (opts.items || []).forEach(function (it) { byId[it.id] = it; });
    var max = 0;
    (opts.items || []).forEach(function (it) { if (it.value > max) max = it.value; });
    return { byId: byId, max: max };
}

function _status(c, year, byId) {
    if (year && c.since > year) return 'locked';
    return byId[c.id] && byId[c.id].value > 0 ? 'active' : 'open';
}

function _svg(opts, view) {
    var vb = WORLD_MAP.views[view] || WORLD_MAP.views.world;
    var st = _state(opts);
    var unit = vb[2] / 1000;                       // ukuran penanda tetap di layar walau di-zoom
    var land = WORLD_MAP.land.map(function (l) {
        var cls = 'wm-land';
        var attr = '';
        if (l.id) {                                // data Natural Earth: poligon negara ikut diwarnai
            var c = COUNTRIES.filter(function (x) { return x.id === l.id; })[0];
            if (c) { cls += ' wm-land-' + _status(c, opts.year, st.byId); attr = ' data-cid="' + l.id + '"'; }
        }
        return '<path class="' + cls + '"' + attr + ' d="' + l.d + '"/>';
    }).join('');

    var order = COUNTRIES.slice().sort(function (a, b) {    // yang besar digambar dulu → kecil di atas
        var va = st.byId[a.id] ? st.byId[a.id].value : 0, vb2 = st.byId[b.id] ? st.byId[b.id].value : 0;
        return va - vb2;
    });
    var pts = order.map(function (c) {
        var p = WORLD_MAP.points[c.id];
        if (!p) return '';
        var s = _status(c, opts.year, st.byId);
        var it = st.byId[c.id];
        var r = 6.5 * unit;
        if (s === 'active' && st.max > 0) r = (5.5 + 8 * Math.sqrt(it.value / st.max)) * unit;
        var sw = (1.4 * unit).toFixed(2);
        return '<g class="wm-pt wm-' + s + '" data-wm-country="' + c.id + '" tabindex="0" role="button" aria-label="' +
            escapeHtml(cname(c)) + '">' +
            '<circle class="wm-hit" cx="' + p[0] + '" cy="' + p[1] + '" r="' + (14 * unit).toFixed(2) + '"/>' +
            '<circle class="wm-dot" cx="' + p[0] + '" cy="' + p[1] + '" r="' + r.toFixed(2) + '" stroke-width="' + sw + '"' +
            (s === 'locked' ? ' stroke-dasharray="' + (3 * unit).toFixed(2) + ' ' + (2.4 * unit).toFixed(2) + '"' : '') + '/>' +
            '<title>' + escapeHtml(cname(c)) + '</title></g>';
    }).join('');

    return '<svg class="wm-svg" viewBox="' + vb.join(' ') + '" role="group" aria-label="' + L('Peta dunia', 'World map') + '">' +
        '<g class="wm-lands" fill-rule="evenodd" stroke-linejoin="round">' + land + '</g>' + pts + '</svg>';
}

function _info(opts, cid) {
    var c = COUNTRIES.filter(function (x) { return x.id === cid; })[0];
    if (!c) return '';
    var st = _state(opts);
    var s = _status(c, opts.year, st.byId);
    var it = st.byId[cid];
    var detail;
    if (s === 'locked') detail = L('Terbuka tahun ', 'Opens in ') + c.since;
    else if (it) detail = typeof opts.valueText === 'function' ? opts.valueText(it) : (it.text || '');
    else detail = L('Terbuka · belum ada data', 'Open · no data yet');
    return '<span class="wm-info-flag">' + c.flag + '</span><b>' + escapeHtml(cname(c)) + '</b>' +
        (detail ? ' · <span class="wm-info-val">' + escapeHtml(detail) + '</span>' : '');
}

function _legend() {
    return '<span><i class="wm-key wm-key-active"></i>' + L('Ada data', 'Has data') + '</span>' +
        '<span><i class="wm-key wm-key-open"></i>' + L('Terbuka', 'Open') + '</span>' +
        '<span><i class="wm-key wm-key-locked"></i>' + L('Belum terbuka', 'Locked') + '</span>';
}

export function renderWorldMap(opts) {
    opts = opts || {};
    _ensureStyles();
    ensureWorldMapHandlers();
    var id = opts.id || ('wm' + (++_seq));
    var view = 'world';
    _instances[id] = { opts: opts, view: view };
    var tabs = opts.tabs
        ? '<div class="wm-tabs" role="tablist">' + VIEW_KEYS.map(function (k) {
            return '<button type="button" class="wm-tab' + (k === view ? ' is-on' : '') + '" role="tab" aria-selected="' +
                (k === view) + '" data-wm-view="' + k + '">' + escapeHtml(viewLabel(k)) + '</button>';
        }).join('') + '</div>' : '';
    return '<div class="wm" data-wm="' + id + '">' + tabs +
        '<div class="wm-stage">' + _svg(opts, view) + '</div>' +
        '<div class="wm-info" aria-live="polite">' + L('Ketuk penanda untuk detail negara.', 'Tap a marker for country details.') + '</div>' +
        '<div class="wm-legend">' + _legend() + '</div></div>';
}

function _select(root, cid) {
    var inst = _instances[root.getAttribute('data-wm')];
    if (!inst) return;
    var info = root.querySelector('.wm-info');
    if (info) info.innerHTML = _info(inst.opts, cid);
    var prev = root.querySelector('.wm-pt.is-sel');
    if (prev) prev.classList.remove('is-sel');
    var cur = root.querySelector('.wm-pt[data-wm-country="' + cid + '"]');
    if (cur) cur.classList.add('is-sel');
}

function _setView(root, view) {
    var inst = _instances[root.getAttribute('data-wm')];
    if (!inst || WORLD_MAP.views[view] === undefined) return;
    inst.view = view;
    var stage = root.querySelector('.wm-stage');
    if (stage) stage.innerHTML = _svg(inst.opts, view);
    var tabs = root.querySelectorAll('.wm-tab');
    for (var i = 0; i < tabs.length; i++) {
        var on = tabs[i].getAttribute('data-wm-view') === view;
        tabs[i].classList.toggle('is-on', on);
        tabs[i].setAttribute('aria-selected', on ? 'true' : 'false');
    }
}

export function ensureWorldMapHandlers() {
    if (_bound || typeof document === 'undefined') return;
    _bound = true;
    document.addEventListener('click', function (e) {
        var tab = e.target.closest && e.target.closest('[data-wm-view]');
        if (tab) {
            var r1 = tab.closest('.wm');
            if (r1) _setView(r1, tab.getAttribute('data-wm-view'));
            return;
        }
        var pt = e.target.closest && e.target.closest('[data-wm-country]');
        if (pt) {
            var r2 = pt.closest('.wm');
            if (r2) _select(r2, pt.getAttribute('data-wm-country'));
        }
    });
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var pt = e.target.closest && e.target.closest('[data-wm-country]');
        if (!pt) return;
        var r = pt.closest('.wm');
        if (r) { e.preventDefault(); _select(r, pt.getAttribute('data-wm-country')); }
    });
}

function _ensureStyles() {
    if (_stylesInjected || typeof document === 'undefined') return;
    _stylesInjected = true;
    var css = [
        '.wm { margin: 4px 0 10px; }',
        '.wm-tabs { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; }',
        '.wm-tabs::-webkit-scrollbar { display: none; }',
        '.wm-tab { flex: 0 0 auto; font: inherit; font-size: 11px; font-weight: 600; padding: 5px 10px; border-radius: 99px; cursor: pointer;',
        '  border: 1px solid var(--border-strong, rgba(255,255,255,.15)); background: transparent; color: var(--text-secondary, #a0a8b3); }',
        '.wm-tab.is-on { background: var(--accent, #4f8cff); border-color: var(--accent, #4f8cff); color: #fff; }',
        '.wm-stage { border-radius: 12px; overflow: hidden; border: 1px solid var(--border, rgba(255,255,255,.07));',
        '  background: color-mix(in srgb, var(--accent, #4f8cff) 7%, transparent); }',
        '.wm-svg { display: block; width: 100%; height: auto; }',
        '.wm-land { fill: var(--text-tertiary, #6a7280); fill-opacity: .32; stroke: none; }',
        '.wm-land-open { fill: var(--accent, #4f8cff); fill-opacity: .22; }',
        '.wm-land-active { fill: var(--accent, #4f8cff); fill-opacity: .55; }',
        '.wm-pt { cursor: pointer; outline: none; }',
        '.wm-hit { fill: transparent; }',
        '.wm-dot { fill: var(--accent, #4f8cff); stroke: var(--bg-2, #161b24); transition: opacity .15s; }',
        '.wm-open .wm-dot { fill: var(--text-tertiary, #6a7280); fill-opacity: .8; }',
        '.wm-locked .wm-dot { fill: transparent; stroke: var(--text-tertiary, #6a7280); }',
        '.wm-pt:hover .wm-dot, .wm-pt:focus-visible .wm-dot, .wm-pt.is-sel .wm-dot { stroke: var(--text-primary, #fff); }',
        '.wm-info { min-height: 20px; margin-top: 8px; font-size: 12px; color: var(--text-secondary, #a0a8b3); }',
        '.wm-info b { color: var(--text-primary, #e8eaee); }',
        '.wm-info-flag { margin-right: 4px; }',
        '.wm-legend { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 6px; font-size: 10px; color: var(--text-tertiary, #6a7280); }',
        '.wm-legend span { display: inline-flex; align-items: center; gap: 4px; }',
        '.wm-key { display: inline-block; width: 9px; height: 9px; border-radius: 50%; }',
        '.wm-key-active { background: var(--accent, #4f8cff); }',
        '.wm-key-open { background: var(--text-tertiary, #6a7280); opacity: .8; }',
        '.wm-key-locked { border: 1.5px dashed var(--text-tertiary, #6a7280); box-sizing: border-box; }'
    ].join('\n');
    var style = document.createElement('style');
    style.setAttribute('data-world-map', '');
    style.textContent = css;
    document.head.appendChild(style);
}
