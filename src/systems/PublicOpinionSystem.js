// FILE: src/systems/PublicOpinionSystem.js
// v2028.6 — [LOGIC] Reaksi konsumen sekarang sangat sensitif terhadap Harga vs Kualitas (Value for Money).
// v2028.60 — [PERLUASAN] 11 aspek (+layar, konektivitas, kemudahan), viral 10 -> 26 (fokus segmen/wilayah/produk,
//             dwibahasa), efek permintaan viral kini benar-benar terpasang (lewat MarketNavSystem), ulasan membawa
//             segmen & wilayah pengulas, sentimen kompetitor dari tier/pangsa/momentum, riwayat viral terisi,
//             tombol "Abaikan" tidak lagi bisa dispam. Perbaikan: viralHistory selalu kosong.
// v2028.41 — Ulasan lebih banyak & beragam dari tahun ke tahun: volume naik mengikuti tahun/popularitas,
//             teks dipilih per era TAHUN (bukan data.era), variasi harga/bug/topik era, anti-duplikat.
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { BALANCE } from '../data/balance.data.js';
import { getMacro } from '../core/MacroModel.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { ToastService } from '../core/ToastService.js';
import { LOG_TYPES } from '../config/constants.js';
import {
    FEED_LIMITS,
    reviewSourceForYear,
    buildReviewText,
    VIRAL_EVENTS,
    CUSTOMER_SUGGESTIONS,
    VIRAL_RESPONSES
} from '../data/feedback.data.js';
import { WalletService } from './WalletService.js';
import { LanguageService } from '../core/LanguageService.js';
import { VIRAL_EXT, VIRAL_LEGACY_EN } from '../data/market-nav.data.js';
import { attachBugReactions } from './PublicOpinionBugReactions.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;

function clamp(n) { return Math.max(0, Math.min(100, Math.round(n))); }
function _lang() { try { return LanguageService.getLang() === 'id' ? 'id' : 'en'; } catch (e) { return 'en'; } }
function _L(obj) { return obj == null ? '' : (typeof obj === 'string' ? obj : (obj[_lang()] || obj.en || obj.id || '')); }
const ASPECT_KEYS = ['design', 'camera', 'battery', 'performance', 'price', 'reliability', 'os', 'support', 'display', 'connectivity', 'usability'];
function _neutralAspects() { const o = {}; ASPECT_KEYS.forEach(k => { o[k] = 50; }); return o; }
const VIRAL_HISTORY_MAX = 15;

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
        this._unsubs.push(...attachBugReactions(this));
        this._recomputeSentiment();
        console.info('[PublicOpinionSystem] siap.');
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    _onHydrated() {
        const fb = this.state.data.feedback;
        if (!fb.aspectSentiment) fb.aspectSentiment = _neutralAspects();
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
            fb.aspectSentiment = _neutralAspects();
            bus.emit('feedback:sentiment-changed', { value: 50 });
            return;
        }

        const activeProducts = data.products.catalog.filter(p => p.status === 'selling');
        let avgQuality = 50;
        let cDesign = 0, cCam = 0, cBat = 0, cPerf = 0, cDisp = 0, cConn = 0, cUse = 0, count = 0;
        let priceScoreSum = 0;

        activeProducts.forEach(p => {
            avgQuality += (p.stats.qualityScore || 50);
            cDesign += p.stats.design || 50;
            cCam += p.stats.camera || 50;
            cBat += p.stats.battery || 50;
            cPerf += p.stats.performance || 50;
            cDisp += p.stats.display || 50;
            cConn += p.stats.connectivity || 50;
            cUse += p.stats.usability || 50;
            
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
            cDisp /= count;
            cConn /= count;
            cUse /= count;
        } else {
            avgQuality = 50;
            cDesign = cCam = cBat = cPerf = cDisp = cConn = cUse = 50;
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
            support:     clamp(50 + reputation * 0.3),
            display:      clamp(cDisp),
            connectivity: clamp(cConn),
            usability:    clamp(cUse)
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

    // Persepsi publik terhadap kompetitor: tier teknologi, pangsa, dan momentum pangsa (bukan angka acak murni).
    _updateCompetitorSentiment() {
        const data = this.state.data;
        const fb = data.feedback;
        const cs = window.__game && window.__game.competitors ? window.__game.competitors : null;
        if (!cs) return;
        const comps = (data.market && data.market.competitors) || [];
        const hist = (data.market && data.market.shareHistory) || [];
        const prev = (hist[1] && hist[1].competitors) || [];
        cs.getActiveIds().forEach(id => {
            const e = cs.state.data.competitorState.entities[id];
            if (!e) return;
            const cur = comps.find(c => c.id === id);
            const old = prev.find(c => c.id === id);
            const share = cur ? (cur.share || 0) : 0;
            const momentum = (cur && old) ? share - (old.share || 0) : 0;
            const v = 45 + ((e.currentTier || 1) - 1) * 7
                + Math.max(0, Math.min(12, share * 60))
                + Math.max(-6, Math.min(6, momentum * 300))
                + (Math.random() * 6 - 3);
            fb.competitorSentiment[id] = Math.round(Math.max(5, Math.min(95, v)));
        });
    }

    _maybeGenerateReview() {
        const data = this.state.data;
        const active = (data.products.catalog || []).filter(p => p.status === 'selling');
        if (!active.length) return;

        const perDayChance = BALANCE.reviews.perDayChance || 0.15;
        const multiplier = 1 + (100 - data.feedback.sentiment) / 200;
        const year = data.time.currentYear || 2000;
        const now = data.time.elapsedGameMinutes || 0;
        // Pasar makin ramai dari tahun ke tahun (2000 = ×1, 2026 ≈ ×4).
        const growth = 1 + Math.max(0, year - 2000) * FEED_LIMITS.growthPerYear;

        let total = 0;
        active.forEach(p => {
            if (total >= FEED_LIMITS.maxPerDay) return;
            // Produk laris lebih sering diulas; minggu peluncuran ramai.
            const popularity = 1 + Math.min(1.5, Math.log10(1 + (p.totalSold || 0) / 300));
            const sinceRelease = p.releaseGameMinute ? (now - p.releaseGameMinute) / MINUTES_PER_DAY : 999;
            const buzz = sinceRelease <= (BALANCE.reviews.initialWaveDays || 7) ? FEED_LIMITS.launchBuzzMult : 1;
            const expected = perDayChance * multiplier * growth * popularity * buzz;
            let n = Math.floor(expected) + (Math.random() < (expected - Math.floor(expected)) ? 1 : 0);
            n = Math.min(n, FEED_LIMITS.maxPerProductPerDay, FEED_LIMITS.maxPerDay - total);
            for (let k = 0; k < n; k++) {
                this._pushToFeed(this._generateReviewForProduct(p, false));
                total++;
            }
        });
    }

    _generateReviewForProduct(product, isInitial) {
        const data = this.state.data;
        const year = data.time.currentYear || 2000;
        const source = reviewSourceForYear(year);
        
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
        let priceTier = null;

        if (priceRatio > 1.5) {
            pricePenalty = -6; // Penalti sangat besar
            priceTier = 'very_high';
        } else if (priceRatio > 1.2) {
            pricePenalty = -3;
            priceTier = 'high';
        } else if (priceRatio < 0.5) {
            pricePenalty = +3; // Bonus
            priceTier = 'very_low';
        } else if (priceRatio < 0.8) {
            pricePenalty = +1.5;
            priceTier = 'low';
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
        const recent = (data.feedback.feed || []).slice(0, 12).map(r => r.text);
        const text = buildReviewText({
            name: product.name,
            price: product.price,
            score: score,
            best: best,
            worst: worst,
            year: year,
            priceTier: priceTier,
            hasBugs: bugHit > 0,
            popular: (product.totalSold || 0) >= 3000,
            recent: recent
        });

        // Pengulas berasal dari segmen & sub-wilayah tertentu (MarketNavSystem).
        let segment = null, region = null, finalText = text;
        const nav = window.__game && window.__game.marketNav ? window.__game.marketNav : null;
        if (nav && typeof nav.sampleAudience === 'function') {
            const aud = nav.sampleAudience(product);
            segment = aud.segment; region = aud.region;
            if (score >= 6.5 || score <= 4.5) {
                if (Math.random() < 0.35) {
                    const line = nav.personaLine(segment, score >= 6.5, product.name);
                    if (line) finalText = line;
                }
            }
        }

        return {
            id: 'rv_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            productId: product.id,
            productName: product.name,
            segment, region,
            source, score, text: finalText,
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
        const maxFeed = Math.max(BALANCE.reviews.maxReviewsInFeed || 30, FEED_LIMITS.max);
        if (fb.feed.length > maxFeed) fb.feed.length = maxFeed;
        bus.emit('feedback:review-received', { review: rv });
    }

    _rollForViralEvent() {
        const data = this.state.data;
        const fb = data.feedback;
        if (!this._hasReleasedProducts()) return;
        if (this._daysSinceFirstRelease() < 30) return;
        if (fb.activeViral.length >= 2) return;
        if (Math.random() > 0.18) return;

        const sentiment = fb.sentiment || 50;
        const positiveChance = 0.5 + (sentiment - 50) / 100;
        const wantType = Math.random() < positiveChance ? 'positive' : 'negative';
        const year = data.time.currentYear || 2000;
        const selling = (data.products.catalog || []).filter(p => p.status === 'selling');
        const activeIds = fb.activeViral.map(v => v.eventId);

        const pool = VIRAL_EVENTS.filter(v => v.type === wantType).map(v => ({ ev: v, ext: false }))
            .concat(VIRAL_EXT.filter(v => v.type === wantType
                && (!v.minYear || year >= v.minYear) && (!v.maxYear || year <= v.maxYear)
                && (v.kind !== 'product' || selling.length > 0)).map(v => ({ ev: v, ext: true })))
            .filter(x => activeIds.indexOf(x.ev.id) < 0);
        if (!pool.length) return;
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        const extra = {};
        if (chosen.ext) {
            if (chosen.ev.segs) extra.segs = chosen.ev.segs.slice();
            if (chosen.ev.regs) extra.regs = chosen.ev.regs.slice();
            if (chosen.ev.kind === 'product' && selling.length) {
                const prod = selling[Math.floor(Math.random() * selling.length)];
                extra.productId = prod.id;
                extra.productName = prod.name;
            }
        }
        this._startViralEvent(chosen.ev, extra);
    }

    // Teks viral sesuai bahasa aktif (event lama hanya berbahasa Indonesia -> pakai terjemahan EN bila ada).
    _viralText(ev, field) {
        if (ev[field] && typeof ev[field] === 'object') return _L(ev[field]);
        if (_lang() === 'en' && VIRAL_LEGACY_EN[ev.id] && VIRAL_LEGACY_EN[ev.id][field]) return VIRAL_LEGACY_EN[ev.id][field];
        return ev[field];
    }

    _startViralEvent(ev, extra) {
        const data = this.state.data;
        const fb = data.feedback;
        extra = extra || {};
        const dur = ev.effects.durationDays || 7;
        const legacyEn = VIRAL_LEGACY_EN[ev.id];
        const i18n = (ev.title && typeof ev.title === 'object')
            ? { title: ev.title, text: ev.text }
            : (legacyEn ? { title: { id: ev.title, en: legacyEn.title }, text: { id: ev.text, en: legacyEn.text } } : null);
        const viral = {
            id: 'vir_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            eventId: ev.id,
            type: ev.type,
            effectType: ev.type,
            title: this._viralText(ev, 'title'),
            text: this._viralText(ev, 'text'),
            i18n: i18n,
            effects: { ...ev.effects },
            segs: extra.segs || null,
            regs: extra.regs || null,
            productId: extra.productId != null ? extra.productId : null,
            productName: extra.productName || null,
            ignored: false,
            startedAtMinute: data.time.elapsedGameMinutes,
            endsAtMinute: data.time.elapsedGameMinutes + dur * MINUTES_PER_DAY
        };
        fb.activeViral.push(viral);
        if (ev.effects.reputation) this.state.addReputation(ev.effects.reputation);

        const isPos = ev.type === 'positive';
        ToastService[isPos ? 'success' : 'warning']((isPos ? '✨ ' : '⚠ ') + viral.title);
        this.state.addLog((_lang() === 'id' ? 'Viral ' + (isPos ? 'positif' : 'negatif') : 'Viral ' + (isPos ? 'positive' : 'negative')) + ': ' + viral.title + '.', isPos ? LOG_TYPES.success : LOG_TYPES.warning);
        if (data.settings.vibrate) { try { if (navigator.vibrate) navigator.vibrate(isPos ? [20, 40, 20] : [80, 40, 80]); } catch (e) {} }

        bus.emit('feedback:viral-started', { viral });
        bus.emit('state:changed', data);
    }

    _archiveViral(v, outcome) {
        const fb = this.state.data.feedback;
        if (!Array.isArray(fb.viralHistory)) fb.viralHistory = [];
        fb.viralHistory.unshift({
            id: v.id, eventId: v.eventId, type: v.type, title: v.title, i18n: v.i18n || null,
            productName: v.productName || null, outcome: outcome || 'expired',
            year: this.state.data.time.currentYear, month: this.state.data.time.currentMonth
        });
        if (fb.viralHistory.length > VIRAL_HISTORY_MAX) fb.viralHistory.length = VIRAL_HISTORY_MAX;
    }

    _tickViral() {
        const fb = this.state.data.feedback;
        const now = this.state.data.time.elapsedGameMinutes;
        const before = fb.activeViral.length;
        const ended = fb.activeViral.filter(v => v.endsAtMinute <= now);
        fb.activeViral = fb.activeViral.filter(v => v.endsAtMinute > now);
        if (fb.activeViral.length < before) {
            ended.forEach(v => this._archiveViral(v, v.ignored ? 'ignored' : 'expired'));
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
        // "Abaikan" hanya sekali per viral (sebelumnya bisa diklik berulang dan menguras reputasi).
        if (responseId === 'ignore' && viral.ignored) return { ok: false, reason: _lang() === 'id' ? 'Sudah diabaikan.' : 'Already ignored.' };
        if (!WalletService.canAfford(resp.cost)) return { ok: false, reason: 'Uang tidak cukup.' };
        if (resp.cost > 0) WalletService.pay(resp.cost, 'viral-response');
        if (resp.effect.reputation) this.state.addReputation(resp.effect.reputation);
        if (responseId === 'ignore') {
            viral.ignored = true;
        } else {
            fb.activeViral = fb.activeViral.filter(v => v.id !== viralId);
            this._archiveViral(viral, responseId);
        }
        this._recomputeSentiment();
        const label = (resp.i18n && resp.i18n.label) ? _L(resp.i18n.label) : resp.label;
        this.state.addLog((_lang() === 'id' ? 'Respons publik: ' : 'Public response: ') + label + '.', LOG_TYPES.info);
        ToastService.success((_lang() === 'id' ? 'Respons: ' : 'Response: ') + label);
        bus.emit('feedback:viral-responded', { viralId, responseId });
        bus.emit('state:changed', data);
        return { ok: true };
    }

    getSentiment()           { return this.state.data.feedback.sentiment || 50; }
    getAspectSentiment()     { return this.state.data.feedback.aspectSentiment || {}; }
    getFeed(limit)           { return (this.state.data.feedback.feed || []).slice(0, limit || FEED_LIMITS.show); }
    getActiveViral()         { return this.state.data.feedback.activeViral || []; }
    getSuggestions()         { return this.state.data.feedback.suggestions || []; }
    getPerProductSatisfaction() { return this.state.data.feedback.perProductSatisfaction || {}; }
    getCompetitorSentiment() { return this.state.data.feedback.competitorSentiment || {}; }
    getViralHistory()        { return this.state.data.feedback.viralHistory || []; }

    forceViral(type) {
        const want = type === 'positive' ? 'positive' : 'negative';
        const list = VIRAL_EVENTS.filter(v => v.type === want).concat(VIRAL_EXT.filter(v => v.type === want && v.kind !== 'product'));
        if (!list.length) return { ok: false };
        const ev = list[Math.floor(Math.random() * list.length)];
        const extra = ev.segs || ev.regs ? { segs: ev.segs ? ev.segs.slice() : null, regs: ev.regs ? ev.regs.slice() : null } : {};
        this._startViralEvent(ev, extra);
        return { ok: true, event: this._viralText(ev, 'title') };
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
