# Blog polish (replace files)
Salin ke ROOT repo, timpa file yang sama:
- index.html  (canonical, OG/Twitter, JSON-LD, skip-link, skeleton, arsip artikel)
- blog/css/blog-polish.css  (BARU)
- tools/build-artikel.mjs  (template artikel baru + isi arsip di index.html)
- .github/workflows/build-artikel.yml  (ikut commit index.html)
Lalu jalankan workflow "Bangun halaman artikel" sekali (Actions > Run workflow) agar semua /a/... memakai template baru.
