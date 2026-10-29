// Membuat halaman statis per artikel (a/<slug>/index.html), per kategori (k/<kategori>/index.html), sitemap.xml, dan robots.txt
// agar artikel bisa diindeks Google. Dijalankan dari ROOT repo:  node tools/build-artikel.mjs
// Hanya membaca artikel berstatus "published" lewat kunci publishable (aman, sama seperti di blog).
// Uji tanpa jaringan: node tools/build-artikel.mjs --dari-file data.json
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import path from 'node:path';

const SITE = 'https://smartphone-empire.my.id';
const OUT = 'a';
const KOUT = 'k';
let KATEGORI_ADA = new Set(); // kategori yang punya halaman statis /k/<kat>/ (diisi setelah artikel dimuat)
const catHref = (c) => (KATEGORI_ADA.has(c) ? `/${KOUT}/${c}/` : `/${KOUT}/${c}/`);
const menuHtml = () => `<a href="/">Beranda</a>${Object.entries(CATS).map(([k, v]) => `<a href="${catHref(k)}">${v}</a>`).join('')}`;
const cfg = await readFile('blog/js/config.js', 'utf8');
const pick = (k) => (cfg.match(new RegExp(`export const ${k}\\s*=\\s*'([^']*)'`)) || [])[1] || '';
const SUPABASE_URL = pick('SUPABASE_URL'), SUPABASE_KEY = pick('SUPABASE_KEY'), TZ = pick('TZ') || 'Asia/Jakarta';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeHttps = (u) => (/^https:\/\//.test(u || '') ? u : '');
const CATS = { rilis: 'Rilis', spek: 'Spek', rumor: 'Rumor', jadwal: 'Jadwal' };
const readMin = (t) => Math.max(1, Math.round(String(t || '').split(/\s+/).filter(Boolean).length / 200));
const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });

async function loadPosts() {
  const i = process.argv.indexOf('--dari-file');
  if (i > 0) return JSON.parse(await readFile(process.argv[i + 1], 'utf8'));
  const url = `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,title,category,excerpt,body,cover_url,source_url,author,published_at,created_at,updated_at&status=eq.published&order=published_at.desc&limit=1000`;
  const r = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.json();
}

const siteHeader = () => `<header class="site-header"><div class="bar">
  <a class="brand" href="/"><span class="brand-mark" aria-hidden="true"></span><span>Smartphone Empire</span></a>
  <nav class="menu" aria-label="Kategori">${menuHtml()}</nav>
  <div class="tools"><button class="icon-btn" id="themeToggle" type="button" aria-label="Ganti tema terang/gelap" title="Ganti tema"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></button><a class="cta-game" href="/game/"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><span>Main game</span></a></div>
</div></header>`;
const siteFooter = () => `<footer class="site-footer"><div class="copy"><span>© ${new Date().getFullYear()} Jurkon Studio</span><span class="flinks"><a href="/i/tentang/">Tentang Kami</a><a href="/i/redaksi/">Redaksi</a><a href="/i/etik/">Kode Etik</a><a href="/i/privasi/">Privasi</a><a href="/i/kontak/">Kontak</a></span></div></footer>`;
const PAGE_JS = `<script>(function(){var b=document.getElementById('themeToggle');if(b)b.addEventListener('click',function(){var r=document.documentElement,d=r.getAttribute('data-theme')?r.getAttribute('data-theme')==='dark':matchMedia('(prefers-color-scheme: dark)').matches,n=d?'light':'dark';r.setAttribute('data-theme',n);try{localStorage.setItem('blog-theme',n)}catch(e){}});var c=document.getElementById('copyLink');if(c)c.addEventListener('click',function(){var u=c.dataset.url,t=c.textContent;function ok(){c.textContent='Tautan disalin';setTimeout(function(){c.textContent=t},1800)}if(navigator.clipboard)navigator.clipboard.writeText(u).then(ok,function(){prompt('Salin tautan:',u)});else prompt('Salin tautan:',u)})})();</script>`;

function page(p, all = []) {
  const canonical = `${SITE}/${OUT}/${p.slug}/`;
  const published = p.published_at || p.created_at;
  const paras = (p.body || '').split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const desc = (p.excerpt || paras[0] || p.title).replace(/\s+/g, ' ').slice(0, 155);
  const img = safeHttps(p.cover_url) || `${SITE}/game/assets/img/landing/pasar.jpg`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'NewsArticle', headline: p.title.slice(0, 110), description: desc,
    image: [img], datePublished: published, dateModified: p.updated_at || published, mainEntityOfPage: canonical,
    author: { '@type': 'Person', name: p.author || 'Redaksi' },
    publisher: { '@type': 'Organization', name: 'Smartphone Empire Berita', logo: { '@type': 'ImageObject', url: `${SITE}/blog/img/logo.svg` } }
  };
  const cat = CATS[p.category] || p.category;
  const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Beranda', item: `${SITE}/` },
    { '@type': 'ListItem', position: 2, name: cat, item: KATEGORI_ADA.has(p.category) ? `${SITE}/${KOUT}/${p.category}/` : `${SITE}/${KOUT}/${p.category}/` },
    { '@type': 'ListItem', position: 3, name: p.title.slice(0, 110), item: canonical }] };
  const others = all.filter((x) => x.slug !== p.slug);
  const related = [...others.filter((x) => x.category === p.category), ...others.filter((x) => x.category !== p.category)].slice(0, 3);
  const shareUrl = encodeURIComponent(canonical), shareTxt = encodeURIComponent(p.title);
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(p.title)} | Smartphone Empire</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/game/assets/icon/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Smartphone Empire Berita">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${esc(img)}">
<meta property="article:published_time" content="${esc(published)}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<script type="application/ld+json">${JSON.stringify(crumbLd).replace(/</g, '\\u003c')}</script>
<meta name="theme-color" content="#0a84ff">
<script>(function(){try{var t=localStorage.getItem('blog-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
<link rel="stylesheet" href="/blog/css/blog.css?v=10">
<link rel="stylesheet" href="/blog/css/blog-polish.css?v=2">
</head>
<body>
<a class="skip" href="#main">Lewati ke konten</a>
${siteHeader()}
<main id="main">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Beranda</a><span aria-hidden="true">/</span><a href="${catHref(p.category)}">${esc(cat)}</a></nav>
  <article class="article">
    <div class="meta"><span class="tag t-${esc(p.category)}">${esc(cat)}</span></div>
    <h1>${esc(p.title)}</h1>
    ${p.excerpt ? `<p class="lead">${esc(p.excerpt)}</p>` : ''}
    <div class="meta byline"><span>Ditulis oleh ${esc(p.author || 'admin')}</span><time datetime="${esc(published)}">${esc(fmtDate(published))}</time><span>${readMin(p.body)} menit baca</span></div>
    ${safeHttps(p.cover_url) ? `<img class="cover" src="${esc(p.cover_url)}" alt="${esc(p.title)}" width="1200" height="675" decoding="async" style="margin-top:20px">` : ''}
    <div class="content">${paras.map((s) => `<p>${esc(s).replace(/\n/g, '<br>')}</p>`).join('\n')}</div>
    ${safeHttps(p.source_url) ? `<p class="source">Sumber: <a href="${esc(p.source_url)}" rel="noopener nofollow" target="_blank">${esc(p.source_url)}</a></p>` : ''}
    <div class="share"><span>Bagikan</span>
      <a class="btn" href="https://wa.me/?text=${shareTxt}%20${shareUrl}" target="_blank" rel="noopener">WhatsApp</a>
      <a class="btn" href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener">Facebook</a>
      <button class="btn" type="button" id="copyLink" data-url="${esc(canonical)}">Salin tautan</button></div>
    <p class="source"><a href="/baca/${esc(p.slug)}/">Buka versi interaktif (komentar dan jajak pendapat)</a></p>
  </article>
  ${related.length ? `<aside class="related" aria-labelledby="relT"><h2 id="relT">Baca juga</h2>${related.map((x) => `<a href="/${OUT}/${esc(x.slug)}/">${esc(x.title)}<small>${esc(CATS[x.category] || x.category)} · ${esc(fmtDate(x.published_at || x.created_at))}</small></a>`).join('')}</aside>` : ''}
</main>
${siteFooter()}
${PAGE_JS}
</body>
</html>
`;
}


function categoryPage(cat, list) {
  const name = CATS[cat], canonical = `${SITE}/${KOUT}/${cat}/`;
  const desc = `${name}: ${list.length} artikel smartphone dan gadget terbaru dari Smartphone Empire Berita.`;
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${name} | Smartphone Empire`, url: canonical, description: desc,
    isPartOf: { '@type': 'WebSite', name: 'Smartphone Empire Berita', url: `${SITE}/` },
    mainEntity: { '@type': 'ItemList', itemListElement: list.slice(0, 50).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/${OUT}/${p.slug}/`, name: p.title })) } };
  const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Beranda', item: `${SITE}/` },
    { '@type': 'ListItem', position: 2, name, item: canonical }] };
  const img = safeHttps(list.find((p) => safeHttps(p.cover_url))?.cover_url) || `${SITE}/game/assets/img/landing/pasar.jpg`;
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(name)} | Smartphone Empire</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/game/assets/icon/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Smartphone Empire Berita">
<meta property="og:title" content="${esc(name)} | Smartphone Empire">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<script type="application/ld+json">${JSON.stringify(crumbLd).replace(/</g, '\\u003c')}</script>
<meta name="theme-color" content="#0a84ff">
<script>(function(){try{var t=localStorage.getItem('blog-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
<link rel="stylesheet" href="/blog/css/blog.css?v=10">
<link rel="stylesheet" href="/blog/css/blog-polish.css?v=2">
</head>
<body>
<a class="skip" href="#main">Lewati ke konten</a>
${siteHeader()}
<main id="main">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Beranda</a><span aria-hidden="true">/</span><span aria-current="page">${esc(name)}</span></nav>
  <h1 class="section-h">${esc(name)}</h1>
  <p class="lead">${esc(desc)}</p>
  <ul class="cat-list" style="list-style:none;padding:0;margin:20px 0;display:grid;gap:14px">
${list.map((p) => `    <li><a href="/${OUT}/${esc(p.slug)}/" style="display:block;text-decoration:none;color:inherit"><strong>${esc(p.title)}</strong>${p.excerpt ? `<span style="display:block;margin-top:4px;opacity:.8">${esc(String(p.excerpt).slice(0, 160))}</span>` : ''}<small style="display:block;margin-top:4px;opacity:.65">${esc(fmtDate(p.published_at || p.created_at))} · ${readMin(p.body)} menit baca</small></a></li>`).join('\n')}
  </ul>
  <p class="source"><a href="/k/${cat}/">Buka tampilan interaktif ${esc(name)}</a></p>
</main>
${siteFooter()}
${PAGE_JS}
</body>
</html>
`;
}

const posts = (await loadPosts()).filter((p) => p && /^[a-z0-9][a-z0-9-]{2,79}$/.test(p.slug || '') && p.title);
await mkdir(OUT, { recursive: true });
const keep = new Set(posts.map((p) => p.slug));
for (const d of await readdir(OUT)) if (!keep.has(d)) await rm(path.join(OUT, d), { recursive: true, force: true });
// Halaman kategori statis: hanya kategori yang punya artikel (hindari halaman kosong)
const byCat = Object.fromEntries(Object.keys(CATS).map((c) => [c, posts.filter((p) => p.category === c)]));
KATEGORI_ADA = new Set(Object.keys(byCat).filter((c) => byCat[c].length));
await mkdir(KOUT, { recursive: true });
for (const d of await readdir(KOUT)) if (!KATEGORI_ADA.has(d)) await rm(path.join(KOUT, d), { recursive: true, force: true });
for (const c of KATEGORI_ADA) { await mkdir(path.join(KOUT, c), { recursive: true }); await writeFile(path.join(KOUT, c, 'index.html'), categoryPage(c, byCat[c])); }
for (const p of posts) { await mkdir(path.join(OUT, p.slug), { recursive: true }); await writeFile(path.join(OUT, p.slug, 'index.html'), page(p, posts)); }

// Daftar tautan asli (bisa dirayapi) di beranda: isi di antara penanda <!--ARSIP:MULAI--> dan <!--ARSIP:SELESAI-->
try {
  const idx = await readFile('index.html', 'utf8');
  const re = /<!--ARSIP:MULAI-->[\s\S]*?<!--ARSIP:SELESAI-->/;
  if (re.test(idx)) {
    const items = posts.slice(0, 12).map((p) => `<li><a href="/${OUT}/${esc(p.slug)}/">${esc(p.title)}</a></li>`).join('');
    await writeFile('index.html', idx.replace(re, () => `<!--ARSIP:MULAI--><p class="arsip-kat">${[...KATEGORI_ADA].map((c) => `<a href="/${KOUT}/${c}/">${esc(CATS[c])}</a>`).join(' · ')}</p><ul>${items}</ul><!--ARSIP:SELESAI-->`));
  }
} catch (e) { console.warn('Lewati arsip beranda:', e.message); }

const day = (d) => new Date(d).toISOString().slice(0, 10);
const urls = [`  <url><loc>${SITE}/</loc></url>`, `  <url><loc>${SITE}/game/</loc></url>`,
  ...[...KATEGORI_ADA].map((c) => `  <url><loc>${SITE}/${KOUT}/${c}/</loc></url>`),
  ...posts.map((p) => `  <url><loc>${SITE}/${OUT}/${p.slug}/</loc><lastmod>${day(p.updated_at || p.published_at || p.created_at)}</lastmod></url>`)];
await writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
await writeFile('robots.txt', `User-agent: *\nAllow: /\nDisallow: /031411/\nDisallow: /admin/\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Selesai: ${posts.length} artikel, sitemap.xml, robots.txt`);
