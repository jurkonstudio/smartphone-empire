// FILE: src/systems/NewsSystem.js
// ============================================================
// NewsSystem — generator artikel media internasional.
// Trigger: product:released, milestone penjualan, event viral.
// ============================================================
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { LOG_TYPES } from '../config/constants.js';
import {
    NEWS_OUTLETS, HEADLINE_TEMPLATES, SUBHEADLINE_TEMPLATES,
    BODY_TEMPLATES, PULL_QUOTE_TEMPLATES,
    getOutletsForYear, getJournalistForCountry, getDatelineForRegion, getRandomFrom
} from '../data/news.data.js';

var MAX_ARTICLES = 30;
var _articleSeq = 1;

function _toneFromScore(score, reputation) {
    var repBonus = (reputation - 50) / 100;
    var adjusted = score + repBonus * 1.5;
    if (adjusted >= 7) return 'positive';
    if (adjusted >= 5) return 'mixed';
    return 'negative';
}

function _qualityLabel(score) {
    if (score >= 85) return 'premium';
    if (score >= 65) return 'baik';
    if (score >= 45) return 'standar';
    return 'rendah';
}

function _fillTemplate(text, data) {
    if (!text) return '';
    return text
        .replace(/\{name\}/g, data.name || '')
        .replace(/\{company\}/g, data.company || '')
        .replace(/\{quality\}/g, data.quality || '')
        .replace(/\{price\}/g, data.price || '')
        .replace(/\{region\}/g, data.region || 'Global')
        .replace(/\{strong\}/g, data.strong || '')
        .replace(/\{weak\}/g, data.weak || '');
}

function _generateArticle(options) {
    var opts = options || {};
    var data = state.get();
    var year = data.time.currentYear;
    var outlets = getOutletsForYear(year);
    if (!outlets.length) return null;

    var outlet = opts.outlet || getRandomFrom(outlets);
    if (!outlet) return null;

    var score = opts.score != null ? opts.score : 5;
    var reputation = data.market ? (data.market.reputation || 0) : 0;
    var tone = opts.tone || _toneFromScore(score, reputation);

    var tplData = {
        name: opts.productName || 'Perangkat',
        company: data.companyName || 'Perusahaan',
        quality: _qualityLabel(score * 10),
        price: opts.price != null ? ('$' + Math.round(opts.price)) : 'kompetitif',
        region: outlet.region === 'Global' ? 'internasional' : outlet.region,
        strong: opts.strong || 'kualitas',
        weak: opts.weak || 'beberapa aspek'
    };

    var headlinePool;
    if (opts.type === 'milestone_100m') headlinePool = HEADLINE_TEMPLATES.milestone_100m;
    else if (opts.type === 'milestone_10m') headlinePool = HEADLINE_TEMPLATES.milestone_10m;
    else if (opts.type === 'milestone_1m') headlinePool = HEADLINE_TEMPLATES.milestone_1m;
    else headlinePool = HEADLINE_TEMPLATES[tone] || HEADLINE_TEMPLATES.mixed;

    var headline = _fillTemplate(getRandomFrom(headlinePool), tplData);

    var subPool = SUBHEADLINE_TEMPLATES[tone] || SUBHEADLINE_TEMPLATES.mixed;
    var subheadline = _fillTemplate(getRandomFrom(subPool), tplData);

    var bodyPool = BODY_TEMPLATES[tone] || BODY_TEMPLATES.mixed;
    var paragraphs = [];
    for (var i = 0; i < bodyPool.length; i++) {
        paragraphs.push(_fillTemplate(bodyPool[i], tplData));
    }

    var quotePool = PULL_QUOTE_TEMPLATES[tone] || PULL_QUOTE_TEMPLATES.mixed;
    var pullQuote = _fillTemplate(getRandomFrom(quotePool), tplData);

    var journalist = getJournalistForCountry(outlet.country);
    var city = getDatelineForRegion(outlet.region);

    var id = 'news_' + Date.now() + '_' + (_articleSeq++);

    return {
        id: id,
        headline: headline,
        subheadline: subheadline,
        byline: journalist,
        dateline: city,
        paragraphs: paragraphs,
        pullQuote: pullQuote,
        source: outlet.name,
        sourceId: outlet.id,
        sourceCountry: outlet.country,
        sourceRegion: outlet.region,
        sourceType: outlet.type,
        score: Math.round(score * 10) / 10,
        sentiment: tone,
        articleType: opts.type || 'release',
        productId: opts.productId || null,
        productName: opts.productName || null,
        createdAt: {
            year: data.time.currentYear,
            month: data.time.currentMonth,
            day: data.time.currentDay,
            gameMinute: data.time.elapsedGameMinutes
        },
        era: data.era,
        read: false
    };
}

export var NewsSystem = {
    start: function () {
        bus.on('product:released', function (payload) {
            NewsSystem._onProductReleased(payload);
        });
        bus.on('product:milestone-sales', function (payload) {
            NewsSystem._onMilestoneSales(payload);
        });
        console.info('[NewsSystem] siap.');
    },

    _onProductReleased: function (payload) {
        if (!payload) return;
        try {
            var data = state.get();
            if (!data.news) data.news = { articles: [], lastMilestone: {} };

            var product = null;
            for (var i = 0; i < data.products.catalog.length; i++) {
                if (data.products.catalog[i].id === payload.productId) {
                    product = data.products.catalog[i];
                    break;
                }
            }
            if (!product) return;

            var score = 5;
            if (product.reviews && product.reviews.length) {
                var sum = 0;
                for (var j = 0; j < product.reviews.length; j++) sum += product.reviews[j].score;
                score = sum / product.reviews.length;
            } else if (product.stats && product.stats.qualityScore) {
                score = product.stats.qualityScore / 10;
            }

            var statKeys = ['display', 'camera', 'battery', 'performance', 'connectivity', 'design', 'usability'];
            var best = statKeys[0], worst = statKeys[0];
            for (var k = 0; k < statKeys.length; k++) {
                var key = statKeys[k];
                if ((product.stats[key] || 0) > (product.stats[best] || 0)) best = key;
                if ((product.stats[key] || 0) < (product.stats[worst] || 0)) worst = key;
            }
            var labelMap = { display: 'layar', camera: 'kamera', battery: 'baterai', performance: 'performa', connectivity: 'konektivitas', design: 'desain', usability: 'kemudahan' };

            var articles = [];
            var usedOutletIds = {};
            var attempts = 0;
            while (articles.length < 2 && attempts < 10) {
                attempts++;
                var art = _generateArticle({
                    type: 'release',
                    productId: product.id,
                    productName: product.name,
                    price: product.price,
                    score: score,
                    strong: labelMap[best] || 'kualitas',
                    weak: labelMap[worst] || 'beberapa aspek'
                });
                if (art && !usedOutletIds[art.sourceId]) {
                    usedOutletIds[art.sourceId] = true;
                    articles.push(art);
                }
            }

            for (var m = 0; m < articles.length; m++) {
                data.news.articles.unshift(articles[m]);
            }
            if (data.news.articles.length > MAX_ARTICLES) {
                data.news.articles.length = MAX_ARTICLES;
            }

            for (var n = 0; n < articles.length; n++) {
                bus.emit('news:published', { article: articles[n] });
            }

            state.addLog(articles.length + ' ulasan media internasional untuk ' + product.name + '.', LOG_TYPES.info);
            bus.emit('state:changed', data);
        } catch (err) {
            console.error('[NewsSystem] _onProductReleased error:', err);
        }
    },

    _onMilestoneSales: function (payload) {
        if (!payload) return;
        try {
            var data = state.get();
            if (!data.news) data.news = { articles: [], lastMilestone: {} };
            if (!data.news.lastMilestone) data.news.lastMilestone = {};

            var productId = payload.productId;
            var milestone = payload.milestone;
            var key = productId + '_' + milestone;
            if (data.news.lastMilestone[key]) return;
            data.news.lastMilestone[key] = true;

            var art = _generateArticle({
                type: 'milestone_' + milestone,
                productId: productId,
                productName: payload.productName || 'Perangkat',
                score: 8,
                tone: 'positive',
                price: payload.price
            });

            if (art) {
                data.news.articles.unshift(art);
                if (data.news.articles.length > MAX_ARTICLES) {
                    data.news.articles.length = MAX_ARTICLES;
                }
                bus.emit('news:published', { article: art });
                state.addLog('Berita global: ' + art.headline, LOG_TYPES.success);
                bus.emit('state:changed', data);
            }
        } catch (err) {
            console.error('[NewsSystem] _onMilestoneSales error:', err);
        }
    },

    getArticles: function (limit) {
        var data = state.get();
        var list = (data.news && data.news.articles) ? data.news.articles.slice() : [];
        if (limit > 0) return list.slice(0, limit);
        return list;
    },

    getUnreadCount: function () {
        var list = NewsSystem.getArticles(0);
        var n = 0;
        for (var i = 0; i < list.length; i++) {
            if (!list[i].read) n++;
        }
        return n;
    },

    markRead: function (articleId) {
        var data = state.get();
        if (!data.news || !data.news.articles) return;
        for (var i = 0; i < data.news.articles.length; i++) {
            if (data.news.articles[i].id === articleId) {
                data.news.articles[i].read = true;
                break;
            }
        }
        bus.emit('state:changed', data);
    },

    getArticleById: function (articleId) {
        var data = state.get();
        if (!data.news || !data.news.articles) return null;
        for (var i = 0; i < data.news.articles.length; i++) {
            if (data.news.articles[i].id === articleId) return data.news.articles[i];
        }
        return null;
    },

    generateTestArticle: function () {
        return _generateArticle({
            type: 'release',
            productName: 'TestPhone X',
            score: 8,
            tone: 'positive',
            price: 599
        });
    }
};

export { _generateArticle };
