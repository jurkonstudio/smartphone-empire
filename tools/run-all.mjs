// Menjalankan skrip tes yang berdiri sendiri satu per satu. Jalankan dari akar repo: npm test
// Exit code 1 bila ada yang gagal.
// Gagal = exit code bukan 0, ATAU keluaran memuat baris "GAGAL" / "N GAGAL" (N>0). Semua skrip di bawah
// kini mengatur exit code sendiri (live.mjs dan beh.mjs sejak P3); deteksi lewat teks tinggal jaring pengaman
// untuk skrip lama. Keduanya hanya ditandai sebagai satu baris GAGAL, tidak dihitung dua kali.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// { file, src: true bila skrip meminta argumen "src", optional: true bila berkas boleh belum ada }
const TESTS = [
  // Tes dari Tahap 2 dan 3A (tanpa argumen, tanpa dependensi)
  { file: 'tools/modal-a11y.test.mjs' },
  // sw.test.mjs berasal dari patch Tahap 3A. Zip yang dipakai saat Tahap 4 ditulis belum memuatnya,
  // jadi dilewati dengan peringatan. Hapus `optional` begitu berkasnya masuk repo.
  { file: 'tools/sw.test.mjs', optional: true },
  { file: 'tools/tutorial-flow.test.mjs' },
  { file: 'tools/advisor-done-test.mjs' },
  { file: 'tools/notif-prefs.test.mjs' },
  { file: 'tools/notif-default.test.mjs', src: true },
  // Tanpa argumen
  { file: 'tools/civic-test.mjs' },
  { file: 'tools/world-map-test.mjs' },
  { file: 'tools/people-test.mjs' },
  { file: 'tools/weather-test.mjs' },
  { file: 'tools/eco-i18n-check.mjs' },
  { file: 'tools/eco-wiring-check.mjs' },
  // Butuh argumen src
  { file: 'tools/annual-review-test.mjs', src: true },
  { file: 'tools/assembly-test.mjs', src: true },
  { file: 'tools/channels-test.mjs', src: true },
  { file: 'tools/demand-breakdown.test.mjs', src: true },
  { file: 'tools/why-card.test.mjs', src: true },
  { file: 'tools/chip-design-plant-test.mjs', src: true },
  { file: 'tools/dynamic-events-test.mjs', src: true },
  { file: 'tools/eco-render-check.mjs', src: true },
  { file: 'tools/design-tracks-check.mjs', src: true },
  { file: 'tools/product-tabs-check.mjs', src: true },
  { file: 'tools/overview-v2-check.mjs', src: true },
  { file: 'tools/cash-range-check.mjs', src: true },
  { file: 'tools/wholesale-modal-check.mjs', src: true },
  { file: 'tools/eco-services-sim.mjs', src: true },
  { file: 'tools/econ-brakes.mjs', src: true },
  { file: 'tools/era-events-test.mjs', src: true },
  { file: 'tools/features-test.mjs', src: true },
  { file: 'tools/navui.mjs', src: true },
  { file: 'tools/paket2027.mjs', src: true },
  { file: 'tools/promo.mjs', src: true },
  { file: 'tools/road-graph-test.mjs', src: true },
  { file: 'tools/runway.mjs', src: true },
  { file: 'tools/scene-smoke.mjs', src: true },
  { file: 'tools/office-smoke.mjs', src: true }, // tiruan THREE/canvas diperbarui di P3
  // Skrip simulasi/kalibrasi: tidak punya assertion, hanya memastikan berjalan tanpa error (smoke).
  { file: 'tools/asm-balance.mjs', src: true },
  { file: 'tools/beh.mjs', src: true },
  { file: 'tools/boost.mjs', src: true },
  { file: 'tools/calib.mjs', src: true },
  { file: 'tools/eco-calib.mjs', src: true },
  { file: 'tools/live.mjs', src: true },
  { file: 'tools/render.mjs', src: true },
  { file: 'tools/sim.mjs', src: true },
  { file: 'tools/uni.mjs', src: true }
];

// DIKECUALIKAN dari daftar di atas (jangan dimasukkan sebelum syaratnya terpenuhi):
//  - ship-test, crane-test, ct-test, assembly-inside-test, assembly-kerja-test:
//      butuh src/ui/manufacture/ManufactureScene.probe.js (salinan ManufactureScene.js + baris __probe,
//      lihat tools/README.md). Probe tidak ikut repo.
//  - geo-test: butuh ../proj-orig (salinan src/ sebelum sesi 2), tidak ada di repo.
//  - boot.mjs: pustaka bantu, bukan tes.

const FAIL_RE = /(^|\n)\s*GAGAL\b(?! total: 0\b)|\b[1-9]\d*\s+GAGAL\b|ADA GAGAL/;
const rows = [];
for (const t of TESTS) {
  if (!existsSync(t.file)) {
    rows.push({ file: t.file, status: t.optional ? 'LEWAT' : 'GAGAL', ms: 0, note: 'berkas tidak ada' });
    continue;
  }
  const t0 = Date.now();
  const r = spawnSync(process.execPath, t.src ? [t.file, 'src'] : [t.file],
    { encoding: 'utf8', timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || '') + (r.stderr || '');
  const failed = r.status !== 0 || FAIL_RE.test(out);
  rows.push({ file: t.file, status: failed ? 'GAGAL' : 'LULUS', ms: Date.now() - t0, note: failed ? 'exit ' + r.status : '' });
  if (failed) console.log('--- keluaran ' + t.file + ' ---\n' + out.split('\n').slice(-25).join('\n') + '\n');
}

const w = Math.max(...rows.map(r => r.file.length));
console.log('\n' + 'Skrip'.padEnd(w) + '  Status  Waktu   Catatan');
for (const r of rows) console.log(r.file.padEnd(w) + '  ' + r.status.padEnd(6) + '  ' + (r.ms + 'ms').padEnd(6) + '  ' + r.note);
const nFail = rows.filter(r => r.status === 'GAGAL').length;
const nSkip = rows.filter(r => r.status === 'LEWAT').length;
console.log('\n' + rows.filter(r => r.status === 'LULUS').length + ' lulus, ' + nFail + ' gagal, ' + nSkip + ' dilewati');
process.exit(nFail ? 1 : 0);
