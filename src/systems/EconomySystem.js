// FILE: src/systems/EconomySystem.js
// v2027.1b — fix revenue ganda: cash tidak di-add income lagi di bulanan.
import { bus } from '../core/EventBus.js';
import { BALANCE } from '../data/balance.data.js';
import { LOG_TYPES } from '../config/constants.js';

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
    }

    start() {
        this._unsubMonth = bus.on('time:month-changed', (snapshot) => {
            this._processMonth(snapshot);
        });
        bus.on('economy:add-revenue', ({ amount }) => {
            if (typeof amount === 'number') this._monthRevenue += amount;
        });
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
        const loanInterest = this._calcMonthlyLoanInterest();
        const expenseBase = salary + fixed + loanInterest;
        const expense = Math.round(expenseBase * mul);

        // ---- Pemasukan (info saja, sudah masuk cash via harian) ----
        const income = Math.round(this._monthRevenue);

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
        const cashAfter = cashBefore - expense - tax;
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
                salary, fixed, loanInterest,
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

        // ---- Burn rate warning ----
        const monthlyCost = expenseBase * mul;
        if (monthlyCost > 0 && cashAfter >= 0) {
            const monthsLeft = cashAfter / monthlyCost;
            if (monthsLeft < BALANCE.burnRateWarnThreshold) {
                bus.emit('economy:warn-burnrate', { monthsLeft: Math.floor(monthsLeft) });
            }
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
        const data = this.state.data;
        if (data.gameOver) return { ok: false, error: 'Permainan sudah berakhir.' };
        if (data.finance.loans.some(l => l.id === loanId)) {
            return { ok: false, error: 'Pinjaman jenis ini masih aktif.' };
        }

        const loan = {
            id: def.id,
            label: def.label,
            principal: def.principal,
            remaining: def.principal,
            monthlyInterestRate: def.monthlyInterestRate,
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
        const data = this.state.data;
        const idx = data.finance.loans.findIndex(l => l.id === loanId);
        if (idx < 0) return { ok: false, error: 'Pinjaman tidak ada.' };
        const loan = data.finance.loans[idx];
        if (data.cash < loan.remaining) return { ok: false, error: 'Uang tidak cukup.' };
        this.state.addCash(-loan.remaining);
        data.finance.loans.splice(idx, 1);
        this.state.addLog(`Pinjaman ${loan.label} dilunasi.`, LOG_TYPES.success);
        bus.emit('economy:loan-repaid', { loanId });
        return { ok: true };
    }

    getMonthlyCostEstimate() {
        const diff = BALANCE.difficultyMultiplier[this.state.data.difficulty] || BALANCE.difficultyMultiplier.normal;
        const base = this.state.getMonthlySalary() + this.state.getMonthlyFixedCost() + this._calcMonthlyLoanInterest();
        return Math.round(base * diff.expense);
    }
}
