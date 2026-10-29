// FILE: src/ui/campus/CampusLabels.js
// v2027.61 — label lebih besar & mudah dibaca di HP; teks level ikut bahasa (sebelumnya 'Lv' hardcoded).
// v2027.60 — Label gedung di atas peta (DOM murni, tanpa library): pill kecil berisi nama + level,
// diproyeksikan dari titik 3D di atas atap tiap bangunan.
//  - Tidak menangkap sentuhan (pointer-events:none) -> kontrol peta & tap bangunan tetap persis sama.
//  - Penghindaran tumpang tindih: prioritas (terpilih > hover > HQ > lainnya), label yang bentrok disembunyikan.
//  - LOD menurut zoom: zoom jauh hanya HQ/terpilih; zoom sedang nama; zoom dekat nama + level.
//  - Hanya diperbarui saat kamera/daftar berubah (bukan tiap frame), posisi lewat transform (tanpa reflow).
import { t } from '../../core/LanguageService.js';

var STYLE_ID = 'campus-labels-style';
var CSS = [
    '.cmp-labels{position:absolute;inset:0;z-index:2;overflow:hidden;pointer-events:none;}',
    '.cmp-lbl{position:absolute;left:0;top:0;display:flex;align-items:center;gap:5px;height:22px;padding:0 9px;',
    'border-radius:10px;white-space:nowrap;font-size:11.5px;font-weight:600;letter-spacing:.01em;line-height:1;',
    'color:var(--text-primary,#111);background:var(--surface-glass,rgba(255,255,255,.82));',
    'border:1px solid var(--border-subtle,rgba(0,0,0,.10));box-shadow:0 3px 10px rgba(15,23,42,.16),0 1px 2px rgba(15,23,42,.10);',
    '-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);',
    'opacity:0;visibility:hidden;transition:opacity .18s ease,background-color .18s ease,color .18s ease,border-color .18s ease;',
    'will-change:transform;max-width:160px;}',
    '.cmp-lbl.show{opacity:1;visibility:visible;}',
    '.cmp-lbl::after{content:"";position:absolute;left:50%;bottom:-4px;width:7px;height:7px;margin-left:-3.5px;',
    'background:inherit;border-right:1px solid var(--border-subtle,rgba(0,0,0,.10));border-bottom:1px solid var(--border-subtle,rgba(0,0,0,.10));',
    'transform:rotate(45deg);border-bottom-right-radius:2px;}',
    '.cmp-lbl.sel::after{border-color:var(--accent,#2563eb);}',
    '.cmp-lbl .n{overflow:hidden;text-overflow:ellipsis;min-width:0;}',
    '.cmp-lbl .l{font-weight:700;font-size:10.5px;padding:2px 6px;border-radius:7px;color:var(--accent,#2563eb);',
    'background:var(--accent-soft,rgba(37,99,235,.14));}',
    '.cmp-lbl.max .l{color:#8a6a10;background:rgba(224,180,69,.26);}',
    '.cmp-lbl.hov{border-color:var(--accent,#2563eb);}',
    '.cmp-lbl .a{display:none;flex:0 0 auto;width:8px;height:8px;border-radius:50%;}',
    '.cmp-lbl.warn .a,.cmp-lbl.info .a{display:block;animation:cmpAl 1.4s ease-in-out infinite;}',
    '.cmp-lbl.warn .a{background:#ef4444;box-shadow:0 0 0 2px rgba(239,68,68,.28);}',
    '.cmp-lbl.info .a{background:#f59e0b;box-shadow:0 0 0 2px rgba(245,158,11,.28);}',
    '.cmp-lbl.warn{border-color:rgba(239,68,68,.6);}',
    '@keyframes cmpAl{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.45;transform:scale(.8);}}',
    '.cmp-lbl.sel{background:var(--accent,#2563eb);border-color:var(--accent,#2563eb);color:#fff;}',
    '.cmp-lbl.sel .l{color:#fff;background:rgba(255,255,255,.22);}',
    'html[data-theme="dark"] .cmp-lbl.max .l{color:#f1cf72;}',
    'html[data-perf="lite"] .cmp-lbl{-webkit-backdrop-filter:none;backdrop-filter:none;background:var(--bg-2,#fff);}',
    '@media (prefers-reduced-motion:reduce){.cmp-lbl{transition:none;}.cmp-lbl .a{animation:none!important;}}'
].join('');

function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
}

var LBL_H = 22;
var PAD = 4;
var ZOOM_ALL = 0.8;        // di bawah ini hanya HQ + terpilih
var ZOOM_LEVEL = 1.35;     // di atas ini tampilkan level juga

export function createCampusLabels(THREE, container) {
    ensureStyle();
    var layer = document.createElement('div');
    layer.className = 'cmp-labels';
    layer.setAttribute('aria-hidden', 'true');     // info yang sama sudah ada di kartu info (aksesibel)
    container.appendChild(layer);

    var items = {};          // key -> { id, key, node, nEl, lEl, x, y, z, prio, name, level, max, w, vis, px, py }
    var order = [];
    var v = new THREE.Vector3();
    var placed = [];
    var selKey = null, hovKey = null;
    var last = { cam: null, w: 0, h: 0, zoom: 1 };

    // list: [{ key, id, name, level, max, x, y, z, prio }]
    function setItems(list) {
        var seen = {};
        for (var i = 0; i < list.length; i++) {
            var it = list[i];
            seen[it.key] = 1;
            var cur = items[it.key];
            if (!cur) {
                var node = document.createElement('div');
                node.className = 'cmp-lbl';
                var nEl = document.createElement('span'); nEl.className = 'n';
                var lEl = document.createElement('span'); lEl.className = 'l';
                var aEl = document.createElement('span'); aEl.className = 'a';
                node.appendChild(aEl); node.appendChild(nEl); node.appendChild(lEl);
                layer.appendChild(node);
                cur = items[it.key] = { key: it.key, node: node, nEl: nEl, lEl: lEl, vis: false, px: -1, py: -1, name: '', level: -1, w: 60 };
            }
            cur.id = it.id; cur.x = it.x; cur.y = it.y; cur.z = it.z; cur.prio = it.prio; cur.max = it.max;
            if (cur.name !== it.name) { cur.name = it.name; cur.nEl.textContent = it.name; }
            var lvTxt = t('office.status.level', { n: it.level });
            if (cur.level !== it.level || cur.lvTxt !== lvTxt) { cur.level = it.level; cur.lvTxt = lvTxt; cur.lEl.textContent = lvTxt; }
            cur.node.classList.toggle('max', !!it.max && it.level >= it.max);
            cur.hasLevel = !!it.max;
            cur.alert = it.alert || '';
            cur.node.classList.toggle('warn', cur.alert === 'warn');
            cur.node.classList.toggle('info', cur.alert === 'info');
        }
        for (var k in items) {
            if (!seen[k]) { layer.removeChild(items[k].node); delete items[k]; }
        }
        order = Object.keys(items).sort(function (a, b) { return items[a].prio - items[b].prio; });
        if (last.cam) relayout();
    }

    function setState(sel, hov) {
        selKey = sel; hovKey = hov;
        for (var k in items) {
            items[k].node.classList.toggle('sel', k === selKey);
            items[k].node.classList.toggle('hov', k === hovKey && k !== selKey);
        }
        if (last.cam) relayout();
    }

    function estWidth(it, showLevel) {
        // Estimasi lebar tanpa mengukur DOM (hindari layout thrash): ~5.9px per huruf + padding.
        var w = it.name.length * 6.6 + 20 + (showLevel && it.hasLevel ? 38 : 0) + (it.alert ? 13 : 0);
        return Math.min(160, w);
    }

    function relayout() {
        var cam = last.cam, w = last.w, h = last.h, zoom = last.zoom;
        if (!cam || !w || !h) return;
        cam.updateMatrixWorld(true);
        var showLevel = zoom >= ZOOM_LEVEL;
        placed.length = 0;
        for (var n = 0; n < order.length; n++) {
            var it = items[order[n]];
            var important = it.key === selKey || it.key === hovKey;
            var allowed = important || zoom >= ZOOM_ALL || it.prio <= 1 || !!it.alert;
            var show = false, sx = 0, sy = 0, bw = 0;
            if (allowed) {
                v.set(it.x, it.y, it.z).project(cam);
                sx = (v.x * 0.5 + 0.5) * w;
                sy = (-v.y * 0.5 + 0.5) * h;
                bw = estWidth(it, showLevel);
                var inside = v.z > -1 && v.z < 1 && sx > bw / 2 + 2 && sx < w - bw / 2 - 2 && sy > LBL_H + 4 && sy < h - 6;
                if (inside) {
                    var x0 = sx - bw / 2 - PAD, x1 = sx + bw / 2 + PAD, y0 = sy - LBL_H - 6 - PAD, y1 = sy - 6 + PAD;
                    show = true;
                    if (!important) {
                        for (var j = 0; j < placed.length; j++) {
                            var r = placed[j];
                            if (x0 < r[2] && x1 > r[0] && y0 < r[3] && y1 > r[1]) { show = false; break; }
                        }
                    }
                    if (show) placed.push([x0, y0, x1, y1]);
                }
            }
            if (show !== it.vis) { it.vis = show; it.node.classList.toggle('show', show); }
            if (show) {
                var px = Math.round(sx - bw / 2), py = Math.round(sy - LBL_H - 6);
                if (px !== it.px || py !== it.py) {
                    it.px = px; it.py = py;
                    it.node.style.transform = 'translate3d(' + px + 'px,' + py + 'px,0)';
                }
                it.lEl.style.display = (showLevel && it.hasLevel) ? '' : 'none';
            }
        }
    }

    // Dipanggil dari applyCamera / resize (tidak tiap frame render).
    function update(cam, w, h, zoom) {
        last.cam = cam; last.w = w; last.h = h; last.zoom = zoom;
        relayout();
    }

    return {
        setItems: setItems,
        setState: setState,
        update: update,
        dispose: function () {
            if (layer.parentNode) layer.parentNode.removeChild(layer);
            items = {}; order = []; last.cam = null;
        }
    };
}
