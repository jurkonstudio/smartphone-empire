// FILE: src/systems/advisor/AdvisorConfig.js
// ============================================================
// ADVISOR CONFIG — Pusat Data Teks, Aturan (Rules), dan Kamus.
// ============================================================

export const SEV = { critical: 0, warn: 1, tip: 2, info: 3 };

export const DICT = {
    id: {
        'ui.title': 'Asisten Bisnis',
        'ui.open': 'Buka',
        'ui.snooze': 'Tunda 30 hari',
        'ui.close': 'Tutup',
        'ui.ask_ph': 'Tanya apa saja atau ketik "buka riset"…',
        'ui.advice': 'Saran untuk kamu',
        'ui.show_all': 'Lihat semua',
        'ui.hide': 'Sembunyikan',
        'ui.clear': 'Mulai ulang',
        'ui.ask_send': 'Kirim',
        'ui.thinking': 'Berpikir…',
        'ui.chat': 'Tanya asisten',
        'ui.copy_report': 'Salin laporan bug',
        'ui.open_report': 'Lihat detail',
        'ui.report_copied': 'Laporan disalin. Kirim ke pengembang.',
        'ui.report_failed': 'Gagal menyalin. Buka detail lalu salin manual.',
        'ui.patch_reload': 'Simpan & muat ulang',
        'ui.patch_ack': 'Tandai dibaca',
        'ui.patch_saved': 'Game disimpan. Memuat versi terbaru…',
        'ui.briefing': 'Sejak terakhir kamu cek',
        'ui.health': 'Kesehatan bisnis',
        'ui.ai': 'AI',
        'ui.cash_lbl': 'Uang',
        'ui.sold_lbl': 'Terjual',
        'ui.health_lbl': 'Skor',
        'ui.resolved_lbl': '{n} masalah sudah beres',
        'ui.days_lbl': '{n} hari',
        'ui.weakest_lbl': 'Area terlemah: {name}',
        'ui.ask_fail': 'Asisten AI sedang tidak tersedia.',
        'ui.summary': 'Uang cukup sekitar {months} bulan biaya operasional.',
        'ui.summary_na': 'Belum ada biaya bulanan berarti.',
        'cash_crit.t': 'Uang hampir habis!',
        'cash_crit.d': 'Uang ${cash} kurang dari biaya bulanan ${burn}. Jual stok, tunda riset baru, atau ambil pinjaman di Setelan.',
        'cash_low.t': 'Uang mulai menipis',
        'cash_low.d': 'Uang cukup sekitar {months} bulan biaya (${burn}/bulan). Pastikan produk laku sebelum menambah staf.',
        'cash_trend.t': 'Kas terus menyusut',
        'cash_trend.d': 'Dengan pemasukan rata-rata ${income}/bulan, arus kas bersih {net}/bulan. Uang habis sekitar {months} bulan lagi.',
        'negative_cash.t': 'Kas pernah minus',
        'negative_cash.d': '{n} bulan terakhir uangmu negatif. Segera tutup defisit: jual stok, tunda pengeluaran, atau pinjam.',
        'loan_late.t': 'Cicilan pinjaman telat',
        'loan_late.d': '{n} pinjaman menunggak. Telat berulang kena denda dan bisa membuat bank memblokirmu.',
        'loan_burden.t': 'Cicilan terlalu berat',
        'loan_burden.d': 'Cicilan ${inst}/bulan memakan {pct}% pemasukan. Hindari pinjaman baru; pertimbangkan pelunasan dini.',
        'loan_payoff.t': 'Pertimbangkan pelunasan dini',
        'loan_payoff.d': 'Uangmu cukup longgar. Melunasi sisa pinjaman ${left} menghemat bunga bulanan.',
        'margin_thin.t': 'Margin tipis: {name}',
        'margin_thin.d': 'Untung per unit hanya {pct}% dari harga. Naikkan harga sedikit atau tekan biaya komponen di versi berikutnya.',
        'sales_slump.t': 'Penjualan melambat',
        'sales_slump.d': 'Laju jual turun sekitar {pct}% dibanding periode sebelumnya. Coba kampanye, turunkan harga, atau rilis penerus.',
        'share_drop.t': 'Pangsa pasar turun',
        'share_drop.d': 'Pangsa pasarmu turun dari {from}% menjadi {to}%. Pesaing sedang menekan; cek tren dan harga.',
        'product_unhappy.t': 'Pengguna kurang puas: {name}',
        'product_unhappy.d': 'Kepuasan {n}/100. Perbaiki bug OS dan rancang penerus yang lebih baik.',
        'catalog_full.t': 'Katalog aktif penuh',
        'catalog_full.d': '{n} produk dijual sekaligus (batas {max}). Hentikan yang sudah tua sebelum merilis yang baru.',
        'viral_opportunity.t': 'Momentum viral positif',
        'viral_opportunity.d': 'Produkmu sedang jadi perbincangan. Jalankan kampanye sekarang untuk memanfaatkan momentumnya.',
        'idle_cash.t': 'Uang menganggur',
        'idle_cash.d': 'Runway {months} bulan. Kelebihan uang paling baik dipakai untuk riset, produk penerus, atau OS/chip sendiri.',
        'overstaffed.t': 'Staf terlalu banyak untuk pemasukan',
        'overstaffed.d': 'Gaji {pct}% dari biaya bulanan padahal belum ada produk laku. Tahan rekrutmen sampai produk menghasilkan.',
        'hire_first.t': 'Rekrut anggota tim pertama',
        'hire_first.d': 'Mulai dari engineer (biaya rekrut ${cost}). Engineer mempercepat riset dan membuka slot riset.',
        'hire_designer.t': 'Butuh desainer',
        'hire_designer.d': 'Desainer mempercepat pengembangan ponsel dan menaikkan kualitas produk.',
        'hire_marketer.t': 'Rekrut marketer',
        'hire_marketer.d': 'Kamu sudah menjual produk. Marketer memperbesar jangkauan kampanye.',
        'research_idle.t': 'Slot riset kosong',
        'research_idle.d': '{free} slot menganggur. Rekomendasi terbaik: "{name}" (${cost}) — {why}.',
        'research_slots.t': 'Slot riset penuh',
        'research_slots.d': 'Tambah {need} engineer lagi untuk membuka slot riset berikutnya.',
        'design_first.t': 'Rancang ponsel pertamamu',
        'design_first.d': 'Teknologi awal sudah cukup. Rilis produk pertama untuk mulai mendapat pemasukan.',
        'stock_out.t': 'Stok habis: {name}',
        'stock_out.d': 'Penjualan terhenti. Produksi ulang agar tidak kehilangan pelanggan.',
        'stock_low.t': 'Stok menipis: {name}',
        'stock_low.d': 'Sisa {stock} unit. Pesan produksi atau aktifkan auto-restock.',
        'campaign.t': 'Jalankan kampanye untuk {name}',
        'campaign.d': 'Belum ada kampanye aktif. Iklan mendorong penjualan selama produk masih baru.',
        'successor.t': '{name} mulai menua',
        'successor.d': 'Sudah {days} hari dijual dan penjualan akan menurun. Mulai rancang penerusnya.',
        'os_missing.t': 'Pertimbangkan OS sendiri',
        'os_missing.d': 'OS yang stabil menaikkan skor produk dan membuka toko aplikasi.',
        'os_bugs.t': 'Bug OS menumpuk',
        'os_bugs.d': 'Ada {n} bug aktif. Perbaiki agar kepuasan pengguna tidak turun.',
        'fab_ready.t': 'Pabrik chip siap dibangun',
        'fab_ready.d': 'Riset konstruksi Fab selesai. Punya pabrik sendiri menekan biaya chip.',
        'morale.t': 'Moral tim rendah',
        'morale.d': 'Rata-rata moral {n}/100. Moral rendah menurunkan kinerja dan bisa membuat staf keluar.',
        'reputation.t': 'Reputasi masih rendah',
        'reputation.d': 'Reputasi {n}/100. Rilis produk berkualitas dan jaga ulasan agar naik.',
        'all_good.t': 'Semua terkendali',
        'all_good.d': 'Tidak ada hal mendesak. Waktu yang bagus untuk berinvestasi di riset atau produk baru.'
    },
    en: {
        'ui.title': 'Business Advisor',
        // ... (Lanjutkan copy paste bagian en dari DICT yang Anda miliki)
    }
};

export const WHY = {
    id: { dependents: 'membuka {n} riset lanjutan', cheap: 'murah & cepat menaikkan skor produk', unlocks: 'membuka komponen/fitur baru', fallback: 'langkah teknologi berikutnya' },
    en: { dependents: 'unlocks {n} follow-up research', cheap: 'cheap and quickly lifts product score', unlocks: 'unlocks new components/features', fallback: 'the next tech step' }
};

export const ALERT_TEXT = {
    CASH_NAN: ['Nilai uang rusak (bukan angka). Data save kemungkinan korup.', 'Cash value is broken (not a number). Save data may be corrupted.'],
    CASH_NON_INTEGER: ['Uang berisi pecahan desimal; biasanya tidak berbahaya.', 'Cash has a decimal part; usually harmless.'],
    // ... (copy semua ALERT_TEXT dari file Anda)
};

export const INTENTS = {
    greet:     { w: 1, kw: ['halo', 'hai', 'hi', 'hello', 'hey', 'pagi', 'siang', 'sore', 'malam', 'assalamualaikum', 'woi'] },
    // ... (copy semua INTENTS dari file Anda)
};

export const INTENT_LABEL = {
    status: ['kondisi bisnis', 'business status'], health: ['skor kesehatan', 'health score'],
    // ... (copy semua INTENT_LABEL dari file Anda)
};

export const NAV_TARGETS = [
    { id: 'os',       label: ['Riset OS', 'OS Research'],      nav: 'research', subtab: 'os',     kw: ['os', 'sistem', 'operasi'] },
    // ... (copy semua NAV_TARGETS dari file Anda)
];

export const GLOSSARY = {
    runway: ['Runway = berapa bulan uangmu bertahan dengan biaya bulanan sekarang (uang ÷ biaya bulanan). Di bawah 3 bulan itu zona bahaya.',
             'Runway = how many months your cash lasts at the current monthly cost (cash ÷ monthly cost). Under 3 months is the danger zone.'],
    // ... (copy semua GLOSSARY dari file Anda)
};

export const HEALTH_ACTION = {
    liquidity: { nav: 'products', subtab: 'sales', id: 'sales' },
    // ... (copy semua HEALTH_ACTION dari file Anda)
};

export const RULES = [
    function patch(c, push) { /* ... isi fungsi patch dari file Anda ... */ },
    function cash(c, push) { /* ... isi fungsi cash ... */ },
    // ... (copy semua RULES dari file Anda)
];
