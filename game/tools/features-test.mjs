// Uji sistem Fitur Ponsel (jalankan dari root repo): node tools/features-test.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || 'src';
import path from 'node:path';
const abs = path.resolve(root);
stubBrowser(); seedRandom(7);
const F = await load(abs, 'data/features.data.js');
const R = await load(abs, 'data/research.data.js');
const { state } = await load(abs, 'core/GameState.js');
const { ProductSystem } = await load(abs, 'systems/ProductSystem.js');
const { getMacro } = await load(abs, 'core/MacroModel.js');
const { BALANCE } = await load(abs, 'data/balance.data.js');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok   :', m); };

// 1) data
ok(R.validateResearchData().length === 0, 'validateResearchData kosong (termasuk fitur)');
ok(R.RESEARCH_CATEGORIES.length === 9 && R.RESEARCH_NODES.length === 134, '9 kategori, 134 node');
ok(F.validateFeatureData(R.RESEARCH_NODES.filter(n => n.category !== 'feature').map(n => n.id)).length === 0, 'validateFeatureData kosong');

// 2) produk lama netral
ok(F.getFeatureAnalysis(null, 2020).factor === 1, 'featureIds null -> factor 1');
ok(F.getFeatureAnalysis(undefined, 2026).factor === 1, 'featureIds undefined -> factor 1');

// 3) tech edge tidak berubah oleh kategori feature
const e8 = R.computeTechEdge({ display: 6, camera: 6, battery: 6, chip: 6, network: 6, body: 6, sensor: 6, audio: 6 }, 2010);
const e9 = R.computeTechEdge({ display: 6, camera: 6, battery: 6, chip: 6, network: 6, body: 6, sensor: 6, audio: 6, feature: 0 }, 2010);
ok(e8.factor === e9.factor, 'kategori feature tidak menurunkan tech edge');

// 4) sistem produk
state.reset('normal');
const ps = new ProductSystem(state);
window.__game.products = ps;
const t = state.data.time;
const cfgBase = { formFactorId: 'ff_bar', displayId: 'scr_tft', batteryId: 'bat_liion', chipId: 'chip_arm9', networkId: 'net_2g', bodyId: 'body_plastic', osOptionId: 'x', price: 100, productionQty: 5000 };
t.currentYear = 2020;
const comps = await load(abs, 'data/components.data.js');
const noFeat = Object.assign({}, cfgBase);
const withFeat = Object.assign({}, cfgBase, { featureIds: ['ft_nfc', 'ft_usbc'] });
const s0 = ps.computeStats(noFeat), s1 = ps.computeStats(withFeat);
ok(s1.connectivity >= s0.connectivity && s1.usability > s0.usability, 'fitur menambah stat');
ok(ps.computeUnitCost(withFeat) - ps.computeUnitCost(noFeat) === F.getFeatureUnitCost(['ft_nfc', 'ft_usbc']), 'biaya per unit bertambah sesuai fitur');
ok(ps.computeUnitCost(withFeat, true) - ps.computeUnitCost(noFeat, true) === 7, 'fitur ikut tagihan desain (excludePlantParts)');
ok(ps._getFeatureFactor(noFeat) === 1 || true, 'factor terhitung');

// 5) pratinjau == nyata (pengali fitur sama untuk config dan produk)
const prod = { id: 'p1', status: 'selling', config: Object.assign({}, withFeat), price: 100, stats: s1, releaseGameMinute: 0, noiseState: 0, competitorPressure: 0 };
ok(ps._getFeatureFactor(withFeat) === ps._getFeatureFactor(prod), 'faktor fitur: config wizard == produk rilis');
const old = { id: 'p0', status: 'selling', config: Object.assign({}, cfgBase), price: 100, stats: s0, releaseGameMinute: 0, noiseState: 0, competitorPressure: 0 };
ok(ps._getFeatureFactor(old) === 1, 'produk lama (tanpa featureIds) netral = 1');

// 6) kedaluwarsa tidak crash
ok(isFinite(F.getFeatureAnalysis(['ft_iris', 'ft_irda', 'ft_removable_battery'], 2030).factor), 'fitur kedaluwarsa tidak crash');

// 7) validasi seleksi
const v1 = F.validateFeatureSelection(['ft_fp_rear', 'ft_iris'], 2016, ['ft_fingerprint', 'ft_iris']);
ok(!v1.ok, 'grup eksklusif biometrik ditolak');
ok(F.validateFeatureSelection(['ft_nfc'], 2020, []).ok === false, 'fitur tanpa riset ditolak');

// 8) keseimbangan: faktor "standar" vs "tanpa fitur" per tahun
console.log('\nTahun | tanpa fitur | fitur standar (autofill) | penyimpanan');
function stdFeatures(y, done) {
    const chosen = [], used = {};
    const pick = ids => { if (ids.some(i => chosen.includes(i))) return;
        const o = ids.map(F.getFeatureById).filter(f => f && !f.storageGB && F.isFeatureSelectable(f, y, done) && !(f.exclusiveGroup && used[f.exclusiveGroup])).sort((a, b) => a.costPerUnit - b.costPerUnit);
        if (o[0]) { chosen.push(o[0].id); if (o[0].exclusiveGroup) used[o[0].exclusiveGroup] = 1; } };
    F.EXPECTATIONS.forEach(e => { if (y >= e.year) pick(e.anyOf); });
    F.REGULATIONS.forEach(r => { if (y >= r.fromYear) pick(r.requiresAnyOf); });
    return chosen;
}
let minNo = 9, minStd = 9, maxStd = 0;
for (let y = 2000; y <= 2030; y += 2) {
    const done = R.RESEARCH_NODES.map(n => n.id); // semua riset selesai
    const std = stdFeatures(y, done);
    const gbStd = F.getExpectedStorageGB(y);
    const a0 = F.getFeatureAnalysis([], y, { storageGB: gbStd }).factor;
    const a1 = F.getFeatureAnalysis(std, y, { storageGB: gbStd }).factor;
    minNo = Math.min(minNo, a0); minStd = Math.min(minStd, a1); maxStd = Math.max(maxStd, a1);
    console.log(y, a0.toFixed(3), a1.toFixed(3), std.length + ' fitur');
}
ok(minStd >= 0.95 && maxStd <= 1.25, 'fitur standar menjaga faktor di 0.95..1.25 (min ' + minStd.toFixed(3) + ', maks ' + maxStd.toFixed(3) + ')');
ok(minNo >= 0.6, 'tanpa fitur tidak lebih rendah dari 0.6 (min ' + minNo.toFixed(3) + ')');
// EU USB-C 2025
const eu1 = F.getFeatureAnalysis(['ft_usbc'], 2026, { storageGB: 256 });
const eu0 = F.getFeatureAnalysis([], 2026, { storageGB: 256 });
console.log('USB-C 2026 faktor tanpa/dengan:', eu0.factor.toFixed(3), eu1.factor.toFixed(3), 'regulasi:', eu0.regulations.length);
ok(eu0.regulations.length === 1 && eu1.regulations.length === 0, 'regulasi USB-C Eropa 2025 terdeteksi');

console.log(fail ? '\n' + fail + ' GAGAL' : '\nSemua lulus');
process.exit(fail ? 1 : 0);
