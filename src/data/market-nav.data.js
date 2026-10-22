// FILE: src/data/market-nav.data.js  (BARU)
// ============================================================
// ATLAS PASAR — data murni (tanpa state) untuk perluasan navigasi pasar:
//   1. SEGMENTS    : 8 segmen konsumen (selera, daya beli, porsi per tahun)
//   2. SUBREGIONS  : 8 sub-wilayah di bawah Asia / Eropa / Amerika & Lainnya
//   3. EXT_TRENDS  : dimensi tren tambahan (tren inti 5 dimensi tetap di MacroModel)
//   4. TREND_WAVES : 15 "gelombang tren" historis (naik -> puncak -> surut)
//   5. VIRAL_EXT   : 16 event viral tambahan (dwibahasa) + terjemahan EN event lama
//   6. PERSONAS    : suara pengulas per segmen (dwibahasa)
// Teks pakai pasangan { id, en }. Angka = perkiraan pembulatan tren publik,
// bukan data resmi. Ubah angka di sini tanpa menyentuh logika.
// ============================================================

export const STAT_KEYS = ['display', 'camera', 'battery', 'performance', 'connectivity', 'design', 'usability', 'quality'];
export const YEAR_ANCHORS = [2000, 2005, 2010, 2015, 2020, 2026];

// ------------------------------------------------------------
// 1. SEGMEN KONSUMEN
//    weights = bobot mentah per YEAR_ANCHORS (dinormalisasi saat dipakai)
//    tastes  = bobot selera per stat produk (dinormalisasi saat dipakai)
//    tilt    = harga yang disukai, kelipatan harga referensi pasar
//    width   = toleransi harga (skala log)
// ------------------------------------------------------------
export const SEGMENTS = [
    { id: 'value', icon: '💸', color: '#f59e0b',
      name: { id: 'Hemat & Value', en: 'Value Seekers' },
      desc: { id: 'Cari ponsel murah yang awet dan tidak boros. Harga nomor satu.', en: 'Want a cheap phone that lasts. Price comes first.' },
      weights: [30, 30, 28, 28, 27, 27],
      tastes: { display: .10, camera: .10, battery: .22, performance: .10, connectivity: .12, design: .04, usability: .12, quality: .20 },
      tilt: 0.55, width: 0.50 },
    { id: 'mainstream', icon: '👥', color: '#3b82f6',
      name: { id: 'Arus Utama', en: 'Mainstream' },
      desc: { id: 'Pembeli umum. Menginginkan keseimbangan harga dan fitur.', en: 'General buyers who want a balance of price and features.' },
      weights: [30, 30, 30, 28, 26, 25],
      tastes: { display: .14, camera: .16, battery: .16, performance: .16, connectivity: .12, design: .10, usability: .08, quality: .08 },
      tilt: 1.00, width: 0.55 },
    { id: 'premium', icon: '💎', color: '#a855f7',
      name: { id: 'Premium & Flagship', en: 'Premium & Flagship' },
      desc: { id: 'Siap bayar mahal untuk desain, kamera, dan performa terbaik.', en: 'Will pay more for the best design, camera and performance.' },
      weights: [8, 9, 10, 12, 13, 14],
      tastes: { display: .16, camera: .18, battery: .08, performance: .18, connectivity: .08, design: .20, usability: .06, quality: .06 },
      tilt: 2.10, width: 0.60 },
    { id: 'gamer', icon: '🎮', color: '#ef4444', minYear: 2004,
      name: { id: 'Gamer & Performa', en: 'Gamers' },
      desc: { id: 'Butuh chip kencang, layar mulus, dan baterai kuat untuk main lama.', en: 'Need a fast chip, smooth screen and a big battery for long sessions.' },
      weights: [0.2, 1, 3, 6, 9, 11],
      tastes: { display: .20, camera: .04, battery: .20, performance: .34, connectivity: .12, design: .04, usability: .02, quality: .04 },
      tilt: 1.40, width: 0.55 },
    { id: 'creator', icon: '📸', color: '#ec4899', minYear: 2004,
      name: { id: 'Kreator & Fotografi', en: 'Creators' },
      desc: { id: 'Kamera dan layar adalah segalanya untuk foto dan video.', en: 'Camera and display matter most for photos and video.' },
      weights: [0.2, 1, 3, 6, 8, 9],
      tastes: { display: .22, camera: .38, battery: .10, performance: .12, connectivity: .04, design: .08, usability: .02, quality: .04 },
      tilt: 1.50, width: 0.55 },
    { id: 'pro', icon: '💼', color: '#0ea5e9',
      name: { id: 'Profesional & Bisnis', en: 'Professionals' },
      desc: { id: 'Butuh koneksi andal, baterai awet, dan perangkat yang mudah dipakai kerja.', en: 'Need reliable connectivity, long battery life and easy work tools.' },
      weights: [12, 12, 9, 7, 6, 6],
      tastes: { display: .06, camera: .04, battery: .26, performance: .10, connectivity: .24, design: .04, usability: .14, quality: .12 },
      tilt: 1.50, width: 0.55 },
    { id: 'youth', icon: '🎒', color: '#22c55e',
      name: { id: 'Pelajar & Gen-Z', en: 'Students & Gen-Z' },
      desc: { id: 'Ikut tren, suka kamera dan tampilan, anggaran terbatas.', en: 'Follow trends, love camera and looks, tight budget.' },
      weights: [6, 10, 14, 16, 16, 15],
      tastes: { display: .16, camera: .24, battery: .14, performance: .14, connectivity: .08, design: .16, usability: .04, quality: .04 },
      tilt: 0.85, width: 0.50 },
    { id: 'senior', icon: '🧓', color: '#78716c',
      name: { id: 'Sederhana & Senior', en: 'Simple & Senior' },
      desc: { id: 'Ingin ponsel mudah dipakai, baterai tahan lama, dan kokoh.', en: 'Want an easy, sturdy phone with long battery life.' },
      weights: [14, 10, 6, 4, 3, 3],
      tastes: { display: .08, camera: .04, battery: .26, performance: .02, connectivity: .14, design: .04, usability: .26, quality: .16 },
      tilt: 0.70, width: 0.50 }
];

// ------------------------------------------------------------
// 2. SUB-WILAYAH (bobot di dalam wilayah induk, dinormalisasi)
//    parent: 'asia' | 'europe' | 'rest' (sama dengan REGION_IDS di region.data.js)
//    tilt  : tingkat harga lokal terhadap harga referensi
// ------------------------------------------------------------
export const SUBREGIONS = [
    { id: 'east_asia', parent: 'asia', color: '#ef4444', icon: '🏯',
      name: { id: 'Asia Timur', en: 'East Asia' },
      desc: { id: 'Cina, Jepang, Korea, Taiwan. Pasar paling cepat mengadopsi teknologi baru.', en: 'China, Japan, Korea, Taiwan. Fastest adopters of new tech.' },
      weights: [70, 62, 55, 50, 46, 44], tilt: 1.10, width: 0.60,
      tastes: { display: .16, camera: .14, battery: .10, performance: .20, connectivity: .14, design: .16, usability: .05, quality: .05 } },
    { id: 'south_asia', parent: 'asia', color: '#f97316', icon: '🪔',
      name: { id: 'Asia Selatan', en: 'South Asia' },
      desc: { id: 'India dan sekitarnya. Sangat sensitif harga, baterai dan kamera jadi andalan.', en: 'India and neighbours. Very price-sensitive; battery and camera win.' },
      weights: [8, 10, 14, 24, 28, 30], tilt: 0.55, width: 0.50,
      tastes: { display: .10, camera: .20, battery: .24, performance: .12, connectivity: .10, design: .06, usability: .08, quality: .10 } },
    { id: 'sea', parent: 'asia', color: '#eab308', icon: '🌴',
      name: { id: 'Asia Tenggara', en: 'Southeast Asia' },
      desc: { id: 'Indonesia, Vietnam, Thailand, dll. Anak muda, kamera, dan e-commerce mendorong penjualan.', en: 'Indonesia, Vietnam, Thailand, etc. Young buyers, camera and e-commerce drive sales.' },
      weights: [22, 28, 31, 26, 26, 26], tilt: 0.65, width: 0.50,
      tastes: { display: .12, camera: .22, battery: .20, performance: .14, connectivity: .12, design: .08, usability: .06, quality: .06 } },
    { id: 'west_europe', parent: 'europe', color: '#8b5cf6', icon: '🏰',
      name: { id: 'Eropa Barat', en: 'Western Europe' },
      desc: { id: 'Makmur, menghargai kualitas, desain, dan privasi.', en: 'Affluent; values build quality, design and privacy.' },
      weights: [76, 72, 68, 66, 64, 62], tilt: 1.25, width: 0.60,
      tastes: { display: .14, camera: .14, battery: .12, performance: .14, connectivity: .10, design: .14, usability: .10, quality: .12 } },
    { id: 'east_europe', parent: 'europe', color: '#6366f1', icon: '🚂',
      name: { id: 'Eropa Timur & Turki', en: 'Eastern Europe & Turkey' },
      desc: { id: 'Pembeli hemat spesifikasi: performa tinggi di harga menengah.', en: 'Spec-per-dollar buyers: strong performance at mid prices.' },
      weights: [24, 28, 32, 34, 36, 38], tilt: 0.80, width: 0.55,
      tastes: { display: .14, camera: .14, battery: .16, performance: .22, connectivity: .10, design: .06, usability: .06, quality: .12 } },
    { id: 'north_america', parent: 'rest', color: '#10b981', icon: '🗽',
      name: { id: 'Amerika Utara', en: 'North America' },
      desc: { id: 'Dikuasai kontrak operator dan ekosistem OS. Harga tinggi, brand penting.', en: 'Driven by carrier contracts and OS ecosystems. High prices, brand matters.' },
      weights: [55, 52, 48, 44, 42, 40], tilt: 1.50, width: 0.65,
      tastes: { display: .14, camera: .18, battery: .12, performance: .18, connectivity: .12, design: .14, usability: .06, quality: .06 } },
    { id: 'latin_america', parent: 'rest', color: '#14b8a6', icon: '🎭',
      name: { id: 'Amerika Latin', en: 'Latin America' },
      desc: { id: 'Cicilan, kamera, dan baterai. Harga terjangkau sangat menentukan.', en: 'Installments, camera and battery. Affordable pricing decides.' },
      weights: [25, 26, 28, 28, 28, 28], tilt: 0.70, width: 0.50,
      tastes: { display: .12, camera: .22, battery: .20, performance: .12, connectivity: .10, design: .08, usability: .06, quality: .10 } },
    { id: 'mea', parent: 'rest', color: '#d97706', icon: '🐪',
      name: { id: 'Timur Tengah & Afrika', en: 'Middle East & Africa' },
      desc: { id: 'Ponsel kokoh, baterai awet, dan dual SIM. Pertumbuhan paling cepat.', en: 'Rugged phones, long battery and dual SIM. Fastest growing.' },
      weights: [20, 22, 24, 28, 30, 32], tilt: 0.60, width: 0.55,
      tastes: { display: .08, camera: .12, battery: .26, performance: .08, connectivity: .18, design: .06, usability: .08, quality: .14 } }
];

// ------------------------------------------------------------
// 3. TREN TAMBAHAN (0-1, jangkar per YEAR_ANCHORS)
//    5 tren inti (camera, battery, screen, performance, design) tetap ada di
//    MacroModel/market.trends dan TIDAK diubah, agar rumus permintaan lama aman.
// ------------------------------------------------------------
export const EXT_TRENDS = [
    { id: 'connectivity', icon: '📶', stat: 'connectivity', anchors: [0.30, 0.45, 0.50, 0.60, 0.75, 0.80] },
    { id: 'usability',    icon: '👆', stat: 'usability',    anchors: [0.45, 0.40, 0.55, 0.55, 0.50, 0.55] },
    { id: 'durability',   icon: '🛡️', stat: 'quality',      anchors: [0.50, 0.40, 0.35, 0.35, 0.40, 0.45] },
    { id: 'foldform',     icon: '📐', stat: 'form',         anchors: [0.30, 0.50, 0.60, 0.45, 0.45, 0.55] }
];

// ------------------------------------------------------------
// 4. GELOMBANG TREN HISTORIS
//    from -> peak -> to : intensitas naik lalu surut (segitiga)
//    boost   : stat yang diuntungkan (jumlah bobot ~1)
//    segs    : pengali bobot segmen saat puncak
//    regs    : pengali bobot sub-wilayah saat puncak
// ------------------------------------------------------------
export const TREND_WAVES = [
    { id: 'sms_era', icon: '💬', from: 2000, peak: 2005, to: 2008, strength: 0.22,
      boost: { usability: .5, battery: .5 }, segs: { youth: 1.25, senior: 1.10 },
      name: { id: 'Demam SMS & Nada Dering', en: 'SMS & Ringtone Craze' },
      desc: { id: 'Berkirim pesan dan nada dering jadi gaya hidup.', en: 'Texting and ringtones become a lifestyle.' } },
    { id: 'durable_phone', icon: '🧱', from: 2002, peak: 2006, to: 2011, strength: 0.18,
      boost: { quality: .6, battery: .4 }, segs: { senior: 1.15, value: 1.10 }, regs: { mea: 1.20, south_asia: 1.10 },
      name: { id: 'Ponsel Tahan Banting', en: 'Tough Phone Demand' },
      desc: { id: 'Pembeli di pasar berkembang mencari ponsel kokoh dan awet.', en: 'Emerging-market buyers look for tough, long-lasting phones.' } },
    { id: 'camera_phone', icon: '📷', from: 2003, peak: 2007, to: 2012, strength: 0.24,
      boost: { camera: .7, display: .3 }, segs: { youth: 1.20, creator: 1.30 },
      name: { id: 'Ledakan Ponsel Kamera', en: 'Camera Phone Boom' },
      desc: { id: 'Kamera megapiksel jadi alasan utama upgrade.', en: 'Megapixel cameras become the main reason to upgrade.' } },
    { id: 'push_email', icon: '📧', from: 2002, peak: 2007, to: 2012, strength: 0.22,
      boost: { connectivity: .5, usability: .3, battery: .2 }, segs: { pro: 1.35 }, regs: { north_america: 1.15, west_europe: 1.10 },
      name: { id: 'Era Surel & Keyboard', en: 'Push Email Era' },
      desc: { id: 'Profesional ingin surel kapan saja di saku.', en: 'Professionals want email anywhere in their pocket.' } },
    { id: 'value_crunch', icon: '📉', from: 2008, peak: 2009, to: 2011, strength: 0.24,
      boost: { quality: .4, usability: .4, battery: .2 }, segs: { value: 1.25, premium: 0.85 },
      name: { id: 'Krisis Finansial: Hemat Dulu', en: 'Financial Crisis: Spend Less' },
      desc: { id: 'Konsumen menunda ponsel mahal dan memilih yang masuk akal.', en: 'Consumers delay pricey phones and pick sensible ones.' } },
    { id: 'touch_rush', icon: '👆', from: 2008, peak: 2011, to: 2015, strength: 0.26,
      boost: { display: .5, design: .3, usability: .2 }, segs: { premium: 1.20, mainstream: 1.10 },
      name: { id: 'Demam Layar Sentuh', en: 'Touchscreen Rush' },
      desc: { id: 'Layar sentuh besar menggantikan tombol.', en: 'Big touchscreens replace keypads.' } },
    { id: 'app_boom', icon: '🧩', from: 2009, peak: 2013, to: 2018, strength: 0.24,
      boost: { performance: .5, usability: .3, connectivity: .2 }, segs: { youth: 1.20, gamer: 1.20 },
      name: { id: 'Ledakan Aplikasi', en: 'App Store Boom' },
      desc: { id: 'Toko aplikasi mengubah ponsel jadi komputer saku.', en: 'App stores turn phones into pocket computers.' } },
    { id: 'selfie_social', icon: '🤳', from: 2012, peak: 2016, to: 2021, strength: 0.24,
      boost: { camera: .7, display: .15, design: .15 }, segs: { youth: 1.30, creator: 1.35 }, regs: { sea: 1.20, south_asia: 1.15, latin_america: 1.10 },
      name: { id: 'Era Selfie & Media Sosial', en: 'Selfie & Social Era' },
      desc: { id: 'Kamera depan dan unggahan foto jadi penentu pembelian.', en: 'Front cameras and photo sharing decide purchases.' } },
    { id: 'big_screen', icon: '📱', from: 2013, peak: 2016, to: 2019, strength: 0.18,
      boost: { display: .6, battery: .4 }, segs: { mainstream: 1.10, value: 1.05 },
      name: { id: 'Tren Layar Besar', en: 'Big Screen Trend' },
      desc: { id: 'Phablet menggeser layar kecil.', en: 'Phablets push out small screens.' } },
    { id: 'fast_charge', icon: '⚡', from: 2016, peak: 2019, to: 2023, strength: 0.20,
      boost: { battery: .8, performance: .2 }, segs: { value: 1.10, gamer: 1.15 }, regs: { south_asia: 1.20, sea: 1.15, east_asia: 1.10 },
      name: { id: 'Perang Pengisian Cepat', en: 'Fast Charging Race' },
      desc: { id: 'Isi daya singkat jadi nilai jual utama.', en: 'Quick top-ups become a key selling point.' } },
    { id: 'mobile_gaming', icon: '🎮', from: 2016, peak: 2022, to: 2026, strength: 0.24,
      boost: { performance: .6, display: .2, battery: .2 }, segs: { gamer: 1.40, youth: 1.15 },
      name: { id: 'Demam Gim Seluler', en: 'Mobile Gaming Surge' },
      desc: { id: 'Gim dan esports di ponsel menarik jutaan pemain.', en: 'Mobile games and esports attract millions.' } },
    { id: 'short_video', icon: '🎬', from: 2018, peak: 2022, to: 2026, strength: 0.22,
      boost: { camera: .4, display: .3, battery: .15, performance: .15 }, segs: { youth: 1.25, creator: 1.30 }, regs: { sea: 1.20, south_asia: 1.20 },
      name: { id: 'Ledakan Video Pendek', en: 'Short Video Boom' },
      desc: { id: 'Video vertikal menuntut kamera dan layar yang kuat.', en: 'Vertical video demands strong cameras and screens.' } },
    { id: 'five_g_race', icon: '📡', from: 2019, peak: 2022, to: 2025, strength: 0.22,
      boost: { connectivity: .7, performance: .3 }, segs: { premium: 1.15, pro: 1.10 }, regs: { east_asia: 1.20, north_america: 1.10, west_europe: 1.05 },
      name: { id: 'Perlombaan 5G', en: '5G Race' },
      desc: { id: 'Operator dan pabrikan berebut label 5G.', en: 'Carriers and makers race for the 5G label.' } },
    { id: 'foldable', icon: '📖', from: 2019, peak: 2024, to: 2027, strength: 0.18,
      boost: { form: .6, design: .25, display: .15 }, segs: { premium: 1.25 }, regs: { east_asia: 1.15, west_europe: 1.05 },
      name: { id: 'Penasaran Ponsel Lipat', en: 'Foldable Curiosity' },
      desc: { id: 'Ponsel lipat menarik pembeli yang mencari hal baru.', en: 'Foldables attract buyers looking for something new.' } },
    { id: 'inflation_squeeze', icon: '🧾', from: 2022, peak: 2023, to: 2025, strength: 0.18,
      boost: { quality: .4, battery: .3, usability: .3 }, segs: { value: 1.20, premium: 0.92 },
      name: { id: 'Inflasi: Dompet Menipis', en: 'Inflation Squeeze' },
      desc: { id: 'Biaya hidup naik, pembeli menahan pengeluaran.', en: 'Rising living costs make buyers hold back.' } },
    { id: 'ai_phone', icon: '🤖', from: 2023, peak: 2026, to: 2028, strength: 0.20,
      boost: { performance: .5, usability: .3, camera: .2 }, segs: { premium: 1.20, pro: 1.15, creator: 1.15 },
      name: { id: 'Demam Ponsel AI', en: 'AI Phone Hype' },
      desc: { id: 'Fitur AI di perangkat jadi sorotan promosi.', en: 'On-device AI features dominate marketing.' } }
];

// ------------------------------------------------------------
// 5. VIRAL TAMBAHAN
//    kind: 'brand' (menyangkut perusahaan) | 'product' (menyangkut satu produk)
//    segs/regs: fokus audiens (opsional) -> efek permintaan hanya menjangkau porsinya
// ------------------------------------------------------------
export const VIRAL_EXT = [
    // ---------- POSITIF ----------
    { id: 'viral_unboxing', type: 'positive', kind: 'product', minYear: 2010, segs: ['youth', 'creator'],
      title: { id: 'Video unboxing meledak', en: 'Unboxing video blows up' },
      text: { id: 'Kreator populer membuka kotak ponselmu dan penontonnya ramai bertanya di mana belinya.', en: 'A popular creator unboxes your phone and viewers flood in asking where to buy it.' },
      effects: { reputation: 4, dailyDemandBoost: 0.20, durationDays: 7 } },
    { id: 'viral_esports', type: 'positive', kind: 'product', minYear: 2013, segs: ['gamer', 'youth'],
      title: { id: 'Dipakai pemain esports', en: 'Adopted by esports players' },
      text: { id: 'Tim esports terkenal bermain dengan ponselmu dan komunitas gamer mulai bicara.', en: 'A famous esports team plays on your phone and the gamer community starts talking.' },
      effects: { reputation: 4, dailyDemandBoost: 0.22, durationDays: 9 } },
    { id: 'viral_selfie_hit', type: 'positive', kind: 'product', minYear: 2012, segs: ['youth', 'creator'], regs: ['sea', 'south_asia', 'latin_america'],
      title: { id: 'Kamera selfie jadi buah bibir', en: 'Selfie camera becomes the talk of the town' },
      text: { id: 'Hasil foto depan yang cantik membanjiri media sosial di pasar berkembang.', en: 'Flattering front-camera shots flood social media in emerging markets.' },
      effects: { reputation: 4, dailyDemandBoost: 0.22, durationDays: 8 } },
    { id: 'viral_drop_test', type: 'positive', kind: 'product', minYear: 2004, segs: ['value', 'senior', 'pro'],
      title: { id: 'Lolos uji jatuh ekstrem', en: 'Survives extreme drop test' },
      text: { id: 'Video uji jatuh membuktikan bodi ponselmu sangat kokoh.', en: 'A drop-test video proves how tough your phone is.' },
      effects: { reputation: 4, dailyDemandBoost: 0.16, durationDays: 8 } },
    { id: 'viral_carrier_bundle', type: 'positive', kind: 'brand', minYear: 2002, regs: ['north_america', 'west_europe', 'latin_america'],
      title: { id: 'Operator menawarkan paket bundling', en: 'Carriers offer bundle deals' },
      text: { id: 'Operator besar memasukkan ponselmu ke paket cicilan sehingga lebih mudah dibeli.', en: 'Major carriers add your phone to installment plans, making it easier to buy.' },
      effects: { reputation: 3, dailyDemandBoost: 0.18, durationDays: 14 } },
    { id: 'viral_senior_friendly', type: 'positive', kind: 'product', maxYear: 2014, segs: ['senior', 'value'],
      title: { id: 'Dipuji karena mudah dipakai', en: 'Praised for being easy to use' },
      text: { id: 'Anak-anak merekomendasikan ponselmu untuk orang tua mereka karena menunya sederhana.', en: 'Adult children recommend your phone to their parents for its simple menus.' },
      effects: { reputation: 3, dailyDemandBoost: 0.15, durationDays: 10 } },
    { id: 'viral_work_tool', type: 'positive', kind: 'brand', maxYear: 2013, segs: ['pro'],
      title: { id: 'Jadi ponsel kerja favorit kantor', en: 'Becomes the office favourite' },
      text: { id: 'Banyak perusahaan menjadikan ponselmu perangkat standar karyawan.', en: 'Several companies make your phone the standard staff device.' },
      effects: { reputation: 5, dailyDemandBoost: 0.18, durationDays: 14 } },
    { id: 'viral_festival_rush', type: 'positive', kind: 'brand', minYear: 2008, regs: ['east_asia', 'south_asia', 'sea'],
      title: { id: 'Antrean belanja festival', en: 'Festival shopping rush' },
      text: { id: 'Musim belanja besar membuat toko dipenuhi pembeli ponsel.', en: 'A big shopping season fills stores with phone buyers.' },
      effects: { reputation: 2, dailyDemandBoost: 0.18, durationDays: 6 } },
    // ---------- NEGATIF ----------
    { id: 'viral_privacy_scare', type: 'negative', kind: 'brand', minYear: 2010, segs: ['pro', 'premium'], regs: ['west_europe', 'north_america'],
      title: { id: 'Kekhawatiran privasi data', en: 'Data privacy scare' },
      text: { id: 'Laporan media mempertanyakan cara ponselmu menangani data pengguna.', en: 'Media reports question how your phone handles user data.' },
      effects: { reputation: -5, dailyDemandBoost: -0.18, durationDays: 10 } },
    { id: 'viral_ewaste', type: 'negative', kind: 'brand', minYear: 2012, regs: ['west_europe'], segs: ['youth', 'premium'],
      title: { id: 'Kritik limbah elektronik', en: 'E-waste criticism' },
      text: { id: 'Aktivis menyoroti baterai tanam dan sulitnya perbaikan produkmu.', en: 'Activists call out sealed batteries and hard-to-repair products.' },
      effects: { reputation: -3, dailyDemandBoost: -0.12, durationDays: 10 } },
    { id: 'viral_charging_safety', type: 'negative', kind: 'product', minYear: 2005,
      title: { id: 'Isu keamanan pengisian daya', en: 'Charging safety concern' },
      text: { id: 'Foto baterai menggembung beredar luas dan pembeli mulai ragu.', en: 'Photos of swollen batteries circulate and buyers hesitate.' },
      effects: { reputation: -6, dailyDemandBoost: -0.22, durationDays: 8 } },
    { id: 'viral_fake_review', type: 'negative', kind: 'brand', minYear: 2012,
      title: { id: 'Dituding ulasan palsu', en: 'Accused of fake reviews' },
      text: { id: 'Netizen menemukan ulasan bintang lima yang mencurigakan di toko daring.', en: 'Netizens spot suspicious five-star reviews on online stores.' },
      effects: { reputation: -4, dailyDemandBoost: -0.14, durationDays: 9 } },
    { id: 'viral_price_gouging', type: 'negative', kind: 'product', segs: ['value', 'youth', 'mainstream'],
      title: { id: 'Dianggap kemahalan', en: 'Called overpriced' },
      text: { id: 'Perbandingan harga ramai: pembeli merasa pesaing menawarkan lebih banyak.', en: 'Price comparisons go viral: buyers feel rivals offer more.' },
      effects: { reputation: -3, dailyDemandBoost: -0.16, durationDays: 8 } },
    { id: 'viral_service_queue', type: 'negative', kind: 'brand', minYear: 2004,
      title: { id: 'Antrean layanan purnajual', en: 'After-sales queues' },
      text: { id: 'Pelanggan mengeluh lamanya perbaikan di pusat servis.', en: 'Customers complain about long repair waits at service centres.' },
      effects: { reputation: -4, dailyDemandBoost: -0.14, durationDays: 10 } },
    { id: 'viral_supply_delay', type: 'negative', kind: 'brand', regs: ['mea', 'latin_america', 'south_asia'],
      title: { id: 'Stok telat di pasar berkembang', en: 'Stock delays in emerging markets' },
      text: { id: 'Pengiriman terlambat membuat pembeli beralih ke merek lain.', en: 'Late shipments push buyers toward other brands.' },
      effects: { reputation: -3, dailyDemandBoost: -0.14, durationDays: 9 } },
    { id: 'viral_no_localization', type: 'negative', kind: 'brand', minYear: 2007, regs: ['east_asia', 'sea', 'east_europe'],
      title: { id: 'Kurang cocok dengan pasar lokal', en: 'Poor local fit' },
      text: { id: 'Pengguna lokal mengeluh soal bahasa, input teks, dan dukungan aplikasi lokal.', en: 'Local users complain about language, text input and local app support.' },
      effects: { reputation: -3, dailyDemandBoost: -0.13, durationDays: 9 } }
];

// Terjemahan EN untuk 10 event viral lama (feedback.data.js hanya berbahasa Indonesia)
export const VIRAL_LEGACY_EN = {
    viral_camera:        { title: 'Camera goes viral on social media', text: 'Users praise your phone camera. The photos spread everywhere.' },
    viral_battery:       { title: 'Battery test goes viral', text: 'An endurance test spreads widely. Many are impressed.' },
    viral_design:        { title: 'Design praised', text: 'A well-known designer praises your phone design.' },
    viral_performance:   { title: 'Stunning benchmark', text: 'A surprising benchmark score. Gamers rush to buy.' },
    viral_price:         { title: 'Price seen as a bargain', text: 'The mix of specs and price becomes a talking point.' },
    viral_heating:       { title: 'Phone overheats', text: 'Overheating complaints spread. Many users are upset.' },
    viral_battery_drain: { title: 'Poor battery life', text: 'Battery tests show poor results. Forums are buzzing.' },
    viral_display_issue: { title: 'Display problems', text: 'Reports of screen flicker spread quickly.' },
    viral_crash:         { title: 'Apps crash often', text: 'Software stability is questioned. Negative reviews appear.' },
    viral_build:         { title: 'Build quality questioned', text: 'Complaints about easily damaged bodies. Cracked-phone photos go viral.' }
};

// Respons tambahan untuk viral negatif (id lama tetap: apology, recall, clarify, ignore)
export const VIRAL_RESPONSES_EXT = [
    { id: 'community_ama', cost: 3000, effect: { reputation: 3 },
      label: { id: 'Sesi Tanya Jawab Terbuka', en: 'Open Q&A Session' },
      description: { id: 'Jawab pertanyaan komunitas secara langsung.', en: 'Answer community questions in the open.' } },
    { id: 'software_fix', cost: 6000, effect: { reputation: 4 },
      label: { id: 'Rilis Pembaruan Perbaikan', en: 'Ship a Fix Update' },
      description: { id: 'Dorong pembaruan cepat untuk menambal keluhan.', en: 'Push a quick update that patches the complaint.' } },
    { id: 'goodwill_voucher', cost: 10000, effect: { reputation: 5 },
      label: { id: 'Voucher Kompensasi', en: 'Goodwill Voucher' },
      description: { id: 'Beri voucher kepada pelanggan terdampak.', en: 'Give vouchers to affected customers.' } }
];

// ------------------------------------------------------------
// 6. SUARA PENGULAS PER SEGMEN ({p} = nama produk)
// ------------------------------------------------------------
export const PERSONAS = {
    value: {
        pos: { id: ['Murah tapi tidak murahan. {p} cocok buat kantong saya.', 'Dengan harga segini {p} sudah lebih dari cukup.'],
               en: ['Cheap but not cheap-feeling. {p} fits my wallet.', 'For this price {p} is more than enough.'] },
        neg: { id: ['Katanya hemat, tapi {p} tetap terasa mahal untuk isinya.', 'Uang saya terbatas, {p} belum layak dibeli.'],
               en: ['Supposedly a bargain, but {p} still feels pricey for what it offers.', 'My budget is tight; {p} is not worth it yet.'] } },
    mainstream: {
        pos: { id: ['{p} nyaman dipakai sehari-hari, tidak ribet.', 'Pilihan aman untuk kebanyakan orang: {p}.'],
               en: ['{p} is comfortable for everyday use, no fuss.', 'A safe pick for most people: {p}.'] },
        neg: { id: ['{p} biasa saja dan tidak menonjol dibanding yang lain.', 'Saya bingung kenapa harus memilih {p} dibanding merek lain.'],
               en: ['{p} is ordinary and does not stand out from the rest.', 'I do not see why I should pick {p} over other brands.'] } },
    premium: {
        pos: { id: ['{p} terasa mewah di tangan. Finishing-nya kelas atas.', 'Untuk flagship, {p} memenuhi standar saya.'],
               en: ['{p} feels luxurious in the hand. Top-tier finish.', 'As a flagship, {p} meets my standards.'] },
        neg: { id: ['Harga flagship, tapi {p} belum terasa istimewa.', 'Untuk kelas premium, {p} masih ada kekurangan di detail.'],
               en: ['Flagship price, but {p} does not feel special yet.', 'For a premium phone, {p} still misses details.'] } },
    gamer: {
        pos: { id: ['Main gim berat di {p} lancar, frame rate stabil.', '{p} kuat dipakai maraton gim berjam-jam.'],
               en: ['Heavy games run smoothly on {p}, stable frame rate.', '{p} holds up through hours-long gaming marathons.'] },
        neg: { id: ['{p} cepat panas dan patah-patah saat gim berat.', 'Baterai {p} tumbang di tengah sesi gim.'],
               en: ['{p} heats up and stutters in heavy games.', '{p} battery dies mid gaming session.'] } },
    creator: {
        pos: { id: ['Hasil foto dan video {p} cukup untuk konten saya.', 'Kamera {p} bikin proses mengedit lebih ringan.'],
               en: ['Photos and video from {p} are good enough for my content.', 'The {p} camera makes editing lighter.'] },
        neg: { id: ['Kamera {p} belum cukup untuk kebutuhan konten serius.', 'Warna layar {p} kurang akurat untuk mengedit foto.'],
               en: ['The {p} camera is not enough for serious content.', 'The {p} screen colours are too inaccurate for photo editing.'] } },
    pro: {
        pos: { id: ['{p} andal untuk kerja: sinyal stabil, baterai tahan rapat seharian.', 'Surel dan panggilan klien lancar di {p}.'],
               en: ['{p} is dependable for work: steady signal, battery lasts all day of meetings.', 'Email and client calls run smoothly on {p}.'] },
        neg: { id: ['Sinyal {p} putus-putus saat rapat. Tidak profesional.', 'Baterai {p} tidak cukup untuk hari kerja penuh.'],
               en: ['The {p} signal drops during meetings. Unprofessional.', 'The {p} battery cannot last a full workday.'] } },
    youth: {
        pos: { id: ['{p} keren buat konten dan nongkrong, harganya masih masuk uang saku.', 'Teman-teman satu kelas pada pakai {p}.'],
               en: ['{p} is great for content and hanging out, and the price fits my allowance.', 'Everyone in my class uses {p}.'] },
        neg: { id: ['{p} kurang kekinian dan kameranya biasa saja.', 'Uang jajan saya tidak cukup untuk {p}.'],
               en: ['{p} is not trendy and the camera is average.', 'My allowance is not enough for {p}.'] } },
    senior: {
        pos: { id: ['{p} mudah dipakai, huruf jelas, dan baterainya awet.', 'Cucu saya yang memilihkan {p}. Saya senang, tidak rumit.'],
               en: ['{p} is easy to use, text is clear and the battery lasts.', 'My grandchild picked {p} for me. I like that it is not complicated.'] },
        neg: { id: ['Menu {p} membingungkan buat saya.', 'Tombol dan huruf {p} terlalu kecil.'],
               en: ['The {p} menus confuse me.', 'The buttons and text on {p} are too small.'] } }
};

// ============================================================
// FUNGSI MURNI
// ============================================================
export function getSegment(id) { return SEGMENTS.find(function (s) { return s.id === id; }) || null; }
export function getSubregion(id) { return SUBREGIONS.find(function (s) { return s.id === id; }) || null; }
export function getWave(id) { return TREND_WAVES.find(function (w) { return w.id === id; }) || null; }
export function getViralExt(id) { return VIRAL_EXT.find(function (v) { return v.id === id; }) || null; }
export function getViralResponseExt(id) { return VIRAL_RESPONSES_EXT.find(function (r) { return r.id === id; }) || null; }

export function interpAnchors(values, year) {
    var A = YEAR_ANCHORS;
    var y = Number(year) || 2000;
    if (y <= A[0]) return values[0];
    if (y >= A[A.length - 1]) return values[values.length - 1];
    for (var i = 0; i < A.length - 1; i++) {
        if (y >= A[i] && y <= A[i + 1]) {
            var t = (y - A[i]) / (A[i + 1] - A[i]);
            return values[i] + (values[i + 1] - values[i]) * t;
        }
    }
    return values[values.length - 1];
}

// Intensitas gelombang 0..1 pada waktu t (tahun desimal).
export function waveIntensity(w, t) {
    if (t <= w.from || t >= w.to) return 0;
    if (t <= w.peak) return (t - w.from) / Math.max(0.01, w.peak - w.from);
    return (w.to - t) / Math.max(0.01, w.to - w.peak);
}

// Porsi segmen (dijumlahkan = 1). mults = { segId: pengali } opsional.
export function getSegmentWeights(year, mults) {
    var out = {}, sum = 0;
    SEGMENTS.forEach(function (s) {
        var raw = interpAnchors(s.weights, year);
        if (s.minYear && year < s.minYear) raw = Math.min(raw, s.weights[0]);
        raw = Math.max(0, raw) * ((mults && mults[s.id]) || 1);
        out[s.id] = raw; sum += raw;
    });
    SEGMENTS.forEach(function (s) { out[s.id] = sum > 0 ? out[s.id] / sum : 1 / SEGMENTS.length; });
    return out;
}

// Porsi sub-wilayah terhadap SELURUH dunia (dijumlahkan = 1).
// parentWeights = { asia, europe, rest }  (dari getRegionWeights)
export function getSubregionWeights(year, parentWeights, mults) {
    var out = {};
    var parents = ['asia', 'europe', 'rest'];
    parents.forEach(function (p) {
        var kids = SUBREGIONS.filter(function (s) { return s.parent === p; });
        var sum = 0, raws = {};
        kids.forEach(function (s) {
            var raw = Math.max(0, interpAnchors(s.weights, year)) * ((mults && mults[s.id]) || 1);
            raws[s.id] = raw; sum += raw;
        });
        kids.forEach(function (s) {
            out[s.id] = (sum > 0 ? raws[s.id] / sum : 1 / kids.length) * ((parentWeights && parentWeights[p]) || 0);
        });
    });
    var total = 0;
    for (var k in out) total += out[k];
    if (total > 0) for (var k2 in out) out[k2] = out[k2] / total;
    return out;
}

// Pemeriksaan integritas data (dipakai uji; mengembalikan daftar masalah).
export function validateMarketNavData() {
    var issues = [];
    function dup(list, label) {
        var seen = {};
        list.forEach(function (x) { if (seen[x.id]) issues.push('ID ganda ' + label + ': ' + x.id); seen[x.id] = true; });
    }
    dup(SEGMENTS, 'segmen'); dup(SUBREGIONS, 'sub-wilayah'); dup(TREND_WAVES, 'gelombang');
    dup(VIRAL_EXT, 'viral'); dup(VIRAL_RESPONSES_EXT, 'respons'); dup(EXT_TRENDS, 'tren');
    SEGMENTS.concat(SUBREGIONS).forEach(function (s) {
        if (s.weights.length !== YEAR_ANCHORS.length) issues.push('Jumlah jangkar bobot salah: ' + s.id);
        var ts = 0; STAT_KEYS.forEach(function (k) { if (typeof s.tastes[k] !== 'number') issues.push('Selera hilang ' + s.id + '.' + k); ts += s.tastes[k] || 0; });
        if (Math.abs(ts - 1) > 0.021) issues.push('Selera tidak berjumlah 1: ' + s.id + ' = ' + ts.toFixed(3));
        if (!s.name || !s.name.id || !s.name.en || !s.desc || !s.desc.id || !s.desc.en) issues.push('Nama/deskripsi dwibahasa kurang: ' + s.id);
    });
    EXT_TRENDS.forEach(function (e) { if (e.anchors.length !== YEAR_ANCHORS.length) issues.push('Jangkar tren salah: ' + e.id); });
    TREND_WAVES.forEach(function (w) {
        if (!(w.from < w.peak && w.peak < w.to)) issues.push('Urutan tahun gelombang salah: ' + w.id);
        var bs = 0; for (var k in w.boost) { bs += w.boost[k]; if (STAT_KEYS.indexOf(k) < 0 && k !== 'form') issues.push('Stat gelombang tak dikenal ' + w.id + '.' + k); }
        if (Math.abs(bs - 1) > 0.021) issues.push('Boost gelombang tidak berjumlah 1: ' + w.id);
        for (var sg in (w.segs || {})) if (!getSegment(sg)) issues.push('Segmen tak dikenal di gelombang ' + w.id + ': ' + sg);
        for (var rg in (w.regs || {})) if (!getSubregion(rg)) issues.push('Sub-wilayah tak dikenal di gelombang ' + w.id + ': ' + rg);
        if (!w.name.id || !w.name.en || !w.desc.id || !w.desc.en) issues.push('Teks gelombang kurang: ' + w.id);
    });
    VIRAL_EXT.forEach(function (v) {
        (v.segs || []).forEach(function (sg) { if (!getSegment(sg)) issues.push('Segmen tak dikenal di viral ' + v.id + ': ' + sg); });
        (v.regs || []).forEach(function (rg) { if (!getSubregion(rg)) issues.push('Sub-wilayah tak dikenal di viral ' + v.id + ': ' + rg); });
        if (!v.title.id || !v.title.en || !v.text.id || !v.text.en) issues.push('Teks viral kurang: ' + v.id);
        if ((v.type === 'positive') !== (v.effects.dailyDemandBoost > 0)) issues.push('Tanda efek viral tidak cocok: ' + v.id);
    });
    SEGMENTS.forEach(function (s) {
        var p = PERSONAS[s.id];
        if (!p) { issues.push('Persona hilang: ' + s.id); return; }
        ['pos', 'neg'].forEach(function (k) {
            ['id', 'en'].forEach(function (l) {
                if (!p[k] || !Array.isArray(p[k][l]) || p[k][l].length < 2) issues.push('Persona kurang ' + s.id + '.' + k + '.' + l);
                else p[k][l].forEach(function (line) { if (line.indexOf('{p}') < 0) issues.push('Persona tanpa {p}: ' + s.id + '.' + k + '.' + l); });
            });
        });
    });
    return issues;
}
