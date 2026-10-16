// FILE: src/ui/social/PlayerListPanel.js
// v2.0 — LEADERBOARD pemain (urut per statistik profil) + indikator online.
import { Modal } from '../modal.js';
import { ToastService } from '../../core/ToastService.js';
import { CloudService } from '../../services/CloudService.js';
import { t } from '../../core/LanguageService.js';
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

function _sortDef() { return SORTS.filter(function (s) { return s.id === _sort; })[0] || SORTS[0]; }

function _cleanup() {
    if (_unsubPresence) { try { _unsubPresence(); } catch (e) {} _unsubPresence = null; }
}

function _stateMsg(text, color) {
    return '<div class="pf-lb-msg"' + (color ? ' style="color:' + color + ';"' : '') + '>' + esc(text) + '</div>';
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
    if (p.founded_year) sub.push(t('pp.lb.founded', { y: p.founded_year }));
    var me = p.id === myId;
    return '<button type="button" class="pf-lb-row' + (me ? ' is-me' : '') + '" data-player-id="' + esc(p.id) + '">' +
        _rankBadge(i) +
        avatarHtml({ src: _avatars[p.id], name: name, size: 38, dotId: p.id }) +
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
        listEl.innerHTML = _stateMsg(t('pp.lb.empty'));
        if (meEl) meEl.style.display = 'none';
        return;
    }
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
    if (listEl) listEl.innerHTML = _stateMsg(t('pp.lb.loading'));

    var res = await CloudService.listProfiles(_sort);
    if (seq !== _seq) return;   // ganti urutan saat memuat
    if (!res || !res.ok) {
        var code = (res && res.code) || 'unknown';
        var msg = code === 'db_setup' ? t('pp.lb.db_setup') : t('pp.lb.load_fail', { code: code });
        if (listEl) listEl.innerHTML = _stateMsg(msg, 'var(--danger)');
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

    var html =
        '<div class="modal-title">🏆 ' + esc(t('pp.lb.title')) + '</div>' +
        '<div class="modal-sub" data-lb-sub>' + esc(t('pp.lb.sub')) + '</div>' +
        '<div class="pf-chips">' + chips + '</div>' +
        '<div class="pf-lb-me" data-lb-me style="display:none;"></div>' +
        '<div class="pf-lb-list" data-lb-list>' + _stateMsg(t('pp.lb.loading')) + '</div>' +
        '<button type="button" class="btn-secondary" data-modal-close style="width:100%;margin-top:12px;padding:10px;">' + esc(t('common.tutup')) + '</button>';

    Modal.open('player-list', html, { onClose: _cleanup });
    var root = document.querySelector('[data-modal-id="player-list"]');
    if (!root) return;

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
    if (!CloudService.isAvailable()) { listEl.innerHTML = _stateMsg(t('pp.lb.not_configured'), 'var(--danger)'); return; }
    if (!CloudService.getUserId()) { listEl.innerHTML = _stateMsg(t('pp.lb.need_login'), 'var(--warn)'); return; }

    await _load(root);

    _unsubPresence = await CloudService.subscribePresence({ at: Date.now() }, function (ids) {
        _onlineIds = {};
        (ids || []).forEach(function (id) { _onlineIds[id] = true; });
        _applyOnline(root);
    });
}
