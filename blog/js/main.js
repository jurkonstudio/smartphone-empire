window.__blogReady = true;  // modul termuat (CDN Supabase berhasil)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm';
import { SUPABASE_URL, SUPABASE_KEY, BUCKET, MAX_IMAGE_BYTES, TZ, AUTH_KEY, CONTACT_EMAIL, SOCIAL, SHOW_ADS, LS_LANG, TRANSLATE_URL } from './config.js';
import { assessPost, autoClean } from './quality.js';
import { I18N, CATS_L, DESC_L } from './i18n.js';
import { PAGES } from './pages.js';


const CATS = { rilis: 'Rilis', spek: 'Spek', rumor: 'Rumor', jadwal: 'Jadwal' };
const CAT_DESC = {
  semua: 'Kabar terbaru seputar smartphone dan gadget.',
  rilis: 'Peluncuran perangkat baru dari berbagai produsen.',
  spek: 'Ulasan spesifikasi dan perbandingan perangkat.',
  rumor: 'Kabar yang belum dikonfirmasi. Selalu disertai sumber.',
  jadwal: 'Jadwal peluncuran dan agenda acara produsen.'
};
const STATUS_LABEL = { rumor: 'Rumor', dikonfirmasi: 'Dikonfirmasi', resmi: 'Resmi' };

// Bahasa: pilihan manual pembaca dulu; kalau belum pernah memilih, ikuti bahasa ponsel/browser
// (bahasa Indonesia -> ID, selain itu -> EN).
function detectLang() {
  try { const l = localStorage.getItem(LS_LANG); if (l === 'en' || l === 'id') return l; } catch (e) {}
  const prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'id']);
  const first = String(prefs[0] || 'id').toLowerCase();
  return first === 'in' || first.startsWith('id') ? 'id' : 'en';
}
let LANG = detectLang();
// Teks artikel sesuai bahasa; kalau terjemahan belum ada, pakai versi Indonesia.
const hasEn = (p) => !!(p && (p.title_en || p.body_en));
const tx = (p, f) => (LANG === 'en' && p[f + '_en']) ? p[f + '_en'] : p[f];

Object.assign(CATS, CATS_L[LANG]); Object.assign(CAT_DESC, DESC_L[LANG]);
const t = (k) => (I18N[LANG] && I18N[LANG][k]) || I18N.id[k] || k;

function applyLang(initial) {
  document.documentElement.lang = LANG;
  Object.assign(CATS, CATS_L[LANG]); Object.assign(CAT_DESC, DESC_L[LANG]);
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); el.setAttribute('aria-label', t(el.dataset.i18nPh)); });
  document.querySelectorAll('#langToggle button').forEach((b) => b.classList.toggle('on', b.dataset.lang === LANG));
  if (!initial) renderAll(true);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { storageKey: AUTH_KEY, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});

const $ = (id) => document.getElementById(id);
const state = {
  isAdmin: false, user: null, name: '', posts: [], releases: [], cat: 'semua', query: '',
  poll: null, pollRes: [], myVote: null, comments: [], postId: null,
  editingPostId: null, editingReleaseId: null
};


// ---------- penilaian kualitas ----------
function renderQuality(el, res) {
  if (!res) { el.hidden = true; el.innerHTML = ''; return; }
  const label = { baik: 'Baik', cukup: 'Cukup', rendah: 'Perlu diperbaiki' }[res.level];
  const icon = { bad: '⛔', warn: '⚠️', info: '💡' };
  el.hidden = false;
  el.className = 'qbox q-' + res.level;
  el.innerHTML = `<div class="q-head"><b>Kualitas: ${res.score}/100</b><span>${label}</span></div>` +
    (res.issues.length ? '<ul>' + res.issues.map((x) => `<li>${icon[x.sev]} ${esc(x.text)}</li>`).join('') + '</ul>' : '<p>Tidak ada catatan. Siap terbit.</p>');
}
function refreshPostQuality() {
  const body = $('pBody').value.trim();
  if (!body && !$('pTitle').value.trim()) { renderQuality($('pQuality'), null); return; }
  const cur = state.posts.find((x) => x.id === state.editingPostId);
  renderQuality($('pQuality'), assessPost({
    id: state.editingPostId, title: $('pTitle').value, excerpt: $('pExcerpt').value, body, category: $('pCat').value,
    source_url: $('pSource').value.trim(), cover_url: cur?.cover_url, hasCover: !!$('pCover').files[0],
    author: $('pAuthor').value, status: 'published'
  }, state.posts));
}
['pTitle', 'pExcerpt', 'pBody', 'pCat', 'pSource', 'pAuthor'].forEach((id) => { const e = $(id); if (e) e.addEventListener('input', refreshPostQuality); });
$('pCat').addEventListener('change', refreshPostQuality);
$('pCover').addEventListener('change', refreshPostQuality);

// ---------- util ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = (u) => (typeof u === 'string' && /^https?:\/\//i.test(u) ? u : '');
const fmtDate = (v, dateOnly = false) => {
  if (!v) return '';
  const d = dateOnly ? new Date(v + 'T00:00:00+07:00') : new Date(v);
  return d.toLocaleDateString(LANG === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });
};
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const postDate = (p) => p.published_at || p.created_at;
const isDarkNow = () => {
  const t = document.documentElement.getAttribute('data-theme');
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
};
document.querySelectorAll('#langToggle button').forEach((b) => b.addEventListener('click', () => {
  if (LANG === b.dataset.lang) return;
  LANG = b.dataset.lang;
  try { localStorage.setItem(LS_LANG, LANG); } catch (e) {}
  applyLang(false);
}));
let toastTimer;
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ---------- tema gelap / terang ----------
function syncThemeIcons() {
  const dark = isDarkNow();
  $('iconMoon').hidden = dark;
  $('iconSun').hidden = !dark;
}
$('themeToggle').addEventListener('click', () => {
  const next = isDarkNow() ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('blog-theme', next); } catch (e) {}
  syncThemeIcons();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', syncThemeIcons);
syncThemeIcons();

// ---------- autentikasi ----------
async function refreshAuth() {
  const { data: { session } } = await sb.auth.getSession();
  state.user = session?.user || null; state.isAdmin = false; state.name = '';
  if (state.user) {
    const [a, pr] = await Promise.all([
      sb.rpc('is_admin'),
      sb.from('profiles').select('display_name').eq('id', state.user.id).maybeSingle()
    ]);
    state.isAdmin = !a.error && a.data === true;
    state.name = pr.data?.display_name || (state.user.email || 'pembaca').split('@')[0];
  }
  $('adminbar').hidden = !state.isAdmin;
  if (state.isAdmin) sb.rpc('blog_stats', { p_days: 1 }).then(({ data }) => { if (data && $('abToday')) $('abToday').textContent = `Hari ini: ${data.today.views} dilihat · ${data.today.visitors} pengunjung`; }, () => {});
  $('userChip').hidden = !state.user;
  $('userName').textContent = state.name;
}

// ---------- muat data ----------
async function loadPosts() {
  const BASE = 'id,slug,title,category,excerpt,body,cover_url,source_url,is_featured,status,author,published_at,created_at';
  const build = (cols) => {
    let q = sb.from('blog_posts').select(cols).limit(200);
    if (!state.isAdmin) q = q.eq('status', 'published');
    return q;
  };
  let { data, error } = await build(BASE + ',title_en,excerpt_en,body_en');
  // Kolom bahasa Inggris belum ada (22-blog-bahasa-inggris.sql belum dijalankan): muat tanpa kolom itu.
  if (error && /title_en|excerpt_en|body_en/.test(error.message || '')) ({ data, error } = await build(BASE));
  if (error) { toast('Gagal memuat artikel: ' + error.message); return; }
  state.posts = (data || []).sort((a, b) => new Date(postDate(b)) - new Date(postDate(a)));
}

async function loadReleases() {
  if (!state.isAdmin) { state.releases = []; return; }
  const { data, error } = await sb.from('blog_releases')
    .select('*')
    .order('expected_date', { ascending: true, nullsFirst: false })
    .limit(100);
  if (error) { toast('Gagal memuat jadwal: ' + error.message); return; }
  state.releases = data || [];
}

async function loadAll() {
  await Promise.all([loadPosts(), loadReleases(), loadPoll()]);
  renderAll();
}

// ---------- render daftar ----------
function setNav() {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === state.cat) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function imgOrPlaceholder(p, cls) {
  const src = safeUrl(p.cover_url);
  return src
    ? `<img class="${cls}" src="${esc(src)}" alt="" loading="lazy">`
    : `<div class="${cls} cover-ph" aria-hidden="true"></div>`;
}

function cardHtml(p) {
  return `<a class="card" href="#/a/${esc(p.slug)}">${imgOrPlaceholder(p, 'cover')}
    <div class="body">
      <div class="meta"><span class="tag t-${esc(p.category)}">${esc(CATS[p.category])}</span>
        ${p.status === 'draft' ? '<span class="tag draft">Draf</span>' : ''}
        <span>${esc(fmtDate(postDate(p)))}</span></div>
      <h3>${esc(tx(p, 'title'))}</h3>
      <p>${esc(tx(p, 'excerpt') || '')}</p>
    </div></a>`;
}

function renderList() {
  const q = state.query.trim().toLowerCase();
  const list = state.posts.filter((p) =>
    (state.cat === 'semua' || p.category === state.cat) &&
    (!q || (tx(p, 'title') + ' ' + (tx(p, 'excerpt') || '') + ' ' + p.title).toLowerCase().includes(q)));

  $('pageTitle').textContent = state.cat === 'semua' ? t('nav_home') : CATS[state.cat];
  $('pageDesc').textContent = q ? `Hasil pencarian: "${state.query.trim()}"` : CAT_DESC[state.cat];

  const featured = !q && state.cat === 'semua'
    ? (list.find((p) => p.is_featured && p.status === 'published') || list[0])
    : null;
  const rest = list.filter((p) => p !== featured);

  $('featuredWrap').innerHTML = featured ? `<a class="featured" href="#/a/${esc(featured.slug)}">
      ${imgOrPlaceholder(featured, 'cover')}
      <div class="body">
        <div class="meta"><span class="tag t-${esc(featured.category)}">${esc(CATS[featured.category])}</span>
          ${featured.status === 'draft' ? '<span class="tag draft">Draf</span>' : ''}
          <span>${esc(fmtDate(postDate(featured)))}</span></div>
        <h2>${esc(tx(featured, 'title'))}</h2>
        <p>${esc(tx(featured, 'excerpt') || '')}</p>
      </div></a>` : '';

  $('grid').innerHTML = rest.map(cardHtml).join('');
  $('emptyList').hidden = list.length > 0;
  setNav();
  renderSide();
}

function renderSide() {
  const pub = state.posts.filter((p) => p.status === 'published');
  $('ticker').hidden = !pub.length;
  $('tickerList').innerHTML = pub.slice(0, 6).map((p) => `<a href="#/a/${esc(p.slug)}">${esc(tx(p, 'title'))}</a>`).join('');
  $('sideLatest').innerHTML = pub.slice(0, 5).map((p, i) =>
    `<li><a href="#/a/${esc(p.slug)}"><b>${i + 1}</b><span>${esc(tx(p, 'title'))}</span></a></li>`).join('') || '<li class="muted">Belum ada artikel.</li>';
  const spek = pub.filter((p) => p.category === 'spek').slice(0, 3);
  const show = spek.length && state.cat === 'semua' && !state.query.trim();
  $('specPanel').hidden = !show;
  $('specList').innerHTML = show ? spek.map(cardHtml).join('') : '';
}

// ---------- jajak pendapat ----------
async function loadPoll() {
  const { data: poll } = await sb.from('blog_polls').select('id,question,options').eq('active', true)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  state.poll = poll || null; state.pollRes = []; state.myVote = null;
  if (poll) {
    const r = await sb.rpc('blog_poll_results', { p_poll: poll.id });
    state.pollRes = r.data || [];
    if (state.user) {
      const v = await sb.from('blog_poll_votes').select('option_idx').eq('poll_id', poll.id).eq('user_id', state.user.id).maybeSingle();
      state.myVote = v.data ? v.data.option_idx : null;
    }
  }
  renderPoll();
}
function renderPoll() {
  const p = state.poll; $('pollBox').hidden = !p; if (!p) return;
  const opts = Array.isArray(p.options) ? p.options : [];
  const votes = opts.map((_, i) => Number((state.pollRes.find((r) => r.option_idx === i) || {}).votes || 0));
  const total = votes.reduce((a, b) => a + b, 0);
  const pct = (i) => (total ? Math.round(votes[i] * 100 / total) : 0);
  const canVote = state.user && state.myVote === null;
  $('pollBody').innerHTML = `<p><strong>${esc(p.question)}</strong></p>` + opts.map((o, i) => canVote
    ? `<button class="btn opt" type="button" data-vote="${i}">${esc(o)}</button>`
    : `<div class="bar-r"><i style="width:${pct(i)}%"></i><span>${esc(o)}${state.myVote === i ? ' ✓' : ''}</span><span>${pct(i)}%</span></div>`).join('')
    + (state.user ? '' : '<p class="muted">Masuk untuk ikut memilih.</p>');
}

// ---------- komentar ----------
async function loadComments(postId) {
  const { data } = await sb.from('blog_comments').select('id,user_id,author_name,body,created_at')
    .eq('post_id', postId).order('created_at', { ascending: true }).limit(200);
  if (state.postId !== postId) return;
  state.comments = data || []; renderComments();
}
function renderComments() {
  const mine = (c) => state.isAdmin || (state.user && c.user_id === state.user.id);
  $('comments').innerHTML = `<h2>${t('comments')} (${state.comments.length})</h2>` + (state.user
    ? `<form id="formComment" class="cform"><textarea id="cBody" required minlength="2" maxlength="1000" placeholder="Komentar sebagai ${esc(state.name)}…"></textarea><button class="btn primary" type="submit">Kirim</button></form>`
    : `<p class="muted">Masuk untuk ikut berkomentar. <button class="btn" type="button" id="btnLoginC">Masuk / Daftar</button></p>`)
    + state.comments.map((c) => `<div class="cmt"><div class="meta"><strong>${esc(c.author_name)}</strong><span>${esc(fmtDate(c.created_at))}</span>${mine(c) ? `<button class="act del" type="button" data-del-cmt="${esc(c.id)}">Hapus</button>` : ''}</div><p>${esc(c.body)}</p></div>`).join('');
}

function showInfo(key) {
  const pg = PAGES[LANG][key];
  const nav = '<nav class="subnav">' + Object.keys(PAGES[LANG]).map((k) =>
    `<a href="#/i/${k}"${k === key ? ' class="on"' : ''}>${esc(PAGES[LANG][k].t)}</a>`).join('') + '</nav>';
  const title = pg ? pg.t : t('nopage');
  let html = nav + `<h1>${esc(title)}</h1>`;
  if (pg) {
    html += `<p class="lead">${esc(pg.lead)}</p>`;
    if (pg.stats) html += '<div class="stats">' + pg.stats.map(([n, l]) => `<div><b>${n}</b><span>${esc(l)}</span></div>`).join('') + '</div>';
    if (pg.mail && CONTACT_EMAIL && !/example\.com$/i.test(CONTACT_EMAIL)) html += `<a class="mail-card" href="mailto:${esc(CONTACT_EMAIL)}"><small>${esc(pg.mail)}</small><strong>${esc(CONTACT_EMAIL)}</strong></a>`;
    html += pg.s.map(([h, ps, us]) => `<h2>${h}</h2>` + (ps || []).map((x) => `<p>${x}</p>`).join('')
      + (us && us.length ? '<ul>' + us.map((x) => `<li>${x}</li>`).join('') + '</ul>' : '')).join('');
  }
  $('postArticle').className = 'article info';
  $('postArticle').innerHTML = html;
  $('comments').innerHTML = ''; state.postId = null;
  $('viewList').hidden = true; $('viewPost').hidden = false;
  document.title = `${title} — Smartphone Empire`;
  window.scrollTo({ top: 0 });
}

function renderReleases() {
  const section = $('releaseSection');
  section.hidden = !state.isAdmin;
  if (!state.isAdmin) return;
  const box = $('releases');
  if (!state.releases.length) { box.innerHTML = '<div class="rel-item"><small>Belum ada jadwal.</small></div>'; return; }
  box.innerHTML = state.releases.map((r) => {
    const when = r.expected_date ? fmtDate(r.expected_date, true) : (r.expected_label || 'Belum pasti');
    const src = safeUrl(r.source_url);
    return `<div class="rel-item">
      <div class="row"><strong>${esc(r.device_name)}</strong>
        <span class="tag st-${esc(r.status)}">${esc(STATUS_LABEL[r.status] || r.status)}</span></div>
      <small>${esc(r.brand || '')}${r.brand ? ' · ' : ''}${esc(when)}</small>
      ${r.notes ? `<small>${esc(r.notes)}</small>` : ''}
      <div class="row">
        ${src ? `<a href="${esc(src)}" target="_blank" rel="noopener nofollow" style="font-size:.8rem">Sumber</a>` : '<span></span>'}
        <span><button class="act" type="button" data-edit-release="${esc(r.id)}">Ubah</button>
           <button class="act del" type="button" data-del-release="${esc(r.id)}">Hapus</button></span>
      </div>
    </div>`;
  }).join('');
}

function renderAll(noTrack) {
  renderList();
  renderReleases();
  route(noTrack);
}


// ---------- terjemahan otomatis ID -> EN (Edge Function blog-translate, admin saja) ----------
async function translateRemote(src) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('Belum masuk');
  const r = await fetch(TRANSLATE_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + session.access_token, apikey: SUPABASE_KEY },
    body: JSON.stringify({ title: src.title, excerpt: src.excerpt || '', body: src.body })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || j.message || j.msg || ('HTTP ' + r.status));
  return j;
}
const trErr = (e) => (/failed to fetch|networkerror|load failed/i.test(e.message || '') ? 'fungsi blog-translate tidak terjangkau (belum di-deploy / nama salah)' : '') || ({ server_not_configured: 'kunci AI belum dipasang di server', upstream_429: 'kuota gratis sedang penuh, coba lagi beberapa menit lagi', upstream_400: 'model/kunci AI ditolak (cek GEMINI_API_KEY/GEMINI_MODEL)', upstream_403: 'kunci AI ditolak', upstream_404: 'nama model AI tidak ditemukan (cek GEMINI_MODEL)', forbidden: 'bukan admin', unauthorized: 'belum masuk' }[e.message] || e.message);
// Terjemahkan lalu simpan ke kolom *_en. Tidak mengganggu penyimpanan artikel jika gagal.
async function autoTranslatePost(id, src, quiet) {
  try {
    const tr = await translateRemote(src);
    const { error } = await sb.from('blog_posts').update({ title_en: tr.title_en, excerpt_en: tr.excerpt_en, body_en: tr.body_en }).eq('id', id);
    if (error) throw error;
    if (!quiet) toast('Versi English tersimpan.');
    return true;
  } catch (e) {
    state.lastTrErr = trErr(e) + ' [' + (e.message || e) + ']';
    if (!quiet) toast('Terjemahan otomatis gagal: ' + trErr(e));
    return false;
  }
}

// ---------- artikel ----------
function showPost(slug) {
  const p = state.posts.find((x) => x.slug === slug);
  const article = $('postArticle');
  article.className = 'article';
  if (!p) {
    article.innerHTML = `<p class="empty">${t('notfound')}</p>`;
    document.title = 'Artikel tidak ditemukan — Smartphone Empire';
  } else {
    const paragraphs = (tx(p, 'body') || '').split(/\n\s*\n/).filter((s) => s.trim())
      .map((s) => `<p>${esc(s.trim()).replace(/\n/g, '<br>')}</p>`).join('');
    const src = safeUrl(p.source_url);
    article.innerHTML = `
      <div class="meta"><span class="tag t-${esc(p.category)}">${esc(CATS[p.category])}</span>
        ${p.status === 'draft' ? '<span class="tag draft">Draf</span>' : ''}</div>
      ${LANG === 'en' && !hasEn(p) ? `<p class="lang-note">${t('only_id')}</p>` : ''}
      <h1>${esc(tx(p, 'title'))}</h1>
      ${tx(p, 'excerpt') ? `<p class="lead">${esc(tx(p, 'excerpt'))}</p>` : ''}
      <div class="meta byline"><span>${t('by')} ${esc(p.author || 'admin')}</span><span>·</span><span>${esc(fmtDate(postDate(p)))}</span></div>
      ${safeUrl(p.cover_url) ? `<img class="cover" src="${esc(safeUrl(p.cover_url))}" alt="" style="margin-top:24px">` : ''}
      <div class="content">${paragraphs}</div>
      ${src ? `<p class="source">${t('source')} <a href="${esc(src)}" target="_blank" rel="noopener nofollow">${esc(src)}</a></p>` : ''}
      ${state.isAdmin ? `<div class="actions"><button class="btn" type="button" data-edit-post="${esc(p.id)}">Ubah artikel</button></div>` : ''}`;
    document.title = `${tx(p, 'title')} — Smartphone Empire`;
  }
  state.postId = p ? p.id : null;
  if (p) loadComments(p.id); else $('comments').innerHTML = '';
  $('viewList').hidden = true;
  $('viewPost').hidden = false;
  window.scrollTo({ top: 0 });
}

function showList() {
  $('viewPost').hidden = true;
  $('viewList').hidden = false;
  const label = state.cat === 'semua' ? t('nav_home') : CATS[state.cat];
  document.title = `${label} — Smartphone Empire`;
}

// ---------- statistik pengunjung (tanpa IP; admin tidak dihitung) ----------
function track(slug, path) {
  if (state.isAdmin) return;
  try {
    const k = 'v:' + path; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1');
    let sid = localStorage.getItem('blog-sid');
    if (!sid) { sid = (crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now().toString(36))); localStorage.setItem('blog-sid', sid); }
    let ref = ''; try { const h = new URL(document.referrer).hostname; if (h && h !== location.hostname) ref = h.replace(/^www\./, ''); } catch (e) {}
    const w = innerWidth, device = w < 700 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
    sb.rpc('blog_track', { p_slug: slug, p_path: path, p_sid: sid, p_ref: ref || null, p_device: device }).then(() => {}, () => {});
  } catch (e) {}
}

// Rute: #/ (beranda), #/k/<kategori>, #/a/<slug>
function route(noTrack) {
  const inf = /^#\/i\/(\w+)$/.exec(location.hash);
  if (inf) { showInfo(inf[1]); return; }
  const art = /^#\/a\/(.+)$/.exec(location.hash);
  if (art) { showPost(decodeURIComponent(art[1])); if (noTrack !== true) track(decodeURIComponent(art[1]), '/a/' + decodeURIComponent(art[1])); return; }
  const cat = /^#\/k\/(\w+)$/.exec(location.hash);
  const next = cat && CATS[cat[1]] ? cat[1] : 'semua';
  if (next !== state.cat) { state.cat = next; renderList(); }
  showList();
  setNav();
  if (noTrack !== true) track(null, '/');
}

// ---------- pencarian ----------
$('search').addEventListener('input', (e) => {
  state.query = e.target.value;
  if ($('viewList').hidden) location.hash = '#/';  // mengetik di halaman artikel kembali ke daftar
  renderList();
});

// ---------- form artikel manual ----------
function openPostDialog(post = null) {
  state.editingPostId = post ? post.id : null;
  $('postDlgTitle').textContent = post ? 'Ubah artikel' : 'Tulis artikel';
  $('pTitle').value = post?.title || '';
  $('pSlug').value = post?.slug || '';
  $('pCat').value = post?.category || 'rilis';
  $('pExcerpt').value = post?.excerpt || '';
  $('pBody').value = post?.body || '';
  $('pTitleEn').value = post?.title_en || '';
  $('pExcerptEn').value = post?.excerpt_en || '';
  $('pBodyEn').value = post?.body_en || '';
  $('pEnBox').open = !!(post?.title_en || post?.body_en);
  $('pCover').value = '';
  $('pSource').value = post?.source_url || '';
  $('pAuthor').value = post?.author || loadAuthors()[0] || 'admin';
  renderAuthorChips('pAuthorChips', 'pAuthor');
  $('pFeatured').checked = !!post?.is_featured;
  setTimeout(refreshPostQuality, 0);
  $('pStatus').value = post?.status || 'published';
  $('btnDeletePost').hidden = !post;
  $('postStatus').textContent = '';
  $('dlgPost').showModal();
}

$('pTitle').addEventListener('input', () => {
  if (!state.editingPostId && !$('pSlug').dataset.touched) $('pSlug').value = slugify($('pTitle').value);
});
$('pSlug').addEventListener('input', () => { $('pSlug').dataset.touched = '1'; });

async function uploadCover(file) {
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Ukuran gambar maksimal 5 MB.');
  const path = `${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

$('formPost').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('btnSavePost');
  btn.disabled = true; $('postStatus').textContent = 'Menyimpan…';
  try {
    const author = cleanAuthor($('pAuthor').value); rememberAuthor(author);
    const payload = {
      author,
      title: $('pTitle').value.trim(),
      slug: ($('pSlug').value.trim() || slugify($('pTitle').value)).toLowerCase(),
      category: $('pCat').value,
      excerpt: $('pExcerpt').value.trim() || null,
      body: $('pBody').value.trim(),
      title_en: $('pTitleEn').value.trim() || null,
      excerpt_en: $('pExcerptEn').value.trim() || null,
      body_en: $('pBodyEn').value.trim() || null,
      source_url: $('pSource').value.trim() || null,
      is_featured: $('pFeatured').checked,
      status: $('pStatus').value
    };
    const file = $('pCover').files[0];
    if (file) payload.cover_url = await uploadCover(file);
    else if (state.editingPostId) {
      const cur = state.posts.find((p) => p.id === state.editingPostId);
      payload.cover_url = cur?.cover_url || null;
    } else payload.cover_url = null;

    // Hanya satu artikel utama: lepas tanda utama dari artikel lain.
    if (payload.is_featured) {
      let un = sb.from('blog_posts').update({ is_featured: false }).eq('is_featured', true);
      if (state.editingPostId) un = un.neq('id', state.editingPostId);
      await un;
    }

    const res = state.editingPostId
      ? await sb.from('blog_posts').update(payload).eq('id', state.editingPostId).select('id,slug').single()
      : await sb.from('blog_posts').insert(payload).select('id,slug').single();
    if (res.error) throw res.error;

    $('dlgPost').close();
    toast('Artikel tersimpan.');
    if (!payload.title_en && payload.body) { toast('Menerjemahkan ke English…'); await autoTranslatePost(res.data.id, payload); }
    await loadPosts(); renderAll();
    if (payload.status === 'published') location.hash = '#/a/' + res.data.slug;
  } catch (err) {
    const dup = /duplicate key|unique/i.test(err.message || '');
    $('postStatus').textContent = dup ? 'Slug sudah dipakai artikel lain. Ganti slug-nya.' : 'Gagal menyimpan: ' + (err.message || err);
  } finally {
    btn.disabled = false;
  }
});

$('btnDeletePost').addEventListener('click', async () => {
  if (!state.editingPostId || !confirm('Hapus artikel ini secara permanen?')) return;
  const { error } = await sb.from('blog_posts').delete().eq('id', state.editingPostId);
  if (error) { $('postStatus').textContent = 'Gagal menghapus: ' + error.message; return; }
  $('dlgPost').close();
  toast('Artikel dihapus.');
  await loadPosts(); renderAll();
  location.hash = '#/';
});

// ---------- tempel artikel dari AI ----------
// Memisahkan judul, ringkasan, dan isi dari teks mentah. Baris pertama = judul.
function parseAiArticle(raw) {
  let text = (raw || '').replace(/\r\n?/g, '\n').trim();
  text = text.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  const lines = text.split('\n');
  const plain = (s) => s.replace(/\*\*/g, '').replace(/__/g, '').trim();
  let i = 0;
  // Lewati baris kosong dan pemisah (---).
  while (i < lines.length && (!lines[i].trim() || /^(-{3,}|\*{3,})$/.test(lines[i].trim()))) i++;

  let title = '';
  if (i < lines.length) {
    const first = plain(lines[i].trim().replace(/^#{1,6}\s*/, ''));
    const m = /^(?:judul|title)\s*[:：]\s*(.+)$/i.exec(first);
    title = (m ? m[1] : first).trim();
    i++;
  }

  // Ringkasan eksplisit: baris "Ringkasan: ..." dalam beberapa baris pertama isi.
  let excerpt = '';
  for (let k = i; k < Math.min(lines.length, i + 4); k++) {
    const m = /^(?:ringkasan|excerpt|deskripsi)\s*[:：]\s*(.+)$/i.exec(plain(lines[k].trim().replace(/^[-*]\s+/, '')));
    if (m) { excerpt = m[1].trim(); lines.splice(k, 1); break; }
  }

  // Bersihkan markdown dari isi.
  let body = lines.slice(i).map((ln) => {
    let s = ln.replace(/^\s*#{1,6}\s*/, '')
              .replace(/^\s*[-*+]\s+/, '• ')
              .replace(/\*\*(.+?)\*\*/g, '$1')
              .replace(/__(.+?)__/g, '$1')
              .replace(/\*(\S(?:.*?\S)?)\*/g, '$1')
              .replace(/`([^`]+)`/g, '$1');
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(s)) s = '';
    return s.replace(/\s+$/, '');
  }).join('\n').replace(/\n{3,}/g, '\n\n').trim();

  // Ringkasan otomatis: paragraf pertama, dipotong di batas kata.
  if (!excerpt && body) {
    const first = body.split(/\n\s*\n/)[0].replace(/\n/g, ' ').trim();
    excerpt = first.length > 180 ? first.slice(0, 180).replace(/\s+\S*$/, '') + '…' : first;
  }
  return { title, excerpt, body };
}

const AUTHOR_KEY = 'blog-authors', DRAFT_KEY = 'blog-ai-draft';
function loadAuthors() { try { const a = JSON.parse(localStorage.getItem(AUTHOR_KEY) || '[]'); return Array.isArray(a) ? a.filter((x) => typeof x === 'string' && x) : []; } catch (e) { return []; } }
function rememberAuthor(n) { if (!n || n === 'admin') return; try { localStorage.setItem(AUTHOR_KEY, JSON.stringify([n, ...loadAuthors().filter((x) => x !== n)].slice(0, 8))); } catch (e) {} }
function cleanAuthor(v) { return String(v || '').replace(/\s+/g, ' ').trim().slice(0, 60) || 'admin'; }
function renderAuthorChips(boxId, inputId) {
  const box = $(boxId), input = $(inputId); box.textContent = '';
  ['admin', ...loadAuthors()].forEach((n) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = n;
    b.setAttribute('aria-pressed', String(cleanAuthor(input.value) === n));
    b.addEventListener('click', () => { input.value = n; input.dispatchEvent(new Event('input')); });
    box.appendChild(b);
  });
}
$('aiAuthor').addEventListener('input', () => renderAuthorChips('aiAuthorChips', 'aiAuthor'));
$('pAuthor').addEventListener('input', () => renderAuthorChips('pAuthorChips', 'pAuthor'));

let aiParsed = { title: '', excerpt: '', body: '' };
const aiTouched = { title: false, excerpt: false };
let aiRumorAck = false;
let aiQualAck = false;
let aiQualRes = null;
function refreshAiPreview() {
  aiParsed = parseAiArticle($('aiRaw').value);
  if (!aiTouched.title) $('aiTitle').value = aiParsed.title;
  if (!aiTouched.excerpt) $('aiExcerpt').value = aiParsed.excerpt;
  $('aiTitleCount').textContent = $('aiTitle').value.length + '/200';
  $('aiExcerptCount').textContent = $('aiExcerpt').value.length + '/300';
  const words = aiParsed.body ? aiParsed.body.split(/\s+/).length : 0;
  const paras = aiParsed.body ? aiParsed.body.split(/\n\s*\n/).length : 0;
  $('aiPreview').textContent = words
    ? `Terdeteksi: ${paras} paragraf, ${words} kata (±${Math.max(1, Math.round(words / 200))} menit baca), penulis ${cleanAuthor($('aiAuthor').value)}.`
    : 'Belum ada teks.';
  aiQualRes = words ? assessPost({
    title: $('aiTitle').value, excerpt: $('aiExcerpt').value, body: aiParsed.body, category: $('aiCat').value,
    source_url: $('aiSource').value.trim(), hasCover: !!$('aiCover').files[0], author: $('aiAuthor').value, status: 'published'
  }, state.posts) : null;
  renderQuality($('aiQuality'), aiQualRes);
}
function syncAiStatus() { $('btnSavePaste').textContent = $('aiStatus').value === 'published' ? 'Terbitkan artikel' : 'Simpan draf'; }
$('aiRaw').addEventListener('input', () => { aiQualAck = false; refreshAiPreview(); try { localStorage.setItem(DRAFT_KEY, $('aiRaw').value); } catch (e) {} });
$('aiTitle').addEventListener('input', () => { aiTouched.title = true; refreshAiPreview(); });
$('aiExcerpt').addEventListener('input', () => { aiTouched.excerpt = true; refreshAiPreview(); });
$('aiAuthor').addEventListener('input', refreshAiPreview);
$('aiStatus').addEventListener('change', syncAiStatus);
$('aiCat').addEventListener('change', () => { aiRumorAck = false; aiQualAck = false; refreshAiPreview(); });
$('aiSource').addEventListener('input', () => { aiRumorAck = false; refreshAiPreview(); });
$('aiCover').addEventListener('change', refreshAiPreview);
$('aiClear').addEventListener('click', () => {
  $('aiRaw').value = ''; aiTouched.title = aiTouched.excerpt = false; refreshAiPreview();
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
  $('aiStatusLine').textContent = '';
});

$('btnAiClean').addEventListener('click', () => {
  const r = autoClean($('aiRaw').value);
  if (!r.changes.length) { $('aiStatusLine').textContent = 'Tidak ada yang perlu dirapikan.'; return; }
  $('aiRaw').value = r.text;
  aiTouched.title = aiTouched.excerpt = false; aiQualAck = false;
  try { localStorage.setItem(DRAFT_KEY, r.text); } catch (e) {}
  refreshAiPreview();
  $('aiStatusLine').textContent = 'Dirapikan: ' + r.changes.join(', ') + '.';
});

function openPasteDialog() {
  let draft = '';
  try { draft = localStorage.getItem(DRAFT_KEY) || ''; } catch (e) {}
  $('aiRaw').value = draft;
  aiTouched.title = aiTouched.excerpt = false; aiRumorAck = false; aiQualAck = false;
  $('aiAuthor').value = loadAuthors()[0] || 'admin';
  renderAuthorChips('aiAuthorChips', 'aiAuthor');
  $('aiCover').value = ''; $('aiSource').value = '';
  $('aiCat').value = 'rilis';
  $('aiStatus').value = 'published';
  $('aiFeatured').checked = false;
  syncAiStatus(); refreshAiPreview();
  $('aiStatusLine').textContent = draft ? 'Draf terakhir dipulihkan. Tekan Kosongkan untuk mulai baru.' : '';
  $('dlgPaste').showModal();
}

$('formPaste').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = $('aiTitle').value.trim();
  const body = aiParsed.body;
  const source = $('aiSource').value.trim();
  const file = $('aiCover').files[0];
  const line = $('aiStatusLine');
  if (!title) { line.textContent = 'Judul kosong.'; return; }
  if (!body) { line.textContent = 'Isi artikel kosong.'; return; }
  if (source && !/^https?:\/\//i.test(source)) { line.textContent = 'Link sumber harus diawali http:// atau https://.'; return; }
  if ($('aiCat').value === 'rumor' && !source && !aiRumorAck) {
    aiRumorAck = true;
    line.textContent = 'Rumor sebaiknya mencantumkan link sumber. Tekan tombol sekali lagi untuk tetap menyimpan.';
    return;
  }
  if ($('aiStatus').value === 'published' && aiQualRes && aiQualRes.score < 60 && !aiQualAck) {
    aiQualAck = true;
    line.textContent = `Kualitas rendah (skor ${aiQualRes.score}/100). Perbaiki dulu, atau tekan sekali lagi untuk tetap menerbitkan.`;
    return;
  }
  const btn = $('btnSavePaste');
  btn.disabled = true; line.textContent = 'Menyimpan…';
  const author = cleanAuthor($('aiAuthor').value);
  try {
    const payload = {
      title,
      slug: slugify(title) || 'artikel-' + Date.now().toString(36),
      category: $('aiCat').value,
      excerpt: $('aiExcerpt').value.trim() || null,
      body,
      author,
      source_url: source || null,
      cover_url: file ? await uploadCover(file) : null,
      is_featured: $('aiFeatured').checked,
      status: $('aiStatus').value
    };
    if (payload.is_featured) await sb.from('blog_posts').update({ is_featured: false }).eq('is_featured', true);
    let res = await sb.from('blog_posts').insert(payload).select('id,slug').single();
    // Slug bentrok: tambahkan akhiran dan coba sekali lagi.
    if (res.error && /duplicate key|unique/i.test(res.error.message || '')) {
      payload.slug = payload.slug.slice(0, 70) + '-' + Date.now().toString(36).slice(-4);
      res = await sb.from('blog_posts').insert(payload).select('id,slug').single();
    }
    if (res.error) throw res.error;
    rememberAuthor(author);
    try { localStorage.removeItem(DRAFT_KEY); } catch (e2) {}
    $('dlgPaste').close();
    toast(payload.status === 'published' ? 'Artikel terbit.' : 'Draf tersimpan.');
    toast('Menerjemahkan ke English…'); await autoTranslatePost(res.data.id, payload);
    await loadPosts(); renderAll();
    if (payload.status === 'published') location.hash = '#/a/' + res.data.slug;
  } catch (err) {
    line.textContent = 'Gagal menyimpan: ' + (err.message || err);
  } finally {
    btn.disabled = false;
  }
});

// ---------- form jadwal rilis (admin) ----------
function openReleaseDialog(rel = null) {
  state.editingReleaseId = rel ? rel.id : null;
  $('relDlgTitle').textContent = rel ? 'Ubah jadwal rilis' : 'Tambah jadwal rilis';
  $('rName').value = rel?.device_name || '';
  $('rBrand').value = rel?.brand || '';
  $('rStatus').value = rel?.status || 'rumor';
  $('rDate').value = rel?.expected_date || '';
  $('rLabel').value = rel?.expected_label || '';
  $('rSource').value = rel?.source_url || '';
  $('rNotes').value = rel?.notes || '';
  $('btnDeleteRelease').hidden = !rel;
  $('relStatus').textContent = '';
  $('dlgRelease').showModal();
}

$('formRelease').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('btnSaveRelease');
  btn.disabled = true; $('relStatus').textContent = 'Menyimpan…';
  const payload = {
    device_name: $('rName').value.trim(),
    brand: $('rBrand').value.trim() || null,
    status: $('rStatus').value,
    expected_date: $('rDate').value || null,
    expected_label: $('rLabel').value.trim() || null,
    source_url: $('rSource').value.trim() || null,
    notes: $('rNotes').value.trim() || null
  };
  const res = state.editingReleaseId
    ? await sb.from('blog_releases').update(payload).eq('id', state.editingReleaseId)
    : await sb.from('blog_releases').insert(payload);
  btn.disabled = false;
  if (res.error) { $('relStatus').textContent = 'Gagal menyimpan: ' + res.error.message; return; }
  $('dlgRelease').close();
  toast('Jadwal tersimpan.');
  await loadReleases(); renderReleases();
});

$('btnDeleteRelease').addEventListener('click', async () => {
  if (!state.editingReleaseId || !confirm('Hapus jadwal ini?')) return;
  const { error } = await sb.from('blog_releases').delete().eq('id', state.editingReleaseId);
  if (error) { $('relStatus').textContent = 'Gagal menghapus: ' + error.message; return; }
  $('dlgRelease').close();
  toast('Jadwal dihapus.');
  await loadReleases(); renderReleases();
});

// ---------- login / logout ----------
let authMode = 'login';
function setAuthMode(m) {
  authMode = m;
  document.querySelectorAll('#formLogin [data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
  $('loginTitle').textContent = { login: 'Masuk', signup: 'Daftar akun', reset: 'Reset password' }[m];
  $('btnDoLogin').textContent = { login: 'Masuk', signup: 'Buat akun', reset: 'Kirim tautan' }[m];
  $('loginPassWrap').hidden = m === 'reset';
  $('loginPass').required = m !== 'reset';
  $('loginPass').minLength = m === 'signup' ? 6 : 0;
  $('loginPass').autocomplete = m === 'signup' ? 'new-password' : 'current-password';
  $('loginStatus').textContent = '';
}
// Login pembaca (dari komentar/jajak pendapat): ada tab Daftar.
function openLogin() {
  window.__adminLogin = false;
  $('loginTabs').hidden = false; $('btnForgot').hidden = false;
  $('loginHint').textContent = 'Pakai akun yang sama dengan game Smartphone Empire.';
  setAuthMode('login'); $('dlgLogin').showModal();
}

function authMsg(e) {
  const m = String(e?.message || '').toLowerCase();
  if (m.includes('invalid login')) return 'Email atau password salah.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Email sudah terdaftar. Silakan masuk.';
  if (m.includes('not confirmed')) return 'Email belum dikonfirmasi. Cek kotak masuk Anda.';
  if (m.includes('password should')) return 'Password minimal 6 karakter.';
  if (m.includes('rate limit') || e?.status === 429) return 'Terlalu banyak percobaan. Coba lagi nanti.';
  return 'Gagal: ' + (e?.message || e);
}
$('btnForgot').addEventListener('click', () => setAuthMode('reset'));
document.querySelectorAll('#formLogin [data-mode]').forEach((b) => b.addEventListener('click', () => setAuthMode(b.dataset.mode)));
$('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('loginEmail').value.trim(), pass = $('loginPass').value, st = $('loginStatus'), btn = $('btnDoLogin');
  const back = location.href.split('#')[0];
  btn.disabled = true; st.textContent = 'Memeriksa…';
  try {
    if (authMode === 'reset') {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: back });
      if (error) throw error;
      st.textContent = 'Tautan reset dikirim ke email Anda.';
    } else if (authMode === 'signup') {
      const { data, error } = await sb.auth.signUp({ email, password: pass, options: { emailRedirectTo: back } });
      if (error) throw error;
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw { message: 'already registered' };
      if (data.session) { $('dlgLogin').close(); toast('Akun dibuat. Selamat datang!'); }
      else st.textContent = 'Cek email Anda untuk konfirmasi, lalu masuk.';
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      $('loginPass').value = '';
      if (window.__adminLogin) {
        const a = await sb.rpc('is_admin');
        if (a.error || a.data !== true) {
          await sb.auth.signOut();
          st.textContent = 'Akun ini bukan admin.';
          return;
        }
        $('dlgLogin').close(); toast('Masuk sebagai admin.');
      } else { $('dlgLogin').close(); toast('Berhasil masuk.'); }
    }
  } catch (err) { st.textContent = authMsg(err); }
  finally { btn.disabled = false; }
});
$('btnLogout2').addEventListener('click', async () => { await sb.auth.signOut(); toast('Sudah keluar.'); });

document.addEventListener('click', async (e) => {
  if (e.target.closest('#btnLoginC')) { openLogin(); return; }
  const v = e.target.closest('[data-vote]');
  if (v) {
    if (!state.user) { openLogin(); return; }
    const { error } = await sb.from('blog_poll_votes').insert({ poll_id: state.poll.id, option_idx: +v.dataset.vote });
    if (error) toast('Gagal memilih.'); else { toast('Terima kasih sudah memilih.'); loadPoll(); }
    return;
  }
  const d = e.target.closest('[data-del-cmt]');
  if (d && confirm('Hapus komentar ini?')) {
    const { error } = await sb.from('blog_comments').delete().eq('id', d.dataset.delCmt);
    if (error) toast('Gagal menghapus.'); else loadComments(state.postId);
  }
});
document.addEventListener('submit', async (e) => {
  if (e.target.id !== 'formComment') return;
  e.preventDefault();
  const body = $('cBody').value.trim(); if (body.length < 2) return;
  const { error } = await sb.from('blog_comments').insert({ post_id: state.postId, body });
  if (error) { toast('Gagal mengirim komentar.'); return; }
  toast('Komentar terkirim.'); loadComments(state.postId);
});
$('btnLogout').addEventListener('click', async () => { await sb.auth.signOut(); toast('Sudah keluar.'); });

// Penting: jangan memanggil Supabase (getSession, rpc, from) langsung di dalam callback ini.
// Callback berjalan di dalam kunci auth, jadi signInWithPassword bisa macet selamanya
// ("Memeriksa…"). Tunda dengan setTimeout agar kunci sudah dilepas.
sb.auth.onAuthStateChange((event) => {
  if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return;
  setTimeout(async () => { await refreshAuth(); await loadAll(); }, 0);
});

// ---------- interaksi umum ----------
$('btnNewPost').addEventListener('click', () => openPostDialog());
$('btnPaste').addEventListener('click', () => openPasteDialog());
$('btnNewRelease').addEventListener('click', () => openReleaseDialog());
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', (e) => e.target.closest('dialog').close()));
window.addEventListener('hashchange', () => route());

document.addEventListener('click', (e) => {
  const edP = e.target.closest('[data-edit-post]');
  if (edP) { openPostDialog(state.posts.find((p) => p.id === edP.dataset.editPost)); return; }
  const edR = e.target.closest('[data-edit-release]');
  if (edR) { openReleaseDialog(state.releases.find((r) => r.id === edR.dataset.editRelease)); return; }
  const delR = e.target.closest('[data-del-release]');
  if (delR && confirm('Hapus jadwal ini?')) {
    sb.from('blog_releases').delete().eq('id', delR.dataset.delRelease)
      .then(({ error }) => { if (error) toast('Gagal menghapus: ' + error.message); else { toast('Jadwal dihapus.'); loadReleases().then(renderReleases); } });
  }
});

// ---------- mulai ----------
// Elemen yang bergantung pada config.js: iklan dan tautan sosial hanya tampil bila diisi.
function initConfigured() {
  const ad = $('adBox'); if (ad) ad.hidden = !SHOW_ADS;
  const box = $('footSocial'); if (!box) return;
  const items = [['x', 'X'], ['instagram', 'Instagram'], ['youtube', 'YouTube']]
    .filter(([k]) => /^https:\/\//.test(SOCIAL[k] || ''));
  box.innerHTML = items.map(([k, n]) => `<a href="${esc(SOCIAL[k])}" target="_blank" rel="noopener">${n}</a>`).join('');
}

(async function init() {
  initConfigured();
  applyLang(true);
  await refreshAuth();
  await loadAll();
})();

// Tombol di editor: isi kolom English dari teks Indonesia (bisa disunting sebelum disimpan).
$('btnTranslateFill').addEventListener('click', async () => {
  const btn = $('btnTranslateFill'), st = $('postStatus');
  const src = { title: $('pTitle').value.trim(), excerpt: $('pExcerpt').value.trim(), body: $('pBody').value.trim() };
  if (!src.title || !src.body) { st.textContent = 'Isi judul dan isi artikel Indonesia dulu.'; return; }
  btn.disabled = true; st.textContent = 'Menerjemahkan…';
  try {
    const tr = await translateRemote(src);
    $('pTitleEn').value = tr.title_en || ''; $('pExcerptEn').value = tr.excerpt_en || ''; $('pBodyEn').value = tr.body_en || '';
    st.textContent = 'Terjemahan terisi. Periksa lalu klik Simpan.';
  } catch (e) { st.textContent = 'Gagal menerjemahkan: ' + trErr(e); }
  finally { btn.disabled = false; }
});

// Tombol panel admin: terjemahkan semua artikel yang belum punya versi English.
$('btnTranslateAll').addEventListener('click', async () => {
  const todo = state.posts.filter((p) => !p.title_en && p.body);
  if (!todo.length) { toast('Semua artikel sudah punya versi English.'); return; }
  if (!confirm(`Terjemahkan ${todo.length} artikel ke English dengan AI?`)) return;
  let ok = 0;
  for (let i = 0; i < todo.length; i++) {
    toast(`Menerjemahkan ${i + 1}/${todo.length}…`);
    if (await autoTranslatePost(todo[i].id, todo[i], true)) ok++;
    if (i < todo.length - 1) await new Promise((r) => setTimeout(r, 6000)); // jaga batas kuota gratis
  }
  await loadPosts(); renderAll();
  toast(`Selesai: ${ok}/${todo.length} artikel diterjemahkan.`);
  if (ok < todo.length) alert(`Berhasil ${ok} dari ${todo.length} artikel.\n\nPenyebab gagal terakhir:\n${state.lastTrErr}`);
});


// ---------- audit kualitas semua artikel ----------
function renderAudit() {
  const only = $('auditOnlyLow').checked;
  const rows = state.posts.map((p) => ({ p, r: assessPost(p, state.posts) })).sort((a, b) => a.r.score - b.r.score);
  const low = rows.filter((x) => x.r.score < 80).length;
  $('auditSummary').textContent = `${rows.length} artikel diperiksa: ${rows.length - low} baik, ${low} perlu perhatian.`;
  const shown = only ? rows.filter((x) => x.r.score < 80) : rows;
  $('auditList').innerHTML = shown.length ? shown.map(({ p, r }) => `
    <div class="audit-row q-${r.level}">
      <div class="audit-top"><span class="audit-score">${r.score}</span><b>${esc(p.title)}</b></div>
      <small>${esc(CATS[p.category] || p.category)}${p.status === 'draft' ? ' · draf' : ''}</small>
      <ul>${r.issues.slice(0, 4).map((x) => `<li>${esc(x.text)}</li>`).join('')}</ul>
      <button class="btn" type="button" data-edit="${esc(p.id)}">Ubah artikel</button>
    </div>`).join('') : '<p class="hint">Semua artikel sudah baik. 🎉</p>';
}
$('btnAudit').addEventListener('click', () => { renderAudit(); $('dlgAudit').showModal(); });
$('auditOnlyLow').addEventListener('change', renderAudit);
$('auditList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-edit]'); if (!b) return;
  const post = state.posts.find((x) => String(x.id) === b.dataset.edit); if (!post) return;
  $('dlgAudit').close(); openPostDialog(post);
});
