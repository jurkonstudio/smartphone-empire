// FILE: src/ui/panels/InboxPanel.js  (BARU)
// ============================================================
// InboxPanel — panel "Pesan": notifikasi SIL terisi + pesan dari admin.
// Dibuka dari tombol ✉ di Header (data-inbox-open) atau tombol "Buka" pada toast.
// ============================================================
import { Modal } from '../modal.js';
import { bus } from '../../core/EventBus.js';
import { InboxService } from '../../services/InboxService.js';
import { CloudService } from '../../services/CloudService.js';
import { ToastService } from '../../core/ToastService.js';

var MODAL_ID = 'inbox-modal';
var _open = {};                 // id pesan yang sedang dibuka (expanded)

function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function ago(iso) {
    var sec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (sec < 45) return 'baru saja';
    var m = Math.round(sec / 60); if (m < 60) return m + ' menit lalu';
    var h = Math.round(m / 60); if (h < 24) return h + ' jam lalu';
    var d = Math.round(h / 24); if (d < 30) return d + ' hari lalu';
    return new Date(iso).toLocaleDateString('id-ID');
}

var KIND = {
    sil:    { rgb: '52,199,89',  label: 'SIL',    ico: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9 10.5c0-1 1.3-1.7 3-1.7s3 .7 3 1.7-1.3 1.5-3 1.8-3 .8-3 1.8 1.3 1.7 3 1.7 3-.7 3-1.7"/>' },
    admin:  { rgb: '10,132,255', label: 'Admin',  ico: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>' },
    system: { rgb: '255,159,10', label: 'Sistem', ico: '<path d="M12 4l9 16H3z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.2" r=".6" fill="currentColor"/>' }
};

function ensureStyle() {
    if (typeof document === 'undefined' || document.getElementById('ib-style')) return;
    var css = [
        '.header-inbox{position:relative}',
        '.header-inbox-badge{position:absolute;top:-4px;right:-4px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;',
        'box-sizing:border-box;background:#ff453a;color:#fff;font:700 10px/16px -apple-system,sans-serif;text-align:center;pointer-events:none}',
        '.header-inbox-badge[hidden]{display:none}',
        '.ib-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}',
        '.ib-title{flex:1;font-size:17px;font-weight:700}',
        '.ib-sub{font-size:12px;color:var(--text-tertiary,#8e8e93);margin-top:2px}',
        '.ib-btn{border:0;background:transparent;color:var(--accent,#0a84ff);font:600 12px -apple-system,sans-serif;padding:8px 10px;border-radius:10px;cursor:pointer;min-height:36px}',
        '.ib-btn:active{background:rgba(10,132,255,.15)}.ib-btn[disabled]{opacity:.35;pointer-events:none}',
        '.ib-list{max-height:min(62vh,520px);overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;margin:0 -4px;padding:0 4px}',
        '.ib-item{--rgb:10,132,255;display:flex;gap:10px;align-items:flex-start;padding:12px 10px;border-radius:14px;',
        'background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.04);cursor:pointer;-webkit-tap-highlight-color:transparent}',
        '.ib-item+.ib-item{margin-top:6px}',
        '.ib-item.ib-unread{background:rgba(var(--rgb),.14);border-color:rgba(var(--rgb),.25)}',
        '.ib-ico{flex:0 0 auto;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;',
        'background:rgba(var(--rgb),.18);color:rgb(var(--rgb))}',
        '.ib-ico svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
        '.ib-body{flex:1;min-width:0}',
        '.ib-t{font-size:14px;font-weight:700;display:flex;gap:6px;align-items:center}',
        '.ib-dot{width:8px;height:8px;border-radius:50%;background:rgb(var(--rgb));flex:0 0 auto}',
        '.ib-m{font-size:13px;line-height:1.45;margin-top:3px;word-break:break-word;white-space:pre-wrap;',
        'display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;color:var(--text-secondary,#c7c7cc)}',
        '.ib-item.ib-exp .ib-m{-webkit-line-clamp:unset;display:block}',
        '.ib-meta{margin-top:5px;font-size:11px;color:var(--text-tertiary,#8e8e93);display:flex;gap:6px}',
        '.ib-meta b{font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:rgb(var(--rgb));font-size:10px}',
        '.ib-x{flex:0 0 auto;width:32px;height:32px;margin:-4px -4px 0 0;border:0;border-radius:50%;background:transparent;',
        'color:var(--text-tertiary,#8e8e93);font-size:18px;cursor:pointer}.ib-x:active{background:rgba(255,255,255,.1)}',
        '.ib-empty{padding:36px 16px;text-align:center;color:var(--text-tertiary,#8e8e93);font-size:13px;line-height:1.5}',
        '.ib-foot{display:flex;justify-content:space-between;gap:8px;margin-top:12px}'
    ].join('');
    var el = document.createElement('style');
    el.id = 'ib-style';
    el.textContent = css;
    document.head.appendChild(el);
}
ensureStyle();

function listHtml() {
    var items = InboxService.getItems();
    if (!items.length) {
        return '<div class="ib-empty">Belum ada pesan.<br>Notifikasi SIL masuk dan pesan dari admin akan muncul di sini.</div>';
    }
    var h = '';
    for (var i = 0; i < items.length; i++) {
        var m = items[i], k = KIND[m.kind] || KIND.admin, unread = !m.read_at;
        h += '<div class="ib-item' + (unread ? ' ib-unread' : '') + (_open[m.id] ? ' ib-exp' : '') + '" style="--rgb:' + k.rgb + '" data-ib-id="' + m.id + '">' +
            '<span class="ib-ico"><svg viewBox="0 0 24 24" aria-hidden="true">' + k.ico + '</svg></span>' +
            '<div class="ib-body"><div class="ib-t">' + (unread ? '<span class="ib-dot"></span>' : '') + '<span>' + esc(m.title) + '</span></div>' +
            '<div class="ib-m">' + esc(m.body) + '</div>' +
            '<div class="ib-meta"><b>' + k.label + '</b><span>·</span><span>' + esc(ago(m.created_at)) + '</span></div></div>' +
            '<button type="button" class="ib-x" data-ib-del="' + m.id + '" aria-label="Hapus">×</button></div>';
    }
    return h;
}

function refresh() {
    var root = document.querySelector('[data-modal-id="' + MODAL_ID + '"]');
    if (!root) return;
    var list = root.querySelector('.ib-list'), sub = root.querySelector('.ib-sub');
    var un = InboxService.getUnread(), total = InboxService.getItems().length;
    if (list) list.innerHTML = listHtml();
    if (sub) sub.textContent = total ? (un ? un + ' belum dibaca · ' + total + ' pesan' : total + ' pesan') : '';
    var rd = root.querySelector('[data-ib-readall]'), cl = root.querySelector('[data-ib-clear]');
    if (rd) rd.disabled = un === 0;
    if (cl) cl.disabled = total === 0;
}

export function openInboxPanel() {
    if (CloudService.getStatus() !== 'connected') {
        ToastService.error('Masuk ke akun Cloud dulu untuk melihat pesan.');
        return;
    }
    ensureStyle();
    var html =
        '<div class="ib-head"><div style="flex:1"><div class="ib-title">Pesan</div><div class="ib-sub"></div></div>' +
        '<button type="button" class="ib-btn" data-modal-close aria-label="Tutup">Tutup</button></div>' +
        '<div class="ib-list"></div>' +
        '<div class="ib-foot"><button type="button" class="ib-btn" data-ib-readall>Tandai semua dibaca</button>' +
        '<button type="button" class="ib-btn" data-ib-clear>Hapus semua</button></div>';
    var node = Modal.open(MODAL_ID, html);
    node.addEventListener('click', function (e) {
        var tg = e.target; if (!tg || !tg.closest) return;
        if (tg.closest('[data-ib-readall]')) { InboxService.markAllRead(); return; }
        if (tg.closest('[data-ib-clear]')) {
            if (tg.closest('[data-ib-clear]').dataset.sure === '1') { InboxService.clear(); return; }
            var b = tg.closest('[data-ib-clear]'); b.dataset.sure = '1'; b.textContent = 'Ketuk lagi untuk hapus';
            setTimeout(function () { if (b.isConnected) { b.dataset.sure = ''; b.textContent = 'Hapus semua'; } }, 3000);
            return;
        }
        var del = tg.closest('[data-ib-del]');
        if (del) { InboxService.remove(Number(del.getAttribute('data-ib-del'))); return; }
        var it = tg.closest('[data-ib-id]');
        if (it) {
            var id = Number(it.getAttribute('data-ib-id'));
            _open[id] = !_open[id];
            InboxService.markRead([id]);
            refresh();
        }
    });
    refresh();
    InboxService.refresh();
}

bus.on('inbox:open', function () { openInboxPanel(); });
bus.on('inbox:changed', function () { if (Modal.isOpen(MODAL_ID)) refresh(); });
