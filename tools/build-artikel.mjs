// Membuat halaman statis per artikel (a/<slug>/index.html), sitemap.xml, dan robots.txt
// agar artikel bisa diindeks Google. Dijalankan dari ROOT repo:  node tools/build-artikel.mjs
// Hanya membaca artikel berstatus "published" lewat kunci publishable (aman, sama seperti di blog).
// Uji tanpa jaringan: node tools/build-artikel.mjs --dari-file data.json
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import path from 'node:path';

const SITE = 'https://smartphone-empire.my.id';
const OUT = 'a';
const cfg = await readFile('blog/js/config.js', 'utf8');
const pick = (k) => (cfg.match(new RegExp(`export const ${k}\\s*=\\s*'([^']*)'`)) || [])[1] || '';
const SUPABASE_URL = pick('SUPABASE_URL'), SUPABASE_KEY = pick('SUPABASE_KEY'), TZ = pick('TZ') || 'Asia/Jakarta';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeHttps = (u) => (/^https:\/\//.test(u || '') ? u : '');
const CATS = { rilis: 'Rilis', spek: 'Spek', rumor: 'Rumor', jadwal: 'Jadwal' };
const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });

async function loadPosts() {
  const i = process.argv.indexOf('--dari-file');
  if (i > 0) return JSON.parse(await readFile(process.argv[i + 1], 'utf8'));
  const url = `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,title,category,excerpt,body,cover_url,source_url,author,published_at,created_at,updated_at&status=eq.published&order=published_at.desc&limit=1000`;
  const r = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.json();
}

function page(p) {
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
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(p.title)} | Smartphone Empire Berita</title>
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
<script>(function(){try{var t=localStorage.getItem('blog-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
<link rel="stylesheet" href="/blog/css/blog.css?v=5">
</head>
<body>
<header class="site-header"><div class="bar">
  <a class="brand" href="/"><span class="brand-mark" aria-hidden="true"></span><span>Smartphone Empire <small>Berita</small></span></a>
  <nav class="menu" aria-label="Kategori"><a href="/">Beranda</a><a href="/#/k/rilis">Rilis</a><a href="/#/k/spek">Spek</a><a href="/#/k/rumor">Rumor</a><a href="/#/k/jadwal">Jadwal</a></nav>
  <div class="tools"><a class="cta-game" href="/game/"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><span>Main game</span></a></div>
</div></header>
<main>
  <a class="back" href="/">← Kembali</a>
  <article class="article">
    <div class="meta"><span class="tag t-${esc(p.category)}">${esc(cat)}</span></div>
    <h1>${esc(p.title)}</h1>
    ${p.excerpt ? `<p class="lead">${esc(p.excerpt)}</p>` : ''}
    <div class="meta byline"><span>Ditulis oleh ${esc(p.author || 'admin')}</span><span>·</span><time datetime="${esc(published)}">${esc(fmtDate(published))}</time></div>
    ${safeHttps(p.cover_url) ? `<img class="cover" src="${esc(p.cover_url)}" alt="${esc(p.title)}" style="margin-top:20px">` : ''}
    <div class="content">${paras.map((s) => `<p>${esc(s).replace(/\n/g, '<br>')}</p>`).join('\n')}</div>
    ${safeHttps(p.source_url) ? `<p class="source">Sumber: <a href="${esc(p.source_url)}" rel="noopener nofollow" target="_blank">${esc(p.source_url)}</a></p>` : ''}
    <p class="source"><a href="/#/a/${esc(p.slug)}">Buka versi interaktif (komentar dan jajak pendapat)</a></p>
  </article>
</main>
<footer class="site-footer"><div class="copy"><span>© ${new Date().getFullYear()} Jurkon Studio</span><a href="/#/i/tentang">Tentang Kami</a></div></footer>
</body>
</html>
`;
}

const posts = (await loadPosts()).filter((p) => p && /^[a-z0-9][a-z0-9-]{2,79}$/.test(p.slug || '') && p.title);
await mkdir(OUT, { recursive: true });
const keep = new Set(posts.map((p) => p.slug));
for (const d of await readdir(OUT)) if (!keep.has(d)) await rm(path.join(OUT, d), { recursive: true, force: true });
for (const p of posts) { await mkdir(path.join(OUT, p.slug), { recursive: true }); await writeFile(path.join(OUT, p.slug, 'index.html'), page(p)); }

const day = (d) => new Date(d).toISOString().slice(0, 10);
const urls = [`  <url><loc>${SITE}/</loc></url>`, `  <url><loc>${SITE}/game/</loc></url>`,
  ...posts.map((p) => `  <url><loc>${SITE}/${OUT}/${p.slug}/</loc><lastmod>${day(p.updated_at || p.published_at || p.created_at)}</lastmod></url>`)];
await writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
await writeFile('robots.txt', `User-agent: *\nAllow: /\nDisallow: /031411/\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Selesai: ${posts.length} artikel, sitemap.xml, robots.txt`);
