// FILE: src/systems/EconomySystem.js
// v2027.44 — utang lewat BankSystem (cicilan anuitas: bunga masuk laba, pokok mengurangi kas).
// v2027.1b — fix revenue ganda: cash tidak di-add income lagi di bulanan.
import { bus } from '../core/EventBus.js';
import { BALANCE } from '../data/balance.data.js';
import { LOG_TYPES } from '../config/constants.js';
import { getMacro } from '../core/MacroModel.js';
import { WalletService } from './WalletService.js';

// EconomySystem — memproses siklus bulanan:
//   1. Potong gaji + sewa + utilitas + bunga pinjaman.
//   2. Hitung pajak dari laba bersih bulan ini.
//   3. Simpan ringkasan ke finance.history (maks 24 bulan).
//   4. Cek game over (cash negatif N bulan berturut).
//   5. Cek peringatan burn rate.
//
// Catatan alur uang (v2027.1b):
//   - Revenue harian ditambahkan ke cash oleh ProductSystem._processDailySales.
//   - EconomySystem HANYA memotong pengeluaran (salary, fixed, loan, tax).
//   - Laporan bulanan tetap menampilkan income & net untuk informasi, tapi
//     tidak lagi meng-update cash — sudah di-update harian.
export class EconomySystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubMonth = null;
        this._monthRevenue = 0;
        this.bank = null;
        this._runwayLevel = null; // [v2030] level runway terakhir (null = belum dicek)
    }

    setBank(bank) { this.bank = bank; }
    setEconBrakes(eb) { this.econ = eb; }
    setPlants(cps) { this.plants = cps; }
    setChannels(ch) { this.channels = ch; }
    setAfterSales(as) { this.afterSales = as; }

    start() {
        this._unsubMonth = bus.on('time:month-changed', (snapshot) => {
            this._processMonth(snapshot);
        });
        bus.on('economy:add-revenue', ({ amount }) => {
            if (typeof amount === 'number') this._monthRevenue += amount;
        });
        // [v2030] Runway dicek tiap hari agar peringatan muncul saat ambang terlewati.
        bus.on('time:day-changed', () => this._checkRunway());
        // Kenaikan gaji tahunan mengikuti inflasi & pertumbuhan upah dunia nyata.
        bus.on('time:year-changed', (snap) => this._applyAnnualRaise(snap));
    }

    _applyAnnualRaise(snap) {
        const data = this.state.data;
        if (!Array.isArray(data.staff) || !data.staff.length) return;
        const y = snap.currentYear;
        const cfg = BALANCE.macro;
        const now  = getMacro({ currentYear: y,     currentMonth: 1, currentDay: 1 }, cfg).wageIndex;
        const prev = getMacro({ currentYear: y - 1, currentMonth: 1, currentDay: 1 }, cfg).wageIndex;
        const ratio = now / prev;
        if (!isFinite(ratio) || Math.abs(ratio - 1) < 0.0005) return;
        data.staff.forEach((s) => { s.salary = Math.round((s.salary || 0) * ratio); });
        const pct = ((ratio - 1) * 100).toFixed(1);
        this.state.addLog('Gaji tahunan disesuaikan ' + (ratio >= 1 ? '+' : '') + pct + '% (inflasi & pasar tenaga kerja).', LOG_TYPES.info);
        bus.emit('state:changed', data);
    }

    stop() {
        if (this._unsubMonth) { this._unsubMonth(); this._unsubMonth = null; }
    }

    _processMonth(snapshot) {
        const data = this.state.data;
        if (data.gameOver) return;

        const last = data.finance.lastProcessed;
        if (last && last.year === snapshot.currentYear && last.month === snapshot.currentMonth) {
            return;
        }

        const diff = BALANCE.difficultyMultiplier[data.difficulty] || BALANCE.difficultyMultiplier.normal;
        const mul = diff.expense;

        // ---- Pengeluaran ----
        const salary = this.state.getMonthlySalary();
        const fixed = this.state.getMonthlyFixedCost();
        // Utang: bunga (+ denda telat) masuk beban; cicilan pokok hanya mengurangi kas.
        let loanInterest = 0;
        let loanPrincipal = 0;
        let depositInterest = 0;
        if (this.bank) {
            const debt = this.bank.processMonthly();
            loanInterest = debt.interest + debt.lateFees;
            loanPrincipal = debt.principal;
            depositInterest = debt.depositInterest || 0;
        } else {
            loanInterest = this._calcMonthlyLoanInterest();
        }
        // [v2029.1] Pemeliharaan investasi pabrik & akuisisi.
        const upkeep = this.econ ? this.econ.getMonthlyUpkeep() : 0;
        // Pajak properti/utilitas infrastruktur (fab + pabrik komponen).
        const infraTax = this.plants ? this.plants.getMonthlyInfraTax() : 0;
        if (this.plants && infraTax > 0) {
            const cpd = data.componentPlants;
            if (cpd) cpd.taxPaid = (cpd.taxPaid || 0) + infraTax;
        }
        // [Kanal distribusi] biaya tetap bulanan (operator, online, toko sendiri).
        const channelFixed = this.channels ? this.channels.getMonthlyFixedCost() : 0;
        // [Pasca-jual] klaim garansi, dukungan update OS, biaya tetap pusat servis (dihitung sekali per bulan).
        const afterSalesCost = this.afterSales ? this.afterSales.processMonth(snapshot) : 0;
        const expenseBase = salary + fixed + loanInterest + upkeep + infraTax + channelFixed + afterSalesCost;
        const expense = Math.round(expenseBase * mul);

        // ---- Pemasukan (info saja, sudah masuk cash via harian) ----
        const plantRevenue = this.plants ? this.plants.takeMonthlyRevenue() : 0;
        const income = Math.round(this._monthRevenue + plantRevenue);

        // ---- Laba sebelum pajak ----
        const preTax = income - expense;

        // ---- Pajak ----
        const taxRate = diff.taxRate ?? BALANCE.taxRate;
        const tax = preTax > 0 ? Math.round(preTax * taxRate) : 0;

        // ---- Net (info saja) ----
        const net = preTax - tax;

        // ---- Update cash ----
        // [v2027.1b] Revenue harian sudah menambah cash. Hanya potong expense + tax.
        const cashBefore = data.cash;
        let cashAfter = cashBefore - expense - tax - loanPrincipal;
        // Dana darurat: tabungan fleksibel menutup kekurangan kas (bila fitur aktif).
        if (this.bank && cashAfter < 0) cashAfter += this.bank.coverShortfall(-cashAfter);
        // Dana darurat SIL (opsional di Setelan): SIL menutup sisa defisit supaya tidak bangkrut.
        if (cashAfter < 0) cashAfter += WalletService.rescueDeficit(-cashAfter);
        this.state.setCash(cashAfter);

        // ---- Riwayat ----
        const entry = {
            year: snapshot.currentYear,
            month: snapshot.currentMonth,
            income,
            expense,
            tax,
            net,
            cash: cashAfter,
            breakdown: {
                salary, fixed, loanInterest, loanPrincipal, depositInterest, upkeep, infraTax, plantRevenue, afterSales: afterSalesCost,
                tax,
                expenseRaw: expenseBase
            }
        };
        data.finance.history.unshift(entry);
        if (data.finance.history.length > 24) data.finance.history.length = 24;
        data.finance.lastProcessed = { year: snapshot.currentYear, month: snapshot.currentMonth };

        this._monthRevenue = 0;

        // ---- Game over check ----
        if (cashAfter < 0) data.finance.negativeMonths += 1;
        else data.finance.negativeMonths = 0;

        if (data.finance.negativeMonths >= BALANCE.gameOverNegativeMonths) {
            data.gameOver = {
                reason: 'bangkrut',
                year: snapshot.currentYear,
                month: snapshot.currentMonth
            };
            this.state.addLog('Perusahaan dinyatakan bangkrut. Permainan selesai.', LOG_TYPES.danger);
            bus.emit('economy:game-over', {
                reason: data.gameOver.reason,
                negativeMonths: data.finance.negativeMonths
            });
        } else {
            const sign = net >= 0 ? '+' : '';
            this.state.addLog(
                `Laporan bulan ${snapshot.currentMonth}/${snapshot.currentYear}: ${sign}$${net.toLocaleString('en-US')} (pemasukan $${income.toLocaleString('en-US')}, pengeluaran $${expense.toLocaleString('en-US')}).`,
                net >= 0 ? LOG_TYPES.success : LOG_TYPES.warning
            );
        }

        bus.emit('economy:month-processed', entry);
        bus.emit('state:changed', data);

        // ---- Runway (v2030) menggantikan peringatan burn rate lama ----
        this._checkRunway();
    }

    // ============== Runway (v2030) ==============
    // months  : kas / netBurn. netBurn = biaya bulanan dikurangi rata-rata pendapatan 3 bulan terakhir.
    // monthsConservative : kas / biaya bulanan tanpa pendapatan (batas bawah).
    // Opsi extraMonthlyCost (mentah, sebelum pengali kesulitan) dan extraCash dipakai
    // untuk simulasi rekrutmen tanpa mengubah state.
    getRunway(opts) {
        const o = opts || {};
        const data = this.state.data;
        const diffKey = data.difficulty || 'normal';
        const diff = BALANCE.difficultyMultiplier[diffKey] || BALANCE.difficultyMultiplier.normal;
        const extraCost = Number.isFinite(o.extraMonthlyCost) ? o.extraMonthlyCost : 0;
        const extraCash = Number.isFinite(o.extraCash) ? o.extraCash : 0;

        const base = Number(this.getMonthlyCostEstimate()) || 0;
        const burn = Math.max(0, base + extraCost * diff.expense);

        const hist = (data.finance && Array.isArray(data.finance.history)) ? data.finance.history : [];
        const recent = hist.slice(0, 3); // indeks 0 = bulan terbaru
        const avgIncome = recent.length
            ? recent.reduce((s, h) => s + (Number(h.income) || 0), 0) / recent.length
            : 0;
        const netBurn = Math.max(0, burn - avgIncome);

        const cash = Math.max(0, (Number(data.cash) || 0) + extraCash);
        const monthsOf = (b) => (b > 0 ? cash / b : Infinity);
        const months = monthsOf(netBurn);
        const thr = EconomySystem.runwayThresholds(diffKey);

        return {
            cash,
            burn,
            netBurn,
            avgIncome,
            months,
            monthsConservative: monthsOf(burn),
            safe: thr.safe,
            danger: thr.danger,
            level: EconomySystem.runwayLevel(months, diffKey)
        };
    }

    static runwayThresholds(difficulty) {
        const cfg = BALANCE.runway || {};
        const key = difficulty || 'normal';
        const safeMap = cfg.safeMonths || {};
        const dangerMap = cfg.dangerMonths || {};
        return {
            safe: safeMap[key] != null ? safeMap[key] : (safeMap.normal != null ? safeMap.normal : 4),
            danger: dangerMap[key] != null ? dangerMap[key] : (dangerMap.normal != null ? dangerMap.normal : 2)
        };
    }

    // 'ok' | 'low' | 'danger'
    static runwayLevel(months, difficulty) {
        if (Number.isNaN(months)) return 'danger';
        if (months === Infinity) return 'ok';
        const thr = EconomySystem.runwayThresholds(difficulty);
        if (months >= thr.safe) return 'ok';
        if (months < thr.danger) return 'danger';
        return 'low';
    }

    // Emit economy:runway-low hanya saat level naik peringkat (ok -> low, low -> danger, dst).
    // Pengecekan pertama hanya mencatat level tanpa peringatan, supaya muatan save lama tidak langsung berbunyi.
    _checkRunway() {
        if (!this.state || !this.state.data || this.state.data.gameOver) return;
        const rw = this.getRunway();
        const prev = this._runwayLevel;
        this._runwayLevel = rw.level;
        if (prev === null || prev === rw.level) return;
        const rank = { ok: 0, low: 1, danger: 2 };
        if (rank[rw.level] > rank[prev]) {
            bus.emit('economy:runway-low', { level: rw.level, months: rw.months });
        }
    }

    _calcMonthlyLoanInterest() {
        const loans = this.state.data.finance.loans;
        if (!loans.length) return 0;
        return loans.reduce((sum, l) => sum + Math.round(l.remaining * l.monthlyInterestRate), 0);
    }

    // ============== Pinjaman ==============
    takeLoan(loanId) {
        const def = BALANCE.loans.find(l => l.id === loanId);
        if (!def) return { ok: false, error: 'Jenis pinjaman tidak ditemukan.' };
        if (this.bank) return this.bank.takeLegacyLoan(def);
        const data = this.state.data;
        if (data.gameOver) return { ok: false, error: 'Permainan sudah berakhir.' };
        if (data.finance.loans.some(l => l.id === loanId)) {
            return { ok: false, error: 'Pinjaman jenis ini masih aktif.' };
        }

        // Bunga mengikuti suku bunga acuan zaman (rendah 2009-2015, tinggi 2023-2024).
        const rateFactor = getMacro(data.time, BALANCE.macro).rateFactor;
        const loan = {
            id: def.id,
            label: def.label,
            principal: def.principal,
            remaining: def.principal,
            monthlyInterestRate: Math.round(def.monthlyInterestRate * rateFactor * 10000) / 10000,
            termMonths: def.termMonths,
            takenAtYear: data.time.currentYear,
            takenAtMonth: data.time.currentMonth,
            paidMonths: 0
        };
        data.finance.loans.push(loan);
        this.state.addCash(def.principal);
        this.state.addLog(`Mengambil ${def.label} sebesar $${def.principal.toLocaleString('en-US')}.`, LOG_TYPES.info);
        bus.emit('economy:loan-taken', { amount: def.principal, interestRate: def.monthlyInterestRate });
        return { ok: true, loan };
    }

    repayLoan(loanId) {
        if (this.bank) return this.bank.prepay(loanId, 1);
        const data = this.state.data;
        const idx = data.finance.loans.findIndex(l => l.id === loanId);
        if (idx < 0) return { ok: false, error: 'Pinjaman tidak ada.' };
        const loan = data.finance.loans[idx];
        if (!WalletService.canAfford(loan.remaining)) return { ok: false, error: 'Uang tidak cukup.' };
        WalletService.pay(loan.remaining, 'loan-repay');
        data.finance.loans.splice(idx, 1);
        this.state.addLog(`Pinjaman ${loan.label} dilunasi.`, LOG_TYPES.success);
        bus.emit('economy:loan-repaid', { loanId });
        return { ok: true };
    }

    getMonthlyCostEstimate() {
        const diff = BALANCE.difficultyMultiplier[this.state.data.difficulty] || BALANCE.difficultyMultiplier.normal;
        let debtService = 0;
        if (this.bank) debtService = this.bank.previewMonthly().total;
        else debtService = this._calcMonthlyLoanInterest();
        const upkeep = this.econ ? this.econ.getMonthlyUpkeep() : 0;
        const base = this.state.getMonthlySalary() + this.state.getMonthlyFixedCost() + debtService + upkeep;
        return Math.round(base * diff.expense);
    }
}
