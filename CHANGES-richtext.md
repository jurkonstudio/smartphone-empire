# Tempel artikel: dukung Markdown, tabel, dan format lain

- Isi artikel kini disimpan sebagai Markdown (kolom `body` tidak berubah, tidak perlu migrasi SQL).
- Tempel dari Word, Google Docs, Excel/Sheets, halaman web, atau chat AI: HTML-nya otomatis diubah ke Markdown (tabel, judul, daftar, tebal, miring, tautan, kutipan, kode). Kode HTML mentah dan tabel TSV juga dikenali. Ctrl/Cmd+Shift+V = tempel teks polos.
- Pratinjau tampilan langsung di dialog "Tempel artikel".
- Tampilan blog (/baca/…) dan halaman statis (/a/…) memakai renderer yang sama: `blog/js/richtext.js`. Semua keluaran di-escape (HTML mentah tidak lolos); gambar hanya https.
- Artikel lama (teks polos, bullet "•") tampil sama seperti sebelumnya.
- `quality.js`: hitung kata tanpa simbol markdown, judul `#` dihitung subjudul; "Rapikan otomatis" tidak lagi merusak indentasi daftar/blok kode.
- Fungsi terjemahan (`blog-translate`) sekarang diminta menjaga sintaks Markdown. Perlu deploy ulang: `supabase functions deploy blog-translate`.

File baru: `blog/js/richtext.js`, `blog/css/richtext.css`.
Diubah: `blog/js/main.js` (v=17), `blog/js/quality.js`, `index.html`, `tools/build-artikel.mjs`, `supabase/function/blog-translate/index.ts`.

## Halaman Tentang Kami, Kebijakan Privasi, Kontak (dan 3 halaman info lain)

- Halaman asli (file statis, bisa dirayapi Google/AdSense) dibuat di `i/tentang/`, `i/redaksi/`, `i/etik/`, `i/siber/`, `i/privasi/`, `i/kontak/`.
- Isi bersumber dari `blog/js/pages.js`; email redaksi dari `blog/js/config.js` (`calvfinka@yahoo.com`). Halaman Kontak menampilkan kartu email, 1–3 hari kerja untuk balasan, dan tautan X/Instagram/YouTube.
- Kebijakan Privasi: ditambah bagian "Hosting dan log server" dan "Iklan" (saat ini tanpa iklan; diperbarui bila kelak memasang AdSense), kontak email privasi, tanggal 4 November 2026.
- `tools/build-artikel.mjs` kini ikut membangun halaman `/i/…` dan memasukkannya ke sitemap; workflow menambahkan folder `i`.
- Setelah mengubah `pages.js` atau `config.js`, bangun ulang manual: `node tools/build-artikel.mjs --hanya-info`.
