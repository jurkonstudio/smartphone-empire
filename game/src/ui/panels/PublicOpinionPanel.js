import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/panels/PublicOpinionPanel.js
// v2027.13c — i18n.
// Sub-tab Publik dalam tab Pasar. Menampilkan sentimen, feed, saran, viral.

import { t } from '../../core/LanguageService.js';


const ASPECT_LABELS = {
    design:      { key: 'opinion.aspect.design',      icon: '🎨' },
    camera:      { key: 'opinion.aspect.camera',      icon: '📷' },
    battery:     { key: 'opinion.aspect.battery',     icon: '🔋' },
    performance: { key: 'opinion.aspect.performance', icon: '⚡' },
    price:       { key: 'opinion.aspect.price',       icon: '💰' },
    reliability: { key: 'opinion.aspect.reliability', icon: '🛡️' },
    os:          { key: 'opinion.aspect.os',          icon: '💿' },
    support:     { key: 'opinion.aspect.support',     icon: '🎧' },
    display:      { key: 'opinion.aspect.display',      icon: '📱' },
    connectivity: { key: 'opinion.aspect.connectivity', icon: '📶' },
    usability:    { key: 'opinion.aspect.usability',    icon: '👆' }
};

// Teks respons viral dwibahasa (r.i18n); jatuh ke label Indonesia bila tidak ada.
function _respText(r, field) {
    var o = r && r.i18n && r.i18n[field];
    if (o && typeof o === 'object') {
        var lg = 'id';
        try { lg = (window.__game && window.__game.LanguageService && window.__game.LanguageService.getLang()) === 'en' ? 'en' : 'id'; } catch (e) {}
        return o[lg] || o.id || o.en || r[field] || '';
    }
    return (r && r[field]) || '';
}

function _sentimentLabel(sentiment) {
    if (sentiment >= 70) return t('opinion.sentiment.very_good');
    if (sentiment >= 55) return t('opinion.sentiment.good');
    if (sentiment >= 45) return t('opinion.sentiment.neutral');
    if (sentiment >= 30) return t('opinion.sentiment.bad');
    return t('opinion.sentiment.very_bad');
}

export function renderPublicOpinionPanel(params) {
    var opinionSystem = params.opinionSystem;
    const sentiment = Math.round(Number(opinionSystem.getSentiment()) || 0);
    const aspects = opinionSystem.getAspectSentiment();
    const feed = opinionSystem.getFeed(60);
    const viral = opinionSystem.getActiveViral();
    const suggestions = opinionSystem.getSuggestions();
    const perProduct = opinionSystem.getPerProductSatisfaction();
    const competitorSent = opinionSystem.getCompetitorSentiment();
    const data = window.__game.state.get();

    const sentLabel = _sentimentLabel(sentiment);
    const sentColor = sentiment >= 70 ? 'var(--accent)' : sentiment >= 55 ? 'var(--info)' : sentiment >= 45 ? 'var(--text)' : sentiment >= 30 ? 'var(--warn)' : 'var(--danger)';

    // ---- Kartu sentimen ----
    const sentimentHtml = `
        <div class="card">
            <div class="card-title">${t('opinion.sentiment.title')}</div>
            <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:8px;">
                <div style="font-size:28px;font-weight:800;color:${sentColor};">${sentiment}</div>
                <div style="font-size:13px;color:${sentColor};">${sentLabel}</div>
            </div>
            <div class="progress" style="height:6px;">
                <div class="progress-bar" style="width:${sentiment}%;background:${sentColor};"></div>
            </div>
        </div>
    `;

    // ---- Kartu per aspek ----
    const aspectRows = Object.keys(ASPECT_LABELS).map(function (k) {
        const v = Math.round(aspects[k] || 0);
        const label = ASPECT_LABELS[k];
        const col = v >= 70 ? 'var(--accent)' : v >= 45 ? 'var(--info)' : v >= 30 ? 'var(--warn)' : 'var(--danger)';
        return `
            <div style="margin-bottom:8px;">
                <div class="progress-label">
                    <span>${label.icon} ${t(label.key)}</span>
                    <span>${v}</span>
                </div>
                <div class="progress" style="height:5px;">
                    <div class="progress-bar" style="width:${v}%;background:${col};"></div>
                </div>
            </div>
        `;
    }).join('');
    const aspectHtml = `
        <div class="card">
            <div class="card-title">${t('opinion.aspects.title')}</div>
            ${aspectRows}
        </div>
    `;

    // ---- Perbandingan dengan kompetitor ----
    const comparisonRows = [];
    comparisonRows.push('<div class="sum-row"><span><b style="color:var(--accent);">' + t('opinion.comparison.you') + '</b></span><b>' + sentiment + '</b></div>');
    Object.keys(competitorSent).slice(0, 5).forEach(function (id) {
        const val = Math.round(competitorSent[id]);
        const comp = data.market.competitors.find(function (c) { return c.id === id; });
        if (!comp) return;
        comparisonRows.push('<div class="sum-row"><span>' + escapeHtml(comp.name) + '</span><b>' + val + '</b></div>');
    });
    const comparisonHtml = `
        <div class="card">
            <div class="card-title">${t('opinion.comparison.title')}</div>
            ${comparisonRows.join('')}
        </div>
    `;

    // ---- Viral aktif ----
    const viralHtml = viral.length ? `
        <div class="card" style="border-left:3px solid ${viral[0].type === 'positive' ? 'var(--accent)' : 'var(--danger)'};">
            <div class="card-title">${viral[0].type === 'positive' ? t('opinion.viral.positive') : t('opinion.viral.negative')}</div>
            ${viral.map(function (v) {
                const remaining = Math.ceil((v.endsAtMinute - data.time.elapsedGameMinutes) / (24 * 60));
                return `
                    <div style="margin-bottom:10px;">
                        <div style="font-size:13px;font-weight:600;color:${v.type === 'positive' ? 'var(--accent)' : 'var(--danger)'};">${escapeHtml(v.title)}</div>
                        <div style="font-size:11.5px;color:var(--text-dim);margin-top:2px;">${escapeHtml(v.text)}</div>
                        <div style="font-size:10.5px;color:var(--text-mute);margin-top:4px;">${t('opinion.viral.expires', { n: remaining })}</div>
                        ${v.type === 'negative' ? `
                            <button class="btn-secondary" data-viral-respond data-viral-id="${v.id}" style="margin-top:8px;width:100%;font-size:12px;padding:8px;">
                                ${t('opinion.viral.respond')}
                            </button>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    ` : '';

    // ---- Saran pelanggan ----
    const suggestionsHtml = suggestions.length ? `
        <div class="card">
            <div class="card-title">${t('opinion.suggestions.title')}</div>
            ${suggestions.map(function (s) {
                return '<div style="padding:8px 0;border-bottom:1px dashed var(--border);font-size:12.5px;">' +
                    '<div style="color:var(--text);">💡 ' + escapeHtml(s.text) + '</div>' +
                    '<div style="font-size:10.5px;color:var(--text-mute);margin-top:2px;">' + t('opinion.suggestions.score', { n: s.score }) + '</div>' +
                    '</div>';
            }).join('')}
        </div>
    ` : '';

    // ---- Kepuasan per produk ----
    const productRows = Object.keys(perProduct).slice(0, 5).map(function (pid) {
        const p = data.products.catalog.find(function (x) { return x.id === pid; });
        if (!p) return '';
        const score = Math.round(Number(perProduct[pid]) || 0);
        const col = score >= 70 ? 'var(--accent)' : score >= 45 ? 'var(--info)' : 'var(--warn)';
        return '<div class="sum-row">' +
            '<span>' + escapeHtml(p.name) + '</span>' +
            '<b style="color:' + col + ';">' + score + '/100</b>' +
            '</div>';
    }).filter(Boolean).join('');
    const productHtml = productRows ? `
        <div class="card">
            <div class="card-title">${t('opinion.per_product.title')}</div>
            ${productRows}
        </div>
    ` : '';

    // ---- Feed ulasan ----
    // v2028.41 — 15 terbaru tampil langsung, sisanya (maks. 60) dilipat di <details> (tanpa JS).
    const reviewRow = function (r) {
        const col = r.score >= 7 ? 'var(--accent)' : r.score >= 5 ? 'var(--info)' : r.score >= 3 ? 'var(--warn)' : 'var(--danger)';
        return `
                    <div style="padding:10px 0;border-bottom:1px dashed var(--border);">
                        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                            <div style="font-size:11.5px;color:var(--text-mute);">${escapeHtml(r.source)} • ${r.day}/${r.month}/${r.year}</div>
                            <div style="font-size:13px;font-weight:700;color:${col};">${r.score}/10</div>
                        </div>
                        <div style="font-size:12.5px;color:var(--text);margin-top:4px;line-height:1.5;">${escapeHtml(r.text)}</div>
                        ${r.productName ? '<div style="font-size:10.5px;color:var(--text-mute);margin-top:3px;">→ ' + escapeHtml(r.productName) + '</div>' : ''}
                    </div>
                `;
    };
    const FEED_SHOWN = 15;
    const feedMore = feed.length > FEED_SHOWN ? `
            <details style="margin-top:4px;">
                <summary style="cursor:pointer;font-size:12px;font-weight:600;color:var(--accent);padding:8px 0;">${t('opinion.feed.more', { n: feed.length - FEED_SHOWN })}</summary>
                ${feed.slice(FEED_SHOWN).map(reviewRow).join('')}
            </details>` : '';
    const feedHtml = feed.length ? `
        <div class="card">
            <div class="card-title">${t('opinion.feed.title', { n: feed.length })}</div>
            ${feed.slice(0, FEED_SHOWN).map(reviewRow).join('')}
            ${feedMore}
        </div>
    ` : `
        <div class="empty">
            <div class="empty-ico">💬</div>
            <div class="empty-title">${t('opinion.feed.empty')}</div>
            <div class="empty-desc">${t('opinion.feed.empty_desc')}</div>
        </div>
    `;

    return sentimentHtml + viralHtml + aspectHtml + comparisonHtml + suggestionsHtml + productHtml + feedHtml;
}

// ============================================================
// Modal pilih respons viral
// ============================================================
export function openViralResponseModal(params) {
    var viralId = params.viralId;
    const VIRAL_RESPONSES = window.__game.modules.feedbackData.VIRAL_RESPONSES;
    const html = `
        <div class="modal-title">${t('opinion.viral_modal.title')}</div>
        <div class="modal-sub">${t('opinion.viral_modal.sub')}</div>
        ${VIRAL_RESPONSES.map(function (r) {
            var costLabel = r.cost > 0 ? '$' + r.cost.toLocaleString('en-US') : t('opinion.viral_modal.free');
            return '<button class="wiz-option" data-viral-response-pick="' + r.id + '" data-viral-id="' + viralId + '" style="width:100%;margin-bottom:6px;text-align:left;">' +
                '<div class="wiz-opt-name">' + escapeHtml(_respText(r, 'label')) + '</div>' +
                '<div class="wiz-opt-meta">' + costLabel + ' • ' + escapeHtml(_respText(r, 'description')) + '</div>' +
                '</button>';
        }).join('')}
        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:8px;">${t('opinion.viral_modal.cancel')}</button>
    `;
    window.__game.Modal.open('viral-response', html);
}
