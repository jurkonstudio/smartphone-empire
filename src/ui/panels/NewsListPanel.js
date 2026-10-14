// FILE: src/ui/panels/NewsListPanel.js
// v2027.13a — i18n.
import { openNewsArticleModal } from './NewsArticleModal.js';
import { t } from '../../core/LanguageService.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function _shortHeadline(text) {
    if (!text) return '';
    if (text.length <= 80) return text;
    return text.slice(0, 77) + '...';
}

function _sentimentDot(sentiment) {
    if (sentiment === 'positive') return '<span class="news-dot positive"></span>';
    if (sentiment === 'negative') return '<span class="news-dot negative"></span>';
    return '<span class="news-dot mixed"></span>';
}

function _flag(country) {
    if (!country) return '';
    return '<span class="news-flag">' + escapeHtml(country.slice(0, 2).toUpperCase()) + '</span>';
}

export function renderNewsListPanel(state) {
    var articles = (state.news && state.news.articles) ? state.news.articles : [];
    var top = articles.slice(0, 3);

    if (!top.length) {
        return '<div class="card">' +
            '<div class="card-title">' + t('news.panel_title') + '</div>' +
            '<div class="log-empty">' + t('news.panel_empty') + '</div>' +
            '</div>';
    }

    var unread = 0;
    for (var u = 0; u < articles.length; u++) {
        if (!articles[u].read) unread++;
    }

    var rows = '';
    for (var i = 0; i < top.length; i++) {
        var a = top[i];
        var unreadCls = a.read ? '' : ' unread';
        rows +=
            '<div class="news-row' + unreadCls + '" data-news-id="' + a.id + '">' +
            '<div class="news-row-top">' +
            _flag(a.sourceCountry) +
            '<span class="news-row-source">' + escapeHtml(a.source) + '</span>' +
            _sentimentDot(a.sentiment) +
            '</div>' +
            '<div class="news-row-headline">' + escapeHtml(_shortHeadline(a.headline)) + '</div>' +
            '<div class="news-row-meta">' +
            escapeHtml(a.createdAt ? (a.createdAt.day + '/' + a.createdAt.month + '/' + a.createdAt.year) : '-') +
            ' - ' + t('news.score', { n: a.score }) +
            '</div>' +
            '</div>';
    }

    var badgeHtml = unread > 0
        ? ' <span class="news-badge">' + t('news.new_badge', { n: unread }) + '</span>'
        : '';

    return '<div class="card">' +
        '<div class="card-title">' + t('news.panel_title') + badgeHtml + '</div>' +
        '<div class="news-list">' + rows + '</div>' +
        '<button class="btn-secondary" data-news-action="open-latest" style="width:100%;margin-top:10px;font-size:12px;padding:8px;">' +
        t('news.read_latest') +
        '</button>' +
        '</div>';
}

// Handler — dipanggil dari main.js via event delegation
export function handleNewsListClick(e) {
    var row = e.target.closest('[data-news-id]');
    if (row) {
        var id = row.dataset.newsId;
        var article = null;
        try {
            var game = window.__game;
            if (game && game.news && game.news.getArticleById) {
                article = game.news.getArticleById(id);
            }
        } catch (err) {}
        if (article) openNewsArticleModal(article);
        return true;
    }
    var btn = e.target.closest('[data-news-action="open-latest"]');
    if (btn) {
        var list = [];
        try {
            var game2 = window.__game;
            if (game2 && game2.news && game2.news.getArticles) {
                list = game2.news.getArticles(1);
            }
        } catch (err) {}
        if (list.length) openNewsArticleModal(list[0]);
        return true;
    }
    return false;
}
