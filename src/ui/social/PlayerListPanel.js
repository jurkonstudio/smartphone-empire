// FILE: src/ui/social/PlayerListPanel.js
// v1.0 — Modal daftar pemain.
import { Modal } from '../modal.js';
import { ToastService } from '../../core/ToastService.js';
import { CloudService } from '../../services/CloudService.js';
import { openPlayerProfileModal } from './PlayerProfileModal.js';

function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function _avatar(profile) {
    var src = profile.company_name || profile.display_name || '?';
    var initial = src.charAt(0).toUpperCase();
    return '<div style="width:38px;height:38px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0;">' +
        _esc(initial) + '</div>';
}

function _rowHtml(p) {
    var name = p.company_name || p.display_name || '(tanpa nama)';
    var year = p.founded_year || '—';
    return '<button type="button" data-player-id="' + _esc(p.id) + '" ' +
        'style="width:100%;background:var(--bg-2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:8px;display:flex;align-items:center;gap:10px;text-align:left;cursor:pointer;">' +
        _avatar(p) +
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

export async function openPlayerListModal() {
    var html = '' +
        '<div class="modal-title">👥 Pemain</div>' +
        '<div class="modal-sub">Daftar perusahaan pemain lain</div>' +
        '<div data-player-list style="margin-top:8px;max-height:60vh;overflow-y:auto;">' +
            _stateMsg('Memuat...') +
        '</div>' +
        '<button type="button" class="btn-secondary" data-modal-close style="width:100%;margin-top:12px;padding:10px;">Tutup</button>';

    Modal.open('player-list', html);
    var root = document.querySelector('[data-modal-id="player-list"]');
    if (!root) return;

    var listEl = root.querySelector('[data-player-list]');

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
        return;
    }

    if (listEl) listEl.innerHTML = others.map(_rowHtml).join('');
}
