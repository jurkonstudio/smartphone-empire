// FILE: src/systems/AdvisorSystem.js
// ============================================================
// ADVISOR SYSTEM — Kontroller Utama (Slim Version).
// ============================================================
import { bus } from '../core/EventBus.js';
import { ToastService } from '../core/ToastService.js';
import { RULES, SEV, DICT } from './advisor/AdvisorConfig.js';
import { AdvisorAnalytics } from './advisor/AdvisorAnalytics.js';
import { AdvisorNLP } from './advisor/AdvisorNLP.js';

export class AdvisorSystem {
    constructor(gameState, deps) {
        this.state = gameState;
        this.deps = deps || {};
        this.nlp = new AdvisorNLP(this);
        this._chat = [];
        this._snoozed = {};
        this._timer = null;
    }

    start() {
        // Dengarkan perubahan hari untuk memberikan saran proaktif
        bus.on('time:day-changed', () => this._evaluateProactiveAdvice());
        console.log('[AdvisorSystem] Smart Assistant siap.');
    }

    // Membangun Konteks dan Menjalankan Aturan (Rules)
    getAdvice() {
        const ctx = AdvisorAnalytics.buildContext(this.state, this.deps);
        let out = [];
        
        const push = (id, sev, icon, vars, action, pri) => {
            // Ambil teks dari DICT (Config)
            const base = id.split(':')[0];
            const title = DICT['id'][base + '.t'].replace(/\{(\w+)\}/g, (m, k) => vars[k] || m);
            const detail = DICT['id'][base + '.d'].replace(/\{(\w+)\}/g, (m, k) => vars[k] || m);
            
            out.push({ id, sev, icon, pri: pri || 50, title, detail, action: action || null });
        };

        RULES.forEach(rule => {
            try { rule(ctx, push); } catch (e) { console.warn('[Advisor] Rule error:', e); }
        });

        // Filter yang di-snooze
        const now = ctx.now;
        out = out.filter(a => !(this._snoozed[a.id] && this._snoozed[a.id] > now));
        out.sort((a, b) => (SEV[a.sev] - SEV[b.sev]) || (a.pri - b.pri));

        if (out.length === 0) {
            out.push({ id: 'all_good', sev: 'info', icon: 'check-circle', pri: 99, title: DICT['id']['all_good.t'], detail: DICT['id']['all_good.d'], action: null });
        }
        return out.slice(0, 8);
    }

    // Kecerdasan BARU: Memberi notifikasi tanpa ditanya jika kondisi kritis
    _evaluateProactiveAdvice() {
        const ctx = AdvisorAnalytics.buildContext(this.state, this.deps);
        const advice = this.getAdvice();
        
        // Cari saran yang statusnya CRITICAL
        const critical = advice.find(a => a.sev === 'critical' && a.id !== 'all_good');
        
        if (critical) {
            // Cek apakah sudah pernah di-toast hari ini
            const dayKey = ctx.d.time.currentDay;
            if (!this._lastCriticalToast || this._lastCriticalToast !== critical.id + dayKey) {
                ToastService.warning(`⚠️ Asisten: ${critical.title}`);
                this._lastCriticalToast = critical.id + dayKey;
            }
        }
    }

    // API UI: Chat
    async chat(text) {
        this.getChat().push({ role: 'user', text: text });
        const res = this.nlp.reply(text);
        this.getChat().push({ role: 'bot', text: res.text, actions: res.actions, chips: res.chips });
        return res;
    }

    getChat() {
        if (!this._chat.length) {
            const h = AdvisorAnalytics.getHealth(AdvisorAnalytics.buildContext(this.state, this.deps));
            this._chat.push({
                role: 'bot',
                text: `Halo! Skor kesehatan bisnismu **${h.score}/100** (${h.label}). Area terlemah: **${h.weakest.label}**. Ada yang bisa saya bantu?`,
                actions: [], chips: ['Apa prioritas sekarang?', 'Skor kesehatan', 'Prediksi uang']
            });
        }
        return this._chat;
    }

    resetChat() { this._chat = []; this.nlp.resetMemory(); }

    snooze(id, days = 30) {
        this._snoozed[id] = AdvisorAnalytics.buildContext(this.state, this.deps).now + (days * 1440);
    }
}
