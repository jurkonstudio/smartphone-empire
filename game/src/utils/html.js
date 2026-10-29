// Satu-satunya helper escape HTML untuk seluruh UI.
// Pakai SETIAP KALI data yang berasal dari pemain atau server (nama perusahaan,
// nama pemain, bio, judul/isi pesan, dll.) disisipkan ke innerHTML atau template string.
// Termasuk variabel yang dikirim ke t() bila hasilnya dimasukkan ke HTML.
export function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
