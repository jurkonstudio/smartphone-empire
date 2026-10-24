// FILE: src/systems/QuestSystem.js
// v2027.2a — reward silicon.
// v2028.41 — reward SIL lewat SiliconService.add('quest:<id>') (disinkronkan ke server).
import { bus } from '../core/EventBus.js';
import { BALANCE } from '../data/balance.data.js';
import { LOG_TYPES } from '../config/constants.js';
import { SiliconService } from './SiliconService.js';
import { LanguageService } from '../core/LanguageService.js';

// ------------------------------------------------------------
// [era-quest] Target era 2000–2002.
// Field tambahan pada definisi quest (semua opsional):
//   from      { year, month? }  baru aktif mulai bulan ini
//   until     { year, month }   lewat batas ini quest hangus (tanpa hadiah)
//   requires  [id]              aktif setelah quest-quest ini selesai
//   i18n      { title:{id,en}, description:{id,en} }
// ------------------------------------------------------------
const _abs = (y, m) => (Number(y) || 0) * 12 + (Number(m) || 1);
const _unitsSold = (state) => state.data.products.catalog.reduce((a, p) => a + (p.totalSold || 0), 0);
const _hasProduct = (state, fn) => state.data.products.catalog.some(p => { try { return fn(p.config || {}); } catch (e) { return false; } });

const ERA_QUEST_DEFS = [
    {
        id: 'era_two_products', from: { year: 2000 }, until: { year: 2001, month: 12 }, requires: ['first_product'],
        title: 'Dua lini produk', description: 'Rilis ponsel kedua supaya katalog punya pilihan.',
        i18n: { title: { id: 'Dua lini produk', en: 'Two product lines' }, description: { id: 'Rilis ponsel kedua supaya katalog punya pilihan.', en: 'Release a second phone so your catalogue has options.' } },
        check: (state) => state.data.products.catalog.length >= 2,
        rewards: Object.assign({}, BALANCE.questRewards.era_two_products)
    },
    {
        id: 'era_decide_2', from: { year: 2000 }, until: { year: 2001, month: 12 }, requires: ['first_product'],
        title: 'Pengambil keputusan', description: 'Ambil keputusan pada 2 event industri.',
        i18n: { title: { id: 'Pengambil keputusan', en: 'Decision maker' }, description: { id: 'Ambil keputusan pada 2 event industri.', en: 'Make a call on 2 industry events.' } },
        check: (state) => ((state.data.events && state.data.events.history) || []).length >= 2,
        rewards: Object.assign({}, BALANCE.questRewards.era_decide_2)
    },
    {
        id: 'era_carrier_deal', from: { year: 2000 }, until: { year: 2001, month: 12 }, requires: ['first_product'],
        title: 'Kontrak operator pertama', description: 'Teken kontrak dengan operator lewat event industri (OEM 3G atau paket GPRS).',
        i18n: { title: { id: 'Kontrak operator pertama', en: 'First carrier deal' }, description: { id: 'Teken kontrak dengan operator lewat event industri (OEM 3G atau paket GPRS).', en: 'Sign a deal with a carrier through an industry event (3G OEM or GPRS bundle).' } },
        check: (state) => ((state.data.events && state.data.events.history) || []).some(h =>
            (h.eventId === 'ev2000_3g_auction' && h.choiceId === 'oem') || (h.eventId === 'ev2001_gprs_data' && h.choiceId === 'partner')),
        rewards: Object.assign({}, BALANCE.questRewards.era_carrier_deal)
    },
    {
        id: 'era_sales_5k', from: { year: 2000 }, until: { year: 2001, month: 6 }, requires: ['first_product'],
        title: 'Jual 5.000 unit', description: 'Jual total 5.000 unit ponsel.',
        i18n: { title: { id: 'Jual 5.000 unit', en: 'Sell 5,000 units' }, description: { id: 'Jual total 5.000 unit ponsel.', en: 'Sell 5,000 phones in total.' } },
        check: (state) => _unitsSold(state) >= 5000,
        rewards: Object.assign({}, BALANCE.questRewards.era_sales_5k)
    },
    {
        id: 'era_color_phone', from: { year: 2001 }, until: { year: 2002, month: 12 }, requires: ['first_product'],
        title: 'Ponsel layar warna pertama', description: 'Rilis ponsel dengan layar berwarna.',
        i18n: { title: { id: 'Ponsel layar warna pertama', en: 'First colour-screen phone' }, description: { id: 'Rilis ponsel dengan layar berwarna.', en: 'Release a phone with a colour screen.' } },
        check: (state) => _hasProduct(state, c => c.displayId && String(c.displayId).indexOf('scr_mono') !== 0),
        rewards: Object.assign({}, BALANCE.questRewards.era_color_phone)
    },
    {
        id: 'era_own_os', from: { year: 2001 }, until: { year: 2002, month: 12 }, requires: ['first_product'],
        title: 'OS buatan sendiri', description: 'Rilis versi pertama OS milikmu.',
        i18n: { title: { id: 'OS buatan sendiri', en: 'Your own OS' }, description: { id: 'Rilis versi pertama OS milikmu.', en: 'Release the first version of your own OS.' } },
        check: (state) => ((state.data.os && state.data.os.versions) || []).length >= 1,
        rewards: Object.assign({}, BALANCE.questRewards.era_own_os)
    },
    {
        id: 'era_rep_20', from: { year: 2001 }, until: { year: 2002, month: 12 }, requires: ['first_product'],
        title: 'Nama yang dikenal', description: 'Capai reputasi 20.',
        i18n: { title: { id: 'Nama yang dikenal', en: 'A name people know' }, description: { id: 'Capai reputasi 20.', en: 'Reach reputation 20.' } },
        check: (state) => (state.data.market.reputation || 0) >= 20,
        rewards: Object.assign({}, BALANCE.questRewards.era_rep_20)
    },
    {
        id: 'era_camera_13mp', from: { year: 2002 }, until: { year: 2002, month: 12 }, requires: ['first_product'],
        title: 'Ponsel kamera 1,3 MP', description: 'Rilis ponsel dengan kamera 1,3 MP.',
        i18n: { title: { id: 'Ponsel kamera 1,3 MP', en: '1.3 MP camera phone' }, description: { id: 'Rilis ponsel dengan kamera 1,3 MP.', en: 'Release a phone with a 1.3 MP camera.' } },
        check: (state) => _hasProduct(state, c => c.cameraId === 'cam_1_3mp'),
        rewards: Object.assign({}, BALANCE.questRewards.era_camera_13mp)
    },
    {
        id: 'era_sales_50k', from: { year: 2001 }, until: { year: 2002, month: 12 }, requires: ['era_sales_5k'],
        title: 'Jual 50.000 unit', description: 'Jual total 50.000 unit ponsel.',
        i18n: { title: { id: 'Jual 50.000 unit', en: 'Sell 50,000 units' }, description: { id: 'Jual total 50.000 unit ponsel.', en: 'Sell 50,000 phones in total.' } },
        check: (state) => _unitsSold(state) >= 50000,
        rewards: Object.assign({}, BALANCE.questRewards.era_sales_50k)
    }
];

const QUEST_DEFS = [
    {
        id: 'first_start_research',
        title: 'Riset pertama',
        description: 'Mulai satu proyek riset.',
        check: (state) => state.data.research.active.length > 0 || state.data.research.completed.length > 0,
        rewards: Object.assign({ silicon: 3 }, BALANCE.questRewards.first_start_research)
    },
    {
        id: 'first_recruit',
        title: 'Bangun tim',
        description: 'Rekrut minimal 1 anggota tim.',
        check: (state) => {
            const t = state.data.team;
            return (t.engineers + t.designers + t.marketers) >= 1;
        },
        rewards: Object.assign({ silicon: 3 }, BALANCE.questRewards.first_recruit)
    },
    {
        id: 'first_product',
        title: 'Rilis ponsel pertama',
        description: 'Selesaikan desain dan rilis satu produk.',
        check: (state) => state.data.products.catalog.length > 0,
        rewards: Object.assign({ silicon: 5 }, BALANCE.questRewards.first_product)
    }
].concat(ERA_QUEST_DEFS);

// Teks quest sesuai bahasa. Quest lama (tanpa i18n) memakai teks yang tersimpan.
export function localizeQuest(q) {
    const def = QUEST_DEFS.find(d => d.id === (q && q.id));
    let lang = 'en';
    try { lang = LanguageService.getLang() === 'id' ? 'id' : 'en'; } catch (e) {}
    if (def && def.i18n) return { title: def.i18n.title[lang], description: def.i18n.description[lang] };
    return { title: q ? q.title : '', description: q ? q.description : '' };
}

export class QuestSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        this._ensureActive();
        this._unsubs.push(bus.on('time:day-changed', () => this.evaluateAll()));
        this._unsubs.push(bus.on('time:month-changed', () => { this._ensureActive(); this.evaluateAll(); }));
        this._unsubs.push(bus.on('state:changed', () => this.evaluateAll()));
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    // Jendela waktu & prasyarat (quest lama tanpa field ini selalu terbuka).
    _isOpen(def) {
        const q = this.state.data.quests;
        const t = this.state.data.time;
        const now = _abs(t.currentYear, t.currentMonth);
        if (def.from && now < _abs(def.from.year, def.from.month || 1)) return false;
        if (def.until && now > _abs(def.until.year, def.until.month || 12)) return false;
        if (Array.isArray(def.requires) && !def.requires.every(r => q.completed.includes(r))) return false;
        return true;
    }

    _ensureActive() {
        const q = this.state.data.quests;
        if (!Array.isArray(q.expired)) q.expired = [];
        const t = this.state.data.time;
        const now = _abs(t.currentYear, t.currentMonth);

        // Hangus: quest bertenggat yang lewat batas waktu tanpa selesai.
        q.active = q.active.filter(a => {
            const def = QUEST_DEFS.find(d => d.id === a.id);
            if (def && def.until && now > _abs(def.until.year, def.until.month || 12) && !q.completed.includes(def.id)) {
                q.expired.push(def.id);
                this.state.addLog(`Target era berakhir: "${def.title}".`, LOG_TYPES.info);
                bus.emit('quest:expired', { id: def.id, title: def.title });
                return false;
            }
            return true;
        });

        QUEST_DEFS.forEach(def => {
            const isDone = q.completed.includes(def.id);
            const isActive = q.active.some(a => a.id === def.id);
            if (!isDone && !isActive && !q.expired.includes(def.id) && this._isOpen(def)) {
                q.active.push({ id: def.id, title: def.title, description: def.description });
                bus.emit('quest:activated', { id: def.id, title: def.title });
            }
        });
    }

    evaluateAll() {
        const q = this.state.data.quests;
        if (!q.active.length) return;

        const stillActive = [];
        let completedAny = false;
        for (const active of q.active) {
            const def = QUEST_DEFS.find(d => d.id === active.id);
            if (!def) continue;
            let passed = false;
            try { passed = !!def.check(this.state); }
            catch (err) { console.error('[QuestSystem] cek gagal', active.id, err); }
            if (passed) {
                completedAny = true;
                this._completeQuest(def);
            } else {
                stillActive.push(active);
            }
        }
        q.active = stillActive;
        if (completedAny) this._ensureActive();   // buka quest yang prasyaratnya baru terpenuhi
    }

    _completeQuest(def) {
        const q = this.state.data.quests;
        if (q.completed.includes(def.id)) return;
        q.completed.push(def.id);

        const r = def.rewards || {};
        if (r.cash) this.state.addCash(r.cash);
        if (r.reputation) {
            this.state.data.market.reputation = (this.state.data.market.reputation || 0) + r.reputation;
        }
        // [v2027.2a] Reward Silicon.
        if (r.silicon) {
            // [FIX] Lewat SiliconService.add (reason 'quest:<id>') supaya CloudSync mengklaimnya ke server.
            // Dulu saldo diubah langsung -> tak pernah sampai ke server -> hilang saat sinkron berikutnya.
            SiliconService.add(r.silicon, 'quest:' + def.id);
        }
        this.state.addLog(`Quest selesai: "${def.title}".`, LOG_TYPES.success);
        bus.emit('quest:completed', { id: def.id, title: def.title, rewards: r });
        bus.emit('state:changed', this.state.data);
    }

    getActive() { return this.state.data.quests.active; }
    getCompleted() { return this.state.data.quests.completed; }
}

export { QUEST_DEFS };
