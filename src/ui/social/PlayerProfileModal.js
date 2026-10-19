// FILE: src/ui/social/PlayerProfileModal.js
// v2.2 — Menampilkan Umur Akun Real-Life & Terakhir Aktif.
// v2.3 — Menampilkan ID Pemain (publik, ketuk untuk menyalin) bila server menyediakannya.
import { Modal } from '../modal.js';
import { LanguageService, t } from '../../core/LanguageService.js';
import { avatarHtml, resolveAvatarUrls, esc } from './AvatarView.js';
import { pidTf, copyPublicId } from './PlayerIdView.js';

var MONTHS = {
    id: ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'],
    en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
};

function _lang() { var l = 'en'; try { l = LanguageService.getLang(); } catch (e) {} return MONTHS[l] ? l : 'en'; }

function _fmtFounded(year, month) {
    if (!year) return '—';
    var m = (month >= 1 && month <= 12) ? MONTHS[_lang()][month - 1] + ' ' : '';
    return m + year;
}

function _fmtDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    try { return d.toLocaleDateString(_lang() === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return '—'; }
}

function _timeAgo(iso) {
    if (!iso) return '—';
    var date = new Date(iso);
    var diffMs = Date.now() - date.getTime();
    var diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return diffMins + ' mnt lalu';
    var diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return diffHrs + ' jam lalu';
    var diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 30) return diffDays + ' hari lalu';
    return _fmtDate(iso);
}

// Menghitung umur akun dalam hitungan hari/bulan real-life
function _accountAge(iso) {
    if (!iso) return '—';
    var date = new Date(iso);
    var diffMs = Date.now() - date.getTime();
    var days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Hari ini';
    if (days < 30) return days + ' Hari';
    var months = Math.floor(days / 30);
    if (months < 12) return months + ' Bulan';
    var years = Math.floor(months / 12);
    return years + ' Tahun ' + (months % 12) + ' Bln';
}

export function compactNumber(n) {
    n = Number(n) || 0;
    if (n >= 1e12) return (n / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
    if (n >= 1e9)  return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (n >= 1e6)  return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3)  return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(Math.round(n));
}

function _stat(label, value) {
    return '<div class="pf-mini"><div class="pf-mini-label">' + esc(label) + '</div><div class="pf-mini-value">' + esc(value) + '</div></div>';
}

export async function openPlayerProfileModal(profile) {
    if (!profile) return;

    var company = profile.company_name || t('pp.lb.no_name');
    var player = profile.display_name || '';
    var urls = {};
    try { urls = await resolveAvatarUrls([profile]); } catch (e) {}

    var age = _accountAge(profile.created_at);
    var lastSeen = _timeAgo(profile.updated_at);

    var html =
        '<div class="modal-title">' + esc(t('pp.view.title')) + '</div>' +
        '<div class="pf-view-hero">' +
            avatarHtml({ src: urls[profile.id], name: company, size: 84, cls: 'pp-avatar-lg' }) +
            '<div class="pf-view-company">' + esc(company) + '</div>' +
            (player ? '<div class="pf-view-player">' + esc(player) + '</div>' : '') +
            (profile.public_id ? '<button type="button" class="pf-id-chip" data-copy-pid="' + esc(profile.public_id) + '">' +
                esc(pidTf('pp.id.label', 'ID Pemain')) + ' <b>' + esc(profile.public_id) + '</b></button>' : '') +
        '</div>' +
        '<div class="pf-mini-grid">' +
            _stat(t('pp.stats.revenue'), '$' + compactNumber(profile.stat_revenue)) +
            _stat(t('pp.stats.sold'), compactNumber(profile.stat_sold)) +
            _stat(t('pp.stats.reputation'), Number(profile.stat_reputation || 0).toFixed(1)) +
            _stat(t('pp.stats.share'), Number(profile.stat_share || 0).toFixed(1) + '%') +
        '</div>' +
        '<div class="sum-row"><span>⏳ Lama Bermain</span><b style="color:var(--accent);">' + esc(age) + '</b></div>' +
        '<div class="sum-row"><span>🟢 Terakhir Aktif</span><b>' + esc(lastSeen) + '</b></div>' +
        '<div class="sum-row"><span>' + esc(t('pp.view.joined')) + '</span><b>' + esc(_fmtDate(profile.created_at)) + '</b></div>' +
        '<div class="sum-row"><span>' + esc(t('pp.view.founded')) + '</span><b>' + esc(_fmtFounded(profile.founded_year, profile.founded_month)) + '</b></div>' +
        '<button type="button" class="btn-secondary" data-modal-close style="width:100%;margin-top:16px;padding:10px;">' + esc(t('pp.view.close')) + '</button>';

    Modal.open('player-profile', html);
    var chip = document.querySelector('[data-modal-id="player-profile"] [data-copy-pid]');
    if (chip) chip.addEventListener('click', function () { copyPublicId(chip.getAttribute('data-copy-pid')); });
}
