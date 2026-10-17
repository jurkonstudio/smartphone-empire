// FILE: src/ui/notifications/NotificationRenderer.js  (REPLACE)
// v3.2 — [DEEP GLASSMORPHISM] Menyesuaikan warna, blur, dan border agar persis seperti iCloud.
import { t } from '../../core/LanguageService.js';
import { bus } from '../../core/EventBus.js';

var MAX_ACTIVE = 3;
var MIN_MS = 2800;
var MAX_MS = 9000;
var PER_CHAR_MS = 45;
var ACTION_MIN_MS = 6000;
var EXPAND_AUTO_COLLAPSE_MS = 8000;
var OUT_MS = 260;
var SWIPE_PX = 56;

var _active = [];
var HISTORY_MAX = 50;
var _history = [];
var _unread = 0;
var _histId = 1;
var _panel = null;
var _panelOpen = false;
var _tickTimer = null;

var TYPES = {
    info: { rgb: '10,132,255', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.8" r=".6" fill="currentColor"/>' },
    success: { rgb: '52,199,89', icon: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/>' },
    warning: { rgb: '255,159,10', icon: '<path d="M12 4l9 16H3z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.2" r=".6" fill="currentColor"/>' },
    error: { rgb: '255,69,58', icon: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>' },
    news: { rgb: '168,85,247', icon: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 12.5h8M8 16h5"/>' }
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
        'top:calc(env(safe-area-inset-top,0px) + 8px)!important;max-height:calc(100dvh - 16px);overflow:visible}',
        '.ni{flex:0 0 auto}',
        '.ni.ni-collapse{max-height:0!important;margin-top:0!important;margin-bottom:-8px!important;padding-top:0!important;',
        'padding-bottom:0!important;border-width:0!important;box-shadow:none!important;',
        'transition:max-height .26s ease,margin .26s ease,padding .26s ease,border-width .26s ease,opacity .24s ease,transform .24s ease}',
        
        // --- TOAST NOTIFIKASI (MELAYANG DI ATAS) ---
        '.ni{position:relative;box-sizing:border-box;width:100%;max-width:calc(100vw - 24px);margin:0 auto;',
        '--ni-rgb:10,132,255;',
        'background:rgba(30, 30, 35, 0.75);', /* Lebih transparan seperti iCloud */
        '-webkit-backdrop-filter:blur(24px) saturate(180%);',
        'backdrop-filter:blur(24px) saturate(180%);',
        'color:#fff;border-radius:22px;padding:9px 10px 12px 10px;',
        'border:1px solid rgba(255,255,255,.12);',
        'box-shadow:0 12px 32px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.08);',
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
        
        // --- PANEL NOTIFIKASI (SAAT KLIK NAMA PERUSAHAAN) ---
        // Backdrop di belakang panel
        '.np-backdrop{position:fixed;left:0;right:0;bottom:0;top:var(--np-top,0px);z-index:9998;',
        'background:rgba(0,0,0,.2);', /* Lebih tipis agar game tetap terlihat */
        '-webkit-backdrop-filter:blur(8px);',
        'backdrop-filter:blur(8px);',
        'opacity:0;transition:opacity .2s ease;-webkit-tap-highlight-color:transparent}',
        '.np-backdrop.np-show{opacity:1}',
        
        // Panel utama
        '.np-panel{position:fixed;z-index:9999;left:50%;top:calc(var(--np-top,0px) + 6px);width:min(94vw,420px);',
        'max-height:min(70vh,calc(100dvh - var(--np-top,0px) - 90px));display:flex;flex-direction:column;box-sizing:border-box;',
        'background:rgba(30, 30, 35, 0.7);', /* Kaca transparan */
        '-webkit-backdrop-filter:blur(28px) saturate(200%);',
        'backdrop-filter:blur(28px) saturate(200%);',
        'color:var(--text-primary,#fff);border:1px solid rgba(255,255,255,.12);',
        'border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08);overflow:hidden;',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;',
        'opacity:0;transform:translate(-50%,-10px) scale(.97);transform-origin:top left;',
        'transition:opacity .2s ease,transform .22s cubic-bezier(.34,1.3,.64,1)}',
        '.np-panel.np-show{opacity:1;transform:translate(-50%,0) scale(1)}',
        
        '.np-head{display:flex;align-items:center;gap:8px;padding:12px 14px 10px;border-bottom:1px solid rgba(255,255,255,.08)}',
        '.np-title{flex:1;font-size:15px;font-weight:700;letter-spacing:-.01em}',
        '.np-sub{font-size:11px;font-weight:600;color:var(--text-tertiary,#8e8e93)}',
        '.np-btn{border:0;background:transparent;color:var(--accent,#0a84ff);font:600 12px -apple-system,sans-serif;',
        'padding:6px 8px;border-radius:10px;cursor:pointer}',
        '.np-btn:active{background:rgba(10,132,255,.15)}',
        '.np-btn[disabled]{opacity:.35;pointer-events:none}',
        '.np-list{overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:8px}',
        
        // Kotak item di dalam panel (Efek kaca bertumpuk)
        '.np-item{--ni-rgb:10,132,255;display:flex;align-items:flex-start;gap:10px;padding:12px 10px;border-radius:14px;position:relative;',
        'background:rgba(255,255,255,.05);', /* Sedikit lebih terang dari panel */
        'border:1px solid rgba(255,255,255,.03);transition:background .2s}',
        '.np-item+.np-item{margin-top:6px}',
        '.np-item.np-unread{background:rgba(var(--ni-rgb),.15);border-color:rgba(var(--ni-rgb),.2)}',
        '.np-item:active{background:rgba(255,255,255,.08)}',
        '.np-item .ni-ico{width:28px;height:28px}',
        '.np-body{flex:1;min-width:0}',
        '.np-msg{font-size:13px;line-height:1.4;font-weight:500;word-break:break-word}',
        '.np-meta{margin-top:4px;font-size:11px;color:var(--text-tertiary,#8e8e93);display:flex;gap:6px;align-items:center}',
        '.np-meta b{font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:rgb(var(--ni-rgb));font-size:10px}',
        '.np-act{flex:0 0 auto;align-self:center;min-height:30px;padding:0 12px;border:0;border-radius:15px;',
        'background:rgb(var(--ni-rgb));color:#fff;font:700 12px -apple-system,sans-serif;cursor:pointer}',
        '.np-act:active{transform:scale(.94)}',
        '.np-x{flex:0 0 auto;align-self:center;width:26px;height:26px;border:0;border-radius:50%;background:transparent;',
        'color:var(--text-tertiary,#8e8e93);font-size:16px;line-height:1;cursor:pointer}',
        '.np-x:active{background:rgba(255,255,255,.1)}',
        '.np-empty{white-space:pre-line;padding:34px 20px;text-align:center;color:var(--text-tertiary,#8e8e93);font-size:13px;line-height:1.5}',
        '.np-empty svg{width:34px;height:34px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;',
        'stroke-linejoin:round;opacity:.7;margin-bottom:8px}',
        
        '.header-company-btn{position:relative}',
        '.header-company-btn .header-chevron{display:inline-block;transition:transform .2s ease}',
        '.header-company-btn[aria-expanded="true"] .header-chevron{transform:rotate(90deg)}',
        '.header-notif-badge{flex:0 0 auto;min-width:16px;height:16px;padding:0 4px;border-radius:8px;box-sizing:border-box;',
        'background:#ff453a;color:#fff;font-size:10px;font-weight:700;line-height:16px;text-align:center;',
        'font-variant-numeric:tabular-nums}',
        '.header-notif-badge[hidden]{display:none}',
        
        '@keyframes niIn{from{opacity:0;transform:translateY(-14px) scale(.92)}to{opacity:1;transform:none}}',
        '@keyframes niBump{0%{transform:scale(1)}40%{transform:scale(1.04)}100%{transform:scale(1)}}',
        '@keyframes niBar{from{transform:scaleX(1)}to{transform:scaleX(0)}}',
        '@media (prefers-reduced-motion:reduce){.ni,.ni.ni-bump{animation:none}.ni{transition:none}.ni-bar i.ni-run{animation-duration:0s}.np-panel,.np-backdrop{transition:none}}'
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

function headerBottom() {
    var h = document.getElementById('app-header');
    if (!h) return 0;
    var r = h.getBoundingClientRect();
    return r.height > 0 ? Math.max(0, Math.round(r.bottom)) : 0;
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


// ------------------------------------------------------------ riwayat & panel

function relTime(ts) {
    var sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (sec < 45) return t('notif.time.now');
    var min = Math.round(sec / 60);
    if (min < 60) return t('notif.time.min', { n: min });
    var hr = Math.round(min / 60);
    if (hr < 24) return t('notif.time.hour', { n: hr });
    return t('notif.time.day', { n: Math.round(hr / 24) });
}

function emitChanged() {
    try { bus.emit('notif:changed', { unread: _unread, total: _history.length }); } catch (e) {}
    syncBadge();
}

function recordHistory(type, msg, payload) {
    var last = _history[0];
    if (last && last.type === type && last.msg === msg && (Date.now() - last.ts) < 60000) {
        last.count++;
        last.ts = Date.now();
        if (!last.read) { } else { last.read = false; _unread++; }
        if (payload && payload.action && typeof payload.action.onClick === 'function') last.action = payload.action;
    } else {
        _history.unshift({
            id: _histId++, type: type, msg: msg, ts: Date.now(), count: 1,
            read: _panelOpen,
            action: (payload && payload.action && typeof payload.action.onClick === 'function') ? payload.action : null
        });
        if (!_panelOpen) _unread++;
        while (_history.length > HISTORY_MAX) {
            var old = _history.pop();
            if (old && !old.read) _unread = Math.max(0, _unread - 1);
        }
    }
    if (_panelOpen) renderPanelList();
    emitChanged();
}

function syncBadge() {
    if (typeof document === 'undefined') return;
    var badges = document.querySelectorAll('[data-notif-badge]');
    for (var i = 0; i < badges.length; i++) {
        var b = badges[i];
        if (_unread > 0) { b.textContent = _unread > 99 ? '99+' : String(_unread); b.hidden = false; }
        else { b.hidden = true; b.textContent = ''; }
    }
    var btn = document.querySelector('[data-notif-toggle]');
    if (btn) btn.setAttribute('aria-expanded', _panelOpen ? 'true' : 'false');
}

function markAllRead() {
    for (var i = 0; i < _history.length; i++) _history[i].read = true;
    _unread = 0;
}

var BELL_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>';

function renderPanelList() {
    if (!_panel) return;
    var list = _panel.querySelector('.np-list');
    var sub = _panel.querySelector('.np-sub');
    var clr = _panel.querySelector('[data-np-clear]');
    if (!list) return;
    clr.disabled = _history.length === 0;
    sub.textContent = _history.length ? t('notif.panel.count', { n: _history.length }) : '';
    if (!_history.length) {
        list.innerHTML = '<div class="np-empty">' + BELL_ICON + '<div>' + escapeHtml(t('notif.panel.empty')) + '</div></div>';
        return;
    }
    var html = '';
    for (var i = 0; i < _history.length; i++) {
        var h = _history[i];
        var meta = TYPES[h.type] || TYPES.info;
        html += '<div class="np-item' + (h.read ? '' : ' np-unread') + '" style="--ni-rgb:' + meta.rgb + '" data-np-id="' + h.id + '">' +
            '<span class="ni-ico"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round">' + meta.icon + '</svg></span>' +
            '<div class="np-body"><div class="np-msg">' + escapeHtml(h.msg) + '</div>' +
            '<div class="np-meta"><b>' + escapeHtml(typeLabel(h.type)) + '</b><span>\u00b7</span><span>' + escapeHtml(relTime(h.ts)) + '</span>' +
            (h.count > 1 ? '<span>\u00b7</span><span>\u00d7' + h.count + '</span>' : '') + '</div></div>' +
            (h.action ? '<button type="button" class="np-act" data-np-act="' + h.id + '">' + escapeHtml(h.action.label || t('notif.action.open')) + '</button>' : '') +
            '<button type="button" class="np-x" data-np-del="' + h.id + '" aria-label="' + escapeHtml(t('notif.close')) + '">\u00d7</button>' +
            '</div>';
    }
    list.innerHTML = html;
}

function onKey(e) { if (e.key === 'Escape') closeNotificationPanel(); }

export function openNotificationPanel() {
    if (typeof document === 'undefined' || _panelOpen) return;
    ensureStyle();
    var top = headerBottom();

    var back = document.createElement('div');
    back.className = 'np-backdrop';
    back.style.setProperty('--np-top', top + 'px');
    back.addEventListener('click', function () { closeNotificationPanel(); });

    var panel = document.createElement('div');
    panel.className = 'np-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', t('notif.panel.title'));
    panel.style.setProperty('--np-top', top + 'px');
    panel.innerHTML =
        '<div class="np-head"><div class="np-title">' + escapeHtml(t('notif.panel.title')) + '</div>' +
        '<span class="np-sub"></span>' +
        '<button type="button" class="np-btn" data-np-clear>' + escapeHtml(t('notif.panel.clear')) + '</button>' +
        '<button type="button" class="np-btn" data-np-close aria-label="' + escapeHtml(t('notif.panel.close')) + '">\u00d7</button></div>' +
        '<div class="np-list"></div>';

    panel.addEventListener('click', function (e) {
        var tg = e.target;
        if (!tg || !tg.closest) return;
        if (tg.closest('[data-np-close]')) { closeNotificationPanel(); return; }
        if (tg.closest('[data-np-clear]')) { clearHistory(); return; }
        var del = tg.closest('[data-np-del]');
        if (del) {
            var did = Number(del.getAttribute('data-np-del'));
            _history = _history.filter(function (x) { return x.id !== did; });
            renderPanelList(); emitChanged();
            return;
        }
        var act = tg.closest('[data-np-act]');
        if (act) {
            var aid = Number(act.getAttribute('data-np-act'));
            var item = _history.filter(function (x) { return x.id === aid; })[0];
            closeNotificationPanel();
            if (item && item.action) {
                try { item.action.onClick(); } catch (err) { console.error('[Notif] action error:', err); }
            }
        }
    });

    document.body.appendChild(back);
    document.body.appendChild(panel);
    _panel = panel;
    _panel._back = back;
    _panelOpen = true;

    clearNotifications();
    markAllRead();
    _unread = 0;
    renderPanelList();
    emitChanged();

    document.addEventListener('keydown', onKey);
    _tickTimer = setInterval(function () { if (_panelOpen) renderPanelList(); }, 30000);
    requestAnimationFrame(function () { back.classList.add('np-show'); panel.classList.add('np-show'); });
}

export function closeNotificationPanel() {
    if (!_panelOpen) return;
    _panelOpen = false;
    document.removeEventListener('keydown', onKey);
    clearInterval(_tickTimer); _tickTimer = null;
    var p = _panel, b = p && p._back;
    _panel = null;
    if (p) p.classList.remove('np-show');
    if (b) b.classList.remove('np-show');
    setTimeout(function () {
        if (p && p.parentNode) p.parentNode.removeChild(p);
        if (b && b.parentNode) b.parentNode.removeChild(b);
    }, 240);
    syncBadge();
}

export function toggleNotificationPanel() {
    if (_panelOpen) closeNotificationPanel(); else openNotificationPanel();
}

export function isNotificationPanelOpen() { return _panelOpen; }
export function getUnreadCount() { return _unread; }

export function clearHistory() {
    _history = [];
    _unread = 0;
    renderPanelList();
    emitChanged();
}

// ------------------------------------------------------------ public API

export function renderNotification(container, payload) {
    if (!container || !payload) return;
    ensureStyle();
    updateTop(container);
    if (!_resizeBound) {
        _resizeBound = true;
        window.addEventListener('resize', function () {
            updateTop(container);
            if (_panel) {
                var tp = headerBottom() + 'px';
                _panel.style.setProperty('--np-top', tp);
                if (_panel._back) _panel._back.style.setProperty('--np-top', tp);
            }
        });
    }

    var type = normalizeType(payload.type);
    var msg = String(payload.message || '');
    if (!msg) return;

    recordHistory(type, msg, payload);
    if (_panelOpen) return;

    for (var i = 0; i < _active.length; i++) {
        if (_active[i].type === type && _active[i].msg === msg && !_active[i].gone) {
            bumpEntry(_active[i], payload, msg);
            return;
        }
    }

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
