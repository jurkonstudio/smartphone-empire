// FILE: src/ui/phone/AccessoryMockup.js  (BARU — patch 0.2.5)
// ============================================================
// AccessoryMockup — SVG mockup aksesori ekosistem (earbuds, jam pintar, charger).
// Gaya sama dengan ChipMockup: SVG inline, tanpa aset gambar, tanpa filter berat.
// Tampilan mengikuti tier (basic / mid / premium) dan status lini (terbuka / tertutup).
// Teks di dalam SVG hanya label "belum dibuka" dan dilewatkan lewat opts.closedLabel
// (diambil dari kamus oleh pemanggil), jadi modul ini tidak punya teks UI sendiri.
// ============================================================

// Palet per tier. body = bodi utama, shade = sisi gelap, accent = aksen, hi = sorotan.
var TIER_PALETTE = {
    basic:   { body: '#e6e8ec', shade: '#bfc3cc', accent: '#8a909c', hi: '#ffffff', strap: '#6b7280', glass: '#1c2230', metal: false },
    mid:     { body: '#cdd3dc', shade: '#9aa3b2', accent: '#0a84ff', hi: '#f4f7fb', strap: '#2b3a55', glass: '#0d1524', metal: true },
    premium: { body: '#23262d', shade: '#0f1115', accent: '#d4af37', hi: '#5a5f6b', strap: '#171a20', glass: '#05070b', metal: true }
};
var CLOSED_PALETTE = { body: '#c7c9ce', shade: '#a3a6ad', accent: '#8d9099', hi: '#dcdee2', strap: '#9a9da4', glass: '#6e7178', metal: false };

function _esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function _pal(tier, open) {
    if (!open) return CLOSED_PALETTE;
    return TIER_PALETTE[tier] || TIER_PALETTE.mid;
}

// Gradien linear sederhana (satu per mockup). ID deterministik agar HTML stabil.
function _grad(id, c1, c2) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>';
}

// ---------- EARBUDS: kotak pengisi + dua earbud ----------
function _earbuds(p, g, tier, open) {
    var s = '';
    // kotak pengisi
    s += '<rect x="18" y="38" width="64" height="38" rx="14" fill="url(#' + g + ')"/>';
    s += '<path d="M18 56 H82" stroke="' + p.shade + '" stroke-width="1.2"/>';           // garis tutup
    s += '<rect x="45" y="52" width="10" height="3" rx="1.5" fill="' + p.accent + '"/>';  // LED
    if (open && tier === 'premium') s += '<rect x="18" y="38" width="64" height="38" rx="14" fill="none" stroke="' + p.accent + '" stroke-width="0.8"/>';
    if (open && tier === 'mid') s += '<circle cx="50" cy="66" r="2.2" fill="none" stroke="' + p.accent + '" stroke-width="1"/>';
    // dua earbud di depan
    var xs = [34, 66];
    for (var i = 0; i < xs.length; i++) {
        var x = xs[i], dir = i === 0 ? -1 : 1;
        s += '<rect x="' + (x - 2.2 + dir * 3) + '" y="62" width="4.4" height="22" rx="2.2" fill="' + p.shade + '"/>';       // tangkai
        s += '<ellipse cx="' + x + '" cy="62" rx="8" ry="9" fill="url(#' + g + ')" stroke="' + p.shade + '" stroke-width="0.8"/>'; // kepala
        s += '<circle cx="' + (x - dir * 1.5) + '" cy="62" r="2.4" fill="' + p.accent + '" opacity="0.85"/>';                    // sensor
    }
    return s;
}

// ---------- JAM PINTAR: layar + tali ----------
function _watch(p, g, tier, open) {
    var s = '';
    // tali atas & bawah
    s += '<rect x="36" y="6" width="28" height="30" rx="8" fill="' + p.strap + '"/>';
    s += '<rect x="36" y="64" width="28" height="30" rx="8" fill="' + p.strap + '"/>';
    if (open && tier === 'mid') {
        s += '<path d="M42 14 H58 M42 20 H58 M42 80 H58 M42 86 H58" stroke="' + p.accent + '" stroke-width="0.8" opacity="0.7"/>';
    }
    if (open && tier === 'premium') {
        s += '<path d="M40 12 H60 M40 18 H60 M40 82 H60 M40 88 H60" stroke="' + p.accent + '" stroke-width="0.8" opacity="0.8"/>';
    }
    // bodi
    s += '<circle cx="50" cy="50" r="23" fill="url(#' + g + ')"/>';
    s += '<circle cx="50" cy="50" r="23" fill="none" stroke="' + (tier === 'premium' && open ? p.accent : p.shade) + '" stroke-width="' + (tier === 'basic' || !open ? 1 : 2) + '"/>';
    s += '<rect x="72" y="44" width="4" height="12" rx="2" fill="' + p.shade + '"/>'; // crown
    // layar
    s += '<circle cx="50" cy="50" r="18" fill="' + p.glass + '"/>';
    if (open) {
        s += '<path d="M50 50 V38 M50 50 L58 54" stroke="' + (tier === 'basic' ? '#ffffff' : p.accent) + '" stroke-width="2" stroke-linecap="round"/>';
        s += '<circle cx="50" cy="50" r="1.8" fill="#ffffff"/>';
        for (var i = 0; i < 12; i++) {
            var a = i * Math.PI / 6, r1 = 15, r2 = i % 3 === 0 ? 12.5 : 13.7;
            s += '<line x1="' + (50 + Math.sin(a) * r1).toFixed(1) + '" y1="' + (50 - Math.cos(a) * r1).toFixed(1) +
                '" x2="' + (50 + Math.sin(a) * r2).toFixed(1) + '" y2="' + (50 - Math.cos(a) * r2).toFixed(1) +
                '" stroke="#ffffff" stroke-width="0.6" opacity="0.7"/>';
        }
    }
    return s;
}

// ---------- CHARGER: bata + steker + kabel ----------
function _charger(p, g, tier, open) {
    var s = '';
    // kabel
    s += '<path d="M50 84 C50 94 70 94 78 86" fill="none" stroke="' + p.strap + '" stroke-width="2.4" stroke-linecap="round"/>';
    s += '<rect x="76" y="82" width="9" height="6" rx="1.6" fill="' + p.shade + '" transform="rotate(-25 80 85)"/>';
    // steker (dua pin)
    s += '<rect x="40" y="10" width="3.2" height="12" rx="1" fill="' + p.accent + '" opacity="0.9"/>';
    s += '<rect x="56.8" y="10" width="3.2" height="12" rx="1" fill="' + p.accent + '" opacity="0.9"/>';
    // bata
    s += '<rect x="28" y="20" width="44" height="62" rx="9" fill="url(#' + g + ')"/>';
    s += '<rect x="28" y="20" width="44" height="62" rx="9" fill="none" stroke="' + p.shade + '" stroke-width="0.8"/>';
    // port
    s += '<rect x="42" y="68" width="16" height="6" rx="3" fill="' + p.glass + '"/>';
    if (open && tier !== 'basic') s += '<rect x="42" y="58" width="16" height="6" rx="3" fill="' + p.glass + '"/>';   // port kedua
    if (open && tier === 'premium') {
        s += '<rect x="34" y="28" width="32" height="3" rx="1.5" fill="' + p.accent + '"/>';                          // strip LED
        s += '<rect x="34" y="34" width="20" height="2" rx="1" fill="' + p.accent + '" opacity="0.5"/>';
    } else if (open && tier === 'mid') {
        s += '<circle cx="50" cy="34" r="3" fill="' + p.accent + '"/>';
    }
    return s;
}

var SHAPES = { earbuds: _earbuds, watch: _watch, charger: _charger };

// renderAccessoryMockup(lineId, tier, opts)
//   opts.size        : sisi persegi dalam px (default 160)
//   opts.open        : true = berwarna sesuai tier, false = abu-abu "belum dibuka"
//   opts.closedLabel : teks label saat tertutup (sudah diterjemahkan oleh pemanggil)
//   opts.caption     : false untuk menyembunyikan label (dipakai thumbnail)
export function renderAccessoryMockup(lineId, tier, opts) {
    opts = opts || {};
    var size = Number(opts.size);
    if (!isFinite(size) || size < 24) size = 160;
    var open = opts.open !== false;
    var draw = SHAPES[lineId];
    if (!draw) return '';
    if (!TIER_PALETTE[tier]) tier = 'mid';

    var p = _pal(tier, open);
    var gid = 'acc_' + lineId + '_' + tier + '_' + (open ? 'o' : 'c');
    var showLabel = !open && opts.caption !== false && opts.closedLabel && size >= 96;

    var s = '<svg class="acc-mockup" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + size + '" height="' + size + '" ' +
        'role="img" aria-hidden="true" style="display:block;margin:0 auto;max-width:100%;height:auto">';
    s += '<defs>' + _grad(gid, p.hi, p.body) + '</defs>';
    s += '<ellipse cx="50" cy="94" rx="30" ry="3" fill="#000000" opacity="0.12"/>';   // bayangan alas
    s += '<g' + (open ? '' : ' opacity="0.75"') + '>' + draw(p, gid, tier, open) + '</g>';
    if (showLabel) {
        s += '<rect x="22" y="44" width="56" height="12" rx="6" fill="#000000" opacity="0.55"/>';
        s += '<text x="50" y="52.6" text-anchor="middle" font-size="6" font-family="sans-serif" fill="#ffffff">' + _esc(opts.closedLabel) + '</text>';
    }
    s += '</svg>';
    return s;
}

export function renderAccessoryThumbnail(lineId, tier, size, open) {
    return renderAccessoryMockup(lineId, tier, { size: size || 56, open: open !== false, caption: false });
}
