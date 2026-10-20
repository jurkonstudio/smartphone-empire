import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/panels/CompetitorDetailModal.js
// v2027.14b — biografi transparan: factuality badge, milestones
// dengan penanda verified, trivia, sumber.
// v2027.50 — i18n tuntas: render dipisah (_buildHtml) + listener
//           lang:changed supaya modal yang terbuka ganti bahasa langsung.
import { Modal } from '../modal.js';
import { t } from '../../core/LanguageService.js';
import { bus } from '../../core/EventBus.js';


function _personalityLabel(p) {
    var map = {
        aggressive: 'market.personality.aggressive',
        premium:    'market.personality.premium',
        innovator:  'market.personality.innovator',
        follower:   'market.personality.follower',
        dominant:   'market.personality.dominant',
        declining:  'market.personality.declining'
    };
    var key = map[p];
    return key ? t(key) : p;
}

function _tf(key, fallback) {
    var v = t(key);
    return (v && v !== key) ? v : fallback;
}

function _getActualShare(competitorId, fallback) {
    try {
        var st = window.__game && window.__game.state ? window.__game.state.get() : null;
        if (st && st.market && Array.isArray(st.market.competitors)) {
            for (var i = 0; i < st.market.competitors.length; i++) {
                if (st.market.competitors[i].id === competitorId) {
                    var sh = st.market.competitors[i].share;
                    if (typeof sh === 'number') return sh;
                }
            }
        }
    } catch (e) { /* fallback */ }
    return fallback || 0;
}

// Badge status faktualitas
function _factualityBadge(factuality) {
    if (factuality === 'historical') {
        return '<div style="display:inline-block;font-size:10.5px;font-weight:700;padding:4px 8px;border-radius:6px;background:rgba(76,175,80,0.15);color:#4CAF50;border:1px solid rgba(76,175,80,0.35);">✓ ' +
            _tf('market.comp_detail.fact_historical', 'Berbasis fakta sejarah') + '</div>';
    }
    if (factuality === 'mixed') {
        return '<div style="display:inline-block;font-size:10.5px;font-weight:700;padding:4px 8px;border-radius:6px;background:rgba(255,152,0,0.15);color:#FF9800;border:1px solid rgba(255,152,0,0.35);">~ ' +
            _tf('market.comp_detail.fact_mixed', 'Campuran fakta & penyederhanaan game') + '</div>';
    }
    return '<div style="display:inline-block;font-size:10.5px;font-weight:700;padding:4px 8px;border-radius:6px;background:rgba(233,30,99,0.15);color:#E91E63;border:1px solid rgba(233,30,99,0.35);">✗ ' +
        _tf('market.comp_detail.fact_fictional', 'Fiksi untuk gameplay') + '</div>';
}

function _buildHtml(c) {

    // ==== Badge factuality ====
    const badgeHtml = _factualityBadge(c.factuality);

    // ==== Profil perusahaan ====
    var profileRows = '';
    if (c.foundedYear) {
        profileRows += '<div class="sum-row"><span>' + _tf('market.comp_detail.founded', 'Didirikan') + '</span><b>' + c.foundedYear + '</b></div>';
    }
    if (c.founder) {
        profileRows += '<div class="sum-row"><span>' + _tf('market.comp_detail.founder', 'Pendiri') + '</span><b>' + escapeHtml(c.founder) + '</b></div>';
    }
    if (c.hq) {
        profileRows += '<div class="sum-row"><span>' + _tf('market.comp_detail.hq', 'Kantor Pusat') + '</span><b>' + escapeHtml(c.hq) + '</b></div>';
    }
    if (c.parentCompany) {
        profileRows += '<div class="sum-row"><span>' + _tf('market.comp_detail.parent', 'Induk Perusahaan') + '</span><b>' + escapeHtml(c.parentCompany) + '</b></div>';
    }

    // ==== Asal usul ====
    var originHtml = '';
    if (c.origin) {
        originHtml =
            '<div class="card-title" style="margin-top:12px;">' + _tf('market.comp_detail.origin_title', 'Asal Usul') + '</div>' +
            '<div style="font-size:12px;color:var(--text-dim);line-height:1.6;">' + escapeHtml(c.origin) + '</div>';
    }

    // ==== Milestones (jejak sejarah) ====
    var milestonesHtml = '';
    if (Array.isArray(c.milestones) && c.milestones.length) {
        var rows = c.milestones.map(function (m) {
            var marker = m.verified
                ? '<span style="color:#4CAF50;font-weight:700;">✓</span>'
                : '<span style="color:#FF9800;font-weight:700;">~</span>';
            return '<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">' +
                '<div style="flex-shrink:0;width:44px;font-size:11.5px;font-weight:700;color:var(--accent);">' + m.year + '</div>' +
                '<div style="flex-shrink:0;width:12px;font-size:11px;text-align:center;padding-top:1px;">' + marker + '</div>' +
                '<div style="flex:1;font-size:12px;color:var(--text-dim);line-height:1.5;">' + escapeHtml(m.text) + '</div>' +
                '</div>';
        }).join('');

        milestonesHtml =
            '<div class="card-title" style="margin-top:12px;">' + _tf('market.comp_detail.milestones_title', 'Jejak Sejarah') + '</div>' +
            '<div style="font-size:10.5px;color:var(--text-mute);margin-bottom:6px;">' +
            '<span style="color:#4CAF50;font-weight:700;">✓</span> ' + _tf('market.comp_detail.verified_label', 'Terverifikasi') +
            ' · <span style="color:#FF9800;font-weight:700;">~</span> ' + _tf('market.comp_detail.approx_label', 'Perkiraan') +
            '</div>' +
            rows;
    }

    // ==== Fakta menarik ====
    var triviaHtml = '';
    if (Array.isArray(c.trivia) && c.trivia.length) {
        triviaHtml =
            '<div class="card-title" style="margin-top:12px;">' + _tf('market.comp_detail.trivia_title', 'Fakta Menarik') + '</div>' +
            c.trivia.map(function (tr) {
                return '<div style="font-size:12px;color:var(--text-dim);line-height:1.6;padding-left:10px;position:relative;margin-bottom:4px;">' +
                    '<span style="position:absolute;left:0;color:var(--accent);">·</span>' +
                    escapeHtml(tr) + '</div>';
            }).join('');
    }

    // ==== Catatan faktualitas + sumber ====
    var factNoteHtml = '';
    if (c.factNote || c.sources) {
        factNoteHtml = '<div style="margin-top:12px;padding:8px 10px;background:rgba(255,255,255,0.03);border-radius:8px;border-left:3px solid var(--text-mute);">';
        if (c.factNote) {
            factNoteHtml += '<div style="font-size:10.5px;color:var(--text-mute);text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">' +
                _tf('market.comp_detail.fact_note_label', 'Catatan Verifikasi') + '</div>' +
                '<div style="font-size:11.5px;color:var(--text-dim);line-height:1.5;margin-top:4px;">' + escapeHtml(c.factNote) + '</div>';
        }
        if (c.sources) {
            factNoteHtml += '<div style="font-size:10.5px;color:var(--text-mute);text-transform:uppercase;letter-spacing:0.5px;font-weight:700;margin-top:8px;">' +
                _tf('market.comp_detail.sources_label', 'Sumber') + '</div>' +
                '<div style="font-size:11px;color:var(--text-dim);line-height:1.5;margin-top:4px;">' + escapeHtml(c.sources) + '</div>';
        }
        factNoteHtml += '</div>';
    }

    // ==== Exit reason ====
    var exitHtml = '';
    if (c.exitReason) {
        exitHtml =
            '<div class="card-title" style="margin-top:12px;">' + _tf('market.comp_detail.exit_title', 'Keluar dari Pasar') + '</div>' +
            '<div style="font-size:12px;color:var(--warn);line-height:1.6;">' + escapeHtml(c.exitReason) + '</div>';
    }

    // ==== Signature products ====
    const signatureHtml = (c.signatureProducts || []).length
        ? c.signatureProducts.map(function (sp) {
            return '<div class="sum-row"><span>' + escapeHtml(sp.name) + '</span><b>' + sp.year + '</b></div>';
        }).join('')
        : '<div style="font-size:12px;color:var(--text-mute);">' + t('market.comp_detail.no_sig') + '</div>';

    // ==== Strengths / weaknesses ====
    const strengthsHtml = (c.strengths || []).map(function (s) {
        return '<div style="font-size:12px;color:var(--accent);">+ ' + escapeHtml(s) + '</div>';
    }).join('');
    const weaknessesHtml = (c.weaknesses || []).map(function (w) {
        return '<div style="font-size:12px;color:var(--warn);">− ' + escapeHtml(w) + '</div>';
    }).join('');

    var activeSuffix = c.activeToYear ? ' - ' + c.activeToYear : ' - ' + _tf('market.comp_detail.active_now', 'aktif');
    const activeLabel = c.activeFromYear + activeSuffix;
    const actualShare = _getActualShare(c.id, c.currentShare);

    const html = `
        <div class="modal-title">${escapeHtml(c.name)}</div>
        <div class="modal-sub">${escapeHtml(c.country || '')} • ${_personalityLabel(c.personality)}</div>
        <div style="margin-top:8px;">${badgeHtml}</div>

        ${profileRows ? `
            <div class="card-title" style="margin-top:12px;">${_tf('market.comp_detail.profile_title', 'Profil Perusahaan')}</div>
            ${profileRows}
        ` : ''}

        ${originHtml}

        <div class="card-title" style="margin-top:12px;">${_tf('market.comp_detail.market_title', 'Data Pasar')}</div>
        <div class="sum-row"><span>${t('market.comp_detail.os')}</span><b>${escapeHtml(c.osName || '-')}</b></div>
        <div class="sum-row"><span>${t('market.comp_detail.share')}</span><b>${(actualShare * 100).toFixed(1)}%</b></div>
        <div class="sum-row"><span>${t('market.comp_detail.tier')}</span><b>${(c.currentTier || 1).toFixed(1)}</b></div>
        <div class="sum-row"><span>${t('market.comp_detail.active')}</span><b>${activeLabel}</b></div>
        ${c.lastRelease ? '<div class="sum-row"><span>' + t('market.comp_detail.latest') + '</span><b>' + escapeHtml(c.lastRelease.name) + ' (' + c.lastRelease.year + ')</b></div>' : ''}

        ${milestonesHtml}

        ${triviaHtml}

        ${strengthsHtml || weaknessesHtml ? `
            <div class="card-title" style="margin-top:12px;">${t('market.comp_detail.str_weak')}</div>
            ${strengthsHtml}
            ${weaknessesHtml}
        ` : ''}

        <div class="card-title" style="margin-top:12px;">${t('market.comp_detail.signature')}</div>
        ${signatureHtml}

        ${exitHtml}
        ${factNoteHtml}

        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:12px;">${t('market.comp_detail.close')}</button>
    `;
    return html;
}

// ============================================================
// OPEN + LANG CHANGE
// ============================================================
var _current = null;   // data kompetitor yang sedang tampil di modal
var _langBound = false;

function _show(c) {
    Modal.open('competitor-detail', _buildHtml(c), {
        onClose: function () { _current = null; }
    });
}

function _bindLang() {
    if (_langBound) return;
    _langBound = true;
    bus.on('lang:changed', function () {
        if (_current && Modal.isOpen('competitor-detail')) _show(_current);
    });
}
_bindLang();

export function openCompetitorDetailModal(params) {
    var competitorData = params && params.competitorData;
    if (!competitorData) return;
    _current = competitorData;
    _show(competitorData);
}
