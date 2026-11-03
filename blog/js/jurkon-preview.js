// Kartu "Dari Jurnal Koneksi" di sidebar beranda, menempati slot iklan 300×250.
// Hanya memanggil jelajahi_publik(): catatan yang penulisnya centang sendiri "tampil di Jelajahi".
// Tabel Jurkon tetap tertutup untuk anon. Bila gagal atau kosong, kartu tetap tampil
// dengan kalimat ajakan dari landing Jurkon (tanpa data palsu).
const JK_URL = 'https://yghgmfvlthzcuhelqesr.supabase.co';          // samakan dengan js/supabase.js di repo Jurkon (proyek yang AKTIF)
const JK_KEY = 'sb_publishable_kRhUqqmzTHW7igXOPPrcZA_VRHQ9C94';    // kunci publishable, aman di frontend
const JK_SITE = 'https://jurkon.my.id/';
const JUMLAH = 2, MAKS_HURUF = 96, CACHE_MS = 10 * 60 * 1000, CK = 'jk-preview-v2';

const T = {
  id: {
    promo: 'Promosi',
    h: 'Dari Jurnal Koneksi',
    sub: 'Catatan terbuka dari komunitas',
    ajak: 'Tempat menulis dan terhubung tanpa algoritma. Gratis dan privat secara bawaan.',
    cta: 'Buka Jurnal Koneksi',
    fine: 'Oleh Jurkon Studio · gratis',
    suka: 'suka',
    kosong: ['Catatan singkat, koneksi yang tenang.', 'Tanpa algoritma. Gratis dan privat.']
  },
  en: {
    promo: 'Promo',
    h: 'From Journal Connection',
    sub: 'Open notes from the community',
    ajak: 'A place to write and connect, with no algorithm. Free and private by default.',
    cta: 'Open Journal Connection',
    fine: 'By Jurkon Studio · free',
    suka: 'likes',
    kosong: ['Short notes, calm connections.', 'No algorithm. Free and private by default.']
  }
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

function potong(s) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  return s.length > MAKS_HURUF ? s.slice(0, MAKS_HURUF).replace(/\s+\S*$/, '') + '…' : s;
}

function inisial(c) {
  const n = String(c.nama || c.username || '').trim();
  return n ? n.charAt(0).toUpperCase() : '✎';
}

function gambar(box, list) {
  const t = T[lang()];
  const kertas = list.length
    ? list.map((c, i) =>
        '<a class="jk-paper jk-p' + (i + 1) + '" href="' + JK_SITE + 'n.html?id=' + encodeURIComponent(c.id) +
        '" target="_blank" rel="noopener">' +
          '<span class="jk-av" aria-hidden="true">' + esc(inisial(c)) + '</span>' +
          '<span class="jk-body"><span class="jk-text">' + esc(potong(c.content)) + '</span>' +
          '<span class="jk-meta">' + esc(c.nama || c.username || '') +
          (c.jumlah_suka > 0 ? ' · ♥ ' + Number(c.jumlah_suka) + ' ' + t.suka : '') + '</span></span>' +
        '</a>').join('')
    : t.kosong.map((s, i) =>
        '<span class="jk-paper jk-p' + (i + 1) + '">' +
          '<span class="jk-av" aria-hidden="true">✎</span>' +
          '<span class="jk-body"><span class="jk-text">' + esc(s) + '</span></span>' +
        '</span>').join('');

  box.innerHTML =
    '<div class="jk-card">' +
      '<div class="jk-top">' +
        '<span class="jk-brand"><i class="jk-dot" aria-hidden="true"></i>Journal Connection</span>' +
        '<span class="jk-tag">' + esc(t.promo) + '</span>' +
      '</div>' +
      '<div class="jk-stack" aria-hidden="' + (list.length ? 'false' : 'true') + '">' + kertas + '</div>' +
      '<h3 class="jk-h">' + esc(t.h) + '</h3>' +
      '<p class="jk-sub">' + esc(list.length ? t.sub : t.ajak) + '</p>' +
      '<a class="jk-cta" href="' + JK_SITE + '" target="_blank" rel="noopener">' + esc(t.cta) + ' →</a>' +
      '<p class="jk-fine">' + esc(t.fine) + '</p>' +
    '</div>';
  box.hidden = false;
}

// Sidebar blog bersifat sticky (top 76px). Bila total tingginya melebihi layar, bagian bawah (tombol kartu ini)
// tidak pernah terjangkau, jadi biarkan sidebar menggulir normal. Dihitung ulang saat tinggi/ukuran layar berubah.
function jagaSticky(box) {
  const aside = box.closest('aside'); if (!aside) return;
  const atur = () => {
    aside.style.position = '';                                   // kembali ke aturan CSS dulu agar ukurannya jujur
    const muat = aside.offsetHeight <= window.innerHeight - 96;  // 76px header + napas
    if (!muat && getComputedStyle(aside).position === 'sticky') aside.style.position = 'static';
  };
  atur();
  window.addEventListener('resize', atur);
  if ('ResizeObserver' in window) new ResizeObserver(atur).observe(aside);
}

(async function () {
  const box = document.getElementById('jkBox'); if (!box) return;
  gambar(box, []);
  jagaSticky(box);                        // kartu langsung tampil dengan kalimat ajakan
  const list = await ambil();
  if (list.length) gambar(box, list);     // lalu diganti dengan catatan asli bila ada
})();
