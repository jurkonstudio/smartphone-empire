// Uji integrasi: Desainer Chip -> Fab -> Pabrik SoC -> Produk (jalankan dari akar repo)
// Pemakaian: node tools/chip-design-plant-test.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
import path from 'node:path';
const root = path.resolve(process.argv[2] || 'src');
stubBrowser(); seedRandom(11);

const { state } = await load(root, 'core/GameState.js');
const { ComponentPlantSystem } = await load(root, 'systems/ComponentPlantSystem.js');
const { ProductSystem } = await load(root, 'systems/ProductSystem.js');
const { getComponentById } = await load(root, 'data/components.data.js');
const { TIME_CONFIG } = await load(root, 'config/time.config.js');
const { getPlantYield } = await load(root, 'data/material-plants.data.js');

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok   :', m); };
const MIN_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;

state.reset('normal');
const cps = new ComponentPlantSystem(state);
cps._onHydrated();
const prod = new ProductSystem(state);
const d = state.data;
d.cash = 1e15;
d.time.currentYear = 2026;

// Satu chip hasil desain yang sudah rilis (bentuk sama seperti ChipSystem._releaseChip).
const DESIGN_ID = 'chip_test_1';
const CID = 'cd_' + DESIGN_ID;
d.chips = { catalog: [{
    id: DESIGN_ID, name: 'Test SoC',
    config: { architectureId: 'arch_arm_64', nodeId: 'node_7nm', cores: 4, clockGHz: 2.0, cacheKB: 1024, features: [] },
    stats: { performance: 70, efficiency: 60, costPerUnit: 400, archName: 'ARM64', nodeName: '7nm' },
    yieldRate: 0.8, designCost: 1000000,
    releaseDate: { year: 2025, month: 1, day: 1 }, competitorPressure: 0.2
}], designing: null, nextChipId: 2 };

// Fab berdiri level 1 (kapasitas 5000/bulan) dan pabrik SoC level 1 sudah jadi.
d.fab.built = true; d.fab.level = 1; d.fab.inventory = 0; d.fab.producing = null;
d.fab.stockByChip = {};
d.componentPlants.plants.soc = { built: true, level: 1, upgrade: null, producing: null, idleDays: 0, unpaid: 0 };

// 1) Chip desain terbaca sebagai komponen
const comp = getComponentById(CID);
ok(!!comp, 'getComponentById(cd_...) menemukan chip desain');
ok(comp && comp.category === 'chip' && comp.isPlayerDesign === true, 'chip desain berkategori chip dan ditandai pemain');
ok(comp && comp.stats.performance === 70 && comp.stats.quality === 60, 'stat chip desain dibawa dari desain (perf 70, quality 60)');
ok(!!getComponentById('chip_2nm'), 'chip statis (chip_2nm) tetap ditemukan');
ok(getComponentById('cd_chip_tidak_ada') === null, 'ID chip desain yang tidak ada -> null');

// 2) Pabrik SoC menawarkan chip desain
ok(cps.getEligibleComponents('soc').some(c => c.id === CID), 'pabrik SoC menawarkan chip desain');
ok(cps.getEligibleComponents('battery').every(c => !c.isPlayerDesign), 'pabrik baterai tidak menawarkan chip desain');

// 3) Biaya mengikuti stok Fab: stok kosong lebih mahal dari stok penuh
const costEmpty = cps.getUnitCost(CID);
d.fab.stockByChip[DESIGN_ID] = 5000; d.fab.inventory = 5000;   // = kapasitas 1 bulan
const costFull = cps.getUnitCost(CID);
ok(costEmpty > costFull, 'stok fab kosong membuat harga chip desain lebih mahal');
ok(Math.abs(costEmpty / costFull - 1.5) < 0.01, 'rasio harga kosong/penuh ≈ 1,5 (DESIGN_SCARCITY_MAX 0,5)');
d.fab.stockByChip[DESIGN_ID] = 0; d.fab.inventory = 0;

// 4) Produksi SoC butuh stok fab
let r = cps.orderProduction('soc', CID, 3000);
ok(r.ok === false && /Stok fab/.test(r.reason), 'tanpa stok fab, produksi SoC ditolak: ' + (r.reason || ''));

d.fab.stockByChip[DESIGN_ID] = 5000; d.fab.inventory = 5000;
r = cps.orderProduction('soc', CID, 3000);
ok(r.ok === true && r.qty === 3000, 'produksi SoC 3000 unit diterima saat stok fab 5000');
ok(d.fab.stockByChip[DESIGN_ID] === 2000 && d.fab.inventory === 2000, 'stok fab berkurang 3000 (die dipakai SoC)');

// 5) Batal produksi mengembalikan die ke stok fab
const c1 = cps.cancelProduction('soc');
ok(c1.ok === true, 'batal produksi berhasil');
ok(d.fab.stockByChip[DESIGN_ID] === 5000 && d.fab.inventory === 5000, 'batal produksi mengembalikan die ke stok fab');

// 6) Selesai produksi: unit masuk inventory pabrik sebesar yield
cps.orderProduction('soc', CID, 3000);
const ps = d.componentPlants.plants.soc;
const expectUnits = Math.floor(3000 * getPlantYield(1));
d.time.elapsedGameMinutes += MIN_PER_DAY * (ps.producing.durationDays + 1);
cps._tickProduction('soc');
ok(ps.producing === null, 'produksi selesai dan slot pabrik kembali kosong');
ok(cps.getInventory(CID) === expectUnits, 'inventory SoC = ' + expectUnits + ' unit (yield ' + getPlantYield(1) + ')');
ok(d.fab.stockByChip[DESIGN_ID] === 2000, 'die yang sudah dipakai tidak kembali saat produksi selesai');

// 7) Chip desain dipakai produk: stat performa ikut, lebih tinggi dari chip statis kecil
const base = { displayId: 'scr_tft', batteryId: 'bat_liion', networkId: 'net_2g', bodyId: 'body_plastic', formFactorId: 'ff_bar', osOptionId: 'x' };
const sDesign = prod.computeStats(Object.assign({}, base, { chipId: CID }));
const sStatic = prod.computeStats(Object.assign({}, base, { chipId: 'chip_single' }));
ok(sDesign.performance > sStatic.performance, 'produk dengan chip desain punya performa lebih tinggi dari chip statis kecil');
ok(sDesign.performance >= 70, 'performa produk ≥ performa chip desain (70)');

// 8) Validasi launch: chip desain harus ada di katalog
const cfgMissing = Object.assign({}, base, { chipId: 'cd_chip_tidak_ada', batteryId: 'bat_liion' });
const v = prod.confirmTierFamily(cfgMissing, [{ tier: 'standard', name: 'X', productionQty: 1000 }]);
ok(v.ok === false && /belum tersedia/.test(v.reason), 'launch ditolak bila chip desain tidak ada di katalog');

// 9) Chip desain yang valid tidak ditolak oleh validasi chip (kegagalan lain boleh terjadi)
const cfgOk = Object.assign({}, base, { chipId: CID });
const v2 = prod.confirmTierFamily(cfgOk, [{ tier: 'standard', name: 'Y', productionQty: 1000 }]);
ok(!(v2.reason && /belum tersedia/.test(v2.reason)), 'chip desain yang valid tidak ditolak oleh validasi chip');

// 10) Produksi Fab selesai menambah stok per desain (sumber stok pabrik SoC)
const { FabSystem } = await load(root, 'systems/FabSystem.js');
const fs = new FabSystem(state);
fs._onHydrated();
d.fab.stockByChip = {};
d.fab.inventory = 0;
d.fab.producing = { chipId: DESIGN_ID, chipName: 'Test SoC', qty: 500, totalUnits: 500, progressUnits: 0,
    startedAtMinute: d.time.elapsedGameMinutes, lastProcessedMinute: d.time.elapsedGameMinutes,
    durationDays: 30, yieldRate: 1, costPaid: 0 };
d.time.elapsedGameMinutes += MIN_PER_DAY * 31;
fs._tickProduction();
ok(d.fab.stockByChip[DESIGN_ID] === 500 && d.fab.inventory === 500, 'produksi fab selesai menambah stok per desain (500)');
ok(d.fab.producing === null, 'produksi fab selesai dan slot fab kosong');

console.log(fail === 0 ? '\nSemua tes chip desain -> pabrik SoC lulus.' : '\n' + fail + ' GAGAL');
process.exit(fail ? 1 : 0);
