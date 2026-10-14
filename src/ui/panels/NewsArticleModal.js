// FILE: src/ui/panels/NewsArticleModal.js
// v2027.13c — i18n.
import { Modal } from '../modal.js';
import { t } from '../../core/LanguageService.js';

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

export function openNewsArticleModal(article) {
    if (!article) return;

    // Mark as read
    try {
        var game = window.__game;
        if (game && game.news && game.news.markRead) {
            game.news.markRead(article.id);
        }
    } catch (e) {}

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

    var html =
        '<div class="news-article">' +

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

        '<div class="news-footer">' +
        '<div class="news-footer-meta">' + t('news_article.from', { source: escapeHtml(article.source), type: escapeHtml(article.sourceType || 'media') }) + '</div>' +
        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:10px;">' + t('news_article.close') + '</button>' +
        '</div>' +

        '</div>';

    Modal.open('news-article', html);
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
