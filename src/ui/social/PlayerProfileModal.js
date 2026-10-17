// FILE: src/ui/social/PlayerProfileModal.js
// v2.1 — Menambahkan info Waktu Bermain & format tanggal yang lebih rapi.
import { Modal } from '../modal.js';
import { LanguageService, t } from '../../core/LanguageService.js';
import { avatarHtml, resolveAvatarUrls, esc } from './AvatarView.js';

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

function _formatPlaytime(minutes) {
    if (!minutes) return 'Baru mulai';
    var days = Math.floor(minutes / 1440);
    var years = Math.floor(days / 365);
    var months = Math.floor((days % 365) / 30);
    
    if (years > 0) {
        return years + ' Tahun' + (months > 0 ? ' ' + months + ' Bln' : '');
    }
    if (months > 0) return months + ' Bulan';
    return days + ' Hari';
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

    var playtime = _formatPlaytime(profile.game_minutes);

    var html =
        '<div class="modal-title">' + esc(t('pp.view.title')) + '</div>' +
        '<div class="pf-view-hero">' +
            avatarHtml({ src: urls[profile.id], name: company, size: 84, cls: 'pp-avatar-lg' }) +
            '<div class="pf-view-company">' + esc(company) + '</div>' +
            (player ? '<div class="pf-view-player">' + esc(player) + '</div>' : '') +
        '</div>' +
        '<div class="pf-mini-grid">' +
            _stat(t('pp.stats.revenue'), '$' + compactNumber(profile.stat_revenue)) +
            _stat(t('pp.stats.sold'), compactNumber(profile.stat_sold)) +
            _stat(t('pp.stats.reputation'), Number(profile.stat_reputation || 0).toFixed(1)) +
            _stat(t('pp.stats.share'), Number(profile.stat_share || 0).toFixed(1) + '%') +
        '</div>' +
        '<div class="sum-row"><span>⏳ Waktu Bermain</span><b style="color:var(--accent);">' + esc(playtime) + '</b></div>' +
        '<div class="sum-row"><span>' + esc(t('pp.view.founded')) + '</span><b>' + esc(_fmtFounded(profile.founded_year, profile.founded_month)) + '</b></div>' +
        '<div class="sum-row"><span>' + esc(t('pp.view.joined')) + '</span><b>' + esc(_fmtDate(profile.created_at)) + '</b></div>' +
        '<div class="sum-row"><span>' + esc(t('pp.view.last_active')) + '</span><b>' + esc(_fmtDate(profile.updated_at)) + '</b></div>' +
        '<button type="button" class="btn-secondary" data-modal-close style="width:100%;margin-top:16px;padding:10px;">' + esc(t('pp.view.close')) + '</button>';

    Modal.open('player-profile', html);
}
