// Uji headless Assembly: bangun, rekrut, gaji harian berindeks tahun, biaya restock.
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || 'src';
stubBrowser(); seedRandom(3);
const { state } = await load(root, 'core/GameState.js');
const { AssemblySystem } = await load(root, 'systems/AssemblySystem.js');
const { getAssemblyWageIndex } = await load(root, 'data/assembly.data.js');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok:', m); };
state.reset('normal');
const t = state.data.time; t.currentYear = 2002;
state.data.finance = state.data.finance || {}; 
const asm = new AssemblySystem(state);
ok(Math.abs(getAssemblyWageIndex(2002) - 0.35) < 1e-9, 'indeks gaji 2002 = 0.35');
ok(getAssemblyWageIndex(2026) > 1.0 && getAssemblyWageIndex(2026) < 1.3, 'indeks gaji 2026 ~1.1');
ok(asm.getCostFactor() === 1, 'sebelum dibangun faktor biaya = 1');
state.data.cash = 50000000;
const r = asm.build();
ok(r.ok, 'bangun Lv1 berhasil (' + (r.reason || '') + ')');
// selesaikan konstruksi: majukan hari sampai selesai
const a = state.data.assembly;
for (let i = 0; i < 400 && !asm.isBuilt(); i++) { t.elapsedGameMinutes = (t.elapsedGameMinutes || 0) + 1440; asm._tickDaily(); }
ok(asm.isBuilt(), 'Lv1 selesai dibangun (level ' + a.level + ')');
ok(asm.isOperating(), 'beroperasi tahun ' + t.currentYear);
const h = asm.hire('operator', 10);
const fee = h.fee;
ok(h.ok && fee === Math.round(700 * getAssemblyWageIndex(t.currentYear)) * 10, 'biaya rekrut = 10 x gaji berindeks (' + fee + ')');
const w0 = a.workers.operator;
t.elapsedGameMinutes += 15 * 1440; asm._tickDaily();
ok(a.workers.operator === w0 + 10, 'pekerja selesai pelatihan');
const snap2 = asm.getSnapshot();
ok(snap2.upkeep === Math.round(50000 * getAssemblyWageIndex(t.currentYear)), 'perawatan berindeks (' + snap2.upkeep + ')');
const cash0 = state.data.cash; t.elapsedGameMinutes += 1440; asm._tickDaily();
ok(state.data.cash < cash0, 'gaji+perawatan harian terpotong');
ok(asm.getCostFactor() < 1.03 && asm.getCostFactor() > 0.9, 'faktor biaya wajar: ' + asm.getCostFactor().toFixed(3));
console.log(fail ? 'ADA YANG GAGAL' : 'ASSEMBLY LULUS');
process.exit(fail ? 1 : 0);
