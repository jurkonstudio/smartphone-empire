// FILE: src/ui/campus/CampusOverlay.js
// v2027.44 (Tahap 4) — Lapisan UI di atas peta kampus (DOM murni, tanpa framework):
//  - kartu info bangunan (level, progres, petunjuk, tombol "Buka ..." lewat data-nav)
//  - tombol peta: zoom +, zoom -, reset tampilan
//  - banner "naik level"
// CSS disuntik sekali dari sini, jadi style.css tidak perlu diubah.
var STYLE_ID = 'campus-overlay-style';
var CSS = [
    '.cmp-card{position:absolute;left:8px;right:8px;bottom:8px;max-width:420px;margin:0 auto;z-index:3;',
    'padding:10px 12px 12px;border-radius:14px;background:var(--bg-2,#fff);color:var(--text-primary,#111);',
    'border:1px solid var(--border,rgba(0,0,0,.12));box-shadow:0 8px 24px rgba(0,0,0,.18);font-size:13px;line-height:1.35;',
    'opacity:0;transform:translateY(12px);pointer-events:none;transition:opacity .2s ease,transform .2s ease;}',
    '.cmp-card.on{opacity:1;transform:none;pointer-events:auto;}',
    '.cmp-head{display:flex;align-items:center;gap:10px;}',
    '.cmp-ico{flex:0 0 auto;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;',
    'font-size:20px;background:var(--accent-soft,rgba(37,99,235,.14));}',
    '.cmp-titles{flex:1 1 auto;min-width:0;}',
    '.cmp-name{font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.cmp-sub{font-size:11px;color:var(--text-tertiary,#7a8494);}',
    '.cmp-x{flex:0 0 auto;width:32px;height:32px;border-radius:50%;border:0;background:var(--bg-3,#e5e8ee);',
    'color:var(--text-secondary,#4a5260);font-size:18px;line-height:1;cursor:pointer;-webkit-tap-highlight-color:transparent;}',
    '.cmp-pips{display:flex;gap:4px;margin:8px 0 6px;}',
    '.cmp-pips i{flex:1 1 0;height:5px;border-radius:3px;background:var(--bg-4,#d0d5dd);}',
    '.cmp-pips i.on{background:var(--accent,#2563eb);}',
    '.cmp-bar{height:7px;border-radius:4px;background:var(--bg-4,#d0d5dd);overflow:hidden;margin:6px 0;}',
    '.cmp-bar i{display:block;height:100%;width:0;border-radius:inherit;background:var(--accent,#2563eb);transition:width .35s ease;}',
    '.cmp-card.max .cmp-bar i{background:linear-gradient(90deg,#e0b445,#f5d77a);}',
    '.cmp-hint{font-size:12px;color:var(--text-secondary,#4a5260);}',
    '.cmp-desc{font-size:11px;color:var(--text-tertiary,#7a8494);margin-top:2px;}',
    '.cmp-go{margin-top:8px;width:100%;min-height:40px;border:0;border-radius:10px;background:var(--accent,#2563eb);',
    'color:#fff;font-weight:600;font-size:13px;cursor:pointer;-webkit-tap-highlight-color:transparent;}',
    '.cmp-card.compact{padding:8px 10px 10px;}',
    '.cmp-card.compact .cmp-pips,.cmp-card.compact .cmp-desc{display:none;}',
    '.cmp-card.compact .cmp-ico{width:30px;height:30px;font-size:16px;}',
    '.cmp-ctl{position:absolute;top:8px;right:8px;z-index:3;display:flex;flex-direction:column;gap:6px;}',
    '.cmp-ctl button{width:36px;height:36px;border-radius:10px;border:1px solid var(--border,rgba(0,0,0,.12));',
    'background:var(--bg-2,#fff);color:var(--text-primary,#111);font-size:17px;line-height:1;cursor:pointer;',
    'box-shadow:var(--shadow-sm,0 1px 2px rgba(0,0,0,.1));opacity:.92;-webkit-tap-highlight-color:transparent;}',
    '.cmp-ctl button:active{transform:scale(.94);}',
    '.cmp-banner{position:absolute;left:50%;top:10px;z-index:4;max-width:calc(100% - 64px);padding:8px 14px;border-radius:12px;',
    'text-align:center;background:var(--bg-2,#fff);color:var(--text-primary,#111);border:1px solid var(--accent,#2563eb);',
    'box-shadow:0 6px 18px rgba(0,0,0,.18);opacity:0;transform:translate(-50%,-14px);pointer-events:none;',
    'transition:opacity .25s ease,transform .25s ease;}',
    '.cmp-banner.on{opacity:1;transform:translate(-50%,0);}',
    '.cmp-banner b{display:block;font-size:13px;}',
    '.cmp-banner span{display:block;font-size:11px;color:var(--text-tertiary,#7a8494);}',
    '@media (prefers-reduced-motion:reduce){.cmp-card,.cmp-banner,.cmp-bar i{transition:none;}}'
].join('');

function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
}
function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
}

// cfg: { onClose(), onReset(), onZoom(dir) }  dir: +1 / -1
export function createCampusOverlay(container, cfg) {
    ensureStyle();

    // ---------- kartu info ----------
    var card = el('div', 'cmp-card');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-live', 'polite');
    var ico = el('div', 'cmp-ico');
    var name = el('div', 'cmp-name');
    var sub = el('div', 'cmp-sub');
    var titles = el('div', 'cmp-titles'); titles.appendChild(name); titles.appendChild(sub);
    var x = el('button', 'cmp-x', '×'); x.type = 'button';
    var head = el('div', 'cmp-head'); head.appendChild(ico); head.appendChild(titles); head.appendChild(x);
    var pips = el('div', 'cmp-pips');
    var bar = el('div', 'cmp-bar'); var fill = el('i'); bar.appendChild(fill);
    var hint = el('div', 'cmp-hint');
    var desc = el('div', 'cmp-desc');
    var go = el('button', 'cmp-go'); go.type = 'button';
    card.appendChild(head); card.appendChild(pips); card.appendChild(bar);
    card.appendChild(hint); card.appendChild(desc); card.appendChild(go);

    // ---------- tombol peta ----------
    var ctl = el('div', 'cmp-ctl');
    var bIn = el('button', '', '+'), bOut = el('button', '', '−'), bReset = el('button', '', '⌂');
    [bIn, bOut, bReset].forEach(function (b) { b.type = 'button'; ctl.appendChild(b); });

    // ---------- banner ----------
    var banner = el('div', 'cmp-banner');
    var bTitle = el('b'); var bSub = el('span');
    banner.appendChild(bTitle); banner.appendChild(bSub);
    banner.setAttribute('role', 'status');

    container.appendChild(ctl);
    container.appendChild(card);
    container.appendChild(banner);

    var lastSig = '';
    var open = false;
    var bannerTimer = null;
    var compact = false;

    function onKey(e) { if (e.key === 'Escape' && open) { hideCard(); if (cfg.onClose) cfg.onClose(); } }
    function stop(e) { e.stopPropagation(); }

    x.addEventListener('click', function () { hideCard(); if (cfg.onClose) cfg.onClose(); });
    bIn.addEventListener('click', function () { if (cfg.onZoom) cfg.onZoom(1); });
    bOut.addEventListener('click', function () { if (cfg.onZoom) cfg.onZoom(-1); });
    bReset.addEventListener('click', function () { if (cfg.onReset) cfg.onReset(); });
    // Sentuhan di atas kartu/tombol tidak boleh ikut menggeser peta.
    [card, ctl, banner].forEach(function (n) { n.addEventListener('pointerdown', stop); });

    function showCard(info) {
        if (!info) { hideCard(); return; }
        if (!open) { document.addEventListener('keydown', onKey); }
        open = true;
        card.classList.add('on');
        if (info.sig === lastSig) return;
        lastSig = info.sig;
        ico.textContent = info.icon;
        name.textContent = info.name;
        sub.textContent = info.levelText;
        hint.textContent = info.hint;
        desc.textContent = info.desc;
        card.classList.toggle('max', !!info.maxed);
        pips.style.display = info.hasLevels ? '' : 'none';
        bar.style.display = info.hasLevels ? '' : 'none';
        hint.style.display = info.hint ? '' : 'none';
        if (info.hasLevels) {
            while (pips.childNodes.length > info.max) pips.removeChild(pips.lastChild);
            while (pips.childNodes.length < info.max) pips.appendChild(el('i'));
            for (var i = 0; i < pips.childNodes.length; i++) {
                pips.childNodes[i].className = i < info.level ? 'on' : '';
            }
            fill.style.width = Math.round(info.pct * 100) + '%';
        }
        if (info.nav) {
            go.style.display = '';
            go.textContent = info.nav.label + ' →';
            go.setAttribute('data-nav', info.nav.view);   // ditangani delegasi klik di main.js
        } else {
            go.style.display = 'none';
            go.removeAttribute('data-nav');
        }
    }

    function hideCard() {
        if (!open) return;
        open = false;
        lastSig = '';
        card.classList.remove('on');
        document.removeEventListener('keydown', onKey);
    }

    function showBanner(title, subtitle) {
        bTitle.textContent = title;
        bSub.textContent = subtitle || '';
        bSub.style.display = subtitle ? '' : 'none';
        banner.classList.add('on');
        if (bannerTimer) clearTimeout(bannerTimer);
        bannerTimer = setTimeout(function () { banner.classList.remove('on'); }, 3200);
    }

    function setLabels(L) {
        x.setAttribute('aria-label', L.close);
        bIn.setAttribute('aria-label', L.zin);
        bOut.setAttribute('aria-label', L.zout);
        bReset.setAttribute('aria-label', L.reset);
        bReset.title = L.reset;
    }

    function setCompact(v) {
        v = !!v;
        if (v === compact) return;
        compact = v;
        card.classList.toggle('compact', v);
    }

    return {
        showCard: showCard,
        hideCard: hideCard,
        isOpen: function () { return open; },
        forceRefresh: function () { lastSig = ''; },
        showBanner: showBanner,
        setLabels: setLabels,
        setCompact: setCompact,
        dispose: function () {
            document.removeEventListener('keydown', onKey);
            if (bannerTimer) clearTimeout(bannerTimer);
            [ctl, card, banner].forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
        }
    };
}
