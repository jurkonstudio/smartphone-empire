// FILE: src/data/news-headlines.data.js
// ============================================================
// HEADLINE BULANAN — peristiwa teknologi/ponsel dunia nyata.
// Rentang: Januari 2000 – Desember 2026.
//
// Field:
//   year, month  → kapan headline muncul
//   headline     → judul utama (1 baris)
//   source       → nama outlet (harus ada di news.data.js)
//   sourceId     → ID outlet
//   tone         → 'positive' | 'mixed' | 'negative'
//   text         → ringkasan 2-3 kalimat
//   tags         → untuk pencarian/filter
//   era          → era teknologi (firmware/touch/modern/ai_era)
//   speculative  → true kalau belum terverifikasi
// ============================================================

export const MONTHLY_HEADLINES = [
    // ==================== 2000 ====================
    { year: 2000, month: 1, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'positive', era: 'firmware', tags: ['nokia', 'feature_phone'],
      headline: 'Pasar ponsel global menyambut era baru: 400 juta unit diprediksi terjual tahun ini',
      text: 'Industri telekomunikasi memasuki tahun 2000 dengan optimisme tinggi. Nokia dan Motorola memimpin pasar, sementara penetrasi ponsel di Eropa dan Asia terus tumbuh cepat.' },

    { year: 2000, month: 2, source: 'Asia Mobile Review', sourceId: 'asiamobile_jp', tone: 'positive', era: 'firmware', tags: ['japan', 'i-mode'],
      headline: 'i-Mode Jepang cetak rekor: 10 juta pelanggan layanan internet mobile',
      text: 'Layanan internet mobile NTT DoCoMo terus mendominasi Jepang. Model bisnis i-Mode menjadi perhatian industri global sebagai masa depan ponsel.' },

    { year: 2000, month: 3, source: 'MobileWeek Europe', sourceId: 'mobileweek_uk', tone: 'mixed', era: 'firmware', tags: ['wAp', 'europe'],
      headline: 'WAP masih cari bentuk: pengguna Eropa keluhkan koneksi lambat dan biaya tinggi',
      text: 'Teknologi WAP yang digadang-gadang sebagai "internet di ponsel" masih jauh dari harapan. Operator dan vendor berjanji perbaikan di generasi berikutnya.' },

    { year: 2000, month: 4, source: 'Der Mobilfunk', sourceId: 'mobilfunk_de', tone: 'mixed', era: 'firmware', tags: ['umts', '3g'],
      headline: 'Lelang lisensi UMTS di Jerman capai rekor €50 miliar',
      text: 'Enam operator telekomunikasi bersaing sengit untuk memperoleh lisensi 3G. Harga tinggi memicu kekhawatiran akan beban utang jangka panjang industri.' },

    { year: 2000, month: 5, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'mixed', era: 'firmware', tags: ['ericsson', 't28'],
      headline: 'Ericsson T28: ponsel tertipis di dunia dengan antena internal',
      text: 'Ericsson memperkenalkan T28 yang menjadi sorotan karena profilnya yang tipis. Persaingan desain ponsel semakin ketat di pasar premium.' },

    { year: 2000, month: 6, source: 'Seoul Tech Daily', sourceId: 'seoultech_kr', tone: 'positive', era: 'firmware', tags: ['samsung', 'korea'],
      headline: 'Samsung memperluas produksi layar warna untuk pasar ponsel global',
      text: 'Samsung Electronics meningkatkan kapasitas produksi panel TFT-LCD untuk ponsel. Perusahaan Korea ini menargetkan menjadi pemasok komponen utama industri.' },

    { year: 2000, month: 7, source: 'MobileWeek Europe', sourceId: 'mobileweek_uk', tone: 'mixed', era: 'firmware', tags: ['sms', 'europe'],
      headline: 'SMS jadi fenomena: 15 miliar pesan terkirim di Eropa sepanjang 2000',
      text: 'Layanan pesan singkat yang awalnya dianggap fitur tambahan kini menjadi sumber pendapatan utama operator. Remaja menjadi pengguna paling aktif.' },

    { year: 2000, month: 8, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'positive', era: 'firmware', tags: ['nokia', '3310'],
      headline: 'Nokia 3310 jadi fenomena: ponsel tahan banting dengan game Snake II',
      text: 'Ponsel ini viral karena daya tahan, baterai awet, dan game Snake II. Nokia mengukuhkan posisinya sebagai pemimpin pasar ponsel global.' },

    { year: 2000, month: 9, source: 'Asia Mobile Review', sourceId: 'asiamobile_jp', tone: 'mixed', era: 'firmware', tags: ['japan', 'camera_phone'],
      headline: 'Ponsel berkamera mulai muncul di Jepang, tapi masih lambat diadopsi',
      text: 'J-Phone memperkenalkan ponsel kamera pertama dengan resolusi rendah. Pasar masih ragu, tapi industri melihat potensi besar di masa depan.' },

    { year: 2000, month: 10, source: 'Der Mobilfunk', sourceId: 'mobilfunk_de', tone: 'negative', era: 'firmware', tags: ['dotcom', 'crash'],
      headline: 'Gelembung dot-com pecah, saham perusahaan teknologi jatuh tajam',
      text: 'Krisis pasar keuangan mulai memengaruhi sektor teknologi. Beberapa perusahaan telekomunikasi dan startup internet terancam bangkrut.' },

    { year: 2000, month: 11, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'positive', era: 'firmware', tags: ['symbian', 'psion'],
      headline: 'Symbian OS v6.0 resmi diluncurkan untuk ponsel pintar generasi baru',
      text: 'Sistem operasi gabungan Nokia, Ericsson, Motorola, dan Psion siap menjadi standar smartphone Eropa. Symbian menjanjikan aplikasi kaya dan multitasking.' },

    { year: 2000, month: 12, source: 'MobileWeek Europe', sourceId: 'mobileweek_uk', tone: 'mixed', era: 'firmware', tags: ['nokia', 'market'],
      headline: 'Nokia tutup tahun dengan pangsa 32%, tapi pesaing mulai menekan',
      text: 'Nokia mempertahankan dominasi pasar ponsel, meski Motorola, Ericsson, dan Samsung terus agresif. Industri bersiap menghadapi tahun 2001 yang menantang.' },

    // ==================== 2001 ====================
    { year: 2001, month: 1, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'mixed', era: 'firmware', tags: ['dotcom', 'layoffs'],
      headline: 'PHK besar-besaran di perusahaan teknologi global terus berlanjut',
      text: 'Dampak krisis dot-com masih terasa. Ribuan pekerja di sektor telekomunikasi dan internet kehilangan pekerjaan di awal 2001.' },

    { year: 2001, month: 2, source: 'Asia Mobile Review', sourceId: 'asiamobile_jp', tone: 'positive', era: 'firmware', tags: ['3g', 'japan'],
      headline: 'Jepang jadi negara pertama dengan layanan 3G komersial',
      text: 'NTT DoCoMo meluncurkan layanan FOMA berbasis 3G. Meski awal terbatas, ini menandai awal era baru konektivitas mobile.' },

    { year: 2001, month: 3, source: 'MobileWeek Europe', sourceId: 'mobileweek_uk', tone: 'positive', era: 'firmware', tags: ['nokia', 'game'],
      headline: 'Nokia meluncurkan platform game mobile: industri baru untuk pengembang',
      text: 'Nokia memperkenalkan N-Gage konsep dan platform game mobile. Pengembang Java mulai melirik ponsel sebagai target baru.' },

    { year: 2001, month: 4, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'mixed', era: 'firmware', tags: ['motorola', 'layoffs'],
      headline: 'Motorola tutup beberapa pabrik, fokus ke ponsel mid-range',
      text: 'Tekanan pasar memaksa Motorola merestrukturisasi. Perusahaan beralih dari strategi volume ke margin di segmen tertentu.' },

    { year: 2001, month: 5, source: 'Seoul Tech Daily', sourceId: 'seoultech_kr', tone: 'positive', era: 'firmware', tags: ['samsung', 'cdma'],
      headline: 'Samsung ekspansi agresif di pasar CDMA Asia',
      text: 'Samsung Electronics memperluas jangkauan di Korea, Tiongkok, dan India. Strategi mereka menantang dominasi Nokia di beberapa segmen.' },

    { year: 2001, month: 6, source: 'Der Mobilfunk', sourceId: 'mobilfunk_de', tone: 'mixed', era: 'firmware', tags: ['gprs', 'europe'],
      headline: 'GPRS mulai diadopsi di Eropa, tapi pengguna masih bingung',
      text: 'Operator Eropa memperkenalkan layanan data paket GPRS. Namun edukasi pasar dinilai kurang, dan tarif masih membingungkan pengguna.' },

    { year: 2001, month: 7, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'mixed', era: 'firmware', tags: ['3g', 'spectrum'],
      headline: 'Operator Eropa menunda peluncuran 3G karena biaya infrastruktur',
      text: 'Mahalnya lisensi dan perangkat memaksa beberapa operator menunda jadwal 3G. Investor mulai mempertanyakan model bisnis baru.' },

    { year: 2001, month: 8, source: 'Asia Mobile Review', sourceId: 'asiamobile_jp', tone: 'positive', era: 'firmware', tags: ['camera', 'japan'],
      headline: 'Ponsel kamera mulai merambah pasar massal Jepang',
      text: 'J-Phone dan NEC merilis ponsel kamera dengan resolusi lebih tinggi. Foto mobile mulai menggantikan kamera digital sederhana di kalangan konsumen.' },

    { year: 2001, month: 9, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'negative', era: 'firmware', tags: ['911', 'usa'],
      headline: 'Tragedi 11 September: jaringan telekomunikasi AS terhenti sementara',
      text: 'Serangan teroris di New York dan Washington mengganggu layanan seluler dan komunikasi. Industri telekomunikasi ikut merasakan dampak ekonominya.' },

    { year: 2001, month: 10, source: 'MobileWeek Europe', sourceId: 'mobileweek_uk', tone: 'mixed', era: 'firmware', tags: ['nokia', 'market'],
      headline: 'Nokia perkirakan pertumbuhan pasar ponsel melambat di 2002',
      text: 'Nokia memperingatkan investor tentang perlambatan pertumbuhan. Permintaan di Amerika dan Eropa melemah pasca serangan 9/11.' },

    { year: 2001, month: 11, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'positive', era: 'firmware', tags: ['nokia', '3650'],
      headline: 'Nokia 7650: ponsel Symbian pertama dengan kamera terintegrasi',
      text: 'Nokia memperkenalkan 7650 sebagai ponsel pintar pertama dengan kamera internal. Ini menandai babak baru dalam evolusi smartphone.' },

    { year: 2001, month: 12, source: 'Der Mobilfunk', sourceId: 'mobilfunk_de', tone: 'mixed', era: 'firmware', tags: ['year_end', 'europe'],
      headline: 'Pasar ponsel Eropa tumbuh datar di 2001, produsen bersiap 2002',
      text: 'Setelah tahun 2000 yang cemerlang, 2001 menjadi tahun konsolidasi. Nokia masih pemimpin, tapi tekanan dari Samsung dan Motorola meningkat.' },

    // ==================== 2002 ====================
    { year: 2002, month: 1, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'mixed', era: 'firmware', tags: ['color_screen', 'europe'],
      headline: 'Layar warna jadi standar baru ponsel menengah di Eropa',
      text: 'Ponsel dengan layar warna TFT mulai umum di segmen mid-range. Konsumen mulai menuntut fitur multimedia dan Java.' },

    { year: 2002, month: 2, source: 'Asia Mobile Review', sourceId: 'asiamobile_jp', tone: 'positive', era: 'firmware', tags: ['sharp', 'camera'],
      headline: 'Sharp J-SH04: ponsel kamera pertama yang sukses massal',
      text: 'Sharp memproduksi ponsel kamera pertama dengan adopsi luas di Jepang. Industri global menyadari potensi besar ponsel berkamera.' },

    { year: 2002, month: 3, source: 'MobileWeek Europe', sourceId: 'mobileweek_uk', tone: 'positive', era: 'firmware', tags: ['symbian', 'nokia'],
      headline: 'Symbian S60 v1.0 resmi digunakan di Nokia 7650',
      text: 'Platform S60 menjadi dasar banyak ponsel pintar Nokia. Ini memperkuat dominasi Symbian sebagai OS smartphone paling populer.' },

    { year: 2002, month: 4, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'mixed', era: 'firmware', tags: ['handspring', 'treo'],
      headline: 'Handspring Treo: PDA dan ponsel mulai berbaur',
      text: 'Perangkat PDA-phone seperti Treo menyasar profesional muda. Kategori "smartphone" perlahan terbentuk, meski pasar masih ceruk.' },

    { year: 2002, month: 5, source: 'Seoul Tech Daily', sourceId: 'seoultech_kr', tone: 'positive', era: 'firmware', tags: ['samsung', 'color'],
      headline: 'Samsung SGH-T100: ponsel layar warna pertama yang sukses global',
      text: 'Samsung mencatat penjualan besar untuk SGH-T100. Layar warna menjadi fitur pembeda di pasar ponsel.' },

    { year: 2002, month: 6, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'negative', era: 'firmware', tags: ['worldcom', 'scandal'],
      headline: 'Skandal akuntansi WorldCom guncang industri telekomunikasi',
      text: 'Kebangkrutan WorldCom menambah krisis kepercayaan investor di sektor telekomunikasi. Perusahaan lain ikut waspada.' },

    { year: 2002, month: 7, source: 'MobileWeek Europe', sourceId: 'mobileweek_uk', tone: 'positive', era: 'firmware', tags: ['mms', 'multimedia'],
      headline: 'MMS mulai diadopsi: era pesan multimedia dimulai',
      text: 'Pesan multimedia MMS mulai diluncurkan operator Eropa. Fitur ini memungkinkan pengiriman foto dan klip pendek antar ponsel.' },

    { year: 2002, month: 8, source: 'Asia Mobile Review', sourceId: 'asiamobile_jp', tone: 'mixed', era: 'firmware', tags: ['japan', '3g'],
      headline: 'Pelanggan FOMA Jepang tumbuh lambat karena ponsel mahal',
      text: 'Meski 3G sudah tersedia, harga perangkat dan keterbatasan cakupan menghambat adopsi. NTT DoCoMo harus revisi strategi.' },

    { year: 2002, month: 9, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'positive', era: 'firmware', tags: ['nokia', 'camera'],
      headline: 'Nokia 7650 dengan kamera dan Symbian mulai dikirim global',
      text: 'Ponsel ini menjadi salah satu smartphone paling inovatif tahun 2002. Symbian dan kamera jadi kombinasi menarik bagi pengguna awal.' },

    { year: 2002, month: 10, source: 'Der Mobilfunk', sourceId: 'mobilfunk_de', tone: 'mixed', era: 'firmware', tags: ['ericsson', 'sony'],
      headline: 'Sony Ericsson resmi berdiri setelah penggabungan dua raksasa',
      text: 'Joint venture Sony dan Ericsson mulai beroperasi. Perusahaan gabungan ini membidik pasar ponsel kamera dan musik.' },

    { year: 2002, month: 11, source: 'MobileWeek Europe', sourceId: 'mobileweek_uk', tone: 'positive', era: 'firmware', tags: ['gaming', 'nokia'],
      headline: 'Nokia N-Gage: upaya ambisius menggabungkan ponsel dan konsol game',
      text: 'Nokia mengumumkan N-Gage sebagai platform game mobile. Meski nantinya kurang sukses, inovasi ini menandai eksplorasi baru industri.' },

    { year: 2002, month: 12, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'positive', era: 'firmware', tags: ['market', 'year_end'],
      headline: 'Penjualan ponsel global 2002 capai 400 juta unit, tumbuh stabil',
      text: 'Industri ponsel menutup tahun dengan pertumbuhan moderat. Nokia, Samsung, dan Motorola memimpin, sementara pasar ponsel kamera mulai mekar.' },

    // ==================== 2003 ====================
    { year: 2003, month: 1, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'mixed', era: 'firmware', tags: ['smartphone', 'evolution'],
      headline: 'Industri ponsel bersiap untuk tahun "kamera di setiap ponsel"',
      text: 'Produsen mulai mengintegrasikan kamera sebagai fitur standar. Analis memprediksi adopsi kamera mobile akan meledak di 2003.' },

    { year: 2003, month: 2, source: 'Asia Mobile Review', sourceId: 'asiamobile_jp', tone: 'positive', era: 'firmware', tags: ['sharp', 'camera'],
      headline: 'Sharp luncurkan ponsel kamera 1MP pertama untuk pasar konsumen',
      text: 'Resolusi kamera ponsel mulai menyamai kamera digital entry-level. Jepang masih menjadi pasar paling inovatif untuk kamera mobile.' },

    { year: 2003, month: 3, source: 'MobileWeek Europe', sourceId: 'mobileweek_uk', tone: 'positive', era: 'firmware', tags: ['symbian', 'nokia'],
      headline: 'Symbian kuasai 70% pasar smartphone Eropa',
      text: 'Symbian OS semakin dominan di segmen ponsel pintar. Nokia, Sony Ericsson, dan Motorola berkomitmen pada platform ini.' },

    { year: 2003, month: 4, source: 'Der Mobilfunk', sourceId: 'mobilfunk_de', tone: 'positive', era: 'firmware', tags: ['tft', 'color'],
      headline: 'Layar TFT 65 ribu warna jadi standar ponsel mid-range',
      text: 'Kualitas layar ponsel terus meningkat. Konsumen mulai menganggap layar warna sebagai fitur wajib, bukan tambahan.' },

    { year: 2003, month: 5, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'mixed', era: 'firmware', tags: ['motorola', 'design'],
      headline: 'Motorola dan Nokia bersaing ketat di desain clamshell',
      text: 'Desain ponsel lipat menjadi tren. Pabrikan berusaha menghadirkan perangkat lebih tipis dan stylish untuk segmen premium.' },

    { year: 2003, month: 6, source: 'Seoul Tech Daily', sourceId: 'seoultech_kr', tone: 'positive', era: 'firmware', tags: ['samsung', 'clamshell'],
      headline: 'Samsung SGH-E700: clamshell dengan kamera dan layar eksternal',
      text: 'Samsung memperkuat posisinya di segmen clamshell premium. Desain dan fitur kamera menjadi daya tarik utama.' },

    { year: 2003, month: 7, source: 'MobileWeek Europe', sourceId: 'mobileweek_uk', tone: 'positive', era: 'firmware', tags: ['edge', 'network'],
      headline: 'Jaringan EDGE mulai diuji di Eropa: langkah menuju data lebih cepat',
      text: 'Operator mulai menguji EDGE sebagai jembatan menuju 3G. Kecepatan data lebih tinggi menjanjikan layanan mobile baru.' },

    { year: 2003, month: 8, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'positive', era: 'firmware', tags: ['nokia', 'ngage'],
      headline: 'Nokia N-Gage resmi dijual, meski desainnya dikritik',
      text: 'Nokia mencoba memasuki pasar konsol game mobile. Penerimaan pasar campuran, tapi inovasi tetap dihargai.' },

    { year: 2003, month: 9, source: 'Asia Mobile Review', sourceId: 'asiamobile_jp', tone: 'positive', era: 'firmware', tags: ['3g', 'japan'],
      headline: 'Pelanggan 3G Jepang tembus 10 juta, tercepat di dunia',
      text: 'NTT DoCoMo dan KDDI mencatat adopsi 3G cepat. Layanan video call dan musik mobile mendorong pertumbuhan.' },

    { year: 2003, month: 10, source: 'MobileWeek Europe', sourceId: 'mobileweek_uk', tone: 'positive', era: 'firmware', tags: ['vodafone', '3g'],
      headline: 'Vodafone luncurkan layanan 3G komersial pertama di Eropa',
      text: 'Eropa menyusul Jepang dalam adopsi 3G. Operator besar berkompetisi menyediakan konten dan layanan mobile baru.' },

    { year: 2003, month: 11, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'mixed', era: 'firmware', tags: ['motorola', 'china'],
      headline: 'Produsen ponsel Tiongkok mulai muncul di pasar global',
      text: 'Brand lokal seperti Ningbo Bird dan TCL mulai mengancam produsen besar di pasar berkembang. Persaingan harga menjadi sengit.' },

    { year: 2003, month: 12, source: 'Seoul Tech Daily', sourceId: 'seoultech_kr', tone: 'positive', era: 'firmware', tags: ['market', 'year_end'],
      headline: 'Industri ponsel tutup 2003 dengan 520 juta unit terjual',
      text: 'Pertumbuhan industri lebih kuat dari perkiraan. Kamera mobile menjadi fitur pendorong utama penjualan.' },

    // ==================== 2004 ====================
    { year: 2004, month: 1, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'positive', era: 'firmware', tags: ['3g', 'global'],
      headline: 'Tahun 2004 diprediksi jadi tahun 3G global',
      text: 'Operator di seluruh dunia berlomba menggelar 3G. Vendor ponsel bersiap dengan model-model baru yang mendukung video call.' },

    { year: 2004, month: 2, source: 'MobileWeek Europe', sourceId: 'mobileweek_uk', tone: 'positive', era: 'firmware', tags: ['motorola', 'razr'],
      headline: 'Motorola RAZR V3: desain super tipis mencuri perhatian',
      text: 'Motorola memukau industri dengan RAZR V3 yang tipis dan stylish. Ponsel ini jadi ikon fesyen teknologi.' },

    { year: 2004, month: 3, source: 'Asia Mobile Review', sourceId: 'asiamobile_jp', tone: 'positive', era: 'firmware', tags: ['camera', 'high_res'],
      headline: 'Ponsel kamera 2MP mulai muncul di pasar Jepang',
      text: 'Resolusi kamera ponsel terus naik. Konsumen Jepang mulai menganggap ponsel kamera sebagai pengganti kamera digital.' },

    { year: 2004, month: 4, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'mixed', era: 'firmware', tags: ['nokia', 'clamshell'],
      headline: 'Nokia hadapi kritik karena lambat di desain clamshell',
      text: 'Nokia dituduh kalah inovasi dari Motorola di segmen clamshell. Perusahaan berjanji memperbaiki lini produknya.' },

    { year: 2004, month: 5, source: 'Der Mobilfunk', sourceId: 'mobilfunk_de', tone: 'positive', era: 'firmware', tags: ['siemens', 'europe'],
      headline: 'Siemens dan BenQ jalin kerja sama produksi ponsel',
      text: 'Siemens berusaha memperkuat posisinya di pasar ponsel. Kemitraan dengan BenQ diharapkan menurunkan biaya produksi.' },

    { year: 2004, month: 6, source: 'Seoul Tech Daily', sourceId: 'seoultech_kr', tone: 'positive', era: 'firmware', tags: ['samsung', 'market'],
      headline: 'Samsung naik ke posisi kedua pasar ponsel global',
      text: 'Samsung menyalip Motorola sebagai pemain nomor dua. Strategi portofolio luas di banyak segmen terbukti efektif.' },

    { year: 2004, month: 7, source: 'MobileWeek Europe', sourceId: 'mobileweek_uk', tone: 'positive', era: 'firmware', tags: ['motorola', 'razr'],
      headline: 'Motorola RAZR V3 jadi ponsel paling dicari di Eropa',
      text: 'RAZR V3 menghadirkan kombinasi desain dan fitur yang memikat. Motorola berhasil merebut kembali pangsa pasar premium.' },

    { year: 2004, month: 8, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'positive', era: 'firmware', tags: ['nokia', 'clamshell'],
      headline: 'Nokia perkenalkan lini clamshell untuk menjawab persaingan',
      text: 'Nokia merilis model lipat untuk pertama kalinya. Perusahaan berusaha menutup celah di segmen yang dikuasai Motorola.' },

    { year: 2004, month: 9, source: 'Asia Mobile Review', sourceId: 'asiamobile_jp', tone: 'mixed', era: 'firmware', tags: ['sony_ericsson', 'music'],
      headline: 'Sony Ericsson Walkman Phone: musik di ponsel mulai populer',
      text: 'Sony Ericsson berencana menghadirkan ponsel Walkman. Kombinasi musik dan ponsel dianggap masa depan konsumen mobile.' },

    { year: 2004, month: 10, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'positive', era: 'firmware', tags: ['market', 'record'],
      headline: 'Penjualan ponsel global triwulan III cetak rekor',
      text: 'Pertumbuhan penjualan ponsel jauh melampaui perkiraan. Nokia, Samsung, dan Motorola memperkuat dominasi mereka.' },

    { year: 2004, month: 11, source: 'MobileWeek Europe', sourceId: 'mobileweek_uk', tone: 'positive', era: 'firmware', tags: ['3g', 'europe'],
      headline: 'Pelanggan 3G Eropa tembus 5 juta',
      text: 'Adopsi 3G mulai berjalan lebih cepat di Eropa. Operator mengembangkan konten video dan musik mobile.' },

    { year: 2004, month: 12, source: 'Der Mobilfunk', sourceId: 'mobilfunk_de', tone: 'mixed', era: 'firmware', tags: ['siemens', 'exit'],
      headline: 'Siemens hengkang dari pasar ponsel konsumen',
      text: 'Siemens menjual divisi ponselnya ke BenQ. Ini menandai mundurnya salah satu pemain lama dari industri ponsel global.' },

    // ==================== 2005 ====================
    { year: 2005, month: 1, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'positive', era: 'firmware', tags: ['3g', 'global'],
      headline: 'Tahun 2005: fokus industri pada 3G, musik, dan kamera',
      text: 'Produsen ponsel bersiap mengintegrasikan kamera resolusi tinggi, pemutar musik, dan konektivitas 3G dalam satu perangkat.' },

    { year: 2005, month: 2, source: 'Asia Mobile Review', sourceId: 'asiamobile_jp', tone: 'positive', era: 'firmware', tags: ['camera', '3mp'],
      headline: 'Ponsel kamera 3MP mulai muncul di pasar Jepang',
      text: 'Resolusi kamera ponsel terus meningkat. Jepang masih memimpin dalam adopsi ponsel kamera high-end.' },

    { year: 2005, month: 3, source: 'MobileWeek Europe', sourceId: 'mobileweek_uk', tone: 'positive', era: 'firmware', tags: ['sony_ericsson', 'walkman'],
      headline: 'Sony Ericsson W800 Walkman Phone resmi diluncurkan',
      text: 'Kombinasi ponsel dan pemutar musik ini viral. Sony Ericsson mengukuhkan posisinya di segmen musik mobile.' },

    { year: 2005, month: 4, source: 'Seoul Tech Daily', sourceId: 'seoultech_kr', tone: 'positive', era: 'firmware', tags: ['samsung', 'market'],
      headline: 'Samsung perkuat dominasi di layar AMOLED generasi awal',
      text: 'Samsung mengembangkan teknologi layar OLED untuk ponsel. Ini menjadi langkah awal dominasi teknologi panel masa depan.' },

    { year: 2005, month: 5, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'mixed', era: 'firmware', tags: ['motorola', 'razr'],
      headline: 'Motorola RAZR tetap populer, tapi margin menipis',
      text: 'Meski penjualan tinggi, harga RAZR mulai turun. Motorola harus mencari penerus yang lebih inovatif.' },

    { year: 2005, month: 6, source: 'MobileWeek Europe', sourceId: 'mobileweek_uk', tone: 'positive', era: 'firmware', tags: ['nokia', 'nseries'],
      headline: 'Nokia Nseries: keluarga ponsel multimedia premium diperkenalkan',
      text: 'Nokia memperkenalkan lini N-series untuk pengguna multimedia. Fokus pada kamera, musik, dan video.' },

    { year: 2005, month: 7, source: 'Der Mobilfunk', sourceId: 'mobilfunk_de', tone: 'mixed', era: 'firmware', tags: ['benq', 'siemens'],
      headline: 'BenQ-Siemens mulai produksi ponsel bersama',
      text: 'Merek gabungan BenQ-Siemens muncul di pasar. Tantangan besar bagi keduanya untuk bersaing dengan pemain mapan.' },

    { year: 2005, month: 8, source: 'Asia Mobile Review', sourceId: 'asiamobile_jp', tone: 'positive', era: 'firmware', tags: ['3g', 'japan'],
      headline: '3G jadi standar di Jepang: 40 juta pelanggan',
      text: 'Adopsi 3G di Jepang mencapai titik kritis. Layanan mobile TV dan video call menjadi fitur umum.' },

    { year: 2005, month: 9, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'positive', era: 'firmware', tags: ['apple', 'ipod'],
      headline: 'Apple dan Motorola kolaborasi ponsel musik ROKR',
      text: 'Apple merambah dunia ponsel lewat kerja sama dengan Motorola. Industri berspekulasi tentang masa depan Apple di mobile.' },

    { year: 2005, month: 10, source: 'MobileWeek Europe', sourceId: 'mobileweek_uk', tone: 'positive', era: 'firmware', tags: ['blackberry', 'push_email'],
      headline: 'BlackBerry jadi simbol profesional mobile',
      text: 'Push email BlackBerry merevolusi produktivitas mobile. Perangkat ini menjadi standar bagi eksekutif bisnis.' },

    { year: 2005, month: 11, source: 'TechPulse Global', sourceId: 'techpulse_us', tone: 'positive', era: 'firmware', tags: ['market', 'record'],
      headline: 'Penjualan ponsel global 2005 diprediksi 800 juta unit',
      text: 'Industri ponsel mencatat rekor baru. Pertumbuhan didorong oleh pasar berkembang dan fitur multimedia.' },

    { year: 2005, month: 12, source: 'Seoul Tech Daily', sourceId: 'seoultech_kr', tone: 'positive', era: 'firmware', tags: ['samsung', 'year_end'],
      headline: 'Samsung konsolidasi posisi nomor dua, ancam Nokia',
      text: 'Samsung menutup tahun dengan pangsa pasar kuat. Persaingan menuju 2006 diprediksi makin intens.' }
];

// ============================================================
// UTIL
// ============================================================
export function getHeadlineForMonth(year, month) {
    for (let i = 0; i < MONTHLY_HEADLINES.length; i++) {
        const h = MONTHLY_HEADLINES[i];
        if (h.year === year && h.month === month) return h;
    }
    return null;
}

export function getHeadlinesForYear(year) {
    return MONTHLY_HEADLINES.filter(h => h.year === year);
}

export function getHeadlinesForEra(eraId) {
    return MONTHLY_HEADLINES.filter(h => h.era === eraId);
}

export function validateHeadlinesData() {
    const issues = [];
    const seen = new Set();
    MONTHLY_HEADLINES.forEach(h => {
        const key = h.year + '-' + h.month;
        if (seen.has(key)) issues.push('Duplikat: ' + key);
        seen.add(key);
        if (h.month < 1 || h.month > 12) issues.push('Bulan invalid: ' + key);
        if (!h.headline) issues.push('Headline kosong: ' + key);
    });
    if (issues.length) {
        console.warn('[news-headlines] ' + issues.length + ' masalah:');
        issues.forEach(i => console.warn('  - ' + i));
    } else {
        console.info('[news-headlines] Validasi OK. ' + MONTHLY_HEADLINES.length + ' entri.');
    }
    return issues;
}
