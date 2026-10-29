// Halaman informasi: [judul-bagian, [paragraf], [butir]]
export const PAGES = {
  id: {
    tentang: { t: 'Tentang Kami', lead: 'Smartphone Empire Berita adalah media daring independen yang meliput dunia smartphone dan gadget: spesifikasi, rumor, dan jadwal rilis, dengan bahasa yang jelas dan sumber yang terbuka.',
      stats: [['4', 'Kanal liputan'], ['3', 'Status kabar: rumor, dikonfirmasi, resmi'], ['2', 'Bahasa: Indonesia & Inggris']],
      s: [
        ['Siapa kami', ['Blog ini dikelola oleh Jurkon Studio, pengembang game Smartphone Empire. Kami menyukai perangkat dan industri di baliknya, dan ingin menyediakan tempat bagi pembaca yang membutuhkan kabar gadget yang rapi, mudah dipahami, dan tidak menyesatkan.', 'Kami bukan pabrikan dan tidak berafiliasi dengan merek mana pun. Posisi ini membuat kami bebas menulis apa adanya.']],
        ['Misi kami', [], ['Menyajikan informasi gadget yang akurat dan mudah dicerna, bukan sekadar mengejar klik.', 'Membedakan dengan tegas antara fakta, kabar yang belum pasti, dan opini.', 'Membantu pembaca mengambil keputusan membeli yang lebih tepat lewat spesifikasi dan konteks yang jujur.']],
        ['Apa yang kami liput', [], ['<b>Rilis</b>: peluncuran perangkat baru dari berbagai produsen.', '<b>Spek</b>: ulasan spesifikasi dan perbandingan antarperangkat.', '<b>Rumor</b>: kabar yang belum dikonfirmasi, selalu berlabel dan disertai sumber.', '<b>Jadwal</b>: tanggal peluncuran dan agenda acara produsen, lengkap dengan status kepastiannya.']],
        ['Cara kami bekerja', ['Setiap artikel disunting sebelum terbit. Tanggal rilis yang belum diumumkan produsen ditandai sebagai <b>Rumor</b> dan baru berubah menjadi <b>Dikonfirmasi</b> atau <b>Resmi</b> setelah ada pernyataan yang dapat ditelusuri. Bila ada kekeliruan, kami memperbaikinya dan mencatat koreksinya.', 'Sebagian draf artikel dapat dibantu alat berbasis AI. Tulisan tersebut tetap diperiksa, disunting, dan diverifikasi oleh redaksi sebelum terbit; tanggung jawab isi tetap pada kami.']],
        ['Independensi dan transparansi', ['Ruang iklan, bila ada, dipisahkan dari konten redaksi dan tidak memengaruhi isi pemberitaan. Harga dan tanggal rilis dapat berubah sewaktu-waktu mengikuti keputusan produsen. Kami juga tidak menerima bayaran untuk mengubah isi atau menaikkan penilaian suatu perangkat.']],
        ['Pengelola dan pembaca', ['Smartphone Empire Berita dikelola oleh Jurkon Studio di Indonesia. Cara kami menangani data pembaca dijelaskan di <a href="#/i/privasi">Kebijakan Privasi</a>.']],
        ['Berhubungan dengan kami', ['Punya koreksi, tips berita, atau ajakan kerja sama? Silakan buka <a href="#/i/kontak">halaman Kontak</a>.']]
      ] },
    redaksi: { t: 'Redaksi', lead: 'Redaksi bertanggung jawab atas seluruh konten yang terbit di Smartphone Empire Berita.',
      s: [
        ['Struktur redaksi', [], ['<b>Penanggung jawab</b>: Jurkon Studio.', '<b>Editor</b>: menyunting, memverifikasi, dan menentukan kelayakan terbit.', '<b>Penulis</b>: menyusun artikel dan mencantumkan sumber.']],
        ['Alur penerbitan', [], ['Artikel disusun dan dilengkapi sumber.', 'Editor memeriksa fakta, label rumor, dan bahasa.', 'Artikel terbit; pembaca dapat mengirim koreksi kapan saja.']],
        ['Koreksi dan hak jawab', ['Bila ada informasi yang keliru atau merugikan, kirimkan keterangan melalui <a href="#/i/kontak">halaman Kontak</a>. Kami akan menelaahnya dan, bila terbukti, memperbaiki artikel serta mencatat perubahannya.']]
      ] },
    etik: { t: 'Kode Etik Jurnalistik', lead: 'Kami berpegang pada prinsip jurnalistik: akurat, berimbang, dan jujur kepada pembaca.',
      s: [
        ['Prinsip utama', [], ['<b>Akurat</b>: fakta diperiksa sebelum terbit dan sumber dicantumkan.', '<b>Berimbang</b>: tidak menghakimi dan tidak memihak produsen tertentu.', '<b>Jelas</b>: rumor, opini, dan fakta dipisahkan secara tegas.', '<b>Independen</b>: pertimbangan editorial tidak dipengaruhi iklan atau kepentingan merek.', '<b>Santun</b>: tidak memuat ujaran kebencian, penghinaan, atau pelanggaran privasi.']],
        ['Penanganan rumor', ['Rumor hanya dimuat bila ada sumber yang dapat ditelusuri, selalu diberi label Rumor, dan diperbarui ketika ada konfirmasi atau bantahan resmi.']],
        ['Hak cipta', ['Kami menghargai karya pihak lain: kutipan dibatasi dan disertai sumber, sedangkan gambar dipakai sesuai izin atau lisensinya.']]
      ] },
    siber: { t: 'Pedoman Media Siber', lead: 'Pedoman ini mengatur isi, komentar, dan tanggung jawab di situs ini, dengan mengacu pada prinsip pedoman pemberitaan media siber.',
      s: [
        ['Isi redaksi', ['Konten redaksi dibuat dan disunting oleh tim kami. Berita yang sudah terbit dapat diperbarui atau dikoreksi, dan perubahan penting dicatat.']],
        ['Komentar pembaca', [], ['Komentar memerlukan akun dan menjadi tanggung jawab penulisnya.', 'Dilarang memuat SARA, ujaran kebencian, pelecehan, spam, atau data pribadi orang lain.', 'Kami berhak menghapus komentar yang melanggar tanpa pemberitahuan.']],
        ['Hak jawab dan koreksi', ['Pihak yang merasa dirugikan dapat mengajukan hak jawab atau koreksi melalui <a href="#/i/kontak">halaman Kontak</a>. Kami akan menanggapinya secepat yang kami bisa.']],
        ['Iklan dan tautan', ['Konten berbayar atau iklan akan ditandai dan dipisahkan dari redaksi. Tautan ke situs lain berada di luar kendali kami.']]
      ] },
    privasi: { t: 'Kebijakan Privasi', lead: 'Kami mengumpulkan data seminimal mungkin dan hanya untuk menjalankan fitur situs.',
      s: [
        ['Data yang kami kumpulkan', [], ['Email dan kata sandi (dikelola penyedia autentikasi) saat Anda mendaftar atau masuk.', 'Nama tampilan, komentar, dan pilihan jajak pendapat yang Anda kirim.', 'Preferensi tema dan bahasa yang disimpan di peramban Anda (penyimpanan lokal).', 'Statistik kunjungan anonim: halaman yang dibuka, situs perujuk (misalnya Google), jenis perangkat (HP, tablet, atau komputer), dan kode acak yang disimpan di peramban untuk menghitung pengunjung unik. Kami tidak menyimpan alamat IP pada statistik ini.']],
        ['Cookie dan penyimpanan lokal', ['Situs ini tidak memakai cookie iklan atau pelacak pihak ketiga. Yang kami simpan di peramban hanyalah preferensi tema dan bahasa, sesi masuk Anda, serta kode statistik acak tersebut. Anda dapat menghapusnya kapan saja lewat pengaturan peramban; fitur tetap berjalan, hanya preferensi Anda yang kembali ke bawaan.']],
        ['Penggunaan data', ['Email dipakai hanya untuk masuk, konfirmasi, dan pemulihan akun. Akun pembaca memakai sistem login yang sama dengan game Smartphone Empire. Statistik kunjungan dipakai hanya untuk memahami artikel mana yang dibaca dan memperbaiki situs, bukan untuk mengenali Anda secara pribadi. Kami tidak menjual data Anda.']],
        ['Penyimpanan dan keamanan', ['Data akun dan komentar disimpan pada layanan basis data pihak ketiga (Supabase) dengan pembatasan akses. Tidak ada sistem yang sepenuhnya kebal, namun kami berupaya menjaganya. Data akun disimpan selama akun aktif dan dihapus atas permintaan Anda.']],
        ['Tautan ke situs lain', ['Artikel dapat memuat tautan sumber ke situs lain. Kebijakan privasi situs tersebut berada di luar kendali kami.']],
        ['Anak-anak', ['Situs ini ditujukan untuk pembaca umum dan tidak dirancang untuk anak di bawah 13 tahun. Bila Anda orang tua dan mengetahui anak Anda membuat akun, hubungi kami agar akunnya dihapus.']],
        ['Hak Anda', ['Anda dapat meminta akses, koreksi, atau penghapusan akun dan data Anda melalui <a href="#/i/kontak">halaman Kontak</a>. Kebijakan ini dapat diperbarui; versi terbaru selalu tampil di halaman ini.']],
        ['Pembaruan terakhir', ['Kebijakan ini terakhir diperbarui pada 29 Oktober 2026.']]
      ] },
    kontak: { t: 'Kontak', lead: 'Kami senang mendengar dari Anda: koreksi, tips berita, hak jawab, atau ajakan kerja sama.', mail: 'Email redaksi',
      s: [
        ['Sampaikan apa', [], ['<b>Koreksi dan hak jawab</b>: sertakan tautan artikel dan bagian yang dimaksud.', '<b>Tips berita</b>: sertakan sumber atau bukti pendukung.', '<b>Kerja sama dan iklan</b>: jelaskan singkat maksud dan jangkauan Anda.', '<b>Privasi dan akun</b>: sebutkan email akun yang terkait.']],
        ['Waktu respons', ['Kami berusaha membalas secepatnya. Mohon bersabar bila pesan Anda belum dijawab pada waktu sibuk.']]
      ] }
  },
  en: {
    tentang: { t: 'About Us', lead: 'Smartphone Empire News is an independent online outlet covering smartphones and gadgets: specs, rumors, and release dates, in clear language with open sourcing.',
      stats: [['4', 'Coverage channels'], ['3', 'News statuses: rumor, confirmed, official'], ['2', 'Languages: Indonesian & English']],
      s: [
        ['Who we are', ['This blog is run by Jurkon Studio, the developer of the game Smartphone Empire. We love devices and the industry behind them, and we want to give readers a place for gadget news that is tidy, easy to follow, and not misleading.', 'We are not a manufacturer and have no affiliation with any brand. That lets us write things as they are.']],
        ['Our mission', [], ['Deliver accurate, easy-to-digest gadget information rather than chasing clicks.', 'Clearly separate fact, unconfirmed reports, and opinion.', 'Help readers buy smarter through honest specs and context.']],
        ['What we cover', [], ['<b>Releases</b>: new device launches from various manufacturers.', '<b>Specs</b>: spec reviews and device comparisons.', '<b>Rumors</b>: unconfirmed reports, always labeled and sourced.', '<b>Schedule</b>: launch dates and manufacturer event agendas, with their confirmation status.']],
        ['How we work', ['Every article is edited before publication. Release dates not yet announced by a manufacturer are marked <b>Rumor</b>, and only become <b>Confirmed</b> or <b>Official</b> once there is a traceable statement. If we get something wrong, we fix it and note the correction.', 'Some article drafts may be assisted by AI-based tools. Such pieces are still checked, edited, and verified by our editors before publication; responsibility for the content stays with us.']],
        ['Independence and transparency', ['Ad space, if any, is kept separate from editorial content and does not influence our reporting. Prices and release dates may change at any time at the manufacturer’s discretion. We also do not accept payment to change coverage or to inflate the rating of any device.']],
        ['Publisher and readers', ['Smartphone Empire News is run by Jurkon Studio in Indonesia. How we handle reader data is explained in our <a href="#/i/privasi">Privacy Policy</a>.']],
        ['Get in touch', ['Have a correction, a news tip, or a partnership idea? Visit the <a href="#/i/kontak">Contact page</a>.']]
      ] },
    redaksi: { t: 'Editorial Team', lead: 'The editorial team is responsible for all content published on Smartphone Empire News.',
      s: [
        ['Editorial structure', [], ['<b>Publisher</b>: Jurkon Studio.', '<b>Editors</b>: edit, verify, and decide what is fit to publish.', '<b>Writers</b>: draft articles and cite their sources.']],
        ['Publishing workflow', [], ['An article is drafted and sourced.', 'An editor checks the facts, rumor labels, and language.', 'The article goes live; readers can send corrections at any time.']],
        ['Corrections and right of reply', ['If something is wrong or harmful, send details via the <a href="#/i/kontak">Contact page</a>. We will review it and, if verified, correct the article and note the change.']]
      ] },
    etik: { t: 'Journalistic Code of Ethics', lead: 'We hold to journalistic principles: accurate, balanced, and honest with our readers.',
      s: [
        ['Core principles', [], ['<b>Accurate</b>: facts are checked before publication and sources are cited.', '<b>Balanced</b>: no prejudgment and no favoritism toward any manufacturer.', '<b>Clear</b>: rumor, opinion, and fact are firmly separated.', '<b>Independent</b>: editorial decisions are not swayed by ads or brand interests.', '<b>Respectful</b>: no hate speech, insults, or privacy violations.']],
        ['Handling rumors', ['Rumors are published only with a traceable source, always carry the Rumor label, and are updated when an official confirmation or denial appears.']],
        ['Copyright', ['We respect others’ work: quotations are limited and sourced, and images are used with permission or under license.']]
      ] },
    siber: { t: 'Cyber Media Guidelines', lead: 'These guidelines cover content, comments, and responsibility on this site, following the principles of online media reporting guidelines.',
      s: [
        ['Editorial content', ['Editorial content is produced and edited by our team. Published stories may be updated or corrected, and significant changes are noted.']],
        ['Reader comments', [], ['Commenting requires an account, and comments are the responsibility of their authors.', 'Prohibited: ethnic, religious, or racial attacks, hate speech, harassment, spam, or others’ personal data.', 'We may remove violating comments without notice.']],
        ['Right of reply and corrections', ['Anyone who feels harmed may file a right of reply or correction via the <a href="#/i/kontak">Contact page</a>. We will respond as quickly as we can.']],
        ['Ads and links', ['Sponsored content or ads will be labeled and kept separate from editorial. Links to other sites are outside our control.']]
      ] },
    privasi: { t: 'Privacy Policy', lead: 'We collect as little data as possible, and only to run the site’s features.',
      s: [
        ['Data we collect', [], ['Email and password (handled by the authentication provider) when you sign up or log in.', 'Display name, comments, and poll votes you submit.', 'Theme and language preferences stored in your browser (local storage).', 'Anonymous visit statistics: pages opened, referring site (for example Google), device type (phone, tablet, or computer), and a random code stored in your browser to count unique visitors. We do not store IP addresses in these statistics.']],
        ['Cookies and local storage', ['This site uses no advertising or third-party tracking cookies. All we keep in your browser is your theme and language preferences, your login session, and the random statistics code above. You can clear them at any time in your browser settings; features keep working, only your preferences return to defaults.']],
        ['How we use it', ['Your email is used only for login, confirmation, and account recovery. Reader accounts use the same login system as the Smartphone Empire game. Visit statistics are used only to understand which articles are read and to improve the site, not to identify you personally. We do not sell your data.']],
        ['Storage and security', ['Account and comment data are stored on a third-party database service (Supabase) with access restrictions. No system is completely immune, but we work to protect yours. Account data is kept while your account is active and deleted on request.']],
        ['Links to other sites', ['Articles may link to sources on other sites. Those sites’ privacy policies are outside our control.']],
        ['Children', ['This site is intended for a general audience and is not designed for children under 13. If you are a parent and know your child has created an account, contact us so we can delete it.']],
        ['Your rights', ['You can request access, correction, or deletion of your account and data via the <a href="#/i/kontak">Contact page</a>. This policy may be updated; the latest version is always shown here.']],
        ['Last updated', ['This policy was last updated on 29 October 2026.']]
      ] },
    kontak: { t: 'Contact', lead: 'We would love to hear from you: corrections, news tips, right of reply, or partnership ideas.', mail: 'Editorial email',
      s: [
        ['What to send', [], ['<b>Corrections and right of reply</b>: include the article link and the passage in question.', '<b>News tips</b>: include a source or supporting evidence.', '<b>Partnerships and ads</b>: briefly describe your proposal and reach.', '<b>Privacy and accounts</b>: mention the email tied to your account.']],
        ['Response time', ['We try to reply as soon as possible. Please be patient if we are slow during busy periods.']]
      ] }
  }
};
