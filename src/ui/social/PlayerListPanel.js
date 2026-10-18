// FILE: src/ui/social/PlayerListPanel.js
// v2.3 — Menghilangkan ikon hijau (emoji 🟢 dan dot avatar) dari tampilan Leaderboard.
// v2.4 — i18n (Fase 2): waktu relatif ("Baru saja", "x mnt lalu", ...) & format tanggal lewat key/lokal bahasa aktif;
//        modal leaderboard render ulang saat 'lang:changed' (listener dilepas saat modal ditutup);
//        listener presence yang terlambat dilepas bila modal sudah tertutup.
import { Modal } from '../modal.js';
import { ToastService } from '../../core/ToastService.js';
import { CloudService } from '../../services/CloudService.js';
import { t, LanguageService } from '../../core/LanguageService.js';
import { bus } from '../../core/EventBus.js';
import { openPlayerProfileModal, compactNumber } from './PlayerProfileModal.js';
import { avatarHtml, resolveAvatarUrls, esc } from './AvatarView.js';

var SORTS = [
    { id: 'revenue',    field: 'stat_revenue',    fmt: function (v) { return '$' + compactNumber(v); } },
    { id: 'sold',       field: 'stat_sold',       fmt: function (v) { return compactNumber(v); } },
    { id: 'reputation', field: 'stat_reputation', fmt: function (v) { return Number(v || 0).toFixed(1); } },
    { id: 'share',      field: 'stat_share',      fmt: function (v) { return Number(v || 0).toFixed(1) + '%'; } },
    { id: 'recent',     field: 'stat_revenue',    fmt: function (v) { return '$' + compactNumber(v); } }
];

var _unsubPresence = null;
var _onlineIds = {};
var _rows = [];
var _avatars = {};
var _sort = 'revenue';
var _seq = 0;
var _unsubLang = null;
var _msgFn = null;   // pembuat HTML pesan status (loading/error/kosong) saat ini — agar bisa diterjemahkan ulang

function _isEn() {
    try { return LanguageService.getLang() === 'en'; } catch (e) { return false; }
}

// _tf(key, fbId, fbEn, vars): terjemahan jika key ada, kalau belum pakai fallback sesuai bahasa aktif.
function _tf(key, fbId, fbEn, vars) {
    var v = t(key, vars);
    if (v && v !== key) return v;
    var s = (_isEn() && fbEn !== undefined) ? fbEn : fbId;
    if (vars) s = String(s).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
    return s;
}

function _sortDef() { return SORTS.filter(function (s) { return s.id === _sort; })[0] || SORTS[0]; }
function _cleanup() {
    if (_unsubPresence) { try { _unsubPresence(); } catch (e) {} _unsubPresence = null; }
    if (_unsubLang) { try { _unsubLang(); } catch (e) {} _unsubLang = null; }
    _msgFn = null;
}
function _showMsg(listEl, fn) { _msgFn = fn; if (listEl) listEl.innerHTML = fn(); }
function _stateMsg(text, color) { return '<div class="pf-lb-msg"' + (color ? ' style="color:' + color + ';"' : '') + '>' + esc(text) + '</div>'; }

// Fungsi untuk mengubah tanggal menjadi "2 jam lalu", "3 hari lalu", dll.
function _timeAgo(iso) {
    if (!iso) return '—';
    var date = new Date(iso);
    var diffMs = Date.now() - date.getTime();
    var diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return _tf('pp.time.just_now', 'Baru saja', 'Just now');
    if (diffMins < 60) return _tf('pp.time.min_ago', '{n} mnt lalu', '{n} min ago', { n: diffMins });
    var diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return _tf('pp.time.hour_ago', '{n} jam lalu', '{n} hr ago', { n: diffHrs });
    var diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 30) return _tf('pp.time.day_ago', '{n} hari lalu', '{n} days ago', { n: diffDays });
    
    return date.toLocaleDateString(_isEn() ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short' });
}

function _rankBadge(i) {
    var medals = ['🥇', '🥈', '🥉'];
    if (_sort !== 'recent' && i < 3) return '<span class="pf-lb-rank is-medal">' + medals[i] + '</span>';
    return '<span class="pf-lb-rank">' + (_sort === 'recent' ? '' : (i + 1)) + '</span>';
}

function _rowHtml(p, i, myId) {
    var def = _sortDef();
    var name = p.company_name || t('pp.lb.no_name');
    var sub = [];
    
    if (p.display_name) sub.push(p.display_name);
    
    // PERUBAHAN 1: Menghilangkan emoji 🟢
    if (p.updated_at) {
        sub.push(_timeAgo(p.updated_at));
    }
    
    var me = p.id === myId;
    return '<button type="button" class="pf-lb-row' + (me ? ' is-me' : '') + '" data-player-id="' + esc(p.id) + '">' +
        _rankBadge(i) +
        // PERUBAHAN 2: Menghapus dotId: p.id agar dot hijau di avatar hilang
        avatarHtml({ src: _avatars[p.id], name: name, size: 38 }) +
        '<span class="pf-lb-main">' +
            '<span class="pf-lb-name">' + esc(name) + (me ? ' <em class="pf-lb-you">' + esc(t('pp.lb.you')) + '</em>' : '') + '</span>' +
            '<span class="pf-lb-sub">' + esc(sub.join(' · ') || '—') + '</span>' +
        '</span>' +
        '<span class="pf-lb-metric">' + esc(def.fmt(p[def.field])) + '</span>' +
    '</button>';
}

function _applyOnline(root) {
    var dots = root.querySelectorAll('[data-online-dot]');
    for (var i = 0; i < dots.length; i++) {
        dots[i].classList.toggle('is-online', !!_onlineIds[dots[i].dataset.onlineDot]);
    }
    var el = root.querySelector('[data-lb-sub]');
    if (!el) return;
    if (!_rows.length) { el.textContent = t('pp.lb.sub'); return; }
    var on = 0;
    _rows.forEach(function (r) { if (_onlineIds[r.id]) on++; });
    el.textContent = t('pp.lb.online', { on: on, total: _rows.length });
}

function _renderList(root) {
    var listEl = root.querySelector('[data-lb-list]');
    var meEl = root.querySelector('[data-lb-me]');
    var myId = CloudService.getUserId();
    if (!listEl) return;

    if (!_rows.length) {
        _showMsg(listEl, function () { return _stateMsg(t('pp.lb.empty')); });
        if (meEl) meEl.style.display = 'none';
        return;
    }
    _msgFn = null;
    listEl.innerHTML = _rows.map(function (p, i) { return _rowHtml(p, i, myId); }).join('');

    if (meEl) {
        var idx = -1;
        _rows.forEach(function (r, i) { if (r.id === myId) idx = i; });
        if (idx >= 0 && _sort !== 'recent') {
            meEl.textContent = t('pp.lb.my_rank', { n: idx + 1, total: _rows.length });
            meEl.style.display = 'block';
        } else {
            meEl.style.display = 'none';
        }
    }
    _applyOnline(root);
}

async function _load(root) {
    var listEl = root.querySelector('[data-lb-list]');
    var seq = ++_seq;
    _showMsg(listEl, function () { return _stateMsg(t('pp.lb.loading')); });

    var res = await CloudService.listProfiles(_sort);
    if (seq !== _seq) return;   
    if (!res || !res.ok) {
        var code = (res && res.code) || 'unknown';
        _showMsg(listEl, function () {
            var msg = code === 'db_setup' ? t('pp.lb.db_setup') : t('pp.lb.load_fail', { code: code });
            return _stateMsg(msg, 'var(--danger)');
        });
        return;
    }
    _rows = res.rows || [];
    try { _avatars = await resolveAvatarUrls(_rows); } catch (e) { _avatars = {}; }
    if (seq !== _seq) return;
    _renderList(root);
}

export async function openPlayerListModal(initialSort) {
    _cleanup();
    _onlineIds = {};
    _rows = [];
    _avatars = {};
    if (initialSort && SORTS.some(function (s) { return s.id === initialSort; })) _sort = initialSort;

    var chips = SORTS.map(function (s) {
        return '<button type="button" class="pf-chip' + (s.id === _sort ? ' active' : '') + '" data-lb-sort="' + s.id + '">' +
            esc(t('pp.lb.sort.' + s.id)) + '</button>';
    }).join('');

    _msgFn = function () { return _stateMsg(t('pp.lb.loading')); };

    var html =
        '<div class="modal-title" data-lb-title>🏆 ' + esc(t('pp.lb.title')) + '</div>' +
        '<div class="modal-sub" data-lb-sub>' + esc(t('pp.lb.sub')) + '</div>' +
        '<div class="pf-chips">' + chips + '</div>' +
        '<div class="pf-lb-me" data-lb-me style="display:none;"></div>' +
        '<div class="pf-lb-list" data-lb-list>' + _msgFn() + '</div>' +
        '<button type="button" class="btn-secondary" data-modal-close data-lb-close style="width:100%;margin-top:12px;padding:10px;">' + esc(t('common.tutup')) + '</button>';

    Modal.open('player-list', html, { onClose: _cleanup });
    var root = document.querySelector('[data-modal-id="player-list"]');
    if (!root) return;

    // Ganti bahasa: terjemahkan ulang judul, chip sortir, tombol tutup, dan isi daftar / pesan status.
    // Satu listener per modal; melepas dirinya sendiri bila modal sudah tertutup (Modal.close silent).
    if (_unsubLang) { try { _unsubLang(); } catch (e) {} }
    _unsubLang = bus.on('lang:changed', function () {
        if (!root.isConnected || !Modal.isOpen('player-list')) { _cleanup(); return; }
        var titleEl = root.querySelector('[data-lb-title]');
        if (titleEl) titleEl.textContent = '🏆 ' + t('pp.lb.title');
        root.querySelectorAll('[data-lb-sort]').forEach(function (c) { c.textContent = t('pp.lb.sort.' + c.dataset.lbSort); });
        var closeEl = root.querySelector('[data-lb-close]');
        if (closeEl) closeEl.textContent = t('common.tutup');
        var listEl2 = root.querySelector('[data-lb-list]');
        if (_rows.length) _renderList(root);
        else {
            if (listEl2 && _msgFn) listEl2.innerHTML = _msgFn();
            _applyOnline(root);
        }
    });

    var closeBtn = root.querySelector('[data-modal-close]');
    if (closeBtn) closeBtn.addEventListener('click', _cleanup);

    root.addEventListener('click', async function (e) {
        var chip = e.target.closest('[data-lb-sort]');
        if (chip) {
            e.preventDefault();
            _sort = chip.dataset.lbSort;
            root.querySelectorAll('[data-lb-sort]').forEach(function (c) { c.classList.toggle('active', c === chip); });
            _load(root);
            return;
        }
        var row = e.target.closest('[data-player-id]');
        if (!row || row.disabled) return;
        e.preventDefault();
        row.disabled = true;
        var r = await CloudService.getProfileById(row.dataset.playerId);
        if (!r || !r.ok || !r.profile) {
            ToastService.error(t('pp.view.fail'));
            row.disabled = false;
            return;
        }
        _cleanup();
        Modal.close('player-list', true);
        openPlayerProfileModal(r.profile);
    });

    var listEl = root.querySelector('[data-lb-list]');
    if (!CloudService.isAvailable()) { _showMsg(listEl, function () { return _stateMsg(t('pp.lb.not_configured'), 'var(--danger)'); }); return; }
    if (!CloudService.getUserId()) { _showMsg(listEl, function () { return _stateMsg(t('pp.lb.need_login'), 'var(--warn)'); }); return; }

    await _load(root);

    var unsubP = await CloudService.subscribePresence({ at: Date.now() }, function (ids) {
        _onlineIds = {};
        (ids || []).forEach(function (id) { _onlineIds[id] = true; });
        _applyOnline(root);
    });
    // Modal bisa sudah ditutup saat menunggu subscribe: lepas langsung agar tidak bocor.
    if (!root.isConnected || !Modal.isOpen('player-list')) {
        if (typeof unsubP === 'function') { try { unsubP(); } catch (e) {} }
        return;
    }
    _unsubPresence = unsubP;
}
