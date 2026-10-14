// FILE: src/systems/NewsSystem.js
// ============================================================
// NewsSystem — generator artikel media internasional.
// Trigger: product:released, milestone penjualan,
//          time:day-changed (headline bulanan mulai hari ke-2).
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
import { getHeadlineForMonth } from '../data/news-headlines.data.js';
import { getPrehistoryHeadlines } from '../data/news-prehistory.data.js';

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

// ============================================================
// [V7a-3] _toneToScore — mapping tone headline → skor numerik
// ============================================================
function _toneToScore(tone) {
    if (tone === 'positive') return 7.5;
    if (tone === 'negative') return 3.5;
    return 5.5;
}

// ============================================================
// [V7a-3] _makeHeadlineArticle — bangun artikel dari headline
// historis. Struktur kompatibel NewsListPanel + NewsArticleModal.
// ============================================================
function _makeHeadlineArticle(h) {
    if (!h) return null;
    var data = state.get();

    var outlet = null;
    try {
        var outlets = getOutletsForYear(h.year) || [];
        for (var i = 0; i < outlets.length; i++) {
            if (outlets[i].id === h.sourceId) { outlet = outlets[i]; break; }
        }
    } catch (e) { /* diamkan */ }

    var byline = 'Redaksi ' + (h.source || 'Media');
    var dateline = 'Global';
    var sourceCountry = null;
    var sourceRegion = null;
    var sourceType = 'media';

    if (outlet) {
        try {
            var j = getJournalistForCountry(outlet.country);
            if (j) byline = j;
        } catch (e) { /* diamkan */ }
        try {
            var city = getDatelineForRegion(outlet.region);
            if (city) dateline = city;
        } catch (e) { /* diamkan */ }
        sourceCountry = outlet.country || null;
        sourceRegion = outlet.region || null;
        sourceType = outlet.type || sourceType;
    }

    return {
        id: 'headline_' + h.year + '_' + h.month,
        headline: h.headline || '',
        subheadline: '',
        byline: byline,
        dateline: dateline,
        paragraphs: h.text ? [h.text] : [],
        pullQuote: '',
        source: h.source || 'Media',
        sourceId: h.sourceId || null,
        sourceCountry: sourceCountry,
        sourceRegion: sourceRegion,
        sourceType: sourceType,
        score: _toneToScore(h.tone),
        sentiment: h.tone || 'mixed',
        articleType: 'monthly_headline',
        productId: null,
        productName: null,
        createdAt: {
            year: h.year,
            month: h.month,
            day: 1,
            gameMinute: data.time.elapsedGameMinutes
        },
        era: h.era || data.era,
        read: false,
        headlineYear: h.year,
        headlineMonth: h.month,
        tags: Array.isArray(h.tags) ? h.tags.slice() : []
    };
}

// ============================================================
// [V7a-3] _makeRecapArticle — artikel arsip pra-2000.
// ============================================================
function _makeRecapArticle(h) {
    if (!h) return null;
    var day = h.day || 1;
    return {
        id: 'recap_' + h.year + '_' + h.month + '_' + day,
        headline: h.headline || '',
        subheadline: '',
        byline: 'Redaksi Arsip',
        dateline: h.dateline || 'Global',
        paragraphs: h.text ? [h.text] : [],
        pullQuote: '',
        source: h.source || 'Arsip',
        sourceId: h.sourceId || null,
        sourceCountry: null,
        sourceRegion: null,
        sourceType: 'archive',
        score: _toneToScore(h.tone),
        sentiment: h.tone || 'mixed',
        articleType: 'recap',
        isRecap: true,
        productId: null,
        productName: null,
        createdAt: {
            year: h.year,
            month: h.month,
            day: day,
            gameMinute: 0
        },
        era: h.era || 'firmware',
        read: true,
        headlineYear: h.year,
        headlineMonth: h.month,
        tags: Array.isArray(h.tags) ? h.tags.slice() : []
    };
}

// ============================================================
// [V7a-4] _trimArticles — buang artikel non-recap terlama.
// Arsip (isRecap: true) selalu dipertahankan.
// ============================================================
function _trimArticles(articles, max) {
    if (!Array.isArray(articles) || articles.length <= max) return;
    var safety = 0;
    while (articles.length > max && safety < 200) {
        safety++;
        var removed = false;
        for (var i = articles.length - 1; i >= 0; i--) {
            if (!articles[i].isRecap) {
                articles.splice(i, 1);
                removed = true;
                break;
            }
        }
        if (!removed) break; // semua sisa adalah recap — biarkan
    }
}

export var NewsSystem = {
    start: function () {
        bus.on('product:released', function (payload) {
            NewsSystem._onProductReleased(payload);
        });
        bus.on('product:milestone-sales', function (payload) {
            NewsSystem._onMilestoneSales(payload);
        });
        // [V7a-4] Headline bulanan dicek setiap pergantian hari.
        // Muncul mulai hari ke-2 bulan berjalan.
        bus.on('time:day-changed', function (snapshot) {
            NewsSystem._onMonthlyHeadline(snapshot);
        });
        console.info('[NewsSystem] siap.');
    },

    _onProductReleased: function (payload) {
        if (!payload) return;
        try {
            var data = state.get();
            if (!data.news) data.news = { articles: [], lastMilestone: {}, headlineHistory: [], recapSeeded: false };

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
            _trimArticles(data.news.articles, MAX_ARTICLES);

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
            if (!data.news) data.news = { articles: [], lastMilestone: {}, headlineHistory: [], recapSeeded: false };
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
                _trimArticles(data.news.articles, MAX_ARTICLES);
                bus.emit('news:published', { article: art });
                state.addLog('Berita global: ' + art.headline, LOG_TYPES.success);
                bus.emit('state:changed', data);
            }
        } catch (err) {
            console.error('[NewsSystem] _onMilestoneSales error:', err);
        }
    },

    // [V7a-4] Handler headline bulanan. Trigger tiap pergantian hari;
    // hanya benar-benar menambahkan artikel saat hari >= 2 dan belum ada.
    _onMonthlyHeadline: function (snapshot) {
        try {
            var data = state.get();
            if (!data.news) data.news = { articles: [], lastMilestone: {}, headlineHistory: [], recapSeeded: false };
            if (!Array.isArray(data.news.headlineHistory)) data.news.headlineHistory = [];

            var year = (snapshot && snapshot.currentYear) || data.time.currentYear;
            var month = (snapshot && snapshot.currentMonth) || data.time.currentMonth;
            var day = (snapshot && snapshot.currentDay) || data.time.currentDay;

            // Headline muncul mulai hari ke-2 bulan berjalan.
            if (day < 2) return;

            var h = getHeadlineForMonth(year, month);
            if (!h) return;

            var key = year + '-' + month;
            if (data.news.headlineHistory.indexOf(key) !== -1) return;

            // Guard defensif: save lama mungkin sudah punya artikel headline
            // bulan ini tanpa tercatat di history.
            for (var i = 0; i < data.news.articles.length; i++) {
                var a = data.news.articles[i];
                if (a.articleType === 'monthly_headline' &&
                    a.headlineYear === year && a.headlineMonth === month) {
                    data.news.headlineHistory.push(key);
                    return;
                }
            }

            var art = _makeHeadlineArticle(h);
            if (!art) return;

            data.news.headlineHistory.push(key);
            data.news.articles.unshift(art);
            _trimArticles(data.news.articles, MAX_ARTICLES);

            bus.emit('news:published', { article: art });
            state.addLog('Headline: ' + art.headline, LOG_TYPES.info);
            bus.emit('state:changed', data);
        } catch (err) {
            console.error('[NewsSystem] _onMonthlyHeadline error:', err);
        }
    },

    // [V7a-3] Seed arsip pra-2000. Idempotent via recapSeeded.
    // Push ke belakang array agar di bawah headline bulanan.
    seedPreHistory: function () {
        try {
            var data = state.get();
            if (!data.news) data.news = { articles: [], lastMilestone: {}, headlineHistory: [], recapSeeded: false };
            if (data.news.recapSeeded) return;

            var list = getPrehistoryHeadlines();
            var added = 0;
            for (var i = 0; i < list.length; i++) {
                var art = _makeRecapArticle(list[i]);
                if (art) {
                    data.news.articles.push(art);
                    added++;
                }
            }

            data.news.recapSeeded = true;
            bus.emit('state:changed', data);
            console.info('[NewsSystem] ' + added + ' arsip pra-2000 dimuat.');
        } catch (err) {
            console.error('[NewsSystem] seedPreHistory error:', err);
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
