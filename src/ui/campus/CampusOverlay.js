// FILE: src/ui/campus/CampusOverlay.js
// v2027.60 — panel glass konsisten dengan tampilan 3D (blur + bayangan lembut, mati di mode hemat),
// vinyet halus untuk kedalaman, ikon kartu dengan gradien aksen. API publik TIDAK berubah.
// v2027.44 (Tahap 4) — Lapisan UI di atas peta kampus (DOM murni, tanpa framework):
//  - kartu info bangunan (level, progres, petunjuk, tombol "Buka ..." lewat data-nav)
//  - tombol peta: zoom +, zoom -, reset tampilan
//  - banner "naik level"
// CSS disuntik sekali dari sini, jadi style.css tidak perlu diubah.
var STYLE_ID = 'campus-overlay-style';
var CSS = [
    '.cmp-vig{position:absolute;inset:0;z-index:1;pointer-events:none;',
    'background:radial-gradient(ellipse at 50% 46%,transparent 58%,rgba(15,23,42,.10) 100%);}',
    'html[data-theme="dark"] .cmp-vig{background:radial-gradient(ellipse at 50% 46%,transparent 52%,rgba(0,0,0,.30) 100%);}',
    '.cmp-card{position:absolute;left:8px;right:8px;bottom:8px;max-width:420px;margin:0 auto;z-index:3;',
    'padding:10px 12px 12px;border-radius:16px;background:var(--surface-glass,var(--bg-2,#fff));color:var(--text-primary,#111);',
    '-webkit-backdrop-filter:blur(14px) saturate(1.25);backdrop-filter:blur(14px) saturate(1.25);',
    'border:1px solid var(--border,rgba(0,0,0,.12));box-shadow:0 10px 30px rgba(15,23,42,.20),0 1px 0 rgba(255,255,255,.35) inset;font-size:13px;line-height:1.35;',
    'opacity:0;transform:translateY(12px);pointer-events:none;transition:opacity .2s ease,transform .2s ease;}',
    '.cmp-card.on{opacity:1;transform:none;pointer-events:auto;}',
    '.cmp-head{display:flex;align-items:center;gap:10px;}',
    '.cmp-ico{flex:0 0 auto;width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;',
    'font-size:20px;background:linear-gradient(145deg,var(--accent-soft,rgba(37,99,235,.14)),var(--bg-3,rgba(127,127,127,.10)));',
    'border:1px solid var(--border-subtle,rgba(0,0,0,.08));}',
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
    '.cmp-alert{display:none;margin-top:6px;padding:6px 9px;border-radius:9px;font-size:12px;font-weight:600;line-height:1.3;}',
    '.cmp-alert.warn{display:block;background:rgba(239,68,68,.13);color:#b91c1c;border:1px solid rgba(239,68,68,.35);}',
    '.cmp-alert.info{display:block;background:rgba(245,158,11,.14);color:#92580a;border:1px solid rgba(245,158,11,.35);}',
    'html[data-theme=\"dark\"] .cmp-alert.warn{color:#fca5a5;}html[data-theme=\"dark\"] .cmp-alert.info{color:#fcd34d;}',
    '.cmp-go.sec{background:var(--bg-3,#e5e8ee);color:var(--text-primary,#111);font-weight:500;min-height:34px;margin-top:6px;}',
    '.cmp-go.warn{background:#dc2626;}.cmp-go.info{background:#d97706;}',
    '.cmp-ctl .cmp-al{position:relative;display:none;color:#fff;font-weight:800;font-size:16px;}',
    '.cmp-ctl .cmp-al.on{display:block;}',
    '.cmp-ctl .cmp-al.warn{background:#dc2626;border-color:#dc2626;}.cmp-ctl .cmp-al.info{background:#d97706;border-color:#d97706;}',
    '.cmp-ctl .cmp-al b{position:absolute;top:-5px;right:-5px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;',
    'background:#fff;color:#111;font-size:10px;line-height:16px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,.3);}',
    '.cmp-card.compact .cmp-alert{margin-top:4px;padding:4px 8px;}',
    '.cmp-card.compact{padding:8px 10px 10px;}',
    '.cmp-card.compact .cmp-pips,.cmp-card.compact .cmp-desc{display:none;}',
    '.cmp-card.compact .cmp-ico{width:30px;height:30px;font-size:16px;}',
    '.cmp-ctl{position:absolute;top:8px;right:8px;z-index:3;display:flex;flex-direction:column;gap:6px;}',
    '.cmp-ctl button{width:36px;height:36px;border-radius:11px;border:1px solid var(--border,rgba(0,0,0,.12));',
    'background:var(--surface-glass,var(--bg-2,#fff));color:var(--text-primary,#111);font-size:17px;line-height:1;cursor:pointer;',
    '-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);',
    'box-shadow:var(--shadow-sm,0 2px 8px rgba(15,23,42,.12));opacity:.95;-webkit-tap-highlight-color:transparent;',
    'transition:transform .12s ease,opacity .12s ease;}',
    '.cmp-ctl button:hover{opacity:1;}',
    '.cmp-ctl button:active{transform:scale(.94);}',
    '.cmp-banner{position:absolute;left:50%;top:10px;z-index:4;max-width:calc(100% - 64px);padding:8px 14px;border-radius:12px;',
    'text-align:center;background:var(--bg-2,#fff);color:var(--text-primary,#111);border:1px solid var(--accent,#2563eb);',
    'box-shadow:0 6px 18px rgba(0,0,0,.18);opacity:0;transform:translate(-50%,-14px);pointer-events:none;',
    'transition:opacity .25s ease,transform .25s ease;}',
    '.cmp-banner.on{opacity:1;transform:translate(-50%,0);}',
    '.cmp-banner b{display:block;font-size:13px;}',
    '.cmp-banner span{display:block;font-size:11px;color:var(--text-tertiary,#7a8494);}',
    'html[data-perf="lite"] .cmp-card,html[data-perf="lite"] .cmp-ctl button{-webkit-backdrop-filter:none;backdrop-filter:none;background:var(--bg-2,#fff);}',
    '@media (prefers-reduced-motion:reduce){.cmp-card,.cmp-banner,.cmp-bar i,.cmp-ctl button{transition:none;}}'
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
    var alertEl = el('div', 'cmp-alert');
    var goA = el('button', 'cmp-go'); goA.type = 'button';     // aksi dari alert (utama bila ada)
    var go = el('button', 'cmp-go'); go.type = 'button';       // tombol \"Buka ...\" biasa
    card.appendChild(head); card.appendChild(pips); card.appendChild(bar);
    card.appendChild(hint); card.appendChild(desc); card.appendChild(alertEl);
    card.appendChild(goA); card.appendChild(go);

    // ---------- tombol peta ----------
    var ctl = el('div', 'cmp-ctl');
    var bIn = el('button', '', '+'), bOut = el('button', '', '−'), bReset = el('button', '', '⌂');
    var bAlert = el('button', 'cmp-al'); bAlert.type = 'button';
    var bAlertN = el('b'); bAlert.textContent = '!'; bAlert.appendChild(bAlertN);
    ctl.appendChild(bAlert);
    [bIn, bOut, bReset].forEach(function (b) { b.type = 'button'; ctl.appendChild(b); });

    // ---------- banner ----------
    var banner = el('div', 'cmp-banner');
    var bTitle = el('b'); var bSub = el('span');
    banner.appendChild(bTitle); banner.appendChild(bSub);
    banner.setAttribute('role', 'status');

    var vig = el('div', 'cmp-vig');
    vig.setAttribute('aria-hidden', 'true');
    container.appendChild(vig);
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
    bAlert.addEventListener('click', function () { if (cfg.onAlert) cfg.onAlert(); });

    // Pasang aksi pada tombol lewat atribut data-* (ditangani delegasi klik di main.js).
    var ACT_ATTRS = ['data-nav', 'data-nav-sub', 'data-chip-action'];
    function setAction(btn, label, nav, sub, attrs) {
        ACT_ATTRS.forEach(function (a) { btn.removeAttribute(a); });
        btn.textContent = label + ' →';
        if (nav) btn.setAttribute('data-nav', nav);
        if (sub) btn.setAttribute('data-nav-sub', sub);
        if (attrs) { for (var k in attrs) btn.setAttribute(k, attrs[k]); }
    }
    function setAlertCount(n, warn) {
        bAlert.classList.toggle('on', n > 0);
        bAlert.classList.toggle('warn', n > 0 && !!warn);
        bAlert.classList.toggle('info', n > 0 && !warn);
        bAlertN.textContent = n > 9 ? '9+' : String(n);
    }
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
        var al = info.alert;
        alertEl.className = 'cmp-alert' + (al ? ' ' + al.tone : '');
        alertEl.textContent = al ? (al.tone === 'warn' ? '⚠ ' : '💡 ') + al.text : '';
        if (al && al.action) {
            goA.style.display = '';
            goA.className = 'cmp-go ' + al.tone;
            setAction(goA, al.action.label, al.action.nav, al.action.sub, al.action.attrs);
        } else {
            goA.style.display = 'none';
        }
        if (info.nav) {
            go.style.display = '';
            go.className = 'cmp-go' + (al && al.action ? ' sec' : '');
            setAction(go, info.nav.label, info.nav.view, '', null);
        } else {
            go.style.display = 'none';
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
        setAlertCount: setAlertCount,
        dispose: function () {
            document.removeEventListener('keydown', onKey);
            if (bannerTimer) clearTimeout(bannerTimer);
            [vig, ctl, card, banner].forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
        }
    };
}
