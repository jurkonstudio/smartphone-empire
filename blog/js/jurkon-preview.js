// Pratinjau "Dari Jurnal Koneksi" di sidebar blog (menggantikan kotak iklan).
// Hanya memanggil jelajahi_publik() milik Jurkon: catatan yang penulisnya centang sendiri "tampil di Jelajahi".
// Tabel Jurkon tetap tertutup untuk anon. Bila gagal/kosong, kartu ajakan tetap tampil (tanpa data palsu).
const JK_URL = 'https://yghgmfvlthzcuhelqesr.supabase.co';          // samakan dengan js/supabase.js di repo Jurkon (proyek yang AKTIF)
const JK_KEY = 'sb_publishable_kRhUqqmzTHW7igXOPPrcZA_VRHQ9C94';    // kunci publishable, aman di frontend
const JK_SITE = 'https://jurkon.my.id/';
const JUMLAH = 3, MAKS_HURUF = 150, CACHE_MS = 10 * 60 * 1000, CK = 'jk-preview-v1';

const T = {
  id: { h: 'Dari Jurnal Koneksi', sub: 'Catatan terbuka dari komunitas', cta: 'Buka Jurnal Koneksi', ajak: 'Tempat menulis dan terhubung tanpa algoritma. Gratis dan privat secara bawaan.', suka: 'suka' },
  en: { h: 'From Journal Connection', sub: 'Open notes from the community', cta: 'Open Journal Connection', ajak: 'A place to write and connect, with no algorithm. Free and private by default.', suka: 'likes' }
};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lang = () => { try { return localStorage.getItem('blog-lang') === 'en' ? 'en' : 'id'; } catch (e) { return 'id'; } };

async function ambil() {
  try { const c = JSON.parse(sessionStorage.getItem(CK) || 'null'); if (c && Date.now() - c.t < CACHE_MS) return c.d; } catch (e) {}
  const ac = new AbortController(); const to = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetch(JK_URL + '/rest/v1/rpc/jelajahi_publik', {
      method: 'POST', signal: ac.signal,
      headers: { 'Content-Type': 'application/json', apikey: JK_KEY, Authorization: 'Bearer ' + JK_KEY },
      body: JSON.stringify({ p_limit: JUMLAH })
    });
    if (!r.ok) return [];
    const d = await r.json();
    const list = Array.isArray(d) ? d.slice(0, JUMLAH) : [];
    try { sessionStorage.setItem(CK, JSON.stringify({ t: Date.now(), d: list })); } catch (e) {}
    return list;
  } catch (e) { return []; } finally { clearTimeout(to); }
}

function potong(s) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > MAKS_HURUF ? s.slice(0, MAKS_HURUF).replace(/\s+\S*$/, '') + '…' : s; }

function gambar(box, list) {
  const t = T[lang()];
  const item = list.map((c) =>
    '<li><a class="jk-note" href="' + JK_SITE + 'n.html?id=' + encodeURIComponent(c.id) + '" target="_blank" rel="noopener">' +
      '<span class="jk-text">' + esc(potong(c.content)) + '</span>' +
      '<span class="jk-meta">' + esc(c.nama || c.username || '') + (c.username ? ' · @' + esc(c.username) : '') +
      (c.jumlah_suka > 0 ? ' · ' + Number(c.jumlah_suka) + ' ' + t.suka : '') + '</span></a></li>').join('');
  box.innerHTML =
    '<h3>' + esc(t.h) + '</h3>' +
    (list.length ? '<p class="jk-sub">' + esc(t.sub) + '</p><ul class="jk-list">' + item + '</ul>' : '<p class="jk-ajak">' + esc(t.ajak) + '</p>') +
    '<a class="jk-cta" href="' + JK_SITE + '" target="_blank" rel="noopener">' + esc(t.cta) + ' →</a>';
  box.hidden = false;
}

(async function () {
  const box = document.getElementById('jkBox'); if (!box) return;
  gambar(box, []);                       // kerangka ajakan langsung tampil, lalu diganti bila ada catatan
  const list = await ambil();
  if (list.length) gambar(box, list);
  window.addEventListener('storage', () => gambar(box, list));
})();
