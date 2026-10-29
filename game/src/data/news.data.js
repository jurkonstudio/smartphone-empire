// FILE: src/data/news.data.js
// ============================================================
// DATA MEDIA INTERNASIONAL & TEMPLATE BERITA
// 20 outlet dari berbagai negara & era, template headline + body.
// ============================================================

// ============================================================
// OUTLET — Media internasional per era
// ============================================================
export var NEWS_OUTLETS = [
    // ==================== ERA 2000-2006 ====================
    { id: 'techpulse_us', name: 'TechPulse Global', country: 'US', region: 'NA',
      type: 'magazine', fromYear: 2000, toYear: 2010, credibility: 0.90, reach: 'global' },
    { id: 'mobileweek_uk', name: 'MobileWeek Europe', country: 'UK', region: 'EU',
      type: 'magazine', fromYear: 2000, toYear: 2009, credibility: 0.85, reach: 'regional' },
    { id: 'asiamobile_jp', name: 'Asia Mobile Review', country: 'Japan', region: 'APAC',
      type: 'magazine', fromYear: 2000, toYear: 2012, credibility: 0.88, reach: 'regional' },
    { id: 'mobilfunk_de', name: 'Der Mobilfunk', country: 'Germany', region: 'EU',
      type: 'magazine', fromYear: 2000, toYear: 2010, credibility: 0.86, reach: 'regional' },
    { id: 'seoultech_kr', name: 'Seoul Tech Daily', country: 'South Korea', region: 'APAC',
      type: 'newspaper', fromYear: 2000, toYear: 2015, credibility: 0.84, reach: 'regional' },

    // ==================== ERA 2007-2012 ====================
    { id: 'gadgetwire_us', name: 'GadgetWire', country: 'US', region: 'NA',
      type: 'blog', fromYear: 2007, toYear: 2016, credibility: 0.82, reach: 'global' },
    { id: 'techbeat_uk', name: 'TechBeat UK', country: 'UK', region: 'EU',
      type: 'blog', fromYear: 2007, toYear: 2018, credibility: 0.80, reach: 'regional' },
    { id: 'globalreport_intl', name: 'Global Mobile Report', country: 'Switzerland', region: 'Global',
      type: 'online', fromYear: 2008, toYear: 2025, credibility: 0.92, reach: 'global' },
    { id: 'vortex_asia', name: 'Vortex Asia Tech', country: 'Singapore', region: 'APAC',
      type: 'online', fromYear: 2008, toYear: 2019, credibility: 0.85, reach: 'regional' },

    // ==================== ERA 2013-2018 ====================
    { id: 'techinsider_us', name: 'The Tech Insider', country: 'US', region: 'NA',
      type: 'online', fromYear: 2013, toYear: 2025, credibility: 0.88, reach: 'global' },
    { id: 'digitalfrontier_eu', name: 'Digital Frontier', country: 'Netherlands', region: 'EU',
      type: 'online', fromYear: 2013, toYear: 2025, credibility: 0.86, reach: 'regional' },
    { id: 'asiatech_hk', name: 'Asia Tech Review', country: 'Hong Kong', region: 'APAC',
      type: 'online', fromYear: 2013, toYear: 2025, credibility: 0.84, reach: 'regional' },
    { id: 'mobilemasters_yt', name: 'MobileMasters', country: 'US', region: 'NA',
      type: 'youtube', fromYear: 2013, toYear: 2025, credibility: 0.75, reach: 'global' },
    { id: 'techunboxed_yt', name: 'TechUnboxed', country: 'UK', region: 'EU',
      type: 'youtube', fromYear: 2013, toYear: 2025, credibility: 0.73, reach: 'global' },

    // ==================== ERA 2019-2025+ ====================
    { id: 'worldtech_intl', name: 'WorldTech Today', country: 'US', region: 'Global',
      type: 'online', fromYear: 2019, toYear: 9999, credibility: 0.90, reach: 'global' },
    { id: 'quicktech_jp', name: 'QuickTech JP', country: 'Japan', region: 'APAC',
      type: 'social', fromYear: 2019, toYear: 9999, credibility: 0.70, reach: 'regional' },
    { id: '60sectech_kr', name: '60secTech', country: 'South Korea', region: 'APAC',
      type: 'social', fromYear: 2019, toYear: 9999, credibility: 0.72, reach: 'global' },
    { id: 'livewire_us', name: 'LiveWire Reviews', country: 'US', region: 'NA',
      type: 'stream', fromYear: 2019, toYear: 9999, credibility: 0.78, reach: 'global' },
    { id: 'eurotech_de', name: 'EuroTech Heute', country: 'Germany', region: 'EU',
      type: 'online', fromYear: 2019, toYear: 9999, credibility: 0.87, reach: 'regional' },
    { id: 'megareview_br', name: 'MegaReview Brasil', country: 'Brazil', region: 'LATAM',
      type: 'youtube', fromYear: 2019, toYear: 9999, credibility: 0.74, reach: 'regional' }
];

// ============================================================
// JURNALIS — Nama per negara
// ============================================================
export var JOURNALISTS = {
    'US':        ['Michael Henderson', 'Sarah Mitchell', 'David Chen', 'Rachel Adams', 'Jason Brooks'],
    'UK':        ['Oliver Whitfield', 'Emma Blackwood', 'James Harrow', 'Sophie Pemberton'],
    'Japan':     ['Kenji Tanaka', 'Yuki Nakamura', 'Hiroshi Sato', 'Aiko Yamamoto'],
    'South Korea':['Min-jun Park', 'Ji-woo Kim', 'Seung-hyun Lee', 'Hye-jin Choi'],
    'Germany':   ['Klaus Bergmann', 'Anna Schmidt', 'Lukas Weber', 'Frieda Müller'],
    'Singapore': ['Wei Ling Tan', 'Rajesh Kumar', 'Michelle Ng'],
    'Hong Kong': ['Wing Chan', 'Ka Ming Lee', 'Siu Fung Ho'],
    'Netherlands':['Jeroen van Dijk', 'Sanne de Vries', 'Bram Bakker'],
    'Switzerland':['Marco Bianchi', 'Elise Berger', 'Thomas Keller'],
    'Brazil':    ['Carlos Silva', 'Isabela Santos', 'Rafael Oliveira']
};

// ============================================================
// KOTA DATELINE per region
// ============================================================
export var DATELINE_CITIES = {
    'NA':    ['New York', 'San Francisco', 'Los Angeles', 'Toronto'],
    'EU':    ['London', 'Berlin', 'Paris', 'Amsterdam', 'Zürich'],
    'APAC':  ['Tokyo', 'Seoul', 'Singapore', 'Hong Kong', 'Taipei'],
    'LATAM': ['São Paulo', 'Buenos Aires', 'Mexico City'],
    'Global':['New York', 'London', 'Tokyo', 'Singapore']
};

// ============================================================
// HEADLINE TEMPLATES — per tone
// placeholders: {name} {company} {quality} {price} {region}
// ============================================================
export var HEADLINE_TEMPLATES = {
    positive: [
        '{name} dari {company} mengguncang pasar {region}',
        '{name}: Standar baru smartphone {region}?',
        'Ulasan pertama {name}: layak dibeli',
        '{company} kembali dengan {name} yang memukau',
        '{name} hadir dengan kualitas premium'
    ],
    mixed: [
        '{name}: inovasi atau sekadar hype?',
        '{name} dari {company} — ada yang kurang?',
        'Ulasan {name}: bagus, tapi...',
        '{name}: menawan, namun belum sempurna',
        'Kesan pertama {name} dari {company}'
    ],
    negative: [
        '{name} mengecewakan penggemar {region}',
        '{name} dari {company} — perlu banyak perbaikan',
        'Ulasan {name}: harga tidak sebanding',
        'Mengapa {name} gagal memenuhi ekspektasi',
        '{name}: langkah mundur {company}?'
    ],
    milestone_1m: [
        '{company} menembus 1 juta unit {name} di seluruh dunia',
        'Sukses global: {name} capai 1 juta unit',
        '{name} jadi fenomena global — 1 juta unit terjual'
    ],
    milestone_10m: [
        '{name} tembus 10 juta unit — {company} kini pemain besar',
        'Dominasi {company}: 10 juta {name} terjual',
        '10 juta unit {name} — rekor baru untuk {company}'
    ],
    milestone_100m: [
        '{name} capai 100 juta unit — sejarah baru untuk {company}',
        '{company} cetak rekor: 100 juta {name} terjual',
        'Fenomena global {name}: 100 juta unit dan terus bertambah'
    ]
};

// ============================================================
// SUBHEADLINE TEMPLATES
// ============================================================
export var SUBHEADLINE_TEMPLATES = {
    positive: [
        'Perangkat ini membuktikan bahwa {company} serius bersaing di pasar {region}.',
        'Kualitas {quality} yang ditawarkan membuat {name} menonjol di kelasnya.',
        'Dengan harga {price}, {name} menawarkan nilai luar biasa.'
    ],
    mixed: [
        'Meski memiliki keunggulan, {name} masih menyisakan beberapa catatan.',
        'Perangkat ini membagi pendapat di kalangan pengamat.',
        'Ada hal yang disukai, ada juga yang perlu dipertanyakan dari {name}.'
    ],
    negative: [
        'Persaingan ketat di segmen ini membuat {name} harus berjuang lebih keras.',
        'Banyak pengguna awal melaporkan pengalaman yang jauh dari harapan.',
        'Pasar {region} mungkin belum siap untuk harga dan kualitas yang ditawarkan.'
    ]
};

// ============================================================
// BODY PARAGRAPH TEMPLATES — 4 paragraf per tone
// ============================================================
export var BODY_TEMPLATES = {
    positive: [
        'Industri smartphone kembali diramaikan oleh kehadiran {name}, produk terbaru dari {company}. Perangkat ini langsung menarik perhatian pasar internasional dengan pendekatan desain yang berani dan performa yang solid. Pengamat menilai bahwa langkah {company} ini dapat mengubah peta persaingan di kawasan {region}.',
        'Dalam pengujian yang dilakukan oleh tim kami, {name} menunjukkan hasil impresif. Dengan skor kualitas {quality}, perangkat ini mampu bersaing dengan produk unggulan dari merek-merek mapan. Fitur-fitur andalannya bekerja sesuai ekspektasi, bahkan beberapa di antaranya melampaui standar di kelas harga {price}.',
        'Para analis menilai kesuksesan {name} mencerminkan strategi tepat yang diambil oleh {company}. "Mereka memahami apa yang dicari konsumen modern," ujar salah satu analis industri yang enggan disebut namanya. "Kombinasi kualitas, harga, dan inovasi ini adalah formula yang sulit ditandingi."',
        'Dengan momentum ini, {company} diperkirakan akan terus memperluas pangsa pasarnya. Tantangan berikutnya adalah mempertahankan konsistensi dan menghadirkan inovasi lanjutan sebelum para pesaing meluncurkan produk tandingan mereka. Namun untuk sekarang, {name} adalah bukti bahwa {company} patut diperhitungkan di panggung global.'
    ],
    mixed: [
        '{company} resmi meluncurkan {name} yang menyasar pasar {region}. Perangkat ini membawa sejumlah peningkatan dibandingkan generasi sebelumnya, tetapi juga meninggalkan beberapa pertanyaan di kalangan pengamat industri yang menilai bahwa inovasi yang dihadirkan belum sepenuhnya menjawab ekspektasi pasar.',
        'Dari segi kualitas, {name} mencatat skor {quality} yang tergolong kompetitif. Harga {price} memang menarik untuk segmennya, namun beberapa pengguna awal melaporkan adanya kekurangan pada aspek tertentu yang membuat pengalaman penggunaan belum optimal. Kritik ini tentu menjadi catatan penting bagi {company}.',
        '"Perangkat ini bukan tanpa kelemahan, tetapi juga bukan tanpa kelebihan," kata seorang analis di {region}. Menurutnya, {company} perlu mempertimbangkan dengan serius masukan dari pasar untuk memastikan produk berikutnya benar-benar sesuai harapan pelanggan.',
        '{name} tetap punya peluang untuk sukses bila {company} mampu melakukan perbaikan berkelanjutan. Pasar {region} masih besar, dan konsumen cenderung memberi kesempatan kedua bagi merek yang responsif terhadap kritik. Bagaimana {company} merespons akan menentukan arah selanjutnya.'
    ],
    negative: [
        'Peluncuran {name} oleh {company} mendapat sambutan yang jauh dari hangat di pasar {region}. Berbagai keluhan pengguna awal mulai bermunculan di forum dan media sosial, menyoroti sejumlah masalah yang dinilai tidak sepadan dengan harga {price} yang ditawarkan.',
        'Tim kami mencatat skor kualitas {quality} untuk {name}, yang berada di bawah standar kompetitif kelasnya. Masalah pada aspek inti perangkat membuat pengalaman penggunaan tidak sesuai ekspektasi. Kritik serupa juga muncul dari sejumlah pengulas independen yang menilai {company} terlalu cepat meluncurkan produk ini.',
        '"Ini adalah pelajaran mahal bagi {company}," kata seorang pengamat industri. "Pasar {region} tidak mudah dimaafkan jika sebuah produk jelas-jelas belum matang. Kepercayaan konsumen adalah aset yang sulit dibangun kembali."',
        '{company} kini berada dalam posisi yang sulit. Diperlukan langkah korektif yang cepat dan transparan untuk memulihkan citra. Apakah {name} dapat diselamatkan dengan pembaruan atau program perbaikan, masih menjadi pertanyaan besar bagi para pengamat yang mengikuti perkembangan ini.'
    ]
};

// ============================================================
// PULL QUOTE TEMPLATES
// ============================================================
export var PULL_QUOTE_TEMPLATES = {
    positive: [
        '"Ini adalah salah satu peluncuran paling menarik tahun ini."',
        '"Konsumen layak memberikan perhatian serius pada produk ini."',
        '"Sebuah bukti bahwa {company} memahami apa yang dibutuhkan pasar."'
    ],
    mixed: [
        '"Ada potensi, tetapi juga ada pekerjaan rumah besar."',
        '"Produk ini membagi opini — bukan hal yang buruk, tapi juga bukan prestasi."',
        '"Menarik, namun belum cukup untuk membuat saya merekomendasikannya tanpa syarat."'
    ],
    negative: [
        '"Konsumen layak menunggu hingga masalah ini diselesaikan."',
        '"Peluncuran ini menunjukkan bahwa {company} perlu mengevaluasi kembali strateginya."',
        '"Saat ini, produk ini sulit direkomendasikan."'
    ]
};

// ============================================================
// UTIL
// ============================================================
export function getOutletById(id) {
    for (var i = 0; i < NEWS_OUTLETS.length; i++) {
        if (NEWS_OUTLETS[i].id === id) return NEWS_OUTLETS[i];
    }
    return null;
}

export function getOutletsForYear(year) {
    var list = [];
    for (var i = 0; i < NEWS_OUTLETS.length; i++) {
        var o = NEWS_OUTLETS[i];
        if (year >= o.fromYear && year <= o.toYear) list.push(o);
    }
    return list;
}

export function getJournalistForCountry(country) {
    var pool = JOURNALISTS[country];
    if (!pool || !pool.length) pool = JOURNALISTS['US'];
    return pool[Math.floor(Math.random() * pool.length)];
}

export function getDatelineForRegion(region) {
    var pool = DATELINE_CITIES[region];
    if (!pool || !pool.length) pool = DATELINE_CITIES['Global'];
    return pool[Math.floor(Math.random() * pool.length)];
}

export function getRandomFrom(arr) {
    if (!arr || !arr.length) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  }
