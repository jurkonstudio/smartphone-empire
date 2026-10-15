// FILE: src/systems/QuestSystem.js
// v2027.2a — reward silicon.
import { bus } from '../core/EventBus.js';
import { BALANCE } from '../data/balance.data.js';
import { LOG_TYPES } from '../config/constants.js';

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
];

export class QuestSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        this._ensureActive();
        this._unsubs.push(bus.on('time:day-changed', () => this.evaluateAll()));
        this._unsubs.push(bus.on('state:changed', () => this.evaluateAll()));
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    _ensureActive() {
        const q = this.state.data.quests;
        QUEST_DEFS.forEach(def => {
            const isDone = q.completed.includes(def.id);
            const isActive = q.active.some(a => a.id === def.id);
            if (!isDone && !isActive) {
                q.active.push({ id: def.id, title: def.title, description: def.description });
                bus.emit('quest:activated', { id: def.id, title: def.title });
            }
        });
    }

    evaluateAll() {
        const q = this.state.data.quests;
        if (!q.active.length) return;

        const stillActive = [];
        for (const active of q.active) {
            const def = QUEST_DEFS.find(d => d.id === active.id);
            if (!def) continue;
            let passed = false;
            try { passed = !!def.check(this.state); }
            catch (err) { console.error('[QuestSystem] cek gagal', active.id, err); }
            if (passed) {
                this._completeQuest(def);
            } else {
                stillActive.push(active);
            }
        }
        q.active = stillActive;
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
            const d = this.state.data;
            d.silicon = (d.silicon || 0) + r.silicon;
            bus.emit('silicon:changed', { balance: d.silicon, delta: r.silicon });
        }
        this.state.addLog(`Quest selesai: "${def.title}".`, LOG_TYPES.success);
        bus.emit('quest:completed', { id: def.id, title: def.title, rewards: r });
        bus.emit('state:changed', this.state.data);
    }

    getActive() { return this.state.data.quests.active; }
    getCompleted() { return this.state.data.quests.completed; }
}

export { QUEST_DEFS };
