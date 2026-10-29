// Cek statis: setiap atribut data-eco-* di EcosystemPanel.js punya handler klik di main.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const panel = fs.readFileSync(path.join(root, 'src/ui/panels/EcosystemPanel.js'), 'utf8');
const main = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
const attrs = [...new Set([...panel.matchAll(/data-eco-([a-z-]+)=/g)].map(m => m[1]))].filter(a => a !== 'val');
let bad = 0;
attrs.forEach(a => {
  const camel = 'eco' + a.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('');
  const ok = main.includes('[data-eco-' + a + ']');
  console.log((ok ? 'OK   ' : 'GAGAL') + ' data-eco-' + a + ' -> dataset.' + camel);
  if (!ok) bad++;
});
console.log(bad ? 'GAGAL: ' + bad + ' tombol tanpa handler' : 'SEMUA TOMBOL PUNYA HANDLER');
process.exit(bad ? 1 : 0);
