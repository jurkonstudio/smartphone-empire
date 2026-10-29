import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2];
stubBrowser(); seedRandom(7);
const { state } = await load(root, 'core/GameState.js');
const { MarketNavSystem, NAV_CAL } = await load(root, 'systems/MarketNavSystem.js');
const { getMacro } = await load(root, 'core/MacroModel.js');
const { BALANCE } = await load(root, 'data/balance.data.js');
state.reset('normal');
const nav = new MarketNavSystem(state);
nav._ensure();
// Grid produk "wajar": stat seragam s, harga = harga ekspektasi kualitas.
const rows = [];
let accSeg = 0, accReg = 0, n = 0;
for (let y = 2000; y <= 2026; y++) for (const m of [3, 9]) {
  state.data.time.currentYear = y; state.data.time.currentMonth = m; state.data.time.currentDay = 15;
  nav._ctxKey = null;
  const ctx = nav._context();
  for (const s of [35, 45, 55, 65, 75, 85]) {
    const stats = { display: s, camera: s, battery: s, performance: s, connectivity: s, design: s, usability: s, quality: s, qualityScore: s };
    const price = ctx.priceRef * Math.pow(s / 50, 1.3);
    const vec = nav._vec(stats, null);
    const ap = nav._appeals(vec, price, ctx);
    let sr = 0, rr = 0;
    for (const sg of (await load(root,'data/market-nav.data.js')).SEGMENTS) sr += ctx.segW[sg.id] * ap.seg[sg.id];
    for (const sb of (await load(root,'data/market-nav.data.js')).SUBREGIONS) rr += ctx.subW[sb.id] * ap.reg[sb.id];
    accSeg += sr; accReg += rr; n++;
    rows.push({ y, s, sr, rr });
  }
}
console.log('mean segRaw', (accSeg / n).toFixed(3), 'mean regRaw', (accReg / n).toFixed(3));
const byS = {};
rows.forEach(r => { (byS[r.s] = byS[r.s] || []).push(r); });
for (const s in byS) console.log('stat', s, 'seg', (byS[s].reduce((a, r) => a + r.sr, 0) / byS[s].length).toFixed(3), 'reg', (byS[s].reduce((a, r) => a + r.rr, 0) / byS[s].length).toFixed(3));
