// FILE: src/systems/CompetitorSystem.js
// v2027.2a — revenue kompetitor anchored historis (share × market size).
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { BALANCE } from '../data/balance.data.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { ToastService } from '../core/ToastService.js';
import { LOG_TYPES } from '../config/constants.js';
import { COMPETITOR_ACTIONS } from '../data/competitor-actions.data.js';
import { getCompetitorReleasesForCompetitor } from '../data/news-competitor-releases.data.js';
import '../data/news-competitor-releases.s1.data.js';
import '../data/news-competitor-releases.s2.data.js';
import '../data/news-competitor-releases.s3.data.js';
import {
    COMPETITORS,
    getActiveCompetitors,
    getCompetitorById,
    getFictionalName,
    getLifeEventsForYear,
    getHistoricalShare
} from '../data/competitors.data.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;
const DAYS_PER_MONTH_AVG = 30.4;

function absMonth(year, month) {
    return year * 12 + (month - 1);
}

function hashStr(str) {
    let h = 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 99991;
    return h;
}

// Jeda ponsel pengisi menurut watak merek (bulan).
function releaseInterval(comp) {
    const map = BALANCE.competitors.aiReleaseIntervalByPersonality || {};
    return map[comp.personality] || BALANCE.competitors.aiReleaseIntervalMonths || 8;
}

export class CompetitorSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        this._unsubs.push(bus.on('time:year-changed',  (s) => this._onYearChanged(s)));
        this._unsubs.push(bus.on('time:month-changed', (s) => this._onMonthChanged(s)));
        this._unsubs.push(bus.on('state:hydrated',     () => this._onHydrated()));

        this._seedForYear(this.state.data.time.currentYear);
        console.info('[CompetitorSystem] siap.');
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    _onHydrated() {
        const cs = this.state.data.competitorState;
        if (!cs.entities) cs.entities = {};
        if (!cs.initialized) {
            cs.initialized = true;
            this._seedForYear(this.state.data.time.currentYear);
        }
    }

    _seedForYear(year) {
        const data = this.state.data;
        const cs = data.competitorState;
        const active = getActiveCompetitors(year);

        if (!cs.withdrawn || typeof cs.withdrawn !== 'object') cs.withdrawn = {};
        if (!cs.lowShareYears || typeof cs.lowShareYears !== 'object') cs.lowShareYears = {};

        active.forEach(c => {
            if (cs.withdrawn[c.id]) return; // [paket kompetitor] merek yang sudah menarik diri tidak disemai ulang
            if (!cs.entities[c.id]) {
                cs.entities[c.id] = {
                    id: c.id,
                    currentTier: c.researchStartTier || 1,
                    currentShare: c.startShare || 0,
                    lastReleaseMonth: absMonth(year, 1) - (hashStr(c.id) % releaseInterval(c)),
                    releases: [],
                    releasedSig: {},
                    activeViralId: null,
                    power: 1.0,
                    introduced: true
                };
                bus.emit('competitor:activated', { id: c.id, name: c.name });
            }
        });

        Object.keys(cs.entities).forEach(id => {
            const c = getCompetitorById(id);
            if (!c) return;
            if (c.activeToYear !== null && year > c.activeToYear) {
                delete cs.entities[id];
                bus.emit('competitor:deactivated', { id: c.id, name: c.name });
            }
        });

        cs.initialized = true;
        bus.emit('state:changed', data);
    }

    _onYearChanged(snap) {
        const data = this.state.data;
        const cs = data.competitorState;
        const year = snap.currentYear;

        this._seedForYear(year);
        this._checkWithdrawals(year);

        const tierInc = BALANCE.competitors.aiResearchTierPerYear || 0.3;
        Object.keys(cs.entities).forEach(id => {
            const e = cs.entities[id];
            e.currentTier = Math.min(5, e.currentTier + tierInc);
        });

        const lifeEvents = getLifeEventsForYear(year);
        lifeEvents.forEach(le => {
            const comp = getCompetitorById(le.competitorId);
            if (!comp) return;
            const e = cs.entities[comp.id];
            if (!e) return;

            // [v2027.2a] Skip life event share delta karena share
            // sekarang bersumber dari historical curve. Hanya emit log.
            const isBig = Math.abs(le.shareDelta || 0) >= 0.05;
            const msg = comp.name + ': ' + le.text;
            this.state.addLog(msg, LOG_TYPES.info);
            if (isBig) {
                ToastService.info('📰 ' + msg);
                this.state.addMilestone('comp_' + comp.id + '_' + year, msg);
            }

            bus.emit('competitor:life-event', {
                competitorId: comp.id,
                competitorName: comp.name,
                year,
                text: le.text,
                shareDelta: le.shareDelta || 0
            });
        });

        cs.lastLifeEventYear = year;
        bus.emit('state:changed', data);
    }

    // [paket kompetitor, SPEKULATIF] Penarikan merek emergent berbasis ambang pangsa.
    _checkWithdrawals(year) {
        const cfg = COMPETITOR_ACTIONS.withdrawal;
        if (!cfg || cfg.enabled === false || year < cfg.fromYear) return;
        const data = this.state.data;
        const cs = data.competitorState;
        if (!cs.withdrawn) cs.withdrawn = {};
        if (!cs.lowShareYears) cs.lowShareYears = {};
        const mods = cs.actionMods || {};

        Object.keys(cs.entities).forEach(id => {
            const comp = getCompetitorById(id);
            if (!comp || comp.isEcosystem) return;
            let share = getHistoricalShare(id, year);
            if (share === null) share = (cs.entities[id].currentShare || 0);
            share += ((mods[id] || {}).modifier || 0);

            if (share < cfg.shareBelow) cs.lowShareYears[id] = (cs.lowShareYears[id] || 0) + 1;
            else cs.lowShareYears[id] = 0;
            if (cs.lowShareYears[id] < cfg.consecutiveYears) return;

            delete cs.entities[id];
            if (mods[id]) delete mods[id];
            cs.withdrawn[id] = year;
            delete cs.lowShareYears[id];
            const msg = comp.name + ' menarik diri dari pasar (simulasi: pangsa terlalu kecil bertahun-tahun).';
            this.state.addLog(msg, LOG_TYPES.info);
            ToastService.info('📰 ' + msg);
            bus.emit('competitor:deactivated', { id: comp.id, name: comp.name, reason: 'withdrawn', year });
        });
    }

    _onMonthChanged(snap) {
        const data = this.state.data;
        const cs = data.competitorState;
        const year = snap.currentYear;
        const month = snap.currentMonth;
        const absNow = absMonth(year, month);

        Object.keys(cs.entities).forEach(id => {
            const e = cs.entities[id];
            const comp = getCompetitorById(id);
            if (!comp || comp.isEcosystem) return;
            if (!e.releasedSig || typeof e.releasedSig !== 'object') e.releasedSig = {};

            // 1) Ponsel ikonik: dirilis di tahun & bulan aslinya (save lama: kejar yang terlewat di tahun ini).
            let launched = false;
            (comp.signatureProducts || []).forEach(sp => {
                if (sp.year !== year || e.releasedSig[sp.name]) return;
                if (this._signatureMonth(comp, sp) > month) return;
                e.releasedSig[sp.name] = true;
                this._pushRelease(comp, e, sp.name, sp.tier || 1, year, month, true);
                e.lastReleaseMonth = absNow;
                launched = true;
            });

            // 2) Ponsel pengisi: hanya bila merek sudah lama tidak merilis apa pun,
            //    supaya setiap kompetitor tetap aktif walau data ikoniknya jarang.
            if (!launched && absNow - e.lastReleaseMonth >= releaseInterval(comp)) {
                this._releaseAiProduct(id, year, month);
                e.lastReleaseMonth = absNow;
            }
        });
    }

    // Bulan rilis ponsel ikonik: pakai bulan dari data berita bila ada, jika tidak sebar deterministik.
    _signatureMonth(comp, sp) {
        if (sp.month >= 1 && sp.month <= 12) return sp.month;
        const key = String(sp.name || '').toLowerCase();
        const news = getCompetitorReleasesForCompetitor(comp.id).find(n =>
            n.year === sp.year && n.product && String(n.product).toLowerCase() === key);
        if (news && news.month >= 1 && news.month <= 12) return news.month;
        return 1 + (hashStr(comp.id + '|' + sp.name) % 12);
    }

    // Catat rilis, tulis log, dan umumkan ke sistem lain (tekanan pasar, berita, toast).
    _pushRelease(comp, e, productName, tier, year, month, signature) {
        e.releases.push({ name: productName, year, month, tier, signature: !!signature });
        if (e.releases.length > 10) e.releases.shift();
        if (signature) e.currentTier = Math.max(e.currentTier, tier);

        this.state.addLog(comp.name + ' merilis ' + productName + ' (Tier ' + tier + ').', LOG_TYPES.info);
        if (signature) ToastService.info('📱 ' + comp.name + ' merilis ' + productName);
        bus.emit('competitor:released-product', {
            competitorId: comp.id,
            competitorName: comp.name,
            productName,
            tier,
            year,
            month,
            signature: !!signature
        });
        bus.emit('state:changed', this.state.data);
    }

    // Ponsel pengisi (non-ikonik). Dipakai tick bulanan dan tombol cheat forceRelease().
    _releaseAiProduct(competitorId, year, month) {
        const comp = getCompetitorById(competitorId);
        if (!comp) return;
        const cs = this.state.data.competitorState;
        const e = cs.entities[competitorId];
        if (!e) return;
        if (!e.releasedSig || typeof e.releasedSig !== 'object') e.releasedSig = {};

        const tier = Math.max(1, Math.min(5, Math.round(e.currentTier + (Math.random() * 0.6 - 0.3))));
        const used = {};
        e.releases.forEach(r => { used[r.name] = true; });
        const productName = this._fillerName(comp, tier, year, used);

        // [v2027.2a] Tidak lagi tambah currentShare; share berasal dari kurva.
        this._pushRelease(comp, e, productName, tier, year, month, false);
    }

    // Nama ponsel pengisi bergaya era: angka seri (<=2004) atau suffix modern, unik per merek.
    _fillerName(comp, tier, year, used) {
        const seriesBase = { 1: 1100, 2: 3300, 3: 6600, 4: 7700, 5: 9900 };
        const suffixes = ['X', 'Pro', 'Plus', 'Lite', 'Neo', 'Air', 'Max', 'Edge'];
        let seq = hashStr(comp.id + year) % 90;
        for (let i = 0; i < 40; i++, seq++) {
            const name = year <= 2004
                ? comp.name + ' ' + (seriesBase[tier] + 10 * (seq % 90))
                : comp.name + ' ' + suffixes[seq % suffixes.length] + ' ' + (year % 100) + (seq >= suffixes.length ? String.fromCharCode(65 + (seq % 26)) : '');
            if (!used[name]) return name;
        }
        return comp.name + ' ' + year + '-' + Math.floor(Math.random() * 900 + 100);
    }

    // ============================================================
    // [v2027.2a] Revenue kompetitor anchored ke historical share
    // × ukuran pasar × harga rata-rata. Tidak lagi pakai noise
    // akumulatif currentShare.
    // ============================================================
    computeCompetitorPower(competitorId, year) {
        const comp = getCompetitorById(competitorId);
        if (!comp) return 0;
        const e = this.state.data.competitorState.entities[competitorId];
        if (!e) return 0;

        // Historical share (0-1) untuk tahun ini.
        let baseShare = getHistoricalShare(competitorId, year);
        if (baseShare === null) baseShare = e.currentShare || 0;
        baseShare = Math.max(0, baseShare + (((this.state.data.competitorState.actionMods || {})[competitorId] || {}).modifier || 0)); // [v2027.5] modifier aksi dinamis (CompetitorActionSystem)

        // Ukuran pasar dan harga rata-rata (interpolasi linear).
        const units   = this._interpYearly(BALANCE.market.marketUnitsByYear, year, 30000000);
        const avgP    = this._interpYearly(BALANCE.market.avgPriceByYear, year, 200);
        const marketRevenue = units * avgP;

        // Base revenue = share × market revenue.
        const baseRevenue = marketRevenue * baseShare;

        // Noise kecil ±5% biar tidak kaku.
        const noise = 1 + (Math.random() * 2 - 1) * 0.05;

        return Math.round(baseRevenue * noise);
    }

    _interpYearly(map, year, fallback) {
        if (!map) return fallback || 0;
        if (map[year] !== undefined) return map[year];
        const years = Object.keys(map).map(Number).sort((a, b) => a - b);
        if (!years.length) return fallback || 0;
        if (year < years[0]) return map[years[0]];
        if (year > years[years.length - 1]) return map[years[years.length - 1]];
        for (let i = 0; i < years.length - 1; i++) {
            const y1 = years[i], y2 = years[i + 1];
            if (year >= y1 && year <= y2) {
                const v1 = map[y1], v2 = map[y2];
                return v1 + (v2 - v1) * ((year - y1) / (y2 - y1));
            }
        }
        return map[years[years.length - 1]];
    }

    getDisplayName(competitorId, mode) {
        const comp = getCompetitorById(competitorId);
        if (!comp) return competitorId;
        return mode === 'fictional' ? getFictionalName(competitorId) : comp.name;
    }

    getActiveIds() {
        return Object.keys(this.state.data.competitorState.entities);
    }

    getCompetitorData(id, mode) {
        const comp = getCompetitorById(id);
        if (!comp) return null;
        const e = this.state.data.competitorState.entities[id];
        return {
            id: comp.id,
            name: mode === 'fictional' ? getFictionalName(id) : comp.name,
            realName: comp.name,
            country: comp.country,
            color: comp.color,
            personality: comp.personality,
            osName: comp.osName,
            strengths: comp.strengths || [],
            weaknesses: comp.weaknesses || [],
            currentTier: e ? e.currentTier : comp.researchStartTier,
            currentShare: e ? e.currentShare : comp.startShare,
            lastRelease: e && e.releases.length ? e.releases[e.releases.length - 1] : null,
            signatureProducts: comp.signatureProducts || [],
            activeFromYear: comp.activeFromYear,
            activeToYear: comp.activeToYear,
            // [v2027.2a] Biografi — dipakai di modal detail.
            foundedYear: comp.foundedYear,
            founder: comp.founder,
            hq: comp.hq,
            parentCompany: comp.parentCompany,
            origin: comp.origin,
            exitReason: comp.exitReason,
            isEcosystem: !!comp.isEcosystem
        };
    }

    forceRelease(competitorId) {
        const y = this.state.data.time.currentYear;
        const m = this.state.data.time.currentMonth;
        this._releaseAiProduct(competitorId, y, m);
        return { ok: true };
    }

    triggerLifeEventFor(competitorId) {
        const comp = getCompetitorById(competitorId);
        if (!comp) return { ok: false, reason: 'Kompetitor tidak ditemukan.' };
        const events = (comp.lifeEvents || []).filter(le => le.year === this.state.data.time.currentYear);
        if (!events.length) return { ok: false, reason: 'Tidak ada life event tahun ini.' };
        const le = events[0];
        this.state.addLog('(cheat) ' + comp.name + ': ' + le.text, LOG_TYPES.info);
        bus.emit('competitor:life-event', { competitorId, competitorName: comp.name, year: this.state.data.time.currentYear, text: le.text, shareDelta: le.shareDelta || 0 });
        return { ok: true };
    }
}

export { absMonth, DAYS_PER_MONTH_AVG };
