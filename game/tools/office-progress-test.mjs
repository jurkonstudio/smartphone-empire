// Tes murni OfficeProgress.js: fitur terbuka bertahap menurut LEVEL ruangan dan ERA (tahun game).
// Jalankan dari root repo: node tools/office-progress-test.mjs src
import { load, stubBrowser } from './boot.mjs';
stubBrowser();
const P = await load('src', 'ui/office/OfficeProgress.js');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok:', m); };

ok(P.activeFeatures(1, 0).length === 0, 'level 1 + era 0 (2000): belum ada fitur modern');
ok(!P.featureOn('ledTrim', 4, 2), 'level tinggi tidak cukup bila era masih Touchscreen (2007-2010)');
ok(!P.featureOn('ledTrim', 1, 6), 'era tinggi tidak cukup bila level masih 1');
ok(P.featureOn('ledTrim', 2, 3), 'level 2 + era Smartphone Matang: strip LED aktif');
ok(P.featureOn('holoDesk', 3, 5) && !P.featureOn('holoDesk', 3, 4), 'hologram meja: butuh era AI (2019+) dan level 3');
let prev = -1, mono = true;
for (let e = 0; e <= 6; e++) { const n = P.activeFeatures(4, e).length; if (n < prev) mono = false; prev = n; }
ok(mono, 'jumlah fitur tidak pernah berkurang saat era naik (level 4)');
prev = -1; mono = true;
for (let l = 1; l <= 4; l++) { const n = P.activeFeatures(l, 6).length; if (n < prev) mono = false; prev = n; }
ok(mono, 'jumlah fitur tidak pernah berkurang saat level naik (era 6)');
ok(P.activeFeatures(4, 6).length === Object.keys(P.FEATURES).length, 'level 4 + era 6: semua fitur aktif');
ok(P.nextFeature(4, 6) === null, 'tidak ada fitur berikutnya saat semua aktif');
ok(P.nextFeature(1, 0) && P.nextFeature(1, 0).gap > 0, 'fitur berikutnya dilaporkan saat masih ada yang terkunci');
ok(P.officeStage({ levels: { hq: 1 }, eraIdx: 0 }) === 0 && P.officeStage({ levels: { hq: 4 }, eraIdx: 6 }) === 5, 'tahap 0..5 menutupi seluruh rentang');
ok(P.deskRows(6) === 2 && P.deskRows(12) === 2 && P.deskRows(18) === 3 && P.deskRows(30) === 5, 'jumlah baris meja sesuai kapasitas');
const seen = new Set(); let dup = false;
for (let i = 0; i < 30; i++) { const s = P.deskSlot(i, 6, 5); const k = s.x + ',' + s.z; if (seen.has(k)) dup = true; seen.add(k); }
ok(!dup && seen.size === 30, '30 slot meja unik');
for (const pal of P.ART_PALETTE) if (!Array.isArray(pal) || pal.length < 3) { fail++; console.log('GAGAL: palet seni era tidak valid'); }
console.log(fail ? 'ADA GAGAL' : 'SEMUA LULUS');
process.exit(fail ? 1 : 0);
