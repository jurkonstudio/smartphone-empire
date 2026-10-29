// FILE: src/data/era-events.data.js  (BARU — paket event pilihan 2000–2002)
// ============================================================
// Event historis dengan pilihan untuk era Ponsel Fitur awal (2000–2002).
// Tanggal disejajarkan dengan headline di news-headlines.data.js.
// Semua angka balance ada di file ini; logika ada di EraEventSystem.js.
//
// Bentuk satu event:
//   id        unik, dipakai untuk riwayat & penanda "sudah muncul"
//   at        { year, month }  bulan muncul normal
//   until     { year, month }  batas akhir (bila save dimuat lewat 'at', event
//                              masih muncul sampai batas ini, lalu hangus)
//   title/body        { id, en }  (bahasa lain jatuh ke en)
//   choices[]         2–3 pilihan; SELALU ada satu pilihan gratis (cost 0) supaya
//                     pemain tak pernah terkunci.
//     id, label{id,en}, outcome{id,en}
//     cost      biaya di muka, dibayar lewat WalletService (uang / SIL sesuai mode)
//     effects   cash (tambahan kas), reputation, demand[]
//       demand: { scope, mult, days }  pengali permintaan harian sementara
//         scope: 'all' | 'budget' | 'premium' | 'color' | 'camera'
//
// Batas keamanan: pengali gabungan dijepit 0.6–1.5 di EraEventSystem.
// ============================================================

export const ERA_EVENT_SCOPES = ['all', 'budget', 'premium', 'color', 'camera'];

export const ERA_EVENTS = [
    // ---------------------------------------------------------- 2000
    {
        id: 'ev2000_3g_auction',
        at: { year: 2000, month: 4 }, until: { year: 2000, month: 7 },
        title: { id: 'Lelang Lisensi 3G Eropa', en: 'European 3G Spectrum Auctions' },
        body: {
            id: 'Operator Eropa menggelontorkan puluhan miliar untuk lisensi UMTS. Kas mereka tipis, subsidi ponsel dipangkas, dan pembeli jadi lebih sensitif harga. Kamu mau menyesuaikan strategi ke mana?',
            en: 'European carriers are pouring billions into UMTS licences. Their cash is thin, handset subsidies are being cut, and buyers are getting price-sensitive. Where do you steer the company?'
        },
        choices: [
            {
                id: 'budget', cost: 0,
                label: { id: 'Geser ke ponsel terjangkau', en: 'Shift to affordable phones' },
                outcome: { id: 'Ponsel murah laris karena subsidi menghilang, tetapi segmen premium sedikit sepi.', en: 'Cheap phones sell as subsidies vanish, but the premium segment softens.' },
                effects: { demand: [{ scope: 'budget', mult: 1.12, days: 180 }, { scope: 'premium', mult: 0.95, days: 180 }] }
            },
            {
                id: 'quality', cost: 0,
                label: { id: 'Tetap di kualitas', en: 'Stay on quality' },
                outcome: { id: 'Pembeli yang tetap membeli mencari ponsel andal; segmen murah terasa lebih lesu.', en: 'The buyers who stay want dependable phones; the cheap segment feels flat.' },
                effects: { demand: [{ scope: 'premium', mult: 1.08, days: 180 }, { scope: 'budget', mult: 0.95, days: 180 }] }
            },
            {
                id: 'oem', cost: 6000,
                label: { id: 'Tawarkan kontrak OEM ke operator', en: 'Pitch an OEM deal to carriers' },
                outcome: { id: 'Satu operator memesan ponsel bermerek mereka. Kas masuk, tetapi mereknya kurang terlihat.', en: 'A carrier orders phones under its own brand. Cash comes in, but your own brand is less visible.' },
                effects: { cash: 18000, reputation: -1 }
            }
        ]
    },
    {
        id: 'ev2000_sms_boom',
        at: { year: 2000, month: 7 }, until: { year: 2000, month: 10 },
        title: { id: 'Ledakan SMS dan Ringtone', en: 'The SMS and Ringtone Boom' },
        body: {
            id: 'Belasan miliar SMS terkirim di Eropa dan anak muda berlomba mengganti nada dering. Ponsel yang enak untuk mengetik dan bisa dipersonalisasi sedang dicari.',
            en: 'Billions of text messages are flying across Europe and teenagers are swapping ringtones. Phones that are easy to type on and easy to personalise are in demand.'
        },
        choices: [
            {
                id: 'keypad', cost: 5000,
                label: { id: 'Garap papan tombol & menu SMS', en: 'Polish the keypad and SMS menus' },
                outcome: { id: 'Ulasan memuji kenyamanan mengetik. Permintaan naik beberapa bulan.', en: 'Reviews praise the typing comfort. Demand rises for a few months.' },
                effects: { reputation: 1, demand: [{ scope: 'all', mult: 1.08, days: 120 }] }
            },
            {
                id: 'ringtone', cost: 2000,
                label: { id: 'Jual paket ringtone & logo', en: 'Sell ringtone and logo packs' },
                outcome: { id: 'Paket nada dering laku keras sebagai pemasukan tambahan.', en: 'Ringtone packs sell as a handy side income.' },
                effects: { cash: 9000 }
            },
            {
                id: 'skip', cost: 0,
                label: { id: 'Abaikan tren ini', en: 'Ignore the trend' },
                outcome: { id: 'Kamu fokus ke rencana sendiri. Tidak ada perubahan.', en: 'You stick to your own plan. Nothing changes.' },
                effects: {}
            }
        ]
    },
    {
        id: 'ev2000_nokia_3310',
        at: { year: 2000, month: 8 }, until: { year: 2000, month: 11 },
        title: { id: 'Nokia 3310 Jadi Fenomena', en: 'The Nokia 3310 Phenomenon' },
        body: {
            id: 'Ponsel tahan banting dengan game Snake II dan baterai berhari-hari jadi buah bibir. Pembeli mulai menilai ketahanan dan hiburan, bukan hanya ukuran.',
            en: 'A tough phone with Snake II and multi-day battery life is the talk of the town. Buyers now weigh durability and fun, not just size.'
        },
        choices: [
            {
                id: 'rugged', cost: 7000,
                label: { id: 'Tiru ketahanan & baterai awet', en: 'Match its toughness and battery life' },
                outcome: { id: 'Citra "awet" menempel pada mereknya. Penjualan naik dan reputasi bertambah.', en: 'A "built to last" image sticks to your brand. Sales and reputation rise.' },
                effects: { reputation: 1, demand: [{ scope: 'all', mult: 1.07, days: 150 }] }
            },
            {
                id: 'niche', cost: 0,
                label: { id: 'Bidik pasar atas dengan fitur lebih', en: 'Aim higher with more features' },
                outcome: { id: 'Pembeli yang ingin lebih dari sekadar tahan banting melirikmu.', en: 'Buyers who want more than toughness look your way.' },
                effects: { demand: [{ scope: 'premium', mult: 1.06, days: 120 }] }
            },
            {
                id: 'pricewar', cost: 0,
                label: { id: 'Tantang Nokia di harga', en: 'Challenge Nokia on price' },
                outcome: { id: 'Ponsel murahmu laris, tetapi perang harga membuat mereknya terkesan murahan.', en: 'Your cheap phones sell, but the price fight makes the brand feel cheap.' },
                effects: { reputation: -1, demand: [{ scope: 'budget', mult: 1.10, days: 120 }] }
            }
        ]
    },
    {
        id: 'ev2000_camera_japan',
        at: { year: 2000, month: 9 }, until: { year: 2001, month: 1 },
        title: { id: 'Ponsel Berkamera Muncul di Jepang', en: 'Camera Phones Appear in Japan' },
        body: {
            id: 'Di Jepang, ponsel dengan kamera mulai dijual dan orang saling kirim foto. Belum jelas apakah ini tren global atau keunikan lokal. Ke mana kamu menaruh taruhan?',
            en: 'In Japan, phones with built-in cameras are on sale and people are sending each other photos. It is unclear whether this goes global or stays a local quirk. Where do you place your bet?'
        },
        choices: [
            {
                id: 'camera_bet', cost: 12000,
                label: { id: 'Taruhan besar di kamera', en: 'Bet big on cameras' },
                outcome: { id: 'Kamu masuk lebih awal. Ponsel berkamera menikmati rasa penasaran pasar selama setahun.', en: 'You get in early. Camera phones enjoy a year of market curiosity.' },
                effects: { reputation: 1, demand: [{ scope: 'camera', mult: 1.15, days: 365 }] }
            },
            {
                id: 'color_first', cost: 6000,
                label: { id: 'Dahulukan layar berwarna', en: 'Prioritise colour screens first' },
                outcome: { id: 'Layar berwarna lebih mudah dipasarkan sekarang. Permintaan ponsel berwarna naik.', en: 'Colour screens are easier to market right now. Demand for colour phones rises.' },
                effects: { demand: [{ scope: 'color', mult: 1.12, days: 365 }] }
            },
            {
                id: 'wait', cost: 0,
                label: { id: 'Tunggu dan lihat dulu', en: 'Wait and see' },
                outcome: { id: 'Kamu menghemat dana riset. Ponsel murah sedikit lebih menarik karena tak ikut tren mahal.', en: 'You save R&D money. Cheap phones look a little better next to costly trends.' },
                effects: { demand: [{ scope: 'budget', mult: 1.04, days: 180 }] }
            }
        ]
    },
    {
        id: 'ev2000_dotcom_crash',
        at: { year: 2000, month: 10 }, until: { year: 2001, month: 1 },
        title: { id: 'Gelembung Dot-com Pecah', en: 'The Dot-com Bubble Bursts' },
        body: {
            id: 'Saham teknologi jatuh dan investor menarik diri. Pendanaan baru jadi seret di seluruh industri. Bagaimana kamu menjaga perusahaan tetap hidup?',
            en: 'Tech stocks are tumbling and investors are pulling back. New funding is drying up across the industry. How do you keep the company alive?'
        },
        choices: [
            {
                id: 'cut', cost: 0,
                label: { id: 'Pangkas pengeluaran', en: 'Cut spending' },
                outcome: { id: 'Kamu menjual aset yang tak terpakai dan menahan iklan. Kas aman, tetapi merek agak redup.', en: 'You sell idle assets and hold back advertising. Cash is safer, but the brand dims a little.' },
                effects: { cash: 6000, demand: [{ scope: 'all', mult: 0.97, days: 90 }] }
            },
            {
                id: 'bridge', cost: 0,
                label: { id: 'Cari investor jembatan', en: 'Find a bridge investor' },
                outcome: { id: 'Dana segar masuk, tetapi investor menuntut penghematan pemasaran yang menekan penjualan.', en: 'Fresh money arrives, but the investor demands marketing cuts that weigh on sales.' },
                effects: { cash: 20000, demand: [{ scope: 'all', mult: 0.95, days: 180 }] }
            },
            {
                id: 'hold', cost: 0,
                label: { id: 'Pertahankan rencana', en: 'Hold the line' },
                outcome: { id: 'Kamu tampil tenang di tengah kepanikan. Kepercayaan mitra dan pembeli naik sedikit.', en: 'You look calm amid the panic. Partners and buyers trust you a little more.' },
                effects: { reputation: 1 }
            }
        ]
    },

    // ---------------------------------------------------------- 2001
    {
        id: 'ev2001_gprs_data',
        at: { year: 2001, month: 6 }, until: { year: 2001, month: 9 },
        title: { id: 'GPRS dan Data Seluler', en: 'GPRS and Mobile Data' },
        body: {
            id: 'GPRS mulai dipakai di Eropa, tetapi pengguna masih bingung dengan tagihan dan layanannya. Ada peluang membuat data seluler terasa mudah.',
            en: 'GPRS is rolling out in Europe, but users are confused by billing and services. There is a chance to make mobile data feel simple.'
        },
        choices: [
            {
                id: 'portal', cost: 10000,
                label: { id: 'Bangun portal & menu data yang ramah', en: 'Build a friendly data portal and menus' },
                outcome: { id: 'Pengguna merasa data seluler mudah dipakai di ponselmu. Reputasi dan penjualan naik.', en: 'Users find mobile data easy on your phones. Reputation and sales rise.' },
                effects: { reputation: 2, demand: [{ scope: 'all', mult: 1.06, days: 240 }] }
            },
            {
                id: 'partner', cost: 3000,
                label: { id: 'Kemas dengan paket operator', en: 'Bundle with a carrier plan' },
                outcome: { id: 'Operator membantu promosi dan memberi kontribusi biaya kampanye.', en: 'A carrier helps promote the phone and contributes to campaign costs.' },
                effects: { cash: 7000 }
            },
            {
                id: 'skip', cost: 0,
                label: { id: 'Lewati dulu', en: 'Skip it for now' },
                outcome: { id: 'Data seluler belum jadi prioritasmu. Tidak ada perubahan.', en: 'Mobile data is not a priority yet. Nothing changes.' },
                effects: {}
            }
        ]
    },
    {
        id: 'ev2001_sept11',
        at: { year: 2001, month: 9 }, until: { year: 2001, month: 12 },
        title: { id: '11 September: Pasar Goyah', en: 'September 11: Markets Shaken' },
        body: {
            id: 'Peristiwa 11 September mengguncang dunia. Jaringan telekomunikasi AS sempat terputus, kepercayaan konsumen jatuh, dan belanja barang elektronik melambat di banyak pasar.',
            en: 'The September 11 attacks shake the world. US telecom networks briefly fail, consumer confidence drops, and spending on electronics slows in many markets.'
        },
        choices: [
            {
                id: 'support', cost: 5000,
                label: { id: 'Donasi dan layanan bantuan', en: 'Donate and offer support' },
                outcome: { id: 'Tindakanmu dihargai publik. Reputasi naik, meski permintaan tetap tertekan.', en: 'The public values your response. Reputation rises, though demand stays under pressure.' },
                effects: { reputation: 2, demand: [{ scope: 'all', mult: 0.96, days: 90 }] }
            },
            {
                id: 'reassure', cost: 8000,
                label: { id: 'Promo yang menenangkan pembeli', en: 'Run a reassurance promo' },
                outcome: { id: 'Promo membantu menahan penurunan penjualan di masa goyah.', en: 'The promotion helps cushion the sales dip during the shaky period.' },
                effects: { demand: [{ scope: 'all', mult: 1.03, days: 90 }] }
            },
            {
                id: 'brace', cost: 0,
                label: { id: 'Berhemat dan tunggu pulih', en: 'Tighten up and wait it out' },
                outcome: { id: 'Kamu menahan pengeluaran, tetapi penjualan melemah beberapa bulan.', en: 'You hold spending back, but sales are weak for a few months.' },
                effects: { demand: [{ scope: 'all', mult: 0.92, days: 90 }] }
            }
        ]
    },

    // ---------------------------------------------------------- 2002
    {
        id: 'ev2002_color_standard',
        at: { year: 2002, month: 2 }, until: { year: 2002, month: 6 },
        title: { id: 'Layar Warna Jadi Standar', en: 'Colour Screens Become the Norm' },
        body: {
            id: 'Layar warna mulai jadi standar ponsel kelas menengah di Eropa. Ponsel monokrom kini terasa ketinggalan zaman bagi banyak pembeli.',
            en: 'Colour screens are becoming standard on mid-range phones in Europe. Monochrome phones now feel dated to many buyers.'
        },
        choices: [
            {
                id: 'go_color', cost: 9000,
                label: { id: 'Beralih ke layar warna', en: 'Move to colour screens' },
                outcome: { id: 'Ponsel berwarnamu menarik pembeli yang ingin tampilan modern.', en: 'Your colour phones attract buyers who want a modern look.' },
                effects: { demand: [{ scope: 'color', mult: 1.15, days: 270 }] }
            },
            {
                id: 'mono_cheap', cost: 0,
                label: { id: 'Bertahan di monokrom hemat', en: 'Stay with cheap monochrome' },
                outcome: { id: 'Ponsel monokrom murahmu tetap punya pembeli yang mementingkan harga.', en: 'Your cheap monochrome phones keep price-driven buyers.' },
                effects: { demand: [{ scope: 'budget', mult: 1.06, days: 180 }] }
            }
        ]
    },
    {
        id: 'ev2002_mms',
        at: { year: 2002, month: 3 }, until: { year: 2002, month: 8 },
        title: { id: 'MMS: Era Pesan Multimedia', en: 'MMS: The Multimedia Messaging Era' },
        body: {
            id: 'Operator mulai meluncurkan MMS, pesan bergambar dan bernada. Ponsel berkamera tiba-tiba punya alasan yang jelas untuk dibeli.',
            en: 'Carriers are launching MMS, messages with pictures and sound. Camera phones suddenly have a clear reason to exist.'
        },
        choices: [
            {
                id: 'mms_push', cost: 7000,
                label: { id: 'Dukung MMS dan kirim foto', en: 'Back MMS and photo sharing' },
                outcome: { id: 'Fitur kirim foto jadi andalan iklanmu. Ponsel berkamera makin laku.', en: 'Photo sharing becomes your headline feature. Camera phones sell better.' },
                effects: { reputation: 1, demand: [{ scope: 'camera', mult: 1.12, days: 240 }] }
            },
            {
                id: 'focus_voice', cost: 0,
                label: { id: 'Tetap fokus telepon & SMS', en: 'Stay focused on voice and SMS' },
                outcome: { id: 'Kamu menjaga produk tetap sederhana. Tidak ada perubahan.', en: 'You keep products simple. Nothing changes.' },
                effects: {}
            }
        ]
    },
    {
        id: 'ev2002_worldcom',
        at: { year: 2002, month: 6 }, until: { year: 2002, month: 9 },
        title: { id: 'Skandal WorldCom', en: 'The WorldCom Scandal' },
        body: {
            id: 'Skandal akuntansi WorldCom mengguncang industri telekomunikasi. Investor dan mitra kini memeriksa laporan keuangan setiap perusahaan dengan teliti.',
            en: 'The WorldCom accounting scandal rocks the telecom industry. Investors and partners now scrutinise every company\'s books.'
        },
        choices: [
            {
                id: 'audit', cost: 3000,
                label: { id: 'Umumkan audit dan laporan terbuka', en: 'Announce an audit and open books' },
                outcome: { id: 'Transparansimu membuat mitra lebih percaya.', en: 'Your transparency makes partners trust you more.' },
                effects: { reputation: 2 }
            },
            {
                id: 'quiet', cost: 0,
                label: { id: 'Tidak berkomentar', en: 'Say nothing' },
                outcome: { id: 'Kamu tidak menarik perhatian. Tidak ada perubahan.', en: 'You stay out of the spotlight. Nothing changes.' },
                effects: {}
            }
        ]
    },
    {
        id: 'ev2002_qwerty',
        at: { year: 2002, month: 10 }, until: { year: 2002, month: 12 },
        title: { id: 'Ponsel Keyboard Penuh: Sidekick & Treo', en: 'Full-Keyboard Phones: Sidekick and Treo' },
        body: {
            id: 'T-Mobile Sidekick dan Handspring Treo memadukan ponsel, email, dan keyboard penuh. Anak muda dan pekerja kantoran mulai tertarik pada ponsel yang lebih dari sekadar telepon.',
            en: 'The T-Mobile Sidekick and Handspring Treo blend phone, email and a full keyboard. Young people and office workers are warming to phones that are more than just phones.'
        },
        choices: [
            {
                id: 'qwerty', cost: 14000,
                label: { id: 'Eksperimen ponsel keyboard penuh', en: 'Experiment with a full-keyboard phone' },
                outcome: { id: 'Eksperimenmu menarik pembeli premium dan memperkuat citra inovatif.', en: 'Your experiment draws premium buyers and builds an innovative image.' },
                effects: { reputation: 1, demand: [{ scope: 'premium', mult: 1.12, days: 365 }] }
            },
            {
                id: 'mass', cost: 0,
                label: { id: 'Fokus ke ponsel massal', en: 'Focus on mass-market phones' },
                outcome: { id: 'Kamu memperkuat lini harga menengah. Ponsel murah sedikit terdorong.', en: 'You reinforce the mid-priced line. Budget phones get a small lift.' },
                effects: { demand: [{ scope: 'budget', mult: 1.05, days: 180 }] }
            }
        ]
    }
];

export function getEraEventById(id) {
    for (var i = 0; i < ERA_EVENTS.length; i++) if (ERA_EVENTS[i].id === id) return ERA_EVENTS[i];
    return null;
}
