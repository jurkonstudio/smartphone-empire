// FILE: src/ui/social/PlayerProfileModal.js
// v1.0 — Modal profil pemain lain.
import { Modal } from '../modal.js';

function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

var MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function _fmtFounded(year, month) {
    if (!year) return '—';
    var m = (month >= 1 && month <= 12) ? MONTHS[month - 1] + ' ' : '';
    return m + year;
}

function _fmtDate(iso) {
    if (!iso) return '—';
    try {
        var d = new Date(iso);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return '—'; }
}

export function openPlayerProfileModal(profile) {
    if (!profile) return;

    var name = profile.company_name || profile.display_name || '(tanpa nama)';
    var initial = name.charAt(0).toUpperCase();
    var founded = _fmtFounded(profile.founded_year, profile.founded_month);
    var lastActive = _fmtDate(profile.updated_at);
    var joined = _fmtDate(profile.created_at);

    var html = '' +
        '<div class="modal-title">👤 Profil Pemain</div>' +
        '<div class="modal-sub">' + _esc(name) + '</div>' +
        '<div style="display:flex;flex-direction:column;align-items:center;padding:18px 0 14px 0;">' +
            '<div style="width:80px;height:80px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:800;margin-bottom:12px;letter-spacing:-0.02em;">' +
                _esc(initial) +
            '</div>' +
            '<div style="font-size:17px;font-weight:700;color:var(--text-primary);text-align:center;word-break:break-word;">' +
                _esc(name) +
            '</div>' +
        '</div>' +
        '<div class="sum-row"><span>Didirikan</span><b>' + _esc(founded) + '</b></div>' +
        '<div class="sum-row"><span>Bergabung</span><b>' + _esc(joined) + '</b></div>' +
        '<div class="sum-row"><span>Terakhir aktif</span><b>' + _esc(lastActive) + '</b></div>' +
        '<button type="button" class="btn-secondary" data-modal-close style="width:100%;margin-top:16px;padding:10px;">Tutup</button>';

    Modal.open('player-profile', html);
}
