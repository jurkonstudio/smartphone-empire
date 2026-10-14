// FILE: src/data/i18n/id.js
// Kamus Bahasa Indonesia. Key flat dengan prefix kategori.

export const id = {
    // ============================================================
    // NAVIGASI
    // ============================================================
    'nav.home':     'Home',
    'nav.team':     'HQ',
    'nav.research': 'Riset',
    'nav.products': 'Produk',
    'nav.market':   'Pasar',
    'nav.settings': 'Setelan',

    // ============================================================
    // HEADER
    // ============================================================
    'header.company_aria': 'Profil perusahaan',
    'header.pause_aria':   'Jeda',
    'header.play_aria':    'Mulai',
    'header.speed_aria':   'Kecepatan',
    'header.paused':       'Paused',

    // ============================================================
    // SETELAN
    // ============================================================
    'settings.tab.general':    'Umum',
    'settings.tab.appearance': 'Tampilan',
    'settings.tab.audio':      'Audio',
    'settings.tab.finance':    'Keuangan',
    'settings.tab.language':   'Bahasa',
    'settings.tab.data':       'Data',

    'settings.section.company':       'Perusahaan',
    'settings.section.help':          'Bantuan',
    'settings.section.theme':         'Tema',
    'settings.section.accent':        'Warna Aksen',
    'settings.section.audio_haptic':  'Suara & Getar',
    'settings.section.loans_active':  'Pinjaman Aktif',
    'settings.section.loans_take':    'Ambil Pinjaman',
    'settings.section.storage':       'Penyimpanan',
    'settings.section.danger':        'Zona Bahaya',
    'settings.section.language':      'Bahasa',

    'settings.row.name':        'Nama',
    'settings.row.difficulty':  'Kesulitan',
    'settings.row.founded':     'Didirikan',
    'settings.row.guide':       'Panduan',
    'settings.row.guide_hint':  'Cara bermain & tips',
    'settings.row.tutorial':    'Ulangi Tutorial',
    'settings.row.tutorial_hint': 'Mulai dari langkah pertama',

    'settings.row.sound':       'Suara',
    'settings.row.vibrate':     'Getar',
    'settings.sound_on':        'Efek suara aktif',
    'settings.sound_off':       'Efek suara mati',
    'settings.vibrate_on':      'Umpan balik haptic aktif',
    'settings.vibrate_off':     'Umpan balik haptic mati',

    'settings.row.save':        'Simpan Manual',
    'settings.row.save_hint':   'Simpan progres sekarang',
    'settings.row.load':        'Muat Save',
    'settings.row.load_hint':   'Kembali ke save terakhir',
    'settings.row.export':      'Export JSON',
    'settings.row.export_hint': 'Salin data sebagai teks',
    'settings.row.import':      'Import JSON',
    'settings.row.import_hint': 'Tempel backup untuk memuat',
    'settings.row.reset':       'Reset Perusahaan',
    'settings.row.reset_hint':  'Hapus semua progres, mulai dari nol',

    'settings.empty.loans':     'Tidak ada pinjaman aktif.',
    'settings.hint.accent':     'Warna utama untuk tombol & highlight.',

    'settings.lang.title':      'Bahasa Aplikasi',
    'settings.lang.hint':       'Ubah bahasa antarmuka. Nama komponen teknis (mAh, GHz, MP) tetap universal.',
    'settings.lang.indonesian': 'Indonesia',
    'settings.lang.english':    'English',
    'settings.lang.active':     'Aktif',

    'settings.edit_name.title':    'Ubah Nama Perusahaan',
    'settings.edit_name.sub':      'Nama ini tampil di header dan laporan bulanan.',
    'settings.edit_name.label':    'Nama Perusahaan',
    'settings.edit_name.placeholder': 'Contoh: Nova Tech',
    'settings.edit_name.save':     'Simpan',
    'settings.edit_name.error_empty': 'Nama tidak boleh kosong.',
    'settings.edit_name.error_long':  'Maksimal 32 karakter.',
    'settings.edit_name.success':  'Nama diperbarui.',

    'settings.difficulty.santai': 'Santai',
    'settings.difficulty.normal': 'Normal',
    'settings.difficulty.sulit':  'Sulit',

    'common.cancel':  'Batal',
    'common.save':    'Simpan',
    'common.tutup':   'Tutup',
    'common.reset':   'Reset',
    'common.load':    'Muat',
    'common.import':  'Impor',
    'common.export':  'Ekspor',

    'toast.theme_changed':   'Tema: {value}',
    'toast.accent_changed':  'Warna aksen diperbarui.',
    'toast.lang_changed':    'Bahasa: {value}',
    'toast.save_ok':         'Save tersimpan.',
    'toast.save_fail':       'Gagal save.',
    'toast.no_save':         'Tidak ada save.',
    'toast.reset_confirm':   'Semua progres akan hilang.',

    // ============================================================
    // HQ — Sub-tab & Home placeholder
    // ============================================================
    'hq.tab.overview': 'Overview',
    'hq.tab.campus':   'Campus',
    'hq.tab.team':     'Team',
    'home.placeholder.title': 'Campus Map',
    'home.placeholder.body':  'Peta 3D kantor pusat akan muncul di sini. Untuk sekarang, buka tab HQ untuk mengelola perusahaan.',
    'campus.placeholder.title': 'Campus 3D Map',
    'campus.placeholder.body':  'Peta 3D kantor pusat dan sistem upgrade gedung akan tersedia di update berikutnya.',

    // ============================================================
    // TEAM — dropdown, roster, recruit, info
    // ============================================================
    'team.mode.roster':  'Tim Aktif',
    'team.mode.recruit': 'Rekrut',
    'team.mode.info':    'Info',

    'team.kpi.salary':   'Gaji/Bln',

    'team.roster.empty_title': 'Belum ada tim',
    'team.roster.empty_desc':  'Pilih menu Rekrut di dropdown atas untuk mencari kandidat.',
    'team.roster.unnamed':     'Tanpa Nama',
    'team.roster.morale':      'Morale',
    'team.roster.corrupt':     'Data staff korup',
    'team.roster.error':       'Error',

    'team.recruit.candidates_avail': 'kandidat tersedia',
    'team.recruit.refresh_in':       'refresh dalam {n} hari',
    'team.recruit.filter_all':       'Semua',
    'team.recruit.empty_title':      'Tidak ada kandidat',
    'team.recruit.empty_hint_filter':'Coba filter role lain.',
    'team.recruit.empty_hint_wait':  'Tunggu beberapa hari atau refresh pool.',
    'team.recruit.refresh_btn':      'Refresh Pool Sekarang',
    'team.recruit.per_month':        '/bln',
    'team.recruit.total':            'Total',
    'team.recruit.pool_refreshed':   'Pool diperbarui.',

    'team.modal.traits':        'Traits',
    'team.modal.traits_empty':  'Tidak ada trait khusus.',
    'team.modal.detail':        'Detail',
    'team.modal.detail_specialty': 'Spesialisasi',
    'team.modal.detail_exp':    'Pengalaman',
    'team.modal.detail_age':    'Usia',
    'team.modal.detail_bg':     'Latar Belakang',
    'team.modal.detail_limit':  'Profil terbatas — kandidat ini belum memiliki data lengkap. Kandidat dengan profil penuh akan muncul setelah pool refresh.',
    'team.modal.years':         'tahun',
    'team.modal.cost':          'Biaya',
    'team.modal.cost_salary':   'Gaji per bulan',
    'team.modal.cost_signing':  'Signing bonus',
    'team.modal.cost_total':    'Total bulan pertama',
    'team.modal.btn_cancel':    'Batal',
    'team.modal.btn_hire':      'Rekrut',
    'team.modal.aria_hire':     'Rekrut',

    'team.info.system_not_ready': 'TeamSystem belum siap',
    'team.info.eng_section':      'Engineer Bonus',
    'team.info.eng_count':        'Jumlah Engineer',
    'team.info.research_speed':   'Kecepatan Riset',
    'team.info.extra_res_slots':  'Slot Riset Ekstra',
    'team.info.os_speed':         'Kecepatan Dev OS',
    'team.info.extra_os_slots':   'Slot Fitur OS Ekstra',

    'team.info.des_section':      'Designer Bonus',
    'team.info.des_count':        'Jumlah Designer',
    'team.info.product_speed':    'Kecepatan Desain Produk',
    'team.info.quality_bonus':    'Bonus Kualitas Produk',

    'team.info.mkt_section':      'Marketer Bonus',
    'team.info.mkt_count':        'Jumlah Marketer',
    'team.info.campaign_bonus':   'Efektivitas Kampanye',

    'team.info.summary_section':  'Ringkasan Tim',
    'team.info.total_staff':      'Total Staff',
    'team.info.total_salary':     'Total Gaji / Bulan',
    'team.info.avg_morale':       'Rata-rata Moral',
    'team.info.points_unit':      'poin',

    'team.tips.title': 'TIPS',
    'team.tips.l1':    'Staff tier tinggi memberi bonus lebih besar tapi gaji lebih mahal.',
    'team.tips.l2':    'Trait Fast Learner mempercepat naik tier.',
    'team.tips.l3':    'Trait Specialist memberi bonus +25% di bidangnya.',
    'team.tips.l4':    'Moral rendah menurunkan produktivitas.',
};
