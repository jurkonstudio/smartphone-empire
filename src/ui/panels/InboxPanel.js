// FILE: src/ui/panels/InboxPanel.js  (REPLACE — v2: + tulis pesan antar pemain, balas, blokir, laporkan)
// ============================================================
// InboxPanel — panel "Pesan": notifikasi SIL, pesan admin, dan pesan antar pemain.
// Dibuka dari tombol ✉ di Header (data-inbox-open), tombol "Buka" pada toast, atau
// tombol "Kirim pesan" di profil pemain (openInboxCompose).
// ============================================================
import { Modal } from '../modal.js';
import { bus } from '../../core/EventBus.js';
import { InboxService } from '../../services/InboxService.js';
import { CloudService } from '../../services/CloudService.js';
import { ToastService } from '../../core/ToastService.js';

var MODAL_ID = 'inbox-modal';
var _open = {};                                   // id pesan yang sedang dibuka
var _view = 'list';                               // 'list' | 'compose' | 'blocks'
var _cmp = { pid: '', name: '', body: '', ok: false, seq: 0, timer: null };
var _note = '';                                   // info singkat di atas daftar

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
    system: { rgb: '255,159,10', label: 'Sistem', ico: '<path d="M12 4l9 16H3z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.2" r=".6" fill="currentColor"/>' },
    player: { rgb: '168,85,247', label: 'Pemain', ico: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>' }
};

function ensureStyle() {
    if (typeof document === 'undefined' || document.getElementById('ib-style')) return;
    var css = [
        '.header-inbox{position:relative}',
        '.header-inbox-badge{position:absolute;top:-4px;right:-4px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;',
        'box-sizing:border-box;background:#ff453a;color:#fff;font:700 10px/16px -apple-system,sans-serif;text-align:center;pointer-events:none}',
        '.header-inbox-badge[hidden]{display:none}',
        '.ib-head{display:flex;align-items:center;gap:4px;margin-bottom:10px}',
        '.ib-title{font-size:17px;font-weight:700}',
        '.ib-sub{font-size:12px;color:var(--text-tertiary,#8e8e93);margin-top:2px;min-height:14px}',
        '.ib-btn{border:0;background:transparent;color:var(--accent,#0a84ff);font:600 12px -apple-system,sans-serif;padding:8px 10px;border-radius:10px;cursor:pointer;min-height:36px}',
        '.ib-btn:active{background:rgba(10,132,255,.15)}.ib-btn[disabled]{opacity:.35;pointer-events:none}',
        '.ib-btn.ib-pri{background:var(--accent,#0a84ff);color:#fff;padding:8px 16px}',
        '.ib-btn.ib-dng{color:#ff453a}',
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
        '.ib-meta{margin-top:5px;font-size:11px;color:var(--text-tertiary,#8e8e93);display:flex;gap:6px;flex-wrap:wrap}',
        '.ib-meta b{font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:rgb(var(--rgb));font-size:10px}',
        '.ib-acts{display:flex;gap:2px;margin:6px -6px -4px}',
        '.ib-x{flex:0 0 auto;width:32px;height:32px;margin:-4px -4px 0 0;border:0;border-radius:50%;background:transparent;',
        'color:var(--text-tertiary,#8e8e93);font-size:18px;cursor:pointer}.ib-x:active{background:rgba(255,255,255,.1)}',
        '.ib-empty{padding:36px 16px;text-align:center;color:var(--text-tertiary,#8e8e93);font-size:13px;line-height:1.5}',
        '.ib-foot{display:flex;justify-content:space-between;gap:4px;margin-top:12px}',
        '.ib-note{margin:0 0 8px;padding:8px 10px;border-radius:10px;font-size:12px;background:rgba(52,199,89,.15);color:#34c759}',
        '.ib-lb{display:block;margin:10px 0 4px;font-size:12px;color:var(--text-tertiary,#8e8e93)}',
        '.ib-in{width:100%;box-sizing:border-box;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:10px;',
        'padding:10px 12px;color:inherit;font:inherit;font-size:14px;outline:none}.ib-in:focus{border-color:var(--accent,#0a84ff)}',
        'textarea.ib-in{resize:none;min-height:110px}',
        '.ib-who{min-height:18px;margin-top:6px;font-size:12px}.ib-who.ok{color:#34c759}.ib-who.er{color:#ff453a}',
        '.ib-err{margin-top:8px;font-size:12px;color:#ff453a}'
    ].join('');
    var el = document.createElement('style');
    el.id = 'ib-style';
    el.textContent = css;
    document.head.appendChild(el);
}
ensureStyle();

function root() { return document.querySelector('[data-modal-id="' + MODAL_ID + '"]'); }

// ---------------------------------------------------------------- tampilan
function itemsHtml() {
    var items = InboxService.getItems();
    if (!items.length) {
        return '<div class="ib-empty">Belum ada pesan.<br>Notifikasi SIL, pesan admin, dan pesan dari pemain lain muncul di sini.</div>';
    }
    var h = '';
    for (var i = 0; i < items.length; i++) {
        var m = items[i], k = KIND[m.kind] || KIND.admin, unread = !m.read_at, exp = !!_open[m.id];
        var canAct = exp && m.kind === 'player' && m.sender_public_id;
        h += '<div class="ib-item' + (unread ? ' ib-unread' : '') + (exp ? ' ib-exp' : '') + '" style="--rgb:' + k.rgb + '" data-ib-id="' + m.id + '">' +
            '<span class="ib-ico"><svg viewBox="0 0 24 24" aria-hidden="true">' + k.ico + '</svg></span>' +
            '<div class="ib-body"><div class="ib-t">' + (unread ? '<span class="ib-dot"></span>' : '') + '<span>' + esc(m.title) + '</span></div>' +
            '<div class="ib-m">' + esc(m.body) + '</div>' +
            '<div class="ib-meta"><b>' + k.label + '</b><span>·</span><span>' + esc(ago(m.created_at)) + '</span>' +
            (m.kind === 'player' && m.sender_public_id ? '<span>·</span><span>ID ' + esc(m.sender_public_id) + '</span>' : '') + '</div>' +
            (canAct ? '<div class="ib-acts">' +
                '<button type="button" class="ib-btn" data-ib-reply="' + esc(m.sender_public_id) + '" data-name="' + esc(m.sender_name || m.title) + '">Balas</button>' +
                '<button type="button" class="ib-btn ib-dng" data-ib-block="' + esc(m.sender_public_id) + '" data-name="' + esc(m.sender_name || m.title) + '">Blokir</button>' +
                '<button type="button" class="ib-btn ib-dng" data-ib-report="' + m.id + '">Laporkan</button></div>' : '') +
            '</div>' +
            '<button type="button" class="ib-x" data-ib-del="' + m.id + '" aria-label="Hapus">×</button></div>';
    }
    return h;
}

function setHead(title, sub, tools) {
    var r = root(); if (!r) return;
    r.querySelector('.ib-title').textContent = title;
    r.querySelector('.ib-sub').textContent = sub || '';
    r.querySelector('.ib-tools').innerHTML = tools || '';
}

function render() {
    var r = root(); if (!r) return;
    var v = r.querySelector('.ib-view');
    if (_view === 'compose') {
        setHead('Tulis pesan', 'Kirim pesan ke pemain lain', '<button type="button" class="ib-btn" data-ib-nav="list">‹ Kembali</button>');
        v.innerHTML =
            '<label class="ib-lb" for="ib-pid">ID Pemain</label>' +
            '<input class="ib-in" id="ib-pid" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="ID pemain (8 digit)" value="' + esc(_cmp.pid) + '">' +
            '<div class="ib-who" id="ib-who"></div>' +
            '<label class="ib-lb" for="ib-body">Pesan <span id="ib-cnt">' + _cmp.body.length + '/500</span></label>' +
            '<textarea class="ib-in" id="ib-body" maxlength="500" placeholder="Tulis pesan…">' + esc(_cmp.body) + '</textarea>' +
            '<div class="ib-err" id="ib-err"></div>' +
            '<div class="ib-foot"><button type="button" class="ib-btn" data-ib-nav="list">Batal</button>' +
            '<button type="button" class="ib-btn ib-pri" data-ib-send disabled>Kirim</button></div>';
        updateWho(); updateSend();
        return;
    }
    if (_view === 'blocks') {
        setHead('Pemain diblokir', '', '<button type="button" class="ib-btn" data-ib-nav="list">‹ Kembali</button>');
        v.innerHTML = '<div class="ib-empty">Memuat…</div>';
        InboxService.blocks().then(function (rows) {
            var vv = root() && root().querySelector('.ib-view'); if (!vv || _view !== 'blocks') return;
            if (!rows.length) { vv.innerHTML = '<div class="ib-empty">Tidak ada pemain yang diblokir.</div>'; return; }
            vv.innerHTML = '<div class="ib-list">' + rows.map(function (b) {
                return '<div class="ib-item" style="--rgb:168,85,247"><div class="ib-body"><div class="ib-t">' + esc(b.company_name || 'Pemain') +
                    '</div><div class="ib-meta"><span>ID ' + esc(b.public_id) + '</span></div></div>' +
                    '<button type="button" class="ib-btn" data-ib-unblock="' + esc(b.public_id) + '">Buka blokir</button></div>';
            }).join('') + '</div>';
        });
        return;
    }
    var un = InboxService.getUnread(), total = InboxService.getItems().length;
    setHead('Pesan', total ? (un ? un + ' belum dibaca · ' + total + ' pesan' : total + ' pesan') : '',
        '<button type="button" class="ib-btn" data-ib-nav="compose">✎ Tulis</button>');
    v.innerHTML = (_note ? '<div class="ib-note">' + esc(_note) + '</div>' : '') +
        '<div class="ib-list">' + itemsHtml() + '</div>' +
        '<div class="ib-foot"><button type="button" class="ib-btn" data-ib-readall' + (un ? '' : ' disabled') + '>Tandai dibaca</button>' +
        '<button type="button" class="ib-btn" data-ib-nav="blocks">Diblokir</button>' +
        '<button type="button" class="ib-btn ib-dng" data-ib-clear' + (total ? '' : ' disabled') + '>Hapus semua</button></div>';
}

function updateSend() {
    var r = root(), b = r && r.querySelector('[data-ib-send]');
    if (b) b.disabled = !(_cmp.ok && _cmp.body.trim().length > 0);
}
function updateWho() {
    var r = root(), w = r && r.querySelector('#ib-who'); if (!w) return;
    if (_cmp.name && _cmp.ok) { w.className = 'ib-who ok'; w.textContent = 'Ke: ' + _cmp.name; }
    else if (_cmp.err) { w.className = 'ib-who er'; w.textContent = _cmp.err; }
    else { w.className = 'ib-who'; w.textContent = ''; }
}

function lookupSoon() {
    clearTimeout(_cmp.timer);
    _cmp.ok = false; _cmp.name = ''; _cmp.err = ''; updateWho(); updateSend();
    if (_cmp.pid.length < 6) return;
    var mine = ++_cmp.seq;
    _cmp.timer = setTimeout(function () {
        InboxService.lookup(Number(_cmp.pid)).then(function (r) {
            if (mine !== _cmp.seq) return;
            if (r && r.ok) { _cmp.ok = true; _cmp.name = r.company_name || r.player_name || ('ID ' + r.public_id); _cmp.err = ''; }
            else if (r && r.error === 'cannot_transfer_to_self') { _cmp.err = 'Itu ID kamu sendiri.'; }
            else if (r && r.error === 'player_not_found') { _cmp.err = 'ID pemain tidak ditemukan.'; }
            else { _cmp.err = 'Tidak bisa memeriksa ID. Coba lagi.'; }
            updateWho(); updateSend();
        });
    }, 350);
}

async function doSend() {
    var r = root(), btn = r && r.querySelector('[data-ib-send]'), err = r && r.querySelector('#ib-err');
    if (!btn || btn.disabled) return;
    btn.disabled = true; btn.textContent = 'Mengirim…'; if (err) err.textContent = '';
    var res = await InboxService.send(Number(_cmp.pid), _cmp.body.trim());
    if (!root()) return;
    if (res.ok) {
        _note = 'Pesan terkirim ke ' + (_cmp.name || 'pemain') + '.';
        _cmp = { pid: '', name: '', body: '', ok: false, seq: _cmp.seq + 1, timer: null };
        _view = 'list'; render();
    } else {
        btn.textContent = 'Kirim'; updateSend();
        var e2 = root().querySelector('#ib-err'); if (e2) e2.textContent = res.reason || 'Gagal mengirim.';
    }
}

// ---------------------------------------------------------------- buka panel
function ensureOpen() {
    if (Modal.isOpen(MODAL_ID) && root()) return root();
    if (CloudService.getStatus() !== 'connected') {
        ToastService.error('Masuk ke akun Cloud dulu untuk memakai Pesan.');
        return null;
    }
    ensureStyle();
    var html =
        '<div class="ib-head"><div style="flex:1;min-width:0"><div class="ib-title">Pesan</div><div class="ib-sub"></div></div>' +
        '<span class="ib-tools"></span>' +
        '<button type="button" class="ib-btn" data-modal-close aria-label="Tutup">Tutup</button></div>' +
        '<div class="ib-view"></div>';
    var node = Modal.open(MODAL_ID, html);
    node.addEventListener('click', onClick);
    node.addEventListener('input', onInput);
    return node;
}

export function openInboxPanel() {
    if (!ensureOpen()) return;
    _view = 'list'; render(); InboxService.refresh();
}

export function openInboxCompose(publicId, name) {
    if (!ensureOpen()) return;
    _cmp = { pid: String(publicId || ''), name: '', body: '', ok: false, seq: _cmp.seq + 1, timer: null };
    _view = 'compose'; render();
    if (_cmp.pid) lookupSoon();
}

function onInput(e) {
    var tg = e.target; if (!tg) return;
    if (tg.id === 'ib-pid') {
        var d = String(tg.value || '').replace(/\D/g, '');
        if (d !== tg.value) tg.value = d;
        _cmp.pid = d; lookupSoon();
    } else if (tg.id === 'ib-body') {
        _cmp.body = tg.value;
        var c = root().querySelector('#ib-cnt'); if (c) c.textContent = tg.value.length + '/500';
        updateSend();
    }
}

function onClick(e) {
    var tg = e.target; if (!tg || !tg.closest) return;
    var q = function (s) { return tg.closest(s); }, b;

    if ((b = q('[data-ib-nav]'))) { _view = b.getAttribute('data-ib-nav'); _note = ''; render(); return; }
    if (q('[data-ib-send]')) { doSend(); return; }
    if (q('[data-ib-readall]')) { InboxService.markAllRead(); return; }
    if ((b = q('[data-ib-clear]'))) {
        if (b.dataset.sure === '1') { InboxService.clear(); return; }
        b.dataset.sure = '1'; b.textContent = 'Ketuk lagi untuk hapus';
        setTimeout(function () { if (b.isConnected) { b.dataset.sure = ''; b.textContent = 'Hapus semua'; } }, 3000);
        return;
    }
    if ((b = q('[data-ib-del]'))) { InboxService.remove(Number(b.getAttribute('data-ib-del'))); return; }
    if ((b = q('[data-ib-reply]'))) {
        _cmp = { pid: b.getAttribute('data-ib-reply'), name: '', body: '', ok: false, seq: _cmp.seq + 1, timer: null };
        _view = 'compose'; render(); lookupSoon(); return;
    }
    if ((b = q('[data-ib-block]'))) {
        var nm = b.getAttribute('data-name') || 'pemain ini';
        if (!confirm('Blokir ' + nm + '? Kamu tidak akan menerima pesannya lagi.')) return;
        InboxService.block(Number(b.getAttribute('data-ib-block'))).then(function (r) {
            _note = r.ok ? nm + ' diblokir.' : (r.reason || 'Gagal memblokir.'); if (root()) render();
        });
        return;
    }
    if ((b = q('[data-ib-report]'))) {
        var why = prompt('Alasan laporan (opsional):', '');
        if (why === null) return;
        InboxService.report(Number(b.getAttribute('data-ib-report')), why).then(function (r) {
            _note = r.ok ? 'Laporan dikirim ke admin.' : (r.reason || 'Gagal melapor.'); if (root()) render();
        });
        return;
    }
    if ((b = q('[data-ib-unblock]'))) {
        InboxService.unblock(Number(b.getAttribute('data-ib-unblock'))).then(function () { if (root()) render(); });
        return;
    }
    if ((b = q('[data-ib-id]'))) {
        var id = Number(b.getAttribute('data-ib-id'));
        _open[id] = !_open[id];
        InboxService.markRead([id]);
        render();
    }
}

bus.on('inbox:open', function () { openInboxPanel(); });
bus.on('inbox:changed', function () { if (Modal.isOpen(MODAL_ID) && _view === 'list') render(); });
