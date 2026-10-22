// FILE: src/data/feedback.data.js
// ============================================================
// DATA FEEDBACK PUBLIK — template ulasan, viral events, saran.
// ============================================================
import { VIRAL_RESPONSES_EXT } from './market-nav.data.js';

// Sumber ulasan per era
export const FEEDBACK_SOURCES = {
    feature_phone:    ['Majalah Tekno', 'Forum HP', 'Tabloid Gadget', 'Radio Teknologi', 'Surat Pembaca'],
    touch_revolution: ['Blog Teknologi', 'Forum Diskusi', 'Portal Berita Tech', 'Podcast Awal', 'Twitter Awal'],
    modern_smartphone:['YouTube Review', 'Media Sosial', 'Situs Teknologi', 'Instagram Tech', 'Forum Reddit'],
    ai_ecosystem:     ['Reviewer Video Pendek', 'Komunitas Online', 'Podcast Tech', 'Thread Viral', 'Live Streaming']
};

// Template ulasan berdasarkan skor (1-10)
// v2028.41 — diperbanyak (±8-10 per kategori) supaya feed tidak berulang.
export const REVIEW_TEMPLATES = {
    excellent: [  // 8-10
        '{name} luar biasa! {strong} benar-benar kelas atas.',
        'Ini ponsel terbaik tahun ini. {strong} membuat semua orang iri.',
        'Sangat puas. {strong} melampaui ekspektasi.',
        'Rekomendasi wajib! {strong} jadi nilai jual utama.',
        'Performa premium. {strong} tidak mengecewakan.',
        '{name} jadi standar baru kelasnya. {strong} sulit ditandingi.',
        'Tidak menyesal beli {name}. {strong} bikin betah dipakai seharian.',
        'Salah satu yang terbaik yang pernah saya coba. {strong} bukan main.',
        '{strong} di {name} bikin pesaing terlihat ketinggalan.',
        'Nilai sempurna untuk {strong}. Layak jadi pilihan utama.'
    ],
    good: [  // 6-7.9
        '{name} bagus secara keseluruhan. {strong} menonjol.',
        'Pilihan solid. {strong} layak dipertimbangkan.',
        'Puas dengan {name}. {strong} oke, meski {weak}.',
        'Kualitas bagus untuk harganya. {strong} memuaskan.',
        '{name} nyaman dipakai harian. {strong} jadi andalan, {weak} masih bisa dimaklumi.',
        'Hampir sempurna. Kalau {weak} dibenahi, nilainya bisa lebih tinggi.',
        'Sepadan dengan uangnya. {strong} terasa, {weak} tidak terlalu mengganggu.',
        'Rekomendasi dengan catatan kecil: {weak}.',
        '{name} tidak mengecewakan. Pujian terbesar untuk {strong}.'
    ],
    mixed: [  // 4-5.9
        'Cukup. {strong}, tapi {weak}.',
        '{name} standar saja. {strong} oke, {weak} mengganggu.',
        'Ada plus minus. {strong} bagus, {weak} perlu diperbaiki.',
        'Biasa saja. {strong} tidak cukup menutupi {weak}.',
        'Antara suka dan tidak. {strong} oke, tapi {weak} bikin ragu.',
        'Layak dilirik kalau harganya turun. {weak} masih jadi PR.',
        '{name} bukan yang terbaik, bukan yang terburuk. {strong} satu-satunya nilai plus.',
        'Hasil akhirnya pas-pasan. {weak} menahan nilai {name}.',
        'Cocok untuk yang tidak rewel. {strong} lumayan, {weak} bisa diabaikan sebagian orang.'
    ],
    poor: [  // 2-3.9
        '{name} mengecewakan. {weak} parah.',
        'Tidak sesuai harapan. {weak} jadi masalah utama.',
        'Banyak keluhan: {weak}.',
        'Sulit direkomendasikan. {weak} dominan.',
        'Saya kecewa. {weak} terasa sejak hari pertama.',
        '{name} belum matang. {weak} membuatnya sulit dinikmati.',
        'Harapan tinggi, hasilnya jauh. {weak}.',
        'Untuk harga segini, {weak} tidak bisa diterima.'
    ],
    bad: [  // 1-1.9
        'Hindari! {weak} sangat mengganggu.',
        '{name} gagal total. {weak} tidak bisa ditolerir.',
        'Kekecewaan besar. {weak}.',
        'Jangan beli dulu. {weak} bikin {name} nyaris tak layak pakai.',
        'Penyesalan terbesar bulan ini. {weak}.',
        '{name} terasa dirilis terburu-buru. {weak} di mana-mana.',
        'Nilai terendah dari saya. {weak} merusak semuanya.'
    ]
};

// Mapping stat ke "strength label"
export const STAT_LABELS = {
    display:      { strong: 'layar memukau',   weak: 'layar kurang tajam' },
    camera:       { strong: 'kamera jempolan', weak: 'kamera mengecewakan' },
    battery:      { strong: 'baterai awet',    weak: 'baterai boros' },
    performance:  { strong: 'performa ngebut', weak: 'performa lambat' },
    connectivity: { strong: 'koneksi lancar',  weak: 'sinyal sering hilang' },
    design:       { strong: 'desain cantik',   weak: 'desain kaku' },
    usability:    { strong: 'mudah dipakai',   weak: 'sulit digunakan' },
    quality:      { strong: 'bangunan kokoh',  weak: 'kualitas build rendah' }
};

// Event viral (pujian / kritik) — muncul sekali pakai
export const VIRAL_EVENTS = [
    // POSITIF
    { id: 'viral_camera',     type: 'positive', title: 'Kamera viral di media sosial',
      text: 'Pengguna memuji kamera ponselmu. Foto-foto menyebar viral.',
      effects: { reputation: +5, dailyDemandBoost: 0.20, durationDays: 7 } },
    { id: 'viral_battery',    type: 'positive', title: 'Test baterai viral',
      text: 'Uji ketahanan baterai tersebar luas. Banyak yang terkesan.',
      effects: { reputation: +4, dailyDemandBoost: 0.15, durationDays: 10 } },
    { id: 'viral_design',     type: 'positive', title: 'Desain dipuji',
      text: 'Desain ponselmu dipuji oleh desainer terkenal.',
      effects: { reputation: +6, dailyDemandBoost: 0.25, durationDays: 5 } },
    { id: 'viral_performance',type: 'positive', title: 'Benchmark memukau',
      text: 'Skor benchmark mengejutkan. Gamer berbondong beli.',
      effects: { reputation: +4, dailyDemandBoost: 0.18, durationDays: 8 } },
    { id: 'viral_price',      type: 'positive', title: 'Harga dianggap murah',
      text: 'Kombinasi spesifikasi & harga jadi perbincangan.',
      effects: { reputation: +3, dailyDemandBoost: 0.22, durationDays: 6 } },

    // NEGATIF
    { id: 'viral_heating',    type: 'negative', title: 'Ponsel cepat panas',
      text: 'Keluhan panas berlebih menyebar. Banyak yang komplain.',
      effects: { reputation: -5, dailyDemandBoost: -0.20, durationDays: 7 } },
    { id: 'viral_battery_drain', type: 'negative', title: 'Baterai boros',
      text: 'Uji baterai menunjukkan hasil buruk. Viral di forum.',
      effects: { reputation: -4, dailyDemandBoost: -0.15, durationDays: 10 } },
    { id: 'viral_display_issue', type: 'negative', title: 'Layar bermasalah',
      text: 'Keluhan layar berkedip menyebar cepat.',
      effects: { reputation: -6, dailyDemandBoost: -0.25, durationDays: 5 } },
    { id: 'viral_crash',      type: 'negative', title: 'Aplikasi sering crash',
      text: 'Stabilitas software dipertanyakan. Review negatif muncul.',
      effects: { reputation: -5, dailyDemandBoost: -0.18, durationDays: 8 } },
    { id: 'viral_build',      type: 'negative', title: 'Build quality dipertanyakan',
      text: 'Keluhan bodi cepat rusak. Foto retak viral.',
      effects: { reputation: -4, dailyDemandBoost: -0.20, durationDays: 6 } }
];

// Saran pelanggan (dari keluhan terbanyak)
export const CUSTOMER_SUGGESTIONS = [
    { aspect: 'battery',     text: 'Pengguna meminta baterai lebih awet.' },
    { aspect: 'camera',      text: 'Pengguna meminta kamera lebih bagus.' },
    { aspect: 'performance', text: 'Pengguna meminta performa lebih ngebut.' },
    { aspect: 'display',     text: 'Pengguna meminta layar lebih tajam.' },
    { aspect: 'design',      text: 'Pengguna meminta desain lebih cantik.' },
    { aspect: 'connectivity',text: 'Pengguna meminta koneksi lebih stabil.' },
    { aspect: 'usability',   text: 'Pengguna meminta antarmuka lebih mudah.' },
    { aspect: 'price',       text: 'Pengguna menginginkan harga lebih murah.' }
];

// Aksi pemain untuk merespons viral negatif (opsional, pakai uang)
// i18n = teks dwibahasa untuk UI; label/description tetap Indonesia demi kompatibilitas.
export const VIRAL_RESPONSES = [
    { id: 'apology',        label: 'Permintaan Maaf Publik',    cost: 2000,  effect: { reputation: +2 }, description: 'Minta maaf terbuka, tenangkan publik.',
      i18n: { label: { id: 'Permintaan Maaf Publik', en: 'Public Apology' }, description: { id: 'Minta maaf terbuka, tenangkan publik.', en: 'Apologise openly and calm the public.' } } },
    { id: 'recall',         label: 'Program Perbaikan Unit',    cost: 15000, effect: { reputation: +6 }, description: 'Tukar/perbaiki unit bermasalah.',
      i18n: { label: { id: 'Program Perbaikan Unit', en: 'Unit Repair Program' }, description: { id: 'Tukar/perbaiki unit bermasalah.', en: 'Swap or repair the affected units.' } } },
    { id: 'clarify',        label: 'Kampanye Klarifikasi',      cost: 8000,  effect: { reputation: +4 }, description: 'Jelaskan fakta lewat iklan.',
      i18n: { label: { id: 'Kampanye Klarifikasi', en: 'Clarification Campaign' }, description: { id: 'Jelaskan fakta lewat iklan.', en: 'Explain the facts through ads.' } } },
    { id: 'ignore',         label: 'Abaikan',                   cost: 0,     effect: { reputation: -3 }, description: 'Diamkan saja, biarkan mereda sendiri.',
      i18n: { label: { id: 'Abaikan', en: 'Ignore' }, description: { id: 'Diamkan saja, biarkan mereda sendiri.', en: 'Stay silent and let it blow over.' } } }
];
// Respons tambahan (market-nav.data.js) digabung ke daftar yang sama.
VIRAL_RESPONSES_EXT.forEach(function (r) {
    VIRAL_RESPONSES.splice(VIRAL_RESPONSES.length - 1, 0, {
        id: r.id, label: r.label.id, cost: r.cost, effect: { reputation: r.effect.reputation },
        description: r.description.id, i18n: { label: r.label, description: r.description }
    });
});

// ============================================================
// v2028.41 — ULASAN LEBIH BERAGAM DARI TAHUN KE TAHUN
// Semua teks di sini dipilih per era TAHUN (bukan data.era, yang tidak berubah).
// ============================================================

// Batas feed & volume ulasan.
export const FEED_LIMITS = {
    max: 60,             // jumlah ulasan yang disimpan di save
    show: 60,            // jumlah yang diambil panel
    growthPerYear: 0.12, // pertumbuhan volume ulasan per tahun sejak 2000 (2000 = ×1, 2026 ≈ ×4,1)
    maxPerProductPerDay: 3,
    maxPerDay: 8,
    launchBuzzMult: 2    // pengali selama minggu peluncuran
};

// Kunci era ulasan berdasarkan tahun.
export function getReviewEraKey(year) {
    if (year <= 2003) return 'e2000';
    if (year <= 2007) return 'e2004';
    if (year <= 2011) return 'e2008';
    if (year <= 2016) return 'e2012';
    if (year <= 2020) return 'e2017';
    return 'e2021';
}

// Sumber ulasan per era tahun.
export const FEEDBACK_SOURCES_BY_YEAR = {
    e2000: ['Majalah Tekno', 'Forum HP', 'Tabloid Gadget', 'Radio Teknologi', 'Surat Pembaca', 'Koran Kota', 'Toko Ponsel', 'Milis Gadget'],
    e2004: ['Majalah Tekno', 'Forum Online', 'Blog Pribadi', 'Tabloid Gadget', 'Chatroom HP', 'Situs Ulasan', 'Majalah Digital', 'Toko Ponsel'],
    e2008: ['Blog Teknologi', 'Forum Diskusi', 'Portal Berita Tech', 'Podcast Awal', 'Twitter Awal', 'Grup Facebook', 'Video Blog', 'Situs Ulasan'],
    e2012: ['YouTube Review', 'Media Sosial', 'Situs Teknologi', 'Instagram Tech', 'Forum Reddit', 'Grup Telegram', 'Podcast Tech', 'Ulasan Marketplace'],
    e2017: ['YouTube Review', 'Reviewer Video Pendek', 'Instagram Tech', 'Komunitas Online', 'Situs Teknologi', 'Thread Viral', 'Podcast Tech', 'Ulasan Marketplace'],
    e2021: ['Reviewer Video Pendek', 'Komunitas Online', 'Podcast Tech', 'Thread Viral', 'Live Streaming', 'Ulasan Marketplace', 'Newsletter Tech', 'Kanal Unboxing']
};

// Topik yang sedang hangat per era (dipakai template {topic}).
export const ERA_TOPICS = {
    e2000: ['berkirim SMS', 'menelepon sehari-hari', 'nada dering polifonik', 'game bawaan', 'daya tahan standby', 'sinyal di dalam gedung'],
    e2004: ['kamera megapiksel', 'memutar MP3', 'Bluetooth', 'MMS dan foto', 'koneksi 3G', 'slot kartu memori'],
    e2008: ['layar sentuh', 'toko aplikasi', 'GPS dan peta', 'WiFi di rumah', 'browsing internet', 'media sosial di ponsel'],
    e2012: ['jaringan 4G', 'kamera selfie', 'sensor sidik jari', 'pembayaran digital', 'gaming mobile', 'streaming video'],
    e2017: ['layar tanpa bezel', 'face unlock', 'kamera ganda', 'pengisian cepat', 'video pendek', 'mode gelap'],
    e2021: ['jaringan 5G', 'layar 120Hz', 'kamera berbasis AI', 'asisten AI', 'eSIM', 'pengisian USB-C']
};

// Label kekuatan/kelemahan per era (dipilih acak dari varian).
export const ERA_STAT_LABELS = {
    e2000: {
        display:      { strong: ['layar jernih untuk ukuran zamannya', 'lampu latar layar nyaman di gelap'], weak: ['layar monokrom sulit dibaca', 'tulisan di layar terlalu kecil'] },
        camera:       { strong: ['kamera VGA lumayan untuk foto sederhana', 'fitur kamera bikin penasaran'], weak: ['kamera nyaris tidak berguna', 'hasil foto buram'] },
        battery:      { strong: ['standby berhari-hari', 'baterai tahan seminggu'], weak: ['baterai cepat habis', 'waktu bicara pendek'] },
        performance:  { strong: ['menu responsif', 'game bawaan jalan mulus'], weak: ['menu lemot', 'sering macet saat buka kontak'] },
        connectivity: { strong: ['sinyal kuat di dalam gedung', 'SMS terkirim cepat'], weak: ['sinyal sering hilang', 'SMS suka tertunda'] }
    },
    e2004: {
        display:      { strong: ['layar warna cerah', 'layar TFT tajam'], weak: ['layar pudar di bawah matahari', 'warna layar kusam'] },
        camera:       { strong: ['kamera megapiksel hasilnya oke', 'lampu kilat kamera jadi andalan'], weak: ['kamera berbintik di tempat gelap', 'kamera lambat memproses foto'] },
        battery:      { strong: ['baterai kuat untuk musik seharian', 'baterai awet meski Bluetooth menyala'], weak: ['baterai tekor saat memutar MP3', 'baterai drop saat memakai 3G'] },
        performance:  { strong: ['multimedia berjalan lancar', 'game Java mulus'], weak: ['membuka galeri lama', 'pemutar MP3 tersendat'] },
        connectivity: { strong: ['Bluetooth stabil', 'koneksi 3G cepat'], weak: ['Bluetooth sering putus', 'sinyal 3G naik-turun'] }
    },
    e2008: {
        display:      { strong: ['layar sentuh responsif', 'layar lega untuk browsing'], weak: ['layar sentuh sering salah tekan', 'layar menyilaukan di luar ruangan'] },
        camera:       { strong: ['kamera 5MP menangkap detail', 'video HD mulus'], weak: ['kamera lambat fokus', 'foto gelap saat malam'] },
        battery:      { strong: ['baterai kuat dengan GPS menyala', 'baterai bertahan seharian penuh'], weak: ['baterai tak sanggup sehari', 'baterai tekor oleh aplikasi latar'] },
        performance:  { strong: ['aplikasi terbuka cepat', 'multitasking lancar'], weak: ['aplikasi sering force close', 'lag saat banyak aplikasi terbuka'] },
        connectivity: { strong: ['WiFi stabil', 'browsing 3G ngebut'], weak: ['WiFi sering terputus', 'GPS susah mengunci lokasi'] }
    },
    e2012: {
        display:      { strong: ['layar HD tajam', 'layar nyaman untuk streaming'], weak: ['layar kurang terang', 'resolusi layar tertinggal'] },
        camera:       { strong: ['kamera selfie jernih', 'kamera belakang menang di cahaya redup'], weak: ['kamera selfie berbintik', 'autofokus kamera lambat'] },
        battery:      { strong: ['baterai awet untuk media sosial', 'pengisian cepat menyelamatkan hari'], weak: ['baterai boros saat 4G', 'baterai cepat panas saat dicas'] },
        performance:  { strong: ['gaming mobile lancar', 'aplikasi terbuka instan'], weak: ['patah-patah di game berat', 'ponsel cepat panas'] },
        connectivity: { strong: ['4G LTE cepat dan stabil', 'hotspot andal'], weak: ['4G sering turun ke 3G', 'sinyal data tidak stabil'] }
    },
    e2017: {
        display:      { strong: ['layar tanpa bezel memukau', 'panel AMOLED kontras tinggi'], weak: ['poni layar mengganggu', 'warna layar terlalu pucat'] },
        camera:       { strong: ['kamera ganda dengan mode malam', 'video stabil seperti pakai gimbal'], weak: ['mode malam terlalu agresif', 'kamera ultrawide buram'] },
        battery:      { strong: ['baterai besar awet seharian', 'pengisian cepat luar biasa'], weak: ['baterai terkuras oleh layar tinggi', 'pengisian terasa lambat'] },
        performance:  { strong: ['gaming berat tanpa patah', 'multitasking tanpa jeda'], weak: ['throttling saat main lama', 'UI terasa berat'] },
        connectivity: { strong: ['WiFi kencang', 'NFC dan pembayaran lancar'], weak: ['Bluetooth earbud sering putus', 'pindah jaringan sering macet'] }
    },
    e2021: {
        display:      { strong: ['layar 120Hz sangat halus', 'layar cerah terang di bawah matahari'], weak: ['refresh rate tinggi tapi boros', 'lipatan layar masih terlihat'] },
        camera:       { strong: ['kamera AI hasilnya natural', 'zoom optik jempolan'], weak: ['pemrosesan AI terlalu berlebihan', 'kamera utama kalah dari pesaing'] },
        battery:      { strong: ['pengisian super cepat', 'baterai bertahan dua hari'], weak: ['baterai cepat turun saat 5G aktif', 'baterai tidak sebanding dengan layar besar'] },
        performance:  { strong: ['AI on-device kencang', 'chip dingin dan tangguh'], weak: ['chip cepat panas', 'fitur AI lambat merespons'] },
        connectivity: { strong: ['5G stabil di mana-mana', 'eSIM praktis dan cepat'], weak: ['5G hanya numpang lewat', 'eSIM sering gagal aktif'] }
    }
};

// Varian umum (semua era) — dipakai untuk aspek tanpa varian era & sebagai tambahan.
export const STAT_VARIANTS = {
    display:      { strong: ['layar memukau', 'layar tajam dan jernih', 'tampilan layar menawan'], weak: ['layar kurang tajam', 'layar cepat bikin mata lelah', 'kualitas layar biasa saja'] },
    camera:       { strong: ['kamera jempolan', 'hasil foto memuaskan', 'kamera andal di banyak kondisi'], weak: ['kamera mengecewakan', 'hasil foto kurang tajam', 'kamera lambat dan kurang akurat'] },
    battery:      { strong: ['baterai awet', 'daya tahan baterai menonjol', 'baterai jarang bikin cemas'], weak: ['baterai boros', 'baterai cepat habis', 'daya tahan baterai pas-pasan'] },
    performance:  { strong: ['performa ngebut', 'kinerja gesit', 'respons cepat di segala situasi'], weak: ['performa lambat', 'sering lag', 'kinerja tidak konsisten'] },
    connectivity: { strong: ['koneksi lancar', 'sinyal kuat dan stabil', 'jaringan jarang bermasalah'], weak: ['sinyal sering hilang', 'koneksi suka putus', 'jaringan tidak stabil'] },
    design:       { strong: ['desain cantik', 'desain elegan dan mudah dikenali', 'tampilan bodi menawan'], weak: ['desain kaku', 'desain terlalu biasa', 'bodi terasa tebal dan kaku'] },
    usability:    { strong: ['mudah dipakai', 'antarmuka intuitif', 'menu simpel dan jelas'], weak: ['sulit digunakan', 'menu berbelit', 'antarmuka membingungkan'] }
};

// Ulasan bertopik era: {name} {topic} {strong} {weak} {year}
export const ERA_TOPIC_TEMPLATES = {
    positive: [
        '{name} bikin {topic} terasa jauh lebih nyaman. {strong} juara.',
        'Untuk urusan {topic}, {name} layak diacungi jempol.',
        'Soal {topic}, {name} tampil di atas rata-rata. {strong} jadi bonus.',
        'Tahun {year}, {topic} jadi alasan kuat memilih {name}.'
    ],
    mixed: [
        '{topic} di {name} lumayan, tapi {weak} masih mengganjal.',
        'Untuk {topic}, {name} cukup — tidak istimewa. {weak} perlu dibenahi.',
        'Harapan soal {topic} baru setengah terpenuhi. {weak}.'
    ],
    negative: [
        '{topic} di {name} jauh dari kata layak. {weak} memperparah.',
        'Katanya unggul di {topic}, nyatanya mengecewakan. {weak}.',
        'Gagal soal {topic}. {name} belum siap bersaing di {year}.'
    ]
};

// Ulasan terkait harga (menggantikan satu kalimat tetap). {name} {price}
export const PRICE_REVIEWS = {
    very_high: [
        'Gila, {name} dijual ${price}?! Kualitas pas-pasan tapi harga selangit. Bukan beli!',
        '${price} untuk {name}? Itu tidak masuk akal dibanding isinya.',
        'Harga {name} ${price} terlalu jauh dari nilai yang ditawarkan. Lewat dulu.',
        'Dompet menjerit: ${price} demi {name}? Mending ditabung untuk yang lain.',
        'Penjual boleh bangga, tapi ${price} untuk spesifikasi segini cuma bikin geleng-geleng.',
        'Overpriced parah. {name} tidak sebanding dengan ${price}.'
    ],
    high: [
        '{name} terlalu mahal untuk spesifikasi segini. Mending beli merk lain.',
        '{name} sedikit kemahalan di ${price}. Turun sedikit pasti laris.',
        'Spesifikasinya bagus, tapi ${price} bikin saya ragu.',
        'Saya tunggu diskon dulu. ${price} masih terlalu tinggi untuk {name}.',
        'Mahal untuk kelasnya. Pesaing menawarkan lebih di harga serupa.'
    ],
    low: [
        '{name} harganya sangat bersahabat untuk kantong. Rekomendasi!',
        '${price} untuk {name}? Lumayan banget untuk kantong pelajar.',
        'Harga ramah, kualitas tidak murahan. {name} cocok dipakai sehari-hari.',
        'Bagus untuk harganya. {name} di ${price} patut dilirik.',
        'Nilai tinggi untuk uang yang keluar. Rekomendasi bagi yang berhemat.'
    ],
    very_low: [
        'Murah banget! {name} cuma ${price} tapi lumayan buat sehari-hari. Worth it!',
        'Cuma ${price}? {name} ini bikin ponsel lain gigit jari.',
        'Super murah. {name} di ${price} jadi pilihan masuk akal untuk siapa saja.',
        'Harga ${price} nyaris tidak masuk akal. Kualitasnya masih bisa diandalkan.',
        'Beli dua juga tidak apa-apa. {name} murah dan masih layak pakai.'
    ]
};

// Ulasan saat masih ada bug sistem aktif.
export const BUG_REVIEWS = [
    '{name} sering hang dan restart sendiri. Sistem operasinya belum stabil.',
    'Bug di sistemnya mengganggu pemakaian {name}. Tolong segera di-patch.',
    'Aplikasi sering menutup sendiri di {name}. Software perlu dibenahi.',
    'Hardware oke, software berantakan. Banyak bug di {name}.',
    'Update sistem {name} ditunggu-tunggu. Bug yang ada bikin kesal.'
];

// Ulasan "bukti sosial" untuk produk yang sudah laris (skor baik).
export const POPULAR_REVIEWS = [
    'Hampir semua teman saya pakai {name}. Tidak heran, {strong}.',
    '{name} ada di mana-mana sekarang, dan {strong} memang pantas dipuji.',
    'Antrean beli {name} panjang. Setelah coba sendiri, saya paham: {strong}.',
    'Banyak yang sudah memakai {name}. Alasannya jelas: {strong}.'
];

// Pembuka & penutup opsional supaya kalimat tidak monoton. {year}
export const REVIEW_LEADS = {
    positive: ['Setelah seminggu pakai: ', 'Kesan pertama: ', 'Update sebulan pemakaian: ', 'Singkat saja: ', 'Ulasan jujur: ', 'Catatan dari saya: '],
    neutral:  ['Setelah dicoba beberapa hari: ', 'Kesan awal: ', 'Ulasan singkat: ', 'Dari pengalaman saya: '],
    negative: ['Sayang sekali: ', 'Peringatan: ', 'Setelah beberapa hari pakai: ', 'Jujur saja: ', 'Update dengan berat hati: ']
};
export const REVIEW_TAILS = {
    positive: [' Layak dibeli.', ' Pasti saya rekomendasikan ke teman.', ' Cocok untuk standar {year}.', ' Kandidat ponsel terbaik {year}.'],
    neutral:  [' Tunggu diskon dulu.', ' Tergantung kebutuhan masing-masing.', ' Bandingkan dulu sebelum beli.', ' Standar saja untuk {year}.'],
    negative: [' Pikir dua kali sebelum beli.', ' Semoga diperbaiki di versi berikutnya.', ' Banyak yang kecewa di {year}.', ' Cari alternatif lain.']
};

function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
// Huruf besar di awal setiap kalimat (label aspek ditulis huruf kecil).
function _sentenceCase(str) {
    return str.replace(/(^|[.!?:]\s+)([a-z])/g, function (m, pre, ch) { return pre + ch.toUpperCase(); });
}
function _fill(str, v) {
    return str
        .replace(/\{name\}/g, v.name)
        .replace(/\{strong\}/g, v.strong)
        .replace(/\{weak\}/g, v.weak)
        .replace(/\{topic\}/g, v.topic)
        .replace(/\{year\}/g, String(v.year))
        .replace(/\{price\}/g, String(v.price));
}

export function reviewSourceForYear(year) {
    return _pick(FEEDBACK_SOURCES_BY_YEAR[getReviewEraKey(year)] || FEEDBACK_SOURCES_BY_YEAR.e2000);
}

// Label aspek: campur varian era + varian umum.
export function aspectLabel(stat, kind, year) {
    const eraSet = (ERA_STAT_LABELS[getReviewEraKey(year)] || {})[stat];
    const generic = STAT_VARIANTS[stat];
    const pool = [].concat((eraSet && eraSet[kind]) || [], (generic && generic[kind]) || []);
    if (pool.length) return _pick(pool);
    const legacy = STAT_LABELS[stat];
    return legacy ? legacy[kind] : (kind === 'strong' ? 'berkualitas' : 'ada kekurangan');
}

function _tone(score) { return score >= 6 ? 'positive' : score >= 4 ? 'neutral' : 'negative'; }
function _category(score) {
    if (score >= 8) return 'excellent';
    if (score >= 6) return 'good';
    if (score >= 4) return 'mixed';
    if (score >= 2) return 'poor';
    return 'bad';
}

// Susun teks ulasan.
// ctx: { name, price, score, best, worst, year, priceTier ('very_high'|'high'|'low'|'very_low'|null),
//        hasBugs, popular, recent (array teks terbaru untuk menghindari duplikat) }
export function buildReviewText(ctx) {
    const recent = ctx.recent || [];
    let text = '';
    for (let attempt = 0; attempt < 6; attempt++) {
        const v = {
            name: ctx.name, price: ctx.price, year: ctx.year,
            strong: aspectLabel(ctx.best, 'strong', ctx.year),
            weak: aspectLabel(ctx.worst, 'weak', ctx.year),
            topic: _pick(ERA_TOPICS[getReviewEraKey(ctx.year)] || ERA_TOPICS.e2000)
        };
        const cat = _category(ctx.score);
        const tone = _tone(ctx.score);
        let body = null;
        const roll = Math.random();

        if (ctx.priceTier && roll < 0.65) {
            body = _pick(PRICE_REVIEWS[ctx.priceTier]);
        } else if (ctx.hasBugs && ctx.score < 7 && Math.random() < 0.35) {
            body = _pick(BUG_REVIEWS);
        } else if (ctx.popular && ctx.score >= 6 && Math.random() < 0.25) {
            body = _pick(POPULAR_REVIEWS);
        } else if (Math.random() < 0.3) {
            body = _pick(ERA_TOPIC_TEMPLATES[tone === 'positive' ? 'positive' : tone === 'neutral' ? 'mixed' : 'negative']);
        } else {
            body = _pick(REVIEW_TEMPLATES[cat] || REVIEW_TEMPLATES.mixed);
        }

        let out = _fill(body, v);
        if (Math.random() < 0.4) out = _pick(REVIEW_LEADS[tone]) + out.charAt(0).toUpperCase() + out.slice(1);
        if (Math.random() < 0.25) out += _fill(_pick(REVIEW_TAILS[tone]), v);
        text = _sentenceCase(out);
        if (recent.indexOf(text) === -1) break;
    }
    return text;
}

export function getViralEventById(id) {
    return VIRAL_EVENTS.find(v => v.id === id) || null;
}
