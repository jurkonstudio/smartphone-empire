// FILE: src/systems/PublicOpinionSystem.js
// v2028.6 — [LOGIC] Reaksi konsumen sekarang sangat sensitif terhadap Harga vs Kualitas (Value for Money).
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { BALANCE } from '../data/balance.data.js';
import { getMacro } from '../core/MacroModel.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { ToastService } from '../core/ToastService.js';
import { LOG_TYPES } from '../config/constants.js';
import {
    FEEDBACK_SOURCES,
    REVIEW_TEMPLATES,
    STAT_LABELS,
    VIRAL_EVENTS,
    CUSTOMER_SUGGESTIONS,
    VIRAL_RESPONSES
} from '../data/feedback.data.js';
import { WalletService } from './WalletService.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;

function sourcesForEra(era) {
    return FEEDBACK_SOURCES[era] || FEEDBACK_SOURCES.feature_phone;
}

function templateCategory(score) {
    if (score >= 8) return 'excellent';
    if (score >= 6) return 'good';
    if (score >= 4) return 'mixed';
    if (score >= 2) return 'poor';
    return 'bad';
}

function clamp(n) { return Math.max(0, Math.min(100, Math.round(n))); }

export class PublicOpinionSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        this._unsubs.push(bus.on('time:day-changed',   () => this._onDayChanged()));
        this._unsubs.push(bus.on('time:month-changed', () => this._onMonthChanged()));
        this._unsubs.push(bus.on('state:hydrated',     () => this._onHydrated()));
        this._unsubs.push(bus.on('product:released',   (p) => this._onProductReleased(p)));
        this._recomputeSentiment();
        console.info('[PublicOpinionSystem] siap.');
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    _onHydrated() {
        const fb = this.state.data.feedback;
        if (!fb.aspectSentiment) fb.aspectSentiment = { design: 50, camera: 50, battery: 50, performance: 50, price: 50, reliability: 50, os: 50, support: 50 };
        if (!Array.isArray(fb.feed)) fb.feed = [];
        if (!Array.isArray(fb.activeViral)) fb.activeViral = [];
        if (!Array.isArray(fb.viralHistory)) fb.viralHistory = [];
        if (!Array.isArray(fb.suggestions)) fb.suggestions = [];
        if (!fb.perProductSatisfaction) fb.perProductSatisfaction = {};
        if (!fb.competitorSentiment) fb.competitorSentiment = {};
        this._recomputeSentiment();
        this._updateSuggestions();
        bus.emit('state:changed', this.state.data);
    }

    _hasReleasedProducts() {
        return (this.state.data.products.catalog || []).length > 0;
    }

    _daysSinceFirstRelease() {
        const catalog = this.state.data.products.catalog || [];
        if (!catalog.length) return -1;
        let earliest = Infinity;
        catalog.forEach(p => {
            if (p.releaseGameMinute && p.releaseGameMinute < earliest) earliest = p.releaseGameMinute;
        });
        if (earliest === Infinity) return -1;
        return (this.state.data.time.elapsedGameMinutes - earliest) / MINUTES_PER_DAY;
    }

    _onDayChanged() {
        this._tickViral();
        if (this._hasReleasedProducts()) this._maybeGenerateReview();
    }

    _onMonthChanged() {
        this._recomputeSentiment();
        this._updateSuggestions();
        this._updatePerProductSatisfaction();
        this._updateCompetitorSentiment();
        this._rollForViralEvent();
        bus.emit('state:changed', this.state.data);
    }

    _onProductReleased({ productId }) {
        const data = this.state.data;
        const p = data.products.catalog.find(x => x.id === productId);
        if (!p) return;
        const rv = this._generateReviewForProduct(p, true);
        this._pushToFeed(rv);
        data.feedback.perProductSatisfaction[p.id] = Math.round((rv.score || 5) * 10);
    }

    // ============================================================
    // HELPER: HARGA EKSPEKTASI
    // ============================================================
    _getExpectedPrice(qualityScore, data) {
        const refPrice = getMacro(data.time, BALANCE.macro).priceRef;
        const q = Math.max(10, qualityScore);
        // Skala 1.3: HP kualitas 100 diharapkan ~2.5x harga referensi
        return refPrice * Math.pow(q / 50, 1.3);
    }

    // ============================================================
    // SENTIMEN
    // ============================================================
    _recomputeSentiment() {
        const data = this.state.data;
        const fb = data.feedback;

        if (!this._hasReleasedProducts()) {
            fb.sentiment = 50;
            fb.aspectSentiment = {
                design: 50, camera: 50, battery: 50, performance: 50,
                price: 50, reliability: 50, os: 50, support: 50
            };
            bus.emit('feedback:sentiment-changed', { value: 50 });
            return;
        }

        const activeProducts = data.products.catalog.filter(p => p.status === 'selling');
        let avgQuality = 50;
        let cDesign = 0, cCam = 0, cBat = 0, cPerf = 0, count = 0;
        let priceScoreSum = 0;

        activeProducts.forEach(p => {
            avgQuality += (p.stats.qualityScore || 50);
            cDesign += p.stats.design || 50;
            cCam += p.stats.camera || 50;
            cBat += p.stats.battery || 50;
            cPerf += p.stats.performance || 50;
            
            // Hitung skor harga berdasarkan ekspektasi pasar
            const expected = this._getExpectedPrice(p.stats.qualityScore || 50, data);
            const ratio = p.price / expected;
            let pScore = 50;
            if (ratio <= 0.6) pScore = 100; // Sangat murah
            else if (ratio <= 0.9) pScore = 80; // Murah
            else if (ratio <= 1.1) pScore = 50; // Wajar
            else if (ratio <= 1.4) pScore = 20; // Mahal
            else pScore = 0; // Terlalu mahal
            
            priceScoreSum += pScore;
            count++;
        });

        if (count > 0) {
            avgQuality = avgQuality / (count + 1);
            cDesign /= count;
            cCam /= count;
            cBat /= count;
            cPerf /= count;
        } else {
            avgQuality = 50;
            cDesign = cCam = cBat = cPerf = 50;
        }

        const reputation = data.market.reputation || 10;
        const activeBugs = (data.os.bugs || []).filter(b => b.status === 'active' || b.status === 'patching').length;
        const bugPenalty = activeBugs * 5;
        
        // Rata-rata skor harga
        let priceScore = count > 0 ? (priceScoreSum / count) : 50;

        const w = BALANCE.feedback.sentimentWeights;
        const totalW = (w.quality + w.price + w.reputation) || 1;
        let sentiment = (
            avgQuality * w.quality +
            priceScore * w.price +
            reputation * w.reputation
        ) / totalW;
        sentiment -= bugPenalty * w.bugPenalty;

        let viralBoost = 0;
        fb.activeViral.forEach(v => {
            viralBoost += (v.effectType === 'positive' ? 1 : -1) * 8;
        });
        sentiment += viralBoost * w.viralBoost;

        sentiment = clamp(sentiment);
        const prevSent = (typeof fb.sentiment === 'number') ? fb.sentiment : sentiment;
        sentiment = prevSent + (sentiment - prevSent) * BALANCE.macro.sentimentSmoothing;
        fb.sentiment = sentiment;

        fb.aspectSentiment = {
            design:      clamp(cDesign),
            camera:      clamp(cCam),
            battery:     clamp(cBat),
            performance: clamp(cPerf),
            price:       clamp(priceScore),
            reliability: clamp(100 - bugPenalty * 2),
            os:          clamp(this._osScore()),
            support:     clamp(50 + reputation * 0.3)
        };

        bus.emit('feedback:sentiment-changed', { value: sentiment });
    }

    _osScore() {
        const os = window.__game && window.__game.os ? window.__game.os : null;
        if (!os) return 50;
        const st = os.getCurrentStats();
        if (!st) return 50;
        return Math.round((st.stability + st.speed + st.features + st.security + st.design) / 5);
    }

    _updateSuggestions() {
        const data = this.state.data;
        const fb = data.feedback;

        if (!this._hasReleasedProducts()) {
            fb.suggestions = [];
            return;
        }

        const aspects = fb.aspectSentiment;
        const sorted = Object.keys(aspects)
            .map(k => ({ aspect: k, score: aspects[k] }))
            .sort((a, b) => a.score - b.score)
            .slice(0, 3);

        fb.suggestions = sorted.map(s => {
            const tmpl = CUSTOMER_SUGGESTIONS.find(cs => cs.aspect === s.aspect);
            return {
                aspect: s.aspect,
                score: s.score,
                text: tmpl ? tmpl.text : ('Pengguna menginginkan ' + s.aspect + ' lebih baik.')
            };
        });
    }

    _updatePerProductSatisfaction() {
        const data = this.state.data;
        const fb = data.feedback;
        (data.products.catalog || []).forEach(p => {
            if (p.status !== 'selling') return;
            const q = p.stats.qualityScore || 50;
            const activeBugs = (data.os.bugs || []).filter(b => b.status === 'active').length;
            fb.perProductSatisfaction[p.id] = clamp(q - activeBugs * 3);
        });
    }

    _updateCompetitorSentiment() {
        const fb = this.state.data.feedback;
        const cs = window.__game && window.__game.competitors ? window.__game.competitors : null;
        if (!cs) return;
        cs.getActiveIds().forEach(id => {
            const e = cs.state.data.competitorState.entities[id];
            if (!e) return;
            fb.competitorSentiment[id] = Math.round(50 + ((e.currentTier || 1) - 1) * 10 + (Math.random() * 8 - 4));
        });
    }

    _maybeGenerateReview() {
        const data = this.state.data;
        const active = (data.products.catalog || []).filter(p => p.status === 'selling');
        if (!active.length) return;

        const perDayChance = BALANCE.reviews.perDayChance || 0.15;
        const multiplier = 1 + (100 - data.feedback.sentiment) / 200;
        if (Math.random() < (perDayChance * multiplier)) {
            const p = active[Math.floor(Math.random() * active.length)];
            const rv = this._generateReviewForProduct(p, false);
            this._pushToFeed(rv);
        }
    }

    _generateReviewForProduct(product, isInitial) {
        const data = this.state.data;
        const era = data.era || 'feature_phone';
        const sources = sourcesForEra(era);
        const source = sources[Math.floor(Math.random() * sources.length)];
        
        const q = product.stats.qualityScore || 50;
        const bugHit = (data.os.bugs || []).filter(b => b.status === 'active').length * 2;
        
        let base;
        if (q >= 85) base = 9;
        else if (q >= 70) base = 7.5;
        else if (q >= 50) base = 6;
        else if (q >= 30) base = 4;
        else base = 2.5;
        
        // ============================================================
        // EFEK DOMINO HARGA vs KUALITAS
        // ============================================================
        const expectedPrice = this._getExpectedPrice(q, data);
        const priceRatio = product.price / expectedPrice;
        let pricePenalty = 0;
        let forcedText = null;
        
        if (priceRatio > 1.5) {
            pricePenalty = -6; // Penalti sangat besar
            forcedText = `Gila, ${product.name} dijual $${product.price}?! Kualitas pas-pasan tapi harga selangit. Bukan beli!`;
        } else if (priceRatio > 1.2) {
            pricePenalty = -3;
            forcedText = `${product.name} terlalu mahal untuk spesifikasi segini. Mending beli merk lain.`;
        } else if (priceRatio < 0.5) {
            pricePenalty = +3; // Bonus
            forcedText = `Murah banget! ${product.name} cuma $${product.price} tapi lumayan buat sehari-hari. Worth it!`;
        } else if (priceRatio < 0.8) {
            pricePenalty = +1.5;
            forcedText = `${product.name} harganya sangat bersahabat untuk kantong. Rekomendasi!`;
        }

        base += pricePenalty;
        base -= bugHit;
        
        const variance = (Math.random() * 2 - 1) * 1.2;
        let score = Math.max(1, Math.min(10, Math.round((base + variance) * 10) / 10));

        const statKeys = ['display', 'camera', 'battery', 'performance', 'connectivity', 'design', 'usability'];
        let best = statKeys[0], worst = statKeys[0];
        statKeys.forEach(k => {
            if ((product.stats[k] || 0) > (product.stats[best] || 0)) best = k;
            if ((product.stats[k] || 0) < (product.stats[worst] || 0)) worst = k;
        });
        const strongLabel = (STAT_LABELS[best] || {}).strong || 'berkualitas';
        const weakLabel   = (STAT_LABELS[worst] || {}).weak   || 'ada kekurangan';
        
        let text;
        if (forcedText) {
            text = forcedText;
        } else {
            const templates = REVIEW_TEMPLATES[templateCategory(score)] || REVIEW_TEMPLATES.mixed;
            text = templates[Math.floor(Math.random() * templates.length)]
                .replace(/{name}/g, product.name)
                .replace(/{strong}/g, strongLabel)
                .replace(/{weak}/g, weakLabel);
        }

        return {
            id: 'rv_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            productId: product.id,
            productName: product.name,
            source, score, text,
            year: data.time.currentYear,
            month: data.time.currentMonth,
            day: data.time.currentDay,
            gameMinute: data.time.elapsedGameMinutes,
            isInitial: !!isInitial
        };
    }

    _pushToFeed(rv) {
        const fb = this.state.data.feedback;
        fb.feed.unshift(rv);
        if (fb.feed.length > BALANCE.reviews.maxReviewsInFeed) fb.feed.length = BALANCE.reviews.maxReviewsInFeed;
        bus.emit('feedback:review-received', { review: rv });
    }

    _rollForViralEvent() {
        const fb = this.state.data.feedback;
        if (!this._hasReleasedProducts()) return;
        if (this._daysSinceFirstRelease() < 30) return;
        if (fb.activeViral.length >= 2) return;
        if (Math.random() > 0.15) return;

        const sentiment = fb.sentiment || 50;
        const positiveChance = 0.5 + (sentiment - 50) / 100;
        const wantType = Math.random() < positiveChance ? 'positive' : 'negative';
        const candidates = VIRAL_EVENTS.filter(v => v.type === wantType);
        if (!candidates.length) return;
        this._startViralEvent(candidates[Math.floor(Math.random() * candidates.length)]);
    }

    _startViralEvent(ev) {
        const data = this.state.data;
        const fb = data.feedback;
        const dur = ev.effects.durationDays || 7;
        const viral = {
            id: 'vir_' + Date.now(),
            eventId: ev.id,
            type: ev.type,
            effectType: ev.type,
            title: ev.title,
            text: ev.text,
            effects: { ...ev.effects },
            startedAtMinute: data.time.elapsedGameMinutes,
            endsAtMinute: data.time.elapsedGameMinutes + dur * MINUTES_PER_DAY
        };
        fb.activeViral.push(viral);
        if (ev.effects.reputation) this.state.addReputation(ev.effects.reputation);

        const isPos = ev.type === 'positive';
        ToastService[isPos ? 'success' : 'warning']((isPos ? '✨ ' : '⚠ ') + ev.title);
        this.state.addLog('Viral ' + (isPos ? 'positif' : 'negatif') + ': ' + ev.title + '.', isPos ? LOG_TYPES.success : LOG_TYPES.warning);
        if (data.settings.vibrate) { try { if (navigator.vibrate) navigator.vibrate(isPos ? [20, 40, 20] : [80, 40, 80]); } catch (e) {} }

        bus.emit('feedback:viral-started', { viral });
        bus.emit('state:changed', data);
    }

    _tickViral() {
        const fb = this.state.data.feedback;
        const now = this.state.data.time.elapsedGameMinutes;
        const before = fb.activeViral.length;
        fb.activeViral = fb.activeViral.filter(v => v.endsAtMinute > now);
        if (fb.activeViral.length < before) {
            fb.viralHistory = fb.viralHistory.slice(0, 15);
            bus.emit('feedback:viral-ended', { count: before - fb.activeViral.length });
            bus.emit('state:changed', this.state.data);
        }
    }

    respondToViral(viralId, responseId) {
        const data = this.state.data;
        const fb = data.feedback;
        const viral = fb.activeViral.find(v => v.id === viralId);
        if (!viral) return { ok: false, reason: 'Viral tidak ditemukan.' };
        if (viral.type !== 'negative') return { ok: false, reason: 'Hanya untuk viral negatif.' };
        const resp = VIRAL_RESPONSES.find(r => r.id === responseId);
        if (!resp) return { ok: false, reason: 'Respons tidak valid.' };
        if (!WalletService.canAfford(resp.cost)) return { ok: false, reason: 'Uang tidak cukup.' };
        if (resp.cost > 0) WalletService.pay(resp.cost, 'viral-response');
        if (resp.effect.reputation) this.state.addReputation(resp.effect.reputation);
        this._recomputeSentiment();
        if (responseId !== 'ignore') fb.activeViral = fb.activeViral.filter(v => v.id !== viralId);
        this.state.addLog('Respons publik: ' + resp.label + '.', LOG_TYPES.info);
        ToastService.success('Respons: ' + resp.label);
        bus.emit('feedback:viral-responded', { viralId, responseId });
        bus.emit('state:changed', data);
        return { ok: true };
    }

    getSentiment()           { return this.state.data.feedback.sentiment || 50; }
    getAspectSentiment()     { return this.state.data.feedback.aspectSentiment || {}; }
    getFeed(limit)           { return (this.state.data.feedback.feed || []).slice(0, limit || 30); }
    getActiveViral()         { return this.state.data.feedback.activeViral || []; }
    getSuggestions()         { return this.state.data.feedback.suggestions || []; }
    getPerProductSatisfaction() { return this.state.data.feedback.perProductSatisfaction || {}; }
    getCompetitorSentiment() { return this.state.data.feedback.competitorSentiment || {}; }

    forceViral(type) {
        const list = VIRAL_EVENTS.filter(v => v.type === (type === 'positive' ? 'positive' : 'negative'));
        if (!list.length) return { ok: false };
        const ev = list[Math.floor(Math.random() * list.length)];
        this._startViralEvent(ev);
        return { ok: true, event: ev.title };
    }

    recomputeNow() {
        this._recomputeSentiment();
        this._updateSuggestions();
        this._updatePerProductSatisfaction();
        this._updateCompetitorSentiment();
        bus.emit('state:changed', this.state.data);
        return { ok: true, sentiment: this.state.data.feedback.sentiment };
    }

    forceReview() {
        const active = (this.state.data.products.catalog || []).filter(p => p.status === 'selling');
        if (!active.length) return { ok: false, reason: 'Belum ada produk aktif.' };
        const p = active[Math.floor(Math.random() * active.length)];
        const rv = this._generateReviewForProduct(p, false);
        this._pushToFeed(rv);
        bus.emit('state:changed', this.state.data);
        return { ok: true, review: rv };
    }
            }
