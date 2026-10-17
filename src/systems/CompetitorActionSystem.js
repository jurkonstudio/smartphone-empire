// FILE: src/systems/CompetitorActionSystem.js
// ============================================================
// [v2027.5] Aksi dinamis kompetitor — lapisan di atas kurva pangsa historis.
//
// Tiap bulan (time:month-changed) setiap brand aktif mengambil 1 aksi dari pool
// (turunkan harga, kampanye, riset, atau diam). Hasilnya modifier pangsa
// sementara di state.competitorState.actionMods[brandId], yang dibaca oleh
// CompetitorSystem.computeCompetitorPower(). Rilis produk = rilis 8-bulanan
// CompetitorSystem (event 'competitor:released-product'), bukan aksi pool.
//
// Aturan: hanya membaca angka publik (market.share, makro). Tidak membaca
// state internal pemain. Tanpa DOM / Three / timer baru. Semua angka balance
// ada di competitor-actions.data.js.
//
// TODO: appealBonus in marketing.data.js belum diverifikasi — cek apakah memengaruhi share via jalur lain.
// ============================================================
import { bus } from '../core/EventBus.js';
import { BALANCE } from '../data/balance.data.js';
import { LOG_TYPES } from '../config/constants.js';
import { getMacro } from '../core/MacroModel.js';
import { COMPETITORS } from '../data/competitors.data.js';
import { interpShare } from '../data/competitors/helpers.js';
import { COMPETITOR_ACTIONS } from '../data/competitor-actions.data.js';
import { absMonth } from './CompetitorSystem.js';

const CFG = COMPETITOR_ACTIONS;
const POOL_KEYS = Object.keys(CFG.pool);

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export class CompetitorActionSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
        // Indeks id -> data brand, dibangun sekali (hindari find() O(B) per brand).
        this._byId = new Map();
        for (let i = 0; i < COMPETITORS.length; i++) this._byId.set(COMPETITORS[i].id, COMPETITORS[i]);
        this._weights = new Array(POOL_KEYS.length); // buffer dipakai ulang, tanpa alokasi per tick
    }

    start() {
        this._unsubs.push(bus.on('time:month-changed',          (s) => this._onMonthChanged(s)));
        this._unsubs.push(bus.on('competitor:released-product', (p) => this._onReleased(p)));
        this._unsubs.push(bus.on('market:share-updated',        (p) => this._onShareUpdated(p)));
        this._unsubs.push(bus.on('state:hydrated',              () => this._ensureState()));
        this._ensureState();
        console.info('[CompetitorActionSystem] siap.');
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    // Save lama tanpa field baru -> default aman, tidak crash.
    _ensureState() {
        const cs = this.state.data.competitorState;
        if (!cs.actionMods || typeof cs.actionMods !== 'object' || Array.isArray(cs.actionMods)) cs.actionMods = {};
        if (typeof cs.threatActive !== 'boolean') cs.threatActive = false;
    }

    // ============================================================
    // TICK BULANAN — satu loop O(brands), tanpa loop bersarang
    // ============================================================
    _onMonthChanged(snap) {
        this._ensureState();
        const data = this.state.data;
        const cs = data.competitorState;
        const mods = cs.actionMods;
        const entities = cs.entities;
        const tick = absMonth(snap.currentYear, snap.currentMonth);

        // Konteks pasar dihitung SEKALI per tick (angka publik).
        const playerShare = data.market.share || 0;
        const p = clamp(playerShare / CFG.market.pressureRefShare, 0, 1);
        const recession = getMacro(data.time, BALANCE.macro).demandCycle < CFG.market.recessionCycleBelow;

        // Bersihkan brand yang sudah tidak aktif (cegah entri yatim).
        for (const id in mods) { if (!entities[id]) delete mods[id]; }

        for (const id in entities) {
            const comp = this._byId.get(id);
            if (!comp || comp.isEcosystem) continue;

            // 1) Peluruhan + kedaluwarsa
            const m = mods[id];
            if (m && m.modifier !== 0) {
                m.modifier *= CFG.decayPerTick;
                if (tick >= m.untilTick || Math.abs(m.modifier) < CFG.epsilon) m.modifier = 0;
            }

            // 2) Pilih aksi (bobot: agresivitas + kondisi pasar)
            const aggr = CFG.aggressionByPersonality[comp.personality];
            const a = (aggr === undefined ? CFG.defaultAggression : aggr);
            let total = 0;
            for (let i = 0; i < POOL_KEYS.length; i++) {
                const def = CFG.pool[POOL_KEYS[i]];
                let w = def.weight
                    * (1 + def.aggressionGain * (2 * a - 1))
                    * (1 + def.pressureGain * p)
                    * (1 + (recession ? def.recessionGain : 0));
                if (w < 0.05) w = 0.05;
                this._weights[i] = w;
                total += w;
            }
            let r = Math.random() * total, pick = POOL_KEYS.length - 1;
            for (let i = 0; i < POOL_KEYS.length; i++) {
                r -= this._weights[i];
                if (r <= 0) { pick = i; break; }
            }
            const key = POOL_KEYS[pick];
            const def = CFG.pool[key];

            if (def.relEffect === 0) {
                // Diam: dicatat sebagai aksi terakhir, tanpa event (hindari spam).
                this._entry(mods, id).lastAction = key;
                continue;
            }
            this._apply(id, comp, key, def.relEffect, def.durationTicks, tick, snap.currentYear, snap.currentMonth, 'pool');
        }
        bus.emit('state:changed', data);
    }

    // Rilis 8-bulanan CompetitorSystem -> modifier peluncuran (satu jalur).
    _onReleased(payload) {
        if (!payload || !payload.competitorId) return;
        this._ensureState();
        const comp = this._byId.get(payload.competitorId);
        if (!comp || comp.isEcosystem) return;
        const mods = this.state.data.competitorState.actionMods;
        const prev = mods[comp.id];
        let rel = CFG.release.relEffect;
        if (prev && prev.lastAction === 'research') rel *= (1 + CFG.release.researchBonus);
        this._apply(comp.id, comp, 'release_product', rel, CFG.release.durationTicks,
            absMonth(payload.year, payload.month), payload.year, payload.month, 'release');
    }

    _entry(mods, id) {
        let m = mods[id];
        if (!m) { m = { modifier: 0, untilTick: 0, lastAction: 'idle' }; mods[id] = m; }
        return m;
    }

    _apply(id, comp, action, relEffect, durationTicks, tick, year, month, source) {
        const data = this.state.data;
        const mods = data.competitorState.actionMods;
        const base = interpShare(comp.shareByYear, year);
        const baseShare = (base === null || base === undefined) ? 0 : base;

        const raw = relEffect * baseShare * (1 + CFG.jitter * (2 * Math.random() - 1));
        const cap = Math.min(CFG.maxModifier, Math.max(CFG.minModifierCap, CFG.maxModifierRelative * baseShare));

        const m = this._entry(mods, id);
        const before = m.modifier;
        m.modifier = clamp(before + raw, -cap, cap);
        m.untilTick = Math.max(m.untilTick, tick + durationTicks);
        m.lastAction = action;
        const delta = m.modifier - before;

        if (Math.abs(delta) >= CFG.log.notableDelta) {
            this.state.addLog(comp.name + ' (' + action + '): pangsa ' + (delta > 0 ? '+' : '') +
                (delta * 100).toFixed(1) + ' poin.', LOG_TYPES.info);
        }
        bus.emit('competitor:action', {
            competitorId: comp.id,
            competitorName: comp.name,
            action,
            delta,
            modifier: m.modifier,
            untilTick: m.untilTick,
            source,
            year,
            month
        });
    }

    // ============================================================
    // ANCAMAN — sekali saat share pemain turun melewati threshold
    // ============================================================
    _onShareUpdated(payload) {
        if (!payload || typeof payload.playerShare !== 'number') return;
        this._ensureState();
        const data = this.state.data;
        const cs = data.competitorState;
        const T = CFG.threat;
        const share = payload.playerShare;

        // Re-arm (histeresis): hanya bila naik di atas threshold + margin.
        if (cs.threatActive && share > T.threshold + T.rearmMargin) {
            cs.threatActive = false;
            return;
        }
        if (cs.threatActive) return;

        // shareHistory[0] = bulan ini (sudah di-unshift MarketSystem), [1] = sebelumnya.
        const h = data.market.shareHistory || [];
        const prev = h.length > 1 ? h[1].playerShare : 0;
        if (!(prev >= T.threshold && share < T.threshold)) return; // hanya crossing ke bawah

        cs.threatActive = true;
        let top = null;
        const list = payload.competitors || [];
        for (let i = 0; i < list.length; i++) { if (!top || list[i].share > top.share) top = list[i]; }

        this.state.addLog('Pangsa pasar turun di bawah ' + (T.threshold * 100).toFixed(0) + '%.', LOG_TYPES.warning);
        bus.emit('competitor:threat', {
            playerShare: share,
            previousShare: prev,
            threshold: T.threshold,
            topCompetitorId: top ? top.id : null,
            topCompetitorName: top ? top.name : null,
            topCompetitorShare: top ? top.share : 0,
            year: data.time.currentYear,
            month: data.time.currentMonth
        });
    }

    // ============================================================
    // API PUBLIK
    // ============================================================
    getActionMod(id) {
        const m = this.state.data.competitorState.actionMods[id];
        return m ? { modifier: m.modifier, untilTick: m.untilTick, lastAction: m.lastAction } : null;
    }
}
