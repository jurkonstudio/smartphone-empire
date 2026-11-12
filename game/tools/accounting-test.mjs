// Tes akuntansi bulanan: HPP, pengalihan rugi fiskal, bunga pinjaman tidak dikali kesulitan.
// Jalankan: node tools/accounting-test.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || 'src';
stubBrowser(); seedRandom(3); console.info = () => {};
const { state } = await load(root, 'core/GameState.js');
const { EconomySystem } = await load(root, 'systems/EconomySystem.js');
const { bus } = await load(root, 'core/EventBus.js');
const { BALANCE } = await load(root, 'data/balance.data.js');
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.error('GAGAL:', m); } else console.log('ok   ', m); };

function setup(diff) {
    state.reset(diff);
    const d = state.data; d.cash = 1e9;
    d.finance.loans = [{ id: 'x', remaining: 100000, monthlyInterestRate: 0.04, termMonths: 12, paidMonths: 0 }];
    const eco = new EconomySystem(state); eco.start(); return { d, eco };
}
let month = 0;
const run = (eco, rev, cogs) => {
    if (rev) bus.emit('economy:add-revenue', { amount: rev });
    if (cogs) bus.emit('economy:add-cogs', { amount: cogs });
    month++; const snap = { currentYear: 2005 + Math.floor(month / 12), currentMonth: (month % 12) + 1, currentDay: 1 };
    eco._processMonth(snap); return state.data.finance.history[0];
};

// 1) HPP mengurangi laba kena pajak
{
    const { d, eco } = setup('normal'); const rate = BALANCE.difficultyMultiplier.normal.taxRate;
    const e = run(eco, 1000000, 600000);
    ok(e.breakdown.cogs === 600000, 'HPP tercatat di breakdown');
    ok(e.net === e.income - e.expense - 600000 - e.tax, 'net = pemasukan - biaya - HPP - pajak');
    ok(e.tax === Math.round((e.income - e.expense - 600000) * rate), 'pajak dari laba setelah HPP: ' + e.tax);
    ok(d.finance.monthCogs === 0, 'akumulator HPP direset tiap bulan');
}
// 2) pengalihan rugi: bulan rugi dikompensasi bulan untung
{
    const { d, eco } = setup('normal'); const rate = BALANCE.difficultyMultiplier.normal.taxRate;
    const e1 = run(eco, 0, 0);
    ok(e1.tax === 0 && d.finance.taxLossCarry > 0, 'bulan rugi: pajak 0, rugi dibawa: ' + d.finance.taxLossCarry);
    const carry = d.finance.taxLossCarry;
    const e2 = run(eco, 400000, 0);
    const pre = e2.income - e2.expense;
    ok(e2.tax === Math.round(Math.max(0, pre - carry) * rate), 'laba bulan berikut dikurangi rugi bawaan');
    ok(d.finance.taxLossCarry === 0, 'rugi bawaan habis terpakai');
    const e3 = run(eco, 400000, 0);
    ok(e3.tax === Math.round((e3.income - e3.expense) * rate), 'tanpa sisa rugi: pajak penuh');
}
// 3) bunga pinjaman tidak dikali pengali kesulitan
for (const diff of ['santai', 'sulit']) {
    const { d, eco } = setup(diff);
    const e = run(eco, 0, 0); const b = e.breakdown;
    const mul = BALANCE.difficultyMultiplier[diff].expense;
    const expected = Math.round((b.expenseRaw - b.loanInterest) * mul + b.loanInterest);
    ok(b.loanInterest === 4000 && e.expense === expected, `${diff}: bunga $4000 tidak dikali ${mul} (biaya ${e.expense})`);
}
// 4) save lama tanpa field baru tidak menghasilkan NaN
{
    const { d, eco } = setup('normal'); delete d.finance.monthCogs; delete d.finance.taxLossCarry;
    const e = run(eco, 100000, 0);
    ok(Number.isFinite(e.tax) && Number.isFinite(e.net), 'save lama aman (tanpa NaN)');
}
console.log(fails ? fails + ' GAGAL' : 'semua lulus');
process.exit(fails ? 1 : 0);
