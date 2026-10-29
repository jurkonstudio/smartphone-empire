// Penilai kualitas artikel (berjalan di browser, tanpa AI, tanpa biaya).
// assessPost(post, semuaPost) -> { score, level, issues: [{ sev, text }] }
//   sev: 'bad' (serius), 'warn' (sebaiknya diperbaiki), 'info' (saran)
// autoClean(teksMentah) -> { text, changes: [..] }  — perapian aman, tidak mengubah makna.

const FILLER = [
  'di era digital', 'tidak dapat dipungkiri', 'seiring berkembangnya zaman', 'seiring perkembangan zaman',
  'dalam dunia yang semakin', 'di tengah pesatnya', 'tak bisa dipungkiri', 'perlu diingat bahwa',
  'dapat disimpulkan bahwa', 'in today\'s digital age', 'it goes without saying'
];
const CLICKBAIT = /(\bwow\b|\bheboh\b|\bviral\b|\bshocking\b|\bmengejutkan\b|\bgak nyangka\b|\bnggak nyangka\b|\bternyata begini\b|!!+|\?\?+)/i;
const AI_CHATTER = /^(tentu|baik[,.! ]|berikut( ini)?( adalah)?( sebuah)?( draf| draft)?( artikel)?|ini (adalah )?artikel|sure|certainly|here is|here's|as an ai|sebagai (model|ai|asisten))/i;
const AI_TAIL = /^(semoga (artikel|tulisan) ini|semoga bermanfaat|jika (anda|kamu) (ingin|mau|butuh)|apakah (anda|kamu) (ingin|mau)|let me know|i hope this)/i;
const PLACEHOLDER = /(\[(sisipkan|nama|tanggal|link|gambar|insert)[^\]]*\]|lorem ipsum|\bTODO\b|\bXXX+\b)/i;

const words = (s) => (s || '').trim().split(/\s+/).filter(Boolean);
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9\u00c0-\u024f ]+/g, ' ').replace(/\s+/g, ' ').trim();

function sentences(body) {
  return (body || '').replace(/\n+/g, ' ').split(/(?<=[.!?])\s+/).map((s) => norm(s)).filter((s) => s.length > 25);
}

function similarity(a, b) {
  const A = new Set(norm(a).split(' ').filter((w) => w.length > 3));
  const B = new Set(norm(b).split(' ').filter((w) => w.length > 3));
  if (!A.size || !B.size) return 0;
  let inter = 0; A.forEach((w) => { if (B.has(w)) inter++; });
  return inter / (A.size + B.size - inter);
}

export function assessPost(p, all = []) {
  const title = (p.title || '').trim();
  const body = (p.body || '').trim();
  const excerpt = (p.excerpt || '').trim();
  const cat = p.category || '';
  const issues = [];
  let score = 100;
  const hit = (sev, pts, text) => { score -= pts; issues.push({ sev, text }); };

  const wc = words(body).length;
  if (wc < 200) hit('bad', 35, `Terlalu pendek (${wc} kata). Artikel yang bernilai biasanya ±350 kata atau lebih.`);
  else if (wc < 350) hit('warn', 15, `Agak pendek (${wc} kata). Tambahkan konteks, data, atau analisis.`);

  if (title.length < 25) hit('warn', 10, 'Judul terlalu pendek, kurang menjelaskan isi.');
  else if (title.length > 110) hit('warn', 8, 'Judul terlalu panjang, akan terpotong di Google.');
  const letters = title.replace(/[^A-Za-z]/g, '');
  if (letters.length > 8 && letters.replace(/[^A-Z]/g, '').length / letters.length > 0.6) hit('warn', 10, 'Judul memakai huruf kapital berlebihan.');
  if (CLICKBAIT.test(title)) hit('warn', 10, 'Judul terkesan clickbait (kata sensasional atau tanda baca berlebihan).');

  if (excerpt.length < 60) hit('warn', 8, 'Ringkasan kosong atau terlalu singkat (ideal 100–160 karakter).');
  if (!p.cover_url && !p.hasCover) hit('warn', 8, 'Belum ada gambar sampul.');

  const hasSourceInBody = /(https?:\/\/|\bsumber\b|\bsources?\b)/i.test(body);
  if (cat === 'rumor') {
    if (!p.source_url && !hasSourceInBody) hit('bad', 25, 'Rumor tanpa sumber. Wajib mencantumkan sumber bocoran.');
    if (!/(rumor|belum (dikonfirmasi|resmi)|bocoran|unconfirmed|leak)/i.test(body)) hit('warn', 10, 'Artikel rumor belum menyebut jelas bahwa informasinya belum dikonfirmasi.');
  } else if (!p.source_url && !hasSourceInBody) {
    hit('warn', 5, 'Belum mencantumkan sumber informasi.');
  }

  const paras = body.split(/\n\s*\n/).filter((x) => x.trim());
  if (paras.length < 3 && wc >= 120) hit('warn', 10, 'Hanya sedikit paragraf. Pecah menjadi paragraf pendek agar mudah dibaca di HP.');
  if (paras.length && wc / paras.length > 140) hit('warn', 8, 'Paragraf terlalu panjang (tembok teks).');
  const subheads = paras.filter((x) => !/\n/.test(x.trim()) && x.trim().length < 70 && !/[.!?:]$/.test(x.trim())).length;
  if (wc > 500 && subheads === 0) hit('info', 5, 'Artikel panjang tanpa subjudul. Tambahkan subjudul agar mudah dipindai.');

  if (AI_CHATTER.test(body.split('\n')[0] || '') || AI_CHATTER.test(title)) hit('bad', 20, 'Ada kalimat pembuka khas AI ("Tentu, berikut artikel…"). Hapus.');
  if (PLACEHOLDER.test(title + ' ' + body)) hit('bad', 20, 'Ada teks placeholder yang belum diisi (mis. [Sisipkan …], TODO).');
  const lastLine = body.split('\n').filter((l) => l.trim()).slice(-1)[0] || '';
  if (AI_TAIL.test(lastLine)) hit('warn', 8, 'Ada kalimat penutup khas AI ("Semoga bermanfaat…"). Hapus.');

  const ss = sentences(body);
  if (ss.length > 6) {
    const uniq = new Set(ss).size / ss.length;
    if (uniq < 0.85) hit('warn', 10, 'Ada kalimat yang berulang. Ringkas bagian yang mengulang.');
  }
  const low = body.toLowerCase();
  const fillerHits = FILLER.filter((f) => low.includes(f)).length;
  if (fillerHits) hit('info', Math.min(9, fillerHits * 3), `Ada ${fillerHits} frasa klise/basa-basi. Ganti dengan fakta yang spesifik.`);

  if (['rilis', 'spek', 'jadwal'].includes(cat) && wc > 80 && !/\d/.test(body)) hit('warn', 5, 'Belum ada angka atau data spesifik (spesifikasi, tanggal, harga).');
  if (!p.author || /^(admin|redaksi|test)$/i.test(p.author)) hit('info', 3, 'Pakai nama penulis yang nyata dan konsisten.');

  const others = all.filter((o) => o && o.id !== p.id && o.status !== 'draft');
  const dup = others.find((o) => similarity(o.title, title) > 0.7);
  if (dup) hit('bad', 20, `Judul sangat mirip dengan artikel lain: "${(dup.title || '').slice(0, 60)}".`);

  score = Math.max(0, Math.min(100, score));
  const level = score >= 80 ? 'baik' : score >= 60 ? 'cukup' : 'rendah';
  issues.sort((a, b) => ({ bad: 0, warn: 1, info: 2 }[a.sev] - { bad: 0, warn: 1, info: 2 }[b.sev]));
  return { score, level, issues };
}

// Perapian aman untuk teks mentah hasil AI (sebelum diurai jadi judul/isi).
export function autoClean(raw) {
  const changes = [];
  let lines = String(raw || '').replace(/\r\n?/g, '\n').split('\n');

  // 1) Buang pembuka khas AI sebelum judul.
  let removedOpen = 0;
  while (lines.length && (!lines[0].trim() || AI_CHATTER.test(lines[0].trim().replace(/^[#*\s]+/, '')) && lines[0].trim().length < 140 && !/^#/.test(lines[0].trim()))) {
    if (lines[0].trim()) removedOpen++;
    lines.shift();
  }
  if (removedOpen) changes.push('Pembuka khas AI dihapus');

  // 2) Buang penutup khas AI.
  let removedTail = 0;
  while (lines.length && (!lines[lines.length - 1].trim() || AI_TAIL.test(lines[lines.length - 1].trim().replace(/^[#*\s]+/, '')))) {
    if (lines[lines.length - 1].trim()) removedTail++;
    lines.pop();
  }
  if (removedTail) changes.push('Penutup khas AI dihapus');

  let text = lines.join('\n');

  // 3) Hapus emoji dan simbol dekoratif.
  const noEmoji = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '');
  if (noEmoji !== text) { changes.push('Emoji dihapus'); text = noEmoji; }

  // 4) Hapus paragraf yang sama persis.
  const seen = new Set(); const kept = []; let dups = 0;
  text.split(/\n\s*\n/).forEach((par) => {
    const k = norm(par);
    if (k.length > 40 && seen.has(k)) { dups++; return; }
    seen.add(k); kept.push(par);
  });
  if (dups) { changes.push(`${dups} paragraf ganda dihapus`); text = kept.join('\n\n'); }

  // 5) Rapikan spasi dan tanda baca berlebihan.
  const tidy = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/([!?])\1{1,}/g, '$1').replace(/ {2,}/g, ' ').trim();
  if (tidy !== text) { changes.push('Spasi dan tanda baca dirapikan'); text = tidy; }

  return { text, changes };
}
