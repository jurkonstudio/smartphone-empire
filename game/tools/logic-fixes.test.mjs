// Tes regresi perbaikan logika (Node, tanpa browser). Jalankan: node tools/logic-fixes.test.mjs
import { stubBrowser, load } from './boot.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
stubBrowser();

const { state } = await load(root, 'core/GameState.js');
const { bus } = await load(root, 'core/EventBus.js');
const { ProductSystem } = await load(root, 'systems/ProductSystem.js');
const { EconomySystem } = await load(root, 'systems/EconomySystem.js');
const { TimeSystem } = await load(root, 'core/TimeSystem.js');

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.error('GAGAL:', m); } else console.log('ok   ', m); };

// ---- 1. Jual-habis tidak boleh untung (rilis lalu hentikan) ----
{
    state.reset('normal');
    const ps = new ProductSystem(state);
    const unitCost = 100, qty = 10000;
    const price = unitCost * 4;                     // harga maksimum yang diizinkan wizard
    state.data.products.catalog.push({
        id: 'px', name: 'X', status: 'selling', price, unitCost, stock: qty,
        config: { productionQty: qty }, pendingProduction: []
    });
    const before = state.data.cash;
    const r = ps.discontinueProduct('px');
    const gained = state.data.cash - before;
    ok(r.ok, 'discontinue berhasil');
    ok(gained <= unitCost * qty, 'jual-habis tidak melebihi biaya produksi (' + gained + ' <= ' + unitCost * qty + ')');
    ok(gained > 0, 'jual-habis tetap memberi sisa nilai');
}

// ---- 2. Pendapatan bulan berjalan tersimpan di state ----
{
    state.reset('normal');
    const eco = new EconomySystem(state);
    eco.start();
    bus.emit('economy:add-revenue', { amount: 5000 });
    bus.emit('wholesale:delivered', { total: 2500 });
    ok(state.data.finance.monthRevenue === 7500, 'pendapatan + grosir tercatat di state: ' + state.data.finance.monthRevenue);
    // simulasi reload: serialisasi -> state baru -> sistem baru
    const saved = JSON.parse(JSON.stringify(state.serialize()));
    state.reset('normal');
    state.hydrate ? state.hydrate(saved) : state.load(saved);
    const eco2 = new EconomySystem(state);
    ok(eco2._getMonthRevenue() === 7500, 'pendapatan bulan berjalan selamat dari reload');
    eco.stop();
    // start() dua kali tidak menggandakan penghitungan
    const eco3 = new EconomySystem(state); eco3.start(); eco3.start();
    const b = state.data.finance.monthRevenue;
    bus.emit('economy:add-revenue', { amount: 100 });
    ok(state.data.finance.monthRevenue === b + 100, 'start() berulang tidak menggandakan listener');
    eco3.stop();
}

// ---- 3. setCash menolak NaN/Infinity ----
{
    state.reset('normal');
    const c = state.data.cash;
    state.setCash(NaN); state.setCash(Infinity); state.addCash(NaN);
    ok(state.data.cash === c, 'kas tidak bisa menjadi NaN/Infinity');
}

// ---- 4. Lompat waktu memancarkan event tiap hari/bulan/tahun ----
{
    state.reset('normal');
    const ts = new TimeSystem(state);
    const counts = { day: 0, month: 0, year: 0 };
    const u = [
        bus.on('time:day-changed', () => counts.day++),
        bus.on('time:month-changed', () => counts.month++),
        bus.on('time:year-changed', () => counts.year++)
    ];
    ts.fastForwardDays(400);
    u.forEach(f => f());
    ok(counts.day === 400, 'skip 400 hari -> 400 event hari: ' + counts.day);
    ok(counts.month >= 13, 'skip 400 hari -> >=13 event bulan: ' + counts.month);
    ok(counts.year === 1, 'skip 400 hari -> 1 event tahun: ' + counts.year);
}

// ---- 5. Runway memperhitungkan pajak infrastruktur & biaya kanal ----
{
    state.reset('normal');
    const eco = new EconomySystem(state);
    const base = eco.getMonthlyCostEstimate();
    eco.setPlants({ getMonthlyInfraTax: () => 1000 });
    eco.setChannels({ getMonthlyFixedCost: () => 500 });
    const withExtra = eco.getMonthlyCostEstimate();
    ok(withExtra - base >= 1500, 'estimasi biaya bulanan ikut pajak infra + kanal: +' + (withExtra - base));
}

console.log(fails ? fails + ' GAGAL' : 'semua lulus');
process.exit(fails ? 1 : 0);
