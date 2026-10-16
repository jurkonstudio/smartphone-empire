// FILE: src/ui/icons/GameIcons.js  (BARU)
// ============================================================
// Ikon SVG satu keluarga dengan NavIcons/FeatureIcons (garis 24x24,
// stroke currentColor, ujung bulat). Dipakai untuk Top Up Silicon,
// metode bayar, paket, biaya SIL, dan Asisten Bisnis — menggantikan emoji.
// Warna mengikuti teks/aksen tema, jadi otomatis senada di semua tema.
// ============================================================

export var GAME_ICONS = {
    // ---------- SILICON / PAKET ----------
    'sil':      '<path d="M12 3 20 12 12 21 4 12z"/><path d="M4 12h16"/><path d="m9 7.5 3 4.5 3-4.5"/>',
    'gem-s':    '<path d="M12 3 20 12 12 21 4 12z"/>',
    'gem-m':    '<path d="M12 3 20 12 12 21 4 12z"/><path d="M4 12h16"/>',
    'gem-l':    '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20"/><path d="m8 9 4 12 4-12-4-6z"/>',
    'gem-xl':   '<path d="M6 5h10l4 5-9 10L2 10z"/><path d="M2 10h18"/><path d="M21 2v4M19 4h4"/>',
    'gem-xxl':  '<path d="M6 6h9l4 5-8.5 9L2 11z"/><path d="M2 11h17"/><path d="M20 2v4M18 4h4"/><path d="M5 1.5v2.5M3.75 2.75h2.5"/>',
    'bolt':     '<path d="M13 2 3 14h8l-1 8 10-12h-8z"/>',
    'plus':     '<path d="M12 5v14M5 12h14"/>',

    // ---------- METODE BAYAR ----------
    'wallet':       '<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><path d="M21 11h-4a2 2 0 0 0 0 4h4z"/><path d="M3 7h14"/>',
    'wallet-cards': '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M6 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/><circle cx="16" cy="14" r="1.2"/>',
    'phone-pay':    '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 7h4M10 11h4"/><path d="M12 15v3"/>',
    'bag':          '<path d="M6 7h12l1 13H5z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
    'qr':           '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h3M20 17v4"/>',
    'bank':         '<path d="M3 10 12 4l9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 21h18"/>',
    'card':         '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/>',
    'play-store':   '<path d="M6 3.5v17L20 12z"/>',
    'app-store':    '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m8 16 5-9"/><path d="m11 16 5-9"/><path d="M7 13h10"/>',
    'flask':        '<path d="M9 3h6"/><path d="M10 3v5.6L5.5 17a2.5 2.5 0 0 0 2.2 3.7h8.6a2.5 2.5 0 0 0 2.2-3.7L14 8.6V3"/><path d="M7.5 15h9"/>',

    // ---------- ASISTEN ----------
    'assistant':  '<path d="M12 3a4 4 0 0 0-4 4v1H7a3 3 0 0 0-3 3v5a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-5a3 3 0 0 0-3-3h-1V7a4 4 0 0 0-4-4z"/><path d="M9 13v1.5M15 13v1.5"/><path d="M9.5 18c.7.6 1.6 1 2.5 1s1.8-.4 2.5-1"/>',
    'spark':      '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
    'send':       '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    'cash-alert': '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10v4M18 10v4"/>',
    'cash':       '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10v4M18 10v4"/>',
    'warn':       '<path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
    'package':    '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z"/><path d="m3.5 7.5 8.5 4.5 8.5-4.5"/><path d="M12 12v9"/>',
    'users':      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'palette':    '<path d="M12 22a10 10 0 1 1 10-10c0 3-2.5 3.5-4.5 3.5H15a2 2 0 0 0-1.4 3.4c.8.8.4 3.1-1.6 3.1z"/><circle cx="7.5" cy="11" r="1"/><circle cx="12" cy="7" r="1"/><circle cx="16.5" cy="10" r="1"/>',
    'megaphone':  '<path d="m3 11 15-6v14L3 13z"/><path d="M7 13.5V18a2 2 0 0 0 4 0v-3.5"/><path d="M21 9v6"/>',
    'research':   '<path d="M9 3h6"/><path d="M10 3v5.6L5.5 17a2.5 2.5 0 0 0 2.2 3.7h8.6a2.5 2.5 0 0 0 2.2-3.7L14 8.6V3"/><path d="M7.5 15h9"/>',
    'phone':      '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
    'hourglass':  '<path d="M6 2h12M6 22h12"/><path d="M7 2v4a5 5 0 0 0 2 4l3 2-3 2a5 5 0 0 0-2 4v4"/><path d="M17 2v4a5 5 0 0 1-2 4l-3 2 3 2a5 5 0 0 1 2 4v4"/>',
    'puzzle':     '<path d="M12 3a2 2 0 0 1 2 2v1h4a1 1 0 0 1 1 1v4h-1a2 2 0 0 0 0 4h1v4a1 1 0 0 1-1 1h-4v-1a2 2 0 0 0-4 0v1H6a1 1 0 0 1-1-1v-4h1a2 2 0 0 0 0-4H5V7a1 1 0 0 1 1-1h4V5a2 2 0 0 1 2-2z"/>',
    'bug':        '<rect x="8" y="7" width="8" height="13" rx="4"/><path d="M12 7V4M9 4l1.5 2M15 4l-1.5 2M3 13h5M16 13h5M4 8l4 2M20 8l-4 2M4 19l4-2M20 19l-4-2"/>',
    'factory':    '<path d="M3 21V10l5 3V10l5 3V10l5 3v8Z"/><path d="M3 21h18"/>',
    'mood-low':   '<circle cx="12" cy="12" r="9"/><path d="M8 16c1-1.2 2.4-2 4-2s3 .8 4 2"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    'star':       '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6L3.2 9.4l6.1-.9L12 3Z"/>',
    'check-circle':'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    'compass':    '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    'chart':      '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
    'target':     '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    'arrow-right':'<path d="M5 12h14M13 6l6 6-6 6"/>',
    'help':       '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7"/><path d="M12 17h.01"/>'
};

export function gIcon(id, size, cls) {
    var c = GAME_ICONS[id] || GAME_ICONS.help;
    var s = size || 18;
    return '<svg class="g-ico' + (cls ? ' ' + cls : '') + '" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" ' +
        'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ' +
        'style="display:inline-block;vertical-align:-0.18em;flex-shrink:0" aria-hidden="true">' + c + '</svg>';
}

// Gaya pendukung (disuntik sekali) supaya style.css tidak perlu diganti.
var STYLE_ID = 'game-icons-style';
export function ensureIconStyles() {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent =
        '.sil-pkg-ico,.sil-method-ico{display:inline-flex;align-items:center;justify-content:center;color:var(--accent);}' +
        '.sil-pkg-ico{width:36px;height:36px;border-radius:12px;background:var(--accent-soft);margin-bottom:2px;}' +
        '.sil-method-ico{width:30px;height:30px;border-radius:9px;background:var(--bg-4);color:var(--text-secondary);' +
            'transition:background .15s,color .15s;}' +
        '.sil-method.active .sil-method-ico{background:var(--accent-soft);color:var(--accent);}' +
        '.sil-method.is-soon .sil-method-ico{color:var(--text-tertiary);}' +
        '.sil-radio::after{content:"";position:absolute;inset:2px;border-radius:50%;background:var(--accent);' +
            'transform:scale(0);transition:transform .15s;}' +
        '.sil-method.active .sil-radio::after{transform:scale(1);}' +
        '.g-ico-title{display:inline-flex;align-items:center;gap:6px;}' +
        '.g-ico-title .g-ico{color:var(--accent);}' +
        '.sil-cost .g-ico,.header-silicon-ico .g-ico{vertical-align:-0.2em;}' +
        '.header-silicon-ico{display:inline-flex;align-items:center;color:var(--accent);}' +
        '.advisor-ico{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:10px;' +
            'background:var(--bg-4);color:var(--text-secondary);font-size:0;}' +
        '.advisor-item.sev-critical .advisor-ico{color:var(--danger);background:rgba(239,68,68,.14);}' +
        '.advisor-item.sev-warn .advisor-ico{color:var(--warn);background:rgba(245,158,11,.16);}' +
        '.advisor-item.sev-tip .advisor-ico{color:var(--info);background:var(--accent-soft);}' +
        '.advisor-item.sev-info .advisor-ico{color:var(--success);background:var(--success-soft);}';
    document.head.appendChild(st);
}
