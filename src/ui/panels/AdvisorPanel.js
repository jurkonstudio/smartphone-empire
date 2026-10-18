// FILE: src/ui/panels/AdvisorPanel.js
// v2028.41 — tombol asisten (FAB) + panel saran + CHAT asisten.
// Baru: kartu kesehatan bisnis (6 dimensi, bisa dibuka), ringkasan perubahan sejak terakhir dilihat,
// format chat berdaftar (bullet rapi), label jawaban AI, dan aksesibilitas (aria-live, label).
// Navigasi memakai bus 'advisor:go' ({nav, subtab}); handler-nya sudah ada di main.js.
import { Modal } from '../modal.js';
import { bus } from '../../core/EventBus.js';
import { tx } from '../../systems/AdvisorSystem.js';
import { gIcon, ensureIconStyles } from '../icons/GameIcons.js';
import { ToastService } from '../../core/ToastService.js';
import { openDiagnosticModal } from '../../diagnostics/DiagnosticUI.js';

var MODAL_ID = 'advisor';
var STYLE_ID = 'advisor-chat-style';

function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}
// Teks bot -> HTML aman: escape dulu, baru **tebal**.
function fmtInline(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}
// Baris "• ..." / "1. ..." jadi daftar rapi; baris kosong jadi jarak; sisanya paragraf.
function fmt(s) {
    return String(s == null ? '' : s).split('\n').map(function (line) {
        if (!line.trim()) return '<div class="adv-gap"></div>';
        var b = /^\s*[•\-]\s+(.*)$/.exec(line);
        if (b) return '<div class="adv-li"><span class="adv-dot">•</span><span>' + fmtInline(b[1]) + '</span></div>';
        var n = /^\s*(\d+)\.\s+(.*)$/.exec(line);
        if (n) return '<div class="adv-li"><span class="adv-dot">' + n[1] + '.</span><span>' + fmtInline(n[2]) + '</span></div>';
        return '<div class="adv-ln">' + fmtInline(line) + '</div>';
    }).join('');
}
function healthBand(score) { return score >= 80 ? 'good' : score >= 60 ? 'ok' : score >= 40 ? 'warn' : 'bad'; }

function ensureStyles() {
    ensureIconStyles();
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent =
        '.adv-head{display:flex;align-items:center;gap:10px;}' +
        '.adv-avatar{width:36px;height:36px;border-radius:12px;background:var(--accent-soft);color:var(--accent);' +
            'display:flex;align-items:center;justify-content:center;flex-shrink:0;}' +
        '.adv-health{margin-left:auto;padding:3px 10px;border-radius:var(--r-pill);background:var(--accent-soft);border:none;font-family:inherit;cursor:pointer;' +
            'color:var(--accent);font-size:var(--fs-xs);font-weight:var(--fw-bold);white-space:nowrap;}' +
        '.adv-health.band-warn{background:var(--warn-soft);color:var(--warn);}.adv-health.band-bad{background:var(--danger-soft);color:var(--danger);}' +
        '.adv-hbox{margin-top:10px;padding:10px 12px;border-radius:var(--r-lg);background:var(--bg-3);border:1px solid var(--border);}' +
        '.adv-hbox[hidden]{display:none;}' +
        '.adv-hrow{display:flex;align-items:center;gap:8px;margin:5px 0;font-size:var(--fs-xs);color:var(--text-secondary);}' +
        '.adv-hrow .lb{width:84px;flex-shrink:0;}.adv-hrow .vl{width:30px;text-align:right;font-weight:var(--fw-bold);color:var(--text-primary);}' +
        '.adv-bar{flex:1;height:6px;border-radius:var(--r-pill);background:var(--border);overflow:hidden;}' +
        '.adv-bar>i{display:block;height:100%;border-radius:inherit;background:var(--accent);}' +
        '.adv-bar.band-warn>i{background:var(--warn);}.adv-bar.band-bad>i{background:var(--danger);}.adv-bar.band-good>i{background:var(--success);}' +
        '.adv-hnote{margin-top:6px;font-size:var(--fs-xs);color:var(--text-tertiary);}' +
        '.adv-brief{margin-top:10px;padding:10px 12px;border-radius:var(--r-lg);background:var(--accent-soft);border:1px solid var(--border);}' +
        '.adv-brief-t{font-size:var(--fs-xs);font-weight:var(--fw-bold);letter-spacing:.5px;text-transform:uppercase;color:var(--accent);margin-bottom:4px;}' +
        '.adv-brief-l{font-size:var(--fs-sm);color:var(--text-primary);line-height:1.5;}' +
        '.adv-up{color:var(--success);font-weight:var(--fw-bold);}.adv-down{color:var(--danger);font-weight:var(--fw-bold);}' +
        '.adv-gap{height:6px;}.adv-li{display:flex;gap:6px;}.adv-dot{flex-shrink:0;min-width:1em;color:var(--text-tertiary);}' +
        '.adv-ai-tag{display:inline-block;margin-top:4px;padding:1px 7px;border-radius:var(--r-pill);background:var(--accent-soft);color:var(--accent);font-size:10px;font-weight:var(--fw-bold);}' +
        '.adv-section{display:flex;align-items:center;justify-content:space-between;margin:12px 2px 6px;' +
            'font-size:var(--fs-2xs);font-weight:var(--fw-bold);letter-spacing:.7px;text-transform:uppercase;color:var(--text-tertiary);}' +
        '.adv-link{background:none;border:none;color:var(--accent);font-family:inherit;font-size:var(--fs-xs);font-weight:var(--fw-bold);cursor:pointer;padding:2px 4px;}' +
        '.adv-chat{display:flex;flex-direction:column;gap:8px;max-height:36vh;overflow-y:auto;padding:2px;scroll-behavior:smooth;}' +
        '.adv-msg{display:flex;gap:8px;max-width:92%;}' +
        '.adv-msg.user{align-self:flex-end;}' +
        '.adv-bubble{padding:9px 12px;border-radius:14px;font-size:var(--fs-sm);line-height:1.45;word-break:break-word;}' +
        '.adv-msg.bot .adv-bubble{background:var(--bg-3);border:1px solid var(--border);color:var(--text-primary);border-top-left-radius:4px;}' +
        '.adv-msg.user .adv-bubble{background:var(--accent);color:#fff;border-top-right-radius:4px;white-space:pre-wrap;}' +
        '.adv-bubble b{font-weight:var(--fw-bold);}' +
        '.adv-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}' +
        '.adv-acts .advisor-btn{display:inline-flex;align-items:center;gap:6px;}' +
        '.adv-typing{display:inline-flex;gap:4px;padding:12px 14px;}' +
        '.adv-typing i{width:6px;height:6px;border-radius:50%;background:var(--text-tertiary);animation:advDot 1s infinite ease-in-out;}' +
        '.adv-typing i:nth-child(2){animation-delay:.15s}.adv-typing i:nth-child(3){animation-delay:.3s}' +
        '@keyframes advDot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}' +
        '.adv-chips{display:flex;gap:6px;overflow-x:auto;padding:8px 2px 2px;scrollbar-width:none;}' +
        '.adv-chips::-webkit-scrollbar{display:none}' +
        '.adv-chip{flex-shrink:0;padding:6px 12px;border-radius:var(--r-pill);background:var(--bg-3);border:1px solid var(--border);' +
            'color:var(--text-secondary);font-family:inherit;font-size:var(--fs-xs);font-weight:var(--fw-semibold);cursor:pointer;' +
            'transition:border-color .15s,color .15s,transform .06s;}' +
        '.adv-chip:hover{border-color:var(--accent);color:var(--accent);}.adv-chip:active{transform:scale(.96);}' +
        '.adv-inputrow{display:flex;gap:6px;margin-top:8px;}' +
        '.adv-inputrow .advisor-input{flex:1;min-width:0;}' +
        '.adv-send{width:40px;padding:0;display:flex;align-items:center;justify-content:center;flex-shrink:0;}' +
        '@media (prefers-reduced-motion:reduce){.adv-typing i{animation:none}.adv-chat{scroll-behavior:auto}}';
    document.head.appendChild(st);
}

function renderItems(advisor, all) {
    var list = advisor.getAdvice();
    var shown = all ? list : list.slice(0, 2);
    return shown.map(function (a) {
        var go = (a.action && a.action.report)
            ? '<button class="btn-primary advisor-btn" type="button" data-adv-report="copy">' + esc(tx('ui.copy_report')) + '</button>' +
              '<button class="btn-secondary advisor-btn" type="button" data-adv-report="open">' + esc(tx('ui.open_report')) + '</button>'
            : a.action
            ? '<button class="btn-primary advisor-btn" type="button" data-adv-go="1"' +
              ' data-adv-nav="' + esc(a.action.nav) + '"' +
              ' data-adv-subtab="' + esc(a.action.subtab || '') + '">' + esc(tx('ui.open')) + '</button>'
            : '';
        var snooze = a.id !== 'all_good'
            ? '<button class="btn-secondary advisor-btn" type="button" data-adv-snooze="' + esc(a.id) + '">' +
              esc(tx('ui.snooze')) + '</button>'
            : '';
        return '' +
            '<div class="advisor-item sev-' + a.sev + '">' +
                '<div class="advisor-ico" aria-hidden="true">' + gIcon(a.icon, 18) + '</div>' +
                '<div class="advisor-body">' +
                    '<div class="advisor-title">' + esc(a.title) + '</div>' +
                    '<div class="advisor-detail">' + esc(a.detail) + '</div>' +
                    ((go || snooze) ? '<div class="advisor-actions">' + go + snooze + '</div>' : '') +
                '</div>' +
            '</div>';
    }).join('');
}

function signed(v) { return (v >= 0 ? '+' : '−') + '$' + Math.abs(Math.round(v)).toLocaleString('en-US'); }

function renderBriefing(b) {
    if (!b) return '';
    var rows = [];
    rows.push('<div>' + esc(tx('ui.cash_lbl')) + ' <span class="' + (b.cashDelta >= 0 ? 'adv-up' : 'adv-down') + '">' + signed(b.cashDelta) + '</span>' +
        (b.soldDelta > 0 ? ' · ' + esc(tx('ui.sold_lbl')) + ' <b>' + b.soldDelta.toLocaleString('en-US') + '</b>' : '') +
        (b.healthDelta ? ' · ' + esc(tx('ui.health_lbl')) + ' <span class="' + (b.healthDelta > 0 ? 'adv-up' : 'adv-down') + '">' + (b.healthDelta > 0 ? '+' : '−') + Math.abs(b.healthDelta) + '</span>' : '') + '</div>');
    if (b.resolved) rows.push('<div>' + esc(tx('ui.resolved_lbl', { n: b.resolved })) + '</div>');
    b.fresh.forEach(function (a) { rows.push('<div>• ' + esc(a.title) + '</div>'); });
    return '<div class="adv-brief"><div class="adv-brief-t">' + esc(tx('ui.briefing')) + ' · ' + esc(tx('ui.days_lbl', { n: b.days })) + '</div>' +
        '<div class="adv-brief-l">' + rows.join('') + '</div></div>';
}

function renderHealthBox(h) {
    var rows = h.parts.map(function (p) {
        return '<div class="adv-hrow"><span class="lb">' + esc(p.label) + '</span>' +
            '<span class="adv-bar band-' + healthBand(p.score) + '"><i style="width:' + p.score + '%"></i></span>' +
            '<span class="vl">' + p.score + '</span></div>';
    }).join('');
    var note = h.weakest ? '<div class="adv-hnote">' + esc(tx('ui.weakest_lbl', { name: h.weakest.label })) + '</div>' : '';
    return rows + note;
}

function renderMsg(m) {
    var acts = '';
    if (m.role === 'bot' && m.actions && m.actions.length) {
        acts = '<div class="adv-acts">' + m.actions.map(function (a) {
            if (a.report) return '<button class="btn-primary advisor-btn" type="button" data-adv-report="' + esc(a.report) + '">' + esc(a.label) + '</button>';
            return '<button class="btn-primary advisor-btn" type="button" data-adv-go="1" data-adv-nav="' + esc(a.nav) +
                '" data-adv-subtab="' + esc(a.subtab || '') + '">' + esc(a.label) + gIcon('arrow-right', 14) + '</button>';
        }).join('') + '</div>';
    }
    return '<div class="adv-msg ' + (m.role === 'user' ? 'user' : 'bot') + '">' +
        '<div><div class="adv-bubble">' + (m.role === 'user' ? esc(m.text) : fmt(m.text)) + '</div>' +
        (m.source === 'ai' ? '<span class="adv-ai-tag">' + esc(tx('ui.ai')) + '</span>' : '') + acts + '</div></div>';
}

function renderChips(chips) {
    return (chips || []).map(function (c) {
        return '<button type="button" class="adv-chip" data-adv-chip="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');
}

function copyText(text) {
    return new Promise(function (resolve, reject) {
        function fallback() {
            try {
                var ta = document.createElement('textarea');
                ta.value = text; ta.setAttribute('readonly', '');
                ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
                document.body.appendChild(ta); ta.select();
                var ok = document.execCommand && document.execCommand('copy');
                ta.remove();
                ok ? resolve() : reject(new Error('copy'));
            } catch (e) { reject(e); }
        }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(resolve, fallback);
        else fallback();
    });
}

function handleReport(advisor, mode) {
    if (mode === 'open') { Modal.close(MODAL_ID, true); openDiagnosticModal(); return; }
    var text = '';
    try { text = advisor.buildBugReportText(); } catch (e) {}
    if (!text) { ToastService.warning(tx('ui.report_failed')); return; }
    copyText(text).then(function () { ToastService.success(tx('ui.report_copied')); },
                        function () { ToastService.warning(tx('ui.report_failed')); });
}

export function openAdvisor(advisor) {
    ensureStyles();
    var chat = advisor.getChat();
    var h = advisor.brain.health();
    var showAll = false;
    var briefing = null;
    try { briefing = advisor.getBriefing(); } catch (e) {}

    var html = '' +
        '<div class="adv-head">' +
            '<div class="adv-avatar">' + gIcon('spark', 20) + '</div>' +
            '<div><div class="modal-title" style="margin:0">' + esc(tx('ui.title')) + '</div>' +
            '<div class="modal-sub" style="margin:0">' + esc(advisor.getSummary()) + '</div></div>' +
            '<button type="button" class="adv-health band-' + healthBand(h.score) + '" data-adv-health aria-expanded="false" aria-label="' + esc(tx('ui.health')) + '">' + h.score + '/100</button>' +
        '</div>' +
        '<div class="adv-hbox" data-adv-hbox hidden>' + renderHealthBox(h) + '</div>' +
        renderBriefing(briefing) +
        '<div class="adv-section"><span>' + esc(tx('ui.advice')) + '</span>' +
            '<button class="adv-link" type="button" data-adv-toggle>' + esc(tx('ui.show_all')) + '</button></div>' +
        '<div class="advisor-list" data-adv-list>' + renderItems(advisor, false) + '</div>' +
        '<div class="adv-section"><span>' + esc(tx('ui.chat')) + '</span>' +
            '<button class="adv-link" type="button" data-adv-clear>' + esc(tx('ui.clear')) + '</button></div>' +
        '<div class="adv-chat" data-adv-chat role="log" aria-live="polite" aria-label="' + esc(tx('ui.chat')) + '">' + chat.map(renderMsg).join('') + '</div>' +
        '<div class="adv-chips" data-adv-chips>' + renderChips(chat[chat.length - 1].chips) + '</div>' +
        '<div class="adv-inputrow">' +
            '<input class="advisor-input" type="text" maxlength="300" data-adv-input autocomplete="off" enterkeyhint="send" aria-label="' + esc(tx('ui.chat')) + '" placeholder="' + esc(tx('ui.ask_ph')) + '">' +
            '<button class="btn-primary advisor-btn adv-send" type="button" data-adv-send="1" aria-label="' + esc(tx('ui.ask_send')) + '">' + gIcon('send', 16) + '</button>' +
        '</div>' +
        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:12px;">' + esc(tx('ui.close')) + '</button>';

    Modal.open(MODAL_ID, html);

    var node = document.querySelector('[data-modal-id="' + MODAL_ID + '"]');
    if (!node) return;
    try { advisor.markSeen(); } catch (e) {}
    var log = node.querySelector('[data-adv-chat]');
    var chipsEl = node.querySelector('[data-adv-chips]');
    var input = node.querySelector('[data-adv-input]');
    function scroll() { if (log) log.scrollTop = log.scrollHeight; }
    scroll();

    var busy = false;
    async function send(text) {
        text = String(text || '').trim();
        if (!text || busy) return;
        busy = true;
        log.insertAdjacentHTML('beforeend', renderMsg({ role: 'user', text: text }));
        chipsEl.innerHTML = '';
        input.value = '';
        var typing = document.createElement('div');
        typing.className = 'adv-msg bot';
        typing.innerHTML = '<div class="adv-bubble adv-typing"><i></i><i></i><i></i></div>';
        log.appendChild(typing);
        scroll();
        var started = Date.now();
        var res = await advisor.chat(text);
        var wait = Math.max(0, 380 - (Date.now() - started));       // jeda singkat agar terasa "berpikir"
        await new Promise(function (r) { setTimeout(r, wait); });
        typing.remove();
        if (res) {
            log.insertAdjacentHTML('beforeend', renderMsg(res));
            chipsEl.innerHTML = renderChips(res.chips);
            if (res.navigate) {
                setTimeout(function () { bus.emit('advisor:go', { nav: res.navigate.nav, subtab: res.navigate.subtab || null }); }, 650);
            }
        }
        scroll();
        busy = false;
        if (input) input.focus();
    }

    node.addEventListener('click', function (e) {
        var goBtn = e.target.closest('[data-adv-go]');
        if (goBtn) {
            bus.emit('advisor:go', { nav: goBtn.dataset.advNav, subtab: goBtn.dataset.advSubtab || null });
            return;
        }
        var rep = e.target.closest('[data-adv-report]');
        if (rep) { handleReport(advisor, rep.dataset.advReport); return; }
        var snz = e.target.closest('[data-adv-snooze]');
        if (snz) {
            advisor.snooze(snz.dataset.advSnooze);
            node.querySelector('[data-adv-list]').innerHTML = renderItems(advisor, showAll);
            return;
        }
        var hb = e.target.closest('[data-adv-health]');
        if (hb) {
            var box = node.querySelector('[data-adv-hbox]');
            box.hidden = !box.hidden;
            hb.setAttribute('aria-expanded', box.hidden ? 'false' : 'true');
            return;
        }
        if (e.target.closest('[data-adv-toggle]')) {
            showAll = !showAll;
            node.querySelector('[data-adv-list]').innerHTML = renderItems(advisor, showAll);
            node.querySelector('[data-adv-toggle]').textContent = tx(showAll ? 'ui.hide' : 'ui.show_all');
            return;
        }
        if (e.target.closest('[data-adv-clear]')) {
            advisor.resetChat();
            var c2 = advisor.getChat();
            log.innerHTML = c2.map(renderMsg).join('');
            chipsEl.innerHTML = renderChips(c2[c2.length - 1].chips);
            scroll();
            return;
        }
        var chip = e.target.closest('[data-adv-chip]');
        if (chip) { send(chip.dataset.advChip); return; }
        if (e.target.closest('[data-adv-send]')) send(input.value);
    });

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); send(input.value); }
    });
}

// Tombol melayang. Disembunyikan selama tutorial berjalan.
export function mountAdvisorButton(advisor) {
    if (document.getElementById('advisor-fab')) return;
    ensureStyles();

    var btn = document.createElement('button');
    btn.id = 'advisor-fab';
    btn.className = 'advisor-fab';
    btn.type = 'button';
    btn.innerHTML = gIcon('spark', 22) + '<span class="advisor-badge" hidden></span>';
    var badge = btn.querySelector('.advisor-badge');
    document.body.appendChild(btn);

    function paint() {
        var b = advisor.getBadge();
        badge.textContent = String(b.count);
        badge.hidden = b.count === 0;
        btn.classList.toggle('critical', b.critical > 0);
        btn.setAttribute('aria-label', tx('ui.title') + (b.count ? ' (' + b.count + ')' : ''));
    }
    function setHidden(h) { btn.classList.toggle('is-hidden', !!h); }

    var tut = (advisor.state.data && advisor.state.data.tutorial) || {};
    setHidden(!(tut.completed || tut.skipped));

    // ---- geser bebas: tarik tombol ke mana saja, lepas -> menempel ke tepi kiri/kanan ----
    var POS_KEY = 'advisor-fab-pos';
    var dragged = false;
    function put(x, y) {
        var w = btn.offsetWidth || 46, h = btn.offsetHeight || 46, m = 8;
        x = Math.max(m, Math.min(window.innerWidth - w - m, x));
        y = Math.max(m, Math.min(window.innerHeight - h - m, y));
        btn.style.setProperty('left', x + 'px', 'important');
        btn.style.setProperty('top', y + 'px', 'important');
        btn.style.setProperty('right', 'auto', 'important');
        btn.style.setProperty('bottom', 'auto', 'important');
        return { x: x, y: y };
    }
    function save(p) {
        try { localStorage.setItem(POS_KEY, JSON.stringify({ fx: p.x / window.innerWidth, fy: p.y / window.innerHeight })); } catch (e) {}
    }
    function restore() {
        try {
            var v = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
            if (v && typeof v.fx === 'number') put(v.fx * window.innerWidth, v.fy * window.innerHeight);
        } catch (e) {}
    }
    btn.style.touchAction = 'none';
    var drag = null;
    btn.addEventListener('pointerdown', function (e) {
        if (e.button !== undefined && e.button !== 0) return;
        var r = btn.getBoundingClientRect();
        drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top, moved: false };
        try { btn.setPointerCapture(e.pointerId); } catch (err) {}
    });
    btn.addEventListener('pointermove', function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
        if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 8) return;
        if (!drag.moved) { drag.moved = true; btn.style.transition = 'none'; btn.classList.add('is-dragging'); }
        put(drag.ox + dx, drag.oy + dy);
        e.preventDefault();
    });
    function endDrag(e) {
        if (!drag || e.pointerId !== drag.id) return;
        var moved = drag.moved;
        drag = null;
        btn.style.transition = '';
        btn.classList.remove('is-dragging');
        if (moved) {
            dragged = true;
            setTimeout(function () { dragged = false; }, 0);
            var r = btn.getBoundingClientRect();
            var snapX = (r.left + r.width / 2 < window.innerWidth / 2) ? 8 : window.innerWidth - r.width - 8;
            btn.style.transition = 'left .18s ease, top .18s ease';
            save(put(snapX, r.top));
            setTimeout(function () { btn.style.transition = ''; }, 220);
        }
    }
    btn.addEventListener('pointerup', endDrag);
    btn.addEventListener('pointercancel', endDrag);
    window.addEventListener('resize', function () {
        var r = btn.getBoundingClientRect();
        if (btn.style.left) put(r.left, r.top);
    });
    restore();

    btn.addEventListener('click', function () { if (!dragged) openAdvisor(advisor); });
    bus.on('advisor:updated', paint);
    bus.on('lang:changed', paint);
    bus.on('tutorial:step-changed', function () { setHidden(true); });
    bus.on('tutorial:completed', function () { setHidden(false); });
    paint();
}
