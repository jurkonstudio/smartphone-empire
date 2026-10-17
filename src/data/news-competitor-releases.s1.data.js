// FILE: src/data/news-competitor-releases.s1.data.js
// ============================================================
// BERITA RILIS KOMPETITOR — SESI 1 (2000-2008).
// Tambahan untuk news-competitor-releases.data.js: era ponsel fitur,
// Symbian/Palm/BlackBerry, lahirnya iPhone, sampai Android Market.
//
// Modul ini mendaftarkan entrinya sendiri ke daftar utama
// (COMPETITOR_RELEASE_NEWS) saat di-import, jadi getCompetitor-
// ReleasesForMonth() dan validateCompetitorReleaseNews() otomatis
// ikut membaca entri ini. Format field sama dengan file utama.
// Teks ditulis ulang ringkas (bukan kutipan media).
// ============================================================
import { COMPETITOR_RELEASE_NEWS } from './news-competitor-releases.data.js';

export const COMPETITOR_RELEASE_NEWS_S1 = [
    // ==================== 2000 ====================
    { cid: 'samsung', year: 2000, month: 6, product: 'Samsung SCH-V200', tone: 'positive', tags: ['samsung', 'camera', 'korea'], approx: true,
      h: "Samsung SCH-V200: ponsel dengan kamera bawaan debut di Korea",
      t: "Samsung menanam kamera digital resolusi rendah ke dalam ponsel. Perangkat ini hanya menyimpan sekitar 20 foto, tetapi menjadi salah satu pelopor ponsel berkamera.",
      h_en: "Samsung SCH-V200: a phone with a built-in camera debuts in Korea",
      t_en: "Samsung embeds a low-resolution digital camera in a phone. It stores only about 20 photos, yet it becomes one of the pioneers of the camera phone." },
    { cid: 'blackberry', year: 2000, month: 10, product: 'BlackBerry 957', tone: 'positive', tags: ['blackberry', 'push_email', 'enterprise'], approx: true,
      h: "RIM luncurkan BlackBerry 957: email nirkabel push untuk kalangan korporat",
      t: "Perangkat genggam ini belum bisa dipakai menelepon, tetapi email masuk langsung ke saku para eksekutif. Pelanggan korporat mulai menjadikannya perlengkapan wajib.",
      h_en: "RIM launches the BlackBerry 957: push wireless email for corporate users",
      t_en: "The handheld cannot make calls yet, but email lands straight in an executive's pocket. Corporate customers begin treating it as essential kit." },

    // ==================== 2003 ====================
    { cid: 'nokia', year: 2003, month: 6, product: 'Nokia 6600', tone: 'positive', tags: ['nokia', 'symbian', 'series60'], approx: true,
      h: "Nokia 6600 bawa Symbian Series 60 ke pasar massal",
      t: "Layar berwarna, Bluetooth, dan kamera VGA dikemas dalam bodi ponsel biasa. Nokia menunjukkan ponsel pintar tidak harus tampil seperti organizer bisnis.",
      h_en: "Nokia 6600 brings Symbian Series 60 to the mass market",
      t_en: "A color screen, Bluetooth, and a VGA camera come in an ordinary phone body. Nokia shows that a smartphone need not look like a business organizer." },
    { cid: 'palm', year: 2003, month: 6, product: 'Palm Akuisisi Handspring', tone: 'positive', tags: ['palm', 'handspring', 'treo', 'corporate'],
      h: "Palm akuisisi Handspring, pembuat Treo, senilai sekitar US$169 juta",
      t: "Palm membeli pesaing sekaligus mitra inovatif yang menciptakan lini Treo. Kesepakatan ini menyatukan keahlian PDA dengan ponsel pintar.",
      h_en: "Palm acquires Handspring, maker of the Treo, for about $169 million",
      t_en: "Palm buys a rival and innovative partner that created the Treo line. The deal merges PDA expertise with smartphones." },
    { cid: 'palm', year: 2003, month: 10, day: 28, product: 'Palm Pecah palmOne PalmSource', tone: 'mixed', tags: ['palm', 'palmsource', 'corporate'],
      h: "Palm pecah jadi dua: palmOne untuk perangkat, PalmSource untuk sistem operasi",
      t: "Pemisahan ini memberi kebebasan bagi pembuat OS melisensikan Palm OS ke pihak lain. Di sisi lain, perangkat keras dan perangkat lunak tak lagi satu atap.",
      h_en: "Palm splits in two: palmOne for hardware, PalmSource for the OS",
      t_en: "The split frees the OS maker to license Palm OS to others. On the flip side, hardware and software no longer live under one roof." },

    // ==================== 2005 ====================
    { cid: 'nokia', year: 2005, month: 5, product: 'Nokia 770 Internet Tablet', tone: 'mixed', tags: ['nokia', 'tablet', 'linux', 'maemo'],
      h: "Nokia 770: tablet internet berbasis Linux, tanpa fitur telepon",
      t: "Nokia mencoba format baru berlayar lebar dengan Wi-Fi dan sistem Linux Maemo. Eksperimen berani ini disambut penasaran, tetapi pasarnya belum jelas.",
      h_en: "Nokia 770: a Linux-based Internet tablet with no phone function",
      t_en: "Nokia tries a new widescreen format with Wi-Fi and the Linux-based Maemo system. The bold experiment draws curiosity, but its market is unclear." },

    // ==================== 2006 ====================
    { cid: 'nokia', year: 2006, month: 2, product: 'Nokia Eseries', tone: 'positive', tags: ['nokia', 'eseries', 'enterprise'], approx: true,
      h: "Nokia luncurkan Eseries: ponsel bisnis untuk bersaing dengan BlackBerry",
      t: "Seri E menyasar pekerja mobile dengan email, keyboard fisik, dan Wi-Fi. Nokia mulai menyerang kandang BlackBerry dan Palm di segmen korporat.",
      h_en: "Nokia launches Eseries: business phones to challenge BlackBerry",
      t_en: "The E-series targets mobile workers with email, physical keyboards, and Wi-Fi. Nokia starts attacking BlackBerry and Palm on their corporate turf." },
    { cid: 'blackberry', year: 2006, month: 3, product: 'RIM Damai Sengketa NTP', tone: 'mixed', tags: ['blackberry', 'ntp', 'patent', 'legal'],
      h: "RIM sepakat bayar US$612,5 juta untuk akhiri sengketa paten NTP",
      t: "Kesepakatan menghapus ancaman penghentian layanan BlackBerry di AS. Biayanya besar, tetapi ketidakpastian hukum bertahun-tahun akhirnya selesai.",
      h_en: "RIM agrees to pay $612.5 million to end the NTP patent dispute",
      t_en: "The settlement removes the threat of a BlackBerry service shutdown in the US. The cost is steep, but years of legal uncertainty finally end." },

    // ==================== 2007 ====================
    { cid: 'blackberry', year: 2007, month: 2, product: 'BlackBerry 8800', tone: 'positive', tags: ['blackberry', '8800', 'gps'], approx: true,
      h: "BlackBerry 8800: ramping, ada GPS, dan terlihat lebih berkelas",
      t: "Desain tipis berbahan logam serta GPS bawaan menyasar eksekutif yang bosan dengan bodi bongsor. Ia menjadi salah satu BlackBerry terlaris awal era smartphone.",
      h_en: "BlackBerry 8800: slim, GPS-equipped, and more upscale",
      t_en: "A slim metal design and built-in GPS target executives tired of bulky bodies. It becomes one of the better-selling BlackBerrys of the early smartphone era." },
    { cid: 'palm', year: 2007, month: 6, product: 'Palm Suntikan Elevation Partners', tone: 'positive', tags: ['palm', 'investment', 'corporate'],
      h: "Elevation Partners suntik dana US$325 juta ke Palm",
      t: "Investor ini membeli porsi besar di Palm demi membiayai pembaruan sistem operasi dan lini ponsel. Pasar membaca langkah itu sebagai napas baru yang dibutuhkan.",
      h_en: "Elevation Partners injects $325 million into Palm",
      t_en: "The investor buys a large stake to fund a new operating system and phone lineup. The market reads it as the fresh lifeline Palm needs." },
    { cid: 'nokia', year: 2007, month: 8, product: 'Nokia Ovi', tone: 'mixed', tags: ['nokia', 'ovi', 'services'], approx: true,
      h: "Nokia umumkan Ovi: layanan internet untuk musik, peta, dan berbagi",
      t: "Nokia ingin beralih dari penjual perangkat menjadi penyedia layanan. Visinya besar, tetapi ia harus mengejar Apple dan Google yang sudah melaju.",
      h_en: "Nokia unveils Ovi: an Internet services brand for music, maps, and sharing",
      t_en: "Nokia wants to move from selling devices to providing services. The vision is big, but it must catch up with Apple and Google, who are already racing ahead." },
    { cid: 'apple', year: 2007, month: 9, day: 5, product: 'iPhone Pangkas Harga', tone: 'mixed', tags: ['apple', 'iphone', 'price_cut'],
      h: "Apple pangkas harga iPhone 8GB jadi US$399, pembeli awal murka",
      t: "Harga turun US$200 hanya dua bulan setelah peluncuran, dan model 4GB dihentikan. Apple lalu menawarkan kredit toko bagi pembeli awal untuk meredam amarah.",
      h_en: "Apple cuts the 8GB iPhone to $399, early buyers furious",
      t_en: "The price drops $200 only two months after launch, and the 4GB model is dropped. Apple then offers store credit to early buyers to soothe the anger." },
    { cid: 'apple', year: 2007, month: 9, day: 10, product: 'iPhone 1 Juta Unit', tone: 'positive', tags: ['apple', 'iphone', 'milestone'],
      h: "iPhone tembus 1 juta unit dalam 74 hari",
      t: "Apple mengumumkan tonggak penjualan itu jauh lebih cepat dari target internal. Kompetitor ponsel pintar mulai gelisah.",
      h_en: "iPhone passes 1 million units in 74 days",
      t_en: "Apple announces the sales milestone well ahead of its internal target. Smartphone competitors begin to get nervous." },
    { cid: 'palm', year: 2007, month: 9, day: 4, product: 'Palm Batalkan Foleo', tone: 'negative', tags: ['palm', 'foleo', 'cancelled'],
      h: "Palm batalkan Foleo, pendamping ponsel yang baru diumumkan beberapa bulan lalu",
      t: "Perangkat mirip laptop mini ini dibatalkan demi fokus ke ponsel generasi baru. Langkah itu menghabiskan biaya dan menggerus kepercayaan investor.",
      h_en: "Palm cancels the Foleo, a phone companion announced only months ago",
      t_en: "The mini laptop-like device is scrapped to focus on a new generation of phones. The move costs money and chips away at investor confidence." },
    { cid: 'nokia', year: 2007, month: 10, day: 1, product: 'Nokia Akuisisi Navteq', tone: 'mixed', tags: ['nokia', 'navteq', 'maps', 'corporate'],
      h: "Nokia beli Navteq senilai US$8,1 miliar untuk menguasai peta digital",
      t: "Akuisisi terbesar Nokia ini menandai taruhan pada layanan berbasis lokasi. Analis memuji logikanya, tetapi mempertanyakan harganya.",
      h_en: "Nokia buys Navteq for $8.1 billion to own digital maps",
      t_en: "Nokia's largest acquisition marks a bet on location-based services. Analysts praise the logic but question the price." },
    { cid: 'samsung', year: 2007, month: 10, product: 'Samsung Nomor Dua Dunia', tone: 'positive', tags: ['samsung', 'market_share', 'milestone'], approx: true,
      h: "Samsung salip Motorola, naik ke posisi dua produsen ponsel dunia",
      t: "Lini ponsel gaya dan fitur lengkap membawa Samsung melewati Motorola dalam pangsa pasar global. Hanya Nokia yang masih jauh di depan.",
      h_en: "Samsung overtakes Motorola to become the world's number two phone maker",
      t_en: "A stylish, feature-rich lineup carries Samsung past Motorola in global market share. Only Nokia remains far ahead." },

    // ==================== 2008 ====================
    { cid: 'nokia', year: 2008, month: 1, day: 28, product: 'Nokia Akuisisi Trolltech', tone: 'positive', tags: ['nokia', 'trolltech', 'qt', 'corporate'],
      h: "Nokia akuisisi Trolltech, pembuat kerangka pengembangan Qt",
      t: "Dengan Qt, Nokia ingin satu platform aplikasi untuk ponsel dan perangkat lain. Ini jadi senjata melawan ekosistem aplikasi yang baru dibangun pesaing.",
      h_en: "Nokia acquires Trolltech, maker of the Qt development framework",
      t_en: "With Qt, Nokia wants one app platform across phones and other devices. It becomes a weapon against the app ecosystems rivals are just building." },
    { cid: 'sony_ericsson', year: 2008, month: 1, product: 'Sony Ericsson Rekor 2007', tone: 'positive', tags: ['sony_ericsson', 'earnings', 'record'], approx: true,
      h: "Sony Ericsson catat rekor 2007: kirim lebih dari 100 juta ponsel",
      t: "Walkman dan Cyber-shot mendorong tahun terbaik perusahaan patungan ini. Pertanyaannya kini apakah ponsel musik dan kamera cukup menghadapi gelombang layar sentuh.",
      h_en: "Sony Ericsson posts a record 2007: over 100 million phones shipped",
      t_en: "Walkman and Cyber-shot drive the joint venture's best year. The question now is whether music and camera phones can withstand the touchscreen wave." },
    { cid: 'nokia', year: 2008, month: 2, product: 'Nokia E71', tone: 'positive', tags: ['nokia', 'e71', 'qwerty'], approx: true,
      h: "Nokia E71: QWERTY ramping dengan email dan Wi-Fi, bidik pengguna BlackBerry",
      t: "Bodi logam tipis, keyboard penuh, dan GPS menjadikannya ponsel bisnis paling menarik Nokia. Ia dipuji sebagai alternatif langsung BlackBerry.",
      h_en: "Nokia E71: slim QWERTY with email and Wi-Fi, aimed at BlackBerry users",
      t_en: "A thin metal body, full keyboard, and GPS make it Nokia's most appealing business phone. It is praised as a direct BlackBerry alternative." },
    { cid: 'apple', year: 2008, month: 3, day: 6, product: 'iPhone SDK', tone: 'positive', tags: ['apple', 'iphone', 'sdk', 'apps'],
      h: "Apple buka SDK iPhone: pengembang pihak ketiga boleh bikin aplikasi",
      t: "Apple memamerkan peralatan pengembangan dan rencana toko aplikasi untuk iPhone. Fondasi ekosistem aplikasi modern mulai diletakkan.",
      h_en: "Apple opens the iPhone SDK: third-party developers can build apps",
      t_en: "Apple shows off developer tools and a plan for an iPhone app store. The foundation of the modern app ecosystem starts to take shape." },
    { cid: 'motorola', year: 2008, month: 3, day: 26, product: 'Motorola Rencana Pisah', tone: 'mixed', tags: ['motorola', 'split', 'corporate'],
      h: "Motorola umumkan rencana memisahkan bisnis ponsel dari divisi lainnya",
      t: "Tekanan investor dan penjualan ponsel yang merosot memaksa perusahaan memecah diri. Pasar menimbang apakah ini penyelamatan atau tanda menyerah.",
      h_en: "Motorola announces plan to separate its handset business from other divisions",
      t_en: "Investor pressure and sagging phone sales force the company to break itself up. The market weighs whether it is a rescue or a sign of surrender." },
    { cid: 'blackberry', year: 2008, month: 5, product: 'BlackBerry Bold 9000', tone: 'positive', tags: ['blackberry', 'bold', 'flagship'], approx: true,
      h: "BlackBerry Bold 9000 diumumkan: flagship 3G dengan layar resolusi tinggi",
      t: "RIM menjawab iPhone dengan layar lebih tajam, Wi-Fi, dan 3G yang tetap setia pada keyboard fisik. Basis pengguna korporat bersiap meng-upgrade.",
      h_en: "BlackBerry Bold 9000 announced: a 3G flagship with a high-resolution screen",
      t_en: "RIM answers the iPhone with a sharper screen, Wi-Fi, and 3G while staying loyal to the physical keyboard. The corporate base prepares to upgrade." },
    { cid: 'htc', year: 2008, month: 6, product: 'HTC Touch Diamond', tone: 'positive', tags: ['htc', 'touch_diamond', 'touchflo'], approx: true,
      h: "HTC Touch Diamond: layar sentuh ramping dengan antarmuka TouchFLO 3D",
      t: "Desain berlian di bagian belakang dan antarmuka sentuh yang mulus membuat HTC dipandang sebagai penantang serius iPhone di dunia Windows Mobile.",
      h_en: "HTC Touch Diamond: a slim touchscreen with the TouchFLO 3D interface",
      t_en: "A faceted back and a smooth touch interface make HTC a serious iPhone challenger in the Windows Mobile world." },
    { cid: 'samsung', year: 2008, month: 6, day: 20, product: 'Samsung Instinct', tone: 'mixed', tags: ['samsung', 'instinct', 'sprint', 'touchscreen'],
      h: "Samsung Instinct tiba di Sprint: layar sentuh yang diposisikan lawan iPhone",
      t: "Perangkat layar sentuh dengan umpan balik getar ini ramai dibicarakan, tetapi respons sistemnya dinilai belum setajam iPhone.",
      h_en: "Samsung Instinct arrives on Sprint: a touchscreen positioned against the iPhone",
      t_en: "The touchscreen device with haptic feedback gets plenty of buzz, but its system responsiveness is judged not as sharp as the iPhone's." },
    { cid: 'apple', year: 2008, month: 7, day: 14, product: 'iPhone 3G 1 Juta Unit', tone: 'positive', tags: ['apple', 'iphone_3g', 'milestone'],
      h: "iPhone 3G terjual lebih dari 1 juta unit pada akhir pekan pertama",
      t: "Antrean panjang di berbagai negara dan harga mulai US$199 dengan kontrak membuat peluncuran ini jadi yang terbesar bagi Apple sejauh ini.",
      h_en: "iPhone 3G sells over 1 million units in its first weekend",
      t_en: "Long lines across many countries and a $199 contract price make this Apple's biggest launch so far." },
    { cid: 'google_android', year: 2008, month: 10, day: 22, product: 'Android Market', tone: 'positive', tags: ['google', 'android', 'market', 'apps'],
      h: "Android Market dibuka: toko aplikasi pertama untuk ponsel Android",
      t: "Bersamaan dengan T-Mobile G1, Google membuka toko aplikasinya. Jumlah aplikasi masih sedikit, tetapi model terbukanya menarik pengembang.",
      h_en: "Android Market opens: the first app store for Android phones",
      t_en: "Alongside the T-Mobile G1, Google opens its app store. The catalog is still small, but the open model attracts developers." }
];

// ------------------------------------------------------------
// Pendaftaran ke daftar utama (idempoten).
// ------------------------------------------------------------
function _slug(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export function registerCompetitorReleaseNewsS1() {
    var existing = {};
    COMPETITOR_RELEASE_NEWS.forEach(function (e) { existing[e.id] = true; });
    var added = 0;
    COMPETITOR_RELEASE_NEWS_S1.forEach(function (e) {
        e.id = 'crel_' + e.cid + '_' + e.year + '_' + e.month + '_' + _slug(e.product);
        if (existing[e.id]) return;
        existing[e.id] = true;
        COMPETITOR_RELEASE_NEWS.push(e);
        added++;
    });
    return added;
}

registerCompetitorReleaseNewsS1();
