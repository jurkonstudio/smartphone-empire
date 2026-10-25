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
