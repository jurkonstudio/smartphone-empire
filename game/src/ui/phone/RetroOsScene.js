// FILE: src/ui/phone/RetroOsScene.js  (BARU)
// ============================================================
// Adegan "komputer jadul + ponsel" untuk era 2000-2002 (mode mono).
//   - Monitor CRT beige menampilkan terminal (status OS / progres FIX & SETUP).
//   - Ponsel di meja tersambung kabel data ke komputer.
//   - Di LCD ponsel: idle = info OS · proses = bar progres · selesai = TICK (centang).
// Dipakai oleh OsScreenMockup.renderOsScreenMockup (hanya saat mode === 'mono').
// info: { name, version, bugs, screen:'patch'|'update'|undefined, progress, bugName,
//         toVersion, done:'patch'|'update'|undefined }
// ============================================================
import { escapeHtml } from '../../utils/html.js';
import { LanguageService } from '../../core/LanguageService.js';
import { phoneClockText } from './PhoneMockup.js';

function L(idText, enText) {
    var en = false;
    try { en = LanguageService.getLang() === 'en'; } catch (e) {}
    return escapeHtml(en ? enText : idText);
}
function clip(s, n) { return escapeHtml(String(s || '').slice(0, n)); }

var _styled = false;
function ensureStyle() {
    if (_styled || typeof document === 'undefined') return;
    _styled = true;
    var s = document.createElement('style');
    s.setAttribute('data-retro-os', '');
    s.textContent = '.os-screen-retro { border-radius: 12px; background: #141a28; }';
    document.head.appendChild(s);
}

export function renderRetroOsScene(info, size) {
    ensureStyle();
    info = info || {};
    var W = 240, H = 200;
    var width = Math.round((size || 100) * 1.7);
    var height = Math.round(width * H / W);
    var u = 'rt' + Math.random().toString(36).slice(2, 7);

    var kind = info.screen === 'patch' || info.screen === 'update' ? info.screen : null;
    var done = !kind && (info.done === 'patch' || info.done === 'update') ? info.done : null;
    var running = !!kind;
    var pct = Math.max(0, Math.min(100, Math.round(info.progress || 0)));

    var INK = '#1c2a10', LCD = '#8ca66a', CRT = '#7cfc9a';
    var svg = '';

    // ---------- defs ----------
    svg += '<defs>' +
        '<linearGradient id="' + u + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#242c42"/><stop offset="1" stop-color="#161b2a"/></linearGradient>' +
        '<linearGradient id="' + u + 'd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4a30"/><stop offset="1" stop-color="#46301f"/></linearGradient>' +
        '<linearGradient id="' + u + 'b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2dcc4"/><stop offset="1" stop-color="#c2bba0"/></linearGradient>' +
        '<radialGradient id="' + u + 'c" cx="0.5" cy="0.45" r="0.7"><stop offset="0" stop-color="#14301c"/><stop offset="1" stop-color="#06100a"/></radialGradient>' +
        '<path id="' + u + 'p" d="M193 144 C193 166 150 160 112 136"/>' +
        '</defs>';

    // ---------- ruangan ----------
    svg += '<rect width="' + W + '" height="' + H + '" fill="url(#' + u + 'w)"/>';
    svg += '<rect x="0" y="138" width="' + W + '" height="' + (H - 138) + '" fill="url(#' + u + 'd)"/>' +
        '<rect x="0" y="138" width="' + W + '" height="2" fill="#8a6644" opacity="0.7"/>';

    // ---------- monitor CRT ----------
    svg += '<rect x="14" y="16" width="134" height="104" rx="9" fill="url(#' + u + 'b)" stroke="#9c957c" stroke-width="1"/>';
    svg += '<rect x="22" y="24" width="118" height="84" rx="8" fill="#a7a088"/>';
    svg += '<rect x="25" y="27" width="112" height="78" rx="7" fill="url(#' + u + 'c)"/>';
    // scanline
    for (var y = 28; y < 104; y += 3) svg += '<rect x="25" y="' + y + '" width="112" height="1" fill="#000" opacity="0.18"/>';
    // led & tombol
    svg += '<circle cx="132" cy="113" r="1.8" fill="' + (running ? '#ffb020' : '#3ddc6b') + '">' +
        (running ? '<animate attributeName="opacity" values="1;0.2;1" dur="0.7s" repeatCount="indefinite"/>' : '') + '</circle>' +
        '<rect x="116" y="112" width="8" height="3" rx="1.5" fill="#8d866f"/>';
    // leher + dasar
    svg += '<path d="M60 120 H102 L108 130 H54 Z" fill="#c9c2a8"/><rect x="44" y="129" width="74" height="8" rx="3" fill="#b8b198"/>';

    // ---------- teks terminal ----------
    var T = function (x, yy, txt, extra) {
        return '<text x="' + x + '" y="' + yy + '" font-size="6" font-family="Courier New, monospace" fill="' + CRT + '" ' + (extra || '') + '>' + txt + '</text>';
    };
    var tx = 31;
    if (running) {
        svg += T(tx, 40, 'C:\\&gt; ' + (kind === 'patch' ? 'FIX.EXE' : 'SETUP.EXE'));
        svg += T(tx, 50, clip(kind === 'patch' ? info.bugName : ((info.version ? info.version + ' -> ' : '') + (info.toVersion || '')), 22), 'opacity="0.85"');
        var n = 16, bw = 100, sw = bw / n;
        svg += '<rect x="' + (tx - 1) + '" y="60" width="' + (bw + 2) + '" height="10" fill="none" stroke="' + CRT + '" stroke-width="0.8"/>';
        for (var i = 0; i < n; i++) if ((i + 1) / n * 100 <= pct + 3) svg += '<rect x="' + (tx + i * sw + 0.6) + '" y="61.8" width="' + (sw - 1.2) + '" height="6.4" fill="' + CRT + '"/>';
        svg += T(tx, 84, pct + '%', 'font-weight="700"');
        svg += T(tx + 28, 84, kind === 'patch' ? L('Memperbaiki...', 'Fixing...') : L('Memasang...', 'Installing...'), 'opacity="0.8"');
        svg += '<text x="' + tx + '" y="98" font-size="6" font-family="Courier New, monospace" fill="' + CRT + '">_<animate attributeName="opacity" values="1;0;1" dur="0.9s" repeatCount="indefinite"/></text>';
    } else if (done) {
        svg += T(tx, 40, 'C:\\&gt; ' + (done === 'patch' ? 'FIX.EXE' : 'SETUP.EXE'));
        svg += T(tx, 54, '[OK] ' + (done === 'patch' ? L('BUG DIPERBAIKI', 'BUG FIXED') : L('SISTEM DIPERBARUI', 'SYSTEM UPDATED')), 'font-weight="700"');
        svg += '<path d="M' + (tx + 2) + ' 76 L' + (tx + 11) + ' 85 L' + (tx + 28) + ' 64" fill="none" stroke="' + CRT + '" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="46"><animate attributeName="stroke-dashoffset" from="46" to="0" dur="0.6s" fill="freeze"/></path>';
        svg += T(tx, 98, 'C:\\&gt; _');
    } else {
        svg += T(tx, 40, 'C:\\&gt; OS.SYS');
        svg += T(tx, 52, 'OS   ' + clip(info.name, 14));
        svg += T(tx, 62, 'VER  ' + clip(info.version || '-', 12));
        svg += T(tx, 72, 'BUG  ' + (info.bugs || 0), (info.bugs || 0) > 0 ? 'fill="#ffb020"' : '');
        svg += T(tx, 98, 'C:\\&gt; _');
    }

    // ---------- keyboard ----------
    svg += '<rect x="24" y="143" width="102" height="16" rx="3" fill="#cfc8ae" stroke="#9c957c" stroke-width="0.8"/>';
    for (var r = 0; r < 3; r++) for (var k = 0; k < 15; k++) svg += '<rect x="' + (27 + k * 6.4) + '" y="' + (145 + r * 4.6) + '" width="5" height="3.4" rx="0.8" fill="#8d866f"/>';

    // ---------- kabel data ----------
    svg += '<use href="#' + u + 'p" fill="none" stroke="#2b2b2b" stroke-width="1.6" stroke-linecap="round"/>';
    if (running) svg += '<circle r="2" fill="' + CRT + '"><animateMotion dur="1.2s" repeatCount="indefinite"><mpath href="#' + u + 'p"/></animateMotion></circle>';

    // ---------- ponsel ----------
    svg += '<rect x="190" y="38" width="3" height="14" rx="1.5" fill="#2a3040"/>';                // antena
    svg += '<rect x="168" y="48" width="48" height="96" rx="10" fill="#38425a" stroke="#1b2130" stroke-width="1.2"/>';
    svg += '<rect x="170" y="50" width="44" height="92" rx="8" fill="none" stroke="#fff" stroke-opacity="0.08"/>';
    svg += '<rect x="176" y="58" width="36" height="36" rx="2.5" fill="' + LCD + '" stroke="#26331a" stroke-width="1"/>';
    for (var ly = 59; ly < 93; ly += 2.4) svg += '<rect x="176" y="' + ly + '" width="36" height="0.5" fill="#000" opacity="0.09"/>';
    // keypad
    svg += '<ellipse cx="192" cy="103" rx="7" ry="3.4" fill="#2a3040" stroke="#566079" stroke-width="0.6"/>';
    for (var kr = 0; kr < 3; kr++) for (var kc = 0; kc < 3; kc++)
        svg += '<rect x="' + (178 + kc * 11) + '" y="' + (111 + kr * 8) + '" width="8.4" height="5.6" rx="2" fill="#7e89a3" opacity="0.85"/>';
    svg += '<rect x="186" y="136" width="12" height="3" rx="1.5" fill="#1b2130"/>';

    // ---------- isi LCD ponsel ----------
    var F = 'font-family="Courier New, monospace" fill="' + INK + '"';
    if (done) {
        svg += '<circle cx="194" cy="74" r="14" fill="' + INK + '" opacity="0.10"><animate attributeName="r" values="10;16;14" dur="0.6s" fill="freeze"/></circle>';
        svg += '<path d="M185 74 L191 80 L203 65" fill="none" stroke="' + INK + '" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="30">' +
            '<animate attributeName="stroke-dashoffset" from="30" to="0" dur="0.5s" fill="freeze"/></path>';
        svg += '<text x="194" y="90" text-anchor="middle" font-size="5" font-weight="700" ' + F + '>' + (done === 'patch' ? 'FIXED' : 'UPDATED') + '</text>';
    } else if (running) {
        svg += '<text x="194" y="67" text-anchor="middle" font-size="5.6" font-weight="700" ' + F + '>' + (kind === 'patch' ? 'FIX BUG' : 'UPDATE') + '</text>';
        var segs = 8, sx = 179, sww = 30 / segs;
        svg += '<rect x="' + (sx - 1) + '" y="72" width="32" height="8" fill="none" stroke="' + INK + '" stroke-width="0.8"/>';
        for (var j = 0; j < segs; j++) if ((j + 1) / segs * 100 <= pct + 6) svg += '<rect x="' + (sx + j * sww + 0.4) + '" y="73.4" width="' + (sww - 0.8) + '" height="5.2" fill="' + INK + '"/>';
        svg += '<text x="194" y="90" text-anchor="middle" font-size="6" font-weight="700" ' + F + '>' + pct + '%</text>';
    } else {
        svg += '<text x="179" y="65" font-size="4.4" ' + F + '>' + phoneClockText() + '</text><text x="209" y="65" text-anchor="end" font-size="4.4" ' + F + '>▮▮▮</text>';
        svg += '<text x="194" y="77" text-anchor="middle" font-size="6" font-weight="700" ' + F + '>' + clip(info.name, 8) + '</text>';
        svg += '<text x="194" y="85" text-anchor="middle" font-size="4.6" ' + F + '>' + clip(info.version || '-', 10) + '</text>';
        svg += '<text x="194" y="92" text-anchor="middle" font-size="4" ' + F + ' opacity="0.7">' + L('Siap', 'Ready') + '</text>';
    }

    return '<div class="os-screen-wrap os-screen-retro' + (kind ? ' os-screen-' + kind : '') + '">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + width + '" height="' + height + '" preserveAspectRatio="xMidYMid meet">' + svg + '</svg></div>';
}
