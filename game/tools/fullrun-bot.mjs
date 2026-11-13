// Tes simulasi penuh: bot pemain sederhana memainkan 2000-2026 dengan sistem asli; gagal bila ada NaN/Infinity,
// exception, bangkrut, atau tahun akhir tidak tercapai. Pakai: node tools/fullrun-bot.mjs src [seed] [kesulitan]
// Env: FLOOR (kas minimum), END (tahun akhir), PMULT (pengali harga). Bot pemain "wajar": rilis ponsel tiap ~6 bulan dengan komponen yang tersedia, riset rekomendasi, rekrut staf.
import { state, S, out, logs } from './fullrun.mjs';
const { COMPONENTS } = await import(new URL('../src/data/components.data.js', import.meta.url));
const { getMacro } = await import(new URL('../src/core/MacroModel.js', import.meta.url));
const { BALANCE } = await import(new URL('../src/data/balance.data.js', import.meta.url));
const d = state.data;
d.os = d.os || {}; d.os.versions = [{ id: 'v1', features: [], releasedAt: { year: 2000, month: 1 }, stats: { stability: 60, speed: 60, features: 60, security: 60, design: 60 } }]; d.os.currentVersionId = 'v1'; d.os.bugs = [];
const FLOOR = Number(process.env.FLOOR || 0), END = Number(process.env.END || 2026), QMULT = Number(process.env.QMULT || 1), PMULT = Number(process.env.PMULT || 1);
function best(cat) { const y = d.time.currentYear; const l = COMPONENTS.filter(c => c.category === cat && (c.minYear == null || y >= c.minYear) && (!c.requiresResearch || d.research.completed.includes(c.requiresResearch))); return l.length ? l[l.length - 1].id : null; }
function cfgNow(name) { const y = d.time.currentYear; const macro = getMacro(d.time, BALANCE.macro); return { name, formFactorId: best('form_factor'), displayId: best('display'), cameraId: best('camera'), batteryId: best('battery'), chipId: best('chip'), networkId: best('network'), bodyId: best('body'), bodyColorId: 'color_black', ramId: best('ram'), osOptionId: 'own:v1', price: Math.round(macro.priceRef * PMULT), productionQty: 3000 }; }
const issues = new Map(); const note = (k, m) => { if (!issues.has(k)) issues.set(k, { n: 0, first: m }); issues.get(k).n++; };
function walk(o, path, bad, dep) { if (dep > 7 || o == null) return; if (typeof o === 'number') { if (!Number.isFinite(o)) bad.push(path); return; } if (typeof o !== 'object') return; const ks = Object.keys(o); for (let i = 0; i < ks.length && i < 400; i++) walk(o[ks[i]], path + '.' + ks[i], bad, dep + 1); }
const rows = []; let relFail = {};
for (let y = 2000; y <= END; y++) for (let m = 1; m <= 12; m++) {
  if (FLOOR) d.cash = Math.max(d.cash, FLOOR);
  const P = S.ProductSystem;
  try {
    // rekrut staf bila belum penuh (uji)
    if (m === 1 && S.TeamSystem && S.TeamSystem.fillStaff && y % 3 === 0) { try { S.TeamSystem.fillStaff('engineer', 1, 50); } catch (e) {} }
    // riset
    if (S.ResearchSystem) { try { for (let k = 0; k < 2; k++) { const rec = S.ResearchSystem.getRecommended(); if (!rec) break; const rr = S.ResearchSystem.startResearch(rec.node.id); if (!rr || !rr.ok) break; } } catch (e) { note('research-throw', e.message); } }
    if ((m === 1 || m === 7) && !d.products.development) { const c = cfgNow('P' + y + m); c.productionQty = Math.max(500, Math.min(20000, Math.floor(d.cash / Math.max(1, P.computeUnitCost(c)) * 0.25))); c.price = Math.max(2, Math.round(P.computeUnitCost(c) * 2.2 * PMULT)); let r = P.confirmDesign(c); for (let t = 0; t < 4 && !r.ok; t++) { const mx = /Max \$(\d+)/.exec(r.reason || ''), mn = /Min \$(\d+)/.exec(r.reason || ''); if (mx) c.price = Math.max(1, Math.floor(Number(mx[1]) * 0.92)); else if (mn) c.price = Math.ceil(Number(mn[1]) * 1.15); else break; r = P.confirmDesign(c); } if (!r.ok) { relFail[r.reason] = (relFail[r.reason] || 0) + 1; } }
    // restock produk yang sedang dijual (pemain nyata melakukannya / auto-restock)
    (d.products.catalog || []).filter(p => p.status === 'selling' && (p.stock || 0) < 1500).slice(-3).forEach(p => { try { const q = Math.max(500, Math.min(15000, Math.floor(d.cash / Math.max(1, P.computeUnitCost(p.config || p)) * 0.12))); P.orderProduction(p.id, q); } catch (e) { note('restock-throw', e.message); } });
    S.TimeSystem.fastForwardDays(30);
  } catch (e) { note('tick-throw', (e.stack || e.message).split('\n').slice(0, 3).join(' | ')); }
  const bad = []; walk(d, 'data', bad, 0); bad.forEach(b => note('NaN:' + b.replace(/\.\d+/g, '.#'), b));
  const prods = (d.products.catalog || []).length;
  rows.push({ y: d.time.currentYear, m: d.time.currentMonth, cash: d.cash, rev: ((d.market.revenueHistory || [])[0] || {}).playerRevenue || 0, net: ((d.finance || {}).lastNet), prods });
  if (d.gameOver) { out('GAME OVER', d.time.currentYear, d.time.currentMonth, JSON.stringify(d.gameOver)); y = 99999; break; }
}
out('akhir', d.time.currentYear + '-' + d.time.currentMonth, 'kas', Math.round(d.cash));
rows.filter(r => r.m === 12).forEach(r => out(r.y, 'kas', Math.round(r.cash / 1e3) + 'k', 'rev/bln', Math.round(r.rev / 1e3) + 'k'));
out('gagal rilis:', JSON.stringify(relFail).slice(0, 600));
out('--- isu:'); for (const [k, v] of issues) out(v.n + 'x', k, '::', String(v.first).slice(0, 200));
const cnt = {}; logs.filter(l => l[0] !== 'log').forEach(l => { const k = l[1].slice(0, 120); cnt[k] = (cnt[k] || 0) + 1; });
out('--- warn/err:'); Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, n]) => out(n + 'x', k));
const gagal = issues.size > 0 || !!d.gameOver || !Number.isFinite(d.cash) || d.time.currentYear < END;
out(gagal ? 'GAGAL: simulasi penuh tidak bersih (lihat isu di atas)' : 'LULUS: 2000-' + END + ' tanpa NaN, error, atau bangkrut');
if (!process.env.NOEXIT) process.exit(gagal ? 1 : 0);
