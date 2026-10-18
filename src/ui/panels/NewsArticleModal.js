// FILE: src/ui/panels/NewsArticleModal.js
// v2027.13d — i18n penuh (Fase 2).
// Sesi 1: kotak "Reaksi Bursa" untuk berita rilis kompetitor.
// Perubahan: label Reaksi Bursa + regime pasar lewat t()/_tf(), tanpa ternary bahasa.
// Modal dirender ulang saat bus 'lang:changed' (listener dilepas saat modal tertutup).
import { Modal } from '../modal.js';
import { bus } from '../../core/EventBus.js';
import { LanguageService, t } from '../../core/LanguageService.js';

// _tf(key, fallbackId, fallbackEn): pakai terjemahan jika key ada di kamus,
// kalau belum (sebelum Fase 3) pakai fallback sesuai bahasa aktif.
function _tf(key, fbId, fbEn) {
    var v = t(key);
    if (v && v !== key) return v;
    var lang = 'id';
    try { lang = LanguageService.getLang(); } catch (e) {}
    return (lang === 'en' && fbEn !== undefined) ? fbEn : fbId;
}

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function _formatDate(createdAt) {
    if (!createdAt) return '-';
    var key = 'date.month_full.' + (createdAt.month || 1);
    var m = t(key);
    if (m === key) m = String(createdAt.month || 1);
    return createdAt.day + ' ' + m + ' ' + createdAt.year;
}

function _sentimentColor(sentiment) {
    if (sentiment === 'positive') return 'var(--success)';
    if (sentiment === 'negative') return 'var(--danger)';
    return 'var(--warn)';
}

function _sentimentLabel(sentiment) {
    if (sentiment === 'positive') return t('news.sentiment.positive');
    if (sentiment === 'negative') return t('news.sentiment.negative');
    return t('news.sentiment.mixed');
}

// Label regime pasar: key news_article.regime.<regime>
var REGIME_FALLBACK = {
    euphoria: ['Euforia', 'Euphoria'],
    bull:     ['Pasar naik', 'Bull market'],
    neutral:  ['Netral', 'Neutral'],
    bear:     ['Pasar turun', 'Bear market'],
    crash:    ['Krisis', 'Crash']
};

function _regimeLabel(regime) {
    var fb = REGIME_FALLBACK[regime];
    if (!fb) return String(regime || '');
    return _tf('news_article.regime.' + regime, fb[0], fb[1]);
}

function _marketReactionHtml(article) {
    var mi = article && article.marketImpact;
    if (!mi || typeof mi.pct !== 'number') return '';
    var pct = mi.pct * 100;
    var color = pct > 0 ? 'var(--success)' : (pct < 0 ? 'var(--danger)' : 'var(--warn)');
    var sign = pct > 0 ? '+' : '';
    var idx12 = (mi.indexReturn12m || 0) * 100;
    var idxSign = idx12 > 0 ? '+' : '';
    return '<div class="news-score-bar" style="margin-top:10px;display:block;">' +
        '<div class="news-score-label">' + escapeHtml(_tf('news_article.market_reaction', 'Reaksi bursa', 'Market reaction')) + '</div>' +
        '<div class="news-score-value" style="color:' + color + ';">' +
        escapeHtml(mi.ticker || '') + ' ' + sign + pct.toFixed(2) + '%' +
        '</div>' +
        '<div class="news-footer-meta" style="margin-top:4px;">' +
        escapeHtml(_tf('news_article.market_label', 'Pasar: ', 'Market: ')) + escapeHtml(_regimeLabel(mi.regime)) +
        ' (' + escapeHtml(_tf('news_article.index_12m', 'indeks 12 bln ', 'index 12m ')) + idxSign + idx12.toFixed(0) + '%)' +
        ' \u00b7 ' + escapeHtml(_tf('news_article.beta', 'beta', 'beta')) + ' ' + (mi.beta != null ? Number(mi.beta).toFixed(2) : '1.00') +
        '</div>' +
        '</div>';
}

function _buildHtml(article) {
    var paragraphsHtml = '';
    if (Array.isArray(article.paragraphs)) {
        for (var i = 0; i < article.paragraphs.length; i++) {
            paragraphsHtml += '<p class="news-para">' + escapeHtml(article.paragraphs[i]) + '</p>';
        }
    }

    var pullQuoteHtml = article.pullQuote
        ? '<div class="news-pullquote">' + escapeHtml(article.pullQuote) + '</div>'
        : '';

    var sentimentColor = _sentimentColor(article.sentiment);

    var bodyContent = paragraphsHtml;
    if (pullQuoteHtml) {
        bodyContent = _insertPullQuote(paragraphsHtml, pullQuoteHtml);
    }

    return '<div class="news-article">' +

        '<div class="news-masthead">' +
        '<div class="news-source">' + escapeHtml(article.source || t('news_article.redaksi')) + '</div>' +
        '<div class="news-source-meta">' +
        escapeHtml(article.sourceCountry || '') +
        ' - ' + escapeHtml(_formatDate(article.createdAt)) +
        '</div>' +
        '</div>' +

        '<h1 class="news-headline">' + escapeHtml(article.headline) + '</h1>' +
        '<div class="news-subheadline">' + escapeHtml(article.subheadline || '') + '</div>' +

        '<div class="news-byline">' +
        t('news_article.by') + ' <b>' + escapeHtml(article.byline || t('news_article.redaksi')) + '</b>' +
        '</div>' +

        '<div class="news-dateline">' +
        escapeHtml(article.dateline || t('news_article.global')) +
        ' - ' + escapeHtml(_formatDate(article.createdAt)) +
        '</div>' +

        '<div class="news-body">' + bodyContent + '</div>' +

        '<div class="news-score-bar">' +
        '<div class="news-score-label">' + t('news_article.score') + '</div>' +
        '<div class="news-score-value" style="color:' + sentimentColor + ';">' +
        article.score + ' / 10' +
        '</div>' +
        '<div class="news-score-sentiment" style="color:' + sentimentColor + ';">' +
        _sentimentLabel(article.sentiment) +
        '</div>' +
        '</div>' +

        _marketReactionHtml(article) +

        '<div class="news-footer">' +
        '<div class="news-footer-meta">' + t('news_article.from', { source: escapeHtml(article.source), type: escapeHtml(article.sourceType || 'media') }) + '</div>' +
        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:10px;">' + t('news_article.close') + '</button>' +
        '</div>' +

        '</div>';
}

export function openNewsArticleModal(article) {
    if (!article) return;

    // Mark as read
    try {
        var game = window.__game;
        if (game && game.news && game.news.markRead) {
            game.news.markRead(article.id);
        }
    } catch (e) {}

    var unsub = null;
    function cleanup() {
        if (unsub) { try { unsub(); } catch (e) {} unsub = null; }
    }

    var node = Modal.open('news-article', _buildHtml(article), { onClose: cleanup });

    unsub = bus.on('lang:changed', function () {
        // Modal.close(id, true) (silent) tidak memanggil onClose, jadi cek sendiri.
        if (!node || !node.isConnected || !Modal.isOpen('news-article')) { cleanup(); return; }
        var card = node.querySelector('.modal-card');
        if (!card) return;
        card.innerHTML = _buildHtml(article);
        var closeBtn = card.querySelector('[data-modal-close]');
        if (closeBtn) closeBtn.addEventListener('click', function () { Modal.close('news-article'); });
    });
}

function _insertPullQuote(bodyHtml, quoteHtml) {
    if (!quoteHtml) return bodyHtml;
    var count = 0;
    var idx = 0;
    var pos = -1;
    while (idx < bodyHtml.length) {
        var pEnd = bodyHtml.indexOf('</p>', idx);
        if (pEnd === -1) break;
        count++;
        if (count === 2) {
            pos = pEnd + 4;
            break;
        }
        idx = pEnd + 4;
    }
    if (pos === -1) return bodyHtml + quoteHtml;
    return bodyHtml.slice(0, pos) + quoteHtml + bodyHtml.slice(pos);
}
