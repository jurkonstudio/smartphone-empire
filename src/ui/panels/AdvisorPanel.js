// FILE: src/ui/panels/AdvisorPanel.js  (REPLACE — v2028.43: panel langsung sinkron + tandai selesai)
// v2028.43 — Panel Asisten kini ikut berubah saat game berjalan: saran yang sudah beres hilang
//   otomatis dengan notifikasi "Beres", pemain bisa menandai saran "Tandai selesai" (dan membatalkannya),
//   ada filter Semua / Mendesak / Info, dan daftar "sudah ditandai" yang bisa dibuka lagi.
//   Target sentuh diperbesar dan tata letak dibuat lebih rapat untuk layar ponsel.
// v2028.42 — navigasi tab + layout ringkas; v2028.41 — tombol asisten (FAB) + chat.
// Navigasi memakai bus 'advisor:go' ({nav, subtab}); handler-nya ada di main.js.
import { Modal } from '../modal.js';
import { bus } from '../../core/EventBus.js';
import { tx } from '../../systems/AdvisorSystem.js';
import { gIcon, ensureIconStyles } from '../icons/GameIcons.js';
import { ToastService } from '../../core/ToastService.js';
import { openDiagnosticModal } from '../../diagnostics/DiagnosticUI.js';

var MODAL_ID = 'advisor';
var STYLE_ID = 'advisor-chat-style';
var PREVIEW_N = 3;        // jumlah saran yang tampil sebelum "Lihat semua"
var FLASH_MS = 3200;      // lama notifikasi "Beres" tampil

function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>\"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[c];
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
function signed(v) { return (v >= 0 ? '+' : '−') + '$' + Math.abs(Math.round(v)).toLocaleString('en-US'); }
function isUrgent(a) { return a.sev === 'critical' || a.sev === 'warn'; }
function matchFilter(a, f) {
    if (f === 'urgent') return isUrgent(a);
    if (f === 'info') return !isUrgent(a);
    return true;
}
function realOnly(list) { return list.filter(function (a) { return a.id !== 'all_good'; }); }

// [v2028.44] Panggilan aman ke sistem Asisten. Jika fungsi tidak ada (mis. AdvisorSystem.js
// belum diperbarui di server) atau melempar error, panel memakai nilai cadangan dan tetap berjalan.
function has(obj, name) { return !!obj && typeof obj[name] === 'function'; }
function call(obj, name, args, fallback) {
    if (!has(obj, name)) return fallback;
    try {
        var r = obj[name].apply(obj, args || []);
        return r === undefined ? fallback : r;
    } catch (e) {
        console.warn('[AdvisorPanel] ' + name + ' gagal:', e);
        return fallback;
    }
}
function safeList(advisor) {
    var list = call(advisor, 'getAdvice', [], []);
    return Array.isArray(list) ? list : [];
}
function healthOf(advisor) {
    var h = call(advisor && advisor.brain, 'health', [], null);
    return h && Array.isArray(h.parts) ? h : { score: 0, parts: [], weakest: null };
}
// Fitur "Tandai selesai" hanya ditampilkan bila sistem mendukungnya.
function capsOf(advisor) {
    return { done: has(advisor, 'markDone') && has(advisor, 'undoDone') && has(advisor, 'getDone') };
}
// Bungkus handler klik: error di satu tombol tidak menjatuhkan seluruh game.
function guard(fn) {
    return function (e) {
        try { fn(e); }
        catch (err) {
            console.warn('[AdvisorPanel] aksi gagal:', err);
            var msg = tx('ui.action_failed');
            if (msg === 'ui.action_failed') msg = 'Aksi gagal, coba lagi.';
            try { ToastService.warning(msg); } catch (e2) {}
        }
    };
}

function ensureStyles() {
    ensureIconStyles();
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent =
        // --- kepala & kesehatan ---
        '.adv-head{display:flex;align-items:center;gap:10px;}' +
        '.adv-avatar{width:36px;height:36px;border-radius:12px;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;flex-shrink:0;}' +
        '.adv-hd-txt{min-width:0;flex:1;}' +
        '.adv-sub{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
        '.adv-health{margin-left:auto;min-height:32px;padding:3px 12px;border-radius:var(--r-pill);background:var(--accent-soft);border:none;font-family:inherit;cursor:pointer;color:var(--accent);font-size:var(--fs-xs);font-weight:var(--fw-bold);white-space:nowrap;}' +
        '.adv-health.band-warn{background:var(--warn-soft);color:var(--warn);}.adv-health.band-bad{background:var(--danger-soft);color:var(--danger);}' +
        '.adv-hbox{margin-top:8px;padding:10px 12px;border-radius:var(--r-lg);background:var(--bg-3);border:1px solid var(--border);}' +
        '.adv-hbox[hidden]{display:none;}' +
        '.adv-hrow{display:flex;align-items:center;gap:8px;margin:5px 0;font-size:var(--fs-xs);color:var(--text-secondary);}' +
        '.adv-hrow .lb{width:84px;flex-shrink:0;}.adv-hrow .vl{width:30px;text-align:right;font-weight:var(--fw-bold);color:var(--text-primary);}' +
        '.adv-bar{flex:1;height:6px;border-radius:var(--r-pill);background:var(--border);overflow:hidden;}' +
        '.adv-bar>i{display:block;height:100%;border-radius:inherit;background:var(--accent);transition:width .4s ease;}' +
        '.adv-bar.band-warn>i{background:var(--warn);}.adv-bar.band-bad>i{background:var(--danger);}.adv-bar.band-good>i{background:var(--success);}' +
        '.adv-hnote{margin-top:6px;font-size:var(--fs-xs);color:var(--text-tertiary);}' +
        // --- ringkasan sejak terakhir ---
        '.adv-brief{margin-top:8px;padding:7px 10px;border-radius:var(--r-md);background:var(--accent-soft);border:1px solid var(--border);}' +
        '.adv-brief-t{font-size:10px;font-weight:var(--fw-bold);letter-spacing:.5px;text-transform:uppercase;color:var(--accent);margin-bottom:2px;}' +
        '.adv-brief-l{font-size:var(--fs-xs);color:var(--text-primary);line-height:1.4;}' +
        '.adv-up{color:var(--success);font-weight:var(--fw-bold);}.adv-down{color:var(--danger);font-weight:var(--fw-bold);}' +
        // --- tab ---
        '.adv-tabs{display:flex;gap:4px;padding:3px;margin:10px 0 6px;border-radius:var(--r-pill);background:var(--bg-3);border:1px solid var(--border);}' +
        '.adv-tab{flex:1;min-height:40px;display:flex;align-items:center;justify-content:center;gap:6px;padding:0 8px;border:none;border-radius:var(--r-pill);' +
            'background:transparent;color:var(--text-secondary);font-family:inherit;font-size:var(--fs-sm);font-weight:var(--fw-bold);cursor:pointer;}' +
        '.adv-tab[aria-selected="true"]{background:var(--accent);color:#fff;}' +
        '.adv-count{min-width:18px;height:18px;padding:0 5px;border-radius:var(--r-pill);background:var(--danger);color:#fff;font-size:10px;line-height:18px;text-align:center;}' +
        '.adv-count[hidden]{display:none;}' +
        '.adv-tab[aria-selected="true"] .adv-count{background:#fff;color:var(--accent,#2563eb);}' +
        '.adv-panel[hidden]{display:none;}' +
        // --- toolbar filter & indikator live ---
        '.adv-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;}' +
        '.adv-filters{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;min-width:0;}' +
        '.adv-filters::-webkit-scrollbar{display:none}' +
        '.adv-filter{flex-shrink:0;min-height:34px;padding:0 12px;border-radius:var(--r-pill);border:1px solid var(--border);background:var(--bg-3);' +
            'color:var(--text-secondary);font-family:inherit;font-size:var(--fs-xs);font-weight:var(--fw-bold);cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:border-color .15s,color .15s,background .15s;}' +
        '.adv-filter[aria-pressed="true"]{background:var(--accent-soft);border-color:var(--accent);color:var(--accent);}' +
        '.adv-filter .n{font-size:10px;opacity:.8;}' +
        '.adv-live{flex-shrink:0;display:inline-flex;align-items:center;gap:5px;font-size:10px;color:var(--text-tertiary);white-space:nowrap;}' +
        '.adv-live i{width:6px;height:6px;border-radius:50%;background:var(--success);animation:advPulse 2s infinite ease-in-out;}' +
        // --- notifikasi "Beres" ---
        '.adv-flash{display:flex;align-items:center;gap:8px;padding:8px 10px;margin-bottom:6px;border-radius:var(--r-md);' +
            'background:var(--success-soft,rgba(34,197,94,.14));color:var(--success);font-size:var(--fs-xs);font-weight:var(--fw-bold);animation:advIn .25s ease;transition:opacity .4s ease;}' +
        '.adv-flash span{min-width:0;overflow:hidden;text-overflow:ellipsis;}' +
        '.adv-flash.out{opacity:0;}' +
        // --- kartu saran ---
        '.adv-advice .advisor-list{max-height:34vh;overflow-y:auto;overscroll-behavior:contain;padding:2px;}' +
        '.adv-advice .advisor-item{padding:9px 10px;gap:8px;}' +
        '.adv-advice .advisor-ico{font-size:18px;}' +
        '.adv-advice .advisor-title{font-size:var(--fs-sm);}' +
        '.adv-advice .advisor-detail{font-size:var(--fs-xs);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}' +
        '.adv-advice .advisor-actions{margin-top:6px;}' +
        '.adv-advice .advisor-btn{min-height:34px;padding:5px 10px;font-size:var(--fs-xs);display:inline-flex;align-items:center;gap:5px;}' +
        '.adv-item-head{display:flex;align-items:center;gap:6px;margin-bottom:2px;}' +
        '.adv-sev{font-size:10px;font-weight:var(--fw-bold);padding:1px 7px;border-radius:var(--r-pill);text-transform:uppercase;letter-spacing:.4px;}' +
        '.adv-sev.sev-critical{background:var(--danger-soft);color:var(--danger);}' +
        '.adv-sev.sev-warn{background:var(--warn-soft);color:var(--warn);}' +
        '.adv-sev.sev-tip{background:var(--accent-soft);color:var(--accent);}' +
        '.adv-sev.sev-info{background:var(--bg-3);color:var(--text-secondary);}' +
        '.adv-empty{padding:18px 12px;text-align:center;font-size:var(--fs-xs);color:var(--text-tertiary);}' +
        '.adv-more{width:100%;min-height:40px;margin-top:8px;border-radius:var(--r-md);background:transparent;border:1px dashed var(--border);' +
            'color:var(--accent);font-family:inherit;font-size:var(--fs-xs);font-weight:var(--fw-bold);cursor:pointer;}' +
        // --- daftar sudah ditandai selesai ---
        '.adv-done{margin-top:10px;border-radius:var(--r-md);border:1px solid var(--border);background:var(--bg-3);}' +
        '.adv-done summary{list-style:none;cursor:pointer;min-height:40px;padding:9px 12px;display:flex;align-items:center;gap:8px;font-size:var(--fs-xs);font-weight:var(--fw-bold);color:var(--text-secondary);}' +
        '.adv-done summary::-webkit-details-marker{display:none;}' +
        '.adv-done-row{display:flex;align-items:center;gap:8px;padding:4px 12px;border-top:1px solid var(--border);font-size:var(--fs-xs);color:var(--text-secondary);}' +
        '.adv-done-row .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
        '.adv-undo{min-height:36px;padding:0 8px;background:none;border:none;color:var(--accent);font-family:inherit;font-weight:var(--fw-bold);cursor:pointer;}' +
        // --- chat asisten ---
        '.adv-row{display:flex;justify-content:flex-end;min-height:24px;margin-bottom:2px;}' +
        '.adv-link{background:none;border:none;color:var(--accent);font-family:inherit;font-size:var(--fs-xs);font-weight:var(--fw-bold);cursor:pointer;padding:2px 4px;}' +
        '.adv-chat{display:flex;flex-direction:column;gap:8px;max-height:36vh;overflow-y:auto;padding:2px;scroll-behavior:smooth;}' +
        '.adv-chatp .adv-chat{height:auto;max-height:clamp(140px,30vh,280px);}' +
        '.adv-msg{display:flex;gap:8px;max-width:92%;}' +
        '.adv-msg.user{align-self:flex-end;}' +
        '.adv-bubble{padding:9px 12px;border-radius:14px;font-size:var(--fs-sm);line-height:1.45;word-break:break-word;}' +
        '.adv-msg.bot .adv-bubble{background:var(--bg-3);border:1px solid var(--border);color:var(--text-primary);border-top-left-radius:4px;}' +
        '.adv-msg.user .adv-bubble{background:var(--accent);color:#fff;border-top-right-radius:4px;white-space:pre-wrap;}' +
        '.adv-bubble b{font-weight:var(--fw-bold);}' +
        '.adv-gap{height:6px;}.adv-li{display:flex;gap:6px;}.adv-dot{flex-shrink:0;min-width:1em;color:var(--text-tertiary);}' +
        '.adv-ai-tag{display:inline-block;margin-top:4px;padding:1px 7px;border-radius:var(--r-pill);background:var(--accent-soft);color:var(--accent);font-size:10px;font-weight:var(--fw-bold);}' +
        '.adv-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}' +
        '.adv-acts .advisor-btn{display:inline-flex;align-items:center;gap:6px;}' +
        '.adv-typing{display:inline-flex;gap:4px;padding:12px 14px;}' +
        '.adv-typing i{width:6px;height:6px;border-radius:50%;background:var(--text-tertiary);animation:advDot 1s infinite ease-in-out;}' +
        '.adv-typing i:nth-child(2){animation-delay:.15s}.adv-typing i:nth-child(3){animation-delay:.3s}' +
        '.adv-chips{display:flex;gap:6px;overflow-x:auto;padding:8px 2px 2px;scrollbar-width:none;background:color-mix(in srgb,var(--bg-2,#141414) 55%,transparent);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:var(--r-lg);}' +
        '.adv-chips::-webkit-scrollbar{display:none}' +
        '.adv-chip{flex-shrink:0;min-height:34px;padding:6px 12px;border-radius:var(--r-pill);background:color-mix(in srgb,var(--bg-3) 60%,transparent);border:1px solid var(--border);' +
            'color:var(--text-secondary);font-family:inherit;font-size:var(--fs-xs);font-weight:var(--fw-semibold);cursor:pointer;transition:border-color .15s,color .15s,transform .06s;}' +
        '.adv-chip:hover{border-color:var(--accent);color:var(--accent);}.adv-chip:active{transform:scale(.96);}' +
        '.adv-chatp .adv-chips{padding-top:6px;}' +
        '.adv-inputrow{display:flex;gap:6px;margin-top:8px;}' +
        '.adv-inputrow .advisor-input{flex:1;min-width:0;}' +
        '.adv-send{width:44px;min-height:44px;padding:0;display:flex;align-items:center;justify-content:center;flex-shrink:0;}' +
        '.adv-chatp .adv-inputrow{margin-top:6px;}' +
        '.adv-close{width:100%;margin-top:10px;min-height:44px;}' +
        '.modal-backdrop[data-modal-id="advisor"] .modal-card{max-height:min(78vh,660px);}' +
        '@keyframes advPulse{0%,100%{opacity:1}50%{opacity:.35}}' +
        '@keyframes advIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}' +
        '@keyframes advDot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}' +
        '@media (prefers-reduced-motion:reduce){.adv-typing i,.adv-live i{animation:none}.adv-chat{scroll-behavior:auto}.adv-flash{animation:none}}';
    document.head.appendChild(st);
}

// Ikon/teks ringkas per tingkat keparahan.
function sevLabel(sev) { return tx('ui.sev_' + sev); }

function renderItem(a, canDone) {
    var go = '';
    if (a.action && a.action.patch) {
        go = a.action.patch === 'reload'
            ? '<button class="btn-primary advisor-btn" type="button" data-adv-patch="reload">' + esc(tx('ui.patch_reload')) + '</button>'
            : '<button class="btn-primary advisor-btn" type="button" data-adv-patch="ack" data-adv-ver="' + esc(a.action.ver || '') + '">' + esc(tx('ui.patch_ack')) + '</button>';
    } else if (a.action && a.action.report) {
        go = '<button class="btn-primary advisor-btn" type="button" data-adv-report="copy" data-adv-id="' + esc(a.id) + '">' + esc(tx('ui.copy_report')) + '</button>' +
             '<button class="btn-secondary advisor-btn" type="button" data-adv-report="open">' + esc(tx('ui.open_report')) + '</button>';
    } else if (a.action) {
        go = '<button class="btn-primary advisor-btn" type="button" data-adv-go="1"' +
             ' data-adv-nav="' + esc(a.action.nav) + '"' +
             ' data-adv-subtab="' + esc(a.action.subtab || '') + '">' + esc(tx('ui.open')) + '</button>';
    }
    // Tandai selesai: untuk saran biasa (patch sudah punya "Tandai dibaca" sendiri).
    var done = (canDone && a.id !== 'all_good' && !(a.action && a.action.patch))
        ? '<button class="btn-secondary advisor-btn" type="button" data-adv-done="' + esc(a.id) + '">' + gIcon('check-circle', 14) + esc(tx('ui.done')) + '</button>'
        : '';
    var snooze = a.id !== 'all_good'
        ? '<button class="btn-secondary advisor-btn" type="button" data-adv-snooze="' + esc(a.id) + '">' + esc(tx('ui.snooze')) + '</button>'
        : '';
    var pill = a.id === 'all_good' ? '' : '<span class="adv-sev sev-' + a.sev + '">' + esc(sevLabel(a.sev)) + '</span>';
    var acts = go + done + snooze;
    return '' +
        '<div class="advisor-item sev-' + a.sev + '">' +
            '<div class="advisor-ico" aria-hidden="true">' + gIcon(a.icon, 18) + '</div>' +
            '<div class="advisor-body">' +
                (pill ? '<div class="adv-item-head">' + pill + '</div>' : '') +
                '<div class="advisor-title">' + esc(a.title) + '</div>' +
                '<div class="advisor-detail">' + esc(a.detail) + '</div>' +
                (acts ? '<div class="advisor-actions">' + acts + '</div>' : '') +
            '</div>' +
        '</div>';
}

function renderBriefingLine(b) {
    if (!b) return '';
    var parts = [esc(tx('ui.cash_lbl')) + ' <span class="' + (b.cashDelta >= 0 ? 'adv-up' : 'adv-down') + '">' + signed(b.cashDelta) + '</span>'];
    if (b.soldDelta > 0) parts.push(esc(tx('ui.sold_lbl')) + ' <b>' + b.soldDelta.toLocaleString('en-US') + '</b>');
    if (b.healthDelta) parts.push(esc(tx('ui.health_lbl')) + ' <span class="' + (b.healthDelta > 0 ? 'adv-up' : 'adv-down') + '">' + (b.healthDelta > 0 ? '+' : '−') + Math.abs(b.healthDelta) + '</span>');
    return '<div class="adv-brief">' +
        '<div class="adv-brief-t">' + esc(tx('ui.briefing')) + ' · ' + esc(tx('ui.days_lbl', { n: b.days })) + '</div>' +
        '<div class="adv-brief-l">' + parts.join(' · ') + '</div></div>';
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

function renderTabs(count, tab) {
    function tabBtn(id, label, extra) {
        var on = tab === id;
        return '<button type="button" role="tab" class="adv-tab" id="adv-t-' + id + '" data-adv-tab="' + id + '" ' +
            'aria-selected="' + (on ? 'true' : 'false') + '" aria-controls="adv-p-' + id + '" tabindex="' + (on ? '0' : '-1') + '">' +
            esc(label) + (extra || '') + '</button>';
    }
    return '<div class="adv-tabs" role="tablist">' +
        tabBtn('advice', tx('ui.advice'), '<span class="adv-count" data-adv-count' + (count ? '' : ' hidden') + '>' + count + '</span>') +
        tabBtn('chat', tx('ui.chat')) +
        '</div>';
}

function renderMsg(m) {
    var acts = '';
    if (m.role === 'bot' && m.actions && m.actions.length) {
        acts = '<div class="adv-acts">' + m.actions.map(function (a) {
            if (a.report) return '<button class="btn-primary advisor-btn" type="button" data-adv-report="' + esc(a.report) + '">' + esc(a.label) + '</button>';
            if (a.patch) return '<button class="btn-primary advisor-btn" type="button" data-adv-patch="' + esc(a.patch) + '" data-adv-ver="' + esc(a.ver || '') + '">' + esc(a.label) + '</button>';
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

// onDone: dipanggil setelah laporan berhasil disalin (dipakai untuk menandai saran selesai).
function handleReport(advisor, mode, id, onDone) {
    if (mode === 'open') { Modal.close(MODAL_ID, true); openDiagnosticModal(); return; }
    var text = '';
    try { text = advisor.buildBugReportText(); } catch (e) {}
    if (!text) { ToastService.warning(tx('ui.report_failed')); return; }
    copyText(text).then(function () {
        ToastService.success(tx('ui.report_copied'));
        if (id && has(advisor, 'markDone')) advisor.markDone(id);
        if (onDone) onDone();
    }, function () { ToastService.warning(tx('ui.report_failed')); });
}

// Pertahankan fokus keyboard/pointer pada tombol yang sama setelah panel diperbarui.
function keepFocus(node, fn) {
    var ae = document.activeElement, sel = null;
    if (ae && node.contains(ae) && ae.attributes) {
        for (var i = 0; i < ae.attributes.length; i++) {
            var at = ae.attributes[i];
            if (at.name.indexOf('data-adv-') === 0) {
                sel = '[' + at.name + '="' + (window.CSS && CSS.escape ? CSS.escape(at.value) : at.value.replace(/"/g, '\\"')) + '"]';
                break;
            }
        }
    }
    fn();
    if (sel) {
        var el = node.querySelector(sel);
        if (el) { try { el.focus({ preventScroll: true }); } catch (e) {} }
    }
}

export function openAdvisor(advisor) {
    ensureStyles();
    var chat = advisor.getChat();
    var briefing = null;
    try { briefing = advisor.getBriefing(); } catch (e) {}

    var st = { filter: 'all', expanded: false, doneOpen: false };
    var caps = capsOf(advisor);
    var tab = realOnly(safeList(advisor)).length > 0 ? 'advice' : 'chat';
    var node = null;
    var unsubs = [];
    var busy = false;

    function cleanup() {
        unsubs.forEach(function (u) { try { u(); } catch (e) {} });
        unsubs = [];
    }
    // Modal sudah tertutup / diganti -> lepas pendengar event agar tidak bocor.
    function alive() {
        if (node && node.isConnected) return true;
        cleanup();
        return false;
    }

    var html = '' +
        '<div class="adv-head">' +
            '<div class="adv-avatar">' + gIcon('spark', 18) + '</div>' +
            '<div class="adv-hd-txt"><div class="modal-title" style="margin:0">' + esc(tx('ui.title')) + '</div>' +
            '<div class="modal-sub adv-sub" data-adv-summary style="margin:0"></div></div>' +
            '<button type="button" class="adv-health" data-adv-health aria-expanded="false"></button>' +
        '</div>' +
        '<div class="adv-hbox" data-adv-hbox hidden><div data-adv-hbox-body></div></div>' +
        renderBriefingLine(briefing) +
        renderTabs(realOnly(safeList(advisor)).length, tab) +
        '<div class="adv-panel adv-advice" data-adv-panel="advice" id="adv-p-advice" role="tabpanel" aria-labelledby="adv-t-advice"' + (tab === 'advice' ? '' : ' hidden') + '>' +
            '<div class="adv-toolbar">' +
                '<div class="adv-filters" data-adv-filterbar role="group" aria-label="' + esc(tx('ui.advice')) + '"></div>' +
                '<span class="adv-live"><i aria-hidden="true"></i>' + esc(tx('ui.live')) + '</span>' +
            '</div>' +
            '<div data-adv-flashes aria-live="polite"></div>' +
            '<div class="advisor-list" data-adv-list></div>' +
            '<div data-adv-more></div>' +
            '<div data-adv-donebox></div>' +
        '</div>' +
        '<div class="adv-panel adv-chatp" data-adv-panel="chat" id="adv-p-chat" role="tabpanel" aria-labelledby="adv-t-chat"' + (tab === 'chat' ? '' : ' hidden') + '>' +
            '<div class="adv-row"><button class="adv-link" type="button" data-adv-clear>' + esc(tx('ui.clear')) + '</button></div>' +
            '<div class="adv-chat" data-adv-chat role="log" aria-live="polite" aria-label="' + esc(tx('ui.chat')) + '">' + chat.map(renderMsg).join('') + '</div>' +
            '<div class="adv-chips" data-adv-chips>' + renderChips(chat[chat.length - 1].chips) + '</div>' +
            '<div class="adv-inputrow">' +
                '<input class="advisor-input" type="text" maxlength="300" data-adv-input autocomplete="off" enterkeyhint="send" aria-label="' + esc(tx('ui.chat')) + '" placeholder="' + esc(tx('ui.ask_ph')) + '">' +
                '<button class="btn-primary advisor-btn adv-send" type="button" data-adv-send="1" aria-label="' + esc(tx('ui.ask_send')) + '">' + gIcon('send', 16) + '</button>' +
            '</div>' +
        '</div>' +
        '<button class="btn-secondary adv-close" data-modal-close type="button">' + esc(tx('ui.close')) + '</button>';

    Modal.open(MODAL_ID, html, { onClose: cleanup });

    node = document.querySelector('[data-modal-id="' + MODAL_ID + '"]');
    if (!node) return;
    try { advisor.markSeen(); } catch (e) {}

    var log = node.querySelector('[data-adv-chat]');
    var chipsEl = node.querySelector('[data-adv-chips]');
    var input = node.querySelector('[data-adv-input]');
    function scroll() { if (log) log.scrollTop = log.scrollHeight; }
    scroll();

    // ---------- pembaruan langsung ----------
    function paintHead() {
        var hh = healthOf(advisor);
        var sum = node.querySelector('[data-adv-summary]');
        if (sum) sum.textContent = call(advisor, 'getSummary', [], '');
        var hb = node.querySelector('[data-adv-health]');
        if (hb) {
            hb.textContent = hh.score + '/100';
            hb.className = 'adv-health band-' + healthBand(hh.score);
            hb.setAttribute('aria-label', tx('ui.health') + ' ' + hh.score + '/100');
        }
        var hbody = node.querySelector('[data-adv-hbox-body]');
        if (hbody) hbody.innerHTML = renderHealthBox(hh);
    }

    function paintTabs() {
        var c = realOnly(safeList(advisor)).length;
        var el = node.querySelector('[data-adv-count]');
        if (el) { el.textContent = String(c); el.hidden = c === 0; }
    }

    function renderAdvice() {
        var all = safeList(advisor);
        var real = realOnly(all);
        var counts = { all: real.length, urgent: 0, info: 0 };
        real.forEach(function (a) { counts[isUrgent(a) ? 'urgent' : 'info']++; });

        node.querySelector('[data-adv-filterbar]').innerHTML = ['all', 'urgent', 'info'].map(function (f) {
            var on = st.filter === f;
            return '<button type="button" class="adv-filter" data-adv-filter="' + f + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
                esc(tx('ui.filter_' + f)) + ' <span class="n">' + counts[f] + '</span></button>';
        }).join('');

        // Tanpa saran nyata, tampilkan kartu "Semua terkendali" apa adanya.
        var list = real.length ? real.filter(function (a) { return matchFilter(a, st.filter); }) : all;
        var visible = st.expanded ? list : list.slice(0, PREVIEW_N);
        var listEl = node.querySelector('[data-adv-list]');
        var pos = listEl.scrollTop;
        listEl.innerHTML = visible.length
            ? visible.map(function (a) { return renderItem(a, caps.done); }).join('')
            : '<div class="adv-empty">' + esc(tx('ui.empty_filter')) + '</div>';
        listEl.scrollTop = pos;

        node.querySelector('[data-adv-more]').innerHTML = list.length > PREVIEW_N
            ? '<button class="adv-more" type="button" data-adv-more-btn>' +
              esc(st.expanded ? tx('ui.hide') : tx('ui.show_all')) + ' (' + list.length + ')</button>'
            : '';

        var dbox = node.querySelector('[data-adv-donebox]');
        var done = caps.done ? call(advisor, 'getDone', [], []) : [];
        if (!done.length) {
            dbox.innerHTML = '';
        } else {
            dbox.innerHTML = '<details class="adv-done" data-adv-details' + (st.doneOpen ? ' open' : '') + '>' +
                '<summary>' + gIcon('check-circle', 14) + esc(tx('ui.done_count', { n: done.length })) + '</summary>' +
                done.map(function (d) {
                    return '<div class="adv-done-row"><span class="t">' + esc(d.title) + '</span>' +
                        '<button type="button" class="adv-undo" data-adv-undo="' + esc(d.id) + '">' + esc(tx('ui.undo')) + '</button></div>';
                }).join('') + '</details>';
            var det = dbox.querySelector('[data-adv-details]');
            if (det) det.addEventListener('toggle', function () { st.doneOpen = det.open; });
        }
    }

    function renderAll() {
        try {
            keepFocus(node, function () { paintHead(); paintTabs(); renderAdvice(); });
        } catch (e) { console.warn('[AdvisorPanel] render gagal:', e); }
    }

    // Notifikasi kecil "Beres: ..." saat saran hilang karena sudah dikerjakan.
    function showFlash(items) {
        var box = node.querySelector('[data-adv-flashes]');
        if (!box || !items || !items.length) return;
        items.slice(0, 2).forEach(function (a) {
            var el = document.createElement('div');
            el.className = 'adv-flash';
            el.setAttribute('role', 'status');
            el.innerHTML = gIcon('check-circle', 16) + '<span>' + esc(tx('ui.beres', { t: a.title })) + '</span>';
            box.appendChild(el);
            setTimeout(function () {
                el.classList.add('out');
                setTimeout(function () { el.remove(); }, 400);
            }, FLASH_MS);
        });
        while (box.children.length > 3) box.removeChild(box.firstChild);
    }

    function setTab(name) {
        if (name !== 'advice' && name !== 'chat') return;
        tab = name;
        node.querySelectorAll('[data-adv-tab]').forEach(function (b) {
            var on = b.dataset.advTab === name;
            b.setAttribute('aria-selected', on ? 'true' : 'false');
            b.tabIndex = on ? 0 : -1;
        });
        node.querySelectorAll('[data-adv-panel]').forEach(function (p) {
            p.hidden = p.dataset.advPanel !== name;
        });
        if (name === 'chat') scroll();
    }

    // Saat game berjalan: daftar dan lencana ikut berubah; saran yang beres memunculkan "Beres".
    unsubs.push(bus.on('advisor:updated', function () { if (alive()) renderAll(); }));
    unsubs.push(bus.on('advisor:resolved', function (p) { if (alive()) showFlash(p && p.items); }));

    // Tekan chip tidak boleh memindahkan fokus: keyboard tetap seperti semula.
    chipsEl.addEventListener('pointerdown', function (e) {
        if (e.target.closest('[data-adv-chip]')) e.preventDefault();
    });

    // opts.fromInput: true hanya jika pesan diketik/dikirim lewat kolom input.
    async function send(text, opts) {
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
        var res = null;
        try { res = await advisor.chat(text); }
        catch (e) { res = { role: 'bot', text: tx('ui.ask_fail'), actions: [], chips: [] }; }
        var wait = Math.max(0, 380 - (Date.now() - started));
        await new Promise(function (r) { setTimeout(r, wait); });
        typing.remove();
        if (res && res.clearChat) {
            log.innerHTML = advisor.getChat().map(renderMsg).join('');
            chipsEl.innerHTML = renderChips(res.chips);
            scroll();
            busy = false;
            if (opts && opts.fromInput && input) input.focus();
            return;
        }
        if (res) {
            log.insertAdjacentHTML('beforeend', renderMsg(res));
            chipsEl.innerHTML = renderChips(res.chips);
            if (res.navigate) {
                setTimeout(function () { bus.emit('advisor:go', { nav: res.navigate.nav, subtab: res.navigate.subtab || null }); }, 650);
            }
        }
        scroll();
        busy = false;
        if (opts && opts.fromInput && input) input.focus();
    }

    renderAll();

    node.addEventListener('click', guard(function (e) {
        var t;
        if ((t = e.target.closest('[data-adv-tab]'))) { setTab(t.dataset.advTab); return; }
        if ((t = e.target.closest('[data-adv-filter]'))) {
            st.filter = t.dataset.advFilter;
            st.expanded = false;
            keepFocus(node, renderAdvice);
            return;
        }
        if ((t = e.target.closest('[data-adv-more-btn]'))) {
            st.expanded = !st.expanded;
            keepFocus(node, renderAdvice);
            return;
        }
        if ((t = e.target.closest('[data-adv-go]'))) {
            bus.emit('advisor:go', { nav: t.dataset.advNav, subtab: t.dataset.advSubtab || null });
            return;
        }
        if ((t = e.target.closest('[data-adv-done]'))) {
            if (advisor.markDone(t.dataset.advDone)) {
                try { ToastService.success(tx('ui.done_ok')); } catch (err) {}
            }
            renderAll();
            return;
        }
        if ((t = e.target.closest('[data-adv-undo]'))) {
            advisor.undoDone(t.dataset.advUndo);
            renderAll();
            return;
        }
        if ((t = e.target.closest('[data-adv-patch]'))) {
            if (t.dataset.advPatch === 'reload') { advisor.applyUpdate(); t.disabled = true; return; }
            advisor.ackPatch(t.dataset.advVer);
            t.disabled = true;
            renderAll();
            return;
        }
        if ((t = e.target.closest('[data-adv-report]'))) {
            handleReport(advisor, t.dataset.advReport, t.dataset.advId || '', renderAll);
            return;
        }
        if ((t = e.target.closest('[data-adv-snooze]'))) {
            advisor.snooze(t.dataset.advSnooze);
            renderAll();
            return;
        }
        if ((t = e.target.closest('[data-adv-health]'))) {
            var box = node.querySelector('[data-adv-hbox]');
            box.hidden = !box.hidden;
            t.setAttribute('aria-expanded', box.hidden ? 'false' : 'true');
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
        if ((t = e.target.closest('[data-adv-chip]'))) { send(t.dataset.advChip); return; }
        if (e.target.closest('[data-adv-send]')) send(input.value, { fromInput: true });
    }));

    // Navigasi keyboard antar tab (panah kiri/kanan), sesuai pola ARIA tablist.
    node.querySelector('.adv-tabs').addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var next = tab === 'advice' ? 'chat' : 'advice';
        setTab(next);
        var nb = node.querySelector('[data-adv-tab="' + next + '"]');
        if (nb) nb.focus();
        e.preventDefault();
    });

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); send(input.value, { fromInput: true }); }
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
        var b = call(advisor, 'getBadge', [], { count: 0, critical: 0, total: 0 });
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
