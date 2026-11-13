// FILE: src/ui/social/AvatarView.js  (BARU)
// Avatar bulat: foto bila ada, kalau tidak huruf pertama nama.
// + resolveAvatarUrls() untuk foto pemain lain (signed URL, di-cache).
import { CloudService } from '../../services/CloudService.js';
import { COSMETICS } from '../../data/cosmetics.data.js';

var _ART = {};
COSMETICS.forEach(function (c) { _ART[c.id] = c; });

var _cache = {};          // path -> { url, exp }
var TTL_MS = 50 * 60 * 1000;

export function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function _safeSrc(src) {
    src = String(src || '');
    return (/^data:image\//.test(src) || /^https:\/\//.test(src)) ? src : '';
}

// o: { src, name, size (px), cls, edit (bool: tampilkan badge kamera), dotId, frame (id bingkai kosmetik SIL) }
export function avatarHtml(o) {
    o = o || {};
    var size = o.size || 40;
    var src = _safeSrc(o.src);
    var initial = String(o.name || '?').trim().charAt(0).toUpperCase() || '?';
    var inner = src
        ? '<img src="' + esc(src) + '" alt="" draggable="false">'
        : '<span class="pp-avatar-letter">' + esc(initial) + '</span>';
    var fr = o.frame && _ART[o.frame] && _ART[o.frame].cat === 'frame' ? _ART[o.frame].art : null;
    var extra = '';
    if (o.edit) extra += '<span class="pp-avatar-edit" aria-hidden="true">✎</span>';
    if (o.dotId) extra += '<span class="pp-avatar-dot" data-online-dot="' + esc(o.dotId) + '"></span>';
    var frStyle = fr ? ';--fr-a:' + fr.ring[0] + ';--fr-b:' + fr.ring[1] + ';--fr-g:' + fr.glow : '';
    return '<span class="pp-avatar ' + (src ? 'has-img ' : '') + (fr ? 'pp-framed ' : '') + esc(o.cls || '') + '" style="--pp-size:' + size + 'px' + frStyle + '">' +
        inner + extra + '</span>';
}

// Lencana kosmetik di samping nama. title = teks tooltip yang sudah diterjemahkan oleh pemanggil.
export function badgeHtml(id, title) {
    var c = _ART[id];
    if (!c || c.cat !== 'badge') return '';
    return '<span class="pp-badge" style="--bd:' + c.art.color + '" title="' + esc(title || '') + '" aria-label="' + esc(title || '') + '">' + c.icon + '</span>';
}

// rows: array profil publik. Mengembalikan { [profileId]: url }.
export async function resolveAvatarUrls(rows) {
    var out = {};
    var need = [];
    var now = Date.now();
    (rows || []).forEach(function (r) {
        if (!r || !r.avatar_path) return;
        var c = _cache[r.avatar_path];
        if (c && c.exp > now) out[r.id] = c.url;
        else need.push(r);
    });
    if (!need.length) return out;

    var res = await CloudService.getPlayerAssetUrls(need.map(function (r) { return r.avatar_path; }), 3600);
    if (res && res.ok && Array.isArray(res.items)) {
        var byPath = {};
        res.items.forEach(function (it) { if (it && it.path && it.signedUrl) byPath[it.path] = it.signedUrl; });
        need.forEach(function (r) {
            var url = byPath[r.avatar_path];
            if (url) {
                _cache[r.avatar_path] = { url: url, exp: now + TTL_MS };
                out[r.id] = url;
            }
        });
    }
    return out;
}
