// FILE: src/ui/social/AvatarView.js  (BARU)
// Avatar bulat: foto bila ada, kalau tidak huruf pertama nama.
// + resolveAvatarUrls() untuk foto pemain lain (signed URL, di-cache).
import { CloudService } from '../../services/CloudService.js';

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

// o: { src, name, size (px), cls, edit (bool: tampilkan badge kamera), dotId }
export function avatarHtml(o) {
    o = o || {};
    var size = o.size || 40;
    var src = _safeSrc(o.src);
    var initial = String(o.name || '?').trim().charAt(0).toUpperCase() || '?';
    var inner = src
        ? '<img src="' + esc(src) + '" alt="" draggable="false">'
        : '<span class="pp-avatar-letter">' + esc(initial) + '</span>';
    var extra = '';
    if (o.edit) extra += '<span class="pp-avatar-edit" aria-hidden="true">✎</span>';
    if (o.dotId) extra += '<span class="pp-avatar-dot" data-online-dot="' + esc(o.dotId) + '"></span>';
    return '<span class="pp-avatar ' + (src ? 'has-img ' : '') + esc(o.cls || '') + '" style="--pp-size:' + size + 'px">' +
        inner + extra + '</span>';
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
