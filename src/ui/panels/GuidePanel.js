// FILE: src/ui/panels/GuidePanel.js
const GLOSSARY = [
    { term: 'Reputasi',   def: 'Kepercayaan pasar terhadap perusahaanmu. Mempengaruhi permintaan.' },
    { term: 'Pangsa Pasar', def: 'Persentase penjualanmu dibanding total pasar.' },
    { term: 'Kualitas',   def: 'Skor gabungan dari komponen & OS ponsel.' },
    { term: 'Burn Rate',  def: 'Rata-rata biaya bulanan. Jika uang < 2x burn rate, kamu dalam bahaya.' },
    { term: 'R&D',        def: 'Research & Development — kegiatan riset teknologi.' },
    { term: 'Era',        def: 'Periode teknologi: Feature Phone, Touch, Modern, AI.' },
    { term: 'OS',         def: 'Sistem operasi. Bisa dikembangkan sendiri atau dilisensi.' },
    { term: 'Prototipe',  def: 'Tahap uji coba sebelum produksi massal.' },
    { term: 'Lifecycle',  def: 'Siklus hidup produk: naik, puncak, turun.' }
];

export function renderGuidePanel() {
    return `
        <div class="card">
            <div class="card-title">Glosarium</div>
            ${GLOSSARY.map(g => `
                <div class="gloss-row">
                    <b>${g.term}</b>
                    <span>${g.def}</span>
                </div>`).join('')}
        </div>
        <div class="card">
            <div class="card-title">Tips Umum</div>
            <ul class="tips-list">
                <li>Jaga uang tetap > 3 bulan biaya operasional.</li>
                <li>Riset lebih awal membuka komponen murah berkualitas.</li>
                <li>Rekrut Engineer mempercepat riset; Designer menaikkan kualitas produk.</li>
                <li>Jangan lupakan pemasaran saat merilis ponsel.</li>
                <li>Ikuti tren era agar produkmu tidak ketinggalan zaman.</li>
            </ul>
        </div>
        <div class="card">
            <div class="card-title">Pintasan</div>
            <div class="sum-row"><span>Space</span><b>Pause / Resume</b></div>
            <div class="sum-row"><span>F</span><b>Percepat (cycle speed)</b></div>
        </div>
        <button class="btn-secondary" data-nav="settings" style="width:100%;margin-top:8px;">← Kembali</button>
    `;
}
