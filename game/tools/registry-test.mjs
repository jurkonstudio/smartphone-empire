// tools/registry-test.mjs — Registry (tahap 2): pembukaan, lamaran, evaluasi, keberatan, kontensi/lelang, kontrak, uji teknis,
// sunrise/landrush/umum, batas 36 bulan, peluang akhir (simulasi), kamus i18n, render. Murni logika, tanpa DOM/cloud.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src') + '/';
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL: ' + m); } };

const D = await import(R + 'data/registry.data.js');
const S = await import(R + 'systems/RegistrySystem.js');
const { bus } = await import(R + 'core/EventBus.js');
const { DICTIONARIES } = await import(R + 'data/i18n/index.js');
const C = D.REGISTRY_CONFIG;

const mk = (over = {}) => {
    const data = Object.assign({
        time: { currentYear: 2013, currentMonth: 1, currentDay: 1 }, cash: 2000000,
        research: { completed: ['net_3g'] }, market: { reputation: 60, revenueHistory: [] }
    }, over);
    return { data, rep: 0, addCash(x) { data.cash += x; }, addLog() {}, addReputation(x) { this.rep += x; }, addSentiment() {} };
};
const month = (st, n = 1) => { for (let i = 0; i < n; i++) { const t = st.data.time; t.currentMonth++; if (t.currentMonth > 12) { t.currentMonth = 1; t.currentYear++; } bus.emit('time:month-changed', {}); } };
const days = (st, n) => { st.data.time.currentDay += n; bus.emit('time:day-changed', {}); };
// Random terkontrol: antrean nilai, lalu 0.5.
const realRandom = Math.random;
const feed = (...v) => { Math.random = () => (v.length ? v.shift() : 0.5); };
const sys = (st) => new S.RegistrySystem(st);

// ---------- Pembukaan & syarat ----------
{
    const st = mk({ time: { currentYear: 2011, currentMonth: 1, currentDay: 1 } });
    S.ensureRegistryState(st.data);
    ok(S.isRegistryOpen(st.data) === false, 'terkunci sebelum 2012');
    ok(S.canStartRegistry(st.data).reason === 'locked', 'alasan locked');
    st.data.time.currentYear = 2012;
    ok(S.canStartRegistry(st.data).reason === 'pick', 'harus pilih ekstensi');
    S.pickExtension(st, 'tech');
    ok(S.canStartRegistry(st.data).ok === true, 'bisa melamar');
    st.data.cash = 100000;
    ok(S.canStartRegistry(st.data).reason === 'cash', 'kas kurang');
    ok(S.pickExtension(st, 'xxx').ok === false, 'ekstensi tak dikenal ditolak');
    ok(S.setSponsors(st, 99).ok && st.data.registry.draft.sponsors === C.sponsorMax, 'sponsor dibatasi');
}

// ---------- Peluang (rumus) ----------
{
    const st = mk({ cash: 100000 });
    ok(Math.abs(S.computeEvalChance(st.data, 0) - 0.70) < 1e-9, 'evaluasi dasar 70%');
    ok(Math.abs(S.computeEvalChance(st.data, 2) - 0.80) < 1e-9, '2 sponsor = 80%');
    ok(Math.abs(S.computeEvalChance(st.data, 9) - 0.85) < 1e-9, 'sponsor dibatasi 85%');
    st.data.cash = C.evalCashMult * C.applicationFee;
    ok(Math.abs(S.computeEvalChance(st.data, 0) - 0.75) < 1e-9, 'kas 3x biaya +5');
    ok(Math.abs(S.computeObjectChance(0) - 0.15) < 1e-9 && Math.abs(S.computeObjectChance(2) - 0.05) < 1e-9, 'keberatan 15% dikurangi 5 per sponsor');
    ok(S.computeObjectChance(9) === 0, 'keberatan tidak negatif');
    const o = S.getRegistryOutlook(st.data, 'brand', 3);
    ok(['high', 'medium', 'low'].includes(o.level) && !('p' in o), 'outlook hanya tingkat + alasan');
}

// ---------- Alur normal: niche, tanpa keberatan/kontensi ----------
{
    const st = mk(); const g = sys(st); S.pickExtension(st, 'tech'); S.setSponsors(st, 1);
    const c0 = st.data.cash;
    feed(0.99);                        // tidak perlu melengkapi
    ok(S.submitRegistry(st).ok, 'lamaran terkirim');
    ok(st.data.cash === c0 - C.applicationFee - C.sponsorCost, 'biaya lamaran + sponsor dipotong');
    ok(S.submitRegistry(st).reason === 'busy', 'satu lamaran sekali');
    feed(0.1, 0.99, 0.99);            // lulus evaluasi, tanpa keberatan, tanpa kontensi
    month(st, C.evalMonths);
    ok(st.data.registry.app.phase === 'offer', 'tawaran kontrak muncul setelah evaluasi');
    ok(st.data.registrar.letters.some(l => l.code === 'tld_offer' && l.act === 'tld_offer'), 'surat tawaran ke Pesan');
    const c1 = st.data.cash;
    ok(S.signRegistry(st).ok && st.data.cash === c1 - C.annualFee, 'tanda tangan bayar biaya tahunan');
    feed(0.99); month(st, C.techMonths);
    ok(st.data.registry.app === null && st.data.registry.live[0].phase === 'sunrise', 'lulus uji teknis -> sunrise');
    month(st, C.sunriseMonths); ok(st.data.registry.live[0].phase === 'landrush', 'lalu landrush');
    month(st, C.landrushMonths); ok(st.data.registry.live[0].phase === 'general', 'lalu terbuka umum');
    const d1 = st.data.registry.live[0].domains; month(st, 6);
    ok(st.data.registry.live[0].domains > d1, 'domain tumbuh di fase umum');
    ok(st.data.registry.last.revenue > 0 && st.data.registry.earned !== 0, 'ada pendapatan bulanan');
    ok(st.data.registry.live[0].domains <= C.types.niche.cap * C.economyScale + 1e-6, 'domain tidak melewati batas');
    g.destroy();
}

// ---------- Evaluasi gagal, keberatan, melengkapi ----------
{
    const st = mk({ cash: 300000 }); const g = sys(st); S.pickExtension(st, 'tech');
    feed(0.99); S.submitRegistry(st);
    feed(0.9); month(st, C.evalMonths);   // 0.9 >= 0.70 -> gagal
    ok(st.data.registry.app === null && st.data.registry.cooldownUntil > 0, 'evaluasi gagal -> ditolak, ada jeda ulang');
    ok(S.canStartRegistry(st.data).reason === 'cooldown', 'tidak bisa melamar saat jeda');
    g.destroy();
}
{
    const st = mk(); const g = sys(st); S.pickExtension(st, 'tech');
    feed(0.01); S.submitRegistry(st);      // diminta melengkapi
    ok(st.data.registry.app.monthsLeft === C.evalMonths + C.reviseMonths, 'melengkapi menambah 3 bulan');
    feed(0.1, 0.01); month(st, C.evalMonths + C.reviseMonths);   // lulus, keberatan terjadi
    ok(st.data.registry.app.phase === 'objection', 'keberatan menunda');
    feed(0.9); month(st, C.objectMonths);
    ok(st.data.registry.app === null, 'keberatan menang 60% -> ditolak');
    g.destroy();
}
{
    const st = mk(); const g = sys(st); S.pickExtension(st, 'tech');
    feed(0.99); S.submitRegistry(st);
    feed(0.1, 0.01); month(st, C.evalMonths);
    feed(0.1, 0.99); month(st, C.objectMonths);          // pemain menang keberatan, tanpa kontensi
    ok(st.data.registry.app.phase === 'offer', 'menang keberatan -> kontrak');
    g.destroy();
}

// ---------- Kontensi & lelang ----------
function toContest() {
    const st = mk({ cash: 5000000 }); const g = sys(st); S.pickExtension(st, 'web');
    feed(0.99); S.submitRegistry(st);
    feed(0.1, 0.99, 0.01, 0.5);          // lulus, tanpa keberatan, kontensi ya, tawaran NPC di tengah
    month(st, C.evalMonths);
    return { st, g };
}
{
    const { st, g } = toContest();
    ok(st.data.registry.app.phase === 'contest', 'nama populer bisa diperebutkan');
    const npc = st.data.registry.app.npcBid;
    ok(npc >= C.npcBidMin && npc <= C.npcBidMax, 'tawaran NPC dalam rentang');
    ok(S.auctionBid(st, 1234).reason === 'unknown', 'tawaran harus salah satu pilihan');
    const before = st.data.cash;
    const r = S.auctionBid(st, 3000000);
    ok(r.ok && r.won === true && st.data.cash === before - npc, 'menang lelang bayar harga NPC (bukan tawaran)');
    ok(st.data.registry.app.phase === 'auction' && st.data.registry.app.monthsLeft >= 1, 'lelang butuh waktu');
    month(st, 12); ok(st.data.registry.app.phase === 'offer', 'setelah lelang -> kontrak');
    g.destroy();
}
{
    const { st, g } = toContest(); st.data.registry.app.npcBid = 2000000;
    const r = S.auctionBid(st, 500000);
    ok(r.ok && r.won === false && st.data.registry.app === null, 'kalah lelang -> lamaran gugur');
    g.destroy();
}
{
    const { st, g } = toContest(); const c0 = st.data.cash;
    const r = S.withdrawRegistry(st);
    ok(r.ok && st.data.cash === c0 + Math.round(C.applicationFee * 0.7), 'mundur mengembalikan 70% biaya lamaran');
    g.destroy();
}
{
    const { st, g } = toContest(); const c0 = st.data.cash;
    days(st, 31);
    ok(st.data.registry.app === null && st.data.cash > c0, 'tidak memutuskan tepat waktu = mundur dengan refund');
    g.destroy();
}
{
    const st = mk(); const g = sys(st); S.pickExtension(st, 'brand');
    let n = 0; for (let i = 0; i < 200; i++) { const s2 = mk(); s2.data.registry = null; const g2 = sys(s2); S.pickExtension(s2, 'brand'); feed(0.99); S.submitRegistry(s2); feed(0.1, 0.99); month(s2, C.evalMonths); if (s2.data.registry.app && s2.data.registry.app.phase === 'contest') n++; g2.destroy(); }
    ok(n === 0, 'merek tidak pernah berkontensi');
    g.destroy();
}

// ---------- Kedaluwarsa tawaran & uji teknis ----------
{
    const st = mk(); const g = sys(st); S.pickExtension(st, 'tech');
    feed(0.99); S.submitRegistry(st); feed(0.1, 0.99, 0.99); month(st, C.evalMonths);
    days(st, 31);
    ok(st.data.registry.app === null && st.data.registrar.letters.some(l => l.code === 'tld_offer_expired'), 'tawaran kedaluwarsa tanpa refund');
    g.destroy();
}
{
    const st = mk(); const g = sys(st); S.pickExtension(st, 'tech');
    feed(0.99); S.submitRegistry(st); feed(0.1, 0.99, 0.99); month(st, C.evalMonths); S.signRegistry(st);
    feed(0.01); month(st, C.techMonths);
    ok(st.data.registry.app && st.data.registry.app.monthsLeft === C.techRetryMonths, 'uji teknis gagal -> ulang 2 bulan');
    feed(0.01); month(st, C.techRetryMonths);
    ok(st.data.registry.live.length === 1, 'ulang uji hanya sekali, lalu lulus');
    g.destroy();
}

// ---------- Batas 36 bulan ----------
{
    const st = mk(); const g = sys(st); S.pickExtension(st, 'web');
    feed(0.01); S.submitRegistry(st);
    st.data.registry.app.pre = C.maxMonths - 1; st.data.registry.app.monthsLeft = 1;
    feed(0.1, 0.01); month(st, 1);
    ok(st.data.registry.app.pre <= C.maxMonths, 'durasi pra-kontrak tidak melewati 36 bulan');
    g.destroy();
}

// ---------- Peluang akhir (simulasi: kas tipis tanpa bonus, lelang dijawab tawaran $2 juta = menang sekitar 60%) ----------
function sim(ext, sponsors, n) {
    let launched = 0;
    Math.random = realRandom;
    for (let i = 0; i < n; i++) {
        const st = mk({ cash: 400000 }); const g = sys(st); S.pickExtension(st, ext); S.setSponsors(st, sponsors);
        S.submitRegistry(st);
        for (let m = 0; m < 80 && st.data.registry.app; m++) {
            const a = st.data.registry.app;
            if (a.phase === 'contest') { st.data.cash = 5000000; S.auctionBid(st, 2000000); st.data.cash = 400000; }
            else if (a.phase === 'offer') S.signRegistry(st);
            else month(st, 1);
        }
        if (st.data.registry.live.length) launched++;
        g.destroy();
    }
    return launched / n;
}
{
    const a = sim('tech', 0, 3000), b = sim('tech', 2, 3000);
    console.log('simulasi: niche 0 sponsor = ' + (a * 100).toFixed(0) + '%, niche 2 sponsor = ' + (b * 100).toFixed(0) + '% (rancangan awal: ~60% dan ~74%)');
    ok(a > 0.54 && a < 0.67, 'peluang niche 0 sponsor sekitar 60%');
    ok(b > 0.68 && b < 0.80, 'peluang niche 2 sponsor sekitar 74%');
}
Math.random = realRandom;

// ---------- Save lama & i18n ----------
{
    const data = { time: { currentYear: 2013, currentMonth: 1 }, cash: 1 };
    const g = S.ensureRegistryState(data);
    ok(g.app === null && Array.isArray(g.live) && g.draft.sponsors === 0, 'save lama aman (nilai bawaan)');
    data.registry = { live: 'x', app: 5, draft: { ext: 'zzz', sponsors: -3 } };
    const g2 = S.ensureRegistryState(data);
    ok(g2.app === null && Array.isArray(g2.live) && g2.draft.ext === null && g2.draft.sponsors === 0, 'save rusak dibersihkan');
}
{
    const en = DICTIONARIES.en, id = DICTIONARIES.id, fs = await import('node:fs');
    const keys = Object.keys(en).filter(k => k.startsWith('registry.') || /^registrar\.letter\.tld_/.test(k));
    ok(keys.length > 40, 'kunci registry ada di en');
    keys.forEach(k => { ok(k in id, 'terjemahan id ada untuk ' + k); ok(en[k].length <= 150, 'teks terlalu panjang: ' + k); });
    Object.keys(id).filter(k => k.startsWith('registry.')).forEach(k => ok(k in en, 'sumber en ada untuk ' + k));
    const used = new Set();
    ['systems/RegistrySystem.js', 'ui/panels/RegistryPanel.js', 'ui/panels/InboxPanel.js'].forEach(f => {
        const src = fs.readFileSync(R + f, 'utf8');
        for (const m of src.matchAll(/'(registry\.[a-z_.]+)'/g)) if (!m[1].endsWith('.')) used.add(m[1]);
        for (const m of src.matchAll(/'(tld_[a-z_]+)'/g)) { if (m[1] === 'tld_contest') continue; ok(('registrar.letter.' + m[1] + '.title') in en && ('registrar.letter.' + m[1] + '.body') in en, 'surat tanpa teks: ' + m[1]); }
    });
    used.forEach(k => ok(k in en, 'key dipakai tapi tidak ada: ' + k));
    ['high', 'medium', 'low'].forEach(k => ok(!/%/.test(en['registry.advisor.' + k]), 'penasihat tanpa persen'));
}

// ---------- Render ----------
try {
    const P = await import(R + 'ui/panels/RegistryPanel.js');
    const st = mk(); S.pickExtension(st, 'tech');
    let h = P.renderRegistryBox(st.data);
    ok(h.includes('data-rg="tld-submit"') && h.includes('data-rg="tld-pick"'), 'form lamaran dirender');
    ok(!/\d+\s*%/.test(h.replace(/style="[^"]*"/g, '')), 'tidak ada persen untuk pemain');
    const g = sys(st); feed(0.99); S.submitRegistry(st);
    h = P.renderRegistryBox(st.data); ok(h.includes('registry.wait') === false && h.length > 50, 'status menunggu dirender');
    feed(0.1, 0.99, 0.99); month(st, C.evalMonths);
    h = P.renderRegistryBox(st.data); ok(h.includes('data-rg="tld-sign"'), 'tombol tanda tangan dirender');
    g.destroy();
} catch (e) { ok(false, 'render gagal: ' + e.message); }
Math.random = realRandom;

console.log(fail ? 'ADA GAGAL: ' + fail : 'registry-test: semua lulus');
process.exit(fail ? 1 : 0);
