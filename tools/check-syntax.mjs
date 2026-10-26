// node --check untuk semua src/**/*.js dan sw.js. Jalankan dari akar repo: npm run check
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = walk('src', []);
if (existsSync('sw.js')) files.push('sw.js');
files.sort();

let bad = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (r.status !== 0) { bad++; console.log('GAGAL: ' + f + '\n' + (r.stderr || '').trim()); }
}
console.log(files.length + ' berkas diperiksa, ' + bad + ' gagal');
process.exit(bad ? 1 : 0);
