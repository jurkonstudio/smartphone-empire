// FILE: tools/registry-test.mjs  (DIPERBARUI: putaran per tahun + sponsor kompetitor)
// Jalankan: node tools/registry-test.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src') + '/';
const D = await import(R + 'data/registry.data.js');
const S = await import(R + 'systems/RegistrySystem.js');
const C = D.REGISTRY_CONFIG;
let fail = 0;
function ok(c, m) { console.log((c ? 'OK    ' : 'GAGAL ') + m); if (!c) fail++; }
function mk(year, cash) {
    return { time: { currentYear: year, currentMonth: 1, currentDay: 1 }, cash, market: { reputation: 50 },
        competitorState: { entities: { samsung: { currentShare: 0.20 }, apple: { currentShare: 0.15 }, huawei: { currentShare: 0.09 } }, withdrawn: {} } };
}
const stOf = (data) => ({ data, addCash(n) { this.data.cash += n; } });

// Putaran
ok(S.getActiveRound(2007) === null, 'sebelum 2008 belum ada putaran');
ok(S.getActiveRound(2010).year === 2008, '2010 = putaran 2008');
ok(S.getActiveRound(2015).year === 2012, '2015 = putaran 2012');
ok(S.getActiveRound(2026).year === 2026, '2026 = putaran 2026');
ok(S.getNextRoundYear(2015) === 2026, 'putaran berikutnya setelah 2015 = 2026');
ok(!S.isRegistryOpen(mk(2005, 0)) && S.isRegistryOpen(mk(2012, 0)), 'buka/tutup sesuai tahun');

// Sponsor = kompetitor aktif
const d = mk(2015, 900000), st = stOf(d);
ok(S.getCompetitorCandidates(d).some(c => c.id === 'samsung'), 'kandidat sponsor = kompetitor aktif');
d.competitorState.withdrawn = { apple: true };
ok(!S.getCompetitorCandidates(d).some(c => c.id === 'apple'), 'kompetitor yang menarik diri tidak bisa jadi sponsor');
d.competitorState.withdrawn = {};
ok(!S.getCompetitorCandidates(d).some(c => c.id === 'nokia'), 'kompetitor tidak aktif (Nokia 2015) tidak muncul');
S.pickExtension(st, 'tech');
S.toggleSponsor(st, 'samsung'); S.toggleSponsor(st, 'apple'); S.toggleSponsor(st, 'huawei');
ok(d.registry.draft.sponsorIds.length === 3, 'bisa memilih 3 sponsor');
ok(!S.toggleSponsor(st, 'oppo').ok, 'sponsor keempat ditolak (maks 3)');
ok(S.toggleSponsor(st, 'huawei').ok && d.registry.draft.sponsorIds.length === 2, 'toggle melepas sponsor');
S.toggleSponsor(st, 'huawei');
ok(!S.toggleSponsor(st, 'ghost').ok, 'id tidak dikenal ditolak');

// Peluang
ok(S.computeEvalChance(d, ['samsung']) > S.computeEvalChance(d, []), 'sponsor besar menaikkan peluang evaluasi');
ok(S.computeObjectChance(d, ['samsung', 'apple', 'huawei']) <= S.computeObjectChance(d, []), 'sponsor menurunkan kemungkinan keberatan pesaing besar');
ok(S.computeEvalChance(d, ['samsung', 'apple', 'huawei']) <= C.evalCap + 1e-9, 'peluang tidak melewati batas');

// Lamaran: biaya putaran + sponsor
const before = d.cash;
ok(S.submitRegistry(st).ok, 'lamaran diajukan');
ok(d.registry.app.fee === 185000 && d.registry.app.round === 2012, 'lamaran 2015 memakai biaya putaran 2012 ($185.000)');
ok(before - d.cash === 185000 + 3 * C.sponsorCost, 'kas terpotong biaya + 3 sponsor');
ok(d.registry.draft.sponsorIds.length === 0, 'draf sponsor dikosongkan setelah lamar');

const d2 = mk(2026, 900000), st2 = stOf(d2);
S.pickExtension(st2, 'web'); S.submitRegistry(st2);
ok(d2.registry.app.fee === 227000 && d2.registry.app.round === 2026, 'lamaran 2026 memakai biaya putaran 2026');

// Save lama aman
const old = { time: { currentYear: 2015 }, cash: 1, registry: { draft: { ext: 'web', sponsors: 2 } } };
const g = S.ensureRegistryState(old);
ok(Array.isArray(g.draft.sponsorIds) && g.draft.sponsorIds.length === 0 && g.draft.sponsors === undefined, 'save lama (sponsor berbentuk angka) aman');

// Panel: render HTML tanpa error
try {
    const P = await import(R + 'ui/panels/RegistryPanel.js');
    const html = P.renderRegistryBox(mk(2015, 900000));
    ok(html.includes('data-rg="tld-sponsor"') && html.includes('Samsung'), 'panel: tombol sponsor memakai data-rg="tld-sponsor"');
} catch (e) { ok(false, 'panel gagal dirender: ' + e.message); }

console.log(fail ? '\n' + fail + ' pengujian gagal' : '\nSemua pengujian lulus');
process.exit(fail ? 1 : 0);
