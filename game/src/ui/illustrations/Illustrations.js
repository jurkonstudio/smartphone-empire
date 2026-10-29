// FILE: src/ui/illustrations/Illustrations.js
// ============================================================
// Ilustrasi SVG untuk empty state — v2 (gradien, kedalaman, animasi halus).
// - Semua warna memakai CSS variable => otomatis ikut tema (gelap/terang) dan warna aksen pilihan pemain.
// - Setiap SVG punya id gradien unik (tidak bentrok bila beberapa ilustrasi tampil bersamaan).
// - Animasi (melayang, berkelip, api roket) didefinisikan di style.css (.il-float / .il-twinkle / .il-flame)
//   dan otomatis mati pada "reduce motion".
// - API publik tidak berubah: getIllustration(name, size), getIllustrationNames().
// Ukuran dasar: viewBox 200x200, skala bebas.
// ============================================================

const BASE = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';

const ACC = 'var(--accent)';
const ACC_HI = 'color-mix(in srgb, var(--accent) 58%, #ffffff)';
const ACC_LO = 'color-mix(in srgb, var(--accent) 80%, #000000)';
const LINE = 'var(--border-strong)';
const INK = 'var(--text-secondary)';
const DIM = 'var(--text-tertiary)';

let _uid = 0;
function nid() { _uid = (_uid + 1) % 1000000; return 'il' + _uid + '-'; }

// stop gradien: atribut = cadangan (browser lama), style = versi color-mix
function stop(offset, mixed, fallback, opacity) {
    return '<stop offset="' + offset + '" stop-color="' + fallback + '"' +
        (opacity != null ? ' stop-opacity="' + opacity + '"' : '') +
        ' style="stop-color:' + mixed + '"/>';
}

// Definisi gradien yang dipakai bersama. p = prefix id unik.
function defs(p) {
    return '<defs>' +
        '<radialGradient id="' + p + 'bg" cx="50%" cy="46%" r="56%">' +
            '<stop offset="0" stop-color="' + ACC + '" stop-opacity="0.30"/>' +
            '<stop offset="1" stop-color="' + ACC + '" stop-opacity="0.04"/>' +
        '</radialGradient>' +
        '<linearGradient id="' + p + 'ac" x1="0" y1="0" x2="1" y2="1">' + stop(0, ACC_HI, ACC) + stop(1, ACC_LO, ACC) + '</linearGradient>' +
        '<linearGradient id="' + p + 'av" x1="0" y1="0" x2="0" y2="1">' + stop(0, ACC_HI, ACC) + stop(1, ACC, ACC) + '</linearGradient>' +
        '<linearGradient id="' + p + 'cd" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="var(--bg-4)"/><stop offset="1" stop-color="var(--bg-3)"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + p + 'cl" x1="0" y1="0" x2="1" y2="0">' +
            '<stop offset="0" stop-color="var(--bg-3)"/><stop offset="1" stop-color="var(--bg-4)"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + p + 'gl" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="#ffffff" stop-opacity="0.42"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + p + 'ar" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="' + ACC + '" stop-opacity="0.38"/><stop offset="1" stop-color="' + ACC + '" stop-opacity="0"/>' +
        '</linearGradient>' +
        '<radialGradient id="' + p + 'sh" cx="50%" cy="50%" r="50%">' +
            '<stop offset="0" stop-color="#000000" stop-opacity="0.38"/><stop offset="1" stop-color="#000000" stop-opacity="0"/>' +
        '</radialGradient>' +
    '</defs>';
}

// Latar bulat bercahaya + cincin putus-putus
function backdrop(p, tint) {
    const fill = tint ? 'fill="' + tint + '"' : 'fill="url(#' + p + 'bg)"';
    return '<circle cx="100" cy="100" r="84" ' + fill + '/>' +
        '<circle cx="100" cy="100" r="84" stroke="' + ACC + '" stroke-opacity="0.2" stroke-width="1.2" stroke-dasharray="2 7"/>';
}

function shadow(p, cx, cy, rx) {
    return '<ellipse cx="' + (cx || 100) + '" cy="' + (cy || 168) + '" rx="' + (rx || 52) + '" ry="7" fill="url(#' + p + 'sh)"/>';
}

// Kilau 4 sudut
function sparkle(x, y, r, delay, color) {
    const d = 'M' + x + ' ' + (y - r) + ' Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y +
        ' Q' + x + ' ' + y + ' ' + x + ' ' + (y + r) + ' Q' + x + ' ' + y + ' ' + (x - r) + ' ' + y +
        ' Q' + x + ' ' + y + ' ' + x + ' ' + (y - r) + ' Z';
    return '<path class="il-twinkle" style="animation-delay:' + (delay || 0) + 's" d="' + d + '" fill="' + (color || ACC) + '" stroke="none"/>';
}

// Bintang 5 sudut (pusat x,y; radius luar r)
function star(x, y, r, fill) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
        const rad = (i % 2 === 0 ? r : r * 0.46);
        const a = -Math.PI / 2 + i * Math.PI / 5;
        pts.push((x + Math.cos(a) * rad).toFixed(1) + ',' + (y + Math.sin(a) * rad).toFixed(1));
    }
    return '<polygon points="' + pts.join(' ') + '" fill="' + fill + '" stroke="none"/>';
}

// ============================================================
// 1. PRODUK — Kotak terbuka, ponsel menyembul, kilau
// ============================================================
function illustrationBox() {
    const p = nid();
    return '<svg ' + BASE + '>' + defs(p) + backdrop(p) + shadow(p, 100, 172, 56) +
        // tutup belakang (terbuka)
        '<path d="M100 100 L52 124 L42 104 L90 80 Z" fill="url(#' + p + 'cl)" stroke="' + LINE + '" stroke-width="1.6"/>' +
        '<path d="M100 100 L148 124 L158 104 L110 80 Z" fill="url(#' + p + 'cd)" stroke="' + LINE + '" stroke-width="1.6"/>' +
        // rongga kotak
        '<path d="M100 100 L148 124 L100 148 L52 124 Z" fill="var(--bg-1)" stroke="' + LINE + '" stroke-width="1.6"/>' +
        // ponsel menyembul
        '<g class="il-float">' +
            '<rect x="80" y="46" width="40" height="92" rx="9" fill="url(#' + p + 'ac)"/>' +
            '<rect x="85" y="53" width="30" height="76" rx="5" fill="var(--bg-1)" opacity="0.92"/>' +
            '<path d="M85 74 L115 62 L115 80 L85 92 Z" fill="url(#' + p + 'ar)" stroke="none"/>' +
            '<rect x="94" y="49" width="12" height="2.6" rx="1.3" fill="' + ACC_HI + '" style="fill:' + ACC_HI + '" stroke="none"/>' +
            '<rect x="85" y="53" width="30" height="76" rx="5" fill="url(#' + p + 'gl)" opacity="0.5"/>' +
        '</g>' +
        // sisi depan
        '<path d="M52 124 L100 148 L100 178 L52 154 Z" fill="url(#' + p + 'cl)" stroke="' + LINE + '" stroke-width="1.6"/>' +
        '<path d="M148 124 L100 148 L100 178 L148 154 Z" fill="url(#' + p + 'cd)" stroke="' + LINE + '" stroke-width="1.6"/>' +
        // label & pita aksen
        '<path d="M64 140 L88 152 L88 158 L64 146 Z" fill="url(#' + p + 'ac)" stroke="none" opacity="0.95"/>' +
        '<path d="M112 152 L136 140" stroke="' + DIM + '" stroke-width="2" opacity="0.5"/>' +
        '<path d="M112 159 L128 151" stroke="' + DIM + '" stroke-width="2" opacity="0.35"/>' +
        sparkle(46, 62, 7, 0) + sparkle(156, 56, 9, 0.6) + sparkle(164, 98, 5, 1.2) +
        '<circle cx="62" cy="86" r="2.4" fill="' + ACC + '" class="il-twinkle" style="animation-delay:.9s" stroke="none"/>' +
    '</svg>';
}

// ============================================================
// 2. RISET — Labu erlenmeyer, cairan bergelombang, gelembung
// ============================================================
function illustrationFlask() {
    const p = nid();
    return '<svg ' + BASE + '>' + defs(p) + backdrop(p) + shadow(p, 100, 168, 48) +
        '<defs><clipPath id="' + p + 'cp"><path d="M86 62 L86 86 L58 138 Q50 156 70 158 L130 158 Q150 156 142 138 L114 86 L114 62 Z"/></clipPath></defs>' +
        // badan kaca
        '<path d="M86 62 L86 86 L58 138 Q50 156 70 158 L130 158 Q150 156 142 138 L114 86 L114 62 Z" fill="var(--bg-3)" fill-opacity="0.55" stroke="' + LINE + '" stroke-width="2.4"/>' +
        // cairan
        '<g clip-path="url(#' + p + 'cp)">' +
            '<path d="M40 118 Q58 110 76 118 T112 118 T148 118 T184 118 L184 170 L40 170 Z" fill="url(#' + p + 'av)" opacity="0.9"/>' +
            '<path d="M40 118 Q58 110 76 118 T112 118 T148 118 T184 118" stroke="' + ACC_HI + '" style="stroke:' + ACC_HI + '" stroke-width="2" opacity="0.8"/>' +
        '</g>' +
        // gelembung
        '<g stroke="none" fill="#ffffff">' +
            '<circle class="il-float" cx="92" cy="138" r="4" opacity="0.55"/>' +
            '<circle class="il-float" style="animation-delay:.7s" cx="108" cy="128" r="5.5" opacity="0.45"/>' +
            '<circle class="il-float" style="animation-delay:1.3s" cx="122" cy="142" r="3" opacity="0.6"/>' +
            '<circle class="il-float" style="animation-delay:.3s" cx="100" cy="110" r="2.5" opacity="0.5"/>' +
        '</g>' +
        // bibir & kilau kaca
        '<rect x="80" y="56" width="40" height="8" rx="4" fill="url(#' + p + 'cd)" stroke="' + LINE + '" stroke-width="2"/>' +
        '<path d="M92 72 L92 88 L72 128" stroke="#ffffff" stroke-opacity="0.35" stroke-width="3"/>' +
        // uap naik
        '<path class="il-twinkle" d="M96 46 Q92 38 98 32 Q104 26 100 18" stroke="' + ACC + '" stroke-width="2.4" opacity="0.6"/>' +
        '<path class="il-twinkle" style="animation-delay:.8s" d="M108 44 Q112 38 107 32" stroke="' + ACC + '" stroke-width="2" opacity="0.45"/>' +
        sparkle(52, 76, 7, 0.4) + sparkle(156, 96, 8, 1) +
    '</svg>';
}

// ============================================================
// 3. PASAR — Panel grafik, batang naik, garis tren bercahaya
// ============================================================
function illustrationChart() {
    const p = nid();
    return '<svg ' + BASE + '>' + defs(p) + backdrop(p) + shadow(p, 100, 168, 58) +
        '<rect x="34" y="44" width="132" height="110" rx="14" fill="url(#' + p + 'cd)" stroke="' + LINE + '" stroke-width="1.8"/>' +
        // header panel
        '<circle cx="48" cy="58" r="3" fill="' + ACC + '" stroke="none"/>' +
        '<rect x="56" y="55" width="30" height="6" rx="3" fill="' + DIM + '" stroke="none" opacity="0.45"/>' +
        // garis bantu
        '<g stroke="' + LINE + '" stroke-width="1" stroke-dasharray="2 5" opacity="0.8">' +
            '<line x1="46" y1="92" x2="154" y2="92"/><line x1="46" y1="114" x2="154" y2="114"/><line x1="46" y1="136" x2="154" y2="136"/>' +
        '</g>' +
        // batang
        '<g stroke="none">' +
            '<rect x="50" y="118" width="14" height="18" rx="4" fill="' + ACC + '" opacity="0.28"/>' +
            '<rect x="72" y="106" width="14" height="30" rx="4" fill="' + ACC + '" opacity="0.38"/>' +
            '<rect x="94" y="112" width="14" height="24" rx="4" fill="' + ACC + '" opacity="0.32"/>' +
            '<rect x="116" y="92" width="14" height="44" rx="4" fill="' + ACC + '" opacity="0.5"/>' +
            '<rect x="138" y="76" width="14" height="60" rx="4" fill="url(#' + p + 'av)"/>' +
        '</g>' +
        // area + garis tren
        '<path d="M57 112 L79 98 L101 104 L123 80 L145 62 L145 136 L57 136 Z" fill="url(#' + p + 'ar)" stroke="none"/>' +
        '<path d="M57 112 L79 98 L101 104 L123 80 L145 62" stroke="url(#' + p + 'ac)" stroke-width="3.4"/>' +
        '<g fill="var(--bg-3)" stroke="' + ACC + '" stroke-width="2.4">' +
            '<circle cx="57" cy="112" r="3.6"/><circle cx="79" cy="98" r="3.6"/><circle cx="101" cy="104" r="3.6"/><circle cx="123" cy="80" r="3.6"/>' +
        '</g>' +
        // titik puncak bercahaya
        '<circle cx="145" cy="62" r="11" fill="' + ACC + '" opacity="0.18" stroke="none" class="il-twinkle"/>' +
        '<circle cx="145" cy="62" r="5.4" fill="url(#' + p + 'ac)" stroke="var(--bg-3)" stroke-width="2"/>' +
        // lencana naik
        '<g class="il-float"><circle cx="158" cy="44" r="14" fill="url(#' + p + 'ac)" stroke="none"/>' +
        '<path d="M152 49 L158 42 L164 49 M158 42 L158 52" stroke="#ffffff" stroke-width="2.6"/></g>' +
        sparkle(36, 34, 6, 0.3) + sparkle(172, 120, 5, 1.1) +
    '</svg>';
}

// ============================================================
// 4. TIM — Tiga siluet, satu menonjol, bubble obrolan
// ============================================================
function illustrationTeam() {
    const p = nid();
    return '<svg ' + BASE + '>' + defs(p) + backdrop(p) + shadow(p, 100, 168, 60) +
        // orang kiri
        '<g><circle cx="62" cy="96" r="14" fill="url(#' + p + 'cl)" stroke="' + LINE + '" stroke-width="1.8"/>' +
        '<path d="M38 156 Q38 122 62 122 Q86 122 86 156 Z" fill="url(#' + p + 'cl)" stroke="' + LINE + '" stroke-width="1.8"/></g>' +
        // orang kanan
        '<g><circle cx="138" cy="96" r="14" fill="url(#' + p + 'cd)" stroke="' + LINE + '" stroke-width="1.8"/>' +
        '<path d="M114 156 Q114 122 138 122 Q162 122 162 156 Z" fill="url(#' + p + 'cd)" stroke="' + LINE + '" stroke-width="1.8"/></g>' +
        // orang tengah (aksen, paling depan)
        '<g class="il-float"><circle cx="100" cy="84" r="18" fill="url(#' + p + 'ac)" stroke="none"/>' +
        '<path d="M70 160 Q70 114 100 114 Q130 114 130 160 Z" fill="url(#' + p + 'ac)" stroke="none"/>' +
        '<path d="M84 76 Q90 70 98 70" stroke="#ffffff" stroke-opacity="0.45" stroke-width="3"/>' +
        '<path d="M92 124 L100 134 L108 124" stroke="#ffffff" stroke-opacity="0.55" stroke-width="2.4"/></g>' +
        // bubble obrolan
        '<g class="il-float" style="animation-delay:.9s">' +
            '<path d="M128 40 Q128 30 138 30 L170 30 Q180 30 180 40 L180 54 Q180 64 170 64 L156 64 L148 73 L148 64 L138 64 Q128 64 128 54 Z" fill="url(#' + p + 'cd)" stroke="' + LINE + '" stroke-width="1.8"/>' +
            '<circle cx="144" cy="47" r="2.3" fill="' + ACC + '" stroke="none"/><circle cx="154" cy="47" r="2.3" fill="' + ACC + '" stroke="none" opacity="0.7"/><circle cx="164" cy="47" r="2.3" fill="' + ACC + '" stroke="none" opacity="0.45"/>' +
        '</g>' +
        sparkle(36, 58, 7, 0.5) + sparkle(168, 120, 5, 1.2) +
    '</svg>';
}

// ============================================================
// 5. ULASAN — Dua bubble: ulasan berbintang + balasan
// ============================================================
function illustrationChat() {
    const p = nid();
    return '<svg ' + BASE + '>' + defs(p) + backdrop(p) + shadow(p, 100, 170, 56) +
        // bubble besar (ulasan)
        '<g class="il-float">' +
            '<path d="M40 56 Q40 42 54 42 L124 42 Q138 42 138 56 L138 92 Q138 106 124 106 L84 106 L66 124 L66 106 L54 106 Q40 106 40 92 Z" fill="url(#' + p + 'cd)" stroke="' + LINE + '" stroke-width="1.8"/>' +
            star(56, 58, 7, ACC) + star(72, 58, 7, ACC) + star(88, 58, 7, ACC) + star(104, 58, 7, ACC) + star(120, 58, 7, 'var(--bg-4)') +
            '<g stroke="' + DIM + '" stroke-width="3" opacity="0.5"><line x1="52" y1="76" x2="124" y2="76"/><line x1="52" y1="88" x2="108" y2="88"/></g>' +
        '</g>' +
        // bubble kecil (balasan, aksen)
        '<g class="il-float" style="animation-delay:.8s">' +
            '<path d="M92 118 Q92 106 104 106 L150 106 Q162 106 162 118 L162 138 Q162 150 150 150 L134 150 L124 162 L124 150 L104 150 Q92 150 92 138 Z" fill="url(#' + p + 'ac)" stroke="none"/>' +
            '<g stroke="#ffffff" stroke-width="3" stroke-opacity="0.85"><line x1="104" y1="122" x2="150" y2="122"/><line x1="104" y1="134" x2="136" y2="134"/></g>' +
            '<path d="M92 118 Q92 106 104 106 L150 106 Q162 106 162 118 L162 124 Q130 112 92 128 Z" fill="url(#' + p + 'gl)" stroke="none" opacity="0.4"/>' +
        '</g>' +
        sparkle(160, 52, 8, 0.2) + sparkle(36, 138, 6, 1) +
    '</svg>';
}

// ============================================================
// 6. GENERIK — Roket (fallback), api berkedip, bintang
// ============================================================
function illustrationRocket() {
    const p = nid();
    return '<svg ' + BASE + '>' + defs(p) + backdrop(p) + 
        '<ellipse cx="100" cy="172" rx="40" ry="6" fill="url(#' + p + 'sh)"/>' +
        // awan peluncuran
        '<g fill="var(--bg-4)" stroke="none" opacity="0.8">' +
            '<circle cx="76" cy="168" r="11"/><circle cx="92" cy="172" r="13"/><circle cx="110" cy="172" r="13"/><circle cx="126" cy="168" r="11"/>' +
        '</g>' +
        '<g class="il-float" style="animation-duration:2.6s">' +
            // api
            '<g class="il-flame"><path d="M88 138 Q100 176 112 138 Z" fill="url(#' + p + 'ac)" opacity="0.95" stroke="none"/>' +
            '<path d="M94 138 Q100 160 106 138 Z" fill="#ffffff" opacity="0.8" stroke="none"/></g>' +
            // sirip
            '<path d="M80 104 L58 134 L82 128 Z" fill="url(#' + p + 'ac)" stroke="none"/>' +
            '<path d="M120 104 L142 134 L118 128 Z" fill="url(#' + p + 'ac)" stroke="none" opacity="0.85"/>' +
            // badan
            '<path d="M100 28 Q132 66 124 132 L76 132 Q68 66 100 28 Z" fill="url(#' + p + 'cl)" stroke="' + LINE + '" stroke-width="1.8"/>' +
            '<path d="M100 28 Q114 46 120 70 L80 70 Q86 46 100 28 Z" fill="url(#' + p + 'ac)" stroke="none"/>' +
            '<path d="M86 60 Q90 46 98 38" stroke="#ffffff" stroke-opacity="0.5" stroke-width="3"/>' +
            // jendela
            '<circle cx="100" cy="92" r="14" fill="var(--bg-1)" stroke="' + LINE + '" stroke-width="2.4"/>' +
            '<circle cx="100" cy="92" r="9" fill="url(#' + p + 'ac)" stroke="none"/>' +
            '<path d="M94 88 Q97 84 102 84" stroke="#ffffff" stroke-opacity="0.7" stroke-width="2.2"/>' +
            // garis dasar
            '<rect x="76" y="122" width="48" height="10" rx="3" fill="url(#' + p + 'ac)" stroke="none" opacity="0.9"/>' +
        '</g>' +
        sparkle(44, 56, 8, 0) + sparkle(156, 48, 6, 0.7) + sparkle(160, 104, 5, 1.3) + sparkle(50, 112, 4, 0.4) +
        '<circle cx="132" cy="38" r="2" fill="' + ACC + '" stroke="none" class="il-twinkle" style="animation-delay:.5s"/>' +
        '<circle cx="66" cy="84" r="1.8" fill="' + ACC + '" stroke="none" class="il-twinkle" style="animation-delay:1s"/>' +
    '</svg>';
}

// ============================================================
// 7. SEDIH — Grafik patah + wajah sedih (game over / gagal)
// ============================================================
function illustrationSad() {
    const p = nid();
    return '<svg ' + BASE + '>' + defs(p) +
        '<defs><radialGradient id="' + p + 'dg" cx="50%" cy="46%" r="56%">' +
            '<stop offset="0" stop-color="var(--danger)" stop-opacity="0.26"/><stop offset="1" stop-color="var(--danger)" stop-opacity="0.04"/></radialGradient>' +
        '<linearGradient id="' + p + 'dr" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="var(--danger)" stop-opacity="0.85"/><stop offset="1" stop-color="var(--danger)"/></linearGradient></defs>' +
        '<circle cx="100" cy="100" r="84" fill="url(#' + p + 'dg)"/>' +
        '<circle cx="100" cy="100" r="84" stroke="var(--danger)" stroke-opacity="0.22" stroke-width="1.2" stroke-dasharray="2 7"/>' +
        shadow(p, 100, 172, 56) +
        // panel grafik
        '<rect x="34" y="82" width="132" height="76" rx="14" fill="url(#' + p + 'cd)" stroke="' + LINE + '" stroke-width="1.8"/>' +
        '<g stroke="' + LINE + '" stroke-width="1" stroke-dasharray="2 5"><line x1="46" y1="112" x2="154" y2="112"/><line x1="46" y1="136" x2="154" y2="136"/></g>' +
        // garis turun, terputus di tengah
        '<path d="M48 104 L72 98 L92 114" stroke="' + INK + '" stroke-width="3.2" opacity="0.7"/>' +
        '<path d="M108 120 L128 134 L152 146" stroke="url(#' + p + 'dr)" stroke-width="3.2"/>' +
        '<path d="M92 114 L98 122 L94 128 L104 134 L108 120" stroke="var(--danger)" stroke-width="2.4"/>' +
        '<circle cx="152" cy="146" r="4.4" fill="var(--bg-3)" stroke="var(--danger)" stroke-width="2.4"/>' +
        // wajah sedih
        '<g class="il-float">' +
            '<circle cx="100" cy="56" r="26" fill="url(#' + p + 'dr)" stroke="none"/>' +
            '<circle cx="100" cy="56" r="26" fill="url(#' + p + 'gl)" stroke="none" opacity="0.5"/>' +
            '<circle cx="91" cy="52" r="3" fill="#ffffff" stroke="none"/><circle cx="109" cy="52" r="3" fill="#ffffff" stroke="none"/>' +
            '<path d="M89 71 Q100 61 111 71" stroke="#ffffff" stroke-width="3"/>' +
            '<path d="M83 47 L94 42 M117 47 L106 42" stroke="#ffffff" stroke-opacity="0.8" stroke-width="2.4"/>' +
            '<path class="il-twinkle" d="M112 60 Q116 68 112 72 Q108 68 112 60 Z" fill="#ffffff" stroke="none" opacity="0.85"/>' +
        '</g>' +
    '</svg>';
}

// ============================================================
// EXPORTS
// ============================================================
const ILLUSTRATIONS = {
    box:     illustrationBox,
    flask:   illustrationFlask,
    chart:   illustrationChart,
    team:    illustrationTeam,
    chat:    illustrationChat,
    rocket:  illustrationRocket,
    sad:     illustrationSad
};

export function getIllustration(name, size) {
    const fn = ILLUSTRATIONS[name] || ILLUSTRATIONS.rocket;
    const w = size || 140;
    const svg = fn();
    return `<div class="illus-wrap" style="width:${w}px;height:${w}px;">${svg}</div>`;
}

export function getIllustrationNames() {
    return Object.keys(ILLUSTRATIONS);
}
