// FILE: src/ui/notifications/NotificationRenderer.js  (REPLACE)
// Dynamic Island v2 — stack 3 notifikasi, antrean halus, swipe untuk menutup,
// jeda saat disentuh/diperluas, progress bar sisa waktu, ikon SVG, i18n,
// penghitung duplikat (x2, x3), dan durasi otomatis menurut panjang pesan.
// CSS di-inject dari file ini sendiri, jadi style.css & index.html TIDAK perlu diubah.

import { t } from '../../core/LanguageService.js';

var MAX_ACTIVE = 3;
var MIN_MS = 2800;
var MAX_MS = 9000;
var PER_CHAR_MS = 45;
var ACTION_MIN_MS = 6000;
var EXPAND_AUTO_COLLAPSE_MS = 8000;
var OUT_MS = 260;
var SWIPE_PX = 56;

var _active = [];

var TYPES = {
    info: {
        rgb: '10,132,255',
        icon: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.8" r=".6" fill="currentColor"/>'
    },
    success: {
        rgb: '52,199,89',
        icon: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/>'
    },
    warning: {
        rgb: '255,159,10',
        icon: '<path d="M12 4l9 16H3z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.2" r=".6" fill="currentColor"/>'
    },
    error: {
        rgb: '255,69,58',
        icon: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>'
    },
    news: {
        rgb: '168,85,247',
        icon: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 12.5h8M8 16h5"/>'
    }
};

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function normalizeType(type) {
    if (type === 'danger') return 'error';
    return TYPES[type] ? type : 'info';
}

function typeLabel(type) {
    var key = 'notif.type.' + type;
    var label = t(key);
    return (!label || label === key) ? type.toUpperCase() : label;
}

function calcDuration(payload, msg) {
    var base = Number(payload.durationMs) || 0;
    var ms = Math.max(base, MIN_MS + msg.length * PER_CHAR_MS);
    if (payload.action) ms = Math.max(ms, ACTION_MIN_MS);
    return Math.min(ms, Math.max(MAX_MS, base));
}

// ------------------------------------------------------------ style

function ensureStyle() {
    if (typeof document === 'undefined' || document.getElementById('ni-style')) return;
    var css = [
        '.toast-container{animation:none!important;gap:8px;',
        'top:calc(max(var(--ni-top,0px),env(safe-area-inset-top,0px)) + 8px)!important;max-height:calc(100vh - var(--ni-top,0px) - 16px);overflow:visible}',
        '.ni{flex:0 0 auto}',
        '.ni.ni-collapse{max-height:0!important;margin-top:0!important;margin-bottom:-8px!important;padding-top:0!important;',
        'padding-bottom:0!important;border-width:0!important;box-shadow:none!important;',
        'transition:max-height .26s ease,margin .26s ease,padding .26s ease,border-width .26s ease,opacity .24s ease,transform .24s ease}',
        '.ni{position:relative;box-sizing:border-box;width:100%;max-width:calc(100vw - 24px);margin:0 auto;',
        '--ni-rgb:10,132,255;background:rgba(12,12,14,.94);-webkit-backdrop-filter:blur(18px) saturate(1.4);',
        'backdrop-filter:blur(18px) saturate(1.4);color:#fff;border-radius:22px;padding:9px 10px 12px 10px;',
        'border:1px solid rgba(255,255,255,.08);',
        'box-shadow:0 10px 28px rgba(0,0,0,.45),0 0 0 1px rgba(var(--ni-rgb),.18);',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;cursor:pointer;overflow:hidden;',
        'touch-action:none;user-select:none;-webkit-user-select:none;outline:none;',
        'animation:niIn .38s cubic-bezier(.34,1.4,.64,1);',
        'transition:border-radius .3s ease,transform .24s ease,opacity .24s ease;will-change:transform,opacity}',
        '.ni:focus-visible{box-shadow:0 0 0 2px rgba(var(--ni-rgb),.9)}',
        '.ni.ni-drag{transition:none}',
        '.ni.ni-out{opacity:0!important;pointer-events:none}',
        '.ni.ni-expanded{border-radius:18px;padding-bottom:14px}',
        '.ni.ni-bump{animation:niBump .28s ease}',
        '.ni-row{display:flex;align-items:center;gap:10px}',
        '.ni.ni-expanded .ni-row{align-items:flex-start}',
        '.ni-ico{flex:0 0 auto;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;',
        'justify-content:center;background:rgba(var(--ni-rgb),.18);color:rgb(var(--ni-rgb))}',
        '.ni-ico svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;',
        'stroke-linecap:round;stroke-linejoin:round}',
        '.ni-body{flex:1;min-width:0}',
        '.ni-title{display:none;font-size:10.5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;',
        'color:rgb(var(--ni-rgb));margin-bottom:2px}',
        '.ni.ni-expanded .ni-title{display:block}',
        '.ni-msg{font-size:13px;line-height:1.4;font-weight:500;overflow:hidden;display:-webkit-box;',
        '-webkit-box-orient:vertical;-webkit-line-clamp:1;word-break:break-word}',
        '.ni.ni-expanded .ni-msg{display:block;-webkit-line-clamp:unset}',
        '.ni-count{flex:0 0 auto;font-size:11px;font-weight:700;padding:2px 7px;border-radius:10px;',
        'background:rgba(var(--ni-rgb),.22);color:rgb(var(--ni-rgb))}',
        '.ni-action{flex:0 0 auto;min-height:32px;padding:0 14px;border:0;border-radius:16px;',
        'background:rgb(var(--ni-rgb));color:#fff;font:700 12px -apple-system,sans-serif;cursor:pointer;',
        'transition:transform .12s ease,filter .15s}',
        '.ni-action:hover{filter:brightness(1.1)}',
        '.ni-action:active{transform:scale(.94)}',
        '.ni-close{display:none;flex:0 0 auto;width:26px;height:26px;border:0;border-radius:50%;',
        'background:rgba(255,255,255,.1);color:#fff;font-size:15px;line-height:1;cursor:pointer;',
        'align-items:center;justify-content:center}',
        '.ni.ni-expanded .ni-close{display:flex}',
        '.ni-bar{position:absolute;left:14px;right:14px;bottom:4px;height:2px;border-radius:2px;',
        'background:rgba(255,255,255,.08);overflow:hidden}',
        '.ni-bar i{display:block;height:100%;background:rgb(var(--ni-rgb));transform-origin:left;transform:scaleX(1)}',
        '.ni-bar i.ni-run{animation:niBar var(--ni-dur,4000ms) linear forwards}',
        '.ni.ni-paused .ni-bar i{animation-play-state:paused}',
        '@keyframes niIn{from{opacity:0;transform:translateY(-14px) scale(.92)}to{opacity:1;transform:none}}',
        '@keyframes niBump{0%{transform:scale(1)}40%{transform:scale(1.04)}100%{transform:scale(1)}}',
        '@keyframes niBar{from{transform:scaleX(1)}to{transform:scaleX(0)}}',
        '@media (max-width:380px){.ni-msg{font-size:12px}.ni-action{padding:0 11px}}',
        '@media (prefers-reduced-motion:reduce){.ni,.ni.ni-bump{animation:none}.ni{transition:none}',
        '.ni-bar i.ni-run{animation-duration:0s}}'
    ].join('');
    var el = document.createElement('style');
    el.id = 'ni-style';
    el.textContent = css;
    document.head.appendChild(el);
}

// ------------------------------------------------------------ posisi

function updateTop(container) {
    var h = document.getElementById('app-header');
    var top = 0;
    if (h) {
        var r = h.getBoundingClientRect();
        if (r.height > 0) top = Math.max(0, Math.round(r.bottom));
    }
    container.style.setProperty('--ni-top', top + 'px');
}

var _resizeBound = false;

// ------------------------------------------------------------ timer

function startTimer(entry, ms) {
    clearTimeout(entry.timer);
    entry.remaining = ms;
    entry.t0 = Date.now();
    entry.paused = false;
    entry.node.classList.remove('ni-paused');
    entry.timer = setTimeout(function () { removeEntry(entry, 'up'); }, ms);

    var bar = entry.bar;
    bar.classList.remove('ni-run');
    void bar.offsetWidth;
    entry.node.style.setProperty('--ni-dur', ms + 'ms');
    bar.classList.add('ni-run');
}

function pause(entry) {
    if (entry.paused || entry.gone) return;
    clearTimeout(entry.timer);
    entry.remaining = Math.max(400, entry.remaining - (Date.now() - entry.t0));
    entry.paused = true;
    entry.node.classList.add('ni-paused');
}

function resume(entry) {
    if (!entry.paused || entry.gone || entry.expanded) return;
    entry.paused = false;
    entry.node.classList.remove('ni-paused');
    entry.t0 = Date.now();
    clearTimeout(entry.timer);
    entry.timer = setTimeout(function () { removeEntry(entry, 'up'); }, entry.remaining);
}

// ------------------------------------------------------------ lifecycle

function removeEntry(entry, dir) {
    if (entry.gone) return;
    entry.gone = true;
    clearTimeout(entry.timer);
    clearTimeout(entry.collapseTimer);
    var i = _active.indexOf(entry);
    if (i >= 0) _active.splice(i, 1);

    var n = entry.node;
    n.classList.remove('ni-drag');
    n.classList.add('ni-out');
    n.style.transform = dir === 'left' ? 'translateX(-110%)'
        : dir === 'right' ? 'translateX(110%)'
        : 'translateY(-24px) scale(.94)';
    n.style.maxHeight = n.offsetHeight + 'px';
    void n.offsetHeight;
    n.classList.add('ni-collapse');
    setTimeout(function () {
        if (n.parentNode) n.parentNode.removeChild(n);
    }, OUT_MS + 40);
}

function setExpanded(entry, on) {
    entry.expanded = on;
    entry.node.classList.toggle('ni-expanded', on);
    entry.node.setAttribute('aria-expanded', on ? 'true' : 'false');
    clearTimeout(entry.collapseTimer);
    if (on) {
        pause(entry);
        entry.collapseTimer = setTimeout(function () {
            if (!entry.gone) setExpanded(entry, false);
        }, EXPAND_AUTO_COLLAPSE_MS);
    } else {
        resume(entry);
    }
}

function bindGestures(entry) {
    var n = entry.node;
    var sx = 0, sy = 0, dx = 0, dy = 0, down = false, moved = false, pid = null;

    n.addEventListener('pointerdown', function (e) {
        if (e.target && e.target.closest && e.target.closest('.ni-action,.ni-close')) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        down = true; moved = false; dx = 0; dy = 0;
        sx = e.clientX; sy = e.clientY; pid = e.pointerId;
        try { n.setPointerCapture(pid); } catch (err) {}
        pause(entry);
    });

    n.addEventListener('pointermove', function (e) {
        if (!down) return;
        dx = e.clientX - sx;
        dy = e.clientY - sy;
        if (!moved && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        moved = true;
        n.classList.add('ni-drag');
        var ty = Math.min(0, dy);
        n.style.transform = 'translate(' + dx + 'px,' + ty + 'px)';
        n.style.opacity = String(Math.max(0.35, 1 - Math.max(Math.abs(dx) / 220, Math.abs(ty) / 90)));
    });

    function end(cancelled) {
        if (!down) return;
        down = false;
        try { n.releasePointerCapture(pid); } catch (err) {}
        n.classList.remove('ni-drag');
        if (moved) {
            if (!cancelled && Math.abs(dx) >= SWIPE_PX) { removeEntry(entry, dx < 0 ? 'left' : 'right'); return; }
            if (!cancelled && dy <= -SWIPE_PX / 1.5) { removeEntry(entry, 'up'); return; }
            n.style.transform = '';
            n.style.opacity = '';
            resume(entry);
        } else if (!cancelled) {
            setExpanded(entry, !entry.expanded);
        } else {
            resume(entry);
        }
    }

    n.addEventListener('pointerup', function () { end(false); });
    n.addEventListener('pointercancel', function () { end(true); });

    // Hover pause khusus mouse (di layar sentuh tidak dipakai agar tidak "nyangkut")
    n.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') pause(entry); });
    n.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') resume(entry); });

    n.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(entry, !entry.expanded); }
        else if (e.key === 'Escape') { removeEntry(entry, 'up'); }
    });
}

function bumpEntry(entry, payload, msg) {
    entry.count++;
    var badge = entry.node.querySelector('.ni-count');
    badge.textContent = '\u00d7' + entry.count;
    badge.style.display = '';
    entry.node.classList.remove('ni-bump');
    void entry.node.offsetWidth;
    entry.node.classList.add('ni-bump');
    if (!entry.expanded) startTimer(entry, calcDuration(payload, msg));
}

// ------------------------------------------------------------ public API

export function renderNotification(container, payload) {
    if (!container || !payload) return;
    ensureStyle();
    updateTop(container);
    if (!_resizeBound) {
        _resizeBound = true;
        window.addEventListener('resize', function () { updateTop(container); });
    }

    var type = normalizeType(payload.type);
    var msg = String(payload.message || '');
    if (!msg) return;

    // Pesan sama masih tampil -> naikkan penghitung, jangan dobel kartu
    for (var i = 0; i < _active.length; i++) {
        if (_active[i].type === type && _active[i].msg === msg && !_active[i].gone) {
            bumpEntry(_active[i], payload, msg);
            return;
        }
    }

    // Batasi jumlah kartu: yang paling lama keluar dengan animasi
    while (_active.length >= MAX_ACTIVE) removeEntry(_active[0], 'up');

    var meta = TYPES[type];
    var label = typeLabel(type);

    var node = document.createElement('div');
    node.className = 'ni ni-' + type;
    node.setAttribute('role', (type === 'error' || type === 'warning') ? 'alert' : 'status');
    node.setAttribute('tabindex', '0');
    node.setAttribute('aria-expanded', 'false');
    node.style.setProperty('--ni-rgb', meta.rgb);
    node.innerHTML =
        '<div class="ni-row">' +
            '<span class="ni-ico"><svg viewBox="0 0 24 24" aria-hidden="true">' + meta.icon + '</svg></span>' +
            '<div class="ni-body">' +
                '<div class="ni-title">' + escapeHtml(label) + '</div>' +
                '<div class="ni-msg">' + escapeHtml(msg) + '</div>' +
            '</div>' +
            '<span class="ni-count" style="display:none"></span>' +
            '<button type="button" class="ni-close" aria-label="' + escapeHtml(t('notif.close')) + '">\u00d7</button>' +
        '</div>' +
        '<div class="ni-bar"><i></i></div>';

    var entry = {
        node: node, bar: node.querySelector('.ni-bar i'),
        type: type, msg: msg, count: 1,
        timer: null, collapseTimer: null,
        remaining: 0, t0: 0,
        paused: false, expanded: false, gone: false
    };

    // Tombol aksi (mis. "Baca" pada berita) langsung terlihat tanpa perlu expand
    if (payload.action && typeof payload.action.onClick === 'function') {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ni-action';
        btn.textContent = payload.action.label || t('notif.action.open');
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            try { payload.action.onClick(); }
            catch (err) { console.error('[Notif] action error:', err); }
            removeEntry(entry, 'up');
        });
        node.querySelector('.ni-row').insertBefore(btn, node.querySelector('.ni-close'));
    }

    node.querySelector('.ni-close').addEventListener('click', function (e) {
        e.stopPropagation();
        removeEntry(entry, 'up');
    });

    bindGestures(entry);
    container.appendChild(node);
    _active.push(entry);
    startTimer(entry, calcDuration(payload, msg));
}

export function clearNotifications() {
    _active.slice().forEach(function (e) { removeEntry(e, 'up'); });
}

export function getActiveRendererIdPublic() {
    return 'dynamic_island';
}
