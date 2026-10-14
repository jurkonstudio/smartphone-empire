// FILE: src/data/i18n/id.js
// Kamus Bahasa Indonesia. Key flat dengan prefix kategori.
// v2027.13a — Tambah: date.month.*, kpi.*, dashboard.*, log.*, news.*, timeline.*

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
    // KALENDER
    // ============================================================
    'date.month.1':  'Jan',
    'date.month.2':  'Feb',
    'date.month.3':  'Mar',
    'date.month.4':  'Apr',
    'date.month.5':  'Mei',
    'date.month.6':  'Jun',
    'date.month.7':  'Jul',
    'date.month.8':  'Agu',
    'date.month.9':  'Sep',
    'date.month.10': 'Okt',
    'date.month.11': 'Nov',
    'date.month.12': 'Des',

    'date.month_full.1':  'Januari',
    'date.month_full.2':  'Februari',
    'date.month_full.3':  'Maret',
    'date.month_full.4':  'April',
    'date.month_full.5':  'Mei',
    'date.month_full.6':  'Juni',
    'date.month_full.7':  'Juli',
    'date.month_full.8':  'Agustus',
    'date.month_full.9':  'September',
    'date.month_full.10': 'Oktober',
    'date.month_full.11': 'November',
    'date.month_full.12': 'Desember',

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
    'settings.row.theme_dark':  'Gelap',
    'settings.row.theme_light': 'Terang',

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
    'common.close':   'Tutup',
    'common.back':    'Kembali',
    'common.next':    'Lanjut',
    'common.confirm': 'Konfirmasi',
    'common.yes':     'Ya',
    'common.no':      'Tidak',

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
    // KPI CARDS (Dashboard)
    // ============================================================
    'kpi.cash':          'Uang Tunai',
    'kpi.reputation':    'Reputasi',
    'kpi.rep_high':      'Baik',
    'kpi.rep_mid':       'Cukup',
    'kpi.rep_low':       'Rendah',
    'kpi.team':          'Tim',
    'kpi.team_empty':    'Belum ada tim',
    'kpi.team_morale':   'Morale {n}/100',
    'kpi.date':          'Tanggal',

    // ============================================================
    // DASHBOARD
    // ============================================================
    'dashboard.public_highlight': 'Sorotan Publik',
    'dashboard.sentiment':        'Sentimen',
    'dashboard.view_feedback':    'Lihat Feedback Publik',
    'dashboard.timeline_title':   'Timeline Sejarah 2000–2026',
    'dashboard.focus_title':      'Fokus Hari Ini',
    'dashboard.focus_empty_title':'Semua berjalan lancar',
    'dashboard.focus_empty_desc': 'Riset teknologi baru, rekrut tim, atau rilis produk untuk mempercepat pertumbuhan.',
    'dashboard.focus_open_research': 'Buka Tab Riset',
    'dashboard.focus_active_research': 'Riset Aktif',
    'dashboard.focus_slots':      '{n}/{max} slot terpakai',
    'dashboard.focus_quest':      'Quest',

    // ============================================================
    // LOG / AKTIVITAS
    // ============================================================
    'log.title':       'Aktivitas Terbaru',
    'log.empty':       'Belum ada aktivitas.',
    'log.type.info':   'Info',
    'log.type.success':'Sukses',
    'log.type.warning':'Peringatan',
    'log.type.danger': 'Bahaya',

    // ============================================================
    // NEWS / BERITA
    // ============================================================
    'news.panel_title':     'Berita Internasional',
    'news.panel_empty':     'Belum ada berita. Rilis produk untuk melihat ulasan media.',
    'news.new_badge':       '{n} baru',
    'news.read_latest':     'Baca Berita Terbaru',
    'news.score':           'Skor {n}/10',
    'news.sentiment.positive': 'Positif',
    'news.sentiment.negative': 'Negatif',
    'news.sentiment.mixed':    'Campuran',
    'news.article.by':         'Oleh',
    'news.article.editor_score': 'Penilaian Editor',
    'news.article.from':       'Artikel dari {source} ({type})',
    'news.article.close':      'Tutup Artikel',

    // ============================================================
    // TIMELINE
    // ============================================================
    'timeline.header.era':      'Era',
    'timeline.filter.all':      'Semua',
    'timeline.filter.phone':    'Ponsel',
    'timeline.filter.os':       'OS',
    'timeline.kind.phone':      'Ponsel',
    'timeline.kind.os':         'OS',
    'timeline.speculative':     'Spekulatif',
    'timeline.now':             'Sekarang · {year}',
    'timeline.empty_title':     'Belum ada data timeline',
    'timeline.empty_desc':      'Data sejarah akan muncul seiring waktu berjalan.',

    // ============================================================
    // TEAM — dropdown, roster, recruit, info
    // ============================================================
    'team.mode.roster':  'Tim Aktif',
    'team.mode.recruit': 'Rekrut',
    'team.mode.info':    'Info',

    'team.kpi.salary':   'Gaji/Bln',
    'team.kpi.engineer': 'Engineer',
    'team.kpi.designer': 'Designer',
    'team.kpi.marketer': 'Marketer',

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

    // ============================================================
    // STAFF DETAIL MODAL
    // ============================================================
    'staff.detail.role_joined': '{role} • Bergabung {day}/{month}/{year}',
    'staff.detail.months_worked': '{n} bulan bekerja',
    'staff.detail.tier_label':    'Tier {n}',
    'staff.detail.progress_to':   'Progres ke Tier {n}',
    'staff.detail.max_tier':      'Sudah di tier tertinggi',
    'staff.detail.salary':        'Gaji per bulan',
    'staff.detail.morale':        'Moral',
    'staff.detail.traits_title':  'Trait',
    'staff.detail.no_traits':     'Tanpa trait khusus.',
    'staff.detail.train_btn':     '📚 Training Intensif (+30 progress) — ${cost}',
    'staff.detail.fire_btn':      '⛔ PHK Staff (pesangon ${severance})',
    'staff.detail.close':         'Tutup',
};
    // ============================================================
    // RESEARCH PANEL
    // ============================================================
    'research.subtab.tech':    'Teknologi',
    'research.subtab.os':      'OS',
    'research.subtab.history': 'Sejarah',
    'research.subtab.chip':    'Chip',

    'research.section.running':   'Berjalan',
    'research.section.available': 'Tersedia',
    'research.section.done':      'Selesai',
    'research.section.locked':    'Terkunci',
    'research.section.empty':     'Tidak ada node di kategori ini',

    'research.slot.title':       'Riset Aktif',
    'research.slot.hint':        'Belum ada riset berjalan. Pilih node di bawah.',
    'research.slot.eta':         'Sisa ~{n} hari',

    'research.node.category':    'Kategori',
    'research.node.tier':        'Tier',
    'research.node.available_year': 'Tersedia tahun',
    'research.node.cost':        'Biaya',
    'research.node.duration':    'Durasi',
    'research.node.duration_days': '{n} hari',
    'research.node.prereq':      'Prasyarat',
    'research.node.prereq_none': 'Tidak ada prasyarat.',
    'research.node.effects':     'Efek',
    'research.node.effects_comp': 'Komponen: {list}',
    'research.node.effects_feat': 'Fitur OS: {list}',
    'research.node.status':      'Status',
    'research.node.start':       'Mulai Riset',
    'research.node.cancel':      'Batalkan Riset',
    'research.node.not_available': 'Tidak tersedia',

    // ============================================================
    // OS PANEL
    // ============================================================
    'os.empty.title':       'Belum ada OS',
    'os.empty.desc':        'Bangun sistem operasi sendiri atau lisensi OS pihak ketiga.',
    'os.empty.create':      'Buat OS',

    'os.hero.version':      'Versi {v}',
    'os.hero.no_version':   'Belum ada versi rilis',
    'os.hero.dev_new':      'Kembangkan Versi Baru',
    'os.hero.dev_empty':    'Kembangkan versi pertama (v1.0) untuk melihat stat.',

    'os.dev.title':         'Sedang Dikembangkan',
    'os.dev.features_count': '{n} fitur baru',
    'os.dev.cancel':        'Batalkan Pengembangan',
    'os.dev.progress':      'Progress',
    'os.dev.eta_calc':      'Menghitung estimasi...',

    'os.bug.title':         'Bug Aktif · {n}',
    'os.bug.severity':      'Sev {n}',
    'os.bug.patch':         'Patch',
    'os.bug.ignore':        'Abaikan',
    'os.bug.patching':      'DIPATCH',

    'os.features.section_available': 'Tersedia',
    'os.features.section_deving':    'Dikembangkan',
    'os.features.section_owned':     'Dimiliki',
    'os.features.section_locked':    'Terkunci',

    'os.feature.badge_owned':      'DIMILIKI',
    'os.feature.badge_deving':     'DIKEMBANGKAN',
    'os.feature.badge_available':  'TERSEDIA',
    'os.feature.badge_locked':     'TERKUNCI',

    'os.apps.section':      'Ekosistem Aplikasi · {owned}/{total}',
    'os.apps.third_party':  'Aplikasi pihak ketiga: {n}',
    'os.apps.owned_badge':  'DIMILIKI',
    'os.apps.locked_badge': 'TERKUNCI',
    'os.apps.build':        'Buat',
    'os.apps.invite':       'Undang Developer (+apps)',
    'os.apps.appeal_bonus': '+{n} appeal',

    'os.licenses.section':  'Lisensi OS Pihak Ketiga',
    'os.licenses.per_unit': '${cost}/unit',
    'os.licenses.available':'Tersedia',
    'os.licenses.available_from': 'Tersedia {year}',

    'os.stat.stability':    'Stabilitas',
    'os.stat.speed':        'Kecepatan',
    'os.stat.features':     'Fitur',
    'os.stat.security':     'Keamanan',
    'os.stat.design':       'Desain',
    'os.stat.stab_short':   'Stab',
    'os.stat.cepat_short':  'Cepat',
    'os.stat.fitur_short':  'Fitur',
    'os.stat.aman_short':   'Aman',
    'os.stat.desain_short': 'Desain',

    'os.wizard.title':      'Kembangkan Versi Baru',
    'os.wizard.sub':        'Pilih maks {n} fitur. Stat akan dihitung ulang.',
    'os.wizard.preview':    'Preview Stat',
    'os.wizard.total_cost': 'Total biaya',
    'os.wizard.duration':   'Durasi',
    'os.wizard.start':      'Mulai Kembangkan',
    'os.wizard.cancel':     'Batal',
    'os.wizard.no_features':'Tidak ada fitur baru yang tersedia.',
    'os.wizard.select_min': 'Pilih minimal 1 fitur.',
    'os.wizard.max_features':'Maks {n} fitur per versi.',

    'os.create.title':      'Buat OS Baru',
    'os.create.sub':        'Beri nama sistem operasi perusahaanmu.',
    'os.create.label':      'Nama OS',
    'os.create.placeholder':'Contoh: MyOS, Aurora, ...',
    'os.create.btn':        'Buat',
    'os.create.cancel':     'Batal',

    'os.feature_detail.era':       'Era',
    'os.feature_detail.min_year':  'Tahun min',
    'os.feature_detail.cost':      'Biaya',
    'os.feature_detail.duration':  'Durasi',
    'os.feature_detail.effects':   'Efek Stat',
    'os.feature_detail.status':    'Status',
    'os.feature_detail.status_owned':     'Sudah dimiliki',
    'os.feature_detail.status_deving':    'Sedang dikembangkan',
    'os.feature_detail.status_available': 'Tersedia untuk versi berikutnya',
    'os.feature_detail.close':     'Tutup',

    // ============================================================
    // CHIP / CHIP DESIGNER
    // ============================================================
    'chip.lab.title':       'Chip Lab',
    'chip.lab.arch_avail':  'Arsitektur tersedia',
    'chip.lab.node_avail':  'Node tersedia',
    'chip.lab.feat_avail':  'Fitur tersedia',
    'chip.lab.catalog':     'Chip di katalog',

    'chip.design.title':    'Desain Chip Baru',
    'chip.design.desc':     'Rancang silicon: pilih arsitektur, node, core, clock, dan fitur.',
    'chip.design.start':    'Mulai Desain Chip',
    'chip.design.designing':'Sedang Didesain',
    'chip.design.progress': 'Progress',
    'chip.design.days_left':'{n} hari tersisa',
    'chip.design.cancel':   'Batalkan',

    'chip.catalog.title':   'Katalog Chip ({n})',
    'chip.catalog.empty':   'Belum ada chip',
    'chip.catalog.empty_desc': 'Desain chip pertama Anda di Chip Designer.',
    'chip.catalog.perf':    'Perf',
    'chip.catalog.eff':     'Eff',

    'chip.fab.title':       'Fabrikasi',
    'chip.fab.level':       'Level',
    'chip.fab.capacity':    'Kapasitas',
    'chip.fab.stock':       'Stok chip',
    'chip.fab.manage':      'Kelola Fab',
    'chip.fab.build_desc':  'Bangun pabrik chip sendiri untuk produksi massal.',
    'chip.fab.need_research': 'Butuh riset Konstruksi Fab untuk membangun pabrik sendiri.',
    'chip.fab.build':       'Bangun Fab',
    'chip.fab.need_research_btn': 'Butuh Riset Fab',
    'chip.fab.system_not_ready': 'Chip System belum siap',
    'chip.fab.per_month':   '/bln',
    'chip.fab.unit':        'unit',

    'chip.wiz.title':       'Chip Designer',
    'chip.wiz.sub':         'Rancang silicon-mu sendiri',
    'chip.wiz.step1':       'Nama & Arsitektur',
    'chip.wiz.step2':       'Spesifikasi',
    'chip.wiz.step3':       'Fitur & Budget',
    'chip.wiz.step4':       'Preview & Rilis',
    'chip.wiz.name_label':  'Nama Chip',
    'chip.wiz.name_ph':     'Contoh: X1 Nano, Titan A1, ...',
    'chip.wiz.arch_label':  'Arsitektur',
    'chip.wiz.tier':        'Tier {t} • Max {max} core • {year}',
    'chip.wiz.node':        'Process Node',
    'chip.wiz.cores':       'Jumlah Core',
    'chip.wiz.cores_max':   '(max {n})',
    'chip.wiz.clock':       'Clock Speed (GHz)',
    'chip.wiz.cache':       'Cache Size',
    'chip.wiz.budget':      'Budget R&D',
    'chip.wiz.features':    'Fitur',
    'chip.wiz.features_count': '({n} dipilih)',
    'chip.wiz.preview':     'Preview',
    'chip.wiz.btn_cancel':  'Batal',
    'chip.wiz.btn_next':    'Lanjut →',
    'chip.wiz.btn_back':    '← Kembali',
    'chip.wiz.btn_confirm': 'Mulai Desain ✓',
    'chip.wiz.err_name':    'Isi nama chip.',
    'chip.wiz.err_name_long': 'Nama maksimal 24 karakter.',
    'chip.wiz.err_arch':    'Pilih arsitektur.',
    'chip.wiz.err_node':    'Pilih process node.',
    'chip.wiz.goto_research': 'Buka Riset Chip →',
    'chip.wiz.no_arch':     'Belum ada arsitektur tersedia. Riset chip architecture dulu.',

    'chip.research.slot_title':  'Riset Chip',
    'chip.research.done_summary': 'Selesai: <b>{n}</b> / {total} node',
    'chip.research.empty_active': 'Belum ada riset berjalan.',
    'chip.research.section_running':   'Berjalan',
    'chip.research.section_available': 'Tersedia',
    'chip.research.section_done':      'Selesai',
    'chip.research.section_locked':    'Terkunci',

    // ============================================================
    // PRODUCT PANEL & DESIGN WIZARD
    // ============================================================
    'prod.subtab.design':  'Desain',
    'prod.subtab.catalog': 'Katalog',
    'prod.subtab.sales':   'Penjualan',
    'prod.subtab.chip':    'Chip',

    'prod.design.title':    'Desain Produk Baru',
    'prod.design.desc':     'Rancang ponsel: pilih komponen, tentukan OS, harga, dan jumlah produksi.',
    'prod.design.start':    'Mulai Desain Ponsel',
    'prod.design.dev_title':'Pengembangan Aktif',
    'prod.design.dev_phase':'Tahap: <b>{phase}</b> - Total {days} hari game',
    'prod.design.dev_eta':  'Menunggu waktu berjalan...',
    'prod.design.cancel':   'Batalkan Proyek',

    'prod.phase.design':    'Desain',
    'prod.phase.prototype': 'Prototipe',
    'prod.phase.production':'Produksi',
    'prod.phase.released':  'Rilis',

    'prod.catalog.empty':   'Belum ada produk',
    'prod.catalog.empty_desc': 'Rilis ponsel pertamamu di sub-tab Desain.',
    'prod.catalog.status_selling': 'Dijual',
    'prod.catalog.status_discontinued': 'Dihentikan',
    'prod.catalog.auto_tag': '[AUTO]',
    'prod.catalog.review':  '⭐ {n}/10',
    'prod.catalog.stock':   '📦 {n} stok',
    'prod.catalog.revenue': '💰 ${n}',
    'prod.catalog.sold':    'Terjual: {n}',
    'prod.catalog.price':   'Harga: ${n}',
    'prod.catalog.quality': 'Kualitas: {n}',

    'prod.sales.total_revenue': 'Total Pendapatan',
    'prod.sales.total_sold':    'Total Terjual',
    'prod.sales.active_products':'Produk Aktif',
    'prod.sales.best_seller':   'Terlaris',
    'prod.sales.list_title':    'Daftar Produk',
    'prod.sales.list_empty':    'Belum ada produk.',

    'prod.detail.title':         'Detail Ponsel',
    'prod.detail.release':       'Rilis {day}/{month}/{year}',
    'prod.detail.section_sales': 'Penjualan',
    'prod.detail.total_sold':    'Total terjual',
    'prod.detail.revenue':       'Pendapatan',
    'prod.detail.stock':         'Stok saat ini',
    'prod.detail.review_avg':    'Ulasan rata-rata',
    'prod.detail.unit':          'unit',
    'prod.detail.section_spec':  'Spesifikasi',
    'prod.detail.spec_screen':   'Layar',
    'prod.detail.spec_camera':   'Kamera',
    'prod.detail.spec_battery':  'Baterai',
    'prod.detail.spec_chip':     'Chip',
    'prod.detail.spec_network':  'Jaringan',
    'prod.detail.spec_body':     'Bodi',
    'prod.detail.spec_os':       'OS',
    'prod.detail.auto_title':    'Pengisian Stok Otomatis',
    'prod.detail.auto_label':    'Aktifkan Auto-Restock',
    'prod.detail.auto_on':       'Sistem akan restock otomatis',
    'prod.detail.auto_off':      'Restock manual',
    'prod.detail.actions_title': 'Aksi',
    'prod.detail.order_btn':     'Pesan Produksi Tambahan',
    'prod.detail.campaign_btn':  'Kampanye Pemasaran',
    'prod.detail.discontinue_btn':'Hentikan Produk',
    'prod.detail.discontinued':  'Produk sudah dihentikan.',
    'prod.detail.close':         'Tutup',

    'prod.campaign.title':   'Pilih Kampanye',
    'prod.campaign.sub':     'Efek diperkuat oleh jumlah Marketer.',
    'prod.campaign.cancel':  'Batal',

    'prod.order.title':      'Produksi Tambahan',
    'prod.order.qty_label':  'Jumlah unit',
    'prod.order.cost_unit':  'Biaya per unit',
    'prod.order.setup':      'Setup cost',
    'prod.order.total':      'Total estimasi',
    'prod.order.submit':     'Pesan',
    'prod.order.cancel':     'Batal',

    'wiz.era_banner_year':   '{year}',
    'wiz.step_of':           'Langkah {n} dari 4 — {title}',
    'wiz.step1.title':       'Nama & Bentuk',
    'wiz.step2.title':       'Komponen',
    'wiz.step3.title':       'OS & Bodi',
    'wiz.step4.title':       'Harga & Produksi',

    'wiz.step1.name_label':  'Nama Ponsel',
    'wiz.step1.name_ph':     'Contoh: X1, Nova, ...',
    'wiz.step1.autofill_btn':'Isi Rekomendasi Otomatis',
    'wiz.step1.autofill_hint':'Pilih komponen terbaik tahun ini & langsung ke Ringkasan.',
    'wiz.step1.ff_label':    'Bentuk (Form Factor)',
    'wiz.step1.ff_tier':     'Tier {tier} • {year}',
    'wiz.step1.cancel':      'Batal',
    'wiz.step1.next':        'Lanjut →',
    'wiz.step1.no_ff':       'Tidak ada form factor tersedia di tahun ini. Riset dulu.',

    'wiz.step2.cat_count':   '({n})',
    'wiz.step2.cat_count_opt':'({n} + opsional)',
    'wiz.step2.no_camera':   'Tanpa Kamera',
    'wiz.step2.no_camera_hint': 'Hemat biaya produksi',
    'wiz.step2.no_item':     'Tanpa {name}',
    'wiz.step2.optional':    'Opsional',
    'wiz.step2.empty':       'Belum ada komponen — riset dulu atau tunggu tahun berikutnya.',
    'wiz.step2.back':        '← Kembali',
    'wiz.step2.next':        'Lanjut →',

    'wiz.step3.os_label':    'Sistem Operasi',
    'wiz.step3.body_label':  'Bodi',
    'wiz.step3.color_label': 'Warna',
    'wiz.step3.os_empty':    'Belum ada OS. Buat OS dulu di tab Riset.',
    'wiz.step3.body_empty':  'Belum ada bodi tersedia.',
    'wiz.step3.color_empty': 'Belum ada warna tersedia.',
    'wiz.step3.os_free':     'Gratis',
    'wiz.step3.back':        '← Kembali',
    'wiz.step3.next':        'Lanjut →',

    'wiz.step4.price_label': 'Harga Jual (USD)',
    'wiz.step4.qty_label':   'Jumlah Produksi Awal',
    'wiz.step4.summary':     'Ringkasan',
    'wiz.step4.back':        '← Kembali',
    'wiz.step4.release':     'Rilis Produk ✓',
    'wiz.step4.price_low':   'Harga < Biaya',

    'wiz.preview.quality':    'Skor Kualitas',
    'wiz.preview.unit_cost':  'Biaya per unit',
    'wiz.preview.total_cost': 'Total biaya',
    'wiz.preview.margin':     'Margin',
    'wiz.preview.demand':     'Estimasi permintaan/hari',
    'wiz.preview.demand_unit':'~{n} unit',
    'wiz.preview.no_camera':  'ℹ Ponsel ini tanpa kamera — pasar mungkin kurang tertarik.',
    'wiz.preview.warn_chip_bat': 'Chip kuat tapi baterai kecil.',
    'wiz.preview.warn_cam_disp': 'Kamera bagus tapi layar kurang.',
    'wiz.preview.warn_margin':   'Harga di bawah biaya produksi!',

    'wiz.detail.title':       'Detail Ponsel',
    'wiz.detail.sub':         '{name} — {year}',
    'wiz.detail.era':         'Era Desain',
    'wiz.detail.milestone':   'Milestone',
    'wiz.detail.section_comp':'Komponen',
    'wiz.detail.spec_ff':     'Bentuk',
    'wiz.detail.spec_screen': 'Layar',
    'wiz.detail.spec_camera': 'Kamera',
    'wiz.detail.spec_battery':'Baterai',
    'wiz.detail.spec_chip':   'Chip',
    'wiz.detail.spec_network':'Jaringan',
    'wiz.detail.spec_body':   'Bodi',
    'wiz.detail.spec_color':  'Warna',
    'wiz.detail.close':       'Tutup',
    'wiz.detail.btn_show':    'Lihat Detail',

    'wiz.err.need_name':      'Isi nama produk.',
    'wiz.err.need_ff':        'Pilih bentuk.',
    'wiz.err.need_comp':      'Lengkapi komponen wajib (layar, baterai, chip, jaringan).',
    'wiz.err.need_os_body':   'Pilih OS, bodi, dan warna.',
    'wiz.err.not_ready':      'Sistem belum siap.',
    'wiz.err.confirm_fail':   'Gagal.',
    'wiz.success.dev_start':  'Pengembangan dimulai!',
    'wiz.success.autofill':   'Rekomendasi terbaik diterapkan!',
    'wiz.warn.autofill_missing': 'Belum tersedia tahun ini: {list}',
    'wiz.err.dev_active':     'Ada produk yang sedang dikembangkan.',

    'wiz.spec.quality':       'Skor',
    'wiz.spec.margin':        'Margin',
    'wiz.spec.screen':        'Layar',
    'wiz.spec.chip':          'Chip',
    'wiz.spec.no_name':       'Tanpa Nama',

    // ============================================================
    // MARKET PANEL
    // ============================================================
    'market.subtab.share':       'Pangsa',
    'market.subtab.competitors': 'Kompetitor',
    'market.subtab.trends':      'Tren',
    'market.subtab.public':      'Publik',

    'market.share.title':        'Pangsa Pasar Anda',
    'market.share.updated':      'Data diperbarui bulanan',
    'market.share.chart_title':  'Grafik Pangsa (24 Bulan)',
    'market.share.chart_empty':  'Data muncul setelah 2 bulan simulasi.',
    'market.share.rank_title':   'Peringkat',
    'market.share.you':          'Anda',
    'market.share.others':       'Pemain lain',

    'market.competitors.empty':  'Belum ada kompetitor',
    'market.competitors.not_ready': 'Sistem kompetitor belum siap',
    'market.comp.share_label':   'pangsa',
    'market.comp.latest':        '📱 Terbaru: {name} ({year})',
    'market.comp.os_tier':       'OS: {os} • Tier {tier}',

    'market.trends.title':       'Sorotan Pasar',
    'market.trends.likes':       'Pasar sedang menyukai <b>{name}</b>.',
    'market.trends.taste':       'Selera Pasar',
    'market.trends.note_title':  'Catatan',
    'market.trends.note_desc':   'Selera pasar berubah perlahan setiap bulan. Produk yang cocok dengan tren akan lebih laris.',

    'market.trend.camera':      'Kamera',
    'market.trend.battery':     'Baterai',
    'market.trend.screen':      'Layar',
    'market.trend.performance': 'Performa',
    'market.trend.design':      'Desain',

    'market.personality.aggressive': '⚔️ Agresif Harga',
    'market.personality.premium':    '💎 Premium',
    'market.personality.innovator':  '💡 Inovator',
    'market.personality.follower':   '🔄 Pengikut',
    'market.personality.dominant':   '👑 Dominan',
    'market.personality.declining':  '📉 Menurun',

    'market.comp_detail.title':      'Detail Kompetitor',
    'market.comp_detail.os':         'OS',
    'market.comp_detail.share':      'Pangsa saat ini',
    'market.comp_detail.tier':       'Tier riset',
    'market.comp_detail.active':     'Aktif sejak',
    'market.comp_detail.latest':     'Rilis terbaru',
    'market.comp_detail.str_weak':   'Kekuatan & Kelemahan',
    'market.comp_detail.signature':  'Produk Ikonik',
    'market.comp_detail.no_sig':     'Belum ada produk ikonik.',
    'market.comp_detail.close':      'Tutup',

    // ============================================================
    // PUBLIC OPINION
    // ============================================================
    'opinion.sentiment.title':       'Sentimen Publik',
    'opinion.sentiment.very_good':   'Sangat Baik',
    'opinion.sentiment.good':        'Baik',
    'opinion.sentiment.neutral':     'Netral',
    'opinion.sentiment.bad':         'Buruk',
    'opinion.sentiment.very_bad':    'Sangat Buruk',

    'opinion.aspects.title':         'Per Aspek',
    'opinion.aspect.design':         'Desain',
    'opinion.aspect.camera':         'Kamera',
    'opinion.aspect.battery':        'Baterai',
    'opinion.aspect.performance':    'Performa',
    'opinion.aspect.price':          'Harga/Nilai',
    'opinion.aspect.reliability':    'Keandalan',
    'opinion.aspect.os':             'OS/Software',
    'opinion.aspect.support':        'Purna Jual',

    'opinion.comparison.title':      'Perbandingan Kepuasan',
    'opinion.comparison.you':        'Anda',

    'opinion.viral.positive':        '✨ Viral Positif',
    'opinion.viral.negative':        '⚠ Viral Negatif',
    'opinion.viral.expires':         'Berakhir dalam ~{n} hari',
    'opinion.viral.respond':        'Pilih Respons',

    'opinion.suggestions.title':     'Saran dari Pelanggan',
    'opinion.suggestions.score':     'Skor aspek: {n}/100',

    'opinion.per_product.title':     'Kepuasan per Produk',

    'opinion.feed.title':            'Feed Ulasan ({n})',
    'opinion.feed.empty':            'Belum ada ulasan',
    'opinion.feed.empty_desc':       'Rilis ponsel dulu agar publik mulai berkomentar.',

    'opinion.viral_modal.title':     'Respons Viral Negatif',
    'opinion.viral_modal.sub':       'Pilih cara menanggapi. Respons kuat butuh biaya.',
    'opinion.viral_modal.free':      'Gratis',
    'opinion.viral_modal.cancel':    'Batal',

    // ============================================================
    // NEWS ARTICLE MODAL
    // ============================================================
    'news_article.by':        'Oleh',
    'news_article.score':     'Penilaian Editor',
    'news_article.from':      'Artikel dari {source} ({type})',
    'news_article.close':     'Tutup Artikel',
    'news_article.redaksi':   'Redaksi',
    'news_article.global':    'Global',

    // ============================================================
    // MONTHLY SUMMARY
    // ============================================================
    'monthly.title':          'Laporan Bulan {month}/{year}',
    'monthly.sub':            'Ringkasan keuangan otomatis.',
    'monthly.income':         'Pemasukan',
    'monthly.salary':         'Gaji tim',
    'monthly.fixed':          'Sewa & utilitas',
    'monthly.loan_interest':  'Bunga pinjaman',
    'monthly.tax':            'Pajak',
    'monthly.net':            'Laba Bersih',
    'monthly.cash_end':       'Saldo akhir',
    'monthly.close':          'Tutup',

    // ============================================================
    // ONBOARDING
    // ============================================================
    'onb.title':              'Selamat Datang',
    'onb.sub':                'Mari mendirikan perusahaan ponsel pertamamu.',
    'onb.name_label':         'Nama perusahaan',
    'onb.diff_label':         'Tingkat kesulitan',
    'onb.diff_santai':        'Santai',
    'onb.diff_santai_desc':   'Modal besar, biaya ringan, kompetitor ramah.',
    'onb.diff_normal':        'Normal',
    'onb.diff_normal_desc':   'Pengalaman standar, seimbang.',
    'onb.diff_sulit':         'Sulit',
    'onb.diff_sulit_desc':    'Modal kecil, biaya tinggi, kompetitor agresif.',
    'onb.submit':             'Mulai Bermain',

    // ============================================================
    // GAME OVER
    // ============================================================
    'gameover.title':         'Perusahaan Bangkrut',
    'gameover.sub':           '{company} tidak bisa bertahan.',
    'gameover.reason':        'Uang negatif selama {n} bulan berturut-turut.',
    'gameover.end_year':      'Tahun berakhir: {year} Bulan {month}',
    'gameover.phones':        'Ponsel dirilis: {n}',
    'gameover.milestones':    'Milestone tercapai: {n}',
    'gameover.restart':       'Mulai Ulang',

    // ============================================================
    // COMPANY PROFILE
    // ============================================================
    'profile.founded':        'Berdiri 2000',
    'profile.era_year':       '{era} • Tahun {year}',
    'profile.kpi_revenue':    'Pendapatan Total',
    'profile.kpi_sold':       'Unit Terjual',
    'profile.kpi_rank':       'Peringkat Pasar',
    'profile.kpi_share':      'Pangsa Pasar',
    'profile.ops_title':      'Ringkasan Operasional',
    'profile.ops_cash':       'Uang tunai',
    'profile.ops_active':     'Produk aktif',
    'profile.ops_staff':      'Total staff',
    'profile.ops_staff_unit': '{n} orang',
    'profile.ops_salary':     'Gaji bulanan',
    'profile.ops_morale':     'Moral rata-rata',
    'profile.ops_rep':        'Reputasi',
    'profile.ops_sentiment':  'Sentimen publik',
    'profile.milestones':     'Pencapaian ({n})',
    'profile.milestones_empty':'Belum ada pencapaian. Terus kembangkan perusahaan!',
    'profile.cloud_title':    '☁️ Cloud Sync',
    'profile.cloud_status':   'Status',
    'profile.cloud_disconnected': 'Belum terhubung',
    'profile.cloud_connecting':   'Menghubungkan...',
    'profile.cloud_connected':    'Tersinkron',
    'profile.cloud_error':        'Gagal terhubung',
    'profile.cloud_desc':     'Sinkronisasi cloud akan hadir di update berikutnya. Save Anda saat ini tersimpan lokal di perangkat.',
    'profile.cloud_btn':      'Atur Cloud (Coming Soon)',

    'profile.era.feature_phone':     'Feature Phone',
    'profile.era.touch_revolution':  'Touch Revolution',
    'profile.era.modern_smartphone': 'Smartphone Modern',
    'profile.era.ai_ecosystem':      'AI & Ecosystem',

    // ============================================================
    // CLOUD STATUS CARD
    // ============================================================
    'cloud.card_title':       'Penyimpanan',
    'cloud.autosave':         '💾 Auto-save lokal aktif (setiap 30 detik).',
    'cloud.sync_unavailable': '☁️ Cloud sync: Belum tersedia',

    // ============================================================
    // QUESTS PANEL
    // ============================================================
    'quests.title':           'Quest ({n} selesai)',
    'quests.empty':           'Semua quest awal selesai 🎉',

    // ============================================================
    // TIME PANEL
    // ============================================================
    'time.title':             'Waktu Simulasi',
    'time.clock':             'Pukul <b>{hh}:{mm}</b>',
    'time.elapsed':           'Total {n} menit game berjalan',
    'time.paused':            'Paused',

    // ============================================================
    // GUIDE PANEL
    // ============================================================
    'guide.glossary_title':   'Glosarium',
    'guide.tips_title':       'Tips Umum',
    'guide.shortcuts_title':  'Pintasan',
    'guide.back':             '← Kembali',

    'guide.term.reputation':  'Reputasi',
    'guide.def.reputation':   'Kepercayaan pasar terhadap perusahaanmu. Mempengaruhi permintaan.',
    'guide.term.share':       'Pangsa Pasar',
    'guide.def.share':        'Persentase penjualanmu dibanding total pasar.',
    'guide.term.quality':     'Kualitas',
    'guide.def.quality':      'Skor gabungan dari komponen & OS ponsel.',
    'guide.term.burnrate':    'Burn Rate',
    'guide.def.burnrate':     'Rata-rata biaya bulanan. Jika uang < 2x burn rate, kamu dalam bahaya.',
    'guide.term.rnd':         'R&D',
    'guide.def.rnd':          'Research & Development — kegiatan riset teknologi.',
    'guide.term.era':         'Era',
    'guide.def.era':          'Periode teknologi: Feature Phone, Touch, Modern, AI.',
    'guide.term.os':          'OS',
    'guide.def.os':           'Sistem operasi. Bisa dikembangkan sendiri atau dilisensi.',
    'guide.term.prototype':   'Prototipe',
    'guide.def.prototype':    'Tahap uji coba sebelum produksi massal.',
    'guide.term.lifecycle':   'Lifecycle',
    'guide.def.lifecycle':    'Siklus hidup produk: naik, puncak, turun.',

    'guide.tip.1':            'Jaga uang tetap > 3 bulan biaya operasional.',
    'guide.tip.2':            'Riset lebih awal membuka komponen murah berkualitas.',
    'guide.tip.3':            'Rekrut Engineer mempercepat riset; Designer menaikkan kualitas produk.',
    'guide.tip.4':            'Jangan lupakan pemasaran saat merilis ponsel.',
    'guide.tip.5':            'Ikuti tren era agar produkmu tidak ketinggalan zaman.',

    // ============================================================
    // FAB PANEL
    // ============================================================
    'fab.title':              '🏭 Fab Panel',
    'fab.sub':                'Kelola pabrik chip Anda',
    'fab.build_title':        '🏭 Bangun Fabrikasi Chip',
    'fab.build_sub':          'Pabrik chip sendiri = biaya per unit lebih murah & kontrol penuh.',
    'fab.need_research':      '⚠ Butuh riset <b>Konstruksi Fab</b> untuk membangun pabrik. Riset tersedia tahun 2010.',
    'fab.building':           '🏗️ Membangun',
    'fab.upgrade':            '⬆️ Upgrade',
    'fab.upgrade_target':     '⬆️ Upgrade ke Level {n}',
    'fab.progress':           'Progress',
    'fab.days_left':          '{n} hari tersisa',
    'fab.cancel_upgrade':     'Batalkan',
    'fab.producing':          '⚙️ Produksi: {name}',
    'fab.producing_units':    '{done} / {total} unit',
    'fab.producing_info':     'Yield {yield}% • Sisa {days} hari',
    'fab.cancel_prod':        'Batalkan Produksi',
    'fab.info_level':         'Level',
    'fab.info_capacity':      'Kapasitas',
    'fab.info_stock':         'Stok chip siap pakai',
    'fab.info_total':         'Total diproduksi',
    'fab.capacity_unit':      '{n} unit/bulan',
    'fab.unit':               'unit',
    'fab.start_prod':         'Mulai Produksi',
    'fab.start_prod_desc':    'Pilih chip untuk diproduksi massal. Kapasitas fab: {cap} unit/bulan.',
    'fab.no_chip':            'Belum ada chip di katalog. Desain chip dulu di Chip Designer.',
    'fab.upgrade_title':      '⬆️ Upgrade Fab',
    'fab.upgrade_target_lbl': 'Target',
    'fab.upgrade_cost':       'Biaya',
    'fab.upgrade_duration':   'Durasi',
    'fab.upgrade_btn':        'Upgrade Fab',
    'fab.upgrade_max':        'Fab sudah di level maksimal.',
    'fab.upgrade_disabled':   'Uang Tidak Cukup',
    'fab.history_title':      'Riwayat Produksi',
    'fab.close':              'Tutup',
    'fab.stat_cost':          'Biaya',
    'fab.stat_duration':      'Durasi',
    'fab.stat_capacity':      'Kapasitas',
    'fab.build_btn':          'Bangun {name}',
    'fab.need_research_btn':  'Butuh riset Fab',
    'fab.no_money':           'Uang tidak cukup',

    'fab.prod_qty_title':     '🏭 Produksi: {name}',
    'fab.prod_qty_sub':       'Target output unit chip',
    'fab.prod_qty_label':     'Jumlah Unit',
    'fab.prod_qty_capacity':  'Kapasitas fab',
    'fab.prod_qty_cost':      'Cost per unit',
    'fab.prod_qty_yield':     'Yield rate',
    'fab.prod_qty_estimate':  'Estimasi biaya',
    'fab.prod_qty_cancel':    'Batal',
    'fab.prod_qty_confirm':   'Produksi',

    // ============================================================
    // CHIP MISC
    // ============================================================
    'chip.arch.tier_desc':    'Tier {tier} • Max {max} core • {year}',
    'chip.node.perf':         'Perf ×{n} • Yield {y}%',

    // ============================================================
    // ACTIVITY PANEL (legacy)
    // ============================================================
    'activity.title':         'Aktivitas Terbaru',
    'activity.founded':       'Hari 1: Perusahaan <b>{name}</b> didirikan.',
    'activity.waiting':       'Menunggu milestone berikutnya.',

    // ============================================================
    // CHART
    // ============================================================
    'chart.sales_title':      'Grafik Penjualan',
    'chart.sales_empty':      'Belum ada penjualan. Rilis produk dulu.',
    'chart.sales_x':          '30 hari terakhir',
    'chart.cash_title':       'Keuangan — 24 Bulan',
    'chart.cash_empty':       'Data muncul setelah 2 bulan simulasi.',

    // ============================================================
    // TUTORIAL OVERLAY
    // ============================================================
    'tut.skip':               'Lewati',
    'tut.next':               'Lanjut',
};
