// FILE: src/ui/social/PlayerListPanel.js
// v1.1 — + indikator online (realtime presence).
import { Modal } from '../modal.js';
import { ToastService } from '../../core/ToastService.js';
import { CloudService } from '../../services/CloudService.js';
import { openPlayerProfileModal } from './PlayerProfileModal.js';

var _unsubPresence = null;
var _onlineIds = {};
var _allRows = [];

function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function _avatarInner(profile) {
    var src = profile.company_name || profile.display_name || '?';
    var initial = src.charAt(0).toUpperCase();
    return '<div style="width:38px;height:38px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;">' +
        _esc(initial) + '</div>';
}

function _avatarWithDot(profile) {
    return '<div style="position:relative;flex-shrink:0;width:38px;height:38px;">' +
        _avatarInner(profile) +
        '<span data-online-dot="' + _esc(profile.id) + '" style="position:absolute;bottom:0;right:0;width:12px;height:12px;border-radius:50%;background:var(--text-tertiary);border:2px solid var(--bg-2);transition:background 0.3s, box-shadow 0.3s;"></span>' +
        '</div>';
}

function _rowHtml(p) {
    var name = p.company_name || p.display_name || '(tanpa nama)';
    var year = p.founded_year || '—';
    return '<button type="button" data-player-id="' + _esc(p.id) + '" ' +
        'style="width:100%;background:var(--bg-2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:8px;display:flex;align-items:center;gap:10px;text-align:left;cursor:pointer;">' +
        _avatarWithDot(p) +
        '<div style="flex:1;min-width:0;">' +
            '<div style="font-weight:600;font-size:13px;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(name) + '</div>' +
            '<div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">Didirikan ' + _esc(year) + '</div>' +
        '</div>' +
        '<span style="color:var(--text-tertiary);font-size:18px;">›</span>' +
    '</button>';
}

function _stateMsg(text, color) {
    return '<div style="text-align:center;padding:24px 12px;color:' + (color || 'var(--text-mute)') + ';font-size:13px;line-height:1.5;">' + _esc(text) + '</div>';
}

function _applyOnlineDots(root) {
    if (!root) return;
    var dots = root.querySelectorAll('[data-online-dot]');
    for (var i = 0; i < dots.length; i++) {
        var id = dots[i].dataset.onlineDot;
        var isOnline = !!_onlineIds[id];
        if (isOnline) {
            dots[i].style.background = '#22c55e';
            dots[i].style.boxShadow = '0 0 6px rgba(34,197,94,0.7)';
        } else {
            dots[i].style.background = 'var(--text-tertiary)';
            dots[i].style.boxShadow = 'none';
        }
    }
}

function _updateOnlineCount(root) {
    var el = root && root.querySelector('[data-online-count]');
    if (!el) return;
    var onlineCount = 0;
    _allRows.forEach(function (r) { if (_onlineIds[r.id]) onlineCount++; });
    if (_allRows.length === 0) {
        el.textContent = 'Tidak ada pemain lain';
    } else {
        el.textContent = onlineCount + ' dari ' + _allRows.length + ' pemain online';
    }
}

function _cleanup() {
    if (_unsubPresence) {
        try { _unsubPresence(); } catch (e) {}
        _unsubPresence = null;
    }
}

export async function openPlayerListModal() {
    _cleanup();
    _onlineIds = {};
    _allRows = [];

    var html = '' +
        '<div class="modal-title">👥 Pemain</div>' +
        '<div class="modal-sub" data-online-count>Daftar perusahaan pemain lain</div>' +
        '<div data-player-list style="margin-top:8px;max-height:60vh;overflow-y:auto;">' +
            _stateMsg('Memuat...') +
        '</div>' +
        '<button type="button" class="btn-secondary" data-modal-close style="width:100%;margin-top:12px;padding:10px;">Tutup</button>';

    Modal.open('player-list', html);
    var root = document.querySelector('[data-modal-id="player-list"]');
    if (!root) return;

    var listEl = root.querySelector('[data-player-list]');

    // Cleanup saat tombol Tutup diklik
    var closeBtn = root.querySelector('[data-modal-close]');
    if (closeBtn) closeBtn.addEventListener('click', _cleanup);

    root.addEventListener('click', async function (e) {
        var row = e.target.closest('[data-player-id]');
        if (!row) return;
        e.preventDefault();
        if (row.disabled) return;
        row.disabled = true;

        var id = row.dataset.playerId;
        var r = await CloudService.getProfileById(id);
        if (!r || !r.ok || !r.profile) {
            ToastService.error('Gagal memuat profil.');
            row.disabled = false;
            return;
        }
        _cleanup();
        Modal.close('player-list', true);
        openPlayerProfileModal(r.profile);
    });

    if (!CloudService.isAvailable()) {
        if (listEl) listEl.innerHTML = _stateMsg('Cloud belum dikonfigurasi.', 'var(--danger)');
        return;
    }
    if (!CloudService.getUserId()) {
        if (listEl) listEl.innerHTML = _stateMsg('Login cloud dulu untuk melihat pemain lain.', 'var(--warn)');
        return;
    }

    var res = await CloudService.listProfiles();
    if (!res || !res.ok) {
        var code = (res && res.code) || 'unknown';
        var msg = code === 'db_setup'
            ? 'View public_profiles belum ada. Jalankan SQL di Supabase.'
            : ('Gagal memuat: ' + code);
        if (listEl) listEl.innerHTML = _stateMsg(msg, 'var(--danger)');
        return;
    }

    var rows = res.rows || [];
    var myId = CloudService.getUserId();
    var others = rows.filter(function (r) { return r && r.id !== myId; });

    if (!others.length) {
        if (listEl) listEl.innerHTML = _stateMsg('Belum ada pemain lain. Ajak temanmu bermain!');
        _updateOnlineCount(root);
        return;
    }

    _allRows = others;
    if (listEl) listEl.innerHTML = others.map(_rowHtml).join('');
    _updateOnlineCount(root);

    // Subscribe presence (realtime)
    _unsubPresence = await CloudService.subscribePresence(
        { at: Date.now() },
        function (ids) {
            _onlineIds = {};
            (ids || []).forEach(function (id) { _onlineIds[id] = true; });
            _applyOnlineDots(root);
            _updateOnlineCount(root);
        }
    );
}
