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
