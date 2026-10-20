// FILE: src/systems/advisor/AdvisorAnalytics.js
// ============================================================
// ADVISOR ANALYTICS — Kalkulasi Matematika & Metrik Bisnis.
// ============================================================
import { getMacro } from '../../core/MacroModel.js';
import { BALANCE } from '../../data/balance.data.js';

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function sumBy(list, fn) { return (list || []).reduce(function (a, x) { return a + (fn(x) || 0); }, 0); }

export const AdvisorAnalytics = {
    // 1. Membangun Konteks (Ctx)
    buildContext(state, deps) {
        const d = state.data || state.get();
        const diff = (BALANCE.difficultyMultiplier && BALANCE.difficultyMultiplier[d.difficulty]) || { expense: 1 };
        const m = BALANCE.monthly || {};
        const cpi = getMacro(d.time, BALANCE.macro).cpiIndex || 1;
        
        const fixed = ((m.rentHQ || 0) + (m.utilities || 0) + (m.baseAdmin || 0)) * cpi * (diff.expense || 1);
        const payroll = sumBy(d.staff, s => s.salary);
        const burn = fixed + payroll;
        
        const catalog = (d.products && d.products.catalog) || [];
        const loans = (d.finance && d.finance.loans) || [];
        const debtService = sumBy(loans, l => l.installment);
        
        const rh = (d.market && d.market.revenueHistory) ? d.market.revenueHistory.slice(0, 3) : [];
        const income = rh.length ? sumBy(rh, r => r.playerRevenue) / rh.length : 0;
        const net = income - burn - debtService;
        const cash = d.cash || 0;
        
        return {
            d: d, deps: deps,
            now: (d.time && d.time.elapsedGameMinutes) || 0,
            cash: cash, burn: burn, payroll: payroll, fixed: fixed,
            runway: burn > 0 ? cash / burn : Infinity,
            income: income, debtService: debtService, net: net,
            trendRunway: net < 0 ? cash / -net : Infinity,
            loans: loans,
            team: {
                engineers: (d.team && d.team.engineers) || 0,
                designers: (d.team && d.team.designers) || 0,
                marketers: (d.team && d.team.marketers) || 0
            },
            catalog: catalog,
            selling: catalog.filter(p => p.status === 'selling')
        };
    },

    // 2. Skor Kesehatan 6 Dimensi
    getHealth(ctx) {
        const L = true; // Selalu gunakan ID untuk internal
        const parts = [];
        
        const add = (id, label, score, weight, note) => {
            parts.push({ id, label, score: Math.round(clamp(score, 0, 100)), weight, note: note || '' });
        };

        // 1. Likuiditas
        let liq = 100, liqNote = '';
        if (ctx.burn > 0) {
            const r = Math.min(ctx.runway, ctx.trendRunway);
            liq = r < 1 ? 5 : r < 3 ? 30 : r < 6 ? 60 : r < 12 ? 85 : 100;
            liqNote = isFinite(r) ? r.toFixed(1) + ' bln' : '';
        }
        if (((ctx.d.finance || {}).negativeMonths || 0) > 0) liq -= 25;
        if (ctx.loans.some(l => (l.missed || 0) > 0)) liq -= 20;
        add('liquidity', 'Likuiditas', liq, 0.28, liqNote);

        // 2. Pertumbuhan
        let gr = ctx.selling.length ? 65 : (ctx.catalog.length ? 40 : 30), grNote = '';
        if (ctx.d.market && ctx.d.market.shareHistory && ctx.d.market.shareHistory.length > 1) {
            const sh0 = ctx.d.market.shareHistory[0].playerShare;
            const sh1 = ctx.d.market.shareHistory[1].playerShare;
            if (sh0 < sh1 * 0.85) gr -= 12;
        }
        add('growth', 'Pertumbuhan', gr, 0.2, grNote);

        // 3. Produk
        let pr = 20, prNote = '';
        if (ctx.catalog.length) {
            pr = 70;
            const out = ctx.selling.filter(p => (p.stock || 0) <= 0).length;
            pr -= out * 25;
            if (!ctx.selling.length) pr -= 20;
        }
        add('product', 'Produk', pr, 0.2, prNote);

        // 4. Tim
        let tm = 40, tmNote = '';
        const staff = ctx.d.staff || [];
        if (staff.length) {
            const mor = sumBy(staff, s => s.morale) / staff.length;
            tm = mor; tmNote = Math.round(mor) + '/100';
        }
        add('team', 'Tim', tm, 0.12, tmNote);

        // 5. Teknologi
        const rsr = ctx.d.research || {};
        const slots = rsr.maxSlots || 1, act = (rsr.active || []).length;
        let te = 40 + (act / slots) * 30 + Math.min(20, (rsr.completed || []).length);
        if (ctx.d.os && (ctx.d.os.versions || []).length) te += 10;
        const bugs = (ctx.d.os && (ctx.d.os.bugs || []).filter(b => b.status === 'active').length) || 0;
        te -= bugs * 6;
        add('tech', 'Teknologi', te, 0.1, act + '/' + slots + ' slot');

        // 6. Merek
        const rep = (ctx.d.market && typeof ctx.d.market.reputation === 'number') ? ctx.d.market.reputation : 10;
        add('brand', 'Merek', rep, 0.1, Math.round(rep) + '/100');

        let score = 0, wsum = 0;
        parts.forEach(p => { score += p.score * p.weight; wsum += p.weight; });
        score = Math.max(5, Math.min(100, Math.round(score / wsum)));
        
        let label = score >= 80 ? 'Sangat baik' : score >= 60 ? 'Baik' : score >= 40 ? 'Waspada' : 'Kritis';
        let weakest = parts.slice().sort((a, b) => a.score - b.score)[0];
        
        return { score, label, parts, weakest };
    },

    // 3. Prediksi Kas
    forecast(ctx, months = 6) {
        let base = [], worst = [], cb = ctx.cash, cw = ctx.cash;
        let outflow = ctx.burn + ctx.debtService;
        for (let m = 1; m <= months; m++) {
            cb += ctx.income - outflow;
            cw += -outflow;
            base.push({ m, cash: cb });
            worst.push({ m, cash: cw });
        }
        return {
            base, worst,
            income: ctx.income, outflow, net: ctx.income - outflow,
            runwayBase: (ctx.income - outflow) < 0 ? ctx.cash / (outflow - ctx.income) : Infinity,
            runwayWorst: outflow > 0 ? ctx.cash / outflow : Infinity
        };
    },

    // 4. Simulasi "What-If"
    simulate(ctx, opts) {
        let addBurn = 0, upfront = 0;
        let hire = opts.hire || {};
        // Kalkulasi gaji (hardcode sementara, nanti bisa ambil dari BALANCE)
        const salaryOf = (role) => role === 'engineer' ? 2500 : role === 'designer' ? 2300 : 2000;
        const recruitCostOf = (role) => role === 'engineer' ? 2000 : role === 'designer' ? 1800 : 1500;

        Object.keys(hire).forEach(role => {
            let n = hire[role] | 0;
            if (n <= 0) return;
            addBurn += n * salaryOf(role);
            upfront += n * recruitCostOf(role);
        });

        let loanAmt = Math.max(0, opts.loan || 0);
        let loanInst = 0;
        if (loanAmt > 0) {
            let rate = 0.03, term = 12;
            loanInst = loanAmt * rate / (1 - Math.pow(1 + rate, -term));
        }

        let cashAfter = ctx.cash - upfront + loanAmt;
        let newBurn = ctx.burn + addBurn;
        let outflow = newBurn + ctx.debtService + loanInst;
        let runway = newBurn > 0 ? cashAfter / newBurn : Infinity;
        let net = ctx.income - outflow;
        
        return {
            upfront, addBurn, loanAmt, loanInst,
            cashAfter, runwayAfter: runway, netAfter: net,
            safe: cashAfter >= newBurn * 3 && (net >= 0 || cashAfter / -net >= 6)
        };
    }
};
