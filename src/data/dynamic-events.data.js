// FILE: src/data/dynamic-events.data.js  (BARU — insiden dinamis 2000–2050)
// ============================================================
// Event pilihan yang TIDAK terikat tanggal: muncul acak sepanjang game bila syaratnya
// terpenuhi (mis. ada ponsel yang sedang dijual), lalu masuk antrean EraEventSystem dan
// memakai modal yang sama dengan event era 2000–2002.
//
// Beda dengan era-events.data.js:
//   - minYear/maxYear + `when` (syarat) + `weight` + `cooldownMonths` (bukan at/until).
//   - Boleh muncul berulang (dengan cooldown), tidak masuk daftar `seen`.
//   - Biaya & kas diskalakan dengan ukuran bisnis (rata-rata omzet 3 bulan terakhir) supaya
//     tetap relevan di 2000 maupun 2025. Angka di file ini = angka di skala dasar (omzet <= $30K/bulan).
//   - Pilihan boleh punya `risk`: { p, success:{effects,outcome}, fail:{effects,outcome} }.
//     Peluang `p` = kemungkinan SUKSES. Efek di luar `risk` (effects) selalu berlaku.
//
// Aturan: SELALU ada satu pilihan cost 0 supaya pemain tidak pernah terkunci.
// Syarat (`when`): 'selling' = ada ponsel berstatus 'selling'.
// Batas aman: mult demand 0.8–1.2, days <= 400 (dijepit lagi 0.6–1.5 di EraEventSystem).
// ============================================================

export const DYNAMIC_WHEN = ['selling'];

export const DYNAMIC_EVENTS = [
    {
        id: 'dyn_battery_recall', kind: 'dynamic',
        minYear: 2000, maxYear: 2050, weight: 1, cooldownMonths: 18, when: 'selling',
        title: { id: 'Laporan Baterai Panas Berlebih', en: 'Battery Overheating Reports' },
        body: {
            id: 'Beberapa pelanggan melaporkan baterai ponselmu panas berlebih saat diisi. Media mulai menghubungi. Kamu harus memutuskan seberapa serius menanganinya sebelum kabar ini menyebar.',
            en: 'A few customers report your phone battery overheating while charging. The press is starting to call. You must decide how seriously to handle it before the story spreads.'
        },
        choices: [
            {
                id: 'recall', cost: 9000,
                label: { id: 'Tarik & ganti semua baterai', en: 'Recall and replace all batteries' },
                outcome: { id: 'Penarikan tuntas. Biayanya besar, tetapi pelanggan menghargai tanggung jawabmu.', en: 'The recall is thorough. It is costly, but customers appreciate your accountability.' },
                effects: { reputation: 2, demand: [{ scope: 'all', mult: 0.96, days: 45 }] }
            },
            {
                id: 'patch', cost: 2500,
                label: { id: 'Rilis perbaikan firmware', en: 'Ship a firmware fix' },
                risk: {
                    p: 0.6,
                    success: {
                        outcome: { id: 'Perbaikan firmware menekan suhu pengisian dan keluhan reda.', en: 'The firmware fix lowers charging temperature and complaints fade.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Perbaikan tidak cukup. Beberapa ponsel tetap panas dan kasusnya viral.', en: 'The fix is not enough. Some phones still overheat and the story goes viral.' },
                        effects: { reputation: -4, demand: [{ scope: 'all', mult: 0.88, days: 90 }] }
                    }
                }
            },
            {
                id: 'ignore', cost: 0,
                label: { id: 'Anggap kasus terisolasi', en: 'Call it an isolated case' },
                risk: {
                    p: 0.35,
                    success: {
                        outcome: { id: 'Kabar mereda sendiri. Kamu beruntung kali ini.', en: 'The story dies down by itself. You got lucky this time.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Kasus bertambah dan media menyorot sikap abaimu. Biaya ganti rugi membengkak.', en: 'More cases surface and the press targets your dismissive stance. Compensation costs balloon.' },
                        effects: { cash: -6000, reputation: -5, demand: [{ scope: 'all', mult: 0.85, days: 120 }] }
                    }
                }
            }
        ]
    },
    {
        id: 'dyn_supplier_crisis', kind: 'dynamic',
        minYear: 2001, maxYear: 2050, weight: 1, cooldownMonths: 14, when: 'selling',
        title: { id: 'Pemasok Komponen Terganggu', en: 'Component Supplier Disruption' },
        body: {
            id: 'Pemasok utama komponenmu mengumumkan gangguan produksi. Pengiriman bulan depan terancam telat dan stok di gudang menipis.',
            en: 'Your main component supplier announces a production disruption. Next month\'s shipment may be late and warehouse stock is running thin.'
        },
        choices: [
            {
                id: 'premium', cost: 7000,
                label: { id: 'Kontrak pasokan prioritas (mahal)', en: 'Priority supply contract (pricey)' },
                outcome: { id: 'Pasokan aman. Penjualan lancar dan rak toko tetap penuh.', en: 'Supply is secured. Sales run smoothly and shelves stay full.' },
                effects: { demand: [{ scope: 'all', mult: 1.03, days: 60 }] }
            },
            {
                id: 'alternate', cost: 3000,
                label: { id: 'Cari pemasok alternatif', en: 'Source an alternate supplier' },
                risk: {
                    p: 0.75,
                    success: {
                        outcome: { id: 'Pemasok alternatif sanggup memenuhi pesanan tepat waktu.', en: 'The alternate supplier delivers on time.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Kualitas komponen baru tidak stabil dan pengiriman tersendat.', en: 'The new components are inconsistent and deliveries stall.' },
                        effects: { reputation: -2, demand: [{ scope: 'all', mult: 0.93, days: 60 }] }
                    }
                }
            },
            {
                id: 'wait', cost: 0,
                label: { id: 'Tunggu pemasok pulih', en: 'Wait for the supplier to recover' },
                risk: {
                    p: 0.5,
                    success: {
                        outcome: { id: 'Pemasok pulih lebih cepat dari perkiraan. Tidak ada dampak berarti.', en: 'The supplier recovers faster than expected. No real impact.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Pemulihan lambat. Stok habis di banyak toko selama beberapa pekan.', en: 'Recovery is slow. Stock runs out in many stores for weeks.' },
                        effects: { demand: [{ scope: 'all', mult: 0.9, days: 60 }] }
                    }
                }
            }
        ]
    },
    {
        id: 'dyn_carrier_exclusive', kind: 'dynamic',
        minYear: 2000, maxYear: 2012, weight: 1.2, cooldownMonths: 24, when: 'selling',
        title: { id: 'Operator Menawarkan Kontrak Eksklusif', en: 'Carrier Offers an Exclusive Deal' },
        body: {
            id: 'Sebuah operator besar ingin menjual ponselmu secara eksklusif lewat jaringannya. Volumenya menggiurkan, tetapi pembeli di luar operator itu dan citra mereknya jadi taruhan.',
            en: 'A major carrier wants to sell your phones exclusively on its network. The volume is tempting, but buyers outside that carrier and your brand image are at stake.'
        },
        choices: [
            {
                id: 'accept', cost: 0,
                label: { id: 'Terima kontrak eksklusif', en: 'Accept the exclusive deal' },
                outcome: { id: 'Uang muka masuk dan penjualan lewat operator melonjak, tetapi pembeli premium jadi enggan.', en: 'The advance lands and carrier sales surge, but premium buyers lose interest.' },
                effects: { cash: 15000, reputation: -1, demand: [{ scope: 'all', mult: 1.12, days: 150 }, { scope: 'premium', mult: 0.93, days: 150 }] }
            },
            {
                id: 'counter', cost: 1500,
                label: { id: 'Ajukan syarat tandingan', en: 'Make a counter-offer' },
                risk: {
                    p: 0.5,
                    success: {
                        outcome: { id: 'Operator menyetujui syaratmu: uang muka lebih besar dan tanpa eksklusivitas penuh.', en: 'The carrier agrees: a bigger advance and no full exclusivity.' },
                        effects: { cash: 24000, demand: [{ scope: 'all', mult: 1.1, days: 150 }] }
                    },
                    fail: {
                        outcome: { id: 'Operator membatalkan tawaran dan beralih ke merek lain.', en: 'The carrier withdraws and moves to another brand.' },
                        effects: {}
                    }
                }
            },
            {
                id: 'decline', cost: 0,
                label: { id: 'Tolak, tetap independen', en: 'Decline and stay independent' },
                outcome: { id: 'Kamu mempertahankan kendali merek. Pasar menghargai independensimu.', en: 'You keep control of your brand. The market respects your independence.' },
                effects: { reputation: 1 }
            }
        ]
    },
    {
        id: 'dyn_patent_suit', kind: 'dynamic',
        minYear: 2002, maxYear: 2050, weight: 0.7, cooldownMonths: 30, when: 'selling',
        title: { id: 'Gugatan Paten dari Pesaing', en: 'Patent Lawsuit from a Rival' },
        body: {
            id: 'Pesaing besar menggugat dan mengklaim ponselmu melanggar paten antarmuka mereka. Pengacaramu bilang kasusnya bisa dimenangkan, tetapi tidak ada jaminan.',
            en: 'A big rival sues, claiming your phone infringes its interface patents. Your lawyers say the case is winnable, but there are no guarantees.'
        },
        choices: [
            {
                id: 'fight', cost: 15000,
                label: { id: 'Lawan di pengadilan', en: 'Fight in court' },
                risk: {
                    p: 0.55,
                    success: {
                        outcome: { id: 'Pengadilan menolak gugatan dan kamu mendapat ganti biaya. Citra inovatifmu menguat.', en: 'The court dismisses the suit and awards you costs. Your innovative image grows.' },
                        effects: { cash: 12000, reputation: 2 }
                    },
                    fail: {
                        outcome: { id: 'Kamu kalah dan harus membayar ganti rugi besar.', en: 'You lose and must pay heavy damages.' },
                        effects: { cash: -30000, reputation: -2 }
                    }
                }
            },
            {
                id: 'settle', cost: 10000,
                label: { id: 'Berdamai dan bayar lisensi', en: 'Settle and pay a licence fee' },
                outcome: { id: 'Kasus selesai tanpa kejutan. Biayanya pasti dan terkendali.', en: 'The case closes without surprises. The cost is certain and contained.' },
                effects: {}
            },
            {
                id: 'ignore', cost: 0,
                label: { id: 'Abaikan dan berharap gugatan layu', en: 'Ignore it and hope it fades' },
                risk: {
                    p: 0.3,
                    success: {
                        outcome: { id: 'Pesaing menarik gugatannya. Kamu selamat tanpa biaya.', en: 'The rival drops the suit. You escape without cost.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Pengadilan memutus kamu kalah karena tidak hadir. Ganti ruginya jauh lebih besar.', en: 'The court rules against you by default. The damages are far larger.' },
                        effects: { cash: -45000, reputation: -3 }
                    }
                }
            }
        ]
    },
    {
        id: 'dyn_retailer_bankrupt', kind: 'dynamic',
        minYear: 2000, maxYear: 2050, weight: 0.8, cooldownMonths: 24, when: 'selling',
        title: { id: 'Jaringan Ritel Bangkrut', en: 'Retail Chain Goes Bankrupt' },
        body: {
            id: 'Jaringan toko yang menjual ponselmu mengajukan kebangkrutan dan masih menunggak pembayaran. Stok mereka akan dilelang murah.',
            en: 'A store chain that sells your phones files for bankruptcy and still owes you money. Their stock will be auctioned cheaply.'
        },
        choices: [
            {
                id: 'claim', cost: 2000,
                label: { id: 'Ajukan klaim piutang', en: 'File a claim for the debt' },
                risk: {
                    p: 0.5,
                    success: {
                        outcome: { id: 'Sebagian piutang berhasil ditagih dari aset yang dilikuidasi.', en: 'Part of the debt is recovered from the liquidated assets.' },
                        effects: { cash: 10000 }
                    },
                    fail: {
                        outcome: { id: 'Kreditur lain lebih dulu dan tidak ada yang tersisa untukmu.', en: 'Other creditors get paid first and nothing is left for you.' },
                        effects: {}
                    }
                }
            },
            {
                id: 'buyout', cost: 6000,
                label: { id: 'Beli stok toko dan jual sendiri', en: 'Buy their stock and sell it yourself' },
                outcome: { id: 'Kamu mengambil alih rak yang kosong dan penjualan terdorong beberapa bulan.', en: 'You take over the empty shelves and sales get a lift for a few months.' },
                effects: { demand: [{ scope: 'all', mult: 1.06, days: 90 }] }
            },
            {
                id: 'writeoff', cost: 0,
                label: { id: 'Hapus piutang dan jaga hubungan', en: 'Write off the debt and keep relations' },
                outcome: { id: 'Mitra ritel lain menghargai sikapmu yang tidak memburu.', en: 'Other retail partners appreciate that you did not chase.' },
                effects: { reputation: 1 }
            }
        ]
    },
    // ---------------------------------------------------------------- P4 tahap 1: umum sepanjang era
    {
        id: 'dyn_screen_defect_batch', kind: 'dynamic',
        minYear: 2000, maxYear: 2050, weight: 1, cooldownMonths: 18, when: 'selling',
        title: { id: 'Satu Batch Layar Cacat', en: 'A Defective Screen Batch' },
        body: {
            id: 'Satu batch layar dari pabrik ternyata cacat: piksel mati dan warna bergaris. Sebagian unit sudah sampai ke toko dan keluhan mulai masuk.',
            en: 'One batch of screens from the factory turns out defective: dead pixels and banded colors. Some units have already reached stores and complaints are coming in.'
        },
        choices: [
            {
                id: 'replace', cost: 6000,
                label: { id: 'Ganti semua unit cacat', en: 'Replace every defective unit' },
                outcome: { id: 'Semua unit cacat diganti. Pelanggan merasa dilayani dengan baik.', en: 'Every defective unit is replaced. Customers feel well looked after.' },
                effects: { reputation: 1, demand: [{ scope: 'all', mult: 0.97, days: 30 }] }
            },
            {
                id: 'rework', cost: 2000,
                label: { id: 'Perbaiki di pabrik', en: 'Rework at the factory' },
                risk: {
                    p: 0.6,
                    success: {
                        outcome: { id: 'Perbaikan di pabrik berhasil dan unit pengganti tiba tepat waktu.', en: 'The factory rework succeeds and replacement units arrive on time.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Perbaikan memakan waktu dan banyak pelanggan menunggu. Ulasan buruk menumpuk.', en: 'The rework drags on and many customers wait. Bad reviews pile up.' },
                        effects: { reputation: -3, demand: [{ scope: 'all', mult: 0.92, days: 60 }] }
                    }
                }
            },
            {
                id: 'quiet', cost: 0,
                label: { id: 'Diamkan dan lanjut produksi', en: 'Stay quiet and keep producing' },
                risk: {
                    p: 0.4,
                    success: {
                        outcome: { id: 'Hanya sedikit pelanggan yang menyadari. Kasus ini lewat begitu saja.', en: 'Few customers notice. The matter passes.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Keluhan membesar dan kamu harus membayar penggantian massal.', en: 'Complaints snowball and you must pay for mass replacements.' },
                        effects: { cash: -8000, reputation: -4 }
                    }
                }
            }
        ]
    },
    {
        id: 'dyn_factory_disruption', kind: 'dynamic',
        minYear: 2000, maxYear: 2050, weight: 1, cooldownMonths: 18, when: 'selling',
        title: { id: 'Bencana di Pabrik Perakitan', en: 'Disaster at the Assembly Plant' },
        body: {
            id: 'Bencana melanda pabrik perakitan mitramu. Lini produksi berhenti dan jadwal pengiriman ke toko terancam molor berminggu-minggu.',
            en: 'A disaster strikes your partner assembly plant. The production line is down and store deliveries may slip by weeks.'
        },
        choices: [
            {
                id: 'backup', cost: 8000,
                label: { id: 'Pindahkan produksi ke mitra cadangan', en: 'Move production to a backup partner' },
                outcome: { id: 'Produksi pindah dengan mulus dan rak toko tetap terisi.', en: 'Production moves smoothly and store shelves stay stocked.' },
                effects: {}
            },
            {
                id: 'overtime', cost: 3000,
                label: { id: 'Tambah lembur di pabrik yang tersisa', en: 'Add overtime at the remaining plant' },
                risk: {
                    p: 0.6,
                    success: {
                        outcome: { id: 'Lembur menutup sebagian besar kekurangan dan pengiriman nyaris tepat waktu.', en: 'Overtime covers most of the shortfall and deliveries are nearly on time.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Lembur tidak cukup dan toko kehabisan stok beberapa pekan.', en: 'Overtime is not enough and stores run out of stock for weeks.' },
                        effects: { demand: [{ scope: 'all', mult: 0.92, days: 45 }] }
                    }
                }
            },
            {
                id: 'wait', cost: 0,
                label: { id: 'Tunggu pabrik pulih', en: 'Wait for the plant to recover' },
                risk: {
                    p: 0.4,
                    success: {
                        outcome: { id: 'Pabrik pulih lebih cepat dari perkiraan.', en: 'The plant recovers faster than expected.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Pemulihan sangat lambat. Pengiriman tersendat dan ada denda keterlambatan ke toko.', en: 'Recovery is very slow. Deliveries stall and late-delivery penalties hit.' },
                        effects: { cash: -10000, demand: [{ scope: 'all', mult: 0.85, days: 90 }] }
                    }
                }
            }
        ]
    },
    {
        id: 'dyn_warranty_surge', kind: 'dynamic',
        minYear: 2000, maxYear: 2050, weight: 1, cooldownMonths: 18, when: 'selling',
        title: { id: 'Lonjakan Klaim Garansi', en: 'Warranty Claims Surge' },
        body: {
            id: 'Klaim garansi untuk ponsel lamamu melonjak seiring unit-unit menua. Pusat servis kewalahan dan antrean pelanggan memanjang.',
            en: 'Warranty claims for your older phones are surging as units age. Service centers are swamped and customer queues keep growing.'
        },
        choices: [
            {
                id: 'extend', cost: 5000,
                label: { id: 'Perpanjang garansi dan tambah gerai servis', en: 'Extend the warranty and add service points' },
                outcome: { id: 'Antrean terurai dan pelanggan lama makin loyal.', en: 'Queues clear and long-time customers grow more loyal.' },
                effects: { reputation: 2 }
            },
            {
                id: 'standard', cost: 1500,
                label: { id: 'Tangani dengan layanan standar', en: 'Handle it with standard service' },
                risk: {
                    p: 0.5,
                    success: {
                        outcome: { id: 'Tim servis mengejar antrean tanpa insiden besar.', en: 'The service team clears the queue without a major incident.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Antrean tak terkejar dan keluhan soal servis lambat menyebar.', en: 'The queue cannot be cleared and complaints about slow service spread.' },
                        effects: { reputation: -3, demand: [{ scope: 'all', mult: 0.94, days: 60 }] }
                    }
                }
            },
            {
                id: 'reject', cost: 0,
                label: { id: 'Tolak klaim yang meragukan', en: 'Reject questionable claims' },
                risk: {
                    p: 0.35,
                    success: {
                        outcome: { id: 'Penolakan diterima tanpa banyak protes.', en: 'The rejections are accepted with little protest.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Pelanggan merasa dicurangi dan kasusnya ramai di media.', en: 'Customers feel cheated and the story spreads in the press.' },
                        effects: { reputation: -5, demand: [{ scope: 'all', mult: 0.9, days: 90 }] }
                    }
                }
            }
        ]
    },
    {
        id: 'dyn_expo_demo_slot', kind: 'dynamic',
        minYear: 2000, maxYear: 2050, weight: 1, cooldownMonths: 18, when: 'selling',
        title: { id: 'Undangan Demo di Pameran Teknologi', en: 'Invitation to Demo at a Tech Expo' },
        body: {
            id: 'Penyelenggara pameran teknologi besar mengundangmu mendemokan ponsel terbarumu di panggung utama. Sorotan media menggiurkan, tetapi demo yang gagal akan dilihat banyak orang.',
            en: 'The organizers of a major tech expo invite you to demo your latest phone on the main stage. The media spotlight is tempting, but a failed demo will be seen by many.'
        },
        choices: [
            {
                id: 'big', cost: 7000,
                label: { id: 'Sewa stan besar dan demo penuh', en: 'Book a large booth and a full demo' },
                outcome: { id: 'Stan ramai pengunjung dan liputan media positif.', en: 'The booth is packed and media coverage is positive.' },
                effects: { reputation: 2, demand: [{ scope: 'all', mult: 1.05, days: 45 }] }
            },
            {
                id: 'simple', cost: 2000,
                label: { id: 'Demo sederhana di stan kecil', en: 'A simple demo at a small booth' },
                risk: {
                    p: 0.6,
                    success: {
                        outcome: { id: 'Demo berjalan mulus dan menarik perhatian pengunjung.', en: 'The demo goes smoothly and draws visitors.' },
                        effects: { demand: [{ scope: 'all', mult: 1.04, days: 30 }] }
                    },
                    fail: {
                        outcome: { id: 'Demo macet di depan banyak orang dan videonya beredar.', en: 'The demo freezes in front of a crowd and the video circulates.' },
                        effects: { reputation: -3 }
                    }
                }
            },
            {
                id: 'skip', cost: 0,
                label: { id: 'Lewati pameran', en: 'Skip the expo' },
                risk: {
                    p: 0.4,
                    success: {
                        outcome: { id: 'Ketidakhadiranmu justru dibicarakan sebagai sikap percaya diri.', en: 'Your absence is talked about as a sign of confidence.' },
                        effects: { reputation: 1 }
                    },
                    fail: {
                        outcome: { id: 'Ketidakhadiranmu tidak diperhatikan siapa pun.', en: 'Nobody notices that you were not there.' },
                        effects: {}
                    }
                }
            }
        ]
    },
    {
        id: 'dyn_price_war', kind: 'dynamic',
        minYear: 2004, maxYear: 2050, weight: 1, cooldownMonths: 18, when: 'selling',
        title: { id: 'Pesaing Besar Banting Harga', en: 'Big Rival Slashes Prices' },
        body: {
            id: 'Pesaing besar tiba-tiba memangkas harga ponsel andalannya. Pembeli mulai membandingkan dan toko menanyakan sikapmu.',
            en: 'A big rival suddenly slashes the price of its flagship phone. Buyers start comparing and retailers ask where you stand.'
        },
        choices: [
            {
                id: 'match', cost: 4000,
                label: { id: 'Ikut menurunkan harga lewat promo', en: 'Match the cut with a promotion' },
                outcome: { id: 'Promomu menahan pembeli. Margin menipis, tetapi penjualan terjaga.', en: 'Your promotion holds buyers. Margins thin, but sales hold up.' },
                effects: { demand: [{ scope: 'all', mult: 1.05, days: 60 }] }
            },
            {
                id: 'value', cost: 1500,
                label: { id: 'Pertahankan harga, tonjolkan nilai', en: 'Hold your price and stress value' },
                risk: {
                    p: 0.55,
                    success: {
                        outcome: { id: 'Pembeli melihat nilai lebih pada ponselmu dan citra mereknya menguat.', en: 'Buyers see more value in your phone and your brand image grows.' },
                        effects: { reputation: 2 }
                    },
                    fail: {
                        outcome: { id: 'Pembeli tergiur harga murah dan beralih ke pesaing.', en: 'Buyers are lured by the low price and switch to the rival.' },
                        effects: { demand: [{ scope: 'all', mult: 0.9, days: 90 }] }
                    }
                }
            },
            {
                id: 'watch', cost: 0,
                label: { id: 'Diam dan lihat perkembangan', en: 'Stay quiet and watch' },
                risk: {
                    p: 0.4,
                    success: {
                        outcome: { id: 'Perang harga mereda dengan sendirinya.', en: 'The price war fades on its own.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Pesaing terus menekan dan pangsa pasarmu tergerus.', en: 'The rival keeps pushing and your market share erodes.' },
                        effects: { demand: [{ scope: 'all', mult: 0.88, days: 90 }] }
                    }
                }
            }
        ]
    },
    // ---------------------------------------------------------------- P4 tahap 2: pasar & citra (2003-2006+)
    {
        id: 'dyn_poach_engineer', kind: 'dynamic',
        minYear: 2003, maxYear: 2050, weight: 1, cooldownMonths: 18, when: 'selling',
        title: { id: 'Pesaing Membajak Insinyur Kunci', en: 'Rival Poaches Key Engineers' },
        body: {
            id: 'Pesaing menawarkan gaji besar kepada insinyur kunci di timmu. Dua orang sudah mempertimbangkannya, dan kepergian mereka bisa menunda proyek yang berjalan.',
            en: 'A rival is offering big salaries to your key engineers. Two are already considering it, and losing them could delay ongoing projects.'
        },
        choices: [
            {
                id: 'retain', cost: 6000,
                label: { id: 'Naikkan gaji untuk menahan mereka', en: 'Raise salaries to keep them' },
                outcome: { id: 'Para insinyur bertahan dan tim merasa dihargai.', en: 'The engineers stay and the team feels valued.' },
                effects: { reputation: 1 }
            },
            {
                id: 'counter', cost: 2500,
                label: { id: 'Ajukan tawaran balik yang lebih kecil', en: 'Make a smaller counter-offer' },
                risk: {
                    p: 0.5,
                    success: {
                        outcome: { id: 'Tawaran balikmu cukup. Para insinyur memilih tetap.', en: 'Your counter-offer is enough. The engineers choose to stay.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Mereka tetap pergi dan proyekmu tersendat. Kabarnya sampai ke pasar.', en: 'They leave anyway and your projects stall. The news reaches the market.' },
                        effects: { reputation: -2, demand: [{ scope: 'all', mult: 0.95, days: 60 }] }
                    }
                }
            },
            {
                id: 'letgo', cost: 0,
                label: { id: 'Biarkan mereka pergi', en: 'Let them go' },
                risk: {
                    p: 0.4,
                    success: {
                        outcome: { id: 'Tim yang tersisa menutup celah lebih cepat dari perkiraan.', en: 'The remaining team closes the gap faster than expected.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Kepergian mereka memukul tim dan jadwal rilis molor.', en: 'Their departure hits the team and release schedules slip.' },
                        effects: { reputation: -3, demand: [{ scope: 'all', mult: 0.92, days: 90 }] }
                    }
                }
            }
        ]
    },
    {
        id: 'dyn_prototype_leak', kind: 'dynamic',
        minYear: 2005, maxYear: 2050, weight: 1, cooldownMonths: 18, when: 'selling',
        title: { id: 'Prototipe Bocor ke Media', en: 'Prototype Leaks to the Press' },
        body: {
            id: 'Foto dan spesifikasi prototipe terbarumu bocor ke blog teknologi sebelum waktunya. Media meminta konfirmasi dan pesaing ikut membacanya.',
            en: 'Photos and specs of your newest prototype leak to tech blogs ahead of schedule. The press wants confirmation and rivals are reading too.'
        },
        choices: [
            {
                id: 'confirm', cost: 4000,
                label: { id: 'Konfirmasi resmi dan percepat rilis', en: 'Confirm officially and speed up the launch' },
                outcome: { id: 'Kebocoran berubah jadi promosi gratis. Pembeli menunggu rilisnya.', en: 'The leak turns into free promotion. Buyers wait for the launch.' },
                effects: { reputation: 1, demand: [{ scope: 'all', mult: 1.04, days: 45 }] }
            },
            {
                id: 'deny', cost: 1500,
                label: { id: 'Bantah dan selidiki sumber bocoran', en: 'Deny it and investigate the source' },
                risk: {
                    p: 0.5,
                    success: {
                        outcome: { id: 'Sumber bocoran ditemukan dan pemberitaan reda. Kamu terlihat sigap.', en: 'The source is found and coverage fades. You look on top of it.' },
                        effects: { reputation: 1 }
                    },
                    fail: {
                        outcome: { id: 'Bantahanmu terbukti keliru dan citramu tercoreng.', en: 'Your denial is proven wrong and your image takes a hit.' },
                        effects: { reputation: -4, demand: [{ scope: 'all', mult: 0.9, days: 60 }] }
                    }
                }
            },
            {
                id: 'silent', cost: 0,
                label: { id: 'Tidak berkomentar', en: 'Say nothing' },
                risk: {
                    p: 0.4,
                    success: {
                        outcome: { id: 'Berita cepat basi dan pembeli tidak peduli.', en: 'The story goes stale and buyers do not care.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Spekulasi liar mengisi kekosongan dan membuat orang ragu menunggu.', en: 'Wild speculation fills the gap and makes buyers hesitate.' },
                        effects: { reputation: -2, demand: [{ scope: 'all', mult: 0.93, days: 60 }] }
                    }
                }
            }
        ]
    },
    {
        id: 'dyn_counterfeit_wave', kind: 'dynamic',
        minYear: 2006, maxYear: 2050, weight: 1, cooldownMonths: 18, when: 'selling',
        title: { id: 'Tiruan Murah Membanjiri Pasar', en: 'Cheap Counterfeits Flood the Market' },
        body: {
            id: 'Tiruan ponselmu dengan harga jauh lebih murah mulai dijual di pasar dan lapak daring. Kualitasnya buruk, tetapi pembeli sering tak bisa membedakan.',
            en: 'Cheap imitations of your phone are showing up in markets and online stalls. Quality is poor, but buyers often cannot tell the difference.'
        },
        choices: [
            {
                id: 'authentic', cost: 6000,
                label: { id: 'Kampanye keaslian dan segel resmi', en: 'An authenticity campaign with official seals' },
                outcome: { id: 'Pembeli belajar mengenali produk asli dan lebih percaya mereknya.', en: 'Buyers learn to spot the real product and trust your brand more.' },
                effects: { reputation: 2 }
            },
            {
                id: 'sue', cost: 3000,
                label: { id: 'Gugat para penjual tiruan', en: 'Sue the counterfeit sellers' },
                risk: {
                    p: 0.5,
                    success: {
                        outcome: { id: 'Beberapa penjual ditutup dan kamu menerima ganti rugi. Pasar melihatmu serius.', en: 'Several sellers are shut down and you receive damages. The market sees you are serious.' },
                        effects: { cash: 4000, reputation: 1 }
                    },
                    fail: {
                        outcome: { id: 'Proses hukum lambat dan tiruan tetap beredar.', en: 'The legal process is slow and the imitations keep circulating.' },
                        effects: { demand: [{ scope: 'all', mult: 0.94, days: 60 }] }
                    }
                }
            },
            {
                id: 'ignore', cost: 0,
                label: { id: 'Abaikan, itu pasar yang berbeda', en: 'Ignore it, it is a different market' },
                risk: {
                    p: 0.4,
                    success: {
                        outcome: { id: 'Pembeli tiruan memang bukan target pasarmu. Dampaknya kecil.', en: 'Imitation buyers were never your target. The impact is small.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Tiruan merebut pembeli dan merusak citra mereknya.', en: 'Imitations steal buyers and damage your brand image.' },
                        effects: { demand: [{ scope: 'all', mult: 0.88, days: 120 }] }
                    }
                }
            }
        ]
    },
    {
        id: 'dyn_celebrity_endorse', kind: 'dynamic',
        minYear: 2005, maxYear: 2050, weight: 1, cooldownMonths: 18, when: 'selling',
        title: { id: 'Tawaran Dukungan Figur Publik', en: 'Public Figure Endorsement Offer' },
        body: {
            id: 'Seorang figur publik yang sangat populer menawarkan diri memakai dan mendukung ponselmu. Jangkauannya luas, tetapi citra figur itu ikut menempel ke mereknya.',
            en: 'A hugely popular public figure offers to use and endorse your phone. The reach is wide, but that person\'s image rubs off on your brand.'
        },
        choices: [
            {
                id: 'major', cost: 9000,
                label: { id: 'Kontrak dukungan besar', en: 'A major endorsement contract' },
                outcome: { id: 'Iklan dan penampilan sang figur mendongkrak penjualan beberapa bulan.', en: 'Ads and appearances by the figure lift sales for months.' },
                effects: { reputation: 1, demand: [{ scope: 'all', mult: 1.1, days: 60 }] }
            },
            {
                id: 'limited', cost: 3000,
                label: { id: 'Kontrak kecil terbatas', en: 'A small, limited contract' },
                risk: {
                    p: 0.6,
                    success: {
                        outcome: { id: 'Dukungan terbatas itu cukup menarik perhatian pembeli.', en: 'The limited endorsement is enough to catch the attention of buyers.' },
                        effects: { demand: [{ scope: 'all', mult: 1.06, days: 45 }] }
                    },
                    fail: {
                        outcome: { id: 'Sang figur terlibat kontroversi dan mereknya ikut terseret.', en: 'The figure gets caught in a controversy and your brand is dragged along.' },
                        effects: { reputation: -2 }
                    }
                }
            },
            {
                id: 'decline', cost: 0,
                label: { id: 'Tolak dan tetap mandiri', en: 'Decline and stay independent' },
                outcome: { id: 'Kamu menjaga citra merek tetap mandiri dan pasar menghargainya.', en: 'You keep your brand image independent and the market respects it.' },
                effects: { reputation: 1 }
            }
        ]
    },
    {
        id: 'dyn_government_subsidy', kind: 'dynamic',
        minYear: 2005, maxYear: 2050, weight: 1, cooldownMonths: 24, when: 'selling',
        title: { id: 'Program Pemerintah Subsidi Perangkat', en: 'Government Device Subsidy Program' },
        body: {
            id: 'Pemerintah membuka program subsidi agar lebih banyak warga memiliki ponsel. Produsen yang ikut harus memenuhi syarat harga dan layanan purna jual.',
            en: 'The government opens a subsidy program so more citizens can own a phone. Manufacturers who join must meet price and after-sales service requirements.'
        },
        choices: [
            {
                id: 'register', cost: 4000,
                label: { id: 'Daftar penuh dan siapkan stok', en: 'Join fully and prepare stock' },
                outcome: { id: 'Kamu lolos program dan permintaan naik selama masa subsidi.', en: 'You qualify for the program and demand rises during the subsidy period.' },
                effects: { demand: [{ scope: 'all', mult: 1.08, days: 90 }] }
            },
            {
                id: 'special', cost: 1500,
                label: { id: 'Ikut dengan model berharga khusus', en: 'Join with a special-price model' },
                risk: {
                    p: 0.6,
                    success: {
                        outcome: { id: 'Model khususmu laris dan pemerintah membayar subsidinya tepat waktu.', en: 'Your special model sells well and the government pays the subsidy on time.' },
                        effects: { cash: 8000, demand: [{ scope: 'all', mult: 1.05, days: 90 }] }
                    },
                    fail: {
                        outcome: { id: 'Kamu dinilai memanfaatkan program demi untung dan citramu turun.', en: 'You are judged to be exploiting the program for profit and your image drops.' },
                        effects: { reputation: -2 }
                    }
                }
            },
            {
                id: 'stayout', cost: 0,
                label: { id: 'Tidak ikut', en: 'Stay out' },
                outcome: { id: 'Kamu fokus pada pasarmu sendiri tanpa urusan administrasi tambahan.', en: 'You focus on your own market without the extra paperwork.' },
                effects: { reputation: 1 }
            }
        ]
    },
    // ---------------------------------------------------------------- P4 tahap 3: era layanan & aplikasi (2010+)
    {
        id: 'dyn_data_leak', kind: 'dynamic',
        minYear: 2011, maxYear: 2050, weight: 0.6, cooldownMonths: 30, when: 'selling',
        title: { id: 'Kebocoran Data Pengguna Layanan Awan', en: 'Cloud Service User Data Leak' },
        body: {
            id: 'Data akun pengguna layanan awanmu bocor setelah celah keamanan dieksploitasi. Pengguna panik dan media menanti pernyataanmu.',
            en: 'User account data from your cloud service leaks after a security hole is exploited. Users are alarmed and the press awaits your statement.'
        },
        choices: [
            {
                id: 'audit', cost: 8000,
                label: { id: 'Audit menyeluruh dan beri tahu semua pengguna', en: 'Run a full audit and notify every user' },
                outcome: { id: 'Kamu terbuka soal kejadian ini. Pengguna kesal tetapi menghargai kejujuranmu.', en: 'You are open about the incident. Users are upset but appreciate your honesty.' },
                effects: { reputation: -1 }
            },
            {
                id: 'patch', cost: 2500,
                label: { id: 'Tambal celah dengan cepat', en: 'Patch the hole quickly' },
                risk: {
                    p: 0.5,
                    success: {
                        outcome: { id: 'Celah tertutup sebelum penyusup mengambil banyak data.', en: 'The hole is closed before intruders take much data.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Penyusup sudah mengambil banyak data dan kabarnya viral.', en: 'Intruders already took a lot of data and the story goes viral.' },
                        effects: { reputation: -5, demand: [{ scope: 'all', mult: 0.85, days: 120 }] }
                    }
                }
            },
            {
                id: 'hide', cost: 0,
                label: { id: 'Tutup celah diam-diam tanpa pengumuman', en: 'Close the hole quietly without an announcement' },
                risk: {
                    p: 0.25,
                    success: {
                        outcome: { id: 'Tidak ada yang menyadari dan kasus ini tidak pernah mencuat.', en: 'Nobody notices and the case never surfaces.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Penyembunyianmu terbongkar. Denda dan ganti rugi datang bersamaan dengan kemarahan pengguna.', en: 'Your cover-up is exposed. Fines and compensation arrive along with user anger.' },
                        effects: { cash: -25000, reputation: -6, demand: [{ scope: 'all', mult: 0.82, days: 180 }] }
                    }
                }
            }
        ]
    },
    {
        id: 'dyn_app_scam', kind: 'dynamic',
        minYear: 2010, maxYear: 2050, weight: 1, cooldownMonths: 18, when: 'selling',
        title: { id: 'Aplikasi Penipuan Lolos di Toko Aplikasimu', en: 'Scam App Slips Into Your App Store' },
        body: {
            id: 'Sebuah aplikasi penipuan lolos tinjauan dan menguras saldo pengguna di toko aplikasimu. Korban mulai melapor dan menuntut tanggung jawab.',
            en: 'A scam app passes review and drains the balances of users in your app store. Victims are reporting it and demanding accountability.'
        },
        choices: [
            {
                id: 'review', cost: 3000,
                label: { id: 'Tinjau ulang seluruh katalog aplikasi', en: 'Re-review the whole app catalog' },
                outcome: { id: 'Beberapa aplikasi mencurigakan ikut dibersihkan. Pengguna merasa lebih aman.', en: 'Several other suspicious apps are cleaned out. Users feel safer.' },
                effects: { reputation: 1 }
            },
            {
                id: 'remove', cost: 1500,
                label: { id: 'Hapus cepat dan ganti rugi korban', en: 'Remove it fast and compensate victims' },
                risk: {
                    p: 0.6,
                    success: {
                        outcome: { id: 'Korban diganti dan kasus ditutup dengan citra yang terjaga.', en: 'Victims are compensated and the case closes with your image intact.' },
                        effects: { reputation: 1 }
                    },
                    fail: {
                        outcome: { id: 'Ganti rugi tidak mencakup semua korban dan keluhan tetap beredar.', en: 'Compensation does not cover every victim and complaints keep circulating.' },
                        effects: { reputation: -2 }
                    }
                }
            },
            {
                id: 'delay', cost: 0,
                label: { id: 'Tunda sampai ada laporan resmi', en: 'Wait for an official report' },
                risk: {
                    p: 0.4,
                    success: {
                        outcome: { id: 'Laporan tidak pernah datang dan kasus mereda.', en: 'No report arrives and the case fades.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Korban bertambah dan kamu dituding lalai menjaga toko aplikasimu.', en: 'Victims multiply and you are accused of neglecting your app store.' },
                        effects: { reputation: -3, demand: [{ scope: 'all', mult: 0.92, days: 45 }] }
                    }
                }
            }
        ]
    },
    {
        id: 'dyn_influencer_review', kind: 'dynamic',
        minYear: 2010, maxYear: 2050, weight: 1, cooldownMonths: 18, when: 'selling',
        title: { id: 'Ulasan Viral dari Kreator Konten', en: 'Viral Review from a Content Creator' },
        body: {
            id: 'Seorang kreator konten dengan jutaan pengikut mengulas ponselmu di videonya. Ulasannya bisa mengangkat atau menjatuhkan penjualan dalam semalam.',
            en: 'A content creator with millions of followers reviews your phone in a video. The review could lift or sink sales overnight.'
        },
        choices: [
            {
                id: 'invite', cost: 5000,
                label: { id: 'Undang kreator ke peluncuran resmi', en: 'Invite the creator to an official launch' },
                outcome: { id: 'Kreator memberi ulasan hangat dan videonya menarik banyak pembeli.', en: 'The creator gives a warm review and the video draws many buyers.' },
                effects: { demand: [{ scope: 'all', mult: 1.08, days: 45 }] }
            },
            {
                id: 'samples', cost: 2000,
                label: { id: 'Kirim unit gratis ke banyak kreator', en: 'Send free units to many creators' },
                risk: {
                    p: 0.6,
                    success: {
                        outcome: { id: 'Banyak kreator memuji ponselmu dan pembicaraan tentangnya ramai.', en: 'Many creators praise your phone and the buzz grows.' },
                        effects: { demand: [{ scope: 'all', mult: 1.07, days: 60 }] }
                    },
                    fail: {
                        outcome: { id: 'Kamu dituding membeli ulasan dan citramu sedikit turun.', en: 'You are accused of buying reviews and your image dips.' },
                        effects: { reputation: -1 }
                    }
                }
            },
            {
                id: 'leave', cost: 0,
                label: { id: 'Biarkan ulasan berjalan apa adanya', en: 'Let the review run its course' },
                risk: {
                    p: 0.5,
                    success: {
                        outcome: { id: 'Ulasannya positif dan membawa sedikit tambahan pembeli.', en: 'The review is positive and brings a few extra buyers.' },
                        effects: { demand: [{ scope: 'all', mult: 1.03, days: 30 }] }
                    },
                    fail: {
                        outcome: { id: 'Ulasannya negatif dan cepat menyebar.', en: 'The review is negative and spreads fast.' },
                        effects: { reputation: -2 }
                    }
                }
            }
        ]
    },
    {
        id: 'dyn_bad_os_update', kind: 'dynamic',
        minYear: 2010, maxYear: 2050, weight: 1, cooldownMonths: 18, when: 'selling',
        title: { id: 'Pembaruan OS Membuat Ponsel Lambat', en: 'OS Update Slows Phones Down' },
        body: {
            id: 'Pembaruan sistem operasi dari pemasok perangkat lunakmu membuat ponsel terasa lambat dan boros baterai. Pengguna mengeluh di forum dan ulasan.',
            en: 'An operating system update from your software supplier makes phones sluggish and battery-hungry. Users are complaining in forums and reviews.'
        },
        choices: [
            {
                id: 'pullfix', cost: 5000,
                label: { id: 'Tarik pembaruan dan rilis perbaikan besar', en: 'Pull the update and ship a major fix' },
                outcome: { id: 'Pembaruan diperbaiki total. Pengguna menghargai kesigapanmu.', en: 'The update is fully fixed. Users appreciate your quick response.' },
                effects: { reputation: 1 }
            },
            {
                id: 'hotfix', cost: 2000,
                label: { id: 'Rilis tambalan cepat', en: 'Ship a quick hotfix' },
                risk: {
                    p: 0.6,
                    success: {
                        outcome: { id: 'Tambalan memulihkan kecepatan dan keluhan reda.', en: 'The hotfix restores speed and complaints fade.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Tambalan menimbulkan masalah baru dan keluhan makin ramai.', en: 'The hotfix causes new problems and complaints grow louder.' },
                        effects: { reputation: -3, demand: [{ scope: 'all', mult: 0.92, days: 60 }] }
                    }
                }
            },
            {
                id: 'silent', cost: 0,
                label: { id: 'Diam dan tunggu pembaruan berikutnya', en: 'Stay quiet and wait for the next update' },
                risk: {
                    p: 0.4,
                    success: {
                        outcome: { id: 'Pembaruan berikutnya datang cepat dan masalah teratasi.', en: 'The next update arrives quickly and the issue is solved.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Pengguna merasa diabaikan dan memboikot pembaruan berikutnya.', en: 'Users feel ignored and boycott the next update.' },
                        effects: { reputation: -4, demand: [{ scope: 'all', mult: 0.88, days: 90 }] }
                    }
                }
            }
        ]
    },
    {
        id: 'dyn_rare_material_cost', kind: 'dynamic',
        minYear: 2010, maxYear: 2050, weight: 1, cooldownMonths: 18, when: 'selling',
        title: { id: 'Harga Bahan Baku Langka Naik', en: 'Scarce Material Prices Rise' },
        body: {
            id: 'Harga bahan baku langka untuk komponen ponselmu melonjak karena pasokan terbatas. Pemasok meminta harga baru mulai bulan depan.',
            en: 'Prices of scarce raw materials for your phone components jump on tight supply. Suppliers want new prices starting next month.'
        },
        choices: [
            {
                id: 'contract', cost: 6000,
                label: { id: 'Kunci harga lewat kontrak jangka panjang', en: 'Lock in prices with a long-term contract' },
                outcome: { id: 'Harga terkunci dan biaya produksimu tetap bisa diprediksi.', en: 'Prices are locked and your production costs stay predictable.' },
                effects: {}
            },
            {
                id: 'substitute', cost: 1500,
                label: { id: 'Ganti ke bahan alternatif', en: 'Switch to alternative materials' },
                risk: {
                    p: 0.5,
                    success: {
                        outcome: { id: 'Bahan alternatif bekerja baik tanpa mengurangi kualitas.', en: 'The alternative materials work well without hurting quality.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Kualitas bahan alternatif menurun dan pembeli menyadarinya.', en: 'The alternative materials are lower in quality and buyers notice.' },
                        effects: { reputation: -3, demand: [{ scope: 'all', mult: 0.93, days: 60 }] }
                    }
                }
            },
            {
                id: 'absorb', cost: 0,
                label: { id: 'Serap kenaikan harga', en: 'Absorb the price rise' },
                risk: {
                    p: 0.4,
                    success: {
                        outcome: { id: 'Harga bahan turun lagi sebelum biayanya terasa.', en: 'Material prices drop again before the cost is felt.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Biaya produksi membengkak dan margin tergerus.', en: 'Production costs balloon and margins erode.' },
                        effects: { cash: -12000, reputation: -1 }
                    }
                }
            }
        ]
    },
    // ---------------------------------------------------------------- P4 tahap 4: regulasi, keamanan & tren modern (2012+)
    {
        id: 'dyn_charger_regulation', kind: 'dynamic',
        minYear: 2012, maxYear: 2050, weight: 1, cooldownMonths: 24, when: 'selling',
        title: { id: 'Regulasi Standar Pengisi Daya', en: 'Charger Standard Regulation' },
        body: {
            id: 'Regulator mewajibkan satu standar pengisi daya untuk semua ponsel yang dijual. Lini ponselmu perlu menyesuaikan dalam waktu dekat.',
            en: 'A regulator mandates a single charger standard for all phones on sale. Your lineup must adapt soon.'
        },
        choices: [
            {
                id: 'adopt', cost: 7000,
                label: { id: 'Ikut standar baru sejak awal', en: 'Adopt the new standard right away' },
                outcome: { id: 'Kamu siap lebih awal dan dipuji sebagai produsen yang taat aturan.', en: 'You are ready early and praised as a compliant maker.' },
                effects: { reputation: 2 }
            },
            {
                id: 'dual', cost: 3000,
                label: { id: 'Sediakan adaptor untuk dua versi', en: 'Offer adapters for both versions' },
                risk: {
                    p: 0.6,
                    success: {
                        outcome: { id: 'Adaptor ganda diterima pembeli dan masa transisi berjalan mulus.', en: 'Buyers accept the dual adapters and the transition goes smoothly.' },
                        effects: { demand: [{ scope: 'all', mult: 1.03, days: 60 }] }
                    },
                    fail: {
                        outcome: { id: 'Adaptor ganda membingungkan pembeli dan menimbulkan keluhan.', en: 'The dual adapters confuse buyers and trigger complaints.' },
                        effects: { reputation: -1 }
                    }
                }
            },
            {
                id: 'resist', cost: 0,
                label: { id: 'Tolak dan pertahankan standar lamamu', en: 'Refuse and keep your old standard' },
                risk: {
                    p: 0.4,
                    success: {
                        outcome: { id: 'Regulator memberi keringanan dan kamu lolos tanpa biaya.', en: 'The regulator grants an exemption and you pass at no cost.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Kamu terkena sanksi dan pembeli kecewa karena pengisi dayamu tak kompatibel.', en: 'You are sanctioned and buyers are upset that your charger is incompatible.' },
                        effects: { cash: -5000, demand: [{ scope: 'all', mult: 0.9, days: 120 }] }
                    }
                }
            }
        ]
    },
    {
        id: 'dyn_ransomware', kind: 'dynamic',
        minYear: 2016, maxYear: 2050, weight: 0.6, cooldownMonths: 30, when: 'selling',
        title: { id: 'Serangan Ransomware pada Sistem Internal', en: 'Ransomware Hits Internal Systems' },
        body: {
            id: 'Sistem internalmu terkunci oleh ransomware. Data produksi dan penjualan tak bisa dibuka, dan penyerang menuntut tebusan.',
            en: 'Your internal systems are locked by ransomware. Production and sales data cannot be opened, and the attackers demand a ransom.'
        },
        choices: [
            {
                id: 'restore', cost: 9000,
                label: { id: 'Pulihkan dari cadangan dan audit total', en: 'Restore from backups and run a full audit' },
                outcome: { id: 'Sistem pulih tanpa membayar tebusan dan keamanan diperketat.', en: 'Systems are restored without paying a ransom and security is tightened.' },
                effects: {}
            },
            {
                id: 'partial', cost: 3000,
                label: { id: 'Pulihkan sebagian dan isolasi sistem', en: 'Restore partially and isolate systems' },
                risk: {
                    p: 0.6,
                    success: {
                        outcome: { id: 'Isolasi berhasil menahan penyebaran dan operasi pulih bertahap.', en: 'Isolation stops the spread and operations recover in stages.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Serangan menyebar dan sebagian data hilang permanen.', en: 'The attack spreads and some data is lost permanently.' },
                        effects: { cash: -15000, reputation: -3 }
                    }
                }
            },
            {
                id: 'slow', cost: 0,
                label: { id: 'Pulihkan perlahan tanpa bantuan luar', en: 'Recover slowly without outside help' },
                risk: {
                    p: 0.3,
                    success: {
                        outcome: { id: 'Tim internal berhasil memulihkan sistem dengan sedikit gangguan.', en: 'The internal team restores systems with little disruption.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Pemulihan berlarut-larut. Operasi terhenti dan pelanggan menunggu lama.', en: 'Recovery drags on. Operations halt and customers wait a long time.' },
                        effects: { cash: -25000, reputation: -5, demand: [{ scope: 'all', mult: 0.85, days: 120 }] }
                    }
                }
            }
        ]
    },
    {
        id: 'dyn_trade_tariff', kind: 'dynamic',
        minYear: 2018, maxYear: 2050, weight: 1, cooldownMonths: 24, when: 'selling',
        title: { id: 'Tarif Impor Komponen Naik', en: 'Component Import Tariffs Rise' },
        body: {
            id: 'Pemerintah menaikkan tarif impor untuk komponen ponsel. Biaya bahan dari luar negeri akan naik mulai kuartal depan.',
            en: 'The government raises import tariffs on phone components. The cost of imported parts will climb from next quarter.'
        },
        choices: [
            {
                id: 'absorb', cost: 5000,
                label: { id: 'Serap tarif dan jaga harga', en: 'Absorb the tariff and hold prices' },
                outcome: { id: 'Harga jualmu tetap dan pembeli menghargai kestabilan itu.', en: 'Your prices hold and buyers appreciate the stability.' },
                effects: { reputation: 1 }
            },
            {
                id: 'local', cost: 2000,
                label: { id: 'Pindah ke pemasok lokal', en: 'Switch to local suppliers' },
                risk: {
                    p: 0.6,
                    success: {
                        outcome: { id: 'Pemasok lokal siap dan biaya kembali terkendali.', en: 'Local suppliers are ready and costs come back under control.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Peralihan pemasok tersendat dan ada biaya tak terduga.', en: 'The supplier switch stalls and unexpected costs appear.' },
                        effects: { cash: -4000, demand: [{ scope: 'all', mult: 0.94, days: 60 }] }
                    }
                }
            },
            {
                id: 'raise', cost: 0,
                label: { id: 'Naikkan harga jual', en: 'Raise selling prices' },
                risk: {
                    p: 0.5,
                    success: {
                        outcome: { id: 'Pembeli menerima kenaikan harga dan margin terjaga.', en: 'Buyers accept the higher prices and margins hold.' },
                        effects: { cash: 5000 }
                    },
                    fail: {
                        outcome: { id: 'Pembeli menolak harga baru dan beralih ke merek lain.', en: 'Buyers reject the new prices and switch to other brands.' },
                        effects: { demand: [{ scope: 'all', mult: 0.92, days: 90 }] }
                    }
                }
            }
        ]
    },
    {
        id: 'dyn_chip_shortage', kind: 'dynamic',
        minYear: 2020, maxYear: 2024, weight: 1, cooldownMonths: 24, when: 'selling',
        title: { id: 'Kelangkaan Cip Global', en: 'Global Chip Shortage' },
        body: {
            id: 'Kelangkaan cip global membuat pasokan prosesor dan cip daya sulit didapat. Pemasok memprioritaskan pelanggan terbesar dan pesananmu tertahan.',
            en: 'A global chip shortage makes processors and power chips hard to get. Suppliers prioritize their biggest customers and your orders are held up.'
        },
        choices: [
            {
                id: 'spot', cost: 9000,
                label: { id: 'Beli cip di pasar spot dengan harga tinggi', en: 'Buy chips on the spot market at a premium' },
                outcome: { id: 'Pasokan terjaga dan produksimu tetap berjalan.', en: 'Supply is secured and your production keeps running.' },
                effects: {}
            },
            {
                id: 'redesign', cost: 3000,
                label: { id: 'Geser prioritas desain ke cip yang tersedia', en: 'Shift design priorities to available chips' },
                risk: {
                    p: 0.6,
                    success: {
                        outcome: { id: 'Desain disesuaikan dan produksi lanjut dengan sedikit kompromi.', en: 'The design is adapted and production continues with minor compromises.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Penyesuaian memakan waktu dan stok di toko menipis.', en: 'The adjustment takes time and store stock runs thin.' },
                        effects: { demand: [{ scope: 'all', mult: 0.9, days: 90 }] }
                    }
                }
            },
            {
                id: 'wait', cost: 0,
                label: { id: 'Tunggu pasokan pulih', en: 'Wait for supply to recover' },
                risk: {
                    p: 0.35,
                    success: {
                        outcome: { id: 'Pasokan pulih lebih cepat dari perkiraan.', en: 'Supply recovers faster than expected.' },
                        effects: {}
                    },
                    fail: {
                        outcome: { id: 'Kelangkaan berlarut dan produksi nyaris berhenti. Ada denda keterlambatan ke toko.', en: 'The shortage drags on and production nearly halts. Late-delivery penalties hit.' },
                        effects: { cash: -8000, demand: [{ scope: 'all', mult: 0.85, days: 120 }] }
                    }
                }
            }
        ]
    },
    {
        id: 'dyn_ai_feature_hype', kind: 'dynamic',
        minYear: 2023, maxYear: 2050, weight: 1, cooldownMonths: 18, when: 'selling',
        title: { id: 'Demam Fitur AI', en: 'AI Feature Craze' },
        body: {
            id: 'Semua orang membicarakan fitur AI di ponsel. Pembeli bertanya apakah ponselmu punya, dan pesaing berlomba mengumumkan fitur serupa.',
            en: 'Everyone is talking about AI features on phones. Buyers ask whether yours has any, and rivals race to announce similar features.'
        },
        choices: [
            {
                id: 'build', cost: 9000,
                label: { id: 'Kembangkan fitur AI buatan sendiri', en: 'Build your own AI features' },
                outcome: { id: 'Fitur AI-mu jadi nilai jual dan pembeli antusias.', en: 'Your AI features become a selling point and buyers are excited.' },
                effects: { demand: [{ scope: 'all', mult: 1.08, days: 60 }] }
            },
            {
                id: 'partner', cost: 3000,
                label: { id: 'Integrasi layanan AI pihak ketiga', en: 'Integrate a third-party AI service' },
                risk: {
                    p: 0.6,
                    success: {
                        outcome: { id: 'Integrasi cepat selesai dan fiturnya diterima baik.', en: 'The integration ships quickly and the features are well received.' },
                        effects: { demand: [{ scope: 'all', mult: 1.04, days: 45 }] }
                    },
                    fail: {
                        outcome: { id: 'Fiturnya dinilai sekadar gimmick dan citramu sedikit turun.', en: 'The features are seen as a mere gimmick and your image dips.' },
                        effects: { reputation: -2 }
                    }
                }
            },
            {
                id: 'core', cost: 0,
                label: { id: 'Fokus pada kualitas inti ponsel', en: 'Focus on core phone quality' },
                outcome: { id: 'Kamu menolak ikut tren dan pembeli setia menghargai fokusmu.', en: 'You skip the trend and loyal buyers appreciate your focus.' },
                effects: { reputation: 1 }
            }
        ]
    }
];

export function getDynamicEventById(id) {
    for (var i = 0; i < DYNAMIC_EVENTS.length; i++) if (DYNAMIC_EVENTS[i].id === id) return DYNAMIC_EVENTS[i];
    return null;
}

function _scaleFx(fx, s) {
    if (!fx) return fx;
    var o = {};
    for (var k in fx) o[k] = fx[k];
    if (typeof fx.cash === 'number') o.cash = _nice(fx.cash * s);
    return o;
}

function _nice(v) {
    var sign = v < 0 ? -1 : 1, a = Math.abs(v);
    var step = a >= 100000 ? 1000 : 100;
    return sign * Math.round(a / step) * step;
}

// Salinan event dengan biaya & kas diskalakan ukuran bisnis (scale >= 1). Fungsi murni.
export function resolveDynamicEvent(def, scale) {
    var s = Math.max(1, Number(scale) || 1);
    var out = {};
    for (var k in def) out[k] = def[k];
    out.scale = s;
    out.choices = def.choices.map(function (ch) {
        var c = {};
        for (var k in ch) c[k] = ch[k];
        c.cost = ch.cost > 0 ? _nice(ch.cost * s) : 0;
        if (ch.effects) c.effects = _scaleFx(ch.effects, s);
        if (ch.risk) {
            c.risk = {
                p: ch.risk.p,
                success: { outcome: ch.risk.success.outcome, effects: _scaleFx(ch.risk.success.effects, s) },
                fail: { outcome: ch.risk.fail.outcome, effects: _scaleFx(ch.risk.fail.effects, s) }
            };
        }
        return c;
    });
    return out;
}
