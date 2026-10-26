// Uji proyeksi live count: nilai harus kontinu di batas hari dan = state saat frac 0.
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2];
stubBrowser(); seedRandom(7);
const { state } = await load(root, 'core/GameState.js');
const { projectedStock, projectedOsAdoption, easeTowards, dayFraction } = await load(root, 'systems/LiveProjection.js');
const { computeOsAdoption } = await load(root, 'systems/OsAdoptionModel.js');
state.reset('normal');
const d = state.data;
const p = { id: 'x', name: 'X', status: 'selling', stock: 5000, price: 100, totalSold: 0, config: { osOptionId: 'own:v1' },
  dailySales: [{ sold: 900 }, { sold: 1000 }, { sold: 1100 }] };
d.products.catalog = [p];
d.os.versions = d.os.versions && d.os.versions.length ? d.os.versions : [{ id: 'v1', versionString: 'v1.0', releasedAt: { year: d.time.currentYear } }];
d.os.name = d.os.name || 'f-OS'; d.os.currentVersionId = 'v1';
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m); let fails = 0;
const chk = (c, m) => { if (!c) fails++; ok(c, m); };
d.time.currentHour = 0; d.time.currentMinute = 0;
chk(projectedStock(p, d.time) === 5000, 'frac 0 -> stok = state');
d.time.currentHour = 12; d.time.currentMinute = 0;
chk(Math.abs(projectedStock(p, d.time) - (5000 - 1000 * 0.5)) < 1e-6, 'tengah hari -> turun setengah laju');
d.time.currentHour = 23; d.time.currentMinute = 59.99;
const before = projectedStock(p, d.time);
// simulasi batas hari: ProductSystem menjual `sold` lalu jam kembali 00:00
const sold = 1000; p.stock -= sold; p.totalSold += sold; p.dailySales.push({ sold });
d.time.currentHour = 0; d.time.currentMinute = 0;
const after = projectedStock(p, d.time);
chk(Math.abs(before - after) < 2, 'kontinu di batas hari (' + before.toFixed(1) + ' -> ' + after.toFixed(1) + ')');
chk(after === p.stock, 'frac 0 setelah tick = state');
// OS users: frac 0 = nilai model asli; tengah hari >= frac 0 (naik)
const base = computeOsAdoption(d).activeUsers;
chk(projectedOsAdoption(d).activeUsers === base, 'OS users frac 0 = computeOsAdoption');
d.time.currentHour = 12;
chk(projectedOsAdoption(d).activeUsers >= base, 'OS users naik sepanjang hari');
// easing
let v = 0, prev = -1, mono = true;
for (let i = 0; i < 200; i++) { const nv = easeTowards(v, 1000, 16); if (nv < prev) mono = false; prev = nv; v = nv; }
chk(mono && v === 1000, 'tween monoton & konvergen ke target');
chk(easeTowards(100, 1000, 16) === 1000, 'lompatan besar di-snap');
console.log(fails ? fails + ' GAGAL' : 'SEMUA LULUS');
process.exit(fails ? 1 : 0);
