// Pemeriksa kamus ekosistem: id dan en harus punya key yang sama, dan
// setiap key eco.* yang dipakai di kode harus ada di kedua bahasa.
// Jalankan dari root repo: node tools/eco-i18n-check.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const mod = await import('../src/data/i18n/ecosystem.i18n.js');
const dict = mod.ECOSYSTEM_I18N;
if (!dict || !dict.id || !dict.en) { console.error('ECOSYSTEM_I18N tidak punya id/en'); process.exit(1); }

const idKeys = new Set(Object.keys(dict.id));
const enKeys = new Set(Object.keys(dict.en));
const onlyId = [...idKeys].filter(k => !enKeys.has(k));
const onlyEn = [...enKeys].filter(k => !idKeys.has(k));
let problems = 0;
if (onlyId.length) { console.error('Hanya di id:', onlyId); problems += onlyId.length; }
if (onlyEn.length) { console.error('Hanya di en:', onlyEn); problems += onlyEn.length; }

// Kumpulkan pemakaian tr('eco.…') / t('eco.…') di src/
const used = new Set();
function walk(dir) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (p.endsWith('.js')) {
      const src = readFileSync(p, 'utf8');
      for (const m of src.matchAll(/\b(?:tr|t)\(\s*['"](eco\.[\w.]+)['"]/g)) used.add(m[1]);
    }
  }
}
walk('src');
// Key yang dibentuk dengan konkatenasi (berakhir '.') diperiksa per awalan: semua key berawalan itu harus ada di kedua bahasa.
const prefixes = [...used].filter(k => k.endsWith('.'));
const missing = [...used].filter(k => !k.endsWith('.') && (!idKeys.has(k) || !enKeys.has(k)));
for (const pre of prefixes) {
  const inId = [...idKeys].filter(k => k.startsWith(pre)), inEn = [...enKeys].filter(k => k.startsWith(pre));
  if (!inId.length || inId.length !== inEn.length) missing.push(pre + '*');
}
if (missing.length) { console.error('Key dipakai tapi tidak lengkap:', missing); problems += missing.length; }

console.log(`eco.* id: ${idKeys.size}, en: ${enKeys.size}, dipakai di kode: ${used.size}`);
console.log(problems ? `GAGAL (${problems} masalah)` : 'OK: kamus lengkap dan konsisten');
process.exit(problems ? 1 : 0);
