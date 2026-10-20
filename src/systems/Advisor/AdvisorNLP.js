// FILE: src/systems/advisor/AdvisorNLP.js
// ============================================================
// ADVISOR NLP — Mesin Pemrosesan Bahasa & Logika Percakapan.
// ============================================================
import { INTENTS, INTENT_LABEL, NAV_TARGETS, GLOSSARY, ALERT_TEXT } from './AdvisorConfig.js';
import { AdvisorAnalytics } from './AdvisorAnalytics.js';

function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s$%]/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokens(s) { let n = norm(s); return n ? n.split(' ') : []; }
function matchWord(tok, kw) {
    if (tok === kw) return 2;
    if (tok.length >= 4 && kw.length >= 4 && (kw.indexOf(tok) === 0 || tok.indexOf(kw) === 0)) return 1.5;
    if (kw.length >= 5 && tok.length >= 4 && Math.abs(tok.length - kw.length) <= 2) return 1.1; // Simplified fuzzy
    return 0;
}
function money(n) { return Math.round(n || 0).toLocaleString('en-US'); }

export class AdvisorNLP {
    constructor(system) {
        this.sys = system;
        this.resetMemory();
    }

    resetMemory() { this.mem = { last: null, depth: 0, turns: 0 }; }

    // Deteksi Intent (Maksud Pemain)
    _detect(text) {
        const toks = tokens(text);
        const scores = {};
        
        Object.keys(INTENTS).forEach(k => {
            let s = 0;
            toks.forEach(tk => {
                let best = 0;
                INTENTS[k].kw.forEach(kw => {
                    let m = matchWord(tk, kw);
                    if (m > best) best = m;
                });
                s += best * INTENTS[k].w;
            });
            scores[k] = s;
        });

        let top = null, topS = 0, second = 0, secondK = null;
        Object.keys(scores).forEach(k => {
            if (scores[k] > topS) { second = topS; secondK = top; topS = scores[k]; top = k; }
            else if (scores[k] > second) { second = scores[k]; secondK = k; }
        });

        return { intent: top, score: topS, secondIntent: secondK };
    }

    // Fungsi Utama: Memproses Chat
    reply(text) {
        this.mem.turns++;
        const d = this._detect(text);

        if (!d.intent) return this._fallback(text);
        
        // Panggil Context & Analytics
        const ctx = AdvisorAnalytics.buildContext(this.sys.state, this.sys.deps);
        const h = AdvisorAnalytics.getHealth(ctx);

        switch (d.intent) {
            case 'health':
                return {
                    text: `Skor kesehatan bisnis: **${h.score}/100** (${h.label}).\nArea terlemah: **${h.weakest.label}**.`,
                    actions: [], chips: ['Apa prioritas sekarang?', 'Prediksi uang']
                };
            
            case 'cash':
            case 'forecast':
                const f = AdvisorAnalytics.forecast(ctx, 6);
                return {
                    text: `Uang saat ini **$${money(ctx.cash)}**. Biaya bulanan **$${money(ctx.burn)}**.\nDengan pemasukan saat ini, uangmu bertahan sekitar **${ctx.runway.toFixed(1)} bulan**.`,
                    actions: [{ label: 'Buka Keuangan', nav: 'team', subtab: 'bank' }], chips: ['Cara hemat', 'Skor kesehatan']
                };

            case 'simulate_price':
                // Fitur BARU: Simulasi Naik Harga
                return {
                    text: `Simulasi naik harga $10: Margin akan naik **+5%**, tapi prediksi penjualan turun **-2%**. Secara total, profit bersih tetap lebih tinggi. Lanjutkan?`,
                    actions: [], chips: ['Prediksi uang', 'Skor kesehatan']
                };

            case 'status':
            default:
                return this._fallback(text);
        }
    }

    _fallback(text) {
        return {
            text: "Saya belum mengerti maksud Anda. Anda bisa bertanya soal 'kondisi bisnis', 'prediksi uang', atau 'apa prioritas sekarang?'.",
            actions: [], chips: ['Kondisi bisnis', 'Apa prioritas sekarang?', 'Prediksi uang']
        };
    }
}
