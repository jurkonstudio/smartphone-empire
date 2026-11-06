import { mdToText } from './richtext.js';
// Penilai kualitas artikel (berjalan di browser, tanpa AI, tanpa biaya).
// assessPost(post, semuaPost) -> { score, level, issues: [{ sev, text }] }
//   sev: 'bad' (serius), 'warn' (sebaiknya diperbaiki), 'info' (saran)
// autoClean(teksMentah) -> { text, changes: [..] }  — perapian aman, tidak mengubah makna.

const FILLER = [
  'di era digital', 'tidak dapat dipungkiri', 'seiring berkembangnya zaman', 'seiring perkembangan zaman',
  'dalam dunia yang semakin', 'di tengah pesatnya', 'tak bisa dipungkiri', 'perlu diingat bahwa',
  'dapat disimpulkan bahwa', 'in today\'s digital age', 'it goes without saying',
  'tidak diragukan lagi', 'tak hanya itu', 'lebih dari itu', 'menjadi bukti bahwa', 'game changer', 'dalam lanskap',
  'di dunia yang terus berkembang', 'tidak bisa dipungkiri', 'mari kita bahas', 'dengan demikian'
];
const SENSASI = /\b(guncang|menggegerkan|gempar|mimpi buruk|terbongkar|dibongkar|menggebrak|kiamat|habisi|tamat|menghancurkan|drama)\b/i;
const NICHE = /\b(ponsel|hp|smartphone|gadget|handphone|android|ios|iphone|ipad|samsung|galaxy|xiaomi|redmi|poco|oppo|vivo|realme|infinix|tecno|huawei|honor|pixel|motorola|nokia|oneplus|redmagic|rog|snapdragon|dimensity|exynos|chipset|baterai|kamera|foldable|ponsel lipat|wearable|smartwatch|earbuds|tablet|one ui|hyperos|coloros|nfc|5g)\b/i;
const INDONESIA = /(indonesia|\brp\.?\s?\d|rupiah|\bidr\b|shopee|tokopedia|lazada|blibli|erafone|ibox|resmi di ri|tkdn|nasional)/i;
const VERDICT = /(layak|rekomendasi|kesimpulan|mana yang (lebih )?(baik|cocok|pilih)|cocok untuk|sebaiknya|pilih (yang|mana)|worth|verdict|siapa yang)/i;
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

  const plain = mdToText(body);
  const wc = words(plain).length;
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
  const subheads = paras.filter((x) => /^#{1,6}\s/.test(x.trim()) || (!/\n/.test(x.trim()) && x.trim().length < 70 && !/[.!?:]$/.test(x.trim()) && !/^\|/.test(x.trim()))).length;
  if (wc > 500 && subheads === 0) hit('info', 5, 'Artikel panjang tanpa subjudul. Tambahkan subjudul agar mudah dipindai.');

  if (AI_CHATTER.test(body.split('\n')[0] || '') || AI_CHATTER.test(title)) hit('bad', 20, 'Ada kalimat pembuka khas AI ("Tentu, berikut artikel…"). Hapus.');
  if (PLACEHOLDER.test(title + ' ' + body)) hit('bad', 20, 'Ada teks placeholder yang belum diisi (mis. [Sisipkan …], TODO).');
  const lastLine = body.split('\n').filter((l) => l.trim()).slice(-1)[0] || '';
  if (AI_TAIL.test(lastLine)) hit('warn', 8, 'Ada kalimat penutup khas AI ("Semoga bermanfaat…"). Hapus.');

  const ss = sentences(plain);
  if (ss.length > 6) {
    const uniq = new Set(ss).size / ss.length;
    if (uniq < 0.85) hit('warn', 10, 'Ada kalimat yang berulang. Ringkas bagian yang mengulang.');
  }
  const low = plain.toLowerCase();
  const fillerHits = FILLER.filter((f) => low.includes(f)).length;
  if (fillerHits) hit('info', Math.min(9, fillerHits * 3), `Ada ${fillerHits} frasa klise/basa-basi. Ganti dengan fakta yang spesifik.`);

  if (['rilis', 'spek', 'jadwal'].includes(cat) && wc > 80 && !/\d/.test(body)) hit('warn', 5, 'Belum ada angka atau data spesifik (spesifikasi, tanggal, harga).');
  if (!p.author || /^(admin|redaksi|test)$/i.test(p.author)) hit('info', 3, 'Pakai nama penulis yang nyata dan konsisten.');

  // ---- Pemeriksaan nilai artikel (bukan sekadar bentuk) ----
  const firstPara = (paras[0] || '').trim();
  const lastPara = (paras[paras.length - 1] || '').trim();
  const isTableOrHead = (t) => /^(\||#{1,6}\s)/.test(t);
  if (paras.length && isTableOrHead(firstPara)) hit('warn', 8, 'Artikel langsung dimulai dengan tabel/subjudul. Tambahkan 2-3 kalimat pembuka yang menjawab inti pertanyaan pembaca (juga dipakai Google sebagai cuplikan).');
  const lastLine2 = lastPara.split('\n').slice(-1)[0].trim();
  const endsWithSources = /^(\*\*)?(sumber|sources?)\b/i.test(lastPara) || /^(https?:\/\/\S+|\[[^\]]*\]\(https?:\/\/[^)]*\)|[-*•]\s*\S*https?:\/\/\S+)$/i.test(lastLine2);
  if (wc >= 150 && lastLine2 && !endsWithSources && !isTableOrHead(lastLine2) && !/^([-*•]|\d+[.)])\s/.test(lastLine2) && !/[.!?…"”')\]]$/.test(lastLine2)) hit('warn', 8, 'Akhir artikel terlihat terpotong (tidak berakhir dengan tanda baca). Tambahkan paragraf penutup.');
  const smartTopic = ['rilis', 'spek', 'rumor', 'jadwal'].includes(cat);
  if (smartTopic && !NICHE.test(title + ' ' + excerpt) && (plain.match(new RegExp(NICHE.source, 'gi')) || []).length < 4) hit('bad', 20, 'Topik tampak di luar niche smartphone/gadget. Artikel di luar niche melemahkan fokus situs; pertimbangkan tidak diterbitkan atau kaitkan jelas dengan ponsel.');
  if (SENSASI.test(title)) hit('warn', 6, 'Judul memakai kata bombastis (mis. "guncang", "mimpi buruk", "terbongkar"). Ganti dengan judul yang lugas dan informatif.');
  if (smartTopic && wc > 250 && !INDONESIA.test(body)) hit('info', 6, 'Belum ada konteks Indonesia (harga rupiah, ketersediaan resmi, TKDN, atau toko lokal). Ini nilai tambah terbesar untuk pembaca dan SEO lokal.');
  const hasLink = /\]\(https?:\/\//.test(body) || /https?:\/\//.test(body) || !!p.source_url;
  if (smartTopic && wc > 250 && !hasLink) hit('warn', 8, 'Sumber disebut tanpa tautan. Beri tautan ke sumber asli agar bisa dicek pembaca (dan menambah kepercayaan).');
  if (['rilis', 'spek'].includes(cat) && wc > 400 && !VERDICT.test(body)) hit('info', 5, 'Belum ada kesimpulan/rekomendasi ("layak dibeli untuk siapa"). Opini yang jelas adalah nilai tambah yang tidak bisa disalin mesin.');
  const hasOriginal = /(\bkami (uji|coba|tes|pakai|cek|bandingkan)|\bsaya (uji|coba|tes|pakai|cek)|hasil (uji|tes|pengujian) (kami|sendiri|redaksi)|pengalaman (kami|saya)|di tangan kami|foto (oleh|milik) (kami|redaksi)|!\[)/i.test(body);
  if (smartTopic && wc > 400 && !hasOriginal) hit('info', 4, 'Belum ada elemen orisinal (uji/pengalaman sendiri, foto atau tangkapan layar sendiri, atau analisis yang tidak ada di sumber).');
  const numbers = (plain.match(/\d[\d.,]*/g) || []).length;
  if (['rilis', 'spek', 'jadwal'].includes(cat) && wc > 300 && numbers < 5) hit('info', 4, 'Sedikit angka/data (hanya ' + numbers + '). Artikel spek yang bernilai biasanya memuat banyak angka yang bisa diverifikasi.');
  if (excerpt.length > 170) hit('info', 3, 'Ringkasan terlalu panjang (' + excerpt.length + ' karakter); ideal 100-160 agar tidak terpotong di Google.');
  const openers = sentences(plain).map((x) => x.split(' ').slice(0, 2).join(' '));
  if (openers.length > 10) {
    const freq = {}; openers.forEach((o) => { freq[o] = (freq[o] || 0) + 1; });
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] / openers.length > 0.25 && top[1] >= 4) hit('info', 4, `Terlalu banyak kalimat diawali "${top[0]}" (${top[1]}x). Variasikan pembuka kalimat agar tidak terasa otomatis.`);
  }

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
    if (k.length > 40 && seen.has(k) && !/\||```/.test(par)) { dups++; return; }
    seen.add(k); kept.push(par);
  });
  if (dups) { changes.push(`${dups} paragraf ganda dihapus`); text = kept.join('\n\n'); }

  // 5) Rapikan spasi dan tanda baca berlebihan.
  // (indentasi daftar bersarang dan isi blok kode ``` dibiarkan; hanya spasi ganda di tengah kalimat yang dirapikan)
  let inCode = false;
  const tidy = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').split('\n').map((ln) => {
    if (/^\s*(```|~~~)/.test(ln)) { inCode = !inCode; return ln; }
    return inCode ? ln : ln.replace(/([!?])\1{1,}/g, '$1').replace(/(\S) {2,}/g, '$1 ');
  }).join('\n').trim();
  if (tidy !== text) { changes.push('Spasi dan tanda baca dirapikan'); text = tidy; }

  return { text, changes };
}
